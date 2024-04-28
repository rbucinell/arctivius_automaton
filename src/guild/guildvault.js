import dotenv from 'dotenv';
import dayjs from "dayjs";
import duration from 'dayjs/plugin/duration.js';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import { settings, sleep } from '../util.js';
import { info, error, warn, format } from '../logger.js';
import { gw2 } from '../resources/gw2api/api.js';
import { DiscordManager } from '../discord/manager.js';
import { CrimsonBlackout } from '../discord/ids.js';
dotenv.config();
dayjs.extend(duration);
dayjs.extend(relativeTime);

const PACK_ID = settings.vault.guildId;
const HOURS_BETWEEN_CHECKS = settings.vault.checkDelayHours;

let sinceID = 0;
let gw2items = {};

const vaultInfo = ( msg ) => info(`Guild Vault: ${msg}`);
const getMaxEventID = (arr) => sinceID = Math.max(...arr.map( l => l.id ) );

export const initializeScheduledRuns = async () => {
    info(`[Module Registred] ${ format.highlight('ValutWatcher')}`);
    nextVaultUpdate();
}

export const getLatestIdFromDiscord = async ( guildID = CrimsonBlackout.GUILD_ID.description, channelID = CrimsonBlackout.CHANNEL_GUILD_VAULT_LOG.description ) => {
    let maxId = 0;
    try{
        const guild = DiscordManager.Client.guilds.cache.get(guildID);
        const channel = guild.channels.cache.get(channelID);
        const messages = await channel.messages.fetch( { limit: 5, });
        const ids = messages.map( m => 
            {
                const code =  m.content.split('\`\`\`')[1].slice('json'.length);
                const ids = code.match(/["id":]\d+[,]/gm).map( m=> parseInt(m.slice(1, m.length-1)));
                return Math.max(...ids);
            });
        maxId = Math.max(...ids);
    }
    catch( ex ){ 
        error(ex);
        maxId = 0;
    }
    return maxId;    
}  

export const scheduledVaultCheck = async () => {
    const currentToken = gw2.apikey;
    try {
        
        gw2.apikey = process.env.GW2_API_TOKEN_PYCACHU;
        sinceID = await getSinceIDValue();
        vaultInfo(`Accessing Vault ${PACK_ID} since ${sinceID}` );
        let guildLogs = await gw2.guild.log(PACK_ID, sinceID);
        if( guildLogs.length > 0)
        {
            sinceID = getMaxEventID(guildLogs);
            let vault = guildLogs.filter( ge => ge.type === 'treasury' || ge.type === 'stash');
            await writeVaultMessages( vault );
        }
    }
    catch( err ) { 
        error(err); 
    }
    finally {
        gw2.apikey = currentToken;
    }
    nextVaultUpdate();
}

export const writeVaultMessages = async ( guildEvents ) => {
    const DISCORD_MESSAGE_LIMIT = 1800;
    const OPEN_CODE = '\`\`\`json\n[\n';
    const CLOSE_CODE = '\n]\`\`\`';

    guildEvents.sort( (a,b) => a.id - b.id );
    
    let simpleEvents = await Promise.all( guildEvents.map( async ge => {
        let simpleEvent = simplifyData(ge);
        let gw2Item = await getGW2Item( simpleEvent.item_id );
        simpleEvent.item_name = gw2Item?.name;
        return simpleEvent;
    }));

    let count = 0;
    let code = [];
    let messages = [];
    for( let se of simpleEvents )
    {
        let simpleMsg = JSON.stringify(se);
        if( simpleMsg.length + count + OPEN_CODE.length + CLOSE_CODE.length >= DISCORD_MESSAGE_LIMIT )
        {
            messages.push( `${OPEN_CODE}${code.join(',\n')}${CLOSE_CODE}`);
            count = 0;
            code = [];
        }
        count += simpleMsg.length +3;
        code.push( JSON.stringify(se) );
    }
    if( code.length > 0 ){
        messages.push( `${OPEN_CODE}${code.join(',\n')}${CLOSE_CODE}`);
    }
    
    let vaultlogChannel = await DiscordManager.Client.channels.fetch(CrimsonBlackout.CHANNEL_GUILD_VAULT_LOG.description);

    for( let msg of messages )
    {
        try{
            await vaultlogChannel.send({ content: msg, embeds: [] });
        }catch( ex )
        {
            error( `Failed to send vault message:\n${msg}`)   ;
        }
        await sleep(1000);
    }
}

const getSinceIDValue = async () =>{
    if( sinceID === 0 ) {
        let maxDiscordId = await getLatestIdFromDiscord();
        sinceID = Math.max( maxDiscordId, sinceID );
    }
    return Math.max(sinceID,0);
}

const nextVaultUpdate = () => {
    let now = dayjs();
    let next = now.add( HOURS_BETWEEN_CHECKS,'hours');
    let diff = next.diff(now);
    vaultInfo(`Next Check in ${next.fromNow()} [${next.toISOString()}]`);
    setTimeout(scheduledVaultCheck, diff );
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

const simplifyData = ( guildEvent ) => {
    if( !guildEvent.operation ) warn( `Guild event ${guildEvent.id} doesn't have operation: ${ JSON.stringify(guildEvent) }`)
    let obj = {
        "id": guildEvent.id,
        "time": guildEvent.time,
        "user": guildEvent.user,
        "op": guildEvent.operation
    }

    if( guildEvent.item_id === 0 || guildEvent.item_id === '0' )
    {
        obj["count"] = guildEvent.count;
        obj["coins"] = guildEvent.coins;
    }
    else
    {
        obj["item_id"] = guildEvent.item_id
        if( guildEvent.count > 1)
        {
            obj["count"] = guildEvent.count;
        }
    }
    return obj;
}