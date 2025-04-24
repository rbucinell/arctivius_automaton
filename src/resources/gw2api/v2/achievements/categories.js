import { get } from '../../util/request.js';
import { AchievementCategory } from '../models/achievementscategory.js';

const BASE = '/achievements/categories';

export default class categories {

    static get WEEKLY_WVW_ID(){ return 346; }

    static async list(){
        return (await get(BASE)).data;
    }

    static async get( ...ids ){
        if (ids.length === 0) {
            return [];
        }
        else if( ids.length === 1 ){
            const id = ids[0];
            return AchievementCategory.parse((await get(`${BASE}/${id}`)).data);
        }
        else{
            return (await get(`${BASE}?ids=${ids.join(',')}`)).data
                .map( ac => AchievementCategory.parse(ac) );
        }
    }
}

/**
 * Someday when they fix the API this will work:
 * 
 * let c = await gw2.achievements.categories.get(gw2.achievements.categories.WEEKLY_WVW_ID);
 * let a = await Promise.all( c.achievements.map( async (ca) => {
 *     return await gw2.account.achievements.get(ca);
 * } ));
 * 
 */