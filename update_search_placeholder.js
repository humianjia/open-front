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

let updatedCount = 0;

for (const file of htmlFiles) {
    let content = fs.readFileSync(file, 'utf-8');
    
    if (content.includes('placeholder="搜索游戏..."')) {
        content = content.replace(/placeholder="搜索游戏\.\.\."/g, 'placeholder="Search games..."');
        fs.writeFileSync(file, content);
        console.log(`Updated: ${file}`);
        updatedCount++;
    }
}

console.log(`\nTotal updated: ${updatedCount} files`);