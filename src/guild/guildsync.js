import dayjs from 'dayjs';
import duration     from 'dayjs/plugin/duration.js';
import { settings } from '../util.js';
import { error, format, debug, info, warn } from '../logger.js';
import { gw2 } from '../resources/gw2api/api.js';
import { DiscordManager } from '../discord/manager.js';
import { CrimsonBlackout } from '../discord/ids.js';
import { db, guilds, registrations } from '../resources/mongodb.js';
import { GuildMember } from '../resources/gw2api/v2/models/guildmember.js';
import _ from 'lodash';
dayjs.extend(duration);

/**
 * @typedef {Object} SettingsGuild 
 * @property {String} id
 * @property {String} name
 * @property {String} tag
 * @property {String} color
 * @property {boolean} includeRankRoles
 */

const MINUTES_BETWEEN_CHECKS = settings.guildsync.checkTimeoutMins * 60 * 1000;

function infoLog(msg, saveToLog=false, writeToDiscord = false ) {
    info( `${format.module(GuildSync.Name)} ${msg}`, saveToLog, writeToDiscord );
}

function warnLog(msg, saveToLog=false, writeToDiscord = false ) {
    warn( `${format.module(GuildSync.Name)} ${msg}`, saveToLog, writeToDiscord );
}

export class GuildSync {

    static get Name() { return 'GuildSync' };

    static initalize() {
        info(`[Module Registered] ${ format.highlight(this.Name) }`);
        setTimeout( GuildSync.sync, MINUTES_BETWEEN_CHECKS );
    }

    static async sync( guildTag = null, executeOnce = false ) {
        infoLog("Performing Guild Sync", true, true);
        const currentToken = gw2.apikey;
        try {
            gw2.apikey = process.env.GW2_API_TOKEN_PYCACHU;
            let guilds = settings.guildsync.guilds;
            if( guildTag ) {
                guilds = guilds.filter( g => g.tag === guildTag);
            }
            for( let guild of guilds ) {
                infoLog(`Processing Guild ${guild.name} [${guild.tag}] ${guild.id}`, true, true);
                if( guild.includeRankRoles ) {
                    let ranks = await gw2.guild.ranks( guild.id );
                    ranks.sort( (a,b) => a.order - b.order);
                    await GuildSync.syncRoles( guild, ranks );
                }
                let roster = await gw2.guild.members ( guild.id );
                await GuildSync.syncMembers( guild, roster );
            }
        }
        catch( err ) { 
            error(err); 
        }
        finally {
            gw2.apikey = currentToken;
        }
        if( !executeOnce) {
            infoLog(`Sync Complete. Checking again in ${ dayjs.duration(MINUTES_BETWEEN_CHECKS,'milliseconds').humanize() }`, false);   
            setTimeout( GuildSync.sync, MINUTES_BETWEEN_CHECKS );
        }
    }

    /**
     * @param {SettingsGuild} guild 
     * @param {*} ranks 
     */
    static async syncRoles( guild, ranks ) {
        const discordGuild = await DiscordManager.Client.guilds.fetch( CrimsonBlackout.GUILD_ID.description );
        const discordRoles = discordGuild.roles.cache;

        if( guild.includeRankRoles){
            for( let rank of ranks ){
                let roleName = `${guild.tag} - ${rank.id}`;
                let rankRole = discordRoles.find( _ => _.name === roleName);
                if( !rankRole ){
                    infoLog(`Creating role \`${roleName}\``, true, true);
                    await discordGuild.roles.create({
                        name: roleName,
                        color: guild.color,
                        reason: 'Guild Sync adding role from in-game'
                    });
                }
            }
        }
        //TODO: If wanted, add deleting of roles not found anymore.
    }

    static async syncMember( gw2Id ){
        const currentToken = gw2.apikey;
        try {
            gw2.apikey = process.env.GW2_API_TOKEN_PYCACHU;
            let guilds = settings.guildsync.guilds;
            for( let guild of guilds ) {
                infoLog( `Syncing ${format.highlight(`[${ guild.tag}] ${guild.name}`)}`, true, false);
                let ranks = await gw2.guild.ranks( guild.id );
                ranks.sort( (a,b) => a.order - b.order);
                let roster = await gw2.guild.members ( guild.id );
                roster = roster.filter( _ => _.name === gw2Id );
                await GuildSync.syncMembers( guild, roster, ranks );
            }
        }
        catch( err ) { 
            error(err); 
        }
        finally {
            gw2.apikey = currentToken;
        }
    }

    /**
     * @param {SettingsGuild} guild 
     * @param {Arrya<GuildMember>} roster
     */
    static async syncMembers( guild, roster ){
        const discordGuild = await DiscordManager.Client.guilds.fetch( CrimsonBlackout.GUILD_ID.description );
        const discordMembers = await discordGuild.members.fetch();
        const discordRoles = discordGuild.roles.cache;
        const guildRole = discordRoles.find( _ => _.name === guild.tag );
        let guildRoster = roster.map( _ => {_.guildId = guild.id; return _;} );
        
        let missingIds= await missingIdsFromLastSync(guild, guildRoster);
        

        //Purge old members
        for( let missingId of missingIds ){
            try{
                let registeredUser = await registrations.findOne({ gw2Id: missingId });
                if( registeredUser ){
                    let discordId = registeredUser.discordId;
                    let discordUser = discordMembers.find( _ => _.user.username === discordId);
                    let guildDiscordRoles = discordRoles.find( _ => _.name.startsWith(guild.tag));
                    if( guildDiscordRoles){
                        for( const guildDiscordRole of guildDiscordRoles){
                            discordUser.roles.remove( guildDiscordRole );
                            infoLog(`${ format.error('Removing')} role ${ format.hex(guildDiscordRole.hexColor,guildDiscordRole.name) } from ${ format.highlight(discordId)}. GW2Id: ${missingId} no longer on roster `, true , true );
                        }
                    }
                }
            }catch(err){
                error(err);
            }
        }

        //Update current members

        //Purge last sync data
        await db.collection('guildsync').deleteMany({ guildId: guild.id });
        
        for( let member of guildRoster ){
            await db.collection('guildsync').insertOne( member );
            try{
                let registeredUser = await registrations.findOne( { gw2Id: member.name } );
                if( registeredUser ) {
                    //infoLog(`Syncing User [${guild.tag}] ${ format.highlight(`${member.name}`) }`);
                    let discordId = registeredUser.discordId;
                    let discordUser = discordMembers.find( _ => _.user.username === discordId);

                    if( discordUser ) {

                        let userRoles = discordUser.roles.cache;

                        //Ensure Guild Tag Role
                        if( !userRoles.find( _ => _.name === guild.tag ) ){
                            await discordUser.roles.add( guildRole );
                            infoLog(`${ format.success('Adding')} role ${ format.hex(guild.color,guild.tag) } to ${ format.highlight(discordId) }`, true , true );
                        }

                        if( !guild.includeRankRoles ) continue;

                        //current Rank
                        let currentRankRoleName = `${guild.tag} - ${member.rank}`;                        
                        let guildRankRoles = discordRoles.filter( _ => _.name.startsWith(`${guild.tag} -`) );

                        //Find all Role Ranks that don't apply to this guild anymore, and remove it
                        let rolesToRemove = guildRankRoles.filter( _ => _.name !== currentRankRoleName );
                        for( const removeRole of  rolesToRemove.values() ){
                            if(userRoles.find( dur => removeRole.name ===dur.name)) {
                                await discordUser.roles.remove(removeRole);
                                infoLog(`${format.error('Removing')} role ${format.hex(removeRole.hexColor, removeRole.name)} from ${discordId}`, true, true );
                            }
                        }
                        
                        //add role if user doesn't currently have the rank
                        const discordRankRole = discordRoles.find( _ => _.name === currentRankRoleName);
                        const userDiscordRankRole = userRoles.find( _ => _.name === currentRankRoleName );
                        if( !userDiscordRankRole ){
                            await discordUser.roles.add( discordRankRole );
                            infoLog(`${ format.success('Adding')} role ${format.hex(discordRankRole.hexColor, discordRankRole.name)} role ${ currentRankRoleName } to ${ discordId }`, true , true );
                        }
                    } else {
                        warnLog(`Failed to sync ${ member.name}. Found registration, but couldn't find discord user: ${ discordId }`, true , true)
                    }

                }
            }catch(err){
                error(err, true, true);
            }
        }


    }
}

async function missingIdsFromLastSync( guild, guildRoster ) {
    let lastSyncMembers = await db.collection('guildsync').find({ guildId: guild.id }).toArray();    
    let diff = _.difference( lastSyncMembers.map( _ => _.name ), guildRoster.map( _ => _.name) );    
    return diff;
}


/**
 * 
 * @param {Array<GuildMember>} arr 
 * @param {string} gw2Id 
 * @returns {Array<GuildMember>}
 */
function removeIdFromArr( arr, gw2Id ){
    let index = arr.indexOf( _ => _.name === gw2Id );
    if( index === -1 ) return arr;
    return arr.splice( index, 1 );
}
