import dotenv from 'dotenv';
import dayjs from 'dayjs';
import * as Attendence from './wvw/attendence.js';
import { info, dinfo, warn, dlog} from './logger.js';
const urlRegex = /([\w+]+\:\/\/)?([\w\d-]+\.)*[\w-]+[\.\:]\w+([\/\?\=\&\#\.]?[\w-]+)*\/?/gm;
const COOLDOWN_REPORT_TIME  = 8;
const GUILD_CBO = '468951017980035072';
const CHANNEL_WVW_LOGS = '947356699948376134';
const CHANNEL_BOT_CHANNEL = '516420055224025108';
const CHANNEL_OFFICERS = '698556119223894076';
const CHANNEL_ATTENDENCE = '1116819277970939975';
const USER_ID_LOG_STREAM_ADAM = '1106957129463644242';
const GUILD_SWIFTSTRIKER00 = '1039007357381922856';
const CHANNEL_SWIFTSTRIKER00_GENERAL = '1039007358652780586';
let lastreported = dayjs().subtract( 12, 'hours' );
let reports = {};
let mostRecentPost =  dayjs().subtract( 12, 'hours' );
let timeoutID = null;


dayjs.extend(duration);
dayjs.extend(relativeTime);
dotenv.config()

import { Client, GatewayIntentBits, SnowflakeUtil } from 'discord.js';
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
    info(`Using [BOT] ${client.user.tag}`);

    const ss_guild = client.guilds.cache.get(GUILD_SWIFTSTRIKER00);
    const ss_channel = ss_guild.channels.cache.get(CHANNEL_SWIFTSTRIKER00_GENERAL);

    const guild = client.guilds.cache.get(GUILD_CBO);
    const channel_wvwlogs = guild.channels.cache.get(CHANNEL_WVW_LOGS);
    const today = dayjs();
    const yesterday = dayjs('06/19/2021');
    const messages = await channel_wvwlogs.messages.fetch({
        limit: 50,
        after: SnowflakeUtil.generate({ timestamp: yesterday.toDate() })
    });

    let now = dayjs();
    let next = now.add(1, 'day').set('hour',0).set('minute',30).set('second',0);
    let timebetween = next.diff(now);
    console.log( now.to(next) );
    console.log( now, next, timebetween);
    before.forEach( msg => console.log( msg.content ));


    const cbo_guild = client.guilds.cache.get(GUILD_CBO);
    const cbo_channel = cbo_guild.channels.cache.get(CHANNEL_WVW_LOGS);


    const test_message_id = '1121315512178200699';
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