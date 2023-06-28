import dotenv from 'dotenv';
dotenv.config();
import account from './v2/account/account.js';
import guild   from './v2/guild/guild.js';
import specializations from './v2/specializations/specializations.js'

const gw2 = {
    account,
    guild,
    specializations
};

Object.defineProperty( gw2, "apikey", {
    get: () => process.env.GW2_API_TOKEN,
    set: ( val ) => process.env.GW2_API_TOKEN = val
});

export {gw2};

