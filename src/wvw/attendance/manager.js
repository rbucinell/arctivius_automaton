import { EmbedBuilder } from 'discord.js';
import { CrimsonBlackout } from '../../discord/ids.js';
import { WvWScheduler } from '../wvwraidscheduler.js';
import { info, dinfo, warn, dlog, error} from '../../logger.js'
import * as CombatAttendance from '../attendance/combatlogattendance.js' 
import * as TeamSpeakAttendance from '../attendance/teamspeakattendance.js';
import dayjs from 'dayjs';
import duration     from 'dayjs/plugin/duration.js';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import { DiscordManager } from '../../discord/manager.js';
import { getEmoji } from '../../guild/emojis.js';
dayjs.extend(duration);
dayjs.extend(relativeTime);

export class AttendanceManager {

    static #ATTENDENCE_CHANNEL = CrimsonBlackout.CHANNEL_SECRET_CHANNEL.description; //CrimsonBlackout.CHANNEL_ATTENDANCE.description;
    static #HOURS_AFTER_RAID = 2;

    static initialize() {
        info( 'Attendence Manager Initialized', false);
        let next = AttendanceManager.#nextScheduleRun;        
        let diff = next.diff(dayjs());
        setTimeout(AttendanceManager.ReportAttendence, diff );
    }

    static get #nextScheduleRun() {
        let next = WvWScheduler.nextRaid();
        return next.end.add(this.#HOURS_AFTER_RAID, 'hours');
    }

    static async ReportAttendence( executeOnlyOnce = false ) {
        try {
            info( 'Test Reporting Attendence', false);
            let now = dayjs();

            //Get data
            let combat = await CombatAttendance.takeAttendnce( now );
            let voice = await TeamSpeakAttendance.takeRollCallFor( now );
            
            //Merge 
            let { members, nicknames} = AttendanceManager.#extractFoundMembersFromNicknameOnly( combat, voice );

            // Report
            if( members.length > 0 || nicknames.length > 0 ){
                let messages = await AttendanceManager.#createMessages( now, members, nicknames, voice.minBetweenCheck );
                messages.forEach( msg => {
                    if( msg ) {
                        DiscordManager.Client.channels.cache.get(AttendanceManager.#ATTENDENCE_CHANNEL).send({
                            content: msg.content,
                            embeds: msg.embeds
                        });
                    }
                });
            }
            else{
                DiscordManager.Client.channels.cache.get(AttendanceManager.#ATTENDENCE_CHANNEL)
                    .send({ content: `There was no attendence data for <t:${ dayjs(now).unix() }>`})
            }

            // Sleep
            if( !executeOnlyOnce ) {
                let next = AttendanceManager.#nextScheduleRun;  
                let diff = next.diff(now);
                info(`Next Report in ${next.fromNow()}`)
                setTimeout(AttendanceManager.ReportAttendence, diff );
            }
        }
        catch( err ) {
            error( "Testing New Attendence Reporting Failed!", false );
            error( err, true );
        }
    }

    static #extractFoundMembersFromNicknameOnly( combat, voice ){
        let members = {};
        let nicknames = [];
        for (const c of combat) {
            let id = c.display_name.toLowerCase();
            members[id] = c;
            members[id]['gw2Id'] = id;
        }
        for( const v of voice.players ){
            if( v.gw2Id ) {
                let id = v.gw2Id.toLowerCase();
                if(!members.hasOwnProperty( id ) ){
                    members[id] = { gw2Id: id };
                }
                members[id]['tsName'] = v.name;
                members[id]['rcCount'] = v.count;
            }else{
                v['tsName'] = v.name;
                v['rcCount'] = v.count;
                nicknames.push( v );
            }
        }
        members = Object.values(members);
        members.sort( (a,b) => a.gw2Id.localeCompare( b.gw2Id ) );
        nicknames.sort( (a,b) => a.tsName.localeCompare( b.tsName ) );

        return { members, nicknames };
    }
    
    static async #createMessages( date, members, nicknames, timeBetweenRollCallChecks ) {
        
        const guild = DiscordManager.Client.guilds.cache.get(CrimsonBlackout.GUILD_ID.description);
        const teamspeakEmoji = guild.emojis.cache.find( e => e.name === 'teamspeak' );
        const buttholeEmoji  = guild.emojis.cache.find( e => e.name === 'butthole' );

        let embeds = [];

        let gw2ids_count = 0;
        let gw2ids = [];

        let combatData_count = 0;
        let combatData = [];

        let tsData_count = 0;
        let tsData = [];

        const max_variable_length = 1024 - 50;
        const battleCount = Math.max( ...members.map( m => m.reportCount));

        for( let i = 0; i < members.length; i++ )//members.length
        {
            //data from member
            const index = i < 10 ? `0${i}` : i ;
            const member = members[i];
            const { gw2Id, character_name, display_name, profession, elite_spec, reportCount, rcCount, tsName } = member;
            
            gw2ids.push( display_name );
            gw2ids_count += display_name.length + 1;

            //Combat
            const emojiName = await getEmoji( profession, elite_spec ); 
            const emoji = guild.emojis.cache.find(e => e.name === emojiName);

            const percentParticipation = (100*reportCount/battleCount).toFixed();
            const combatParticipation = `${emoji} ${percentParticipation}%${percentParticipation < 100 ? ' ' : ''}`;
            combatData.push(combatParticipation);
            combatData_count += combatParticipation.length + 1;
            
            //Teamspeak
            let teamspeakData = '';
            if( !tsName || !rcCount || rcCount === 0 ){
                teamspeakData = `${buttholeEmoji}`;
            }else{
                const minutes = rcCount * timeBetweenRollCallChecks;
                teamspeakData = `${ teamspeakEmoji } ${minutes} mins`;
            }
            tsData.push(teamspeakData);
            tsData_count += teamspeakData.length + 1;

            if( gw2ids_count >= max_variable_length || combatData_count >= max_variable_length || tsData_count >= max_variable_length )
            {
                embeds.push(new EmbedBuilder()
                    .setColor(0xFFFF8F)
                    .setTitle(`Combat Log Attendence`)
                    .setDescription(`There were ${battleCount} battles recorded in #wvw-logs`)
                    .setThumbnail('https://assets.hardstuck.gg/uploads/Catmander_tag_yellow.png')
                    .addFields(
                        { name: 'Guildwars 2 ID', value: gw2ids.join('\n'), inline: true },
                        { name: 'Battles', value: combatData.join('\n'), inline: true },
                        { name: 'Time in TS', value: tsData.join('\n'), inline: true }
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
                .setTitle(`Combat Log Attendence`)
                .setDescription(`There were ${battleCount} battles recorded in #wvw-logs`)
                .setThumbnail('https://assets.hardstuck.gg/uploads/Catmander_tag_yellow.png')
                .addFields(
                    { name: 'Guildwars 2 ID', value: gw2ids.join('\n'), inline: true },
                    { name: 'Battles', value: combatData.join('\n'), inline: true },
                    { name: 'Time in TS', value: tsData.join('\n'), inline: true }
            ));
        }

        //Nickname Embeds:
        let nicknameData_count = 0;
        let nicknameData = [];
        tsData_count = 0;
        tsData = [];
        for( let i = 0; i < nicknames.length; i++) {
            let nickname = nicknames[i];
            nicknameData.push( nickname.tsName)
            nicknameData_count += nickname.tsName.length + 1;

            const minutes = nickname.rcCount * timeBetweenRollCallChecks;
            let teamspeakData = `${ teamspeakEmoji } ${minutes} mins`;
            tsData.push( teamspeakData );
            tsData_count += teamspeakData.length + 1;


            if( nicknameData_count >= max_variable_length ||  tsData_count >= max_variable_length )
            {
                embeds.push(new EmbedBuilder()
                    .setColor(0x007FFF)
                    .setTitle(`Teamspeak RollCall Attendence`)
                    .setDescription(`These people were only found on teamspeak, and could not be matched to a GW2ID. Update the PACK doc!`)
                    .setThumbnail('https://discourse-forums-images.s3.dualstack.us-east-2.amazonaws.com/original/2X/2/269d8bb30efc4bdf5c99f1f27c2aeadc1ca2fa5d.png')
                    .addFields(
                        { name: 'Teamspeak Name', value: nicknameData.join('\n'), inline: true },
                        { name: 'Time in TS', value: tsData.join('\n'), inline: true }
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
                .setTitle(`Teamspeak RollCall Attendence`)
                .setDescription(`These people were only found on teamspeak, and could not be matched to a GW2ID. Update the PACK doc!`)
                .setThumbnail('https://discourse-forums-images.s3.dualstack.us-east-2.amazonaws.com/original/2X/2/269d8bb30efc4bdf5c99f1f27c2aeadc1ca2fa5d.png')
                .addFields(
                    { name: 'Teamspeak Name', value: nicknameData.join('\n'), inline: true },
                    { name: 'Time in TS', value: tsData.join('\n'), inline: true }
            ));
        }


        let messages = [];
        
        do {
            messages.push( { content: '', embeds: embeds.splice(0,10) });
        }while( embeds.length > 0);
        messages[0].content = `# Attendence for <t:${dayjs(date).unix()}>`;
        return messages;

        //channel.send({ content: 'hello world', embeds: [exampleEmbed] });

    }

}