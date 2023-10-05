import { SlashCommandBuilder } from "discord.js";
import { info, error} from '../logger.js';
import { getGuildMember } from "../guild/guildlookup.js";

export default class lookup {
    
    static get data () {
        return new SlashCommandBuilder()
            .setName('lookup')
            .setDescription('Lookup a guild member.')
			.addStringOption(option =>
				option.setName('member')
					.setDescription('The name of the guild member as refences in the "Pack Squad Comp" document.')
					.setRequired(true));
    };

    // interaction.guild is the object representing the Guild in which the command was run
    static async execute( interaction ) {
        try {
            let searchMember = interaction.options.data.find( o => o.name === 'member').value;
            info( `Lookup Commnand: Searching for ${ searchMember }`);
            let guildy = await getGuildMember( searchMember );
            if( !guildy ) {
                await interaction.reply(`Could not find ${searchMember}. Please double check the spelling and try again`);
            }
            else {
                await interaction.reply(`Found: ${searchMember} \`\`\`json\n${ JSON.stringify(guildy) }\`\`\``);
            }
        }catch( err ) {
            error( `Looup Command: ${err}`, true );
            await interaction.reply( `Error while executing command. See logs.` );
        }
    }
};