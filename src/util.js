import { readFileSync } from 'fs';

//This is mostly for working in dev.js. will be used to turn off some logging
global.DEV_MODE = false;

/**
 * Asyncronously blocks the script from executing for a time delay
 * 
 * @param {number} milliseconds Number of millisends to delay
 */
export async function sleep ( milliseconds=2000 )
{
    await new Promise(resolve => setTimeout(resolve, milliseconds));
}

function getSettings(){
    try {
        return JSON.parse( readFileSync('./app-settings.json'));
    } catch( ext ){
        return {};
    }
}

export const settings = getSettings();

export function compareToCaseInsensitive( a, b ){
    return typeof a === 'string' && typeof b === 'string'
        ? a.localeCompare( b, 'en', { sensitivity: 'accent' , ignorePunctuation: true } ) === 0
        : a === b;
}
