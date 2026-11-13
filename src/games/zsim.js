import { BOUNDS, solids, SPAWNS, PSPAWN, rng } from './ztown.js';
import { houseCollide, houseY, levelStep, rayHouse, HOUSE_SPAWNS, lvOk, inHouse } from './zhouse.js';
import { makeNav } from './znav.js';

export const WEAPONS = {
  pistol: { n: 'Pistol', dmg: 34, rate: 3.4, mag: 12, rel: 1.2, rng: 42, spr: 0.018, pel: 1, auto: 0, bot: 0.62 },
  smg: { n: 'SMG', dmg: 17, rate: 11, mag: 32, rel: 1.7, rng: 30, spr: 0.05, pel: 1, auto: 1, bot: 0.5 },
  rifle: { n: 'Rifle', dmg: 29, rate: 7.5, mag: 30, rel: 2.0, rng: 58, spr: 0.022, pel: 1, auto: 1, bot: 0.55 },
  shotgun: { n: 'Shotgun', dmg: 15, rate: 1.4, mag: 6, rel: 2.3, rng: 17, spr: 0.11, pel: 8, auto: 0, bot: 0.7 },
  sniper: { n: 'Sniper', dmg: 150, rate: 0.95, mag: 5, rel: 2.5, rng: 95, spr: 0.003, pel: 1, auto: 0, pierce: 3, bot: 0.72 },
};
export const WKEYS = ['pistol', 'smg', 'rifle', 'shotgun', 'sniper'];
export const MELEE = {
  bat: { n: 'Bat', dmg: 60, rate: 1.5, rng: 2.4, arc: 1.5, push: 2.2 },
  machete: { n: 'Machete', dmg: 80, rate: 1.9, rng: 2.2, arc: 1.2, push: 0.8 },
  fireAxe: { n: 'Fire axe', dmg: 140, rate: 1.0, rng: 2.5, arc: 1.3, push: 1.6 },
};
export const MKEYS = ['bat', 'machete', 'fireAxe'];
export const THROW = { grenade: { n: 'Grenade', dmg: 260, r: 6.5, fuse: 1.5 }, molotov: { n: 'Molotov', dps: 50, r: 4.4, life: 7 } };
export const ZT = {
  walker: { hp: 75, spd: 1.45, dmg: 9, r: 0.42, pts: 10, cd: 1.1, h: 1.75 },
  worker: { hp: 125, spd: 1.15, dmg: 12, r: 0.48, pts: 14, cd: 1.2, h: 1.8 },
  runner: { hp: 55, spd: 3.6, dmg: 7, r: 0.4, pts: 16, cd: 0.8, h: 1.72 },
  bloater: { hp: 190, spd: 0.95, dmg: 14, r: 0.68, pts: 25, cd: 1.4, h: 1.8, boom: 1 },
  brute: { hp: 1200, spd: 1.6, dmg: 30, r: 0.95, pts: 150, cd: 1.6, h: 2.7 },
  crawler: { hp: 60, spd: 0.95, dmg: 8, r: 0.42, pts: 14, cd: 1.0, h: 0.6, low: 1 },
  screamer: { hp: 95, spd: 1.35, dmg: 6, r: 0.42, pts: 30, cd: 1.2, h: 1.72, scream: 1 },
  riot: { hp: 240, spd: 1.25, dmg: 13, r: 0.5, pts: 35, cd: 1.2, h: 1.85, armor: 0.4 },
  spitter: { hp: 85, spd: 1.3, dmg: 5, r: 0.42, pts: 30, cd: 1.2, h: 1.75, spit: 1 },
};
export const ZKEYS = ['walker', 'worker', 'runner', 'bloater', 'brute', 'crawler', 'screamer', 'riot', 'spitter'];
export const PETS = ['rex', 'luna', 'bear', 'goldie'];
export const ACID = { r: 2.2, life: 3.2, dps: 11 };
export function hitDamage(w, z, head, d) {
  const W = WEAPONS[w];
  if (!W) return 0;
  const T = ZT[z] || ZT.walker;
  let dmg = W.dmg * (head ? 2 : 1);
  if (W.pel > 1) dmg *= 1 - Math.min(0.65, (d / W.rng) * 0.65);
  if (T.armor && !head) dmg *= T.armor;
  return dmg;
}
const wcap = (w) => { const W = WEAPONS[w]; return W ? W.dmg * W.pel * W.rate * 2.3 : 200; };
export const SURV = ['jay', 'maya', 'tom', 'rin', 'doc'];
export const SURV_GUN = { jay: 'rifle', maya: 'shotgun', tom: 'smg', rin: 'sniper', doc: 'pistol' };
export const BOT_NAMES = ['Ash', 'Kit', 'Nova', 'Rook', 'Sage', 'Tex', 'Wren', 'Zed'];
export const PH = { break: 0, fight: 1, over: 2 };

const CELL = 2;
const [BX0, BZ0, BX1, BZ1] = BOUNDS;
const GW = Math.ceil((BX1 - BX0) / CELL), GH = Math.ceil((BZ1 - BZ0) / CELL);
const SB = 8, SW = Math.ceil((BX1 - BX0 + 40) / SB), SHH = Math.ceil((BZ1 - BZ0 + 40) / SB);

let geo = null;
function geometry() {
  if (geo) return geo;
  const { rects, circles } = solids();
  const buckets = new Array(SW * SHH);
  const add = (i, s) => { if (i >= 0 && i < buckets.length) (buckets[i] || (buckets[i] = [])).push(s); };
  const bi = (x, z) => [Math.floor((x - BX0 + 20) / SB), Math.floor((z - BZ0 + 20) / SB)];
  for (const r of rects) { const [a, b] = bi(r[0] - 1, r[1] - 1), [c, d] = bi(r[2] + 1, r[3] + 1); for (let i = a; i <= c; i++) for (let j = b; j <= d; j++) if (i >= 0 && i < SW && j >= 0 && j < SHH) add(j * SW + i, { r }); }
  for (const c of circles) { const [a, b] = bi(c[0] - c[2] - 1, c[1] - c[2] - 1), [e, d] = bi(c[0] + c[2] + 1, c[1] + c[2] + 1); for (let i = a; i <= e; i++) for (let j = b; j <= d; j++) if (i >= 0 && i < SW && j >= 0 && j < SHH) add(j * SW + i, { c }); }
  const block = new Uint8Array(GW * GH);
  for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
    const x = BX0 + (i + 0.5) * CELL, z = BZ0 + (j + 0.5) * CELL;
    for (const r of rects) if (x + 0.7 > r[0] - 0.15 && x - 0.7 < r[2] + 0.15 && z + 0.7 > r[1] - 0.15 && z - 0.7 < r[3] + 0.15) { block[j * GW + i] = 1; break; }
    if (!block[j * GW + i]) for (const c of circles) if (c[2] > 0.9 && Math.hypot(x - c[0], z - c[1]) < c[2] + 0.4) { block[j * GW + i] = 1; break; }
  }
  const solidAt = (x, z) => {
    for (const r of rects) if (x > r[0] - 0.25 && x < r[2] + 0.25 && z > r[1] - 0.25 && z < r[3] + 0.25) return true;
    for (const c of circles) if (Math.hypot(x - c[0], z - c[1]) < c[2] + 0.25) return true;
    return false;
  };
  geo = { buckets, block };
  geo.nav = makeNav({ BX0, BZ0, GW, GH, CELL, block, solid: solidAt });
  return geo;
}
export const entY = (e) => { const h = houseY(e.x, e.z, e.lv | 0); return h == null ? 0 : h; };

export function collide(x, z, r, lv) {
  const G = geometry();
  for (let pass = 0; pass < 2; pass++) {
    const i = Math.floor((x - BX0 + 20) / SB), j = Math.floor((z - BZ0 + 20) / SB);
    const list = i >= 0 && i < SW && j >= 0 && j < SHH ? G.buckets[j * SW + i] : null;
    if (list) for (const s of list) {
      if (s.r) {
        const R = s.r;
        const cx = x < R[0] ? R[0] : x > R[2] ? R[2] : x, cz = z < R[1] ? R[1] : z > R[3] ? R[3] : z;
        const dx = x - cx, dz = z - cz, d2 = dx * dx + dz * dz;
        if (d2 < r * r) {
          if (d2 > 1e-6) { const d = Math.sqrt(d2), k = (r - d) / d; x += dx * k; z += dz * k; }
          else { const l = x - R[0], rr = R[2] - x, t = z - R[1], b = R[3] - z, m = Math.min(l, rr, t, b); if (m === l) x = R[0] - r; else if (m === rr) x = R[2] + r; else if (m === t) z = R[1] - r; else z = R[3] + r; }
        }
      } else {
        const C = s.c, dx = x - C[0], dz = z - C[1], d2 = dx * dx + dz * dz, rr = r + C[2];
        if (d2 < rr * rr && d2 > 1e-6) { const d = Math.sqrt(d2), k = (rr - d) / d; x += dx * k; z += dz * k; }
      }
    }
  }
  if (inHouse(x, z, r + 0.3)) { const h = houseCollide(x, z, r, lv | 0); x = h[0]; z = h[1]; }
  if (x < BX0 + r) x = BX0 + r; else if (x > BX1 - r) x = BX1 - r;
  if (z < BZ0 + r) z = BZ0 + r; else if (z > BZ1 - r) z = BZ1 - r;
  return [x, z];
}

export function rayBlocked(x0, z0, x1, z1, y0, y1) {
  const G = geometry();
  if (rayHouse(x0, z0, y0 == null ? (houseY(x0, z0, 0) || 0) + 1.3 : y0, x1, z1, y1 == null ? (houseY(x1, z1, 0) || 0) + 1.3 : y1)) return true;
  const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz), n = Math.ceil(L / 1.5);
  for (let k = 1; k < n; k++) {
    const t = k / n, x = x0 + dx * t, z = z0 + dz * t;
    const i = Math.floor((x - BX0) / CELL), j = Math.floor((z - BZ0) / CELL);
    if (i >= 0 && i < GW && j >= 0 && j < GH && G.block[j * GW + i]) {
      const { rects } = solids();
      for (const r of rects) if (x > r[0] && x < r[2] && z > r[1] && z < r[3]) return true;
    }
  }
  return false;
}

export function waveSize(w, n) { return Math.round((8 + w * 5 + Math.pow(w, 1.4)) * (0.7 + 0.3 * Math.min(n, 60))); }

function newPet(p) { return { x: p.x + 0.8, z: p.z - 0.8, lv: p.lv | 0, yaw: p.yaw, st: 0, tg: null, cd: 0, bites: 0, rest: 0, leap: 0, mv: 0 }; }

export function makeSim(o = {}) {
  const R = rng(o.seed || (Date.now() & 0xffff) || 7);
  const S = {
    t: 0, wave: 0, ph: 'break', tl: o.firstBreak || 10, left: 0, spawnT: 0, nid: 1,
    players: new Map(), zs: new Map(), ev: [], fires: [], nades: [], spits: [], acid: [],
    maxAlive: o.maxAlive || 70, botFill: o.botFill == null ? 4 : o.botFill, best: 0, kills: 0,
    flow: null, flowT: 0, botSeq: 0,
  };
  const emit = (e) => { S.ev.push(e); };
  const alivePlayers = () => { const a = []; for (const p of S.players.values()) if (p.st === 0) a.push(p); return a; };
  const humans = () => { let n = 0; for (const p of S.players.values()) if (!p.bot) n++; return n; };
  const spawnAt = (i) => { const s = PSPAWN[i % PSPAWN.length]; return [s[0] + (R() - 0.5) * 2.4, s[1] + (R() - 0.5) * 2.4]; };
  const sees = (a, b, ha, hb) => !rayBlocked(a.x, a.z, b.x, b.z, entY(a) + (ha == null ? 1.3 : ha), entY(b) + (hb == null ? 1.1 : hb));
  const near = (a, b, dy) => Math.abs(entY(a) - entY(b)) < (dy || 1.3);
  const moveTo = (e, x, z, r) => { const t = { x, z, lv: e.lv | 0 }; levelStep(t); const c = collide(x, z, r, t.lv); e.x = c[0]; e.z = c[1]; e.lv = t.lv; t.x = c[0]; t.z = c[1]; levelStep(t); e.lv = t.lv; };

  S.addPlayer = (id, m = {}) => {
    const old = S.players.get(id);
    if (old) {
      old.n = m.n || old.n; old.sv = m.sv || old.sv; old.col = m.col | 0; old.gone = 0; old.pk = PETS.includes(m.pet) ? m.pet : old.pk; if (old.pk && !old.pet) old.pet = newPet(old);
      if (old.away != null || old.ctl) { old.away = null; old.ctl = 0; old.left = 0; old.revT = null; old.seen = S.t; emit(['pb', id]); }
      return old;
    }
    const [x, z] = spawnAt(S.players.size);
    const sv = SURV.includes(m.sv) ? m.sv : SURV[S.players.size % SURV.length];
    const p = { id, n: String(m.n || 'Player').slice(0, 20), sv, col: m.col | 0, bot: !!m.bot, x, z, lv: 0, yaw: Math.PI, aim: 0, w: WEAPONS[m.w] ? m.w : SURV_GUN[sv], hp: 100, st: 0, bleed: 0, rev: 0, revBy: null, kills: 0, pts: 0, downs: 0, budget: 400, mcd: 0, tcd: 0, seen: S.t, fl: 0, vx: 0, vz: 0, slot: S.players.size, pk: !m.bot && PETS.includes(m.pet) ? m.pet : null, pet: null, acidT: 0 };
    if (p.pk) p.pet = newPet(p);
    S.players.set(id, p);
    if (!p.bot) S.fillBots();
    emit(['pj', id]);
    return p;
  };
  S.awayPlayer = (id) => {
    const p = S.players.get(id);
    if (!p || p.bot || p.away != null) return;
    p.away = S.t; p.ctl = 1;
    const W = WEAPONS[p.w] || WEAPONS.rifle;
    if (p.mag == null) p.mag = W.mag;
    p.fcd = 0; p.rl = 0; p.vx = 0; p.vz = 0;
    if (!WEAPONS[p.w]) p.w = SURV_GUN[p.sv] || 'rifle';
    emit(['pa', id]);
  };
  S.dropLeft = () => { for (const p of [...S.players.values()]) if (p.left) S.removePlayer(p.id); };
  S.removePlayer = (id) => {
    const p = S.players.get(id);
    if (!p) return;
    S.players.delete(id);
    for (const q of S.players.values()) if (q.revBy === id) { q.revBy = null; q.rev = 0; }
    emit(['pl', id]);
    S.fillBots();
  };
  S.fillBots = () => {
    if (S.botFill <= 0) return;
    const want = Math.max(0, S.botFill - humans());
    const bots = [...S.players.values()].filter((p) => p.bot);
    while (bots.length > want) { const b = bots.pop(); S.players.delete(b.id); emit(['pl', b.id]); }
    let k = bots.length;
    while (k < want) {
      S.botSeq++;
      const id = `bot${S.botSeq}`;
      const sv = SURV[(S.botSeq + 1) % SURV.length];
      S.addPlayer(id, { n: BOT_NAMES[S.botSeq % BOT_NAMES.length], sv, bot: true, col: (S.botSeq >> 2) & 3 });
      const b = S.players.get(id); b.mag = WEAPONS[b.w].mag; b.fcd = 0; b.rl = 0;
      k++;
    }
  };

  S.setPlayer = (id, s) => {
    const p = S.players.get(id);
    if (!p || p.bot || p.ctl) return;
    const now = S.t, dt = Math.max(0.05, now - (p.seen || now));
    p.seen = now;
    if (p.st === 0 && Number.isFinite(s.x) && Number.isFinite(s.z)) {
      let dx = s.x - p.x, dz = s.z - p.z;
      const lim = 7.5 * dt + 1.2, d = Math.hypot(dx, dz);
      if (d > lim) { dx *= lim / d; dz *= lim / d; }
      const nx = p.x + dx, nz = p.z + dz, e = { x: nx, z: nz, lv: p.lv | 0 };
      levelStep(e);
      if ((s.lv === 0 || s.lv === 1) && lvOk(nx, nz, s.lv)) e.lv = s.lv;
      const c = collide(nx, nz, 0.38, e.lv);
      p.vx = (c[0] - p.x) / dt; p.vz = (c[1] - p.z) / dt;
      p.x = c[0]; p.z = c[1]; p.lv = e.lv;
    }
    if (Number.isFinite(s.yaw)) p.yaw = s.yaw;
    if (Number.isFinite(s.aim)) p.aim = Math.max(-1, Math.min(1, s.aim));
    if (WEAPONS[s.w] || MELEE[s.w]) p.w = s.w;
    p.fl = s.fl | 0;
    p.revT = typeof s.rv === 'string' ? s.rv : null;
  };

  const hurtZ = (z, dmg, by, head, how) => {
    if (z.hp <= 0) return false;
    z.hp -= dmg;
    if (z.hp > 0) return false;
    S.zs.delete(z.id);
    S.kills++;
    const T = ZT[z.k];
    const p = by ? S.players.get(by) : null;
    if (p) { p.kills++; p.pts += Math.round(T.pts * (head ? 1.5 : 1)); }
    emit(['k', z.id, by || '', head ? 1 : 0, how || 'g']);
    if (T.boom) blast(z.x, z.z, 3.6, 120, null, 'b', z.lv | 0);
    return true;
  };
  const blast = (x, z, r, dmg, by, kind, lv) => {
    const at = { x, z, lv: lv | 0 };
    emit(['ex', Math.round(x * 10), Math.round(z * 10), Math.round(r * 10), kind || 'g', at.lv]);
    for (const q of [...S.zs.values()]) { const d = Math.hypot(q.x - x, q.z - z); if (d < r + q.r && near(q, at, 2.2)) { hurtZ(q, dmg * (1 - Math.min(0.6, d / r * 0.6)), by, false, 'x'); if (q.hp > 0) { const k = (r - d) / r * 1.6 / Math.max(0.3, d); const c = collide(q.x + (q.x - x) * k, q.z + (q.z - z) * k, q.r, q.lv); q.x = c[0]; q.z = c[1]; q.stun = Math.max(q.stun, 0.6); } } }
    if (kind === 'b') for (const p of S.players.values()) if (p.st === 0 && Math.hypot(p.x - x, p.z - z) < r && near(p, at, 2.2)) hurtP(p, 14, null);
  };
  const hurtP = (p, dmg) => {
    if (p.st !== 0) return;
    p.hp -= dmg;
    if (p.hp <= 0) { p.hp = 0; p.st = 1; p.bleed = 30; p.downs++; p.rev = 0; p.revBy = null; emit(['dn', p.id]); }
  };

  S.shoot = (id, w, hits) => {
    const p = S.players.get(id);
    const W = WEAPONS[w];
    if (!p || p.st !== 0 || !W || !Array.isArray(hits)) return;
    let n = 0;
    for (const h of hits) {
      if (!Array.isArray(h) || n++ > 24) break;
      const z = S.zs.get(h[0]);
      if (!z) continue;
      const d = Math.hypot(z.x - p.x, z.z - p.z);
      if (d > W.rng + 4) continue;
      const dmg = hitDamage(w, z.k, !!h[1], d);
      if (p.budget < dmg * 0.5) break;
      p.budget -= dmg;
      if (!hurtZ(z, dmg, id, !!h[1], 'g') && W.pel > 1 && d < 6) { z.stun = Math.max(z.stun, 0.18); }
    }
  };
  S.melee = (id, k) => {
    const p = S.players.get(id), M = MELEE[k];
    if (!p || !M || p.st !== 0 || p.mcd > 0) return;
    p.mcd = 1 / M.rate * 0.85;
    const fx = Math.sin(p.yaw), fz = Math.cos(p.yaw);
    for (const z of [...S.zs.values()]) {
      const dx = z.x - p.x, dz = z.z - p.z, d = Math.hypot(dx, dz);
      if (d > M.rng + z.r || !near(z, p)) continue;
      const dot = (dx * fx + dz * fz) / Math.max(0.01, d);
      if (d > 0.8 && dot < Math.cos(M.arc / 2)) continue;
      if (!hurtZ(z, M.dmg, id, false, 'm')) { const k2 = M.push / Math.max(0.5, d); const c = collide(z.x + dx * k2 * 0.4, z.z + dz * k2 * 0.4, z.r, z.lv); z.x = c[0]; z.z = c[1]; z.stun = 0.35; }
    }
    emit(['m', id, k]);
  };
  S.throwAt = (id, k, tx, tz) => {
    const p = S.players.get(id), T = THROW[k];
    if (!p || !T || p.st !== 0 || p.tcd > 0 || !Number.isFinite(tx) || !Number.isFinite(tz)) return;
    let dx = tx - p.x, dz = tz - p.z;
    const d = Math.hypot(dx, dz);
    if (d > 26) { dx *= 26 / d; dz *= 26 / d; }
    p.tcd = 1.2;
    let x = p.x + dx, z = p.z + dz;
    const py = entY(p) + 1.5, lv0 = p.lv | 0;
    const ty = (xx, zz) => { const h = houseY(xx, zz, lvOk(xx, zz, lv0) ? lv0 : 0); return (h == null ? 0 : h) + 0.4; };
    if (rayBlocked(p.x, p.z, x, z, py, ty(x, z))) { for (let k = 10; k > 0; k--) { const xx = p.x + dx * k / 10, zz = p.z + dz * k / 10; if (!rayBlocked(p.x, p.z, xx, zz, py, ty(xx, zz))) { x = xx; z = zz; break; } if (k === 1) { x = p.x + dx * 0.05; z = p.z + dz * 0.05; } } }
    const lv = lvOk(x, z, lv0) ? lv0 : 0;
    const c = collide(x, z, 0.3, lv); x = c[0]; z = c[1];
    S.nades.push({ k, x, z, lv, t: k === 'grenade' ? T.fuse : 0.9, by: id });
    emit(['th', id, k, Math.round(x * 10), Math.round(z * 10), lv]);
  };

  const flowDir = (x, z, lv, F) => geometry().nav.dir(F || S.flow, x, z, lv | 0);
  const solveFlow = () => {
    const N = geometry().nav;
    const zs = [], hs = [];
    for (const p of S.players.values()) { if (p.st === 0) zs.push(p); if (!p.bot && p.st !== 2) hs.push(p); }
    let fine = false;
    for (const p of S.players.values()) if (N.inFine(p.x, p.z, 8)) { fine = true; break; }
    if (!fine) for (const z of S.zs.values()) if (N.inFine(z.x, z.z, 8)) { fine = true; break; }
    S.flow = N.solve(zs, fine);
    S.bflow = N.solve(hs, fine);
  };

  const spawnZombie = () => {
    const al = alivePlayers();
    if (!al.length) return false;
    let pick = null, inside = false;
    if (S.wave >= 2 && R() < 0.2) {
      for (let tries = 0; tries < 6 && !pick; tries++) {
        const s = HOUSE_SPAWNS[(R() * HOUSE_SPAWNS.length) | 0];
        let nd = 1e9;
        for (const p of al) nd = Math.min(nd, Math.hypot(p.x - s[0], p.z - s[1]) + ((p.lv | 0) === s[2] ? 0 : 6));
        if (nd > 10) { pick = s; inside = true; }
      }
    }
    for (let tries = 0; tries < 10 && !pick; tries++) {
      const s = SPAWNS[(R() * SPAWNS.length) | 0];
      let nd = 1e9;
      for (const p of al) nd = Math.min(nd, Math.hypot(p.x - s[0], p.z - s[1]));
      if (nd > 24 || tries > 7) pick = s;
    }
    const w = S.wave;
    const r = R();
    let k = 'walker';
    const tbl = [['bloater', 4, 0.07], ['spitter', 6, 0.06], ['screamer', 4, 0.05], ['riot', 5, 0.08], ['runner', 3, 0.18], ['crawler', 2, 0.08], ['worker', 2, 0.2]];
    let acc = 0;
    for (const [kk, w0, pr] of tbl) { if (w < w0) continue; acc += pr * Math.min(1.4, 1 + (w - w0) * 0.04); if (r < acc) { k = kk; break; } }
    if (S.bruteLeft > 0 && S.left <= S.bruteAt) { k = 'brute'; S.bruteLeft--; S.bruteAt = Math.floor(S.left * 0.5); }
    const T = ZT[k];
    const jit = inside ? 0.5 : 6, zlv = inside ? pick[2] : 0;
    const c = collide(pick[0] + (R() - 0.5) * jit, pick[1] + (R() - 0.5) * jit, T.r, zlv);
    const hpK = 1 + Math.max(0, w - 5) * 0.06;
    const z = { id: S.nid++, k, x: c[0], z: c[1], lv: zlv, yaw: R() * 6.28, hp: T.hp * hpK, max: T.hp * hpK, r: T.r, cd: 0, tg: null, tgT: 0, st: 0, slow: 0, stun: 0, burn: 0, rage: 0, los: false, losT: 0, stuckT: 0, unstick: 0, side: 1, sp: T.spd * (0.88 + R() * 0.24) * (1 + Math.min(0.3, w * 0.012)) };
    S.zs.set(z.id, z);
    return true;
  };

  const startWave = () => {
    S.wave++;
    S.ph = 'fight';
    const n = Math.max(1, alivePlayers().length);
    S.left = waveSize(S.wave, n);
    S.bruteLeft = S.wave % 5 === 0 ? Math.floor(S.wave / 5) + (n > 8 ? Math.floor(n / 8) : 0) : S.wave > 6 && R() < 0.3 ? 1 : 0;
    S.bruteAt = Math.floor(S.left * 0.6);
    S.spawnT = 0.5;
    emit(['w', S.wave]);
  };
  const endWave = () => {
    S.dropLeft();
    S.ph = 'break';
    S.tl = 18;
    S.best = Math.max(S.best, S.wave);
    for (const p of S.players.values()) {
      if (p.st === 2) { const [x, z] = spawnAt((R() * 8) | 0); p.x = x; p.z = z; p.lv = 0; p.st = 0; p.hp = 100; if (p.pet) { p.pet.x = x + 0.8; p.pet.z = z; p.pet.lv = 0; } emit(['rs', p.id]); }
      else if (p.st === 1) { p.st = 0; p.hp = 50; emit(['rv', p.id, '']); }
      else p.hp = Math.min(100, p.hp + 35);
      p.pts += 25 * S.wave;
    }
    emit(['wc', S.wave]);
  };
  const gameOver = () => {
    S.ph = 'over';
    S.tl = 9;
    S.best = Math.max(S.best, S.wave);
    emit(['go', S.wave]);
  };
  const reset = () => {
    S.dropLeft();
    S.zs.clear(); S.fires = []; S.nades = []; S.spits = []; S.acid = []; S.wave = 0; S.ph = 'break'; S.tl = 10;
    let i = 0;
    for (const p of S.players.values()) { const [x, z] = spawnAt(i++); Object.assign(p, { x, z, lv: 0, hp: 100, st: 0, bleed: 0, rev: 0, revBy: null, kills: 0, pts: 0, downs: 0 }); if (p.pet) Object.assign(p.pet, { x: x + 0.8, z, lv: 0 }); }
    emit(['rs', '*']);
  };

  const nearestZ = (x, z, maxD, from) => { let best = null, bd = maxD; for (const q of S.zs.values()) { const d = Math.hypot(q.x - x, q.z - z); if (d < bd && (!from || near(q, from, 1.6))) { bd = d; best = q; } } return [best, bd]; };
  const steer = (b, tx, tz, sp, dt, tlv) => {
    const dx = tx - b.x, dz = tz - b.z, L = Math.hypot(dx, dz);
    let wx = 0, wz = 0;
    if (L > 0.05) {
      const blocked = (tlv != null && (tlv | 0) !== (b.lv | 0)) || ((L > 7 || inHouse(b.x, b.z, 2) || inHouse(tx, tz, 2)) && rayBlocked(b.x, b.z, tx, tz, entY(b) + 1, (houseY(tx, tz, tlv | 0) || 0) + 1));
      const f = blocked ? flowTo(b.x, b.z, b.lv, S.bflow || S.flow) : null;
      const ux = f ? f[0] : dx / L, uz = f ? f[1] : dz / L, k = f ? 1 : Math.min(1, L / 1.2);
      wx = ux * sp * k; wz = uz * sp * k;
    }
    const a = Math.min(1, dt * 7);
    b.vx += (wx - b.vx) * a; b.vz += (wz - b.vz) * a;
  };
  const flowTo = (x, z, lv, F) => { const f = flowDir(x, z, lv, F); if (!f) return null; const l = Math.hypot(f[0], f[1]) || 1; return [f[0] / l, f[1] / l]; };
  const botThink = (b, dt) => {
    if (b.st !== 0) { b.vx = 0; b.vz = 0; return; }
    const W = WEAPONS[b.w] || WEAPONS.rifle;
    b.fcd = Math.max(0, (b.fcd || 0) - dt);
    if (b.rl > 0) { b.rl -= dt; if (b.rl <= 0) b.mag = W.mag; }
    let [nearZ, nd] = nearestZ(b.x, b.z, 1e9, b);
    if (!nearZ || nd > W.rng * 0.85) { const [alt, ad] = nearestZ(b.x, b.z, W.rng * 0.85); if (alt && sees(b, alt, 1.4, 1.0)) { nearZ = alt; nd = ad; } }
    let lead = null, ld = 1e9;
    for (const p of S.players.values()) if (!p.bot && !p.ctl && p !== b && p.st === 0) { const d = Math.hypot(p.x - b.x, p.z - b.z); if (d < ld) { ld = d; lead = p; } }
    let downed = null, dd = 1e9;
    for (const p of S.players.values()) if (p.st === 1 && p !== b) { const d = Math.hypot(p.x - b.x, p.z - b.z); if (d < 26 && d < dd) { dd = d; downed = p; } }
    b.revT = null;
    let tx = b.x, tz = b.z, sp = 0, tlv = null;
    if (downed && (!nearZ || nd > 4.5)) {
      if (dd > 1.3) { tx = downed.x; tz = downed.z; sp = 4.6; tlv = downed.lv | 0; } else b.revT = downed.id;
    } else if (nearZ && nd < 4.2) {
      const ax = b.x - nearZ.x, az = b.z - nearZ.z, al = Math.hypot(ax, az) || 1;
      tx = b.x + (ax / al) * 3; tz = b.z + (az / al) * 3; sp = 3.2;
    } else if (lead) {
      const ang = lead.yaw + Math.PI + ((b.slot % 4) - 1.5) * 0.7;
      const rad = 2.6 + (b.slot % 2) * 1.1;
      const fx = lead.x + Math.sin(ang) * rad, fz = lead.z + Math.cos(ang) * rad;
      const gd = Math.hypot(fx - b.x, fz - b.z);
      if (gd > 1.1) { tx = fx; tz = fz; sp = gd > 6 ? 5.0 : gd > 2.5 ? 3.4 : 1.8; tlv = lead.lv | 0; }
      if ((lead.lv | 0) !== (b.lv | 0) || (inHouse(lead.x, lead.z) && rayBlocked(b.x, b.z, lead.x, lead.z, entY(b) + 1, entY(lead) + 1))) { tx = lead.x; tz = lead.z; sp = gd > 4 ? 5.0 : 3.4; tlv = lead.lv | 0; }
    } else if (nearZ && nd > W.rng * 0.7) { tx = nearZ.x; tz = nearZ.z; sp = 2.6; }
    if (lead && sp < 3.4) {
      const fx = Math.sin(lead.yaw), fz = Math.cos(lead.yaw), dx = b.x - lead.x, dz = b.z - lead.z, d = Math.hypot(dx, dz);
      const fwd = (dx * fx + dz * fz) / Math.max(d, 1e-3);
      if (d < 9 && fwd > 0.75) { const side = (dx * fz - dz * fx) >= 0 ? 1 : -1; tx = b.x + fz * side * 2.5 - fx * 1.5; tz = b.z - fx * side * 2.5 - fz * 1.5; sp = 3.4; }
    }
    steer(b, tx, tz, sp, dt, tlv);
    for (const q of S.players.values()) {
      if (q === b || q.st === 2) continue;
      const ox = b.x - q.x, oz = b.z - q.z, od = Math.hypot(ox, oz);
      if ((q.lv | 0) !== (b.lv | 0)) continue;
      if (od < 0.95 && od > 1e-4) { const k = (0.95 - od) / od * (q.bot ? 2.5 : 4); b.vx += ox * k * dt * 6; b.vz += oz * k * dt * 6; }
      else if (od <= 1e-4) { b.vx += 1; }
    }
    const ox0 = b.x, oz0 = b.z;
    moveTo(b, b.x + b.vx * dt, b.z + b.vz * dt, 0.38);
    const mvd = Math.hypot(b.x - ox0, b.z - oz0);
    b.mv = mvd / Math.max(dt, 1e-3) > 0.4 ? 1 : 0;
    if (b.mv && (!nearZ || nd > W.rng)) { const want = Math.atan2(b.vx, b.vz); let dy = want - b.yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2; b.yaw += dy * Math.min(1, dt * 6); }
    else if (!nearZ || nd > W.rng) { b.lookT = (b.lookT || 0) - dt; if (b.lookT <= 0) { b.lookT = 2 + R() * 3; b.lookY = (lead ? lead.yaw : b.yaw) + (R() - 0.5) * 2.4; } let dy = b.lookY - b.yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2; b.yaw += dy * Math.min(1, dt * 2); }
    b.aim = 0;
    if (nearZ && nd < W.rng * 0.85) {
      const want = Math.atan2(nearZ.x - b.x, nearZ.z - b.z);
      let dy = want - b.yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
      b.yaw += dy * Math.min(1, dt * 10);
      b.fl = 8;
      if (Math.abs(dy) < 0.25 && b.fcd <= 0 && b.rl <= 0 && sees(b, nearZ, 1.4, 1.0)) {
        b.fcd = 1 / W.rate * (W.auto ? 2.0 : 1.4);
        b.mag = (b.mag == null ? W.mag : b.mag) - 1;
        if (b.mag <= 0) b.rl = W.rel;
        const acc = W.bot * 0.8 * (1 - (nd / W.rng) * 0.4) * (ZT[nearZ.k].low ? 0.7 : 1);
        const hits = [];
        for (let k = 0; k < W.pel; k++) if (R() < acc) hits.push([nearZ.id, R() < 0.14 ? 1 : 0]);
        emit(['bs', b.id, nearZ.id]);
        b.budget = 1e6;
        S.shoot(b.id, b.w, hits);
      }
    } else b.fl = 0;
  };

  const petThink = (p, dt) => {
    const P = p.pet;
    if (!P) return;
    if (p.st === 2) { P.st = 0; P.tg = null; }
    P.cd = Math.max(0, P.cd - dt); P.rest = Math.max(0, P.rest - dt); P.leap = Math.max(0, P.leap - dt);
    let tg = P.tg ? S.zs.get(P.tg) : null;
    if (!tg && P.rest <= 0 && p.st !== 2) {
      const [z, d] = nearestZ(p.x, p.z, 11, P);
      if (z && d < 11) { tg = z; P.tg = z.id; P.bites = 0; P.leap = 0; }
    }
    if (tg && (P.rest > 0 || Math.hypot(tg.x - p.x, tg.z - p.z) > 16 || !near(tg, P, 1.6) || ((P.seeT = (P.seeT || 0) - dt) <= 0 && ((P.seeT = 0.4), !sees(P, tg, 0.5, 0.8))))) { tg = null; P.tg = null; }
    let tx, tz, sp;
    if (tg) {
      const d = Math.hypot(tg.x - P.x, tg.z - P.z);
      tx = tg.x; tz = tg.z; sp = 6.6;
      P.st = 1;
      if (d < tg.r + 0.75 && near(tg, P)) {
        sp = 0; P.st = 2;
        P.yaw = Math.atan2(tg.x - P.x, tg.z - P.z);
        if (P.cd <= 0) {
          const first = P.bites === 0;
          const dmg = (first ? 55 : 26) * (1 + Math.min(1.2, S.wave * 0.05));
          P.cd = 0.75; P.bites++;
          if (first) { tg.stun = Math.max(tg.stun, 1.1); P.leap = 0.35; }
          else tg.stun = Math.max(tg.stun, 0.25);
          const killed = hurtZ(tg, dmg, p.id, false, 'p');
          emit(['pz', p.id, tg.id, first ? 1 : 0]);
          if (killed || P.bites >= 5) { P.tg = null; P.rest = 5 + R() * 3; P.st = 3; }
        }
      }
    } else {
      const ang = p.yaw + Math.PI * 0.75;
      tx = p.x + Math.sin(ang) * 1.4; tz = p.z + Math.cos(ang) * 1.4;
      const d = Math.hypot(tx - P.x, tz - P.z);
      sp = d > 6 ? 6 : d > 1.2 ? 3.4 : 0;
      P.st = P.rest > 0 ? 3 : 0;
      if (d > 30 || (d > 8 && (P.lv | 0) !== (p.lv | 0) && !inHouse(P.x, P.z))) { P.x = p.x; P.z = p.z; P.lv = p.lv | 0; }
    }
    let mx = 0, mz = 0;
    if (sp > 0) { const dx = tx - P.x, dz = tz - P.z, L = Math.hypot(dx, dz) || 1; const tl = tg ? tg.lv | 0 : p.lv | 0; const f = !tg && (tl !== (P.lv | 0) || ((L > 6 || inHouse(P.x, P.z, 2)) && rayBlocked(P.x, P.z, tx, tz, entY(P) + 0.5, (houseY(tx, tz, tl) || 0) + 0.5))) ? flowTo(P.x, P.z, P.lv, S.bflow || S.flow) : null; mx = (f ? f[0] : dx / L) * sp * dt; mz = (f ? f[1] : dz / L) * sp * dt; if (!f && L < sp * dt) { mx = dx; mz = dz; } }
    const px0 = P.x, pz0 = P.z;
    moveTo(P, P.x + mx, P.z + mz, 0.3);
    P.mv = Math.hypot(P.x - px0, P.z - pz0) / Math.max(dt, 1e-3);
    if (P.mv > 0.3) P.yaw = Math.atan2(mx, mz);
  };

  S.step = (dt) => {
    S.t += dt;
    for (const p of S.players.values()) {
      const cap = wcap(p.w);
      p.budget = Math.min(cap * 1.8, p.budget + dt * cap);
      p.mcd = Math.max(0, p.mcd - dt);
      p.tcd = Math.max(0, p.tcd - dt);
      if (p.bot || p.ctl) botThink(p, dt);
      if (p.ctl && !p.left && S.t - p.away > 30) { p.left = 1; emit(['px', p.id]); }
      if (p.pet) petThink(p, dt);
    }
    for (const p of S.players.values()) {
      if (p.st !== 1) continue;
      const helper = [...S.players.values()].find((q) => q.st === 0 && q.revT === p.id && Math.hypot(q.x - p.x, q.z - p.z) < 2.2);
      if (helper) {
        if (p.revBy !== helper.id) { p.revBy = helper.id; p.rev = 0; }
        p.rev += dt / 3;
        if (p.rev >= 1) { p.st = 0; p.hp = 40; p.rev = 0; p.revBy = null; helper.pts += 60; emit(['rv', p.id, helper.id]); }
      } else { p.revBy = null; p.rev = Math.max(0, p.rev - dt); p.bleed -= dt; if (p.bleed <= 0) { p.st = 2; emit(['dd', p.id]); } }
    }
    S.flowT -= dt;
    if (S.flowT <= 0) { solveFlow(); S.flowT = 0.45; }
    const al = alivePlayers();
    const cells = new Map();
    for (const z of S.zs.values()) { const key = (Math.floor(z.x / 2) * 4099 + Math.floor(z.z / 2)) | 0; let a = cells.get(key); if (!a) cells.set(key, (a = [])); a.push(z); }
    for (const z of S.zs.values()) {
      const T = ZT[z.k];
      z.cd = Math.max(0, z.cd - dt);
      z.rage = Math.max(0, (z.rage || 0) - dt);
      if (z.scr > 0) { z.scr -= dt; if (z.scr > 0) continue; }
      if (z.stun > 0) { z.stun -= dt; continue; }
      z.tgT -= dt;
      let tg = z.tg ? S.players.get(z.tg) : null;
      if (!tg || tg.st !== 0 || z.tgT <= 0) {
        tg = null; let best = 1e9;
        for (const p of al) { const d = Math.hypot(p.x - z.x, p.z - z.z); if (d < best) { best = d; tg = p; } }
        z.tg = tg ? tg.id : null; z.tgT = 0.6 + R() * 0.4;
      }
      let dx = 0, dz = 0, dist = 1e9;
      if (tg) {
        dx = tg.x - z.x; dz = tg.z - z.z; dist = Math.hypot(dx, dz);
        z.losT = (z.losT || 0) - dt;
        if (z.losT <= 0) { z.los = dist < 14 ? (tg.lv | 0) === (z.lv | 0) && sees(z, tg, 1.4, 1.2) : false; z.losT = 0.3 + R() * 0.2; }
        if (dist > 7 || !z.los || z.unstick > 0) { const f = flowDir(z.x, z.z, z.lv); if (f) { dx = f[0]; dz = f[1]; } }
      }
      if (T.scream && tg && dist < 18 && (z.scrCd || 0) <= S.t) {
        z.scrCd = S.t + 9 + R() * 5; z.scr = 1.5;
        for (const q of S.zs.values()) if (q !== z && Math.hypot(q.x - z.x, q.z - z.z) < 15) q.rage = 7;
        emit(['sc', z.id]);
        continue;
      }
      if (T.spit && tg && dist < 15 && dist > 3 && (z.spCd || 0) <= S.t && z.los) {
        z.spCd = S.t + 3.4 + R() * 1.6;
        const lead = 0.6;
        const ax = tg.x + (tg.vx || 0) * lead, az = tg.z + (tg.vz || 0) * lead;
        S.spits.push({ x: ax, z: az, lv: tg.lv | 0, t: 0.85 });
        z.yaw = Math.atan2(tg.x - z.x, tg.z - z.z);
        z.stun = 0.7;
        emit(['sp', z.id, Math.round(ax * 10), Math.round(az * 10)]);
        continue;
      }
      if (T.spit && tg && dist < 7 && z.los) { dx = -dx; dz = -dz; }
      const reach = T.r + 0.75;
      z.st = 0;
      if (tg && dist < reach + 0.15 && near(z, tg)) {
        z.st = 1;
        z.yaw = Math.atan2(tg.x - z.x, tg.z - z.z);
        if (z.cd <= 0) { z.cd = T.cd * (z.rage > 0 ? 0.75 : 1); hurtP(tg, T.dmg * (z.rage > 0 ? 1.25 : 1)); emit(['zh', z.id, tg.id]); }
        z.stuckT = 0;
        continue;
      }
      const L = Math.hypot(dx, dz);
      if (L < 1e-3) continue;
      let sx = 0, sz = 0;
      const ci = Math.floor(z.x / 2), cj = Math.floor(z.z / 2);
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
        const arr = cells.get(((ci + a) * 4099 + (cj + b)) | 0);
        if (!arr) continue;
        for (const o of arr) { if (o === z || (o.lv | 0) !== (z.lv | 0)) continue; const ox = z.x - o.x, oz = z.z - o.z, od = Math.hypot(ox, oz), min = z.r + o.r; if (od < min && od > 1e-4) { const k = (min - od) / od; sx += ox * k; sz += oz * k; } }
      }
      const sp = z.sp * (z.slow > 0 ? 0.55 : 1) * (z.rage > 0 ? 1.45 : 1);
      z.slow = Math.max(0, z.slow - dt);
      let ux = dx / L, uz = dz / L;
      if (z.unstick > 0) { z.unstick -= dt; const px = -uz * z.side, pz = ux * z.side; ux = ux * 0.4 + px * 0.9; uz = uz * 0.4 + pz * 0.9; }
      const vx = ux * sp * dt + sx * 0.5, vz = uz * sp * dt + sz * 0.5;
      const ox = z.x, oz = z.z;
      moveTo(z, z.x + vx, z.z + vz, z.r);
      const moved = Math.hypot(z.x - ox, z.z - oz);
      z.prog = (z.prog || 0) * (1 - dt * 0.8) + moved;
      z.stuckT = moved < sp * dt * 0.25 ? (z.stuckT || 0) + dt : Math.max(0, (z.stuckT || 0) - dt * 2);
      if (z.stuckT > 1.2 && !(z.unstick > 0)) { z.unstick = 0.9 + R() * 0.6; z.side = R() < 0.5 ? -1 : 1; z.stuckT = 0.4; z.stuckN = (z.stuckN || 0) + 1; }
      if (z.stuckN > 5 && dist > 16) { const s0 = SPAWNS[(R() * SPAWNS.length) | 0]; const cc = collide(s0[0], s0[1], z.r, 0); z.x = cc[0]; z.z = cc[1]; z.lv = 0; z.stuckN = 0; z.stuckT = 0; }
      if (moved > sp * dt * 0.6) z.stuckN = Math.max(0, (z.stuckN || 0) - dt * 0.5);
      const want = Math.atan2(ux, uz);
      let dy = want - z.yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
      z.yaw += dy * Math.min(1, dt * 6);
    }
    for (let i = S.spits.length - 1; i >= 0; i--) {
      const q = S.spits[i];
      q.t -= dt;
      if (q.t > 0) continue;
      S.spits.splice(i, 1);
      S.acid.push({ x: q.x, z: q.z, lv: q.lv | 0, life: ACID.life });
    }
    for (let i = S.acid.length - 1; i >= 0; i--) {
      const a = S.acid[i];
      a.life -= dt;
      if (a.life <= 0) { S.acid.splice(i, 1); continue; }
      for (const p of S.players.values()) if (p.st === 0 && Math.hypot(p.x - a.x, p.z - a.z) < ACID.r && near(p, a, 1.6)) { p.acidT = (p.acidT || 0) + dt; if (p.acidT > 0.5) { p.acidT = 0; hurtP(p, ACID.dps * 0.5); emit(['ah', p.id]); } }
    }
    for (let i = S.nades.length - 1; i >= 0; i--) {
      const n = S.nades[i];
      n.t -= dt;
      if (n.t > 0) continue;
      S.nades.splice(i, 1);
      if (n.k === 'grenade') blast(n.x, n.z, THROW.grenade.r, THROW.grenade.dmg, n.by, 'g', n.lv);
      else { S.fires.push({ x: n.x, z: n.z, lv: n.lv | 0, r: THROW.molotov.r, life: THROW.molotov.life, by: n.by }); emit(['fi', Math.round(n.x * 10), Math.round(n.z * 10), Math.round(THROW.molotov.r * 10), THROW.molotov.life, n.lv | 0]); }
    }
    for (let i = S.fires.length - 1; i >= 0; i--) {
      const f = S.fires[i];
      f.life -= dt;
      if (f.life <= 0) { S.fires.splice(i, 1); continue; }
      for (const z of [...S.zs.values()]) if (Math.hypot(z.x - f.x, z.z - f.z) < f.r + z.r * 0.5 && near(z, f, 1.6)) { z.slow = 0.4; hurtZ(z, THROW.molotov.dps * dt, f.by, false, 'f'); }
    }
    if (S.ph === 'break') {
      S.tl -= dt;
      if (S.tl <= 0 && al.length) startWave();
    } else if (S.ph === 'fight') {
      if (!al.length && S.players.size) { gameOver(); return; }
      S.spawnT -= dt;
      if (S.left > 0 && S.spawnT <= 0 && S.zs.size < S.maxAlive) {
        const burst = Math.min(S.left, 1 + ((R() * 3) | 0));
        for (let k = 0; k < burst; k++) if (spawnZombie()) S.left--;
        S.spawnT = Math.max(0.25, 1.1 - S.wave * 0.05);
      }
      if (S.left <= 0 && S.zs.size === 0) endWave();
    } else if (S.ph === 'over') {
      S.tl -= dt;
      if (S.tl <= 0) reset();
    }
  };

  S.snap = (vx, vz, rad = 80) => {
    const z = [];
    for (const q of S.zs.values()) {
      if (vx != null && (Math.abs(q.x - vx) > rad || Math.abs(q.z - vz) > rad)) continue;
      z.push(q.id, ZKEYS.indexOf(q.k), Math.round(q.x * 10), Math.round(q.z * 10), Math.round(q.yaw * 100), Math.max(1, Math.round((q.hp / q.max) * 100)), (q.st ? 1 : 0) | (q.slow > 0 ? 2 : 0) | (q.scr > 0 ? 4 : 0) | (q.stun > 0 ? 8 : 0) | (q.rage > 0 ? 16 : 0) | (q.lv ? 32 : 0));
    }
    const p = [];
    for (const q of S.players.values()) {
      const P = q.pet;
      p.push([q.id, Math.round(q.x * 10), Math.round(q.z * 10), Math.round(q.yaw * 100), Math.round(q.aim * 100), q.w, Math.round(q.hp), q.st, Math.round(q.rev * 100), (q.fl & 63) | (q.mv ? 1 : 0) | (q.revT ? 4 : 0) | (q.lv ? 64 : 0), q.kills, q.pts, P ? Math.round(P.x * 10) : 0, P ? Math.round(P.z * 10) : 0, P ? Math.round(P.yaw * 100) : 0, P ? P.st : -1, P && P.lv ? 1 : 0]);
    }
    const ac = S.acid.length ? S.acid.map((a) => [Math.round(a.x * 10), Math.round(a.z * 10), Math.round(a.life * 10), a.lv | 0]) : undefined;
    return { w: S.wave, ph: PH[S.ph], tl: Math.ceil(Math.max(0, S.tl)), zl: S.left + S.zs.size, z, p, ac };
  };
  S.navDir = (x, z, lv) => flowDir(x, z, lv);
  S.__nav = () => geometry().nav;
  S.roster = () => [...S.players.values()].map((q) => [q.id, q.n, q.sv, q.col, q.bot ? 1 : 0, q.pk || '', q.left ? 2 : q.away != null ? 1 : 0]);
  S.takeEvents = () => { const e = S.ev; S.ev = []; return e; };
  return S;
}
