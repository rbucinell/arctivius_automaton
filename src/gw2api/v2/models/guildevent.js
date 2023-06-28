export class GuildEvent {
    constructor(id, time, type, user = null, invited_by = null, kicked_by = null, changed_by = null, old_rank = null, new_rank = null, item_id = null, count = null, operation = null, coins = null, motd = null, upgrade_id = null, recipe_id = null, action = null) {
        this.id = id;
        this.time = time;
        this.type = type;
        this.user = user;
        this.invited_by = invited_by;
        this.kicked_by = kicked_by;
        this.changed_by = changed_by;
        this.old_rank = old_rank;
        this.new_rank = new_rank;
        this.item_id = item_id;
        this.count = count;
        this.operation = operation;
        this.coins = coins;
        this.motd = motd;
        this.upgrade_id = upgrade_id;
        this.recipe_id = recipe_id;
        this.action = action;
    }
}