export class AchievementCategory {
    constructor(id, name='', description='', order='', icon='', achievements=[] ) {
      this.id = id;
      this.name = name;
      this.description = description;
      this.order = order;
      this.icon = icon;
      this.achievements = achievements;
    }

    static parse (data) {
        const id = data.id;
        const name = data?.name;
        const description = data?.description;
        const order = data?.order;
        const icon = data?.icon;
        const achievements = data?.achievements;
        return new AchievementCategory(id,name,description,order,icon,achievements);
    }
  }
  