import dayjs from "dayjs";

export class GuildMember {
    constructor(name, rank, joined) {
        this.name = name;
        this.rank = rank;
        this.joined = dayjs(joined);
    }

    static parse(data) {
        const { name, rank, joined } = data;
        return new GuildMember( name, rank, joined );
    }
}