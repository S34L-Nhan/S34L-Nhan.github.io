const canvas = document.getElementById('stars');
const ctx = canvas.getContext('2d');
let stars = [];

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

for (let i = 0; i < 100; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() > 0.9 ? 2 : 1,
    speed: Math.random() * 0.3 + 0.05,
    blink: Math.random() * Math.PI * 2,
    blinkSpeed: Math.random() * 0.02 + 0.005
  });
}

function drawStars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  stars.forEach(s => {
    s.blink += s.blinkSpeed;
    const alpha = 0.3 + Math.sin(s.blink) * 0.3;
    ctx.fillStyle = `rgba(200, 200, 240, ${alpha})`;
    ctx.fillRect(Math.floor(s.x), Math.floor(s.y), s.size, s.size);
    s.y -= s.speed;
    if (s.y < -2) { s.y = canvas.height + 2; s.x = Math.random() * canvas.width; }
  });
  requestAnimationFrame(drawStars);
}
drawStars();

let audioCtx = null;
let sfxEnabled = true;

function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playBeep(freq = 800, duration = 0.06, vol = 0.08) {
  if (!sfxEnabled || !audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.value = freq;
  gain.gain.value = vol;
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function playSelect() {
  if (!sfxEnabled || !audioCtx) return;
  playBeep(600, 0.05, 0.06);
  setTimeout(() => playBeep(900, 0.08, 0.06), 60);
}

const soundBtn = document.getElementById('soundBtn');
soundBtn.addEventListener('click', () => {
  sfxEnabled = !sfxEnabled;
  soundBtn.textContent = sfxEnabled ? 'SFX: ON' : 'SFX: OFF';
});

const intro = document.getElementById('intro');
const pressStart = document.getElementById('pressStart');
const mainScreen = document.getElementById('mainScreen');

setTimeout(() => pressStart.classList.add('visible'), 1500);
setTimeout(() => soundBtn.classList.add('visible'), 2000);

function startGame() {
  initAudio();
  playSelect();
  intro.classList.add('hidden');
  setTimeout(() => {
    intro.style.display = 'none';
    mainScreen.style.display = 'block';
    renderMenu('main');
  }, 500);
}

intro.addEventListener('click', startGame);
document.addEventListener('keydown', function onStart(e) {
  if (intro.style.display !== 'none' && !intro.classList.contains('hidden')) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      startGame();
    }
  }
});

const menus = {
  main: {
    label: '♦ MAIN MENU ♦',
    items: [
      { label: 'About Me', desc: "fueled by coffee, forged in bugs." },
      { label: 'Projects', desc: 'Browse a few of my public projects', menu: 'projects' },
      { label: 'Skills', desc: "Accumulated skills during my  studies and free time" },
      { label: 'Contact', desc: 'Find me on LinkedIn' }
    ]
  },
  projects: {
    label: '♦ PROJECTS ♦',
    items: [
      { label: 'Chat', desc: 'Real-time chat rooms. Create one or join with a code.', url: 'chat/index.html' },
      { label: 'Back', desc: 'Return to the main menu.', menu: 'main' }
    ]
  }
};

const menuList = document.getElementById('menuList');
const frame = document.querySelector('.frame');
const descText = document.getElementById('descText');
const footer = document.getElementById('footer');

let currentMenu = 'main';
let menuItems = [];
let activeIndex = 0;
let typingTimeout = null;

function renderMenu(name) {
  currentMenu = name;
  const menu = menus[name];
  frame.dataset.label = menu.label;
  menuList.innerHTML = '';

  menu.items.forEach((entry, i) => {
    const li = document.createElement('li');
    li.className = 'menu-item';
    li.dataset.index = i;
    li.dataset.desc = entry.desc || '';
    li.innerHTML = '<span class="arrow">▶</span><span class="menu-label">' + entry.label + '</span>';
    li.addEventListener('mouseenter', () => {
      if (activeIndex !== i) { playBeep(600, 0.04, 0.05); setActive(i); }
    });
    li.addEventListener('click', () => selectItem(i));
    menuList.appendChild(li);
  });

  menuItems = Array.from(menuList.children);
  activeIndex = 0;

  menuItems.forEach((item, i) => {
    setTimeout(() => {
      item.classList.add('visible');
      playBeep(400 + i * 80, 0.04, 0.04);
    }, i * 120);
  });

  setTimeout(() => {
    setActive(0);
    footer.classList.add('visible');
  }, menuItems.length * 120 + 200);
}

function setActive(index) {
  menuItems.forEach(item => item.classList.remove('active'));
  activeIndex = index;
  menuItems[index].classList.add('active');
  typeDesc(menuItems[index].dataset.desc);
}

function typeDesc(text) {
  clearTimeout(typingTimeout);
  descText.innerHTML = '';
  let i = 0;
  const cursor = document.createElement('span');
  cursor.className = 'typed-cursor';

  function type() {
    if (i < text.length) {
      descText.insertBefore(document.createTextNode(text[i]), cursor);
      i++;
      typingTimeout = setTimeout(type, 18);
    } else {
      setTimeout(() => cursor.remove(), 3000);
    }
  }
  descText.appendChild(cursor);
  type();
}

document.addEventListener('keydown', (e) => {
  if (mainScreen.style.display === 'none') return;

  if (e.key === 'ArrowUp') {
    e.preventDefault();
    playBeep(600, 0.04, 0.05);
    setActive((activeIndex - 1 + menuItems.length) % menuItems.length);
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    playBeep(600, 0.04, 0.05);
    setActive((activeIndex + 1) % menuItems.length);
  }
  if (e.key === 'Enter') {
    e.preventDefault();
    selectItem(activeIndex);
  }
  if (e.key === 'Escape' && currentMenu !== 'main') {
    e.preventDefault();
    playSelect();
    renderMenu('main');
  }
});

function selectItem(index) {
  playSelect();
  const item = menuItems[index];
  item.classList.add('selected');
  setTimeout(() => item.classList.remove('selected'), 300);

  const entry = menus[currentMenu].items[index];
  if (entry.url) {
    setTimeout(() => { window.location.href = entry.url; }, 300);
  } else if (entry.menu) {
    setTimeout(() => renderMenu(entry.menu), 300);
  }
}
