import { audioCtx, audioOut, soundOn } from './kit.jsx';

export function rng(seed) {
  const str = String(seed == null ? 'z' : seed);
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
}

export function shuffle(arr, rnd) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const r2 = (v) => Math.round(v * 100) / 100;
export const easeOut = (t) => 1 - (1 - t) * (1 - t) * (1 - t);
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2);
export const easeBack = (t) => { const c = 1.70158; const u = t - 1; return 1 + (c + 1) * u * u * u + c * u * u; };

export function dpr(cap = 2.5) {
  return Math.min(cap, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
}

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return c;
}

export function fitCanvas(cv, w, h, cap) {
  const d = dpr(cap);
  const pw = Math.max(1, Math.round(w * d));
  const ph = Math.max(1, Math.round(h * d));
  if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
  cv.style.width = `${w}px`;
  cv.style.height = `${h}px`;
  const ctx = cv.getContext('2d');
  ctx.setTransform(d, 0, 0, d, 0, 0);
  return { ctx, d };
}

export function hexRgb(c) {
  const h = String(c).replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((x) => x + x).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function mix(a, b, t) {
  const x = hexRgb(a); const y = hexRgb(b);
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
}
export const shade = (c, t) => mix(c, '#000000', t);
export const tint = (c, t) => mix(c, '#FFFFFF', t);
export function rgba(c, a) { const [r, g, b] = hexRgb(c); return `rgba(${r},${g},${b},${a})`; }

export function rrect(ctx, x, y, w, h, r) {
  const k = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + k, y);
  ctx.arcTo(x + w, y, x + w, y + h, k);
  ctx.arcTo(x + w, y + h, x, y + h, k);
  ctx.arcTo(x, y + h, x, y, k);
  ctx.arcTo(x, y, x + w, y, k);
  ctx.closePath();
}

export function grain(w, h, seed, opts) {
  const o = opts || {};
  const c = makeCanvas(w, h);
  const g = c.getContext('2d');
  const img = g.createImageData(c.width, c.height);
  const d = img.data;
  const rnd = rng(seed);
  const amp = o.amp == null ? 18 : o.amp;
  const base = o.base == null ? 128 : o.base;
  for (let i = 0; i < d.length; i += 4) {
    const v = base + (rnd() - 0.5) * 2 * amp;
    d[i] = v; d[i + 1] = v; d[i + 2] = v; d[i + 3] = o.alpha == null ? 255 : o.alpha;
  }
  g.putImageData(img, 0, 0);
  return c;
}

export function woodTexture(w, h, seed, palette, opts) {
  const o = opts || {};
  const c = makeCanvas(w, h);
  const g = c.getContext('2d');
  const rnd = rng(seed);
  const [base, dark, light] = palette;
  const vertical = !!o.vertical;
  const len = vertical ? h : w;
  const across = vertical ? w : h;
  const lg = vertical ? g.createLinearGradient(0, 0, w, 0) : g.createLinearGradient(0, 0, 0, h);
  lg.addColorStop(0, shade(base, 0.08));
  lg.addColorStop(0.5, base);
  lg.addColorStop(1, shade(base, 0.12));
  g.fillStyle = lg;
  g.fillRect(0, 0, w, h);
  const lines = Math.max(8, Math.round(across / (o.spacing || 3.2)));
  for (let i = 0; i < lines; i++) {
    const p = (i + rnd() * 0.8) * (across / lines);
    const amp = 0.6 + rnd() * (o.wave || 2.2);
    const freq = (0.6 + rnd() * 1.8) / len * Math.PI * 2;
    const ph = rnd() * 6.28;
    const dk = rnd() < 0.55;
    g.strokeStyle = rgba(dk ? dark : light, (dk ? 0.16 : 0.1) + rnd() * 0.16);
    g.lineWidth = 0.5 + rnd() * (o.thick || 1.6);
    g.beginPath();
    for (let s = 0; s <= len; s += 6) {
      const q = p + Math.sin(s * freq + ph) * amp + Math.sin(s * freq * 3.1 + ph * 2) * amp * 0.25;
      if (vertical) { if (s === 0) g.moveTo(q, s); else g.lineTo(q, s); } else if (s === 0) g.moveTo(s, q); else g.lineTo(s, q);
    }
    g.stroke();
  }
  const knots = o.knots == null ? 2 : o.knots;
  for (let k = 0; k < knots; k++) {
    const kx = rnd() * w; const ky = rnd() * h; const kr = 4 + rnd() * 9;
    for (let r = kr; r > 1; r -= 1.6) {
      g.strokeStyle = rgba(dark, 0.08 + (1 - r / kr) * 0.14);
      g.lineWidth = 0.8;
      g.beginPath();
      if (vertical) g.ellipse(kx, ky, r * 0.55, r * 1.6, 0, 0, Math.PI * 2); else g.ellipse(kx, ky, r * 1.6, r * 0.55, 0, 0, Math.PI * 2);
      g.stroke();
    }
  }
  const n = grain(w, h, `${seed}n`, { amp: 26, alpha: 40 });
  g.globalCompositeOperation = 'overlay';
  g.drawImage(n, 0, 0);
  g.globalCompositeOperation = 'source-over';
  return c;
}

export function perfMeter() {
  const s = { frames: 0, dur: 0, last: 0, worst: 0, gaps: [], work: [], slow: [], t0: 0 };
  const q = (arr, p) => { if (!arr.length) return 0; const a = arr.slice().sort((x, y) => x - y); return Math.round(a[Math.min(a.length - 1, Math.floor(a.length * p))] * 100) / 100; };
  return {
    reset() { s.frames = 0; s.dur = 0; s.last = 0; s.worst = 0; s.gaps = []; s.work = []; s.slow = []; s.t0 = 0; },
    tick(t) { if (!s.t0) s.t0 = t; if (!s.last) { s.last = t; return; } const g = t - s.last; s.last = t; s.frames += 1; s.dur += g; if (g > s.worst) s.worst = g; if (s.gaps.length < 6000) s.gaps.push(g); if (g > 34 && s.slow.length < 40) s.slow.push([Math.round(t - s.t0), Math.round(g)]); },
    work(ms) { if (s.work.length < 6000) s.work.push(ms); },
    report() { return { frames: s.frames, fps: s.dur > 0 ? Math.round((s.frames * 1000 / s.dur) * 10) / 10 : 0, worstGap: Math.round(s.worst * 10) / 10, gapP95: q(s.gaps, 0.95), workMed: q(s.work, 0.5), workP95: q(s.work, 0.95), workMax: q(s.work, 1), slow: s.slow }; },
  };
}

export function rafLoop(fn) {
  let id = 0;
  let alive = true;
  const run = (t) => { if (!alive) return; id = requestAnimationFrame(run); fn(t); };
  id = requestAnimationFrame(run);
  return () => { alive = false; cancelAnimationFrame(id); };
}

const noiseBufs = new Map();
export function noiseBuffer(c, secs, kind) {
  const key = `${kind || 'w'}:${secs}`;
  if (noiseBufs.has(key) && noiseBufs.get(key).sampleRate === c.sampleRate) return noiseBufs.get(key);
  const len = Math.max(1, Math.floor(c.sampleRate * secs));
  const b = c.createBuffer(1, len, c.sampleRate);
  const d = b.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (kind === 'b') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else if (kind === 'p') { last = 0.97 * last + 0.03 * w; d[i] = last * 6 + w * 0.2; } else d[i] = w;
  }
  noiseBufs.set(key, b);
  return b;
}

export function env(g, t, a, peak, dec, hold) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + a);
  if (hold) g.gain.setValueAtTime(peak, t + a + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + (hold || 0) + dec);
}

export function noiseHit(c, out, { t0, freq = 2000, q = 2, type = 'bandpass', gain = 0.4, attack = 0.001, decay = 0.05, len, kind, pan } = {}) {
  const t = t0 == null ? c.currentTime : t0;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, len || 0.5, kind);
  src.playbackRate.value = 0.9 + Math.random() * 0.2;
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = c.createGain();
  env(g, t, attack, gain, decay);
  let node = src.connect(f).connect(g);
  if (pan != null && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); node = node.connect(p); }
  node.connect(out);
  const off = Math.random() * 0.3;
  src.start(t, off);
  src.stop(t + attack + decay + 0.05);
}

export function tone(c, out, { t0, freq = 440, to, type = 'sine', gain = 0.2, attack = 0.004, decay = 0.2, hold, pan, detune } = {}) {
  const t = t0 == null ? c.currentTime : t0;
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (detune) o.detune.value = detune;
  if (to) o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + attack + (hold || 0) + decay);
  const g = c.createGain();
  env(g, t, attack, gain, decay, hold);
  let node = o.connect(g);
  if (pan != null && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); node = node.connect(p); }
  node.connect(out);
  o.start(t);
  o.stop(t + attack + (hold || 0) + decay + 0.05);
}

export function soundReady() {
  if (!soundOn()) return null;
  const c = audioCtx();
  const out = audioOut();
  if (!c || !out) return null;
  return { c, out };
}

export function loopNoise(kind, filterFreq, q) {
  let node = null;
  return {
    set(level, freq) {
      const a = soundReady();
      if (!a) { if (node) { try { node.g.gain.setTargetAtTime(0, node.c.currentTime, 0.05); } catch {} } return; }
      const { c, out } = a;
      if (!node) {
        const src = c.createBufferSource();
        src.buffer = noiseBuffer(c, 2, kind || 'b');
        src.loop = true;
        const f = c.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.value = filterFreq || 400;
        f.Q.value = q || 0.7;
        const g = c.createGain();
        g.gain.value = 0;
        src.connect(f).connect(g).connect(out);
        src.start();
        node = { src, f, g, c };
      }
      node.g.gain.setTargetAtTime(Math.max(0, level), c.currentTime, 0.06);
      if (freq) node.f.frequency.setTargetAtTime(freq, c.currentTime, 0.08);
    },
    stop() {
      if (!node) return;
      const n = node;
      node = null;
      try { n.g.gain.setTargetAtTime(0, n.c.currentTime, 0.04); n.src.stop(n.c.currentTime + 0.3); } catch {}
    },
  };
}
