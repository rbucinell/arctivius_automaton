import { Collection } from 'discord.js';
import ping from './ping.js';
import attendance from './attendance.js';
import rollcall from './rollcall.js';
import lookup from './lookup.js';
import lotterylearn from './lottery-learn.js';
import apikey from './apikey.js';
import register from './register.js';

export const setCommands = ( client ) =>{
    client.commands = new Collection();
    for( const [name, command] of Object.entries(commands) ) {
        if( 'data' in command && 'execute' in command && name !== 'setCommands') {
            client.commands.set( name, command );
        }
    }
}

export const commands =  {
    ping,
    attendance,
    rollcall,
    lookup,
    lotterylearn,
    apikey,
    register
}