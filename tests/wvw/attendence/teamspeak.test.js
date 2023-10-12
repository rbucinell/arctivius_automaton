
import * as TeamSpeakAttendence from  '../../../src/wvw/attendance/teamspeakattendance.js';

import dayjs from "dayjs";
import { expect } from '@jest/globals';

import psList from 'ps-list';
jest.mock('ps-list', () => ({
    __dirname: process.cwd()
}))

test('Teamspeak Stub', () => {
    expect(true);
});
