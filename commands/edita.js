const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('edita')
        .setDescription('Editar produtos existentes')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, client) {
        const prods = client.db.getProductsByGuild(interaction.guild.id);
        if (prods.length === 0) return interaction.reply({ content: '❌ Nenhum produto! Use o botão "Criar Produto" no painel.', ephemeral: true });

        const opts = prods.map(p => ({
            label: p.name.substring(0, 50),
            description: `R$ ${Number(p.price).toFixed(2)} | Estoque: ${p.stock === 0 ? 'Infinito' : p.stock}`,
            value: `edit_${p.id}`
        })).slice(0, 25);

        const sel = new StringSelectMenuBuilder().setCustomId('select_edit_product').setPlaceholder('Selecione um produto...').addOptions(opts);
        await interaction.reply({ content: '📝 Selecione o produto para editar:', components: [new ActionRowBuilder().addComponents(sel)], ephemeral: true });
    }
};

async function showEditPanel(interaction, client, pid) {
    const p = client.db.getProductById(pid);
    if (!p) return interaction.update({ content: '❌ Produto não encontrado!', components: [] });

    const embed = new EmbedBuilder().setColor('#ffaa00').setTitle(`📝 EDITANDO PRODUTO #${p.id}`).addFields(
        { name: '📦 Nome', value: p.name, inline: true },
        { name: '💰 Valor', value: `R$ ${Number(p.price).toFixed(2)}`, inline: true },
        { name: '📊 Estoque', value: p.stock === 0 ? '♾️ Infinito' : `${p.stock} unid.`, inline: true },
        { name: '📝 Descrição', value: p.description.substring(0, 200), inline: false },
        { name: '⚡ Entrega', value: p.auto_delivery ? '✅ Configurada' : '❌ Não', inline: true }
    );

    const r1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`edit_name_${pid}`).setLabel('Alterar Nome').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`edit_desc_${pid}`).setLabel('Alterar Descrição').setStyle(ButtonStyle.Primary)
    );
    const r2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`edit_price_${pid}`).setLabel('Alterar Valor').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`edit_stock_${pid}`).setLabel('Alterar Estoque').setStyle(ButtonStyle.Success)
    );
    const r3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`edit_delivery_${pid}`).setLabel('Alterar Entrega').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`edit_delete_${pid}`).setLabel('🗑️ Excluir').setStyle(ButtonStyle.Danger)
    );

    await interaction.update({ embeds: [embed], components: [r1, r2, r3], content: '' });
}
module.exports.showEditPanel = showEditPanel;
