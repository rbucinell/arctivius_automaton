import { info, error, format, LogOptions } from '../../logger.js';
import { CrimsonBlackout } from '../../discord/ids.js';
import { DiscordManager } from '../../discord/manager.js';
import { WvWScheduler } from '../wvwraidscheduler.js';
import { settings } from "../../util.js";
import { getGuildMembersByDiscord } from '../../guild/guildlookup.js';
import { SnowflakeUtil } from 'discord.js';
import { NewDatabaseAttendance } from './newdatabaseattendance.js';

import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration.js';
import timezone from 'dayjs/plugin/timezone.js';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import { registrations } from '../../resources/mongodb.js';

dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.extend(timezone);

const VOICE_CHANNEL  = CrimsonBlackout.CHANNEL_VOICE_PACK_NIGHT.description;
const REPORT_CHANNEL = CrimsonBlackout.CHANNEL_TEAMSPEAK_ROLL_CALL.description;
const MINUTES_BETWEEN_CHECKS = settings.teamspeak.checkTimeoutMins;

function infoLog(msg, options=LogOptions.ConsoleOnly ) {
    info( `${format.module(VoiceAttendence.Name)} ${msg}`, options );
}

export class VoiceAttendence {

    static get Name() { return 'VoiceAttendence' };

    static initialize() {
        info(`[Module Registered] ${ format.highlight(this.Name) }`);
        const { next, diff } = VoiceAttendence.getNextCheckIn();
        setTimeout( VoiceAttendence.takeAttendence, diff );
    }

    static getNextCheckIn() {
        let now = dayjs()
        let next = WvWScheduler.nextRaid();
        let diff = next.start.diff(now);
        if( next.isActive ){
            let periodicCheck = now.add( MINUTES_BETWEEN_CHECKS, 'minutes' );
            diff = periodicCheck.diff(now);
        }
        //Setting minimum time to Minutes_between_checks;
        diff = Math.max( MINUTES_BETWEEN_CHECKS * 60 * 1000, diff );
        infoLog(`Next Check in ${ dayjs.duration(diff,'milliseconds').humanize() }` );
        return { next, diff };
    }

    static get MinutesBetweenChecks() {
        return MINUTES_BETWEEN_CHECKS;
    }

    static async getUsersInVoiceChannel( voiceChannelId = VOICE_CHANNEL) {
        const guild = DiscordManager.Client.guilds.cache.get(CrimsonBlackout.GUILD_ID.description);
        const channel = await guild.channels.fetch(voiceChannelId);
        let users = [...channel.members.values()].map( _ => _.user.username );
        return users;
    }

    static async takeAttendence( exectuteOnce = false ) {
        let users = [];
        try {
            infoLog( 'Initiated Take Attendence' );
            let dar = await NewDatabaseAttendance.record( dayjs(), { voice: true } );
            users = dar.voice.map( v => v.username );
            if( users.length > 0 ){
                infoLog( `Users Found: ${ users.join(', ')}` );
                let msg = `### Voice Attendence taken at <t:${dayjs().unix()}>\n${users.join('\n')}`;
                let channel = await DiscordManager.Client.channels.fetch('1129101579082018886');
                channel.send({ content: msg, embeds: [] });

                //await NewDatabaseAttendance.record( dayjs(), { voice: true } );
            }
            else{
                infoLog(`No Users in voice`);
            }
        } catch( err ) {
            error( err );
        }

        if( !exectuteOnce ) {
            const { next, diff } = VoiceAttendence.getNextCheckIn();
            setTimeout( VoiceAttendence.takeAttendence, diff );
        }
        return users;
    }

    static async getAttendenceRecords( forDate = null ){

        let adr = await NewDatabaseAttendance.report( forDate );
        let voice = adr.voice || [];
        for( let v of voice ){
            let registration = await registrations.findOne({ discordId: v.username });
            if( registration ){
                v.gw2Id = registration.gw2Id;
            }
        }
        return voice;
    }

    /**
     * (For Deprecation Use only) Retrieves voice attendence records from discord
     * @param {Date} [forDate] The date for which the attendence records should be retrieved. Defaults to today.
     * @returns {Promise<{minBetweenCheck: number, players: Array<{name: string, count: number, gw2Id: string}>}>}
     */
    static async getAttendenceRecordsFromDiscord( forDate = null ){
        const guild = DiscordManager.Client.guilds.cache.get(CrimsonBlackout.GUILD_ID.description);
        const channel = guild.channels.cache.get(REPORT_CHANNEL);
        const today = forDate === null ? dayjs() : dayjs(forDate);
        infoLog(`Getting voice attendence for ${ today.toDate() }`);
        const messages = await channel.messages.fetch({
            limit: 50,
            around: SnowflakeUtil.generate({ timestamp: today.toDate() })
        });
        
        let players = [];

        for( let msg of messages.values() ){
            let lines = msg.content.split('\n').slice(1);
            let guildMembers = await getGuildMembersByDiscord( lines );

            for( let line of lines ){
                let guildInfo = guildMembers.find( _ => _.discordID === line );
                let found = players.find( p => p.username === line );
                if( !found ) {
                    players.push({ username: line, count: 1, gw2Id: guildInfo?.gw2ID })
                }else{
                    found.count += 1;
                }
            }
        }
        return { minBetweenCheck: MINUTES_BETWEEN_CHECKS, players }  
    }
}
