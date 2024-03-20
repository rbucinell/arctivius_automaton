import { error, info } from '../../logger.js';
import { CrimsonBlackout } from '../../discord/ids.js';
import { WvWScheduler } from '../wvwraidscheduler.js';
import { DiscordManager } from '../../discord/manager.js';
import { getGuildMembers } from '../../guild/guildlookup.js';
import { AttachmentBuilder  } from 'discord.js';
import { gw2 } from '../../resources/gw2api/api.js';

import svgToImg from 'svg-to-img';
import dayjs from 'dayjs';
import duration     from 'dayjs/plugin/duration.js';
import timezone from 'dayjs/plugin/timezone.js';
import relativeTime from 'dayjs/plugin/relativeTime.js';

dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.extend(timezone);

const PROGRESS_CHANNEL = CrimsonBlackout.CHANNEL_SECRET_CHANNEL.description;
const MINUTES_BETWEEN_CHECKS = 15;
const MILLISECONDS_BETWEEN_CHECKS = MINUTES_BETWEEN_CHECKS * 60 * 1000;
const MESSAGE_CONTENT = 'Current Daily Objective Progress';
const SVG_WIDTH = 800;
const ROW_HEIGHT = 100;
const TEXT_HEIGHT = 20;
const BOX_HEIGHT = ROW_HEIGHT - TEXT_HEIGHT;
const BOX_FONT = `white-space: pre; fill: rgb(51, 51, 51); font-family: Arial, sans-serif; font-weight: 700; text-shadow: 1px 1px 0 #FFF, 1px -1px 0 #FFF, 1px -1px 0 #FFF, -1px 1px 0 #FFF, 1px 1px 0 #FFF;`;

const ROW_BG_COLOR  = 'rgb(216, 216, 216)'
const BOX_BG_COLOR  = 'rgb(238, 195, 195)';
const BOX_FG_COLOR  = 'rgb(186, 52, 52)';
const BOX_STROKE    = `rgb(0, 0, 0)`;

const infoProgress = ( msg, saveToLog=false ) => info(`Progress Report: ${msg}`, saveToLog);

export class ProgressManager {

    static initialize() {
        infoProgress("Manager Initiated");
        const { next, diff } = ProgressManager.nextScheduledRun;
        setTimeout(ProgressManager.ReportProgress, diff, next.start );
    }

    static get nextScheduledRun() {
        let now = dayjs();
        let next = WvWScheduler.nextRaid();
        let diff = next.start.diff(now);
        if( next.isActive ){
            let periodicCheck = now.add( MINUTES_BETWEEN_CHECKS, 'minutes');
            diff = periodicCheck.diff(now);
        }

         //Setting minimum time to Minutes_between_checks;
        diff = Math.max( MILLISECONDS_BETWEEN_CHECKS, diff ); 

        infoProgress(`\tNext check in ${ dayjs.duration(diff,'milliseconds').humanize() }`, true);   
        setTimeout(ProgressManager.nextScheduledRun, diff );

    }

    static async ReportProgress() {
        infoProgress("Report Initiated")
        const channel = DiscordManager.Client.channels.cache.get(PROGRESS_CHANNEL);

        let lastMessage = await channel.messages.fetch( { limit: 1, });
        if( lastMessage ) {
            lastMessage = lastMessage.first();
            if( lastMessage.author.id === DiscordManager.Client.user.id && 
                lastMessage.content.includes(MESSAGE_CONTENT)){
                lastMessage.delete();
            }
        }
        infoProgress("Previous Notification Purged", true);

        let objectives = await getGuildMemberAchievementObjectives();
        let svg = buildSvg( objectives );
        
        let fileName = 'chart.png';
        let img = await svgToImg.from(svg).toPng({ path: fileName, width: SVG_WIDTH });
        infoProgress("Report Image Generated");
        const file = new AttachmentBuilder(fileName);
        await channel.send({ content: MESSAGE_CONTENT, files:[file] });
        infoProgress("Report Sent");
    }
}

async function getGuildMemberAchievementObjectives() {

    let objectivesArr = [];
    let apikey = gw2.apikey;
    try{

        // Maybe when Anet gets their API working
        // const wvwWeeklyAchievements = 
        //     (await gw2.achievements.categories.get(gw2.achievements.categories.WEEKLY_WVW_ID))
        //     .achievements;

        //Get All GuildMembers that have provided an Automaton API Key
        let guildMembers = (await getGuildMembers())
        .filter( gm => gm.automatonAPIKey)
        .map( gm => {
            return { 
                gw2Id: gm.gw2ID, 
                apikey: gm.automatonAPIKey
            };
        });

        //TODO: filter on let signups = await getSignupForDate( now );
        //let signups = await getSignupForDate( now );

        let objectives = {};
        for( let gm of guildMembers ) {
            infoProgress("Looking up wizard vault objectives for " + gm.gw2Id, true);
            gw2.apikey = gm.apikey;
            let wvObjectives = (await gw2.account.wizardsvault.daily()).objectives.filter( o => o.track === 'WvW' );//&& !o.claimed);
            for( let objv of wvObjectives ){
                if( objectives.hasOwnProperty(objv.id)) {
                    objectives[objv.id].push( objv );
                }else{
                    objectives[objv.id] = [ objv ];
                }
            }
        }
        objectivesArr = Object.entries(objectives).sort((a,b) => b[1].length-a[1].length);
    }
    catch( err ){
        error(err);
    }
    finally{
        gw2.apikey = apikey;
    }
    return objectivesArr;
}

function buildSvg( objectivesArr ){

    //TODO: Build SVG so that when everyone is done with a tier, make that full (aka everyone done, all row is red, not pink)

    let width = SVG_WIDTH;
    let svg = `<svg viewBox="0 0 ${width} ${objectivesArr.length*100}" xmlns="http://www.w3.org/2000/svg">`;
    
    for( let i = 0; i < objectivesArr.length; i++ ){
        let [id, objectives] = objectivesArr[i];
        let objective = objectives[0]; //To be used as a sample
    
        //Draw Objective Title
        let y= i*ROW_HEIGHT;
        let curRect = `<rect x="0" y="${y}" width="${width}" height="${ROW_HEIGHT}" style="fill: ${ROW_BG_COLOR}; stroke: ${BOX_STROKE};"></rect>
        <text style="${BOX_FONT} font-size: ${TEXT_HEIGHT}px;" x="5" y="${y+17}">${objective.title}</text>`;
        
        //width of each column
        let w = width/objective.progress_complete;
        
        //Draw Background Titles
        for( let s = 0; s < objective.progress_complete; s++ ){
            curRect += `<rect x="${s*w}" y="${y+TEXT_HEIGHT}" width="${w}" height="${BOX_HEIGHT}" style="stroke: ${BOX_STROKE}; fill: ${BOX_BG_COLOR};"></rect>`;
        }
    
        //Draw Completion Tiles    
        for( let s = 1; s <= objective.progress_complete; s++ ) {
            const curProgressOfObjectiveList = objectives.filter( o => o.progress_current >= s);
            const curProgressOfObjectivePercent = curProgressOfObjectiveList.length / objectives.length;
            const percentHeight = BOX_HEIGHT * curProgressOfObjectivePercent; 
            curRect += `<rect x="${(s-1)*w}" y="${y+TEXT_HEIGHT + (BOX_HEIGHT-percentHeight)}" width="${w}" height="${percentHeight}" style="stroke: ${BOX_STROKE}; fill: ${BOX_FG_COLOR};"></rect>`;
            if( w > 20 )
                curRect += `<text x="${(s-1)*w+2}" y="${y+BOX_HEIGHT}" style="${BOX_FONT} font-size: ${ TEXT_HEIGHT }px;">${ curProgressOfObjectivePercent*100 }%</text>`;
        }
        svg += curRect;
    }
    svg += '</svg>';
    return svg;
}
