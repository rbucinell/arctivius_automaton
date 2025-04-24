import { settings } from "../../util.js";

export default class GuildSettings {

    constructor(id,name,tag,color ="#e0e0e0", includeRankRoles = false, ownerApiKey=settings.GW2_API_TOKEN){
        this.id = id;
        this.name = name;
        this.tag = tag;
        this.color = color;
        this.includeRankRoles = includeRankRoles;
        this.ownerApiKey = ownerApiKey ;

        // TODO: New Features of moving more config to db
        // this.channels = {
        //     logs: null, //CHANNEL_AUTOMATON_LOGS
        //     bot: null, //CHANNEL_BOT_CHANNEL (botspam channel)
        //     attendance: {
        //         signup: null, //CHANNEL_WVW_SIGNUPS
        //         signupArchive: null, //CHANNEL_EVENT_ARCHIVES
        //         output: null, //CHANNEL_ATTENDANCE
        //         voice: null, // [ CHANNEL_VOICE_PACK_NIGHT ]
        //         leave: null,  //CHANNEL_LEAVE_OF_ABSENCE
        //         combatLogs: null //CHANNEL_WVW_LOGS
        //     }
        // };
        // //this.modules = []; //list of modules that are enabled (Future update)
        // this.commands = {
        //     messageCommands: {
        //         activationKey: null //!
        //     },
        //     permissions: {}
        // }
    }
    
    static parse( json ) {
        return new GuildSettings(
            json.id,
            json.name,
            json.tag,
            json.color,
            json.includeRankRoles,
            json.ownerApiKey
        );
    }
}