const fs = require('fs');
const path = require('path');

const gaCode = `<!-- Google tag (gtag.js) -->
<script async src="https://www.goagletagmanager.com/gtag/js?id=G-GHQS0XRZ6D"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-GHQS0XRZ6D');
</script>`;

function addGAToFile(filePath) {
    if (!filePath.endsWith('.html')) return;

    let content = fs.readFileSync(filePath, 'utf-8');

    if (content.includes('G-GHQS0XRZ6D')) {
        console.log('Already has GA:', filePath);
        return;
    }

    const insertCode = `
${gaCode}
`;

    if (content.includes('<head>')) {
        content = content.replace('<head>', '<head>' + insertCode);
    } else if (content.includes('<!DOCTYPE')) {
        const doctypeEnd = content.indexOf('>') + 1;
        content = content.substring(0, doctypeEnd) + insertCode + content.substring(doctypeEnd);
    } else {
        content = insertCode + content;
    }

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Added GA to:', filePath);
}

function scanDirectory(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            scanDirectory(fullPath);
        } else if (stat.isFile() && file.endsWith('.html')) {
            addGAToFile(fullPath);
        }
    }
}

const rootDir = __dirname;
scanDirectory(rootDir);

console.log('\nGoogle Analytics code added to all HTML files!');