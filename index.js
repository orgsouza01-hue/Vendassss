require('dotenv').config();
const { Client, GatewayIntentBits, Partials, ChannelType } = require('discord.js');
const { joinVoiceChannel, VoiceConnectionStatus, entersState } = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');
const Database = require('./database/database');
const ButtonAssets = require('./utils/buttonGifs');
const WebServer = require('./web/server');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel, Partials.Message]
});

client.db = Database;
client.assets = ButtonAssets;
client.commands = new Map();
client.tempData = new Map();

// Carregar comandos
function loadCommands() {
    const cmdPath = path.join(__dirname, 'commands');
    for (const file of fs.readdirSync(cmdPath).filter(f => f.endsWith('.js'))) {
        const cmd = require(path.join(cmdPath, file));
        if (cmd?.data?.name) {
            client.commands.set(cmd.data.name, cmd);
            console.log(`📝 Comando carregado: /${cmd.data.name}`);
        }
    }
}

// Carregar eventos
function loadEvents() {
    const evPath = path.join(__dirname, 'events');
    for (const file of fs.readdirSync(evPath).filter(f => f.endsWith('.js'))) {
        const ev = require(path.join(evPath, file));
        client[ev.once ? 'once' : 'on'](ev.name, (...args) => ev.execute(...args, client));
    }
}

// Conectar em canal de voz
async function connectVoice(guild) {
    const channelId = await client.db.getConfig(guild.id, 'voice_channel_id');
    if (!channelId) return;

    try {
        const channel = await guild.channels.fetch(channelId).catch(() => null);
        if (!channel || channel.type !== ChannelType.GuildVoice) {
            console.log(`⚠️ ${guild.name}: Canal de voz inválido`);
            return;
        }

        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfDeaf: false,
            selfMute: false
        });

        connection.on(VoiceConnectionStatus.Ready, () => {
            console.log(`🔊 Conectado na voz: ${guild.name} → #${channel.name}`);
        });

        connection.on(VoiceConnectionStatus.Disconnected, () => {
            console.log(`🔌 Desconectado da voz: ${guild.name} — reconectando em 3s...`);
            setTimeout(() => connectVoice(guild), 3000);
        });

        connection.on('error', (err) => {
            console.error(`❌ Erro voz ${guild.name}:`, err.message);
        });

        await entersState(connection, VoiceConnectionStatus.Ready, 5000).catch(() => {});
    } catch (err) {
        console.error(`❌ Falha ao conectar voz ${guild.name}:`, err.message);
    }
}

// Inicializar tudo
async function start() {
    try {
        console.log('⏳ Inicializando banco...');
        await client.db.init();
        
        console.log('⏳ Carregando comandos...');
        loadCommands();
        
        console.log('⏳ Carregando eventos...');
        loadEvents();
        
        console.log('⏳ Iniciando servidor web...');
        new WebServer(client).start();
        
        console.log('⏳ Fazendo login...');
        await client.login(process.env.TOKEN);
    } catch (err) {
        console.error('❌ FALHA CRÍTICA:', err);
        process.exit(1);
    }
}

client.once('ready', async () => {
    console.log(`\n✅ BOT ONLINE: ${client.user.tag}`);
    console.log(`🌍 Servidores: ${client.guilds.cache.size}`);
    console.log(`📝 Comandos: ${client.commands.size}\n`);
    
    // Conectar em todos os canais de voz configurados
    for (const [, guild] of client.guilds.cache) {
        await connectVoice(guild);
    }
});

// Reconectar voz se cair
client.on('voiceStateUpdate', async (oldState, newState) => {
    if (newState.member.id !== client.user.id) return;
    if (!newState.channelId) {
        const guild = newState.guild;
        setTimeout(() => connectVoice(guild), 2000);
    }
});

// Função global para conectar voz (usada pelos eventos)
client.connectVoice = connectVoice;

start();
