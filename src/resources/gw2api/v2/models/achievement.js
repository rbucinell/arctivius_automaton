export class Achievement {
    constructor(id, icon, name, description, requirement, lockedText, type, flags, bits = [], tiers = []) {
        this.id = id;
        this.icon = icon;
        this.name = name;
        this.description = description;
        this.requirement = requirement;
        this.lockedText = lockedText;
        this.type = type;
        this.flags = flags;
        this.bits = bits;
        this.tiers = tiers;
    }

    static parse(data) {
        const {
            id,
            icon,
            name,
            description,
            requirement,
            locked_text,
            type,
            flags,
            bits = [],
            tiers = []
        } = data || {};
    
        return new Achievement(
            id || 0,
            icon || '',
            name || '',
            description || '',
            requirement || '',
            locked_text || '',
            type || '',
            flags || [],
            bits.map(bit => ({
                type: bit.type || '',
                id: bit.id || 0
            })),
            tiers.map(tier => ({
                count: tier.count || 0,
                points: tier.points || 0
            }))
        );
    }
}