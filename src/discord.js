import dotenv from 'dotenv';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration.js';
import relativeTime from 'dayjs/plugin/relativeTime.js';

import * as Attendence from './wvw/attendence.js'

dayjs.extend(duration);
dayjs.extend(relativeTime)
import { info, dinfo, warn, dlog} from './logger.js';

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

const GUILD_CBO = '468951017980035072';
const CHANNEL_WVW_LOGS = '947356699948376134';
const CHANNEL_BOT_CHANNEL = '516420055224025108';
const CHANNEL_OFFICERS = '698556119223894076';
const CHANNEL_ATTENDENCE = '1116819277970939975';

const GUILD_SWIFTSTRIKER00 = '1039007357381922856';
const CHANNEL_SWIFTSTRIKER00_GENERAL = '1039007358652780586';

client.login( process.env.DISCORD_BOT_TOKEN);
client.on('ready', async ()=>{
    info(`Using [BOT] ${client.user.tag}`);

    const ss_guild = client.guilds.cache.get(GUILD_SWIFTSTRIKER00);
    const ss_channel = ss_guild.channels.cache.get(CHANNEL_SWIFTSTRIKER00_GENERAL);

    const cbo_guild = client.guilds.cache.get(GUILD_CBO);
    const cbo_channel = cbo_guild.channels.cache.get(CHANNEL_WVW_LOGS);

    const test_message_id = '1117998072027418624';
    const test_message = await cbo_channel.messages.fetch(test_message_id);

    console.log( test_message );

    dinfo(ss_guild.name,ss_channel.name,client.user.username,test_message.content);
    ss_channel.send({ content: test_message.content });

    // Attendence.registerMessageCreateWatcher(client);
    // let lastreported = dayjs().subtract( 12, 'hours' );
    // let now = dayjs();
    // let eightago = dayjs().subtract(8,'hour')
    // let lastPost = dayjs().subtract(1,'hours')
    // const cbo = client.guilds.cache.get('468951017980035072');
    // const channel_wvwlogs = cbo.channels.cache.get(CHANNEL_WVW_LOGS);
    // const test_message_id = '1117998072027418624';
    // const test_message = await channel_wvwlogs.messages.fetch(test_message_id);
    // await Attendence.processMessageCreate( test_message );
    // const url = test_message.embeds[0].data;
    // console.log( url );








    let cat = 5;

});
