import {describe, expect, test} from '@jest/globals';
import * as CombatLogAttendence from '../../../src/wvw/attendance/combatlogattendance.js';
jest.mock('ps-list', () => ({ __dirname: `C:\\Program Files\\nodejs` }))

describe ('wvw attendence combat log module', () => {

    test('CombatLog Stub', () => {
        expect(true);
    });
    
});
