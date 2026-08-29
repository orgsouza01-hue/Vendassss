require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const path = require('path');
const Database = require('./database/database');
const WebServer = require('./web/server');

const client = new Client({
    intents: [GatewayIntentBits.Guilds,GatewayIntentBits.GuildMessages,GatewayIntentBits.GuildMembers,GatewayIntentBits.GuildVoiceStates,GatewayIntentBits.MessageContent],
    partials: [Partials.Channel]
});

client.commands = new Map();
client.db = Database;
client.configCache = new Map();

async function startBot() {
    try {
        console.log('⏳ Iniciando banco…');
        await client.db.init();
        console.log('✅ Banco OK — carregando tudo…');

        // Carrega comandos
        const fs=require('fs');
        const cmdsPath=path.join(__dirname,'commands');
        for(const f of fs.readdirSync(cmdsPath).filter(x=>x.endsWith('.js'))){
            const cmd=require(path.join(cmdsPath,f));
            if(cmd?.data?.name) client.commands.set(cmd.data.name,cmd);
        }

        // Eventos
        const evPath=path.join(__dirname,'events');
        for(const f of fs.readdirSync(evPath).filter(x=>x.endsWith('.js'))){
            const ev=require(path.join(evPath,f));
            client[ev.once?'once':'on'](ev.name,(...a)=>ev.execute(...a,client));
        }

        // Servidor web
        new WebServer(client).start();

        // Login
        await client.login(process.env.TOKEN);
    } catch(e){
        console.error('❌ FALHA INICIAL:',e);
        process.exit(1);
    }
}

client.once('ready', async () => {
    console.log(`✅ CONECTADO: ${client.user.tag}`);
});

startBot();
