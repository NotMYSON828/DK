const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GRAVITY = 0.6;
const MOVE_SPEED = 3.8;
const JUMP_POWER = 12.2;
const CLIMB_SPEED = 2.7;
const WIN_SCORE = 8;

const keys = {
  left: false,
  right: false,
  jump: false,
  up: false,
  down: false,
};

const level = {
  platforms: [
    { x: 0, y: 500, w: 960, h: 40 },
    { x: 120, y: 440, w: 150, h: 16 },
    { x: 320, y: 380, w: 150, h: 16 },
    { x: 520, y: 320, w: 170, h: 16 },
    { x: 700, y: 260, w: 160, h: 16 },
    { x: 160, y: 200, w: 140, h: 16 },
    { x: 380, y: 140, w: 180, h: 16 },
    { x: 690, y: 115, w: 120, h: 16 },
  ],
  ladders: [
    { x: 195, y: 440, h: 60 },
    { x: 375, y: 380, h: 60 },
    { x: 585, y: 320, h: 60 },
    { x: 760, y: 260, h: 60 },
    { x: 225, y: 200, h: 90 },
    { x: 430, y: 140, h: 90 },
    { x: 740, y: 115, h: 90 },
  ],
  bananas: [
    { x: 180, y: 392, r: 10, collected: false },
    { x: 390, y: 332, r: 10, collected: false },
    { x: 590, y: 272, r: 10, collected: false },
    { x: 780, y: 210, r: 10, collected: false },
    { x: 230, y: 152, r: 10, collected: false },
    { x: 470, y: 92, r: 10, collected: false },
    { x: 730, y: 70, r: 10, collected: false },
    { x: 870, y: 90, r: 10, collected: false },
  ],
  goal: { x: 900, y: 70, w: 32, h: 55 },
  donkey: { x: 820, y: 40, w: 64, h: 54 },
};

const player = {
  x: 40,
  y: 470,
  w: 26,
  h: 30,
  vx: 0,
  vy: 0,
  onGround: false,
  onLadder: false,
  alive: true,
  lives: 3,
  score: 0,
};

function resetLevel() {
  player.x = 40;
  player.y = 470;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  player.onLadder = false;
  player.alive = true;
  player.score = 0;
  keys.left = false;
  keys.right = false;
  keys.jump = false;
  keys.up = false;
  keys.down = false;

  level.bananas.forEach((banana) => {
    banana.collected = false;
  });

  level.barrels = [
    { x: 200, y: 60, w: 18, h: 22, vx: 1.2, vy: 0 },
    { x: 430, y: 70, w: 18, h: 22, vx: -1.4, vy: 0 },
    { x: 760, y: 50, w: 18, h: 22, vx: 1.5, vy: 0 },
  ];

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

function playerRect() {
  return { x: player.x, y: player.y, w: player.w, h: player.h };
}

function getPlayerLadder() {
  const rect = { x: player.x + 4, y: player.y, w: player.w - 8, h: player.h };
  return level.ladders.find((ladder) => rectsIntersect(rect, { x: ladder.x, y: ladder.y, w: 16, h: ladder.h }));
}

function handleInput() {
  const ladder = getPlayerLadder();

  if (keys.left) player.vx = -MOVE_SPEED;
  else if (keys.right) player.vx = MOVE_SPEED;
  else player.vx *= 0.72;

  if (ladder && (keys.up || keys.down)) {
    player.onLadder = true;
    player.vy = 0;
    if (keys.up) player.y -= CLIMB_SPEED;
    if (keys.down) player.y += CLIMB_SPEED;
    player.y = clamp(player.y, 70, HEIGHT - player.h - 10);
    return;
  }

  player.onLadder = false;

  if (keys.jump && player.onGround) {
    player.vy = -JUMP_POWER;
    player.onGround = false;
  }
}

function updatePlayer() {
  handleInput();

  if (!player.onLadder) {
    player.vy += GRAVITY;
  }

  player.x += player.vx;
  player.y += player.vy;
  player.onGround = false;

  for (const platform of level.platforms) {
    const prevBottom = player.y - player.vy + player.h;
    const prevTop = player.y - player.vy;

    if (
      player.vy >= 0 &&
      prevBottom <= platform.y + 10 &&
      player.y + player.h >= platform.y &&
      player.y < platform.y + platform.h + 30
    ) {
      if (rectsIntersect(playerRect(), platform)) {
        player.y = platform.y - player.h;
        player.vy = 0;
        player.onGround = true;
      }
    }

    if (
      player.vy < 0 &&
      prevTop >= platform.y + platform.h - 10 &&
      player.y <= platform.y + platform.h &&
      player.y + player.h > platform.y
    ) {
      if (rectsIntersect(playerRect(), platform)) {
        player.y = platform.y + platform.h;
        player.vy = 0;
      }
    }
  }

  player.x = clamp(player.x, 0, WIDTH - player.w);

  if (player.y > HEIGHT + 80) {
    loseLife();
  }

  for (const banana of level.bananas) {
    if (banana.collected) continue;
    const bananaBox = { x: banana.x - banana.r, y: banana.y - banana.r, w: banana.r * 2, h: banana.r * 2 };
    if (rectsIntersect(playerRect(), bananaBox)) {
      banana.collected = true;
      player.score += 1;
      updateHud();
    }
  }

  const goalRect = level.goal;
  if (rectsIntersect(playerRect(), goalRect)) {
    if (player.score >= WIN_SCORE) {
      player.alive = false;
      setTimeout(() => {
        alert('You win! Donkey Kong-style arcade clear! Press R to play again.');
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

  keys.left = false;
  keys.right = false;
  keys.jump = false;
  keys.up = false;
  keys.down = false;
  player.x = 40;
  player.y = 470;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  player.onLadder = false;
}

function updateBarrels() {
  for (const barrel of level.barrels) {
    barrel.vy += GRAVITY * 0.9;
    barrel.x += barrel.vx;
    barrel.y += barrel.vy;

    if (barrel.x <= 0 || barrel.x + barrel.w >= WIDTH) {
      barrel.vx *= -1;
    }

    let landed = false;
    for (const platform of level.platforms) {
      const hitsPlatform =
        barrel.y + barrel.h >= platform.y &&
        barrel.y < platform.y + platform.h + 20 &&
        barrel.x + barrel.w > platform.x &&
        barrel.x < platform.x + platform.w;

      if (barrel.vy >= 0 && hitsPlatform) {
        barrel.y = platform.y - barrel.h;
        barrel.vy = 0;
        landed = true;
      }
    }

    if (!landed && barrel.y > HEIGHT + 40) {
      barrel.x = 200 + Math.random() * 500;
      barrel.y = 40;
      barrel.vx = (Math.random() > 0.5 ? 1 : -1) * (1.2 + Math.random() * 0.8);
    }

    if (rectsIntersect(playerRect(), barrel)) {
      loseLife();
      return;
    }
  }
}

function drawBackground() {
  ctx.fillStyle = '#7ad3ff';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = '#6fc96b';
  ctx.fillRect(0, 290, WIDTH, 250);

  for (let i = 0; i < 20; i += 1) {
    const x = i * 55;
    const h = 30 + (i % 5) * 14;
    ctx.fillStyle = '#3d8b39';
    ctx.fillRect(x, 290 - h, 36, h);
  }

  ctx.fillStyle = '#b07d48';
  ctx.fillRect(0, 500, WIDTH, 40);
}

function drawPlatforms() {
  for (const platform of level.platforms) {
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
    ctx.fillStyle = '#c88c3d';
    ctx.fillRect(platform.x, platform.y, platform.w, 4);
  }
}

function drawLadders() {
  for (const ladder of level.ladders) {
    ctx.fillStyle = '#c99c5a';
    ctx.fillRect(ladder.x, ladder.y, 12, ladder.h);
    ctx.fillStyle = '#8a5d2f';
    for (let y = ladder.y + 10; y < ladder.y + ladder.h - 6; y += 16) {
      ctx.fillRect(ladder.x - 4, y, 20, 4);
    }
  }
}

function drawBananas() {
  for (const banana of level.bananas) {
    if (banana.collected) continue;
    ctx.save();
    ctx.translate(banana.x, banana.y);
    ctx.fillStyle = '#ffd849';
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.quadraticCurveTo(8, -2, 0, 8);
    ctx.quadraticCurveTo(-8, -2, 0, -8);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = '#6a4d00';
    ctx.beginPath();
    ctx.moveTo(banana.x, banana.y + 6);
    ctx.lineTo(banana.x - 2, banana.y + 12);
    ctx.stroke();
  }
}

function drawDonkey() {
  const { x, y, w, h } = level.donkey;

  ctx.fillStyle = '#9b5d1c';
  ctx.fillRect(x + 12, y + 8, w - 24, h - 18);

  ctx.fillStyle = '#7e471a';
  ctx.fillRect(x + 18, y + 16, w - 36, 18);

  ctx.fillStyle = '#f4d38d';
  ctx.fillRect(x + 14, y + 18, 12, 10);
  ctx.fillRect(x + w - 26, y + 18, 12, 10);

  ctx.fillStyle = '#1b1b1b';
  ctx.fillRect(x + 18, y + 32, 6, 6);
  ctx.fillRect(x + w - 24, y + 32, 6, 6);

  ctx.fillStyle = '#8f4b22';
  ctx.fillRect(x + 8, y + 40, 12, 18);
  ctx.fillRect(x + w - 20, y + 40, 12, 18);
}

function drawBarrels() {
  for (const barrel of level.barrels) {
    ctx.fillStyle = '#8b4d1d';
    ctx.fillRect(barrel.x, barrel.y, barrel.w, barrel.h);
    ctx.fillStyle = '#d98b3d';
    ctx.fillRect(barrel.x + 3, barrel.y + 3, barrel.w - 6, 5);
    ctx.fillStyle = '#2a190f';
    ctx.fillRect(barrel.x + 4, barrel.y + 11, 3, 3);
    ctx.fillRect(barrel.x + barrel.w - 7, barrel.y + 11, 3, 3);
  }
}

function drawGoal() {
  const { x, y, w, h } = level.goal;
  ctx.fillStyle = '#d7f9ff';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#2e8a58';
  ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
}

function drawPlayer() {
  ctx.fillStyle = '#1a4db6';
  ctx.fillRect(player.x, player.y, player.w, player.h);
  ctx.fillStyle = '#f6d86a';
  ctx.fillRect(player.x + 6, player.y + 4, 14, 8);
  ctx.fillStyle = '#111';
  ctx.fillRect(player.x + 8, player.y + 15, 4, 4);
  ctx.fillRect(player.x + 16, player.y + 15, 4, 4);
}

function drawText() {
  ctx.fillStyle = 'rgba(16, 26, 17, 0.75)';
  ctx.font = 'bold 30px Arial';
  ctx.fillText('DK', 20, 40);

  ctx.font = '18px Arial';
  ctx.fillText('Collect 8 bananas and reach the gate', 20, 72);
}

function draw() {
  drawBackground();
  drawPlatforms();
  drawLadders();
  drawBananas();
  drawDonkey();
  drawBarrels();
  drawGoal();
  drawPlayer();
  drawText();
}

function gameLoop() {
  if (player.alive) {
    updatePlayer();
    updateBarrels();
  }

  draw();
  requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', (event) => {
  const code = event.code;

  if (code === 'ArrowLeft' || code === 'KeyA') keys.left = true;
  if (code === 'ArrowRight' || code === 'KeyD') keys.right = true;
  if (code === 'ArrowUp' || code === 'KeyW') keys.up = true;
  if (code === 'ArrowDown' || code === 'KeyS') keys.down = true;
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
  if (code === 'ArrowUp' || code === 'KeyW') keys.up = false;
  if (code === 'ArrowDown' || code === 'KeyS') keys.down = false;
  if (code === 'ArrowUp' || code === 'KeyW' || code === 'Space') keys.jump = false;
});

resetLevel();
updateHud();
gameLoop();
