import { SlashCommandBuilder } from "discord.js";
import dayjs from 'dayjs';
import { info, error, format} from '../logger.js';
import { VoiceAttendence } from "../wvw/attendance/voiceattendence.js";
import { DiscordManager } from "../discord/manager.js";

export default class rollcall {

	static get Name(){ 'rollcall'}

    static get data () {
        return new SlashCommandBuilder()
            .setName( 'rollcall' )
            .setDescription('Takes Teamspeak Roll Call')
    };

    // interaction.guild is the object representing the Guild in which the command was run
    static async execute( interaction ) {
		await interaction.deferReply({ephemeral: true});
		info(`${format.command('rollcall', interaction.user.username)} Taking rollcall on ${dayjs()}`, true, true);
		try{
			let users = await VoiceAttendence.takeAttendence(true);
			if( users.length > 0 ) {
				await interaction.followUp({ content: users.join(','), ephemeral: true });
			}
		}
		catch( err ) {
			error( `${format.command('rollcall', interaction.user.username)} Error: ${err}`, true, false );
		}
		await interaction.followUp(`Roll Call taken, have a nice day`);
    }
};