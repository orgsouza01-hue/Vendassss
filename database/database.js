const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

class Database {
    constructor() {
        if (process.env.NODE_ENV === 'production') {
            if (!fs.existsSync('/data')) try { fs.mkdirSync('/data', { recursive: true }); } catch(e) {}
            this.dbPath = '/data/bot.db';
        } else {
            this.dbPath = path.join(__dirname, 'bot.db');
        }
        this.db = null;
        console.log(`📦 Banco: ${this.dbPath}`);
    }

    async init() {
        try {
            this.db = new DatabaseSync(this.dbPath);
            this.db.exec('PRAGMA journal_mode = WAL');
            this.db.exec('PRAGMA foreign_keys = ON');
            this.db.exec('PRAGMA busy_timeout = 5000');
            this._createTables();
            return Promise.resolve(true);
        } catch (err) { console.error('❌ ERRO DB:', err); return Promise.reject(err); }
    }

    _createTables() {
        this.db.exec(`CREATE TABLE IF NOT EXISTS configs(id INTEGER PRIMARY KEY AUTOINCREMENT,guild_id TEXT NOT NULL,key TEXT NOT NULL,value TEXT NOT NULL,UNIQUE(guild_id,key))`);
        this.db.exec(`CREATE TABLE IF NOT EXISTS products(id INTEGER PRIMARY KEY AUTOINCREMENT,guild_id TEXT NOT NULL,panel_id TEXT NOT NULL,name TEXT NOT NULL,description TEXT NOT NULL,price REAL NOT NULL,stock INTEGER NOT NULL DEFAULT 0,auto_delivery TEXT,created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        this.db.exec(`CREATE TABLE IF NOT EXISTS coupons(id INTEGER PRIMARY KEY AUTOINCREMENT,guild_id TEXT NOT NULL,name TEXT NOT NULL UNIQUE,discount REAL NOT NULL,expires_at DATETIME NOT NULL,created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        this.db.exec(`CREATE TABLE IF NOT EXISTS sales(id INTEGER PRIMARY KEY AUTOINCREMENT,guild_id TEXT NOT NULL,user_id TEXT NOT NULL,username TEXT NOT NULL,product_id INTEGER NOT NULL,product_name TEXT NOT NULL,quantity INTEGER NOT NULL DEFAULT 1,total_price REAL NOT NULL,payment_method TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        this.db.exec(`CREATE TABLE IF NOT EXISTS reaction_emoji(id INTEGER PRIMARY KEY AUTOINCREMENT,guild_id TEXT NOT NULL,emoji TEXT NOT NULL,UNIQUE(guild_id))`);
        this.db.exec(`CREATE TABLE IF NOT EXISTS panels(id INTEGER PRIMARY KEY AUTOINCREMENT,guild_id TEXT NOT NULL,message_id TEXT NOT NULL,channel_id TEXT NOT NULL,title TEXT NOT NULL,description TEXT,banner_url TEXT,created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
    }

    setConfig(g,k,v){try{const s=this.db.prepare(`INSERT OR REPLACE INTO configs(guild_id,key,value)VALUES(?,?,?)`);return Promise.resolve(s.run(g,k,v).lastInsertRowid)}catch(e){return Promise.reject(e)}}
    getConfig(g,k){try{const s=this.db.prepare(`SELECT value FROM configs WHERE guild_id=? AND key=?`).get(g,k);return Promise.resolve(s?.value??null)}catch(e){return Promise.reject(e)}}
    getAllConfigs(){try{return Promise.resolve(this.db.prepare(`SELECT * FROM configs`).all())}catch(e){return Promise.reject(e)}}
    addProduct(g,p,n,d,pr,s,a){try{const st=this.db.prepare(`INSERT INTO products(guild_id,panel_id,name,description,price,stock,auto_delivery)VALUES(?,?,?,?,?,?,?)`);return Promise.resolve(st.run(g,p,n,d,pr,s,a||null).lastInsertRowid)}catch(e){return Promise.reject(e)}}
    getProductsByPanel(g,p){try{return Promise.resolve(this.db.prepare(`SELECT * FROM products WHERE guild_id=? AND panel_id=?`).all(g,p))}catch(e){return Promise.reject(e)}}
    getProductById(i){try{return Promise.resolve(this.db.prepare(`SELECT * FROM products WHERE id=?`).get(i))}catch(e){return Promise.reject(e)}}
    getAllProducts(){try{return Promise.resolve(this.db.prepare(`SELECT * FROM products`).all())}catch(e){return Promise.reject(e)}}
    updateProductStock(i,n){try{return Promise.resolve(this.db.prepare(`UPDATE products SET stock=? WHERE id=?`).run(n,i).changes)}catch(e){return Promise.reject(e)}}
    addCoupon(g,n,d,e){try{return Promise.resolve(this.db.prepare(`INSERT INTO coupons(guild_id,name,discount,expires_at)VALUES(?,?,?,?)`).run(g,n.toLowerCase(),d,e).lastInsertRowid)}catch(e){return Promise.reject(e)}}
    getCouponByName(g,n){try{return Promise.resolve(this.db.prepare(`SELECT * FROM coupons WHERE guild_id=? AND LOWER(name)=?`).get(g,n.toLowerCase()))}catch(e){return Promise.reject(e)}}
    getAllCoupons(){try{return Promise.resolve(this.db.prepare(`SELECT * FROM coupons`).all())}catch(e){return Promise.reject(e)}}
    addSale(s){try{const st=this.db.prepare(`INSERT INTO sales(guild_id,user_id,username,product_id,product_name,quantity,total_price,payment_method,status)VALUES(?,?,?,?,?,?,?,?,?)`);return Promise.resolve(st.run(s.guildId,s.userId,s.username,s.productId,s.productName,s.quantity,s.totalPrice,s.paymentMethod,s.status).lastInsertRowid)}catch(e){return Promise.reject(e)}}
    setReactionEmoji(g,e){try{return Promise.resolve(this.db.prepare(`INSERT OR REPLACE INTO reaction_emoji(guild_id,emoji)VALUES(?,?)`).run(g,e).lastInsertRowid)}catch(e){return Promise.reject(e)}}
    getReactionEmoji(){try{return Promise.resolve(this.db.prepare(`SELECT * FROM reaction_emoji LIMIT 1`).get())}catch(e){return Promise.reject(e)}}
    getReactionEmojiByGuild(g){try{return Promise.resolve(this.db.prepare(`SELECT * FROM reaction_emoji WHERE guild_id=?`).get(g))}catch(e){return Promise.reject(e)}}
    addPanel(p){try{const st=this.db.prepare(`INSERT INTO panels(guild_id,message_id,channel_id,title,description,banner_url)VALUES(?,?,?,?,?,?)`);return Promise.resolve(st.run(p.guildId,p.messageId,p.channelId,p.title,p.description,p.bannerUrl).lastInsertRowid)}catch(e){return Promise.reject(e)}}
    getPanelById(i){try{return Promise.resolve(this.db.prepare(`SELECT * FROM panels WHERE id=?`).get(i))}catch(e){return Promise.reject(e)}}
}

module.exports = new Database();
