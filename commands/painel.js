const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

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

        // Cria botões e aplica emojis (passa o servidor!)
        const btnLogs = new ButtonBuilder().setCustomId('cfg_logs').setLabel('📊 Configurar Logs').setStyle(ButtonStyle.Primary);
        const btnFb = new ButtonBuilder().setCustomId('cfg_facebook').setLabel('📱 Configurar Facebook').setStyle(ButtonStyle.Primary);
        const btnRole = new ButtonBuilder().setCustomId('cfg_role').setLabel('👔 Configurar Cargo').setStyle(ButtonStyle.Primary);
        const btnVoice = new ButtonBuilder().setCustomId('cfg_voice').setLabel('🔊 Conectar Voz').setStyle(ButtonStyle.Success);
        const btnPanel = new ButtonBuilder().setCustomId('cfg_panel').setLabel('🛒 Criar Painel Vendas').setStyle(ButtonStyle.Secondary);

        // Aplica emojis dos assets
        client.assets.apply(btnLogs, 'configurar_logs', g);
        client.assets.apply(btnFb, 'configurar_facebook', g);
        client.assets.apply(btnRole, 'configurar_cargo', g);
        client.assets.apply(btnVoice, 'conectar_voz', g);
        client.assets.apply(btnPanel, 'criar_painel', g);

        const row1 = new ActionRowBuilder().addComponents(btnLogs, btnFb);
        const row2 = new ActionRowBuilder().addComponents(btnRole, btnVoice);
        const row3 = new ActionRowBuilder().addComponents(btnPanel);

        await interaction.reply({ embeds: [embed], components: [row1, row2, row3], ephemeral: true });
    }
};
