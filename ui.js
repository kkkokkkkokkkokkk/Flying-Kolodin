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
