import { SlashCommandBuilder } from "discord.js";
import { info, warn, error, format } from '../logger.js';
import { getGuildMemberByGW2Id, setDiscordUserName } from "../guild/guildlookup.js";

export default class register {

    static get Name(){ return 'register'; }
    
    static get data () {
        return new SlashCommandBuilder()
            .setName(register.Name)
            .setDescription('Register your discord username with your gw2 ID for CBo/PACK')
			.addStringOption(option => option.setName('gwid')
                .setDescription('Your GW2 ID. (eg: ABC XYZ.####)')
                .setRequired(true));
    };
    
    static async execute( interaction ) {
        await interaction.deferReply();
        info(`${format.command(this.Name, interaction.user.username)} Initiated`, true, true);
        try {
            
            let gw2Id = interaction.options.data.find( o => o.name === 'gwid').value;
            
            let guildy = await getGuildMemberByGW2Id( gw2Id );
            if( guildy ){ 
                let success = await setDiscordUserName( gw2Id, interaction.user.username);
                info(`${format.command(this.Name, interaction.user.username)} Update Complete. ${success? "Successfully set username." : format.error("Failed to set username") }`, true, true);
                await interaction.followUp(`${success? "Successfully set username." : "Failed to set username"}`, { ephemeral: true });
            } 
            else { 
                warn(`${format.command(this.Name, interaction.user.username)} No Guild Member Found`, true, true );
                await interaction.followUp(`Could not find ${gw2Id}. Please double check the spelling and try again. Otherwise contact an officer.`, { ephemeral: true });
            }
        }catch( err ) {
            error(`${format.command(this.Name, interaction.user.username)} Error: ${err}`, true, false);
            await interaction.followUp( `Error while executing command. See logs.`, { ephemeral: true } );
        }
    }
};