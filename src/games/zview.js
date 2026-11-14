import { createRenderer, m4 } from './race3d.js';
import { pondItems } from './zpond.js';
import { townMeshes, townEnv } from './zmap.js';
import { buildDog } from './zbody.js';
import { DOGS } from './zlooks.js';
import { buildThrowObj, buildFlash, fpState } from './zfp.js';
import { getFPG, setFPGHalf, fpFiles, fpgFailed } from './zfpgl.js';
import { floorH, PLAY } from './ztown.js';
import { hitAdd } from './zhit.js';
import { loadZAnims, loadZModel, dropImgs, fetchImg, loadStatic, loadTexArrays } from './zmodel.js';
import { loadTown, poseM } from './ztownview.js';
import { loadRail } from './zrail.js';
import { resAll, resBlob, resReady } from './zres.js';
import { SCHAR } from './zsurv.js';
import { SELLER } from './zsim.js';

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
const ZORDER = ['zgirl', 'zmutant', 'zwar', 'zcop', 'zskel', 'zpara', 'zclown', 'zpump', 'zyaku', 'zpris', 'zsurv', 'zwarrok'];
export const TIERS = [
  { name: 'Fast', dpr: 0.7, shadow: 0, grass: 0, trees: 0.25, zmax: 34, pmax: 12, post: false, near: 9, shadowN: 0 },
  { name: 'Balanced', dpr: 0.9, shadow: 1024, grass: 6500, trees: 0.5, zmax: 56, pmax: 20, post: false, near: 14, shadowN: 10 },
  { name: 'Best', dpr: 1.25, shadow: 2048, grass: 15000, trees: 1, zmax: 80, pmax: 40, post: true, near: 20, shadowN: 22 },
];

export const GUN_KEYS = ['rifle', 'smg', 'pistol', 'shotgun', 'sniper', 'deagle', 'uzi', 'qq9', 'ak47', 'xpr', 'lmg', 'spas', 'awm', 'mgl'];
export const survFiles = (k) => [`dead/s${k}.bin`, `dead/s${k}_d.webp`, `dead/s${k}_n.webp`];
export const gunFiles = (g) => fpFiles(g);
const STALL = [
  ['crate', 0, 0, 1.12, 0, 0, 0.85],
  ['pallet', -0.6, 0.51, -2.22, 0, 1, 1], ['pallet', 0.6, 0.51, -2.22, 0, 1, 1], ['pallet', -0.6, 1.53, -2.22, 0, 1, 1], ['pallet', 0.6, 1.53, -2.22, 0, 1, 1],
  ['wg_sn', -0.6, 1.66, -2.07, 1, 0, 1.1], ['wg_r', 0.62, 1.66, -2.07, 1, 0, 1.1], ['wg_sh', -0.6, 1.17, -2.07, 1, 0, 1.1], ['wg_smg', 0.4, 1.17, -2.07, 1, 0, 1.1], ['wg_p', 1.02, 1.22, -2.07, 1, 0, 1.1],
  ['ammo', -0.62, 0.83, 0.98, 2.16, 0, 1], ['ammo', -0.62, 0.997, 1.0, 2.08, 0, 1], ['ammo', -0.2, 0.83, 1.1, 1.88, 0, 1], ['plate', 0.38, 0.857, 1.6, 0.05, -1, 1],
  ['wg_mag', 0.86, 0.842, 0.95, 0.3, 0, 1, 1], ['wg_mag', 1.02, 0.842, 1.2, -0.25, 0, 1, 1], ['wg_mag', 0.7, 0.842, 1.28, 0.1, 0, 1, 1],
];
const KIT_CORE = new Set(PLAY.map((q) => q[0]).filter((id) => /^k[A-Z]/.test(id)).map((id) => `dead/kit/st_${id}.bin`));
export function coreFiles(k, guns) {
  const base = resAll((p) => p.startsWith('dead/town/') || p === 'dead/kit/kit.json' || p.startsWith('dead/kit/tex_') || KIT_CORE.has(p) || /^dead\/z[^/]*$/.test(p) || p === 'dead/sanim.bin' || p === 'dead/fx-v1.webp' || p.startsWith('dead/nade') || p.startsWith('dead/molo') || p === 'dead/fx2-v1.webp' || p === 'dead/boom-v1.webp' || p.startsWith('dead/emo/') || p.startsWith('dead/ui/') || p.startsWith('dead/sky/') || p.startsWith('dead/rail/') || p.startsWith('dead/sdog') || p.startsWith('dead/sell') || p.startsWith('dead/props/') || p === 'dead/danim.bin' || p.startsWith('sounds/dead/'));
  return [...new Set([...base, ...survFiles(k), ...fpFiles('throw'), ...guns.flatMap((g) => fpFiles(g))])];
}
export function packList(k, guns) {
  const gs = [...GUN_KEYS.filter((g) => !guns.includes(g)), ...guns];
  const cs = [...SCHAR.map((c) => c.k).filter((x) => x !== k), k];
  return [...gs.map((g) => [`g:${g}`, fpFiles(g)]), ...cs.map((c) => [`s:${c}`, survFiles(c)])];
}

const SKY_SUN = [-0.781, 0.170, 0.601];
const FOG_SKY = [0.115, 0.088, 0.071];
export function makeView(canvas, tierIdx, ov) {
  const T = { ...(TIERS[tierIdx] || TIERS[1]), ...(ov || {}) };
  const R = createRenderer(canvas, { shadowSize: T.shadow || 256, aa: tierIdx > 0, fx: resBlob('/dead/fx-v1.webp').catch(() => null), fx2: resBlob('/dead/fx2-v1.webp').catch(() => null), boom: resBlob('/dead/boom-v1.webp').catch(() => null) });
  if (!R) return null;
  setFPGHalf(R, tierIdx === 0);
  const env = townEnv({ mood: 'dusk', shadowRange: 24, sun: SKY_SUN });
  env.fogCol = env.fogCol.map((v, i) => v * 0.35 + FOG_SKY[i] * 0.65);
  env.shadows = !!T.shadow;
  env.detail = tierIdx > 0 ? 1 : 0;
  if (T.post) env.post = { bloom: 0.55, th: 0.8, sat: 0.84, con: 1.1, vig: 0.5, lo: [0.9, 0.97, 1.08], hi: [1.08, 0.98, 0.88] };
  const statics = [];
  const parts0 = townMeshes({ grassN: T.grass || 1, grass: T.grass > 0, grassAt: [8, -18, 74], treeKeep: T.trees, chunk: 24, dusk: true, real: true });
  for (const p of parts0) statics.push({ mesh: R.mesh(p.data), bs: p.bs, cast: p.cast && !!T.shadow, model: p.model, kind: p.kind });
  for (const it of pondItems(R)) statics.push(it);
  const cache = new Map();
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
  const flash = buildFlash(R);
  const fp = (kind) => {
    const k = `fp:${kind}`;
    let c = cache.get(k);
    if (!c) { c = fpState(kind, flash); cache.set(k, c); }
    getFPG(R, kind);
    return c;
  };
  const skyFile = tierIdx === 0 || !(R.maxTex && R.maxTex() >= 4096) ? 'dusk2k' : 'dusk3k';
  fetchImg(`/dead/sky/${skyFile}.webp`).then((im) => { if (!V.dead && R.setSky) R.setSky(im); if (im && im.close) { try { im.close(); } catch {} } }).catch(() => {});
  const onLost = (e) => { try { e.preventDefault(); } catch {} if (V.dead) return; V.lost = true; if (V.onLost) V.onLost(); };
  canvas.addEventListener('webglcontextlost', onLost);
  const V = { R, env, statics, dog, fp, tier: T, cache, zm: null, dead: false, lost: false, err: null, mainK: null, onLost: null, dispose: () => { V.dead = true; canvas.removeEventListener('webglcontextlost', onLost); try { R.dispose(); } catch {} } };
  V.zst = { done: 0, tot: ZORDER.length };
  Promise.all([loadZAnims('/dead'), loadZAnims('/dead', 'zanim2').catch(() => null)]).then(async ([anims, a2]) => {
    if (V.dead) return;
    if (a2 && a2.clips) for (const [k, c] of Object.entries(a2.clips)) if (!anims.clips[k]) anims.clips[k] = c;
    const zm = { anims, n: 0 };
    for (const name of ZORDER) {
      try {
        const x = await loadZModel('/dead', name, tierIdx > 0, tierIdx < 2);
        if (V.dead) { dropImgs(x); return; }
        zm[name] = { M: x.model, mesh: R.tskin(x.model), tex: R.texture(x.img), nrm: x.nrm ? R.texture(x.nrm) : null };
        dropImgs(x);
        zm.n++;
      } catch {}
      V.zst.done++;
    }
    if (zm.n) V.zm = zm; else V.err = 'zombies';
  }).catch(() => { V.err = 'zombies'; });
  const sm = { anims: null, chars: {}, want: [], fail: new Set(), busy: false };
  V.sm = sm;
  const pump = async () => {
    if (sm.busy || !sm.anims || V.dead) return;
    let k = sm.want.find((x) => !sm.chars[x] && !sm.fail.has(x));
    let up = false;
    if (!k && tierIdx === 1 && V.mainK && sm.chars[V.mainK] && sm.chars[V.mainK].half && !sm.upFail) { k = V.mainK; up = true; }
    if (!k) return;
    sm.busy = true;
    try {
      const half = tierIdx === 0 || (tierIdx === 1 && k !== V.mainK);
      const x = await loadZModel('/dead', `s${k}`, tierIdx > 0, half);
      if (!V.dead) { const prev = sm.chars[k]; sm.chars[k] = { k, half, M: x.model, mesh: prev ? prev.mesh : R.tskin(x.model), tex: R.texture(x.img), nrm: x.nrm ? R.texture(x.nrm) : null }; }
      dropImgs(x);
    } catch { if (up) sm.upFail = true; else sm.fail.add(k); }
    sm.busy = false;
    pump();
  };
  V.warm = (k) => {
    if (sm.chars[k] || sm.want.includes(k) || !resReady(survFiles(k))) return;
    sm.want.push(k);
    pump();
  };
  V.survModel = (k) => {
    const c = sm.chars[k];
    if (c) return c;
    V.warm(k);
    return sm.chars[V.mainK] || sm.chars[Object.keys(sm.chars)[0]] || null;
  };
  loadZAnims('/dead', 'sanim').then((a) => { if (!V.dead) { sm.anims = a; pump(); } }).catch(() => { V.err = 'survivors'; });
  V.town = { ready: false, fail: 0, p: 0 };
  const getTown = () => loadTown(R, T, tierIdx, () => V.dead, (f) => { V.town.p = f; }).then((res) => {
    if (!res || V.dead) return;
    if (res.ground) for (let i = statics.length - 1; i >= 0; i--) if (statics[i].kind === 'ground' || statics[i].kind === 'road' || statics[i].kind === 'marks') { R.drop(statics[i].mesh); statics.splice(i, 1); }
    for (const it of res.items) { if (!T.shadow) it.cast = false; statics.push(it); }
    V.town.p = 1;
    V.town.ready = true;
    V.propHitOn = false;
    addPropHits();
  }).catch(() => { V.town.fail++; if (!V.dead && V.town.fail < 3) setTimeout(getTown, 1200 * V.town.fail); else V.err = 'town'; });
  getTown();
  V.realDog = null;
  const getDog = (n) => Promise.all([loadZAnims('/dead', 'danim'), loadZModel('/dead', 'sdog', tierIdx > 0, tierIdx === 0)]).then(async ([an, x]) => {
    if (V.dead) { dropImgs(x); return; }
    const tex = { rex: R.texture(x.img) };
    for (const k of ['luna', 'bear', 'goldie']) { for (let a = 0; a < 3 && !tex[k]; a++) { try { const im = await fetchImg(`/dead/sdog_${k}_d.webp`, tierIdx === 0); if (V.dead) return; tex[k] = R.texture(im); if (im.close) im.close(); } catch {} } }
    V.realDog = { M: x.model, mesh: R.tskin(x.model), tex, nrm: x.nrm ? R.texture(x.nrm) : null, clips: an.clips };
    dropImgs(x);
  }).catch(() => { if (!V.dead && n < 4) setTimeout(() => getDog(n + 1), 1500 * (n + 1)); else V.realDogFail = true; });
  getDog(0);
  V.seller = null;
  Promise.all([loadZAnims('/dead', 'sellanim'), loadZModel('/dead', 'seller', tierIdx > 0, tierIdx === 0)]).then(([an, x]) => {
    if (V.dead) { dropImgs(x); return; }
    V.seller = { M: x.model, mesh: R.tskin(x.model), tex: R.texture(x.img), nrm: x.nrm ? R.texture(x.nrm) : null, clips: an.clips };
    dropImgs(x);
  }).catch(() => {});
  V.props = null;
  const PROP_PARTS = new Set(['gas2']);
  let propHit = null;
  const addPropHits = () => { if (!propHit || !V.town.ready || V.propHitOn) return; V.propHitOn = true; for (const h of propHit) hitAdd(...h); };
  (async () => {
    const man = JSON.parse(await (await resBlob('/dead/props/props.json')).text());
    const ta = await loadTexArrays('/dead/props', man, (tierIdx === 0 ? 2 : tierIdx === 1 ? 1 : 0) + (T.lite ? 1 : 0));
    if (V.dead) return;
    const arrs = Object.keys(man.arrays).map((k) => R.texArray(ta[k].layers, ta[k].size));
    for (const k of Object.keys(ta)) for (const l of ta[k].layers) if (l && l.close) l.close();
    const P = { arrs };
    for (const id of Object.keys(man.models)) { try { const M0 = await loadStatic('/dead/props', id); P[id] = { mesh: R.tstat(M0), max: man.models[id].max, off: man.models[id].off || [0, 0, 0], M0: PROP_PARTS.has(id) ? M0 : null }; } catch {} }
    if (V.dead) return;
    V.props = P;
    const sy0 = floorH(SELLER.x, SELLER.z), H90 = Math.PI / 2;
    for (const [id, dx, dy, dz, yaw, pitch, s, roll = 0] of STALL) {
      const M = P[id];
      if (!M) continue;
      const x = SELLER.x + dx, y = sy0 + dy, z = SELLER.z + dz, mx = M.max;
      statics.push({ mesh: M.mesh, model: m4.pose(x, y, z, yaw * H90, pitch * H90, roll * H90, s), arrs: P.arrs, cast: !!T.shadow, bs: [x, y + mx[1] * s * 0.5, z, Math.hypot(mx[0], mx[1], mx[2]) * s + 0.3] });
    }
    const own = [];
    for (const [id, x, z, yaw = 0, s = 1, dy = 0] of PLAY) {
      if (!PROP_PARTS.has(id) || !P[id] || !P[id].M0) continue;
      const y = floorH(x, z) - P[id].off[1] * s + dy;
      const mx = P[id].max;
      statics.push({ mesh: P[id].mesh, model: poseM(x, y, z, yaw, s), arrs: P.arrs, cast: !!T.shadow, bs: [x, y + mx[1] * s * 0.5, z, Math.hypot(mx[0], mx[1], mx[2]) * s] });
      own.push([P[id].M0, x, y, z, yaw, s]);
    }
    propHit = own;
    addPropHits();
  })().catch(() => {});
  loadRail(R, tierIdx, () => V.dead, !!T.lite).then((res) => { if (!res || V.dead) return; for (const it of res.items) { if (!T.shadow) it.cast = false; statics.push(it); } V.rail = res; V.tick = res.tick; }).catch(() => {});
  V.readyFor = (k, guns) => {
    if (V.mainK !== k) { V.mainK = k; sm.upFail = false; pump(); }
    V.warm(k);
    const gs = [...new Set([...guns, 'throw'])];
    let gOk = 0;
    for (const g of gs) if (getFPG(R, g)) gOk++;
    const err = V.err || (gs.some((g) => fpgFailed(R, g)) ? 'guns' : null) || (sm.fail.has(k) ? 'survivor' : null);
    const pct = 0.55 * V.town.p + 0.25 * (V.zst.done / V.zst.tot) + (sm.anims ? 0.04 : 0) + (sm.chars[k] ? 0.06 : 0) + 0.1 * (gOk / gs.length);
    return { pct: Math.min(1, pct), ok: !err && V.town.ready && !!V.zm && !!sm.chars[k] && gOk === gs.length, err };
  };
  V.prepHands = () => { if (!V.nadeObj) { V.nadeObj = buildThrowObj(R, 'grenade'); V.molObj = buildThrowObj(R, 'molotov'); } };
  V.thrM = {};
  for (const k of ['nade', 'molo']) loadZModel('/dead', k, true, tierIdx === 0).then((x) => { if (V.dead) { dropImgs(x); return; } V.thrM[k] = { M: x.model, mesh: R.tskin(x.model), tex: R.texture(x.img), nrm: x.nrm ? R.texture(x.nrm) : null }; dropImgs(x); }).catch(() => {});
  V.prepHands();
  return V;
}

export const groundAt = floorH;
