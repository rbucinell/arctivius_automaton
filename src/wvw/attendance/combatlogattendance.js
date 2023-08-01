import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration.js';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import { Client, GatewayIntentBits, SnowflakeUtil } from 'discord.js';
dayjs.extend(duration);
dayjs.extend(relativeTime);
import { info, dinfo, warn, error} from '../../logger.js';
import { getEmoji } from '../../guild/emojis.js';
import * as TeamSpeakAttendance from './teamspeakattendance.js';

const urlRegex = /([\w+]+\:\/\/)?([\w\d-]+\.)*[\w-]+[\.\:]\w+([\/\?\=\&\#\.]?[\w-]+)*\/?/gm;
let client = null;

const GUILD_CBO               = '468951017980035072';
const CHANNEL_WVW_LOGS        = '947356699948376134';
const CHANNEL_ATTENDANCE      = '1116819277970939975';
const USER_ID_LOG_STREAM_ADAM = '1106957129463644242';

export const nextRuns = () => {
    let now = dayjs();
    let next = now.add(1, 'day').set('hour',1).set('minute',0).set('second',0);
    let diff = next.diff(now);
    return [now,next,diff];
}

export const registerDailyAttendance = async discordClient => {
    if( client === null) client = discordClient;
    let [now,next,diff] = nextRuns();
    info(`Daily attendance initated. Taking attendance ${now.to(next)}`)
    setTimeout(dailyAttendance, diff, null, true );
}

export const registerMessageCreateWatcher = async discordClient => {
    if( client === null) client = discordClient;
    client.on('messageCreate', (message =>{
        if( message.author.id === client.user.id ) return; //ignore my own posts
        dinfo(message.guild.name, message.channel.name, message.author.bot? `[BOT]${message.author.username}` : message.author.username, message.content, false);
    }));
}

export const dailyAttendance = async( forDate = null, getTeamSpeakRollCall = false ) => {
    try
    {
        let attendanceData = await takeAttendnce(forDate);
        let teamSpeakData = null;
        if( getTeamSpeakRollCall ) {
            teamSpeakData = await TeamSpeakAttendance.takeRollCallFor(forDate);
        }

        await reportAttendance(attendanceData, CHANNEL_ATTENDANCE, forDate, teamSpeakData );        
    }
    catch( err )
    {
        error(err, true)
    }
    let [now,next,diff] = nextRuns();
    info(`Taking next attendance ${now.to(next)}`);
    setTimeout(dailyAttendance, diff, null, true );
}

export const takeAttendnce = async ( forDate = null ) => {
    const guild = client.guilds.cache.get(GUILD_CBO);
    const channel_wvwlogs = guild.channels.cache.get(CHANNEL_WVW_LOGS);
    const today = forDate === null ? dayjs(): dayjs(forDate).add(1,'day');
    const yesterday = today.subtract(1, 'day').set('hour',20).set('minute',0).set('second',0);

    info(`Taking attendance for ${ yesterday.toDate() }`);
    const messages = await channel_wvwlogs.messages.fetch(
        {
        limit: 50,
        after: SnowflakeUtil.generate({ timestamp: yesterday.toDate() }),
        before: SnowflakeUtil.generate({ timestamp: today.set('hour',20).set('minute',0).set('second',0).toDate() })
    });
    
    let reports = [];
    for( let [id,msg] of messages )
    {
        if( msg.author.id === client.user.id) continue;
        dinfo(guild.name, channel_wvwlogs.name, msg.author.username, `Processing message ${id}`);
        if( msg.author.id === USER_ID_LOG_STREAM_ADAM )
        {
            reports.push(msg.embeds[0].data.url);
        }
        else
        {
            reports.push( ...extractWvWReports( msg ) );
        }
    }
    let reportsData = {};
    for( let r of reports )
    {
        info( `Report extracted: ${r}`);
        let [date,players,data] = await getDPSReportMetaData(r);
        reportsData[data.id] = [date,players,data];
    }
    let players = [];
    let startDate = yesterday;
    Object.values(reportsData).forEach( report => {
        let [reportDate, reportPlayers, reportData ] = report;
        if( reportDate.isBefore(startDate))
        {
            startDate = reportDate.clone();
        }
        Object.values(reportPlayers).forEach(player =>{
            let foundPlayer = players.find( allp => allp.display_name === player.display_name );
            if( !foundPlayer)
            {
                let p = {...player}
                p.reportCount = 1;
                players.push( p );
            }else{
                foundPlayer.reportCount += 1;
            }
        })
    });
    return players;
}

const extractWvWReports = ( message ) => {
    let matches = message.content.match(urlRegex);
    matches = matches ? matches.filter( url => url.indexOf('wvw.report') !== -1 ) : [];
    return matches;
}

const getDPSReportMetaData = async ( reportURL ) => {
    let metaDataURL = `https://dps.report/getUploadMetadata?permalink=${encodeURIComponent(reportURL)}`;
    info( `Meta Data URL: ${metaDataURL}`)
    let response = await fetch( metaDataURL );
    let jsonData = await response.json();
    let players = jsonData.players;
    info( `Players found ${Object.entries(players).length}`);
    return [dayjs(jsonData.id.split('-')[1]), players, jsonData];
}

export const reportAttendance = async (combatParticipants, outputChannel=CHANNEL_ATTENDANCE, date=null, teamspeakAttendees = null) => {
    try{
        date = date ?? dayjs().subtract(1, 'day');
        if( combatParticipants.length > 0)
        {
            let messages = await createMessages( date ?? dayjs().subtract(1, 'day'), combatParticipants, teamspeakAttendees );
            messages.forEach( msg => client.channels.cache.get(outputChannel).send( {
                content: msg,
                embeds: []
            }));
        }
        else
        {
            client.channels.cache.get(outputChannel).send({ content: `There were no #wvw-logs posts to pull data from for <t:${dayjs(date ?? dayjs(date)).unix()}>`})
        }
    }catch( err ){
        error( err );
    }
}

const createMessages = async ( date, combatParticipants, teamspeakAttendees ) => {
    //let longestAcct = Math.max(...combatParticipants.map(a => a.display_name.length));
    let battleCount =  Math.max(...combatParticipants.map(a => a.reportCount));
    combatParticipants.sort( (a, b) => a.display_name.toLowerCase().localeCompare(b.display_name.toLowerCase()) );

    let linesInMessage = [
        `## According to this evening's posts (<t:${dayjs(date).unix()}>), there were ${battleCount} battles with the following attendance\n`,
        '### Combat Participants _ordinal. [participation %],class, gw2id_\n'
    ];

    const guild = client.guilds.cache.get(GUILD_CBO);
    const teamspeakEmoji = guild.emojis.cache.find( e => e.name === 'teamspeak' );
    const buttholeEmoji = guild.emojis.cache.find( e => e.name === 'butthole' );

    //Report Combat Participates
    for( let i = 0; i < combatParticipants.length; i++ )
    {
        const index = i<10?`0${i}`:i;
        const { character_name, display_name, profession, elite_spec, reportCount } = combatParticipants[i];
        const emojiName = await getEmoji( profession, elite_spec );        
        const emoji = guild.emojis.cache.find(e => e.name === emojiName);
        let teamSpeakEmoji = '';
        if( teamspeakAttendees ) {
            const isInTeamspeak = teamspeakAttendees.players.some( ts => ts.gw2Id === display_name );
            teamSpeakEmoji = isInTeamspeak ? teamspeakEmoji : buttholeEmoji;
        }
        const percentParticipation = (100*reportCount/battleCount).toFixed();
        linesInMessage.push(`${index}. \`[${percentParticipation}%${percentParticipation < 100 ? ' ' : ''}]\` ${teamSpeakEmoji}${emoji} ${display_name}\n`); //${' '.repeat(longestAcct-display_name)}        
    }

    //
    if( teamspeakAttendees ) {
        teamspeakAttendees.players = teamspeakAttendees.players.filter( tsAs => tsAs.gw2Id === null || tsAs.gw2Id === undefined );
        linesInMessage.push( '### Teamspeak Only Participants\n');
        linesInMessage.push( '_These players never made it past the queue, or their TS names are different in the doc_\n');
        for( let player of teamspeakAttendees.players)
        linesInMessage.push( `* [${ teamspeakAttendees.minBetweenCheck * player.count}mins] ${player.name}\n`);
    }
    
    //Split up lines in seperate messages to send in discord
    let messagesToSend = [];
    let sendMessage = '';
    for( let line of linesInMessage) {
        sendMessage += line;
        if( sendMessage.length > 1800 )
        {
            messagesToSend.push( sendMessage );
            sendMessage = '';
        }
    }
    messagesToSend.push( sendMessage );
    return messagesToSend;
}
