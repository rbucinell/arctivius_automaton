import { DiscordManager } from './discord/manager.js';
import * as CombatAttendance from './wvw/attendance/combatlogattendance.js';
import * as TeamSpeakAttendance from './wvw/attendance/teamspeakattendance.js';
import * as GuildVault from './guild/guildvault.js';

process.title = "[[ Arctivius Automaton ]]";
await DiscordManager.Login();

CombatAttendance.initializeScheduledRuns();
CombatAttendance.registerOnMessageCreateHandler();
GuildVault.initializeScheduledRuns();
TeamSpeakAttendance.initializeScheduledRuns();
