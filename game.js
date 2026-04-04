// ===== ASSETS =====
const bgImg = new Image();
bgImg.src = "img/bg.png";

const playerImg = new Image();
playerImg.src = "img/player.png";

const pipeImg = new Image();
pipeImg.src = "img/pipe.png";

const music = new Audio("audio/music.mp3");
music.loop = true;
music.volume = 0.3;

const jumpSound = new Audio("audio/jump.wav");

// ===== CANVAS =====
const cvs = document.getElementById("gameCanvas");
const ctx = cvs.getContext("2d", { alpha: false });

cvs.width = window.innerWidth;
cvs.height = window.innerHeight;

// ===== ⚡ ОПТИМИЗАЦИЯ =====
ctx.imageSmoothingEnabled = false;

// ===== BACKGROUND CACHE =====
const bgCanvas = document.createElement("canvas");
const bgCtx = bgCanvas.getContext("2d");

bgImg.onload = () => {
    bgCanvas.width = cvs.width;
    bgCanvas.height = cvs.height;

    // один раз масштабируем
    bgCtx.drawImage(bgImg, 0, 0, cvs.width, cvs.height);
};

// ===== GAME STATE =====
let frames = 0;
let score = 0;

const state = {
    current: 0,
    game: 1,
    over: 2
};

// ===== START GAME =====
function startGame() {
    score = 0;
    bird.reset();
    pipes.reset();
    state.current = state.game;

    music.currentTime = 0;
    music.play();
}

// ===== INPUT =====
cvs.addEventListener("touchstart", tap);
cvs.addEventListener("click", tap);

function tap() {
    if (state.current === state.game) {
        bird.flap();
        jumpSound.currentTime = 0;
        jumpSound.play();
    }
}

// ===== PLAYER =====
const bird = {
    x: 80,
    y: 150,
    size: 22,
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

        if (this.y > cvs.height) {
            endGame();
        }
    },

    draw() {
        if (!playerImg.complete) return;

        ctx.drawImage(
            playerImg,
            this.x - this.size,
            this.y - this.size,
            this.size * 2,
            this.size * 2
        );
    },

    reset() {
        this.y = 150;
        this.speed = 0;
    }
};

// ===== PIPES =====
const pipes = {
    list: [],
    width: 70,
    gap: 200,
    speed: 2,

    update() {
        if (state.current !== state.game) return;

        if (frames % 120 === 0) {
            this.list.push({
                x: cvs.width,
                top: Math.random() * (cvs.height - this.gap),
                passed: false
            });
        }

        for (let i = this.list.length - 1; i >= 0; i--) {
            let p = this.list[i];

            p.x -= this.speed;

            // COLLISION
            if (
                bird.x + bird.size > p.x &&
                bird.x - bird.size < p.x + this.width &&
                (bird.y < p.top || bird.y > p.top + this.gap)
            ) {
                endGame();
            }

            // SCORE
            if (!p.passed && p.x + this.width < bird.x) {
                score++;

                let balance = parseInt(localStorage.getItem("balance")) || 0;
                localStorage.setItem("balance", balance + 1);

                p.passed = true;
            }

            // REMOVE
            if (p.x + this.width < 0) {
                this.list.splice(i, 1);
            }
        }
    },

    draw() {
        if (!pipeImg.complete) return;

        for (let p of this.list) {
            const h = 260; // фикс высоты → нет лагов

            // верх
            ctx.drawImage(pipeImg, p.x, p.top - h, this.width, h);

            // низ
            ctx.drawImage(pipeImg, p.x, p.top + this.gap, this.width, h);
        }
    },

    reset() {
        this.list = [];
    }
};

// ===== END GAME =====
function endGame() {
    state.current = state.over;

    document.getElementById("gameCanvas").style.display = "none";
    document.getElementById("app").style.display = "block";

    music.pause();
    music.currentTime = 0;

    updateBalance();
}

// ===== UPDATE =====
function update() {
    bird.update();
    pipes.update();
}

// ===== DRAW =====
function draw() {
    // фон (БЕЗ лагов)
    if (bgCanvas.width) {
        ctx.drawImage(bgCanvas, 0, 0);
    }

    pipes.draw();
    bird.draw();

    ctx.fillStyle = "#fff";
    ctx.font = "22px Arial";
    ctx.fillText("Score: " + score, 20, 40);
}

// ===== LOOP (СТАБИЛЬНЫЙ FPS) =====
let lastTime = 0;

function loop(time = 0) {
    if (time - lastTime > 16) {
        update();
        draw();
        lastTime = time;
    }

    frames++;
    requestAnimationFrame(loop);
}

loop();