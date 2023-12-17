import { SlashCommandBuilder } from "discord.js";
import dayjs from 'dayjs';
import { info, error} from '../logger.js';
import { checkTeamspeakAttendance } from "../wvw/attendance/teamspeakattendance.js";

export default class rollcall {
    static get data () {
        return new SlashCommandBuilder()
            .setName('rollcall')
            .setDescription('Takes Teamspeak Roll Call')
    };

    // interaction.guild is the object representing the Guild in which the command was run
    static async execute( interaction ) {
		await interaction.deferReply();
		info(`/rollcall command initiated by ${interaction.member.nickname} <@${interaction.member.id}> on ${dayjs()}`, true);
		try{
			await checkTeamspeakAttendance();
		}
		catch( err ) {
			error( err, true );
		}
		await interaction.reply(`Roll Call taken, have a nice day`);
    }
};