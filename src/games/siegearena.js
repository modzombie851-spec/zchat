import { MeshBuilder, hexRgb } from './race3d.js';
import { TILE, C_WALL, C_CRATE, C_BUSH, C_WATER, C_PAD, C_HOME } from './siegeengine.js';
import { MAT as MB, hsh, sq, ball, withT, tube, rot, disc } from './siegemesh.js';

const MAT = { ...MB, soil: -0.1, stone: -0.2, snow: -0.3, woodX: -0.4, woodZ: -0.45, plate: -0.5, asphalt: -0.6, basalt: -0.7, sand: -0.8, leaf: -0.9 };
const hx = (h) => hexRgb(h);
const lc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const mc = (a, k) => [Math.min(1, a[0] * k), Math.min(1, a[1] * k), Math.min(1, a[2] * k)];
const sat = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
const ss = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const fade = (t) => t * t * (3 - 2 * t);
function vn(x, z, s = 0) {
  const xi = Math.floor(x), zi = Math.floor(z), u = fade(x - xi), v = fade(z - zi);
  const a = hsh(xi, zi, s), b = hsh(xi + 1, zi, s), c = hsh(xi, zi + 1, s), d = hsh(xi + 1, zi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, z, s = 0, o = 3) { let t = 0, a = 0.5, f = 1, n = 0; for (let i = 0; i < o; i++) { t += a * vn(x * f, z * f, s + i * 31); n += a; a *= 0.5; f *= 2.07; } return t / n; }
function rng(seed) { let a = (seed >>> 0) || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const pick = (r, list) => list[Math.floor(r() * list.length) % list.length];

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scl = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const nrm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const fn3 = (a, b, c) => nrm(crs(sub(b, a), sub(c, a)));
function pv(m, p, n, c, mt) { m.v.push(p[0], p[1], p[2], n[0], n[1], n[2], c[0], c[1], c[2], mt); }
function triC(m, a, b, c, ca, cb, cc, mt) { a = m.tp(a); b = m.tp(b); c = m.tp(c); const n = fn3(a, b, c); pv(m, a, n, ca, mt); pv(m, b, n, cb, mt); pv(m, c, n, cc, mt); }
function quadC(m, a, b, c, d, ca, cb, cc, cd, mt) { triC(m, a, b, c, ca, cb, cc, mt); triC(m, a, c, d, ca, cc, cd, mt); }
function surfC(m, P, CC, mt, o = {}) {
  const R = P.length, Cn = P[0].length, wrap = !!o.wrap;
  const Q = P.map((row) => row.map((p) => m.tp(p)));
  const N = Q.map((row) => row.map(() => [0, 0, 0]));
  const cols = wrap ? Cn : Cn - 1;
  for (let i = 0; i < R - 1; i++) for (let j = 0; j < cols; j++) {
    const j1 = (j + 1) % Cn;
    const a = Q[i][j], b = Q[i + 1][j], c = Q[i + 1][j1], d = Q[i][j1];
    const ex = c[0] - a[0], ey = c[1] - a[1], ez = c[2] - a[2], fx = d[0] - b[0], fy = d[1] - b[1], fz = d[2] - b[2];
    const nx = ey * fz - ez * fy, ny = ez * fx - ex * fz, nz = ex * fy - ey * fx;
    for (const n of [N[i][j], N[i + 1][j], N[i + 1][j1], N[i][j1]]) { n[0] += nx; n[1] += ny; n[2] += nz; }
  }
  for (const row of N) for (const n of row) { const l = Math.hypot(n[0], n[1], n[2]) || 1; n[0] /= l; n[1] /= l; n[2] /= l; }
  for (let i = 0; i < R - 1; i++) for (let j = 0; j < cols; j++) {
    const j1 = (j + 1) % Cn;
    const a = Q[i][j], b = Q[i + 1][j], c = Q[i + 1][j1], d = Q[i][j1];
    const ca = CC[i][j], cb = CC[i + 1][j], cc = CC[i + 1][j1], cd = CC[i][j1];
    pv(m, a, N[i][j], ca, mt); pv(m, b, N[i + 1][j], cb, mt); pv(m, c, N[i + 1][j1], cc, mt);
    pv(m, a, N[i][j], ca, mt); pv(m, c, N[i + 1][j1], cc, mt); pv(m, d, N[i][j1], cd, mt);
  }
}
function blockC(m, x0, y0, z0, x1, y1, z1, col, mt, o = {}) {
  const b = o.bev || 0;
  const top = o.top || mc(col, 1.06), lo = o.lo || mc(col, o.ao == null ? 0.7 : o.ao), hi = o.hi || col;
  const A = [x0, y0, z0], B = [x1, y0, z0], C = [x1, y0, z1], D = [x0, y0, z1];
  const E = [x0 + b, y1, z0 + b], F = [x1 - b, y1, z0 + b], G = [x1 - b, y1, z1 - b], H = [x0 + b, y1, z1 - b];
  const sk = o.skip || '';
  if (!sk.includes('t')) quadC(m, E, H, G, F, top, top, top, top, mt);
  if (!sk.includes('s')) quadC(m, D, C, G, H, lo, lo, hi, hi, mt);
  if (!sk.includes('n')) quadC(m, B, A, E, F, lo, lo, hi, hi, mt);
  if (!sk.includes('e')) quadC(m, C, B, F, G, lo, lo, hi, hi, mt);
  if (!sk.includes('w')) quadC(m, A, D, H, E, lo, lo, hi, hi, mt);
}
function blobC(m, c, r, seg, rows, jit, seed, colFn, mt = 0) {
  const P = [], CC = [];
  for (let i = 0; i <= rows; i++) {
    const v = -Math.PI / 2 + (Math.PI * i) / rows, cv = Math.cos(v), sv = Math.sin(v);
    const row = [], crow = [];
    for (let j = 0; j < seg; j++) {
      const u = (2 * Math.PI * j) / seg;
      const pole = i === 0 || i === rows;
      const k = 1 + jit * ((pole ? hsh(seed, i, 0) : hsh(seed, i, j)) - 0.5) * 2;
      row.push([c[0] + r[0] * cv * Math.cos(u) * k, c[1] + r[1] * sv * k, c[2] + r[2] * cv * Math.sin(u) * k]);
      crow.push(colFn(sv, hsh(seed + 7, i, pole ? 0 : j), cv * Math.cos(u), cv * Math.sin(u)));
    }
    P.push(row); CC.push(crow);
  }
  surfC(m, P, CC, mt, { wrap: true });
}
function tubeC(m, pts, rad, seg, colFn, mt = 0, o = {}) {
  const P = [], CC = [];
  let px = null;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const t = nrm(sub(b, a));
    let x = px ? sub(px, scl(t, px[0] * t[0] + px[1] * t[1] + px[2] * t[2])) : (Math.abs(t[1]) < 0.9 ? crs(t, [0, 1, 0]) : crs(t, [1, 0, 0]));
    x = nrm(x); px = x;
    const y = crs(t, x);
    const row = [], crow = [];
    for (let j = 0; j <= seg; j++) {
      const ang = (j / seg) * Math.PI * 2;
      const rr = rad[i] * (o.rough ? 1 + o.rough(i, j % seg) : 1);
      const d = add(scl(x, Math.cos(ang)), scl(y, Math.sin(ang)));
      row.push(add(p, scl(d, rr)));
      crow.push(colFn(i / Math.max(1, pts.length - 1), j % seg, d));
    }
    P.push(row); CC.push(crow);
  }
  surfC(m, P, CC, mt);
}

function chunker(size) {
  const map = new Map();
  return {
    m(kind, x, z) {
      const k = `${kind}|${Math.floor(x / size)}|${Math.floor(z / size)}`;
      let b = map.get(k);
      if (!b) { b = new MeshBuilder(); b.kind = kind; map.set(k, b); }
      return b;
    },
    out() {
      const res = [];
      for (const b of map.values()) {
        if (!b.v.length) continue;
        const v = b.v;
        let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9;
        for (let i = 0; i < v.length; i += 10) { const x = v[i], y = v[i + 1], z = v[i + 2]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z; }
        const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, cz = (z0 + z1) / 2;
        const r = Math.hypot(x1 - cx, y1 - cy, z1 - cz) + 0.2;
        res.push({ data: b.build(), bs: [cx, cy, cz, r], cast: b.kind === 'props' || b.kind === 'outer', kind: b.kind });
      }
      return res;
    },
  };
}

function cellAt(A, c, r) { return c < 0 || r < 0 || c >= A.W || r >= A.H ? C_WALL : A.cells[r * A.W + c]; }
const solidC = (v) => v === C_WALL || v === C_CRATE;
function makeFields(A) {
  const S = 0.5, nx = A.W * 4, nz = A.H * 4, N = (nx + 1) * (nz + 1);
  const solid = new Float32Array(N).fill(9), water = new Float32Array(N).fill(9), bush = new Float32Array(N).fill(9), shore = new Float32Array(N).fill(9), path = new Float32Array(N).fill(9);
  for (let i = 0; i <= nz; i++) for (let j = 0; j <= nx; j++) {
    const x = j * S, z = i * S, k = i * (nx + 1) + j;
    const c0 = Math.floor(x / TILE), r0 = Math.floor(z / TILE);
    for (let r = r0 - 2; r <= r0 + 2; r++) for (let c = c0 - 2; c <= c0 + 2; c++) {
      const v = cellAt(A, c, r);
      const dx = Math.max(c * TILE - x, 0, x - (c + 1) * TILE), dz = Math.max(r * TILE - z, 0, z - (r + 1) * TILE);
      const d = Math.hypot(dx, dz);
      if (solidC(v)) { if (d < solid[k]) solid[k] = d; } else if (v === C_WATER) { if (d < water[k]) water[k] = d; } else if (v === C_BUSH && d < bush[k]) bush[k] = d;
      if (v !== C_WATER && d < shore[k]) shore[k] = d;
    }
  }
  const lines = pathLines(A);
  for (const L of lines) for (let s = 0; s < L.length - 1; s++) {
    const a = L[s], b = L[s + 1];
    const j0 = Math.max(0, Math.floor((Math.min(a[0], b[0]) - 2.5) / S)), j1 = Math.min(nx, Math.ceil((Math.max(a[0], b[0]) + 2.5) / S));
    const i0 = Math.max(0, Math.floor((Math.min(a[1], b[1]) - 2.5) / S)), i1 = Math.min(nz, Math.ceil((Math.max(a[1], b[1]) + 2.5) / S));
    const ux = b[0] - a[0], uz = b[1] - a[1], L2 = ux * ux + uz * uz || 1;
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
      const x = j * S, z = i * S;
      const t = sat(((x - a[0]) * ux + (z - a[1]) * uz) / L2);
      const d = Math.hypot(x - a[0] - ux * t, z - a[1] - uz * t);
      const k = i * (nx + 1) + j;
      if (d < path[k]) path[k] = d;
    }
  }
  const at = (F, x, z) => { const j = Math.max(0, Math.min(nx, Math.round(x / S))), i = Math.max(0, Math.min(nz, Math.round(z / S))); return F[i * (nx + 1) + j]; };
  return { S, nx, nz, solid, water, bush, shore, path, lines, at };
}
function pathLines(A) {
  const W = A.W, H = A.H;
  const walk = (c, r) => c >= 0 && r >= 0 && c < W && r < H && !solidC(A.cells[r * W + c]) && A.cells[r * W + c] !== C_WATER;
  const hm = A.homes.length ? A.homes : [{ c: W >> 1, r: H - 2 }];
  const start = hm[0];
  const prev = new Int32Array(W * H).fill(-1);
  const seen = new Uint8Array(W * H);
  const q = [start.r * W + start.c];
  seen[q[0]] = 1;
  for (let qi = 0; qi < q.length; qi++) {
    const i = q[qi], c = i % W, r = (i / W) | 0;
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      const c2 = c + dc, r2 = r + dr;
      if (!walk(c2, r2)) continue;
      if (dc && dr && (!walk(c + dc, r) || !walk(c, r + dr))) continue;
      const j = r2 * W + c2;
      if (seen[j]) continue;
      seen[j] = 1; prev[j] = i; q.push(j);
    }
  }
  const goals = [...A.pads.map((p) => p.r * W + p.c)];
  const mid = (H >> 1) * W + (W >> 1);
  if (seen[mid]) goals.push(mid);
  const out = [];
  for (const g of goals) {
    if (!seen[g]) continue;
    const cells = [];
    for (let i = g; i >= 0; i = prev[i]) { cells.push([(i % W + 0.5) * TILE, (((i / W) | 0) + 0.5) * TILE]); if (cells.length > 400) break; }
    let pts = cells;
    for (let it = 0; it < 3; it++) {
      const n = [pts[0]];
      for (let k = 0; k < pts.length - 1; k++) { const a = pts[k], b = pts[k + 1]; n.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); }
      n.push(pts[pts.length - 1]);
      pts = n;
    }
    out.push(pts);
  }
  return out;
}

function leafBroad(m, o, yaw, pitch, len, wid, c0, c1, op = {}) {
  const n = op.seg || 6, droop = op.droop == null ? 0.45 : op.droop, fold = op.fold == null ? 0.22 : op.fold;
  const cp = Math.cos(pitch), dir = [Math.sin(yaw) * cp, Math.sin(pitch), Math.cos(yaw) * cp];
  const side = [Math.cos(yaw), 0, -Math.sin(yaw)];
  let up = crs(side, dir); if (up[1] < 0) up = scl(up, -1);
  const P = [], CC = [];
  for (let k = 0; k <= n; k++) {
    const s = k / n;
    const w = wid * Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(s, op.shape || 0.72))), 0.85);
    const c = [o[0] + dir[0] * len * s, o[1] + dir[1] * len * s - droop * len * s * s, o[2] + dir[2] * len * s];
    const f = -fold * w;
    P.push([add(add(c, scl(side, -w)), scl(up, f)), c, add(add(c, scl(side, w)), scl(up, f))]);
    const cc = lc(c0, c1, Math.pow(s, 0.8));
    CC.push([mc(cc, 0.82), mc(cc, op.rib || 1.12), mc(cc, 0.82)]);
  }
  surfC(m, P, CC, op.mat == null ? MAT.matte : op.mat);
}
function frond(m, o, yaw, rise, len, c0, c1, op = {}) {
  const n = op.seg || 12, drop = op.drop == null ? 0.55 : op.drop, lw = op.lw || 0.3, spread = op.spread == null ? 0.55 : op.spread;
  const dh = [Math.sin(yaw), 0, Math.cos(yaw)], side = [Math.cos(yaw), 0, -Math.sin(yaw)];
  const at = (s) => [o[0] + dh[0] * len * s, o[1] + (rise * s - (rise + drop) * s * s) * len, o[2] + dh[2] * len * s];
  const cs = mc(c0, 0.9);
  for (let k = 0; k < n; k++) {
    const s0 = k / n, s1 = (k + 1) / n;
    const p0 = at(s0), p1 = at(s1);
    const L = len * lw * Math.sin(Math.PI * Math.min(1, 0.12 + s0 * 1.02)) * (op.taper ? 1 - s0 * 0.4 : 1);
    if (L < 0.02) continue;
    const t = nrm(sub(p1, p0));
    const ct = lc(c0, c1, 0.35 + s0 * 0.65);
    for (const sg of [-1, 1]) {
      const tip = add(add(p0, scl(side, sg * L * Math.cos(spread))), add(scl(t, L * 0.45), [0, -L * Math.sin(spread) * 0.8, 0]));
      triC(m, p0, p1, tip, cs, cs, mc(ct, 0.9 + hsh(k, sg + 3, op.seed || 0) * 0.25), MAT.matte);
    }
  }
}
function tuft(m, x, y, z, h, n, c0, c1, seed) {
  for (let i = 0; i < n; i++) {
    const a = hsh(seed, i) * Math.PI * 2, lean = 0.15 + hsh(seed, i, 2) * 0.35, hh = h * (0.6 + hsh(seed, i, 3) * 0.6);
    const bx = x + Math.cos(a) * 0.04, bz = z + Math.sin(a) * 0.04;
    const w = 0.022 + hsh(seed, i, 4) * 0.015;
    const px = Math.cos(a + 1.57) * w, pz = Math.sin(a + 1.57) * w;
    const tip = [bx + Math.cos(a) * lean * hh, y + hh, bz + Math.sin(a) * lean * hh];
    triC(m, [bx - px, y, bz - pz], [bx + px, y, bz + pz], tip, c0, c0, c1, MAT.matte);
  }
}
function rockC(m, x, y, z, rx, ry, rz, seed, cols, mossCol, mt = MAT.stone) {
  blobC(m, [x, y + ry * 0.35, z], [rx, ry, rz], 9, 6, 0.18, seed, (ny, h) => {
    let c = lc(cols[0], cols[1], h);
    if (mossCol && ny > 0.35) c = lc(c, mossCol, ss(0.35, 0.75, ny + (h - 0.5) * 0.3));
    if (ny < -0.2) c = mc(c, 0.7);
    return c;
  }, mt);
}

const JG = {
  soilD: hx('#3A2E21'), soil: hx('#4E3F2E'), soilL: hx('#5E4D38'),
  mossD: hx('#2E421D'), moss: hx('#3F5826'), mossL: hx('#536D2F'), mossY: hx('#677D38'),
  litter: hx('#7A4A28'), litter2: hx('#93622F'),
  path: hx('#80664A'), pathL: hx('#977A56'),
  damp: hx('#2E2A1C'),
  stone: ['#6F6857', '#645E4F', '#79715E', '#5B5648', '#6C6553', '#7D755F', '#686258'].map(hx),
  stoneD: hx('#423E34'), mortar: hx('#221F19'),
  wmoss: [hx('#34461E'), hx('#465A25'), hx('#2C3B19'), hx('#5A6C2E')],
  leafD: hx('#19311A'), leaf: hx('#274A24'), leafL: hx('#3F672D'), leafY: hx('#6A893B'),
  bark: hx('#5E4C3C'), barkD: hx('#3F3329'), barkL: hx('#766350'),
};

function jungleGround(F, x, z, k) {
  const nA = fbm(x * 0.07, z * 0.07, 11, 3), nB = fbm(x * 0.28, z * 0.28, 23, 3), nC = vn(x * 1.4, z * 1.4, 37), nD = fbm(x * 0.85, z * 0.85, 61, 2);
  let g = lc(JG.mossD, JG.moss, sat(nB * 1.4 - 0.15));
  g = lc(g, JG.mossL, ss(0.55, 0.78, nD) * 0.6);
  g = lc(g, JG.mossY, ss(0.68, 0.85, nA) * 0.35);
  let d = lc(JG.soilD, JG.soil, sat(nB * 1.2));
  d = lc(d, JG.soilL, ss(0.6, 0.8, nC) * 0.35);
  d = lc(d, lc(JG.litter, JG.litter2, nC), ss(0.55, 0.72, fbm(x * 0.5 + 3.1, z * 0.5, 51, 2)) * 0.45);
  let bare = ss(0.62, 0.72, (1 - nA) * 0.7 + nD * 0.4);
  if (k != null) {
    const pw = 1.05 + (nB - 0.5) * 0.9;
    bare = Math.max(bare, 1 - ss(pw * 0.45, pw, F.path[k]));
    bare = Math.max(bare, (1 - ss(0.1, 0.9, F.solid[k])) * 0.55);
  }
  let c = lc(g, d, bare);
  if (k != null) {
    const p = 1 - ss(0.2, 0.7, F.path[k]);
    c = lc(c, lc(JG.path, JG.pathL, nC * 0.7 + nD * 0.3), p * 0.5);
    c = lc(c, JG.damp, (1 - ss(0, 1.2, F.water[k])) * 0.55);
    c = lc(c, mc(JG.mossD, 0.8), (1 - ss(0, 0.9, F.bush[k])) * 0.6);
    c = mc(c, 1 - 0.5 * Math.exp(-F.solid[k] * 1.6));
  }
  return mc(c, 0.92 + nC * 0.14);
}

function buildGround(ctx) {
  const { A, F, K, T } = ctx;
  const S = 0.5, CH = 12;
  for (let cz = 0; cz < A.wz; cz += CH) for (let cx = 0; cx < A.wx; cx += CH) {
    const m = K.m('ground', cx + 0.1, cz + 0.1);
    const nx = Math.round(Math.min(CH, A.wx - cx) / S), nz = Math.round(Math.min(CH, A.wz - cz) / S);
    const P = [], CC = [];
    for (let i = 0; i <= nz; i++) {
      const row = [], crow = [];
      for (let j = 0; j <= nx; j++) {
        const x = cx + j * S, z = cz + i * S;
        const k = Math.round(z / S) * (F.nx + 1) + Math.round(x / S);
        row.push([x, T.groundY ? T.groundY(x, z) : 0, z]);
        crow.push(T.ground(F, x, z, k));
      }
      P.push(row); CC.push(crow);
    }
    for (let i = 0; i < nz; i++) for (let j = 0; j < nx; j++) {
      const x = cx + (j + 0.5) * S, z = cz + (i + 0.5) * S;
      if (cellAt(A, Math.floor(x / TILE), Math.floor(z / TILE)) === C_WATER) continue;
      const a = P[i][j], b = P[i + 1][j], c = P[i + 1][j + 1], d = P[i][j + 1];
      const n = [0, 1, 0];
      const mt = T.groundMat;
      pv(m, a, n, CC[i][j], mt); pv(m, b, n, CC[i + 1][j], mt); pv(m, c, n, CC[i + 1][j + 1], mt);
      pv(m, a, n, CC[i][j], mt); pv(m, c, n, CC[i + 1][j + 1], mt); pv(m, d, n, CC[i][j + 1], mt);
    }
  }
  const M = ctx.M, MS = ctx.MS, OS = 1.5;
  const H = (x, z) => ctx.outerY(x, z);
  const band = (x0, z0, x1, z1) => {
    for (let cz = z0; cz < z1 - 0.01; cz += CH) for (let cx = x0; cx < x1 - 0.01; cx += CH) {
      const w = Math.min(CH, x1 - cx), d = Math.min(CH, z1 - cz);
      const nx = Math.max(1, Math.round(w / OS)), nz = Math.max(1, Math.round(d / OS));
      const P = [], CC = [];
      for (let i = 0; i <= nz; i++) {
        const row = [], crow = [];
        for (let j = 0; j <= nx; j++) { const x = cx + (w * j) / nx, z = cz + (d * i) / nz; const y = H(x, z); row.push([x, y, z]); crow.push(T.outerGround(x, z, y, ctx)); }
        P.push(row); CC.push(crow);
      }
      surfC(K.m('ground', cx + w / 2, cz + d / 2), P, CC, T.groundMat);
    }
  };
  band(-M, -M, A.wx + M, 0);
  band(-M, 0, 0, A.wz);
  band(A.wx, 0, A.wx + M, A.wz);
  band(-M, A.wz, A.wx + M, A.wz + MS);
}

function vine(m, x, y, z, len, nz, seed, cs, cl) {
  const n = Math.max(3, Math.round(len / 0.11));
  let px = x, py = y;
  for (let i = 0; i < n; i++) {
    const nx = x + Math.sin(i * 0.7 + seed) * 0.05, ny = y - (len * (i + 1)) / n;
    const w = 0.014;
    quadC(m, [px - w, py, z], [nx - w, ny, z + nz * 0.004], [nx + w, ny, z + nz * 0.004], [px + w, py, z], cs, cs, cs, cs, MAT.matte);
    if (i % 1 === 0) {
      const sg = i % 2 ? 1 : -1, L = 0.07 + hsh(seed, i) * 0.05;
      const lcol = lc(cs, cl, 0.4 + hsh(seed, i, 2) * 0.6);
      const b = [nx, ny + 0.02, z + nz * 0.01];
      triC(m, b, [nx + sg * L, ny + 0.05, z + nz * (0.02 + L * 0.4)], [nx + sg * L * 0.55, ny - L * 0.5, z + nz * 0.03], lcol, mc(lcol, 1.1), mc(lcol, 0.85), MAT.matte);
    }
    px = nx; py = ny;
  }
}
function mossDrip(m, x0, x1, y, z, nz, seed, cols) {
  const n = Math.max(2, Math.round((x1 - x0) / 0.12));
  for (let i = 0; i < n; i++) {
    const a = x0 + ((x1 - x0) * i) / n, b = x0 + ((x1 - x0) * (i + 1)) / n;
    const la = 0.05 + Math.pow(vn(a * 5, seed * 0.37, seed), 2) * 0.42, lb = 0.05 + Math.pow(vn(b * 5, seed * 0.37, seed), 2) * 0.42;
    const ct = cols[1], cb = mc(cols[0], 0.85);
    quadC(m, [a, y - la, z], [b, y - lb, z], [b, y + 0.01, z], [a, y + 0.01, z], cb, cb, ct, ct, MAT.leaf);
  }
}
function glyph(m, cx, cy, z, w, h, seed, dark, light) {
  const fz = z;
  const frame = mc(light, 1.02), panel = mc(dark, 1.35), groove = mc(dark, 0.8);
  blockC(m, cx - w / 2, cy - h / 2, fz - 0.01, cx + w / 2, cy + h / 2, fz + 0.006, panel, MAT.stone, { ao: 0.95, skip: 'n' });
  const fw = 0.045;
  const bar = (x0, y0, x1, y1, col, d) => blockC(m, cx + Math.min(x0, x1), cy + Math.min(y0, y1), fz - 0.005, cx + Math.max(x0, x1), cy + Math.max(y0, y1), fz + d, col, MAT.stone, { ao: 0.95, skip: 'n' });
  const hw = w / 2, hh = h / 2;
  bar(-hw, -hh, hw, -hh + fw, frame, 0.022); bar(-hw, hh - fw, hw, hh, frame, 0.022); bar(-hw, -hh, -hw + fw, hh, frame, 0.022); bar(hw - fw, -hh, hw, hh, frame, 0.022);
  const iw = hw - fw - 0.04, ih = hh - fw - 0.04, t = 0.028;
  const g = (x0, y0, x1, y1) => bar(x0, y0, x1, y1, groove, 0.009);
  const kind = Math.floor(hsh(seed, 1) * 4);
  if (kind === 0) {
    const sx = iw * 2 / 3;
    for (let k = 0; k < 3; k++) {
      const ox = -iw + k * sx, flip = k % 2 ? -1 : 1;
      g(ox, -ih * flip, ox + sx - 0.03, -ih * flip + t * flip);
      g(ox + sx - 0.03 - t, -ih * flip, ox + sx - 0.03, ih * 0.55 * flip);
      g(ox + sx * 0.3, ih * 0.55 * flip, ox + sx - 0.03, ih * 0.55 * flip - t * flip);
      g(ox + sx * 0.3, ih * 0.55 * flip, ox + sx * 0.3 + t, -ih * 0.1 * flip);
    }
  } else if (kind === 1) {
    for (const f of [1, 0.62, 0.26]) { g(-iw * f, -ih * f, iw * f, -ih * f + t); g(-iw * f, ih * f - t, iw * f, ih * f); g(-iw * f, -ih * f, -iw * f + t, ih * f); g(iw * f - t, -ih * f, iw * f, ih * f); }
  } else if (kind === 2) {
    const n = 5;
    for (let k = 0; k < n; k++) { const x0 = -iw + (k * 2 * iw) / n, x1 = x0 + (2 * iw) / n - 0.03; const lvl = [0.2, 0.6, 1, 0.6, 0.2][k]; g(x0, -ih, x1, -ih + ih * 2 * lvl); }
    g(-iw, -ih, iw, -ih + t);
  } else {
    g(-t / 2, -ih, t / 2, ih); g(-iw, -t / 2, iw, t / 2);
    for (const [ux, uy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const px = ux * iw * 0.55, py = uy * ih * 0.55; g(px - iw * 0.22, py - t / 2, px + iw * 0.22, py + t / 2); g(px - t / 2, py - ih * 0.22, px + t / 2, py + ih * 0.22); }
  }
}

function jungleSouth(ctx, c, r) {
  const { K } = ctx;
  const x0 = c * TILE, z0 = r * TILE;
  const R = rng(c * 313 + r * 7);
  const m = K.m('props', x0 + 1, z0 + 1), d = K.m('deco', x0 + 1, z0 + 1);
  const nb = 2 + Math.floor(R() * 2);
  for (let i = 0; i < nb; i++) {
    const s0 = 0.38 + R() * 0.3;
    rockC(m, x0 + 0.35 + R() * 1.3, -0.08, z0 + 0.45 + R() * 1.1, s0 * (1.1 + R() * 0.5), s0 * (0.75 + R() * 0.4), s0, c * 97 + i * 13, [lc(JG.stone[1], JG.stoneD, 0.25), JG.stone[2]], JG.wmoss[1]);
  }
  for (let i = 0; i < 2; i++) fernPlant(d, x0 + 0.3 + R() * 1.4, 0, z0 + 0.4 + R() * 1.2, 0.55 + R() * 0.3, c * 53 + i, 7);
  tuft(d, x0 + R() * 2, 0, z0 + R() * 2, 0.4, 8, JG.leafD, JG.leafL, c * 7 + 1);
}
function jungleWall(ctx, c, r) {
  const { A, K } = ctx;
  if (r === A.H - 1) { jungleSouth(ctx, c, r); return; }
  const x0 = c * TILE, z0 = r * TILE, x1 = x0 + TILE, z1 = z0 + TILE;
  const border = r === 0 || r === A.H - 1 || c === 0 || c === A.W - 1;
  const north = r === 0, south = r === A.H - 1;
  const h = !border ? 1.55 : south ? 0.42 : north ? 2.7 : 1.75;
  const m = K.m('props', x0 + 1, z0 + 1);
  const sd = r * 131 + c * 7;
  const R = rng(sd * 7 + 3);
  const open = (dc, dr) => !solidC(cellAt(A, c + dc, r + dr));
  const oS = open(0, 1), oN = open(0, -1), oE = open(1, 0), oW = open(-1, 0);
  const courses = south ? 1 : Math.max(2, Math.round(h / 0.5));
  const ch = h / courses;
  const broken = !border && R() < 0.2;
  const top = broken ? h - ch : h;
  blockC(m, x0 + 0.07, 0, z0 + 0.07, x1 - 0.07, top - 0.03, z1 - 0.07, JG.mortar, MAT.stone, { ao: 0.8 });
  for (let k = 0; k < courses; k++) {
    if (broken && k === courses - 1) {
      const a = x0 + 0.1 + R() * 0.5, b = a + 0.7 + R() * 0.4;
      const col = mc(pick(R, JG.stone), 0.95);
      blockC(m, a, k * ch, z0 + 0.15, b, k * ch + ch * 0.8, z1 - 0.2, col, MAT.stone, { ao: 0.85, bev: 0.05, top: lc(col, JG.wmoss[1], 0.3) });
      continue;
    }
    const y0 = k * ch, y1 = (k + 1) * ch;
    const last = k === courses - 1;
    const segs = [];
    let x = x0;
    const first = k % 2 ? 0.5 + R() * 0.35 : 0.85 + R() * 0.5;
    while (x < x1 - 0.01) { const L = segs.length === 0 ? first : 0.65 + R() * 0.8; const xe = Math.min(x1, x + L); segs.push([x, x1 - xe < 0.35 ? x1 : xe]); x = segs[segs.length - 1][1]; }
    for (const [a, b] of segs) {
      const col = mc(pick(R, JG.stone), 0.88 + R() * 0.2);
      const out = (R() - 0.5) * 0.06;
      const g = 0.018;
      let lo = mc(col, k === 0 ? 0.55 : 0.8);
      if (k === 0 && R() < 0.55) lo = lc(lo, JG.wmoss[2], 0.5);
      const hi = R() < 0.3 ? mc(col, 0.82) : col;
      const tCol = last ? lc(col, pick(R, JG.wmoss), 0.25 + R() * 0.45) : mc(col, 1.03);
      blockC(m, a + g, y0 + g, z0 + g - (oN ? out : 0), b - g, y1 - g, z1 - g + (oS ? out : 0), col, MAT.stone, { lo, hi, bev: 0.04, top: tCol });
    }
  }
  if (north) {
    blockC(m, x0, 0, z1 - 0.1, x1, 0.32, z1 + 0.12, mc(JG.stone[3], 0.9), MAT.stone, { ao: 0.55, bev: 0.03, skip: 'n' });
    blockC(m, x0, h - 0.44, z1 - 0.2, x1, h - 0.24, z1 + 0.15, mc(JG.stone[2], 0.95), MAT.stone, { ao: 0.75, bev: 0.02, top: lc(JG.stone[2], JG.wmoss[1], 0.35), skip: 'n' });
    if (c % 3 === 1) {
      blockC(m, x0 + 0.62, 0.3, z1, x1 - 0.62, h - 0.44, z1 + 0.26, mc(JG.stone[5], 0.92), MAT.stone, { ao: 0.55, bev: 0.025, skip: 'n' });
      blockC(m, x0 + 0.52, h - 0.66, z1, x1 - 0.52, h - 0.44, z1 + 0.32, JG.stone[2], MAT.stone, { ao: 0.85, bev: 0.02, skip: 'n' });
    } else glyph(m, x0 + 1, 1.3, z1 + 0.02, 1.05, 0.72, sd, JG.stoneD, JG.stone[5]);
    if (c % 6 === 4 && c > 1 && c < A.W - 2) idolHead(m, x0 + 1, h, z1 - 0.95, 0.62, sd);
  }
  if (!border && oS && !broken && R() < 0.4) glyph(m, x0 + 0.55 + R() * 0.9, 0.55 + R() * 0.3, z1 + 0.0, 0.66 + R() * 0.2, 0.5, sd + 5, JG.stoneD, JG.stone[5]);
  if (oS && !south && R() < 0.6) mossDrip(m, x0 + R() * 0.7, x1 - R() * 0.7, top - 0.01, z1 + 0.016, 1, sd, [JG.wmoss[2], JG.wmoss[1]]);
  if (oS && !south && R() < (north ? 0.5 : 0.38)) {
    const n = 1 + Math.floor(R() * 3);
    for (let i = 0; i < n; i++) vine(m, x0 + 0.2 + R() * 1.6, top - 0.02, z1 + 0.035, 0.4 + R() * (top * 0.75), 1, sd + i, hx('#34491F'), JG.leafY);
  }
  if (oE && !south && R() < 0.35) withT(m, rot(x1 + 0.03, 0, z0 + 1, Math.PI / 2), () => mossDrip(m, -0.8, 0.8, top - 0.01, 0, 1, sd + 9, [JG.wmoss[2], JG.wmoss[1]]));
  if (oW && !south && R() < 0.35) withT(m, rot(x0 - 0.03, 0, z0 + 1, -Math.PI / 2), () => mossDrip(m, -0.8, 0.8, top - 0.01, 0, 1, sd + 11, [JG.wmoss[2], JG.wmoss[1]]));
  if (R() < (south ? 0.6 : 0.3)) { const tm = K.m('deco', x0 + 1, z0 + 1); if (south || R() < 0.5) tuft(tm, x0 + 0.4 + R() * 1.2, top, z0 + 0.4 + R() * 1.2, 0.3 + R() * 0.2, 7, JG.mossD, JG.mossL, sd + 13); else fernPlant(tm, x0 + 0.5 + R(), top + 0.02, z0 + 0.5 + R(), 0.35 + R() * 0.25, sd + 21, 6); }
  if (broken && oS) for (let i = 0; i < 3; i++) { const bx = x0 + 0.2 + R() * 1.6, bz = z1 + 0.25 + R() * 0.45; rockC(m, bx, 0, bz, 0.16 + R() * 0.12, 0.1 + R() * 0.06, 0.14 + R() * 0.1, sd + 40 + i, [JG.stone[1], JG.stone[3]], JG.wmoss[1]); }
}
function idolHead(m, x, y, z, s, seed) {
  const st = hx('#7A7766'), stL = hx('#8D8975'), stD = hx('#3E3C33'), mo = hx('#4A5F27');
  const S = (cx, cy, cz, rx, ry, rz, e1, e2, col, seg = 12, rows = 7) => sq(m, x + cx * s, y + cy * s, z + cz * s, rx * s, ry * s, rz * s, e1, e2, col, MAT.stone, seg, rows);
  blockC(m, x - 0.7 * s, y, z - 0.6 * s, x + 0.7 * s, y + 0.2 * s, z + 0.62 * s, mc(st, 0.85), MAT.stone, { ao: 0.6, bev: 0.04 * s });
  S(0, 0.95, 0, 0.64, 0.74, 0.55, 0.45, 0.5, st, 16, 10);
  S(0, 1.62, -0.04, 0.7, 0.2, 0.6, 0.35, 0.4, lc(st, mo, 0.3), 16, 6);
  for (let k = 0; k < 7; k++) { const a = -0.95 + k * 0.32; withT(m, rot(x + Math.sin(a) * 0.5 * s, y + 1.55 * s, z - 0.22 * s, 0, 0, -a), () => blockC(m, -0.09 * s, 0, -0.05 * s, 0.09 * s, 0.75 * s, 0.05 * s, k % 2 ? stL : st, MAT.stone, { ao: 0.75, bev: 0.025 * s, top: lc(stL, mo, 0.5) })); }
  blockC(m, x - 0.66 * s, y + 1.36 * s, z + 0.28 * s, x + 0.66 * s, y + 1.52 * s, z + 0.6 * s, stL, MAT.stone, { ao: 0.8, bev: 0.02 * s, top: lc(stL, mo, 0.4) });
  for (let k = -2; k <= 2; k++) blockC(m, x + (k * 0.26 - 0.08) * s, y + 1.39 * s, z + 0.6 * s, x + (k * 0.26 + 0.08) * s, y + 1.49 * s, z + 0.63 * s, stD, MAT.stone, { ao: 0.95, skip: 'n' });
  S(0, 1.2, 0.45, 0.6, 0.09, 0.14, 0.4, 0.5, stL, 12, 5);
  for (const sg of [-1, 1]) {
    S(sg * 0.26, 1.04, 0.5, 0.16, 0.1, 0.06, 0.7, 0.8, stD, 10, 5);
    S(sg * 0.25, 1.05, 0.535, 0.07, 0.05, 0.03, 0.7, 0.8, hx('#B9B29A'), 8, 4);
    withT(m, rot(x + sg * 0.66 * s, y + 0.98 * s, z + 0.05 * s, sg * Math.PI / 2), () => { m.smoothCyl(0, 0, 0, 0.17 * s, 0.07 * s, 12, stL, MAT.stone); disc(m, 0, 0.071 * s, 0, 0.09 * s, 10, stD, MAT.stone); });
  }
  S(0, 0.86, 0.56, 0.17, 0.16, 0.12, 0.5, 0.6, stL, 10, 6);
  for (const sg of [-1, 1]) S(sg * 0.11, 0.78, 0.63, 0.05, 0.035, 0.03, 0.8, 0.8, stD, 8, 4);
  blockC(m, x - 0.34 * s, y + 0.5 * s, z + 0.52 * s, x + 0.34 * s, y + 0.64 * s, z + 0.6 * s, stD, MAT.stone, { ao: 0.95 });
  blockC(m, x - 0.4 * s, y + 0.64 * s, z + 0.5 * s, x + 0.4 * s, y + 0.7 * s, z + 0.62 * s, stL, MAT.stone, { ao: 0.9 });
  blockC(m, x - 0.36 * s, y + 0.44 * s, z + 0.5 * s, x + 0.36 * s, y + 0.5 * s, z + 0.6 * s, stL, MAT.stone, { ao: 0.9 });
  for (const sg of [-1, 1]) for (const up of [0, 1]) { const fx = x + sg * 0.22 * s, fy = y + (up ? 0.64 : 0.5) * s, d = up ? -1 : 1; triC(m, [fx - 0.045 * s, fy, z + 0.605 * s], [fx + 0.045 * s, fy, z + 0.605 * s], [fx, fy + d * 0.1 * s, z + 0.6 * s], hx('#C9C1A6'), hx('#C9C1A6'), hx('#A39B83'), MAT.stone); }
  vine(m, x + 0.45 * s, y + 1.6 * s, z + 0.45 * s, 0.9 * s, 1, seed, hx('#34491F'), JG.leafY);
}
function fernPlant(m, x, y, z, s, seed, n = 8) {
  const c0 = lc(JG.leafD, JG.leaf, 0.4 + hsh(seed, 2) * 0.4), c1 = lc(JG.leafL, JG.leafY, hsh(seed, 3) * 0.7);
  for (let i = 0; i < n; i++) {
    const yaw = (i / n) * Math.PI * 2 + hsh(seed, i) * 0.6;
    frond(m, [x, y + 0.04, z], yaw, 0.9 + hsh(seed, i, 2) * 0.5, s * (0.75 + hsh(seed, i, 3) * 0.4), c0, c1, { seg: 8, lw: 0.26, drop: 0.95, spread: 0.35, seed: seed + i });
  }
}
function elephantEar(m, x, y, z, s, seed, cols) {
  const n = 4 + Math.floor(hsh(seed, 1) * 3);
  for (let i = 0; i < n; i++) {
    const yaw = (i / n) * Math.PI * 2 + hsh(seed, i) * 0.9;
    const L = s * (0.55 + hsh(seed, i, 2) * 0.35), Hs = s * (0.35 + hsh(seed, i, 3) * 0.55);
    const bx = x + Math.sin(yaw) * L * 0.25, bz = z + Math.cos(yaw) * L * 0.25;
    const st = mc(cols[0], 1.1);
    triC(m, [x - 0.015, y, z], [x + 0.015, y, z], [bx, y + Hs, bz], st, st, mc(st, 1.15), MAT.matte);
    const c0 = lc(cols[0], cols[1], hsh(seed, i, 4) * 0.5), c1 = lc(cols[1], cols[2], 0.3 + hsh(seed, i, 5) * 0.7);
    leafBroad(m, [bx, y + Hs, bz], yaw, 0.15 + hsh(seed, i, 6) * 0.45, L * 1.15, L * 0.42, c0, c1, { droop: 0.5, fold: 0.2, seg: 6 });
  }
}
function heliconia(m, x, y, z, s, seed) {
  const n = 3 + Math.floor(hsh(seed, 1) * 2);
  for (let i = 0; i < n; i++) {
    const yaw = (i / n) * Math.PI * 2 + hsh(seed, i) * 0.8;
    const st = hx('#3E6B2C');
    const top = [x + Math.sin(yaw) * 0.12, y + s * (0.7 + hsh(seed, i, 2) * 0.3), z + Math.cos(yaw) * 0.12];
    triC(m, [x - 0.02, y, z], [x + 0.02, y, z], top, st, st, st, MAT.matte);
    leafBroad(m, top, yaw, 0.6 + hsh(seed, i, 3) * 0.3, s * 0.85, s * 0.16, hx('#2F5A28'), hx('#6F9A3E'), { droop: 0.7, fold: 0.3, seg: 6, shape: 0.9 });
  }
  const fx = x + (hsh(seed, 9) - 0.5) * 0.2, fz = z + (hsh(seed, 10) - 0.5) * 0.2, fy = y + s * 0.75;
  const red = hx('#D2462E'), yel = hx('#F2C447');
  for (let k = 0; k < 5; k++) {
    const sg = k % 2 ? 1 : -1, yy = fy - k * 0.09;
    triC(m, [fx, yy, fz], [fx + sg * 0.16, yy - 0.03, fz + 0.04], [fx, yy - 0.08, fz], red, lc(red, yel, 0.7), mc(red, 0.8), MAT.matte);
  }
}

function jungleBushCell(m, x, z, seed) {
  const R = rng(seed);
  const deep = [JG.leafD, JG.leaf, JG.leafL], fresh = [lc(JG.leafD, JG.leaf, 0.5), JG.leafL, JG.leafY], wine = [hx('#3A1F24'), hx('#6E2E3A'), hx('#A4506A')];
  const kind = R();
  if (kind < 0.6) elephantEar(m, x + (R() - 0.5) * 0.3, 0, z + (R() - 0.5) * 0.3, 1.45 + R() * 0.35, seed, R() < 0.6 ? deep : fresh);
  else fernPlant(m, x + (R() - 0.5) * 0.3, 0, z + (R() - 0.5) * 0.3, 1.35 + R() * 0.3, seed, 10);
  const n = 4;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + R() * 0.8, d = 0.5 + R() * 0.3;
    const px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d;
    const t = R();
    if (t < 0.38) fernPlant(m, px, 0, pz, 0.85 + R() * 0.35, seed + 11 + i, 8);
    else if (t < 0.78) elephantEar(m, px, 0, pz, 0.95 + R() * 0.35, seed + 17 + i, R() < 0.15 ? wine : R() < 0.5 ? fresh : deep);
    else heliconia(m, px, 0, pz, 1.25 + R() * 0.3, seed + 23 + i);
  }
  tuft(m, x + (R() - 0.5) * 1.3, 0, z + (R() - 0.5) * 1.3, 0.55, 8, JG.leafD, JG.leafY, seed + 31);
  tuft(m, x + (R() - 0.5) * 1.3, 0, z + (R() - 0.5) * 1.3, 0.45, 7, JG.leafD, JG.leafL, seed + 37);
}

function jungleWater(ctx, c, r) {
  const { A, K, F } = ctx;
  const x0 = c * TILE, z0 = r * TILE, x1 = x0 + TILE, z1 = z0 + TILE;
  const g = K.m('ground', x0 + 1, z0 + 1), w = K.m('water', x0 + 1, z0 + 1), p = K.m('props', x0 + 1, z0 + 1), d = K.m('deco', x0 + 1, z0 + 1);
  const mud = hx('#2E2A1C');
  quadC(g, [x0, -0.62, z0], [x0, -0.62, z1], [x1, -0.62, z1], [x1, -0.62, z0], mud, mud, mud, mud, MAT.soil);
  const S = 0.5, n = 4;
  const P = [], CC = [];
  for (let i = 0; i <= n; i++) {
    const row = [], crow = [];
    for (let j = 0; j <= n; j++) {
      const x = x0 + j * S, z = z0 + i * S;
      const sd = F.at(F.shore, x, z);
      const t = ss(0, 1.5, sd);
      let col = lc(hx('#46644A'), hx('#14302A'), t);
      col = lc(col, hx('#26493D'), vn(x * 0.9, z * 0.9, 77) * 0.4 * t);
      row.push([x, -0.13, z]); crow.push(col);
    }
    P.push(row); CC.push(crow);
  }
  surfC(w, P, CC, 0.618);
  const R = rng(r * 977 + c * 31);
  const sides = [[0, 1, 'S'], [0, -1, 'N'], [1, 0, 'E'], [-1, 0, 'W']];
  for (const [dc, dr] of sides) {
    if (cellAt(A, c + dc, r + dr) === C_WATER) continue;
    const bank = hx('#3B3324'), bankD = hx('#2A2419');
    let a, b;
    if (dr === 1) { a = [x0, 0, z1]; b = [x1, 0, z1]; } else if (dr === -1) { a = [x1, 0, z0]; b = [x0, 0, z0]; } else if (dc === 1) { a = [x1, 0, z1]; b = [x1, 0, z0]; } else { a = [x0, 0, z0]; b = [x0, 0, z1]; }
    quadC(g, [a[0], -0.62, a[2]], [b[0], -0.62, b[2]], [b[0], 0, b[2]], [a[0], 0, a[2]], bankD, bankD, bank, bank, MAT.soil);
    const along = dc === 0;
    let t = R() * 0.15;
    while (t < 1) {
      const s0 = 0.13 + R() * 0.2;
      const px = along ? x0 + t * TILE : dc === 1 ? x1 - 0.04 : x0 + 0.04, pz = along ? (dr === 1 ? z1 - 0.04 : z0 + 0.04) : z0 + t * TILE;
      if (R() < 0.82) rockC(p, px + (R() - 0.5) * 0.12, -0.14, pz + (R() - 0.5) * 0.12, s0 * (1 + R() * 0.5), s0 * (0.6 + R() * 0.35), s0, r * 31 + c * 7 + Math.round(t * 50) + dc * 5 + dr * 3, [lc(JG.stone[1], JG.stoneD, 0.3), JG.stone[3]], R() < 0.5 ? JG.wmoss[2] : null);
      t += (s0 * 2.1) / TILE + R() * 0.08;
    }
    if (R() < 0.6) {
      const t = R(), px = along ? x0 + 0.3 + t * 1.4 : dc === 1 ? x1 - 0.25 : x0 + 0.25, pz = along ? (dr === 1 ? z1 - 0.25 : z0 + 0.25) : z0 + 0.3 + t * 1.4;
      tuft(d, px, -0.13, pz, 0.75, 9, hx('#3E5B26'), hx('#9AAE52'), r * 13 + c + dc * 7 + dr);
    }
  }
  const pads = 1 + Math.floor(R() * 3);
  for (let i = 0; i < pads; i++) {
    const lx = x0 + 0.4 + R() * 1.2, lz = z0 + 0.4 + R() * 1.2, rr = 0.16 + R() * 0.12, rot0 = R() * 6.28;
    const c0 = lc(hx('#3F6E2C'), hx('#5E8E36'), R());
    const seg = 10;
    for (let k = 1; k < seg; k++) {
      const a0 = rot0 + (k / seg) * Math.PI * 2, a1 = rot0 + ((k + 1) / seg) * Math.PI * 2;
      triC(d, [lx, -0.115, lz], [lx + Math.cos(a1) * rr, -0.115, lz + Math.sin(a1) * rr], [lx + Math.cos(a0) * rr, -0.115, lz + Math.sin(a0) * rr], mc(c0, 1.08), c0, c0, MAT.matte);
    }
    if (R() < 0.35) {
      const pk = hx('#F2A8C4'), wh = hx('#FBE6EE');
      for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; triC(d, [lx, -0.1, lz], [lx + Math.cos(a - 0.3) * 0.07, -0.05, lz + Math.sin(a - 0.3) * 0.07], [lx + Math.cos(a + 0.3) * 0.07, -0.05, lz + Math.sin(a + 0.3) * 0.07], wh, pk, pk, MAT.matte); }
      ball(d, lx, -0.08, lz, 0.025, '#F2D04A', MAT.flat, 6);
    }
  }
}

function jungleCrateGroup(ctx, cells) {
  const { K } = ctx;
  let c0 = 1e9, r0 = 1e9, c1 = -1, r1 = -1;
  for (const { c, r } of cells) { c0 = Math.min(c0, c); r0 = Math.min(r0, r); c1 = Math.max(c1, c); r1 = Math.max(r1, r); }
  const x0 = c0 * TILE, z0 = r0 * TILE, x1 = (c1 + 1) * TILE, z1 = (r1 + 1) * TILE;
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const m = K.m('props', cx, cz);
  const sd = c0 * 41 + r0 * 113;
  const R = rng(sd);
  const full = cells.length === (c1 - c0 + 1) * (r1 - r0 + 1);
  if (full && cells.length >= 4) {
    const tiers = [[0, 0.46, 0], [0.46, 0.9, 0.55], [0.9, 1.3, 1.05]];
    tiers.forEach(([y0, y1, ins], i) => {
      const ax0 = x0 + ins, ax1 = x1 - ins, az0 = z0 + ins * 0.75, az1 = z1 - ins * 0.75;
      blockC(m, ax0 + 0.04, y0, az0 + 0.04, ax1 - 0.04, y1 - 0.03, az1 - 0.04, JG.mortar, MAT.stone, { ao: 0.8 });
      let x = ax0;
      while (x < ax1 - 0.01) {
        const L = 0.7 + R() * 0.9, xe = ax1 - (x + L) < 0.4 ? ax1 : Math.min(ax1, x + L);
        const col = mc(pick(R, JG.stone), 0.86 + R() * 0.2);
        const top = lc(col, pick(R, JG.wmoss), 0.15 + R() * 0.35);
        blockC(m, x + 0.015, y0 + 0.015, az0, xe - 0.015, y1 - 0.015, az1, col, MAT.stone, { lo: mc(col, i === 0 ? 0.55 : 0.78), bev: 0.035, top });
        x = xe;
      }
    });
    const sw = 2.6, stepH = 1.3 / 3;
    for (let k = 0; k < 3; k++) {
      const zf = z1 + 0.04 - 0.36 * k, col = mc(JG.stone[(k + 2) % JG.stone.length], 0.95);
      blockC(m, cx - sw / 2, 0, zf - 0.38, cx + sw / 2, (k + 1) * stepH, zf, col, MAT.stone, { lo: mc(col, 0.6), bev: 0.025, top: mc(col, 1.05) });
      for (const sg of [-1, 1]) { const bx = cx + sg * (sw / 2 + 0.2), bc = mc(JG.stone[5], 0.88); blockC(m, bx - 0.2, 0, zf - 0.38, bx + 0.2, (k + 1) * stepH + 0.14, zf + 0.02, bc, MAT.stone, { lo: mc(bc, 0.55), bev: 0.03, top: lc(bc, JG.wmoss[1], 0.3) }); }
    }
    glyph(m, cx - 2.45, 0.23, z1 + 0.012, 0.9, 0.34, sd + 1, JG.stoneD, JG.stone[5]);
    glyph(m, cx + 2.45, 0.23, z1 + 0.012, 0.9, 0.34, sd + 2, JG.stoneD, JG.stone[5]);
    for (let k = -1; k <= 1; k += 2) {
      const fx = cx + k * 3.35, fz = z1 - 0.55;
      m.revolve(fx, 0.9, fz, [[0.001, 0], [0.18, 0], [0.16, 0.18], [0.12, 0.3], [0.32, 0.38], [0.36, 0.52], [0.33, 0.54], [0.001, 0.46]], 14, '#5F5B4D', MAT.stone);
      sq(m, fx, 1.38, fz, 0.28, 0.06, 0.28, 0.7, 1, '#2A2116', MAT.matte, 12, 4);
      for (let e = 0; e < 5; e++) ball(m, fx + Math.cos(e * 1.3) * 0.12, 1.43, fz + Math.sin(e * 1.3) * 0.12, 0.07, e % 2 ? '#FF7A2A' : '#FFB347', MAT.glow, 6);
    }
    idolHead(m, cx, 1.3, cz - 0.35, 0.95, sd + 3);
    for (let i = 0; i < 3; i++) vine(m, x0 + 0.5 + R() * (x1 - x0 - 1), 1.29, z1 - 1.05 + 0.02, 0.4 + R() * 0.4, 1, sd + 60 + i, hx('#34491F'), JG.leafY);
    return;
  }
  for (const { c, r } of cells) {
    const bx0 = c * TILE, bz0 = r * TILE, x = bx0 + 1, z = bz0 + 1;
    const t = hsh(c, r, 5);
    const vert = cells.some((o) => o.c === c && Math.abs(o.r - r) === 1);
    if (t < 0.4) {
      const col = pick(R, JG.stone);
      blockC(m, bx0 + 0.08, 0, bz0 + 0.08, bx0 + 1.92, 0.18, bz0 + 1.92, mc(col, 0.85), MAT.stone, { ao: 0.6, bev: 0.03 });
      const len = 1.75, rad = 0.56;
      const Tm = vert ? rot(x, rad + 0.18, z, 0, Math.PI / 2) : rot(x, rad + 0.18, z, Math.PI / 2, Math.PI / 2);
      withT(m, Tm, () => {
        const pts = [], rads = [];
        for (let i = 0; i <= 5; i++) { pts.push([0, -len / 2 + (len * i) / 5, 0]); rads.push(rad * (i === 0 || i === 5 ? 0.96 : 1)); }
        tubeC(m, pts, rads, 16, (u, j, d) => { const fl = j % 2 ? 0.86 : 1; let cc = mc(col, fl * (0.92 + hsh(c, r, j) * 0.1)); if (d[0] < -0.4 || d[2] < -0.5) cc = lc(cc, JG.wmoss[1], 0.35); return cc; }, MAT.stone, { rough: (i, j) => (j % 2 ? -0.05 : 0) });
        withT(m, rot(0, len / 2, 0, 0), () => disc(m, 0, 0, 0, rad * 0.95, 16, mc(col, 1.05), MAT.stone));
        withT(m, rot(0, -len / 2, 0, 0, Math.PI), () => disc(m, 0, 0, 0, rad * 0.95, 16, mc(col, 0.9), MAT.stone));
      });
    } else if (t < 0.75) {
      const col = pick(R, JG.stone);
      blockC(m, bx0 + 0.04, 0, bz0 + 0.04, bx0 + 1.96, 0.7, bz0 + 1.96, mc(col, 0.95), MAT.stone, { ao: 0.6, bev: 0.04, top: mc(col, 1.02) });
      blockC(m, bx0 + 0.2, 0.7, bz0 + 0.18, bx0 + 1.8, 1.32, bz0 + 1.84, mc(pick(R, JG.stone), 0.96), MAT.stone, { ao: 0.82, bev: 0.05, top: lc(col, pick(R, JG.wmoss), 0.3 + R() * 0.35) });
      glyph(m, x, 0.36, bz0 + 1.962, 1.1, 0.42, c * 7 + r, mc(JG.stoneD, 1.08), JG.stone[4]);
      tuft(m, bx0 + 0.5 + R() * 1.0, 1.32, bz0 + 0.5 + R() * 1.0, 0.25 + R() * 0.15, 6, JG.mossD, JG.mossL, c * 13 + r);
      if (R() < 0.5) vine(m, bx0 + 0.4 + R() * 1.2, 1.3, bz0 + 1.86, 0.5 + R() * 0.5, 1, c + r * 3, hx('#3B5523'), JG.leafY);
    } else {
      const col = pick(R, JG.stone);
      blockC(m, bx0 + 0.15, 0, bz0 + 0.15, bx0 + 1.85, 0.3, bz0 + 1.85, mc(col, 0.9), MAT.stone, { ao: 0.6, bev: 0.04 });
      const P = [], CC = [];
      const rows = 6, seg = 14, h = 1.05 + R() * 0.25;
      for (let i = 0; i <= rows; i++) {
        const y = 0.3 + (h * i) / rows, row = [], crow = [];
        for (let j = 0; j <= seg; j++) {
          const a = (j / seg) * Math.PI * 2;
          const top = i === rows ? (vn(j * 0.9, c * 3 + r, 9) - 0.5) * 0.5 : 0;
          const rr = 0.66 * (j % 2 ? 0.93 : 1);
          row.push([x + Math.cos(a) * rr, y + top, z + Math.sin(a) * rr]);
          crow.push(i === rows ? lc(col, JG.wmoss[1], 0.4) : mc(col, (0.78 + 0.22 * (i / rows)) * (j % 2 ? 0.9 : 1)));
        }
        P.push(row); CC.push(crow);
      }
      surfC(m, P, CC, MAT.stone);
      const cap = P[rows];
      for (let j = 0; j < seg; j++) triC(m, [x, 0.3 + h - 0.05, z], cap[j + 1], cap[j], lc(col, JG.wmoss[1], 0.25), lc(col, JG.wmoss[3], 0.3), lc(col, JG.wmoss[3], 0.3), MAT.stone);
    }
  }
}

function jungleClutter(ctx, c, r) {
  const { A, K, F } = ctx;
  const v = cellAt(A, c, r);
  if (solidC(v) || v === C_WATER) return;
  const x0 = c * TILE, z0 = r * TILE;
  const m = K.m('fine', x0 + 1, z0 + 1);
  const R = rng(c * 7919 + r * 104729 + 17);
  const leaves = [hx('#8A5530'), hx('#A0682F'), hx('#6F4A2A'), hx('#B98A3E'), hx('#55602B')];
  const nL = Math.floor(R() * 6);
  for (let i = 0; i < nL; i++) {
    const x = x0 + R() * 2, z = z0 + R() * 2;
    if (F.at(F.path, x, z) < 0.45 && R() < 0.7) continue;
    const a = R() * 6.28, L = 0.07 + R() * 0.07, W = L * 0.45;
    const col = pick(R, leaves);
    const ca = Math.cos(a), sa = Math.sin(a);
    triC(m, [x - ca * L, 0.006, z - sa * L], [x - sa * W, 0.008, z + ca * W], [x + ca * L, 0.006, z + sa * L], col, mc(col, 1.1), col, MAT.leaf);
    triC(m, [x - ca * L, 0.006, z - sa * L], [x + ca * L, 0.006, z + sa * L], [x + sa * W, 0.008, z - ca * W], col, col, mc(col, 0.85), MAT.leaf);
  }
  if (R() < 0.3) { const x = x0 + 0.2 + R() * 1.6, z = z0 + 0.2 + R() * 1.6, s = 0.05 + R() * 0.08; rockC(m, x, -0.01, z, s * 1.3, s * 0.6, s, c * 3 + r * 5, [JG.stone[1], JG.stone[3]], null); }
  if (R() < 0.18) { const x = x0 + R() * 2, z = z0 + R() * 2, a = R() * 6.28, L = 0.25 + R() * 0.3; const ca = Math.cos(a) * L, sa = Math.sin(a) * L; const tw = hx('#4E3B2A'); quadC(m, [x - ca, 0.01, z - sa], [x - ca + sa * 0.04, 0.01, z - sa - ca * 0.04], [x + ca + sa * 0.04, 0.01, z + sa - ca * 0.04], [x + ca, 0.01, z + sa], tw, tw, tw, tw, MAT.matte); }
  const sdC = F.at(F.solid, x0 + 1, z0 + 1), pdC = F.at(F.path, x0 + 1, z0 + 1);
  if (pdC > 0.9 && v !== C_BUSH && v !== C_PAD && v !== C_HOME) {
    const nt = R() < 0.55 ? 1 + Math.floor(R() * 2) : 0;
    for (let i = 0; i < nt; i++) { const x = x0 + R() * 2, z = z0 + R() * 2; if (F.at(F.path, x, z) < 0.8) continue; tuft(m, x, 0, z, 0.22 + R() * 0.2, 6, lc(JG.mossD, JG.leafD, 0.5), JG.mossL, c * 17 + r * 3 + i); }
    if (sdC < 1.2 && R() < 0.3) { const x = x0 + 0.4 + R() * 1.2, z = z0 + 0.4 + R() * 1.2; fernPlant(m, x, 0, z, 0.32 + R() * 0.18, c * 5 + r * 11, 6); }
    if (sdC < 1.6 && R() < 0.12) {
      const x = x0 + 0.3 + R() * 1.4, z = z0 + 0.3 + R() * 1.4;
      for (let k = 0; k < 3; k++) { const mx = x + (R() - 0.5) * 0.2, mz = z + (R() - 0.5) * 0.2, hh = 0.05 + R() * 0.06; m.cyl(mx, 0, mz, 0.012, hh, 6, '#EDE3CF', MAT.matte); sq(m, mx, hh, mz, 0.04 + R() * 0.02, 0.022, 0.04 + R() * 0.02, 0.7, 1, R() < 0.5 ? '#C7552F' : '#E0C38E', MAT.matte, 8, 4); }
    }
    if (R() < 0.06) { const x = x0 + 0.3 + R() * 1.4, z = z0 + 0.3 + R() * 1.4; const fc = pick(R, ['#F4F1E6', '#F2C447', '#E86A8A']); for (let k = 0; k < 4; k++) { const fx = x + (R() - 0.5) * 0.25, fz = z + (R() - 0.5) * 0.25; tuft(m, fx, 0, fz, 0.12, 2, JG.leafD, JG.leaf, k + c); ball(m, fx, 0.12, fz, 0.022, fc, MAT.matte, 6); } }
  }
}

function slab(m, x0, z0, x1, z1, h, tl, chip, colTop, mossC, mossAmt, seed) {
  const hgt = (x, z) => h + tl[0] * (x - x0) + tl[1] * (z - z0);
  let pts = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
  if (chip >= 0) {
    const i = chip % 4, a = pts[(i + 3) % 4], b = pts[i], c = pts[(i + 1) % 4];
    const k = 0.12 + hsh(seed, 3) * 0.16;
    const p1 = [b[0] + (a[0] - b[0]) * k / Math.max(0.01, Math.hypot(a[0] - b[0], a[1] - b[1])) * 1, b[1] + (a[1] - b[1]) * k / Math.max(0.01, Math.hypot(a[0] - b[0], a[1] - b[1]))];
    const p2 = [b[0] + (c[0] - b[0]) * k / Math.max(0.01, Math.hypot(c[0] - b[0], c[1] - b[1])), b[1] + (c[1] - b[1]) * k / Math.max(0.01, Math.hypot(c[0] - b[0], c[1] - b[1]))];
    pts.splice(i, 1, p1, p2);
  }
  const cx = pts.reduce((s0, p) => s0 + p[0], 0) / pts.length, cz = pts.reduce((s0, p) => s0 + p[1], 0) / pts.length;
  const colAt = (x, z) => { const mo = sat(mossAmt * (0.6 + vn(x * 3.1, z * 3.1, seed) * 0.9) - 0.15); return mc(lc(colTop, mossC, mo), 0.94 + hsh(seed, Math.round(x * 10), Math.round(z * 10)) * 0.1); };
  const ctr = [cx, hgt(cx, cz), cz], cc = colAt(cx, cz);
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const A3 = [a[0], hgt(a[0], a[1]), a[1]], B3 = [b[0], hgt(b[0], b[1]), b[1]];
    const ca = colAt(a[0], a[1]), cb = colAt(b[0], b[1]);
    triC(m, ctr, B3, A3, cc, cb, ca, MAT.stone);
    const sd0 = mc(ca, 0.62), sd1 = mc(cb, 0.62);
    quadC(m, [a[0], -0.02, a[1]], [b[0], -0.02, b[1]], B3, A3, mc(sd0, 0.7), mc(sd1, 0.7), sd1, sd0, MAT.stone);
  }
}
function plaza(ctx) {
  const { A, K, T } = ctx;
  const P = T.plaza;
  if (!P) return;
  const cx = A.wx / 2, cz = A.wz / 2 + (P.dz || 0);
  const R = rng(4242 + A.W);
  let tz = cz - P.hz;
  while (tz < cz + P.hz) {
    const rh = 0.85 + R() * 0.45;
    let tx = cx - P.hw - R() * 0.8;
    while (tx < cx + P.hw) {
      const L = pick(R, [0.7, 0.9, 1.1, 1.3, 1.6, 1.9]);
      const gx = 0.05 + R() * 0.04, gz = 0.05 + R() * 0.04;
      const x0 = tx + gx / 2, x1 = tx + L - gx / 2, z0 = tz + gz / 2, z1 = tz + rh - gz / 2;
      tx += L;
      const ex = Math.max(Math.abs((x0 + x1) / 2 - cx) / P.hw, Math.abs((z0 + z1) / 2 - cz) / P.hz);
      const keep = ex + (vn(x0 * 0.5, z0 * 0.5, 91) - 0.5) * 0.7 + (R() - 0.5) * 0.25;
      if (keep > 0.8 || R() < 0.1) continue;
      let ok = true;
      for (const [px, pz] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1], [(x0 + x1) / 2, (z0 + z1) / 2]]) { const v = cellAt(A, Math.floor(px / TILE), Math.floor(pz / TILE)); if (solidC(v) || v === C_WATER || v === C_BUSH || v === C_PAD) ok = false; }
      if (!ok) continue;
      const m = K.m('deco', (x0 + x1) / 2, (z0 + z1) / 2);
      const col = mc(pick(R, P.cols), 0.78 + R() * 0.22);
      const h = 0.02 + R() * 0.03;
      const tl = [(R() - 0.5) * 0.025, (R() - 0.5) * 0.025];
      const mossAmt = sat(ss(0.35, 0.8, ex) * 0.8 + (vn(x0 * 0.35, z0 * 0.35, 13) - 0.4) * 1.2);
      const chip = R() < 0.3 ? Math.floor(R() * 4) : -1;
      if (R() < 0.1 && L > 1) {
        const mid = x0 + (x1 - x0) * (0.4 + R() * 0.2);
        slab(m, x0, z0, mid - 0.025, z1, h, tl, -1, col, JG.wmoss[0], mossAmt, Math.floor(R() * 1e5));
        slab(m, mid + 0.025, z0, x1, z1, h - 0.012, [-tl[0], tl[1]], chip, mc(col, 0.95), JG.wmoss[0], mossAmt, Math.floor(R() * 1e5));
      } else slab(m, x0, z0, x1, z1, h, tl, chip, col, JG.wmoss[0], mossAmt, Math.floor(R() * 1e5));
      if (R() < 0.12) tuft(m, x1 + 0.02, 0, z0 + R() * (z1 - z0), 0.16 + R() * 0.12, 5, JG.mossD, JG.mossL, Math.floor(R() * 1e5));
    }
    tz += rh;
  }
}

function junglePad(ctx, p) {
  const { K } = ctx;
  const m = K.m('deco', p.x, p.z), gm = K.m('glow', p.x, p.z);
  const seg = 10;
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI * 2 + 0.03, a1 = ((i + 1) / seg) * Math.PI * 2 - 0.03;
    const col = mc(pick(rng(i + 3), JG.stone), 0.9);
    const r0 = 0.72, r1 = 0.98, h = 0.16;
    const pa = (r, a, y) => [p.x + Math.cos(a) * r, y, p.z + Math.sin(a) * r];
    quadC(m, pa(r0, a0, h), pa(r0, a1, h), pa(r1, a1, h), pa(r1, a0, h), mc(col, 1.05), mc(col, 1.05), mc(col, 1.05), mc(col, 1.05), MAT.stone);
    quadC(m, pa(r1, a0, 0), pa(r1, a0, h), pa(r1, a1, h), pa(r1, a1, 0), mc(col, 0.7), col, col, mc(col, 0.7), MAT.stone);
    quadC(m, pa(r0, a1, 0.02), pa(r0, a1, h), pa(r0, a0, h), pa(r0, a0, 0.02), mc(col, 0.6), mc(col, 0.85), mc(col, 0.85), mc(col, 0.6), MAT.stone);
  }
  disc(m, p.x, 0.02, p.z, 0.72, 20, '#17140F', MAT.matte);
  for (let i = -2; i <= 2; i++) { m.box(p.x + i * 0.24, 0.02, p.z, 0.05, 0.05, 1.3, '#3E3A33', MAT.metal); m.box(p.x, 0.02, p.z + i * 0.24, 1.3, 0.04, 0.05, '#3E3A33', MAT.metal); }
  const seg2 = 28;
  for (let i = 0; i < seg2; i++) {
    if (i % 7 === 3) continue;
    const a0 = (i / seg2) * Math.PI * 2, a1 = ((i + 1) / seg2) * Math.PI * 2;
    const pa = (r, a) => [p.x + Math.cos(a) * r, 0.165, p.z + Math.sin(a) * r];
    const oc = hx('#FF7A2A');
    quadC(gm, pa(0.8, a0), pa(0.8, a1), pa(0.86, a1), pa(0.86, a0), oc, oc, oc, oc, MAT.glow);
  }
}
function jungleHome(ctx, p) {
  const { K } = ctx;
  const m = K.m('deco', p.x, p.z), gm = K.m('glow', p.x, p.z);
  const R = rng(99);
  for (let ring = 0; ring < 2; ring++) {
    const r0 = ring ? 1.1 : 0.35, r1 = ring ? 1.75 : 1.08, seg = ring ? 14 : 8;
    for (let i = 0; i < seg; i++) {
      const a0 = (i / seg) * Math.PI * 2 + 0.02, a1 = ((i + 1) / seg) * Math.PI * 2 - 0.02;
      const col = mc(pick(R, JG.stone), 0.95 + R() * 0.1);
      const pa = (r, a, y) => [p.x + Math.cos(a) * r, y, p.z + Math.sin(a) * r];
      const h = 0.05;
      quadC(m, pa(r0, a0, h), pa(r0, a1, h), pa(r1, a1, h), pa(r1, a0, h), col, col, col, col, MAT.stone);
      quadC(m, pa(r1, a0, 0), pa(r1, a0, h), pa(r1, a1, h), pa(r1, a1, 0), mc(col, 0.7), col, col, mc(col, 0.7), MAT.stone);
    }
  }
  disc(m, p.x, 0.05, p.z, 0.35, 16, '#9C9277', MAT.stone);
  const bl = hx('#4FA8FF');
  for (const [r0, r1] of [[1.08, 1.1], [0.33, 0.36]]) for (let i = 0; i < 40; i++) { const a0 = (i / 40) * Math.PI * 2, a1 = ((i + 1) / 40) * Math.PI * 2; const pa = (r, a) => [p.x + Math.cos(a) * r, 0.056, p.z + Math.sin(a) * r]; quadC(gm, pa(r0, a0), pa(r0, a1), pa(r1, a1), pa(r1, a0), bl, bl, bl, bl, MAT.glow); }
}

function kapok(m, x, y, z, s, seed) {
  const R = rng(seed);
  const H = (7 + R() * 3) * s;
  const lean = [(R() - 0.5) * 0.5, (R() - 0.5) * 0.5];
  const pts = [], rads = [];
  for (let i = 0; i <= 7; i++) { const t = i / 7; pts.push([x + lean[0] * t * t * s * 2, y + t * H, z + lean[1] * t * t * s * 2]); rads.push((0.62 - 0.26 * t + (i === 0 ? 0.12 : 0)) * s); }
  const barkCol = (u, j, d) => { const f = 0.82 + 0.3 * vn(j * 0.9 + seed, u * 6, seed); let c = lc(JG.barkD, JG.barkL, sat(f - 0.45)); if (d[2] < -0.3 && u < 0.7) c = lc(c, JG.wmoss[1], 0.35); return mc(c, 0.75 + u * 0.3); };
  tubeC(m, pts, rads, 11, barkCol, MAT.soil, { rough: (i, j) => 0.06 * Math.sin(j * 2.3 + seed) });
  const nf = 5 + Math.floor(R() * 2);
  for (let k = 0; k < nf; k++) {
    const a = (k / nf) * Math.PI * 2 + R() * 0.5, len = (1.4 + R() * 1.2) * s, hh = (1.4 + R() * 1.2) * s, th = 0.09 * s;
    const ca = Math.cos(a), sa = Math.sin(a), px = -sa, pz = ca;
    const n = 6, P1 = [], P2 = [], CC = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, d = 0.3 * s + len * t, yy = y + hh * Math.pow(1 - t, 2.2) + 0.02;
      const w = th * (1 - t * 0.6);
      const bx = x + ca * d, bz = z + sa * d;
      P1.push([[bx + px * w, y - 0.05, bz + pz * w], [bx + px * w, yy, bz + pz * w]]);
      P2.push([[bx - px * w, yy, bz - pz * w], [bx - px * w, y - 0.05, bz - pz * w]]);
      CC.push([mc(JG.barkD, 0.7), lc(JG.bark, JG.barkL, t)]);
    }
    surfC(m, P1, CC, MAT.soil);
    surfC(m, P2, CC.map((r) => [r[1], r[0]]), MAT.soil);
    for (let i = 0; i < n; i++) quadC(m, P1[i][1], P1[i + 1][1], P2[i + 1][0], P2[i][0], CC[i][1], CC[i + 1][1], CC[i + 1][1], CC[i][1], MAT.soil);
  }
  const top = pts[7];
  const nb = 4 + Math.floor(R() * 2);
  const clumps = [[top[0], top[1] + 0.6 * s, top[2], 2.6 * s]];
  for (let k = 0; k < nb; k++) {
    const a = (k / nb) * Math.PI * 2 + R() * 0.6, L = (2.2 + R() * 1.5) * s;
    const b0 = [top[0], top[1] - 0.9 * s, top[2]], b1 = [top[0] + Math.cos(a) * L, top[1] + (0.6 + R() * 1.2) * s, top[2] + Math.sin(a) * L];
    tubeC(m, [b0, lc(b0, b1, 0.5).map((v, i) => (i === 1 ? v + 0.3 * s : v)), b1], [0.24 * s, 0.17 * s, 0.1 * s], 7, (u) => lc(JG.barkD, JG.bark, u), MAT.soil);
    clumps.push([b1[0], b1[1] + 0.3 * s, b1[2], (1.6 + R() * 0.8) * s]);
  }
  for (let k = 0; k < clumps.length; k++) {
    const [cx, cy, cz, cr] = clumps[k];
    const tone = R();
    blobC(m, [cx, cy, cz], [cr * 1.15, cr * 0.62, cr * 1.15], 12, 7, 0.22, seed * 13 + k, (ny, h) => {
      const lit = sat(ny * 0.5 + 0.5);
      let c = lc(JG.leafD, lc(JG.leafL, JG.leafY, 0.35 + tone * 0.4), Math.pow(lit, 1.4));
      c = mc(c, 0.85 + h * 0.3);
      return c;
    }, MAT.leaf);
  }
}
function palmTree(m, x, y, z, s, seed) {
  const R = rng(seed);
  const H = (4.6 + R() * 2.2) * s, bend = (0.6 + R() * 1.2) * s, ba = R() * Math.PI * 2;
  const pts = [], rads = [];
  for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push([x + Math.cos(ba) * bend * t * t, y + H * t, z + Math.sin(ba) * bend * t * t]); rads.push((0.22 - 0.07 * t + (i === 0 ? 0.08 : 0)) * s); }
  tubeC(m, pts, rads, 9, (u, j) => { const ringC = Math.floor(u * 28) % 2 ? hx('#8A7356') : hx('#6F5C45'); return mc(ringC, 0.8 + u * 0.3); }, MAT.matte);
  const top = pts[10];
  const n = 9 + Math.floor(R() * 3);
  for (let k = 0; k < n; k++) {
    const yaw = (k / n) * Math.PI * 2 + R() * 0.3;
    frond(m, top, yaw, 0.45 + R() * 0.5, (2.0 + R() * 0.8) * s, hx('#2E5424'), lc(hx('#6E9A3A'), hx('#A2B556'), R() * 0.6), { seg: 13, lw: 0.33, drop: 0.85 + R() * 0.4, spread: 0.45, seed: seed + k });
  }
  for (let k = 0; k < 3; k++) { const a = R() * 6.28; ball(m, top[0] + Math.cos(a) * 0.16 * s, top[1] - 0.18 * s, top[2] + Math.sin(a) * 0.16 * s, 0.11 * s, '#5C4A2E', MAT.matte, 8); }
}
function pyramid(m, x, z, s) {
  const st = JG.stone;
  const tiers = 6;
  for (let i = 0; i < tiers; i++) {
    const w = (17 - i * 2.3) * s, d = (13 - i * 1.8) * s, y0 = i * 1.45 * s, y1 = y0 + 1.45 * s;
    const col = mc(st[i % st.length], 0.9);
    blockC(m, x - w / 2, y0, z - d / 2, x + w / 2, y1, z + d / 2, col, MAT.stone, { ao: 0.62, bev: 0.35 * s, top: lc(col, JG.wmoss[1], 0.55) });
    for (let k = 0; k < 7; k++) { const gx = x - w / 2 + 0.9 * s + (k * (w - 1.8 * s)) / 6; if (Math.abs(gx - x) < 2.2 * s) continue; glyph(m, gx, y0 + 0.72 * s, z + d / 2 - 0.34 * s, 0.8 * s, 0.7 * s, i * 13 + k, mc(JG.stoneD, 1.05), st[4]); }
  }
  const sw = 3.6 * s, steps = 24, topY = tiers * 1.45 * s;
  for (let k = 0; k < steps; k++) {
    const y0 = (k * topY) / steps, y1 = ((k + 1) * topY) / steps;
    const zf = z + 6.5 * s - (k * (6.5 * s - 2.4 * s)) / steps;
    blockC(m, x - sw / 2, y0, zf - 1.8 * s, x + sw / 2, y1, zf, mc(st[2], 0.92 + (k % 2) * 0.05), MAT.stone, { ao: 0.85, top: mc(st[2], 1.05) });
  }
  const ty = topY;
  blockC(m, x - 3.2 * s, ty, z - 2.6 * s, x + 3.2 * s, ty + 3.0 * s, z + 2.2 * s, mc(st[0], 0.95), MAT.stone, { ao: 0.7, bev: 0.15 * s, top: lc(st[0], JG.wmoss[1], 0.4) });
  blockC(m, x - 0.9 * s, ty, z + 2.18 * s, x + 0.9 * s, ty + 1.9 * s, z + 2.26 * s, hx('#1C1912'), MAT.matte, { ao: 1 });
  blockC(m, x - 2.4 * s, ty + 3.0 * s, z - 0.8 * s, x + 2.4 * s, ty + 4.6 * s, z - 0.2 * s, mc(st[1], 0.95), MAT.stone, { ao: 0.85, bev: 0.08 * s });
  for (let k = 0; k < 3; k++) glyph(m, x - 1.6 * s + k * 1.6 * s, ty + 3.8 * s, z - 0.19 * s, 0.9 * s, 1.0 * s, 77 + k, mc(JG.stoneD, 1.05), st[4]);
}

function jungleOuter(ctx) {
  const { A, K } = ctx;
  const R = rng(7777);
  const spots = [];
  const ok = (x, z, d) => spots.every((s) => Math.hypot(s[0] - x, s[1] - z) > Math.max(d, s[2]));
  const outD = (x, z) => Math.max(-x, x - A.wx, -z, z - A.wz);
  const place = (n, dmin, dmax, sp, fn, south = false) => {
    let made = 0;
    for (let t = 0; t < n * 30 && made < n; t++) {
      const x = -ctx.M + R() * (A.wx + ctx.M * 2), z = -ctx.M + R() * (A.wz + ctx.M + ctx.MS);
      const d = outD(x, z);
      if (d < dmin || d > dmax) continue;
      if (!south && z > A.wz) continue;
      if (Math.abs(x - A.wx / 2) < 11 && z < -11 && z > -30) continue;
      if (!ok(x, z, sp)) continue;
      spots.push([x, z, sp]);
      fn(x, ctx.outerY(x, z), z);
      made++;
    }
  };
  place(16, 4.5, 22, 7.5, (x, y, z) => kapok(K.m('outer', x, z), x, y, z, 0.95 + R() * 0.35, Math.floor(R() * 1e6)));
  place(22, 2.6, 20, 4.2, (x, y, z) => palmTree(K.m('outer', x, z), x, y, z, 0.9 + R() * 0.35, Math.floor(R() * 1e6)));
  place(26, 3, 26, 3.4, (x, y, z) => { const s = 0.5 + R() * 0.9; rockC(K.m('outer', x, z), x, y - 0.1, z, s * 1.4, s * 0.8, s, Math.floor(R() * 1e6), [JG.stone[1], JG.stone[3]], JG.wmoss[1]); });
  place(70, 1.2, 24, 1.9, (x, y, z) => { const m = K.m('outer', x, z); const t = R(); if (t < 0.5) fernPlant(m, x, y, z, 0.8 + R() * 0.5, Math.floor(R() * 1e6), 8); else elephantEar(m, x, y, z, 1.0 + R() * 0.5, Math.floor(R() * 1e6), [JG.leafD, JG.leaf, JG.leafL]); }, true);
  place(28, 1.2, 12, 1.4, (x, y, z) => tuft(K.m('outer', x, z), x, y, z, 0.45 + R() * 0.3, 8, JG.leafD, JG.leafY, Math.floor(R() * 1e6)), true);
  pyramid(K.m('outer', A.wx / 2, -20), A.wx / 2, -21, 1);
  for (let i = 0; i < 30; i++) {
    const a = (i / 30) * Math.PI - Math.PI, rr = 46 + R() * 10;
    const x = A.wx / 2 + Math.cos(a) * rr * 1.25, z = A.wz * 0.3 + Math.sin(a) * rr;
    if (z > A.wz * 0.6) continue;
    const m = K.m('outer', x, z), s = 3 + R() * 3;
    tube(m, [x, ctx.outerY(x, z), z], [x, ctx.outerY(x, z) + s * 1.6, z], 0.5, 0.35, 6, '#4C3D30', MAT.matte);
    blobC(m, [x, ctx.outerY(x, z) + s * 2.1, z], [s * 1.4, s * 0.8, s * 1.4], 10, 6, 0.25, i * 31 + 5, (ny, h) => lc(JG.leafD, JG.leafL, sat(ny * 0.5 + 0.3) * (0.8 + h * 0.3)), MAT.leaf);
  }
}


const YD = {
  dirtD: hx('#4A3F31'), dirt: hx('#5F5240'), dirtL: hx('#74644C'),
  gravel: hx('#6B675F'), oil: hx('#1E1C1A'), track: hx('#3E362B'), dust: hx('#7E5A3A'),
  conc: ['#6F6C66', '#66635D', '#78756E', '#5F5C56', '#6B6862'].map(hx),
  paint: ['#A3342A', '#2C5A8C', '#26766C', '#C08A2E', '#BDB8AC', '#5B3F7A', '#3D444D', '#5F7030', '#B4562A'].map(hx),
  rust: hx('#6E3F24'), rustL: hx('#9A5A30'),
  metal: hx('#5A6068'), metalD: hx('#3A3E44'),
  grassD: hx('#4E5428'), grass: hx('#7C7A3A'), grassY: hx('#A89E5A'), straw: hx('#B9A774'),
};
function yardGround(F, x, z, k) {
  const nA = fbm(x * 0.08, z * 0.08, 101, 3), nB = fbm(x * 0.3, z * 0.3, 113, 3), nC = vn(x * 1.5, z * 1.5, 127), nD = fbm(x * 0.9, z * 0.9, 131, 2), nE = fbm(x * 0.16 + 5, z * 0.16, 149, 3);
  let c = lc(YD.dirtD, YD.dirt, sat(nB * 1.4 - 0.15));
  c = lc(c, YD.dirtL, ss(0.6, 0.8, nD) * 0.35);
  c = lc(c, YD.gravel, ss(0.52, 0.66, nA) * 0.7);
  c = lc(c, YD.dust, ss(0.6, 0.75, nE) * 0.45);
  c = lc(c, lc(YD.grassD, YD.grass, nC), ss(0.68, 0.8, 1 - nA + (nD - 0.5) * 0.3) * 0.6);
  c = lc(c, YD.oil, ss(0.7, 0.78, fbm(x * 0.22 + 7, z * 0.22, 139, 2)) * 0.8);
  if (k != null) {
    const pd = F.path[k];
    c = lc(c, lc(YD.dirtL, YD.gravel, 0.4), (1 - ss(0.4, 1.3, pd)) * 0.45);
    const tr = Math.abs(pd - 0.55);
    c = lc(c, YD.track, (1 - ss(0.04, 0.16, tr)) * (1 - ss(0.9, 1.2, pd)) * 0.6);
    c = lc(c, YD.oil, (1 - ss(0, 1.2, F.water[k])) * 0.55);
    c = mc(c, 1 - 0.5 * Math.exp(-F.solid[k] * 1.6));
  }
  return mc(c, 0.9 + nC * 0.16);
}
function carSlab(m, x, y, z, w, d, h, seed, roof = false) {
  const R = rng(seed);
  const col = mc(pick(R, YD.paint), 0.82 + R() * 0.22);
  const rust = lc(YD.rust, YD.rustL, R());
  const yaw = (R() - 0.5) * 0.12 + (R() < 0.5 ? Math.PI / 2 : 0);
  const glass = hx('#1A222B');
  withT(m, rot(x, y, z, yaw), () => {
    const lo = lc(mc(col, 0.62), rust, 0.25 + R() * 0.5), top = lc(mc(col, 1.04), rust, R() * 0.35);
    blockC(m, -w / 2, 0, -d / 2, w / 2, h, d / 2, col, MAT.paint, { lo, top, hi: lc(col, rust, R() * 0.25), bev: 0.05 });
    blockC(m, -w / 2 - 0.004, h * 0.5, -d / 2 - 0.004, w / 2 + 0.004, h * 0.56, d / 2 + 0.004, hx('#9AA0A8'), MAT.chrome, { ao: 1 });
    for (const sz of [1, -1]) {
      if (R() < 0.8) blockC(m, -w * 0.36 + R() * 0.08, h * 0.6, sz * d / 2 - 0.01, w * 0.3, h * 0.92, sz * d / 2 + sz * 0.012, glass, MAT.glass, { ao: 1, skip: sz > 0 ? 'n' : 's' });
      blockC(m, -0.012, h * 0.08, sz * d / 2 - 0.01, 0.012, h * 0.48, sz * d / 2 + sz * 0.008, mc(col, 0.45), MAT.paint, { ao: 1 });
      for (const wx of [-w * 0.32, w * 0.32]) if (R() < 0.7) withT(m, rot(wx, h * 0.32, sz * d / 2 - 0.04 * sz, 0, Math.PI / 2), () => { m.smoothCyl(0, 0, 0, Math.min(0.3, h * 0.42), 0.1 * sz, 14, '#1A1B1E', MAT.plastic); disc(m, 0, 0.102 * sz, 0, Math.min(0.15, h * 0.2), 10, '#8A9099', MAT.metal); });
    }
    for (const sx of [1, -1]) {
      for (const sz of [-0.32, 0.32]) blockC(m, sx * w / 2 - 0.01, h * 0.55, sz * d - 0.1, sx * w / 2 + sx * 0.02, h * 0.75, sz * d + 0.1, sx > 0 ? hx('#F2E6C2') : hx('#C23A2A'), sx > 0 ? MAT.flat : MAT.paint, { ao: 1, skip: sx > 0 ? 'w' : 'e' });
    }
    if (roof) {
      blockC(m, -w * 0.28, h, -d * 0.4, w * 0.3, h + 0.07, d * 0.4, mc(col, 1.02), MAT.paint, { ao: 0.85, bev: 0.03 });
      blockC(m, w * 0.3, h + 0.005, -d * 0.36, w * 0.42, h + 0.04, d * 0.36, glass, MAT.glass, { ao: 1 });
      blockC(m, -w * 0.4, h + 0.005, -d * 0.36, -w * 0.28, h + 0.04, d * 0.36, glass, MAT.glass, { ao: 1 });
    }
  });
}
function drum(m, x, y, z, r, h, col) {
  m.revolve(x, y, z, [[0.001, 0], [r * 0.97, 0], [r, 0.03 * h], [r, 0.3 * h], [r * 1.04, 0.32 * h], [r, 0.34 * h], [r, 0.66 * h], [r * 1.04, 0.68 * h], [r, 0.7 * h], [r, 0.96 * h], [r * 0.97, h], [0.001, h]], 14, col, MAT.paint);
  m.revolve(x, y, z, [[r * 1.005, 0], [r * 1.005, 0.12 * h]], 14, mc(YD.rust, 1.1), MAT.matte);
  m.cyl(x + r * 0.45, y + h, z, r * 0.12, 0.03, 8, '#2B2F36', MAT.metal);
}
function tireStack(m, x, y, z, n, seed) {
  for (let k = 0; k < n; k++) withT(m, rot(x + (hsh(seed, k) - 0.5) * 0.08, y + k * 0.26, z + (hsh(seed, k, 2) - 0.5) * 0.08, hsh(seed, k, 3) * 3), () => {
    m.revolve(0, 0, 0, [[0.2, 0], [0.4, 0.01], [0.44, 0.06], [0.45, 0.13], [0.44, 0.2], [0.4, 0.25], [0.2, 0.26]], 16, '#1D1E21', MAT.plastic);
    disc(m, 0, 0.13, 0, 0.21, 12, '#0E0F11', MAT.matte);
  });
}
function corrugated(m, x0, x1, y0, y1, z, nz, col, seed) {
  const n = Math.max(2, Math.round((x1 - x0) / 0.12));
  const rust = YD.rust;
  for (let i = 0; i < n; i++) {
    const a = x0 + ((x1 - x0) * i) / n, b = x0 + ((x1 - x0) * (i + 1)) / n;
    const dz = (i % 2 ? 0.04 : 0) * nz;
    const rr = ss(0.55, 0.85, vn(a * 1.3, seed, seed));
    const ct = lc(col, rust, rr * 0.7), cb = lc(mc(col, 0.7), rust, 0.3 + rr * 0.5);
    quadC(m, [a, y0, z + (i % 2 ? 0 : 0.04) * nz], [b, y0, z + dz], [b, y1, z + dz], [a, y1, z + (i % 2 ? 0 : 0.04) * nz], cb, cb, ct, ct, MAT.trim);
  }
}
function yardWall(ctx, c, r) {
  const { A, K } = ctx;
  const x0 = c * TILE, z0 = r * TILE, x1 = x0 + TILE, z1 = z0 + TILE, cx = x0 + 1, cz = z0 + 1;
  const border = r === 0 || r === A.H - 1 || c === 0 || c === A.W - 1;
  const north = r === 0, south = r === A.H - 1;
  const m = K.m('props', cx, cz);
  const sd = r * 131 + c * 7;
  const R = rng(sd * 5 + 1);
  if (south) {
    const col = c % 2 ? hx('#C9C4BA') : hx('#B8432F');
    m.box(cx, 0, cz - 0.3, 1.94, 0.12, 0.8, mc(col, 0.8), MAT.matte, { taper: 0.02 });
    blockC(m, x0 + 0.04, 0.12, cz - 0.55, x1 - 0.04, 0.5, cz - 0.05, col, MAT.matte, { lo: mc(col, 0.6), bev: 0.12, top: mc(col, 1.05) });
    if (R() < 0.4) tuft(K.m('deco', cx, cz), x0 + R() * 2, 0, cz + 0.3, 0.4, 8, YD.grassD, YD.straw, sd);
    return;
  }
  if (!border || north) {
    const h = north ? 2.7 : 1.55;
    const layers = Math.max(3, Math.round(h / 0.5));
    for (let k = 0; k < layers; k++) carSlab(m, cx + (R() - 0.5) * 0.08, (k * h) / layers, cz + (R() - 0.5) * 0.08, 1.92 - R() * 0.08, 1.9 - R() * 0.08, h / layers - 0.01, sd * 13 + k, k === layers - 1);
    if (R() < 0.3) tireStack(m, x0 + 0.6 + R() * 0.8, h, z0 + 0.6 + R() * 0.8, 1 + Math.floor(R() * 2), sd);
    else if (R() < 0.2) drum(m, x0 + 0.6 + R() * 0.8, h, z0 + 0.6 + R() * 0.8, 0.3, 0.88, pick(R, [hx('#2E6FA8'), hx('#B8432F'), hx('#3E7A3A')]));
    return;
  }
  const h = 1.75;
  const facing = c === 0 ? 1 : -1;
  const fx = c === 0 ? x1 - 0.12 : x0 + 0.12;
  withT(m, rot(fx, 0, cz, facing * Math.PI / 2), () => corrugated(m, -1, 1, 0.05, h, 0, 1, mc(pick(R, [hx('#59626B'), hx('#4E5862'), hx('#666A60')]), 0.95), sd));
  blockC(m, c === 0 ? x0 : x1 - 0.12, 0, z0, c === 0 ? x1 - 0.1 : x1, h, z1, YD.metalD, MAT.trim, { ao: 0.7 });
  for (const pz of [z0 + 0.05, z1 - 0.05]) blockC(m, fx - 0.07, 0, pz - 0.06, fx + 0.07, h + 0.08, pz + 0.06, YD.metal, MAT.trim, { ao: 0.6, bev: 0.01 });
  blockC(m, fx - 0.09, h - 0.05, z0, fx + 0.09, h + 0.03, z1, YD.metalD, MAT.trim, { ao: 0.9 });
  if (R() < 0.35) { const pz = z0 + 0.4 + R() * 1.2; carSlab(m, c === 0 ? x0 + 0.95 : x1 - 0.95, 0, pz, 1.2, 0.9, 0.5, sd + 77); }
}
function yardCrateGroup(ctx, cells) {
  const { K } = ctx;
  for (const { c, r } of cells) {
    const x0 = c * TILE, z0 = r * TILE, x = x0 + 1, z = z0 + 1;
    const m = K.m('props', x, z);
    const R = rng(c * 71 + r * 13 + 9);
    const t = hsh(c, r, 21);
    if (t < 0.35) {
      const h = 1.36, col = pick(R, [hx('#3F4E60'), hx('#4C5A36'), hx('#664E36'), hx('#3E4A55'), hx('#7A3A2C')]);
      blockC(m, x0 + 0.05, 0, z0 + 0.05, x0 + 1.95, h, z0 + 1.95, col, MAT.paint, { lo: mc(col, 0.6), bev: 0.03, top: mc(col, 1.06) });
      for (const sz of [1, -1]) for (let i = 0; i < 6; i++) { const px = x0 + 0.18 + i * 0.33; blockC(m, px - 0.03, 0.08, sz > 0 ? z0 + 1.95 : z0 + 0.02, px + 0.03, h - 0.08, sz > 0 ? z0 + 1.98 : z0 + 0.05, mc(col, 0.85), MAT.paint, { ao: 0.75 }); }
      for (const sx of [1, -1]) for (let i = 0; i < 6; i++) { const pz = z0 + 0.18 + i * 0.33; blockC(m, sx > 0 ? x0 + 1.95 : x0 + 0.02, 0.08, pz - 0.03, sx > 0 ? x0 + 1.98 : x0 + 0.05, h - 0.08, pz + 0.03, mc(col, 0.85), MAT.paint, { ao: 0.75 }); }
      for (let i = 0; i < 8; i++) { const sx = x0 + 0.25 + i * 0.2; quadC(m, [sx, h + 0.004, z0 + 1.62], [sx + 0.1, h + 0.004, z0 + 1.62], [sx + 0.2, h + 0.004, z0 + 1.82], [sx + 0.1, h + 0.004, z0 + 1.82], hx('#E2B341'), hx('#E2B341'), hx('#E2B341'), hx('#E2B341'), MAT.flat); }
      blockC(m, x - 0.35, h * 0.45, z0 + 1.98, x + 0.35, h * 0.68, z0 + 1.995, hx('#E8E2D2'), MAT.matte, { ao: 1, skip: 'n' });
    } else if (t < 0.6) {
      const cols = [hx('#2E6FA8'), hx('#B8432F'), hx('#3E7A3A'), hx('#D4A23A')];
      for (const [dx, dz] of [[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]]) drum(m, x + dx + (R() - 0.5) * 0.06, 0, z + dz + (R() - 0.5) * 0.06, 0.4, 1.0, pick(R, cols));
      drum(m, x + (R() - 0.5) * 0.3, 1.0, z + (R() - 0.5) * 0.3, 0.4, 1.0, pick(R, cols));
      m.box(x, 0, z, 1.9, 0.04, 1.9, '#3B3328', MAT.matte);
    } else if (t < 0.8) {
      const wood = [hx('#A07A4E'), hx('#8E6A42'), hx('#B08A58')];
      blockC(m, x0 + 0.12, 0, z0 + 0.12, x0 + 1.88, 0.14, z0 + 1.88, hx('#7A5A36'), MAT.woodX, { ao: 0.6 });
      const bx = (px, py, pz, sx, sy, sz) => { const col = pick(R, wood); blockC(m, px - sx / 2, py, pz - sz / 2, px + sx / 2, py + sy, pz + sz / 2, col, MAT.woodX, { lo: mc(col, 0.65), bev: 0.02, top: mc(col, 1.05) }); for (const f of [-1, 1]) blockC(m, px - sx / 2 - 0.01, py + 0.03, pz + f * sz / 2 - 0.02, px + sx / 2 + 0.01, py + sy - 0.03, pz + f * sz / 2 + f * 0.012, mc(col, 0.75), MAT.woodX, { ao: 0.85 }); };
      bx(x - 0.42, 0.14, z - 0.4, 0.95, 0.62, 0.95); bx(x + 0.45, 0.14, z - 0.35, 0.85, 0.55, 0.85); bx(x, 0.14, z + 0.45, 1.6, 0.58, 0.8); bx(x - 0.2, 0.76, z - 0.1, 0.9, 0.55, 0.9);
    } else {
      tireStack(m, x - 0.45, 0, z - 0.4, 4, c * 3 + r);
      tireStack(m, x + 0.5, 0, z - 0.3, 3, c * 5 + r);
      tireStack(m, x + 0.05, 0, z + 0.5, 5, c * 7 + r);
    }
  }
}
function yardBushCell(m, x, z, seed) {
  const R = rng(seed);
  for (let i = 0; i < 14; i++) {
    const a = R() * Math.PI * 2, d = Math.sqrt(R()) * 0.85;
    const px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d;
    const dry = R();
    tuft(m, px, 0, pz, 1.0 + R() * 0.55, 13, lc(YD.grassD, YD.grass, dry * 0.4), lc(YD.grassY, YD.straw, dry), seed + i * 7);
  }
  for (let i = 0; i < 2; i++) elephantEar(m, x + (R() - 0.5) * 1.1, 0, z + (R() - 0.5) * 1.1, 0.75 + R() * 0.3, seed + 40 + i, [hx('#3A4520'), hx('#55622A'), hx('#7E8240')]);
  if (R() < 0.6) for (let k = 0; k < 3; k++) { const fx = x + (R() - 0.5) * 1.2, fz = z + (R() - 0.5) * 1.2, fh = 1.1 + R() * 0.4; triC(m, [fx - 0.015, 0, fz], [fx + 0.015, 0, fz], [fx, fh, fz], YD.grassD, YD.grassD, YD.grass, MAT.matte); ball(m, fx, fh, fz, 0.06, '#8E5BB0', MAT.matte, 7); }
}
function yardWater(ctx, c, r) {
  const { A, K, F } = ctx;
  const x0 = c * TILE, z0 = r * TILE, x1 = x0 + TILE, z1 = z0 + TILE;
  const g = K.m('ground', x0 + 1, z0 + 1), w = K.m('water', x0 + 1, z0 + 1), d = K.m('deco', x0 + 1, z0 + 1);
  quadC(g, [x0, -0.5, z0], [x0, -0.5, z1], [x1, -0.5, z1], [x1, -0.5, z0], hx('#1E1C18'), hx('#1E1C18'), hx('#1E1C18'), hx('#1E1C18'), MAT.soil);
  const P = [], CC = [];
  for (let i = 0; i <= 4; i++) { const row = [], crow = []; for (let j = 0; j <= 4; j++) { const x = x0 + j * 0.5, z = z0 + i * 0.5; const t = ss(0, 1.2, F.at(F.shore, x, z)); let col = lc(hx('#4A4436'), hx('#1A1D1E'), t); const sh = vn(x * 1.7, z * 1.7, 201); col = lc(col, sh > 0.5 ? hx('#3F2E4A') : hx('#2F4A3A'), Math.abs(sh - 0.5) * 0.8 * t); row.push([x, -0.11, z]); crow.push(col); } P.push(row); CC.push(crow); }
  surfC(w, P, CC, 0.63);
  for (const [dc, dr] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
    if (cellAt(A, c + dc, r + dr) === C_WATER) continue;
    let a, b;
    if (dr === 1) { a = [x0, z1]; b = [x1, z1]; } else if (dr === -1) { a = [x1, z0]; b = [x0, z0]; } else if (dc === 1) { a = [x1, z1]; b = [x1, z0]; } else { a = [x0, z0]; b = [x0, z1]; }
    quadC(g, [a[0], -0.5, a[1]], [b[0], -0.5, b[1]], [b[0], 0, b[1]], [a[0], 0, a[1]], hx('#2A251D'), hx('#2A251D'), hx('#4A4030'), hx('#4A4030'), MAT.soil);
    const Rr = rng(c * 13 + r * 7 + dc * 3 + dr * 5);
    let t = Rr() * 0.2;
    while (t < 1) {
      const px = a[0] + (b[0] - a[0]) * t, pz = a[1] + (b[1] - a[1]) * t, s0 = 0.14 + Rr() * 0.2;
      rockC(d, px, -0.12, pz, s0 * 1.4, s0 * 0.5, s0, Math.floor(Rr() * 1e6), [hx('#4A4030'), hx('#5E5240')], null, MAT.soil);
      t += 0.12 + Rr() * 0.12;
    }
  }
  const R = rng(c * 31 + r * 17);
  if (R() < 0.5) withT(d, rot(x0 + 0.5 + R(), -0.2, z0 + 0.5 + R(), R() * 3, 0.9), () => { d.revolve(0, 0, 0, [[0.2, 0], [0.4, 0.01], [0.44, 0.06], [0.45, 0.13], [0.44, 0.2], [0.4, 0.25], [0.2, 0.26]], 14, '#1D1E21', MAT.plastic); });
  if (R() < 0.4) withT(d, rot(x0 + 0.4 + R() * 1.2, -0.1, z0 + 0.4 + R() * 1.2, R() * 3, Math.PI / 2), () => d.smoothCyl(0, -0.06, 0, 0.035, 0.12, 8, pick(R, ['#C8402F', '#3B6FB6', '#C9C4BA']), MAT.paint));
}
function yardClutter(ctx, c, r) {
  const { A, K, F } = ctx;
  const v = cellAt(A, c, r);
  if (solidC(v) || v === C_WATER) return;
  const x0 = c * TILE, z0 = r * TILE;
  const m = K.m('fine', x0 + 1, z0 + 1);
  const R = rng(c * 7919 + r * 104729 + 23);
  if (R() < 0.35) { const x = x0 + 0.2 + R() * 1.6, z = z0 + 0.2 + R() * 1.6, s = 0.05 + R() * 0.07; rockC(m, x, -0.01, z, s * 1.3, s * 0.6, s, c * 3 + r * 5, [YD.conc[1], YD.conc[3]], null); }
  if (R() < 0.25) { const x = x0 + R() * 2, z = z0 + R() * 2, a = R() * 6.28, L = 0.15 + R() * 0.3; const ca = Math.cos(a) * L, sa = Math.sin(a) * L; const col = pick(R, [hx('#4E535A'), YD.rust, hx('#4A3E32')]); quadC(m, [x - ca, 0.012, z - sa], [x - ca + sa * 0.06, 0.012, z - sa - ca * 0.06], [x + ca + sa * 0.06, 0.012, z + sa - ca * 0.06], [x + ca, 0.012, z + sa], col, col, col, col, MAT.matte); }
  if (R() < 0.1) { const x = x0 + 0.3 + R() * 1.4, z = z0 + 0.3 + R() * 1.4; withT(m, rot(x, 0.2, z, R() * 3, Math.PI / 2), () => m.smoothCyl(0, -0.08, 0, 0.035, 0.12, 8, pick(R, ['#C8402F', '#3B6FB6', '#2E9C8F']), MAT.paint)); }
  if (v !== C_PAD && v !== C_HOME && F.at(F.path, x0 + 1, z0 + 1) > 1 && R() < 0.45) tuft(m, x0 + R() * 2, 0, z0 + R() * 2, 0.25 + R() * 0.25, 7, YD.grassD, YD.grassY, c * 17 + r * 3);
  if (R() < 0.05) { const x = x0 + 0.4 + R() * 1.2, z = z0 + 0.4 + R() * 1.2; tireStack(m, x, 0, z, 1, c + r); }
}
function hazardRing(m, gm, p, r0, r1, glowCol) {
  const seg = 24;
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2;
    const pa = (r, a, y) => [p.x + Math.cos(a) * r, y, p.z + Math.sin(a) * r];
    const col = i % 2 ? hx('#E2B341') : hx('#22252B');
    quadC(m, pa(r0, a0, 0.05), pa(r0, a1, 0.05), pa(r1, a1, 0.05), pa(r1, a0, 0.05), col, col, col, col, MAT.paint);
    quadC(m, pa(r1, a0, 0), pa(r1, a0, 0.05), pa(r1, a1, 0.05), pa(r1, a1, 0), mc(col, 0.6), col, col, mc(col, 0.6), MAT.paint);
  }
  disc(m, p.x, 0.03, p.z, r0, 20, '#16181B', MAT.matte);
  for (let i = -2; i <= 2; i++) { m.box(p.x + i * 0.22, 0.02, p.z, 0.05, 0.05, r0 * 1.9, '#3A3F46', MAT.metal); m.box(p.x, 0.02, p.z + i * 0.22, r0 * 1.9, 0.04, 0.05, '#3A3F46', MAT.metal); }
  for (let i = 0; i < 32; i++) { if (i % 8 === 4) continue; const a0 = (i / 32) * Math.PI * 2, a1 = ((i + 1) / 32) * Math.PI * 2; const pa = (r, a) => [p.x + Math.cos(a) * r, 0.055, p.z + Math.sin(a) * r]; quadC(gm, pa(r0 - 0.06, a0), pa(r0 - 0.06, a1), pa(r0, a1), pa(r0, a0), glowCol, glowCol, glowCol, glowCol, MAT.glow); }
}
function yardPad(ctx, p) { hazardRing(ctx.K.m('deco', p.x, p.z), ctx.K.m('glow', p.x, p.z), p, 0.72, 0.98, hx('#FF7A2A')); }
function paintedHome(ctx, p, base, line) {
  const m = ctx.K.m('deco', p.x, p.z), gm = ctx.K.m('glow', p.x, p.z);
  const seg = 32;
  for (let i = 0; i < seg; i++) { const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2; const pa = (r, a, y) => [p.x + Math.cos(a) * r, y, p.z + Math.sin(a) * r]; quadC(m, pa(0, a0, 0.02), pa(0, a1, 0.02), pa(1.75, a1, 0.02), pa(1.75, a0, 0.02), base, base, mc(base, 0.92), mc(base, 0.92), MAT.stone); quadC(m, pa(1.75, a0, 0), pa(1.75, a0, 0.02), pa(1.75, a1, 0.02), pa(1.75, a1, 0), mc(base, 0.6), base, base, mc(base, 0.6), MAT.stone); }
  for (const [r0, r1] of [[1.5, 1.6], [0.5, 0.58]]) for (let i = 0; i < 40; i++) { const a0 = (i / 40) * Math.PI * 2, a1 = ((i + 1) / 40) * Math.PI * 2; const pa = (r, a) => [p.x + Math.cos(a) * r, 0.026, p.z + Math.sin(a) * r]; quadC(gm, pa(r0, a0), pa(r0, a1), pa(r1, a1), pa(r1, a0), line, line, line, line, MAT.glow); }
}
function yardHome(ctx, p) { paintedHome(ctx, p, hx('#7F7C75'), hx('#4FA8FF')); }
function yardPlaza(ctx) {
  const { A, K } = ctx;
  const cx = A.wx / 2, cz = A.wz / 2 - 1;
  const R = rng(5150);
  for (let tz = cz - 6; tz < cz + 6; tz += 2) for (let tx = cx - 9; tx < cx + 9; tx += 2) {
    const ex = Math.max(Math.abs(tx + 1 - cx) / 9, Math.abs(tz + 1 - cz) / 6);
    if (ex + (vn(tx * 0.4, tz * 0.4, 7) - 0.5) * 0.6 > 0.95 || R() < 0.06) continue;
    let ok = true;
    for (const [px, pz] of [[tx + 0.1, tz + 0.1], [tx + 1.9, tz + 0.1], [tx + 0.1, tz + 1.9], [tx + 1.9, tz + 1.9]]) { const v = cellAt(A, Math.floor(px / TILE), Math.floor(pz / TILE)); if (solidC(v) || v === C_WATER || v === C_BUSH || v === C_PAD) ok = false; }
    if (!ok) continue;
    const m = K.m('deco', tx + 1, tz + 1);
    const col = mc(pick(R, YD.conc), 0.9 + R() * 0.15);
    slab(m, tx + 0.03, tz + 0.03, tx + 1.97, tz + 1.97, 0.03, [(R() - 0.5) * 0.01, (R() - 0.5) * 0.01], R() < 0.2 ? Math.floor(R() * 4) : -1, col, YD.oil, R() < 0.3 ? 0.5 : 0, Math.floor(R() * 1e5));
    if (R() < 0.5) { const a = R() * 3, L = 0.4 + R() * 0.8, px = tx + 0.5 + R(), pz = tz + 0.5 + R(); const ca = Math.cos(a) * L, sa = Math.sin(a) * L; const cr = mc(col, 0.55); quadC(m, [px - ca, 0.032, pz - sa], [px + ca, 0.032, pz + sa], [px + ca + sa * 0.02, 0.032, pz + sa - ca * 0.02], [px - ca + sa * 0.02, 0.032, pz - sa - ca * 0.02], cr, cr, cr, cr, MAT.matte); }
    if (Math.abs(tz + 1 - cz) > 4.5 && R() < 0.8) for (let k = 0; k < 8; k++) { const sx = tx + 0.1 + k * 0.24; const yc = k % 2 ? hx('#E2B341') : hx('#2B2B2B'); quadC(m, [sx, 0.034, tz + 0.15], [sx + 0.12, 0.034, tz + 0.15], [sx + 0.22, 0.034, tz + 0.35], [sx + 0.1, 0.034, tz + 0.35], yc, yc, yc, yc, MAT.paint); }
  }
}
function craneArm(m, x, y, z) {
  const Y = hx('#D9A33A'), D = hx('#2B2F36');
  for (let i = 0; i < 7; i++) {
    blockC(m, x - 0.5, y + i * 1.5, z - 0.5, x + 0.5, y + i * 1.5 + 1.5, z + 0.5, Y, MAT.paint, { ao: 0.9, skip: '' });
    for (const s2 of [-1, 1]) withT(m, rot(x + s2 * 0.51, y + i * 1.5 + 0.75, z, Math.PI / 2, 0, 0.78), () => m.box(0, -0.75, 0, 0.06, 1.5, 0.06, D, MAT.metal));
  }
  blockC(m, x - 6, y + 10.2, z - 0.4, x + 2.4, y + 10.8, z + 0.4, Y, MAT.paint, { ao: 0.85 });
  blockC(m, x + 1.2, y + 9.4, z - 0.7, x + 2.8, y + 10.6, z + 0.7, D, MAT.metal, { ao: 0.8 });
  m.box(x - 5.2, y + 6.4, z, 0.04, 3.8, 0.04, D, MAT.metal);
  blockC(m, x - 5.5, y + 5.9, z - 0.3, x - 4.9, y + 6.4, z + 0.3, D, MAT.metal, { ao: 0.8 });
}
function shipBox(m, x, y, z, yaw, len, col) {
  withT(m, rot(x, y, z, yaw), () => {
    blockC(m, -1.2, 0, -len / 2, 1.2, 2.55, len / 2, col, MAT.paint, { lo: mc(col, 0.6), top: mc(col, 1.05) });
    const n = Math.round(len / 0.36);
    for (let i = 1; i < n; i++) { const zz = -len / 2 + (i * len) / n; for (const sx of [-1, 1]) blockC(m, sx * 1.2 - 0.03, 0.1, zz - 0.06, sx * 1.2 + 0.03, 2.45, zz + 0.06, mc(col, 0.82), MAT.paint, { ao: 0.8 }); }
    blockC(m, -1.22, 0, len / 2 - 0.08, 1.22, 2.58, len / 2 + 0.03, mc(col, 0.9), MAT.paint, { ao: 0.7 });
    for (const sx of [-0.6, 0.6]) blockC(m, sx - 0.02, 0.2, len / 2 + 0.02, sx + 0.02, 2.35, len / 2 + 0.06, hx('#9AA0A8'), MAT.metal, { ao: 0.9 });
  });
}
function junkHeap(m, x, y, z, s, seed) {
  const R = rng(seed);
  for (let i = 0; i < 12; i++) {
    const a = R() * Math.PI * 2, d = R() * 1.8 * s, hh = (1 - d / (1.9 * s)) * 1.6 * s;
    const w = (0.7 + R() * 1.1) * s;
    withT(m, rot(x + Math.cos(a) * d, y + hh * 0.6, z + Math.sin(a) * d, R() * 3, (R() - 0.5) * 0.9, (R() - 0.5) * 0.9), () => { const col = lc(pick(R, YD.paint), YD.rust, R() * 0.6); blockC(m, -w / 2, -w * 0.3, -w * 0.4, w / 2, w * 0.25, w * 0.4, col, MAT.paint, { ao: 0.7, bev: 0.04 }); });
  }
  if (R() < 0.6) tireStack(m, x + s, y, z + s * 0.6, 2, seed);
}
function yardOuter(ctx) {
  const { A, K } = ctx;
  const R = rng(9191);
  const spots = [];
  const ok = (x, z, d) => spots.every((s0) => Math.hypot(s0[0] - x, s0[1] - z) > Math.max(d, s0[2]));
  const outD = (x, z) => Math.max(-x, x - A.wx, -z, z - A.wz);
  const place = (n, dmin, dmax, sp, fn, south = false) => {
    let made = 0;
    for (let t = 0; t < n * 30 && made < n; t++) {
      const x = -ctx.M + R() * (A.wx + ctx.M * 2), z = -ctx.M + R() * (A.wz + ctx.M + ctx.MS);
      const d = outD(x, z);
      if (d < dmin || d > dmax || (!south && z > A.wz) || !ok(x, z, sp)) continue;
      spots.push([x, z, sp]); fn(x, ctx.outerY(x, z), z); made++;
    }
  };
  place(14, 3, 24, 6, (x, y, z) => shipBox(K.m('outer', x, z), x, y, z, R() < 0.5 ? 0 : Math.PI / 2 + (R() - 0.5) * 0.2, 6, pick(R, [hx('#B8432F'), hx('#2E6FA8'), hx('#2E8C80'), hx('#D4A23A'), hx('#6E4A92')])));
  place(16, 2.5, 24, 4.5, (x, y, z) => junkHeap(K.m('outer', x, z), x, y, z, 0.9 + R() * 0.6, Math.floor(R() * 1e6)));
  place(16, 2, 20, 2.6, (x, y, z) => { const m = K.m('outer', x, z); const n = 2 + Math.floor(R() * 3); for (let k = 0; k < n; k++) carSlab(m, x, y + k * 0.5, z, 1.9, 1.9, 0.48, Math.floor(R() * 1e6)); });
  place(26, 1.5, 22, 1.8, (x, y, z) => { const m = K.m('outer', x, z); if (R() < 0.5) tireStack(m, x, y, z, 1 + Math.floor(R() * 4), Math.floor(R() * 1e6)); else drum(m, x, y, z, 0.4, 1.0, pick(R, [hx('#2E6FA8'), hx('#B8432F'), hx('#3E7A3A')])); }, true);
  place(40, 1, 22, 1.3, (x, y, z) => tuft(K.m('outer', x, z), x, y, z, 0.6 + R() * 0.4, 9, YD.grassD, YD.straw, Math.floor(R() * 1e6)), true);
  craneArm(K.m('outer', A.wx * 0.7, -9), A.wx * 0.7, ctx.outerY(A.wx * 0.7, -9), -9);
  for (const fx of [A.wx * 0.18, A.wx * 0.5, A.wx * 0.82]) { const m = K.m('outer', fx, -4); m.cyl(fx, 0, -4, 0.09, 7, 8, '#4A4F57', MAT.metal); blockC(m, fx - 0.5, 6.9, -4.2, fx + 0.5, 7.1, -3.8, hx('#3A3F46'), MAT.metal, { ao: 0.9 }); for (const lx of [-0.3, 0.3]) blockC(m, fx + lx - 0.12, 6.8, -4.1, fx + lx + 0.12, 6.9, -3.9, hx('#FFF2C8'), MAT.flat, { ao: 1 }); }
}


const FR = {
  snow: hx('#DDE5EB'), snowS: hx('#B9C8D5'), snowB: hx('#EEF2F5'), pack: hx('#97A5B1'), packD: hx('#7E8C98'),
  ice: hx('#6FA9CC'), iceD: hx('#3E7AA3'), iceL: hx('#A9D6EC'),
  rock: hx('#59616B'), rockD: hx('#41484F'),
  metal: hx('#66717D'), metalD: hx('#46505B'), orange: hx('#D9692A'), yellow: hx('#E2B33A'),
  pine: hx('#1E3A2D'), pineL: hx('#2F5640'),
};
function frostGround(F, x, z, k) {
  const nA = fbm(x * 0.07, z * 0.07, 301, 3), nB = fbm(x * 0.3, z * 0.3, 313, 3), nC = vn(x * 1.5, z * 1.5, 327), nD = fbm(x * 0.9, z * 0.9, 331, 2);
  let c = lc(FR.snowS, FR.snow, ss(0.3, 0.62, nB));
  c = lc(c, FR.snowB, ss(0.62, 0.82, nD) * 0.6);
  const rip = 0.5 + 0.5 * Math.sin(x * 1.3 + z * 0.4 + nB * 6);
  c = lc(c, FR.snowS, rip * 0.18);
  c = lc(c, lc(FR.ice, FR.iceL, nC), ss(0.68, 0.78, nA + (nD - 0.5) * 0.2) * 0.75);
  c = lc(c, FR.rock, ss(0.8, 0.88, 1 - nA + (nC - 0.5) * 0.3) * 0.55);
  if (k != null) {
    const pd = F.path[k], pw = 1.15 + (nB - 0.5) * 0.6;
    c = lc(c, lc(FR.pack, FR.packD, nC * 0.6), (1 - ss(pw * 0.45, pw, pd)) * 0.85);
    const tr = Math.abs(pd - 0.5);
    c = lc(c, mc(FR.packD, 0.85), (1 - ss(0.03, 0.12, tr)) * (1 - ss(0.8, 1.1, pd)) * 0.6);
    c = lc(c, FR.iceD, (1 - ss(0, 1.1, F.water[k])) * 0.45);
    c = lc(c, FR.snowS, (1 - ss(0, 1.0, F.solid[k])) * 0.5);
    c = mc(c, 1 - 0.3 * Math.exp(-F.solid[k] * 1.8));
  }
  return mc(c, 0.95 + nC * 0.07);
}
function icicles(m, x0, x1, y, z, nz, seed) {
  const n = Math.max(2, Math.round((x1 - x0) / 0.18));
  for (let i = 0; i < n; i++) {
    if (hsh(seed, i) < 0.35) continue;
    const x = x0 + ((i + 0.5) * (x1 - x0)) / n + (hsh(seed, i, 2) - 0.5) * 0.08, L = 0.08 + Math.pow(hsh(seed, i, 3), 2) * 0.4, w = 0.03 + hsh(seed, i, 4) * 0.025;
    triC(m, [x - w, y, z], [x + w, y, z], [x, y - L, z + nz * 0.02], FR.iceL, FR.iceL, FR.ice, 0.63);
    triC(m, [x, y, z - nz * w], [x, y, z + nz * w], [x, y - L, z + nz * 0.02], FR.iceL, FR.iceL, FR.ice, 0.63);
  }
}
function snowCap(m, x0, z0, x1, z1, y, seed, depth = 0.12) {
  const n = 6, P = [], CC = [];
  for (let i = 0; i <= n; i++) {
    const row = [], crow = [];
    for (let j = 0; j <= n; j++) {
      const u = j / n, v = i / n, x = x0 + (x1 - x0) * u, z = z0 + (z1 - z0) * v;
      const edge = Math.min(u, 1 - u, v, 1 - v);
      const hh = (ss(0, 0.25, edge) * 0.8 + 0.2) * depth * (0.7 + vn(x * 2.3, z * 2.3, seed) * 0.6);
      row.push([x, y + hh, z]);
      crow.push(lc(FR.snowS, FR.snowB, sat(0.4 + vn(x * 3, z * 3, seed + 1) * 0.6)));
    }
    P.push(row); CC.push(crow);
  }
  surfC(m, P, CC, MAT.snow);
}
function frostWall(ctx, c, r) {
  const { A, K } = ctx;
  const x0 = c * TILE, z0 = r * TILE, x1 = x0 + TILE, z1 = z0 + TILE, cx = x0 + 1, cz = z0 + 1;
  const border = r === 0 || r === A.H - 1 || c === 0 || c === A.W - 1;
  const north = r === 0, south = r === A.H - 1;
  const m = K.m('props', cx, cz);
  const sd = r * 131 + c * 7;
  const R = rng(sd * 3 + 7);
  const open = (dc, dr) => !solidC(cellAt(A, c + dc, r + dr));
  const oS = open(0, 1);
  if (south) {
    snowCap(m, x0 - 0.02, z0 + 0.1, x1 + 0.02, z1, 0, sd, 0.55);
    if (R() < 0.5) pine(K.m('props', cx, cz), x0 + 0.5 + R(), 0.2, z0 + 0.8 + R() * 0.6, 0.35 + R() * 0.15, sd);
    return;
  }
  if (north) {
    const h = 2.7;
    blockC(m, x0, 0, z0, x1, h, z1, FR.metalD, MAT.plate, { lo: mc(FR.metalD, 0.6), top: FR.metal });
    for (let i = 0; i < 4; i++) { const px = x0 + 0.04 + i * 0.49; blockC(m, px, 0.2, z1, px + 0.45, h - 0.25, z1 + 0.04, mc(FR.metal, 0.92 + (i % 2) * 0.06), MAT.plate, { lo: mc(FR.metal, 0.62), skip: 'n', bev: 0.01 }); }
    blockC(m, x0, 0.9, z1 + 0.035, x1, 1.08, z1 + 0.06, FR.orange, MAT.paint, { ao: 0.9, skip: 'n' });
    if (c % 3 === 1) { blockC(m, x0 + 0.35, 1.35, z1 + 0.03, x1 - 0.35, 2.15, z1 + 0.07, hx('#2A3542'), MAT.glass, { ao: 1, skip: 'n' }); blockC(m, x0 + 0.42, 1.42, z1 + 0.065, x1 - 0.42, 2.08, z1 + 0.075, hx('#FFD98A'), MAT.flat, { ao: 1, skip: 'n' }); }
    else if (c % 3 === 2) { for (let k = 0; k < 5; k++) blockC(m, x0 + 0.5, 1.4 + k * 0.13, z1 + 0.03, x1 - 0.5, 1.46 + k * 0.13, z1 + 0.09, FR.metalD, MAT.plate, { ao: 0.9, skip: 'n' }); }
    tube(m, [x0, 2.35, z1 + 0.18], [x1, 2.35, z1 + 0.18], 0.09, 0.09, 8, '#8A939C', MAT.metal);
    snowCap(m, x0, z0, x1, z1, h, sd, 0.16);
    icicles(m, x0, x1, h - 0.02, z1 + 0.06, 1, sd);
    if (c % 5 === 2) { m.cyl(cx, h, cz, 0.04, 1.6, 6, '#9AA3AC', MAT.metal); ball(m, cx, h + 1.62, cz, 0.06, '#FF4A3A', MAT.glow, 6); }
    return;
  }
  const h = border ? 1.75 : 1.55;
  const rows = border ? 3 : 3;
  for (let k = 0; k < rows; k++) {
    const y0 = (k * h) / rows, y1 = ((k + 1) * h) / rows;
    let x = x0;
    const first = k % 2 ? 0.6 + R() * 0.4 : 1.0;
    let idx = 0;
    while (x < x1 - 0.01) {
      const L = idx === 0 ? first : 0.8 + R() * 0.6;
      const xe = x1 - (x + L) < 0.35 ? x1 : Math.min(x1, x + L);
      const col = k === 0 ? lc(FR.rock, FR.rockD, R()) : lc(FR.ice, FR.iceL, R() * 0.6);
      blockC(m, x + 0.02, y0 + 0.02, z0 + 0.02, xe - 0.02, y1 - 0.02, z1 - 0.02, col, k === 0 ? MAT.stone : 0.625, { lo: mc(lc(col, FR.iceD, 0.5), 0.75), hi: col, bev: 0.06, top: lc(col, FR.iceL, 0.3) });
      x = xe; idx++;
    }
  }
  blockC(m, x0 + 0.08, 0, z0 + 0.08, x1 - 0.08, h - 0.04, z1 - 0.08, FR.iceD, 0.62, { ao: 0.7 });
  snowCap(m, x0 + 0.12 + R() * 0.2, z0 + 0.1 + R() * 0.2, x1 - 0.12 - R() * 0.3, z1 - 0.15 - R() * 0.3, h - 0.02, sd, 0.12);
  if (oS) icicles(m, x0 + 0.05, x1 - 0.05, h - 0.03, z1 + 0.01, 1, sd);
  if (open(1, 0)) withT(m, rot(x1 + 0.01, 0, cz, Math.PI / 2), () => icicles(m, -0.95, 0.95, h - 0.03, 0, 1, sd + 3));
  if (open(-1, 0)) withT(m, rot(x0 - 0.01, 0, cz, -Math.PI / 2), () => icicles(m, -0.95, 0.95, h - 0.03, 0, 1, sd + 5));
  if (oS && R() < 0.5) snowCap(K.m('deco', cx, cz), x0 + 0.1, z1, x1 - 0.1, z1 + 0.45, 0, sd + 9, 0.18);
}
function pine(m, x, y, z, s, seed) {
  const R = rng(seed);
  tube(m, [x, y, z], [x, y + 1.2 * s, z], 0.12 * s, 0.08 * s, 7, '#4A3B2E', MAT.matte);
  const tiers = 4 + Math.floor(R() * 2);
  for (let t = 0; t < tiers; t++) {
    const yy = y + (0.5 + t * 0.9) * s, rr = (1.5 - t * 0.27) * s, hh = 1.4 * s;
    const seg = 10, P = [], CC = [];
    for (let i = 0; i <= 3; i++) {
      const v = i / 3, row = [], crow = [];
      for (let j = 0; j < seg; j++) {
        const a = (j / seg) * Math.PI * 2 + t * 0.4;
        const jag = 1 + (j % 2 ? -0.18 : 0.08) + (hsh(seed, t, j) - 0.5) * 0.2;
        const rad = rr * (1 - v) * (v === 0 ? jag : 1) + 0.001;
        row.push([x + Math.cos(a) * rad, yy + hh * v - (v === 0 && j % 2 ? 0.12 * s : 0), z + Math.sin(a) * rad]);
        const snowy = v > 0.2 && hsh(seed, t * 7 + i, j) > 0.25;
        crow.push(snowy ? lc(FR.snowS, FR.snowB, hsh(seed, i, j)) : lc(FR.pine, FR.pineL, hsh(seed, t, j + i)));
      }
      P.push(row); CC.push(crow);
    }
    surfC(m, P, CC, MAT.leaf, { wrap: true });
    for (let j = 0; j < seg; j++) { const a0 = (j / seg) * Math.PI * 2 + t * 0.4, a1 = ((j + 1) / seg) * Math.PI * 2 + t * 0.4; const rad = rr * 0.98; triC(m, [x, yy - 0.05 * s, z], [x + Math.cos(a1) * rad, yy, z + Math.sin(a1) * rad], [x + Math.cos(a0) * rad, yy, z + Math.sin(a0) * rad], mc(FR.pine, 0.6), mc(FR.pine, 0.7), mc(FR.pine, 0.7), MAT.leaf); }
  }
}
function frostBushCell(m, x, z, seed) {
  const R = rng(seed);
  pine(m, x + (R() - 0.5) * 0.4, 0, z + (R() - 0.5) * 0.4, 0.45 + R() * 0.1, seed);
  for (let i = 0; i < 3; i++) { const a = R() * 6.28, d = 0.55 + R() * 0.3; pine(m, x + Math.cos(a) * d, 0, z + Math.sin(a) * d, 0.28 + R() * 0.08, seed + i + 1); }
  blobC(m, [x, -0.1, z], [1.05, 0.28, 1.05], 12, 5, 0.12, seed, (ny, h) => lc(FR.snowS, FR.snowB, sat(ny * 0.8 + h * 0.2)), MAT.snow);
}
function frostWater(ctx, c, r) {
  const { A, K, F } = ctx;
  const x0 = c * TILE, z0 = r * TILE, x1 = x0 + TILE, z1 = z0 + TILE;
  const g = K.m('ground', x0 + 1, z0 + 1), w = K.m('water', x0 + 1, z0 + 1), d = K.m('deco', x0 + 1, z0 + 1);
  quadC(g, [x0, -0.6, z0], [x0, -0.6, z1], [x1, -0.6, z1], [x1, -0.6, z0], hx('#1B2A36'), hx('#1B2A36'), hx('#1B2A36'), hx('#1B2A36'), MAT.matte);
  const P = [], CC = [];
  for (let i = 0; i <= 4; i++) { const row = [], crow = []; for (let j = 0; j <= 4; j++) { const x = x0 + j * 0.5, z = z0 + i * 0.5; const t = ss(0, 1.3, F.at(F.shore, x, z)); row.push([x, -0.14, z]); crow.push(lc(hx('#4F86A3'), hx('#14344A'), t)); } P.push(row); CC.push(crow); }
  surfC(w, P, CC, 0.645);
  for (const [dc, dr] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
    if (cellAt(A, c + dc, r + dr) === C_WATER) continue;
    let a, b;
    if (dr === 1) { a = [x0, z1]; b = [x1, z1]; } else if (dr === -1) { a = [x1, z0]; b = [x0, z0]; } else if (dc === 1) { a = [x1, z1]; b = [x1, z0]; } else { a = [x0, z0]; b = [x0, z1]; }
    quadC(g, [a[0], -0.6, a[1]], [b[0], -0.6, b[1]], [b[0], 0, b[1]], [a[0], 0, a[1]], FR.iceD, FR.iceD, FR.iceL, FR.iceL, 0.62);
    const Rr = rng(c * 13 + r * 7 + dc * 3 + dr * 5);
    let t = Rr() * 0.2;
    while (t < 1) { const px = a[0] + (b[0] - a[0]) * t, pz = a[1] + (b[1] - a[1]) * t, s0 = 0.16 + Rr() * 0.2; blobC(d, [px, -0.06, pz], [s0 * 1.3, s0 * 0.55, s0], 8, 5, 0.2, Math.floor(Rr() * 1e6), (ny) => (ny > 0.2 ? lc(FR.snowS, FR.snowB, ny) : lc(FR.ice, FR.iceL, 0.4)), MAT.snow); t += 0.12 + Rr() * 0.1; }
  }
  const R = rng(c * 31 + r * 17);
  const nf = 1 + Math.floor(R() * 3);
  for (let i = 0; i < nf; i++) {
    const fx = x0 + 0.5 + R(), fz = z0 + 0.5 + R(), rr = 0.25 + R() * 0.25, n = 7, rot0 = R() * 6;
    for (let k = 0; k < n; k++) { const a0 = rot0 + (k / n) * 6.283, a1 = rot0 + ((k + 1) / n) * 6.283; const r0 = rr * (0.8 + hsh(i, k, c) * 0.4), r1 = rr * (0.8 + hsh(i, k + 1, c) * 0.4); triC(d, [fx, -0.08, fz], [fx + Math.cos(a1) * r1, -0.11, fz + Math.sin(a1) * r1], [fx + Math.cos(a0) * r0, -0.11, fz + Math.sin(a0) * r0], FR.snowB, FR.iceL, FR.iceL, MAT.snow); }
  }
}
function frostCrateGroup(ctx, cells) {
  const { K } = ctx;
  for (const { c, r } of cells) {
    const x0 = c * TILE, z0 = r * TILE, x = x0 + 1, z = z0 + 1;
    const m = K.m('props', x, z);
    const R = rng(c * 91 + r * 23 + 5);
    const t = hsh(c, r, 31);
    if (t < 0.45) {
      const col = pick(R, [FR.orange, hx('#3C6E9A'), hx('#5E6670'), FR.yellow]);
      blockC(m, x0 + 0.08, 0, z0 + 0.08, x0 + 1.92, 1.3, z0 + 1.92, col, MAT.paint, { lo: mc(col, 0.6), bev: 0.04 });
      for (const sx of [0.1, 1.82]) for (const sz of [0.1, 1.82]) blockC(m, x0 + sx, 0, z0 + sz, x0 + sx + 0.08, 1.33, z0 + sz + 0.08, FR.metalD, MAT.plate, { ao: 0.7 });
      blockC(m, x - 0.45, 0.45, z0 + 1.92, x + 0.45, 0.85, z0 + 1.94, hx('#F0F0EC'), MAT.matte, { ao: 1, skip: 'n' });
      blockC(m, x - 0.08, 0.5, z0 + 1.94, x + 0.08, 0.8, z0 + 1.95, hx('#D23A30'), MAT.flat, { ao: 1, skip: 'n' });
      blockC(m, x - 0.2, 0.57, z0 + 1.94, x + 0.2, 0.73, z0 + 1.95, hx('#D23A30'), MAT.flat, { ao: 1, skip: 'n' });
      snowCap(m, x0 + 0.08, z0 + 0.08, x0 + 1.92, z0 + 1.92, 1.3, c * 7 + r, 0.14);
      icicles(m, x0 + 0.1, x0 + 1.9, 1.3, z0 + 1.93, 1, c + r * 5);
    } else if (t < 0.75) {
      withT(m, rot(x, 0.65, z, R() < 0.5 ? 0 : Math.PI / 2, Math.PI / 2), () => { m.revolve(0, -0.85, 0, [[0.001, -0.05], [0.4, 0], [0.6, 0.12], [0.62, 0.2], [0.62, 1.5], [0.6, 1.58], [0.4, 1.7], [0.001, 1.75]], 16, '#C9CED3', MAT.paint); for (const yy of [0.35, 1.05]) m.revolve(0, -0.85 + yy, 0, [[0.63, 0], [0.63, 0.08]], 16, '#D9692A', MAT.paint); });
      for (const sx of [-0.55, 0.55]) blockC(m, x + sx - 0.12, 0, z - 0.7, x + sx + 0.12, 0.2, z + 0.7, FR.metalD, MAT.plate, { ao: 0.6 });
      snowCap(m, x - 0.45, z - 0.8, x + 0.45, z + 0.8, 1.22, c * 3 + r, 0.12);
    } else {
      for (let k = 0; k < 4; k++) { const s0 = 0.5 + R() * 0.25; blockC(m, x - 0.9 + R() * 0.6, k > 1 ? 0.6 : 0, z - 0.9 + R() * 0.6, x - 0.9 + R() * 0.6 + s0 * 1.6, (k > 1 ? 0.6 : 0) + s0 * 1.1, z - 0.9 + R() * 0.6 + s0 * 1.6, lc(FR.ice, FR.iceL, R()), 0.625, { lo: mc(FR.iceD, 0.8), bev: 0.1, top: FR.snowB }); }
    }
  }
}
function frostClutter(ctx, c, r) {
  const { A, K, F } = ctx;
  const v = cellAt(A, c, r);
  if (solidC(v) || v === C_WATER) return;
  const x0 = c * TILE, z0 = r * TILE;
  const m = K.m('fine', x0 + 1, z0 + 1);
  const R = rng(c * 7919 + r * 104729 + 41);
  if (F.at(F.path, x0 + 1, z0 + 1) > 1.4 && R() < 0.12) { const x = x0 + 0.3 + R() * 1.4, z = z0 + 0.3 + R() * 1.4, s0 = 0.3 + R() * 0.4; blobC(m, [x, -0.07, z], [s0 * 1.8, s0 * 0.22, s0 * 1.1], 10, 5, 0.12, c * 9 + r, (ny, h) => lc(FR.snowS, FR.snowB, sat(ny * 0.8 + h * 0.3)), MAT.snow); }
  if (R() < 0.18) { const x = x0 + 0.2 + R() * 1.6, z = z0 + 0.2 + R() * 1.6, s0 = 0.08 + R() * 0.1; rockC(m, x, -0.02, z, s0 * 1.3, s0 * 0.7, s0, c * 3 + r * 5, [FR.rock, FR.rockD], FR.snowB); }
  if (R() < 0.08) { const x = x0 + 0.4 + R() * 1.2, z = z0 + 0.4 + R() * 1.2; tuft(m, x, 0, z, 0.3, 6, hx('#6E6A4A'), hx('#B8AE84'), c + r); }
}
function frostPad(ctx, p) { hazardRing(ctx.K.m('deco', p.x, p.z), ctx.K.m('glow', p.x, p.z), p, 0.72, 0.98, hx('#FF7A2A')); }
function frostHome(ctx, p) { paintedHome(ctx, p, hx('#7C8792'), hx('#4FD2FF')); }
function frostOuter(ctx) {
  const { A, K } = ctx;
  const R = rng(3131);
  const spots = [];
  const ok = (x, z, d) => spots.every((s0) => Math.hypot(s0[0] - x, s0[1] - z) > Math.max(d, s0[2]));
  const outD = (x, z) => Math.max(-x, x - A.wx, -z, z - A.wz);
  const place = (n, dmin, dmax, sp, fn, south = false) => {
    let made = 0;
    for (let t = 0; t < n * 30 && made < n; t++) {
      const x = -ctx.M + R() * (A.wx + ctx.M * 2), z = -ctx.M + R() * (A.wz + ctx.M + ctx.MS);
      const d = outD(x, z);
      if (d < dmin || d > dmax || (!south && z > A.wz) || !ok(x, z, sp)) continue;
      spots.push([x, z, sp]); fn(x, ctx.outerY(x, z), z); made++;
    }
  };
  place(46, 2.5, 26, 3.4, (x, y, z) => pine(K.m('outer', x, z), x, y, z, 1.1 + R() * 0.9, Math.floor(R() * 1e6)));
  place(20, 2, 24, 3, (x, y, z) => { const s0 = 0.5 + R() * 1.0; rockC(K.m('outer', x, z), x, y - 0.1, z, s0 * 1.5, s0 * 0.8, s0, Math.floor(R() * 1e6), [FR.rock, FR.rockD], FR.snowB); });
  place(30, 1.2, 14, 2.2, (x, y, z) => { const s0 = 0.4 + R() * 0.5; blobC(K.m('outer', x, z), [x, y - 0.1, z], [s0 * 2.2, s0 * 0.6, s0 * 1.4], 10, 5, 0.12, Math.floor(R() * 1e6), () => lc(FR.snowS, FR.snowB, R()), MAT.snow); }, true);
  const bx = A.wx * 0.3, bz = -8;
  { const m = K.m('outer', bx, bz); blockC(m, bx - 4, 0, bz - 2.5, bx + 4, 3.2, bz + 2.5, FR.metal, MAT.plate, { lo: mc(FR.metal, 0.6) }); snowCap(m, bx - 4.1, bz - 2.6, bx + 4.1, bz + 2.6, 3.2, 77, 0.3); for (let k = 0; k < 3; k++) { blockC(m, bx - 3 + k * 2.4, 1.2, bz + 2.5, bx - 2 + k * 2.4, 2.2, bz + 2.56, hx('#2A3542'), MAT.glass, { ao: 1, skip: 'n' }); blockC(m, bx - 2.94 + k * 2.4, 1.26, bz + 2.55, bx - 2.06 + k * 2.4, 2.14, bz + 2.58, hx('#FFD98A'), MAT.flat, { ao: 1, skip: 'n' }); } blockC(m, bx - 4, 2.5, bz + 2.48, bx + 4, 2.7, bz + 2.6, FR.orange, MAT.paint, { ao: 0.9 }); }
  { const dx = A.wx * 0.72, dz = -9, m = K.m('outer', dx, dz); m.cyl(dx, 0, dz, 0.35, 4.2, 10, '#8A939C', MAT.metal); withT(m, rot(dx, 4.6, dz, 0.4, -0.7), () => { m.revolve(0, 0, 0, [[0.001, 0], [1.2, 0.25], [2.0, 0.7], [2.1, 0.8], [0.001, 0.82]], 18, '#DDE3E8', MAT.paint); m.cyl(0, 0, 0, 0.05, 1.4, 6, '#5A646E', MAT.metal); }); }
}


const LV = {
  bas: hx('#252323'), basM: hx('#322E2D'), basL: hx('#433D3A'), ash: hx('#57524E'), dust: hx('#4E2E20'),
  lava: hx('#FF6A1A'), lavaY: hx('#FFC24A'), lavaR: hx('#C8260E'), crust: hx('#1E1A1A'),
  brick: ['#5A2E24', '#6B3A2C', '#4A2620', '#62342A', '#55301F'].map(hx), soot: hx('#1E1A19'),
  iron: hx('#4A4E55'), ironD: hx('#2C2F34'), hazard: hx('#E2A33A'),
  leafD: hx('#2A1012'), leaf: hx('#4E1A1A'), leafL: hx('#7A2A1E'),
};
function lavaGround(F, x, z, k) {
  const nA = fbm(x * 0.08, z * 0.08, 401, 3), nB = fbm(x * 0.3, z * 0.3, 413, 3), nC = vn(x * 1.5, z * 1.5, 427), nD = fbm(x * 0.9, z * 0.9, 431, 2);
  let c = lc(LV.bas, LV.basM, sat(nB * 1.4 - 0.15));
  c = lc(c, LV.basL, ss(0.62, 0.82, nD) * 0.5);
  c = lc(c, LV.ash, ss(0.6, 0.75, nA) * 0.55);
  c = lc(c, LV.dust, ss(0.66, 0.8, 1 - nA + (nC - 0.5) * 0.4) * 0.45);
  if (k != null) {
    const pd = F.path[k];
    c = lc(c, lc(LV.ash, LV.basL, nC), (1 - ss(0.35, 1.2, pd)) * 0.55);
    c = lc(c, lc(LV.lavaR, LV.dust, 0.6), (1 - ss(0, 1.2, F.water[k])) * 0.6);
    c = mc(c, 1 - 0.45 * Math.exp(-F.solid[k] * 1.6));
  }
  return mc(c, 0.9 + nC * 0.16);
}
function lavaCracks(ctx) {
  const { A, K } = ctx;
  const R = rng(4747);
  for (let n = 0; n < 70; n++) {
    let x = 2 + R() * (A.wx - 4), z = 2 + R() * (A.wz - 4);
    let a = R() * Math.PI * 2;
    const len = 4 + Math.floor(R() * 8);
    const g = K.m('glow', x, z), d = K.m('deco', x, z);
    for (let i = 0; i < len; i++) {
      const L = 0.22 + R() * 0.28;
      a += (R() - 0.5) * 1.1;
      const nx = x + Math.cos(a) * L, nz = z + Math.sin(a) * L;
      const v = cellAt(A, Math.floor(nx / TILE), Math.floor(nz / TILE));
      if (solidC(v) || v === C_WATER || v === C_PAD || v === C_HOME) break;
      if (ctx.F.at(ctx.F.path, nx, nz) < 0.5) break;
      const w = 0.012 + (1 - i / len) * 0.035, px = -Math.sin(a) * w, pz = Math.cos(a) * w;
      const hot = lc(LV.lavaR, LV.lava, 0.45 + R() * 0.55);
      quadC(g, [x - px, 0.006, z - pz], [nx - px * 0.8, 0.006, nz - pz * 0.8], [nx + px * 0.8, 0.006, nz + pz * 0.8], [x + px, 0.006, z + pz], hot, hot, hot, hot, MAT.glow);
      const e = w * 3.2, ex = -Math.sin(a) * e, ez = Math.cos(a) * e, dk = lc(LV.bas, LV.lavaR, 0.25), dk2 = mc(LV.bas, 0.8);
      quadC(d, [x - ex, 0.004, z - ez], [nx - ex, 0.004, nz - ez], [x, 0.0045, z], [x, 0.0045, z], dk2, dk2, dk, dk, MAT.basalt);
      quadC(d, [x, 0.0045, z], [nx, 0.0045, nz], [nx + ex, 0.004, nz + ez], [x + ex, 0.004, z + ez], dk, dk, dk2, dk2, MAT.basalt);
      if (R() < 0.18 && i > 1) { const ba = a + (R() < 0.5 ? 1 : -1) * (0.8 + R() * 0.6), bl = 0.2 + R() * 0.25, bx = nx + Math.cos(ba) * bl, bz = nz + Math.sin(ba) * bl, bw = w * 0.6, bpx = -Math.sin(ba) * bw, bpz = Math.cos(ba) * bw; triC(g, [nx - bpx, 0.006, nz - bpz], [bx, 0.006, bz], [nx + bpx, 0.006, nz + bpz], hot, mc(hot, 0.7), hot, MAT.glow); }
      x = nx; z = nz;
    }
  }
}
function hexCol(m, x, y, z, r, h, col, top) {
  const P = [], CC = [];
  for (const [yy, k] of [[0, 0.72], [h * 0.92, 1], [h, 1.02]]) { const row = [], crow = []; for (let j = 0; j <= 6; j++) { const a = (j / 6) * Math.PI * 2 + 0.3; row.push([x + Math.cos(a) * r, y + yy, z + Math.sin(a) * r]); crow.push(mc(col, k)); } P.push(row); CC.push(crow); }
  for (let j = 0; j < 6; j++) { const a0 = (j / 6) * Math.PI * 2 + 0.3, a1 = ((j + 1) / 6) * Math.PI * 2 + 0.3; const c0 = mc(col, j % 2 ? 0.7 : 0.85); quadC(m, [x + Math.cos(a0) * r, y, z + Math.sin(a0) * r], [x + Math.cos(a1) * r, y, z + Math.sin(a1) * r], [x + Math.cos(a1) * r, y + h, z + Math.sin(a1) * r], [x + Math.cos(a0) * r, y + h, z + Math.sin(a0) * r], mc(c0, 0.55), mc(c0, 0.55), c0, c0, MAT.basalt); triC(m, [x, y + h + 0.03, z], [x + Math.cos(a1) * r, y + h, z + Math.sin(a1) * r], [x + Math.cos(a0) * r, y + h, z + Math.sin(a0) * r], top, mc(top, 0.92), mc(top, 0.92), MAT.basalt); }
}
function lavaWall(ctx, c, r) {
  const { A, K } = ctx;
  const x0 = c * TILE, z0 = r * TILE, x1 = x0 + TILE, z1 = z0 + TILE, cx = x0 + 1, cz = z0 + 1;
  const border = r === 0 || r === A.H - 1 || c === 0 || c === A.W - 1;
  const north = r === 0, south = r === A.H - 1;
  const m = K.m('props', cx, cz);
  const sd = r * 131 + c * 7;
  const R = rng(sd * 11 + 3);
  if (south) {
    for (let i = 0; i < 4; i++) hexCol(m, x0 + 0.5 + (i % 2) * 1.0, 0, z0 + 0.6 + Math.floor(i / 2) * 0.8, 0.5, 0.25 + R() * 0.3, mc(LV.basM, 0.9 + R() * 0.2), LV.basL);
    return;
  }
  if (north || !border) {
    const h = north ? 2.7 : 1.55;
    const courses = Math.round(h / 0.26);
    blockC(m, x0 + 0.05, 0, z0 + 0.05, x1 - 0.05, h - 0.02, z1 - 0.05, LV.soot, MAT.matte, { ao: 0.8 });
    for (let k = 0; k < courses; k++) {
      const y0 = (k * h) / courses, y1 = ((k + 1) * h) / courses;
      let x = x0 - (k % 2 ? 0.25 : 0);
      while (x < x1 - 0.01) {
        const a = Math.max(x0, x), b = Math.min(x1, x + 0.5);
        const col = mc(pick(R, LV.brick), 0.85 + R() * 0.25);
        const soot = ss(0.5, 1, k / courses) * 0.6;
        blockC(m, a + 0.012, y0 + 0.012, z0 + 0.012, b - 0.012, y1 - 0.012, z1 - 0.012, lc(col, LV.soot, soot), MAT.stone, { lo: mc(col, 0.6), top: lc(col, LV.soot, 0.5), bev: 0.012 });
        x += 0.5;
      }
    }
    for (const yy of [0.3, h - 0.35]) blockC(m, x0 - 0.01, yy, z0 - 0.01, x1 + 0.01, yy + 0.09, z1 + 0.01, LV.iron, MAT.trim, { ao: 0.85 });
    blockC(m, x0 - 0.02, h - 0.02, z0 - 0.02, x1 + 0.02, h + 0.06, z1 + 0.02, LV.ironD, MAT.plate, { ao: 0.9, top: mc(LV.ironD, 1.2) });
    for (let k = 0; k < 6; k++) ball(m, x0 + 0.15 + (k % 3) * 0.85, h + 0.065, z0 + 0.25 + Math.floor(k / 3) * 1.5, 0.04, '#55595F', MAT.trim, 6);
    if (north && c % 3 === 1) {
      blockC(m, cx - 0.55, 0.45, z1 - 0.02, cx + 0.55, 1.45, z1 + 0.04, hx('#140C0A'), MAT.matte, { ao: 1, skip: 'n' });
      blockC(m, cx - 0.45, 0.5, z1 + 0.03, cx + 0.45, 1.25, z1 + 0.05, LV.lava, MAT.glow, { ao: 1, skip: 'n' });
      blockC(m, cx - 0.62, 1.45, z1, cx + 0.62, 1.6, z1 + 0.12, LV.iron, MAT.metal, { ao: 0.8 });
    }
    if (north && c % 4 === 2) { m.cyl(cx, h, cz, 0.32, 2.4, 12, '#3A3D42', MAT.metal); m.cyl(cx, h + 2.4, cz, 0.36, 0.12, 12, '#2A2C30', MAT.metal); }
    if (!border && R() < 0.4) tube(m, [x0 + 0.1, h - 0.4, z1 + 0.12], [x1 - 0.1, h - 0.4, z1 + 0.12], 0.07, 0.07, 8, '#6A6E75', MAT.metal);
    return;
  }
  for (let i = 0; i < 7; i++) {
    const hx2 = x0 + 0.35 + (i % 3) * 0.65 + (R() - 0.5) * 0.1, hz = z0 + 0.35 + Math.floor(i / 3) * 0.65 + (R() - 0.5) * 0.1;
    hexCol(m, hx2, 0, hz, 0.36, 1.3 + R() * 0.7, mc(LV.basM, 0.85 + R() * 0.3), lc(LV.basL, LV.ash, R() * 0.5));
  }
}
function emberShrub(m, x, z, seed) {
  const R = rng(seed);
  const nb = 6 + Math.floor(R() * 3);
  for (let i = 0; i < nb; i++) {
    const a = (i / nb) * Math.PI * 2 + R() * 0.5, L = 0.7 + R() * 0.5, up = 0.7 + R() * 0.5;
    const tip = [x + Math.cos(a) * L * 0.6, up, z + Math.sin(a) * L * 0.6];
    tubeC(m, [[x, 0, z], [x + Math.cos(a) * L * 0.25, up * 0.5, z + Math.sin(a) * L * 0.25], tip], [0.05, 0.035, 0.012], 5, () => hx('#2A1E1A'), MAT.matte);
    for (let k = 0; k < 7; k++) {
      const t = 0.35 + k * 0.1, px = x + (tip[0] - x) * t, py = tip[1] * t, pz = z + (tip[2] - z) * t;
      const la = R() * 6.28, ll = 0.16 + R() * 0.12;
      const col = k > 5 && R() < 0.35 ? lc(LV.lavaR, LV.lava, R()) : lc(LV.leafD, LV.leafL, R());
      const mt = k > 5 && col[0] > 0.7 ? MAT.glow : MAT.matte;
      triC(m, [px, py, pz], [px + Math.cos(la) * ll, py + 0.1, pz + Math.sin(la) * ll], [px + Math.cos(la + 0.5) * ll * 0.7, py - 0.05, pz + Math.sin(la + 0.5) * ll * 0.7], col, mc(col, 1.1), mc(col, 0.8), mt);
    }
  }
}
function lavaBushCell(m, x, z, seed) {
  const R = rng(seed);
  emberShrub(m, x + (R() - 0.5) * 0.3, z + (R() - 0.5) * 0.3, seed);
  for (let i = 0; i < 3; i++) { const a = R() * 6.28, d = 0.5 + R() * 0.3; emberShrub(m, x + Math.cos(a) * d, z + Math.sin(a) * d, seed + i + 1); }
  rockC(m, x + (R() - 0.5), 0, z + (R() - 0.5), 0.3, 0.18, 0.25, seed, [LV.bas, LV.basM], null, MAT.basalt);
}
function lavaPool(ctx, c, r) {
  const { A, K, F } = ctx;
  const x0 = c * TILE, z0 = r * TILE, x1 = x0 + TILE, z1 = z0 + TILE;
  const g = K.m('ground', x0 + 1, z0 + 1), w = K.m('glow', x0 + 1, z0 + 1), d = K.m('deco', x0 + 1, z0 + 1);
  const P = [], CC = [];
  for (let i = 0; i <= 4; i++) { const row = [], crow = []; for (let j = 0; j <= 4; j++) { const x = x0 + j * 0.5, z = z0 + i * 0.5; const t = ss(0, 1.3, F.at(F.shore, x, z)); const n = vn(x * 1.6, z * 1.6, 501); row.push([x, -0.22, z]); crow.push(lc(lc(LV.lavaR, LV.lava, t), LV.lavaY, ss(0.55, 0.85, n) * t)); } P.push(row); CC.push(crow); }
  surfC(w, P, CC, MAT.glow);
  for (const [dc, dr] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
    if (cellAt(A, c + dc, r + dr) === C_WATER) continue;
    let a, b;
    if (dr === 1) { a = [x0, z1]; b = [x1, z1]; } else if (dr === -1) { a = [x1, z0]; b = [x0, z0]; } else if (dc === 1) { a = [x1, z1]; b = [x1, z0]; } else { a = [x0, z0]; b = [x0, z1]; }
    quadC(g, [a[0], -0.3, a[1]], [b[0], -0.3, b[1]], [b[0], 0, b[1]], [a[0], 0, a[1]], LV.lavaR, LV.lavaR, LV.bas, LV.bas, MAT.basalt);
    const Rr = rng(c * 13 + r * 7 + dc * 3 + dr * 5);
    let t = Rr() * 0.2;
    while (t < 1) { const px = a[0] + (b[0] - a[0]) * t, pz = a[1] + (b[1] - a[1]) * t, s0 = 0.15 + Rr() * 0.2; rockC(d, px, -0.1, pz, s0 * 1.4, s0 * 0.7, s0, Math.floor(Rr() * 1e6), [LV.bas, LV.basM], null, MAT.basalt); t += 0.12 + Rr() * 0.1; }
  }
  const R = rng(c * 31 + r * 17);
  const nf = 2 + Math.floor(R() * 3);
  for (let i = 0; i < nf; i++) {
    const fx = x0 + 0.4 + R() * 1.2, fz = z0 + 0.4 + R() * 1.2, rr = 0.15 + R() * 0.25, n = 7, rot0 = R() * 6;
    for (let k = 0; k < n; k++) { const a0 = rot0 + (k / n) * 6.283, a1 = rot0 + ((k + 1) / n) * 6.283; const r0 = rr * (0.7 + hsh(i, k, c) * 0.5), r1 = rr * (0.7 + hsh(i, k + 1, c) * 0.5); triC(d, [fx, -0.17, fz], [fx + Math.cos(a1) * r1, -0.2, fz + Math.sin(a1) * r1], [fx + Math.cos(a0) * r0, -0.2, fz + Math.sin(a0) * r0], LV.basM, LV.crust, LV.crust, MAT.basalt); }
  }
}
function lavaCrateGroup(ctx, cells) {
  const { K } = ctx;
  for (const { c, r } of cells) {
    const x0 = c * TILE, z0 = r * TILE, x = x0 + 1, z = z0 + 1;
    const m = K.m('props', x, z), gm = K.m('glow', x, z);
    const R = rng(c * 53 + r * 29 + 7);
    const t = hsh(c, r, 41);
    if (t < 0.4) {
      for (const [dx, dz] of [[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]]) drum(m, x + dx, 0, z + dz, 0.4, 1.05, pick(R, [hx('#B8892E'), hx('#7A2A22'), hx('#3E4248')]));
      for (const [dx, dz] of [[-0.45, 0.45], [0.45, 0.45]]) for (let k = 0; k < 6; k++) { const a0 = (k / 6) * Math.PI * 2; m.box(x + dx + Math.cos(a0) * 0.41, 0.45, z + dz + Math.sin(a0) * 0.41, 0.08, 0.14, 0.08, k % 2 ? '#1E1E1E' : '#E2A33A', MAT.paint); }
    } else if (t < 0.7) {
      blockC(m, x0 + 0.1, 0, z0 + 0.1, x0 + 1.9, 0.18, z0 + 1.9, LV.ironD, MAT.plate, { ao: 0.6 });
      for (let k = 0; k < 4; k++) for (let i = 0; i < 3; i++) { const ix = x0 + 0.3 + i * 0.5 + (k % 2) * 0.22, iz = z0 + 0.35, yy = 0.18 + k * 0.26; const hot = k === 3 && i === 1; blockC(hot ? gm : m, ix, yy, iz, ix + 0.42, yy + 0.24, iz + 1.3, hot ? LV.lava : hx('#A8822E'), hot ? MAT.glow : MAT.trim, { lo: hx('#6A4A1A'), bev: 0.05 }); }
    } else {
      const col = hx('#3E4248');
      blockC(m, x0 + 0.08, 0, z0 + 0.08, x0 + 1.92, 1.32, z0 + 1.92, col, MAT.plate, { lo: mc(col, 0.55), bev: 0.03 });
      for (const yy of [0.15, 1.1]) blockC(m, x0 + 0.06, yy, z0 + 0.06, x0 + 1.94, yy + 0.08, z0 + 1.94, LV.iron, MAT.trim, { ao: 0.9 });
      for (let k = 0; k < 7; k++) { const sx = x0 + 0.15 + k * 0.25; quadC(m, [sx, 0.6, z0 + 1.925], [sx + 0.12, 0.6, z0 + 1.925], [sx + 0.24, 0.85, z0 + 1.925], [sx + 0.12, 0.85, z0 + 1.925], LV.hazard, LV.hazard, LV.hazard, LV.hazard, MAT.paint); }
    }
  }
}
function lavaClutter(ctx, c, r) {
  const { A, K } = ctx;
  const v = cellAt(A, c, r);
  if (solidC(v) || v === C_WATER) return;
  const x0 = c * TILE, z0 = r * TILE;
  const m = K.m('fine', x0 + 1, z0 + 1);
  const R = rng(c * 7919 + r * 104729 + 61);
  if (R() < 0.4) { const x = x0 + 0.2 + R() * 1.6, z = z0 + 0.2 + R() * 1.6, s0 = 0.06 + R() * 0.12; rockC(m, x, -0.01, z, s0 * 1.3, s0 * 0.7, s0, c * 3 + r * 5, [LV.bas, LV.basL], null, MAT.basalt); }
  if (R() < 0.15) { const x = x0 + R() * 2, z = z0 + R() * 2, a = R() * 6.28, L = 0.2 + R() * 0.3; const ca = Math.cos(a) * L, sa = Math.sin(a) * L; quadC(m, [x - ca, 0.01, z - sa], [x - ca + sa * 0.05, 0.01, z - sa - ca * 0.05], [x + ca + sa * 0.05, 0.01, z + sa - ca * 0.05], [x + ca, 0.01, z + sa], LV.ironD, LV.ironD, LV.ironD, LV.ironD, MAT.matte); }
}
function lavaPlaza(ctx) {
  const { A, K } = ctx;
  const cx = A.wx / 2, cz = A.wz / 2 + 4;
  const R = rng(6161);
  for (let tz = cz - 5; tz < cz + 5; tz += 2) for (let tx = cx - 7; tx < cx + 7; tx += 2) {
    let ok = true;
    for (const [px, pz] of [[tx + 0.1, tz + 0.1], [tx + 1.9, tz + 0.1], [tx + 0.1, tz + 1.9], [tx + 1.9, tz + 1.9]]) { const v = cellAt(A, Math.floor(px / TILE), Math.floor(pz / TILE)); if (solidC(v) || v === C_WATER || v === C_BUSH || v === C_PAD) ok = false; }
    if (!ok || R() < 0.12) continue;
    const m = K.m('deco', tx + 1, tz + 1);
    const col = mc(LV.iron, 0.85 + R() * 0.2);
    slab(m, tx + 0.03, tz + 0.03, tx + 1.97, tz + 1.97, 0.035, [0, 0], -1, col, LV.dust, R() * 0.5, Math.floor(R() * 1e5));
    for (const [px, pz] of [[0.15, 0.15], [1.85, 0.15], [0.15, 1.85], [1.85, 1.85]]) ball(m, tx + px, 0.04, tz + pz, 0.035, '#6A6E75', MAT.metal, 6);
    if (R() < 0.5) for (let i = 1; i < 6; i++) { const lz = tz + i * 0.33; quadC(m, [tx + 0.25, 0.037, lz], [tx + 1.75, 0.037, lz], [tx + 1.75, 0.037, lz + 0.04], [tx + 0.25, 0.037, lz + 0.04], mc(col, 0.7), mc(col, 0.7), mc(col, 0.7), mc(col, 0.7), MAT.matte); }
  }
}
function lavaPad(ctx, p) { hazardRing(ctx.K.m('deco', p.x, p.z), ctx.K.m('glow', p.x, p.z), p, 0.72, 0.98, hx('#FF5A1A')); }
function lavaHome(ctx, p) { paintedHome(ctx, p, hx('#4A4E55'), hx('#4FA8FF')); }
function lavaOuter(ctx) {
  const { A, K } = ctx;
  const R = rng(4141);
  const spots = [];
  const ok = (x, z, d) => spots.every((s0) => Math.hypot(s0[0] - x, s0[1] - z) > Math.max(d, s0[2]));
  const outD = (x, z) => Math.max(-x, x - A.wx, -z, z - A.wz);
  const place = (n, dmin, dmax, sp, fn, south = false) => {
    let made = 0;
    for (let t = 0; t < n * 30 && made < n; t++) {
      const x = -ctx.M + R() * (A.wx + ctx.M * 2), z = -ctx.M + R() * (A.wz + ctx.M + ctx.MS);
      const d = outD(x, z);
      if (d < dmin || d > dmax || (!south && z > A.wz) || !ok(x, z, sp)) continue;
      spots.push([x, z, sp]); fn(x, ctx.outerY(x, z), z); made++;
    }
  };
  place(30, 2.5, 24, 3.2, (x, y, z) => { const m = K.m('outer', x, z); const n = 3 + Math.floor(R() * 5); for (let i = 0; i < n; i++) hexCol(m, x + (R() - 0.5) * 1.6, y - 0.2, z + (R() - 0.5) * 1.6, 0.4 + R() * 0.2, 1 + R() * 3.5, mc(LV.basM, 0.8 + R() * 0.3), LV.basL); });
  place(24, 2, 24, 3, (x, y, z) => { const s0 = 0.5 + R() * 1.0; rockC(K.m('outer', x, z), x, y - 0.1, z, s0 * 1.5, s0 * 0.8, s0, Math.floor(R() * 1e6), [LV.bas, LV.basM], null, MAT.basalt); }, true);
  for (const sx of [A.wx * 0.2, A.wx * 0.45, A.wx * 0.8]) { const m = K.m('outer', sx, -10); m.cyl(sx, 0, -10, 1.3, 14, 14, '#3A3330', MAT.stone, { r2: 1.0 }); m.cyl(sx, 14, -10, 1.05, 0.5, 14, '#2A2522', MAT.stone); disc(K.m('glow', sx, -10), sx, 14.45, -10, 0.8, 12, '#FF7A2A', MAT.glow); }
  for (let i = 0; i < 2; i++) {
    const z0 = i ? A.wz + 6 : -6, g = K.m('glow', A.wx / 2, z0);
    const P = [], CC = [];
    for (let k = 0; k <= 30; k++) { const x = -ctx.M + (k / 30) * (A.wx + ctx.M * 2), z = z0 + Math.sin(k * 0.6 + i) * 1.5; P.push([[x, ctx.outerY(x, z - 1.2) + 0.05, z - 1.2], [x, ctx.outerY(x, z + 1.2) + 0.05, z + 1.2]]); const c0 = lc(LV.lava, LV.lavaY, hsh(k, i) * 0.6); CC.push([LV.lavaR, c0]); }
    if (i === 0) surfC(g, P, CC, MAT.glow);
  }
}


const DK = {
  conc: hx('#8E8B84'), concD: hx('#75726B'), concL: hx('#A29F97'), stain: hx('#5E5A52'),
  wood: ['#8A6A48', '#7A5C3E', '#957452', '#6E5238', '#A07E58'].map(hx), woodD: hx('#4A3626'),
  sand: hx('#C8B48A'), sandD: hx('#B09A70'),
  sea: hx('#1F5C6E'), seaL: hx('#3E8C96'), seaD: hx('#123A4A'),
  cont: ['#B03A2E', '#2E5E9A', '#2A7E78', '#D08A2A', '#5E6A74', '#7A4A8A', '#3E7A3A'].map(hx),
  rope: hx('#C8B080'), grass: hx('#6E8A3A'), grassY: hx('#B8B070'),
};
function docksGround(F, x, z, k) {
  const nA = fbm(x * 0.08, z * 0.08, 601, 3), nB = fbm(x * 0.3, z * 0.3, 613, 3), nC = vn(x * 1.5, z * 1.5, 627), nD = fbm(x * 0.9, z * 0.9, 631, 2);
  let c = lc(DK.concD, DK.conc, sat(nB * 1.3 - 0.1));
  c = lc(c, DK.concL, ss(0.62, 0.8, nD) * 0.35);
  c = lc(c, DK.stain, ss(0.65, 0.78, nA) * 0.45);
  const gx = Math.abs(((x + 1) % 4) - 2), gz = Math.abs((z % 4) - 2);
  c = mc(c, 1 - (1 - ss(0.0, 0.05, 2 - gx)) * 0.12 - (1 - ss(0.0, 0.05, 2 - gz)) * 0.12);
  if (k != null) {
    c = lc(c, lc(DK.sandD, DK.sand, nC), (1 - ss(0.2, 1.2, F.bush[k])) * 0.85);
    c = lc(c, mc(DK.concD, 0.7), (1 - ss(0, 0.6, F.water[k])) * 0.4);
    c = mc(c, 1 - 0.4 * Math.exp(-F.solid[k] * 1.7));
  }
  return mc(c, 0.92 + nC * 0.12);
}
function boards(m, x0, z0, x1, z1, y, seed, alongX) {
  const R = rng(seed);
  const w = 0.24;
  if (alongX) {
    for (let z = z0; z < z1 - 0.05; z += w) {
      let x = x0 - R() * 1.2;
      while (x < x1) { const L = 1.2 + R() * 1.8; const a = Math.max(x0, x), b = Math.min(x1, x + L); if (b - a > 0.15) { const col = mc(pick(R, DK.wood), 0.85 + R() * 0.25); blockC(m, a + 0.01, y - 0.05, z + 0.012, b - 0.01, y + (R() - 0.5) * 0.01, Math.min(z1, z + w) - 0.012, col, MAT.soil, { lo: mc(col, 0.55), bev: 0.008, top: col }); } x += L; }
    }
  } else {
    for (let x = x0; x < x1 - 0.05; x += w) {
      let z = z0 - R() * 1.2;
      while (z < z1) { const L = 1.2 + R() * 1.8; const a = Math.max(z0, z), b = Math.min(z1, z + L); if (b - a > 0.15) { const col = mc(pick(R, DK.wood), 0.85 + R() * 0.25); blockC(m, x + 0.012, y - 0.05, a + 0.01, Math.min(x1, x + w) - 0.012, y + (R() - 0.5) * 0.01, b - 0.01, col, MAT.soil, { lo: mc(col, 0.55), bev: 0.008, top: col }); } z += L; }
    }
  }
}
function docksDecks(ctx) {
  const { A, K, F } = ctx;
  const ok = (c, r) => { const v = cellAt(A, c, r); return !(solidC(v) || v === C_WATER || v === C_BUSH || v === C_PAD || v === C_HOME); };
  for (let r = 1; r < A.H - 1; r++) for (let c = 1; c < A.W - 1; c++) {
    if (!ok(c, r)) continue;
    const x0 = c * TILE, z0 = r * TILE;
    const pd = F.at(F.path, x0 + 1, z0 + 1);
    const center = Math.abs(x0 + 1 - A.wx / 2) < 7 && Math.abs(z0 + 1 - A.wz / 2) < 6;
    if (pd > 1.4 && !center) continue;
    const m = K.m('deco', x0 + 1, z0 + 1);
    boards(m, x0, z0, x0 + TILE, z0 + TILE, 0.06, c * 31 + r * 7, true);
  }
}
function containerRun(m, x0, z0, x1, z1, h, col, seed, doorE) {
  const R = rng(seed);
  blockC(m, x0 + 0.02, 0, z0 + 0.05, x1 - 0.02, h, z1 - 0.05, col, MAT.paint, { lo: mc(col, 0.6), top: mc(col, 1.04) });
  const len = x1 - x0, n = Math.round(len / 0.3);
  for (let i = 1; i < n; i++) { const xx = x0 + (i * len) / n; for (const [za, zb] of [[z1 - 0.06, z1 - 0.01], [z0 + 0.01, z0 + 0.06]]) blockC(m, xx - 0.05, 0.12, za, xx + 0.05, h - 0.1, zb, mc(col, 0.8), MAT.paint, { ao: 0.85 }); }
  for (const [xx, zz] of [[x0 + 0.02, z0 + 0.05], [x1 - 0.14, z0 + 0.05], [x0 + 0.02, z1 - 0.17], [x1 - 0.14, z1 - 0.17]]) { blockC(m, xx, 0, zz, xx + 0.12, 0.14, zz + 0.12, hx('#3A3E44'), MAT.trim, { ao: 0.8 }); blockC(m, xx, h - 0.14, zz, xx + 0.12, h + 0.01, zz + 0.12, hx('#3A3E44'), MAT.trim, { ao: 0.8 }); }
  for (let i = 0; i < 3; i++) { const xx = x0 + 0.3 + R() * (len - 0.6); blockC(m, xx, h, z0 + 0.2, xx + 0.04, h + 0.01, z1 - 0.2, mc(col, 0.85), MAT.paint, { ao: 1 }); }
  if (R() < 0.6) blockC(m, x0 + len * 0.3, h * 0.55, z1 - 0.05, x0 + len * 0.3 + 0.9, h * 0.72, z1 - 0.035, hx('#F0EDE4'), MAT.matte, { ao: 1, skip: 'n' });
  if (doorE != null) { const xe = doorE > 0 ? x1 - 0.02 : x0 + 0.02; for (const zz of [-0.45, 0.45]) blockC(m, xe - 0.04, 0.15, (z0 + z1) / 2 + zz - 0.42, xe + 0.04, h - 0.15, (z0 + z1) / 2 + zz + 0.42, mc(col, 0.9), MAT.paint, { ao: 0.8 }); for (const zz of [-0.2, 0.2]) blockC(m, xe - 0.06, 0.2, (z0 + z1) / 2 + zz - 0.02, xe + 0.06, h - 0.2, (z0 + z1) / 2 + zz + 0.02, hx('#9AA0A8'), MAT.trim, { ao: 0.9 }); }
}
function docksWall(ctx, c, r) {
  const { A, K } = ctx;
  const x0 = c * TILE, z0 = r * TILE, x1 = x0 + TILE, z1 = z0 + TILE, cx = x0 + 1, cz = z0 + 1;
  const border = r === 0 || r === A.H - 1 || c === 0 || c === A.W - 1;
  const north = r === 0, south = r === A.H - 1;
  const m = K.m('props', cx, cz);
  const R = rng(r * 131 + c * 7 + 3);
  if (south) {
    blockC(m, x0, 0, z0 + 0.6, x1, 0.32, z0 + 1.4, DK.concD, MAT.stone, { lo: mc(DK.concD, 0.6), bev: 0.04 });
    if (c % 2 === 0) { m.cyl(x0 + 0.2, 0.32, cz, 0.12, 0.6, 10, '#2E3238', MAT.trim); m.cyl(x0 + 0.2, 0.92, cz, 0.16, 0.08, 10, '#2E3238', MAT.trim); }
    tube(m, [x0 + 0.2, 0.82, cz], [x1 + 0.2, 0.78, cz], 0.025, 0.025, 6, DK.rope, MAT.matte);
    return;
  }
  if (north || !border) {
    const runKey = (cc) => { let k = cc; while (k > 0 && solidC(cellAt(A, k - 1, r)) && !(cellAt(A, k - 1, r) === C_CRATE)) k--; return k; };
    const start = runKey(c);
    const col = DK.cont[Math.floor(hsh(start, r, 9) * DK.cont.length)];
    const h = north ? 2.6 : 1.55;
    const leftOpen = !solidC(cellAt(A, c - 1, r)), rightOpen = !solidC(cellAt(A, c + 1, r));
    containerRun(m, x0, z0, x1, z1, h, mc(col, 0.95), r * 131 + c * 7, rightOpen ? 1 : leftOpen ? -1 : null);
    if (north && R() < 0.6) containerRun(m, x0, z0 + 0.1, x1, z1 - 0.3, 0.0001, col, 1, null);
    return;
  }
  const fx = c === 0 ? x1 : x0;
  blockC(m, c === 0 ? x0 : x1 - 1.0, 0, z0, c === 0 ? x0 + 1.0 : x1, 1.2, z1, DK.concD, MAT.stone, { lo: mc(DK.concD, 0.55), top: DK.conc, bev: 0.03 });
  blockC(m, c === 0 ? x0 + 0.95 : x1 - 1.15, 0, z0 + 0.1, c === 0 ? x0 + 1.15 : x1 - 0.95, 1.75, z1 - 0.1, mc(DK.conc, 0.9), MAT.stone, { lo: mc(DK.conc, 0.55), bev: 0.04 });
  if (r % 2 === 0) { const bx = c === 0 ? x0 + 0.5 : x1 - 0.5; m.cyl(bx, 1.2, cz, 0.15, 0.4, 12, '#2E3238', MAT.trim); m.cyl(bx, 1.6, cz, 0.2, 0.08, 12, '#2E3238', MAT.trim); }
  if (R() < 0.4) withT(m, rot(fx + (c === 0 ? 0.02 : -0.02), 0.9, cz + (R() - 0.5), c === 0 ? Math.PI / 2 : -Math.PI / 2, Math.PI / 2), () => m.revolve(0, -0.12, 0, [[0.2, 0], [0.32, 0.02], [0.34, 0.12], [0.32, 0.22], [0.2, 0.24]], 14, '#1D1E21', MAT.plastic));
}
function docksCrateGroup(ctx, cells) {
  const { K } = ctx;
  for (const { c, r } of cells) {
    const x0 = c * TILE, z0 = r * TILE, x = x0 + 1, z = z0 + 1;
    const m = K.m('props', x, z);
    const R = rng(c * 37 + r * 41 + 1);
    const t = hsh(c, r, 51);
    if (t < 0.5) {
      const crate = (px, py, pz, s0) => { const col = mc(pick(R, DK.wood), 0.9 + R() * 0.15); blockC(m, px - s0 / 2, py, pz - s0 / 2, px + s0 / 2, py + s0, pz + s0 / 2, mc(col, 0.8), MAT.woodX, { lo: mc(col, 0.5), bev: 0.01 }); const fr = mc(col, 1.08); for (const sg of [-1, 1]) { blockC(m, px - s0 / 2 - 0.01, py, pz + sg * s0 / 2 - 0.05, px + s0 / 2 + 0.01, py + 0.08, pz + sg * s0 / 2 + 0.05, fr, MAT.woodX, { ao: 0.8 }); blockC(m, px - s0 / 2 - 0.01, py + s0 - 0.08, pz + sg * s0 / 2 - 0.05, px + s0 / 2 + 0.01, py + s0, pz + sg * s0 / 2 + 0.05, fr, MAT.woodX, { ao: 0.9 }); blockC(m, px + sg * s0 / 2 - 0.05, py, pz - s0 / 2 - 0.01, px + sg * s0 / 2 + 0.05, py + s0, pz + s0 / 2 + 0.01, fr, MAT.woodZ, { ao: 0.85 }); } withT(m, rot(px, py + s0 / 2, pz + s0 / 2 + 0.01, 0, 0, 0.78), () => blockC(m, -0.04, -s0 * 0.66, -0.01, 0.04, s0 * 0.66, 0.02, fr, MAT.woodX, { ao: 0.9 })); };
      crate(x - 0.45, 0, z - 0.42, 0.9); crate(x + 0.47, 0, z - 0.38, 0.85); crate(x - 0.35, 0, z + 0.5, 0.85); crate(x + 0.45, 0, z + 0.48, 0.8); crate(x, 0.88, z - 0.1, 0.8);
    } else if (t < 0.75) {
      for (const [dx, dz] of [[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]]) { m.revolve(x + dx, 0, z + dz, [[0.001, 0], [0.34, 0], [0.4, 0.2], [0.42, 0.5], [0.4, 0.8], [0.34, 1.0], [0.001, 1.0]], 14, pick(R, DK.wood), MAT.woodZ); for (const yy of [0.15, 0.82]) m.revolve(x + dx, yy, z + dz, [[0.4, 0], [0.41, 0.03], [0.41, 0.07], [0.4, 0.1]], 14, '#3A3E44', MAT.trim); }
      for (let k = 0; k < 3; k++) { withT(m, rot(x + 0.1, 1.02 + k * 0.08, z, k * 0.5), () => m.revolve(0, 0, 0, [[0.2, 0], [0.32, 0.01], [0.34, 0.04], [0.32, 0.07], [0.2, 0.08]], 16, DK.rope, MAT.matte)); }
    } else {
      blockC(m, x0 + 0.1, 0, z0 + 0.1, x0 + 1.9, 0.14, z0 + 1.9, mc(DK.wood[3], 0.9), MAT.woodX, { ao: 0.6 });
      blockC(m, x0 + 0.2, 0.14, z0 + 0.2, x0 + 1.8, 1.25, z0 + 1.8, hx('#3E5A6E'), MAT.matte, { lo: hx('#24343F'), bev: 0.18, top: hx('#46667C') });
      for (const sx of [0.4, 1.6]) tube(m, [x0 + sx, 1.25, z0 + 0.18], [x0 + sx, 1.25, z0 + 1.82], 0.02, 0.02, 5, DK.rope, MAT.matte);
    }
  }
}
function docksBushCell(m, x, z, seed) {
  const R = rng(seed);
  blobC(m, [x, -0.1, z], [1.0, 0.22, 1.0], 12, 5, 0.12, seed, (ny, h) => lc(DK.sandD, DK.sand, sat(ny * 0.8 + h * 0.2)), MAT.sand);
  for (let i = 0; i < 13; i++) { const a = R() * 6.28, d = Math.sqrt(R()) * 0.8; tuft(m, x + Math.cos(a) * d, 0.05, z + Math.sin(a) * d, 0.9 + R() * 0.6, 12, lc(DK.grass, hx('#4E6A2A'), R()), lc(DK.grassY, hx('#D8D0A0'), R()), seed + i * 5); }
  for (let k = 0; k < 4; k++) { const fx = x + (R() - 0.5) * 1.2, fz = z + (R() - 0.5) * 1.2, fh = 1.1 + R() * 0.5; triC(m, [fx - 0.012, 0, fz], [fx + 0.012, 0, fz], [fx + 0.1, fh, fz], DK.grass, DK.grass, DK.grassY, MAT.matte); sq(m, fx + 0.1, fh, fz, 0.03, 0.1, 0.03, 0.8, 0.8, '#C8B888', MAT.matte, 6, 4); }
}
function docksWater(ctx, c, r) {
  const { A, K, F } = ctx;
  const x0 = c * TILE, z0 = r * TILE, x1 = x0 + TILE, z1 = z0 + TILE;
  const g = K.m('ground', x0 + 1, z0 + 1), w = K.m('water', x0 + 1, z0 + 1), d = K.m('props', x0 + 1, z0 + 1);
  quadC(g, [x0, -1.2, z0], [x0, -1.2, z1], [x1, -1.2, z1], [x1, -1.2, z0], DK.seaD, DK.seaD, DK.seaD, DK.seaD, MAT.matte);
  const P = [], CC = [];
  for (let i = 0; i <= 4; i++) { const row = [], crow = []; for (let j = 0; j <= 4; j++) { const x = x0 + j * 0.5, z = z0 + i * 0.5; const t = ss(0, 1.5, F.at(F.shore, x, z)); row.push([x, -0.35, z]); crow.push(lc(DK.seaL, DK.sea, t)); } P.push(row); CC.push(crow); }
  surfC(w, P, CC, 0.655);
  for (const [dc, dr] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
    if (cellAt(A, c + dc, r + dr) === C_WATER) continue;
    let a, b;
    if (dr === 1) { a = [x0, z1]; b = [x1, z1]; } else if (dr === -1) { a = [x1, z0]; b = [x0, z0]; } else if (dc === 1) { a = [x1, z1]; b = [x1, z0]; } else { a = [x0, z0]; b = [x0, z1]; }
    quadC(g, [a[0], -1.2, a[1]], [b[0], -1.2, b[1]], [b[0], 0, b[1]], [a[0], 0, a[1]], DK.seaD, DK.seaD, DK.concD, DK.concD, MAT.stone);
    const ix = -dc * 0.12, iz = -dr * 0.12;
    blockC(d, Math.min(a[0], b[0]) + (dc === 0 ? 0 : (dc > 0 ? -0.2 : 0)), 0, Math.min(a[1], b[1]) + (dr === 0 ? 0 : (dr > 0 ? -0.2 : 0)), Math.max(a[0], b[0]) + (dc === 0 ? 0 : (dc > 0 ? 0 : 0.2)), 0.14, Math.max(a[1], b[1]) + (dr === 0 ? 0 : (dr > 0 ? 0 : 0.2)), mc(DK.wood[1], 0.85), dc === 0 ? MAT.woodX : MAT.woodZ, { lo: DK.woodD, bev: 0.01 });
    for (const t of [0.15, 0.85]) { const px = a[0] + (b[0] - a[0]) * t + ix, pz = a[1] + (b[1] - a[1]) * t + iz; d.cyl(px, -1.2, pz, 0.11, 1.38, 8, '#5A4632', MAT.woodZ); }
  }
}
function docksClutter(ctx, c, r) {
  const { A, K } = ctx;
  const v = cellAt(A, c, r);
  if (solidC(v) || v === C_WATER) return;
  const x0 = c * TILE, z0 = r * TILE;
  const m = K.m('fine', x0 + 1, z0 + 1);
  const R = rng(c * 7919 + r * 104729 + 71);
  if (R() < 0.12) { const x = x0 + 0.3 + R() * 1.4, z = z0 + 0.3 + R() * 1.4; withT(m, rot(x, 0.07, z, R() * 3), () => { for (let k = 0; k < 4; k++) m.revolve(0, k * 0.035, 0, [[0.12, 0], [0.2, 0.005], [0.21, 0.017], [0.2, 0.03], [0.12, 0.035]], 12, DK.rope, MAT.matte); }); }
  if (R() < 0.08) { const x = x0 + 0.3 + R() * 1.4, z = z0 + 0.3 + R() * 1.4; m.revolve(x, 0.06, z, [[0.001, 0], [0.12, 0], [0.13, 0.25], [0.11, 0.28], [0.001, 0.28]], 10, pick(R, ['#C8402F', '#2E5E9A', '#E2B341']), MAT.paint); }
  if (R() < 0.25) { const x = x0 + R() * 2, z = z0 + R() * 2; const st = mc(DK.stain, 0.8); for (let k = 0; k < 6; k++) { const a0 = (k / 6) * 6.283, a1 = ((k + 1) / 6) * 6.283, rr = 0.18 + R() * 0.15; triC(m, [x, 0.005, z], [x + Math.cos(a1) * rr, 0.005, z + Math.sin(a1) * rr], [x + Math.cos(a0) * rr, 0.005, z + Math.sin(a0) * rr], st, mc(st, 1.1), mc(st, 1.1), MAT.stone); } }
}
function docksPad(ctx, p) { hazardRing(ctx.K.m('deco', p.x, p.z), ctx.K.m('glow', p.x, p.z), p, 0.72, 0.98, hx('#FF7A2A')); }
function docksHome(ctx, p) { paintedHome(ctx, p, hx('#5E6A74'), hx('#FFD45A')); }
function boat(m, x, y, z, yaw, s, col) {
  withT(m, rot(x, y, z, yaw), () => {
    m.revolve(0, 0, 0, [[0.001, 0], [0.9 * s, 0.05], [1.2 * s, 0.5 * s], [1.25 * s, 0.9 * s], [0.001, 0.9 * s]], 16, col, MAT.paint);
    blockC(m, -0.6 * s, 0.9 * s, -1.0 * s, 0.6 * s, 1.0 * s, 1.0 * s, hx('#E8E2D2'), MAT.woodX, { ao: 0.8 });
    blockC(m, -0.45 * s, 1.0 * s, -0.5 * s, 0.45 * s, 1.7 * s, 0.3 * s, hx('#F0EDE4'), MAT.paint, { ao: 0.8, top: hx('#C8402F') });
  });
}
function docksOuter(ctx) {
  const { A, K } = ctx;
  const R = rng(6161);
  const seaY = -0.45;
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    const x0 = -ctx.M + i * (A.wx / 2 + ctx.M), z0 = -2 + j * ((A.wz + ctx.MS + 2) / 2);
    const w = K.m('water', x0 + 10, z0 + 10);
    const xs = [x0, x0 + A.wx / 2 + ctx.M], zs = [z0, z0 + (A.wz + ctx.MS + 2) / 2];
    quadC(w, [xs[0], seaY, zs[0]], [xs[0], seaY, zs[1]], [xs[1], seaY, zs[1]], [xs[1], seaY, zs[0]], DK.sea, DK.sea, DK.sea, DK.sea, 0.62);
  }
  { const n = K.m('outer', A.wx / 2, -10); blockC(n, -ctx.M, -0.5, -ctx.M, A.wx + ctx.M, 0.0, -2, DK.concD, MAT.stone, { lo: mc(DK.concD, 0.5) }); }
  for (let k = 0; k < 5; k++) { const wx = 4 + k * 15, m = K.m('outer', wx, -12); blockC(m, wx - 6, 0, -18, wx + 6, 5.5 + (k % 2) * 1.5, -8, pick(R, [hx('#8E5A42'), hx('#6E7A84'), hx('#9A8A70')]), MAT.stone, { lo: hx('#3E3A36'), top: hx('#5E6670') }); for (let d = 0; d < 3; d++) blockC(m, wx - 4.5 + d * 3.2, 0, -8.02, wx - 2.5 + d * 3.2, 3.2, -7.95, hx('#5A646E'), MAT.trim, { ao: 0.8, skip: 'n' }); }
  for (let k = 0; k < 10; k++) { const m = K.m('outer', 4 + k * 7, -4.5); containerRun(m, 2 + k * 7, -6, 2 + k * 7 + 6, -3.6, 2.6, pick(R, DK.cont), k * 13, null); if (R() < 0.5) containerRun(m, 2.2 + k * 7, -6, 2.2 + k * 7 + 6, -3.6, 0.0001, DK.cont[k % 7], 1, null); }
  boat(K.m('outer', -12, 18), -12, seaY, 18, 0.3, 2.2, hx('#C8402F'));
  boat(K.m('outer', A.wx + 14, 30), A.wx + 14, seaY, 30, -0.4, 2.6, hx('#2E5E9A'));
  boat(K.m('outer', A.wx / 2 + 8, A.wz + 9), A.wx / 2 + 8, seaY, A.wz + 9, 1.2, 1.6, hx('#E2B341'));
  { const lx = A.wx + 18, lz = -6, m = K.m('outer', lx, lz); m.cyl(lx, 0, lz, 2.2, 1.2, 16, '#6E6A62', MAT.stone); m.cyl(lx, 1.2, lz, 1.2, 9, 16, '#F0EDE4', MAT.paint, { r2: 0.9 }); for (let b = 0; b < 3; b++) m.cyl(lx, 2.6 + b * 2.4, lz, 1.17 - b * 0.08, 0.9, 16, '#C8402F', MAT.paint, { r2: 1.13 - b * 0.08 }); m.cyl(lx, 10.2, lz, 0.85, 1.0, 12, '#3A3E44', MAT.trim); ball(K.m('glow', lx, lz), lx, 10.7, lz, 0.5, '#FFE7A0', MAT.glow, 10); }
  for (let k = 0; k < 8; k++) { const bx = -6 - R() * 18, bz = R() * A.wz, side = R() < 0.5; const xx = side ? bx : A.wx - bx, m = K.m('outer', xx, bz); m.revolve(xx, seaY - 0.2, bz, [[0.001, 0], [0.3, 0.1], [0.32, 0.5], [0.2, 0.7], [0.001, 0.75]], 10, k % 2 ? '#C8402F' : '#E2B341', MAT.paint); }
}

const THEMES = {
  docks: {
    ground: docksGround,
    groundMat: MAT.asphalt,
    outerGround: (x, z, y) => (z < -1 ? mc(DK.concD, 0.9) : lc(DK.seaD, DK.sandD, 0.15)),
    outerH: (x, z, d) => (z < -1 && z > -40 && x > -40 && x < 140 ? 0 : -1.6 - ss(2, 10, d) * 2),
    plazaFn: docksDecks,
    wall: docksWall, bush: docksBushCell, water: docksWater, crates: docksCrateGroup, clutter: docksClutter, pad: docksPad, home: docksHome, outer: docksOuter,
    env: { sunDir: [-0.45, 0.78, -0.45], sunCol: [2.15, 2.0, 1.78], skyCol: [0.42, 0.5, 0.58], gndCol: [0.2, 0.22, 0.24], fog: '#B9CEDB', horizon: '#D3E2EC', zenith: '#4E8ACB', fogDen: 0.0035, exposure: 0.95, shadowRange: 30, cloud: [1, 1, 1], clouds: 0.75 },
  },
  lava: {
    ground: lavaGround,
    groundMat: MAT.basalt,
    outerGround: (x, z) => mc(lavaGround(null, x, z, null), 0.9),
    outerH: (x, z, d) => ss(1.5, 16, d) * (1.5 + 3.5 * fbm(x * 0.05, z * 0.05, 35, 3)),
    plazaFn: (ctx) => { lavaPlaza(ctx); lavaCracks(ctx); },
    wall: lavaWall, bush: lavaBushCell, water: lavaPool, crates: lavaCrateGroup, clutter: lavaClutter, pad: lavaPad, home: lavaHome, outer: lavaOuter,
    env: { sunDir: [-0.3, 0.75, -0.6], sunCol: [1.75, 1.3, 0.95], skyCol: [0.3, 0.22, 0.22], gndCol: [0.36, 0.16, 0.07], fog: '#4E3128', horizon: '#7E4A32', zenith: '#33263A', fogDen: 0.006, exposure: 1.18, shadowRange: 30, cloud: [0.45, 0.32, 0.28], clouds: 0.85 },
  },
  frost: {
    ground: frostGround,
    groundMat: MAT.snow,
    outerGround: (x, z) => frostGround(null, x, z, null),
    outerH: (x, z, d) => ss(1.5, 16, d) * (1.6 + 4.2 * fbm(x * 0.045, z * 0.045, 25, 3)),
    plaza: null, plazaFn: () => {},
    wall: frostWall, bush: frostBushCell, water: frostWater, crates: frostCrateGroup, clutter: frostClutter, pad: frostPad, home: frostHome, outer: frostOuter,
    env: { sunDir: [-0.5, 0.66, -0.56], sunCol: [1.95, 1.8, 1.6], skyCol: [0.4, 0.5, 0.64], gndCol: [0.36, 0.39, 0.43], fog: '#B9C9D7', horizon: '#D6E1EA', zenith: '#557FB8', fogDen: 0.0045, exposure: 0.74, shadowRange: 30, cloud: [1, 1, 1], clouds: 0.7 },
  },
  yard: {
    ground: yardGround,
    groundMat: MAT.soil,
    outerGround: (x, z) => mc(yardGround(null, x, z, null), 0.92),
    outerH: (x, z, d) => ss(2, 18, d) * (1 + 2.5 * fbm(x * 0.05, z * 0.05, 15, 3)),
    plazaFn: yardPlaza,
    wall: yardWall, bush: yardBushCell, water: yardWater, crates: yardCrateGroup, clutter: yardClutter, pad: yardPad, home: yardHome, outer: yardOuter,
    env: { sunDir: [-0.4, 0.8, -0.42], sunCol: [2.2, 1.98, 1.62], skyCol: [0.38, 0.4, 0.44], gndCol: [0.22, 0.19, 0.15], fog: '#C2B69E', horizon: '#DDD2BA', zenith: '#6A94C4', fogDen: 0.004, exposure: 0.98, shadowRange: 30, cloud: [1, 0.96, 0.9], clouds: 0.6 },
  },
  ruins: {
    ground: jungleGround,
    groundMat: MAT.soil,
    outerGround: (x, z, y) => { const c = jungleGround(null, x, z, null); return mc(lc(c, JG.mossD, 0.25), 0.88); },
    outerH: (x, z, d) => ss(1.5, 16, d) * (2.2 + 4.5 * fbm(x * 0.045, z * 0.045, 5, 3)),
    plaza: { hw: 8, hz: 5.6, cols: JG.stone, dz: -1.5 },
    wall: jungleWall, bush: jungleBushCell, water: jungleWater, crates: jungleCrateGroup, clutter: jungleClutter, pad: junglePad, home: jungleHome, outer: jungleOuter,
    env: { sunDir: [-0.42, 0.8, -0.36], sunCol: [2.15, 1.94, 1.58], skyCol: [0.34, 0.41, 0.43], gndCol: [0.17, 0.15, 0.1], fog: '#9FAA8C', horizon: '#C3CBAE', zenith: '#5786B8', fogDen: 0.0045, exposure: 1.0, shadowRange: 30, cloud: [1, 0.95, 0.88], clouds: 0.5 },
  },
};

function crateGroups(A) {
  const seen = new Uint8Array(A.W * A.H), out = [];
  for (let i = 0; i < A.W * A.H; i++) {
    if (seen[i] || A.cells[i] !== C_CRATE) continue;
    const list = [], q = [i]; seen[i] = 1;
    while (q.length) {
      const j = q.pop(); const c = j % A.W, r = (j / A.W) | 0; list.push({ c, r });
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const c2 = c + dc, r2 = r + dr; if (c2 < 0 || r2 < 0 || c2 >= A.W || r2 >= A.H) continue; const k = r2 * A.W + c2; if (!seen[k] && A.cells[k] === C_CRATE) { seen[k] = 1; q.push(k); } }
    }
    out.push(list);
  }
  return out;
}

export function arenaMeshes(A) {
  const T = THEMES[A.theme] || THEMES.ruins;
  const F = makeFields(A);
  const K = chunker(12);
  const ctx = { A, T, F, K, M: 30, MS: 14 };
  ctx.outerY = (x, z) => { const d = Math.max(-x, x - A.wx, -z, z - A.wz); return d <= 0 ? 0 : T.outerH(x, z, d); };
  buildGround(ctx);
  if (T.plazaFn) T.plazaFn(ctx); else plaza(ctx);
  for (let r = 0; r < A.H; r++) for (let c = 0; c < A.W; c++) {
    const v = A.cells[r * A.W + c];
    if (v === C_WALL) T.wall(ctx, c, r);
    else if (v === C_WATER) T.water(ctx, c, r);
    T.clutter(ctx, c, r);
  }
  for (const g of crateGroups(A)) T.crates(ctx, g);
  for (const p of A.pads) T.pad(ctx, p);
  const hm = A.homes;
  if (hm.length) { const x = hm.reduce((s, p) => s + p.x, 0) / hm.length, z = hm.reduce((s, p) => s + p.z, 0) / hm.length; T.home(ctx, { x, z: z - 0.6 }); }
  T.outer(ctx);
  const bushes = A.clusters.map((list) => {
    const m = new MeshBuilder();
    let sx = 0, sz = 0;
    for (const { c, r } of list) { const x = (c + 0.5) * TILE, z = (r + 0.5) * TILE; T.bush(m, x, z, r * 131 + c * 17 + 5); sx += x; sz += z; }
    const cx = sx / list.length, cz = sz / list.length;
    let rad = 0; for (const { c, r } of list) rad = Math.max(rad, Math.hypot((c + 0.5) * TILE - cx, (r + 0.5) * TILE - cz));
    return { data: m.build(), bs: [cx, 0.9, cz, rad + 2], cells: list.map(({ c, r }) => r * A.W + c) };
  });
  return { parts: K.out(), bushes };
}

const lin = (h) => hexRgb(h).map((v) => v ** 2.2);
export function arenaEnv(A) {
  const T = (THEMES[A.theme] || THEMES.ruins).env;
  const s = T.sunDir, L = Math.hypot(s[0], s[1], s[2]);
  return { sunDir: [s[0] / L, s[1] / L, s[2] / L], sunCol: T.sunCol, skyCol: T.skyCol, gndCol: T.gndCol, fogCol: lin(T.fog), fogSun: hexRgb('#FFF1D8'), fogSunLin: lin('#FFF1D8'), horizon: hexRgb(T.horizon), zenith: hexRgb(T.zenith), fogDen: T.fogDen, exposure: T.exposure, shadowRange: T.shadowRange, clouds: T.clouds || 0, cloud: T.cloud, time: 0, detail: 1 };
}
