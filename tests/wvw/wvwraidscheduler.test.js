import { describe, expect, test} from '@jest/globals';
import { WvWScheduler } from "../../src/wvw/wvwraidscheduler.js";  
import dayjs from 'dayjs';

describe( 'WvW Raid Schedluer Module', ()=> {
    
    test("NextRaid returns 3 componenets: start, end, isActive", () => {
        const next = WvWScheduler.nextRaid();
        expect( next.hasOwnProperty('start'));
        expect( next.hasOwnProperty('end'));
        expect( next.hasOwnProperty('isActive'));
    });

    test('There is no raid today, but one tomorrow', () => {
        
        const WEDNESDAY = 3;
        const today = dayjs('2024-10-08').tz("America/New_York"); //Tuesday (2)
        const { start, end, isActive } = WvWScheduler.nextRaid(today);

        expect(start.day()).toBe( WEDNESDAY ); //Wenesday(3)
        expect(isActive).toBeFalsy();
    });

    test('There is a raid later today', () => {

        const today = dayjs('2024-10-09 16:00'); // Wednesday, 4pm
        const { start, end, isActive } = {...WvWScheduler.nextRaid(today)};

        expect(start.day()).toBe( today.day() );
        expect(start.diff(today, 'hours')).toBe( 4 );
        expect(end.diff(today, 'hours')).toBe( 6 );
        expect(isActive).toBeFalsy();
    });

    test('There is an ongoing raid', () => {

        // Raid is from 8:30pm - 10:30pm
        const today = dayjs('2024-10-09 22:00').tz("America/New_York"); // Wednesday, 10pm
        const { start, end, isActive } = {...WvWScheduler.nextRaid(today)};

        expect(start.day()).toBe( today.day() );
        expect( today.isAfter(start)).toBeTruthy();
        expect( today.isBefore(end)).toBeTruthy();
        expect(isActive).toBeTruthy();
    });

    test('Testing Wednesday later today', () => {

        const expected = dayjs('2024-10-09, 20:30').tz("America/New_York");

        const today = dayjs('2024-10-09 12:00');
        const { start, end, isActive } = WvWScheduler.nextRaid(today);

        expect( expected.day()).toBe(start.day());
        expect( expected.hour()).toBe(start.hour());
        expect( expected.minute()).toBe(start.minute());
        expect( today.isBefore(end)).toBeTruthy();
        expect(isActive).toBeFalsy();
    });

    
    test('Testing Wednesday mid Run', () => {

        const expected = dayjs('2024-10-09, 20:30').tz("America/New_York");
        const today = dayjs('2024-10-09, 20:30').tz("America/New_York");

        const { start, end, isActive } = WvWScheduler.nextRaid(today);

        expect( expected.day()).toBe(start.day());
        expect( expected.hour()).toBe(start.hour());
        expect( today.isBefore(end)).toBeTruthy();
        expect(isActive).toBeTruthy();
    });

    test('Saturday Bug', () => {
        const today = dayjs('2024-05-25, 23:59:59').tz("America/New_York");

        const expected = dayjs('2024-05-26, 20:30').tz("America/New_York");

        const { start, end, isActive } = WvWScheduler.nextRaid(today);
        expect( expected.date()).toBe(start.date());
        expect( expected.hour()).toBe(start.hour());
    })

});
