export default class AttandanceDateRecord {

    constructor( date , signups = null, combat = null, voice = null ) {
        this.date = date;
        this.signups = signups;
        this.combat = combat;
        this.voice = voice;
    }

    toDbRecord() {
        return {
            date: this.date,
            signups: this.signups,
            combat: this.combatants,
            voice: this.comms
        }
    }

    static fromDbRecord( record ) {
        return new AttandanceDateRecord( record.date, record.signups, record.battles, record.combatants, record.comms );
    }
}