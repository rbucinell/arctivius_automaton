import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Client, Collection, Constants, Events, GatewayIntentBits } from 'discord.js';
import { setCommands } from './commands/commands.js';
import * as CombatAttendance from './wvw/attendance/combatlogattendance.js';
import * as TeamSpeakAttendance from './wvw/attendance/teamspeakattendance.js';
import { info, dinfo, warn} from './logger.js';
dotenv.config()

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
    info(`Logged in as ${client.user.tag}`);
    client.user.setActivity('Waiting for Commands. BEEP BOOP.', { type: "WATCHING"});
    client.user.setStatus('online');
    CombatAttendance.registerMessageCreateWatcher(client);
    CombatAttendance.registerDailyAttendance(client);
	TeamSpeakAttendance.registerTeamSpeakRoleCall(client);
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
