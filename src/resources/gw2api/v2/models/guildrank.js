
export class GuildRank {
    
    constructor(id, order, permissions, icon) {
        this.id = id;
        this.order = order;
        this.permissions = permissions;
        this.icon = icon;
    }

    static parse(data) {
        const { id, order, permissions, icon } = data;
        return new GuildRank( id, order, permissions, icon );
    }
}