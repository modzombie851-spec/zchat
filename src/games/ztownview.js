import { hitAdd, hitReset } from './zhit.js';
import { loadStatic, loadTexArrays } from './zmodel.js';
import { resBlob } from './zres.js';
import { PLAY, PLAY_FOREST, BOUNDS, GATES, RAIL, floorH, groundH, forestList, OAKS, hsh, pondE, inRect, TOWN } from './ztown.js';
import { groundParts, pondBed, meshH } from './zground.js';

export const TOWN_BASE = '/dead/town';
const KIT_BASE = '/dead/kit';
const EDGE_IN = [BOUNDS[0] - 30, BOUNDS[1] - 30, BOUNDS[2] + 30, BOUNDS[3] + 30];
const KVEG = new Set(['kFern1', 'kFern2', 'kFern3', 'kFern4', 'kFern5', 'kOak1', 'kOak2', 'kOak3', 'kOak4', 'kTree1', 'kTree2', 'kTree3', 'kTree4', 'kTree5', 'kTree6', 'kTree7', 'kTree8']);
const VEG = ['pineA', 'pineB', 'treeB', 'treeS', 'bushBig', 'bushMed', 'bushMed2', 'bushSmall', 'mush', 'bushFlower', 'grassA', 'grassB', 'plant'];
const ROCKS = new Set(['rock2', 'rock3', 'rock4', 'rock5', 'rock9']);
const ROCK_COL = [0.62, 0.62, 0.57, 0];
const SMALL = new Set(['barrelB', 'barrelR', 'tyre', 'tires', 'crate', 'crates', 'pallets', 'bins', 'hay', 'corrug', 'barbed', 'rock2', 'rock5', 'rock9', 'grassA', 'grassB', 'plant', 'lamp']);

const onPave = (x, z) => (z > -4.6 && z < 4.6) || inRect(x, z, TOWN.lot, 0);
export const surf = (x, z) => (onPave(x, z) ? floorH(x, z) : pondE(x, z) < 1.6 ? Math.max(meshH(x, z), floorH(x, z)) : meshH(x, z));
export function seat(m, x, z, yawDeg, s) {
  if (onPave(x, z)) return floorH(x, z);
  const a = yawDeg * Math.PI / 180, c = Math.cos(a), n = Math.sin(a);
  const hx = (m.max[0] - m.min[0]) * 0.3 * s, hz = (m.max[2] - m.min[2]) * 0.3 * s, cx = (m.max[0] + m.min[0]) * 0.5 * s, cz = (m.max[2] + m.min[2]) * 0.5 * s;
  let y = 1e9;
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
    const lx = cx + i * hx, lz = cz + j * hz;
    y = Math.min(y, surf(x + c * lx + n * lz, z - n * lx + c * lz));
  }
  return y;
}
function fenceParts(M) {
  const out = [];
  if (!M.corrug) return out;
  const [x0, z0, x1, z1] = BOUNDS, o = 0.12, S = 1.3, W = 2.26 * S * 0.8;
  const gate = (x, z) => GATES.some((g) => x > g[0] && x < g[2] && z > g[1] && z < g[3]) || (z > RAIL.plat[3] - 1 && x > RAIL.plat[0] - 1.2 && x < RAIL.plat[2] + 1.2);
  const side = (ax, az, bx, bz, yaw) => {
    const L = Math.hypot(bx - ax, bz - az), n = Math.ceil(L / W);
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t;
      if (gate(x, z)) continue;
      const h = hsh(Math.round(x * 3), Math.round(z * 3), 7);
      const id = h < 0.14 && M.barbed ? 'barbed' : 'corrug';
      const dx = (bx - ax) / L, dz = (bz - az) / L, e = W * 0.5;
      const y = Math.min(surf(x - dx * e, z - dz * e), surf(x + dx * e, z + dz * e), surf(x, z)) - 0.06;
      const j = (i % 2 ? 0.05 : -0.05) + (hsh(i, Math.round(ax + az), 3) - 0.5) * 0.04;
      out.push({ id, x: x - dz * j, y, z: z + dx * j, yaw: yaw + (h - 0.5) * 0.05, s: S * (id === 'barbed' ? 1.08 : 1) });
    }
  };
  side(x0 - o, z0, x0 - o, z1, 0);
  side(x1 + o, z0, x1 + o, z1, 0);
  side(x0, z0 - o, x1, z0 - o, Math.PI / 2);
  side(x0, z1 + o, x1, z1 + o, Math.PI / 2);
  return out;
}
export function poseM(x, y, z, yawDeg, s) {
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

export const partY = (m, id, x, z, yaw, s) => seat(m, x, z, yaw, s) - (ROCKS.has(id) ? 0.12 : 0.02);
export function partItem(m, mesh, arrs, id, x, y, z, yaw, s, far) {
  const rad = Math.hypot(m.max[0] - m.min[0], m.max[1] - m.min[1], m.max[2] - m.min[2]) * 0.5 * s;
  return { mesh, model: poseM(x, y, z, yaw, s), arrs, cast: true, bs: [x, y + (m.max[1] + m.min[1]) * 0.5 * s, z, rad], maxD: SMALL.has(id) ? far : 0, col: ROCKS.has(id) ? ROCK_COL : undefined };
}

export async function loadTown(R, T, tierIdx, isDead, onP, o = {}) {
  const step = (f) => { if (onP) onP(f); };
  const man = JSON.parse(await (await resBlob(`${TOWN_BASE}/town.json`)).text());
  const shrink = (tierIdx === 0 ? 2 : tierIdx === 1 ? 1 : 0) + (T && T.lite ? 1 : 0);
  step(0.05);
  const ta = await loadTexArrays(TOWN_BASE, man, shrink, (f) => step(0.05 + f * 0.6));
  if (isDead()) return null;
  const arrs = Object.keys(man.arrays).map((k) => R.texArray(ta[k].layers, ta[k].size));
  for (const k of Object.keys(ta)) for (const l of ta[k].layers) if (l && l.close) l.close();
  const place = o.place || PLAY;
  const hideIn = o.hideIn != null ? !!o.hideIn : !o.place && PLAY_FOREST === 2;
  const need = [...new Set((o.all ? Object.keys(man.models) : place.map((p) => p[0])).concat(VEG, ['corrug', 'barbed']))].filter((id) => man.models[id]);
  const M = {};
  let got = 0;
  await Promise.all(need.map(async (id) => { M[id] = await loadStatic(TOWN_BASE, id); got++; step(0.7 + (got / need.length) * 0.25); }));
  if (isDead()) return null;
  const kitIds = o.place ? [] : [...new Set(place.map((p) => p[0]).filter((id) => !man.models[id]))];
  let kit = null;
  if (kitIds.length) {
    try {
      const km = JSON.parse(await (await resBlob(`${KIT_BASE}/kit.json`)).text());
      const kta = await loadTexArrays(KIT_BASE, km, shrink);
      if (isDead()) return null;
      const karrs = Object.keys(km.arrays).map((k) => R.texArray(kta[k].layers, kta[k].size));
      for (const k of Object.keys(kta)) for (const l of kta[k].layers) if (l && l.close) l.close();
      const KM = {};
      await Promise.all(kitIds.filter((id) => km.models[id]).map(async (id) => { KM[id] = await loadStatic(KIT_BASE, id); }));
      kit = { arrs: karrs, M: KM, meshes: {} };
    } catch { kit = null; }
    if (isDead()) return null;
  }
  const items = [];
  const meshes = {};
  const meshOf = (id) => meshes[id] || (meshes[id] = R.tstat(M[id]));
  const far = tierIdx === 0 ? 34 : tierIdx === 1 ? 52 : 80;
  hitReset();
  const ownVeg = [];
  for (const [id, x, z, yaw, s = 1, dy = 0] of place) {
    if (!o.place && VEG.includes(id) && M[id]) { ownVeg.push([id, x, z, yaw, s, dy]); continue; }
    const km = !M[id] && kit ? kit.M[id] : null;
    const m = M[id] || km;
    if (!m) continue;
    const y = partY(m, id, x, z, yaw, s) + dy;
    if (!VEG.includes(id) && !KVEG.has(id)) hitAdd(m, x, y, z, yaw, s);
    items.push(partItem(m, km ? kit.meshes[id] || (kit.meshes[id] = R.tstat(km)) : meshOf(id), km ? kit.arrs : arrs, id, x, y, z, yaw, s, far));
  }
  const chunks = new Map();
  const sp = o.split;
  const put = (id, x, z, yaw, s, sink, own, yAbs) => {
    const m = M[id];
    if (!m) return;
    if (hideIn && !own && x > EDGE_IN[0] && x < EDGE_IN[2] && z > EDGE_IN[1] && z < EDGE_IN[3]) return;
    const vin = !!(sp && x > sp[0] && x < sp[2] && z > sp[1] && z < sp[3]);
    const key = `${Math.floor(x / 48)},${Math.floor(z / 48)}${vin ? ',i' : ''}`;
    let c = chunks.get(key);
    if (!c) { c = { parts: [], x0: 1e9, z0: 1e9, x1: -1e9, z1: -1e9, top: 0, vin }; chunks.set(key, c); }
    let y = yAbs;
    if (y == null) {
      const gh = (qx, qz) => Math.min(groundH(qx, qz), meshH(qx, qz));
      const rr = Math.max(0.5, Math.min(1.2, (m.max[0] - m.min[0]) * s * 0.12));
      let lo = gh(x, z);
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; lo = Math.min(lo, gh(x + Math.cos(a) * rr, z + Math.sin(a) * rr)); }
      y = lo - (sink || 0.05);
    }
    c.parts.push({ M: m, x, y, z, yaw, s });
    c.x0 = Math.min(c.x0, x); c.x1 = Math.max(c.x1, x); c.z0 = Math.min(c.z0, z); c.z1 = Math.max(c.z1, z); c.top = Math.max(c.top, y + m.max[1] * s);
  };
  for (const [id, x, z, yaw, s, dy] of ownVeg) put(id, x, z, (yaw * Math.PI) / 180, s, 0, true, partY(M[id], id, x, z, yaw, s) + dy);
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
  const fence = new Map();
  for (const f of fenceParts(M)) {
    const key = `${Math.floor(f.x / 40)},${Math.floor(f.z / 40)}`;
    let c = fence.get(key);
    if (!c) { c = { parts: [], x0: 1e9, z0: 1e9, x1: -1e9, z1: -1e9 }; fence.set(key, c); }
    c.parts.push({ M: M[f.id], x: f.x, y: f.y, z: f.z, yaw: f.yaw, s: f.s });
    hitAdd(M[f.id], f.x, f.y, f.z, f.yaw * 180 / Math.PI, f.s);
    c.x0 = Math.min(c.x0, f.x); c.x1 = Math.max(c.x1, f.x); c.z0 = Math.min(c.z0, f.z); c.z1 = Math.max(c.z1, f.z);
  }
  const fenceFar = tierIdx === 0 ? 120 : tierIdx === 1 ? 170 : 0;
  for (const c of fence.values()) {
    const cx = (c.x0 + c.x1) / 2, cz = (c.z0 + c.z1) / 2;
    items.push({ mesh: R.tstat(mergeStatic(c.parts)), model: null, arrs, cast: tierIdx === 2, bs: [cx, 1.2, cz, Math.hypot(c.x1 - c.x0, c.z1 - c.z0) / 2 + 3], maxD: fenceFar });
  }
  for (const c of chunks.values()) {
    const mesh = R.tstat(mergeStatic(c.parts));
    const cx = (c.x0 + c.x1) / 2, cz = (c.z0 + c.z1) / 2;
    items.push({ mesh, model: null, arrs, cast: true, bs: [cx, c.top / 2, cz, Math.hypot(c.x1 - c.x0, c.z1 - c.z0) / 2 + 12], veg: true, vin: c.vin });
  }
  let ground = false;
  if (man.ground && man.ground.grass) {
    for (const p of groundParts(man.ground, man.groundArr)) items.push({ mesh: R.tstat(p), model: null, arrs, cast: false, bs: p.bs });
    const bed = pondBed(man.ground, man.groundArr);
    items.push({ mesh: R.tstat(bed), model: null, arrs, cast: false, bs: bed.bs });
    ground = true;
  }
  return { items, arrs, ground, M, meshOf, man, far };
}
