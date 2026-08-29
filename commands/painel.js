const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('painel')
        .setDescription('Painel de vendas')
        .addSubcommand(subcommand =>
            subcommand.setName('vendas')
                .setDescription('Abrir painel de configuração de vendas')
        ),

    async execute(interaction, client) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: '❌ Você não tem permissão para usar este comando!', ephemeral: true });
        }

        const guildId = interaction.guild.id;

        // Pegar configurações atuais
        const logChannel = client.configCache.get(`${guildId}_log_channel_id`);
        const fbChannel = client.configCache.get(`${guildId}_facebook_channel_id`);
        const clientRole = client.configCache.get(`${guildId}_client_role_id`);
        const voiceChannel = client.configCache.get(`${guildId}_voice_channel_id`);

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('⚙️ PAINEL DE CONFIGURAÇÃO DE VENDAS')
            .setDescription('Configure todas as opções do sistema de vendas abaixo:')
            .addFields(
                { name: '📊 Canal de Logs', value: logChannel ? `<#${logChannel}>` : '❌ Não configurado', inline: true },
                { name: '📱 Canal de Facebook', value: fbChannel ? `<#${fbChannel}>` : '❌ Não configurado', inline: true },
                { name: '👔 Cargo de Cliente', value: clientRole ? `<@&${clientRole}>` : '❌ Não configurado', inline: true },
                { name: '🔊 Canal de Voz', value: voiceChannel ? `<#${voiceChannel}>` : '❌ Não conectado', inline: true }
            )
            .setFooter({ text: `${interaction.guild.name} - Sistema de Vendas Avançado` })
            .setTimestamp();

        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('config_logs')
                    .setLabel('Configurar Canal de Logs')
                    .setEmoji('📊')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('config_facebook')
                    .setLabel('Configurar Canal de Facebook')
                    .setEmoji('📱')
                    .setStyle(ButtonStyle.Primary)
            );

        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('config_role')
                    .setLabel('Configurar Cargo Cliente')
                    .setEmoji('👔')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('config_voice')
                    .setLabel('Conectar em Canal de Voz')
                    .setEmoji('🔊')
                    .setStyle(ButtonStyle.Primary)
            );

        const row3 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('create_sales_panel')
                    .setLabel('Criar Painel de Vendas')
                    .setEmoji('🛒')
                    .setStyle(ButtonStyle.Success)
            );

        await interaction.reply({ 
            embeds: [embed], 
            components: [row1, row2, row3],
            ephemeral: true 
        });
    }
};
