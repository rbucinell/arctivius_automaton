import { SlashCommandBuilder } from "discord.js";
import { info, error} from '../logger.js';
import { getAPIKey,setAPIKey } from '../guild/guildlookup.js';

export default class apikey {

    static get data () {
        return new SlashCommandBuilder()
            .setName('apikey')
            .setDescription('Configure API Key for Arctivius\'s Automaton')
            .addSubcommand( subCommand => subCommand
                .setName('set')
                .setDescription('registers your api key')
                .addStringOption(option => option
                    .setName('api-key')
                    .setDescription('You\'re API key (progress premission needed)')
                    .setRequired(true)))
            .addSubcommand( subCommand => subCommand
                .setName('view')
                .setDescription('view your registered api key') )
            .addSubcommand( subCommand => subCommand
                .setName('clear')
                .setDescription('remove your api key from records') );
    }

    static async execute( interaction ) {
        try{
            await interaction.deferReply();

            const subCommand = interaction.options.getSubcommand();
            if (!subCommand) {
                return await interaction.reply({content:'You need to provide a subcommand!',ephemeral:true});
            }
            let username = interaction.user.username;
            info( `Discord User: ${interaction.user.id} (${username}) called apikey command: ${subCommand}`, true);
            // Here you can handle different subcommands
            if (subCommand === 'set') {
                let apikey = interaction.options.data[0].options[0].value;
                let success = await setAPIKey(username, apikey);
                info( `Discord User: ${interaction.user.id} (${username}) setting apikey to ${apikey}. Success = ${success}`, true);
                await interaction.followUp({ content: `${success? `Successfully set apikey to '\`${apikey}\`'.` : "Failed to set apikey"}`, ephemeral: true });
            } else if (subCommand === 'view') {
                let apikey = await getAPIKey( username );
                await interaction.followUp({ content: `Automaton API Key found '\`${apikey}\`'`, ephemeral: true });
            } else if( subCommand === 'clear' ) {
                let success = await setAPIKey(username, '');
                await interaction.followUp({ content: `${success? "Successfully cleared apikey." : "Failed to cleared apikey"}`, ephemeral: true });
            } else {
                await interaction.followUp({content:'Invalid Command',ephemeral:true});
            }
        }catch( err ){
            error( err, true)
            interaction.followUp( {content:`Error in command: ${err}`,ephemeral:true} );
        }

    }
};