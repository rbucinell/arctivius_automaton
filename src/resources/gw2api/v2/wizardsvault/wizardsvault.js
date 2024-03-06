import { get } from '../../util/request.js';
import { WizardsVault } from '../models/wizardsvault/wizardsvault.js';
import { WizardVaultObjective } from '../models/wizardsvault/vaultobjective.js';
import { WizardsVaultReward } from '../models/wizardsvault/wizardsvaultreward.js';

export default class wizardsvault {
    
    /**
     * This resource returns information about the current Wizard's Vault season.
     *
     * @static
     * @async
     * @return {Promise<WizardsVault>} 
     * @memberof wizardsvault
     */
    static async get()
    {
        return WizardsVault.parse((await get('wizardsvault')).data);
    }

    /**
     * This resource returns an account's progress towards all their achievements.
     *
     * @param {Array<numbers>} ids of a listing
     * @static
     * @async
     * @memberof wizardsvault
     * @return {Promise<Array<WizardsVaultReward>>}
     */
    static async listings( ids ) {
        return (await get(`wizardsvault/listings?ids=${ids.join(',')}`)).data.map( l => WizardsVaultReward.parse(l) );
    }

    /**
     * This resource returns the items stored in a player's vault (not including material storage)
     *
     * @param {Array<numbers>} ids 
     * @async
     * @static
     * @memberof wizardsvault
     * @return {Promise<Array<WizardVaultObjective>>} 
     */
    static async objectives( ids ) {
        return (await get(`wizardsvault/objectives?ids=${ids.join(',')}`)).data.map( e => WizardVaultObjective.parse(e) );
    }
}