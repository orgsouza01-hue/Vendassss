const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('edita')
        .setDescription('Editar produtos existentes')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, client) {
        const produtos = client.db.getProductsByGuild(interaction.guild.id);
        
        if (produtos.length === 0) {
            return interaction.reply({ content: '❌ Nenhum produto cadastrado! Use /produto criar', ephemeral: true });
        }

        const options = produtos.map(p => ({
            label: p.name.substring(0, 50),
            description: `R$ ${Number(p.price).toFixed(2)} | Estoque: ${p.stock === 0 ? 'Infinito' : p.stock}`,
            value: `edit_${p.id}`
        })).slice(0, 25);

        const select = new StringSelectMenuBuilder()
            .setCustomId('select_edit_product')
            .setPlaceholder('Selecione um produto para editar...')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(select);
        
        await interaction.reply({ 
            content: '📝 Selecione o produto que deseja editar:', 
            components: [row], 
            ephemeral: true 
        });
    }
};

// Função auxiliar para mostrar painel de edição do produto
async function showEditPanel(interaction, client, productId) {
    const p = client.db.getProductById(productId);
    if (!p) return interaction.update({ content: '❌ Produto não encontrado!', components: [] });

    const embed = new EmbedBuilder()
        .setColor('#ffaa00')
        .setTitle(`📝 EDITANDO PRODUTO #${p.id}`)
        .addFields(
            { name: '📦 Nome', value: p.name, inline: true },
            { name: '💰 Valor', value: `R$ ${Number(p.price).toFixed(2)}`, inline: true },
            { name: '📊 Estoque', value: p.stock === 0 ? '♾️ Infinito' : `${p.stock} unid.`, inline: true },
            { name: '📝 Descrição', value: p.description.substring(0, 200), inline: false },
            { name: '⚡ Entrega Automática', value: p.auto_delivery ? '✅ Configurada' : '❌ Não configurada', inline: true }
        );

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`edit_name_${p.id}`).setLabel('Alterar Nome').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`edit_desc_${p.id}`).setLabel('Alterar Descrição').setStyle(ButtonStyle.Primary)
    );
    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`edit_price_${p.id}`).setLabel('Alterar Valor').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`edit_stock_${p.id}`).setLabel('Alterar Estoque').setStyle(ButtonStyle.Success)
    );
    const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`edit_delivery_${p.id}`).setLabel('Alterar Entrega').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`edit_delete_${p.id}`).setLabel('🗑️ Excluir').setStyle(ButtonStyle.Danger)
    );

    await interaction.update({ embeds: [embed], components: [row1, row2, row3], content: '' });
}

module.exports.showEditPanel = showEditPanel;
