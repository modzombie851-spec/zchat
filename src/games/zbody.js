import { hexRgb } from './race3d.js';

export const NB = 18;
export const BN = { PEL: 0, SPN: 1, CHS: 2, NCK: 3, HED: 4, UAL: 5, FAL: 6, HAL: 7, UAR: 8, FAR: 9, HAR: 10, THL: 11, SHL: 12, FTL: 13, THR: 14, SHR: 15, FTR: 16, JAW: 17 };
export const PARENT = [-1, 0, 1, 2, 3, 2, 5, 6, 2, 8, 9, 0, 11, 12, 0, 14, 15, 4];

const C = (h) => (typeof h === 'string' ? hexRgb(h) : h);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const mulc = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scl = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const nrm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

const H32 = (n) => { let x = (n | 0) * 374761393; x = (x ^ (x >>> 13)) * 1274126177; return ((x ^ (x >>> 16)) >>> 0) / 4294967296; };
const hh = (a, b, c, s) => H32((a * 73856093) ^ (b * 19349663) ^ (c * 83492791) ^ (s * 2654435761));
function vn3(x, y, z, s) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const fx = x - xi, fy = y - yi, fz = z - zi;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
  const L = (a, b, t) => a + (b - a) * t;
  const c = (i, j, k) => hh(xi + i, yi + j, zi + k, s);
  return L(L(L(c(0, 0, 0), c(1, 0, 0), u), L(c(0, 1, 0), c(1, 1, 0), u), v), L(L(c(0, 0, 1), c(1, 0, 1), u), L(c(0, 1, 1), c(1, 1, 1), u), v), w);
}
const fb3 = (x, y, z, s) => vn3(x, y, z, s) * 0.55 + vn3(x * 2.1, y * 2.1, z * 2.1, s + 7) * 0.3 + vn3(x * 4.3, y * 4.3, z * 4.3, s + 13) * 0.15;

export function makeJoints(b = {}) {
  const sw = b.sw || 1, hw = b.hw || 1;
  const J = new Float32Array(NB * 3);
  const set = (i, x, y, z) => { J[i * 3] = x; J[i * 3 + 1] = y; J[i * 3 + 2] = z; };
  set(0, 0, 0.97, 0); set(1, 0, 1.09, 0.004); set(2, 0, 1.27, 0.004); set(3, 0, 1.49, -0.004); set(4, 0, 1.555, 0.004);
  for (const s of [1, -1]) {
    const o = s > 0 ? 0 : 3;
    set(5 + o, 0.188 * sw * s, 1.432, -0.01); set(6 + o, 0.212 * sw * s, 1.158, -0.024); set(7 + o, 0.222 * sw * s, 0.918, -0.006);
    set(11 + o, 0.094 * hw * s, 0.935, 0); set(12 + o, 0.099 * hw * s, 0.515, 0.012); set(13 + o, 0.1 * hw * s, 0.088, -0.014);
  }
  set(17, 0, 1.6, 0.02);
  return J;
}
const JP = (J, i) => [J[i * 3], J[i * 3 + 1], J[i * 3 + 2]];

class SB {
  constructor() { this.v = []; }
  push(p, n, c, b) { this.v.push(p[0], p[1], p[2], n[0], n[1], n[2], c[0], c[1], c[2], c[3] || 0, b); }
  tri(P, N, Cc, Bb) {
    const g = crs(sub(P[1], P[0]), sub(P[2], P[0]));
    const s = dot(g, add(add(N[0], N[1]), N[2]));
    if (s >= 0) { this.push(P[0], N[0], Cc[0], Bb[0]); this.push(P[1], N[1], Cc[1], Bb[1]); this.push(P[2], N[2], Cc[2], Bb[2]); }
    else { this.push(P[0], N[0], Cc[0], Bb[0]); this.push(P[2], N[2], Cc[2], Bb[2]); this.push(P[1], N[1], Cc[1], Bb[1]); }
  }
  grid(P, ctr, col, bone, o = {}) {
    const R = P.length, Cn = P[0].length, wrap = o.wrap !== false;
    const N = P.map((row) => row.map(() => [0, 0, 0]));
    const cols = wrap ? Cn : Cn - 1;
    for (let i = 0; i < R - 1; i++) for (let j = 0; j < cols; j++) {
      const j1 = (j + 1) % Cn;
      const a = P[i][j], b = P[i][j1], c = P[i + 1][j1], d = P[i + 1][j];
      let n = crs(sub(c, a), sub(d, b));
      const cen = scl(add(add(a, b), add(c, d)), 0.25);
      if (dot(n, sub(cen, ctr(i + 0.5, cen))) < 0) n = scl(n, -1);
      for (const [ii, jj] of [[i, j], [i, j1], [i + 1, j1], [i + 1, j]]) { const q = N[ii][jj]; q[0] += n[0]; q[1] += n[1]; q[2] += n[2]; }
    }
    if (o.fixPole) for (const i of [0, R - 1]) { const s = [0, 0, 0]; for (const q of N[i]) { s[0] += q[0]; s[1] += q[1]; s[2] += q[2]; } for (const q of N[i]) { q[0] = s[0]; q[1] = s[1]; q[2] = s[2]; } }
    const NN = N.map((row) => row.map((q) => nrm(q)));
    const CC = P.map((row, i) => row.map((p, j) => col(p, NN[i][j], i, j)));
    const BB = P.map((row, i) => row.map((p, j) => (typeof bone === 'function' ? bone(p, i, j) : bone)));
    for (let i = 0; i < R - 1; i++) for (let j = 0; j < cols; j++) {
      const j1 = (j + 1) % Cn;
      const ids = [[i, j], [i, j1], [i + 1, j1], [i + 1, j]];
      if (o.skip && o.skip(i, j)) continue;
      const pp = ids.map(([a, b]) => P[a][b]), nn = ids.map(([a, b]) => NN[a][b]), cc = ids.map(([a, b]) => CC[a][b]), bb = ids.map(([a, b]) => BB[a][b]);
      this.tri([pp[0], pp[1], pp[2]], [nn[0], nn[1], nn[2]], [cc[0], cc[1], cc[2]], [bb[0], bb[1], bb[2]]);
      this.tri([pp[0], pp[2], pp[3]], [nn[0], nn[2], nn[3]], [cc[0], cc[2], cc[3]], [bb[0], bb[2], bb[3]]);
    }
  }
  cap(ring, center, col, bone, out) {
    const n = nrm(out);
    for (let j = 0; j < ring.length; j++) {
      const a = ring[j], b = ring[(j + 1) % ring.length];
      this.tri([center, a, b], [n, n, n], [col(center, n), col(a, n), col(b, n)], [bone, bone, bone]);
    }
  }
  ell(c, r, col, bone, o = {}) {
    const seg = o.seg || 10, rows = o.rows || 7, e1 = o.e1 || 1, e2 = o.e2 || 1;
    const f = (w, e) => Math.sign(w) * Math.pow(Math.abs(w), e);
    const T = o.T;
    const P = [];
    for (let i = 0; i <= rows; i++) {
      const v = -Math.PI / 2 + (Math.PI * i) / rows, cv = Math.cos(v), sv = Math.sin(v);
      const row = [];
      for (let j = 0; j < seg; j++) {
        const u = -Math.PI + (2 * Math.PI * j) / seg;
        let p = [r[0] * f(cv, e1) * f(Math.cos(u), e2), r[1] * f(sv, e1), r[2] * f(cv, e1) * f(Math.sin(u), e2)];
        if (o.def) p = o.def(p);
        if (T) p = [T[0] * p[0] + T[3] * p[1] + T[6] * p[2], T[1] * p[0] + T[4] * p[1] + T[7] * p[2], T[2] * p[0] + T[5] * p[1] + T[8] * p[2]];
        row.push([c[0] + p[0], c[1] + p[1], c[2] + p[2]]);
      }
      P.push(row);
    }
    this.grid(P, () => c, col, bone, { fixPole: true });
  }
  tube(a, b, r0, r1, col, bone, o = {}) {
    const seg = o.seg || 6, ax = nrm(sub(b, a));
    const ref = Math.abs(ax[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    const u = nrm(crs(ax, ref)), w = crs(ax, u);
    const rows = o.rows || 1;
    const P = [];
    for (let i = 0; i <= rows; i++) {
      const t = i / rows, c = add(a, scl(sub(b, a), t)), r = r0 + (r1 - r0) * t;
      const row = [];
      for (let j = 0; j < seg; j++) { const th = (j / seg) * Math.PI * 2; row.push(add(c, add(scl(u, Math.cos(th) * r), scl(w, Math.sin(th) * r)))); }
      P.push(row);
    }
    this.grid(P, (i, p) => { const t = clamp(dot(sub(p, a), ax) / (Math.hypot(...sub(b, a)) || 1), 0, 1); return add(a, scl(sub(b, a), t)); }, col, bone);
    if (o.cap !== false) { this.cap(P[rows], b, col, typeof bone === 'function' ? bone(b) : bone, ax); this.cap(P[0], a, col, typeof bone === 'function' ? bone(a) : bone, scl(ax, -1)); }
  }
}

const rotX = (a) => { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, s, 0, -s, c]; };
const rotZ = (a) => { const c = Math.cos(a), s = Math.sin(a); return [c, s, 0, -s, c, 0, 0, 0, 1]; };

const PAL = {
  bloodOld: C('#3A0806'), bloodNew: C('#7A0E0A'), bloodWet: C('#5C0907'), bone: C('#D9CDB0'), gum: C('#5A1A16'), mouth: C('#1A0706'),
  tooth: C('#C9BD98'), toothZ: C('#9C8D5E'), eyeW: C('#E8E4DA'), dirt: C('#3E3326'), flesh: C('#8A2A22'), gut: C('#8E3A36'),
};

function painter(L) {
  const seed = L.seed || 1;
  const z = !!L.zombie;
  const skin = C(L.skin || '#C08A68');
  const gore = L.gore || {};
  const blood = L.blood == null ? (z ? 0.6 : 0) : L.blood;
  const dirt = L.dirt == null ? (z ? 0.55 : 0.18) : L.dirt;
  const mouth = [0, 1.61, 0.1];
  const wounds = (L.wounds || []).map((w) => ({ c: w[0], r: w[1] }));
  const bloodAt = (p, n, tag) => {
    if (blood <= 0) return 0;
    let m = 0;
    const drip = fb3(p[0] * 11, p[1] * 2.6, p[2] * 11, seed + 3);
    const blot = fb3(p[0] * 7, p[1] * 7, p[2] * 7, seed + 9);
    if (z) {
      const dm = Math.hypot(p[0] - mouth[0], (p[1] - mouth[1]) * 0.6, p[2] - mouth[2]);
      m = Math.max(m, sstep(0.07, 0.015, dm) * 1.1);
      if (p[2] > 0.0 && p[1] < 1.56 && p[1] > 1.0) { const col = vn3(p[0] * 16 + seed, 0.5, seed, seed + 17); const fall = sstep(1.0, 1.5, p[1] + (col - 0.5) * 0.3) * sstep(0.55, 0.72, col) * sstep(0.2, 0.05, Math.abs(p[0])); m = Math.max(m, fall * sstep(0.42, 0.62, drip + 0.1 * blood)); }
      if (p[1] > 1.42 && p[1] < 1.56) m = Math.max(m, sstep(0.55, 0.75, blot + drip * 0.3) * 0.9);
      if (tag === 'skin' && p[1] < 1.0 && Math.abs(p[0]) > 0.17) m = Math.max(m, sstep(0.5, 0.68, drip) * 0.85);
    }
    m = Math.max(m, sstep(0.73 - blood * 0.06, 0.83 - blood * 0.06, blot) * (0.55 + 0.45 * blood));
    for (const w of wounds) { const d = Math.hypot(p[0] - w.c[0], p[1] - w.c[1], p[2] - w.c[2]); m = Math.max(m, sstep(w.r * 1.9, w.r * 0.6, d + (drip - 0.5) * 0.05)); if (p[1] < w.c[1] && Math.abs(p[0] - w.c[0]) < w.r && Math.abs(p[2] - w.c[2]) < w.r * 1.6) m = Math.max(m, sstep(0.55, 0.75, drip) * sstep(w.c[1] - 0.45, w.c[1], p[1])); }
    return clamp(m, 0, 1);
  };
  const bloodCol = (p) => mixc(PAL.bloodOld, PAL.bloodNew, vn3(p[0] * 30, p[1] * 30, p[2] * 30, seed + 21));
  const finish = (base, p, n, tag, mat) => {
    let c = base;
    if (dirt > 0) {
      const d = fb3(p[0] * 9 + 3, p[1] * 9, p[2] * 9, seed + 5);
      const low = tag === 'pants' || tag === 'shoe' ? sstep(0.7, 0.15, p[1]) * 0.6 : 0;
      c = mixc(c, mixc(c, PAL.dirt, 0.6), clamp((d - 0.42) * 2.2 * dirt + low * dirt, 0, 0.85));
      c = mulc(c, 0.9 + 0.12 * vn3(p[0] * 40, p[1] * 40, p[2] * 40, seed + 2));
    }
    const b = tag === 'eye' || tag === 'iris' || tag === 'metal' ? 0 : bloodAt(p, n, tag);
    if (b > 0.02) { c = mixc(c, bloodCol(p), b); mat = mat * (1 - b) + 0.26 * b; }
    return [c[0], c[1], c[2], mat];
  };
  const skinCol = (p) => {
    let c = skin;
    if (z) {
      const rot = fb3(p[0] * 6, p[1] * 6, p[2] * 6, seed + 31);
      c = mixc(c, C(L.rot || '#5C6A4E'), sstep(0.45, 0.8, rot) * 0.7);
      const bruise = fb3(p[0] * 9, p[1] * 9, p[2] * 9, seed + 41);
      c = mixc(c, C(L.bruise || '#5E4A5C'), sstep(0.6, 0.85, bruise) * 0.6);
      const vein = Math.abs(vn3(p[0] * 26, p[1] * 18, p[2] * 26, seed + 51) - 0.5);
      c = mixc(c, C('#3E3A50'), sstep(0.05, 0.0, vein) * 0.35);
      if (L.burn) { const cr = fb3(p[0] * 14, p[1] * 14, p[2] * 14, seed + 61); c = mixc(C('#2A211C'), C('#5A3226'), cr); if (cr > 0.72) c = mixc(c, C('#9A2E12'), (cr - 0.72) * 3); }
    } else {
      c = mulc(c, 0.94 + 0.08 * vn3(p[0] * 20, p[1] * 20, p[2] * 20, seed + 3));
    }
    return c;
  };
  return { seed, skin, skinCol, finish, bloodAt, z, gore };
}

const TORSO_M = [
  [0.80, 0.118, 0.078, 0.084, 0.0], [0.84, 0.148, 0.094, 0.1, 0.0], [0.89, 0.166, 0.099, 0.108, -0.004], [0.95, 0.17, 0.097, 0.11, -0.008],
  [1.0, 0.163, 0.094, 0.1, -0.005], [1.05, 0.151, 0.094, 0.092, 0.0], [1.11, 0.149, 0.099, 0.09, 0.004], [1.17, 0.157, 0.105, 0.094, 0.006],
  [1.23, 0.169, 0.114, 0.1, 0.006], [1.29, 0.179, 0.12, 0.104, 0.004], [1.35, 0.187, 0.118, 0.104, 0.0], [1.4, 0.19, 0.105, 0.1, -0.006],
  [1.435, 0.176, 0.088, 0.092, -0.01], [1.462, 0.145, 0.074, 0.08, -0.01], [1.488, 0.098, 0.066, 0.068, -0.006], [1.51, 0.07, 0.06, 0.062, -0.004],
];

function torsoRings(L, lod) {
  const fat = L.fat || 0, fem = L.female ? 1 : 0, mus = L.muscle || 0;
  const prof = lod ? TORSO_M : TORSO_M.filter((r, i) => i % 2 === 0 || i === TORSO_M.length - 1);
  return prof.map(([y, rx, rzf, rzb, zo]) => {
    let RX = rx, RF = rzf, RB = rzb;
    const belly = Math.exp(-Math.pow((y - 1.08) / 0.13, 2));
    RF += fat * 0.08 * belly; RX += fat * 0.035 * Math.exp(-Math.pow((y - 1.05) / 0.25, 2)); RB += fat * 0.02 * belly;
    if (fem) {
      RX += 0.014 * Math.exp(-Math.pow((y - 0.92) / 0.06, 2)) - 0.022 * Math.exp(-Math.pow((y - 1.09) / 0.07, 2)) - 0.016 * sstep(1.3, 1.42, y);
      RF += 0.03 * Math.exp(-Math.pow((y - 1.3) / 0.045, 2));
    }
    if (mus) { RX += mus * 0.03 * sstep(1.15, 1.38, y) * (1 - sstep(1.44, 1.5, y)); RF += mus * 0.025 * Math.exp(-Math.pow((y - 1.31) / 0.08, 2)); }
    return [y, RX, RF, RB, zo];
  });
}

function hring(y, rx, rf, rb, zo, seg, e = 2.4) {
  const row = [];
  for (let j = 0; j < seg; j++) {
    const th = (j / seg) * Math.PI * 2, c = Math.cos(th), s = Math.sin(th);
    const x = Math.sign(c) * Math.pow(Math.abs(c), 2 / e) * rx, zz = Math.sign(s) * Math.pow(Math.abs(s), 2 / e) * (s >= 0 ? rf : rb);
    row.push([x, y, zz + zo]);
  }
  return row;
}

function limb(sb, pts, stations, seg, col, boneAt, o = {}) {
  const segs = [];
  let tot = 0;
  for (let i = 0; i < pts.length - 1; i++) { const l = Math.hypot(...sub(pts[i + 1], pts[i])); segs.push(l); tot += l; }
  const at = (t) => {
    let d = t * tot;
    for (let i = 0; i < segs.length; i++) { if (d <= segs[i] || i === segs.length - 1) { const k = clamp(d / segs[i], 0, 1); return { p: add(pts[i], scl(sub(pts[i + 1], pts[i]), k)), ax: nrm(sub(pts[i + 1], pts[i])), i }; } d -= segs[i]; }
    return null;
  };
  const side = o.side || 1;
  const rows = [], info = [];
  for (const st of stations) {
    const A = at(st[0]);
    let ax = A.ax;
    if (st[3]) ax = nrm(add(ax, st[3]));
    const ref = o.ref || [side, 0, 0];
    const u = nrm(sub(ref, scl(ax, dot(ref, ax)))), w = crs(ax, u);
    const r = st[1], ry = r * (st[2] || 1);
    const row = [];
    for (let j = 0; j < seg; j++) { const th = (j / seg) * Math.PI * 2; row.push(add(A.p, add(scl(u, Math.cos(th) * r), scl(w, Math.sin(th) * ry)))); }
    rows.push(row);
    info.push({ t: st[0], c: A.p, tag: st[4] });
  }
  sb.grid(rows, (i) => info[Math.min(info.length - 1, Math.round(i))].c, (p, n, i) => col(p, n, info[i].t, info[i].tag), (p, i) => boneAt(info[i].t));
  return { rows, info };
}

function headGeo(sb, L, P, lod) {
  const z = P.z;
  const H = 4;
  const cx = 0, cy = 1.655, cz = 0.006, rx = 0.083 * (L.headW || 1), ry = 0.11, rz = 0.1;
  const rows = lod ? 13 : 8, seg = lod ? 18 : 10;
  const def = (x, y, zz) => {
    let sx = 1, sz = 1;
    if (y < -0.12) { const k = (-0.12 - y) / 0.88; sx = 1 - 0.3 * Math.pow(k, 1.3); sz = zz > 0 ? 1 - 0.05 * k : 1 - 0.5 * k; }
    if (zz > 0.5 && y < -0.6) sz *= 1.04;
    if (zz < 0 && y > -0.35) sz *= 1.07;
    if (zz > 0.3 && y > -0.2 && y < 0.6) sz *= 0.94;
    if (zz > 0.45) { const d = Math.hypot(Math.abs(x) - 0.39, (y - 0.11) * 1.3); if (d < 0.26) sz *= 1 - 0.1 * Math.pow(1 - d / 0.26, 2); }
    if (z && zz > 0.2 && y < -0.3) sz *= 0.8;
    return [cx + x * rx * sx, cy + y * ry, cz + zz * rz * sz];
  };
  const G = [];
  for (let i = 0; i <= rows; i++) {
    const ph = (i / rows) * Math.PI;
    const row = [];
    for (let j = 0; j < seg; j++) { const th = (j / seg) * Math.PI * 2; row.push(def(Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th))); }
    G.push(row);
  }
  const eyeY = cy + 0.012, eyeX = 0.032;
  const hc = L.hair ? C(L.hair) : null;
  const col = (p, n) => {
    const ny = (p[1] - cy) / ry;
    let c = P.skinCol(p), mat = z ? 0.1 : 0.06, tag = 'skin';
    for (const s of [-1, 1]) { const d = Math.hypot(p[0] - s * eyeX, (p[1] - eyeY) * 1.4, Math.max(0, 0.08 - p[2])); if (d < 0.03 && p[2] > 0.04) c = mixc(c, z ? C('#2A1C1C') : mulc(c, 0.72), sstep(0.03, 0.012, d) * (z ? 0.85 : 0.5)); }
    if (p[2] > 0.06 && Math.abs(p[0]) < 0.03 && Math.abs(p[1] - (cy - 0.045)) < 0.007) { c = z ? PAL.mouth : mixc(c, C(L.lip || '#9A5A50'), 0.6); }
    if (z && p[2] > 0.05 && ny < -0.3) { c = mixc(PAL.mouth, PAL.gum, vn3(p[0] * 50, p[1] * 50, p[2] * 50, 3)); mat = 0.3; tag = 'eye'; }
    if (hc && L.beard && p[2] > -0.02 && ny < -0.15 && !(Math.abs(p[0]) < 0.026 && Math.abs(p[1] - (cy - 0.045)) < 0.007)) { const k = sstep(-0.15, -0.35, ny) * (0.75 + 0.25 * vn3(p[0] * 90, p[1] * 90, p[2] * 90, 5)); c = mixc(c, hc, k * (L.beard === 'stubble' ? 0.22 : 0.95)); }
    if (L.gore && L.gore.scalp && ny > 0.55 && p[0] > -0.02) { const k = sstep(0.55, 0.75, ny); c = mixc(c, mixc(PAL.bone, PAL.flesh, vn3(p[0] * 60, p[1] * 60, p[2] * 60, 9) * 0.6), k); }
    return P.finish(c, p, n, tag, mat);
  };
  sb.grid(G, () => [cx, cy, cz], col, H, { fixPole: true });
  const sk = (p, n) => P.finish(P.skinCol(p), p, n, 'skin', 0.06);
  sb.ell([0, cy + 0.002, cz + rz * 0.93], [0.0135, 0.024, 0.017], sk, H, { seg: 7, rows: 5, def: (p) => [p[0] * (1 - Math.max(0, p[1]) * 6), p[1], p[2] + Math.max(0, -p[1]) * 0.15] });
  sb.ell([0, cy + 0.034, cz + rz * 0.84], [0.06, 0.011, 0.016], sk, H, { seg: 9, rows: 4 });
  for (const s of [-1, 1]) sb.ell([s * rx * 1.0, cy + 0.005, -0.006], [0.011, 0.025, 0.017], sk, H, { seg: 7, rows: 5 });
  const eyeMissing = L.gore && L.gore.eye;
  for (const s of [-1, 1]) {
    if (eyeMissing && s === 1) { sb.ell([s * eyeX, eyeY, cz + rz * 0.8], [0.012, 0.011, 0.006], (p, n) => [...PAL.bloodWet, 0.3], H, { seg: 7, rows: 4 }); continue; }
    const ec = z ? C(L.eyes || '#C9C2A0') : PAL.eyeW;
    const ez = cz + rz * 0.82;
    sb.ell([s * eyeX, eyeY, ez], [0.0115, 0.0105, 0.0085], (p, n) => { const fr = p[2] > ez + 0.0048; const ic = z ? C(L.iris || '#8A8468') : C(L.irisC || '#4A3222'); let c = ec; if (fr) c = Math.hypot(p[0] - s * eyeX, p[1] - eyeY) < 0.0042 ? (z ? mulc(ic, 0.7) : C('#141010')) : ic; if (z && !fr) c = mixc(c, C('#8A3A30'), 0.25); return [c[0], c[1], c[2], z ? 0.86 : 0.25]; }, H, { seg: 8, rows: 5 });
    if (!z) sb.ell([s * eyeX, cy + 0.031, cz + rz * 0.99], [0.017, 0.0035, 0.005], () => [...mulc(hc || C('#2A2018'), 0.8), 0], H, { seg: 6, rows: 3 });
  }
  if (z) {
    sb.ell([0, cy - 0.04, cz + rz * 0.8], [0.03, 0.0065, 0.008], (p) => [...mixc(PAL.toothZ, PAL.bloodOld, vn3(p[0] * 120, 0, 0, 4) * 0.5), 0.2], H, { seg: 8, rows: 3, e2: 0.4 });
    if (!(L.gore && L.gore.jaw)) {
      const jc = (p, n) => { let c = P.skinCol(p); if (p[1] > cy - 0.056 && p[2] > 0.06) c = PAL.gum; return P.finish(c, p, n, 'skin', 0.1); };
      sb.ell([0, cy - 0.076, 0.046], [0.06, 0.031, 0.052], jc, BN.JAW, { seg: lod ? 12 : 8, rows: 6, def: (p) => [p[0] * (1 - Math.max(0, p[2] - 0.02) * 4), p[1], p[2]] });
      sb.ell([0, cy - 0.05, cz + rz * 0.78], [0.026, 0.006, 0.007], (p) => [...mixc(PAL.toothZ, PAL.bloodOld, 0.3), 0.2], BN.JAW, { seg: 8, rows: 3, e2: 0.4 });
    } else {
      sb.tube([0, cy - 0.056, 0.06], [0.01, cy - 0.118, 0.085], 0.014, 0.01, () => [...C('#7A2A2E'), 0.3], H, { seg: 6 });
    }
  }
  if (hc) hairGeo(sb, L, hc, { cx, cy, cz, rx, ry, rz }, lod, P);
  if (L.hat) hatGeo(sb, L, { cx, cy, cz, rx, ry, rz }, lod, P);
}

function hairGeo(sb, L, hc, S, lod, P) {
  const style = L.hairStyle || 'short';
  if (style === 'bald') return;
  const rows = lod ? 10 : 6, seg = lod ? 18 : 10;
  const k = style === 'buzz' ? 1.03 : style === 'long' || style === 'pony' || style === 'bun' ? 1.075 : 1.07;
  const lim = (th) => {
    const f = Math.sin(th);
    const front = style === 'buzz' ? 0.36 : 0.33, sideL = 0.52, back = style === 'long' ? 0.86 : 0.72;
    return f > 0 ? sideL + (front - sideL) * f : sideL + (back - sideL) * -f;
  };
  const G = [];
  for (let i = 0; i <= rows; i++) {
    const row = [];
    for (let j = 0; j < seg; j++) {
      const th = (j / seg) * Math.PI * 2, ph = (i / rows) * lim(th) * Math.PI;
      let x = Math.sin(ph) * Math.cos(th), y = Math.cos(ph), z = Math.sin(ph) * Math.sin(th);
      const mess = 1 + (vn3(x * 5, y * 5, z * 5, 11) - 0.5) * (style === 'buzz' ? 0.02 : 0.08) + (style === 'spiky' ? Math.max(0, y) * 0.12 * vn3(x * 12, 0, z * 12, 4) : 0);
      let sx = 1, sz = 1;
      if (y < -0.12) { const kk = (-0.12 - y) / 0.88; sx = 1 - 0.3 * kk; sz = z > 0 ? 1 : 1 - 0.45 * kk; }
      if (z < 0 && y > -0.35) sz *= 1.07;
      const kk = i === rows ? 0.985 : i === rows - 1 ? (k + 0.985) / 2 : k;
      row.push([S.cx + x * S.rx * kk * mess * sx, S.cy + y * S.ry * kk * mess + 0.004, S.cz + z * S.rz * kk * mess * sz]);
    }
    G.push(row);
  }
  const col = (p) => { const str = vn3(p[0] * 260, p[1] * 40, p[2] * 260, 7) * 0.7 + vn3(p[0] * 70, p[1] * 20, p[2] * 70, 9) * 0.3; const c = mulc(hc, 0.72 + 0.45 * str); return P.finish(c, p, [0, 1, 0], 'hair', 0.05); };
  sb.grid(G, () => [S.cx, S.cy, S.cz], col, BN.HED, { fixPole: true });
  if (style === 'long') {
    const pts = [[0, 1.69, -0.06], [0, 1.6, -0.1], [0, 1.47, -0.115], [0, 1.36, -0.11]];
    limb(sb, pts, [[0, 0.085, 0.7], [0.3, 0.09, 0.55], [0.65, 0.085, 0.45], [1, 0.07, 0.3]], lod ? 10 : 6, (p) => col(p), (t) => (t < 0.35 ? BN.HED : BN.CHS), { ref: [1, 0, 0] });
  }
  if (style === 'pony') sb.tube([0, 1.72, -0.095], [0, 1.52, -0.135], 0.028, 0.012, (p) => col(p), BN.HED, { seg: 7, rows: 3 });
  if (style === 'bun') sb.ell([0, 1.76, -0.075], [0.035, 0.032, 0.033], (p) => col(p), BN.HED, { seg: 8, rows: 5 });
}

function hatGeo(sb, L, S, lod, P) {
  const hat = L.hat;
  const hc = C(L.hatCol || '#3A3A3A');
  const fin = (c, mat) => (p, n) => P.finish(c, p, n, 'metal', mat);
  if (hat === 'cap' || hat === 'capb') {
    sb.ell([0, S.cy + 0.035, S.cz - 0.005], [S.rx * 1.12, S.ry * 0.78, S.rz * 1.1], fin(hc, 0), BN.HED, { seg: lod ? 16 : 9, rows: 6, def: (p) => (p[1] < 0 ? [p[0], p[1] * 0.2, p[2]] : p) });
    const dir = hat === 'capb' ? -1 : 1;
    sb.ell([0, S.cy + 0.018, S.cz + dir * S.rz * 1.18], [0.07, 0.006, 0.055], fin(mulc(hc, 0.85), 0), BN.HED, { seg: 10, rows: 3 });
  } else if (hat === 'hard') {
    sb.ell([0, S.cy + 0.03, S.cz], [S.rx * 1.25, S.ry * 0.9, S.rz * 1.22], fin(hc, 0.2), BN.HED, { seg: lod ? 16 : 9, rows: 6, def: (p) => (p[1] < 0 ? [p[0], p[1] * 0.1, p[2]] : p) });
    sb.ell([0, S.cy + 0.03, S.cz + 0.01], [S.rx * 1.45, 0.006, S.rz * 1.5], fin(mulc(hc, 0.9), 0.2), BN.HED, { seg: 12, rows: 3 });
  } else if (hat === 'helmet' || hat === 'riot') {
    sb.ell([0, S.cy + 0.02, S.cz - 0.004], [S.rx * 1.3, S.ry * 1.02, S.rz * 1.28], fin(hc, 0.24), BN.HED, { seg: lod ? 16 : 9, rows: 7, def: (p) => (p[1] < -0.02 && p[2] > 0 ? [p[0], -0.02 + (p[1] + 0.02) * 0.3, p[2]] : p) });
    if (hat === 'riot') sb.ell([0, S.cy - 0.005, S.cz + S.rz * 1.1], [S.rx * 1.15, S.ry * 0.62, 0.03], (p) => [0.16, 0.2, 0.24, 0.66], BN.HED, { seg: 12, rows: 5, def: (p) => [p[0], p[1], p[2] - Math.abs(p[0]) * 0.6] });
  } else if (hat === 'beanie') {
    sb.ell([0, S.cy + 0.025, S.cz - 0.004], [S.rx * 1.12, S.ry * 0.95, S.rz * 1.1], (p, n) => P.finish(mulc(hc, 0.85 + 0.2 * (Math.sin(p[0] * 300) * 0.5 + 0.5)), p, n, 'hair', 0), BN.HED, { seg: lod ? 16 : 9, rows: 7, def: (p) => (p[1] < -0.35 ? [p[0], -0.35, p[2]] : p) });
  } else if (hat === 'hood') {
    sb.ell([0, S.cy + 0.01, S.cz - 0.025], [S.rx * 1.38, S.ry * 1.18, S.rz * 1.3], (p, n) => P.finish(hc, p, n, 'shirt', 0), BN.HED, { seg: lod ? 16 : 9, rows: 8, def: (p) => (p[2] > 0.035 && p[1] > -0.06 ? [p[0], p[1], 0.035 + (p[2] - 0.035) * 0.15] : p) });
  }
}

function handGeo(sb, s, J, col, glove) {
  const W = JP(J, s > 0 ? 7 : 10), b = s > 0 ? BN.HAL : BN.HAR;
  const c = (p, n) => col(p, n, glove ? 'glove' : 'skin');
  sb.ell([W[0] + s * 0.004, W[1] - 0.045, W[2] + 0.008], [0.019, 0.042, 0.04], c, b, { seg: 8, rows: 5, e1: 0.7, e2: 0.7 });
  sb.ell([W[0] + s * 0.002, W[1] - 0.1, W[2] + 0.02], [0.017, 0.034, 0.038], c, b, { seg: 8, rows: 5, e1: 0.7, e2: 0.8, T: rotX(0.55) });
  sb.tube([W[0] - s * 0.008, W[1] - 0.03, W[2] + 0.035], [W[0] - s * 0.018, W[1] - 0.075, W[2] + 0.055], 0.011, 0.009, c, b, { seg: 6 });
}

function footGeo(sb, s, J, col) {
  const A = JP(J, s > 0 ? 13 : 16), b = s > 0 ? BN.FTL : BN.FTR;
  sb.ell([A[0], 0.05, A[2] + 0.04], [0.05, 0.05, 0.128], (p, n) => col(p, n, 'shoe'), b, { seg: 10, rows: 6, e1: 0.55, e2: 0.65, def: (p) => [p[0], p[1] + (p[2] > 0.05 ? -0.012 * (p[2] - 0.05) / 0.08 : 0), p[2]] });
  sb.ell([A[0], 0.012, A[2] + 0.04], [0.054, 0.012, 0.132], (p, n) => col(p, n, 'sole'), b, { seg: 10, rows: 3, e1: 0.4, e2: 0.6 });
}

export function buildBody(L, lod = 1) {
  const J = makeJoints(L);
  const P = painter(L);
  const sb = new SB();
  const z = P.z;
  const g = L.gore || {};
  const shirt = C(L.shirt || '#6A7A8A'), pants = C(L.pants || '#3A4250'), shoe = C(L.shoe || '#2A2622');
  const waist = L.waist || 0.99;
  const tagCol = (tag, p) => {
    if (tag === 'shirt') {
      let c = shirt;
      if (L.pattern === 'plaid') { const a = Math.sin(p[0] * 90) > 0.6 || Math.sin(p[1] * 90) > 0.6; c = a ? C(L.plaid || '#202830') : c; }
      if (L.pattern === 'stripe') c = Math.sin(p[1] * 110) > 0.5 ? C(L.plaid || '#E8E4DA') : c;
      if (L.pattern === 'vest' && Math.abs(p[0]) > 0.02 && p[1] > 1.0 && p[1] < 1.45) { c = C(L.vest || '#D8E030'); const st = Math.abs(p[1] - 1.12) < 0.018 || Math.abs(p[1] - 1.26) < 0.018; if (st) c = C('#E0E2DC'); }
      if (L.tie && p[2] > 0 && Math.abs(p[0]) < 0.022 - (1.45 - p[1]) * 0.006 && p[1] > 1.12 && p[1] < 1.47) c = C(L.tie);
      if (L.zip && p[2] > 0.05 && Math.abs(p[0]) < 0.006 && p[1] > 0.98) c = C(L.zip);
      if (L.straps && p[1] > 1.12 && Math.abs(Math.abs(p[0]) - 0.085) < 0.016) c = C(L.straps);
      if (L.vneck && p[2] > 0 && p[1] > 1.4 - (0.06 - Math.abs(p[0])) * 1.2 && Math.abs(p[0]) < 0.06) return 'skin';
      return c;
    }
    if (tag === 'pants') {
      let c = pants;
      if (Math.abs(p[1] - waist) < 0.02 && L.belt !== false) c = C(L.belt || '#2A1E16');
      if (L.pattern === 'camo') { const k = vn3(p[0] * 14, p[1] * 14, p[2] * 14, 3); c = k > 0.62 ? C('#3A4228') : k < 0.38 ? C('#6A6648') : c; }
      return c;
    }
    if (tag === 'shoe') return shoe;
    if (tag === 'sole') return C('#1C1A18');
    if (tag === 'glove') return C(L.glove || '#2A2A2A');
    return null;
  };
  const tears = (p, tag) => {
    if (!z || (tag !== 'shirt' && tag !== 'pants')) return false;
    const n = fb3(p[0] * 8 + 1, p[1] * 8, p[2] * 8, P.seed + 71);
    return n > 0.74 - (L.torn || 0.1) * 0.25;
  };
  const colOf = (p, n, tag, mat0) => {
    if (tag === 'skin') return P.finish(P.skinCol(p), p, n, 'skin', z ? 0.12 : 0.06);
    let c = tagCol(tag, p);
    if (c === 'skin') return P.finish(P.skinCol(p), p, n, 'skin', 0.06);
    if (tears(p, tag)) {
      const n2 = fb3(p[0] * 8 + 1, p[1] * 8, p[2] * 8, P.seed + 71);
      const e = n2 > 0.79 - (L.torn || 0.1) * 0.25;
      return e ? P.finish(mixc(P.skinCol(p), PAL.flesh, 0.35), p, n, 'skin', 0.15) : P.finish(mixc(c, PAL.bloodOld, 0.5), p, n, tag, 0.1);
    }
    const mat = tag === 'shoe' ? 0.24 : tag === 'glove' ? 0.12 : mat0 || 0;
    return P.finish(c, p, n, tag, mat);
  };

  const seg = lod ? 20 : 10;
  const TR = torsoRings(L, lod);
  const legless = !!g.legless;
  const ringsT = TR.filter((r) => !legless || r[0] >= 0.88).map(([y, rx, rf, rb, zo]) => hring(y, rx, rf, rb, zo, seg));
  const ys = TR.filter((r) => !legless || r[0] >= 0.88).map((r) => r[0]);
  const topY = L.neckTop || 1.475;
  const ribs = g.ribs ? { x: g.ribs * 0.1, y: 1.24 } : null;
  const gut = g.guts ? [0.03 * g.guts, 1.07] : null;
  sb.grid(ringsT, (i) => [0, ys[Math.min(ys.length - 1, Math.round(i))], 0], (p, n, i) => {
    let tag = p[1] > waist + 0.012 ? 'shirt' : 'pants';
    if (L.shirtless && tag === 'shirt') tag = 'skin';
    if (L.crop && tag === 'shirt' && p[1] < 1.12) tag = 'skin';
    if (p[1] > topY && tag === 'shirt' && !L.collar) tag = 'skin';
    if (ribs && Math.hypot((p[0] - ribs.x) * 1.2, p[1] - ribs.y) < 0.09 && p[2] > 0) { const k = Math.hypot((p[0] - ribs.x) * 1.2, p[1] - ribs.y); return [...(k < 0.075 ? mixc(PAL.flesh, PAL.mouth, 0.5) : PAL.bloodWet), 0.3]; }
    if (gut && Math.hypot(p[0] - gut[0], p[1] - gut[1]) < 0.065 && p[2] > 0) return [...mixc(PAL.gut, PAL.mouth, 0.4), 0.32];
    if (L.bloat) { const pu = vn3(p[0] * 26, p[1] * 26, p[2] * 26, 5); if (pu > 0.8 && tag !== 'pants') return [...mixc(C('#B8B84A'), C('#E0D870'), (pu - 0.8) * 5), 0.85]; }
    return colOf(p, n, tag);
  }, (p) => (p[1] < 1.03 ? BN.PEL : p[1] < 1.19 ? BN.SPN : p[1] < 1.495 ? BN.CHS : BN.NCK));
  if (legless) {
    const r0 = ringsT[0];
    const c0 = [0, ys[0] - 0.03, 0];
    sb.cap(r0, c0, (p) => [...mixc(PAL.flesh, PAL.bloodWet, vn3(p[0] * 50, p[2] * 50, 1, 2)), 0.3], BN.PEL, [0, -1, 0]);
    sb.tube([0, ys[0], -0.05], [0, ys[0] - 0.12, -0.07], 0.018, 0.012, () => [...PAL.bone, 0.2], BN.PEL, { seg: 6, rows: 2 });
    for (const s of [-1, 1]) sb.tube([s * 0.09, ys[0] + 0.01, 0.0], [s * 0.1, ys[0] - 0.08, 0.02], 0.05, 0.035, (p) => [...mixc(PAL.flesh, PAL.bloodOld, 0.5), 0.3], BN.PEL, { seg: 7, rows: 2 });
  }
  if (ribs) for (let k = 0; k < 4; k++) {
    const y = ribs.y + 0.045 - k * 0.03, x0 = ribs.x - 0.06, x1 = ribs.x + 0.06;
    const pts = [];
    for (let q = 0; q <= 4; q++) { const x = x0 + (x1 - x0) * (q / 4); const r = TR.find((rr) => rr[0] >= y) || TR[TR.length - 1]; const zf = r[2] * Math.sqrt(Math.max(0, 1 - Math.pow(Math.abs(x) / r[1], 2.4))); pts.push([x, y - Math.abs(x - ribs.x) * 0.15, zf + 0.004]); }
    for (let q = 0; q < 4; q++) sb.tube(pts[q], pts[q + 1], 0.0055, 0.0055, () => [...PAL.bone, 0.2], BN.CHS, { seg: 5, cap: false });
  }
  if (gut) for (let k = 0; k < 3; k++) {
    const a = [gut[0] + (k - 1) * 0.02, gut[1] - 0.01, 0.1];
    const b = [gut[0] + (k - 1) * 0.04, gut[1] - 0.12 - k * 0.05, 0.12 + k * 0.01];
    sb.tube(a, b, 0.016, 0.013, (p) => [...mixc(PAL.gut, C('#B05A50'), vn3(p[1] * 40, 0, 0, k)), 0.35], BN.SPN, { seg: 6, rows: 3 });
  }
  const NJ = JP(J, BN.NCK);
  const neck = [];
  const nseg = lod ? 12 : 8;
  for (const [y, r, zo] of [[1.465, 0.07, -0.004], [1.51, 0.064, 0.0], [1.55, 0.058, 0.004], [1.59, 0.055, 0.004]]) {
    const row = [];
    for (let j = 0; j < nseg; j++) { const th = (j / nseg) * Math.PI * 2; row.push([Math.cos(th) * r * (L.neckW || 1), y, NJ[2] + zo + Math.sin(th) * r * 0.95]); }
    neck.push(row);
  }
  sb.grid(neck, (i) => [0, 1.465 + i * 0.042, 0], (p, n) => {
    if (L.collar && p[1] < 1.53) return colOf(p, n, 'shirt');
    if (g.bite && p[0] > 0.02 && p[1] < 1.58) return [...mixc(PAL.flesh, PAL.mouth, vn3(p[1] * 60, p[2] * 60, 0, 3)), 0.3];
    return colOf(p, n, 'skin');
  }, (p) => (p[1] < 1.49 ? BN.CHS : p[1] < 1.575 ? BN.NCK : BN.HED));
  headGeo(sb, L, P, lod);

  const aseg = lod ? 10 : 6;
  const armR = L.arm || 1;
  const sleeve = L.sleeve == null ? 0.96 : L.sleeve;
  for (const s of [1, -1]) {
    const sh = JP(J, s > 0 ? 5 : 8), el = JP(J, s > 0 ? 6 : 9), wr = JP(J, s > 0 ? 7 : 10);
    const tE = Math.hypot(...sub(el, sh)) / (Math.hypot(...sub(el, sh)) + Math.hypot(...sub(wr, el)));
    const miss = (s > 0 && g.arm === 'L') || (s < 0 && g.arm === 'R');
    const sl = L.shirtless ? 0 : sleeve;
    const k = (L.muscle || 0) * 0.012 + (L.fat || 0) * 0.01;
    let st = [[0, 0.06 + k, 0.9], [0.06, 0.057 * armR + k, 0.92], [0.2, 0.051 * armR + k, 0.9], [0.34, 0.046 * armR + k * 0.8, 0.9], [tE - 0.04, 0.042 * armR, 0.9], [tE + 0.02, 0.043 * armR, 0.88], [tE + 0.1, 0.044 * armR + k * 0.6, 0.85], [0.78, 0.038 * armR, 0.8], [0.92, 0.032 * armR, 0.75], [1, 0.03 * armR, 0.72]];
    if (L.female) st = st.map((q) => [q[0], q[1] * 0.88, q[2]]);
    if (sl > 0.05 && sl < 0.99) {
      const i = st.findIndex((q) => q[0] > sl);
      const r = st[Math.max(0, i - 1)][1];
      st.splice(Math.max(1, i), 0, [sl - 0.004, r + 0.007, 0.9, null, 'cuff'], [sl + 0.004, r * 0.97, 0.9, null, 'skinE']);
    }
    if (miss) { st = st.filter((q) => q[0] < tE - 0.06); st.push([tE - 0.06, st[st.length - 1][1] * 0.9, 0.9, null, 'stump']); }
    sb.ell([sh[0] * 0.95, sh[1] - 0.018, sh[2]], [0.05 + k, 0.056 + k, 0.058 + k], (p, n) => colOf(p, n, sl > 0.05 ? 'shirt' : 'skin'), s > 0 ? BN.UAL : BN.UAR, { seg: aseg + 2, rows: 6 });
    const R = limb(sb, [sh, el, wr], st, aseg, (p, n, t, tag) => {
      if (tag === 'stump') return [...PAL.bloodWet, 0.3];
      const inS = tag === 'cuff' || (tag !== 'skinE' && t < sl);
      if (inS) return colOf(p, n, L.glove && t > 0.9 ? 'glove' : 'shirt');
      return colOf(p, n, L.glove && t > 0.9 ? 'glove' : 'skin');
    }, (t) => (t < tE ? (s > 0 ? BN.UAL : BN.UAR) : (s > 0 ? BN.FAL : BN.FAR)), { side: s });
    if (miss) {
      const last = R.rows[R.rows.length - 1], c = R.info[R.info.length - 1].c;
      sb.cap(last, c, (p) => [...mixc(PAL.flesh, PAL.bloodWet, vn3(p[0] * 80, p[1] * 80, p[2] * 80, 2)), 0.3], s > 0 ? BN.UAL : BN.UAR, sub(el, sh));
      sb.tube(c, add(c, scl(nrm(sub(el, sh)), 0.04)), 0.011, 0.009, () => [...PAL.bone, 0.2], s > 0 ? BN.UAL : BN.UAR, { seg: 6 });
      continue;
    }
    handGeo(sb, s, J, (p, n, tag) => colOf(p, n, tag), !!L.glove);
  }
  if (!legless) {
    const lseg = lod ? 10 : 6;
    for (const s of [1, -1]) {
      const hp = JP(J, s > 0 ? 11 : 14), kn = JP(J, s > 0 ? 12 : 15), an = JP(J, s > 0 ? 13 : 16);
      const tK = 0.5;
      const sh = L.shorts ? 0.4 : 2;
      const f = (L.fat || 0) * 0.018 + (L.muscle || 0) * 0.01, fe = L.female ? 0.006 : 0;
      const st = [[0, 0.088 + f + fe, 1.05], [0.08, 0.087 + f + fe, 1.05], [0.25, 0.078 + f * 0.8 + fe, 1.05], [0.42, 0.063 + f * 0.4, 1.0], [0.5, 0.055, 1.0], [0.56, 0.056, 1.04], [0.66, 0.058 + f * 0.3, 1.1], [0.8, 0.047, 1.05], [0.93, 0.038, 1.0], [1, 0.036, 1.0]];
      if (L.shorts) { const i = st.findIndex((q) => q[0] > sh); st.splice(i, 0, [sh - 0.004, st[i - 1][1] + 0.008, 1.05, null, 'cuff'], [sh + 0.004, st[i - 1][1] * 0.95, 1.05, null, 'skinE']); }
      limb(sb, [hp, kn, an], st, lseg, (p, n, t, tag) => {
        const inP = tag === 'cuff' || (tag !== 'skinE' && t < sh);
        if (L.boots && t > 0.78) return colOf(p, n, 'shoe');
        return colOf(p, n, inP ? 'pants' : 'skin');
      }, (t) => (t < tK ? (s > 0 ? BN.THL : BN.THR) : (s > 0 ? BN.SHL : BN.SHR)), { side: s, ref: [s, 0, 0] });
      footGeo(sb, s, J, (p, n, tag) => colOf(p, n, tag));
    }
  }
  extras(sb, L, P, J, lod, colOf);
  return finishMesh(sb, L, J);
}

function extras(sb, L, P, J, lod, colOf) {
  const seg = lod ? 12 : 8;
  if (L.pack) {
    const pc = C(L.pack);
    sb.ell([0, 1.24, -0.175], [0.135, 0.19, 0.075], (p, n) => P.finish(mulc(pc, 0.92 + 0.12 * (p[1] > 1.36 ? 0.6 : 0)), p, n, 'shirt', 0.04), BN.CHS, { seg, rows: 7, e1: 0.45, e2: 0.45 });
    sb.ell([0, 1.13, -0.24], [0.1, 0.06, 0.03], (p, n) => P.finish(mulc(pc, 0.8), p, n, 'shirt', 0.04), BN.CHS, { seg: 8, rows: 4, e1: 0.5, e2: 0.5 });
  }
  if (L.vestArmor) {
    const vc = C(L.vestArmor);
    sb.ell([0, 1.26, 0.035], [0.17, 0.18, 0.11], (p, n) => P.finish(mulc(vc, 0.92 + 0.1 * (Math.abs(p[1] - 1.2) < 0.03 ? 1 : 0)), p, n, 'metal', 0.18), BN.CHS, { seg: lod ? 14 : 8, rows: 6, e1: 0.4, e2: 0.6, def: (p) => [p[0], p[1], p[2] < -0.02 ? -0.02 + (p[2] + 0.02) * 0.1 : p[2]] });
    for (const s of [-1, 1]) sb.ell([s * 0.06, 1.13, 0.13], [0.035, 0.04, 0.02], (p, n) => P.finish(mulc(vc, 0.8), p, n, 'metal', 0.1), BN.CHS, { seg: 6, rows: 4, e1: 0.4, e2: 0.4 });
  }
  if (L.pads) for (const s of [-1, 1]) {
    const sh = JP(J, s > 0 ? 5 : 8);
    sb.ell([sh[0] + s * 0.015, sh[1] - 0.03, sh[2]], [0.065, 0.05, 0.07], (p, n) => P.finish(C(L.pads), p, n, 'metal', 0.2), s > 0 ? BN.UAL : BN.UAR, { seg: 8, rows: 5, def: (p) => (p[1] < 0 ? [p[0], p[1] * 0.3, p[2]] : p) });
  }
  if (L.hoodBack) sb.ell([0, 1.49, -0.085], [0.11, 0.055, 0.05], (p, n) => colOf(p, n, 'shirt'), BN.CHS, { seg: 8, rows: 5 });
  if (L.mask) sb.ell([0, 1.612, 0.07], [0.06, 0.035, 0.04], (p, n) => P.finish(C(L.mask), p, n, 'shirt', 0.05), BN.HED, { seg: 9, rows: 5 });
  if (L.glasses) for (const s of [-1, 1]) sb.ell([s * 0.032, 1.667, 0.101], [0.018, 0.013, 0.003], () => [0.1, 0.12, 0.14, 0.66], BN.HED, { seg: 8, rows: 3 });
  if (L.cross) for (const [w, hgt] of [[0.012, 0.042], [0.042, 0.012]]) sb.ell([0.075, 1.33, 0.118], [w * 0.5, hgt * 0.5, 0.006], () => [...C(L.cross), 0.05], BN.CHS, { seg: 8, rows: 4, e1: 0.2, e2: 0.2 });
  if (L.holster) sb.ell([-0.17, 0.92, 0.0], [0.03, 0.07, 0.045], (p, n) => P.finish(C('#2A221A'), p, n, 'shoe', 0.2), BN.PEL, { seg: 6, rows: 4, e1: 0.5, e2: 0.5 });
  if (L.pouch) sb.ell([0.1, 0.95, -0.12], [0.06, 0.05, 0.04], (p, n) => P.finish(C(L.pouch), p, n, 'shirt', 0.05), BN.PEL, { seg: 7, rows: 4, e1: 0.5, e2: 0.5 });
  if (L.skirt) {
    const rows = [];
    const sk = C(L.skirt);
    for (const [y, r] of [[1.0, 0.17], [0.86, 0.2], [0.68, 0.235]]) { const row = []; for (let j = 0; j < seg; j++) { const th = (j / seg) * Math.PI * 2; row.push([Math.cos(th) * r, y, Math.sin(th) * r * 0.75]); } rows.push(row); }
    sb.grid(rows, (i) => [0, 1.0 - i * 0.16, 0], (p, n) => P.finish(sk, p, n, 'pants', 0), BN.PEL);
  }
  if (L.spikes) for (let k = 0; k < 5; k++) {
    const a = (k - 2) * 0.09, b = [Math.sin(a) * 0.12 + (k % 2) * 0.04, 1.4 - Math.abs(k - 2) * 0.03, -0.09 - Math.cos(a) * 0.02];
    sb.tube(b, [b[0] * 1.2, b[1] + 0.09, b[2] - 0.08], 0.018, 0.002, () => [...PAL.bone, 0.2], BN.CHS, { seg: 5 });
  }
  if (L.throat) sb.ell([0, 1.52, 0.045], [0.06, 0.05, 0.05], () => [...C('#9CC23A'), 0.88], BN.NCK, { seg: 8, rows: 5 });
  if (L.boils) for (let k = 0; k < 9; k++) {
    const y = 0.95 + hh(k, 1, 2, 7) * 0.5, a = hh(k, 3, 4, 7) * Math.PI * 2;
    const T = torsoRings(L, 1).reduce((b, r) => (Math.abs(r[0] - y) < Math.abs(b[0] - y) ? r : b));
    const p = [Math.cos(a) * T[1] * 0.98, y, Math.sin(a) * (Math.sin(a) > 0 ? T[2] : T[3]) * 0.98];
    sb.ell(p, [0.03, 0.03, 0.03], () => [...mixc(C('#C2C04A'), C('#E8E080'), hh(k, 9, 9, 1)), 0.88], y < 1.03 ? BN.PEL : y < 1.19 ? BN.SPN : BN.CHS, { seg: 7, rows: 4 });
  }
}

function finishMesh(sb, L, J) {
  const h = L.h || 1, wx = L.wx || 1, wz = L.wz || 1;
  const v = sb.v;
  const n = v.length / 11;
  const out = new Float32Array(v.length);
  for (let i = 0; i < n; i++) {
    const k = i * 11;
    out[k] = v[k] * wx; out[k + 1] = v[k + 1] * h; out[k + 2] = v[k + 2] * wz;
    let nx = v[k + 3] / wx, ny = v[k + 4] / h, nz = v[k + 5] / wz;
    const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    out[k + 3] = nx; out[k + 4] = ny; out[k + 5] = nz;
    out[k + 6] = clamp(v[k + 6], 0, 1); out[k + 7] = clamp(v[k + 7], 0, 1); out[k + 8] = clamp(v[k + 8], 0, 1); out[k + 9] = v[k + 9]; out[k + 10] = v[k + 10];
  }
  const JJ = new Float32Array(NB * 3);
  for (let i = 0; i < NB; i++) { JJ[i * 3] = J[i * 3] * wx; JJ[i * 3 + 1] = J[i * 3 + 1] * h; JJ[i * 3 + 2] = J[i * 3 + 2] * wz; }
  return { data: out, joints: JJ, h };
}

export function buildDog(L, lod = 1) {
  const sb = new SB();
  const coat = C(L.coat || '#7A5A3A'), dark = C(L.dark || '#2A2018'), belly = C(L.belly || '#C8A07A');
  const seed = L.seed || 3;
  const col = (p, n) => {
    let c = coat;
    const under = sstep(0.0, -0.6, n[1]) * 0.8;
    c = mixc(c, belly, under);
    if (L.saddle) { const k = sstep(0.42, 0.52, p[1]) * sstep(0.32, 0.1, Math.abs(p[2] + 0.05)); c = mixc(c, dark, k * 0.9); }
    if (p[2] > 0.38 && p[1] > 0.45) c = mixc(c, dark, sstep(0.46, 0.56, p[2]) * (L.mask ? 0.8 : 0.3));
    c = mulc(c, 0.9 + 0.16 * vn3(p[0] * 60, p[1] * 60, p[2] * 60, seed));
    return [c[0], c[1], c[2], 0.04];
  };
  const DJ = dogJoints();
  const seg = lod ? 12 : 8;
  const prof = [[-0.34, 0.07, 0.08], [-0.28, 0.1, 0.11], [-0.18, 0.115, 0.13], [-0.05, 0.11, 0.13], [0.08, 0.115, 0.14], [0.2, 0.12, 0.15], [0.3, 0.105, 0.14], [0.36, 0.08, 0.11]];
  const rows = prof.map(([zz, rx, ry]) => { const row = []; const y0 = 0.52 + (zz > 0.25 ? (zz - 0.25) * 0.5 : 0) - (zz < -0.2 ? 0 : 0); for (let j = 0; j < seg; j++) { const th = (j / seg) * Math.PI * 2; row.push([Math.cos(th) * rx, y0 + Math.sin(th) * ry * (Math.sin(th) < 0 ? 0.8 : 1), zz]); } return row; });
  sb.grid(rows, (i) => [0, 0.52, prof[Math.min(prof.length - 1, Math.round(i))][0]], col, (p) => (p[2] < -0.1 ? 0 : p[2] < 0.15 ? 1 : 2));
  sb.cap(rows[0], [0, 0.52, -0.37], col, 0, [0, 0, -1]);
  limb(sb, [[0, 0.58, 0.33], [0, 0.66, 0.42], [0, 0.7, 0.47]], [[0, 0.075, 1.1], [0.5, 0.07, 1.1], [1, 0.065, 1.1]], 8, (p, n) => col(p, n), () => 3, { ref: [1, 0, 0] });
  sb.ell([0, 0.71, 0.5], [0.075, 0.07, 0.085], col, 4, { seg: 10, rows: 7 });
  sb.ell([0, 0.685, 0.6], [0.042, 0.038, 0.07], (p, n) => { const c = col(p, n); return p[2] > 0.66 ? [...C('#141210'), 0.3] : c; }, 4, { seg: 9, rows: 6 });
  sb.ell([0, 0.66, 0.6], [0.036, 0.016, 0.06], (p, n) => (p[1] > 0.665 ? col(p, n) : [...C('#3A2422'), 0.2]), 5, { seg: 8, rows: 4 });
  for (const s of [-1, 1]) {
    sb.ell([s * 0.05, 0.78, 0.48], [0.022, 0.05, 0.03], (p, n) => [...mulc(dark, 1.3), 0.04], 4, { seg: 7, rows: 5, T: rotZ(-s * 0.25) });
    sb.ell([s * 0.033, 0.725, 0.573], [0.011, 0.011, 0.008], () => [0.05, 0.04, 0.03, 0.5], 4, { seg: 6, rows: 4 });
  }
  const legs = [[0.07, 0.25, 6, 7], [-0.07, 0.25, 8, 9], [0.075, -0.27, 10, 11], [-0.075, -0.27, 12, 13]];
  for (const [x, zz, b0, b1] of legs) {
    const back = zz < 0;
    const pts = back ? [[x, 0.52, zz], [x, 0.32, zz - 0.04], [x, 0.16, zz + 0.03], [x, 0.03, zz + 0.04]] : [[x, 0.5, zz], [x, 0.3, zz + 0.01], [x, 0.14, zz - 0.01], [x, 0.03, zz + 0.01]];
    limb(sb, pts, [[0, back ? 0.06 : 0.05, 1.3], [0.35, back ? 0.045 : 0.038, 1.2], [0.6, 0.03, 1.1], [1, 0.026, 1.1]], 7, (p, n) => col(p, n), (t) => (t < 0.45 ? b0 : b1), { ref: [1, 0, 0] });
    sb.ell([x, 0.025, zz + (back ? 0.05 : 0.025)], [0.03, 0.022, 0.04], (p, n) => col(p, n), b1, { seg: 7, rows: 4 });
  }
  limb(sb, [[0, 0.58, -0.34], [0, 0.6, -0.45], [0, 0.56, -0.58]], [[0, 0.03, 1], [0.5, 0.026, 1], [1, 0.012, 1]], 6, (p, n) => col(p, n), (t) => (t < 0.4 ? 14 : 15), { ref: [1, 0, 0] });
  if (L.collar) limb(sb, [[0, 0.58, 0.36], [0, 0.64, 0.43]], [[0.3, 0.082, 1.12], [0.5, 0.08, 1.12]], 10, () => [...C(L.collar), 0.3], () => 3, { ref: [1, 0, 0] });
  const sc = L.s || 1;
  return { data: finishMesh(sb, { h: sc, wx: sc, wz: sc }, new Float32Array(NB * 3)).data, joints: DJ.map((v) => v * sc) };
}

export const DOG_PARENT = [-1, 0, 1, 2, 3, 4, 2, 6, 2, 8, 0, 10, 0, 12, 0, 14];
export function dogJoints() {
  const J = [0, 0.52, -0.22, 0, 0.52, 0.02, 0, 0.54, 0.24, 0, 0.6, 0.34, 0, 0.7, 0.46, 0, 0.672, 0.55, 0.07, 0.5, 0.25, 0.07, 0.3, 0.26, -0.07, 0.5, 0.25, -0.07, 0.3, 0.26, 0.075, 0.52, -0.27, 0.075, 0.32, -0.31, -0.075, 0.52, -0.27, -0.075, 0.32, -0.31, 0, 0.58, -0.34, 0, 0.6, -0.45];
  return new Float32Array(J);
}
