
import { info, dinfo } from '../logger.js';
import { DiscordManager } from '../discord/manager.js';

export class MessageWatcher {

    static async registerOnMessageCreateHandler() {
        info('[Module Registred] MessageWatcher');
        DiscordManager.Client.on('messageCreate', ( message =>{
            if( message.author.id === DiscordManager.Client.user.id ) return; //ignore my own posts
            dinfo(message.guild.name, message.channel.name, message.author.bot? 
                `[BOT]${message.author.username}` : 
                message.author.username, message.content, false);
        }));
    }

}