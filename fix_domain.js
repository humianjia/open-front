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
    
    // 替换错误的canonical和og:url
    content = content.replace(/canonical href="https:\/\/frontwarsio\.com\//g, 'canonical href="https://www.openfront.space/');
    content = content.replace(/og:url" content="https:\/\/frontwarsio\.com\//g, 'og:url" content="https://www.openfront.space/');
    
    fs.writeFileSync(file, content);
    console.log(`Updated: ${file}`);
    updatedCount++;
}

console.log(`\nTotal updated: ${updatedCount} files`);
