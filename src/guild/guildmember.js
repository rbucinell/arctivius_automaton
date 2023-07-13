/**
 * Guild member data; Source of data from:
 * https://docs.google.com/spreadsheets/d/1_ZyImw6ns9Gqw4jSKtH67iWRbGtQkeJnEXroowXPgas/edit?pli=1#gid=0
 * 
 */
export default class GuildMember {
    constructor(teamspeakName, gw2ID, discordID, status, apikey, mainClass, secondaryClass){
        this.teamspeakName = teamspeakName;
        this.gw2ID = gw2ID;
        this.discordID = discordID;
        this.status = status;
        this.apikey = apikey;
        this.mainClass = mainClass;
        this.secondaryClass = secondaryClass
    }

    static parse( dataArray ){
        return new GuildMember(
            dataArray[1],
            dataArray[2],
            dataArray[3],
            dataArray[5],
            dataArray[13],
            dataArray[7],
            dataArray[10]
        );
    }
}