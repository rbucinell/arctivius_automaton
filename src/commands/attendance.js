import { SlashCommandBuilder } from "discord.js";
import dayjs from 'dayjs';
import { info, error, format } from '../logger.js';
import { AttendanceManager } from '../wvw/attendance/manager.js';

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
		let dateOption = interaction.options.data.find( o => o.name === 'date');
		let date = dayjs(dateOption.value).toDate();
		info(`${format.command(this.Name, interaction.user.username)} Taking attendance for ${date.toDateString()}`, true, true);
		try{
			await AttendanceManager.ReportAttendance( date, true );
		}
		catch( err ) {
			error( err, true );
		}
		await interaction.deleteReply();
    }
};