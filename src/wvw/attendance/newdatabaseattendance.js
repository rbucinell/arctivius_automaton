import dayjs from 'dayjs';
import { attendance } from '../../resources/mongodb.js';
import AttandanceDateRecord from './models/attendanceDateRecord.js';
import * as CombatAttendance from './combatlogattendance.js';
import {VoiceAttendence} from './voiceattendence.js';
import { SignupAttendance } from './signupattendance.js';
import { registrations } from '../../resources/mongodb.js';

export class NewDatabaseAttendance {

    /**
     * Records attendance from a given date
     * @param {dayjs|Date|string} date The date to  record attendance for
     * @param {object} options
     * @param {boolean} options.combat Whether to record combat attendance
     * @param {boolean} options.voice Whether to record voice attendance
     * @param {boolean} options.signups Whether to record signup attendance
     */
    static async record( date, options ){
        //Sanatize Inputs
        options = options || {};
        date = dayjs(date).format("YYYY-MM-DD");
        
        //Get or create the attendance record from db
        let adr = await NewDatabaseAttendance.getOrCreateAttendanceRecord( date );
        
        if( options.combat ){
            if( adr.combat === null || adr.combat.length === 0){
                let combat = await CombatAttendance.takeAttendnce( date );
                adr.combat = combat;
                await attendance.updateOne({ _id: adr._id }, { $set: { combat: combat } });
            }
        }

        if( options.voice ){
            let newUsersFound = 0;
            let voice = await VoiceAttendence.getUsersInVoiceChannel();
            if( adr.voice === null) {                
                adr.voice = voice.map( v => {return { username: v, count: 1 }} );
                newUsersFound = voice.length;
            }else{
                for( let v of voice ){
                    let found = false;
                    for( let i = 0; i < adr.voice.length; i++ ){
                        if( adr.voice[i].username === v ){
                            found = true;
                            adr.voice[i].count++;
                            break;
                        }
                    }
                    if( !found ){
                        adr.voice.push( { username: v, count: 1 } );
                        newUsersFound++;
                    }
                }
            }

            //Only update the gw2Id from registrations if new users were found
            if( newUsersFound > 0 ) {                
                for( let v of adr.voice ){
                    let registration = await registrations.findOne({ "discord.username": v.username });
                    if( registration ){
                        v.gw2Id = registration.gw2Id;
                    }
                }
            }
            await attendance.updateOne({ _id: adr._id }, { $set: { voice: adr.voice } });
        }

        if( options.signups ){
            let signups = await SignupAttendance.getSignupsFromDiscord( date );
            if( signups && signups.length > 0 ){
                adr.signups = signups;
                await attendance.updateOne({ _id: adr._id }, { $set: { signups: signups } });
            }
        }
        return adr;
    }

    /**
     * Reports an attendance record for the given date.
     * @param {dayjs|Date|string} date 
     * @returns {Promise<AttandanceDateRecord>} The attendance record for the given date.
     */
    static async report( date ){
        date = dayjs(date).format("YYYY-MM-DD");
        return await NewDatabaseAttendance.getOrCreateAttendanceRecord( date );
    }

    /**
     * Gets or creates an attendance record for the given date.
     * @param {dayjs|Date|string} date - The date for which the attendance record is desired.
     * @returns {Promise<AttandanceDateRecord>} The attendance record for the given date.
     */
    static async getOrCreateAttendanceRecord( date ) {
        date = dayjs(date).format("YYYY-MM-DD");
        let adr = await attendance.findOne({ date });
        if( !adr ) {
            await attendance.insertOne( new AttandanceDateRecord( date ).toDbRecord() );
            adr = await attendance.findOne({ date });
        }
        return adr;
    }
}
