// 批量更新二级页面导航栏的脚本
const fs = require('fs');
const path = require('path');

// 要更新的文件夹列表
const folders = ['Action', 'BattleRoyale', 'FPS', 'Multiplayer', 'Sniper'];
const baseDir = 'f:\\DATA\\MyWorkspace\\h5game\\openfront';

// 新的导航栏 HTML
const newNavbar = `        <nav class="nav-categories">
            <a href="../categories.html?category=action" class="nav-item">Action</a>
            <a href="../categories.html?category=battle-royale" class="nav-item">Battle</a>
            <a href="../categories.html?category=fps" class="nav-item">Shooter</a>
            <a href="../categories.html?category=multiplayer" class="nav-item">Multiplayer</a>
            <a href="../categories.html?category=sniper" class="nav-item">Sniper</a>
        </nav>`;

// 旧的导航栏 HTML（用于匹配）
const oldNavbar = `        <nav class="nav-categories">
            <a href="../categories.html?category=fps" class="nav-item">FPS</a>
            <a href="../categories.html?category=battle-royale" class="nav-item">Battle Royale</a>
            <a href="../categories.html?category=sniper" class="nav-item">Sniper</a>
            <a href="../categories.html?category=multiplayer" class="nav-item">Multiplayer</a>
            <a href="../categories.html?category=action" class="nav-item">Action</a>
        </nav>`;

// 旧的导航栏 HTML（用于匹配更新后的版本）
const oldNavbarUpdated = `        <nav class="nav-categories">
            <a href="../categories.html?category=strategy" class="nav-item">Strategy</a>
            <a href="../categories.html?category=conquest" class="nav-item">Conquest</a>
            <a href="../categories.html?category=war" class="nav-item">War</a>
            <a href="../categories.html?category=multiplayer" class="nav-item">Multiplayer</a>
            <a href="../categories.html?category=battle" class="nav-item">Battle</a>
        </nav>`;

// 新的品牌图标和名称
const newLogo = `        <a href="../index.html" class="logo">
            <svg class="logo-icon" viewBox="0 0 50 50" width="45" height="45">
                <defs>
                    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#ff6b35;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#f7c59f;stop-opacity:1" />
                    </linearGradient>
                </defs>
                <polygon points="25,5 45,40 5,40" fill="none" stroke="url(#grad1)" stroke-width="3"/>
                <line x1="25" y1="15" x2="25" y2="30" stroke="#ff6b35" stroke-width="2"/>
                <line x1="20" y1="35" x2="30" y2="35" stroke="#ff6b35" stroke-width="2"/>
            </svg>
            <span class="logo-text">open <span class="logo-io">front</span></span>
        </a>`;

// 旧的品牌图标和名称（用于匹配）
const oldLogo = `        <div class="logo">
            <svg class="logo-icon" viewBox="0 0 50 50" width="45" height="45">
                <defs>
                    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#4ecca3;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#00d4ff;stop-opacity:1" />
                    </linearGradient>
                </defs>
                <circle cx="25" cy="25" r="20" fill="none" stroke="url(#grad1)" stroke-width="3"/>
                <circle cx="25" cy="25" r="12" fill="none" stroke="url(#grad1)" stroke-width="2"/>
                <circle cx="25" cy="25" r="4" fill="#4ecca3"/>
                <line x1="25" y1="0" x2="25" y2="15" stroke="#4ecca3" stroke-width="2"/>
                <line x1="25" y1="35" x2="25" y2="50" stroke="#4ecca3" stroke-width="2"/>
                <line x1="0" y1="25" x2="15" y2="25" stroke="#4ecca3" stroke-width="2"/>
                <line x1="35" y1="25" x2="50" y2="25" stroke="#4ecca3" stroke-width="2"/>
            </svg>
            <span class="logo-text">Veck<span class="logo-io">.io</span></span>
        </div>`;

// 旧的品牌图标和名称（用于匹配更新后的版本）
const oldLogoUpdated = `        <div class="logo">
            <svg class="logo-icon" viewBox="0 0 50 50" width="45" height="45">
                <defs>
                    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#ff6b35;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#f7c59f;stop-opacity:1" />
                    </linearGradient>
                </defs>
                <polygon points="25,5 45,40 5,40" fill="none" stroke="url(#grad1)" stroke-width="3"/>
                <line x1="25" y1="15" x2="25" y2="30" stroke="#ff6b35" stroke-width="2"/>
                <line x1="20" y1="35" x2="30" y2="35" stroke="#ff6b35" stroke-width="2"/>
            </svg>
            <span class="logo-text">open <span class="logo-io">front</span></span>
        </div>`;

// 新的页脚链接
const newFooterAbout = `<a href="#">About open front</a>`;
const oldFooterAbout = `<a href="#">About open front</a>`;

// 新的页脚版权信息
const newFooterCopyright = `<div class="footer-copyright">© 2024 open front - Free Online Strategy Games. All rights reserved.</div>`;
const oldFooterCopyright = `<div class="footer-copyright">© 2024 open front - Free Online Shooter Games. All rights reserved.</div>`;

// 新的 favicon
const newFavicon = `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 50 50'><defs><linearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%23ff6b35'/><stop offset='100%25' stop-color='%23f7c59f'/></linearGradient></defs><polygon points='25,5 45,40 5,40' fill='none' stroke='url(%23g)' stroke-width='3'/></svg>">`;
const oldFavicon = `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 50 50'><defs><linearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%234ecca3'/><stop offset='100%25' stop-color='%2300d4ff'/></linearGradient></defs><circle cx='25' cy='25' r='20' fill='none' stroke='url(%23g)' stroke-width='3'/><circle cx='25' cy='25' r='12' fill='none' stroke='url(%23g)' stroke-width='2'/><circle cx='25' cy='25' r='4' fill='%234ecca3'/></svg>">`;

// 处理每个文件夹
folders.forEach(folder => {
    const folderPath = path.join(baseDir, folder);
    
    // 检查文件夹是否存在
    if (!fs.existsSync(folderPath)) {
        console.log(`文件夹 ${folder} 不存在`);
        return;
    }
    
    // 读取文件夹中的所有 HTML 文件
    const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.html'));
    
    files.forEach(file => {
        const filePath = path.join(folderPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // 更新导航栏
        let updatedContent = content
            .replace(oldNavbar, newNavbar)
            .replace(oldNavbarUpdated, newNavbar)
            .replace(oldLogo, newLogo)
            .replace(oldLogoUpdated, newLogo)
            .replace(oldFooterAbout, newFooterAbout)
            .replace(oldFooterCopyright, newFooterCopyright)
            .replace(oldFavicon, newFavicon);
        
        // 写入更新后的内容
        fs.writeFileSync(filePath, updatedContent, 'utf8');
        console.log(`已更新 ${filePath}`);
    });
});

console.log('所有二级页面导航栏更新完成！');