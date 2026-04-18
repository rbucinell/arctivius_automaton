
import { dinfo, LogOptions } from '../logger.js';
import { DiscordManager } from '../discord/manager.js';
import { MessageCommands } from '../commands/message/messagecommands.js';
import { Module } from '../modules/module.js';
import { CrimsonBlackout } from '../discord/ids.js';
import { settings } from '../util.js';
import { ButtonBuilder, TextDisplayBuilder, ActionRowBuilder, MessageFlags, SectionBuilder, ButtonStyle  } from 'discord.js';
import { LabelBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, Events } from 'discord.js';
import register from '../commands/register.js';

export class MessageWatcher extends Module {
    static async initialize() {
        this.info(`Module Initialized`, LogOptions.ConsoleOnly);

        //Listen for all messages
        DiscordManager.Client.on('messageCreate', (async message => {            
            //Ignore my own posts
            if( message.author.id !== DiscordManager.Client.user.id ) {
                dinfo(message.guild, message.channel, this.authorName( message.author ), message.content, LogOptions.ConsoleOnly );
                await MessageCommands.processMessageCommand( message ); 
            }
        }));

        DiscordManager.Client.on( Events.InteractionCreate, async interaction => {
            if( interaction.isButton() ) {
                if( interaction.customId === 'go-register-button' ) {
                    const modal = new ModalBuilder()
                        .setCustomId('register-gw2id-modal')
                        .setTitle('Register your GuildWars2 Account');
                    const gw2IdInput = new TextInputBuilder()
                        .setCustomId('gw2id-input')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Tybalt LeftPaw.1234')
                        .setRequired(true);    
                    const gw2IdLabel = new LabelBuilder()
                        .setLabel('Enter your GuildWars2 Account Name')
                        .setDescription( `In game, open your Friends list ('Y' default key). Your GW2 ID is at the top of the panel.` )
                        .setTextInputComponent(gw2IdInput);

                    modal.addComponents(gw2IdLabel);
                    await interaction.showModal(modal);
                }
            }
            else if( interaction.isModalSubmit() ) {
                if( interaction.customId === 'register-gw2id-modal' ) {
                    const gw2Id = interaction.fields.getTextInputValue('gw2id-input');
                    
                    await register.registerGw2Id( interaction.user, gw2Id );

                    await interaction.reply({ 
                        content: `Thanks for registering your GW2 account as ${gw2Id}!`,
                        flags: MessageFlags.Ephemeral
                    });
                }
            }
        });

        DiscordManager.Client.on('guildMemberAdd', (async member => {
            try{
                if( settings.welcomeMessage.enabled ){
                    const channel = await DiscordManager.Client.channels.fetch( settings.welcomeMessage.channelId );

                    const textComponent = new TextDisplayBuilder()
                        .setContent( settings.welcomeMessage.message.replace( /{user}/g, `<@${member.id}>` ) );

                    const buttonRow = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('go-register-button')
                            .setLabel('Register your GuildWars2 Account')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setURL('https://discord.com/channels/468951017980035072/1328217315590012928')
                            .setLabel('Give Aleeva API Access') 
                            .setStyle(ButtonStyle.Link)
                    );
                    await channel.send({
                        components: [ textComponent, buttonRow ],
                        flags: MessageFlags.IsComponentsV2
                    });
                }
            }catch( err ) {
                console.error( err );
            }
        }));
    }

    static authorName( author ) {
        return author.bot ? `[🤖${author.username}]` : author.username
    }
}
