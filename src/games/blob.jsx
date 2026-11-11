import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { GameRoom, defineSfx, sfx, haptic, useGameKit, audioCtx, audioOut, musicOn } from './kit.jsx';
import { clamp, makeCanvas, fitCanvas, rrect, rng, noiseHit, tone, shade, tint, perfMeter, gameCache, onGameCacheDrop } from './physics.jsx';
import { readBest, writeBest, noteSoloScore, g1Test, FONT, GAME_RULES } from '../App.jsx';
import { SquishWorld, Balloon, W0, H0, LINE, WATER_Y, RAD, DT, tierValue } from './squishsim.jsx';

export const BLOB_KEY = 'squish';
const COLS = ['#FF4D5E', '#FF9233', '#FFCB2E', '#86D648', '#22C3B5', '#3D8BFF', '#8A5CFF', '#FF4FA3', '#FF6E40', '#29D69C', '#1FA3DD', '#E259C6', '#FFB92E'];
const RIMS = COLS.map((c) => shade(c, 0.4));
const LIGHTS = COLS.map((c) => tint(c, 0.45));
const DEEPS = COLS.map((c) => shade(c, 0.2));
const OUTLINE = '#0F2238';
const TAU = Math.PI * 2;

let SHINE_CV = null;
onGameCacheDrop(() => { SHINE_CV = null; });
function SHINE() {
  if (SHINE_CV) return SHINE_CV;
  const cv = makeCanvas(80, 50);
  const g = cv.getContext('2d');
  g.translate(40, 25);
  const gr = g.createRadialGradient(0, 0, 1, 0, 0, 34);
  gr.addColorStop(0, 'rgba(255,255,255,0.78)');
  gr.addColorStop(0.45, 'rgba(255,255,255,0.32)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.beginPath(); g.ellipse(0, 0, 34, 17, 0, 0, TAU); g.fill();
  SHINE_CV = cv;
  return cv;
}

defineSfx('sqThrow', (c, out, o) => {
  const v = clamp(o.v == null ? 0.4 : o.v, 0, 1);
  noiseHit(c, out, { freq: 1500 + v * 1800, q: 0.8, gain: 0.025 + v * 0.07, decay: 0.1 + v * 0.08, pan: o.pan });
  tone(c, out, { freq: 480, to: 260, gain: 0.035, decay: 0.07, pan: o.pan });
});
defineSfx('sqSplat', (c, out, o) => {
  const v = clamp(o.v == null ? 0.4 : o.v, 0.05, 1);
  const f = 90 + (o.small || 0) * 75;
  tone(c, out, { freq: f * 1.7, to: f, gain: 0.07 + v * 0.15, decay: 0.13 + v * 0.08, pan: o.pan });
  noiseHit(c, out, { freq: 650 + v * 600, q: 0.7, type: 'lowpass', gain: 0.05 + v * 0.12, decay: 0.09 + v * 0.06, kind: 'p', pan: o.pan });
  if (v > 0.45) noiseHit(c, out, { freq: 3000, q: 1.1, gain: 0.035 * v, decay: 0.05, pan: o.pan });
});
defineSfx('sqWater', (c, out, o) => {
  const v = clamp(o.v == null ? 0.5 : o.v, 0.1, 1);
  noiseHit(c, out, { freq: 850, q: 0.6, type: 'lowpass', gain: 0.05 + v * 0.1, decay: 0.24 + v * 0.16, kind: 'p', pan: o.pan });
  const t = c.currentTime;
  for (let i = 0; i < 3; i++) tone(c, out, { t0: t + 0.05 + i * 0.05 + Math.random() * 0.03, freq: 650 + Math.random() * 700, to: 1250 + Math.random() * 650, gain: 0.022, decay: 0.05, pan: o.pan });
});
const PENTA = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51, 1567.98];
defineSfx('sqMerge', (c, out, o) => {
  const k = clamp(o.k || 1, 1, 13);
  const t = c.currentTime;
  tone(c, out, { t0: t, freq: 220 + k * 18, to: 760 + k * 55, gain: 0.09, decay: 0.09, pan: o.pan });
  noiseHit(c, out, { t0: t, freq: 900, q: 0.6, type: 'lowpass', gain: 0.07, decay: 0.12, kind: 'p', pan: o.pan });
  const f = PENTA[Math.min(PENTA.length - 1, k - 1 + Math.min(3, (o.combo || 1) - 1))];
  tone(c, out, { t0: t + 0.035, freq: f, gain: 0.11, decay: 0.42 + k * 0.03, type: 'triangle', pan: o.pan });
  tone(c, out, { t0: t + 0.035, freq: f * 2, gain: 0.03, decay: 0.28, type: 'sine', pan: o.pan });
  for (let i = 0; i < 2; i++) tone(c, out, { t0: t + 0.08 + i * 0.06, freq: 900 + Math.random() * 600, to: 1500 + Math.random() * 500, gain: 0.018, decay: 0.04, pan: o.pan });
});
defineSfx('sqFill', (c, out) => { tone(c, out, { freq: 240, to: 470, gain: 0.02, decay: 0.24, type: 'sine' }); noiseHit(c, out, { freq: 2400, q: 1.4, gain: 0.012, decay: 0.2 }); });
defineSfx('sqWarn', (c, out) => { tone(c, out, { freq: 880, gain: 0.05, decay: 0.08, type: 'sine' }); });
defineSfx('sqOver', (c, out) => { [523.25, 440, 349.23, 261.63].forEach((f, i) => tone(c, out, { t0: c.currentTime + i * 0.16, freq: f, gain: 0.1, decay: 0.5, type: 'triangle' })); });

function balloonPath(ctx, B, s, ox, oy) {
  const n = B.n; const px = B.px; const py = B.py;
  ctx.beginPath();
  let mx = (px[n - 1] + px[0]) / 2; let my = (py[n - 1] + py[0]) / 2;
  ctx.moveTo(ox + mx * s, oy + my * s);
  for (let i = 0; i < n; i++) {
    const j = i + 1 === n ? 0 : i + 1;
    mx = (px[i] + px[j]) / 2; my = (py[i] + py[j]) / 2;
    ctx.quadraticCurveTo(ox + px[i] * s, oy + py[i] * s, ox + mx * s, oy + my * s);
  }
  ctx.closePath();
}

const LABELS = gameCache();
function label(v, px, d, ink) {
  const size = Math.max(8, Math.round(px / 2) * 2);
  const key = `${v}:${size}:${d}:${ink || ''}`;
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
  g.lineWidth = Math.max(2.5, size * 0.18);
  g.strokeStyle = ink || OUTLINE;
  g.strokeText(text, w / 2, h / 2 + size * 0.05);
  g.fillStyle = '#FFFFFF';
  g.fillText(text, w / 2, h / 2 + size * 0.05);
  const out = { cv, w, h };
  if (LABELS.size > 180) LABELS.clear();
  LABELS.set(key, out);
  return out;
}

function tankLayout(Wc, Hc) {
  const pad = 12;
  const top = 18;
  const s = Math.min((Wc - pad * 2) / W0, (Hc - pad - top - 4) / H0);
  const w = W0 * s; const h = H0 * s;
  return { s, ox: (Wc - w) / 2, oy: Hc - h - pad, w, h, Wc, Hc };
}

const TANKS = gameCache();
function tankArt(L, d) {
  const key = `${L.Wc}x${L.Hc}@${d}`;
  if (TANKS.has(key)) return TANKS.get(key);
  const cv = makeCanvas(L.Wc * d, L.Hc * d);
  const g = cv.getContext('2d');
  g.scale(d, d);
  const { ox, oy, w, h } = L;
  g.save();
  g.shadowColor = 'rgba(0,8,20,0.6)';
  g.shadowBlur = 24;
  g.shadowOffsetY = 12;
  g.fillStyle = 'rgba(8,30,52,0.9)';
  rrect(g, ox - 7, oy - 7, w + 14, h + 12, 24);
  g.fill();
  g.restore();
  const glass = g.createLinearGradient(0, oy, 0, oy + h);
  glass.addColorStop(0, 'rgba(120,200,255,0.10)');
  glass.addColorStop(0.6, 'rgba(70,160,230,0.08)');
  glass.addColorStop(1, 'rgba(40,120,200,0.16)');
  g.fillStyle = 'rgba(10,38,64,0.55)';
  rrect(g, ox, oy, w, h, 18);
  g.fill();
  g.fillStyle = glass;
  rrect(g, ox, oy, w, h, 18);
  g.fill();
  g.save();
  rrect(g, ox, oy, w, h, 18);
  g.clip();
  const sz = 22 * L.s;
  g.strokeStyle = 'rgba(160,220,255,0.06)';
  g.lineWidth = 1;
  for (let x = ox; x < ox + w; x += sz) { g.beginPath(); g.moveTo(x, oy); g.lineTo(x, oy + h); g.stroke(); }
  for (let y = oy; y < oy + h; y += sz) { g.beginPath(); g.moveTo(ox, y); g.lineTo(ox + w, y); g.stroke(); }
  g.restore();
  g.strokeStyle = 'rgba(200,236,255,0.42)';
  g.lineWidth = 2;
  rrect(g, ox - 1, oy - 1, w + 2, h + 2, 19);
  g.stroke();
  g.strokeStyle = 'rgba(0,10,24,0.55)';
  g.lineWidth = 4;
  rrect(g, ox - 5, oy - 5, w + 10, h + 9, 23);
  g.stroke();
  const streak = (x0, wd, a) => { const lg = g.createLinearGradient(x0, 0, x0 + wd, 0); lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.5, `rgba(255,255,255,${a})`); lg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = lg; g.fillRect(x0, oy + 14, wd, h - 28); };
  streak(ox + 7, 12, 0.08);
  streak(ox + 24, 4, 0.06);
  streak(ox + w - 20, 9, 0.06);
  const rail = g.createLinearGradient(0, oy - 12, 0, oy + 2);
  rail.addColorStop(0, '#EAF3FA'); rail.addColorStop(0.45, '#9FB3C4'); rail.addColorStop(1, '#5D7184');
  g.fillStyle = rail;
  rrect(g, ox - 10, oy - 12, w + 20, 12, 6);
  g.fill();
  g.fillStyle = 'rgba(255,255,255,0.6)';
  g.fillRect(ox - 4, oy - 10, w + 8, 1.5);
  TANKS.set(key, cv);
  if (TANKS.size > 4) TANKS.delete(TANKS.keys().next().value);
  return cv;
}

class Music {
  constructor() { this.on = false; this.timer = 0; this.bus = null; this.next = 0; this.bar = 0; this.rnd = rng('pool'); }
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
    lp.type = 'lowpass'; lp.frequency.value = 2600; lp.Q.value = 0.4;
    const dl = c.createDelay(1); dl.delayTime.value = 0.3;
    const fb = c.createGain(); fb.gain.value = 0.3;
    const wet = c.createGain(); wet.gain.value = 0.26;
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
    const beat = 60 / 92;
    const chords = [[261.63, 329.63, 392.0], [220.0, 277.18, 329.63], [174.61, 220.0, 261.63], [196.0, 246.94, 293.66]];
    while (this.next < c.currentTime + 0.5) {
      const t = this.next;
      const ch = chords[this.bar % 4];
      ch.forEach((f, i) => this.note(f / 2, t, beat * 3.8, 'sine', 0.03 - i * 0.004, 0.6));
      this.note(ch[0] / 4, t, beat * 0.9, 'triangle', 0.05, 0.01);
      this.note(ch[0] / 4, t + beat * 2, beat * 0.9, 'triangle', 0.04, 0.01);
      for (let s = 0; s < 8; s++) {
        if (s % 2 === 0 || this.rnd() < 0.45) {
          const f = ch[(s + this.bar) % 3] * (s % 4 === 3 ? 4 : 2);
          this.note(f, t + s * beat * 0.5, 0.32, 'sine', 0.018 + this.rnd() * 0.01, 0.004);
        }
      }
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

const SCENE = gameCache();
function PoolScene() {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv) return undefined;
    const paint = () => {
      if (!cv.isConnected || !cv.parentElement) return;
      const W = Math.max(100, Math.round(cv.parentElement.clientWidth)); const Hh = Math.max(100, Math.round(cv.parentElement.clientHeight));
      const { ctx, d } = fitCanvas(cv, W, Hh, 2);
      const key = `${W}x${Hh}`;
      let art = SCENE.get(key);
      if (!art) {
        art = makeCanvas(W * d, Hh * d);
        const g = art.getContext('2d');
        g.scale(d, d);
        const wall = g.createLinearGradient(0, 0, 0, Hh);
        wall.addColorStop(0, '#0A2440');
        wall.addColorStop(0.6, '#0F3658');
        wall.addColorStop(1, '#124266');
        g.fillStyle = wall;
        g.fillRect(0, 0, W, Hh);
        const r = rng('tiles');
        const t = 24;
        for (let y = 0; y < Hh; y += t) {
          for (let x = 0; x < W; x += t) {
            const k = r();
            g.fillStyle = `rgba(${k < 0.5 ? '120,200,255' : '20,70,120'},${0.05 + r() * 0.06})`;
            g.fillRect(x + 1, y + 1, t - 2, t - 2);
          }
        }
        g.strokeStyle = 'rgba(4,18,34,0.55)';
        g.lineWidth = 1.5;
        for (let x = 0; x < W; x += t) { g.beginPath(); g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, Hh); g.stroke(); }
        for (let y = 0; y < Hh; y += t) { g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(W, y + 0.5); g.stroke(); }
        g.strokeStyle = 'rgba(180,230,255,0.07)';
        g.lineWidth = 1;
        for (let x = 0; x < W; x += t) { g.beginPath(); g.moveTo(x + 2, 0); g.lineTo(x + 2, Hh); g.stroke(); }
        const band = Math.round(Hh * 0.34 / t) * t;
        g.fillStyle = 'rgba(255,255,255,0.08)';
        for (let x = 0; x < W; x += t * 2) g.fillRect(x + 1, band + 1, t - 2, t - 2);
        g.fillStyle = 'rgba(31,163,221,0.16)';
        for (let x = t; x < W; x += t * 2) g.fillRect(x + 1, band + 1, t - 2, t - 2);
        const glow = g.createRadialGradient(W / 2, Hh * 1.05, 20, W / 2, Hh * 1.05, Math.max(W, Hh) * 0.9);
        glow.addColorStop(0, 'rgba(90,210,255,0.28)');
        glow.addColorStop(0.5, 'rgba(60,170,240,0.08)');
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = glow;
        g.fillRect(0, 0, W, Hh);
        const vg = g.createRadialGradient(W / 2, Hh / 2, Math.min(W, Hh) * 0.3, W / 2, Hh / 2, Math.max(W, Hh) * 0.78);
        vg.addColorStop(0, 'rgba(0,0,0,0)');
        vg.addColorStop(1, 'rgba(0,6,16,0.5)');
        g.fillStyle = vg;
        g.fillRect(0, 0, W, Hh);
        SCENE.set(key, art);
        if (SCENE.size > 3) SCENE.delete(SCENE.keys().next().value);
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

function MiniBalloon({ k, size }) {
  const v = tierValue(k);
  const gid = `sqmb${k}`;
  const fs = v >= 1000 ? 10 : v >= 100 ? 12 : v >= 10 ? 14.5 : 17;
  return (
    <svg width={size} height={size * 1.12} viewBox="0 0 40 45" aria-hidden="true" style={{ display: 'block', flexShrink: 0 }}>
      <defs>
        <radialGradient id={gid} cx="36%" cy="30%" r="78%"><stop offset="0" stopColor={LIGHTS[k]} /><stop offset="0.55" stopColor={COLS[k]} /><stop offset="1" stopColor={DEEPS[k]} /></radialGradient>
      </defs>
      <path d="M16.5 36.5 Q20 41.5 23.5 36.5 L22 43 Q20 44.5 18 43 Z" fill={RIMS[k]} />
      <ellipse cx="20" cy="20" rx="18" ry="18.6" fill={`url(#${gid})`} stroke={RIMS[k]} strokeWidth="1.6" />
      <ellipse cx="12.5" cy="11.5" rx="6.5" ry="3.4" fill="#FFFFFF" opacity="0.55" transform="rotate(-32 12.5 11.5)" />
      <circle cx="10" cy="17" r="1.4" fill="#FFFFFF" opacity="0.75" />
      <text x="20" y={20 + fs * 0.36} textAnchor="middle" fontFamily={FONT} fontWeight="900" fontSize={fs} fill="#FFFFFF" stroke={OUTLINE} strokeWidth="2.6" paintOrder="stroke">{v}</text>
    </svg>
  );
}

function drawBalloon(ctx, B, s, ox, oy, t, d) {
  const k = B.k;
  const col = COLS[k];
  balloonPath(ctx, B, s, ox, oy);
  const w = (B.maxx - B.minx) * s; const h = (B.maxy - B.miny) * s;
  const x0 = ox + B.minx * s; const y0 = oy + B.miny * s;
  const cx = ox + B.cx * s; const cy = oy + B.cy * s;
  const R = Math.max(w, h) * 0.62;
  const gr = ctx.createRadialGradient(x0 + w * 0.34, y0 + h * 0.3, R * 0.05, cx, cy, R);
  gr.addColorStop(0, LIGHTS[k]);
  gr.addColorStop(0.5, col);
  gr.addColorStop(1, DEEPS[k]);
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = gr;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.save();
  ctx.clip();
  const deep = ctx.createLinearGradient(0, cy, 0, y0 + h);
  deep.addColorStop(0, 'rgba(0,12,36,0)');
  deep.addColorStop(1, 'rgba(0,12,36,0.24)');
  ctx.fillStyle = deep;
  ctx.fillRect(x0, cy, w, h);
  const sd = B.seed * 10;
  const slosh = clamp(B.vx * 0.012, -0.2, 0.2);
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath();
  ctx.ellipse(cx + (Math.sin(t * 1.3 + sd) * 0.18 - slosh) * w, cy + Math.cos(t * 1.1 + sd) * 0.14 * h + h * 0.08, w * 0.24, h * 0.09, Math.sin(t * 0.7 + sd) * 0.6, 0, TAU);
  ctx.ellipse(cx + (Math.cos(t * 0.9 + sd * 2) * 0.2 - slosh) * w, cy + Math.sin(t * 1.4 + sd) * 0.12 * h + h * 0.22, w * 0.16, h * 0.06, -Math.sin(t * 0.8 + sd) * 0.6, 0, TAU);
  ctx.fill();
  if (w > 26) {
    ctx.fillStyle = 'rgba(255,255,255,0.42)';
    for (let i = 0; i < 2; i++) {
      const span = h * 0.7;
      const yy = y0 + h * 0.86 - ((t * (14 + i * 9) + sd * 40 + i * 37) % span);
      const xx = cx + Math.sin(t * 2 + sd + i * 2.4) * w * 0.18 + (i ? w * 0.12 : -w * 0.1);
      ctx.beginPath(); ctx.arc(xx, yy, Math.max(1, w * (i ? 0.018 : 0.026)), 0, TAU); ctx.fill();
    }
  }
  if (B.flash > 0) { ctx.globalAlpha = B.flash * 0.5; ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x0, y0, w, h); ctx.globalAlpha = 1; }
  ctx.restore();
  ctx.lineJoin = 'round';
  ctx.strokeStyle = RIMS[k];
  ctx.lineWidth = Math.max(1.6, 2.3 * s);
  balloonPath(ctx, B, s, ox, oy);
  ctx.stroke();
  const n = B.n;
  const ik = Math.round(n * 0.25) % n;
  const a = ik === 0 ? n - 1 : ik - 1; const b = ik + 1 === n ? 0 : ik + 1;
  let nx = B.py[b] - B.py[a]; let ny = -(B.px[b] - B.px[a]);
  const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
  const kr = B.r * B.sc * s;
  const kx = ox + B.px[ik] * s + nx * kr * 0.06; const ky = oy + B.py[ik] * s + ny * kr * 0.06;
  ctx.save();
  ctx.translate(kx, ky);
  ctx.rotate(Math.atan2(ny, nx) - Math.PI / 2);
  ctx.fillStyle = RIMS[k];
  ctx.beginPath();
  const kz = Math.max(kr, 15 * s);
  ctx.moveTo(-kz * 0.15, -kz * 0.03);
  ctx.quadraticCurveTo(0, kz * 0.12, kz * 0.15, -kz * 0.03);
  ctx.lineTo(kz * 0.09, kz * 0.26);
  ctx.quadraticCurveTo(0, kz * 0.32, -kz * 0.09, kz * 0.26);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = DEEPS[k];
  ctx.beginPath(); ctx.ellipse(0, kz * 0.28, kz * 0.11, kz * 0.055, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath(); ctx.ellipse(-kz * 0.04, kz * 0.08, kz * 0.03, kz * 0.07, 0.3, 0, TAU); ctx.fill();
  ctx.restore();
  const sh = SHINE();
  ctx.save();
  ctx.translate(x0 + w * 0.32, y0 + h * 0.25);
  ctx.rotate(-0.5);
  ctx.drawImage(sh, -w * 0.21, -h * 0.1, w * 0.42, h * 0.2);
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath(); ctx.arc(x0 + w * 0.2, y0 + h * 0.36, Math.max(1.2, w * 0.035), 0, TAU); ctx.fill();
  const v = tierValue(k);
  const fs = kr * (v >= 1000 ? 0.6 : v >= 100 ? 0.74 : v >= 10 ? 0.88 : 0.98);
  const lb = label(v, fs, d || 2);
  const k2 = fs / Math.max(8, Math.round(fs / 2) * 2);
  ctx.drawImage(lb.cv, cx - (lb.w * k2) / 2, cy - (lb.h * k2) / 2, lb.w * k2, lb.h * k2);
}

function drawHanging(ctx, L, x, k, fill, t, d) {
  const { s, ox, oy } = L;
  const r = RAD[k] * s * (0.3 + 0.7 * fill);
  const nz = oy - 8;
  const cyFull = oy + (LINE - RAD[k] - 8) * s;
  const top = nz + 14;
  const cy = Math.max(top + r * 0.9, cyFull - (1 - fill) * RAD[k] * s * 0.5);
  const sway = Math.sin(t / 420) * 0.04;
  const col = COLS[k];
  ctx.save();
  ctx.translate(ox + x * s, 0);
  const neckTop = top - 4; const neckBot = cy - r * 0.92;
  ctx.fillStyle = RIMS[k];
  ctx.beginPath();
  ctx.moveTo(-3.2, neckTop); ctx.lineTo(3.2, neckTop);
  ctx.quadraticCurveTo(2.2, (neckTop + neckBot) / 2, r * 0.32, neckBot + 2);
  ctx.lineTo(-r * 0.32, neckBot + 2);
  ctx.quadraticCurveTo(-2.2, (neckTop + neckBot) / 2, -3.2, neckTop);
  ctx.fill();
  ctx.translate(0, cy);
  ctx.rotate(sway);
  const wob = Math.sin(t / 160) * 0.025;
  ctx.scale(1 - wob, 1 + wob);
  ctx.beginPath();
  ctx.moveTo(0, -r * 1.05);
  ctx.bezierCurveTo(r * 0.62, -r * 1.05, r, -r * 0.55, r, 0);
  ctx.bezierCurveTo(r, r * 0.6, r * 0.55, r * 1.0, 0, r * 1.0);
  ctx.bezierCurveTo(-r * 0.55, r * 1.0, -r, r * 0.6, -r, 0);
  ctx.bezierCurveTo(-r, -r * 0.55, -r * 0.62, -r * 1.05, 0, -r * 1.05);
  ctx.closePath();
  const gr = ctx.createRadialGradient(-r * 0.32, -r * 0.4, r * 0.05, 0, 0, r * 1.15);
  gr.addColorStop(0, LIGHTS[k]); gr.addColorStop(0.5, col); gr.addColorStop(1, DEEPS[k]);
  ctx.fillStyle = gr;
  ctx.globalAlpha = 0.96;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = RIMS[k];
  ctx.lineWidth = Math.max(1.6, 2.3 * s);
  ctx.stroke();
  ctx.save();
  ctx.rotate(-0.5);
  ctx.drawImage(SHINE(), -r * 0.78, -r * 0.62, r * 0.84, r * 0.42);
  ctx.restore();
  if (fill > 0.85) {
    const v = tierValue(k);
    const fs = r * (v >= 1000 ? 0.6 : v >= 100 ? 0.74 : v >= 10 ? 0.88 : 0.98);
    const lb = label(v, fs, d || 2);
    const k2 = fs / Math.max(8, Math.round(fs / 2) * 2);
    ctx.globalAlpha = clamp((fill - 0.85) / 0.15, 0, 1);
    ctx.drawImage(lb.cv, -(lb.w * k2) / 2, -(lb.h * k2) / 2 + r * 0.06, lb.w * k2, lb.h * k2);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  const cx = ox + x * s;
  const body = ctx.createLinearGradient(cx - 9, 0, cx + 9, 0);
  body.addColorStop(0, '#5E7386'); body.addColorStop(0.35, '#F1F7FC'); body.addColorStop(1, '#6B8094');
  ctx.fillStyle = body;
  rrect(ctx, cx - 9, nz - 12, 18, 16, 5);
  ctx.fill();
  ctx.fillStyle = '#4B5E70';
  rrect(ctx, cx - 5.5, nz + 3, 11, 9, 3);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillRect(cx - 5, nz - 9, 2, 10);
  if (fill < 1) {
    ctx.strokeStyle = 'rgba(170,225,255,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx, nz + 12); ctx.lineTo(cx, cy - r * 0.6); ctx.stroke();
  }
}

function waterWave(x, t, ripples) {
  let y = Math.sin(x * 0.045 + t * 1.8) * 1.3 + Math.sin(x * 0.11 - t * 2.6) * 0.6;
  for (let i = 0; i < ripples.length; i++) {
    const r = ripples[i];
    const dx = Math.abs(x - r.x);
    const reach = 30 + r.t * 140;
    if (dx > reach + 40) continue;
    y += r.a * 8 * Math.sin(dx * 0.11 - r.t * 13) * Math.exp(-r.t * 2.1) * Math.exp(-dx / reach);
  }
  return y;
}

function draw(ctx, L, world, fx, aimX, fill, now, d) {
  const { s, ox, oy, w, h } = L;
  const t = now / 1000;
  ctx.clearRect(0, 0, L.Wc, L.Hc);
  ctx.save();
  rrect(ctx, ox, oy, w, h, 18);
  ctx.clip();
  for (let i = 0; i < 3; i++) {
    const lx = ox + w * (0.5 + Math.sin(t * (0.13 + i * 0.05) + i * 2.1) * 0.38);
    const ly = oy + h * (0.3 + i * 0.22 + Math.cos(t * (0.11 + i * 0.04) + i) * 0.08);
    const lr = w * (0.42 + i * 0.08);
    const lg = ctx.createRadialGradient(lx, ly, 0, lx, ly, lr);
    lg.addColorStop(0, 'rgba(140,215,255,0.07)');
    lg.addColorStop(1, 'rgba(140,215,255,0)');
    ctx.fillStyle = lg;
    ctx.fillRect(lx - lr, ly - lr, lr * 2, lr * 2);
  }
  const danger = world.danger > 0;
  const pulse = danger ? 0.5 + 0.5 * Math.sin(now / 90) : 0;
  ctx.strokeStyle = danger ? `rgba(255,${90 - pulse * 60},${110 - pulse * 60},${0.6 + pulse * 0.35})` : 'rgba(255,255,255,0.24)';
  ctx.lineWidth = danger ? 2.4 : 1.5;
  ctx.setLineDash([7, 7]);
  ctx.beginPath(); ctx.moveTo(ox + 6, oy + LINE * s); ctx.lineTo(ox + w - 6, oy + LINE * s); ctx.stroke();
  ctx.setLineDash([]);
  if (fill >= 1 && !world.over) {
    const k = world.current();
    const r = RAD[k];
    const x = clamp(aimX, r + 3, W0 - r - 3);
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth = 2;
    ctx.setLineDash([2, 9]);
    ctx.beginPath(); ctx.moveTo(ox + x * s, oy + LINE * s); ctx.lineTo(ox + x * s, oy + h - 4); ctx.stroke();
    ctx.setLineDash([]);
  }
  for (const B of world.balloons) {
    if (B.thrown > 0.05 && B.vy > 650) {
      const a = Math.min(0.32, B.thrown * 0.4);
      ctx.strokeStyle = `rgba(255,255,255,${a})`;
      ctx.lineWidth = Math.max(1.5, 2 * s);
      const len = Math.min(90, B.vy * 0.05) * s;
      for (const off of [-0.45, 0, 0.45]) {
        const sx = ox + (B.cx + off * B.r) * s; const sy = oy + (B.miny - 4) * s;
        ctx.beginPath(); ctx.moveTo(sx, sy - len * (off ? 0.7 : 1)); ctx.lineTo(sx, sy); ctx.stroke();
      }
    }
  }
  for (const B of world.balloons) drawBalloon(ctx, B, s, ox, oy, t + B.seed * 7, d);
  const wy = oy + WATER_Y * s;
  ctx.beginPath();
  ctx.moveTo(ox, oy + h);
  for (let x = 0; x <= W0; x += 6) ctx.lineTo(ox + x * s, wy + waterWave(x, t, world.ripples) * s);
  ctx.lineTo(ox + w, oy + h);
  ctx.closePath();
  const wg = ctx.createLinearGradient(0, wy - 6, 0, oy + h);
  wg.addColorStop(0, 'rgba(120,215,255,0.34)');
  wg.addColorStop(1, 'rgba(30,120,210,0.3)');
  ctx.fillStyle = wg;
  ctx.fill();
  ctx.strokeStyle = 'rgba(225,248,255,0.7)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let x = 0; x <= W0; x += 6) { const yy = wy + waterWave(x, t, world.ripples) * s; if (x === 0) ctx.moveTo(ox, yy); else ctx.lineTo(ox + x * s, yy); }
  ctx.stroke();
  for (const p of fx.drops) {
    ctx.globalAlpha = clamp(p.life / 0.25, 0, 1);
    ctx.fillStyle = p.col;
    ctx.beginPath(); ctx.ellipse(ox + p.x * s, oy + p.y * s, p.r * s, p.r * s * (1 + Math.min(0.8, Math.abs(p.vy) / 900)), 0, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const r of world.splashes) {
    const k = r.t / 0.5;
    if (k >= 1) continue;
    ctx.strokeStyle = r.big ? '#FFFFFF' : tint(COLS[r.k], 0.5);
    ctx.globalAlpha = (1 - k) * 0.7;
    ctx.lineWidth = (r.big ? 7 : 3.5) * (1 - k) + 1;
    ctx.beginPath(); ctx.arc(ox + r.x * s, oy + r.y * s, (r.r * (1 + k * 0.7) + 5) * s, 0, TAU); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  for (const p of fx.pops) {
    const a = clamp(1.3 - p.t / 0.7, 0, 1);
    const lb = label(`+${p.v}`, p.size, d || 2, '#0B2B4A');
    const k2 = p.size / Math.max(8, Math.round(p.size / 2) * 2);
    const sc = p.t < 0.12 ? 0.6 + p.t / 0.12 * 0.5 : 1.1 - Math.min(0.1, (p.t - 0.12));
    ctx.globalAlpha = a;
    ctx.drawImage(lb.cv, ox + p.x * s - (lb.w * k2 * sc) / 2, oy + (p.y - p.t * 46) * s - (lb.h * k2 * sc) / 2, lb.w * k2 * sc, lb.h * k2 * sc);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  if (!world.over) {
    const k = world.current();
    const r = RAD[k];
    drawHanging(ctx, L, clamp(aimX, r + 3, W0 - r - 3), k, fill, now, d);
  }
}

function IconBtn({ label: aria, onClick, children, on }) {
  return (
    <button type="button" aria-label={aria} onClick={onClick} style={{ width: 38, height: 38, borderRadius: 19, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: on === false ? 'rgba(255,255,255,0.45)' : '#FFFFFF', background: 'rgba(255,255,255,0.1)', flexShrink: 0 }}>{children}</button>
  );
}

export function BlobGame({ seed, onDuelFinish, onClose, duelTitle }) {
  const duel = !!(seed && onDuelFinish);
  const castId = useRef(`sq-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`);
  const kit = useGameKit();
  const hostRef = useRef(null);
  const bgRef = useRef(null);
  const fgRef = useRef(null);
  const worldRef = useRef(null);
  const fxRef = useRef({ drops: [], pops: [] });
  const aim = useRef(W0 / 2);
  const fillRef = useRef(1);
  const layRef = useRef(null);
  const music = useRef(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => readBest(BLOB_KEY));
  const [queue, setQueue] = useState([]);
  const [over, setOver] = useState(false);
  const [round, setRound] = useState(0);
  const [newBest, setNewBest] = useState(false);
  const perf = useRef(perfMeter());
  const flick = useRef([]);
  const [sent, setSent] = useState(false);
  useEffect(() => {
    const w = new SquishWorld(rng(duel ? `duel:${seed}` : `squish${Date.now()}`));
    worldRef.current = w;
    fxRef.current = { drops: [], pops: [] };
    aim.current = W0 / 2;
    fillRef.current = 1;
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
      const Wc = Math.max(200, Math.floor(host.clientWidth)); const Hc = Math.max(300, Math.floor(host.clientHeight));
      const L = tankLayout(Wc, Hc);
      const b = fitCanvas(bgRef.current, Wc, Hc, 2.5);
      b.ctx.clearRect(0, 0, Wc, Hc);
      b.ctx.drawImage(tankArt(L, b.d), 0, 0, Wc, Hc);
      const f = fitCanvas(fgRef.current, Wc, Hc, 2);
      L.ctx = f.ctx; L.d = f.d;
      layRef.current = L;
    };
    resize();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(host);
    let shownScore = -1; let warned = 0; let lastBump = 0; let lastWater = 0;
    const spray = (x, y, k, n, power) => {
      const fx = fxRef.current;
      for (let i = 0; i < n && fx.drops.length < 160; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
        const sp = (160 + Math.random() * 380) * power;
        fx.drops.push({ x: x + (Math.random() - 0.5) * 10, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 1.4 + Math.random() * 2.6, col: k == null ? 'rgba(200,240,255,0.85)' : (Math.random() < 0.3 ? 'rgba(255,255,255,0.85)' : COLS[k]), life: 0.5 + Math.random() * 0.4 });
      }
    };
    const loop = (tm) => {
      if (!alive) return;
      raf = requestAnimationFrame(loop);
      const p = perf.current;
      p.tick(tm);
      const w0 = performance.now();
      const w = worldRef.current; const L = layRef.current;
      if (!w || !L) return;
      if (!last) last = tm;
      const fdt = Math.min(0.05, (tm - last) / 1000);
      acc += fdt;
      last = tm;
      let steps = 0;
      while (acc >= DT && steps < 5) { if (!w.over) w.step(); acc -= DT; steps += 1; }
      if (steps === 5) acc = 0;
      if (fillRef.current < 1) fillRef.current = Math.min(1, fillRef.current + fdt / 0.3);
      const fx = fxRef.current;
      for (let i = fx.drops.length - 1; i >= 0; i--) {
        const q = fx.drops[i];
        q.life -= fdt; q.vy += 1500 * fdt; q.x += q.vx * fdt; q.y += q.vy * fdt;
        if (q.life <= 0 || (q.vy > 0 && q.y > WATER_Y + 4)) fx.drops.splice(i, 1);
      }
      for (let i = fx.pops.length - 1; i >= 0; i--) { fx.pops[i].t += fdt; if (fx.pops[i].t > 0.95) fx.pops.splice(i, 1); }
      if (w.events.length) {
        w.events.forEach((e) => {
          const pan = clamp(((e.x || W0 / 2) - W0 / 2) / W0, -0.7, 0.7);
          if (e.k === 'merge') {
            sfx('sqMerge', { k: e.tier, pan, combo: e.combo });
            haptic(e.tier > 6 ? 24 : 10);
            spray(e.x, e.y, Math.min(e.tier, COLS.length - 1), 10 + Math.min(14, e.tier * 2), 0.8 + Math.min(0.8, e.tier * 0.06));
            fx.pops.push({ x: e.x, y: e.y - 6, v: tierValue(e.tier), size: 15 + Math.min(10, e.tier) + (e.combo > 1 ? 4 : 0), t: 0 });
          } else if (e.k === 'drop') sfx('sqThrow', { v: clamp((e.v - 800) / 1400, 0, 1), pan });
          else if (e.k === 'water') { if (tm - lastWater > 90) { sfx('sqWater', { v: clamp(e.v / 1400, 0.1, 1), pan }); lastWater = tm; } spray(e.x, WATER_Y, null, 8 + Math.round(clamp(e.v / 200, 0, 8)), clamp(e.v / 1500, 0.4, 1)); }
          else if ((e.k === 'bump' || e.k === 'floor') && tm - lastBump > 70) {
            sfx('sqSplat', { v: clamp(e.v / 1100, 0.05, 1), small: clamp(e.small, 0, 10) / 10, pan });
            lastBump = tm;
            if (e.v > 900) spray(e.x, e.y, null, 4, 0.5);
          }
        });
        w.events.length = 0;
      }
      if (w.score !== shownScore) { shownScore = w.score; setScore(w.score); }
      if (w.danger > 0 && tm - warned > 520 && !w.over) { sfx('sqWarn'); warned = tm; }
      if (w.over && !w.reported) {
        w.reported = true;
        sfx('sqOver');
        const b0 = readBest(BLOB_KEY);
        if (!duel && w.score > b0) { writeBest(BLOB_KEY, w.score); setBest(w.score); setNewBest(true); }
        if (!duel && w.score > 0) noteSoloScore(BLOB_KEY, w.score);
        setOver(true);
      }
      draw(L.ctx, L, w, fx, aim.current, fillRef.current, tm, L.d);
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
  const dropNow = (vx, vy) => {
    const w = worldRef.current;
    if (!w || w.over || fillRef.current < 1) return;
    if (music.current && kit.musicOn) music.current.start();
    w.drop(aim.current, vx, vy);
    setQueue(w.queue.slice(1, 4));
    fillRef.current = 0;
    setTimeout(() => sfx('sqFill'), 40);
  };
  const note = (e) => { const list = flick.current; list.push([e.clientX, e.clientY, performance.now()]); if (list.length > 8) list.shift(); };
  const throwVel = () => {
    const list = flick.current;
    const L = layRef.current;
    if (!L || list.length < 2) return [0, 980];
    const [x1, y1, t1] = list[list.length - 1];
    let k = list.length - 2;
    while (k > 0 && t1 - list[k][2] < 90) k -= 1;
    const [x0, y0, t0] = list[k];
    const dt = Math.max(16, t1 - t0);
    const vy = (((y1 - y0) / dt) * 1000) / L.s;
    const vx = (((x1 - x0) / dt) * 1000) / L.s;
    const down = vy > 320 ? Math.min(2300, 980 + (vy - 320) * 0.95) : 980;
    const side = vy > 320 && Math.abs(vx) > 260 ? clamp(vx * 0.3, -380, 380) : 0;
    return [side, down];
  };
  const down = useRef(false);
  useEffect(() => {
    if (g1Test()) {
      window.__gbblob = {
        world: () => worldRef.current,
        drop: (x, vy) => { aim.current = x; fillRef.current = 1; dropNow(0, vy); },
        stats: () => perf.current.report(),
        resetStats: () => perf.current.reset(),
        fill: (n, mk) => { const w = worldRef.current; for (let i = 0; i < n; i++) { const k = (i * 3) % ((mk || 4) + 1); const b = new Balloon(k, 36 + ((i * 61) % 290), 600 - Math.floor(i / 7) * 52, w.nextId++); b.age = 2; w.balloons.push(b); } },
        noMerge: () => { worldRef.current.balloons.forEach((b) => { b.cool = 1e9; }); const w = worldRef.current; const d0 = w.drop.bind(w); w.drop = (...a) => { const b = d0(...a); if (b) b.cool = 1e9; return b; }; },
        noOver: () => { const w = worldRef.current; w.step0 = w.step; w.step = function () { w.step0(); w.danger = 0; }; },
      };
    }
  });
  const share = () => { if (!best) return; try { window.dispatchEvent(new CustomEvent('zchat-share-score', { detail: { k: BLOB_KEY, s: best } })); } catch {} };
  const challenge = () => { try { window.dispatchEvent(new CustomEvent('zchat-challenge', { detail: { kind: `sd:${BLOB_KEY}` } })); } catch {} };
  const close = () => { if (onClose) { onClose(); return; } try { window.history.back(); } catch {} };
  const sendScore = () => { if (sent || !onDuelFinish) return; setSent(true); onDuelFinish(worldRef.current ? worldRef.current.score : score); };
  const top = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px 4px', fontFamily: FONT, color: '#FFFFFF' }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 26, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.02em' }}>{score}</div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.62)', marginTop: 3 }}>{duel ? 'Same balloons as your friend' : `Best ${Math.max(best, score)}`}</div>
      </div>
      <div style={{ flex: 1 }} />
      <div aria-label="Next balloons" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px 4px 12px', borderRadius: 20, background: 'rgba(0,16,32,0.42)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)' }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.6)', marginRight: 2 }}>Next</span>
        {queue.map((k, i) => <MiniBalloon key={`${i}${k}`} k={k} size={i === 0 ? 28 : 22} />)}
      </div>
      {!duel && <IconBtn label="Share your best" onClick={share}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" /><path d="M16 6l-4-4-4 4" /><path d="M12 2v13" /></svg></IconBtn>}
    </div>
  );
  return (
    <GameRoom title={duelTitle || 'Squish'} scene={<PoolScene />} music={false} rules={GAME_RULES.squish} onClose={close} top={top}
      cast={{ game: 'squish', room: castId.current, info: duel ? { sd: 1 } : {}, solo: !duel }}>
      <div ref={hostRef} style={{ position: 'relative', width: '100%', height: '100%', alignSelf: 'stretch', touchAction: 'none' }}
        onPointerDown={(e) => { if (over) return; try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} down.current = true; flick.current = []; note(e); aim.current = toWorld(e); }}
        onPointerMove={(e) => { if (over) return; if (down.current) note(e); aim.current = toWorld(e); }}
        onPointerUp={(e) => { if (!down.current) return; down.current = false; note(e); const [vx, vy] = throwVel(); dropNow(vx, vy); }}
        onPointerCancel={() => { down.current = false; }}>
        <canvas ref={bgRef} style={{ position: 'absolute', left: 0, top: 0, display: 'block' }} />
        <canvas ref={fgRef} style={{ position: 'absolute', left: 0, top: 0, display: 'block' }} />
        {over && (
          <div onPointerDown={(e) => e.stopPropagation()} style={{ position: 'absolute', left: '50%', top: '42%', transform: 'translate(-50%, -50%)', width: 'min(84%, 300px)', borderRadius: 24, padding: '20px 18px 16px', background: 'rgba(8,26,46,0.95)', boxShadow: '0 20px 50px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.09)', color: '#FFFFFF', textAlign: 'center', fontFamily: FONT }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.65)' }}>{duel ? 'Your score' : newBest ? 'New best' : 'The tank is full'}</div>
            <div style={{ fontSize: 44, fontWeight: 900, letterSpacing: '-0.03em', marginTop: 2 }}>{score}</div>
            {!duel && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Best {Math.max(best, score)}</div>}
            {duel ? (
              <button type="button" onClick={sendScore} disabled={sent} style={{ width: '100%', marginTop: 16, height: 48, borderRadius: 16, border: 'none', cursor: sent ? 'default' : 'pointer', fontFamily: FONT, fontWeight: 900, fontSize: 15.5, color: '#3A2508', background: 'linear-gradient(180deg, #FFE08A, #FFC93C)', boxShadow: '0 3px 0 #B8860B', opacity: sent ? 0.6 : 1 }}>{sent ? 'Sending' : 'Send my score'}</button>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button type="button" onClick={share} style={{ flex: 1, height: 46, borderRadius: 16, border: 'none', cursor: 'pointer', fontFamily: FONT, fontWeight: 800, fontSize: 15, color: '#FFFFFF', background: 'rgba(255,255,255,0.12)' }}>Share</button>
                  <button type="button" onClick={() => setRound((x) => x + 1)} style={{ flex: 1.3, height: 46, borderRadius: 16, border: 'none', cursor: 'pointer', fontFamily: FONT, fontWeight: 900, fontSize: 15, color: '#3A2508', background: 'linear-gradient(180deg, #FFE08A, #FFC93C)', boxShadow: '0 3px 0 #B8860B' }}>Play again</button>
                </div>
                <button type="button" onClick={challenge} style={{ width: '100%', marginTop: 10, height: 44, borderRadius: 16, border: 'none', cursor: 'pointer', fontFamily: FONT, fontWeight: 800, fontSize: 14.5, color: '#FFFFFF', background: 'rgba(31,163,221,0.55)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.16)' }}>Play with a friend</button>
              </>
            )}
          </div>
        )}
      </div>
    </GameRoom>
  );
}
