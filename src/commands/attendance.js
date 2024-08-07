import { SlashCommandBuilder } from "discord.js";
import dayjs from 'dayjs';
import { info, error, format, LogOptions } from '../logger.js';
import { AttendanceManager } from '../wvw/attendance/manager.js';

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


export default class attendance {

	static get Name () { return 'attendance' }

    static get data () {
        return new SlashCommandBuilder()
            .setName('attendance')
            .setDescription('Provides attendance for the given day')
			.addStringOption(option =>
				option.setName('date')
					.setDescription('The date to take attendance on')
					.setRequired(true));
    };

    // interaction.guild is the object representing the Guild in which the command was run
    static async execute( interaction ) {
		await interaction.deferReply();

		if( interactionPermissionValidated(this.Name, interaction ) )
		{
			let dateOption = interaction.options.data.find( o => o.name === 'date');
			let date = dayjs(dateOption.value).toDate();
			info(`${format.command(this.Name, interaction.user.username)} Taking attendance for ${date.toDateString()}`, LogOptions.All );
			try{
				await AttendanceManager.ReportAttendance( date, true );
			}
			catch( err ) {
				error( err, LogOptions.LocalOnly );
			}
			await interaction.deleteReply();
		}
		else{
			await interaction.followUp({
                content: `You do not have permission to execute this command`,
                ephemeral: true
            });
		}
    }
};