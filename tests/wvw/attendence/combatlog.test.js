import {describe, expect, test} from '@jest/globals';
import * as CombatLogAttendance from '../../../src/wvw/attendance/combatlogattendance.js';
jest.mock('ps-list', () => ({ __dirname: `C:\\Program Files\\nodejs` }))

describe ('wvw attendance combat log module', () => {

    test('CombatLog Stub', () => {
        expect(true);
    });
    
});
