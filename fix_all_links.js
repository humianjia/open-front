const fs = require('fs');
const path = require('path');

function sanitizeFileName(name) {
    return name.replace(/[<>:"/\\|?*:\s']/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

const dataFiles = [
    'js/game_data/action.js',
    'js/game_data/battleRoyale.js',
    'js/game_data/fps.js',
    'js/game_data/multiplayer.js',
    'js/game_data/sniper.js'
];

function fixLinks(content) {
    const lines = content.split('\n');
    const newLines = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        if (line.match(/^\s*"link":\s*"/)) {
            const match = line.match(/"link":\s*"([^"]+)"/);
            if (match) {
                const oldLink = match[1];
                const parts = oldLink.split('/');
                const fileName = parts[parts.length - 1];
                const dir = parts.slice(0, -1).join('/');
                const nameWithoutExt = fileName.replace('.html', '');
                const sanitized = sanitizeFileName(nameWithoutExt);
                const newLink = dir + '/' + sanitized + '.html';
                const indent = line.match(/^(\s*)/)[1];
                newLines.push(indent + '"link": "' + newLink + '",');
                i++;
                continue;
            }
        }
        newLines.push(line);
        i++;
    }

    return newLines.join('\n');
}

dataFiles.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (!fs.existsSync(fullPath)) {
        console.log('Not found:', fullPath);
        return;
    }

    let content = fs.readFileSync(fullPath, 'utf-8');
    const newContent = fixLinks(content);
    fs.writeFileSync(fullPath, newContent, 'utf-8');
    console.log('Fixed links in:', file);
});

console.log('All links fixed!');