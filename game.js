const cvs = document.getElementById("gameCanvas");
const ctx = cvs.getContext("2d");

cvs.width = window.innerWidth;
cvs.height = window.innerHeight;

let frames = 0;

const state = {
    current: 0,
    game: 1,
    over: 2
};

function startGame() {
    score = 0;
    bird.reset();
    pipes.reset();
    state.current = state.game;
}

cvs.addEventListener("click", () => {
    if (state.current === state.game) {
        bird.flap();
    }
});

const bird = {
    x: 80,
    y: 150,
    size: 20,
    gravity: 0.25,
    jump: 5,
    speed: 0,

    flap() {
        this.speed = -this.jump;
    },

    update() {
        if (state.current !== state.game) return;

        this.speed += this.gravity;
        this.y += this.speed;

        if (this.y > cvs.height) endGame();
    },

    draw() {
        ctx.fillStyle = "gold";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    },

    reset() {
        this.y = 150;
        this.speed = 0;
    }
};

const pipes = {
    list: [],
    width: 60,
    gap: 180,

    update() {
        if (state.current !== state.game) return;

        if (frames % 90 === 0) {
            this.list.push({
                x: cvs.width,
                top: Math.random() * (cvs.height - this.gap),
                passed: false
            });
        }

        this.list.forEach((p, i) => {
            p.x -= 2;

            if (
                bird.x + bird.size > p.x &&
                bird.x - bird.size < p.x + this.width &&
                (bird.y < p.top || bird.y > p.top + this.gap)
            ) {
                endGame();
            }

            if (!p.passed && p.x + this.width < bird.x) {
                score++;

                let balance = parseInt(localStorage.getItem("balance")) || 0;
                localStorage.setItem("balance", balance + 1);

                p.passed = true;
            }

            if (p.x + this.width < 0) {
                this.list.splice(i, 1);
            }
        });
    },

    draw() {
        ctx.fillStyle = "green";

        this.list.forEach(p => {
            ctx.fillRect(p.x, 0, this.width, p.top);
            ctx.fillRect(p.x, p.top + this.gap, this.width, cvs.height);
        });
    },

    reset() {
        this.list = [];
    }
};

let score = 0;

function endGame() {
    state.current = state.over;

    document.getElementById("gameCanvas").style.display = "none";
    document.getElementById("app").style.display = "block";

    updateBalance();
}

function update() {
    bird.update();
    pipes.update();
}

function draw() {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, cvs.width, cvs.height);

    pipes.draw();
    bird.draw();

    ctx.fillStyle = "#fff";
    ctx.fillText("Score: " + score, 20, 40);
}

function loop() {
    update();
    draw();
    frames++;
    requestAnimationFrame(loop);
}

loop();