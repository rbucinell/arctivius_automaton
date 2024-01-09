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
        const now = date ?? dayjs().tz("America/New_York");
        const schedule = this.#loadSchedule();
        schedule.sort( (a,b) => a.day -b.day );
        let upcoming = schedule.filter( s => s.day >= now.day() );
        if( upcoming.length === 0 ) upcoming = schedule;
        let next = upcoming.shift();
        let nextDayJs = now.day( next.day ).hour( next.time.h ).minute( next.time.m ).second(0);
        let nextDayJsEnd = nextDayJs.add( next.duration, 'hours' );
        let active = now.isAfter( nextDayJs) && now.isBefore( nextDayJsEnd );

        if( now.isAfter( nextDayJsEnd ) && now.day() === nextDayJsEnd.day() ){
            return this.nextRaid( now.add(1,'day'))
        }else{

        return {
            start: nextDayJs,
            end: nextDayJsEnd,
            isActive: active
        };
    }
    }
}