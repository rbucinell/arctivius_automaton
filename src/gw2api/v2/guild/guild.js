import { get } from '../../util/request.js';
import {Guild} from '../models/guild.js'
import {GuildEvent} from '../models/guildevent.js'

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
     * @param {string} guildId 
     * @param {string} since (optional) 
     * @returns {Array<GuildEvent>}
     */
    static async log( guildId, since=undefined ) {
        return (await get(`guild/${guildId}/log${ since ? `?since=${since}` : ''}`)).data.map( e => GuildEvent.parse(e) );
    }
}