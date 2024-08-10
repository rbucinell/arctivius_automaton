import dayjs from "dayjs";

export default class AttendanceRecord {

    date = null;
    discord = null;
    gw2Id = null;
    voiceCount = null;
    combatCount = null;
    signup = null;
    minutesBetweenChecks = null;
    totalCombat = null;

    /**
     * Constructs a new AttendanceRecord object with the given parameters.
     *
     * @param {Date} date - The date of the attendance record.
     * @param {string} [discord=null] - The Discord ID of the user.
     * @param {string} [gw2Id=null] - The Guild Wars 2 ID of the user.
     * @param {number} [voiceCount=null] - The number of voice minutes used by the user.
     * @param {number} [combatCount=null] - The number of combat minutes used by the user.
     * @param {boolean} [signup=null] - Indicates if the user signed up for the event.
     */
    constructor( date, discord = null, gw2Id = null, voiceCount = null, combatCount = null, signup = null, minutesBetweenChecks = null, totalCombat = null ) {
        this.date = dayjs(date).toDate();
        this.discord = discord;
        this.gw2Id = gw2Id;
        this.voiceCount = voiceCount;
        this.combatCount = combatCount;
        this.signup = signup;
        this.minutesBetweenChecks = minutesBetweenChecks;
        this.totalCombat = totalCombat;
    }

    static fromDocument( document ) {
        return new AttendanceRecord(
            document.date,
            document.discord,
            document.gw2Id,
            document.voiceCount,
            document.combatCount,
            document.signup,
            document.minutesBetweenChecks,
            document.totalCombat
        );
    }
}