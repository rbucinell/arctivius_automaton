import { Telnet } from "telnet-client";
import { exec } from 'node:child_process';
import psList from 'ps-list';
import dayjs from 'dayjs';
import dotenv from 'dotenv';
dotenv.config();

import { sleep } from "../util.js";

/**
 * 
 * @param {Object} options
 * @param {string} options.server Teamspeak Server
 * @param {Array<string>} options.channelNames list of channel names to parse. Default values if not specified are
 *  '[CBo] WvW\\sOpen\\sChannel' and '[PACK] WvW\\sOpen\\sChannel'
 * @returns 
 */
export const checkTeamspeakAttendence = async ( options ) => 
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
        await sleep(1000);
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

        //Get Client information and mute
        let whoami = (await connection.send( `whoami` )).split(' ').find( e => e.startsWith('clid')).split('=')[1];
        await connection.send(`clientmove cid=60529 clid=${whoami}`); "AFK channel in cbo ts"

        //
        await connection.send(`clientmute clid=${whoami}`); 
        //await connection.send(`sendtextmessage targetmode=2 msg=I\sAm\s\The\sTerminator`);
        
        let channels = parseChannels( await connection.send('channellist') );
        let clients = parseClients( await connection.send('clientlist') );

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
    }
    catch( error ) 
    {
        console.log( error );
    }
    finally{
        if( connection ) {
            await connection.send('disconnect');
            await connection.destroy();
        }
    }
    return { timestamp: timestamp, names: names};
}

const parseClients = (clientsString ) => clientsString.split('|').map( c => Client.parse(c));
const parseChannels = ( channelsString ) => channelsString.split('|').map( c => Channel.parse( c ));

class Client {
    constructor(clid=0,cid=0,client_database_id=0,client_nickname='',client_type=0) {
        this.clid = clid;
        this.cid = cid;
        this.client_database_id = client_database_id;
        this.client_nickname = client_nickname;
        this.client_type = client_type;

    }
    static parse( clientString ){
        let client = new Client();
        let datum = clientString.split(' ');
        for( let d of datum )
        {
            let [ k, v ] = d.split('=');
            client[k]=v.replaceAll('\\s',' ').replaceAll('\\','');
        }
        return client;
    }
}

class Channel {
    constructor( cid=0, pid=0, channel_order=0, chanel_name='', channel_flag_are_subscribed=0, total_clients=0 ) {
        this.cid = cid;
        this.pid = pid;
        this.channel_order = channel_order;
        this.chanel_name = chanel_name;
        this.channel_flag_are_subscribed = channel_flag_are_subscribed;
        this.total_clients = total_clients;
    }

    static parse( channelString )
    {
        let channel = new Channel();
        let datum = channelString.split(' ');
        for( let d of datum )
        {
            let [ k, v ] = d.split('=');
            channel[k]=v.replace('\\s', ' ');
        }

        return channel;
    }
}