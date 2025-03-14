// Game variables
let canvas, ctx, gameLoop;
let gameWidth, gameHeight;
let score = 0;
let scrollsCollected = 0;
let gameSpeed = 6;
let gameActive = false;
let groundY;

// Player variables
const player = {
    x: 50,
    y: 0,
    width: 30,
    height: 50,
    jumpForce: -15,
    gravity: 0.8,
    velocityY: 0,
    isJumping: false,
    isSliding: false,
    slideTimer: 0,
    maxSlideTime: 30
};

// Game objects
const obstacles = [];
const scrolls = [];
const particles = [];

// Asset variables
const sprites = {
    ninja: { standing: null, jumping: null, sliding: null },
    fireball: { low: null, high: null },
    scroll: null,
    background: null
};

// Initialize game
function init() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // Mobile touch controls
    canvas.addEventListener('touchstart', handleTouchStart);
    
    // Start/restart buttons
    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('restart-btn').addEventListener('click', restartGame);
    
    // Load assets
    loadAssets();
}

// Load game assets
function loadAssets() {
    // Create temporary sprites until we have proper assets
    createTempSprites();
}

// Create temporary sprites for gameplay
function createTempSprites() {
    // Ninja sprites
    sprites.ninja.standing = createColoredCanvas(30, 50, '#3498db');
    sprites.ninja.jumping = createColoredCanvas(30, 50, '#2980b9');
    sprites.ninja.sliding = createColoredCanvas(50, 30, '#3498db');
    
    // Obstacle sprites
    sprites.fireball.low = createColoredCanvas(30, 30, '#e74c3c');
    sprites.fireball.high = createColoredCanvas(30, 30, '#c0392b');
    
    // Scroll sprite
    sprites.scroll = createColoredCanvas(20, 20, '#f1c40f');
    
    // Background
    sprites.background = createPatternCanvas(100, 100, '#0a0a12', '#0c0c1a');
}

// Create a colored canvas element
function createColoredCanvas(width, height, color) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.fillStyle = color;
    tempCtx.fillRect(0, 0, width, height);
    return tempCanvas;
}

// Create a patterned canvas
function createPatternCanvas(width, height, color1, color2) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Background
    tempCtx.fillStyle = color1;
    tempCtx.fillRect(0, 0, width, height);
    
    // Pattern
    tempCtx.fillStyle = color2;
    for (let i = 0; i < width; i += 20) {
        for (let j = 0; j < height; j += 20) {
            if ((i + j) % 40 === 0) {
                tempCtx.fillRect(i, j, 10, 10);
            }
        }
    }
    
    return tempCanvas;
}

// Resize canvas to fit window
function resizeCanvas() {
    gameWidth = window.innerWidth;
    gameHeight = window.innerHeight;
    
    canvas.width = gameWidth;
    canvas.height = gameHeight;
    
    groundY = gameHeight - 100;
    player.y = groundY - player.height;
}

// Input handlers
function handleKeyDown(e) {
    if (!gameActive) return;
    
    if ((e.code === 'Space' || e.code === 'ArrowUp') && !player.isJumping) {
        jump();
    } else if (e.code === 'ArrowDown') {
        startSlide();
    }
}

function handleKeyUp(e) {
    if (!gameActive) return;
    
    if (e.code === 'ArrowDown') {
        endSlide();
    }
}

function handleTouchStart(e) {
    if (!gameActive) return;
    e.preventDefault();
    
    const touchY = e.touches[0].clientY;
    
    if (touchY < window.innerHeight / 2) {
        // Top half of screen - jump
        if (!player.isJumping) {
            jump();
        }
    } else {
        // Bottom half of screen - slide
        startSlide();
        
        // Auto-end slide after a short delay for mobile
        setTimeout(endSlide, 500);
    }
}

// Player actions
function jump() {
    player.isJumping = true;
    player.velocityY = player.jumpForce;
    
    // Create jump particles
    createParticles(player.x + player.width / 2, player.y + player.height, 5);
}

function startSlide() {
    if (!player.isJumping) {
        player.isSliding = true;
        player.slideTimer = 0;
    }
}

function endSlide() {
    if (player.isSliding) {
        player.isSliding = false;
    }
}

// Game functions
function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    resetGame();
    gameActive = true;
    gameLoop = setInterval(update, 1000 / 60); // 60 FPS
}

function restartGame() {
    document.getElementById('game-over').style.display = 'none';
    resetGame();
    gameActive = true;
    gameLoop = setInterval(update, 1000 / 60); // 60 FPS
}

function resetGame() {
    obstacles.length = 0;
    scrolls.length = 0;
    particles.length = 0;
    score = 0;
    scrollsCollected = 0;
    gameSpeed = 6;
    player.y = groundY - player.height;
    player.velocityY = 0;
    player.isJumping = false;
    player.isSliding = false;
    
    updateUI();
}

function gameOver() {
    gameActive = false;
    clearInterval(gameLoop);
    
    document.getElementById('final-score').textContent = `Score: ${score}`;
    document.getElementById('final-scrolls').textContent = `Scrolls Collected: ${scrollsCollected}`;
    document.getElementById('game-over').style.display = 'flex';
}

// Update game state
function update() {
    // Clear canvas
    ctx.clearRect(0, 0, gameWidth, gameHeight);
    
    // Draw background
    drawBackground();
    
    // Update score
    score += 1;
    if (score % 500 === 0) {
        gameSpeed += 0.5;
    }
    
    // Update UI
    updateUI();
    
    // Update player
    updatePlayer();
    
    // Update and draw obstacles
    updateObstacles();
    
    // Update and draw scrolls
    updateScrolls();
    
    // Update and draw particles
    updateParticles();
    
    // Draw ground
    drawGround();
    
    // Spawn new obstacles
    spawnObstacles();
    
    // Spawn new scrolls
    spawnScrolls();
}

function updateUI() {
    document.getElementById('score').textContent = `Score: ${score}`;
    document.getElementById('scrolls').textContent = `Scrolls: ${scrollsCollected}`;
}

function updatePlayer() {
    // Apply gravity
    if (player.isJumping) {
        player.velocityY += player.gravity;
        player.y += player.velocityY;
        
        // Check if player has landed
        if (player.y >= groundY - player.height) {
            player.y = groundY - player.height;
            player.isJumping = false;
            player.velocityY = 0;
            
            // Create landing particles
            createParticles(player.x + player.width / 2, player.y + player.height, 5);
        }
    }
    
    // Update slide state
    if (player.isSliding) {
        player.slideTimer++;
        if (player.slideTimer >= player.maxSlideTime) {
            player.isSliding = false;
        }
    }
    
    // Draw player
    drawPlayer();
}

function drawPlayer() {
    if (player.isSliding) {
        ctx.drawImage(sprites.ninja.sliding, player.x, player.y + player.height - 30, 50, 30);
    } else if (player.isJumping) {
        ctx.drawImage(sprites.ninja.jumping, player.x, player.y, player.width, player.height);
    } else {
        ctx.drawImage(sprites.ninja.standing, player.x, player.y, player.width, player.height);
    }
}

function updateObstacles() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        
        // Move obstacle
        obstacle.x -= gameSpeed;
        
        // Check if obstacle is off screen
        if (obstacle.x + obstacle.width < 0) {
            obstacles.splice(i, 1);
            continue;
        }
        
        // Draw obstacle
        if (obstacle.type === 'low') {
            ctx.drawImage(sprites.fireball.low, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        } else {
            ctx.drawImage(sprites.fireball.high, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        }
        
        // Check collision
        if (checkCollision(player, obstacle)) {
            gameOver();
        }
    }
}

function updateScrolls() {
    for (let i = scrolls.length - 1; i >= 0; i--) {
        const scroll = scrolls[i];
        
        // Move scroll
        scroll.x -= gameSpeed;
        
        // Check if scroll is off screen
        if (scroll.x + scroll.width < 0) {
            scrolls.splice(i, 1);
            continue;
        }
        
        // Draw scroll
        ctx.drawImage(sprites.scroll, scroll.x, scroll.y, scroll.width, scroll.height);
        
        // Check collection
        if (checkCollision(player, scroll)) {
            scrollsCollected++;
            score += 100;
            scrolls.splice(i, 1);
            
            // Create particles
            createParticles(scroll.x + scroll.width / 2, scroll.y + scroll.height / 2, 10);
        }
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        
        // Update particle position
        particle.x += particle.velocityX;
        particle.y += particle.velocityY;
        
        // Update particle life
        particle.life--;
        
        // Remove dead particles
        if (particle.life <= 0) {
            particles.splice(i, 1);
            continue;
        }
        
        // Draw particle
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.life / particle.maxLife;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

function drawBackground() {
    // Draw tiled background
    const pattern = ctx.createPattern(sprites.background, 'repeat');
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, gameWidth, gameHeight);
}

function drawGround() {
    ctx.fillStyle = '#1a1a2a';
    ctx.fillRect(0, groundY, gameWidth, gameHeight - groundY);
}

function spawnObstacles() {
    const minDistance = 300;
    
    if (obstacles.length === 0 || gameWidth - obstacles[obstacles.length - 1].x >= minDistance) {
        const type = Math.random() < 0.5 ? 'low' : 'high';
        const obstacle = {
            x: gameWidth,
            y: type === 'low' ? groundY - 30 : groundY - 60,
            width: 30,
            height: 30,
            type: type
        };
        
        obstacles.push(obstacle);
    }
}

function spawnScrolls() {
    const minDistance = 500;
    
    if (scrolls.length === 0 || gameWidth - scrolls[scrolls.length - 1].x >= minDistance) {
        if (Math.random() < 0.5) {
            const scroll = {
                x: gameWidth,
                y: groundY - Math.random() * 100 - 50,
                width: 20,
                height: 20
            };
            
            scrolls.push(scroll);
        }
    }
}

function createParticles(x, y, count) {
    for (let i = 0; i < count; i++) {
        const particle = {
            x: x,
            y: y,
            size: Math.random() * 3 + 1,
            velocityX: (Math.random() - 0.5) * 5,
            velocityY: (Math.random() - 0.5) * 5,
            color: 'rgba(255, 215, 0, 0.8)',
            life: Math.random() * 30 + 10,
            maxLife: 40
        };
        
        particles.push(particle);
    }
}

function checkCollision(a, b) {
    // Adjust collision box for sliding
    let aHeight = a.height;
    let aY = a.y;
    
    if (a === player && player.isSliding) {
        aHeight = 30;
        aY = a.y + a.height - 30;
    }
    
    // Check if the rectangles overlap
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        aY < b.y + b.height &&
        aY + aHeight > b.y
    );
}

// Start the game
window.onload = init;