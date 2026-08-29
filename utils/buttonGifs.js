const fs = require('fs');
const path = require('path');

class ButtonGifs {
    constructor() {
        this.gifs = new Map();
        this.basePath = path.join(__dirname, '..', 'buttons_gifs');
        this.loadGifs();
    }

    loadGifs() {
        if (!fs.existsSync(this.basePath)) return;

        const folders = fs.readdirSync(this.basePath);
        
        for (const folder of folders) {
            const folderPath = path.join(this.basePath, folder);
            if (!fs.statSync(folderPath).isDirectory()) continue;

            const files = fs.readdirSync(folderPath);
            const gifFile = files.find(f => f.toLowerCase().endsWith('.gif'));
            
            if (gifFile) {
                this.gifs.set(folder, path.join(folderPath, gifFile));
            }
        }

        console.log(`🎨 ${this.gifs.size} GIFs de botões carregados!`);
    }

    getGif(buttonName) {
        return this.gifs.get(buttonName) || null;
    }

    hasGif(buttonName) {
        return this.gifs.has(buttonName);
    }

    getAllGifs() {
        return Object.fromEntries(this.gifs);
    }

    reload() {
        this.gifs.clear();
        this.loadGifs();
    }
}

module.exports = new ButtonGifs();
