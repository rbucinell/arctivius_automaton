import * as Sentry from "@sentry/node";
import { EmbedBuilder } from 'discord.js';
import { CrimsonBlackout } from '../../discord/ids.js';
import { WvWScheduler } from '../wvwraidscheduler.js';
import { LogOptions } from '../../logger.js'
import * as CombatAttendance from '../attendance/combatlogattendance.js';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration.js';
import timezone from 'dayjs/plugin/timezone.js';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import { DiscordManager } from '../../discord/manager.js';
import { SignupAttendance } from './signupattendance.js';
import { compareToCaseInsensitive, settings } from '../../util.js';
import { VoiceAttendence } from './voiceattendence.js';
import CombatMember from './models/combatmember.js';
import AttendanceMember from './models/attendencemember.js';
import VoiceMember from './models/voicemember.js';
import { Module } from '../../modules/module.js';
import { NewDatabaseAttendance } from './newdatabaseattendance.js';
import { createCSVReport } from './attendancereport.js';
import path from 'node:path';

dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.extend(timezone); 
export class AttendanceManager extends Module {

    static ATTENDANCE_CHANNEL = CrimsonBlackout.CHANNEL_ATTENDANCE.description;
    static HOURS_AFTER_RAID = settings.attendance.manager.reportDelayHours;
    static GW2_PATTERN = /\w+\s*\w+\.\d{4}/;

    static getNextExecute() {
        const { next, diff } = AttendanceManager.nextScheduleRun;
        return diff;
    }

    static get nextScheduleRun() {
        let next = WvWScheduler.nextRaid();  
        let afterRaid = next.end.add(this.HOURS_AFTER_RAID, 'hours');
        let diff = afterRaid.diff(dayjs().tz("America/New_York"));
        return { next, diff };
    }

    static async execute( args ) {
        await AttendanceManager.ReportAttendance( ... args );
    }

    static async ReportAttendance( date, executeOnlyOnce = false, report = false ) {

        await Sentry.startSpan({ name: 'ReportAttendance', attributes: { date, executeOnlyOnce, report}}, async ()=> {
            try {
                let now = dayjs(date) || dayjs().tz("America/New_York");
                now = now.hour(20).minute(30); //we always run at this time, so making sure conversion to diff timezone shows wrong date at 00:00
                this.info(`Reporting Attendance for ${ now.format('dddd, MMMM D, YYYY') }`, LogOptions.All);

                const dar = await NewDatabaseAttendance.report( now );

                this.info(`NewDatabaseAttendance: ${JSON.stringify( dar )}`, LogOptions.All);
                
                this.info(`dar.combat is null or empty: ${dar.combat === undefined || dar.combat === null || dar.combat.length === 0}`, LogOptions.LocalOnly);
                this.info(`dar.voice is null or empty: ${dar.voice === undefined || dar.voice === null || dar.voice.length === 0}`, LogOptions.LocalOnly);
                this.info(`dar.signups is null or empty: ${dar.signups === undefined || dar.signups === null || dar.signups.length === 0}`, LogOptions.LocalOnly);

                let combat = dar.combat || await CombatAttendance.takeAttendnce( now );
                let voice = dar.voice || await VoiceAttendence.getAttendenceRecords( now );
                let signups = dar.signups || await SignupAttendance.getSignupsFromDiscord( now );

                let noshows = AttendanceManager.noShowsFromLists( combat, voice, signups );

                //Merge 
                let { members, nicknames} = AttendanceManager.extractFoundMembersFromNicknameOnly( combat, voice, signups );

                this.info( `Found ${ members.length } members and ${ nicknames.length } nicknames`, LogOptions.LocalOnly );

                // Report
                if( members.length > 0 || nicknames.length > 0 ){
                    let messages = await AttendanceManager.createMessages( now, members, nicknames, noshows, VoiceAttendence.MinutesBetweenChecks );
                    this.info( `Sending ${ messages.length } messages`, LogOptions.LocalOnly );

                    if( report.value ){
                        let reportPath = await createCSVReport( now.month()+1, now.year() );
                        if( reportPath ) {

                            let msg = messages[ messages.length - 1 ];
                            msg.files = [{ attachment: reportPath, name: path.parse( reportPath ).base }];
                        }
                    }

                    for( let msg of messages ){
                        if( msg ) {
                            const channel = await DiscordManager.Client.channels.fetch(AttendanceManager.ATTENDANCE_CHANNEL)
                            await channel.send({
                                content: msg.content,
                                embeds: msg.embeds,
                                files: msg.files || []
                            });
                            this.info( `Sent Message`, LogOptions.LocalOnly );
                        }
                    }
                }
                else{
                    DiscordManager.Client.channels.cache.get(AttendanceManager.ATTENDANCE_CHANNEL)
                        .send({ content: `There was no attendance data for <t:${ dayjs(now).unix() }>`})
                }

                
            }
            catch( err ) {
                this.error( "Attendance Reporting Failed!", LogOptions.All );
                this.error( err );
            }

            // Sleep
            if( !executeOnlyOnce ) {
                const { next, diff } = AttendanceManager.nextScheduleRun;
                this.info( `Next run in ${ JSON.stringify( next) }`, LogOptions.LocalOnly );
                this.info( `In ${diff} ms`, LogOptions.LocalOnly );
                console.log( 'not execute once', next.start);
                this.awaitExecution( next.start );
            }
        });
    }

    static async ReportUserAttendanceForMonth( gw2Id ) {
        const end = dayjs().tz("America/New_York");
        const start = dayjs().startOf("month");
        let presense = [];
        await Sentry.startSpan( { name:"ReportUserAttendanceForMonth", attributes:{gw2Id,start,end}}, async ()=> {

            for( let date = start; date.isBefore(end); date = date.add(1, "day") ){

                const isRaidDay =   WvWScheduler.isRaidDay( date );
                if( !isRaidDay ) continue;
                
                const record = await NewDatabaseAttendance.report( date.toString("YYYY-MM-DD") );
                if( !record ) continue;

                const userPrensense = {
                    date: record.date,
                    signup: record.signups?.includes( gw2Id ) == true,
                    combat: record.combat?.map( _ => _.gw2Id?.toLowerCase() ?? "" ).includes( gw2Id.toLowerCase() )  == true,
                    voice: record.voice?.map( _ => _.gw2Id?.toLowerCase() ?? "" ).includes( gw2Id.toLowerCase() )== true
                }
                presense.push(userPrensense);
            }
        });  
        return presense;  
    }

    /**
     * Determine a list of no shows
     * @param {Array<CombatMember>} combat 
     * @param {Array} voice 
     * @param {Array} signups 
     * @returns { Array<string> } An array of gw2Ids that signed up but didn't show
     **/
    static noShowsFromLists(combat, voice, signups ){
        let noshows = [...signups];
        noshows = noshows.filter( _ => !voice.find( v => v.gw2Id === _));
        noshows = noshows.filter( _ => !combat.find(c => c.gw2Id === _));
        return noshows;
    }

    /**
     * @param {CombatMember[]} combat 
     * @param {VoiceMember[]} voice 
     * @param {string[]} signups 
     * @returns {{members: AttendanceMember[], nicknames:VoiceMember[]}} The extracted members and nicknames
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

        voice.forEach( v => {
            let id = v.gw2Id?.toLowerCase().replace('. ', '.');
            if( id && this.GW2_PATTERN.test(id) ){
                if( !(id.toLowerCase() in members)) {
                    members[id] = new AttendanceMember( id );
                }
                members[id].username = v.username;
                members[id].voiceCount = v.count;
            }
        });

        nicknames = voice
            .filter( _ => _.gw2Id === undefined || _.gw2Id === null )
            .map( _ => { return new VoiceMember(_.username, _.count) } );

        members = Object.values(members);
        members.forEach( m => m['signedUp'] = signups.some( s => s.toLowerCase() === m.gw2Id ) );
        members.sort( (a,b) => compareToCaseInsensitive(a.gw2Id, b.gw2Id ) );
        nicknames.sort( (a,b) => compareToCaseInsensitive(a.username, b.username));

        return { members, nicknames };
    }
    
    /**
     * Create a list of embeds to send on the attendance channel
     * @param {Date} date The date of the attendance report
     * @param {AttendanceMember[]} members The members to report on
     * @param {VoiceMember[]} nicknames The nicknames to report on
     * @param {string[]} noshows The list of no shows
     * @param {number} timeBetweenRollCallChecks The time between roll call checks
     * @returns {Promise<Message[]>} A list of messages to send to the attendance channel
     */
    static async createMessages( date, members, nicknames, noshows, timeBetweenRollCallChecks ) {
        
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
            const { gw2Id, username, signedUp, battles, voiceCount } = member;
            
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
            if( !username || !voiceCount || voiceCount === 0 ){
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
            nicknameData.push( nickname.username)
            nicknameData_count += nickname.username.length + 1;

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

        //Noshow embeds
        if( noshows && noshows.length > 0 ) {
            embeds.push( new EmbedBuilder()
                .setColor(0xf74545)
                .setTitle('No Shows')
                .setDescription('These players signed up in Aleeva, but never showed up')
                .setThumbnail('https://cdn3.emoji.gg/emojis/1905-enemy-missing-ping.png')
                .addFields( 
                    { name: 'Guild Wars 2 Id', value: noshows.join('\n'), inline: true }
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