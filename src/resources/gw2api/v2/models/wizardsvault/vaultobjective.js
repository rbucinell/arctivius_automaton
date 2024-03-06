
/**
 * @typedef {Object} WizardVaultObjective
 * @property {number} id
 * @property {string} title 
 * @property {track} track 
 * @property {number} acclaim 
 * @property {number} progress_current
 * @property {number} progress_complete
 * @property {boolean} claimed 
 */
export class WizardVaultObjective {

    /**
     * @param {number} id The ID of the objective
     * @param {string} title 
     * @param {track} track 
     * @param {number} acclaim 
     * @param {number} progress_current 
     * @param {number} progress_complete 
     * @param {boolean} claimed 
     */
    constructor( id, title, track, acclaim, progress_current, progress_complete, claimed ){
        this.id = id;
        this.title = title;
        this.track = track;
        this.acclaim = acclaim;
        this.progress_current = progress_current;
        this.progress_complete = progress_complete;
        this.claimed = claimed;
    }

    static parse( data ) {
        const id = data.id;
        const title = data.title || '';
        const track = data.track || '';
        const acclaim = data.acclaim || 0;
        const progress_current = data.progress_current || null;
        const progress_complete = data.progress_complete || null;
        const claimed = (data.claimed === 'true') || null;
        
        return new WizardVaultObjective(id,title,track,acclaim,progress_current,progress_complete,claimed);
    }
}