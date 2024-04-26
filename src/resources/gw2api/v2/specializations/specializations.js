import { get } from '../../util/request.js';
import { Specialization } from '../models/specialization.js';
import { readFile } from 'fs/promises';
import { debug, format } from '../../../../logger.js';

let cache = null;

export default class specializations
{    
    /**
     * If accessed without specifying an id, a list of all ids is returned.
     * 
     * @param {string} specializationId (optional) The specialization id to look up.
     * @param {boolean} cached (optional) Use a cached local copy of results from 2023-06-27. Default true.
     * @returns {Array<Specialization>} A list of gw2 specializations
     */
    static async get( specializationId = '', cached = true )
    {
        specializationId = specializationId === '' ? `all`: specializationId;
        if( cached ) return await specializations.cached( specializationId );
        let response = await get(`specializations?ids=${specializationId}`);
        return response.data.map( s => Specialization.parse( s ));
    }

    static async cached( specialiazationId = '' )
    {
        debug(`${format.color('cyanBright','[cached]')} Getting gw2 specializations for id=${ format.highlight(specialiazationId)}`, false);
        if( !cache ){
            cache = JSON.parse( await readFile('./src/resources/gw2api/v2/specializations/cache.json'));
            cache = cache.map( s => Specialization.parse(s));
        }
        if( specialiazationId !== '' && specialiazationId !== 'all' )
        {
            cache = cache.filter( s => s.id == specialiazationId );
        }
        return cache;
    }

}