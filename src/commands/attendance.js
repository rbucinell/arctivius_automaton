import { SlashCommandBuilder } from "discord.js";
import dayjs from 'dayjs';
import { info, error} from '../logger.js';
import { takeAttendnce, reportAttendance } from '../wvw/attendance/combatlogattendance.js';

export default class attendance {
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
		info(`Attendance command initiated by ${interaction.member.nickname} <@${interaction.member.id}> for ${date}`, true);
		try{
			let attendance = await takeAttendnce(date);
			await reportAttendance(attendance, interaction.channelId, date);
		}
		catch( err ) {
			error( err, true );
		}
		await interaction.deleteReply();
    }
};