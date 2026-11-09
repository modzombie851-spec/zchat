import { clamp, r2 } from './physics.jsx';

export const BW = 740;
export const C = BW / 2;
export const CR = 15.9;
export const SR = 20.65;
export const PR = 22.5;
export const POCK = [[PR, PR], [BW - PR, PR], [PR, BW - PR], [BW - PR, BW - PR]];
export const BASE_OFF = 117.9;
export const BASE_HALF = 219.1;
export const QUEEN = 19;
export const isWhite = (id) => id >= 1 && id <= 9;
export const isBlack = (id) => id >= 10 && id <= 18;
export const colorOf = (id) => (id === QUEEN ? 'q' : isWhite(id) ? 'w' : isBlack(id) ? 'k' : 's');

const G = 9810;
const MU = 0.17;
const DRAG = 0.42;
const E_DISC = 0.9;
const E_WALL = 0.74;
const MU_D = 0.12;
const DT = 1 / 240;
const MAX_T = 14;
const M_COIN = 5.5;
const M_STRIKER = 15;

export function baseY(mark) { return mark === 'x' ? BW - BASE_OFF : BASE_OFF; }

export function setup() {
  const out = [[QUEEN, C, C]];
  const d = CR * 2 + 0.3;
  const inner = [];
  for (let k = 0; k < 6; k++) inner.push([C + Math.cos((k * Math.PI) / 3 - Math.PI / 2) * d, C + Math.sin((k * Math.PI) / 3 - Math.PI / 2) * d]);
  const outer = [];
  for (let k = 0; k < 6; k++) {
    const a = (k * Math.PI) / 3 - Math.PI / 2;
    outer.push([C + Math.cos(a) * d * 2, C + Math.sin(a) * d * 2]);
    const b = a + Math.PI / 6;
    outer.push([C + Math.cos(b) * d * Math.sqrt(3), C + Math.sin(b) * d * Math.sqrt(3)]);
  }
  let w = 1; let k = 10;
  inner.forEach(([x, y], i) => { out.push([i % 2 === 0 ? w++ : k++, r2(x), r2(y)]); });
  outer.forEach(([x, y], i) => { out.push([i % 2 === 0 ? w++ : k++, r2(x), r2(y)]); });
  return out;
}

export function initial(base) {
  return { ...base, b: setup(), wc: base.t === base.x ? 'x' : 'o', qp: null, qc: null, ls: null, ev: null, w: null, why: null, pts: 0, lb: null };
}

export function strikerOk(coins, x, mark) {
  if (x < C - BASE_HALF - 0.01 || x > C + BASE_HALF + 0.01) return false;
  const y = baseY(mark);
  return !coins.some(([, cx, cy]) => (cx - x) * (cx - x) + (cy - y) * (cy - y) < (CR + SR) * (CR + SR));
}

export function strikerSpeed(p) {
  return 260 + 6400 * (0.3 * p + 0.7 * p * p);
}

export class CarromSim {
  constructor(coins, shot, mark) {
    const list = coins.map(([id, x, y]) => [id, x, y]);
    list.sort((a, b) => a[0] - b[0]);
    list.unshift([0, clamp(shot.sx, C - BASE_HALF, C + BASE_HALF), baseY(mark)]);
    const n = list.length;
    this.n = n;
    this.ids = list.map((b) => b[0]);
    this.x = new Float64Array(n); this.y = new Float64Array(n);
    this.vx = new Float64Array(n); this.vy = new Float64Array(n);
    this.w = new Float64Array(n); this.a = new Float64Array(n);
    this.r = new Float64Array(n); this.m = new Float64Array(n);
    this.on = new Uint8Array(n);
    this.potT = new Float64Array(n).fill(-1);
    this.potPk = new Int8Array(n).fill(-1);
    for (let i = 0; i < n; i++) {
      this.x[i] = list[i][1]; this.y[i] = list[i][2]; this.on[i] = 1;
      this.r[i] = this.ids[i] === 0 ? SR : CR;
      this.m[i] = this.ids[i] === 0 ? M_STRIKER : M_COIN;
      this.a[i] = ((this.ids[i] * 2654435761) % 6283) / 1000;
    }
    let dx = shot.dx; let dy = shot.dy;
    const l = Math.sqrt(dx * dx + dy * dy) || 1;
    dx /= l; dy /= l;
    const v0 = strikerSpeed(clamp(shot.p || 0, 1, 1000) / 1000);
    this.vx[0] = dx * v0; this.vy[0] = dy * v0;
    this.t = 0;
    this.tick = 0;
    this.done = false;
    this.first = null;
    this.events = [{ t: 0, k: 0, i: 0, j: -1, s: v0 }];
    this.cap = 512;
    this.frames = new Float32Array(this.cap * n * 3);
    this.count = 0;
    this.record();
  }

  record() {
    const n = this.n;
    if ((this.count + 1) * n * 3 > this.frames.length) { const f = new Float32Array(this.frames.length * 2); f.set(this.frames); this.frames = f; }
    let o = this.count * n * 3;
    for (let i = 0; i < n; i++) { this.frames[o++] = this.x[i]; this.frames[o++] = this.y[i]; this.frames[o++] = this.a[i]; }
    this.count += 1;
  }

  friction(i, h) {
    let vx = this.vx[i]; let vy = this.vy[i];
    const sp = Math.sqrt(vx * vx + vy * vy);
    const dv = MU * G * h;
    if (sp <= dv) { vx = 0; vy = 0; } else { const f = (sp - dv) / sp * (1 - DRAG * h); vx *= f; vy *= f; }
    let w = this.w[i];
    const dw = 2 * MU * G * h / this.r[i];
    if (w > dw) w -= dw; else if (w < -dw) w += dw; else w = 0;
    this.vx[i] = vx; this.vy[i] = vy; this.w[i] = w;
  }

  pair(i, j) {
    const dx = this.x[j] - this.x[i]; const dy = this.y[j] - this.y[i];
    const rr = this.r[i] + this.r[j];
    const d2 = dx * dx + dy * dy;
    if (d2 >= rr * rr || d2 === 0) return;
    const d = Math.sqrt(d2);
    const nx = dx / d; const ny = dy / d;
    const mi = this.m[i]; const mj = this.m[j];
    const pen = rr - d;
    const ki = mj / (mi + mj); const kj = mi / (mi + mj);
    this.x[i] -= nx * pen * ki; this.y[i] -= ny * pen * ki; this.x[j] += nx * pen * kj; this.y[j] += ny * pen * kj;
    const vrn = (this.vx[i] - this.vx[j]) * nx + (this.vy[i] - this.vy[j]) * ny;
    if (vrn <= 0) return;
    const inv = 1 / mi + 1 / mj;
    const jn = (1 + E_DISC) * vrn / inv;
    let px = -jn * nx; let py = -jn * ny;
    const tx = -ny; const ty = nx;
    const vt = (this.vx[i] - this.vx[j]) * tx + (this.vy[i] - this.vy[j]) * ty + this.w[i] * this.r[i] + this.w[j] * this.r[j];
    const Ii = 0.5 * mi * this.r[i] * this.r[i]; const Ij = 0.5 * mj * this.r[j] * this.r[j];
    const kt = inv + (this.r[i] * this.r[i]) / Ii + (this.r[j] * this.r[j]) / Ij;
    let jt = -vt / kt;
    const lim = MU_D * jn;
    if (jt > lim) jt = lim; else if (jt < -lim) jt = -lim;
    px += jt * tx; py += jt * ty;
    this.vx[i] += px / mi; this.vy[i] += py / mi;
    this.vx[j] -= px / mj; this.vy[j] -= py / mj;
    this.w[i] += (jt * this.r[i]) / Ii;
    this.w[j] += (jt * this.r[j]) / Ij;
    if (this.first === null && (this.ids[i] === 0 || this.ids[j] === 0)) this.first = this.ids[i] === 0 ? this.ids[j] : this.ids[i];
    this.events.push({ t: this.t, k: 1, i, j, s: vrn });
  }

  walls(i) {
    const r = this.r[i];
    let hit = 0;
    if (this.x[i] < r) { this.x[i] = r; if (this.vx[i] < 0) { hit = -this.vx[i]; this.bounce(i, 1, 0); } }
    else if (this.x[i] > BW - r) { this.x[i] = BW - r; if (this.vx[i] > 0) { hit = this.vx[i]; this.bounce(i, -1, 0); } }
    if (this.y[i] < r) { this.y[i] = r; if (this.vy[i] < 0) { hit = Math.max(hit, -this.vy[i]); this.bounce(i, 0, 1); } }
    else if (this.y[i] > BW - r) { this.y[i] = BW - r; if (this.vy[i] > 0) { hit = Math.max(hit, this.vy[i]); this.bounce(i, 0, -1); } }
    if (hit) this.events.push({ t: this.t, k: 2, i, j: -1, s: hit });
  }

  bounce(i, nx, ny) {
    const vn = this.vx[i] * nx + this.vy[i] * ny;
    const e = clamp(E_WALL - 0.03 * (-vn / 1000), 0.55, E_WALL);
    const jn = -(1 + e) * vn;
    const tx = -ny; const ty = nx;
    const vt = this.vx[i] * tx + this.vy[i] * ty + this.w[i] * this.r[i];
    const m = this.m[i]; const I = 0.5 * m * this.r[i] * this.r[i];
    const kt = 1 / m + (this.r[i] * this.r[i]) / I;
    let jt = -vt / kt;
    const lim = 0.16 * jn * m;
    if (jt > lim) jt = lim; else if (jt < -lim) jt = -lim;
    this.vx[i] += jn * nx + (jt / m) * tx; this.vy[i] += jn * ny + (jt / m) * ty;
    this.w[i] += (jt * this.r[i]) / I;
  }

  pockets(i) {
    const x = this.x[i]; const y = this.y[i];
    if (x > 60 && x < BW - 60) return;
    if (y > 60 && y < BW - 60) return;
    const reach = this.ids[i] === 0 ? PR + 1 : PR + 3.5;
    for (let p = 0; p < 4; p++) {
      const dx = x - POCK[p][0]; const dy = y - POCK[p][1];
      if (dx * dx + dy * dy < reach * reach) {
        this.on[i] = 0;
        this.potT[i] = this.t;
        this.potPk[i] = p;
        this.events.push({ t: this.t, k: 3, i, j: p, s: Math.sqrt(this.vx[i] * this.vx[i] + this.vy[i] * this.vy[i]) });
        this.vx[i] = 0; this.vy[i] = 0; this.w[i] = 0;
        return;
      }
    }
  }

  step() {
    const n = this.n;
    let vmax = 0; let any = false;
    for (let i = 0; i < n; i++) {
      if (!this.on[i]) continue;
      const s = this.vx[i] * this.vx[i] + this.vy[i] * this.vy[i];
      if (s > vmax) vmax = s;
      if (s > 0 || this.w[i] !== 0) any = true;
    }
    if (!any || this.t > MAX_T) { this.finish(); return; }
    vmax = Math.sqrt(vmax);
    let subs = Math.ceil((vmax * DT) / (CR * 0.25));
    if (subs < 1) subs = 1; else if (subs > 24) subs = 24;
    const h = DT / subs;
    for (let s = 0; s < subs; s++) {
      for (let i = 0; i < n; i++) {
        if (!this.on[i]) continue;
        if (this.vx[i] === 0 && this.vy[i] === 0 && this.w[i] === 0) continue;
        this.friction(i, h);
        this.x[i] += this.vx[i] * h; this.y[i] += this.vy[i] * h; this.a[i] += this.w[i] * h;
      }
      for (let i = 0; i < n; i++) {
        if (!this.on[i]) continue;
        const mi = this.vx[i] !== 0 || this.vy[i] !== 0;
        for (let j = i + 1; j < n; j++) {
          if (!this.on[j]) continue;
          if (!mi && this.vx[j] === 0 && this.vy[j] === 0) continue;
          this.pair(i, j);
        }
      }
      for (let i = 0; i < n; i++) {
        if (!this.on[i] || (this.vx[i] === 0 && this.vy[i] === 0)) continue;
        this.walls(i);
        this.pockets(i);
      }
      this.t += h;
    }
    this.tick += 1;
    if (this.tick % 2 === 0) this.record();
  }

  finish() {
    if (this.done) return;
    for (let i = 0; i < this.n; i++) { this.vx[i] = 0; this.vy[i] = 0; this.w[i] = 0; }
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

  result() {
    const final = [];
    const pt = [];
    for (let i = 0; i < this.n; i++) {
      if (this.ids[i] === 0) continue;
      if (this.on[i]) final.push([this.ids[i], r2(this.x[i]), r2(this.y[i])]);
      else pt.push([this.potT[i], this.ids[i]]);
    }
    pt.sort((a, b) => a[0] - b[0]);
    const si = this.ids.indexOf(0);
    return { final, pt: pt.map((p) => p[1]), striker: !this.on[si], first: this.first, sx: r2(this.x[si]), sy: r2(this.y[si]) };
  }
}

export function freeSpot(coins, x0, y0) {
  const ok = (x, y) => !coins.some(([, cx, cy]) => (cx - x) * (cx - x) + (cy - y) * (cy - y) < 4 * CR * CR);
  if (ok(x0, y0)) return [x0, y0];
  for (let ring = 1; ring < 14; ring++) {
    const n = ring * 6;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2;
      const x = x0 + Math.cos(a) * ring * CR * 2.05; const y = y0 + Math.sin(a) * ring * CR * 2.05;
      if (x > 80 && x < BW - 80 && y > 80 && y < BW - 80 && ok(x, y)) return [r2(x), r2(y)];
    }
  }
  return [x0, y0];
}

export function colorOfMark(st, mark) {
  return st.wc === mark ? 'w' : 'k';
}

export function judge(st, shot, res, me) {
  const mark = me === st.x ? 'x' : 'o';
  const opp = mark === 'x' ? 'o' : 'x';
  const myC = colorOfMark(st, mark);
  const mine = (id) => (myC === 'w' ? isWhite(id) : isBlack(id));
  const theirs = (id) => (myC === 'w' ? isBlack(id) : isWhite(id));
  let b = res.final.slice();
  const pt = res.pt.slice();
  const ret = [];
  let foul = null;
  let qp = st.qp || null;
  let qc = st.qc || null;
  let cov = false;
  const putBack = (id) => { const [x, y] = freeSpot(b, C, C); b.push([id, x, y]); ret.push(id); };
  const ownIn = pt.filter(mine);
  const oppIn = pt.filter(theirs);
  const queenIn = pt.includes(QUEEN);
  const onBoard = (pred) => b.filter(([id]) => pred(id)).length;
  const ownBefore = 9 - st.b.filter(([id]) => mine(id)).length;
  if (res.striker) {
    foul = 'striker';
    ownIn.forEach(putBack);
    if (queenIn) putBack(QUEEN);
    if (qp === mark) { putBack(QUEEN); qp = null; }
    const pocketedMine = 9 - onBoard(mine);
    if (pocketedMine > 0) {
      const gone = [];
      for (let id = myC === 'w' ? 1 : 10; id <= (myC === 'w' ? 9 : 18); id++) if (!b.some((c) => c[0] === id)) gone.push(id);
      if (gone.length) putBack(gone[0]);
    }
  } else {
    if (queenIn) {
      if (ownBefore + ownIn.length === 0) putBack(QUEEN);
      else if (ownIn.length) { qc = mark; qp = null; cov = true; }
      else qp = mark;
    } else if (qp === mark) {
      if (ownIn.length) { qc = mark; qp = null; cov = true; } else { putBack(QUEEN); qp = null; }
    }
    if (!qc && !qp && onBoard(mine) === 0 && b.some((c) => c[0] === QUEEN)) {
      foul = 'last';
      ownIn.slice(-1).forEach(putBack);
    }
  }
  if (!foul && onBoard(theirs) === 0 && oppIn.length && !qc) { foul = 'opplast'; oppIn.slice(-1).forEach(putBack); }
  const myLeft = onBoard(mine);
  const oppLeft = onBoard(theirs);
  let w = null; let why = null; let pts = 0;
  if (oppLeft === 0 && qc) { w = opp; why = oppIn.length ? 'opp' : 'board'; pts = myLeft + (qc === opp ? 3 : 0); }
  else if (myLeft === 0 && qc && !foul) { w = mark; why = 'board'; pts = oppLeft + (qc === mark ? 3 : 0); }
  const again = !foul && !w && (ownIn.length > 0 || (queenIn && qp === mark));
  const t = w ? st.t : again ? me : (me === st.x ? st.o : st.x);
  const ls = { sx: shot.sx, dx: shot.dx, dy: shot.dy, p: shot.p };
  return { ...st, b, qp, qc, t, n: (st.n || 0) + 1, w, why, pts, lb: me, ls, ev: { pt, st: !!res.striker, fl: foul, cov, ret, f: res.first } };
}

export function play(st, shot, me) {
  const mark = me === st.x ? 'x' : 'o';
  const sim = new CarromSim(st.b, shot, mark);
  sim.run();
  const res = sim.result();
  return { next: judge(st, shot, res, me), res, sim };
}

export function findShot(st, me) {
  const mark = me === st.x ? 'x' : 'o';
  const myC = colorOfMark(st, mark);
  const y = baseY(mark);
  const want = st.b.filter(([id]) => (myC === 'w' ? isWhite(id) : isBlack(id)));
  let best = null;
  for (let sx = C - BASE_HALF; sx <= C + BASE_HALF; sx += 36.5) {
    if (!strikerOk(st.b, sx, mark)) continue;
    for (const [, cx, cy] of want) {
      for (const [px, py] of POCK) {
        if ((mark === 'x' && py > y) || (mark === 'o' && py < y)) continue;
        const ax = px - cx; const ay = py - cy; const al = Math.hypot(ax, ay) || 1;
        const gx = cx - (ax / al) * (CR + SR); const gy = cy - (ay / al) * (CR + SR);
        const dx = gx - sx; const dy = gy - y; const dl = Math.hypot(dx, dy) || 1;
        if ((mark === 'x' && dy >= -10) || (mark === 'o' && dy <= 10)) continue;
        const cut = (dx / dl) * (ax / al) + (dy / dl) * (ay / al);
        if (cut < 0.5) continue;
        const score = cut * 2 - (al + dl) / 900;
        if (!best || score > best.score) best = { score, shot: { sx: r2(sx), dx: Math.round((dx / dl) * 1e6), dy: Math.round((dy / dl) * 1e6), p: 520 } };
      }
    }
  }
  return best ? best.shot : { sx: C, dx: 0, dy: mark === 'x' ? -1000000 : 1000000, p: 700 };
}
