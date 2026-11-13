import { HOUSE_DATA as D } from './zhousedata.js';

const N = D.W * D.H;
const hb0 = new Uint8Array(N), fb0 = new Uint8Array(N), hb1 = new Uint8Array(N), fb1 = new Uint8Array(N);
function dec(L, hb, fb) {
  let k = 0;
  for (let i = 0; i < L.length; i += 2) {
    const n = L[i], key = L[i + 1], h = key >> 2, f = key & 3;
    for (let j = 0; j < n && k < N; j++, k++) { hb[k] = h; fb[k] = f; }
  }
}
dec(D.l0, hb0, fb0);
dec(D.l1, hb1, fb1);

export const HOUSE = { x0: D.x0, z0: D.z0, x1: D.x0 + D.W * D.R, z1: D.z0 + D.H * D.R, W: D.W, H: D.H, R: D.R, f0: D.f0, f1: D.f1, st: D.st };
export const HOUSE_SPAWNS = D.sp;
const ST = D.st;
const WALL_R = 0.45;

export function hcell(x, z) {
  const gx = Math.floor((x - D.x0) / D.R), gz = Math.floor((z - D.z0) / D.R);
  return gx < 0 || gz < 0 || gx >= D.W || gz >= D.H ? -1 : gz * D.W + gx;
}
export function inHouse(x, z, pad = 0) { return x >= HOUSE.x0 - pad && x < HOUSE.x1 + pad && z >= HOUSE.z0 - pad && z < HOUSE.z1 + pad; }
export function stairT(x, z) {
  if (x < ST[0] || x > ST[2] || z < ST[1] || z > ST[3]) return -1;
  return (z - ST[1]) / (ST[3] - ST[1]);
}
export function houseY(x, z, lv) {
  const t = stairT(x, z);
  if (t >= 0) return D.f0 + t * (D.f1 - D.f0);
  const k = hcell(x, z);
  if (k < 0) return null;
  const h = (lv ? hb1 : hb0)[k];
  return h === 255 ? null : h * 0.05 - 1;
}
export function cellBlocked(k, lv, shot) {
  if (k < 0) return false;
  if (lv) {
    if (hb1[k] === 255) return !shot;
    return shot ? (fb1[k] & 2) !== 0 : (fb1[k] & 1) !== 0;
  }
  return shot ? (fb0[k] & 2) !== 0 : (fb0[k] & 1) !== 0;
}
export function houseBlocked(x, z, lv, shot) { return cellBlocked(hcell(x, z), lv, shot); }

export function houseCollide(x, z, r, lv) {
  if (!inHouse(x, z, r + 0.3)) return [x, z];
  const R = D.R, rr = Math.min(r, WALL_R);
  for (let pass = 0; pass < 2; pass++) {
    const gx0 = Math.floor((x - rr - D.x0) / R), gx1 = Math.floor((x + rr - D.x0) / R);
    const gz0 = Math.floor((z - rr - D.z0) / R), gz1 = Math.floor((z + rr - D.z0) / R);
    for (let gz = gz0; gz <= gz1; gz++) {
      if (gz < 0 || gz >= D.H) continue;
      for (let gx = gx0; gx <= gx1; gx++) {
        if (gx < 0 || gx >= D.W) continue;
        const k = gz * D.W + gx;
        if (!cellBlocked(k, lv, false)) continue;
        const ax = D.x0 + gx * R, az = D.z0 + gz * R;
        const cx = x < ax ? ax : x > ax + R ? ax + R : x, cz = z < az ? az : z > az + R ? az + R : z;
        const dx = x - cx, dz = z - cz, d2 = dx * dx + dz * dz;
        if (d2 >= rr * rr) continue;
        if (d2 > 1e-8) { const d = Math.sqrt(d2), q = (rr - d) / d; x += dx * q; z += dz * q; }
        else { const ex = x - (ax + R / 2), ez = z - (az + R / 2); if (Math.abs(ex) > Math.abs(ez)) x = ex > 0 ? ax + R + rr : ax - rr; else z = ez > 0 ? az + R + rr : az - rr; }
      }
    }
  }
  return [x, z];
}

export function levelStep(e) {
  const t = stairT(e.x, e.z);
  if (t >= 0) {
    if (!e.lv && t > 0.55) e.lv = 1;
    else if (e.lv && t < 0.45) e.lv = 0;
    return;
  }
  if (e.lv) {
    const k = hcell(e.x, e.z);
    if (k < 0 || hb1[k] === 255) e.lv = 0;
  }
}

export function lvOk(x, z, lv) {
  if (!lv) return true;
  if (stairT(x, z) >= 0.35) return true;
  const k = hcell(x, z);
  return k >= 0 && hb1[k] !== 255 && !(fb1[k] & 1);
}

export function rayHouse(x0, z0, y0, x1, z1, y1) {
  const minx = Math.min(x0, x1), maxx = Math.max(x0, x1), minz = Math.min(z0, z1), maxz = Math.max(z0, z1);
  if (maxx < HOUSE.x0 || minx > HOUSE.x1 || maxz < HOUSE.z0 || minz > HOUSE.z1) return false;
  const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(2, Math.ceil(L / (D.R * 0.7)));
  for (let i = 1; i < n; i++) {
    const t = i / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t, y = y0 + (y1 - y0) * t;
    const k = hcell(x, z);
    if (k < 0) continue;
    const up = hb1[k] !== 255, st = stairT(x, z) >= 0;
    if (up && !st && y > D.f1 - 0.3 && y < D.f1 + 0.05) return true;
    if (!up && y > D.f1 + 0.05) continue;
    if (cellBlocked(k, up && y > D.f1 ? 1 : 0, true)) return true;
  }
  return false;
}

export function navCellFree(x, z, lv, half) {
  for (let dz = -half + D.R / 2; dz < half; dz += D.R) for (let dx = -half + D.R / 2; dx < half; dx += D.R) {
    const k = hcell(x + dx, z + dz);
    if (k < 0) { if (lv) return false; continue; }
    if (cellBlocked(k, lv, false)) return false;
  }
  return true;
}

export function houseRects() {
  const W = D.W, H = D.H, R = D.R, used = new Uint8Array(N), out = [];
  const on = (k) => hb1[k] !== 255 || (fb0[k] & 1 && hb0[k] !== 255);
  for (let gz = 0; gz < H; gz += 2) for (let gx = 0; gx < W; gx += 2) {
    const k = gz * W + gx;
    if (used[k] || !on(k)) continue;
    let w = 2;
    while (gx + w < W && !used[gz * W + gx + w] && on(gz * W + gx + w)) w += 2;
    let h = 2;
    for (;;) {
      if (gz + h >= H) break;
      let ok = true;
      for (let i = 0; i < w && ok; i += 2) { const q = (gz + h) * W + gx + i; if (used[q] || !on(q)) ok = false; }
      if (!ok) break;
      h += 2;
    }
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (gz + j < H && gx + i < W) used[(gz + j) * W + gx + i] = 1;
    if (w * h >= 8) out.push([D.x0 + gx * R, D.z0 + gz * R, D.x0 + (gx + w) * R, D.z0 + (gz + h) * R]);
  }
  return out;
}
