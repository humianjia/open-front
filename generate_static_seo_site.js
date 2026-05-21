const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = __dirname;
const BASE_URL = 'https://openfront.space';

const LANGS = {
    en: { dir: '', hreflang: 'en', htmlLang: 'en', label: 'EN' },
    fr: { dir: 'fr', hreflang: 'fr', htmlLang: 'fr-FR', label: 'FR' },
    ja: { dir: 'ja', hreflang: 'ja', htmlLang: 'ja-JP', label: 'JP' },
    pl: { dir: 'pl', hreflang: 'pl', htmlLang: 'pl-PL', label: 'PL' },
    nl: { dir: 'nl-BE', hreflang: 'nl-BE', htmlLang: 'nl-BE', label: 'BE' },
    de: { dir: 'de', hreflang: 'de', htmlLang: 'de-DE', label: 'DE' }
};

const LANG_ORDER = ['en', 'fr', 'ja', 'pl', 'nl', 'de'];
const PAGE_FILES = [
    'index.html',
    'categories.html',
    'contact.html',
    'privacy-policy.html',
    'terms-of-service.html',
    'cookie-policy.html'
];

const GAME_DATA_FILES = [
    { file: 'js/game_data/games.js', vars: ['gamesData'] },
    { file: 'js/game_data/action.js', vars: ['actionGames'] },
    { file: 'js/game_data/battleRoyale.js', vars: ['battleRoyaleData'] },
    { file: 'js/game_data/fps.js', vars: ['fpsData'] },
    { file: 'js/game_data/multiplayer.js', vars: ['multiplayerGames'] },
    { file: 'js/game_data/sniper.js', vars: ['sniperData'] },
    { file: 'js/game_data/gd_extra.js', vars: ['gdBattleRoyaleGames', 'gdSniperGames', 'gdFpsGames', 'gdMultiplayerGames', 'gdActionGames'] }
];

const BRAND_PLACEHOLDERS = {
    '__OPENFRONT_SPACE__': 'openfront.space',
    '__OPEN_FRONT_TITLE__': 'Open Front',
    '__OPEN_FRONT__': 'open front',
    '__OUVERT_FRONT__': 'open front',
    '__OPEN_VOOR__': 'open front',
    '__OTWARTY_PRZEDNI__': 'open front',
    '__DMCA__': 'DMCA',
    '__UTC_PLUS_8__': 'UTC+8',
    '__HTML5__': 'HTML5',
    '__FPS__': 'FPS',
    '__MIRV__': 'MIRV',
    '__SAM__': 'SAM',
    '__DOT_IO__': '.io',
    '__VAR_NAME__': '{name}',
    '__VAR_COUNT__': '{count}',
    '__VAR_DATE__': '{date}',
    '__VAR_CATEGORY__': '{category}'
};

function loadVmFile(filePath, context) {
    const source = fs.readFileSync(path.join(ROOT, filePath), 'utf8');
    vm.runInContext(source, context, { filename: filePath });
}

function loadI18nData() {
    const context = { window: {} };
    vm.createContext(context);
    loadVmFile('js/i18n-data.js', context);
    return context.window.openFrontI18nData || {};
}

function loadGameCollections() {
    const context = {};
    vm.createContext(context);
    GAME_DATA_FILES.forEach((item) => loadVmFile(item.file, context));

    const groups = [];
    GAME_DATA_FILES.forEach((item) => {
        item.vars.forEach((name) => {
            const value = context[name];
            if (Array.isArray(value)) {
                groups.push(...value);
            }
        });
    });
    return groups;
}

function normalizeText(value) {
    return String(value || '')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#x27;/gi, "'")
        .replace(/&#x2F;/gi, '/')
        .replace(/\r\n/g, '\n')
        .replace(/\u00a0/g, ' ')
        .replace(/[\u0000-\u001F\u007F\u2028\u2029]+/g, ' ')
        .replace(/\\n/g, ' ')
        .replace(/\\r/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/<[^>]*>/g, ' ')
        .trim();
}

function sanitizeI18nText(value) {
    let text = normalizeText(value);
    Object.keys(BRAND_PLACEHOLDERS).forEach((token) => {
        text = text.split(token).join(BRAND_PLACEHOLDERS[token]);
    });
    text = text.replace(/__.+?__/g, 'open front');
    return text.replace(/\s+/g, ' ').trim();
}

function assetUrl(url) {
    const value = String(url || '').trim();
    if (!value) return value;
    if (/^(?:https?:|data:|\/\/)/i.test(value)) return value;
    return value.startsWith('/') ? value : `/${value}`;
}

function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, '&#96;');
}

function safePathSegment(segment) {
    return String(segment || '').replace(/\\/g, '/').replace(/^\/+/, '');
}

function pageKeyForPath(relPath) {
    const clean = safePathSegment(relPath);
    if (!clean || clean === 'index.html') return 'home';
    if (clean === 'categories.html') return 'categories';
    if (clean === 'contact.html') return 'contact';
    if (clean === 'privacy-policy.html') return 'privacy';
    if (clean === 'terms-of-service.html') return 'terms';
    if (clean === 'cookie-policy.html') return 'cookie';
    return 'detail';
}

function localizedUrl(langKey, relPath) {
    const lang = LANGS[langKey];
    const clean = safePathSegment(relPath);
    if (!lang) return `/${clean}`;
    if (langKey === 'en') {
        if (!clean || clean === 'index.html') return '/';
        return `/${clean}`;
    }
    if (!clean || clean === 'index.html') return `/${lang.dir}/`;
    return `/${lang.dir}/${clean}`;
}

function canonicalUrl(langKey, relPath) {
    return `${BASE_URL}${localizedUrl(langKey, relPath)}`;
}

function fsOutputPath(langKey, relPath) {
    const clean = safePathSegment(relPath) || 'index.html';
    if (langKey === 'en') {
        return path.join(ROOT, clean);
    }
    return path.join(ROOT, LANGS[langKey].dir, clean);
}

function pageDirPath(langKey, relPath) {
    return path.dirname(fsOutputPath(langKey, relPath));
}

function relativePageUrl(fromLangKey, fromRelPath, toLangKey, toRelPath) {
    const fromDir = pageDirPath(fromLangKey, fromRelPath);
    const targetPath = fsOutputPath(toLangKey, toRelPath);
    const rel = path.relative(fromDir, targetPath).replace(/\\/g, '/');
    return rel || 'index.html';
}

function relativeResourceUrl(fromLangKey, fromRelPath, resourcePath) {
    const value = String(resourcePath || '').trim();
    if (!value) return value;
    if (/^(?:https?:|data:|\/\/)/i.test(value)) return value;
    const fromDir = pageDirPath(fromLangKey, fromRelPath);
    const targetPath = path.join(ROOT, safePathSegment(value));
    const rel = path.relative(fromDir, targetPath).replace(/\\/g, '/');
    return rel || path.basename(targetPath);
}

function ensureDirForFile(filePath) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function getLocalizedPageCopy(data, pageKey, langKey) {
    const page = (data.pages && data.pages[pageKey]) || {};
    return page[langKey] || page.en || {};
}

function getLocalizedUi(data, langKey) {
    return (data.ui && data.ui[langKey]) || (data.ui && data.ui.en) || {};
}

function getLocalizedGame(data, relPath, langKey) {
    const entry = (data.games && data.games[relPath]) || null;
    if (!entry) return null;
    return entry[langKey] || entry.en || null;
}

function getLanguageSwitcherHtml(langKey, relPath) {
    const buttons = LANG_ORDER.map((code) => {
        const cfg = LANGS[code];
        const href = relativePageUrl(langKey, relPath, code, relPath);
        const active = code === langKey ? ' active' : '';
        return `<a class="${active ? 'active' : ''}" href="${href}" hreflang="${cfg.hreflang}">${cfg.label}</a>`;
    }).join('');

    return `<div class="language-switcher">${buttons}</div>`;
}

function getHreflangHtml(relPath) {
    return LANG_ORDER.map((code) => {
        const cfg = LANGS[code];
        return `<link rel="alternate" hreflang="${cfg.hreflang}" href="${canonicalUrl(code, relPath)}">`;
    }).concat(`<link rel="alternate" hreflang="x-default" href="${canonicalUrl('en', relPath)}">`).join('\n    ');
}

function getCommonHead({ langKey, relPath, title, description, keywords, image, extraMeta = '' }) {
    const canonical = canonicalUrl(langKey, relPath);
    const lang = LANGS[langKey];
    const cssHref = relativeResourceUrl(langKey, relPath, '/css/css.css');
    const categoriesHref = relativeResourceUrl(langKey, relPath, '/categories.css');
    return `<!DOCTYPE html>
<html lang="${lang.htmlLang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeAttr(description)}">
    ${keywords ? `<meta name="keywords" content="${escapeAttr(keywords)}">` : ''}
    <meta name="robots" content="index, follow">
    <meta name="author" content="open front">
    <link rel="canonical" href="${canonical}">
    ${getHreflangHtml(relPath)}
    <meta property="og:title" content="${escapeAttr(title)}">
    <meta property="og:description" content="${escapeAttr(description)}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${canonical}">
    ${image ? `<meta property="og:image" content="${escapeAttr(assetUrl(image))}">` : ''}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeAttr(title)}">
    <meta name="twitter:description" content="${escapeAttr(description)}">
    ${image ? `<meta name="twitter:image" content="${escapeAttr(assetUrl(image))}">` : ''}
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2050%2050%22%3E%3Cpolygon%20points%3D%2225%2C5%2045%2C40%205%2C40%22%20fill%3D%22none%22%20stroke%3D%22%23ff6b35%22%20stroke-width%3D%223%22%2F%3E%3C%2Fsvg%3E">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="${escapeAttr(cssHref)}">
    <link rel="stylesheet" href="${escapeAttr(categoriesHref)}">
    <style>
        .language-switcher {
            position: fixed;
            top: 14px;
            right: 14px;
            z-index: 9999;
            display: flex;
            gap: 6px;
            padding: 6px;
            border-radius: 999px;
            background: rgba(0, 0, 0, 0.55);
            backdrop-filter: blur(16px);
            box-shadow: 0 12px 28px rgba(0, 0, 0, 0.22);
        }
        .language-switcher a {
            border: 1px solid rgba(78, 204, 163, 0.22);
            background: rgba(255, 255, 255, 0.06);
            color: rgba(255, 255, 255, 0.76);
            border-radius: 999px;
            padding: 6px 10px;
            font-size: 12px;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.2s ease;
        }
        .language-switcher a:hover {
            color: #fff;
            border-color: rgba(78, 204, 163, 0.48);
            background: rgba(78, 204, 163, 0.18);
        }
        .language-switcher a.active {
            color: #0f172a;
            background: #4ecca3;
            border-color: #4ecca3;
        }
        @media (max-width: 768px) {
            .language-switcher {
                top: 10px;
                right: 10px;
                gap: 4px;
                padding: 4px;
            }
            .language-switcher a {
                padding: 5px 8px;
                font-size: 11px;
            }
        }
        ${extraMeta}
    </style>
</head>`;
}

function getHeader(langKey, uiCopy) {
    const hrefBase = relativePageUrl(langKey, 'index.html', langKey, '');
    const cat = (slug) => `${relativePageUrl(langKey, 'index.html', langKey, 'categories.html')}#${slug}`;
    const allLabel = sanitizeI18nText((uiCopy.categories && uiCopy.categories.all) || 'All Games');
    const actionLabel = sanitizeI18nText((uiCopy.nav && uiCopy.nav.action) || 'Action');
    const battleRoyaleLabel = sanitizeI18nText((uiCopy.nav && uiCopy.nav['battle-royale']) || 'Battle Royale');
    const fpsLabel = sanitizeI18nText((uiCopy.nav && uiCopy.nav.fps) || 'Shooter');
    const multiplayerLabel = sanitizeI18nText((uiCopy.nav && uiCopy.nav.multiplayer) || 'Multiplayer');
    const sniperLabel = sanitizeI18nText((uiCopy.nav && uiCopy.nav.sniper) || 'Sniper');
    const searchPlaceholder = sanitizeI18nText(uiCopy.searchPlaceholder || 'Search games...');
    return `<header class="header">
        <a href="${hrefBase}" class="logo">
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
            <a href="${cat('all')}" class="nav-item">${escapeHtml(allLabel)}</a>
            <a href="${cat('action')}" class="nav-item">${escapeHtml(actionLabel)}</a>
            <a href="${cat('battle-royale')}" class="nav-item">${escapeHtml(battleRoyaleLabel)}</a>
            <a href="${cat('fps')}" class="nav-item">${escapeHtml(fpsLabel)}</a>
            <a href="${cat('multiplayer')}" class="nav-item">${escapeHtml(multiplayerLabel)}</a>
            <a href="${cat('sniper')}" class="nav-item">${escapeHtml(sniperLabel)}</a>
        </nav>
        <div class="search-bar">
            <input type="text" placeholder="${escapeAttr(searchPlaceholder)}">
            <i class="fas fa-search"></i>
        </div>
    </header>`;
}

function getFooter(langKey, uiCopy) {
    const map = uiCopy.footerLinks || {};
    const aboutLabel = sanitizeI18nText(map.about || 'About open front');
    const contactLabel = sanitizeI18nText(map.contact || 'Contact Us');
    const privacyLabel = sanitizeI18nText(map.privacy || 'Privacy Policy');
    const termsLabel = sanitizeI18nText(map.terms || 'Terms of Service');
    const cookieLabel = sanitizeI18nText(map.cookie || 'Cookie Policy');
    const copyrightText = sanitizeI18nText(uiCopy.footerCopyright || '漏 2024 open front');
    return `<footer class="footer">
        <div class="footer-links">
            <a href="${relativePageUrl(langKey, 'index.html', langKey, '')}">${escapeHtml(aboutLabel)}</a>
            <a href="${relativePageUrl(langKey, 'index.html', langKey, 'contact.html')}">${escapeHtml(contactLabel)}</a>
            <a href="${relativePageUrl(langKey, 'index.html', langKey, 'privacy-policy.html')}">${escapeHtml(privacyLabel)}</a>
            <a href="${relativePageUrl(langKey, 'index.html', langKey, 'terms-of-service.html')}">${escapeHtml(termsLabel)}</a>
            <a href="${relativePageUrl(langKey, 'index.html', langKey, 'cookie-policy.html')}">${escapeHtml(cookieLabel)}</a>
        </div>
        <div class="footer-copyright">${escapeHtml(uiCopy.footerCopyright || '© 2024 open front')}</div>
    </footer>`;
}

function getAllGames(baseGames) {
    const seen = new Set();
    return baseGames.filter((game) => {
        const key = String(game.link || game.id || game.name).toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function categoryKeyFromGame(game) {
    const type = normalizeText(game.gameType).toLowerCase();
    const link = String(game.link || '').toLowerCase();
    if (link === 'index.html') return 'strategy';
    if (type.includes('battle')) return 'battle-royale';
    if (type.includes('sniper') || link.includes('/sniper/')) return 'sniper';
    if (type.includes('multiplayer') || link.includes('/multiplayer/')) return 'multiplayer';
    if (type.includes('fps') || type.includes('shooter') || link.includes('/fps/')) return 'fps';
    if (type.includes('action') || link.includes('/action/')) return 'action';
    return 'all';
}

function titleCase(value) {
    return String(value || '')
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

function getCategoryLabel(uiCopy, key) {
    const categories = uiCopy.categories || {};
    const labels = {
        all: sanitizeI18nText(categories.all || 'All Games'),
        action: sanitizeI18nText(categories.action || 'Action'),
        'battle-royale': sanitizeI18nText(categories['battle-royale'] || 'Battle Royale'),
        fps: sanitizeI18nText(categories.fps || 'Shooter'),
        multiplayer: sanitizeI18nText(categories.multiplayer || 'Multiplayer'),
        sniper: sanitizeI18nText(categories.sniper || 'Sniper'),
        strategy: sanitizeI18nText(categories.index || 'Strategy')
    };
    return labels[key] || titleCase(key);
}

function buildGameIndex(baseGames) {
    const out = {};
    baseGames.forEach((game) => {
        if (!game.link) return;
        out[game.link] = game;
    });
    return out;
}

function buildCategoryBuckets(baseGames) {
    const buckets = {
        all: [],
        action: [],
        'battle-royale': [],
        fps: [],
        multiplayer: [],
        sniper: []
    };

    baseGames.forEach((game) => {
        const key = categoryKeyFromGame(game);
        if (key === 'strategy' || !buckets[key]) return;
        buckets.all.push(game);
        buckets[key].push(game);
    });

    Object.keys(buckets).forEach((key) => {
        buckets[key] = buckets[key].filter((item, index, arr) => arr.findIndex((g) => g.link === item.link) === index);
    });
    return buckets;
}

function pickFeaturedGames(allGames, excludeLink, limit = 18) {
    return allGames
        .filter((game) => game.link !== excludeLink)
        .slice(0, limit);
}

function sortRelatedGames(allGames, currentGame) {
    const currentKey = categoryKeyFromGame(currentGame);
    return allGames
        .filter((game) => game.link !== currentGame.link)
        .map((game) => ({
            game,
            score: categoryKeyFromGame(game) === currentKey ? 0 : 1
        }))
        .sort((a, b) => {
            if (a.score !== b.score) return a.score - b.score;
            return normalizeText(a.game.name).localeCompare(normalizeText(b.game.name));
        })
        .map((item) => item.game)
        .slice(0, 18);
}

function buildGameCard(game, langKey, fromRelPath = 'index.html') {
    const href = relativePageUrl(langKey, fromRelPath, langKey, game.link);
    const image = relativeResourceUrl(langKey, fromRelPath, game.imageUrl || '/img/icon/veckIo.jpg');
    const fallback = relativeResourceUrl(langKey, fromRelPath, '/img/icon/veckIo.jpg');
    return `<a class="game-card" href="${href}" style="text-decoration:none;color:inherit;">
        <img src="${escapeAttr(image)}" alt="${escapeAttr(game.name)}" loading="lazy" onerror="this.onerror=null;this.src='${escapeAttr(fallback)}'">
        <div class="game-card-title">${escapeHtml(game.name)}</div>
    </a>`;
}

function buildCategoryItem(game, langKey, categoryLabel, fromRelPath = 'index.html') {
    const href = relativePageUrl(langKey, fromRelPath, langKey, game.link);
    const image = relativeResourceUrl(langKey, fromRelPath, game.imageUrl || '/img/icon/veckIo.jpg');
    const fallback = relativeResourceUrl(langKey, fromRelPath, '/img/icon/veckIo.jpg');
    const rating = escapeHtml(game.rating || '4.8');
    return `<a class="game-item" href="${href}" style="text-decoration:none;color:inherit;">
        <div class="game-item-image">
            <img src="${escapeAttr(image)}" alt="${escapeAttr(game.name)}" loading="lazy" onerror="this.onerror=null;this.src='${escapeAttr(fallback)}'">
        </div>
        <div class="game-item-info">
            <h4 class="game-item-title">${escapeHtml(game.name)}</h4>
            <div class="game-item-category">${escapeHtml(categoryLabel)}</div>
            <div class="game-item-stats">
                <span>${rating} ★</span>
                <span>open front</span>
            </div>
        </div>
    </a>`;
}

function renderHomePage(langKey, data, baseGames) {
    const uiCopy = getLocalizedUi(data, langKey);
    const pageCopy = getLocalizedPageCopy(data, 'home', langKey);
    const featured = baseGames[0];
    const featuredCopy = getLocalizedGame(data, 'index.html', langKey) || getLocalizedGame(data, featured.link, langKey) || featured;
    const allGames = getAllGames(baseGames);
    const relatedGames = pickFeaturedGames(allGames, featured.link, 18);

    const relPath = 'index.html';
    const title = sanitizeI18nText(pageCopy.metaTitle || 'Open Front');
    const description = sanitizeI18nText(pageCopy.metaDescription || '');
    const keywords = sanitizeI18nText(pageCopy.metaKeywords || '');
    const intro = sanitizeI18nText(pageCopy.intro || '');
    const sectionHtml = (pageCopy.sections || []).map((section, index) => {
        const headingTag = index === 0 ? 'h2' : 'h3';
        const heading = sanitizeI18nText(section.heading || '');
        const paragraphs = (section.paragraphs || []).map((p) => `<p>${escapeHtml(sanitizeI18nText(p))}</p>`).join('');
        const items = Array.isArray(section.items) && section.items.length
            ? `<ul>${section.items.map((item) => `<li><strong>${escapeHtml(sanitizeI18nText(item.label || ''))}:</strong> ${escapeHtml(sanitizeI18nText(item.text || ''))}</li>`).join('')}</ul>`
            : '';
        return `<${headingTag}>${escapeHtml(heading)}</${headingTag}>${paragraphs}${items}`;
    }).join('');
    const tags = (pageCopy.tags || []).map((tag, index) => {
        const icons = ['globe', 'chess', 'flag', 'users', 'shield-alt', 'ship', 'bomb', 'rocket'];
        const icon = icons[index] || 'tag';
        return `<span class="tag"><i class="fas fa-${icon}"></i>${escapeHtml(sanitizeI18nText(tag))}</span>`;
    }).join('');

    const html = `${getCommonHead({
        langKey,
        relPath,
        title,
        description,
        keywords,
        image: assetUrl(featuredCopy.imageUrl || featured.imageUrl)
    })}
<body>
    <div class="particles" id="particles"></div>
    <div class="cursor-glow" id="cursorGlow"></div>
    ${getLanguageSwitcherHtml(langKey, relPath)}
    ${getHeader(langKey, uiCopy)}
    <div class="main-container">
        <main class="main-content">
            <div class="game-showcase">
                <div class="game-frame">
                    <iframe id="game-iframe" src="${escapeAttr(featuredCopy.iframeUrl || featured.iframeUrl || '')}" allowfullscreen></iframe>
                </div>
                <div class="game-controls">
                    <div class="game-title-section">
                        <img src="${escapeAttr(relativeResourceUrl(langKey, relPath, featuredCopy.imageUrl || featured.imageUrl || '/img/icon/veckIo.jpg'))}" id="game-icon" class="game-icon" alt="${escapeAttr(featuredCopy.name || featured.name)}" onerror="this.src='${escapeAttr(relativeResourceUrl(langKey, relPath, '/img/icon/veckIo.jpg'))}'">
                        <span class="game-title" id="current-game-title">${escapeHtml(featuredCopy.name || featured.name)}</span>
                    </div>
                    <div class="game-actions">
                        <i class="fas fa-expand" onclick="toggleFullscreen()"></i>
                    </div>
                </div>
            </div>
            <div class="related-games">
                <h3 class="section-title">${escapeHtml(sanitizeI18nText(pageCopy.relatedTitle || 'More Open Front Games'))}</h3>
                <div class="games-grid" id="related-games-container">
                    ${relatedGames.map((game) => buildGameCard(game, langKey)).join('')}
                </div>
            </div>
            <div class="content-section">
                <div class="game-info">
                    <div class="info-header">${escapeHtml(intro)}</div>
                    <div class="info-content">
                        ${sectionHtml}
                    </div>
                    <div class="tags">${tags}</div>
                </div>
            </div>
        </main>
    </div>
    ${getFooter(langKey, uiCopy)}
    <script>
        function toggleFullscreen() {
            var iframe = document.getElementById('game-iframe');
            if (!iframe) return;
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else if (iframe.requestFullscreen) {
                iframe.requestFullscreen();
            }
        }
        (function () {
            var container = document.getElementById('particles');
            if (container) {
                for (var i = 0; i < 24; i++) {
                    var particle = document.createElement('div');
                    particle.className = 'particle';
                    particle.style.left = Math.random() * 100 + '%';
                    particle.style.animationDelay = Math.random() * 20 + 's';
                    particle.style.animationDuration = (15 + Math.random() * 10) + 's';
                    particle.style.width = (3 + Math.random() * 4) + 'px';
                    particle.style.height = particle.style.width;
                    container.appendChild(particle);
                }
            }
            var glow = document.getElementById('cursorGlow');
            if (glow) {
                document.addEventListener('mousemove', function (e) {
                    glow.style.left = e.clientX - 100 + 'px';
                    glow.style.top = e.clientY - 100 + 'px';
                });
            }
        })();
    </script>
</body>
</html>`;

    return html;
}

function renderCategoriesPage(langKey, data, baseGames) {
    const uiCopy = getLocalizedUi(data, langKey);
    const pageCopy = getLocalizedPageCopy(data, 'categories', langKey);
    const buckets = buildCategoryBuckets(baseGames);
    const relPath = 'categories.html';
    const title = sanitizeI18nText(pageCopy.metaTitle || 'Open Front Categories');
    const description = sanitizeI18nText(pageCopy.metaDescription || '');
    const keywords = sanitizeI18nText(pageCopy.metaKeywords || '');
    const allGames = getAllGames(baseGames);
    const sections = ['all', 'action', 'battle-royale', 'fps', 'multiplayer', 'sniper'].map((key) => {
        const games = key === 'all' ? allGames : (buckets[key] || []);
        const label = getCategoryLabel(uiCopy, key);
        const cards = games.map((game) => buildCategoryItem(game, langKey, label, relPath)).join('');
        return `<section class="games-section" id="${key}">
            <h3 class="section-title">${escapeHtml(label)}</h3>
            <div class="games-list">${cards}</div>
        </section>`;
    }).join('');

    const cards = ['all', 'action', 'battle-royale', 'fps', 'multiplayer', 'sniper'].map((key) => {
        const count = key === 'all' ? allGames.length : (buckets[key] || []).length;
        const label = getCategoryLabel(uiCopy, key);
        return `<a href="#${key}" class="category-card">
            <div class="category-icon"><i class="fas fa-${key === 'all' ? 'gamepad' : key === 'battle-royale' ? 'skull' : key === 'fps' ? 'crosshairs' : key === 'multiplayer' ? 'users' : key === 'sniper' ? 'bullseye' : 'fist-raised'}"></i></div>
            <h3>${escapeHtml(label)}</h3>
            <p>${escapeHtml(String((uiCopy.countTemplate || '{count} games').replace('{count}', String(count))))}</p>
            <span class="category-arrow"><i class="fas fa-arrow-right"></i></span>
        </a>`;
    }).join('');

    return `${getCommonHead({
        langKey,
        relPath,
        title,
        description,
        keywords
    })}
<body>
    <div class="particles" id="particles"></div>
    <div class="cursor-glow" id="cursorGlow"></div>
    ${getLanguageSwitcherHtml(langKey, relPath)}
    ${getHeader(langKey, uiCopy)}
    <div class="main-container">
        <main class="main-content">
            <div class="page-header">
                <h1 class="page-title">${escapeHtml(sanitizeI18nText(pageCopy.pageTitle || 'Game Categories'))}</h1>
                <p class="page-subtitle">${escapeHtml(sanitizeI18nText(pageCopy.pageSubtitle || ''))}</p>
            </div>
            <section class="categories-grid">
                ${cards}
            </section>
            ${sections}
        </main>
    </div>
    ${getFooter(langKey, uiCopy)}
    <script>
        (function () {
            var container = document.getElementById('particles');
            if (container) {
                for (var i = 0; i < 24; i++) {
                    var particle = document.createElement('div');
                    particle.className = 'particle';
                    particle.style.left = Math.random() * 100 + '%';
                    particle.style.animationDelay = Math.random() * 20 + 's';
                    particle.style.animationDuration = (15 + Math.random() * 10) + 's';
                    particle.style.width = (3 + Math.random() * 4) + 'px';
                    particle.style.height = particle.style.width;
                    container.appendChild(particle);
                }
            }
            var glow = document.getElementById('cursorGlow');
            if (glow) {
                document.addEventListener('mousemove', function (e) {
                    glow.style.left = e.clientX - 100 + 'px';
                    glow.style.top = e.clientY - 100 + 'px';
                });
            }
        })();
    </script>
</body>
</html>`;
}

function renderContactPage(langKey, data) {
    const uiCopy = getLocalizedUi(data, langKey);
    const pageCopy = getLocalizedPageCopy(data, 'contact', langKey);
    const relPath = 'contact.html';
    const title = sanitizeI18nText(pageCopy.metaTitle || 'Contact Us - open front');
    const description = sanitizeI18nText(pageCopy.metaDescription || '');
    const methods = (pageCopy.methods || []).map((method) => {
        return `<div class="contact-item">
            <i class="${escapeAttr(method.icon || 'fas fa-envelope')}"></i>
            <h3>${escapeHtml(sanitizeI18nText(method.title || ''))}</h3>
            <p>${escapeHtml(sanitizeI18nText(method.description || ''))}</p>
            <a href="${escapeAttr(method.href || '#')}"${String(method.href || '').startsWith('http') ? ' target="_blank" rel="noopener noreferrer"' : ''}>${escapeHtml(sanitizeI18nText(method.linkText || ''))}</a>
        </div>`;
    }).join('');
    const faqs = (pageCopy.faqs || []).map((faq) => `<h3 style="color:#e94560;margin-top:20px;">${escapeHtml(sanitizeI18nText(faq.question || ''))}</h3><p>${escapeHtml(sanitizeI18nText(faq.answer || ''))}</p>`).join('');
    const hours = (pageCopy.hours || []).map((line) => `<p>${escapeHtml(sanitizeI18nText(line))}</p>`).join('');
    const linksIntro = escapeHtml(sanitizeI18nText(pageCopy.linksIntro || ''));
    const extraStyles = `
        .contact-container {
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 20px;
            background: #1a1a2e;
            min-height: 100vh;
        }
        .contact-header {
            text-align: center;
            margin-bottom: 40px;
        }
        .contact-header h1 {
            color: #ff6b35;
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        .contact-header p {
            color: #888;
            font-size: 1.1em;
        }
        .contact-section {
            background: #16213e;
            padding: 30px;
            margin-bottom: 20px;
            border-radius: 10px;
            border-left: 4px solid #ff6b35;
        }
        .contact-section h2 {
            color: #ff6b35;
            margin-bottom: 20px;
            font-size: 1.5em;
        }
        .contact-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .contact-item {
            background: #0f3460;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            transition: transform 0.3s;
        }
        .contact-item:hover {
            transform: translateY(-5px);
        }
        .contact-item i {
            font-size: 2em;
            color: #ff6b35;
            margin-bottom: 10px;
        }
        .contact-item h3 {
            color: #e94560;
            margin: 10px 0;
        }
        .contact-item p {
            color: #e0e0e0;
            line-height: 1.6;
        }
        .contact-item a {
            color: #ff6b35;
            text-decoration: none;
        }
        .contact-item a:hover {
            text-decoration: underline;
        }
        .back-link {
            display: inline-block;
            margin-bottom: 20px;
            color: #ff6b35;
            text-decoration: none;
            font-weight: bold;
        }
        .back-link:hover {
            text-decoration: underline;
        }
        .response-time {
            background: #e94560;
            color: white;
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
            text-align: center;
        }
        .response-time strong {
            color: #ff6b35;
        }`;

    return `${getCommonHead({
        langKey,
        relPath,
        title,
        description
    , extraMeta: extraStyles })}
<body>
    ${getLanguageSwitcherHtml(langKey, relPath)}
    <div class="contact-container">
        <a href="${relativePageUrl(langKey, relPath, langKey, '')}" class="back-link">← ${escapeHtml(sanitizeI18nText(uiCopy.backToHome || 'Back to Home'))}</a>
        <div class="contact-header">
            <h1>${escapeHtml(sanitizeI18nText(pageCopy.title || 'Contact Us'))}</h1>
            <p>${escapeHtml(sanitizeI18nText(pageCopy.intro || ''))}</p>
        </div>
        <div class="contact-section">
            <h2>${escapeHtml(sanitizeI18nText(pageCopy.sectionTitle || 'Get in Touch'))}</h2>
            <p style="color:#e0e0e0;line-height:1.8;">${escapeHtml(sanitizeI18nText(pageCopy.intro || ''))}</p>
            <div class="contact-info">${methods}</div>
            <div class="response-time"><strong>${escapeHtml(sanitizeI18nText(uiCopy.footerLinks && uiCopy.footerLinks.contact ? uiCopy.footerLinks.contact : 'Contact Us'))}:</strong> ${escapeHtml(sanitizeI18nText(pageCopy.responseTime || ''))}</div>
        </div>
        <div class="contact-section">
            <h2>${escapeHtml(sanitizeI18nText(pageCopy.faqTitle || 'Frequently Asked Questions'))}</h2>
            <div style="color:#e0e0e0;line-height:1.8;">${faqs}</div>
        </div>
        <div class="contact-section">
            <h2>${escapeHtml(sanitizeI18nText(pageCopy.hoursTitle || 'Office Hours'))}</h2>
            <div style="color:#e0e0e0;line-height:1.8;">${hours}</div>
        </div>
        <div class="contact-section">
            <h2>${escapeHtml(sanitizeI18nText(pageCopy.linksTitle || 'Important Links'))}</h2>
            <div style="color:#e0e0e0;line-height:1.8;">
                <p>${linksIntro}</p>
                <ul style="padding-left:20px;margin-top:10px;">
                    <li><a href="${relativePageUrl(langKey, relPath, langKey, 'privacy-policy.html')}" style="color:#ff6b35;">${escapeHtml((uiCopy.footerLinks && uiCopy.footerLinks.privacy) || 'Privacy Policy')}</a></li>
                    <li><a href="${relativePageUrl(langKey, relPath, langKey, 'terms-of-service.html')}" style="color:#ff6b35;">${escapeHtml((uiCopy.footerLinks && uiCopy.footerLinks.terms) || 'Terms of Service')}</a></li>
                    <li><a href="${relativePageUrl(langKey, relPath, langKey, 'cookie-policy.html')}" style="color:#ff6b35;">${escapeHtml((uiCopy.footerLinks && uiCopy.footerLinks.cookie) || 'Cookie Policy')}</a></li>
                </ul>
            </div>
        </div>
    </div>
</body>
</html>`;
}

function renderPolicyPage(langKey, data, pageKey, containerClass, sectionClass) {
    const uiCopy = getLocalizedUi(data, langKey);
    const pageCopy = getLocalizedPageCopy(data, pageKey, langKey);
    const relPath = pageKey === 'privacy' ? 'privacy-policy.html' : pageKey === 'terms' ? 'terms-of-service.html' : 'cookie-policy.html';
    const title = sanitizeI18nText(pageCopy.metaTitle || pageCopy.title || '');
    const description = sanitizeI18nText(pageCopy.metaDescription || '');

    const sections = (pageCopy.sections || []).map((section) => {
        const heading = escapeHtml(sanitizeI18nText(section.heading || ''));
        const paragraphs = (section.paragraphs || []).map((paragraph) => `<p>${escapeHtml(sanitizeI18nText(paragraph))}</p>`).join('');
        const items = Array.isArray(section.items) && section.items.length
            ? `<ul>${section.items.map((item) => `<li><strong>${escapeHtml(sanitizeI18nText(item.label || ''))}:</strong> ${escapeHtml(sanitizeI18nText(item.text || ''))}</li>`).join('')}</ul>`
            : '';
        const table = section.table ? `<table class="cookie-table"><thead><tr>${section.table.headers.map((header) => `<th>${escapeHtml(sanitizeI18nText(header || ''))}</th>`).join('')}</tr></thead><tbody>${section.table.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(sanitizeI18nText(cell || ''))}</td>`).join('')}</tr>`).join('')}</tbody></table>` : '';
        return `<div class="${sectionClass}"><h2>${heading}</h2>${paragraphs}${items}${table}</div>`;
    }).join('');
    const extraStyles = `
        .${containerClass} {
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 20px;
            background: #1a1a2e;
            min-height: 100vh;
        }
        .${containerClass.replace('-container', '-header')} {
            text-align: center;
            margin-bottom: 40px;
        }
        .${containerClass.replace('-container', '-header')} h1 {
            color: #ff6b35;
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        .${containerClass.replace('-container', '-header')} p {
            color: #888;
        }
        .${sectionClass} {
            background: #16213e;
            padding: 30px;
            margin-bottom: 20px;
            border-radius: 10px;
            border-left: 4px solid #ff6b35;
        }
        .${sectionClass} h2 {
            color: #ff6b35;
            margin-bottom: 15px;
            font-size: 1.5em;
        }
        .${sectionClass} h3 {
            color: #e94560;
            margin: 20px 0 10px 0;
            font-size: 1.2em;
        }
        .${sectionClass} p, .${sectionClass} ul {
            color: #e0e0e0;
            line-height: 1.8;
        }
        .${sectionClass} ul {
            padding-left: 20px;
        }
        .${sectionClass} li {
            margin-bottom: 10px;
        }
        .cookie-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        .cookie-table th, .cookie-table td {
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 10px;
            text-align: left;
        }
        .cookie-table th {
            background: rgba(255, 107, 53, 0.15);
        }
        .back-link {
            display: inline-block;
            margin-bottom: 20px;
            color: #ff6b35;
            text-decoration: none;
            font-weight: bold;
        }
        .back-link:hover {
            text-decoration: underline;
        }`;

    return `${getCommonHead({
        langKey,
        relPath,
        title,
        description
    , extraMeta: extraStyles })}
<body>
    ${getLanguageSwitcherHtml(langKey, relPath)}
    <div class="${containerClass}">
        <a href="${relativePageUrl(langKey, relPath, langKey, '')}" class="back-link">← ${escapeHtml(sanitizeI18nText(uiCopy.backToHome || 'Back to Home'))}</a>
        <div class="${containerClass.replace('-container', '-header')}">
            <h1>${escapeHtml(sanitizeI18nText(pageCopy.title || ''))}</h1>
            <p>${escapeHtml(sanitizeI18nText(pageCopy.updatedOn ? `${uiCopy.lastUpdatedTemplate || 'Last updated: {date}'}`.replace('{date}', pageCopy.updatedOn) : pageCopy.intro || ''))}</p>
        </div>
        ${sections}
    </div>
</body>
</html>`;
}

function renderDetailPage(langKey, data, baseGame, baseGames) {
    const uiCopy = getLocalizedUi(data, langKey);
    const pageCopy = getLocalizedPageCopy(data, 'home', langKey);
    const relPath = baseGame.link;
    const gameCopy = getLocalizedGame(data, baseGame.link, langKey) || baseGame;
    const relatedTitle = sanitizeI18nText((uiCopy.detail && uiCopy.detail.relatedTitle) || 'More Open Front Games');
    const headerText = sanitizeI18nText((uiCopy.detail && uiCopy.detail.headerTemplate) || 'Play {name} instantly on open front.').replace('{name}', gameCopy.name);
    const aboutText = sanitizeI18nText((uiCopy.detail && uiCopy.detail.aboutTemplate) || 'About {name}').replace('{name}', gameCopy.name);
    const title = sanitizeI18nText((uiCopy.detail && uiCopy.detail.titleTemplate) || '{name} - Play Free Online | open front').replace('{name}', gameCopy.name);
    const descTemplate = sanitizeI18nText((uiCopy.detail && uiCopy.detail.metaDescriptionTemplate) || '{description} Play free on open front. No download required.');
    const metaDescription = descTemplate.replace('{description}', sanitizeI18nText(gameCopy.description || baseGame.description || ''));
    const keywords = [
        gameCopy.name,
        sanitizeI18nText(baseGame.gameType || ''),
        'open front',
        'browser game'
    ].filter(Boolean).join(', ');
    const categoryLabel = getCategoryLabel(uiCopy, categoryKeyFromGame(baseGame));
    const relatedGames = sortRelatedGames(baseGames, baseGame);
    const relatedCards = relatedGames.map((game) => buildGameCard(game, langKey, relPath)).join('');
    const tags = Array.isArray(gameCopy.tags) && gameCopy.tags.length
        ? gameCopy.tags
        : [sanitizeI18nText((uiCopy.detail && uiCopy.detail.tagBrand) || 'open front'), sanitizeI18nText(baseGame.gameType || ''), sanitizeI18nText(uiCopy.browserGame || 'Browser game'), `${categoryLabel} mode`];
    const tagHtml = tags.slice(0, 8).map((tag, index) => {
        const icons = ['tag', 'gamepad', 'bolt', 'crosshairs', 'globe', 'chess', 'users', 'shield-alt'];
        const icon = icons[index] || 'tag';
        return `<span class="tag"><i class="fas fa-${icon}"></i> ${escapeHtml(sanitizeI18nText(tag))}</span>`;
    }).join('');

    return `${getCommonHead({
        langKey,
        relPath,
        title,
        description: metaDescription,
        keywords,
        image: assetUrl(gameCopy.imageUrl || baseGame.imageUrl)
    })}
<body>
    <div class="particles" id="particles"></div>
    <div class="cursor-glow" id="cursorGlow"></div>
    ${getLanguageSwitcherHtml(langKey, relPath)}
    <header class="header">
        <a href="${relativePageUrl(langKey, relPath, langKey, '')}" class="logo">
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
            <a href="${relativePageUrl(langKey, relPath, langKey, 'categories.html')}#action" class="nav-item">${escapeHtml(getCategoryLabel(uiCopy, 'action'))}</a>
            <a href="${relativePageUrl(langKey, relPath, langKey, 'categories.html')}#battle-royale" class="nav-item">${escapeHtml(getCategoryLabel(uiCopy, 'battle-royale'))}</a>
            <a href="${relativePageUrl(langKey, relPath, langKey, 'categories.html')}#fps" class="nav-item">${escapeHtml(getCategoryLabel(uiCopy, 'fps'))}</a>
            <a href="${relativePageUrl(langKey, relPath, langKey, 'categories.html')}#multiplayer" class="nav-item">${escapeHtml(getCategoryLabel(uiCopy, 'multiplayer'))}</a>
            <a href="${relativePageUrl(langKey, relPath, langKey, 'categories.html')}#sniper" class="nav-item">${escapeHtml(getCategoryLabel(uiCopy, 'sniper'))}</a>
        </nav>
        <div class="search-bar">
            <input type="text" placeholder="${escapeAttr(uiCopy.searchPlaceholder || 'Search games...')}">
            <i class="fas fa-search"></i>
        </div>
    </header>
    <div class="main-container">
        <main class="main-content">
            <div class="game-showcase">
                <div class="game-frame">
                    <iframe id="game-iframe" src="${escapeAttr(gameCopy.iframeUrl || baseGame.iframeUrl || '')}" allowfullscreen></iframe>
                </div>
                <div class="game-controls">
                    <div class="game-title-section">
                        <img src="${escapeAttr(relativeResourceUrl(langKey, relPath, gameCopy.imageUrl || baseGame.imageUrl || '/img/icon/veckIo.jpg'))}" id="game-icon" class="game-icon" alt="${escapeAttr(gameCopy.name)}" onerror="this.src='${escapeAttr(relativeResourceUrl(langKey, relPath, '/img/icon/veckIo.jpg'))}'">
                        <span class="game-title" id="current-game-title">${escapeHtml(gameCopy.name)}</span>
                    </div>
                    <div class="game-actions">
                        <i class="fas fa-expand" onclick="toggleFullscreen()"></i>
                    </div>
                </div>
            </div>
            <div class="related-games">
                <h3 class="section-title">${escapeHtml(relatedTitle)}</h3>
                <div class="games-grid" id="related-games-container">${relatedCards}</div>
            </div>
            <div class="content-section">
                <div class="game-info">
                    <div class="info-header">${escapeHtml(headerText)}</div>
                    <div class="info-content">
                        <h2>${escapeHtml(aboutText)}</h2>
                        <p>${escapeHtml(sanitizeI18nText(gameCopy.description || baseGame.description || ''))}</p>
                    </div>
                    <div class="tags">${tagHtml}</div>
                </div>
            </div>
        </main>
    </div>
    ${getFooter(langKey, uiCopy)}
    <script>
        function toggleFullscreen() {
            var iframe = document.getElementById('game-iframe');
            if (!iframe) return;
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else if (iframe.requestFullscreen) {
                iframe.requestFullscreen();
            }
        }
        (function () {
            var container = document.getElementById('particles');
            if (container) {
                for (var i = 0; i < 24; i++) {
                    var particle = document.createElement('div');
                    particle.className = 'particle';
                    particle.style.left = Math.random() * 100 + '%';
                    particle.style.animationDelay = Math.random() * 20 + 's';
                    particle.style.animationDuration = (15 + Math.random() * 10) + 's';
                    particle.style.width = (3 + Math.random() * 4) + 'px';
                    particle.style.height = particle.style.width;
                    container.appendChild(particle);
                }
            }
            var glow = document.getElementById('cursorGlow');
            if (glow) {
                document.addEventListener('mousemove', function (e) {
                    glow.style.left = e.clientX - 100 + 'px';
                    glow.style.top = e.clientY - 100 + 'px';
                });
            }
        })();
    </script>
</body>
</html>`;
}

function buildBaseGames() {
    const context = {};
    vm.createContext(context);
    GAME_DATA_FILES.forEach((item) => loadVmFile(item.file, context));

    const sourceOrder = [
        ['gamesData', 'index.html'],
        ['actionGames', 'Action'],
        ['battleRoyaleData', 'BattleRoyale'],
        ['fpsData', 'FPS'],
        ['multiplayerGames', 'Multiplayer'],
        ['sniperData', 'Sniper'],
        ['gdBattleRoyaleGames', 'GD'],
        ['gdSniperGames', 'GD'],
        ['gdFpsGames', 'GD'],
        ['gdMultiplayerGames', 'GD'],
        ['gdActionGames', 'GD']
    ];

    const all = [];
    sourceOrder.forEach(([name]) => {
        const collection = context[name];
        if (Array.isArray(collection)) {
            collection.forEach((game) => {
                if (!game || !game.link || !game.name) return;
                all.push({
                    id: game.id || game.link,
                    name: normalizeText(game.name),
                    description: normalizeText(game.description || ''),
                    gameType: normalizeText(game.gameType || ''),
                    keywords: normalizeText(game.keywords || ''),
                    link: normalizeText(game.link),
                    imageUrl: normalizeText(game.imageUrl || ''),
                    iframeUrl: normalizeText(game.iframeUrl || ''),
                    rating: normalizeText(game.rating || '')
                });
            });
        }
    });

    return getAllGames(all);
}

function writeFile(targetPath, content) {
    ensureDirForFile(targetPath);
    fs.writeFileSync(targetPath, content, 'utf8');
}

function buildSitemap(pages) {
    const items = pages.map((url) => `  <url>
    <loc>${escapeHtml(url)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</urlset>
`;
}

function main() {
    const data = loadI18nData();
    const baseGames = buildBaseGames();
    const canonicalPages = [];

    LANG_ORDER.forEach((langKey) => {
        PAGE_FILES.forEach((relPath) => {
            const key = pageKeyForPath(relPath);
            let html = '';
            if (key === 'home') {
                html = renderHomePage(langKey, data, baseGames);
            } else if (key === 'categories') {
                html = renderCategoriesPage(langKey, data, baseGames);
            } else if (key === 'contact') {
                html = renderContactPage(langKey, data);
            } else if (key === 'privacy') {
                html = renderPolicyPage(langKey, data, 'privacy', 'privacy-container', 'privacy-section');
            } else if (key === 'terms') {
                html = renderPolicyPage(langKey, data, 'terms', 'terms-container', 'terms-section');
            } else if (key === 'cookie') {
                html = renderPolicyPage(langKey, data, 'cookie', 'cookie-container', 'cookie-section');
            }
            const outPath = fsOutputPath(langKey, relPath);
            writeFile(outPath, html);
            canonicalPages.push(canonicalUrl(langKey, relPath));
        });
    });

    const gameIndex = buildGameIndex(baseGames);
    baseGames.forEach((game) => {
        if (safePathSegment(game.link) === 'index.html') return;
        LANG_ORDER.forEach((langKey) => {
            const langGame = getLocalizedGame(data, game.link, langKey) || game;
            const html = renderDetailPage(langKey, data, {
                ...game,
                name: langGame.name || game.name,
                description: langGame.description || game.description,
                gameType: langGame.gameType || game.gameType,
                tags: langGame.tags || game.tags || []
            }, baseGames);
            const outPath = fsOutputPath(langKey, game.link);
            writeFile(outPath, html);
            canonicalPages.push(canonicalUrl(langKey, game.link));
        });
    });

    const sitemap = buildSitemap(Array.from(new Set(canonicalPages)));
    writeFile(path.join(ROOT, 'sitemap.xml'), sitemap);
}

main();
