const fs = require('fs/promises');
const path = require('path');

const baseDir = __dirname;
const referrerUrl = 'https://www.onlinegames.io/cat-runner/';
const referrerQuery = encodeURIComponent(referrerUrl);
const gdEndpoint = 'https://html5-portal-api.gamedistribution.com/graphql';
const gdQuery = `query Search($search:String,$offset:Int,$limit:Int){ results(search:$search, offset:$offset, limit:$limit){ title id description link displayLink } }`;

const categories = {
    Action: {
        folder: 'Action',
        file: 'js/game_data/action.js',
        varName: 'actionGames',
        keywordBase: 'action, combat, platformer, brawler'
    },
    BattleRoyale: {
        folder: 'BattleRoyale',
        file: 'js/game_data/battleRoyale.js',
        varName: 'battleRoyaleData',
        keywordBase: 'battle royale, survival, last standing'
    },
    FPS: {
        folder: 'FPS',
        file: 'js/game_data/fps.js',
        varName: 'fpsData',
        keywordBase: 'fps, shooter, first person shooter'
    },
    Multiplayer: {
        folder: 'Multiplayer',
        file: 'js/game_data/multiplayer.js',
        varName: 'multiplayerGames',
        keywordBase: 'multiplayer, online, io'
    },
    Sniper: {
        folder: 'Sniper',
        file: 'js/game_data/sniper.js',
        varName: 'sniperData',
        keywordBase: 'sniper, marksman, precision'
    }
};

const selection = {
    Action: [
        { title: 'Bullet Heroes', id: '366a198cba9742ad9a755dbef736743c' },
        { title: 'Strike Force: Action Platformer', id: '30c319848d544c30afbe82ad24fbac5b' },
        { title: 'Wreck The Tower', id: '11d063f81e1b41c99bf6d1a40c83eb37' },
        { title: 'Mecha Duel', id: 'e352461696b14d86bda7963cb2aaca8a' },
        { title: 'Stickman Brawler', id: 'cdcea02863574af4af2b24945e343f86' },
        { title: 'Dungeon Master Knight', id: '0d06ebfcd29443a8a8f88420cc57544d' },
        { title: 'Drunken Fighters', id: 'd0c31b0603f24b43b33e4b93d13d64bf' },
        { title: 'We Will Not Survive', id: 'b36bea78a87c40d896c663b899e96e60' },
        { title: 'Panda Dash Auto Shooting', id: '5b5d6fb2a240493f8b6dd34cb798d612' },
        { title: 'Cars with Guns: Wasteland Showdown', id: '0bd1e5d745554a4c9d1defd57dd91aa5' }
    ],
    BattleRoyale: [
        { title: "GunGame Poligon Battle Royale", id: 'c43c108ebd914fbfa9dddfcbcbadcae2' },
        { title: 'Zombie Survival Shooter', id: '53ad84c4f3b440f2b65d5382fadf731f' },
        { title: 'Battle Zone 2D', id: 'ca12cc5666a1430aa557452c3fbb0039' },
        { title: 'Zombie Last Survivor', id: '3b897ce6c7d94c65a23f05cc9319b536' },
        { title: 'Zombie Royale Io', id: '0ff430a7db394a58a3cae92dd5028942' },
        { title: 'Mine Shooter Monsters Royale', id: 'a84f74f938c9408e98b3bf8f7270a9f9' },
        { title: 'Last Standing', id: '5879ec933bf046dabef3ef2cccbd239d' },
        { title: 'Radiation Zone', id: '80b73feee06f4c8497a4e9fd0fd3e89c' },
        { title: 'Assault Zone', id: 'e0404d54bd7c4457a0687e843a9d5435' },
        { title: 'Dead Zone Mech Ops', id: 'b20ef15d895d4ebc840f64a3f70ba12b' }
    ],
    FPS: [
        { title: 'Pixel Arena Game FPS', id: '090a6a819ccb48b3ad0ea9457ef96770' },
        { title: 'WW2 Cold War Game Fps', id: 'fdc53cbb755243509b7a7722597ea11c' },
        { title: 'Pixel Fps SWAT Command', id: '91b6347341ec4febbcbead10ca311cf1' },
        { title: 'Shooting Zombie fps Xtreme Good vs Bad Boys', id: '483afadadbf943c8b2ec7d4594da012b' },
        { title: 'Zombie Virus FPS', id: 'd4f3e9184ee044669935ae5fedb89e81' },
        { title: 'Get To The Chopper', id: '32ba9ee1361648f2abf104bfa088ea3f' },
        { title: 'Stickman Gun Shooter', id: '2e53f90d22e74cef93eb9ac3533155cd' },
        { title: 'Real Bottle Shooter 3D', id: 'f4afd7f4fcdb43fd8acfa370460f89f7' },
        { title: 'Zombie Shooter 3D', id: 'b42d9c5983134c19a5a074eb78b40c31' },
        { title: 'Zombie Shooter D', id: '223c7220f1e54e82a62fc25e39ce6700' }
    ],
    Multiplayer: [
        { title: 'ColorWars.io - Conquest Game', id: 'ed99a63b0a35407792cbd1f93b7b7b83' },
        { title: 'ColorWars.io', id: 'eabf2a389dea46ed9b36fcb03482d443' },
        { title: 'Xeno Defense Protocol', id: '1ae04723ea2f42bab930af8997f01e72' },
        { title: 'Shell Strikers', id: 'b207ec567c824d109249a0cd7c552275' },
        { title: 'MergeDuel.io', id: '05017bab2dbe4802968bf84231e08e24' },
        { title: 'Survival On Raft Multiplayer', id: '8617ea5a6ce64ca78dc93c521ef8e9d3' },
        { title: 'Obby Modes! Online Mini-Games', id: '7fb77a35cb98418c9a8b16278e7b74b0' },
        { title: 'Murder Mystery', id: '38d45e35b9c24bd0b6029c1be21f0d05' },
        { title: 'SWAT Cats Shooter', id: 'bf6439db0088415593e786e19a04e5b3' },
        { title: 'CS: Chaos Squad', id: 'dec78e8b416948f19832618a64afb0d7' }
    ],
    Sniper: [
        { title: 'Sniper Master', id: '8bd8d8dc794c4bf0b3e04e3f8ca4203f' },
        { title: 'CS: Command Snipers', id: 'dae8b9a130704825bb0875ab51b5ef34' },
        { title: 'Sniper Team 3', id: '721b8b5b05f14963b4266a51d8a59e73' },
        { title: 'Sniper Wars: Find the Criminal', id: 'ee89787adb7b4ddcbb3eba00fee19581' },
        { title: 'Giant Wanted Monster', id: '036e270492174a10a16ab5d5ef91cb45' },
        { title: 'Sniper Shot Secret Mission', id: 'fb3caf6fcf6d4c7ab8b148642cf4657f' },
        { title: 'Hitman Sniper', id: 'cf85efb38c44487a99315c030f7e7ed6' },
        { title: 'Sniper 3D Zombie', id: 'd1a1e4c3d8d640358dd534fd79859577' },
        { title: 'Sniper Freeze', id: 'b50c92033fd94dde9239519b16b303e4' },
        { title: 'Tank Sniper 3D', id: '9c327672a2da42408f4602a2c1981100' }
    ]
};

function normalizeText(value) {
    return String(value || '')
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2013\u2014]/g, '-')
        .replace(/\u2026/g, '...')
        .replace(/\u00a0/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function escapeHtml(value) {
    return normalizeText(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function slugify(name) {
    return normalizeText(name)
        .replace(/[<>:"/\\|?*\u0000-\u001F]+/g, '_')
        .replace(/\s+/g, '_')
        .replace(/[^A-Za-z0-9_.-]+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
}

function buildIframeUrl(id) {
    return `https://html5.gamedistribution.com/${id}/?gd_sdk_referrer_url=${referrerQuery}`;
}

function buildImageUrl(id) {
    return `https://img.gamedistribution.com/${id}-512x512.jpg`;
}

function buildKeywords(title, categoryMeta) {
    return Array.from(new Set([
        title,
        categoryMeta.keywordBase,
        'open front',
        'open front game',
        'open front online',
        'browser game'
    ])).join(', ');
}

function buildDescription(title, apiDescription, categoryLabel) {
    const summary = normalizeText(apiDescription) || `${title} is a free online ${categoryLabel.toLowerCase()} game on open front.`;
    return summary.replace(/\s+/g, ' ');
}

async function gdSearch(search) {
    const response = await fetch(gdEndpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
            query: gdQuery,
            variables: { search, offset: 0, limit: 20 }
        })
    });
    if (!response.ok) {
        throw new Error(`GD search failed for "${search}": ${response.status}`);
    }
    const data = await response.json();
    return data.data?.results || [];
}

async function resolveGame(item) {
    const results = await gdSearch(item.title);
    const normalizedWanted = normalizeText(item.title).toLowerCase();
    const match = results.find((r) => r.id === item.id)
        || results.find((r) => normalizeText(r.title).toLowerCase() === normalizedWanted)
        || results[0];

    if (!match) {
        throw new Error(`No GD result found for ${item.title}`);
    }

    return {
        title: normalizeText(match.title || item.title),
        id: item.id,
        description: normalizeText(match.description || ''),
        sourceLink: match.link || `https://html5.gamedistribution.com/${item.id}/`
    };
}

function renderPage(game, categoryMeta, pageFileName, imageUrl) {
    const pageTitle = `${game.title} - Play Free Online | open front`;
    const description = buildDescription(game.title, game.description, categoryMeta.folder);
    const metaDescription = `${description} Play free on open front. No download required.`;
    const keywords = buildKeywords(game.title, categoryMeta);
    const canonical = `https://openfront.space/${categoryMeta.folder}/${pageFileName}`;

    const sectionCards = `
                    <span class="tag"><i class="fas fa-tag"></i> OPEN FRONT</span>
                    <span class="tag"><i class="fas fa-gamepad"></i> ${escapeHtml(categoryMeta.folder.toUpperCase())}</span>
                    <span class="tag"><i class="fas fa-bolt"></i> BROWSER GAME</span>
                    <span class="tag"><i class="fas fa-crosshairs"></i> ${escapeHtml(categoryMeta.folder)} MODE</span>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(pageTitle)}</title>
    <meta name="description" content="${escapeHtml(metaDescription)}">
    <meta name="keywords" content="${escapeHtml(keywords)}">
    <meta name="robots" content="index, follow">
    <meta name="author" content="open front">
    <link rel="canonical" href="${canonical}">
    <meta property="og:title" content="${escapeHtml(pageTitle)}">
    <meta property="og:description" content="${escapeHtml(metaDescription)}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${canonical}">
    <meta property="og:image" content="${imageUrl}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(pageTitle)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 50 50'><defs><linearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%23ff6b35'/><stop offset='100%25' stop-color='%23f7c59f'/></linearGradient></defs><polygon points='25,5 45,40 5,40' fill='none' stroke='url(%23g)' stroke-width='3'/></svg>">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="../css/css.css">
</head>
<body>
    <div class="particles" id="particles"></div>
    <div class="cursor-glow" id="cursorGlow"></div>
    <header class="header">
        <a href="../index.html" class="logo">
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
        </a>
        <nav class="nav-categories">
            <a href="../categories.html?category=action" class="nav-item">Action</a>
            <a href="../categories.html?category=battle-royale" class="nav-item">Battle</a>
            <a href="../categories.html?category=fps" class="nav-item">Shooter</a>
            <a href="../categories.html?category=multiplayer" class="nav-item">Multiplayer</a>
            <a href="../categories.html?category=sniper" class="nav-item">Sniper</a>
        </nav>
        <div class="search-bar">
            <input type="text" placeholder="Search games...">
            <i class="fas fa-search"></i>
        </div>
    </header>
    <div class="main-container">
        <main class="main-content">
            <div class="game-showcase">
                <div class="game-frame">
                    <iframe id="game-iframe" src="${buildIframeUrl(game.id)}" allowfullscreen></iframe>
                </div>
                <div class="game-controls">
                    <div class="game-title-section">
                        <img src="${imageUrl}" id="game-icon" class="game-icon" alt="${escapeHtml(game.title)}" onerror="this.src='../img/icon/veckIo.jpg'">
                        <span class="game-title" id="current-game-title">${escapeHtml(game.title)}</span>
                    </div>
                    <div class="game-actions">
                        <i class="fas fa-expand" onclick="toggleFullscreen()"></i>
                    </div>
                </div>
            </div>
            <div class="related-games">
                <h3 class="section-title">More Open Front Games</h3>
                <div class="games-grid" id="related-games-container"></div>
            </div>
            <div class="content-section">
                <div class="game-info">
                    <div class="info-header">Play ${escapeHtml(game.title)} instantly on open front.</div>
                    <div class="info-content">
                        <h2>ABOUT ${escapeHtml(game.title).toUpperCase()}</h2>
                        <p>${escapeHtml(description)}</p>
                    </div>
                    <div class="tags">${sectionCards}</div>
                </div>
            </div>
        </main>
    </div>
    <footer class="footer">
        <div class="footer-links">
            <a href="../index.html">About open front</a>
            <a href="../contact.html">Contact Us</a>
            <a href="../privacy-policy.html">Privacy Policy</a>
            <a href="../terms-of-service.html">Terms of Service</a>
        </div>
        <div class="footer-copyright">© 2024 open front - Free Online Games. All rights reserved.</div>
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
            const shuffledGames = shuffleArray(allGames).slice(0, 18);
            container.innerHTML = '';
            shuffledGames.forEach((game) => {
                const card = document.createElement('div');
                card.className = 'game-card';
                const img = document.createElement('img');
                img.src = game.imageUrl.startsWith('img/') ? '../' + game.imageUrl : game.imageUrl;
                img.alt = game.name;
                img.onerror = function () { this.src = '../img/icon/veckIo.jpg'; };
                const title = document.createElement('div');
                title.className = 'game-card-title';
                title.textContent = game.name;
                card.appendChild(img);
                card.appendChild(title);
                card.addEventListener('click', function () {
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
            } else if (iframe && iframe.requestFullscreen) {
                iframe.requestFullscreen();
            }
        }

        function initParticles() {
            const container = document.getElementById('particles');
            if (!container) return;
            for (let i = 0; i < 24; i++) {
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

        document.addEventListener('DOMContentLoaded', () => {
            loadRelatedGames();
            initParticles();
            initCursorGlow();
        });
    </script>
</body>
</html>`;
}

async function ensureDir(dirPath) {
    await fs.mkdir(dirPath, { recursive: true });
}

async function writeDataFile(categoryName, games) {
    const meta = categories[categoryName];
    const content = `var ${meta.varName} = ${JSON.stringify(games, null, 4)};\n`;
    await fs.writeFile(path.join(baseDir, meta.file), content, 'utf8');
}

async function updateSitemap(pagePaths) {
    const staticUrls = [
        'https://openfront.space/',
        'https://openfront.space/categories.html',
        'https://openfront.space/categories.html?category=action',
        'https://openfront.space/categories.html?category=battle-royale',
        'https://openfront.space/categories.html?category=fps',
        'https://openfront.space/categories.html?category=multiplayer',
        'https://openfront.space/categories.html?category=sniper',
        'https://openfront.space/privacy-policy.html',
        'https://openfront.space/terms-of-service.html',
        'https://openfront.space/contact.html',
        'https://openfront.space/cookie-policy.html'
    ];

    const allUrls = [
        ...staticUrls,
        ...pagePaths.map((relPath) => `https://openfront.space/${relPath.replace(/\\/g, '/')}`)
    ];

    const lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    ];

    allUrls.forEach((url) => {
        lines.push('  <url>');
        lines.push(`    <loc>${url}</loc>`);
        lines.push('    <changefreq>weekly</changefreq>');
        lines.push('    <priority>0.7</priority>');
        lines.push('  </url>');
    });

    lines.push('</urlset>');
    await fs.writeFile(path.join(baseDir, 'sitemap.xml'), lines.join('\n'), 'utf8');
}

async function main() {
    const generatedPagePaths = [];
    const selectedNames = new Set();

    for (const [categoryName, meta] of Object.entries(categories)) {
        const folderPath = path.join(baseDir, meta.folder);
        await ensureDir(folderPath);

        const items = selection[categoryName];
        const resolved = [];

        for (let index = 0; index < items.length; index++) {
            const item = items[index];
            const normalized = normalizeText(item.title).toLowerCase();
            if (selectedNames.has(normalized)) {
                throw new Error(`Duplicate title detected in selected games: ${item.title}`);
            }

            const match = await resolveGame(item);
            const fileBase = slugify(match.title);
            const pageFileName = `${fileBase}.html`;
            const imagePath = buildImageUrl(match.id);
            const pagePath = `${meta.folder}/${pageFileName}`;

            const rating = (4.1 + ((index + categoryName.length) % 8) * 0.1).toFixed(1);
            resolved.push({
                id: match.id,
                name: match.title,
                imageUrl: imagePath,
                gameType: meta.folder === 'BattleRoyale' ? 'Battle Royale' : meta.folder,
                rating,
                description: buildDescription(match.title, match.description, meta.folder),
                keywords: buildKeywords(match.title, meta),
                link: pagePath,
                tags: [
                    normalizeText(match.title).toLowerCase(),
                    meta.folder.toLowerCase(),
                    'open front',
                    'browser game'
                ],
                iframeUrl: buildIframeUrl(match.id)
            });

            const pageHtml = renderPage(match, meta, pageFileName, imagePath);
            await fs.writeFile(path.join(folderPath, pageFileName), pageHtml, 'utf8');
            generatedPagePaths.push(pagePath);
            selectedNames.add(normalized);
            console.log(`Created ${pagePath}`);
        }

        await writeDataFile(categoryName, resolved);
        console.log(`Updated ${meta.file} with ${resolved.length} games`);
    }

    await updateSitemap(generatedPagePaths);
    console.log(`Updated sitemap.xml with ${generatedPagePaths.length} game pages`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
