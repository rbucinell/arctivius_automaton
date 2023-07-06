import { Collection } from 'discord.js';
import ping from './ping.js';
import attendence from './attendence.js';

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
    attendence,
}