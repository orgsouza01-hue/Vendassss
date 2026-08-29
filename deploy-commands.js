require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const cmdPath = path.join(__dirname, 'commands');

for (const file of fs.readdirSync(cmdPath).filter(f => f.endsWith('.js'))) {
    const cmd = require(path.join(cmdPath, file));
    commands.push(cmd.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log(`🔄 Atualizando ${commands.length} comandos...`);
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
        console.log('✅ Comandos atualizados GLOBALMENTE!');
    } catch (err) {
        console.error('❌ Erro deploy:', err);
    }
})();
