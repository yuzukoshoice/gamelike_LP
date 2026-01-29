const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const uiPrompt = document.getElementById('interaction-prompt');
const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalContent = document.getElementById('modal-content');
const closeModalBtn = document.getElementById('close-modal-btn');
const gemCounter = document.getElementById('gem-counter');

// --- Game Config ---
const TILE_SIZE = 40;
const PLAYER_SPEED = 4;
const ENEMY_SPEED = 2;

const Colors = {
    GRASS: '#2e7d32', // Darker grass
    WATER: '#0288d1',
    DIRT: '#795548',
    WALL: '#546e7a',
    PLAYER: '#ffeb3b',
    ENEMY: '#d32f2f',
    GEM: '#e040fb',
    GATE: '#ffd700', // Gold
    GATE_OPEN: '#424242'
};

// --- Map Data ---
// 0: Grass, 1: Wall, 2: Water, 3: Dirt, 4: Gate, 9: POI
const MAP_WIDTH = 20;
const MAP_HEIGHT = 20;

// Slightly more complex map with rooms/areas
const mapData = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 2, 2, 2, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 9, 0, 0, 0, 0, 0, 1, 2, 2, 2, 0, 1], // Gem 1 Area (Top mid)
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 2, 9, 2, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 2, 2, 2, 0, 1],
    [1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 9, 0, 0, 0, 0, 0, 0, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 1], // Gem 2 Area (Left)
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 3, 9, 3, 0, 0, 0, 0, 0, 0, 0, 1], // Start & Central Sign
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 9, 0, 0, 1], // Gem 3 Area (Right)
    [1, 1, 1, 1, 4, 1, 1, 1, 1, 1, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Gate at (4, 12)
    [1, 0, 0, 1, 3, 1, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 1], // Path to dungeon
    [1, 0, 0, 1, 3, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 1, 3, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 3, 9, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // Final Content Area (Bottom Left)
    [1, 0, 0, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // Maybe Gem 4 bottom right?
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];
// Fix indexing: Row 12, Col 4 is gate.

// --- Game Objects ---
let camera = { x: 0, y: 0 };
let player = {
    x: 10 * TILE_SIZE,
    y: 9 * TILE_SIZE,
    width: 28,
    height: 28,
    speed: PLAYER_SPEED,
    invincible: 0,
    direction: 'down'
};

// Gems (Collectibles)
let gems = [
    { x: 8, y: 2, collected: false }, // Top
    { x: 2, y: 8, collected: false }, // Left
    { x: 16, y: 11, collected: false }, // Right
    { x: 17, y: 17, collected: false }  // Bottom Right (Hidden in simple map update above? let's add accessible area)
];
// Update map for Gem 4 (Bottom Right)
mapData[17][17] = 0; mapData[16][17] = 0; mapData[17][16] = 0; // Clear area

// Gate
let gate = { x: 4, y: 12, open: false };

// Enemies (Simple patrol)
let enemies = [
    { x: 5 * TILE_SIZE, y: 3 * TILE_SIZE, dx: ENEMY_SPEED, dy: 0, range: 100, startX: 5 * TILE_SIZE },
    { x: 15 * TILE_SIZE, y: 7 * TILE_SIZE, dx: 0, dy: ENEMY_SPEED, range: 100, startY: 7 * TILE_SIZE },
    { x: 2 * TILE_SIZE, y: 15 * TILE_SIZE, dx: ENEMY_SPEED, dy: 0, range: 150, startX: 2 * TILE_SIZE },
    { x: 12 * TILE_SIZE, y: 15 * TILE_SIZE, dx: -ENEMY_SPEED, dy: ENEMY_SPEED, range: 0, type: 'random' }
];

// Content Data
const POIs = [
    { x: 10, y: 9, title: "WELCOME", content: "<p>Welcome, Adventurer!</p><p>Collect 4 Gems to open the Golden Gate.</p>" },
    { x: 4, y: 17, title: "SECRET ARCHIVE", content: "<h3>Congratulations!</h3><p>You have unlocked the secret portfolio.</p><ul><li>Project X: Top Secret</li><li>Project Y: Next Gen AI</li></ul>" },
    { x: 4, y: 12, title: "LOCKED GATE", content: "<p>The gate is locked. You need more Gems.</p>", isGate: true }
];

let keys = {};
let activePOI = null;
let isModalOpen = false;
let gemCount = 0;

// --- Input ---
window.addEventListener('keydown', e => { keys[e.key] = true; checkInteraction(e); });
window.addEventListener('keyup', e => keys[e.key] = false);

// Mobile
const addTouch = (id, k) => {
    const el = document.getElementById(id);
    el.addEventListener('touchstart', (e) => { keys[k] = true; e.preventDefault(); });
    el.addEventListener('touchend', (e) => { keys[k] = false; e.preventDefault(); });
};
addTouch('up-btn', 'ArrowUp');
addTouch('down-btn', 'ArrowDown');
addTouch('left-btn', 'ArrowLeft');
addTouch('right-btn', 'ArrowRight');
document.getElementById('action-btn').addEventListener('touchstart', (e) => { checkInteraction({ key: ' ' }); e.preventDefault(); });


function checkInteraction(e) {
    if (isModalOpen) return;
    if (e.key === ' ' || e.key === 'Enter') {
        if (activePOI) {
            // Check Gate Logic
            if (activePOI.isGate) {
                if (gate.open) return; // Already open
                if (gemCount >= 4) {
                    gate.open = true;
                    mapData[gate.y][gate.x] = 3; // Change to floor
                    playSound('open');
                    activePOI = null; // Remove interaction
                    return;
                }
            }
            openModal(activePOI);
        }
    }
}

function openModal(poi) {
    modalTitle.innerText = poi.title;
    modalContent.innerHTML = poi.content;
    modalOverlay.classList.remove('hidden');
    isModalOpen = true;
    keys = {};
}

closeModalBtn.addEventListener('click', () => {
    modalOverlay.classList.add('hidden');
    isModalOpen = false;
});

// --- Engine ---

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

function checkCollision(newX, newY) {
    // Check 4 corners
    const checkTile = (x, y) => {
        const c = Math.floor(x / TILE_SIZE);
        const r = Math.floor(y / TILE_SIZE);
        if (c < 0 || c >= MAP_WIDTH || r < 0 || r >= MAP_HEIGHT) return true;
        const tile = mapData[r][c];
        // 1=Wall, 2=Water, 4=Gate(if closed)
        if (tile === 4) return !gate.open;
        return tile === 1 || tile === 2;
    };
    return checkTile(newX, newY) || checkTile(newX + player.width, newY) ||
        checkTile(newX, newY + player.height) || checkTile(newX + player.width, newY + player.height);
}

function checkEntities() {
    // Gems
    gems.forEach(g => {
        if (g.collected) return;
        // Simple Center overlap check
        const px = player.x + player.width / 2;
        const py = player.y + player.height / 2;
        const gx = g.x * TILE_SIZE + TILE_SIZE / 2;
        const gy = g.y * TILE_SIZE + TILE_SIZE / 2;
        const dist = Math.hypot(px - gx, py - gy);
        if (dist < 20) {
            g.collected = true;
            gemCount++;
            gemCounter.innerText = `GEMS: ${gemCount}/4`;
            playSound('coin');
            // Flash effect?
        }
    });

    // POIs
    const cx = player.x + player.width / 2;
    const cy = player.y + player.height / 2;
    const c = Math.floor(cx / TILE_SIZE);
    const r = Math.floor(cy / TILE_SIZE);

    if (mapData[r] && (mapData[r][c] === 9 || mapData[r][c] === 4)) {
        activePOI = POIs.find(p => p.x === c && p.y === r);
    }

    // If NOT standing on something, check FACE (for Gate/Solid objects)
    if (!activePOI) {
        let fc = c;
        let fr = r;
        if (player.direction === 'up') fr--;
        if (player.direction === 'down') fr++;
        if (player.direction === 'left') fc--;
        if (player.direction === 'right') fc++;

        if (mapData[fr] && mapData[fr][fc] === 4) { // 4 is Gate
            activePOI = POIs.find(p => p.x === fc && p.y === fr);
        }
    }

    if (activePOI) {
        uiPrompt.classList.remove('hidden');
        if (activePOI.isGate && gemCount >= 4 && !gate.open) {
            uiPrompt.innerText = "PRESS SPACE TO OPEN";
        } else if (activePOI.isGate && !gate.open) {
            uiPrompt.innerText = "LOCKED (Need 4 Gems)";
        } else {
            uiPrompt.innerText = "PRESS SPACE";
        }
    } else {
        activePOI = null;
        uiPrompt.classList.add('hidden');
    }
}

function update() {
    if (isModalOpen) return;

    // Player Move
    let dx = 0; let dy = 0;
    if (keys['ArrowUp'] || keys['w']) { dy = -player.speed; player.direction = 'up'; }
    if (keys['ArrowDown'] || keys['s']) { dy = player.speed; player.direction = 'down'; }
    if (keys['ArrowLeft'] || keys['a']) { dx = -player.speed; player.direction = 'left'; }
    if (keys['ArrowRight'] || keys['d']) { dx = player.speed; player.direction = 'right'; }

    if (dx !== 0 && !checkCollision(player.x + dx, player.y)) player.x += dx;
    if (dy !== 0 && !checkCollision(player.x, player.y + dy)) player.y += dy;

    // Enemies Move
    enemies.forEach(e => {
        if (e.type === 'random') {
            if (Math.random() < 0.05) e.dx = (Math.random() - 0.5) * 4;
            if (Math.random() < 0.05) e.dy = (Math.random() - 0.5) * 4;
            let nextX = e.x + e.dx;
            let nextY = e.y + e.dy;
            if (!checkCollision(nextX, nextY)) { e.x = nextX; e.y = nextY; }
            else { e.dx = -e.dx; e.dy = -e.dy; }
        } else {
            // Patrol Horizontal/Vertical
            e.x += e.dx; e.y += e.dy;
            if (e.dx !== 0 && Math.abs(e.x - e.startX) > e.range) e.dx = -e.dx;
            if (e.dy !== 0 && Math.abs(e.y - e.startY) > e.range) e.dy = -e.dy;
        }

        // Collision with Player
        if (player.invincible <= 0) {
            if (e.x < player.x + player.width && e.x + TILE_SIZE > player.x &&
                e.y < player.y + player.height && e.y + TILE_SIZE > player.y) {
                // Hit
                player.invincible = 60; // frames
                // Knockback
                player.x -= dx * 10;
                player.y -= dy * 10;
                playSound('hit');
            }
        }
    });
    if (player.invincible > 0) player.invincible--;

    checkEntities();

    // Camera
    camera.x = player.x - canvas.width / 2 + player.width / 2;
    camera.y = player.y - canvas.height / 2 + player.height / 2;
    camera.x = Math.max(0, Math.min(camera.x, MAP_WIDTH * TILE_SIZE - canvas.width));
    camera.y = Math.max(0, Math.min(camera.y, MAP_HEIGHT * TILE_SIZE - canvas.height));
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const startCol = Math.floor(camera.x / TILE_SIZE);
    const endCol = startCol + (canvas.width / TILE_SIZE) + 1;
    const startRow = Math.floor(camera.y / TILE_SIZE);
    const endRow = startRow + (canvas.height / TILE_SIZE) + 1;

    for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
            if (r >= 0 && r < MAP_HEIGHT && c >= 0 && c < MAP_WIDTH) {
                drawTile(c, r, mapData[r][c], Math.floor(c * TILE_SIZE - camera.x), Math.floor(r * TILE_SIZE - camera.y));
            }
        }
    }

    // Draw Gems
    gems.forEach(g => {
        if (!g.collected) {
            const x = Math.floor(g.x * TILE_SIZE - camera.x);
            const y = Math.floor(g.y * TILE_SIZE - camera.y);
            ctx.fillStyle = Colors.GEM;
            ctx.beginPath();
            ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 10, 0, Math.PI * 2);
            ctx.fill();
            // Sparkle
            ctx.fillStyle = "#fff";
            ctx.fillRect(x + TILE_SIZE / 2 - 2, y + TILE_SIZE / 2 - 2, 4, 4);
        }
    });

    // Draw Enemies
    enemies.forEach(e => {
        const x = Math.floor(e.x - camera.x);
        const y = Math.floor(e.y - camera.y);
        ctx.fillStyle = Colors.ENEMY;
        ctx.fillRect(x, y, 30, 30);
        // Face
        ctx.fillStyle = "#000";
        ctx.fillRect(x + 5, y + 5, 8, 8);
        ctx.fillRect(x + 17, y + 5, 8, 8);
    });

    // Draw Player
    if (Math.floor(Date.now() / 100) % 2 === 0 || player.invincible === 0) {
        drawPlayer(Math.floor(player.x - camera.x), Math.floor(player.y - camera.y));
    }

    requestAnimationFrame(loop);
}

function drawTile(c, r, tileType, x, y) {
    if (tileType === 0) { ctx.fillStyle = Colors.GRASS; ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE); }
    else if (tileType === 1) { ctx.fillStyle = Colors.WALL; ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE); }
    else if (tileType === 2) { ctx.fillStyle = Colors.WATER; ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE); }
    else if (tileType === 3) { ctx.fillStyle = Colors.DIRT; ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE); }
    else if (tileType === 4) {
        ctx.fillStyle = gate.open ? Colors.GATE_OPEN : Colors.GATE;
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        if (!gate.open) {
            ctx.fillStyle = "#000";
            ctx.fillRect(x + 5, y + 5, 30, 30); // Keyhole
        }
    }
    else if (tileType === 9) {
        ctx.fillStyle = Colors.GRASS; ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#795548'; ctx.fillRect(x + 15, y + 20, 10, 20);
        ctx.fillStyle = '#a1887f'; ctx.fillRect(x + 5, y + 10, 30, 15);
    }
}

function drawPlayer(x, y) {
    ctx.fillStyle = Colors.PLAYER;
    ctx.fillRect(x, y, player.width, player.height);
    ctx.fillStyle = '#000';
    if (keys['ArrowLeft']) ctx.fillRect(x + 5, y + 10, 4, 4);
    else if (keys['ArrowRight']) ctx.fillRect(x + 20, y + 10, 4, 4);
    else { ctx.fillRect(x + 8, y + 10, 4, 4); ctx.fillRect(x + 18, y + 10, 4, 4); }
}

function playSound(type) {
    // Placeholder for sound effects
    // console.log(type);
}

function loop() {
    update();
    draw();
}
loop();
