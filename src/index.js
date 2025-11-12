import "./instrument.mjs";
import { DiscordManager } from './discord/manager.js';
import { GuildVault } from './guild/guildvault.js';
import { AttendanceManager } from './wvw/attendance/manager.js';
import { MessageWatcher } from './discord/messagewatcher.js';
import { SignupReminder } from './wvw/signup/sign-up-reminder.js';
import { VoiceAttendence } from './wvw/attendance/voiceattendence.js';
import { GuildSync } from './guild/guildsync.js';
import { ProgressManager } from './wvw/progress/progressmanager.js';
import { SignupAttendance } from './wvw/attendance/signupattendance.js';
import { CombatLogAttendance } from './wvw/attendance/combatlogattendance.js';
import * as Sentry from "@sentry/node";

process.title = "[[ Arctivius Automaton ]]";

await DiscordManager.Login();

//TODO: Convert: VoiceAttendence,  to extend Moudle
//Initialize Moudles
const modules = [ 
    MessageWatcher, 
    AttendanceManager, 
    VoiceAttendence, 
    GuildVault, 
    GuildSync, 
    SignupAttendance, 
    CombatLogAttendance, 
    /*ProgressManager*/ 
].forEach( m => m.initialize() );

const checkInId = Sentry.captureCheckIn(
  {
    monitorSlug: 'heartbeat',
    status: 'in_progress',
  },
  {
    schedule: { // Specify your schedule options here
      type: 'crontab',
      value: '* * * * *',
    },
    checkinMargin: 1,
    maxRuntime: 1,
    timezone: 'America/New_York',
  });


