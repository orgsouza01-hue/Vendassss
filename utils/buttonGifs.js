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
            console.log('⚠️ Pasta buttons_gifs não existe — criando estrutura...');
            fs.mkdirSync(this.basePath, { recursive: true });
            return;
        }

        const folders = fs.readdirSync(this.basePath);
        for (const folder of folders) {
            const folderPath = path.join(this.basePath, folder);
            if (!fs.statSync(folderPath).isDirectory()) continue;

            const files = fs.readdirSync(folderPath);
            let found = null;
            for (const ext of ['.gif', '.png', '.jpg', '.jpeg', '.webp']) {
                found = files.find(f => f.toLowerCase().endsWith(ext));
                if (found) break;
            }

            if (found) {
                this.assets.set(folder.toLowerCase(), {
                    path: path.join(folderPath, found),
                    name: found,
                    ext: path.extname(found).toLowerCase()
                });
            }
        }
        console.log(`🎨 ${this.assets.size} assets de botões carregados!`);
    }

    get(buttonName) {
        return this.assets.get(buttonName.toLowerCase()) || null;
    }

    has(buttonName) {
        return this.assets.has(buttonName.toLowerCase());
    }

    // Aplica emoji/ícone no botão se tiver asset configurado
    applyToButton(button, buttonName) {
        const asset = this.get(buttonName);
        if (asset) {
            // Tenta extrair emoji do nome do arquivo se começar com emoji
            const emojiMatch = asset.name.match(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})/u);
            if (emojiMatch) {
                button.setEmoji(emojiMatch[0]);
            }
        }
        return button;
    }
}

module.exports = new ButtonAssets();
