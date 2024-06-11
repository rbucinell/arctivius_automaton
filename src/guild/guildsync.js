import dayjs from 'dayjs';
import duration     from 'dayjs/plugin/duration.js';
import timezone from 'dayjs/plugin/timezone.js';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import { settings } from '../util.js';
import { error, format, info, warn } from '../logger.js';
import guild from '../resources/gw2api/v2/guild/guild.js';
import { gw2 } from '../resources/gw2api/api.js';
import { DiscordManager } from '../discord/manager.js';
import { CrimsonBlackout } from '../discord/ids.js';
import { getGuildMemberByGW2Id } from '../guild/guildlookup.js';

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
        setTimeout( GuildSync.startSync, MINUTES_BETWEEN_CHECKS );
    }

    static async startSync() {
        infoLog("Performing Guild Syncs", true, true);
        const currentToken = gw2.apikey;
        try {
            gw2.apikey = process.env.GW2_API_TOKEN_PYCACHU;
            let guilds = settings.guildsync.guilds;
            for( let guild of guilds ) {
                let ranks = await gw2.guild.ranks( guild.id );
                let roster = await gw2.guild.members ( guild.id );
                await GuildSync.syncRoles( guild, ranks );
                await GuildSync.syncMembers( guild, roster );
            }
        }
        catch( err ) { 
            error(err); 
        }
        finally {
            gw2.apikey = currentToken;
        }
        setTimeout( GuildSync.startSync, MINUTES_BETWEEN_CHECKS );
    }

    static async syncRoles( guild, ranks ) {
        const discordGuild = await DiscordManager.Client.guilds.fetch( CrimsonBlackout.GUILD_ID.description );
        const discordRoles = discordGuild.roles.cache;

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
        //TODO: If wanted, add deleting of roles not found anymore.
    }

    static async syncMember( gw2Id ){
        const currentToken = gw2.apikey;
        try {
            gw2.apikey = process.env.GW2_API_TOKEN_PYCACHU;
            let guilds = settings.guildsync.guilds;
            for( let guild of guilds ) {
                let roster = await gw2.guild.members ( guild.id );
                roster = roster.filter( _ => _.name === gw2Id );
                await GuildSync.syncMembers( guild, roster );
            }
        }
        catch( err ) { 
            error(err); 
        }
        finally {
            gw2.apikey = currentToken;
        }
    }

    static async syncMembers( guild, roster ){
        const discordGuild = await DiscordManager.Client.guilds.fetch( CrimsonBlackout.GUILD_ID.description );
        const discordMembers = await discordGuild.members.fetch();
        const discordRoles = discordGuild.roles.cache;

        for( let member of roster ){
            try{
                let gsGuildMember = await getGuildMemberByGW2Id(member.name);
                if( gsGuildMember ){
                    infoLog(`Syncing ${ format.highlight(`[${guild.tag}]${member.name}`) }`);
                    let discordId = gsGuildMember.discordID;
                    let discordUser = discordMembers.find( _ => _.user.username === discordId);

                    if( discordUser ) {
                        let userRoles = discordUser.roles.cache;

                        //Ensure Guild Tag Role
                        if( !userRoles.find( _ => _.name === guild.tag ) ){
                            let guildRole = discordRoles.find( _ => _.name === guild.tag );
                            await discordUser.roles.add( guildRole );
                            infoLog(`${ format.success('Adding')} role ${ guild.tag } to ${ discordId }`, true , true );
                        }

                        //current Rank
                        let currentRankRoleName = `${guild.tag} - ${member.rank}`;                        
                        let guildRankRoles = discordRoles.filter( _ => _.name.startsWith(`${guild.tag} -`) );

                        //Find all Role Ranks that don't apply to this guild anymore, and remove it
                        let rolesToRemove = guildRankRoles.filter( _ => _.name !== currentRankRoleName );
                        for( const removeRole of  rolesToRemove.values() ){
                            if(userRoles.find( dur => removeRole.name ===dur.name)) {
                                await discordUser.roles.remove(removeRole);
                                infoLog(`${format.error('Removing')} ${removeRole.name} role from ${discordId}`, true, true );
                            }
                        }
                        
                        //add role if user doesn't currently have the rank
                        const discordRankRole = discordRoles.find( _ => _.name === currentRankRoleName);
                        const userDiscordRankRole = userRoles.find( _ => _.name === currentRankRoleName );
                        if( !userDiscordRankRole ){
                            await discordUser.roles.add( discordRankRole );
                            infoLog(`${ format.success('Adding')} role ${ currentRankRoleName } to ${ discordId }`, true , true );
                        }

                    } else {
                        warnLog(`Failed to sync ${ member.name}. Found GS data, but couldn't find discord user: ${ discordId }`, true , true)
                    }

                }
            }catch(err){
                error(err, true, true);
            }
        }
    }
}
