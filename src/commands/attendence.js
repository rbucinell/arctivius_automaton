import { SlashCommandBuilder } from "discord.js";
import dayjs from 'dayjs';
import { setTimeout as wait } from 'node:timers/promises';
import { info, dinfo, warn, error} from '../logger.js';
import { takeAttendnce, reportAttendence } from '../wvw/attendence/combatlogattendence.js';

export default class attendence {
    static get data () {
        return new SlashCommandBuilder()
            .setName('attendence')
            .setDescription('Provides attendence for the given day')
			.addStringOption(option =>
				option.setName('date')
					.setDescription('The date to take attendence on')
					.setRequired(true));
    };

    // interaction.guild is the object representing the Guild in which the command was run
    static async execute( interaction ) {
		await interaction.deferReply();
		let dateOption = interaction.options.data.find( o => o.name === 'date');
		let date = dayjs(dateOption.value).toDate();
		info(`Attendence command initiated by ${interaction.member.nickname} <@${interaction.member.id}> for ${date}`, true);
		try{
			let attendence = await takeAttendnce(date);
			await reportAttendence(attendence, interaction.channelId, date);
		}
		catch( err ) {
			error( err, true );
		}
		await interaction.deleteReply();
    }
};