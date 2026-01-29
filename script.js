const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const gameControls = document.getElementById('game-controls');
const startBtn = document.getElementById('start-btn');
const skipBtn = document.getElementById('skip-btn');
const scoreEl = document.getElementById('score');
const gameOverlay = document.getElementById('game-overlay');

let gameRunning = false;
let animationId;
let score = 0;

// Config
const config = {
    paddleHeight: 20,
    basePaddleWidth: 150,
    paddleWidth: 150,
    ballRadius: 10,
    brickRowCount: 12,
    brickColumnCount: 10,
    brickPadding: 2,
    ballSpeed: 6,
    powerUpDropRate: 0.15, // 15% chance
    laserDuration: 500, // Frames (approx 8-9 seconds)
};

// Game State
let paddleX;
let balls = []; // Array of ball objects {x, y, dx, dy, color}
let bricks = [];
let powerUps = []; // Array of powerup objects {x, y, type, dy, color}
// PowerUp Types: 1: MultiBall, 2: Laser, 3: WidePaddle
let lasers = []; // Array of laser shots
let particles = []; // Explosion particles

// Paddle State
let paddle = {
    x: 0,
    width: config.basePaddleWidth,
    laserActive: false,
    laserTimer: 0
};

// Utils
function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

// Handle Resize
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    config.basePaddleWidth = Math.min(200, canvas.width * 0.25);
    paddle.width = config.basePaddleWidth; // Reset width on resize logic for simplicity or keep ratio
    paddle.x = (canvas.width - paddle.width) / 2;

    if (bricks.length === 0) {
        initBricks();
    }
}

let activeBricksCount = 0;

// Initialize Bricks
function initBricks() {
    bricks = [];
    activeBricksCount = 0; // Reset count

    // Config for Bricks
    const brickWidthRaw = canvas.width / 10;
    config.brickColumnCount = Math.floor(canvas.width / brickWidthRaw);

    // Fixed Height Logic
    const targetBrickHeight = 40;
    const availableHeight = canvas.height - 250; // Leave 250px space
    config.brickRowCount = Math.floor(availableHeight / targetBrickHeight);
    config.brickHeight = targetBrickHeight; // Store for use in draw/physics

    for (let c = 0; c < config.brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < config.brickRowCount; r++) {
            bricks[c][r] = {
                x: 0,
                y: 0,
                status: 1,
                color: r % 2 === 0 ? '#111' : '#1e1e1e', // Darker blocks
                borderColor: '#333'
            };
            activeBricksCount++; // Count total bricks
        }
    }
}

// Check Win Condition
function checkWin() {
    if (activeBricksCount <= 0) {
        gameRunning = false;
        cancelAnimationFrame(animationId);

        // Show Victory Message
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = "bold 60px 'Outfit', sans-serif";
        ctx.fillStyle = "#00f2ff";
        ctx.textAlign = "center";
        ctx.fillText("COMPLETE", canvas.width / 2, canvas.height / 2);

        ctx.font = "20px 'Zen Kaku Gothic New', sans-serif";
        ctx.fillStyle = "#fff";
        ctx.fillText("Welcome to the Future", canvas.width / 2, canvas.height / 2 + 50);

        // Transition after delay
        setTimeout(revealContent, 2000);
    }
}

// Unified Reveal Function
function revealContent() {
    gameRunning = false;
    // fade out
    canvas.style.transition = "opacity 1s ease";
    canvas.style.opacity = "0";
    gameControls.style.opacity = "0"; // active transition for controls too

    setTimeout(() => {
        gameOverlay.style.display = "none";
        document.body.style.overflow = "auto";
        // Optional: Scroll to top or specific section
    }, 1000);
}

// --- Spawning Logic ---

function spawnBall(x, y, dx, dy) {
    balls.push({
        x: x,
        y: y,
        dx: dx,
        dy: dy,
        speed: config.ballSpeed,
        color: '#00f2ff'
    });
}

function spawnPowerUp(x, y) {
    const type = Math.floor(Math.random() * 3) + 1;
    // 1: MultiBall (Cyan), 2: Laser (Red), 3: Wide (Green)
    let color;
    let symbol;
    if (type === 1) {
        color = '#00f2ff';
        symbol = 'M';
    }
    if (type === 2) {
        color = '#ff0055';
        symbol = 'L';
    }
    if (type === 3) {
        color = '#00ffaa';
        symbol = 'W';
    }

    powerUps.push({
        x: x,
        y: y,
        dy: 3, // Falling speed
        type: type,
        color: color,
        symbol: symbol
    });
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: x,
            y: y,
            dx: (Math.random() - 0.5) * 4,
            dy: (Math.random() - 0.5) * 4,
            life: 20,
            color: color
        });
    }
}

// --- Update & Draw ---

function drawBricks() {
    const brickWidth = canvas.width / config.brickColumnCount;
    const brickHeight = config.brickHeight; // Use fixed height

    // Draw Bottom Mask (to hide LP bottom where there are no bricks)
    const bricksEndY = config.brickRowCount * brickHeight;
    ctx.fillStyle = "#000"; // Match background
    ctx.fillRect(0, bricksEndY, canvas.width, canvas.height - bricksEndY);

    for (let c = 0; c < config.brickColumnCount; c++) {
        for (let r = 0; r < config.brickRowCount; r++) {
            const b = bricks[c][r];
            if (b.status === 1) {
                const brickX = (c * brickWidth);
                const brickY = (r * brickHeight);
                b.x = brickX;
                b.y = brickY;

                ctx.beginPath();
                ctx.rect(brickX, brickY, brickWidth, brickHeight);
                ctx.fillStyle = b.color;
                ctx.fill();
                ctx.strokeStyle = b.borderColor;
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.closePath();
            }
        }
    }
}

function drawBalls() {
    balls.forEach(ball => {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, config.ballRadius, 0, Math.PI * 2);
        ctx.fillStyle = ball.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = ball.color;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.closePath();
    });
}

function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddle.x, canvas.height - config.paddleHeight - 10, paddle.width, config.paddleHeight);

    // Paddle Color changes based on state
    if (paddle.laserActive) {
        ctx.fillStyle = "#ff0055"; // Laser mode red
        ctx.shadowColor = "#ff0055";
    } else {
        ctx.fillStyle = "#00f2ff"; // Normal Cyan
        ctx.shadowColor = "#00f2ff";
    }

    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.closePath();

    // Draw Guns if Laser Active
    if (paddle.laserActive) {
        ctx.fillStyle = "#fff";
        ctx.fillRect(paddle.x, canvas.height - config.paddleHeight - 15, 5, 10);
        ctx.fillRect(paddle.x + paddle.width - 5, canvas.height - config.paddleHeight - 15, 5, 10);
    }
}

function drawPowerUps() {
    powerUps.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.fillStyle = "#000";
        ctx.font = "10px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(p.symbol, p.x, p.y);
        ctx.closePath();
    });
}

function drawLasers() {
    ctx.fillStyle = "#ff0055";
    lasers.forEach(l => {
        ctx.fillRect(l.x, l.y, 4, 15);
    });
}

function drawParticles() {
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 3, 3);
    });
}

// --- Logic ---

function movePaddle() {
    // handled by mouse/touch events updating paddle.x
    // Logic to shrink/expand paddle smoothly? For now instant.
    if (paddle.laserActive) {
        paddle.laserTimer--;
        if (paddle.laserTimer <= 0) {
            paddle.laserActive = false;
        }
    }
}

function applyPowerUp(type) {
    if (type === 1) { // MultiBall
        // Spawn 2 more balls from current first ball or paddle
        if (balls.length > 0) {
            let b = balls[0];
            spawnBall(b.x, b.y, config.ballSpeed * 0.5, -config.ballSpeed);
            spawnBall(b.x, b.y, -config.ballSpeed * 0.5, -config.ballSpeed);
        } else {
            // If no balls (rare), spawn from paddle
            spawnBall(paddle.x + paddle.width / 2, canvas.height - 40, config.ballSpeed, -config.ballSpeed);
        }
    } else if (type === 2) { // Laser
        paddle.laserActive = true;
        paddle.laserTimer = config.laserDuration;
    } else if (type === 3) { // Wide
        paddle.width = config.basePaddleWidth * 1.5;
        setTimeout(() => {
            paddle.width = config.basePaddleWidth;
        }, 10000);
    }
}

function updatePhysics() {
    const brickWidth = canvas.width / config.brickColumnCount;
    const brickHeight = config.brickHeight;

    // 1. Balls
    for (let i = balls.length - 1; i >= 0; i--) {
        let b = balls[i];

        // Wall Collision
        if (b.x + b.dx > canvas.width - config.ballRadius || b.x + b.dx < config.ballRadius) {
            b.dx = -b.dx;
        }
        if (b.y + b.dy < config.ballRadius) {
            b.dy = -b.dy;
        }

        // Paddle Collision
        // Paddle Position is: canvas.height - config.paddleHeight - 10
        const paddleY = canvas.height - config.paddleHeight - 10;

        // Check if ball hits paddle level
        // We check if the ball is moving down (dy > 0) and intersects the paddle
        if (b.dy > 0 && b.y + config.ballRadius >= paddleY && b.y - config.ballRadius <= paddleY + config.paddleHeight) {
            if (b.x >= paddle.x && b.x <= paddle.x + paddle.width) {
                // Hit!
                // Reset position to sit on top of paddle to avoid penetration
                b.y = paddleY - config.ballRadius;

                // Calculate angle
                let hitPoint = 2 * (b.x - (paddle.x + paddle.width / 2)) / paddle.width;
                b.dx = hitPoint * config.ballSpeed * 1.5;
                b.dy = -Math.abs(b.dy); // Force up
            }
        }

        // Bottom (Death)
        if (b.y + b.dy > canvas.height - config.ballRadius) {
            // Already missed paddle if we are here
            balls.splice(i, 1);
            continue;
        }

        // Brick Collision
        // Optimization: Calculate approximate grid lookup?
        // For simplicity with this few blocks, loop is fine.
        let hitEvents = false;
        for (let c = 0; c < config.brickColumnCount; c++) {
            for (let r = 0; r < config.brickRowCount; r++) {
                let brick = bricks[c][r];
                if (brick.status === 1) {
                    if (b.x > brick.x && b.x < brick.x + brickWidth && b.y > brick.y && b.y < brick.y + brickHeight) {
                        b.dy = -b.dy;
                        brick.status = 0;
                        activeBricksCount--; // Decrement
                        score++;
                        scoreEl.innerText = score;
                        hitEvents = true;
                        createExplosion(brick.x + brickWidth / 2, brick.y + brickHeight / 2, brick.color);

                        // Drop PowerUp?
                        if (Math.random() < config.powerUpDropRate) {
                            spawnPowerUp(brick.x + brickWidth / 2, brick.y + brickHeight / 2);
                        }

                        // Check Win immediately or end of frame? Immediately is fine.
                        if (activeBricksCount <= 0) checkWin();
                    }
                }
            }
        }
        if (!gameRunning) return; // Exit if won

        b.x += b.dx;
        b.y += b.dy;
    }

    // 2. PowerUps
    for (let i = powerUps.length - 1; i >= 0; i--) {
        let p = powerUps[i];
        p.y += p.dy;

        // Paddle Collision
        if (p.y + 10 >= canvas.height - config.paddleHeight - 10 &&
            p.x >= paddle.x && p.x <= paddle.x + paddle.width) {
            applyPowerUp(p.type);
            powerUps.splice(i, 1); // Collect
        } else if (p.y > canvas.height) {
            powerUps.splice(i, 1); // Miss
        }
    }

    // 3. Lasers
    if (paddle.laserActive && gameRunning) {
        // Auto fire every 20 frames? Or on click?
        // Let's do auto fire (Machine gun style)
        if (frameCounter % 15 === 0) {
            lasers.push({
                x: paddle.x + 5,
                y: canvas.height - 40
            });
            lasers.push({
                x: paddle.x + paddle.width - 5,
                y: canvas.height - 40
            });
        }
    }

    for (let i = lasers.length - 1; i >= 0; i--) {
        let l = lasers[i];
        l.y -= 10; // Speed

        // Check Collision
        let hit = false;
        for (let c = 0; c < config.brickColumnCount; c++) {
            for (let r = 0; r < config.brickRowCount; r++) {
                let brick = bricks[c][r];
                if (brick.status === 1) {
                    if (l.x > brick.x && l.x < brick.x + brickWidth &&
                        l.y > brick.y && l.y < brick.y + brickHeight) {
                        brick.status = 0;
                        activeBricksCount--; // Decrement
                        score++;
                        scoreEl.innerText = score;
                        createExplosion(brick.x + brickWidth / 2, brick.y + brickHeight / 2, '#ff0055');
                        hit = true;
                        // Lasers don't spawn powerups? Or yes? Maybe yes.
                        if (Math.random() < config.powerUpDropRate) {
                            spawnPowerUp(brick.x + brickWidth / 2, brick.y + brickHeight / 2);
                        }
                        if (activeBricksCount <= 0) checkWin();
                    }
                }
            }
        }

        if (hit || l.y < 0) {
            lasers.splice(i, 1);
        }
    }

    // 4. Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].x += particles[i].dx;
        particles[i].y += particles[i].dy;
        particles[i].life--;
        if (particles[i].life <= 0) particles.splice(i, 1);
    }

    // Respawn ball if all lost
    if (balls.length === 0 && gameRunning) {
        spawnBall(paddle.x + paddle.width / 2, canvas.height - 40, config.ballSpeed, -config.ballSpeed);
    }
}

let frameCounter = 0;

function draw() {
    if (!gameRunning) return;

    frameCounter++;
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Standard clear

    // To simulate "breaking the wall to see behind", we actually need the wall to be opaque
    // and the background to be transparent?
    // Current CSS Logic: Canvas is on top. bricks are drawn. If brick is gone, we see behind canvas.
    // So `clearRect` makes the canvas transparent. Correct.

    drawBricks();
    drawBalls();
    drawPaddle();
    drawPowerUps();
    drawLasers();
    drawParticles();

    movePaddle();
    updatePhysics();

    animationId = requestAnimationFrame(draw);
}

// Input
function mouseMoveHandler(e) {
    const relativeX = e.clientX;
    if (relativeX > 0 && relativeX < canvas.width) {
        paddle.x = relativeX - paddle.width / 2;
    }
}

function touchMoveHandler(e) {
    const relativeX = e.touches[0].clientX;
    if (relativeX > 0 && relativeX < canvas.width) {
        paddle.x = relativeX - paddle.width / 2;
    }
    e.preventDefault();
}

function startGame() {
    startScreen.classList.add('hidden');
    gameControls.classList.remove('hidden');
    paddle.width = config.basePaddleWidth;

    balls = [];
    powerUps = [];
    lasers = [];
    particles = [];

    spawnBall(canvas.width / 2, canvas.height - 30, config.ballSpeed, -config.ballSpeed);

    gameRunning = true;
    initBricks();
    draw();
}

function skipGame() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    canvas.style.transition = "opacity 1s ease";
    canvas.style.opacity = "0";
    setTimeout(() => {
        gameOverlay.style.display = "none";
        document.body.style.overflow = "auto";
    }, 1000);
}

// Listeners
startBtn.addEventListener('click', startGame);
skipBtn.removeEventListener('click', skipGame); // Remove old listener if possible or just overwrite
skipBtn.addEventListener('click', revealContent); // Use new unified function
document.addEventListener("mousemove", mouseMoveHandler, false);
document.addEventListener("touchmove", touchMoveHandler, {
    passive: false
});
window.addEventListener('resize', resizeCanvas);

// Init
resizeCanvas();
initBricks();
drawBricks(); // Draw initial static
