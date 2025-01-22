import _ from 'lodash';
import { settings, compareToCaseInsensitive } from '../util.js';
import { format, LogOptions } from '../logger.js';
import { gw2 } from '../resources/gw2api/api.js';
import { DiscordManager } from '../discord/manager.js';
import { CrimsonBlackout } from '../discord/ids.js';
import { db, registrations } from '../resources/mongodb.js';
import GuildSettings from '../resources/database/guildsettings.js';
import { GuildMember } from '../resources/gw2api/v2/models/guildmember.js';
import { getGuildMembers, insertNewGuildMember, setColumnValues } from './guildlookup.js';
import { Module } from '../commands/modules/module.js';

export class GuildSync extends Module {

    /** @type {string[]} Skip Updating Discord Users due to lack of permissions. */
    static skipDiscordUsers = [];

    /** @type {GuildSettings[]} **/
    static guilds = [];

    static getNextExecute() { return settings.guildsync.checkTimeoutMins * 60 * 1000; }

    static async execute(){
        await GuildSync.sync();        
    }

    static async sync( guildTag = null, executeOnce = false ) {
        //this.info("Performing Guild Sync", LogOptions.LocalOnly);
        const currentToken = gw2.apikey;
        try {

            //Update the guilds
            GuildSync.guilds = (await db.collection('guilds').find().toArray()).map( g => GuildSettings.parse(g));

            let guilds = GuildSync.guilds;
            if( guildTag ) {
                guilds = guilds.filter( g => g.tag === guildTag);
            }
            for( let guild of guilds ) {

                gw2.apikey = guild.ownerApiKey;

                //this.info(`Processing Guild ${guild.name} [${guild.tag}] ${guild.id}`, LogOptions.LogOnly );
                if( guild.includeRankRoles ) {
                    let ranks = await gw2.guild.ranks( guild.id );
                    ranks.sort( (a,b) => a.order - b.order);
                    await GuildSync.syncRoles( guild, ranks );
                }
                let roster = await gw2.guild.members( guild.id );
                if( roster.length === 0 ) continue; //Skipping in case no roster shows up
                await GuildSync.syncMembers( guild, roster );

                if( settings.googlesheets.find( _ => _.guildTag === guild.tag ) ) {
                    await GuildSync.updateRosterDoc( guild.tag );
                }
            }

            await GuildSync.tagMembers();
        }
        catch( err ) { 
            this.error(err); 
        }
        finally {
            gw2.apikey = currentToken;
        }
        
        //this.info("Sync Complete", LogOptions.LocalOnly);
        if( !executeOnce) {
            this.awaitExecution();
        }
    }

    /**
     * @param {GuildSettings} guild 
     * @param {*} ranks 
     */
    static async syncRoles( guild, ranks ) {
        const discordGuild = await DiscordManager.Client.guilds.fetch( CrimsonBlackout.GUILD_ID.description );
        const discordRoles = discordGuild.roles.cache;

        if( guild.includeRankRoles){
            for( let rank of ranks ){
                let roleName = `${guild.tag} - ${rank.id}`;
                let rankRole = discordRoles.find( _ => _.name === roleName);
                if( !rankRole ){
                    this.info(`Creating role \`${roleName}\``, LogOptions.All );
                    await discordGuild.roles.create({
                        name: roleName,
                        color: guild.color,
                        reason: 'Guild Sync adding role from in-game'
                    });
                }
            }
        }
        //TODO: If wanted, add deleting of roles not found anymore.
    }

    static async syncMember( gw2Id ){
        const currentToken = gw2.apikey;
        try {
            for( let guild of GuildSync.guilds ) {
                gw2.apikey = guild.ownerApiKey;
                this.info( `Syncing ${format.highlight(`[${ guild.tag}] ${guild.name}`)}`, LogOptions.LocalOnly );
                let ranks = await gw2.guild.ranks( guild.id );
                ranks.sort( (a,b) => a.order - b.order);
                let roster = await gw2.guild.members ( guild.id );
                roster = roster.filter( _ => _.name === gw2Id );
                await GuildSync.syncMembers( guild, roster, ranks );
            }
        }
        catch( err ) { 
            this.error(err); 
        }
        finally {
            gw2.apikey = currentToken;
        }
    }

    /**
     * @param {GuildSettings} guild 
     * @param {Arrya<GuildMember>} roster
     */
    static async syncMembers( guild, roster ){
        const discordGuild = await DiscordManager.Client.guilds.fetch( CrimsonBlackout.GUILD_ID.description );
        const discordMembers = await discordGuild.members.fetch();
        const discordRoles = discordGuild.roles.cache;
        const guildRole = discordRoles.find( _ => _.name === guild.tag );
        let guildRoster = roster.map( _ => {_.guildId = guild.id; return _;} ).filter( _ => _.rank !== 'invited' );
        
        //missingIdsFromLastSync
        let lastSyncMembers = await db.collection('guildsync').find({ guildId: guild.id }).toArray();    
        let missingIds = _.difference( lastSyncMembers.map( _ => _.name ), guildRoster.map( _ => _.name) );    

        //Purge old members
        for( let missingId of missingIds ){
            try{
                let registeredUser = await registrations.findOne({ gw2Id: missingId });
                if( registeredUser ){
                    let username = registeredUser.discord.username;
                    let discordUser = discordMembers.find( _ => _.user.username === username);
                    let guildDiscordRoles = discordRoles.filter( _ => _.name.startsWith(guild.tag));
                    for( const guildDiscordRole of guildDiscordRoles){
                        if( discordUser?.roles ){
                            discordUser.roles.remove( guildDiscordRole );
                            this.info(`${ format.this.errorLog('Removing')} role ${ format.hex(guildDiscordRole.hexColor,guildDiscordRole.name) } from ${ format.highlight(username)}. GW2Id: ${missingId} no longer on roster `, LogOptions.All );
                        }
                        else{
                            this.info(`No roles to remove from ${username}`, LogOptions.LocalOnly );
                        }
                    }
                }
            }catch(err){
                this.error(err);
            }
        }

        //Update current members

        //Purge last sync data
        await db.collection('guildsync').deleteMany({ guildId: guild.id });
        
        for( let member of guildRoster ){

            await db.collection('guildsync').insertOne( member );
            try{
                let registeredUser = await registrations.findOne( { gw2Id: member.name } );
                if( registeredUser ) {
                    let discordUser = discordMembers.find( _ => _.user.id === registeredUser.discord.id);
                    let username = discordUser.user.username;

                    if( discordUser ) {

                        let userRoles = discordUser.roles.cache;

                        //Ensure Guild Tag Role
                        if( !userRoles.find( _ => _.name === guild.tag ) ){
                            await discordUser.roles.add( guildRole );
                            this.info(`${ format.success('Adding')} role \`${format.hex(guild.color,guild.tag) }\` to \`${ format.highlight(username) }\``, LogOptions.All );
                        }

                        if( !guild.includeRankRoles ) continue;

                        //current Rank
                        let currentRankRoleName = `${guild.tag} - ${member.rank}`;                        
                        let guildRankRoles = discordRoles.filter( _ => _.name.startsWith(`${guild.tag} -`) );

                        //Find all Role Ranks that don't apply to this guild anymore, and remove it
                        let rolesToRemove = guildRankRoles.filter( _ => _.name !== currentRankRoleName );
                        for( const removeRole of  rolesToRemove.values() ){
                            if(userRoles.find( dur => removeRole.name ===dur.name)) {
                                await discordUser.roles.remove(removeRole);
                                this.info(`${format.this.errorLog('Removing')} role ${format.hex(removeRole.hexColor, removeRole.name)} from ${username}`, LogOptions.All);
                            }
                        }
                        
                        //add role if user doesn't currently have the rank
                        const discordRankRole = discordRoles.find( _ => _.name === currentRankRoleName);
                        const userDiscordRankRole = userRoles.find( _ => _.name === currentRankRoleName );
                        if( !userDiscordRankRole && discordRankRole){
                            await discordUser.roles.add( discordRankRole );
                            this.info(`${ format.success('Adding')} role \`${format.hex(discordRankRole.hexColor, discordRankRole.name)}\` role \`${ currentRankRoleName }\` to \`${ username }\``, LogOptions.All );
                        }
                    } else {
                        this.warn(`Failed to sync ${ member.name}. Found registration, but couldn't find discord user: ${ username }. Purging Registration`, LogOptions.All);
                        await registrations.deleteOne( { "discord.username": username} );
                    }

                }
            }catch(err){
                this.error(err, LogOptions.All);
            }
        }


    }

    static async tagMembers() {
        let registeredUsers = await registrations.find().toArray();
        const discordGuild = await DiscordManager.Client.guilds.fetch( CrimsonBlackout.GUILD_ID.description );
        const discordMembers = await discordGuild.members.fetch();

        for( let registeredUser of registeredUsers ){
            let gw2Id = registeredUser.gw2Id;
            let guildMemberships = await db.collection('guildsync').find( { 'name': gw2Id } ).toArray();
            
            let tags = [];
            for( let gm of guildMemberships ){
                tags.push( GuildSync.guilds.find( g => g.id === gm.guildId).tag );
            }
        
            if( tags.length !== 0 ){
                //We are on PACK server so don't need to include FAM
                if( tags.includes('PACK') ) {
                    tags = tags.filter( t => t !== 'FAM' );
                }

                //Make Sure FAM is last
                if( tags.includes('FAM')){
                    tags = tags.filter( t => t !== 'FAM' );
                    tags.push( 'FAM' );
                }
                
                let discordUser = discordMembers.find( discordMember => discordMember.id === registeredUser.discord.id );
                let nickname = discordUser?.nickname ?? registeredUser.gw2Id;
                let displayName = nickname.substring(nickname.lastIndexOf(']')+1).trim();
                const taggedName = `[${tags.join('/')}] ${displayName}`;
                if( nickname !== taggedName) {
                    if( GuildSync.skipDiscordUsers.includes( registeredUser.discord.id ) ){
                        continue;
                    }
                    //this.info(`Updating \`${registeredUser.discord.username}\`'s tag. New nickname: \`${taggedName}\``, LogOptions.All);
                    try{
                        await discordUser.setNickname( taggedName );
                    }catch(e){
                        GuildSync.skipDiscordUsers.push( registeredUser.discord.id );
                        this.error( `Error updating tag for ${registeredUser.discord.username}. ${e.status} ${e.message}`);
                    }
                }
            }
        }
    }

    static async updateRosterDoc( tag ) {
        if( !tag ) return;
        const guild = settings.guildsync.guilds.find( _ => _.tag === tag );
        let packDoc = await getGuildMembers( tag );
        let roster = await gw2.guild.members( guild.id );
        let registeredUsers = await registrations.find().toArray();

        for( let member of roster ) {
            //If an active guild member is missing from the pack document, add them.
            let user = registeredUsers.find( _ => compareToCaseInsensitive(_.gw2Id,member.name));
            let doc = packDoc.find( _ => compareToCaseInsensitive(_.Gw2Id, member.name ) );
            if( !doc ) {
                let status = 'Recruit';
                if( member.rank !=='Pup' ) {
                    status = 'Active';
                }
                await insertNewGuildMember( member.name, tag, {
                    username: user?.discord.username,
                    nickname: '',
                    agreedToTerms: false,
                    status,
                    registered: user !== undefined,
                    guildBuildGiven: false,
                    inBoth: false,
                    joined: Date.now(),
                    apikey: user?.apikey,
                });
            }else{
                let updateObject = {};
                //Active guild member already exists. Lets update them
                if( (doc.status === 'Tryout' || doc.status === 'Recruit') && member.rank !== 'Pup' ){
                    updateObject.status = 'Active';
                }
                if( !doc.joined ){
                    updateObject.joined = member.joined.format('MM/DD/YYYY');
                }
                if( Object.values(updateObject).length > 0 ){
                    await setColumnValues( member.name, updateObject, tag );
                }
            }
        }
    }
}