import { SlashCommandBuilder } from "discord.js";
import { getSentrySpanFromCommand } from "./util/comannd-utils.js";
import * as Sentry from "@sentry/node";

module.exports = {
	data: new SlashCommandBuilder()
		.setName('server')
		.setDescription('Provides information about the server.'),
	async execute(interaction) {
		await interaction.deferReply();
		Sentry.startSpan(getSentrySpanFromCommand('server',interaction), async ()=>{
			// interaction.guild is the object representing the Guild in which the command was run
			await interaction.reply(`This server is ${interaction.guild.name} and has ${interaction.guild.memberCount} members.`);
		});
	},
};