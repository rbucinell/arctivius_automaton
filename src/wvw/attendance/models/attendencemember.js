import CombatMember from './combatmember.js';

/**
 * AttendanceMember
 * @class
 */
export default class AttendanceMember {

    constructor( gw2Id ) {
        /** @type {string} */
        this.gw2Id = gw2Id;

        /** @type {?string} */
        this.username = null;

        /** @type {?number} */
        this.battles = null;

        /** @type {?number} */
        this.voiceCount = null;

        /** @type {?boolean} */
        this.signedUp = null;
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
