import { get } from '../../util/request.js';
import { Account } from '../models/account.js'
import { AccountAchievement } from '../models/accountachievements.js';
import { VaultItem } from '../models/vaultitem.js';
import { StorageSlot } from '../models/storageslot.js';
import { WizardVaultObjectives } from '../models/wizardsvault/vaultobjectives.js';
import { WizardsVaultReward } from '../models/wizardsvault/wizardsvaultreward.js';
import achievements from './achivements.js';

export default class account {
    
    static get achievements(){ return achievements; }

    /**
     *This resource returns information about player accounts. 
     *
     * @static
     * @return {Account} 
     * @memberof account
     */
    static async get()
    {
        return Account.parse((await get('account')).data);
    }

    /**
     * This resource returns the items stored in a player's vault (not including material storage)
     *
     * @static
     * @memberof account
     * @return {Array<VaultItem>} The endpoint returns an array of objects, each representing an item slot in the vault. If a slot is empty, it will return null. The amount of slots/bank tabs is implied by the length of the array.
     */
    static async bank() {
        return (await get('account/bank')).data.map( e => VaultItem.parse(e) );
    }

    /**
     * This resource returns the templates stored in a player's build storage. 
     *
     * @static
     * @memberof account
     * @return {Array<StorageSlot>} 
     */
    static async buildstorage() {
        console.warn("API:2/account/buildstorage does not work correctly")
        return response.data.map( e => StorageSlot.parse(e) );
    }

    /**
     * This resource returns information about time-gated recipes that have been crafted by the account since daily-reset. 
     *
     * @static
     * @memberof account
     * @return {Array<string>}  each representing a time-gated recipe name that can be resolved against /v2/dailycrafting. If no timed-gated recipes have been crafted since daily-reset by the account, it will return an empty array ([]).
     */
    static async dailycrafting() {
        return (await get('account/dailycrafting')).data;
    }

    /**
     * This resource returns the dungeons completed since daily dungeon reset.
     *
     * @static
     * @async
     * @memberof account
     * @return {Promise<Array<string>>} The endpoint returns an array, each value being the ID of a dungeon path that can be resolved against /v2/dungeons. Note that this ID indicates a path and not the dungeon itself.
     */
    static async dailycrafting() {
        return (await get('account/dungeons')).data;
    }

    static wizardsvault = {
    
        /**
         * This resource returns the Wizard Vault Daily Objectives
         * @static
         * @async
         * @function
         * @returns {Promise<WizardVaultObjectives>}
         */
        daily: async () => WizardVaultObjectives.parse((await get('account/wizardsvault/daily')).data),

        /**
         * This resource returns the Wizard Vault Weekly Objectives
         * @static
         * @async
         * @function
         * @returns {Promise<WizardVaultObjectives>}
         */
        weekly: async () => WizardVaultObjectives.parse((await get('account/wizardsvault/weekly')).data),

        /**
         * This resource returns the current set of Wizard's Vault rewards, along with details about which have already been purchased by the account, and in what quantity.
         * @static
         * @async
         * @function
         * @returns {Promise<Array<WizardsVaultReward>>}
         */
        listings: async () => (await get('account/wizardsvault/listings')).data.map( o => WizardsVaultReward.parse( o )),

        /**
         * This resource returns the current set of special Wizard's Vault achievements for the account.
         * @static
         * @async
         * @function
         * @returns {Promise<WizardVaultObjectives>}
         */
        special: async () => WizardVaultObjectives.parse((await get('account/wizardsvault/special')).data)
    }
}