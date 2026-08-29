const { ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const { showEditPanel } = require('../commands/edita');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        try {
            if (interaction.isChatInputCommand()) {
                const cmd = client.commands.get(interaction.commandName);
                if (cmd) await cmd.execute(interaction, client);
                return;
            }
            if (interaction.isStringSelectMenu()) { await handleSelect(interaction, client); return; }
            if (interaction.isButton()) { await handleButtons(interaction, client); return; }
            if (interaction.isModalSubmit()) { await handleModals(interaction, client); return; }
        } catch (err) {
            console.error('❌ Erro:', err);
            if (!interaction.replied && !interaction.deferred) {
                interaction.reply({ content: `❌ Erro: ${err.message}`, ephemeral: true }).catch(() => {});
            }
        }
    }
};

// ===================== SELECT MENUS =====================
async function handleSelect(interaction, client) {
    const id = interaction.customId;
    const g = interaction.guild;

    if (id === 'select_log_channel') { client.db.setConfig(g.id, 'log_channel_id', interaction.values[0]); await updatePanel(interaction, client); return; }
    if (id === 'select_facebook_channel') { client.db.setConfig(g.id, 'fb_channel_id', interaction.values[0]); await updatePanel(interaction, client); return; }
    if (id === 'select_client_role') { client.db.setConfig(g.id, 'customer_role_id', interaction.values[0]); await updatePanel(interaction, client); return; }
    if (id === 'select_voice_channel') {
        const chId = interaction.values[0];
        client.db.setConfig(g.id, 'voice_channel_id', chId);
        try {
            const ch = g.channels.cache.get(chId);
            if (ch) joinVoiceChannel({ channelId: ch.id, guildId: g.id, adapterCreator: g.voiceAdapterCreator, selfDeaf: false, selfMute: false });
        } catch (e) {}
        await updatePanel(interaction, client);
        return;
    }

    if (id === 'select_panel_channel') {
        const data = client.temp.get(`panel_${interaction.user.id}`);
        if (!data) return interaction.update({ content: '❌ Sessão expirada!', components: [] });
        const ch = g.channels.cache.get(interaction.values[0]);
        if (!ch) return;

        const embed = new EmbedBuilder().setColor('#ff6600').setTitle(data.title).setDescription(data.description);
        if (data.banner) embed.setImage(data.banner);
        const btn = new ButtonBuilder().setCustomId('btn_ver_opcoes').setLabel('🛒 Ver Opções').setStyle(ButtonStyle.Success);
        const msg = await ch.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(btn)] });
        client.db.addPanel({ guildId: g.id, messageId: msg.id, channelId: ch.id, title: data.title, description: data.description, bannerUrl: data.banner });
        client.temp.delete(`panel_${interaction.user.id}`);
        await interaction.update({ content: `✅ Painel enviado para ${ch}!`, components: [] });
        return;
    }

    if (id === 'select_edit_product') {
        const pid = parseInt(interaction.values[0].replace('edit_', ''));
        await showEditPanel(interaction, client, pid);
        return;
    }

    if (id === 'select_reaction') {
        const emoji = g.emojis.cache.get(interaction.values[0]);
        if (emoji) { client.db.setReaction(g.id, emoji.toString()); await interaction.reply({ content: `✅ Emoji: ${emoji}`, ephemeral: true }); }
        return;
    }
}

// ===================== BOTÕES =====================
async function handleButtons(interaction, client) {
    const id = interaction.customId;
    const g = interaction.guild;

    // ======= CONFIGURAÇÕES =======
    if (id === 'cfg_logs') {
        const chs = g.channels.cache.filter(c => c.type === ChannelType.GuildText);
        const opts = chs.map(c => ({ label: c.name, value: c.id })).slice(0, 25);
        const sel = new StringSelectMenuBuilder().setCustomId('select_log_channel').setPlaceholder('Canal de logs').addOptions(opts);
        await interaction.reply({ components: [new ActionRowBuilder().addComponents(sel)], ephemeral: true });
        return;
    }
    if (id === 'cfg_facebook') {
        const chs = g.channels.cache.filter(c => c.type === ChannelType.GuildText);
        const opts = chs.map(c => ({ label: c.name, value: c.id })).slice(0, 25);
        const sel = new StringSelectMenuBuilder().setCustomId('select_facebook_channel').setPlaceholder('Canal Facebook').addOptions(opts);
        await interaction.reply({ components: [new ActionRowBuilder().addComponents(sel)], ephemeral: true });
        return;
    }
    if (id === 'cfg_role') {
        const roles = g.roles.cache.filter(r => !r.managed && r.id !== g.id);
        const opts = roles.map(r => ({ label: r.name, value: r.id })).slice(0, 25);
        const sel = new StringSelectMenuBuilder().setCustomId('select_client_role').setPlaceholder('Cargo cliente').addOptions(opts);
        await interaction.reply({ components: [new ActionRowBuilder().addComponents(sel)], ephemeral: true });
        return;
    }
    if (id === 'cfg_voice') {
        const chs = g.channels.cache.filter(c => c.type === ChannelType.GuildVoice);
        const opts = chs.map(c => ({ label: c.name, value: c.id })).slice(0, 25);
        const sel = new StringSelectMenuBuilder().setCustomId('select_voice_channel').setPlaceholder('Canal de voz').addOptions(opts);
        await interaction.reply({ components: [new ActionRowBuilder().addComponents(sel)], ephemeral: true });
        return;
    }

    // ============================================================
    // 🔥 SISTEMA ANTIGO: CRIAR PAINEL VENDAS → 2 BOTÕES
    // ============================================================
    if (id === 'cfg_panel') {
        const row = new ActionRowBuilder().addComponents(
            client.assets.apply(new ButtonBuilder().setCustomId('btn_criar_produto').setLabel('➕ Criar Produto').setStyle(ButtonStyle.Primary), 'criar_produto'),
            client.assets.apply(new ButtonBuilder().setCustomId('btn_enviar_painel').setLabel('📤 Enviar Painel').setStyle(ButtonStyle.Success), 'enviar_painel')
        );
        await interaction.reply({ content: '🛒 Escolha uma opção:', components: [row], ephemeral: true });
        return;
    }

    // 🔥 BOTÃO 1: CRIAR PRODUTO → ABRE MODAL
    if (id === 'btn_criar_produto') {
        const modal = new ModalBuilder().setCustomId('modal_criar_produto').setTitle('➕ Criar Novo Produto');
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('nome').setLabel('Nome do Produto').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('descricao').setLabel('Descrição').setStyle(TextInputStyle.Paragraph).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('valor').setLabel('Valor (ex: 29.90)').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('estoque').setLabel('Estoque (0 = infinito)').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('entrega').setLabel('Entrega Automática (opcional)').setStyle(TextInputStyle.Paragraph).setRequired(false))
        );
        await interaction.showModal(modal);
        return;
    }

    // 🔥 BOTÃO 2: ENVIAR PAINEL → ABRE MODAL
    if (id === 'btn_enviar_painel') {
        const modal = new ModalBuilder().setCustomId('modal_enviar_painel').setTitle('📤 Enviar Painel de Vendas');
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('titulo').setLabel('Título do Painel').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('descricao').setLabel('Descrição').setStyle(TextInputStyle.Paragraph).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('banner').setLabel('URL Banner (.jpg/.png/.gif)').setStyle(TextInputStyle.Short).setRequired(false))
        );
        await interaction.showModal(modal);
        return;
    }

    // ======= EDITAR PRODUTO (/edita) =======
    if (id.startsWith('edit_')) {
        const parts = id.split('_');
        const action = parts[1];
        const pid = parseInt(parts[2]);
        const p = client.db.getProductById(pid);
        if (!p) return interaction.reply({ content: '❌ Produto não existe!', ephemeral: true });

        if (action === 'name') {
            const m = new ModalBuilder().setCustomId(`modal_edit_name_${pid}`).setTitle('Alterar Nome');
            m.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('v').setLabel('Novo nome').setStyle(TextInputStyle.Short).setValue(p.name).setRequired(true)));
            await interaction.showModal(m); return;
        }
        if (action === 'desc') {
            const m = new ModalBuilder().setCustomId(`modal_edit_desc_${pid}`).setTitle('Alterar Descrição');
            m.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('v').setLabel('Nova descrição').setStyle(TextInputStyle.Paragraph).setValue(p.description).setRequired(true)));
            await interaction.showModal(m); return;
        }
        if (action === 'price') {
            const m = new ModalBuilder().setCustomId(`modal_edit_price_${pid}`).setTitle('Alterar Valor');
            m.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('v').setLabel('Novo valor').setStyle(TextInputStyle.Short).setValue(String(p.price)).setRequired(true)));
            await interaction.showModal(m); return;
        }
        if (action === 'stock') {
            const m = new ModalBuilder().setCustomId(`modal_edit_stock_${pid}`).setTitle('Alterar Estoque');
            m.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('v').setLabel('Nova quantidade').setStyle(TextInputStyle.Short).setValue(String(p.stock)).setRequired(true)));
            await interaction.showModal(m); return;
        }
        if (action === 'delivery') {
            const m = new ModalBuilder().setCustomId(`modal_edit_delivery_${pid}`).setTitle('Alterar Entrega');
            m.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('v').setLabel('Entrega (vazio = remover)').setStyle(TextInputStyle.Paragraph).setValue(p.auto_delivery || '').setRequired(false)));
            await interaction.showModal(m); return;
        }
        if (action === 'delete') {
            client.db.db.prepare('DELETE FROM products WHERE id=?').run(pid);
            await interaction.update({ content: `🗑️ Produto #${pid} excluído!`, embeds: [], components: [] });
            return;
        }
    }
}

// ===================== MODAIS =====================
async function handleModals(interaction, client) {
    const id = interaction.customId;

    // 🔥 MODAL CRIAR PRODUTO
    if (id === 'modal_criar_produto') {
        const nome = interaction.fields.getTextInputValue('nome');
        const desc = interaction.fields.getTextInputValue('descricao');
        const valor = parseFloat(interaction.fields.getTextInputValue('valor').replace(',', '.'));
        const estoque = parseInt(interaction.fields.getTextInputValue('estoque'));
        const entrega = interaction.fields.getTextInputValue('entrega') || null;

        if (isNaN(valor)) return interaction.reply({ content: '❌ Valor inválido!', ephemeral: true });
        if (isNaN(estoque) || estoque < 0) return interaction.reply({ content: '❌ Estoque inválido!', ephemeral: true });

        const pid = client.db.addProduct(interaction.guild.id, 'painel-padrao', nome, desc, valor, estoque, entrega);
        if (!pid) return interaction.reply({ content: '❌ Erro ao salvar!', ephemeral: true });

        console.log(`📦 Produto #${pid} criado: ${nome} | R$${valor}`);
        await interaction.reply({ 
            content: `✅ **PRODUTO CRIADO!**\n🆔 #${pid}\n📦 ${nome}\n💰 R$ ${valor.toFixed(2)}\n📊 Estoque: ${estoque === 0 ? '♾️ Infinito' : estoque}`, 
            ephemeral: true 
        });
        return;
    }

    // 🔥 MODAL ENVIAR PAINEL
    if (id === 'modal_enviar_painel') {
        const titulo = interaction.fields.getTextInputValue('titulo');
        const desc = interaction.fields.getTextInputValue('descricao');
        const banner = interaction.fields.getTextInputValue('banner');

        client.temp.set(`panel_${interaction.user.id}`, { title: titulo, description: desc, banner });

        const chs = interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
        const opts = chs.map(c => ({ label: c.name, value: c.id })).slice(0, 25);
        const sel = new StringSelectMenuBuilder().setCustomId('select_panel_channel').setPlaceholder('Escolha o canal').addOptions(opts);
        await interaction.reply({ components: [new ActionRowBuilder().addComponents(sel)], ephemeral: true });
        return;
    }

    // ======= EDITAR PRODUTO =======
    if (id.startsWith('modal_edit_name_')) {
        const pid = parseInt(id.split('_')[3]);
        client.db.updateProduct(pid, { name: interaction.fields.getTextInputValue('v') });
        await showEditPanel(interaction, client, pid); return;
    }
    if (id.startsWith('modal_edit_desc_')) {
        const pid = parseInt(id.split('_')[3]);
        client.db.updateProduct(pid, { description: interaction.fields.getTextInputValue('v') });
        await showEditPanel(interaction, client, pid); return;
    }
    if (id.startsWith('modal_edit_price_')) {
        const pid = parseInt(id.split('_')[3]);
        const v = parseFloat(interaction.fields.getTextInputValue('v').replace(',', '.'));
        if (isNaN(v)) return interaction.reply({ content: '❌ Valor inválido!', ephemeral: true });
        client.db.updateProduct(pid, { price: v });
        await showEditPanel(interaction, client, pid); return;
    }
    if (id.startsWith('modal_edit_stock_')) {
        const pid = parseInt(id.split('_')[3]);
        const v = parseInt(interaction.fields.getTextInputValue('v'));
        if (isNaN(v) || v < 0) return interaction.reply({ content: '❌ Quantidade inválida!', ephemeral: true });
        client.db.updateProduct(pid, { stock: v });
        await showEditPanel(interaction, client, pid); return;
    }
    if (id.startsWith('modal_edit_delivery_')) {
        const pid = parseInt(id.split('_')[3]);
        const v = interaction.fields.getTextInputValue('v') || null;
        client.db.updateProduct(pid, { auto_delivery: v });
        await showEditPanel(interaction, client, pid); return;
    }
}

// ===================== ATUALIZAR PAINEL CONFIG =====================
async function updatePanel(interaction, client) {
    const g = interaction.guild;
    const logCh = await client.db.getConfig(g.id, 'log_channel_id');
    const fbCh = await client.db.getConfig(g.id, 'fb_channel_id');
    const cliRole = await client.db.getConfig(g.id, 'customer_role_id');
    const voiceCh = await client.db.getConfig(g.id, 'voice_channel_id');

    const embed = new EmbedBuilder().setColor('#0099ff').setTitle('⚙️ PAINEL DE CONFIGURAÇÃO').addFields(
        { name: '📊 Logs de Vendas', value: logCh ? `<#${logCh}> ✅` : '❌ Não configurado', inline: true },
        { name: '📱 Canal Facebook', value: fbCh ? `<#${fbCh}> ✅` : '❌ Não configurado', inline: true },
        { name: '👔 Cargo Cliente', value: cliRole ? `<@&${cliRole}> ✅` : '❌ Não configurado', inline: true },
        { name: '🔊 Canal de Voz', value: voiceCh ? `<#${voiceCh}> ✅` : '❌ Não conectado', inline: true }
    ).setFooter({ text: g.name }).setTimestamp();

    const r1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('cfg_logs').setLabel('Configurar Logs').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('cfg_facebook').setLabel('Configurar Facebook').setStyle(ButtonStyle.Primary)
    );
    const r2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('cfg_role').setLabel('Configurar Cargo').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('cfg_voice').setLabel('Conectar Voz').setStyle(ButtonStyle.Success)
    );
    const r3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('cfg_panel').setLabel('Criar Painel Vendas').setStyle(ButtonStyle.Secondary)
    );

    await interaction.update({ embeds: [embed], components: [r1, r2, r3] });
}
