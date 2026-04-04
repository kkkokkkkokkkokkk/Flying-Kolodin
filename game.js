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

// ===== CANVAS (MOBILE FIX) =====
const cvs = document.getElementById("gameCanvas");
const ctx = cvs.getContext("2d");

// 🔥 ОПТИМИЗАЦИЯ
const dpr = Math.min(window.devicePixelRatio || 1, 2);

cvs.width = window.innerWidth * dpr;
cvs.height = window.innerHeight * dpr;

cvs.style.width = window.innerWidth + "px";
cvs.style.height = window.innerHeight + "px";

ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

// ===== BACKGROUND CACHE (ВАЖНО) =====
const bgCanvas = document.createElement("canvas");
const bgCtx = bgCanvas.getContext("2d");

bgImg.onload = () => {
    bgCanvas.width = cvs.width;
    bgCanvas.height = cvs.height;
    bgCtx.drawImage(bgImg, 0, 0, bgCanvas.width, bgCanvas.height);
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

        if (this.y > cvs.height) {
            endGame();
        }
    },

    draw() {
        if (playerImg.complete) {
            ctx.drawImage(
                playerImg,
                this.x - this.size,
                this.y - this.size,
                this.size * 2,
                this.size * 2
            );
        }
    },

    reset() {
        this.y = 150;
        this.speed = 0;
    }
};

// ===== PIPES (FIXED) =====
const pipes = {
    list: [],
    width: 90,
    gap: 200,
    speed: 2,

    update() {
        if (state.current !== state.game) return;

        if (frames % 110 === 0) {
            this.list.push({
                x: cvs.width,
                top: Math.random() * (cvs.height - this.gap),
                passed: false
            });
        }

        this.list.forEach((p, i) => {
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
        });
    },

    draw() {
        if (!pipeImg.complete) return;

        this.list.forEach(p => {
            const pipeHeight = pipeImg.height;
            const pipeWidth = pipeImg.width;

            const scaleX = this.width / pipeWidth;
            const drawHeight = pipeHeight * scaleX;

            // верх
            ctx.drawImage(
                pipeImg,
                p.x,
                p.top - drawHeight,
                this.width,
                drawHeight
            );

            // низ
            ctx.drawImage(
                pipeImg,
                p.x,
                p.top + this.gap,
                this.width,
                drawHeight
            );
        });
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
    // 🔥 быстрый фон
    if (bgCanvas.width) {
        ctx.drawImage(bgCanvas, 0, 0);
    }

    pipes.draw();
    bird.draw();

    ctx.fillStyle = "#fff";
    ctx.font = "20px Arial";
    ctx.fillText("Score: " + score, 20, 40);
}

// ===== FPS LIMIT (ВАЖНО) =====
let lastTime = 0;

function loop(time = 0) {
    const delta = time - lastTime;

    if (delta > 16) {
        update();
        draw();
        lastTime = time;
    }

    frames++;
    requestAnimationFrame(loop);
}

loop();