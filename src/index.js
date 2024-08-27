import { DiscordManager } from './discord/manager.js';
import { GuildVault } from './guild/guildvault.js';
import { AttendanceManager } from './wvw/attendance/manager.js';
import { MessageWatcher } from './discord/messagewatcher.js';
import { SignupReminder } from './wvw/signup/sign-up-reminder.js';
import { VoiceAttendence } from './wvw/attendance/voiceattendence.js';
import { GuildSync } from './guild/guildsync.js';
import { ProgressManager } from './wvw/progress/progressmanager.js';

process.title = "[[ Arctivius Automaton ]]";
await DiscordManager.Login();

//TODO: Convert: AttendanceManager, VoiceAttendence, ProgressManager, to extend Moudle
//Initialize Moudles
const modules = [ MessageWatcher, AttendanceManager, SignupReminder, VoiceAttendence, GuildVault, GuildSync, /*ProgressManager*/ ];
modules.forEach( m => m.initialize() );
