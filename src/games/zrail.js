import { hitAdd } from './zhit.js';
import { loadStatic, loadTexArrays } from './zmodel.js';
import { resBlob } from './zres.js';
import { mergeStatic } from './ztownview.js';
import { RAIL } from './ztown.js';

export const RAIL_BASE = '/dead/rail';
const SEG = 48, SEGS = 13, LIFT = 0.03, RAIL_TOP = 0.28;
const PERIOD = 150, SPEED = 15, X0 = -620, X1 = 620, WAGONS = 6, GAP = 0.9;

export function trainAt(ms, n = WAGONS) {
  const t = ms / 1000, cyc = Math.floor(t / PERIOD), ph = t - cyc * PERIOD;
  const len = 15.33 + n * (8.55 + GAP) + 10;
  const run = (X1 - X0 + len) / SPEED;
  if (ph > run) return null;
  const dir = cyc % 2 ? -1 : 1;
  const head = dir > 0 ? X0 + ph * SPEED : X1 - ph * SPEED;
  return { cyc, dir, head };
}

function railPiece() {
  const STRIDE = 36, quads = [];
  const box = (cz, w, y0, y1, top, side) => {
    const x0 = -SEG / 2, x1 = SEG / 2, z0 = cz - w / 2, z1 = cz + w / 2;
    quads.push([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], [0, 1, 0], top]);
    quads.push([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], side]);
    quads.push([[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], side]);
  };
  for (const cz of [-0.8, 0.8]) {
    box(cz, 0.13, 0.105, 0.2, [92, 84, 76], [70, 62, 56]);
    box(cz, 0.075, 0.2, RAIL_TOP, [176, 172, 166], [96, 90, 84]);
  }
  const nv = quads.length * 4, buf = new Uint8Array(nv * STRIDE), dv = new DataView(buf.buffer);
  const idx = new Uint16Array(quads.length * 6);
  quads.forEach(([a, b, c, d, n, col], q) => {
    [a, b, c, d].forEach((p, k) => {
      const o = (q * 4 + k) * STRIDE;
      dv.setFloat32(o, p[0], true); dv.setFloat32(o + 4, p[1], true); dv.setFloat32(o + 8, p[2], true);
      dv.setInt16(o + 12, n[0] * 32767, true); dv.setInt16(o + 14, n[1] * 32767, true); dv.setInt16(o + 16, n[2] * 32767, true); dv.setInt16(o + 18, 4 * 4096, true);
      dv.setFloat32(o + 20, k === 1 || k === 2 ? 1 : 0, true); dv.setFloat32(o + 24, k >= 2 ? 1 : 0, true);
      dv.setUint8(o + 28, col[0]); dv.setUint8(o + 29, col[1]); dv.setUint8(o + 30, col[2]); dv.setUint8(o + 31, 255);
      dv.setUint16(o + 32, 0, true);
    });
    idx.set([q * 4, q * 4 + 2, q * 4 + 1, q * 4, q * 4 + 3, q * 4 + 2], q * 6);
  });
  return { verts: buf, idx, nv, ni: idx.length, groups: [{ arr: 0, start: 0, count: idx.length }], min: [-SEG / 2, 0, -1], max: [SEG / 2, RAIL_TOP, 1] };
}

function mat(x, y, z, yawDeg, out) {
  const a = yawDeg * Math.PI / 180, c = Math.cos(a), n = Math.sin(a);
  const m = out || new Float32Array(16);
  m[0] = c; m[1] = 0; m[2] = -n; m[3] = 0; m[4] = 0; m[5] = 1; m[6] = 0; m[7] = 0; m[8] = n; m[9] = 0; m[10] = c; m[11] = 0; m[12] = x; m[13] = y; m[14] = z; m[15] = 1;
  return m;
}

export async function loadRail(R, tierIdx, isDead, lite) {
  const man = JSON.parse(await (await resBlob(`${RAIL_BASE}/rail.json`)).text());
  const shrink = (tierIdx === 0 ? 2 : tierIdx === 1 ? 1 : 0) + (lite ? 1 : 0);
  const ta = await loadTexArrays(RAIL_BASE, man, shrink);
  if (isDead()) return null;
  const arrs = Object.keys(man.arrays).map((k) => R.texArray(ta[k].layers, ta[k].size));
  for (const k of Object.keys(ta)) for (const l of ta[k].layers) if (l && l.close) l.close();
  const M = {};
  await Promise.all(['stn', 'trk', 'loco', 'wagon'].map(async (id) => { M[id] = await loadStatic(RAIL_BASE, id); }));
  if (isDead()) return null;
  const items = [];
  const cast = tierIdx === 2;
  items.push({ mesh: R.tstat(M.stn), model: mat(RAIL.sx, 0, RAIL.sz, 0), arrs, cast, bs: [RAIL.sx, 3, RAIL.sz - 4.4, 26] });
  hitAdd(M.stn, RAIL.sx, 0, RAIL.sz, 0, 1);
  const rails = railPiece();
  const far = tierIdx === 0 ? 170 : 260;
  for (let c = -SEGS; c < SEGS; c += 4) {
    const parts = [];
    for (let k = c; k < Math.min(SEGS, c + 4); k++) {
      const x = (k + 0.5) * SEG;
      parts.push({ M: M.trk, x, y: LIFT, z: RAIL.z, yaw: 0, s: 1 });
      parts.push({ M: rails, x, y: LIFT, z: RAIL.z, yaw: 0, s: 1 });
    }
    const x0 = c * SEG, x1 = Math.min(SEGS, c + 4) * SEG;
    items.push({ mesh: R.tstat(mergeStatic(parts)), model: null, arrs, cast: false, bs: [(x0 + x1) / 2, 0.2, RAIL.z, (x1 - x0) / 2 + 4], maxD: far });
  }
  const n = tierIdx === 0 ? 3 : WAGONS;
  const cars = [{ m: M.loco, half: 7.665, it: null }];
  for (let i = 0; i < n; i++) cars.push({ m: M.wagon, half: 4.275, it: null });
  const meshes = { loco: R.tstat(M.loco), wagon: R.tstat(M.wagon) };
  for (const cdef of cars) {
    cdef.it = { mesh: cdef.m === M.loco ? meshes.loco : meshes.wagon, model: mat(0, -999, 0, 0), arrs, cast, bs: [0, -9999, 0, 1], train: true };
    items.push(cdef.it);
  }
  const st = { on: false, x: 0, z: RAIL.z, dir: 1, cyc: -1, front: [0, 0, 0], lpos: [0, 2.2, RAIL.z] };
  const tick = (ms) => {
    const tr = trainAt(ms, n);
    if (!tr) {
      if (st.on) { st.on = false; for (const cdef of cars) { cdef.it.bs[1] = -9999; } }
      return st;
    }
    st.on = true; st.dir = tr.dir; st.cyc = tr.cyc;
    let off = 0;
    const y = LIFT + RAIL_TOP;
    cars.forEach((cdef, i) => {
      const cx = tr.head - tr.dir * (off + cdef.half);
      off += cdef.half * 2 + GAP;
      mat(cx, y, RAIL.z, tr.dir > 0 ? 90 : -90, cdef.it.model);
      const b = cdef.it.bs; b[0] = cx; b[1] = y + 2.4; b[2] = RAIL.z; b[3] = cdef.half + 2;
      if (i === 0) { st.x = cx; st.lpos[0] = cx; }
    });
    st.front[0] = tr.head; st.front[1] = y + 2.2; st.front[2] = RAIL.z;
    return st;
  };
  return { items, tick, st };
}
