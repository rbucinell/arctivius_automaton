import { SlashCommandBuilder } from "discord.js";
import dayjs from 'dayjs';
import { debug, info, error, format, LogOptions } from '../logger.js';
import { AttendanceManager } from '../wvw/attendance/manager.js';
import { settings } from "../util.js";
import { getSentrySpanFromCommand } from "./util/comannd-utils.js";
import * as Sentry from "@sentry/node";
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
					.setRequired(true))
			.addBooleanOption(option =>
				option.setName('report').setDescription('Generate the monthly report?'));
};

    // interaction.guild is the object representing the Guild in which the command was run
    static async execute( interaction ) {
		await interaction.deferReply();
		
		//Sentry.startSpan(getSentrySpanFromCommand(attendance.Name, interaction), async ()=> {

			if( interactionPermissionValidated(this.Name, interaction ) )
			{
				let dateOption = interaction.options.data.find( o => o.name === 'date');
				let report = interaction.options.data.find( _ => _.name === 'report') || false;
				let date = dayjs(dateOption.value).toDate();
				info(`${format.command(this.Name, interaction.user.username)} Taking attendance for ${date.toDateString()}`, LogOptions.All );
				try{
					await AttendanceManager.ReportAttendance( date, true, report );
				}
				catch( err ) {
					error( err );
				}
				await interaction.deleteReply();
			}
			else{
				debug(`User ${interaction.user.username} does not have permission to run the command`);
				await interaction.followUp({
					content: `You do not have permission to execute this command`,
					ephemeral: true
				});
			}

		//});
    }
};