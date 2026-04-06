// ── UI.JS ──────────────────────────────────────
const app        = document.getElementById("screen-home");
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
  updateAllBalanceDisplays(); // shop.js
}

async function init() {
  try { await loadMyProfile(); } catch(e) { console.error("Profile:", e); }
  updateBalanceDisplay();
  try {
    const top = await loadLeaderboard();
    renderLeaderboard(top);
  } catch(e) { console.error("LB:", e); }
}
init();

// ── Play ───────────────────────────────────────
playBtn.addEventListener("click", () => {
  document.getElementById("screen-home").classList.remove("active");
  gameOverEl.classList.add("hidden");
  canvas.style.display = "block";
  bottomNav.style.display = "none";
  startGame();
});

// ── Game Over ─────────────────────────────────
async function showGameOver(sessionScore) {
  canvas.style.display = "none";
  bottomNav.style.display = "flex";
  gameOverEl.classList.remove("hidden");

  finalScore.textContent = sessionScore;
  earnedEl.textContent   = sessionScore;

  // Save best_score locally for Account tab
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
  list.innerHTML  = players.map((p,i) => `
    <li class="lb-row">
      <span class="lb-rank ${rankClass[i]||""}">${medals[i]||i+1}</span>
      <img class="lb-avatar" src="${p.avatar_url||'img/default-avatar.png'}" onerror="this.src='img/default-avatar.png'" alt="">
      <span class="lb-name">${escHtml(p.username||"Игрок")}</span>
      <span class="lb-score">${p.best_score} 🪙</span>
    </li>`).join("");
}

function escHtml(str) {
  return String(str).replace(/[&<>"']/g, c =>
    ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

// ── Retry ──────────────────────────────────────
retryBtn.addEventListener("click", () => {
  gameOverEl.classList.add("hidden");
  canvas.style.display = "block";
  bottomNav.style.display = "none";
  startGame();
});

// ── Menu ───────────────────────────────────────
menuBtn.addEventListener("click", () => {
  gameOverEl.classList.add("hidden");
  showScreen("home");
  updateBalanceDisplay();
});