import { info, error, format, LogOptions } from "../../logger.js";
import { Message } from "discord.js";
import { settings } from "../../util.js";

const prefix = settings.messagecommands.activationKey;

const logInfo = ( userName, cmd, args, options = LogOptions.All ) => {
    info(`${format.command(`${prefix}${cmd}`, userName)} ${args.join(" ")}`, options );
};

export class MessageCommands {

    static supportedCommands = ['registered'];

    static get Name(){ return 'MessageCommands'; }

    static get Prefix(){ return prefix; }

    /**
     * Process a message command.
     *
     * @param {Message} message - The message to process
     * @return {Promise<void>} 
     */
    static async processMessageCommand( message ) {
        if (message.author.bot) return;
        //if (!message.guild) return; // Normally we'd make sure that this is a guild message, but since this is bot is only for this server. I'ma risk it
        if (!message.content.startsWith(prefix)) return;
        if (!message.member) message.member = await message.guild.fetchMember(message);
        const args = message.content.slice(prefix.length).trim().split(/ +/g);
        const cmd = args.shift().toLowerCase();
        if (cmd.length === 0) return;
        try{
            let command = (await import(`./${cmd}.js`))?.default;
            if( command ){
                logInfo(message.author.username, cmd, args);
                await command(args, message);
                return message.delete();
            }
        }catch( err ){
            error(err);
        }
    }
}


