export class AccountAchievement {
    constructor(id, bits = [], current = 0, max = 0, done = false, repeated = 0, unlocked = true) {
      this.id = id;
      this.bits = bits;
      this.current = current;
      this.max = max;
      this.done = done;
      this.repeated = repeated;
      this.unlocked = unlocked;
    }
  
    get progress() {
      if (this.max === 0) {
        return 0;
      }
      return Math.round((this.current / this.max) * 100);
    }
  
    get isRepeatable() {
      return this.repeated > 0;
    }

    static parse (data) {
        const id = data.id;
        const bits = data.bits || [];
        const current = data.current || 0;
        const max = data.max || 0;
        const done = data.done || false;
        const repeated = data.repeated || 0;
        const unlocked = data.unlocked || true;
        return new AccountAchievement(id, bits, current, max, done, repeated, unlocked);
    }
      
  }
  