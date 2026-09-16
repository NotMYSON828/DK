const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GRAVITY = 0.6;
const MOVE_SPEED = 4.5;
const JUMP_POWER = 12.5;
const WIN_SCORE = 8;

const keys = {
  left: false,
  right: false,
  jump: false,
};

const level = {
  groundY: 470,
  platforms: [
    { x: 0, y: 500, w: 960, h: 60 },
    { x: 120, y: 410, w: 170, h: 18 },
    { x: 350, y: 340, w: 170, h: 18 },
    { x: 610, y: 270, w: 180, h: 18 },
    { x: 760, y: 190, w: 120, h: 18 },
  ],
  coins: [
    { x: 180, y: 360, r: 10, collected: false },
    { x: 420, y: 290, r: 10, collected: false },
    { x: 670, y: 220, r: 10, collected: false },
    { x: 810, y: 140, r: 10, collected: false },
    { x: 880, y: 140, r: 10, collected: false },
    { x: 510, y: 420, r: 10, collected: false },
    { x: 270, y: 420, r: 10, collected: false },
    { x: 720, y: 420, r: 10, collected: false },
  ],
  hazards: [
    { x: 290, y: 490, w: 32, h: 18 },
    { x: 560, y: 490, w: 32, h: 18 },
    { x: 860, y: 490, w: 32, h: 18 },
  ],
  goal: { x: 900, y: 130, w: 24, h: 50 },
};

const player = {
  x: 40,
  y: 420,
  w: 26,
  h: 30,
  vx: 0,
  vy: 0,
  onGround: false,
  lives: 3,
  score: 0,
  alive: true,
};

function clearInputState() {
  keys.left = false;
  keys.right = false;
  keys.jump = false;
}

function resetLevel() {
  player.x = 40;
  player.y = 420;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  player.alive = true;
  clearInputState();

  level.coins.forEach((coin) => {
    coin.collected = false;
  });

  player.score = 0;
  updateHud();
}

function updateHud() {
  scoreEl.textContent = String(player.score);
  livesEl.textContent = String(player.lives);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function rectsIntersect(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function circleRectCollide(circle, rect) {
  const closestX = clamp(circle.x, rect.x, rect.x + rect.w);
  const closestY = clamp(circle.y, rect.y, rect.y + rect.h);
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  return dx * dx + dy * dy < circle.r * circle.r;
}

function handleInput() {
  if (keys.left) player.vx = -MOVE_SPEED;
  else if (keys.right) player.vx = MOVE_SPEED;
  else player.vx *= 0.7;

  if (keys.jump && player.onGround) {
    player.vy = -JUMP_POWER;
    player.onGround = false;
  }
}

function updatePlayer() {
  handleInput();

  player.vy += GRAVITY;
  player.x += player.vx;
  player.y += player.vy;

  player.onGround = false;

  for (const platform of level.platforms) {
    const previousBottom = player.y - player.vy + player.h;
    const previousTop = player.y - player.vy;

    if (
      player.vy >= 0 &&
      previousBottom <= platform.y + 10 &&
      player.y + player.h >= platform.y &&
      player.y < platform.y + platform.h + 30
    ) {
      if (rectsIntersect({ x: player.x, y: player.y, w: player.w, h: player.h }, platform)) {
        player.y = platform.y - player.h;
        player.vy = 0;
        player.onGround = true;
      }
    }

    if (
      player.vy < 0 &&
      previousTop >= platform.y + platform.h - 10 &&
      player.y <= platform.y + platform.h &&
      player.y + player.h > platform.y
    ) {
      if (rectsIntersect({ x: player.x, y: player.y, w: player.w, h: player.h }, platform)) {
        player.y = platform.y + platform.h;
        player.vy = 0;
      }
    }
  }

  player.x = clamp(player.x, 0, WIDTH - player.w);

  if (player.y > HEIGHT + 80) {
    loseLife();
  }

  for (const coin of level.coins) {
    if (!coin.collected) {
      const coinHitbox = { x: coin.x - coin.r, y: coin.y - coin.r, w: coin.r * 2, h: coin.r * 2 };
      if (rectsIntersect({ x: player.x, y: player.y, w: player.w, h: player.h }, coinHitbox)) {
        coin.collected = true;
        player.score += 1;
        updateHud();
      }
    }
  }

  for (const hazard of level.hazards) {
    if (rectsIntersect({ x: player.x, y: player.y, w: player.w, h: player.h }, hazard)) {
      loseLife();
      return;
    }
  }

  const goalRect = level.goal;
  if (rectsIntersect({ x: player.x, y: player.y, w: player.w, h: player.h }, goalRect)) {
    if (player.score >= WIN_SCORE) {
      player.alive = false;
      setTimeout(() => {
        alert('You win! DK is the game! Press R to play again.');
      }, 50);
    }
  }
}

function loseLife() {
  if (!player.alive) return;
  player.lives -= 1;
  updateHud();

  if (player.lives <= 0) {
    player.alive = false;
    setTimeout(() => {
      alert('Game over! Press R to restart.');
    }, 50);
    return;
  }

  clearInputState();
  player.x = 40;
  player.y = 420;
  player.vx = 0;
  player.vy = 0;
}

function drawBackground() {
  ctx.fillStyle = '#73d1ff';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = '#7ccf63';
  ctx.fillRect(0, 300, WIDTH, 220);

  for (let i = 0; i < 18; i += 1) {
    const x = i * 60;
    const h = 40 + (i % 4) * 12;
    ctx.fillStyle = '#4f9a3a';
    ctx.fillRect(x, 300 - h, 40, h);
  }

  ctx.fillStyle = '#d28d46';
  ctx.fillRect(0, 480, WIDTH, 60);
}

function drawPlatforms() {
  for (const platform of level.platforms) {
    ctx.fillStyle = '#8f5a2a';
    ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
    ctx.fillStyle = '#a56f05';
    ctx.fillRect(platform.x, platform.y, platform.w, 5);
  }
}

function drawCoins() {
  for (const coin of level.coins) {
    if (coin.collected) continue;
    ctx.beginPath();
    ctx.fillStyle = '#ffd54d';
    ctx.arc(coin.x, coin.y, coin.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  }
}

function drawHazards() {
  for (const hazard of level.hazards) {
    ctx.fillStyle = '#f65b45';
    ctx.fillRect(hazard.x, hazard.y, hazard.w, hazard.h);
    ctx.fillStyle = '#7a170d';
    ctx.fillRect(hazard.x + 7, hazard.y + 4, hazard.w - 14, 8);
  }
}

function drawGoal() {
  const { x, y, w, h } = level.goal;
  ctx.fillStyle = '#e6f7ff';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#2d7d43';
  ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
}

function drawPlayer() {
  ctx.fillStyle = '#1a4db6';
  ctx.fillRect(player.x, player.y, player.w, player.h);
  ctx.fillStyle = '#f6d86a';
  ctx.fillRect(player.x + 6, player.y + 4, 14, 8);
  ctx.fillStyle = '#111';
  ctx.fillRect(player.x + 8, player.y + 16, 4, 4);
  ctx.fillRect(player.x + 16, player.y + 16, 4, 4);
}

function drawText() {
  ctx.fillStyle = 'rgba(10, 30, 22, 0.7)';
  ctx.font = 'bold 28px Arial';
  ctx.fillText('DK', 24, 42);

  ctx.font = '18px Arial';
  ctx.fillText('Collect 8 gems to reach the portal', 24, 74);
}

function draw() {
  drawBackground();
  drawPlatforms();
  drawCoins();
  drawHazards();
  drawGoal();
  drawPlayer();
  drawText();
}

function gameLoop() {
  if (player.alive) {
    updatePlayer();
  }

  draw();
  requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', (event) => {
  const code = event.code;

  if (code === 'ArrowLeft' || code === 'KeyA') keys.left = true;
  if (code === 'ArrowRight' || code === 'KeyD') keys.right = true;
  if (code === 'ArrowUp' || code === 'KeyW' || code === 'Space') {
    keys.jump = true;
    event.preventDefault();
  }

  if (code === 'KeyR') {
    player.lives = 3;
    resetLevel();
  }
});

window.addEventListener('keyup', (event) => {
  const code = event.code;

  if (code === 'ArrowLeft' || code === 'KeyA') keys.left = false;
  if (code === 'ArrowRight' || code === 'KeyD') keys.right = false;
  if (code === 'ArrowUp' || code === 'KeyW' || code === 'Space') keys.jump = false;
});

resetLevel();
updateHud();
gameLoop();
