import { get } from '../../util/request.js';
import { Item } from '../models/item.js';

export default class items {

    /**
     * Returns a list of all Item ID's
     * 
     * @static
     * @return {Array<int>} A list of id numbers 
     * @memberof items
     */
    static async list()
    {
        return (await get('items')).data;
    }

    /**
     * Get Information a about an Item
     * 
     * @static
     * @param {int} id The item Id
     * @return {Item}  The item's details
     * @memberof items
     */
    static async get( id )
    {
        return Item.parse((await get(`items/${id}`)).data);
    }
}