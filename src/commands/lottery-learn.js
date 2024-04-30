import { SlashCommandBuilder } from "discord.js";
import { info, error, format} from '../logger.js';
import { getGuildMembers } from "../guild/guildlookup.js";

export default class lotterylearn {

    static get Name() { return 'lotterylearn' }
    
    static get data () {
        return new SlashCommandBuilder()
            .setName(lotterylearn.Name)
            .setDescription('Pick a random guild member to learn something new')
            .addBooleanOption(option =>
                option.setName('ephemeral').setDescription('Whether or not the echo should be ephemeral'));
    };

    /**
     * Interaction.guild is the object representing the Guild in which the command was run
     **/
    static async execute( interaction ) {
        try {
            let guildmembers = await getGuildMembers();
            let guildy = guildmembers[Math.floor(Math.random()*guildmembers.length) ];
            info(`${format.command(this.Name, interaction.user.username)} Picked ${ guildy.teamspeakName } (${guildy.gw2ID}) to learn something new`, true, true);
            let ephemeral = interaction.options.data.find( o => o.name === 'ephemeral');
            if( !ephemeral ){
                ephemeral = true;
            }
            else { 
                ephemeral = ephemeral.value === true || `${ephemeral.value}`.toLowerCase() === 'true';
            }
            await interaction.reply({
                content: `I randomly picked: ${ guildy.teamspeakName }\n${ guildy.gw2ID } | ${ guildy.discordID }.\n### Main Role:\n${ guildy.mainClass }.\n### Secondary Role:\n${ guildy.secondaryClass ?? 'None' }\n### Willing to learn:\n${guildy.willingToLearnClass}`,
                ephemeral: ephemeral
            });
        }catch( err ) {
            error(`${format.command(this.Name)} ${err}`, true);
        }
    }
};