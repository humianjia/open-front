function loadMainGame() {
    if (!window.gamesData || window.gamesData.length === 0) return;

    const firstGame = window.gamesData[0];
    const iframe = document.getElementById('game-iframe');
    const title = document.getElementById('current-game-title');
    const icon = document.getElementById('game-icon');

    if (iframe && firstGame.iframeUrl) {
        iframe.src = firstGame.iframeUrl;
    }

    if (title) {
        title.textContent = firstGame.name || 'Game';
    }

    if (icon && firstGame.imageUrl) {
        icon.src = firstGame.imageUrl;
        icon.onerror = function () {
            this.src = 'img/icon/veckIo.jpg';
        };
    }
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
        ...(window.sniperData || [])
    ];
}

function loadRelatedGames() {
    const container = document.getElementById('related-games-container');
    if (!container) return;

    const allGames = getAllGames();
    if (allGames.length === 0) return;

    const featured = (window.gamesData || []).slice(0, 5);
    const remainder = shuffleArray(allGames.filter(game => !featured.some(item => item.id === game.id))).slice(0, 16);
    const games = [...featured, ...remainder].slice(0, 21);

    container.innerHTML = '';
    games.forEach((game) => {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.setAttribute('data-game', game.id);
        card.innerHTML = `
            <img src="${game.imageUrl}" alt="${game.name}" onerror="this.src='img/icon/veckIo.jpg'">
            <div class="game-card-title">${game.name}</div>
        `;
        card.addEventListener('click', function () {
            loadGameById(game.id);
        });
        container.appendChild(card);
    });
}

function loadCategoryHighlights() {
    const container = document.getElementById('category-highlights');
    if (!container) return;

    const groups = [
        { title: 'Action', items: window.actionGames || [] },
        { title: 'Battle Royale', items: window.battleRoyaleData || [] },
        { title: 'FPS', items: window.fpsData || [] },
        { title: 'Multiplayer', items: window.multiplayerGames || [] },
        { title: 'Sniper', items: window.sniperData || [] }
    ];

    container.innerHTML = '';
    groups.forEach(group => {
        const section = document.createElement('section');
        section.className = 'new-games';
        section.innerHTML = `
            <div class="series-header">
                <h3 class="section-title">${group.title}</h3>
            </div>
            <div class="games-grid"></div>
        `;

        const grid = section.querySelector('.games-grid');
        group.items.slice(0, 4).forEach((game) => {
            const card = document.createElement('div');
            card.className = 'game-card';
            card.setAttribute('data-game', game.id);
            card.innerHTML = `
                <img src="${game.imageUrl}" alt="${game.name}" onerror="this.src='img/icon/veckIo.jpg'">
                <div class="game-card-title">${game.name}</div>
            `;
            card.addEventListener('click', function () {
                loadGameById(game.id);
            });
            grid.appendChild(card);
        });

        container.appendChild(section);
    });
}

function loadGameById(gameId) {
    const game = getAllGames().find(g => g.id === gameId);
    if (game && game.link) {
        window.location.href = game.link;
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

document.addEventListener('DOMContentLoaded', function () {
    loadMainGame();
    loadRelatedGames();
    loadCategoryHighlights();
    initParticles();
    initCursorGlow();
});
