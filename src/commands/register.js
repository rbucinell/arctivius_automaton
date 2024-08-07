import { SlashCommandBuilder } from "discord.js";
import { info, error, format, LogOptions } from '../logger.js';
import { registerDiscordUserName } from "../guild/guildlookup.js";
import { registrations } from '../resources/mongodb.js';
import { DiscordManager } from "../discord/manager.js";
import { CrimsonBlackout } from "../discord/ids.js";

export default class register {

    static get RoleId() { return CrimsonBlackout.ROLE_REGISTERED.description; }

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
        await interaction.deferReply({ ephemeral: true });
        const date = new Date();
        let discordId = interaction.user.username;
        try {
            let gw2Id = interaction.options.data.find( o => o.name === 'gwid').value;   
            info(`${format.command(this.Name, discordId)} Registering \`${ gw2Id }\``, LogOptions.All );

            if( !gw2Id ) {
                await interaction.followUp({
                    content: `Error reading GuidWars2 ID: \`${gw2Id}\`. Failed to register`,
                    ephemeral: true
                });
            }
            else {
                let success = false;
                const findResponse = await registrations.findOne( { discordId } );
                if( findResponse ) {
                    const updateResponse = await registrations.updateOne({ discordId }, {$set: { gw2Id , date }}) ;
                    success = updateResponse.matchedCount === 1 && updateResponse.modifiedCount === 1;
                } else {
                    const insertResponse = await registrations.insertOne( { discordId, gw2Id , date });
                    success = insertResponse.acknowledged;
                }
                if( success ){
                    try{
                        const guild = DiscordManager.Client.guilds.cache.get(CrimsonBlackout.GUILD_ID.description);
                        let guildMembers = await guild.members.fetch();
                        let user = guildMembers.find( _ => _.user.username === discordId );
                        await user.roles.add( register.RoleId);
                    }catch(err){
                        error(err);
                    }
                }
                await interaction.followUp({
                    content: `${success? "Successfully registered" : "Failed to register"} GuildWars2 ID: \`${ gw2Id }\``,
                    ephemeral: true
                });
            }
            
            

            let success = await registerDiscordUserName( gw2Id, discordId);
            info(`${format.command(this.Name, discordId)} PACK Doc: ${success? format.success("Successfully") : format.error("Failed to") } set discord username.`, LogOptions.All);
        }
        catch( err ) {
            error(`${format.command(this.Name, discordId)} Error: ${err}`);
        }
    }
};