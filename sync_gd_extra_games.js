const fs = require('fs/promises');
const path = require('path');

const baseDir = __dirname;
const gdEndpoint = 'https://html5-portal-api.gamedistribution.com/graphql';
const gdQuery = `query Search($search:String,$offset:Int,$limit:Int){ results(search:$search, offset:$offset, limit:$limit){ title id description link displayLink } }`;
const iframeBase = 'https://html5.gamedistribution.com';

const categoryOrder = ['BattleRoyale', 'Sniper', 'FPS', 'Multiplayer', 'Action'];

const categories = {
    BattleRoyale: {
        key: 'battle-royale',
        label: 'Battle Royale',
        folder: 'GD',
        varName: 'gdBattleRoyaleGames',
        searchTerms: ['battle royale', 'royale', 'battle', 'zone', 'survival', 'last standing', 'war', 'arena'],
        keywords: ['battle royale', 'royale', 'battle', 'zone', 'survival', 'last standing', 'arena', 'war']
    },
    Sniper: {
        key: 'sniper',
        label: 'Sniper',
        folder: 'GD',
        varName: 'gdSniperGames',
        searchTerms: ['sniper', 'marksman', 'hitman', 'hunter', 'assassin', 'scope', 'precision shooter', 'rifle'],
        keywords: ['sniper', 'marksman', 'hitman', 'hunter', 'assassin', 'scope', 'precision', 'rifle', 'target']
    },
    FPS: {
        key: 'fps',
        label: 'FPS',
        folder: 'GD',
        varName: 'gdFpsGames',
        searchTerms: ['fps', 'shooter', 'first person shooter', 'gun', 'zombie shooter', 'assault', 'combat', 'target shooting'],
        keywords: ['fps', 'shooter', 'first person shooter', 'gun', 'zombie', 'assault', 'combat', 'rifle', 'target']
    },
    Multiplayer: {
        key: 'multiplayer',
        label: 'Multiplayer',
        folder: 'GD',
        varName: 'gdMultiplayerGames',
        searchTerms: ['multiplayer', 'io', 'online', '2 player', 'squad', 'team', 'battle', 'arena'],
        keywords: ['multiplayer', '.io', 'online', '2 player', '2-player', 'squad', 'team', 'arena', 'versus']
    },
    Action: {
        key: 'action',
        label: 'Action',
        folder: 'GD',
        varName: 'gdActionGames',
        searchTerms: ['action', 'combat', 'brawler', 'platformer', 'duel', 'fight', 'adventure', 'ninja', 'mecha', 'stickman'],
        keywords: ['action', 'combat', 'brawler', 'platformer', 'duel', 'fight', 'adventure', 'ninja', 'mecha', 'stickman', 'dash', 'run']
    }
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
    return `${iframeBase}/${id}/?gd_sdk_referrer_url=https://www.onlinegames.io/cat-runner/`;
}

function buildImageUrl(id) {
    return `https://img.gamedistribution.com/${id}-512x512.jpeg`;
}

function normalizeGdImageUrl(url, id) {
    const source = normalizeText(url);
    return source || buildImageUrl(id);
}

function extractGdImageInfo(url) {
    const match = normalizeText(url).match(/img\.gamedistribution\.com\/([a-f0-9]{32})(?:-(\d+x\d+))?\.(jpg|jpeg|png|webp)(?=([?#]|$))/i);
    if (!match) {
        return null;
    }

    return {
        id: match[1],
        size: match[2] || '',
        extension: match[3].toLowerCase()
    };
}

function buildGdImageCandidates(id, preferredUrl) {
    const candidates = [];
    const info = extractGdImageInfo(preferredUrl);
    const imageId = info?.id || id;
    const sizes = Array.from(new Set([info?.size, '512x512', '512x384'].filter(Boolean)));
    const extensions = Array.from(new Set([info?.extension, 'jpeg', 'jpg'].filter(Boolean)));

    if (preferredUrl) {
        candidates.push(preferredUrl);
    }

    if (!imageId) {
        return [...new Set(candidates)];
    }

    for (const size of sizes) {
        for (const extension of extensions) {
            candidates.push(`https://img.gamedistribution.com/${imageId}-${size}.${extension}`);
        }
    }

    for (const extension of extensions) {
        candidates.push(`https://img.gamedistribution.com/${imageId}.${extension}`);
    }

    return [...new Set(candidates)];
}

async function canUseImageUrl(url) {
    if (!url) {
        return false;
    }

    try {
        const response = await fetch(url);
        try {
            await response.body?.cancel();
        } catch {
            // ignore cancellation issues on short-lived validation requests
        }
        return response.ok;
    } catch {
        return false;
    }
}

async function resolvePreferredImageUrl(id, preferredUrl) {
    const candidates = buildGdImageCandidates(id, preferredUrl);
    for (const candidate of candidates) {
        if (await canUseImageUrl(candidate)) {
            return candidate;
        }
    }

    return preferredUrl || buildImageUrl(id);
}

function buildKeywords(title, categoryMeta, sourceGenres) {
    return Array.from(new Set([
        title,
        categoryMeta.label,
        ...(sourceGenres || []),
        'open front',
        'open front game',
        'browser game',
        'html5 game',
        'gamedistribution'
    ])).join(', ');
}

function buildDescription(title, apiDescription, categoryLabel) {
    const summary = normalizeText(apiDescription) || `${title} is a free online ${categoryLabel.toLowerCase()} game on open front.`;
    return summary.replace(/\s+/g, ' ');
}

function getExistingGames() {
    const files = [
        'js/game_data/games.js',
        'js/game_data/action.js',
        'js/game_data/battleRoyale.js',
        'js/game_data/fps.js',
        'js/game_data/multiplayer.js',
        'js/game_data/sniper.js'
    ];

    const games = [];
    for (const file of files) {
        const fullPath = path.join(baseDir, file);
        const content = require('fs').readFileSync(fullPath, 'utf8');
        const match = content.match(/=\s*(\[[\s\S]*\]);?\s*$/);
        if (!match) continue;
        try {
            const parsed = eval(match[1]); // existing data files are simple array literals
            if (Array.isArray(parsed)) {
                games.push(...parsed);
            }
        } catch (error) {
            console.warn(`Failed to parse ${file}: ${error.message}`);
        }
    }

    return games;
}

async function gdSearch(search) {
    const response = await fetch(gdEndpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
            query: gdQuery,
            variables: { search, offset: 0, limit: 60 }
        })
    });

    if (!response.ok) {
        throw new Error(`GD search failed for "${search}": ${response.status}`);
    }

    const data = await response.json();
    return data.data?.results || [];
}

function scoreCandidate(candidate, categoryMeta) {
    const title = normalizeText(candidate.title).toLowerCase();
    const description = normalizeText(candidate.description).toLowerCase();
    const combined = `${title} ${description}`;
    const hits = Array.isArray(candidate.hits) ? candidate.hits : [];

    const keywordScore = categoryMeta.keywords.reduce((score, keyword) => {
        const normalizedKeyword = normalizeText(keyword).toLowerCase();
        if (!normalizedKeyword) return score;
        return score + (combined.includes(normalizedKeyword) ? 1 : 0);
    }, 0);

    const titleScore = categoryMeta.keywords.reduce((score, keyword) => {
        const normalizedKeyword = normalizeText(keyword).toLowerCase();
        if (!normalizedKeyword) return score;
        return score + (title.includes(normalizedKeyword) ? 2 : 0);
    }, 0);

    return hits.length * 10 + titleScore + keywordScore;
}

function extractJsonLd(html) {
    const match = html.match(/<script type=application\/ld\+json>([\s\S]*?)<\/script>/i);
    if (!match) return null;
    try {
        return JSON.parse(match[1]);
    } catch {
        return null;
    }
}

async function fetchGamePageMeta(id) {
    const response = await fetch(`${iframeBase}/${id}/`);
    if (!response.ok) {
        return { sourceGenres: [], imageUrl: buildImageUrl(id) };
    }

    const html = await response.text();
    const jsonLd = extractJsonLd(html) || {};
    const ogImageMatch = html.match(/<meta property=og:image content=([^ >]+)>/i);
    const rawImageUrl = ogImageMatch ? normalizeGdImageUrl(ogImageMatch[1].replace(/["']/g, ''), id) : buildImageUrl(id);
    const sourceGenres = Array.isArray(jsonLd.genre) ? jsonLd.genre.map(normalizeText).filter(Boolean) : [];
    return {
        sourceGenres,
        pageDescription: normalizeText(jsonLd.description || ''),
        creator: normalizeText(jsonLd.creator?.name || ''),
        publisher: normalizeText(jsonLd.publisher?.name || ''),
        imageUrl: await resolvePreferredImageUrl(id, rawImageUrl)
    };
}

async function collectCandidates(categoryMeta, existingIds, existingTitles, usedIds, usedTitles) {
    const candidateMap = new Map();

    for (const term of categoryMeta.searchTerms) {
        const results = await gdSearch(term);
        for (const item of results) {
            if (!item || !item.id || !item.title) continue;
            const current = candidateMap.get(item.id) || {
                id: item.id,
                title: normalizeText(item.title),
                description: normalizeText(item.description || ''),
                hits: new Set()
            };
            current.description = current.description || normalizeText(item.description || '');
            current.hits.add(term);
            candidateMap.set(item.id, current);
        }
    }

    const ranked = [...candidateMap.values()]
        .map((candidate) => ({
            ...candidate,
            score: scoreCandidate(candidate, categoryMeta)
        }))
        .filter((candidate) => candidate.score > 0)
        .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));

    const selected = [];
    for (const candidate of ranked) {
        const normalizedTitle = normalizeText(candidate.title).toLowerCase();
        if (selected.length >= 20) break;
        if (existingIds.has(candidate.id) || usedIds.has(candidate.id)) continue;
        if (existingTitles.has(normalizedTitle) || usedTitles.has(normalizedTitle)) continue;

        const meta = await fetchGamePageMeta(candidate.id);
        const sourceGenres = meta.sourceGenres || [];
        const description = buildDescription(candidate.title, meta.pageDescription || candidate.description, categoryMeta.label);
        const fileName = `${categoryMeta.key.replace(/[^a-z0-9]+/gi, '_')}_${slugify(candidate.title)}_${candidate.id.slice(0, 8)}.html`;
        const pagePath = `${categoryMeta.folder}/${fileName}`;

        selected.push({
            id: candidate.id,
            name: candidate.title,
            imageUrl: meta.imageUrl || buildImageUrl(candidate.id),
            gameType: categoryMeta.label,
            rating: Math.max(4.1, Math.min(4.9, 4.2 + Math.min(candidate.score, 8) * 0.07)).toFixed(1),
            description,
            keywords: buildKeywords(candidate.title, categoryMeta, sourceGenres),
            link: pagePath,
            tags: [
                normalizeText(candidate.title).toLowerCase(),
                categoryMeta.key,
                'open front',
                'browser game'
            ],
            iframeUrl: buildIframeUrl(candidate.id),
            sourceGenres,
            sourceCompany: meta.creator,
            sourcePublisher: meta.publisher
        });

        usedIds.add(candidate.id);
        usedTitles.add(normalizedTitle);
    }

    if (selected.length < 20) {
        throw new Error(`Not enough GD games selected for ${categoryMeta.label}: ${selected.length}/20`);
    }

    return selected;
}

function renderPage(game, categoryMeta, pageFileName) {
    const pageTitle = `${game.name} - Play Free Online | open front`;
    const metaDescription = `${buildDescription(game.name, game.description, categoryMeta.label)} Play free on open front. No download required.`;
    const canonical = `https://www.openfront.space/${categoryMeta.folder}/${pageFileName}`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(pageTitle)}</title>
    <meta name="description" content="${escapeHtml(metaDescription)}">
    <meta name="keywords" content="${escapeHtml(game.keywords)}">
    <meta name="robots" content="index, follow">
    <meta name="author" content="open front">
    <link rel="canonical" href="${canonical}">
    <meta property="og:title" content="${escapeHtml(pageTitle)}">
    <meta property="og:description" content="${escapeHtml(metaDescription)}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${canonical}">
    <meta property="og:image" content="${game.imageUrl}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(pageTitle)}">
    <meta name="twitter:description" content="${escapeHtml(game.description)}">
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
                    <iframe id="game-iframe" src="${game.iframeUrl}" allowfullscreen></iframe>
                </div>
                <div class="game-controls">
                    <div class="game-title-section">
                        <img id="game-icon" class="game-icon" alt="${escapeHtml(game.name)}">
                        <span class="game-title" id="current-game-title">${escapeHtml(game.name)}</span>
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
                    <div class="info-header">Play ${escapeHtml(game.name)} instantly on open front.</div>
                    <div class="info-content">
                        <h2>ABOUT ${escapeHtml(game.name).toUpperCase()}</h2>
                        <p>${escapeHtml(game.description)}</p>
                    </div>
                    <div class="tags">
                        <span class="tag"><i class="fas fa-tag"></i> OPEN FRONT</span>
                        <span class="tag"><i class="fas fa-gamepad"></i> ${escapeHtml(categoryMeta.label.toUpperCase())}</span>
                        <span class="tag"><i class="fas fa-bolt"></i> BROWSER GAME</span>
                        <span class="tag"><i class="fas fa-crosshairs"></i> ${escapeHtml(categoryMeta.label)} MODE</span>
                    </div>
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
    <script src="../js/game_data/gd_extra.js"></script>
    <script src="../js/i18n.js"></script>
    <script>
        const currentGameId = ${JSON.stringify(game.id)};
        const currentGameLink = ${JSON.stringify(game.link)};
        const currentGameName = ${JSON.stringify(game.name)};
        const currentGameImageUrl = ${JSON.stringify(game.imageUrl)};
        const currentGameIframeUrl = ${JSON.stringify(game.iframeUrl)};

        function escapeSvgText(value) {
            return String(value || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        function createGameImagePlaceholder(title) {
            const safeTitle = escapeSvgText(title || 'Open Front');
            const svg = [
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360">',
                '<defs>',
                '<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">',
                '<stop offset="0%" stop-color="#071019" />',
                '<stop offset="50%" stop-color="#0f1f2f" />',
                '<stop offset="100%" stop-color="#08141f" />',
                '</linearGradient>',
                '</defs>',
                '<rect width="640" height="360" fill="url(#bg)" />',
                '<rect x="18" y="18" width="604" height="324" rx="18" fill="none" stroke="rgba(141,247,255,0.28)" stroke-width="2" />',
                '<text x="320" y="176" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#f5fbff">' + safeTitle + '</text>',
                '<text x="320" y="214" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="rgba(245,251,255,0.62)" letter-spacing="4">OPEN FRONT</text>',
                '</svg>'
            ].join('');
            return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
        }

        function resolveImageUrl(src) {
            if (!src) return '';
            return src.startsWith('img/') ? '../' + src : src;
        }

        function getGameImageSources(game) {
            const sources = [];
            if (game && game.imageUrl) {
                sources.push(resolveImageUrl(game.imageUrl));
            }

            const iframeMatch = String(game && game.iframeUrl ? game.iframeUrl : '').match(/html5\\.gamedistribution\\.com\\/([a-f0-9]{32})/i);
            if (iframeMatch) {
                sources.push('https://img.gamedistribution.com/' + iframeMatch[1] + '-512x512.jpeg');
            }

            sources.push('../img/icon/veckIo.jpg');
            sources.push(createGameImagePlaceholder(game && game.name ? game.name : 'Open Front'));

            return [...new Set(sources)];
        }

        function bindGameImage(img, sources) {
            if (!img || !Array.isArray(sources) || sources.length === 0) return;

            let sourceIndex = 0;
            img.referrerPolicy = 'strict-origin-when-cross-origin';
            img.loading = 'lazy';
            img.decoding = 'async';

            img.onerror = function () {
                sourceIndex += 1;
                if (sourceIndex >= sources.length) {
                    img.onerror = null;
                    return;
                }
                img.src = sources[sourceIndex];
            };

            img.src = sources[sourceIndex];
        }

        function shuffleArray(array) {
            const shuffled = [...array];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
        }

        function getAllGames() {
            return [
                ...(window.gamesData || []),
                ...(window.actionGames || []),
                ...(window.battleRoyaleData || []),
                ...(window.fpsData || []),
                ...(window.multiplayerGames || []),
                ...(window.sniperData || []),
                ...(window.gdActionGames || []),
                ...(window.gdBattleRoyaleGames || []),
                ...(window.gdFpsGames || []),
                ...(window.gdMultiplayerGames || []),
                ...(window.gdSniperGames || [])
            ];
        }

        function resolveImageSrc(game) {
            if (!game || !game.imageUrl) return '../img/icon/veckIo.jpg';
            return game.imageUrl.startsWith('img/') ? '../' + game.imageUrl : game.imageUrl;
        }

        function loadRelatedGames() {
            const container = document.getElementById('related-games-container');
            if (!container) return;

            const allGames = getAllGames().filter((game) => game && game.id !== currentGameId && game.link !== currentGameLink);
            const games = shuffleArray(allGames).slice(0, 21);

            const gameIcon = document.getElementById('game-icon');
            if (gameIcon) {
                bindGameImage(gameIcon, getGameImageSources({
                    imageUrl: currentGameImageUrl,
                    iframeUrl: currentGameIframeUrl,
                    name: currentGameName
                }));
            }

            container.innerHTML = '';
            games.forEach((game) => {
                const card = document.createElement('div');
                card.className = 'game-card';
                const img = document.createElement('img');
                img.alt = game.name || 'Game';
                bindGameImage(img, getGameImageSources(game));
                const title = document.createElement('div');
                title.className = 'game-card-title';
                title.textContent = game.name || 'Game';
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
            if (!iframe) return;
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else if (iframe.requestFullscreen) {
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

        document.addEventListener('DOMContentLoaded', function () {
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

async function writeDataFile(generated) {
    const lines = [
        `var ${categories.BattleRoyale.varName} = ${JSON.stringify(generated.BattleRoyale, null, 4)};`,
        `var ${categories.Sniper.varName} = ${JSON.stringify(generated.Sniper, null, 4)};`,
        `var ${categories.FPS.varName} = ${JSON.stringify(generated.FPS, null, 4)};`,
        `var ${categories.Multiplayer.varName} = ${JSON.stringify(generated.Multiplayer, null, 4)};`,
        `var ${categories.Action.varName} = ${JSON.stringify(generated.Action, null, 4)};`
    ];

    await fs.writeFile(path.join(baseDir, 'js/game_data/gd_extra.js'), `${lines.join('\n\n')}\n`, 'utf8');
}

async function main() {
    const existingGames = getExistingGames();
    const existingIds = new Set(existingGames.map((game) => String(game.id || '').trim()).filter(Boolean));
    const existingTitles = new Set(existingGames.map((game) => normalizeText(game.name).toLowerCase()).filter(Boolean));
    const usedIds = new Set();
    const usedTitles = new Set();
    const generated = {};

    await ensureDir(path.join(baseDir, 'GD'));

    for (const categoryName of categoryOrder) {
        const categoryMeta = categories[categoryName];
        const selected = await collectCandidates(categoryMeta, existingIds, existingTitles, usedIds, usedTitles);
        generated[categoryName] = selected;

        for (const game of selected) {
            const fileName = path.basename(game.link);
            const pageHtml = renderPage(game, categoryMeta, fileName);
            await fs.writeFile(path.join(baseDir, 'GD', fileName), pageHtml, 'utf8');
        }

        console.log(`Generated ${selected.length} ${categoryMeta.label} games`);
    }

    await writeDataFile(generated);
    console.log('Updated js/game_data/gd_extra.js');
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
