const fs = require('fs');
const path = require('path');

function fixCanonical(filePath) {
    if (!filePath.endsWith('.html')) return;

    let content = fs.readFileSync(filePath, 'utf-8');

    let modified = false;

    if (content.includes('https://veck.io/')) {
        content = content.replace(/https:\/\/veck\.io\//g, 'https://veckio.space/');
        modified = true;
    }

    if (content.includes('https://veck.io/')) {
        content = content.replace(/https:\/\/veck\.io\//g, 'https://veckio.space/');
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log('Fixed:', filePath);
    }
}

function scanDirectory(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            scanDirectory(fullPath);
        } else if (stat.isFile() && file.endsWith('.html')) {
            fixCanonical(fullPath);
        }
    }
}

const rootDir = __dirname;
scanDirectory(rootDir);

console.log('\nCanonical URL fixed in all HTML files!');