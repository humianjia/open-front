const fs = require('fs');
const path = require('path');
const vm = require('vm');
const dns = require('dns');
const { execFileSync } = require('child_process');

const ROOT = __dirname;
const OUTPUT_FILE = path.join(ROOT, 'js', 'i18n-data.js');
const CACHE_FILE = path.join(ROOT, '.i18n-cache.json');
const SEP_MARKER = '[[[OPENFRONT_I18N_SEP]]]';
const SEP = `\n${SEP_MARKER}\n`;
const MAX_BATCH_CHARS = 3200;

if (typeof dns.setDefaultResultOrder === 'function') {
    dns.setDefaultResultOrder('ipv4first');
}

const LANGUAGES = {
    en: { htmlLang: 'en', label: 'EN', marketLabel: 'EN' },
    fr: { htmlLang: 'fr-FR', label: 'FR', marketLabel: 'FR' },
    ja: { htmlLang: 'ja-JP', label: 'JP', marketLabel: 'JP' },
    pl: { htmlLang: 'pl-PL', label: 'PL', marketLabel: 'PL' },
    nl: { htmlLang: 'nl-BE', label: 'BE', marketLabel: 'BE' },
    de: { htmlLang: 'de-DE', label: 'DE', marketLabel: 'DE' }
};

const DATA_FILES = [
    { file: 'js/game_data/games.js', vars: ['gamesData'] },
    { file: 'js/game_data/action.js', vars: ['actionGames'] },
    { file: 'js/game_data/battleRoyale.js', vars: ['battleRoyaleData'] },
    { file: 'js/game_data/fps.js', vars: ['fpsData'] },
    { file: 'js/game_data/multiplayer.js', vars: ['multiplayerGames'] },
    { file: 'js/game_data/sniper.js', vars: ['sniperData'] },
    { file: 'js/game_data/gd_extra.js', vars: ['gdBattleRoyaleGames', 'gdSniperGames', 'gdFpsGames', 'gdMultiplayerGames', 'gdActionGames'] }
];

const STATIC_SOURCE = {
    ui: {
        searchPlaceholder: 'Search open front games...',
        footerCopyright: '© 2024 open front - Free online strategy and browser games. All rights reserved.',
        countTemplate: '{count} games',
        countTemplateZero: '{count} games',
        browserGame: 'Browser game',
        freeOnlineGame: 'Free online game',
        playFreeOnline: 'Play free online',
        mode: 'Mode',
        allGames: 'All Games',
        categories: {
            all: 'All Games',
            action: 'Action',
            'battle-royale': 'Battle Royale',
            fps: 'Shooter',
            multiplayer: 'Multiplayer',
            sniper: 'Sniper',
            index: 'Strategy'
        },
        nav: {
            action: 'Action',
            'battle-royale': 'Battle Royale',
            fps: 'Shooter',
            multiplayer: 'Multiplayer',
            sniper: 'Sniper'
        },
        footerLinks: {
            about: 'About open front',
            contact: 'Contact Us',
            dmca: 'DMCA',
            privacy: 'Privacy Policy',
            terms: 'Terms of Service',
            cookie: 'Cookie Policy'
        },
        detail: {
            relatedTitle: 'More Open Front Games',
            titleTemplate: '{name} - Play Free Online | open front',
            headerTemplate: 'Play {name} instantly on open front.',
            aboutTemplate: 'About {name}',
            metaDescriptionTemplate: '{description} Play free on open front. No download required.',
            twitterDescriptionTemplate: '{description}',
            tagBrand: 'open front',
            tagCategoryModeTemplate: '{category} mode'
        },
        backToHome: 'Back to Home',
        lastUpdatedTemplate: 'Last updated: {date}'
    },
    pages: {
        home: {
            metaTitle: 'Open Front | Play Open Front Online Free Strategy Game',
            metaDescription: 'Play open front online for free. Open Front is a real-time multiplayer strategy browser game about conquest, alliances, ports, ships, missiles, and 72% map control.',
            metaKeywords: 'open front, open front game, open front online, open front strategy game, play open front, open front browser game, open front multiplayer strategy, real-time strategy browser game',
            relatedTitle: 'Popular Open Front Strategy Games',
            intro: 'Open Front is a fast-paced multiplayer real-time strategy browser game where players fight for territory, build cities, form alliances, and race to control 72% of the map.',
            sections: [
                {
                    heading: 'What is open front?',
                    paragraphs: [
                        'open front is a real-time strategy .io-style browser game focused on map conquest, economic growth, and tactical expansion.',
                        'Every match starts with a small territory. From there, you expand, defend borders, manage workers and troops, and react to human players and bots in real time.'
                    ]
                },
                {
                    heading: 'How to win in open front',
                    items: [
                        { label: 'Expand smartly', text: 'Capture nearby land, but do not overextend your military and leave your borders exposed.' },
                        { label: 'Grow your economy', text: 'Build cities and keep enough workers alive so your empire can keep scaling.' },
                        { label: 'Control the sea', text: 'Ports, warships, and trade routes create pressure far beyond your borders.' },
                        { label: 'Use diplomacy', text: 'Alliances can protect you, but betrayal and timing often decide the match.' },
                        { label: 'Reach 72%', text: 'The main victory condition is controlling 72% of the map before your rivals do.' }
                    ]
                },
                {
                    heading: 'Core buildings and weapons',
                    items: [
                        { label: 'City', text: 'Raises your maximum population and lets your empire support larger armies.' },
                        { label: 'Defense Post', text: 'Slows enemy invasions and increases the cost of attacking your territory.' },
                        { label: 'Port', text: 'Unlocks naval pressure, sea travel, and profitable trade routes.' },
                        { label: 'Missile Silo', text: 'Launches devastating bombs against enemy territory when the timing is right.' },
                        { label: 'SAM Launcher', text: 'Intercepts incoming missiles and helps protect your late-game infrastructure.' }
                    ]
                },
                {
                    heading: 'Why players search for open front',
                    items: [
                        { label: 'Real-time strategy depth', text: 'open front combines territory expansion, economy management, and military timing in every match.' },
                        { label: 'Large multiplayer battles', text: 'You can compete against large lobbies where alliances and betrayals matter.' },
                        { label: 'Browser-first convenience', text: 'You can jump into open front instantly without a heavy download or install process.' },
                        { label: 'Replayable matches', text: 'Different spawns, different neighbors, and different alliances keep every game fresh.' }
                    ]
                },
                {
                    heading: 'open front controls',
                    items: [
                        { label: 'Move camera', text: 'W, A, S, D' },
                        { label: 'Zoom', text: 'Q / E or mouse wheel' },
                        { label: 'Select and attack', text: 'Left click to select, then drag toward adjacent territory.' },
                        { label: 'Radial menu', text: 'Right click to build, attack, send boats, or manage diplomacy.' },
                        { label: 'Center camera', text: 'Press C to focus on your territory.' },
                        { label: 'Alternate view', text: 'Press Space to switch between terrain and country view.' },
                        { label: 'Attack ratio', text: 'Hold Shift and left click, or use the slider to adjust troop commitment.' },
                        { label: 'Quick chat', text: 'Use preset messages and emojis to communicate during battle.' }
                    ]
                }
            ],
            tags: ['open front', 'strategy', 'conquest', 'multiplayer', 'alliance', 'naval warfare', 'missiles', 'browser game']
        },
        categories: {
            metaTitle: 'Open Front Categories | Action, Shooter, Multiplayer & Sniper Browser Games',
            metaDescription: 'Browse open front categories for action, battle royale, shooter, multiplayer, sniper, and strategy browser games.',
            metaKeywords: 'open front categories, open front games, browser game hub, action games, battle royale games, shooter games, multiplayer games, sniper games',
            pageTitle: 'Game Categories',
            pageSubtitle: 'Browse fast-loading browser games and discover more action beyond open front',
            sectionTitleTemplate: '{category}'
        },
        contact: {
            metaTitle: 'Contact Us - open front',
            metaDescription: 'Contact open front for support, feedback, partnerships, DMCA requests, or privacy questions about openfront.space.',
            title: 'Contact Us',
            intro: 'We would love to hear from you. Contact the open front team for support, feedback, business questions, or reporting issues.',
            sectionTitle: 'Get in Touch',
            methods: [
                {
                    icon: 'fas fa-envelope',
                    title: 'Email Support',
                    description: 'General questions, feedback, and player support.',
                    linkText: 'humianjia1995@163.com',
                    href: 'mailto:humianjia1995@163.com'
                },
                {
                    icon: 'fas fa-bug',
                    title: 'Bug Reports',
                    description: 'Report gameplay bugs, broken links, or technical issues.',
                    linkText: 'Report a bug',
                    href: 'mailto:humianjia1995@163.com?subject=Bug%20Report'
                },
                {
                    icon: 'fas fa-gamepad',
                    title: 'Game Support',
                    description: 'Ask about gameplay, access, or browser compatibility.',
                    linkText: 'Get support',
                    href: 'mailto:humianjia1995@163.com?subject=Game%20Support'
                },
                {
                    icon: 'fas fa-handshake',
                    title: 'Business Inquiries',
                    description: 'Partnerships, promotion, licensing, or collaboration.',
                    linkText: 'Contact the team',
                    href: 'mailto:humianjia1995@163.com?subject=Business%20Inquiry'
                },
                {
                    icon: 'fas fa-shield-alt',
                    title: 'Privacy & Security',
                    description: 'Questions about data handling, privacy, or account safety.',
                    linkText: 'Privacy team',
                    href: 'mailto:humianjia1995@163.com?subject=Privacy%20Question'
                },
                {
                    icon: 'fas fa-globe',
                    title: 'Website',
                    description: 'Visit the official open front website.',
                    linkText: 'openfront.space',
                    href: 'https://openfront.space'
                }
            ],
            responseTime: 'We usually respond within 24 to 48 hours on business days.',
            faqTitle: 'Frequently Asked Questions',
            faqs: [
                {
                    question: 'Is open front free to play?',
                    answer: 'Yes. You can play open front and the rest of the browser games on this site for free.'
                },
                {
                    question: 'Do I need an account?',
                    answer: 'Most games can be played without creating an account, depending on the source game and platform requirements.'
                },
                {
                    question: 'Can I play on mobile?',
                    answer: 'Many games on openfront.space work on modern mobile browsers, although some are best on desktop.'
                },
                {
                    question: 'How do I report inappropriate content?',
                    answer: 'Email us with the page URL, the issue you found, and any screenshots that help explain the problem.'
                }
            ],
            hoursTitle: 'Office Hours',
            hours: [
                'Business days: Monday to Friday',
                'Hours: 9:00 AM - 6:00 PM (UTC+8)',
                'Response time: Usually within 24 to 48 hours'
            ],
            linksTitle: 'Important Links',
            linksIntro: 'Review these pages for more information about how open front operates:'
        },
        privacy: {
            metaTitle: 'Privacy Policy - open front',
            metaDescription: 'Read the open front privacy policy to learn how openfront.space collects, uses, stores, and protects information.',
            title: 'Privacy Policy',
            updatedOn: 'May 21, 2026',
            sections: [
                {
                    heading: '1. Introduction',
                    paragraphs: [
                        'This Privacy Policy explains how open front collects, uses, and protects information when you visit openfront.space and play games available through the site.',
                        'By continuing to use the site, you acknowledge the practices described in this policy.'
                    ]
                },
                {
                    heading: '2. Information We Collect',
                    items: [
                        { label: 'Device information', text: 'We may collect technical details such as browser type, operating system, screen size, IP address, and referral information.' },
                        { label: 'Usage data', text: 'We may record pages viewed, time spent, clicks, searches, and general gameplay activity to improve the service.' },
                        { label: 'Messages you send', text: 'If you contact us, we collect the information you include in your email or support request.' }
                    ]
                },
                {
                    heading: '3. How We Use Information',
                    items: [
                        { label: 'Operate the site', text: 'To load pages, serve games, fix bugs, and maintain performance.' },
                        { label: 'Improve content', text: 'To understand which pages and games are useful so we can improve layout, speed, and discovery.' },
                        { label: 'Security', text: 'To detect abuse, broken flows, suspicious traffic, and misuse of the service.' }
                    ]
                },
                {
                    heading: '4. Sharing and Third Parties',
                    paragraphs: [
                        'We may use service providers such as hosting, analytics, and game distribution partners. These providers may process technical data as needed to deliver their services.',
                        'We may also disclose information if required by law or to protect the rights, safety, or security of users and the site.'
                    ]
                },
                {
                    heading: '5. Cookies and Analytics',
                    paragraphs: [
                        'Cookies and similar technologies may be used to remember preferences, analyze traffic, and understand how visitors interact with open front pages.',
                        'You can control cookies through your browser settings, although some features may work less effectively if cookies are disabled.'
                    ]
                },
                {
                    heading: '6. Your Choices',
                    paragraphs: [
                        'You may contact us to ask questions about your data, request correction of information you provided directly, or raise privacy concerns.',
                        'If you do not agree with this policy, please discontinue use of the site.'
                    ]
                }
            ]
        },
        terms: {
            metaTitle: 'Terms of Service - open front',
            metaDescription: 'Read the open front terms of service for the rules, responsibilities, and limitations that apply when using openfront.space.',
            title: 'Terms of Service',
            updatedOn: 'May 21, 2026',
            sections: [
                {
                    heading: '1. Acceptance of Terms',
                    paragraphs: [
                        'By using openfront.space, you agree to these Terms of Service. If you do not agree, please do not use the site.',
                        'We may update these terms from time to time, and continued use after updates means you accept the revised terms.'
                    ]
                },
                {
                    heading: '2. Service Description',
                    items: [
                        { label: 'Browser games', text: 'The site provides access to open front and other free browser-based games.' },
                        { label: 'Game discovery', text: 'We organize games into categories and game detail pages to help visitors browse and play.' },
                        { label: 'Support content', text: 'We may publish guides, contact information, policies, and platform updates.' }
                    ]
                },
                {
                    heading: '3. User Responsibilities',
                    items: [
                        { label: 'Lawful use', text: 'You agree not to use the site for illegal, abusive, or harmful purposes.' },
                        { label: 'Respectful behavior', text: 'You should not interfere with the site, other users, or connected services.' },
                        { label: 'Accurate communication', text: 'If you contact us, please provide truthful and relevant information about the issue.' }
                    ]
                },
                {
                    heading: '4. Intellectual Property',
                    paragraphs: [
                        'The site design, branding, editorial text, and original site assets belong to their respective owners unless otherwise stated.',
                        'Individual embedded games, trademarks, and related content may belong to third-party developers, publishers, or distribution partners.'
                    ]
                },
                {
                    heading: '5. Disclaimers and Availability',
                    paragraphs: [
                        'The service is provided on an “as is” basis without warranties of uninterrupted availability, perfect accuracy, or compatibility with every device.',
                        'We may change, remove, suspend, or reorganize pages and content at any time.'
                    ]
                },
                {
                    heading: '6. Contact',
                    paragraphs: [
                        'For support questions, legal notices, or policy concerns, please use the contact information published on the Contact Us page.'
                    ]
                }
            ]
        },
        cookie: {
            metaTitle: 'Cookie Policy - open front',
            metaDescription: 'Read the open front cookie policy to understand which cookies and analytics technologies may be used on openfront.space.',
            title: 'Cookie Policy',
            updatedOn: 'May 21, 2026',
            sections: [
                {
                    heading: '1. What Are Cookies?',
                    paragraphs: [
                        'Cookies are small text files stored on your device when you visit a website. They help websites remember preferences and understand usage patterns.'
                    ]
                },
                {
                    heading: '2. Why open front Uses Cookies',
                    items: [
                        { label: 'Essential functions', text: 'To keep pages working correctly and remember basic preferences such as language choice.' },
                        { label: 'Performance', text: 'To understand how visitors use the site and improve load speed, navigation, and content discovery.' },
                        { label: 'Analytics', text: 'To measure page views, traffic sources, and engagement trends.' }
                    ]
                },
                {
                    heading: '3. Types of Cookies',
                    table: {
                        headers: ['Type', 'Purpose'],
                        rows: [
                            ['Essential', 'Required for core site behavior such as basic navigation and preference storage.'],
                            ['Analytics', 'Used to understand visits, page performance, and interaction patterns.'],
                            ['Preference', 'Used to remember settings such as your selected language on open front pages.']
                        ]
                    }
                },
                {
                    heading: '4. Managing Cookies',
                    paragraphs: [
                        'You can control or delete cookies through your browser settings. Blocking some cookies may reduce functionality on certain pages.'
                    ]
                },
                {
                    heading: '5. Contact',
                    paragraphs: [
                        'If you have questions about this Cookie Policy, please contact us using the details on the Contact Us page.'
                    ]
                }
            ]
        }
    }
};

const translationCache = fs.existsSync(CACHE_FILE)
    ? JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'))
    : {};

function decodeHtml(value) {
    return String(value || '')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#x27;/gi, "'")
        .replace(/&#x2F;/gi, '/');
}

function normalizeText(value) {
    return decodeHtml(value)
        .replace(/\r\n/g, '\n')
        .replace(/\u00a0/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function normalizeLink(link) {
    return String(link || '')
        .replace(/^[./]+/, '')
        .replace(/[?#].*$/, '')
        .replace(/\\/g, '/')
        .trim();
}

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function getByPath(target, pathSegments) {
    return pathSegments.reduce((acc, key) => (acc == null ? acc : acc[key]), target);
}

function setByPath(target, pathSegments, value) {
    let cursor = target;
    for (let index = 0; index < pathSegments.length - 1; index += 1) {
        cursor = cursor[pathSegments[index]];
    }
    cursor[pathSegments[pathSegments.length - 1]] = value;
}

function collectStringEntries(value, pathSegments = [], entries = []) {
    if (typeof value === 'string') {
        entries.push({ path: pathSegments, value });
        return entries;
    }
    if (Array.isArray(value)) {
        value.forEach((item, index) => collectStringEntries(item, [...pathSegments, index], entries));
        return entries;
    }
    if (value && typeof value === 'object') {
        Object.keys(value).forEach((key) => collectStringEntries(value[key], [...pathSegments, key], entries));
    }
    return entries;
}

function loadGameCollections() {
    const context = {};
    vm.createContext(context);

    for (const definition of DATA_FILES) {
        const filePath = path.join(ROOT, definition.file);
        const source = fs.readFileSync(filePath, 'utf8');
        vm.runInContext(source, context, { filename: definition.file });
    }

    const games = [];
    for (const definition of DATA_FILES) {
        for (const variableName of definition.vars) {
            const collection = context[variableName];
            if (Array.isArray(collection)) {
                games.push(...collection);
            }
        }
    }

    const seen = new Set();
    return games
        .map((game) => ({
            id: normalizeText(game.id),
            link: normalizeLink(game.link),
            name: normalizeText(game.name),
            description: normalizeText(game.description),
            gameType: normalizeText(game.gameType),
            tags: Array.isArray(game.tags) ? game.tags.map((tag) => normalizeText(tag)) : []
        }))
        .filter((game) => game.id && game.link && game.name)
        .filter((game) => {
            if (seen.has(game.link)) return false;
            seen.add(game.link);
            return true;
        });
}

function protectText(value) {
    return String(value || '')
        .replace(/\{name\}/g, '__VAR_NAME__')
        .replace(/\{count\}/g, '__VAR_COUNT__')
        .replace(/\{date\}/g, '__VAR_DATE__')
        .replace(/\{category\}/g, '__VAR_CATEGORY__')
        .replace(/openfront\.space/gi, '__OPENFRONT_SPACE__')
        .replace(/Open Front/g, '__OPEN_FRONT_TITLE__')
        .replace(/open front/g, '__OPEN_FRONT__')
        .replace(/DMCA/g, '__DMCA__')
        .replace(/UTC\+8/g, '__UTC_PLUS_8__')
        .replace(/HTML5/gi, '__HTML5__')
        .replace(/FPS/g, '__FPS__')
        .replace(/MIRV/g, '__MIRV__')
        .replace(/\bSAM\b/g, '__SAM__')
        .replace(/\.io/g, '__DOT_IO__');
}

function restoreText(value) {
    return String(value || '')
        .replace(/__VAR_NAME__/g, '{name}')
        .replace(/__VAR_COUNT__/g, '{count}')
        .replace(/__VAR_DATE__/g, '{date}')
        .replace(/__VAR_CATEGORY__/g, '{category}')
        .replace(/__OPENFRONT_SPACE__/g, 'openfront.space')
        .replace(/__OPEN_FRONT_TITLE__/g, 'Open Front')
        .replace(/__OPEN_FRONT__/g, 'open front')
        .replace(/__DMCA__/g, 'DMCA')
        .replace(/__UTC_PLUS_8__/g, 'UTC+8')
        .replace(/__HTML5__/g, 'HTML5')
        .replace(/__FPS__/g, 'FPS')
        .replace(/__MIRV__/g, 'MIRV')
        .replace(/__SAM__/g, 'SAM')
        .replace(/__DOT_IO__/g, '.io');
}

function chunkTexts(texts) {
    const batches = [];
    let current = [];
    let currentLength = 0;

    texts.forEach((text, index) => {
        const protectedText = protectText(text);
        const extraLength = (current.length > 0 ? SEP.length : 0) + protectedText.length;

        if (current.length > 0 && currentLength + extraLength > MAX_BATCH_CHARS) {
            batches.push(current);
            current = [];
            currentLength = 0;
        }

        current.push({ index, protectedText });
        currentLength += (current.length > 1 ? SEP.length : 0) + protectedText.length;
    });

    if (current.length > 0) {
        batches.push(current);
    }

    return batches;
}

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function saveCache() {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(translationCache, null, 2), 'utf8');
}

async function fetchTranslation(text, language) {
    const cacheKey = `${language}::${text}`;
    if (translationCache[cacheKey]) {
        return translationCache[cacheKey];
    }

    let lastError = null;

    for (let attempt = 1; attempt <= 4; attempt += 1) {
        try {
            const textBase64 = Buffer.from(text, 'utf8').toString('base64');
            const langBase64 = Buffer.from(language, 'utf8').toString('base64');
            const script = [
                '$ProgressPreference = "SilentlyContinue"',
                '[Console]::OutputEncoding = [System.Text.Encoding]::UTF8',
                '$text = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($env:OPENFRONT_I18N_TEXT_B64))',
                '$lang = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($env:OPENFRONT_I18N_LANG_B64))',
                '$url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=" + [uri]::EscapeDataString($lang) + "&dt=t&q=" + [uri]::EscapeDataString($text)',
                '$resp = Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 45 -Headers @{"User-Agent"="Mozilla/5.0"}',
                'Write-Output $resp.Content'
            ].join('; ');
            const raw = execFileSync('powershell', ['-NoProfile', '-Command', script], {
                encoding: 'utf8',
                maxBuffer: 1024 * 1024 * 10,
                env: {
                    ...process.env,
                    OPENFRONT_I18N_TEXT_B64: textBase64,
                    OPENFRONT_I18N_LANG_B64: langBase64
                }
            });
            const payload = JSON.parse(String(raw || '').trim());
            const translated = Array.isArray(payload?.[0]) ? payload[0].map((item) => item[0]).join('') : '';
            const finalText = translated || text;
            translationCache[cacheKey] = finalText;
            saveCache();
            return finalText;
        } catch (error) {
            lastError = error;
            if (attempt < 4) {
                await wait(1000 * attempt);
            }
        }
    }

    throw lastError || new Error(`Translation request failed for ${language}`);
}

async function translateTexts(texts, language) {
    const results = new Array(texts.length).fill('');
    const batches = chunkTexts(texts);

    for (const batch of batches) {
        const batchText = batch.map((item) => item.protectedText).join(SEP);
        const translatedBatch = await fetchTranslation(batchText, language);
        const parts = translatedBatch.split(SEP_MARKER).map((part) => normalizeText(part));

        if (parts.length !== batch.length) {
            throw new Error(`Separator mismatch while translating ${language}. Expected ${batch.length}, received ${parts.length}.`);
        }

        parts.forEach((part, partIndex) => {
            results[batch[partIndex].index] = restoreText(normalizeText(part));
        });
    }

    return results;
}

async function translateStructuredObject(source, language) {
    const entries = collectStringEntries(source);
    const translated = await translateTexts(entries.map((entry) => entry.value), language);
    const output = clone(source);

    entries.forEach((entry, index) => {
        setByPath(output, entry.path, translated[index]);
    });

    return output;
}

function buildGameLocaleEntry(game) {
    return {
        name: game.name,
        description: game.description,
        gameType: game.gameType,
        tags: clone(game.tags)
    };
}

function sanitizeGameEntry(entry) {
    return {
        name: normalizeText(entry.name),
        description: normalizeText(entry.description),
        gameType: normalizeText(entry.gameType),
        tags: Array.isArray(entry.tags) ? entry.tags.map((tag) => normalizeText(tag)) : []
    };
}

async function buildGameTranslations(games) {
    const output = {};
    const english = {};

    games.forEach((game) => {
        english[game.link] = sanitizeGameEntry(buildGameLocaleEntry(game));
    });

    output.en = english;

    for (const language of Object.keys(LANGUAGES).filter((code) => code !== 'en')) {
        const lines = [];
        const manifest = [];

        games.forEach((game) => {
            lines.push(game.description);
            manifest.push({ link: game.link, field: 'description' });

            lines.push(game.gameType);
            manifest.push({ link: game.link, field: 'gameType' });

            game.tags.forEach((tag, tagIndex) => {
                lines.push(tag);
                manifest.push({ link: game.link, field: 'tags', tagIndex });
            });
        });

        const translated = await translateTexts(lines, language);
        const localeEntries = {};

        games.forEach((game) => {
            localeEntries[game.link] = {
                name: game.name,
                description: game.description,
                gameType: game.gameType,
                tags: clone(game.tags)
            };
        });

        translated.forEach((value, index) => {
            const item = manifest[index];
            const target = localeEntries[item.link];

            if (item.field === 'tags') {
                target.tags[item.tagIndex] = normalizeText(value);
                return;
            }

            target[item.field] = normalizeText(value);
        });

        output[language] = localeEntries;
        console.log(`Translated ${games.length} game entries to ${language}`);
    }

    return output;
}

function buildPageLocales(staticLocales) {
    const pageLocales = {};
    Object.keys(STATIC_SOURCE.pages).forEach((pageKey) => {
        pageLocales[pageKey] = {};
        Object.keys(staticLocales).forEach((language) => {
            pageLocales[pageKey][language] = staticLocales[language].pages[pageKey];
        });
    });
    return pageLocales;
}

function buildUiLocales(staticLocales) {
    const locales = {};
    Object.keys(staticLocales).forEach((language) => {
        locales[language] = staticLocales[language].ui;
    });
    return locales;
}

function buildGamesByLink(games, gameLocales) {
    const byLink = {};

    games.forEach((game) => {
        byLink[game.link] = {
            id: game.id,
            en: gameLocales.en[game.link]
        };

        Object.keys(gameLocales).forEach((language) => {
            if (language === 'en') return;
            byLink[game.link][language] = gameLocales[language][game.link];
        });
    });

    return byLink;
}

async function main() {
    const games = loadGameCollections();
    console.log(`Loaded ${games.length} unique game entries`);

    const staticLocales = {
        en: clone(STATIC_SOURCE)
    };

    for (const language of Object.keys(LANGUAGES).filter((code) => code !== 'en')) {
        staticLocales[language] = await translateStructuredObject(STATIC_SOURCE, language);
        console.log(`Translated static copy to ${language}`);
    }

    const gameLocales = await buildGameTranslations(games);

    const payload = {
        generatedAt: new Date().toISOString(),
        languages: LANGUAGES,
        ui: buildUiLocales(staticLocales),
        pages: buildPageLocales(staticLocales),
        games: buildGamesByLink(games, gameLocales)
    };

    const content = `window.openFrontI18nData = ${JSON.stringify(payload, null, 4)};\n`;
    fs.writeFileSync(OUTPUT_FILE, content, 'utf8');
    console.log(`Wrote ${OUTPUT_FILE}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
