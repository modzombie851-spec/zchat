import * as E from './siegeengine.js';

const { TILE, clamp, C_FLOOR, C_WALL, C_BUSH, C_RIVER, C_LANE, C_BASE } = E;
export const N = 56;
const MIR = (p) => [N - p[0], N - p[1]];
const WU = (p) => ({ x: p[0] * TILE, z: p[1] * TILE });
export const TEAM_COL = ['#3D8BFF', '#FF4D5E'];
export const TEAM_NAME = ['Blue team', 'Red team'];
export const LANE_NAME = ['Top', 'Mid', 'Bottom'];

const LANES = [
  [[8.5, 47.5], [5.5, 42], [5.5, 9.5], [9.5, 5.5], [42, 5.5], [47.5, 8.5]],
  [[8.5, 47.5], [12, 44], [44, 12], [47.5, 8.5]],
  [[8.5, 47.5], [14, 50.5], [46.5, 50.5], [50.5, 46.5], [50.5, 14], [47.5, 8.5]],
];
const TOWERS = [
  { ln: 0, tier: 0, p: [4.15, 18] }, { ln: 0, tier: 1, p: [4.15, 31] },
  { ln: 1, tier: 0, p: [24.95, 32.95] }, { ln: 1, tier: 1, p: [17.95, 39.95] },
  { ln: 2, tier: 0, p: [38, 51.85] }, { ln: 2, tier: 1, p: [25, 51.85] },
];
const GUARD = [10.3, 43.3];
const CORE = [8.2, 47.8];
const FOUNT = [3.6, 52.4];
export const FOUNT_R = 7.2;
const PADS = [{ ln: 0, p: [2.6, 47.2] }, { ln: 1, p: [6.2, 51.2] }, { ln: 2, p: [8.8, 53.4] }];
const CAMPS = [
  { k: 'fury', p: [12.5, 30], units: [['tank', 0, 0]], buff: 'fury', resp: 90 },
  { k: 'pair', p: [18.5, 26], units: [['grunt', -0.7, 0], ['grunt', 0.7, 0.4]], resp: 60 },
  { k: 'flow', p: [30, 43.5], units: [['tank', 0, 0]], buff: 'flow', resp: 90 },
  { k: 'spit', p: [37.5, 45.2], units: [['shooter', -0.7, 0], ['shooter', 0.7, 0.4]], resp: 60 },
];
const RIVER_CAMP = { k: 'river', p: [39.5, 39.5], units: [['tank', 0, 0], ['grunt', -1.6, 1], ['grunt', 1.6, -1]], resp: 120, team: true };
export const SHIP_PIT = [16.5, 16.5];
const RIVER_PORTALS = [[10.2, 10.2], [45.8, 45.8]];
const WALLS = [
  [8, 11, 2, 5], [8, 21, 2, 3], [11, 15, 3, 2], [13, 20, 2, 3], [9, 35, 3, 2], [8, 38, 2, 4], [15, 31, 2, 3], [16, 35, 3, 2],
  [20, 22, 2, 2], [22, 27, 3, 2], [17, 19, 2, 2], [11, 25, 2, 2], [14, 41, 2, 2],
  [13, 47, 2, 2], [19, 46, 3, 2], [24, 44, 2, 3], [27, 39, 2, 2], [33, 40, 2, 3], [35, 36, 3, 2], [41, 45, 4, 2], [44, 41, 2, 2], [29, 47, 3, 2], [40, 41, 2, 2],
  [21, 42, 2, 2], [36, 47, 2, 1],
];
const BUSH = [
  [7, 14, 1, 3], [7, 26, 1, 3], [12, 34, 2, 1], [18, 30, 2, 2], [23, 24, 2, 1], [14, 23, 1, 2],
  [16, 49, 3, 1], [33, 49, 3, 1], [27, 42, 2, 1], [31, 37, 2, 2], [36, 43, 1, 2], [43, 48, 2, 1],
  [19, 20, 2, 1], [12, 18, 1, 2], [26, 33, 1, 2], [21, 36, 2, 1], [32, 29, 2, 1],
];

const segDist = (x, z, a, b) => { const ux = b[0] - a[0], uz = b[1] - a[1], L2 = ux * ux + uz * uz || 1; const t = clamp(((x - a[0]) * ux + (z - a[1]) * uz) / L2, 0, 1); return Math.hypot(x - a[0] - ux * t, z - a[1] - uz * t); };
const lineDist = (x, z, P) => { let d = 1e9; for (let i = 0; i < P.length - 1; i++) d = Math.min(d, segDist(x, z, P[i], P[i + 1])); return d; };

export function laneFor(tm, ln) { const P = LANES[ln].map((p) => WU(p)); return tm === 0 ? P : P.slice().reverse(); }

export function buildRift() {
  const cells = new Uint8Array(N * N).fill(C_FLOOR);
  const at = (c, r) => (c < 0 || r < 0 || c >= N || r >= N ? C_WALL : cells[r * N + c]);
  const put = (c, r, v) => { if (c >= 0 && r >= 0 && c < N && r < N) cells[r * N + c] = v; };
  const putM = (c, r, v) => { put(c, r, v); put(N - 1 - c, N - 1 - r, v); };
  const rect = (L, v) => { for (const [c0, r0, w, h] of L) for (let r = r0; r < r0 + h; r++) for (let c = c0; c < c0 + w; c++) putM(c, r, v); };
  for (let i = 0; i < N; i++) { put(i, 0, C_WALL); put(i, N - 1, C_WALL); put(0, i, C_WALL); put(N - 1, i, C_WALL); }
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const x = c + 0.5, z = r + 0.5;
    const edge = Math.min(x, z, N - x, N - z);
    if (edge < 2.2) put(c, r, C_WALL);
  }
  rect(WALLS, C_WALL);
  rect(BUSH, C_BUSH);
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const x = c + 0.5, z = r + 0.5;
    if (Math.abs(x - z) < 2.6 && x > 8.5 && x < N - 8.5) { if (at(c, r) !== C_WALL || Math.abs(x - z) < 1.6) put(c, r, C_RIVER); }
  }
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const x = c + 0.5, z = r + 0.5;
    let d = 1e9;
    for (const P of LANES) d = Math.min(d, lineDist(x, z, P));
    if (d < 2.3) put(c, r, at(c, r) === C_RIVER ? C_RIVER : C_LANE);
    else if (d < 2.9 && at(c, r) === C_WALL && Math.min(x, z, N - x, N - z) > 2.2) put(c, r, C_FLOOR);
  }
  const pit = (p, rad) => { for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { const d = Math.hypot(c + 0.5 - p[0], r + 0.5 - p[1]); if (d < rad) put(c, r, C_RIVER); else if (d < rad + 1.1 && at(c, r) === C_FLOOR && Math.abs(c + 0.5 - (r + 0.5)) > 3.4) put(c, r, C_WALL); } };
  pit(SHIP_PIT, 4.2);
  pit(MIR(SHIP_PIT), 3.4);
  for (const p of RIVER_PORTALS) for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (Math.hypot(c + 0.5 - p[0], r + 0.5 - p[1]) < 1.8) put(c, r, C_RIVER);
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const x = c + 0.5, z = r + 0.5;
    for (const B of [[0, N], [N, 0]]) {
      const dx = Math.abs(x - B[0]), dz = Math.abs(z - B[1]);
      if (dx < 15.5 && dz < 15.5 && Math.min(x, z, N - x, N - z) > 2.2) put(c, r, C_BASE);
      else if (dx < 17 && dz < 17 && Math.max(dx, dz) >= 15.5 && at(c, r) !== C_LANE && Math.min(x, z, N - x, N - z) > 2.2) put(c, r, C_WALL);
    }
  }
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const x = c + 0.5, z = r + 0.5;
    let d = 1e9;
    for (const P of LANES) d = Math.min(d, lineDist(x, z, P));
    if (d < 2.3 && at(c, r) === C_WALL && Math.min(x, z, N - x, N - z) > 2.2) put(c, r, C_LANE);
  }
  const pads = [], homes = [], bushes = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (cells[r * N + c] === C_BUSH) bushes.push({ c, r, x: (c + 0.5) * TILE, z: (r + 0.5) * TILE });
  const A = { key: 'rift', name: E.ARENAS.rift.name, theme: 'rift', W: N, H: N, cells, pads, homes, bushes, wx: N * TILE, wz: N * TILE, flows: new Map() };
  A.clusters = E.bushClusters(A);
  A.lanes = LANES.map((P) => P.map((p) => [p[0] * TILE, p[1] * TILE]));
  const side = (tm, p) => WU(tm === 0 ? p : MIR(p));
  const sideLn = (tm, ln) => (tm === 0 ? ln : 2 - ln);
  A.team = {
    towers: [0, 1].flatMap((tm) => TOWERS.map((t) => ({ tm, ln: sideLn(tm, t.ln), tier: t.tier, ...side(tm, t.p) }))),
    guards: [0, 1].map((tm) => ({ tm, ...side(tm, GUARD) })),
    cores: [0, 1].map((tm) => ({ tm, ...side(tm, CORE) })),
    founts: [0, 1].map((tm) => ({ tm, ...side(tm, FOUNT) })),
    pads: [0, 1].flatMap((tm) => PADS.map((q, i) => ({ tm, i, ln: sideLn(tm, q.ln), ...side(tm, q.p) }))),
    camps: [0, 1].flatMap((tm) => CAMPS.map((cp) => ({ ...cp, side: tm, key: `${cp.k}${tm}`, ...side(tm, cp.p), units: cp.units.map((u) => [u[0], tm === 0 ? u[1] : -u[1], tm === 0 ? u[2] : -u[2]]) }))).concat([{ ...RIVER_CAMP, side: -1, key: 'river', ...WU(RIVER_CAMP.p) }]),
    pit: WU(SHIP_PIT),
    portals: RIVER_PORTALS.map((p, i) => ({ i, ...WU(p) })),
  };
  return A;
}
E.ARENA_BUILD.rift = buildRift;

export const BW = 32, BH = 24;
const BCODE = { '#': E.C_WALL, r: E.C_WALL, M: E.C_WALL, G: E.C_WALL, L: E.C_WALL, Z: E.C_WALL, T: E.C_CRATE, x: E.C_CRATE, c: E.C_WATER, s: E.C_WATER, '=': C_LANE, B: C_BASE, p: C_LANE };
const BASE_RECTS = [
  ['=', 1, 8, 5, 8], ['B', 1, 9, 4, 6], ['=', 5, 11, 9, 2], ['=', 6, 5, 8, 1], ['=', 6, 18, 8, 1],
  ['p', 14, 3, 2, 4], ['p', 14, 10, 2, 4], ['p', 14, 17, 2, 4],
  ['#', 1, 1, 4, 1], ['#', 1, 2, 2, 1], ['#', 1, 3, 1, 1], ['#', 1, 22, 4, 1], ['#', 1, 21, 2, 1], ['#', 1, 20, 1, 1],
  ['#', 11, 1, 3, 1], ['#', 12, 2, 2, 1], ['#', 11, 22, 3, 1], ['#', 12, 21, 2, 1],
  ['Z', 15, 1, 1, 1], ['Z', 15, 22, 1, 1], ['L', 1, 5, 2, 2], ['L', 1, 17, 2, 2],
  ['s', 5, 2, 3, 1], ['s', 8, 4, 2, 1], ['M', 6, 7, 2, 2], ['G', 9, 7, 2, 2], ['x', 11, 8, 1, 1],
  ['T', 7, 11, 1, 2], ['x', 12, 10, 1, 1], ['x', 12, 13, 1, 1],
  ['c', 4, 20, 1, 1], ['T', 6, 20, 2, 1], ['x', 9, 20, 1, 1], ['x', 9, 21, 1, 1],
  ['M', 6, 15, 2, 2], ['M', 9, 15, 2, 2], ['x', 11, 15, 1, 1],
  ['r', 13, 6, 1, 1], ['r', 13, 17, 1, 1], ['x', 14, 8, 1, 1], ['x', 14, 15, 1, 1],
];
const BASE_CAMPS = [
  { k: 'pair', p: [9.8, 2.3], units: [['grunt', -0.7, 0], ['grunt', 0.7, 0.4]], resp: 50 },
  { k: 'spit', p: [10.5, 21.5], units: [['shooter', -0.7, 0], ['shooter', 0.7, 0.4]], resp: 50 },
  { k: 'fury', p: [4.6, 5.0], units: [['tank', 0, 0]], buff: 'fury', resp: 80 },
  { k: 'flow', p: [4.6, 19.0], units: [['tank', 0, 0]], buff: 'flow', resp: 80 },
];
export const ZONES = [{ n: 'Mine', p: [16, 5] }, { n: 'Pad', p: [16, 12] }, { n: 'Depot', p: [16, 19] }];
export const ZONE_R = 3.4;
const ZONE_ORDER = [1, 0, 2];
export function buildBase() {
  const cells = new Uint8Array(BW * BH).fill(C_FLOOR);
  const deco = new Uint8Array(BW * BH).fill(46);
  const put = (c, r, ch) => { for (const [cc, rr] of [[c, r], [BW - 1 - c, BH - 1 - r]]) { cells[rr * BW + cc] = BCODE[ch] != null ? BCODE[ch] : C_FLOOR; deco[rr * BW + cc] = ch.charCodeAt(0); } };
  for (let i = 0; i < BW; i++) put(i, 0, '#');
  for (let r = 0; r < BH; r++) put(0, r, '#');
  for (const [ch, c0, r0, w, h] of BASE_RECTS) for (let r = r0; r < r0 + h; r++) for (let c = c0; c < c0 + w; c++) put(c, r, ch);
  const A = { key: 'base', name: E.ARENAS.base.name, theme: 'base', W: BW, H: BH, cells, deco, pads: [], homes: [], bushes: [], wx: BW * TILE, wz: BH * TILE, flows: new Map() };
  A.clusters = [];
  const side = (tm, p) => WU(tm === 0 ? p : [BW - p[0], BH - p[1]]);
  A.team = {
    towers: [], guards: [], cores: [], pads: [], portals: [], fr: 6.2,
    founts: [0, 1].map((tm) => ({ tm, ...side(tm, [3, 12]) })),
    camps: [0, 1].flatMap((tm) => BASE_CAMPS.map((cp) => ({ ...cp, side: tm, key: `${cp.k}${tm}`, ...side(tm, cp.p), units: cp.units.map((u) => [u[0], tm === 0 ? u[1] : -u[1], tm === 0 ? u[2] : -u[2]]) }))),
    zones: ZONES.map((zn, i) => ({ i, n: zn.n, ...WU(zn.p) })),
  };
  return A;
}
E.ARENA_BUILD.base = buildBase;

const R = E.ROBOTS;
const STILL = E.STILL_TYPES;
export const WAVE_GAP = 30;
export const SHIP_AT = 180;
export const SHIP_RESP = 180;
export const TL_MAX = 20;
export const xpNeed = (L, pv) => (pv ? 45 + 34 * (L - 1) : 60 + 52 * (L - 1));
export const respawnFor = (h) => Math.min(25, 4 + 1.12 * ((h.tl || 1) - 1));
export const CARD_LV = new Set(Array.from({ length: TL_MAX - 1 }, (_, i) => i + 2));
export const GATE_T = 10;
export const SKILLS = {
  blink: { name: 'Warp gate', text: 'Drop a gate, then warp back to it within 10 seconds', cd: 55, icon: 'dash', col: '#7FD7FF' },
  mend: { name: 'Repair drone', text: 'A drone heals you 30% over 5 seconds. Friends near you heal too', cd: 70, icon: 'heal', col: '#6BF26B' },
  hunter: { name: 'Cutter', text: 'A beam that cuts through minions, monsters and the boss', cd: 30, icon: 'crosshair', col: '#FF8A3D' },
  guard: { name: 'Dome', text: 'Your team takes 40% less damage inside it for 4 seconds', cd: 80, icon: 'barrier', col: '#9FE6FF' },
  sprint: { name: 'Rocket boots', text: 'Run 45% faster for 4 seconds and shake off slows', cd: 60, icon: 'nitro', col: '#FFD24A' },
  shock: { name: 'Magnet', text: 'Pull enemies near you closer and slow them', cd: 75, icon: 'emp', col: '#B88CFF' },
};
export const BOT_LV = [
  { name: 'Easy', react: 0.62, jit: 0.45, lead: 0.2, err: 0.17, dodge: 0.05, strafe: 0.3, flip: 3.2, back: 0.15, kite: 0.2, dash: 0, sup: 0.4, gad: 0.4, sk: 0.45, dmg: 0.6, xp: 0.8, seen: 3.4, push: 0.6 },
  { name: 'Normal', react: 0.45, jit: 0.38, lead: 0.42, err: 0.09, dodge: 0.16, strafe: 0.55, flip: 2.6, back: 0.2, kite: 0.28, dash: 0.08, sup: 0.75, gad: 0.7, sk: 0.75, dmg: 0.8, xp: 0.92, seen: 2.6, push: 0.85 },
  { name: 'Hard', react: 0.2, jit: 0.3, lead: 0.75, err: 0.03, dodge: 0.6, strafe: 1.4, flip: 1.1, back: 0.3, kite: 0.42, dash: 0.4, sup: 1, gad: 1, sk: 1, dmg: 1, xp: 1, seen: 1.2, push: 1 },
];
const botLv = (W) => BOT_LV[W.tm && W.tm.bl != null ? W.tm.bl : 1] || BOT_LV[1];
export const SKILL_KEYS = Object.keys(SKILLS);
export const BUFFS = { fury: { name: 'Fury', text: '15% more damage', t: 80, col: '#FF8A3D' }, flow: { name: 'Flow', text: 'Super and gadget charge faster', t: 80, col: '#4FC3FF' } };
const isHero = (t) => !!t && typeof t.id === 'string';
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const mins = (W) => (W.tm ? W.tm.t / 60 : 0);

export const GM_KEYS = ['tdm', 'hp'];
export const GM_NAME = { tdm: 'Team deathmatch', hp: 'Hardpoint' };
export const TIME_LIM = 480;
export const OVER_T = 60;
export const ZONE_T = 60;
export const ZONE_WAIT = 10;
export const goalFor = (gm, size) => (gm === 'hp' ? 150 : [12, 20, 30, 40, 50][clamp(size | 0, 1, 5) - 1]);
export const respawnPvp = (h) => 4 + 0.2 * ((h.tl || 1) - 1);
export const validGm = (g) => (GM_KEYS.includes(g) ? g : 'tdm');
export function zoneNow(W) {
  const S = W.tm, Z = W.A.team && W.A.team.zones;
  if (!S || S.gm !== 'hp' || !Z) return null;
  return Z[ZONE_ORDER[S.zk % ZONE_ORDER.length]];
}
export const zoneByK = (k) => ZONES[ZONE_ORDER[Math.max(0, k | 0) % ZONE_ORDER.length]];
export function zoneNext(W) {
  const S = W.tm, Z = W.A.team && W.A.team.zones;
  if (!S || S.gm !== 'hp' || !Z) return null;
  return Z[ZONE_ORDER[(S.zk + (S.zon ? 1 : 0)) % ZONE_ORDER.length]];
}

export function setupTeamWorld(W, cfg) {
  const T = W.A.team;
  const gm = T.zones ? validGm(cfg && cfg.gm) : null;
  W.mode = 'team'; W.pvp = true;
  W.teamStep = gm ? stepPvp : stepTeam; W.onKill = onKill; W.onHit = onHit; W.onNet = onNet; W.respawnFor = gm ? respawnPvp : respawnFor;
  const bl = cfg && cfg.bl != null ? clamp(cfg.bl | 0, 0, 2) : 1;
  const size = cfg && cfg.ts ? clamp(cfg.ts | 0, 1, 5) : 3;
  W.tm = { t: 0, score: [0, 0], waveN: 0, waveT: 14, shipT: SHIP_AT, shipTeam: -1, camps: {}, dead: new Set(), kd: {}, struct: [], protT: 0, flows: new Map(), over: null, fb: false, an: [], size, bl, gm, goal: gm ? goalFor(gm, size) : 0, tlim: TIME_LIM, od: 0, zk: 0, zon: false, zt: ZONE_WAIT, zh: -1, zacc: 0 };
  W.bdm = BOT_LV[bl].dmg; W.bseen = BOT_LV[bl].seen; W.domes = []; W.domeCut = domeCut;
  if (gm) {
    W.nextId = 100;
    for (const cp of T.camps) W.tm.camps[cp.key] = { t: cp.buff ? 30 : 12, ids: [], cp };
    return;
  }
  let id = 1;
  const mk = (type, p, extra) => {
    const b = E.mkRobot(id++, type, p.x, p.z, null);
    b.tm = p.tm; b.sp = 0; Object.assign(b, extra);
    b.yaw = p.tm === 0 ? Math.PI * 0.75 : -Math.PI * 0.25;
    W.robots.push(b); W.tm.struct.push(b.id);
    return b;
  };
  for (const t of T.towers) { const b = mk('tow', t, { ln: t.ln, tier: t.tier }); b.max = b.hp = t.tier === 0 ? R.tow.hp : Math.round(R.tow.hp * 1.22); }
  for (const g of T.guards) mk('gua', g, { ln: -1 });
  for (const c of T.cores) mk('cor', c, { ln: -1 });
  W.nextId = 100;
  for (const cp of T.camps) W.tm.camps[cp.key] = { t: cp.k === 'river' ? 75 : 25, ids: [], cp };
  refreshProtect(W);
}

export function placeHero(W, h, slot) {
  const F = W.A.team.founts[h.tm];
  const a = slot * 1.9 + (h.tm === 0 ? 0.3 : 3.4);
  h.x = F.x + Math.sin(a) * (1.4 + (slot % 2) * 1.1); h.z = F.z + Math.cos(a) * (1.4 + (slot % 2) * 1.1);
  h.yaw = h.tm === 0 ? Math.PI * 0.75 : -Math.PI * 0.25;
}
export function initHero(W, h, tm, sk, slot) {
  h.tm = tm; h.sk = SKILLS[sk] ? sk : 'blink'; h.skCD = 0; h.tl = 1; h.xp = 0; h.respT = 0; h.spawnT = 3; h.buffs = {};
  placeHero(W, h, slot);
  W.tm.kd[h.id] = W.tm.kd[h.id] || { k: 0, d: 0, a: 0, st: 0, mk: 0, mkAt: -9 };
}

function refreshProtect(W) {
  const S = W.tm;
  const alive = (b) => b && b.hp > 0 && !S.dead.has(b.id);
  const L = W.robots.filter((b) => STILL.has(b.type));
  for (const b of L) {
    if (b.type === 'tow') b.inv = b.tier === 1 && L.some((o) => o.type === 'tow' && o.tm === b.tm && o.ln === b.ln && o.tier === 0 && alive(o));
    else if (b.type === 'gua') b.inv = L.filter((o) => o.type === 'tow' && o.tm === b.tm && o.tier === 1 && alive(o)).length === 3;
    else if (b.type === 'cor') b.inv = L.some((o) => o.type === 'gua' && o.tm === b.tm && alive(o));
    const near = W.robots.some((o) => o.hp > 0 && o.tm != null && o.tm >= 0 && o.tm !== b.tm && !STILL.has(o.type) && Math.hypot(o.x - b.x, o.z - b.z) < 11);
    b.dmgIn = near ? 1 : 0.4;
    b.dmgAll = (b.type === 'tow' && b.tier === 0 && W.tm.t < 240 ? 0.5 : 1) * (W.tm.t > 1080 ? 1.9 : W.tm.t > 900 ? 1.45 : 1);
  }
}

function flowTo(W, x, z) {
  const S = W.tm, A = W.A;
  const key = E.cellIdx(A, x, z);
  let F = S.flows.get(key);
  if (F) { S.flows.delete(key); S.flows.set(key, F); return F; }
  F = E.flowFrom(A, x, z);
  S.flows.set(key, F);
  if (S.flows.size > 80) S.flows.delete(S.flows.keys().next().value);
  return F;
}
function moveTo(W, b, x, z, spd, dt) {
  const clear = Math.hypot(x - b.x, z - b.z) < 3 || E.losClear(W.A, b.x, b.z, x, z, b.r * 0.9);
  E.moveRobot(W, b, x, z, spd, dt, clear ? null : flowTo(W, x, z));
}
function resolveT(W, tg) {
  if (tg == null) return null;
  if (typeof tg === 'string') { const h = W.heroes[tg]; return h && h.st === 0 ? h : null; }
  for (const b of W.robots) if (b.id === tg) return b.hp > 0 ? b : null;
  return null;
}
const foeOfUnit = (W, b, t) => !!t && (isHero(t) ? t.st === 0 && t.tm !== b.tm && E.seenBy(W, t, b.tm) : t.hp > 0 && t.tm != null && t.tm >= 0 && t.tm !== b.tm && !(t.sp > 0));

function stepTeam(W, dt) {
  const S = W.tm;
  S.t += dt;
  if (!W.host) { for (const b of W.robots) { b.flash = Math.max(0, b.flash - dt); if (b.sp > 0) b.sp -= dt; b.atkT2 = Math.max(0, (b.atkT2 || 0) - dt); } return; }
  if (S.over) return;
  S.waveT -= dt;
  if (S.waveT <= 0) { S.waveT = WAVE_GAP; spawnWave(W); }
  for (const key of Object.keys(S.camps)) {
    const C = S.camps[key];
    if (C.ids.length) { C.ids = C.ids.filter((i) => W.robots.some((b) => b.id === i && b.hp > 0)); if (!C.ids.length) C.t = C.cp.resp; continue; }
    C.t -= dt;
    if (C.t <= 0) spawnCamp(W, C);
  }
  if (S.shipTeam < 0 && !W.robots.some((b) => b.type === 'shp' && !b.ally)) {
    S.shipT -= dt;
    if (S.shipT <= 0) spawnShip(W);
  }
  for (const b of W.robots) if (b.hp > 0) stepUnit(W, b, dt);
  separateUnits(W);
  for (let i = W.robots.length - 1; i >= 0; i--) if (W.robots[i].hp <= 0) W.robots.splice(i, 1);
  S.protT -= dt;
  if (S.protT <= 0) { S.protT = 0.3; refreshProtect(W); }
}

function stepPvp(W, dt) {
  const S = W.tm;
  S.t += dt;
  if (!W.host) {
    for (const b of W.robots) { b.flash = Math.max(0, b.flash - dt); if (b.sp > 0) b.sp -= dt; b.atkT2 = Math.max(0, (b.atkT2 || 0) - dt); }
    if (S.gm === 'hp' && !S.over) S.zt = Math.max(0, S.zt - dt);
    return;
  }
  if (S.over) return;
  for (const key of Object.keys(S.camps)) {
    const C = S.camps[key];
    if (C.ids.length) { C.ids = C.ids.filter((i) => W.robots.some((b) => b.id === i && b.hp > 0)); if (!C.ids.length) C.t = C.cp.resp; continue; }
    C.t -= dt;
    if (C.t <= 0) spawnCamp(W, C);
  }
  for (const b of W.robots) if (b.hp > 0) stepUnit(W, b, dt);
  separateUnits(W);
  for (let i = W.robots.length - 1; i >= 0; i--) if (W.robots[i].hp <= 0) W.robots.splice(i, 1);
  if (S.gm === 'hp') stepZone(W, dt);
  pvpEnd(W);
}

function stepZone(W, dt) {
  const S = W.tm;
  S.zt -= dt;
  if (S.zt <= 0) {
    if (!S.zon) S.zon = true; else S.zk += 1;
    S.zt = ZONE_T; S.zh = -1; S.zacc = 0; S.zlast = -1;
    E.net(W, ['an', S.zk === 0 ? 'zone' : 'zmove', S.zk]); E.emit(W, { k: 'tan', a: S.zk === 0 ? 'zone' : 'zmove', b: S.zk });
  }
  if (!S.zon) return;
  const Z = zoneNow(W);
  const n = [0, 0];
  for (const h of E.heroList(W)) if (h.st === 0 && !h.jump && Math.hypot(h.x - Z.x, h.z - Z.z) < ZONE_R) n[h.tm === 1 ? 1 : 0] += 1;
  const hold = n[0] && n[1] ? 2 : n[0] ? 0 : n[1] ? 1 : -1;
  if (hold !== S.zh) { S.zacc = 0; if ((hold === 0 || hold === 1) && hold !== S.zlast) { S.zlast = hold; E.net(W, ['an', 'zhold', hold]); E.emit(W, { k: 'tan', a: 'zhold', b: hold }); } }
  S.zh = hold;
  if (hold === 0 || hold === 1) { S.zacc += dt; while (S.zacc >= 1) { S.zacc -= 1; S.score[hold] += 1; } }
}

function pvpEnd(W) {
  const S = W.tm;
  const [a, b] = S.score;
  let win = null;
  if (a >= S.goal || b >= S.goal) win = a > b ? 0 : b > a ? 1 : null;
  if (win == null && S.t >= S.tlim) {
    if (a !== b) win = a > b ? 0 : 1;
    else if (S.t >= S.tlim + OVER_T) win = 2;
    else if (!S.od) { S.od = 1; E.net(W, ['an', 'od', 0]); E.emit(W, { k: 'tan', a: 'od', b: 0 }); }
  }
  if (win == null) return;
  S.over = { team: win }; W.over = { won: true, team: win }; E.emit(W, { k: 'over', won: true, team: win });
}

function spawnWave(W) {
  const S = W.tm;
  S.waveN += 1;
  const m = mins(W);
  const hpK = 1 + 0.06 * m + (m >= 14 ? 0.5 : 0) + (m >= 18 ? 0.6 : 0), dK = 1 + 0.06 * m + (m >= 14 ? 0.4 : 0) + (m >= 18 ? 0.5 : 0);
  for (const tm of [0, 1]) for (let ln = 0; ln < 3; ln++) {
    const P = laneFor(tm, ln);
    const list = ['mel', 'mel', 'rng'];
    if (S.waveN % 3 === 0) list.push('sie');
    if (m >= 10) list.unshift('mel');
    const p0 = P[1], p1 = P[2];
    const ux = p1.x - p0.x, uz = p1.z - p0.z, L = Math.hypot(ux, uz) || 1;
    list.forEach((type, i) => {
      const back = 1.4 * i + 0.4;
      const side = (i % 2 ? 1 : -1) * 0.7;
      const b = E.mkRobot(W.nextId++, type, p0.x - (ux / L) * back - (uz / L) * side, p0.z - (uz / L) * back + (ux / L) * side, null);
      b.max = b.hp = Math.round(R[type].hp * hpK);
      b.dmgMul = dK; b.tm = tm; b.ln = ln; b.path = P; b.wpi = 2; b.lx = -(uz / L) * side * 0.6; b.lz = (ux / L) * side * 0.6;
      b.yaw = Math.atan2(ux, uz); b.sp = 0.35;
      W.robots.push(b);
    });
  }
  E.net(W, ['an', 'wave', S.waveN]);
}

function spawnCamp(W, C) {
  const m = mins(W);
  C.ids = [];
  for (const [type, ox, oz] of C.cp.units) {
    const b = E.mkRobot(W.nextId++, type, C.cp.x + ox, C.cp.z + oz, null);
    b.max = b.hp = Math.round(R[type].hp * (type === 'tank' ? 1.5 : 1.35) * (1 + 0.06 * m));
    b.dmgMul = 0.85 * (1 + 0.04 * m);
    b.tm = -1; b.camp = C.cp.key; b.home = { x: b.x, z: b.z }; b.buffK = C.cp.buff || null; b.buff = !!C.cp.buff; b.sp = 0.6;
    b.yaw = W.rnd() * Math.PI * 2;
    W.robots.push(b); C.ids.push(b.id);
  }
}

function spawnShip(W) {
  const S = W.tm, P = W.A.team.pit;
  const m = mins(W);
  const b = E.mkRobot(W.nextId++, 'shp', P.x, P.z, null);
  b.max = b.hp = Math.round(R.shp.hp * (0.55 + 0.15 * S.size) * (1 + 0.05 * m));
  b.dmgMul = 1 + 0.04 * m; b.tm = -1; b.home = { x: P.x, z: P.z }; b.sp = 1.4; b.atkT = 3; b.cyc = 0;
  W.robots.push(b);
  E.net(W, ['an', 'ship', -1]); E.emit(W, { k: 'tan', a: 'ship', b: -1 });
}

function separateUnits(W) {
  const L = W.robots;
  for (let i = 0; i < L.length; i++) {
    const a = L[i];
    if (a.hp <= 0) continue;
    for (let j = i + 1; j < L.length; j++) {
      const b = L[j];
      if (b.hp <= 0) continue;
      const dx = b.x - a.x, dz = b.z - a.z, need = a.r + b.r;
      if (Math.abs(dx) > need || Math.abs(dz) > need) continue;
      const d = Math.hypot(dx, dz);
      if (d >= need || d < 1e-4) continue;
      const sa = STILL.has(a.type) || a.type === 'shp', sb = STILL.has(b.type) || b.type === 'shp';
      if (sa && sb) continue;
      const wa = sa ? 0 : sb ? 1 : 0.5;
      const push = need - d, ux = dx / d, uz = dz / d;
      a.x -= ux * push * wa; a.z -= uz * push * wa; b.x += ux * push * (1 - wa); b.z += uz * push * (1 - wa);
    }
  }
  for (const b of L) if (b.hp > 0 && !STILL.has(b.type)) E.moveCircle(W.A, b, 0, 0, b.r);
}

function prelude(W, b, dt) {
  b.flash = Math.max(0, b.flash - dt);
  b.atkT2 = Math.max(0, (b.atkT2 || 0) - dt);
  if (b.sp > 0) { b.sp -= dt; return false; }
  if (b.kbx || b.kbz) {
    E.moveCircle(W.A, b, b.kbx * dt, b.kbz * dt, b.r);
    const f = Math.exp(-dt * 7); b.kbx *= f; b.kbz *= f;
    if (Math.abs(b.kbx) + Math.abs(b.kbz) < 0.2) { b.kbx = 0; b.kbz = 0; }
  }
  if (b.stun > 0) { b.stun -= dt; b.mv = 0; b.wind = 0; b.burst = 0; return false; }
  if (b.slowT > 0) { b.slowT -= dt; b.spdK = 1 - (b.slowK || 0); } else b.spdK = 1;
  return true;
}

function stepUnit(W, b, dt) {
  if (STILL.has(b.type)) { b.flash = Math.max(0, b.flash - dt); b.atkT2 = Math.max(0, (b.atkT2 || 0) - dt); if (b.type !== 'cor') stepTower(W, b, dt); return; }
  if (!prelude(W, b, dt)) return;
  if (b.type === 'shp') { if (b.ally) stepAllyShip(W, b, dt); else stepShip(W, b, dt); return; }
  if (b.camp) { stepCamp(W, b, dt); return; }
  if (b.wild) { stepWild(W, b, dt); return; }
  stepMinion(W, b, dt);
}

const BEAM = { mel: 0, rng: 1, sie: 2, tow: 3, gua: 4, shp: 5 };
function unitHit(W, b, t, dmg) {
  const d = Math.round(dmg);
  const st = BEAM[b.type] != null ? BEAM[b.type] : 0;
  E.net(W, ['tb', b.id, t.id, d, st]);
  E.emit(W, { k: 'tbeam', from: b.id, to: t.id, x: b.x, z: b.z, tx: t.x, tz: t.z, st, tm: b.tm, d });
  if (isHero(t)) { if (W.local && W.local.has(t.id)) E.hurtHero(W, t, d, b.id); return; }
  const dx = t.x - b.x, dz = t.z - b.z, L = Math.hypot(dx, dz) || 1;
  E.hurtRobot(W, t, d, b.id, dx / L, dz / L, {});
}

function minionTarget(W, b, rad) {
  let best = null, bs = 1e9;
  for (const o of W.robots) {
    if (!foeOfUnit(W, b, o)) continue;
    const d = Math.hypot(o.x - b.x, o.z - b.z) - o.r;
    if (d > rad) continue;
    const s = d + (STILL.has(o.type) ? 5 : 0);
    if (s < bs) { bs = s; best = o; }
  }
  for (const h of E.heroList(W)) {
    if (!foeOfUnit(W, b, h)) continue;
    const d = Math.hypot(h.x - b.x, h.z - b.z);
    if (d > rad) continue;
    const help = W.t - (h.seen || -9) < 1.4 && E.heroList(W).some((o) => o.st === 0 && o.tm === b.tm && Math.hypot(o.x - h.x, o.z - h.z) < 8);
    const s = d + (help ? -4 : 3.5);
    if (s < bs) { bs = s; best = h; }
  }
  return best ? best.id : null;
}

function stepMinion(W, b, dt) {
  const Rb = R[b.type];
  b.cd -= dt * (b.spdK || 1);
  b.think -= dt;
  if (b.think <= 0) { b.think = 0.22 + W.rnd() * 0.12; b.tg = minionTarget(W, b, 7.5); }
  let t = resolveT(W, b.tg);
  if (t && !foeOfUnit(W, b, t)) { t = null; b.tg = null; }
  if (t) {
    const tr = isHero(t) ? 0.45 : t.r;
    const d = Math.hypot(t.x - b.x, t.z - b.z);
    if (d > Rb.rng + b.r + tr - 0.1) moveTo(W, b, t.x, t.z, Rb.spd, dt);
    else {
      b.mv = 0; E.faceTo(b, t.x, t.z, dt, 9);
      if (b.cd <= 0) { b.cd = Rb.cd; b.atkT2 = 0.35; unitHit(W, b, t, Rb.dmg * (b.dmgMul || 1) * (isHero(t) ? 1 : STILL.has(t.type) ? (b.type === 'sie' ? 2 : 1) * (1 + 0.09 * Math.max(0, mins(W) - 8)) : 1)); }
    }
    return;
  }
  const P = b.path;
  if (!P) { b.mv = 0; return; }
  let wp = P[b.wpi];
  if (!wp) { b.mv = 0; return; }
  if (Math.hypot(wp.x + (b.lx || 0) - b.x, wp.z + (b.lz || 0) - b.z) < 2.4 && b.wpi < P.length - 1) { b.wpi += 1; wp = P[b.wpi]; }
  moveTo(W, b, wp.x + (b.lx || 0), wp.z + (b.lz || 0), Rb.spd, dt);
}

function stepTower(W, b, dt) {
  const Rb = R[b.type];
  b.cd -= dt;
  b.think = (b.think || 0) - dt;
  const rng = Rb.rng + 0.3;
  let t = resolveT(W, b.tg);
  if (t && (!foeOfUnit(W, b, t) || dist(b, t) > rng + (isHero(t) ? 0 : t.r))) { t = null; b.tg = null; b.streak = 0; }
  if (b.think <= 0) {
    b.think = 0.2;
    let ag = null, ad = 1e9;
    for (const h of E.heroList(W)) {
      if (!foeOfUnit(W, b, h)) continue;
      const d = dist(b, h);
      if (d > rng || W.t - (h.seen || -9) > 1.2) continue;
      if (!E.heroList(W).some((o) => o.st === 0 && o.tm === b.tm && dist(o, h) < 9)) continue;
      if (d < ad) { ad = d; ag = h; }
    }
    if (ag && t !== ag) { t = ag; b.tg = ag.id; b.streak = 0; }
  }
  if (!t) {
    let best = null, bd = 1e9;
    for (const o of W.robots) { if (!foeOfUnit(W, b, o) || STILL.has(o.type)) continue; const d = dist(b, o) - o.r; if (d < rng && d < bd) { bd = d; best = o; } }
    if (!best) for (const h of E.heroList(W)) { if (!foeOfUnit(W, b, h)) continue; const d = dist(b, h); if (d < rng && d < bd) { bd = d; best = h; } }
    t = best; b.tg = t ? t.id : null; b.streak = 0;
  }
  if (!t) return;
  b.yaw = Math.atan2(t.x - b.x, t.z - b.z);
  if (b.cd > 0) return;
  b.cd = Rb.cd; b.atkT2 = 0.45;
  const m = mins(W);
  if (isHero(t)) { const k = 1 + Math.min(1.1, 0.28 * (b.streak || 0)); b.streak = (b.streak || 0) + 1; unitHit(W, b, t, Rb.dmg * k * (1 + 0.035 * m)); }
  else unitHit(W, b, t, t.type === 'shp' ? 1400 : t.type === 'sie' ? 1200 : 980 * (1 + 0.05 * m));
}

function campFoe(W, b) {
  const h = typeof b.aggro === 'string' ? W.heroes[b.aggro] : null;
  if (!h || h.st !== 0) return null;
  if (Math.hypot(h.x - b.home.x, h.z - b.home.z) > 11.5 || Math.hypot(b.x - b.home.x, b.z - b.home.z) > 13) return null;
  return h;
}
function alienAttack(W, b, h, dt) {
  const Rb = R[b.type];
  const dx = h.x - b.x, dz = h.z - b.z, d = Math.hypot(dx, dz);
  b.cd -= dt * (b.spdK || 1);
  if (b.type === 'grunt') {
    if (b.wind > 0) {
      b.wind -= dt; E.faceTo(b, h.x, h.z, dt, 5); b.mv = 0;
      if (b.wind <= 0) { b.cd = Rb.cd; if (d < Rb.rng + 1.1) unitHit(W, b, h, Rb.dmg * (b.dmgMul || 1)); }
    } else if (d < Rb.rng + 0.45 && b.cd <= 0) { b.wind = Rb.wind; E.emit(W, { k: 'wind', id: b.id }); }
    else if (d > Rb.rng * 0.8) moveTo(W, b, h.x, h.z, Rb.spd, dt);
    else { E.faceTo(b, h.x, h.z, dt); b.mv = 0; }
  } else if (b.type === 'shooter') {
    if (d < Rb.rng && E.losClear(W.A, b.x, b.z, h.x, h.z, 0.12)) {
      const off = E.faceTo(b, h.x, h.z, dt, 6); b.mv = 0;
      if (b.cd <= 0 && off < 0.35) { b.cd = Rb.cd; E.robotShot(W, b, Math.atan2(h.x + h.vx * 0.3 - b.x, h.z + h.vz * 0.3 - b.z), Rb.bspd, Rb.dmg * (b.dmgMul || 1)); }
    } else moveTo(W, b, h.x, h.z, Rb.spd, dt);
  } else {
    if (b.burst > 0) {
      b.burstT -= dt; E.faceTo(b, h.x, h.z, dt, 2.5); b.mv = 0;
      if (b.burstT <= 0) { b.burst -= 1; b.burstT = 0.2; E.robotShot(W, b, b.yaw + (W.rnd() - 0.5) * 0.12, Rb.bspd, Rb.dmg * (b.dmgMul || 1) * 1.6, 'tb'); }
    } else if (d < 9 && b.cd <= 0 && E.losClear(W.A, b.x, b.z, h.x, h.z, 0.15)) { const off = E.faceTo(b, h.x, h.z, dt, 2.2); if (off < 0.3) { b.burst = 3; b.burstT = 0.05; b.cd = Rb.cd; } }
    else if (d > 3.5) moveTo(W, b, h.x, h.z, Rb.spd, dt);
    else { E.faceTo(b, h.x, h.z, dt, 2.2); b.mv = 0; }
  }
}
function stepCamp(W, b, dt) {
  const h = campFoe(W, b);
  if (!h) {
    b.aggro = null;
    const dh = Math.hypot(b.x - b.home.x, b.z - b.home.z);
    if (dh > 0.7) { moveTo(W, b, b.home.x, b.home.z, R[b.type].spd * 1.4, dt); b.hp = Math.min(b.max, b.hp + b.max * 0.3 * dt); }
    else { b.mv = 0; b.hp = Math.min(b.max, b.hp + b.max * 0.1 * dt); }
    return;
  }
  alienAttack(W, b, h, dt);
}
function stepWild(W, b, dt) {
  b.life = (b.life || 22) - dt;
  if (b.life <= 0) { b.hp = 0; E.emit(W, { k: 'kill', id: b.id, type: b.type, x: b.x, z: b.z, by: null }); E.net(W, ['k', b.id, '']); return; }
  let best = null, bd = 12;
  for (const h of E.heroList(W)) { if (h.st !== 0) continue; const d = dist(b, h); if (d < bd) { bd = d; best = h; } }
  if (!best) { b.mv = 0; return; }
  alienAttack(W, b, best, dt);
}

function shipTargets(W, b, rad) { return E.heroList(W).filter((h) => h.st === 0 && Math.hypot(h.x - b.home.x, h.z - b.home.z) < rad); }
function stepShip(W, b, dt) {
  const near = shipTargets(W, b, 13);
  b.mv = 0;
  if (!near.length) { b.hp = Math.min(b.max, b.hp + b.max * 0.04 * dt); b.yaw += dt * 0.3; b.atkT = Math.max(b.atkT, 1.2); if (dist(b, b.home) > 0.5) moveTo(W, b, b.home.x, b.home.z, 2, dt); return; }
  if (b.busy > 0) { b.busy -= dt; if (b.act && b.act.k === 'laser') { b.act.el += dt; b.yaw = b.act.a0 + (b.act.a1 - b.act.a0) * clamp((b.act.el - b.act.wind) / b.act.dur, 0, 1); } return; }
  b.act = null;
  let h = typeof b.aggro === 'string' ? W.heroes[b.aggro] : null;
  if (!h || h.st !== 0 || !near.includes(h)) h = near.sort((p, q) => dist(b, p) - dist(b, q))[0];
  E.faceTo(b, h.x, h.z, dt, 2.4);
  const off = Math.hypot(b.x - b.home.x, b.z - b.home.z);
  if (dist(b, h) > 6 && off < 3) moveTo(W, b, h.x, h.z, R.shp.spd, dt);
  else if (off > 3.5) moveTo(W, b, b.home.x, b.home.z, R.shp.spd, dt);
  b.atkT -= dt;
  if (b.atkT > 0) return;
  shipAttack(W, b, h, near, null);
}
function shipAttack(W, b, h, near, tm) {
  const cyc = ['mis', 'stomp', 'laser', 'mis', 'call'];
  let k = cyc[b.cyc % cyc.length];
  b.cyc += 1;
  const rage = b.hp < b.max * 0.5;
  const dm = (n) => Math.round(n * (b.dmgMul || 1));
  if (k === 'stomp' && !near.some((o) => dist(o, b) < 7)) k = 'mis';
  if (k === 'call' && (tm != null || W.robots.filter((o) => o.wild).length > 4)) k = 'mis';
  if (k === 'stomp') { E.addZone(W, { k: 'stomp', x: b.x, z: b.z, r: 6, d: dm(1250), t: rage ? 0.85 : 1.1, tm }, true); b.busy = 1.5; }
  else if (k === 'mis') { near.slice(0, 4).forEach((o, i) => E.addZone(W, { k: 'mis', x: clamp(o.x + (o.vx || 0) * 0.9, 1, W.A.wx - 1), z: clamp(o.z + (o.vz || 0) * 0.9, 1, W.A.wz - 1), r: 2.4, d: dm(950), t: 1.3 + i * 0.12, tm }, true)); b.busy = 0.7; }
  else if (k === 'laser') {
    const a0 = Math.atan2(h.x - b.x, h.z - b.z) - 0.55, a1 = a0 + 1.1, sw = W.rnd() < 0.5;
    E.addZone(W, { k: 'laser', x: b.x, z: b.z, t: 0.85, dur: 1.5, a: sw ? a0 : a1, a1: sw ? a1 : a0, d: dm(380), len: 20, r: 0.75, tm }, true);
    b.act = { k: 'laser', a0: sw ? a0 : a1, a1: sw ? a1 : a0, wind: 0.85, dur: 1.5, el: 0 }; b.busy = 2.35;
  } else {
    for (let i = 0; i < 2; i++) {
      const a = W.rnd() * Math.PI * 2;
      const p = { x: b.x + Math.sin(a) * 3, z: b.z + Math.cos(a) * 3 };
      if (E.solidAt(W.A, p.x, p.z)) continue;
      const g = E.mkRobot(W.nextId++, 'grunt', p.x, p.z, null);
      g.tm = -1; g.wild = true; g.life = 22; g.dmgMul = b.dmgMul || 1;
      W.robots.push(g);
      E.emit(W, { k: 'spawn', id: g.id, type: 'grunt', x: g.x, z: g.z, boss: true });
    }
    b.busy = 0.8;
  }
  b.atkT = (rage ? 2.0 : 2.7) + W.rnd() * 0.6;
}
function stepAllyShip(W, b, dt) {
  b.life -= dt;
  if (b.life <= 0) { b.hp = 0; E.emit(W, { k: 'kill', id: b.id, type: b.type, x: b.x, z: b.z, by: null }); E.net(W, ['k', b.id, '']); return; }
  b.cd -= dt;
  b.think -= dt;
  if (b.think <= 0) { b.think = 0.3; b.tg = minionTarget(W, b, 9); }
  const t = resolveT(W, b.tg);
  if (t && foeOfUnit(W, b, t)) {
    const d = dist(b, t);
    E.faceTo(b, t.x, t.z, dt, 3);
    if (d > 7) moveTo(W, b, t.x, t.z, 2.4, dt); else b.mv = 0;
    if (b.cd <= 0 && d < 9 + (isHero(t) ? 0 : t.r)) {
      b.cd = 1.5; b.atkT2 = 0.5;
      unitHit(W, b, t, isHero(t) ? 520 * (b.dmgMul || 1) : STILL.has(t.type) ? 950 * (b.dmgMul || 1) : 900);
      b.atkT = (b.atkT || 0) - 1;
      if (b.atkT <= 0) { b.atkT = 3; const foes = E.heroList(W).filter((h) => h.st === 0 && h.tm !== b.tm && dist(h, b) < 11); if (foes.length) shipAttack(W, b, foes[0], foes, b.tm); }
    }
    return;
  }
  const P = b.path;
  let wp = P[b.wpi];
  if (wp && Math.hypot(wp.x - b.x, wp.z - b.z) < 2.6 && b.wpi < P.length - 1) { b.wpi += 1; wp = P[b.wpi]; }
  if (wp) moveTo(W, b, wp.x, wp.z, 2.4, dt);
}

function xpTo(W, id, n, why) {
  if (!(n > 0)) return;
  E.net(W, ['x', id, Math.round(n), why || 0]);
  const h = W.heroes[id];
  if (h && W.local && W.local.has(id)) addXP(W, h, n);
}
export function xpMul(W, h) {
  const L = h.tl || 1;
  let s = 0, c = 0;
  for (const o of E.heroList(W)) { s += o.tl || 1; c += 1; }
  const avg = c ? s / c : L;
  let k = L < avg - 0.5 ? Math.min(1.6, 1 + 0.16 * (avg - L)) : L > avg + 0.5 ? Math.max(0.72, 1 - 0.07 * (L - avg)) : 1;
  if (h.bot) k *= botLv(W).xp;
  return k;
}
export function addXP(W, h, n, raw) {
  if (!h || !(n > 0) || (h.tl || 1) >= TL_MAX) return;
  h.xp = (h.xp || 0) + (raw ? n : n * xpMul(W, h));
  const pv = !!(W.tm && W.tm.gm);
  while ((h.tl || 1) < TL_MAX && h.xp >= xpNeed(h.tl || 1, pv)) {
    h.xp -= xpNeed(h.tl || 1, pv);
    const L = (h.tl || 1) + 1;
    h.tl = L;
    const k1 = (1 + 0.045 * (L - 1)) / (1 + 0.045 * (L - 2)), k2 = (1 + 0.035 * (L - 1)) / (1 + 0.035 * (L - 2));
    h.mods.hp *= k1; h.mods.dmg *= k2;
    E.refreshMax(h);
    if (h.st === 2) h.hp = 0;
    E.emit(W, { k: 'lvl', id: h.id, lv: L, x: h.x, z: h.z, card: CARD_LV.has(L) });
  }
  if ((h.tl || 1) >= TL_MAX) h.xp = 0;
}

function onHit(W, b, h) {
  if (b.camp) { for (const o of W.robots) if (o.camp === b.camp && o.hp > 0 && !o.aggro) o.aggro = h.id; if (!b.aggro) b.aggro = h.id; }
  else if (b.type === 'shp' && !b.ally) { if (!b.aggro || W.rnd() < 0.15) b.aggro = h.id; b.lastTm = h.tm; }
}

function onKill(W, b, by) {
  const S = W.tm;
  const hero = typeof by === 'string' ? W.heroes[by] : b.lastHero && W.t - (b.lastHeroAt || -99) < 6 ? W.heroes[b.lastHero] : null;
  if (STILL.has(b.type)) {
    S.dead.add(b.id);
    const team = 1 - b.tm;
    for (const h of E.heroList(W)) if (h.tm === team) xpTo(W, h.id, b.type === 'tow' ? 140 : b.type === 'gua' ? 200 : 0, 1);
    E.net(W, ['an', b.type, b.tm, b.ln == null ? -1 : b.ln, b.tier || 0]);
    E.emit(W, { k: 'tan', a: b.type, b: b.tm, c: b.ln, d: b.tier || 0, x: b.x, z: b.z });
    if (b.type === 'cor') { S.over = { team }; W.over = { won: true, team }; E.emit(W, { k: 'over', won: true, team }); }
    refreshProtect(W);
    return;
  }
  if (b.type === 'shp') {
    if (b.ally) { S.shipTeam = -1; S.shipT = SHIP_RESP; E.net(W, ['an', 'shipgone', b.tm]); E.emit(W, { k: 'tan', a: 'shipgone', b: b.tm }); return; }
    const team = hero ? hero.tm : b.lastTm != null ? b.lastTm : -1;
    S.shipT = SHIP_RESP;
    for (const o of W.robots) if (o.wild) { o.hp = 0; E.net(W, ['k', o.id, '']); }
    if (team < 0) return;
    for (const h of E.heroList(W)) if (h.tm === team) xpTo(W, h.id, 240, 2);
    S.shipTeam = team;
    const a = E.mkRobot(W.nextId++, 'shp', b.x, b.z, null);
    a.tm = team; a.ally = true; a.max = a.hp = Math.round(b.max * 0.55); a.dmgMul = b.dmgMul || 1; a.life = 80; a.sp = 1.6; a.path = laneFor(team, 1); a.wpi = 1; a.think = 0; a.atkT = 2;
    let bi = 0, bd = 1e9; a.path.forEach((p, i) => { const d = Math.hypot(p.x - a.x, p.z - a.z); if (d < bd) { bd = d; bi = i; } }); a.wpi = Math.max(1, bi);
    W.robots.push(a);
    E.net(W, ['an', 'shiptake', team]); E.emit(W, { k: 'tan', a: 'shiptake', b: team });
    return;
  }
  if (b.camp) {
    const C = S.camps[b.camp];
    if (hero) {
      const base = S.gm ? (b.buffK ? 120 : 50) : b.buffK ? 150 : C && C.cp.k === 'river' ? 70 : 60;
      xpTo(W, hero.id, base, 3);
      for (const h of E.heroList(W)) if (h !== hero && h.tm === hero.tm && h.st === 0 && dist(h, b) < 11) xpTo(W, h.id, base * 0.5, 3);
      if (b.buffK) { E.net(W, ['bf', hero.id, b.buffK]); if (W.local && W.local.has(hero.id)) giveBuff(W, hero, b.buffK); }
      if (C && C.cp.k === 'river' && C.ids.every((i) => i === b.id || !W.robots.some((o) => o.id === i && o.hp > 0))) { for (const h of E.heroList(W)) if (h.tm === hero.tm) xpTo(W, h.id, 90, 3); E.net(W, ['an', 'river', hero.tm]); E.emit(W, { k: 'tan', a: 'river', b: hero.tm }); }
    }
    return;
  }
  if (b.type === 'mel' || b.type === 'rng' || b.type === 'sie') {
    const base = b.type === 'sie' ? 62 : b.type === 'mel' ? 34 : 30;
    const near = E.heroList(W).filter((h) => h.st === 0 && h.tm !== b.tm && dist(h, b) < 11);
    for (const h of near) xpTo(W, h.id, base * (near.length > 1 ? 0.75 : 1) * (hero === h ? 1.3 : 1), 0);
  }
}

export function giveBuff(W, h, k) {
  if (!BUFFS[k] || !h) return;
  (h.buffs || (h.buffs = {}))[k] = BUFFS[k].t;
  E.emit(W, { k: 'buff', id: h.id, b: k, x: h.x, z: h.z });
}

function onNet(W, e) {
  const k = e[0];
  if (k === 'x') { const h = W.heroes[e[1]]; if (h && W.local && W.local.has(h.id)) addXP(W, h, clamp(+e[2] || 0, 0, 2000)); }
  else if (k === 'bf') { const h = W.heroes[e[1]]; if (h && W.local && W.local.has(h.id)) giveBuff(W, h, String(e[2])); else if (h) E.emit(W, { k: 'buff', id: h.id, b: String(e[2]), x: h.x, z: h.z, remote: true }); }
  else if (k === 'tb') {
    const from = W.robots.find((o) => o.id === (e[1] | 0));
    const toH = typeof e[2] === 'string' ? W.heroes[e[2]] : null;
    const to = toH || W.robots.find((o) => o.id === (e[2] | 0));
    const d = clamp(e[3] | 0, 0, 1000000);
    if (from) from.atkT2 = 0.4;
    if (from && to) E.emit(W, { k: 'tbeam', from: from.id, to: to.id, x: from.x, z: from.z, tx: to.x, tz: to.z, st: e[4] | 0, tm: from.tm, d });
    if (toH && W.local && W.local.has(toH.id)) E.hurtHero(W, toH, d, e[1] | 0);
  } else if (k === 'an') E.emit(W, { k: 'tan', a: String(e[1]), b: e[2] | 0, c: e[3] | 0, d: e[4] | 0, remote: true });
}

export function deathInfo(W, h) {
  const by = h.lastBy;
  const foe = (k) => W.heroes[k] && W.heroes[k].tm !== h.tm;
  const recent = Object.entries(h.dmgBy || {}).filter(([k, t]) => W.t - t < 10 && foe(k)).sort((a, b) => b[1] - a[1]).map(([k]) => k);
  let killer = typeof by === 'string' && foe(by) ? by : null;
  if (!killer && recent.length) killer = recent[0];
  h.dmgBy = {};
  return { v: h.id, k: killer, by: typeof by === 'number' ? by : typeof by === 'string' ? by : null, as: recent.filter((k) => k !== killer).slice(0, 4) };
}
export function applyKill(W, m) {
  const S = W.tm;
  const v = W.heroes[m.v];
  if (!S || !v) return null;
  const kd = (id) => S.kd[id] || (S.kd[id] = { k: 0, d: 0, a: 0, st: 0, mk: 0, mkAt: -99 });
  const V = kd(v.id);
  const shut = V.st >= 3;
  V.d += 1; V.st = 0;
  const out = { v: v.id, k: m.k || null, as: [], first: false, multi: 0, shut, streak: 0, ace: false, by: m.by };
  if (m.k && W.heroes[m.k]) {
    const K = kd(m.k);
    K.k += 1; K.st += 1;
    K.mk = W.t - K.mkAt < 11 ? K.mk + 1 : 1; K.mkAt = W.t;
    out.multi = K.mk; out.streak = K.st;
    if (S.gm !== 'hp') S.score[W.heroes[m.k].tm] += 1;
    if (!S.fb) { S.fb = true; out.first = true; }
    const killer = W.heroes[m.k];
    if (killer && W.local && W.local.has(killer.id)) addXP(W, killer, S.gm ? 50 + 10 * (v.tl || 1) + (shut ? 40 : 0) : 110 + 22 * (v.tl || 1) + (shut ? 60 : 0));
  } else if (!S.gm || (S.gm === 'tdm' && m.by === 'fount')) S.score[1 - v.tm] += 1;
  for (const a of (m.as || []).slice(0, 4)) {
    const hh = W.heroes[a];
    if (!hh || a === m.k || hh.tm === v.tm) continue;
    kd(a).a += 1; out.as.push(a);
    if (W.local && W.local.has(a)) addXP(W, hh, S.gm ? 25 + 5 * (v.tl || 1) : 60 + 12 * (v.tl || 1));
  }
  out.ace = E.heroList(W).filter((o) => o.tm === v.tm).every((o) => o.st === 2);
  return out;
}

export function respawn(W, h) {
  const F = W.A.team.founts[h.tm];
  const a = W.rnd() * Math.PI * 2;
  h.x = F.x + Math.sin(a) * 1.2; h.z = F.z + Math.cos(a) * 1.2;
  h.st = 0; h.hp = h.max; h.ammo = h.mods ? h.mods.ammo : 3; h.downT = 0; h.respT = 0; h.spawnT = 2.5; h.shield = 0; h.stunT = 0; h.slowT = 0; h.recT = 0; h.jump = null; h.dashT = 0;
  h.yaw = h.tm === 0 ? Math.PI * 0.75 : -Math.PI * 0.25;
  E.emit(W, { k: 'revive', id: h.id, x: h.x, z: h.z, team: true });
}

export function towerFor(W, tm, ln) {
  const L = W.robots.filter((b) => b.hp > 0 && b.tm === tm && b.type === 'tow' && b.ln === ln).sort((a, b) => a.tier - b.tier);
  if (L.length) return L[0];
  return W.robots.find((b) => b.hp > 0 && b.tm === tm && b.type === 'gua') || null;
}
export function padDest(W, h, pad) {
  const t = towerFor(W, h.tm, pad.ln);
  const F = W.A.team.founts[h.tm];
  if (!t) return { x: F.x, z: F.z };
  const dx = F.x - t.x, dz = F.z - t.z, L = Math.hypot(dx, dz) || 1;
  const p = { x: t.x + (dx / L) * 3.2, z: t.z + (dz / L) * 3.2 };
  E.moveCircle(W.A, p, 0, 0, 0.6);
  return p;
}

export function stepLocal(W, h, dt, inp) {
  const T = W.A.team;
  if (h.buffs) for (const k of Object.keys(h.buffs)) { h.buffs[k] -= dt; if (h.buffs[k] <= 0) delete h.buffs[k]; }
  h.skCD = Math.max(0, (h.skCD || 0) - dt);
  h.sprT = Math.max(0, (h.sprT || 0) - dt);
  h.padCD = Math.max(0, (h.padCD || 0) - dt);
  h.spdMul = (h.sprT > 0 ? 1.45 : 1) * (h.inBase ? 1.25 : 1);
  if (h.sprT > 0 && h.slowT > 0) { h.slowT = 0; h.slowK = 0; }
  if (h.buffs && h.buffs.fury) { h.furyOn = true; } else h.furyOn = false;
  if ((h.tl || 1) < TL_MAX) { h.xpAcc = (h.xpAcc || 0) + dt * 2.4; if (h.xpAcc >= 6) { h.xpAcc -= 6; addXP(W, h, 6); } }
  if (h.gad < E.GADGETS) { h.gadRe = (h.gadRe || 0) + dt * ((h.mods && h.mods.gadRe) || 1); if (h.gadRe >= 30) { h.gadRe = 0; h.gad += 1; } } else h.gadRe = 0;
  if (h.gate && (W.t > h.gate.t || h.st !== 0)) { h.gate = null; h.skCD = Math.max(h.skCD || 0, SKILLS.blink.cd * 0.55); E.emit(W, { k: 'gate', id: h.id, end: true }); }
  if (h.hotT > 0) {
    h.hotT -= dt;
    if (h.st !== 0) h.hotT = 0;
    else { h.hotAcc = (h.hotAcc || 0) + h.max * (h.hotR || 0) * dt; if (h.hotAcc >= h.max * 0.03 || h.hotT <= 0) { E.healHero(W, h, h.hotAcc, h.hotBy || h.id); h.hotAcc = 0; } }
  }
  if (h.st === 2) { h.respT = Math.max(0, (h.respT || 0) - dt); if (h.respT <= 0) respawn(W, h); return; }
  if (h.st !== 0) return;
  const F = T.founts[h.tm], EF = T.founts[1 - h.tm], FR = T.fr || FOUNT_R;
  h.inBase = dist(h, F) < FR + 3;
  if (dist(h, F) < FR) { h.hp = Math.min(h.max, h.hp + h.max * 0.16 * dt); h.ammo = Math.min(h.mods.ammo, h.ammo + dt * 2); h.regen = 4; }
  const Z = zoneNow(W);
  if (Z && W.tm.zon && W.tm.zh === h.tm && (h.tl || 1) < TL_MAX && Math.hypot(h.x - Z.x, h.z - Z.z) < ZONE_R) { h.zxp = (h.zxp || 0) + dt * 3; if (h.zxp >= 6) { h.zxp -= 6; addXP(W, h, 6); } }
  if (dist(h, EF) < FR + 0.8) { h.fountAcc = (h.fountAcc || 0) + dt; if (h.fountAcc > 0.25) { h.fountAcc = 0; h.spawnT = 0; E.hurtHero(W, h, 550, 'fount'); E.emit(W, { k: 'fzap', id: h.id, x: EF.x, z: EF.z, tx: h.x, tz: h.z }); } }
  const mv = inp ? Math.hypot(inp.mx || 0, inp.mz || 0) > 0.15 : false;
  if (h.recT > 0) {
    if (mv || h.lastHurt > h.recAt || h.jump || h.dashT > 0) { h.recT = 0; E.emit(W, { k: 'recall', id: h.id, stop: true }); }
    else { h.recT -= dt; if (h.recT <= 0) { const a = W.rnd() * Math.PI * 2; h.x = F.x + Math.sin(a); h.z = F.z + Math.cos(a); h.recT = 0; E.emit(W, { k: 'portal', id: h.id, x: h.x, z: h.z, recall: true }); } }
  }
  if (h.padCD <= 0 && !h.jump) {
    let pad = null;
    for (const p of T.pads) if (p.tm === h.tm && Math.hypot(p.x - h.x, p.z - h.z) < 1.15) { pad = p; break; }
    let por = null;
    if (!pad) for (const p of T.portals) if (Math.hypot(p.x - h.x, p.z - h.z) < 1.3) { por = p; break; }
    const key = pad ? `p${pad.i}` : por ? `r${por.i}` : null;
    if (key && key === h.padK) {
      h.padT = (h.padT || 0) + dt;
      if (h.padT >= (pad ? 0.55 : 0.85)) {
        let to;
        if (pad) to = padDest(W, h, pad);
        else { const o = T.portals[1 - por.i]; const cx = W.A.wx / 2, cz = W.A.wz / 2; const dx = cx - o.x, dz = cz - o.z, L = Math.hypot(dx, dz) || 1; to = { x: o.x + (dx / L) * 2, z: o.z + (dz / L) * 2 }; }
        E.emit(W, { k: 'portal', id: h.id, x0: h.x, z0: h.z, x: to.x, z: to.z });
        h.x = to.x; h.z = to.z; h.padT = 0; h.padK = null; h.padCD = pad ? 3 : 9; h.recT = 0;
      }
    } else { h.padK = key; h.padT = 0; }
  }
}

export function startRecall(W, h) {
  if (!h || h.st !== 0 || h.recT > 0 || (W.tm && W.tm.gm)) return false;
  h.recT = 4.5; h.recAt = W.t;
  E.emit(W, { k: 'recall', id: h.id, x: h.x, z: h.z });
  return true;
}

export function useSkill(W, h, a) {
  const S = SKILLS[h.sk];
  if (!S || h.st !== 0 || (h.stunT || 0) > 0) return null;
  if (h.sk === 'blink' && h.gate) {
    if ((h.skCD || 0) > 0) return null;
    const gt = h.gate;
    h.gate = null; h.skCD = S.cd;
    const out = { sk: 'blink', a: 0, x: +h.x.toFixed(2), z: +h.z.toFixed(2), x1: gt.x, z1: gt.z, w: 1 };
    h.x = gt.x; h.z = gt.z; h.recT = 0; h.dashT = 0;
    applySkill(W, h, out, true);
    return out;
  }
  if ((h.skCD || 0) > 0) return null;
  h.skCD = S.cd;
  const out = { sk: h.sk, a: +(a || 0).toFixed(3), x: +h.x.toFixed(2), z: +h.z.toFixed(2) };
  if (h.sk === 'blink') { h.gate = { x: out.x, z: out.z, t: W.t + GATE_T }; h.skCD = 0.8; out.w = 0; }
  else if (h.sk === 'sprint') { h.sprT = 4; h.slowT = 0; h.slowK = 0; }
  else if (h.sk === 'mend') { h.hotT = 5; h.hotR = 0.06; h.hotBy = h.id; h.hotAcc = 0; }
  else if (h.sk === 'hunter') {
    const fx = Math.sin(a), fz = Math.cos(a);
    const len = Math.max(1.5, E.rayWall(W.A, h.x, h.z, fx, fz, 9.5));
    out.x1 = +(h.x + fx * len).toFixed(2); out.z1 = +(h.z + fz * len).toFixed(2);
  }
  applySkill(W, h, out, true);
  return out;
}
export function applySkill(W, h, m, self) {
  const k = String(m.sk || '');
  const x = Number.isFinite(+m.x) ? +m.x : h.x, z = Number.isFinite(+m.z) ? +m.z : h.z;
  const x1 = Number.isFinite(+m.x1) ? +m.x1 : null, z1 = Number.isFinite(+m.z1) ? +m.z1 : null;
  E.emit(W, { k: 'skill', id: h.id, sk: k, x, z, x1, z1, a: +m.a || 0, w: m.w, tm: h.tm });
  if (k === 'guard') { W.domes = (W.domes || []).filter((d) => d.until > W.t); W.domes.push({ x, z, tm: h.tm, r: 4.6, until: W.t + 4 }); }
  for (const o of E.heroList(W)) {
    if (o === h || o.st !== 0 || !(W.local && W.local.has(o.id))) continue;
    const d = Math.hypot(o.x - x, o.z - z);
    if (k === 'mend' && o.tm === h.tm && d < 6) { o.hotT = 5; o.hotR = 0.03; o.hotBy = h.id; o.hotAcc = 0; }
    else if (k === 'shock' && o.tm !== h.tm && d < 5) {
      const L = d || 1, f = Math.min(13, 4 + d * 2.2);
      o.kbx = (o.kbx || 0) + ((x - o.x) / L) * f; o.kbz = (o.kbz || 0) + ((z - o.z) / L) * f;
      if (!(o.sprT > 0)) { o.slowK = Math.max(o.slowT > 0 ? o.slowK || 0 : 0, 0.5); o.slowT = Math.max(o.slowT || 0, 1.5); }
      E.emit(W, { k: 'pullH', id: o.id, x: o.x, z: o.z, tx: x, tz: z });
      (o.dmgBy || (o.dmgBy = {}))[h.id] = W.t;
    }
  }
  if (!W.host) return;
  if (k === 'shock') for (const b of W.robots) {
    if (b.hp <= 0 || STILL.has(b.type) || b.type === 'shp' || b.tm === h.tm) continue;
    const d = Math.hypot(b.x - x, b.z - z);
    if (d > 5 + b.r) continue;
    const L = d || 1;
    b.kbx = (b.kbx || 0) + ((x - b.x) / L) * 7; b.kbz = (b.kbz || 0) + ((z - b.z) / L) * 7;
    E.slowRobot(b, 0.5, 1.5);
  }
  if (k === 'hunter' && x1 != null) {
    const ux = x1 - x, uz = z1 - z, L2 = ux * ux + uz * uz || 1;
    for (const b of W.robots) {
      if (b.hp <= 0 || STILL.has(b.type) || b.tm === h.tm || b.sp > 0) continue;
      const t = clamp(((b.x - x) * ux + (b.z - z) * uz) / L2, 0, 1);
      if (Math.hypot(b.x - x - ux * t, b.z - z - uz * t) > 1.15 + b.r) continue;
      const dmg = (b.type === 'shp' || b.camp ? 1500 : 1100) + 130 * (h.tl || 1);
      const L = Math.sqrt(L2);
      E.hurtRobot(W, b, dmg, h.id, ux / L, uz / L, {});
    }
  }
}
export const domeCut = (W, h) => {
  if (!W.domes || !W.domes.length) return 1;
  for (const d of W.domes) if (d.tm === h.tm && W.t < d.until && Math.hypot(h.x - d.x, h.z - d.z) < d.r) return 0.6;
  return 1;
};

export function snapTeam(W) {
  const S = W.tm;
  if (S.gm) return { t: Math.round(S.t * 10), sc: S.score, kd: Object.entries(S.kd).map(([id, v]) => [id, v.k, v.d, v.a]), zn: [S.zk, S.zon ? 1 : 0, S.zh, Math.round(S.zt * 10), S.od ? 1 : 0] };
  const tw = S.struct.map((id) => { const b = W.robots.find((o) => o.id === id); return b && b.hp > 0 ? [Math.round(b.hp), (b.inv ? 1 : 0) | (b.atkT2 > 0 ? 2 : 0), Math.round(b.yaw * 100), b.tg != null && typeof b.tg === 'string' ? b.tg : b.tg != null ? +b.tg : null] : 0; });
  const ship = W.robots.find((b) => b.type === 'shp' && b.hp > 0);
  return { t: Math.round(S.t * 10), sc: S.score, tw, sh: [ship ? (ship.ally ? 2 + ship.tm : 1) : 0, Math.round(S.shipT)], wn: S.waveN, kd: Object.entries(S.kd).map(([id, v]) => [id, v.k, v.d, v.a]) };
}
export function applySnapTeam(W, s) {
  const S = W.tm;
  if (!S || !s) return;
  if (typeof s.t === 'number') S.t = s.t / 10;
  if (Array.isArray(s.sc) && s.sc.length === 2) S.score = [s.sc[0] | 0, s.sc[1] | 0];
  if (Array.isArray(s.sh)) { S.shipState = s.sh[0] | 0; S.shipT = +s.sh[1] || 0; }
  if (typeof s.wn === 'number') S.waveN = s.wn;
  if (Array.isArray(s.zn) && s.zn.length >= 5) { S.zk = Math.max(0, s.zn[0] | 0); S.zon = !!s.zn[1]; S.zh = clamp(s.zn[2] | 0, -1, 2); S.zt = Math.max(0, (s.zn[3] | 0) / 10); S.od = s.zn[4] ? 1 : 0; }
  if (Array.isArray(s.kd)) for (const r of s.kd) { if (!Array.isArray(r) || typeof r[0] !== 'string') continue; const v = S.kd[r[0]] || (S.kd[r[0]] = { k: 0, d: 0, a: 0, st: 0, mk: 0, mkAt: -99 }); v.k = r[1] | 0; v.d = r[2] | 0; v.a = r[3] | 0; }
  if (Array.isArray(s.tw)) s.tw.forEach((v, i) => {
    const id = S.struct[i];
    const b = W.robots.find((o) => o.id === id);
    if (!b) return;
    if (!v) { if (!S.dead.has(id)) { S.dead.add(id); b.hp = 0; E.emit(W, { k: 'tan', a: b.type, b: b.tm, c: b.ln, d: b.tier || 0, x: b.x, z: b.z, quiet: true }); } return; }
    b.hp = clamp(v[0] | 0, 1, b.max); b.inv = !!(v[1] & 1); if (v[1] & 2) b.atkT2 = 0.4; b.yaw = (v[2] | 0) / 100; b.tg = v[3];
  });
  for (let i = W.robots.length - 1; i >= 0; i--) { const b = W.robots[i]; if (STILL.has(b.type) && b.hp <= 0) W.robots.splice(i, 1); }
}

const PATHS = new Map();
function pathInfo(tm, ln) {
  const key = tm * 3 + ln;
  let I = PATHS.get(key);
  if (I) return I;
  const P = laneFor(tm, ln);
  const cum = [0];
  for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i].x - P[i - 1].x, P[i].z - P[i - 1].z));
  I = { P, cum, len: cum[cum.length - 1] };
  PATHS.set(key, I);
  return I;
}
export function laneProgress(tm, ln, x, z) {
  const { P, cum } = pathInfo(tm, ln);
  let best = 1e9, along = 0;
  for (let i = 0; i < P.length - 1; i++) {
    const a = P[i], b = P[i + 1], ux = b.x - a.x, uz = b.z - a.z, L2 = ux * ux + uz * uz || 1;
    const t = clamp(((x - a.x) * ux + (z - a.z) * uz) / L2, 0, 1);
    const d = Math.hypot(x - a.x - ux * t, z - a.z - uz * t);
    if (d < best) { best = d; along = cum[i] + t * Math.sqrt(L2); }
  }
  return along;
}
export function lanePoint(tm, ln, s) {
  const { P, cum, len } = pathInfo(tm, ln);
  const v = clamp(s, 0, len);
  for (let i = 0; i < P.length - 1; i++) if (v <= cum[i + 1]) { const t = (v - cum[i]) / Math.max(1e-6, cum[i + 1] - cum[i]); return { x: P[i].x + (P[i + 1].x - P[i].x) * t, z: P[i].z + (P[i + 1].z - P[i].z) * t }; }
  return { x: P[P.length - 1].x, z: P[P.length - 1].z };
}
function laneFront(W, tm, ln) {
  let bp = -1;
  for (const b of W.robots) { if (b.hp <= 0 || b.tm !== tm || b.ln !== ln || STILL.has(b.type) || b.type === 'shp') continue; const pr = laneProgress(tm, ln, b.x, b.z); if (pr > bp) bp = pr; }
  if (bp >= 0) return Math.max(6, bp - 2.5);
  const t = towerFor(W, tm, ln);
  return t ? laneProgress(tm, ln, t.x, t.z) - 3 : 8;
}
function towerCap(W, h, ln, s) {
  let cap = s;
  for (const t of W.robots) {
    if (t.hp <= 0 || t.tm === h.tm || !(t.type === 'tow' || t.type === 'gua' || t.type === 'cor')) continue;
    const tp = laneProgress(h.tm, ln, t.x, t.z);
    const rng = R[t.type].rng || 6;
    const p = lanePoint(h.tm, ln, tp);
    if (Math.hypot(p.x - t.x, p.z - t.z) > 6) continue;
    const tank = W.robots.filter((o) => o.hp > 0 && o.tm === h.tm && !STILL.has(o.type) && Math.hypot(o.x - t.x, o.z - t.z) < rng + 0.5).length;
    if (t.type !== 'cor' && tank < 1 && t.hp > t.max * 0.1) cap = Math.min(cap, tp - rng - 2.2);
  }
  return cap;
}

export function assignRoles(list, size) {
  const order = [1, 0, 2, 3, 2];
  list.forEach((h, i) => { const r = order[i % order.length]; h.jg = r === 3; h.ln = r === 3 ? 0 : r; });
}

const ROAM = [[16, 5], [16, 12], [16, 19], [10, 3.2], [9, 12], [9, 19.5], [23, 4.5], [23, 12], [22, 20.8], [12.5, 8], [19.5, 16]];
function pvpGoal(W, h, B, foes, hpF) {
  const S = W.tm;
  if (S.gm === 'hp') {
    const Z = S.zon && S.zt > 6 ? zoneNow(W) : zoneNext(W);
    if (Z) {
      if (B.zoT <= 0) { B.zoT = 2.5 + W.rnd() * 2.5; const a = W.rnd() * Math.PI * 2, r = W.rnd() * ZONE_R * 0.6; B.zo = [Math.sin(a) * r, Math.cos(a) * r]; }
      const fz = foes.filter((o) => Math.hypot(o.x - Z.x, o.z - Z.z) < ZONE_R + 5).sort((a, b) => dist(a, h) - dist(b, h))[0];
      if (fz && dist(fz, h) < 12) return { x: fz.x, z: fz.z, f: fz };
      return { x: Z.x + B.zo[0], z: Z.z + B.zo[1] };
    }
  }
  const tgt = foes.filter((o) => dist(o, h) < 22).sort((a, b) => dist(a, h) - dist(b, h))[0];
  if (tgt && hpF > 0.4) return { x: tgt.x, z: tgt.z, f: tgt };
  let camp = null, cd = S.gm === 'hp' && S.zon ? 7 : 15;
  for (const b of W.robots) { if (b.hp <= 0 || !b.camp) continue; const d = dist(b, h); if (d < cd) { cd = d; camp = b; } }
  if (camp && !tgt) {
    const want = Math.max(2, E.HEROES[h.key].want * 0.9);
    const ux = (camp.x - h.x) / (cd || 1), uz = (camp.z - h.z) / (cd || 1);
    const k = cd > want + 1 ? 1 : cd < want - 1 ? -1 : 0;
    return { x: h.x + ux * k * 3 - uz * B.strafe * 0.85, z: h.z + uz * k * 3 + ux * B.strafe * 0.85, f: camp };
  }
  if (!B.rp || B.rpT <= 0 || dist(B.rp, h) < 3) {
    B.rpT = 9 + W.rnd() * 6;
    const far = (p) => (h.tm === 0 ? p[0] : BW - p[0]);
    const L = ROAM.map((p) => ({ p, w: 0.4 + far(p) / BW + W.rnd() * 0.9 })).sort((a, b) => b.w - a.w);
    const q = L[0].p;
    B.rp = { x: q[0] * TILE, z: q[1] * TILE };
  }
  return B.rp;
}
export function teamBot(W, h, dt) {
  const inp = { mx: 0, mz: 0, fire: null };
  if (h.st !== 0 || h.jump || !W.tm) return inp;
  const H = E.HEROES[h.key], T = W.A.team;
  const P = botLv(W);
  const S0 = W.tm, PV = !!S0.gm;
  const B = h.tb || (h.tb = { t: 0, st: PV ? 'go' : h.jg ? 'jungle' : 'lane', gT: 1 + W.rnd(), dT: 0.5, skT: 1, flipT: 0, strafe: 1, F: null, Fx: -99, Fz: -99, shipAt: 30, shipUntil: 0, seeT: 0, seen: null, rp: null, rpT: 0, zo: [0, 0], zoT: 0 });
  B.t -= dt; B.gT -= dt; B.dT -= dt; B.flipT -= dt; B.skT -= dt; B.zoT -= dt; B.rpT -= dt;
  if (B.flipT <= 0) { B.flipT = P.flip + W.rnd() * 1.6; B.strafe = (W.rnd() < 0.5 ? -1 : 1) * P.strafe; }
  const hpF = h.hp / Math.max(1, h.max);
  const F = T.founts[h.tm];
  const foes = E.heroList(W).filter((o) => o.st === 0 && o.tm !== h.tm && E.seenBy(W, o, h.tm));
  const near = foes.filter((o) => dist(o, h) < 10).sort((a, b) => dist(a, h) - dist(b, h));
  const allies = E.heroList(W).filter((o) => o.st === 0 && o.tm === h.tm && o !== h);
  const ship = W.robots.find((b) => b.type === 'shp' && !b.ally && b.hp > 0);
  if (near[0] && near[0].id !== B.seen) { B.seen = near[0].id; B.seeT = W.t; }
  else if (!near[0]) B.seen = null;
  const aware = !near[0] || W.t - B.seeT > P.react * 0.8;
  const FR = T.fr || FOUNT_R;
  if (B.st !== 'back' && hpF < P.back && !(near[0] && near[0].hp < near[0].max * 0.18)) B.st = 'back';
  if (B.st === 'back' && (hpF > 0.93 || (PV && hpF > 0.75 && !near.length && h.regen > 3)) && (PV || dist(h, F) < FR)) B.st = PV ? 'go' : h.jg ? 'jungle' : 'lane';
  if (B.st === 'ship' && (!ship || W.t > B.shipUntil)) B.st = h.jg ? 'jungle' : 'lane';
  if (ship && B.st !== 'back' && B.st !== 'ship' && W.t > B.shipAt) {
    B.shipAt = W.t + 25;
    const mine = allies.length + 1, theirs = foes.length;
    const aliveFoes = E.heroList(W).filter((o) => o.tm !== h.tm && o.st === 0).length;
    if (mine >= 2 && mine > aliveFoes - 0 && ship.hp > 0 && theirs <= mine) { B.st = 'ship'; B.shipUntil = W.t + 45; }
  }
  let gx = null, gz = null, urgent = false;
  for (const z of W.zones) {
    if (z.k === 'laser' || (z.tm != null && z.tm === h.tm)) continue;
    const d = Math.hypot(h.x - z.x, h.z - z.z);
    if (d < (z.r || 2) + 1.2) { const k = 1 / (d || 1); gx = h.x + (h.x - z.x) * k * 4; gz = h.z + (h.z - z.z) * k * 4; urgent = true; break; }
  }
  if (!urgent) for (const s of W.shots) {
    if (s.side === 'h') { const ow = W.heroes[s.own]; if (!ow || ow.tm === h.tm) continue; } else if (s.tm === h.tm) continue;
    if (s.k === 'lob' || s.k === 'mega' || s.k === 'rain') continue;
    const sp = Math.hypot(s.vx, s.vz) || 1, ux = s.vx / sp, uz = s.vz / sp;
    const rx = h.x - s.x, rz = h.z - s.z, along = rx * ux + rz * uz;
    if (along < 0 || along > 7) continue;
    const perp = rx * uz - rz * ux;
    if (Math.abs(perp) > 1.1) continue;
    if (s.dodge == null) s.dodge = W.rnd() < P.dodge;
    if (!s.dodge) continue;
    const sg = perp >= 0 ? 1 : -1;
    gx = h.x + uz * sg * 3; gz = h.z - ux * sg * 3; urgent = true;
    if (E.solidAt(W.A, gx, gz)) { gx = h.x - uz * sg * 3; gz = h.z + ux * sg * 3; }
    break;
  }
  let focus = null;
  if (!urgent) {
    if (B.st === 'back') {
      gx = F.x; gz = F.z;
      if (PV) { if (!near.length && h.regen > 3 && dist(h, F) > FR) { gx = null; gz = null; } }
      else if (!near.length && dist(h, F) > 26 && !(h.recT > 0)) inp.recall = true;
      if (h.recT > 0 || inp.recall) { gx = null; gz = null; }
    } else if (PV) {
      const g = pvpGoal(W, h, B, foes, hpF);
      if (g) { gx = g.x; gz = g.z; if (g.f) focus = g.f; }
    } else if (B.st === 'ship' && ship) {
      focus = ship;
      const d = dist(h, ship), want = Math.max(4.5, H.want);
      const ux = (ship.x - h.x) / (d || 1), uz = (ship.z - h.z) / (d || 1);
      const k = d > want + 1 ? 1 : d < want - 1 ? -1 : 0;
      gx = h.x + ux * k * 3 - uz * B.strafe; gz = h.z + uz * k * 3 + ux * B.strafe;
      if (d > 14) { gx = ship.x; gz = ship.z; }
    } else if (B.st === 'jungle') {
      let camp = null, cd = 1e9;
      for (const b of W.robots) { if (b.hp <= 0 || !b.camp) continue; const C = W.tm.camps[b.camp]; if (!C || (C.cp.side !== h.tm && C.cp.side !== -1)) continue; const d = dist(b, h); if (d < cd) { cd = d; camp = b; } }
      if (camp) {
        focus = camp;
        const want = Math.max(2, H.want * 0.9);
        const ux = (camp.x - h.x) / (cd || 1), uz = (camp.z - h.z) / (cd || 1);
        const k = cd > want + 1 ? 1 : cd < want - 1 ? -1 : 0;
        gx = h.x + ux * k * 3 - uz * B.strafe * 0.85; gz = h.z + uz * k * 3 + ux * B.strafe * 0.85;
        if (cd > 10) { gx = camp.x; gz = camp.z; }
      } else { const s = towerCap(W, h, 1, laneFront(W, h.tm, 1)); const p = lanePoint(h.tm, 1, s); gx = p.x; gz = p.z; }
    } else {
      const ln = h.ln == null ? 1 : h.ln;
      const s = towerCap(W, h, ln, laneFront(W, h.tm, ln));
      const p = lanePoint(h.tm, ln, s);
      const p2 = lanePoint(h.tm, ln, s + 1);
      const ux = p2.x - p.x, uz = p2.z - p.z, L = Math.hypot(ux, uz) || 1;
      gx = p.x - (uz / L) * B.strafe; gz = p.z + (ux / L) * B.strafe;
      if (laneProgress(h.tm, ln, h.x, h.z) > s + 3 && dist(h, p) > 4) { gx = p.x; gz = p.z; urgent = true; }
    }
    if (near.length && B.st !== 'back' && aware) {
      const e = near[0];
      const eF = e.hp / Math.max(1, e.max);
      const allyN = allies.filter((o) => dist(o, h) < 11).length + 1;
      const foeN = near.length;
      const under = W.robots.some((t) => t.hp > 0 && t.tm === e.tm && (t.type === 'tow' || t.type === 'gua') && dist(t, e) < R[t.type].rng && W.robots.filter((o) => o.hp > 0 && o.tm === h.tm && !STILL.has(o.type) && dist(o, t) < R[t.type].rng).length < 2);
      const good = ((hpF > 0.42 && hpF >= eF - 0.12 && allyN >= foeN) || eF < 0.28) && !under;
      const d = dist(e, h);
      const want = H.want;
      const ux = (e.x - h.x) / (d || 1), uz = (e.z - h.z) / (d || 1);
      if (good) { const k = d > want + 1.2 ? 1 : d < want - 1.2 ? -1 : 0; gx = h.x + ux * k * 3 - uz * B.strafe * 1.15; gz = h.z + uz * k * 3 + ux * B.strafe * 1.15; focus = e; }
      else if (d < want + 2 && hpF < P.kite) { gx = h.x - ux * 3 + (F.x - h.x) * 0.08; gz = h.z - uz * 3 + (F.z - h.z) * 0.08; }
      else if (d < want + 2) { const k = d > want ? 1 : 0; gx = h.x + ux * k * 2; gz = h.z + uz * k * 2; focus = e; }
    }
  }
  if (!urgent && gx != null && B.st !== 'back' && dist(h, F) < 14 && Math.hypot(gx - h.x, gz - h.z) > 34) {
    const ln = B.st === 'jungle' ? 1 : h.ln == null ? 1 : h.ln;
    const pad = T.pads.find((p) => p.tm === h.tm && p.ln === ln);
    if (pad) { gx = pad.x; gz = pad.z; }
  }
  if (urgent && gx != null && B.dT <= 0 && E.canDash(h)) { B.dT = 0.6; if (W.rnd() < P.dash) inp.dash = Math.atan2(gx - h.x, gz - h.z); }
  if (gx != null) {
    const d = Math.hypot(gx - h.x, gz - h.z);
    if (d > 0.4) {
      const clear = d < 3 || E.losClear(W.A, h.x, h.z, gx, gz, 0.5);
      let dx = gx - h.x, dz = gz - h.z;
      if (!clear) { const st = E.flowStep(W.A, flowTo(W, gx, gz), h.x, h.z); if (st) { dx = st[0] - h.x; dz = st[1] - h.z; } }
      const L = Math.hypot(dx, dz) || 1;
      const sp = urgent ? 1 : clamp(d / 1.5, 0.35, 1);
      inp.mx = (dx / L) * sp; inp.mz = (dz / L) * sp;
    }
  }
  const rng0 = H.atk.k === 'lob' ? H.atk.rng : H.atk.rng * 1.05;
  let tgt = E.autoAim(W, h, rng0, H.atk.k !== 'lob');
  if (focus && (!tgt || (tgt.id !== focus.id && !tgt.hero))) { const d = dist(focus, h); if (d < rng0 + (focus.r || 0)) tgt = { a: Math.atan2(focus.x - h.x, focus.z - h.z), d, x: focus.x, z: focus.z, id: focus.id, hero: typeof focus.id === 'string' }; }
  if (tgt && B.st === 'back' && !tgt.hero) tgt = null;
  if (tgt && tgt.hero && !aware) tgt = null;
  if (tgt) {
    const o = typeof tgt.id === 'string' ? W.heroes[tgt.id] : W.robots.find((r) => r.id === tgt.id);
    const lead = H.atk.k === 'lob' ? H.atk.flight : tgt.d / (H.atk.spd || 30);
    const vx = o ? (o.vx != null ? o.vx : o.mv ? Math.sin(o.yaw) * o.mv : 0) : 0, vz = o ? (o.vz != null ? o.vz : o.mv ? Math.cos(o.yaw) * o.mv : 0) : 0;
    const tx = tgt.x + vx * lead * P.lead, tz = tgt.z + vz * lead * P.lead;
    const a = Math.atan2(tx - h.x, tz - h.z) + (tgt.hero ? (W.rnd() * 2 - 1) * P.err : 0), d2 = Math.hypot(tx - h.x, tz - h.z);
    inp.aiming = true; inp.aimA = a;
    const supR = H.sup.rng || H.sup.rad || 8;
    const cnt = W.robots.filter((r) => r.hp > 0 && E.foeTo(h, r) && !STILL.has(r.type) && Math.hypot(r.x - h.x, r.z - h.z) < supR * 0.85).length + near.filter((o) => dist(o, h) < supR * 0.85).length * 2;
    if (h.sup >= 1 && H.sup.k !== 'bloom' && B.t <= 0 && W.rnd() < P.sup && (cnt >= 3 || (tgt.hero && tgt.d < supR * 0.85) || (focus && focus.type === 'shp'))) { inp.fire = { kind: 'sup', a, dist: d2 }; B.t = P.react; }
    else if (E.canFire(h) && d2 < H.atk.rng * (H.atk.k === 'lob' ? 1 : 0.98) && B.t <= 0) { inp.fire = { kind: 'atk', a, dist: d2 }; B.t = P.react + W.rnd() * P.jit; }
  }
  if (h.sup >= 1 && H.sup.k === 'bloom' && allies.some((o) => dist(o, h) < H.sup.rad && o.hp < o.max * 0.55)) inp.fire = { kind: 'sup', a: h.yaw, dist: 0 };
  if (B.gT <= 0 && E.canGadget(h)) {
    B.gT = (0.8 + W.rnd() * 0.9) / Math.max(0.3, P.gad);
    const G = H.gad;
    const close = near.filter((o) => dist(o, h) < 4.2).length + W.robots.filter((r) => r.hp > 0 && E.foeTo(h, r) && !STILL.has(r.type) && Math.hypot(r.x - h.x, r.z - h.z) < 3.9).length * 0.5;
    let use = false, ga = tgt ? tgt.a : h.yaw, gd = tgt ? tgt.d : null;
    if (G.k === 'ring' || G.k === 'nova') use = close >= 1.5;
    else if (G.k === 'decoy') use = hpF < 0.5 && near.length > 0;
    else if (G.k === 'mine') use = near.length > 0 && W.rnd() < 0.4;
    else if (G.k === 'bubble') use = near.length > 0 && (hpF < 0.6 || allies.some((o) => dist(o, h) < G.rad && o.hp < o.max * 0.6));
    else if (G.k === 'charge') use = !!tgt && tgt.hero && tgt.d > 2.4 && tgt.d < 6;
    else if (G.k === 'over') use = near.length > 0 || close >= 2;
    else if (G.k === 'jet' && near.length && hpF < (W.tm.bl === 2 ? 0.35 : 0.22)) { use = W.tm.bl > 0; ga = Math.atan2(h.x - near[0].x, h.z - near[0].z); gd = G.len; }
    else if (G.k === 'vanish') use = (hpF < 0.4 && near.length > 0 && W.rnd() < 0.5) || (W.tm.bl === 2 && !!tgt && tgt.hero && tgt.d > 4.5 && tgt.d < 9 && hpF > 0.6 && W.rnd() < 0.5);
    if (use && W.rnd() < Math.max(0.35, P.gad)) inp.gad = { a: ga, dist: gd };
  }
  if (B.skT <= 0 && !(h.skCD > 0)) {
    B.skT = 0.6;
    const sk = h.sk;
    const e = near[0];
    let want = null;
    if (sk === 'mend' && hpF < 0.42) want = h.yaw;
    else if (sk === 'guard' && e && dist(e, h) < 7 && (hpF < 0.55 || allies.some((o) => dist(o, h) < 4 && o.hp < o.max * 0.5))) want = h.yaw;
    else if (sk === 'blink' && !h.gate && e && hpF > 0.6 && dist(e, h) < 9 && B.st !== 'back') want = h.yaw;
    else if (sk === 'blink' && h.gate && hpF < 0.32) want = h.yaw;
    else if (sk === 'sprint' && ((B.st === 'back' && dist(h, F) > 22 && !(h.recT > 0)) || (e && e.hp < e.max * 0.3 && dist(e, h) > 4))) want = h.yaw;
    else if (sk === 'shock' && hpF > 0.45 && near.filter((o) => dist(o, h) < 4.8 && dist(o, h) > 2.2).length >= 1 && allies.some((o) => dist(o, h) < 7)) want = h.yaw;
    else if (sk === 'hunter') {
      const b = W.robots.find((r) => r.hp > 0 && (r.camp || r.type === 'shp' || r.type === 'sie') && r.tm !== h.tm && dist(r, h) < 8 && r.hp < (r.type === 'shp' ? r.max : r.max * 0.7));
      if (b) want = Math.atan2(b.x - h.x, b.z - h.z);
    }
    if (want != null && W.rnd() < P.sk) inp.skill = want;
  }
  return inp;
}
