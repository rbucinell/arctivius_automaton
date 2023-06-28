import { get } from '../../util/request.js';
import {Guild} from '../models/guild.js'
import {GuildEvent} from '../models/guildevent.js'

export default class guild {
    
    static async get( guildId )
    {
        return Guild.parse((await get(`guild/${guildId}`)).data);
    }

    /**
     * 
     * @param {string} guildId 
     * @param {string} since (optional) 
     * @returns 
     */
    static async log( guildId, since=undefined ) {
        return (await get(`guild/${guildId}/log${ since ? `?since=${since}` : ''}`)).data.map( e => GuildEvent.parse(e) );
    }
}