const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');
const { writePromptFile, DEFAULT_OUTPUT_FILE, buildSeoPrompt } = require('./generate_seo_prompts');

const ROOT = __dirname;
const OPENAI_API_BASE = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
const DEFAULT_CONCURRENCY = Number(process.env.OPENAI_CONCURRENCY || 3);
const CACHE_FILE = path.join(ROOT, '.seo-generation-cache.json');
const I18N_DATA_FILE = path.join(ROOT, 'js', 'i18n-data.js');
const GAME_DATA_FILES = [
    { file: 'js/game_data/games.js', varName: 'gamesData' },
    { file: 'js/game_data/action.js', varName: 'actionGames' },
    { file: 'js/game_data/battleRoyale.js', varName: 'battleRoyaleData' },
    { file: 'js/game_data/fps.js', varName: 'fpsData' },
    { file: 'js/game_data/multiplayer.js', varName: 'multiplayerGames' },
    { file: 'js/game_data/sniper.js', varName: 'sniperData' }
];

const SYSTEM_PROMPT = 'You write natural-sounding SEO content for browser game detail pages. Follow the user instructions exactly, keep the tone player-friendly, avoid keyword stuffing, and return only the requested JSON.';

const RESPONSE_JSON_SCHEMA = {
    name: 'seo_game_description',
    schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
            paragraph: {
                type: 'string',
                description: 'A 5-8 sentence English paragraph around 150-200 words. The last sentence must exactly match the requested fixed sentence.'
            }
        },
        required: ['paragraph']
    }
};

function normalizeText(value) {
    return String(value || '')
        .replace(/\r\n/g, '\n')
        .replace(/\u00a0/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function readJsonFile(filePath, fallback) {
    if (!fs.existsSync(filePath)) {
        return fallback;
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJsonFile(filePath, value) {
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function loadPromptInputs(filePath) {
    const resolved = path.resolve(filePath || DEFAULT_OUTPUT_FILE);
    writePromptFile(resolved);
    return readJsonFile(resolved, []).map((item) => ({
        ...item,
        prompt: buildSeoPrompt(item)
    }));
}

function parseArgs(argv) {
    const options = {
        promptFile: DEFAULT_OUTPUT_FILE,
        only: [],
        limit: 0,
        dryRun: false,
        skipRebuild: false,
        force: false,
        concurrency: DEFAULT_CONCURRENCY
    };

    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        if (arg === '--prompt-file') {
            options.promptFile = path.resolve(argv[++i]);
        } else if (arg === '--only') {
            options.only = argv[++i].split(',').map((value) => normalizeText(value).toLowerCase()).filter(Boolean);
        } else if (arg === '--limit') {
            options.limit = Number(argv[++i]) || 0;
        } else if (arg === '--dry-run') {
            options.dryRun = true;
        } else if (arg === '--skip-rebuild') {
            options.skipRebuild = true;
        } else if (arg === '--force') {
            options.force = true;
        } else if (arg === '--concurrency') {
            options.concurrency = Math.max(1, Number(argv[++i]) || DEFAULT_CONCURRENCY);
        }
    }

    return options;
}

function filterPromptInputs(inputs, options) {
    let filtered = inputs;
    if (options.only.length) {
        filtered = filtered.filter((item) => {
            const key = `${item.name} ${item.link} ${item.sourceFile}`.toLowerCase();
            return options.only.some((needle) => key.includes(needle));
        });
    }
    if (options.limit > 0) {
        filtered = filtered.slice(0, options.limit);
    }
    return filtered;
}

function isValidParagraph(text, gameName) {
    const paragraph = normalizeText(text);
    if (!paragraph) return false;
    const sentences = splitSentences(paragraph);
    if (sentences.length < 5 || sentences.length > 12) return false;
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length < 110 || words.length > 240) return false;
    const finalSentence = `Play ${gameName} instantly on minefun io with no download required.`;
    if (!paragraph.endsWith(finalSentence)) return false;
    return true;
}

function splitSentences(text) {
    return String(text || '')
        .replace(/\s+/g, ' ')
        .trim()
        .split(/(?<=[.!?])(?=\s+[A-Z])/)
        .map((sentence) => sentence.trim())
        .filter(Boolean);
}

function toLowerLead(text) {
    const value = normalizeText(text);
    if (!value) return value;
    return value.charAt(0).toLowerCase() + value.slice(1);
}

function categoryDescriptor(gameType) {
    switch (normalizeText(gameType).toLowerCase()) {
    case 'fps':
        return 'first-person shooter';
    case 'battle royale':
        return 'battle royale survival game';
    case 'multiplayer':
        return 'multiplayer browser game';
    case 'sniper':
        return 'sniper action game';
    case 'index':
        return 'real-time strategy game';
    default:
        return `${normalizeText(gameType).toLowerCase()} game`;
    }
}

function articleFor(phrase) {
    return /^[aeiou]/i.test(normalizeText(phrase)) ? 'an' : 'a';
}

function categoryLoopSentence(gameType, name) {
    switch (normalizeText(gameType).toLowerCase()) {
    case 'fps':
        return `Every match in ${name} is about moving with purpose, lining up shots quickly, and making the most of every weapon, angle, and objective on the map.`;
    case 'battle royale':
        return `The main loop is all about staying alive under pressure, finding the right gear, and choosing when to push, hide, or reposition before the next threat closes in.`;
    case 'multiplayer':
        return `Because you are constantly reacting to other players, no two rounds feel quite the same, and smart decisions matter just as much as fast reflexes.`;
    case 'sniper':
        return `Success comes from patience and accuracy, as you read the battlefield, pick high-value targets, and fire at exactly the right moment.`;
    case 'index':
        return `You will spend each match expanding carefully, managing pressure from rivals, and balancing aggression with long-term planning as the map shifts around you.`;
    default:
        return `Each session keeps the action moving with simple goals, quick decisions, and a satisfying sense of progress as you learn the best way to win.`;
    }
}

function categoryControlsSentence(gameType) {
    switch (normalizeText(gameType).toLowerCase()) {
    case 'fps':
    case 'battle royale':
        return 'On desktop, you can use the keyboard to move, reload, jump, or switch gear while the mouse handles aiming, shooting, and quick interactions, and touch controls make tapping, dragging, and firing feel smooth on mobile.';
    case 'sniper':
        return 'On desktop, the mouse is ideal for aiming and shooting while the keyboard helps with movement, zoom, or mission flow, and touch devices let you tap, drag, and line up shots with simple on-screen controls.';
    case 'index':
        return 'On desktop, the keyboard is useful for camera movement and shortcuts while the mouse handles selecting territory, building, and issuing commands, and touch players can tap and drag through the same strategy flow on mobile.';
    default:
        return 'On desktop, you can use the keyboard for movement or shortcuts and the mouse for aiming, selecting, or attacking, while touch controls let you tap and swipe comfortably if you are playing on a phone or tablet.';
    }
}

function categoryFeaturesSentence(gameType, name) {
    switch (normalizeText(gameType).toLowerCase()) {
    case 'fps':
        return `${name} stands out with fast pacing, satisfying weapon variety, and the kind of pick-up-and-play action that works well whether you want a quick round or a longer session.`;
    case 'battle royale':
        return `${name} stands out with high-stakes survival tension, varied combat situations, and the thrill of turning a rough start into a clutch finish.`;
    case 'multiplayer':
        return `${name} stands out with replayable online competition, easy-to-read controls, and enough variety in each round to keep the experience fresh for returning players.`;
    case 'sniper':
        return `${name} stands out with focused precision gameplay, clear target-based tension, and rewarding shots that make every successful mission feel earned.`;
    case 'index':
        return `${name} stands out with strategic depth, strong replay value, and the satisfying mix of expansion, defense, and timing that keeps every match engaging.`;
    default:
        return `${name} stands out with accessible controls, readable objectives, and just enough challenge, variety, and momentum to keep players coming back for another run.`;
    }
}

function buildLocalParagraph(item) {
    const name = normalizeText(item.name) || 'This game';
    const gameType = normalizeText(item.gameType) || 'Game';
    const sourceDescription = normalizeText(item.sourceDescription || item.description);
    const descriptor = categoryDescriptor(gameType);
    const sourceSentences = splitSentences(sourceDescription).slice(0, 3);
    const intro = `${name} is ${articleFor(descriptor)} ${descriptor} that gives players an easy way to jump straight into the action and learn the core loop within the first few moments.`;
    const supportOne = sourceSentences[0] || `${name} keeps the objective clear from the start, so you can focus on improving your timing, strategy, and overall performance.`;
    const supportTwo = sourceSentences[1] || categoryLoopSentence(gameType, name);
    const supportThree = sourceSentences[2] || `Whether you are chasing a high score, clearing enemies, surviving longer, or outplaying opponents, the game keeps the pressure on without becoming hard to follow.`;
    const controls = categoryControlsSentence(gameType);
    const features = categoryFeaturesSentence(gameType, name);
    const finalSentence = `Play ${name} instantly on minefun io with no download required.`;

    return normalizeText([
        intro,
        supportOne,
        supportTwo,
        supportThree,
        controls,
        features,
        finalSentence
    ].join(' '));
}

function buildRequestBody(prompt) {
    return {
        model: OPENAI_MODEL,
        input: [
            { role: 'system', content: [{ type: 'input_text', text: SYSTEM_PROMPT }] },
            { role: 'user', content: [{ type: 'input_text', text: prompt }] }
        ],
        text: {
            format: {
                type: 'json_schema',
                name: RESPONSE_JSON_SCHEMA.name,
                schema: RESPONSE_JSON_SCHEMA.schema,
                strict: true
            }
        }
    };
}

async function callOpenAI(prompt) {
    const response = await fetch(`${OPENAI_API_BASE}/responses`, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify(buildRequestBody(prompt))
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        const message = payload?.error?.message || `OpenAI request failed with status ${response.status}`;
        throw new Error(message);
    }

    const outputText = payload?.output_text;
    if (typeof outputText !== 'string' || !outputText.trim()) {
        throw new Error('OpenAI response did not include output_text');
    }

    let parsed;
    try {
        parsed = JSON.parse(outputText);
    } catch (error) {
        throw new Error(`Could not parse model JSON output: ${error.message}`);
    }

    const paragraph = normalizeText(parsed.paragraph);
    if (!paragraph) {
        throw new Error('Model output did not include a paragraph');
    }

    return paragraph;
}

async function generateWithRetry(item, options, cache) {
    const cacheKey = `${OPENAI_MODEL}::${item.link}`;
    if (!options.force && cache[cacheKey] && isValidParagraph(cache[cacheKey].paragraph, item.name)) {
        return {
            paragraph: cache[cacheKey].paragraph,
            source: 'cache'
        };
    }

    if (options.dryRun) {
        return {
            paragraph: '',
            source: 'dry-run'
        };
    }

    if (!OPENAI_API_KEY) {
        const paragraph = buildLocalParagraph(item);
        if (!isValidParagraph(paragraph, item.name)) {
            throw new Error(`Local fallback paragraph for ${item.name} failed validation`);
        }
        cache[cacheKey] = {
            paragraph,
            generatedAt: new Date().toISOString(),
            model: 'local-fallback'
        };
        return {
            paragraph,
            source: 'local'
        };
    }

    let lastError = null;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
            const paragraph = await callOpenAI(item.prompt);
            if (!isValidParagraph(paragraph, item.name)) {
                throw new Error(`Generated paragraph for ${item.name} failed validation`);
            }
            cache[cacheKey] = {
                paragraph,
                generatedAt: new Date().toISOString(),
                model: OPENAI_MODEL
            };
            return {
                paragraph,
                source: 'api'
            };
        } catch (error) {
            lastError = error;
            if (attempt < 3) {
                await sleep(1000 * attempt);
            }
        }
    }
    throw lastError;
}

async function mapWithConcurrency(items, concurrency, iteratee) {
    const results = new Array(items.length);
    let cursor = 0;

    async function worker() {
        while (true) {
            const index = cursor;
            cursor += 1;
            if (index >= items.length) {
                return;
            }
            results[index] = await iteratee(items[index], index);
        }
    }

    const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
    await Promise.all(workers);
    return results;
}

function loadGameDataFile(descriptor) {
    const filePath = path.join(ROOT, descriptor.file);
    const source = fs.readFileSync(filePath, 'utf8');
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox, { filename: descriptor.file });
    const games = sandbox[descriptor.varName];
    if (!Array.isArray(games)) {
        throw new Error(`Could not load array ${descriptor.varName} from ${descriptor.file}`);
    }
    return {
        filePath,
        source,
        games
    };
}

function updateGameDescriptions(resultsByLink) {
    for (const descriptor of GAME_DATA_FILES) {
        const loaded = loadGameDataFile(descriptor);
        let changed = false;

        loaded.games.forEach((game) => {
            const result = resultsByLink[game.link];
            if (!result) return;

            const currentDescription = normalizeText(game.description);
            const currentSourceDescription = normalizeText(game.sourceDescription);
            if (!currentSourceDescription) {
                game.sourceDescription = currentDescription;
                changed = true;
            }
            if (currentDescription !== result.paragraph) {
                game.description = result.paragraph;
                changed = true;
            }
        });

        if (!changed) {
            continue;
        }

        const content = `var ${descriptor.varName} = ${JSON.stringify(loaded.games, null, 4)};\n`;
        fs.writeFileSync(loaded.filePath, content, 'utf8');
    }
}

function runNodeScript(scriptFile) {
    const outcome = spawnSync(process.execPath, [scriptFile], {
        cwd: ROOT,
        stdio: 'inherit'
    });
    if (outcome.status !== 0) {
        throw new Error(`Script failed: ${scriptFile}`);
    }
}

function syncEnglishI18nDescriptions(resultsByLink) {
    const source = fs.readFileSync(I18N_DATA_FILE, 'utf8');
    const sandbox = { window: {} };
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox, { filename: I18N_DATA_FILE });
    const data = sandbox.window.openFrontI18nData;
    if (!data || !data.games) {
        throw new Error('Could not load openFrontI18nData from js/i18n-data.js');
    }

    Object.keys(resultsByLink).forEach((link) => {
        if (!data.games[link]) return;
        if (!data.games[link].en) {
            data.games[link].en = {};
        }
        data.games[link].en.description = resultsByLink[link].paragraph;
    });

    fs.writeFileSync(I18N_DATA_FILE, `window.openFrontI18nData = ${JSON.stringify(data, null, 4)};\n`, 'utf8');
}

function rebuildSiteArtifacts(resultsByLink) {
    syncEnglishI18nDescriptions(resultsByLink);
    runNodeScript('generate_static_seo_site.js');
}

async function main() {
    const options = parseArgs(process.argv.slice(2));
    const promptInputs = filterPromptInputs(loadPromptInputs(options.promptFile), options);

    if (promptInputs.length === 0) {
        console.log('No prompt inputs selected.');
        return;
    }

    const cache = readJsonFile(CACHE_FILE, {});
    const generationResults = [];

    const generated = await mapWithConcurrency(promptInputs, options.concurrency, async (item) => {
        const result = await generateWithRetry(item, options, cache);
        generationResults.push({
            name: item.name,
            link: item.link,
            sourceFile: item.sourceFile,
            source: result.source
        });
        console.log(`[${result.source}] ${item.name}`);
        return {
            ...item,
            paragraph: result.paragraph
        };
    });

    writeJsonFile(CACHE_FILE, cache);

    if (options.dryRun) {
        const previewPath = path.join(ROOT, 'seo_generated_preview.json');
        writeJsonFile(previewPath, generated);
        console.log(`Dry run preview written to ${previewPath}`);
        return;
    }

    const resultsByLink = Object.fromEntries(generated.map((item) => [item.link, item]));
    updateGameDescriptions(resultsByLink);

    if (!options.skipRebuild) {
        rebuildSiteArtifacts(resultsByLink);
    }

    console.log(`Updated ${generated.length} game descriptions.`);
}

main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
});
