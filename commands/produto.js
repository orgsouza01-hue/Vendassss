const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('produto')
        .setDescription('Gerenciar produtos')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub => sub
            .setName('criar')
            .setDescription('Criar novo produto')
            .addStringOption(o => o.setName('nome').setDescription('Nome do produto').setRequired(true))
            .addStringOption(o => o.setName('descricao').setDescription('Descrição').setRequired(false))
            .addNumberOption(o => o.setName('preco').setDescription('Valor em R$').setRequired(true).setMinValue(0.01))
            .addIntegerOption(o => o.setName('estoque').setDescription('0 = infinito').setRequired(true).setMinValue(0))
            .addStringOption(o => o.setName('entrega').setDescription('Entrega automática (opcional)').setRequired(false))
        ),

    async execute(interaction, client) {
        if (interaction.options.getSubcommand() === 'criar') {
            const nome = interaction.options.getString('nome');
            const desc = interaction.options.getString('descricao') || 'Sem descrição';
            const preco = interaction.options.getNumber('preco');
            const estoque = interaction.options.getInteger('estoque');
            const entrega = interaction.options.getString('entrega');

            const id = client.db.addProduct(interaction.guild.id, 'painel-padrao', nome, desc, preco, estoque, entrega);
            
            if (!id) {
                return interaction.reply({ content: '❌ Erro ao salvar produto!', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ PRODUTO CRIADO')
                .addFields(
                    { name: '🆔 ID', value: `#${id}`, inline: true },
                    { name: '📦 Nome', value: nome, inline: true },
                    { name: '💰 Preço', value: `R$ ${preco.toFixed(2)}`, inline: true },
                    { name: '📊 Estoque', value: estoque === 0 ? '♾️ Infinito' : `${estoque} unid.`, inline: true },
                    { name: '📝 Descrição', value: desc.substring(0, 100), inline: true }
                );

            if (entrega) embed.addFields({ name: '⚡ Entrega Automática', value: '✅ Configurada', inline: true });

            console.log(`📦 Produto #${id} criado: ${nome} | R$${preco}`);
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
