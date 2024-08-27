

import { DiscordManager } from './discord/manager.js';
import * as GuildVault from './guild/guildvault.js';
import { AttendanceManager } from './wvw/attendance/manager.js';
import { MessageWatcher } from './discord/messagewatcher.js';
import { ProgressManager } from './wvw/progress/progressmanager.js';
import { SignupReminder } from './wvw/signup/sign-up-reminder.js';
import { VoiceAttendence } from './wvw/attendance/voiceattendence.js';
import { GuildSync } from './guild/guildsync.js';

process.title = "[[ Arctivius Automaton ]]";

await DiscordManager.Login();

MessageWatcher.initialize();
GuildVault.initializeScheduledRuns();
AttendanceManager.initialize();
SignupReminder.initialize();
VoiceAttendence.initalize();
//ProgressManager.initialize();
GuildSync.initialize();