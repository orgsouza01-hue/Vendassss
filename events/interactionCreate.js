const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType, PermissionsBitField } = require('discord.js');
const QRCode = require('qrcode');
const moment = require('moment');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        try {
            // Comandos Slash
            if (interaction.isChatInputCommand()) {
                const command = client.commands.get(interaction.commandName);
                if (!command) return;
                try {
                    await command.execute(interaction, client);
                } catch (error) {
                    console.error(error);
                    await interaction.reply({ content: '❌ Ocorreu um erro ao executar este comando!', ephemeral: true }).catch(() => {});
                }
                return;
            }

            // Botões
            if (interaction.isButton()) {
                await handleButton(interaction, client);
                return;
            }

            // Menus de Seleção
            if (interaction.isStringSelectMenu()) {
                await handleSelectMenu(interaction, client);
                return;
            }

            // Modais
            if (interaction.isModalSubmit()) {
                await handleModal(interaction, client);
                return;
            }

        } catch (error) {
            console.error('Erro na interação:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ Ocorreu um erro!', ephemeral: true }).catch(() => {});
            }
        }
    }
};

// ===== MANIPULADORES =====

async function handleButton(interaction, client) {
    const customId = interaction.customId;
    const guildId = interaction.guild.id;

    // ===== PAINEL DE CONFIGURAÇÃO =====
    if (customId === 'config_logs') {
        const channels = interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
        const options = channels.map(c => ({ label: c.name, value: c.id })).slice(0, 25);
        
        const select = new StringSelectMenuBuilder()
            .setCustomId('select_log_channel')
            .setPlaceholder('Selecione o canal de logs...')
            .addOptions(options);
        
        const row = new ActionRowBuilder().addComponents(select);
        await interaction.reply({ content: '📊 Selecione o canal de logs de vendas:', components: [row], ephemeral: true });
        return;
    }

    if (customId === 'config_facebook') {
        const channels = interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
        const options = channels.map(c => ({ label: c.name, value: c.id })).slice(0, 25);
        
        const select = new StringSelectMenuBuilder()
            .setCustomId('select_facebook_channel')
            .setPlaceholder('Selecione o canal de Facebook...')
            .addOptions(options);
        
        const row = new ActionRowBuilder().addComponents(select);
        await interaction.reply({ content: '📱 Selecione o canal de Facebook:', components: [row], ephemeral: true });
        return;
    }

    if (customId === 'config_role') {
        const roles = interaction.guild.roles.cache.filter(r => !r.managed && r.id !== interaction.guild.id);
        const options = roles.map(r => ({ label: r.name, value: r.id })).slice(0, 25);
        
        const select = new StringSelectMenuBuilder()
            .setCustomId('select_client_role')
            .setPlaceholder('Selecione o cargo de cliente...')
            .addOptions(options);
        
        const row = new ActionRowBuilder().addComponents(select);
        await interaction.reply({ content: '👔 Selecione o cargo que será dado aos clientes:', components: [row], ephemeral: true });
        return;
    }

    if (customId === 'config_voice') {
        const channels = interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice);
        const options = channels.map(c => ({ label: c.name, value: c.id })).slice(0, 25);
        
        const select = new StringSelectMenuBuilder()
            .setCustomId('select_voice_channel')
            .setPlaceholder('Selecione o canal de voz...')
            .addOptions(options);
        
        const row = new ActionRowBuilder().addComponents(select);
        await interaction.reply({ content: '🔊 Selecione o canal de voz para o bot conectar:', components: [row], ephemeral: true });
        return;
    }

    if (customId === 'create_sales_panel') {
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('create_product')
                    .setLabel('Criar Produto')
                    .setEmoji('➕')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('send_panel')
                    .setLabel('Enviar Painel')
                    .setEmoji('📤')
                    .setStyle(ButtonStyle.Success)
            );

        await interaction.reply({ 
            content: '🛒 Escolha uma opção:', 
            components: [row], 
            ephemeral: true 
        });
        return;
    }

    // ===== CRIAR PRODUTO =====
    if (customId === 'create_product') {
        const modal = new ModalBuilder()
            .setCustomId('modal_create_product')
            .setTitle('Criar Novo Produto');

        const nameInput = new TextInputBuilder()
            .setCustomId('product_name')
            .setLabel('Nome do Produto')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const descInput = new TextInputBuilder()
            .setCustomId('product_desc')
            .setLabel('Descrição do Produto')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const priceInput = new TextInputBuilder()
            .setCustomId('product_price')
            .setLabel('Valor do Produto (ex: 29.90)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const stockInput = new TextInputBuilder()
            .setCustomId('product_stock')
            .setLabel('Quantidade em Stock (0 = infinito)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const deliveryInput = new TextInputBuilder()
            .setCustomId('product_delivery')
            .setLabel('Entrega Automática (opcional)')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false);

        modal.addComponents(
            new ActionRowBuilder().addComponents(nameInput),
            new ActionRowBuilder().addComponents(descInput),
            new ActionRowBuilder().addComponents(priceInput),
            new ActionRowBuilder().addComponents(stockInput),
            new ActionRowBuilder().addComponents(deliveryInput)
        );

        await interaction.showModal(modal);
        return;
    }

    // ===== ENVIAR PAINEL =====
    if (customId === 'send_panel') {
        const modal = new ModalBuilder()
            .setCustomId('modal_send_panel')
            .setTitle('Enviar Painel de Vendas');

        const titleInput = new TextInputBuilder()
            .setCustomId('panel_title')
            .setLabel('Título do Painel')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const descInput = new TextInputBuilder()
            .setCustomId('panel_desc')
            .setLabel('Descrição do Painel')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const bannerInput = new TextInputBuilder()
            .setCustomId('panel_banner')
            .setLabel('URL do Banner/GIF (.jpg, .png, .gif)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false);

        modal.addComponents(
            new ActionRowBuilder().addComponents(titleInput),
            new ActionRowBuilder().addComponents(descInput),
            new ActionRowBuilder().addComponents(bannerInput)
        );

        await interaction.showModal(modal);
        return;
    }

    // ===== VER OPÇÕES (CLIENTE) =====
    if (customId === 'ver_opcao') {
        const panelId = interaction.message.id;
        const products = await client.db.getProductsByPanel(guildId, panelId);
        
        if (products.length === 0) {
            await interaction.reply({ content: '❌ Nenhum produto disponível no momento!', ephemeral: true });
            return;
        }

        const options = products.map(p => ({
            label: p.name,
            description: `R$ ${p.price.toFixed(2)} | Stock: ${p.stock === 0 ? 'Infinito' : p.stock}`,
            value: `product_${p.id}`
        })).slice(0, 25);

        const select = new StringSelectMenuBuilder()
            .setCustomId('select_product_buy')
            .setPlaceholder('Selecione um produto...')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(select);
        await interaction.reply({ content: '🛒 Selecione o produto que deseja comprar:', components: [row], ephemeral: true });
        return;
    }

    // ===== TICKET DE COMPRA =====
    if (customId.startsWith('ticket_')) {
        const ticketData = client.activeTickets.get(interaction.channel.id);
        if (!ticketData) return;

        if (customId === 'ticket_change_qty') {
            const modal = new ModalBuilder()
                .setCustomId('modal_change_qty')
                .setTitle('Alterar Quantidade');

            const qtyInput = new TextInputBuilder()
                .setCustomId('quantity')
                .setLabel('Quantidade (2 a 100)')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(qtyInput));
            await interaction.showModal(modal);
            return;
        }

        if (customId === 'ticket_go_payment') {
            await showPaymentOptions(interaction, client, ticketData);
            return;
        }

        if (customId === 'ticket_coupon') {
            const modal = new ModalBuilder()
                .setCustomId('modal_apply_coupon')
                .setTitle('Aplicar Cupom');

            const couponInput = new TextInputBuilder()
                .setCustomId('coupon_name')
                .setLabel('Nome do Cupom')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(couponInput));
            await interaction.showModal(modal);
            return;
        }

        if (customId === 'ticket_cancel') {
            await interaction.reply({ content: '❌ Cancelando compra... Este canal será excluído em 2 segundos!' });
            client.activeTickets.delete(interaction.channel.id);
            setTimeout(() => interaction.channel.delete().catch(() => {}), 2000);
            return;
        }
    }

    // ===== PAGAMENTO =====
    if (customId.startsWith('pay_')) {
        const ticketData = client.activeTickets.get(interaction.channel.id);
        if (!ticketData) return;

        if (customId === 'pay_pix') {
            await showPixPayment(interaction, client, ticketData);
            return;
        }

        if (customId === 'pay_card' || customId === 'pay_btc' || customId === 'pay_boleto') {
            await interaction.reply({ content: '⚠️ Esta opção de pagamento estará disponível em breve!', ephemeral: true });
            return;
        }
    }

    // ===== AÇÕES DO PIX =====
    if (customId === 'pix_copy') {
        await interaction.reply({ content: `\`\`\`${process.env.PIX_CHAVE}\`\`\``, ephemeral: true });
        return;
    }

    if (customId === 'pix_confirm') {
        await confirmPayment(interaction, client);
        return;
    }

    // ===== COMPRA NOVAMENTE / COMPRA PRODUTO =====
    if (customId === 'buy_again' || customId === 'buy_product') {
        const productId = customId === 'buy_again' ? null : interaction.message.embeds[0]?.fields?.find(f => f.name === 'ID do Produto')?.value;
        
        if (customId === 'buy_again') {
            const embed = interaction.message.embeds[0];
            const productMatch = embed.description?.match(/Produto:\*\* (.+)/);
            if (productMatch) {
                const products = await client.db.getAllProducts();
                const product = products.find(p => p.name === productMatch[1].trim());
                if (product) {
                    await createPurchaseTicket(interaction, client, product, true);
                }
            }
        } else if (productId) {
            const product = await client.db.getProductById(parseInt(productId));
            if (product) {
                await createPurchaseTicket(interaction, client, product, true);
            }
        }
        return;
    }
}

async function handleSelectMenu(interaction, client) {
    const customId = interaction.customId;
    const guildId = interaction.guild.id;

    if (customId === 'select_log_channel') {
        const channelId = interaction.values[0];
        await client.db.setConfig(guildId, 'log_channel_id', channelId);
        client.configCache.set(`${guildId}_log_channel_id`, channelId);
        await updateConfigPanel(interaction, client);
        return;
    }

    if (customId === 'select_facebook_channel') {
        const channelId = interaction.values[0];
        await client.db.setConfig(guildId, 'facebook_channel_id', channelId);
        client.configCache.set(`${guildId}_facebook_channel_id`, channelId);
        await updateConfigPanel(interaction, client);
        return;
    }

    if (customId === 'select_client_role') {
        const roleId = interaction.values[0];
        await client.db.setConfig(guildId, 'client_role_id', roleId);
        client.configCache.set(`${guildId}_client_role_id`, roleId);
        await updateConfigPanel(interaction, client);
        return;
    }

    if (customId === 'select_voice_channel') {
        const channelId = interaction.values[0];
        const channel = interaction.guild.channels.cache.get(channelId);
        
        if (channel) {
            try {
                await channel.join();
                await client.db.setConfig(guildId, 'voice_channel_id', channelId);
                client.configCache.set(`${guildId}_voice_channel_id`, channelId);
            } catch (e) {
                await interaction.reply({ content: `❌ Não foi possível conectar: ${e.message}`, ephemeral: true });
                return;
            }
        }
        await updateConfigPanel(interaction, client);
        return;
    }

    if (customId === 'select_panel_channel') {
        const channelId = interaction.values[0];
        const pendingPanel = client.pendingPanel;
        
        if (!pendingPanel) {
            await interaction.reply({ content: '❌ Nenhum painel pendente!', ephemeral: true });
            return;
        }

        const channel = interaction.guild.channels.cache.get(channelId);
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setColor('#ff6600')
            .setTitle(pendingPanel.title)
            .setDescription(pendingPanel.description);

        if (pendingPanel.bannerUrl) {
            embed.setImage(pendingPanel.bannerUrl);
        }

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('ver_opcao')
                    .setLabel('Ver Opções')
                    .setEmoji('🛒')
                    .setStyle(ButtonStyle.Success)
            );

        const msg = await channel.send({ embeds: [embed], components: [row] });
        
        // Salvar painel no banco
        await client.db.addPanel({
            guildId: guildId,
            messageId: msg.id,
            channelId: channelId,
            title: pendingPanel.title,
            description: pendingPanel.description,
            bannerUrl: pendingPanel.bannerUrl
        });

        client.pendingPanel = null;
        await interaction.reply({ content: `✅ Painel enviado com sucesso para ${channel}!`, ephemeral: true });
        return;
    }

    if (customId === 'select_product_buy') {
        const productId = parseInt(interaction.values[0].replace('product_', ''));
        const product = await client.db.getProductById(productId);
        
        if (!product) {
            await interaction.reply({ content: '❌ Produto não encontrado!', ephemeral: true });
            return;
        }

        await createPurchaseTicket(interaction, client, product);
        return;
    }

    if (customId === 'select_reaction_emoji') {
        const emojiId = interaction.values[0];
        const emoji = interaction.guild.emojis.cache.get(emojiId);
        
        if (emoji) {
            await client.db.setReactionEmoji(guildId, emoji.toString());
            client.reactionEmoji = emoji.toString();
            await interaction.reply({ content: `✅ Emoji de reação configurado: ${emoji}`, ephemeral: true });
        }
        return;
    }
}

async function handleModal(interaction, client) {
    const customId = interaction.customId;
    const guildId = interaction.guild.id;

    if (customId === 'modal_create_product') {
        const name = interaction.fields.getTextInputValue('product_name');
        const description = interaction.fields.getTextInputValue('product_desc');
        const price = parseFloat(interaction.fields.getTextInputValue('product_price').replace(',', '.'));
        const stock = parseInt(interaction.fields.getTextInputValue('product_stock'));
        const autoDelivery = interaction.fields.getTextInputValue('product_delivery');

        if (isNaN(price)) {
            await interaction.reply({ content: '❌ Preço inválido!', ephemeral: true });
            return;
        }

        // Usar o último painel como referência ou "temp"
        const panelId = client.lastPanelId || 'temp';

        const productId = await client.db.addProduct(guildId, panelId, name, description, price, stock, autoDelivery);
        
        // Atualizar cache
        const guildProducts = client.productsCache.get(guildId) || [];
        guildProducts.push({ id: productId, guild_id: guildId, panel_id: panelId, name, description, price, stock, auto_delivery: autoDelivery });
        client.productsCache.set(guildId, guildProducts);

        await interaction.reply({ 
            content: `✅ Produto **${name}** criado com sucesso!\n💰 Preço: R$ ${price.toFixed(2)}\n📦 Stock: ${stock === 0 ? 'Infinito' : stock}`, 
            ephemeral: true 
        });
        return;
    }

    if (customId === 'modal_send_panel') {
        const title = interaction.fields.getTextInputValue('panel_title');
        const description = interaction.fields.getTextInputValue('panel_desc');
        const bannerUrl = interaction.fields.getTextInputValue('panel_banner');

        // Validar URL do banner
        let validBanner = null;
        if (bannerUrl) {
            const validExts = ['.jpg', '.jpeg', '.png', '.gif'];
            const isValid = validExts.some(ext => bannerUrl.toLowerCase().includes(ext));
            if (!isValid) {
                await interaction.reply({ content: '❌ URL de banner inválida! Use apenas .jpg, .png ou .gif', ephemeral: true });
                return;
            }
            validBanner = bannerUrl;
        }

        client.pendingPanel = { title, description, bannerUrl: validBanner };

        // Mostrar seleção de canal
        const channels = interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
        const options = channels.map(c => ({ label: c.name, value: c.id })).slice(0, 25);

        const select = new StringSelectMenuBuilder()
            .setCustomId('select_panel_channel')
            .setPlaceholder('Selecione o canal para enviar o painel...')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(select);
        await interaction.reply({ content: '📤 Selecione o canal onde o painel será enviado:', components: [row], ephemeral: true });
        return;
    }

    if (customId === 'modal_change_qty') {
        const qty = parseInt(interaction.fields.getTextInputValue('quantity'));
        const ticketData = client.activeTickets.get(interaction.channel.id);
        
        if (!ticketData) return;

        if (isNaN(qty) || qty < 2 || qty > 100) {
            await interaction.reply({ content: '❌ Quantidade inválida! Digite um número entre 2 e 100.', ephemeral: true });
            return;
        }

        const product = await client.db.getProductById(ticketData.productId);
        if (product.stock !== 0 && qty > product.stock) {
            await interaction.reply({ content: `❌ Stock insuficiente! Apenas ${product.stock} unidades disponíveis.`, ephemeral: true });
            return;
        }

        ticketData.quantity = qty;
        ticketData.totalPrice = product.price * qty;
        
        if (ticketData.couponDiscount) {
            ticketData.totalPrice = ticketData.totalPrice * (1 - ticketData.couponDiscount / 100);
        }

        await updateTicketPanel(interaction, client, ticketData);
        return;
    }

    if (customId === 'modal_apply_coupon') {
        const couponName = interaction.fields.getTextInputValue('coupon_name');
        const ticketData = client.activeTickets.get(interaction.channel.id);
        
        if (!ticketData) return;

        const coupon = await client.db.getCouponByName(guildId, couponName);
        
        if (!coupon) {
            await interaction.reply({ content: '❌ Cupom inválido ou não existe!', ephemeral: true });
            return;
        }

        // Verificar validade
        if (new Date(coupon.expires_at) < new Date()) {
            await interaction.reply({ content: '❌ Este cupom já expirou!', ephemeral: true });
            return;
        }

        const product = await client.db.getProductById(ticketData.productId);
        ticketData.couponDiscount = coupon.discount;
        ticketData.totalPrice = (product.price * ticketData.quantity) * (1 - coupon.discount / 100);

        await updateTicketPanel(interaction, client, ticketData, `✅ Cupom **${coupon.name}** aplicado! ${coupon.discount}% de desconto!`);
        return;
    }
}

// ===== FUNÇÕES AUXILIARES =====

async function updateConfigPanel(interaction, client) {
    const guildId = interaction.guild.id;

    const logChannel = client.configCache.get(`${guildId}_log_channel_id`);
    const fbChannel = client.configCache.get(`${guildId}_facebook_channel_id`);
    const clientRole = client.configCache.get(`${guildId}_client_role_id`);
    const voiceChannel = client.configCache.get(`${guildId}_voice_channel_id`);

    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('⚙️ PAINEL DE CONFIGURAÇÃO DE VENDAS')
        .setDescription('Configure todas as opções do sistema de vendas abaixo:')
        .addFields(
            { name: '📊 Canal de Logs', value: logChannel ? `<#${logChannel}> ✅` : '❌ Não configurado', inline: true },
            { name: '📱 Canal de Facebook', value: fbChannel ? `<#${fbChannel}> ✅` : '❌ Não configurado', inline: true },
            { name: '👔 Cargo de Cliente', value: clientRole ? `<@&${clientRole}> ✅` : '❌ Não configurado', inline: true },
            { name: '🔊 Canal de Voz', value: voiceChannel ? `<#${voiceChannel}> ✅` : '❌ Não conectado', inline: true }
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

    await interaction.update({ embeds: [embed], components: [row1, row2, row3] });
}

async function createPurchaseTicket(interaction, client, product, fromDm = false) {
    const guildId = product.guild_id;
    const guild = client.guilds.cache.get(guildId);
    
    if (!guild) return;

    // Verificar stock
    if (product.stock !== 0 && product.stock < 1) {
        if (fromDm) {
            await interaction.reply({ content: '❌ Este produto está sem stock no momento!' });
        } else {
            await interaction.reply({ content: '❌ Este produto está sem stock no momento!', ephemeral: true });
        }
        return;
    }

    const member = fromDm ? await guild.members.fetch(interaction.user.id).catch(() => null) : interaction.member;
    
    if (!member) {
        await interaction.reply({ content: '❌ Não foi possível encontrar seu membro no servidor!' });
        return;
    }

    // Criar canal privado
    const ticketChannel = await guild.channels.create({
        name: `compra-${member.user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
            {
                id: guild.id,
                deny: [PermissionsBitField.Flags.ViewChannel]
            },
            {
                id: member.id,
                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory]
            },
            {
                id: client.user.id,
                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageChannels]
            }
        ]
    });

    // Adicionar cargo de admin se configurado
    const adminRoleId = process.env.ADMIN_ROLE_ID;
    if (adminRoleId) {
        await ticketChannel.permissionOverwrites.edit(adminRoleId, {
            ViewChannel: true,
            SendMessages: true
        }).catch(() => {});
    }

    const ticketData = {
        userId: member.id,
        productId: product.id,
        productName: product.name,
        productDesc: product.description,
        productPrice: product.price,
        autoDelivery: product.auto_delivery,
        quantity: 1,
        totalPrice: product.price,
        couponDiscount: null,
        channelId: ticketChannel.id
    };

    client.activeTickets.set(ticketChannel.id, ticketData);

    const embed = new EmbedBuilder()
        .setColor('#ff6600')
        .setTitle(`🛒 ${product.name}`)
        .setDescription(product.description)
        .addFields(
            { name: '💰 Valor Unitário', value: `R$ ${product.price.toFixed(2)}`, inline: true },
            { name: '📦 Quantidade', value: '1', inline: true },
            { name: '💵 Total', value: `R$ ${product.price.toFixed(2)}`, inline: true },
            { name: '📦 Stock', value: product.stock === 0 ? '♾️ Infinito' : `${product.stock} unidades`, inline: true }
        )
        .setFooter({ text: `${guild.name} - Sistema de Vendas` })
        .setTimestamp();

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('ticket_change_qty')
                .setLabel('Alterar Quantidade')
                .setEmoji('🔢')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('ticket_go_payment')
                .setLabel('Ir para Pagamento')
                .setEmoji('💳')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('ticket_coupon')
                .setLabel('Aplicar Cupom')
                .setEmoji('🎟️')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('ticket_cancel')
                .setLabel('Cancelar')
                .setEmoji('❌')
                .setStyle(ButtonStyle.Danger)
        );

    await ticketChannel.send({ content: `${member}`, embeds: [embed], components: [row] });

    if (fromDm) {
        await interaction.reply({ content: `✅ Canal de compra criado: ${ticketChannel}` });
    } else {
        await interaction.reply({ content: `✅ Canal de compra criado: ${ticketChannel}`, ephemeral: true });
    }
}

async function updateTicketPanel(interaction, client, ticketData, extraMessage = '') {
    const product = await client.db.getProductById(ticketData.productId);
    
    const embed = new EmbedBuilder()
        .setColor('#ff6600')
        .setTitle(`🛒 ${product.name}`)
        .setDescription(product.description)
        .addFields(
            { name: '💰 Valor Unitário', value: `R$ ${product.price.toFixed(2)}`, inline: true },
            { name: '📦 Quantidade', value: `${ticketData.quantity}`, inline: true },
            { name: '💵 Total', value: `R$ ${ticketData.totalPrice.toFixed(2)}`, inline: true },
            { name: '📦 Stock', value: product.stock === 0 ? '♾️ Infinito' : `${product.stock} unidades`, inline: true }
        );

    if (ticketData.couponDiscount) {
        embed.addFields({ name: '🎟️ Cupom Aplicado', value: `${ticketData.couponDiscount}% OFF`, inline: true });
    }

    embed.setFooter({ text: `${interaction.guild.name} - Sistema de Vendas` })
         .setTimestamp();

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('ticket_change_qty')
                .setLabel('Alterar Quantidade')
                .setEmoji('🔢')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('ticket_go_payment')
                .setLabel('Ir para Pagamento')
                .setEmoji('💳')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('ticket_coupon')
                .setLabel('Aplicar Cupom')
                .setEmoji('🎟️')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('ticket_cancel')
                .setLabel('Cancelar')
                .setEmoji('❌')
                .setStyle(ButtonStyle.Danger)
        );

    const content = extraMessage ? `${extraMessage}\n<@${ticketData.userId}>` : `<@${ticketData.userId}>`;
    await interaction.update({ content, embeds: [embed], components: [row] });
}

async function showPaymentOptions(interaction, client, ticketData) {
    const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('💳 SELECIONE O MÉTODO DE PAGAMENTO')
        .setDescription(`Total a pagar: **R$ ${ticketData.totalPrice.toFixed(2)}**`)
        .addFields(
            { name: 'Pix', value: '✅ Disponível', inline: true },
            { name: 'Cartão', value: '⏳ Em breve', inline: true },
            { name: 'Bitcoin', value: '⏳ Em breve', inline: true },
            { name: 'Boleto', value: '⏳ Em breve', inline: true }
        )
        .setFooter({ text: `${interaction.guild.name} - Pagamento` })
        .setTimestamp();

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('pay_pix')
                .setLabel('Pix')
                .setEmoji('📱')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('pay_card')
                .setLabel('Cartão')
                .setEmoji('💳')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('pay_btc')
                .setLabel('Bitcoin')
                .setEmoji('₿')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('pay_boleto')
                .setLabel('Boleto')
                .setEmoji('📄')
                .setStyle(ButtonStyle.Secondary)
        );

    await interaction.update({ embeds: [embed], components: [row] });
}

async function showPixPayment(interaction, client, ticketData) {
    // Gerar QR Code Pix
    const pixData = `00020126360014BR.GOV.BCB.PIX0114${process.env.PIX_CHAVE}5204000053039865802BR5925${process.env.PIX_NOME || 'VENDEDOR'}6009${process.env.PIX_CIDADE || 'SAO PAULO'}62070503***6304`;
    
    let qrCodeUrl;
    try {
        qrCodeUrl = await QRCode.toDataURL(pixData);
    } catch (e) {
        qrCodeUrl = null;
    }

    const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('📱 PAGAMENTO VIA PIX')
        .setDescription(`Escaneie o QR Code ou use a chave Pix abaixo:\n\n**Chave Pix:** \`${process.env.PIX_CHAVE}\`\n\n**Valor:** R$ ${ticketData.totalPrice.toFixed(2)}`)
        .setFooter({ text: `${interaction.guild.name} - Pagamento Pix` })
        .setTimestamp();

    if (qrCodeUrl) {
        embed.setThumbnail(qrCodeUrl);
    }

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('pix_copy')
                .setLabel('Copiar e Colar')
                .setEmoji('📋')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('pix_confirm')
                .setLabel('Confirmar Pagamento')
                .setEmoji('✅')
                .setStyle(ButtonStyle.Success)
        );

    await interaction.update({ embeds: [embed], components: [row] });
}

async function confirmPayment(interaction, client) {
    const ticketData = client.activeTickets.get(interaction.channel.id);
    if (!ticketData) return;

    // Verificar se é admin
    const adminRoleId = process.env.ADMIN_ROLE_ID;
    const isAdmin = adminRoleId && interaction.member.roles.cache.has(adminRoleId);

    if (!isAdmin) {
        await interaction.reply({ content: '❌ Apenas administradores podem confirmar pagamentos!', ephemeral: true });
        return;
    }

    const guildId = interaction.guild.id;
    const member = await interaction.guild.members.fetch(ticketData.userId).catch(() => null);
    const product = await client.db.getProductById(ticketData.productId);

    // Atualizar stock
    if (product.stock !== 0) {
        const newStock = product.stock - ticketData.quantity;
        await client.db.updateProductStock(product.id, Math.max(0, newStock));
    }

    // Registrar venda
    await client.db.addSale({
        guildId: guildId,
        userId: ticketData.userId,
        username: member?.user?.username || 'Desconhecido',
        productId: product.id,
        productName: product.name,
        quantity: ticketData.quantity,
        totalPrice: ticketData.totalPrice,
        paymentMethod: 'Pix',
        status: 'paid'
    });

    // Renomear canal
    await interaction.channel.setName(`pago-${ticketData.totalPrice.toFixed(2).replace('.', '-')}`).catch(() => {});

    // Enviar DM para o cliente
    if (member) {
        const dmEmbed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('✅ COMPRA CONFIRMADA!')
            .setDescription(`**Produto:** ${product.name}\n**Descrição:** ${product.description}\n**Quantidade:** ${ticketData.quantity}\n**Valor Total:** R$ ${ticketData.totalPrice.toFixed(2)}\n**Método:** Pix\n\n${ticketData.autoDelivery ? `**Entrega Automática:**\n${ticketData.autoDelivery}` : 'Seu produto será entregue em breve!'}`)
            .setFooter({ text: `${interaction.guild.name} - Obrigado pela compra!` })
            .setTimestamp();

        const buyAgainRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('buy_again')
                    .setLabel('Comprar Novamente')
                    .setEmoji('🔄')
                    .setStyle(ButtonStyle.Primary)
            );

        await member.send({ embeds: [dmEmbed], components: [buyAgainRow] }).catch(() => {});

        // Dar cargo de cliente
        const clientRoleId = client.configCache.get(`${guildId}_client_role_id`);
        if (clientRoleId) {
            await member.roles.add(clientRoleId).catch(() => {});
        }
    }

    // Enviar log de vendas
    const logChannelId = client.configCache.get(`${guildId}_log_channel_id`);
    if (logChannelId) {
        const logChannel = interaction.guild.channels.cache.get(logChannelId);
        if (logChannel) {
            const logEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('💰 NOVA VENDA REALIZADA!')
                .addFields(
                    { name: '👤 Cliente', value: `${member} (${member?.user?.username || 'Desconhecido'})`, inline: true },
                    { name: '📦 Produto', value: product.name, inline: true },
                    { name: '📝 Descrição', value: product.description.substring(0, 100), inline: true },
                    { name: '💰 Valor', value: `R$ ${ticketData.totalPrice.toFixed(2)}`, inline: true },
                    { name: '💳 Método', value: 'Pix', inline: true },
                    { name: '⏰ Hora', value: moment().format('DD/MM/YYYY HH:mm:ss'), inline: true },
                    { name: 'ID do Produto', value: `${product.id}`, inline: true }
                )
                .setFooter({ text: `${interaction.guild.name} - Log de Vendas` })
                .setTimestamp();

            const buyRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('buy_product')
                        .setLabel('Comprar Produto')
                        .setEmoji('🛒')
                        .setStyle(ButtonStyle.Success)
                );

            await logChannel.send({ embeds: [logEmbed], components: [buyRow] });
        }
    }

    // Processar canal de Facebook
    const fbChannelId = client.configCache.get(`${guildId}_facebook_channel_id`);
    if (fbChannelId && member) {
        const fbChannel = interaction.guild.channels.cache.get(fbChannelId);
        if (fbChannel) {
            // Liberar permissão para o membro
            await fbChannel.permissionOverwrites.edit(member.id, {
                ViewChannel: true,
                SendMessages: true
            }).catch(() => {});

            // Marcar o membro
            const mentionMsg = await fbChannel.send(`${member} você já pode enviar sua avaliação!`).catch(() => null);
            
            // Apagar a mensagem de marcação após 3 segundos
            if (mentionMsg) {
                setTimeout(() => mentionMsg.delete().catch(() => {}), 3000);
            }

            // Esperar pela mensagem do usuário e reagir
            const filter = m => m.author.id === member.id;
            const collector = fbChannel.createMessageCollector({ filter, max: 1, time: 300000 }); // 5 minutos

            collector.on('collect', async (msg) => {
                // Reagir com emoji configurado
                const emojiData = await client.db.getReactionEmojiByGuild(guildId);
                const emoji = emojiData?.emoji || '👍';
                await msg.react(emoji).catch(() => {});

                // Trancar canal novamente para o membro
                await fbChannel.permissionOverwrites.edit(member.id, {
                    SendMessages: false
                }).catch(() => {});
            });
        }
    }

    client.activeTickets.delete(interaction.channel.id);
    
    await interaction.reply({ 
        content: `✅ Pagamento confirmado!\n📦 Produto: **${product.name}**\n💰 Valor: **R$ ${ticketData.totalPrice.toFixed(2)}**\n👤 Cliente: ${member}\n\nA DM foi enviada e o cargo foi aplicado!` 
    });
}
