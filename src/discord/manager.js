import dotenv from 'dotenv';
import { Client, Events, GatewayIntentBits } from 'discord.js';
import { setCommands } from '../commands/commands.js';
import { error, info, format } from '../logger.js';
dotenv.config();

export class DiscordManager {

    static #client;

    /**
     * Gets the Discord client
     */
    static get Client() {
        if( !this.#client ){
            this.#createClient();
        }
        return this.#client;
    }

    static #createClient() {
        this.#client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.DirectMessages,
                GatewayIntentBits.MessageContent        
            ]
        });
        setCommands(this.#client);

        this.#client.on(Events.InteractionCreate, async interaction => {
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
    }

    /**
     * Asyncronously logs the client into discord authenticated by the provided token
     * 
     * @param {string} discordToken (optional) secret bot token taken from env.DISCORD_BOT_TOKEN or provided
     * @returns {Promise} 
     */
    static Login( discordToken  = process.env.DISCORD_BOT_TOKEN ) {
        return new Promise( (resolve,reject) => {
            try{
                this.Client.login( discordToken );
                this.Client.on( 'ready', ()=> {
                    info(`Logged in as ${ format.color('green', this.Client.user.tag)}`, true, true);
                    this.Client.user.setActivity('Waiting for Commands. BEEP BOOP.', { type: "WATCHING"});
                    this.Client.user.setStatus('online');
                    resolve();
                });
            } catch( err ) {
                error(err);
                reject(err);
            }
        });
    }

}