const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reacao')
        .setDescription('Configurar emoji de reação para o Facebook'),

    async execute(interaction, client) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: '❌ Você não tem permissão para usar este comando!', ephemeral: true });
        }

        const emojis = interaction.guild.emojis.cache;
        
        if (emojis.size === 0) {
            return interaction.reply({ content: '❌ Este servidor não possui emojis personalizados!', ephemeral: true });
        }

        const options = emojis.map(emoji => ({
            label: emoji.name,
            value: emoji.id,
            emoji: emoji.id
        })).slice(0, 25); // Limite máximo de 25 opções

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_reaction_emoji')
            .setPlaceholder('Selecione um emoji para usar nas reações...')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.reply({ 
            content: '🎭 Selecione abaixo o emoji que será usado nas reações do canal de Facebook:',
            components: [row],
            ephemeral: true 
        });
    }
};
