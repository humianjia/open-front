const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const htmlFiles = [];

function findHtmlFiles(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
        if (item === 'node_modules') continue;
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            findHtmlFiles(fullPath);
        } else if (item.endsWith('.html')) {
            htmlFiles.push(fullPath);
        }
    }
}

findHtmlFiles(rootDir);

const newFavicon = '<link rel="icon" type="image/svg+xml" href="favicon.svg">';

let updatedCount = 0;

for (const file of htmlFiles) {
    let content = fs.readFileSync(file, 'utf-8');
    
    const lines = content.split('\n');
    let newContent = [];
    let found = false;
    
    for (const line of lines) {
        if (line.includes('rel="icon"') && !found) {
            newContent.push(`    ${newFavicon}`);
            found = true;
        } else if (!line.includes('rel="icon"')) {
            newContent.push(line);
        }
    }
    
    if (found) {
        fs.writeFileSync(file, newContent.join('\n'));
        console.log(`Updated: ${file}`);
        updatedCount++;
    }
}

console.log(`\nTotal updated: ${updatedCount} files`);
