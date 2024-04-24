import { gw2 } from '../api.js'
import { log, format, error } from '../../../logger.js';
import axios from 'axios';

const base_url = 'https://api.guildwars2.com';
const version = 'v2';

export const get = async function( path )
{
    let url = `${base_url}/${version}/${path}`;
    log( `${format.GET('GET')} ${url}`, false );
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