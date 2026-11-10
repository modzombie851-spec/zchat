import { rng, shuffle, clamp, r2 } from './physics.jsx';

export const TW = 1270;
export const TH = 2540;
export const R = 28.6;
export const HEAD_Y = TH * 0.75;
export const FOOT = [TW / 2, TH / 4];
export const CUE_START = [TW / 2, TH * 0.82];

const G = 9810;
const MU_S = 0.2;
const MU_R = 0.016;
const DRAG = 0.34;
const MU_SP = 0.044;
const E_BALL = 0.95;
const MU_C = 0.18;
const SIN_T = 0.27;
const COS_T = 0.963;
const DT = 1 / 240;
const REC = 2;
const MAX_T = 24;
const CM = 80;
const SM = 62;
export const CW = 38;
export const RW = 70;

export const POCKETS = [
  [-8, -8, 52], [TW + 8, -8, 52],
  [-26, TH / 2, 46], [TW + 26, TH / 2, 46],
  [-8, TH + 8, 52], [TW + 8, TH + 8, 52],
];
export const MOUTH = { CM, SM };

const SEGS = [];
function seg(x1, y1, x2, y2, rail) {
  const dx = x2 - x1; const dy = y2 - y1;
  SEGS.push({ x1, y1, dx, dy, l2: dx * dx + dy * dy, rail });
}
seg(CM, 0, TW - CM, 0, 1);
seg(CM, TH, TW - CM, TH, 1);
seg(0, CM, 0, TH / 2 - SM, 1);
seg(0, TH / 2 + SM, 0, TH - CM, 1);
seg(TW, CM, TW, TH / 2 - SM, 1);
seg(TW, TH / 2 + SM, TW, TH - CM, 1);
seg(CM, 0, CM - 42, -CW, 0);
seg(0, CM, -CW, CM - 42, 0);
seg(TW - CM, 0, TW - CM + 42, -CW, 0);
seg(TW, CM, TW + CW, CM - 42, 0);
seg(CM, TH, CM - 42, TH + CW, 0);
seg(0, TH - CM, -CW, TH - CM + 42, 0);
seg(TW - CM, TH, TW - CM + 42, TH + CW, 0);
seg(TW, TH - CM, TW + CW, TH - CM + 42, 0);
seg(0, TH / 2 - SM, -CW, TH / 2 - SM + 12, 0);
seg(0, TH / 2 + SM, -CW, TH / 2 + SM - 12, 0);
seg(TW, TH / 2 - SM, TW + CW, TH / 2 - SM + 12, 0);
seg(TW, TH / 2 + SM, TW + CW, TH / 2 + SM - 12, 0);
export const CUSHION_SEGS = SEGS;

export const COLORS = { 0: '#F6F2E6', 1: '#F2B705', 2: '#1F4FC4', 3: '#D7261E', 4: '#5B2A8C', 5: '#F06A12', 6: '#137A3A', 7: '#7A1F24', 8: '#121214' };
export const kindOf = (id) => (id === 0 ? 'cue' : id === 8 ? 'eight' : id < 8 ? 's' : 't');
export const ballColor = (id) => COLORS[id > 8 ? id - 8 : id];

export function rack(seed) {
  const rnd = rng(`pool:${seed}`);
  const ids = shuffle([1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15], rnd);
  const solid = ids.find((i) => i < 8);
  const stripe = ids.find((i) => i > 8);
  const rest = ids.filter((i) => i !== solid && i !== stripe);
  const out = [];
  let k = 0;
  const flip = rnd() < 0.5;
  for (let row = 0; row < 5; row++) {
    for (let c = 0; c <= row; c++) {
      let id;
      if (row === 2 && c === 1) id = 8;
      else if (row === 4 && c === 0) id = flip ? stripe : solid;
      else if (row === 4 && c === 4) id = flip ? solid : stripe;
      else id = rest[k++];
      const x = FOOT[0] + (c - row / 2) * (2 * R + 0.2);
      const y = FOOT[1] - row * (R + 0.1) * Math.sqrt(3);
      out.push([id, r2(x), r2(y)]);
    }
  }
  return [[0, CUE_START[0], CUE_START[1]]].concat(out);
}

export function rack9(seed) {
  const rnd = rng(`pool9:${seed}`);
  const mid = shuffle([2, 3, 4, 5, 6, 7, 8], rnd);
  const out = [];
  let k = 0;
  [1, 2, 3, 2, 1].forEach((n, row) => {
    for (let c = 0; c < n; c++) {
      const id = row === 0 ? 1 : row === 2 && c === 1 ? 9 : mid[k++];
      out.push([id, r2(FOOT[0] + (c - (n - 1) / 2) * (2 * R + 0.2)), r2(FOOT[1] - row * (R + 0.1) * Math.sqrt(3))]);
    }
  });
  return [[0, CUE_START[0], CUE_START[1]]].concat(out);
}

export function initial(base, seed, v) {
  if (v === 9) return { ...base, v: 9, b: rack9(seed), gx: null, bih: true, ls: null, ev: null, w: null, why: null };
  return { ...base, b: rack(seed), gx: null, bih: true, ls: null, ev: null, w: null, why: null };
}

export function lowBall(balls) {
  let lo = null;
  (balls || []).forEach(([id]) => { if (id > 0 && (lo === null || id < lo)) lo = id; });
  return lo;
}

export function canPlace(balls, x, y, brk) {
  if (x < R || x > TW - R || y < R || y > TH - R || (brk && y < HEAD_Y)) return false;
  return !balls.some(([id, bx, by]) => id !== 0 && (bx - x) * (bx - x) + (by - y) * (by - y) < 4 * R * R + 1);
}

export function spotFree(balls, x, y0, dir) {
  let y = y0;
  for (let i = 0; i < 80; i++) {
    if (!balls.some(([, bx, by]) => (bx - x) * (bx - x) + (by - y) * (by - y) < 4 * R * R)) return [x, y];
    y += dir * R * 0.5;
  }
  return [x, y0];
}

export function groupOf(st, mark) {
  if (!st.gx) return null;
  return mark === 'x' ? st.gx : st.gx === 's' ? 't' : 's';
}
const leftOf = (balls, g) => balls.filter(([id]) => (g === 's' ? id >= 1 && id <= 7 : id >= 9 && id <= 15)).length;

export function shotSpeed(p) {
  return 200 + 9800 * (0.25 * p + 0.25 * p * p + 0.5 * p * p * p);
}

function cushionE(vn) {
  return clamp(0.9 - 0.04 * (vn / 1000), 0.7, 0.9);
}

export class PoolSim {
  constructor(balls, shot, orient) {
    const list = balls.map(([id, x, y]) => [id, x, y]);
    if (!list.some((b) => b[0] === 0)) list.unshift([0, shot.cx != null ? shot.cx : CUE_START[0], shot.cy != null ? shot.cy : CUE_START[1]]);
    list.sort((a, b) => a[0] - b[0]);
    const n = list.length;
    this.n = n;
    this.ids = list.map((b) => b[0]);
    this.x = new Float64Array(n); this.y = new Float64Array(n);
    this.vx = new Float64Array(n); this.vy = new Float64Array(n);
    this.wx = new Float64Array(n); this.wy = new Float64Array(n); this.wz = new Float64Array(n);
    this.q = new Float64Array(n * 4);
    this.on = new Uint8Array(n);
    this.potT = new Float64Array(n).fill(-1);
    this.potPk = new Int8Array(n).fill(-1);
    this.potV = new Float64Array(n * 2);
    for (let i = 0; i < n; i++) {
      this.x[i] = list[i][1]; this.y[i] = list[i][2]; this.on[i] = 1;
      const o = orient && orient[this.ids[i]];
      if (o) { this.q[i * 4] = o[0]; this.q[i * 4 + 1] = o[1]; this.q[i * 4 + 2] = o[2]; this.q[i * 4 + 3] = o[3]; } else this.q[i * 4] = 1;
    }
    const ci = this.ids.indexOf(0);
    this.ci = ci;
    if (shot.cx != null && shot.cy != null) { this.x[ci] = shot.cx; this.y[ci] = shot.cy; }
    let dx = shot.dx; let dy = shot.dy;
    const dl = Math.sqrt(dx * dx + dy * dy) || 1;
    dx /= dl; dy /= dl;
    const a = clamp(shot.e || 0, -100, 100) * 0.005;
    const b = clamp(shot.s || 0, -100, 100) * 0.005;
    const sq = -0.06 * a;
    let ux = dx - dy * sq; let uy = dy + dx * sq;
    const ul = Math.sqrt(ux * ux + uy * uy);
    ux /= ul; uy /= ul;
    const p = clamp(shot.p || 0, 1, 1000) / 1000;
    const v0 = shotSpeed(p);
    this.vx[ci] = ux * v0; this.vy[ci] = uy * v0;
    const k = 2.5 * v0 / R;
    this.wx[ci] = k * b * dy; this.wy[ci] = -k * b * dx; this.wz[ci] = -k * a;
    this.t = 0;
    this.tick = 0;
    this.done = false;
    this.first = null;
    this.cush = 0;
    this.events = [{ t: 0, k: 0, i: ci, j: -1, s: p }];
    this.cap = 1024;
    this.frames = new Float32Array(this.cap * n * 6);
    this.count = 0;
    this.record();
  }

  record() {
    const n = this.n;
    if ((this.count + 1) * n * 6 > this.frames.length) {
      const f = new Float32Array(this.frames.length * 2);
      f.set(this.frames);
      this.frames = f;
    }
    let o = this.count * n * 6;
    for (let i = 0; i < n; i++) {
      this.frames[o++] = this.x[i]; this.frames[o++] = this.y[i];
      this.frames[o++] = this.q[i * 4]; this.frames[o++] = this.q[i * 4 + 1]; this.frames[o++] = this.q[i * 4 + 2]; this.frames[o++] = this.q[i * 4 + 3];
    }
    this.count += 1;
  }

  active(i) {
    return this.on[i] && (this.vx[i] !== 0 || this.vy[i] !== 0 || this.wx[i] !== 0 || this.wy[i] !== 0 || this.wz[i] !== 0);
  }

  friction(i, h) {
    let vx = this.vx[i]; let vy = this.vy[i]; let wx = this.wx[i]; let wy = this.wy[i]; let wz = this.wz[i];
    const ux = vx + R * wy; const uy = vy - R * wx;
    const us = Math.sqrt(ux * ux + uy * uy);
    const slideDv = MU_S * G * h;
    if (us > 3.5 * slideDv) {
      const nx = ux / us; const ny = uy / us;
      vx -= slideDv * nx; vy -= slideDv * ny;
      const kw = 2.5 * MU_S * G * h / R;
      wx += kw * ny; wy -= kw * nx;
    } else {
      if (us > 0) {
        vx -= ux / 3.5; vy -= uy / 3.5;
        wx += (2.5 / (3.5 * R)) * uy; wy -= (2.5 / (3.5 * R)) * ux;
      }
      const sp = Math.sqrt(vx * vx + vy * vy);
      const rollDv = MU_R * G * h * (1 + 160 / (sp + 160) * 0.6);
      if (sp <= rollDv) { vx = 0; vy = 0; } else { const f = (sp - rollDv) / sp; vx *= f; vy *= f; }
      wx = vy / R; wy = -vx / R;
    }
    const dr = 1 - DRAG * h;
    vx *= dr; vy *= dr;
    if (us <= 3.5 * slideDv) { wx = vy / R; wy = -vx / R; }
    if (wz !== 0) {
      const dz = (5 * MU_SP * G / (2 * R)) * h;
      if (wz > dz) wz -= dz; else if (wz < -dz) wz += dz; else wz = 0;
    }
    if (vx * vx + vy * vy < 9 && Math.abs(wx) + Math.abs(wy) < 0.2) { vx = 0; vy = 0; wx = 0; wy = 0; }
    this.vx[i] = vx; this.vy[i] = vy; this.wx[i] = wx; this.wy[i] = wy; this.wz[i] = wz;
  }

  ballPair(i, j) {
    const dx = this.x[j] - this.x[i]; const dy = this.y[j] - this.y[i];
    const d2 = dx * dx + dy * dy;
    if (d2 >= 4 * R * R || d2 === 0) return;
    const d = Math.sqrt(d2);
    const nx = dx / d; const ny = dy / d;
    const pen = (2 * R - d) / 2;
    this.x[i] -= nx * pen; this.y[i] -= ny * pen; this.x[j] += nx * pen; this.y[j] += ny * pen;
    const vrn = (this.vx[i] - this.vx[j]) * nx + (this.vy[i] - this.vy[j]) * ny;
    if (vrn <= 0) return;
    const jn = (1 + E_BALL) * vrn / 2;
    const s1x = this.vx[i] - this.wz[i] * R * ny; const s1y = this.vy[i] + this.wz[i] * R * nx; const s1z = R * (this.wx[i] * ny - this.wy[i] * nx);
    const s2x = this.vx[j] + this.wz[j] * R * ny; const s2y = this.vy[j] - this.wz[j] * R * nx; const s2z = -R * (this.wx[j] * ny - this.wy[j] * nx);
    let ux = s1x - s2x; let uy = s1y - s2y; const uz = s1z - s2z;
    const un = ux * nx + uy * ny;
    ux -= un * nx; uy -= un * ny;
    const ut = Math.sqrt(ux * ux + uy * uy + uz * uz);
    let px = -jn * nx; let py = -jn * ny; let pz = 0;
    if (ut > 1e-6) {
      const mu = 0.055 + 0.05 / (1 + vrn / 600);
      const jt = Math.min(mu * jn, ut / 7);
      px -= jt * ux / ut; py -= jt * uy / ut; pz -= jt * uz / ut;
      const cx = ny * pz; const cy = -nx * pz; const cz = nx * py - ny * px;
      const k = 2.5 / R;
      this.wx[i] += k * cx; this.wy[i] += k * cy; this.wz[i] += k * cz;
      this.wx[j] += k * cx; this.wy[j] += k * cy; this.wz[j] += k * cz;
    }
    this.vx[i] += px; this.vy[i] += py;
    this.vx[j] -= px; this.vy[j] -= py;
    if (this.first === null) {
      if (this.ids[i] === 0) this.first = this.ids[j]; else if (this.ids[j] === 0) this.first = this.ids[i];
    }
    this.events.push({ t: this.t, k: 1, i, j, s: vrn });
  }

  cushions(i) {
    for (let s = 0; s < SEGS.length; s++) {
      const g = SEGS[s];
      const bx = this.x[i]; const by = this.y[i];
      let t = ((bx - g.x1) * g.dx + (by - g.y1) * g.dy) / g.l2;
      if (t < 0) t = 0; else if (t > 1) t = 1;
      const qx = g.x1 + g.dx * t; const qy = g.y1 + g.dy * t;
      const ex = bx - qx; const ey = by - qy;
      const d2 = ex * ex + ey * ey;
      if (d2 >= R * R || d2 === 0) continue;
      const d = Math.sqrt(d2);
      const nx = ex / d; const ny = ey / d;
      this.x[i] = qx + nx * R; this.y[i] = qy + ny * R;
      const vn = this.vx[i] * nx + this.vy[i] * ny;
      if (vn >= 0) continue;
      const e = cushionE(-vn);
      const jn = -(1 + e) * vn;
      const rx = -R * COS_T * nx; const ry = -R * COS_T * ny; const rz = -R * SIN_T;
      const wx = this.wx[i]; const wy = this.wy[i]; const wz = this.wz[i];
      let ux = this.vx[i] + (wy * rz - wz * ry);
      let uy = this.vy[i] + (wz * rx - wx * rz);
      let uz = wx * ry - wy * rx;
      const cnx = COS_T * nx; const cny = COS_T * ny; const cnz = SIN_T;
      const un = ux * cnx + uy * cny + uz * cnz;
      ux -= un * cnx; uy -= un * cny; uz -= un * cnz;
      const ut = Math.sqrt(ux * ux + uy * uy + uz * uz);
      this.vx[i] += jn * nx; this.vy[i] += jn * ny;
      if (ut > 1e-6) {
        const jt = Math.min(MU_C * jn / COS_T, ut / 3.5);
        const fx = -jt * ux / ut; const fy = -jt * uy / ut; const fz = -jt * uz / ut;
        this.vx[i] += fx; this.vy[i] += fy;
        const k = 2.5 / (R * R);
        this.wx[i] += k * (ry * fz - rz * fy);
        this.wy[i] += k * (rz * fx - rx * fz);
        this.wz[i] += k * (rx * fy - ry * fx);
      }
      this.cush += 1;
      this.events.push({ t: this.t, k: 2, i, j: g.rail ? s : -1, s: -vn });
    }
  }

  pockets(i) {
    const bx = this.x[i]; const by = this.y[i];
    if (bx > 46 && bx < TW - 46 && by > 46 && by < TH - 46) return;
    for (let p = 0; p < POCKETS.length; p++) {
      const [px, py, pr] = POCKETS[p];
      const ex = bx - px; const ey = by - py;
      if (ex * ex + ey * ey < pr * pr) { this.pot(i, p); return; }
    }
    if (bx < -80 || bx > TW + 80 || by < -80 || by > TH + 80) {
      let best = 0; let bd = Infinity;
      for (let p = 0; p < POCKETS.length; p++) { const d = (bx - POCKETS[p][0]) ** 2 + (by - POCKETS[p][1]) ** 2; if (d < bd) { bd = d; best = p; } }
      this.pot(i, best);
    }
  }

  pot(i, p) {
    this.on[i] = 0;
    this.potT[i] = this.t;
    this.potPk[i] = p;
    this.potV[i * 2] = this.vx[i]; this.potV[i * 2 + 1] = this.vy[i];
    this.vx[i] = 0; this.vy[i] = 0; this.wx[i] = 0; this.wy[i] = 0; this.wz[i] = 0;
    this.events.push({ t: this.t, k: 3, i, j: p, s: Math.sqrt(this.potV[i * 2] ** 2 + this.potV[i * 2 + 1] ** 2) });
  }

  orient(h) {
    for (let i = 0; i < this.n; i++) {
      if (!this.on[i]) continue;
      const wx = this.wx[i]; const wy = this.wy[i]; const wz = this.wz[i];
      if (wx === 0 && wy === 0 && wz === 0) continue;
      const o = i * 4;
      const qw = this.q[o]; const qx = this.q[o + 1]; const qy = this.q[o + 2]; const qz = this.q[o + 3];
      const hh = h * 0.5;
      let nw = qw + hh * (-wx * qx - wy * qy - wz * qz);
      let nx = qx + hh * (wx * qw + wy * qz - wz * qy);
      let ny = qy + hh * (wy * qw + wz * qx - wx * qz);
      let nz = qz + hh * (wz * qw + wx * qy - wy * qx);
      const l = Math.sqrt(nw * nw + nx * nx + ny * ny + nz * nz) || 1;
      nw /= l; nx /= l; ny /= l; nz /= l;
      this.q[o] = nw; this.q[o + 1] = nx; this.q[o + 2] = ny; this.q[o + 3] = nz;
    }
  }

  step() {
    const n = this.n;
    let vmax = 0;
    let any = false;
    for (let i = 0; i < n; i++) {
      if (!this.on[i]) continue;
      const s = this.vx[i] * this.vx[i] + this.vy[i] * this.vy[i];
      if (s > vmax) vmax = s;
      if (!any && this.active(i)) any = true;
    }
    if (!any || this.t > MAX_T) { this.finish(); return; }
    vmax = Math.sqrt(vmax);
    let subs = Math.ceil((vmax * DT) / (R * 0.22));
    if (subs < 1) subs = 1; else if (subs > 24) subs = 24;
    const h = DT / subs;
    for (let s = 0; s < subs; s++) {
      for (let i = 0; i < n; i++) {
        if (!this.active(i)) continue;
        this.friction(i, h);
        this.x[i] += this.vx[i] * h; this.y[i] += this.vy[i] * h;
      }
      for (let i = 0; i < n; i++) {
        if (!this.on[i]) continue;
        const mi = this.vx[i] !== 0 || this.vy[i] !== 0;
        for (let j = i + 1; j < n; j++) {
          if (!this.on[j]) continue;
          if (!mi && this.vx[j] === 0 && this.vy[j] === 0) continue;
          this.ballPair(i, j);
        }
      }
      for (let i = 0; i < n; i++) {
        if (!this.on[i] || (this.vx[i] === 0 && this.vy[i] === 0)) continue;
        const bx = this.x[i]; const by = this.y[i];
        if (bx < R + 2 || bx > TW - R - 2 || by < R + 2 || by > TH - R - 2) this.cushions(i);
        if (this.on[i]) this.pockets(i);
      }
      this.orient(h);
      this.t += h;
    }
    this.tick += 1;
    if (this.tick % REC === 0) this.record();
  }

  finish() {
    if (this.done) return;
    for (let i = 0; i < this.n; i++) { this.vx[i] = 0; this.vy[i] = 0; this.wx[i] = 0; this.wy[i] = 0; this.wz[i] = 0; }
    this.record();
    this.done = true;
    this.duration = this.t;
  }

  run(budgetMs) {
    const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
    let k = 0;
    while (!this.done) {
      this.step();
      k += 1;
      if (budgetMs != null && (k & 15) === 0 && performance.now() - t0 > budgetMs) break;
    }
    return this.done;
  }

  final() {
    const out = [];
    for (let i = 0; i < this.n; i++) if (this.on[i]) out.push([this.ids[i], r2(this.x[i]), r2(this.y[i])]);
    return out;
  }

  potted() {
    const list = [];
    for (let i = 0; i < this.n; i++) if (!this.on[i]) list.push([this.potT[i], this.ids[i]]);
    return list.sort((a, b) => a[0] - b[0]).map((p) => p[1]);
  }

  result() {
    return { final: this.final(), ev: { f: this.first, pt: this.potted(), cush: this.cush } };
  }
}

function judge9(st, shot, res, me) {
  const mark = me === st.x ? 'x' : 'o';
  const other = me === st.x ? st.o : st.x;
  const pt = res.ev.pt;
  const lo = lowBall(st.b);
  let foul = null;
  if (pt.includes(0)) foul = 'scratch';
  else if (res.ev.f === null) foul = 'miss';
  else if (res.ev.f !== lo) foul = 'wrong';
  let b = res.final.slice();
  let w = null;
  let why = null;
  let back = false;
  if (pt.includes(9)) {
    if (foul) {
      back = true;
      const [sx, sy] = spotFree(b, FOOT[0], FOOT[1], -1);
      b.push([9, r2(sx), r2(sy)]);
    } else { w = mark; why = 'nine'; }
  }
  const again = !foul && pt.some((id) => id !== 0);
  if (foul) b = b.filter(([id]) => id !== 0);
  const t = w ? st.t : again ? me : other;
  const ls = { dx: shot.dx, dy: shot.dy, p: shot.p, s: shot.s || 0, ...(shot.e ? { e: shot.e } : {}), ...(shot.cx != null ? { cx: shot.cx, cy: shot.cy } : {}) };
  return { ...st, b, gx: null, bih: !!foul && !w, t, n: (st.n || 0) + 1, w, why, lb: me, ls, ev: { f: res.ev.f, pt, fl: foul, r8: back } };
}

export function judge(st, shot, res, me) {
  if (st.v === 9) return judge9(st, shot, res, me);
  const mark = me === st.x ? 'x' : 'o';
  const other = me === st.x ? st.o : st.x;
  const brk = (st.n || 0) === 0;
  const g = groupOf(st, mark);
  const cleared = g ? leftOf(st.b, g) === 0 : false;
  let foul = null;
  const pt = res.ev.pt;
  if (pt.includes(0)) foul = 'scratch';
  else if (res.ev.f === null) foul = 'miss';
  else if (!brk) {
    const f = res.ev.f;
    if (g) { if (cleared ? f !== 8 : kindOf(f) !== g) foul = 'wrong'; } else if (f === 8) foul = 'wrong';
  }
  let b = res.final.slice();
  let gx = st.gx || null;
  let w = null;
  let why = null;
  let r8 = false;
  if (pt.includes(8)) {
    if (brk) {
      r8 = true;
      const [sx, sy] = spotFree(b, FOOT[0], FOOT[1], -1);
      b.push([8, r2(sx), r2(sy)]);
    } else if (foul || !cleared) { w = mark === 'x' ? 'o' : 'x'; why = 'eight'; } else { w = mark; why = 'eight'; }
  }
  const mine = pt.filter((id) => id !== 0 && id !== 8);
  if (!brk && !gx && !foul && mine.length) {
    const k = kindOf(mine[0]);
    gx = mark === 'x' ? k : k === 's' ? 't' : 's';
  }
  const myG = groupOf({ gx }, mark);
  const again = !foul && mine.length > 0 && (brk || mine.some((id) => kindOf(id) === myG));
  if (foul) b = b.filter(([id]) => id !== 0);
  const t = w ? st.t : again ? me : other;
  const ls = { dx: shot.dx, dy: shot.dy, p: shot.p, s: shot.s || 0, ...(shot.e ? { e: shot.e } : {}), ...(shot.cx != null ? { cx: shot.cx, cy: shot.cy } : {}) };
  return { ...st, b, gx, bih: !!foul && !w, t, n: (st.n || 0) + 1, w, why, lb: me, ls, ev: { f: res.ev.f, pt, fl: foul, r8 } };
}

export function play(st, shot, me) {
  const sim = new PoolSim(st.b, shot);
  sim.run();
  const res = sim.result();
  return { next: judge(st, shot, res, me), res, sim };
}

export function aimRay(balls, cx, cy, ux, uy) {
  let hit = null;
  for (const [id, bx, by] of balls) {
    if (id === 0) continue;
    const ex = bx - cx; const ey = by - cy;
    const along = ex * ux + ey * uy;
    if (along <= 0) continue;
    const perp2 = ex * ex + ey * ey - along * along;
    const rr = 4 * R * R;
    if (perp2 > rr) continue;
    const t = along - Math.sqrt(rr - perp2);
    if (!hit || t < hit.t) hit = { t, id, bx, by };
  }
  const cands = [];
  if (ux > 0) cands.push([(TW - R - cx) / ux, 'x']);
  if (ux < 0) cands.push([(R - cx) / ux, 'x']);
  if (uy > 0) cands.push([(TH - R - cy) / uy, 'y']);
  if (uy < 0) cands.push([(R - cy) / uy, 'y']);
  let wall = null;
  cands.forEach(([t, ax]) => { if (t >= 0 && (!wall || t < wall.t)) wall = { t, ax }; });
  if (hit && (!wall || hit.t <= wall.t)) return hit;
  return { t: wall ? wall.t : 0, id: null, ax: wall ? wall.ax : 'y' };
}

export function findPot(st, me) {
  const mark = me === st.x ? 'x' : 'o';
  const g = groupOf(st, mark);
  const cleared = g ? leftOf(st.b, g) === 0 : false;
  const cue = st.b.find((b) => b[0] === 0) || [0, CUE_START[0], CUE_START[1]];
  const place = st.bih ? { cx: cue[1], cy: cue[2] } : {};
  const lo = st.v === 9 ? lowBall(st.b) : null;
  const targets = st.b.filter(([id]) => id !== 0 && (st.v === 9 ? id === lo : cleared ? id === 8 : g ? kindOf(id) === g : id !== 8));
  const holes = POCKETS.map((p) => [clamp(p[0], 0, TW), clamp(p[1], 0, TH)]);
  const cands = [];
  for (const [, bx, by] of targets) {
    for (const [hx, hy] of holes) {
      const ax = hx - bx; const ay = hy - by; const al = Math.sqrt(ax * ax + ay * ay) || 1;
      const gx = bx - (ax / al) * 2 * R; const gy = by - (ay / al) * 2 * R;
      const sx = gx - cue[1]; const sy = gy - cue[2]; const sl = Math.sqrt(sx * sx + sy * sy) || 1;
      const cut = (sx / sl) * (ax / al) + (sy / sl) * (ay / al);
      if (cut < 0.35) continue;
      cands.push({ cut, l: al + sl, dx: Math.round((sx / sl) * 1e6), dy: Math.round((sy / sl) * 1e6) });
    }
  }
  cands.sort((a, b) => b.cut - a.cut || a.l - b.l);
  let ok = null;
  for (const c of cands.slice(0, 20)) {
    for (const p of [380, 560, 780]) {
      const shot = { dx: c.dx, dy: c.dy, p, s: 0, ...place };
      const { next } = play(st, shot, me);
      if (next.w) { if (next.w === mark) return shot; continue; }
      if (!next.ev.fl && next.t === me) return shot;
      if (!ok && !next.ev.fl) ok = shot;
    }
  }
  if (ok) return ok;
  return { dx: 0, dy: -1000000, p: 500, s: 0, ...place };
}
