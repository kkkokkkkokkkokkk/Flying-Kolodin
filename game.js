// ═══════════════════════════════════════════════
//  GAME.JS  –  Optimised Flappy Bird
//  Fixes: stable 60fps loop, cached offscreen bg,
//  precise AABB collision, no redundant redraws
// ═══════════════════════════════════════════════

const cvs = document.getElementById("gameCanvas");
const ctx = cvs.getContext("2d", { alpha: false });

// ── Canvas sizing ──────────────────────────────
function resize() {
  cvs.width  = window.innerWidth;
  cvs.height = window.innerHeight;
}
resize();
window.addEventListener("resize", () => { resize(); rebuildBg(); });

// SCALE: relative to 400-wide logical space, capped so huge phones don't over-scale
const SCALE = () => Math.min(cvs.width / 400, 1.5);

// ── Performance flags ──────────────────────────
ctx.imageSmoothingEnabled = false;

// ── Assets ────────────────────────────────────
const bgImg     = new Image(); bgImg.src     = "img/bg.jpg";
const playerImg = new Image(); playerImg.src = "img/player.png";
const pipeImg   = new Image(); pipeImg.src   = "img/pipe.png";

const music     = new Audio("audio/music.mp3");
music.loop      = true;
music.volume    = 0.3;

const jumpSound = new Audio("audio/jump.wav");
jumpSound.volume = 0.6;

// ── Offscreen background cache ─────────────────
//    We draw the bg once into an OffscreenCanvas (or regular canvas).
//    Each frame we blit that cached canvas instead of re-scaling bgImg.
let bgCache = null;

function rebuildBg() {
  if (!bgImg.complete || !bgImg.naturalWidth) return;
  bgCache = document.createElement("canvas");
  bgCache.width  = cvs.width;
  bgCache.height = cvs.height;
  bgCache.getContext("2d").drawImage(bgImg, 0, 0, cvs.width, cvs.height);
}
bgImg.onload = rebuildBg;

// ── Game state ─────────────────────────────────
const STATE = { MENU: 0, GAME: 1, OVER: 2 };
let state   = STATE.MENU;
let score   = 0;
let frames  = 0;

// ── Bird ───────────────────────────────────────
const bird = {
  x: 0, y: 0,
  size: 0,
  vy: 0,          // vertical velocity only – no gravity constant baked in
  GRAVITY: 0,
  JUMP: 0,

  init() {
    const S      = SCALE();
    this.x       = 80 * S;
    this.y       = cvs.height * 0.4;
    this.size    = 20 * S;
    this.GRAVITY = 0.35 * S;
    this.JUMP    = 6.5 * S;
    this.vy      = 0;
  },

  reset() {
    this.y  = cvs.height * 0.4;
    this.vy = 0;
  },

  flap() {
    this.vy = -this.JUMP;
    jumpSound.currentTime = 0;
    jumpSound.play().catch(() => {});
  },

  update(dt) {
    // dt-based physics so lag doesn't cause different speeds
    this.vy += this.GRAVITY * dt;
    this.y  += this.vy     * dt;

    // Clamp to screen bounds
    if (this.y - this.size < 0) {
      this.y  = this.size;
      this.vy = 0;
    }
    if (this.y + this.size > cvs.height) {
      endGame();
    }
  },

  draw() {
    if (!playerImg.complete || !playerImg.naturalWidth) {
      // Fallback: yellow circle
      ctx.fillStyle = "#f9c846";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    const s = this.size * 2;
    // Tilt the bird based on velocity
    const angle = Math.min(Math.max(this.vy * 0.04, -0.4), 0.6);
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);
    ctx.drawImage(playerImg, -this.size, -this.size, s, s);
    ctx.restore();
  }
};

// ── Pipes ──────────────────────────────────────
const pipes = {
  list: [],
  w: 0, gap: 0, speed: 0,
  SPAWN_EVERY: 120, // frames

  init() {
    const S    = SCALE();
    this.w     = 60 * S;
    this.gap   = Math.min(cvs.height * 0.38, 190 * S);
    this.speed = 2.5 * S;
    this.list  = [];
  },

  reset() { this.list = []; },

  maybeSpawn() {
    if (frames % this.SPAWN_EVERY !== 0) return;
    const minTop = cvs.height * 0.12;
    const maxTop = cvs.height - this.gap - cvs.height * 0.12;
    this.list.push({
      x:      cvs.width,
      top:    minTop + Math.random() * (maxTop - minTop),
      passed: false
    });
  },

  update(dt) {
    this.maybeSpawn();

    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.x -= this.speed * dt;

      // ── AABB Collision ──
      const bLeft   = bird.x - bird.size * 0.8;   // slight forgiveness
      const bRight  = bird.x + bird.size * 0.8;
      const bTop    = bird.y - bird.size * 0.8;
      const bBottom = bird.y + bird.size * 0.8;
      const pLeft   = p.x;
      const pRight  = p.x + this.w;

      if (bRight > pLeft && bLeft < pRight) {
        if (bTop < p.top || bBottom > p.top + this.gap) {
          endGame(); return;
        }
      }

      // ── Score ──
      if (!p.passed && p.x + this.w < bird.x) {
        p.passed = true;
        score++;
        addBalance(1);
      }

      // ── Cull off-screen ──
      if (p.x + this.w < 0) this.list.splice(i, 1);
    }
  },

  draw() {
    const pipeH = cvs.height * 0.7; // tall enough to always fill

    for (const p of this.list) {
      if (!pipeImg.complete || !pipeImg.naturalWidth) {
        // Fallback: green rects
        ctx.fillStyle = "#4caf50";
        ctx.fillRect(p.x, 0, this.w, p.top);
        ctx.fillRect(p.x, p.top + this.gap, this.w, cvs.height);
      } else {
        // Top pipe (flipped)
        ctx.save();
        ctx.translate(p.x + this.w / 2, p.top);
        ctx.scale(1, -1);
        ctx.drawImage(pipeImg, -this.w / 2, 0, this.w, pipeH);
        ctx.restore();

        // Bottom pipe
        ctx.drawImage(pipeImg, p.x, p.top + this.gap, this.w, pipeH);
      }
    }
  }
};

// ── Score HUD ─────────────────────────────────
function drawHUD() {
  const S = SCALE();
  ctx.fillStyle    = "rgba(0,0,0,0.35)";
  const tw         = 130 * S;
  const th         = 36 * S;
  const tx         = cvs.width / 2 - tw / 2;
  roundRect(ctx, tx, 16 * S, tw, th, 10 * S);
  ctx.fill();

  ctx.fillStyle    = "#fff";
  ctx.font         = `bold ${Math.round(20 * S)}px Nunito, Arial`;
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🪙 " + score, cvs.width / 2, 16 * S + th / 2);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ── Balance helper ─────────────────────────────
function addBalance(n) {
  const b = (parseInt(localStorage.getItem("balance")) || 0) + n;
  localStorage.setItem("balance", b);
}

// ── Start / End ────────────────────────────────
function startGame() {
  score  = 0;
  frames = 0;
  state  = STATE.GAME;
  bird.init();
  bird.reset();
  pipes.init();

  music.currentTime = 0;
  music.play().catch(() => {});
}

function endGame() {
  if (state !== STATE.GAME) return; // guard double-trigger
  state = STATE.OVER;
  music.pause();
  music.currentTime = 0;

  // tell ui.js
  if (typeof showGameOver === "function") showGameOver(score);
}

// ── Input ──────────────────────────────────────
function handleTap() {
  if (state === STATE.GAME) bird.flap();
}
cvs.addEventListener("touchstart", handleTap, { passive: true });
cvs.addEventListener("click",      handleTap);
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "ArrowUp") handleTap();
});

// ── Fixed-timestep game loop ───────────────────
//    We decouple physics (fixed 60fps steps) from render.
//    This eliminates speed differences across devices.

const FIXED_DT  = 1;           // logical "1 step" (scale-independent)
const MS_PER_STEP = 1000 / 60; // ~16.67 ms per physics step
let   accumulator = 0;
let   lastTimestamp = 0;
let   loopRunning = false;

function loop(ts) {
  requestAnimationFrame(loop);

  const elapsed = ts - lastTimestamp;
  lastTimestamp = ts;

  if (state !== STATE.GAME) {
    // Just blit background to keep canvas "alive" but don't run physics
    drawBackground();
    return;
  }

  // Clamp to avoid spiral-of-death on hidden tab resume
  accumulator += Math.min(elapsed, 100);

  while (accumulator >= MS_PER_STEP) {
    bird.update(FIXED_DT);
    pipes.update(FIXED_DT);
    frames++;
    accumulator -= MS_PER_STEP;
  }

  // Draw
  drawBackground();
  pipes.draw();
  bird.draw();
  drawHUD();
}

function drawBackground() {
  if (bgCache) {
    ctx.drawImage(bgCache, 0, 0);
  } else {
    ctx.fillStyle = "#1a2a4a";
    ctx.fillRect(0, 0, cvs.width, cvs.height);
  }
}

requestAnimationFrame(loop);