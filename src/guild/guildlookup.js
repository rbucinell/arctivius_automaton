import { google } from "googleapis";
import dotenv from 'dotenv';
dotenv.config();
import GuildMember from "./guildmember.js";
import { info, error, warn} from '../logger.js';

// const secretKey = JSON.parse( await readFile( new URL('../arctivius-automaton-649b1e5eb52d.json', import.meta.url)) );
const secretKey = JSON.parse(process.env.GOOGLE_SECRT_KEY);
const spreadsheetId = '1_ZyImw6ns9Gqw4jSKtH67iWRbGtQkeJnEXroowXPgas';
const sheet = 'Guild Info';
const range = 'A4:Q700'
//https://blog.coupler.io/how-to-use-google-sheets-as-database/

/**
 * Gets the list of guild members and the associated data
 * 
 * @returns Array<GuildMember> The list of guild members
 */
export const getGuildMembers = async () =>
{
    info( `Get Squad Comp GoogleSheet requested`);
    let guildies = [];
    let sheets = google.sheets('v4');
    let jwtClient = new google.auth.JWT( secretKey.client_email, null, secretKey.private_key, ['https://www.googleapis.com/auth/spreadsheets']);
    await jwtClient.authorize();
    try {
        let response = await sheets.spreadsheets.values.get({ auth: jwtClient, spreadsheetId: spreadsheetId, range: `${sheet}!${range}` });
        for (let row of response.data.values) {
            if( row[0] )
            {
                let guildMember = GuildMember.parse(row);
                guildies.push(guildMember);
            }
        }
        info( `GoogleSheet request successful. ${ guildies.length } members found`);
    }catch( err ) {
        error('The API returned an error: ' + err, true);
    }
    return guildies;
}

/**
 * Search for a Guild Member. In the google sheet.
 * 
 * @param {string} guildMemberName The name of the guild member to look up. Can be TS Nickname, Discord ID or GW2.ID
 * @returns {GuildMember} the Guild member found, null otherwise
 */
export const getGuildMember = async ( guildMemberName )  => {
    let member = null;
    try{
        info( `Searching Squad Comp GoogleSheet for ${ guildMemberName}`);
        let guildies = await getGuildMembers();
        member = guildies.find( g => g.discordID === guildMemberName || g.gw2ID === guildMemberName || g.teamspeakName === guildMemberName );
        if( !member ) {
            warn(`Couldn't find ${ guildMemberName } in document.`);
        }
        else {
            info( `Found ${guildMemberName}: ${member}`);
        }
    } catch( err ) {
        error( err, true );
    }
    return member;
}