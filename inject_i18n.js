const fs = require('fs');
const path = require('path');

const rootDir = __dirname;

function walk(dir, files = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walk(fullPath, files);
        } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) {
            files.push(fullPath);
        }
    }
    return files;
}

function inject(filePath) {
    const source = fs.readFileSync(filePath, 'utf8');
    if (source.includes('js/i18n.js')) return false;

    const depth = path.relative(path.dirname(filePath), rootDir).split(path.sep).filter(Boolean).length;
    const prefix = depth === 0 ? '' : '../'.repeat(depth);
    const scriptTag = `    <script src="${prefix}js/i18n.js"></script>\n`;
    const marker = '</body>';
    const index = source.lastIndexOf(marker);
    const next = index >= 0
        ? `${source.slice(0, index)}${scriptTag}${source.slice(index)}`
        : `${source}\n${scriptTag}`;

    fs.writeFileSync(filePath, next, 'utf8');
    return true;
}

let updated = 0;
for (const file of walk(rootDir)) {
    if (inject(file)) updated += 1;
}

console.log(`Injected i18n into ${updated} HTML files.`);
