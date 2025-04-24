import { Module } from '../../commands/modules/module.js';
import { CrimsonBlackout } from '../../discord/ids.js';
import { DiscordManager } from '../../discord/manager.js';
import dayjs from 'dayjs';

const WVWSIGNUPS_CHANNEL = CrimsonBlackout.CHANNEL_SECRET_CHANNEL.description;

const testMessage = "Good afternoon folks...can you all please take a minute, and sign up for WvW tonight if you plan on joining us. Please try bring a required class. Loads of room. It is reset night and its also relinks. We are linked with Tarnished Coast (TC) . So anyone who is in TC and wants to join us tonight for WvW, you are of course welcome to join!! <@&791182081878130710> <@&1022541297367646329> <@&1047892420563582977> <@&1099365978699214858>"

export class SignupReminder extends Module {

    static get PostTimeout() { 
        let now = dayjs();
        return now.add(1,'day').hour(12).minute(0).diff(now);
     }
    static get DeleteTimeout() { 
        let now = dayjs();
        return now.add(8, 'hours').diff(now);
    }

    static getNextExecute() {
        return this.PostTimeout;
    }

    static async execute(){
        await SignupReminder.PostReminder();
    }

    static async DeleteMessages( id = null ) {
        const channel = DiscordManager.Client.channels.cache.get(WVWSIGNUPS_CHANNEL);
        let messages = await channel.messages.fetch();

        if( id ){
            let m = messages.find( m => m.id === id );
            if( m ){
                await m.delete();
            }
        }else{
            messages = messages.filter( m =>  m.author.id === DiscordManager.Client.user.id );
            messages.forEach( m => m.delete() );
        }
    }

    static getReminderMessage() {
        return `Posting Cheery Message!`;
    }

    static async PostReminder( executeOnce = false ) {
        let sendResponse = null;
        try {
            const content = SignupReminder.getReminderMessage();
            this.info( content );
            sendResponse = await DiscordManager.Client.channels.cache.get(WVWSIGNUPS_CHANNEL).send( { content } );
            if( sendResponse ){
                this.info( `Message ID: ${sendResponse.id}` );
            }
        }
        catch( err ) {
            this.error(err);
        }
        if( !executeOnce ) {
            setTimeout(SignupReminder.DeleteMessages, this.DeleteTimeout, sendResponse?.id);
            this.awaitExecution();
        }
    }
}
