
/**
 * Class representing the Wizards Vault Objective Meta data
 * 
 * @typedef {Object} WizardVaultMetaInfo
 * @property { {current:number, complete:number} } progress - The progress data
 * @property { {id:number, astral:number, claimed:boolean} } reward - The reward data.
 */
export class WizardVaultMetaInfo {

    /**
     * @param {number} progressCurrent The current progress to the meta achievement for the daily.
     * @param {number} progressComplete The threshold for the meta progress to be 'complete', and the meta reward claimable.
     * @param {number} rewardItemId The ID of the item you receive for claiming the meta reward
     * @param {number} rewardAstral The amount of Astral Acclaim you receive for claiming the meta reward
     * @param {boolean} rewardClaimed  Whether the account has claimed the meta reward.
     */
    constructor( progressCurrent, progressComplete, rewardItemId, rewardAstral, rewardClaimed ) {
        this.progress = {
            current: progressCurrent,
            complete: progressComplete,
        };
        this.reward = {
            id: rewardItemId,
            astral: rewardAstral,
            claimed: rewardClaimed
        };
    }

    static parse( data ){
        const { meta_progress_current, meta_progress_complete, meta_reward_item_id, meta_reward_astral, meta_reward_claimed} = data;
        if( meta_progress_current === undefined && 
            meta_progress_complete === undefined &&
            meta_reward_item_id === undefined &&
            meta_reward_astral === undefined && 
            meta_reward_claimed === undefined){
                return null;
            };

        return new WizardVaultMetaInfo(
            meta_progress_current,
            meta_progress_complete,
            meta_reward_item_id,
            meta_reward_astral,
            meta_reward_claimed  === 'true'
        );
    }
}