import { TAU, LIGHT_R, clamp, mulberry, at as atW, alive, dist, litAt, isWallCh, onTile, spikeAmt, spikeWarn, spikeOff, crumbleState, isPad, SPIKE_P, TDOOR_T } from './duoengine.js';

let CW = null;
const at = (x, y) => atW(CW, x, y);
const WALLISH = { has: (ch) => isWallCh(ch) };
const isWall = (x, y) => isWallCh(at(x, y));
const FF = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

const SCALES = {
  sand: { s: [146.8, 155.6, 185, 196, 220, 233.1, 277.2, 293.7], pat: [0, -1, 4, -1, 2, 5, -1, 3, 0, -1, 4, 6, 5, -1, 2, -1], roots: [73.4, 77.8, 73.4, 65.4], tempo: 0.32 },
  jungle: { s: [196, 220, 246.9, 293.7, 329.6, 392, 440, 493.9], pat: [0, 2, -1, 4, -1, 3, 5, -1, 4, -1, 2, -1, 6, -1, 3, -1], roots: [98, 110, 82.4, 98], tempo: 0.3 },
  ice: { s: [261.6, 293.7, 329.6, 370, 392, 440, 493.9, 523.3], pat: [7, -1, 4, -1, 2, -1, 5, -1, 6, -1, 3, -1, 4, -1, 1, -1], roots: [130.8, 110, 98, 123.5], tempo: 0.38 },
  forge: { s: [110, 123.5, 130.8, 146.8, 164.8, 174.6, 196, 220], pat: [0, 0, -1, 3, -1, 2, -1, 0, 5, -1, 4, -1, 2, 1, -1, -1], roots: [55, 55, 49, 58.3], tempo: 0.28 },
  crystal: { s: [233.1, 261.6, 293.7, 329.6, 370, 415.3, 466.2, 523.3], pat: [0, -1, 3, -1, 5, -1, 2, 6, -1, 4, -1, 1, -1, 7, -1, -1], roots: [116.5, 104, 92.5, 123.5], tempo: 0.36 },
};

export const Snd = (() => {
  let ac = null, out = null, mus = null, nbuf = null, timer = null, next = 0, step = 0, sc = SCALES.sand;
  const st = { sfx: true, music: true };
  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try { ac = new AC(); } catch { ac = null; return; }
    out = ac.createGain(); out.gain.value = 0.85; out.connect(ac.destination);
    mus = ac.createGain(); mus.gain.value = 0; mus.connect(out);
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
    step() { noise(0.045, 0.03, 600 + Math.random() * 500); },
    gem() { tone(988, 0.12, 'triangle', 0.11); tone(1480, 0.26, 'sine', 0.09, 0.08); tone(1976, 0.3, 'sine', 0.04, 0.16); },
    plate() { tone(150, 0.14, 'triangle', 0.16); noise(0.08, 0.06, 500); },
    gate() { noise(0.6, 0.08, 260); tone(64, 0.5, 'sawtooth', 0.025); },
    seal() { tone(520, 0.32, 'sine', 0.05, 0, 900); },
    door() { noise(1.2, 0.11, 220); tone(659, 0.5, 'sine', 0.06, 0.55); tone(988, 0.7, 'sine', 0.05, 0.72); },
    fire() { noise(0.5, 0.12, 1300, 'bandpass'); tone(110, 0.35, 'sine', 0.07); },
    fizz() { noise(0.35, 0.06, 3000, 'highpass'); },
    hurt() { tone(260, 0.26, 'square', 0.05, 0, 90); },
    pop() { tone(660, 0.07, 'sine', 0.06, 0, 990); },
    click() { tone(1500, 0.03, 'square', 0.025); },
    bad() { tone(220, 0.12, 'square', 0.045); tone(170, 0.2, 'square', 0.045, 0.1); },
    win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.35, 'triangle', 0.09, i * 0.11)); tone(1319, 0.8, 'sine', 0.06, 0.5); },
    lever() { tone(180, 0.08, 'square', 0.05); noise(0.12, 0.07, 900); tone(320, 0.15, 'triangle', 0.06, 0.08); },
    burn() { noise(0.9, 0.12, 1800, 'bandpass'); tone(90, 0.6, 'sawtooth', 0.025); },
    key() { [880, 1175, 1568].forEach((f, i) => tone(f, 0.25, 'triangle', 0.07, i * 0.07)); },
    chest() { noise(0.4, 0.08, 600); [523, 784, 1047, 1568].forEach((f, i) => tone(f, 0.5, 'sine', 0.07, 0.15 + i * 0.09)); },
    sizzle() { noise(0.7, 0.13, 3200, 'highpass'); tone(200, 0.4, 'sawtooth', 0.03, 0, 80); },
    splash() { noise(0.6, 0.12, 700); tone(500, 0.2, 'sine', 0.05, 0.05, 1200); },
    goo() { tone(140, 0.4, 'sine', 0.08, 0, 70); noise(0.4, 0.06, 400); },
    fall() { tone(600, 0.7, 'sine', 0.07, 0, 90); },
    heart() { tone(330, 0.12, 'triangle', 0.06); tone(247, 0.25, 'triangle', 0.06, 0.12); },
    flag() { tone(784, 0.12, 'sine', 0.05); tone(1047, 0.2, 'sine', 0.04, 0.08); },
    spike() { noise(0.12, 0.08, 2600, 'highpass'); tone(820, 0.06, 'square', 0.03); },
    stab() { noise(0.25, 0.12, 1800, 'bandpass'); tone(300, 0.3, 'sawtooth', 0.05, 0, 110); },
    crack() { noise(0.18, 0.09, 900, 'bandpass'); tone(90, 0.2, 'triangle', 0.06); },
    crumble() { noise(0.7, 0.12, 380); tone(70, 0.5, 'sine', 0.06, 0.05, 40); },
    tp() { tone(440, 0.22, 'sine', 0.07, 0, 1320); tone(880, 0.3, 'triangle', 0.04, 0.08, 1760); noise(0.25, 0.04, 4000, 'highpass'); },
    tick() { tone(1700, 0.025, 'square', 0.02); },
    clock() { tone(523, 0.1, 'triangle', 0.07); tone(784, 0.18, 'triangle', 0.06, 0.09); },
    slide() { noise(0.25, 0.03, 5000, 'highpass'); },
    emote() { tone(880, 0.08, 'sine', 0.06, 0, 1320); tone(1320, 0.12, 'sine', 0.04, 0.06); },
  };
  function pluck(f, t) { const o = ac.createOscillator(), g = ac.createGain(), fl = ac.createBiquadFilter(); o.type = 'triangle'; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.value = 1600; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.07, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1); o.connect(fl); fl.connect(g); g.connect(mus); o.start(t); o.stop(t + 1.2); }
  function pad(t, s) { const r = sc.roots[(s / 16 | 0) % sc.roots.length]; [1, 1.5, 2].forEach((m, i) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.value = r * m; o.detune.value = (i - 1) * 5; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.03 / (i + 1), t + 1.3); g.gain.exponentialRampToValueAtTime(0.0001, t + 5.4); o.connect(g); g.connect(mus); o.start(t); o.stop(t + 5.5); }); }
  function tick() { if (!ac) return; if (next < ac.currentTime) next = ac.currentTime + 0.05; while (next < ac.currentTime + 0.35) { const s = step++; const n = sc.pat[s % 16]; if (n >= 0) pluck(sc.s[n], next); if (s % 16 === 0) pad(next, s); next += sc.tempo; } }
  function music(on, theme) { st.music = on; if (theme && SCALES[theme]) sc = SCALES[theme]; if (!ac) return; mus.gain.cancelScheduledValues(ac.currentTime); mus.gain.setTargetAtTime(on ? 1 : 0, ac.currentTime, 0.4); if (on && !timer) timer = setInterval(tick, 120); if (!on && timer) { clearInterval(timer); timer = null; } }
  return { init, fx, music, st };
})();

function rr(c, x, y, w, h, r) { r = Math.max(0, Math.min(r, w / 2, h / 2)); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function rgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function shade(h, k) { const [r, g, b] = rgb(h); const f = (v) => Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k)); return `rgb(${f(r)},${f(g)},${f(b)})`; }
function rgba(h, a) { const [r, g, b] = rgb(h); return `rgba(${r},${g},${b},${a})`; }

function glyph(c, kind, x, y, s, col, lw) {
  c.save(); c.translate(x, y); c.strokeStyle = col; c.fillStyle = col; c.lineWidth = lw || s * 0.12; c.lineCap = 'round'; c.lineJoin = 'round';
  const r = s * 0.5;
  if (kind === 'sun') { c.beginPath(); c.arc(0, 0, r * 0.4, 0, TAU); c.stroke(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; c.beginPath(); c.moveTo(Math.cos(a) * r * 0.66, Math.sin(a) * r * 0.66); c.lineTo(Math.cos(a) * r * 0.94, Math.sin(a) * r * 0.94); c.stroke(); } }
  else if (kind === 'moon') { c.beginPath(); c.arc(0, 0, r * 0.84, Math.PI * 0.32, Math.PI * 1.68, false); c.arc(r * 0.36, 0, r * 0.62, Math.PI * 1.47, Math.PI * 0.53, true); c.closePath(); c.fill(); }
  else if (kind === 'leaf') { c.beginPath(); c.moveTo(-r * 0.72, r * 0.72); c.quadraticCurveTo(-r * 0.78, -r * 0.62, r * 0.78, -r * 0.78); c.quadraticCurveTo(r * 0.62, r * 0.78, -r * 0.72, r * 0.72); c.stroke(); c.beginPath(); c.moveTo(-r * 0.72, r * 0.72); c.lineTo(r * 0.3, -r * 0.3); c.stroke(); }
  else if (kind === 'wave') { for (const oy of [-0.3, 0.32]) { c.beginPath(); for (let i = 0; i <= 14; i++) { const px = -r * 0.86 + (i / 14) * r * 1.72; const py = oy * r + Math.sin(i / 14 * TAU) * r * 0.2; if (i) c.lineTo(px, py); else c.moveTo(px, py); } c.stroke(); } }
  else if (kind === 'star') { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5; const q = i % 2 ? r * 0.4 : r * 0.92; c.lineTo(Math.cos(a) * q, Math.sin(a) * q); } c.closePath(); c.stroke(); }
  else if (kind === 'tri') { c.beginPath(); c.moveTo(0, -r * 0.66); c.lineTo(r * 0.7, r * 0.56); c.lineTo(-r * 0.7, r * 0.56); c.closePath(); c.stroke(); }
  else if (kind === 'dia') { c.beginPath(); c.moveTo(0, -r * 0.74); c.lineTo(r * 0.58, 0); c.lineTo(0, r * 0.74); c.lineTo(-r * 0.58, 0); c.closePath(); c.stroke(); }
  c.restore();
}

function teardrop(c, x, y, w, h, lean) { c.beginPath(); c.moveTo(x + lean, y - h); c.bezierCurveTo(x + w * 0.95 + lean * 0.4, y - h * 0.48, x + w, y - h * 0.06, x, y); c.bezierCurveTo(x - w, y - h * 0.06, x - w * 0.95 + lean * 0.4, y - h * 0.48, x + lean, y - h); c.fill(); }

function flame(c, x, y, s, cols, t, seed) {
  const f = 1 + Math.sin(t * 17 + seed) * 0.08 + Math.sin(t * 29 + seed * 1.7) * 0.05;
  const lean = Math.sin(t * 6 + seed) * s * 0.035, h = s * f, w = s * 0.42;
  c.fillStyle = cols[2]; teardrop(c, x, y, w, h, lean);
  c.fillStyle = cols[1]; teardrop(c, x, y, w * 0.7, h * 0.74, lean * 0.8);
  c.fillStyle = cols[0]; teardrop(c, x, y, w * 0.38, h * 0.44, lean * 0.6);
}

const LOOK = {
  sun: { skin: '#F2C38F', skinS: '#D79F6C', shirt: '#E59238', shirtS: '#BC6F22', pants: '#5C4733', boot: '#36281C', hat: '#DCC28E', hatS: '#B39460', band: '#7A4E2A', pack: '#8E6C44', packS: '#6C5132', hair: '#6B4426', flame: ['#FFF4C8', '#FFC24A', '#FF7A1A'], light: '#FFA24A' },
  moon: { skin: '#C78A5D', skinS: '#A46A43', shirt: '#3E7FD6', shirtS: '#2B5EAB', pants: '#2A354F', boot: '#1B2134', hat: '#24447F', hatS: '#1B3566', band: '#3F6EC4', pack: '#5E6C80', packS: '#46536A', hair: '#2A1C14', flame: ['#EAF7FF', '#8CCBFF', '#3B7BFF'], light: '#6FA8FF' },
};


function drawExplorer(c, x, y, s, o) {
  const P = LOOK[o.kind], t = o.t || 0;
  const bob = o.moving ? Math.abs(Math.sin(o.phase)) * 0.035 * s : Math.sin(t * 2.2) * 0.006 * s;
  const stp = o.moving ? Math.sin(o.phase) : 0;
  const dir = o.dir || 'down', side = dir === 'left' ? -1 : dir === 'right' ? 1 : 0, back = dir === 'up';
  c.save(); c.translate(x, y);
  c.globalAlpha = o.alpha == null ? 1 : o.alpha;
  c.fillStyle = 'rgba(0,0,0,0.34)'; c.beginPath(); c.ellipse(0, 0, 0.26 * s, 0.085 * s, 0, 0, TAU); c.fill();
  c.translate(0, -bob);
  const leg = (lx, ly) => { c.fillStyle = P.pants; rr(c, lx - 0.05 * s, -0.25 * s + ly, 0.1 * s, 0.2 * s, 0.04 * s); c.fill(); c.fillStyle = P.boot; rr(c, lx - 0.056 * s, -0.08 * s + ly, 0.112 * s, 0.075 * s, 0.03 * s); c.fill(); };
  if (side) { leg(-0.03 * s + stp * 0.05 * s * side, 0); leg(0.03 * s - stp * 0.05 * s * side, 0); }
  else { leg(-0.075 * s, stp > 0 ? -0.03 * s * stp : 0); leg(0.075 * s, stp < 0 ? 0.03 * s * stp : 0); }
  const bw = side ? 0.27 * s : 0.34 * s;
  const torchSide = side || 1;
  const hx = side ? side * 0.2 * s : (back ? -0.21 * s : 0.21 * s), hy = -0.43 * s;
  const torchBehind = back;
  const drawTorch = () => {
    const tx = hx + (side ? side * 0.03 * s : (back ? -0.02 : 0.02) * s), ty = hy - 0.25 * s;
    c.strokeStyle = '#6B4A2B'; c.lineWidth = 0.05 * s; c.lineCap = 'round'; c.beginPath(); c.moveTo(hx, hy + 0.04 * s); c.lineTo(tx, ty); c.stroke();
    c.strokeStyle = '#3C2A18'; c.lineWidth = 0.07 * s; c.beginPath(); c.moveTo(tx - (tx - hx) * 0.12, ty + 0.035 * s); c.lineTo(tx, ty); c.stroke();
    flame(c, tx, ty + 0.01 * s, 0.24 * s, P.flame, t, o.kind === 'sun' ? 1 : 4);
  };
  if (torchBehind) drawTorch();
  if (side) { c.fillStyle = P.pack; rr(c, side > 0 ? -0.24 * s : 0.11 * s, -0.53 * s, 0.13 * s, 0.27 * s, 0.05 * s); c.fill(); c.fillStyle = P.packS; rr(c, side > 0 ? -0.24 * s : 0.11 * s, -0.53 * s, 0.13 * s, 0.08 * s, 0.04 * s); c.fill(); }
  c.fillStyle = P.shirt; rr(c, -bw / 2, -0.52 * s, bw, 0.31 * s, 0.08 * s); c.fill();
  c.fillStyle = P.shirtS; c.save(); rr(c, -bw / 2, -0.52 * s, bw, 0.31 * s, 0.08 * s); c.clip(); c.fillRect(side ? -side * bw * 0.1 - bw * 0.1 : bw * 0.18, -0.52 * s, bw * 0.4, 0.31 * s); c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(-bw / 2, -0.27 * s, bw, 0.06 * s); c.restore();
  if (back) { c.fillStyle = P.pack; rr(c, -0.15 * s, -0.53 * s, 0.3 * s, 0.27 * s, 0.06 * s); c.fill(); c.fillStyle = P.packS; rr(c, -0.15 * s, -0.53 * s, 0.3 * s, 0.09 * s, 0.05 * s); c.fill(); c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(-0.03 * s, -0.42 * s, 0.06 * s, 0.03 * s); }
  else if (!side) { c.strokeStyle = P.packS; c.lineWidth = 0.035 * s; c.beginPath(); c.moveTo(-0.11 * s, -0.5 * s); c.lineTo(-0.09 * s, -0.3 * s); c.moveTo(0.11 * s, -0.5 * s); c.lineTo(0.09 * s, -0.3 * s); c.stroke(); }
  c.fillStyle = P.shirtS;
  if (side) { c.save(); c.translate(-side * 0.04 * s, -0.47 * s); c.rotate(-side * 0.25 * stp); rr(c, -0.04 * s, 0, 0.08 * s, 0.17 * s, 0.04 * s); c.fill(); c.restore(); }
  else { rr(c, (back ? 0.17 : -0.23) * s, -0.48 * s + (back ? 0 : stp * 0.02 * s), 0.07 * s, 0.18 * s, 0.035 * s); c.fill(); }
  c.fillStyle = P.shirt; c.beginPath(); c.moveTo(side ? side * 0.05 * s : (back ? -0.15 : 0.15) * s, -0.5 * s); c.lineTo(hx, hy); c.lineWidth = 0.075 * s; c.strokeStyle = P.shirt; c.lineCap = 'round'; c.stroke();
  c.fillStyle = P.skin; c.beginPath(); c.arc(hx, hy, 0.042 * s, 0, TAU); c.fill();
  const hy0 = -0.66 * s, hr = 0.175 * s;
  c.fillStyle = P.skin; c.beginPath(); c.arc(0, hy0, hr, 0, TAU); c.fill();
  c.fillStyle = P.skinS; c.save(); c.beginPath(); c.arc(0, hy0, hr, 0, TAU); c.clip(); c.beginPath(); c.arc(-0.06 * s, hy0 - 0.05 * s, hr * 1.02, 0, TAU); c.rect(-1 * s, -2 * s, 2 * s, 3 * s); c.fill('evenodd'); c.restore();
  if (back) { c.fillStyle = P.hair; c.beginPath(); c.arc(0, hy0 + 0.01 * s, hr * 0.98, 0, TAU); c.fill(); }
  else {
    const blink = o.blink ? 0.15 : 1;
    const ex = side ? [side * 0.085 * s] : [-0.062 * s, 0.062 * s];
    for (const e of ex) { c.fillStyle = '#2A1B12'; c.beginPath(); c.ellipse(e, hy0 + 0.005 * s, 0.022 * s, 0.032 * s * blink, 0, 0, TAU); c.fill(); if (blink > 0.5) { c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(e + 0.008 * s, hy0 - 0.008 * s, 0.008 * s, 0, TAU); c.fill(); } }
    if (!side) { c.fillStyle = 'rgba(232,110,90,0.28)'; c.beginPath(); c.ellipse(-0.105 * s, hy0 + 0.05 * s, 0.03 * s, 0.018 * s, 0, 0, TAU); c.ellipse(0.105 * s, hy0 + 0.05 * s, 0.03 * s, 0.018 * s, 0, 0, TAU); c.fill(); }
    c.fillStyle = P.hair; c.beginPath(); c.ellipse(side ? -side * 0.05 * s : 0, hy0 - 0.1 * s, hr * 0.95, 0.08 * s, 0, Math.PI, TAU); c.fill();
  }
  if (o.kind === 'sun') {
    const bx = side * 0.02 * s;
    c.fillStyle = P.hatS; c.beginPath(); c.ellipse(bx, hy0 - 0.085 * s, 0.25 * s, 0.065 * s, 0, 0, TAU); c.fill();
    c.fillStyle = P.hat; c.beginPath(); c.ellipse(bx, hy0 - 0.1 * s, 0.24 * s, 0.055 * s, 0, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(bx, hy0 - 0.12 * s, 0.17 * s, 0.13 * s, 0, Math.PI, TAU); c.fill();
    c.fillStyle = P.band; c.fillRect(bx - 0.17 * s, hy0 - 0.15 * s, 0.34 * s, 0.035 * s);
    c.fillStyle = 'rgba(255,255,255,0.22)'; c.beginPath(); c.ellipse(bx - 0.06 * s, hy0 - 0.2 * s, 0.05 * s, 0.025 * s, -0.4, 0, TAU); c.fill();
  } else {
    c.fillStyle = P.hat; c.beginPath(); c.ellipse(0, hy0 - 0.08 * s, 0.185 * s, 0.17 * s, 0, Math.PI, TAU); c.fill();
    c.fillStyle = P.band; rr(c, -0.19 * s, hy0 - 0.1 * s, 0.38 * s, 0.065 * s, 0.03 * s); c.fill();
    c.fillStyle = '#E9EEF8'; c.beginPath(); c.arc(0, hy0 - 0.26 * s, 0.05 * s, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.18)'; c.beginPath(); c.ellipse(-0.07 * s, hy0 - 0.17 * s, 0.05 * s, 0.025 * s, -0.5, 0, TAU); c.fill();
  }
  if (!torchBehind) drawTorch();
  c.restore();
}


const GEMC = { sun: ['#FFB020', '#FFD966', '#FFF1C2', '#FFC23D', '#C77400'], moon: ['#2F7BFF', '#69A8FF', '#D6E8FF', '#4A92FF', '#1A4FB8'] };

function gemShape(c, s, k) {
  const w = s * 0.22, h = s * 0.26, C = GEMC[k];
  c.fillStyle = C[0]; c.beginPath(); c.moveTo(-w, -h * 0.25); c.lineTo(-w * 0.55, -h * 0.7); c.lineTo(w * 0.55, -h * 0.7); c.lineTo(w, -h * 0.25); c.lineTo(0, h * 0.75); c.closePath(); c.fill();
  c.fillStyle = C[1]; c.beginPath(); c.moveTo(-w, -h * 0.25); c.lineTo(-w * 0.55, -h * 0.7); c.lineTo(-w * 0.1, -h * 0.25); c.closePath(); c.fill();
  c.fillStyle = C[2]; c.beginPath(); c.moveTo(-w * 0.55, -h * 0.7); c.lineTo(w * 0.1, -h * 0.7); c.lineTo(-w * 0.1, -h * 0.25); c.closePath(); c.fill();
  c.fillStyle = C[3]; c.beginPath(); c.moveTo(-w, -h * 0.25); c.lineTo(-w * 0.1, -h * 0.25); c.lineTo(0, h * 0.75); c.closePath(); c.fill();
  c.fillStyle = C[4]; c.beginPath(); c.moveTo(w * 0.35, -h * 0.25); c.lineTo(w, -h * 0.25); c.lineTo(0, h * 0.75); c.closePath(); c.fill();
}


export const THEMES = {
  sand: { name: 'Sand temple', bg: '#2B231B', floor: ['#B8915F', '#B08957', '#BF9866', '#B38C5B'], grout: '#7A6142', speck: '84,62,38', style: 'slabs', wall: '#3E3227', block: '#4A3C2F', faceA: '#9C7F5B', faceB: '#6A5440', line: 'rgba(56,42,28,0.75)', chasm: ['#0E0A0C', '#050406'], rim: ['#6E5840', '#3E3124'], water: ['#17525C', '#1F6B78', 'rgba(170,235,240,0.24)'], goo: ['#3C6814', '#5A9A22', 'rgba(210,255,160,0.26)'], edge: '#C9AE80', dark: 'rgba(10,6,12,0.56)', moss: 0.12, amb: 'dust', sconce: 'fire' },
  jungle: { name: 'Moss ruins', bg: '#18211A', floor: ['#7C8668', '#748060', '#828C6D', '#788363'], grout: '#47513C', speck: '44,52,34', style: 'stones', wall: '#2C3427', block: '#36402F', faceA: '#6F7A5C', faceB: '#46503B', line: 'rgba(30,38,24,0.75)', chasm: ['#08100A', '#030604'], rim: ['#4A5638', '#2A3222'], water: ['#1B5546', '#24705C', 'rgba(170,240,210,0.22)'], goo: ['#4A6A10', '#6E9A1A', 'rgba(220,255,150,0.26)'], edge: '#9AA586', dark: 'rgba(6,14,8,0.6)', moss: 0.75, amb: 'fly', sconce: 'fire' },
  ice: { name: 'Frost hall', bg: '#1C2633', floor: ['#B4C4D2', '#ABBDCB', '#BCCAD7', '#B0C1CF'], grout: '#7C8FA2', speck: '90,110,130', style: 'slabs', wall: '#2A3646', block: '#344257', faceA: '#8EA4BC', faceB: '#5B6F87', line: 'rgba(30,40,56,0.7)', chasm: ['#0A1018', '#04070B'], rim: ['#6F86A0', '#3A4A5E'], water: ['#2A7C94', '#3FA0B8', 'rgba(220,250,255,0.35)'], goo: ['#3E7A2A', '#5AA03A', 'rgba(210,255,190,0.26)'], edge: '#E4EEF6', dark: 'rgba(8,14,30,0.44)', moss: 0, amb: 'snow', sconce: 'frost' },
  forge: { name: 'Ember works', bg: '#161112', floor: ['#4C4340', '#463E3B', '#524845', '#494140'], grout: '#2A2220', speck: '20,14,12', style: 'plates', wall: '#211A19', block: '#2B2321', faceA: '#5E504A', faceB: '#3A302C', line: 'rgba(20,14,12,0.8)', chasm: ['#140707', '#060202'], rim: ['#5A3A2C', '#2A1A14'], water: ['#1C3E5A', '#285878', 'rgba(170,210,255,0.22)'], goo: ['#3E5E12', '#5A8A1C', 'rgba(210,255,150,0.24)'], edge: '#7A6A60', dark: 'rgba(14,6,4,0.64)', moss: 0, amb: 'ember', sconce: 'fire' },
  crystal: { name: 'Amethyst mine', bg: '#191424', floor: ['#5A4E68', '#544862', '#60546E', '#584C66'], grout: '#3A3047', speck: '30,22,40', style: 'rock', wall: '#251E33', block: '#2E2640', faceA: '#6B5C82', faceB: '#433858', line: 'rgba(24,18,34,0.75)', chasm: ['#0C0814', '#050309'], rim: ['#5A4A72', '#2E2440'], water: ['#1F4C7A', '#2A68A0', 'rgba(190,220,255,0.26)'], goo: ['#4A6A14', '#6A9A22', 'rgba(210,255,160,0.26)'], edge: '#8E7FA8', dark: 'rgba(10,6,20,0.6)', moss: 0, amb: 'mote', sconce: 'crystal' },
};
const CRY = ['#B57BFF', '#7FE3FF', '#FF8AD8'];
const PADC = { 1: '#5CE1E6', 2: '#FF7AD9', 3: '#B8F55A', 4: '#FFC94A' };
export const padColor = (d) => PADC[d] || '#5CE1E6';
const thOf = (W) => THEMES[(W && W.theme) || 'sand'] || THEMES.sand;
const FLOORISH = '.ABXYfotk';

function floorTile(c, x, y, s, r, tx, ty, T, glows) {
  const base = T.floor[Math.floor(r() * 4)];
  c.fillStyle = T.grout; c.fillRect(x, y, s, s);
  const g = Math.max(1, s * 0.035);
  if (T.style === 'stones') {
    const cells = [[0, 0], [0.5, 0], [0, 0.5], [0.5, 0.5]];
    const merge = r();
    const list = merge < 0.3 ? [[0, 0, 1, 0.5], [0, 0.5, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]] : merge < 0.55 ? [[0, 0, 0.5, 1], [0.5, 0, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]] : cells.map(([a, b]) => [a, b, 0.5, 0.5]);
    for (const [sx, sy, sw, sh] of list) {
      const jx = (r() - 0.5) * s * 0.04, jy = (r() - 0.5) * s * 0.04;
      const px = x + sx * s + g + jx, py = y + sy * s + g + jy, pw = sw * s - g * 2, ph = sh * s - g * 2;
      const k = (r() - 0.5) * 0.12;
      c.fillStyle = shade(base, k); rr(c, px, py, pw, ph, s * 0.1); c.fill();
      c.fillStyle = 'rgba(255,255,240,0.07)'; rr(c, px + s * 0.03, py + s * 0.02, pw - s * 0.06, Math.max(1, ph * 0.18), s * 0.05); c.fill();
    }
    if (r() < T.moss) for (let i = 0; i < 4; i++) { c.fillStyle = r() < 0.5 ? 'rgba(92,140,58,0.6)' : 'rgba(120,168,70,0.5)'; c.beginPath(); c.ellipse(x + s * (r() < 0.5 ? 0.5 : r()), y + s * (r() < 0.5 ? 0.5 : r()), s * (0.04 + r() * 0.05), s * (0.03 + r() * 0.03), r() * 3, 0, TAU); c.fill(); }
  } else if (T.style === 'plates') {
    const k = (r() - 0.5) * 0.1;
    const px = x + g, py = y + g, pw = s - g * 2;
    const hot = r() < 0.07;
    const gr = c.createLinearGradient(px, py, px + pw, py + pw); gr.addColorStop(0, shade(base, 0.08 + k)); gr.addColorStop(1, shade(base, -0.12 + k));
    c.fillStyle = gr; rr(c, px, py, pw, pw, s * 0.04); c.fill();
    c.strokeStyle = 'rgba(255,230,210,0.08)'; c.lineWidth = Math.max(1, s * 0.02); c.beginPath(); c.moveTo(px + s * 0.03, py + pw - s * 0.03); c.lineTo(px + s * 0.03, py + s * 0.03); c.lineTo(px + pw - s * 0.03, py + s * 0.03); c.stroke();
    if (!hot) { c.fillStyle = 'rgba(10,8,8,0.55)'; for (const [a, b] of [[0.12, 0.12], [0.88, 0.12], [0.12, 0.88], [0.88, 0.88]]) { c.beginPath(); c.arc(x + s * a, y + s * b, s * 0.03, 0, TAU); c.fill(); } }
    else {
      c.strokeStyle = 'rgba(255,120,40,0.85)'; c.lineWidth = Math.max(1, s * 0.03); c.lineCap = 'round';
      let cx = x + s * (0.2 + r() * 0.2), cy = y + s * (0.2 + r() * 0.2);
      c.beginPath(); c.moveTo(cx, cy);
      for (let i = 0; i < 4; i++) { cx += s * (0.1 + r() * 0.12); cy += s * (r() - 0.3) * 0.2; c.lineTo(Math.min(x + s * 0.9, cx), Math.min(y + s * 0.9, cy)); }
      c.stroke();
      glows.push([tx + 0.5, ty + 0.5, 0.6, '#FF6A1A', 0.12]);
    }
  } else if (T.style === 'rock') {
    c.fillStyle = shade(base, (r() - 0.5) * 0.06); c.fillRect(x, y, s + 0.5, s + 0.5);
    for (let i = 0; i < 4; i++) { c.fillStyle = `rgba(${r() < 0.5 ? '255,240,255' : T.speck},${0.05 + r() * 0.07})`; c.beginPath(); c.ellipse(x + s * r(), y + s * r(), s * (0.12 + r() * 0.2), s * (0.08 + r() * 0.14), r() * 3, 0, TAU); c.fill(); }
    for (let i = 0; i < 6; i++) { c.fillStyle = `rgba(${T.speck},${0.25 + r() * 0.25})`; c.beginPath(); c.arc(x + s * r(), y + s * r(), s * (0.015 + r() * 0.025), 0, TAU); c.fill(); }
  } else {
    const lay = r();
    const slabs = lay < 0.45 ? [[0, 0, 1, 1]] : lay < 0.72 ? [[0, 0, 0.5, 1], [0.5, 0, 0.5, 1]] : [[0, 0, 1, 0.5], [0, 0.5, 1, 0.5]];
    for (const [sx, sy, sw, sh] of slabs) {
      const px = x + sx * s + g / 2, py = y + sy * s + g / 2, pw = sw * s - g, ph = sh * s - g;
      const k = (r() - 0.5) * 0.08;
      const gr = c.createLinearGradient(px, py, px + pw * 0.4, py + ph);
      gr.addColorStop(0, shade(base, 0.07 + k)); gr.addColorStop(1, shade(base, -0.07 + k));
      c.fillStyle = gr; rr(c, px, py, pw, ph, s * 0.05); c.fill();
      c.fillStyle = 'rgba(255,248,230,0.09)'; c.fillRect(px + s * 0.04, py, pw - s * 0.08, Math.max(1, s * 0.025));
      c.fillStyle = 'rgba(20,14,8,0.14)'; c.fillRect(px + s * 0.04, py + ph - Math.max(1, s * 0.03), pw - s * 0.08, Math.max(1, s * 0.03));
      for (let i = 0; i < 6; i++) { c.fillStyle = `rgba(${T.speck},${0.1 + r() * 0.14})`; const d = s * (0.015 + r() * 0.02); c.fillRect(px + r() * (pw - d), py + r() * (ph - d), d, d); }
    }
    if (T === THEMES.ice && r() < 0.5) { c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = Math.max(1, s * 0.018); c.beginPath(); const a = x + s * r(), b = y + s * r(); c.moveTo(a, b); c.lineTo(a + s * 0.25, b + s * 0.12); c.moveTo(a + s * 0.1, b + s * 0.2); c.lineTo(a + s * 0.3, b + s * 0.28); c.stroke(); }
    if (r() < 0.18) { c.strokeStyle = 'rgba(40,28,18,0.45)'; c.lineWidth = Math.max(1, s * 0.022); c.beginPath(); let cx = x + s * (0.2 + r() * 0.6), cy = y + s * (0.15 + r() * 0.2); c.moveTo(cx, cy); for (let i = 0; i < 3; i++) { cx += (r() - 0.5) * s * 0.3; cy += s * (0.15 + r() * 0.12); c.lineTo(cx, cy); } c.stroke(); }
  }
  const nearWall = isWall(tx - 1, ty) || isWall(tx + 1, ty) || isWall(tx, ty + 1);
  if (T.moss > 0 && nearWall && r() < T.moss) { const n = 3 + Math.floor(r() * 4); for (let i = 0; i < n; i++) { const mx = isWall(tx - 1, ty) && r() < 0.6 ? x + s * r() * 0.25 : isWall(tx + 1, ty) && r() < 0.6 ? x + s * (0.75 + r() * 0.25) : x + s * r(); const my = isWall(tx, ty + 1) && r() < 0.5 ? y + s * (0.78 + r() * 0.22) : y + s * r(); c.fillStyle = r() < 0.5 ? 'rgba(86,122,56,0.55)' : 'rgba(110,146,66,0.45)'; c.beginPath(); c.ellipse(mx, my, s * (0.05 + r() * 0.07), s * (0.035 + r() * 0.05), r() * 3, 0, TAU); c.fill(); } }
  if (T === THEMES.ice && isWall(tx, ty - 1) && r() < 0.6) { c.fillStyle = 'rgba(245,250,255,0.75)'; for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(x + s * (0.15 + r() * 0.7), y + s * 0.06, s * (0.12 + r() * 0.12), s * (0.05 + r() * 0.04), 0, 0, TAU); c.fill(); } }
}

function floorDecal(c, x, y, s, r, T, glows, tx, ty) {
  const k = r();
  c.save();
  if (T === THEMES.sand) {
    if (k < 0.35) { for (let i = 0; i < 3; i++) { c.fillStyle = shade('#8C7A62', (r() - 0.5) * 0.3); c.beginPath(); c.ellipse(x + s * (0.3 + r() * 0.4), y + s * (0.4 + r() * 0.35), s * (0.05 + r() * 0.05), s * (0.035 + r() * 0.03), r() * 3, 0, TAU); c.fill(); } }
    else if (k < 0.65) { c.fillStyle = 'rgba(232,206,150,0.4)'; c.beginPath(); c.ellipse(x + s * 0.5, y + s * 0.6, s * 0.38, s * 0.16, (r() - 0.5) * 0.6, 0, TAU); c.fill(); c.fillStyle = 'rgba(245,225,180,0.35)'; c.beginPath(); c.ellipse(x + s * 0.45, y + s * 0.56, s * 0.22, s * 0.08, 0, 0, TAU); c.fill(); }
    else if (k < 0.85) { c.fillStyle = '#A0583A'; for (let i = 0; i < 3; i++) { const px = x + s * (0.25 + r() * 0.5), py = y + s * (0.35 + r() * 0.4); c.beginPath(); c.moveTo(px, py); c.lineTo(px + s * 0.08, py - s * 0.03); c.lineTo(px + s * 0.06, py + s * 0.05); c.closePath(); c.fill(); } }
    else { c.strokeStyle = 'rgba(70,50,30,0.45)'; c.lineWidth = Math.max(1, s * 0.025); c.beginPath(); c.ellipse(x + s * 0.5, y + s * 0.5, s * 0.16, s * 0.2, 0, 0, TAU); c.moveTo(x + s * 0.34, y + s * 0.42); c.lineTo(x + s * 0.2, y + s * 0.34); c.moveTo(x + s * 0.66, y + s * 0.42); c.lineTo(x + s * 0.8, y + s * 0.34); c.moveTo(x + s * 0.36, y + s * 0.6); c.lineTo(x + s * 0.22, y + s * 0.7); c.moveTo(x + s * 0.64, y + s * 0.6); c.lineTo(x + s * 0.78, y + s * 0.7); c.stroke(); }
  } else if (T === THEMES.jungle) {
    if (k < 0.4) { for (let i = 0; i < 4; i++) { c.fillStyle = ['#5E8C3A', '#6FA046', '#4E7A30', '#8AA84A'][Math.floor(r() * 4)]; c.beginPath(); c.ellipse(x + s * (0.25 + r() * 0.5), y + s * (0.3 + r() * 0.45), s * 0.09, s * 0.04, r() * 3, 0, TAU); c.fill(); } }
    else if (k < 0.7) { c.strokeStyle = '#6E9A3E'; c.lineWidth = Math.max(1, s * 0.025); c.lineCap = 'round'; const bx = x + s * (0.3 + r() * 0.4), by = y + s * 0.75; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(bx + (i - 2) * s * 0.03, by); c.quadraticCurveTo(bx + (i - 2) * s * 0.06, by - s * 0.15, bx + (i - 2) * s * 0.09, by - s * (0.2 + r() * 0.1)); c.stroke(); } }
    else if (k < 0.85) { for (let i = 0; i < 3; i++) { const fx2 = x + s * (0.25 + r() * 0.5), fy = y + s * (0.3 + r() * 0.45); c.fillStyle = ['#F4E3F0', '#FFD45E', '#E98AC0'][i % 3]; for (let p = 0; p < 5; p++) { const a = p / 5 * TAU; c.beginPath(); c.arc(fx2 + Math.cos(a) * s * 0.025, fy + Math.sin(a) * s * 0.025, s * 0.02, 0, TAU); c.fill(); } c.fillStyle = '#E8A63A'; c.beginPath(); c.arc(fx2, fy, s * 0.015, 0, TAU); c.fill(); } }
    else { c.strokeStyle = 'rgba(92,64,38,0.8)'; c.lineWidth = Math.max(1.5, s * 0.04); c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y + s * (0.3 + r() * 0.4)); c.bezierCurveTo(x + s * 0.3, y + s * 0.2, x + s * 0.6, y + s * 0.8, x + s, y + s * (0.3 + r() * 0.4)); c.stroke(); }
  } else if (T === THEMES.ice) {
    if (k < 0.45) { c.fillStyle = 'rgba(248,252,255,0.82)'; for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(x + s * (0.3 + r() * 0.4), y + s * (0.4 + r() * 0.3), s * (0.1 + r() * 0.12), s * (0.06 + r() * 0.05), 0, 0, TAU); c.fill(); } }
    else if (k < 0.75) { c.fillStyle = 'rgba(200,236,255,0.85)'; for (let i = 0; i < 3; i++) { const px = x + s * (0.3 + r() * 0.4), py = y + s * (0.5 + r() * 0.25); const hgt = s * (0.12 + r() * 0.12); c.beginPath(); c.moveTo(px - s * 0.03, py); c.lineTo(px + (r() - 0.5) * s * 0.06, py - hgt); c.lineTo(px + s * 0.03, py); c.closePath(); c.fill(); } }
    else { c.fillStyle = 'rgba(170,215,240,0.55)'; c.beginPath(); c.ellipse(x + s * 0.5, y + s * 0.55, s * 0.3, s * 0.18, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,0.45)'; c.beginPath(); c.ellipse(x + s * 0.42, y + s * 0.5, s * 0.12, s * 0.04, -0.3, 0, TAU); c.fill(); }
  } else if (T === THEMES.forge) {
    if (k < 0.4) { for (let i = 0; i < 7; i++) { c.fillStyle = r() < 0.2 ? 'rgba(255,110,40,0.9)' : '#1A1414'; c.beginPath(); c.arc(x + s * (0.3 + r() * 0.4), y + s * (0.45 + r() * 0.3), s * (0.03 + r() * 0.03), 0, TAU); c.fill(); } }
    else if (k < 0.7) { const g = c.createRadialGradient(x + s * 0.5, y + s * 0.5, 0, x + s * 0.5, y + s * 0.5, s * 0.4); g.addColorStop(0, 'rgba(10,6,4,0.5)'); g.addColorStop(1, 'rgba(10,6,4,0)'); c.fillStyle = g; c.fillRect(x, y, s, s); }
    else { c.strokeStyle = '#6A5E58'; c.lineWidth = Math.max(1.5, s * 0.03); for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(x + s * (0.3 + i * 0.16), y + s * (0.5 + (i % 2) * 0.05), s * 0.06, s * 0.04, i % 2 ? 0.6 : -0.6, 0, TAU); c.stroke(); } }
  } else {
    if (k < 0.5) { const col = CRY[Math.floor(r() * 3)]; for (let i = 0; i < 3; i++) { const px = x + s * (0.3 + r() * 0.4), py = y + s * (0.55 + r() * 0.2); const hgt = s * (0.12 + r() * 0.14), wd = s * 0.05; c.fillStyle = shade(col, -0.25); c.beginPath(); c.moveTo(px - wd, py); c.lineTo(px - wd * 0.6, py - hgt * 0.75); c.lineTo(px, py - hgt); c.lineTo(px + wd, py - hgt * 0.7); c.lineTo(px + wd, py); c.closePath(); c.fill(); c.fillStyle = shade(col, 0.25); c.beginPath(); c.moveTo(px - wd * 0.6, py - hgt * 0.75); c.lineTo(px, py - hgt); c.lineTo(px, py); c.lineTo(px - wd, py); c.closePath(); c.fill(); } glows.push([tx + 0.5, ty + 0.5, 0.7, col, 0.16]); }
    else if (k < 0.8) { for (let i = 0; i < 5; i++) { c.fillStyle = shade('#6E6280', (r() - 0.5) * 0.4); c.beginPath(); c.ellipse(x + s * (0.25 + r() * 0.5), y + s * (0.35 + r() * 0.4), s * (0.03 + r() * 0.04), s * (0.025 + r() * 0.03), r() * 3, 0, TAU); c.fill(); } }
    else { for (let i = 0; i < 3; i++) { const px = x + s * (0.3 + r() * 0.4), py = y + s * (0.5 + r() * 0.25); c.strokeStyle = '#CFE9F2'; c.lineWidth = Math.max(1, s * 0.02); c.beginPath(); c.moveTo(px, py); c.lineTo(px, py - s * 0.08); c.stroke(); c.fillStyle = '#7FE3FF'; c.beginPath(); c.ellipse(px, py - s * 0.09, s * 0.04, s * 0.025, 0, Math.PI, TAU); c.fill(); } glows.push([tx + 0.5, ty + 0.5, 0.6, '#7FE3FF', 0.14]); }
  }
  c.restore();
}

function wallTile(c, x, y, s, r, tx, ty, T, glows) {
  const openBelow = !WALLISH.has(at(tx, ty + 1));
  const openAbove = !WALLISH.has(at(tx, ty - 1));
  const fh = openBelow ? s * 0.46 : 0;
  c.fillStyle = T.wall; c.fillRect(x, y, s, s);
  const blocks = r() < 0.5 ? [[0, 0, 1, 0.55], [0, 0.55, 0.5, 0.45], [0.5, 0.55, 0.5, 0.45]] : [[0, 0, 0.55, 1], [0.55, 0, 0.45, 0.5], [0.55, 0.5, 0.45, 0.5]];
  for (const [bx, by, bw, bh] of blocks) { c.fillStyle = shade(T.block, (r() - 0.5) * 0.18); rr(c, x + bx * s + 1, y + by * s + 1, bw * s - 2, bh * s - 2, s * 0.05); c.fill(); }
  if (openAbove) { c.fillStyle = 'rgba(255,240,220,0.1)'; c.fillRect(x, y, s, Math.max(1.5, s * 0.04)); }
  if (T === THEMES.ice && openAbove) { c.fillStyle = 'rgba(240,248,255,0.85)'; rr(c, x - s * 0.02, y - s * 0.02, s * 1.04, s * 0.16, s * 0.07); c.fill(); }
  if (!WALLISH.has(at(tx - 1, ty))) { c.fillStyle = 'rgba(0,0,0,0.22)'; c.fillRect(x, y, Math.max(1.5, s * 0.05), s - fh); }
  if (!WALLISH.has(at(tx + 1, ty))) { c.fillStyle = 'rgba(0,0,0,0.22)'; c.fillRect(x + s - Math.max(1.5, s * 0.05), y, Math.max(1.5, s * 0.05), s - fh); }
  if (T === THEMES.crystal && r() < 0.14) { const col = CRY[Math.floor(r() * 3)]; crystalCluster(c, x + s * (0.3 + r() * 0.4), y + s * 0.5, s * 0.5, col, r); glows.push([tx + 0.5, ty + 0.4, 0.9, col, 0.12]); }
  if (!openBelow) return;
  const fy = y + s - fh;
  const gr = c.createLinearGradient(0, fy, 0, y + s); gr.addColorStop(0, T.faceA); gr.addColorStop(1, T.faceB);
  c.fillStyle = gr; c.fillRect(x, fy, s, fh);
  c.strokeStyle = T.line; c.lineWidth = Math.max(1, s * 0.03);
  const rows = 2, rh = fh / rows;
  for (let i = 1; i < rows; i++) { c.beginPath(); c.moveTo(x, fy + rh * i); c.lineTo(x + s, fy + rh * i); c.stroke(); }
  for (let i = 0; i < rows; i++) { const off = ((tx + i) % 2) * 0.5; for (let k = 0; k < 3; k++) { const bx = x + s * ((off + k * 0.5) % 1); if (bx <= x + 1 || bx >= x + s - 1) continue; c.beginPath(); c.moveTo(bx, fy + rh * i); c.lineTo(bx, fy + rh * (i + 1)); c.stroke(); } }
  c.fillStyle = 'rgba(255,240,215,0.16)'; c.fillRect(x, fy, s, Math.max(1, s * 0.03));
  c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x, y + s - Math.max(1, s * 0.04), s, Math.max(1, s * 0.04));
  if (at(tx, ty) !== '#') return;
  const dk = r();
  if (T === THEMES.sand) {
    if (dk < 0.16) {
      const bx = x + s * 0.24, bw = s * 0.52;
      c.fillStyle = '#5A1E16'; c.fillRect(bx, y + s * 0.42, bw, s * 0.06);
      const cg = c.createLinearGradient(bx, 0, bx + bw, 0); cg.addColorStop(0, '#8E2A1E'); cg.addColorStop(0.5, '#B3402C'); cg.addColorStop(1, '#8E2A1E');
      c.fillStyle = cg; c.beginPath(); c.moveTo(bx, y + s * 0.46); c.lineTo(bx + bw, y + s * 0.46); c.lineTo(bx + bw, y + s * 1.08); c.lineTo(bx + bw / 2, y + s * 0.98); c.lineTo(bx, y + s * 1.08); c.closePath(); c.fill();
      glyph(c, 'sun', bx + bw / 2, y + s * 0.72, s * 0.24, '#E8C46A', s * 0.03);
    } else if (dk < 0.36) {
      for (let i = 0; i < 3; i++) glyph(c, ['leaf', 'wave', 'star', 'tri', 'dia'][Math.floor(r() * 5)], x + s * (0.2 + i * 0.3), fy + fh * 0.5, s * 0.18, 'rgba(60,44,28,0.55)', s * 0.025);
    }
  } else if (T === THEMES.jungle) {
    if (dk < 0.4) {
      const n = 1 + Math.floor(r() * 2);
      for (let v = 0; v < n; v++) {
        const vx = x + s * (0.15 + r() * 0.7), len = fh * (0.6 + r() * 0.9);
        c.strokeStyle = '#2F5A2A'; c.lineWidth = Math.max(1, s * 0.028); c.beginPath(); c.moveTo(vx, fy - s * 0.02);
        c.bezierCurveTo(vx + s * 0.06, fy + len * 0.3, vx - s * 0.06, fy + len * 0.6, vx + s * 0.02, fy + len); c.stroke();
        for (let l = 0; l < 4; l++) { const ly = fy + len * (0.15 + l * 0.22), lx = vx + Math.sin(l * 2.1) * s * 0.04; c.fillStyle = l % 2 ? '#4F8A3A' : '#5E9A44'; c.beginPath(); c.ellipse(lx + (l % 2 ? s * 0.035 : -s * 0.035), ly, s * 0.04, s * 0.022, l % 2 ? 0.6 : -0.6, 0, TAU); c.fill(); }
      }
    } else if (dk < 0.65) { for (let i = 0; i < 5; i++) { c.fillStyle = r() < 0.5 ? 'rgba(96,140,60,0.7)' : 'rgba(120,160,70,0.6)'; c.beginPath(); c.ellipse(x + s * r(), fy + fh * r(), s * (0.06 + r() * 0.06), s * (0.04 + r() * 0.03), 0, 0, TAU); c.fill(); } }
  } else if (T === THEMES.ice) {
    if (dk < 0.55) { const n = 2 + Math.floor(r() * 3); for (let i = 0; i < n; i++) { const ix = x + s * (0.12 + r() * 0.76), il = s * (0.12 + r() * 0.22); const ig = c.createLinearGradient(0, y + s, 0, y + s + il); ig.addColorStop(0, 'rgba(230,246,255,0.95)'); ig.addColorStop(1, 'rgba(170,215,240,0.55)'); c.fillStyle = ig; c.beginPath(); c.moveTo(ix - s * 0.04, y + s - 1); c.lineTo(ix + s * 0.04, y + s - 1); c.lineTo(ix, y + s + il); c.closePath(); c.fill(); } }
    if (r() < 0.3) { c.strokeStyle = 'rgba(255,255,255,0.4)'; c.lineWidth = Math.max(1, s * 0.02); for (let i = 0; i < 2; i++) { const a = x + s * r(), b = fy + fh * r(); c.beginPath(); c.moveTo(a - s * 0.08, b); c.lineTo(a + s * 0.08, b); c.moveTo(a, b - s * 0.08); c.lineTo(a, b + s * 0.08); c.stroke(); } }
  } else if (T === THEMES.forge) {
    if (dk < 0.22) { const py = fy + fh * 0.35; c.fillStyle = '#4A4F57'; c.fillRect(x, py, s, s * 0.11); c.fillStyle = 'rgba(255,255,255,0.15)'; c.fillRect(x, py, s, s * 0.03); c.fillStyle = '#3A3E45'; c.fillRect(x + s * 0.42, py - s * 0.03, s * 0.12, s * 0.17); }
    else if (dk < 0.4) { const vx = x + s * 0.25, vw = s * 0.5, vy = fy + fh * 0.2, vh = fh * 0.55; c.fillStyle = '#1A1210'; rr(c, vx, vy, vw, vh, s * 0.04); c.fill(); const vg = c.createLinearGradient(0, vy, 0, vy + vh); vg.addColorStop(0, 'rgba(255,140,50,0.95)'); vg.addColorStop(1, 'rgba(255,60,20,0.6)'); c.fillStyle = vg; for (let i = 0; i < 4; i++) c.fillRect(vx + vw * (0.12 + i * 0.22), vy + vh * 0.15, vw * 0.1, vh * 0.7); glows.push([tx + 0.5, ty + 0.8, 1.2, '#FF6A1A', 0.3]); }
    else if (dk < 0.5) { c.strokeStyle = '#6A6E76'; c.lineWidth = Math.max(1.5, s * 0.035); const cx = x + s * (0.3 + r() * 0.4); for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(cx, fy + i * s * 0.1, s * 0.035, s * 0.055, 0, 0, TAU); c.stroke(); } }
  } else if (T === THEMES.crystal) {
    if (dk < 0.32) { const col = CRY[Math.floor(r() * 3)]; crystalCluster(c, x + s * (0.25 + r() * 0.5), y + s, s * 0.7, col, r); glows.push([tx + 0.5, ty + 0.9, 1.1, col, 0.2]); }
    else if (dk < 0.45) { c.fillStyle = '#5A4630'; c.fillRect(x + s * 0.1, fy - s * 0.06, s * 0.1, fh + s * 0.06); c.fillRect(x + s * 0.8, fy - s * 0.06, s * 0.1, fh + s * 0.06); c.fillStyle = '#6E583C'; c.fillRect(x, fy - s * 0.1, s, s * 0.09); }
  }
}
function crystalCluster(c, cx, by, hgt, col, r) {
  const n = 3 + Math.floor(r() * 2);
  for (let i = 0; i < n; i++) {
    const off = (i - (n - 1) / 2) * hgt * 0.16, h = hgt * (0.45 + r() * 0.55) * (i === Math.floor(n / 2) ? 1.15 : 0.85), w = hgt * 0.11, lean = (i - (n - 1) / 2) * 0.22;
    c.save(); c.translate(cx + off, by); c.rotate(lean);
    c.fillStyle = shade(col, -0.3); c.beginPath(); c.moveTo(-w, 0); c.lineTo(-w, -h * 0.75); c.lineTo(0, -h); c.lineTo(w, -h * 0.75); c.lineTo(w, 0); c.closePath(); c.fill();
    c.fillStyle = shade(col, 0.15); c.beginPath(); c.moveTo(-w, 0); c.lineTo(-w, -h * 0.75); c.lineTo(0, -h); c.lineTo(0, 0); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.moveTo(-w * 0.6, -h * 0.3); c.lineTo(-w * 0.6, -h * 0.7); c.lineTo(-w * 0.2, -h * 0.85); c.lineTo(-w * 0.2, -h * 0.4); c.closePath(); c.fill();
    c.restore();
  }
}
function pillarArt(c, x, y, s, T, r, glows, tx, ty) {
  const cx = x + s * 0.5, by = y + s * 1.0;
  if (T === THEMES.sand) {
    c.fillStyle = '#7D6446'; c.beginPath(); c.moveTo(cx - s * 0.3, by); c.lineTo(cx - s * 0.2, y - s * 0.55); c.lineTo(cx + s * 0.2, y - s * 0.55); c.lineTo(cx + s * 0.3, by); c.closePath(); c.fill();
    c.fillStyle = '#A3845C'; c.beginPath(); c.moveTo(cx - s * 0.3, by); c.lineTo(cx - s * 0.2, y - s * 0.55); c.lineTo(cx, y - s * 0.55); c.lineTo(cx, by); c.closePath(); c.fill();
    c.fillStyle = '#E2B755'; c.beginPath(); c.moveTo(cx - s * 0.2, y - s * 0.55); c.lineTo(cx, y - s * 0.8); c.lineTo(cx + s * 0.2, y - s * 0.55); c.closePath(); c.fill();
    glyph(c, 'sun', cx, y + s * 0.15, s * 0.22, 'rgba(60,40,20,0.6)', s * 0.03);
  } else if (T === THEMES.jungle) {
    c.fillStyle = '#5E6650'; rr(c, cx - s * 0.32, y - s * 0.4, s * 0.64, s * 1.35, s * 0.2); c.fill();
    c.fillStyle = '#4A523E'; c.beginPath(); c.arc(cx - s * 0.12, y + s * 0.02, s * 0.07, 0, TAU); c.arc(cx + s * 0.12, y + s * 0.02, s * 0.07, 0, TAU); c.fill();
    c.fillRect(cx - s * 0.12, y + s * 0.25, s * 0.24, s * 0.05);
    for (let i = 0; i < 6; i++) { c.fillStyle = r() < 0.5 ? 'rgba(96,150,60,0.85)' : 'rgba(120,170,70,0.75)'; c.beginPath(); c.ellipse(cx + (r() - 0.5) * s * 0.6, y - s * 0.3 + r() * s * 1.1, s * 0.08, s * 0.05, r() * 3, 0, TAU); c.fill(); }
  } else if (T === THEMES.ice) {
    const g = c.createLinearGradient(cx - s * 0.3, 0, cx + s * 0.3, 0); g.addColorStop(0, 'rgba(160,210,240,0.95)'); g.addColorStop(0.45, 'rgba(235,248,255,0.98)'); g.addColorStop(1, 'rgba(120,180,220,0.95)');
    c.fillStyle = g; c.beginPath(); c.moveTo(cx - s * 0.28, by); c.lineTo(cx - s * 0.24, y - s * 0.45); c.lineTo(cx, y - s * 0.7); c.lineTo(cx + s * 0.24, y - s * 0.45); c.lineTo(cx + s * 0.28, by); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = Math.max(1, s * 0.03); c.beginPath(); c.moveTo(cx - s * 0.1, y - s * 0.4); c.lineTo(cx - s * 0.12, y + s * 0.6); c.stroke();
  } else if (T === THEMES.forge) {
    c.fillStyle = '#3A3230'; rr(c, cx - s * 0.32, y - s * 0.4, s * 0.64, s * 1.4, s * 0.06); c.fill();
    c.fillStyle = '#4A403C'; c.fillRect(cx - s * 0.36, y - s * 0.45, s * 0.72, s * 0.12);
    const g = c.createLinearGradient(0, y, 0, y + s * 0.5); g.addColorStop(0, '#FFC060'); g.addColorStop(1, '#FF5A1A');
    c.fillStyle = g; rr(c, cx - s * 0.14, y + s * 0.05, s * 0.28, s * 0.42, s * 0.05); c.fill();
    glows.push([tx + 0.5, ty + 0.3, 1.4, '#FF7A2A', 0.35]);
  } else {
    const col = CRY[(tx + ty) % 3];
    crystalCluster(c, cx, by, s * 1.5, col, r);
    glows.push([tx + 0.5, ty, 1.6, col, 0.3]);
  }
}

function chasmTile(c, x, y, s, tx, ty, T) {
  const g = c.createLinearGradient(0, y, 0, y + s); g.addColorStop(0, T.chasm[0]); g.addColorStop(1, T.chasm[1]);
  c.fillStyle = g; c.fillRect(x, y, s + 0.5, s + 0.5);
  const up = at(tx, ty - 1);
  if (up !== 'C' && up !== 'b' && up !== 'K') {
    const cg = c.createLinearGradient(0, y, 0, y + s * 0.55); cg.addColorStop(0, T.rim[0]); cg.addColorStop(0.35, T.rim[1]); cg.addColorStop(1, 'rgba(10,8,12,0)');
    c.fillStyle = cg; c.fillRect(x, y, s + 0.5, s * 0.55);
    c.strokeStyle = 'rgba(20,14,10,0.55)'; c.lineWidth = Math.max(1, s * 0.02);
    for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(x + s * (0.15 + i * 0.33), y); c.lineTo(x + s * (0.2 + i * 0.33), y + s * 0.3); c.stroke(); }
  }
  const dn = at(tx, ty + 1);
  if (dn !== 'C' && dn !== 'b' && dn !== 'K') { c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(x, y + s * 0.9, s, s * 0.1); }
  if (THEMES.forge === T) { const hg = c.createLinearGradient(0, y, 0, y + s); hg.addColorStop(0, 'rgba(255,80,20,0)'); hg.addColorStop(1, 'rgba(255,80,20,0.12)'); c.fillStyle = hg; c.fillRect(x, y, s + 0.5, s + 0.5); }
}
function iceTile(c, x, y, s, r) {
  const g = c.createLinearGradient(x, y, x + s, y + s); g.addColorStop(0, '#DDF1FB'); g.addColorStop(1, '#A9D3EA');
  c.fillStyle = g; c.fillRect(x, y, s + 0.5, s + 0.5);
  c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = Math.max(1, s * 0.03); c.lineCap = 'round';
  for (let i = 0; i < 2; i++) { const a = x + s * (0.1 + r() * 0.5), b = y + s * (0.15 + r() * 0.6); c.beginPath(); c.moveTo(a, b); c.lineTo(a + s * (0.2 + r() * 0.2), b - s * (0.08 + r() * 0.1)); c.stroke(); }
  if (r() < 0.4) { c.strokeStyle = 'rgba(110,160,200,0.5)'; c.lineWidth = Math.max(1, s * 0.018); c.beginPath(); let cx = x + s * r(), cy = y + s * r(); c.moveTo(cx, cy); for (let i = 0; i < 3; i++) { cx += (r() - 0.5) * s * 0.4; cy += (r() - 0.5) * s * 0.4; c.lineTo(cx, cy); } c.stroke(); }
  c.fillStyle = 'rgba(80,130,170,0.25)'; c.fillRect(x, y + s - Math.max(1, s * 0.03), s, Math.max(1, s * 0.03));
}
function spikeBase(c, x, y, s, ch) {
  const pad = s * 0.06;
  const g = c.createLinearGradient(x, y, x, y + s); g.addColorStop(0, '#77808C'); g.addColorStop(1, '#4C535E');
  c.fillStyle = g; rr(c, x + pad, y + pad, s - pad * 2, s - pad * 2, s * 0.08); c.fill();
  c.strokeStyle = ch === 's' ? 'rgba(120,200,255,0.55)' : 'rgba(255,170,90,0.55)'; c.lineWidth = Math.max(1.2, s * 0.03); rr(c, x + pad, y + pad, s - pad * 2, s - pad * 2, s * 0.08); c.stroke();
  for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) { c.fillStyle = '#23272E'; c.beginPath(); c.arc(x + s * (0.25 + i * 0.25), y + s * (0.27 + j * 0.24), s * 0.045, 0, TAU); c.fill(); }
}
function padBase(c, x, y, s) {
  const cx = x + s * 0.5, cy = y + s * 0.55;
  c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(cx, cy + s * 0.04, s * 0.42, s * 0.3, 0, 0, TAU); c.fill();
  c.fillStyle = '#5B5E68'; c.beginPath(); c.ellipse(cx, cy, s * 0.42, s * 0.3, 0, 0, TAU); c.fill();
  c.fillStyle = '#2E3038'; c.beginPath(); c.ellipse(cx, cy, s * 0.31, s * 0.21, 0, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = Math.max(1, s * 0.025); c.beginPath(); c.ellipse(cx, cy, s * 0.42, s * 0.3, 0, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
}
function tplateBase(c, x, y, s) {
  const cx = x + s * 0.5, cy = y + s * 0.55;
  c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(cx, cy + s * 0.04, s * 0.36, s * 0.25, 0, 0, TAU); c.fill();
  c.fillStyle = '#5E6A78'; c.beginPath(); c.ellipse(cx, cy, s * 0.36, s * 0.25, 0, 0, TAU); c.fill();
}

const FLOOR_UNDER = '.ABXYfotkFNhjTHJODEVZzQ';
function findAll(W, chs) {
  const out = [];
  for (let y = 0; y < W.MH; y++) for (let x = 0; x < W.MW; x++) if (chs.includes(W.map[y][x])) out.push([x, y]);
  return out;
}

export function prepare(W) {
  if (W.cache) return W.cache;
  const sconces = [];
  for (let y = 0; y < W.MH - 1; y++) for (let x = 1; x < W.MW - 1; x++) {
    const ch = W.map[y][x], below = W.map[y + 1][x];
    if (ch !== '#' || isWallCh(below) || 'HJODEVQZz'.includes(below)) continue;
    if ((x * 7 + y * 3) % 5 !== 0) continue;
    if (sconces.some(([sx, sy]) => sy === y && Math.abs(sx - x) < 3)) continue;
    sconces.push([x, y]);
  }
  W.cache = {
    lava: findAll(W, 'L'), water: findAll(W, 'W'), goo: findAll(W, 'P'), bridge: findAll(W, 'b'),
    H: findAll(W, 'H'), J: findAll(W, 'J'), O: findAll(W, 'O'), Q: findAll(W, 'Q'), D: findAll(W, 'D'), E: findAll(W, 'E'), V: findAll(W, 'V'),
    plates: findAll(W, 'o'), tplates: findAll(W, 't'), spikes: findAll(W, 'Ss'), crumble: findAll(W, 'K'), curtains: findAll(W, 'Zz'), pads: findAll(W, '1234'), ice: findAll(W, 'I'),
    sconces, glows: [],
  };
  return W.cache;
}

export function buildStatic(W, s) {
  CW = W;
  const C = prepare(W);
  const T = thOf(W);
  const glows = [];
  const cv = document.createElement('canvas');
  cv.width = Math.ceil(W.MW * s); cv.height = Math.ceil(W.MH * s);
  const c = cv.getContext('2d');
  c.fillStyle = T.bg; c.fillRect(0, 0, cv.width, cv.height);
  for (let y = 0; y < W.MH; y++) for (let x = 0; x < W.MW; x++) {
    const ch = W.map[y][x];
    if (isWallCh(ch)) continue;
    const r = mulberry(x * 131 + y * 977 + 3 + (W.L && W.L.depth ? W.L.depth * 13 : 0) + (W.li % 97) * 7);
    if (ch === 'C' || ch === 'b' || ch === 'K') { chasmTile(c, x * s, y * s, s, x, y, T); continue; }
    if (ch === 'I') { iceTile(c, x * s, y * s, s, r); continue; }
    floorTile(c, x * s, y * s, s, r, x, y, T, glows);
    if (ch === '.' && r() < 0.13) {
      const busy = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !'.#'.includes(at(x + dx, y + dy)));
      if (!busy) floorDecal(c, x * s, y * s, s, r, T, glows, x, y);
    }
  }
  for (const [x, y] of C.spikes) spikeBase(c, x * s, y * s, s, W.map[y][x]);
  for (const [x, y] of C.pads) padBase(c, x * s, y * s, s);
  for (const [x, y] of C.tplates) tplateBase(c, x * s, y * s, s);
  for (let y = 0; y < W.MH; y++) for (let x = 0; x < W.MW; x++) {
    const ch = W.map[y][x];
    if (isWallCh(ch) || ch === 'C' || ch === 'b' || ch === 'K') continue;
    const up = at(x, y - 1);
    if (isWallCh(up) || 'HJODEQ'.includes(up)) { const g = c.createLinearGradient(0, y * s, 0, y * s + s * 0.42); g.addColorStop(0, 'rgba(14,8,4,0.45)'); g.addColorStop(1, 'rgba(14,8,4,0)'); c.fillStyle = g; c.fillRect(x * s, y * s, s, s * 0.42); }
    if (isWallCh(at(x - 1, y))) { const g = c.createLinearGradient(x * s, 0, x * s + s * 0.22, 0); g.addColorStop(0, 'rgba(14,8,4,0.3)'); g.addColorStop(1, 'rgba(14,8,4,0)'); c.fillStyle = g; c.fillRect(x * s, y * s, s * 0.22, s); }
    if (isWallCh(at(x + 1, y))) { const g = c.createLinearGradient(x * s + s, 0, x * s + s * 0.78, 0); g.addColorStop(0, 'rgba(14,8,4,0.3)'); g.addColorStop(1, 'rgba(14,8,4,0)'); c.fillStyle = g; c.fillRect(x * s + s * 0.78, y * s, s * 0.22, s); }
  }
  const pillars = [];
  for (let y = 0; y < W.MH; y++) for (let x = 0; x < W.MW; x++) {
    if (!isWallCh(W.map[y][x])) continue;
    const r = mulberry(x * 71 + y * 313 + 9 + (W.li % 97) * 11);
    wallTile(c, x * s, y * s, s, r, x, y, T, glows);
    if (W.map[y][x] === '#' && x > 0 && y > 0 && x < W.MW - 1 && y < W.MH - 1) {
      const open = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => !isWallCh(at(x + dx, y + dy))).length;
      if (open >= 3 && !isWallCh(at(x, y + 1))) pillars.push([x, y]);
    }
  }
  for (const [x, y] of pillars) pillarArt(c, x * s, y * s, s, T, mulberry(x * 5 + y * 17), glows, x, y);
  for (let y = 0; y < W.MH; y++) for (let x = 0; x < W.MW; x++) {
    const ch = W.map[y][x];
    if (!'HJODEVQZz'.includes(ch)) continue;
    const X = x * s, Y = y * s;
    const lw = !('HJODEVQZz'.includes(at(x - 1, y))), rw = !('HJODEVQZz'.includes(at(x + 1, y)));
    if (lw) { c.fillStyle = T.wall; c.fillRect(X, Y, s * 0.1, s * 0.54); c.fillStyle = T.faceB; c.fillRect(X, Y + s * 0.54, s * 0.1, s * 0.46); }
    if (rw) { c.fillStyle = T.wall; c.fillRect(X + s * 0.9, Y, s * 0.1, s * 0.54); c.fillStyle = T.faceB; c.fillRect(X + s * 0.9, Y + s * 0.54, s * 0.1, s * 0.46); }
  }
  for (const [x, y] of C.sconces) {
    const X = x * s + s * 0.5, Y = y * s + s * 0.72;
    if (T.sconce === 'crystal') { crystalCluster(c, X, Y + s * 0.12, s * 0.42, '#7FE3FF', mulberry(x + y * 3)); continue; }
    c.fillStyle = T.sconce === 'frost' ? '#3A4A5E' : '#2B231C'; rr(c, X - s * 0.07, Y - s * 0.02, s * 0.14, s * 0.16, s * 0.03); c.fill();
    c.fillStyle = T.sconce === 'frost' ? '#6A7E96' : '#4A3B2C'; c.beginPath(); c.moveTo(X - s * 0.11, Y - s * 0.06); c.lineTo(X + s * 0.11, Y - s * 0.06); c.lineTo(X + s * 0.06, Y + s * 0.03); c.lineTo(X - s * 0.06, Y + s * 0.03); c.closePath(); c.fill();
  }
  for (const [x, y] of C.plates) {
    const cx = (x + 0.5) * s, cy = (y + 0.55) * s;
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(cx, cy + s * 0.04, s * 0.36, s * 0.24, 0, 0, TAU); c.fill();
    c.fillStyle = '#6E6254'; c.beginPath(); c.ellipse(cx, cy, s * 0.36, s * 0.24, 0, 0, TAU); c.fill();
  }
  if (W.muralAt) {
    const X = W.muralAt.x * s, Y = W.muralAt.y * s;
    c.fillStyle = shade(T.faceA, -0.1); rr(c, X + s * 0.08, Y + s * 0.5, s * 0.84, s * 0.44, s * 0.06); c.fill();
    c.strokeStyle = 'rgba(30,22,14,0.6)'; c.lineWidth = Math.max(1, s * 0.03); rr(c, X + s * 0.14, Y + s * 0.55, s * 0.72, s * 0.34, s * 0.04); c.stroke();
  }
  if (W.dialAt) {
    const cx = (W.dialAt.x + 0.5) * s, cy = (W.dialAt.y + 0.74) * s;
    c.fillStyle = '#4C4034'; c.beginPath(); c.arc(cx, cy, s * 0.2, 0, TAU); c.fill();
    c.fillStyle = '#7B6A55'; c.beginPath(); c.arc(cx, cy - s * 0.015, s * 0.17, 0, TAU); c.fill();
    for (let i = 0; i < 3; i++) { c.fillStyle = '#4C4034'; c.beginPath(); c.arc(cx - s * 0.09 + i * s * 0.09, cy - s * 0.015, s * 0.035, 0, TAU); c.fill(); }
  }
  C.glows = glows;
  return cv;
}

function drawLava(c, s, t, W) {
  for (const [x, y] of prepare(W).lava) {
    const X = x * s, Y = y * s;
    const g = c.createLinearGradient(X, Y, X + s, Y + s); g.addColorStop(0, '#FF7A1F'); g.addColorStop(1, '#D9480F');
    c.fillStyle = g; c.fillRect(X, Y, s + 0.5, s + 0.5);
    c.strokeStyle = `rgba(255,${210 + Math.sin(t * 2 + x) * 30},120,0.75)`; c.lineWidth = Math.max(1.5, s * 0.05);
    for (let i = 0; i < 2; i++) { const yy = Y + s * (0.3 + i * 0.42) + Math.sin(t * 1.3 + x * 1.7 + i * 2) * s * 0.08; c.beginPath(); c.moveTo(X, yy); c.bezierCurveTo(X + s * 0.3, yy - s * 0.12, X + s * 0.6, yy + s * 0.12, X + s, yy + Math.sin(t + y) * s * 0.05); c.stroke(); }
    c.fillStyle = 'rgba(80,20,5,0.55)';
    for (let i = 0; i < 2; i++) { const px = X + s * (0.2 + ((x * 0.37 + i * 0.5 + t * 0.05) % 1) * 0.6), py = Y + s * (0.25 + ((y * 0.53 + i * 0.4) % 1) * 0.5); c.beginPath(); c.ellipse(px, py, s * 0.12, s * 0.07, 0.3, 0, TAU); c.fill(); }
    const ph = (t * 0.7 + x * 0.31 + y * 0.17) % 1;
    if (ph < 0.5) { const r2 = s * 0.12 * (ph / 0.5); c.strokeStyle = `rgba(255,230,160,${0.8 * (1 - ph / 0.5)})`; c.lineWidth = Math.max(1, s * 0.03); c.beginPath(); c.arc(X + s * (0.3 + (x % 2) * 0.4), Y + s * (0.6 - (y % 2) * 0.3), r2, 0, TAU); c.stroke(); }
    if (at(x, y - 1) !== 'L') { c.fillStyle = 'rgba(60,15,5,0.6)'; c.fillRect(X, Y, s + 0.5, s * 0.1); }
    if (at(x - 1, y) !== 'L') { c.fillStyle = 'rgba(60,15,5,0.45)'; c.fillRect(X, Y, s * 0.07, s); }
    if (at(x + 1, y) !== 'L') { c.fillStyle = 'rgba(60,15,5,0.45)'; c.fillRect(X + s * 0.93, Y, s * 0.07, s); }
  }
}

function drawPool(c, s, t, W, ch, cols) {
  const list = ch === 'W' ? prepare(W).water : prepare(W).goo;
  for (const [x, y] of list) {
    const X = x * s, Y = y * s;
    const g = c.createLinearGradient(0, Y, 0, Y + s); g.addColorStop(0, cols[0]); g.addColorStop(1, cols[1]);
    c.fillStyle = g; c.fillRect(X, Y, s + 0.5, s + 0.5);
    if (at(x, y - 1) !== ch) { c.fillStyle = 'rgba(5,20,25,0.5)'; c.fillRect(X, Y, s + 0.5, s * 0.18); }
    c.strokeStyle = cols[2]; c.lineWidth = Math.max(1, s * 0.025);
    for (let i = 0; i < 2; i++) { const yy = Y + s * (0.38 + i * 0.32) + Math.sin(t * 1.6 + x * 1.3 + i) * s * 0.03; const xo = ((t * 0.18 + x * 0.37 + i * 0.5) % 1) * s; c.beginPath(); c.moveTo(X + xo - s * 0.18, yy); c.quadraticCurveTo(X + xo, yy - s * 0.05, X + xo + s * 0.18, yy); c.stroke(); }
    if (ch === 'P') { const ph = (t * 0.9 + x * 0.41 + y * 0.23) % 1; c.fillStyle = `rgba(190,255,140,${0.7 * (1 - ph)})`; c.beginPath(); c.arc(X + s * (0.3 + (x % 2) * 0.35), Y + s * (0.7 - ph * 0.4), s * (0.04 + ph * 0.06), 0, TAU); c.fill(); }
    const L = s * 0.07; c.fillStyle = thOf(W).edge;
    if (at(x, y - 1) !== ch) c.fillRect(X - 0.5, Y, s + 1, L);
    if (at(x, y + 1) !== ch) c.fillRect(X - 0.5, Y + s - L, s + 1, L);
    if (at(x - 1, y) !== ch) c.fillRect(X, Y, L, s);
    if (at(x + 1, y) !== ch) c.fillRect(X + s - L, Y, L, s);
  }
}

function drawBridge(c, s, t, W) {
  for (const [x, y] of prepare(W).bridge) {
    const L = litAt(W, x, y), X = x * s, Y = y * s;
    c.save(); c.globalAlpha = 0.07 + L * 0.93;
    c.fillStyle = 'rgba(0,0,0,0.35)'; rr(c, X + s * 0.06, Y + s * 0.12, s * 0.88, s * 0.86, s * 0.12); c.fill();
    const g = c.createLinearGradient(0, Y, 0, Y + s); g.addColorStop(0, '#7E8FA6'); g.addColorStop(1, '#4E5B70');
    c.fillStyle = g; rr(c, X + s * 0.06, Y + s * 0.04, s * 0.88, s * 0.84, s * 0.12); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(X + s * 0.14, Y + s * 0.07, s * 0.72, s * 0.04);
    c.shadowColor = '#7FB2FF'; c.shadowBlur = s * 0.3 * L;
    glyph(c, 'moon', X + s * 0.5, Y + s * 0.45, s * 0.36, `rgba(190,220,255,${0.4 + L * 0.6})`, s * 0.04);
    c.restore();
    if (L < 0.5) { c.strokeStyle = 'rgba(140,180,255,0.14)'; c.lineWidth = 1; c.setLineDash([3, 4]); rr(c, X + s * 0.08, Y + s * 0.06, s * 0.84, s * 0.8, s * 0.12); c.stroke(); c.setLineDash([]); }
  }
}

function drawLever(c, s, W, l) {
  const X = l.x * s, Y = l.y * s, on = l.on;
  const ball = l.g === 'H' ? '#E9A23B' : '#B56CF0', lit = l.g === 'H' ? '#FFD27A' : '#E3C2FF';
  c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(X + s * 0.5, Y + s * 0.8, s * 0.34, s * 0.1, 0, 0, TAU); c.fill();
  c.fillStyle = '#5E5246'; rr(c, X + s * 0.2, Y + s * 0.5, s * 0.6, s * 0.32, s * 0.08); c.fill();
  c.fillStyle = '#7A6C5C'; rr(c, X + s * 0.2, Y + s * 0.46, s * 0.6, s * 0.12, s * 0.06); c.fill();
  c.save(); c.translate(X + s * 0.5, Y + s * 0.55); c.rotate(on ? 0.75 : -0.75);
  c.strokeStyle = '#6B4A2B'; c.lineWidth = s * 0.08; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -s * 0.42); c.stroke();
  c.fillStyle = ball; c.beginPath(); c.arc(0, -s * 0.44, s * 0.1, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.45)'; c.beginPath(); c.arc(-s * 0.03, -s * 0.47, s * 0.035, 0, TAU); c.fill();
  c.restore();
  c.fillStyle = on ? lit : 'rgba(30,24,18,0.7)'; c.beginPath(); c.arc(X + s * 0.5, Y + s * 0.67, s * 0.05, 0, TAU); c.fill();
}

function drawGates(c, s, W) {
  for (const g of ['H', 'J']) {
    const tiles = prepare(W)[g];
    if (!tiles.length) continue;
    const open = W.gateAmt[g];
    const ls = Object.values(W.levers).filter((l) => l.g === g);
    const lamp = g === 'H' ? '#FFB347' : '#C99BFF';
    tiles.forEach(([x, y], ti) => {
      const X = x * s, Y = y * s;
      c.fillStyle = '#4A3C2F'; c.fillRect(X + s * 0.06, Y - s * 0.02, s * 0.88, s * 0.16);
      if (ti === Math.floor((tiles.length - 1) / 2)) ls.forEach((l, i) => { c.fillStyle = l.on ? lamp : 'rgba(255,230,190,0.25)'; c.beginPath(); c.arc(X + s * (0.5 + (i - (ls.length - 1) / 2) * 0.24), Y + s * 0.06, s * 0.05, 0, TAU); c.fill(); });
      c.save(); c.beginPath(); c.rect(X + s * 0.06, Y + s * 0.13, s * 0.88, s * 0.87); c.clip();
      const lift = open * s * 0.86;
      for (let i = 0; i < 5; i++) {
        const bx = X + s * (0.15 + i * 0.175);
        const gr = c.createLinearGradient(bx - s * 0.03, 0, bx + s * 0.03, 0); gr.addColorStop(0, '#2C3036'); gr.addColorStop(0.5, '#6B727C'); gr.addColorStop(1, '#2C3036');
        c.fillStyle = gr; c.fillRect(bx - s * 0.03, Y + s * 0.13 - lift, s * 0.06, s * 0.87);
        c.fillStyle = '#9AA1AA'; c.beginPath(); c.moveTo(bx - s * 0.035, Y + s - lift); c.lineTo(bx + s * 0.035, Y + s - lift); c.lineTo(bx, Y + s * 1.06 - lift); c.closePath(); c.fill();
      }
      c.fillStyle = '#3E434A'; c.fillRect(X + s * 0.06, Y + s * 0.42 - lift, s * 0.88, s * 0.06); c.fillRect(X + s * 0.06, Y + s * 0.72 - lift, s * 0.88, s * 0.06);
      c.restore();
    });
  }
}

function drawPlates(c, s, t, W) {
  const C = prepare(W);
  for (const [x, y] of C.plates) {
    const cx = (x + 0.5) * s, cy = (y + 0.55) * s;
    const down = ['sun', 'moon'].some((k) => alive(W.p[k]) && onTile(W.p[k], x, y, 0.1));
    c.fillStyle = down ? '#C9A35C' : '#A08A6A'; c.beginPath(); c.ellipse(cx, cy - (down ? 0 : s * 0.04), s * 0.3, s * 0.19, 0, 0, TAU); c.fill();
    c.strokeStyle = down ? '#FFE3A0' : 'rgba(60,45,30,0.6)'; c.lineWidth = Math.max(1.5, s * 0.03); c.beginPath(); c.ellipse(cx, cy - (down ? 0 : s * 0.04), s * 0.2, s * 0.12, 0, 0, TAU); c.stroke();
    if (!down) { c.fillStyle = `rgba(255,225,150,${0.25 + Math.sin(t * 3 + x) * 0.12})`; c.beginPath(); c.arc(cx, cy - s * 0.04, s * 0.05, 0, TAU); c.fill(); }
  }
  for (const [x, y] of C.O) {
    const X = x * s, Y = y * s, a = W.pdoor;
    c.save(); c.beginPath(); c.rect(X + s * 0.04, Y, s * 0.92, s); c.clip();
    const drop = a * s * 0.92;
    const g = c.createLinearGradient(0, Y, 0, Y + s); g.addColorStop(0, '#7C6A55'); g.addColorStop(1, '#4E4235');
    c.fillStyle = g; c.fillRect(X + s * 0.04, Y + drop, s * 0.92, s);
    c.strokeStyle = 'rgba(30,22,14,0.55)'; c.lineWidth = Math.max(1, s * 0.025);
    for (let i = 1; i < 3; i++) { c.beginPath(); c.moveTo(X + s * 0.04, Y + drop + s * i / 3); c.lineTo(X + s * 0.96, Y + drop + s * i / 3); c.stroke(); }
    c.fillStyle = W.pressed ? '#FFD27A' : 'rgba(255,220,160,0.3)'; c.beginPath(); c.arc(X + s * 0.5, Y + drop + s * 0.18, s * 0.06, 0, TAU); c.fill();
    c.restore();
  }
}

function drawCodeDoor(c, s, W) {
  for (const [x, y] of prepare(W).D) {
    const X = x * s, Y = y * s, a = W.codeAmt;
    c.fillStyle = `rgba(20,14,10,${0.85 * (1 - a)})`; c.fillRect(X + s * 0.1, Y, s * 0.8, s);
    c.save(); c.beginPath(); c.rect(X + s * 0.1, Y, s * 0.8, s); c.clip();
    const top = Y + a * s * 0.98;
    const g = c.createLinearGradient(0, top, 0, top + s); g.addColorStop(0, '#8A7A63'); g.addColorStop(1, '#5C4F40');
    c.fillStyle = g; c.beginPath(); c.moveTo(X + s * 0.1, top + s); c.lineTo(X + s * 0.1, top + s * 0.3); c.quadraticCurveTo(X + s * 0.5, top - s * 0.06, X + s * 0.9, top + s * 0.3); c.lineTo(X + s * 0.9, top + s); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(40,30,20,0.55)'; c.lineWidth = Math.max(1, s * 0.025);
    c.beginPath(); c.moveTo(X + s * 0.5, top + s * 0.5); c.lineTo(X + s * 0.5, top + s); c.stroke();
    c.beginPath(); c.moveTo(X + s * 0.16, top + s * 0.5); c.lineTo(X + s * 0.84, top + s * 0.5); c.stroke();
    for (let i = 0; i < 3; i++) {
      const gx = X + s * (0.29 + i * 0.21), gy = top + s * 0.32;
      c.fillStyle = 'rgba(30,22,14,0.55)'; c.beginPath(); c.arc(gx, gy, s * 0.085, 0, TAU); c.fill();
      if (W.codeGlow > 0.05) { c.save(); c.globalAlpha = W.codeGlow; c.shadowColor = '#FFC75A'; c.shadowBlur = s * 0.2; glyph(c, W.code[i], gx, gy, s * 0.14, '#FFE09A', s * 0.028); c.restore(); }
    }
    c.restore();
  }
}

function drawDialHint(c, s, t, W, me) {
  if (!W.dialAt || W.codeSolved) return;
  const near = me && alive(me) && dist(me, W.dialAt.x + 0.5, W.dialAt.y + 1.45) < 1.05;
  const cx = (W.dialAt.x + 0.5) * s, cy = (W.dialAt.y + 0.74) * s, a = near ? 0.95 : 0.3 + Math.sin(t * 3) * 0.18;
  c.strokeStyle = `rgba(255,214,120,${a})`; c.lineWidth = Math.max(1.5, s * 0.04); c.beginPath(); c.arc(cx, cy, s * 0.26, 0, TAU); c.stroke();
}

function drawMural(c, s, W) {
  if (!W.muralAt || W.mural < 0.02) return;
  c.save(); c.globalAlpha = W.mural;
  for (let i = 0; i < 3; i++) { const gx = (W.muralAt.x + 0.24 + i * 0.26) * s, gy = (W.muralAt.y + 0.72) * s; c.shadowColor = '#6FB0FF'; c.shadowBlur = s * 0.25; glyph(c, W.code[i], gx, gy, s * 0.22, '#CFE6FF', s * 0.035); }
  c.restore();
}

function drawVines(c, s, t, W) {
  for (const [x, y] of prepare(W).V) {
    const X = x * s, Y = y * s;
    if (W.vines.done) { c.fillStyle = 'rgba(30,25,20,0.5)'; c.beginPath(); c.ellipse(X + s * 0.5, Y + s * 0.7, s * 0.35, s * 0.15, 0, 0, TAU); c.fill(); continue; }
    const b = clamp(W.vines.burn / 1.2, 0, 1);
    c.fillStyle = '#1F2A17'; c.fillRect(X + s * 0.1, Y, s * 0.8, s);
    const r = mulberry(91 + x);
    for (let i = 0; i < 9; i++) {
      const vx = X + s * (0.15 + r() * 0.7);
      c.strokeStyle = b > 0 ? `rgb(${60 + b * 40},${90 - b * 60},${40 - b * 20})` : '#2F6A2A'; c.lineWidth = Math.max(1.5, s * 0.05);
      c.beginPath(); c.moveTo(vx, Y); c.bezierCurveTo(vx + s * 0.1, Y + s * 0.3, vx - s * 0.1, Y + s * 0.6, vx + s * 0.04, Y + s); c.stroke();
      for (let l = 0; l < 4; l++) { const ly = Y + s * (0.12 + l * 0.24), lx = vx + Math.sin(l * 2.1 + i) * s * 0.05; c.fillStyle = b > 0 ? `rgba(${90 + b * 60},${120 - b * 80},40,${1 - b * 0.6})` : (l % 2 ? '#4F8A3A' : '#62A447'); c.beginPath(); c.ellipse(lx + (l % 2 ? s * 0.05 : -s * 0.05), ly, s * 0.07, s * 0.035, l % 2 ? 0.6 : -0.6, 0, TAU); c.fill(); }
    }
    if (b > 0) for (let i = 0; i < 4; i++) flame(c, X + s * (0.2 + i * 0.2), Y + s * (0.95 - b * 0.4), s * (0.35 + Math.sin(t * 9 + i) * 0.06), LOOK.sun.flame, t, i * 2);
  }
}

function drawKey(c, s, t, W) {
  const K = W.key;
  if (!K || K.used) return;
  let x, y, sc = 1;
  if (K.held) { const p = W.p[K.held]; if (!alive(p)) return; x = p.x * s; y = (p.y - 1.25) * s + Math.sin(t * 3) * s * 0.03; sc = 0.7; }
  else { x = K.x * s; y = (K.y - 0.25) * s + Math.sin(t * 2.5) * s * 0.06; c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(K.x * s, (K.y + 0.15) * s, s * 0.16, s * 0.05, 0, 0, TAU); c.fill(); }
  c.save(); c.translate(x, y); c.scale(sc, sc); c.rotate(-0.5);
  c.shadowColor = '#9CC8FF'; c.shadowBlur = s * 0.35;
  c.strokeStyle = '#DCEBFF'; c.lineWidth = s * 0.07; c.beginPath(); c.arc(-s * 0.14, 0, s * 0.11, 0, TAU); c.stroke();
  c.lineCap = 'round'; c.beginPath(); c.moveTo(-s * 0.03, 0); c.lineTo(s * 0.26, 0); c.moveTo(s * 0.2, 0); c.lineTo(s * 0.2, s * 0.09); c.moveTo(s * 0.12, 0); c.lineTo(s * 0.12, s * 0.07); c.stroke();
  c.restore();
}

function drawChest(c, s, t, W) {
  const ch = W.chest;
  if (!ch) return;
  const X = ch.x * s, Y = ch.y * s, o = ch.open;
  c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(X + s * 0.5, Y + s * 0.88, s * 0.44, s * 0.1, 0, 0, TAU); c.fill();
  const g = c.createLinearGradient(0, Y + s * 0.42, 0, Y + s * 0.88); g.addColorStop(0, '#8A5A2B'); g.addColorStop(1, '#5E3B1A');
  c.fillStyle = g; rr(c, X + s * 0.1, Y + s * 0.42, s * 0.8, s * 0.46, s * 0.06); c.fill();
  c.fillStyle = '#C9963F'; c.fillRect(X + s * 0.1, Y + s * 0.6, s * 0.8, s * 0.06); c.fillRect(X + s * 0.24, Y + s * 0.42, s * 0.06, s * 0.46); c.fillRect(X + s * 0.7, Y + s * 0.42, s * 0.06, s * 0.46);
  if (o > 0) { c.save(); c.globalCompositeOperation = 'lighter'; const lg = c.createRadialGradient(X + s * 0.5, Y + s * 0.4, 0, X + s * 0.5, Y + s * 0.4, s * 0.9); lg.addColorStop(0, `rgba(255,220,140,${0.6 * o})`); lg.addColorStop(1, 'rgba(255,220,140,0)'); c.fillStyle = lg; c.fillRect(X - s * 0.4, Y - s * 0.5, s * 1.8, s * 1.8); c.restore(); }
  c.save(); c.translate(X + s * 0.5, Y + s * 0.44); c.scale(1, 1 - o * 1.6);
  const lg2 = c.createLinearGradient(0, -s * 0.24, 0, 0); lg2.addColorStop(0, '#9C6A36'); lg2.addColorStop(1, '#6E4520');
  c.fillStyle = lg2; c.beginPath(); c.moveTo(-s * 0.4, 0); c.lineTo(-s * 0.4, -s * 0.14); c.quadraticCurveTo(0, -s * 0.3, s * 0.4, -s * 0.14); c.lineTo(s * 0.4, 0); c.closePath(); c.fill();
  c.fillStyle = '#C9963F'; c.fillRect(-s * 0.03, -s * 0.2, s * 0.06, s * 0.2);
  c.restore();
  if (!o) { c.fillStyle = '#E8C46A'; rr(c, X + s * 0.43, Y + s * 0.5, s * 0.14, s * 0.14, s * 0.03); c.fill(); c.fillStyle = '#3B2A12'; c.beginPath(); c.arc(X + s * 0.5, Y + s * 0.56, s * 0.025, 0, TAU); c.fill(); }
  if (W.key && W.key.held && !o) { c.strokeStyle = `rgba(200,225,255,${0.5 + Math.sin(t * 4) * 0.3})`; c.lineWidth = Math.max(1.5, s * 0.035); rr(c, X + s * 0.04, Y + s * 0.26, s * 0.92, s * 0.68, s * 0.12); c.stroke(); }
}

function drawExitDoors(c, s, t, W) {
  for (const k of ['sun', 'moon']) {
    const e = W.exits[k];
    if (!e) continue;
    const on = W.doorOn[k];
    const X = e.x * s, Y = (e.y - 1) * s, col = k === 'sun' ? '#FFB347' : '#7FB2FF';
    c.fillStyle = '#2A2119'; c.beginPath(); c.moveTo(X + s * 0.12, Y + s); c.lineTo(X + s * 0.12, Y + s * 0.42); c.quadraticCurveTo(X + s * 0.5, Y + s * 0.05, X + s * 0.88, Y + s * 0.42); c.lineTo(X + s * 0.88, Y + s); c.closePath(); c.fill();
    const g = c.createLinearGradient(0, Y + s * 0.3, 0, Y + s); g.addColorStop(0, k === 'sun' ? '#8A4A1A' : '#22406E'); g.addColorStop(1, k === 'sun' ? '#5A2E10' : '#152B4D');
    c.fillStyle = g; c.beginPath(); c.moveTo(X + s * 0.2, Y + s); c.lineTo(X + s * 0.2, Y + s * 0.46); c.quadraticCurveTo(X + s * 0.5, Y + s * 0.16, X + s * 0.8, Y + s * 0.46); c.lineTo(X + s * 0.8, Y + s); c.closePath(); c.fill();
    c.save(); c.shadowColor = col; c.shadowBlur = s * (on ? 0.6 : 0.2); glyph(c, k, X + s * 0.5, Y + s * 0.62, s * 0.34, on ? '#FFFFFF' : col, s * 0.045); c.restore();
    const cy = (e.y + 0.55) * s;
    const pg = c.createRadialGradient(X + s * 0.5, cy, 0, X + s * 0.5, cy, s * 0.55); pg.addColorStop(0, rgba(col, on ? 0.55 : 0.22 + Math.sin(t * 3) * 0.06)); pg.addColorStop(1, rgba(col, 0));
    c.fillStyle = pg; c.fillRect(X - s * 0.1, cy - s * 0.55, s * 1.2, s * 1.1);
    c.strokeStyle = rgba(col, 0.6); c.lineWidth = Math.max(1.5, s * 0.03); c.beginPath(); c.ellipse(X + s * 0.5, cy, s * 0.36, s * 0.22, 0, 0, TAU); c.stroke();
  }
}

function drawFlags(c, s, t, W) {
  for (const fl of W.flags) {
    const X = (fl.x + 0.82) * s, Y = (fl.y + 0.85) * s;
    c.strokeStyle = '#4A3B2C'; c.lineWidth = Math.max(1.5, s * 0.035); c.beginPath(); c.moveTo(X, Y); c.lineTo(X, Y - s * 0.62); c.stroke();
    const col = fl.by === 'sun' ? '#FF9A3C' : fl.by === 'moon' ? '#5E9BFF' : '#9A8F80';
    const wv = Math.sin(t * 5 + fl.x) * s * 0.03 * (1 + fl.wave * 2);
    c.fillStyle = col; c.beginPath(); c.moveTo(X, Y - s * 0.62); c.quadraticCurveTo(X + s * 0.14, Y - s * 0.58 + wv, X + s * 0.26, Y - s * 0.55 + wv); c.lineTo(X, Y - s * 0.42); c.closePath(); c.fill();
  }
}

function drawBrazier(c, s, t, W, k) {
  const z = W.braz[k], cx = (z.x + 0.5) * s, by = (z.y + 0.82) * s;
  const col = k === 'F' ? LOOK.sun.flame : LOOK.moon.flame;
  c.fillStyle = 'rgba(0,0,0,0.32)'; c.beginPath(); c.ellipse(cx, by + s * 0.02, s * 0.3, s * 0.1, 0, 0, TAU); c.fill();
  c.fillStyle = '#6A5B49'; rr(c, cx - s * 0.16, by - s * 0.4, s * 0.32, s * 0.42, s * 0.04); c.fill();
  c.fillStyle = 'rgba(255,240,210,0.1)'; c.fillRect(cx - s * 0.16, by - s * 0.4, s * 0.06, s * 0.42);
  glyph(c, k === 'F' ? 'sun' : 'moon', cx, by - s * 0.2, s * 0.2, z.lit > 0 ? (k === 'F' ? '#FFD07A' : '#CFE4FF') : 'rgba(40,30,20,0.6)', s * 0.03);
  const bowl = c.createLinearGradient(0, by - s * 0.58, 0, by - s * 0.38); bowl.addColorStop(0, '#8A6A3E'); bowl.addColorStop(1, '#4A3820');
  c.fillStyle = bowl; c.beginPath(); c.moveTo(cx - s * 0.3, by - s * 0.47); c.quadraticCurveTo(cx, by - s * 0.26, cx + s * 0.3, by - s * 0.47); c.fill();
  c.fillStyle = '#2B1E12'; c.beginPath(); c.ellipse(cx, by - s * 0.48, s * 0.27, s * 0.07, 0, 0, TAU); c.fill();
  if (z.lit > 0) {
    flame(c, cx, by - s * 0.47, s * 0.62, col, t, k === 'F' ? 2 : 6);
    if (!z.perm) { c.strokeStyle = k === 'F' ? 'rgba(255,200,110,0.9)' : 'rgba(150,200,255,0.9)'; c.lineWidth = Math.max(2, s * 0.05); c.beginPath(); c.arc(cx, by - s * 0.2, s * 0.42, -Math.PI / 2, -Math.PI / 2 + TAU * (z.lit / 7)); c.stroke(); }
  } else { for (let i = 0; i < 5; i++) { c.fillStyle = `rgba(${150 + i * 15},60,30,0.6)`; c.beginPath(); c.arc(cx - s * 0.15 + i * s * 0.075, by - s * 0.49 + Math.sin(i * 2) * s * 0.015, s * 0.035, 0, TAU); c.fill(); } }
}

function drawGreat(c, s, W) {
  const tiles = prepare(W).E;
  if (!tiles.length) return;
  const x0 = Math.min(...tiles.map((q) => q[0])), x1 = Math.max(...tiles.map((q) => q[0])) + 1, y = tiles[0][1];
  const X = x0 * s, Y = y * s, w = (x1 - x0) * s, a = W.great.amt;
  c.fillStyle = `rgba(26,20,15,${1 - a})`; c.fillRect(X, Y, w, s);
  c.save(); c.beginPath(); c.rect(X + s * 0.06, Y, w - s * 0.12, s); c.clip();
  const slide = a * w * 0.5;
  for (const sd of [-1, 1]) {
    const lx = sd < 0 ? X + s * 0.06 - slide : X + w / 2 + slide, lw = w / 2 - s * 0.06;
    const g = c.createLinearGradient(0, Y, 0, Y + s); g.addColorStop(0, '#6E4A2C'); g.addColorStop(1, '#4D321E');
    c.fillStyle = g; c.fillRect(lx, Y, lw, s);
    c.strokeStyle = 'rgba(30,18,10,0.6)'; c.lineWidth = Math.max(1, s * 0.025);
    for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(lx + lw * i / 4, Y); c.lineTo(lx + lw * i / 4, Y + s); c.stroke(); }
    c.fillStyle = '#3B3F45'; c.fillRect(lx, Y + s * 0.25, lw, s * 0.07); c.fillRect(lx, Y + s * 0.7, lw, s * 0.07);
    const kx = sd < 0 ? lx + lw - s * 0.32 : lx + s * 0.32;
    const lit = W.braz && (W.braz[sd < 0 ? 'F' : 'N'].lit > 0 || W.great.open);
    glyph(c, sd < 0 ? 'sun' : 'moon', kx, Y + s * 0.5, s * 0.3, lit ? (sd < 0 ? '#FFD07A' : '#BFDBFF') : 'rgba(255,220,170,0.35)', s * 0.035);
  }
  c.restore();
  c.fillStyle = '#4E3F31'; c.fillRect(X - s * 0.04, Y - s * 0.08, w + s * 0.08, s * 0.12);
}

function drawGem(c, s, t, g) {
  const cx = (g.x + 0.5) * s, cy = (g.y + 0.5) * s;
  if (g.taken) { if (g.pop >= 1) return; c.save(); c.globalAlpha = 1 - g.pop; c.translate(cx, cy - s * 0.3 - g.pop * s * 0.6); c.scale(1 + g.pop * 0.4, 1 + g.pop * 0.4); gemShape(c, s, g.k); c.restore(); return; }
  const b = Math.sin(t * 3 + g.x) * s * 0.05;
  c.fillStyle = 'rgba(0,0,0,0.28)'; c.beginPath(); c.ellipse(cx, cy + s * 0.18, s * 0.17, s * 0.06, 0, 0, TAU); c.fill();
  c.save(); c.translate(cx, cy - s * 0.12 + b); gemShape(c, s, g.k); c.restore();
  const tw = (t * 0.7 + g.x * 0.3) % 2.4;
  if (tw < 0.3) { const a = Math.sin(tw / 0.3 * Math.PI); c.strokeStyle = `rgba(255,255,255,${a})`; c.lineWidth = Math.max(1, s * 0.02); const gx = cx + s * 0.08, gy = cy - s * 0.22 + b; c.beginPath(); c.moveTo(gx - s * 0.08 * a, gy); c.lineTo(gx + s * 0.08 * a, gy); c.moveTo(gx, gy - s * 0.08 * a); c.lineTo(gx, gy + s * 0.08 * a); c.stroke(); }
}

function drawPlayer(c, s, t, p) {
  let alpha = 1, sc = 1, dy = 0;
  if (p.dead > 0) {
    const k = clamp((1.15 - p.dead) / 0.8, 0, 1);
    if (p.die === 'fall') { sc = 1 - k * 0.85; dy = k * 0.3; alpha = 1 - k * 0.7; }
    else if (p.die === 'water' || p.die === 'goo') { dy = k * 0.35; alpha = 1 - k; }
    else alpha = 1 - k;
    if (p.dead < 0.35) alpha = 0;
  } else if (p.spawnT > 0) alpha = 1 - p.spawnT / 0.6 * 0.8;
  if (alpha <= 0) return;
  if (p.fallT > 0) dy += Math.sin(t * 40) * 0.02;
  c.save(); c.translate(p.x * s, (p.y + dy) * s); c.scale(sc, sc);
  drawExplorer(c, 0, 0, s * 0.95, { kind: p.kind, dir: p.dir, phase: p.phase, moving: p.moving, t, blink: p.blink > 0, alpha });
  c.restore();
}

export function drawBubble(c, x, y, text, a, cw) {
  c.save(); c.globalAlpha = a;
  c.font = '600 13px ' + FF;
  const maxW = 168, words = String(text).split(' '), lines = [];
  let cur = '';
  for (const w of words) { const tt = cur ? cur + ' ' + w : w; if (c.measureText(tt).width > maxW && cur) { lines.push(cur); cur = w; } else cur = tt; }
  if (cur) lines.push(cur);
  const lw = Math.max(...lines.map((l) => c.measureText(l).width)), bw = lw + 22, bh = lines.length * 17 + 14;
  let bx = x - bw / 2; bx = clamp(bx, 8, cw - bw - 8);
  const by = y - bh - 8;
  c.fillStyle = 'rgba(0,0,0,0.25)'; rr(c, bx, by + 2, bw, bh, 13); c.fill();
  c.fillStyle = '#FFFFFF'; rr(c, bx, by, bw, bh, 13); c.fill();
  c.beginPath(); c.moveTo(clamp(x, bx + 14, bx + bw - 14) - 7, by + bh - 1); c.lineTo(clamp(x, bx + 14, bx + bw - 14), by + bh + 7); c.lineTo(clamp(x, bx + 14, bx + bw - 14) + 7, by + bh - 1); c.fill();
  c.fillStyle = '#1A1622'; c.textBaseline = 'top';
  lines.forEach((l, i) => c.fillText(l, bx + 11, by + 8 + i * 17));
  c.restore();
}

function nameTag(c, x, y, text, col) {
  c.save(); c.font = '700 11px ' + FF;
  const w = c.measureText(text).width + 14;
  c.fillStyle = 'rgba(10,8,16,0.6)'; rr(c, x - w / 2, y - 17, w, 17, 8.5); c.fill();
  c.fillStyle = col; c.textBaseline = 'middle'; c.textAlign = 'center'; c.fillText(text, x, y - 8.2);
  c.restore();
}

function drawSpikes(c, s, t, W) {
  for (const [x, y] of prepare(W).spikes) {
    const ch = W.map[y][x], off = spikeOff(ch);
    const amt = spikeAmt(W, off), warn = spikeWarn(W, off);
    const X = x * s, Y = y * s;
    if (amt <= 0.01) {
      if (warn > 0) { for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) { c.fillStyle = `rgba(255,${ch === 's' ? 220 : 170},${ch === 's' ? 255 : 110},${0.15 + warn * 0.5})`; c.beginPath(); c.arc(X + s * (0.25 + i * 0.25) + Math.sin(t * 60 + i) * s * 0.008 * warn, Y + s * (0.27 + j * 0.24), s * 0.03, 0, TAU); c.fill(); } }
      continue;
    }
    for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) {
      const bx = X + s * (0.25 + i * 0.25), by = Y + s * (0.3 + j * 0.24), hgt = s * 0.3 * amt, w = s * 0.07;
      c.fillStyle = '#9AA3AE'; c.beginPath(); c.moveTo(bx - w, by); c.lineTo(bx, by - hgt); c.lineTo(bx + w, by); c.closePath(); c.fill();
      c.fillStyle = '#E3E8EE'; c.beginPath(); c.moveTo(bx - w, by); c.lineTo(bx, by - hgt); c.lineTo(bx - w * 0.15, by); c.closePath(); c.fill();
      c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(bx, by + s * 0.01, w, s * 0.02, 0, 0, TAU); c.fill();
    }
  }
}
function drawCrumble(c, s, t, W) {
  const T = thOf(W);
  for (const [x, y] of prepare(W).crumble) {
    const st = crumbleState(W, x, y);
    const X = x * s, Y = y * s;
    let sc = 1, al = 1, dx = 0;
    if (st.s === 1) dx = Math.sin(t * 70 + x) * s * 0.025 * st.k;
    if (st.s === 2) { if (st.k < 0.18) { sc = 1 - st.k / 0.18 * 0.6; al = 1 - st.k / 0.18; } else if (st.k > 0.86) { al = (st.k - 0.86) / 0.14; } else continue; }
    c.save(); c.globalAlpha = al; c.translate(X + s / 2 + dx, Y + s / 2); c.scale(sc, sc);
    c.fillStyle = 'rgba(0,0,0,0.4)'; rr(c, -s * 0.46, -s * 0.42, s * 0.92, s * 0.92, s * 0.1); c.fill();
    const g = c.createLinearGradient(0, -s / 2, 0, s / 2); g.addColorStop(0, shade(T.floor[0], 0.05)); g.addColorStop(1, shade(T.floor[1], -0.2));
    c.fillStyle = g; rr(c, -s * 0.46, -s * 0.46, s * 0.92, s * 0.86, s * 0.1); c.fill();
    c.strokeStyle = `rgba(30,20,12,${0.55 + (st.s === 1 ? st.k * 0.4 : 0)})`; c.lineWidth = Math.max(1, s * (0.025 + (st.s === 1 ? st.k * 0.02 : 0))); c.lineCap = 'round';
    c.beginPath(); c.moveTo(-s * 0.3, -s * 0.3); c.lineTo(-s * 0.05, -s * 0.05); c.lineTo(-s * 0.12, s * 0.22); c.moveTo(-s * 0.05, -s * 0.05); c.lineTo(s * 0.28, -s * 0.12); c.moveTo(s * 0.06, s * 0.02); c.lineTo(s * 0.26, s * 0.3); c.stroke();
    c.restore();
  }
}
function drawCurtains(c, s, t, W) {
  for (const [x, y] of prepare(W).curtains) {
    const fire = W.map[y][x] === 'Z';
    const X = x * s, Y = y * s;
    if (fire) {
      const g = c.createLinearGradient(0, Y - s * 0.3, 0, Y + s); g.addColorStop(0, 'rgba(255,90,20,0)'); g.addColorStop(1, 'rgba(255,110,30,0.55)');
      c.fillStyle = g; c.fillRect(X + s * 0.1, Y - s * 0.3, s * 0.8, s * 1.3);
      for (let i = 0; i < 4; i++) flame(c, X + s * (0.2 + i * 0.2), Y + s * 0.98, s * (0.6 + Math.sin(t * 7 + i * 1.7) * 0.12), ['#FFF4C8', '#FFC24A', '#FF6A1A'], t, i * 3 + x);
    } else {
      c.save(); c.beginPath(); c.rect(X + s * 0.1, Y - s * 0.35, s * 0.8, s * 1.35); c.clip();
      const g = c.createLinearGradient(0, Y - s * 0.35, 0, Y + s); g.addColorStop(0, 'rgba(90,170,255,0.35)'); g.addColorStop(1, 'rgba(120,200,255,0.75)');
      c.fillStyle = g; c.fillRect(X + s * 0.1, Y - s * 0.35, s * 0.8, s * 1.35);
      c.strokeStyle = 'rgba(230,248,255,0.75)'; c.lineWidth = Math.max(1, s * 0.03); c.lineCap = 'round';
      for (let i = 0; i < 6; i++) { const lx = X + s * (0.16 + i * 0.13), ph = ((t * 1.6 + i * 0.37) % 1); c.beginPath(); c.moveTo(lx, Y - s * 0.35 + ph * s * 1.3); c.lineTo(lx, Y - s * 0.35 + ph * s * 1.3 + s * 0.28); c.stroke(); }
      c.restore();
      c.fillStyle = 'rgba(235,250,255,0.85)'; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(X + s * (0.2 + i * 0.2), Y + s * 0.95 + Math.sin(t * 9 + i) * s * 0.02, s * (0.06 + Math.sin(t * 7 + i * 2) * 0.015), 0, TAU); c.fill(); }
    }
  }
}
function drawPads(c, s, t, W) {
  for (const [x, y] of prepare(W).pads) {
    const col = padColor(W.map[y][x]);
    const cx = (x + 0.5) * s, cy = (y + 0.55) * s;
    const pulse = 0.65 + Math.sin(t * 3 + x) * 0.2;
    const g = c.createRadialGradient(cx, cy, 0, cx, cy, s * 0.32);
    g.addColorStop(0, rgba(col, 0.9 * pulse)); g.addColorStop(1, rgba(col, 0.05));
    c.fillStyle = g; c.beginPath(); c.ellipse(cx, cy, s * 0.31, s * 0.21, 0, 0, TAU); c.fill();
    c.save(); c.translate(cx, cy); c.scale(1, 0.68); c.rotate(t * 1.6);
    c.strokeStyle = rgba(col, 0.95); c.lineWidth = Math.max(1.5, s * 0.035); c.setLineDash([s * 0.12, s * 0.08]);
    c.beginPath(); c.arc(0, 0, s * 0.37, 0, TAU); c.stroke(); c.setLineDash([]);
    c.restore();
    c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = Math.max(1, s * 0.025);
    c.beginPath(); c.ellipse(cx, cy - s * 0.02, s * 0.1, s * 0.07, 0, 0, TAU); c.stroke();
  }
}
function drawTimed(c, s, t, W) {
  const C = prepare(W);
  const left = clamp((W.tdoorUntil - W.t) / TDOOR_T, 0, 1);
  const on = W.t < W.tdoorUntil;
  for (const [x, y] of C.tplates) {
    const cx = (x + 0.5) * s, cy = (y + 0.55) * s;
    const down = ['sun', 'moon'].some((k) => alive(W.p[k]) && onTile(W.p[k], x, y, 0.1));
    const lift = down ? 0 : s * 0.04;
    c.fillStyle = on ? '#9FE2C0' : '#B9C3CE'; c.beginPath(); c.ellipse(cx, cy - lift, s * 0.28, s * 0.18, 0, 0, TAU); c.fill();
    c.strokeStyle = '#2E3A46'; c.lineWidth = Math.max(1.5, s * 0.03);
    c.beginPath(); c.ellipse(cx, cy - lift, s * 0.2, s * 0.13, 0, 0, TAU); c.stroke();
    const a = on ? -Math.PI / 2 + TAU * (1 - left) : -Math.PI / 2;
    c.beginPath(); c.moveTo(cx, cy - lift); c.lineTo(cx + Math.cos(a) * s * 0.15, cy - lift + Math.sin(a) * s * 0.1); c.stroke();
  }
  for (const [x, y] of C.Q) {
    const X = x * s, Y = y * s, a = W.qdoor;
    c.save(); c.beginPath(); c.rect(X + s * 0.04, Y, s * 0.92, s); c.clip();
    const drop = a * s * 0.92;
    const g = c.createLinearGradient(0, Y, 0, Y + s); g.addColorStop(0, '#6E7C8C'); g.addColorStop(1, '#46525F');
    c.fillStyle = g; c.fillRect(X + s * 0.04, Y + drop, s * 0.92, s);
    c.strokeStyle = 'rgba(20,26,32,0.55)'; c.lineWidth = Math.max(1, s * 0.025);
    for (let i = 1; i < 3; i++) { c.beginPath(); c.moveTo(X + s * 0.04, Y + drop + s * i / 3); c.lineTo(X + s * 0.96, Y + drop + s * i / 3); c.stroke(); }
    c.restore();
    c.fillStyle = 'rgba(10,14,20,0.6)'; rr(c, X + s * 0.12, Y - s * 0.12, s * 0.76, s * 0.09, s * 0.04); c.fill();
    if (on) { c.fillStyle = left < 0.3 ? '#FF6B5A' : '#7FF0B5'; rr(c, X + s * 0.12, Y - s * 0.12, s * 0.76 * left, s * 0.09, s * 0.04); c.fill(); }
  }
}

export function part(W, x, y, vx, vy, life, col, size, kind) { if (W.parts.length > 320) return; W.parts.push({ x, y, vx, vy, life, max: life, col, size, kind: kind || 'dot' }); }
export function dust(W, x, y, n) { for (let i = 0; i < n; i++) part(W, x + (Math.random() - 0.5) * 0.2, y - 0.02, (Math.random() - 0.5) * 0.5, -0.2 - Math.random() * 0.3, 0.45, 'rgba(210,190,150,0.35)', 0.06 + Math.random() * 0.05, 'puff'); }
export function puffs(W, x, y, w, n, col) { for (let i = 0; i < n; i++) part(W, x + Math.random() * w, y + Math.random() * 0.3, (Math.random() - 0.5) * 0.9, -0.3 - Math.random() * 0.5, 0.8 + Math.random() * 0.4, col || 'rgba(200,180,140,0.32)', 0.12 + Math.random() * 0.1, 'puff'); }
export function embers(W, x, y, col, n) { for (let i = 0; i < n; i++) part(W, x + (Math.random() - 0.5) * 0.12, y, (Math.random() - 0.5) * 0.35, -0.6 - Math.random() * 0.6, 0.6 + Math.random() * 0.5, col, 0.025 + Math.random() * 0.02, 'ember'); }
export function glints(W, x, y, col, n) { const k = n || 12; for (let i = 0; i < k; i++) { const a = i / k * TAU; part(W, x, y, Math.cos(a) * 1.6, Math.sin(a) * 1.6 - 0.4, 0.5, col, 0.05, 'ember'); } }
export function ring(W, x, y, col) { part(W, x, y, 0, 0, 0.6, col, 0.2, 'ring'); }

function spawnAmb(W, cx, cy) {
  const T = thOf(W), A = W.amb || (W.amb = []);
  if (A.length > 46) return;
  const x = cx + (Math.random() - 0.5) * 10, y = cy + (Math.random() - 0.5) * 14;
  if (x < 0 || y < 0 || x > W.MW || y > W.MH) return;
  const k = T.amb;
  if (k === 'snow') A.push({ k, x, y: cy - 7 + Math.random() * 2, vx: 0.15 + Math.random() * 0.2, vy: 0.5 + Math.random() * 0.4, life: 9, max: 9, r: 0.02 + Math.random() * 0.03, ph: Math.random() * 6 });
  else if (k === 'ember') A.push({ k, x, y: cy + 6, vx: (Math.random() - 0.5) * 0.2, vy: -0.5 - Math.random() * 0.5, life: 7, max: 7, r: 0.015 + Math.random() * 0.02, ph: Math.random() * 6 });
  else if (k === 'fly') A.push({ k, x, y, vx: 0, vy: 0, life: 6 + Math.random() * 4, max: 10, r: 0.03, ph: Math.random() * 6 });
  else if (k === 'mote') A.push({ k, x, y, vx: (Math.random() - 0.5) * 0.1, vy: -0.08 - Math.random() * 0.1, life: 7, max: 7, r: 0.02 + Math.random() * 0.02, ph: Math.random() * 6, col: CRY[Math.floor(Math.random() * 3)] });
  else A.push({ k: 'dust', x, y, vx: 0.05 + Math.random() * 0.08, vy: -0.03 + Math.random() * 0.06, life: 8, max: 8, r: 0.012 + Math.random() * 0.015, ph: Math.random() * 6 });
}
export function updateParts(W, dt, focus) {
  for (let i = W.parts.length - 1; i >= 0; i--) { const q = W.parts[i]; q.life -= dt; if (q.life <= 0) { W.parts.splice(i, 1); continue; } q.x += q.vx * dt; q.y += q.vy * dt; if (q.kind === 'ember') q.vx *= 0.98; else if (q.kind !== 'ring') { q.vx *= 0.94; q.vy *= 0.94; } }
  for (const kind of ['sun', 'moon']) { const p = W.p[kind]; if (alive(p) && Math.random() < dt * 9) { const fx2 = p.x + (p.dir === 'left' ? -0.2 : p.dir === 'right' ? 0.2 : p.dir === 'up' ? -0.21 : 0.21); embers(W, fx2, p.y - 0.72, kind === 'sun' ? '#FFB347' : '#9CCBFF', 1); } }
  const C = prepare(W);
  if (C.lava.length && Math.random() < dt * 6) { const lt = C.lava[Math.floor(Math.random() * C.lava.length)]; embers(W, lt[0] + 0.2 + Math.random() * 0.6, lt[1] + 0.5, '#FF9A3C', 1); }
  if (C.curtains.length && Math.random() < dt * 8) { const ct = C.curtains[Math.floor(Math.random() * C.curtains.length)]; if (W.map[ct[1]][ct[0]] === 'Z') embers(W, ct[0] + 0.2 + Math.random() * 0.6, ct[1] + 0.3, '#FFB347', 1); }
  if (W.braz) for (const k of ['F', 'N']) { const z = W.braz[k]; if (z.lit > 0 && Math.random() < dt * 14) embers(W, z.x + 0.5, z.y + 0.05, k === 'F' ? '#FFB347' : '#9CCBFF', 1); }
  if (W.vines.burn > 0 && !W.vines.done && Math.random() < dt * 40) { const [vx, vy] = W.vines.tiles[0] || [0, 0]; embers(W, vx + 0.2 + Math.random() * 0.6, vy + 0.2 + Math.random() * 0.6, '#FFB347', 1); }
  const A = W.amb || (W.amb = []);
  if (focus) { const rate = thOf(W).amb === 'snow' ? 14 : thOf(W).amb === 'fly' ? 3 : 6; if (Math.random() < dt * rate) spawnAmb(W, focus.x, focus.y); }
  for (let i = A.length - 1; i >= 0; i--) {
    const a = A[i]; a.life -= dt; a.ph += dt;
    if (a.life <= 0) { A.splice(i, 1); continue; }
    if (a.k === 'fly') { a.vx += (Math.sin(a.ph * 1.3) * 0.4 - a.vx) * dt * 2; a.vy += (Math.cos(a.ph * 0.9) * 0.3 - a.vy) * dt * 2; }
    if (a.k === 'snow') a.vx = 0.18 + Math.sin(a.ph * 1.5) * 0.15;
    a.x += a.vx * dt; a.y += a.vy * dt;
  }
}
function drawAmb(c, W, s, ox, oy) {
  const A = W.amb;
  if (!A || !A.length) return;
  c.save();
  for (const a of A) {
    const fade = Math.min(1, a.life / 1.2, (a.max - a.life) / 1.2);
    const x = ox + a.x * s, y = oy + a.y * s;
    if (a.k === 'snow') { c.globalAlpha = 0.8 * fade; c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(x, y, a.r * s, 0, TAU); c.fill(); }
    else if (a.k === 'dust') { c.globalAlpha = 0.45 * fade * (0.6 + Math.sin(a.ph * 2) * 0.4); c.fillStyle = '#FFE6B0'; c.beginPath(); c.arc(x, y, a.r * s, 0, TAU); c.fill(); }
    else {
      const col = a.k === 'fly' ? '#D8FF7A' : a.k === 'ember' ? '#FF9A3C' : a.col;
      const bl = a.k === 'fly' ? Math.max(0, Math.sin(a.ph * 2.6)) : 0.7 + Math.sin(a.ph * 3) * 0.3;
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = fade * bl;
      const g = c.createRadialGradient(x, y, 0, x, y, a.r * s * 5); g.addColorStop(0, rgba(col, 0.9)); g.addColorStop(1, rgba(col, 0));
      c.fillStyle = g; c.fillRect(x - a.r * s * 5, y - a.r * s * 5, a.r * s * 10, a.r * s * 10);
      c.globalCompositeOperation = 'source-over';
    }
  }
  c.restore();
}

function drawEmote(c, x, y, text, k, t) {
  const a = clamp(k, 0, 1);
  const pop = k < 0.2 ? 0.6 + k / 0.2 * 0.55 : k < 0.3 ? 1.15 - (k - 0.2) / 0.1 * 0.15 : 1;
  c.save(); c.globalAlpha = a > 0.85 ? (1 - a) / 0.15 : 1;
  c.translate(x, y - 6 - k * 26); c.scale(pop, pop);
  c.font = `34px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",${FF}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.shadowColor = 'rgba(0,0,0,0.45)'; c.shadowBlur = 8; c.shadowOffsetY = 3;
  c.fillText(text, 0, 0);
  c.restore();
}

const light = { cv: null, ctx: null };
export function render(ctx, W, V) {
  CW = W;
  const T = thOf(W);
  const { cw, ch, dpr, s, ox, oy, me, names, bubbles, stat, them } = V;
  const c = ctx, t = W.t;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.fillStyle = T.bg; c.fillRect(0, 0, cw, ch);
  if (stat) c.drawImage(stat, ox, oy, W.MW * s, W.MH * s);
  c.save(); c.translate(ox, oy);
  drawLava(c, s, t, W);
  drawPool(c, s, t, W, 'W', T.water);
  drawPool(c, s, t, W, 'P', T.goo);
  drawBridge(c, s, t, W);
  drawCrumble(c, s, t, W);
  drawSpikes(c, s, t, W);
  drawPads(c, s, t, W);
  drawFlags(c, s, t, W);
  drawPlates(c, s, t, W);
  drawTimed(c, s, t, W);
  drawGates(c, s, W);
  drawCodeDoor(c, s, W);
  drawGreat(c, s, W);
  drawExitDoors(c, s, t, W);
  const sc = T.sconce === 'frost' ? ['#F2FBFF', '#9FE0FF', '#4AA8FF'] : LOOK.sun.flame;
  if (T.sconce !== 'crystal') for (const [x, y] of prepare(W).sconces) flame(c, (x + 0.5) * s, (y + 0.67) * s, s * 0.3, sc, t, x * 3 + y);
  drawVines(c, s, t, W);
  for (const g of W.gems) drawGem(c, s, t, g);
  const ents = [];
  if (W.braz) { ents.push({ y: W.braz.F.y + 0.82, f: () => drawBrazier(c, s, t, W, 'F') }); ents.push({ y: W.braz.N.y + 0.82, f: () => drawBrazier(c, s, t, W, 'N') }); }
  Object.values(W.levers).forEach((l) => ents.push({ y: l.y + 0.6, f: () => drawLever(c, s, W, l) }));
  if (W.chest) ents.push({ y: W.chest.y + 0.85, f: () => drawChest(c, s, t, W) });
  for (const k of ['sun', 'moon']) { const p = W.p[k]; ents.push({ y: p.y, f: () => drawPlayer(c, s, t, p) }); }
  ents.sort((a, b) => a.y - b.y).forEach((e) => e.f());
  drawCurtains(c, s, t, W);
  c.restore();
  lighting(ctx, W, V, T);
  c.save(); c.translate(ox, oy);
  drawMural(c, s, W); drawDialHint(c, s, t, W, me); drawKey(c, s, t, W);
  for (const q of W.parts) {
    const a = Math.min(1, q.life / q.max * 1.6);
    c.globalAlpha = a;
    if (q.kind === 'ring') { const k = 1 - q.life / q.max; c.strokeStyle = q.col; c.lineWidth = Math.max(1.5, s * 0.05 * (1 - k)); c.beginPath(); c.ellipse(q.x * s, q.y * s, s * (0.2 + k * 0.9), s * (0.14 + k * 0.6), 0, 0, TAU); c.stroke(); continue; }
    c.fillStyle = q.col; c.beginPath(); c.arc(q.x * s, q.y * s, q.size * s * (q.kind === 'puff' ? 1 + (1 - q.life / q.max) : 1), 0, TAU); c.fill();
  }
  c.globalAlpha = 1;
  c.restore();
  drawAmb(c, W, s, ox, oy);
  for (const k of ['sun', 'moon']) {
    const p = W.p[k];
    if (!alive(p) && p.dead < 0.35) continue;
    const px = ox + p.x * s, py = oy + (p.y - 1.02) * s;
    nameTag(c, px, py, names[k], k === 'sun' ? '#FFCB7A' : '#A9CCFF');
    const b = bubbles[k];
    if (b) {
      if (b.emo) drawEmote(c, px, py - 6, b.text, b.t / b.life, t);
      else { const a = Math.min(1, b.t / 0.15, (b.life - b.t) / 0.3); if (a > 0) drawBubble(c, px, py - 20, b.text, clamp(a, 0, 1), cw); }
    }
  }
  if (them) {
    const p = W.p[them];
    const bx = ox + p.x * s, by = oy + (p.y - 0.5) * s, m = 34, top = V.safeTop || 120, bot = ch - (V.safeBottom || 170);
    const off = bx < m || bx > cw - m || by < top || by > bot;
    if (off && alive(p)) {
      const ix = clamp(bx, m, cw - m), iy = clamp(by, top, bot), ang = Math.atan2(by - iy, bx - ix);
      c.save(); c.translate(ix, iy);
      c.fillStyle = 'rgba(10,8,16,0.72)'; c.beginPath(); c.arc(0, 0, 19, 0, TAU); c.fill();
      c.fillStyle = them === 'moon' ? '#3E7FD6' : '#E59238'; c.beginPath(); c.arc(0, 0, 15, 0, TAU); c.fill();
      glyph(c, them, 0, 0, 16, '#FFFFFF', 2.2);
      c.rotate(ang); c.fillStyle = them === 'moon' ? '#A9CCFF' : '#FFCB7A'; c.beginPath(); c.moveTo(27, 0); c.lineTo(20, -6); c.lineTo(20, 6); c.closePath(); c.fill();
      c.restore();
    }
    V.offscreen = off;
  }
}
function lighting(ctx, W, V, T) {
  const { cw, ch, s, ox, oy } = V;
  const k = 0.5;
  if (!light.cv) { light.cv = document.createElement('canvas'); light.ctx = light.cv.getContext('2d'); }
  const lw = Math.ceil(cw * k), lh = Math.ceil(ch * k);
  if (light.cv.width !== lw || light.cv.height !== lh) { light.cv.width = lw; light.cv.height = lh; }
  const L = light.ctx, t = W.t;
  L.setTransform(1, 0, 0, 1, 0, 0); L.globalCompositeOperation = 'source-over';
  L.clearRect(0, 0, lw, lh);
  L.fillStyle = T.dark; L.fillRect(0, 0, lw, lh);
  L.globalCompositeOperation = 'destination-out';
  const hole = (wx, wy, R, a) => { const x = (ox + wx * s) * k, y = (oy + wy * s) * k, r = R * s * k; if (x < -r || y < -r || x > lw + r || y > lh + r) return; const g = L.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(0.5, `rgba(0,0,0,${a * 0.7})`); g.addColorStop(1, 'rgba(0,0,0,0)'); L.fillStyle = g; L.fillRect(x - r, y - r, r * 2, r * 2); };
  const fl = (i) => 1 + Math.sin(t * 9 + i) * 0.03 + Math.sin(t * 23 + i * 2) * 0.02;
  for (const kk of ['sun', 'moon']) { const p = W.p[kk]; if (alive(p) || p.dead > 0.5) hole(p.x, p.y - 0.6, (kk === 'moon' ? LIGHT_R + 0.7 : 3.4) * fl(kk === 'sun' ? 1 : 2), 1); }
  const C = prepare(W);
  C.sconces.forEach(([x, y], i) => hole(x + 0.5, y + 0.9, 2.4 * fl(i + 3), 0.9));
  if (W.braz) for (const kk of ['F', 'N']) if (W.braz[kk].lit > 0) hole(W.braz[kk].x + 0.5, W.braz[kk].y + 0.4, 4.4 * fl(7), 1);
  for (const [x, y] of C.lava) hole(x + 0.5, y + 0.5, 1.5, 0.75);
  for (const [x, y] of C.goo) hole(x + 0.5, y + 0.5, 1.1, 0.45);
  for (const [x, y] of C.pads) hole(x + 0.5, y + 0.55, 1.3, 0.7);
  for (const [x, y] of C.curtains) hole(x + 0.5, y + 0.4, 1.8, 0.8);
  for (const [x, y, r, , a] of C.glows) hole(x, y, r * (0.9 + Math.sin(t * 1.7 + x * 3 + y) * 0.1), Math.min(0.7, a * 2));
  if (W.great.amt > 0.1 && C.E.length) hole(C.E[0][0] + 1.5, C.E[0][1] - 1, 3.2 * W.great.amt, 0.8);
  for (const kk of ['sun', 'moon']) if (W.exits[kk]) hole(W.exits[kk].x + 0.5, W.exits[kk].y + 0.5, 1.2, 0.6);
  if (W.muralAt && W.mural > 0.1) hole(W.muralAt.x + 0.5, W.muralAt.y + 0.8, 1.5 * W.mural, 0.6);
  for (const g of W.gems) if (!g.taken) hole(g.x + 0.5, g.y + 0.4, 0.9, 0.5);
  if (W.key && !W.key.used && !W.key.held) hole(W.key.x, W.key.y - 0.2, 1.1, 0.7);
  for (const [x, y] of C.plates) hole(x + 0.5, y + 0.5, 0.8, 0.35);
  ctx.drawImage(light.cv, 0, 0, cw, ch);
  const c = ctx;
  c.save(); c.globalCompositeOperation = 'lighter';
  const glow = (wx, wy, R, col, a) => { const x = ox + wx * s, y = oy + wy * s, r = R * s; if (x < -r || y < -r || x > cw + r || y > ch + r) return; const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); };
  for (const kk of ['sun', 'moon']) { const p = W.p[kk]; if (alive(p)) glow(p.x, p.y - 0.7, 2.4, LOOK[kk].light, 0.2 * fl(5)); }
  const scol = T.sconce === 'frost' ? '#7FC8FF' : T.sconce === 'crystal' ? '#7FE3FF' : '#FF9A3C';
  C.sconces.forEach(([x, y], i) => glow(x + 0.5, y + 0.6, 1.6, scol, 0.16 * fl(i)));
  if (W.braz) { if (W.braz.F.lit > 0) glow(W.braz.F.x + 0.5, W.braz.F.y + 0.2, 3, '#FF9A3C', 0.3 * fl(8)); if (W.braz.N.lit > 0) glow(W.braz.N.x + 0.5, W.braz.N.y + 0.2, 3, '#5E9BFF', 0.3 * fl(9)); }
  if (C.lava.length) { const [x, y] = C.lava[Math.floor(C.lava.length / 2)]; glow(x + 0.5, y + 0.5, 2.6, '#FF7A1F', 0.14 * fl(2)); }
  for (const [x, y] of C.pads) glow(x + 0.5, y + 0.55, 1.2, padColor(W.map[y][x]), 0.22 * fl(x));
  for (const [x, y] of C.curtains) glow(x + 0.5, y + 0.4, 1.6, W.map[y][x] === 'Z' ? '#FF7A2A' : '#6FB8FF', 0.22 * fl(y));
  for (const [x, y, r, col, a] of C.glows) glow(x, y, r, col, a * (0.85 + Math.sin(t * 1.7 + x * 3 + y) * 0.15));
  c.restore();
}

export { glyph, flame, LOOK, drawExplorer, gemShape, rr, rgba, shade };
