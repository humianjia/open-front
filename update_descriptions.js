const fs = require('fs');
const path = require('path');

const dataFiles = [
    { file: 'js/game_data/action.js', category: 'Action' },
    { file: 'js/game_data/battleRoyale.js', category: 'Battle Royale' },
    { file: 'js/game_data/fps.js', category: 'FPS' },
    { file: 'js/game_data/multiplayer.js', category: 'Multiplayer' },
    { file: 'js/game_data/sniper.js', category: 'Sniper' }
];

function parseGameData(content) {
    const match = content.match(/=\s*\[([\s\S]*?)\];?\s*$/m);
    if (!match) return [];
    try {
        const data = eval('[' + match[1] + ']');
        return Array.isArray(data) ? data : [];
    } catch (e) {
        return [];
    }
}

function generateDescription(gameName, category) {
    const descriptions = {
        'Hazmob FPS': 'Hazmob FPS is a fast-paced online multiplayer first-person shooter game. It features various game modes including Free for All, Team Death Match, Domination, Capture the Flag, Gun Race, Elimination, and Search and Destroy. Players can choose from a variety of weapons and engage in intense battles across different maps. The game is known for its responsive controls and competitive gameplay.',
        'Push.io': 'Push.io is an online multiplayer arena game where players battle to push each other off the platform using boomerangs. The game features fast-paced action, power-ups, and various arenas. Players can collect trophies and upgrade their boomerangs to gain an advantage over opponents.',
        'Battle Royale Noob vs Pro': 'Battle Royale Noob vs Pro is a battle royale game featuring different character types including Noob, Pro, Hacker, and God. Players drop onto an island, collect weapons and items, and fight to be the last one standing. The game includes various weapons, vehicles, and strategic gameplay elements.',
        'Gun Shooting Games Sniper 3D': 'Gun Shooting Games Sniper 3D is a sniper shooting game with realistic 3D graphics. Players take on the role of a professional sniper and complete various missions across different locations. The game features a variety of sniper rifles, realistic ballistics, and challenging targets.',
        'Crab Guards': 'Crab Guards is an action-packed FPS game where players defend against waves of crab enemies. The game features various weapons, power-ups, and challenging levels. Players must use strategy and quick reflexes to survive the crab onslaught.',
        'FPS Toy Realism': 'FPS Toy Realism is a first-person shooter game with toy-themed graphics. Players engage in battles using toy weapons in detailed toy environments. The game features realistic sound effects and physics, creating an immersive toy battlefield experience.',
        'Mine FPS shooter: Noob Arena': 'Mine FPS shooter: Noob Arena is a Minecraft-style FPS game set in blocky environments. Players battle against other players or AI enemies in arena-style combat. The game features various weapons, power-ups, and customizable characters.',
        '3D FPS Target Shooting': '3D FPS Target Shooting is a target practice game with realistic 3D graphics. Players test their shooting skills on various targets in different environments. The game features different difficulty levels and scoring systems to challenge players of all skill levels.',
        'Merge Gun Fps Shooting Zombie': 'Merge Gun Fps Shooting Zombie combines merge mechanics with zombie shooting action. Players merge weapons to create more powerful ones and fight off waves of zombies. The game features various zombie types, boss battles, and upgrade systems.',
        'Offline FPS Royale': 'Offline FPS Royale is a battle royale game that can be played without an internet connection. Players drop onto an island, collect weapons and items, and fight to be the last survivor. The game features AI opponents, various weapons, and shrinking play zones.',
        'Revoxel 3D - Voxel RPG Shooter': 'Revoxel 3D - Voxel RPG Shooter is a voxel-style action RPG shooter. Players explore a blocky world, complete quests, and battle enemies. The game features character customization, skill trees, and various weapons and items.',
        'Sort Balls - Cones': 'Sort Balls - Cones is a puzzle game where players sort colored balls into the correct cones. The game features various levels of increasing difficulty, time challenges, and colorful graphics. Players must use strategy and quick thinking to complete each level.',
        'Dessert DIY': 'Dessert DIY is a cooking simulation game where players create and decorate delicious desserts. The game features a variety of ingredients, decorations, and recipe options. Players can customize their desserts and share their creations with friends.',
        'Night Club Security': 'Night Club Security is an action game where players protect a nightclub from troublemakers. Players must identify and remove disruptive patrons while ensuring the safety of other guests. The game features various security challenges and realistic nightclub environments.',
        'Obby Football Soccer 3D': 'Obby Football Soccer 3D is a soccer game with obstacle course elements. Players navigate through challenging obstacles while trying to score goals. The game features various levels, power-ups, and competitive gameplay.',
        'Marshmallow Rush': 'Marshmallow Rush is a fun action game where players help marshmallows escape through various obstacles. The game features colorful graphics, power-ups, and challenging levels. Players must guide the marshmallows to safety while avoiding hazards.',
        'Doge\'s Battle Royale': 'Doge\'s Battle Royale is a battle royale game featuring the famous Doge meme character. Players drop onto an island, collect weapons and items, and fight to be the last Doge standing. The game features colorful graphics and humorous gameplay elements.',
        'Top Guns IO': 'Top Guns IO is an aerial combat game where players pilot aircraft and engage in dogfights. The game features various aircraft, weapons, and battle arenas. Players can compete against other players in real-time aerial battles.',
        'Battle Royale Puzzles': 'Battle Royale Puzzles combines battle royale elements with puzzle gameplay. Players solve puzzles to survive and outlast opponents. The game features various puzzle types, power-ups, and competitive multiplayer modes.',
        'Battle Royale Coloring Book': 'Battle Royale Coloring Book is a coloring game with battle royale themes. Players can color various battle royale scenes and characters. The game features a variety of coloring tools, color palettes, and sharing options.',
        'Battle Royale Jigsaw': 'Battle Royale Jigsaw is a jigsaw puzzle game featuring battle royale images. Players can solve puzzles of various difficulty levels. The game features a variety of battle royale-themed images and puzzle sizes.',
        'Cube Battle Royale': 'Cube Battle Royale is a blocky battle royale game set in a cubic world. Players drop onto an island, collect resources, and build structures while fighting to be the last one standing. The game features voxel graphics and creative building mechanics.',
        'Battle Royale Puzzle Challenge': 'Battle Royale Puzzle Challenge is a puzzle game with battle royale elements. Players solve puzzles to advance in the game and compete against other players. The game features various puzzle types and competitive gameplay modes.',
        'Pixel Battle Royale Multiplayer': 'Pixel Battle Royale Multiplayer is a pixelated battle royale game with multiplayer support. Players battle against other players in retro-style arenas. The game features pixel graphics, various weapons, and fast-paced gameplay.',
        'Pixel Battle Royale': 'Pixel Battle Royale is a retro-style battle royale game with pixel graphics. Players drop onto an island, collect weapons and items, and fight to be the last one standing. The game features classic pixel art and nostalgic gameplay.',
        'Brainrots Lava Survive Online': 'Brainrots Lava Survive Online is a multiplayer survival game where players must stay on platforms as lava rises. The game features competitive gameplay, power-ups, and various obstacles. Players must outlast opponents to win.',
        'Tic Tac Toe Merge': 'Tic Tac Toe Merge combines the classic tic tac toe game with merge mechanics. Players merge pieces to create stronger ones and compete against opponents. The game features strategic gameplay and various difficulty levels.',
        'Gang War - Strike Shooter': 'Gang War - Strike Shooter is a gang-themed shooter game. Players join a gang and engage in territorial warfare against rival gangs. The game features various weapons, missions, and gang customization options.',
        'Tsunami Brainrots Online': 'Tsunami Brainrots Online is a multiplayer survival game where players must escape a tsunami. The game features competitive gameplay, power-ups, and various obstacles. Players must outrun the tsunami and outlast opponents.',
        'Animal Racing Idle Park': 'Animal Racing Idle Park is a fun racing game where players race as different animals. The game features idle mechanics, animal upgrades, and various race tracks. Players can compete against other players in animal races.',
        'Mafia Sniper Crime Shooting': 'Mafia Sniper Crime Shooting is a sniper game set in the criminal underworld. Players take on the role of a mafia sniper and complete various assassination missions. The game features realistic sniper mechanics and immersive mafia-themed environments.',
        'Block Sniper': 'Block Sniper is a voxel-style sniper game. Players take on the role of a sniper in a blocky world and complete various missions. The game features voxel graphics, realistic sniper mechanics, and challenging targets.',
        'Counter Craft Sniper': 'Counter Craft Sniper is a counter-strike inspired sniper game. Players take on the role of a sniper and engage in tactical combat. The game features realistic sniper mechanics, various weapons, and competitive gameplay.',
        'Aliens Hunter': 'Aliens Hunter is a sci-fi sniper game where players hunt alien invaders. Players take on the role of a sniper tasked with eliminating alien threats. The game features futuristic weapons, alien enemies, and immersive sci-fi environments.',
        'Infantry Attack Battle 3D FPS': 'Infantry Attack Battle 3D FPS is a military-themed first-person shooter. Players take on the role of an infantry soldier and complete various combat missions. The game features realistic weapons, tactical gameplay, and immersive military environments.',
        'Society FPS': 'Society FPS is a social-themed first-person shooter. Players engage in battles in various social environments. The game features team-based gameplay, various game modes, and customizable characters.',
        'Subway FPS': 'Subway FPS is a first-person shooter set in subway environments. Players take on the role of a subway security guard and defend against threats. The game features realistic subway environments, various weapons, and tactical gameplay.',
        'FPS Assault Shooter': 'FPS Assault Shooter is an action-packed first-person shooter. Players engage in assault missions against enemy forces. The game features various weapons, power-ups, and intense combat scenarios.',
        'Command Strike FPS': 'Command Strike FPS is a tactical first-person shooter. Players take on the role of a commander and lead troops into battle. The game features strategic gameplay, various mission types, and team-based combat.',
        'Real Shooting Fps Strike': 'Real Shooting Fps Strike is a realistic first-person shooter. Players engage in realistic combat scenarios with authentic weapons and physics. The game features realistic graphics, sound effects, and tactical gameplay.',
        'FPS Shooting Strike: Modern Combat War 2k20': 'FPS Shooting Strike: Modern Combat War 2k20 is a modern warfare first-person shooter. Players engage in modern combat scenarios with advanced weapons and equipment. The game features realistic graphics, various mission types, and competitive multiplayer modes.',
        'Dragon Slayer FPS': 'Dragon Slayer FPS is a fantasy first-person shooter. Players take on the role of a dragon slayer and battle against dragons and other mythical creatures. The game features fantasy weapons, magical abilities, and immersive fantasy environments.',
        'Army Fps Shooting': 'Army Fps Shooting is a military-themed first-person shooter. Players take on the role of a soldier and complete various military missions. The game features realistic weapons, tactical gameplay, and immersive military environments.',
        'Shoot Your Nightmare Double Trouble': 'Shoot Your Nightmare Double Trouble is a horror-themed first-person shooter. Players navigate through nightmare scenarios and battle against horror creatures. The game features immersive horror environments, psychological elements, and intense combat.',
        'Lizard Lady vs Herself': 'Lizard Lady vs Herself is a quirky action game featuring the Lizard Lady character. Players control Lizard Lady as she battles against her own clones. The game features unique gameplay mechanics, colorful graphics, and humorous elements.',
        'Lizard Lady vs The Cats': 'Lizard Lady vs The Cats is a quirky action game where Lizard Lady battles against cat enemies. The game features unique gameplay mechanics, colorful graphics, and humorous elements.',
        'CS War Gun King FPS': 'CS War Gun King FPS is a counter-strike inspired first-person shooter. Players engage in competitive combat with various weapons. The game features team-based gameplay, various game modes, and competitive ranking systems.',
        'FPS Simulator': 'FPS Simulator is a first-person shooter training simulator. Players practice their shooting skills in various training scenarios. The game features realistic weapon mechanics, target practice, and skill progression systems.',
        'Thief Fps Fire Marshal': 'Thief Fps Fire Marshal is an action game where players take on the role of a fire marshal fighting crime. The game features firefighting elements, crime prevention, and various missions.',
        'FPS Shooter 3D City Wars': 'FPS Shooter 3D City Wars is a first-person shooter set in urban environments. Players engage in urban combat scenarios with various weapons. The game features realistic city environments, tactical gameplay, and team-based combat.',
        'FPS Sniper Shooter: Battle Survival': 'FPS Sniper Shooter: Battle Survival is a sniper game with battle royale elements. Players take on the role of a sniper and compete against other players to be the last one standing. The game features realistic sniper mechanics, various weapons, and shrinking play zones.',
        'Alien Infestation FPS': 'Alien Infestation FPS is a sci-fi first-person shooter. Players battle against alien infestations in various environments. The game features futuristic weapons, alien enemies, and immersive sci-fi environments.',
        'FPS Clicker': 'FPS Clicker is a clicker game with first-person shooter elements. Players click to shoot enemies and upgrade their weapons. The game features incremental mechanics, weapon upgrades, and various enemies.',
        'Battle SWAT VS Mercenary': 'Battle SWAT VS Mercenary is a tactical first-person shooter. Players choose between SWAT teams and mercenaries and engage in tactical combat. The game features team-based gameplay, various mission types, and strategic elements.'
    };
    
    return descriptions[gameName] || `${gameName} is an exciting ${category.toLowerCase()} game that offers thrilling gameplay and entertainment for players of all ages.`;
}

function updateGameDescriptions() {
    for (const { file, category } of dataFiles) {
        const fullPath = path.join(__dirname, file);
        if (!fs.existsSync(fullPath)) {
            console.log('File not found:', fullPath);
            continue;
        }

        let content = fs.readFileSync(fullPath, 'utf-8');
        const games = parseGameData(content);

        if (games.length === 0) {
            console.log('No games found in:', file);
            continue;
        }

        console.log('Processing', file + ':', games.length, 'games');

        for (const game of games) {
            if (game.name) {
                game.description = generateDescription(game.name, category);
                
                if (!game.keywords) {
                    game.keywords = game.name + ', ' + category + ', online game, browser game';
                }
            }
        }

        const updatedContent = content.replace(/=\s*\[([\s\S]*?)\];?\s*$/m, '= ' + JSON.stringify(games, null, 4) + ';');
        fs.writeFileSync(fullPath, updatedContent, 'utf-8');
        console.log('Updated:', file);
    }

    console.log('All game descriptions updated!');
}

updateGameDescriptions();