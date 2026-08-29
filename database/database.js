const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

class Database {
    constructor() {
        if (process.env.NODE_ENV === 'production') {
            try {
                if (fs.existsSync('/data') && fs.accessSync('/data', fs.constants.W_OK) === undefined) {
                    this.dbPath = '/data/bot.db';
                } else { throw new Error('no /data'); }
            } catch {
                this.dbPath = path.join(__dirname, '..', 'bot.db');
            }
        } else {
            this.dbPath = path.join(__dirname, 'bot.db');
        }
        this.db = null;
    }

    async init() {
        try {
            const dir = path.dirname(this.dbPath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            this.db = new DatabaseSync(this.dbPath);
            this.db.exec('PRAGMA journal_mode = WAL');
            this.db.exec('PRAGMA foreign_keys = ON');
            this._createTables();
            console.log(`✅ Banco inicializado: ${this.dbPath}`);
            return true;
        } catch (err) {
            console.error('❌ ERRO BANCO:', err.message);
            throw err;
        }
    }

    _createTables() {
        this.db.exec(`CREATE TABLE IF NOT EXISTS configs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            guild_id TEXT NOT NULL,
            key TEXT NOT NULL,
            value TEXT NOT NULL,
            UNIQUE(guild_id, key)
        )`);
        this.db.exec(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            guild_id TEXT NOT NULL,
            panel_id TEXT DEFAULT '',
            name TEXT NOT NULL,
            description TEXT DEFAULT '',
            price REAL NOT NULL DEFAULT 0,
            stock INTEGER NOT NULL DEFAULT 0,
            auto_delivery TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        this.db.exec(`CREATE TABLE IF NOT EXISTS coupons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            guild_id TEXT NOT NULL,
            name TEXT NOT NULL UNIQUE,
            discount REAL NOT NULL,
            expires_at DATETIME NOT NULL
        )`);
        this.db.exec(`CREATE TABLE IF NOT EXISTS sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            guild_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            username TEXT NOT NULL,
            product_id INTEGER NOT NULL,
            product_name TEXT NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            total_price REAL NOT NULL,
            payment_method TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending'
        )`);
        this.db.exec(`CREATE TABLE IF NOT EXISTS reaction_emoji (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            guild_id TEXT NOT NULL UNIQUE,
            emoji TEXT NOT NULL
        )`);
        this.db.exec(`CREATE TABLE IF NOT EXISTS panels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            guild_id TEXT NOT NULL,
            message_id TEXT NOT NULL,
            channel_id TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            banner_url TEXT
        )`);
    }

    // CONFIGS
    setConfig(g, k, v) { try { return this.db.prepare('INSERT OR REPLACE INTO configs(guild_id,key,value)VALUES(?,?,?)').run(g,k,v).lastInsertRowid; } catch(e){console.error('setConfig:',e);return null;} }
    getConfig(g, k, def=null) { try { const r=this.db.prepare('SELECT value FROM configs WHERE guild_id=? AND key=?').get(g,k); return r?.value ?? def; } catch(e){return def;} }
    getAllConfigs() { try { return this.db.prepare('SELECT * FROM configs').all(); } catch(e){return [];} }

    // PRODUCTS
    addProduct(g, pid, name, desc, price, stock, auto=null) {
        try { return this.db.prepare('INSERT INTO products(guild_id,panel_id,name,description,price,stock,auto_delivery)VALUES(?,?,?,?,?,?,?)').run(g,pid||'',name,desc||'',Number(price),Number(stock),auto).lastInsertRowid; }
        catch(e){console.error('addProduct:',e);return null;}
    }
    updateProduct(id, data) {
        try {
            const fields = Object.keys(data).map(k => `${k}=?`).join(',');
            const values = Object.values(data);
            values.push(id);
            return this.db.prepare(`UPDATE products SET ${fields} WHERE id=?`).run(...values).changes;
        } catch(e){console.error('updateProduct:',e);return 0;}
    }
    getProductsByGuild(g) { try { return this.db.prepare('SELECT * FROM products WHERE guild_id=? ORDER BY id DESC').all(g); } catch(e){return [];} }
    getProductById(id) { try { return this.db.prepare('SELECT * FROM products WHERE id=?').get(id); } catch(e){return null;} }
    updateStock(id, qtd) { try { return this.db.prepare('UPDATE products SET stock=? WHERE id=?').run(qtd,id).changes; } catch(e){return 0;} }

    // COUPONS
    addCoupon(g,n,d,e){try{return this.db.prepare('INSERT INTO coupons(guild_id,name,discount,expires_at)VALUES(?,?,?,?)').run(g,n.toLowerCase(),d,e).lastInsertRowid}catch(e){return null}}
    getCoupon(g,n){try{return this.db.prepare('SELECT * FROM coupons WHERE guild_id=? AND LOWER(name)=?').get(g,n.toLowerCase())}catch(e){return null}}

    // SALES
    addSale(s){try{return this.db.prepare('INSERT INTO sales(guild_id,user_id,username,product_id,product_name,quantity,total_price,payment_method,status)VALUES(?,?,?,?,?,?,?,?,?)').run(s.guildId,s.userId,s.username,s.productId,s.productName,s.quantity,s.totalPrice,s.paymentMethod,s.status).lastInsertRowid}catch(e){return null}}

    // EMOJI
    setReaction(g,e){try{return this.db.prepare('INSERT OR REPLACE INTO reaction_emoji(guild_id,emoji)VALUES(?,?)').run(g,e).lastInsertRowid}catch(e){return null}}
    getReaction(g){try{return this.db.prepare('SELECT emoji FROM reaction_emoji WHERE guild_id=?').get(g)?.emoji}catch(e){return null}}

    // PANELS
    addPanel(p){try{return this.db.prepare('INSERT INTO panels(guild_id,message_id,channel_id,title,description,banner_url)VALUES(?,?,?,?,?,?)').run(p.guildId,p.messageId,p.channelId,p.title,p.description,p.bannerUrl).lastInsertRowid}catch(e){return null}}
}

module.exports = new Database();
