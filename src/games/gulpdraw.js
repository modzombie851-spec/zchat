import { WW, WH, FLOOR, rOf, rngOf } from './gulpengine.js';

const TAU = Math.PI * 2;
const FF = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

export const Snd = (() => {
  let ac = null, out = null, mus = null, nbuf = null, timer = null, next = 0, step = 0;
  const st = { sfx: true, music: true };
  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try { ac = new AC(); } catch { ac = null; return; }
    out = ac.createGain(); out.gain.value = 0.85; out.connect(ac.destination);
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400; lp.connect(out);
    mus = ac.createGain(); mus.gain.value = 0; mus.connect(lp);
  }
  function env(g, t, a, v, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  function tone(f, d, type, v, delay, f2) {
    if (!ac || !st.sfx) return;
    const t = ac.currentTime + (delay || 0), o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    env(g, t, 0.008, v || 0.1, d); o.connect(g); g.connect(out); o.start(t); o.stop(t + d + 0.06);
  }
  function noise(d, v, freq, type, delay) {
    if (!ac || !st.sfx) return;
    if (!nbuf) { nbuf = ac.createBuffer(1, ac.sampleRate * 1.5, ac.sampleRate); const ch = nbuf.getChannelData(0); for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1; }
    const t = ac.currentTime + (delay || 0), s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = nbuf; f.type = type || 'lowpass'; f.frequency.value = freq || 800; env(g, t, 0.01, v || 0.08, d);
    s.connect(f); f.connect(g); g.connect(out); s.start(t); s.stop(t + d + 0.06);
  }
  const fx = {
    gulp(big) { tone(big ? 220 : 340, 0.16, 'sine', 0.14, 0, big ? 90 : 140); noise(0.09, 0.05, 500); tone(big ? 520 : 760, 0.08, 'triangle', 0.05, 0.08, big ? 300 : 460); },
    bubble() { tone(900 + Math.random() * 500, 0.06, 'sine', 0.04, 0, 1600); },
    dash() { noise(0.35, 0.09, 1600, 'bandpass'); tone(300, 0.25, 'sine', 0.05, 0, 520); },
    hunt() { tone(98, 0.22, 'sawtooth', 0.05); tone(98, 0.22, 'sawtooth', 0.05, 0.28); },
    die() { noise(0.4, 0.14, 700); tone(160, 0.5, 'square', 0.05, 0, 55); },
    pick() { [880, 1175, 1568].forEach((f, i) => tone(f, 0.2, 'triangle', 0.06, i * 0.06)); },
    eatp() { tone(140, 0.4, 'sawtooth', 0.06, 0, 70); noise(0.3, 0.1, 900); [523, 659, 784].forEach((f, i) => tone(f, 0.18, 'triangle', 0.06, 0.15 + i * 0.07)); },
    spawn() { tone(440, 0.2, 'sine', 0.05, 0, 880); },
    win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.35, 'triangle', 0.09, i * 0.11)); tone(1319, 0.8, 'sine', 0.06, 0.5); },
    lose() { [392, 330, 262].forEach((f, i) => tone(f, 0.32, 'triangle', 0.08, i * 0.16)); },
    click() { tone(1500, 0.03, 'square', 0.025); },
    pop() { tone(660, 0.07, 'sine', 0.06, 0, 990); },
    emote() { tone(880, 0.08, 'sine', 0.06, 0, 1320); tone(1320, 0.12, 'sine', 0.04, 0.06); },
    tick() { tone(1200, 0.04, 'square', 0.03); },
  };
  const scale = [174.6, 196, 220, 261.6, 293.7, 349.2, 392, 440];
  const pat = [0, 2, 4, -1, 3, -1, 5, 4, 2, -1, 4, -1, 6, 5, 3, -1];
  function pluck(f, t) { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.06, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4); o.connect(g); g.connect(mus); o.start(t); o.stop(t + 1.5); }
  function pad(t, s) { const roots = [87.3, 98, 73.4, 82.4]; const r = roots[(s / 16 | 0) % 4]; [1, 1.5, 2].forEach((m, i) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'triangle'; o.frequency.value = r * m; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.028 / (i + 1), t + 1.5); g.gain.exponentialRampToValueAtTime(0.0001, t + 5.6); o.connect(g); g.connect(mus); o.start(t); o.stop(t + 5.8); }); }
  function tick() { if (!ac) return; if (next < ac.currentTime) next = ac.currentTime + 0.05; while (next < ac.currentTime + 0.35) { const s = step++; const n = pat[s % 16]; if (n >= 0) pluck(scale[n] * 2, next); if (s % 16 === 0) pad(next, s); next += 0.3; } }
  function music(on) { st.music = on; if (!ac) return; mus.gain.cancelScheduledValues(ac.currentTime); mus.gain.setTargetAtTime(on ? 1 : 0, ac.currentTime, 0.4); if (on && !timer) timer = setInterval(tick, 120); if (!on && timer) { clearInterval(timer); timer = null; } }
  return { init, fx, music, st };
})();

const PREY = [
  { b: '#FFD23F', d: '#E8A800', f: '#FFB000', stripe: null },
  { b: '#FF7A2A', d: '#D9541A', f: '#FF9A50', stripe: '#FFFFFF' },
  { b: '#2E6BFF', d: '#1E46B8', f: '#FFD23F', stripe: '#13245E' },
  { b: '#FF6FAE', d: '#D94B8A', f: '#FF9CC8', stripe: null },
  { b: '#4FD27A', d: '#2FA857', f: '#9BEA8A', stripe: '#2A8A48' },
  { b: '#A07BFF', d: '#7650E0', f: '#C8B2FF', stripe: null },
];
const HUNT = { b: '#617896', d: '#3E5270', f: '#4E6482', belly: '#DCE6EE' };
const PLAYER = { sun: { b: '#FFB347', d: '#E8801A', f: '#FFD27A', ring: '#FFCB7A' }, moon: { b: '#46B7FF', d: '#1E86D6', f: '#9FE0FF', ring: '#A9DCFF' } };

function rr(c, x, y, w, h, r) { r = Math.max(0, Math.min(r, w / 2, h / 2)); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

export function drawFish(c, x, y, r, a, o) {
  const P = o.pal;
  const t = o.t || 0;
  const flip = Math.cos(a) < 0;
  const wag = Math.sin(t * (o.fast ? 16 : 9) + (o.ph || 0)) * 0.22;
  c.save();
  c.translate(x, y); c.rotate(a); if (flip) c.scale(1, -1);
  const L = r * 1.15, H = r * 0.82;
  c.fillStyle = 'rgba(0,10,30,0.18)'; c.beginPath(); c.ellipse(-r * 0.05, H * 0.95, L * 0.9, H * 0.22, 0, 0, TAU); c.fill();
  c.save(); c.translate(-L * 0.86, 0); c.rotate(wag);
  c.fillStyle = P.f; c.beginPath(); c.moveTo(r * 0.12, 0); c.quadraticCurveTo(-r * 0.35, -H * 0.2, -r * 0.62, -H * 0.82); c.quadraticCurveTo(-r * 0.42, 0, -r * 0.62, H * 0.82); c.quadraticCurveTo(-r * 0.35, H * 0.2, r * 0.12, 0); c.fill();
  c.restore();
  c.fillStyle = P.f; c.beginPath(); c.moveTo(-L * 0.35, -H * 0.82); c.quadraticCurveTo(-L * 0.05, -H * 1.45, L * 0.32, -H * 0.88); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(-L * 0.2, H * 0.8); c.quadraticCurveTo(-L * 0.05, H * 1.2, L * 0.15, H * 0.82); c.closePath(); c.fill();
  const g = c.createLinearGradient(0, -H, 0, H); g.addColorStop(0, P.b); g.addColorStop(1, P.d);
  c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, L, H, 0, 0, TAU); c.fill();
  if (P.belly) { c.fillStyle = P.belly; c.beginPath(); c.ellipse(L * 0.08, H * 0.45, L * 0.75, H * 0.45, 0, 0, Math.PI); c.fill(); }
  if (P.stripe) { c.save(); c.beginPath(); c.ellipse(0, 0, L, H, 0, 0, TAU); c.clip(); c.fillStyle = P.stripe; for (const sx of [-0.45, 0.2]) { c.beginPath(); c.ellipse(L * sx, 0, L * 0.09, H * 1.1, 0, 0, TAU); c.fill(); } c.restore(); }
  c.fillStyle = 'rgba(255,255,255,0.22)'; c.beginPath(); c.ellipse(-L * 0.1, -H * 0.45, L * 0.55, H * 0.2, -0.08, 0, TAU); c.fill();
  c.save(); c.translate(L * 0.1, H * 0.25); c.rotate(-0.5 + wag * 0.6); c.fillStyle = P.f; c.beginPath(); c.ellipse(-r * 0.12, 0, r * 0.26, r * 0.11, 0, 0, TAU); c.fill(); c.restore();
  const ex = L * 0.55, ey = -H * 0.22, er = Math.max(1.5, r * 0.2);
  c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(ex, ey, er, 0, TAU); c.fill();
  c.fillStyle = '#10131A'; c.beginPath(); c.arc(ex + er * 0.25, ey + er * 0.05, er * 0.58, 0, TAU); c.fill();
  c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(ex + er * 0.4, ey - er * 0.25, er * 0.2, 0, TAU); c.fill();
  if (o.angry) { c.strokeStyle = '#1A2230'; c.lineWidth = Math.max(1.5, r * 0.08); c.lineCap = 'round'; c.beginPath(); c.moveTo(ex - er * 1.1, ey - er * 1.5); c.lineTo(ex + er * 0.9, ey - er * 0.8); c.stroke(); }
  const open = clamp01(o.mouth || 0);
  if (open > 0.05) {
    c.fillStyle = '#4A1220'; c.beginPath(); c.moveTo(L * 0.98, -H * 0.02); c.lineTo(L * 0.62, H * (0.12 + open * 0.06)); c.lineTo(L * 0.98, H * (0.1 + open * 0.42)); c.closePath(); c.fill();
    if (o.teeth) { c.fillStyle = '#FFFFFF'; for (let i = 0; i < 3; i++) { const tx = L * (0.7 + i * 0.09); c.beginPath(); c.moveTo(tx, H * 0.06); c.lineTo(tx + L * 0.03, H * 0.16); c.lineTo(tx + L * 0.06, H * 0.06); c.fill(); } }
  } else { c.strokeStyle = 'rgba(40,10,20,0.6)'; c.lineWidth = Math.max(1, r * 0.05); c.beginPath(); c.moveTo(L * 0.94, H * 0.12); c.quadraticCurveTo(L * 0.85, H * 0.2, L * 0.76, H * 0.16); c.stroke(); }
  c.restore();
  if (o.num != null) {
    const txt = String(o.num);
    const fs = Math.max(10, Math.min(r * 0.9, (r * 1.35) / Math.max(1, txt.length * 0.62)));
    c.save(); c.font = `900 ${fs}px ${FF}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineWidth = Math.max(2.5, fs * 0.22); c.strokeStyle = 'rgba(10,18,34,0.85)'; c.lineJoin = 'round';
    const nx = x - Math.cos(a) * r * 0.27, ny = y - Math.sin(a) * r * 0.27 + r * 0.06;
    c.strokeText(txt, nx, ny); c.fillStyle = o.numCol || '#FFFFFF'; c.fillText(txt, nx, ny);
    c.restore();
  }
}
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

export function makeDeco(seed) {
  const R = rngOf(`deco:${seed}`);
  const D = { rocks: [], corals: [], weeds: [], shells: [], bg: [], vents: [], kelp: [], schools: [] };
  for (let i = 0; i < 9; i++) D.rocks.push({ x: R() * WW, w: 0.8 + R() * 1.8, h: 0.5 + R() * 1.1, c: ['#3E5568', '#4A6074', '#566B7E'][Math.floor(R() * 3)] });
  for (let i = 0; i < 12; i++) D.corals.push({ x: R() * WW, s: 0.6 + R() * 0.9, c: ['#FF7A8A', '#FF9F5A', '#B57BFF', '#FF5FA2', '#FFD166'][Math.floor(R() * 5)], k: Math.floor(R() * 3), seed: R() * 100 });
  for (let i = 0; i < 18; i++) D.weeds.push({ x: R() * WW, h: 1.4 + R() * 2.8, c: ['#2E9A62', '#3BB373', '#1F7A4E'][Math.floor(R() * 3)], ph: R() * 6 });
  for (let i = 0; i < 10; i++) D.shells.push({ x: R() * WW, k: Math.floor(R() * 2), c: ['#FFE0C8', '#FFB8A0', '#F6D27A'][Math.floor(R() * 3)], r: R() * 3 });
  D.ridge = [];
  for (let x = -26; x <= WW + 26; x += 1.6) D.ridge.push([x, 1.2 + R() * 1.6 + Math.sin(x * 0.21 + R()) * 1.4]);
  for (let i = 0; i < 16; i++) D.bg.push({ x: -14 + R() * (WW + 28), h: 7 + R() * 16, ph: R() * 6, w: 0.22 + R() * 0.18 });
  for (let i = 0; i < 9; i++) D.kelp.push({ x: -6 + R() * (WW + 12), h: 6 + R() * 10, ph: R() * 6, w: 0.3 + R() * 0.2 });
  for (let i = 0; i < 4; i++) D.schools.push({ y: 5 + R() * (WH - 14), x0: R() * 60, v: (R() < 0.5 ? -1 : 1) * (0.5 + R() * 0.7), n: 6 + Math.floor(R() * 8), seed: R() * 100 });
  for (let i = 0; i < 3; i++) D.vents.push({ x: 2 + R() * (WW - 4) });
  D.snow = Array.from({ length: 70 }, () => ({ x: R() * WW, y: R() * WH, s: 0.02 + R() * 0.04, v: 0.08 + R() * 0.2, ph: R() * 6 }));
  return D;
}

export function updateParts(P, dt) {
  for (let i = P.length - 1; i >= 0; i--) { const q = P[i]; q.life -= dt; if (q.life <= 0) { P.splice(i, 1); continue; } q.x += q.vx * dt; q.y += q.vy * dt; if (q.k === 'bub') { q.vy -= dt * 0.6; q.vx += Math.sin(q.life * 9 + q.ph) * dt * 0.4; } else if (q.k === 'txt') q.vy *= 0.96; else { q.vx *= 0.94; q.vy *= 0.94; } }
}
export function bubbles(P, x, y, n, sz) { for (let i = 0; i < n; i++) P.push({ k: 'bub', x: x + (Math.random() - 0.5) * 0.5, y: y + (Math.random() - 0.5) * 0.4, vx: (Math.random() - 0.5) * 0.6, vy: -0.6 - Math.random() * 0.8, life: 1.2 + Math.random() * 0.8, max: 2, r: (sz || 0.08) * (0.6 + Math.random() * 0.9), ph: Math.random() * 6 }); }
export function floatText(P, x, y, text, col) { P.push({ k: 'txt', x, y, vx: 0, vy: -1.4, life: 1.1, max: 1.1, text, col: col || '#FFFFFF' }); }
export function burst(P, x, y, col, n) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = 1 + Math.random() * 2.5; P.push({ k: 'dot', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.6 + Math.random() * 0.4, max: 1, r: 0.05 + Math.random() * 0.06, col }); } }

function ridgeAt(D, x) {
  const R = D.ridge;
  for (let i = 1; i < R.length; i++) if (R[i][0] >= x) { const a = R[i - 1], b = R[i], k = (x - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * k; }
  return 1.5;
}
function strand(c, X, Y, S, k, x, base, h, w, ph, t, col, leaf) {
  const seg = 9;
  let px = X(x), py = Y(base);
  c.strokeStyle = col; c.fillStyle = col; c.lineCap = 'round'; c.lineJoin = 'round';
  for (let i = 1; i <= seg; i++) {
    const f = i / seg;
    const sw = Math.sin(t * 0.8 + ph + f * 2.2) * f * 0.9 + Math.sin(t * 0.37 + ph * 2) * f * 0.5;
    const nx = X(x + sw), ny = Y(base - h * f);
    c.lineWidth = Math.max(1, w * S * (1.15 - f * 0.6));
    c.beginPath(); c.moveTo(px, py); c.lineTo(nx, ny); c.stroke();
    if (leaf && i < seg) { const side = i % 2 ? 1 : -1; c.beginPath(); c.ellipse(nx + side * w * S * 1.4, ny + w * S * 0.4, w * S * 1.6, w * S * 0.55, side * 0.6, 0, TAU); c.fill(); }
    px = nx; py = ny;
  }
}
function drawBackdrop(c, V, D, t) {
  const { cw, ch, s, ox, oy } = V;
  const top = oy, bot = oy + WH * s;
  const g = c.createLinearGradient(0, top, 0, bot);
  g.addColorStop(0, '#2A8FCB'); g.addColorStop(0.18, '#1C6FA8'); g.addColorStop(0.55, '#0F4C7E'); g.addColorStop(1, '#082A4C');
  c.fillStyle = g; c.fillRect(0, 0, cw, ch);
  const cx = (cw / 2 - ox) / s, cy = (ch / 2 - oy) / s;
  const layer = (k) => ({ X: (wx) => cw / 2 + (wx - cx) * s * k, Y: (wy) => ch / 2 + (wy - cy) * s * k, S: s * k });
  const A = layer(0.42);
  for (const b of D.bg) { const base = FLOOR + 3 - ridgeAt(D, b.x); strand(c, A.X, A.Y, A.S, 0.42, b.x, base, b.h, b.w * 2.2, b.ph, t, 'rgba(10,52,84,0.55)', true); }
  c.fillStyle = 'rgba(7,38,66,0.85)';
  c.beginPath(); c.moveTo(A.X(-30), A.Y(WH + 30));
  for (const pt of D.ridge) c.lineTo(A.X(pt[0]), A.Y(FLOOR + 3 - pt[1]));
  c.lineTo(A.X(WW + 30), A.Y(WH + 30)); c.closePath(); c.fill();
  const B = layer(0.6);
  c.fillStyle = 'rgba(8,46,78,0.7)';
  for (const sc of D.schools) {
    const span = WW + 50;
    const hx = ((sc.x0 + sc.v * t) % span + span) % span - 25;
    for (let i = 0; i < sc.n; i++) {
      const ox2 = Math.sin(sc.seed + i * 1.7) * 2.2 - (sc.v > 0 ? 1 : -1) * (i % 4) * 0.7, oy2 = Math.cos(sc.seed * 1.3 + i * 2.3) * 1.1 + Math.sin(t * 1.3 + i) * 0.12;
      const x = B.X(hx + ox2), y = B.Y(sc.y + oy2), r = 0.16 * B.S;
      if (x < -20 || x > cw + 20 || y < -20 || y > ch + 20) continue;
      const d = sc.v > 0 ? 1 : -1;
      c.beginPath(); c.ellipse(x, y, r * 1.6, r * 0.7, 0, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(x - d * r * 1.3, y); c.lineTo(x - d * r * 2.4, y - r * 0.7); c.lineTo(x - d * r * 2.4, y + r * 0.7); c.closePath(); c.fill();
    }
  }
  const K = layer(0.72);
  for (const kp of D.kelp) strand(c, K.X, K.Y, K.S, 0.72, kp.x, FLOOR + 1.2, kp.h, kp.w, kp.ph, t, 'rgba(14,74,86,0.55)', true);
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 6; i++) {
    const bx = ox + (i * 5.2 + Math.sin(t * 0.25 + i) * 1.2) * s, w = (1.4 + (i % 3) * 0.8) * s;
    const lg = c.createLinearGradient(0, top, 0, top + 22 * s); lg.addColorStop(0, 'rgba(190,235,255,0.16)'); lg.addColorStop(1, 'rgba(190,235,255,0)');
    c.fillStyle = lg; c.beginPath(); c.moveTo(bx, top); c.lineTo(bx + w, top); c.lineTo(bx + w + 6 * s, top + 22 * s); c.lineTo(bx + 6 * s - w * 0.4, top + 22 * s); c.closePath(); c.fill();
  }
  c.restore();
  if (top > -20) { c.fillStyle = 'rgba(220,245,255,0.28)'; for (let i = 0; i < 40; i++) { const x = ox + (i / 40) * WW * s, w = (WW / 40) * s; c.fillRect(x, top + Math.sin(t * 2 + i * 0.7) * 3, w, 2); } }
}
function drawFloor(c, V, D, t) {
  const { s, ox, oy, cw } = V;
  const fy = oy + FLOOR * s;
  for (const w of D.weeds) {
    const x = ox + w.x * s; if (x < -60 || x > cw + 60) continue;
    c.strokeStyle = w.c; c.lineWidth = Math.max(2, s * 0.12); c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, fy + s * 0.3);
    const seg = 6;
    for (let i = 1; i <= seg; i++) { const k = i / seg; const sw = Math.sin(t * 1.4 + w.ph + k * 2.5) * k * s * 0.35; c.lineTo(x + sw, fy + s * 0.3 - w.h * s * k); }
    c.stroke();
  }
  for (const r of D.rocks) { const x = ox + r.x * s; c.fillStyle = r.c; c.beginPath(); c.ellipse(x, fy + s * 0.25, r.w * s * 0.5, r.h * s * 0.5, 0, Math.PI, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,0.08)'; c.beginPath(); c.ellipse(x - r.w * s * 0.15, fy + s * 0.25 - r.h * s * 0.32, r.w * s * 0.2, r.h * s * 0.1, 0, 0, TAU); c.fill(); }
  const sg = c.createLinearGradient(0, fy, 0, fy + 2 * s); sg.addColorStop(0, '#D8C394'); sg.addColorStop(1, '#A08B62');
  c.fillStyle = sg; c.beginPath(); c.moveTo(ox, fy + s * 0.2);
  for (let i = 0; i <= 26; i++) c.lineTo(ox + (i / 26) * WW * s, fy + s * 0.2 + Math.sin(i * 1.7) * s * 0.12);
  c.lineTo(ox + WW * s, fy + 3 * s); c.lineTo(ox, fy + 3 * s); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(120,96,60,0.35)'; c.lineWidth = Math.max(1, s * 0.04);
  for (let i = 0; i < 9; i++) { const yy = fy + s * (0.6 + i * 0.22); c.beginPath(); for (let k = 0; k <= 30; k++) { const xx = ox + (k / 30) * WW * s; const y2 = yy + Math.sin(k * 0.9 + i) * s * 0.05; if (k) c.lineTo(xx, y2); else c.moveTo(xx, y2); } c.stroke(); }
  for (const co of D.corals) {
    const x = ox + co.x * s, base = fy + s * 0.3; if (x < -60 || x > cw + 60) continue;
    c.strokeStyle = co.c; c.lineCap = 'round';
    const br = (x0, y0, ang, len, w, d) => { if (d > 3) return; const x1 = x0 + Math.cos(ang) * len, y1 = y0 + Math.sin(ang) * len; c.lineWidth = w; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); br(x1, y1, ang - 0.45, len * 0.72, w * 0.72, d + 1); br(x1, y1, ang + 0.4, len * 0.68, w * 0.72, d + 1); };
    if (co.k === 0) br(x, base, -Math.PI / 2, co.s * s * 0.7, Math.max(2, co.s * s * 0.2), 0);
    else if (co.k === 1) { c.fillStyle = co.c; for (let i = 0; i < 5; i++) { c.beginPath(); c.ellipse(x + (i - 2) * co.s * s * 0.22, base - co.s * s * (0.3 + (i % 2) * 0.25), co.s * s * 0.16, co.s * s * 0.3, 0, 0, TAU); c.fill(); } }
    else { c.fillStyle = co.c; c.beginPath(); c.ellipse(x, base - co.s * s * 0.35, co.s * s * 0.55, co.s * s * 0.38, 0, Math.PI, TAU); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.18)'; c.lineWidth = 1.5; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(x, base, co.s * s * (0.15 + i * 0.1), Math.PI * 1.1, Math.PI * 1.9); c.stroke(); } }
  }
  for (const sh of D.shells) { const x = ox + sh.x * s, y = fy + s * 0.75; c.save(); c.translate(x, y); c.rotate(sh.r); c.fillStyle = sh.c; if (sh.k === 0) { c.beginPath(); c.moveTo(0, -s * 0.16); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5; const rr2 = i % 2 ? s * 0.07 : s * 0.17; c.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); } c.closePath(); c.fill(); } else { c.beginPath(); c.arc(0, 0, s * 0.14, Math.PI, TAU); c.closePath(); c.fill(); } c.restore(); }
}
function drawPickup(c, x, y, s, k, t) {
  const bob = Math.sin(t * 3 + x) * s * 0.08, R = s * 0.42;
  c.save(); c.translate(x, y + bob);
  const g = c.createRadialGradient(-R * 0.3, -R * 0.3, R * 0.1, 0, 0, R);
  g.addColorStop(0, 'rgba(255,255,255,0.75)'); g.addColorStop(0.6, 'rgba(160,220,255,0.28)'); g.addColorStop(1, 'rgba(200,240,255,0.55)');
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, R, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = Math.max(1.5, s * 0.04); c.stroke();
  const col = { shield: '#7FD4FF', double: '#FFD23F', magnet: '#FF6B8A', speed: '#9BFF7A' }[k];
  c.fillStyle = col; c.strokeStyle = col; c.lineWidth = Math.max(2, s * 0.07); c.lineCap = 'round'; c.lineJoin = 'round';
  if (k === 'shield') { c.beginPath(); c.moveTo(0, -R * 0.5); c.lineTo(R * 0.42, -R * 0.32); c.lineTo(R * 0.36, R * 0.15); c.lineTo(0, R * 0.52); c.lineTo(-R * 0.36, R * 0.15); c.lineTo(-R * 0.42, -R * 0.32); c.closePath(); c.fill(); }
  else if (k === 'double') { c.font = `900 ${R * 0.85}px ${FF}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('x2', 0, R * 0.04); }
  else if (k === 'magnet') { c.beginPath(); c.arc(0, -R * 0.02, R * 0.32, Math.PI, TAU); c.stroke(); c.beginPath(); c.moveTo(-R * 0.32, -R * 0.02); c.lineTo(-R * 0.32, R * 0.3); c.moveTo(R * 0.32, -R * 0.02); c.lineTo(R * 0.32, R * 0.3); c.stroke(); }
  else { c.beginPath(); c.moveTo(R * 0.1, -R * 0.5); c.lineTo(-R * 0.25, R * 0.06); c.lineTo(R * 0.02, R * 0.06); c.lineTo(-R * 0.1, R * 0.5); c.lineTo(R * 0.25, -R * 0.06); c.lineTo(-R * 0.02, -R * 0.06); c.closePath(); c.fill(); }
  c.restore();
}
function nameTag(c, x, y, text, col) {
  c.save(); c.font = `800 12px ${FF}`;
  const w = c.measureText(text).width + 14;
  c.fillStyle = 'rgba(6,16,30,0.62)'; rr(c, x - w / 2, y - 18, w, 18, 9); c.fill();
  c.fillStyle = col; c.textBaseline = 'middle'; c.textAlign = 'center'; c.fillText(text, x, y - 8.6);
  c.restore();
}
function drawBubbleText(c, x, y, text, a, cw) {
  c.save(); c.globalAlpha = a;
  c.font = `600 13px ${FF}`;
  const tw = Math.min(170, c.measureText(text).width), bw = tw + 22, bh = 30;
  const bx = Math.max(8, Math.min(cw - bw - 8, x - bw / 2)), by = y - bh - 8;
  c.fillStyle = '#FFFFFF'; rr(c, bx, by, bw, bh, 13); c.fill();
  c.beginPath(); c.moveTo(x - 7, by + bh - 1); c.lineTo(x, by + bh + 7); c.lineTo(x + 7, by + bh - 1); c.fill();
  c.fillStyle = '#10202E'; c.textBaseline = 'middle'; c.fillText(text, bx + 11, by + bh / 2, 170);
  c.restore();
}

export function render(ctx, G, V) {
  const { cw, ch, dpr, s, ox, oy, mine, names, bubbles: bb, parts, hidden } = V;
  const c = ctx, t = G.t;
  const me = G.pl[mine];
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawBackdrop(c, V, G.deco, t);
  c.save(); c.globalCompositeOperation = 'lighter';
  for (const sn of G.deco.snow) { const yy = (sn.y + t * sn.v) % WH, x = ox + (sn.x + Math.sin(t * 0.5 + sn.ph) * 0.3) * s, y = oy + yy * s; if (x < -4 || y < -4 || x > cw + 4 || y > ch + 4) continue; c.fillStyle = 'rgba(200,230,255,0.25)'; c.beginPath(); c.arc(x, y, sn.s * s, 0, TAU); c.fill(); }
  c.restore();
  drawFloor(c, V, G.deco, t);
  for (const v of G.deco.vents) if (Math.random() < 0.05) bubbles(parts, v.x, FLOOR - 0.2, 1, 0.07);
  for (const pk of G.pk) { const x = ox + pk.x * s, y = oy + pk.y * s; if (x < -60 || y < -60 || x > cw + 60 || y > ch + 60) continue; drawPickup(c, x, y, s, pk.k, t); }
  const list = [];
  for (const f of G.fish) { if (hidden && hidden.has(f.id)) continue; list.push({ k: 'f', f, r: rOf(f.n) }); }
  for (const kk of ['sun', 'moon']) { const p = G.pl[kk]; if (p.dead > 0 && p.dead < 1.3) continue; list.push({ k: 'p', p, r: rOf(p.n) }); }
  list.sort((a, b) => a.r - b.r);
  for (const it of list) {
    if (it.k === 'f') {
      const f = it.f, x = ox + f.x * s, y = oy + f.y * s, r = it.r * s;
      if (x < -r * 3 || y < -r * 3 || x > cw + r * 3 || y > ch + r * 3) continue;
      const edible = me.dead <= 0 && f.n <= me.n;
      const danger = f.n > me.n;
      const pal = f.k === 'h' ? HUNT : PREY[f.sp % PREY.length];
      const dm = me.dead <= 0 ? Math.hypot(me.x - f.x, me.y - f.y) : 99;
      drawFish(c, x, y, r, f.a, { pal, t, ph: f.id, num: f.n, numCol: edible ? '#C8FFB0' : danger ? '#FF9A9A' : '#FFFFFF', mouth: f.k === 'h' && f.chase ? 0.8 + Math.sin(t * 12) * 0.2 : 0, teeth: f.k === 'h', angry: f.k === 'h', fast: f.k === 'h' && f.chase });
      if (f.k === 'h' && f.chase) { c.save(); c.font = `900 ${Math.max(14, r * 0.7)}px ${FF}`; c.textAlign = 'center'; c.fillStyle = '#FF5A5A'; c.strokeStyle = 'rgba(0,0,0,0.6)'; c.lineWidth = 3; c.strokeText('!', x, y - r * 1.5); c.fillText('!', x, y - r * 1.5); c.restore(); }
      else if (f.k === 'h' && danger && dm < 7) { c.save(); c.globalAlpha = 0.35; c.strokeStyle = '#FF5A5A'; c.lineWidth = 2; c.setLineDash([5, 5]); c.beginPath(); c.arc(x, y, r * 1.35, 0, TAU); c.stroke(); c.restore(); }
    } else {
      const p = it.p, x = ox + p.x * s, y = oy + p.y * s, r = it.r * s;
      const pal = PLAYER[p.kind];
      const blink = p.prot > 0 && Math.floor(t * 10) % 2 === 0;
      c.save(); if (blink) c.globalAlpha = 0.55;
      if (p.dead > 0) { c.globalAlpha = Math.max(0, (p.dead - 1.3) / 0.4); }
      c.save(); c.globalCompositeOperation = 'lighter'; const gl = c.createRadialGradient(x, y, r * 0.6, x, y, r * 1.7); gl.addColorStop(0, `${pal.ring}55`); gl.addColorStop(1, `${pal.ring}00`); c.fillStyle = gl; c.beginPath(); c.arc(x, y, r * 1.7, 0, TAU); c.fill(); c.restore();
      if (p.fx.speed > 0 || p.dashT > 0) { c.strokeStyle = 'rgba(220,250,255,0.55)'; c.lineWidth = 2; c.lineCap = 'round'; for (let i = 0; i < 4; i++) { const off = (i - 1.5) * r * 0.35; const bx = x - Math.cos(p.a) * r * 1.3 - Math.sin(p.a) * off, by = y - Math.sin(p.a) * r * 1.3 + Math.cos(p.a) * off; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx - Math.cos(p.a) * r * 0.9, by - Math.sin(p.a) * r * 0.9); c.stroke(); } }
      const near = G.fish.some((f) => f.n <= p.n && Math.hypot(f.x - p.x - Math.cos(p.a) * rOf(p.n), f.y - p.y - Math.sin(p.a) * rOf(p.n)) < rOf(p.n) * 1.4 + rOf(f.n));
      drawFish(c, x, y, r, p.a, { pal, t, ph: p.kind === 'sun' ? 1 : 3, num: p.n, numCol: '#FFFFFF', mouth: p.eat > 0 ? 1 : near ? 0.55 : 0, fast: p.dashT > 0 });
      c.restore();
      if (p.fx.shield > 0) { c.save(); c.strokeStyle = 'rgba(140,220,255,0.85)'; c.lineWidth = Math.max(2, s * 0.06); c.beginPath(); c.arc(x, y, r * 1.45 + Math.sin(t * 6) * 2, 0, TAU); c.stroke(); c.fillStyle = 'rgba(140,220,255,0.12)'; c.fill(); c.restore(); }
      if (p.fx.magnet > 0) { c.save(); c.strokeStyle = 'rgba(255,120,150,0.5)'; c.lineWidth = 2; c.setLineDash([6, 6]); c.lineDashOffset = -t * 30; c.beginPath(); c.arc(x, y, r * 2.2, 0, TAU); c.stroke(); c.restore(); }
      if (p.fx.double > 0) { c.save(); c.font = `900 ${Math.max(12, r * 0.5)}px ${FF}`; c.fillStyle = '#FFD23F'; c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 3; c.textAlign = 'center'; c.strokeText('x2', x + r * 1.1, y - r * 1.05); c.fillText('x2', x + r * 1.1, y - r * 1.05); c.restore(); }
      if (p.dead <= 0) nameTag(c, x, y - r * 1.25, names[p.kind], pal.ring);
      const b = bb[p.kind];
      if (b && p.dead <= 0) {
        const k = b.t / b.life;
        if (b.emo) { c.save(); c.globalAlpha = k > 0.85 ? (1 - k) / 0.15 : 1; c.font = `34px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",${FF}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(b.text, x, y - r * 1.25 - 30 - k * 24); c.restore(); }
        else { const a = Math.min(1, b.t / 0.15, (b.life - b.t) / 0.3); if (a > 0) drawBubbleText(c, x, y - r * 1.25 - 22, b.text, Math.max(0, a), cw); }
      }
    }
  }
  for (const q of parts) {
    const x = ox + q.x * s, y = oy + q.y * s;
    if (q.k === 'bub') { c.strokeStyle = `rgba(220,245,255,${Math.min(0.8, q.life)})`; c.lineWidth = 1.2; c.beginPath(); c.arc(x, y, q.r * s, 0, TAU); c.stroke(); c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.arc(x - q.r * s * 0.35, y - q.r * s * 0.35, q.r * s * 0.25, 0, TAU); c.fill(); }
    else if (q.k === 'txt') { c.save(); c.globalAlpha = Math.min(1, q.life / 0.4); c.font = `900 18px ${FF}`; c.textAlign = 'center'; c.lineWidth = 4; c.strokeStyle = 'rgba(0,20,40,0.7)'; c.strokeText(q.text, x, y); c.fillStyle = q.col; c.fillText(q.text, x, y); c.restore(); }
    else { c.globalAlpha = Math.min(1, q.life / q.max * 1.5); c.fillStyle = q.col; c.beginPath(); c.arc(x, y, q.r * s, 0, TAU); c.fill(); c.globalAlpha = 1; }
  }
  const vg = c.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.35, cw / 2, ch / 2, Math.max(cw, ch) * 0.75);
  vg.addColorStop(0, 'rgba(0,10,25,0)'); vg.addColorStop(1, 'rgba(0,10,25,0.45)');
  c.fillStyle = vg; c.fillRect(0, 0, cw, ch);
  const o = G.pl[mine === 'sun' ? 'moon' : 'sun'];
  if (o.dead <= 0) {
    const bx = ox + o.x * s, by = oy + o.y * s, m = 30, top = V.safeTop || 120, bot = ch - (V.safeBottom || 190);
    if (bx < m || bx > cw - m || by < top || by > bot) {
      const ix = Math.max(m, Math.min(cw - m, bx)), iy = Math.max(top, Math.min(bot, by)), ang = Math.atan2(by - iy, bx - ix);
      const pal = PLAYER[o.kind];
      c.save(); c.translate(ix, iy);
      c.fillStyle = 'rgba(6,16,30,0.72)'; c.beginPath(); c.arc(0, 0, 18, 0, TAU); c.fill();
      c.fillStyle = pal.b; c.beginPath(); c.arc(0, 0, 14, 0, TAU); c.fill();
      c.font = `900 ${o.n >= 100 ? 9 : 11}px ${FF}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#FFFFFF'; c.fillText(String(o.n), 0, 0.5);
      c.rotate(ang); c.fillStyle = pal.ring; c.beginPath(); c.moveTo(26, 0); c.lineTo(19, -6); c.lineTo(19, 6); c.closePath(); c.fill();
      c.restore();
    }
  }
}
