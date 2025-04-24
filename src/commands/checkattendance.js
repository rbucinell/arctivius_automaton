import { SlashCommandBuilder } from "discord.js";
import { AttendanceManager } from '../wvw/attendance/manager.js';
import { registrations } from '../resources/mongodb.js';
import { settings } from "../util.js";
import { info, error, format, LogOptions } from '../logger.js';

const NO_PERMISSION = 'You do not have permission to execute this command on someone else\'s attendance';
const NO_REGISTRATION = `Could not find your GW2 Id in registrations. Did you /register ?`;
const GATHERING_NOTICE = `Gathering the attendance. This tool is only reporting on data for the current month and does not include any exceptions or previously discussed leaves. If you are still concerned, please talk to Pog`;

export default class checkattendance {

	static get Name () { return 'check-attendance' }

    static get data () {
        return new SlashCommandBuilder()
            .setName('check-attendance')
            .setDescription('Check the attendance for the month.')
            .addStringOption(option =>
				option.setName('gwid')
					.setDescription('Guild Wars 2 Id of another member of the guild. Leave blank to check your own attendance.')
					.setRequired(false)
        );
    };

    // interaction.guild is the object representing the Guild in which the command was run
    static async execute( interaction ) {
		try {
        await interaction.deferReply({ ephemeral: true });

        let gw2Id = interaction.options.data.find( o => o.name === 'gwid');
        if( gw2Id ) gw2Id = gw2Id.value;
        let registration = await registrations.findOne({ "discord.id": interaction.user.id });

        const gw2IdReport = !gw2Id ? registration?.gw2Id : gw2Id;

        info(`${format.command(this.Name, interaction.user.username)} Checking Attendance for ${gw2IdReport}`, LogOptions.All );
        
            if( interactionPermissionValidated(this.Name, interaction ) )
            {
                //Use the gw2Id if provided
                if( gw2Id ){
                    const content = await attendanceMsg( gw2Id );
                    await interaction.followUp( {content, ephemeral: true} );
                //Otherwise use the lookup from the registration
                }else{            
                    if( !registration) {
                        await interaction.followUp( {content: NO_REGISTRATION, ephemeral: true} );
                    }else{
                        const content = await attendanceMsg( registration.gw2Id );
                        await interaction.followUp( {content, ephemeral: true} );
                    }
                }
            }
            //No permission
            else {
                if( !registration) {
                    await interaction.followUp( {content:`${NO_PERMISSION}\n${NO_REGISTRATION}`, ephemeral: true} );
                }else{
                    const content = await attendanceMsg( registration.gw2Id, NO_PERMISSION );
                    await interaction.followUp( {content, ephemeral: true} );
                }
            }
        }catch( err ){
            error( err );
        }
        return;
    }
};




async function attendanceMsg( gw2Id, preContentMsg = '') {
    const response = await AttendanceManager.ReportUserAttendanceForMonth( gw2Id );
    let msg = `${preContentMsg}\n${GATHERING_NOTICE}\nAttendance for ${gw2Id}\n`;
    for( let r of response ) {
        msg += `${r.date}: signup:${ r.signup?'✅':'❌'} combat:${r.combat?'✅':'❌'} voice:${r.voice?'✅':'❌'}\n`
    }
    return msg;
}

/**
 * Determines if the user executing the command has the appropriate permissions to do so.
 * @param {string} command - The name of the command
 * @param {*} interaction - The interaction object containing the member who invoked the command
 * @returns {boolean} - true if the user has the appropriate permissions, false if not
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