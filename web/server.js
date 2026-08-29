const express = require('express');
class WebServer {
    constructor(client) { this.client = client; this.app = express(); this.port = process.env.WEB_PORT || 3000; this.setup(); }
    setup() {
        this.app.get('/', (req, res) => res.send(`<html><body style="background:#1a1a2e;color:#fff;font-family:Arial;padding:40px"><h1 style="color:#667eea">🤖 Bot Vendas Online</h1><div style="background:rgba(255,255,255,.05);padding:20px;border-radius:10px;display:inline-block"><b>Bot:</b> ${this.client.user?.tag || '---'}<br><b>Servidores:</b> ${this.client.guilds.cache.size}<br><b>Comandos:</b> ${this.client.commands.size}</div></body></html>`));
        this.app.get('/api/status', (req, res) => res.json({ online: true, bot: this.client.user?.tag, guilds: this.client.guilds.cache.size }));
    }
    start() { this.app.listen(this.port, () => console.log(`🌐 Web: http://localhost:${this.port}`)); }
}
module.exports = WebServer;
