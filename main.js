(() => {
  /* Core setup */
  const root = document.documentElement;
  const canvas = document.getElementById('snow');
  const ctx = canvas.getContext('2d');
  const globeEl = document.getElementById('globe');
  const figureEl = document.getElementById('figure');
  const statusEl = document.getElementById('status');
  const tickerEl = document.getElementById('ticker');
  const shakeBtn = document.getElementById('shakeBtn');
  const resetBtn = document.getElementById('resetBtn');
  const chaosSlider = document.getElementById('chaos');
  const soundToggle = document.getElementById('soundToggle');
  const motionNote = document.getElementById('motionNote');
  const moodSelect = document.getElementById('moodSelect');
  const backdropSelect = document.getElementById('backdropSelect');
  const figureSelect = document.getElementById('figureSelect');
  const glowlineEl = document.getElementById('glowline');
  const menuDock = document.getElementById('menuDock');
  const menuEl = document.querySelector('.menu');
  const menuOpen = document.getElementById('menu-open');
  const menuButton = document.querySelector('.menu-open-button');
  const menuItems = Array.from(document.querySelectorAll('.menu-item'));
  const menuPanel = document.getElementById('menuPanel');

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const flakes = [];
  const maxFlakes = 360;
  let activeFlakes = maxFlakes;
  const floor = 26;
  let width = 0, height = 0;
  let running = true;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let reduceMotion = prefersReduced;
  let audioCtx = null;
  let dragging = false;
  let tiltTarget = { x: 0, y: 0 };
  let tilt = { x: 0, y: 0 };
  let motionForce = { x: 0, y: 0 };
  let motionEnabled = false;
  let trailAlpha = 0.08;
  let gustStrength = 0;
  let pileNudge = 0;
  let lastInteract = performance.now();
  let lastFrame = performance.now();
  const fpsSamples = [];
  let menuPos = { x: 16, y: 16 };
  const backdrops = {
    sky:    { bg1: '#b7d6f2', bg2: '#9cc6ec' },
    blush:  { bg1: '#f4d8e4', bg2: '#efc4d8' },
    mint:   { bg1: '#c9f1e1', bg2: '#a7e6cf' },
    lilac:  { bg1: '#dcd4f7', bg2: '#c4b9ef' },
    apricot:{ bg1: '#f8e2c4', bg2: '#f4cfa4' }
  };
  const moods = {
    calm:   { bg1: '#0c1424', bg2: '#1b2d42', glow: 'rgba(115,181,255,0.35)', accent: '#8fe3ff', grade: 'rgba(0,30,60,0.18)', caustic: 'rgba(180,220,255,0.28)' },
    hearth: { bg1: '#241510', bg2: '#3c1f1a', glow: 'rgba(255,180,120,0.32)', accent: '#f4c38c', grade: 'rgba(60,15,0,0.24)', caustic: 'rgba(255,200,140,0.3)' },
    aurora: { bg1: '#0b1533', bg2: '#123b4a', glow: 'rgba(120,255,200,0.35)', accent: '#9fffe0', grade: 'rgba(0,40,60,0.22)', caustic: 'rgba(150,220,255,0.28)' },
    midnight:{ bg1: '#05080f', bg2: '#0e1625', glow: 'rgba(90,120,180,0.32)', accent: '#c0d7ff', grade: 'rgba(0,10,30,0.28)', caustic: 'rgba(160,190,255,0.25)' },
    blustery:{ bg1: '#0c1825', bg2: '#10364e', glow: 'rgba(120,180,255,0.45)', accent: '#7bd0ff', grade: 'rgba(10,35,60,0.26)', caustic: 'rgba(180,220,255,0.35)' }
  };
  const figures = {
    snowman: `
    <svg viewBox="0 0 200 200" role="img" aria-label="Snowman">
      <defs>
        <radialGradient id="snowBody" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#fff"/>
          <stop offset="100%" stop-color="#e5eef5"/>
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="160" rx="70" ry="18" fill="rgba(0,0,0,0.12)"/>
      <circle cx="100" cy="120" r="40" fill="url(#snowBody)"/>
      <circle cx="100" cy="70" r="26" fill="url(#snowBody)"/>
      <circle cx="90" cy="65" r="4" fill="#2c2c2c"/>
      <circle cx="112" cy="68" r="4" fill="#2c2c2c"/>
      <polygon points="100,75 132,82 100,88" fill="#f6a93a"/>
      <circle cx="100" cy="110" r="4.5" fill="#2c2c2c"/>
      <circle cx="100" cy="125" r="4.5" fill="#2c2c2c"/>
      <circle cx="100" cy="140" r="4.5" fill="#2c2c2c"/>
      <path d="M62 112 Q50 100 42 104" stroke="#a44a44" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M138 112 Q150 100 158 104" stroke="#a44a44" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M56 109 l-8 4 8 4" stroke="#a44a44" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M144 109 l8 4 -8 4" stroke="#a44a44" stroke-width="5" fill="none" stroke-linecap="round"/>
    </svg>`,
    penguin: `
    <svg viewBox="0 0 200 200" role="img" aria-label="Penguin">
      <ellipse cx="100" cy="165" rx="60" ry="16" fill="rgba(0,0,0,0.12)"/>
      <path d="M80 55 Q100 30 120 55 L130 120 Q130 150 100 160 Q70 150 70 120 Z" fill="#2f3545"/>
      <path d="M90 70 Q100 50 110 70 L114 120 Q114 140 100 146 Q86 140 86 120 Z" fill="#f5f6f9"/>
      <circle cx="94" cy="74" r="4" fill="#2c2c2c"/>
      <circle cx="108" cy="74" r="4" fill="#2c2c2c"/>
      <polygon points="100,80 112,86 100,92" fill="#f6a93a"/>
      <path d="M82 120 Q70 125 64 118" stroke="#2f3545" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path d="M118 120 Q130 125 136 118" stroke="#2f3545" stroke-width="8" fill="none" stroke-linecap="round"/>
      <ellipse cx="90" cy="150" rx="12" ry="6" fill="#f6a93a"/>
      <ellipse cx="110" cy="150" rx="12" ry="6" fill="#f6a93a"/>
    </svg>`,
    tree: `
    <svg viewBox="0 0 200 200" role="img" aria-label="Evergreen tree">
      <ellipse cx="100" cy="170" rx="60" ry="16" fill="rgba(0,0,0,0.12)"/>
      <rect x="92" y="130" width="16" height="30" rx="2" fill="#8b5a2b"/>
      <polygon points="100,40 150,120 50,120" fill="#2f7d4e"/>
      <polygon points="100,60 142,130 58,130" fill="#339c5f"/>
      <polygon points="100,82 132,144 68,144" fill="#3cb875"/>
      <circle cx="84" cy="114" r="4" fill="#f66b6b"/>
      <circle cx="116" cy="104" r="4" fill="#ffd166"/>
      <circle cx="104" cy="88" r="4" fill="#7ad7f0"/>
      <circle cx="96" cy="126" r="3" fill="#ffd166"/>
    </svg>`,
    gift: `
    <svg viewBox="0 0 200 200" role="img" aria-label="Gift box">
      <ellipse cx="100" cy="165" rx="60" ry="16" fill="rgba(0,0,0,0.12)"/>
      <rect x="60" y="90" width="80" height="70" rx="10" fill="#f66b6b"/>
      <rect x="94" y="90" width="12" height="70" fill="#ffd166"/>
      <rect x="60" y="124" width="80" height="12" fill="#ffd166"/>
      <path d="M100 90 C90 70 72 70 70 90" stroke="#ffd166" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path d="M100 90 C110 70 128 70 130 90" stroke="#ffd166" stroke-width="8" fill="none" stroke-linecap="round"/>
    </svg>`,
    fox: `
    <svg viewBox="0 0 200 200" role="img" aria-label="Fox">
      <ellipse cx="100" cy="165" rx="60" ry="16" fill="rgba(0,0,0,0.12)"/>
      <path d="M70 120 Q60 100 72 88 L88 98" fill="#f6a93a"/>
      <path d="M130 120 Q140 100 128 88 L112 98" fill="#f6a93a"/>
      <circle cx="100" cy="120" r="34" fill="#f6a93a"/>
      <path d="M76 122 Q100 100 124 122 Q110 150 90 150 Z" fill="#fff" opacity="0.9"/>
      <circle cx="90" cy="118" r="4" fill="#2c2c2c"/>
      <circle cx="110" cy="118" r="4" fill="#2c2c2c"/>
      <path d="M96 132 Q100 136 104 132" stroke="#2c2c2c" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M70 118 Q60 120 56 114" stroke="#f6a93a" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M130 118 Q140 120 144 114" stroke="#f6a93a" stroke-width="6" fill="none" stroke-linecap="round"/>
    </svg>`,
    cabin: `
    <svg viewBox="0 0 200 200" role="img" aria-label="Cabin">
      <ellipse cx="100" cy="170" rx="60" ry="16" fill="rgba(0,0,0,0.12)"/>
      <rect x="62" y="104" width="76" height="50" rx="4" fill="#b0713a"/>
      <rect x="92" y="122" width="18" height="32" rx="2" fill="#6d3f1e"/>
      <rect x="72" y="116" width="14" height="12" rx="2" fill="#f6f0d8"/>
      <rect x="116" y="116" width="14" height="12" rx="2" fill="#f6f0d8"/>
      <polygon points="50,110 100,70 150,110" fill="#8b4f24"/>
      <rect x="98" y="84" width="6" height="22" fill="#f6f0d8"/>
      <circle cx="99" cy="138" r="2" fill="#f6f0d8"/>
      <rect x="136" y="96" width="6" height="26" fill="#4d2a14"/>
      <rect x="138" y="90" width="8" height="8" fill="#4d2a14"/>
    </svg>`
  };
  // Simple Jingle Bells melody (one click advances one note; loops after end)
  const jbNotes = [
    { f: 659, d: 0.26 }, { f: 659, d: 0.26 }, { f: 659, d: 0.26 }, // E E E
    { f: 659, d: 0.26 }, { f: 659, d: 0.26 }, { f: 659, d: 0.26 }, // E E E
    { f: 659, d: 0.26 }, { f: 783, d: 0.26 }, { f: 523, d: 0.26 }, { f: 587, d: 0.26 }, { f: 659, d: 0.32 }, // E G C D E
    { f: 698, d: 0.26 }, { f: 698, d: 0.26 }, { f: 698, d: 0.26 }, { f: 698, d: 0.26 }, // F F F F
    { f: 698, d: 0.26 }, { f: 659, d: 0.26 }, { f: 659, d: 0.26 }, { f: 659, d: 0.26 }, { f: 659, d: 0.32 }, // F E E E E
    { f: 587, d: 0.26 }, { f: 587, d: 0.26 }, { f: 659, d: 0.26 }, { f: 587, d: 0.26 }, { f: 783, d: 0.36 }, // D D E D G
  ];
  let jbIndex = 0;

  /* Utility */
  const rand = (min, max) => Math.random() * (max - min) + min;
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
  const lerp = (a, b, t) => a + (b - a) * t;

  function setVars(map) {
    Object.entries(map).forEach(([k, v]) => root.style.setProperty(`--${k}`, v));
  }

  function updateMenuPalette() {
    const accent = getComputedStyle(root).getPropertyValue('--accent').trim() || '#8fe3ff';
    const bg2 = getComputedStyle(root).getPropertyValue('--bg2').trim() || '#1b2d42';
    root.style.setProperty('--menu-fg', accent);
    root.style.setProperty('--menu-bg', 'rgba(255,255,255,0.14)');
    root.style.setProperty('--menu-shadow', '0 18px 30px rgba(0,0,0,0.26)');
    menuPanel.style.background = `color-mix(in srgb, ${bg2} 75%, black 25%)`;
  }

  function applyMood(name) {
    const m = moods[name] || moods.calm;
    setVars({ bg1: m.bg1, bg2: m.bg2, glow: m.glow, accent: m.accent, grade: m.grade, caustic: m.caustic, 'glass-tint': m.glass || 'rgba(210,230,255,0.35)' });
    setStatus(`Mood: ${name.charAt(0).toUpperCase() + name.slice(1)}`);
    setTicker(`Mood set to ${name}.`);
    updateMenuPalette();
  }

  function applyBackdrop(name) {
    const b = backdrops[name] || backdrops.sky;
    setVars({ bg1: b.bg1, bg2: b.bg2 });
    setTicker(`Backdrop: ${name}.`);
    updateMenuPalette();
  }

  function orientPanel() {
    const rect = menuDock.getBoundingClientRect();
    const anchorLeft = rect.left > window.innerWidth / 2;
    const anchorTop = rect.top > window.innerHeight / 2;
    menuPanel.classList.toggle('anchor-left', anchorLeft);
    menuPanel.classList.toggle('anchor-top', anchorTop);
  }

  function layoutMenuItems() {
    if (menuEl) menuEl.classList.toggle('open', menuOpen.checked);
    const rect = menuDock.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const vx = (window.innerWidth / 2) - cx;
    const vy = (window.innerHeight / 2) - cy;
    const centerAngle = Math.atan2(vy, vx);
    const spread = Math.PI * 0.55; // tighter spread to avoid out-of-bounds on mobile
    const radius = 108;
    const total = menuItems.length;
    menuItems.forEach((item, i) => {
      const baseAngle = centerAngle - spread / 2 + (spread / Math.max(1, total - 1)) * i;
      const angle = Math.max(-0.05 * Math.PI, Math.min(0.9 * Math.PI, baseAngle));
      const dx = Math.cos(angle) * radius;
      const dy = Math.sin(angle) * radius;
      item.style.setProperty('--dx', `${dx}px`);
      item.style.setProperty('--dy', `${dy}px`);
      if (menuOpen.checked) {
        item.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      } else {
        item.style.transform = 'translate3d(0,0,0)';
      }
    });
    orientPanel();
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function makeFlake(kindOverride) {
    const depth = Math.random(); // depth for parallax
    const kind = kindOverride || (Math.random() < 0.12 ? 'spark' : Math.random() < 0.32 ? 'mote' : 'flake');
    const baseR = kind === 'spark' ? 1.2 : kind === 'mote' ? 0.9 : lerp(1.4, 3.6, Math.random());
    return {
      kind,
      x: Math.random() * width,
      y: Math.random() * height,
      vx: rand(-0.25, 0.25),
      vy: rand(0.05, 0.6),
      r: baseR * (0.55 + depth * 0.7),
      o: kind === 'spark' ? 0.5 + Math.random() * 0.4 : 0.35 + Math.random() * 0.55,
      depth,
      big: kind === 'flake' && Math.random() < 0.09,
      spin: Math.random() * Math.PI * 2,
      spinSpeed: rand(-0.015, 0.015),
      tw: Math.random() * Math.PI * 2
    };
  }

  function initFlakes() {
    flakes.length = 0;
    for (let i = 0; i < maxFlakes; i++) flakes.push(makeFlake());
  }

  function drawPile() {
    const pileH = Math.max(14, height * 0.09) + pileNudge;
    const grad = ctx.createRadialGradient(width / 2, height, width * 0.05, width / 2, height, width * 0.45);
    grad.addColorStop(0, 'rgba(255,255,255,0.32)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.14)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, height - pileH, width, pileH);
  }

  function drawFlake(f, t) {
    const px = f.x + tilt.x * 12 * (0.4 + f.depth);
    const py = f.y + tilt.y * 12 * (0.4 + f.depth);
    const twinkle = 0.5 + 0.5 * Math.sin(t * 2 + f.tw);

    if (f.kind === 'mote') {
      ctx.fillStyle = `rgba(200,220,255,${0.18 + f.o * 0.25})`;
      ctx.beginPath();
      ctx.arc(px, py, f.r * 0.7, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    if (f.kind === 'spark') {
      const g = ctx.createRadialGradient(px, py, 0, px, py, f.r * 3);
      g.addColorStop(0, `rgba(255,255,255,${f.o * twinkle})`);
      g.addColorStop(1, `rgba(255,255,255,0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, f.r * 1.2, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    const g = ctx.createRadialGradient(px, py, 0, px, py, f.r * 2.1);
    g.addColorStop(0, `rgba(255,255,255,${f.o})`);
    g.addColorStop(1, `rgba(255,255,255,${f.o * 0.08})`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, f.r, 0, Math.PI * 2);
    ctx.fill();

    if (f.big) { // simple twirl cross for depth
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(f.spin);
      ctx.strokeStyle = `rgba(255,255,255,${0.55 * f.o})`;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(0, -f.r);
      ctx.lineTo(0, f.r);
      ctx.moveTo(-f.r, 0);
      ctx.lineTo(f.r, 0);
      ctx.stroke();
      ctx.restore();
    }
  }

  function renderStatic() {
    ctx.clearRect(0, 0, width, height);
    drawPile();
    flakes.forEach(f => drawFlake(f, 0));
  }

  function updateFps(now) {
    const dt = Math.max(1, now - lastFrame);
    const fps = 1000 / dt;
    fpsSamples.push(fps);
    if (fpsSamples.length > 40) fpsSamples.shift();
    const avg = fpsSamples.reduce((a, b) => a + b, 0) / fpsSamples.length;
    if (avg < 50 && activeFlakes > 200) activeFlakes = Math.max(200, activeFlakes - 8);
    if (avg > 57 && activeFlakes < maxFlakes) activeFlakes = Math.min(maxFlakes, activeFlakes + 5);
  }

  function step(now) {
    if (!running) return;
    updateFps(now);

    // motion trails with a very light tint
    ctx.fillStyle = `rgba(12,20,36,${trailAlpha})`;
    ctx.fillRect(0, 0, width, height);

    // ease tilt
    tilt.x = lerp(tilt.x, tiltTarget.x, 0.08);
    tilt.y = lerp(tilt.y, tiltTarget.y, 0.08);

    // idle breathing
    const idleFor = now - lastInteract;
    if (idleFor > 8000) {
      const breath = 0.06 * Math.sin(idleFor * 0.0002);
      root.style.setProperty('--ambient-strength', (0.7 + breath).toFixed(2));
      setTicker("Snow is breathing softly.");
    } else {
      root.style.setProperty('--ambient-strength', '0.7');
    }

    drawPile();

    const gravity = 0.015;
    const drag = 0.995;
    const wind = Math.sin(Date.now() * 0.00045) * 0.035;
    const swirl = gustStrength * 0.008;

    motionForce.x *= 0.98;
    motionForce.y *= 0.98;

    const centerX = width / 2;
    const centerY = height / 2;
    for (let i = 0; i < activeFlakes; i++) {
      const f = flakes[i];
      f.spin += f.spinSpeed * (0.5 + f.depth * 0.6);

      // simple swirl gust force around center
      if (swirl) {
        const dx = f.x - centerX;
        const dy = f.y - centerY;
        f.vx += -dy * swirl * (0.2 + f.depth * 0.8);
        f.vy += dx * swirl * (0.2 + f.depth * 0.8);
      }

      f.vx += wind * (0.5 + f.depth * 0.6);
      f.vx += motionForce.x * (0.4 + f.depth * 0.6);
      f.vy += gravity * (0.6 + f.depth * 0.7);
      f.vy -= motionForce.y * (0.2 + f.depth * 0.5);

      f.vx *= drag;
      f.vy *= drag;

      f.x += f.vx;
      f.y += f.vy;

      // wrap horizontally
      const margin = 6;
      if (f.x < -margin) f.x = width + margin;
      if (f.x > width + margin) f.x = -margin;

      // floor collision / settle
      const floorY = height - floor - f.r * (0.35 + f.depth * 0.4) - pileNudge * 0.2;
      if (f.y > floorY) {
        f.y = floorY;
        f.vy *= -0.25;
        f.vx *= 0.8;
      }

      // gentle re-spawn if lost (wrap from top to lower area to avoid a ceiling band)
      if (f.y < -60) {
        f.y = height - floor - rand(0, 60);
        f.vy = rand(-0.05, 0.05);
      }

      drawFlake(f, now * 0.001);
    }

    gustStrength *= 0.96;
    pileNudge = lerp(pileNudge, 0, 0.02);
    trailAlpha = lerp(trailAlpha, reduceMotion ? 0 : 0.08, 0.02);

    lastFrame = now;
    requestAnimationFrame(step);
  }

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text;
  }
  function setTicker(text) {
    if (tickerEl) tickerEl.textContent = text;
  }

  function vibrate() {
    if (navigator.vibrate) navigator.vibrate([8, 16]);
  }

  function shake(strength) {
    if (reduceMotion) return;
    const s = strength ?? parseFloat(chaosSlider.value);
    const burst = s * 3.2;
    lastInteract = performance.now();
    gustStrength = s * 0.35;
    pileNudge += s * 6;
    trailAlpha = 0.16;
    glowlineEl.style.opacity = '0.55';
    setTimeout(() => glowlineEl.style.opacity = '0.35', 520);

    for (let i = 0; i < activeFlakes; i++) {
      const f = flakes[i];
      const ang = Math.random() * Math.PI * 2;
      const speed = rand(0.4, 1) * burst;
      f.vx += Math.cos(ang) * speed * (0.5 + f.depth * 0.6);
      f.vy += Math.sin(ang) * speed * 0.6 - s * 3.2;
    }
    ping();
    whoosh(s);
    vibrate();
    setStatus("Shaken!");
    setTicker("Burst of flakes! Letting it settle...");
  }

  function resetSnow() {
    for (const f of flakes) {
      f.vx = rand(-0.05, 0.05);
      f.vy = rand(0.05, 0.4);
    }
    tiltTarget = { x: 0, y: 0 };
    gustStrength = 0;
    pileNudge = 0;
    activeFlakes = maxFlakes;
    setStatus("Calm");
    setTicker("Reset to calm.");
  }

  /* Audio chime via Web Audio */
  function ping() {
    if (!soundToggle.checked) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const t = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, t);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.5);
    } catch (e) {
      // no-op if audio fails
    }
  }

  function whoosh(strength) {
    if (!soundToggle.checked) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const t = audioCtx.currentTime;
      const dur = 0.35;
      const bufferSize = audioCtx.sampleRate * dur;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.2);
      }
      const src = audioCtx.createBufferSource();
      src.buffer = buffer;
      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.14 * strength, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      const filt = audioCtx.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.setValueAtTime(600 + strength * 500, t);
      src.connect(filt).connect(gain).connect(audioCtx.destination);
      src.start(t);
    } catch (e) { /* ignore */ }
  }

  /* Parallax / drag handling */
  function pointerToTilt(e) {
    const rect = globeEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / rect.width;
    const dy = (e.clientY - cy) / rect.height;
    return {
      x: clamp(dx, -0.8, 0.8),
      y: clamp(dy, -0.8, 0.8)
    };
  }

  function playJingleStep() {
    if (!soundToggle.checked) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const note = jbNotes[jbIndex];
      jbIndex = (jbIndex + 1) % jbNotes.length;
      if (!note || !note.f) return;
      const t = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.f, t);
      const dur = note.d || 0.28;
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + dur);
    } catch (e) {
      // ignore audio errors
    }
  }

  function updateLight(pos) {
    const rect = globeEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const lx = clamp((pos.clientX - cx) / rect.width + 0.5, 0, 1);
    const ly = clamp((pos.clientY - cy) / rect.height + 0.5, 0, 1);
    root.style.setProperty('--light-x', `${(lx * 100).toFixed(2)}%`);
    root.style.setProperty('--light-y', `${(ly * 100).toFixed(2)}%`);
  }

  globeEl.addEventListener('pointerdown', e => {
    dragging = true;
    globeEl.setPointerCapture(e.pointerId);
    tiltTarget = pointerToTilt(e);
    updateLight(e);
    lastInteract = performance.now();
    maybeEnableMotion();
    // treat tap/click as a gentle shake
    shake(chaosSlider ? parseFloat(chaosSlider.value) : 1.2);
    playJingleStep();
  });

  globeEl.addEventListener('pointermove', e => {
    if (!dragging) {
      // light parallax on hover
      tiltTarget = pointerToTilt(e);
      updateLight(e);
      return;
    }
    tiltTarget = pointerToTilt(e);
    updateLight(e);
    lastInteract = performance.now();
    // gently nudge flakes based on drag motion
    flakes.forEach(f => {
      f.vx += tiltTarget.x * 0.25 * (0.4 + f.depth * 0.6);
      f.vy += tiltTarget.y * 0.25 * (0.4 + f.depth * 0.6);
    });
  });

  const endDrag = e => {
    dragging = false;
    tiltTarget = { x: 0, y: 0 };
  };
  globeEl.addEventListener('pointerup', endDrag);
  globeEl.addEventListener('pointerleave', endDrag);

  /* Device motion */
  function onMotion(e) {
    if (!e.accelerationIncludingGravity) return;
    const ax = clamp(e.accelerationIncludingGravity.x || 0, -12, 12);
    const ay = clamp(e.accelerationIncludingGravity.y || 0, -12, 12);
    motionForce.x = ax * 0.02;
    motionForce.y = ay * 0.02;
    if (!dragging) {
      tiltTarget = { x: motionForce.x * 1.2, y: -motionForce.y * 1.0 };
    }
  }

  function maybeEnableMotion() {
    if (motionEnabled || reduceMotion) return;
    if (typeof DeviceMotionEvent !== 'undefined' &&
        typeof DeviceMotionEvent.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission().then(res => {
        if (res === 'granted') {
          window.addEventListener('devicemotion', onMotion, true);
          motionEnabled = true;
          motionNote.textContent = "Motion on: gently shake your device!";
        } else {
          motionNote.textContent = "Motion denied; drag to tilt instead.";
        }
      }).catch(() => {
        motionNote.textContent = "Motion not available.";
      });
    } else if ('DeviceMotionEvent' in window) {
      window.addEventListener('devicemotion', onMotion, true);
      motionEnabled = true;
      motionNote.textContent = "Motion on: gently shake your device!";
    } else {
      motionNote.textContent = "Motion not available.";
    }
  }

  /* Reduced motion respect */
  if (reduceMotion) {
    setStatus("Static (prefers-reduced-motion)");
    setTicker("Static mode (prefers-reduced-motion).");
  }

  /* Controls */
  shakeBtn.addEventListener('click', () => { maybeEnableMotion(); shake(); });
  resetBtn.addEventListener('click', () => resetSnow());
  chaosSlider.addEventListener('input', () => {
    const val = parseFloat(chaosSlider.value);
    setStatus(val > 2 ? "Spicy" : "Calm");
  });
  soundToggle.addEventListener('change', () => {
    if (soundToggle.checked && !audioCtx) {
      // prime audio on user action
      ping();
    }
    const soundBtn = document.querySelector('[data-action="sound"]');
    if (soundBtn) soundBtn.classList.toggle('muted', !soundToggle.checked);
  });
  moodSelect.addEventListener('change', e => applyMood(e.target.value));
  backdropSelect.addEventListener('change', e => applyBackdrop(e.target.value));

  function setFigure(name) {
    const svg = figures[name] || figures.snowman;
    figureEl.innerHTML = svg;
    setTicker(`Inside: ${name}.`);
  }
  figureSelect.addEventListener('change', e => setFigure(e.target.value));

  // cute hover ripple for buttons
  document.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('pointermove', e => {
      const r = btn.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      btn.style.setProperty('--hover-x', `${x}%`);
      btn.style.setProperty('--hover-y', `${y}%`);
    });
  });

  /* Menu interactions */
  function togglePanel(force) {
    const next = force !== undefined ? force : !menuPanel.classList.contains('open');
    menuPanel.classList.toggle('open', next);
    orientPanel();
  }

  function toggleMenu(force) {
    const next = force !== undefined ? force : !menuOpen.checked;
    menuOpen.checked = next;
    menuOpen.setAttribute('aria-expanded', String(next));
    layoutMenuItems();
    if (!next) togglePanel(false);
    menuOpen.dispatchEvent(new Event('change'));
  }

  function handleMenuAction(action) {
    switch (action) {
      case 'shake': shake(); break;
      case 'reset': resetSnow(); break;
      case 'panel':
        if (!menuOpen.checked) {
          menuOpen.checked = true;
          layoutMenuItems();
        }
        togglePanel();
        break;
      case 'sound':
        soundToggle.checked = !soundToggle.checked;
        document.querySelector('[data-action="sound"]').classList.toggle('muted', !soundToggle.checked);
        break;
      case 'random':
        const moodsKeys = Object.keys(moods);
        const backsKeys = Object.keys(backdrops);
        const figsKeys = Object.keys(figures);
        const pick = arr => arr[Math.floor(Math.random() * arr.length)];
        const m = pick(moodsKeys);
        const b = pick(backsKeys);
        const f = pick(figsKeys);
        moodSelect.value = m; applyMood(m);
        backdropSelect.value = b; applyBackdrop(b);
        figureSelect.value = f; setFigure(f);
        shake(2.1);
        break;
    }
  }

  menuItems.forEach(btn => {
    btn.addEventListener('click', () => handleMenuAction(btn.dataset.action));
  });

  menuOpen.addEventListener('change', () => {
    if (!menuOpen.checked) togglePanel(false);
    layoutMenuItems();
    menuOpen.setAttribute('aria-expanded', String(menuOpen.checked));
  });

  menuButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleMenu();
  });

  // ensure first layout matches initial state
  layoutMenuItems();

  window.addEventListener('resize', () => {
    resize();
    if (reduceMotion) renderStatic();
    layoutMenuItems();
  });

  /* Kickoff */
  resize();
  initFlakes();
  applyMood('calm');
  applyBackdrop('sky');
  setFigure('snowman');
  const soundBtn = document.querySelector('[data-action="sound"]');
  if (soundBtn) soundBtn.classList.toggle('muted', !soundToggle.checked);
  // set initial menu layout
  layoutMenuItems();
  if (reduceMotion) {
    running = false;
    renderStatic();
  } else {
    requestAnimationFrame(step);
  }
})();

