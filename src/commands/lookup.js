import { SlashCommandBuilder } from "discord.js";
import { info, error, format, debug, LogOptions} from '../logger.js';
import { getGuildMember } from "../guild/guildlookup.js";
import GuildMember from "../guild/guildmember.js";

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
        await interaction.deferReply({ ephemeral: true });
        try {
            let searchMember = interaction.options.data.find( o => o.name === 'member').value;
            info(`${format.command(this.Name, interaction.user.username)} Looking up ${ searchMember }`, LogOptions.All);
            let guildy = await getGuildMember( searchMember );
            if( !guildy ) {
                info(`${format.command(this.Name, interaction.user.username)} Could not find ${ searchMember }`, LogOptions.LocalOnly);
                await interaction.followUp({
                    content:`Could not find ${searchMember}. Please double check the spelling and try again`,
                    ephemeral: true
                })
            }
            else {
                //Simplify response for privacy
                let simple = {
                    gw2Id: guildy.gw2ID,
                    username: guildy.discord.username,
                    nickname: guildy.nickname,
                    agreedToTerms: guildy.agreedToTerms,
                    status: guildy.status,
                    registered: guildy.registered,
                    buildGiven: guildy.guildBuildGiven,
                    joined: guildy.joined,
                }
                debug(`${format.command(this.Name, interaction.user.username)} Found ${  JSON.stringify(simple) }`);
                await interaction.followUp({
                    content:`Found: ${searchMember} \`\`\`json\n${ JSON.stringify(simple, undefined, 2) }\`\`\``,
                    ephemeral: true
                });
            }
        }catch( err ) {
            error(`${format.command(this.Name, interaction.user.username)} ${err}` );
            await interaction.reply( {
                content: `Error while executing command. See logs.`,
                ephemeral: true
            } );
        }
    }
};