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

const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ff6b35;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f7c59f;stop-opacity:1" />
    </linearGradient>
  </defs>
  <polygon points="25,5 45,40 5,40" fill="none" stroke="url(#grad1)" stroke-width="3"/>
  <line x1="25" y1="15" x2="25" y2="30" stroke="#ff6b35" stroke-width="2"/>
  <line x1="20" y1="35" x2="30" y2="35" stroke="#ff6b35" stroke-width="2"/>
</svg>`;

const svgDataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(logoSvg)}`;
const newFavicon = `<link rel="icon" type="image/svg+xml" href="${svgDataUri}">`;

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