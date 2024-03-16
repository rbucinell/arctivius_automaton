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