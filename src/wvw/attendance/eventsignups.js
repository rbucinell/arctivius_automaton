import dayjs from "dayjs";
import { DiscordManager } from "../../discord/manager.js";
import { CrimsonBlackout } from "../../discord/ids.js";
import { WvWScheduler } from '../wvwraidscheduler.js';
import { error } from "../../logger.js";

const ALEVA_ID = '511173424522199070';

function getEventDateFromMessage( message ){
    let field = message.embeds[0].fields.find(f => f.name === ":date: Date & Time:");
    let eventTimestamp = field.value.replace('<t:','').replace(':f>', '');
    return dayjs.unix(Number(eventTimestamp));
}

export async function getSignupForDate( forDate )
{
    let subscribers = [];
    try{
        const schedule = WvWScheduler.schedule;
        const guild = DiscordManager.Client.guilds.cache.get(CrimsonBlackout.GUILD_ID.description);
        let channel = guild.channels.cache.get(CrimsonBlackout.CHANNEL_WVW_SIGNUPS.description);

        let messages = await channel.messages.fetch();
        messages = messages.filter( m => m.author.id === ALEVA_ID && 
            getEventDateFromMessage(m).isSame(forDate,'day'));
        if( messages.size === 0){
            channel = guild.channels.cache.get(CrimsonBlackout.CHANNEL_EVENT_ARCHIVES.description)
            messages = await channel.messages.fetch();
            messages = messages.filter( m => m.author.id === ALEVA_ID && 
                getEventDateFromMessage(m).isSame(forDate,'day'));
        }
        messages = messages.filter( m =>
            schedule.some( s => {
                const dt = getEventDateFromMessage(m);
                return  s.day === dt.day() && 
                        s.time.h === dt.hour() && 
                        s.time.m === dt.minute()
            })
        );
        
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