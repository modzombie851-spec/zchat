import { pondE, inRect, roadDist, RAIL, TOWN } from './ztown.js';
import { dirtW } from './zground.js';
import { houseY } from './zhouse.js';

const METAL = [];
export function metalArea(r) { METAL.push(r); }

export function stepSurf(x, z, lv, y) {
  for (const r of METAL) if (x > r[0] && x < r[2] && z > r[1] && z < r[3] && (y == null || y > r[4] - 0.3)) return 'metal';
  const hy = houseY(x, z, lv | 0);
  if (hy != null && ((lv | 0) || hy > 0.3)) return 'wood';
  if (pondE(x, z) < 1.0) return 'water';
  if (inRect(x, z, RAIL.plat, 0)) return 'conc';
  if (Math.abs(z - RAIL.z) < 2.6) return 'dirt';
  if ((z > -4.6 && z < 4.6) || roadDist(x, z) < 0.2 || inRect(x, z, TOWN.lot, 0)) return 'conc';
  return dirtW(x, z) > 0.5 ? 'dirt' : 'grass';
}
