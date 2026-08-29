const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('painel')
        .setDescription('Painel de configuração de vendas')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, client) {
        const g = interaction.guild;
        
        const logCh = await client.db.getConfig(g.id, 'log_channel_id');
        const fbCh = await client.db.getConfig(g.id, 'fb_channel_id');
        const cliRole = await client.db.getConfig(g.id, 'customer_role_id');
        const voiceCh = await client.db.getConfig(g.id, 'voice_channel_id');

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('⚙️ PAINEL DE CONFIGURAÇÃO')
            .setDescription('Configure todas as opções abaixo:')
            .addFields(
                { name: '📊 Logs de Vendas', value: logCh ? `<#${logCh}> ✅` : '❌ Não configurado', inline: true },
                { name: '📱 Canal Facebook', value: fbCh ? `<#${fbCh}> ✅` : '❌ Não configurado', inline: true },
                { name: '👔 Cargo Cliente', value: cliRole ? `<@&${cliRole}> ✅` : '❌ Não configurado', inline: true },
                { name: '🔊 Canal de Voz', value: voiceCh ? `<#${voiceCh}> ✅` : '❌ Não conectado', inline: true }
            )
            .setFooter({ text: g.name })
            .setTimestamp();

        const row1 = new ActionRowBuilder().addComponents(
            client.assets.applyToButton(new ButtonBuilder().setCustomId('cfg_logs').setLabel('Configurar Logs').setStyle(ButtonStyle.Primary), 'configurar_logs'),
            client.assets.applyToButton(new ButtonBuilder().setCustomId('cfg_facebook').setLabel('Configurar Facebook').setStyle(ButtonStyle.Primary), 'configurar_facebook')
        );
        const row2 = new ActionRowBuilder().addComponents(
            client.assets.applyToButton(new ButtonBuilder().setCustomId('cfg_role').setLabel('Configurar Cargo').setStyle(ButtonStyle.Primary), 'configurar_cargo'),
            client.assets.applyToButton(new ButtonBuilder().setCustomId('cfg_voice').setLabel('Conectar Voz').setStyle(ButtonStyle.Success), 'conectar_voz')
        );
        const row3 = new ActionRowBuilder().addComponents(
            client.assets.applyToButton(new ButtonBuilder().setCustomId('cfg_panel').setLabel('Criar Painel Vendas').setStyle(ButtonStyle.Secondary), 'criar_painel')
        );

        await interaction.reply({ embeds: [embed], components: [row1, row2, row3], ephemeral: true });
    }
};
