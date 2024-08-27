export default class VoiceMember {

    /**
     * Constructs a new VoiceMember object with the given parameters.
     *
     * @param {string} discordId - The Discord ID of the voice member.
     * @param {number} voiceCount - The number of present check-ins for the voice member.
     */
    constructor( discordId, voiceCount ) {
        this.discordId = discordId;
        this.voiceCount = parseInt(voiceCount);
    }
}