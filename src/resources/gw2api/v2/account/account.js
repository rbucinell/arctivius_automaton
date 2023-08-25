import { get } from '../../util/request.js';
import { Account } from '../models/account.js'
import { Achievement } from '../models/achivement.js';
import { Item } from '../models/item.js';
import { StorageSlot } from '../models/storageslot.js';

export default class account {
    
    /**
     *This resource returns information about player accounts. 
     *
     * @static
     * @return {Account} 
     * @memberof account
     */
    static async get()
    {
        return Account.parse((await get('account')).data);
    }

    /**
     * This resource returns an account's progress towards all their achievements.
     *
     * @static
     * @memberof account
     * @return {Array<Achievement>} every achievement that the account has progress on by ID and how far the player has progressed
     */
    static async achievements() {
        return (await get('account/achievements')).data.map( e => Achievement.parse(e) );
    }

    /**
     * This resource returns the items stored in a player's vault (not including material storage)
     *
     * @static
     * @memberof account
     * @return {Array<Item>} The endpoint returns an array of objects, each representing an item slot in the vault. If a slot is empty, it will return null. The amount of slots/bank tabs is implied by the length of the array.
     */
    static async bank() {
        return (await get('account/bank')).data.map( e => Item.parse(e) );
    }

    /**
     * This resource returns the templates stored in a player's build storage. 
     *
     * @static
     * @memberof account
     * @return {Array<StorageSlot>} 
     */
    static async buildstorage() {
        console.warn("API:2/account/buildstorage does not work correctly")
        return response.data.map( e => StorageSlot.parse(e) );
    }

    /**
     * This resource returns information about time-gated recipes that have been crafted by the account since daily-reset. 
     *
     * @static
     * @memberof account
     * @return {Array<string>}  each representing a time-gated recipe name that can be resolved against /v2/dailycrafting. If no timed-gated recipes have been crafted since daily-reset by the account, it will return an empty array ([]).
     */
    static async dailycrafting() {
        return (await get('account/dailycrafting')).data;
    }

    /**
     * This resource returns the dungeons completed since daily dungeon reset.
     *
     * @static
     * @memberof account
     * @return {Array<string>} The endpoint returns an array, each value being the ID of a dungeon path that can be resolved against /v2/dungeons. Note that this ID indicates a path and not the dungeon itself.
     */
    static async dailycrafting() {
        return (await get('account/dungeons')).data;
    }
}
