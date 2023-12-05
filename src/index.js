import { DiscordManager } from './discord/manager.js';
import * as CombatAttendance from './wvw/attendance/combatlogattendance.js';
import * as TeamSpeakAttendance from './wvw/attendance/teamspeakattendance.js';
import * as GuildVault from './guild/guildvault.js';
import { AttendanceManager } from './wvw/attendance/manager.js';
import { MessageWatcher } from './discord/messagewatcher.js';

process.title = "[[ Arctivius Automaton ]]";
await DiscordManager.Login();

//CombatAttendance.initializeScheduledRuns();
MessageWatcher.registerOnMessageCreateHandler();
GuildVault.initializeScheduledRuns();
TeamSpeakAttendance.initializeScheduledRuns();
AttendanceManager.initialize();