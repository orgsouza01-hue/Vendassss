require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');

const commands = [];
const cmdFiles = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));

console.log(`📝 Encontrados ${cmdFiles.length} comandos:`);

for (const f of cmdFiles) {
    const cmd = require(`./commands/${f}`);
    if (cmd?.data) {
        commands.push(cmd.data.toJSON());
        console.log(`   ✅ /${cmd.data.name}`);
    }
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log(`\n🔄 Registrando ${commands.length} comandos GLOBALMENTE...`);
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
        console.log('✅✅✅ COMANDOS REGISTRADOS COM SUCESSO!');
        console.log('⏰ Os comandos aparecem em até 1 hora no Discord.');
        console.log('⚡ Para aparecer IMEDIATAMENTE, reinicie o Discord (Ctrl+R ou fecha e abre).');
    } catch (e) {
        console.error('❌ ERRO NO DEPLOY:', e.message);
        if (e.code === 50001) console.error('   → Token inválido ou sem permissões!');
        if (e.code === 50035) console.error('   → Erro nos dados do comando!');
    }
})();
