const cvs = document.getElementById("gameCanvas");
const ctx = cvs.getContext("2d");

// FULLSCREEN
cvs.width = window.innerWidth;
cvs.height = window.innerHeight;

// GAME VARS
let frames = 0;

// COLORS
const bgColor = "#111";
const pipeColor = "#2ecc71";
const playerColor = "#f1c40f";

// STATE
const state = {
    current: 0,
    getReady: 0,
    game: 1,
    over: 2
};

// CLICK
cvs.addEventListener("click", function () {
    switch (state.current) {
        case state.getReady:
            state.current = state.game;
            break;

        case state.game:
            bird.flap();
            break;

        case state.over:
            // перезапуск только через кнопку
            break;
    }
});

// START GAME (для UI)
function startGame() {
    state.current = state.game;
}

// PLAYER
const bird = {
    x: 80,
    y: 150,
    size: 20,

    gravity: 0.25,
    jump: 5,
    speed: 0,

    draw() {
        ctx.fillStyle = playerColor;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    },

    flap() {
        this.speed = -this.jump;
    },

    update() {
        if (state.current !== state.game) return;

        this.speed += this.gravity;
        this.y += this.speed;

        if (this.y > cvs.height) {
            state.current = state.over;
            endGameUI();
        }
    },

    reset() {
        this.y = 150;
        this.speed = 0;
    }
};

// PIPES
const pipes = {
    position: [],
    width: 60,
    gap: 180,
    dx: 2,

    update() {
        if (state.current !== state.game) return;

        if (frames % 90 === 0) {
            this.position.push({
                x: cvs.width,
                top: Math.random() * (cvs.height - this.gap),
                passed: false
            });
        }

        this.position.forEach((p, index) => {
            p.x -= this.dx;

            // COLLISION
            if (
                bird.x + bird.size > p.x &&
                bird.x - bird.size < p.x + this.width &&
                (bird.y - bird.size < p.top ||
                    bird.y + bird.size > p.top + this.gap)
            ) {
                state.current = state.over;
                endGameUI();
            }

            // SCORE (фикс для мобилок)
            if (!p.passed && p.x + this.width < bird.x) {
                score.value++;

                let balance = parseInt(localStorage.getItem("balance")) || 0;
                balance += 1;
                localStorage.setItem("balance", balance);

                p.passed = true;
            }

            // REMOVE
            if (p.x + this.width < 0) {
                this.position.splice(index, 1);
            }
        });
    },

    draw() {
        ctx.fillStyle = pipeColor;

        this.position.forEach(p => {
            ctx.fillRect(p.x, 0, this.width, p.top);
            ctx.fillRect(
                p.x,
                p.top + this.gap,
                this.width,
                cvs.height
            );
        });
    },

    reset() {
        this.position = [];
    }
};

// SCORE
const score = {
    value: 0,

    draw() {
        ctx.fillStyle = "#fff";
        ctx.font = "30px Arial";
        ctx.fillText("Score: " + this.value, 20, 50);

        let balance = localStorage.getItem("balance") || 0;
        ctx.font = "20px Arial";
        ctx.fillText("Balance: " + balance, 20, 80);

        if (state.current === state.over) {
            ctx.font = "40px Arial";
            ctx.fillText("GAME OVER", cvs.width / 2 - 120, cvs.height / 2);

            ctx.font = "20px Arial";
            ctx.fillText("Tap to restart", cvs.width / 2 - 70, cvs.height / 2 + 40);
        }
    },

    reset() {
        this.value = 0;
    }
};

// RESET GAME
function resetGame() {
    state.current = state.getReady;
    bird.reset();
    pipes.reset();
    score.reset();
}

// END GAME UI
function endGameUI() {
    document.getElementById("gameCanvas").style.display = "none";
    document.getElementById("app").style.display = "block";

    if (typeof updateBalance === "function") {
        updateBalance();
    }
}

// DRAW
function draw() {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, cvs.width, cvs.height);

    pipes.draw();
    bird.draw();
    score.draw();
}

// UPDATE
function update() {
    bird.update();
    pipes.update();
}

// LOOP
function loop() {
    update();
    draw();
    frames++;
    requestAnimationFrame(loop);
}

loop();