import { SlashCommandBuilder } from "discord.js";
import { info, error} from '../logger.js';
import { getGuildMemberByGW2Id, setDiscordUserName } from "../guild/guildlookup.js";

export default class register {
    
    static get data () {
        return new SlashCommandBuilder()
            .setName('register')
            .setDescription('Register your discord username with your gw2 ID for CBo/PACK')
			.addStringOption(option => option.setName('gwid')
                .setDescription('Your GW2 ID. (eg: ABC XYZ.####)')
                .setRequired(true));
    };

    static async execute( interaction ) {
        try {
            await interaction.deferReply();
            let gw2Id = interaction.options.data.find( o => o.name === 'gwid').value;
            info( `Register Commnand: Setting ${interaction.user.username} to ${ gw2Id }`, true);
            let guildy = await getGuildMemberByGW2Id( gw2Id );
            if( !guildy ) {
                await interaction.reply(`Could not find ${gw2Id}. Please double check the spelling and try again. Otherwise contact an officer.`);
            }
            else {
                let success = await setDiscordUserName( gw2Id, interaction.user.username);
                await interaction.reply(`${success? "Successfully set username." : "Failed to set username"}`);
            }
        }catch( err ) {
            error( `Register Command: ${err}`, true );
            await interaction.reply( `Error while executing command. See logs.` );
        }
    }
};