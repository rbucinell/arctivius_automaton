export default class CombatMember {

    constructor( guildWars2Id, battleCount ) {
        this.gw2Id = guildWars2Id;
        this.battles = parseInt(battleCount);
    }
}