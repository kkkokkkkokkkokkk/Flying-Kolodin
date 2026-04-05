async function showGameOver(sessionScore) {

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

// ── Read & render balance ──────────────────────
function updateBalanceDisplay() {
  balanceEl.textContent = localStorage.getItem("balance") || "0";
}
updateBalanceDisplay();

// ── Play button ────────────────────────────────
playBtn.addEventListener("click", () => {
  app.style.display    = "none";
  gameOverEl.classList.add("hidden");
  canvas.style.display = "block";
  startGame();          // defined in game.js
});

// ── Game Over (called from game.js) ───────────
function showGameOver(sessionScore) {
  canvas.style.display = "none";
  gameOverEl.classList.remove("hidden");

  finalScore.textContent = sessionScore;
  earnedEl.textContent   = sessionScore;   // 1 coin per pipe passed

  updateBalanceDisplay();
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

  // сохранить результат
  await syncPlayer(sessionScore);

  // загрузить и отобразить топ
  const top = await loadLeaderboard();
  renderLeaderboard(top);
}

function renderLeaderboard(players) {
  const medals = ["🥇", "🥈", "🥉"];
  const list = document.getElementById("leaderboard");

  list.innerHTML = players.map((p, i) => `
    <li class="lb-row">
      <span class="lb-rank ${["gold","silver","bronze"][i] || ""}">${medals[i] || i+1}</span>
      <img class="lb-avatar" src="${p.avatar_url || 'img/default-avatar.png'}"
           onerror="this.src='img/default-avatar.png'">
      <span class="lb-name">${p.username || "Игрок"}</span>
      <span class="lb-score">${p.best_score} 🪙</span>
    </li>
  `).join("");
}