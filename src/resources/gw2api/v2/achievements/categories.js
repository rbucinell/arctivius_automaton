import { get } from '../../util/request.js';
import { AchievementCategory } from '../models/achievementscategory.js';

export default class categories {

    static get WEEKLY_WVW_ID(){ return 346; }

    static async list(){
        return (await get('/achievements/categories')).data;
    }

    static async get( id ){
        return AchievementCategory.parse((await get(`/achievements/categories/${id}`)).data);
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