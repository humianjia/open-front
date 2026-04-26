const fs = require('fs');
const path = require('path');
const https = require('https');

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

function checkUrl(url) {
    return new Promise((resolve) => {
        try {
            const req = https.get(url, (res) => {
                resolve({ url, status: res.statusCode, success: res.statusCode >= 200 && res.statusCode < 400 });
            });
            req.on('error', () => {
                resolve({ url, status: 0, success: false });
            });
            req.setTimeout(5000, () => {
                resolve({ url, status: 0, success: false });
            });
        } catch (e) {
            resolve({ url, status: 0, success: false });
        }
    });
}

async function checkAllIframes() {
    const failedGames = [];
    
    for (const file of dataFiles) {
        const fullPath = path.join(__dirname, file);
        if (!fs.existsSync(fullPath)) {
            console.log('Not found:', fullPath);
            continue;
        }

        const content = fs.readFileSync(fullPath, 'utf-8');
        const games = parseGameData(content);
        
        console.log('Checking', file + ':', games.length, 'games');
        
        for (const game of games) {
            if (game.name && game.iframeUrl) {
                const result = await checkUrl(game.iframeUrl);
                if (!result.success) {
                    failedGames.push({ game: game.name, url: game.iframeUrl, status: result.status });
                }
            }
        }
    }
    
    console.log('\n=== Failed iframe URLs ===');
    if (failedGames.length === 0) {
        console.log('All iframes are working!');
    } else {
        failedGames.forEach((item, index) => {
            console.log(`${index + 1}. ${item.game}`);
            console.log(`   URL: ${item.url}`);
            console.log(`   Status: ${item.status || 'Connection failed'}`);
            console.log('');
        });
    }
    
    console.log('Total failed:', failedGames.length);
}

checkAllIframes().catch(console.error);