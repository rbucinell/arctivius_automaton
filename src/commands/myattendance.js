import { SlashCommandBuilder } from "discord.js";
import { AttendanceManager } from '../wvw/attendance/manager.js';
import { info, error, format, LogOptions } from '../logger.js';
import { registrations } from '../resources/mongodb.js';

export default class myattendance {

	static get Name () { return 'my-attendance' }

    static get data () {
        return new SlashCommandBuilder()
            .setName('my-attendance')
            .setDescription('Check your attendance for the month.');
    };

    // interaction.guild is the object representing the Guild in which the command was run
    static async execute( interaction ) {
		await interaction.deferReply({ ephemeral: true });
        info(`${format.command(this.Name, interaction.user.username)} Checking Attendance`, LogOptions.All );

        let registration = await registrations.findOne({ "discord.id": interaction.user.id });
        if( !registration) {
            info(`${format.command(this.Name, interaction.user.username)} Failed: No registration.` );
            await interaction.followUp({ 
                content: `Could not find your GW2 Id in registrations. Did you /register ?`, 
                ephemeral: true 
            });
        }else{

            await interaction.followUp({ 
                content: `Gathering your attendance. This tool is only reporting on data for the current month and does not include any exceptions or previously discussed leaves. If you are still concerned, please talk to Pog`, 
                ephemeral: true 
            });

            const response = await AttendanceManager.ReportUserAttendanceForMonth( registration.gw2Id );
            let msg = '';
            for( let r of response ) {
                msg += `${r.date}: signup:${ r.signup?'✅':'❌'} combat:${r.combat?'✅':'❌'} voice:${r.voice?'✅':'❌'}\n`
            }

            await interaction.followUp({ content: msg, ephemeral: true });
        }
    }
};