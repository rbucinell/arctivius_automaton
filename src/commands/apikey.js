import { SlashCommandBuilder } from "discord.js";
import { info, error} from '../logger.js';
import { AttendanceManager } from '../wvw/attendance/manager.js';

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

    // interaction.guild is the object representing the Guild in which the command was run
    static async execute( interaction ) {
        await interaction.deferReply();
        const subCommand = interaction.options.getSubcommand();
        if (!subCommand) {
            return await interaction.reply('You need to provide a subcommand!');
        }

        // Here you can handle different subcommands
        if (subCommand === 'set') {
            await interaction.followUp({ content: 'You called set command. It does nothing yet, sorry', ephemeral: true });
        } else if (subCommand === 'view') {
            await interaction.followUp({ content: 'You called view command. It does nothing yet, sorry', ephemeral: true });
        } else if( subCommand === 'clear' ) {
            await interaction.followUp({ content: 'You called clear command. It does nothing yet, sorry', ephemeral: true });
        } else {
            await interaction.followUp('Invalid Command');
        }

    }
};