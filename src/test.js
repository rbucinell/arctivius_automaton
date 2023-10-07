import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration.js';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import * as CombatAttendance from './wvw/attendance/combatlogattendance.js';
import * as TeamSpeakAttendance from './wvw/attendance/teamspeakattendance.js';
import { info, dinfo, warn, dlog} from './logger.js';
import { Client, GatewayIntentBits, SnowflakeUtil, Team } from 'discord.js';
import { Collection, Constants, Events } from 'discord.js';
import { gw2 } from './resources/gw2api/api.js'
import { setCommands } from './commands/commands.js';
import { getGuildMember, getGuildMembers } from './guild/guildlookup.js';
import { scheduledVaultCheck, writeVaultMessages, getLatestIdFromDiscord } from './guild/guildvault.js';
import { DiscordManager } from './discord/manager.js';

dotenv.config()
dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.extend(utc)
dayjs.extend(timezone);

const urlRegex = /([\w+]+\:\/\/)?([\w\d-]+\.)*[\w-]+[\.\:]\w+([\/\?\=\&\#\.]?[\w-]+)*\/?/gm;
const COOLDOWN_REPORT_TIME  = 8;
let lastreported = dayjs().subtract( 12, 'hours' );
let reports = {};
let mostRecentPost =  dayjs().subtract( 12, 'hours' );
let timeoutID = null;

await DiscordManager.Login();

await writeVaultMessages([]);
await scheduledVaultCheck();
// let response = TeamSpeakAttendance.getNextOnSchedule();

// //Test Guild Logs 
// gw2.apikey = process.env.GW2_API_TOKEN_PYCACHU;
// let PACK_ID = '9F02DC40-A030-ED11-81AC-95DFE50946EB';
// let account = await gw2.account.get();
// let logs = await gw2.guild.log(PACK_ID);

// info(`Using [BOT] ${client.user.tag}`, false);
// registerVaultWatcher(client);
// await scheduledVaultCheck();
// debugger;




//     // registerVaultWatcher(client);
//     // await scheduledVaultCheck();

//     // debugger;


//     // //let pack = await getGuildMembers();
//     // //let arctivius = await getGuildMember( 'Arctivius' );
//     // const guild = client.guilds.cache.get(GUILD_CBO);
//     // const channel = guild.channels.cache.get(CHANNEL_SECRET_CHANNEL);
//     // const messages = await channel.messages.fetch( { limit: 2, });
//     // let content = JSON.parse(messages.first().toString().split('\`\`\`')[1].slice(4))
//     // let maxid = Math.max(...content.map( l => l.id )) ;
//     // const eventArchivesChannel = guild.channels.cache.get('993753389521453056');    
//     // let testAlevaMessage = await eventArchivesChannel.messages.fetch(5)
//     // debugger;
//     // //Test Guild Logs 
//     // gw2.apikey = process.env.GW2_API_TOKEN_PYCACHU;
//     // let PACK_ID = '9F02DC40-A030-ED11-81AC-95DFE50946EB';
//     // let account = await gw2.account.get();
//     // let logs = await gw2.guild.log(PACK_ID);
//     // let treasury = logs.filter( ge => ge.type === 'treasury' );
//     // let stash = logs.filter( ge => ge.type === 'stash' && ge.coins > 0 && ge.operation === 'deposit' );
//     // debugger;
//     //const arc = members.find( member => member.value.nickname === 'Arctivius');

//     //Attendance.registerDailyAttendance(client);
//     //let specialiazation = await gw2.specializations.get('7');
//     //let data = await checkTeamspeakAttendance()

//     // TeamSpeakAttendance.registerTeamSpeakRoleCall(client);
//     // let clients = await TeamSpeakAttendance.checkTeamspeakAttendance(client);
//     // await TeamSpeakAttendance.reportRollCall(clients);

//     // TeamSpeakAttendance.registerTeamSpeakRoleCall(client);
//     // let tsData = await TeamSpeakAttendance.takeRollCallFor('07/24/2023');
    
//     // CombatAttendance.registerDailyAttendance(client);
//     // let players = await CombatAttendance.takeAttendnce('07/24/2023');
//     // let response = await CombatAttendance.reportAttendance(players, CHANNEL_SECRET_CHANNEL, "07/24/2023", tsData);
//     debugger;
//     // return;
//     // //Test Guild Logs 
//     // gw2.apikey = process.env.GW2_API_TOKEN_PYCACHU;
//     // let PACK_ID = '9F02DC40-A030-ED11-81AC-95DFE50946EB';
//     // let account = await gw2.account.get();
//     // let logs = await gw2.guild.log(PACK_ID);
//     // let treasury = logs.filter( ge => ge.type === 'treasury' );
//     // let stash = logs.filter( ge => ge.type === 'stash' && ge.coins > 0 && ge.operation === 'deposit' );


//     // const guild = client.guilds.cache.get(GUILD_CBO);
//     // const channel = guild.channels.cache.get(CHANNEL_SECRET_CHANNEL);
//     // let specialiazations = await gw2.specializations.get();
//     // let tempest = specialiazations.find( s => s.name.toLowerCase() === 'tempest');
//     // channel.send({content: '<:bork:1077799841750601829>' });
//     // let cat = 5;

//     // for( let e of guild.emojis.cache )
//     // {
//     //     let [id,emoji] = e;
//     //     //channel.send(`${emoji.name}`);
//     //     channel.send( `${emoji.name}, ${emoji.id}, <:${emoji.name}:${emoji.id}>`);
//     //     break;
//     // }

//     //const emojiList = guild.emojis.cache.map(emoji => emoji.toString()).join(" ");
//     //channel.send(emojiList);
 

//     //await Attendance.takeAttendnce( "06/26/2023" )
//     // console.log( test_message );

//     // dinfo(ss_guild.name,ss_channel.name,client.user.username,test_message.content);
//     // ss_channel.send({ content: test_message.content });

//     // Attendance.registerMessageCreateWatcher(client);
//     // let lastreported = dayjs().subtract( 12, 'hours' );
//     // let now = dayjs();
//     // let eightago = dayjs().subtract(8,'hour')
//     // let lastPost = dayjs().subtract(1,'hours')
//     // const cbo = client.guilds.cache.get('468951017980035072');
//     // const channel_wvwlogs = cbo.channels.cache.get(CHANNEL_WVW_LOGS);
//     // const test_message_id = '1117998072027418624';
//     // const test_message = await channel_wvwlogs.messages.fetch(test_message_id);
//     // await Attendance.processMessageCreate( test_message );
//     // const url = test_message.embeds[0].data;
//     // console.log( url );
// });

// client.on(Events.InteractionCreate, async interaction => {
// 	if (!interaction.isChatInputCommand()) return;

// 	const command = interaction.client.commands.get(interaction.commandName);

// 	if (!command) {
// 		console.error(`No command matching ${interaction.commandName} was found.`);
// 		return;
// 	}

// 	try {
// 		await command.execute(interaction);
// 	} catch (error) {
// 		console.error(error);
// 		if (interaction.replied || interaction.deferred) {
// 			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
// 		} else {
// 			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
// 		}
// 	}
// });