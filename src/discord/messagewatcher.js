
import { info, dinfo, format } from '../logger.js';
import { DiscordManager } from '../discord/manager.js';

export class MessageWatcher {

    static get Name(){ return 'Message Watcher'; }
    static async registerOnMessageCreateHandler() {
        info(`[Module Registered] ${ format.highlight(this.Name)}` );
        DiscordManager.Client.on('messageCreate', ( message =>{
            if( message.author.id === DiscordManager.Client.user.id ) return; //ignore my own posts
            dinfo(message.guild.name, message.channel.name, message.author.bot? 
                `[BOT]${message.author.username}` : 
                message.author.username, message.content, false);
        }));
    }

}