// ═══════════════════════════════════════════════
//  GAME.JS  — Optimised Flappy Bird
//  Now reads equipped skin / bg / pipe / music
//  from shop.js via getEquipped() + getAssetPath()
// ═══════════════════════════════════════════════

const cvs = document.getElementById("gameCanvas");
const ctx  = cvs.getContext("2d", { alpha: false });

// ── Resize ────────────────────────────────────
function resize() {
  cvs.width  = window.innerWidth;
  cvs.height = window.innerHeight;
}
resize();
window.addEventListener("resize", () => { resize(); rebuildBg(); });

const SCALE = () => Math.min(cvs.width / 400, 1.5);
ctx.imageSmoothingEnabled = false;

// ── Asset loading ──────────────────────────────
// These are replaced on startGame() based on equipped items
let bgImg     = new Image();
let playerImg = new Image();
let pipeImg   = new Image();
let music     = new Audio();
music.loop    = true;
music.volume  = 0.3;

const jumpSound = new Audio("audio/jump.wav");
jumpSound.volume = 0.6;

function _loadAssets() {
  const eq = (typeof getEquipped === "function") ? getEquipped() : {};
  const AP  = (typeof getAssetPath === "function") ? getAssetPath : (c, id) => ({
    skin:"img/player.png", music:"audio/music.mp3", bg:"img/bg.jpg", pipes:"img/pipe.png"
  }[c]);

  const bgSrc    = AP("bg",    eq.bg    || "default");
  const skinSrc  = AP("skin",  eq.skin  || "default");
  const pipeSrc  = AP("pipes", eq.pipes || "default");
  const musicSrc = AP("music", eq.music || "default");

  bgImg     = new Image(); bgImg.src     = bgSrc;
  playerImg = new Image(); playerImg.src = skinSrc;
  pipeImg   = new Image(); pipeImg.src   = pipeSrc;

  bgImg.onload = rebuildBg;

  // swap music only if changed
  if (music.src !== new URL(musicSrc, location.href).href) {
    const wasPlaying = !music.paused;
    music.pause();
    music = new Audio(musicSrc);
    music.loop   = true;
    music.volume = 0.3;
    if (wasPlaying) music.play().catch(() => {});
  }

  bgCache = null; // force rebuild
}

// Public hook — called by equipItem() in shop.js
function reloadGameAssets() { _loadAssets(); }

// ── Background cache ───────────────────────────
let bgCache = null;

function rebuildBg() {
  if (!bgImg.complete || !bgImg.naturalWidth) return;
  bgCache = document.createElement("canvas");
  bgCache.width  = cvs.width;
  bgCache.height = cvs.height;
  bgCache.getContext("2d").drawImage(bgImg, 0, 0, cvs.width, cvs.height);
}

// ── Game state ─────────────────────────────────
const STATE = { MENU:0, GAME:1, OVER:2 };
let state  = STATE.MENU;
let score  = 0;
let frames = 0;

// ── Bird ───────────────────────────────────────
const bird = {
  x:0, y:0, size:0, vy:0, GRAVITY:0, JUMP:0,

  init() {
    const S      = SCALE();
    this.x       = 80 * S;
    this.y       = cvs.height * 0.4;
    this.size    = 25 * S;
    this.GRAVITY = 0.35 * S;
    this.JUMP    = 6.5 * S;
    this.vy      = 0;
  },

  reset() { this.y = cvs.height * 0.4; this.vy = 0; },

  flap() {
    this.vy = -this.JUMP;
    jumpSound.currentTime = 0;
    jumpSound.play().catch(() => {});
  },

  update(dt) {
    this.vy += this.GRAVITY * dt;
    this.y  += this.vy * dt;
    if (this.y - this.size < 0)          { this.y = this.size; this.vy = 0; }
    if (this.y + this.size > cvs.height) { endGame(); }
  },

  draw() {
    if (!playerImg.complete || !playerImg.naturalWidth) {
      ctx.fillStyle = "#f9c846";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI*2);
      ctx.fill();
      return;
    }
    const s     = this.size * 2;
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
  list:[], w:0, gap:0, speed:0,
  SPAWN_EVERY: 120,

  init() {
    const S   = SCALE();
    this.w    = 60 * S;
    this.gap  = Math.min(cvs.height * 0.38, 190 * S);
    this.speed= 2.5 * S;
    this.list = [];
  },

  reset() { this.list = []; },

  maybeSpawn() {
    if (frames % this.SPAWN_EVERY !== 0) return;
    const minTop = cvs.height * 0.12;
    const maxTop = cvs.height - this.gap - cvs.height * 0.12;
    this.list.push({ x: cvs.width, top: minTop + Math.random() * (maxTop - minTop), passed: false });
  },

  update(dt) {
    this.maybeSpawn();
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.x -= this.speed * dt;

      const bL = bird.x - bird.size*0.8, bR = bird.x + bird.size*0.8;
      const bT = bird.y - bird.size*0.8, bB = bird.y + bird.size*0.8;

      if (bR > p.x && bL < p.x + this.w) {
        if (bT < p.top || bB > p.top + this.gap) { endGame(); return; }
      }

      if (!p.passed && p.x + this.w < bird.x) {
        p.passed = true;
        score++;
        addBalance(1);
      }

      if (p.x + this.w < 0) this.list.splice(i, 1);
    }
  },

  draw() {
    const pipeH = cvs.height * 0.7;
    for (const p of this.list) {
      if (!pipeImg.complete || !pipeImg.naturalWidth) {
        ctx.fillStyle = "#4caf50";
        ctx.fillRect(p.x, 0,          this.w, p.top);
        ctx.fillRect(p.x, p.top+this.gap, this.w, cvs.height);
      } else {
        ctx.save();
        ctx.translate(p.x + this.w/2, p.top);
        ctx.scale(1, -1);
        ctx.drawImage(pipeImg, -this.w/2, 0, this.w, pipeH);
        ctx.restore();
        ctx.drawImage(pipeImg, p.x, p.top + this.gap, this.w, pipeH);
      }
    }
  }
};

// ── HUD ────────────────────────────────────────
function drawHUD() {
  const S  = SCALE();
  const tw = 130*S, th = 36*S, tx = cvs.width/2 - tw/2;
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  roundRect(ctx, tx, 16*S, tw, th, 10*S);
  ctx.fill();
  ctx.fillStyle    = "#fff";
  ctx.font         = `bold ${Math.round(20*S)}px Nunito, Arial`;
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🪙 " + score, cvs.width/2, 16*S + th/2);
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x+r,y); c.lineTo(x+w-r,y); c.quadraticCurveTo(x+w,y,x+w,y+r);
  c.lineTo(x+w,y+h-r); c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  c.lineTo(x+r,y+h); c.quadraticCurveTo(x,y+h,x,y+h-r);
  c.lineTo(x,y+r); c.quadraticCurveTo(x,y,x+r,y);
  c.closePath();
}

// ── Balance ────────────────────────────────────
function addBalance(n) {
  const b = (parseInt(localStorage.getItem("balance")) || 0) + n;
  localStorage.setItem("balance", b);
}

// ── Start / End ────────────────────────────────
function startGame() {
  _loadAssets();         // apply equipped items before starting
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
  if (state !== STATE.GAME) return;
  state = STATE.OVER;
  music.pause();
  music.currentTime = 0;
  if (typeof showGameOver === "function") showGameOver(score);
}

// ── Input ──────────────────────────────────────
function handleTap() { if (state === STATE.GAME) bird.flap(); }
cvs.addEventListener("touchstart", handleTap, { passive: true });
cvs.addEventListener("click",      handleTap);
document.addEventListener("keydown", e => {
  if (e.code === "Space" || e.code === "ArrowUp") handleTap();
});

// ── Game loop ──────────────────────────────────
const FIXED_DT    = 1;
const MS_PER_STEP = 1000 / 60;
let   accumulator = 0;
let   lastTimestamp = 0;

function loop(ts) {
  requestAnimationFrame(loop);
  const elapsed = ts - lastTimestamp;
  lastTimestamp = ts;

  if (state !== STATE.GAME) { drawBackground(); return; }

  accumulator += Math.min(elapsed, 100);
  while (accumulator >= MS_PER_STEP) {
    bird.update(FIXED_DT);
    pipes.update(FIXED_DT);
    frames++;
    accumulator -= MS_PER_STEP;
  }
  drawBackground();
  pipes.draw();
  bird.draw();
  drawHUD();
}

function drawBackground() {
  if (bgCache) { ctx.drawImage(bgCache, 0, 0); }
  else         { ctx.fillStyle = "#1a2a4a"; ctx.fillRect(0,0,cvs.width,cvs.height); }
}

requestAnimationFrame(loop);