import dotenv from 'dotenv';
dotenv.config();
import dayjs from "dayjs";
import duration from 'dayjs/plugin/duration.js';
import relativeTime from 'dayjs/plugin/relativeTime.js';
dayjs.extend(duration);
dayjs.extend(relativeTime);

import { info, error, warn } from '../logger.js';
import { gw2 } from '../resources/gw2api/api.js';

const GUILD_CBO = '468951017980035072';
const CHANNEL_GUILD_VAULT_LOG = '1146528283052212295';
const PACK_ID = '9F02DC40-A030-ED11-81AC-95DFE50946EB';
const HOURS_BETWEEN_CHECKS = 1;

let client = null;
let sinceID = 0;

let gw2items = {};

const vaultInfo = ( msg ) => info(`Guild Vault: ${msg}`);
const getMaxEventID = (arr) => sinceID = Math.max(...arr.map( l => l.id ) );

const getSinceIDValue = async () =>{
    if( sinceID === 0) {
        let guildEvents = await getLatestGuildEventsFromDiscord();
        sinceID = guildEvents.length === 0 ? 0 : getMaxEventID(guildEvents);
    }
    return sinceID;
}

const getLatestGuildEventsFromDiscord = async () => {
    const guild = client.guilds.cache.get(GUILD_CBO);
    const channel = guild.channels.cache.get(CHANNEL_GUILD_VAULT_LOG);
    const messages = await channel.messages.fetch( { limit: 5, });
    const codesplit = messages.map( m => m.toString().split('\`\`\`'));
    let events = [];
    if( codesplit.length === 3 )
        events = codesplit[1].slice('json'.length );
    return events;
}   

const nextVaultUpdate = () => {
    let now = dayjs();
    let next = now.add(HOURS_BETWEEN_CHECKS,'hours');
    let diff = next.diff(now);
    vaultInfo(`Next Check in ${next.fromNow()}`);
    setTimeout(scheduledVaultCheck, diff );
}

export const registerVaultWatcher = async discordClient => {
    if( client === null) client = discordClient;
    info('[Module Registred] ValutWatcher');
    nextVaultUpdate();
}

export const scheduledVaultCheck = async () => {
    const currentToken = gw2.apikey;
    try {
        
        gw2.apikey = process.env.GW2_API_TOKEN_PYCACHU;
        sinceID = await getSinceIDValue();
        vaultInfo(`Accessing Vault ${PACK_ID} since ${sinceID}` );
        let guildLogs = await gw2.guild.log(PACK_ID, sinceID);
        sinceID = getMaxEventID(guildLogs);
        let vault = guildLogs.filter( ge => ge.type === 'treasury' || ge.type === 'stash');
        
        await writeVaultMessages( vault );
    }
    catch( err ) {
        error(err, true);
    }
    finally {
        gw2.apikey = currentToken;
    }
    nextVaultUpdate();
}

const getGW2Item = async ( id ) => {
    if( !id || id === 0 ) return null;
    try{
        if( !gw2items[id] ) {
            const item = await gw2.items.get(id);
            gw2items[id] = item;
            return item;
        }
        return gw2items[id];
    }
    catch( err ){
        error( err, true );
        return null;
    }
    
}

export const writeVaultMessages = async ( guildEvents ) => {
    const DISCORD_MESSAGE_LIMIT = 2000;
    const OPEN_CODE = '\`\`\`json\n[\n';
    const CLOSE_CODE = '\n]\`\`\`';

    let messages = [];
    let currentMessage = '\`\`\`json\n';
    for( let i = 0; i < guildEvents.length; i++ ){

        let curEvent = simplifyData(guildEvents[i]);
        let gw2Item = await getGW2Item( curEvent?.item_id );
        curEvent.item_name = gw2Item?.name;
        curEvent = JSON.stringify(curEvent);
        if( curEvent.length + currentMessage.length + CLOSE_CODE.length < DISCORD_MESSAGE_LIMIT )
        {
            currentMessage += `${curEvent}\n`;
        }
        else{
            currentMessage += CLOSE_CODE;
            messages.push( currentMessage );
            currentMessage = OPEN_CODE + curEvent + '\n';
        }
    }
    currentMessage += CLOSE_CODE;
    messages.push( currentMessage );

    let vaultlogChannel = client.channels.cache.get(CHANNEL_GUILD_VAULT_LOG);
    for( let i = 0; i < messages.length; i++ ){
        let msg = messages[i];
        await vaultlogChannel.send({
            content: msg,
            embeds: []
        });
    }
}

const simplifyData = ( guildEvent ) => {
    let obj = {
        "id": guildEvent.id,
        "time": guildEvent.time,
        "type": guildEvent.type,
        "user": guildEvent.user,
        "operation": guildEvent.operation
    }

    if( guildEvent.item_id === 0 || guildEvent.item_id === '0' )
    {
        obj["count"] = guildEvent.count;
        obj["coins"] = guildEvent.coins;
    }
    else
    {
        obj["item_id"] = guildEvent.item_id
    }
    return obj;
}