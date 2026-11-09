import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { GameRoom, RoomLayer, defineSfx, sfx, haptic, useGameKit } from './kit.jsx';
import { clamp, lerp, makeCanvas, fitCanvas, dpr, grain, woodTexture, rrect, rgba, shade, tint, mix, hexRgb, perfMeter, noiseHit, tone, loopNoise, easeOut, rng } from './physics.jsx';
import { PoolSim, TW, TH, R, CW, RW, HEAD_Y, FOOT, POCKETS, MOUTH, ballColor, kindOf, canPlace, judge, aimRay, findPot, groupOf, CUE_START } from './poolsim.jsx';
import { useShotLink, throttle } from './live.jsx';
import { useBackClose, Avatar, appSnack, g1Send, g1Mem, g1First, g1PoolLeft, g1Outcome, g1Test, ConfirmSheet, FONT } from '../App.jsx';

const FRAME = CW + RW;
const CLOTH = '#1D7350';
const RAIL = ['#5A3420', '#2B160B', '#86563A'];
const LAMPS = [[TW / 2, TH * 0.2], [TW / 2, TH * 0.5], [TW / 2, TH * 0.8]];
const LAMP_H = 1150;
const FPS_REC = 120;
const LABEL_FONT = "800 12px -apple-system, BlinkMacSystemFont, 'SF Pro Rounded', 'Segoe UI', Roboto, sans-serif";

defineSfx('poolCue', (c, out, o) => {
  const v = clamp(o.v == null ? 0.5 : o.v, 0.05, 1);
  noiseHit(c, out, { freq: 1500 + v * 700, q: 1.6, gain: 0.22 + v * 0.38, decay: 0.035 + v * 0.02 });
  tone(c, out, { freq: 520 + v * 160, to: 300, gain: 0.08 + v * 0.12, decay: 0.05 });
});
defineSfx('poolClack', (c, out, o) => {
  const v = clamp(o.v == null ? 0.5 : o.v, 0.02, 1);
  const f = 3300 + Math.random() * 900;
  noiseHit(c, out, { freq: f, q: 3.2, gain: 0.12 + v * 0.62, decay: 0.018 + v * 0.03, pan: o.pan });
  tone(c, out, { freq: f * 0.92, gain: 0.03 + v * 0.14, decay: 0.03 + v * 0.05, pan: o.pan });
  if (v > 0.35) noiseHit(c, out, { freq: 900, q: 1, type: 'lowpass', gain: v * 0.16, decay: 0.03, pan: o.pan });
});
defineSfx('poolCushion', (c, out, o) => {
  const v = clamp(o.v == null ? 0.5 : o.v, 0.02, 1);
  tone(c, out, { freq: 150, to: 82, gain: 0.08 + v * 0.3, decay: 0.09 + v * 0.05, pan: o.pan });
  noiseHit(c, out, { freq: 520, q: 0.8, type: 'lowpass', gain: 0.05 + v * 0.2, decay: 0.06, pan: o.pan });
});
defineSfx('poolPocket', (c, out, o) => {
  const v = clamp(o.v == null ? 0.5 : o.v, 0.15, 1);
  const t = c.currentTime;
  tone(c, out, { t0: t, freq: 190, to: 95, gain: 0.18 + v * 0.2, decay: 0.12, pan: o.pan });
  noiseHit(c, out, { t0: t, freq: 700, q: 0.9, type: 'lowpass', gain: 0.18 + v * 0.16, decay: 0.08, pan: o.pan });
  [0.11, 0.19, 0.26, 0.34, 0.45].forEach((d, i) => noiseHit(c, out, { t0: t + d + Math.random() * 0.02, freq: 1400 + Math.random() * 900, q: 2.5, gain: (0.12 - i * 0.02) * (0.6 + v * 0.5), decay: 0.025, pan: o.pan }));
  noiseHit(c, out, { t0: t + 0.08, freq: 380, q: 0.6, type: 'lowpass', gain: 0.07, decay: 0.42, kind: 'b', pan: o.pan });
});
defineSfx('poolPlace', (c, out) => { noiseHit(c, out, { freq: 1200, q: 1.2, gain: 0.12, decay: 0.03 }); });

function ballRgb(id) {
  return hexRgb(ballColor(id));
}

const GLYPHS = new Map();
function glyph(id) {
  if (GLYPHS.has(id)) return GLYPHS.get(id);
  const S = 44;
  const cv = makeCanvas(S, S);
  const g = cv.getContext('2d');
  g.fillStyle = '#000';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `900 ${id >= 10 ? 25 : 30}px -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif`;
  if (id >= 10) { g.save(); g.translate(S / 2, S / 2 + 1); g.scale(0.86, 1); g.fillText(String(id), 0, 0); g.restore(); } else g.fillText(String(id), S / 2, S / 2 + 1.5);
  if (id === 6 || id === 9) g.fillRect(S / 2 - 7, S / 2 + 13, 14, 2.6);
  const d = g.getImageData(0, 0, S, S).data;
  const a = new Uint8Array(S * S);
  for (let i = 0; i < S * S; i++) a[i] = d[i * 4 + 3];
  const out = { S, a };
  GLYPHS.set(id, out);
  return out;
}

const SPHERES = new Map();
function sphere(rp) {
  const key = Math.round(rp * 4) / 4;
  if (SPHERES.has(key)) return SPHERES.get(key);
  const S = Math.ceil(key * 2) + 2;
  const c = S / 2;
  const L = [-0.22, -0.3, -0.93];
  const ll = Math.hypot(L[0], L[1], L[2]);
  const lx = L[0] / ll; const ly = L[1] / ll; const lz = L[2] / ll;
  const pix = []; const nx = []; const ny = []; const nz = []; const cov = []; const sh = []; const bo = [];
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const px = (x + 0.5 - c) / key; const py = (y + 0.5 - c) / key;
      const dd = Math.sqrt(px * px + py * py) * key;
      const cv = clamp(key - dd + 0.5, 0, 1);
      if (cv <= 0) continue;
      let ax = px; let ay = py;
      let d2 = ax * ax + ay * ay;
      if (d2 > 0.999) { const k = Math.sqrt(0.999 / d2); ax *= k; ay *= k; d2 = 0.999; }
      const az = -Math.sqrt(1 - d2);
      const dif = Math.max(0, ax * lx + ay * ly + az * lz);
      const rim = 0.62 + 0.38 * -az;
      pix.push(y * S + x); nx.push(ax); ny.push(ay); nz.push(az); cov.push(cv);
      sh.push((0.3 + 0.82 * dif) * rim);
      bo.push(Math.max(0, ax * 0.3 + ay * 0.55 + az * -0.2) * 0.22);
    }
  }
  const out = { S, n: pix.length, pix: Int32Array.from(pix), nx: Float32Array.from(nx), ny: Float32Array.from(ny), nz: Float32Array.from(nz), cov: Float32Array.from(cov), sh: Float32Array.from(sh), bo: Float32Array.from(bo) };
  SPHERES.set(key, out);
  return out;
}

const CLOTH_RGB = hexRgb(CLOTH);
function paintBall(id, q, sp, img) {
  const d = img.data;
  const qw = q[0]; const qx = q[1]; const qy = q[2]; const qz = q[3];
  const m00 = 1 - 2 * (qy * qy + qz * qz); const m01 = 2 * (qx * qy - qz * qw); const m02 = 2 * (qx * qz + qy * qw);
  const m10 = 2 * (qx * qy + qz * qw); const m11 = 1 - 2 * (qx * qx + qz * qz); const m12 = 2 * (qy * qz - qx * qw);
  const m20 = 2 * (qx * qz - qy * qw); const m21 = 2 * (qy * qz + qx * qw); const m22 = 1 - 2 * (qx * qx + qy * qy);
  const [cr, cg, cb] = id === 0 ? [246, 242, 231] : ballRgb(id);
  const stripe = id > 8;
  const cue = id === 0;
  const gl = cue ? null : glyph(id);
  const GS = gl ? gl.S : 0;
  const ga = gl ? gl.a : null;
  const wr = 247; const wg = 243; const wb = 233;
  for (let k = 0; k < sp.n; k++) {
    const nx = sp.nx[k]; const ny = sp.ny[k]; const nz = sp.nz[k];
    const bx = m00 * nx + m10 * ny + m20 * nz;
    const by = m01 * nx + m11 * ny + m21 * nz;
    const bz = m02 * nx + m12 * ny + m22 * nz;
    let r; let g; let b;
    if (cue) {
      r = cr; g = cg; b = cb;
      const ax = bx < 0 ? -bx : bx; const ay = by < 0 ? -by : by; const az = bz < 0 ? -bz : bz;
      const mx = ax > ay ? (ax > az ? ax : az) : (ay > az ? ay : az);
      if (mx > 0.968) { const t = mx > 0.976 ? 1 : (mx - 0.968) / 0.008; r = lerp(r, 196, t); g = lerp(g, 36, t); b = lerp(b, 44, t); }
    } else {
      if (stripe) {
        const az = bz < 0 ? -bz : bz;
        const t = az < 0.5 ? 1 : az > 0.53 ? 0 : (0.53 - az) / 0.03;
        r = lerp(wr, cr, t); g = lerp(wg, cg, t); b = lerp(wb, cb, t);
      } else { r = cr; g = cg; b = cb; }
      const ax = bx < 0 ? -bx : bx;
      if (ax > 0.855) {
        const t = ax > 0.875 ? 1 : (ax - 0.855) / 0.02;
        r = lerp(r, wr, t); g = lerp(g, wg, t); b = lerp(b, wb, t);
        if (ax > 0.88) {
          const u = (bx > 0 ? bz : -bz) / 0.46; const v = by / 0.46;
          const gx = (u * 0.5 + 0.5) * (GS - 1); const gy = (v * 0.5 + 0.5) * (GS - 1);
          if (gx >= 0 && gy >= 0 && gx < GS - 1 && gy < GS - 1) {
            const a = ga[(gy | 0) * GS + (gx | 0)] / 255;
            if (a > 0) { r = lerp(r, 22, a); g = lerp(g, 20, a); b = lerp(b, 26, a); }
          }
        }
      }
    }
    const s = sp.sh[k]; const bo = sp.bo[k];
    const o = sp.pix[k] * 4;
    d[o] = r * s + CLOTH_RGB[0] * bo;
    d[o + 1] = g * s + CLOTH_RGB[1] * bo;
    d[o + 2] = b * s + CLOTH_RGB[2] * bo;
    d[o + 3] = sp.cov[k] * 255;
  }
}

class BallSprites {
  constructor() { this.map = new Map(); }
  get(id, q, rp) {
    const sp = sphere(rp);
    let e = this.map.get(id);
    if (!e || e.S !== sp.S) {
      const cv = makeCanvas(sp.S, sp.S);
      const g = cv.getContext('2d');
      e = { S: sp.S, cv, g, img: g.createImageData(sp.S, sp.S), q: [9, 9, 9, 9] };
      this.map.set(id, e);
    }
    const dq = Math.abs(e.q[0] - q[0]) + Math.abs(e.q[1] - q[1]) + Math.abs(e.q[2] - q[2]) + Math.abs(e.q[3] - q[3]);
    if (dq > 0.004) {
      paintBall(id, q, sp, e.img);
      e.g.putImageData(e.img, 0, 0);
      e.q[0] = q[0]; e.q[1] = q[1]; e.q[2] = q[2]; e.q[3] = q[3];
    }
    return e.cv;
  }
}

let SOFT = null;
function softSprites() {
  if (SOFT) return SOFT;
  const S = 64;
  const sh = makeCanvas(S, S);
  const g = sh.getContext('2d');
  const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  gr.addColorStop(0, 'rgba(0,0,0,1)');
  gr.addColorStop(0.45, 'rgba(0,0,0,0.6)');
  gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, S, S);
  const hi = makeCanvas(S, S);
  const h = hi.getContext('2d');
  const hg = h.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  hg.addColorStop(0, 'rgba(255,255,255,1)');
  hg.addColorStop(0.3, 'rgba(255,255,250,0.75)');
  hg.addColorStop(1, 'rgba(255,255,250,0)');
  h.fillStyle = hg;
  h.fillRect(0, 0, S, S);
  SOFT = { sh, hi };
  return SOFT;
}

export function poolLayout(W, H, pad, side) {
  const p = pad == null ? 6 : pad;
  const sx = side == null ? p : side;
  const tw = TW + 2 * FRAME; const th = TH + 2 * FRAME;
  const s = Math.max(0.01, Math.min((W - 2 * sx) / tw, (H - 2 * p) / th));
  const fx = (W - tw * s) / 2; const fy = (H - th * s) / 2;
  return { W, H, s, fx, fy, ox: fx + FRAME * s, oy: fy + FRAME * s, fw: tw * s, fh: th * s };
}

function railPath(ctx, X, Y, s) {
  const o = -FRAME;
  const rad = 46 * s;
  rrect(ctx, X(o), Y(o), (TW + 2 * FRAME) * s, (TH + 2 * FRAME) * s, rad);
}

const HOLES = [[-14, -14, 58], [TW + 14, -14, 58], [-30, TH / 2, 51], [TW + 30, TH / 2, 51], [-14, TH + 14, 58], [TW + 14, TH + 14, 58]];

function cushionPolys() {
  const { CM, SM } = MOUTH;
  const J = 42;
  return [
    [[CM, 0], [TW - CM, 0], [TW - CM + J, -CW], [CM - J, -CW]],
    [[CM, TH], [TW - CM, TH], [TW - CM + J, TH + CW], [CM - J, TH + CW]],
    [[0, CM], [0, TH / 2 - SM], [-CW, TH / 2 - SM + 12], [-CW, CM - J]],
    [[0, TH / 2 + SM], [0, TH - CM], [-CW, TH - CM + J], [-CW, TH / 2 + SM - 12]],
    [[TW, CM], [TW, TH / 2 - SM], [TW + CW, TH / 2 - SM + 12], [TW + CW, CM - J]],
    [[TW, TH / 2 + SM], [TW, TH - CM], [TW + CW, TH - CM + J], [TW + CW, TH / 2 + SM - 12]],
  ];
}

const ART = new Map();
function tableArt(L) {
  const d = dpr(2.5);
  const key = `${L.W}x${L.H}@${d}`;
  if (ART.has(key)) return ART.get(key);
  const cv = makeCanvas(L.W * d, L.H * d);
  const ctx = cv.getContext('2d');
  ctx.scale(d, d);
  drawTable(ctx, L, d);
  if (ART.size > 4) ART.clear();
  ART.set(key, cv);
  return cv;
}

function drawTable(ctx, L, d) {
  const { s } = L;
  const X = (x) => L.ox + x * s;
  const Y = (y) => L.oy + y * s;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 26;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = '#1A0F08';
  railPath(ctx, X, Y, s);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = shade(CLOTH, 0.1);
  ctx.fillRect(X(-CW - 4), Y(-CW - 4), (TW + 2 * CW + 8) * s, (TH + 2 * CW + 8) * s);

  ctx.save();
  ctx.beginPath();
  ctx.rect(X(-CW), Y(-CW), (TW + 2 * CW) * s, (TH + 2 * CW) * s);
  ctx.clip();
  const bed = ctx.createLinearGradient(X(0), 0, X(TW), 0);
  bed.addColorStop(0, shade(CLOTH, 0.12));
  bed.addColorStop(0.5, CLOTH);
  bed.addColorStop(1, shade(CLOTH, 0.12));
  ctx.fillStyle = bed;
  ctx.fillRect(X(-CW), Y(-CW), (TW + 2 * CW) * s, (TH + 2 * CW) * s);
  LAMPS.forEach(([lx, ly]) => {
    const rr = 1050 * s;
    const g = ctx.createRadialGradient(X(lx), Y(ly), 0, X(lx), Y(ly), rr);
    g.addColorStop(0, 'rgba(255,236,200,0.2)');
    g.addColorStop(0.45, 'rgba(255,236,200,0.08)');
    g.addColorStop(1, 'rgba(255,236,200,0)');
    ctx.fillStyle = g;
    ctx.save();
    ctx.translate(X(lx), Y(ly));
    ctx.scale(1, 0.72);
    ctx.translate(-X(lx), -Y(ly));
    ctx.fillRect(X(lx) - rr, Y(ly) - rr, rr * 2, rr * 2);
    ctx.restore();
  });
  const vg = ctx.createRadialGradient(X(TW / 2), Y(TH / 2), TH * s * 0.25, X(TW / 2), Y(TH / 2), TH * s * 0.62);
  vg.addColorStop(0, 'rgba(2,14,8,0)');
  vg.addColorStop(1, 'rgba(2,14,8,0.42)');
  ctx.fillStyle = vg;
  ctx.fillRect(X(-CW), Y(-CW), (TW + 2 * CW) * s, (TH + 2 * CW) * s);
  const felt = grain(160, 160, 'felt', { amp: 30 });
  const pat = ctx.createPattern(felt, 'repeat');
  if (pat && pat.setTransform && typeof DOMMatrix !== 'undefined') pat.setTransform(new DOMMatrix().scale(1 / d, 1 / d));
  ctx.globalAlpha = 0.16;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = pat || 'transparent';
  ctx.fillRect(X(-CW), Y(-CW), (TW + 2 * CW) * s, (TH + 2 * CW) * s);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.restore();

  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(X(0), Y(HEAD_Y));
  ctx.lineTo(X(TW), Y(HEAD_Y));
  ctx.stroke();
  [[FOOT[0], FOOT[1]], [TW / 2, HEAD_Y], [TW / 2, TH / 2]].forEach(([x, y], i) => {
    ctx.fillStyle = i === 2 ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.42)';
    ctx.beginPath();
    ctx.arc(X(x), Y(y), Math.max(1.2, 5 * s), 0, Math.PI * 2);
    ctx.fill();
  });

  HOLES.forEach(([hx, hy, hr]) => {
    const g = ctx.createRadialGradient(X(hx), Y(hy), hr * s * 0.1, X(hx), Y(hy), hr * s);
    g.addColorStop(0, '#000000');
    g.addColorStop(0.7, '#050407');
    g.addColorStop(1, '#17110F');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(X(hx), Y(hy), hr * s, 0, Math.PI * 2);
    ctx.fill();
  });

  const polys = cushionPolys();
  polys.forEach((poly, k) => {
    ctx.beginPath();
    poly.forEach(([x, y], i) => (i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y))));
    ctx.closePath();
    const [a, b] = poly;
    const horiz = a[1] === b[1];
    const n0 = horiz ? Y(a[1]) : X(a[0]);
    const n1 = horiz ? Y(poly[2][1]) : X(poly[2][0]);
    const g = horiz ? ctx.createLinearGradient(0, n0, 0, n1) : ctx.createLinearGradient(n0, 0, n1, 0);
    g.addColorStop(0, tint(CLOTH, 0.16));
    g.addColorStop(0.18, tint(CLOTH, 0.04));
    g.addColorStop(1, shade(CLOTH, 0.34));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = rgba(tint(CLOTH, 0.45), 0.55);
    ctx.lineWidth = Math.max(0.7, 2.2 * s);
    ctx.beginPath();
    ctx.moveTo(X(a[0]), Y(a[1]));
    ctx.lineTo(X(b[0]), Y(b[1]));
    ctx.stroke();
    ctx.save();
    ctx.beginPath();
    ctx.rect(X(0), Y(0), TW * s, TH * s);
    ctx.clip();
    ctx.strokeStyle = 'rgba(2,16,8,0.35)';
    ctx.lineWidth = Math.max(1, 7 * s);
    ctx.beginPath();
    const off = 3.5 * s;
    const nx = horiz ? 0 : (k === 2 || k === 3 ? off : -off);
    const ny = horiz ? (k === 0 ? off : -off) : 0;
    ctx.moveTo(X(a[0]) + nx, Y(a[1]) + ny);
    ctx.lineTo(X(b[0]) + nx, Y(b[1]) + ny);
    ctx.stroke();
    ctx.restore();
  });

  const wd = Math.min(d, 1.5);
  const rail = makeCanvas(L.fw * d, L.fh * d);
  const rc = rail.getContext('2d');
  rc.scale(d, d);
  rc.translate(-L.fx, -L.fy);
  const wood = woodTexture(Math.ceil(L.fw * wd), Math.ceil(L.fh * wd), 'rail-v', RAIL, { vertical: true, spacing: 3.4 * wd, wave: 3 * wd, thick: 1.6 * wd, knots: 3 });
  const woodH = woodTexture(Math.ceil(L.fw * wd), Math.ceil(FRAME * s * wd + 2), 'rail-h', RAIL, { spacing: 3.2 * wd, wave: 2 * wd, thick: 1.5 * wd, knots: 1 });
  rc.save();
  railPath(rc, X, Y, s);
  rc.clip();
  rc.drawImage(wood, L.fx, L.fy, L.fw, L.fh);
  [true, false].forEach((top) => {
    rc.save();
    rc.beginPath();
    const yA = Y(top ? -FRAME : TH + CW);
    const yB = Y(top ? -CW : TH + FRAME);
    const inner = top ? yB : yA;
    const outer = top ? yA : yB;
    rc.moveTo(X(-FRAME), outer);
    rc.lineTo(X(TW + FRAME), outer);
    rc.lineTo(X(TW + CW), inner);
    rc.lineTo(X(-CW), inner);
    rc.closePath();
    rc.clip();
    rc.drawImage(woodH, L.fx, Math.min(yA, yB), L.fw, Math.abs(yB - yA) + 1);
    rc.strokeStyle = 'rgba(20,10,4,0.55)';
    rc.lineWidth = 0.8;
    rc.beginPath();
    rc.moveTo(X(-FRAME), outer); rc.lineTo(X(-CW), inner);
    rc.moveTo(X(TW + FRAME), outer); rc.lineTo(X(TW + CW), inner);
    rc.stroke();
    rc.restore();
  });
  const lg = rc.createLinearGradient(0, L.fy, 0, L.fy + L.fh);
  lg.addColorStop(0, 'rgba(255,220,170,0.1)');
  lg.addColorStop(0.5, 'rgba(255,220,170,0.04)');
  lg.addColorStop(1, 'rgba(0,0,0,0.18)');
  rc.fillStyle = lg;
  rc.fillRect(L.fx, L.fy, L.fw, L.fh);
  rc.restore();
  rc.globalCompositeOperation = 'destination-out';
  rc.fillStyle = '#000';
  rc.fillRect(X(-CW), Y(-CW), (TW + 2 * CW) * s, (TH + 2 * CW) * s);
  rc.globalCompositeOperation = 'source-over';
  const bev = 16 * s;
  [[X(-CW), Y(-CW), X(TW + CW), Y(-CW), 0, -1], [X(-CW), Y(TH + CW), X(TW + CW), Y(TH + CW), 0, 1], [X(-CW), Y(-CW), X(-CW), Y(TH + CW), -1, 0], [X(TW + CW), Y(-CW), X(TW + CW), Y(TH + CW), 1, 0]].forEach(([x1, y1, x2, y2, nx, ny]) => {
    const g = rc.createLinearGradient(x1, y1, x1 + nx * bev, y1 + ny * bev);
    g.addColorStop(0, 'rgba(255,214,170,0.26)');
    g.addColorStop(0.35, 'rgba(255,214,170,0.1)');
    g.addColorStop(1, 'rgba(255,214,170,0)');
    rc.fillStyle = g;
    rc.beginPath();
    rc.moveTo(x1, y1); rc.lineTo(x2, y2); rc.lineTo(x2 + nx * bev - (ny ? 0 : 0), y2 + ny * bev); rc.lineTo(x1 + nx * bev, y1 + ny * bev); rc.closePath();
    rc.fill();
  });
  rc.strokeStyle = 'rgba(0,0,0,0.5)';
  rc.lineWidth = Math.max(1, 2.6 * s);
  rc.strokeRect(X(-CW), Y(-CW), (TW + 2 * CW) * s, (TH + 2 * CW) * s);
  rc.save();
  railPath(rc, X, Y, s);
  rc.clip();
  const og = 10 * s;
  rc.strokeStyle = 'rgba(0,0,0,0.35)';
  rc.lineWidth = og;
  railPath(rc, (x) => X(x), (y) => Y(y), s);
  rc.stroke();
  rc.restore();
  rc.globalCompositeOperation = 'destination-out';
  rc.fillStyle = '#000';
  HOLES.forEach(([hx, hy, hr]) => { rc.beginPath(); rc.arc(X(hx), Y(hy), hr * s, 0, Math.PI * 2); rc.fill(); });
  rc.globalCompositeOperation = 'source-over';
  ctx.drawImage(rail, L.fx, L.fy, L.fw, L.fh);

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(255,214,170,0.22)';
  ctx.lineWidth = Math.max(1, 2.4 * s);
  railPath(ctx, (x) => X(x) + 0.6, (y) => Y(y) + 0.6, s);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.lineWidth = 1;
  railPath(ctx, X, Y, s);
  ctx.stroke();
  ctx.restore();

  HOLES.forEach(([hx, hy, hr]) => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(X(hx), Y(hy), (hr + 12) * s, 0, Math.PI * 2);
    ctx.arc(X(hx), Y(hy), hr * s, 0, Math.PI * 2, true);
    ctx.clip();
    ctx.beginPath();
    railPath(ctx, X, Y, s);
    ctx.clip();
    const g = ctx.createRadialGradient(X(hx) - 6 * s, Y(hy) - 8 * s, hr * s, X(hx), Y(hy), (hr + 12) * s);
    g.addColorStop(0, '#2B1E16');
    g.addColorStop(0.5, '#120C09');
    g.addColorStop(1, '#3E2A1D');
    ctx.fillStyle = g;
    ctx.fillRect(X(hx) - (hr + 14) * s, Y(hy) - (hr + 14) * s, (hr + 14) * 2 * s, (hr + 14) * 2 * s);
    ctx.strokeStyle = 'rgba(255,230,200,0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(X(hx), Y(hy), (hr + 11) * s, Math.PI * 1.05, Math.PI * 1.75);
    ctx.stroke();
    ctx.restore();
  });

  const pearl = (x, y, horiz) => {
    const w = 21 * s; const h = 10 * s;
    ctx.save();
    ctx.translate(X(x), Y(y));
    if (!horiz) ctx.rotate(Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(-w, 0); ctx.lineTo(0, -h); ctx.lineTo(w, 0); ctx.lineTo(0, h); ctx.closePath();
    const g = ctx.createLinearGradient(-w, -h, w, h);
    g.addColorStop(0, '#FFFDF6'); g.addColorStop(0.45, '#EEE6D8'); g.addColorStop(0.7, '#F7EBDD'); g.addColorStop(1, '#D3C7B2');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(40,20,8,0.6)';
    ctx.lineWidth = 0.6;
    ctx.stroke();
    ctx.restore();
  };
  const mid = -CW - RW * 0.5;
  for (let i = 1; i < 4; i++) { pearl((TW * i) / 4, mid, true); pearl((TW * i) / 4, TH - mid, true); }
  for (let i = 1; i < 8; i++) { if (i === 4) continue; pearl(mid, (TH * i) / 8, false); pearl(TW - mid, (TH * i) / 8, false); }
}

export function drawPoolPreview(cv, w, h, balls) {
  const { ctx } = fitCanvas(cv, w, h, 2);
  ctx.clearRect(0, 0, w, h);
  const land = w > h;
  ctx.save();
  if (land) { ctx.translate(w, 0); ctx.rotate(Math.PI / 2); }
  const W = land ? h : w; const H = land ? w : h;
  const L = poolLayout(W, H, 2);
  ctx.drawImage(tableArt(L), 0, 0, W, H);
  const r = Math.max(2.2, R * L.s);
  (balls || []).forEach(([id, x, y]) => {
    const cx = L.ox + x * L.s; const cy = L.oy + y * L.s;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.arc(cx + r * 0.2, cy + r * 0.35, r * 0.95, 0, Math.PI * 2); ctx.fill();
    const col = id === 0 ? '#F5F1E6' : ballColor(id);
    ctx.fillStyle = id > 8 ? '#F5F1E6' : col;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    if (id > 8) {
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = col; ctx.fillRect(cx - r, cy - r * 0.5, r * 2, r); ctx.restore();
    }
    const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r);
    g.addColorStop(0, 'rgba(255,255,255,0.6)'); g.addColorStop(0.4, 'rgba(255,255,255,0.05)'); g.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  });
  ctx.restore();
}

export function PoolPreview({ w = 220, h = 122, balls }) {
  const ref = useRef(null);
  const sig = (balls || []).map((b) => b.join(',')).join(';');
  useLayoutEffect(() => { if (ref.current) drawPoolPreview(ref.current, w, h, balls); }, [w, h, sig]);
  return <canvas ref={ref} role="img" aria-label="The pool table" style={{ display: 'block', width: w, height: h, borderRadius: 12 }} />;
}

function randQ(id, salt) {
  const r = rng(`q:${id}:${salt || 0}`);
  let a = r() * 2 - 1; let b = r() * 2 - 1; let c = r() * 2 - 1; let e = r() * 2 - 1;
  const l = Math.hypot(a, b, c, e) || 1;
  a /= l; b /= l; c /= l; e /= l;
  return [a, b, c, e];
}
function faceUp(id) {
  const r = rng(`f:${id}`)();
  const ang = (r - 0.5) * 1.2;
  const s2 = Math.SQRT1_2;
  const q1 = [s2, 0, s2, 0];
  const cz = Math.cos(ang / 2); const sz = Math.sin(ang / 2);
  const q2 = [cz, 0, 0, sz];
  return [q2[0] * q1[0] - q2[3] * q1[3], q2[0] * q1[1] - q2[3] * q1[2], q2[0] * q1[2] + q2[3] * q1[1], q2[0] * q1[3] + q2[3] * q1[0]];
}

export class PoolBoard {
  constructor(host, o) {
    this.host = host;
    this.o = { canShoot: false, bih: false, brk: false, legal: null, spin: { s: 0, e: 0 }, ...o };
    this.balls = (o && o.balls) || [];
    this.orient = new Map();
    this.sprites = new BallSprites();
    this.aim = null;
    this.place = null;
    this.pull = 0;
    this.anim = null;
    this.remote = null;
    this.drag = null;
    this.dead = false;
    this.dirty = true;
    this.loopOn = false;
    this.perf = perfMeter();
    this.roll = loopNoise('b', 320, 0.7);
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
    if (this.ro) this.ro.observe(host); else window.addEventListener('resize', this.resize);
    this.balls.forEach(([id]) => this.orient.set(id, (o && o.fresh) ? faceUp(id) : randQ(id, o && o.salt)));
    this.resize();
    this.prepTurn();
  }

  resize() {
    if (this.dead || !this.host.isConnected) return;
    const r = { width: this.host.clientWidth, height: this.host.clientHeight };
    const W = Math.max(120, Math.floor(r.width)); const H = Math.max(200, Math.floor(r.height));
    if (this.L && this.L.W === W && this.L.H === H) return;
    this.L = poolLayout(W, H, 6, W < 520 ? 26 : 60);
    const b = fitCanvas(this.bg, W, H, 2.5);
    b.ctx.clearRect(0, 0, W, H);
    b.ctx.drawImage(tableArt(this.L), 0, 0, W, H);
    const f = fitCanvas(this.fg, W, H, 2.5);
    this.ctx = f.ctx;
    this.d = f.d;
    if (this.o.onLayout) this.o.onLayout(this.L);
    this.dirty = true;
    this.kick();
  }

  kick() {
    if (this.dead || this.loopOn) return;
    this.loopOn = true;
    this.raf = requestAnimationFrame(this.frame);
  }

  set(p) {
    const was = this.o.canShoot;
    this.o = { ...this.o, ...p };
    if (p.balls && !this.anim) {
      this.balls = p.balls;
      p.balls.forEach(([id]) => { if (!this.orient.has(id)) this.orient.set(id, randQ(id, this.o.salt)); });
    }
    if (!this.o.bih) this.place = null;
    if (this.o.canShoot && (!was || p.balls)) this.prepTurn();
    this.dirty = true;
    this.kick();
  }

  cue() {
    if (this.place) return [this.place[0], this.place[1]];
    const c = this.balls.find((b) => b[0] === 0);
    return c ? [c[1], c[2]] : null;
  }

  prepTurn() {
    if (!this.o.canShoot) return;
    if (this.o.bih && !this.place) {
      const c = this.balls.find((b) => b[0] === 0);
      let x = c ? c[1] : CUE_START[0]; let y = c ? c[2] : (this.o.brk ? CUE_START[1] : TH * 0.78);
      if (!canPlace(this.balls, x, y, this.o.brk)) { x = CUE_START[0]; y = CUE_START[1]; }
      if (!canPlace(this.balls, x, y, this.o.brk)) {
        for (let k = 0; k < 60; k++) { const tx = TW * 0.2 + ((k * 97) % 760); const ty = HEAD_Y + 60 + ((k * 53) % 500); if (canPlace(this.balls, tx, ty, this.o.brk)) { x = tx; y = ty; break; } }
      }
      this.place = [x, y, canPlace(this.balls, x, y, this.o.brk)];
    }
    if (!this.aim) this.autoAim();
  }

  autoAim() {
    const c = this.cue();
    if (!c) return;
    let best = null;
    this.balls.forEach(([id, x, y]) => {
      if (id === 0) return;
      if (this.o.legal && !this.o.legal(id)) return;
      const dd = (x - c[0]) ** 2 + (y - c[1]) ** 2;
      if (!best || dd < best.d) best = { d: dd, x, y };
    });
    const tx = best ? best.x : FOOT[0]; const ty = best ? best.y : FOOT[1];
    const l = Math.hypot(tx - c[0], ty - c[1]) || 1;
    this.aim = [(tx - c[0]) / l, (ty - c[1]) / l];
  }

  toTable(e) {
    const r = this.fg.getBoundingClientRect();
    return [(e.clientX - r.left - this.L.ox) / this.L.s, (e.clientY - r.top - this.L.oy) / this.L.s];
  }

  down(e) {
    if (!this.o.canShoot || this.anim || !this.L) return;
    const [x, y] = this.toTable(e);
    try { this.fg.setPointerCapture(e.pointerId); } catch {}
    const c = this.cue();
    if (this.o.bih && c) {
      const reach = Math.max(R * 3.2, 30 / this.L.s);
      if ((x - c[0]) ** 2 + (y - c[1]) ** 2 < reach * reach) { this.drag = { id: e.pointerId, k: 'place', dx: c[0] - x, dy: c[1] - y }; return; }
    }
    this.drag = { id: e.pointerId, k: 'aim' };
    this.aimTo(x, y);
  }

  move(e) {
    if (!this.drag || this.drag.id !== e.pointerId) return;
    const [x, y] = this.toTable(e);
    if (this.drag.k === 'place') {
      const px = clamp(x + this.drag.dx, R, TW - R); const py = clamp(y + this.drag.dy, this.o.brk ? HEAD_Y : R, TH - R);
      this.place = [px, py, canPlace(this.balls, px, py, this.o.brk)];
      if (this.o.onAim) this.o.onAim();
      this.dirty = true;
      this.kick();
    } else this.aimTo(x, y);
  }

  up(e) {
    if (!this.drag || this.drag.id !== e.pointerId) return;
    if (this.drag.k === 'place') { sfx('poolPlace'); if (this.place && !this.place[2]) appSnack('That spot is taken. Move the white ball to a free spot'); }
    this.drag = null;
  }

  aimTo(x, y) {
    const c = this.cue();
    if (!c) return;
    const dx = x - c[0]; const dy = y - c[1];
    const l = Math.hypot(dx, dy);
    if (l < R * 1.4) return;
    this.aim = [dx / l, dy / l];
    if (this.o.onAim) this.o.onAim();
    this.dirty = true;
    this.kick();
  }

  rotate(a) {
    if (!this.aim || !this.o.canShoot || this.anim) return;
    const c = Math.cos(a); const s = Math.sin(a);
    const [ux, uy] = this.aim;
    const nx = ux * c - uy * s; const ny = ux * s + uy * c;
    const l = Math.hypot(nx, ny) || 1;
    this.aim = [nx / l, ny / l];
    if (this.o.onAim) this.o.onAim();
    this.dirty = true;
    this.kick();
  }

  setPull(v) {
    this.pull = clamp(v, 0, 1);
    if (this.o.onAim) this.o.onAim();
    this.dirty = true;
    this.kick();
  }

  setRemote(r) {
    this.remote = r;
    this.dirty = true;
    this.kick();
  }

  aimState() {
    const c = this.cue();
    if (!this.aim || !c) return null;
    return { ux: Math.round(this.aim[0] * 1e4) / 1e4, uy: Math.round(this.aim[1] * 1e4) / 1e4, p: Math.round(this.pull * 100) / 100, cx: Math.round(c[0]), cy: Math.round(c[1]), bih: !!this.place };
  }

  makeShot(power) {
    if (!this.o.canShoot || this.anim || !this.aim) return null;
    if (this.o.bih && (!this.place || !this.place[2])) return null;
    const sp = this.o.spin || { s: 0, e: 0 };
    const shot = { dx: Math.round(this.aim[0] * 1e6), dy: Math.round(this.aim[1] * 1e6), p: Math.round(clamp(power, 0.01, 1) * 1000), s: Math.round(clamp(sp.s || 0, -100, 100)) };
    if (sp.e) shot.e = Math.round(clamp(sp.e, -100, 100));
    if (this.o.bih && this.place) { shot.cx = Math.round(this.place[0] * 100) / 100; shot.cy = Math.round(this.place[1] * 100) / 100; }
    if (!shot.dx && !shot.dy) return null;
    return shot;
  }

  play(start, shot, cb) {
    const orient = {};
    start.forEach(([id]) => { orient[id] = this.orient.get(id) || randQ(id); });
    if (!orient[0]) orient[0] = this.orient.get(0) || randQ(0);
    const sim = new PoolSim(start, shot, orient);
    const p = clamp(shot.p / 1000, 0, 1);
    this.place = null;
    this.remote = null;
    this.pull = 0;
    const dl = Math.hypot(shot.dx, shot.dy) || 1;
    this.anim = { sim, shot, cb: cb || {}, phase: 'cue', at: performance.now(), cueDur: 150 + (1 - p) * 120, back: 30 + p * 210, ux: shot.dx / dl, uy: shot.dy / dl, cx: shot.cx != null ? shot.cx : null, cy: shot.cy, ev: 0, sent: false, t0: 0, pt: 0, start };
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
    if (!sim.done) sim.run(a.phase === 'cue' ? 5 : 3);
    if (sim.done && !a.sent) { a.sent = true; if (a.cb.onResult) a.cb.onResult(sim.result(), sim); }
    if (a.phase === 'cue') {
      const k = (now - a.at) / a.cueDur;
      if (k >= 1) {
        a.phase = 'roll';
        a.t0 = now;
        sfx('poolCue', { v: clamp(a.shot.p / 1000, 0.1, 1) });
        haptic(12);
      }
      return true;
    }
    const pt = (now - a.t0) / 1000;
    a.pt = pt;
    const ev = sim.events;
    let clack = 0; let cush = 0;
    while (a.ev < ev.length && ev[a.ev].t <= pt) {
      const e = ev[a.ev];
      a.ev += 1;
      const fo = (Math.min(sim.count - 1, Math.floor(e.t * FPS_REC)) * sim.n + e.i) * 6;
      const pan = clamp((sim.frames[fo] - TW / 2) / TW, -0.8, 0.8) || 0;
      if (e.k === 1 && e.s > 25) { if (pt - clack > 0.012) { sfx('poolClack', { v: clamp(e.s / 4200, 0.03, 1), pan }); clack = pt; } }
      else if (e.k === 2 && e.s > 60) { if (pt - cush > 0.02) { sfx('poolCushion', { v: clamp(e.s / 3600, 0.04, 1), pan }); cush = pt; } }
      else if (e.k === 3) { sfx('poolPocket', { v: clamp(e.s / 3000, 0.2, 1), pan }); haptic(8); if (a.cb.onPot) a.cb.onPot(sim.ids[e.i]); }
    }
    let speed = 0;
    const fi = pt * FPS_REC;
    const f0 = Math.min(sim.count - 1, Math.floor(fi));
    const f1 = Math.min(sim.count - 1, f0 + 1);
    if (f0 >= 0 && f1 > f0) {
      const n = sim.n;
      for (let i = 0; i < n; i++) {
        if (sim.potT[i] >= 0 && sim.potT[i] <= pt) continue;
        const o0 = (f0 * n + i) * 6; const o1 = (f1 * n + i) * 6;
        speed += Math.hypot(sim.frames[o1] - sim.frames[o0], sim.frames[o1 + 1] - sim.frames[o0 + 1]) * FPS_REC;
      }
    }
    this.roll.set(clamp(speed / 26000, 0, 0.22), 220 + clamp(speed / 30, 0, 380));
    let tail = 0.12;
    for (let i = 0; i < sim.n; i++) if (sim.potT[i] >= 0 && sim.potT[i] > sim.duration - 0.45) tail = Math.max(tail, sim.potT[i] - sim.duration + 0.45);
    const end = sim.done && pt >= sim.duration + tail;
    if (end) {
      this.roll.set(0);
      const fin = sim.final();
      const last = sim.count - 1;
      for (let i = 0; i < sim.n; i++) {
        if (!sim.on[i]) continue;
        const o = (last * sim.n + i) * 6;
        this.orient.set(sim.ids[i], [sim.frames[o + 2], sim.frames[o + 3], sim.frames[o + 4], sim.frames[o + 5]]);
      }
      this.anim = null;
      this.balls = fin;
      this.aim = null;
      this.dirty = true;
      const cb = a.cb;
      if (cb.onDone) cb.onDone(fin, sim);
      return false;
    }
    return true;
  }

  view(pt) {
    const a = this.anim;
    const out = [];
    if (!a || a.phase === 'cue') {
      const list = a ? a.start.slice() : this.balls;
      if (a && a.cx != null && !list.some((b) => b[0] === 0)) list.push([0, a.cx, a.cy]);
      list.forEach(([id, x, y]) => {
        if (a && id === 0 && a.cx != null) { x = a.cx; y = a.cy; }
        if (!a && id === 0 && this.place) return;
        out.push({ id, x, y, q: this.orient.get(id) || randQ(id), a: 1, sc: 1 });
      });
      return out;
    }
    const sim = a.sim;
    const fi = pt * FPS_REC;
    const last = sim.count - 1;
    const f0 = Math.max(0, Math.min(last, Math.floor(fi)));
    const f1 = Math.min(last, f0 + 1);
    const k = f1 > f0 ? clamp(fi - f0, 0, 1) : 0;
    const n = sim.n;
    for (let i = 0; i < n; i++) {
      const o0 = (f0 * n + i) * 6; const o1 = (f1 * n + i) * 6;
      const F = sim.frames;
      let x = lerp(F[o0], F[o1], k); let y = lerp(F[o0 + 1], F[o1 + 1], k);
      let qw = F[o0 + 2]; let qx = F[o0 + 3]; let qy = F[o0 + 4]; let qz = F[o0 + 5];
      let rw = F[o1 + 2]; let rx = F[o1 + 3]; let ry = F[o1 + 4]; let rz = F[o1 + 5];
      if (qw * rw + qx * rx + qy * ry + qz * rz < 0) { rw = -rw; rx = -rx; ry = -ry; rz = -rz; }
      qw = lerp(qw, rw, k); qx = lerp(qx, rx, k); qy = lerp(qy, ry, k); qz = lerp(qz, rz, k);
      const ql = Math.hypot(qw, qx, qy, qz) || 1;
      const q = [qw / ql, qx / ql, qy / ql, qz / ql];
      const tp = sim.potT[i];
      if (tp >= 0 && pt >= tp) {
        const dt = pt - tp;
        if (dt > 0.42) continue;
        const pk = POCKETS[sim.potPk[i]];
        const u = easeOut(clamp(dt / 0.3, 0, 1));
        const vx = sim.potV[i * 2]; const vy = sim.potV[i * 2 + 1];
        const px = sim.x[i] + vx * Math.min(dt, 0.05); const py = sim.y[i] + vy * Math.min(dt, 0.05);
        x = lerp(px, pk[0] + (pk[0] < TW / 2 ? -6 : 6), u); y = lerp(py, pk[1], u);
        out.push({ id: sim.ids[i], x, y, q, a: 1 - clamp((dt - 0.22) / 0.2, 0, 1), sc: 1 - 0.32 * u, dark: u, pocket: sim.potPk[i] });
        continue;
      }
      out.push({ id: sim.ids[i], x, y, q, a: 1, sc: 1 });
    }
    return out;
  }

  draw(now) {
    const ctx = this.ctx;
    const L = this.L;
    if (!ctx || !L) return;
    const { s } = L;
    const X = (x) => L.ox + x * s;
    const Y = (y) => L.oy + y * s;
    ctx.clearRect(0, 0, L.W, L.H);
    const a = this.anim;
    const pt = a && a.phase === 'roll' ? a.pt : 0;
    const balls = this.view(pt);
    const r = R * s;
    const rp = r * this.d;
    const soft = softSprites();
    if (this.o.canShoot && this.o.bih && this.o.brk && !a) {
      ctx.fillStyle = 'rgba(255,255,255,0.045)';
      ctx.fillRect(X(0), Y(HEAD_Y), TW * s, (TH - HEAD_Y) * s);
    }
    const shown = balls.slice();
    if (this.place && !a) shown.push({ id: 0, x: this.place[0], y: this.place[1], q: this.orient.get(0) || randQ(0), a: this.place[2] ? 1 : 0.7, sc: 1, placing: true });
    shown.forEach((b) => {
      if (b.pocket != null) return;
      const cx = X(b.x); const cy = Y(b.y);
      ctx.globalAlpha = 0.5 * b.a;
      ctx.drawImage(soft.sh, cx - r * 0.78 + r * 0.06, cy - r * 0.78 + r * 0.1, r * 1.56, r * 1.56);
      LAMPS.forEach(([lx, ly]) => {
        const dx = b.x - lx; const dy = b.y - ly;
        const dd = Math.hypot(dx, dy);
        const k = R / (LAMP_H - R);
        const ox = dx * k; const oy = dy * k;
        const fall = 1 / (1 + (dd * dd) / 900000);
        ctx.globalAlpha = 0.2 * fall * b.a;
        const w = r * (1.35 + Math.min(0.5, dd / 2400));
        ctx.drawImage(soft.sh, X(b.x + ox * 1.4) - w, Y(b.y + oy * 1.4) - w, w * 2, w * 2);
      });
    });
    ctx.globalAlpha = 1;
    shown.forEach((b) => {
      const cx = X(b.x); const cy = Y(b.y);
      const rr = r * b.sc;
      if (b.pocket != null) {
        const hole = HOLES[b.pocket];
        ctx.save();
        ctx.beginPath();
        ctx.arc(X(hole[0]), Y(hole[1]), (hole[2] - 4) * s, 0, Math.PI * 2);
        ctx.clip();
      }
      const spr = this.sprites.get(b.id, b.q, rp);
      ctx.globalAlpha = b.a;
      const sw = (spr.width / this.d) * b.sc;
      ctx.drawImage(spr, cx - sw / 2, cy - sw / 2, sw, sw);
      if (b.pocket == null) {
        LAMPS.forEach(([lx, ly], li) => {
          let hx = lx - b.x; let hy = ly - b.y; let hz = -(LAMP_H - R);
          const hl = Math.hypot(hx, hy, hz);
          hx /= hl; hy /= hl; hz /= hl;
          hz -= 1;
          const hn = Math.hypot(hx, hy, hz);
          const ox = (hx / hn) * rr; const oy = (hy / hn) * rr;
          const dd = Math.hypot(lx - b.x, ly - b.y);
          const fall = 1 / (1 + (dd * dd) / 700000);
          ctx.globalAlpha = (li === 1 ? 0.92 : 0.8) * fall * b.a;
          const w = rr * (0.34 + 0.1 * fall);
          ctx.drawImage(soft.hi, cx + ox * 0.95 - w, cy + oy * 0.95 - w, w * 2, w * 2);
        });
      } else {
        ctx.globalAlpha = 0.85 * b.dark;
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(cx, cy, rr + 0.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      if (b.placing) {
        ctx.save();
        ctx.strokeStyle = this.place[2] ? 'rgba(255,255,255,0.9)' : 'rgba(255,92,92,0.95)';
        ctx.lineWidth = 1.6;
        ctx.setLineDash([4, 4]);
        ctx.lineDashOffset = -(now / 60) % 8;
        ctx.beginPath(); ctx.arc(cx, cy, r + 7, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }
    });
    if (this.o.canShoot && !a && this.aim) this.drawGuide(ctx, X, Y, s, r);
    if (a && a.phase === 'cue') {
      const k = clamp((now - a.at) / a.cueDur, 0, 1);
      const c = a.cx != null ? [a.cx, a.cy] : (() => { const cb = a.start.find((b) => b[0] === 0); return cb ? [cb[1], cb[2]] : null; })();
      if (c) this.drawCue(ctx, X, Y, s, c, a.ux, a.uy, a.back * (1 - k * k * k), 1);
    } else if (a && a.phase === 'roll' && a.pt < 0.35) {
      const c = a.cx != null ? [a.cx, a.cy] : (() => { const cb = a.start.find((b) => b[0] === 0); return cb ? [cb[1], cb[2]] : null; })();
      if (c) this.drawCue(ctx, X, Y, s, c, a.ux, a.uy, 4 + a.pt * 120, 1 - a.pt / 0.35);
    } else if (!a && this.o.canShoot && this.aim) {
      const c = this.cue();
      if (c) this.drawCue(ctx, X, Y, s, c, this.aim[0], this.aim[1], 10 + this.pull * 230, 1);
    } else if (!a && this.remote && this.remote.ux != null) {
      const rm = this.remote;
      const c = rm.bih ? [rm.cx, rm.cy] : this.cue();
      if (c) {
        if (rm.bih) {
          const spr = this.sprites.get(0, this.orient.get(0) || randQ(0), rp);
          ctx.globalAlpha = 0.85;
          ctx.drawImage(spr, X(c[0]) - spr.width / this.d / 2, Y(c[1]) - spr.height / this.d / 2, spr.width / this.d, spr.height / this.d);
          ctx.globalAlpha = 1;
        }
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.28)';
        ctx.setLineDash([3, 6]);
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(X(c[0]), Y(c[1])); ctx.lineTo(X(c[0] + rm.ux * 420), Y(c[1] + rm.uy * 420)); ctx.stroke();
        ctx.restore();
        this.drawCue(ctx, X, Y, s, c, rm.ux, rm.uy, 10 + (rm.p || 0) * 230, 0.9);
      }
    }
  }

  drawGuide(ctx, X, Y, s, r) {
    const c = this.cue();
    if (!c) return;
    const [ux, uy] = this.aim;
    const others = this.balls.filter((b) => b[0] !== 0);
    const hit = aimRay(others, c[0], c[1], ux, uy);
    const gx = c[0] + ux * hit.t; const gy = c[1] + uy * hit.t;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255,255,255,0.88)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(X(c[0] + ux * R), Y(c[1] + uy * R));
    ctx.lineTo(X(gx - ux * R), Y(gy - uy * R));
    ctx.stroke();
    if (hit.id != null) {
      const ok = !this.o.legal || this.o.legal(hit.id);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.beginPath(); ctx.arc(X(gx), Y(gy), r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = ok ? 'rgba(255,255,255,0.95)' : 'rgba(255,84,84,0.95)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(X(gx), Y(gy), r, 0, Math.PI * 2); ctx.stroke();
      if (!ok) {
        ctx.beginPath(); ctx.moveTo(X(gx) - r * 0.62, Y(gy) + r * 0.62); ctx.lineTo(X(gx) + r * 0.62, Y(gy) - r * 0.62); ctx.stroke();
      } else {
        const nx = (hit.bx - gx) / (2 * R); const ny = (hit.by - gy) / (2 * R);
        const full = clamp(ux * nx + uy * ny, 0, 1);
        const ol = 50 + 330 * full;
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(X(hit.bx + nx * R), Y(hit.by + ny * R)); ctx.lineTo(X(hit.bx + nx * (R + ol)), Y(hit.by + ny * (R + ol))); ctx.stroke();
        let tx = ux - full * nx; let ty = uy - full * ny;
        const tl = Math.hypot(tx, ty);
        if (tl > 0.02) {
          tx /= tl; ty /= tl;
          const sp = this.o.spin || { s: 0 };
          const cl = 40 + 260 * (1 - full) * (sp.s < -20 ? 0.7 : 1);
          ctx.strokeStyle = 'rgba(255,255,255,0.5)';
          ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.moveTo(X(gx + tx * R), Y(gy + ty * R)); ctx.lineTo(X(gx + tx * (R + cl)), Y(gy + ty * (R + cl))); ctx.stroke();
        }
      }
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(X(gx), Y(gy), r, 0, Math.PI * 2); ctx.stroke();
      const bx = hit.ax === 'x' ? -ux : ux; const by = hit.ax === 'y' ? -uy : uy;
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.setLineDash([3, 5]);
      ctx.beginPath(); ctx.moveTo(X(gx + bx * R), Y(gy + by * R)); ctx.lineTo(X(gx + bx * 260), Y(gy + by * 260)); ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  drawCue(ctx, X, Y, s, c, ux, uy, back, alpha) {
    const tipD = R + Math.max(0, back);
    const len = 1460;
    const px = -uy; const py = ux;
    const at = (d, w) => [X(c[0] - ux * (tipD + d) + px * w), Y(c[1] - uy * (tipD + d) + py * w)];
    const segs = [
      [0, 9, 6.2, 6.3, ['#2F5C9E', '#5C8AD0', '#244A82']],
      [9, 34, 6.3, 6.5, ['#E9E4D6', '#FFFFFF', '#C9C2B0']],
      [34, 720, 6.5, 10.5, ['#C99A62', '#F1D9AE', '#A87A47']],
      [720, 742, 10.5, 10.8, ['#9AA3AE', '#F4F6F8', '#6E7782']],
      [742, 1040, 10.8, 13, ['#3A1A0E', '#7A3F22', '#26100A']],
      [1040, 1330, 13, 14.2, ['#17171B', '#3A3A42', '#0C0C0F']],
      [1330, len, 14.2, 15, ['#4A1F12', '#8A4A2A', '#2E120A']],
    ];
    ctx.save();
    ctx.globalAlpha = alpha * 0.32;
    ctx.fillStyle = '#000';
    const so = 6 * s * 3.2;
    ctx.beginPath();
    const a0 = at(0, -6); const a1 = at(len, -15); const b1 = at(len, 15); const b0 = at(0, 6);
    ctx.moveTo(a0[0] + so * 0.4, a0[1] + so * 0.7); ctx.lineTo(a1[0] + so * 1.6, a1[1] + so * 2.4); ctx.lineTo(b1[0] + so * 1.6, b1[1] + so * 2.4); ctx.lineTo(b0[0] + so * 0.4, b0[1] + so * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = alpha;
    segs.forEach(([d0, d1, w0, w1, col]) => {
      const p0 = at(d0, -w0); const p1 = at(d1, -w1); const p2 = at(d1, w1); const p3 = at(d0, w0);
      const m0 = at((d0 + d1) / 2, -w1); const m1 = at((d0 + d1) / 2, w1);
      const g = ctx.createLinearGradient(m0[0], m0[1], m1[0], m1[1]);
      g.addColorStop(0, col[2]); g.addColorStop(0.38, col[1]); g.addColorStop(0.62, col[0]); g.addColorStop(1, col[2]);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.lineTo(p3[0], p3[1]); ctx.closePath();
      ctx.fill();
    });
    ctx.strokeStyle = 'rgba(233,220,192,0.75)';
    ctx.lineWidth = Math.max(0.6, 1.6 * s * 3);
    [[760, 980], [800, 1020]].forEach(([d0, d1], i) => {
      const q0 = at(d0, (i ? 1 : -1) * 4); const q1 = at(d1, 0);
      ctx.beginPath(); ctx.moveTo(q0[0], q0[1]); ctx.lineTo(q1[0], q1[1]); ctx.stroke();
    });
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 0.6;
    for (let d0 = 1050; d0 < 1320; d0 += 14) { const q0 = at(d0, -13.5); const q1 = at(d0 + 8, 13.5); ctx.beginPath(); ctx.moveTo(q0[0], q0[1]); ctx.lineTo(q1[0], q1[1]); ctx.stroke(); }
    ctx.restore();
  }

  stats() { return this.perf.report(); }

  destroy() {
    this.dead = true;
    cancelAnimationFrame(this.raf);
    this.roll.stop();
    if (this.ro) this.ro.disconnect(); else window.removeEventListener('resize', this.resize);
    this.fg.removeEventListener('pointerdown', this.down);
    this.fg.removeEventListener('pointermove', this.move);
    this.fg.removeEventListener('pointerup', this.up);
    this.fg.removeEventListener('pointercancel', this.up);
    this.bg.remove();
    this.fg.remove();
  }
}

const SCENE = new Map();
export function PoolScene() {
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
        const plank = 46;
        const n = Math.ceil(W / plank) + 1;
        const rnd = rng('floor');
        const td = Math.min(d, 1.5);
        const texs = [0, 1, 2].map((k) => woodTexture(Math.ceil(plank * td), Math.ceil(720 * td), `plank${k}`, [mix('#2A1A10', '#3B2616', k / 2), '#140B06', '#5A3A22'], { vertical: true, spacing: 2.6 * td, wave: 1.4 * td, thick: 1.1 * td, knots: k === 1 ? 1 : 0 }));
        for (let i = 0; i < n; i++) {
          let y = -rnd() * 400;
          while (y < H) {
            const len = 260 + rnd() * 420;
            const tex = texs[Math.floor(rnd() * 3)];
            const sy = rnd() * (720 - len);
            g.drawImage(tex, 0, sy * td, tex.width, len * td, i * plank, y, plank, len);
            g.fillStyle = `rgba(${rnd() < 0.5 ? '0,0,0' : '255,200,150'},${(rnd() * 0.08).toFixed(3)})`;
            g.fillRect(i * plank, y, plank, len);
            g.fillStyle = 'rgba(0,0,0,0.55)';
            g.fillRect(i * plank, y, plank, 1.2);
            g.fillRect(i * plank, y, 1, len);
            y += len;
          }
        }
        const warm = g.createRadialGradient(W / 2, H * 0.52, 10, W / 2, H * 0.52, Math.max(W, H) * 0.6);
        warm.addColorStop(0, 'rgba(255,196,120,0.16)');
        warm.addColorStop(1, 'rgba(255,196,120,0)');
        g.fillStyle = warm;
        g.fillRect(0, 0, W, H);
        const lg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.2, W / 2, H / 2, Math.max(W, H) * 0.75);
        lg.addColorStop(0, 'rgba(0,0,0,0)');
        lg.addColorStop(1, 'rgba(0,0,0,0.72)');
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

function BallDot({ id, size = 14, faded }) {
  const base = ballColor(id);
  return (
    <span aria-hidden="true" style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, opacity: faded ? 0.26 : 1, background: id > 8 ? `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.65), rgba(255,255,255,0) 45%), linear-gradient(180deg, #F6F2E6 0 26%, ${base} 26% 74%, #F6F2E6 74% 100%)` : `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.6), rgba(255,255,255,0) 45%), ${base}`, boxShadow: 'inset 0 -2px 2px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.5)', transition: 'opacity 260ms ease' }} />
  );
}

function Seat({ id, label, hot, group, left, here, end }) {
  const n = (g1Mem.names && g1Mem.names[id]) || {};
  const all = group === 's' ? [1, 2, 3, 4, 5, 6, 7] : group === 't' ? [9, 10, 11, 12, 13, 14, 15] : null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexDirection: end ? 'row-reverse' : 'row', minWidth: 0, flex: 1 }}>
      <div style={{ position: 'relative', borderRadius: '50%', padding: 2, background: hot ? 'linear-gradient(140deg, #F6D27A, #C9952F)' : 'rgba(255,255,255,0.12)', transition: 'background 220ms ease', flexShrink: 0 }}>
        <Avatar emoji={n.avatar} name={n.name || label} size={34} />
        {here && <span style={{ position: 'absolute', right: 0, bottom: 0, width: 10, height: 10, borderRadius: 5, background: '#3DDC84', boxShadow: '0 0 0 2px #1A1410' }} />}
      </div>
      <div style={{ minWidth: 0, textAlign: end ? 'right' : 'left' }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: '#FFF6EA', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
        <div style={{ display: 'flex', gap: 2.5, marginTop: 3, justifyContent: end ? 'flex-end' : 'flex-start', minHeight: 13 }}>
          {all ? all.map((b) => <BallDot key={b} id={b} size={12} faded={!left.includes(b)} />) : <span style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(255,240,220,0.6)' }}>Open table</span>}
          {all && !left.length && <BallDot id={8} size={12} />}
        </div>
      </div>
    </div>
  );
}

function PowerBar({ box, disabled, onPull, onShoot }) {
  const ref = useRef(null);
  const fill = useRef(null);
  const stick = useRef(null);
  const drag = useRef(null);
  const set = (v) => {
    if (fill.current) { fill.current.style.transform = `scaleY(${v})`; fill.current.style.opacity = v > 0 ? '1' : '0'; }
    if (stick.current) stick.current.style.transform = `translateY(${v * 100}%)`;
  };
  const down = (e) => {
    if (disabled) return;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    drag.current = { id: e.pointerId, y0: e.clientY, v: 0 };
  };
  const move = (e) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId || !ref.current) return;
    const h = ref.current.getBoundingClientRect().height;
    const v = clamp((e.clientY - d.y0) / (h * 0.82), 0, 1);
    if (Math.abs(v - d.v) > 0.002) { if (Math.floor(v * 10) !== Math.floor(d.v * 10)) haptic(4); d.v = v; set(v); onPull(v); }
  };
  const up = (e) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    set(0);
    onPull(0);
    if (d.v > 0.025) onShoot(d.v);
  };
  if (!box) return null;
  return (
    <div ref={ref} role="slider" aria-label="Power. Drag down and let go to shoot" aria-valuemin={0} aria-valuemax={100} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
      style={{ position: 'absolute', left: box.x - 8, top: box.y - 6, width: box.w + 16, height: box.h + 12, touchAction: 'none', cursor: disabled ? 'default' : 'grab', opacity: disabled ? 0.38 : 1, transition: 'opacity 200ms ease', zIndex: 3 }}>
      <div style={{ position: 'absolute', left: 8, right: 8, top: 6, bottom: 6, borderRadius: box.w / 2, background: 'linear-gradient(90deg, #120B07, #2A1B12 50%, #120B07)', boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.8), 0 0 0 1.5px #B48A4C, 0 0 0 3px rgba(0,0,0,0.45)', overflow: 'hidden' }}>
        <div ref={fill} style={{ position: 'absolute', left: 3, right: 3, top: 3, bottom: 3, borderRadius: box.w / 2, transformOrigin: 'top', transform: 'scaleY(0)', opacity: 0, background: 'linear-gradient(180deg, #4ADE80 0%, #FACC15 55%, #F97316 80%, #EF4444 100%)', backgroundSize: '100% 100%' }} />
        {[0.25, 0.5, 0.75].map((k) => <div key={k} style={{ position: 'absolute', left: '22%', right: '22%', top: `${k * 100}%`, height: 1, background: 'rgba(255,230,190,0.28)' }} />)}
        <div ref={stick} style={{ position: 'absolute', left: '50%', top: -box.h * 0.55, marginLeft: -3.5, width: 7, height: box.h * 0.62, transform: 'translateY(0)', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: 4, background: 'linear-gradient(90deg, #A87A47, #F1D9AE 45%, #C99A62)' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 9, borderRadius: '0 0 4px 4px', background: 'linear-gradient(180deg, #F2EEE3 0 70%, #3A67A8 70%)' }} />
        </div>
      </div>
    </div>
  );
}

function AimWheel({ box, disabled, onTurn }) {
  const strip = useRef(null);
  const drag = useRef(null);
  const pos = useRef(0);
  const down = (e) => {
    if (disabled) return;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    drag.current = { id: e.pointerId, y: e.clientY };
  };
  const move = (e) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dy = e.clientY - d.y;
    d.y = e.clientY;
    if (!dy) return;
    pos.current += dy;
    if (strip.current) strip.current.style.backgroundPosition = `0 ${pos.current}px`;
    onTurn(dy * 0.0011);
    if (Math.abs(pos.current) % 9 < Math.abs(dy)) haptic(2);
  };
  const up = (e) => { if (drag.current && drag.current.id === e.pointerId) drag.current = null; };
  if (!box) return null;
  return (
    <div role="slider" aria-label="Fine aim. Drag up or down" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
      style={{ position: 'absolute', left: box.x - 8, top: box.y - 6, width: box.w + 16, height: box.h + 12, touchAction: 'none', cursor: disabled ? 'default' : 'ns-resize', opacity: disabled ? 0.38 : 1, transition: 'opacity 200ms ease', zIndex: 3 }}>
      <div ref={strip} style={{ position: 'absolute', left: 8, right: 8, top: 6, bottom: 6, borderRadius: box.w / 2, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.6), 0 0 0 1.5px #B48A4C, 0 0 0 3px rgba(0,0,0,0.45)', background: 'repeating-linear-gradient(180deg, #8C8F96 0 2px, #D9DCE2 2px 4px, #5E6168 4px 6px, #2C2E33 6px 9px)' }} />
      <div style={{ position: 'absolute', left: 8, right: 8, top: 6, bottom: 6, borderRadius: box.w / 2, background: 'linear-gradient(180deg, rgba(0,0,0,0.75), rgba(0,0,0,0) 28%, rgba(0,0,0,0) 72%, rgba(0,0,0,0.75)), linear-gradient(90deg, rgba(0,0,0,0.35), rgba(255,255,255,0.18) 50%, rgba(0,0,0,0.35))', pointerEvents: 'none' }} />
    </div>
  );
}

function SpinBall({ spin, size, onClick, disabled }) {
  const x = 50 + (spin.e || 0) * 0.36; const y = 50 - (spin.s || 0) * 0.36;
  return (
    <button type="button" aria-label="Spin" onClick={onClick} disabled={disabled}
      style={{ width: size, height: size, borderRadius: '50%', border: 'none', padding: 0, flexShrink: 0, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.45 : 1, background: 'radial-gradient(circle at 36% 30%, #FFFFFF 0%, #F1EDE2 42%, #CFC7B5 82%, #A79F8C 100%)', boxShadow: '0 3px 8px rgba(0,0,0,0.55), inset 0 -2px 3px rgba(0,0,0,0.2)', position: 'relative' }}>
      <span style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: size * 0.22, height: size * 0.22, marginLeft: -size * 0.11, marginTop: -size * 0.11, borderRadius: '50%', background: '#D21F2B', boxShadow: '0 0 0 2px rgba(255,255,255,0.7)' }} />
    </button>
  );
}

function spinWords(sp) {
  const v = sp.s || 0; const h = sp.e || 0;
  const a = v > 25 ? 'Top spin' : v < -25 ? 'Back spin' : '';
  const b = h > 25 ? 'right side' : h < -25 ? 'left side' : '';
  if (a && b) return `${a}, ${b}`;
  if (a) return a;
  if (b) return b === 'right side' ? 'Right side spin' : 'Left side spin';
  return 'Centre ball';
}

function SpinPicker({ spin, onChange, onClose }) {
  useBackClose(true, onClose);
  const ref = useRef(null);
  const [v, setV] = useState(spin);
  const pick = (e) => {
    const r = ref.current.getBoundingClientRect();
    let dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    let dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    const l = Math.hypot(dx, dy);
    const max = 0.78;
    if (l > max) { dx = (dx / l) * max; dy = (dy / l) * max; }
    const nv = { s: Math.round(clamp(-dy / max, -1, 1) * 100), e: Math.round(clamp(dx / max, -1, 1) * 100) };
    if (Math.abs(nv.s) < 8) nv.s = 0;
    if (Math.abs(nv.e) < 8) nv.e = 0;
    setV(nv);
    onChange(nv);
  };
  const [held, setHeld] = useState(false);
  const x = 50 + (v.e || 0) * 0.39; const y = 50 - (v.s || 0) * 0.39;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(6,4,2,0.62)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 300, borderRadius: 26, padding: '20px 20px 16px', background: 'linear-gradient(180deg, #2A1D14, #1A120C)', boxShadow: '0 20px 50px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,220,170,0.12)', textAlign: 'center' }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: '#FFF4E4' }}>Spin</div>
        <div style={{ fontSize: 13, color: 'rgba(255,236,210,0.7)', marginTop: 3, minHeight: 18 }}>{spinWords(v)}</div>
        <div ref={ref} role="slider" aria-label="Where the cue hits the white ball" onPointerDown={(e) => { try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} setHeld(true); pick(e); }} onPointerMove={(e) => { if (held) pick(e); }} onPointerUp={() => setHeld(false)} onPointerCancel={() => setHeld(false)}
          style={{ width: 200, height: 200, margin: '16px auto 10px', borderRadius: '50%', position: 'relative', touchAction: 'none', cursor: 'crosshair', background: 'radial-gradient(circle at 36% 30%, #FFFFFF 0%, #F2EEE4 38%, #D3CBB9 78%, #9C9481 100%)', boxShadow: '0 10px 24px rgba(0,0,0,0.6), inset 0 -6px 10px rgba(0,0,0,0.18)' }}>
          <div style={{ position: 'absolute', left: '11%', right: '11%', top: '50%', height: 1, background: 'rgba(60,50,40,0.18)' }} />
          <div style={{ position: 'absolute', top: '11%', bottom: '11%', left: '50%', width: 1, background: 'rgba(60,50,40,0.18)' }} />
          <div style={{ position: 'absolute', inset: '11%', borderRadius: '50%', border: '1px dashed rgba(60,50,40,0.22)' }} />
          <div style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: 30, height: 30, marginLeft: -15, marginTop: -15, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #FF6670, #C8141F 70%)', boxShadow: '0 0 0 3px rgba(255,255,255,0.85), 0 4px 8px rgba(0,0,0,0.4)', transition: held ? 'none' : 'left 160ms ease, top 160ms ease' }} />
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          <button type="button" onClick={() => { const z = { s: 0, e: 0 }; setV(z); onChange(z); }} style={{ flex: 1, height: 44, borderRadius: 14, border: 'none', background: 'rgba(255,236,210,0.1)', color: '#FFF4E4', fontWeight: 800, fontSize: 14.5, fontFamily: FONT, cursor: 'pointer' }}>Centre</button>
          <button type="button" onClick={onClose} style={{ flex: 1, height: 44, borderRadius: 14, border: 'none', background: 'linear-gradient(180deg, #E9C46A, #C9952F)', color: '#2A1A08', fontWeight: 900, fontSize: 14.5, fontFamily: FONT, cursor: 'pointer' }}>Done</button>
        </div>
      </div>
    </div>
  );
}

function RoomButton({ label, onClick, children, gold, wide }) {
  return (
    <button type="button" aria-label={label} onClick={onClick}
      style={{ height: 40, minWidth: wide ? 120 : 40, padding: wide ? '0 18px' : 0, borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: FONT, fontWeight: 900, fontSize: 14.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: gold ? '#2A1A08' : '#FFF4E4', background: gold ? 'linear-gradient(180deg, #F0CF7A, #C9952F)' : 'rgba(255,236,210,0.12)', boxShadow: gold ? '0 3px 0 #7A5410, 0 6px 14px rgba(0,0,0,0.4)' : 'inset 0 0 0 1px rgba(255,236,210,0.12)' }}>
      {children || label}
    </button>
  );
}

function FlagGlyph() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 21V4" /><path d="M5 4h11l-2 4 2 4H5" />
    </svg>
  );
}

const SEEN_KEY = 'zchat-gb-pool-seen';
function seenShot(key, mark) {
  let list = [];
  try { list = JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'); } catch {}
  if (!Array.isArray(list)) list = [];
  const has = list.includes(key);
  if (mark && !has) { list.push(key); try { localStorage.setItem(SEEN_KEY, JSON.stringify(list.slice(-60))); } catch {} }
  return has;
}

function potNote(next) {
  if (!next || !next.ev || next.w) return;
  if (next.ev.fl) sfx('lose');
  else if ((next.ev.pt || []).some((id) => id !== 0)) sfx('turn');
}

function usePoolPlay({ st, prevOf, myId, peer, relay, save, onBusy, onFlash }) {
  const hostRef = useRef(null);
  const board = useRef(null);
  const busy = useRef(false);
  const shown = useRef(null);
  const stRef = useRef(st);
  stRef.current = st;
  const [spin, setSpin] = useState({ s: 0, e: 0 });
  const spinRef = useRef(spin);
  spinRef.current = spin;
  const [lay, setLay] = useState(null);
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
  const legalFor = (s) => {
    const g = groupOf(s, myMark);
    if ((s.n || 0) === 0) return null;
    const mine = g ? s.b.filter(([id]) => (g === 's' ? id >= 1 && id <= 7 : id >= 9 && id <= 15)).length : 1;
    return (id) => (g ? (mine === 0 ? id === 8 : kindOf(id) === g) : id !== 8);
  };
  const opts = (s0) => {
    const s = s0 || stRef.current;
    const mt = !s.w && s.t === myId && !busy.current;
    return { canShoot: mt, bih: mt && !!s.bih, brk: (s.n || 0) === 0, legal: legalFor(s) };
  };
  const liveShot = useRef(null);
  const outbox = useRef(null);
  const flush = () => {
    const o = outbox.current;
    if (!o || o.sent) return;
    o.sent = true;
    clearTimeout(o.timer);
    if (saveRef.current) saveRef.current(o.next);
  };
  const replay = (from, ls, after) => {
    const b = board.current;
    setBusy(true);
    b.setRemote(null);
    b.set({ canShoot: false });
    b.play(from, ls, { onDone: (fin) => { setBusy(false); after(fin); } });
  };
  const live = useShotLink(`zpool-${st.id}`, myId, relay, (p) => {
    const b = board.current;
    if (!b || busy.current) return;
    const s = stRef.current;
    if (s.t !== p.by || s.w) return;
    if (p.k === 'aim') b.setRemote(p);
    if (p.k === 'off') b.setRemote(null);
    if (p.k === 'shot' && p.n === (s.n || 0) && p.ls && shown.current === s.n && !b.busy()) {
      liveShot.current = { n: p.n, done: false };
      seenShot(`${s.id}:${p.n + 1}`, true);
      replay(s.b, p.ls, () => {
        const cur = stRef.current;
        liveShot.current = { n: p.n, done: true };
        if ((cur.n || 0) > p.n) { shown.current = cur.n; b.set({ balls: cur.b, ...opts() }); potNote(cur); flashFor(cur, false); } else b.set(opts());
        setTick((x) => x + 1);
      });
      setTick((x) => x + 1);
    }
  });
  const liveRef = useRef(live);
  liveRef.current = live;
  const sendAim = useRef(null);
  if (!sendAim.current) sendAim.current = throttle((p) => liveRef.current.send(p), 70);
  const flashFor = (next, mine) => {
    if (!next || !next.ev) return;
    const who = mine ? 'You' : peer;
    let t = null;
    if (next.w) t = next.why === 'resign' ? null : g1Outcome(next, myId) === 'win' ? 'You won the game' : `${peer} won the game`;
    else if (next.ev.fl === 'scratch') t = `${who} potted the white`;
    else if (next.ev.fl === 'miss') t = `${who} missed every ball`;
    else if (next.ev.fl === 'wrong') t = `${who} hit the wrong ball first`;
    else if (next.ev.r8) t = 'The black went down on the break and came back';
    else if (next.t === (mine ? myId : other) && (next.ev.pt || []).some((id) => id !== 0)) t = mine ? 'Nice shot, go again' : `${peer} goes again`;
    if (!t) return;
    if (flashRef.current) { if (!next.w) flashRef.current(t); return; }
    setFlash({ t, at: Date.now() });
    setTimeout(() => setFlash((f) => (f && Date.now() - f.at > 2000 ? null : f)), 2300);
  };
  const fire = (power) => {
    const b = board.current;
    const s = stRef.current;
    if (!b || busy.current || s.w || s.t !== myId || shown.current !== s.n) return false;
    b.set({ spin: spinRef.current });
    const shot = b.makeShot(power);
    if (!shot) { appSnack(s.bih ? 'Move the white ball to a free spot first' : 'Touch the table to aim first'); return false; }
    setBusy(true);
    b.set({ canShoot: false });
    liveRef.current.send({ k: 'shot', n: s.n || 0, ls: shot });
    let next = null;
    b.play(s.b, shot, {
      onResult: (res, sim) => {
        next = judge(s, shot, res, myId);
        outbox.current = { next, sent: false, timer: setTimeout(flush, Math.round((sim.duration + 1.2) * 1000)) };
      },
      onDone: () => { flush(); setBusy(false); b.set({ balls: (next || stRef.current).b, ...opts(next) }); setTick((x) => x + 1); potNote(next); flashFor(next, true); },
    });
    setTick((x) => x + 1);
    return true;
  };
  const fireRef = useRef(fire);
  fireRef.current = fire;
  useEffect(() => {
    if (!hostRef.current) return undefined;
    const b = new PoolBoard(hostRef.current, { balls: st.b, ...opts(), spin: spinRef.current, fresh: (st.n || 0) === 0, salt: st.id, onLayout: (L) => setLay(L), onAim: () => { const a = b.aimState(); if (a) sendAim.current({ k: 'aim', ...a }); } });
    board.current = b;
    shown.current = st.n;
    const idle = window.requestIdleCallback || ((f) => setTimeout(f, 300));
    const warm = idle(() => { try { const w = new PoolSim(st.b, { dx: 0, dy: -1000000, p: 500 }); w.run(6); } catch {} });
    if (st.lb && st.lb !== myId && st.ls && !seenShot(`${st.id}:${st.n}`, false)) {
      const prev = prevOf((st.n || 0) - 1);
      if (prev && Array.isArray(prev.b)) {
        setTimeout(() => {
          if (board.current !== b || b.busy() || shown.current !== st.n || seenShot(`${st.id}:${st.n}`, true)) return;
          replay(prev.b, st.ls, () => { const cur = stRef.current; b.set({ balls: cur.b, ...opts() }); setTick((x) => x + 1); potNote(cur); flashFor(cur, false); });
          setTick((x) => x + 1);
        }, 420);
      }
    }
    if (g1Test()) window.__gbpool = { fire: (shot) => { const bb = board.current; if (!bb) return false; bb.aim = [shot.dx / 1e6, shot.dy / 1e6]; if (shot.cx != null) bb.place = [shot.cx, shot.cy, true]; bb.set({ spin: { s: shot.s || 0, e: shot.e || 0 } }); setSpin({ s: shot.s || 0, e: shot.e || 0 }); return fireRef.current(shot.p / 1000); }, stats: () => b.stats(), resetStats: () => b.perf.reset(), busy: () => busy.current || b.busy(), findPot: () => findPot(stRef.current, myId), state: () => stRef.current, board: b };
    return () => { flush(); if (window.cancelIdleCallback && typeof warm === 'number') { try { window.cancelIdleCallback(warm); } catch {} } b.destroy(); board.current = null; if (window.__gbpool && window.__gbpool.board === b) delete window.__gbpool; };
  }, []);
  useEffect(() => { if (board.current) board.current.set({ spin }); }, [spin]);
  useEffect(() => {
    const b = board.current;
    if (!b) return;
    if (shown.current === st.n) { if (!busy.current) b.set(opts()); return; }
    shown.current = st.n;
    if (st.lb === myId) { if (!busy.current && !b.busy()) b.set(opts()); return; }
    const ls0 = liveShot.current;
    if (ls0 && ls0.n === (st.n || 0) - 1) {
      if (ls0.done && !b.busy()) { b.set({ balls: st.b, ...opts() }); potNote(st); flashFor(st, false); }
      setTick((x) => x + 1);
      return;
    }
    const prev = prevOf((st.n || 0) - 1);
    b.setRemote(null);
    if (prev && st.ls && !b.busy()) {
      seenShot(`${st.id}:${st.n}`, true);
      replay(prev.b, st.ls, () => { const cur = stRef.current; b.set({ balls: cur.b, ...opts() }); setTick((x) => x + 1); potNote(cur); flashFor(cur, false); });
    } else if (!b.busy()) b.set({ balls: st.b, ...opts() });
    setTick((x) => x + 1);
  }, [st.n]);
  const myTurn = !st.w && st.t === myId && !busy.current;
  const railBox = (side) => {
    if (!lay) return null;
    const w = Math.max(18, Math.min(30, lay.fx - 5));
    const h = Math.min(lay.fh * (side === 'l' ? 0.56 : 0.4), side === 'l' ? 360 : 250);
    const x = side === 'l' ? (lay.fx - w) / 2 : lay.fx + lay.fw + (lay.W - lay.fx - lay.fw - w) / 2;
    return { x, y: lay.fy + (lay.fh - h) / 2 - 10, w, h };
  };
  return { hostRef, board, busy, spin, setSpin, flash, fire, live, myTurn, myMark, other, railBox };
}

function PoolTableArea({ P, myTurn, flash }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', alignSelf: 'stretch' }}>
      <div ref={P.hostRef} style={{ position: 'absolute', inset: 0 }} />
      <PowerBar box={P.railBox('l')} disabled={!myTurn} onPull={(v) => { if (P.board.current) P.board.current.setPull(v); }} onShoot={(v) => P.fire(v)} />
      <AimWheel box={P.railBox('r')} disabled={!myTurn} onTurn={(a) => { if (P.board.current) P.board.current.rotate(a); }} />
      {flash && (
        <div key={flash.at} style={{ position: 'absolute', left: '50%', top: '44%', transform: 'translate(-50%, -50%)', padding: '10px 18px', borderRadius: 16, background: 'rgba(18,12,8,0.82)', color: '#FFF4E4', fontWeight: 800, fontSize: 15, fontFamily: FONT, boxShadow: '0 10px 30px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,220,170,0.16)', pointerEvents: 'none', whiteSpace: 'nowrap', animation: 'zgbFlash 2.2s ease forwards' }}>{flash.t}</div>
      )}
      <style>{'@keyframes zgbFlash{0%{opacity:0;transform:translate(-50%,-40%) scale(0.96)}10%{opacity:1;transform:translate(-50%,-50%) scale(1)}80%{opacity:1}100%{opacity:0}}'}</style>
    </div>
  );
}

export function PoolPage({ st, prevOf, myId, peerName, onClose }) {
  useGameKit();
  useBackClose(true, onClose);
  const [pick, setPick] = useState(false);
  const [ask, setAsk] = useState(false);
  useBackClose(ask, () => setAsk(false));
  const other = st.x === myId ? st.o : st.x;
  const peer = peerName || g1First(other, 'Them');
  const P = usePoolPlay({ st, prevOf, myId, peer, relay: null, save: g1Send });
  const { myMark, myTurn, live, spin, setSpin } = P;
  const mine = g1PoolLeft(st, myMark) || [];
  const theirs = g1PoolLeft(st, myMark === 'x' ? 'o' : 'x') || [];
  const myG = groupOf(st, myMark);
  const thG = groupOf(st, myMark === 'x' ? 'o' : 'x');
  const out = g1Outcome(st, myId);
  const note = P.busy.current ? '' : st.w ? (out === 'win' ? (st.why === 'resign' ? `${peer} gave up. You won` : 'You potted the black. You won') : st.why === 'resign' ? 'You gave up' : `${peer} won this one`) : myTurn ? (st.bih ? ((st.n || 0) === 0 ? 'Your break. Place the white ball behind the line' : 'Ball in hand. Drag the white ball anywhere') : 'Your shot. Touch the table to aim, pull the power down') : (live.here ? `${peer} is at the table` : `${peer} is up next`);
  return (
    <GameRoom k="pool" title="Pool" scene={<PoolScene />} onClose={onClose}
      top={(
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 10px 6px', padding: '8px 12px', borderRadius: 20, background: 'linear-gradient(180deg, rgba(20,13,8,0.82), rgba(20,13,8,0.62))', boxShadow: 'inset 0 0 0 1px rgba(255,220,170,0.1), 0 6px 18px rgba(0,0,0,0.35)', fontFamily: FONT }}>
          <Seat id={myId} label="You" hot={!st.w && st.t === myId} group={myG} left={mine} />
          <div style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,236,210,0.55)', letterSpacing: '0.08em', flexShrink: 0 }}>VS</div>
          <Seat id={other} label={peer} hot={!st.w && st.t === other} group={thG} left={theirs} here={live.here} end />
        </div>
      )}
      bottom={(
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 12, padding: '0 2px', fontFamily: FONT }}>
          <SpinBall spin={spin} size={42} disabled={!myTurn} onClick={() => { if (myTurn) setPick(true); }} />
          <div style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 700, color: 'rgba(255,240,222,0.85)', lineHeight: 1.3, textAlign: 'center', textWrap: 'balance' }}>{note}</div>
          {st.w ? <RoomButton label="Rematch" gold wide onClick={() => { onClose(); if (g1Mem.host) g1Mem.host.rematch(st); }} /> : <RoomButton label="Give up" onClick={() => setAsk(true)}><FlagGlyph /></RoomButton>}
        </div>
      )}>
      <PoolTableArea P={P} myTurn={myTurn} flash={P.flash} />
      <RoomLayer>
        {pick && <SpinPicker spin={spin} onChange={setSpin} onClose={() => setPick(false)} />}
        {ask && <ConfirmSheet zIndex={60} title="Give up this game" text={`${peer} wins if you give up.`} confirmLabel="Give up" onCancel={() => setAsk(false)} onConfirm={() => { setAsk(false); g1Send({ ...st, n: (st.n || 0) + 1, w: myMark === 'x' ? 'o' : 'x', why: 'resign', ls: null, ev: null, lb: myId }); }} />}
      </RoomLayer>
    </GameRoom>
  );
}

function GroupDots({ group, left, end }) {
  const all = group === 's' ? [1, 2, 3, 4, 5, 6, 7] : group === 't' ? [9, 10, 11, 12, 13, 14, 15] : null;
  if (!all) return <span>Open table</span>;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, flexDirection: end ? 'row-reverse' : 'row' }}>
      {left.length ? all.map((b) => <BallDot key={b} id={b} size={10} faded={!left.includes(b)} />) : <><BallDot id={8} size={11} /><span style={{ margin: end ? '0 5px 0 0' : '0 0 0 5px' }}>On the black</span></>}
    </span>
  );
}

export function PoolTable({ st, prevOf, myId, peerName, relay, onMove, onMeta, onBusy, onFlash }) {
  const [pick, setPick] = useState(false);
  const P = usePoolPlay({ st, prevOf, myId, peer: peerName, relay, save: onMove, onBusy, onFlash });
  const { myMark, myTurn, spin, setSpin } = P;
  const mine = g1PoolLeft(st, myMark) || [];
  const theirs = g1PoolLeft(st, myMark === 'x' ? 'o' : 'x') || [];
  const myG = groupOf(st, myMark);
  const thG = groupOf(st, myMark === 'x' ? 'o' : 'x');
  const brk = (st.n || 0) === 0;
  const status = P.busy.current || st.w ? '' : myTurn ? (st.bih ? (brk ? 'Your break, place the white ball' : 'Ball in hand, place the white ball') : brk ? 'Your break' : 'Your shot') : `${peerName} is shooting`;
  const hint = myTurn ? (st.bih ? 'Drag the white ball, then touch to aim' : 'Touch to aim, pull the power down') : '';
  useEffect(() => {
    onMeta({
      status, hot: myTurn, center: null, ready: true,
      me: <GroupDots group={myG} left={mine} />,
      peer: <GroupDots group={thG} left={theirs} end />,
      bottom: st.w ? null : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <SpinBall spin={spin} size={42} disabled={!myTurn} onClick={() => { if (myTurn) setPick(true); }} />
          {hint ? <div style={{ minWidth: 0, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)', lineHeight: 1.3, maxWidth: 150 }}>{hint}</div> : null}
        </div>
      ),
    });
  }, [status, myTurn, hint, mine.join(','), theirs.join(','), myG, thG, spin.s, spin.e, !!st.w]);
  return (
    <>
      <PoolTableArea P={P} myTurn={myTurn} flash={P.flash} />
      <RoomLayer>{pick && <SpinPicker spin={spin} onChange={setSpin} onClose={() => setPick(false)} />}</RoomLayer>
    </>
  );
}
