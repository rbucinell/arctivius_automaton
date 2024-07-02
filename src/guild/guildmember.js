/**
 * Guild member data; Source of data from:
 * https://docs.google.com/spreadsheets/d/1_ZyImw6ns9Gqw4jSKtH67iWRbGtQkeJnEXroowXPgas/edit?pli=1#gid=0
 * 
 */
export default class GuildMember {
    /**
     * Constructs a new GuildMember object with the given parameters.
     *
     * @param {string} teamspeakName - The Teamspeak name of the member.
     * @param {string} gw2ID - The Guild Wars 2 ID of the member.
     * @param {string} discordID - The Discord ID of the member.
     * @param {boolean} agreedToTerms - Whether the member has agreed to the terms.
     * @param {string} status - The status of the member.
     * @param {boolean} hasRegistered - The user has registered with Discord
     * @param {string} mainClass - The main class of the member.
     * @param {string} mainRole - The main role of the member.
     * @param {string} guildBuildGiven - The guild build given by the member.
     * @param {string[]} additionalClasses - Additional classes of the member.
     * @param {string} willingToLearnClass - The class the member is willing to learn.
     * @param {boolean} isMainSquad - Whether the member is in the main squad.
     * @param {boolean} isWillingToLearn - Whether the member is willing to learn.
     * @param {boolean} hasAleevaApikey - Whether the member has an Aleeva API key.
     * @param {string} automatonAPIKey - The Automaton API key of the member.
     * @param {string} language - The language of the member.
     * @param {number} daysInWvW - The number of days the member has been in WvW.
     * @param {string[]} selfImprovments - Self-improvements of the member.
     * @param {string[]} improvments - Improvements of the member.
     * @param {string} notes - Notes about the member.
     */
    constructor(teamspeakName, gw2ID, discordID, agreedToTerms, status, registered, mainClass, mainRole, 
        guildBuildGiven, additionalClasses, willingToLearnClass, isMainSquad, isWillingToLearn, 
        hasAleevaApikey, automatonAPIKey, language, daysInWvW, selfImprovments, improvments, notes ){
        this.teamspeakName = teamspeakName;
        this.gw2ID = gw2ID;
        this.discordID = discordID;
        this.agreedToTerms = agreedToTerms;
        this.status = status;
        this.registered = registered;
        this.mainClass = mainClass;
        this.mainRole = mainRole;
        this.guildBuildGiven = guildBuildGiven;
        this.additionalClasses = additionalClasses;
        this.willingToLearnClass = willingToLearnClass;
        this.isMainSquad = isMainSquad;
        this.isWillingToLearn = isWillingToLearn;
        this.apikey = hasAleevaApikey;
        this.automatonAPIKey = automatonAPIKey;
        this.language = language;
        this.daysInWvW = daysInWvW;
        this.selfImprovments = selfImprovments;
        this.improvments = improvments;
        this.notes = notes;
        this.row = null;
    }

    static parse( dataArray ){
        dataArray.shift() 
        return new GuildMember( ...dataArray );
    }

    toDataArray(){
        return [
            this.teamspeakName
            ,this.gw2ID
            ,this.discordID
            ,this.agreedToTerms
            ,this.status
            ,this.registered
            ,this.mainClass
            ,this.mainRole
            ,this.guildBuildGiven
            ,this.additionalClasses
            ,this.willingToLearnClass 
            ,this.isMainSquad
            ,this.isWillingToLearn
            ,this.apikey
            ,this.automatonAPIKey
            ,this.language
            ,this.daysInWvW
            ,this.selfImprovments
            ,this.improvments
            ,this.notes
        ]
    }
}