import { TOWN, groundH, roadDist, forestD, fbm, vn, ss, inRect, POND, pondR, pondE, pondDepth } from './ztown.js';

const STRIDE = 36;
function writer(n) {
  const buf = new Uint8Array(n * STRIDE), dv = new DataView(buf.buffer);
  let k = 0;
  const put = (x, y, z, nx, ny, nz, u, v, c, a, lay) => {
    const o = k * STRIDE;
    dv.setFloat32(o, x, true); dv.setFloat32(o + 4, y, true); dv.setFloat32(o + 8, z, true);
    dv.setInt16(o + 12, Math.round(nx * 32767), true); dv.setInt16(o + 14, Math.round(ny * 32767), true); dv.setInt16(o + 16, Math.round(nz * 32767), true); dv.setInt16(o + 18, 0, true);
    dv.setFloat32(o + 20, u, true); dv.setFloat32(o + 24, v, true);
    dv.setUint8(o + 28, c[0]); dv.setUint8(o + 29, c[1]); dv.setUint8(o + 30, c[2]); dv.setUint8(o + 31, Math.round(Math.max(0, Math.min(1, a)) * 255));
    dv.setUint16(o + 32, lay, true);
    return k++;
  };
  return { buf, put, count: () => k };
}
const tint = (r, g, b) => [Math.round(Math.min(255, r * 255)), Math.round(Math.min(255, g * 255)), Math.round(Math.min(255, b * 255))];
function nrmAt(x, z) {
  const e = 0.6;
  const hx = groundH(x + e, z) - groundH(x - e, z), hz = groundH(x, z + e) - groundH(x, z - e);
  const nx = -hx, ny = 2 * e, nz = -hz, L = Math.hypot(nx, ny, nz);
  return [nx / L, ny / L, nz / L];
}
export function dirtW(x, z) {
  const rd = roadDist(x, z);
  let d = ss(4.8, 1.6, rd) * 0.75;
  if (inRect(x, z, TOWN.lot, 2.8)) d = Math.max(d, 0.55);
  d = Math.max(d, ss(0.25, 0.8, forestD(x, z)) * 0.85);
  d = Math.max(d, ss(0.66, 0.82, fbm(x * 0.045, z * 0.045, 31, 3)) * 0.8);
  return Math.min(1, d);
}

const GN = 150, GR = 900;
const gwarp = (u) => Math.sign(u) * (Math.pow(Math.abs(u), 2.6) * 0.86 + Math.abs(u) * 0.14) * GR;
let GX = null;
const gy = (I, J) => groundH(GX[J], GX[I]) - (pondE(GX[J], GX[I]) < 1.6 ? 2.5 : 0);
function cell(x) {
  let lo = 0, hi = GN;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (GX[m] <= x) lo = m; else hi = m; }
  return lo;
}
export function meshH(x, z) {
  if (!GX) { GX = new Float64Array(GN + 1); for (let k = 0; k <= GN; k++) GX[k] = gwarp(-1 + (k / GN) * 2); }
  const J = cell(x), I = cell(z);
  const s = Math.max(0, Math.min(1, (x - GX[J]) / (GX[J + 1] - GX[J]))), t = Math.max(0, Math.min(1, (z - GX[I]) / (GX[I + 1] - GX[I])));
  const ya = gy(I, J), yb = gy(I, J + 1), yc = gy(I + 1, J), yd = gy(I + 1, J + 1);
  return s + t <= 1 ? ya + s * (yb - ya) + t * (yc - ya) : yd + (1 - s) * (yc - yd) + (1 - t) * (yb - yd);
}
export function groundParts(L, arr) {
  const out = [];
  const G = L.grass, D = L.dirt, A = L.asphalt, CO = L.concrete;
  const N = 150, R = 900, CH = 10, n = N / CH;
  const warp = (u) => Math.sign(u) * (Math.pow(Math.abs(u), 2.6) * 0.86 + Math.abs(u) * 0.14) * R;
  for (let ci = 0; ci < CH; ci++) for (let cj = 0; cj < CH; cj++) {
    const w = writer((n + 1) * (n + 1));
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, y1 = -1e9;
    for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++) {
      const x = warp(-1 + ((cj * n + j) / N) * 2), z = warp(-1 + ((ci * n + i) / N) * 2), y = groundH(x, z) - (pondE(x, z) < 1.6 ? 2.5 : 0);
      const nn = nrmAt(x, z);
      const v1 = fbm(x * 0.03, z * 0.03, 11, 3), v2 = vn(x * 0.5, z * 0.5, 13);
      const far = ss(200, 520, Math.hypot(x, z));
      const br = (0.86 + v1 * 0.22 + v2 * 0.06) * (1 - far * 0.25);
      const dry = ss(0.55, 0.85, fbm(x * 0.11, z * 0.11, 12, 2)) * 0.3;
      const c = tint(br * (1 + dry * 0.35), br * (1 - dry * 0.05), br * (1 - dry * 0.25));
      w.put(x, y, z, nn[0], nn[1], nn[2], x / 3.2, z / 3.2, c, dirtW(x, z), G | (D << 8));
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); y1 = Math.max(y1, y);
    }
    const idx = new Uint16Array(n * n * 6);
    let q = 0;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const a = i * (n + 1) + j, b = a + 1, c = a + n + 1, d = c + 1;
      idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d;
    }
    out.push({ verts: w.buf, idx, ni: idx.length, nv: w.count(), groups: [{ arr, start: 0, count: idx.length }], bs: [(x0 + x1) / 2, y1 / 2, (z0 + z1) / 2, Math.hypot(x1 - x0, z1 - z0) / 2 + 20], cast: false });
  }
  const strips = [];
  const W = TOWN.roadW;
  const crown = (z) => 0.05 + 0.06 * (1 - (z / W) * (z / W));
  {
    const segs = 320, w = writer((segs + 1) * 13), cols = [];
    for (let s = 0; s <= segs; s++) {
      const x = -320 + s * 2;
      for (let r = 0; r <= 12; r++) {
        const zz = -W - 1.4 + (r / 12) * (2 * W + 2.8);
        const onRoad = Math.abs(zz) <= W + 0.01;
        const y = onRoad ? crown(zz) : 0.045 - (Math.abs(zz) - W) * 0.03;
        const v = vn(x * 0.25, zz * 0.7, 61);
        const b = 0.9 + v * 0.16;
        w.put(x, y, zz, 0, 1, 0, x / 4, zz / 4, tint(b, b, b), onRoad ? 0 : 1, onRoad ? A : (A | (D << 8)));
      }
      cols.push(13);
    }
    const idx = new Uint16Array(segs * 12 * 6);
    let q = 0;
    for (let s = 0; s < segs; s++) for (let r = 0; r < 12; r++) {
      const a = s * 13 + r, b = a + 1, c = a + 13, d = c + 1;
      idx[q++] = a; idx[q++] = b; idx[q++] = c; idx[q++] = b; idx[q++] = d; idx[q++] = c;
    }
    strips.push({ w, idx, bs: [0, 0, 0, 330] });
  }
  {
    const SX = TOWN.sideX, SW = TOWN.sideW, segs = 116, w = writer((segs + 1) * 9);
    for (let s = 0; s <= segs; s++) {
      const z = -W - s * 2;
      for (let r = 0; r <= 8; r++) {
        const xx = SX - SW - 1.2 + (r / 8) * (2 * SW + 2.4);
        const onRoad = Math.abs(xx - SX) <= SW + 0.01;
        const y = groundH(xx, z) + (onRoad ? 0.06 + 0.04 * (1 - ((xx - SX) / SW) ** 2) : 0.04);
        const v = vn(xx * 0.7, z * 0.25, 63);
        const b = 0.9 + v * 0.16;
        w.put(xx, y, z, 0, 1, 0, xx / 4, z / 4, tint(b, b, b), onRoad ? 0 : 1, onRoad ? A : (A | (D << 8)));
      }
    }
    const idx = new Uint16Array(segs * 8 * 6);
    let q = 0;
    for (let s = 0; s < segs; s++) for (let r = 0; r < 8; r++) {
      const a = s * 9 + r, b = a + 1, c = a + 9, d = c + 1;
      idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d;
    }
    strips.push({ w, idx, bs: [SX, 0, -120, 130] });
  }
  {
    const [lx0, lz0, lx1, lz1] = TOWN.lot;
    const nx = Math.ceil((lx1 - lx0) / 2), nz = Math.ceil((lz1 - lz0) / 2), w = writer((nx + 1) * (nz + 1));
    for (let i = 0; i <= nz; i++) for (let j = 0; j <= nx; j++) {
      const x = lx0 + (j / nx) * (lx1 - lx0), z = lz0 + (i / nz) * (lz1 - lz0);
      const v = fbm(x * 0.2, z * 0.2, 71, 2), b = 0.6 + v * 0.18;
      const edge = Math.min(x - lx0, lx1 - x, z - lz0, lz1 - z);
      w.put(x, 0.08, z, 0, 1, 0, x / 3, z / 3, tint(b, b * 0.98, b * 0.95), ss(1.6, 0, edge) * 0.55 + ss(0.72, 0.9, v) * 0.35, CO | (D << 8));
    }
    const idx = new Uint16Array(nx * nz * 6);
    let q = 0;
    for (let i = 0; i < nz; i++) for (let j = 0; j < nx; j++) {
      const a = i * (nx + 1) + j, b = a + 1, c = a + nx + 1, d = c + 1;
      idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d;
    }
    strips.push({ w, idx, bs: [(lx0 + lx1) / 2, 0, (lz0 + lz1) / 2, Math.hypot(lx1 - lx0, lz1 - lz0) / 2] });
  }
  {
    const quads = [];
    const crownY = (z) => crown(z) + 0.012;
    for (let x = -316; x < 316; x += 12) {
      if (x > TOWN.sideX - 6 && x < TOWN.sideX + 6) continue;
      const len = 3 + (vn(x * 0.37, 1.7, 5) > 0.85 ? -1.2 : 0), k = 0.62 + vn(x * 0.21, 3.1, 6) * 0.3;
      quads.push([x, -0.08, x + len, 0.08, [Math.round(232 * k + 70 * (1 - k)), Math.round(184 * k + 70 * (1 - k)), Math.round(48 * k + 72 * (1 - k))]]);
    }
    for (const sz of [-1, 1]) for (let x = -316; x < 316; x += 4) {
      if (sz < 0 && x > TOWN.sideX - TOWN.sideW - 4 && x < TOWN.sideX + TOWN.sideW) continue;
      if (vn(x * 0.53, sz * 2.1 + 9, 7) < 0.22) continue;
      const k = 0.55 + vn(x * 0.31, sz + 3, 8) * 0.35, z = sz * (W - 0.32);
      const g = Math.round(225 * k + 72 * (1 - k));
      quads.push([x, z - 0.07, x + 4, z + 0.07, [g, g, Math.round(g * 0.97)]]);
    }
    const w = writer(quads.length * 4), idx = new Uint16Array(quads.length * 6);
    let q = 0;
    for (const [ax, az, bx, bz, c] of quads) {
      const y = crownY((az + bz) / 2);
      const i0 = w.put(ax, y, az, 0, 1, 0, 0.5, 0.5, c, 0, 0), i1 = w.put(ax, y, bz, 0, 1, 0, 0.5, 0.5, c, 0, 0), i2 = w.put(bx, y, bz, 0, 1, 0, 0.5, 0.5, c, 0, 0), i3 = w.put(bx, y, az, 0, 1, 0, 0.5, 0.5, c, 0, 0);
      idx[q++] = i0; idx[q++] = i1; idx[q++] = i2; idx[q++] = i0; idx[q++] = i2; idx[q++] = i3;
    }
    strips.push({ w, idx, bs: [0, 0, 0, 330] });
  }
  for (const s of strips) out.push({ verts: s.w.buf, idx: s.idx, ni: s.idx.length, nv: s.w.count(), groups: [{ arr, start: 0, count: s.idx.length }], bs: s.bs, cast: false });
  return out;
}

const bedH = (x, z) => groundH(x, z) + pondDepth(x, z);
export function pondBed(L, arr) {
  const G = L.grass, D = L.dirt;
  const ES = [0];
  while (ES[ES.length - 1] < 2.4) { const e = ES[ES.length - 1]; ES.push(e + (e < 0.6 ? 0.15 : e < 0.8 ? 0.07 : e < 1.3 ? 0.035 : 0.09)); }
  const NA = 120, NR = ES.length;
  const w = writer(NR * NA);
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
  for (let i = 0; i < NR; i++) for (let j = 0; j < NA; j++) {
    const a = (j / NA) * Math.PI * 2, r = ES[i] * pondR(a);
    const x = POND.x + Math.cos(a) * POND.rx * r, z = POND.z + Math.sin(a) * POND.rz * r;
    const e = ES[i];
    const y = bedH(x, z) + 0.03 * ss(1.12, 1.4, e);
    const k = 0.35, hx = bedH(x + k, z) - bedH(x - k, z), hz = bedH(x, z + k) - bedH(x, z - k), L2 = Math.hypot(hx, 2 * k, hz);
    const v1 = fbm(x * 0.03, z * 0.03, 11, 3), v2 = vn(x * 0.5, z * 0.5, 13);
    const br = 0.86 + v1 * 0.22 + v2 * 0.06;
    const dry = ss(0.55, 0.85, fbm(x * 0.11, z * 0.11, 12, 2)) * 0.3;
    const wet = 1 - ss(0.88, 1.06, e) * 0.5 - ss(1.06, 1.3, e) * 0.5;
    const dk = 0.5 + 0.5 * (1 - wet);
    const c = tint(br * (1 + dry * 0.35) * dk, br * (1 - dry * 0.05) * dk, br * (1 - dry * 0.25) * dk);
    const mud = 1 - ss(1.04, 1.22 + 0.14 * vn(x * 0.7, z * 0.7, 17), e);
    w.put(x, y, z, -hx / L2, 2 * k / L2, -hz / L2, x / 3.2, z / 3.2, c, Math.max(dirtW(x, z), mud), G | (D << 8));
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z);
  }
  const idx = new Uint16Array((NR - 1) * NA * 6);
  let q = 0;
  for (let i = 0; i < NR - 1; i++) for (let j = 0; j < NA; j++) {
    const a = i * NA + j, b = i * NA + ((j + 1) % NA), c = a + NA, d = b + NA;
    idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d;
  }
  return { verts: w.buf, idx, ni: idx.length, nv: w.count(), groups: [{ arr, start: 0, count: idx.length }], bs: [(x0 + x1) / 2, -0.5, (z0 + z1) / 2, Math.hypot(x1 - x0, z1 - z0) / 2 + 2], cast: false };
}
