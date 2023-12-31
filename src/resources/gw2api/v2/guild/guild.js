import { get } from '../../util/request.js';
import { Guild } from '../models/guild.js'
import { GuildEvent } from '../models/guildevent.js'
import { error } from '../../../../logger.js';

export default class guild {
    
    static async search( name )
    {
        return (await get( `guild/search?name=${name}`)).data;
    }

    static async get( guildId )
    {
        return Guild.parse((await get(`guild/${guildId}`)).data);
    }

    /**
     * 
     * @param {string} guildId ID of the guild to query. Ensure API Key has guild owner perms.
     * @param {string} since (optional) to filter the response to events with the ID after the provided ID
     * @returns {Array<GuildEvent>}
     */
    static async log( guildId, since=undefined ) {
        let guildEvents = [];
        try{
            const response = await get(`guild/${guildId}/log${ since ? `?since=${since}` : ''}`)
            if( response?.data)
            {
                guildEvents = response.data.map( e => GuildEvent.parse(e) );
            }
        }catch( err )
        {
            error(err);
        }
        return guildEvents;        
    }
}