require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');
const Database = require('./database/database');
const WebServer = require('./web/server');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel, Partials.Message]
});

client.commands = new Collection();
client.db = new Database();
client.configCache = new Map();
client.productsCache = new Map();
client.couponsCache = new Map();
client.activeTickets = new Map();
client.feedbackMessages = new Map();
client.reactionEmoji = null;

// Carregar configurações do banco em cache
async function loadCache() {
    const configs = await client.db.getAllConfigs();
    configs.forEach(c => {
        client.configCache.set(`${c.guild_id}_${c.key}`, c.value);
    });

    const products = await client.db.getAllProducts();
    products.forEach(p => {
        const guildProducts = client.productsCache.get(p.guild_id) || [];
        guildProducts.push(p);
        client.productsCache.set(p.guild_id, guildProducts);
    });

    const coupons = await client.db.getAllCoupons();
    coupons.forEach(c => {
        const guildCoupons = client.couponsCache.get(c.guild_id) || new Map();
        guildCoupons.set(c.name.toLowerCase(), c);
        client.couponsCache.set(c.guild_id, guildCoupons);
    });

    const emoji = await client.db.getReactionEmoji();
    if (emoji) client.reactionEmoji = emoji.emoji;
}

// Carregar comandos
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    }
}

// Carregar eventos
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

// Inicializar banco e carregar cache
client.db.init().then(async () => {
    await loadCache();
    console.log('Banco de dados inicializado e cache carregado!');
}).catch(err => {
    console.error('Erro ao inicializar banco:', err);
});

// Iniciar servidor web
const webServer = new WebServer(client);
webServer.start();

// Reconectar ao canal de voz após reinício
client.on('ready', async () => {
    console.log(`Bot conectado como ${client.user.tag}!`);
    
    // Reconectar em canais de voz configurados
    const configs = await client.db.getAllConfigs();
    const voiceConfigs = configs.filter(c => c.key === 'voice_channel_id');
    
    for (const vc of voiceConfigs) {
        try {
            const guild = client.guilds.cache.get(vc.guild_id);
            if (guild) {
                const channel = guild.channels.cache.get(vc.value);
                if (channel && channel.type === ChannelType.GuildVoice) {
                    await channel.join().catch(() => {});
                    console.log(`Reconectado ao canal de voz em ${guild.name}`);
                }
            }
        } catch (e) {
            console.log('Não foi possível reconectar ao canal de voz:', e.message);
        }
    }

    // Iniciar sistema de mensagens automáticas do Facebook
    startFacebookAutoMessages();
});

// Sistema de mensagens automáticas do Facebook (a cada 10 segundos)
async function startFacebookAutoMessages() {
    setInterval(async () => {
        const configs = await client.db.getAllConfigs();
        const fbConfigs = configs.filter(c => c.key === 'facebook_channel_id');
        
        for (const fb of fbConfigs) {
            try {
                const guild = client.guilds.cache.get(fb.guild_id);
                if (!guild) continue;
                
                const channel = guild.channels.cache.get(fb.value);
                if (!channel) continue;

                // Apagar mensagem antiga se existir
                const oldMsgId = client.feedbackMessages.get(fb.guild_id);
                if (oldMsgId) {
                    try {
                        const oldMsg = await channel.messages.fetch(oldMsgId).catch(() => null);
                        if (oldMsg) await oldMsg.delete().catch(() => {});
                    } catch (e) {}
                }

                const embed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('📋 REGRAS PARA TER GARANTIA')
                    .setDescription(`**Após a compra do produto:**\n\n1️⃣ Envie uma imagem mostrando o produto entregue\n2️⃣ Deixe uma avaliação honesta sobre sua experiência\n3️⃣ Seguindo esses passos você garante sua garantia total!\n\n⚠️ **Aviso:** Não envie mensagens de spam neste canal.`)
                    .setFooter({ text: `${guild.name} - Sistema de Vendas` })
                    .setTimestamp();

                const msg = await channel.send({ embeds: [embed] });
                client.feedbackMessages.set(fb.guild_id, msg.id);
            } catch (e) {
                console.log('Erro na mensagem automática do Facebook:', e.message);
            }
        }
    }, 10000);
}

// Manter conexão de voz
client.on('voiceStateUpdate', async (oldState, newState) => {
    if (newState.member.id === client.user.id) return;
    
    const guildId = oldState.guild.id;
    const voiceChannelId = client.configCache.get(`${guildId}_voice_channel_id`);
    
    if (voiceChannelId) {
        const botState = oldState.guild.voiceStates.cache.get(client.user.id);
        if (!botState || botState.channelId !== voiceChannelId) {
            try {
                const channel = oldState.guild.channels.cache.get(voiceChannelId);
                if (channel) await channel.join().catch(() => {});
            } catch (e) {}
        }
    }
});

client.login(process.env.TOKEN).catch(err => {
    console.error('Erro ao fazer login:', err);
});

module.exports = client;
