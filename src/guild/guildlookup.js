import dotenv from 'dotenv';
dotenv.config();
import GuildMember from "./guildmember.js";
import { format, info, error, warn, debug, LogOptions} from '../logger.js';
import { getGoogleSheetData, setGoogleSheetDataCell, insertGoogleSheetRow, googleDate } from '../resources/googlesheets.js';
import dayjs from 'dayjs';
import { settings, compareToCaseInsensitive } from '../util.js';
import { db, registrations } from '../resources/mongodb.js';

let sheetSettings = {};
settings.googlesheets.forEach( _ => sheetSettings[_.guildTag] = _);

//COLUMNS
export const Columns = Object.freeze({
    FIRST: 'A',
    LAST: 'I',
    gw2ID: 'A',
    username: 'B',
    nickname: 'C',
    agreedToTerms: 'D',
    status: 'E',
    registered: 'F',
    //guildBuildGiven: 'G',
    //inBoth: 'H',
    joined: 'G',
    //apikey: 'J',
    notes: 'L'
});


//ROWS
const ROW_START_MEMBER_LIST = 2;
//RANGES
const RANGE_GUILD_MEMBERS = `${Columns.FIRST}${ROW_START_MEMBER_LIST}:${Columns.LAST}500`;

let CACHE_INVALID_FLAG = false;
const CACHE_INVALIDATION_TIMEOUT = 5 * 60 * 1000;

let cache = {
    guilds: {
        'PACK': {
            timestamp: dayjs().subtract(CACHE_INVALIDATION_TIMEOUT, 'milliseconds'),
            guildies: [],
            invalidFlag: false
        },
        'CBo': {
            timestamp: dayjs().subtract(CACHE_INVALIDATION_TIMEOUT, 'milliseconds'),
            guildies: [],
            invalidFlag: false
        }
    }
};

export function invalidSheetCache(tag = null) {
    Object.values( cache.guilds ).forEach( _ => {
        if( tag === null || _.tag === tag ) {
            _.invalidFlag = true;
        }
    });
}

/**
 * Retrieves the column headers from the guild info sheet in Google Sheets.
 * @param {string} [sheetId=''] - The ID of the Google Sheet. Defaults to the PACK sheet.
 * @param {string} [sheetName=''] - The name of the Google Sheet tab. Defaults to the PACK sheet.
 *
 * @return {Array<string>} An array of column headers
 */
export const getGuildInfoColumns = async ( guildTag = 'PACK' ) => { //sheetId = sheetSettings.PACK.sheetId, sheetName = sheetSettings.PACK.sheetName
    let headers = [];
    try {
        let googleSheetData = await getGoogleSheetData( sheetSettings[guildTag].sheetId, sheetSettings[guildTag].sheetName, `${Columns.FIRST}2:${Columns.LAST}2`);
        headers = googleSheetData;
    } catch( err ) {
        error( 'Get Guild Info Headers Error: ' + err );
    }
    return headers;
}

/**
 * Gets the list of guild members and the associated data
 * @param {string} [guildTag='PACK'] - The guild tag to get the list of members from. Defaults to PACK.
 * 
 * @returns {Array<GuildMember>} The list of guild members
 */
export const getGuildMembers = async ( guildTag = 'PACK' ) =>
{
    let guildies = [];
    let now = dayjs();
    let guildCache = cache.guilds[guildTag];
    try {
        if( now.diff(guildCache.timestamp) >= CACHE_INVALIDATION_TIMEOUT || guildCache.invalidFlag || guildCache.guildies.length === 0 ) {
            let googleSheetData = await getGoogleSheetData( sheetSettings[guildTag].sheetId, sheetSettings[guildTag].sheetName, RANGE_GUILD_MEMBERS, true );
            if( googleSheetData ) {
                guildies = googleSheetData.filter( row => row[0] !== '' );
                if( guildies ){
                    guildies = guildies.map( (row,i) => {
                        let guildy = GuildMember.parse(row);
                        //This sets the row to where it is in the document
                        guildy.row = (i)+ROW_START_MEMBER_LIST;
                        return guildy;
                    });
                    guildCache.timestamp = now;
                    guildCache.guildies = guildies;
                    guildCache.invalidFlag = false;
                }
            }    
        } else {
            guildies = guildCache.guildies;
        }
    } catch( err ) {
        error('The API returned an error: ' + err);
    }
    return guildies;
}

const findGuildMemberFromName = async ( name, guildTag) => {
    let guildies = await getGuildMembers(guildTag);
    let member = guildies.find( g => compareToCaseInsensitive(g.Gw2Id, name));
    if(!member){
        member = guildies.find( g => compareToCaseInsensitive(g.Username, name));
    }
    if(!member){
        member = guildies.find( g => compareToCaseInsensitive(g.Nickname, name));
    }
    if( member ){
        member.guildTag = guildTag;
    }
    return member;
};

/**
 * Search for a Guild Member. In the google sheet.
 * 
 * @param {string} guildMemberName The name of the guild member to look up. Can be TS Nickname, Discord ID or GW2.ID
 * @returns {GuildMember} the Guild member found, null otherwise
 */
export const getGuildMember = async ( guildMemberName, guildTag)  => {
    let member = null;
    try{
        info( `Searching Squad Comp GoogleSheet for ${ format.highlight(guildMemberName)} in ${ format.highlight(guildTag)}`);
        if( guildTag ){
            member = await findGuildMemberFromName(guildMemberName,guildTag);
        } else {
            member = await findGuildMemberFromName(guildMemberName,'PACK');
            if ( !member ) {
                member = await findGuildMemberFromName(guildMemberName,'CBo');
            }
        }
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
export const getGuildMemberByDiscord = async ( username, guildTag )  => {
    let member = null;
    try{
        info( `Searching Squad Comp GoogleSheet for ${username} in ${guildTag}`);
        if( guildTag ){
            let guildies = await getGuildMembers(guildTag);
            member = guildies.find( g => g.discord.username?.toLowerCase().includes( username.toLowerCase() ) );
        } else {
            let guildies = await getGuildMembers('PACK');
            member = guildies.find( g => g.discord.username?.toLowerCase().includes( username.toLowerCase() ) );
            if ( !member ) {
                guildies = await getGuildMembers('CBo');
                member = guildies.find( g => g.discord.username?.toLowerCase().includes( username.toLowerCase() ) );
            }
        }

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
 * @returns {Array<GuildMember>} the Guild member found, null otherwise
 */
export async function getGuildMembersByDiscord( usernames, guildTag = 'PACK' ) {
    let members = [];
    let couldntFind = [];
    try{    
        let guildies = await getGuildMembers(guildTag);
        for( let username of usernames ){
            let member = guildies.find( g => g.discord.username?.toLowerCase().includes( username.toLowerCase() ) );
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
export const getGuildMemberByGW2Id = async ( gw2Id, guildTag = 'PACK' )  => {
    debug( `Searching Squad Comp GoogleSheet for ${ gw2Id } in ${ guildTag }` );
    let member = null;
    try{
        let guildies = await getGuildMembers(guildTag);
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
    return guildmember?.apiKey ?? '';
}

/**
 * Sets the API key for a guild member.
 *
 * @param {string} discordUserName - The Discord username of the guild member.
 * @param {string} apiKey - The API key to set.
 * @param {string} [guildTag='PACK'] - The guild tag. Defaults to PACK.
 * @return {boolean} True if the API key was set successfully, false otherwise.
 */
export const setAPIKey = async ( discordUserName, apiKey, guildTag = 'PACK' ) => {
    info(`setAPIKey( ${discordUserName}, ${apiKey})`);
    
    //First update DB
    if( await registrations.findOne({ "discord.username": discordUserName }) ){
        await registrations.updateOne({ "discord.username": discordUserName }, { $set: { apiKey: apiKey } });
    }

    //Second update Doc
    let guildmember = await getGuildMemberByDiscord(discordUserName);
    if( guildmember ){
        debug(`setAPIKey: guildmember found ${ guildmember.gw2ID }, they are on row: ${guildmember.row} `);
        let data = await setGoogleSheetDataCell( sheetSettings[guildTag].sheetId, sheetSettings[guildTag].sheetName, `${Columns.apikey}${guildmember.row  }`, apiKey);
        debug(`setAPIKey: setGoogleSheetDataCell data: ${ JSON.stringify(data) }`)
        return true;
    }else{
        debug(`setAPIKey: guildmember not found`);
        return false;
    }
}

export const registerDiscordUserName = async ( gw2Id, username, guildTag = 'PACK' ) => {
    info(`registerDiscordUserName( ${gw2Id}, ${username}) `);
    let sheetId = sheetSettings[guildTag].sheetId;
    let sheetName = sheetSettings[guildTag].sheetName;

    let guildMember = await getGuildMember(gw2Id, guildTag);
    if( !guildMember){
        return false;
    }else{
        let usernameData = await setGoogleSheetDataCell( sheetId, sheetName,`${Columns.username}${guildMember.row}`, username );
        debug( `registerDiscordUserName: ${JSON.stringify(usernameData)}` );
        let isRgisteredData = await setGoogleSheetDataCell( sheetId, sheetName,`${Columns.registered}${guildMember.row}`, true );
        debug( `registerDiscordUserName: ${JSON.stringify(isRgisteredData)}` );
        return true;
    }
}

export const setDiscordUserName = async ( gw2Id, username, guildTag = 'PACK' ) => {
    info(`setDiscordUserName( ${gw2Id}, ${username}) `);
    let guildMember = await getGuildMember(gw2Id, guildTag);
    if( guildMember){
        let data = await setGoogleSheetDataCell( sheetSettings[guildTag].sheetId, sheetSettings[guildTag].sheetName,`${Columns.username}${guildMember.row}`, username );
        debug( `setDiscordUserName: ${JSON.stringify(data)}` );
        return true;
    }
    return false;
}

/**
 * Sets the properties for a guild member with the given Guild Wars 2 ID.
 *
 * @param {string} gw2Id - The Guild Wars 2 ID of the guild member.
 * @param {object} properties - An object containing the properties to be set.
 * @return {Promise<boolean>} A Promise that resolves when the properties have been set.
 */
export const setColumnValues = async ( gw2Id, properties, guildTag = 'PACK' ) => {
    info(`setProperties( ${gw2Id}, ${JSON.stringify(properties)}) `);
    let guildMember = await getGuildMember(gw2Id, guildTag);
    if( guildMember){
        for( const [key, value] of Object.entries(properties) ){
            let data = await setGoogleSheetDataCell( sheetSettings[guildTag].sheetId, sheetSettings[guildTag].sheetName,`${Columns[key]}${guildMember.row}`, value );
            debug( `setProperties: ${JSON.stringify(data)}` );
        }
        return true;
    }
    return false;
}

/**
 * Inserts a new guild member into the Google Sheet if the member does not already exist.
 *
 * @param {string}  gw2Id - The Guild Wars 2 ID of the guild member.
 * @param {string}  guildTag - The guild tag. Defaults to PACK.
 * @param {object}  properties - An object containing the properties of the guild member to be set.
 * @param {string}  [properties.username=''] - The Discord Username of the guild member.
 * @param {string}  [properties.nickname=''] - The nickname of the guild member.
 * @param {boolean} [properties.agreedToTerms=false] - Whether the guild member has agreed to the terms.
 * @param {string}  [properties.status='Recruit'] - The status of the guild member.
 * @param {boolean} [properties.registered=false] - Whether the guild member is registered.
 * @param {boolean} [properties.guildBuildGiven=false] - Whether the guild build has been given to the member.
 * @param {Date}    [properties.joined=Date.now()] - The date and time the member joined.
 * @param {string}  [properties.notes=''] - Any additional notes about the guild member.
 * 
 * @return {boolean} Whether the insertion was successful.
 */
export const insertNewGuildMember = async ( gw2Id, guildTag, properties = {} ) => {
    info( `Attempting to insert into Squad Comp Doc: [${guildTag}] ${format.highlight(gw2Id)}`, LogOptions.LocalOnly );
    const guildMembers = await getGuildMembers(guildTag);
    const exists = guildMembers.find( g => g.gw2ID === gw2Id );
    if( !exists ) {
        const rowNum = getRowNumberForInsert( guildMembers, gw2Id );
        if( rowNum === -1 ) return false;
        let data = await insertGoogleSheetRow( sheetSettings[guildTag].sheetId, sheetSettings[guildTag].sheetName, Columns.FIRST, rowNum, [
            gw2Id, 
            properties.username ?? '', 
            properties.nickname ?? '', 
            properties.agreedToTerms ?? false, 
            properties.status ?? 'Recruit', 
            properties.registered ?? false, 
            //properties.guildBuildGiven ?? false,
            //properties.inBoth ?? false,
            googleDate(properties.joined ?? Date.now),
            //properties.apikey ?? '',
            properties.notes ?? ''
        ]);
        invalidSheetCache();
        debug( `insertNewGuildMember: ${JSON.stringify(data)}`, LogOptions.LocalOnly );
        debug( `Insert New Guild Member into Doc: ${format.highlight(gw2Id)}`, LogOptions.RemoteOnly );
        return true;
    }
    return false;
}

/**
 * @param {GuildMember[]} guildMembers 
 * @param {string} gw2Id
 * @returns {number} The row number where the member should be inserted
 */
const getRowNumberForInsert = ( guildMembers, gw2Id ) => {
    try{
    for( let i = 0; i < guildMembers.length; i++ ){
        let cur = guildMembers[i];
        if( gw2Id.localeCompare(cur.gw2ID, 'en', { sensitivity: 'base' , ignorePunctuation: true }) === -1 ){
            return cur.row;
        }
    }
    return guildMembers[guildMembers.length - 1].row + 1;
    } catch(err){
        error( `getRowNumberForInsert: ${err}`);
        return -1;
    }
}