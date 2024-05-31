import CombatMember from './combatmember.js';

export default class AttendanceMember {

    gw2Id = null;
    discordId = null;
    battles = null;
    voiceCount = null;
    signedUp = null;

    constructor( gw2Id ) {
        this.gw2Id = gw2Id;
    }

    /**
     * 
     * @param {CombatMember} cm 
     * @returns 
     */
    static FromCombatMember( cm ){
        let am = new AttendanceMember( cm.gw2Id.toLowerCase() );
        am.battles = cm.battles;
        return am;
    }
}
