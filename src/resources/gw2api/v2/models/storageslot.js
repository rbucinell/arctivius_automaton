export class StorageSlot {
    constructor(name, profession, specializations, id, traits, skills, heal, utilities, elite, aquaticSkills, legends, aquaticLegends) {
      this.name = name;
      this.profession = profession;
      this.specializations = specializations;
      this.id = id;
      this.traits = traits;
      this.skills = skills;
      this.heal = heal;
      this.utilities = utilities;
      this.elite = elite;
      this.aquaticSkills = aquaticSkills;
      this.legends = legends;
      this.aquaticLegends = aquaticLegends;
    }
  
    static parse(data) {
      const name = data.name;
      const profession = data.profession;
      const specializations = data.specializations;
      const id = data.id;
      const traits = data.traits;
      const skills = data.skills || null;
      const heal = data.heal;
      const utilities = data.utilities;
      const elite = data.elite;
      const aquaticSkills = data.aquatic_skills || null;
      const legends = data.legends || null;
      const aquaticLegends = data.aquatic_legends || null;
      return new StorageSlot(name, profession, specializations, id, traits, skills, heal, utilities, elite, aquaticSkills, legends, aquaticLegends);
    }
  }
  