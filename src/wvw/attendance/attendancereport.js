import * as csv from 'csv-stringify';
import fs from 'fs';
import dayjs from 'dayjs';
import path from 'path';
import { NewDatabaseAttendance } from './newdatabaseattendance.js';

/**
 * Creates a CSV report of all attendance records for the given month and year.
 * @param {number} month The month for the report.
 * @param {number} year The year for the report.
 * @returns {Promise<void>}
 */
export async function createCSVReport(month, year) {
    const start = dayjs(`${month}/01/${year}`, "MM/DD/YYYY").startOf("month");
    const end = dayjs(`${month}/01/${year}`, "MM/DD/YYYY").endOf("month");
    const days = start.daysInMonth();

    let header = ["GW2ID"];
    let attendees = {};
    for( let date = start; date.isBefore(end); date = date.add(1, "day") ) {
        const record = await NewDatabaseAttendance.report( date.toString("YYYY-MM-DD") );
        header.push( record.date );
        if ( !record ) continue;

        if( record.combat ) {
            for( const combatant of record.combat ) {
                if( !combatant || !combatant.gw2Id ) continue;
                if( !attendees[combatant.gw2Id] ) attendees[combatant.gw2Id] = new Array( days+1 ).fill('');
                attendees[combatant.gw2Id][date.$D] = 'X';
            }
        }

        if ( record.voice ) {
            for( const voice of record.voice ) {
                if( !voice || !voice.gw2Id ) continue;
                if( !attendees[voice.gw2Id] ) attendees[voice.gw2Id] = new Array( days+1 ).fill('');
                attendees[voice.gw2Id][date.$D] = 'X';
            }
        }        
    }
    header.push("Total");

    
    let data = [];
    for( let prop of Object.entries(attendees) ) {
        let [key, value] = prop;
        let copy = [ ...value ];
        copy[0] = key;
        copy.push( copy.filter( x => x === 'X').length );
        data.push( copy );
    }
    data.sort( (a,b) => a[0].localeCompare(b[0], 'en', { sensitivity: 'accent' , ignorePunctuation: true }) );
    data.unshift( header );  

    //Write out the file
    let fileName = `./reports/${start.format("MMMM")}-${year}.csv`;
    try{
    const repsonse =await new Promise( (resolve, reject) => {
        csv.stringify(data, (err, output) => {
            if ( err ) {
                reject(err);
            } else {
                if( !fs.existsSync("reports") ) fs.mkdirSync("reports");
                fs.writeFileSync(fileName, output, );
                resolve();
            }
        });
    });
    } catch( err ) {
        fileName = null;
        error( err );
    }
    return fileName;
}