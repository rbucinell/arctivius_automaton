import dotenv from 'dotenv';
dotenv.config();
import GuildMember from "./guildmember.js";
import { info, error, warn} from '../logger.js';
import { getGoogleSheetData } from '../resources/googlesheets.js';

const GOOGLE_SHEET_ID = '1_ZyImw6ns9Gqw4jSKtH67iWRbGtQkeJnEXroowXPgas';
const SHEET_GUILD_INFO = 'Guild Info';
const RANGE_GUILD_MEMBERS = 'A4:T700';

export const getGuildInfoColumns = async () => {
    let headers = [];
    try {
        let googleSheetData = await getGoogleSheetData( GOOGLE_SHEET_ID, SHEET_GUILD_INFO, 'A3:U3' );
        headers = googleSheetData;
    } catch( err ) {
        error( 'Get Guild Info Headers Error: ' + err, true );
    }
    return headers;
}

/**
 * Gets the list of guild members and the associated data
 * 
 * @returns Array<GuildMember> The list of guild members
 */
export const getGuildMembers = async () =>
{
    info( `Get Squad Comp GoogleSheet requested`);
    let guildies = [];
    try {
        let googleSheetData = await getGoogleSheetData( GOOGLE_SHEET_ID, SHEET_GUILD_INFO, RANGE_GUILD_MEMBERS );
        if( googleSheetData ) {
            for (let row of googleSheetData) {
                if( row[2] ) //GW2.ID
                {
                    let guildMember = GuildMember.parse(row);
                    guildies.push(guildMember);
                }
            }
            info( `GoogleSheet request successful. ${ guildies.length } members found`);
        }        
    } catch( err ) {
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
        member = guildies.find( g => 
            guildMemberName.localeCompare(g.gw2ID, 'en', { sensitivity: 'base' }) === 0||
            guildMemberName.localeCompare(g.discordID, 'en', { sensitivity: 'base' })  === 0 ||
            guildMemberName.localeCompare(g.teamspeakName, 'en', { sensitivity: 'base' })  === 0
        );

        if( !member ) {
            warn(`Couldn't find ${ guildMemberName } in document.`);
        }
        else {
            info( `Found ${guildMemberName}: ${member.gw2ID}`);
        }
    } catch( err ) {
        error( err, true );
    }
    return member;
}