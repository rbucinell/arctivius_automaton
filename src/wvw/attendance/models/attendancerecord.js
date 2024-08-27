import dayjs from "dayjs";
import AttendanceMember from "./attendencemember.js";
import VoiceMember from "./voicemember.js";

export default class AttendanceRecord {

    date = null;
    discord = null;
    gw2Id = null;
    voiceCount = null;
    combatCount = null;
    signup = null;
    minutesBetweenChecks = null;
    totalCombat = null;
    _id = null;

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
    constructor( date, discord = null, gw2Id = null, voiceCount = null, combatCount = null, signup = null, minutesBetweenChecks = null, totalCombat = null, _id = null ) {
        this.date = dayjs(date).toDate();
        this.discord = discord;
        this.gw2Id = gw2Id;
        this.voiceCount = voiceCount;
        this.combatCount = combatCount;
        this.signup = signup;
        this.minutesBetweenChecks = minutesBetweenChecks;
        this.totalCombat = totalCombat;
        this._id = _id;
    }

    /**
     * Creates a new AttendanceRecord object from a document.
     *
     * @param {Object} document - The mongoDB document containing the data for the AttendanceRecord.
     * @return {AttendanceRecord} The newly created AttendanceRecord object.
     */
    static fromDocument( document ) {
        return new AttendanceRecord(
            document.date,
            document.discord,
            document.gw2Id,
            document.voiceCount,
            document.combatCount,
            document.signup,
            document.minutesBetweenChecks,
            document.totalCombat,
            document._id
        );
    }

    /**
     * Sets the fields of the AttendanceRecord based on the provided AttendanceMember.
     *
     * @param {AttendanceMember} attendanceMember - The AttendanceMember object containing the data to set.
     * @return {void} No return value.
     */
    setFieldsFromAttendanceMember( attendanceMember ) {
        this.discord = attendanceMember.discord;
        this.gw2Id = attendanceMember.gw2Id;
        this.signup = attendanceMember.signedUp;
        this.combatCount = attendanceMember.battles;
        this.voiceCount = attendanceMember.voiceCount;
    }

    /**
     * Sets the fields of the AttendanceRecord based on the provided AttendanceMember.
     *
     * @param {VoiceMember} voiceMember - The AttendanceMember object containing the data to set.
     * @return {void} No return value.
     */
    setFieldsFromVoiceMember( voiceMember ) {
        this.discord = voiceMember.discordId;
        this.voiceCount = voiceMember.voiceCount;
    }
}