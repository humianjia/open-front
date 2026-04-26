const fs = require('fs');
const path = require('path');

const dataFiles = [
    'js/game_data/action.js',
    'js/game_data/battleRoyale.js',
    'js/game_data/fps.js',
    'js/game_data/multiplayer.js',
    'js/game_data/sniper.js'
];

function parseGameData(content) {
    const match = content.match(/=\s*\[([\s\S]*?)\];?\s*$/m);
    if (!match) return [];
    try {
        const data = eval('[' + match[1] + ']');
        return Array.isArray(data) ? data : [];
    } catch (e) {
        return [];
    }
}

function getAllGames() {
    const allGames = [];
    for (const file of dataFiles) {
        const fullPath = path.join(__dirname, file);
        if (fs.existsSync(fullPath)) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const games = parseGameData(content);
            allGames.push(...games);
        }
    }
    return allGames;
}

function sanitizeFileName(name) {
    return name.replace(/[<>:"/\\|?*:\s'´]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

function updateGamePages() {
    const games = getAllGames();
    console.log('Total games in data:', games.length);

    const categoryDirs = ['Action', 'BattleRoyale', 'FPS', 'Multiplayer', 'Sniper'];
    let updatedCount = 0;

    for (const game of games) {
        if (!game.name || !game.iframeUrl) continue;

        const category = game.gameType || '';
        let dir = '';
        if (category.toLowerCase().includes('action')) dir = 'Action';
        else if (category.toLowerCase().includes('battle')) dir = 'BattleRoyale';
        else if (category.toLowerCase().includes('fps')) dir = 'FPS';
        else if (category.toLowerCase().includes('multiplayer')) dir = 'Multiplayer';
        else if (category.toLowerCase().includes('sniper')) dir = 'Sniper';
        else continue;

        const fileName = sanitizeFileName(game.name) + '.html';
        const filePath = path.join(__dirname, dir, fileName);

        if (fs.existsSync(filePath)) {
            let content = fs.readFileSync(filePath, 'utf-8');

            const iframeMatch = content.match(/src="([^"]*)"/);
            if (iframeMatch) {
                const oldIframe = iframeMatch[1];
                if (oldIframe !== game.iframeUrl) {
                    content = content.replace(/src="[^"]*"/, 'src="' + game.iframeUrl + '"');
                    fs.writeFileSync(filePath, content, 'utf-8');
                    console.log('Updated:', game.name, '- iframe:', oldIframe.substring(0, 50) + '... -> ' + game.iframeUrl.substring(0, 50) + '...');
                    updatedCount++;
                }
            }
        } else {
            console.log('File not found:', filePath);
        }
    }

    console.log('\nTotal updated:', updatedCount);
}

updateGamePages();