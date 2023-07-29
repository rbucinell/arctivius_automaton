import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration.js';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import { Client, GatewayIntentBits, SnowflakeUtil } from 'discord.js';
dayjs.extend(duration);
dayjs.extend(relativeTime);
import { info, dinfo, warn, error} from '../../logger.js';
import { Telnet } from "telnet-client";
import { exec } from 'node:child_process';
import psList from 'ps-list';
import dotenv from 'dotenv';
dotenv.config();
import TeamSpeakChannel from './teamspeakchannel.js';
import TeamSpeakClient from './teamspeakclient.js';
import { sleep } from "../../util.js";
import { getGuildMembers } from '../../guild/guildlookup.js';
import GuildMember from "../../guild/guildmember.js";

const GUILD_CBO = '468951017980035072';
const CHANNEL_SECRET_CHANNEL = '1123288191462551562';
const CHANNEL_TEAMSPEAK_ROLL_CALL = '1129101579082018886';
const MINUTES_BETWEEN_CHECKS = 15;

let client = null;

const infoTS = ( msg ) => info(`TeamSpeak Roll Call: ${msg}`);

const nextRollCall = () => {
    let now = dayjs();
    let next = now.hour() < 19 ? now.set('hour', 19).set('minute', 0).set('second', 0) : now.add(MINUTES_BETWEEN_CHECKS,'minutes');
    let diff = next.diff(now);
    infoTS(`Next check in ${next.fromNow()}`);   
    setTimeout(dailyRollCall, diff );
}

export const registerTeamSpeakRoleCall = async discordClient => {
    if( client === null) client = discordClient;
    nextRollCall();
}

export const dailyRollCall = async () =>{
    try
    {
        infoTS('Initiated');
        let tsClients = await checkTeamspeakAttendance();
        await reportRollCall( tsClients, CHANNEL_TEAMSPEAK_ROLL_CALL);               
    }
    catch( err )
    {
        error(err, true)
    }
    nextRollCall();
}

export const reportRollCall = async (rollCallData, outputChannel=CHANNEL_TEAMSPEAK_ROLL_CALL ) => {
    try {
        if( rollCallData.names.length > 0)
        {
            let msg = `### Teamspeak Roll Call taken at <t:${rollCallData.timestamp}>\n`;
            rollCallData.names.map( n => n.client_nickname ).forEach( n => msg += `${n}\n`);
            client.channels.cache.get(outputChannel).send({
                content: msg,
                embeds: []
            });
        }
    } catch( err ) {
        error( err );
    }
}

export const takeRollCallFor = async ( forDate = null ) =>{
    const guild = client.guilds.cache.get(GUILD_CBO);
    const channel = guild.channels.cache.get(CHANNEL_TEAMSPEAK_ROLL_CALL);
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
    let potentials = checkName.replace('[Pack]','').replace('[CBo]','').split(/[\s,()/]+/);
    for( let p of potentials) {
        let f = guildMembers.find( guildy => guildy.teamspeakName === p || guildy.gw2ID === p || guildy.discordID === p );
        if( f !== null ) found = f;
        break;
    }
    

    return found;
}

/**
 * 
 * @param {Object} options
 * @param {string} options.server Teamspeak Server
 * @param {Array<string>} options.channelNames list of channel names to parse. 
 *  Default values if not specified are '[CBo] WvW\\sOpen\\sChannel' and '[PACK] WvW\\sOpen\\sChannel'
 * @returns 
 */
export const checkTeamspeakAttendance = async ( options ) => 
{
    options = options || {};
    options.server = options.server || 'ts40.gameservers.com:9115';
    options.channelNames = options.channelNames || ['[CBo] WvW\\sOpen\\sChannel', '[PACK] WvW\\sOpen\\sChannel'];
    let nickname = 'Arctivius_Automaton';
    let timestamp = dayjs().unix();
    let names = [];
    let connection;

    try {
        //Ensure TeamSpeak 3 is running
        let ts3process = await exec('"C:\\Program Files\\TeamSpeak 3 Client\\ts3client_win64.exe"',);
        await sleep(3000);
        infoTS('Application Launched');
        let processes = (await psList());//.find( p => p.name.includes('ts3client_win64'));
        let ts3client = processes.find( p => p.name === 'ts3client_win64.exe' );
        
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
        await connection.send(`connect address=${options.server} nickname=${nickname}`);
        await sleep(5000);
        infoTS("Connected To Server")
        
        //Get Client information and mute
        //let whoami = (await connection.send( `whoami` )).split(' ').find( e => e.startsWith('clid')).split('=')[1];
        //await connection.send(`clientmove cid=60529 clid=${whoami}`); //"AFK channel in cbo ts"
        //await connection.send(`clientmute clid=${whoami}`); 
        ////await connection.send(`sendtextmessage targetmode=2 msg=I\sAm\s\The\sTerminator`);
        
        //Get Channels and Clients
        let channels = TeamSpeakChannel.parseList( await connection.send('channellist') );
        let clients = TeamSpeakClient.parseList( await connection.send('clientlist') );
        for( const cname of options.channelNames )
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
        infoTS( `Clients Found: ${names.map( n => n.client_nickname ).join(', ')}`);
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
