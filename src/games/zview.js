import { createRenderer } from './race3d.js';
import { pondItems } from './zpond.js';
import { townMeshes, townEnv } from './zmap.js';
import { buildBody, buildDog } from './zbody.js';
import { survLook, ZLOOKS, zLookIndex, DOGS, SURV_LOOK } from './zlooks.js';
import { gunMesh, magMesh } from './zguns.js';
import { buildFP, buildThrowFP, buildBatFP, buildThrowObj, makeFPState } from './zfp.js';
import { getFPG, setFPGHalf } from './zfpgl.js';
import { floorH } from './ztown.js';
import { loadZAnims, loadZModel } from './zmodel.js';
import { loadTown } from './ztownview.js';

export const OUTFIT_SWATCH = (sv, i) => { const b = SURV_LOOK[sv] || SURV_LOOK.jay; return b.outfits[i] || b.shirt; };
export const ZMODEL = {
  walker: ['zgirl', 'zwar', 'zyaku', 'zpris', 'zsurv', 'zclown'],
  worker: ['zwar', 'zpris', 'zsurv'],
  runner: ['zskel', 'zyaku', 'zgirl'],
  bloater: ['zpump'],
  brute: ['zmutant'],
  crawler: ['zgirl', 'zpris', 'zwar'],
  screamer: ['zclown'],
  riot: ['zcop'],
  spitter: ['zpara'],
};
const ZORDER = ['zgirl', 'zmutant', 'zwar', 'zcop', 'zskel', 'zpara', 'zclown', 'zpump', 'zyaku', 'zpris', 'zsurv'];
export const TIERS = [
  { name: 'Fast', dpr: 0.7, shadow: 0, grass: 0, trees: 0.25, zmax: 34, pmax: 12, post: false, near: 9, shadowN: 0 },
  { name: 'Balanced', dpr: 0.9, shadow: 1024, grass: 6500, trees: 0.5, zmax: 56, pmax: 20, post: false, near: 14, shadowN: 10 },
  { name: 'Best', dpr: 1.25, shadow: 2048, grass: 15000, trees: 1, zmax: 80, pmax: 40, post: true, near: 20, shadowN: 22 },
];

export function makeView(canvas, tierIdx, ov) {
  const T = { ...(TIERS[tierIdx] || TIERS[1]), ...(ov || {}) };
  const R = createRenderer(canvas, { shadowSize: T.shadow || 256, aa: tierIdx > 0, fx: '/dead/fx-v1.webp' });
  setFPGHalf(R, tierIdx === 0);
  if (!R) return null;
  const env = townEnv({ mood: 'dusk', shadowRange: 24 });
  env.shadows = !!T.shadow;
  env.detail = tierIdx > 0 ? 1 : 0;
  if (T.post) env.post = { bloom: 0.55, th: 0.8, sat: 0.84, con: 1.1, vig: 0.5, lo: [0.9, 0.97, 1.08], hi: [1.08, 0.98, 0.88] };
  const statics = [];
  const parts0 = townMeshes({ grassN: T.grass || 1, grass: T.grass > 0, grassAt: [8, -18, 74], treeKeep: T.trees, chunk: 24, dusk: true, real: true });
  for (const p of parts0) statics.push({ mesh: R.mesh(p.data), bs: p.bs, cast: p.cast && !!T.shadow, model: p.model, kind: p.kind });
  for (const it of pondItems(R)) statics.push(it);
  const cache = new Map();
  const human = (key, look, lod) => {
    let c = cache.get(key);
    if (c) return c;
    const B = buildBody(look, lod);
    c = { mesh: R.skin(B.data), joints: B.joints };
    cache.set(key, c);
    return c;
  };
  const surv = (sv, col, lod = 1) => human(`s:${sv}:${col}:${lod}`, survLook(sv, col), lod);
  const zomb = (k, id, lod = 1) => { const L = ZLOOKS[k] || ZLOOKS.walker; const i = zLookIndex(k, id); return human(`z:${k}:${i}:${lod}`, L[i], lod); };
  const dog = (key) => {
    const k = `d:${key}`;
    let c = cache.get(k);
    if (c) return c;
    const D = DOGS.find((d) => d.key === key) || DOGS[0];
    const B = buildDog(D, 1);
    c = { mesh: R.skin(B.data), joints: B.joints };
    cache.set(k, c);
    return c;
  };
  const gun = (kind) => { const k = `g:${kind}`; let c = cache.get(k); if (!c) { c = R.mesh(gunMesh(kind)); cache.set(k, c); } return c; };
  const fp = (kind, sv, col) => {
    const k = `fp:${kind}:${sv}:${col}`;
    let c = cache.get(k);
    if (!c) { c = Object.assign(makeFPState(), buildFP(R, kind, sv, col)); cache.set(k, c); }
    getFPG(R, kind);
    return c;
  };
  const V = { R, env, statics, surv, zomb, dog, gun, fp, tier: T, cache, zm: null, dead: false, dispose: () => { V.dead = true; try { R.dispose(); } catch {} } };
  loadZAnims('/dead').then(async (anims) => {
    if (V.dead) return;
    const zm = { anims, n: 0 };
    V.zm = zm;
    for (const name of ZORDER) {
      try {
        const x = await loadZModel('/dead', name, tierIdx > 0, tierIdx === 0);
        if (V.dead) return;
        zm[name] = { M: x.model, mesh: R.tskin(x.model), tex: R.texture(x.img), nrm: x.nrm ? R.texture(x.nrm) : null };
        zm.n++;
      } catch {}
    }
  }).catch(() => {});
  const sm = { anims: null, chars: {}, want: [], fail: new Set(), busy: false };
  V.sm = sm;
  const pump = async () => {
    if (sm.busy || !sm.anims || V.dead) return;
    const k = sm.want.find((x) => !sm.chars[x] && !sm.fail.has(x));
    if (!k) return;
    sm.busy = true;
    try {
      const x = await loadZModel('/dead', `s${k}`, tierIdx > 0, tierIdx === 0);
      if (!V.dead) sm.chars[k] = { M: x.model, mesh: R.tskin(x.model), tex: R.texture(x.img), nrm: x.nrm ? R.texture(x.nrm) : null };
    } catch { sm.fail.add(k); }
    sm.busy = false;
    pump();
  };
  V.survModel = (k) => {
    const c = sm.chars[k];
    if (c) return c;
    if (!sm.want.includes(k)) { sm.want.push(k); pump(); }
    return null;
  };
  loadZAnims('/dead', 'sanim').then((a) => { if (!V.dead) { sm.anims = a; pump(); } }).catch(() => {});
  V.town = { ready: false, fail: 0 };
  const getTown = () => loadTown(R, T, tierIdx, () => V.dead).then((res) => {
    if (!res || V.dead) return;
    if (res.ground) for (let i = statics.length - 1; i >= 0; i--) if (statics[i].kind === 'ground' || statics[i].kind === 'road' || statics[i].kind === 'marks') { R.drop(statics[i].mesh); statics.splice(i, 1); }
    for (const it of res.items) { if (!T.shadow) it.cast = false; statics.push(it); }
    V.town.ready = true;
  }).catch(() => { V.town.fail++; if (!V.dead && V.town.fail < 4) setTimeout(getTown, 1500 * V.town.fail); });
  getTown();
  V.shell = R.mesh(magMesh('shotgun'));
  V.prepHands = (sv, col) => { V.nadeFP = buildThrowFP(R, 'grenade', sv, col); V.molFP = buildThrowFP(R, 'molotov', sv, col); V.batFP = buildBatFP(R, sv, col); if (!V.nadeObj) { V.nadeObj = buildThrowObj(R, 'grenade'); V.molObj = buildThrowObj(R, 'molotov'); } };
  return V;
}

export function toWorld(x, z, yaw, p) { const c = Math.cos(yaw), s = Math.sin(yaw); return [x + p[0] * c + p[2] * s, p[1], z - p[0] * s + p[2] * c]; }
export const groundAt = floorH;
