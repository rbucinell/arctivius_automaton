/**
 * Guild member data; Source of data from:
 * https://docs.google.com/spreadsheets/d/1_ZyImw6ns9Gqw4jSKtH67iWRbGtQkeJnEXroowXPgas/edit?pli=1#gid=0
 * 
 */
export default class GuildMember {
    constructor(teamspeakName, gw2ID, discordID, agreedToTerms, status, hasTS, mainClass, mainRole, guildBuildGiven, 
        additionalClasses, willingToLearnClass, isMainSquad, isWillingToLearn, hasAleevaApikey, automatonAPIKey, language, daysInWvW, selfImprovments, 
        improvments, notes ){
        this.teamspeakName = teamspeakName;
        this.gw2ID = gw2ID;
        this.discordID = discordID;
        this.agreedToTerms = agreedToTerms;
        this.status = status;
        this.hasTS = hasTS;
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
}