import { SlashCommandBuilder } from "discord.js";
import { info, error, format, LogOptions } from '../logger.js';
import { GuildSync as GuildSyncFunction } from '../guild/guildsync.js';
import { settings } from "../util.js";

/**
 * 
 * @param {string} command the name of the command
 * @param {*} interaction the command interaction
 */
function interactionPermissionValidated( command, interaction  ) {
	
	let perms = settings.commands.find( c => c.command === command )?.permissions;
	if( !perms ) return true;
	let roles = [...interaction.member.roles.cache.values()].map( n => n.id );
	if( perms.users.includes(interaction.member.id)) return true;
	for( let pr of perms.roles ){
		if( roles.includes(pr.id ) ) return true;
	}
	return false;	
}


export default class guildsync {

	static get Name () { return 'guildsync' }

    static get data () {
        return new SlashCommandBuilder()
            .setName('guildsync')
            .setDescription('Force a guild sync')
            .addStringOption(option =>
				option.setName('tag')
					.setDescription('The guild tag you want to sync (PACK, Cbo, FAM)')
					.setRequired(false));
    };

    // interaction.guild is the object representing the Guild in which the command was run
    static async execute( interaction ) {
		await interaction.deferReply({ ephemeral: true });

		if( interactionPermissionValidated(this.Name, interaction ) )
		{
            const tag = interaction.options.data.find( o => o.name === 'tag')?.value;
			info(`${format.command(this.Name, interaction.user.username)} Performing a guild sync`, LogOptions.All);

			try{
				await GuildSyncFunction.sync( tag, true );
                await interaction.followUp(`Guild Sync Complete`, { ephemeral: true });
			}
			catch( err ) {
				error( err, LogOptions.LocalOnly );
			}
		}
		else{
			await interaction.followUp({
                content: `You do not have permission to execute this command`,
                ephemeral: true
            });
		}
    }
};