import { settings } from '../util.js';
import { gw2 } from '../resources/gw2api/api.js';
import { Module } from '../commands/modules/module.js';
import { db } from '../resources/mongodb.js';

const PACK_ID = settings.vault.guildId;

let gw2items = {};

export class GuildVault extends Module {

    static getNextExecute() { return settings.vault.checkDelayHours * 60 * 60 * 1000; }

    static async execute(){
        const currentToken = gw2.apikey;
        try {            
            gw2.apikey = process.env.GW2_API_TOKEN_PYCACHU;

            let sinceID = await this.getSinceId();
            this.info(`Accessing Vault ${PACK_ID} since ${sinceID}` );
            let guildLogs = await gw2.guild.log(PACK_ID, sinceID);
            if( guildLogs.length > 0 )
            {
                let vault = guildLogs.filter( ge => ge.type === 'treasury' || ge.type === 'stash');
                await writeVaultMessages( vault );
                await this.save( vault );
            }
        }
        catch( err ) { 
            this.error(err); 
        }
        finally {
            gw2.apikey = currentToken;
        }
        this.awaitExecution();
    }

    static getMaxEventID (arr){ return Math.max(...arr.map( l => l.id ) ); }

    static async getSinceId (){
        let sinceId = 0;
        let record = await db.collection('guildvault').find().sort( { id: -1 } ).limit(1).next();
        if( record ) sinceId = record.id;
        return sinceId;
    }

    /** Saves the provided guildEvent data to the database.
     *
     * @param {Array<GuildEvent>} vault - The vault data to be saved
     * @return {void}
     */
    static async save( guildEvents ){
        guildEvents.sort( (a,b) => a.id - b.id );

        let simpleEvents = await Promise.all( guildEvents.map( async ge => {
            let simpleEvent = this.simplifyEvent(ge);
            let gw2Item = await getGW2Item( simpleEvent.item_id );
            simpleEvent.item_name = gw2Item?.name;
            return simpleEvent;
        }));
        await db.collection('guildvault').insertMany( simpleEvents );
    }

    static async getGw2Item( id ) {
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
            this.error( err );
            return null;
        }
    }

    static simplifyEvent = ( guildEvent ) => {
        if( !guildEvent.operation ) 
            this.warn( `Guild event ${guildEvent.id} doesn't have operation: ${ JSON.stringify(guildEvent) }`)
        let obj = {
            "id": guildEvent.id,
            "time": guildEvent.time,
            "user": guildEvent.user,
            "op": guildEvent.operation
        };
    
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
}
