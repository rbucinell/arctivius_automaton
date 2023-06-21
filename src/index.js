import dotenv from 'dotenv';
import * as Attendence from './wvw/attendence.js';
import { info, dinfo, warn} from './logger.js';

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

client.login( process.env.DISCORD_BOT_TOKEN);
client.on('ready', async ()=>{
    info(`Logged in as ${client.user.tag}`);
    client.user.setActivity('Waiting for Commands. BEEP BOOP.', { type: "WATCHING"});
    client.user.setStatus('online');
    Attendence.registerMessageCreateWatcher(client);
    Attendence.registerDailyAttendence(client);
    
});

// client.on( "messageCreate", async (message) => {
//     let server = client.guilds.cache.get( message.guildId );
//     let channel = client.channels.cache.get( message.channelId );

//     dinfo(server.name, channel.name, message.author.bot? `[BOT]${message.author.username}` : message.author.username, message.content);
//     if( channel.id === CHANNEL_WVW_LOGS && message.author.id !== client.user.id )
//     {
//         if( message.author.bot ) return;
        
//         warn(`🚨 It's Happening🚨`);
//         let messages = await processDiscordMessage( message );
//         messages.forEach( msg => client.channels.cache.get(CHANNEL_ATTENDENCE).send( {
//             content: msg,
//             embeds: []
//         }));
//     }

//     //info(`[${server.name}] #${channel.name} | ${message.author.username}: ${message.content}`);
//     if( message.author.username === 'swiftstriker00' && channel.name === 'bot-channel' )
//     {
//         channel.send( 
//             `BEEP BOOP:
//             > ${message.content}`
//         );
//     }
// });