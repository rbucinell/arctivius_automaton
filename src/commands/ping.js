import { SlashCommandBuilder } from "discord.js";

// export default ping = async( client, cmd ) =>{
//     client.api.applications(client.user.id).commands.post(cmd);
// }

// module.exports = {
//     data: new SlashCommandBuilder()
// 	    .setName('ping')
// 	    .setDescription('Replies with Pong!'),
    
//     async execute(interaction) {
//         
//         await interaction.reply('Pong!')
//     }
// };

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