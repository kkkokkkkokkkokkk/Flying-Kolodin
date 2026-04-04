const balanceEl = document.getElementById("balance");
const playBtn = document.getElementById("playBtn");
const canvas = document.getElementById("gameCanvas");
const app = document.getElementById("app");

// обновление баланса
function updateBalance() {
    let balance = localStorage.getItem("balance") || 0;
    balanceEl.innerText = balance;
}

updateBalance();

// запуск игры
playBtn.onclick = () => {
    app.style.display = "none";
    canvas.style.display = "block";

    startGame(); // из game.js
};