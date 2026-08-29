const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, PermissionFlagsBits } = require('discord.js');
module.exports = {
    data: new SlashCommandBuilder().setName('reacao').setDescription('Configurar emoji de reação').setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction, client) {
        const emojis = interaction.guild.emojis.cache;
        if (emojis.size === 0) return interaction.reply({ content: '❌ Sem emojis!', ephemeral: true });
        const opts = emojis.map(e => ({ label: e.name, value: e.id, emoji: e.id })).slice(0, 25);
        const sel = new StringSelectMenuBuilder().setCustomId('select_reaction').setPlaceholder('Escolha um emoji').addOptions(opts);
        await interaction.reply({ components: [new ActionRowBuilder().addComponents(sel)], ephemeral: true });
    }
};
