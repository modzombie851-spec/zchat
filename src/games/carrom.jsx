import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { GameRoom, RoomLayer, defineSfx, sfx, haptic, useGameKit } from './kit.jsx';
import { clamp, lerp, makeCanvas, fitCanvas, dpr, grain, woodTexture, rrect, rgba, shade, tint, mix, perfMeter, noiseHit, tone, loopNoise, easeOut, rng, r2 } from './physics.jsx';
import { CarromSim, BW, C, CR, SR, PR, POCK, BASE_HALF, QUEEN, isWhite, isBlack, baseY, strikerOk, judge, colorOfMark, findShot } from './carromsim.jsx';
import { useShotLink, throttle } from './live.jsx';
import { useBackClose, Avatar, appSnack, g1Send, g1Mem, g1First, g1Outcome, g1Test, ConfirmSheet, FONT, GameCardShell, GameButton, GameAgainButton, useTheme } from '../App.jsx';

const FR = 70;
const SURFACE = '#E9C99A';
const FPS_REC = 120;

defineSfx('crmStrike', (c, out, o) => {
  const v = clamp(o.v == null ? 0.5 : o.v, 0.05, 1);
  noiseHit(c, out, { freq: 2400, q: 1.4, gain: 0.18 + v * 0.36, decay: 0.03 });
  tone(c, out, { freq: 880, to: 520, gain: 0.06 + v * 0.1, decay: 0.05 });
});
defineSfx('crmClack', (c, out, o) => {
  const v = clamp(o.v == null ? 0.5 : o.v, 0.03, 1);
  const f = 2100 + Math.random() * 700;
  noiseHit(c, out, { freq: f, q: 4.5, gain: 0.1 + v * 0.5, decay: 0.022 + v * 0.025, pan: o.pan });
  tone(c, out, { freq: f * 0.5, gain: 0.03 + v * 0.1, decay: 0.035, type: 'triangle', pan: o.pan });
});
defineSfx('crmWall', (c, out, o) => {
  const v = clamp(o.v == null ? 0.5 : o.v, 0.03, 1);
  tone(c, out, { freq: 240, to: 150, gain: 0.08 + v * 0.22, decay: 0.07, pan: o.pan });
  noiseHit(c, out, { freq: 1100, q: 2, gain: 0.05 + v * 0.18, decay: 0.03, pan: o.pan });
});
defineSfx('crmPocket', (c, out, o) => {
  const t = c.currentTime;
  tone(c, out, { t0: t, freq: 210, to: 120, gain: 0.22, decay: 0.1, pan: o.pan });
  noiseHit(c, out, { t0: t + 0.02, freq: 600, q: 0.7, type: 'lowpass', gain: 0.16, decay: 0.16, kind: 'p', pan: o.pan });
  noiseHit(c, out, { t0: t + 0.09, freq: 1700, q: 3, gain: 0.05, decay: 0.03, pan: o.pan });
});
defineSfx('crmSlide', (c, out) => { noiseHit(c, out, { freq: 2600, q: 0.6, type: 'highpass', gain: 0.04, decay: 0.05 }); });

function coinPalette(id) {
  if (id === 0) return { base: '#F6F2EA', dark: '#B9B2A4', ring: '#3C6FB8', accent: '#D23B4A' };
  if (id === QUEEN) return { base: '#C9213A', dark: '#7A0F1F', ring: '#F4C46A', accent: '#F9D88E' };
  if (isWhite(id)) return { base: '#EFE2C4', dark: '#B79F72', ring: '#9C845A', accent: '#FFF7E4' };
  return { base: '#2B1E16', dark: '#0F0906', ring: '#5C4434', accent: '#6E5544' };
}

const SPRITES = new Map();
function coinSprite(kind, rp) {
  const key = `${kind}:${Math.round(rp * 4) / 4}`;
  if (SPRITES.has(key)) return SPRITES.get(key);
  const S = Math.ceil(rp * 2) + 4;
  const cv = makeCanvas(S, S);
  const g = cv.getContext('2d');
  const c = S / 2;
  const id = kind === 'striker' ? 0 : kind === 'q' ? QUEEN : kind === 'w' ? 1 : 10;
  const p = coinPalette(id);
  const body = g.createRadialGradient(c - rp * 0.3, c - rp * 0.35, rp * 0.1, c, c, rp);
  body.addColorStop(0, tint(p.base, 0.18));
  body.addColorStop(0.7, p.base);
  body.addColorStop(1, p.dark);
  g.fillStyle = body;
  g.beginPath(); g.arc(c, c, rp, 0, Math.PI * 2); g.fill();
  g.save();
  g.beginPath(); g.arc(c, c, rp, 0, Math.PI * 2); g.clip();
  const rnd = rng(`grain${kind}`);
  g.strokeStyle = rgba(id === 0 ? '#C8C0B0' : p.dark, id === 0 ? 0.18 : 0.22);
  g.lineWidth = Math.max(0.5, rp * 0.05);
  for (let k = -6; k <= 6; k++) {
    g.beginPath();
    const yy = c + (k / 6) * rp + (rnd() - 0.5) * rp * 0.08;
    g.moveTo(c - rp, yy);
    g.bezierCurveTo(c - rp * 0.3, yy + (rnd() - 0.5) * rp * 0.25, c + rp * 0.3, yy + (rnd() - 0.5) * rp * 0.25, c + rp, yy);
    g.stroke();
  }
  g.restore();
  const ring = (rr, w, col, a) => { g.strokeStyle = rgba(col, a); g.lineWidth = w; g.beginPath(); g.arc(c, c, rr, 0, Math.PI * 2); g.stroke(); };
  if (id === 0) {
    ring(rp * 0.86, rp * 0.08, p.ring, 0.85);
    ring(rp * 0.62, rp * 0.05, p.accent, 0.8);
    g.fillStyle = rgba(p.ring, 0.9);
    g.beginPath();
    for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2 - Math.PI / 2; const rr = k % 2 ? rp * 0.18 : rp * 0.42; g.lineTo(c + Math.cos(a) * rr, c + Math.sin(a) * rr); }
    g.closePath(); g.fill();
    ring(rp * 0.96, rp * 0.04, '#FFFFFF', 0.6);
  } else {
    ring(rp * 0.78, rp * 0.09, p.dark, 0.55);
    ring(rp * 0.74, rp * 0.04, p.accent, 0.35);
    ring(rp * 0.42, rp * 0.08, p.dark, 0.5);
    ring(rp * 0.38, rp * 0.035, p.accent, 0.3);
    if (id === QUEEN) ring(rp * 0.6, rp * 0.07, p.ring, 0.75);
  }
  const hl = g.createLinearGradient(c - rp, c - rp, c + rp, c + rp);
  hl.addColorStop(0, 'rgba(255,255,255,0.32)');
  hl.addColorStop(0.45, 'rgba(255,255,255,0.02)');
  hl.addColorStop(1, 'rgba(0,0,0,0.25)');
  g.fillStyle = hl;
  g.beginPath(); g.arc(c, c, rp, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.45)';
  g.lineWidth = Math.max(0.6, rp * 0.05);
  g.beginPath(); g.arc(c, c, rp - g.lineWidth / 2, 0, Math.PI * 2); g.stroke();
  const out = { cv, S };
  if (SPRITES.size > 40) SPRITES.clear();
  SPRITES.set(key, out);
  return out;
}

let SHADOW = null;
function shadowSprite() {
  if (SHADOW) return SHADOW;
  const S = 64;
  const cv = makeCanvas(S, S);
  const g = cv.getContext('2d');
  const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  gr.addColorStop(0, 'rgba(40,20,5,0.9)');
  gr.addColorStop(0.55, 'rgba(40,20,5,0.55)');
  gr.addColorStop(1, 'rgba(40,20,5,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, S, S);
  SHADOW = cv;
  return cv;
}

export function carromLayout(W, H, pad) {
  const p = pad == null ? 8 : pad;
  const tot = BW + 2 * FR;
  const s = Math.max(0.01, Math.min((W - 2 * p) / tot, (H - 2 * p) / tot));
  const fx = (W - tot * s) / 2; const fy = (H - tot * s) / 2;
  return { W, H, s, fx, fy, fw: tot * s, ox: fx + FR * s, oy: fy + FR * s };
}

const ART = new Map();
function boardArt(L) {
  const d = dpr(2.5);
  const key = `${L.W}x${L.H}@${d}`;
  if (ART.has(key)) return ART.get(key);
  const cv = makeCanvas(L.W * d, L.H * d);
  const ctx = cv.getContext('2d');
  ctx.scale(d, d);
  drawBoard(ctx, L, d);
  if (ART.size > 4) ART.clear();
  ART.set(key, cv);
  return cv;
}

function drawBoard(ctx, L, d) {
  const { s } = L;
  const X = (x) => L.ox + x * s;
  const Y = (y) => L.oy + y * s;
  const lw = (mm) => Math.max(0.7, mm * s);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = '#20120A';
  rrect(ctx, L.fx, L.fy, L.fw, L.fw, 34 * s);
  ctx.fill();
  ctx.restore();
  const wd = Math.min(d, 1.5);
  const frame = woodTexture(Math.ceil(L.fw * wd), Math.ceil(L.fw * wd), 'crm-frame', ['#5B2A16', '#2A0F06', '#8A4A2A'], { spacing: 3 * wd, wave: 2.2 * wd, thick: 1.4 * wd, knots: 2 });
  ctx.save();
  rrect(ctx, L.fx, L.fy, L.fw, L.fw, 34 * s);
  ctx.clip();
  ctx.drawImage(frame, L.fx, L.fy, L.fw, L.fw);
  const fg = ctx.createLinearGradient(L.fx, L.fy, L.fx + L.fw, L.fy + L.fw);
  fg.addColorStop(0, 'rgba(255,210,160,0.16)');
  fg.addColorStop(0.5, 'rgba(255,210,160,0.02)');
  fg.addColorStop(1, 'rgba(0,0,0,0.25)');
  ctx.fillStyle = fg;
  ctx.fillRect(L.fx, L.fy, L.fw, L.fw);
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,214,170,0.25)';
  ctx.lineWidth = 1;
  rrect(ctx, L.fx + 1, L.fy + 1, L.fw - 2, L.fw - 2, 33 * s);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.lineWidth = lw(10);
  ctx.strokeRect(X(-5), Y(-5), (BW + 10) * s, (BW + 10) * s);
  ctx.strokeStyle = 'rgba(255,220,180,0.3)';
  ctx.lineWidth = lw(3);
  ctx.strokeRect(X(-12), Y(-12), (BW + 24) * s, (BW + 24) * s);

  const ply = woodTexture(Math.ceil(BW * s * wd), Math.ceil(BW * s * wd), 'crm-ply', [SURFACE, '#C9A06A', '#F7E2BE'], { spacing: 2.4 * wd, wave: 1.6 * wd, thick: 1.1 * wd, knots: 0 });
  ctx.drawImage(ply, X(0), Y(0), BW * s, BW * s);
  const lamp = ctx.createRadialGradient(X(C), Y(C * 0.95), BW * s * 0.05, X(C), Y(C), BW * s * 0.78);
  lamp.addColorStop(0, 'rgba(255,248,230,0.32)');
  lamp.addColorStop(0.55, 'rgba(255,240,210,0.06)');
  lamp.addColorStop(1, 'rgba(60,30,8,0.28)');
  ctx.fillStyle = lamp;
  ctx.fillRect(X(0), Y(0), BW * s, BW * s);
  const dust = grain(140, 140, 'powder', { amp: 60, base: 200 });
  const pat = ctx.createPattern(dust, 'repeat');
  if (pat && pat.setTransform && typeof DOMMatrix !== 'undefined') pat.setTransform(new DOMMatrix().scale(1 / d, 1 / d));
  ctx.globalAlpha = 0.07;
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = pat || 'transparent';
  ctx.fillRect(X(0), Y(0), BW * s, BW * s);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;

  const ink = '#1C1410';
  const red = '#B8202E';
  ctx.strokeStyle = ink;
  ctx.lineCap = 'round';
  const sides = [0, 1, 2, 3];
  sides.forEach((k) => {
    ctx.save();
    ctx.translate(X(C), Y(C));
    ctx.rotate((k * Math.PI) / 2);
    const o1 = (102 - C) * s; const o2 = (133.8 - C) * s;
    ctx.lineWidth = lw(1.8);
    ctx.beginPath();
    ctx.moveTo(-235 * s, o1); ctx.lineTo(235 * s, o1);
    ctx.moveTo(-235 * s, o2); ctx.lineTo(235 * s, o2);
    ctx.stroke();
    [-1, 1].forEach((sd) => {
      const cx = sd * BASE_HALF * s; const cy = ((102 + 133.8) / 2 - C) * s;
      ctx.fillStyle = red;
      ctx.beginPath(); ctx.arc(cx, cy, 13.5 * s, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = lw(1.6);
      ctx.beginPath(); ctx.arc(cx, cy, 15.9 * s, 0, Math.PI * 2); ctx.stroke();
    });
    ctx.restore();
    ctx.save();
    ctx.translate(X(C), Y(C));
    ctx.rotate((k * Math.PI) / 2 + Math.PI / 4);
    const a0 = -(C * Math.SQRT2 - 80) * s; const a1 = -(C * Math.SQRT2 - 345) * s;
    ctx.lineWidth = lw(1.8);
    ctx.beginPath(); ctx.moveTo(0, a0); ctx.lineTo(0, a1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-9 * s, a0 + 15 * s); ctx.lineTo(0, a0); ctx.lineTo(9 * s, a0 + 15 * s); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, a1 - 2 * s, 31.75 * s, Math.PI * 0.18, Math.PI * 0.82); ctx.stroke();
    ctx.restore();
  });
  ctx.save();
  ctx.translate(X(C), Y(C));
  ctx.lineWidth = lw(2);
  ctx.beginPath(); ctx.arc(0, 0, 85 * s, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = lw(1);
  ctx.beginPath(); ctx.arc(0, 0, 80 * s, 0, Math.PI * 2); ctx.stroke();
  for (let k = 0; k < 8; k++) {
    ctx.save();
    ctx.rotate((k * Math.PI) / 4);
    ctx.fillStyle = k % 2 ? ink : red;
    ctx.beginPath();
    ctx.moveTo(0, -76 * s); ctx.lineTo(9 * s, -24 * s); ctx.lineTo(0, -18 * s); ctx.lineTo(-9 * s, -24 * s); ctx.closePath();
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = SURFACE;
  ctx.beginPath(); ctx.arc(0, 0, 17 * s, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = red;
  ctx.beginPath(); ctx.arc(0, 0, 15.9 * s, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = lw(1.4);
  ctx.beginPath(); ctx.arc(0, 0, 15.9 * s, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  POCK.forEach(([px, py]) => {
    const g = ctx.createRadialGradient(X(px), Y(py), PR * s * 0.2, X(px), Y(py), PR * s);
    g.addColorStop(0, '#000');
    g.addColorStop(0.75, '#0A0604');
    g.addColorStop(1, '#2A1A10');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(X(px), Y(py), PR * s, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.beginPath(); ctx.arc(X(px), Y(py), PR * s * 0.92, 0, Math.PI * 2); ctx.clip();
    ctx.strokeStyle = 'rgba(160,140,110,0.18)';
    ctx.lineWidth = 0.6;
    for (let k = -6; k <= 6; k++) {
      ctx.beginPath(); ctx.moveTo(X(px) + k * 3.2 * s * 2 - PR * s, Y(py) - PR * s); ctx.lineTo(X(px) + k * 3.2 * s * 2 + PR * s, Y(py) + PR * s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(X(px) + k * 3.2 * s * 2 + PR * s, Y(py) - PR * s); ctx.lineTo(X(px) + k * 3.2 * s * 2 - PR * s, Y(py) + PR * s); ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,230,190,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(X(px), Y(py), PR * s + 0.5, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
  });
}

export function drawCarromPreview(cv, w, h, coins) {
  const { ctx } = fitCanvas(cv, w, h, 2);
  ctx.clearRect(0, 0, w, h);
  const L = carromLayout(w, h, 2);
  ctx.drawImage(boardArt(L), 0, 0, w, h);
  const d = dpr(2);
  const r = CR * L.s;
  (coins || []).forEach(([id, x, y]) => {
    const sp = coinSprite(id === QUEEN ? 'q' : isWhite(id) ? 'w' : 'k', r * d);
    const sw = sp.S / d;
    ctx.globalAlpha = 0.45;
    ctx.drawImage(shadowSprite(), L.ox + x * L.s - r + r * 0.15, L.oy + y * L.s - r + r * 0.25, r * 2, r * 2);
    ctx.globalAlpha = 1;
    ctx.drawImage(sp.cv, L.ox + x * L.s - sw / 2, L.oy + y * L.s - sw / 2, sw, sw);
  });
}

export function CarromPreview({ w = 220, h = 220, coins }) {
  const ref = useRef(null);
  const sig = (coins || []).map((b) => b.join(',')).join(';');
  useLayoutEffect(() => { if (ref.current) drawCarromPreview(ref.current, w, h, coins); }, [w, h, sig]);
  return <canvas ref={ref} role="img" aria-label="The carrom board" style={{ display: 'block', width: w, height: h, borderRadius: 12 }} />;
}

export class CarromBoard {
  constructor(host, o) {
    this.host = host;
    this.o = { canShoot: false, mark: 'x', flip: false, ...o };
    this.coins = (o && o.coins) || [];
    this.ang = new Map();
    this.sx = C;
    this.aim = null;
    this.anim = null;
    this.remote = null;
    this.drag = null;
    this.dead = false;
    this.dirty = true;
    this.loopOn = false;
    this.perf = perfMeter();
    this.hum = loopNoise('p', 900, 0.5);
    this.bg = document.createElement('canvas');
    this.fg = document.createElement('canvas');
    [this.bg, this.fg].forEach((c) => { c.style.position = 'absolute'; c.style.left = '0'; c.style.top = '0'; c.style.display = 'block'; });
    this.fg.style.touchAction = 'none';
    host.appendChild(this.bg);
    host.appendChild(this.fg);
    this.frame = this.frame.bind(this);
    this.down = this.down.bind(this);
    this.move = this.move.bind(this);
    this.up = this.up.bind(this);
    this.fg.addEventListener('pointerdown', this.down);
    this.fg.addEventListener('pointermove', this.move);
    this.fg.addEventListener('pointerup', this.up);
    this.fg.addEventListener('pointercancel', this.up);
    this.ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => this.resize()) : null;
    if (this.ro) this.ro.observe(host);
    this.resize();
    this.fixStriker();
  }

  resize() {
    if (this.dead || !this.host.isConnected) return;
    const r = { width: this.host.clientWidth, height: this.host.clientHeight };
    const W = Math.max(120, Math.floor(r.width)); const H = Math.max(120, Math.floor(r.height));
    if (this.L && this.L.W === W && this.L.H === H) return;
    this.L = carromLayout(W, H, 6);
    const b = fitCanvas(this.bg, W, H, 2.5);
    b.ctx.clearRect(0, 0, W, H);
    b.ctx.drawImage(boardArt(this.L), 0, 0, W, H);
    const f = fitCanvas(this.fg, W, H, 2.5);
    this.ctx = f.ctx;
    this.d = f.d;
    if (this.o.onLayout) this.o.onLayout(this.L);
    this.dirty = true;
    this.kick();
  }

  X(x, y) { return this.L.ox + (this.o.flip ? BW - x : x) * this.L.s; }
  Y(x, y) { return this.L.oy + (this.o.flip ? BW - y : y) * this.L.s; }
  toBoard(e) {
    const r = this.fg.getBoundingClientRect();
    let x = (e.clientX - r.left - this.L.ox) / this.L.s; let y = (e.clientY - r.top - this.L.oy) / this.L.s;
    if (this.o.flip) { x = BW - x; y = BW - y; }
    return [x, y];
  }

  kick() {
    if (this.dead || this.loopOn) return;
    this.loopOn = true;
    this.raf = requestAnimationFrame(this.frame);
  }

  set(p) {
    this.o = { ...this.o, ...p };
    if (p.coins && !this.anim) this.coins = p.coins;
    if (p.coins || p.canShoot) this.fixStriker();
    this.dirty = true;
    this.kick();
  }

  fwd() { return this.o.mark === 'x' ? -1 : 1; }

  fixStriker() {
    if (strikerOk(this.coins, this.sx, this.o.mark)) return;
    let best = this.sx;
    for (let k = 0; k <= 60; k++) {
      for (const sg of [1, -1]) {
        const x = clamp(this.sx + sg * k * 7.3, C - BASE_HALF, C + BASE_HALF);
        if (strikerOk(this.coins, x, this.o.mark)) { this.sx = x; return; }
      }
    }
    this.sx = best;
  }

  setStriker(x) {
    const nx = clamp(x, C - BASE_HALF, C + BASE_HALF);
    if (Math.abs(nx - this.sx) > 9) sfx('crmSlide');
    this.sx = nx;
    this.aim = null;
    if (this.o.onAim) this.o.onAim();
    this.dirty = true;
    this.kick();
  }

  strikerOk() { return strikerOk(this.coins, this.sx, this.o.mark); }

  down(e) {
    if (!this.o.canShoot || this.anim || !this.L) return;
    const [x, y] = this.toBoard(e);
    try { this.fg.setPointerCapture(e.pointerId); } catch {}
    const by = baseY(this.o.mark);
    const near = Math.hypot(x - this.sx, y - by) < Math.max(SR * 2.6, 34 / this.L.s);
    this.drag = { id: e.pointerId, x0: x, y0: y, k: near ? 'pick' : 'aim', ox: this.sx - x };
    if (!near) this.aimTo(x, y, null);
  }

  move(e) {
    const d = this.drag;
    if (!d || d.id !== e.pointerId) return;
    const [x, y] = this.toBoard(e);
    if (d.k === 'pick') {
      const mx = x - d.x0; const my = y - d.y0;
      if (Math.hypot(mx, my) * this.L.s < 8) return;
      d.k = Math.abs(mx) > Math.abs(my) * 1.3 ? 'place' : 'pull';
    }
    if (d.k === 'place') { this.setStriker(x + d.ox); return; }
    if (d.k === 'pull') {
      const by = baseY(this.o.mark);
      const vx = this.sx - x; const vy = by - y;
      const l = Math.hypot(vx, vy);
      const pw = clamp((l * this.L.s - 14) / 120, 0, 1);
      if (l > 1) this.aimTo(this.sx + vx, by + vy, pw);
      return;
    }
    this.aimTo(x, y, null);
  }

  up(e) {
    const d = this.drag;
    if (!d || d.id !== e.pointerId) return;
    this.drag = null;
    if (d.k === 'pull' && this.aim && this.aim.p > 0.04) {
      if (!this.aim.ok) { appSnack('Shoot forward, away from your line'); this.aim.p = 0; this.dirty = true; this.kick(); return; }
      if (this.o.onShoot) this.o.onShoot();
    } else if (d.k === 'pull' && this.aim) { this.aim.p = 0; this.dirty = true; this.kick(); }
  }

  aimTo(x, y, p) {
    const by = baseY(this.o.mark);
    const dx = x - this.sx; const dy = y - by;
    const l = Math.hypot(dx, dy);
    if (l < SR * 1.2) return;
    const ux = dx / l; const uy = dy / l;
    this.aim = { ux, uy, p: p == null ? (this.aim ? this.aim.p : 0) : p, ok: uy * this.fwd() > 0.06 };
    if (this.o.onAim) this.o.onAim();
    this.dirty = true;
    this.kick();
  }

  makeShot(power) {
    if (!this.o.canShoot || this.anim || !this.aim || !this.aim.ok) return null;
    if (!this.strikerOk()) return null;
    const p = power == null ? this.aim.p : power;
    if (p < 0.03) return null;
    return { sx: r2(this.sx), dx: Math.round(this.aim.ux * 1e6), dy: Math.round(this.aim.uy * 1e6), p: Math.round(clamp(p, 0.01, 1) * 1000) };
  }

  aimState() { return { sx: Math.round(this.sx * 10) / 10, ux: this.aim ? Math.round(this.aim.ux * 1e4) / 1e4 : null, uy: this.aim ? Math.round(this.aim.uy * 1e4) / 1e4 : null, p: this.aim ? Math.round(this.aim.p * 100) / 100 : 0 }; }

  setRemote(r) { this.remote = r; this.dirty = true; this.kick(); }

  play(start, shot, mark, cb) {
    const sim = new CarromSim(start, shot, mark);
    for (let i = 0; i < sim.n; i++) { const a0 = this.ang.get(sim.ids[i]); if (a0 != null && sim.ids[i] !== 0) sim.a[i] = a0; }
    sim.count = 0;
    sim.record();
    this.aim = null;
    this.remote = null;
    const l = Math.hypot(shot.dx, shot.dy) || 1;
    this.anim = { sim, shot, mark, cb: cb || {}, phase: 'flick', at: performance.now(), dur: 110, ev: 0, sent: false, t0: 0, pt: 0, start, ux: shot.dx / l, uy: shot.dy / l };
    this.dirty = true;
    this.kick();
    return sim;
  }

  busy() { return !!this.anim; }

  frame(now) {
    if (this.dead) return;
    const w0 = performance.now();
    this.perf.tick(now);
    const moving = this.update(now);
    if (this.dirty || moving) { this.draw(now); this.dirty = false; }
    this.perf.work(performance.now() - w0);
    if (moving || this.dirty) this.raf = requestAnimationFrame(this.frame);
    else this.loopOn = false;
  }

  update(now) {
    const a = this.anim;
    if (!a) return false;
    const sim = a.sim;
    if (!sim.done) sim.run(a.phase === 'flick' ? 4 : 2.5);
    if (sim.done && !a.sent) { a.sent = true; if (a.cb.onResult) a.cb.onResult(sim.result(), sim); }
    if (a.phase === 'flick') {
      if (now - a.at >= a.dur) { a.phase = 'roll'; a.t0 = now; sfx('crmStrike', { v: a.shot.p / 1000 }); haptic(10); }
      return true;
    }
    const pt = (now - a.t0) / 1000;
    a.pt = pt;
    const ev = sim.events;
    let last = -1;
    while (a.ev < ev.length && ev[a.ev].t <= pt) {
      const e = ev[a.ev];
      a.ev += 1;
      const fo = (Math.min(sim.count - 1, Math.floor(e.t * FPS_REC)) * sim.n + e.i) * 3;
      let pan = clamp((sim.frames[fo] - C) / BW, -0.7, 0.7) || 0;
      if (this.o.flip) pan = -pan;
      if (e.k === 1 && e.s > 40 && pt - last > 0.01) { sfx('crmClack', { v: clamp(e.s / 3500, 0.04, 1), pan }); last = pt; }
      else if (e.k === 2 && e.s > 80) sfx('crmWall', { v: clamp(e.s / 3500, 0.04, 1), pan });
      else if (e.k === 3) { sfx('crmPocket', { pan }); haptic(8); }
    }
    let speed = 0;
    const f0 = Math.min(sim.count - 1, Math.floor(pt * FPS_REC)); const f1 = Math.min(sim.count - 1, f0 + 1);
    if (f1 > f0) for (let i = 0; i < sim.n; i++) { const o0 = (f0 * sim.n + i) * 3; const o1 = (f1 * sim.n + i) * 3; speed += Math.hypot(sim.frames[o1] - sim.frames[o0], sim.frames[o1 + 1] - sim.frames[o0 + 1]) * FPS_REC; }
    this.hum.set(clamp(speed / 30000, 0, 0.12), 700 + clamp(speed / 8, 0, 1600));
    let tail = 0.1;
    for (let i = 0; i < sim.n; i++) if (sim.potT[i] >= 0 && sim.potT[i] > sim.duration - 0.35) tail = Math.max(tail, sim.potT[i] - sim.duration + 0.35);
    if (sim.done && pt >= sim.duration + tail) {
      this.hum.set(0);
      const res = sim.result();
      for (let i = 0; i < sim.n; i++) if (sim.on[i] && sim.ids[i] !== 0) this.ang.set(sim.ids[i], sim.a[i]);
      this.anim = null;
      this.coins = res.final;
      this.dirty = true;
      if (a.cb.onDone) a.cb.onDone(res, sim);
      return false;
    }
    return true;
  }

  view(pt) {
    const a = this.anim;
    const out = [];
    if (!a || a.phase === 'flick') {
      const list = a ? a.start : this.coins;
      list.forEach(([id, x, y]) => out.push({ id, x, y, ang: this.ang.has(id) ? this.ang.get(id) : ((id * 2654435761) % 6283) / 1000, a: 1, sc: 1 }));
      if (a) out.push({ id: 0, x: clamp(a.shot.sx, C - BASE_HALF, C + BASE_HALF), y: baseY(a.mark), ang: 0, a: 1, sc: 1 });
      return out;
    }
    const sim = a.sim;
    const fi = pt * FPS_REC;
    const lastF = sim.count - 1;
    const f0 = Math.max(0, Math.min(lastF, Math.floor(fi))); const f1 = Math.min(lastF, f0 + 1);
    const k = f1 > f0 ? clamp(fi - f0, 0, 1) : 0;
    const F = sim.frames;
    for (let i = 0; i < sim.n; i++) {
      const o0 = (f0 * sim.n + i) * 3; const o1 = (f1 * sim.n + i) * 3;
      let x = lerp(F[o0], F[o1], k); let y = lerp(F[o0 + 1], F[o1 + 1], k);
      const ang = lerp(F[o0 + 2], F[o1 + 2], k);
      const tp = sim.potT[i];
      if (tp >= 0 && pt >= tp) {
        const dt = pt - tp;
        if (dt > 0.34) continue;
        const pk = POCK[sim.potPk[i]];
        const u = easeOut(clamp(dt / 0.22, 0, 1));
        x = lerp(sim.x[i], pk[0], u); y = lerp(sim.y[i], pk[1], u);
        out.push({ id: sim.ids[i], x, y, ang, a: 1 - clamp((dt - 0.16) / 0.18, 0, 1), sc: 1 - 0.35 * u, dark: u, pocket: sim.potPk[i] });
        continue;
      }
      out.push({ id: sim.ids[i], x, y, ang, a: 1, sc: 1 });
    }
    return out;
  }

  draw(now) {
    const ctx = this.ctx;
    const L = this.L;
    if (!ctx || !L) return;
    const s = L.s;
    ctx.clearRect(0, 0, L.W, L.H);
    const a = this.anim;
    const items = this.view(a && a.phase === 'roll' ? a.pt : 0);
    const placing = !a && this.o.canShoot;
    if (placing) items.push({ id: 0, x: this.sx, y: baseY(this.o.mark), ang: 0, a: this.strikerOk() ? 1 : 0.55, sc: 1, me: true });
    else if (!a && this.remote && this.remote.sx != null && this.o.peerMark) items.push({ id: 0, x: this.remote.sx, y: baseY(this.o.peerMark), ang: 0, a: 0.9, sc: 1 });
    const sh = shadowSprite();
    items.forEach((b) => {
      if (b.pocket != null) return;
      const r = (b.id === 0 ? SR : CR) * s * b.sc;
      ctx.globalAlpha = 0.42 * b.a;
      ctx.drawImage(sh, this.X(b.x, b.y) - r * 1.05 + r * 0.16, this.Y(b.x, b.y) - r * 1.05 + r * 0.28, r * 2.1, r * 2.1);
    });
    ctx.globalAlpha = 1;
    items.forEach((b) => {
      const r = (b.id === 0 ? SR : CR) * s;
      const sp = coinSprite(b.id === 0 ? 'striker' : b.id === QUEEN ? 'q' : isWhite(b.id) ? 'w' : 'k', r * this.d);
      const sw = (sp.S / this.d) * b.sc;
      const cx = this.X(b.x, b.y); const cy = this.Y(b.x, b.y);
      if (b.pocket != null) {
        const pk = POCK[b.pocket];
        ctx.save();
        ctx.beginPath(); ctx.arc(this.X(pk[0], pk[1]), this.Y(pk[0], pk[1]), PR * s * 0.98, 0, Math.PI * 2); ctx.clip();
      }
      ctx.globalAlpha = b.a;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(b.ang + (this.o.flip ? Math.PI : 0));
      ctx.drawImage(sp.cv, -sw / 2, -sw / 2, sw, sw);
      ctx.restore();
      if (b.pocket != null) {
        ctx.globalAlpha = 0.8 * b.dark;
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(cx, cy, r * b.sc + 0.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      if (b.me && !this.strikerOk()) {
        ctx.strokeStyle = 'rgba(220,40,50,0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, r + 3, 0, Math.PI * 2); ctx.stroke();
      }
    });
    if (placing && this.aim) this.drawAim(ctx, this.sx, baseY(this.o.mark), this.aim, true, now);
    else if (!a && this.remote && this.remote.ux != null && this.o.peerMark) this.drawAim(ctx, this.remote.sx, baseY(this.o.peerMark), { ux: this.remote.ux, uy: this.remote.uy, p: this.remote.p || 0, ok: true }, false, now);
    if (placing && !this.aim) {
      const cx = this.X(this.sx, baseY(this.o.mark)); const cy = this.Y(this.sx, baseY(this.o.mark));
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.arc(cx, cy, SR * s + 6, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  drawAim(ctx, sx, sy, aim, mine, now) {
    const s = this.L.s;
    const { ux, uy, p, ok } = aim;
    const cx = this.X(sx, sy); const cy = this.Y(sx, sy);
    const col = ok ? '255,255,255' : '255,90,90';
    let hit = null;
    for (const [id, x, y] of this.coins) {
      const ex = x - sx; const ey = y - sy;
      const along = ex * ux + ey * uy;
      if (along <= 0) continue;
      const perp2 = ex * ex + ey * ey - along * along;
      const rr = (CR + SR) * (CR + SR);
      if (perp2 > rr) continue;
      const t = along - Math.sqrt(rr - perp2);
      if (!hit || t < hit.t) hit = { t, id, x, y };
    }
    let wall = Infinity;
    if (ux > 0) wall = Math.min(wall, (BW - SR - sx) / ux); if (ux < 0) wall = Math.min(wall, (SR - sx) / ux);
    if (uy > 0) wall = Math.min(wall, (BW - SR - sy) / uy); if (uy < 0) wall = Math.min(wall, (SR - sy) / uy);
    const reach = hit && hit.t < wall ? hit.t : wall;
    const gx = sx + ux * reach; const gy = sy + uy * reach;
    ctx.save();
    ctx.strokeStyle = `rgba(${col},${mine ? 0.85 : 0.35})`;
    ctx.lineWidth = 1.4;
    ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(this.X(sx + ux * SR, sy + uy * SR), this.Y(sx + ux * SR, sy + uy * SR)); ctx.lineTo(this.X(gx, gy), this.Y(gx, gy)); ctx.stroke();
    ctx.setLineDash([]);
    if (hit && hit.t < wall && mine) {
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath(); ctx.arc(this.X(gx, gy), this.Y(gx, gy), SR * s, 0, Math.PI * 2); ctx.stroke();
      const nx = (hit.x - gx) / (CR + SR); const ny = (hit.y - gy) / (CR + SR);
      const full = clamp(ux * nx + uy * ny, 0, 1);
      const ol = 40 + 200 * full;
      ctx.strokeStyle = 'rgba(255,240,200,0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(this.X(hit.x + nx * CR, hit.y + ny * CR), this.Y(hit.x + nx * CR, hit.y + ny * CR)); ctx.lineTo(this.X(hit.x + nx * (CR + ol), hit.y + ny * (CR + ol)), this.Y(hit.x + nx * (CR + ol), hit.y + ny * (CR + ol))); ctx.stroke();
    }
    if (p > 0) {
      const rr = SR * s + 6 + p * 44;
      const g = ctx.createRadialGradient(cx, cy, SR * s, cx, cy, rr);
      g.addColorStop(0, `rgba(${p > 0.75 ? '255,110,80' : '255,214,120'},0.0)`);
      g.addColorStop(0.75, `rgba(${p > 0.75 ? '255,110,80' : '255,214,120'},0.04)`);
      g.addColorStop(1, `rgba(${p > 0.75 ? '255,110,80' : '255,214,120'},${0.12 + 0.12 * p})`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = `rgba(255,236,190,${0.5 + 0.4 * p})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.stroke();
      const al = (SR + 30 + p * 150) * s;
      const sxp = this.o.flip ? -1 : 1;
      const ax = cx + ux * sxp * al; const ay = cy + uy * sxp * al;
      ctx.strokeStyle = `rgba(${col},0.95)`;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx + ux * sxp * (SR * s + 4), cy + uy * sxp * (SR * s + 4)); ctx.lineTo(ax, ay); ctx.stroke();
      const hx = -uy * sxp; const hy = ux * sxp;
      ctx.beginPath(); ctx.moveTo(ax + ux * sxp * 7, ay + uy * sxp * 7); ctx.lineTo(ax + hx * 6, ay + hy * 6); ctx.lineTo(ax - hx * 6, ay - hy * 6); ctx.closePath();
      ctx.fillStyle = `rgba(${col},0.95)`;
      ctx.fill();
    }
    ctx.restore();
  }

  stats() { return this.perf.report(); }

  destroy() {
    this.dead = true;
    cancelAnimationFrame(this.raf);
    this.hum.stop();
    if (this.ro) this.ro.disconnect();
    this.fg.removeEventListener('pointerdown', this.down);
    this.fg.removeEventListener('pointermove', this.move);
    this.fg.removeEventListener('pointerup', this.up);
    this.fg.removeEventListener('pointercancel', this.up);
    this.bg.remove();
    this.fg.remove();
  }
}

const SCENE = new Map();
export function CarromScene() {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv) return undefined;
    const paint = () => {
      if (!cv.isConnected || !cv.parentElement) return;
      const r = { width: cv.parentElement.clientWidth, height: cv.parentElement.clientHeight };
      const W = Math.max(100, Math.round(r.width)); const H = Math.max(100, Math.round(r.height));
      const { ctx, d } = fitCanvas(cv, W, H, 2);
      const key = `${W}x${H}`;
      let art = SCENE.get(key);
      if (!art) {
        art = makeCanvas(W * d, H * d);
        const g = art.getContext('2d');
        g.scale(d, d);
        g.fillStyle = '#6B4A2B';
        g.fillRect(0, 0, W, H);
        const rnd = rng('jute');
        const cell = 7;
        for (let y = 0; y < H + cell; y += cell) {
          for (let x = 0; x < W + cell; x += cell) {
            const odd = ((x / cell) + (y / cell)) % 2 === 0;
            const base = odd ? '#8A6438' : '#75532F';
            g.fillStyle = mix(base, rnd() < 0.5 ? '#5A3C20' : '#9C7646', rnd() * 0.35);
            if (odd) rrect(g, x + 0.5, y + 1.2, cell - 1, cell - 2.4, 2); else rrect(g, x + 1.2, y + 0.5, cell - 2.4, cell - 1, 2);
            g.fill();
          }
        }
        g.strokeStyle = 'rgba(40,24,10,0.35)';
        g.lineWidth = 1;
        for (let y = 0; y < H; y += cell) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
        const lg = g.createRadialGradient(W / 2, H * 0.5, Math.min(W, H) * 0.15, W / 2, H * 0.5, Math.max(W, H) * 0.72);
        lg.addColorStop(0, 'rgba(255,214,150,0.18)');
        lg.addColorStop(0.5, 'rgba(0,0,0,0.12)');
        lg.addColorStop(1, 'rgba(10,5,0,0.78)');
        g.fillStyle = lg;
        g.fillRect(0, 0, W, H);
        SCENE.set(key, art);
      }
      ctx.drawImage(art, 0, 0, W, H);
    };
    paint();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(paint) : null;
    if (ro) ro.observe(cv.parentElement);
    return () => { if (ro) ro.disconnect(); };
  }, []);
  return <canvas ref={ref} aria-hidden="true" style={{ position: 'absolute', inset: 0, display: 'block' }} />;
}

function CoinIcon({ kind, size = 13, faded }) {
  const p = coinPalette(kind === 'q' ? QUEEN : kind === 'w' ? 1 : 10);
  return <span aria-hidden="true" style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, opacity: faded ? 0.25 : 1, background: `radial-gradient(circle at 35% 30%, ${tint(p.base, 0.3)}, ${p.base} 60%, ${p.dark})`, boxShadow: `inset 0 0 0 ${Math.max(1, size * 0.14)}px ${rgba(p.dark, 0.5)}, 0 1px 2px rgba(0,0,0,0.5)` }} />;
}

function Seat({ id, label, hot, colour, left, queen, here, end }) {
  const n = (g1Mem.names && g1Mem.names[id]) || {};
  const got = 9 - left;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexDirection: end ? 'row-reverse' : 'row', minWidth: 0, flex: 1 }}>
      <div style={{ position: 'relative', borderRadius: '50%', padding: 2, background: hot ? 'linear-gradient(140deg, #F6D27A, #C9952F)' : 'rgba(255,255,255,0.14)', flexShrink: 0, transition: 'background 220ms ease' }}>
        <Avatar emoji={n.avatar} name={n.name || label} size={34} />
        {here && <span style={{ position: 'absolute', right: 0, bottom: 0, width: 10, height: 10, borderRadius: 5, background: '#3DDC84', boxShadow: '0 0 0 2px #2A1A0E' }} />}
      </div>
      <div style={{ minWidth: 0, textAlign: end ? 'right' : 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: end ? 'flex-end' : 'flex-start' }}>
          <CoinIcon kind={colour} size={13} />
          <span style={{ fontSize: 13.5, fontWeight: 800, color: '#FFF6EA', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
          {queen && <CoinIcon kind="q" size={12} />}
        </div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(255,240,220,0.66)', marginTop: 3 }}>{got} of 9 in</div>
      </div>
    </div>
  );
}

function StrikerRail({ value, disabled, onChange }) {
  const ref = useRef(null);
  const drag = useRef(false);
  const pos = (e) => {
    const r = ref.current.getBoundingClientRect();
    const k = clamp((e.clientX - r.left - 22) / (r.width - 44), 0, 1);
    onChange(C - BASE_HALF + k * BASE_HALF * 2);
  };
  const k = (value - (C - BASE_HALF)) / (BASE_HALF * 2);
  return (
    <div ref={ref} role="slider" aria-label="Move the striker along your line" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(k * 100)}
      onPointerDown={(e) => { if (disabled) return; try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} drag.current = true; pos(e); }}
      onPointerMove={(e) => { if (drag.current) pos(e); }} onPointerUp={() => { drag.current = false; }} onPointerCancel={() => { drag.current = false; }}
      style={{ position: 'relative', height: 44, flex: 1, touchAction: 'none', cursor: disabled ? 'default' : 'ew-resize', opacity: disabled ? 0.4 : 1, transition: 'opacity 200ms ease' }}>
      <div style={{ position: 'absolute', left: 14, right: 14, top: 16, height: 12, borderRadius: 6, background: 'linear-gradient(180deg, #1A0F08, #3A2414)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,214,170,0.18)' }}>
        {[0.25, 0.5, 0.75].map((t) => <div key={t} style={{ position: 'absolute', left: `${t * 100}%`, top: 3, width: 1, height: 6, background: 'rgba(255,220,180,0.3)' }} />)}
      </div>
      <div style={{ position: 'absolute', top: 2, left: `calc(${k * 100}% - ${k * 44}px)`, width: 40, height: 40, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #FFFFFF, #F1ECE2 55%, #BDB5A6)', boxShadow: '0 3px 8px rgba(0,0,0,0.5), inset 0 0 0 3px rgba(60,111,184,0.75), inset 0 0 0 7px rgba(255,255,255,0.9), inset 0 0 0 9px rgba(210,59,74,0.6)', transition: drag.current ? 'none' : 'left 120ms ease-out' }} />
    </div>
  );
}

function Tray({ colour, count, queen, label, flipText }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 34, padding: '0 12px', borderRadius: 17, background: 'linear-gradient(180deg, #2A170B, #3B2414)', boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,214,170,0.14)', fontFamily: FONT, maxWidth: '100%' }}>
      {label ? <span style={{ fontSize: 11.5, fontWeight: 800, color: 'rgba(255,236,210,0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 90 }}>{label}</span> : null}
      <div style={{ display: 'flex', gap: 3 }}>
        {Array.from({ length: 9 }).map((_, i) => <CoinIcon key={i} kind={colour} size={14} faded={i >= count} />)}
        <span style={{ width: 4 }} />
        <CoinIcon kind="q" size={14} faded={!queen} />
      </div>
      {flipText ? null : null}
    </div>
  );
}

function useBox(ref) {
  const [box, setBox] = useState(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const f = () => { setBox({ w: el.clientWidth, h: el.clientHeight }); };
    f();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(f) : null;
    if (ro) ro.observe(el);
    return () => { if (ro) ro.disconnect(); };
  }, []);
  return box;
}

const resultSeen = new Set();
function useResultSound(live, done, key, outcome) {
  useEffect(() => {
    if (!live || !done || resultSeen.has(key)) return;
    resultSeen.add(key);
    sfx(outcome === 'win' ? 'win' : 'lose');
  }, [done, key]);
}

function shownState(state, live) {
  const p = live && state ? g1Mem.pending.get(state.id) : null;
  return p && p !== true && (p.n || 0) > (state.n || 0) ? p : state;
}

export function CarromCard({ state, myId, live, peerName }) {
  const { theme } = useTheme();
  const st = shownState(state, live);
  const other = myId === st.x ? st.o : st.x;
  const peer = peerName || g1First(other, 'They');
  const out = g1Outcome(st, myId);
  useResultSound(live, !!st.w, `${st.id}:${st.n}`, out);
  const myMark = myId === st.x ? 'x' : 'o';
  const myC = colorOfMark(st, myMark);
  const thC = myC === 'w' ? 'k' : 'w';
  const left = (c) => st.b.filter(([id]) => (c === 'w' ? isWhite(id) : isBlack(id))).length;
  const status = st.w ? (st.why === 'resign' ? (out === 'win' ? `${peer} gave up` : 'You gave up') : out === 'win' ? `You won, ${st.pts || 0} points` : `${peer} won`) : live ? ((st.n || 0) === 0 ? (st.t === myId ? 'Your break' : 'Their break') : st.t === myId ? 'Your shot' : 'Their shot') : `Shot ${st.n || 0}`;
  return (
    <GameCardShell k="crm" width={240} live={live} title="Carrom" status={status} hot={live && !st.w && st.t === myId}>
      <div role="button" aria-label="Open the board" onClick={() => g1Mem.host && g1Mem.host.open(st.id)} style={{ cursor: 'pointer', borderRadius: 12, overflow: 'hidden', width: 220, height: 220, background: '#3A1E10' }}>
        <CarromPreview w={220} h={220} coins={st.b} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}><CoinIcon kind={myC} /><span style={{ fontSize: 12, fontWeight: 700, color: theme.muted }}>You, {9 - left(myC)} in</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}><span style={{ fontSize: 12, fontWeight: 700, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 110 }}>{peer}, {9 - left(thC)} in</span><CoinIcon kind={thC} /></div>
      </div>
      {live && !st.w && <GameButton full small color={st.t === myId ? 'green' : 'white'} label={st.t === myId ? ((st.n || 0) === 0 ? 'Break' : 'Take your shot') : 'Watch the board'} onClick={() => { sfx('tap'); if (g1Mem.host) g1Mem.host.open(st.id); }} style={{ marginTop: 10 }} />}
      {live && st.w && <GameAgainButton onClick={() => g1Mem.host && g1Mem.host.rematch(st)} />}
    </GameCardShell>
  );
}

const SEEN_KEY = 'zchat-gb-crm-seen';
function seenShot(key, mark) {
  let list = [];
  try { list = JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'); } catch {}
  if (!Array.isArray(list)) list = [];
  const has = list.includes(key);
  if (mark && !has) { list.push(key); try { localStorage.setItem(SEEN_KEY, JSON.stringify(list.slice(-60))); } catch {} }
  return has;
}

function RoomButton({ label, onClick, children, gold, wide }) {
  return (
    <button type="button" aria-label={label} onClick={onClick}
      style={{ height: 40, minWidth: wide ? 120 : 40, padding: wide ? '0 18px' : 0, borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: FONT, fontWeight: 900, fontSize: 14.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: gold ? '#2A1A08' : '#FFF4E4', background: gold ? 'linear-gradient(180deg, #F0CF7A, #C9952F)' : 'rgba(255,236,210,0.14)', boxShadow: gold ? '0 3px 0 #7A5410, 0 6px 14px rgba(0,0,0,0.4)' : 'inset 0 0 0 1px rgba(255,236,210,0.14)', flexShrink: 0 }}>
      {children || label}
    </button>
  );
}

function useCarromPlay({ st, prevOf, myId, peer, relay, save, onBusy, onFlash }) {
  const hostRef = useRef(null);
  const board = useRef(null);
  const busy = useRef(false);
  const shown = useRef(null);
  const stRef = useRef(st);
  stRef.current = st;
  const outbox = useRef(null);
  const liveShot = useRef(null);
  const [sx, setSx] = useState(C);
  const [flash, setFlash] = useState(null);
  const [, setTick] = useState(0);
  const saveRef = useRef(save);
  saveRef.current = save;
  const busyRef = useRef(onBusy);
  busyRef.current = onBusy;
  const flashRef = useRef(onFlash);
  flashRef.current = onFlash;
  const setBusy = (v) => { busy.current = v; if (busyRef.current) busyRef.current(v); };
  const other = st.x === myId ? st.o : st.x;
  const myMark = st.x === myId ? 'x' : 'o';
  const peerMark = myMark === 'x' ? 'o' : 'x';
  const opts = (s0) => { const s = s0 || stRef.current; return { canShoot: !s.w && s.t === myId && !busy.current }; };
  const flush = () => { const o = outbox.current; if (!o || o.sent) return; o.sent = true; clearTimeout(o.timer); if (saveRef.current) saveRef.current(o.next); };
  const say = (t) => {
    if (flashRef.current) { flashRef.current(t); return; }
    setFlash({ t, at: Date.now() });
    setTimeout(() => setFlash((f) => (f && Date.now() - f.at > 1900 ? null : f)), 2200);
  };
  const flashFor = (next, mine) => {
    if (!next || !next.ev) return;
    const who = mine ? 'You' : peer;
    const ev = next.ev;
    if (next.w) { if (flashRef.current) return; say(g1Outcome(next, myId) === 'win' ? `You won, ${next.pts || 0} points` : `${peer} won the board`); sfx(g1Outcome(next, myId) === 'win' ? 'win' : 'lose'); return; }
    if (ev.fl === 'striker') { say(`${who} potted the striker. One coin goes back`); sfx('lose'); return; }
    if (ev.fl === 'last') { say('The queen has to go first. Coin back to the centre'); return; }
    if (ev.fl === 'opplast') { say('That was their last coin. It goes back'); return; }
    if (ev.cov) { say(`${who} covered the queen`); sfx('win'); return; }
    if (next.qp && (ev.pt || []).includes(QUEEN)) { say(`${who} potted the queen. Cover it next`); return; }
    if ((ev.ret || []).includes(QUEEN)) { say('The queen goes back to the centre'); return; }
    if (next.t === (mine ? myId : other) && (ev.pt || []).length) say(mine ? 'Good shot, go again' : `${peer} goes again`);
  };
  const replay = (from, ls, mark, after) => {
    const b = board.current;
    setBusy(true);
    b.setRemote(null);
    b.set({ canShoot: false });
    b.play(from, ls, mark, { onDone: () => { setBusy(false); after(); } });
  };
  const live = useShotLink(`zcrm-${st.id}`, myId, relay, (p) => {
    const b = board.current;
    if (!b || busy.current) return;
    const s = stRef.current;
    if (s.t !== p.by || s.w) return;
    if (p.k === 'aim') b.setRemote(p);
    if (p.k === 'shot' && p.n === (s.n || 0) && p.ls && shown.current === s.n && !b.busy()) {
      liveShot.current = { n: p.n, done: false };
      seenShot(`${s.id}:${p.n + 1}`, true);
      replay(s.b, p.ls, s.x === p.by ? 'x' : 'o', () => {
        const cur = stRef.current;
        liveShot.current = { n: p.n, done: true };
        if ((cur.n || 0) > p.n) { shown.current = cur.n; b.set({ coins: cur.b, ...opts() }); flashFor(cur, false); } else b.set(opts());
        setTick((x) => x + 1);
      });
      setTick((x) => x + 1);
    }
  });
  const liveRef = useRef(live);
  liveRef.current = live;
  const sendAim = useRef(null);
  if (!sendAim.current) sendAim.current = throttle((p) => liveRef.current.send(p), 70);
  const fire = () => {
    const b = board.current;
    const s = stRef.current;
    if (!b || busy.current || s.w || s.t !== myId || shown.current !== s.n) return false;
    const shot = b.makeShot();
    if (!shot) { appSnack(b.strikerOk() ? 'Pull back from the striker to aim' : 'Move the striker off the coin first'); return false; }
    setBusy(true);
    b.set({ canShoot: false });
    liveRef.current.send({ k: 'shot', n: s.n || 0, ls: shot });
    let next = null;
    b.play(s.b, shot, myMark, {
      onResult: (res, sim) => { next = judge(s, shot, res, myId); outbox.current = { next, sent: false, timer: setTimeout(flush, Math.round((sim.duration + 1) * 1000)) }; },
      onDone: () => { flush(); setBusy(false); b.set({ coins: (next || stRef.current).b, ...opts(next) }); setTick((x) => x + 1); flashFor(next, true); },
    });
    setTick((x) => x + 1);
    return true;
  };
  const fireRef = useRef(fire);
  fireRef.current = fire;
  useEffect(() => {
    if (!hostRef.current) return undefined;
    const b = new CarromBoard(hostRef.current, { coins: st.b, mark: myMark, peerMark, flip: myMark === 'o', ...opts(), onShoot: () => fireRef.current(), onAim: () => { setSx(b.sx); sendAim.current({ k: 'aim', ...b.aimState() }); } });
    board.current = b;
    shown.current = st.n;
    setSx(b.sx);
    if (st.lb && st.lb !== myId && st.ls && !seenShot(`${st.id}:${st.n}`, false)) {
      const prev = prevOf((st.n || 0) - 1);
      if (prev && Array.isArray(prev.b)) {
        setTimeout(() => {
          if (board.current !== b || b.busy() || shown.current !== st.n || seenShot(`${st.id}:${st.n}`, true)) return;
          replay(prev.b, st.ls, peerMark, () => { const cur = stRef.current; b.set({ coins: cur.b, ...opts() }); setTick((x) => x + 1); flashFor(cur, false); });
          setTick((x) => x + 1);
        }, 420);
      }
    }
    if (g1Test()) window.__gbcrm = { fire: (shot) => { const bb = board.current; bb.sx = shot.sx; const l = Math.hypot(shot.dx, shot.dy); bb.aim = { ux: shot.dx / l, uy: shot.dy / l, p: shot.p / 1000, ok: true }; return fireRef.current(); }, find: () => findShot(stRef.current, myId), busy: () => busy.current || b.busy(), stats: () => b.stats(), resetStats: () => b.perf.reset(), state: () => stRef.current, board: b };
    return () => { flush(); b.destroy(); board.current = null; if (window.__gbcrm && window.__gbcrm.board === b) delete window.__gbcrm; };
  }, []);
  useEffect(() => {
    const b = board.current;
    if (!b) return;
    if (shown.current === st.n) { if (!busy.current) b.set(opts()); return; }
    shown.current = st.n;
    if (st.lb === myId) { if (!busy.current && !b.busy()) b.set(opts()); return; }
    const l0 = liveShot.current;
    if (l0 && l0.n === (st.n || 0) - 1) {
      if (l0.done && !b.busy()) { b.set({ coins: st.b, ...opts() }); flashFor(st, false); }
      setTick((x) => x + 1);
      return;
    }
    const prev = prevOf((st.n || 0) - 1);
    if (prev && st.ls && !b.busy()) {
      seenShot(`${st.id}:${st.n}`, true);
      replay(prev.b, st.ls, st.lb === st.x ? 'x' : 'o', () => { const cur = stRef.current; b.set({ coins: cur.b, ...opts() }); setTick((x) => x + 1); flashFor(cur, false); });
    } else if (!b.busy()) b.set({ coins: st.b, ...opts() });
    setTick((x) => x + 1);
  }, [st.n]);
  const myTurn = !st.w && st.t === myId && !busy.current;
  const left = (c) => st.b.filter(([id]) => (c === 'w' ? isWhite(id) : isBlack(id))).length;
  const setStriker = (v) => { const b = board.current; if (b) { b.setStriker(myMark === 'o' ? C * 2 - v : v); setSx(b.sx); } };
  return { hostRef, board, busy, sx, setStriker, flash, live, myTurn, myMark, peerMark, other, left };
}

function CarromArea({ P, st, peer, myC, thC, labels }) {
  const areaRef = useRef(null);
  const area = useBox(areaRef);
  const side = area ? Math.max(200, Math.min(area.w - 8, area.h - 112)) : 0;
  const { myMark, peerMark, left, flash } = P;
  return (
    <div ref={areaRef} style={{ position: 'relative', width: '100%', height: '100%', alignSelf: 'stretch', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      {side > 0 && <Tray colour={thC} count={9 - left(thC)} queen={st.qc === peerMark} label={labels ? peer : null} />}
      <div style={{ position: 'relative', width: side, height: side, flexShrink: 0 }}>
        <div ref={P.hostRef} style={{ position: 'absolute', inset: 0 }} />
        {flash && <div key={flash.at} style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', padding: '10px 18px', borderRadius: 16, background: 'rgba(24,12,4,0.84)', color: '#FFF4E4', fontWeight: 800, fontSize: 14.5, fontFamily: FONT, boxShadow: '0 10px 30px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,220,170,0.16)', pointerEvents: 'none', maxWidth: '86%', textAlign: 'center', animation: 'zgbFlash 2.2s ease forwards' }}>{flash.t}</div>}
      </div>
      {side > 0 && <Tray colour={myC} count={9 - left(myC)} queen={st.qc === myMark} label={labels ? 'You' : null} />}
      {side > 0 && !st.w && <div style={{ width: Math.min(side, 380), display: 'flex' }}><StrikerRail value={myMark === 'o' ? C * 2 - P.sx : P.sx} disabled={!P.myTurn} onChange={P.setStriker} /></div>}
      <style>{'@keyframes zgbFlash{0%{opacity:0;transform:translate(-50%,-40%) scale(0.96)}10%{opacity:1;transform:translate(-50%,-50%) scale(1)}80%{opacity:1}100%{opacity:0}}'}</style>
    </div>
  );
}

export function CarromPage({ st, prevOf, myId, peerName, onClose }) {
  useGameKit();
  useBackClose(true, onClose);
  const [ask, setAsk] = useState(false);
  useBackClose(ask, () => setAsk(false));
  const other = st.x === myId ? st.o : st.x;
  const peer = peerName || g1First(other, 'Them');
  const P = useCarromPlay({ st, prevOf, myId, peer, relay: null, save: g1Send });
  const { myMark, peerMark, myTurn, live, left } = P;
  const myC = colorOfMark(st, myMark);
  const thC = myC === 'w' ? 'k' : 'w';
  const out = g1Outcome(st, myId);
  const note = P.busy.current ? '' : st.w ? (st.why === 'resign' ? (out === 'win' ? `${peer} gave up. You won` : 'You gave up') : out === 'win' ? `You won the board, ${st.pts || 0} points` : `${peer} won the board`) : myTurn ? (st.qp === myMark ? 'Cover the queen. Pot one of your coins now' : (st.n || 0) === 0 ? 'Your break. Slide the striker, then pull back and let go' : 'Your shot. Slide the striker, then pull back and let go') : (live.here ? `${peer} is at the board` : `${peer} is up next`);
  return (
    <GameRoom k="crm" title="Carrom" scene={<CarromScene />} onClose={onClose}
      top={(
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 10px 6px', padding: '8px 12px', borderRadius: 20, background: 'linear-gradient(180deg, rgba(30,16,6,0.84), rgba(30,16,6,0.66))', boxShadow: 'inset 0 0 0 1px rgba(255,220,170,0.12), 0 6px 18px rgba(0,0,0,0.35)', fontFamily: FONT }}>
          <Seat id={myId} label="You" hot={!st.w && st.t === myId} colour={myC} left={left(myC)} queen={st.qc === myMark} />
          <div style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,236,210,0.55)', letterSpacing: '0.08em', flexShrink: 0 }}>VS</div>
          <Seat id={other} label={peer} hot={!st.w && st.t === other} colour={thC} left={left(thC)} queen={st.qc === peerMark} here={live.here} end />
        </div>
      )}
      bottom={(
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 12, padding: '0 2px', fontFamily: FONT }}>
          <div style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 700, color: 'rgba(255,240,222,0.86)', textAlign: 'center', textWrap: 'balance' }}>{note}</div>
          {st.w ? <RoomButton label="Rematch" gold wide onClick={() => { onClose(); if (g1Mem.host) g1Mem.host.rematch(st); }} /> : <RoomButton label="Give up" onClick={() => setAsk(true)}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 21V4" /><path d="M5 4h11l-2 4 2 4H5" /></svg></RoomButton>}
        </div>
      )}>
      <CarromArea P={P} st={st} peer={peer} myC={myC} thC={thC} labels />
      <RoomLayer>
        {ask && <ConfirmSheet zIndex={60} title="Give up this game" text={`${peer} wins if you give up.`} confirmLabel="Give up" onCancel={() => setAsk(false)} onConfirm={() => { setAsk(false); g1Send({ ...st, n: (st.n || 0) + 1, w: peerMark, why: 'resign', ls: null, ev: null, lb: myId }); }} />}
      </RoomLayer>
    </GameRoom>
  );
}

function CoinLine({ colour, got, queen, end }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, flexDirection: end ? 'row-reverse' : 'row' }}>
      <CoinIcon kind={colour} size={12} />
      <span>{`${got} of 9 in`}</span>
      {queen && <CoinIcon kind="q" size={11} />}
    </span>
  );
}

export function CarromTable({ st, prevOf, myId, peerName, relay, onMove, onMeta, onBusy, onFlash }) {
  const P = useCarromPlay({ st, prevOf, myId, peer: peerName, relay, save: onMove, onBusy, onFlash });
  const { myMark, peerMark, myTurn, left } = P;
  const myC = colorOfMark(st, myMark);
  const thC = myC === 'w' ? 'k' : 'w';
  const mineIn = 9 - left(myC);
  const theirsIn = 9 - left(thC);
  const status = P.busy.current || st.w ? '' : myTurn ? (st.qp === myMark ? 'Cover the queen now' : (st.n || 0) === 0 ? 'Your break' : 'Your shot') : `${peerName} is aiming`;
  const hint = myTurn ? 'Slide the striker, then pull back and let go' : '';
  useEffect(() => {
    onMeta({
      status, hot: myTurn, ready: true, center: `${mineIn} : ${theirsIn}`,
      me: <CoinLine colour={myC} got={mineIn} queen={st.qc === myMark} />,
      peer: <CoinLine colour={thC} got={theirsIn} queen={st.qc === peerMark} end />,
      bottom: hint && !st.w ? <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 1.3, maxWidth: 200 }}>{hint}</div> : null,
    });
  }, [status, myTurn, hint, mineIn, theirsIn, myC, st.qc, !!st.w]);
  return <CarromArea P={P} st={st} peer={peerName} myC={myC} thC={thC} labels={false} />;
}
