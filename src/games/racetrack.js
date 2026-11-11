import { MeshBuilder, hexRgb } from './race3d.js';

export function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function hash2(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy), b = hash2(ix + 1, iy), c = hash2(ix, iy + 1), d = hash2(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}
export function fbm(x, y, o = 4) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += a * vnoise(x * f, y * f); f *= 2.02; a *= 0.5; } return s; }
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export const ISLAND = {
  w: 7,
  pts: [
    [0, 0, 0], [120, 0, 0], [230, 6, 1], [300, 70, 3], [310, 160, 9], [262, 236, 15], [170, 262, 13],
    [92, 222, 8], [62, 150, 4], [0, 128, 2], [-90, 160, 1], [-190, 176, 1], [-262, 120, 2],
    [-280, 30, 5], [-236, -46, 6], [-150, -60, 3], [-70, -28, 1],
  ],
  zones: { town: [[0.93, 1], [0, 0.1]], beach: [[0.5, 0.74]], tea: [[0.22, 0.42]] },
};

function catmull(P, n) {
  const out = [];
  const N = P.length;
  for (let i = 0; i < N; i++) {
    const p0 = P[(i - 1 + N) % N], p1 = P[i], p2 = P[(i + 1) % N], p3 = P[(i + 2) % N];
    const d01 = Math.max(1e-3, Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) ** 0.5), d12 = Math.max(1e-3, Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) ** 0.5), d23 = Math.max(1e-3, Math.hypot(p3[0] - p2[0], p3[1] - p2[1]) ** 0.5);
    const t0 = 0, t1 = t0 + d01, t2 = t1 + d12, t3 = t2 + d23;
    for (let k = 0; k < n; k++) {
      const t = t1 + ((t2 - t1) * k) / n;
      const L = (a, b, ta, tb) => a.map((v, j) => ((tb - t) / (tb - ta)) * v + ((t - ta) / (tb - ta)) * b[j]);
      const A1 = L(p0, p1, t0, t1), A2 = L(p1, p2, t1, t2), A3 = L(p2, p3, t2, t3);
      const B1 = L(A1, A2, t0, t2), B2 = L(A2, A3, t1, t3);
      out.push(L(B1, B2, t1, t2));
    }
  }
  return out;
}

export function buildTrack(def = ISLAND, step = 2) {
  const raw = catmull(def.pts.map((p) => [p[0], p[1], p[2]]), 60);
  const dense = raw.map((p) => ({ x: p[0], z: p[1], y: p[2] }));
  let total = 0;
  const cum = [0];
  for (let i = 1; i <= dense.length; i++) { const a = dense[i - 1], b = dense[i % dense.length]; total += Math.hypot(b.x - a.x, b.z - a.z); cum.push(total); }
  const N = Math.round(total / step);
  const S = [];
  let j = 0;
  for (let i = 0; i < N; i++) {
    const d = (i / N) * total;
    while (cum[j + 1] < d) j++;
    const a = dense[j], b = dense[(j + 1) % dense.length];
    const t = (d - cum[j]) / Math.max(1e-6, cum[j + 1] - cum[j]);
    S.push({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, y: a.y + (b.y - a.y) * t, s: d });
  }
  for (let pass = 0; pass < 6; pass++) {
    const ys = S.map((p, i) => (S[(i - 2 + N) % N].y + S[(i - 1 + N) % N].y * 2 + p.y * 2 + S[(i + 1) % N].y * 2 + S[(i + 2) % N].y) / 8);
    S.forEach((p, i) => { p.y = ys[i]; });
  }
  for (let i = 0; i < N; i++) {
    const a = S[(i - 1 + N) % N], b = S[(i + 1) % N], p = S[i];
    let tx = b.x - a.x, tz = b.z - a.z;
    const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
    p.tx = tx; p.tz = tz; p.rx = tz; p.rz = -tx;
    p.heading = Math.atan2(tx, tz);
    p.slope = Math.atan2(b.y - a.y, 2 * step);
  }
  for (let i = 0; i < N; i++) {
    const a = S[(i - 3 + N) % N], b = S[(i + 3) % N];
    let dh = b.heading - a.heading;
    while (dh > Math.PI) dh -= Math.PI * 2;
    while (dh < -Math.PI) dh += Math.PI * 2;
    S[i].curv = dh / (6 * step);
  }
  for (let pass = 0; pass < 3; pass++) {
    const cs = S.map((p, i) => (S[(i - 1 + N) % N].curv + p.curv * 2 + S[(i + 1) % N].curv) / 4);
    S.forEach((p, i) => { p.curv = cs[i]; });
  }
  S.forEach((p) => { p.bank = Math.max(-0.14, Math.min(0.14, -p.curv * 6)); });
  const inZone = (k, u) => (def.zones[k] || []).some(([a, b]) => u >= a && u <= b);
  S.forEach((p) => { const u = p.s / total; p.town = inZone('town', u); p.beach = inZone('beach', u); p.tea = inZone('tea', u); });
  const T = { S, N, total, w: def.w, step };
  T.edge = (i, off) => { const p = S[((i % N) + N) % N]; const c = Math.cos(p.bank); return [p.x + p.rx * off * c, p.y + off * Math.sin(p.bank), p.z + p.rz * off * c]; };
  T.at = (s, off = 0) => {
    s = ((s % total) + total) % total;
    const f = s / step, i = Math.floor(f) % N, t = f - Math.floor(f);
    const a = S[i], b = S[(i + 1) % N];
    const lerp = (u, v) => u + (v - u) * t;
    const bank = lerp(a.bank, b.bank), c = Math.cos(bank);
    const rx = lerp(a.rx, b.rx), rz = lerp(a.rz, b.rz);
    let dh = b.heading - a.heading; while (dh > Math.PI) dh -= Math.PI * 2; while (dh < -Math.PI) dh += Math.PI * 2;
    return { x: lerp(a.x, b.x) + rx * off * c, y: lerp(a.y, b.y) + off * Math.sin(bank), z: lerp(a.z, b.z) + rz * off * c, heading: a.heading + dh * t, slope: lerp(a.slope, b.slope), bank, i };
  };
  const cell = 24, grid = new Map();
  S.forEach((p, i) => { const k = `${Math.floor(p.x / cell)},${Math.floor(p.z / cell)}`; if (!grid.has(k)) grid.set(k, []); grid.get(k).push(i); });
  T.near = (x, z, reach = 3) => {
    const cx = Math.floor(x / cell), cz = Math.floor(z / cell);
    let best = Infinity, bi = -1;
    for (let a = -reach; a <= reach; a++) for (let b = -reach; b <= reach; b++) {
      const L = grid.get(`${cx + a},${cz + b}`);
      if (!L) continue;
      for (const i of L) { const p = S[i]; const d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < best) { best = d; bi = i; } }
    }
    return { d: Math.sqrt(best), i: bi };
  };
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  S.forEach((p) => { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z); });
  T.bounds = { minX, maxX, minZ, maxZ };
  return T;
}

export function terrainH(T, x, z) {
  const n = T.near(x, z, 4);
  const far = fbm(x * 0.006 + 3.1, z * 0.006 - 1.7, 4);
  let h = (far - 0.42) * 46 + fbm(x * 0.03, z * 0.03, 3) * 4;
  const p = n.i >= 0 ? T.S[n.i] : null;
  if (p && p.beach) {
    const side = (x - p.x) * p.rx + (z - p.z) * p.rz;
    if (side < 0) h = Math.min(h, -2.5 - Math.max(0, (-side - 40)) * 0.08);
  }
  const seaSide = p && p.beach && (x - p.x) * p.rx + (z - p.z) * p.rz < 0;
  if (!seaSide && n.i >= 0 && n.d < 90) h = Math.max(h, -0.4 + Math.max(0, n.d - 60) * -0.05);
  if (n.i < 0 || n.d > 130) return h;
  const side = (x - p.x) * p.rx + (z - p.z) * p.rz;
  const offc = Math.max(-(T.w + 2.4), Math.min(T.w + 2.4, side));
  const roadY = p.y + offc * Math.sin(p.bank) - 0.3;
  const k = smooth(T.w + 3.5, T.w + 30, n.d);
  return roadY + (h - roadY) * k;
}

export function buildWorld(T, opts = {}) {
  const R = rng(opts.seed || 7);
  const ground = new MeshBuilder(), road = new MeshBuilder(), props = new MeshBuilder();
  const { S, N, w } = T;
  const asphalt = hexRgb('#4E535B'), asphalt2 = hexRgb('#555A62');
  for (let i = 0; i < N; i++) {
    const a = S[i], b = S[(i + 1) % N];
    const L0 = T.edge(i, -w), R0 = T.edge(i, w), L1 = T.edge(i + 1, -w), R1 = T.edge(i + 1, w);
    const c = mixc(asphalt, asphalt2, hash2(i * 0.37, 1.3));
    road.quad(L0, L1, R1, R0, c, 0.08);
    const up = 0.025;
    const lift = (p) => [p[0], p[1] + up, p[2]];
    if (Math.floor(a.s / 6) % 2 === 0) road.quad(lift(T.edge(i, -0.14)), lift(T.edge(i + 1, -0.14)), lift(T.edge(i + 1, 0.14)), lift(T.edge(i, 0.14)), '#F2EFE6', 0.1);
    for (const sgn of [-1, 1]) {
      road.quad(lift(T.edge(i, sgn * (w - 0.55))), lift(T.edge(i + 1, sgn * (w - 0.55))), lift(T.edge(i + 1, sgn * (w - 0.3))), lift(T.edge(i, sgn * (w - 0.3))), '#ECE7DA', 0.1);
      const curb = Math.abs(a.curv) > 0.011;
      const shoulder = a.beach && sgn < 0 ? '#E3C88E' : a.town ? '#9C968B' : '#8E9A5A';
      if (curb) {
        const col = Math.floor(a.s / 4) % 2 ? '#E5484D' : '#F4F1EA';
        const h = 0.07;
        const p0 = T.edge(i, sgn * w), p1 = T.edge(i + 1, sgn * w), p2 = T.edge(i + 1, sgn * (w + 1.3)), p3 = T.edge(i, sgn * (w + 1.3));
        road.quad([p0[0], p0[1] + h, p0[2]], [p1[0], p1[1] + h, p1[2]], [p2[0], p2[1] + h, p2[2]], [p3[0], p3[1] + h, p3[2]], col, 0.05);
        road.quad(p0, p1, [p1[0], p1[1] + h, p1[2]], [p0[0], p0[1] + h, p0[2]], col, 0.05);
        road.quad(T.edge(i, sgn * (w + 1.3)), T.edge(i + 1, sgn * (w + 1.3)), T.edge(i + 1, sgn * (w + 2.4)), T.edge(i, sgn * (w + 2.4)), shoulder, 0);
      } else {
        road.quad(T.edge(i, sgn * w), T.edge(i + 1, sgn * w), T.edge(i + 1, sgn * (w + 2.4)), T.edge(i, sgn * (w + 2.4)), shoulder, 0);
      }
    }
  }
  for (let i = 0; i < 7; i++) {
    for (let k = -7; k < 7; k++) {
      const col = (i + k) % 2 === 0 ? '#F6F4EE' : '#1F2329';
      const s0 = i * 0.8, s1 = s0 + 0.8;
      const A = T.at(s0, k), B = T.at(s1, k), C = T.at(s1, k + 1), D = T.at(s0, k + 1);
      const lf = (p) => [p.x, p.y + 0.03, p.z];
      if (i < 2) road.quad(lf(A), lf(B), lf(C), lf(D), col, 0.1);
    }
  }
  const { minX, maxX, minZ, maxZ } = T.bounds;
  const M = 260, cs = opts.cell || 8;
  const x0 = minX - M, z0 = minZ - M, nx = Math.ceil((maxX - minX + 2 * M) / cs), nz = Math.ceil((maxZ - minZ + 2 * M) / cs);
  const Hs = new Float32Array((nx + 1) * (nz + 1));
  for (let iz = 0; iz <= nz; iz++) for (let ix = 0; ix <= nx; ix++) {
    const x = x0 + ix * cs + (hash2(ix, iz) - 0.5) * cs * 0.3, z = z0 + iz * cs + (hash2(iz, ix) - 0.5) * cs * 0.3;
    Hs[iz * (nx + 1) + ix] = terrainH(T, x, z);
  }
  const grassA = hexRgb('#649A41'), grassB = hexRgb('#4A8136'), dry = hexRgb('#97A255'), sand = hexRgb('#E8CF95'), wet = hexRgb('#C9AF78'), rock = hexRgb('#8D8A7C');
  const GP = (ix, iz) => [x0 + ix * cs + (hash2(ix, iz) - 0.5) * cs * 0.3, Hs[iz * (nx + 1) + ix], z0 + iz * cs + (hash2(iz, ix) - 0.5) * cs * 0.3];
  const tcol = (p, slope) => {
    if (p[1] < -0.6) return mixc(wet, sand, smooth(-3, -0.6, p[1]));
    if (p[1] < 1.2) { const n = T.near(p[0], p[2], 2); const tp = n.i >= 0 ? T.S[n.i] : null; if (tp && tp.beach && n.d > w + 4 && (p[0] - tp.x) * tp.rx + (p[2] - tp.z) * tp.rz < 0) return mixc(sand, hexRgb('#F0DAA6'), hash2(p[0], p[2]) * 0.6); }
    let c = mixc(grassA, grassB, smooth(0.3, 0.7, fbm(p[0] * 0.012 + 7, p[2] * 0.012, 4)));
    c = mixc(c, dry, smooth(14, 34, p[1]) * 0.7);
    c = mixc(c, rock, smooth(0.55, 0.85, slope));
    const v = 0.94 + hash2(p[0] * 0.1, p[2] * 0.1) * 0.1;
    return [c[0] * v, c[1] * v, c[2] * v];
  };
  for (let iz = 0; iz < nz; iz++) for (let ix = 0; ix < nx; ix++) {
    const a = GP(ix, iz), b = GP(ix + 1, iz), c = GP(ix + 1, iz + 1), d = GP(ix, iz + 1);
    const sl1 = Math.min(1, Math.abs(a[1] - c[1]) / cs), sl2 = Math.min(1, Math.abs(b[1] - d[1]) / cs);
    if ((ix + iz) % 2) { ground.tri(a, d, b, tcol(a, sl1), 0); ground.tri(b, d, c, tcol(c, sl2), 0); } else { ground.tri(a, d, c, tcol(a, sl1), 0); ground.tri(a, c, b, tcol(c, sl2), 0); }
  }
  const water = new MeshBuilder();
  const WY = -1.1;
  const wx0 = minX - 700, wx1 = maxX + 700, wz0 = minZ - 700, wz1 = maxZ + 700;
  for (let i = 0; i < 12; i++) for (let k = 0; k < 12; k++) {
    const xa = wx0 + ((wx1 - wx0) * i) / 12, xb = wx0 + ((wx1 - wx0) * (i + 1)) / 12, za = wz0 + ((wz1 - wz0) * k) / 12, zb = wz0 + ((wz1 - wz0) * (k + 1)) / 12;
    const wc = mixc(hexRgb('#2B86BE'), hexRgb('#3AA3CF'), hash2(i * 1.7, k * 2.3));
    water.quad([xa, WY, za], [xa, WY, zb], [xb, WY, zb], [xb, WY, za], wc, 0.85);
  }
  const placed = [];
  const free = (x, z, r) => {
    const n = T.near(x, z, 3);
    if (n.i >= 0 && n.d < w + 5 + r) return false;
    for (const q of placed) if ((q[0] - x) ** 2 + (q[1] - z) ** 2 < (q[2] + r) ** 2) return false;
    return true;
  };
  const gy = (x, z) => terrainH(T, x, z);
  const palm = (x, z, s = 1, lean = 0) => {
    const y = gy(x, z);
    const segs = 6, H = 9 * s;
    let px = x, pz = z, py = y;
    const dx = Math.cos(lean) * 0.32 * s, dz = Math.sin(lean) * 0.32 * s;
    for (let k = 0; k < segs; k++) {
      const nx2 = px + dx * (k / segs + 0.3), nz2 = pz + dz * (k / segs + 0.3), ny = py + H / segs;
      const r0 = 0.3 * s * (1 - k * 0.06), r1 = 0.3 * s * (1 - (k + 1) * 0.06);
      for (let q = 0; q < 6; q++) {
        const a0 = (q / 6) * Math.PI * 2, a1 = ((q + 1) / 6) * Math.PI * 2;
        props.quad([px + Math.cos(a0) * r0, py, pz + Math.sin(a0) * r0], [nx2 + Math.cos(a0) * r1, ny, nz2 + Math.sin(a0) * r1], [nx2 + Math.cos(a1) * r1, ny, nz2 + Math.sin(a1) * r1], [px + Math.cos(a1) * r0, py, pz + Math.sin(a1) * r0], k % 2 ? '#8A6A45' : '#7A5C3B', 0);
      }
      px = nx2; pz = nz2; py = ny;
    }
    const fronds = 8;
    for (let f = 0; f < fronds; f++) {
      const ang = (f / fronds) * Math.PI * 2 + R() * 0.4;
      const len = (4.2 + R() * 1.2) * s, ca = Math.cos(ang), sa = Math.sin(ang);
      let qx = px, qy = py + 0.2, qz = pz;
      const seg = 4;
      for (let k = 0; k < seg; k++) {
        const t0 = k / seg, t1 = (k + 1) / seg;
        const droop = (t) => 1.1 * s * t - 3.4 * s * t * t;
        const width = (t) => (0.9 - 0.7 * t) * s;
        const pA = [px + ca * len * t0, py + droop(t0), pz + sa * len * t0], pB = [px + ca * len * t1, py + droop(t1), pz + sa * len * t1];
        const ox = -sa, oz = ca;
        const wA = width(t0), wB = width(t1);
        const col = f % 2 ? '#3E9A4A' : '#2F8740';
        props.tri(pA, [pB[0] + ox * wB, pB[1] - 0.15 * s, pB[2] + oz * wB], [pA[0] + ox * wA, pA[1] - 0.15 * s, pA[2] + oz * wA], col, 0);
        props.tri(pA, pB, [pB[0] + ox * wB, pB[1] - 0.15 * s, pB[2] + oz * wB], col, 0);
        props.tri(pA, [pA[0] - ox * wA, pA[1] - 0.15 * s, pA[2] - oz * wA], [pB[0] - ox * wB, pB[1] - 0.15 * s, pB[2] - oz * wB], col, 0);
        props.tri(pA, [pB[0] - ox * wB, pB[1] - 0.15 * s, pB[2] - oz * wB], pB, col, 0);
        qx = pB[0]; qy = pB[1]; qz = pB[2];
      }
    }
    props.blob(px, py - 0.2, pz, 0.45 * s, 0.4 * s, 0.45 * s, '#6B4A26', 0, null, 6);
  };
  const tree = (x, z, s = 1) => {
    const y = gy(x, z);
    props.cyl(x, y - 0.2, z, 0.28 * s, 2.6 * s, 6, '#6E4F33', 0, { r2: 0.2 * s });
    const tones = ['#3F8F3A', '#4FA244', '#35803A', '#5BAE4C'];
    const c = tones[Math.floor(R() * tones.length)];
    props.blob(x, y + 3.6 * s, z, 2.3 * s, 2.0 * s, 2.3 * s, c, 0, R, 7);
    props.blob(x + 0.9 * s, y + 4.6 * s, z - 0.5 * s, 1.4 * s, 1.3 * s, 1.4 * s, c, 0, R, 5);
  };
  const bush = (x, z, s = 1) => { const y = gy(x, z); props.blob(x, y + 0.5 * s, z, 1.2 * s, 0.9 * s, 1.2 * s, R() > 0.5 ? '#4E9B3E' : '#3E8A36', 0, R, 7); };
  const house = (x, z, yaw, s = 1) => {
    const y = gy(x, z) - 0.3;
    const cols = ['#F2A7B5', '#F6D365', '#8FD3CB', '#F4B183', '#C9B8F0', '#9CC3F2', '#B6E2A1', '#FFFFFF'];
    const c = cols[Math.floor(R() * cols.length)];
    const W2 = (6 + R() * 3) * s, D = (5 + R() * 2.5) * s, H2 = (3.2 + (R() > 0.75 ? 3 : 0)) * s;
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    props.setT(new Float32Array([cy, 0, -sy, 0, 0, 1, 0, 0, sy, 0, cy, 0, x, y, z, 1]));
    props.box(0, 0, 0, W2, H2, D, c, 0);
    props.box(0, 0.05, D / 2 + 0.01, W2 * 0.96, 0.6, 0.02, '#D9D2C4', 0);
    const rh = 1.6 * s;
    const e = [[-W2 / 2 - 0.4, H2, -D / 2 - 0.4], [W2 / 2 + 0.4, H2, -D / 2 - 0.4], [W2 / 2 + 0.4, H2, D / 2 + 0.4], [-W2 / 2 - 0.4, H2, D / 2 + 0.4]];
    const ridge = [[-W2 / 2 + D / 2, H2 + rh, 0], [W2 / 2 - D / 2, H2 + rh, 0]];
    const roof = R() > 0.3 ? '#B65A3E' : '#7C8C99';
    props.quad(e[0], ridge[0], ridge[1], e[1], roof, 0.05);
    props.quad(e[2], ridge[1], ridge[0], e[3], roof, 0.05);
    props.tri(e[1], ridge[1], e[2], roof, 0.05);
    props.tri(e[3], ridge[0], e[0], roof, 0.05);
    props.box(-W2 * 0.18, 0, D / 2 + 0.02, 1.1 * s, 2.1 * s, 0.06, '#7A4E2E', 0);
    props.box(W2 * 0.22, 1.1 * s, D / 2 + 0.02, 1.4 * s, 1.1 * s, 0.06, '#9ED0EE', 0.6);
    if (H2 > 5) { props.box(-W2 * 0.2, 4.1 * s, D / 2 + 0.02, 1.3 * s, 1.1 * s, 0.06, '#9ED0EE', 0.6); props.box(W2 * 0.22, 4.1 * s, D / 2 + 0.02, 1.3 * s, 1.1 * s, 0.06, '#9ED0EE', 0.6); }
    props.setT(null);
  };
  const lamp = (x, z, yaw) => {
    const y = gy(x, z);
    props.cyl(x, y - 0.2, z, 0.12, 7.4, 6, '#5B6470', 0.3);
    const ax = Math.sin(yaw) * 1.6, az = Math.cos(yaw) * 1.6;
    props.box(x + ax / 2, y + 7.2, z + az / 2, 0.16, 0.16, 0.16, '#5B6470', 0.3);
    props.quad([x, y + 7.25, z], [x + ax, y + 7.25, z + az], [x + ax, y + 7.4, z + az], [x, y + 7.4, z], '#5B6470', 0.3);
    props.box(x + ax, y + 7.05, z + az, 0.5, 0.18, 0.5, '#FFF2C6', 1);
  };
  const teaRow = (cx, cz, yaw, len) => {
    const ca = Math.cos(yaw), sa = Math.sin(yaw);
    for (let k = -len / 2; k < len / 2; k += 1.6) {
      const x = cx + ca * k, z = cz + sa * k;
      if (!free(x, z, 0.4)) continue;
      const y = gy(x, z);
      props.blob(x, y + 0.45, z, 0.95, 0.7, 0.95, R() > 0.5 ? '#3F8F3A' : '#4A9C40', 0, R, 6);
    }
  };
  for (let i = 0; i < N; i += 1) {
    const p = S[i];
    if (p.town && i % 12 === 0) for (const sgn of [-1, 1]) lamp(p.x + p.rx * sgn * (w + 4.5), p.z + p.rz * sgn * (w + 4.5), Math.atan2(-p.rx * sgn, -p.rz * sgn));
    if (p.town && i % 5 === 0) for (const sgn of [-1, 1]) {
      const off = w + 13 + R() * 10 + (i % 10 === 0 ? 14 : 0);
      const x = p.x + p.rx * sgn * off, z = p.z + p.rz * sgn * off;
      if (free(x, z, 6)) { house(x, z, p.heading + (sgn > 0 ? -Math.PI / 2 : Math.PI / 2), 1); placed.push([x, z, 6]); }
    }
    if (p.beach && i % 6 === 0) for (const sgn of [-1, 1]) {
      const off = w + 6 + R() * 9 + (sgn < 0 ? 0 : 6);
      const x = p.x + p.rx * sgn * off, z = p.z + p.rz * sgn * off;
      if (free(x, z, 2)) { palm(x, z, 0.9 + R() * 0.35, R() * Math.PI * 2); placed.push([x, z, 2]); }
    }
    if (p.tea && i % 4 === 0) for (const sgn of [-1, 1]) {
      for (let r = 0; r < 4; r++) {
        const off = w + 10 + r * 2.6;
        teaRow(p.x + p.rx * sgn * off, p.z + p.rz * sgn * off, p.heading + Math.PI / 2, 3.2);
      }
    }
  }
  const { minX: bx0, maxX: bx1, minZ: bz0, maxZ: bz1 } = T.bounds;
  for (let k = 0; k < (opts.trees || 520); k++) {
    const x = bx0 - 180 + R() * (bx1 - bx0 + 360), z = bz0 - 180 + R() * (bz1 - bz0 + 360);
    const y = gy(x, z);
    if (y < 0.4) continue;
    if (!free(x, z, 2.5)) continue;
    const n = T.near(x, z, 2);
    if (n.i >= 0 && T.S[n.i].tea && n.d < 50) continue;
    if (R() < 0.18) bush(x, z, 0.8 + R() * 0.6); else tree(x, z, 0.75 + R() * 0.6);
    placed.push([x, z, 2.5]);
  }
  const gant = T.at(0);
  {
    const yaw = gant.heading;
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    props.setT(new Float32Array([cy, 0, -sy, 0, 0, 1, 0, 0, sy, 0, cy, 0, gant.x, gant.y, gant.z, 1]));
    props.box(-w - 1.4, 0, 0, 0.7, 7.2, 0.7, '#E9EDF2', 0.3);
    props.box(w + 1.4, 0, 0, 0.7, 7.2, 0.7, '#E9EDF2', 0.3);
    props.box(0, 6.0, 0, 2 * w + 3.6, 2.0, 0.6, '#1D7BF0', 0.25);
    props.box(0, 7.95, 0, 2 * w + 4.2, 0.3, 0.8, '#E9EDF2', 0.3);
    for (const zf of [-0.32, 0.32]) {
      for (let k = 0; k < 24; k++) for (let r = 0; r < 2; r++) props.box(-w - 0.6 + k * (2 * w + 1.2) / 24 + (2 * w + 1.2) / 48, 7.25 + r * 0.32, zf, (2 * w + 1.2) / 24, 0.32, 0.02, (k + r) % 2 ? '#FFFFFF' : '#111317', 0);
      for (let k = 0; k < 5; k++) { props.box(-2.4 + k * 1.2, 6.15, zf * 1.06, 0.82, 0.82, 0.04, '#1B1D21', 0.2); props.box(-2.4 + k * 1.2, 6.28, zf * 1.12, 0.56, 0.56, 0.03, k < 3 ? '#FF2A2A' : '#4A1416', k < 3 ? 1 : 0.2); }
    }
    for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) props.box(sx * (w + 1.4), 1.2 + k * 1.9, 0, 0.74, 0.9, 0.74, k % 2 ? '#FFFFFF' : '#E5484D', 0.2);
    props.setT(null);
  }
  const ring = new MeshBuilder();
  const cxm = (bx0 + bx1) / 2, czm = (bz0 + bz1) / 2;
  const NS = 160;
  const ridge = (a, layer) => {
    const u = a * 3.2 + layer * 11.3;
    return (layer ? 120 : 70) + fbm(Math.cos(u) * 2 + 5 + layer, Math.sin(u) * 2 - 3, 4) * (layer ? 220 : 150) + Math.max(0, fbm(u * 0.9, layer + 1.7, 3) - 0.55) * 260;
  };
  for (let layer = 0; layer < 2; layer++) {
    const rr = layer ? 1250 : 900;
    const cols = layer ? ['#6B8FB8', '#7598C0'] : ['#55806E', '#5E8A72'];
    for (let k = 0; k < NS; k++) {
      const a0 = (k / NS) * Math.PI * 2, a1 = ((k + 1) / NS) * Math.PI * 2;
      const h0 = ridge(a0, layer), h1 = ridge(a1, layer);
      const r0 = rr + fbm(a0 * 4, layer * 3, 2) * 120, r1 = rr + fbm(a1 * 4, layer * 3, 2) * 120;
      const b0 = [cxm + Math.cos(a0) * r0, -14, czm + Math.sin(a0) * r0], b1 = [cxm + Math.cos(a1) * r1, -14, czm + Math.sin(a1) * r1];
      const t0 = [cxm + Math.cos(a0) * (r0 + 90), h0, czm + Math.sin(a0) * (r0 + 90)], t1 = [cxm + Math.cos(a1) * (r1 + 90), h1, czm + Math.sin(a1) * (r1 + 90)];
      const m0 = [cxm + Math.cos(a0) * (r0 + 40), h0 * 0.55, czm + Math.sin(a0) * (r0 + 40)], m1 = [cxm + Math.cos(a1) * (r1 + 40), h1 * 0.55, czm + Math.sin(a1) * (r1 + 40)];
      const c = cols[k % 2];
      ring.quad(b0, m0, m1, b1, c, 0);
      ring.quad(m0, t0, t1, m1, c, 0);
    }
  }
  const boat = (x, z, yaw) => {
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    props.setT(new Float32Array([cy, 0, -sy, 0, 0, 1, 0, 0, sy, 0, cy, 0, x, WY - 0.05, z, 1]));
    props.box(0, 0, 0, 0.9, 0.6, 7, '#8A5A34', 0.1, { taper: 0.12 });
    props.box(0, 0.6, 0, 0.95, 0.12, 6.4, '#E5484D', 0.1);
    props.box(-2.2, 0, 0.2, 0.3, 0.3, 4.5, '#6B4A2E', 0.1);
    props.box(-1.1, 0.55, -1.2, 2.2, 0.1, 0.12, '#6B4A2E', 0.1);
    props.box(-1.1, 0.55, 1.5, 2.2, 0.1, 0.12, '#6B4A2E', 0.1);
    props.cyl(0, 0.6, -0.4, 0.06, 4.2, 5, '#6B4A2E', 0);
    props.quad([0, 4.6, -0.4], [0, 1.2, -0.4], [0, 1.4, 2.6], [0, 3.9, 1.2], '#F4EBDD', 0);
    props.setT(null);
  };
  for (let i = 0; i < N; i += 1) {
    const p = S[i];
    if (!p.beach || i % 55 !== 0) continue;
    const off = w + 70 + R() * 70;
    boat(p.x - p.rx * off, p.z - p.rz * off, p.heading + R() * 0.8);
  }
  {
    const p = T.at(T.total * 0.66, 0);
    const off = w + 34;
    const x = p.x - Math.cos(p.heading) * -off * -1, z = p.z;
    const lx = p.x - Math.cos(p.heading) * (off - 10), lz = p.z + Math.sin(p.heading) * (off - 10);
    const ly = gy(lx, lz);
    props.cyl(lx, ly - 0.5, lz, 3.4, 1.4, 12, '#9AA0A8', 0);
    for (let k = 0; k < 6; k++) props.cyl(lx, ly + 0.9 + k * 3.2, lz, 2.2 - k * 0.12, 3.2, 12, k % 2 ? '#E5484D' : '#F6F4EE', 0.1, { r2: 2.2 - (k + 1) * 0.12 });
    const ty = ly + 0.9 + 6 * 3.2;
    props.cyl(lx, ty, lz, 2.0, 0.3, 12, '#2A2C31', 0.2);
    props.cyl(lx, ty + 0.3, lz, 1.3, 2.0, 10, '#FFF3C2', 1);
    props.cyl(lx, ty + 2.3, lz, 1.55, 1.4, 10, '#2A2C31', 0.3, { r2: 0.1 });
    placed.push([lx, lz, 5]);
    void x; void z;
  }
  for (let i = 0; i < N; i += 9) {
    const p = S[i];
    if (!p.beach || R() > 0.45) continue;
    const off = w + 14 + R() * 10;
    const x = p.x - p.rx * off, z = p.z - p.rz * off, y = gy(x, z);
    if (y < -0.4 || !free(x, z, 1.5)) continue;
    const uc = ['#E5484D', '#1D7BF0', '#FFC23D', '#3FC67E'][Math.floor(R() * 4)];
    props.cyl(x, y, z, 0.05, 2.4, 5, '#EDEDED', 0.2);
    props.cyl(x, y + 2.1, z, 1.5, 0.55, 8, uc, 0.1, { r2: 0.05 });
    placed.push([x, z, 1.5]);
  }
  return { ground: ground.build(), road: road.build(), props: props.build(), water: water.build(), ring: ring.build() };
}
