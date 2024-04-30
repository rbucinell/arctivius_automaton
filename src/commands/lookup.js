import { SlashCommandBuilder } from "discord.js";
import { info, error, format, debug} from '../logger.js';
import { getGuildMember } from "../guild/guildlookup.js";

export default class lookup {

    static get Name(){ return 'lookup' }
    
    static get data () {
        return new SlashCommandBuilder()
            .setName(lookup.Name)
            .setDescription('Lookup a guild member.')
			.addStringOption(option =>
				option.setName('member')
					.setDescription('The name of the guild member as refences in the "Pack Squad Comp" document.')
					.setRequired(true));
    };

    // interaction.guild is the object representing the Guild in which the command was run
    static async execute( interaction ) {
        try {
            info(`${format.command(this.Name, interaction.user.username)} Looking up ${ searchMember }`, true, true);
            let searchMember = interaction.options.data.find( o => o.name === 'member').value;
            let guildy = await getGuildMember( searchMember );
            if( !guildy ) {
                info(`${format.command(this.Name, interaction.user.username)} Could not find ${ searchMember }`, true, false);
                await interaction.reply(`Could not find ${searchMember}. Please double check the spelling and try again`);
            }
            else {
                //Simplify response for privacy
                let commandResponseObj = { 
                    gw2ID: guildy.gw2ID, 
                    discordID: guildy.discordID, 
                    teamspeakName: guildy.teamspeakName,
                    agreedToTerms: guildy.agreedToTerms,
                    status: guildy.status,
                    mainRole: guildy.mainRole,
                    mainClass: guildy.mainClass,
                    additionalClasses: guildy.additionalClasses,
                    guildBuildGiven: guildy.guildBuildGiven,
                    language: guildy.language
                };
                debug(`${format.command(lookup.Name, interaction.user.username)} Found ${  JSON.stringify(commandResponseObj) }`, true, false);
                await interaction.reply(`Found: ${searchMember} \`\`\`json\n${ JSON.stringify(commandResponseObj) }\`\`\``);
            }
        }catch( err ) {
            error( `Looup Command: ${err}`, true );
            await interaction.reply( `Error while executing command. See logs.` );
        }
    }
};