import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration.js';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import * as CombatAttendence from './wvw/attendence/combatlogattendence.js';
import * as TeamSpeakAttendence from './wvw/attendence/teamspeakattendence.js';
import { info, dinfo, warn, dlog} from './logger.js';
import { Client, GatewayIntentBits, SnowflakeUtil, Team } from 'discord.js';
import { Collection, Constants, Events } from 'discord.js';
import { gw2 } from './gw2api/api.js';
import { setCommands } from './commands/commands.js';
import { getGuildMembers } from './guild/guildlookup.js';
import { log } from 'node:console';
dotenv.config()
dayjs.extend(duration);
dayjs.extend(relativeTime);

const urlRegex = /([\w+]+\:\/\/)?([\w\d-]+\.)*[\w-]+[\.\:]\w+([\/\?\=\&\#\.]?[\w-]+)*\/?/gm;
const COOLDOWN_REPORT_TIME  = 8;
const GUILD_CBO = '468951017980035072';
const CHANNEL_WVW_LOGS = '947356699948376134';
const CHANNEL_BOT_CHANNEL = '516420055224025108';
const CHANNEL_OFFICERS = '698556119223894076';
const CHANNEL_ATTENDENCE = '1116819277970939975';
const CHANNEL_SECRET_CHANNEL = '1123288191462551562';
const USER_ID_LOG_STREAM_ADAM = '1106957129463644242';
const GUILD_SWIFTSTRIKER00 = '1039007357381922856';
const CHANNEL_SWIFTSTRIKER00_GENERAL = '1039007358652780586';
let lastreported = dayjs().subtract( 12, 'hours' );
let reports = {};
let mostRecentPost =  dayjs().subtract( 12, 'hours' );
let timeoutID = null;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent        
    ]
});
setCommands(client);

client.login( process.env.DISCORD_BOT_TOKEN);
client.on('ready', async ()=>{
    //Attendence.registerDailyAttendence(client);
    //let specialiazation = await gw2.specializations.get('7');
    //let data = await checkTeamspeakAttendence()
    
    TeamSpeakAttendence.registerTeamSpeakRoleCall(client);
    let clients = await TeamSpeakAttendence.checkTeamspeakAttendence(client);
    await TeamSpeakAttendence.reportRollCall(clients, CHANNEL_SECRET_CHANNEL);

    
    
    //let guildMembers = await getGuildMembers();
    info(`Using [BOT] ${client.user.tag}`, false);
    
    // let players = await Attendence.takeAttendnce();
    // await Attendence.reportAttendence(players, CHANNEL_ATTENDENCE);
    // return;
    // //Test Guild Logs 
    // gw2.apikey = process.env.GW2_API_TOKEN_PYCACHU;
    // let PACK_ID = '9F02DC40-A030-ED11-81AC-95DFE50946EB';
    // let account = await gw2.account.get();
    // let logs = await gw2.guild.log(PACK_ID);
    // let treasury = logs.filter( ge => ge.type === 'treasury' );
    // let stash = logs.filter( ge => ge.type === 'stash' && ge.coins > 0 && ge.operation === 'deposit' );


    // const guild = client.guilds.cache.get(GUILD_CBO);
    // const channel = guild.channels.cache.get(CHANNEL_SECRET_CHANNEL);
    // let specialiazations = await gw2.specializations.get();
    // let tempest = specialiazations.find( s => s.name.toLowerCase() === 'tempest');
    // channel.send({content: '<:bork:1077799841750601829>' });
    // let cat = 5;

    // for( let e of guild.emojis.cache )
    // {
    //     let [id,emoji] = e;
    //     //channel.send(`${emoji.name}`);
    //     channel.send( `${emoji.name}, ${emoji.id}, <:${emoji.name}:${emoji.id}>`);
    //     break;
    // }

    //const emojiList = guild.emojis.cache.map(emoji => emoji.toString()).join(" ");
    //channel.send(emojiList);
 

    //await Attendence.takeAttendnce( "06/26/2023" )
    // console.log( test_message );

    // dinfo(ss_guild.name,ss_channel.name,client.user.username,test_message.content);
    // ss_channel.send({ content: test_message.content });

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
});

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});