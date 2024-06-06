
import { info, dinfo, format, error } from '../logger.js';
import { DiscordManager } from '../discord/manager.js';
import { CrimsonBlackout } from './ids.js';

const registerChannel = CrimsonBlackout.CHANNEL_REGISTRATION.description;
const timeout = 60*1000;

export class MessageWatcher {

    static get Name(){ return 'Message Watcher'; }
    static async registerOnMessageCreateHandler() {
        info(`[Module Registered] ${ format.highlight(this.Name)}` );
        DiscordManager.Client.on('messageCreate', ( message =>{
            if( message.author.id === DiscordManager.Client.user.id ) return; //ignore my own posts
            dinfo(message.guild, message.channel, message.author.bot? 
                `[BOT]${message.author.username}` : 
                message.author.username, message.content, false);
        }));

        
        // DiscordManager.Client.on('messageCreate', ( message =>{
        //     let channel = message.channel;
        //     if( channel.id === registerChannel && !message.pinned) {
        //         try{
        //             info(`Deleting ${channel.name  + " " + message.content}`, true, false );
        //             message.delete({timeout})
        //         }catch( err ){
        //             error(err, true, false );
        //         }                
        //     }
        // }));
        
    }

}