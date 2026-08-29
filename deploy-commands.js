require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const commands = [];
for (const f of fs.readdirSync('./commands').filter(x => x.endsWith('.js'))) {
    const c = require(`./commands/${f}`);
    commands.push(c.data.toJSON());
}
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
(async () => {
    try {
        console.log(`🔄 Atualizando ${commands.length} comandos...`);
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
        console.log('✅ Comandos atualizados!');
    } catch (e) { console.error(e); }
})();
