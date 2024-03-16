import { info } from '../../logger.js';
import { CrimsonBlackout } from '../../discord/ids.js';
import { WvWScheduler } from '../wvwraidscheduler.js';
import { DiscordManager } from '../../discord/manager.js';
import { getSignupForDate } from './eventsignups.js';
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

export class ProgressManager {

    static initialize() {
        info('Progress Manager Initialized', false);
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

    }

    static async ReportProgress() {
        info( "Initalizing Progress Report" );

        let objectives = await getGuildMemberAchievementObjectives();
        let svg = buildSvg( objectives );
        
        let fileName = saveSvg( svg );

        const file = new AttachmentBuilder(fileName);
        const channel = DiscordManager.Client.channels.cache.get(PROGRESS_CHANNEL);
        channel.send({ files:[file] });
    }
}

async function getGuildMemberAchievementObjectives(){

    let objectivesArr = [];
    let apikey = gw2.apikey;
    try{
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
        let signups = await getSignupForDate( now );

        let objectives = {};
        for( let gm of guildMembers ) {
            info("Looking up objectives for " + gm.gw2Id)
            gw2.apikey = gm.apikey;
            let gmObjectives = (await gw2.account.wizardsvault.daily()).objectives.filter( o => o.track === 'WvW' );//&& !o.claimed);
            for( let objv of gmObjectives ){
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

    }
    finally{
        gw2.apikey = apikey;
    }
    return objectivesArr;
}

function buildSvg( objectives ){
    const SVG_WIDTH = 800;
    const ROW_HEIGHT = 100;
    const TEXT_HEIGHT = 20;
    const BOX_HEIGHT = ROW_HEIGHT - TEXT_HEIGHT;
    const BOX_FONT = `white-space: pre; fill: rgb(51, 51, 51); font-family: Arial, sans-serif; font-weight: 700; text-shadow: 1px 1px 0 #FFF, 1px -1px 0 #FFF, 1px -1px 0 #FFF, -1px 1px 0 #FFF, 1px 1px 0 #FFF;`;

    const ROW_BG_COLOR  = 'rgb(216, 216, 216)'
    const BOX_BG_COLOR  = 'rgb(238, 195, 195)';
    const BOX_FG_COLOR  = 'rgb(186, 52, 52)';
    const BOX_STROKE    = `rgb(0, 0, 0)`;

    let width = SVG_WIDTH;
    let svg = `<svg viewBox="0 0 ${width} ${objectives.length*100}" xmlns="http://www.w3.org/2000/svg">`;
    
    for( let i = 0; i < objectives.length; i++ ){
        let [id, objectives] = objectives[i];
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
            const curProgressOfObjectiveList = objectives.filter( o => o.progress_current === s);
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

async function saveSvg( svg, width ){
    let path = 'chart.png';
    await svgToImg.from(svg).toPng({ path, width });
    return path;
}
