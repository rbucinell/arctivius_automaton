import { gw2 } from '../api.js'
import { debug, format, error } from '../../../logger.js';
import axios from 'axios';

export const get = async function( path )
{
    let url = `'https://api.guildwars2.com/v2/${path}`;
    debug( `${format.GET()} ${url}`, false );
    try
    {
        let response = await axios.get(url,{
            headers: {
                'Authorization': `Bearer ${ gw2.apikey }`,
                'Content-Type':'application/json'
            }
        });
        return response;
    }
    catch( ae )
    {
        error(`[${ae.response.status}] GW2API /${path}: ${ae.response.data?.text}`);
        return null;
    }
}