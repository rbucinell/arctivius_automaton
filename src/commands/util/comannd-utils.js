export function getSentrySpanFromCommand( commandName, interaction ){
    return {
        name: `${commandName}-command`,
        attributes: {
            command: commandName,
            userId: interaction.user.id,
            username: interaction.user.username,
            options: interaction.options ? JSON.stringify(interaction.options.data) : null
        }
    }
}