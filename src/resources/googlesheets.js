import { google } from "googleapis";
import dotenv from 'dotenv';
import { error } from "../logger.js";
dotenv.config();

let sheets = google.sheets('v4');
const secretKey = JSON.parse(process.env.GOOGLE_SECRT_KEY);
const valueInputOption = 'RAW'; //USER_ENTERED

/**
 * 
 * @param {string} googleSheetId The unique id of the sheets url
 * @param {string} sheet Name of the sheet tab
 * @param {string} range Range to lookup in alphanumeric format (i.e. A1:B20)
 * @returns 
 */
export const getGoogleSheetData = async ( spreadsheetId, sheet, range ) => {
    let data = null;
    try {
        let jwtClient = new google.auth.JWT( secretKey.client_email, null, secretKey.private_key, ['https://www.googleapis.com/auth/spreadsheets']);
        const creds = await jwtClient.authorize();
        let response = await sheets.spreadsheets.values.get({ auth: jwtClient, spreadsheetId, range: `${sheet}!${range}` });
        data = response.data.values;
    }
    catch( err ) {
        error(`The API returned an error: ${err}`, true);
    }
    return data;
}

export const setGoogleSheetDataCell = async ( spreadsheetId, sheet, cell, value ) => {
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
        data = response.data;
    }
    catch( err ){
        error(`The API returned an error: ${err}`, true );
    }
    return data;
};