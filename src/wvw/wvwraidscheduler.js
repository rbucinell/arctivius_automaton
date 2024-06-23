import dayjs from 'dayjs';
import duration     from 'dayjs/plugin/duration.js';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import utc          from 'dayjs/plugin/utc.js';
import timezone     from 'dayjs/plugin/timezone.js';
import weekday      from 'dayjs/plugin/weekday.js';
import { settings } from '../util.js';
dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(weekday);

export class WvWScheduler {
    
    /**
     * @typedef {Object} ScheduledRaid
     * @property {dayjs} start - The start time of the raid
     * @property {dayjs} end   - The end time of the raid
     * @property {boolean} isActive - if the raid is currently ongoing
     */

    /**
     * Determines the next schedlued raid. returns an ongoing one if requested during
     * active time period.
     * 
     * @param {dayjs} date the next raid for a given date 
     * @returns {ScheduledRaid} The scheduled raid
     */
    static nextRaid( date = null ) {
        const now = (date ?? dayjs()).tz("America/New_York");
        const schedule = settings.schedule
        schedule.sort( (a,b) => a.day -b.day );

        //Find the next index where the day is equal to or greater, 
        // otherwise give 0th, the wrap-around case
        let upcomingIndex = schedule.findIndex( s => s.day >= now.day() );
        if( upcomingIndex === -1 ) upcomingIndex = 0;
        let next = schedule[upcomingIndex];
        let start = now.day( next.day ).hour( next.time.h ).minute( next.time.m ).second(0).tz("America/New_York");
        
        //If same same day
        if( next.day === now.day() )
        {
            //And after end date
            if( now.isAfter( start.add( next.duration, 'hours' )  )){
                //Get next on schedule
                upcomingIndex = (++upcomingIndex) % schedule.length;
                //update next and next start
                next = schedule[upcomingIndex];
                start = now.add(1,'day').day( next.day ).hour( next.time.h ).minute( next.time.m ).second(0);
            }
        }

        let end =  start.add( next.duration, 'hours' );
        
        let isActive =  (now.isSame(start) || now.isAfter( start) ) && 
                        (now.isSame(end) || now.isBefore( end ));

        return {
            start,
            end,
            isActive
        };
    }
}