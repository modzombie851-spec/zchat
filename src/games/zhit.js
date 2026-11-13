import { floorH } from './ztown.js';

const INST = [];
const GRID = new Map();
const CELL = 0.8;
let stamp = 1, seen = new Uint32Array(1024);

export function hitReset() { INST.length = 0; }

export function hitAdd(M, x, y, z, yawDeg, s = 1) {
  if (!M || !M.verts || !M.idx) return;
  const a = yawDeg * Math.PI / 180, c = Math.cos(a), n = Math.sin(a);
  const pts = [[M.min[0], M.min[2]], [M.max[0], M.min[2]], [M.min[0], M.max[2]], [M.max[0], M.max[2]]];
  let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9;
  for (const [lx, lz] of pts) {
    const wx = x + (c * lx + n * lz) * s, wz = z + (-n * lx + c * lz) * s;
    x0 = Math.min(x0, wx); x1 = Math.max(x1, wx); z0 = Math.min(z0, wz); z1 = Math.max(z1, wz);
  }
  INST.push({ M, x, y, z, c, n, s, box: [x0, y + M.min[1] * s, z0, x1, y + M.max[1] * s, z1] });
}

function gridOf(M) {
  let G = GRID.get(M);
  if (G) return G;
  const P = new Float32Array(M.verts.buffer, M.verts.byteOffset, M.nv * 9);
  const I = M.idx, nt = (M.ni / 3) | 0;
  const gx0 = M.min[0] - 0.01, gz0 = M.min[2] - 0.01;
  const W = Math.max(1, Math.ceil((M.max[0] - gx0 + 0.02) / CELL)), H = Math.max(1, Math.ceil((M.max[2] - gz0 + 0.02) / CELL));
  const cnt = new Uint32Array(W * H + 1);
  const span = (t) => {
    const a = I[t * 3] * 9, b = I[t * 3 + 1] * 9, d = I[t * 3 + 2] * 9;
    const i0 = Math.max(0, Math.floor((Math.min(P[a], P[b], P[d]) - gx0) / CELL)), i1 = Math.min(W - 1, Math.floor((Math.max(P[a], P[b], P[d]) - gx0) / CELL));
    const j0 = Math.max(0, Math.floor((Math.min(P[a + 2], P[b + 2], P[d + 2]) - gz0) / CELL)), j1 = Math.min(H - 1, Math.floor((Math.max(P[a + 2], P[b + 2], P[d + 2]) - gz0) / CELL));
    return [i0, i1, j0, j1];
  };
  for (let t = 0; t < nt; t++) { const [i0, i1, j0, j1] = span(t); for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) cnt[j * W + i + 1]++; }
  for (let k = 1; k <= W * H; k++) cnt[k] += cnt[k - 1];
  const list = new Uint32Array(cnt[W * H]), fill = cnt.slice(0, W * H);
  for (let t = 0; t < nt; t++) { const [i0, i1, j0, j1] = span(t); for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) list[fill[j * W + i]++] = t; }
  if (seen.length < nt) seen = new Uint32Array(Math.max(nt, seen.length * 2));
  G = { P, I, W, H, gx0, gz0, cnt, list };
  GRID.set(M, G);
  return G;
}

function triHit(P, I, t, ox, oy, oz, dx, dy, dz, best, out) {
  const a = I[t * 3] * 9, b = I[t * 3 + 1] * 9, c = I[t * 3 + 2] * 9;
  const e1x = P[b] - P[a], e1y = P[b + 1] - P[a + 1], e1z = P[b + 2] - P[a + 2];
  const e2x = P[c] - P[a], e2y = P[c + 1] - P[a + 1], e2z = P[c + 2] - P[a + 2];
  const px = dy * e2z - dz * e2y, py = dz * e2x - dx * e2z, pz = dx * e2y - dy * e2x;
  const det = e1x * px + e1y * py + e1z * pz;
  if (Math.abs(det) < 1e-9) return best;
  const inv = 1 / det;
  const sx = ox - P[a], sy = oy - P[a + 1], sz = oz - P[a + 2];
  const u = (sx * px + sy * py + sz * pz) * inv;
  if (u < 0 || u > 1) return best;
  const qx = sy * e1z - sz * e1y, qy = sz * e1x - sx * e1z, qz = sx * e1y - sy * e1x;
  const v = (dx * qx + dy * qy + dz * qz) * inv;
  if (v < 0 || u + v > 1) return best;
  const tt = (e2x * qx + e2y * qy + e2z * qz) * inv;
  if (tt <= 1e-4 || tt >= best) return best;
  out[0] = e1y * e2z - e1z * e2y; out[1] = e1z * e2x - e1x * e2z; out[2] = e1x * e2y - e1y * e2x;
  return tt;
}

function modelRay(G, ox, oy, oz, dx, dy, dz, tMax, nrm) {
  const { P, I, W, H, gx0, gz0, cnt, list } = G;
  stamp++;
  if (stamp > 4e9) { seen.fill(0); stamp = 1; }
  let best = tMax;
  let t0 = 0, t1 = tMax;
  const W0 = gx0, W1 = gx0 + W * CELL, H0 = gz0, H1 = gz0 + H * CELL;
  for (const [o, d, lo, hi] of [[ox, dx, W0, W1], [oz, dz, H0, H1]]) {
    if (Math.abs(d) < 1e-9) { if (o < lo || o > hi) return -1; continue; }
    let a = (lo - o) / d, b = (hi - o) / d;
    if (a > b) { const q = a; a = b; b = q; }
    t0 = Math.max(t0, a); t1 = Math.min(t1, b);
    if (t0 > t1) return -1;
  }
  let x = ox + dx * t0, z = oz + dz * t0;
  let i = Math.min(W - 1, Math.max(0, Math.floor((x - gx0) / CELL))), j = Math.min(H - 1, Math.max(0, Math.floor((z - gz0) / CELL)));
  const si = dx > 0 ? 1 : -1, sj = dz > 0 ? 1 : -1;
  const tdx = Math.abs(dx) > 1e-9 ? CELL / Math.abs(dx) : 1e9, tdz = Math.abs(dz) > 1e-9 ? CELL / Math.abs(dz) : 1e9;
  let tx = Math.abs(dx) > 1e-9 ? (gx0 + (i + (dx > 0 ? 1 : 0)) * CELL - ox) / dx : 1e9;
  let tz = Math.abs(dz) > 1e-9 ? (gz0 + (j + (dz > 0 ? 1 : 0)) * CELL - oz) / dz : 1e9;
  const tmp = [0, 0, 0];
  for (let guard = 0; guard < 4096; guard++) {
    const k = j * W + i;
    for (let q = cnt[k], e = cnt[k + 1]; q < e; q++) {
      const t = list[q];
      if (seen[t] === stamp) continue;
      seen[t] = stamp;
      const r = triHit(P, I, t, ox, oy, oz, dx, dy, dz, best, tmp);
      if (r < best) { best = r; nrm[0] = tmp[0]; nrm[1] = tmp[1]; nrm[2] = tmp[2]; }
    }
    const tNext = Math.min(tx, tz);
    if (best <= tNext || tNext > t1) break;
    if (tx < tz) { i += si; tx += tdx; if (i < 0 || i >= W) break; } else { j += sj; tz += tdz; if (j < 0 || j >= H) break; }
  }
  return best < tMax ? best : -1;
}

function boxT(b, o, d, tMax) {
  let t0 = 0, t1 = tMax;
  for (let k = 0; k < 3; k++) {
    const lo = b[k], hi = b[k + 3];
    if (Math.abs(d[k]) < 1e-9) { if (o[k] < lo || o[k] > hi) return -1; continue; }
    let a = (lo - o[k]) / d[k], c = (hi - o[k]) / d[k];
    if (a > c) { const q = a; a = c; c = q; }
    t0 = Math.max(t0, a); t1 = Math.min(t1, c);
    if (t0 > t1) return -1;
  }
  return t0;
}

function groundT(o, d, tMax) {
  const step = 0.35;
  let pt = 0, py = o[1] - floorH(o[0], o[2]);
  if (py < 0) return -1;
  for (let t = step; t <= tMax + step; t += step) {
    const tt = Math.min(t, tMax), x = o[0] + d[0] * tt, z = o[2] + d[2] * tt, y = o[1] + d[1] * tt;
    const h = y - floorH(x, z);
    if (h < 0) {
      let a = pt, b = tt;
      for (let k = 0; k < 8; k++) { const m = (a + b) / 2; if (o[1] + d[1] * m - floorH(o[0] + d[0] * m, o[2] + d[2] * m) < 0) b = m; else a = m; }
      return b;
    }
    pt = tt; py = h;
    if (tt >= tMax) break;
  }
  return -1;
}

export function hitRay(o, d, tMax) {
  let best = tMax, n = [0, 1, 0], kind = 0;
  const g = groundT(o, d, tMax);
  if (g >= 0) { best = g; kind = 1; }
  const nl = [0, 0, 0];
  for (const it of INST) {
    if (boxT(it.box, o, d, best) < 0) continue;
    const rx = o[0] - it.x, ry = o[1] - it.y, rz = o[2] - it.z, s = it.s;
    const lox = (it.c * rx - it.n * rz) / s, loy = ry / s, loz = (it.n * rx + it.c * rz) / s;
    const ldx = (it.c * d[0] - it.n * d[2]) / s, ldy = d[1] / s, ldz = (it.n * d[0] + it.c * d[2]) / s;
    const t = modelRay(gridOf(it.M), lox, loy, loz, ldx, ldy, ldz, best, nl);
    if (t >= 0 && t < best) {
      best = t; kind = 2;
      const wx = it.c * nl[0] + it.n * nl[2], wz = -it.n * nl[0] + it.c * nl[2], wy = nl[1];
      const L = Math.hypot(wx, wy, wz) || 1;
      n = [wx / L, wy / L, wz / L];
    }
  }
  if (!kind) return null;
  if (n[0] * d[0] + n[1] * d[1] + n[2] * d[2] > 0) n = [-n[0], -n[1], -n[2]];
  return { t: best, p: [o[0] + d[0] * best, o[1] + d[1] * best, o[2] + d[2] * best], n, ground: kind === 1 };
}
