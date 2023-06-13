import dotenv from 'dotenv';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration.js';
import relativeTime from 'dayjs/plugin/relativeTime.js';

import * as Attendence from './wvw/attendence.js'

dayjs.extend(duration);
dayjs.extend(relativeTime)
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

const GUILD_CBO = '468951017980035072';

const CHANNEL_WVW_LOGS = '947356699948376134';
const CHANNEL_BOT_CHANNEL = '516420055224025108';
const CHANNEL_OFFICERS = '698556119223894076';
const CHANNEL_ATTENDENCE = '1116819277970939975';

client.login( process.env.DISCORD_BOT_TOKEN);
client.on('ready', async ()=>{
    info(`Using [BOT] ${client.user.tag}`);
    Attendence.registerMessageCreateWatcher(client);
    let lastreported = dayjs().subtract( 12, 'hours' );
    let now = dayjs();
    let eightago = dayjs().subtract(8,'hour')
    let lastPost = dayjs().subtract(1,'hours')
    const cbo = client.guilds.cache.get('468951017980035072');
    const channel_wvwlogs = cbo.channels.cache.get(CHANNEL_WVW_LOGS);
    const test_message_id = '1117998072027418624';
    const test_message = await channel_wvwlogs.messages.fetch(test_message_id);
    await Attendence.processMessageCreate( test_message );
    //const url = test_message.embeds[0].data;








    let cat = 5;

});
