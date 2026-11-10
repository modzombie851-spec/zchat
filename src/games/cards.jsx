import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient.js';
import { GameRoom, RoomLayer, defineSfx, sfx, haptic, useGameKit } from './kit.jsx';
import { makeCanvas, fitCanvas, grain, rng, noiseHit, tone, mix, gameCache } from './physics.jsx';
import { useBackClose, Avatar, appSnack, g1Mem, g1First, ga1Name, g1Test, ConfirmSheet, FONT, GameCardShell, GameButton, GameAgainButton, useTheme, countWord, parseGameMessage, rpcMissing, LoadFail } from '../App.jsx';

export const ZAP_COLORS = { r: '#E2405F', y: '#F2B21B', g: '#2FAE66', b: '#2F86E8' };
export const ZAP_NAMES = { r: 'Berry', y: 'Sun', g: 'Leaf', b: 'Sky' };
const INK = { r: '#8E1631', y: '#8A5A00', g: '#0F5E34', b: '#13498D' };

defineSfx('zapFlip', (c, out, o) => { noiseHit(c, out, { freq: 3200, q: 1.2, gain: 0.18, decay: 0.035, pan: o.pan }); noiseHit(c, out, { t0: c.currentTime + 0.012, freq: 1800, q: 1.5, gain: 0.08, decay: 0.03, pan: o.pan }); });
defineSfx('zapSlide', (c, out, o) => { noiseHit(c, out, { freq: 2400, q: 0.5, type: 'bandpass', gain: 0.11, attack: 0.02, decay: 0.11, pan: o.pan }); });
defineSfx('zapDeal', (c, out) => { noiseHit(c, out, { freq: 2800, q: 0.9, gain: 0.09, attack: 0.004, decay: 0.05 }); });
defineSfx('zapShuffle', (c, out) => { const t = c.currentTime; for (let i = 0; i < 14; i++) noiseHit(c, out, { t0: t + i * 0.028 + Math.random() * 0.01, freq: 2600 + Math.random() * 900, q: 1.4, gain: 0.05 + Math.random() * 0.04, decay: 0.02 }); });
defineSfx('zapSkip', (c, out) => { tone(c, out, { freq: 520, to: 260, gain: 0.12, decay: 0.16, type: 'triangle' }); noiseHit(c, out, { freq: 900, q: 1, gain: 0.08, decay: 0.08 }); });
defineSfx('zapReverse', (c, out) => { tone(c, out, { freq: 380, to: 760, gain: 0.08, decay: 0.12, type: 'triangle' }); tone(c, out, { t0: c.currentTime + 0.1, freq: 760, to: 380, gain: 0.08, decay: 0.12, type: 'triangle' }); });
defineSfx('zapPlus', (c, out, o) => { const n = o.n || 2; for (let i = 0; i < n; i++) tone(c, out, { t0: c.currentTime + i * 0.07, freq: 300 + i * 40, gain: 0.07, decay: 0.08, type: 'square' }); });
defineSfx('zapWild', (c, out) => { [392, 494, 587, 784].forEach((f, i) => tone(c, out, { t0: c.currentTime + i * 0.045, freq: f, gain: 0.07, decay: 0.25, type: 'triangle' })); });
defineSfx('zapCall', (c, out) => { [659, 880].forEach((f, i) => tone(c, out, { t0: c.currentTime + i * 0.09, freq: f, gain: 0.12, decay: 0.18, type: 'triangle' })); });
defineSfx('zapCatch', (c, out) => { tone(c, out, { freq: 220, to: 140, gain: 0.16, decay: 0.22, type: 'sawtooth' }); });

export const colOf = (c) => (c && c.length === 2 ? c[0] : null);
export const valOf = (c) => (c && c.length === 2 ? c[1] : c);
const WILDS = ['W', 'F', 'V', 'X', 'T', 'C'];
export const isWild = (c) => !!c && c.length === 1 && WILDS.includes(c);
export function drawVal(c) {
  if (!c) return 0;
  if (c === 'F' || c === 'V') return 4;
  if (c === 'X') return 6;
  if (c === 'T') return 10;
  if (c.length === 2 && c[1] === 'D') return 2;
  if (c.length === 2 && c[1] === 'P') return 4;
  return 0;
}
export const isMayhem = (st) => !!st && st.md === 'mayhem';
export function fits(c, top, col, st) {
  if (!c) return false;
  if (st && isMayhem(st) && (st.pd || 0) > 0) return drawVal(c) > 0 && drawVal(c) >= (st.pv || 0);
  if (isWild(c)) return true;
  return c[0] === col || (!!top && top.length === 2 && c[1] === top[1]);
}
const VAL_NAMES = { S: 'skip', R: 'reverse', D: 'draw two', P: 'draw four', K: 'skip everyone', A: 'discard all' };
const WILD_NAMES = { W: 'Wild', F: 'Wild draw four', V: 'Wild reverse draw four', X: 'Wild draw six', T: 'Wild draw ten', C: 'Colour roulette' };
export function cardName(c) {
  if (!c) return '';
  if (c.length === 1) return WILD_NAMES[c] || 'Wild';
  const v = c[1];
  return `${ZAP_NAMES[c[0]]} ${VAL_NAMES[v] || v}`;
}

function motif(col) {
  const r = rng(`m${col}`);
  if (col === 'r') {
    let s = '';
    for (let i = 0; i < 18; i++) { const x = 8 + r() * 104; const y = 8 + r() * 164; const rr = 2.2 + r() * 2.6; s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rr.toFixed(1)}"/><path d="M${x.toFixed(1)} ${(y - rr).toFixed(1)} l2 -3" stroke-width="1.2" fill="none"/>`; }
    return `<g fill="#FFFFFF" stroke="#FFFFFF" opacity="0.14">${s}</g>`;
  }
  if (col === 'y') {
    let s = '';
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; s += `<path d="M60 90 L${(60 + Math.cos(a) * 140).toFixed(1)} ${(90 + Math.sin(a) * 140).toFixed(1)} L${(60 + Math.cos(a + 0.09) * 140).toFixed(1)} ${(90 + Math.sin(a + 0.09) * 140).toFixed(1)} Z"/>`; }
    return `<g fill="#FFFFFF" opacity="0.13">${s}</g>`;
  }
  if (col === 'g') {
    let s = '';
    for (let i = -4; i < 9; i++) { const y = i * 22; s += `<path d="M-10 ${y + 40} Q40 ${y + 20} 130 ${y - 10}" fill="none" stroke-width="2"/>`; for (let k = 0; k < 6; k++) { const x = 10 + k * 20; const yy = y + 40 - (x + 10) * 0.37; s += `<path d="M${x} ${yy.toFixed(1)} q6 -8 14 -6" fill="none" stroke-width="1.2"/>`; } }
    return `<g stroke="#FFFFFF" opacity="0.14">${s}</g>`;
  }
  let s = '';
  for (let i = 0; i < 9; i++) { const y = 10 + i * 20; s += `<path d="M-10 ${y} q15 -8 30 0 t30 0 t30 0 t30 0 t30 0" fill="none" stroke-width="2.2"/>`; }
  return `<g stroke="#FFFFFF" opacity="0.13">${s}</g>`;
}

function glyphSvg(v, col, big) {
  const ink = INK[col] || '#241B3D';
  const fill = ZAP_COLORS[col] || '#241B3D';
  if (v === 'S') return `<g transform="translate(60 90)"><circle r="${big ? 22 : 9}" fill="none" stroke="${big ? fill : '#FFFFFF'}" stroke-width="${big ? 8 : 3.4}"/><path d="M${big ? -15 : -6} ${big ? 15 : 6} L${big ? 15 : 6} ${big ? -15 : -6}" stroke="${big ? fill : '#FFFFFF'}" stroke-width="${big ? 8 : 3.4}" stroke-linecap="round"/></g>`;
  if (v === 'R') {
    const k = big ? 1 : 0.42;
    const c = big ? fill : '#FFFFFF';
    return `<g transform="translate(60 90) scale(${k})" fill="none" stroke="${c}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"><path d="M-20 -6 A22 22 0 0 1 18 -14"/><path d="M8 -24 L19 -14 L6 -5"/><path d="M20 6 A22 22 0 0 1 -18 14"/><path d="M-8 24 L-19 14 L-6 5"/></g>`;
  }
  if (v === 'K') {
    const c = big ? fill : '#FFFFFF';
    const k = big ? 1 : 0.42;
    return `<g transform="translate(60 90) scale(${k})" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round"><circle r="13" cx="-9" cy="-7"/><path d="M-18 2 L0 -16"/><circle r="13" cx="9" cy="9" opacity="0.6"/><path d="M0 18 L18 0" opacity="0.6"/></g>`;
  }
  if (v === 'A') {
    const c = big ? fill : '#FFFFFF';
    const k = big ? 1 : 0.42;
    return `<g transform="translate(60 90) scale(${k})"><rect x="-17" y="-22" width="22" height="32" rx="4" fill="${c}" opacity="0.4" transform="rotate(-14)"/><rect x="-11" y="-18" width="22" height="32" rx="4" fill="${c}" opacity="0.7"/><rect x="-4" y="-14" width="22" height="32" rx="4" fill="${c}" transform="rotate(12)"/><path d="M-20 22 L22 22" stroke="${c}" stroke-width="6" stroke-linecap="round"/></g>`;
  }
  if (v === 'C') {
    const k = big ? 1 : 0.42;
    return `<g transform="translate(60 90) scale(${k})"><g transform="translate(-60 -90)">${quarters(24)}</g><circle r="24" fill="none" stroke="#FFFFFF" stroke-width="3"/><circle r="6" fill="#FFFFFF"/><path d="M0 -36 L-7 -24 L7 -24 Z" fill="#FFFFFF"/></g>`;
  }
  if (v === 'D' || v === 'F' || v === 'P' || v === 'V' || v === 'X' || v === 'T') {
    const n = v === 'D' ? '+2' : v === 'X' ? '+6' : v === 'T' ? '+10' : '+4';
    const colored = v === 'D' || v === 'P';
    if (!big) return `<text x="60" y="95" text-anchor="middle" font-family="-apple-system, 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="${n.length > 2 ? 12 : 15}" fill="#FFFFFF">${n}</text>`;
    const c = colored ? fill : '#241B3D';
    const cards = colored ? `<rect x="-17" y="-24" width="20" height="30" rx="4" fill="${c}" opacity="0.35" transform="rotate(-12)"/><rect x="-6" y="-20" width="20" height="30" rx="4" fill="${c}" opacity="0.6" transform="rotate(8)"/>` : '';
    const arrows = v === 'V' ? '<g transform="scale(0.62) translate(0 -2)" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"><path d="M-30 -16 A34 34 0 0 1 26 -22"/><path d="M14 -34 L27 -22 L12 -12"/><path d="M30 16 A34 34 0 0 1 -26 22"/><path d="M-14 34 L-27 22 L-12 12"/></g>' : '';
    return `<g transform="translate(60 90)">${cards}${arrows}<text x="0" y="${colored ? 16 : 12}" text-anchor="middle" font-family="-apple-system, 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="${colored ? 30 : n.length > 2 ? 23 : 26}" fill="${colored ? ink : '#FFFFFF'}" stroke="${colored ? '#FFFFFF' : '#241B3D'}" stroke-width="${colored ? 0 : 1.5}" paint-order="stroke">${n}</text></g>`;
  }
  if (v === 'W') return '';
  return `<text x="60" y="${big ? 108 : 95}" text-anchor="middle" font-family="-apple-system, 'SF Pro Rounded', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="${big ? 52 : 15}" fill="${big ? ink : '#FFFFFF'}" ${big && (v === '6' || v === '9') ? 'text-decoration="underline"' : ''}>${v}</text>`;
}

function quarters(r) {
  const p = (a0, a1, c) => { const x0 = 60 + Math.cos(a0) * r; const y0 = 90 + Math.sin(a0) * r; const x1 = 60 + Math.cos(a1) * r; const y1 = 90 + Math.sin(a1) * r; return `<path d="M60 90 L${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z" fill="${c}"/>`; };
  return p(-Math.PI, -Math.PI / 2, ZAP_COLORS.r) + p(-Math.PI / 2, 0, ZAP_COLORS.y) + p(0, Math.PI / 2, ZAP_COLORS.g) + p(Math.PI / 2, Math.PI, ZAP_COLORS.b);
}

function faceSvg(code) {
  const wild = code.length === 1;
  const col = wild ? null : code[0];
  const v = wild ? code : code[1];
  const base = wild ? (v === 'X' || v === 'T' ? '#2B0F24' : v === 'C' ? '#14213D' : '#241B3D') : ZAP_COLORS[col];
  const corner = (inner) => `<g transform="translate(-41 -64) scale(0.9)">${inner}</g>`;
  const cornerInner = wild ? (v !== 'W' && v !== 'C' ? glyphSvg(v, null, false) : v === 'C' ? glyphSvg('C', null, false) : `<g transform="translate(60 90) scale(0.2) translate(-60 -90)">${quarters(30)}</g>`) : glyphSvg(v, col, false);
  const center = wild
    ? (v === 'C' ? `<circle cx="60" cy="90" r="40" fill="#FFFFFF"/><circle cx="60" cy="90" r="34" fill="${base}"/>${glyphSvg('C', null, true)}` : `<circle cx="60" cy="90" r="40" fill="#FFFFFF"/><circle cx="60" cy="90" r="34" fill="#241B3D"/>${quarters(30)}<circle cx="60" cy="90" r="30" fill="none" stroke="#FFFFFF" stroke-width="2.5"/>${v !== 'W' ? glyphSvg(v, null, true) : ''}`)
    : `<circle cx="60" cy="90" r="40" fill="#FFFFFF"/><circle cx="60" cy="90" r="36" fill="none" stroke="${mix(base, '#FFFFFF', 0.55)}" stroke-width="1.5"/>${glyphSvg(v, col, true)}`;
  const pat = wild ? `<g opacity="0.12" stroke="#FFFFFF" fill="none">${[0, 1, 2, 3, 4, 5].map((i) => `<circle cx="60" cy="90" r="${48 + i * 14}" stroke-width="1.6"/>`).join('')}</g>` : motif(col);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 180" width="240" height="360"><defs><linearGradient id="s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.22"/><stop offset="0.5" stop-color="#FFFFFF" stop-opacity="0"/><stop offset="1" stop-color="#000000" stop-opacity="0.18"/></linearGradient><clipPath id="c"><rect x="0" y="0" width="120" height="180" rx="12"/></clipPath></defs><rect x="0" y="0" width="120" height="180" rx="12" fill="#FFFFFF"/><rect x="5" y="5" width="110" height="170" rx="9" fill="${base}"/><g clip-path="url(#c)">${pat}</g>${center}${corner(cornerInner)}<g transform="rotate(180 60 90)">${corner(cornerInner)}</g><rect x="0" y="0" width="120" height="180" rx="12" fill="url(#s)"/><rect x="0.5" y="0.5" width="119" height="179" rx="11.5" fill="none" stroke="#000000" stroke-opacity="0.2"/></svg>`;
}

function backSvg() {
  let lat = '';
  for (let i = -12; i < 20; i++) lat += `<path d="M${i * 12} 0 L${i * 12 + 180} 180 M${i * 12 + 180} 0 L${i * 12} 180" />`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 180" width="240" height="360"><defs><clipPath id="k"><rect x="9" y="9" width="102" height="162" rx="7"/></clipPath><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3B2B7A"/><stop offset="1" stop-color="#1E1546"/></linearGradient></defs><rect width="120" height="180" rx="12" fill="#F4EDDD"/><rect x="5" y="5" width="110" height="170" rx="9" fill="url(#g)"/><g clip-path="url(#k)" stroke="#E9D9A8" stroke-opacity="0.22" stroke-width="1.1">${lat}</g><rect x="9" y="9" width="102" height="162" rx="7" fill="none" stroke="#E9D9A8" stroke-opacity="0.7" stroke-width="1.2"/><ellipse cx="60" cy="90" rx="34" ry="46" fill="#1E1546" stroke="#E9D9A8" stroke-width="2"/><ellipse cx="60" cy="90" rx="29" ry="41" fill="none" stroke="#E9D9A8" stroke-opacity="0.5" stroke-width="1"/><path d="M66 58 L48 94 H60 L54 122 L74 84 H62 Z" fill="#E9D9A8"/><text x="60" y="160" text-anchor="middle" font-family="-apple-system, 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="11" letter-spacing="3" fill="#E9D9A8" opacity="0.85">ZAP</text></svg>`;
}

const URLS = new Map();
export function cardUrl(code) {
  const k = code || 'back';
  if (URLS.has(k)) return URLS.get(k);
  const svg = code ? faceSvg(code) : backSvg();
  const u = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  URLS.set(k, u);
  return u;
}

export function ZapCardFace({ code, w = 60, style, lift, dim, onClick, label, back }) {
  const h = Math.round(w * 1.5);
  return (
    <div role={onClick ? 'button' : undefined} aria-label={label || (back ? 'A card' : cardName(code))} onClick={onClick}
      style={{ width: w, height: h, borderRadius: w * 0.1, flexShrink: 0, position: 'relative', cursor: onClick ? 'pointer' : 'default', transform: lift ? 'translateY(-12px)' : 'none', filter: dim ? 'brightness(0.62) saturate(0.7)' : 'none', boxShadow: lift ? '0 12px 22px rgba(0,0,0,0.45)' : '0 3px 8px rgba(0,0,0,0.35)', transition: 'transform 160ms ease, filter 160ms ease, box-shadow 160ms ease', ...(style || {}) }}>
      <img src={cardUrl(back ? null : code)} alt="" draggable={false} style={{ width: '100%', height: '100%', display: 'block', borderRadius: w * 0.1, pointerEvents: 'none' }} />
    </div>
  );
}

const SCENE = gameCache();
export function ZapScene() {
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
        const room = g.createLinearGradient(0, 0, 0, H);
        room.addColorStop(0, '#16121C');
        room.addColorStop(1, '#0B090F');
        g.fillStyle = room;
        g.fillRect(0, 0, W, H);
        const cx = W / 2; const cy = H * 0.5; const rx = W * 0.62; const ry = H * 0.47;
        g.save();
        g.shadowColor = 'rgba(0,0,0,0.75)';
        g.shadowBlur = 30;
        g.shadowOffsetY = 14;
        g.fillStyle = '#3A2214';
        g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); g.fill();
        g.restore();
        const rim = g.createRadialGradient(cx, cy - ry * 0.3, rx * 0.2, cx, cy, rx);
        rim.addColorStop(0, '#5C3520');
        rim.addColorStop(0.85, '#3A2214');
        rim.addColorStop(1, '#22130A');
        g.fillStyle = rim;
        g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); g.fill();
        g.strokeStyle = 'rgba(255,210,160,0.18)';
        g.lineWidth = 1.2;
        g.beginPath(); g.ellipse(cx, cy, rx - 3, ry - 3, 0, 0, Math.PI * 2); g.stroke();
        const fx = rx - 22; const fy = ry - 22;
        const felt = g.createRadialGradient(cx, cy - fy * 0.2, 10, cx, cy, Math.max(fx, fy));
        felt.addColorStop(0, '#1F6B5E');
        felt.addColorStop(0.6, '#155246');
        felt.addColorStop(1, '#0C352D');
        g.fillStyle = felt;
        g.beginPath(); g.ellipse(cx, cy, fx, fy, 0, 0, Math.PI * 2); g.fill();
        g.save();
        g.beginPath(); g.ellipse(cx, cy, fx, fy, 0, 0, Math.PI * 2); g.clip();
        const n = grain(140, 140, 'zfelt', { amp: 34 });
        const pat = g.createPattern(n, 'repeat');
        g.globalAlpha = 0.14;
        g.globalCompositeOperation = 'overlay';
        g.fillStyle = pat;
        g.fillRect(0, 0, W, H);
        g.globalCompositeOperation = 'source-over';
        g.globalAlpha = 1;
        g.strokeStyle = 'rgba(233,217,168,0.16)';
        g.lineWidth = 1.5;
        g.setLineDash([2, 6]);
        g.beginPath(); g.ellipse(cx, cy, fx - 16, fy - 16, 0, 0, Math.PI * 2); g.stroke();
        g.setLineDash([]);
        g.restore();
        g.strokeStyle = 'rgba(0,0,0,0.5)';
        g.lineWidth = 3;
        g.beginPath(); g.ellipse(cx, cy, fx, fy, 0, 0, Math.PI * 2); g.stroke();
        const lamp = g.createRadialGradient(cx, cy * 0.92, 20, cx, cy, Math.max(W, H) * 0.7);
        lamp.addColorStop(0, 'rgba(255,226,170,0.14)');
        lamp.addColorStop(1, 'rgba(0,0,0,0.5)');
        g.fillStyle = lamp;
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

const RPC = { join: 'zchat_zap_join', start: 'zchat_zap_start', hand: 'zchat_zap_hand', play: 'zchat_zap_play', draw: 'zchat_zap_draw', pass: 'zchat_zap_pass', call: 'zchat_zap_call', catch: 'zchat_zap_catch', nudge: 'zchat_zap_nudge', end: 'zchat_zap_end' };
const MAYHEM_RPC = { play: 'zchat_zapm_play', draw: 'zchat_zapm_draw', pass: 'zchat_zapm_pass', catch: 'zchat_zapm_catch', nudge: 'zchat_zapm_nudge' };
const busyKeys = new Set();
function ctxOf() { return g1Mem.host && g1Mem.host.ctx ? g1Mem.host.ctx() : null; }
function msgIdOf(st) {
  const c = ctxOf();
  if (!c || !c.messages) return null;
  for (let i = c.messages.length - 1; i >= 0; i--) {
    const m = c.messages[i];
    if (m && typeof m.content === 'string' && m.content.indexOf(st.id) >= 0) { const p = parseGameMessage(m.content); if (p && p.id === st.id) return String(m.id).startsWith('temp-') ? null : m.id; }
  }
  return null;
}
export async function zapAct(st, a, args) {
  const mid = msgIdOf(st);
  if (!mid) { appSnack('One moment, the game is still being set up'); return null; }
  const key = `${st.id}:${a}`;
  if (busyKeys.has(key)) return null;
  busyKeys.add(key);
  let res = null;
  const fn = isMayhem(st) && MAYHEM_RPC[a] ? MAYHEM_RPC[a] : RPC[a];
  try { res = await supabase.rpc(fn, { p_msg: mid, ...(args || {}) }); } catch (e) { res = { error: e }; }
  busyKeys.delete(key);
  const data = res && res.data;
  if (!res || res.error || !data || data.ok === false) {
    const why = data && data.why;
    if (res && res.error && rpcMissing(res.error)) { appSnack('Zap switches on once the latest ZChat setup is finished.'); return a === 'hand' ? { failed: true } : null; }
    if (a === 'hand') return { failed: true };
    appSnack(why === 'turn' ? 'It is not your turn yet' : why === 'fit' ? 'That card does not fit' : why === 'full' ? 'This table is full' : why === 'late' ? 'Too late, someone already played' : why === 'wait' ? 'Give them a minute first' : why === 'started' ? 'This game already started' : why === 'drawn' ? 'You can only play the card you just drew' : 'That did not go through. Try again.');
    return null;
  }
  const c = ctxOf();
  if (data.content && c && c.patchMessage) c.patchMessage(mid, data.content);
  const nx = data.content ? parseGameMessage(data.content) : null;
  if (nx && c && c.me && c.notify && ['play', 'draw', 'pass', 'join', 'start', 'nudge', 'catch'].includes(a)) {
    const url = c.group ? `/?group=${c.group.id}` : `/?dm=${c.myId}`;
    const title = c.group ? `${c.me.name} in ${c.group.name}` : c.me.name;
    if (nx.st === 'play' && nx.t && nx.t !== c.myId && nx.t !== st.t) c.notify(nx.t, title, 'Your turn in Zap', url, c.me.avatar);
    if ((a === 'start' || a === 'join') && nx.st === 'play' && st.st === 'lobby') (nx.p || []).filter((u) => u !== c.myId && u !== nx.t).forEach((u) => c.notify(u, title, 'Zap started', url, c.me.avatar));
  }
  return data;
}

export function ZapCard({ state, myId, live }) {
  const { theme } = useTheme();
  const st = state;
  const [joining, setJoining] = useState(false);
  const players = joining && !(st.p || []).includes(myId) && st.st === 'lobby' ? (st.p || []).concat([myId]) : (st.p || []);
  const me = players.indexOf(myId);
  const done = st.st === 'done';
  const resKey = `${st.id}:${st.n}`;
  useEffect(() => { if (live && done && !resultSeen.has(resKey)) { resultSeen.add(resKey); sfx(st.w === myId ? 'win' : 'lose'); } }, [done, resKey]);
  const status = st.st === 'lobby' ? `${countWord(players.length, 'player', 'players')} in` : st.st === 'play' ? (st.t === myId ? 'Your turn' : `${g1First(st.t)} to play`) : st.ended ? 'Game ended' : !st.w ? 'Game over' : st.w === myId ? 'You won' : `${g1First(st.w)} won`;
  const act = async (a) => { if (a === 'join') { setJoining(true); haptic(8); } const r = await zapAct(st, a); if (a === 'join' && !r) setJoining(false); if (r && a !== 'join') sfx('zapShuffle'); };
  return (
    <GameCardShell k="zap" width={248} live={live} title={isMayhem(st) ? 'Zap Mayhem' : 'Zap'} status={status} hot={live && ((st.st === 'play' && st.t === myId) || (st.st === 'lobby' && me < 0))}>
      {st.st === 'play' && st.top && (
        <div role="button" aria-label="Open the table" onClick={() => g1Mem.host && g1Mem.host.open(st.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '10px 0', marginBottom: 8, borderRadius: 14, cursor: 'pointer', background: 'radial-gradient(120% 120% at 50% 30%, #1F6B5E, #0C352D)' }}>
          <div style={{ position: 'relative', width: 44, height: 66 }}>{[2, 1, 0].map((k) => <ZapCardFace key={k} back w={44} style={{ position: 'absolute', left: k * 2, top: -k * 2, boxShadow: '0 2px 4px rgba(0,0,0,0.4)' }} />)}</div>
          <div style={{ borderRadius: 8, boxShadow: `0 0 0 3px ${ZAP_COLORS[st.col] || '#FFFFFF'}` }}><ZapCardFace code={st.top} w={50} /></div>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {players.map((u, i) => (
          <div key={u} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar emoji={(g1Mem.names[u] || {}).avatar} name={ga1Name(u)} size={24} />
            <div style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: st.t === u && st.st === 'play' ? 800 : 600, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u === myId ? 'You' : ga1Name(u)}</div>
            {st.st === 'play' && <div style={{ fontSize: 11.5, color: (st.cnt || [])[i] === 1 ? '#EF4444' : theme.muted, fontWeight: 800 }}>{(st.cnt || [])[i] === 1 ? 'Last card' : countWord((st.cnt || [])[i] || 0, 'card', 'cards')}</div>}
            {done && (st.sc || [])[i] > 0 && <div style={{ fontSize: 12, fontWeight: 900, color: theme.ink }}>{st.sc[i]}</div>}
          </div>
        ))}
      </div>
      {st.st === 'lobby' && <div style={{ marginTop: 8, fontSize: 11.5, color: theme.muted, textAlign: 'center' }}>{isMayhem(st) ? `Mayhem rules. Stack draw cards, out at 25. Up to ${st.mx} players.` : `Seven cards each. Up to ${st.mx} players.`}</div>}
      {live && st.st === 'lobby' && me < 0 && players.length < st.mx && <GameButton full small color="green" label="Join" onClick={() => act('join')} style={{ marginTop: 10 }} />}
      {live && st.st === 'lobby' && me === 0 && st.mx > 2 && <GameButton full small color="green" label={players.length < 2 ? 'Waiting for players' : 'Deal the cards'} disabled={players.length < 2} onClick={() => act('start')} style={{ marginTop: 10 }} />}
      {live && st.st === 'lobby' && me === 0 && st.mx === 2 && <div style={{ marginTop: 8, fontSize: 11.5, color: theme.muted, textAlign: 'center' }}>{(() => { const c = ctxOf(); const f = c && c.peer && !c.group ? String(c.peer.name || '').split(' ')[0] : ''; return f ? `The cards are dealt when ${f} joins` : 'The cards are dealt when your friend joins'; })()}</div>}
      {live && st.st === 'lobby' && me > 0 && st.mx > 2 && <div style={{ marginTop: 8, fontSize: 11.5, color: theme.muted, textAlign: 'center' }}>Waiting for {g1First(players[0])} to deal</div>}
      {live && st.st === 'play' && me >= 0 && <GameButton full small color={st.t === myId ? 'green' : 'white'} label={st.t === myId ? 'Your turn, open the table' : 'Open the table'} onClick={() => { sfx('tap'); if (g1Mem.host) g1Mem.host.open(st.id); }} style={{ marginTop: 10 }} />}
      {live && done && me >= 0 && <GameAgainButton onClick={() => g1Mem.host && g1Mem.host.rematch(st)} />}
    </GameCardShell>
  );
}
const resultSeen = new Set();

function useRect(ref, deps) {
  const [r, setR] = useState(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const f = () => setR({ width: el.clientWidth, height: el.clientHeight });
    f();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(f) : null;
    if (ro) ro.observe(el);
    return () => { if (ro) ro.disconnect(); };
  }, deps || []);
  return r;
}

function Flights({ list, onDone }) {
  const host = useRef(null);
  useLayoutEffect(() => {
    const el = host.current;
    if (!el) return;
    list.forEach((f) => {
      if (f.started) return;
      f.started = true;
      const node = el.querySelector(`[data-fid="${f.id}"]`);
      if (!node) return;
      const inner = node.firstChild;
      const a = node.animate([
        { transform: `translate(${f.from.x}px, ${f.from.y}px) rotate(${f.from.r || 0}deg) scale(${f.from.s || 1})` },
        { transform: `translate(${(f.from.x + f.to.x) / 2}px, ${Math.min(f.from.y, f.to.y) - (f.arc || 30)}px) rotate(${((f.from.r || 0) + (f.to.r || 0)) / 2 + (f.spin || 0)}deg) scale(${((f.from.s || 1) + (f.to.s || 1)) / 2 * 1.06})`, offset: 0.5 },
        { transform: `translate(${f.to.x}px, ${f.to.y}px) rotate(${f.to.r || 0}deg) scale(${f.to.s || 1})` },
      ], { duration: f.dur, delay: f.delay || 0, easing: 'cubic-bezier(.3,.7,.25,1)', fill: 'both' });
      if (f.flip && inner) inner.animate([{ transform: 'rotateY(180deg)' }, { transform: 'rotateY(180deg)', offset: 0.35 }, { transform: 'rotateY(0deg)' }], { duration: f.dur, delay: f.delay || 0, easing: 'ease-out', fill: 'both' });
      if (f.sound) setTimeout(() => sfx(f.sound, { pan: f.pan }), (f.delay || 0) + 10);
      a.onfinish = () => onDone(f.id);
      a.oncancel = () => onDone(f.id);
    });
  });
  return (
    <div ref={host} aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 20, perspective: 900 }}>
      {list.map((f) => (
        <div key={f.id} data-fid={f.id} style={{ position: 'absolute', left: 0, top: 0, width: f.w, height: f.w * 1.5, marginLeft: -f.w / 2, marginTop: -f.w * 0.75, transform: `translate(${f.from.x}px, ${f.from.y}px)`, willChange: 'transform' }}>
          <div style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d' }}>
            <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden' }}><ZapCardFace code={f.code} back={!f.code} w={f.w} /></div>
            {f.flip && <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}><ZapCardFace back w={f.w} /></div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function ColorPicker({ onPick, onClose }) {
  useBackClose(true, onClose);
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(5,4,8,0.62)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 300, borderRadius: 26, padding: '20px 18px 18px', background: 'linear-gradient(180deg, #221A30, #15111C)', boxShadow: '0 20px 50px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: '#FFF', textAlign: 'center' }}>Pick a colour</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
          {['r', 'y', 'g', 'b'].map((c) => (
            <button key={c} type="button" onClick={() => onPick(c)} style={{ height: 92, borderRadius: 18, border: 'none', cursor: 'pointer', position: 'relative', overflow: 'hidden', background: ZAP_COLORS[c], boxShadow: `0 4px 0 ${INK[c]}, 0 8px 16px rgba(0,0,0,0.35)`, color: '#FFFFFF', fontFamily: FONT, fontWeight: 900, fontSize: 17 }}>
              <span style={{ position: 'absolute', inset: 0, opacity: 0.5, backgroundImage: `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 180' preserveAspectRatio='xMidYMid slice'>${motif(c)}</svg>`)}")`, backgroundSize: 'cover' }} />
              <span style={{ position: 'relative', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{ZAP_NAMES[c]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Seat({ u, i, st, myId, here, onCatch, seatRef, badge }) {
  const n = g1Mem.names[u] || {};
  const out = Array.isArray(st.out) && st.out.includes(i);
  const cnt = out ? 0 : (st.cnt || [])[i] || 0;
  const hot = st.st === 'play' && st.t === u;
  const catchable = st.open === i && u !== myId;
  return (
    <div ref={seatRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 0, flex: 1, position: 'relative' }}>
      <div style={{ position: 'relative', borderRadius: '50%', padding: 2.5, background: hot ? 'linear-gradient(140deg, #F6D27A, #C9952F)' : 'rgba(255,255,255,0.14)', transition: 'background 220ms ease' }}>
        <Avatar emoji={n.avatar} name={n.name || ga1Name(u)} size={40} />
        {here && <span style={{ position: 'absolute', right: 1, bottom: 1, width: 10, height: 10, borderRadius: 5, background: '#3DDC84', boxShadow: '0 0 0 2px #16121C' }} />}
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 800, color: out ? 'rgba(255,255,255,0.5)' : '#FFF', maxWidth: 96, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{out ? `${g1First(u)}, out` : g1First(u)}</div>
      <div style={{ display: 'flex', alignItems: 'center', height: 26 }}>
        {Array.from({ length: Math.min(cnt, 9) }).map((_, k) => <ZapCardFace key={k} back w={16} style={{ marginLeft: k ? -9 : 0, transform: `rotate(${(k - Math.min(cnt, 9) / 2) * 5}deg)`, boxShadow: '0 1px 2px rgba(0,0,0,0.5)' }} />)}
        <span style={{ marginLeft: 6, fontSize: 12, fontWeight: 900, color: cnt === 1 ? '#FF6B6B' : 'rgba(255,255,255,0.75)' }}>{cnt}</span>
      </div>
      {cnt === 1 && st.st === 'play' && !catchable && <span style={{ position: 'absolute', top: -6, padding: '2px 7px', borderRadius: 999, background: '#E2405F', color: '#FFF', fontSize: 10.5, fontWeight: 900, boxShadow: '0 2px 6px rgba(0,0,0,0.4)' }}>Last card</span>}
      {catchable && <button type="button" onClick={onCatch} style={{ position: 'absolute', top: -8, height: 26, padding: '0 10px', borderRadius: 13, border: 'none', cursor: 'pointer', background: '#F2B21B', color: '#2A1A00', fontWeight: 900, fontSize: 11.5, fontFamily: FONT, boxShadow: '0 3px 0 #8A5A00, 0 4px 10px rgba(0,0,0,0.4)', pointerEvents: 'auto' }}>Catch</button>}
      {badge && <span key={badge.at} style={{ position: 'absolute', top: 12, padding: '4px 9px', borderRadius: 999, background: 'rgba(10,8,14,0.85)', color: '#FFF', fontSize: 11.5, fontWeight: 900, animation: 'zgbPop 1.6s ease forwards', whiteSpace: 'nowrap' }}>{badge.t}</span>}
    </div>
  );
}

function zapTurnLine(st, me, hand, long) {
  if (st.dr === me) return 'Play the card you drew, or pass';
  const pd = isMayhem(st) ? st.pd || 0 : 0;
  const any = !!(hand && hand.some((c) => fits(c, st.top, st.col, st)));
  if (pd > 0) return any ? `Stack a draw card or take ${pd}` : `Tap the deck to take ${pd}`;
  if (hand && !any) return isMayhem(st) ? (long ? 'Nothing fits. Tap the deck to draw until one does' : 'Nothing fits, draw until one does') : (long ? 'Nothing fits. Tap the deck to draw' : 'Nothing fits, tap the deck');
  return long ? 'Your turn. Tap a card that matches' : 'Your turn';
}

function WhoPicker({ st, myId, onPick, onClose }) {
  useBackClose(true, onClose);
  const outs = Array.isArray(st.out) ? st.out : [];
  const list = (st.p || []).map((u, i) => [u, i]).filter(([u, i]) => u !== myId && !outs.includes(i));
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(5,4,8,0.62)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 300, borderRadius: 26, padding: '20px 18px 18px', background: 'linear-gradient(180deg, #221A30, #15111C)', boxShadow: '0 20px 50px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: '#FFF', textAlign: 'center' }}>Swap hands with</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
          {list.map(([u, i]) => (
            <button key={u} type="button" onClick={() => onPick(i)} style={{ display: 'flex', alignItems: 'center', gap: 10, height: 56, padding: '0 12px', borderRadius: 16, border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.08)', color: '#FFF', fontFamily: FONT, fontWeight: 800, fontSize: 15 }}>
              <Avatar emoji={(g1Mem.names[u] || {}).avatar} name={ga1Name(u)} size={36} />
              <span style={{ flex: 1, textAlign: 'left', minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g1First(u)}</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{countWord((st.cnt || [])[i] || 0, 'card', 'cards')}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function sortHand(h) {
  const order = { r: 0, y: 1, g: 2, b: 3 };
  const v = (c) => (c.length === 1 ? 200 + 'WCFVXT'.indexOf(c) : order[c[0]] * 30 + ('0123456789SRDPKA'.indexOf(c[1])));
  return h.slice().sort((a, b) => v(a) - v(b));
}

function useZapPlay({ st, myId, relay, intent }) {
  const rootRef = useRef(null);
  const pileRef = useRef(null);
  const deckRef = useRef(null);
  const handRef = useRef(null);
  const seatRefs = useRef({});
  const stRef = useRef(st);
  stRef.current = st;
  const relayRef = useRef(relay);
  relayRef.current = relay;
  const [hand, setHand] = useState(null);
  const handRefVal = useRef(null);
  handRefVal.current = hand;
  const [drawn, setDrawn] = useState(null);
  const [pickFor, setPickFor] = useState(null);
  const [whoFor, setWhoFor] = useState(null);
  const [called, setCalled] = useState(false);
  const [flights, setFlights] = useState([]);
  const [hidden, setHidden] = useState(() => new Set());
  const [shownTop, setShownTop] = useState(st.top || null);
  const [badges, setBadges] = useState({});
  const [pend, setPend] = useState(false);
  const [spin, setSpin] = useState(0);
  const [dealing, setDealing] = useState(false);
  const [joining, setJoining] = useState(false);
  const seen = useRef(st.n);
  const fid = useRef(0);
  const players = st.p || [];
  const me = players.indexOf(myId);
  const others = players.map((u, i) => [u, i]).filter(([u]) => u !== myId);
  const myTurn = st.st === 'play' && st.t === myId && !pend;
  const rootRect = useRect(rootRef);
  const W = rootRect ? rootRect.width : 390;
  const [handErr, setHandErr] = useState(false);
  const act = async (a, args) => {
    const r = await zapAct(stRef.current, a, args);
    const rl = relayRef.current;
    if (r && r.content && rl && rl.send) { const nx = parseGameMessage(r.content); if (nx && nx.id === stRef.current.id) rl.send('zx', { id: nx.id, n: nx.n, content: r.content }); }
    return r;
  };
  const relayOn = relay && relay.on;
  useEffect(() => {
    if (!relayOn) return undefined;
    return relayOn('zx', (d) => {
      const cur = stRef.current;
      if (!d || d.id !== cur.id || typeof d.content !== 'string' || (d.n || 0) <= (cur.n || 0)) return;
      const nx = parseGameMessage(d.content);
      if (!nx || nx.g !== 'zap' || nx.id !== cur.id || (nx.n || 0) !== d.n || !Array.isArray(nx.p)) return;
      if (cur.st !== 'lobby' && (nx.p.length !== players.length || nx.p.some((u, i) => u !== (cur.p || [])[i]))) return;
      const c = ctxOf();
      const mid = msgIdOf(cur);
      if (c && mid && c.patchMessage) c.patchMessage(mid, d.content);
    });
  }, [relayOn]);
  const loadHand = async () => {
    if (stRef.current.p.indexOf(myId) < 0) return;
    setHandErr(false);
    const r = await zapAct(stRef.current, 'hand');
    if (r && Array.isArray(r.hand)) { setHand(sortHand(r.hand)); setDrawn(r.drawn || null); } else if (!handRefVal.current) setHandErr(true);
  };
  useEffect(() => { loadHand(); }, [st.id]);
  useEffect(() => {
    if (me < 0 || !hand || st.st !== 'play') return;
    const c = (st.cnt || [])[me];
    if (c != null && c !== hand.length) loadHand();
  }, [st.n]);
  const center = (el) => {
    const rr = rootRef.current ? rootRef.current.getBoundingClientRect() : { left: 0, top: 0 };
    if (!el) return { x: W / 2, y: 300 };
    const b = el.getBoundingClientRect();
    return { x: b.left - rr.left + b.width / 2, y: b.top - rr.top + b.height / 2 };
  };
  const fly = (f) => { fid.current += 1; const id = fid.current; setFlights((l) => l.concat([{ ...f, id }])); return id; };
  const landed = (id) => setFlights((l) => { const f = l.find((x) => x.id === id); if (f && f.land) f.land(); return l.filter((x) => x.id !== id); });
  const badge = (i, t) => setBadges((b) => ({ ...b, [i]: { t, at: Date.now() } }));
  const seatPos = (i) => (players[i] === myId ? center(handRef.current) : center(seatRefs.current[i]));
  const dealt = () => {
    sfx('zapShuffle');
    const deckP = center(deckRef.current);
    let k = 0;
    for (let r = 0; r < 7; r++) players.forEach((u, i) => { const to = seatPos(i); fly({ code: null, w: 46, from: { ...deckP, r: 0 }, to: { ...to, r: (i - 1) * 8, s: u === myId ? 1 : 0.5 }, dur: 420, delay: k * 55, arc: 20, sound: k % 2 ? 'zapDeal' : null }); k += 1; });
    setShownTop(null);
    setDealing(true);
    setTimeout(() => { setShownTop(stRef.current.top); sfx('zapFlip'); setDealing(false); }, k * 55 + 420);
  };
  useEffect(() => {
    if (st.st !== 'play' || !st.lt || st.lt.a !== 'deal' || !rootRect) return;
    const key = `zchat-gb-zap-dealt-${st.id}`;
    try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, '1'); } catch {}
    const t = setTimeout(dealt, 260);
    return () => clearTimeout(t);
  }, [!!rootRect]);
  useEffect(() => {
    if (seen.current === st.n) return;
    const prevN = seen.current;
    seen.current = st.n;
    const lt = st.lt || {};
    if (st.st === 'play' && lt.a === 'deal' && prevN != null) {
      try { sessionStorage.setItem(`zchat-gb-zap-dealt-${st.id}`, '1'); } catch {}
      sfx('zapShuffle');
      const deckP = center(deckRef.current);
      let k = 0;
      for (let r = 0; r < 7; r++) players.forEach((u, i) => { const to = seatPos(i); fly({ code: null, w: 46, from: { ...deckP, r: 0 }, to: { ...to, r: (i - 1) * 8, s: u === myId ? 1 : 0.5 }, dur: 420, delay: k * 55, arc: 20, sound: k % 2 ? 'zapDeal' : null }); k += 1; });
      setShownTop(null);
      setTimeout(() => { setShownTop(st.top); sfx('zapFlip'); }, k * 55 + 420);
      setTimeout(loadHand, 150);
      return;
    }
    if (lt.a === 'play' && lt.p != null && lt.p !== me) {
      const from = seatPos(lt.p);
      const to = center(pileRef.current);
      fly({ code: lt.c, w: 64, from: { ...from, r: -20, s: 0.55 }, to: { ...to, r: ((st.n * 37) % 16) - 8 }, flip: true, dur: 460, sound: 'zapFlip', land: () => setShownTop(st.top) });
    } else if (lt.a === 'play' && lt.p === me) {
      setShownTop(st.top);
    }
    const mh = isMayhem(st);
    if (mh && Array.isArray(lt.out) && lt.out.length) setTimeout(() => { sfx('zapCatch'); lt.out.forEach((i) => badge(i, i === me ? 'You are out' : 'Out at 25 cards')); }, 700);
    if (mh && (lt.sw != null || lt.ps)) { setTimeout(loadHand, 260); setTimeout(() => { sfx('zapReverse'); if (lt.ps) players.forEach((u, i) => { if (!(st.out || []).includes(i)) badge(i, 'Hands passed'); }); else { badge(lt.p, 'Swapped hands'); badge(lt.sw, 'Swapped hands'); } }, 420); }
    if (mh && lt.a === 'play' && lt.ds > 0) setTimeout(() => badge(lt.p, `Dropped ${lt.ds + 1}`), 380);
    if (mh && lt.a === 'play' && lt.sk === -1) setTimeout(() => { sfx('zapSkip'); players.forEach((u, i) => { if (i !== lt.p && !(st.out || []).includes(i)) badge(i, 'Skipped'); }); }, 380);
    if (mh && lt.a === 'take' && lt.k) {
      setTimeout(() => { sfx('zapPlus', { n: Math.min(lt.k, 10) }); if (lt.p !== me) badge(lt.p, `Took ${lt.k}`); }, 120);
      if (lt.p !== me) { const deckP = center(deckRef.current); for (let k = 0; k < Math.min(lt.k, 10); k++) fly({ code: null, w: 46, from: deckP, to: { ...seatPos(lt.p), s: 0.5 }, dur: 380, delay: 120 + k * 80, sound: 'zapSlide' }); }
    }
    const stacked = mh && lt.a === 'play' && drawVal(lt.c) > 0;
    if (stacked && lt.v != null) setTimeout(() => { sfx('zapPlus', { n: Math.min(lt.pd || 2, 10) }); badge(lt.v, `Stack is ${lt.pd}`); }, 420);
    if (lt.a === 'play') {
      const v = valOf(lt.c);
      if (v === 'S' && lt.sk != null) { setTimeout(() => { sfx('zapSkip'); badge(lt.sk, 'Skipped'); }, 380); }
      if (v === 'R') { setTimeout(() => sfx('zapReverse'), 360); setSpin((x) => x + 1); if (lt.sk != null) setTimeout(() => badge(lt.sk, 'Skipped'), 380); }
      if (isWild(lt.c)) setTimeout(() => sfx('zapWild'), 360);
      if (lt.v != null && lt.k && !stacked) {
        setTimeout(() => { sfx('zapPlus', { n: Math.min(lt.k, 10) }); badge(lt.v, lt.c === 'C' ? `Drew ${lt.k}` : `Draws ${lt.k}`); }, 420);
        const deckP = center(deckRef.current);
        for (let k = 0; k < Math.min(lt.k, 10); k++) fly({ code: null, w: 46, from: deckP, to: { ...seatPos(lt.v), s: lt.v === me ? 1 : 0.5 }, dur: 380, delay: 480 + k * 90, sound: 'zapSlide' });
      }
      if (lt.cl && lt.p !== me) { sfx('zapCall'); badge(lt.p, 'Last card'); }
    }
    if ((lt.a === 'draw' || lt.a === 'late') && lt.p !== me && lt.k) {
      for (let k = 0; k < Math.min(lt.k, 8); k++) fly({ code: null, w: 46, from: center(deckRef.current), to: { ...seatPos(lt.p), s: 0.5 }, dur: 380, delay: k * 80, sound: 'zapSlide' });
      if (lt.a === 'draw' && lt.k > 1) badge(lt.p, `Drew ${lt.k}`);
      if (lt.a === 'late') badge(lt.p, 'Too slow, draws one');
    }
    if (lt.a === 'pass' && lt.p !== me) badge(lt.p, 'Passed');
    if (lt.a === 'catch') {
      sfx('zapCatch');
      badge(lt.v, 'Caught, draws 2');
      for (let k = 0; k < (lt.k || 2); k++) fly({ code: null, w: 46, from: center(deckRef.current), to: { ...seatPos(lt.v), s: lt.v === me ? 1 : 0.5 }, dur: 380, delay: 150 + k * 90, sound: 'zapSlide' });
    }
    if (lt.late && lt.cl && lt.p !== me) { sfx('zapCall'); badge(lt.p, 'Last card'); }
    if (st.st === 'play' && st.t === myId && lt.p !== me) { setTimeout(() => { sfx('turn'); haptic(15); }, 500); }
    if (st.st === 'done' && !relayOn) setTimeout(() => sfx(st.w === myId ? 'win' : 'lose'), 500);
    if (st.st === 'play') setShownTop((t) => (t && lt.a !== 'play' ? st.top : t));
  }, [st.n]);
  useEffect(() => { setCalled(false); }, [st.t]);
  const outs = Array.isArray(st.out) ? st.out : [];
  const liveOthers = others.filter(([, i]) => !outs.includes(i));
  const playable = (c) => myTurn && fits(c, st.top, st.col, st) && (st.dr !== me || c === drawn);
  const play = async (c, col, who) => {
    if (!playable(c) || pend) return;
    if (isWild(c) && !col) { setPickFor(c); return; }
    if (isMayhem(st) && valOf(c) === '7' && who == null && liveOthers.length > 1 && (handRefVal.current || []).length > 1) { setWhoFor({ c, col }); return; }
    const h = handRefVal.current || [];
    const idx = h.indexOf(c);
    const el = handRef.current && handRef.current.querySelector(`[data-ci="${idx}"]`);
    const from = el ? center(el) : center(handRef.current);
    const to = center(pileRef.current);
    const key = `${c}:${idx}`;
    setHidden((s) => new Set(s).add(key));
    setPend(true);
    haptic(10);
    const willCall = called;
    fly({ code: c, w: 64, from: { ...from, r: 0 }, to: { ...to, r: ((st.n * 37) % 16) - 8 }, dur: 360, arc: 40, sound: 'zapFlip' });
    const r = await act('play', { p_card: c, p_color: col || null, p_call: willCall, ...(isMayhem(st) ? { p_who: who == null ? null : who } : {}) });
    setPend(false);
    setHidden((s) => { const n = new Set(s); n.delete(key); return n; });
    if (r && Array.isArray(r.hand)) { setHand(sortHand(r.hand)); setDrawn(null); if (willCall && r.hand.length === 1) { sfx('zapCall'); badge(me, 'Last card'); } } else loadHand();
  };
  const draw = async () => {
    if (!myTurn || st.dr === me) return;
    setPend(true);
    const r = await act('draw');
    setPend(false);
    if (r && Array.isArray(r.hand)) {
      const deckP = center(deckRef.current);
      const sorted = sortHand(r.hand);
      const many = Number(r.k) || 1;
      for (let k = 1; k < Math.min(many, 8); k++) fly({ code: null, w: 50, from: deckP, to: { ...center(handRef.current), r: 0 }, dur: 380, delay: k * 90, sound: 'zapSlide' });
      fly({ code: r.drawn, w: 64, from: deckP, to: { ...center(handRef.current), r: 0 }, flip: true, dur: 460, delay: Math.min(many - 1, 7) * 90, sound: 'zapSlide', land: () => { setHand(sorted); setDrawn(r.drawn && stRef.current.dr === me ? r.drawn : null); } });
      const took = isMayhem(st) && (st.pd || 0) > 0;
      const keep = isMayhem(st) ? !!r.drawn : !!(r.drawn && fits(r.drawn, st.top, st.col, st));
      if (took) setTimeout(() => { sfx('zapPlus', { n: Math.min(many, 10) }); badge(me, `Took ${many}`); }, 300);
      else if (!keep) setTimeout(() => appSnack(many > 1 ? `Drew ${many}. Nothing fits, your turn passes` : 'No luck. Your turn passes'), 520);
      else if (many > 1) setTimeout(() => appSnack(`Drew ${many} cards to find one that fits`), 520);
    }
  };
  const pass = async () => { setPend(true); await act('pass'); setPend(false); setDrawn(null); };
  const callLast = async () => {
    if (st.open === me) { const r = await act('call'); if (r) { sfx('zapCall'); badge(me, 'Last card'); } return; }
    setCalled(true);
    sfx('zapCall');
    haptic(12);
  };
  const doCatch = async (i) => { const r = await act('catch', { p_who: i }); if (r) sfx('zapCatch'); };
  const nudge = () => act('nudge');
  const end = () => act('end');
  const join = async () => {
    if (joining) return;
    setJoining(true);
    haptic(8);
    const r = await act('join');
    setJoining(false);
    if (r) sfx('zapShuffle');
  };
  const joinTried = useRef(false);
  useEffect(() => {
    if (intent !== 'join' || joinTried.current || st.st !== 'lobby' || me >= 0) return;
    joinTried.current = true;
    join();
  }, [intent, st.st, me]);
  const nudgeOk = st.st === 'play' && me >= 0 && st.t !== myId && Date.now() / 1000 - (st.at || 0) > 60;
  const [, force] = useState(0);
  useEffect(() => { if (st.st !== 'play' || st.t === myId) return undefined; const t = setTimeout(() => force((x) => x + 1), Math.max(1000, ((st.at || 0) + 61) * 1000 - Date.now())); return () => clearTimeout(t); }, [st.n, st.t]);
  useEffect(() => {
    if (g1Test()) window.__gbzap = { state: () => stRef.current, hand: () => handRefVal.current, play: (c, col) => play(c, col), draw: () => draw(), pass: () => pass(), call: () => callLast(), catchIt: (i) => doCatch(i), flights: () => flights.length, apply: (content) => { const c = ctxOf(); const mid = msgIdOf(stRef.current); if (c && mid) c.patchMessage(mid, content); } };
  });
  return { rootRef, pileRef, deckRef, handRef, seatRefs, hand, drawn, pickFor, setPickFor, whoFor, setWhoFor, called, flights, landed, hidden, shownTop, badges, pend, spin, dealing, joining, players, me, others, myTurn, W, handErr, loadHand, playable, play, draw, pass, callLast, doCatch, nudge, nudgeOk, end, join };
}

function ZapBody({ Z, st, myId, top, done, lobby }) {
  const { theme } = useTheme();
  const { hand, me, myTurn, W, handErr, playable, called, hidden, dealing, shownTop, spin } = Z;
  const handW = Math.min(W - 56, 420);
  const n = hand ? hand.length : 0;
  const cw = n > 12 ? 52 : n > 8 ? 58 : 64;
  const step = n > 1 ? Math.min(cw * 0.78, (handW - cw) / (n - 1)) : 0;
  const total = n > 1 ? step * (n - 1) + cw : cw;
  const lastCallShow = st.st === 'play' && me >= 0 && ((myTurn && n === 2 && !called) || st.open === me);
  const colourName = ZAP_NAMES[st.col] || '';
  return (
    <div ref={Z.rootRef} style={{ position: 'relative', width: '100%', height: '100%', alignSelf: 'stretch', display: 'flex', flexDirection: 'column', fontFamily: FONT }}>
      {top}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div aria-hidden="true" key={spin} style={{ position: 'absolute', width: 230, height: 230, borderRadius: '50%', animation: spin ? 'zgbSpin 700ms cubic-bezier(.3,.7,.25,1)' : 'none', opacity: st.st === 'play' ? 1 : 0, transition: 'opacity 300ms ease' }}>
          <svg width="230" height="230" viewBox="0 0 230 230">
            <circle cx="115" cy="115" r="104" fill="none" stroke={ZAP_COLORS[st.col] || 'rgba(255,255,255,0.3)'} strokeOpacity="0.55" strokeWidth="3" strokeDasharray="2 10" strokeLinecap="round" style={{ transition: 'stroke 300ms ease' }} />
            {[0, 1, 2].map((k) => { const a = (k * 120 - 90) * Math.PI / 180; const x = 115 + Math.cos(a) * 104; const y = 115 + Math.sin(a) * 104; const rot = k * 120 + ((st.dir || 1) > 0 ? 0 : 180); return <path key={k} d="M-7 -6 L5 0 L-7 6 Z" fill={ZAP_COLORS[st.col] || '#FFFFFF'} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot})`} />; })}
          </svg>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 26, position: 'relative' }}>
          <div ref={Z.deckRef} role="button" aria-label={myTurn && st.dr !== me ? (isMayhem(st) && st.pd > 0 ? `Take ${st.pd} cards` : 'Draw a card') : 'Draw pile'} onClick={Z.draw} style={{ position: 'relative', width: 72, height: 108, cursor: myTurn && st.dr !== me ? 'pointer' : 'default' }}>
            {[3, 2, 1, 0].map((k) => <ZapCardFace key={k} back w={72} style={{ position: 'absolute', left: k * 1.5, top: -k * 1.5 }} />)}
            {myTurn && st.dr !== me && <div style={{ position: 'absolute', inset: -6, borderRadius: 12, boxShadow: '0 0 0 2px rgba(246,210,122,0.85)', animation: 'zgbPulse 1.4s ease-in-out infinite' }} />}
            <div style={{ position: 'absolute', bottom: -22, left: 0, right: 0, textAlign: 'center', fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.65)' }}>{st.pile != null ? `${st.pile} left` : ''}</div>
            {isMayhem(st) && st.st === 'play' && st.pd > 0 && <div key={st.pd} className="zgr-pop" style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', padding: '4px 10px', borderRadius: 999, background: '#E2405F', color: '#FFFFFF', fontSize: 13, fontWeight: 900, whiteSpace: 'nowrap', boxShadow: '0 3px 0 #8E1631, 0 6px 14px rgba(0,0,0,0.45)' }}>{`+${st.pd}`}</div>}
          </div>
          {!lobby && (
            <div ref={Z.pileRef} style={{ position: 'relative', width: 80, height: 120 }}>
              {shownTop && <ZapCardFace code={shownTop} w={80} style={{ position: 'absolute', inset: 0, transform: `rotate(${((st.n * 37) % 16) - 8}deg)` }} />}
              {st.st === 'play' && <div style={{ position: 'absolute', bottom: -27, left: -20, right: -20, display: 'flex', justifyContent: 'center' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 9px 2px 6px', borderRadius: 999, background: 'rgba(8,10,14,0.55)', fontSize: 11.5, fontWeight: 900, color: '#FFFFFF' }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: ZAP_COLORS[st.col] || '#FFFFFF', boxShadow: '0 0 0 1.5px rgba(255,255,255,0.85)' }} />{colourName}</span></div>}
            </div>
          )}
        </div>
      </div>
      <div style={{ flexShrink: 0, paddingBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 44, marginBottom: 6 }}>
          {lastCallShow && <button type="button" onClick={Z.callLast} style={{ height: 40, padding: '0 18px', borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: FONT, fontWeight: 900, fontSize: 14.5, color: '#FFF', background: ZAP_COLORS.r, boxShadow: `0 3px 0 ${INK.r}, 0 6px 14px rgba(0,0,0,0.4)` }}>Last card</button>}
          {called && myTurn && <span style={{ fontSize: 12.5, fontWeight: 800, color: '#FFB3C0' }}>Called. Now play a card</span>}
          {myTurn && st.dr === me && <button type="button" onClick={Z.pass} style={{ height: 40, padding: '0 22px', borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: FONT, fontWeight: 900, fontSize: 14.5, color: '#FFF', background: 'rgba(255,255,255,0.16)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.2)' }}>Pass</button>}
          {Z.nudgeOk && <button type="button" onClick={Z.nudge} style={{ height: 36, padding: '0 16px', borderRadius: 18, border: 'none', cursor: 'pointer', fontFamily: FONT, fontWeight: 800, fontSize: 13, color: '#FFF', background: 'rgba(255,255,255,0.12)' }}>{`Skip ${g1First(st.t)}`}</button>}
        </div>
        <div ref={Z.handRef} style={{ position: 'relative', height: cw * 1.5 + 20, width: '100%' }}>
          {hand && !dealing && hand.map((c, i) => {
            const ok = playable(c);
            const x = (W - total) / 2 + i * step;
            const rot = n > 1 ? (i - (n - 1) / 2) * Math.min(4, 40 / n) : 0;
            const y = Math.abs(i - (n - 1) / 2) * Math.abs(i - (n - 1) / 2) * (n > 1 ? 18 / (n * n) * 4 : 0);
            const hid = hidden.has(`${c}:${i}`);
            return (
              <div key={`${c}:${i}`} data-ci={i} style={{ position: 'absolute', left: x, top: 12 + y, transform: `rotate(${rot}deg)`, transformOrigin: '50% 120%', transition: 'left 240ms ease, top 240ms ease, transform 240ms ease', opacity: hid ? 0 : 1, zIndex: i }}>
                <ZapCardFace code={c} w={cw} lift={ok} dim={myTurn && !ok} onClick={ok ? () => Z.play(c) : () => { if (myTurn) { sfx('tap'); appSnack(st.dr === me ? 'You can only play the card you just drew' : `That does not match ${colourName.toLowerCase()} or the number`); } }} label={`${cardName(c)}${ok ? ', can play' : ''}`} />
              </div>
            );
          })}
          {!hand && me >= 0 && st.st === 'play' && !handErr && <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 13, paddingTop: 40 }}>Getting your cards</div>}
          {!hand && me >= 0 && st.st === 'play' && handErr && <div style={{ margin: '4px 24px 0', borderRadius: 18, background: theme.panelBg }}><LoadFail small code="zap hand" onRetry={Z.loadHand} /></div>}
          {me < 0 && !lobby && <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 13, paddingTop: 40 }}>You are watching. Hands stay hidden.</div>}
          {lobby}
        </div>
      </div>
      <Flights list={Z.flights} onDone={Z.landed} />
      {done}
      <style>{'@keyframes zgbPop{0%{opacity:0;transform:translateY(6px) scale(0.9)}12%{opacity:1;transform:translateY(0) scale(1)}80%{opacity:1}100%{opacity:0;transform:translateY(-6px)}}@keyframes zgbPulse{0%,100%{opacity:0.35}50%{opacity:1}}@keyframes zgbSpin{from{transform:rotate(-120deg)}to{transform:rotate(0deg)}}'}</style>
    </div>
  );
}

function ZapScores({ st, myId }) {
  const players = st.p || [];
  return (
    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {players.map((u, i) => (
        <div key={u} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar emoji={(g1Mem.names[u] || {}).avatar} name={ga1Name(u)} size={26} />
          <span style={{ flex: 1, textAlign: 'left', fontSize: 13.5, fontWeight: 700 }}>{u === myId ? 'You' : g1First(u)}</span>
          <div style={{ display: 'flex' }}>{((st.rh || [])[i] || []).slice(0, 8).map((c, k) => <ZapCardFace key={k} code={c} w={20} style={{ marginLeft: k ? -8 : 0, boxShadow: '0 1px 2px rgba(0,0,0,0.5)' }} />)}</div>
          <span style={{ width: 34, textAlign: 'right', fontSize: 14, fontWeight: 900 }}>{(st.sc || [])[i] || 0}</span>
        </div>
      ))}
    </div>
  );
}

export function ZapPage({ st, myId, onClose }) {
  useGameKit();
  useBackClose(true, onClose);
  const [ask, setAsk] = useState(false);
  useBackClose(ask, () => setAsk(false));
  const Z = useZapPlay({ st, myId, relay: null, intent: null });
  const { me, others, myTurn, hand, seatRefs } = Z;
  const note = st.st === 'lobby' ? 'Waiting for players to join from the chat' : st.st === 'done' ? (st.ended ? 'The game was ended' : st.w === myId ? `You won with ${countWord(st.pts || 0, 'point', 'points')}` : `${g1First(st.w)} won the game`) : myTurn ? zapTurnLine(st, me, hand, true) : `${g1First(st.t)} is playing`;
  const done = st.st === 'done' ? (
    <div style={{ position: 'absolute', left: '50%', top: '34%', transform: 'translate(-50%, -50%)', width: 'min(86%, 320px)', borderRadius: 22, padding: '18px 18px 14px', background: 'rgba(16,12,22,0.92)', boxShadow: '0 20px 50px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.08)', color: '#FFF', textAlign: 'center', zIndex: 25 }}>
      <div style={{ fontSize: 19, fontWeight: 900 }}>{st.ended ? 'Game ended' : st.w === myId ? 'You won' : `${g1First(st.w)} won`}</div>
      {!st.ended && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{countWord(st.pts || 0, 'point', 'points')} from the cards left in other hands</div>}
      <ZapScores st={st} myId={myId} />
    </div>
  ) : null;
  return (
    <GameRoom k="zap" title={isMayhem(st) ? 'Zap Mayhem' : 'Zap'} scene={<ZapScene />} onClose={onClose}
      top={(
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-around', gap: 6, padding: '6px 10px 0', fontFamily: FONT }}>
          {others.map(([u, i]) => <Seat key={u} u={u} i={i} st={st} myId={myId} seatRef={(el) => { seatRefs.current[i] = el; }} badge={Z.badges[i]} onCatch={() => Z.doCatch(i)} />)}
        </div>
      )}
      bottom={(
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '0 2px', fontFamily: FONT }}>
          <div style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,0.84)', textAlign: 'center' }}>{note}</div>
          {st.st === 'done' && me >= 0 ? <button type="button" onClick={() => { onClose(); if (g1Mem.host) g1Mem.host.rematch(st); }} style={{ height: 40, padding: '0 18px', borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: FONT, fontWeight: 900, fontSize: 14.5, color: '#2A1A08', background: 'linear-gradient(180deg, #F0CF7A, #C9952F)', boxShadow: '0 3px 0 #7A5410' }}>Play again</button>
            : me >= 0 && st.st !== 'done' ? <button type="button" aria-label="End the game" onClick={() => setAsk(true)} style={{ width: 40, height: 40, borderRadius: 20, border: 'none', cursor: 'pointer', color: '#FFF', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 21V4" /><path d="M5 4h11l-2 4 2 4H5" /></svg></button> : null}
        </div>
      )}>
      <ZapBody Z={Z} st={st} myId={myId} done={done} />
      <RoomLayer>
        {Z.pickFor && <ColorPicker onClose={() => Z.setPickFor(null)} onPick={(c) => { const card = Z.pickFor; Z.setPickFor(null); Z.play(card, c); }} />}
        {Z.whoFor && <WhoPicker st={st} myId={myId} onClose={() => Z.setWhoFor(null)} onPick={(i) => { const w = Z.whoFor; Z.setWhoFor(null); Z.play(w.c, w.col, i); }} />}
        {ask && <ConfirmSheet zIndex={60} title="End this game" text="Everyone at the table sees the game end now." confirmLabel="End game" onCancel={() => setAsk(false)} onConfirm={() => { setAsk(false); Z.end(); }} />}
      </RoomLayer>
    </GameRoom>
  );
}

function OppHand({ u, i, st, myId, seatRef, badge, onCatch }) {
  const cnt = (st.cnt || [])[i] || 0;
  const catchable = st.open === i && u !== myId;
  const out = Array.isArray(st.out) && st.out.includes(i);
  const shown = out ? 0 : Math.min(cnt, 12);
  return (
    <div ref={seatRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 58, minWidth: 120 }}>
      {out && <span style={{ padding: '5px 12px', borderRadius: 999, background: 'rgba(10,8,14,0.7)', color: 'rgba(255,255,255,0.8)', fontSize: 12.5, fontWeight: 900 }}>Out</span>}
      {Array.from({ length: shown }).map((_, k) => <ZapCardFace key={k} back w={30} style={{ marginLeft: k ? -19 : 0, transform: `rotate(${180 + (k - (shown - 1) / 2) * 4}deg) translateY(${Math.abs(k - (shown - 1) / 2) * 0.9}px)`, boxShadow: '0 2px 4px rgba(0,0,0,0.45)' }} />)}
      {cnt === 1 && st.st === 'play' && !catchable && <span style={{ position: 'absolute', bottom: -8, padding: '2px 8px', borderRadius: 999, background: '#E2405F', color: '#FFF', fontSize: 10.5, fontWeight: 900, boxShadow: '0 2px 6px rgba(0,0,0,0.4)' }}>Last card</span>}
      {catchable && <button type="button" onClick={onCatch} style={{ position: 'absolute', bottom: -10, height: 28, padding: '0 12px', borderRadius: 14, border: 'none', cursor: 'pointer', background: '#F2B21B', color: '#2A1A00', fontWeight: 900, fontSize: 12, fontFamily: FONT, boxShadow: '0 3px 0 #8A5A00, 0 4px 10px rgba(0,0,0,0.4)' }}>Catch</button>}
      {badge && <span key={badge.at} style={{ position: 'absolute', top: 14, padding: '4px 9px', borderRadius: 999, background: 'rgba(10,8,14,0.85)', color: '#FFF', fontSize: 11.5, fontWeight: 900, animation: 'zgbPop 1.6s ease forwards', whiteSpace: 'nowrap' }}>{badge.t}</span>}
    </div>
  );
}

export function ZapTable({ st, myId, peerName, relay, intent, onMeta }) {
  const [ask, setAsk] = useState(false);
  useBackClose(ask, () => setAsk(false));
  const Z = useZapPlay({ st, myId, relay, intent });
  const { me, others, myTurn, hand, seatRefs } = Z;
  const peer = peerName || (others[0] ? g1First(others[0][0]) : 'Your friend');
  const lobby = st.st === 'lobby';
  const myCnt = (st.cnt || [])[me];
  const cardLine = (n) => (n == null ? '' : n === 1 ? 'Last card' : countWord(n, 'card', 'cards'));
  const peerIdx = others[0] ? others[0][1] : -1;
  const status = lobby ? (me >= 0 ? `Waiting for ${peer} to join` : Z.joining ? 'Dealing the cards' : `${peer} wants to play`) : st.st === 'done' ? '' : myTurn ? zapTurnLine(st, me, hand, false) : `${g1First(st.t)} is playing`;
  useEffect(() => {
    onMeta({
      status, hot: !lobby && myTurn, ready: true, center: null,
      me: lobby ? (me >= 0 ? 'Ready' : 'Invited') : st.st === 'done' ? `${(st.sc || [])[me] || 0} points` : cardLine(myCnt),
      peer: lobby ? (peerIdx >= 0 ? 'Ready' : 'Not joined yet') : st.st === 'done' ? `${(st.sc || [])[peerIdx] || 0} points` : cardLine((st.cnt || [])[peerIdx]),
      menu: me >= 0 && st.st !== 'done' ? [{ label: 'End game', danger: true, onClick: () => setAsk(true) }] : [],
      result: <ZapScores st={st} myId={myId} />,
      why: st.ended ? (st.ended === myId ? 'You ended the game' : `${peer} ended the game`) : st.w ? `${countWord(st.pts || 0, 'point', 'points')} from the cards left` : null,
    });
  }, [status, myTurn, lobby, me, myCnt, peerIdx, st.n, st.st]);
  const lobbyNode = lobby ? (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '0 24px', textAlign: 'center' }}>
      {me >= 0 ? (
        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'rgba(255,255,255,0.78)', lineHeight: 1.4 }}>{`The cards are dealt when ${peer} joins`}</div>
      ) : (
        <button type="button" onClick={Z.join} disabled={Z.joining} className="zgr-press" style={{ height: 48, padding: '0 28px', borderRadius: 24, border: 'none', cursor: Z.joining ? 'default' : 'pointer', fontFamily: FONT, fontWeight: 900, fontSize: 16, color: '#FFFFFF', background: 'linear-gradient(180deg, #52D681 0%, #2FB463 100%)', boxShadow: '0 3px 0 #1E8A47, 0 8px 18px rgba(0,0,0,0.35)', opacity: Z.joining ? 0.7 : 1 }}>{Z.joining ? 'Dealing' : 'Join and deal'}</button>
      )}
    </div>
  ) : null;
  const top = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: 6, padding: '4px 10px 0', minHeight: 66 }}>
      {others.map(([u, i]) => <OppHand key={u} u={u} i={i} st={st} myId={myId} seatRef={(el) => { seatRefs.current[i] = el; }} badge={Z.badges[i]} onCatch={() => Z.doCatch(i)} />)}
    </div>
  );
  return (
    <>
      <ZapBody Z={Z} st={st} myId={myId} top={top} lobby={lobbyNode} done={null} />
      <RoomLayer>
        {Z.pickFor && <ColorPicker onClose={() => Z.setPickFor(null)} onPick={(c) => { const card = Z.pickFor; Z.setPickFor(null); Z.play(card, c); }} />}
        {Z.whoFor && <WhoPicker st={st} myId={myId} onClose={() => Z.setWhoFor(null)} onPick={(i) => { const w = Z.whoFor; Z.setWhoFor(null); Z.play(w.c, w.col, i); }} />}
        {ask && <ConfirmSheet zIndex={60} title="End this game" text={`${peer} sees the game end now.`} confirmLabel="End game" onCancel={() => setAsk(false)} onConfirm={() => { setAsk(false); Z.end(); }} />}
      </RoomLayer>
    </>
  );
}

export function zapLobby(id, myId, isGroup, md) {
  return { g: 'zap', id, n: 0, st: 'lobby', p: [myId], by: myId, mx: isGroup ? 4 : 2, t: null, w: null, ...(md === 'mayhem' ? { md: 'mayhem' } : {}) };
}
