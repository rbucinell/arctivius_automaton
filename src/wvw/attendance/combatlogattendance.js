import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration.js';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import { SnowflakeUtil } from 'discord.js';
import { format, dinfo, info, warn, debug, error } from '../../logger.js';
import { DiscordManager } from '../../discord/manager.js';
import { CrimsonBlackout, DiscordUsers } from '../../discord/ids.js';
import url from 'node:url';
import path from 'node:path';
import puppeteer from 'puppeteer';
import CombatMember from './models/combatmember.js';

dayjs.extend(duration);
dayjs.extend(relativeTime);

const URL_PATTERN = /([\w+]+\:\/\/)?([\w\d-]+\.)*[\w-]+[\.\:]\w+([\/\?\=\&\#\.]?[\w-]+)*\/?/gm;

/**
 * Takes attendence for a given date across multiple battle log sources 
 * 
 * @param {Date} forDate Take attendence for the given date. Defaults to today.
 * @returns {Array<CombatMember>} An array of combat participants with the associated battle participation count
 */
export const takeAttendnce = async ( forDate = null ) => {
    const today = forDate === null ? dayjs(): dayjs(forDate);

    info(`Taking attendance for ${ today.format('dddd, MMMM D, YYYY') }`);
    let players = [];
    let urlReportPlayers = await getPlayersFromWvwLogsChannelDpsReportUrls( today );
    let htmlParsedPlayers = await wvwLogsHTMLReports(today);
    return players.concat(urlReportPlayers).concat(htmlParsedPlayers);
}

/**
 * @param {Date} forDate Take attendence for the given date. Defaults to today.
 * @returns {Array<CombatMember>} An array of combat participants with the associated battle participation count
 */
const wvwLogsHTMLReports = async( forDate ) => {
    forDate = forDate === null ? dayjs(): dayjs(forDate);
    let players = [];
    try{
        const guild = await DiscordManager.Client.guilds.fetch( CrimsonBlackout.GUILD_ID.description );
        const channel_wvwlogs = guild.channels.cache.get(CrimsonBlackout.CHANNEL_WVW_LOGS.description);

        let messages = (await channel_wvwlogs.messages.fetch({
            limit: 10,
            around: SnowflakeUtil.generate({ timestamp: forDate.toDate() })
        }));
        let message = messages.find( msg => {
            if( !msg.attachments) return false;
            let attachementPath = url.parse(msg.attachments.first().attachment).pathname;
            let basename = path.basename(attachementPath);
            let rally = `${forDate.format('M-D-YYYY')}-WvW-Rally.html`;
            let raid = `${forDate.format('M-D-YYYY')}-WvW-Raid.html`;
            return basename === rally || basename === raid;
        });

        if( message ){
            
            let htmlFile = await (await fetch(message.attachments.first().attachment)).text();
            const browser = await puppeteer.launch({
                headless: true
            });
            const page = await browser.newPage();
            await page.setContent( htmlFile );
            await page.click('a');
            await page.waitForSelector('.tc-tiddler-body.tc-reveal');
            await page.$$eval('button', btns =>{
                let btnList = [...btns];
                let btn = btnList.find( _ => _.innerText === 'General' );
                if( btn ) {
                    btn.click();
                }
            });
            await page.waitForSelector('button')
            await page.$$eval('button', btns => [...btns].find( btn => btn.innerText === 'Attendance').click() );
            await page.waitForSelector('table')
            players = await page.evaluate(()=>{
                let players = [];
                const attendanceTable = [...document.querySelectorAll('table')][1];
                let trs = [...attendanceTable.querySelectorAll('thead tr')].slice(1);

                trs.forEach( tr => {
                    const strongs = [...tr.querySelectorAll('strong')];
                    const [name, count, duration, guildStatus] = strongs.map( s => s.innerText );
                    players.push( { name, count, duration, guildStatus });                
                });
                return players;
            });
            return players.map( _ => new CombatMember( _.name, _.count ));
        }
    }catch( err ){
        error(err);
    }finally{
        return players;
    }

}

const getPlayersFromWvwLogsChannelDpsReportUrls = async ( forDate ) => {

    forDate = forDate === null ? dayjs(): dayjs(forDate);

    const guild = await DiscordManager.Client.guilds.fetch( CrimsonBlackout.GUILD_ID.description );
    const channel_wvwlogs = guild.channels.cache.get(CrimsonBlackout.CHANNEL_WVW_LOGS.description);

    const messages = await channel_wvwlogs.messages.fetch({
        limit: 10,
        around: SnowflakeUtil.generate({ timestamp: forDate.toDate() })
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
    let startDate = forDate;
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

/**
 * 
 * @param {string} reportURL The log URL (https://wvw.report/AKGH-20240322-191304_wvw)
 * @returns Array<dayjs.Dayjs,{{ character_name:string, display_name:string, eliete_spec:number, profession:number}} players, {*} data> 
 */
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