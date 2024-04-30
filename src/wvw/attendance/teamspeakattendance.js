import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration.js';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import timezone from 'dayjs/plugin/timezone.js';
import { SnowflakeUtil } from 'discord.js';
dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.extend(timezone);
import { info, error, format} from '../../logger.js';
import { Telnet } from "telnet-client";
import { exec } from 'node:child_process';
import psList from 'ps-list';
import dotenv from 'dotenv';
dotenv.config();
import TeamSpeakChannel from './teamspeakchannel.js';
import TeamSpeakClient from './teamspeakclient.js';
import { settings, sleep } from "../../util.js";
import { getGuildMembers } from '../../guild/guildlookup.js';
import { DiscordManager } from '../../discord/manager.js';
import { CrimsonBlackout } from '../../discord/ids.js';
import { WvWScheduler } from '../wvwraidscheduler.js';

export const MODULE_NAME = "Teamspeak Watcher"


const MINUTES_BETWEEN_CHECKS = settings.teamspeak.checkTimeoutMins;

const infoTS = ( msg, saveToLog=false ) => info( `[${format.dim(MODULE_NAME)}]: ${msg}`, saveToLog);

const nextRollCall = () => {
    let now = dayjs();
    let next = WvWScheduler.nextRaid();
    let diff = next.start.diff(now);
    if( next.isActive )
    {
        let periodicCheck = now.add( MINUTES_BETWEEN_CHECKS, 'minutes' );
        diff = periodicCheck.diff(now);
    }
    diff = Math.max( MINUTES_BETWEEN_CHECKS * 60 * 1000, diff ); //Setting minimum time to Minutes_between_checks;

    infoTS(`\tNext check in ${ dayjs.duration(diff,'milliseconds').humanize() }`, false);   
    setTimeout(dailyRollCall, diff );
}

export const initializeScheduledRuns = async() => {
    info(`[Module Registred] ${ format.highlight(MODULE_NAME)}`);
    nextRollCall();
}

export const dailyRollCall = async () => {
    try
    {
        infoTS('Initiated');
        let tsClients = await checkTeamspeakAttendance();
        await reportRollCall( tsClients, CrimsonBlackout.CHANNEL_TEAMSPEAK_ROLL_CALL.description);               
    }
    catch( err )
    {
        error(err, true);
    }
    nextRollCall();
}

export const reportRollCall = async (rollCallData, outputChannel=CrimsonBlackout.CHANNEL_TEAMSPEAK_ROLL_CALL.description ) => {
    try {
        if( rollCallData.names.length > 0)
        {
            let msg = `### Teamspeak Roll Call taken at <t:${rollCallData.timestamp}>\n`;
            rollCallData.names.map( n => n.client_nickname ).forEach( n => msg += `${n}\n`);
            DiscordManager.Client.channels.cache.get(outputChannel).send({
                content: msg,
                embeds: []
            });
        }
    } catch( err ) {
        error( err );
    }
}

export const takeRollCallFor = async ( forDate = null ) =>{
    const guild = DiscordManager.Client.guilds.cache.get(CrimsonBlackout.GUILD_ID.description);
    const channel = guild.channels.cache.get(CrimsonBlackout.CHANNEL_TEAMSPEAK_ROLL_CALL.description);
    const today = forDate === null ? dayjs(): dayjs(forDate).add(1,'day');
    const yesterday = today.subtract(1, 'day').set('hour',20).set('minute',0).set('second',0);
    info(`Getting roll call data for ${ yesterday.toDate() }`);
    const messages = await channel.messages.fetch(
        {
        limit: 50,
        after: SnowflakeUtil.generate({ timestamp: yesterday.toDate() }),
        before: SnowflakeUtil.generate({ timestamp: today.set('hour',20).set('minute',0).set('second',0).toDate() })
    });

    let guildMembers = await getGuildMembers();

    let players = [];
    messages.forEach( msg => {
        let lines = msg.content.split('\n').slice(1);
        lines.forEach( line => {
            let guildInfo = attemptMatchTSName( guildMembers, line );
            let found = players.find( p => p.name === line );
            if( !found ){
                players.push( { name: line, count: 1, gw2Id: guildInfo?.gw2ID });
            }else{
                found.count += 1;
            }
        });
    });
    return { minBetweenCheck: MINUTES_BETWEEN_CHECKS, players: players};
}

const attemptMatchTSName = ( guildMembers, checkName ) => {
    let found = null;
    checkName = checkName.replace('[Pack]','').replace('[CBo]','').replace('[CBo/PACK]', '').trim();
    let potentials = checkName.split(/[\s,()/]+/);
    potentials.push( checkName );
    for( let p of potentials) {
        let lowP = p.toLowerCase();
        let f = guildMembers.find( guildy => {
            return guildy.teamspeakName.toLowerCase() === lowP || guildy.gw2ID === lowP || guildy.discordID === lowP    
        });
        if( f !== undefined ){
            found = f;
            break;
        }
    }
    return found;
}

/**
 * Establish a telnet connection to a teamspeak client and collect users in provided channels
 * list of channel names to parse. Default values if not specified are '[CBo] WvW\\sOpen\\sChannel' and '[PACK] WvW\\sOpen\\sChannel'
 * @returns 
 */
export const checkTeamspeakAttendance = async () => 
{
    let timestamp = dayjs().unix();
    let names = [];
    let connection;

    try {
        //Ensure TeamSpeak 3 is running
        let ts3process = await exec(`"${settings.teamspeak.exePath}"`,);
        await sleep(3000);
        infoTS('Application Launched');
        let processes = (await psList());//.find( p => p.name.includes('ts3client_win64'));
        let ts3client = processes.find( p => p.name === settings.teamspeak.exeName );
        
        //Initialize the telnet connection in teamspeak
        connection = new Telnet();
        await connection.connect({
            host: '127.0.0.1',
            port: 25639,
            negotiationMandatory: false,
            timeout: 1500
        });

        //Connect to the server
        await connection.send(`auth apikey=${process.env.TEAMPSEAK_TELNET_API}`);
        await connection.send(`connect address=${settings.teamspeak.server} nickname=${settings.name}`);
        await sleep(5000);
        infoTS("Connected To Server")
        
        //Get Client information and mute
        //let whoami = (await connection.send( `whoami` )).split(' ').find( e => e.startsWith('clid')).split('=')[1];
        //await connection.send(`clientmove cid=60529 clid=${whoami}`); //"AFK channel in cbo ts"
        await connection.send(`clientmute clid=${whoami}`); 
        ////await connection.send(`sendtextmessage targetmode=2 msg=I\sAm\s\The\sTerminator`);
        
        //Get Channels and Clients
        let channels = TeamSpeakChannel.parseList( await connection.send('channellist') );
        let clients = TeamSpeakClient.parseList( await connection.send('clientlist') );
        for( const cname of settings.teamspeak.channels )
        {
            let tsChannel = channels.find( c => c.channel_name === cname );
            let channelClients = clients.filter( c => c.cid === tsChannel.cid );
            channelClients = channelClients.map( cc => {
                cc['channel_name'] = cname;
                return cc;
            } )
            names.push( channelClients );
        }
        names = [...new Set(names.flat())]
        infoTS( `Clients Found: ${names.map( n => n.client_nickname ).join(', ')}`, true);
    }
    catch( err ) 
    {
        error( err );
    }
    finally{
        if( connection ) {
            await connection.send('disconnect');
            await connection.destroy();
            infoTS('Server Disconnected');
        }
    }
    return { timestamp: timestamp, names: names};
}
