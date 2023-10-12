import fs from 'fs';
import dayjs, { Dayjs } from 'dayjs';
import duration from 'dayjs/plugin/duration.js';
import relativeTime from 'dayjs/plugin/relativeTime.js';
dayjs.extend(duration);
dayjs.extend(relativeTime);

const SCHEDULE_FILE = './src/wvw/schedule.json';

export class WvWScheduler {

    static #loadSchedule(){ return JSON.parse(fs.readFileSync(SCHEDULE_FILE, 'utf-8')); }

    /**
     * 
     * @param {Dayjs} date the next raid for a given date 
     * @returns {object} 
     */
    static nextRaid( date = null ) {
        const now = date ?? dayjs();
        const schedule = this.#loadSchedule();
        schedule.sort( (a,b) => a.day -b.day );
        let upcoming = schedule.filter( s => s.day >= now.day() );
        if( upcoming.length === 0 ) upcoming = schedule;
        let next = upcoming.shift();
        let nextDayJs = now.day( next.day ).hour( next.time.h ).minute( next.time.m );
        let nextDayJsEnd = nextDayJs.add( next.duration, 'hours' );
        let active = now.isAfter( nextDayJs) && now.isBefore( nextDayJsEnd );
        return {
            start: nextDayJs,
            end: nextDayJsEnd,
            isActive: active
        };
    }
}