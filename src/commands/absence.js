import { SlashCommandBuilder } from "discord.js";
import { info, error, format} from '../logger.js';
import { getGuildMemberByDiscord } from "../guild/guildlookup.js";
import { DiscordManager } from "../discord/manager.js";
import { CrimsonBlackout } from "../discord/ids.js";

export default class absence {
    
    static get Name () { return 'absence' }

    static get data () {
        return new SlashCommandBuilder()
            .setName('absence')
            .setDescription('Nofity PACK when you\re out of town.') 
			.addStringOption(option =>
				option.setName('start')
					.setDescription('The date you will be leaving on')
					.setRequired(true))
            .addStringOption(option =>
                option.setName('end')
					.setDescription('The last date you\'ll be gone.')
					.setRequired(true))
            .addStringOption(option =>
                option.setName('note')
                    .setDescription('Anything you want to add')
                    .setRequired(false));
    };

    //Access client via: interaction.client
    static async execute( interaction ) {
        try{
            await interaction.deferReply({ ephemeral: true });
            let username = interaction.user.username;
            let start = interaction.options.data.find( _ => _.name === 'start' );
            let end = interaction.options.data.find( _ => _.name === 'end' );
            let note = interaction.options.data.find( _ => _.name === 'note' );


            info(`${format.command(absence.Name, username)} ${start.value} - ${end.value}. ${note.value}`, true, true);
            const guild = await DiscordManager.Client.guilds.fetch( CrimsonBlackout.GUILD_ID.description );
            const channel_absence = guild.channels.cache.get(CrimsonBlackout.CHANNEL_LEAVE_OF_ABSENCE.description);

            let guildMember = await getGuildMemberByDiscord(username);
            let gw2IdMsg = guildMember ? ` (${guildMember.gw2ID })` : '';
            let message = `<@${interaction.user.id}>${gw2IdMsg} will be afk: ${start.value} - ${end.value}`;
            if( note ) {
                message += `\nNote: ${note.value}`;
            }

            await channel_absence.send({ content: message });

            await interaction.followUp({
                content: `Your abscense has  been recorded. Thanks for being communicative, it helps a lot!`,
                ephemeral: true
            });

        }catch( err ){
            error( err, true)
            interaction.followUp( {content:`Error in command: ${err}`,ephemeral:true} );
        }
    }
}