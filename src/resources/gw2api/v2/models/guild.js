export class Guild {
    constructor(id, name, tag, emblem, flags) {
      this.id = id;
      this.name = name;
      this.tag = tag;
      this.emblem = emblem;
      this.flags = flags;
    }
  
    setDetails(level, motd, influence, aetherium, favor, member_count, member_capacity) {
      this.level = level;
      this.motd = motd;
      this.influence = influence;
      this.aetherium = aetherium;
      this.favor = favor;
      this.member_count = member_count;
      this.member_capacity = member_capacity;
    }

    static parse(guildData) {
        const emblem = guildData.emblem;
        const background = emblem.background;
        const foreground = emblem.foreground;
        const flags = guildData.flags || [];
        const leaderOrMemberFields = guildData.level !== undefined;
    
        const id = guildData.id;
        const name = guildData.name;
        const tag = guildData.tag;
        const backgroundId = background ? background.id : null;
        const backgroundColors = background ? background.colors : null;
        const foregroundId = foreground ? foreground.id : null;
        const foregroundColors = foreground ? foreground.colors : null;
        const level = leaderOrMemberFields ? guildData.level : null;
        const motd = leaderOrMemberFields ? guildData.motd : null;
        const influence = leaderOrMemberFields ? guildData.influence : null;
        const aetherium = leaderOrMemberFields ? guildData.aetherium : null;
        const favor = leaderOrMemberFields ? guildData.favor : null;
        const memberCount = leaderOrMemberFields ? guildData.member_count : null;
        const memberCapacity = leaderOrMemberFields ? guildData.member_capacity : null;
    
        const emblemObj = {
          background: {
            id: backgroundId,
            colors: backgroundColors
          },
          foreground: {
            id: foregroundId,
            colors: foregroundColors
          }
        };
    
        return new Guild(id, name, tag, emblemObj, flags, level, motd, influence, aetherium, favor, memberCount, memberCapacity);
      }
  }
  