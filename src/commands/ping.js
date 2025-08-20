import { SlashCommandBuilder } from "discord.js";
import { getSentrySpanFromCommand } from "./util/comannd-utils.js";
import * as Sentry from "@sentry/node";

export default class ping {
    
    static get data () {
        return new SlashCommandBuilder()
            .setName('ping')
            .setDescription('Replies with Pong!');
    };

    //Access client via: interaction.client
    static async execute( interaction ) {
        await Sentry.startSpan(
            getSentrySpanFromCommand('ping',interaction), 
            async _ => await interaction.reply('Pong!')
        );
    }
}