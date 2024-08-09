/**
 * Guild member data; Source of data from:
 * https://docs.google.com/spreadsheets/d/1J5yecI2hPcPW2D_FDYuQDCPWBNUmgMotDxPZYLZdwkQ/edit?gid=0#gid=0
 * 
 */
export default class GuildMember {
    /**
     * Constructs a new GuildMember object with the given parameters.
     *
     * @param {string}  gw2ID - The Guild Wars 2 ID of the member.
     * @param {string}  discordID - The Discord ID of the member.
     * @param {string}  nickname - The nickname of the member
     * @param {boolean} agreedToTerms - Whether the member has agreed to the terms.
     * @param {string}  status - The status of the member.
     * @param {boolean} registered - The member has registered with Discord
     * @param {boolean} guildBuildGiven - The guild build given by the member.
     * @param {Date}    joined - The date the member joined the guild
     * @param {string}  notes - Notes about the member.
     * @param {string}  apiKey - API Key that was registered
     */
    constructor(gw2ID, discordUsername, nickname, agreedToTerms, status, registered, guildBuildGiven, joined, notes, apiKey ){
        this.gw2ID = gw2ID;
        this.discordID = discordUsername;
        this.nickname = nickname;
        this.agreedToTerms = agreedToTerms;
        this.status = status;
        this.registered = registered;
        this.guildBuildGiven = guildBuildGiven;
        this.joined = joined;
        this.notes = notes;
        this.apiKey = apiKey
        this.row = null;
    }

    get Gw2Id(){ return this.gw2ID; }
    set Gw2Id( value ){ this.gw2ID = value; }

    get Username(){ return this.discordID; }
    set Username( value ){ this.discordID = value; }

    get Nickname(){ return this.nickname; }
    set Nickname( value ) { this.nickname = value; }

    static parse( dataArray ){
        return new GuildMember( ...dataArray );
    }

    toDataArray(){
        return [
            this.gw2ID
            ,this.discordID
            ,this.nickname
            ,this.agreedToTerms
            ,this.status
            ,this.registered
            ,this.guildBuildGiven
            ,this.notes
            ,this.apikey
        ]
    }
}