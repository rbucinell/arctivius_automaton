import { REST, Routes } from 'discord.js';
import * as botcommands from './src/commands/commands.js';
import dotenv from 'dotenv';
import { CrimsonBlackout } from './src/discord/ids.js';

dotenv.config({ quiet: true });

const clientId  = process.env.DISCORD_APP_ID;
const token     = process.env.DISCORD_BOT_TOKEN;
const guildId   = CrimsonBlackout.GUILD_ID.description;

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

// for guild-based commands
// rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] })
// 	.then(() => console.log('Successfully deleted all guild commands.'))
// 	.catch(console.error);

// // for global commands
// rest.delete(Routes.applicationCommand(clientId, 'commandId'))
// 	.then(() => console.log('Successfully deleted application command'))
// 	.catch(console.error);



// (async () => {
// 	try {
// 		console.log(`Started deleting ${commands.length} application (/) commands.`);
		
// 		rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] })
// 	.then(() => console.log('Successfully deleted all guild commands.'))
// 	.catch(console.error);
	
// 	} catch (error) {
// 		// And of course, make sure you catch and log any errors!
// 		console.error(error);
// 	}
// })();