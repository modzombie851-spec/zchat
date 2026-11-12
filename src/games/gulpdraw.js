import { WW, WH, TAU, SPECIES, PLAYER_SP, SP_INDEX, rOf, floorAt, rngOf, bodySeg, clamp, viewOf, suckR, regionAt, CURRENTS } from './gulpengine.js';

const FF = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const K = 46;
const BOX = { x0: -2.1, x1: 1.7, y0: -1.7, y1: 1.7 };

export const PLAYER_PAL = {
  sun: ['#FFB347', '#E57A12', '#FFD27A', '#FFF4DC'],
  moon: ['#4CBBFF', '#1C7FD3', '#A4E2FF', '#EAF8FF'],
  b1: ['#7ED957', '#3E9E2E', '#C3F09E', '#F2FFE8'],
  b2: ['#FF7FB6', '#D2457F', '#FFC1DC', '#FFF0F6'],
  b3: ['#B58CFF', '#7A4FE0', '#DCC8FF', '#F6F0FF'],
  b4: ['#FFD84D', '#D9A300', '#FFF0A8', '#FFFBEA'],
};
export const RING = { sun: '#FFCB7A', moon: '#A9DCFF', b1: '#BFF29E', b2: '#FFB3D4', b3: '#D8C2FF', b4: '#FFE98A' };
Object.assign(PLAYER_PAL, {
  c6: ['#3FE0C8', '#14A892', '#A6F5E8', '#EFFFFC'],
  c7: ['#FF6A5E', '#D8392E', '#FFB3AC', '#FFF0EE'],
  c8: ['#DCE3EE', '#9AA6B8', '#F4F7FB', '#FFFFFF'],
  c9: ['#C98B5A', '#94592F', '#E8C3A2', '#FFF5EC'],
});
Object.assign(RING, { c6: '#A6F5E8', c7: '#FFB3AC', c8: '#FFFFFF', c9: '#F0CFA8' });
['sun', 'moon', 'b1', 'b2', 'b3', 'b4'].forEach((k, i) => { PLAYER_PAL[`c${i}`] = PLAYER_PAL[k]; RING[`c${i}`] = RING[k]; });
export const SLOT_KEYS = ['c0', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9'];

function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = (c) => Math.max(0, Math.min(255, Math.round(k < 0 ? c * (1 + k) : c + (255 - c) * k)));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

function mouthIn(c, shape, L, H, pal, open, teeth) {
  const longish = shape === 'shark' || shape === 'orca' || shape === 'long' || shape === 'slim';
  const fx = shape === 'shark' || shape === 'orca' ? L * 1.02 : shape === 'long' ? L * 1.06 : shape === 'disc' ? L * 0.95 : L;
  const my = shape === 'whale' ? H * 0.34 : longish ? H * 0.16 : H * 0.14;
  const md = (shape === 'whale' ? 0.42 : longish ? 0.36 : 0.4) * L;
  const full = (longish ? 1.15 : shape === 'whale' ? 0.75 : 0.66) * H;
  const lip = shade(pal[1], -0.28);
  if (open > 1.2) {
    const mh = Math.min(H * 0.86, full * 1.3), mw = md * 0.78, cx = fx + md * 0.05;
    c.fillStyle = lip;
    c.beginPath(); c.ellipse(cx, my, mw * 1.16, mh * 0.56, 0, 0, TAU); c.fill();
    c.fillStyle = '#2A0912';
    c.beginPath(); c.ellipse(cx, my, mw, mh * 0.48, 0, 0, TAU); c.fill();
    c.fillStyle = '#12030A';
    c.beginPath(); c.ellipse(cx - mw * 0.12, my, mw * 0.55, mh * 0.28, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.22)';
    c.beginPath(); c.ellipse(cx + mw * 0.2, my - mh * 0.3, mw * 0.4, mh * 0.08, -0.3, 0, TAU); c.fill();
    return;
  }
  if (open > 0.05) {
    const mh = full * open;
    c.fillStyle = '#3A0E1A';
    c.beginPath(); c.ellipse(fx + md * 0.18, my, md * 1.05, mh * 0.5, 0, 0, TAU); c.fill();
    c.fillStyle = '#5A1626';
    c.beginPath(); c.ellipse(fx - md * 0.2, my - mh * 0.08, md * 0.55, mh * 0.26, 0, 0, TAU); c.fill();
    c.fillStyle = '#F07A92';
    c.beginPath(); c.ellipse(fx - md * 0.3, my + mh * 0.3, md * 0.5, mh * 0.18, -0.1, 0, TAU); c.fill();
    if (teeth) {
      c.fillStyle = '#FFFFFF';
      const n = longish ? 4 : 3;
      for (let i = 0; i < n; i++) {
        const k = (i + 0.6) / (n + 0.4);
        const tx = fx - md * 0.08 - md * 0.78 * k;
        const ang = Math.acos(Math.min(1, Math.max(-1, (tx - fx - md * 0.18) / (md * 1.05))));
        const ty = mh * 0.5 * Math.sin(ang);
        const tw = md * 0.1, th = Math.min(mh * 0.28, md * 0.24);
        c.beginPath(); c.moveTo(tx - tw, my - ty); c.lineTo(tx, my - ty + th); c.lineTo(tx + tw, my - ty); c.closePath(); c.fill();
        c.beginPath(); c.moveTo(tx - tw, my + ty); c.lineTo(tx, my + ty - th); c.lineTo(tx + tw, my + ty); c.closePath(); c.fill();
      }
    }
    c.strokeStyle = lip; c.lineWidth = Math.max(0.045, L * 0.045);
    c.beginPath(); c.ellipse(fx + md * 0.18, my, md * 1.05, mh * 0.5, 0, Math.PI * 0.5, Math.PI * 1.5); c.stroke();
  } else {
    c.strokeStyle = 'rgba(40,10,20,0.8)'; c.lineWidth = Math.max(0.05, L * 0.05); c.lineCap = 'round';
    c.beginPath(); c.moveTo(fx + 0.02, my); c.quadraticCurveTo(fx - md * 0.45, my + full * 0.16, fx - md * 0.85, my + full * 0.04); c.stroke();
    c.strokeStyle = lip; c.lineWidth = Math.max(0.03, L * 0.03);
    c.beginPath(); c.moveTo(fx - md * 0.85, my + full * 0.04); c.quadraticCurveTo(fx - md * 0.95, my - full * 0.02, fx - md * 0.88, my - full * 0.1); c.stroke();
  }
}

const LINE = '#151830';
function inkLine(c, w) { c.strokeStyle = LINE; c.lineWidth = w; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); }
function eye2(c, x, y, r, hunter, glow) {
  c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(x, y, r, r * 1.1, 0, 0, TAU); c.fill(); inkLine(c, r * 0.2);
  c.fillStyle = glow || (hunter ? '#2C0710' : LINE); c.beginPath(); c.ellipse(x + r * 0.3, y + r * 0.06, r * 0.58, r * 0.66, 0, 0, TAU); c.fill();
  if (hunter) { c.fillStyle = '#C8262E'; c.beginPath(); c.ellipse(x + r * 0.3, y + r * 0.06, r * 0.32, r * 0.38, 0, 0, TAU); c.fill(); c.fillStyle = '#16050A'; c.beginPath(); c.ellipse(x + r * 0.32, y + r * 0.06, r * 0.12, r * 0.3, 0, 0, TAU); c.fill(); }
  c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(x + r * 0.48, y - r * 0.28, r * 0.24, 0, TAU); c.fill();
  c.beginPath(); c.arc(x + r * 0.08, y + r * 0.36, r * 0.1, 0, TAU); c.fill();
  if (hunter) { c.fillStyle = LINE; c.beginPath(); c.moveTo(x - r * 1.15, y - r * 1.35); c.lineTo(x + r * 1.05, y - r * 0.55); c.lineTo(x + r * 0.95, y - r * 0.25); c.lineTo(x - r * 1.1, y - r * 0.95); c.closePath(); c.fill(); }
}
function bodyPath(c, shape, L, H) {
  c.beginPath();
  if (shape === 'shark' || shape === 'orca') {
    c.moveTo(L * 1.04, H * 0.08); c.quadraticCurveTo(L * 0.62, -H * 1.08, -L * 0.2, -H); c.quadraticCurveTo(-L * 0.78, -H * 0.82, -L * 0.98, -H * 0.12);
    c.lineTo(-L * 0.98, H * 0.12); c.quadraticCurveTo(-L * 0.75, H * 0.78, -L * 0.1, H * 0.98); c.quadraticCurveTo(L * 0.64, H * 0.98, L * 1.04, H * 0.08);
  } else if (shape === 'long') {
    c.moveTo(L * 1.08, 0); c.quadraticCurveTo(L * 0.58, -H * 1.08, -L * 0.3, -H * 0.95); c.quadraticCurveTo(-L * 0.86, -H * 0.62, -L * 0.98, 0); c.quadraticCurveTo(-L * 0.86, H * 0.62, -L * 0.3, H * 0.95); c.quadraticCurveTo(L * 0.58, H * 1.08, L * 1.08, 0);
  } else if (shape === 'whale') {
    c.moveTo(L * 1.0, H * 0.12); c.quadraticCurveTo(L * 0.98, -H * 1.04, L * 0.2, -H); c.quadraticCurveTo(-L * 0.62, -H * 0.9, -L * 0.98, -H * 0.1); c.lineTo(-L * 0.98, H * 0.1); c.quadraticCurveTo(-L * 0.4, H * 1.06, L * 0.4, H * 1.0); c.quadraticCurveTo(L * 1.02, H * 0.9, L * 1.0, H * 0.12);
  } else if (shape === 'disc') {
    c.moveTo(L * 0.96, 0); c.quadraticCurveTo(L * 0.52, -H * 0.98, -L * 0.25, -H * 0.86); c.quadraticCurveTo(-L * 0.86, -H * 0.42, -L * 0.88, 0); c.quadraticCurveTo(-L * 0.86, H * 0.42, -L * 0.25, H * 0.86); c.quadraticCurveTo(L * 0.52, H * 0.98, L * 0.96, 0);
  } else if (shape === 'slim') {
    c.moveTo(L * 1.02, 0); c.quadraticCurveTo(L * 0.5, -H * 1.12, -L * 0.4, -H * 0.82); c.quadraticCurveTo(-L * 0.92, -H * 0.4, -L * 0.98, 0); c.quadraticCurveTo(-L * 0.92, H * 0.4, -L * 0.4, H * 0.82); c.quadraticCurveTo(L * 0.5, H * 1.12, L * 1.02, 0);
  } else {
    c.moveTo(L * 1.0, H * 0.05); c.bezierCurveTo(L * 0.98, -H * 0.72, L * 0.35, -H * 1.04, -L * 0.15, -H * 0.98); c.bezierCurveTo(-L * 0.7, -H * 0.9, -L * 1.0, -H * 0.42, -L * 0.98, 0);
    c.bezierCurveTo(-L * 1.0, H * 0.42, -L * 0.7, H * 0.92, -L * 0.15, H * 0.98); c.bezierCurveTo(L * 0.35, H * 1.04, L * 0.98, H * 0.72, L * 1.0, H * 0.05);
  }
  c.closePath();
}
function finShape(c, pts, col, lw, rays) {
  c.fillStyle = col; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i += 2) c.quadraticCurveTo(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
  c.closePath(); c.fill(); inkLine(c, lw);
  if (rays) { c.save(); c.clip(); c.strokeStyle = 'rgba(255,255,255,0.32)'; c.lineWidth = lw * 0.45; for (const r of rays) { c.beginPath(); c.moveTo(r[0], r[1]); c.lineTo(r[2], r[3]); c.stroke(); } c.restore(); }
}
function paintFish(c, shape, pal, o) {
  const wag = o.wag || 0, open = o.open || 0;
  const S = o.S || {};
  const lw = 0.075;
  const back = shade(pal[1], -0.08), fin = pal[2], belly = shade(pal[2], 0.45);
  if (shape === 'jelly') {
    for (let i = 0; i < 6; i++) {
      c.strokeStyle = shade(pal[1], -0.05); c.globalAlpha = 0.8; c.lineWidth = 0.08; c.lineCap = 'round';
      c.beginPath(); const tx = -0.62 + i * 0.25; c.moveTo(tx, 0.22);
      for (let k = 1; k <= 6; k++) c.lineTo(tx + Math.sin(k * 0.9 + wag * 2 + i) * 0.13, 0.22 + k * 0.22);
      c.stroke();
    }
    c.globalAlpha = 0.94;
    const g = c.createRadialGradient(-0.25, -0.55, 0.08, 0, -0.2, 1.05); g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.32, pal[2]); g.addColorStop(0.7, pal[0]); g.addColorStop(1, pal[1]);
    c.fillStyle = g; c.beginPath(); c.moveTo(-0.92, 0.25); c.bezierCurveTo(-1.0, -0.75, -0.55, -1.1, 0, -1.1); c.bezierCurveTo(0.55, -1.1, 1.0, -0.75, 0.92, 0.25);
    for (let i = 0; i < 6; i++) { const x = 0.92 - (i + 0.5) * 0.307; c.quadraticCurveTo(x + 0.1, 0.42, x - 0.15, 0.25); }
    c.closePath(); c.fill(); inkLine(c, lw);
    c.globalAlpha = 1;
    c.fillStyle = 'rgba(255,255,255,0.6)'; c.beginPath(); c.ellipse(-0.38, -0.68, 0.24, 0.12, -0.5, 0, TAU); c.fill();
    eye2(c, -0.3, -0.22, 0.15, false); eye2(c, 0.28, -0.22, 0.15, false);
    c.fillStyle = 'rgba(255,120,170,0.45)'; c.beginPath(); c.ellipse(-0.55, 0.0, 0.12, 0.07, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(0.55, 0.0, 0.12, 0.07, 0, 0, TAU); c.fill();
    c.strokeStyle = LINE; c.lineWidth = 0.05; c.beginPath(); c.arc(-0.01, 0.0, 0.1, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
    return;
  }
  if (shape === 'squid') {
    for (let i = 0; i < 6; i++) {
      c.strokeStyle = shade(pal[1], -0.1); c.lineWidth = 0.1 - i * 0.008; c.lineCap = 'round';
      c.beginPath(); c.moveTo(-0.6, (i - 2.5) * 0.08);
      for (let k = 1; k <= 5; k++) c.lineTo(-0.6 - k * 0.2, (i - 2.5) * 0.08 * (1 + k * 0.4) + Math.sin(k + wag * 2 + i) * 0.07);
      c.stroke();
    }
    finShape(c, [[0.72, -0.2], [1.0, -0.62], [1.32, 0], [1.0, 0.62], [0.72, 0.2]], pal[2], lw);
    const g = c.createLinearGradient(0, -0.45, 0, 0.45); g.addColorStop(0, shade(pal[0], 0.15)); g.addColorStop(1, pal[1]);
    c.fillStyle = g; c.beginPath(); c.moveTo(-0.62, -0.3); c.bezierCurveTo(0.0, -0.52, 0.9, -0.36, 1.28, 0); c.bezierCurveTo(0.9, 0.36, 0.0, 0.52, -0.62, 0.3); c.closePath(); c.fill(); inkLine(c, lw);
    for (let i = 0; i < 6; i++) { c.fillStyle = 'rgba(150,30,80,0.32)'; c.beginPath(); c.arc(-0.15 + i * 0.2, (i % 2 ? -0.12 : 0.12), 0.055, 0, TAU); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.ellipse(0.3, -0.22, 0.45, 0.07, -0.05, 0, TAU); c.fill();
    eye2(c, -0.38, -0.08, 0.16, false);
    return;
  }
  const H = { round: 0.84, oval: 0.64, slim: 0.36, disc: 0.96, puff: 0.9, long: 0.36, shark: 0.42, angler: 0.78, orca: 0.44, whale: 0.44 }[shape] || 0.62;
  const L = { slim: 1.15, long: 1.2, shark: 1.2, orca: 1.15, whale: 1.25 }[shape] || 1.1;
  const sharky = shape === 'shark' || shape === 'orca' || shape === 'long';
  if (shape === 'whale') {
    c.save(); c.translate(-L * 0.95, 0); c.rotate(wag * 0.14);
    finShape(c, [[0.12, -0.07], [-0.2, -0.12], [-0.55, -0.55], [-0.4, -0.04], [-0.58, 0], [-0.4, 0.04], [-0.55, 0.55], [-0.2, 0.12], [0.12, 0.07]], back, lw);
    c.restore();
  } else if (sharky) {
    c.save(); c.translate(-L * 0.92, 0); c.rotate(wag * 0.32);
    finShape(c, [[0.14, 0], [-0.2, -0.16], [-0.44, -0.66], [-0.3, -0.1], [-0.25, 0], [-0.3, 0.1], [-0.38, 0.5], [-0.2, 0.13], [0.14, 0]], shape === 'long' && pal[3] ? pal[3] : back, lw);
    c.restore();
  } else if (shape !== 'angler') {
    const tw = shape === 'slim' ? 0.44 : shape === 'disc' ? 0.52 : 0.66, th = shape === 'slim' ? 0.32 : shape === 'disc' ? 0.52 : 0.66;
    const fork = shape === 'slim' || shape === 'oval';
    c.save(); c.translate(-L * 0.86, 0); c.rotate(wag * 0.34);
    const tc = S.id === 'tang' ? '#FFD23F' : fin;
    const pts = fork ? [[0.16, 0], [-tw * 0.35, -th * 0.22], [-tw, -th], [-tw * 0.5, -th * 0.12], [-tw * 0.6, 0], [-tw * 0.5, th * 0.12], [-tw, th], [-tw * 0.35, th * 0.22], [0.16, 0]]
      : [[0.16, 0], [-tw * 0.3, -th * 0.25], [-tw, -th], [-tw * 1.12, 0], [-tw, th], [-tw * 0.3, th * 0.25], [0.16, 0]];
    finShape(c, pts, tc, lw, [[0, 0, -tw * 0.95, -th * 0.7], [0, 0, -tw * 1.0, 0], [0, 0, -tw * 0.95, th * 0.7]]);
    c.restore();
  }
  if (shape === 'disc') {
    finShape(c, [[-0.28, -0.72], [0.02, -1.6], [-0.98, -1.38], [-0.66, -0.92], [-0.56, -0.5]], fin, lw);
    finShape(c, [[-0.28, 0.72], [0.02, 1.6], [-0.98, 1.38], [-0.66, 0.92], [-0.56, 0.5]], fin, lw);
  } else if (shape === 'shark' || shape === 'orca') {
    finShape(c, [[-0.12, -H * 0.86], [-0.12, -H * 2.35], [-0.64, -H * 2.2], [-0.46, -H * 1.3], [-0.58, -H * 0.72]], back, lw);
  } else if (shape !== 'whale' && shape !== 'puff' && shape !== 'angler') {
    finShape(c, [[0.28, -H * 0.88], [-0.06, -H * 1.62], [-0.66, -H * 0.82]], fin, lw, [[0.1, -H * 0.9, -0.1, -H * 1.45], [-0.15, -H * 0.88, -0.38, -H * 1.25]]);
    finShape(c, [[0.02, H * 0.86], [-0.16, H * 1.3], [-0.48, H * 0.8]], fin, lw);
  }
  if (shape === 'puff' && o.puff > 0.1) {
    c.strokeStyle = LINE; c.lineWidth = 0.06; c.lineCap = 'round';
    for (let i = 0; i < 20; i++) { const a = i / 20 * TAU; c.beginPath(); c.moveTo(Math.cos(a) * 0.84, Math.sin(a) * 0.84); c.lineTo(Math.cos(a) * (1.0 + 0.22 * o.puff), Math.sin(a) * (1.0 + 0.22 * o.puff)); c.stroke(); }
  }
  const bg = c.createLinearGradient(0, -H, 0, H);
  bg.addColorStop(0, back); bg.addColorStop(0.42, pal[0]); bg.addColorStop(1, shade(pal[0], 0.1));
  c.fillStyle = bg;
  bodyPath(c, shape, L, H);
  c.fill();
  c.save(); c.clip();
  c.fillStyle = belly; c.globalAlpha = shape === 'orca' ? 1 : 0.85;
  c.beginPath(); c.ellipse(L * 0.12, H * (shape === 'orca' ? 0.78 : 0.92), L * 1.02, H * (shape === 'orca' ? 0.55 : 0.6), 0, 0, TAU); c.fill(); c.globalAlpha = 1;
  if (shape === 'orca') { c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(L * 0.55, -H * 0.3, L * 0.18, H * 0.22, -0.2, 0, TAU); c.fill(); c.fillStyle = 'rgba(200,210,225,0.55)'; c.beginPath(); c.ellipse(-L * 0.35, -H * 0.55, L * 0.22, H * 0.2, 0, 0, TAU); c.fill(); }
  if (shape === 'whale') { c.strokeStyle = 'rgba(40,55,75,0.4)'; c.lineWidth = 0.035; for (let i = 0; i < 7; i++) { c.beginPath(); c.moveTo(L * 0.92 - i * 0.12, H * 0.42); c.lineTo(L * 0.22 - i * 0.12, H * 0.88); c.stroke(); } }
  if (S.stripes && pal[3]) {
    const n = S.stripes;
    for (let i = 0; i < n; i++) {
      const sx = shape === 'disc' ? -0.45 + i * 0.42 : -0.38 + i * 0.6;
      c.fillStyle = pal[3]; c.beginPath(); c.ellipse(sx, 0, shape === 'disc' ? 0.09 : 0.12, H * 1.2, shape === 'disc' ? 0.15 : 0, 0, TAU); c.fill();
      c.strokeStyle = LINE; c.lineWidth = 0.035; c.stroke();
    }
  }
  if (shape === 'slim') { c.fillStyle = 'rgba(255,255,255,0.4)'; c.fillRect(-L, -0.05, L * 1.8, 0.06); if (S.glow) { for (let i = 0; i < 6; i++) { c.fillStyle = S.glow; c.beginPath(); c.arc(-0.7 + i * 0.28, H * 0.55, 0.055, 0, TAU); c.fill(); } } }
  if (shape === 'puff') { c.fillStyle = 'rgba(90,60,20,0.32)'; for (let i = 0; i < 12; i++) { c.beginPath(); c.arc(-0.62 + (i * 0.37) % 1.24, -0.52 + (i * 0.29) % 0.72, 0.065, 0, TAU); c.fill(); } }
  if (S.id === 'tang') { c.fillStyle = pal[3]; c.beginPath(); c.moveTo(0.42, -0.36); c.quadraticCurveTo(-0.2, -0.52, -0.82, -0.1); c.quadraticCurveTo(-0.2, -0.1, 0.42, -0.15); c.fill(); }
  if (S.id === 'barra') { c.fillStyle = 'rgba(30,40,55,0.4)'; for (let i = 0; i < 7; i++) { c.beginPath(); c.ellipse(-L * 0.6 + i * 0.22, -H * 0.1 + (i % 2) * 0.12, 0.05, 0.09, 0, 0, TAU); c.fill(); } }
  if (S.id === 'tuna') { c.strokeStyle = 'rgba(255,220,80,0.75)'; c.lineWidth = 0.06; c.beginPath(); c.moveTo(-L * 0.8, -0.02); c.lineTo(L * 0.5, -0.05); c.stroke(); }
  if (shape !== 'whale' && shape !== 'orca' && shape !== 'jelly') {
    c.strokeStyle = 'rgba(20,24,48,0.16)'; c.lineWidth = 0.03;
    const step = sharky ? 0.2 : 0.17;
    for (let gx = -L * 0.75; gx < L * 0.45; gx += step) for (let gy = -H * 0.8; gy < H * 0.4; gy += step * 0.8) { const ox2 = ((Math.round(gy / (step * 0.8)) % 2) ? step * 0.5 : 0); c.beginPath(); c.arc(gx + ox2, gy, step * 0.42, 0.3 * Math.PI, 0.7 * Math.PI); c.stroke(); }
  }
  c.fillStyle = 'rgba(255,255,255,0.18)'; c.beginPath(); c.ellipse(-L * 0.05, -H * 0.62, L * 0.7, H * 0.22, -0.04, 0, TAU); c.fill();
  if (shape !== 'angler') mouthIn(c, shape, L, H, pal, open, !!S.teeth);
  c.restore();
  bodyPath(c, shape, L, H);
  inkLine(c, lw);
  const gx = sharky || shape === 'whale' ? L * 0.38 : L * 0.3;
  c.strokeStyle = 'rgba(21,24,48,0.55)'; c.lineWidth = 0.045; c.beginPath(); c.arc(gx - H * 0.55, 0, H * 0.6, -0.55, 0.55); c.stroke();
  if (shape === 'shark') { c.strokeStyle = 'rgba(40,50,70,0.55)'; c.lineWidth = 0.032; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(L * 0.42 - i * 0.08, -H * 0.3); c.lineTo(L * 0.39 - i * 0.08, H * 0.25); c.stroke(); } }
  c.fillStyle = 'rgba(255,255,255,0.42)'; c.beginPath(); c.ellipse(L * 0.25, -H * 0.58, L * 0.26, H * 0.11, -0.22, 0, TAU); c.fill();
  if (shape !== 'whale') {
    c.save(); c.translate(L * 0.12, H * 0.32); c.rotate(-0.45 + wag * 0.45);
    c.globalAlpha = 0.92; c.fillStyle = fin; c.beginPath(); c.moveTo(0.04, 0); c.quadraticCurveTo(-0.2, -0.14, -0.42, -0.02); c.quadraticCurveTo(-0.22, 0.12, 0.04, 0); c.fill(); c.globalAlpha = 1; inkLine(c, lw * 0.8);
    c.restore();
  } else {
    c.save(); c.translate(L * 0.4, H * 0.6); c.rotate(0.7 + wag * 0.2); c.fillStyle = back; c.beginPath(); c.ellipse(-0.1, 0, 0.34, 0.09, 0, 0, TAU); c.fill(); inkLine(c, lw * 0.8); c.restore();
  }
  if (shape === 'angler') {
    c.strokeStyle = LINE; c.lineWidth = 0.06; c.beginPath(); c.moveTo(0.4, -H * 0.85); c.quadraticCurveTo(0.9, -H * 1.95, 1.36, -H * 1.12); c.stroke();
    c.fillStyle = S.glow || '#FFF3A0'; c.beginPath(); c.arc(1.4, -H * 1.04, 0.15, 0, TAU); c.fill(); inkLine(c, 0.04);
  }
  const ex = shape === 'whale' ? L * 0.62 : sharky ? L * 0.6 : L * 0.52;
  const ey = shape === 'whale' ? H * 0.1 : -H * (shape === 'disc' ? 0.14 : 0.26);
  const er = shape === 'whale' ? 0.1 : sharky ? 0.12 : shape === 'slim' ? 0.13 : shape === 'disc' ? 0.19 : 0.21;
  eye2(c, ex, ey, er, !!S.hunter, shape === 'angler' ? '#2A0A10' : null);
  if (!S.hunter && shape !== 'whale' && shape !== 'orca' && !sharky) { c.fillStyle = 'rgba(255,110,140,0.42)'; c.beginPath(); c.ellipse(ex - er * 0.2, ey + er * 1.55, er * 0.7, er * 0.38, 0, 0, TAU); c.fill(); }
  if (shape === 'angler') { c.save(); bodyPath(c, 'round', L, H); c.clip(); mouthIn(c, 'round', L, H, pal, Math.max(open, 0.7), true); c.restore(); }
}

const spriteCache = new Map();
function spriteFor(key, shape, pal, S, frame, open, puff) {
  const lv = open === 'suck' ? 1.5 : open === true ? 1 : open ? Math.round(Math.min(1, open) * 2) / 2 : 0;
  const ck = `${key}|${frame}|${lv}|${puff ? 1 : 0}`;
  let cv = spriteCache.get(ck);
  if (cv) return cv;
  if (typeof document === 'undefined') return null;
  cv = document.createElement('canvas');
  cv.width = Math.round((BOX.x1 - BOX.x0) * K); cv.height = Math.round((BOX.y1 - BOX.y0) * K);
  const c = cv.getContext('2d');
  c.setTransform(K, 0, 0, K, -BOX.x0 * K, -BOX.y0 * K);
  c.lineJoin = 'round';
  paintFish(c, shape, pal, { wag: [-1, -0.35, 0.35, 1][frame], open: lv, S, puff: puff ? 1 : 0 });
  spriteCache.set(ck, cv);
  return cv;
}
export function warmSprites() {
  SPECIES.forEach((S, i) => S.pal.forEach((pal, pv) => { for (let f = 0; f < 4; f++) spriteFor(`n${i}.${pv}`, S.shape, pal, S, f, false, false); }));
}

const labelCache = new Map();
function label(text, col) {
  const k = `${text}|${col}`;
  let cv = labelCache.get(k);
  if (cv) return cv;
  if (typeof document === 'undefined') return null;
  cv = document.createElement('canvas');
  const fs = 44;
  const c0 = cv.getContext('2d');
  c0.font = `900 ${fs}px ${FF}`;
  const w = Math.ceil(c0.measureText(text).width) + 16;
  cv.width = w; cv.height = fs + 14;
  const c = cv.getContext('2d');
  c.font = `900 ${fs}px ${FF}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  c.lineWidth = 7; c.strokeStyle = 'rgba(8,14,28,0.88)'; c.strokeText(text, w / 2, cv.height / 2 + 1);
  c.fillStyle = col; c.fillText(text, w / 2, cv.height / 2 + 1);
  labelCache.set(k, cv);
  if (labelCache.size > 600) { const first = labelCache.keys().next().value; labelCache.delete(first); }
  return cv;
}
export function fmtN(v) {
  const n = Math.floor(v);
  if (n < 10000) return String(n);
  if (n < 1e6) return `${(n / 1000).toFixed(n < 1e5 ? 1 : 0).replace(/\.0$/, '')}k`;
  if (n < 1e9) return `${(n / 1e6).toFixed(n < 1e7 ? 2 : 1).replace(/\.?0+$/, '')}m`;
  if (n < 1e12) return `${(n / 1e9).toFixed(n < 1e10 ? 2 : 1).replace(/\.?0+$/, '')}b`;
  return `${(n / 1e12).toFixed(1).replace(/\.0$/, '')}t`;
}

export function makeDeco(seed) {
  const R = rngOf(`deco:${seed}`);
  const D = { items: [], kelp: [], hills: [], vents: [], snow: [], wreck: { x: 803, y: floorAt(803) } };
  for (let x = 2; x < WW; x += 1.2 + R() * 2.2) {
    const fy = floorAt(x);
    const reg = regionAt(x);
    const r = R();
    if (reg === 'reef') {
      if (r < 0.32) D.items.push({ k: 'coral', x, y: fy, s: 0.7 + R() * 1.3, c: ['#FF7A8A', '#FF9F5A', '#B57BFF', '#FF5FA2', '#FFD166', '#5EE6D2'][Math.floor(R() * 6)], v: Math.floor(R() * 3), seed: R() * 100 });
      else if (r < 0.5) D.items.push({ k: 'anem', x, y: fy, s: 0.6 + R() * 0.8, c: ['#FF8FB1', '#FFB86B', '#9BE7FF'][Math.floor(R() * 3)], seed: R() * 100 });
      else if (r < 0.66) D.items.push({ k: 'grass', x, y: fy, s: 0.8 + R() * 1.4, seed: R() * 100 });
      else if (r < 0.76) D.items.push({ k: 'rock', x, y: fy, s: 0.8 + R() * 2, c: ['#6F8396', '#7D92A6', '#5E7184'][Math.floor(R() * 3)] });
      else if (r < 0.84) D.items.push({ k: 'shell', x, y: fy, s: 0.3 + R() * 0.3, c: ['#FFE0C8', '#FFB8A0', '#F6D27A'][Math.floor(R() * 3)], v: Math.floor(R() * 2) });
      if (R() < 0.18) D.kelp.push({ x, y: fy, h: 6 + R() * 12, ph: R() * 6, w: 0.25 + R() * 0.2 });
    } else if (reg === 'kelp') {
      if (r < 0.2) D.items.push({ k: 'rock', x, y: fy, s: 1 + R() * 2.4, c: ['#4E6276', '#5A6E84'][Math.floor(R() * 2)] });
      else if (r < 0.45) D.items.push({ k: 'grass', x, y: fy, s: 1 + R() * 1.6, seed: R() * 100 });
      if (R() < 0.62) D.kelp.push({ x, y: fy, h: 30 + R() * 70, ph: R() * 6, w: 0.4 + R() * 0.35, tall: 1 });
    } else if (reg === 'open') {
      if (r < 0.22) D.items.push({ k: 'rock', x, y: fy, s: 1.2 + R() * 3, c: ['#46586C', '#506378'][Math.floor(R() * 2)] });
      else if (r < 0.36) D.items.push({ k: 'grass', x, y: fy, s: 1 + R() * 1.4, seed: R() * 100 });
      else if (r < 0.42) D.items.push({ k: 'shell', x, y: fy, s: 0.4 + R() * 0.4, c: ['#E8D6C0', '#C9B49A'][Math.floor(R() * 2)], v: Math.floor(R() * 2) });
      if (R() < 0.05) D.kelp.push({ x, y: fy, h: 12 + R() * 20, ph: R() * 6, w: 0.35 + R() * 0.2 });
    } else if (reg === 'abyss') {
      if (r < 0.22) D.items.push({ k: 'rock', x, y: fy, s: 1.5 + R() * 4, c: ['#2E3B4C', '#36465A'][Math.floor(R() * 2)] });
      else if (r < 0.38) D.items.push({ k: 'tube', x, y: fy, s: 0.8 + R() * 1.4, seed: R() * 100 });
      else if (r < 0.52) D.items.push({ k: 'shroom', x, y: fy, s: 0.6 + R() * 1.2, c: ['#7DF9FF', '#C9A6FF', '#9BFF9E'][Math.floor(R() * 3)], seed: R() * 100 });
      else if (r < 0.58) D.vents.push({ x, y: fy, s: 1 + R() * 1.5 });
    } else {
      if (r < 0.35) D.items.push({ k: 'rock', x, y: fy, s: 1 + R() * 3, c: ['#4E6276', '#5A6E84'][Math.floor(R() * 2)] });
      else if (r < 0.5) D.items.push({ k: 'grass', x, y: fy, s: 1 + R() * 1.6, seed: R() * 100 });
      if (R() < 0.1) D.kelp.push({ x, y: fy, h: 10 + R() * 22, ph: R() * 6, w: 0.35 + R() * 0.25 });
    }
  }
  for (const it of D.items) {
    if (it.k !== 'rock') continue;
    const pts = [];
    const n = 8 + Math.floor(R() * 3);
    for (let i = 0; i <= n; i++) { const a = Math.PI + (i / n) * Math.PI; const rr = 0.72 + R() * 0.38; pts.push([Math.cos(a) * 0.98 * rr, Math.sin(a) * (0.5 + R() * 0.25) * rr]); }
    it.pts = pts;
  }
  for (let i = 0; i < 90; i++) D.snow.push({ x: R(), y: R(), s: 0.6 + R() * 1.6, v: 0.01 + R() * 0.03, ph: R() * 6 });
  D.items.sort((a, b) => a.x - b.x);
  return D;
}

function depthColor(y) {
  const stops = [[0, [86, 194, 226]], [40, [38, 146, 196]], [100, [20, 98, 158]], [170, [12, 62, 116]], [240, [7, 34, 74]], [310, [4, 18, 44]], [420, [2, 8, 22]]];
  for (let i = 1; i < stops.length; i++) if (y <= stops[i][0]) { const a = stops[i - 1], b = stops[i]; const k = (y - a[0]) / (b[0] - a[0]); return a[1].map((v, j) => Math.round(v + (b[1][j] - v) * k)); }
  return stops[stops.length - 1][1];
}
const rgb = (c, a) => (a == null ? `rgb(${c[0]},${c[1]},${c[2]})` : `rgba(${c[0]},${c[1]},${c[2]},${a})`);

function strand(c, X, Y, S, x, base, h, w, ph, t, col) {
  const seg = 8;
  let px = X(x), py = Y(base);
  c.strokeStyle = col; c.fillStyle = col; c.lineCap = 'round';
  for (let i = 1; i <= seg; i++) {
    const f = i / seg;
    const sw = Math.sin(t * 0.7 + ph + f * 2.2) * f * h * 0.08;
    const nx = X(x + sw), ny = Y(base - h * f);
    c.lineWidth = Math.max(1, w * S * (1.1 - f * 0.55));
    c.beginPath(); c.moveTo(px, py); c.lineTo(nx, ny); c.stroke();
    if (i < seg && w * S > 1.5) { const side = i % 2 ? 1 : -1; c.beginPath(); c.ellipse(nx + side * w * S * 1.5, ny + w * S * 0.3, w * S * 1.7, w * S * 0.55, side * 0.6, 0, TAU); c.fill(); }
    px = nx; py = ny;
  }
}

function vn2(x) { const i = Math.floor(x), f = x - i; const h = (k) => { const q = Math.sin(k * 127.1 + 311.7) * 43758.5453; return q - Math.floor(q); }; const u = f * f * (3 - 2 * f); return h(i) * (1 - u) + h(i + 1) * u; }
const hash1 = (i) => { const q = Math.sin(i * 12.9898) * 43758.5453; return q - Math.floor(q); };
function ridge(x, L) { return floorAt(clamp(x, 0, WW)) - (L ? 12 : 36) + (vn2(x * 0.018 + L * 11) - 0.5) * (L ? 24 : 44) + (vn2(x * 0.063 + L * 5) - 0.5) * (L ? 8 : 13); }
let grainCv = null, causticCv = null;
function grainTile() {
  if (grainCv || typeof document === 'undefined') return grainCv;
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 128;
  const c = cv.getContext('2d'); const R = rngOf('grain');
  for (let i = 0; i < 1500; i++) { const lt = R() < 0.45; c.fillStyle = lt ? `rgba(255,246,222,${0.18 + R() * 0.2})` : `rgba(58,40,22,${0.16 + R() * 0.22})`; const z = R() < 0.85 ? 1 : 2; c.fillRect(Math.floor(R() * 128), Math.floor(R() * 128), z, z); }
  grainCv = cv;
  return cv;
}
function causticTile() {
  if (causticCv || typeof document === 'undefined') return causticCv;
  const S = 192, cv = document.createElement('canvas'); cv.width = S; cv.height = S;
  const c = cv.getContext('2d'); const R = rngOf('caustic');
  const pts = []; for (let i = 0; i < 18; i++) pts.push([R() * S, R() * S]);
  const img = c.createImageData(S, S);
  const TW = (2 * Math.PI) / S;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const wx = x + Math.sin(y * TW * 2 + 1.3) * 7 + Math.sin(y * TW * 5) * 2.5, wy = y + Math.sin(x * TW * 2 + 0.4) * 7 + Math.sin(x * TW * 4 + 2) * 2.5;
    let d1 = 1e9, d2 = 1e9;
    for (const [px, py] of pts) for (let ox2 = -S; ox2 <= S; ox2 += S) for (let oy2 = -S; oy2 <= S; oy2 += S) { const dx = wx - px - ox2, dy = wy - py - oy2; const d = dx * dx + dy * dy; if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; }
    const e = Math.sqrt(d2) - Math.sqrt(d1);
    const v = Math.max(0, 1 - e / 5.5);
    const i = (y * S + x) * 4;
    img.data[i] = 235; img.data[i + 1] = 252; img.data[i + 2] = 255; img.data[i + 3] = Math.round(v * v * 255);
  }
  c.putImageData(img, 0, 0);
  causticCv = cv;
  return cv;
}

function drawBackdrop(c, V, D, t) {
  const { cw, ch, s, ox, oy } = V;
  const y0 = -oy / s, y1 = (ch - oy) / s;
  const g = c.createLinearGradient(0, 0, 0, ch);
  for (let i = 0; i <= 6; i++) { const yy = y0 + (y1 - y0) * i / 6; g.addColorStop(i / 6, rgb(depthColor(Math.max(0, yy)))); }
  c.fillStyle = g; c.fillRect(0, 0, cw, ch);
  if (y0 < 0) { const sg = c.createLinearGradient(0, 0, 0, Math.max(1, oy)); sg.addColorStop(0, '#BFE7F7'); sg.addColorStop(1, '#E6F7FD'); c.fillStyle = sg; c.fillRect(0, 0, cw, Math.max(0, oy)); }
  const cx = (cw / 2 - ox) / s, cy = (ch / 2 - oy) / s;
  for (const [k, L, a, dk] of [[0.3, 0, 0.5, 0.62], [0.58, 1, 0.62, 0.5]]) {
    const X = (wx) => cw / 2 + (wx - cx) * s * k, Y = (wy) => ch / 2 + (wy - cy) * s * k;
    const wx0 = cx - cw / 2 / (s * k) - 6, wx1 = cx + cw / 2 / (s * k) + 6;
    const step = Math.max(0.8, (wx1 - wx0) / 110);
    const fog = depthColor(clamp(cy + (L ? 14 : 34), 0, WH)).map((v) => Math.round(v * dk));
    c.fillStyle = rgb(fog, a);
    c.beginPath(); c.moveTo(X(wx0), ch + 10);
    for (let x = wx0; x <= wx1 + step; x += step) c.lineTo(X(x), Y(ridge(x, L)));
    c.lineTo(X(wx1 + step), ch + 10); c.closePath(); c.fill();
    if (L) {
      c.strokeStyle = rgb(fog.map((v) => Math.round(v * 0.82)), 0.55); c.lineCap = 'round';
      for (let i = Math.floor(wx0 / 9); i <= Math.ceil(wx1 / 9); i++) {
        const kx = i * 9 + hash1(i) * 6;
        if (regionAt(clamp(kx, 0, WW)) !== 'kelp' && hash1(i * 3) > 0.12) continue;
        const by = ridge(kx, 1), hh = 18 + hash1(i * 7) * 34;
        c.lineWidth = Math.max(1, s * k * 0.55);
        c.beginPath(); c.moveTo(X(kx), Y(by));
        for (let j = 1; j <= 6; j++) { const f = j / 6; c.lineTo(X(kx + Math.sin(t * 0.6 + i + f * 2.4) * f * 2.2), Y(by - hh * f)); }
        c.stroke();
      }
    }
  }
  if (cy < 200) {
    c.save(); c.globalCompositeOperation = 'lighter';
    const a = clamp(1 - cy / 200, 0, 1) * 0.13;
    const top = Math.max(-20, oy), rk = 0.8, sp = 24;
    const first = Math.floor((cx - cw / 2 / (s * rk)) / sp) - 2, last = Math.ceil((cx + cw / 2 / (s * rk)) / sp) + 1;
    for (let i = first; i <= last; i++) {
      if (hash1(i * 5) < 0.35) continue;
      const wx = i * sp + hash1(i) * 10;
      const sx = cw / 2 + (wx - cx) * s * rk;
      const w1 = Math.min(90, (1.2 + hash1(i * 3) * 3) * s * rk), len = (70 + hash1(i * 7) * 80) * s;
      const al = a * 0.82 * (0.5 + 0.5 * Math.sin(t * 0.32 + i * 1.7));
      if (al <= 0.005) continue;
      const ct = sx + w1 * 0.5, cb = sx + len * 0.2 + w1;
      for (const [f, m] of [[2.2, 0.3], [1.3, 0.42], [0.55, 0.55]]) {
        const lg = c.createLinearGradient(0, top, 0, top + len); lg.addColorStop(0, `rgba(214,246,255,${al * m})`); lg.addColorStop(1, 'rgba(214,246,255,0)');
        c.fillStyle = lg; c.beginPath(); c.moveTo(ct - w1 * 0.5 * f, top); c.lineTo(ct + w1 * 0.5 * f, top); c.lineTo(cb + w1 * 1.4 * f, top + len); c.lineTo(cb - w1 * 1.4 * f, top + len); c.closePath(); c.fill();
      }
    }
    c.restore();
  }
  if (y0 < 1.5) {
    c.fillStyle = 'rgba(240,252,255,0.6)';
    const sx0 = Math.max(0, Math.floor(-ox / s)), sx1 = Math.min(WW, Math.ceil((cw - ox) / s));
    const st = Math.max(0.25, 3 / s);
    c.beginPath(); c.moveTo(ox + sx0 * s, oy);
    for (let x = sx0; x <= sx1; x += st) c.lineTo(ox + x * s, oy + (Math.sin(t * 1.6 + x * 0.7) * 0.1 + Math.sin(t * 2.3 + x * 1.9) * 0.05) * s);
    c.lineTo(ox + sx1 * s, oy - 4); c.lineTo(ox + sx0 * s, oy - 4); c.closePath(); c.fill();
  }
}

function drawFloor(c, V, D, t, parts) {
  const { cw, ch, s, ox, oy } = V;
  const x0 = Math.max(0, (-ox) / s - 2), x1 = Math.min(WW, (cw - ox) / s + 2);
  const K2 = layerKelp(c, V, D, t, x0, x1);
  c.beginPath();
  const step = Math.max(0.25, 2 / s);
  c.moveTo(ox + x0 * s, ch + 10);
  for (let x = x0; x <= x1 + step; x += step) c.lineTo(ox + x * s, oy + floorAt(x) * s);
  c.lineTo(ox + x1 * s + 20, ch + 10); c.closePath();
  const fyMid = floorAt((x0 + x1) / 2);
  const g = c.createLinearGradient(0, oy + (fyMid - 4) * s, 0, oy + (fyMid + 12) * s);
  const shelf = fyMid < 130;
  g.addColorStop(0, shelf ? '#E2CC98' : '#56677C'); g.addColorStop(0.35, shelf ? '#C9AE78' : '#3E4D61'); g.addColorStop(1, shelf ? '#8E7347' : '#1C2533');
  c.fillStyle = g; c.fill();
  c.save(); c.clip();
  const gr = grainTile();
  if (gr) { const pat = c.createPattern(gr, 'repeat'); if (pat) { try { pat.setTransform(new DOMMatrix([1, 0, 0, 1, Math.round(ox % 128), Math.round(oy % 128)])); } catch {} c.globalAlpha = shelf ? 0.7 : 0.45; c.fillStyle = pat; c.fillRect(0, 0, cw, ch); c.globalAlpha = 1; } }
  if (fyMid < 190) {
    const tile = causticTile();
    const ca = clamp((190 - fyMid) / 100, 0, 1) * 0.2;
    if (tile && ca > 0.01) {
      c.globalCompositeOperation = 'lighter';
      const T = 260;
      for (const [dx, dy, al] of [[t * 7, t * 3, ca], [-t * 5, t * 5, ca * 0.75]]) {
        const offx = (((ox * 0.92 + dx) % T) + T) % T - T, offy = (((oy * 0.92 + dy) % T) + T) % T - T;
        c.globalAlpha = al;
        for (let X = offx; X < cw; X += T) for (let Y = offy; Y < ch; Y += T) c.drawImage(tile, X, Y, T, T);
      }
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    }
  }
  c.strokeStyle = shelf ? 'rgba(112,84,44,0.28)' : 'rgba(0,0,0,0.2)'; c.lineWidth = Math.max(1, s * 0.06);
  for (const d of [1.4, 3.4, 6.2]) { c.beginPath(); for (let x = x0; x <= x1 + step; x += step) { const X = ox + x * s, Y = oy + (floorAt(x) + d + Math.sin(x * 1.3 + d * 2) * 0.25) * s; if (x === x0) c.moveTo(X, Y); else c.lineTo(X, Y); } c.stroke(); }
  c.restore();
  c.strokeStyle = shelf ? 'rgba(255,245,220,0.5)' : 'rgba(150,180,210,0.25)'; c.lineWidth = Math.max(1, s * 0.08);
  c.beginPath(); for (let x = x0; x <= x1 + step; x += step) { const X = ox + x * s, Y = oy + floorAt(x) * s; if (x === x0) c.moveTo(X, Y); else c.lineTo(X, Y); } c.stroke();
  for (const it of D.items) {
    if (it.x < x0 - 6 || it.x > x1 + 6) continue;
    const X = ox + it.x * s, Y = oy + it.y * s + s * 0.2, S = s * it.s;
    if (Y - S * 4 > ch || Y < -S * 4) continue;
    if (it.k === 'rock') {
      c.fillStyle = 'rgba(0,0,0,0.22)'; c.beginPath(); c.ellipse(X + S * 0.08, Y + S * 0.06, S * 1.05, S * 0.17, 0, 0, TAU); c.fill();
      const rg = c.createLinearGradient(0, Y - S * 0.7, 0, Y + S * 0.1); rg.addColorStop(0, shade(it.c, 0.2)); rg.addColorStop(0.5, it.c); rg.addColorStop(1, shade(it.c, -0.4));
      c.fillStyle = rg; c.beginPath();
      const P = it.pts;
      if (P) { c.moveTo(X + P[0][0] * S, Y + S * 0.1); for (const [px, py] of P) c.lineTo(X + px * S, Y + py * S); c.lineTo(X + P[P.length - 1][0] * S, Y + S * 0.1); c.closePath(); } else c.ellipse(X, Y, S * 0.9, S * 0.55, 0, Math.PI, TAU);
      c.fill();
      if (P && S > 6) { c.strokeStyle = 'rgba(255,255,255,0.13)'; c.lineWidth = Math.max(1, S * 0.05); c.beginPath(); for (let i = 1; i < P.length * 0.55; i++) { const [px, py] = P[i]; if (i === 1) c.moveTo(X + px * S, Y + py * S + S * 0.04); else c.lineTo(X + px * S, Y + py * S + S * 0.04); } c.stroke(); }
    } else if (it.k === 'coral') {
      c.strokeStyle = it.c; c.fillStyle = it.c; c.lineCap = 'round';
      if (it.v === 0) {
        const br = (x, y, ang, len, w, d) => { if (d > 3 || len * 1 < 0.6) return; const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len; c.lineWidth = Math.max(1, w); c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke(); if (d === 3) { c.beginPath(); c.arc(x2, y2, w * 0.7, 0, TAU); c.fill(); } br(x2, y2, ang - 0.45, len * 0.72, w * 0.75, d + 1); br(x2, y2, ang + 0.4, len * 0.7, w * 0.75, d + 1); };
        br(X, Y, -Math.PI / 2, S * 0.7, Math.max(1.5, S * 0.18), 0);
      } else if (it.v === 1) {
        for (let i = 0; i < 5; i++) { c.beginPath(); c.ellipse(X + (i - 2) * S * 0.2, Y - S * (0.3 + (i % 2) * 0.22), S * 0.13, S * 0.3, 0, 0, TAU); c.fill(); }
        c.fillStyle = 'rgba(255,255,255,0.25)'; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(X + (i - 2) * S * 0.2, Y - S * (0.48 + (i % 2) * 0.22), S * 0.05, 0, TAU); c.fill(); }
      } else {
        c.beginPath(); c.ellipse(X, Y - S * 0.3, S * 0.55, S * 0.38, 0, Math.PI, TAU); c.fill();
        c.strokeStyle = 'rgba(0,0,0,0.18)'; c.lineWidth = Math.max(1, S * 0.03); for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(X, Y, S * (0.15 + i * 0.1), Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
      }
    } else if (it.k === 'anem') {
      c.strokeStyle = it.c; c.lineCap = 'round'; c.lineWidth = Math.max(1, S * 0.08);
      for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * 0.22 + Math.sin(t * 1.5 + it.seed + i) * 0.12; c.beginPath(); c.moveTo(X, Y - S * 0.15); c.quadraticCurveTo(X + Math.cos(a) * S * 0.3, Y - S * 0.15 + Math.sin(a) * S * 0.3, X + Math.cos(a) * S * 0.6, Y - S * 0.15 + Math.sin(a) * S * 0.62); c.stroke(); }
      c.fillStyle = shade(it.c, -0.25); c.beginPath(); c.ellipse(X, Y - S * 0.1, S * 0.25, S * 0.14, 0, 0, TAU); c.fill();
    } else if (it.k === 'grass') {
      c.strokeStyle = '#3BB373'; c.lineCap = 'round'; c.lineWidth = Math.max(1, S * 0.06);
      for (let i = 0; i < 5; i++) { const sw = Math.sin(t * 1.2 + it.seed + i) * S * 0.2; c.beginPath(); c.moveTo(X + (i - 2) * S * 0.12, Y); c.quadraticCurveTo(X + (i - 2) * S * 0.15 + sw * 0.5, Y - S * 0.5, X + (i - 2) * S * 0.18 + sw, Y - S * (0.8 + (i % 2) * 0.3)); c.stroke(); }
    } else if (it.k === 'shell') {
      c.save(); c.translate(X, Y - S * 0.1); c.fillStyle = it.c;
      if (it.v === 0) { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5; const rr = i % 2 ? S * 0.35 : S * 0.8; if (i) c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); else c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.closePath(); c.fill(); }
      else { c.beginPath(); c.arc(0, 0, S * 0.6, Math.PI, TAU); c.closePath(); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.15)'; c.lineWidth = 1; for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(Math.PI + i * Math.PI / 4) * S * 0.6, Math.sin(Math.PI + i * Math.PI / 4) * S * 0.6); c.stroke(); } }
      c.restore();
    } else if (it.k === 'tube') {
      for (let i = 0; i < 4; i++) {
        const tx = X + (i - 1.5) * S * 0.25, th = S * (0.6 + (i % 2) * 0.4);
        c.fillStyle = '#E8E2D0'; c.fillRect(tx - S * 0.06, Y - th, S * 0.12, th);
        c.fillStyle = '#FF4F5E'; c.beginPath(); c.arc(tx, Y - th, S * 0.12 + Math.sin(t * 2 + i + it.seed) * S * 0.02, 0, TAU); c.fill();
      }
    } else if (it.k === 'shroom') {
      c.save(); c.globalCompositeOperation = 'lighter';
      const gg = c.createRadialGradient(X, Y - S * 0.5, 0, X, Y - S * 0.5, S * 1.6); gg.addColorStop(0, `${it.c}66`); gg.addColorStop(1, `${it.c}00`);
      c.fillStyle = gg; c.fillRect(X - S * 1.6, Y - S * 2.1, S * 3.2, S * 3.2); c.restore();
      c.fillStyle = '#C8D4E0'; c.fillRect(X - S * 0.06, Y - S * 0.5, S * 0.12, S * 0.5);
      c.fillStyle = it.c; c.beginPath(); c.ellipse(X, Y - S * 0.5, S * 0.35, S * 0.2, 0, Math.PI, TAU); c.fill();
    }
  }
  for (const v of D.vents) {
    if (v.x < x0 - 4 || v.x > x1 + 4) continue;
    const X = ox + v.x * s, Y = oy + v.y * s, S = s * v.s;
    c.fillStyle = '#2A2F3C'; c.beginPath(); c.moveTo(X - S * 0.6, Y); c.lineTo(X - S * 0.25, Y - S * 1.4); c.lineTo(X + S * 0.25, Y - S * 1.4); c.lineTo(X + S * 0.6, Y); c.fill();
    c.save(); c.globalCompositeOperation = 'lighter'; const gg = c.createRadialGradient(X, Y - S * 1.4, 0, X, Y - S * 1.4, S * 1.2); gg.addColorStop(0, 'rgba(255,140,60,0.5)'); gg.addColorStop(1, 'rgba(255,140,60,0)'); c.fillStyle = gg; c.fillRect(X - S * 1.2, Y - S * 2.6, S * 2.4, S * 2.4); c.restore();
    if (parts && Math.random() < 0.25) parts.push({ k: 'bub', x: v.x + (Math.random() - 0.5) * 0.4, y: v.y - v.s * 1.4, vx: (Math.random() - 0.5) * 0.3, vy: -1.2 - Math.random(), life: 2.5, max: 2.5, r: 0.12 + Math.random() * 0.15, ph: Math.random() * 6 });
  }
  return K2;
}
function layerKelp(c, V, D, t, x0, x1) {
  const { s, ox, oy } = V;
  const X = (wx) => ox + wx * s, Y = (wy) => oy + wy * s;
  for (const kp of D.kelp) {
    if (kp.x < x0 - 6 || kp.x > x1 + 6) continue;
    strand(c, X, Y, s, kp.x, kp.y + 0.3, kp.h, kp.w, kp.ph, t, kp.tall ? 'rgba(52,138,78,0.86)' : kp.y < 120 ? 'rgba(46,150,96,0.85)' : 'rgba(30,96,84,0.75)');
  }
  return null;
}

function drawWreck(c, V, D) {
  const W = D.wreck;
  if (!W) return;
  const { cw, ch, s, ox, oy } = V;
  const X = ox + W.x * s, Y = oy + W.y * s;
  if (X < -60 * s || X > cw + 60 * s || Y < -40 * s || Y > ch + 40 * s) return;
  c.save(); c.translate(X, Y + s * 2); c.rotate(-0.12); c.scale(s, s);
  c.fillStyle = '#4A3424'; c.strokeStyle = 'rgba(10,8,6,0.55)'; c.lineWidth = 0.35;
  c.beginPath(); c.moveTo(-30, -2); c.lineTo(26, -4); c.quadraticCurveTo(33, -6, 31, -12); c.lineTo(-24, -13); c.quadraticCurveTo(-32, -10, -30, -2); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#5E4430'; c.fillRect(-24, -16, 44, 3.2);
  c.strokeStyle = 'rgba(20,14,10,0.6)'; c.lineWidth = 0.25;
  for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(-26 + i * 9, -12.6); c.lineTo(-27 + i * 9.4, -2.5); c.stroke(); }
  c.fillStyle = '#1B2733';
  for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(-14 + i * 9, -8, 1.3, 0, TAU); c.fill(); }
  c.strokeStyle = '#3B2A1D'; c.lineWidth = 1.2; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-4, -15.5); c.lineTo(-7, -36); c.stroke();
  c.beginPath(); c.moveTo(14, -15.5); c.lineTo(18, -30); c.stroke();
  c.lineWidth = 0.6; c.beginPath(); c.moveTo(-9.5, -31); c.lineTo(-3.5, -31.6); c.stroke();
  c.fillStyle = 'rgba(214,200,170,0.55)';
  c.beginPath(); c.moveTo(-6.6, -34); c.quadraticCurveTo(1, -29, -2, -22); c.lineTo(-5.8, -21); c.closePath(); c.fill();
  c.restore();
}
function drawChests(c, V, G, t) {
  const { cw, ch, s, ox, oy } = V;
  for (const b of G.chests || []) {
    const X = ox + b.x * s, Y = oy + b.y * s, S = s * 1.25;
    if (X < -S * 3 || X > cw + S * 3 || Y < -S * 3 || Y > ch + S * 3) continue;
    const shut = b.cool <= 0;
    c.save(); c.translate(X, Y);
    if (shut) { const gl = 0.25 + Math.sin(t * 2.4 + b.id) * 0.12; c.fillStyle = `rgba(255,220,110,${gl})`; c.beginPath(); c.ellipse(0, -S * 0.2, S * 2, S * 1.4, 0, 0, TAU); c.fill(); }
    c.fillStyle = '#7A4A22'; c.strokeStyle = '#2B1A0C'; c.lineWidth = Math.max(1, S * 0.08);
    c.beginPath(); c.roundRect(-S, -S * 0.75, S * 2, S * 1.05, S * 0.15); c.fill(); c.stroke();
    c.fillStyle = '#E8B33C'; c.fillRect(-S, -S * 0.42, S * 2, S * 0.16); c.fillRect(-S * 0.12, -S * 0.75, S * 0.24, S * 1.05);
    c.save();
    if (!shut) { c.translate(-S, -S * 0.75); c.rotate(-1.05); c.translate(S, S * 0.75); }
    c.fillStyle = '#8C5629'; c.beginPath(); c.moveTo(-S, -S * 0.75); c.quadraticCurveTo(0, -S * 1.45, S, -S * 0.75); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#E8B33C'; c.fillRect(-S * 0.12, -S * 1.12, S * 0.24, S * 0.37);
    c.restore();
    if (!shut) { c.fillStyle = 'rgba(30,18,8,0.8)'; c.fillRect(-S * 0.85, -S * 0.72, S * 1.7, S * 0.2); }
    c.restore();
  }
}
function drawCurrents(c, V, t) {
  const { cw, ch, s, ox, oy } = V;
  c.save(); c.strokeStyle = 'rgba(220,245,255,0.18)'; c.lineCap = 'round'; c.lineWidth = Math.max(1, s * 0.12);
  for (const cu of CURRENTS) {
    const X0 = ox + cu.x0 * s, X1 = ox + cu.x1 * s, Y0 = oy + cu.y0 * s, Y1 = oy + cu.y1 * s;
    if (X1 < 0 || X0 > cw || Y1 < 0 || Y0 > ch) continue;
    const dir = cu.v > 0 ? 1 : -1;
    const span = cu.x1 - cu.x0;
    for (let i = 0; i < 40; i++) {
      const lane = cu.y0 + (cu.y1 - cu.y0) * (0.15 + 0.7 * ((i * 0.618) % 1));
      const px = cu.x0 + ((((i * 37.3) + t * Math.abs(cu.v) * 2.2 * dir) % span) + span) % span;
      const len = 3 + (i % 4);
      const x1 = ox + px * s, y1 = oy + lane * s;
      if (x1 < -40 || x1 > cw + 40 || y1 < -10 || y1 > ch + 10) continue;
      c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 - dir * len * s, y1); c.stroke();
    }
  }
  c.restore();
}

function drawPickup(c, x, y, R, k, t) {
  const bob = Math.sin(t * 3 + x * 0.01) * R * 0.15;
  c.save(); c.translate(x, y + bob);
  const g = c.createRadialGradient(-R * 0.3, -R * 0.3, R * 0.1, 0, 0, R);
  g.addColorStop(0, 'rgba(255,255,255,0.85)'); g.addColorStop(0.6, 'rgba(160,220,255,0.3)'); g.addColorStop(1, 'rgba(200,240,255,0.6)');
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, R, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = Math.max(1.5, R * 0.08); c.stroke();
  const col = { shield: '#5EC8FF', double: '#FFC21A', magnet: '#FF4F78', speed: '#5BE05A', life: '#FF4F6E' }[k];
  c.fillStyle = col; c.strokeStyle = '#1B1430'; c.lineWidth = Math.max(1.5, R * 0.12); c.lineJoin = 'round'; c.lineCap = 'round';
  const s = R * 0.55;
  c.beginPath();
  if (k === 'shield') { c.moveTo(0, -s); c.lineTo(s * 0.85, -s * 0.6); c.lineTo(s * 0.7, s * 0.3); c.lineTo(0, s); c.lineTo(-s * 0.7, s * 0.3); c.lineTo(-s * 0.85, -s * 0.6); c.closePath(); c.stroke(); c.fill(); }
  else if (k === 'double') { c.font = `900 ${R * 0.95}px ${FF}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = R * 0.16; c.strokeText('x2', 0, R * 0.06); c.fillText('x2', 0, R * 0.06); }
  else if (k === 'magnet') { c.lineWidth = R * 0.34; c.strokeStyle = '#1B1430'; c.beginPath(); c.arc(0, -s * 0.05, s * 0.62, Math.PI, TAU); c.moveTo(-s * 0.62, -s * 0.05); c.lineTo(-s * 0.62, s * 0.6); c.moveTo(s * 0.62, -s * 0.05); c.lineTo(s * 0.62, s * 0.6); c.stroke(); c.lineWidth = R * 0.18; c.strokeStyle = col; c.stroke(); }
  else if (k === 'speed') { c.moveTo(s * 0.2, -s); c.lineTo(-s * 0.5, s * 0.12); c.lineTo(s * 0.04, s * 0.12); c.lineTo(-s * 0.2, s); c.lineTo(s * 0.5, -s * 0.12); c.lineTo(-s * 0.04, -s * 0.12); c.closePath(); c.stroke(); c.fill(); }
  else { c.moveTo(0, s * 0.9); c.bezierCurveTo(-s * 1.4, -s * 0.2, -s * 0.6, -s * 1.2, 0, -s * 0.45); c.bezierCurveTo(s * 0.6, -s * 1.2, s * 1.4, -s * 0.2, 0, s * 0.9); c.closePath(); c.stroke(); c.fill(); }
  c.restore();
}

function numBadge(c, x, y, text, col, ringCol) {
  c.save();
  c.font = `900 13px ${FF}`;
  const w = Math.max(30, c.measureText(text).width + 16), h = 20;
  c.fillStyle = 'rgba(10,14,30,0.82)'; rr2(c, x - w / 2, y - h / 2, w, h, h / 2); c.fill();
  c.lineWidth = 2; c.strokeStyle = ringCol; c.stroke();
  c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = col; c.fillText(text, x, y + 0.5);
  c.restore();
}
function rr2(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function nameTag(c, x, y, text, col, mic) {
  if (!text) return;
  c.save(); c.font = `700 11.5px ${FF}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  const tw = c.measureText(text).width;
  const tx = x + (mic ? 7 : 0), ty = y - 9;
  c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,0.6)'; c.strokeText(text, tx, ty);
  c.fillStyle = col; c.fillText(text, tx, ty);
  if (mic) {
    const mx = tx - tw / 2 - 8, my = ty;
    c.fillStyle = '#7CF2A0'; c.beginPath(); c.roundRect(mx - 2.2, my - 5, 4.4, 7, 2.2); c.fill();
    c.strokeStyle = '#7CF2A0'; c.lineWidth = 1.3; c.beginPath(); c.arc(mx, my - 0.5, 3.8, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
  }
  c.restore();
}
function drawBubbleText(c, x, y, text, a, cw) {
  c.save(); c.globalAlpha = a;
  c.font = `700 13px ${FF}`;
  const tw = Math.min(170, c.measureText(text).width), bw = tw + 22, bh = 30;
  const bx = Math.max(8, Math.min(cw - bw - 8, x - bw / 2)), by = y - bh - 8;
  c.fillStyle = '#FFFFFF'; c.strokeStyle = '#1B1430'; c.lineWidth = 2.5;
  c.beginPath(); c.roundRect(bx, by, bw, bh, 13); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(x - 7, by + bh - 1); c.lineTo(x, by + bh + 7); c.lineTo(x + 7, by + bh - 1); c.fill();
  c.fillStyle = '#10202E'; c.textBaseline = 'middle'; c.fillText(text, bx + 11, by + bh / 2, 170);
  c.restore();
}

export function updateParts(P, dt) {
  for (let i = P.length - 1; i >= 0; i--) {
    const q = P[i]; q.life -= dt;
    if (q.life <= 0) { P.splice(i, 1); continue; }
    q.x += q.vx * dt; q.y += q.vy * dt;
    if (q.k === 'bub') { q.vy -= dt * 0.5; q.vx += Math.sin(q.life * 9 + q.ph) * dt * 0.4; }
    else if (q.k === 'txt' || q.k === 'big') q.vy *= 0.95;
    else { q.vx *= 0.93; q.vy *= 0.93; if (q.k === 'bit') q.vy += dt * 0.6; }
  }
  if (P.length > 420) P.splice(0, P.length - 420);
}
export function bubbles(P, x, y, n, sz) { for (let i = 0; i < n; i++) P.push({ k: 'bub', x: x + (Math.random() - 0.5) * 0.5 * (sz / 0.1), y: y + (Math.random() - 0.5) * 0.4 * (sz / 0.1), vx: (Math.random() - 0.5) * 0.6, vy: -0.6 - Math.random() * 0.8, life: 1.2 + Math.random() * 0.9, max: 2, r: (sz || 0.08) * (0.6 + Math.random() * 0.9), ph: Math.random() * 6 }); }
export function floatText(P, x, y, text, col, big) { P.push({ k: big ? 'big' : 'txt', x, y, vx: 0, vy: big ? -0.9 : -1.6, life: big ? 1.4 : 1.0, max: big ? 1.4 : 1.0, text, col: col || '#FFFFFF' }); }
export function burst(P, x, y, col, n, sp) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = (1 + Math.random() * 2.5) * (sp || 1); P.push({ k: 'dot', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.5 + Math.random() * 0.5, max: 1, r: (0.05 + Math.random() * 0.07) * (sp || 1), col }); } }
export function bits(P, x, y, col, n, sc) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = (0.5 + Math.random() * 1.6) * sc; P.push({ k: 'bit', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 0.3 * sc, life: 0.7 + Math.random() * 0.5, max: 1.2, r: (0.05 + Math.random() * 0.06) * sc, col }); } }
export function zap(P, x, y, r) { P.push({ k: 'zap', x, y, vx: 0, vy: 0, life: 0.42, max: 0.42, r, n: 9, a0: Math.random() * TAU, seed: Math.floor(Math.random() * 97) }); P.push({ k: 'ring', x, y, vx: 0, vy: 0, life: 0.5, max: 0.5, r: r * 0.8, col: '#BFF4FF' }); }
export function ring(P, x, y, r, col) { P.push({ k: 'ring', x, y, vx: 0, vy: 0, life: 0.6, max: 0.6, r, col }); }

function palOfPlayer(p, i) { return PLAYER_PAL[p.color || (p.kind === 'sun' || p.kind === 'moon' ? p.kind : `b${(i % 4) + 1}`)] || PLAYER_PAL.sun; }
export function playerColorKey(p, i) { return p.color || (p.kind === 'sun' || p.kind === 'moon' ? p.kind : `b${(i % 4) + 1}`); }

const kk0 = (p, mine) => p.kind === mine;
export function render(ctx, G, V) {
  const { cw, ch, dpr, s, ox, oy, mine, names, bubbles: bb, parts, hidden, look } = V;
  const c = ctx, t = G.t;
  const me = G.pl[mine] || G.pl[G.order[0]];
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawBackdrop(c, V, G.deco, t);
  const camY = (ch / 2 - oy) / s;
  drawWreck(c, V, G.deco);
  drawFloor(c, V, G.deco, t, parts);
  drawCurrents(c, V, t);
  drawChests(c, V, G, t);
  for (const pk of G.pk) { const x = ox + pk.x * s, y = oy + pk.y * s, R = Math.max(10, pk.r * s); if (x < -R || y < -R || x > cw + R || y > ch + R) continue; drawPickup(c, x, y, R, pk.k, t); }
  const list = [];
  for (const f of G.fish) { if (hidden && hidden.has(f.id)) continue; list.push({ k: 'f', f, r: rOf(f.n) }); }
  G.order.forEach((kk, i) => { const p = G.pl[kk]; if (!p || kk === 'demo' || (p.out && p.dead <= 0)) return; if (p.dead > 0 && p.dead < 1.5) return; list.push({ k: 'p', p, r: rOf(p.n), i }); });
  list.sort((a, b) => a.r - b.r);
  const myN = me ? me.n : 0;
  const edibleCol = '#CFFFBE', dangerCol = '#FF8C8C';
  for (const it of list) {
    if (it.k === 'f') {
      const f = it.f, x = ox + f.x * s, y = oy + f.y * s, r = Math.max(it.r * s, 4.5);
      if (x < -r * 3 || y < -r * 3 || x > cw + r * 3 || y > ch + r * 3) continue;
      const S = SPECIES[f.sp];
      const frame = Math.floor((t * (f.chase ? 14 : 7) + f.id * 0.37) % 4);
      const open = f.hunter ? (f.eat > 0.22 ? 0 : f.chase || f.warn > 0 ? 1 : f.eat > 0 ? 0.5 : 0) : 0;
      const spr = spriteFor(`n${f.sp}.${f.pv}`, S.shape, S.pal[f.pv] || S.pal[0], S, frame, open, f.puff > 0.4);
      const sc = r / K * K;
      c.save(); c.translate(x, y);
      if (S.shape !== 'jelly') { c.rotate(f.a); if (Math.cos(f.a) < 0) c.scale(1, -1); }
      const fade = f.born != null ? clamp((t - f.born) / 0.7, 0, 1) : 1;
      c.globalAlpha = fade * (f.stun ? 0.7 : 1);
      const pf = S.shape === 'puff' ? 1 + f.puff * 0.35 : 1;
      if (spr) c.drawImage(spr, BOX.x0 * r * pf, BOX.y0 * r * pf, (BOX.x1 - BOX.x0) * r * pf, (BOX.y1 - BOX.y0) * r * pf);
      c.restore();
      if (S.glow) { c.save(); c.globalCompositeOperation = 'lighter'; const gg = c.createRadialGradient(x, y, 0, x, y, r * 2.2); gg.addColorStop(0, `${S.glow}55`); gg.addColorStop(1, `${S.glow}00`); c.fillStyle = gg; c.fillRect(x - r * 2.2, y - r * 2.2, r * 4.4, r * 4.4); c.restore(); }
      if (f.stun) { c.save(); c.fillStyle = '#FFE15A'; for (let i = 0; i < 3; i++) { const a = t * 4 + i * 2.1; c.beginPath(); c.arc(x + Math.cos(a) * r * 0.9, y - r * 1.1 + Math.sin(a) * r * 0.25, Math.max(2, r * 0.12), 0, TAU); c.fill(); } c.restore(); }
      {
        const col = f.n <= myN ? edibleCol : dangerCol;
        const lb = label(fmtN(f.n), col);
        if (lb) { const lh = clamp(r * 0.58, 10, 19); const lw = lb.width / lb.height * lh; const inside = r >= 13; const lx = inside ? x - Math.cos(f.a) * r * 0.3 : x; const ly = inside ? y - (S.shape === 'jelly' ? r * 0.35 : 0) : y - r * 0.9 - lh * 0.5; c.drawImage(lb, lx - lw / 2, ly - lh / 2, lw, lh); }
      }
      if (f.hunter && (f.chase || f.warn > 0) && f.n > myN) { c.save(); c.font = `900 ${clamp(r * 0.55, 15, 22)}px ${FF}`; c.textAlign = 'center'; c.lineWidth = 4; c.strokeStyle = '#1B1430'; c.strokeText('!', x, y - r * 1.5); c.fillStyle = '#FF4F4F'; c.fillText('!', x, y - r * 1.5); c.restore(); }
      else if (f.hunter && f.n > myN && me && Math.hypot(me.x - f.x, me.y - f.y) < viewOf(myN) * 0.8) { c.save(); c.globalAlpha = 0.35; c.strokeStyle = '#FF5A5A'; c.lineWidth = 2; c.setLineDash([6, 6]); c.beginPath(); c.arc(x, y, r * 1.5, 0, TAU); c.stroke(); c.restore(); }
    } else {
      const p = it.p, x = ox + p.x * s, y = oy + p.y * s, r = it.r * s;
      if (x < -r * 4 || y < -r * 4 || x > cw + r * 4 || y > ch + r * 4) continue;
      const key = playerColorKey(p, it.i);
      const pal = PLAYER_PAL[key] || PLAYER_PAL.sun;
      const spIdx = SP_INDEX[PLAYER_SP[Math.min(PLAYER_SP.length - 1, p.stage || 0)]];
      const S = SPECIES[spIdx];
      const ringCol = RING[key] || '#FFFFFF';
      const deadA = p.dead > 0 ? clamp((p.dead - 1.5) / 0.7, 0, 1) : 1;
      c.save();
      c.globalAlpha = deadA * (p.prot > 0 && Math.floor(t * 10) % 2 === 0 ? 0.55 : 1);
      if (kk0(p, mine)) { c.save(); c.globalCompositeOperation = 'lighter'; const gl = c.createRadialGradient(x, y, r * 0.6, x, y, r * 1.8); gl.addColorStop(0, `${ringCol}2e`); gl.addColorStop(1, `${ringCol}00`); c.fillStyle = gl; c.beginPath(); c.arc(x, y, r * 1.8, 0, TAU); c.fill(); c.restore(); }
      if (p.fx.frenzy > 0) {
        c.save(); c.globalCompositeOperation = 'lighter';
        const fg = c.createRadialGradient(x, y, r * 0.5, x, y, r * 2.1); fg.addColorStop(0, 'rgba(255,90,40,0.38)'); fg.addColorStop(1, 'rgba(255,60,20,0)'); c.fillStyle = fg; c.beginPath(); c.arc(x, y, r * 2.1, 0, TAU); c.fill();
        for (let i = 0; i < 12; i++) {
          const a = i / 12 * TAU + t * 1.6; const fl = 0.75 + 0.35 * Math.sin(t * 13 + i * 2.3); const r0 = r * 1.05, r1 = r * (1.55 + 0.45 * fl);
          const nx = Math.cos(a), ny = Math.sin(a), tx = -ny, ty = nx, w = r * 0.22;
          const gg = c.createLinearGradient(x + nx * r0, y + ny * r0, x + nx * r1, y + ny * r1); gg.addColorStop(0, 'rgba(255,230,120,0.75)'); gg.addColorStop(0.5, 'rgba(255,120,40,0.55)'); gg.addColorStop(1, 'rgba(220,30,20,0)');
          c.fillStyle = gg; c.beginPath(); c.moveTo(x + nx * r0 + tx * w, y + ny * r0 + ty * w); c.quadraticCurveTo(x + nx * (r0 + r1) * 0.5 + tx * w * 1.3, y + ny * (r0 + r1) * 0.5 + ty * w * 1.3, x + nx * r1, y + ny * r1); c.quadraticCurveTo(x + nx * (r0 + r1) * 0.5 - tx * w * 0.6, y + ny * (r0 + r1) * 0.5 - ty * w * 0.6, x + nx * r0 - tx * w, y + ny * r0 - ty * w); c.closePath(); c.fill();
        }
        c.restore();
      }
      if (p.dashT > 0 || p.fx.speed > 0) {
        const ca = Math.cos(p.a), sa = Math.sin(p.a);
        c.save(); c.lineCap = 'round';
        for (let i = 0; i < 3; i++) {
          const d = r * (1.15 + i * 0.75), wv = r * (1.0 - i * 0.18), al = 0.55 - i * 0.15;
          const cx2 = x - ca * d, cy2 = y - sa * d;
          c.strokeStyle = `rgba(235,252,255,${al})`; c.lineWidth = Math.max(2, r * (0.13 - i * 0.03));
          c.beginPath(); c.moveTo(cx2 - sa * wv + ca * r * 0.35, cy2 + ca * wv + sa * r * 0.35); c.quadraticCurveTo(cx2 - ca * r * 0.25, cy2 - sa * r * 0.25, cx2 + sa * wv + ca * r * 0.35, cy2 - ca * wv + sa * r * 0.35); c.stroke();
        }
        c.strokeStyle = 'rgba(200,245,255,0.55)'; c.lineWidth = Math.max(1.5, r * 0.06);
        for (let i = 0; i < 6; i++) { const off = (i - 2.5) * r * 0.3; const ln = r * (0.9 + ((i * 7) % 3) * 0.35); const bx = x - ca * r * 1.3 - sa * off, by = y - sa * r * 1.3 + ca * off; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx - ca * ln, by - sa * ln); c.stroke(); }
        c.restore();
      }
      if (p.fx.suck > 0) {
        const k0 = Math.min(1, p.fx.suck / 0.22, (1 - p.fx.suck) / 0.1 + 0.25);
        const hx = x + Math.cos(p.a) * r * 1.02, hy = y + Math.sin(p.a) * r * 1.02, RR = suckR(p) * s, SPAN = 1.0;
        c.save();
        const sg = c.createRadialGradient(hx, hy, 0, hx, hy, RR);
        sg.addColorStop(0, `rgba(214,244,255,${0.5 * k0})`); sg.addColorStop(0.45, `rgba(190,236,255,${0.2 * k0})`); sg.addColorStop(1, 'rgba(190,236,255,0)');
        c.fillStyle = sg; c.beginPath(); c.moveTo(hx, hy); c.arc(hx, hy, RR, p.a - SPAN, p.a + SPAN); c.closePath(); c.fill();
        c.globalAlpha = 0.35 * k0; c.strokeStyle = 'rgba(230,250,255,0.9)'; c.lineWidth = Math.max(1.5, r * 0.04); c.setLineDash([Math.max(4, r * 0.18), Math.max(5, r * 0.2)]); c.lineDashOffset = t * 60;
        c.beginPath(); c.arc(hx, hy, RR * 0.96, p.a - SPAN * 0.92, p.a + SPAN * 0.92); c.stroke(); c.setLineDash([]);
        c.lineCap = 'round';
        for (let i = 0; i < 16; i++) {
          const ph = (t * 2.3 + i * 0.1237) % 1;
          const side = ((i * 0.618) % 1) - 0.5;
          const ang = p.a + side * 2 * SPAN * (1 - ph * 0.7);
          const d0 = RR * (1 - ph) + r * 0.15, d1 = Math.max(r * 0.12, d0 * 0.68);
          const sw = side * 0.5 * (1 - ph);
          c.globalAlpha = Math.sin(ph * Math.PI) * k0 * 0.95;
          c.strokeStyle = i % 3 ? 'rgba(240,252,255,0.95)' : 'rgba(170,228,255,0.95)';
          c.lineWidth = Math.max(1.6, r * 0.075 * (1 - ph * 0.5));
          const mx = (d0 + d1) / 2;
          c.beginPath(); c.moveTo(hx + Math.cos(ang) * d0, hy + Math.sin(ang) * d0); c.quadraticCurveTo(hx + Math.cos(ang + sw) * mx, hy + Math.sin(ang + sw) * mx, hx + Math.cos(ang * 0.5 + p.a * 0.5) * d1, hy + Math.sin(ang * 0.5 + p.a * 0.5) * d1); c.stroke();
        }
        c.fillStyle = 'rgba(235,250,255,0.9)';
        for (let i = 0; i < 10; i++) {
          const ph = (t * 1.7 + i * 0.173) % 1;
          const ang = p.a + (((i * 0.382) % 1) - 0.5) * 2 * SPAN * (1 - ph);
          const dd = RR * (1 - ph * ph) * 0.9 + r * 0.1;
          c.globalAlpha = Math.sin(ph * Math.PI) * k0 * 0.8;
          c.beginPath(); c.arc(hx + Math.cos(ang) * dd, hy + Math.sin(ang) * dd, Math.max(1.4, r * 0.05 * (1 - ph * 0.6)), 0, TAU); c.fill();
        }
        c.restore();
      }
      const frame = Math.floor((p.wob * 1.4) % 4);
      const near = G.fish.some((f) => f.n <= p.n && Math.hypot(f.x - p.x - Math.cos(p.a) * it.r, f.y - p.y - Math.sin(p.a) * it.r) < it.r * 1.9 + rOf(f.n));
      const open = p.fx.suck > 0 ? 'suck' : p.eat > 0.17 ? 0 : near ? 1 : p.eat > 0 ? 0.5 : 0;
      const spr = spriteFor(`p${spIdx}.${key}`, S.shape, pal, { ...S, hunter: false, teeth: S.teeth }, frame, open, false);
      c.save(); c.translate(x, y); c.rotate(p.a); if (Math.cos(p.a) < 0) c.scale(1, -1);
      if (p.dead > 0) c.rotate(Math.PI * (1 - deadA));
      if (spr) c.drawImage(spr, BOX.x0 * r, BOX.y0 * r, (BOX.x1 - BOX.x0) * r, (BOX.y1 - BOX.y0) * r);
      c.restore();
      c.restore();
      if (p.fx.shield > 0 || p.prot > 0) {
        const R2 = Math.max(1, r * 1.6 + Math.sin(t * 5) * Math.min(2.5, r * 0.08));
        c.save();
        if (p.fx.shield > 0) {
          const bg2 = c.createRadialGradient(x - R2 * 0.3, y - R2 * 0.35, R2 * 0.1, x, y, R2);
          bg2.addColorStop(0, 'rgba(255,255,255,0.05)'); bg2.addColorStop(0.72, 'rgba(150,225,255,0.12)'); bg2.addColorStop(0.92, 'rgba(120,210,255,0.42)'); bg2.addColorStop(1, 'rgba(200,245,255,0.75)');
          c.fillStyle = bg2; c.beginPath(); c.arc(x, y, R2, 0, TAU); c.fill();
          c.lineWidth = Math.max(2, r * 0.07); c.strokeStyle = 'rgba(225,248,255,0.9)'; c.stroke();
          const hues = ['rgba(255,130,200,0.5)', 'rgba(255,230,120,0.5)', 'rgba(140,255,190,0.5)', 'rgba(130,190,255,0.5)'];
          hues.forEach((col, i) => { c.strokeStyle = col; c.lineWidth = Math.max(1.5, r * 0.05); c.beginPath(); c.arc(x, y, R2 * (0.86 - i * 0.025), Math.PI * 0.95 + t * 0.4, Math.PI * 1.45 + t * 0.4); c.stroke(); });
          c.fillStyle = 'rgba(255,255,255,0.75)'; c.beginPath(); c.ellipse(x - R2 * 0.42, y - R2 * 0.5, R2 * 0.22, R2 * 0.09, -0.7, 0, TAU); c.fill();
          c.beginPath(); c.arc(x - R2 * 0.18, y - R2 * 0.68, R2 * 0.05, 0, TAU); c.fill();
          for (let i = 0; i < 3; i++) { const a = t * 2.2 + i * 2.09; c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.arc(x + Math.cos(a) * R2, y + Math.sin(a) * R2, Math.max(1.5, r * 0.06), 0, TAU); c.fill(); }
        } else { c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = Math.max(2, r * 0.06); c.setLineDash([6, 6]); c.beginPath(); c.arc(x, y, R2, 0, TAU); c.stroke(); }
        c.restore();
      }
      if (p.fx.magnet > 0) { c.save(); c.strokeStyle = 'rgba(255,90,130,0.5)'; c.lineWidth = 2; c.setLineDash([6, 6]); c.lineDashOffset = -t * 30; c.beginPath(); c.arc(x, y, r * 2.4, 0, TAU); c.stroke(); c.restore(); }
      if (p.dead <= 0) {
        const by = y - Math.max(r * 1.18, r + 10) - 11;
        numBadge(c, x, by, fmtN(p.n), p.kind === mine ? '#FFFFFF' : p.n > myN ? dangerCol : edibleCol, ringCol);
        if (p.kind !== mine) nameTag(c, x, by - 15, (names && names[p.kind]) || p.name || '', ringCol, !!(V.mics && V.mics[p.kind]));
        const b = bb && bb[p.kind];
        if (b) {
          const k = b.t / b.life;
          if (b.emo) { c.save(); c.globalAlpha = k > 0.85 ? (1 - k) / 0.15 : 1; c.font = `34px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",${FF}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(b.text, x, y - r * 1.25 - 32 - k * 24); c.restore(); }
          else { const a = Math.min(1, b.t / 0.15, (b.life - b.t) / 0.3); if (a > 0) drawBubbleText(c, x, y - r * 1.25 - 24, b.text, Math.max(0, a), cw); }
        }
      }
    }
  }
  for (const q of parts) {
    const x = ox + q.x * s, y = oy + q.y * s;
    if (x < -40 || y < -40 || x > cw + 40 || y > ch + 40) continue;
    if (q.k === 'swal') {
      const ep = G.pl[q.who];
      if (!ep) continue;
      const k = clamp(1 - q.life / q.max, 0, 1);
      const er = rOf(ep.n);
      const mx = ep.x + Math.cos(ep.a) * er * 0.9, my = ep.y + Math.sin(ep.a) * er * 0.9;
      const wx = q.x + (mx - q.x) * k * k, wy = q.y + (my - q.y) * k * k;
      const fr = rOf(q.n) * (1 - k * 0.85) * s;
      if (fr < 1.2) continue;
      const SS = SPECIES[q.sp] || SPECIES[0];
      const spr = spriteFor(`n${q.sp}.${q.pv || 0}`, SS.shape, SS.pal[q.pv || 0] || SS.pal[0], SS, 1, 0, false);
      if (!spr) continue;
      const ang = Math.atan2(my - q.y, mx - q.x) + Math.PI;
      c.save(); c.translate(ox + wx * s, oy + wy * s); c.rotate(ang); if (Math.cos(ang) < 0) c.scale(1, -1);
      c.globalAlpha = 1 - k * 0.4; c.drawImage(spr, BOX.x0 * fr, BOX.y0 * fr, (BOX.x1 - BOX.x0) * fr, (BOX.y1 - BOX.y0) * fr); c.restore();
      continue;
    }
    if (q.k === 'bub') { const rr = Math.max(1.2, q.r * s); c.strokeStyle = `rgba(225,248,255,${Math.min(0.85, q.life)})`; c.lineWidth = Math.max(1, rr * 0.18); c.beginPath(); c.arc(x, y, rr, 0, TAU); c.stroke(); c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.arc(x - rr * 0.35, y - rr * 0.35, rr * 0.28, 0, TAU); c.fill(); }
    else if (q.k === 'txt' || q.k === 'big') {
      const lb = label(q.text, q.col);
      if (lb) { const a = Math.min(1, q.life / 0.35); const lh = q.k === 'big' ? 19 : 14; const lw = lb.width / lb.height * lh; c.save(); c.globalAlpha = a; c.drawImage(lb, x - lw / 2, y - lh / 2, lw, lh); c.restore(); }
    } else if (q.k === 'zap') {
      const k = 1 - q.life / q.max;
      c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
      const R0 = q.r * s * (0.25 + k * 0.95);
      for (let b = 0; b < q.n; b++) {
        const a0 = q.a0 + b / q.n * TAU;
        c.strokeStyle = `rgba(255,248,170,${(1 - k) * 0.95})`; c.lineWidth = Math.max(1.5, 3.2 * (1 - k));
        c.beginPath(); c.moveTo(x + Math.cos(a0) * R0 * 0.25, y + Math.sin(a0) * R0 * 0.25);
        for (let j = 1; j <= 5; j++) { const rr2 = R0 * (0.25 + j * 0.15); const jit = (((b * 31 + j * 17 + q.seed) % 7) - 3) * 0.06; c.lineTo(x + Math.cos(a0 + jit) * rr2, y + Math.sin(a0 + jit) * rr2); }
        c.stroke();
        c.strokeStyle = `rgba(140,220,255,${(1 - k) * 0.6})`; c.lineWidth = Math.max(3, 7 * (1 - k)); c.stroke();
      }
      c.restore();
    } else if (q.k === 'ring') { const k = 1 - q.life / q.max; c.save(); c.globalAlpha = 1 - k; c.strokeStyle = q.col; c.lineWidth = 3; c.beginPath(); c.arc(x, y, q.r * s * (0.4 + k * 1.2), 0, TAU); c.stroke(); c.restore(); }
    else { c.globalAlpha = Math.min(1, q.life / q.max * 1.5); c.fillStyle = q.col; c.beginPath(); c.arc(x, y, Math.max(1, q.r * s), 0, TAU); c.fill(); c.globalAlpha = 1; }
  }
  const dark = clamp((camY - 85) / 205, 0, 0.62);
  if (dark > 0.02 && me) {
    const px = ox + me.x * s, py = oy + me.y * s;
    const lr = Math.max(cw, ch) * 0.55;
    const g = c.createRadialGradient(px, py, lr * 0.2, px, py, lr * 1.25);
    g.addColorStop(0, 'rgba(0,4,16,0)'); g.addColorStop(1, `rgba(0,4,16,${dark})`);
    c.fillStyle = g; c.fillRect(0, 0, cw, ch);
  }
  if (camY > 60) {
    c.save(); c.globalCompositeOperation = 'lighter';
    const a = clamp((camY - 60) / 120, 0, 1) * 0.5;
    for (const sn of G.deco.snow) {
      const x = ((sn.x * cw + Math.sin(t * 0.3 + sn.ph) * 12) % cw + cw) % cw, y = ((sn.y * ch + t * sn.v * 300) % ch + ch) % ch;
      c.fillStyle = `rgba(190,230,255,${a * (0.4 + (sn.s - 0.6) * 0.3)})`; c.beginPath(); c.arc(x, y, sn.s, 0, TAU); c.fill();
    }
    c.restore();
  }
  const vg = c.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.4, cw / 2, ch / 2, Math.max(cw, ch) * 0.78);
  vg.addColorStop(0, 'rgba(0,8,24,0)'); vg.addColorStop(1, 'rgba(0,8,24,0.42)');
  c.fillStyle = vg; c.fillRect(0, 0, cw, ch);
  if (me && !V.noArrows) {
    G.order.forEach((kk, i) => {
      const o = G.pl[kk];
      if (!o || o === me || kk === 'demo' || o.out || o.dead > 0) return;
      const bx = ox + o.x * s, by = oy + o.y * s, m = 30, top = V.safeTop || 120, bot = ch - (V.safeBottom || 190);
      if (bx >= m && bx <= cw - m && by >= top && by <= bot) return;
      let ix = clamp(bx, m, cw - m), iy = clamp(by, top, bot);
      for (const k of V.keep || []) {
        if (ix <= k[0] - 22 || ix >= k[2] + 22 || iy <= k[1] - 22 || iy >= k[3] + 22) continue;
        const edgeX = ix <= m + 1 || ix >= cw - m - 1;
        if (edgeX) iy = k[1] - 22 > top && (iy - k[1] < k[3] - iy || k[3] + 22 > bot) ? k[1] - 22 : Math.min(bot, k[3] + 22);
        else ix = k[0] - 22 > m && (ix - k[0] < k[2] - ix || k[2] + 22 > cw - m) ? k[0] - 22 : Math.min(cw - m, k[2] + 22);
      }
      const ang = Math.atan2(by - iy, bx - ix);
      const key = playerColorKey(o, i);
      c.save(); c.translate(ix, iy);
      c.fillStyle = 'rgba(0,0,0,0.45)'; c.beginPath(); c.arc(0, 0, 14, 0, TAU); c.fill();
      c.strokeStyle = (PLAYER_PAL[key] || PLAYER_PAL.sun)[0]; c.lineWidth = 2; c.stroke();
      const lb = label(fmtN(o.n), o.n > me.n ? '#FF8C8C' : '#FFFFFF'); if (lb) { const lh = 11; const lw = Math.min(24, lb.width / lb.height * lh); c.drawImage(lb, -lw / 2, -lh / 2, lw, lh); }
      c.rotate(ang); c.fillStyle = (PLAYER_PAL[key] || PLAYER_PAL.sun)[0]; c.beginPath(); c.moveTo(22, 0); c.lineTo(16, -5); c.lineTo(16, 5); c.closePath(); c.fill();
      c.restore();
    });
  }
}

export function drawSpecies(c, i, pv, size, open) {
  const S = SPECIES[i];
  if (!S) return;
  const spr = spriteFor(`n${i}.${pv || 0}`, S.shape, S.pal[pv || 0] || S.pal[0], S, 1, open || false, false);
  if (!spr) return;
  const k = size / spr.width;
  c.drawImage(spr, 0, (size - spr.height * k) / 2, size, spr.height * k);
}
export function drawBadge(c, key, stage, size) {
  const spIdx = SP_INDEX[PLAYER_SP[Math.min(PLAYER_SP.length - 1, stage || 0)]];
  const S = SPECIES[spIdx];
  const pal = PLAYER_PAL[key] || PLAYER_PAL.sun;
  const spr = spriteFor(`p${spIdx}.${key}`, S.shape, pal, { ...S, hunter: false, teeth: S.teeth }, 1, false, false);
  c.clearRect(0, 0, size, size);
  if (!spr) return;
  const k = size / spr.width;
  c.drawImage(spr, 0, (size - spr.height * k) / 2, size, spr.height * k);
}

export function drawMinimap(c, G, mine, w, h, view) {
  c.clearRect(0, 0, w, h);
  c.save(); c.beginPath(); c.roundRect(0, 0, w, h, 7); c.clip();
  const sx = w / WW, sy = h / WH;
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(70,170,225,0.62)'); g.addColorStop(1, 'rgba(4,14,36,0.78)');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.strokeStyle = 'rgba(220,245,255,0.35)'; c.lineWidth = 1;
  for (const cu of CURRENTS) { const yy = ((cu.y0 + cu.y1) / 2) * sy; c.setLineDash([3, 3]); c.beginPath(); c.moveTo(cu.x0 * sx, yy); c.lineTo(cu.x1 * sx, yy); c.stroke(); }
  c.setLineDash([]);
  c.fillStyle = 'rgba(112,96,70,0.88)'; c.beginPath(); c.moveTo(0, h);
  for (let x = 0; x <= WW; x += 6) c.lineTo(x * sx, floorAt(x) * sy);
  c.lineTo(w, h); c.closePath(); c.fill();
  for (const b of G.chests || []) { if (b.cool > 0) continue; c.fillStyle = '#FFD23F'; c.fillRect(b.x * sx - 1.5, b.y * sy - 3, 3, 3); }
  for (const f of G.fish) if (f.gold) { c.fillStyle = '#FFE680'; c.beginPath(); c.arc(f.x * sx, f.y * sy, 2.4, 0, TAU); c.fill(); }
  if (view) { c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 1; c.strokeRect((view.x - view.hw) * sx, (view.y - view.hh) * sy, view.hw * 2 * sx, view.hh * 2 * sy); }
  G.order.forEach((k, i) => {
    const p = G.pl[k];
    if (!p || k === 'demo' || p.out) return;
    const key = playerColorKey(p, i);
    c.fillStyle = k === mine ? '#FFFFFF' : (PLAYER_PAL[key] || PLAYER_PAL.sun)[0];
    c.strokeStyle = '#1B1430'; c.lineWidth = 1.2;
    c.beginPath(); c.arc(p.x * sx, p.y * sy, k === mine ? 3.4 : 2.8, 0, TAU); c.fill(); c.stroke();
  });
  c.restore();
  c.strokeStyle = 'rgba(255,255,255,0.42)'; c.lineWidth = 1.2; c.beginPath(); c.roundRect(0.6, 0.6, w - 1.2, h - 1.2, 7); c.stroke();
}

const REGION_NAME = { reef: 'Coral reef', kelp: 'Kelp forest', open: 'Open sea', abyss: 'The deep', slope: 'Rocky slope' };
export function placeName(x, y) {
  if (Math.abs(x - 803) < 70 && y > 230) return 'Shipwreck';
  return REGION_NAME[regionAt(clamp(x, 0, WW))] || 'Open sea';
}

export function drawRadar(c, G, mine, w, h, view) {
  const me = G.pl[mine];
  c.clearRect(0, 0, w, h);
  if (!me) return;
  const span = viewOf(me.n) * 2.6;
  const k = w / span;
  const cx = clamp(me.x, 0, WW), cy = clamp(me.y, 0, WH);
  const X = (x) => w / 2 + (x - cx) * k, Y = (y) => h / 2 + (y - cy) * k;
  c.save(); c.beginPath(); c.roundRect(0, 0, w, h, 9); c.clip();
  const yT = cy - h / 2 / k, yB = cy + h / 2 / k;
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, rgb(depthColor(clamp(yT, 0, WH)), 0.86)); g.addColorStop(1, rgb(depthColor(clamp(yB, 0, WH)), 0.86));
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  if (yT < 0) { c.fillStyle = 'rgba(205,238,250,0.55)'; c.fillRect(0, 0, w, Math.max(0, Y(0))); }
  c.strokeStyle = 'rgba(255,255,255,0.08)'; c.lineWidth = 1;
  const gs = Math.max(4, span / 4);
  for (let gx = Math.ceil((cx - span) / gs) * gs; gx < cx + span; gx += gs) { const px = Math.round(X(gx)) + 0.5; c.beginPath(); c.moveTo(px, 0); c.lineTo(px, h); c.stroke(); }
  for (let gy = Math.ceil((cy - span) / gs) * gs; gy < cy + span; gy += gs) { const py = Math.round(Y(gy)) + 0.5; c.beginPath(); c.moveTo(0, py); c.lineTo(w, py); c.stroke(); }
  c.strokeStyle = 'rgba(220,245,255,0.22)'; c.setLineDash([3, 3]);
  for (const cu of CURRENTS) { const yy = Y((cu.y0 + cu.y1) / 2); if (yy < 0 || yy > h) continue; c.beginPath(); c.moveTo(X(cu.x0), yy); c.lineTo(X(cu.x1), yy); c.stroke(); }
  c.setLineDash([]);
  c.fillStyle = 'rgba(112,96,70,0.95)'; c.beginPath(); c.moveTo(0, h);
  for (let i = 0; i <= 48; i++) { const px = (i / 48) * w; c.lineTo(px, Y(floorAt(clamp(cx + (px - w / 2) / k, 0, WW)))); }
  c.lineTo(w, h); c.closePath(); c.fill();
  if (X(0) > 0) { c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(0, 0, X(0), h); }
  if (X(WW) < w) { c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(X(WW), 0, w - X(WW), h); }
  for (const b of G.chests || []) { if (b.cool > 0) continue; const px = X(b.x), py = Y(b.y); if (px < -4 || px > w + 4 || py < -4 || py > h + 4) continue; c.fillStyle = '#FFD23F'; c.fillRect(px - 2.5, py - 3.5, 5, 4); }
  for (const f of G.fish) {
    const px = X(f.x), py = Y(f.y);
    if (px < -6 || px > w + 6 || py < -6 || py > h + 6) continue;
    if (f.gold) { c.fillStyle = '#FFE15A'; c.beginPath(); c.arc(px, py, 3, 0, TAU); c.fill(); continue; }
    if (f.n <= me.n * 1.08) continue;
    const rr = clamp(rOf(f.n) * k, 2.2, 6);
    c.fillStyle = f.hunter && (f.chase || f.warn > 0) ? '#FF3B3B' : 'rgba(255,92,92,0.92)'; c.beginPath(); c.arc(px, py, rr, 0, TAU); c.fill();
  }
  if (view) { c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 1; c.strokeRect(X(view.x - view.hw), Y(view.y - view.hh), view.hw * 2 * k, view.hh * 2 * k); }
  G.order.forEach((kk, i) => {
    const p = G.pl[kk];
    if (!p || kk === mine || kk === 'demo' || p.out) return;
    const px = clamp(X(p.x), 3, w - 3), py = clamp(Y(p.y), 3, h - 3);
    c.fillStyle = (PLAYER_PAL[playerColorKey(p, i)] || PLAYER_PAL.sun)[0]; c.strokeStyle = 'rgba(0,0,0,0.6)'; c.lineWidth = 1.2;
    c.beginPath(); c.arc(px, py, 3.2, 0, TAU); c.fill(); c.stroke();
  });
  c.save(); c.translate(X(me.x), Y(me.y)); c.rotate(me.a);
  c.fillStyle = '#FFFFFF'; c.strokeStyle = 'rgba(0,0,0,0.55)'; c.lineWidth = 1.2;
  c.beginPath(); c.moveTo(6.5, 0); c.lineTo(-4.5, -4.2); c.lineTo(-2.2, 0); c.lineTo(-4.5, 4.2); c.closePath(); c.fill(); c.stroke();
  c.restore();
  c.restore();
  c.strokeStyle = 'rgba(255,255,255,0.4)'; c.lineWidth = 1; c.beginPath(); c.roundRect(0.5, 0.5, w - 1, h - 1, 9); c.stroke();
}
