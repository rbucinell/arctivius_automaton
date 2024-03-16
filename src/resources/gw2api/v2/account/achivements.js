import { get } from '../../util/request.js';
import { AccountAchievement } from '../models/accountachievements.js';

export default class achievements {
    /**
     * This resource returns an account's progress towards all their achievements.
     *
     * @static
     * @memberof achievements
     * @return {Array<AccountAchievement>} every achievement that the account has progress on by ID and how far the player has progressed
     */
    static async list() {
        return (await get('account/achievements')).data.map( e => AccountAchievement.parse(e) );
    }

    /**
     * This resource returns an account's progress towards the their achievements of the provided Id's.
     *
     * @static
     * @memberof achievements
     * @param {Array<number>} ids a list of ids
     * @return {Array<AccountAchievement>} every achievement that the account has progress on by ID and how far the player has progressed
     */
    static async get( ids ) {
        if(!Array.isArray(ids)) ids = [ids];
        let accountachievements = await get(`/account/achievements?ids=${ids.join(',')}`);
        if( accountachievements) {
            return accountachievements.map( a => AccountAchievement.parse(a) );
        }
        else{
            return [];
        }
    
    }
}