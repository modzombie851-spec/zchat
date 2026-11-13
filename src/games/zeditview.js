import { createRenderer, MeshBuilder, m4, hexRgb } from './race3d.js';
import { pondItems } from './zpond.js';
import { townMeshes, townEnv } from './zmap.js';
import { fetchImg, loadStatic, loadTexArrays } from './zmodel.js';
import { resBlob } from './zres.js';
import { loadTown, partY, partItem, surf } from './ztownview.js';
import { loadRail } from './zrail.js';
import { BOUNDS, PLACE, PROPS2, SPAWNS, PSPAWN } from './ztown.js';
import { TIERS } from './zview.js';

export const MAP_CATS = [['build', 'Buildings'], ['cars', 'Cars'], ['walls', 'Walls'], ['props', 'Props'], ['trees', 'Trees'], ['nature', 'Plants and rocks'], ['spawn', 'Spawns']];
export const KIT_BASE = '/dead/kit';
const grp = (cat, list) => list.map(([id, n]) => ({ id, n, cat }));
export const MAP_PARTS = [
  ...grp('build', [['houseA', 'Ruined house'], ['houseB', 'Small house'], ['vhouse', 'Big house'], ['barn', 'Barn'], ['gas', 'Gas station'], ['shed', 'Shed'], ['tent', 'Army tent'], ['container', 'Container'], ['tower', 'Water tower']]),
  ...grp('cars', [['sedan', 'Wrecked car'], ['hatch', 'Small car'], ['truck', 'Pickup'], ['policeA', 'Police car'], ['policeB', 'Crashed police car'], ['bus', 'School bus'], ['burnt', 'Burnt car']]),
  ...grp('walls', [['kSand', 'Sandbags'], ['kJersey', 'Fence barrier'], ['kWall', 'Broken wall'], ['barrier', 'Concrete block'], ['kBar1', 'Road block'], ['kBar2', 'Road block 2'], ['kBar3', 'Wide road block'], ['kBar4', 'Short road block'], ['kSafe', 'Safety barrier'], ['kTraf', 'Traffic barrier'], ['kUbar', 'U barrier'], ['kCrowd', 'Crowd fence'], ['kRail', 'Guard rail'], ['kPostBar', 'Post barrier'], ['corrug', 'Metal fence'], ['barbed', 'Wire fence'], ['polerow', 'Power line']]),
  ...grp('props', [['lamp', 'Street lamp'], ['kLight', 'City light'], ['kBus', 'Bus stop'], ['kDump', 'Dumpster'], ['kTarp', 'Covered crates'], ['crates', 'Crate stack'], ['crate', 'Crate'], ['pallets', 'Pallets'], ['bins', 'Trash bins'], ['kCanCap', 'Trash can'], ['kCanL', 'Big trash can'], ['kCanS', 'Small trash can'], ['kTrashC', 'Street bin'], ['barrelR', 'Red barrel'], ['barrelB', 'Blue barrel'], ['tires', 'Tire stack'], ['tyre', 'Tire'], ['hay', 'Hay bale'], ['kCone', 'Traffic cone'], ['kPost', 'Short post'], ['kHydrant', 'Fire hydrant'], ['kMail', 'Mailbox'], ['kMeter', 'Parking meter'], ['kCross', 'Crossing sign'], ['kAtm', 'Cash machine'], ['kUtil', 'Utility box'], ['kBenchL', 'Long bench'], ['kBenchS', 'Park bench'], ['kCBench', 'Stone bench'], ['kBench', 'Metal bench']]),
  ...grp('trees', [['kOak1', 'Spruce'], ['kOak2', 'Dark spruce'], ['kOak3', 'Tall spruce'], ['kOak4', 'Autumn tree'], ['kTree1', 'Fir'], ['kTree3', 'Young fir'], ['kTree4', 'Thin fir'], ['kTree6', 'Tall pine'], ['kTree7', 'Tall pine 2'], ['kTree8', 'Tall pine 3'], ['kTree2', 'Golden tree'], ['kTree5', 'Golden tree 2'], ['pineA', 'Simple pine'], ['pineB', 'Simple tall pine'], ['treeB', 'Simple tree'], ['treeS', 'Simple small tree']]),
  ...grp('nature', [['kFern3', 'Leafy bush'], ['kFern2', 'Young spruce'], ['kFern4', 'Small spruce'], ['kFern5', 'Wild plant'], ['kFern1', 'Dry grass'], ['kRock2', 'Boulder'], ['kRock7', 'Boulder 2'], ['kRock6', 'Long rock'], ['kRock3', 'Rock'], ['kRock5', 'Rock 2'], ['kRock8', 'Rock 3'], ['kRock4', 'Flat rock'], ['kRock9', 'Small rock'], ['kRock1', 'Stone'], ['bushBig', 'Big bush'], ['bushMed', 'Bush'], ['bushMed2', 'Round bush'], ['bushSmall', 'Small bush'], ['bushFlower', 'Flower bush'], ['mush', 'Wild bush'], ['plant', 'Plant'], ['grassA', 'Grass'], ['grassB', 'Short grass'], ['reeds', 'Reeds'], ['cattail', 'Cattails'], ['rock4', 'Pale big rock'], ['rock3', 'Pale wide rock'], ['rock9', 'Pale tall rock'], ['rock5', 'Pale rock'], ['rock2', 'Pale small rock']]),
  ...grp('spawn', [['@p', 'Player start'], ['@z', 'Zombie spawn'], ['@b', 'Boss spawn']]),
];
export const PART_BY = Object.fromEntries(MAP_PARTS.map((p, i) => [p.id, { ...p, i }]));
export const MARKS = { '@p': { hex: '#6CC25A', k: 1 }, '@z': { hex: '#D9573F', k: 1 }, '@b': { hex: '#A866E0', k: 1.6 } };
export const EDGE = [BOUNDS[0] - 30, BOUNDS[1] - 30, BOUNDS[2] + 30, BOUNDS[3] + 30];
export const BUDGET = { tris: 460000, parts: 260 };

const r2 = (v) => Math.round(v * 100) / 100;
const fin = (v, d = 0) => (Number.isFinite(+v) ? +v : d);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const isMark = (id) => id[0] === '@';
export const mkPart = (id, x, z, yaw = 0, s = 1, dy = 0) => ({ id, x, z, yaw, s, dy });
export function clampPart(p) {
  const B = isMark(p.id) ? BOUNDS : EDGE;
  return { ...p, x: clamp(p.x, B[0], B[2]), z: clamp(p.z, B[1], B[3]), s: clamp(p.s, 0.3, 4), dy: clamp(p.dy, -4, 14), yaw: ((p.yaw % 360) + 360) % 360 };
}

export function pineCreek() {
  const parts = PLACE.concat(PROPS2).map(([id, x, z, yaw, s = 1]) => mkPart(id, x, z, yaw, s));
  for (const [x, z] of PSPAWN) parts.push(mkPart('@p', x, z));
  for (const [x, z] of SPAWNS) parts.push(mkPart('@z', x, z));
  parts.push(mkPart('@b', 46, -66));
  return { name: 'Pine Creek copy', forest: 1, parts };
}
export const emptyMap = (name = 'New map') => ({ name, forest: 1, parts: [] });

export function mapToFile(m) {
  const parts = [], ps = [], zs = [], boss = [];
  for (const p of m.parts) {
    if (p.id === '@p') ps.push([r2(p.x), r2(p.z)]);
    else if (p.id === '@z') zs.push([r2(p.x), r2(p.z)]);
    else if (p.id === '@b') boss.push([r2(p.x), r2(p.z)]);
    else parts.push([p.id, r2(p.x), r2(p.z), Math.round(p.yaw * 10) / 10, r2(p.s), r2(p.dy)]);
  }
  return { zmap: 1, name: m.name, forest: m.forest ? 1 : 0, parts, ps, zs, boss };
}
export function mapFromFile(o) {
  if (!o || typeof o !== 'object' || o.zmap !== 1 || !Array.isArray(o.parts)) return null;
  const parts = [];
  for (const q of o.parts.slice(0, 3000)) {
    if (!Array.isArray(q) || typeof q[0] !== 'string' || !PART_BY[q[0]] || isMark(q[0])) continue;
    parts.push(clampPart(mkPart(q[0], fin(q[1]), fin(q[2]), fin(q[3]), fin(q[4], 1), fin(q[5]))));
  }
  const pts = (a, id) => (Array.isArray(a) ? a.slice(0, 200) : []).forEach((q) => { if (Array.isArray(q)) parts.push(clampPart(mkPart(id, fin(q[0]), fin(q[1])))); });
  pts(o.ps, '@p'); pts(o.zs, '@z'); pts(o.boss, '@b');
  const name = typeof o.name === 'string' && o.name.trim() ? o.name.trim().slice(0, 40) : 'My map';
  return { name, forest: o.forest === 0 ? 0 : 1, parts };
}

export function mapWeight(parts, models) {
  let tris = 0, n = 0;
  for (const p of parts) {
    if (isMark(p.id)) continue;
    n++;
    const m = models && models[p.id];
    tris += m ? (m.tris || m.ni / 3) : 0;
  }
  return { tris, n, k: Math.max(tris / BUDGET.tris, n / BUDGET.parts) };
}

function markMesh(R, hex, k) {
  const b = new MeshBuilder(), c = hexRgb(hex), d = c.map((v) => v * 0.55);
  b.cyl(0, 0.03, 0, 0.78 * k, 0.06, 28, d, 0.92);
  b.cyl(0, 0, 0, 0.06 * k, 2.1 * k, 10, c, 1);
  b.box(0, 2.1 * k, 0, 0.46 * k, 0.46 * k, 0.46 * k, c, 1);
  return R.mesh(b.build());
}
function ringMesh(R) {
  const b = new MeshBuilder(), c = hexRgb('#F2B45A'), N = 56;
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * Math.PI * 2, a1 = ((i + 1) / N) * Math.PI * 2;
    const p = (a, r) => [Math.cos(a) * r, 0, Math.sin(a) * r];
    b.quad(p(a0, 0.93), p(a0, 1), p(a1, 1), p(a1, 0.93), c, 1);
    b.quad(p(a0, 0.93), p(a1, 0.93), p(a1, 1), p(a0, 1), c, 1);
  }
  return R.mesh(b.build());
}
export function camRay(cam, aspect, nx, ny) {
  const inv = m4.inv(m4.mul(m4.persp(cam.fov, aspect, cam.near || 0.3, cam.far || 1600), m4.look(cam.pos, cam.at, [0, 1, 0])));
  const a = m4.apply(inv, nx, ny, -1), b = m4.apply(inv, nx, ny, 1);
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(d[0], d[1], d[2]) || 1;
  return { o: cam.pos.slice(), d: [d[0] / L, d[1] / L, d[2] / L] };
}
const tmat = (x, y, z, s) => new Float32Array([s, 0, 0, 0, 0, s, 0, 0, 0, 0, s, 0, x, y, z, 1]);
const SEL = [1.4, 1.22, 0.86, 0];

export function makeEditView(canvas, tierIdx) {
  const T = TIERS[tierIdx] || TIERS[1];
  const R = createRenderer(canvas, { shadowSize: T.shadow || 256, aa: tierIdx > 0 });
  if (!R) return null;
  const env = townEnv({ mood: 'dusk', shadowRange: 46, fogDen: 0.0042, exposure: 1.3 });
  env.shadows = !!T.shadow;
  env.detail = tierIdx > 0 ? 1 : 0;
  const statics = [];
  for (const p of townMeshes({ grassN: T.grass || 1, grass: T.grass > 0, grassAt: [8, -18, 74], treeKeep: T.trees, chunk: 24, dusk: true, real: true })) statics.push({ mesh: R.mesh(p.data), bs: p.bs, cast: p.cast && !!T.shadow, model: p.model, kind: p.kind });
  for (const it of pondItems(R)) statics.push(it);
  const marks = Object.fromEntries(Object.entries(MARKS).map(([id, o]) => [id, markMesh(R, o.hex, o.k)]));
  const ring = ringMesh(R);
  const E = { R, env, dpr: T.dpr, ready: false, p: 0, err: null, dead: false, M: null, dirty: true };
  const skyFile = tierIdx === 0 || !(R.maxTex && R.maxTex() >= 4096) ? 'dusk2k' : 'dusk3k';
  fetchImg(`/dead/sky/${skyFile}.webp`).then((im) => { if (!E.dead && R.setSky) { R.setSky(im); E.dirty = true; } if (im && im.close) { try { im.close(); } catch {} } }).catch(() => {});
  let kit = null, kit2 = null, townOk = false, kitOk = false;
  const done = () => { if (townOk && kitOk) { E.M = { ...kit.M, ...(kit2 ? kit2.M : {}) }; E.ready = true; E.dirty = true; } };
  (async () => {
    const man = JSON.parse(await (await resBlob(`${KIT_BASE}/kit.json`)).text());
    const ta = await loadTexArrays(KIT_BASE, man, tierIdx === 0 ? 1 : 0);
    if (E.dead) return;
    const arrs = Object.keys(man.arrays).map((k) => R.texArray(ta[k].layers, ta[k].size));
    for (const k of Object.keys(ta)) for (const l of ta[k].layers) if (l && l.close) l.close();
    const M = {};
    await Promise.all(Object.keys(man.models).map(async (id) => { try { M[id] = await loadStatic(KIT_BASE, id); } catch {} }));
    if (E.dead) return;
    const meshes = {};
    kit2 = { arrs, M, meshOf: (id) => meshes[id] || (meshes[id] = R.tstat(M[id])) };
  })().catch(() => {}).finally(() => { kitOk = true; done(); });
  loadTown(R, T, tierIdx, () => E.dead, (f) => { E.p = f; E.dirty = true; }, { place: [], all: true }).then((res) => {
    if (!res || E.dead) return;
    if (res.ground) for (let i = statics.length - 1; i >= 0; i--) if (statics[i].kind === 'ground' || statics[i].kind === 'road' || statics[i].kind === 'marks') { R.drop(statics[i].mesh); statics.splice(i, 1); }
    for (const it of res.items) { if (!T.shadow) it.cast = false; statics.push(it); }
    kit = res;
    townOk = true;
    done();
  }).catch(() => { E.err = 'town'; E.dirty = true; });
  loadRail(R, tierIdx, () => E.dead).then((res) => { if (!res || E.dead) return; for (const it of res.items) { if (!T.shadow) it.cast = false; statics.push(it); } E.dirty = true; }).catch(() => {});

  const cache = new WeakMap();
  const boxOf = (p) => {
    if (isMark(p.id)) { const k = MARKS[p.id].k; return { min: [-0.8 * k, 0, -0.8 * k], max: [0.8 * k, 2.6 * k, 0.8 * k], s: 1 }; }
    const m = E.M && E.M[p.id];
    return m ? { min: m.min, max: m.max, s: p.s } : null;
  };
  const baseY = (p) => {
    if (isMark(p.id)) return surf(p.x, p.z);
    const m = E.M && E.M[p.id];
    return m ? partY(m, p.id, p.x, p.z, p.yaw, p.s) + p.dy : 0;
  };
  const itemOf = (p) => {
    let c = cache.get(p);
    if (c) return c;
    const y = baseY(p);
    if (isMark(p.id)) {
      const k = MARKS[p.id].k;
      c = { y, it: { mesh: marks[p.id], model: tmat(p.x, y, p.z, 1), cast: false, bs: [p.x, y + 1.2 * k, p.z, 2 * k] } };
    } else {
      const m = E.M && E.M[p.id];
      const src = kit2 && kit2.M[p.id] ? kit2 : kit;
      if (!m || !src) return null;
      const it = partItem(m, src.meshOf(p.id), src.arrs, p.id, p.x, y, p.z, p.yaw, p.s, 0);
      if (!T.shadow) it.cast = false;
      c = { y, it, sel: { ...it, col: SEL } };
    }
    cache.set(p, c);
    return c;
  };
  E.baseY = baseY;
  E.draw = (cam, parts, selIdx, forest) => {
    const items = [];
    for (const it of statics) if (forest || !it.veg) items.push(it);
    for (let i = 0; i < parts.length; i++) {
      const c = itemOf(parts[i]);
      if (c) items.push(i === selIdx && c.sel ? c.sel : c.it);
    }
    const sp = selIdx >= 0 ? parts[selIdx] : null;
    if (sp) {
      const b = boxOf(sp);
      if (b) {
        const r = Math.max(Math.max(-b.min[0], b.max[0]), Math.max(-b.min[2], b.max[2])) * b.s + 0.35;
        const gy = isMark(sp.id) ? surf(sp.x, sp.z) : Math.max(surf(sp.x, sp.z), baseY(sp) - sp.dy);
        items.push({ mesh: ring, model: tmat(sp.x, gy + 0.07, sp.z, r), cast: false, bs: [sp.x, gy, sp.z, r + 1] });
      }
    }
    R.render({ env, cam, items, parts: [] });
    E.dirty = false;
  };
  E.ground = (ray) => {
    if (!ray) return null;
    const { o, d } = ray;
    const h = (t) => o[1] + d[1] * t - surf(o[0] + d[0] * t, o[2] + d[2] * t);
    if (h(0) <= 0) return null;
    let t = 0, st = 0.6;
    for (let k = 0; k < 700 && t < 1400; k++) {
      const t1 = t + st;
      if (h(t1) <= 0) {
        let a = t, b = t1;
        for (let j = 0; j < 14; j++) { const mid = (a + b) / 2; if (h(mid) > 0) a = mid; else b = mid; }
        return [o[0] + d[0] * b, o[1] + d[1] * b, o[2] + d[2] * b, b];
      }
      t = t1;
      st = Math.min(6, st * 1.03);
    }
    return null;
  };
  E.pick = (ray, parts) => {
    if (!ray) return { i: -1, t: 1e9 };
    const { o, d } = ray;
    let best = -1, bt = 1e9;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i], b = boxOf(p);
      if (!b) continue;
      const y = baseY(p), yaw = isMark(p.id) ? 0 : (p.yaw * Math.PI) / 180, c = Math.cos(yaw), n = Math.sin(yaw), s = b.s;
      const ox = o[0] - p.x, oy = o[1] - y, oz = o[2] - p.z;
      const lo = [(c * ox - n * oz) / s, oy / s, (n * ox + c * oz) / s], ld = [(c * d[0] - n * d[2]) / s, d[1] / s, (n * d[0] + c * d[2]) / s];
      let t0 = 0, t1 = 1e9, ok = true;
      for (let a = 0; a < 3 && ok; a++) {
        if (Math.abs(ld[a]) < 1e-9) { if (lo[a] < b.min[a] || lo[a] > b.max[a]) ok = false; continue; }
        let ta = (b.min[a] - lo[a]) / ld[a], tb = (b.max[a] - lo[a]) / ld[a];
        if (ta > tb) { const q = ta; ta = tb; tb = q; }
        t0 = Math.max(t0, ta); t1 = Math.min(t1, tb);
        if (t0 > t1) ok = false;
      }
      if (ok && t0 < bt) { bt = t0; best = i; }
    }
    return { i: best, t: bt };
  };
  E.dispose = () => { E.dead = true; try { R.dispose(); } catch {} };
  return E;
}
