import { readFileSync } from 'fs'

/**
 * Asyncronously blocks the script from executing for a time delay
 * 
 * @param {number} milliseconds Number of millisends to delay
 */
export async function sleep ( milliseconds=2000 )
{
    await new Promise(resolve => setTimeout(resolve, milliseconds));
}

function getSsettings(){
    try {
        return JSON.parse( readFileSync('./app-settings.json'));
    } catch( ext ){
        return {};
    }
}
export const settings = getSsettings();
