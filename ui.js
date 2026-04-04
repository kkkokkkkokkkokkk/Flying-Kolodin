<<<<<<< HEAD
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
=======
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
>>>>>>> 89564aa273e052cd3f511db17e1d0c4c99b29d93
};