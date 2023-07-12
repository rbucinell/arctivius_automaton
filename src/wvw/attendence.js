import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration.js';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import { Client, GatewayIntentBits, SnowflakeUtil } from 'discord.js';
dayjs.extend(duration);
dayjs.extend(relativeTime);
import { info, dinfo, warn, error} from '../logger.js';
import { gw2 } from '../gw2api/api.js';
import { before } from 'node:test';

const urlRegex = /([\w+]+\:\/\/)?([\w\d-]+\.)*[\w-]+[\.\:]\w+([\/\?\=\&\#\.]?[\w-]+)*\/?/gm;
let client = null;

const GUILD_CBO             = '468951017980035072';
const CHANNEL_WVW_LOGS      = '947356699948376134';
const CHANNEL_ATTENDENCE    = '1116819277970939975';
const USER_ID_LOG_STREAM_ADAM = '1106957129463644242';

export const nextRuns = () => {
    let now = dayjs();
    let next = now.add(1, 'day').set('hour',1).set('minute',0).set('second',0);
    let diff = next.diff(now);
    return [now,next,diff];
}

export const registerDailyAttendence = async discordClient => {
    if( client === null) client = discordClient;
    let [now,next,diff] = nextRuns();
    info(`Daily attendence initated. Taking attendence ${now.to(next)}`)
    setTimeout(dailyAttendence, diff );
}

export const registerMessageCreateWatcher = async discordClient => {
    if( client === null) client = discordClient;
    client.on('messageCreate', (message =>{
        if( message.author.id === client.user.id ) return; //ignore my own posts
        dinfo(message.guild.name, message.channel.name, message.author.bot? `[BOT]${message.author.username}` : message.author.username, message.content, false);
    }));
}

export const dailyAttendence = async( forDate = null ) =>{
    try
    {
        let attendenceData = await takeAttendnce(forDate);
        await reportAttendence(attendenceData, CHANNEL_ATTENDENCE, forDate );        
    }
    catch( err )
    {
        error(err, true)
    }
    let [now,next,diff] = nextRuns();
    info(`Taking next attendence ${now.to(next)}`);
    setTimeout(dailyAttendence, diff );
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
            if( !players.find( allp => allp.display_name === player.display_name ))
            {
                players.push( player );
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

export const reportAttendence = async (players, outputChannel=CHANNEL_ATTENDENCE, date=null) => {
    date = date ?? dayjs().subtract(1, 'day');
    if( players.length > 0)
    {
        let messages = await createMessages( date ?? dayjs().subtract(1, 'day'), players );
        messages.forEach( msg => client.channels.cache.get(outputChannel).send( {
            content: msg,
            embeds: []
        }));
    }
    else
    {
        client.channels.cache.get(outputChannel).send({ content: `There were no #wvw-logs posts to pull data from for <t:${dayjs(date ?? dayjs(date)).unix()}>`})
    }
}

const createMessages = async ( date, players ) => {
    let longestAcct = Math.max(...players.map(a => a.display_name.length));
    players.sort( (a, b) => a.display_name.toLowerCase().localeCompare(b.display_name.toLowerCase()) );

    let sendMessage = `## According to this evening's posts, attendence for <t:${dayjs(date).unix()}> is\n`;
    let messagesToSend = [];
    for( let i = 0; i < players.length; i++ )
    {
        const index = i<10?`0${i}`:i;
        const { character_name, display_name, profession, elite_spec } = players[i];
        const emoji = await getEmoji( profession, elite_spec );
        sendMessage +=`${index}. ${emoji} \`${display_name}${' '.repeat(longestAcct-display_name)} | ${character_name}\`\n`;
        if( sendMessage.length > 1900 )
        {
            messagesToSend.push( sendMessage );
            sendMessage = '';
        }
    }
    messagesToSend.push( sendMessage );
    return messagesToSend;
}

export const getEmoji = async ( prof, spec ) => {
    let emojiName = 'wvw';
    try {
        if( spec === 0)
        {
            let specialiazation = (await gw2.specializations.get(prof))[0];
            emojiName = `${specialiazation.profession}`.toLocaleLowerCase();
        }
        else{
            let specialiazation = (await gw2.specializations.get(spec))[0];
            emojiName = `${specialiazation.profession}_${specialiazation.name}`.toLocaleLowerCase();
        }
    }
    catch( err ) {}
    const guild = client.guilds.cache.get(GUILD_CBO);
    const emoji = guild.emojis.cache.find(e => e.name === emojiName);
    return emoji; 
}
