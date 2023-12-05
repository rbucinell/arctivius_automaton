import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration.js';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import { SnowflakeUtil } from 'discord.js';
import { info, dinfo, warn } from '../../logger.js';
import { DiscordManager } from '../../discord/manager.js';
import { CrimsonBlackout, DiscordUsers } from '../../discord/ids.js';
dayjs.extend(duration);
dayjs.extend(relativeTime);

const URL_PATTERN = /([\w+]+\:\/\/)?([\w\d-]+\.)*[\w-]+[\.\:]\w+([\/\?\=\&\#\.]?[\w-]+)*\/?/gm;

export const takeAttendnce = async ( forDate = null ) => {
    const guild = await DiscordManager.Client.guilds.fetch( CrimsonBlackout.GUILD_ID.description );
    const channel_wvwlogs = guild.channels.cache.get(CrimsonBlackout.CHANNEL_WVW_LOGS.description);
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
        if( msg.author.id === DiscordManager.Client.user.id) continue;
        dinfo(guild.name, channel_wvwlogs.name, msg.author.username, `Processing message ${id}`);
        if( msg.author.id === DiscordUsers.LOG_STREAM_ADAM )
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
    let matches = message.content.match(URL_PATTERN);
    matches = matches ? matches.filter( url => url.indexOf('wvw.report') !== -1 || url.indexOf('dps.report') !== -1 ) : [];
    return matches;
}

const getDPSReportMetaData = async ( reportURL ) => {
    let metaDataURL = `https://dps.report/getUploadMetadata?permalink=${encodeURIComponent(reportURL)}`;
    info( `Meta Data URL: ${metaDataURL}`);
    let players = [];
    let date = dayjs();
    let data = {};
    try {
        let response = await fetch( metaDataURL );
        data = await response.json();
        date = dayjs(data.id.split('-')[1]);
        players = data.players;
        info( `Players found ${Object.entries(players).length}`);
    }
    catch( err ) {
        warn(err,true);
    }
    return [date, players, data];
}