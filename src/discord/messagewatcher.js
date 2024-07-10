
import { info, dinfo, format, error } from '../logger.js';
import { DiscordManager } from '../discord/manager.js';
import { CrimsonBlackout } from './ids.js';
import { MessageCommands } from '../commands/message/messagecommands.js';

export class MessageWatcher {

    static get Name(){ return 'Message Watcher'; }
    static async initialize() {
        info(`[Module Registered] ${ format.highlight(this.Name)}` );

        DiscordManager.Client.on('messageCreate', (async message => {
            
            //Ignore my own posts
            if( message.author.id !== DiscordManager.Client.user.id ) {
                dinfo(message.guild, message.channel, this.authorName( message.author ), message.content, false);
                await MessageCommands.processMessageCommand( message ); 
            }
        }));
    }

    static authorName( author ) {
        return author.bot ? `[🤖${author.username}]` : author.username
    }
}


