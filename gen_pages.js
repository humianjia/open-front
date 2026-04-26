const fs = require('fs');
const path = require('path');

const gamePageTemplate = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GAME_NAME - Play Free Online | Veck.io</title>
    <meta name="description" content="GAME_DESCRIPTION Play GAME_NAME for free on Veck.io - Fast, browser-based multiplayer FPS games. No download required!">
    <meta name="keywords" content="GAME_KEYWORDS, veck io, veck io game, veck io FPS, veck io shooter">
    <meta name="robots" content="index, follow">
    <meta name="author" content="Veck.io">
    <link rel="canonical" href="https://veck.io/">
    <meta property="og:title" content="GAME_NAME - Play Free Online | Veck.io">
    <meta property="og:description" content="GAME_DESCRIPTION Play GAME_NAME for free on Veck.io!">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://veck.io/">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="GAME_NAME - Play Free Online | Veck.io">
    <meta name="twitter:description" content="GAME_DESCRIPTION">
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 50 50'><defs><linearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%234ecca3'/><stop offset='100%25' stop-color='%2300d4ff'/></linearGradient></defs><circle cx='25' cy='25' r='20' fill='none' stroke='url(%23g)' stroke-width='3'/><circle cx='25' cy='25' r='12' fill='none' stroke='url(%23g)' stroke-width='2'/><circle cx='25' cy='25' r='4' fill='%234ecca3'/></svg>">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="../css/css.css">
</head>
<body>
    <div class="particles" id="particles"></div>
    <div class="cursor-glow" id="cursorGlow"></div>
    <header class="header">
        <div class="logo">
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
        </div>
        <nav class="nav-categories">
            <a href="../categories.html?category=fps" class="nav-item">FPS</a>
            <a href="../categories.html?category=battle-royale" class="nav-item">Battle Royale</a>
            <a href="../categories.html?category=sniper" class="nav-item">Sniper</a>
            <a href="../categories.html?category=multiplayer" class="nav-item">Multiplayer</a>
            <a href="../categories.html?category=action" class="nav-item">Action</a>
        </nav>
        <div class="search-bar">
            <input type="text" placeholder="搜索游戏...">
            <i class="fas fa-search"></i>
        </div>
    </header>
    <div class="main-container">
        <main class="main-content">
            <div class="game-showcase">
                <div class="game-frame">
                    <iframe id="game-iframe" src="IFRAME_URL" allowfullscreen></iframe>
                </div>
                <div class="game-controls">
                    <div class="game-title-section">
                        <img src="GAME_IMAGE" id="game-icon" class="game-icon" alt="GAME_NAME">
                        <span class="game-title" id="current-game-title">GAME_NAME</span>
                    </div>
                    <div class="game-actions">
                        <i class="fas fa-expand" onclick="toggleFullscreen()"></i>
                    </div>
                </div>
            </div>
            <div class="related-games">
                <h3 class="section-title">Popular Shooter Games</h3>
                <div class="games-grid" id="related-games-container"></div>
            </div>
            <div class="content-section">
                <div class="game-info">
                    <div class="info-header">Welcome to Veck.io - A fast, browser-based 3D multiplayer FPS that delivers quick, intense arena battles. No downloads or installations required - just jump in and start shooting!</div>
                    <div class="info-content">
                        <h2>WHAT IS GAME_NAME?</h2>
                        <p>GAME_DESCRIPTION</p>
                    </div>
                    <div class="tags">
                        <span class="tag"><i class="fas fa-bullseye"></i> VECK IO</span>
                        <span class="tag"><i class="fas fa-gamepad"></i> GAME_TYPE</span>
                        <span class="tag"><i class="fas fa-crosshairs"></i> SHOOTER</span>
                        <span class="tag"><i class="fas fa-globe"></i> BROWSER GAME</span>
                    </div>
                </div>
            </div>
        </main>
    </div>
    <footer class="footer">
        <div class="footer-links">
            <a href="../#">About Veck.io</a>
            <a href="../#">Contact Us</a>
            <a href="../#">DMCA</a>
            <a href="../#">Privacy Policy</a>
            <a href="../#">Terms of Service</a>
        </div>
        <div class="footer-copyright">© 2024 Veck.io - Free Online Shooter Games. All rights reserved.</div>
    </footer>
    <script src="../js/game_data/games.js"></script>
    <script src="../js/game_data/action.js"></script>
    <script src="../js/game_data/battleRoyale.js"></script>
    <script src="../js/game_data/fps.js"></script>
    <script src="../js/game_data/multiplayer.js"></script>
    <script src="../js/game_data/sniper.js"></script>
    <script>
        function shuffleArray(array) {
            const shuffled = [...array];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
        }

        function loadRelatedGames() {
            const container = document.getElementById('related-games-container');
            if (!container) return;
            const allGames = [
                ...(window.gamesData || []),
                ...(window.actionGames || []),
                ...(window.battleRoyaleData || []),
                ...(window.fpsData || []),
                ...(window.multiplayerGames || []),
                ...(window.sniperData || [])
            ];
            if (allGames.length === 0) return;
            const shuffledGames = shuffleArray(allGames).slice(0, 21);
            container.innerHTML = '';
            shuffledGames.forEach((game) => {
                const card = document.createElement('div');
                card.className = 'game-card';
                const img = document.createElement('img');
                img.src = game.imageUrl.replace('img/', '../img/');
                img.alt = game.name;
                img.onerror = function() { this.src = '../img/icon/veckIo.jpg'; };
                const title = document.createElement('div');
                title.className = 'game-card-title';
                title.textContent = game.name;
                card.appendChild(img);
                card.appendChild(title);
                card.addEventListener('click', function() {
                    if (game.link) {
                        window.location.href = '../' + game.link;
                    }
                });
                container.appendChild(card);
            });
        }

        function toggleFullscreen() {
            const iframe = document.getElementById('game-iframe');
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                iframe.requestFullscreen();
            }
        }

        function initParticles() {
            const container = document.getElementById('particles');
            if (!container) return;
            for (let i = 0; i < 30; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.animationDelay = Math.random() * 20 + 's';
                particle.style.animationDuration = (15 + Math.random() * 10) + 's';
                particle.style.width = (3 + Math.random() * 4) + 'px';
                particle.style.height = particle.style.width;
                container.appendChild(particle);
            }
        }

        function initCursorGlow() {
            const glow = document.getElementById('cursorGlow');
            if (!glow) return;
            document.addEventListener('mousemove', (e) => {
                glow.style.left = e.clientX - 100 + 'px';
                glow.style.top = e.clientY - 100 + 'px';
            });
        }

        window.addEventListener('load', function() {
            loadRelatedGames();
        });

        initParticles();
        initCursorGlow();
    </script>
</body>
</html>`;

const dataFiles = [
    { file: 'js/game_data/action.js', category: 'Action' },
    { file: 'js/game_data/battleRoyale.js', category: 'BattleRoyale' },
    { file: 'js/game_data/fps.js', category: 'FPS' },
    { file: 'js/game_data/multiplayer.js', category: 'Multiplayer' },
    { file: 'js/game_data/sniper.js', category: 'Sniper' }
];

function sanitizeFileName(name) {
    return name.replace(/[<>:"/\\|?*:\s'´']/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

function parseGameData(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const match = content.match(/=\s*\[([\s\S]*?)\];?\s*$/m);
    if (!match) return [];
    try {
        const data = eval('[' + match[1] + ']');
        return Array.isArray(data) ? data : [];
    } catch (e) {
        return [];
    }
}

function createGamePage(game, category, outputDir) {
    const safeName = sanitizeFileName(game.name);
    const fileName = safeName + '.html';
    const relativeLink = category + '/' + fileName;

    const pageContent = gamePageTemplate
        .replace(/GAME_NAME/g, game.name)
        .replace(/GAME_DESCRIPTION/g, game.description || (game.name + ' - Play free online on Veck.io'))
        .replace(/GAME_KEYWORDS/g, game.keywords || game.name)
        .replace(/GAME_TYPE/g, game.gameType || category)
        .replace(/GAME_IMAGE/g, (game.imageUrl || 'img/icon/veckIo.jpg').replace('img/', '../img/'))
        .replace(/IFRAME_URL/g, game.iframeUrl || '');

    const filePath = path.join(outputDir, fileName);
    fs.writeFileSync(filePath, pageContent, 'utf-8');
    console.log('Created:', filePath, '| Link:', relativeLink);
}

const baseDir = __dirname;
let totalCount = 0;

dataFiles.forEach(({ file, category }) => {
    const fullPath = path.join(baseDir, file);
    if (!fs.existsSync(fullPath)) {
        console.log('Not found:', fullPath);
        return;
    }

    const games = parseGameData(fullPath);
    console.log('Processing', file + ':', games.length, 'games');

    if (games.length === 0) return;

    const outputDir = path.join(baseDir, category);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    games.forEach(game => {
        if (game.id && game.name) {
            createGamePage(game, category, outputDir);
            totalCount++;
        }
    });
});

console.log('Total:', totalCount, 'game pages generated');