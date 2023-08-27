export class Item {
    constructor(id, chat_link, name, type, rarity, level, vendor_value, flags, game_types, restrictions) {
        this.id = id;
        this.chat_link = chat_link;
        this.name = name;
        this.type = type;
        this.rarity = rarity;
        this.level = level;
        this.vendor_value = vendor_value;
        this.flags = flags;
        this.game_types = game_types;
        this.restrictions = restrictions;
    }

    static parse(json) {
        const {
            id,
            chat_link,
            name,
            type,
            rarity,
            level,
            vendor_value,
            flags,
            game_types,
            restrictions
        } = json;

        return new Item(id, chat_link, name, type, rarity, level, vendor_value, flags, game_types, restrictions);
    }
}