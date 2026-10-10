const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const finalScoreEl = document.getElementById('final-score');
const startMenu = document.getElementById('start-menu');
const gameOverMenu = document.getElementById('game-over-menu');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');


canvas.width = 800;
canvas.height = 400;


let score = 0;
let bestScore = localStorage.getItem('neonBestScore') || 0;
bestEl.innerText = bestScore;

let gameActive = false;
let gameSpeed = 5;
let frameCount = 0;
let obstacles = [];
let collectibles = [];
const gravity = 0.8;


const player = {
    x: 80,
    y: 300,
    width: 40,
    height: 40,
    velocityY: 0,
    jumpForce: -15,
    isGrounded: false,
    hasShield: false,
    shieldTimer: 0,

    draw() {

        if (this.hasShield) {
            ctx.beginPath();
            ctx.arc(this.x + 20, this.y + 20, 38, 0, Math.PI * 2);
            ctx.strokeStyle = '#00f3ff';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.fillStyle = 'rgba(0, 243, 255, 0.2)';
            ctx.fill();
        }


        ctx.fillStyle = '#ff00ff';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff00ff';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
    },

    update() {

        this.velocityY += gravity;
        this.y += this.velocityY;


        const groundLevel = canvas.height - 40;
        if (this.y + this.height > groundLevel) {
            this.y = groundLevel - this.height;
            this.velocityY = 0;
            this.isGrounded = true;
        }


        if (this.shieldTimer > 0) {
            this.shieldTimer--;
        } else {
            this.hasShield = false;
        }
    },

    jump() {
        if (this.isGrounded) {
            this.velocityY = this.jumpForce;
            this.isGrounded = false;
        }
    },

    activateShield() {
        if (!this.hasShield) {
            this.hasShield = true;
            this.shieldTimer = 250;
        }
    }
};


class Obstacle {
    constructor() {
        this.width = 25 + Math.random() * 35;
        this.height = 30 + Math.random() * 60;
        this.x = canvas.width;
        this.y = canvas.height - this.height - 40;
        this.color = '#00f3ff';
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
    }
    update() {
        this.x -= gameSpeed;
    }
}


class DataItem {
    constructor() {
        this.radius = 8;
        this.x = canvas.width;
        this.y = 150 + Math.random() * 120;
    }
    draw() {
        ctx.fillStyle = '#ffff00';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffff00';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
    update() {
        this.x -= gameSpeed;
    }
}

function initGame() {
    score = 0;
    gameSpeed = 6;
    frameCount = 0;
    obstacles = [];
    collectibles = [];
    player.y = 200;
    player.hasShield = false;
    player.shieldTimer = 0;
    gameActive = true;

    scoreEl.innerText = score;
    startMenu.classList.add('hidden');
    gameOverMenu.classList.add('hidden');

    animate();
}

function endGame() {
    gameActive = false;
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('neonBestScore', bestScore);
        bestEl.innerText = bestScore;
    }
    finalScoreEl.innerText = score;
    gameOverMenu.classList.remove('hidden');
}

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') player.jump();
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') player.activateShield();
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    player.jump();
});

startBtn.addEventListener('click', initGame);
restartBtn.addEventListener('click', initGame);


function animate() {
    if (!gameActive) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);


    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 40);
    ctx.lineTo(canvas.width, canvas.height - 40);
    ctx.stroke();


    player.update();
    player.draw();


    if (frameCount % 85 === 0) {
        obstacles.push(new Obstacle());
    }

    obstacles.forEach((obs, index) => {
        obs.update();
        obs.draw();

        // تشخیص برخورد با مستطیل (AABB)
        if (
            player.x < obs.x + obs.width &&
            player.x + player.width > obs.x &&
            player.y < obs.y + obs.height &&
            player.y + player.height > obs.y
        ) {
            if (player.hasShield) {
                player.hasShield = false;
                player.shieldTimer = 0;
                obstacles.splice(index, 1);
            } else {
                endGame();
            }
        }

        if (obs.x + obs.width < 0) {
            obstacles.splice(index, 1);
            score += 10;
            scoreEl.innerText = score;
            // افزایش تدریجی سرعت
            if (score % 100 === 0) gameSpeed += 0.2;
        }
    });

    if (frameCount % 120 === 0) {
        collectibles.push(new DataItem());
    }

    collectibles.forEach((item, index) => {
        item.update();
        item.draw();

        const dist = Math.hypot(player.x + 20 - item.x, player.y + 20 - item.y);
        if (dist < 35) {
            collectibles.splice(index, 1);
            score += 50;
            scoreEl.innerText = score;
        }

        if (item.x + 20 < 0) collectibles.splice(index, 1);
    });

    frameCount++;
    requestAnimationFrame(animate);
}