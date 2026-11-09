import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { GameRoom, defineSfx, sfx, haptic, useGameKit, audioCtx, audioOut, musicOn } from './kit.jsx';
import { clamp, makeCanvas, fitCanvas, grain, rrect, rng, noiseHit, tone, shade, tint, perfMeter } from './physics.jsx';
import { readBest, writeBest, noteSoloScore, g1Test, FONT, GAME_RULES } from '../App.jsx';

export const BLOB_KEY = 'squish';
const W0 = 360;
const H0 = 640;
const LINE = 104;
const G = 1750;
const H = 1 / 120;
const DAMP = 0.992;
const TIERS = 13;
const RAD = Array.from({ length: TIERS }, (_, k) => 16.5 * 1.2 ** k);
const COLS = ['#FF5A5F', '#FF9F1C', '#FFD23F', '#9BE15D', '#2EC4B6', '#3A86FF', '#8A4DFF', '#FF2E88', '#FB6A1B', '#14D3A0', '#1C9BD6', '#F45BB8', '#FFC93C'];
const OUTLINE = '#1E1430';
const SHADES = COLS.map((c) => shade(c, 0.22));
let SHINE_CV = null;
function SHINE() {
  if (SHINE_CV) return SHINE_CV;
  const cv = makeCanvas(64, 44);
  const g = cv.getContext('2d');
  g.translate(32, 22);
  g.rotate(-0.42);
  const gr = g.createRadialGradient(0, 0, 1, 0, 0, 26);
  gr.addColorStop(0, 'rgba(255,255,255,0.62)');
  gr.addColorStop(0.55, 'rgba(255,255,255,0.28)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.beginPath(); g.ellipse(0, 0, 26, 13, 0, 0, Math.PI * 2); g.fill();
  SHINE_CV = cv;
  return cv;
}
const val = (k) => 2 ** k;

defineSfx('blobDrop', (c, out, o) => { tone(c, out, { freq: 720, to: 340, gain: 0.1, decay: 0.09, pan: o.pan }); noiseHit(c, out, { freq: 1600, q: 1.5, gain: 0.04, decay: 0.04, pan: o.pan }); });
defineSfx('blobBump', (c, out, o) => {
  const v = clamp(o.v == null ? 0.4 : o.v, 0.05, 1);
  const f = 150 + (o.small || 0) * 90;
  tone(c, out, { freq: f * 1.4, to: f, gain: 0.06 + v * 0.14, decay: 0.12 + v * 0.06, pan: o.pan });
  noiseHit(c, out, { freq: 420, q: 0.8, type: 'lowpass', gain: 0.03 + v * 0.08, decay: 0.08, kind: 'p', pan: o.pan });
});
const PENTA = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51, 1567.98];
defineSfx('blobMerge', (c, out, o) => {
  const k = clamp(o.k || 1, 1, 13);
  const t = c.currentTime;
  tone(c, out, { t0: t, freq: 260 + k * 20, to: 900 + k * 60, gain: 0.08, decay: 0.07, pan: o.pan });
  noiseHit(c, out, { t0: t, freq: 800, q: 0.7, type: 'lowpass', gain: 0.06, decay: 0.06, kind: 'p', pan: o.pan });
  const f = PENTA[Math.min(PENTA.length - 1, k - 1)];
  tone(c, out, { t0: t + 0.03, freq: f, gain: 0.11, decay: 0.45 + k * 0.03, type: 'triangle', pan: o.pan });
  tone(c, out, { t0: t + 0.03, freq: f * 2, gain: 0.03, decay: 0.3, type: 'sine', pan: o.pan });
});
defineSfx('blobWarn', (c, out) => { tone(c, out, { freq: 880, gain: 0.05, decay: 0.08, type: 'sine' }); });
defineSfx('blobOver', (c, out) => { [523.25, 440, 349.23, 261.63].forEach((f, i) => tone(c, out, { t0: c.currentTime + i * 0.16, freq: f, gain: 0.1, decay: 0.5, type: 'triangle' })); });

class Blob {
  constructor(k, x, y, id, sc) {
    this.id = id;
    this.k = k;
    this.r = RAD[k];
    this.n = clamp(Math.round((Math.PI * 2 * this.r) / 8.2), 12, 34);
    const n = this.n;
    this.px = new Float64Array(n); this.py = new Float64Array(n);
    this.ox = new Float64Array(n); this.oy = new Float64Array(n);
    this.rx = new Float64Array(n); this.ry = new Float64Array(n);
    this.sc = sc == null ? 1 : sc;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      this.rx[i] = Math.cos(a) * this.r; this.ry[i] = Math.sin(a) * this.r;
      this.px[i] = x + this.rx[i] * this.sc; this.py[i] = y + this.ry[i] * this.sc;
      this.ox[i] = this.px[i]; this.oy[i] = this.py[i];
    }
    this.area0 = 0.5 * n * this.r * this.r * Math.sin((Math.PI * 2) / n);
    this.edge0 = 2 * this.r * Math.sin(Math.PI / n);
    this.cx = x; this.cy = y; this.ang = 0; this.cs = 1; this.sn = 0;
    this.age = 0;
    this.gone = false;
    this.flash = 0;
  }

  centre() {
    let sx = 0; let sy = 0;
    for (let i = 0; i < this.n; i++) { sx += this.px[i]; sy += this.py[i]; }
    this.cx = sx / this.n; this.cy = sy / this.n;
  }

  kick(vx, vy) {
    for (let i = 0; i < this.n; i++) { this.ox[i] = this.px[i] - vx * H; this.oy[i] = this.py[i] - vy * H; }
  }

  vel() {
    let vx = 0; let vy = 0;
    for (let i = 0; i < this.n; i++) { vx += this.px[i] - this.ox[i]; vy += this.py[i] - this.oy[i]; }
    return [vx / this.n / H, vy / this.n / H];
  }

  shape(ks, kp) {
    const n = this.n; const px = this.px; const py = this.py;
    this.centre();
    const cx = this.cx; const cy = this.cy;
    let s = 0; let c = 0;
    for (let i = 0; i < n; i++) { const dx = px[i] - cx; const dy = py[i] - cy; s += this.rx[i] * dy - this.ry[i] * dx; c += this.rx[i] * dx + this.ry[i] * dy; }
    const l = Math.sqrt(s * s + c * c) || 1;
    const cs = c / l; const sn = s / l;
    this.cs = cs; this.sn = sn; this.ang = Math.atan2(sn, cs);
    const sc = this.sc;
    for (let i = 0; i < n; i++) {
      const gx = cx + (cs * this.rx[i] - sn * this.ry[i]) * sc;
      const gy = cy + (sn * this.rx[i] + cs * this.ry[i]) * sc;
      px[i] += (gx - px[i]) * ks; py[i] += (gy - py[i]) * ks;
    }
    let area = 0; let per = 0;
    for (let i = 0; i < n; i++) {
      const j = i + 1 === n ? 0 : i + 1;
      area += px[i] * py[j] - px[j] * py[i];
      const ex = px[j] - px[i]; const ey = py[j] - py[i];
      per += Math.sqrt(ex * ex + ey * ey);
    }
    area *= 0.5;
    const d = (kp * (this.area0 * sc * sc - area)) / (per || 1);
    for (let i = 0; i < n; i++) {
      const a = i === 0 ? n - 1 : i - 1; const b = i + 1 === n ? 0 : i + 1;
      let nx = py[b] - py[a]; let ny = -(px[b] - px[a]);
      const nl = Math.sqrt(nx * nx + ny * ny) || 1;
      nx /= nl; ny /= nl;
      px[i] += nx * d; py[i] += ny * d;
    }
    const L = this.edge0 * sc;
    for (let i = 0; i < n; i++) {
      const j = i + 1 === n ? 0 : i + 1;
      const ex = px[j] - px[i]; const ey = py[j] - py[i];
      const el = Math.sqrt(ex * ex + ey * ey) || 1;
      const k = ((el - L) / el) * 0.25;
      px[i] += ex * k; py[i] += ey * k; px[j] -= ex * k; py[j] -= ey * k;
    }
  }

  top() {
    let m = Infinity;
    for (let i = 0; i < this.n; i++) if (this.py[i] < m) m = this.py[i];
    return m;
  }
}

const TAU = Math.PI * 2;
function pushInto(A, B, out) {
  const n = B.n; const bx = B.cx; const by = B.cy;
  const reach = B.r * B.sc * 1.3;
  const reach2 = reach * reach;
  let hit = 0;
  for (let i = 0; i < A.n; i++) {
    const dx = A.px[i] - bx; const dy = A.py[i] - by;
    const d2 = dx * dx + dy * dy;
    if (d2 > reach2) continue;
    const d = Math.sqrt(d2) || 0.0001;
    let a = Math.atan2(dy, dx) - B.ang;
    a -= Math.floor(a / TAU) * TAU;
    const f = (a / TAU) * n;
    const j = Math.floor(f) % n; const k = (j + 1) % n; const t = f - Math.floor(f);
    const qx = B.px[j] + (B.px[k] - B.px[j]) * t; const qy = B.py[j] + (B.py[k] - B.py[j]) * t;
    const rho = Math.sqrt((qx - bx) * (qx - bx) + (qy - by) * (qy - by));
    if (d >= rho) continue;
    const pen = rho - d;
    const ux = dx / d; const uy = dy / d;
    const ma = A.r * A.r; const mb = B.r * B.r;
    const wa = mb / (ma + mb); const wb = ma / (ma + mb);
    A.px[i] += ux * pen * wa; A.py[i] += uy * pen * wa;
    B.px[j] -= ux * pen * wb * (1 - t); B.py[j] -= uy * pen * wb * (1 - t);
    B.px[k] -= ux * pen * wb * t; B.py[k] -= uy * pen * wb * t;
    const tx = -uy; const ty = ux;
    const va = (A.px[i] - A.ox[i]) * tx + (A.py[i] - A.oy[i]) * ty;
    const vb = (B.px[j] - B.ox[j]) * tx + (B.py[j] - B.oy[j]) * ty;
    const rel = (va - vb) * 0.18;
    A.ox[i] += tx * rel; A.oy[i] += ty * rel;
    if (pen > hit) hit = pen;
  }
  if (hit > 0 && out) out.push(hit);
  return hit;
}

export class BlobWorld {
  constructor(seed) {
    this.blobs = [];
    this.nextId = 1;
    this.t = 0;
    this.score = 0;
    this.events = [];
    this.rings = [];
    this.danger = 0;
    this.over = false;
    this.rnd = rng(seed || `squish${Date.now()}`);
    this.queue = [this.pick(), this.pick(), this.pick(), this.pick()];
    this.best = 0;
  }

  pick() {
    const r = this.rnd();
    return r < 0.3 ? 0 : r < 0.6 ? 1 : r < 0.85 ? 2 : 3;
  }

  current() { return this.queue[0]; }

  drop(x) {
    if (this.over) return null;
    const k = this.queue.shift();
    this.queue.push(this.pick());
    const r = RAD[k];
    const b = new Blob(k, clamp(x, r + 2, W0 - r - 2), LINE - r - 10, this.nextId++);
    b.kick(0, 60);
    this.blobs.push(b);
    this.events.push({ k: 'drop', x: b.cx });
    return b;
  }

  merge(a, b) {
    a.gone = true; b.gone = true;
    const ma = a.r * a.r; const mb = b.r * b.r;
    a.centre(); b.centre();
    const x = (a.cx * ma + b.cx * mb) / (ma + mb); const y = (a.cy * ma + b.cy * mb) / (ma + mb);
    const [vax, vay] = a.vel(); const [vbx, vby] = b.vel();
    const k = a.k + 1;
    if (k >= TIERS) {
      this.score += val(k);
      this.rings.push({ x, y, r: a.r, col: COLS[TIERS - 1], t: 0, big: true });
      this.events.push({ k: 'merge', tier: k, x });
      return;
    }
    const nb = new Blob(k, x, y, this.nextId++, 0.72);
    nb.kick((vax * ma + vbx * mb) / (ma + mb) * 0.6, (vay * ma + vby * mb) / (ma + mb) * 0.6 - 60);
    nb.flash = 1;
    nb.age = 2;
    this.blobs.push(nb);
    this.score += val(k);
    this.rings.push({ x, y, r: RAD[k], col: COLS[k], t: 0 });
    this.events.push({ k: 'merge', tier: k, x });
  }

  step() {
    const bl = this.blobs;
    const n = bl.length;
    for (let b = 0; b < n; b++) {
      const B = bl[b];
      if (B.sc < 1) B.sc = Math.min(1, B.sc + H * 1.6);
      B.age += H;
      if (B.flash > 0) B.flash = Math.max(0, B.flash - H * 3);
      for (let i = 0; i < B.n; i++) {
        const vx = (B.px[i] - B.ox[i]) * DAMP; const vy = (B.py[i] - B.oy[i]) * DAMP;
        B.ox[i] = B.px[i]; B.oy[i] = B.py[i];
        B.px[i] += vx; B.py[i] += vy + G * H * H;
      }
    }
    const merges = [];
    const hits = [];
    for (let it = 0; it < 3; it++) {
      for (let b = 0; b < n; b++) bl[b].shape(it === 0 ? 0.075 : 0.035, 0.95);
      for (let a = 0; a < n; a++) {
        const A = bl[a];
        if (A.gone) continue;
        for (let b = a + 1; b < n; b++) {
          const B = bl[b];
          if (B.gone) continue;
          const dx = B.cx - A.cx; const dy = B.cy - A.cy;
          const rr = (A.r * A.sc + B.r * B.sc) * 1.12;
          const dd2 = dx * dx + dy * dy;
          if (dd2 > rr * rr) continue;
          const core = (A.r * A.sc + B.r * B.sc) * 0.66;
          if (dd2 < core * core) {
            const dd = Math.sqrt(dd2) || 0.001;
            const ux = dd2 > 0 ? dx / dd : 0; const uy = dd2 > 0 ? dy / dd : -1;
            const ma = A.r * A.r; const mb = B.r * B.r;
            const push = (core - dd) * 0.5;
            const pa = push * (mb / (ma + mb)); const pb = push * (ma / (ma + mb));
            for (let i = 0; i < A.n; i++) { A.px[i] -= ux * pa; A.py[i] -= uy * pa; }
            for (let i = 0; i < B.n; i++) { B.px[i] += ux * pb; B.py[i] += uy * pb; }
            A.cx -= ux * pa; A.cy -= uy * pa; B.cx += ux * pb; B.cy += uy * pb;
          }
          const before = hits.length;
          const h1 = pushInto(A, B, it === 0 ? hits : null);
          const h2 = pushInto(B, A, it === 0 ? hits : null);
          if (A.k === B.k && (h1 > 0.6 || h2 > 0.6) && !A.gone && !B.gone && !merges.some(([x, y]) => x === A || y === A || x === B || y === B)) merges.push([A, B]);
          if (it === 0 && hits.length > before) { const [vax, vay] = A.vel(); const [vbx, vby] = B.vel(); const rv = Math.hypot(vax - vbx, vay - vby); if (rv > 140 && (A.age < 2 || B.age < 2)) this.events.push({ k: 'bump', v: rv, x: (A.cx + B.cx) / 2, small: 12 - Math.max(A.k, B.k) }); }
        }
      }
      for (let b = 0; b < n; b++) {
        const B = bl[b];
        for (let i = 0; i < B.n; i++) {
          if (B.px[i] < 2) { B.px[i] = 2; B.oy[i] += (B.py[i] - B.oy[i]) * 0.15; }
          else if (B.px[i] > W0 - 2) { B.px[i] = W0 - 2; B.oy[i] += (B.py[i] - B.oy[i]) * 0.15; }
          if (B.py[i] > H0 - 2) {
            if (it === 0 && B.py[i] - B.oy[i] > 6 && B.age < 3) this.events.push({ k: 'floor', v: (B.py[i] - B.oy[i]) / H, x: B.px[i], small: 12 - B.k });
            B.py[i] = H0 - 2;
            B.ox[i] += (B.px[i] - B.ox[i]) * 0.2;
          }
        }
      }
    }
    merges.forEach(([a, b]) => this.merge(a, b));
    if (merges.length) this.blobs = this.blobs.filter((b) => !b.gone);
    this.rings.forEach((r) => { r.t += H; });
    this.rings = this.rings.filter((r) => r.t < 0.5);
    this.t += H;
    let over = false;
    for (const B of this.blobs) if (B.age > 1.4 && B.top() < LINE) { over = true; break; }
    this.danger = over ? this.danger + H : Math.max(0, this.danger - H * 2);
    if (this.danger > 2.6) this.over = true;
  }
}

function blobPath(ctx, B, s, ox, oy, inset) {
  const n = B.n;
  const k = inset || 0;
  const X = (i) => ox + (B.px[i] + (B.cx - B.px[i]) * k) * s;
  const Y = (i) => oy + (B.py[i] + (B.cy - B.py[i]) * k) * s;
  ctx.beginPath();
  let mx = (X(n - 1) + X(0)) / 2; let my = (Y(n - 1) + Y(0)) / 2;
  ctx.moveTo(mx, my);
  for (let i = 0; i < n; i++) {
    const j = i + 1 === n ? 0 : i + 1;
    mx = (X(i) + X(j)) / 2; my = (Y(i) + Y(j)) / 2;
    ctx.quadraticCurveTo(X(i), Y(i), mx, my);
  }
  ctx.closePath();
}

const LABELS = new Map();
function label(v, px, d) {
  const size = Math.max(8, Math.round(px / 2) * 2);
  const key = `${v}:${size}:${d}`;
  if (LABELS.has(key)) return LABELS.get(key);
  const text = String(v);
  const w = Math.ceil(size * (0.62 * text.length + 0.6)) + 8; const h = Math.ceil(size * 1.4) + 6;
  const cv = makeCanvas(w * d, h * d);
  const g = cv.getContext('2d');
  g.scale(d, d);
  g.font = `900 ${size}px -apple-system, BlinkMacSystemFont, 'SF Pro Rounded', 'Segoe UI', Roboto, sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineJoin = 'round';
  g.lineWidth = Math.max(2.5, size * 0.17);
  g.strokeStyle = OUTLINE;
  g.strokeText(text, w / 2, h / 2 + size * 0.05);
  g.fillStyle = '#FFFFFF';
  g.fillText(text, w / 2, h / 2 + size * 0.05);
  const out = { cv, w, h };
  if (LABELS.size > 160) LABELS.clear();
  LABELS.set(key, out);
  return out;
}

function jarLayout(Wc, Hc) {
  const pad = 12;
  const s = Math.min((Wc - pad * 2) / W0, (Hc - pad * 2 - 6) / H0);
  const w = W0 * s; const h = H0 * s;
  return { s, ox: (Wc - w) / 2, oy: Hc - h - pad, w, h, Wc, Hc };
}

const JARS = new Map();
function jarArt(L, d) {
  const key = `${L.Wc}x${L.Hc}@${d}`;
  if (JARS.has(key)) return JARS.get(key);
  const cv = makeCanvas(L.Wc * d, L.Hc * d);
  const g = cv.getContext('2d');
  g.scale(d, d);
  const { ox, oy, w, h, s } = L;
  g.save();
  g.shadowColor = 'rgba(0,0,0,0.55)';
  g.shadowBlur = 22;
  g.shadowOffsetY = 10;
  g.fillStyle = '#120D1E';
  rrect(g, ox - 8, oy - 8, w + 16, h + 14, 26);
  g.fill();
  g.restore();
  const glass = g.createLinearGradient(ox, 0, ox + w, 0);
  glass.addColorStop(0, '#1C1530');
  glass.addColorStop(0.5, '#151027');
  glass.addColorStop(1, '#1A1330');
  g.fillStyle = glass;
  rrect(g, ox, oy, w, h, 20);
  g.fill();
  g.save();
  rrect(g, ox, oy, w, h, 20);
  g.clip();
  const noise = grain(120, 120, 'jar', { amp: 22 });
  const pat = g.createPattern(noise, 'repeat');
  g.globalAlpha = 0.06;
  g.fillStyle = pat;
  g.fillRect(ox, oy, w, h);
  g.globalAlpha = 1;
  const floor = g.createLinearGradient(0, oy + h - 70 * s, 0, oy + h);
  floor.addColorStop(0, 'rgba(255,255,255,0)');
  floor.addColorStop(1, 'rgba(255,255,255,0.05)');
  g.fillStyle = floor;
  g.fillRect(ox, oy + h - 70 * s, w, 70 * s);
  g.restore();
  g.strokeStyle = 'rgba(210,190,255,0.28)';
  g.lineWidth = 2;
  rrect(g, ox - 1, oy - 1, w + 2, h + 2, 21);
  g.stroke();
  g.strokeStyle = 'rgba(0,0,0,0.5)';
  g.lineWidth = 4;
  rrect(g, ox - 5, oy - 5, w + 10, h + 9, 24);
  g.stroke();
  const shine = (x0, wd, a) => { const lg = g.createLinearGradient(x0, 0, x0 + wd, 0); lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.5, `rgba(255,255,255,${a})`); lg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = lg; g.fillRect(x0, oy + 18, wd, h - 40); };
  shine(ox + 8, 10, 0.07);
  shine(ox + 22, 4, 0.05);
  shine(ox + w - 18, 8, 0.05);
  JARS.set(key, cv);
  if (JARS.size > 4) JARS.delete(JARS.keys().next().value);
  return cv;
}

class Music {
  constructor() { this.on = false; this.timer = 0; this.bus = null; this.next = 0; this.bar = 0; this.rnd = rng('lull'); }
  start() {
    if (this.on || !musicOn()) return;
    const c = audioCtx(); const out = audioOut();
    if (!c || !out) return;
    this.c = c;
    this.on = true;
    const bus = c.createGain();
    bus.gain.value = 0.0001;
    bus.gain.exponentialRampToValueAtTime(0.5, c.currentTime + 2.5);
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 2400; lp.Q.value = 0.4;
    const dl = c.createDelay(1); dl.delayTime.value = 0.36;
    const fb = c.createGain(); fb.gain.value = 0.32;
    const wet = c.createGain(); wet.gain.value = 0.28;
    bus.connect(lp); lp.connect(out); lp.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(out);
    this.bus = bus;
    this.nodes = [bus, lp, dl, fb, wet];
    this.next = c.currentTime + 0.15;
    this.timer = setInterval(() => this.tick(), 140);
    this.tick();
  }
  note(f, t, dur, type, gain, att) {
    const c = this.c;
    const o = c.createOscillator(); o.type = type; o.frequency.value = f;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + (att || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.bus);
    o.start(t); o.stop(t + dur + 0.05);
  }
  tick() {
    if (!this.on) return;
    if (!musicOn() || (typeof document !== 'undefined' && document.visibilityState === 'hidden')) { this.stop(); return; }
    const c = this.c;
    const beat = 60 / 68;
    const chords = [[261.63, 329.63, 392.0, 493.88], [220.0, 261.63, 329.63, 392.0], [174.61, 220.0, 261.63, 329.63], [196.0, 246.94, 293.66, 392.0]];
    while (this.next < c.currentTime + 0.5) {
      const t = this.next;
      const ch = chords[this.bar % 4];
      ch.forEach((f, i) => { this.note(f / 2, t, beat * 4.2, 'sine', 0.035 - i * 0.004, 0.9); this.note(f, t + 0.02, beat * 4, 'triangle', 0.012, 1.1); });
      for (let s = 0; s < 8; s++) {
        if (this.rnd() < 0.62) {
          const f = ch[(s * 3 + this.bar) % 4] * (s % 4 === 3 ? 2 : 1);
          this.note(f * 2, t + s * beat * 0.5, 0.7, 'sine', 0.022 + this.rnd() * 0.012, 0.005);
        }
      }
      if (this.bar % 2 === 1 && this.rnd() < 0.7) { const m = [523.25, 587.33, 659.25, 783.99, 880][Math.floor(this.rnd() * 5)]; this.note(m * 2, t + beat * 2.5, 1.4, 'sine', 0.014, 0.01); }
      this.next += beat * 4;
      this.bar += 1;
    }
  }
  stop() {
    if (!this.on) return;
    this.on = false;
    clearInterval(this.timer);
    const c = this.c; const bus = this.bus;
    try { bus.gain.cancelScheduledValues(c.currentTime); bus.gain.setTargetAtTime(0.0001, c.currentTime, 0.3); } catch {}
    const nodes = this.nodes;
    setTimeout(() => { nodes.forEach((n) => { try { n.disconnect(); } catch {} }); }, 1500);
  }
}

const SCENE = new Map();
function BlobScene() {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv) return undefined;
    const paint = () => {
      if (!cv.isConnected || !cv.parentElement) return;
      const r = { width: cv.parentElement.clientWidth, height: cv.parentElement.clientHeight };
      const W = Math.max(100, Math.round(r.width)); const Hh = Math.max(100, Math.round(r.height));
      const { ctx, d } = fitCanvas(cv, W, Hh, 2);
      const key = `${W}x${Hh}`;
      let art = SCENE.get(key);
      if (!art) {
        art = makeCanvas(W * d, Hh * d);
        const g = art.getContext('2d');
        g.scale(d, d);
        const wall = g.createLinearGradient(0, 0, 0, Hh);
        wall.addColorStop(0, '#2B2145');
        wall.addColorStop(0.7, '#1C1630');
        wall.addColorStop(1, '#120E1F');
        g.fillStyle = wall;
        g.fillRect(0, 0, W, Hh);
        for (let x = 0; x < W; x += 26) {
          g.fillStyle = 'rgba(255,255,255,0.025)';
          g.fillRect(x, 0, 13, Hh);
          g.fillStyle = 'rgba(255,214,170,0.05)';
          for (let y = 10 + ((x / 26) % 2) * 22; y < Hh; y += 44) { g.beginPath(); g.ellipse(x + 6.5, y, 2.2, 3.2, 0, 0, Math.PI * 2); g.fill(); }
        }
        const lamp = g.createRadialGradient(W * 0.18, Hh * 0.1, 10, W * 0.18, Hh * 0.1, Math.max(W, Hh) * 0.8);
        lamp.addColorStop(0, 'rgba(255,214,160,0.2)');
        lamp.addColorStop(0.5, 'rgba(255,214,160,0.05)');
        lamp.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = lamp;
        g.fillRect(0, 0, W, Hh);
        const sy = Hh - 34;
        const shelf = g.createLinearGradient(0, sy, 0, Hh);
        shelf.addColorStop(0, '#7A4E2E');
        shelf.addColorStop(0.18, '#5E3A20');
        shelf.addColorStop(1, '#2E1C0F');
        g.fillStyle = shelf;
        g.fillRect(0, sy, W, Hh - sy);
        g.fillStyle = 'rgba(255,220,180,0.22)';
        g.fillRect(0, sy, W, 1.5);
        const vg = g.createRadialGradient(W / 2, Hh / 2, Math.min(W, Hh) * 0.3, W / 2, Hh / 2, Math.max(W, Hh) * 0.75);
        vg.addColorStop(0, 'rgba(0,0,0,0)');
        vg.addColorStop(1, 'rgba(0,0,0,0.45)');
        g.fillStyle = vg;
        g.fillRect(0, 0, W, Hh);
        SCENE.set(key, art);
      }
      ctx.drawImage(art, 0, 0, W, Hh);
    };
    paint();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(paint) : null;
    if (ro) ro.observe(cv.parentElement);
    return () => { if (ro) ro.disconnect(); };
  }, []);
  return <canvas ref={ref} aria-hidden="true" style={{ position: 'absolute', inset: 0, display: 'block' }} />;
}

function MiniBlob({ k, size }) {
  const c = COLS[k];
  const fs = size * (val(k) >= 1000 ? 0.32 : val(k) >= 100 ? 0.4 : 0.5);
  return (
    <span style={{ width: size, height: size, borderRadius: '50%', background: `radial-gradient(circle at 34% 30%, ${tint(c, 0.45)}, ${c} 55%, ${shade(c, 0.12)})`, boxShadow: `inset 0 0 0 2px ${OUTLINE}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontWeight: 900, fontSize: fs, fontFamily: FONT, textShadow: `0 1px 0 ${OUTLINE}, 1px 0 0 ${OUTLINE}, -1px 0 0 ${OUTLINE}, 0 -1px 0 ${OUTLINE}`, flexShrink: 0 }}>{val(k)}</span>
  );
}

function draw(ctx, L, world, aimX, ready, now, d) {
  const { s, ox, oy, w, h } = L;
  ctx.clearRect(0, 0, L.Wc, L.Hc);
  ctx.save();
  rrect(ctx, ox, oy, w, h, 20);
  ctx.clip();
  const danger = world.danger > 0;
  const pulse = danger ? 0.5 + 0.5 * Math.sin(now / 90) : 0;
  ctx.strokeStyle = danger ? `rgba(255,${90 - pulse * 60},${110 - pulse * 60},${0.55 + pulse * 0.4})` : 'rgba(255,255,255,0.22)';
  ctx.lineWidth = danger ? 2.4 : 1.5;
  ctx.setLineDash([7, 7]);
  ctx.beginPath(); ctx.moveTo(ox + 6, oy + LINE * s); ctx.lineTo(ox + w - 6, oy + LINE * s); ctx.stroke();
  ctx.setLineDash([]);
  if (ready && !world.over) {
    const k = world.current();
    const r = RAD[k];
    const x = clamp(aimX, r + 2, W0 - r - 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.13)';
    ctx.lineWidth = 2;
    ctx.setLineDash([2, 8]);
    ctx.beginPath(); ctx.moveTo(ox + x * s, oy + (LINE - 8) * s); ctx.lineTo(ox + x * s, oy + h - 4); ctx.stroke();
    ctx.setLineDash([]);
  }
  world.blobs.forEach((B) => {
    const col = COLS[B.k];
    blobPath(ctx, B, s, ox, oy, 0);
    ctx.fillStyle = col;
    ctx.fill();
    ctx.lineJoin = 'round';
    ctx.strokeStyle = SHADES[B.k];
    ctx.lineWidth = Math.max(3, 5.5 * s * B.sc);
    ctx.stroke();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = Math.max(2, 2.6 * s);
    ctx.stroke();
    if (B.flash > 0) { ctx.globalAlpha = B.flash * 0.5; ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.globalAlpha = 1; }
    const hr = B.r * s * B.sc;
    ctx.drawImage(SHINE(), ox + B.cx * s - hr * 0.78, oy + B.cy * s - hr * 0.86, hr * 0.9, hr * 0.62);
    const v = val(B.k);
    const fs = hr * (v >= 1000 ? 0.62 : v >= 100 ? 0.78 : 0.95);
    const lb = label(v, fs, d || 2);
    const k2 = fs / Math.max(8, Math.round(fs / 2) * 2);
    ctx.drawImage(lb.cv, ox + B.cx * s - (lb.w * k2) / 2, oy + B.cy * s - (lb.h * k2) / 2, lb.w * k2, lb.h * k2);
  });
  world.rings.forEach((r) => {
    const k = r.t / 0.5;
    ctx.strokeStyle = r.col;
    ctx.globalAlpha = (1 - k) * 0.8;
    ctx.lineWidth = (r.big ? 8 : 4) * (1 - k) + 1;
    ctx.beginPath(); ctx.arc(ox + r.x * s, oy + r.y * s, (r.r * (1 + k * 0.6) + 6) * s, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
  });
  ctx.restore();
  if (!world.over) {
    const k = world.current();
    const r = RAD[k];
    const x = clamp(aimX, r + 2, W0 - r - 2);
    const cy = oy + (LINE - r - 12) * s;
    ctx.fillStyle = '#3A2F55';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    rrect(ctx, ox + x * s - 15, oy - 4, 30, 9, 4);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(ox + x * s - 13, oy - 3, 26, 2);
    if (ready) {
      ctx.strokeStyle = 'rgba(200,180,255,0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(ox + x * s, oy + 5); ctx.lineTo(ox + x * s, cy - r * s); ctx.stroke();
      const col = COLS[k];
      const wob = Math.sin(now / 180) * 0.025;
      ctx.save();
      ctx.translate(ox + x * s, cy);
      ctx.scale(1 + wob, 1 - wob);
      ctx.beginPath(); ctx.arc(0, 0, r * s, 0, Math.PI * 2);
      const gr = ctx.createRadialGradient(-r * s * 0.35, -r * s * 0.4, r * s * 0.1, 0, 0, r * s * 1.1);
      gr.addColorStop(0, tint(col, 0.3)); gr.addColorStop(0.55, col); gr.addColorStop(1, shade(col, 0.18));
      ctx.fillStyle = gr; ctx.fill();
      ctx.strokeStyle = OUTLINE; ctx.lineWidth = Math.max(2, 2.6 * s); ctx.stroke();
      const v = val(k);
      const fs = r * s * (v >= 100 ? 0.78 : 0.95);
      ctx.font = `900 ${fs.toFixed(1)}px -apple-system, BlinkMacSystemFont, 'SF Pro Rounded', 'Segoe UI', Roboto, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = Math.max(2.5, fs * 0.16); ctx.strokeStyle = OUTLINE; ctx.strokeText(String(v), 0, fs * 0.05);
      ctx.fillStyle = '#FFFFFF'; ctx.fillText(String(v), 0, fs * 0.05);
      ctx.restore();
    }
  }
}

function IconBtn({ label, onClick, children, on }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} style={{ width: 38, height: 38, borderRadius: 19, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: on === false ? 'rgba(255,255,255,0.45)' : '#FFFFFF', background: 'rgba(255,255,255,0.1)', flexShrink: 0 }}>{children}</button>
  );
}

export function BlobGame() {
  const kit = useGameKit();
  const hostRef = useRef(null);
  const bgRef = useRef(null);
  const fgRef = useRef(null);
  const worldRef = useRef(null);
  const aim = useRef(W0 / 2);
  const ready = useRef(true);
  const layRef = useRef(null);
  const music = useRef(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => readBest(BLOB_KEY));
  const [queue, setQueue] = useState([]);
  const [over, setOver] = useState(false);
  const [round, setRound] = useState(0);
  const [newBest, setNewBest] = useState(false);
  const perf = useRef(perfMeter());
  useEffect(() => {
    const w = new BlobWorld();
    worldRef.current = w;
    aim.current = W0 / 2;
    ready.current = true;
    setScore(0); setOver(false); setNewBest(false); setQueue(w.queue.slice(1, 4));
    return undefined;
  }, [round]);
  useEffect(() => {
    if (!music.current) music.current = new Music();
    const m = music.current;
    if (kit.musicOn) m.start(); else m.stop();
    const onVis = () => { if (document.visibilityState === 'visible' && musicOn()) m.start(); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [kit.musicOn]);
  useEffect(() => () => { if (music.current) music.current.stop(); }, []);
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    let raf = 0; let alive = true; let acc = 0; let last = 0;
    const resize = () => {
      if (!alive || !bgRef.current || !fgRef.current || !host.isConnected) return;
      const r = { width: host.clientWidth, height: host.clientHeight };
      const Wc = Math.max(200, Math.floor(r.width)); const Hc = Math.max(300, Math.floor(r.height));
      const L = jarLayout(Wc, Hc);
      const b = fitCanvas(bgRef.current, Wc, Hc, 2.5);
      b.ctx.clearRect(0, 0, Wc, Hc);
      b.ctx.drawImage(jarArt(L, b.d), 0, 0, Wc, Hc);
      const f = fitCanvas(fgRef.current, Wc, Hc, 2);
      L.ctx = f.ctx; L.d = f.d;
      layRef.current = L;
    };
    resize();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(host);
    let shownScore = -1; let warned = 0; let lastBump = 0;
    const loop = (t) => {
      if (!alive) return;
      raf = requestAnimationFrame(loop);
      const p = perf.current;
      p.tick(t);
      const w0 = performance.now();
      const w = worldRef.current; const L = layRef.current;
      if (!w || !L) return;
      if (!last) last = t;
      acc += Math.min(0.05, (t - last) / 1000);
      last = t;
      let steps = 0;
      while (acc >= H && steps < 4) { if (!w.over) w.step(); acc -= H; steps += 1; }
      if (steps === 4) acc = 0;
      if (w.events.length) {
        w.events.forEach((e) => {
          const pan = clamp((e.x - W0 / 2) / W0, -0.7, 0.7);
          if (e.k === 'merge') { sfx('blobMerge', { k: e.tier, pan }); haptic(e.tier > 6 ? 22 : 10); }
          else if (e.k === 'drop') sfx('blobDrop', { pan });
          else if ((e.k === 'bump' || e.k === 'floor') && t - lastBump > 70) { sfx('blobBump', { v: clamp(e.v / 900, 0.05, 1), small: clamp(e.small, 0, 10) / 10, pan }); lastBump = t; }
        });
        w.events.length = 0;
      }
      if (w.score !== shownScore) { shownScore = w.score; setScore(w.score); }
      if (w.danger > 0 && t - warned > 520 && !w.over) { sfx('blobWarn'); warned = t; }
      if (w.over && !w.reported) {
        w.reported = true;
        sfx('blobOver');
        const b0 = readBest(BLOB_KEY);
        if (w.score > b0) { writeBest(BLOB_KEY, w.score); setBest(w.score); setNewBest(true); }
        if (w.score > 0) noteSoloScore(BLOB_KEY, w.score);
        setOver(true);
      }
      draw(L.ctx, L, w, aim.current, ready.current, t, L.d);
      p.work(performance.now() - w0);
    };
    raf = requestAnimationFrame(loop);
    return () => { alive = false; cancelAnimationFrame(raf); if (ro) ro.disconnect(); };
  }, []);
  const toWorld = (e) => {
    const L = layRef.current;
    const r = fgRef.current.getBoundingClientRect();
    return (e.clientX - r.left - L.ox) / L.s;
  };
  const dropNow = () => {
    const w = worldRef.current;
    if (!w || w.over || !ready.current) return;
    if (music.current && kit.musicOn) music.current.start();
    w.drop(aim.current);
    setQueue(w.queue.slice(1, 4));
    ready.current = false;
    setTimeout(() => { ready.current = true; }, 420);
  };
  const down = useRef(false);
  useEffect(() => {
    if (g1Test()) window.__gbblob = { world: () => worldRef.current, drop: (x) => { aim.current = x; ready.current = true; dropNow(); }, stats: () => perf.current.report(), resetStats: () => perf.current.reset(), fill: (n, mk) => { const w = worldRef.current; for (let i = 0; i < n; i++) { const k = (i * 3) % ((mk || 4) + 1); const b = new Blob(k, 36 + ((i * 61) % 290), 600 - Math.floor(i / 7) * 52, w.nextId++); w.blobs.push(b); } }, noMerge: () => { worldRef.current.merge = () => {}; }, noOver: () => { const w = worldRef.current; w.step0 = w.step; w.step = function () { w.step0(); w.danger = 0; }; } };
  });
  const share = () => { if (!best) return; try { window.dispatchEvent(new CustomEvent('zchat-share-score', { detail: { k: BLOB_KEY, s: best } })); } catch {} };
  const close = () => { try { window.history.back(); } catch {} };
  const top = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px 6px', fontFamily: FONT, color: '#FFFFFF' }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 26, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.02em' }}>{score}</div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>Best {Math.max(best, score)}</div>
      </div>
      <div style={{ flex: 1 }} />
      <div aria-label="Next blobs" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 18, background: 'rgba(0,0,0,0.28)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)' }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.55)', marginRight: 2 }}>Next</span>
        {queue.map((k, i) => <MiniBlob key={`${i}${k}`} k={k} size={i === 0 ? 30 : 24} />)}
      </div>
      <IconBtn label="Share your best" onClick={share}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" /><path d="M16 6l-4-4-4 4" /><path d="M12 2v14" /></svg></IconBtn>
    </div>
  );
  return (
    <GameRoom title="Squish" scene={<BlobScene />} music={false} rules={GAME_RULES.squish} onClose={close} top={top}>
      <div ref={hostRef} style={{ position: 'relative', width: '100%', height: '100%', alignSelf: 'stretch', touchAction: 'none' }}
        onPointerDown={(e) => { if (over) return; try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} down.current = true; aim.current = toWorld(e); }}
        onPointerMove={(e) => { if (over) return; aim.current = toWorld(e); }}
        onPointerUp={(e) => { if (!down.current) return; down.current = false; aim.current = toWorld(e); dropNow(); }}
        onPointerCancel={() => { down.current = false; }}>
        <canvas ref={bgRef} style={{ position: 'absolute', left: 0, top: 0, display: 'block' }} />
        <canvas ref={fgRef} style={{ position: 'absolute', left: 0, top: 0, display: 'block' }} />
        {over && (
          <div onPointerDown={(e) => e.stopPropagation()} style={{ position: 'absolute', left: '50%', top: '42%', transform: 'translate(-50%, -50%)', width: 'min(84%, 300px)', borderRadius: 24, padding: '20px 18px 16px', background: 'rgba(22,16,36,0.94)', boxShadow: '0 20px 50px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.08)', color: '#FFFFFF', textAlign: 'center', fontFamily: FONT }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.65)' }}>{newBest ? 'New best' : 'The jar is full'}</div>
            <div style={{ fontSize: 44, fontWeight: 900, letterSpacing: '-0.03em', marginTop: 2 }}>{score}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Best {Math.max(best, score)}</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button type="button" onClick={share} style={{ flex: 1, height: 46, borderRadius: 16, border: 'none', cursor: 'pointer', fontFamily: FONT, fontWeight: 800, fontSize: 15, color: '#FFFFFF', background: 'rgba(255,255,255,0.12)' }}>Share</button>
              <button type="button" onClick={() => setRound((x) => x + 1)} style={{ flex: 1.3, height: 46, borderRadius: 16, border: 'none', cursor: 'pointer', fontFamily: FONT, fontWeight: 900, fontSize: 15, color: '#1E1430', background: 'linear-gradient(180deg, #FFE08A, #FFC93C)', boxShadow: '0 3px 0 #B8860B' }}>Play again</button>
            </div>
          </div>
        )}
      </div>
    </GameRoom>
  );
}
