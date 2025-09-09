import dotenv from 'dotenv';
dotenv.config({ quiet: true });
import account from './v2/account/account.js';
import guild   from './v2/guild/guild.js';
import specializations from './v2/specializations/specializations.js'
import items from './v2/items/items.js';
import wizardsvault from './v2/wizardsvault/wizardsvault.js';
import achievements from './v2/achievements/achievements.js';

const gw2 = {
    account,
    guild,
    specializations,
    items,
    wizardsvault,
    achievements
};

Object.defineProperty( gw2, "apikey", {
    get: () => process.env.GW2_API_TOKEN,
    set: ( val ) => process.env.GW2_API_TOKEN = val
});

export {gw2};

