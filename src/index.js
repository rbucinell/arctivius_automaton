import dotenv from 'dotenv';
import { info, dinfo, warn} from './logger.js';
import {processDiscordMessage} from './wvw/attendence.js';

dotenv.config()

import { Client, GatewayIntentBits } from 'discord.js';
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent        
    ]
});

const CHANNEL_WVW_LOGS = '947356699948376134';
const CHANNEL_BOT_CHANNEL = '516420055224025108';
const CHANNEL_OFFICERS = '698556119223894076';
const CHANNEL_ATTENDENCE = '1116819277970939975';

client.login( process.env.DISCORD_BOT_TOKEN);
client.on('ready', async ()=>{
    client.user.setActivity('Waiting for Commands. BEEP BOOP.', { type: "WATCHING"});
    client.user.setStatus( 'online');
    info(`Logged in as ${client.user.tag}`);
});

client.on( "messageCreate", async (message) => {
    let server = client.guilds.cache.get( message.guildId );
    let channel = client.channels.cache.get( message.channelId );

    dinfo(server.name, channel.name, message.author.bot? `[BOT]${message.author.username}` : message.author.username, message.content);
    if( channel.id === CHANNEL_WVW_LOGS && message.author.id !== client.user.id )
    {
        if( message.author.bot ) return;
        
        warn(`🚨 It's Happening🚨`);
        // const cbo = client.guilds.cache.get('468951017980035072');
        // const channel_wvwlogs = cbo.channels.cache.get(CHANNEL_WVW_LOGS);
        // const test_message = await channel_wvwlogs.messages.fetch('1115483976837111840');
        let messages = await processDiscordMessage( message );
        messages.forEach( msg => client.channels.cache.get(CHANNEL_ATTENDENCE).send( {
            content: msg,
            embeds: []
        }));
    }

    //info(`[${server.name}] #${channel.name} | ${message.author.username}: ${message.content}`);
    if( message.author.username === 'swiftstriker00' && channel.name === 'bot-channel' )
    {
        channel.send( 
            `BEEP BOOP:
            > ${message.content}`
        );
    }
});