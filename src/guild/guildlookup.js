import { google } from "googleapis";
import dotenv from 'dotenv';
dotenv.config();
import GuildMember from "./guildmember.js";
// const secretKey = JSON.parse( await readFile( new URL('../arctivius-automaton-649b1e5eb52d.json', import.meta.url)) );
const secretKey = JSON.parse(process.env.GOOGLE_SECRT_KEY);
const spreadsheetId = '1_ZyImw6ns9Gqw4jSKtH67iWRbGtQkeJnEXroowXPgas';
const sheetRange = 'Guild Info!A4:Q700'
//https://blog.coupler.io/how-to-use-google-sheets-as-database/
/**
 * Gets the list of guild members and the associated data
 * 
 * @returns Array<GuildMember> The list of guild members
 */
export const getGuildMembers = async () =>
{
    let guildies = [];

    let sheets = google.sheets('v4');
    let jwtClient = new google.auth.JWT( secretKey.client_email, null, secretKey.private_key, ['https://www.googleapis.com/auth/spreadsheets']);
    await jwtClient.authorize();
    try {
        let response = await sheets.spreadsheets.values.get({ auth: jwtClient, spreadsheetId: spreadsheetId, range: sheetRange });
        console.log(`Spitting out pack members:`);
        for (let row of response.data.values) {
            if( row[0] )
            {
                let guildMember = GuildMember.parse(row);
                guildies.push(guildMember);
            }
        }
    }catch( err ) {
        console.log('The API returned an error: ' + err);
    }
    return guildies;
}



// import { google } from "googleapis";
// import { readFile } from 'fs/promises';


// //authenticate request
// let jwtClient = new google.auth.JWT( secretKey.client_email, null, secretKey.private_key, ['https://www.googleapis.com/auth/spreadsheets']);
// await jwtClient.authorize();

// //Google Sheets API
// let spreadsheetId = '1_ZyImw6ns9Gqw4jSKtH67iWRbGtQkeJnEXroowXPgas';
// let sheetRange = 'Guild Info!A4:Q100'
// let sheets = google.sheets('v4');

// try{
//     let response = await sheets.spreadsheets.values.get({ auth: jwtClient, spreadsheetId: spreadsheetId, range: sheetRange });
//     console.log(`Spitting out pack members:`);
//     for (let row of response.data.values) {
//         if( row[1] !== '' && row[1] !== '#' && row[1] !== '*' && row[1] !== '.')
//         {
//             let main = row[7].trim().replace('\n', ' ');
//             if( !main ) main = '?';
//             console.log(`[${row[2]}]${row[1]}\t\tMains: ${row[7].trim().replace('\n', ' ')}`);
//         }
//     }
// }catch( err )
// {
//     console.log('The API returned an error: ' + err);
// }