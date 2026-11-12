const H32 = (n) => { let x = (n | 0) * 374761393; x = (x ^ (x >>> 13)) * 1274126177; return ((x ^ (x >>> 16)) >>> 0) / 4294967296; };
export const hsh = (a, b, c = 0) => H32(a * 73856093 ^ b * 19349663 ^ c * 83492791);
export const sat = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
export const ss = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const fade = (t) => t * t * (3 - 2 * t);
export function vn(x, z, s = 0) {
  const xi = Math.floor(x), zi = Math.floor(z), u = fade(x - xi), v = fade(z - zi);
  const a = hsh(xi, zi, s), b = hsh(xi + 1, zi, s), c = hsh(xi, zi + 1, s), d = hsh(xi + 1, zi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x, z, s = 0, o = 3) { let t = 0, a = 0.5, f = 1, n = 0; for (let i = 0; i < o; i++) { t += a * vn(x * f, z * f, s + i * 31); n += a; a *= 0.5; f *= 2.07; } return t / n; }
export function rng(seed) { let a = (seed >>> 0) || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export const TOWN = { roadW: 4, sideX: 46, sideW: 3.5, lot: [-26, -48, 30, -4.6], store: [-15, -46, 15, -34], canopy: [-12, -24, 12, -10] };
export const BOUNDS = [-56, -72, 76, 34];
export const HOUSES = [
  { x: 64, z: -22, yaw: -Math.PI / 2, col: '#A9BCC8', roof: '#4A4642', trim: '#F2EFE6', seed: 1 },
  { x: 65, z: -50, yaw: -Math.PI / 2, col: '#D8C9A6', roof: '#5A3E32', trim: '#F4F0E4', seed: 2, boarded: true },
  { x: 63, z: -78, yaw: -Math.PI / 2, col: '#B9C6A2', roof: '#3E4448', trim: '#EEEDE6', seed: 3, garage: true },
  { x: 28, z: 30, yaw: Math.PI, col: '#C9B8A4', roof: '#4E3A30', trim: '#F2EEE6', seed: 4, far: true },
  { x: -34, z: 24, yaw: Math.PI, col: '#C4A9A0', roof: '#3A3E44', trim: '#F0ECE4', seed: 5 },
  { x: -40, z: -30, yaw: Math.PI / 2, col: '#A6B4C2', roof: '#4E3E36', trim: '#F2EEE8', seed: 6, boarded: true },
];
export const CARS = [
  ['sedan', { paint: '#3A3A3A', burnt: true, broken: true, seed: 4 }, -14, 1.2, 0.35],
  ['pickup', { paint: '#B5452E', rust: 0.18, cargo: true, seed: 2 }, 8.5, -17, Math.PI / 2 + 0.06],
  ['sedan', { paint: '#6A8CA8', rust: 0.1, seed: 1, doorOpen: true }, -4.5, -31.2, 0.02],
  ['van', { paint: '#D8D2C2', dirt: 0.6, seed: 3, stripe: '#3E7FC0' }, 36, -3, -0.35],
  ['sedan', { paint: '#E8E4D8', seed: 6, lightbar: true, broken: true }, 30, 1.6, 2.4],
  ['sedan', { paint: '#7A9A5A', rust: 0.25, seed: 7, flat: true }, 58, -34, 0.0],
  ['van', { paint: '#8A3A2A', rust: 0.3, burnt: true, seed: 9 }, -52, -1.5, 1.45],
  ['pickup', { paint: '#3E5A7A', rust: 0.22, seed: 11 }, 72, 1.8, -1.62],
  ['sedan', { paint: '#C9A24A', rust: 0.3, broken: true, seed: 12 }, 46.5, -66, 0.12],
  ['sedan', { paint: '#5A5E66', rust: 0.15, seed: 13, flat: true }, -24, -60, 2.1],
];
export function inRect(x, z, r, pad = 0) { return x > r[0] - pad && x < r[2] + pad && z > r[1] - pad && z < r[3] + pad; }
export function roadDist(x, z) { const a = Math.abs(z) - TOWN.roadW; const b = z < -2 ? Math.abs(x - TOWN.sideX) - TOWN.sideW : 1e9; return Math.min(a, b); }
export function nearHouse(x, z, pad) { for (const h of HOUSES) if (Math.abs(x - h.x) < 9 + pad && Math.abs(z - h.z) < 9 + pad) return true; return false; }
export function groundH(x, z) {
  const d = Math.hypot(x * 0.85, z * 1.0);
  const u = (fbm(x / 70, z / 70, 3, 3) - 0.5) * 3.2 * ss(70, 170, d);
  const hills = ss(180, 460, d) * (34 + 80 * fbm(x / 260, z / 260, 9, 3));
  return u + hills;
}
export function floorH(x, z) { return z > -4.6 && z < 4.6 ? 0.1 : z < -4.6 && x > -26 && x < 30 && z > -48 ? 0.08 : groundH(x, z); }
export function forestD(x, z) {
  if (roadDist(x, z) < 7 || inRect(x, z, [TOWN.lot[0] - 6, TOWN.lot[1] - 8, TOWN.lot[2] + 4, TOWN.lot[3]], 0) || nearHouse(x, z, 6)) return 0;
  const n = fbm(x / 55, z / 55, 41, 3);
  let f = 0;
  if (z < -58) f = Math.max(f, ss(-58, -80, z));
  if (x < -48) f = Math.max(f, ss(-48, -70, x));
  if (x > 84) f = Math.max(f, ss(84, 104, x));
  if (z > 95) f = Math.max(f, ss(95, 120, z));
  f = Math.max(f, ss(0.62, 0.78, n) * ss(30, 60, Math.abs(z)));
  return f * (0.55 + 0.6 * n);
}
export const OAKS = [[-30, 14, 10], [-46, 26, 12], [36, 20, 9], [12, 40, 11], [-12, 52, 10], [74, 6, 9], [-36, -54, 11], [36, -60, 10], [52, -8, 7], [80, -36, 9]];
export function forestList(keep = 1) {
  const R = rng(1234);
  const trees = [], bushes = [];
  let n = 0;
  for (let i = 0; i < 26000 && n < 2600; i++) {
    const a = R() * Math.PI * 2, d = 20 + Math.pow(R(), 0.7) * 560;
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    const f = forestD(x, z) + ss(330, 520, d) * 0.6;
    if (R() > f * 1.25) continue;
    const s = 9 + R() * 9 + ss(200, 500, d) * 4;
    const far = d > 230;
    const pine = R() < (far ? 0.85 : 0.72);
    n++;
    const inside = inRect(x, z, BOUNDS, 6);
    if (!inside && hsh(i, 99) > (far ? keep * keep : keep)) continue;
    trees.push({ x, z, s, far, pine, i });
  }
  for (let i = 0; i < 160; i++) {
    const x = (R() - 0.5) * 220, z = -6 + R() * 110 * (R() > 0.5 ? 1 : -0.6);
    if (roadDist(x, z) < 2.5 || inRect(x, z, TOWN.lot, 3) || nearHouse(x, z, 2)) continue;
    bushes.push({ x, z, s: 0.7 + R() * 1.1, i });
  }
  return { trees, bushes };
}
export const BARN = { x: 4, z: 25, hw: 7, hd: 5 };
export const BALES = [[-5, 15.6, 0.2], [-3.4, 16.4, 1.4], [13.4, 15.2, 0.6], [14.8, 16.6, 2.2], [-11, 27, 0.9], [17.6, 29, 0.3], [19.6, 21.6, 1.8], [-14, 19, 2.6]];
export const TENTS = [[-25, 17, 0.35], [-30, 21.5, -0.5], [-26.5, 26, 1.25], [50, 15, 0.2], [55, 19, -0.7]];
export const CRATES = [[-46, -12, 0.2, 1], [-44.4, -13.6, 0.9, 2], [-30, -20, 0.5, 1], [40, -30, 0.3, 2], [52, 21, 0.6, 1], [53.6, 22.8, 0.1, 1], [-48, 14, 1.1, 2], [24, -52, 0.4, 1], [-22, -46, 0.8, 2], [30, -40, 1.6, 1], [62, 8, 0.3, 2], [-8, -54, 0.5, 1]];
export const FENCES = [[-56, -24, 9.5], [-20, 8, 9.5], [12, 40, 9.5]];
export const BARRIERS = [[-56, -6, -56, 6], [76, -6, 76, 6], [42, -72, 50, -72]];

let solidCache = null;
export function solids() {
  if (solidCache) return solidCache;
  const rects = [], circles = [];
  rects.push(TOWN.store);
  for (const iz of [-14, -20]) { circles.push([0, iz, 0.5]); for (const px of [-4, 4]) circles.push([px, iz, 0.55]); }
  for (const h of HOUSES) {
    const c = Math.cos(h.yaw), sn = Math.sin(h.yaw);
    const W = (lx, lz) => [h.x + lx * c + lz * sn, h.z - lx * sn + lz * c];
    const box = (ax, az, bx, bz) => { const p = W(ax, az), q = W(bx, bz); rects.push([Math.min(p[0], q[0]), Math.min(p[1], q[1]), Math.max(p[0], q[0]), Math.max(p[1], q[1])]); };
    box(-5.2, -4.4, 5.2, 6.2);
    box(-9, 10.4, -1.2, 10.6);
    box(1.2, 10.4, 9, 10.6);
  }
  for (const [k, , x, z, yaw] of CARS) {
    const L = k === 'van' ? 1.45 : 1.25, r = k === 'van' ? 1.12 : 1.0;
    const fx = Math.sin(yaw), fz = Math.cos(yaw);
    circles.push([x + fx * L, z + fz * L, r], [x - fx * L, z - fz * L, r], [x, z, r]);
  }
  rects.push([-9, -28.1, -3, -27.1], [3, -28.1, 9, -27.1], [-10.7, -31.4, -9.7, -28.2], [9.9, -31.4, 10.9, -28.2]);
  for (const [x, z] of [[-13, -26], [13.6, -27], [-18, -40]]) circles.push([x, z, 0.45]);
  for (const [x, z] of [[16.5, -30], [17.4, -31], [-19, -9]]) circles.push([x, z, 0.5]);
  rects.push([-31.6, 0.2, -28.4, 1.0], [32.4, -1.6, 35.6, -0.8], [23.6, -8.3, 26.4, -7.7], [18.6, -43.2, 21.4, -40.8]);
  for (const [x0, x1, z] of FENCES) rects.push([x0, z - 0.2, x1, z + 0.2]);
  rects.push([BARN.x - BARN.hw, BARN.z - BARN.hd, BARN.x + BARN.hw, BARN.z + BARN.hd]);
  for (const [x, z] of BALES) circles.push([x, z, 0.85]);
  for (const [x, z] of TENTS) circles.push([x, z, 1.5]);
  for (const [x, z, , n] of CRATES) circles.push([x, z, n > 1 ? 1.15 : 0.8]);
  for (const [x, z, s] of OAKS) if (inRect(x, z, BOUNDS, 2)) circles.push([x, z, Math.max(0.55, s * 0.055)]);
  for (const t of forestList(1).trees) if (inRect(t.x, t.z, BOUNDS, 2)) circles.push([t.x, t.z, 0.42 + t.s * 0.012]);
  solidCache = { rects, circles };
  return solidCache;
}
export const SPAWNS = [[-50, -66], [-20, -68], [12, -68], [36, -68], [70, -66], [-52, -40], [-52, 24], [-20, 30], [6, 30], [44, 30], [72, 28], [72, -12], [72, -40], [-50, 0], [74, -4], [46, -70]];
export const PSPAWN = [[-2.6, -25.5], [2.6, -25.5], [-6.2, -23.6], [6.2, -23.6], [-9.6, -25.2], [9.6, -25.2], [-1.5, -29.5], [3.5, -29.5]];
