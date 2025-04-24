export default class VoiceMember {

    /**
     * Constructs a new VoiceMember object with the given parameters.
     *
     * @param {string} username - The Discord username of the voice member.
     * @param {number} voiceCount - The number of present check-ins for the voice member.
     */
    constructor( username, voiceCount ) {
        this.username = username;
        this.voiceCount = parseInt(voiceCount);
    }
}