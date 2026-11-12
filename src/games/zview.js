import { createRenderer, m4 } from './race3d.js';
import { townMeshes, townEnv } from './zmap.js';
import { survivorMeshes, zombieMeshes, SURVIVORS, ZOMBIES, muzzleOf } from './zmesh.js';
import { floorH } from './ztown.js';

export const OUTFITS = {
  jay: [null, { shirt: '#3E8FD8', graphic: '#1E4A7A' }, { shirt: '#5AA05A', graphic: '#2E5A2E' }, { shirt: '#D8D4C8', graphic: '#7A7468' }],
  maya: [null, { shirt: '#3A6FB0', hood: '#2F5E98', cuff: '#2A5288' }, { shirt: '#4E8A4A', hood: '#3E7A3A', cuff: '#346A30' }, { shirt: '#8A4AA8', hood: '#7A3A98', cuff: '#6A3088' }],
  tom: [null, { shirt: '#2E5A8A', plaid: '#14304A', cuff: '#1E3E5E' }, { shirt: '#3E6E3A', plaid: '#1E3A1C', cuff: '#2A4A28' }, { shirt: '#6A6A6E', plaid: '#2A2A2E', cuff: '#444448' }],
  rin: [null, { shirt: '#4A5E8A', zip: '#2A3A5A', cuff: '#3A4E7A' }, { shirt: '#8A5A3A', zip: '#4A2E1E', cuff: '#7A4A2A' }, { shirt: '#5A5A62', zip: '#2E2E34', cuff: '#4A4A52' }],
  doc: [null, { shirt: '#C2453E', patch: '#E8E4DA' }, { shirt: '#4E9A6A', patch: '#E8E4DA' }, { shirt: '#E8B43A', patch: '#3E7FC0' }],
};
export const OUTFIT_SWATCH = (sv, i) => { const o = OUTFITS[sv] && OUTFITS[sv][i]; if (o) return o.shirt; const S = SURVIVORS.find((s) => s.key === sv); return S ? S.shirt : '#888888'; };
export const TIERS = [
  { name: 'Fast', dpr: 0.7, shadow: 0, grass: 0, trees: 0.25, zmax: 34, pmax: 14, post: false },
  { name: 'Balanced', dpr: 0.9, shadow: 1024, grass: 6500, trees: 0.5, zmax: 56, pmax: 24, post: false },
  { name: 'Best', dpr: 1.25, shadow: 2048, grass: 15000, trees: 1, zmax: 80, pmax: 50, post: true },
];

export function makeView(canvas, tierIdx) {
  const T = TIERS[tierIdx] || TIERS[1];
  const R = createRenderer(canvas, { shadowSize: T.shadow || 256, aa: tierIdx > 0 });
  if (!R) return null;
  const env = townEnv({ fogDen: 0.0048, shadowRange: 22, exposure: 0.95 });
  env.shadows = !!T.shadow;
  env.detail = tierIdx > 0 ? 1 : 0;
  if (T.post) env.post = { bloom: 0.55, th: 0.87, sat: 1.06, con: 1.04, vig: 0.24 };
  const statics = [];
  const parts0 = townMeshes({ grassN: T.grass || 1, grass: T.grass > 0, grassAt: [8, -18, 74], treeKeep: T.trees, chunk: 24 });
  for (const p of parts0) statics.push({ mesh: R.mesh(p.data), bs: p.bs, cast: p.cast && !!T.shadow, model: p.model });
  const cache = new Map();
  const surv = (sv, gun, col, pose) => {
    const key = `s:${sv}:${gun}:${col}:${pose}`;
    let c = cache.get(key);
    if (c) return c;
    const S0 = SURVIVORS.find((s) => s.key === sv) || SURVIVORS[0];
    const spec = { ...S0, ...(OUTFITS[sv] && OUTFITS[sv][col] ? OUTFITS[sv][col] : {}), gun };
    const M = survivorMeshes(spec, pose);
    c = { body: R.mesh(M.body), leg: R.mesh(M.leg), hip: M.hip, spec, muzzle: muzzleOf(spec, pose) };
    cache.set(key, c);
    return c;
  };
  const zomb = (k) => {
    const key = `z:${k}`;
    let c = cache.get(key);
    if (c) return c;
    const S0 = ZOMBIES.find((s) => s.key === k) || ZOMBIES[0];
    const M = zombieMeshes(S0);
    c = { body: R.mesh(M.body), leg: R.mesh(M.leg), hip: M.hip, scale: S0.scale || 1 };
    cache.set(key, c);
    return c;
  };
  return { R, env, statics, surv, zomb, tier: T, dispose: () => { try { R.dispose(); } catch {} } };
}

export function personItems(out, M, x, z, yaw, o = {}) {
  const y = (o.y != null ? o.y : floorH(x, z)) + (o.bob || 0);
  let B = m4.pose(x, y, z, yaw, o.pitch || 0, o.roll || 0);
  if (o.lie) B = m4.mul(m4.pose(x, y + 0.18, z, yaw), m4.pose(0, 0, 0, 0, -1.45, 0.1));
  if (o.fall) B = m4.mul(m4.pose(x, y - o.sink, z, yaw), m4.pose(0, 0, 0, 0, -o.fall * 1.45, 0));
  out.push({ mesh: M.body, model: B, cast: o.cast !== false, tint: o.tint });
  const w = o.walk || 0;
  for (const s of [-1, 1]) out.push({ mesh: M.leg, model: m4.mul(B, m4.pose(s * M.hip[0], M.hip[1], 0, 0, s * w, 0)), cast: o.cast !== false, tint: o.tint });
  return B;
}

export function toWorld(x, z, yaw, p) { const c = Math.cos(yaw), s = Math.sin(yaw); return [x + p[0] * c + p[2] * s, p[1], z - p[0] * s + p[2] * c]; }
