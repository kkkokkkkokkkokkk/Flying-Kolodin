const balanceEl = document.getElementById("balance");
const playBtn = document.getElementById("playBtn");
const canvas = document.getElementById("gameCanvas");
const app = document.getElementById("app");

function updateBalance() {
    let balance = localStorage.getItem("balance") || 0;
    balanceEl.innerText = balance;
}

updateBalance();

playBtn.onclick = () => {
    app.style.display = "none";
    canvas.style.display = "block";

    setTimeout(() => {
        startGame();
    }, 50);
};