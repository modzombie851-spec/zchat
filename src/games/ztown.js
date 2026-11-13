import { PLACE, SOLID_R, SOLID_C } from './ztowndata.js';
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

export const TOWN = { roadW: 4, sideX: 46, sideW: 3.5, lot: [-15, -45, 20, -4.6], store: [-7.2, -40, 7.9, -31], canopy: [-6.5, -31.4, 0.8, -22.6] };
export const BOUNDS = [-92, -100, 108, 70];
export const POND = { x: -42.2, z: -24, rx: 7.4, rz: 8.6, y: -0.2 };
export const FALL = { x: -49.15, z: -24, top: 2.35, w: 1.4 };
export const pondR = (a) => 1 + 0.06 * Math.sin(3 * a + 1.1) + 0.035 * Math.sin(5 * a + 2.3) + 0.02 * Math.sin(9 * a);
export function pondE(x, z) {
  const dx = (x - POND.x) / POND.rx, dz = (z - POND.z) / POND.rz;
  if (Math.abs(dx) > 3 || Math.abs(dz) > 3) return 9;
  return Math.hypot(dx, dz) / pondR(Math.atan2(dz, dx));
}
export function pondDepth(x, z) { const e = pondE(x, z); return e >= 1.1 ? 0 : -1.3 * (1 - ss(0.3, 1.1, e)); }
export { PLACE };
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
export function floorH(x, z) { return z > -4.6 && z < 4.6 ? 0.1 : z < -4.6 && x > -15 && x < 20 && z > -45 ? 0.08 : groundH(x, z) + pondDepth(x, z); }
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
export const OAKS = [[-15, 14, 10], [-43, 27.5, 12], [36, 20, 9], [12, 40, 11], [-12, 52, 10], [74, 6, 9], [-36, -54, 11], [36, -60, 10], [52, -8, 7], [80, -36, 9]];
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
    if (pondE(x, z) < 1.55 || inRect(x, z, [-55, -32, -46, -16], 0)) continue;
    trees.push({ x, z, s, far, pine, i });
  }
  for (let i = 0; i < 160; i++) {
    const x = (R() - 0.5) * 220, z = -6 + R() * 110 * (R() > 0.5 ? 1 : -0.6);
    if (roadDist(x, z) < 2.5 || inRect(x, z, TOWN.lot, 3) || nearHouse(x, z, 2)) continue;
    const s = 0.7 + R() * 1.1;
    if (pondE(x, z) < 1.3) continue;
    bushes.push({ x, z, s, i });
  }
  return { trees, bushes };
}
export const BARN = { x: 4, z: 25, hw: 7, hd: 5 };
export const BALES = [[-5, 15.6, 0.2], [-3.4, 16.4, 1.4], [13.4, 15.2, 0.6], [14.8, 16.6, 2.2], [-11, 27, 0.9], [17.6, 29, 0.3], [19.6, 21.6, 1.8], [-14, 19, 2.6]];
export const TENTS = [[-25, 17, 0.35], [-30, 21.5, -0.5], [-26.5, 26, 1.25], [50, 15, 0.2], [55, 19, -0.7]];
export const CRATES = [[-46, -12, 0.2, 1], [-44.4, -13.6, 0.9, 2], [-30, -20, 0.5, 1], [40, -30, 0.3, 2], [52, 21, 0.6, 1], [53.6, 22.8, 0.1, 1], [-48, 14, 1.1, 2], [24, -52, 0.4, 1], [-22, -46, 0.8, 2], [30, -40, 1.6, 1], [62, 8, 0.3, 2], [-8, -54, 0.5, 1]];
export const FENCES = [[-56, -24, 9.5], [-20, 8, 9.5], [12, 40, 9.5]];
export const BARRIERS = [[-92.35, -5.6, -92.35, 5.6], [108.35, -5.6, 108.35, 5.6], [40.5, -100.35, 51.5, -100.35]];
export const GATES = [[-93, -6, -91, 6], [107, -6, 109, 6], [40.6, -101, 51.4, -99]];

let solidCache = null;
const POLES = [[-21.52, -0.58, 0.32], [-8, -0.57, 0.24], [-5.61, -0.57, 0.24], [6.02, -0.51, 0.32], [9.01, -0.57, 0.42], [21.58, -0.58, 0.32]];
const EXTRA_R = [[60.7, -55.2, 68, -47.4]];
const BOX = { tent: [2.64, 4.1], crates: [1.82, 0.54], crate: [0.42, 0.4], pallets: [1.17, 1.08], houseB: [5.4, 4.88], shed: [3.13, 2.33], hay: [0.78, 1.06], burnt: [2.35, 1.21], tires: [0.5, 1], truck: [1.26, 2.71], container: [2.89, 1.51], hatch: [2.04, 0.83], sedan: [1.4, 2.33], policeA: [1.54, 2.68], policeB: [1.43, 2.57], bus: [1.99, 4.96] };
export const PROPS2 = [
  ['tent', -76, 36, 0], ['tent', -66.5, 41.5, 90], ['crates', -70.5, 33.2, 0], ['crate', -74.8, 43.6, 25], ['barrelR', -63.6, 38.4, 0], ['barrelB', -62.8, 37.6, 0], ['pallets', -79.6, 43.4, 90],
  ['houseB', 90, 50, 180], ['shed', 77.6, 58, 90], ['hay', 84, 36, 10], ['hay', 86.4, 37.2, 80], ['barrelR', 96.8, 44, 0],
  ['burnt', 94, 1.8, 75], ['tires', 100.5, -7.2, 20], ['sedan', -80, 2.4, 100],
  ['truck', 50.6, -82, 4], ['container', 37.2, -90.2, 0], ['crates', 39.4, -84.5, 90], ['barrelB', 41.2, -88.4, 0],
  ['shed', -80, -42, 0], ['tires', -74.4, -45.2, 70], ['hatch', -70, -66, 0],
  ['bus', 24, 58, 60], ['policeB', 14.6, 54.2, -35],
];
function propSolid(id, x, z, yaw, s, rects, circles) {
  if (id === 'barrelR' || id === 'barrelB') { circles.push([x, z, 0.34 * s]); return; }
  const b = BOX[id];
  if (!b) return;
  const hx = b[0] * s, hz = b[1] * s;
  const q = ((yaw % 180) + 180) % 180;
  if (q < 12 || q > 168) { rects.push([x - hx, z - hz, x + hx, z + hz]); return; }
  if (Math.abs(q - 90) < 12) { rects.push([x - hz, z - hx, x + hz, z + hx]); return; }
  const a = yaw * Math.PI / 180, c = Math.cos(a), n = Math.sin(a);
  const long = Math.max(hx, hz), r = Math.min(hx, hz), alongX = hx >= hz;
  const k = Math.max(1, Math.ceil(long / r));
  for (let i = 0; i < k; i++) {
    const t = k === 1 ? 0 : -long + r + (i / (k - 1)) * (2 * long - 2 * r);
    const lx = alongX ? t : 0, lz = alongX ? 0 : t;
    circles.push([x + c * lx + n * lz, z - n * lx + c * lz, r]);
  }
}
const OLD_GATE = (c) => c[2] === 0.29 && ((Math.abs(c[0] + 56) < 0.01 && Math.abs(c[1]) < 4.5) || (Math.abs(c[0] - 76) < 0.01 && Math.abs(c[1]) < 4.5) || (Math.abs(c[1] + 72) < 0.01 && c[0] > 41 && c[0] < 51));
const EXTRA_C = [[-45.2, -32.35, 0.6], [-51.6, -25.6, 1.5], [-52.1, -22.6, 1.4], [-50, -24.4, 0.8], [-49.5, -23, 0.55], [-50.8, -21, 0.6], [-50.7, -26.1, 0.6], [-49.9, -25.1, 0.5]];
export function solids() {
  if (solidCache) return solidCache;
  const rects = SOLID_R.map((r) => r.slice()), circles = SOLID_C.filter((c) => !OLD_GATE(c)).map((c) => c.slice());
  for (const [id, x, z, yaw, s = 1] of PROPS2) propSolid(id, x, z, yaw, s, rects, circles);
  for (const [id, px, pz] of PLACE) {
    if (id !== 'polerow') continue;
    for (const [lx, lz, r] of POLES) if (inRect(px + lx, pz + lz, BOUNDS, 1)) circles.push([px + lx, pz + lz, r]);
  }
  rects.push(...EXTRA_R);
  circles.push(...EXTRA_C);
  for (const [x, z, s] of OAKS) if (inRect(x, z, BOUNDS, 2)) circles.push([x, z, 0.5 + s * 0.02]);
  for (const t of forestList(1).trees) if (inRect(t.x, t.z, BOUNDS, 2)) circles.push([t.x, t.z, 0.42 + t.s * 0.012]);
  for (let k = 0; k < 16; k++) {
    const q = (k / 16) * Math.PI * 2, w = pondR(q), c = Math.cos(q), n = Math.sin(q);
    circles.push([POND.x + c * POND.rx * 0.6 * w, POND.z + n * POND.rz * 0.6 * w, 0.33 * w * Math.hypot(POND.rx * c, POND.rz * n)]);
  }
  circles.push([POND.x, POND.z, 3.8], [POND.x, POND.z - POND.rz * 0.33, 3.1], [POND.x, POND.z + POND.rz * 0.33, 3.1]);
  solidCache = { rects, circles };
  return solidCache;
}
export const SPAWNS = [[-50, -66], [-20, -68], [12, -68], [36, -68], [72, -62], [-52, -40], [-52, 26], [-14, 33], [-4, 33], [46, 31], [72, 28], [72, -12], [72, -40], [-46, 7.5], [74, -4], [46, -70]];
export const PSPAWN = [[-4.6, -20.6], [-1.6, -20.4], [1.4, -20.6], [4.4, -20.8], [-3.2, -18.4], [0, -18.2], [3.2, -18.4], [6.4, -19.4]];
