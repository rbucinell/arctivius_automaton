import { SlashCommandBuilder } from "discord.js";

export default class ping {
    
    static get data () {
        return new SlashCommandBuilder()
            .setName('ping')
            .setDescription('Replies with Pong!');
    };

    //Access client via: interaction.client
    static async execute( interaction ) {
        await interaction.reply('Pong!');
    }
}