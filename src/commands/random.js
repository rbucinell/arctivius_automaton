import { SlashCommandBuilder } from "discord.js";
import { info, error, format} from '../logger.js';
import { getGuildMembers } from "../guild/guildlookup.js";

export default class random {

    static get Name() { return 'random' }
    
    static get data () {
        return new SlashCommandBuilder()
            .setName(random.Name)
            .setDescription('Pick a random guild member!')
            .addBooleanOption(option =>
                option.setName('ephemeral').setDescription('Should the response be ephemeral (ephemeral means only you see response)?'));
    };

    /**
     * Interaction.guild is the object representing the Guild in which the command was run
     **/
    static async execute( interaction ) {
        try {
            let guildmembers = await getGuildMembers();
            guildmembers = guildmembers.filter( _ => _.status !== 'Blackballed' );
            let guildy = guildmembers[Math.floor(Math.random()*guildmembers.length) ];
            info(`${format.command(this.Name, interaction.user.username)} Randomly selected user: ${displayGuildMember(guildy)}`, true, true);
            let ephemeral = interaction.options.data.find( o => o.name === 'ephemeral');
            if( !ephemeral ){
                ephemeral = true;
            }
            else { 
                ephemeral = ephemeral.value === true || `${ephemeral.value}`.toLowerCase() === 'true';
            }
            await interaction.reply({
                content: `Randomly selected user: ${displayGuildMember(guildy)}`,
                ephemeral: ephemeral
            });
        } catch( err ) {
            error(`${format.command(this.Name)} ${err}`, true);
        }
    }
};

function displayGuildMember( guildMember ) {
    return `**${ guildMember.teamspeakName }**, gw2: \`${guildMember.gw2ID}\`, discord: \`${ guildMember.discordID }\``
}