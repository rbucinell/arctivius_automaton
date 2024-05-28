import { google } from "googleapis";
import dotenv from 'dotenv';
import { debug, error, info, format } from "../logger.js";
import dayjs from "dayjs";
dotenv.config();

let sheets = google.sheets('v4');
const secretKey = JSON.parse(process.env.GOOGLE_SECRT_KEY);
const valueInputOption = 'RAW'; //USER_ENTERED

const CACHE_INVALIDATION_TIMEOUT = 5 * 60 * 1000;

let cache = {};


/**
 * 
 * @param {string} googleSheetId The unique id of the sheets url
 * @param {string} sheet Name of the sheet tab
 * @param {string} range Range to lookup in alphanumeric format (i.e. A1:B20)
 * @returns 
 */
export const getGoogleSheetData = async ( spreadsheetId, sheet, range ) => {
    let data = null;
    let usingCache = false;
    let now = dayjs();
    if( cache.hasOwnProperty( range )){
        
        if( now.diff(cache[range].timestamp) <= CACHE_INVALIDATION_TIMEOUT ) {
            debug( `${format.CACHE()} Google Sheet Data: range=${range}`, false);
            data = cache[range].data;
            usingCache = true;
        }
        else {
            delete cache[range];
        }    
    }
    if( data == null ){
        debug( `${format.GET()} Google Sheet Data: id=${spreadsheetId}, range=${range}`, false);
        try {
            let jwtClient = new google.auth.JWT( secretKey.client_email, null, secretKey.private_key, ['https://www.googleapis.com/auth/spreadsheets']);
            const creds = await jwtClient.authorize();
            let response = await sheets.spreadsheets.values.get({ auth: jwtClient, spreadsheetId, range: `${sheet}!${range}` });
            data = response.data.values;
            cache[range] = {
                timestamp: now,
                data: data,
                range: range
            };
        }
        catch( err ) {
            error(`The API returned an error: ${err}`, true);
        }
    }
    return data;
}

export const setGoogleSheetDataCell = async ( spreadsheetId, sheet, cell, value ) => {
    debug(`${format.PUT()} Google Sheet Data: id=${spreadsheetId}, range=${cell}, value=${value}`, false);
    let data = null;
    try{
        let jwtClient = new google.auth.JWT( secretKey.client_email, null, secretKey.private_key, ['https://www.googleapis.com/auth/spreadsheets']);
        const creds = await jwtClient.authorize();
        let response = await sheets.spreadsheets.values.update({ 
            auth: jwtClient, 
            spreadsheetId, 
            range: `${sheet}!${cell}`, 
            valueInputOption: valueInputOption, 
            resource: {
                values:[ [value] ]
            },
            includeValuesInResponse: true
        });
        debug(`setGoogleSheetDataCell set command response: ${ response }`)
        data = response.data;
    }
    catch( err ){
        error(`The API returned an error: ${err}`, true );
    }
    return data;
};