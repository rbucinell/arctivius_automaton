import { get } from '../../util/request.js';
import { Achievement } from '../models/achievement.js';
import categories from './categories.js';

export default class achievements {

    static get categories() { return categories; }

    static async get( id ) {
        return Achievement.parse( (await get(`achievements/${id}`)).data);
    }
}

// export {
//     achievements,
//     categories
// }
