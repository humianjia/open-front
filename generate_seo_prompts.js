const fs = require('fs');
const path = require('path');
const vm = require('vm');

const GAME_DATA_FILES = [
    { file: 'js/game_data/games.js', varName: 'gamesData', fallbackType: 'Index' },
    { file: 'js/game_data/action.js', varName: 'actionGames', fallbackType: 'Action' },
    { file: 'js/game_data/battleRoyale.js', varName: 'battleRoyaleData', fallbackType: 'Battle Royale' },
    { file: 'js/game_data/fps.js', varName: 'fpsData', fallbackType: 'FPS' },
    { file: 'js/game_data/multiplayer.js', varName: 'multiplayerGames', fallbackType: 'Multiplayer' },
    { file: 'js/game_data/sniper.js', varName: 'sniperData', fallbackType: 'Sniper' }
];

const DEFAULT_OUTPUT_FILE = path.join(__dirname, 'seo_prompt_inputs.json');

const PROMPT_TEMPLATE = [
    '\u4f60\u662f\u4e00\u4e2a\u6e38\u620f\u7f51\u7ad9SEO\u5185\u5bb9\u7f16\u8f91\u3002\u4f60\u7684\u4efb\u52a1\u662f\u5c06\u7b80\u77ed\u7684\u6e38\u620f\u63cf\u8ff0\u6269\u5199\u4e3a\u9002\u5408\u6e38\u620f\u8be6\u60c5\u9875\u7684SEO\u5185\u5bb9\u6bb5\u843d\u3002',
    '',
    '\u8981\u6c42\uff1a',
    '- \u8f93\u51fa5-8\u53e5\u8bdd\uff0c\u7ea6150-200\u5b57',
    '- \u5fc5\u987b\u5305\u542b\uff1a\u6e38\u620f\u73a9\u6cd5\u4ecb\u7ecd\u3001\u64cd\u4f5c\u65b9\u5f0f\uff08\u952e\u76d8/\u9f20\u6807/\u89e6\u5c4f\uff09\u3001\u6e38\u620f\u7279\u8272\u4eae\u70b9',
    '- \u8bed\u8a00\uff1a\u82f1\u6587',
    '- \u8bed\u6c14\uff1a\u81ea\u7136\u3001\u9762\u5411\u73a9\u5bb6\uff0c\u4e0d\u8981\u5806\u780c\u5173\u952e\u8bcd',
    '- \u6700\u540e\u4e00\u53e5\u56fa\u5b9a\u4e3a\uff1aPlay __GAME_NAME__ instantly on minefun io with no download required.',
    '- \u53ea\u8f93\u51fa\u6b63\u6587\u6bb5\u843d\uff0c\u4e0d\u8981\u6807\u9898\uff0c\u4e0d\u8981bullet points',
    '',
    '\u7528\u6237\u8f93\u5165\u6a21\u677f',
    '',
    '\u6e38\u620f\u540d\uff1a__NAME__',
    '\u7c7b\u578b\uff1a__GAME_TYPE__',
    '\u539f\u63cf\u8ff0\uff1a__DESCRIPTION__',
    '',
    '\u8bf7\u6269\u5199\u3002'
].join('\n');

function normalizeText(value) {
    return String(value || '')
        .replace(/\r\n/g, '\n')
        .replace(/\s+/g, ' ')
        .trim();
}

function loadGamesFromFile(filePath) {
    const source = fs.readFileSync(filePath, 'utf8');
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox, { filename: filePath });

    const games = Object.values(sandbox).find(Array.isArray);
    if (!games) {
        throw new Error(`No game array found in ${filePath}`);
    }

    return games;
}

function buildSeoPrompt(game) {
    const name = normalizeText(game.name) || 'Unknown Game';
    const gameType = normalizeText(game.gameType) || 'Game';
    const description = normalizeText(game.sourceDescription || game.description) || `${name} is a browser game.`;

    return PROMPT_TEMPLATE
        .replace(/__GAME_NAME__/g, name)
        .replace(/__NAME__/g, name)
        .replace(/__GAME_TYPE__/g, gameType)
        .replace(/__DESCRIPTION__/g, description);
}

function collectPromptInputs() {
    const prompts = [];

    for (const { file, fallbackType } of GAME_DATA_FILES) {
        const fullPath = path.join(__dirname, file);
        const games = loadGamesFromFile(fullPath);

        for (const game of games) {
            const sourceDescription = normalizeText(game.sourceDescription || game.description);
            prompts.push({
                id: normalizeText(game.id),
                name: normalizeText(game.name),
                gameType: normalizeText(game.gameType) || fallbackType,
                sourceDescription,
                description: normalizeText(game.description),
                link: normalizeText(game.link),
                sourceFile: file,
                prompt: buildSeoPrompt({
                    name: game.name,
                    gameType: game.gameType || fallbackType,
                    sourceDescription,
                    description: game.description
                })
            });
        }
    }

    return prompts;
}

function writePromptFile(outputFile = DEFAULT_OUTPUT_FILE) {
    const prompts = collectPromptInputs();
    fs.writeFileSync(outputFile, JSON.stringify(prompts, null, 2) + '\n', 'utf8');
    return prompts;
}

if (require.main === module) {
    const outputFile = process.argv[2]
        ? path.resolve(process.argv[2])
        : DEFAULT_OUTPUT_FILE;
    const prompts = writePromptFile(outputFile);
    console.log(`Wrote ${prompts.length} SEO prompt inputs to ${outputFile}`);
}

module.exports = {
    GAME_DATA_FILES,
    DEFAULT_OUTPUT_FILE,
    buildSeoPrompt,
    collectPromptInputs,
    loadGamesFromFile,
    writePromptFile
};
