import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from 'dayjs/plugin/timezone.js';
import { DiscordManager } from "../../discord/manager.js";
import { CrimsonBlackout } from "../../discord/ids.js";
import { WvWScheduler } from '../wvwraidscheduler.js';
import { error } from "../../logger.js";

const ALEVA_ID = '511173424522199070';

function getEventDateFromMessage( message ){
    let field = message.embeds[0].fields.find(f => f.name === ":date: Date & Time:");
    let eventTimestamp = field && field.value ? field.value.replace('<t:','').replace(':f>', '') : dayjs('01-01-1970');
    return dayjs.unix(Number(eventTimestamp));
}

export async function getSignupForDate( forDate )
{
    let subscribers = [];
    try{
        const schedule = WvWScheduler.schedule;
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
    } catch( err ){
        error( err, true );
    }
    return subscribers;
}