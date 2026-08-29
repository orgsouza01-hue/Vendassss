const fs = require('fs');
const path = require('path');

class ButtonAssets {
    constructor() {
        this.emojis = new Map(); // nome_botao -> emoji
        this.basePath = path.join(__dirname, '..', 'buttons_gifs');
        this.load();
    }

    load() {
        if (!fs.existsSync(this.basePath)) {
            fs.mkdirSync(this.basePath, { recursive: true });
            return;
        }

        const folders = fs.readdirSync(this.basePath);
        let cont = 0;

        for (const folder of folders) {
            const fp = path.join(this.basePath, folder);
            if (!fs.statSync(fp).isDirectory()) continue;

            const files = fs.readdirSync(fp);
            let emojiEncontrado = null;

            // 1. Tenta extrair emoji do NOME DO ARQUIVO (se começar com emoji)
            for (const file of files) {
                const match = file.match(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})/u);
                if (match) {
                    emojiEncontrado = match[0];
                    break;
                }
            }

            // 2. Se não achou, tenta extrair emoji do NOME DA PASTA
            if (!emojiEncontrado) {
                const match = folder.match(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})/u);
                if (match) emojiEncontrado = match[0];
            }

            if (emojiEncontrado) {
                this.emojis.set(folder.toLowerCase(), emojiEncontrado);
                cont++;
            }
        }

        console.log(`🎨 ${cont} emojis de botões carregados!`);
        console.log(`📂 Pastas encontradas: ${folders.length}`);
        if (cont > 0) console.log(`   Chaves: ${[...this.emojis.keys()].join(', ')}`);
    }

    // Busca emoji por nome do botão + tenta encontrar emoji customizado no servidor
    get(buttonName, guild = null) {
        const chave = buttonName.toLowerCase();
        
        // Primeiro: emoji do arquivo/pasta
        if (this.emojis.has(chave)) {
            return this.emojis.get(chave);
        }

        // Segundo: tenta encontrar emoji customizado no servidor com o mesmo nome
        if (guild) {
            const emojiCustom = guild.emojis.cache.find(e => 
                e.name.toLowerCase() === chave || 
                e.name.toLowerCase().replace(/_/g, '') === chave.replace(/_/g, '')
            );
            if (emojiCustom) return emojiCustom;
        }

        return null;
    }

    // Aplica emoji no botão
    apply(button, buttonName, guild = null) {
        const emoji = this.get(buttonName, guild);
        if (emoji) {
            try {
                button.setEmoji(emoji);
            } catch (e) {
                console.log(`⚠️ Não foi possível aplicar emoji em ${buttonName}: ${e.message}`);
            }
        }
        return button;
    }

    reload() {
        this.emojis.clear();
        this.load();
    }
}

module.exports = new ButtonAssets();
