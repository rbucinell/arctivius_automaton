import dayjs from 'dayjs';
import { info, dinfo, warn} from '../logger.js';

const urlRegex = /([\w+]+\:\/\/)?([\w\d-]+\.)*[\w-]+[\.\:]\w+([\/\?\=\&\#\.]?[\w-]+)*\/?/gm;
let client = null;
let lastreported = dayjs().subtract( 12, 'hours' );
let reports = {};
let mostRecentPost =  dayjs().subtract( 12, 'hours' );
let timeoutID = null;
const COOLDOWN_REPORT_TIME  = 8;
const CHANNEL_WVW_LOGS      = '947356699948376134';
const CHANNEL_BOT_CHANNEL   = '516420055224025108';
const CHANNEL_OFFICERS      = '698556119223894076';
const CHANNEL_ATTENDENCE    = '1116819277970939975';
const USER_ID_LOG_STREAM_ADAM = '1106957129463644242';

export const registerMessageCreateWatcher = async discordClient => {
    client = discordClient;
    client.on('messageCreate', processMessageCreate );
}

export const processMessageCreate = async message =>
{
    let server = client.guilds.cache.get( message.guildId );
    let channel = client.channels.cache.get( message.channelId );
    if( message.author.id === client.user.id ) return; //ignore my own posts
    if( channel.id !== CHANNEL_WVW_LOGS ) return; //Only process WVW Logs channel
    
    dinfo(server.name, channel.name, message.author.bot? `[BOT]${message.author.username}` : message.author.username, message.content);

    //Extract all the url's from the message
    let reportsToProcess = [];
    if( message.author.id === USER_ID_LOG_STREAM_ADAM )
    {
        info(`${message.author.username} posted its after battle report` );
        let url = message.embeds[0].data.url;
        info( `Report URL found: ${url}`);
        reportsToProcess.push( url );
    }
    else
    {
        let extracted = extractWvWReports( message );
        extracted.forEach( (r,i) => info( `${i}. Report extracted: ${r}`));
        reportsToProcess.push( ...extracted );
    }

    //Extract all the data from the website
    for( let report of reportsToProcess )
    {
        let [date,players,data] = await getMetaData(report);
        if( !reports[data.id] )
        {
            reports[data.id] = [date,players,data];
        }
    }

    mostRecentPost = dayjs(message.createdAt);
    let nextPostTime = Math.max(mostRecentPost.add(30,'minutes').diff(dayjs()),1000);
    if( mostRecentPost.diff(lastreported,'hours') >= COOLDOWN_REPORT_TIME )
    {
        clearTimeout(timeoutID);
        timeoutID = setTimeout(reportAttendence, nextPostTime);
    }
    else
    {
        clearTimeout(timeoutID);
        timeoutID = setTimeout(reportAttendence, nextPostTime );
    }
}

const extractWvWReports = ( message ) => {
    let matches = message.content.match(urlRegex);
    matches = matches.filter( url => url.indexOf('wvw.report') !== -1 );
    return matches;
}

const getMetaData = async ( reportURL ) => {
    const reportMetadataURL = `https://dps.report/getUploadMetadata?permalink=${reportURL}`;
    let jsonData = await fetch( reportMetadataURL ).then( response => response.json() );
    let players = jsonData.players;
    return [dayjs(jsonData.encounterTime), players, jsonData];
}

const reportAttendence = () => {
    let startDate = dayjs();
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

    let messages = createMessages( startDate, players );
    messages.forEach( msg => client.channels.cache.get(CHANNEL_ATTENDENCE).send( {
        content: msg,
        embeds: []
    }));
    lastreported = dayjs(); 
    clearTimeout(timeoutID);
}

const createMessages = ( date, players ) => {
    let longestAcct = Math.max(...players.map(a => a.display_name.length));
    players.sort( (a, b) => a.display_name.toLowerCase().localeCompare(b.display_name.toLowerCase()) );

    let sendMessage = `According to this evening's posts, attendence for <t:${date.valueOf()}> is:\n\`\`\`\n`;
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
