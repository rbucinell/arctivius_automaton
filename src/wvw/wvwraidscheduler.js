import fs from 'fs';
import dayjs from 'dayjs';
import duration     from 'dayjs/plugin/duration.js';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import utc          from 'dayjs/plugin/utc.js';
import timezone     from 'dayjs/plugin/timezone.js';
dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);

const SCHEDULE_FILE = './src/wvw/schedule.json';

export class WvWScheduler {

    static #loadSchedule(){ return JSON.parse(fs.readFileSync(SCHEDULE_FILE, 'utf-8')); }

    static get schedule(){
        return this.#loadSchedule();
    }
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
        const schedule = this.#loadSchedule();
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
                start = now.day( next.day ).hour( next.time.h ).minute( next.time.m ).second(0);
            }
        }

        let end =  start.add( next.duration, 'hours' );
        
        let isActive =  (now.isSame(start) || now.isAfter( start) ) && 
                        (now.isSame(end) || now.isBefore( end ));



        // let upcoming = schedule.filter( s => s.day >= now.day() );
        // if( upcoming.length === 0 ) upcoming = schedule;
        // //let next = upcoming.shift();
        // //let nextDayJs = now.day( next.day ).hour( next.time.h ).minute( next.time.m ).second(0);
        // let nextDayJsEnd = nextDayJs.add( next.duration, 'hours' );
        // let active = (now.isSame(nextDayJs) || now.isAfter( nextDayJs) ) && now.isBefore( nextDayJsEnd );

        // if( now.isAfter( nextDayJsEnd ) && now.day() === nextDayJsEnd.day() ){
        //     return this.nextRaid( now.add(1,'day'))
        // }else{

        return {
            start,
            end,
            isActive
        };
    }
}