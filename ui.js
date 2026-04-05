// ── UI.JS ──────────────────────────────────────
const app        = document.getElementById("app");
const canvas     = document.getElementById("gameCanvas");
const balanceEl  = document.getElementById("balance");
const playBtn    = document.getElementById("playBtn");
const gameOverEl = document.getElementById("gameOver");
const retryBtn   = document.getElementById("retryBtn");
const menuBtn    = document.getElementById("menuBtn");
const finalScore = document.getElementById("finalScore");
const earnedEl   = document.getElementById("earned");

function updateBalanceDisplay() {
  balanceEl.textContent = localStorage.getItem("balance") || "0";
}

// При старте — сначала грузим профиль из БД, потом показываем баланс
async function init() {
  try {
    await loadMyProfile(); // db.js — синхронизирует coins из БД в localStorage
  } catch (e) {
    console.error("Profile load error:", e);
  }
  updateBalanceDisplay();

  try {
    const top = await loadLeaderboard();
    renderLeaderboard(top);
  } catch (e) {
    console.error("Leaderboard error:", e);
  }
}

init();

// ── Play button ────────────────────────────────
playBtn.addEventListener("click", () => {
  app.style.display    = "none";
  gameOverEl.classList.add("hidden");
  canvas.style.display = "block";
  startGame();
});

// ── Game Over ─────────────────────────────────
async function showGameOver(sessionScore) {
  canvas.style.display = "none";
  gameOverEl.classList.remove("hidden");

  finalScore.textContent = sessionScore;
  earnedEl.textContent   = sessionScore;

  updateBalanceDisplay();

  try {
    await syncPlayer(sessionScore);
    const top = await loadLeaderboard();
    renderLeaderboard(top);
  } catch (e) {
    console.error("DB error:", e);
  }
}

// ── Render leaderboard ─────────────────────────
function renderLeaderboard(players) {
  if (!players || !Array.isArray(players)) return;

  const medals    = ["🥇", "🥈", "🥉"];
  const rankClass = ["gold", "silver", "bronze"];
  const list      = document.getElementById("leaderboard");

  list.innerHTML = players.map((p, i) => `
    <li class="lb-row">
      <span class="lb-rank ${rankClass[i] || ""}">${medals[i] || i + 1}</span>
      <img class="lb-avatar"
           src="${p.avatar_url || 'img/default-avatar.png'}"
           onerror="this.src='img/default-avatar.png'"
           alt="">
      <span class="lb-name">${escHtml(p.username || "Игрок")}</span>
      <span class="lb-score">${p.best_score} 🪙</span>
    </li>
  `).join("");
}

function escHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}

// ── Retry ──────────────────────────────────────
retryBtn.addEventListener("click", () => {
  gameOverEl.classList.add("hidden");
  canvas.style.display = "block";
  startGame();
});

// ── Back to menu ───────────────────────────────
menuBtn.addEventListener("click", () => {
  gameOverEl.classList.add("hidden");
  app.style.display = "flex";
  updateBalanceDisplay();
});