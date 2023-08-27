export class VaultItem {
    constructor(id, count, charges, skin, dyes, upgrades, upgradeSlotIndices, infusions, binding, boundTo, stats) {
      this.id = id;
      this.count = count;
      this.charges = charges;
      this.skin = skin;
      this.dyes = dyes;
      this.upgrades = upgrades;
      this.upgradeSlotIndices = upgradeSlotIndices;
      this.infusions = infusions;
      this.binding = binding;
      this.boundTo = boundTo;
      this.stats = stats;
    }
  
    static parse(data) {
        if( !data ) return null;
        const id = data.id;
        const count = data.count;
        const charges = data.charges || null;
        const skin = data.skin || null;
        const dyes = data.dyes || null;
        const upgrades = data.upgrades || null;
        const upgradeSlotIndices = data.upgrade_slot_indices || null;
        const infusions = data.infusions || null;
        const binding = data.binding || null;
        const boundTo = data.bound_to || null;
        const statsData = data.stats || null;
        let stats = null;
        if (statsData) {
            const id = statsData.id;
            const attributes = statsData.attributes || null;
            stats = { id, attributes };
        }
        return new VaultItem(id, count, charges, skin, dyes, upgrades, upgradeSlotIndices, infusions, binding, boundTo, stats);
    }
  }
  