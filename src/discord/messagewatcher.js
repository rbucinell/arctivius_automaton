
import { dinfo, LogOptions } from '../logger.js';
import { DiscordManager } from '../discord/manager.js';
import { MessageCommands } from '../commands/message/messagecommands.js';
import { Module } from '../commands/modules/module.js';

export class MessageWatcher extends Module {
    static async initialize() {
        this.info(`Module Initialized`, LogOptions.ConsoleOnly);

        //Listen for all messages
        DiscordManager.Client.on('messageCreate', (async message => {            
            //Ignore my own posts
            if( message.author.id !== DiscordManager.Client.user.id ) {
                dinfo(message.guild, message.channel, this.authorName( message.author ), message.content, LogOptions.ConsoleOnly );
                await MessageCommands.processMessageCommand( message ); 
            }
        }));
    }

    static authorName( author ) {
        return author.bot ? `[🤖${author.username}]` : author.username
    }
}
