import { REST, Routes } from 'discord.js';
import * as botcommands from './src/commands/commands.js';
import dotenv from 'dotenv';
dotenv.config();

const GUILD_CBO = '468951017980035072';
const clientId  = process.env.DISCORD_APP_ID;
const token     = process.env.DISCORD_BOT_TOKEN;
const guildId   = GUILD_CBO;

const commands = [];
for( const [name,command] of Object.entries(botcommands.commands))
{
    if('data' in command && 'execute' in command)
    {
        commands.push( command.data.toJSON() );
    }
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

// and deploy your commands!
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();

//FOR DELETING: https://discordjs.guide/slash-commands/deleting-commands.html#deleting-specific-commands
// const rest = new REST().setToken(token);

// // ...

// // for guild-based commands
// rest.delete(Routes.applicationGuildCommand(clientId, guildId, 'commandId'))
// 	.then(() => console.log('Successfully deleted guild command'))
// 	.catch(console.error);

// // for global commands
// rest.delete(Routes.applicationCommand(clientId, 'commandId'))
// 	.then(() => console.log('Successfully deleted application command'))
// 	.catch(console.error);