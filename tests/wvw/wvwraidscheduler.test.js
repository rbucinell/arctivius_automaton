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
        
        const FRIDAY = 5;
        const today = dayjs('2023-10-05').tz("America/New_York"); //Thursday (4)
        const { start, end, isActive } = WvWScheduler.nextRaid(today);

         expect(start.day()).toBe( FRIDAY ); //Friday(5)
         expect(isActive).toBeFalsy();
    });

    test('There is a raid later today', () => {

        const today = dayjs('2023-10-06 16:00'); // Friday, 4pm
        const { start, end, isActive } = {...WvWScheduler.nextRaid(today)};

        expect(start.day()).toBe( today.day() );
        expect(start.diff(today, 'hours')).toBe( 6 );
        expect(end.diff(today, 'hours')).toBe( 9 );
        expect(isActive).toBeFalsy();
    });

    test('There is an ongoing raid', () => {

        const today = dayjs('2023-10-06 23:00').tz("America/New_York"); // Friday, 11pm
        const { start, end, isActive } = {...WvWScheduler.nextRaid(today)};

        expect(start.day()).toBe( today.day() );
        expect( today.isAfter(start)).toBeTruthy();
        expect( today.isBefore(end)).toBeTruthy();
        expect(isActive).toBeTruthy();
    });

    test('Testing Saturday later today', () => {

        const expected = dayjs('2024-05-05, 20:30').tz("America/New_York");

        const today = dayjs('2024-05-05 12:00');
        const { start, end, isActive } = WvWScheduler.nextRaid(today);

        expect( expected.day()).toBe(start.day());
        expect( expected.hour()).toBe(start.hour());
        expect( expected.minute()).toBe(start.minute());
        expect( today.isBefore(end)).toBeTruthy();
        expect(isActive).toBeFalsy();
    });

    
    test('Testing Saturday mid Run', () => {

        const expected = dayjs('2024-05-05, 20:30').tz("America/New_York");
        const today = dayjs('2024-05-05, 20:30').tz("America/New_York");

        const { start, end, isActive } = WvWScheduler.nextRaid(today);

        expect( expected.day()).toBe(start.day());
        expect( expected.hour()).toBe(start.hour());
        expect( today.isBefore(end)).toBeTruthy();
        expect(isActive).toBeTruthy();
    });

    test('Testing Saturday mid Run', () => {

        //Sunday
        const expected  = dayjs('2024-05-05, 20:30').tz("America/New_York");
        //Saturday
        const today     = dayjs('2024-05-04, 23:31').tz("America/New_York");

        const { start, end, isActive } = WvWScheduler.nextRaid(today);
        expect( today.isAfter(end)).toBeTruthy();
        expect(isActive).toBeFalsy();
    });

});
