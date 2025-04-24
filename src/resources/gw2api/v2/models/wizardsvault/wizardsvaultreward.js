export class WizardsVaultReward {

    /**
     * @param {string} id The listing Id
     * @param {string} item_id The Id of the item
     * @param {string} item_count The quantity of the item the user receives
     * @param {('Featured'|'Normal'|'Legacy')} type Appears to be the position in the wizards vault UI. Possible values include "Featured" (In the hero banner at the top), "Normal" (Displayed in the rewards table) and "Legacy" (In the Legacy Vault section).
     * @param {number} cost The quantity of Astral Acclaim to purchase.
     * @param {number|null} purchased Optional. Not included if the reward is unlimited (e.g. the unlimited Bag of Coins (1 Gold))
     * @param {number|null} purchase_limit Optional. Not included if the reward is unlimited (e.g. the unlimited Bag of Coins (1 Gold))
     */
    constructor(id, item_id, item_count, type, cost, purchased, purchase_limit){
        this.id = id;
        this.item_id = item_id;
        this.item_count = item_count;
        this.type = type;
        this.cost = cost;
        this.purchased = purchased;
        this.purchase_limit = purchase_limit;
    }

    static parse( data ){
        const { id, item_id, item_count, type,cost, purchased = null, purchase_limit = null } = data;
        return new WizardsVaultReward( id, item_id, item_count, type, cost, purchased, purchase_limit );
    }
}