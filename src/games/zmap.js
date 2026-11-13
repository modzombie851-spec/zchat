import { MeshBuilder, hexRgb, m4 } from './race3d.js';
import { MAT as MB, hsh, sq, ball, withT, tube, cone, rot } from './siegemesh.js';
import { carMesh } from './zmesh.js';
import { TOWN, BOUNDS, HOUSES, CARS, FENCES, BARRIERS, OAKS, BARN, BALES, TENTS, CRATES, sat, ss, fade, vn, fbm, rng, inRect, roadDist, nearHouse, groundH, forestD, forestList } from './ztown.js';

export { TOWN, groundH };

const MAT = { ...MB, soil: -0.1, stone: -0.2, woodX: -0.4, woodZ: -0.45, plate: -0.5, asphalt: -0.6, leaf: -0.9 };
const C = (h) => (typeof h === 'string' ? hexRgb(h) : h);
const lc = (a, b, t) => { const A = C(a), B = C(b); return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]; };
const mc = (a, k) => { const A = C(a); return [Math.min(1, A[0] * k), Math.min(1, A[1] * k), Math.min(1, A[2] * k)]; };

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const nrm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
function pv(m, p, n, c, mt) { m.v.push(p[0], p[1], p[2], n[0], n[1], n[2], c[0], c[1], c[2], mt); }
function triC(m, a, b, c, ca, cb, cc, mt) { a = m.tp(a); b = m.tp(b); c = m.tp(c); const n = nrm(crs(sub(b, a), sub(c, a))); pv(m, a, n, ca, mt); pv(m, b, n, cb, mt); pv(m, c, n, cc, mt); }
function quadC(m, a, b, c, d, ca, cb, cc, cd, mt) { triC(m, a, b, c, ca, cb, cc, mt); triC(m, a, c, d, ca, cc, cd, mt); }
function gridC(m, nx, nz, posFn, colFn, mt) {
  const P = [], N = [], K = [];
  for (let i = 0; i <= nz; i++) { const r = [], kr = []; for (let j = 0; j <= nx; j++) { const p = posFn(j, i); r.push(p); kr.push(colFn(j, i, p)); } P.push(r); K.push(kr); }
  for (let i = 0; i <= nz; i++) { const r = []; for (let j = 0; j <= nx; j++) { const a = P[i][Math.max(0, j - 1)], b = P[i][Math.min(nx, j + 1)], c = P[Math.max(0, i - 1)][j], d = P[Math.min(nz, i + 1)][j]; r.push(nrm(crs(sub(d, c), sub(b, a)))); } N.push(r); }
  for (let i = 0; i < nz; i++) for (let j = 0; j < nx; j++) {
    const a = P[i][j], b = P[i][j + 1], c = P[i + 1][j + 1], d = P[i + 1][j];
    if (!K[i][j] || !K[i][j + 1] || !K[i + 1][j + 1] || !K[i + 1][j]) continue;
    pv(m, a, N[i][j], K[i][j], mt); pv(m, d, N[i + 1][j], K[i + 1][j], mt); pv(m, c, N[i + 1][j + 1], K[i + 1][j + 1], mt);
    pv(m, a, N[i][j], K[i][j], mt); pv(m, c, N[i + 1][j + 1], K[i + 1][j + 1], mt); pv(m, b, N[i][j + 1], K[i][j + 1], mt);
  }
}
function blockC(m, x0, y0, z0, x1, y1, z1, col, mt, o = {}) {
  const top = o.top || mc(col, 1.05), lo = o.lo || mc(col, o.ao == null ? 0.78 : o.ao), hi = o.hi || C(col);
  const A = [x0, y0, z0], B = [x1, y0, z0], Cc = [x1, y0, z1], D = [x0, y0, z1];
  const E = [x0, y1, z0], F = [x1, y1, z0], G = [x1, y1, z1], H = [x0, y1, z1];
  const sk = o.skip || '';
  if (!sk.includes('t')) quadC(m, E, H, G, F, top, top, top, top, mt);
  if (!sk.includes('s')) quadC(m, D, Cc, G, H, lo, lo, hi, hi, mt);
  if (!sk.includes('n')) quadC(m, B, A, E, F, lo, lo, hi, hi, mt);
  if (!sk.includes('e')) quadC(m, Cc, B, F, G, lo, lo, hi, hi, mt);
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
  for (let i = 0; i < rows; i++) for (let j = 0; j < seg; j++) {
    const j1 = (j + 1) % seg;
    const a = P[i][j], b = P[i + 1][j], cc = P[i + 1][j1], d = P[i][j1];
    const ca = CC[i][j], cb = CC[i + 1][j], ccc = CC[i + 1][j1], cd = CC[i][j1];
    quadC(m, a, d, cc, b, ca, cd, ccc, cb, mt);
  }
}

function blobS(m, c, r, seg, rows, jit, seed, colFn, mt = 0) {
  const P = [];
  for (let i = 0; i <= rows; i++) {
    const v = -Math.PI / 2 + (Math.PI * i) / rows, cv = Math.cos(v), sv = Math.sin(v);
    const row = [];
    for (let j = 0; j < seg; j++) {
      const u = (2 * Math.PI * j) / seg;
      const pole = i === 0 || i === rows;
      const k = 1 + jit * ((pole ? hsh(seed, i, 0) : hsh(seed, i, j)) - 0.5) * 2;
      const flat = sv < 0 ? 0.55 : 1;
      row.push([c[0] + r[0] * cv * Math.cos(u) * k, c[1] + r[1] * sv * k * flat, c[2] + r[2] * cv * Math.sin(u) * k]);
    }
    P.push(row);
  }
  const N = P.map((row, i) => row.map((p, j) => {
    const a = P[i][(j + seg - 1) % seg], b = P[i][(j + 1) % seg], cU = P[Math.min(rows, i + 1)][j], cD = P[Math.max(0, i - 1)][j];
    let n = nrm(crs(sub(cU, cD), sub(b, a)));
    const rad = nrm(sub(p, c));
    if (n[0] * rad[0] + n[1] * rad[1] + n[2] * rad[2] < 0) n = [-n[0], -n[1], -n[2]];
    return nrm([n[0] + rad[0] * 0.6, n[1] + rad[1] * 0.6, n[2] + rad[2] * 0.6]);
  }));
  const K = P.map((row, i) => row.map((p, j) => colFn((p[1] - c[1]) / r[1], hsh(seed + 7, i, j), N[i][j])));
  for (let i = 0; i < rows; i++) for (let j = 0; j < seg; j++) {
    const j1 = (j + 1) % seg;
    const tl = [P[i][j], N[i][j], K[i][j]], tr = [P[i][j1], N[i][j1], K[i][j1]], bl = [P[i + 1][j], N[i + 1][j], K[i + 1][j]], br = [P[i + 1][j1], N[i + 1][j1], K[i + 1][j1]];
    for (const t of [[tl, br, bl], [tl, tr, br]]) for (const [p, n, k] of t) pv(m, m.tp(p), m.tn(n), k, mt);
  }
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
        res.push({ data: b.build(), bs: [cx, cy, cz, Math.hypot(x1 - cx, y1 - cy, z1 - cz) + 0.3], cast: b.kind === 'props' || b.kind === 'trees' || b.kind === 'cars', kind: b.kind });
      }
      return res;
    },
  };
}

const FONT = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'], B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'], C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'], E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'], F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01111', '10000', '10000', '10011', '10001', '10001', '01111'], H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'], I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'], L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'], M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'], O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'], P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'], S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'], T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'], V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'], W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'], X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  0: ['01110', '10001', '10011', '10101', '11001', '10001', '01110'], 1: ['00100', '01100', '00100', '00100', '00100', '00100', '01110'], 2: ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  3: ['11110', '00001', '00001', '01110', '00001', '00001', '11110'], 4: ['00010', '00110', '01010', '10010', '11111', '00010', '00010'], 5: ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  6: ['00110', '01000', '10000', '11110', '10001', '10001', '01110'], 7: ['11111', '00001', '00010', '00100', '01000', '01000', '01000'], 8: ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  9: ['01110', '10001', '10001', '01111', '00001', '00010', '01100'], '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'], ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
};
function text(m, str, cx, y0, z, px, col, mt = MAT.matte, o = {}) {
  const w = str.length * 6 - 1;
  const x0 = cx - (w * px) / 2;
  const d = o.depth || px * 0.6;
  for (let k = 0; k < str.length; k++) {
    const g = FONT[str[k]] || FONT[' '];
    for (let r = 0; r < 7; r++) {
      const row = g[r];
      let c = 0;
      while (c < 5) {
        if (row[c] !== '1') { c++; continue; }
        let e = c; while (e < 5 && row[e] === '1') e++;
        m.box(x0 + (k * 6 + (c + e) / 2) * px - px / 2, y0 + (6 - r) * px, z, (e - c) * px, px, d, col, mt);
        c = e;
      }
    }
  }
}
const arcP = (cx, cy, rx, ry, a0, a1, n = 12) => { const P = []; for (let i = 0; i <= n; i++) { const a = ((a0 + (a1 - a0) * (i / n)) * Math.PI) / 180; P.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return P; };
const SF = {
  A: [[[0, 0], [2, 6], [4, 0]], [[0.75, 2.2], [3.25, 2.2]]],
  B: [[[0, 0], [0, 6], [2.5, 6], ...arcP(2.5, 4.55, 1.2, 1.45, 90, -90, 6).slice(1), [0, 3.1]], [[2.6, 3.1], ...arcP(2.6, 1.55, 1.35, 1.55, 90, -90, 6).slice(1), [0, 0]]],
  C: [arcP(2.1, 3, 2.1, 3, 48, 312, 16)],
  D: [[[0, 0], [0, 6], [1.6, 6], ...arcP(1.6, 3, 2.4, 3, 90, -90, 10).slice(1), [0, 0]]],
  E: [[[3.8, 6], [0, 6], [0, 0], [3.8, 0]], [[0, 3.1], [3, 3.1]]],
  F: [[[3.8, 6], [0, 6], [0, 0]], [[0, 3.1], [3, 3.1]]],
  G: [[...arcP(2.1, 3, 2.1, 3, 48, 330, 16), [4.1, 2.7], [2.4, 2.7]]],
  H: [[[0, 0], [0, 6]], [[4, 0], [4, 6]], [[0, 3.1], [4, 3.1]]],
  I: [[[2, 0], [2, 6]], [[1, 6], [3, 6]], [[1, 0], [3, 0]]],
  K: [[[0, 0], [0, 6]], [[3.9, 6], [0, 2.3]], [[1.35, 3.5], [4, 0]]],
  L: [[[0, 6], [0, 0], [3.7, 0]]],
  M: [[[0, 0], [0, 6], [2, 2.4], [4, 6], [4, 0]]],
  N: [[[0, 0], [0, 6], [4, 0], [4, 6]]],
  O: [arcP(2, 3, 2.05, 3, 0, 360, 20)],
  P: [[[0, 0], [0, 6], [2.4, 6], ...arcP(2.4, 4.4, 1.45, 1.6, 90, -90, 8).slice(1), [0, 2.8]]],
  R: [[[0, 0], [0, 6], [2.4, 6], ...arcP(2.4, 4.4, 1.45, 1.6, 90, -90, 8).slice(1), [0, 2.8]], [[2.1, 2.8], [4, 0]]],
  S: [[[3.7, 5.1], [3.1, 5.85], [2, 6.05], [0.9, 5.85], [0.3, 5.1], [0.45, 4.0], [1.6, 3.35], [2.9, 2.75], [3.8, 1.9], [3.75, 0.8], [3.0, 0.1], [1.9, -0.05], [0.8, 0.2], [0.15, 0.95]]],
  T: [[[0, 6], [4, 6]], [[2, 6], [2, 0]]],
  U: [[[0, 6], ...arcP(2, 2, 2, 2, 180, 360, 10), [4, 6]]],
  V: [[[0, 6], [2, 0], [4, 6]]],
  W: [[[0, 6], [1, 0], [2, 4.2], [3, 0], [4, 6]]],
  X: [[[0, 6], [4, 0]], [[0, 0], [4, 6]]],
  Y: [[[0, 6], [2, 3], [4, 6]], [[2, 3], [2, 0]]],
};
function strokeSeg(m, a, b, z, w, d, col, mat) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1e-6, nx = (-dy / L) * w * 0.5, ny = (dx / L) * w * 0.5;
  const zf = z + d * 0.5, zb = z - d * 0.5;
  const A = [a[0] + nx, a[1] + ny], B = [a[0] - nx, a[1] - ny], Cc = [b[0] - nx, b[1] - ny], D = [b[0] + nx, b[1] + ny];
  m.quad([A[0], A[1], zf], [B[0], B[1], zf], [Cc[0], Cc[1], zf], [D[0], D[1], zf], col, mat);
  m.quad([A[0], A[1], zb], [A[0], A[1], zf], [D[0], D[1], zf], [D[0], D[1], zb], col, mat);
  m.quad([B[0], B[1], zf], [B[0], B[1], zb], [Cc[0], Cc[1], zb], [Cc[0], Cc[1], zf], col, mat);
}
export function strokeText(m, str, cx, y0, z, h, col, mat = MAT.matte, o = {}) {
  const u = h / 6, w = (o.weight || 0.9) * u, d = o.depth || u * 0.45, adv = (o.adv || 5.5) * u;
  const c = C(col);
  const total = str.length * adv - (adv - 4 * u);
  let x0 = cx - total / 2;
  for (const ch of str) {
    const g = SF[ch];
    if (g) for (const line of g) {
      const P = line.map(([a, b]) => [x0 + a * u, y0 + b * u]);
      for (let i = 0; i < P.length - 1; i++) strokeSeg(m, P[i], P[i + 1], z, w, d, c, mat);
      for (const p of P) withT(m, rot(p[0], p[1], z - d * 0.5, 0, Math.PI / 2), () => m.cyl(0, 0, 0, w * 0.5, d, 10, c, mat));
    }
    x0 += adv;
  }
}

function sunLogo(m, x, y, z, r, mt = MAT.paint) {
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; const p0 = [x + Math.cos(a) * r * 0.82, y + Math.sin(a) * r * 0.82, z]; const p1 = [x + Math.cos(a) * r * 1.35, y + Math.sin(a) * r * 1.35, z]; tube(m, p0, p1, r * 0.11, r * 0.02, 5, C('#F5A623'), mt, false); }
  withT(m, rot(x, y, z, 0, Math.PI / 2), () => { m.cyl(0, 0, 0, r * 0.78, 0.06, 20, C('#F28C1E'), mt); m.cyl(0, 0.061, 0, r * 0.5, 0.01, 18, C('#FFC94A'), mt); });
}

const G = { grassA: '#5E8236', grassB: '#83983F', dry: '#A39456', dark: '#3E6028', dirt: '#7A6448', gravel: '#8C8576', forest: '#36522A' };

function grassCol(x, z) {
  const n1 = fbm(x * 0.035, z * 0.035, 11, 3), n2 = fbm(x * 0.12, z * 0.12, 12, 2), n3 = vn(x * 0.7, z * 0.7, 13);
  let c = lc(G.grassA, G.grassB, ss(0.3, 0.75, n1));
  c = lc(c, G.dry, ss(0.55, 0.85, n2) * 0.65);
  c = lc(c, G.dark, ss(0.6, 0.9, 1 - n1) * 0.35);
  return mc(c, 0.92 + n3 * 0.14);
}
function groundCol(x, z, y) {
  let c = grassCol(x, z);
  const rd = roadDist(x, z);
  c = lc(c, G.gravel, ss(2.2, 0.4, rd) * 0.9);
  c = lc(c, G.dirt, ss(4.5, 1.6, rd) * 0.45 * fbm(x * 0.3, z * 0.3, 21, 2));
  if (inRect(x, z, TOWN.lot, 2.5)) c = lc(c, G.dirt, 0.4);
  const fd = forestD(x, z);
  c = lc(c, lc(G.forest, '#5A4A32', 0.3), ss(0.25, 0.75, fd) * 0.75);
  const far = ss(220, 520, Math.hypot(x, z));
  c = lc(c, '#56703A', far * 0.6);
  if (y > 40) c = lc(c, '#6C7A4E', ss(40, 90, y) * 0.4);
  return c;
}
function buildTerrain(ctx) {
  const { K } = ctx;
  const N = 150, R = 900;
  const warp = (u) => Math.sign(u) * (Math.pow(Math.abs(u), 2.6) * 0.86 + Math.abs(u) * 0.14) * R;
  for (let ci = 0; ci < 10; ci++) for (let cj = 0; cj < 10; cj++) {
    const i0 = (ci * N) / 10, j0 = (cj * N) / 10, n = N / 10;
    const cxm = warp(-1 + ((j0 + n / 2) / N) * 2), czm = warp(-1 + ((i0 + n / 2) / N) * 2);
    const m = K.m('ground', cxm, czm);
    gridC(m, n, n, (j, i) => { const x = warp(-1 + ((j0 + j) / N) * 2), z = warp(-1 + ((i0 + i) / N) * 2); return [x, groundH(x, z), z]; }, (j, i, p) => groundCol(p[0], p[2], p[1]), MAT.soil);
  }
}

function buildRoads(ctx) {
  const { K } = ctx;
  const R = rng(77);
  const W = TOWN.roadW;
  const asph = (x, z) => { const n = fbm(x * 0.08, z * 0.5, 61, 2), t = Math.abs(Math.abs(z) - 1.9); return mc(lc('#4A4A4C', '#3A3B3E', n), 0.92 + ss(0.9, 0, t) * -0.08 + vn(x * 0.9, z * 2.3, 62) * 0.1); };
  const crown = (z) => 0.05 + 0.06 * (1 - (z / W) * (z / W));
  for (let x0 = -320; x0 < 320; x0 += 16) {
    const m = K.m('road', x0 + 8, 0);
    gridC(m, 8, 8, (j, i) => { const x = x0 + j * 2, z = -W + (i / 8) * 2 * W; return [x, crown(z), z]; }, (j, i, p) => asph(p[0], p[2]), MAT.asphalt);
    for (const sz of [-1, 1]) gridC(m, 8, 1, (j, i) => { const x = x0 + j * 2, z = sz * (W + i * 1.3); return [x, 0.045 - i * 0.03, z]; }, (j, i, p) => mc(G.gravel, 0.85 + vn(p[0] * 1.3, p[2] * 2, 64) * 0.25), MAT.stone);
  }
  const SX = TOWN.sideX, SW = TOWN.sideW;
  for (let z0 = -W; z0 > -230; z0 -= 16) {
    const m = K.m('road', SX, z0 - 8);
    gridC(m, 4, 8, (j, i) => { const x = SX - SW + (j / 4) * 2 * SW, z = z0 - i * 2; return [x, groundH(x, z) + 0.06 + 0.04 * (1 - ((x - SX) / SW) ** 2), z]; }, (j, i, p) => mc(asph(p[2], p[0] - SX), 1.04), MAT.asphalt);
  }
  const mk = K.m('marks', 0, 0);
  for (let x = -316; x < 316; x += 12) {
    if (x > SX - 6 && x < SX + 6) continue;
    const fadeK = 0.55 + hsh(x | 0, 5) * 0.35;
    const col = lc('#4A4A4C', '#E8B830', fadeK);
    const len = 3 + (hsh(x | 0, 6) > 0.85 ? -1.2 : 0);
    mk.quad([x, crown(0) + 0.006, -0.08], [x, crown(0) + 0.006, 0.08], [x + len, crown(0) + 0.006, 0.08], [x + len, crown(0) + 0.006, -0.08], col, MAT.matte);
  }
  for (const sz of [-1, 1]) for (let x = -316; x < 316; x += 4) {
    if (sz < 0 && x > SX - SW - 4 && x < SX + SW) continue;
    if (sz < 0 && x > -20 && x < -8) continue;
    if (sz < 0 && x > 8 && x < 20) continue;
    if (hsh(x | 0, sz + 9) < 0.12) continue;
    const k = 0.6 + hsh(x | 0, sz + 3) * 0.35, z = sz * (W - 0.32);
    const col = lc('#4A4A4C', '#E8E6DC', k), y = crown(z) + 0.006;
    mk.quad([x, y, z - 0.07], [x, y, z + 0.07], [x + 4, y, z + 0.07], [x + 4, y, z - 0.07], col, MAT.matte);
  }
  for (let i = 0; i < 260; i++) {
    const x = (R() - 0.5) * 520, z = (R() - 0.5) * 2 * (W - 0.4);
    const a = R() * Math.PI, L = 0.4 + R() * 2.2, w = 0.03 + R() * 0.04, y = crown(z) + 0.004;
    const dx = Math.cos(a) * L / 2, dz = Math.sin(a) * L / 2 * 0.4, nx = -Math.sin(a) * w, nz = Math.cos(a) * w;
    const m = K.m('marks', x, z);
    m.quad([x - dx - nx, y, z - dz - nz], [x - dx + nx, y, z - dz + nz], [x + dx + nx, y, z + dz + nz], [x + dx - nx, y, z + dz - nz], C('#2A2A2C'), MAT.matte);
  }
  for (let i = 0; i < 46; i++) {
    const x = (R() - 0.5) * 520, z = (R() - 0.5) * 2 * (W - 1.2), w = 0.8 + R() * 2.4, d = 0.6 + R() * 1.6, y = crown(z) + 0.003;
    const m = K.m('marks', x, z);
    m.quad([x - w, y, z - d], [x - w, y, z + d], [x + w, y, z + d], [x + w, y, z - d], mc(lc('#3A3A3C', '#555558', R()), 1), MAT.asphalt);
  }
}

function buildLot(ctx) {
  const { K } = ctx;
  const [x0, z0, x1, z1] = TOWN.lot;
  const R = rng(91);
  for (let x = x0; x < x1; x += 4) for (let z = z0; z < z1; z += 4) {
    const m = K.m('road', x, z);
    const k = 0.88 + hsh(x | 0, z | 0, 3) * 0.16;
    const col = mc(lc('#A9A498', '#958F82', hsh(x | 0, z | 0, 4)), k);
    const xe = Math.min(x + 4, x1), ze = Math.min(z + 4, z1);
    m.quad([x + 0.03, 0.08, z + 0.03], [x + 0.03, 0.08, ze - 0.03], [xe - 0.03, 0.08, ze - 0.03], [xe - 0.03, 0.08, z + 0.03], col, MAT.stone);
  }
  const jm = K.m('marks', 0, -26);
  jm.quad([x0, 0.065, z0], [x0, 0.065, z1], [x1, 0.065, z1], [x1, 0.065, z0], C('#5E5A52'), MAT.matte);
  for (let i = 0; i < 26; i++) {
    const x = -10 + R() * 20, z = -24 + R() * 15, r = 0.3 + R() * 0.9;
    const m = K.m('marks', x, z);
    const n = 9, c = lc('#3A3632', '#4A4640', R());
    for (let k = 0; k < n; k++) { const a0 = (k / n) * Math.PI * 2, a1 = ((k + 1) / n) * Math.PI * 2; const r0 = r * (0.7 + hsh(i, k) * 0.5), r1 = r * (0.7 + hsh(i, k + 1) * 0.5); m.tri([x, 0.083, z], [x + Math.cos(a1) * r1, 0.083, z + Math.sin(a1) * r1], [x + Math.cos(a0) * r0, 0.083, z + Math.sin(a0) * r0], c, MAT.matte); }
  }
  for (let i = -5; i <= 5; i++) { const x = i * 2.6; const m = K.m('marks', x, -30); m.quad([x - 0.06, 0.084, -33.4], [x - 0.06, 0.084, -28.4], [x + 0.06, 0.084, -28.4], [x + 0.06, 0.084, -33.4], C('#E2DED0'), MAT.matte); }
  const curb = (ax, az, bx, bz) => { const m = K.m('props', (ax + bx) / 2, (az + bz) / 2); blockC(m, Math.min(ax, bx) - 0.12, 0.0, Math.min(az, bz) - 0.12, Math.max(ax, bx) + 0.12, 0.2, Math.max(az, bz) + 0.12, C('#B8B2A4'), MAT.stone); };
  curb(x0, z1, -20, z1); curb(-8, z1, 8, z1); curb(20, z1, x1, z1);
  curb(x0, z0, x0, z1); curb(x1, z0, x1, -14);
}

function pump(m, x, z, yaw, o = {}) {
  withT(m, rot(x, 0.26, z, yaw), () => {
    blockC(m, -0.5, 0, -0.26, 0.5, 0.12, 0.26, C('#5A5650'), MAT.stone);
    blockC(m, -0.46, 0.12, -0.24, 0.46, 1.62, 0.24, C(o.body || '#ECEAE2'), MAT.trim, { ao: 0.86 });
    blockC(m, -0.47, 1.62, -0.25, 0.47, 1.98, 0.25, C(o.top || '#E8622A'), MAT.paint);
    for (const s of [-1, 1]) {
      m.box(0, 1.1, s * 0.245, 0.62, 0.36, 0.01, C('#1C2228'), MAT.glass);
      for (let i = 0; i < 3; i++) m.box(-0.18 + i * 0.18, 1.18, s * 0.252, 0.12, 0.07, 0.004, C(o.glow || '#FFB347'), MAT.glow);
      m.box(0, 0.8, s * 0.246, 0.5, 0.18, 0.01, C('#3A3E44'), MAT.trim);
      for (let i = 0; i < 4; i++) m.box(-0.15 + i * 0.1, 0.8, s * 0.252, 0.06, 0.06, 0.008, C('#D0D2D4'), MAT.plastic);
      m.box(0, 1.78, s * 0.252, 0.7, 0.19, 0.006, C('#FFFFFF'), MAT.flat);
      withT(m, rot(0, 0, s * 0.258, s < 0 ? Math.PI : 0), () => strokeText(m, 'GAS', 0, 1.815, 0, 0.12, C('#E8622A'), MAT.flat, { depth: 0.006, weight: 1.1 }));
      for (const sx of [-1, 1]) {
        m.box(sx * 0.53, 0.95, s * 0.12, 0.08, 0.22, 0.08, C('#2A2C30'), MAT.trim);
        const h0 = [sx * 0.55, 0.95, s * 0.12];
        tube(m, h0, [sx * 0.62, 0.55, s * 0.22], 0.025, 0.025, 6, C('#1A1A1C'), MAT.plastic, false);
        tube(m, [sx * 0.62, 0.55, s * 0.22], [sx * 0.52, 0.25, s * 0.18], 0.025, 0.025, 6, C('#1A1A1C'), MAT.plastic, false);
      }
    }
  });
}

function buildStation(ctx) {
  const { K } = ctx;
  const P = K.m('props', 0, -17), Gl = K.m('glow', 0, -17);
  for (const iz of [-14, -20]) {
    blockC(P, -7.5, 0.08, iz - 0.7, 7.5, 0.26, iz + 0.7, C('#B4AEA0'), MAT.stone);
    for (const ex of [-7.5, 7.5]) for (let k = 0; k < 4; k++) blockC(P, ex - 0.04 + (ex < 0 ? -0.02 : 0.02), 0.08 + k * 0.045, iz - 0.71, ex + 0.04 + (ex < 0 ? -0.02 : 0.02), 0.08 + (k + 1) * 0.045, iz + 0.71, C(k % 2 ? '#1E1E1E' : '#F2C230'), MAT.paint);
    for (const px of [-4, 4]) pump(P, px, iz, 0, { top: '#E8622A' });
    for (const bx of [-7.1, 7.1]) { tube(P, [bx, 0.26, iz], [bx, 1.3, iz], 0.09, 0.09, 10, C('#F2C230'), MAT.paint, true); for (let k = 0; k < 3; k++) P.smoothCyl(bx, 0.45 + k * 0.32, iz, 0.093, 0.1, 10, C('#1E1E1E'), MAT.paint, { cap: false }); }
    blockC(P, -0.35, 0.26, iz - 0.35, 0.35, 5.0, iz + 0.35, C('#E6E2D8'), MAT.trim, { ao: 0.8 });
    blockC(P, -0.37, 0.26, iz - 0.37, 0.37, 1.0, iz + 0.37, C('#3A3A3C'), MAT.trim);
    P.box(0.0, 1.1, iz + 0.42, 0.2, 0.42, 0.14, C('#C8262A'), MAT.paint);
    P.box(-1.6, 0.26, iz, 0.42, 0.75, 0.42, C('#4E5A64'), MAT.plastic);
    P.box(1.7, 0.26, iz + 0.2, 0.3, 0.4, 0.3, C('#2E6EA8'), MAT.plastic);
  }
  const [cx0, cz0, cx1, cz1] = TOWN.canopy;
  blockC(P, cx0, 5.0, cz0, cx1, 5.95, cz1, C('#F0EEE8'), MAT.trim, { ao: 0.95 });
  for (const s of [cz1 + 0.01, cz0 - 0.01]) { P.box(0, 5.32, s, cx1 - cx0 + 0.02, 0.32, 0.02, C('#E8622A'), MAT.paint); P.box(0, 5.68, s, cx1 - cx0 + 0.02, 0.1, 0.02, C('#F5A623'), MAT.paint); }
  for (const s of [cx0 - 0.01, cx1 + 0.01]) { P.box(s, 5.32, (cz0 + cz1) / 2, 0.02, 0.32, cz1 - cz0, C('#E8622A'), MAT.paint); P.box(s, 5.68, (cz0 + cz1) / 2, 0.02, 0.1, cz1 - cz0, C('#F5A623'), MAT.paint); }
  P.box(0, 5.05, cz1 + 0.03, 9.8, 0.85, 0.02, C('#F7F4EC'), MAT.flat);
  strokeText(P, 'SUNNY GAS', 0.9, 5.17, cz1 + 0.07, 0.56, C('#D9531E'), MAT.paint, { depth: 0.05, weight: 1.15 });
  sunLogo(P, -4.2, 5.47, cz1 + 0.07, 0.3);
  for (let i = 0; i < 22; i++) { const x = cx0 + 0.5 + hsh(i, 2) * (cx1 - cx0 - 1.0); if (Math.abs(x) < 5) continue; P.box(x, 5.0, cz1 + 0.015, 0.03 + hsh(i, 5) * 0.03, 0.12 + hsh(i, 4) * 0.2, 0.01, C('#9A8E7C'), MAT.matte); }
  for (let ix = 0; ix < 5; ix++) for (let iz = 0; iz < 3; iz++) {
    const x = cx0 + 2.4 + ix * ((cx1 - cx0 - 4.8) / 4), z = cz0 + 2.5 + iz * ((cz1 - cz0 - 5) / 2);
    const on = hsh(ix, iz, 5) > 0.3;
    Gl.box(x, 4.97, z, 1.1, 0.03, 0.55, on ? C('#FFF4D8') : C('#6A6A6A'), on ? MAT.glow : MAT.matte);
  }
  const [sx0, sz0, sx1, sz1] = TOWN.store;
  const S = K.m('props', 0, -40);
  const wall = C('#DCCFB2'), base = C('#8A7E6A');
  blockC(S, sx0, 0.08, sz0, sx1, 4.4, sz1, wall, MAT.stone, { skip: 's', ao: 0.82 });
  blockC(S, sx0 - 0.05, 0.08, sz0 - 0.05, sx1 + 0.05, 0.7, sz0 + 0.05, base, MAT.stone, { skip: 'ts' });
  blockC(S, sx0, 4.4, sz1 - 0.3, sx1, 5.3, sz1 + 0.05, C('#E8E2D2'), MAT.stone);
  blockC(S, sx0 - 0.05, 5.3, sz1 - 0.35, sx1 + 0.05, 5.42, sz1 + 0.1, C('#7A7468'), MAT.trim);
  S.box(0, 4.5, sz1 + 0.07, 12.8, 0.72, 0.03, C('#F8F5EE'), MAT.flat);
  strokeText(S, 'MARKET', 0, 4.6, sz1 + 0.12, 0.52, C('#C8302A'), MAT.paint, { depth: 0.05, weight: 1.15 });
  const front = sz1;
  const winY0 = 0.62, winY1 = 2.95;
  S.quad([sx0, 0.08, front], [sx1, 0.08, front], [sx1, winY0, front], [sx0, winY0, front], base, MAT.stone);
  S.quad([sx0, winY1, front], [sx1, winY1, front], [sx1, 4.4, front], [sx0, 4.4, front], wall, MAT.stone);
  const panes = [];
  for (let i = 0; i < 6; i++) { const x0 = -13.6 + i * 2.05; panes.push([x0, x0 + 1.95]); }
  for (let i = 0; i < 6; i++) { const x0 = 1.7 + i * 2.05; panes.push([x0, x0 + 1.95]); }
  panes.forEach(([a, b], i) => {
    const board = (i === 2 || i === 3 || i === 9) ;
    S.quad([a, winY0, front + 0.01], [b, winY0, front + 0.01], [b, winY1, front + 0.01], [a, winY1, front + 0.01], board ? C('#20262C') : C('#3B5262'), MAT.glass);
    blockC(S, a - 0.06, winY0 - 0.02, front - 0.02, a + 0.02, winY1 + 0.02, front + 0.08, C('#3A3A3E'), MAT.trim);
    if (i % 3 === 0 && !board) { const c = ['#E8B82E', '#3E8AC8', '#D8462E'][i % 3 === 0 ? (i / 3) % 3 : 0]; S.box(a + 0.55, 1.6, front + 0.03, 0.7, 0.9, 0.01, C(c), MAT.matte); S.box(a + 0.55, 1.8, front + 0.035, 0.5, 0.12, 0.008, C('#FFFFFF'), MAT.matte); }
    if (board) for (let k = 0; k < 4; k++) { const y = 0.9 + k * 0.55 + hsh(i, k) * 0.1; withT(S, rot((a + b) / 2, y, front + 0.1, 0, 0, (hsh(i, k, 3) - 0.5) * 0.3), () => blockC(S, -1.15, -0.11, -0.02, 1.15, 0.11, 0.03, lc('#8A6A4A', '#A88A62', hsh(i, k, 4)), MAT.woodX)); }
  });
  for (const [qa, qb] of [[sx0, -13.66], [13.9, sx1], [-1.45, -1.3], [1.3, 1.7]]) S.quad([qa, winY0, front], [qb, winY0, front], [qb, winY1, front], [qa, winY1, front], wall, MAT.stone);
  S.quad([-1.3, 2.6, front], [1.3, 2.6, front], [1.3, winY1, front], [-1.3, winY1, front], wall, MAT.stone);
  S.quad([-1.3, 0.08, front], [-1.3, winY0, front], [-1.3, winY0, front], [-1.3, 0.08, front], wall, MAT.stone);
  blockC(S, 13.86, winY0 - 0.02, front - 0.02, 13.94, winY1 + 0.02, front + 0.08, C('#3A3A3E'), MAT.trim);
  blockC(S, sx0, winY1, front - 0.02, sx1, winY1 + 0.08, front + 0.08, C('#3A3A3E'), MAT.trim);
  S.quad([-1.3, 0.08, front + 0.012], [1.3, 0.08, front + 0.012], [1.3, 2.55, front + 0.012], [-1.3, 2.55, front + 0.012], C('#2A3A44'), MAT.glass);
  blockC(S, -1.35, 0.08, front, 1.35, 2.6, front + 0.06, C('#3A3A3E'), MAT.trim, { skip: 's' });
  for (let k = 0; k < 3; k++) withT(S, rot(0, 0.7 + k * 0.6, front + 0.16, 0, 0, k === 1 ? 0.5 : -0.5), () => blockC(S, -1.4, -0.1, -0.03, 1.4, 0.1, 0.03, lc('#7E6044', '#9C7C58', hsh(k, 7)), MAT.woodX));
  Gl.box(-6.5, 1.95, front + 0.03, 1.0, 0.36, 0.02, C('#FF3B30'), MAT.glow);
  strokeText(Gl, 'OPEN', -6.5, 1.84, front + 0.05, 0.2, C('#FF5A44'), MAT.glow, { depth: 0.012, weight: 0.7 });
  blockC(S, sx0 + 0.6, 3.05, front, sx1 - 0.6, 3.2, front + 1.8, C('#5A5650'), MAT.trim);
  S.box(0, 3.2, front + 1.75, sx1 - sx0 - 1.2, 0.18, 0.06, C('#C8302A'), MAT.paint);
  for (let i = 0; i < 8; i++) Gl.box(sx0 + 2 + i * 3.7, 3.03, front + 1.0, 0.6, 0.02, 0.2, i === 3 ? C('#4A4A4A') : C('#FFF0D0'), i === 3 ? MAT.matte : MAT.glow);
  blockC(S, -11.8, 0.08, front + 0.3, -9.6, 1.25, front + 1.2, C('#F2F2F0'), MAT.plastic);
  S.box(-10.7, 0.62, front + 1.21, 1.6, 0.4, 0.01, C('#2E78C8'), MAT.flat);
  strokeText(S, 'ICE', -10.7, 0.68, front + 1.225, 0.26, C('#FFFFFF'), MAT.flat, { depth: 0.008, weight: 1.1 });
  for (const gx of [9.4, 11.4]) { for (const gz of [0.35, 1.25]) tube(S, [gx, 0.08, front + gz], [gx, 1.8, front + gz], 0.025, 0.025, 6, C('#7A7E84'), MAT.metal, false); }
  for (let k = 0; k < 4; k++) { const y = 0.3 + k * 0.45; S.box(10.4, y, front + 0.35, 2.0, 0.025, 0.025, C('#7A7E84'), MAT.metal); S.box(10.4, y, front + 1.25, 2.0, 0.025, 0.025, C('#7A7E84'), MAT.metal); }
  for (let i = 0; i < 4; i++) { const x = 9.8 + (i % 2) * 0.8, z = front + 0.55 + Math.floor(i / 2) * 0.45; S.smoothCyl(x, 0.1, z, 0.17, 0.62, 12, C('#E8E8E2'), MAT.paint); ball(S, x, 0.75, z, 0.1, C('#C8C8C2'), MAT.metal, 8); }
  for (const [ax, az, w, d, h] of [[-8, sz0 + 3, 2.2, 1.4, 0.9], [6, sz0 + 4, 1.6, 1.2, 0.7], [-2, sz0 + 6, 1.4, 1.4, 1.2]]) { blockC(S, ax, 4.4, az, ax + w, 4.4 + h, az + d, C('#9A9C9E'), MAT.metal); S.cyl(ax + w / 2, 4.4 + h, az + d / 2, Math.min(w, d) * 0.32, 0.04, 14, C('#3A3C40'), MAT.trim); }
  for (let i = 0; i < 9; i++) { const y = 0.4 + i * 0.45; S.box(sx1 + 0.1, y, sz0 + 2, 0.04, 0.04, 0.5, C('#7A7E84'), MAT.metal); }
  for (const z of [sz0 + 1.75, sz0 + 2.25]) tube(S, [sx1 + 0.1, 0.08, z], [sx1 + 0.1, 5.2, z], 0.025, 0.025, 6, C('#7A7E84'), MAT.metal, false);
  const D = K.m('props', 20, -42);
  const dg = C('#2E5E42');
  blockC(D, 18.5, 0.22, -44, 21.5, 1.45, -41.8, dg, MAT.paint, { ao: 0.62 });
  for (let i = 0; i < 6; i++) { const x = 18.75 + i * 0.5; for (const zf of [-41.76, -44.04]) D.box(x, 0.24, zf, 0.09, 1.18, 0.06, mc(dg, 0.82), MAT.paint); }
  for (const zf of [-41.74, -44.06]) D.box(20, 1.3, zf, 3.04, 0.1, 0.07, mc(dg, 0.75), MAT.paint);
  for (const xs of [18.44, 21.56]) { D.box(xs, 0.7, -42.9, 0.06, 0.28, 1.2, C('#1E2A22'), MAT.trim); D.box(xs, 0.35, -42.9, 0.05, 0.1, 1.9, mc(dg, 0.7), MAT.paint); }
  withT(D, rot(19.25, 1.47, -44.0, 0, -0.08), () => blockC(D, -0.74, 0, 0, 0.74, 0.05, 2.25, C('#1E1F22'), MAT.plastic));
  withT(D, rot(20.75, 1.47, -44.0, 0, -0.62), () => blockC(D, -0.74, 0, 0, 0.74, 0.05, 2.25, C('#1E1F22'), MAT.plastic));
  for (let i = 0; i < 9; i++) { const x = 18.7 + hsh(i, 41) * 2.6; D.box(x, 0.3 + hsh(i, 42) * 0.4, -41.73, 0.05 + hsh(i, 43) * 0.06, 0.25 + hsh(i, 44) * 0.6, 0.008, C(i % 3 ? '#6A4A2E' : '#4A3A28'), MAT.matte); }
  for (const [wx, wz] of [[18.8, -42.1], [21.2, -42.1], [18.8, -43.7], [21.2, -43.7]]) { D.smoothCyl(wx, 0.08, wz, 0.07, 0.14, 10, C('#1A1A1C'), MAT.matte); }
  for (let i = 0; i < 5; i++) sq(D, 18.9 + i * 0.5 + hsh(i, 51) * 0.2, 1.55 + hsh(i, 52) * 0.08, -43.0 + hsh(i, 53) * 0.8, 0.22, 0.16, 0.2, 0.9, 0.9, C(i % 2 ? '#2A2A2C' : '#3E4A3A'), MAT.plastic, 10, 6);
  const ps = K.m('props', 25, -8);
  for (const px of [23.8, 26.2]) blockC(ps, px - 0.16, 0.0, -8.16, px + 0.16, 9.2, -7.84, C('#7A7E84'), MAT.metal);
  blockC(ps, 22.6, 7.0, -8.35, 27.4, 9.8, -7.65, C('#F6F3EA'), MAT.trim);
  for (const s of [-7.64, -8.36]) { ps.box(25, 7.0, s, 4.8, 0.28, 0.02, C('#E8622A'), MAT.paint); sunLogo(ps, 25, 8.68, s < -8 ? s - 0.04 : s + 0.04, 0.42); }
  const sgn = (s) => (s < -8 ? -1 : 1);
  for (const s of [-7.64, -8.36]) withT(ps, rot(25, 7.4, s + sgn(s) * 0.03, s < -8 ? Math.PI : 0), () => strokeText(ps, 'SUNNY', 0, 0, 0, 0.62, C('#D9531E'), MAT.paint, { depth: 0.04, weight: 1.15 }));
  blockC(ps, 23.0, 4.6, -8.3, 27.0, 6.8, -7.7, C('#2A2C30'), MAT.trim);
  for (const s of [-7.69, -8.31]) {
    const fz = s < -8 ? s - 0.02 : s + 0.02;
    withT(ps, rot(25, 0, fz, s < -8 ? Math.PI : 0), () => {
      strokeText(ps, 'REG', -1.05, 5.76, 0, 0.36, C('#F2F0E6'), MAT.flat, { depth: 0.01 });
      strokeText(ps, 'DSL', -1.05, 4.91, 0, 0.36, C('#F2F0E6'), MAT.flat, { depth: 0.01 });
    });
    withT(Gl, rot(25, 0, fz, s < -8 ? Math.PI : 0), () => { text(Gl, '3.49', 0.75, 5.72, 0, 0.07, C('#FF6A2A'), MAT.glow, { depth: 0.01 }); text(Gl, '3.89', 0.75, 4.87, 0, 0.07, C('#FF6A2A'), MAT.glow, { depth: 0.01 }); });
  }
  for (const [lx, lz] of [[-24, -6.5], [28.5, -30], [-24, -46]]) {
    const L = K.m('props', lx, lz);
    tube(L, [lx, 0, lz], [lx, 7.4, lz], 0.1, 0.07, 8, C('#6E7278'), MAT.metal, true);
    tube(L, [lx, 7.3, lz], [lx + (lx < 0 ? 1.6 : -1.6), 7.6, lz], 0.05, 0.05, 6, C('#6E7278'), MAT.metal, false);
    L.box(lx + (lx < 0 ? 1.8 : -1.8), 7.45, lz, 0.7, 0.18, 0.32, C('#4E5258'), MAT.metal);
    Gl.box(lx + (lx < 0 ? 1.8 : -1.8), 7.42, lz, 0.55, 0.02, 0.24, C('#FFE9C0'), MAT.glow);
  }
}

function houseMesh(m, h) {
  const R = rng(h.seed * 31 + 7);
  const wall = C(h.col), trim = C(h.trim), roof = C(h.roof);
  const W = 5, D = 4.2, H = 3.1;
  for (let k = 0; k < 13; k++) { const y0 = 0.5 + k * ((H - 0.5) / 13), y1 = y0 + (H - 0.5) / 13; const c = mc(wall, 0.94 + (k % 2) * 0.04 + R() * 0.03); blockC(m, -W, y0, -D, W, y1, D, c, MAT.trim, { skip: 'tb', ao: 0.9, lo: mc(c, 0.86), hi: c }); }
  blockC(m, -W - 0.05, 0.0, -D - 0.05, W + 0.05, 0.5, D + 0.05, C('#8E8A84'), MAT.stone);
  const ry = H, rh = 2.3, ov = 0.45;
  const roofC = (k) => mc(roof, 0.86 + hsh(h.seed, k) * 0.2);
  for (const sz of [-1, 1]) {
    for (let k = 0; k < 8; k++) {
      const t0 = k / 8, t1 = (k + 1) / 8;
      const za = sz * (D + ov) * (1 - t0), zb = sz * (D + ov) * (1 - t1), ya = ry - 0.25 + rh * t0 + 0.25 * (1 - t0) * 0, yb = ry - 0.25 + rh * t1;
      const c = roofC(k + (sz > 0 ? 10 : 0));
      if (sz > 0) quadC(m, [-W - ov, ya, za], [W + ov, ya, za], [W + ov, yb, zb], [-W - ov, yb, zb], c, c, c, c, MAT.matte);
      else quadC(m, [W + ov, ya, za], [-W - ov, ya, za], [-W - ov, yb, zb], [W + ov, yb, zb], c, c, c, c, MAT.matte);
      if (sz > 0) quadC(m, [-W - ov, ya - 0.05, za], [-W - ov, yb - 0.05, zb], [W + ov, yb - 0.05, zb], [W + ov, ya - 0.05, za], mc(roof, 0.5), mc(roof, 0.5), mc(roof, 0.5), mc(roof, 0.5), MAT.matte);
      else quadC(m, [W + ov, ya - 0.05, za], [W + ov, yb - 0.05, zb], [-W - ov, yb - 0.05, zb], [-W - ov, ya - 0.05, za], mc(roof, 0.5), mc(roof, 0.5), mc(roof, 0.5), mc(roof, 0.5), MAT.matte);
    }
    m.box(0, ry - 0.3, sz * (D + ov - 0.04), 2 * (W + ov), 0.1, 0.1, trim, MAT.trim);
  }
  for (const sx of [-1, 1]) { const x = sx * W; triC(m, [x, ry, -D], [x, ry - 0.3 + rh, 0], [x, ry, D], wall, wall, wall, MAT.trim); triC(m, [x, ry, D], [x, ry - 0.3 + rh, 0], [x, ry, -D], wall, wall, wall, MAT.trim); }
  m.box(0, ry - 0.31 + rh, 0, 2 * (W + ov) + 0.05, 0.1, 0.22, mc(roof, 0.7), MAT.matte);
  const chim = [W * 0.55, D * 0.35];
  blockC(m, chim[0] - 0.4, ry, chim[1] - 0.4, chim[0] + 0.4, ry + rh + 1.1, chim[1] + 0.4, C('#8E4A3A'), MAT.stone);
  const win = (x, y, z, w, hh, face, boarded) => {
    const fz = face * (D + 0.03);
    m.box(x, y - 0.06, fz, w + 0.25, hh + 0.2, 0.06, trim, MAT.trim);
    m.box(x, y, fz + face * 0.02, w, hh, 0.02, boarded ? C('#1A1E22') : C('#3A4E5C'), MAT.glass);
    m.box(x, y, fz + face * 0.035, 0.05, hh, 0.02, trim, MAT.trim);
    m.box(x, y + hh / 2, fz + face * 0.035, w, 0.05, 0.02, trim, MAT.trim);
    for (const s of [-1, 1]) m.box(x + s * (w / 2 + 0.25), y, fz + face * 0.03, 0.35, hh + 0.1, 0.04, mc(h.shutter || '#3E5A6E', 1), MAT.matte);
    if (boarded) for (let k = 0; k < 3; k++) withT(m, rot(x, y + 0.25 + k * 0.4, fz + face * 0.09, 0, 0, (hsh(x | 0, k) - 0.5) * 0.5), () => blockC(m, -w / 2 - 0.2, -0.09, -0.02, w / 2 + 0.2, 0.09, 0.03, lc('#8A6A4A', '#A88A62', hsh(k, x | 0)), MAT.woodX));
  };
  win(-2.8, 1.2, 0, 1.2, 1.3, 1, h.boarded);
  win(2.8, 1.2, 0, 1.2, 1.3, 1, false);
  win(-2.2, 1.2, 0, 1.2, 1.3, -1, false);
  win(2.6, 1.2, 0, 1.2, 1.3, -1, h.boarded);
  m.box(0, 0.5, D + 0.04, 1.0, 2.1, 0.06, C(h.door || '#6A3A2A'), MAT.trim);
  m.box(0.35, 1.5, D + 0.08, 0.06, 0.06, 0.04, C('#C8A862'), MAT.metal);
  blockC(m, -2.0, 0.0, D, 2.0, 0.42, D + 2.0, C('#8A7A66'), MAT.woodX);
  for (const px of [-1.9, 1.9]) tube(m, [px, 0.42, D + 1.85], [px, ry - 0.3, D + 1.85], 0.07, 0.07, 8, trim, MAT.trim, true);
  blockC(m, -2.2, ry - 0.42, D, 2.2, ry - 0.3, D + 2.1, trim, MAT.trim);
  for (let k = 0; k < 3; k++) blockC(m, -0.7, 0.14 * k, D + 2.0 + (2 - k) * 0.3, 0.7, 0.14 * (k + 1), D + 2.3 + (2 - k) * 0.3, C('#7A6A58'), MAT.woodX);
  for (const px of [-1.9, 1.9]) { for (let k = 0; k < 9; k++) m.box(px, 0.42, D + 0.25 + k * 0.2, 0.04, 0.85, 0.04, trim, MAT.trim); m.box(px, 1.24, D + 1.05, 0.07, 0.06, 1.7, trim, MAT.trim); }
  if (h.garage) { blockC(m, W, 0.0, -D + 0.5, W + 4.5, 2.9, D - 0.4, mc(wall, 0.96), MAT.trim); m.box(W + 2.25, 0.0, D - 0.36, 3.2, 2.4, 0.06, C('#ECEAE4'), MAT.trim); for (let k = 0; k < 5; k++) m.box(W + 2.25, 0.45 + k * 0.48, D - 0.32, 3.1, 0.03, 0.04, C('#C8C6C0'), MAT.trim); blockC(m, W - 0.2, 2.9, -D + 0.3, W + 4.7, 3.1, D - 0.2, mc(roof, 0.9), MAT.matte); }
}

function buildHouses(ctx) {
  const { K } = ctx;
  for (const h of HOUSES) {
    const m = K.m('props', h.x, h.z);
    withT(m, rot(h.x, groundH(h.x, h.z), h.z, h.yaw), () => {
      houseMesh(m, h);
      for (let i = 0; i < 18; i++) { const x = -9 + i * 1.0; if (x > -1.2 && x < 1.2) continue; m.box(x, 0, 10.5, 0.1, 0.95, 0.06, C('#EEECE4'), MAT.trim); }
      for (const y of [0.35, 0.75]) { m.box(-5.1, y, 10.5, 7.8, 0.08, 0.04, C('#EEECE4'), MAT.trim); m.box(5.1, y, 10.5, 7.8, 0.08, 0.04, C('#EEECE4'), MAT.trim); }
      tube(m, [3, 0, 11.6], [3, 1.05, 11.6], 0.05, 0.05, 6, C('#6A5A4A'), MAT.matte, true);
      m.box(3, 1.05, 11.6, 0.26, 0.3, 0.5, C('#3A5A7A'), MAT.paint);
    });
  }
}

function utilityPoles(ctx) {
  const { K } = ctx;
  const z = 6.8, xs = [];
  for (let x = -300; x <= 300; x += 34) xs.push(x + (hsh(x | 0, 2) - 0.5) * 3);
  const tops = [];
  xs.forEach((x, i) => {
    const m = K.m('props', x, z);
    const lean = (hsh(i, 5) - 0.5) * 0.04;
    const top = [x + lean * 10, 10.2, z];
    tube(m, [x, 0, z], top, 0.17, 0.12, 9, lc('#5A4632', '#6E5A44', hsh(i, 3)), MAT.woodZ, true);
    withT(m, rot(top[0], 9.5, z, Math.PI / 2), () => blockC(m, -1.4, -0.08, -0.07, 1.4, 0.08, 0.07, C('#5E4A36'), MAT.woodX));
    const ins = [];
    for (const dz of [-1.25, 0, 1.25]) { const p = [top[0], 9.62, z + dz]; m.smoothCyl(p[0], p[1], p[2], 0.06, 0.18, 8, C('#E8E4DA'), MAT.plastic); ins.push([p[0], p[1] + 0.18, p[2]]); }
    if (i % 3 === 1) { m.smoothCyl(top[0] + 0.3, 7.6, z, 0.32, 0.9, 12, C('#7E8288'), MAT.metal); }
    tops.push(ins);
  });
  for (let i = 0; i < tops.length - 1; i++) for (let k = 0; k < 3; k++) {
    const a = tops[i][k], b = tops[i + 1][k];
    const m = K.m('wires', (a[0] + b[0]) / 2, z);
    const pts = [];
    for (let s = 0; s <= 10; s++) { const t = s / 10; pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - Math.sin(t * Math.PI) * 0.9, a[2] + (b[2] - a[2]) * t]); }
    for (let s = 0; s < 10; s++) tube(m, pts[s], pts[s + 1], 0.018, 0.018, 4, C('#1A1A1A'), MAT.matte, false);
  }
}

function pineTree(m, x, y, z, s, seed, o = {}) {
  const lowD = o.low;
  const trunkC = lc('#4A3424', '#5E4632', hsh(seed, 1));
  tube(m, [x, y - 0.2, z], [x, y + s * 0.95, z], s * 0.032, s * 0.012, lowD ? 5 : 7, trunkC, MAT.matte, false);
  const layers = lowD ? 4 : 6 + Math.floor(hsh(seed, 2) * 3);
  const base = lc('#26402A', '#33502E', hsh(seed, 3)), tip = lc('#4E6E36', '#5E7A3C', hsh(seed, 4));
  for (let k = 0; k < layers; k++) {
    const t = k / layers;
    const ly = y + s * (0.16 + t * 0.74), r = s * (0.34 * (1 - t) + 0.05), hh = s * (0.27 - t * 0.09);
    const n = lowD ? 8 : 14, cx = x + (hsh(seed, k, 5) - 0.5) * 0.1 * s, cz = z + (hsh(seed, k, 6) - 0.5) * 0.1 * s;
    const apex = [cx, ly + hh, cz];
    const ring = [], mid = [];
    for (let j = 0; j < n; j++) {
      const a = (j / n) * Math.PI * 2 + k * 0.7;
      const tipOut = (j % 2 === 0 ? 1.12 : 0.82) * (0.88 + hsh(seed, k * 17 + j, 7) * 0.24);
      const rr = r * tipOut;
      ring.push([cx + Math.cos(a) * rr, ly - hh * (0.12 + (j % 2 === 0 ? 0.22 : 0.05) + hsh(seed, k, j) * 0.1), cz + Math.sin(a) * rr]);
      mid.push([cx + Math.cos(a) * rr * 0.55, ly + hh * 0.38, cz + Math.sin(a) * rr * 0.55]);
    }
    const cA = mc(base, 0.9), cM = lc(base, tip, 0.35 + t * 0.3), cT = lc(base, tip, 0.75 + t * 0.25);
    for (let j = 0; j < n; j++) {
      const j1 = (j + 1) % n;
      const p0 = ring[j], p1 = ring[j1], q0 = mid[j], q1 = mid[j1];
      const nA = (p) => nrm([p[0] - cx, (p[1] - ly) * 0.4 + r * 0.9, p[2] - cz]);
      const k0 = mc(cA, 0.95 + hsh(seed, k, j + 40) * 0.12);
      pv(m, m.tp(q0), nA(q0), cM, MAT.matte); pv(m, m.tp(p0), nA(p0), k0, MAT.matte); pv(m, m.tp(p1), nA(p1), k0, MAT.matte);
      pv(m, m.tp(q0), nA(q0), cM, MAT.matte); pv(m, m.tp(p1), nA(p1), k0, MAT.matte); pv(m, m.tp(q1), nA(q1), cM, MAT.matte);
      pv(m, m.tp(apex), [0, 1, 0], cT, MAT.matte); pv(m, m.tp(q1), nA(q1), cM, MAT.matte); pv(m, m.tp(q0), nA(q0), cM, MAT.matte);
      if (!lowD) { const under = [cx, ly - hh * 0.25, cz]; const dn = [0, -1, 0]; pv(m, m.tp(p0), dn, mc(base, 0.55), MAT.matte); pv(m, m.tp(under), dn, mc(base, 0.4), MAT.matte); pv(m, m.tp(p1), dn, mc(base, 0.55), MAT.matte); }
    }
  }
}
function oakTree(m, x, y, z, s, seed) {
  const trunkC = lc('#4E3C2C', '#5E4A38', hsh(seed, 1));
  const top = [x + (hsh(seed, 2) - 0.5) * 0.4 * s, y + s * 0.45, z + (hsh(seed, 3) - 0.5) * 0.4 * s];
  tube(m, [x, y - 0.2, z], top, s * 0.06, s * 0.04, 9, trunkC, MAT.matte, false);
  const n = 8 + Math.floor(hsh(seed, 4) * 5);
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2 + hsh(seed, k, 5);
    const rr = s * (0.1 + hsh(seed, k, 6) * 0.22);
    const c = [top[0] + Math.cos(a) * rr * 1.2, top[1] + s * (0.06 + hsh(seed, k, 7) * 0.34), top[2] + Math.sin(a) * rr * 1.2];
    if (k < 5) tube(m, top, [c[0], c[1] - s * 0.05, c[2]], s * 0.03, s * 0.014, 6, trunkC, MAT.matte, false);
    const r = s * (0.16 + hsh(seed, k, 8) * 0.11);
    const g0 = lc('#2E4A24', '#3E5A2A', hsh(seed, k, 9)), g1 = lc('#6E8C3E', '#86A048', hsh(seed, k, 10));
    blobS(m, c, [r, r * 0.8, r], 12, 8, 0.12, seed * 17 + k, (sy, rnd) => mc(lc(g0, g1, sat(sy * 0.55 + 0.5)), 0.9 + rnd * 0.16), MAT.matte);
  }
}
function bush(m, x, y, z, s, seed) {
  const g0 = lc('#2E4A24', '#3E5A2A', hsh(seed, 1)), g1 = lc('#66843A', '#7E9446', hsh(seed, 2));
  for (let k = 0; k < 3; k++) { const c = [x + (hsh(seed, k, 3) - 0.5) * s, y + s * 0.3, z + (hsh(seed, k, 4) - 0.5) * s]; blobS(m, c, [s * 0.6, s * 0.48, s * 0.6], 10, 6, 0.14, seed * 7 + k, (sy, rnd) => mc(lc(g0, g1, sat(sy * 0.55 + 0.5)), 0.9 + rnd * 0.16), MAT.matte); }
}

function buildTrees(ctx) {
  const { K } = ctx;
  const keep = ctx.treeKeep == null ? 1 : ctx.treeKeep;
  const { trees, bushes } = forestList(keep);
  for (const t of trees) {
    const m = K.m(t.far ? 'far' : 'trees', t.x, t.z);
    const y = groundH(t.x, t.z);
    if (t.pine) pineTree(m, t.x, y, t.z, t.s, t.i, { low: t.far || (keep < 1 && !inRect(t.x, t.z, BOUNDS, 6)) }); else oakTree(m, t.x, y, t.z, t.s * 0.75, t.i);
  }
  for (const [x, z, s] of OAKS) { const m = K.m('trees', x, z); oakTree(m, x, groundH(x, z), z, s, (x * 13 + z) | 0); }
  for (const b of bushes) { const m = K.m('trees', b.x, b.z); bush(m, b.x, groundH(b.x, b.z), b.z, b.s, b.i + 900); }
}

function grassTuft(m, x, y, z, h, n, seed, c0, c1) {
  const up = [0, 1, 0];
  for (let k = 0; k < n; k++) {
    const a = hsh(seed, k) * Math.PI * 2, lean = 0.12 + hsh(seed, k, 2) * 0.42;
    const w = 0.011 + hsh(seed, k, 3) * 0.013;
    const hh = h * (0.45 + hsh(seed, k, 4) * 0.65);
    const r0 = hsh(seed, k, 8) * 0.07;
    const ox = x + Math.cos(a + 1.3) * r0, oz = z + Math.sin(a + 1.3) * r0;
    const dx = Math.cos(a), dz = Math.sin(a);
    const mid = [ox + dx * hh * lean * 0.3, y + hh * 0.55, oz + dz * hh * lean * 0.3];
    const tip = [ox + dx * hh * lean, y + hh * 0.97, oz + dz * hh * lean];
    const nx = -dz * w, nz = dx * w;
    const cb = mc(c0, 0.5), cm = mc(lc(c0, c1, 0.35), 0.82 + hsh(seed, k, 6) * 0.1), ct = mc(lc(c0, c1, 0.75 + hsh(seed, k, 5) * 0.25), 0.95 + hsh(seed, k, 7) * 0.14);
    const p0 = [ox - nx, y, oz - nz], p1 = [ox + nx, y, oz + nz], q0 = [mid[0] - nx * 0.8, mid[1], mid[2] - nz * 0.8], q1 = [mid[0] + nx * 0.8, mid[1], mid[2] + nz * 0.8];
    const fn = nrm(crs(sub(p1, p0), sub(tip, p0)));
    for (const sgn of [1, -1]) {
      const nn = nrm([fn[0] * sgn * 0.45 + up[0], fn[1] * sgn * 0.45 + up[1], fn[2] * sgn * 0.45 + up[2]]);
      const A = sgn > 0 ? [p0, p1, q1, q0] : [p1, p0, q0, q1];
      pv(m, A[0], nn, cb, MAT.matte); pv(m, A[1], nn, cb, MAT.matte); pv(m, A[2], nn, cm, MAT.matte);
      pv(m, A[0], nn, cb, MAT.matte); pv(m, A[2], nn, cm, MAT.matte); pv(m, A[3], nn, cm, MAT.matte);
      pv(m, A[3], nn, cm, MAT.matte); pv(m, A[2], nn, cm, MAT.matte); pv(m, tip, nn, ct, MAT.matte);
    }
  }
}
function flower(m, x, y, z, h, col, seed) {
  const top = [x + (hsh(seed, 1) - 0.5) * 0.08, y + h, z + (hsh(seed, 2) - 0.5) * 0.08];
  tube(m, [x, y, z], top, 0.004, 0.003, 4, C('#5E7A34'), MAT.matte, false);
  const n = 5;
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + hsh(seed, 3); const pp = [top[0] + Math.cos(a) * 0.022, top[1] + 0.004, top[2] + Math.sin(a) * 0.022]; sq(m, pp[0], pp[1], pp[2], 0.016, 0.004, 0.016, 1, 1, col, MAT.matte, 6, 4); }
  ball(m, top[0], top[1] + 0.008, top[2], 0.01, C('#F2C230'), MAT.matte, 6);
}

function buildGrass(ctx) {
  const { K } = ctx;
  const R = rng(4321);
  const [gx, gz, gr] = ctx.grassAt || [0, 20, 90];
  const N = ctx.grassN || 26000;
  for (let i = 0; i < N; i++) {
    const a = R() * Math.PI * 2, d = Math.pow(R(), 0.62) * gr;
    const x = gx + Math.cos(a) * d, z = gz + Math.sin(a) * d * 0.85;
    if (R() > 1 - ss(gr * 0.55, gr, d)) continue;
    const rd = roadDist(x, z);
    if (rd < 1.4 || inRect(x, z, TOWN.lot, 0.4) || inRect(x, z, TOWN.store, 0.5) || nearHouse(x, z, -2)) continue;
    const fieldK = ss(1.4, 5, rd) * (0.55 + 0.6 * fbm(x * 0.06, z * 0.06, 71, 2));
    if (R() > fieldK) continue;
    const y = groundH(x, z) - 0.02;
    const base = grassCol(x, z);
    const trample = ctx.clear ? ss(ctx.clear[2], ctx.clear[2] * 0.4, Math.hypot(x - ctx.clear[0], (z - ctx.clear[1]) * 1.3)) : 0;
    if (R() < trample * 0.35) continue;
    const tall = (z > 5 ? 0.38 + 0.6 * fbm(x * 0.1, z * 0.1, 72, 2) : 0.28) * (1 - trample * 0.45);
    const m = K.m('grass', x, z);
    grassTuft(m, x, y, z, tall * (0.7 + R() * 0.6), 7 + Math.floor(R() * 6), i, mc(base, 0.9), lc(base, '#B4BC66', 0.2 + R() * 0.3));
    if (z > 5 && R() < 0.035) flower(m, x + 0.05, y, z, tall * (0.8 + R() * 0.5), C(['#F4F2EA', '#E8D24A', '#B98AD8', '#F4F2EA'][Math.floor(R() * 4)]), i);
  }
  for (let i = 0; i < 240; i++) {
    const x = TOWN.lot[0] + R() * (TOWN.lot[2] - TOWN.lot[0]), z = TOWN.lot[1] + R() * (TOWN.lot[3] - TOWN.lot[1]);
    if (inRect(x, z, TOWN.store, 0.2)) continue;
    const m = K.m('grass', x, z);
    grassTuft(m, x, 0.075, z, 0.18 + R() * 0.2, 4, i + 7000, C('#6A7A3A'), C('#9AA050'));
  }
}

function ranchFence(ctx, x0, x1, z) {
  const { K } = ctx;
  for (let x = x0; x < x1; x += 3) {
    const m = K.m('props', x, z);
    const broken = hsh(x | 0, 77) > 0.86;
    const y = groundH(x, z);
    blockC(m, x - 0.08, y - 0.1, z - 0.08, x + 0.08, y + 1.25 - (broken ? 0.4 : 0), z + 0.08, lc('#6A5440', '#7E6650', hsh(x | 0, 3)), MAT.woodZ);
    if (broken) continue;
    for (const ry of [0.5, 1.0]) withT(m, rot(x + 1.5, y + ry, z + 0.1, 0, 0, (hsh(x | 0, ry * 10) - 0.5) * 0.06), () => blockC(m, -1.52, -0.06, -0.03, 1.52, 0.06, 0.03, lc('#7A6248', '#8E765C', hsh(x | 0, ry * 7)), MAT.woodX));
  }
}

function sandbags(m, x, z, len, rows, yaw) {
  withT(m, rot(x, 0, z, yaw), () => {
    for (let r = 0; r < rows; r++) for (let k = 0; k < Math.floor(len / 0.62); k++) {
      const px = -len / 2 + 0.31 + k * 0.62 + (r % 2) * 0.31, py = 0.12 + r * 0.2;
      if (px > len / 2 - 0.2) continue;
      sq(m, px, py, (hsh(k, r) - 0.5) * 0.05, 0.3, 0.11, 0.2, 0.55, 0.6, lc('#9A8A62', '#B4A47A', hsh(k, r, 3)), MAT.matte, 10, 6);
    }
  });
}
function barrel(m, x, z, col, o = {}) {
  const y = o.y || 0;
  if (o.fallen) { withT(m, rot(x, y + 0.3, z, o.yaw || 0, Math.PI / 2), () => { m.smoothCyl(0, -0.45, 0, 0.3, 0.9, 14, C(col), MAT.paint); for (const yy of [-0.2, 0.2]) m.smoothCyl(0, yy, 0, 0.31, 0.04, 14, mc(col, 0.8), MAT.paint, { cap: false }); }); return; }
  m.smoothCyl(x, y, z, 0.3, 0.9, 14, C(col), MAT.paint);
  for (const yy of [0.25, 0.62]) m.smoothCyl(x, y + yy, z, 0.31, 0.04, 14, mc(col, 0.8), MAT.paint, { cap: false });
  if (o.fire) m.cyl(x, y + 0.88, z, 0.27, 0.02, 12, C('#2A1A12'), MAT.matte);
}
function tireStack(m, x, z, n, seed) {
  for (let k = 0; k < n; k++) withT(m, rot(x + (hsh(seed, k) - 0.5) * 0.12, 0.12 + k * 0.24, z + (hsh(seed, k, 2) - 0.5) * 0.12, hsh(seed, k, 3) * 3), () => { m.smoothCyl(0, -0.12, 0, 0.38, 0.24, 16, C('#1E1E20'), MAT.matte, { cap: false }); m.smoothCyl(0, -0.12, 0, 0.2, 0.24, 14, C('#141416'), MAT.matte, { cap: false }); m.revolve(0, 0.12, 0, [[0.2, 0], [0.38, 0]], 16, C('#262628'), MAT.matte); });
}
function barricade(m, x, z, yaw) {
  withT(m, rot(x, 0, z, yaw), () => {
    for (const sx of [-1, 1]) { withT(m, rot(sx * 1.1, 0.5, 0, 0, 0, sx * 0.4), () => blockC(m, -0.06, -0.55, -0.05, 0.06, 0.55, 0.05, C('#7A6044'), MAT.woodZ)); withT(m, rot(sx * 1.1, 0.5, 0, 0, 0, -sx * 0.4), () => blockC(m, -0.06, -0.55, -0.05, 0.06, 0.55, 0.05, C('#7A6044'), MAT.woodZ)); }
    blockC(m, -1.5, 0.78, -0.1, 1.5, 1.02, -0.05, C('#F2EEE4'), MAT.paint);
    for (let k = 0; k < 6; k++) withT(m, rot(-1.25 + k * 0.5, 0.9, -0.03, 0, 0, 0.6), () => m.box(0, -0.13, 0, 0.13, 0.26, 0.02, C('#D8402A'), MAT.paint));
  });
}

function jersey(m, x, z, yaw) {
  withT(m, rot(x, floorAt(x, z), z, yaw), () => {
    blockC(m, -1.5, 0, -0.32, 1.5, 0.18, 0.32, C('#B8B2A6'), MAT.stone, { ao: 0.85 });
    blockC(m, -1.5, 0.18, -0.2, 1.5, 0.55, 0.2, C('#C4BEB2'), MAT.stone);
    blockC(m, -1.5, 0.55, -0.12, 1.5, 0.82, 0.12, C('#CCC6BA'), MAT.stone);
    for (let k = 0; k < 3; k++) m.box(-1 + k, 0.62, 0.125, 0.34, 0.12, 0.01, C(k % 2 ? '#2A2A2A' : '#E8C23A'), MAT.paint);
  });
}
function floorAt(x, z) { return z > -4.6 && z < 4.6 ? 0.1 : groundH(x, z); }
function perimeter(ctx) {
  const { K } = ctx;
  const [x0, z0, x1, z1] = BOUNDS;
  const gap = (x, z) => BARRIERS.some(([ax, az, bx, bz]) => x >= Math.min(ax, bx) - 0.5 && x <= Math.max(ax, bx) + 0.5 && z >= Math.min(az, bz) - 0.5 && z <= Math.max(az, bz) + 0.5);
  const side = (ax, az, bx, bz) => {
    const L = Math.hypot(bx - ax, bz - az), n = Math.ceil(L / 3.2), yaw = Math.atan2(bx - ax, bz - az);
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t;
      if (gap(x, z)) continue;
      const m = K.m('props', x, z), y = groundH(x, z);
      tube(m, [x, y - 0.1, z], [x, y + 2.1, z], 0.045, 0.045, 6, C('#7E848A'), MAT.metal, true);
      if (i === n) continue;
      const t2 = (i + 1) / n, x2 = ax + (bx - ax) * t2, z2 = az + (bz - az) * t2;
      if (gap(x2, z2)) continue;
      const y2 = groundH(x2, z2);
      for (const h of [0.35, 1.05, 1.75, 2.05]) tube(m, [x, y + h, z], [x2, y2 + h, z2], 0.012, 0.012, 4, C(h > 2 ? '#8A8E92' : '#9AA0A6'), MAT.metal, false);
      if (hsh(i, (ax * 7 + az) | 0) > 0.55) withT(m, rot(x + (x2 - x) * 0.5, y + 1.1, z + (z2 - z) * 0.5, yaw + Math.PI / 2), () => m.box(0, 0, 0, 1.1, 0.5, 0.012, C(hsh(i, 5) > 0.5 ? '#B8BDAE' : '#9EA894'), MAT.matte));
    }
  };
  side(x0, z0, x1, z0); side(x1, z0, x1, z1); side(x1, z1, x0, z1); side(x0, z1, x0, z0);
  for (const [ax, az, bx, bz] of BARRIERS) {
    const L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L / 3.1)), yaw = Math.atan2(bx - ax, bz - az) + Math.PI / 2;
    const m = K.m('props', (ax + bx) / 2, (az + bz) / 2);
    for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; jersey(m, ax + (bx - ax) * t, az + (bz - az) * t, yaw + (hsh(i, 3) - 0.5) * 0.12); }
  }
}

function crate(m, x, z, yaw, n, seed) {
  const y = floorAt(x, z);
  withT(m, rot(x, y, z, yaw), () => {
    const one = (ox, oy, oz, s, k) => {
      const c = lc('#9A7A4E', '#B89466', hsh(seed, k));
      blockC(m, ox - s, oy, oz - s, ox + s, oy + s * 2, oz + s, c, MAT.woodX, { ao: 0.85 });
      for (const e of [-1, 1]) { m.box(ox + e * (s - 0.04), oy, oz + s + 0.005, 0.08, s * 2, 0.02, mc(c, 0.78), MAT.matte); m.box(ox + e * (s - 0.04), oy, oz - s - 0.005, 0.08, s * 2, 0.02, mc(c, 0.78), MAT.matte); }
      withT(m, rot(ox, oy + s, oz + s + 0.012, 0, 0, Math.PI / 4), () => m.box(0, -s * 1.3, 0, 0.08, s * 2.6, 0.02, mc(c, 0.8), MAT.matte));
    };
    one(0, 0, 0, 0.55, 0);
    if (n > 1) { one(1.15, 0, 0.1, 0.5, 1); one(0.5, 1.1, 0.05, 0.45, 2); }
  });
}
function buildFarm(ctx) {
  const { K } = ctx;
  const B = K.m('props', BARN.x, BARN.z);
  const { x, z, hw, hd } = BARN, y = groundH(x, z) - 0.15, H = 4.2;
  for (let k = 0; k < 14; k++) { const y0 = y + k * (H / 14), y1 = y0 + H / 14; blockC(B, x - hw, y0, z - hd, x + hw, y1, z + hd, lc('#9E3328', '#B23E30', hsh(k, 21)), MAT.woodX, { skip: 'tb', ao: 0.9 }); }
  const ry = y + H, top = ry + 2.8, rw = hw + 0.5, rd = hd + 0.5;
  const roof = C('#4A4A4E'), rf2 = C('#3E3E42');
  quadC(B, [x - rw, ry - 0.2, z - rd], [x - rw, top, z], [x + rw, top, z], [x + rw, ry - 0.2, z - rd], roof, rf2, rf2, roof, MAT.plate);
  quadC(B, [x + rw, ry - 0.2, z + rd], [x + rw, top, z], [x - rw, top, z], [x - rw, ry - 0.2, z + rd], roof, rf2, rf2, roof, MAT.plate);
  const red = C('#A8362A');
  for (const sx of [-1, 1]) { triC(B, [x + sx * hw, ry, z - hd], [x + sx * hw, ry, z + hd], [x + sx * hw, top - 0.3, z], red, red, red, MAT.woodX); triC(B, [x + sx * hw, ry, z + hd], [x + sx * hw, ry, z - hd], [x + sx * hw, top - 0.3, z], red, red, red, MAT.woodX); }
  const wh = C('#EDEAE2');
  B.box(x, y, z - hd - 0.06, 4.2, 3.4, 0.08, C('#8A2A22'), MAT.woodX);
  for (const [a, b] of [[[-2.1, 0], [2.1, 3.4]], [[-2.1, 3.4], [2.1, 0]]]) { const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy); withT(B, rot(x + (a[0] + b[0]) / 2, y + (a[1] + b[1]) / 2, z - hd - 0.12, 0, 0, Math.atan2(dy, dx)), () => B.box(0, -0.09, 0, L, 0.18, 0.04, wh, MAT.trim)); }
  B.box(x, y + 3.35, z - hd - 0.12, 4.4, 0.18, 0.05, wh, MAT.trim);
  for (const sx of [-2.1, 2.1]) B.box(x + sx, y, z - hd - 0.12, 0.18, 3.5, 0.05, wh, MAT.trim);
  B.box(x, y + 4.5, z - hd - 0.1, 1.4, 1.1, 0.06, C('#2E2A26'), MAT.matte);
  const H2 = K.m('props', 4, 18);
  for (const [bx, bz, yaw] of BALES) withT(H2, rot(bx, groundH(bx, bz) + 0.72, bz, yaw, 0, Math.PI / 2), () => { H2.smoothCyl(0, -0.62, 0, 0.74, 1.24, 18, lc('#D8B65A', '#C9A34A', hsh(bx | 0, 4)), MAT.matte); for (const e of [-0.63, 0.63]) H2.smoothCyl(0, e - 0.01, 0, 0.6, 0.02, 18, C('#B8923E'), MAT.matte); });
  for (const [tx, tz, yaw] of TENTS) {
    const T = K.m('props', tx, tz), ty = groundH(tx, tz);
    withT(T, rot(tx, ty, tz, yaw), () => {
      const cv = C(hsh(tx | 0, 9) > 0.5 ? '#5E6E46' : '#7A6A4A'), cv2 = mc(cv, 0.8);
      quadC(T, [-1.3, 0, -1.6], [0, 1.55, -1.6], [0, 1.55, 1.6], [-1.3, 0, 1.6], cv2, cv, cv, cv2, MAT.matte);
      quadC(T, [1.3, 0, 1.6], [0, 1.55, 1.6], [0, 1.55, -1.6], [1.3, 0, -1.6], cv2, cv, cv, cv2, MAT.matte);
      triC(T, [-1.3, 0, -1.6], [1.3, 0, -1.6], [0, 1.55, -1.6], cv, cv, cv, MAT.matte);
      triC(T, [-0.5, 0, 1.61], [0, 1.0, 1.61], [0.5, 0, 1.61], C('#1E1E1A'), C('#1E1E1A'), C('#1E1E1A'), MAT.matte);
      tube(T, [0, 1.55, -1.75], [0, 1.55, 1.75], 0.04, 0.04, 6, C('#5A4A3A'), MAT.woodZ, true);
    });
  }
  const camp = K.m('props', -27, 21);
  for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2; camp.smoothCyl(-27.5 + Math.cos(a) * 0.55, groundH(-27.5, 21.5), 21.5 + Math.sin(a) * 0.55, 0.16, 0.16, 8, C('#6E6A62'), MAT.stone); }
  for (let k = 0; k < 4; k++) withT(camp, rot(-27.5, groundH(-27.5, 21.5) + 0.12, 21.5, k * 0.8, 0, Math.PI / 2), () => camp.smoothCyl(0, -0.4, 0, 0.06, 0.8, 6, C('#3A2A1E'), MAT.woodZ));
  for (const [cx, cz, yaw, n] of CRATES) crate(K.m('props', cx, cz), cx, cz, yaw, n, (cx * 7 + cz) | 0);
}

function buildProps(ctx) {
  const { K } = ctx;
  const R = rng(555);
  const SB = K.m('props', 0, -28);
  sandbags(SB, -6, -27.6, 6, 3, 0);
  sandbags(SB, 6, -27.6, 6, 3, 0);
  sandbags(SB, -10.2, -29.8, 3.2, 2, Math.PI / 2);
  sandbags(SB, 10.4, -29.8, 3.2, 2, Math.PI / 2);
  const P = K.m('props', 0, -10);
  barrel(P, -13, -26, '#3A5A8A', { fire: true });
  barrel(P, 13.6, -27, '#8A3A2A');
  barrel(P, 14.3, -26.4, '#3A6A4A', { fallen: true, yaw: 0.6 });
  barrel(P, -18, -40, '#6A6A3A');
  tireStack(P, 16.5, -30, 4, 3);
  tireStack(P, 17.4, -31, 3, 4);
  tireStack(P, -19, -9, 2, 5);
  barricade(P, -30, 0.6, 0.15);
  barricade(P, 34, -1.2, -0.2);
  for (let i = 0; i < 70; i++) {
    const x = -40 + R() * 90, z = -40 + R() * 46;
    if (inRect(x, z, TOWN.store, 0.3) || (Math.abs(x) < 8 && z > -24 && z < -10) || (Math.abs(x) < 6 && z > -10 && z < 3)) continue;
    const m = K.m('props', x, z);
    const y = z > -4.6 && z < 4.6 ? 0.1 : z < -4.6 && inRect(x, z, TOWN.lot) ? 0.085 : groundH(x, z) + 0.01;
    const kd = R();
    if (kd < 0.45) { withT(m, rot(x, y, z, R() * 3), () => m.box(0, 0, 0, 0.18 + R() * 0.2, 0.01, 0.22 + R() * 0.2, lc('#E8E4D8', '#C8C0A8', R()), MAT.matte)); }
    else if (kd < 0.7) { withT(m, rot(x, y, z, R() * 3), () => blockC(m, -0.25, 0, -0.2, 0.25, 0.3 + R() * 0.2, 0.2, lc('#A8885E', '#C2A274', R()), MAT.matte)); }
    else if (kd < 0.85) { sq(m, x, y + 0.14, z, 0.22, 0.16, 0.2, 0.9, 0.9, C(R() > 0.5 ? '#2A2A2C' : '#3E4A3A'), MAT.plastic, 10, 6); }
    else { withT(m, rot(x, y, z, R() * 3, Math.PI / 2), () => m.smoothCyl(0, -0.1, 0, 0.035, 0.2, 8, lc('#B8322A', '#3A72B8', R()), MAT.paint)); }
  }
  const cart = K.m('props', -16, -30);
  withT(cart, rot(-16.5, 0, -30.5, 0.7), () => { for (const sx of [-1, 1]) for (const sz of [-1, 1]) { cart.smoothCyl(sx * 0.25, 0.04, sz * 0.4, 0.05, 0.04, 8, C('#2A2A2A'), MAT.matte); tube(cart, [sx * 0.25, 0.08, sz * 0.4], [sx * 0.28, 0.5, sz * 0.42], 0.015, 0.015, 5, C('#B8BCC2'), MAT.metal, false); } for (let k = 0; k < 6; k++) { cart.box(0, 0.5 + k * 0.08, 0, 0.62, 0.01, 0.95, C('#B8BCC2'), MAT.metal); } cart.box(0, 0.98, -0.5, 0.62, 0.04, 0.04, C('#C8302A'), MAT.plastic); });
}

function buildFar(ctx) {
  const { K } = ctx;
  const n = 96;
  for (let ring = 0; ring < 2; ring++) {
    const R0 = ring ? 1000 : 700;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
      const hA = (ring ? 150 : 95) * (0.35 + fbm(Math.cos(a0) * 3 + ring * 9, Math.sin(a0) * 3, 91 + ring, 4) * 1.2);
      const hB = (ring ? 150 : 95) * (0.35 + fbm(Math.cos(a1) * 3 + ring * 9, Math.sin(a1) * 3, 91 + ring, 4) * 1.2);
      const m = K.m('far', Math.cos(a0) * R0, Math.sin(a0) * R0);
      const c0 = C(ring ? '#6E8496' : '#566E5A'), c1 = C(ring ? '#8EA2B0' : '#6E8664');
      const pA0 = [Math.cos(a0) * R0, -10, Math.sin(a0) * R0], pB0 = [Math.cos(a1) * R0, -10, Math.sin(a1) * R0];
      const pA1 = [Math.cos(a0) * (R0 + 60), hA, Math.sin(a0) * (R0 + 60)], pB1 = [Math.cos(a1) * (R0 + 60), hB, Math.sin(a1) * (R0 + 60)];
      quadC(m, pA0, pA1, pB1, pB0, c0, c1, c1, c0, MAT.matte);
      quadC(m, pB0, pB1, pA1, pA0, c0, c1, c1, c0, MAT.matte);
    }
  }
  const wt = K.m('props', -120, -170);
  const tx = -120, tz = -170, ty = groundH(tx, tz);
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) tube(wt, [tx + sx * 4, ty, tz + sz * 4], [tx + sx * 2.2, ty + 26, tz + sz * 2.2], 0.3, 0.25, 8, C('#8A9096'), MAT.metal, false);
  for (let k = 0; k < 3; k++) { const y = ty + 6 + k * 7; const r = 4 - k * 0.6; for (let s = 0; s < 4; s++) { const a = (s / 4) * Math.PI * 2 + Math.PI / 4, b = ((s + 1) / 4) * Math.PI * 2 + Math.PI / 4; tube(wt, [tx + Math.cos(a) * r * 1.41, y, tz + Math.sin(a) * r * 1.41], [tx + Math.cos(b) * r * 1.41, y, tz + Math.sin(b) * r * 1.41], 0.1, 0.1, 5, C('#7A8086'), MAT.metal, false); } }
  sq(wt, tx, ty + 30, tz, 6.2, 4.2, 6.2, 0.6, 1, C('#C8CCD0'), MAT.paint, 22, 10);
  wt.cyl(tx, ty + 34, tz, 6.3, 2.4, 22, C('#B8BCC0'), MAT.paint, { r2: 0.6 });
  withT(wt, rot(tx, ty + 29.0, tz + 6.15, 0), () => strokeText(wt, 'PINE CREEK', 0, 0, 0, 1.25, C('#2E4A6E'), MAT.paint, { depth: 0.1, weight: 1.1 }));
}

export function townMeshes(o = {}) {
  const K = chunker(o.chunk || 24);
  const ctx = { K, grassAt: o.grassAt, grassN: o.grassN, treeKeep: o.treeKeep, clear: o.clear };
  buildTerrain(ctx);
  buildRoads(ctx);
  if (o.real) return K.out();
  buildLot(ctx);
  buildStation(ctx);
  buildHouses(ctx);
  utilityPoles(ctx);
  for (const [x0, x1, z] of FENCES) ranchFence(ctx, x0, x1, z);
  perimeter(ctx);
  buildFarm(ctx);
  buildProps(ctx);
  buildTrees(ctx);
  if (o.grass !== false) buildGrass(ctx);
  buildFar(ctx);
  const parts = K.out();
  const cars = CARS;
  for (const [k, co, x, z, yaw] of cars) parts.push({ data: carMesh(k, co), model: m4.pose(x, z < -4.6 && x > -26 && x < 30 ? 0.08 : z > -4.6 && z < 4.6 ? 0.1 : groundH(x, z), z, yaw), cast: true, kind: 'cars', bs: [x, 1, z, 3.4] });
  return parts;
}

export function townEnv(o = {}) {
  const lin = (h) => hexRgb(h).map((v) => v ** 2.2);
  if (o.mood === 'dusk') {
    const s = [-0.78, 0.2, 0.6], L = Math.hypot(s[0], s[1], s[2]);
    return { sunDir: [s[0] / L, s[1] / L, s[2] / L], sunCol: [1.45, 0.84, 0.5], skyCol: [0.27, 0.3, 0.37], gndCol: [0.13, 0.11, 0.09], fogCol: lin('#5C6066'), fogSun: hexRgb('#C47E52'), fogSunLin: lin('#C47E52'), horizon: hexRgb('#7E6252'), zenith: hexRgb('#1C2634'), reflHor: hexRgb('#6A5A50'), reflZen: hexRgb('#2A3442'), fogDen: o.fogDen || 0.0085, exposure: o.exposure || 1.14, shadowRange: o.shadowRange || 30, clouds: 0.6, cloud: [0.62, 0.52, 0.5], time: 0, detail: o.detail == null ? 1 : o.detail, shadows: o.shadows !== false };
  }
  const s = o.sun || [-0.62, 0.36, 0.7], L = Math.hypot(s[0], s[1], s[2]);
  return { sunDir: [s[0] / L, s[1] / L, s[2] / L], sunCol: [2.35, 1.86, 1.32], skyCol: [0.38, 0.43, 0.52], gndCol: [0.24, 0.2, 0.13], fogCol: lin('#C4CBC6'), fogSun: hexRgb('#F6D6A4'), fogSunLin: lin('#F6D6A4'), horizon: hexRgb('#E6D8BC'), zenith: hexRgb('#4F84C4'), fogDen: o.fogDen || 0.0013, exposure: o.exposure || 0.92, shadowRange: o.shadowRange || 40, clouds: 0.55, cloud: [1, 0.9, 0.8], time: 0, detail: o.detail == null ? 1 : o.detail, shadows: o.shadows !== false };
}
