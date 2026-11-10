export const W0 = 360;
export const H0 = 640;
export const LINE = 104;
export const WATER_Y = H0 - 44;
export const TIERS = 13;
export const RAD = Array.from({ length: TIERS }, (_, k) => 22 * 1.19 ** k);
export const DT = 1 / 180;
const G = 1850;
const DAMP = 0.997;
const ITER = 5;
const TAU = Math.PI * 2;
const cl = (v, a, b) => (v < a ? a : v > b ? b : v);
export const tierValue = (k) => 2 ** k;

export class Balloon {
  constructor(k, x, y, id, sc) {
    this.id = id;
    this.k = k;
    this.r = RAD[k];
    const n = cl(Math.round((TAU * this.r) / 9), 16, 34);
    this.n = n;
    this.px = new Float64Array(n); this.py = new Float64Array(n);
    this.ox = new Float64Array(n); this.oy = new Float64Array(n);
    this.rx = new Float64Array(n); this.ry = new Float64Array(n);
    this.sc = sc == null ? 1 : sc;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      this.rx[i] = Math.cos(a) * this.r; this.ry[i] = Math.sin(a) * this.r;
      this.px[i] = x + this.rx[i] * this.sc; this.py[i] = y + this.ry[i] * this.sc;
      this.ox[i] = this.px[i]; this.oy[i] = this.py[i];
    }
    this.area0 = 0.5 * n * this.r * this.r * Math.sin(TAU / n);
    this.edge0 = 2 * this.r * Math.sin(Math.PI / n);
    this.m = this.r * this.r;
    this.firm = k <= 0 ? 0.03 : k <= 2 ? 0.02 : k <= 5 ? 0.012 : 0.008;
    this.cx = x; this.cy = y; this.ang = 0; this.cs = 1; this.sn = 0;
    this.minx = x - this.r; this.maxx = x + this.r; this.miny = y - this.r; this.maxy = y + this.r;
    this.age = 0; this.flash = 0; this.cool = 0; this.join = null; this.gone = false;
    this.vx = 0; this.vy = 0; this.thrown = 0; this.wob = 0; this.seed = (id * 0.6180339) % 1;
  }

  centre() {
    let sx = 0; let sy = 0;
    for (let i = 0; i < this.n; i++) { sx += this.px[i]; sy += this.py[i]; }
    this.cx = sx / this.n; this.cy = sy / this.n;
  }

  box() {
    let a = Infinity; let b = -Infinity; let c = Infinity; let d = -Infinity;
    for (let i = 0; i < this.n; i++) {
      const x = this.px[i]; const y = this.py[i];
      if (x < a) a = x; if (x > b) b = x; if (y < c) c = y; if (y > d) d = y;
    }
    this.minx = a; this.maxx = b; this.miny = c; this.maxy = d;
  }

  kick(vx, vy) {
    for (let i = 0; i < this.n; i++) { this.ox[i] = this.px[i] - vx * DT; this.oy[i] = this.py[i] - vy * DT; }
  }

  vel() {
    let vx = 0; let vy = 0;
    for (let i = 0; i < this.n; i++) { vx += this.px[i] - this.ox[i]; vy += this.py[i] - this.oy[i]; }
    return [vx / this.n / DT, vy / this.n / DT];
  }

  shape(first) {
    const n = this.n; const px = this.px; const py = this.py;
    this.centre();
    const cx = this.cx; const cy = this.cy;
    let s = 0; let c = 0;
    for (let i = 0; i < n; i++) { const dx = px[i] - cx; const dy = py[i] - cy; s += this.rx[i] * dy - this.ry[i] * dx; c += this.rx[i] * dx + this.ry[i] * dy; }
    const l = Math.sqrt(s * s + c * c) || 1;
    const cs = c / l; const sn = s / l;
    this.cs = cs; this.sn = sn; this.ang = Math.atan2(sn, cs);
    const sc = this.sc;
    const ks = this.firm * (first ? 1.6 : 1);
    for (let i = 0; i < n; i++) {
      const gx = cx + (cs * this.rx[i] - sn * this.ry[i]) * sc;
      const gy = cy + (sn * this.rx[i] + cs * this.ry[i]) * sc;
      px[i] += (gx - px[i]) * ks; py[i] += (gy - py[i]) * ks;
    }
    const L = this.edge0 * sc;
    for (let i = 0; i < n; i++) {
      const j = i + 1 === n ? 0 : i + 1;
      const ex = px[j] - px[i]; const ey = py[j] - py[i];
      const el = Math.sqrt(ex * ex + ey * ey) || 1;
      const k = ((el - L) / el) * (el > L ? 0.22 : 0.3);
      px[i] += ex * k; py[i] += ey * k; px[j] -= ex * k; py[j] -= ey * k;
    }
    let area = 0; let per = 0;
    for (let i = 0; i < n; i++) {
      const j = i + 1 === n ? 0 : i + 1;
      area += px[i] * py[j] - px[j] * py[i];
      const ex = px[j] - px[i]; const ey = py[j] - py[i];
      per += Math.sqrt(ex * ex + ey * ey);
    }
    area *= 0.5;
    const d = (0.9 * (this.area0 * sc * sc - area)) / (per || 1);
    for (let i = 0; i < n; i++) {
      const a = i === 0 ? n - 1 : i - 1; const b = i + 1 === n ? 0 : i + 1;
      let nx = py[b] - py[a]; let ny = -(px[b] - px[a]);
      const nl = Math.sqrt(nx * nx + ny * ny) || 1;
      nx /= nl; ny /= nl;
      px[i] += nx * d; py[i] += ny * d;
    }
  }

  top() {
    let m = Infinity;
    for (let i = 0; i < this.n; i++) if (this.py[i] < m) m = this.py[i];
    return m;
  }
}

function inside(B, x, y) {
  let c = false;
  const n = B.n; const px = B.px; const py = B.py;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const yi = py[i]; const yj = py[j];
    if ((yi > y) !== (yj > y) && x < ((px[j] - px[i]) * (y - yi)) / (yj - yi) + px[i]) c = !c;
  }
  return c;
}

function pushVerts(A, B) {
  const x0 = B.minx; const x1 = B.maxx; const y0 = B.miny; const y1 = B.maxy;
  const wa = B.m / (A.m + B.m); const wb = A.m / (A.m + B.m);
  const n = B.n; const bx = B.px; const by = B.py;
  let hit = 0;
  for (let i = 0; i < A.n; i++) {
    const x = A.px[i]; const y = A.py[i];
    if (x < x0 || x > x1 || y < y0 || y > y1) continue;
    if (!inside(B, x, y)) continue;
    let best = Infinity; let bj = 0; let bt = 0; let qx = 0; let qy = 0;
    for (let j = 0; j < n; j++) {
      const k = j + 1 === n ? 0 : j + 1;
      const ax = bx[j]; const ay = by[j]; const ex = bx[k] - ax; const ey = by[k] - ay;
      const l2 = ex * ex + ey * ey || 1e-6;
      let t = ((x - ax) * ex + (y - ay) * ey) / l2;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const sx = ax + ex * t; const sy = ay + ey * t;
      const d2 = (x - sx) * (x - sx) + (y - sy) * (y - sy);
      if (d2 < best) { best = d2; bj = j; bt = t; qx = sx; qy = sy; }
    }
    const d = Math.sqrt(best);
    let nx; let ny;
    if (d > 1e-5) { nx = (qx - x) / d; ny = (qy - y) / d; }
    else { const k = bj + 1 === n ? 0 : bj + 1; nx = by[k] - by[bj]; ny = -(bx[k] - bx[bj]); const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l; }
    const pen = d + 0.25;
    const bk = bj + 1 === n ? 0 : bj + 1;
    A.px[i] += nx * pen * wa; A.py[i] += ny * pen * wa;
    B.px[bj] -= nx * pen * wb * (1 - bt); B.py[bj] -= ny * pen * wb * (1 - bt);
    B.px[bk] -= nx * pen * wb * bt; B.py[bk] -= ny * pen * wb * bt;
    const tx = -ny; const ty = nx;
    const va = (A.px[i] - A.ox[i]) * tx + (A.py[i] - A.oy[i]) * ty;
    const vb = ((B.px[bj] - B.ox[bj]) * (1 - bt) + (B.px[bk] - B.ox[bk]) * bt) * tx + ((B.py[bj] - B.oy[bj]) * (1 - bt) + (B.py[bk] - B.oy[bk]) * bt) * ty;
    const rel = (va - vb) * 0.12;
    A.ox[i] += tx * rel * wa; A.oy[i] += ty * rel * wa;
    if (pen > hit) hit = pen;
  }
  return hit;
}

export class SquishWorld {
  constructor(rnd) {
    this.rnd = rnd || Math.random;
    this.balloons = [];
    this.nextId = 1;
    this.t = 0;
    this.score = 0;
    this.events = [];
    this.splashes = [];
    this.ripples = [];
    this.danger = 0;
    this.over = false;
    this.joins = [];
    this.combo = 0;
    this.comboT = 0;
    this.queue = [this.pick(), this.pick(), this.pick(), this.pick()];
  }

  pick() {
    const r = this.rnd();
    return r < 0.32 ? 0 : r < 0.62 ? 1 : r < 0.86 ? 2 : 3;
  }

  current() { return this.queue[0]; }

  drop(x, vx, vy) {
    if (this.over) return null;
    const k = this.queue.shift();
    this.queue.push(this.pick());
    const r = RAD[k];
    const b = new Balloon(k, cl(x, r + 3, W0 - r - 3), LINE - r - 8, this.nextId++);
    const v = cl(vy == null ? 980 : vy, 700, 2300);
    b.kick(cl(vx || 0, -420, 420), v);
    b.thrown = v > 1300 ? 1 : 0.5;
    this.balloons.push(b);
    this.events.push({ k: 'drop', x: b.cx, v });
    return b;
  }

  merge(a, b) {
    a.gone = true; b.gone = true;
    const ma = a.m; const mb = b.m;
    a.centre(); b.centre();
    const x = (a.cx * ma + b.cx * mb) / (ma + mb); const y = (a.cy * ma + b.cy * mb) / (ma + mb);
    const [vax, vay] = a.vel(); const [vbx, vby] = b.vel();
    const k = a.k + 1;
    this.combo = this.comboT > 0 ? this.combo + 1 : 1;
    this.comboT = 0.9;
    this.splashes.push({ x, y, r: RAD[Math.min(k, TIERS - 1)], k: Math.min(k, TIERS - 1), t: 0, big: k >= TIERS });
    if (k >= TIERS) {
      this.score += tierValue(k);
      this.events.push({ k: 'merge', tier: k, x, y, combo: this.combo });
      return;
    }
    const nb = new Balloon(k, x, y, this.nextId++, 0.8);
    nb.kick(((vax * ma + vbx * mb) / (ma + mb)) * 0.4, ((vay * ma + vby * mb) / (ma + mb)) * 0.4 - 70);
    nb.flash = 1;
    nb.age = 2;
    nb.cool = 0.16;
    nb.wob = 1;
    this.balloons.push(nb);
    this.score += tierValue(k);
    this.events.push({ k: 'merge', tier: k, x, y, combo: this.combo });
  }

  step() {
    const bl = this.balloons;
    const n = bl.length;
    const g = G * DT * DT;
    for (let b = 0; b < n; b++) {
      const B = bl[b];
      if (B.join) B.sc = Math.max(0.8, B.sc - DT * 1.2);
      else if (B.sc < 1) B.sc = Math.min(1, B.sc + DT * 1.4);
      B.age += DT;
      if (B.cool > 0) B.cool -= DT;
      if (B.flash > 0) B.flash = Math.max(0, B.flash - DT * 3);
      if (B.wob > 0) B.wob = Math.max(0, B.wob - DT * 1.5);
      if (B.thrown > 0) B.thrown = Math.max(0, B.thrown - DT * 2.2);
      let svx = 0; let svy = 0;
      for (let i = 0; i < B.n; i++) {
        const wet = B.py[i] > WATER_Y ? 0.985 : 1;
        const vx = (B.px[i] - B.ox[i]) * DAMP * wet; const vy = (B.py[i] - B.oy[i]) * DAMP * wet;
        svx += vx; svy += vy;
        B.ox[i] = B.px[i]; B.oy[i] = B.py[i];
        B.px[i] += vx; B.py[i] += vy + g;
      }
      B.vx = svx / B.n / DT; B.vy = svy / B.n / DT;
    }
    const merges = [];
    for (let it = 0; it < ITER; it++) {
      for (let b = 0; b < n; b++) { bl[b].shape(it === 0); bl[b].box(); }
      for (let a = 0; a < n; a++) {
        const A = bl[a];
        if (A.gone) continue;
        for (let b = a + 1; b < n; b++) {
          const B = bl[b];
          if (B.gone || (A.join && A.join === B.join)) continue;
          if (A.maxx < B.minx || B.maxx < A.minx || A.maxy < B.miny || B.maxy < A.miny) continue;
          const dx = B.cx - A.cx; const dy = B.cy - A.cy;
          const dd2 = dx * dx + dy * dy;
          const core = (A.r * A.sc + B.r * B.sc) * 0.48;
          if (dd2 < core * core) {
            const dd = Math.sqrt(dd2) || 0.001;
            const ux = dd2 > 1e-6 ? dx / dd : 0; const uy = dd2 > 1e-6 ? dy / dd : -1;
            const push = (core - dd) * 0.5;
            const pa = push * (B.m / (A.m + B.m)); const pb = push * (A.m / (A.m + B.m));
            for (let i = 0; i < A.n; i++) { A.px[i] -= ux * pa; A.py[i] -= uy * pa; }
            for (let i = 0; i < B.n; i++) { B.px[i] += ux * pb; B.py[i] += uy * pb; }
            A.cx -= ux * pa; A.cy -= uy * pa; B.cx += ux * pb; B.cy += uy * pb;
          }
          const h1 = pushVerts(A, B);
          const h2 = pushVerts(B, A);
          const touching = h1 > 0 || h2 > 0;
          if (it === 0 && touching) {
            const rv = Math.hypot(A.vx - B.vx, A.vy - B.vy);
            if (rv > 260 && (A.age < 1.5 || B.age < 1.5)) {
              this.events.push({ k: 'bump', v: rv, x: (A.cx + B.cx) / 2, y: (A.cy + B.cy) / 2, small: 12 - Math.min(A.k, B.k) });
              if (rv > 700) { A.wob = Math.max(A.wob, 0.8); B.wob = Math.max(B.wob, 0.6); }
            }
          }
          if (touching && A.k === B.k && !A.join && !B.join && A.cool <= 0 && B.cool <= 0 && !merges.some(([x, y]) => x === A || y === A || x === B || y === B)) merges.push([A, B]);
        }
      }
      for (let b = 0; b < n; b++) {
        const B = bl[b];
        for (let i = 0; i < B.n; i++) {
          if (B.px[i] < 2) { B.px[i] = 2; B.oy[i] += (B.py[i] - B.oy[i]) * 0.12; }
          else if (B.px[i] > W0 - 2) { B.px[i] = W0 - 2; B.oy[i] += (B.py[i] - B.oy[i]) * 0.12; }
          if (B.py[i] > H0 - 2) {
            if (it === 0 && B.py[i] - B.oy[i] > 5 && B.age < 3) {
              const v = (B.py[i] - B.oy[i]) / DT;
              this.events.push({ k: 'floor', v, x: B.px[i], y: H0, small: 12 - B.k });
              if (v > 600) B.wob = Math.max(B.wob, 0.9);
            }
            B.py[i] = H0 - 2;
            B.ox[i] += (B.px[i] - B.ox[i]) * 0.3;
          }
        }
      }
    }
    for (const B of bl) {
      if (!B.splashed && B.age < 4 && B.maxy > WATER_Y && B.vy > 300) {
        B.splashed = true;
        this.ripples.push({ x: B.cx, t: 0, a: Math.min(1, B.vy / 1400), w: B.r });
        this.events.push({ k: 'water', v: B.vy, x: B.cx, y: WATER_Y });
      }
    }
    merges.forEach(([a, b]) => { const j = { a, b, t: 0 }; a.join = j; b.join = j; this.joins.push(j); });
    let joined = false;
    this.joins.forEach((j) => {
      j.t += DT;
      const { a, b } = j;
      a.centre(); b.centre();
      const ma = a.m; const mb = b.m;
      const x = (a.cx * ma + b.cx * mb) / (ma + mb); const y = (a.cy * ma + b.cy * mb) / (ma + mb);
      const f = Math.min(0.45, 0.06 + j.t * 2.4);
      [a, b].forEach((B) => { const dx = (x - B.cx) * f; const dy = (y - B.cy) * f; for (let i = 0; i < B.n; i++) { B.px[i] += dx; B.py[i] += dy; } });
      if (j.t >= 0.1 || Math.hypot(a.cx - b.cx, a.cy - b.cy) < Math.max(a.r, b.r) * 0.35) { j.done = true; this.merge(a, b); joined = true; }
    });
    if (joined) { this.joins = this.joins.filter((j) => !j.done); this.balloons = this.balloons.filter((b) => !b.gone); }
    if (this.comboT > 0) { this.comboT -= DT; if (this.comboT <= 0) this.combo = 0; }
    this.splashes.forEach((s) => { s.t += DT; });
    if (this.splashes.length) this.splashes = this.splashes.filter((s) => s.t < 0.9);
    this.ripples.forEach((r) => { r.t += DT; });
    if (this.ripples.length) this.ripples = this.ripples.filter((r) => r.t < 1.6);
    this.t += DT;
    let over = false;
    for (const B of this.balloons) if (B.age > 1.4 && !B.join && B.top() < LINE) { over = true; break; }
    this.danger = over ? this.danger + DT : Math.max(0, this.danger - DT * 2);
    if (this.danger > 2.6) this.over = true;
  }
}
