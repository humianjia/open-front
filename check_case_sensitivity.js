const fs = require('fs');
const path = require('path');

function getAllFiles(dir, files = []) {
    if (!fs.existsSync(dir)) return files;
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            getAllFiles(fullPath, files);
        } else {
            files.push(fullPath);
        }
    }
    return files;
}

function normalizeFilePath(filePath) {
    return filePath.replace(/\\/g, '/').toLowerCase();
}

function getRelativePath(fullPath, baseDir) {
    return fullPath.replace(baseDir.replace(/\\/g, '/'), '').replace(/\\/g, '/');
}

const baseDir = 'f:/DATA/MyWorkspace/h5game/openfront';
const imgDir = path.join(baseDir, 'img/icon');

// Get all image files
const imageFiles = getAllFiles(imgDir).map(f => ({
    fullPath: f,
    relativePath: getRelativePath(f, baseDir),
    normalizedPath: normalizeFilePath(f)
}));

// Create a map for quick lookup
const imageMap = {};
imageFiles.forEach(img => {
    imageMap[img.normalizedPath] = img.relativePath;
});

// Files to check
const filesToCheck = [
    'index.html',
    'categories.html',
    ...getAllFiles(path.join(baseDir, 'Action')).filter(f => f.endsWith('.html')),
    ...getAllFiles(path.join(baseDir, 'BattleRoyale')).filter(f => f.endsWith('.html')),
    ...getAllFiles(path.join(baseDir, 'FPS')).filter(f => f.endsWith('.html')),
    ...getAllFiles(path.join(baseDir, 'Multiplayer')).filter(f => f.endsWith('.html')),
    ...getAllFiles(path.join(baseDir, 'Sniper')).filter(f => f.endsWith('.html')),
];

const issues = [];

filesToCheck.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const fileDir = path.dirname(file);

    // Check for img src references
    const imgSrcRegex = /src=["']([^"']+\.(jpg|jpeg|png|gif|svg|webp))["']/gi;
    let match;

    while ((match = imgSrcRegex.exec(content)) !== null) {
        const imgSrc = match[1];

        // Skip external URLs
        if (imgSrc.startsWith('http') || imgSrc.startsWith('//') || imgSrc.startsWith('data:')) {
            continue;
        }

        // Resolve the absolute path
        let absolutePath;
        if (imgSrc.startsWith('/')) {
            absolutePath = path.join(baseDir, imgSrc);
        } else {
            absolutePath = path.join(fileDir, imgSrc);
        }

        const normalizedAbsolute = normalizeFilePath(absolutePath);
        const relativePath = getRelativePath(absolutePath, baseDir);

        // Check if file exists (case-sensitive)
        if (!fs.existsSync(absolutePath)) {
            // Try to find a case-insensitive match
            const possibleMatch = imageMap[normalizedAbsolute];
            if (possibleMatch) {
                issues.push({
                    file: getRelativePath(file, baseDir),
                    reference: imgSrc,
                    expectedCase: possibleMatch,
                    issue: 'Case mismatch - file exists but with different case'
                });
            } else {
                issues.push({
                    file: getRelativePath(file, baseDir),
                    reference: imgSrc,
                    expectedCase: 'FILE NOT FOUND',
                    issue: 'Image file not found'
                });
            }
        }
    }

    // Check for link href references (css, js, etc.)
    const linkHrefRegex = /href=["']([^"']+\.(css|js))["']/gi;
    while ((match = linkHrefRegex.exec(content)) !== null) {
        const linkHref = match[1];

        if (linkHref.startsWith('http') || linkHref.startsWith('//') || linkHref.startsWith('data:') || linkHref.startsWith('https://') || linkHref.startsWith('//')) {
            continue;
        }

        let absolutePath;
        if (linkHref.startsWith('/')) {
            absolutePath = path.join(baseDir, linkHref);
        } else {
            absolutePath = path.join(fileDir, linkHref);
        }

        if (!fs.existsSync(absolutePath)) {
            issues.push({
                file: getRelativePath(file, baseDir),
                reference: linkHref,
                expectedCase: 'FILE NOT FOUND',
                issue: 'CSS/JS file not found'
            });
        }
    }

    // Check for script src references
    const scriptSrcRegex = /src=["']([^"']+\.(js))["']/gi;
    while ((match = scriptSrcRegex.exec(content)) !== null) {
        const scriptSrc = match[1];

        if (scriptSrc.startsWith('http') || scriptSrc.startsWith('//') || scriptSrc.startsWith('data:') || scriptSrc.startsWith('https://')) {
            continue;
        }

        let absolutePath;
        if (scriptSrc.startsWith('/')) {
            absolutePath = path.join(baseDir, scriptSrc);
        } else {
            absolutePath = path.join(fileDir, scriptSrc);
        }

        if (!fs.existsSync(absolutePath)) {
            issues.push({
                file: getRelativePath(file, baseDir),
                reference: scriptSrc,
                expectedCase: 'FILE NOT FOUND',
                issue: 'JS file not found'
            });
        }
    }
});

console.log('=== Path Case Sensitivity Check Results ===\n');

if (issues.length === 0) {
    console.log('No case sensitivity issues found!');
} else {
    console.log(`Found ${issues.length} potential issues:\n`);
    issues.forEach((issue, index) => {
        console.log(`${index + 1}. File: ${issue.file}`);
        console.log(`   Reference: ${issue.reference}`);
        console.log(`   Issue: ${issue.issue}`);
        if (issue.expectedCase && issue.expectedCase !== 'FILE NOT FOUND') {
            console.log(`   Expected: ${issue.expectedCase}`);
        }
        console.log('');
    });
}

// Also list actual directory structure for comparison
console.log('\n=== Actual Image Directory Structure ===\n');
const actualDirs = {};
imageFiles.forEach(img => {
    const dir = path.dirname(img.relativePath);
    if (!actualDirs[dir]) {
        actualDirs[dir] = [];
    }
    actualDirs[dir].push(path.basename(img.relativePath));
});

for (const [dir, files] of Object.entries(actualDirs)) {
    console.log(`${dir}:`);
    files.forEach(f => console.log(`  - ${f}`));
    console.log('');
}