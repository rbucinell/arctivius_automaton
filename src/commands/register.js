import { SlashCommandBuilder } from "discord.js";
import { info, warn, error} from '../logger.js';
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
        await interaction.deferReply();
        info( `Register Command: Initiated by ${interaction.user.username}`);
        try {
            
            let gw2Id = interaction.options.data.find( o => o.name === 'gwid').value;
            info( `Register Command: Setting ${interaction.user.username} to ${ gw2Id }`, true);
            
            let guildy = await getGuildMemberByGW2Id( gw2Id );
            if( guildy ){ 
                info( `Register Command: Found guildy: ${guildy}. Assigning ${ interaction.user.username}.`); 
                let success = await setDiscordUserName( gw2Id, interaction.user.username);
                await interaction.followUp(`${success? "Successfully set username." : "Failed to set username"}`, { ephemeral: true });
            } 
            else { 
                warn(`Register Command: No guildy found`, true);
                await interaction.followUp(`Could not find ${gw2Id}. Please double check the spelling and try again. Otherwise contact an officer.`, { ephemeral: true });
            }
        }catch( err ) {
            error( `Register Command: ${err}`, true );
            await interaction.followUp( `Error while executing command. See logs.`, { ephemeral: true } );
        }
    }
};