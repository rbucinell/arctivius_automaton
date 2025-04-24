import { EmbedBuilder, Message } from 'discord.js';
import { db, registrations } from '../../resources/mongodb.js';
import { MessageCommands } from './messagecommands.js';
import { CrimsonBlackout } from '../../discord/ids.js';
import { DiscordManager } from '../../discord/manager.js';
import _ from 'lodash';


/**
 * Retrieves all registered users from the database and returns an array of objects
 * containing their GW2 IDs and Discord IDs.
 *
 * @param {Array} args - an array of arguments passed to the function
 * @param {Message} message - the message object containing information about the message
 * @return {Promise<Array>} - a Promise that resolves to an array of objects with GW2 IDs and Discord IDs
 */
export default async function registered( args, message ){
    if( args.length > 0 && args[0] === 'help' ){
        await message.author.send( `Usage: \`${ MessageCommands.Prefix }registered <rolename(optional)>\`` );
        return Promise.resolve();
    }
    let registeredUsers = await registrations.find().toArray();
    registeredUsers = registeredUsers.map( user => user.discord.username );

    if( args.length > 0 ){
        let role = args[0];
        const guild = DiscordManager.Client.guilds.cache.get(CrimsonBlackout.GUILD_ID.description);
        let membersWithRole = await guild.members.fetch();
        membersWithRole = membersWithRole
            .filter( member => member.roles.cache.find( _ => _.name === role) )
            .map( member => member.user.username );
        
        registeredUsers = _.intersection( registeredUsers, membersWithRole );
    }
    registeredUsers.sort( (a,b) => a.localeCompare(b) );
    await message.author.send(`Registered ${args.length > 0 ? `\`${args[0]}\`` : 'all'} users:\n${registeredUsers.join('\n')}`);
}