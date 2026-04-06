// ── UI.JS ─────────────────────────────────────
// Uses same element IDs as the old working version (#app, #balance, etc.)

const app        = document.getElementById("app");
const canvas     = document.getElementById("gameCanvas");
const balanceEl  = document.getElementById("balance");
const playBtn    = document.getElementById("playBtn");
const gameOverEl = document.getElementById("gameOver");
const retryBtn   = document.getElementById("retryBtn");
const menuBtn    = document.getElementById("menuBtn");
const finalScore = document.getElementById("finalScore");
const earnedEl   = document.getElementById("earned");
const bottomNav  = document.getElementById("bottomNav");

function updateBalanceDisplay() {
  const b = localStorage.getItem("balance") || "0";
  if (balanceEl) balanceEl.textContent = b;
  const sb = document.getElementById("shop-balance");
  if (sb) sb.textContent = b;
}

// ── Init: load from DB then render ────────────
async function init() {
  try { await loadMyProfile(); } catch(e) { console.error("Profile:", e); }
  updateBalanceDisplay();
  try {
    const top = await loadLeaderboard();
    renderLeaderboard(top);
  } catch(e) { console.error("Leaderboard:", e); }
}
init();

// ── Play ───────────────────────────────────────
playBtn.addEventListener("click", () => {
  app.style.display = "none";
  bottomNav.style.display = "none";
  gameOverEl.classList.add("hidden");

  canvas.style.display = "block";
  canvas.style.pointerEvents = "auto";
  canvas.style.zIndex = "10"; // 🔥 вернуть обратно

  startGame();
});

// ── Game Over (called by game.js) ─────────────
async function showGameOver(sessionScore) {
  canvas.style.display = "none";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "-1"; // 🔥 КРИТИЧНО

  bottomNav.style.display = "flex";
  gameOverEl.classList.remove("hidden");

  finalScore.textContent = sessionScore;
  earnedEl.textContent   = sessionScore;

  const prev = parseInt(localStorage.getItem("best_score") || "0");
  if (sessionScore > prev) localStorage.setItem("best_score", sessionScore);

  updateBalanceDisplay();

  try {
    await syncPlayer(sessionScore);
    const top = await loadLeaderboard();
    renderLeaderboard(top);
  } catch(e) { console.error("DB:", e); }
}

// ── Leaderboard render ─────────────────────────
function renderLeaderboard(players) {
  if (!players || !Array.isArray(players)) return;
  const medals    = ["🥇","🥈","🥉"];
  const rankClass = ["gold","silver","bronze"];
  const list      = document.getElementById("leaderboard");
  if (!list) return;
  list.innerHTML = players.map((p,i) => `
    <li class="lb-row">
      <span class="lb-rank ${rankClass[i]||""}">${medals[i]||i+1}</span>
      <img class="lb-avatar" src="${p.avatar_url||'img/default-avatar.png'}" onerror="this.src='img/default-avatar.png'" alt="">
      <span class="lb-name">${esc(p.username||"Игрок")}</span>
      <span class="lb-score">${p.best_score} 🪙</span>
    </li>`).join("");
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

// ── Retry ──────────────────────────────────────
retryBtn.addEventListener("click", () => {
  gameOverEl.classList.add("hidden");

  canvas.style.display = "block";
  canvas.style.pointerEvents = "auto";
  canvas.style.zIndex = "10";

  bottomNav.style.display = "none";

  startGame();
});

// ── Back to menu ───────────────────────────────
menuBtn.addEventListener("click", () => {
  gameOverEl.classList.add("hidden");

  canvas.style.display = "none";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "-1"; // 🔥 ВАЖНО

  bottomNav.style.display = "flex";

  navTo("home");

  app.style.display = "flex";

  document.body.offsetHeight;
});