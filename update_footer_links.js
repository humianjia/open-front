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

const newFooterLinks = `<div class="footer-links">
            <a href="../index.html">About FrontWars.io</a>
            <a href="../contact.html">Contact Us</a>
            <a href="../contact.html">DMCA</a>
            <a href="../privacy-policy.html">Privacy Policy</a>
            <a href="../terms-of-service.html">Terms of Service</a>
            <a href="../cookie-policy.html">Cookie Policy</a>
        </div>`;

let updatedCount = 0;

for (const file of htmlFiles) {
    let content = fs.readFileSync(file, 'utf-8');
    
    // 更新二级页面（在子文件夹中的HTML文件）
    if (content.includes('<div class="footer-links">')) {
        const oldFooterLinks = /<div class="footer-links">[\s\S]*?<\/div>/;
        content = content.replace(oldFooterLinks, newFooterLinks);
        fs.writeFileSync(file, content);
        console.log(`Updated: ${file}`);
        updatedCount++;
    }
}

console.log(`\nTotal updated: ${updatedCount} files`);