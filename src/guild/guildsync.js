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

    static #rosters = {};
    static #ranks = {};

    static getRosters ( guildId ) {
        GuildSync.#rosters[guildId]
    }

    static setRoster( guildId, roster ){
        GuildSync.#rosters[guildId] = roster;
    }

    static getRanks () {
        GuildSync.#ranks[guildId]
    }

    static setRanks( guildId, ranks ){
        GuildSync.#ranks[guildId] = ranks;
    }

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
                await GuildSync.setRanks( guild.id, ranks );
                await GuildSync.setRoster( guild.id, roster );
            }
        }
        catch( err ) { 
            error(err); 
        }
        finally {
            gw2.apikey = currentToken;
        }
    }

    static async syncRoles( guild, ranks ) {
        const discordGuild = await DiscordManager.Client.guilds.fetch( CrimsonBlackout.GUILD_ID.description );
        const discordRoles = discordGuild.roles.cache;

        for( let rank of ranks ){
            let roleName = `${guild.tag} - ${rank.id}`;
            let rankRole = discordRoles.find( _ => _.name === roleName);
            if( !rankRole ){
                infoLog(`Creating role ${roleName}`, true, true);
                await discordGuild.roles.create({
                    name: roleName,
                    color: guild.color,
                    reason: 'Guild Sync adding role from in-game'
                });
            }
        }
        //TODO: If wanted, add deleting of roles not found anymore.
    }

    static async syncMembers( guild, roster ){
        const discordGuild = await DiscordManager.Client.guilds.fetch( CrimsonBlackout.GUILD_ID.description );
        const discordMembers = await discordGuild.members.fetch();
        const discordRoles = discordGuild.roles.cache;

        for( let member of roster ){
            try{
                infoLog(`Syncing [${guild.tag}]${ member.name }`);
                let gsGuildMember = await getGuildMemberByGW2Id(member.name);
                if( gsGuildMember ){
                    let discordId = gsGuildMember.discordID;
                    let discordUser = discordMembers.find( _ => _.user.username === discordId);
                    
                    if( discordUser ) {
                        let guildRankRoles = discordRoles.filter( _ => _.name === `${guild.tag} -`);
                        let roleName = `${guild.tag} - ${member.rank}`;
                        let addRole = discordRoles.find( _ => _.name === roleName);
                        
                        //Filter down to any roles the user has but is not current rank
                        guildRankRoles = guildRankRoles.filter( _ => _.name !== addRole.name );
                        //Remove those roles
                        for( const r of guildRankRoles ){
                            infoLog(`${format.color('red', 'Removing')} role ${ r.name } from ${ discordId }`, true , true );
                            await discordUser.roles.remove(r);
                        }
                        //Add the new one
                        if( !discordUser.roles.cache.find( _ => _.name === roleName) ) {
                            infoLog(`${ format.color('green', 'Adding')} role ${ roleName } to ${ discordId }`, true , true );
                            await discordUser.roles.add( addRole );
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
