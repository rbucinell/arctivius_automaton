import { SlashCommandBuilder } from "discord.js";
import { info, error, format, LogOptions } from '../logger.js';
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
        const user = interaction.user;
        //discordId. Legacy (it actually refers to username so thats bad). 
        //This will get phased out in favor of: registration.discord.id
        let discordId = interaction.user.username;
        
        try {
            let gw2Id = interaction.options.data.find( o => o.name === 'gwid').value;   
            info(`${format.command(this.Name, user.username)} Registering \`${ gw2Id }\``, LogOptions.All );

            if( !gw2Id ) {
                await interaction.followUp({
                    content: `Error reading GuidWars2 ID: \`${gw2Id}\`. Failed to register`,
                    ephemeral: true
                });
            }
            else {
                let success = false;
                const findResponse = await registrations.findOne( { "discord.id": user.id } );
                if( findResponse ) {
                    const updateResponse = await registrations.updateOne({ "discord.id": user.id }, {$set: { gw2Id , date, discord:{ 
                        id: user.id, 
                        username: user.username
                    } }}) ;
                    success = updateResponse.matchedCount === 1 && updateResponse.modifiedCount === 1;
                } else {
                    const insertResponse = await registrations.insertOne( { 
                        discordId: user.username, 
                        gw2Id , 
                        date, 
                        discord:{ 
                            id: user.id, 
                            username: user.username
                        }
                    });
                    success = insertResponse.acknowledged;
                }
                if( success ){
                    try{
                        const guild = DiscordManager.Client.guilds.cache.get(CrimsonBlackout.GUILD_ID.description);
                        let guildMembers = await guild.members.fetch();
                        let foundUser = guildMembers.find( _ => _.user.id === user.id );
                        await foundUser.roles.add( register.RoleId);
                    }catch(err){
                        error(err);
                    }
                }
                await interaction.followUp({
                    content: `${success? "Successfully registered" : "Failed to register"} GuildWars2 ID: \`${ gw2Id }\``,
                    ephemeral: true
                });
            }
        }
        catch( err ) {
            error(`${format.command(this.Name, user.username)} Error: ${err}`);
        }
    }
};