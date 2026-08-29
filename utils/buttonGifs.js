const fs = require('fs');
const path = require('path');

class ButtonAssets {
    constructor() {
        this.assets = new Map();
        this.basePath = path.join(__dirname, '..', 'buttons_gifs');
        this.load();
    }

    load() {
        if (!fs.existsSync(this.basePath)) {
            fs.mkdirSync(this.basePath, { recursive: true });
            return;
        }
        const folders = fs.readdirSync(this.basePath);
        for (const folder of folders) {
            const fp = path.join(this.basePath, folder);
            if (!fs.statSync(fp).isDirectory()) continue;
            const files = fs.readdirSync(fp);
            let found = null;
            for (const ext of ['.gif', '.png', '.jpg', '.jpeg', '.webp']) {
                found = files.find(f => f.toLowerCase().endsWith(ext));
                if (found) break;
            }
            if (found) {
                this.assets.set(folder.toLowerCase(), { path: path.join(fp, found), name: found });
                // Tenta extrair emoji do começo do nome do arquivo
                const emojiMatch = found.match(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})/u);
                if (emojiMatch) this.assets.get(folder.toLowerCase()).emoji = emojiMatch[0];
            }
        }
        console.log(`🎨 ${this.assets.size} assets de botões carregados`);
    }

    get(name) { return this.assets.get(name.toLowerCase()) || null; }
    has(name) { return this.assets.has(name.toLowerCase()); }

    apply(button, buttonName) {
        const asset = this.get(buttonName);
        if (asset?.emoji) button.setEmoji(asset.emoji);
        return button;
    }
}
module.exports = new ButtonAssets();
