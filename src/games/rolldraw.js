import { TAU, R, BALLS, atL, foePos, moverPos, doorOpen, clamp } from './rollengine.js';

export const INK = '#1B1430';
export const SKY = {
  meadow: { top: '#6EC6FF', bot: '#D9F3FF', far: '#9ED89A', mid: '#6BC26A', dirt: ['#B9824D', '#9C6A3B', '#7C5230'], grass: ['#7BD25A', '#4FA83A'], brick: ['#E0A050', '#B97830'], plank: ['#C8955B', '#8E6234'], cloud: true },
  canyon: { top: '#FF9E6B', bot: '#FFE3B8', far: '#E7905F', mid: '#C9673F', dirt: ['#D87B48', '#B95E33', '#8F4423'], grass: ['#F0B067', '#C98642'], brick: ['#E8A060', '#B86A35'], plank: ['#B98A5E', '#7E5732'], cloud: true },
  frost: { top: '#8CC8F5', bot: '#EEF8FF', far: '#C9DFF2', mid: '#A9C8E6', dirt: ['#8FA8C4', '#7590AE', '#5C7593'], grass: ['#FFFFFF', '#D3E6F7'], brick: ['#BFD8F0', '#8DB0D6'], plank: ['#A9B9C9', '#76889C'], cloud: true },
  works: { top: '#3F6FA0', bot: '#A8D2EA', far: '#6E93B5', mid: '#4F7697', dirt: ['#8E9BAA', '#73808F', '#5A6574'], grass: ['#FFD23F', '#E0A800'], brick: ['#F2A93B', '#B9741C'], plank: ['#A9B4C0', '#76828F'], cloud: true, hazard: true },
  night: { top: '#1E1B4A', bot: '#5B4A9A', far: '#3B3570', mid: '#2C2858', dirt: ['#6B5AA0', '#54478A', '#3E3470'], grass: ['#5FE3C0', '#2FB894'], brick: ['#8A7AD0', '#5C4CA6'], plank: ['#8C7CC4', '#5E4E96'], cloud: false, stars: true },
  candy: { top: '#FF9FD0', bot: '#FFE6F3', far: '#FFC6E3', mid: '#F49ACA', dirt: ['#E98DBD', '#C96A9C', '#A24D7B'], grass: ['#8FF0C8', '#4CCB9C'], brick: ['#FFB4DA', '#E07AB2'], plank: ['#F2C59B', '#C8955B'], cloud: true },
  lava: { top: '#3B1515', bot: '#96351A', far: '#5C221A', mid: '#431612', dirt: ['#6E3D32', '#572B21', '#3C1C15'], grass: ['#FF8A3D', '#E0561B'], brick: ['#AA573C', '#7C3B27'], plank: ['#8E5C46', '#603C2C'], cloud: false, hazard: true },
};
function rr(c, x, y, w, h, r) { r = Math.max(0, Math.min(r, w / 2, h / 2)); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

const chunkCache = new Map();
const CH = 12;
export function clearChunks() { chunkCache.clear(); }
function chunk(L, ci, s) {
  const key = `${L.index}|${ci}|${s}`;
  let cv = chunkCache.get(key);
  if (cv) return cv;
  if (chunkCache.size > 14) { const k0 = chunkCache.keys().next().value; chunkCache.delete(k0); }
  cv = document.createElement('canvas');
  cv.width = Math.ceil(CH * s) + 2; cv.height = Math.ceil(L.MH * s) + 2;
  const c = cv.getContext('2d');
  const P = SKY[L.world] || SKY.meadow;
  const x0 = ci * CH;
  const lw = Math.max(1.5, s * 0.06);
  for (let tx = x0; tx < x0 + CH; tx++) for (let ty = 0; ty < L.MH; ty++) {
    const ch = atL(L, tx, ty);
    const X = (tx - x0) * s, Y = ty * s;
    const hash = ((tx * 73856093) ^ (ty * 19349663)) >>> 0;
    if (ch === '#' || ch === 'I') {
      const up = atL(L, tx, ty - 1);
      const top = !(up === '#' || up === 'I' || up === '/' || up === '\\' || up === 'D');
      const deep = ty - topOf(L, tx);
      c.fillStyle = deep > 2 ? P.dirt[2] : deep > 0 ? P.dirt[1] : P.dirt[0];
      c.fillRect(X, Y, s + 0.6, s + 0.6);
      c.fillStyle = 'rgba(0,0,0,0.12)';
      for (let k = 0; k < 3; k++) { const h2 = (hash >> (k * 5)) & 31; c.beginPath(); c.arc(X + (h2 % 8) / 8 * s + s * 0.08, Y + ((h2 >> 2) % 8) / 8 * s + s * 0.08, s * 0.06, 0, TAU); c.fill(); }
      if (ch === 'I') { c.fillStyle = 'rgba(210,240,255,0.85)'; c.fillRect(X, Y, s + 0.6, s * 0.5); c.fillStyle = 'rgba(255,255,255,0.8)'; c.fillRect(X + s * 0.1, Y + s * 0.08, s * 0.35, s * 0.06); }
      if (top && ch === '#') {
        c.fillStyle = P.grass[1]; c.fillRect(X, Y, s + 0.6, s * 0.34);
        c.fillStyle = P.grass[0]; c.fillRect(X, Y, s + 0.6, s * 0.24);
        if (P.hazard) { c.save(); c.beginPath(); c.rect(X, Y, s + 0.6, s * 0.24); c.clip(); c.fillStyle = INK; for (let k = -1; k < 4; k++) { c.beginPath(); c.moveTo(X + k * s * 0.34, Y + s * 0.24); c.lineTo(X + k * s * 0.34 + s * 0.17, Y + s * 0.24); c.lineTo(X + k * s * 0.34 + s * 0.38, Y); c.lineTo(X + k * s * 0.34 + s * 0.21, Y); c.closePath(); c.fill(); } c.restore(); for (let k = 0; k < 2; k++) { c.fillStyle = 'rgba(30,40,55,0.35)'; c.beginPath(); c.arc(X + s * (0.25 + k * 0.5), Y + s * 0.6, s * 0.06, 0, TAU); c.fill(); } }
        else for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(X + s * (0.18 + k * 0.32), Y + s * 0.3, s * 0.13, 0, Math.PI); c.fillStyle = P.grass[1]; c.fill(); }
        c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(X, Y + s * 0.03, s + 0.6, s * 0.05);
        c.fillStyle = INK; c.fillRect(X, Y - lw * 0.5, s + 0.6, lw);
      }
      if (!solidLike(atL(L, tx - 1, ty))) { c.fillStyle = INK; c.fillRect(X - lw * 0.5, Y, lw, s + 0.6); }
      if (!solidLike(atL(L, tx + 1, ty))) { c.fillStyle = INK; c.fillRect(X + s - lw * 0.5, Y, lw, s + 0.6); }
    } else if (ch === '/' || ch === '\\') {
      const up = ch === '/';
      c.fillStyle = P.dirt[0]; c.beginPath();
      if (up) { c.moveTo(X, Y + s); c.lineTo(X + s, Y); c.lineTo(X + s, Y + s); } else { c.moveTo(X, Y); c.lineTo(X + s, Y + s); c.lineTo(X, Y + s); }
      c.closePath(); c.fill();
      c.strokeStyle = P.grass[0]; c.lineWidth = s * 0.26; c.beginPath();
      if (up) { c.moveTo(X, Y + s + s * 0.09); c.lineTo(X + s, Y + s * 0.09); } else { c.moveTo(X, Y + s * 0.09); c.lineTo(X + s, Y + s + s * 0.09); }
      c.stroke();
      c.strokeStyle = INK; c.lineWidth = lw; c.beginPath();
      if (up) { c.moveTo(X, Y + s); c.lineTo(X + s, Y); } else { c.moveTo(X, Y); c.lineTo(X + s, Y + s); }
      c.stroke();
    } else if (ch === '=') {
      c.fillStyle = P.brick[0]; c.fillRect(X, Y, s, s);
      c.strokeStyle = P.brick[1]; c.lineWidth = Math.max(1, s * 0.05);
      c.beginPath(); c.moveTo(X, Y + s / 2); c.lineTo(X + s, Y + s / 2); c.moveTo(X + s / 2, Y); c.lineTo(X + s / 2, Y + s / 2); c.moveTo(X + s / 4, Y + s / 2); c.lineTo(X + s / 4, Y + s); c.moveTo(X + s * 0.75, Y + s / 2); c.lineTo(X + s * 0.75, Y + s); c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(X, Y, s, s * 0.08);
      c.strokeStyle = INK; c.lineWidth = lw; c.strokeRect(X, Y, s, s);
    } else if (ch === '-') {
      c.fillStyle = P.plank[0]; rr(c, X - 1, Y, s + 2, s * 0.28, s * 0.06); c.fill();
      c.fillStyle = P.plank[1]; c.fillRect(X, Y + s * 0.2, s, s * 0.08);
      c.strokeStyle = INK; c.lineWidth = lw * 0.8; rr(c, X - 1, Y, s + 2, s * 0.28, s * 0.06); c.stroke();
    } else if (ch === '^') {
      for (let k = 0; k < 3; k++) {
        const bx = X + k * s / 3;
        c.fillStyle = '#D9DEE8'; c.beginPath(); c.moveTo(bx, Y + s); c.lineTo(bx + s / 6, Y + s * 0.42); c.lineTo(bx + s / 3, Y + s); c.closePath(); c.fill();
        c.fillStyle = '#9CA4B4'; c.beginPath(); c.moveTo(bx + s / 6, Y + s * 0.42); c.lineTo(bx + s / 3, Y + s); c.lineTo(bx + s / 6, Y + s); c.closePath(); c.fill();
        c.strokeStyle = INK; c.lineWidth = lw * 0.7; c.beginPath(); c.moveTo(bx, Y + s); c.lineTo(bx + s / 6, Y + s * 0.42); c.lineTo(bx + s / 3, Y + s); c.stroke();
      }
    }
  }
  chunkCache.set(key, cv);
  return cv;
}
const solidLike = (ch) => ch === '#' || ch === 'I' || ch === '/' || ch === '\\' || ch === 'D';
const topCache = new Map();
function topOf(L, tx) {
  const k = `${L.index}:${tx}`;
  if (topCache.has(k)) return topCache.get(k);
  let y = 0;
  while (y < L.MH && !solidLike(atL(L, tx, y))) y++;
  topCache.set(k, y);
  return y;
}

function drawSky(c, W, V) {
  const { cw, ch, camX, camY, s } = V;
  const P = SKY[W.L.world] || SKY.meadow;
  const g = c.createLinearGradient(0, 0, 0, ch); g.addColorStop(0, P.top); g.addColorStop(1, P.bot);
  c.fillStyle = g; c.fillRect(0, 0, cw, ch);
  const t = W.t;
  if (P.stars) { for (let i = 0; i < 60; i++) { const x = ((i * 137.5 - camX * s * 0.05) % cw + cw) % cw, y = (i * 61.3) % (ch * 0.7); c.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.3 + i)); c.fillStyle = '#FFFFFF'; c.fillRect(x, y, 2, 2); } c.globalAlpha = 1; c.fillStyle = '#FFF6D6'; c.beginPath(); c.arc(cw * 0.78, ch * 0.16, 30, 0, TAU); c.fill(); c.fillStyle = P.top; c.beginPath(); c.arc(cw * 0.78 + 12, ch * 0.16 - 8, 26, 0, TAU); c.fill(); }
  const hillsY = ch * 0.62 - (camY - 10) * s * 0.15;
  const layer = (par, col, amp, freq, yoff) => {
    c.fillStyle = col; c.beginPath(); c.moveTo(0, ch);
    for (let x = 0; x <= cw + 20; x += 20) { const wx = x + camX * s * par; c.lineTo(x, hillsY + yoff - (Math.sin(wx * freq) * 0.5 + 0.5) * amp - Math.sin(wx * freq * 2.3 + 1) * amp * 0.25); }
    c.lineTo(cw, ch); c.closePath(); c.fill();
  };
  layer(0.15, P.far, 110, 0.006, 0);
  layer(0.3, P.mid, 70, 0.011, 60);
  if (P.cloud) {
    c.fillStyle = 'rgba(255,255,255,0.9)';
    for (let i = 0; i < 6; i++) { const x = ((i * 260 - camX * s * 0.08 + t * 8) % (cw + 300) + cw + 300) % (cw + 300) - 150, y = 50 + (i * 47) % (ch * 0.3); c.beginPath(); c.arc(x, y, 26, 0, TAU); c.arc(x + 28, y - 10, 32, 0, TAU); c.arc(x + 60, y, 24, 0, TAU); c.rect(x, y, 60, 24); c.fill(); }
  }
}

function drawCoin(c, x, y, s, t, id) {
  const k = Math.cos(t * 4 + id * 0.7);
  const w = Math.max(0.12, Math.abs(k));
  c.save(); c.translate(x, y); c.scale(w, 1);
  c.fillStyle = INK; c.beginPath(); c.arc(0, 0, s * 0.3, 0, TAU); c.fill();
  c.fillStyle = k > 0 ? '#FFD23F' : '#E8A800'; c.beginPath(); c.arc(0, 0, s * 0.25, 0, TAU); c.fill();
  c.fillStyle = '#FFF3A8'; c.beginPath(); c.arc(-s * 0.06, -s * 0.06, s * 0.08, 0, TAU); c.fill();
  c.strokeStyle = '#E8A800'; c.lineWidth = s * 0.04; c.beginPath(); c.arc(0, 0, s * 0.16, 0, TAU); c.stroke();
  c.restore();
}
function starPath(c, x, y, r1, r2) { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? r2 : r1; if (i) c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); else c.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.closePath(); }
function drawStar(c, x, y, s, t) {
  const bob = Math.sin(t * 2.4) * s * 0.08;
  c.save(); c.translate(x, y + bob); c.rotate(Math.sin(t * 1.7) * 0.15);
  c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(0, 0, 0, 0, 0, s * 0.9); g.addColorStop(0, 'rgba(255,230,120,0.55)'); g.addColorStop(1, 'rgba(255,230,120,0)'); c.fillStyle = g; c.fillRect(-s, -s, s * 2, s * 2); c.globalCompositeOperation = 'source-over';
  starPath(c, 0, 0, s * 0.5, s * 0.24); c.fillStyle = INK; c.fill();
  starPath(c, 0, 0, s * 0.42, s * 0.2); c.fillStyle = '#FFD23F'; c.fill();
  starPath(c, -s * 0.04, -s * 0.05, s * 0.22, s * 0.1); c.fillStyle = '#FFF6C8'; c.fill();
  c.restore();
}
function drawFlag(c, x, y, s, t, by) {
  c.fillStyle = INK; c.fillRect(x - s * 0.06, y - s * 1.7, s * 0.12, s * 1.7);
  c.fillStyle = '#E2E2EA'; c.fillRect(x - s * 0.035, y - s * 1.68, s * 0.07, s * 1.66);
  const col = by != null ? BALLS[by].body : '#B9B4C8';
  const wv = Math.sin(t * 5 + x) * s * 0.06;
  c.fillStyle = INK; c.beginPath(); c.moveTo(x, y - s * 1.66); c.quadraticCurveTo(x + s * 0.4, y - s * 1.56 + wv, x + s * 0.8, y - s * 1.5 + wv); c.lineTo(x, y - s * 1.12); c.closePath(); c.fill();
  c.fillStyle = col; c.beginPath(); c.moveTo(x + s * 0.04, y - s * 1.6); c.quadraticCurveTo(x + s * 0.38, y - s * 1.52 + wv, x + s * 0.68, y - s * 1.48 + wv); c.lineTo(x + s * 0.04, y - s * 1.2); c.closePath(); c.fill();
  c.fillStyle = INK; c.beginPath(); c.arc(x, y - s * 1.72, s * 0.1, 0, TAU); c.fill(); c.fillStyle = by != null ? '#FFD23F' : '#D8D4E4'; c.beginPath(); c.arc(x, y - s * 1.72, s * 0.065, 0, TAU); c.fill();
}
function drawGoal(c, x, y, s, t, open) {
  c.save(); c.translate(x, y);
  c.fillStyle = INK; rr(c, -s * 0.95, -s * 2.2, s * 1.9, s * 2.3, s * 0.9); c.fill();
  c.fillStyle = '#8A7FA8'; rr(c, -s * 0.85, -s * 2.1, s * 1.7, s * 2.1, s * 0.8); c.fill();
  const g = c.createRadialGradient(0, -s * 0.95, s * 0.1, 0, -s * 0.95, s * 0.9);
  g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.4, '#9FF2FF'); g.addColorStop(1, '#3A6BFF');
  c.fillStyle = g; rr(c, -s * 0.62, -s * 1.85, s * 1.24, s * 1.85, s * 0.6); c.fill();
  c.save(); rr(c, -s * 0.62, -s * 1.85, s * 1.24, s * 1.85, s * 0.6); c.clip();
  c.strokeStyle = 'rgba(255,255,255,0.65)'; c.lineWidth = s * 0.08;
  for (let i = 0; i < 4; i++) { const a = t * 2 + i * 1.57; c.beginPath(); c.arc(0, -s * 0.95, s * (0.2 + i * 0.16), a, a + 2.2); c.stroke(); }
  c.restore();
  for (let i = 0; i < 5; i++) { c.fillStyle = '#FFD23F'; const a = -Math.PI + i * Math.PI / 4; c.beginPath(); c.arc(Math.cos(a) * s * 0.78, -s * 1.15 + Math.sin(a) * s * 0.95, s * 0.07, 0, TAU); c.fill(); }
  void open;
  c.restore();
}
function drawSpring(c, x, y, s, k) {
  const comp = k > 0 ? Math.sin(k / 0.35 * Math.PI) : 0;
  const h = s * (0.42 - comp * 0.22);
  c.fillStyle = INK; rr(c, x + s * 0.1, y + s * 0.82, s * 0.8, s * 0.18, s * 0.05); c.fill();
  c.strokeStyle = INK; c.lineWidth = s * 0.12; c.beginPath();
  for (let i = 0; i <= 4; i++) { const yy = y + s * 0.82 - h * i / 4; c.lineTo(x + s * (i % 2 ? 0.3 : 0.7), yy); } c.stroke();
  c.strokeStyle = '#C9CED8'; c.lineWidth = s * 0.06; c.beginPath();
  for (let i = 0; i <= 4; i++) { const yy = y + s * 0.82 - h * i / 4; c.lineTo(x + s * (i % 2 ? 0.3 : 0.7), yy); } c.stroke();
  const ty = y + s * 0.82 - h - s * 0.16;
  c.fillStyle = INK; rr(c, x + s * 0.02, ty - s * 0.02, s * 0.96, s * 0.22, s * 0.08); c.fill();
  c.fillStyle = '#FF5A6E'; rr(c, x + s * 0.06, ty, s * 0.88, s * 0.16, s * 0.06); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(x + s * 0.12, ty + s * 0.02, s * 0.5, s * 0.04);
}
function drawButton(c, x, y, s, down) {
  c.fillStyle = INK; rr(c, x + s * 0.08, y + s * 0.74, s * 0.84, s * 0.26, s * 0.08); c.fill();
  c.fillStyle = '#7C8797'; rr(c, x + s * 0.12, y + s * 0.78, s * 0.76, s * 0.2, s * 0.06); c.fill();
  const h = down ? s * 0.08 : s * 0.2;
  c.fillStyle = INK; rr(c, x + s * 0.2, y + s * 0.78 - h, s * 0.6, h + s * 0.06, s * 0.06); c.fill();
  c.fillStyle = down ? '#5BE37D' : '#FF7A3D'; rr(c, x + s * 0.24, y + s * 0.8 - h, s * 0.52, h, s * 0.05); c.fill();
}
function drawDoor(c, d, s, amt) {
  const X = d.x * s, Y0 = d.y0 * s, Hh = (d.y1 - d.y0 + 1) * s;
  const lift = amt * Hh;
  c.save(); c.beginPath(); c.rect(X - 2, Y0 - 2, s + 4, Hh + 4); c.clip();
  c.fillStyle = INK; c.fillRect(X + s * 0.08, Y0 - lift, s * 0.84, Hh);
  c.fillStyle = '#6E7A8C'; c.fillRect(X + s * 0.14, Y0 - lift, s * 0.72, Hh - s * 0.06);
  for (let i = 0; i < Math.round(Hh / s); i++) { c.fillStyle = '#FFD23F'; c.fillRect(X + s * 0.14, Y0 - lift + i * s + s * 0.42, s * 0.72, s * 0.12); c.fillStyle = INK; c.fillRect(X + s * 0.14, Y0 - lift + i * s + s * 0.38, s * 0.72, s * 0.04); }
  c.restore();
}
function drawMover(c, p, s, world) {
  const X = p.x * s, Y = p.y * s, Wd = p.w * s;
  const P = SKY[world] || SKY.meadow;
  c.fillStyle = INK; rr(c, X - 2, Y - 2, Wd + 4, s * 0.5 + 4, s * 0.12); c.fill();
  c.fillStyle = P.brick[0]; rr(c, X, Y, Wd, s * 0.5, s * 0.1); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(X + s * 0.1, Y + s * 0.06, Wd - s * 0.2, s * 0.08);
  c.fillStyle = P.brick[1]; for (let i = 0; i < p.w; i++) { c.beginPath(); c.arc(X + (i + 0.5) * s, Y + s * 0.3, s * 0.06, 0, TAU); c.fill(); }
}
function drawFoe(c, f, p, s, t, dead) {
  const X = p.x * s, Y = p.y * s;
  c.save(); c.translate(X, Y);
  if (dead > 0) { c.scale(1 + dead * 0.6, Math.max(0.05, 1 - dead * 3)); c.globalAlpha = Math.max(0, 1 - dead * 2); }
  c.scale(p.dir || 1, 1);
  if (f.k === 'grub') {
    const wob = Math.sin(t * 10 + f.id) * s * 0.03;
    c.fillStyle = INK; c.beginPath(); c.ellipse(-s * 0.2, s * 0.08, s * 0.3, s * 0.27, 0, 0, TAU); c.ellipse(s * 0.14, -s * 0.02 + wob, s * 0.34, s * 0.34, 0, 0, TAU); c.fill();
    c.fillStyle = '#8BD449'; c.beginPath(); c.ellipse(-s * 0.2, s * 0.08, s * 0.25, s * 0.22, 0, 0, TAU); c.fill();
    c.fillStyle = '#A6E35E'; c.beginPath(); c.ellipse(s * 0.14, -s * 0.02 + wob, s * 0.29, s * 0.29, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.4)'; c.beginPath(); c.ellipse(s * 0.06, -s * 0.18 + wob, s * 0.1, s * 0.05, -0.4, 0, TAU); c.fill();
    c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(s * 0.22, -s * 0.06 + wob, s * 0.085, 0, TAU); c.fill(); c.fillStyle = INK; c.beginPath(); c.arc(s * 0.25, -s * 0.06 + wob, s * 0.045, 0, TAU); c.fill();
    c.strokeStyle = INK; c.lineWidth = s * 0.04; c.beginPath(); c.moveTo(s * 0.2, -s * 0.28 + wob); c.lineTo(s * 0.26, -s * 0.42 + wob); c.stroke();
  } else if (f.k === 'burr') {
    const spin = t * 3 * (p.dir || 1);
    c.save(); c.rotate(spin);
    c.fillStyle = INK; starPath(c, 0, 0, s * 0.48, s * 0.3); c.fill();
    c.fillStyle = '#7A5A2A'; starPath(c, 0, 0, s * 0.4, s * 0.26); c.fill();
    c.restore();
    c.fillStyle = '#A07A3A'; c.beginPath(); c.arc(0, 0, s * 0.24, 0, TAU); c.fill();
    c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(s * 0.08, -s * 0.04, s * 0.07, 0, TAU); c.arc(-s * 0.06, -s * 0.04, s * 0.07, 0, TAU); c.fill();
    c.fillStyle = INK; c.beginPath(); c.arc(s * 0.1, -s * 0.03, s * 0.035, 0, TAU); c.arc(-s * 0.04, -s * 0.03, s * 0.035, 0, TAU); c.fill();
    c.strokeStyle = INK; c.lineWidth = s * 0.035; c.beginPath(); c.moveTo(-s * 0.12, -s * 0.13); c.lineTo(0, -s * 0.09); c.moveTo(s * 0.16, -s * 0.13); c.lineTo(s * 0.04, -s * 0.09); c.stroke();
  } else if (f.k === 'jelly') {
    const sq = p.sq || 0;
    c.scale(1 + sq * 0.25, 1 - sq * 0.25);
    c.fillStyle = INK; rr(c, -s * 0.38, -s * 0.38, s * 0.76, s * 0.76, s * 0.2); c.fill();
    const g = c.createLinearGradient(0, -s * 0.34, 0, s * 0.34); g.addColorStop(0, '#FFB3D9'); g.addColorStop(1, '#FF6FB0');
    c.fillStyle = g; rr(c, -s * 0.33, -s * 0.33, s * 0.66, s * 0.66, s * 0.17); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.6)'; rr(c, -s * 0.24, -s * 0.27, s * 0.22, s * 0.1, s * 0.05); c.fill();
    c.fillStyle = INK; c.beginPath(); c.arc(-s * 0.1, -s * 0.02, s * 0.05, 0, TAU); c.arc(s * 0.12, -s * 0.02, s * 0.05, 0, TAU); c.fill();
    c.strokeStyle = INK; c.lineWidth = s * 0.035; c.beginPath(); c.arc(s * 0.01, s * 0.08, s * 0.06, 0, Math.PI); c.stroke();
  } else {
    const flap = Math.sin(t * 40 + f.id) * 0.5 + 0.5;
    c.fillStyle = 'rgba(220,240,255,0.75)'; c.strokeStyle = INK; c.lineWidth = s * 0.03;
    c.beginPath(); c.ellipse(-s * 0.08, -s * 0.3, s * 0.12, s * (0.2 + flap * 0.08), -0.5, 0, TAU); c.fill(); c.stroke();
    c.beginPath(); c.ellipse(s * 0.1, -s * 0.32, s * 0.12, s * (0.2 + flap * 0.08), 0.5, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = INK; c.beginPath(); c.ellipse(0, 0, s * 0.36, s * 0.3, 0, 0, TAU); c.fill();
    c.fillStyle = '#4FC3C9'; c.beginPath(); c.ellipse(0, 0, s * 0.31, s * 0.25, 0, 0, TAU); c.fill();
    c.fillStyle = '#2A8A90'; c.fillRect(-s * 0.08, -s * 0.25, s * 0.06, s * 0.5); c.fillRect(s * 0.06, -s * 0.25, s * 0.06, s * 0.5);
    c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(s * 0.2, -s * 0.04, s * 0.08, 0, TAU); c.fill(); c.fillStyle = INK; c.beginPath(); c.arc(s * 0.23, -s * 0.04, s * 0.04, 0, TAU); c.fill();
  }
  c.restore();
}
export function drawBall(c, x, y, s, b, ci, t, o) {
  const B = BALLS[ci % BALLS.length];
  const r = R * s;
  const sq = b.sq || 0;
  c.save(); c.translate(x, y + r * sq * 0.4);
  if (o && o.alpha != null) c.globalAlpha = o.alpha;
  c.scale(1 + sq * 0.22, 1 - sq * 0.22);
  c.fillStyle = INK; c.beginPath(); c.arc(0, 0, r + Math.max(2, s * 0.06), 0, TAU); c.fill();
  const g = c.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r);
  g.addColorStop(0, B.light); g.addColorStop(0.45, B.body); g.addColorStop(1, B.dark);
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
  c.save(); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.clip(); c.rotate(b.a || 0);
  if (B.id === 'sunny') { c.fillStyle = B.mark; c.globalAlpha *= 0.55; c.fillRect(-r, -r * 0.18, r * 2, r * 0.36); }
  else if (B.id === 'minty') { c.fillStyle = B.mark; c.globalAlpha *= 0.35; for (let i = 0; i < 5; i++) { const a = i * TAU / 5; c.beginPath(); c.arc(Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62, r * 0.14, 0, TAU); c.fill(); } }
  else if (B.id === 'skye') { c.fillStyle = B.mark; c.globalAlpha *= 0.5; c.beginPath(); c.arc(0, -r * 0.62, r * 0.22, 0, TAU); c.arc(0, r * 0.62, r * 0.22, 0, TAU); c.fill(); }
  else { c.fillStyle = B.mark; c.globalAlpha *= 0.7; starPath(c, r * 0.5, 0, r * 0.26, r * 0.12); c.fill(); }
  c.restore();
  c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.ellipse(-r * 0.36, -r * 0.46, r * 0.26, r * 0.15, -0.6, 0, TAU); c.fill();
  const look = (b.look || 1) * r * 0.16;
  const up = b.vy < -3 ? -r * 0.08 : b.vy > 4 ? r * 0.06 : 0;
  const blink = b.blink < 0;
  for (const ex of [-0.22, 0.24]) {
    const X = ex * r + look, Y = -r * 0.1 + up;
    c.fillStyle = INK; c.beginPath(); c.ellipse(X, Y, r * 0.16, blink ? r * 0.03 : r * 0.21, 0, 0, TAU); c.fill();
    if (!blink) { c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(X + r * 0.05, Y - r * 0.08, r * 0.065, 0, TAU); c.fill(); }
  }
  c.strokeStyle = INK; c.lineWidth = Math.max(1.5, s * 0.05); c.lineCap = 'round';
  if (b.vy < -3 || (o && o.happy)) { c.fillStyle = INK; c.beginPath(); c.ellipse(look * 0.8, r * 0.32 + up, r * 0.13, r * 0.12, 0, 0, TAU); c.fill(); }
  else { c.beginPath(); c.arc(look * 0.8, r * 0.18 + up, r * 0.2, 0.25, Math.PI - 0.25); c.stroke(); }
  c.fillStyle = 'rgba(255,110,110,0.35)'; c.beginPath(); c.ellipse(-r * 0.5 + look, r * 0.16 + up, r * 0.12, r * 0.07, 0, 0, TAU); c.ellipse(r * 0.52 + look, r * 0.16 + up, r * 0.12, r * 0.07, 0, 0, TAU); c.fill();
  c.restore();
}

export function updateParts(P, dt) {
  for (const q of P) { q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += (q.g == null ? 18 : q.g) * dt; if (q.rot != null) q.rot += q.vr * dt; }
  let j = 0; for (let i = 0; i < P.length; i++) if (P[i].life > 0) P[j++] = P[i]; P.length = j;
}
export function burst(P, x, y, col, n, sp, kind) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = (0.6 + Math.random()) * (sp || 5); P.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, life: 0.5 + Math.random() * 0.4, max: 0.9, col, sz: 0.06 + Math.random() * 0.08, k: kind || 'dot', rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 12 }); } }
export function dust(P, x, y, n) { for (let i = 0; i < n; i++) P.push({ x: x + (Math.random() - 0.5) * 0.5, y, vx: (Math.random() - 0.5) * 2.4, vy: -Math.random() * 1.2, g: -1, life: 0.45, max: 0.45, col: 'rgba(255,255,255,0.75)', sz: 0.1 + Math.random() * 0.1, k: 'puff' }); }
export function popText(P, x, y, text, col) { P.push({ x, y, vx: 0, vy: -2.2, g: 0, life: 0.9, max: 0.9, col, text, k: 'txt' }); }

export function render(ctx, W, V) {
  const { cw, ch, dpr, s, ox, oy, balls, me, names, bubbles } = V;
  const L = W.L, t = W.t + W.clk, c = ctx;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawSky(c, W, V);
  const tx0 = Math.max(0, Math.floor(-ox / s) - 1), tx1 = Math.min(L.MW - 1, Math.ceil((cw - ox) / s) + 1);
  const c0 = Math.floor(tx0 / CH), c1 = Math.floor(tx1 / CH);
  for (let ci = c0; ci <= c1; ci++) { const cv = chunk(L, ci, Math.round(s * dpr)); c.drawImage(cv, ox + ci * CH * s, oy, cv.width / dpr, cv.height / dpr); }
  const below = oy + L.MH * s;
  if (below < ch) { const P2 = SKY[L.world] || SKY.meadow; for (let x = tx0; x <= tx1; x++) { const sol = solidLike(atL(L, x, L.MH - 1)); const g2 = c.createLinearGradient(0, below, 0, below + s * 2); g2.addColorStop(0, sol ? P2.dirt[2] : 'rgba(20,14,30,0.5)'); g2.addColorStop(1, sol ? P2.dirt[2] : 'rgba(20,14,30,0.95)'); c.fillStyle = g2; c.fillRect(ox + x * s, below - 1, s + 1, ch - below + 1); } }
  c.save(); c.translate(ox, oy);
  for (let x = tx0; x <= tx1; x++) for (let y = 0; y < L.MH; y++) {
    const chh = L.map[y][x];
    if (chh === 'L') {
      const X = x * s, Y = y * s;
      const g = c.createLinearGradient(0, Y, 0, Y + s); g.addColorStop(0, '#FFB347'); g.addColorStop(1, '#FF4F1F');
      c.fillStyle = g; c.fillRect(X, Y + s * 0.2, s + 0.5, s * 0.8);
      c.fillStyle = '#FFE08A'; c.beginPath(); c.moveTo(X, Y + s * 0.3);
      for (let k = 0; k <= 4; k++) c.lineTo(X + k * s / 4, Y + s * (0.22 + Math.sin(t * 4 + x + k) * 0.06));
      c.lineTo(X + s, Y + s * 0.38); c.lineTo(X, Y + s * 0.38); c.closePath(); c.fill();
    }
  }
  for (const sp of L.springs) if (sp.x >= tx0 - 1 && sp.x <= tx1) drawSpring(c, sp.x * s, sp.y * s, s, W.springT[`${sp.x},${sp.y}`] || 0);
  const pressed = V.pressed || new Set();
  for (const bt of L.buttons) if (bt.x >= tx0 - 1 && bt.x <= tx1) drawButton(c, bt.x * s, bt.y * s, s, pressed.has(`${bt.x},${bt.y}`) || W.opened.has(bt.g));
  for (const d of L.doors) if (d.x >= tx0 - 1 && d.x <= tx1) drawDoor(c, d, s, W.doorAmt ? W.doorAmt[d.g] || 0 : 0);
  for (const m of L.movers) { const p = moverPos(W, m); if (p.x + p.w >= tx0 && p.x <= tx1 + 1) drawMover(c, p, s, L.world); }
  for (const f of L.flags) if (!f.start && f.x >= tx0 - 1 && f.x <= tx1 + 1) drawFlag(c, f.x * s, f.y * s, s, t, V.flagBy ? V.flagBy[f.id] : null);
  if (L.goal.x >= tx0 - 3 && L.goal.x <= tx1 + 3) drawGoal(c, L.goal.x * s, (L.goal.y + 0.5) * s, s, t, true);
  for (const cn of L.coins) if (!W.coins.has(cn.id) && cn.x >= tx0 - 1 && cn.x <= tx1 + 1) drawCoin(c, cn.x * s, cn.y * s, s, t, cn.id);
  for (const st of L.stars) if (!W.stars.has(st.id) && st.x >= tx0 - 1 && st.x <= tx1 + 1) drawStar(c, st.x * s, st.y * s, s, t);
  for (const f of L.foes) {
    const dead = W.killT && W.killT[f.id] != null ? W.killT[f.id] : (W.kills.has(f.id) ? 9 : 0);
    if (dead > 0.6) continue;
    const p = foePos(W, f);
    if (p.x < tx0 - 2 || p.x > tx1 + 2) continue;
    drawFoe(c, f, p, s, t, dead);
  }
  const order = balls.slice().sort((a, b) => (a.b === me) - (b.b === me));
  for (const it of order) {
    const b = it.b;
    if (!b || b.home) continue;
    if (b.dead > 0) continue;
    const alpha = b.spawn > 0 ? (Math.floor(b.spawn * 12) % 2 ? 0.4 : 1) : 1;
    drawBall(c, b.x * s, b.y * s, s, b, it.ci, t, { alpha });
  }
  for (const q of V.parts) {
    const X = q.x * s, Y = q.y * s;
    const a = clamp(q.life / q.max * 1.5, 0, 1);
    c.globalAlpha = a;
    if (q.k === 'txt') { c.font = `900 ${Math.round(s * 0.5)}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`; c.textAlign = 'center'; c.lineWidth = 4; c.strokeStyle = INK; c.strokeText(q.text, X, Y); c.fillStyle = q.col; c.fillText(q.text, X, Y); }
    else if (q.k === 'puff') { c.fillStyle = q.col; c.beginPath(); c.arc(X, Y, q.sz * s * (1.6 - a * 0.6), 0, TAU); c.fill(); }
    else if (q.k === 'shard') { c.save(); c.translate(X, Y); c.rotate(q.rot); c.fillStyle = q.col; c.fillRect(-q.sz * s, -q.sz * s * 0.6, q.sz * s * 2, q.sz * s * 1.2); c.restore(); }
    else if (q.k === 'spark') { c.fillStyle = q.col; starPath(c, X, Y, q.sz * s * 2, q.sz * s * 0.8); c.fill(); }
    else { c.fillStyle = q.col; c.beginPath(); c.arc(X, Y, q.sz * s, 0, TAU); c.fill(); }
  }
  c.globalAlpha = 1;
  for (const it of balls) {
    const b = it.b;
    if (!b || b.home || b.dead > 0 || !names || !names[it.k]) continue;
    const X = b.x * s, Y = (b.y - R) * s - 12;
    c.font = "800 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"; c.textAlign = 'center';
    const tw = c.measureText(names[it.k]).width + 14;
    c.fillStyle = 'rgba(27,20,48,0.78)'; rr(c, X - tw / 2, Y - 15, tw, 19, 9.5); c.fill();
    c.fillStyle = BALLS[it.ci % BALLS.length].light; c.fillText(names[it.k], X, Y - 1);
    const bb = bubbles && bubbles[it.k];
    if (bb) { c.font = '28px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; c.globalAlpha = Math.min(1, (bb.life - bb.t) / 0.3); c.fillText(bb.text, X, Y - 24 - bb.t * 14); c.globalAlpha = 1; }
  }
  c.restore();
}
