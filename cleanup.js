const fs = require('fs');
const path = require('path');

const categories = ['Action', 'BattleRoyale', 'FPS', 'Multiplayer', 'Sniper'];

categories.forEach(category => {
    const dir = path.join(__dirname, category);
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);
    files.forEach(file => {
        if (file.endsWith('.html')) {
            const filePath = path.join(dir, file);
            fs.unlinkSync(filePath);
            console.log('Deleted:', filePath);
        }
    });
});

console.log('All old files deleted!');