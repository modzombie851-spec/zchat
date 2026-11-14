import { CLIMB, CLIMB_CELL } from './zclimbdata.js';
import { PLAY } from './ztown.js';
import { partY } from './ztownview.js';

const HASH = 8;
let built = null;

function grid(k) {
  const d = CLIMB[k];
  if (!d) return null;
  if (!d.h) {
    const bin = atob(d[4]);
    const h = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) h[i] = bin.charCodeAt(i);
    let top = 0;
    for (let i = 0; i < h.length; i++) top = Math.max(top, h[i]);
    d.h = h;
    d.top = top * 0.02;
  }
  return d;
}

function build() {
  const map = new Map();
  for (const [id, x, z, yaw = 0, s = 1, dy = 0] of PLAY) {
    const d = grid(id);
    if (!d || d.top < 0.3) continue;
    const x0 = d[0], z0 = d[1], x1 = x0 + d[2] * CLIMB_CELL, z1 = z0 + d[3] * CLIMB_CELL;
    const m = { min: [x0, 0, z0], max: [x1, d.top, z1] };
    const a = (yaw * Math.PI) / 180;
    const P = { d, x, z, s, c: Math.cos(a), n: Math.sin(a), y: partY(m, id, x, z, yaw, s) + dy, r: Math.hypot(Math.max(-x0, x1), Math.max(-z0, z1)) * s };
    const ci0 = Math.floor((x - P.r) / HASH), ci1 = Math.floor((x + P.r) / HASH), cj0 = Math.floor((z - P.r) / HASH), cj1 = Math.floor((z + P.r) / HASH);
    for (let i = ci0; i <= ci1; i++) for (let j = cj0; j <= cj1; j++) {
      const key = i * 4099 + j;
      let L = map.get(key);
      if (!L) map.set(key, (L = []));
      L.push(P);
    }
  }
  return map;
}

export function topAt(x, z) {
  if (!built) built = build();
  const L = built.get(Math.floor(x / HASH) * 4099 + Math.floor(z / HASH));
  if (!L) return null;
  let best = null;
  for (const P of L) {
    const dx = x - P.x, dz = z - P.z;
    if (dx * dx + dz * dz > P.r * P.r) continue;
    const lx = (P.c * dx - P.n * dz) / P.s, lz = (P.n * dx + P.c * dz) / P.s;
    const d = P.d;
    const i = Math.floor((lx - d[0]) / CLIMB_CELL), j = Math.floor((lz - d[1]) / CLIMB_CELL);
    if (i < 0 || j < 0 || i >= d[2] || j >= d[3]) continue;
    const h = d.h[j * d[2] + i] * 0.02 * P.s;
    if (h < 0.3) continue;
    const y = P.y + h;
    if (best == null || y > best) best = y;
  }
  return best;
}

export function ledgeAhead(x, z, yaw, feet, reach = 2.75) {
  const fx = Math.sin(yaw), fz = Math.cos(yaw);
  for (const d of [0.45, 0.7, 0.95, 1.2]) {
    const px = x + fx * d, pz = z + fz * d;
    const t = topAt(px, pz);
    if (t == null || t <= feet + 0.35 || t > feet + reach) continue;
    for (const e of [0.35, 0.2, 0.05]) {
      const qx = px + fx * e, qz = pz + fz * e, t2 = topAt(qx, qz);
      if (t2 != null && Math.abs(t2 - t) < 0.25) return { x: qx, z: qz, y: t2 };
    }
    return { x: px, z: pz, y: t };
  }
  return null;
}
