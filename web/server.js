const express = require('express');
const path = require('path');
const fs = require('fs');

class WebServer {
    constructor(client) {
        this.client = client;
        this.app = express();
        this.port = process.env.WEB_PORT || 3000;
        this.setupRoutes();
    }

    setupRoutes() {
        this.app.get('/', (req, res) => {
            res.send(`
<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Bot Vendas</title>
<style>body{font-family:Arial;background:#1a1a2e;color:#fff;padding:40px}h1{color:#667eea}.card{background:rgba(255,255,255,.05);padding:20px;border-radius:10px;margin:10px 0;display:inline-block;min-width:200px}.green{color:#0f0}</style>
</head><body><h1>🤖 Bot de Vendas Online</h1>
<div class="card"><h3>Status</h3><div class="green">● CONECTADO</div></div>
<div class="card"><h3>Bot</h3><div>${this.client.user?.tag || '---'}</div></div>
<div class="card"><h3>Servidores</h3><div>${this.client.guilds.cache.size}</div></div>
<div class="card"><h3>Comandos</h3><div>${this.client.commands.size}</div></div>
</body></html>`);
        });

        this.app.get('/api/status', (req, res) => {
            res.json({ online: true, bot: this.client.user?.tag, guilds: this.client.guilds.cache.size });
        });

        this.app.get('/api/produtos', (req, res) => {
            res.json(this.client.db.getProductsByGuild('all') || this.client.db.db.prepare('SELECT * FROM products').all());
        });
    }

    start() {
        this.app.listen(this.port, () => {
            console.log(`🌐 Painel web: http://localhost:${this.port}`);
        });
    }
}

module.exports = WebServer;
