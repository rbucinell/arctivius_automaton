
/**
 * @typedef { Object } WizardsVault
 * @property {string} id 
 * @property {Date} start 
 * @property {Date} end 
 * @property {Array<number>} listings 
 * @property {Array<number>} objectives 
 */
export class WizardsVault {

    /**
     * @param {string} id 
     * @param {Date} start 
     * @param {Date} end 
     * @param {Array<number>} listings 
     * @param {Array<number>} objectives 
     */
    constructor(id,start,end,listings,objectives){
        this.id = id;
        this.start = start;
        this.end = end;
        this.listings = listings;
        this.objectives = objectives;
    }

    static parse( data ){
        const { id, start, end, listings, objectives } = data;
        return new WizardsVault(id, start, end, listings, objectives);
    }
}