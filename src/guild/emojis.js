import { gw2 } from '../resources/gw2api/api.js';

export const getEmoji = async ( prof, spec ) => {
    let emojiName = 'wvw';
    try {
        if( spec === 0)
        {
            let specialiazation = (await gw2.specializations.get(prof))[0];
            emojiName = `${specialiazation.profession}`.toLocaleLowerCase();
        }
        else{
            let specialiazation = (await gw2.specializations.get(spec))[0];
            emojiName = `${specialiazation.profession}_${specialiazation.name}`.toLocaleLowerCase();
        }
    }
    catch( err ) {}
    return emojiName; 
}