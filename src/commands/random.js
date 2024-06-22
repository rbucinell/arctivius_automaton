import { SlashCommandBuilder } from "discord.js";
import { info, error, format} from '../logger.js';
import { getGuildMembers, getGuildMemberByDiscord } from "../guild/guildlookup.js";
import { VoiceAttendence } from "../wvw/attendance/voiceattendence.js";

export default class random {

    static get Name() { return 'random' }
    
    static get data () {
        return new SlashCommandBuilder()
            .setName(random.Name)
            .setDescription('Pick a random guild member!')
            .addBooleanOption(option =>
                option.setName('voice').setDescription('Only pick from users who are currently in PACK voice only?'));
    };

    /**
     * Interaction.guild is the object representing the Guild in which the command was run
     **/
    static async execute( interaction ) {
        try {
            await interaction.deferReply();
            let voiceOnly = interaction.options.data.find( _ => _.name === 'voice');
            info(`${format.command(this.Name, interaction.user.username)} ${voiceOnly?"[Voice Only]":""} `, true, true);

            if( voiceOnly ) {
                let users = await VoiceAttendence.takeAttendence(true);
                if( users.length === 0 ) {
                    await interaction.followUp({ content: `No users found. Try again`});
                    return;
                }
                let randomUser = users[Math.floor(Math.random()*users.length) ];
                let guildy = await getGuildMemberByDiscord( randomUser );
                if( !guildy ){
                    await interaction.followUp(`Out of ${users.length} users, I randomly selected: **${ randomUser }**`);
                    infoRandomUser(interaction, randomUser);
                }else {
                    await interaction.followUp(`Out of ${users.length} users, I randomly selected: ${displayGuildMember(guildy)}`);
                    infoRandomUser( interaction, displayGuildMember(guildy) );
                }
            }
            else {
                let guildmembers = await getGuildMembers();
                guildmembers = guildmembers.filter( _ => _.status !== 'Blackballed' );
                let guildy = guildmembers[Math.floor(Math.random()*guildmembers.length) ];
                await interaction.followUp( `Out of ${guildmembers.length} members, I randomly selected: ${displayGuildMember(guildy)}` );
                infoRandomUser( interaction, displayGuildMember(guildy) );
            }
            
            
            
        } catch( err ) {
            error(`${format.command(this.Name)} ${err}`, true);
            await interaction.followUp(`Command Error`);
        }
    }
};

function infoRandomUser(interaction, randomUserFormatted, saveToLog = true, writeToDiscord = true ) {
    info(`${format.command(random.Name, interaction.user.username)} Randomly selected user: ${ randomUserFormatted }`, saveToLog, writeToDiscord);
}

function displayGuildMember( guildMember ) {
    return `**${ guildMember.teamspeakName }**, gw2: \`${guildMember.gw2ID}\`, discord: \`${ guildMember.discordID }\``
}