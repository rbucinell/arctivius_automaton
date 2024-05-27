import { debug, error, format, info } from '../../logger.js';
import { CrimsonBlackout } from '../../discord/ids.js';
import { DiscordManager } from '../../discord/manager.js';
import dayjs from 'dayjs';
import duration     from 'dayjs/plugin/duration.js';
import timezone from 'dayjs/plugin/timezone.js';
import relativeTime from 'dayjs/plugin/relativeTime.js';

dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.extend(timezone);

const WVWSIGNUPS_CHANNEL = CrimsonBlackout.CHANNEL_SECRET_CHANNEL.description;

const testMessage = "Good afternoon folks...can you all please take a minute, and sign up for WvW tonight if you plan on joining us. Please try bring a required class. Loads of room. It is reset night and its also relinks. We are linked with Tarnished Coast (TC) . So anyone who is in TC and wants to join us tonight for WvW, you are of course welcome to join!! <@&791182081878130710> <@&1022541297367646329> <@&1047892420563582977> <@&1099365978699214858>"

const logInfo = ( msg, saveToLog=true, writeToDiscord=false ) => info(`${format.module(SignupReminder.Name)} ${msg}`, saveToLog, writeToDiscord);

export class SignupReminder {

    static get Name(){ return 'SignupReminder'; }

    static initialize() {
        let now = dayjs();
        info(`[Module Registered] ${ format.highlight(this.Name)}`);
        setTimeout(SignupReminder.PostReminder, now.add(1,'day').hour(12).minute(0).diff(now));
    }

    static async DeleteMessages() {
        const channel = DiscordManager.Client.channels.cache.get(WVWSIGNUPS_CHANNEL);
        let messages = await channel.messages.fetch();
        messages = messages.filter( m =>  m.author.id === DiscordManager.Client.user.id );
        messages.forEach( m => {
            debug( `Deleting: ${ m.id } ${m.content}`, true, false)
        } );
        logInfo(`${format.DELETE()} Deleting previous messages in #wvw-signups`, true, true);
    }

    static getReminderMessage() {
        return `Posting Cheery Message`;
    }

    static async PostReminder( executeOnce = false ) {
        try {
            const content = SignupReminder.getReminderMessage();
            logInfo(content, true, false);
            DiscordManager.Client.channels.cache.get(CrimsonBlackout.CHANNEL_SECRET_CHANNEL.description).send( { content } );
            if( !executeOnce ) {
                let now = dayjs();
                setTimeout(SignupReminder.DeleteMessages, now.add(8, 'hours').diff(now));
                setTimeout(SignupReminder.PostReminder, now.add(1,'day').hour(12).minute(0).diff(now));
            }
        }
        catch( err ) {
            error(`${format.module(SignupReminder.Name)} ${err}`,true, false);
        }
    }
}
