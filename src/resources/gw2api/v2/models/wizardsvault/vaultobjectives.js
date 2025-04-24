import { WizardVaultMetaInfo } from './vaultmetainfo.js';
import { WizardVaultObjective } from './vaultobjective.js';

/**
 * @typedef {Object} WizardVaultObjectives
 * @property {WizardVaultMetaInfo} meta The meta data of list of Objectives
 * @property {Array<WizardVaultObjective>} objectives List of objectives
 */
export class WizardVaultObjectives {

    /**
     * @param {WizardVaultMetaInfo} meta The meta data of list of Objectives
     * @param {Array<WizardVaultObjective>} objectives List of objectives
     */
    constructor( meta, objectives ){
      this.meta = meta;
      this.objectives = objectives;
    }

    static parse (data) {
        const meta = WizardVaultMetaInfo.parse(data) || null;
        const objectives = data.objectives.map( o => WizardVaultObjective.parse(o));
        return new WizardVaultObjectives( meta, objectives);
    }
      
  }
  