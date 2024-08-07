import dotenv from 'dotenv';
dotenv.config();
import GuildMember from "./guildmember.js";
import { format, info, error, warn, debug} from '../logger.js';
import { getGoogleSheetData, setGoogleSheetDataCell, insertGoogleSheetRow } from '../resources/googlesheets.js';
import dayjs from 'dayjs';

const GOOGLE_SHEET_ID = '1_ZyImw6ns9Gqw4jSKtH67iWRbGtQkeJnEXroowXPgas';
const SHEET_GUILD_INFO = 'Guild Info';
//COLUMNS
const DISCORD_COL = 'D';
const REGISTERED_COL = 'G';
//ROWS
const ROW_START_MEMBER_LIST = 4;
//RANGES
const RANGE_GUILD_MEMBERS = `A${ROW_START_MEMBER_LIST}:T500`;

const CACHE_INVALIDATION_TIMEOUT = 5 * 60 * 1000;

let cache = {
    timestamp: dayjs().subtract(CACHE_INVALIDATION_TIMEOUT, 'milliseconds'),
    guildies: []
};

export const getGuildInfoColumns = async () => {
    let headers = [];
    try {
        let googleSheetData = await getGoogleSheetData( GOOGLE_SHEET_ID, SHEET_GUILD_INFO, 'A3:U3' );
        headers = googleSheetData;
    } catch( err ) {
        error( 'Get Guild Info Headers Error: ' + err );
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
    let guildies = [];
    let now = dayjs();
    try {
        if( now.diff(cache.timestamp) >= CACHE_INVALIDATION_TIMEOUT || cache.guildies.length === 0 ) {
            let googleSheetData = await getGoogleSheetData( GOOGLE_SHEET_ID, SHEET_GUILD_INFO, RANGE_GUILD_MEMBERS );
            if( googleSheetData ) {
                guildies = googleSheetData.filter( row => row[2] !== '' );
                if( guildies ){
                    guildies = guildies.map( (row,i) => {
                        let guildy = GuildMember.parse(row);
                        //This sets the row to where it is in the document
                        guildy.row = (i)+ROW_START_MEMBER_LIST;
                        return guildy;
                    });
                    cache.timestamp = now;
                    cache.guildies = guildies;
                }
            }    
        } else {
            guildies = cache.guildies;
        }
    } catch( err ) {
        error('The API returned an error: ' + err);
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
        info( `Searching Squad Comp GoogleSheet for ${ format.highlight(guildMemberName)}`);
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
        error( err );
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
        member = guildies.find( g => g.discordID?.toLowerCase().includes( username.toLowerCase() ) );

        if( !member ) {
            warn(`Couldn't find ${ username } in document.`);
        }
        else {
            info( `Found ${username}: ${member.gw2ID}`);
        }
    } catch( err ) {
        error( err );
    }
    return member;
}

/**
 * Search for a Guild Member. In the google sheet.
 * 
 * @param {Array<string>} usernames The name of the guild member to look up. Can be TS Nickname, Discord ID or GW2.ID
 * @returns {GuildMember} the Guild member found, null otherwise
 */
export async function getGuildMembersByDiscord( usernames ) {
    let members = [];
    let couldntFind = [];
    try{    
        let guildies = await getGuildMembers();
        for( let username of usernames ){
            let member = guildies.find( g => g.discordID?.toLowerCase().includes( username.toLowerCase() ) );
            if( !member ) {
                couldntFind.push( username );
            }
            else {
                members.push( member );
            }
        }
    } catch( err ) {
        error( err );
    }
    if( couldntFind.length > 0 ){
        warn(`Couldn't find discord users: ${couldntFind.join(',')}`);
    }
    info( `Found ${ members.length} / ${ usernames.length } members `);
    return members;
}


/**
 * Search for a Guild Member. In the google sheet.
 * 
 * @param {string} username The name of the guild member to look up. Can be TS Nickname, Discord ID or GW2.ID
 * @returns {GuildMember} the Guild member found, null otherwise
 */
export const getGuildMemberByGW2Id = async ( gw2Id )  => {
    debug( `Searching Squad Comp GoogleSheet for ${ gw2Id }` );
    let member = null;
    try{
        let guildies = await getGuildMembers();
        member = guildies.find( g => gw2Id.localeCompare(g.gw2ID, 'en', { sensitivity: 'base' }) === 0);

        if( !member ) {
            warn(`Couldn't find ${ gw2Id } in document.`);
        }
        else {
            info( `Found ${gw2Id}: ${member.gw2ID}`);
        }
    } catch( err ) {
        error( err );
    }
    return member;
}

export const getAPIKey = async ( guildMemberKey ) => {
    let guildmember = await getGuildMember( guildMemberKey );
    return guildmember?.automatonAPIKey ?? '';
}

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

export const registerDiscordUserName = async ( gw2Id, discordId ) => {
    info(`registerDiscordUserName( ${gw2Id}, ${discordId}) `);
    
    let guildMember = await getGuildMember(gw2Id);
    if( !guildMember){
        return false;
    }else{
        console.log(guildMember);
        let usernameData = await setGoogleSheetDataCell( GOOGLE_SHEET_ID, SHEET_GUILD_INFO,`${DISCORD_COL}${guildMember.row}`, discordId );
        debug( `registerDiscordUserName: ${JSON.stringify(usernameData)}` );
        let isRgisteredData = await setGoogleSheetDataCell( GOOGLE_SHEET_ID, SHEET_GUILD_INFO,`${REGISTERED_COL}${guildMember.row}`, true );
        debug( `registerDiscordUserName: ${JSON.stringify(isRgisteredData)}` );
        return true;
    }
}

export const setDiscordUserName = async ( gw2Id, discordId ) => {
    info(`setDiscordUserName( ${gw2Id}, ${discordId}) `);
    let guildMember = await getGuildMember(gw2Id);
    if( !guildMember){
        return false;
    }else{
        let data = await setGoogleSheetDataCell( GOOGLE_SHEET_ID, SHEET_GUILD_INFO,`${DISCORD_COL}${guildMember.row}`, discordId );
        debug( `setDiscordUserName: ${JSON.stringify(data)}` );
        return true;
    }
}

export const insertNewGuildMember = async ( gw2Id, discordId = '',nickname = '', agreedToTerms = false, status = 'Recruit', registered = false, mainClass = '', mainRole = '', guildBuild = false ) => {
    const guildMembers = await getGuildMembers();
    const exists = guildMembers.find( g => g.gw2ID === gw2Id );
    if( !exists ) {
        const rowNum = getRowNumberForInsert( guildMembers, gw2Id );
        let data = await insertGoogleSheetRow( GOOGLE_SHEET_ID, SHEET_GUILD_INFO, 'B', rowNum, [
            nickname, gw2Id, discordId, agreedToTerms, status, registered, mainClass, mainRole, guildBuild
        ]);
        debug( `insertNewGuildMember: ${JSON.stringify(data)}` );
        return true;
    } else {    
        return false;
    }
}

/**
 * @param {GuildMember[]} guildMembers 
 * @param {string} gw2Id
 * @returns {number} The row number where the member should be inserted
 */
const getRowNumberForInsert = ( guildMembers, gw2Id ) => {
    for( let i = 0; i < guildMembers.length; i++ ){
        let cur = guildMembers[i];
        console.log( gw2Id, cur.gw2ID, gw2Id.localeCompare(cur.gw2ID, 'en', { sensitivity: 'base' , ignorePunctuation: true }) );
        if( gw2Id.localeCompare(cur.gw2ID, 'en', { sensitivity: 'base' , ignorePunctuation: true }) === -1 ){
            return cur.row;
        }
    }
    return guildMembers[guildMembers.length - 1].row + 1;
}