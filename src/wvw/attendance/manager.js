import { EmbedBuilder } from 'discord.js';
import { CrimsonBlackout } from '../../discord/ids.js';
import { WvWScheduler } from '../wvwraidscheduler.js';
import { info, error, format, LogOptions } from '../../logger.js'
import * as CombatAttendance from '../attendance/combatlogattendance.js';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration.js';
import timezone from 'dayjs/plugin/timezone.js';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import { DiscordManager } from '../../discord/manager.js';
import { getSignupForDate } from './eventsignups.js';
import { settings } from '../../util.js';
import { VoiceAttendence } from './voiceattendence.js';
import CombatMember from './models/combatmember.js';
import AttendanceMember from './models/attendencemember.js';

dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.extend(timezone); 

function infoLog(msg, options=LogOptions.ConsoleOnly ) {
    info( `${format.module(AttendanceManager.Name)} ${msg}`, options );
}

export class AttendanceManager {

    static ATTENDANCE_CHANNEL = CrimsonBlackout.CHANNEL_ATTENDANCE.description;
    static HOURS_AFTER_RAID = settings.attendance.manager.reportDelayHours;

    static get Name(){ return 'AttendanceManager'}

    static initialize() {
        info(`[Module Registered] ${ format.highlight(this.Name)}` );
        const { next, diff } = AttendanceManager.nextScheduleRun;
        setTimeout(AttendanceManager.ReportAttendance, diff, next.start );
    }

    static get nextScheduleRun() {
        let next = WvWScheduler.nextRaid();  
        let afterRaid = next.end.add(this.HOURS_AFTER_RAID, 'hours');
        let diff = afterRaid.diff(dayjs().tz("America/New_York"));
        infoLog(`Next check in ${dayjs.duration(diff, 'milliseconds').humanize()} [${afterRaid.format('dddd, MMMM D, YYYY - HH:mm')}]`);
        return { next, diff };
    }

    static async ReportAttendance( date, executeOnlyOnce = false ) {
        try {
            let now = dayjs(date) || dayjs().tz("America/New_York");
            infoLog(`Reporting Attendance for ${ now.format('dddd, MMMM D, YYYY') }`, LogOptions.All);

            //Get data
            let combat  = await CombatAttendance.takeAttendnce( now );
            let voice   = await VoiceAttendence.getAttendenceRecords( now );
            let signups = await getSignupForDate( now );
            
            //Merge 
            let { members, nicknames} = AttendanceManager.extractFoundMembersFromNicknameOnly( combat, voice, signups );

            // Report
            if( members.length > 0 || nicknames.length > 0 ){
                let messages = await AttendanceManager.createMessages( now, members, nicknames, voice.minBetweenCheck );
                for( let msg of messages ){
                    if( msg ) {
                        const channel = await DiscordManager.Client.channels.fetch(AttendanceManager.ATTENDANCE_CHANNEL)
                        await channel.send({
                            content: msg.content,
                            embeds: msg.embeds
                        });
                    }
                }
            }
            else{
                DiscordManager.Client.channels.cache.get(AttendanceManager.ATTENDANCE_CHANNEL)
                    .send({ content: `There was no attendance data for <t:${ dayjs(now).unix() }>`})
            }

            // Sleep
            if( !executeOnlyOnce ) {
                const { next, diff } = AttendanceManager.nextScheduleRun;
                setTimeout(AttendanceManager.ReportAttendance, diff, next );
            }
        }
        catch( err ) {
            error( "Attendance Reporting Failed!", LogOptions.ConsoleOnly );
            error( err );
        }
    }

    /**
     * @param {Array<CombatMember>} combat 
     * @param {Array} voice 
     * @param {Array} signups 
     * @returns { members:{Array<AttendanceMember>}, nicknames:Array<{name:string,count:int}> }
     */
    static extractFoundMembersFromNicknameOnly( combat, voice, signups ){

        /** @type {{Object.<string, AttendanceMember>}} */
        let members = {};
        let nicknames = [];

        combat.forEach( cm =>{
            if( cm && cm.gw2Id ){
                members[ cm.gw2Id.toLowerCase() ] = AttendanceMember.FromCombatMember(cm);
            }
        });

        voice.players.forEach( v => {
            let id = v.gw2Id?.toLowerCase();
            if( id ){
                if( !(id.toLowerCase() in members)) {
                    members[id] = new AttendanceMember( id );
                }
                members[id].discordId = v.name;
                members[id].voiceCount = v.count;
            }
        });

        nicknames = voice.players
                        .filter( _ => _.gw2Id === undefined )
                        .map( _ => { return { discordId: _.name, voiceCount: _.count } });

        members = Object.values(members);
        members.forEach( m => m['signedUp'] = signups.some( s => s.toLowerCase() === m.gw2Id ) );
        members.sort( (a,b) => a.gw2Id.localeCompare( b.gw2Id ) );
        nicknames.sort( (a,b) => a.discordId.localeCompare( b.discordId ) );

        return { members, nicknames };
    }
    
    static async createMessages( date, members, nicknames, timeBetweenRollCallChecks ) {
        
        const guild = DiscordManager.Client.guilds.cache.get(CrimsonBlackout.GUILD_ID.description);

        const buttholeEmoji  = guild.emojis.cache.find( e => e.name === 'butthole' );

        let embeds = [];

        let gw2ids_count = 0;
        let gw2ids = [];

        let combatData_count = 0;
        let combatData = [];

        let tsData_count = 0;
        let tsData = [];

        const max_variable_length = 1024 - 50;
        const battleCount = Math.max( ...members.map( m => m.battles || 0));

        for( let i = 0; i < members.length; i++ )//members.length
        {
            //data from member
            const index = i < 10 ? `0${i}` : i ;
            const member = members[i];
            const { gw2Id, discordId, signedUp, battles, voiceCount } = member;
            
            gw2ids.push( gw2Id );
            gw2ids_count += gw2Id.length + 1;

            //Combat
            //Due to the message limit and high signup count, emoji ids too long.
            //const emojiName = await getEmoji( profession, elite_spec ); 
            //const emoji = guild.emojis.cache.find(e => e.name === emojiName);
            const battleEmoji = '🏰';
            const voiceEmoji  = '🔊';

            const signupEmoji = signedUp ? '✅' : ':x:';
            let combatParticipation = `${signupEmoji}| `;
            if( gw2Id ){  
                combatParticipation += `${battleEmoji}`;

                const percentParticipation = (100*battles/battleCount).toFixed();
                if( isNaN(percentParticipation) ) {
                    combatParticipation += '--';
                }else{
                    combatParticipation += ` ${percentParticipation}%${percentParticipation < 100 ? ' ' : ''}`;
                }
                
            }
            else{
                combatParticipation += `${ voiceCount > 0 ? voiceEmoji : battleEmoji }     `;
            }
            combatData.push(combatParticipation);
            combatData_count += combatParticipation.length + 1;
            
            //Teamspeak
            let teamspeakData = '';
            if( !discordId || !voiceCount || voiceCount === 0 ){
                teamspeakData = `${buttholeEmoji}`;
            }else{
                const minutes = voiceCount * timeBetweenRollCallChecks;
                teamspeakData = `${minutes} mins`;
            }
            tsData.push(teamspeakData);
            tsData_count += teamspeakData.length + 1;

            if( gw2ids_count >= max_variable_length || combatData_count >= max_variable_length || tsData_count >= max_variable_length )
            {
                embeds.push(new EmbedBuilder()
                    .setColor(0xFFFF8F)
                    .setTitle(`PACK Member Attendance`)
                    .setDescription(`There were **${isNaN(battleCount) ? 'no': battleCount}** battles recorded in #wvw-logs. GW2 ID's pulled from combat logs or lookup from discord username in PACK roster.`)
                    .setThumbnail('https://assets.hardstuck.gg/uploads/Catmander_tag_yellow.png')
                    .addFields(
                        { name: 'Guildwars 2 ID', value: gw2ids.join('\n'), inline: true },
                        { name: 'Signup | Battles', value: combatData.join('\n'), inline: true },
                        { name: 'Time in Voice', value: tsData.join('\n'), inline: true }
                ));

                gw2ids_count = 0;
                gw2ids = [];        
                combatData_count = 0;
                combatData = [];        
                tsData_count = 0;
                tsData = [];
            }
        }

        if( gw2ids.length > 0 ){            
            embeds.push(new EmbedBuilder()
                .setColor(0xFFFF8F)
                .setTitle(`PACK Member Attendance`)
                .setDescription(`There were ${isNaN(battleCount) ? 'no': battleCount} battles recorded in #wvw-logs. GW2 ID's pulled from combat logs or lookup from discord username in PACK roster.`)
                .setThumbnail('https://assets.hardstuck.gg/uploads/Catmander_tag_yellow.png')
                .addFields(
                    { name: 'Guildwars 2 ID', value: gw2ids.join('\n'), inline: true },
                    { name: 'Signup | Battles', value: combatData.join('\n'), inline: true },
                    { name: 'Time in Voice', value: tsData.join('\n'), inline: true }
            ));
        }

        //Nickname Embeds:
        let nicknameData_count = 0;
        let nicknameData = [];
        tsData_count = 0;
        tsData = [];
        for( let i = 0; i < nicknames.length; i++) {
            let nickname = nicknames[i];
            nicknameData.push( nickname.discordId)
            nicknameData_count += nickname.discordId.length + 1;

            const minutes = nickname.voiceCount * timeBetweenRollCallChecks;
            let teamspeakData = `${minutes} mins`;
            tsData.push( teamspeakData );
            tsData_count += teamspeakData.length + 1;


            if( nicknameData_count >= max_variable_length ||  tsData_count >= max_variable_length )
            {
                embeds.push(new EmbedBuilder()
                    .setColor(0x007FFF)
                    .setTitle(`Voice Comms Attendance`)
                    .setDescription(`These people were only found on voice, and could not be matched to a GW2ID. Register and update the PACK doc!`)
                    .setThumbnail('https://cdn3.emoji.gg/emojis/6322-channel-voice.png')
                    .addFields(
                        { name: 'Discord Username', value: nicknameData.join('\n'), inline: true },
                        { name: 'Time in Voice', value: tsData.join('\n'), inline: true }
                ));
                nicknameData_count = 0;
                nicknameData = [];
                tsData_count = 0;
                tsData = [];
            }
        }
        if( nicknameData.length > 0){
            embeds.push(new EmbedBuilder()
                .setColor(0x007FFF)
                .setTitle(`Voice Comms Attendance`)
                .setDescription(`These people were only found on voice, and could not be matched to a GW2ID. Register and update the PACK doc!`)
                .setThumbnail('https://cdn3.emoji.gg/emojis/6322-channel-voice.png')
                .addFields(
                    { name: 'Discord Username', value: nicknameData.join('\n'), inline: true },
                    { name: 'Time in Voice', value: tsData.join('\n'), inline: true }
            ));
        }


        let messages = [];
        do {
            messages.push( { content: '', embeds: embeds.splice(0,3) });
        }while( embeds.length > 0);
        messages[0].content = `# Attendance for <t:${dayjs(date).unix()}:D>`;
        return messages;
    }

}