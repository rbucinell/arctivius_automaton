import dayjs from "dayjs";
import { DiscordManager } from "../../discord/manager.js";
import { CrimsonBlackout } from "../../discord/ids.js";
import { error } from "../../logger.js";
import { WvWScheduler } from "../wvwraidscheduler.js";
import { NewDatabaseAttendance } from "./newdatabaseattendance.js";
import { Module } from "../../commands/modules/module.js";
import { sleep } from "../../util.js";

const ALEVA_ID = '511173424522199070';

export class SignupAttendance extends Module {

    static getNextExecute() {
        let { start, end, isActive } = WvWScheduler.nextRaid();
        return start.diff(dayjs());
    }

    static async execute() {
        this.info('Recording Signups');
        const dar = await NewDatabaseAttendance.record( dayjs(), { signups: true } );
        this.info(`Signups Recorded: ${dar.signups?.length || 0}`);

        await sleep( 1000 * 60 * 60 * 12);
        this.awaitExecution();
    }

    static async getSignupsFromDiscord( forDate ) {
        let subscribers = [];
        try{
            const guild = DiscordManager.Client.guilds.cache.get(CrimsonBlackout.GUILD_ID.description);

            //Check the WvW Signups first
            let channel = guild.channels.cache.get(CrimsonBlackout.CHANNEL_WVW_SIGNUPS.description);
            let messages = await channel.messages.fetch();
            messages = messages.filter( m => m.author.id === ALEVA_ID && getEventDateFromMessage(m).isSame(forDate,'day'));

            //If there are no messages, see if Aleeva moved the event to the Event Archives channel.
            if( messages.size === 0){
                channel = guild.channels.cache.get(CrimsonBlackout.CHANNEL_EVENT_ARCHIVES.description)
                messages = await channel.messages.fetch();
                messages = messages.filter( m => m.author.id === ALEVA_ID && getEventDateFromMessage(m).isSame(forDate,'day'));
            }
            
            for( let [_,message] of messages ) {
                for( let embed of message.embeds) {
                    for( let field of embed.fields ){
                        let subs = Array.from(field.value.matchAll(/\(\*(.*)\*\)/g), m => m[1] );
                        subscribers.push(...subs);
                    }
                }
            }
        } catch( err ) {
            error( err );
        }
        return subscribers;
    }
}

function getEventDateFromMessage( message ){
    let field = message.embeds[0].fields.find(f => f.name === ":date: Date & Time:");
    let eventTimestamp = field && field.value ? field.value.replace('<t:','').replace(':f>', '') : dayjs('01-01-1970');
    return dayjs.unix(Number(eventTimestamp));
}
