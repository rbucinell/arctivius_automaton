import { SlashCommandBuilder } from "discord.js";
import dayjs from 'dayjs';
import { info, error} from '../logger.js';
import { checkTeamspeakAttendance } from "../wvw/attendance/teamspeakattendance.js";

export default class rollcall {

	static get Name(){ 'rollcall'}

    static get data () {
        return new SlashCommandBuilder()
            .setName( rollcall.Name )
            .setDescription('Takes Teamspeak Roll Call')
    };

    // interaction.guild is the object representing the Guild in which the command was run
    static async execute( interaction ) {
		await interaction.deferReply();
		info(`${format.command(this.Name, interaction.user.username)} Taking rollcall on ${dayjs()}`, true, true);
		try{
			await checkTeamspeakAttendance();
		}
		catch( err ) {
			error( `${format.command(this.Name, interaction.user.username)} Error: ${err}`, true, false );
		}
		await interaction.reply(`Roll Call taken, have a nice day`);
    }
};