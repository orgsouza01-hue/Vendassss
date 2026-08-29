const { ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const { showEditPanel } = require('../commands/edita');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        try {
            // ============ COMANDOS SLASH ============
            if (interaction.isChatInputCommand()) {
                const cmd = client.commands.get(interaction.commandName);
                if (!cmd) return;
                await cmd.execute(interaction, client);
                return;
            }

            // ============ SELECT MENUS ============
            if (interaction.isStringSelectMenu()) {
                await handleSelectMenu(interaction, client);
                return;
            }

            // ============ BOTÕES ============
            if (interaction.isButton()) {
                await handleButtons(interaction, client);
                return;
            }

            // ============ MODAIS ============
            if (interaction.isModalSubmit()) {
                await handleModals(interaction, client);
                return;
            }

        } catch (err) {
            console.error('❌ Erro interação:', err);
            if (!interaction.replied && !interaction.deferred) {
                interaction.reply({ content: `❌ Erro: ${err.message}`, ephemeral: true }).catch(() => {});
            }
        }
    }
};

// ===================== SELECT MENUS =====================
async function handleSelectMenu(interaction, client) {
    const id = interaction.customId;
    const g = interaction.guild;

    // --- SELECIONAR CANAL DE LOGS ---
    if (id === 'select_log_channel') {
        client.db.setConfig(g.id, 'log_channel_id', interaction.values[0]);
        await updateConfigPanel(interaction, client);
        return;
    }

    // --- SELECIONAR CANAL FACEBOOK ---
    if (id === 'select_facebook_channel') {
        client.db.setConfig(g.id, 'fb_channel_id', interaction.values[0]);
        await updateConfigPanel(interaction, client);
        return;
    }

    // --- SELECIONAR CARGO CLIENTE ---
    if (id === 'select_client_role') {
        client.db.setConfig(g.id, 'customer_role_id', interaction.values[0]);
        await updateConfigPanel(interaction, client);
        return;
    }

    // --- SELECIONAR CANAL DE VOZ ---
    if (id === 'select_voice_channel') {
        const channelId = interaction.values[0];
        client.db.setConfig(g.id, 'voice_channel_id', channelId);
        
        // Conectar AGORA
        try {
            const channel = g.channels.cache.get(channelId);
            if (channel) {
                joinVoiceChannel({
                    channelId: channel.id,
                    guildId: g.id,
                    adapterCreator: g.voiceAdapterCreator,
                    selfDeaf: false,
                    selfMute: false
                });
            }
        } catch (e) { console.error('Voz:', e.message); }
        
        await updateConfigPanel(interaction, client);
        return;
    }

    // --- SELECIONAR CANAL PARA PAINEL ---
    if (id === 'select_panel_channel') {
        const data = client.tempData.get(`${interaction.user.id}_panel`);
        if (!data) return interaction.update({ content: '❌ Sessão expirada!', components: [] });

        const channel = g.channels.cache.get(interaction.values[0]);
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setColor('#ff6600')
            .setTitle(data.title)
            .setDescription(data.description);
        
        if (data.banner) embed.setImage(data.banner);

        const btn = new ButtonBuilder().setCustomId('btn_ver_opcoes').setLabel('🛒 Ver Opções').setStyle(ButtonStyle.Success);
        const msg = await channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(btn)] });
        
        client.db.addPanel({
            guildId: g.id, messageId: msg.id, channelId: channel.id,
            title: data.title, description: data.description, bannerUrl: data.banner
        });

        client.tempData.delete(`${interaction.user.id}_panel`);
        await interaction.update({ content: `✅ Painel enviado para ${channel}!`, components: [] });
        return;
    }

    // --- SELECIONAR PRODUTO PARA EDITAR (/edita) ---
    if (id === 'select_edit_product') {
        const productId = parseInt(interaction.values[0].replace('edit_', ''));
        await showEditPanel(interaction, client, productId);
        return;
    }

    // --- SELECIONAR EMOJI DE REAÇÃO ---
    if (id === 'select_reaction') {
        const emoji = g.emojis.cache.get(interaction.values[0]);
        if (emoji) {
            client.db.setReaction(g.id, emoji.toString());
            await interaction.reply({ content: `✅ Emoji configurado: ${emoji}`, ephemeral: true });
        }
        return;
    }
}

// ===================== BOTÕES =====================
async function handleButtons(interaction, client) {
    const id = interaction.customId;
    const g = interaction.guild;

    // ======= CONFIGURAÇÕES DO PAINEL =======
    if (id === 'cfg_logs') {
        const channels = g.channels.cache.filter(c => c.type === ChannelType.GuildText);
        const options = channels.map(c => ({ label: c.name, value: c.id })).slice(0, 25);
        const sel = new StringSelectMenuBuilder().setCustomId('select_log_channel').setPlaceholder('Escolha o canal de logs').addOptions(options);
        await interaction.reply({ components: [new ActionRowBuilder().addComponents(sel)], ephemeral: true });
        return;
    }

    if (id === 'cfg_facebook') {
        const channels = g.channels.cache.filter(c => c.type === ChannelType.GuildText);
        const options = channels.map(c => ({ label: c.name, value: c.id })).slice(0, 25);
        const sel = new StringSelectMenuBuilder().setCustomId('select_facebook_channel').setPlaceholder('Escolha o canal Facebook').addOptions(options);
        await interaction.reply({ components: [new ActionRowBuilder().addComponents(sel)], ephemeral: true });
        return;
    }

    if (id === 'cfg_role') {
        const roles = g.roles.cache.filter(r => !r.managed && r.id !== g.id);
        const options = roles.map(r => ({ label: r.name, value: r.id })).slice(0, 25);
        const sel = new StringSelectMenuBuilder().setCustomId('select_client_role').setPlaceholder('Escolha o cargo').addOptions(options);
        await interaction.reply({ components: [new ActionRowBuilder().addComponents(sel)], ephemeral: true });
        return;
    }

    if (id === 'cfg_voice') {
        const channels = g.channels.cache.filter(c => c.type === ChannelType.GuildVoice);
        const options = channels.map(c => ({ label: c.name, value: c.id })).slice(0, 25);
        const sel = new StringSelectMenuBuilder().setCustomId('select_voice_channel').setPlaceholder('Escolha o canal de voz').addOptions(options);
        await interaction.reply({ components: [new ActionRowBuilder().addComponents(sel)], ephemeral: true });
        return;
    }

    if (id === 'cfg_panel') {
        const modal = new ModalBuilder().setCustomId('modal_create_panel').setTitle('Criar Painel de Vendas');
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('title').setLabel('Título').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('desc').setLabel('Descrição').setStyle(TextInputStyle.Paragraph).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('banner').setLabel('URL Banner (.jpg/.png/.gif)').setStyle(TextInputStyle.Short).setRequired(false))
        );
        await interaction.showModal(modal);
        return;
    }

    // ======= EDITAR PRODUTO (/edita) =======
    if (id.startsWith('edit_')) {
        const parts = id.split('_');
        const action = parts[1];
        const productId = parseInt(parts[2]);
        const p = client.db.getProductById(productId);
        if (!p) return interaction.reply({ content: '❌ Produto não existe!', ephemeral: true });

        // --- ALTERAR NOME ---
        if (action === 'name') {
            const modal = new ModalBuilder().setCustomId(`modal_edit_name_${productId}`).setTitle('Alterar Nome');
            modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('valor').setLabel('Novo nome').setStyle(TextInputStyle.Short).setValue(p.name).setRequired(true)));
            await interaction.showModal(modal);
            return;
        }

        // --- ALTERAR DESCRIÇÃO ---
        if (action === 'desc') {
            const modal = new ModalBuilder().setCustomId(`modal_edit_desc_${productId}`).setTitle('Alterar Descrição');
            modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('valor').setLabel('Nova descrição').setStyle(TextInputStyle.Paragraph).setValue(p.description).setRequired(true)));
            await interaction.showModal(modal);
            return;
        }

        // --- ALTERAR VALOR ---
        if (action === 'price') {
            const modal = new ModalBuilder().setCustomId(`modal_edit_price_${productId}`).setTitle('Alterar Valor');
            modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('valor').setLabel('Novo valor (ex: 29.90)').setStyle(TextInputStyle.Short).setValue(String(p.price)).setRequired(true)));
            await interaction.showModal(modal);
            return;
        }

        // --- ALTERAR ESTOQUE ---
        if (action === 'stock') {
            const modal = new ModalBuilder().setCustomId(`modal_edit_stock_${productId}`).setTitle('Alterar Estoque');
            modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('valor').setLabel('Nova quantidade (0 = infinito)').setStyle(TextInputStyle.Short).setValue(String(p.stock)).setRequired(true)));
            await interaction.showModal(modal);
            return;
        }

        // --- ALTERAR ENTREGA ---
        if (action === 'delivery') {
            const modal = new ModalBuilder().setCustomId(`modal_edit_delivery_${productId}`).setTitle('Alterar Entrega Automática');
            modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('valor').setLabel('Texto/link de entrega (deixe vazio para remover)').setStyle(TextInputStyle.Paragraph).setValue(p.auto_delivery || '').setRequired(false)));
            await interaction.showModal(modal);
            return;
        }

        // --- EXCLUIR PRODUTO ---
        if (action === 'delete') {
            client.db.db.prepare('DELETE FROM products WHERE id=?').run(productId);
            await interaction.update({ content: `🗑️ Produto **#${productId}** excluído!`, embeds: [], components: [] });
            return;
        }
    }
}

// ===================== MODAIS =====================
async function handleModals(interaction, client) {
    const id = interaction.customId;

    // --- CRIAR PAINEL ---
    if (id === 'modal_create_panel') {
        const title = interaction.fields.getTextInputValue('title');
        const desc = interaction.fields.getTextInputValue('desc');
        const banner = interaction.fields.getTextInputValue('banner');

        client.tempData.set(`${interaction.user.id}_panel`, { title, description: desc, banner });

        const channels = interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
        const options = channels.map(c => ({ label: c.name, value: c.id })).slice(0, 25);
        const sel = new StringSelectMenuBuilder().setCustomId('select_panel_channel').setPlaceholder('Escolha o canal para enviar').addOptions(options);
        
        await interaction.reply({ components: [new ActionRowBuilder().addComponents(sel)], ephemeral: true });
        return;
    }

    // --- EDITAR NOME PRODUTO ---
    if (id.startsWith('modal_edit_name_')) {
        const pid = parseInt(id.split('_')[3]);
        const valor = interaction.fields.getTextInputValue('valor');
        client.db.updateProduct(pid, { name: valor });
        await showEditPanel(interaction, client, pid);
        return;
    }

    // --- EDITAR DESCRIÇÃO ---
    if (id.startsWith('modal_edit_desc_')) {
        const pid = parseInt(id.split('_')[3]);
        const valor = interaction.fields.getTextInputValue('valor');
        client.db.updateProduct(pid, { description: valor });
        await showEditPanel(interaction, client, pid);
        return;
    }

    // --- EDITAR VALOR ---
    if (id.startsWith('modal_edit_price_')) {
        const pid = parseInt(id.split('_')[3]);
        const valor = parseFloat(interaction.fields.getTextInputValue('valor').replace(',', '.'));
        if (isNaN(valor)) return interaction.reply({ content: '❌ Valor inválido!', ephemeral: true });
        client.db.updateProduct(pid, { price: valor });
        await showEditPanel(interaction, client, pid);
        return;
    }

    // --- EDITAR ESTOQUE ---
    if (id.startsWith('modal_edit_stock_')) {
        const pid = parseInt(id.split('_')[3]);
        const valor = parseInt(interaction.fields.getTextInputValue('valor'));
        if (isNaN(valor) || valor < 0) return interaction.reply({ content: '❌ Quantidade inválida!', ephemeral: true });
        client.db.updateProduct(pid, { stock: valor });
        await showEditPanel(interaction, client, pid);
        return;
    }

    // --- EDITAR ENTREGA ---
    if (id.startsWith('modal_edit_delivery_')) {
        const pid = parseInt(id.split('_')[3]);
        const valor = interaction.fields.getTextInputValue('valor') || null;
        client.db.updateProduct(pid, { auto_delivery: valor });
        await showEditPanel(interaction, client, pid);
        return;
    }
}

// ===================== AUXILIAR: ATUALIZAR PAINEL CONFIG =====================
async function updateConfigPanel(interaction, client) {
    const g = interaction.guild;
    const logCh = await client.db.getConfig(g.id, 'log_channel_id');
    const fbCh = await client.db.getConfig(g.id, 'fb_channel_id');
    const cliRole = await client.db.getConfig(g.id, 'customer_role_id');
    const voiceCh = await client.db.getConfig(g.id, 'voice_channel_id');

    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('⚙️ PAINEL DE CONFIGURAÇÃO')
        .addFields(
            { name: '📊 Logs de Vendas', value: logCh ? `<#${logCh}> ✅` : '❌ Não configurado', inline: true },
            { name: '📱 Canal Facebook', value: fbCh ? `<#${fbCh}> ✅` : '❌ Não configurado', inline: true },
            { name: '👔 Cargo Cliente', value: cliRole ? `<@&${cliRole}> ✅` : '❌ Não configurado', inline: true },
            { name: '🔊 Canal de Voz', value: voiceCh ? `<#${voiceCh}> ✅` : '❌ Não conectado', inline: true }
        )
        .setFooter({ text: g.name })
        .setTimestamp();

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('cfg_logs').setLabel('Configurar Logs').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('cfg_facebook').setLabel('Configurar Facebook').setStyle(ButtonStyle.Primary)
    );
    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('cfg_role').setLabel('Configurar Cargo').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('cfg_voice').setLabel('Conectar Voz').setStyle(ButtonStyle.Success)
    );
    const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('cfg_panel').setLabel('Criar Painel Vendas').setStyle(ButtonStyle.Secondary)
    );

    await interaction.update({ embeds: [embed], components: [row1, row2, row3] });
}
