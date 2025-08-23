import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration.js';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import { SnowflakeUtil, Message } from 'discord.js';
import { format, info, warn, error, LogOptions } from '../../logger.js';
import { DiscordManager } from '../../discord/manager.js';
import { CrimsonBlackout, DiscordUsers } from '../../discord/ids.js';
import url from 'node:url';
import path from 'node:path';
import puppeteer, { Page } from 'puppeteer';
import CombatMember from './models/combatmember.js';
import { Module } from '../../commands/modules/module.js';
import { WvWScheduler } from '../wvwraidscheduler.js';
import { NewDatabaseAttendance } from './newdatabaseattendance.js';

dayjs.extend(duration);
dayjs.extend(relativeTime);

const URL_PATTERN = /([\w+]+\:\/\/)?([\w\d-]+\.)*[\w-]+[\.\:]\w+([\/\?\=\&\#\.]?[\w-]+)*\/?/gm;
const MINIMUM_PROCESSING_TIME = 1000 * 60 * 60;

export class CombatLogAttendance extends Module {

    static initialize() {
        let { start, end, isActive } = WvWScheduler.nextRaid();
        super.initialize( start );
    }

    static getNextExecute() {
        let { start, end, isActive } = WvWScheduler.nextRaid(dayjs());
        return Math.max( MINIMUM_PROCESSING_TIME, end.add(1, 'hour').diff(dayjs()) );
    }

    /**
     * Records combat log attendance for the given date, or for today if no date is given.
     * If executeOnce is true, the function will not await the next raid to start before returning.
     * @param {Date|string} [forDate] The date for which the attendence records should be retrieved. Defaults to today.
     * @param {boolean} [executeOnce=false] If true, the function will not await the next raid to start before returning.
     * @returns {Promise<void>}
     */
    static async execute( args ) {
        let forDate = args[0] ? dayjs(args[0]) : dayjs();
        let executeOnce = args[1] ? args[1] : false;
        
        this.info("Recording Combat Log Attendence");        
        const dar = await NewDatabaseAttendance.record( forDate, { combat: true } );

        if( !executeOnce) {
            this.awaitExecution(WvWScheduler.nextRaid().start);
        }
    }
}

function infoLog(msg, options = LogOptions.ConsoleOnly ) {
    info( `${format.module("CombatLogAttendance")} ${msg}`, options );
}

function warnLog(msg, options = LogOptions.ConsoleOnly ) {
    warn( `${format.module("CombatLogAttendance")} ${msg}`, options );
}

/**
 * Takes attendence for a given date across multiple battle log sources 
 * 
 * @param {Date} forDate Take attendence for the given date. Defaults to today.
 * @returns {Array<CombatMember>} An array of combat participants with the associated battle participation count
 */
export const takeAttendnce = async ( forDate = null ) => {
    const today = forDate === null ? dayjs(): dayjs(forDate);

    infoLog(`Taking attendance for ${ today.format('dddd, MMMM D, YYYY') }`, LogOptions.All);
    let players = [];
    try {

        const guild = await DiscordManager.Client.guilds.fetch( CrimsonBlackout.GUILD_ID.description );
        const channel = guild.channels.cache.get(CrimsonBlackout.CHANNEL_WVW_LOGS.description);

        let messages = (await channel.messages.fetch({
            limit: 10,
            around: SnowflakeUtil.generate({ timestamp: today.toDate() })
        }));

        for( let message of messages.values() ) {
            infoLog(`Processing message: ${format.channel(message.channel)} ${format.username(message.author.username)} #${message.id}`);
            let urls = await parseMessageForURLs( message, today );
            addPlayers( players, urls )
            let html = await parseMessageForHTML( message, today );
            addPlayers ( players, html );
        }

         //Used to be https://alyrico.github.io/arcparsing/, hence the variable names
        let pycachu700Html = await goToTiddly( 'https://pycachu700.github.io/PACK_logs/', today );
        addPlayers( players, pycachu700Html );
        if( pycachu700Html && pycachu700Html.length > 0){
            infoLog(`Found ${ pycachu700Html.length } combat members from pycachu700.github.io/PACK_logs/ `, LogOptions.All);
        }

        let dobyIsFreeHtml = await goToTiddly( 'https://dobby-is-free.com/', today );
        addPlayers( players, dobyIsFreeHtml );
        if( dobyIsFreeHtml && dobyIsFreeHtml.length > 0){
            infoLog(`Found ${ dobyIsFreeHtml.length } combat members from dobby-is-free.com `, LogOptions.All);
        }
    }
    catch( err ) {
        error(err);
    }
    finally {
        return players;
    }
}

/**
 * @param {Array<CombatMember>} players 
 * @param {Array<CombatMember>} combatMembers 
 */
function addPlayers( players, combatMembers ) {
    combatMembers.forEach( cm => {
        let player = players.find( p => p.gw2Id === cm.gw2Id);
        if( player ){
            player.battles = Math.max( player.battles, cm.battles );
        }else{
            players.push( cm );
        }
    });
}

/**
 * @param {Message} message Discord message to parse
 * @param {Date} forDate Take attendence for the given date. Defaults to today.
 * @returns {Array<CombatMember>} An array of combat participants with the associated battle participation count
 */
async function parseMessageForHTML ( message, forDate ) {
    
    const rally = `${forDate.format('M-D-YYYY')}-WvW-Rally.html`;
    const raid = `${forDate.format('M-D-YYYY')}-WvW-Raid.html`;
    let players = [];

    try {
        if( message.attachments.size === 0) return players;
        let attachementPath = url.parse(message.attachments.first().attachment).pathname;
        let basename = path.basename(attachementPath);
        if( basename === raid || basename === rally ){

            let attachmentUrl = message.attachments.first().attachment;
            let fetchAttachement = await fetch( attachmentUrl );
            let htmlFile = await fetchAttachement.text();
            players = await loadTiddly( htmlFile, forDate );
        }
    }
    catch( err ) {
        error(err);
    }
    finally {
        return players;
    }
}

/**
* @param {string} url The log URL (https://wvw.report/AKGH-20240322-191304_wvw)
* @param {Date} forDate The given date to take attendence for
* @returns {Array<CombatMember>} An array of combat participants with the associated battle participation count
*/
async function goToTiddly ( url, forDate ) {
    infoLog(`Processing ${url}`);
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto( url );
    const players = await navigateTiddly( page, forDate );
    await browser.close();
    return players;
}

async function loadTiddly ( htmlContent, forDate ) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent( htmlContent );
    const players = await navigateTiddly( page, forDate );
    await browser.close();
    return players;

}

/**
* @param {Page} page The loaded tiddly page
* @param {dayjs.Dayjs} forDate The given date to take attendence for
* @returns {Array<CombatMember>} An array of combat participants with the associated battle participation count
*/
async function navigateTiddly ( page, forDate ) {
    let players = [];
    try{

        const dateAnchorSelector = `a[href^="#${forDate.format('YYYYMMDD')}"]`;
        if( (await page.$(dateAnchorSelector)) !== null ){

            await page.click(dateAnchorSelector);
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
            let evalualteResponse = await page.evaluate(()=>{
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

            players =  evalualteResponse.map( _ => new CombatMember( _.name, _.count ));
        }
        else {
            warnLog( `Unable to find link for ${forDate.format('YYYYMMDD')}`);
        }
    } catch(err){
        error(err);
    } finally {
        return players;
    }
}

/**
 * @param {Message} message Discord message to parse
 * @param {Date} forDate Take attendence for the given date. Defaults to today.
 * @returns {Array<CombatMember>} An array of combat participants with the associated battle participation count
 */
async function parseMessageForURLs ( message, forDate ) {
    let players = [];
    try {
        let reports = [];
        if( message.author.id === DiscordUsers.LOG_STREAM_ADAM ) {
            reports.push(message.embeds[0].data.url);
        }
        else {
            reports.push( ...extractWvWReports( message ) );
        }
        let reportsData = {};
        for( let r of reports )
        {
            info( `Report extracted: ${r}`);
            let [date,players,data] = await getDPSReportMetaData(r);
            reportsData[data.id] = [date,players,data];
        }
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
    }
    catch( err ) {
        error(err);
    }
    finally {
        return players;
    }
}

const extractWvWReports = ( message ) => {
    let matches = message.content.match(URL_PATTERN);
    matches = matches ? matches.filter( url => url.indexOf('wvw.report') !== -1 || url.indexOf('dps.report') !== -1 ) : [];
    return matches;
}

/**
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
        if( data.id ){
            date = dayjs(data.id.split('-')[1]);
            players = data.players;
            info( `Players found ${Object.entries(players).length}`);
        }
    }
    catch( err ) {
        warn(err);
    }
    return [date, players, data];
}

async function getCombatLogsForEveryDayInMonth( year, month ){
    let currentDay = dayjs(`${year}-${month}-01`);
    console.log( currentDay.month() );
    while( currentDay.month() + 1 === month ) {
        
        console.log( "Combat Logs for: ", currentDay.toString() );

        if( currentDay.day() === 0 || currentDay.day() === 1 || currentDay.day() === 3){
            const date = currentDay.format("YYYY-MM-DD");
            const dar = await NewDatabaseAttendance.report( date );
            if( !dar.combat || dar.combat.length === 0 ){
                await NewDatabaseAttendance.record( date, { combat: true} );
            }
        }
        currentDay = currentDay.add(1,'day');
    }    
}