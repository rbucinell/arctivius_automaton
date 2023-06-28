import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration.js';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import { Client, GatewayIntentBits, SnowflakeUtil } from 'discord.js';
dayjs.extend(duration);
dayjs.extend(relativeTime);
import { info, dinfo, warn} from '../logger.js';


const urlRegex = /([\w+]+\:\/\/)?([\w\d-]+\.)*[\w-]+[\.\:]\w+([\/\?\=\&\#\.]?[\w-]+)*\/?/gm;
let client = null;

const GUILD_CBO             = '468951017980035072';
const CHANNEL_WVW_LOGS      = '947356699948376134';
const CHANNEL_ATTENDENCE    = '1116819277970939975';
const USER_ID_LOG_STREAM_ADAM = '1106957129463644242';

export const nextRuns = () => {
    let now = dayjs();
    let next = now.add(1, 'day').set('hour',0).set('minute',30).set('second',0);
    let diff = next.diff(now);
    return [now,next,diff];
}

export const registerDailyAttendence = async discordClient => {
    if( client === null) client = discordClient;
    let [now,next,diff] = nextRuns();
    info(`Daily attendence initated. Taking attendence ${now.to(next)}`)
    setTimeout(takeAttendnce, diff );
}

export const registerMessageCreateWatcher = async discordClient => {
    if( client === null) client = discordClient;
    client.on('messageCreate', (message =>{
        if( message.author.id === client.user.id ) return; //ignore my own posts
        dinfo(message.guild.name, message.channel.name, message.author.bot? `[BOT]${message.author.username}` : message.author.username, message.content, false);
    }));
}

export const takeAttendnce = async ( forDate = null ) => {
    const guild = client.guilds.cache.get(GUILD_CBO);
    const channel_wvwlogs = guild.channels.cache.get(CHANNEL_WVW_LOGS);
    const today = forDate === null ? dayjs(): dayjs(forDate).add(1,'day');
    const yesterday = today.subtract(1, 'day').set('hour',20).set('minute',0).set('second',0);

    info(`Taking attendence for ${ yesterday.toDate() }`);
    const messages = await channel_wvwlogs.messages.fetch(
        {
        limit: 50,
        after: SnowflakeUtil.generate({ timestamp: yesterday.toDate() })
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
    reportAttendence(reportsData, yesterday );

    let [now,next,diff] = nextRuns();
    info(`Taking next attendence ${now.to(next)}`);
    setTimeout(takeAttendnce, diff );
}

const extractWvWReports = ( message ) => {
    let matches = message.content.match(urlRegex);
    matches = matches.filter( url => url.indexOf('wvw.report') !== -1 );
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

const reportAttendence = (reports, date=null) => {
    let startDate = date ?? dayjs();
    let players = [];

    Object.values(reports).forEach( report => {
        let [reportDate, reportPlayers, reportData ] = report;
        if( reportDate.isBefore(startDate))
        {
            startDate = reportDate.clone();
        }
        Object.values(reportPlayers).forEach(player =>{
            if( !players.find( allp => allp.display_name === player.display_name ))
            {
                players.push( player );
            }
        })
    });

    if( players.length > 0)
    {
        let messages = createMessages( date ?? startDate, players );
        messages.forEach( msg => client.channels.cache.get(CHANNEL_ATTENDENCE).send( {
            content: msg,
            embeds: []
        }));
    }
    else
    {
        client.channels.cache.get(CHANNEL_ATTENDENCE).send({ content: `There were no #wvw-logs posts to pull data from for <t:${date.unix()}>`})
    }
}

const createMessages = ( date, players ) => {
    let longestAcct = Math.max(...players.map(a => a.display_name.length));
    players.sort( (a, b) => a.display_name.toLowerCase().localeCompare(b.display_name.toLowerCase()) );

    let sendMessage = `According to this evening's posts, attendence for <t:${date.unix()}> is:\n\`\`\`\n`;
    let messagesToSend = [];
    players.forEach( (player,i) =>{
        const index = i+1;
        const acct = player.display_name;
        sendMessage +=`${index<10?`0${index}`:index}. ${acct}${' '.repeat(longestAcct-acct.length)} | ${player.character_name}\n`;
        if( sendMessage.length > 1900 )
        {
            sendMessage += '```';
            messagesToSend.push( sendMessage );
            sendMessage = '```\n';
        }
    });
    sendMessage += '```';
    messagesToSend.push( sendMessage );
    return messagesToSend;
}
