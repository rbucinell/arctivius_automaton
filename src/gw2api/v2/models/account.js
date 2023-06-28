export class Account {
    constructor(id, name, age, world, guilds, guild_leader, created, access, commander, fractal_level, daily_ap, monthly_ap, wvw_rank) {
        this.id = id;
        this.name = name;
        this.age = age;
        this.world = world;
        this.guilds = guilds;
        this.guild_leader = guild_leader;
        this.created = new Date(created);
        this.access = access;
        this.commander = commander;
        this.fractal_level = fractal_level;
        this.daily_ap = daily_ap;
        this.monthly_ap = monthly_ap;
        this.wvw_rank = wvw_rank;
    }

    static parse( jsonData ) {
        const account = new Account(
            jsonData.id,
            jsonData.name,
            jsonData.age,
            jsonData.world,
            jsonData.guilds,
            jsonData.guild_leader,
            jsonData.created,
            jsonData.access,
            jsonData.commander,
            jsonData.fractal_level,
            jsonData.daily_ap,
            jsonData.monthly_ap,
            jsonData.wvw_rank
        );
        return account;
    }
}