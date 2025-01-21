import { settings } from "../util.js";

export default class GuildSyncSettings {

    constructor(id,name,tag,color ="#e0e0e0", includeRankRoles = false, ownerApiKey=settings.GW2_API_TOKEN){
        this.id = id;
        this.name = name;
        this.tag = tag;
        this.color = color;
        this.includeRankRoles = includeRankRoles;
        this.ownerApiKey = ownerApiKey ;
    }
    
    static parse( json ) {
        return new GuildSyncSettings(
            json.id,
            json.name,
            json.tag,
            json.color,
            json.includeRankRoles,
            json.ownerApiKey
        );
    }
}