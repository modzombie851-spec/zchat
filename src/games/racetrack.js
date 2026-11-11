import { MeshBuilder, hexRgb } from './race3d.js';

export function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export function hash2(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy), b = hash2(ix + 1, iy), c = hash2(ix, iy + 1), d = hash2(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}
export function fbm(x, y, o = 4) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += a * vnoise(x * f, y * f); f *= 2.02; a *= 0.5; } return s; }
export const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const C = (h) => hexRgb(h);
const rotT = (yaw, x, y, z) => { const cy = Math.cos(yaw), sy = Math.sin(yaw); return new Float32Array([cy, 0, -sy, 0, 0, 1, 0, 0, sy, 0, cy, 0, x, y, z, 1]); };

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

export function buildTrack(def, step = 2) {
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
  S.forEach((p) => { p.bank = Math.max(-0.14, Math.min(0.14, -p.curv * (def.bank != null ? def.bank : 6))); });
  const zones = def.zones || {};
  S.forEach((p) => { const u = p.s / total; p.zone = {}; for (const k of Object.keys(zones)) p.zone[k] = zones[k].some(([a, b]) => u >= a && u <= b); });
  const T = { S, N, total, w: def.w, step, def };
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
  T.side = (x, z, i) => { const p = S[i]; return (x - p.x) * p.rx + (z - p.z) * p.rz; };
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  S.forEach((p) => { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z); });
  T.bounds = { minX, maxX, minZ, maxZ };
  return T;
}

export function splitTiles(data, size = 150) {
  const map = new Map();
  for (let k = 0; k < data.length; k += 30) {
    const cx = (data[k] + data[k + 10] + data[k + 20]) / 3, cz = (data[k + 2] + data[k + 12] + data[k + 22]) / 3;
    const key = `${Math.floor(cx / size)},${Math.floor(cz / size)}`;
    let t = map.get(key);
    if (!t) map.set(key, (t = []));
    t.push(k);
  }
  const out = [];
  for (const idx of map.values()) {
    const arr = new Float32Array(idx.length * 30);
    let o = 0, x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
    for (const k of idx) {
      arr.set(data.subarray(k, k + 30), o); o += 30;
      for (let v = 0; v < 30; v += 10) { const x = data[k + v], y = data[k + v + 1], z = data[k + v + 2]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z; }
    }
    out.push({ data: arr, bs: [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, Math.hypot(x1 - x0, y1 - y0, z1 - z0) / 2] });
  }
  return out;
}

export function terrainH(T, x, z) {
  const G = T.def.terrain || {};
  const n = T.near(x, z, 4);
  const far = fbm(x * (G.freq || 0.006) + 3.1, z * (G.freq || 0.006) - 1.7, 4);
  let h = (far - (G.base != null ? G.base : 0.42)) * (G.amp != null ? G.amp : 46) + fbm(x * 0.03, z * 0.03, 3) * (G.detail != null ? G.detail : 4);
  if (G.rise) { const cx = (T.bounds.minX + T.bounds.maxX) / 2, cz = (T.bounds.minZ + T.bounds.maxZ) / 2; h += Math.max(0, Math.hypot(x - cx, z - cz) - G.rise[0]) * G.rise[1]; }
  const p = n.i >= 0 ? T.S[n.i] : null;
  const sea = G.sea && p && p.zone[G.sea] && T.side(x, z, n.i) < 0;
  if (sea) h = Math.min(h, -2.5 - Math.max(0, n.d - 40) * 0.08);
  for (const L of G.lakes || []) {
    const d = Math.hypot(x - L.x, z - L.z);
    if (d < L.r) h = Math.min(h, h + (L.y - h) * smooth(L.r, L.r * 0.55, d));
  }
  if (!sea && n.i >= 0 && n.d < 90) h = Math.max(h, (G.floor != null ? G.floor : -0.4) + Math.max(0, n.d - 60) * -0.05 + (p ? Math.min(0, p.y) : 0));
  if (n.i < 0 || n.d > 130) return h;
  const side = T.side(x, z, n.i);
  const offc = Math.max(-(T.w + 2.4), Math.min(T.w + 2.4, side));
  const roadY = p.y + offc * Math.sin(p.bank) - 0.3;
  const k = smooth(T.w + 3.5, T.w + (G.blend || 30), n.d);
  return roadY + (h - roadY) * k;
}

function makeKit(T, props, R, def) {
  const placed = [];
  const glows = [];
  const w = T.w;
  const gy = (x, z) => terrainH(T, x, z);
  const free = (x, z, r, clear = 5) => {
    const n = T.near(x, z, 3);
    if (n.i >= 0 && n.d < w + clear + r) return false;
    for (const q of placed) if ((q[0] - x) ** 2 + (q[1] - z) ** 2 < (q[2] + r) ** 2) return false;
    return true;
  };
  const place = (x, z, r) => { placed.push([x, z, r]); };
  const pb = props;
  const K = { T, w, R, gy, free, place, pb, glows, def };
  K.palm = (x, z, s = 1, lean = 0) => {
    const y = gy(x, z);
    const segs = 6, H = 9 * s;
    let px = x, pz = z, py = y;
    const dx = Math.cos(lean) * 0.32 * s, dz = Math.sin(lean) * 0.32 * s;
    for (let k = 0; k < segs; k++) {
      const nx2 = px + dx * (k / segs + 0.3), nz2 = pz + dz * (k / segs + 0.3), ny = py + H / segs;
      const r0 = 0.3 * s * (1 - k * 0.06), r1 = 0.3 * s * (1 - (k + 1) * 0.06);
      for (let q = 0; q < 6; q++) {
        const a0 = (q / 6) * Math.PI * 2, a1 = ((q + 1) / 6) * Math.PI * 2;
        pb.quad([px + Math.cos(a0) * r0, py, pz + Math.sin(a0) * r0], [nx2 + Math.cos(a0) * r1, ny, nz2 + Math.sin(a0) * r1], [nx2 + Math.cos(a1) * r1, ny, nz2 + Math.sin(a1) * r1], [px + Math.cos(a1) * r0, py, pz + Math.sin(a1) * r0], k % 2 ? '#8A6A45' : '#7A5C3B', 0);
      }
      px = nx2; pz = nz2; py = ny;
    }
    const fronds = 9;
    for (let f = 0; f < fronds; f++) {
      const ang = (f / fronds) * Math.PI * 2 + R() * 0.4;
      const len = (4.2 + R() * 1.2) * s, ca = Math.cos(ang), sa = Math.sin(ang);
      const seg = 4;
      for (let k = 0; k < seg; k++) {
        const t0 = k / seg, t1 = (k + 1) / seg;
        const droop = (t) => 1.1 * s * t - 3.4 * s * t * t;
        const width = (t) => (0.9 - 0.7 * t) * s;
        const pA = [px + ca * len * t0, py + droop(t0), pz + sa * len * t0], pB = [px + ca * len * t1, py + droop(t1), pz + sa * len * t1];
        const ox = -sa, oz = ca;
        const wA = width(t0), wB = width(t1);
        const col = f % 2 ? '#3E9A4A' : '#2F8740';
        pb.tri(pA, [pB[0] + ox * wB, pB[1] - 0.15 * s, pB[2] + oz * wB], [pA[0] + ox * wA, pA[1] - 0.15 * s, pA[2] + oz * wA], col, 0);
        pb.tri(pA, pB, [pB[0] + ox * wB, pB[1] - 0.15 * s, pB[2] + oz * wB], col, 0);
        pb.tri(pA, [pA[0] - ox * wA, pA[1] - 0.15 * s, pA[2] - oz * wA], [pB[0] - ox * wB, pB[1] - 0.15 * s, pB[2] - oz * wB], col, 0);
        pb.tri(pA, [pB[0] - ox * wB, pB[1] - 0.15 * s, pB[2] - oz * wB], pB, col, 0);
      }
    }
    pb.blob(px, py - 0.2, pz, 0.45 * s, 0.4 * s, 0.45 * s, '#6B4A26', 0, null, 6);
  };
  K.tree = (x, z, s = 1, tones = ['#3F8F3A', '#4FA244', '#35803A', '#5BAE4C'], trunk = '#6E4F33') => {
    const y = gy(x, z);
    pb.cyl(x, y - 0.2, z, 0.28 * s, 2.6 * s, 6, trunk, 0, { r2: 0.2 * s });
    const c = tones[Math.floor(R() * tones.length)];
    pb.blob(x, y + 3.6 * s, z, 2.3 * s, 2.0 * s, 2.3 * s, c, 0, R, 7);
    pb.blob(x + 0.9 * s, y + 4.6 * s, z - 0.5 * s, 1.4 * s, 1.3 * s, 1.4 * s, c, 0, R, 5);
  };
  K.pine = (x, z, s = 1, tones = ['#2E6B3E', '#356F43', '#2A5F38']) => {
    const y = gy(x, z);
    pb.cyl(x, y - 0.3, z, 0.22 * s, 3 * s, 5, '#5E4632', 0, { r2: 0.14 * s });
    const c = tones[Math.floor(R() * tones.length)];
    for (let k = 0; k < 3; k++) pb.cyl(x, y + (1.6 + k * 1.9) * s, z, (2.3 - k * 0.6) * s, (2.9 - k * 0.3) * s, 7, c, 0, { r2: 0.05 });
  };
  K.euca = (x, z, s = 1) => {
    const y = gy(x, z);
    pb.cyl(x, y - 0.3, z, 0.24 * s, 9 * s, 6, '#C9C1B2', 0.08, { r2: 0.12 * s });
    const c = R() > 0.5 ? '#5B8A5A' : '#4E7D52';
    pb.blob(x, y + 9.2 * s, z, 2.2 * s, 2.6 * s, 2.2 * s, c, 0, R, 6);
    pb.blob(x + 1.2 * s, y + 7.6 * s, z + 0.6 * s, 1.5 * s, 1.6 * s, 1.5 * s, c, 0, R, 5);
  };
  K.bush = (x, z, s = 1, tones = ['#4E9B3E', '#3E8A36']) => { const y = gy(x, z); pb.blob(x, y + 0.5 * s, z, 1.2 * s, 0.9 * s, 1.2 * s, tones[R() > 0.5 ? 0 : 1], 0, R, 7); };
  K.dryTree = (x, z, s = 1) => {
    const y = gy(x, z);
    pb.cyl(x, y - 0.2, z, 0.25 * s, 3.2 * s, 5, '#6A5038', 0, { r2: 0.16 * s });
    for (let k = 0; k < 3; k++) {
      const a = R() * Math.PI * 2, L = (1.6 + R()) * s;
      pb.quad([x, y + 3 * s, z], [x + Math.cos(a) * L, y + 4.2 * s, z + Math.sin(a) * L], [x + Math.cos(a) * L + 0.15, y + 4.2 * s, z + Math.sin(a) * L + 0.15], [x + 0.15, y + 3 * s, z + 0.15], '#6A5038', 0);
      pb.blob(x + Math.cos(a) * L, y + 4.5 * s, z + Math.sin(a) * L, 1.9 * s, 0.55 * s, 1.9 * s, R() > 0.5 ? '#7E8C3A' : '#6E7F34', 0, R, 7);
    }
  };
  K.rock = (x, z, s = 1, col = '#8D8578', yOff = -0.4) => {
    const y = gy(x, z);
    pb.blob(x, y + yOff + 0.6 * s, z, 1.6 * s, 1.1 * s, 1.3 * s, col, 0.04, R, 7);
  };
  K.house = (x, z, yaw, s = 1, cols = ['#F2A7B5', '#F6D365', '#8FD3CB', '#F4B183', '#C9B8F0', '#9CC3F2', '#B6E2A1', '#FFFFFF']) => {
    const y = gy(x, z) - 0.3;
    const c = cols[Math.floor(R() * cols.length)];
    const W2 = (6 + R() * 3) * s, D = (5 + R() * 2.5) * s, H2 = (3.2 + (R() > 0.75 ? 3 : 0)) * s;
    pb.setT(rotT(yaw, x, y, z));
    pb.box(0, 0, 0, W2, H2, D, c, 0);
    pb.box(0, 0.05, D / 2 + 0.01, W2 * 0.96, 0.6, 0.02, '#D9D2C4', 0);
    const rh = 1.6 * s;
    const e = [[-W2 / 2 - 0.4, H2, -D / 2 - 0.4], [W2 / 2 + 0.4, H2, -D / 2 - 0.4], [W2 / 2 + 0.4, H2, D / 2 + 0.4], [-W2 / 2 - 0.4, H2, D / 2 + 0.4]];
    const ridge = [[-W2 / 2 + D / 2, H2 + rh, 0], [W2 / 2 - D / 2, H2 + rh, 0]];
    const roof = R() > 0.3 ? '#B65A3E' : '#7C8C99';
    pb.quad(e[0], ridge[0], ridge[1], e[1], roof, 0.05);
    pb.quad(e[2], ridge[1], ridge[0], e[3], roof, 0.05);
    pb.tri(e[1], ridge[1], e[2], roof, 0.05);
    pb.tri(e[3], ridge[0], e[0], roof, 0.05);
    pb.box(-W2 * 0.18, 0, D / 2 + 0.02, 1.1 * s, 2.1 * s, 0.06, '#7A4E2E', 0);
    pb.box(W2 * 0.22, 1.1 * s, D / 2 + 0.02, 1.4 * s, 1.1 * s, 0.06, '#9ED0EE', 0.66);
    if (H2 > 5) { pb.box(-W2 * 0.2, 4.1 * s, D / 2 + 0.02, 1.3 * s, 1.1 * s, 0.06, '#9ED0EE', 0.66); pb.box(W2 * 0.22, 4.1 * s, D / 2 + 0.02, 1.3 * s, 1.1 * s, 0.06, '#9ED0EE', 0.66); }
    pb.setT(null);
  };
  K.lamp = (x, z, yaw, o = {}) => {
    const y = gy(x, z);
    const H = o.h || 7.4, col = o.col || '#5B6470';
    pb.cyl(x, y - 0.2, z, 0.12, H, 6, col, 0.3);
    const ax = Math.sin(yaw) * 1.6, az = Math.cos(yaw) * 1.6;
    pb.quad([x, y + H - 0.15, z], [x + ax, y + H - 0.15, z + az], [x + ax, y + H, z + az], [x, y + H, z], col, 0.3);
    pb.box(x + ax, y + H - 0.35, z + az, 0.5, 0.18, 0.5, o.light || '#FFF2C6', 1);
    if (o.glow) glows.push([x + ax, y + H - 0.45, z + az, o.glowType || 7, o.glowSize || 1.6]);
  };
  K.hedgeRows = (zoneKey, offs, col = '#3E8A35', col2 = '#4A9A3E') => {
    const S = T.S, N = T.N;
    const c1 = hexRgb(col), c2 = hexRgb(col2);
    for (const sgn of [-1, 1]) for (const off of offs) {
      let run = null;
      const flush = () => {
        if (!run || run.length < 2) { run = null; return; }
        const prof = [[-0.75, 0], [-0.7, 0.55], [-0.35, 0.95], [0.35, 0.95], [0.7, 0.55], [0.75, 0]];
        const rows = run.map(([x, z, rx, rz]) => { const y = gy(x, z); return prof.map(([u, v]) => [x + rx * u, y + v - 0.1, z + rz * u]); });
        pb.surface(rows, (off / 2.4) % 2 ? c1 : c2, 0.02);
        run = null;
      };
      for (let i = 0; i < N; i += 3) {
        const p = S[i];
        if (!p.zone[zoneKey]) { flush(); continue; }
        const x = p.x + p.rx * sgn * (w + off), z = p.z + p.rz * sgn * (w + off);
        if (!free(x, z, 0.6, 3)) { flush(); continue; }
        (run || (run = [])).push([x, z, p.rx, p.rz]);
      }
      flush();
    }
  };
  K.teaRow = (cx, cz, yaw, len, tones = ['#3F8F3A', '#4A9C40']) => {
    const ca = Math.cos(yaw), sa = Math.sin(yaw);
    for (let k = -len / 2; k < len / 2; k += 1.6) {
      const x = cx + ca * k, z = cz + sa * k;
      if (!free(x, z, 0.4, 3)) continue;
      const y = gy(x, z);
      pb.blob(x, y + 0.45, z, 0.95, 0.7, 0.95, tones[R() > 0.5 ? 0 : 1], 0, R, 6);
    }
  };
  K.building = (x, z, yaw, bw, bd, bh, o = {}) => {
    const y = gy(x, z) - 0.5;
    const body = o.col || '#4A5468';
    pb.setT(rotT(yaw, x, y, z));
    pb.box(0, 0, 0, bw, bh, bd, body, o.gloss != null ? o.gloss : 0.12, { top: o.roof || '#2C323D' });
    const floorH = 3.4, fl = Math.floor((bh - 2) / floorH);
    const winCol = o.win || '#FFD99A', dark = o.dark || '#1C2533';
    for (const [fx, fz, len, nx, nz] of [[0, bd / 2 + 0.03, bw, 0, 1], [0, -bd / 2 - 0.03, bw, 0, -1], [bw / 2 + 0.03, 0, bd, 1, 0], [-bw / 2 - 0.03, 0, bd, -1, 0]]) {
      const cols = Math.max(2, Math.floor(len / 3.2));
      for (let f = 0; f < fl; f++) {
        const yy = 2 + f * floorH + 0.6;
        if (o.bands) {
          const lit = R() > 0.35;
          const p0 = nz ? [fx - len / 2 + 0.6, yy, fz] : [fx, yy, fz - len / 2 + 0.6], p1 = nz ? [fx + len / 2 - 0.6, yy, fz] : [fx, yy, fz + len / 2 - 0.6];
          const up = [0, 1.8, 0];
          const a = p0, b = p1, c = [p1[0] + up[0], p1[1] + up[1], p1[2] + up[2]], d = [p0[0], p0[1] + 1.8, p0[2]];
          if (nz > 0 || nx < 0) pb.quad(a, b, c, d, lit ? winCol : dark, lit ? 0.83 + R() * 0.05 : 0.66); else pb.quad(b, a, d, c, lit ? winCol : dark, lit ? 0.83 + R() * 0.05 : 0.66);
          continue;
        }
        for (let k = 0; k < cols; k++) {
          const lit = R() > (o.litP != null ? 1 - o.litP : 0.45);
          const t0 = -len / 2 + (len * (k + 0.2)) / cols, t1 = -len / 2 + (len * (k + 0.8)) / cols;
          const a = nz ? [fx + t0, yy, fz] : [fx, yy, fz + t0], b = nz ? [fx + t1, yy, fz] : [fx, yy, fz + t1];
          const c = [b[0], yy + 1.9, b[2]], d = [a[0], yy + 1.9, a[2]];
          const m = lit ? 0.82 + R() * 0.07 : 0.66;
          if (nz > 0 || nx < 0) pb.quad(a, b, c, d, lit ? winCol : dark, m); else pb.quad(b, a, d, c, lit ? winCol : dark, m);
        }
      }
    }
    if (o.crown) { pb.box(0, bh, 0, bw * 0.6, 2.4, bd * 0.6, '#2C323D', 0.2); pb.box(0, bh + 2.4, 0, 0.3, 6, 0.3, '#8A929E', 0.3); pb.box(0, bh + 8.2, 0, 0.5, 0.5, 0.5, '#FF3B30', 1); glows.push([x, y + bh + 8.4, z, 8, 2.2]); }
    if (o.sign) { pb.box(0, bh * 0.7, bd / 2 + 0.25, bw * 0.5, 2.2, 0.15, o.sign, 0.9); }
    pb.setT(null);
  };
  K.barrier = (style) => {
    const S = T.S, N = T.N;
    const off = w + 7.6;
    for (let i = 0; i < N; i++) {
      const a = S[i];
      for (const sg of [-1, 1]) {
        const p0 = T.edge(i, sg * off), p1 = T.edge(i + 1, sg * off);
        const g0 = Math.max(p0[1], gy(p0[0], p0[2]) + 0.05), g1 = Math.max(p1[1], gy(p1[0], p1[2]) + 0.05);
        if (style === 'concrete') {
          const hh = 0.95;
          const out = (p) => [p[0] + a.rx * sg * 0.3, p[1], p[2] + a.rz * sg * 0.3];
          const q0 = [p0[0], g0, p0[2]], q1 = [p1[0], g1, p1[2]];
          const curve = Math.abs(a.curv) > 0.012;
          const stripe = curve ? (Math.floor(a.s / 3) % 2 ? '#E5484D' : '#F4F1EA') : '#B9BCC2';
          if (sg < 0) { pb.quad(q1, q0, [q0[0], g0 + hh, q0[2]], [q1[0], g1 + hh, q1[2]], stripe, 0.08); pb.quad([q0[0], g0 + hh, q0[2]], out([q0[0], g0 + hh, q0[2]]), out([q1[0], g1 + hh, q1[2]]), [q1[0], g1 + hh, q1[2]], '#A6A9AE', 0.05); }
          else { pb.quad(q0, q1, [q1[0], g1 + hh, q1[2]], [q0[0], g0 + hh, q0[2]], stripe, 0.08); pb.quad([q1[0], g1 + hh, q1[2]], out([q1[0], g1 + hh, q1[2]]), out([q0[0], g0 + hh, q0[2]]), [q0[0], g0 + hh, q0[2]], '#A6A9AE', 0.05); }
        } else if (style === 'wood') {
          if (i % 3 === 0) pb.box(p0[0], g0 - 0.2, p0[2], 0.16, 1.2, 0.16, '#7A5A3A', 0);
          for (const hh of [0.55, 0.95]) {
            const A = [p0[0], g0 + hh, p0[2]], B = [p1[0], g1 + hh, p1[2]];
            if (sg < 0) pb.quad(B, A, [A[0], A[1] + 0.12, A[2]], [B[0], B[1] + 0.12, B[2]], '#8B6844', 0); else pb.quad(A, B, [B[0], B[1] + 0.12, B[2]], [A[0], A[1] + 0.12, A[2]], '#8B6844', 0);
          }
        } else {
          if (i % 2 === 0) pb.box(p0[0], g0 - 0.3, p0[2], 0.12, 1.0, 0.12, '#6B7078', 0.3);
          const A = [p0[0], g0 + 0.52, p0[2]], B = [p1[0], g1 + 0.52, p1[2]];
          const col = Math.abs(a.curv) > 0.014 && Math.floor(a.s / 4) % 2 ? '#D84040' : '#C3C8CF';
          if (sg < 0) pb.quad(B, A, [A[0], A[1] + 0.3, A[2]], [B[0], B[1] + 0.3, B[2]], col, 0.74); else pb.quad(A, B, [B[0], B[1] + 0.3, B[2]], [A[0], A[1] + 0.3, A[2]], col, 0.74);
        }
      }
    }
  };
  K.grandstand = (s0, sg, len = 40, crowd = true) => {
    const p = T.at(s0, sg * (w + 12));
    const yaw = p.heading + (sg > 0 ? -Math.PI / 2 : Math.PI / 2);
    const y = gy(p.x, p.z);
    pb.setT(rotT(yaw, p.x, y - 0.3, p.z));
    const rows = 6;
    for (let r = 0; r < rows; r++) {
      pb.box(0, r * 0.6, -r * 0.9, len, 0.6, 0.9, r % 2 ? '#8E96A3' : '#9AA2AE', 0.05);
      if (crowd) for (let k = 0; k < len / 0.9; k++) {
        if (R() < 0.18) continue;
        const cx = -len / 2 + 0.45 + k * 0.9 + (R() - 0.5) * 0.2;
        const cc = ['#E5484D', '#3D8BFF', '#FFC23D', '#F4F1EA', '#3FC67E', '#A979FF', '#1F2329', '#FF7EB9'][Math.floor(R() * 8)];
        pb.box(cx, r * 0.6 + 0.6, -r * 0.9 - 0.2, 0.42, 0.55 + R() * 0.12, 0.3, cc, 0);
        pb.box(cx, r * 0.6 + 1.2, -r * 0.9 - 0.2, 0.22, 0.22, 0.22, R() > 0.5 ? '#6B4A35' : '#3E2A1E', 0);
      }
    }
    pb.box(0, rows * 0.6 + 2.6, -rows * 0.45, len + 1, 0.25, rows * 0.9 + 1.4, '#E9EDF2', 0.2);
    for (const sx of [-len / 2, len / 2]) pb.box(sx, 0, -rows * 0.9, 0.3, rows * 0.6 + 2.6, 0.3, '#C9CED6', 0.3);
    pb.setT(null);
    place(p.x, p.z, len / 2 + 2);
  };
  K.billboard = (x, z, yaw, cols) => {
    const y = gy(x, z);
    pb.setT(rotT(yaw, x, y, z));
    pb.box(-3, 0, 0, 0.3, 4, 0.3, '#5B6470', 0.3); pb.box(3, 0, 0, 0.3, 4, 0.3, '#5B6470', 0.3);
    pb.box(0, 3.6, 0, 8, 3.6, 0.3, '#24262B', 0.1);
    pb.quad([-3.8, 3.8, 0.17], [3.8, 3.8, 0.17], [3.8, 7.0, 0.17], [-3.8, 7.0, 0.17], cols[0], 0.84);
    pb.quad([-3.8, 3.8, 0.18], [0.2, 3.8, 0.18], [-1.2, 7.0, 0.18], [-3.8, 7.0, 0.18], cols[1], 0.84);
    pb.quad([1.6, 4.4, 0.19], [3.3, 4.4, 0.19], [3.3, 6.4, 0.19], [1.6, 6.4, 0.19], cols[2], 0.86);
    pb.setT(null);
  };
  K.tires = (x, z, n = 3) => { const y = gy(x, z); for (let k = 0; k < n; k++) pb.cyl(x, y + k * 0.32 - 0.05, z, 0.55, 0.32, 9, k % 2 ? '#1A1B1E' : '#E5484D', 0.05, { r2: 0.55 }); };
  K.flag = (x, z, col) => { const y = gy(x, z); pb.cyl(x, y, z, 0.06, 6, 5, '#E9EDF2', 0.3); pb.quad([x, y + 6, z], [x + 1.8, y + 5.6, z + 0.3], [x + 1.8, y + 4.6, z + 0.3], [x, y + 4.9, z], col, 0); pb.quad([x + 1.8, y + 5.6, z + 0.3], [x, y + 6, z], [x, y + 4.9, z], [x + 1.8, y + 4.6, z + 0.3], col, 0); };
  K.elephant = (x, z, yaw, s = 1) => {
    const y = gy(x, z);
    pb.setT(rotT(yaw, x, y, z));
    const g = '#7D7A78', g2 = '#6E6B69';
    pb.blob(0, 2.2 * s, 0, 1.25 * s, 1.0 * s, 1.9 * s, g, 0.04, null, 10, true);
    for (const [lx, lz] of [[-0.6, 1.1], [0.6, 1.1], [-0.6, -1.1], [0.6, -1.1]]) pb.cyl(lx * s, 0, lz * s, 0.36 * s, 1.9 * s, 7, g2, 0.03);
    pb.blob(0, 2.6 * s, 2.0 * s, 0.75 * s, 0.75 * s, 0.7 * s, g, 0.04, null, 9, true);
    for (const sx of [-1, 1]) pb.quad([sx * 0.5 * s, 3.1 * s, 1.85 * s], [sx * 1.35 * s, 2.9 * s, 1.55 * s], [sx * 1.25 * s, 1.9 * s, 1.6 * s], [sx * 0.55 * s, 2.0 * s, 1.95 * s], g2, 0.02);
    pb.cyl(0, 0.6 * s, 2.55 * s, 0.17 * s, 2.0 * s, 6, g2, 0.03, { r2: 0.24 * s });
    for (const sx of [-1, 1]) pb.quad([sx * 0.25 * s, 2.25 * s, 2.45 * s], [sx * 0.32 * s, 1.75 * s, 2.95 * s], [sx * 0.38 * s, 1.8 * s, 2.95 * s], [sx * 0.33 * s, 2.3 * s, 2.45 * s], '#F2EBDD', 0.2);
    pb.setT(null);
  };
  K.boat = (x, z, yaw, WY) => {
    pb.setT(rotT(yaw, x, WY - 0.05, z));
    pb.box(0, 0, 0, 0.9, 0.6, 7, '#8A5A34', 0.1, { taper: 0.12 });
    pb.box(0, 0.6, 0, 0.95, 0.12, 6.4, '#E5484D', 0.1);
    pb.box(-2.2, 0, 0.2, 0.3, 0.3, 4.5, '#6B4A2E', 0.1);
    pb.box(-1.1, 0.55, -1.2, 2.2, 0.1, 0.12, '#6B4A2E', 0.1);
    pb.box(-1.1, 0.55, 1.5, 2.2, 0.1, 0.12, '#6B4A2E', 0.1);
    pb.cyl(0, 0.6, -0.4, 0.06, 4.2, 5, '#6B4A2E', 0);
    pb.quad([0, 4.6, -0.4], [0, 1.2, -0.4], [0, 1.4, 2.6], [0, 3.9, 1.2], '#F4EBDD', 0);
    pb.setT(null);
  };
  return K;
}

export function buildWorld(T, opts = {}) {
  const def = T.def;
  const R = rng(opts.seed || def.seed || 7);
  const ground = new MeshBuilder(), road = new MeshBuilder(), props = new MeshBuilder();
  const { S, N, w } = T;
  const RD = def.road || {};
  const asphalt = C(RD.a || '#4E535B'), asphalt2 = C(RD.b || '#555A62');
  const shoulderOf = RD.shoulder || (() => '#8E9A5A');
  for (let i = 0; i < N; i++) {
    const a = S[i];
    const L0 = T.edge(i, -w), R0 = T.edge(i, w), L1 = T.edge(i + 1, -w), R1 = T.edge(i + 1, w);
    const c = mixc(asphalt, asphalt2, hash2(i * 0.37, 1.3));
    road.quad(L0, L1, R1, R0, c, RD.gloss != null ? RD.gloss : 0.08);
    const up = 0.025;
    const lift = (p) => [p[0], p[1] + up, p[2]];
    if (RD.center !== false && Math.floor(a.s / 6) % 2 === 0) road.quad(lift(T.edge(i, -0.14)), lift(T.edge(i + 1, -0.14)), lift(T.edge(i + 1, 0.14)), lift(T.edge(i, 0.14)), RD.centerCol || '#F2EFE6', 0.1);
    if (RD.ruts) for (const lx of [-3.6, -1.6, 1.6, 3.6]) road.quad(lift(T.edge(i, lx - 0.35)), lift(T.edge(i + 1, lx - 0.35)), lift(T.edge(i + 1, lx + 0.35)), lift(T.edge(i, lx + 0.35)), mixc(C(RD.ruts), c, 0.35 + hash2(i, lx) * 0.3), 0);
    if (RD.lanes) for (const lx of [-w / 2, w / 2]) if (Math.floor(a.s / 5) % 2 === 0) road.quad(lift(T.edge(i, lx - 0.1)), lift(T.edge(i + 1, lx - 0.1)), lift(T.edge(i + 1, lx + 0.1)), lift(T.edge(i, lx + 0.1)), '#E9E6DE', 0.1);
    for (const sgn of [-1, 1]) {
      if (RD.edge !== false) road.quad(lift(T.edge(i, sgn * (w - 0.55))), lift(T.edge(i + 1, sgn * (w - 0.55))), lift(T.edge(i + 1, sgn * (w - 0.3))), lift(T.edge(i, sgn * (w - 0.3))), RD.edgeCol || '#ECE7DA', 0.1);
      const curb = Math.abs(a.curv) > 0.011 && RD.curbs !== false;
      const shoulder = shoulderOf(a, sgn);
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
  for (let i = 0; i < 2; i++) {
    for (let k = -Math.round(w); k < Math.round(w); k++) {
      const col = (i + k) % 2 === 0 ? '#F6F4EE' : '#1F2329';
      const s0 = i * 0.8, s1 = s0 + 0.8;
      const A = T.at(s0, k), B = T.at(s1, k), Cq = T.at(s1, k + 1), D = T.at(s0, k + 1);
      const lf = (p) => [p.x, p.y + 0.03, p.z];
      road.quad(lf(A), lf(B), lf(Cq), lf(D), col, 0.1);
    }
  }
  for (let slot = 0; slot < 6; slot++) {
    const row = Math.floor(slot / 2), gs = -7 - row * 8.5, gx = slot % 2 ? -3 : 3;
    for (const [a0, a1, b0, b1] of [[gs + 1.6, gs + 1.85, gx - 1.1, gx + 1.1], [gs - 1.4, gs + 1.85, gx - 1.1, gx - 0.92], [gs - 1.4, gs + 1.85, gx + 0.92, gx + 1.1]]) {
      const A = T.at(a0, b0), B = T.at(a1, b0), Cq = T.at(a1, b1), D = T.at(a0, b1);
      road.quad([A.x, A.y + 0.03, A.z], [B.x, B.y + 0.03, B.z], [Cq.x, Cq.y + 0.03, Cq.z], [D.x, D.y + 0.03, D.z], '#F2EFE6', 0.1);
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
  const GP = (ix, iz) => [x0 + ix * cs + (hash2(ix, iz) - 0.5) * cs * 0.3, Hs[iz * (nx + 1) + ix], z0 + iz * cs + (hash2(iz, ix) - 0.5) * cs * 0.3];
  const tcol = def.groundColor(T);
  for (let iz = 0; iz < nz; iz++) for (let ix = 0; ix < nx; ix++) {
    const a = GP(ix, iz), b = GP(ix + 1, iz), c = GP(ix + 1, iz + 1), d = GP(ix, iz + 1);
    const sl1 = Math.min(1, Math.abs(a[1] - c[1]) / cs), sl2 = Math.min(1, Math.abs(b[1] - d[1]) / cs);
    if ((ix + iz) % 2) { ground.tri(a, d, b, tcol(a, sl1), 0); ground.tri(b, d, c, tcol(c, sl2), 0); } else { ground.tri(a, d, c, tcol(a, sl1), 0); ground.tri(a, c, b, tcol(c, sl2), 0); }
  }
  const water = new MeshBuilder();
  const WY = def.water != null ? def.water.y : null;
  if (WY != null) {
    const wx0 = minX - 700, wx1 = maxX + 700, wz0 = minZ - 700, wz1 = maxZ + 700;
    const c0 = C(def.water.a || '#2B86BE'), c1 = C(def.water.b || '#3AA3CF');
    for (let i = 0; i < 12; i++) for (let k = 0; k < 12; k++) {
      const xa = wx0 + ((wx1 - wx0) * i) / 12, xb = wx0 + ((wx1 - wx0) * (i + 1)) / 12, za = wz0 + ((wz1 - wz0) * k) / 12, zb = wz0 + ((wz1 - wz0) * (k + 1)) / 12;
      water.quad([xa, WY, za], [xa, WY, zb], [xb, WY, zb], [xb, WY, za], mixc(c0, c1, hash2(i * 1.7, k * 2.3)), def.water.mat || 0.67);
    }
  }
  const K = makeKit(T, props, R, def);
  if (def.barrier) K.barrier(def.barrier);
  const gant = T.at(0);
  {
    const yaw = gant.heading;
    props.setT(rotT(yaw, gant.x, gant.y, gant.z));
    const gc = def.gantry || '#1D7BF0';
    props.box(-w - 1.4, 0, 0, 0.7, 7.2, 0.7, '#E9EDF2', 0.3);
    props.box(w + 1.4, 0, 0, 0.7, 7.2, 0.7, '#E9EDF2', 0.3);
    props.box(0, 6.0, 0, 2 * w + 3.6, 2.0, 0.6, gc, 0.25);
    props.box(0, 7.95, 0, 2 * w + 4.2, 0.3, 0.8, '#E9EDF2', 0.3);
    for (const zf of [-0.32, 0.32]) {
      for (let k = 0; k < 24; k++) for (let r = 0; r < 2; r++) props.box(-w - 0.6 + (k * (2 * w + 1.2)) / 24 + (2 * w + 1.2) / 48, 7.25 + r * 0.32, zf, (2 * w + 1.2) / 24, 0.32, 0.02, (k + r) % 2 ? '#FFFFFF' : '#111317', 0);
      for (let k = 0; k < 5; k++) { props.box(-2.4 + k * 1.2, 6.15, zf * 1.06, 0.82, 0.82, 0.04, '#1B1D21', 0.2); props.box(-2.4 + k * 1.2, 6.28, zf * 1.12, 0.56, 0.56, 0.03, k < 3 ? '#FF2A2A' : '#4A1416', k < 3 ? 1 : 0.2); }
    }
    for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) props.box(sx * (w + 1.4), 1.2 + k * 1.9, 0, 0.74, 0.9, 0.74, k % 2 ? '#FFFFFF' : '#E5484D', 0.2);
    props.setT(null);
    K.place(gant.x, gant.z, 4);
  }
  const ring = new MeshBuilder();
  const cxm = (minX + maxX) / 2, czm = (minZ + maxZ) / 2;
  const RG = def.ring || {};
  const NS = 160;
  const ridge = (a, layer) => {
    const u = a * 3.2 + layer * 11.3;
    return ((layer ? 120 : 70) + fbm(Math.cos(u) * 2 + 5 + layer, Math.sin(u) * 2 - 3, 4) * (layer ? 220 : 150) + Math.max(0, fbm(u * 0.9, layer + 1.7, 3) - 0.55) * 260) * (RG.scale || 1);
  };
  for (let layer = 0; layer < 2; layer++) {
    const rr = (layer ? 1250 : 900) * (RG.r || 1);
    const cols = layer ? RG.far || ['#6B8FB8', '#7598C0'] : RG.near || ['#55806E', '#5E8A72'];
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
  if (def.scenery) def.scenery(K, { ring, water, WY, R });
  const glows = K.glows;
  return { ground: splitTiles(ground.build(), 200), road: splitTiles(road.build(), 200), props: splitTiles(props.build(), 120), water: water.build(), ring: ring.build(), glows: new Float32Array(glows.flat()) };
}
