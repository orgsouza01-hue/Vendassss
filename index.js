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
        GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel, Partials.Message]
});

client.db = Database;
client.assets = ButtonAssets;
client.commands = new Map();
client.temp = new Map();

// Carregar comandos
for (const f of fs.readdirSync(path.join(__dirname, 'commands')).filter(x => x.endsWith('.js'))) {
    const c = require(`./commands/${f}`);
    if (c?.data?.name) { client.commands.set(c.data.name, c); console.log(`📝 /${c.data.name}`); }
}

// Carregar eventos
for (const f of fs.readdirSync(path.join(__dirname, 'events')).filter(x => x.endsWith('.js'))) {
    const e = require(`./events/${f}`);
    client[e.once ? 'once' : 'on'](e.name, (...a) => e.execute(...a, client));
}

// Conectar voz
async function connectVoice(guild) {
    const chId = await client.db.getConfig(guild.id, 'voice_channel_id');
    if (!chId) return;
    try {
        const ch = await guild.channels.fetch(chId).catch(() => null);
        if (!ch || ch.type !== ChannelType.GuildVoice) return;
        const conn = joinVoiceChannel({ channelId: ch.id, guildId: guild.id, adapterCreator: guild.voiceAdapterCreator, selfDeaf: false, selfMute: false });
        conn.on(VoiceConnectionStatus.Ready, () => console.log(`🔊 Voz: ${guild.name} → #${ch.name}`));
        conn.on(VoiceConnectionStatus.Disconnected, () => setTimeout(() => connectVoice(guild), 3000));
        conn.on('error', err => console.error(`❌ Voz: ${err.message}`));
        await entersState(conn, VoiceConnectionStatus.Ready, 5000).catch(() => {});
    } catch (e) { console.error(`❌ Falha voz ${guild.name}:`, e.message); }
}
client.connectVoice = connectVoice;

// Iniciar
async function start() {
    await client.db.init();
    new WebServer(client).start();
    await client.login(process.env.TOKEN);
}

client.once('ready', async () => {
    console.log(`\n✅ ONLINE: ${client.user.tag}`);
    console.log(`🌍 Servidores: ${client.guilds.cache.size}`);
    for (const [, g] of client.guilds.cache) await connectVoice(g);
    console.log('');
});

client.on('voiceStateUpdate', async (o, n) => {
    if (n.member.id !== client.user.id) return;
    if (!n.channelId) setTimeout(() => connectVoice(n.guild), 2000);
});

start();
