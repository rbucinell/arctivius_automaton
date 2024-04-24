import dotenv from 'dotenv';
dotenv.config();
import GuildMember from "./guildmember.js";
import { info, error, warn, debug} from '../logger.js';
import { getGoogleSheetData, setGoogleSheetDataCell } from '../resources/googlesheets.js';

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
    info( `Get Squad Comp GoogleSheet requested`, false);
    let guildies = [];
    try {
        let googleSheetData = await getGoogleSheetData( GOOGLE_SHEET_ID, SHEET_GUILD_INFO, RANGE_GUILD_MEMBERS );
        if( googleSheetData ) {
            guildies = googleSheetData.filter( row => row[2] !== '' ).map( (row,i) => {
                let guildy = GuildMember.parse(row);
                guildy.row = (i+1)+4;
                return guildy;
            });
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

/**
 * Search for a Guild Member. In the google sheet.
 * 
 * @param {string} username The name of the guild member to look up. Can be TS Nickname, Discord ID or GW2.ID
 * @returns {GuildMember} the Guild member found, null otherwise
 */
export const getGuildMemberByDiscord = async ( username )  => {
    let member = null;
    try{
        info( `Searching Squad Comp GoogleSheet for ${ username}`);
        let guildies = await getGuildMembers();
        member = guildies.find( g => g.discordID.toLowerCase().includes( username.toLowerCase() ) );

        if( !member ) {
            warn(`Couldn't find ${ username } in document.`);
        }
        else {
            info( `Found ${username}: ${member.gw2ID}`);
        }
    } catch( err ) {
        error( err, true );
    }
    return member;
}

/**
 * Search for a Guild Member. In the google sheet.
 * 
 * @param {string} username The name of the guild member to look up. Can be TS Nickname, Discord ID or GW2.ID
 * @returns {GuildMember} the Guild member found, null otherwise
 */
export const getGuildMemberByGW2Id = async ( gw2Id )  => {
    info( `getGuildMemberByGW2Id( ${ gw2Id } )` );
    let member = null;
    try{
        debug( `Searching Squad Comp GoogleSheet for ${ gw2Id }`, true );
        let guildies = await getGuildMembers();
        member = guildies.find( g => gw2Id.localeCompare(g.gw2ID, 'en', { sensitivity: 'base' }) === 0);

        if( !member ) {
            warn(`Couldn't find ${ gw2Id } in document.`);
        }
        else {
            info( `Found ${gw2Id}: ${member.gw2ID}`);
        }
    } catch( err ) {
        error( err, true );
    }
    return member;
}

export const getAPIKey = async ( guildMemberKey ) => {
    let guildmember = await getGuildMember( guildMemberKey );
    return guildmember?.automatonAPIKey ?? '';
}

/**
 * 
 */
export const setAPIKey = async ( discordUserName, apiKey ) => {
    info(`setAPIKey( ${discordUserName}, ${apiKey})`);
    const AUTOMATON_API_KEY_COL = 'P';
    let guildmember = await getGuildMemberByDiscord(discordUserName);
    if( guildmember ){
        debug(`setAPIKey: guildmember found ${ guildmember.gw2ID }, they are on row: ${guildmember.row} `);
        let data = await setGoogleSheetDataCell( GOOGLE_SHEET_ID, SHEET_GUILD_INFO, `${AUTOMATON_API_KEY_COL}${guildmember.row  }`, apiKey);
        debug(`setAPIKey: setGoogleSheetDataCell data: ${ JSON.stringify(data) }`)
        return true;
    }else{
        debug(`setAPIKey: guildmember not found`);
        return false;
    }
}

export const setDiscordUserName = async ( gw2Id, discordId ) => {
    info(`setDiscordUserName( ${gw2Id}, ${discordId}) `);
    const DISCORD_COL = 'D';
    let guildMember = await getGuildMember(gw2Id);
    if( !guildMember){
        return false;
    }else{
        let data = await setGoogleSheetDataCell( GOOGLE_SHEET_ID, SHEET_GUILD_INFO,`${DISCORD_COL}${guildMember.row}`, discordId );
        debug( `setDiscordUserName: ${JSON.stringify(data)}` );
        return true;
    }
}