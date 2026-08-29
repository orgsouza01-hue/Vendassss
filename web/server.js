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
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, 'public')));

        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
        });

        this.app.get('/api/status', (req, res) => {
            res.json({
                online: this.client.isReady(),
                username: this.client.user?.tag || 'Desconectado',
                guilds: this.client.guilds.cache.size,
                users: this.client.users.cache.size,
                uptime: this.client.uptime || 0
            });
        });

        this.app.get('/api/configs', async (req, res) => {
            const configs = await this.client.db.getAllConfigs();
            res.json(configs);
        });

        this.app.get('/api/products', async (req, res) => {
            const products = await this.client.db.getAllProducts();
            res.json(products);
        });

        this.app.get('/api/coupons', async (req, res) => {
            const coupons = await this.client.db.getAllCoupons();
            res.json(coupons);
        });

        this.app.get('/api/guilds', (req, res) => {
            const guilds = this.client.guilds.cache.map(g => ({
                id: g.id,
                name: g.name,
                members: g.memberCount,
                icon: g.iconURL()
            }));
            res.json(guilds);
        });

        this.app.get('/api/sales', async (req, res) => {
            try {
                const stmt = this.client.db.db.prepare(`SELECT * FROM sales ORDER BY created_at DESC LIMIT 50`);
                const rows = stmt.all();
                res.json(rows);
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });
    }

    start() {
        const publicDir = path.join(__dirname, 'public');
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
            this.createIndexHtml(publicDir);
        }

        this.app.listen(this.port, () => {
            console.log(`🌐 Servidor web rodando na porta ${this.port}`);
            console.log(`   Acesse: http://localhost:${this.port}`);
        });
    }

    createIndexHtml(publicDir) {
        const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bot de Vendas - Painel Administrativo</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #fff; min-height: 100vh; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 15px; margin-bottom: 30px; box-shadow: 0 10px 30px rgba(102,126,234,0.3); }
        header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); padding: 25px; border-radius: 15px; }
        .stat-card h3 { font-size: 0.9em; opacity: 0.7; margin-bottom: 10px; text-transform: uppercase; }
        .stat-card .value { font-size: 2em; font-weight: bold; }
        .status-online { color: #00ff88; }
        .section { background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); padding: 25px; border-radius: 15px; margin-bottom: 20px; }
        .section h2 { margin-bottom: 20px; }
        .item { background: rgba(255,255,255,0.03); padding: 15px; border-radius: 10px; margin-bottom: 10px; display: flex; justify-content: space-between; }
        .item .price { color: #00ff88; font-weight: bold; }
        footer { text-align: center; padding: 30px; opacity: 0.6; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <header><h1>🤖 Bot de Vendas Avançado</h1><p>Painel Administrativo</p></header>
        <div class="stats-grid">
            <div class="stat-card"><h3>Status</h3><div class="value" id="status">Carregando...</div></div>
            <div class="stat-card"><h3>Servidores</h3><div class="value" id="guilds">-</div></div>
            <div class="stat-card"><h3>Usuários</h3><div class="value" id="users">-</div></div>
            <div class="stat-card"><h3>Uptime</h3><div class="value" id="uptime">-</div></div>
        </div>
        <div class="section"><h2>📦 Produtos</h2><div id="products-list">Carregando...</div></div>
        <div class="section"><h2>🎟️ Cupons</h2><div id="coupons-list">Carregando...</div></div>
        <div class="section"><h2>💰 Últimas Vendas</h2><div id="sales-list">Carregando...</div></div>
        <footer><p>Bot de Vendas © 2026</p></footer>
    </div>
    <script>
        async function loadData() {
            try {
                const s = await fetch('/api/status').then(r => r.json());
                document.getElementById('status').innerHTML = s.online ? '<span class="status-online">● ONLINE</span>' : '● OFFLINE';
                document.getElementById('guilds').textContent = s.guilds;
                document.getElementById('users').textContent = s.users;
                const up = Math.floor(s.uptime/1000);
                document.getElementById('uptime').textContent = Math.floor(up/3600)+'h '+Math.floor((up%3600)/60)+'m';
                
                const p = await fetch('/api/products').then(r => r.json());
                document.getElementById('products-list').innerHTML = p.length ? p.map(x => '<div class="item"><span><strong>'+x.name+'</strong></span><span class="price">R$ '+parseFloat(x.price).toFixed(2)+'</span></div>').join('') : '<p style="opacity:0.6">Nenhum produto</p>';
                
                const c = await fetch('/api/coupons').then(r => r.json());
                document.getElementById('coupons-list').innerHTML = c.length ? c.map(x => '<div class="item"><span><strong>'+x.name+'</strong></span><span class="price">'+x.discount+'% OFF</span></div>').join('') : '<p style="opacity:0.6">Nenhum cupom</p>';
                
                const sl = await fetch('/api/sales').then(r => r.json());
                document.getElementById('sales-list').innerHTML = sl.length ? sl.slice(0,10).map(x => '<div class="item"><span><strong>'+x.product_name+'</strong> - '+x.username+'</span><span class="price">R$ '+parseFloat(x.total_price).toFixed(2)+'</span></div>').join('') : '<p style="opacity:0.6">Nenhuma venda</p>';
            } catch(e){}
        }
        loadData(); setInterval(loadData, 5000);
    </script>
</body>
</html>`;
        fs.writeFileSync(path.join(publicDir, 'index.html'), html);
    }
}

module.exports = WebServer;
