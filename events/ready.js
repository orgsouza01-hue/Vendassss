const { Events, ActivityType } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`\n========================================`);
        console.log(`✅ Bot conectado com sucesso!`);
        console.log(`🤖 Nome: ${client.user.tag}`);
        console.log(`🆔 ID: ${client.user.id}`);
        console.log(`🌍 Servidores: ${client.guilds.cache.size}`);
        console.log(`========================================\n`);

        // Atualizar status
        client.user.setActivity({
            name: 'Sistema de Vendas Avançado',
            type: ActivityType.Playing
        });

        // Fazer deploy dos comandos automaticamente
        try {
            const { exec } = require('child_process');
            exec('node deploy-commands.js', (error, stdout, stderr) => {
                if (error) {
                    console.log('⚠️ Para fazer deploy dos comandos, execute: node deploy-commands.js');
                } else {
                    console.log('📋 Comandos atualizados automaticamente!');
                }
            });
        } catch (e) {
            console.log('⚠️ Execute "node deploy-commands.js" para registrar os comandos.');
        }
    }
};
