import { db, attendance } from '../../resources/mongodb.js';
import { info, error, format, LogOptions } from '../../logger.js';
import AttendanceRecord from './models/attendancerecord.js';
import dayjs from 'dayjs';

//db.inventory.find( { $or: [ { quantity: { $lt: 20 } }, { price: 10 } ] } )


export async function insertNewAttendanceRecord( record ){
    await attendance.insertOne( record );
}

export async function insertManyNewAttendanceRecords( records ){
    await attendance.insertMany( records );
}

export async function updateAttendanceRecord( record ){
    await attendance.updateOne( { _id: record._id }, { $set: record } );
}

export async function updateManyAttendaceRecords( records ) {
    await attendance.updateMany( records );
}


/**
 * Retrieves attendance records for a given date.
 *
 * @param {Date|string} date - The date for which to retrieve attendance records.
 * @return {Promise<Array<AttendanceRecord>} A promise that resolves to an array of attendance records.
 */
export async function getAttendanceRecords( date ){
    let records = await attendance.find( 
        { date: dayjs(date).toDate() } 
    ).toArray()
    return records.map( _ => AttendanceRecord.fromDocument( _ ) );
}

export async function incrementVoice( date, discordUsers, minBetweenChecks  ){

    let records = await getAttendanceRecords( date );
    let notRecorded = discordUsers.filter( discordUser => !records.some( record => record.discord === discordUser ) );

    let response = await attendance.updateMany( 
        {
            discord: { $in: discordUsers }, 
            date: { $eq: dayjs(date).toDate() }
        }, 
        {
            $inc: { voiceCount: 1 },
            $set: { minBetweenChecks: minBetweenChecks }
        }        
    );
    if( notRecorded.length > 0 ){
        await attendance.insertMany( notRecorded.map( nr => {
            let r = new AttendanceRecord( date );
            r.discord = nr;
            r.voiceCount = 1;
            r.minutesBetweenChecks = minBetweenChecks;
            return r;
        }) );
    }
    return response;
}