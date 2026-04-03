const gameArea = document.getElementById('game-area');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayMsg = document.getElementById('overlay-msg');
const bestScoreDisplay = document.getElementById('best-score-display');
const startBtn = document.getElementById('start-btn');
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');
const missesDisplay = document.getElementById('misses');
const progressBar = document.getElementById('progress-bar');
const missFlash = document.getElementById('miss-flash');

const GAME_DURATION = 30;
const MAX_MISSES = 5;
const TARGET_COLORS = [
  { bg: '#e94560', shadow: 'rgba(233,69,96,0.6)' },
  { bg: '#0f3460', shadow: 'rgba(15,52,96,0.6)' },
  { bg: '#533483', shadow: 'rgba(83,52,131,0.6)' },
  { bg: '#00b4d8', shadow: 'rgba(0,180,216,0.6)' },
  { bg: '#06d6a0', shadow: 'rgba(6,214,160,0.6)' },
  { bg: '#ffd166', shadow: 'rgba(255,209,102,0.6)' },
];
const TARGET_EMOJIS = ['🎯', '⭐', '💥', '🔥', '💎', '🍀'];

let score = 0;
let misses = 0;
let timeLeft = GAME_DURATION;
let gameRunning = false;
let timerInterval = null;
let spawnInterval = null;
let bestScore = parseInt(localStorage.getItem('tapGameBest') || '0', 10);

function updateBestDisplay() {
  bestScoreDisplay.textContent = `🏆 أفضل نتيجة: ${bestScore}`;
}

updateBestDisplay();

startBtn.addEventListener('click', startGame);

gameArea.addEventListener('click', function (e) {
  if (!gameRunning) return;
  if (e.target === gameArea || e.target === missFlash) {
    registerMiss(e.clientX, e.clientY);
  }
});

function startGame() {
  score = 0;
  misses = 0;
  timeLeft = GAME_DURATION;
  gameRunning = true;

  scoreDisplay.textContent = '0';
  missesDisplay.textContent = '0';
  timerDisplay.textContent = GAME_DURATION;
  timerDisplay.classList.remove('urgent');
  progressBar.style.width = '100%';

  overlay.style.display = 'none';
  gameArea.classList.remove('inactive');

  clearAllTargets();

  timerInterval = setInterval(tick, 1000);
  scheduleNextTarget();
}

function tick() {
  timeLeft--;
  timerDisplay.textContent = timeLeft;
  progressBar.style.width = `${(timeLeft / GAME_DURATION) * 100}%`;

  if (timeLeft <= 5) {
    timerDisplay.classList.add('urgent');
  }

  if (timeLeft <= 0) {
    endGame();
  }
}

function endGame() {
  gameRunning = false;
  clearInterval(timerInterval);
  clearInterval(spawnInterval);
  clearAllTargets();

  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('tapGameBest', bestScore);
    updateBestDisplay();
    overlayTitle.textContent = '🎉 رقم قياسي جديد!';
    overlayMsg.textContent = `أحسنت! سجلت ${score} نقطة وحققت رقماً قياسياً جديداً!`;
  } else {
    overlayTitle.textContent = '⏰ انتهت اللعبة!';
    overlayMsg.textContent = `نتيجتك: ${score} نقطة | تخطيت: ${misses}`;
  }

  startBtn.textContent = '🔄 العب مجدداً';
  overlay.style.display = 'block';
  gameArea.classList.add('inactive');
}

function scheduleNextTarget() {
  if (!gameRunning) return;
  const delay = Math.max(400, 1000 - score * 8);
  spawnInterval = setTimeout(() => {
    if (gameRunning) {
      spawnTarget();
      scheduleNextTarget();
    }
  }, delay);
}

function spawnTarget() {
  const size = randomBetween(44, 72);
  const maxX = gameArea.clientWidth - size;
  const maxY = gameArea.clientHeight - size;
  const x = randomBetween(4, maxX - 4);
  const y = randomBetween(4, maxY - 4);

  const colorInfo = TARGET_COLORS[Math.floor(Math.random() * TARGET_COLORS.length)];
  const emoji = TARGET_EMOJIS[Math.floor(Math.random() * TARGET_EMOJIS.length)];

  const target = document.createElement('div');
  target.className = 'target';
  target.style.width = `${size}px`;
  target.style.height = `${size}px`;
  target.style.left = `${x}px`;
  target.style.top = `${y}px`;
  target.style.background = `radial-gradient(circle at 35% 35%, ${lighten(colorInfo.bg)}, ${colorInfo.bg})`;
  target.style.boxShadow = `0 0 12px ${colorInfo.shadow}, 0 0 4px ${colorInfo.shadow}`;
  target.style.fontSize = `${Math.round(size * 0.45)}px`;
  target.textContent = emoji;

  const lifespan = Math.max(800, 2000 - score * 15);
  let hit = false;

  target.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!gameRunning || hit) return;
    hit = true;
    registerHit(target, x + size / 2, y + size / 2);
  });

  target.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!gameRunning || hit) return;
    hit = true;
    registerHit(target, x + size / 2, y + size / 2);
  }, { passive: false });

  gameArea.appendChild(target);

  setTimeout(() => {
    if (!hit && target.parentNode) {
      hit = true;
      target.classList.add('dying');
      setTimeout(() => target.remove(), 150);
    }
  }, lifespan);
}

function registerHit(target, cx, cy) {
  score++;
  scoreDisplay.textContent = score;

  target.classList.add('dying');
  setTimeout(() => target.remove(), 150);

  showPopup(cx, cy, '+1');
}

function registerMiss(clientX, clientY) {
  misses++;
  missesDisplay.textContent = misses;

  const rect = gameArea.getBoundingClientRect();
  showPopup(clientX - rect.left, clientY - rect.top, '✗', '#ff4757');

  missFlash.classList.add('active');
  setTimeout(() => missFlash.classList.remove('active'), 150);

  if (misses >= MAX_MISSES) {
    endGame();
  }
}

function showPopup(x, y, text, color = '#f6e05e') {
  const popup = document.createElement('div');
  popup.className = 'score-popup';
  popup.textContent = text;
  popup.style.left = `${x - 16}px`;
  popup.style.top = `${y - 16}px`;
  popup.style.color = color;
  gameArea.appendChild(popup);
  setTimeout(() => popup.remove(), 700);
}

function clearAllTargets() {
  const targets = gameArea.querySelectorAll('.target, .score-popup');
  targets.forEach(t => t.remove());
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function lighten(hex) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + 60);
  const g = Math.min(255, ((num >> 8) & 0xff) + 60);
  const b = Math.min(255, (num & 0xff) + 60);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
