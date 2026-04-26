const fs = require('fs');
const path = require('path');

function sanitizeFileName(name) {
    return name.replace(/[<>:"/\\|?*:\s]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

const dataFiles = [
    { file: 'js/game_data/action.js', category: 'Action' },
    { file: 'js/game_data/battleRoyale.js', category: 'BattleRoyale' },
    { file: 'js/game_data/fps.js', category: 'FPS' },
    { file: 'js/game_data/multiplayer.js', category: 'Multiplayer' },
    { file: 'js/game_data/sniper.js', category: 'Sniper' }
];

function processFile(filePath, category) {
    let content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const newLines = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        if (line.match(/^\s*"id":\s*"/)) {
            newLines.push(line);
            i++;

            let nameLine = null;
            let linkLineIdx = -1;
            let linkLine = null;

            for (let j = i; j < Math.min(i + 15, lines.length); j++) {
                if (lines[j].match(/^\s*"name":\s*"/)) {
                    nameLine = lines[j];
                }
                if (lines[j].match(/^\s*"link":\s*"/)) {
                    linkLineIdx = j;
                    linkLine = lines[j];
                    break;
                }
            }

            if (nameLine) newLines.push(nameLine);

            if (linkLine) {
                const nameMatch = nameLine ? nameLine.match(/"name":\s*"([^"]+)"/) : null;
                if (nameMatch) {
                    const gameName = nameMatch[1];
                    const safeName = sanitizeFileName(gameName);
                    const newLink = `"link": "${category}/${safeName}.html"`;
                    const indent = linkLine.match(/^(\s*)/)[1];
                    newLines.push(indent + newLink);
                    i = linkLineIdx + 1;
                    continue;
                }
            }

            for (let j = i; j < (linkLineIdx >= i ? linkLineIdx : i + 15); j++) {
                newLines.push(lines[j]);
            }
            i = linkLineIdx >= i ? linkLineIdx + 1 : i;
        } else {
            newLines.push(line);
            i++;
        }
    }

    fs.writeFileSync(filePath, newLines.join('\n'), 'utf-8');
    console.log('Fixed:', filePath);
}

dataFiles.forEach(({ file, category }) => {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
        processFile(fullPath, category);
    }
});

console.log('Done!');