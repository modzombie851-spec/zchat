import { loadStatic, loadTexArrays } from './zmodel.js';
import { PLACE, floorH, groundH, forestList, OAKS, hsh } from './ztown.js';
import { groundParts, pondBed } from './zground.js';

export const TOWN_BASE = '/dead/town';
const VEG = ['pineA', 'pineB', 'treeB', 'treeS', 'bushBig', 'bushMed', 'bushMed2', 'bushSmall', 'mush', 'bushFlower', 'grassA', 'grassB', 'plant'];
const ROCKS = new Set(['rock2', 'rock3', 'rock4', 'rock5', 'rock9']);
const ROCK_COL = [0.62, 0.62, 0.57, 0];
const SMALL = new Set(['barrelB', 'barrelR', 'tyre', 'tires', 'crate', 'crates', 'pallets', 'bins', 'hay', 'corrug', 'barbed', 'rock2', 'rock5', 'rock9', 'grassA', 'grassB', 'plant', 'lamp']);

function poseM(x, y, z, yawDeg, s) {
  const a = yawDeg * Math.PI / 180, c = Math.cos(a), n = Math.sin(a);
  return new Float32Array([c * s, 0, -n * s, 0, 0, s, 0, 0, n * s, 0, c * s, 0, x, y, z, 1]);
}

export function mergeStatic(parts) {
  let nv = 0, ni = 0;
  for (const p of parts) { nv += p.M.nv; ni += p.M.ni; }
  const vb = new Uint8Array(nv * 36), dv = new DataView(vb.buffer);
  const ib = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
  let vo = 0, io = 0;
  for (const p of parts) {
    const src = p.M.verts, sdv = new DataView(src.buffer, src.byteOffset, src.byteLength);
    vb.set(src, vo * 36);
    const c = Math.cos(p.yaw), n = Math.sin(p.yaw), s = p.s;
    for (let i = 0; i < p.M.nv; i++) {
      const o = (vo + i) * 36, so = i * 36;
      const x = sdv.getFloat32(so, true) * s, y = sdv.getFloat32(so + 4, true) * s, z = sdv.getFloat32(so + 8, true) * s;
      dv.setFloat32(o, c * x + n * z + p.x, true); dv.setFloat32(o + 4, y + p.y, true); dv.setFloat32(o + 8, -n * x + c * z + p.z, true);
      const nx = sdv.getInt16(so + 12, true), nz = sdv.getInt16(so + 16, true);
      dv.setInt16(o + 12, Math.round(c * nx + n * nz), true); dv.setInt16(o + 16, Math.round(-n * nx + c * nz), true);
    }
    const idx = p.M.idx;
    for (let k = 0; k < p.M.ni; k++) ib[io + k] = idx[k] + vo;
    vo += p.M.nv; io += p.M.ni;
  }
  return { verts: vb, idx: ib, ni, nv, groups: [{ arr: parts[0].M.groups[0].arr, start: 0, count: ni }] };
}

export async function loadTown(R, T, tierIdx, isDead) {
  const r = await fetch(`${TOWN_BASE}/town.json`);
  if (!r.ok) throw new Error('town');
  const man = await r.json();
  const shrink = tierIdx === 0 ? 2 : tierIdx === 1 ? 1 : 0;
  const ta = await loadTexArrays(TOWN_BASE, man, shrink);
  if (isDead()) return null;
  const arrs = Object.keys(man.arrays).map((k) => R.texArray(ta[k].layers, ta[k].size));
  for (const k of Object.keys(ta)) for (const l of ta[k].layers) if (l && l.close) l.close();
  const need = [...new Set(PLACE.map((p) => p[0]).concat(VEG))].filter((id) => man.models[id]);
  const M = {};
  await Promise.all(need.map(async (id) => { M[id] = await loadStatic(TOWN_BASE, id); }));
  if (isDead()) return null;
  const items = [];
  const meshes = {};
  const meshOf = (id) => meshes[id] || (meshes[id] = R.tstat(M[id]));
  const far = tierIdx === 0 ? 34 : tierIdx === 1 ? 52 : 80;
  for (const [id, x, z, yaw, s = 1] of PLACE) {
    const m = M[id];
    if (!m) continue;
    const y = floorH(x, z) - (ROCKS.has(id) ? 0.12 : 0.02);
    const rad = Math.hypot(m.max[0] - m.min[0], m.max[1] - m.min[1], m.max[2] - m.min[2]) * 0.5 * s;
    items.push({ mesh: meshOf(id), model: poseM(x, y, z, yaw, s), arrs, cast: true, bs: [x, y + (m.max[1] + m.min[1]) * 0.5 * s, z, rad], maxD: SMALL.has(id) ? far : 0, col: ROCKS.has(id) ? ROCK_COL : undefined });
  }
  const chunks = new Map();
  const put = (id, x, z, yaw, s, sink) => {
    const m = M[id];
    if (!m) return;
    const key = `${Math.floor(x / 48)},${Math.floor(z / 48)}`;
    let c = chunks.get(key);
    if (!c) { c = { parts: [], x0: 1e9, z0: 1e9, x1: -1e9, z1: -1e9, top: 0 }; chunks.set(key, c); }
    const y = groundH(x, z) - (sink || 0.05);
    c.parts.push({ M: m, x, y, z, yaw, s });
    c.x0 = Math.min(c.x0, x); c.x1 = Math.max(c.x1, x); c.z0 = Math.min(c.z0, z); c.z1 = Math.max(c.z1, z); c.top = Math.max(c.top, y + m.max[1] * s);
  };
  const { trees, bushes } = forestList(T.trees);
  for (const t of trees) {
    const h = hsh(t.i, 7);
    const id = t.pine ? (h < 0.55 ? 'pineA' : 'pineB') : (h < 0.7 ? 'treeB' : 'treeS');
    const H = id === 'pineA' ? 13.1 : id === 'pineB' ? 13.9 : id === 'treeB' ? 5.4 : 3.4;
    put(id, t.x, t.z, h * Math.PI * 2, (t.s * (t.pine ? 1 : 0.62)) / H, 0.1);
  }
  for (const [x, z, s] of OAKS) put('treeB', x, z, hsh(x | 0, z | 0) * 6.28, (s * 0.9) / 5.4, 0.1);
  for (const b of bushes) {
    const h = hsh(b.i, 3);
    const id = h < 0.22 ? 'bushMed' : h < 0.44 ? 'bushMed2' : h < 0.6 ? 'bushBig' : h < 0.75 ? 'mush' : h < 0.9 ? 'bushSmall' : 'bushFlower';
    put(id, b.x, b.z, h * 40, 0.6 + b.s * 0.45, 0.06);
  }
  for (const c of chunks.values()) {
    const mesh = R.tstat(mergeStatic(c.parts));
    const cx = (c.x0 + c.x1) / 2, cz = (c.z0 + c.z1) / 2;
    items.push({ mesh, model: null, arrs, cast: true, bs: [cx, c.top / 2, cz, Math.hypot(c.x1 - c.x0, c.z1 - c.z0) / 2 + 12], veg: true });
  }
  let ground = false;
  if (man.ground && man.ground.grass) {
    for (const p of groundParts(man.ground, man.groundArr)) items.push({ mesh: R.tstat(p), model: null, arrs, cast: false, bs: p.bs });
    const bed = pondBed(man.ground, man.groundArr);
    items.push({ mesh: R.tstat(bed), model: null, arrs, cast: false, bs: bed.bs });
    ground = true;
  }
  return { items, arrs, ground };
}
