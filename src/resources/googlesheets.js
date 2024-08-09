import { google } from "googleapis";
import dotenv from 'dotenv';
import { debug, error, format, LogOptions } from "../logger.js";
import dayjs from "dayjs";
dotenv.config();

let sheets = google.sheets('v4');
const valueInputOption = 'RAW'; //USER_ENTERED
const CACHE_INVALIDATION_TIMEOUT = 5 * 60 * 1000;
let CACHE_INVALID_FLAG = false;
let cache = {};

/**
 * Retrieves authentication credentials for accessing Google Sheets.
 *
 * @return {Promise<Object>} A promise that resolves to an object containing authentication credentials.
 */
const getAuth = async () => {
    const secretKey = JSON.parse(process.env.GOOGLE_SECRT_KEY);
    const jwtClient = new google.auth.JWT( secretKey.client_email, null, secretKey.private_key, ['https://www.googleapis.com/auth/spreadsheets']);
    await jwtClient.authorize();
    return jwtClient;
}

/**
 * 
 * @param {string} googleSheetId The unique id of the sheets url
 * @param {string} sheet Name of the sheet tab
 * @param {string} range Range to lookup in alphanumeric format (i.e. A1:B20)
 * @returns 
 */
export const getGoogleSheetData = async ( spreadsheetId, sheet, range, invalidateCache = false ) => {
    let data = null;
    let usingCache = false;
    let now = dayjs();
    if( !invalidateCache && cache.hasOwnProperty( range )){
        
        if( now.diff(cache[range].timestamp) <= CACHE_INVALIDATION_TIMEOUT ) {
            debug( `${format.CACHE()} Google Sheet Data: range=${range}`);
            data = cache[range].data;
            usingCache = true;
        }
        else {
            delete cache[range];
        }    
    }
    if( data == null ){
        debug( `${format.GET()} Google Sheet Data: id=${spreadsheetId}, range=${range}`, LogOptions.LogOnly );
        try {
            const auth = await getAuth();
            
            let response = await sheets.spreadsheets.values.get({ auth, spreadsheetId, range: `${sheet}!${range}` });
            data = response.data.values;
            cache[range] = {
                timestamp: now,
                data: data,
                range: range
            };
        }
        catch( err ) {
            error(`The API returned an error: ${err}`);
        }
    }
    return data;
}

export const setGoogleSheetDataCell = async ( spreadsheetId, sheet, cell, value ) => {
    debug(`${format.PUT()} Google Sheet Data: id=${spreadsheetId}, range=${cell}, value=${value}`);
    let data = null;
    try{
        const auth = await getAuth();
        let response = await sheets.spreadsheets.values.update({ 
            auth, 
            spreadsheetId, 
            range: `${sheet}!${cell}`, 
            valueInputOption: valueInputOption, 
            resource: {
                values:[ [value] ]
            },
            includeValuesInResponse: true
        });
        debug(`setGoogleSheetDataCell set command response: ${ response }`);
        data = response.data;
    }
    catch( err ){
        error(`The API returned an error: ${err}` );
    }
    return data;
};

export const insertGoogleSheetRow = async( spreadsheetId, sheet, col, row, inputArray ) => {
    let data = null;
    let range = `${sheet}!${col}${row}`;
    debug(`${format.POST()} Insert Google Sheet Range: id=${spreadsheetId}, range=${range}`);
    try {
        const auth = await getAuth();
        let response = await sheets.spreadsheets.values.append({
            auth,
            spreadsheetId,
            valueInputOption,
            range,
            insertDataOption: "INSERT_ROWS",
            responseValueRenderOption: "FORMATTED_VALUE",
            responseDateTimeRenderOption: "FORMATTED_STRING", 
            resource: {
                values:[ inputArray ]
            },
            includeValuesInResponse: true
        });        
        debug(`insertRnage set command response: ${ response.status }`);
        data = response.data;
    }
    catch(err) {
        error(`The API returned an error: ${err}` );
    }
    return data;
}

/**
 * Converts a JavaScript Date object to a Google Date value.
 *
 * @param {Date} JSdate - The JavaScript Date object to be converted.
 * @return {number} The equivalent Google Date value.
 */
export function googleDate( jsDate ) { 
    var D = new Date(jsDate) ;
    var Null = new Date(Date.UTC(1899,11,30,0,0,0,0)) ; // the starting value for Google
    return ((D.getTime()  - Null.getTime())/60000 - D.getTimezoneOffset()) / 1440 ;
 }