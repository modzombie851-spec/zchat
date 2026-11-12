import { mkNet, netPush, netRead } from './netlerp.js';
export const TILE = 2;
export let SQUAD_MAX = 10;
export function setSquadMax(n) { SQUAD_MAX = Math.max(1, n | 0); }
export const heroCap = () => (SQUAD_MAX > 16 ? 3 : 2);
export const DASH = { len: 4.2, t: 0.18, cd: 3.2 };
export const GADGETS = 3, GADGET_CD = 5;
export const WIN_WAVE = 15;
export const DOWN_T = 15;
export const REVIVE_T = 2.4;
export const REVIVE_R = 2.4;
const TAU = Math.PI * 2;
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const wrapA = (a) => { let v = a; while (v > Math.PI) v -= TAU; while (v < -Math.PI) v += TAU; return v; };
export const dirOf = (a) => [Math.sin(a), Math.cos(a)];
export const angTo = (x0, z0, x1, z1) => Math.atan2(x1 - x0, z1 - z0);
export function rngOf(seed) {
  let s = (seed >>> 0) || 1;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export const HEROES = {
  blaze: {
    name: 'Blaze', role: 'Blaster', text: 'A wide spread of shots. Hits hard up close.', hp: 4200, spd: 5.5, col: '#FF7A2E', want: 4.2, stats: [4, 4, 2, 3],
    atk: { k: 'spread', n: 5, arc: 0.52, rng: 7.6, spd: 27, dmg: 300, w: 0.32, reload: 1.3, cd: 0.4 },
    sup: { k: 'wave', n: 9, arc: 0.9, rng: 9.6, spd: 23, dmg: 430, w: 0.42, kb: 10, need: 3000, name: 'Shockwave', text: 'A huge blast that throws robots back.' },
    gad: { k: 'ring', rad: 3.4, dmg: 760, kb: 8, name: 'Flame ring', text: 'Fire bursts out all around him.' },
  },
  pip: {
    name: 'Pip', role: 'Sniper', text: 'One long shot that hits far away.', hp: 2900, spd: 5.3, col: '#29C48E', want: 11, stats: [2, 4, 5, 3],
    atk: { k: 'bolt', rng: 18, spd: 40, dmg: 1150, w: 0.4, reload: 1.65, cd: 0.5 },
    sup: { k: 'beam', rng: 26, dmg: 1900, w: 0.95, need: 3600, name: 'Rail beam', text: 'A beam that cuts through every robot in a line.' },
    gad: { k: 'decoy', t: 4.5, name: 'Decoy', text: 'A cardboard Pip that robots chase.' },
  },
  boom: {
    name: 'Boom', role: 'Bomber', text: 'Throws bombs over walls.', hp: 3100, spd: 5.1, col: '#8D5BFF', want: 7.5, stats: [2, 4, 4, 2],
    atk: { k: 'lob', rng: 12, flight: 0.7, rad: 2.3, dmg: 960, reload: 1.6, cd: 0.45 },
    sup: { k: 'mega', rng: 13, flight: 0.95, rad: 4.6, dmg: 2100, kb: 11, need: 3800, name: 'Mega bomb', text: 'A giant bomb with a wide blast.' },
    gad: { k: 'mine', rad: 2.6, dmg: 1500, t: 14, name: 'Sticky mine', text: 'Blows up when a robot steps on it.' },
  },
  mira: {
    name: 'Mira', role: 'Healer', text: 'Her orb hurts robots and heals friends.', hp: 3500, spd: 5.4, col: '#FF5FA2', want: 6, stats: [3, 2, 3, 3],
    atk: { k: 'orb', rng: 11, spd: 16, dmg: 620, heal: 560, w: 0.75, reload: 1.45, cd: 0.45 },
    sup: { k: 'bloom', rad: 7, heal: 2000, dmg: 520, kb: 7, need: 2600, name: 'Bloom', text: 'Heals and revives friends close to her.' },
    gad: { k: 'bubble', rad: 5.5, shield: 1100, t: 4, name: 'Bubble shield', text: 'Shields her and friends near her.' },
  },
  rex: {
    name: 'Rex', role: 'Brawler', text: 'Smashes robots up close with a heavy hammer.', hp: 5600, spd: 5.2, col: '#E0533A', want: 2.3, stats: [5, 5, 1, 3],
    atk: { k: 'smash', rng: 3.1, arc: 1.7, dmg: 1250, kb: 5, reload: 1.25, cd: 0.45 },
    sup: { k: 'slam', rad: 4.6, dmg: 1600, stun: 1.6, kb: 4, need: 3200, name: 'Ground slam', text: 'Stuns every robot around him.' },
    gad: { k: 'charge', len: 6.2, t: 0.32, dmg: 650, kb: 9, name: 'Charge', text: 'Rushes forward and knocks robots aside.' },
  },
  volt: {
    name: 'Volt', role: 'Engineer', text: 'His zap jumps from robot to robot.', hp: 3300, spd: 5.4, col: '#F2C230', want: 7, stats: [3, 3, 4, 3],
    atk: { k: 'zap', rng: 9.5, dmg: 560, chain: 2, hop: 4.2, reload: 1.35, cd: 0.4 },
    sup: { k: 'turret', rad: 6.5, dmg: 320, life: 9, rate: 0.45, need: 3300, name: 'Tesla tower', text: 'Builds a tower that zaps robots for a while.' },
    gad: { k: 'over', t: 5, name: 'Overcharge', text: 'Zaps jump further and reload faster.' },
  },
  kai: {
    name: 'Kai', role: 'Rocketeer', text: 'Rockets that blow up on impact.', hp: 3200, spd: 5.3, col: '#3FA2F0', want: 8.5, stats: [3, 4, 4, 3],
    atk: { k: 'rocket', rng: 13, spd: 21, dmg: 780, rad: 1.7, w: 0.42, reload: 1.55, cd: 0.5 },
    sup: { k: 'barrage', rng: 12, n: 7, rad: 2.1, dmg: 900, flight: 0.75, need: 3500, name: 'Rocket rain', text: 'A storm of rockets falls on one spot.' },
    gad: { k: 'jet', len: 7, t: 0.55, dmg: 800, rad: 2.6, name: 'Jet jump', text: 'Leaps over walls and blasts where he lands.' },
  },
  ivy: {
    name: 'Ivy', role: 'Frost mage', text: 'Ice shards that slow robots down.', hp: 3000, spd: 5.6, col: '#7FD7FF', want: 8, stats: [2, 3, 4, 4],
    atk: { k: 'shard', n: 3, arc: 0.22, rng: 11, spd: 30, dmg: 380, w: 0.3, slow: 0.45, slowT: 1.6, reload: 1.3, cd: 0.42 },
    sup: { k: 'freeze', rad: 6.2, dmg: 700, stun: 2.6, need: 3000, name: 'Deep freeze', text: 'Freezes every robot near her solid.' },
    gad: { k: 'nova', rad: 4.4, dmg: 420, slow: 0.6, slowT: 3, name: 'Frost nova', text: 'A burst of cold slows robots around her.' },
  },
};
export const HERO_KEYS = ['blaze', 'pip', 'boom', 'mira', 'rex', 'volt', 'kai', 'ivy'];
export const MAX_LEVEL = 10;
export const levelCost = (lv) => 80 * lv;
export const levelMods = (lv) => { const L = clamp(lv | 0, 1, MAX_LEVEL); return { hp: 1 + 0.06 * (L - 1), dmg: 1 + 0.05 * (L - 1) }; };
export const CARDS = {
  tough: { name: 'Tough', text: 'More health', icon: 'heart', go: (m) => { m.hp *= 1.15; } },
  power: { name: 'Power', text: 'More damage', icon: 'flame', go: (m) => { m.dmg *= 1.12; } },
  reload: { name: 'Quick reload', text: 'Ammo comes back faster', icon: 'replay', go: (m) => { m.reload *= 1.2; } },
  swift: { name: 'Swift', text: 'Move faster', icon: 'dash', go: (m) => { m.spd *= 1.08; } },
  charge: { name: 'Super charge', text: 'Super fills faster', icon: 'bolt', go: (m) => { m.supRate *= 1.22; } },
  ammo: { name: 'Extra ammo', text: 'One more shot in your bar', icon: 'plus', go: (m) => { m.ammo = Math.min(5, m.ammo + 1); }, max: 2 },
  life: { name: 'Lifesteal', text: 'Heal a little when you hit robots', icon: 'heart', go: (m) => { m.life += 0.06; } },
  regen: { name: 'Regen', text: 'Heal faster out of a fight', icon: 'plus', go: (m) => { m.regen *= 1.6; } },
  armor: { name: 'Armor', text: 'Take less damage', icon: 'shield', go: (m) => { m.armor = Math.min(0.45, m.armor + 0.1); } },
  dash: { name: 'Dash master', text: 'Dash comes back faster', icon: 'dash', go: (m) => { m.dashCd *= 0.72; } },
  gadget: { name: 'Gadget master', text: 'One more gadget use', icon: 'magnet', go: (m, h) => { h.gad += 1; } },
  lucky: { name: 'Lucky', text: 'Power ups work better', icon: 'crown', go: (m) => { m.luck += 0.4; } },
  blaze: { hero: 'blaze', name: 'Wide spread', text: 'Two more pellets each shot', icon: 'flame', go: (m) => { m.extra += 2; }, max: 2 },
  pip: { hero: 'pip', name: 'Piercing shot', text: 'Shots go through robots', icon: 'bolt', go: (m) => { m.pierce += 1; }, max: 2 },
  boom: { hero: 'boom', name: 'Big bombs', text: 'Bigger blasts', icon: 'bomb', go: (m) => { m.rad *= 1.22; }, max: 2 },
  mira: { hero: 'mira', name: 'Warm heart', text: 'Heals friends more', icon: 'heart', go: (m) => { m.heal *= 1.35; } },
  rex: { hero: 'rex', name: 'Heavy hammer', text: 'Longer stuns', icon: 'hammer', go: (m) => { m.stun *= 1.4; }, max: 2 },
  volt: { hero: 'volt', name: 'Long arc', text: 'Zaps hit one more robot', icon: 'bolt', go: (m) => { m.extra += 1; }, max: 3 },
  kai: { hero: 'kai', name: 'Cluster rockets', text: 'Rockets blast a bigger area', icon: 'rocket', go: (m) => { m.rad *= 1.25; }, max: 2 },
  ivy: { hero: 'ivy', name: 'Deep chill', text: 'Slows last longer', icon: 'snow', go: (m) => { m.slow *= 1.4; }, max: 2 },
  crit: { name: 'Lucky shot', text: 'Some shots hit twice as hard', icon: 'star', go: (m) => { m.crit = Math.min(0.36, (m.crit || 0) + 0.12); }, max: 3 },
  chain: { name: 'Chain blast', text: 'Robots you take down explode', icon: 'bomb', go: (m) => { m.chain = (m.chain || 0) + 1; }, max: 2 },
  rush: { name: 'Kill rush', text: 'Run faster for a moment after a takedown', icon: 'dash', go: (m) => { m.rush = (m.rush || 0) + 1; }, max: 2 },
  magnet: { name: 'Magnet', text: 'Grab power ups from farther away', icon: 'magnet', go: (m) => { m.magnet = (m.magnet || 0) + 1.3; }, max: 2 },
  guard: { name: 'Super guard', text: 'Your super also gives you a shield', icon: 'shield', go: (m) => { m.supShield = (m.supShield || 0) + 0.2; }, max: 2 },
  medic: { name: 'Field medic', text: 'Help friends up much faster', icon: 'heart', go: (m) => { m.revive = (m.revive || 1) * 1.6; }, max: 2 },
};
export const CARD_KEYS = Object.keys(CARDS);
export const cardWave = (n) => n > 0 && n % 2 === 0;
export function cardChoices(h, rnd) {
  const have = {};
  for (const k of h.cards || []) have[k] = (have[k] || 0) + 1;
  const pool = CARD_KEYS.filter((k) => { const C = CARDS[k]; if (C.hero && C.hero !== h.key) return false; return !C.max || (have[k] || 0) < C.max; });
  const out = [];
  if (pool.includes(h.key) && rnd() < 0.55) out.push(h.key);
  while (out.length < 3 && out.length < pool.length) { const k = pool[Math.floor(rnd() * pool.length)]; if (!out.includes(k)) out.push(k); }
  return out;
}
export function applyCard(h, k) {
  const C = CARDS[k];
  if (!C || !h) return false;
  C.go(h.mods, h);
  (h.cards || (h.cards = [])).push(k);
  refreshMax(h);
  return true;
}
export function refreshMax(h) {
  const H = HEROES[h.key];
  const nm = Math.round(H.hp * h.mods.hp);
  if (nm !== h.max) { h.hp = Math.max(1, h.hp + (nm - h.max)); h.max = nm; }
}

export const ROBOTS = {
  grunt: { name: 'Scrapper', hp: 1000, spd: 3.6, r: 0.62, dmg: 430, rng: 1.45, wind: 0.36, cd: 1.05, pts: 10, drop: 0.06 },
  shooter: { name: 'Zapper', hp: 760, spd: 3.1, r: 0.56, dmg: 360, rng: 10, cd: 1.75, bspd: 13, pts: 15, drop: 0.08 },
  bomber: { name: 'Boomer', hp: 620, spd: 5.1, r: 0.56, dmg: 1250, rad: 2.7, fuse: 0.7, pts: 15, drop: 0.06 },
  tank: { name: 'Bulwark', hp: 3800, spd: 2.25, r: 0.98, dmg: 270, rng: 9, cd: 2.7, burst: 3, bspd: 11.5, shield: 0.25, pts: 40, drop: 0.3 },
  boss: { name: 'Scrap King', hp: 30000, spd: 2.1, r: 1.75, dmg: 1300, pts: 400, drop: 1 },
};
export const ROBOT_KEYS = ['grunt', 'shooter', 'bomber', 'tank', 'boss'];

export const LEVELS = {
  easy: { name: 'Easy', hp: 0.62, dmg: 0.56, n: 0.8 },
  normal: { name: 'Normal', hp: 1, dmg: 1, n: 1 },
  hard: { name: 'Hard', hp: 1.32, dmg: 1.28, n: 1.18 },
};
export const LEVEL_KEYS = ['easy', 'normal', 'hard'];
export const DROPS = { hp: { name: 'Health' }, pw: { name: 'Power' }, su: { name: 'Super' }, sh: { name: 'Shield' }, rf: { name: 'Rapid fire' }, sp: { name: 'Speed' } };
export const DROP_KEYS = ['hp', 'pw', 'su', 'sh', 'rf', 'sp'];

const ARENA_DEF = {
  yard: {
    name: 'Scrap yard', theme: 'yard',
    rows: [
      '##################', '#S.......bb.......', '#........bb...##..', '#..xx.........#...', '#..x.....ww......S', '#........ww.......',
      '#....##.......bb..', '#.....#.......bb..', '#bb..........#....', '#bb..........#....', '#S.....xx.........', '#......x....ww....',
      '#...........ww....', '#..##.............', '#...#....bb...xx..', '#........bb.......', '#S..............bb', '#....x..##........',
      '#....x...#........', '#.................', '#bb.....ww...x....', '#bb.....ww...x....', '#.................', '#....xx......bb...',
      '#............bb..P', '##################',
    ],
  },
  ruins: {
    name: 'Jungle temple', theme: 'ruins',
    rows: [
      '##################', '#S......bb......S.', '#.......bb........', '#..##........##...', '#..#..........#...', '#.......ww........',
      '#bb.....ww....bb..', '#bb...........bb..', '#....x............', '#....x.....#......', '#S.........#....xx', '#....bb.........xx',
      '#....bb..ww.......', '#........ww.......', '#..##.............', '#..#.....bb...#...', '#S.......bb...#...', '#.................',
      '#....x......bb....', '#....x..##..bb....', '#bb......#........', '#bb...............', '#.....bb....x.....', '#.....bb....x.....',
      '#................P', '##################',
    ],
  },
  frost: {
    name: 'Frost base', theme: 'frost',
    rows: [
      '##################', '#S.......#......S.', '#........#........', '#..bb.............', '#..bb...xx....ww..', '#.......x.....ww..',
      '#..............#..', '#.##...........#..', '#.#.....bb........', '#S......bb.....xx.', '#..........##.....', '#.....ww...#......',
      '#.....ww..........', '#..x...........bb.', '#..x...##......bb.', '#........#........', '#S...bb...........', '#....bb.....xx....',
      '#...........x.....', '#..##.............', '#...#....ww...bb..', '#........ww...bb..', '#.................', '#....x......x.....',
      '#....x...........P', '##################',
    ],
  },
  lava: {
    name: 'Lava foundry', theme: 'lava',
    rows: [
      '##################', '#S......xx......S.', '#.................', '#..##....bb...##..', '#...#....bb....#..', '#.......ww........',
      '#bb.....ww...x....', '#bb..........x....', '#....##...........', '#....#.....bb.....', '#S.........bb...ww', '#...x...........ww',
      '#...x...##........', '#........#....bb..', '#.............bb..', '#bb..ww...........', '#S...ww.....x.....', '#...........x.....',
      '#..##.....bb......', '#...#.....bb...##.', '#..............#..', '#.....x...........', '#bb...x.....ww....', '#bb.........ww....',
      '#................P', '##################',
    ],
  },
  docks: {
    name: 'Harbor docks', theme: 'docks',
    rows: [
      '##################', '#S.....ww.......S.', '#......ww.........', '#..xx..ww...bb....', '#..x........bb....', '#.........##......',
      '#bb.......#....www', '#bb............www', '#....##...........', '#.....#.....x.....', '#S..........x.....', '#wwww......bb.....',
      '#wwww......bb.....', '#...........##....', '#..bb.........#...', '#..bb.............', '#S.......ww.......', '#........ww...bb..',
      '#....x.......bb...', '#..##x............', '#..#.......ww.....', '#..........ww.....', '#bb...............', '#bb.....x.....x...',
      '#................P', '##################',
    ],
  },
};
export const ARENA_KEYS = ['yard', 'ruins', 'frost', 'lava', 'docks'];
export const ARENAS = Object.fromEntries(ARENA_KEYS.map((k) => [k, { name: ARENA_DEF[k].name, theme: ARENA_DEF[k].theme }]));
const CODE = { '.': 0, '#': 1, x: 2, b: 3, w: 4, S: 5, P: 6 };
export const C_FLOOR = 0, C_WALL = 1, C_CRATE = 2, C_BUSH = 3, C_WATER = 4, C_PAD = 5, C_HOME = 6;

export function makeArena(key) {
  const D = ARENA_DEF[key] || ARENA_DEF.yard;
  const rows = D.rows.map((r) => r + r.split('').reverse().join(''));
  const H = rows.length, W = rows[0].length;
  const cells = new Uint8Array(W * H);
  const pads = [], homes = [], bushes = [];
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    const v = CODE[rows[r][c]] || 0;
    cells[r * W + c] = v;
    const p = { c, r, x: (c + 0.5) * TILE, z: (r + 0.5) * TILE };
    if (v === C_PAD) pads.push(p); else if (v === C_HOME) homes.push(p); else if (v === C_BUSH) bushes.push(p);
  }
  const A = { key: ARENA_DEF[key] ? key : 'yard', name: D.name, theme: D.theme, W, H, cells, pads, homes, bushes, wx: W * TILE, wz: H * TILE, flows: new Map() };
  A.clusters = bushClusters(A);
  return A;
}
function bushClusters(A) {
  const seen = new Uint8Array(A.W * A.H), out = [];
  for (const b of A.bushes) {
    const i0 = b.r * A.W + b.c;
    if (seen[i0]) continue;
    const list = [], q = [i0];
    seen[i0] = 1;
    while (q.length) {
      const i = q.pop(); const c = i % A.W, r = (i / A.W) | 0;
      list.push({ c, r });
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const c2 = c + dc, r2 = r + dr;
        if (c2 < 0 || r2 < 0 || c2 >= A.W || r2 >= A.H) continue;
        const j = r2 * A.W + c2;
        if (!seen[j] && A.cells[j] === C_BUSH) { seen[j] = 1; q.push(j); }
      }
    }
    out.push(list);
  }
  return out;
}
export const cellIdx = (A, x, z) => { const c = Math.floor(x / TILE), r = Math.floor(z / TILE); return c < 0 || r < 0 || c >= A.W || r >= A.H ? -1 : r * A.W + c; };
export const cellOf = (A, x, z) => { const i = cellIdx(A, x, z); return i < 0 ? C_WALL : A.cells[i]; };
const solidCode = (v) => v === C_WALL || v === C_CRATE || v === C_WATER;
const blockCode = (v) => v === C_WALL || v === C_CRATE;
export const solidAt = (A, x, z) => solidCode(cellOf(A, x, z));
export const blockAt = (A, x, z) => blockCode(cellOf(A, x, z));
export const bushAt = (A, x, z) => cellOf(A, x, z) === C_BUSH;
const solidRC = (A, c, r) => (c < 0 || r < 0 || c >= A.W || r >= A.H ? true : solidCode(A.cells[r * A.W + c]));

function pushOut(A, o, rad) {
  const c0 = Math.floor((o.x - rad) / TILE), c1 = Math.floor((o.x + rad) / TILE);
  const r0 = Math.floor((o.z - rad) / TILE), r1 = Math.floor((o.z + rad) / TILE);
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
    if (!solidRC(A, c, r)) continue;
    const bx0 = c * TILE, bx1 = bx0 + TILE, bz0 = r * TILE, bz1 = bz0 + TILE;
    const px = clamp(o.x, bx0, bx1), pz = clamp(o.z, bz0, bz1);
    const ex = o.x - px, ez = o.z - pz, d2 = ex * ex + ez * ez;
    if (d2 >= rad * rad) continue;
    if (d2 > 1e-10) { const d = Math.sqrt(d2), k = (rad - d) / d; o.x += ex * k; o.z += ez * k; }
    else {
      const l = o.x - bx0, rr = bx1 - o.x, t = o.z - bz0, b = bz1 - o.z, m = Math.min(l, rr, t, b);
      if (m === l) o.x = bx0 - rad; else if (m === rr) o.x = bx1 + rad; else if (m === t) o.z = bz0 - rad; else o.z = bz1 + rad;
    }
  }
}
export function moveCircle(A, o, dx, dz, rad) {
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dz)) / (rad * 0.7)));
  for (let i = 0; i < n; i++) { o.x += dx / n; pushOut(A, o, rad); o.z += dz / n; pushOut(A, o, rad); }
  o.x = clamp(o.x, rad, A.wx - rad); o.z = clamp(o.z, rad, A.wz - rad);
}
export function rayWall(A, x, z, dx, dz, maxD) {
  const st = 0.2;
  for (let d = st; d <= maxD; d += st) if (blockAt(A, x + dx * d, z + dz * d)) return d - st * 0.5;
  return maxD;
}
export function losClear(A, x0, z0, x1, z1, wide = 0) {
  const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz);
  if (L < 0.01) return true;
  const ux = dx / L, uz = dz / L, n = Math.ceil(L / 0.4);
  for (let i = 1; i < n; i++) {
    const d = (i / n) * L, x = x0 + ux * d, z = z0 + uz * d;
    if (blockAt(A, x, z)) return false;
    if (wide > 0 && (blockAt(A, x - uz * wide, z + ux * wide) || blockAt(A, x + uz * wide, z - ux * wide))) return false;
  }
  return true;
}
function walkClear(A, x0, z0, x1, z1, wide) {
  const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz);
  if (L < 0.01) return true;
  const ux = dx / L, uz = dz / L, n = Math.ceil(L / 0.45);
  for (let i = 1; i <= n; i++) {
    const d = (i / n) * L, x = x0 + ux * d, z = z0 + uz * d;
    if (solidAt(A, x, z) || solidAt(A, x - uz * wide, z + ux * wide) || solidAt(A, x + uz * wide, z - ux * wide)) return false;
  }
  return true;
}

const NB = [[1, 0, 10], [-1, 0, 10], [0, 1, 10], [0, -1, 10], [1, 1, 14], [1, -1, 14], [-1, 1, 14], [-1, -1, 14]];
export function flowFrom(A, x, z) {
  const W = A.W, H = A.H, N = W * H;
  const dist = new Int32Array(N).fill(1e9);
  let c0 = clamp(Math.floor(x / TILE), 0, W - 1), r0 = clamp(Math.floor(z / TILE), 0, H - 1);
  if (solidRC(A, c0, r0)) {
    let best = -1, bd = 1e9;
    for (let r = Math.max(0, r0 - 2); r <= Math.min(H - 1, r0 + 2); r++) for (let c = Math.max(0, c0 - 2); c <= Math.min(W - 1, c0 + 2); c++) {
      if (solidRC(A, c, r)) continue;
      const d = (c - c0) ** 2 + (r - r0) ** 2;
      if (d < bd) { bd = d; best = r * W + c; }
    }
    if (best < 0) return { dist, x, z };
    c0 = best % W; r0 = (best / W) | 0;
  }
  const heap = [];
  const push = (d, i) => { heap.push([d, i]); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = k * 2 + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
  dist[r0 * W + c0] = 0; push(0, r0 * W + c0);
  while (heap.length) {
    const [d, i] = pop();
    if (d > dist[i]) continue;
    const c = i % W, r = (i / W) | 0;
    for (const [dc, dr, w] of NB) {
      const c2 = c + dc, r2 = r + dr;
      if (solidRC(A, c2, r2)) continue;
      if (dc && dr && (solidRC(A, c + dc, r) || solidRC(A, c, r + dr))) continue;
      const j = r2 * W + c2, nd = d + w;
      if (nd < dist[j]) { dist[j] = nd; push(nd, j); }
    }
  }
  return { dist, x, z };
}
export function flowStep(A, F, x, z) {
  const W = A.W;
  const c = Math.floor(x / TILE), r = Math.floor(z / TILE);
  if (c < 0 || r < 0 || c >= W || r >= A.H) return null;
  const here = F.dist[r * W + c];
  if (here === 0) return [F.x, F.z];
  let best = here, bx = null, bz = null;
  for (const [dc, dr] of NB) {
    const c2 = c + dc, r2 = r + dr;
    if (solidRC(A, c2, r2)) continue;
    if (dc && dr && (solidRC(A, c + dc, r) || solidRC(A, c, r + dr))) continue;
    const d = F.dist[r2 * W + c2];
    if (d < best) { best = d; bx = (c2 + 0.5) * TILE; bz = (r2 + 0.5) * TILE; }
  }
  if (bx == null) return here < 1e9 ? [F.x, F.z] : null;
  return [bx, bz];
}

export function baseMods() { return { hp: 1, dmg: 1, reload: 1, spd: 1, supRate: 1, ammo: 3, life: 0, regen: 1, armor: 0, dashCd: 1, luck: 0, extra: 0, pierce: 0, rad: 1, heal: 1, stun: 1, slow: 1 }; }
export function mkHero(id, key, x, z, bot = false, level = 1) {
  const H = HEROES[key] || HEROES.blaze;
  const L = clamp(level | 0, 1, MAX_LEVEL);
  const mods = baseMods();
  const lm = levelMods(L);
  mods.hp = lm.hp; mods.dmg = lm.dmg;
  const max = Math.round(H.hp * mods.hp);
  return {
    id, key: HEROES[key] ? key : 'blaze', bot, x, z, yaw: Math.PI, hp: max, max, st: 0, ammo: 3, sup: 0, cd: 0, regen: 0, downT: 0, rv: 0,
    vx: 0, vz: 0, walk: 0, hid: false, seen: 0, pw: 0, aimT: 0, aimA: Math.PI, flash: 0, rec: 0, hp0: H.hp, lv: L, mods, cards: [],
    gad: GADGETS, gadCD: 0, dashT: 0, dashCD: 0, dashVx: 0, dashVz: 0, shield: 0, shT: 0, ocT: 0, rfT: 0, spT: 0, jump: null, lastBy: null,
    stats: { kills: 0, dmg: 0, rev: 0, heal: 0 },
  };
}
const SPAWN_OFF = [[-1.1, 0], [1.1, 0], [-1.1, -1.8], [1.1, -1.8], [-3.2, -0.5], [3.2, -0.5], [-3.1, -2.4], [3.1, -2.4], [-1.1, -3.6], [1.1, -3.6]];
export function heroSpawn(A, i) {
  const h = A.homes.length ? A.homes : [{ x: A.wx / 2, z: A.wz - 3 }];
  const cx = h.reduce((s, p) => s + p.x, 0) / h.length, cz = h.reduce((s, p) => s + p.z, 0) / h.length;
  const off = SPAWN_OFF[i % SPAWN_OFF.length];
  const p = { x: cx + off[0], z: cz + off[1] };
  pushOut(A, p, 0.6);
  return p;
}
export const teamScale = (p) => { const n = clamp(p, 1, SQUAD_MAX); return Math.min(n, 4) + Math.max(0, n - 4) * 0.55; };

export function waveSpec(n, players, lvKey, seed) {
  const L = LEVELS[lvKey] || LEVELS.normal;
  const rnd = rngOf((seed || 7) * 131 + n * 977);
  const boss = n % 5 === 0;
  const ts = teamScale(players);
  const scale = (0.62 + 0.38 * ts) * L.n;
  const list = [];
  const pool = [['grunt', 5]];
  if (n >= 2) pool.push(['shooter', 2.4 + n * 0.12]);
  if (n >= 3) pool.push(['bomber', 1.5 + n * 0.08]);
  if (n >= 4) pool.push(['tank', 0.7 + n * 0.06]);
  const tot = pool.reduce((s, p) => s + p[1], 0);
  const pick = () => { let v = rnd() * tot; for (const [k, w] of pool) { v -= w; if (v <= 0) return k; } return 'grunt'; };
  const count = Math.max(3, Math.round((boss ? 3 + n * 0.55 : 4 + 2.1 * n) * scale));
  if (boss) list.push('boss');
  for (let i = 0; i < count; i++) list.push(i < 2 && n < 3 ? 'grunt' : pick());
  return {
    n, list, boss,
    hpMul: (1 + 0.11 * (n - 1)) * L.hp, dmgMul: L.dmg * (1 + 0.025 * (n - 1)), bossMul: (0.5 + 0.4 * ts) * (1 + 0.35 * (Math.floor(n / 5) - 1)),
    gap: Math.max(0.24, (0.95 - n * 0.04) / (1 + Math.max(0, ts - 4) * 0.18)), maxAlive: Math.round((7 + 3 * ts) * Math.min(1.4, 1 + n * 0.02)),
  };
}

export function mkRobot(id, type, x, z, spec) {
  const R = ROBOTS[type] || ROBOTS.grunt;
  const hpMul = spec ? spec.hpMul * (type === 'boss' ? spec.bossMul : 1) : 1;
  const hp = Math.round(R.hp * hpMul / 10) * 10;
  return { id, type: ROBOTS[type] ? type : 'grunt', x, z, yaw: 0, hp, max: hp, r: R.r, dmgMul: spec ? spec.dmgMul : 1, sp: 0.7, cd: 0.6 + (id % 5) * 0.15, wind: 0, fuse: 0, tg: null, think: 0, flash: 0, kbx: 0, kbz: 0, walk: 0, burst: 0, burstT: 0, atkT: 2.5, cyc: 0, busy: 0, act: null, mv: 0, hitAt: 0, lastHit: null };
}

export function newWorld(arenaKey, lvKey, seed, opt = {}) {
  const A = makeArena(arenaKey);
  return {
    A, lv: LEVELS[lvKey] ? lvKey : 'normal', seed: seed || 1, endless: !!opt.endless, t: 0,
    heroes: {}, order: [], robots: [], shots: [], zones: [], drops: [], fxq: [], turrets: [], mines: [], decoys: [], pend: [], gid: 1,
    wave: { n: 0, st: 'intro', t: 3.2, queue: [], spawnT: 0, spec: null, left: 0 },
    nextId: 1, dropId: 1, ev: [], net: [], flows: {}, flowT: 0, rnd: rngOf(seed || 1), over: null, score: 0, allDownT: 0,
  };
}
export const aliveHero = (h) => !!h && h.st === 0;
export function heroList(W) { return W.order.map((k) => W.heroes[k]).filter(Boolean); }

function emit(W, e) { W.ev.push(e); }
function net(W, e) { W.net.push(e); }

export function hurtHero(W, h, d, src) {
  if (!h || h.st !== 0 || !(d > 0)) return 0;
  if (h.dashT > 0 || h.jump) { emit(W, { k: 'dodge', id: h.id, x: h.x, z: h.z }); return 0; }
  let dd = Math.round(d * (1 - (h.mods ? h.mods.armor : 0)));
  if (h.shield > 0) { const a = Math.min(h.shield, dd); h.shield -= a; dd -= a; emit(W, { k: 'shieldHit', id: h.id, x: h.x, z: h.z, d: a }); if (dd <= 0) return 0; }
  h.hp -= dd; h.regen = 0; h.flash = 0.12; h.lastBy = src;
  emit(W, { k: 'hurtH', id: h.id, d: dd, x: h.x, z: h.z, src });
  if (h.hp <= 0) { h.hp = 0; h.st = 1; h.downT = DOWN_T; h.rv = 0; h.shield = 0; emit(W, { k: 'down', id: h.id, x: h.x, z: h.z, by: src }); }
  return dd;
}
export function healHero(W, h, n, by) {
  if (!h || h.st !== 0 || !(n > 0)) return 0;
  const add = Math.min(h.max - h.hp, Math.round(n));
  if (add <= 0) return 0;
  h.hp += add;
  emit(W, { k: 'heal', id: h.id, n: add, x: h.x, z: h.z, by });
  return add;
}
export function reviveHero(W, h, frac, by) {
  if (!h || h.st === 0) return;
  h.st = 0; h.hp = Math.round(h.max * frac); h.rv = 0; h.downT = 0; h.regen = 0;
  emit(W, { k: 'revive', id: h.id, x: h.x, z: h.z, by });
}

export function stunRobot(b, t) { if (!b || b.hp <= 0) return; b.stun = Math.max(b.stun || 0, b.type === 'boss' ? t * 0.4 : b.type === 'tank' ? t * 0.7 : t); }
export function slowRobot(b, k, t) { if (!b || b.hp <= 0) return; const bk = b.type === 'boss' ? k * 0.5 : k; b.slowK = Math.max(b.slowT > 0 ? b.slowK || 0 : 0, clamp(bk, 0, 0.8)); b.slowT = Math.max(b.slowT || 0, t); }
export function hurtRobot(W, b, d, by, dirx, dirz, o = {}) {
  if (!b || b.hp <= 0 || b.sp > 0 || !(d > 0)) return 0;
  let dmg = d;
  if (b.type === 'tank' && dirx != null) {
    const fx = Math.sin(b.yaw), fz = Math.cos(b.yaw);
    if (-(dirx * fx + dirz * fz) > 0.5) { dmg *= ROBOTS.tank.shield; o.block = true; }
  }
  dmg = Math.round(dmg);
  b.flash = 0.1; b.hitAt = W.t; b.lastHit = by;
  if (o.kb && b.type !== 'boss') { const k = b.type === 'tank' ? 0.35 : 1; b.kbx += (dirx || 0) * o.kb * k; b.kbz += (dirz || 0) * o.kb * k; }
  if (o.host !== false) { if (o.stun) stunRobot(b, o.stun); if (o.slow) slowRobot(b, o.slow[0], o.slow[1]); }
  if (o.host === false) { b.hp = Math.max(1, b.hp - dmg); b.predAt = W.t; emit(W, { k: 'hitR', id: b.id, d: dmg, x: b.x, z: b.z, by, block: !!o.block, pred: true }); return dmg; }
  b.hp -= dmg;
  const h = W.heroes[by];
  if (h) h.stats.dmg += dmg;
  emit(W, { k: 'hitR', id: b.id, d: dmg, x: b.x, z: b.z, by, block: !!o.block });
  if (b.hp <= 0) killRobot(W, b, by);
  return dmg;
}
function killRobot(W, b, by) {
  b.hp = 0;
  const R = ROBOTS[b.type];
  W.score += Math.round(R.pts * (LEVELS[W.lv].hp + 0.3));
  const h = W.heroes[by];
  if (h) h.stats.kills += 1;
  emit(W, { k: 'kill', id: b.id, type: b.type, x: b.x, z: b.z, by });
  net(W, ['k', b.id, by || '']);
  if (h && h.mods && h.mods.chain && !b.chained) {
    const r = 2.6 + h.mods.chain * 0.5, d = Math.round(320 * h.mods.chain * (h.mods.dmg || 1));
    W.zones.push({ k: 'boom', x: b.x, z: b.z, r, d: 0, t: 0, live: true });
    net(W, ['z', 'boom', +b.x.toFixed(2), +b.z.toFixed(2), r, 0, 0]);
    for (const o of W.robots) if (o !== b && o.hp > 0 && Math.hypot(o.x - b.x, o.z - b.z) < r + o.r) { o.chained = true; const dx = o.x - b.x, dz = o.z - b.z, L = Math.hypot(dx, dz) || 1; hurtRobot(W, o, d, by, dx / L, dz / L, { kb: 3 }); }
  }
  if (b.type === 'bomber' && !b.blown) bomberBlast(W, b, 0.75);
  const n = b.type === 'boss' ? 3 : W.rnd() < R.drop ? 1 : 0;
  for (let i = 0; i < n; i++) {
    const v = W.rnd();
    const kind = b.type === 'boss' ? ['hp', 'pw', 'su'][i] : v < 0.42 ? 'hp' : v < 0.58 ? 'pw' : v < 0.72 ? 'su' : v < 0.82 ? 'sh' : v < 0.91 ? 'rf' : 'sp';
    const a = (i / Math.max(1, n)) * TAU + W.rnd();
    const p = { x: b.x + (n > 1 ? Math.sin(a) * 1.4 : 0), z: b.z + (n > 1 ? Math.cos(a) * 1.4 : 0) };
    pushOut(W.A, p, 0.4);
    W.drops.push({ id: W.dropId++, k: kind, x: p.x, z: p.z, life: 14 });
  }
}
function bomberBlast(W, b, mul) {
  b.blown = true;
  const R = ROBOTS.bomber;
  const d = R.dmg * b.dmgMul * mul;
  const z = { k: 'boom', x: b.x, z: b.z, r: R.rad, d: Math.round(d), t: 0 };
  W.zones.push({ ...z, live: true });
  net(W, ['z', z.k, +b.x.toFixed(2), +b.z.toFixed(2), z.r, z.d, 0]);
  for (const o of W.robots) if (o !== b && o.hp > 0 && Math.hypot(o.x - b.x, o.z - b.z) < R.rad + o.r) { const dx = o.x - b.x, dz = o.z - b.z, L = Math.hypot(dx, dz) || 1; hurtRobot(W, o, d * 0.4, b.lastHit, dx / L, dz / L, { kb: 6 }); }
}

export function addZone(W, z, local) {
  W.zones.push({ ...z, t: z.t || 0, live: true });
  if (!local) return;
  net(W, ['z', z.k, +z.x.toFixed(2), +z.z.toFixed(2), z.r || 0, Math.round(z.d || 0), +(z.t || 0).toFixed(2), z.a != null ? +z.a.toFixed(3) : 0, z.a1 != null ? +z.a1.toFixed(3) : 0, z.dur || 0, z.len || 0]);
}

function pickTarget(W, b) {
  const L = heroList(W).filter(aliveHero);
  if (!L.length) return null;
  let best = null, bd = 1e9;
  for (const h of L) {
    const d = Math.hypot(h.x - b.x, h.z - b.z);
    const hidden = h.hid && d > 3.6 && W.t - h.seen > 1.2;
    const score = d + (hidden ? 30 : 0) + (h.id === b.tg ? -2.5 : 0);
    if (score < bd) { bd = score; best = h; }
  }
  for (const dc of W.decoys) { const d = Math.hypot(dc.x - b.x, dc.z - b.z); const score = d - 5 + (dc.key === b.tg ? -2.5 : 0); if (d < 14 && score < bd) { bd = score; best = { id: dc.key }; } }
  return best ? best.id : null;
}
function decoyOf(W, key) { const d = W.decoys.find((o) => o.key === key); return d ? { id: d.key, x: d.x, z: d.z, vx: 0, vz: 0, st: 0, hid: false, seen: W.t, decoy: true } : null; }
export const visibleTo = (W, h, x, z) => !!h && h.st === 0 && (!h.hid || Math.hypot(h.x - x, h.z - z) < 3.6 || W.t - h.seen < 1.2);

function flowFor(W, h) {
  const F = W.flows[h.id];
  if (F && Math.abs(F.x - h.x) < 0.9 && Math.abs(F.z - h.z) < 0.9) return F;
  const nf = flowFrom(W.A, h.x, h.z);
  W.flows[h.id] = nf;
  return nf;
}
export function steerTo(W, o, tx, tz, rad, F) {
  if (walkClear(W.A, o.x, o.z, tx, tz, rad * 0.9)) return [tx - o.x, tz - o.z];
  const F2 = F || flowFrom(W.A, tx, tz);
  const s = flowStep(W.A, F2, o.x, o.z);
  if (!s) return [tx - o.x, tz - o.z];
  return [s[0] - o.x, s[1] - o.z];
}
function moveRobot(W, b, tx, tz, spd, dt, F) {
  const [dx, dz] = steerTo(W, b, tx, tz, b.r, F);
  const L = Math.hypot(dx, dz);
  if (L < 0.05) { b.mv = 0; return; }
  const ux = dx / L, uz = dz / L;
  const want = Math.atan2(ux, uz);
  b.yaw += clamp(wrapA(want - b.yaw), -dt * 7, dt * 7);
  const sp = spd * (b.spdK || 1);
  const s = Math.min(L, sp * dt);
  moveCircle(W.A, b, ux * s, uz * s, b.r);
  b.mv = sp; b.walk += s;
}
function faceTo(b, x, z, dt, rate = 8) { const want = Math.atan2(x - b.x, z - b.z); b.yaw += clamp(wrapA(want - b.yaw), -dt * rate, dt * rate); return Math.abs(wrapA(want - b.yaw)); }

function robotShot(W, b, a, spd, dmg, k = 'eb') {
  const s = { side: 'r', k, own: b.id, x: b.x + Math.sin(a) * (b.r + 0.2), z: b.z + Math.cos(a) * (b.r + 0.2), y: k === 'eb' ? 0.95 : 1.1, vx: Math.sin(a) * spd, vz: Math.cos(a) * spd, range: 15, d: Math.round(dmg), w: 0.38, hit: null };
  W.shots.push(s);
  emit(W, { k: 'rshot', x: s.x, z: s.z, a, type: b.type, id: b.id });
  net(W, ['s', b.id, +s.x.toFixed(2), +s.z.toFixed(2), +a.toFixed(3), spd, s.d, k]);
}
export function spawnRobotShot(W, rid, x, z, a, spd, d, k) {
  const s = { side: 'r', k: k || 'eb', own: rid, x, z, y: (k || 'eb') === 'eb' ? 0.95 : 1.1, vx: Math.sin(a) * spd, vz: Math.cos(a) * spd, range: 15, d, w: 0.38, hit: null };
  W.shots.push(s);
  emit(W, { k: 'rshot', x, z, a, id: rid });
}

function stepRobot(W, b, dt) {
  const R = ROBOTS[b.type];
  b.flash = Math.max(0, b.flash - dt);
  if (b.sp > 0) { b.sp -= dt; return; }
  if (b.kbx || b.kbz) {
    moveCircle(W.A, b, b.kbx * dt, b.kbz * dt, b.r);
    const f = Math.exp(-dt * 7); b.kbx *= f; b.kbz *= f;
    if (Math.abs(b.kbx) + Math.abs(b.kbz) < 0.2) { b.kbx = 0; b.kbz = 0; }
  }
  if (b.stun > 0) { b.stun -= dt; b.mv = 0; b.wind = 0; b.burst = 0; return; }
  if (b.slowT > 0) { b.slowT -= dt; b.spdK = 1 - (b.slowK || 0); } else b.spdK = 1;
  b.think -= dt;
  if (b.think <= 0) { b.think = 0.35 + W.rnd() * 0.25; b.tg = pickTarget(W, b); }
  const h = b.tg ? W.heroes[b.tg] || decoyOf(W, b.tg) : null;
  if (!h || h.st !== 0) { b.mv = 0; if (b.type === 'bomber' && b.fuse > 0) { b.fuse -= dt; if (b.fuse <= 0) { bomberBlast(W, b, 1); b.hp = 0; emit(W, { k: 'kill', id: b.id, type: b.type, x: b.x, z: b.z, by: null }); net(W, ['k', b.id, '']); } } return; }
  const dx = h.x - b.x, dz = h.z - b.z, dist = Math.hypot(dx, dz);
  const vis = visibleTo(W, h, b.x, b.z);
  b.cd -= dt * (b.spdK || 1);
  const F = flowFor(W, h);
  if (b.type === 'grunt') {
    if (b.wind > 0) {
      b.wind -= dt; faceTo(b, h.x, h.z, dt, 5); b.mv = 0;
      if (b.wind <= 0) { b.cd = R.cd; if (dist < R.rng + 1.1) { const d = Math.round(R.dmg * b.dmgMul); net(W, ['m', b.id, h.id, d]); emit(W, { k: 'melee', id: b.id, to: h.id, d }); if (W.local && W.local.has(h.id)) hurtHero(W, h, d, b.id); } }
    } else if (dist < R.rng + 0.45 && b.cd <= 0) { b.wind = R.wind; emit(W, { k: 'wind', id: b.id }); }
    else if (dist > R.rng * 0.8) moveRobot(W, b, h.x, h.z, R.spd, dt, F);
    else { faceTo(b, h.x, h.z, dt); b.mv = 0; }
  } else if (b.type === 'shooter') {
    const los = vis && dist < R.rng && losClear(W.A, b.x, b.z, h.x, h.z, 0.12);
    if (los) {
      const off = faceTo(b, h.x, h.z, dt, 6);
      const strafe = Math.sin(W.t * 1.3 + b.id) * 0.9;
      if (dist < 5) moveRobot(W, b, b.x - dx / dist * 2, b.z - dz / dist * 2, R.spd * 0.7, dt);
      else moveCircle(W.A, b, (-dz / dist) * strafe * dt, (dx / dist) * strafe * dt, b.r);
      if (b.cd <= 0 && off < 0.35) {
        b.cd = R.cd * (0.85 + W.rnd() * 0.3);
        const lead = dist / R.bspd;
        const a = Math.atan2(h.x + h.vx * lead * 0.6 - b.x, h.z + h.vz * lead * 0.6 - b.z) + (W.rnd() - 0.5) * 0.08;
        robotShot(W, b, a, R.bspd, R.dmg * b.dmgMul);
      }
    } else moveRobot(W, b, h.x, h.z, R.spd, dt, F);
  } else if (b.type === 'bomber') {
    if (b.fuse > 0) {
      b.fuse -= dt; b.mv = 0;
      if (b.fuse <= 0) { bomberBlast(W, b, 1); b.hp = 0; emit(W, { k: 'kill', id: b.id, type: b.type, x: b.x, z: b.z, by: null, self: true }); net(W, ['k', b.id, '']); }
    } else if (dist < 1.9) { b.fuse = R.fuse; net(W, ['f', b.id]); emit(W, { k: 'fuse', id: b.id }); }
    else moveRobot(W, b, h.x, h.z, R.spd, dt, F);
  } else if (b.type === 'tank') {
    if (b.burst > 0) {
      b.burstT -= dt; faceTo(b, h.x, h.z, dt, 2.5); b.mv = 0;
      if (b.burstT <= 0) { b.burst -= 1; b.burstT = 0.2; robotShot(W, b, b.yaw + (W.rnd() - 0.5) * 0.12, R.bspd, R.dmg * b.dmgMul, 'tb'); }
    } else {
      const los = vis && dist < R.rng && losClear(W.A, b.x, b.z, h.x, h.z, 0.15);
      if (los && b.cd <= 0) { const off = faceTo(b, h.x, h.z, dt, 2.2); if (off < 0.3) { b.burst = R.burst; b.burstT = 0.05; b.cd = R.cd; } }
      else if (dist > 4) moveRobot(W, b, h.x, h.z, R.spd, dt, F);
      else { faceTo(b, h.x, h.z, dt, 2.2); b.mv = 0; }
    }
  } else if (b.type === 'boss') stepBoss(W, b, h, dist, dt, F);
}

function stepBoss(W, b, h, dist, dt, F) {
  const R = ROBOTS.boss;
  const rage = b.hp < b.max * 0.5;
  if (b.busy > 0) { b.busy -= dt; b.mv = 0; if (b.act && b.act.k === 'laser') { b.act.el += dt; b.yaw = b.act.a0 + (b.act.a1 - b.act.a0) * clamp((b.act.el - b.act.wind) / b.act.dur, 0, 1); } return; }
  b.act = null;
  b.atkT -= dt;
  if (dist > 4.5) moveRobot(W, b, h.x, h.z, R.spd * (rage ? 1.2 : 1), dt, F);
  else { faceTo(b, h.x, h.z, dt, 3); b.mv = 0; }
  if (b.atkT > 0) return;
  const cyc = ['stomp', 'mis', 'laser', 'mis', 'summon'];
  let k = cyc[b.cyc % cyc.length];
  b.cyc += 1;
  const alive = heroList(W).filter(aliveHero);
  const near = alive.filter((o) => Math.hypot(o.x - b.x, o.z - b.z) < 7.5);
  if (k === 'stomp' && !near.length) k = 'mis';
  if (k === 'laser' && !losClear(W.A, b.x, b.z, h.x, h.z, 0.2)) k = 'mis';
  const dmg = (n) => Math.round(n * b.dmgMul);
  if (k === 'stomp') { addZone(W, { k: 'stomp', x: b.x, z: b.z, r: 5.6, d: dmg(1450), t: rage ? 0.85 : 1.1 }, true); b.busy = (rage ? 0.85 : 1.1) + 0.5; }
  else if (k === 'mis') {
    const tg = alive.slice(0, 4);
    const extra = rage ? 2 : 0;
    tg.forEach((o, i) => addZone(W, { k: 'mis', x: clamp(o.x + o.vx * 0.9, 1, W.A.wx - 1), z: clamp(o.z + o.vz * 0.9, 1, W.A.wz - 1), r: 2.3, d: dmg(1050), t: 1.35 + i * 0.12 }, true));
    for (let i = 0; i < extra; i++) { const a = W.rnd() * TAU, rr = 3 + W.rnd() * 5; const p = { x: h.x + Math.sin(a) * rr, z: h.z + Math.cos(a) * rr }; if (!solidAt(W.A, p.x, p.z)) addZone(W, { k: 'mis', x: p.x, z: p.z, r: 2.3, d: dmg(1050), t: 1.6 }, true); }
    b.busy = 0.7;
    emit(W, { k: 'bossMis', id: b.id });
  } else if (k === 'laser') {
    const a0 = Math.atan2(h.x - b.x, h.z - b.z) - 0.55, a1 = a0 + 1.1;
    const sw = W.rnd() < 0.5;
    addZone(W, { k: 'laser', x: b.x, z: b.z, t: 0.85, dur: 1.5, a: sw ? a0 : a1, a1: sw ? a1 : a0, d: dmg(420), len: 22, r: 0.75 }, true);
    b.act = { k: 'laser', a0: sw ? a0 : a1, a1: sw ? a1 : a0, wind: 0.85, dur: 1.5, el: 0 };
    b.busy = 2.35;
  } else {
    for (let i = 0; i < (rage ? 4 : 3); i++) {
      const a = (i / 3) * TAU + W.rnd();
      const p = { x: b.x + Math.sin(a) * 2.8, z: b.z + Math.cos(a) * 2.8 };
      pushOut(W.A, p, 0.6);
      if (solidAt(W.A, p.x, p.z)) continue;
      const g = mkRobot(W.nextId++, 'grunt', p.x, p.z, W.wave.spec);
      W.robots.push(g);
      emit(W, { k: 'spawn', id: g.id, type: 'grunt', x: g.x, z: g.z, boss: true });
    }
    b.busy = 0.8;
    emit(W, { k: 'bossCall', id: b.id });
  }
  b.atkT = (rage ? 1.9 : 2.7) + W.rnd() * 0.6;
}

function stepZones(W, dt) {
  for (let i = W.zones.length - 1; i >= 0; i--) {
    const z = W.zones[i];
    z.t -= dt;
    if (z.k === 'laser') {
      if (z.t > 0) continue;
      const el = -z.t;
      if (!z.fired) { z.fired = true; emit(W, { k: 'laserOn', x: z.x, z: z.z }); }
      z.tick = (z.tick || 0) - dt;
      const a = z.a + (z.a1 - z.a) * clamp(el / Math.max(0.01, z.dur), 0, 1);
      z.cur = a;
      const ux = Math.sin(a), uz = Math.cos(a);
      z.reach = rayWall(W.A, z.x + ux * 1.2, z.z + uz * 1.2, ux, uz, z.len) + 1.2;
      if (z.tick <= 0) {
        z.tick = 0.2;
        for (const h of heroList(W)) {
          if (h.st !== 0 || !(W.local && W.local.has(h.id))) continue;
          const px = h.x - z.x, pz = h.z - z.z, along = px * ux + pz * uz, perp = Math.abs(px * uz - pz * ux);
          if (along > 0 && along < z.reach && perp < z.r + 0.5) hurtHero(W, h, z.d, 'laser');
        }
      }
      if (el >= z.dur) W.zones.splice(i, 1);
      continue;
    }
    if (z.t > 0) continue;
    if (!z.fired) {
      z.fired = true;
      emit(W, { k: 'zone', z: z.k, x: z.x, z2: z.z, r: z.r });
      for (const h of heroList(W)) {
        if (h.st !== 0 || !(W.local && W.local.has(h.id))) continue;
        const d = Math.hypot(h.x - z.x, h.z - z.z);
        if (d < z.r + 0.45) hurtHero(W, h, z.d * (z.k === 'boom' ? 1 - 0.45 * clamp(d / z.r, 0, 1) : 1), z.k);
      }
    }
    W.zones.splice(i, 1);
  }
}

export function stepShots(W, dt) {
  const host = !!W.host;
  for (let i = W.shots.length - 1; i >= 0; i--) {
    const s = W.shots[i];
    if (s.k === 'lob' || s.k === 'mega' || s.k === 'rain') {
      s.t += dt;
      const u = clamp(s.t / s.T, 0, 1);
      s.x = s.x0 + (s.x1 - s.x0) * u; s.z = s.z0 + (s.z1 - s.z0) * u; s.y = 0.9 + (s.k === 'mega' ? 4.2 : s.k === 'rain' ? 5.5 : 3.2) * 4 * u * (1 - u) - 0.6 * u;
      if (u >= 1) {
        W.shots.splice(i, 1);
        emit(W, { k: 'blast', x: s.x1, z: s.z1, r: s.rad, big: s.k === 'mega', own: s.own, rocket: s.k === 'rain' });
        for (const b of W.robots) {
          if (b.hp <= 0) continue;
          const dx = b.x - s.x1, dz = b.z - s.z1, d = Math.hypot(dx, dz);
          if (d < s.rad + b.r * 0.7) {
            const f = 1 - 0.4 * clamp(d / s.rad, 0, 1);
            const got = hurtRobot(W, b, s.d * f, s.own, dx / (d || 1), dz / (d || 1), { kb: s.kb || 0, host });
            creditSup(W, s, got);
          }
        }
      }
      continue;
    }
    const step = Math.hypot(s.vx, s.vz) * dt;
    const n = Math.max(1, Math.ceil(step / 0.3));
    let dead = false;
    for (let j = 0; j < n && !dead; j++) {
      s.x += (s.vx * dt) / n; s.z += (s.vz * dt) / n; s.range -= step / n;
      if (s.range <= 0) { dead = true; if (s.k === 'rocket') rocketBoom(W, s, host); else if (s.side === 'h') emit(W, { k: 'fizz', x: s.x, z: s.z, shot: s.k }); break; }
      if (blockAt(W.A, s.x, s.z)) { dead = true; if (s.k === 'rocket') { s.x -= (s.vx * dt) / n; s.z -= (s.vz * dt) / n; rocketBoom(W, s, host); } else emit(W, { k: 'wallHit', x: s.x, z: s.z, shot: s.k, side: s.side }); break; }
      if (s.side === 'h') {
        for (const b of W.robots) {
          if (b.hp <= 0 || b.sp > 0) continue;
          if (s.hit && s.hit.has(b.id)) continue;
          if (Math.hypot(b.x - s.x, b.z - s.z) < b.r + s.w) {
            if (s.k === 'rocket') { rocketBoom(W, s, host); dead = true; break; }
            const sp = Math.hypot(s.vx, s.vz) || 1;
            const got = hurtRobot(W, b, s.d, s.own, s.vx / sp, s.vz / sp, { kb: s.kb || 0, host, slow: s.slow || null });
            creditSup(W, s, got);
            if (s.k === 'orb') { (s.hit || (s.hit = new Set())).add(b.id); continue; }
            if (s.k === 'bolt' && (s.pierce || 0) > 0) { s.pierce -= 1; s.d = Math.round(s.d * 0.85); (s.hit || (s.hit = new Set())).add(b.id); continue; }
            dead = true; break;
          }
        }
        if (!dead && s.k === 'orb' && s.heal) {
          for (const h of heroList(W)) {
            if (h.id === s.own || h.st !== 0) continue;
            if (s.healed && s.healed.has(h.id)) continue;
            if (Math.hypot(h.x - s.x, h.z - s.z) < 0.6 + s.w) {
              (s.healed || (s.healed = new Set())).add(h.id);
              if (W.local && W.local.has(h.id)) { const got = healHero(W, h, s.heal, s.own); const by = W.heroes[s.own]; if (by && got) by.stats.heal += got; }
            }
          }
        }
      } else {
        for (const h of heroList(W)) {
          if (h.st !== 0) continue;
          if (Math.hypot(h.x - s.x, h.z - s.z) < 0.55 + s.w) {
            if (W.local && W.local.has(h.id)) hurtHero(W, h, s.d, s.own);
            else emit(W, { k: 'spark', x: s.x, z: s.z });
            dead = true; break;
          }
        }
      }
    }
    if (dead) W.shots.splice(i, 1);
  }
}
function rocketBoom(W, s, host) {
  emit(W, { k: 'blast', x: s.x, z: s.z, r: s.rad, big: false, own: s.own, rocket: true });
  const h = W.heroes[s.own];
  for (const b of W.robots) {
    if (b.hp <= 0 || b.sp > 0) continue;
    const dx = b.x - s.x, dz = b.z - s.z, d = Math.hypot(dx, dz);
    if (d > s.rad + b.r * 0.7) continue;
    const got = hurtRobot(W, b, s.d * (1 - 0.35 * clamp(d / s.rad, 0, 1)), s.own, dx / (d || 1), dz / (d || 1), { kb: 2.5, host });
    if (h) creditSup(W, s, got);
  }
}
function creditSup(W, s, got) {
  if (!got) return;
  const h = W.heroes[s.own];
  if (!h || !(W.local && W.local.has(h.id))) return;
  if (h.mods && h.mods.life > 0 && h.st === 0) h.hp = Math.min(h.max, h.hp + got * h.mods.life);
  if (s.sup) return;
  const H = HEROES[h.key];
  h.sup = Math.min(1, h.sup + (got / H.sup.need) * (h.mods ? h.mods.supRate : 1));
}

export function autoAim(W, h, rng, needLos = true) {
  let best = null, bd = 1e9;
  for (const b of W.robots) {
    if (b.hp <= 0 || b.sp > 0) continue;
    const d = Math.hypot(b.x - h.x, b.z - h.z);
    if (d > rng * 1.12) continue;
    if (needLos && !losClear(W.A, h.x, h.z, b.x, b.z, 0)) continue;
    const s = d - (b.type === 'bomber' && d < 5 ? 3 : 0);
    if (s < bd) { bd = s; best = b; }
  }
  if (!best) return null;
  const d = Math.hypot(best.x - h.x, best.z - h.z);
  return { a: Math.atan2(best.x - h.x, best.z - h.z), d, x: best.x, z: best.z, id: best.id };
}
const dmgOf = (h, n) => Math.round(n * (h.mods ? h.mods.dmg : 1) * (h.pw > 0 ? 1.3 : 1));
export function heroShots(W, h, kind, a, dist, seed) {
  const H = HEROES[h.key];
  const S = kind === 'sup' ? H.sup : H.atk;
  const M = h.mods || baseMods();
  const rnd = rngOf(seed || 1);
  const out = [];
  const sup = kind === 'sup';
  const fx = Math.sin(a), fz = Math.cos(a);
  const ox = h.x + fx * 0.55, oz = h.z + fz * 0.55;
  if (S.k === 'spread' || S.k === 'wave' || S.k === 'shard') {
    const n = S.n + (S.k === 'spread' ? M.extra : 0);
    const arc = S.arc * (S.k === 'spread' && M.extra ? 1 + M.extra * 0.08 : 1);
    for (let i = 0; i < n; i++) {
      const aa = a + arc * (n > 1 ? i / (n - 1) - 0.5 : 0) + (rnd() - 0.5) * 0.05;
      const sp = S.spd * (0.94 + rnd() * 0.1);
      const sh = { side: 'h', k: S.k === 'wave' ? 'wave' : S.k === 'shard' ? 'shard' : 'pellet', own: h.id, x: ox, z: oz, y: 0.85, vx: Math.sin(aa) * sp, vz: Math.cos(aa) * sp, range: S.rng * (0.95 + rnd() * 0.08), d: dmgOf(h, S.dmg), w: S.w, kb: S.kb || 0, sup };
      if (S.k === 'shard') sh.slow = [Math.min(0.75, S.slow + (M.slow - 1) * 0.15), S.slowT * M.slow];
      out.push(sh);
    }
  } else if (S.k === 'bolt') out.push({ side: 'h', k: 'bolt', own: h.id, x: ox, z: oz, y: 0.95, vx: fx * S.spd, vz: fz * S.spd, range: S.rng, d: dmgOf(h, S.dmg), w: S.w, sup, pierce: M.pierce });
  else if (S.k === 'orb') out.push({ side: 'h', k: 'orb', own: h.id, x: ox, z: oz, y: 1.0, vx: fx * S.spd, vz: fz * S.spd, range: S.rng, d: dmgOf(h, S.dmg), heal: Math.round(S.heal * M.heal), w: S.w, sup });
  else if (S.k === 'rocket') out.push({ side: 'h', k: 'rocket', own: h.id, x: ox, z: oz, y: 1.0, vx: fx * S.spd, vz: fz * S.spd, range: S.rng, d: dmgOf(h, S.dmg), rad: S.rad * M.rad, w: S.w, sup });
  else if (S.k === 'lob' || S.k === 'mega') {
    const d = clamp(dist == null ? S.rng * 0.75 : dist, 1.2, S.rng);
    out.push({ side: 'h', k: S.k, own: h.id, x0: h.x, z0: h.z, x1: h.x + fx * d, z1: h.z + fz * d, x: h.x, z: h.z, y: 1, t: 0, T: S.flight * (0.7 + 0.3 * d / S.rng), rad: S.rad * M.rad, d: dmgOf(h, S.dmg), kb: S.kb || 0, sup });
  } else if (S.k === 'barrage') {
    const d = clamp(dist == null ? S.rng * 0.7 : dist, 2, S.rng);
    const tx = h.x + fx * d, tz = h.z + fz * d;
    for (let i = 0; i < S.n; i++) {
      const ra = rnd() * Math.PI * 2, rr = i === 0 ? 0 : 0.8 + rnd() * 2.2;
      const x1 = tx + Math.sin(ra) * rr, z1 = tz + Math.cos(ra) * rr;
      out.push({ side: 'h', k: 'rain', own: h.id, x0: h.x, z0: h.z, x1, z1, x: h.x, z: h.z, y: 1, t: 0, T: S.flight + i * 0.11, rad: S.rad * M.rad, d: dmgOf(h, S.dmg), kb: 3, sup });
    }
  }
  if (M.crit) for (const p of out) if (p.d && rnd() < M.crit) { p.d = Math.round(p.d * 2); p.crit = 1; }
  return out;
}
function zapChain(W, h, a, S, extra, host) {
  const pts = [[h.x, h.z]];
  const hit = new Set();
  let cur = null, bd = 1e9;
  for (const b of W.robots) {
    if (b.hp <= 0 || b.sp > 0) continue;
    const dx = b.x - h.x, dz = b.z - h.z, d = Math.hypot(dx, dz);
    if (d > S.rng + b.r) continue;
    const off = Math.abs(wrapA(Math.atan2(dx, dz) - a));
    if (off > 0.55) continue;
    if (!losClear(W.A, h.x, h.z, b.x, b.z, 0)) continue;
    const sc = d + off * 6;
    if (sc < bd) { bd = sc; cur = b; }
  }
  if (!cur) { const reach = rayWall(W.A, h.x, h.z, Math.sin(a), Math.cos(a), S.rng); pts.push([h.x + Math.sin(a) * reach, h.z + Math.cos(a) * reach]); return { pts, n: 0 }; }
  let dmg = dmgOf(h, S.dmg), n = 0;
  const hops = S.chain + extra;
  while (cur && n <= hops) {
    hit.add(cur.id);
    pts.push([cur.x, cur.z]);
    const prev = pts[pts.length - 2];
    const ux = cur.x - prev[0], uz = cur.z - prev[1], L = Math.hypot(ux, uz) || 1;
    const got = hurtRobot(W, cur, dmg, h.id, ux / L, uz / L, { kb: 1.5, host });
    creditSup(W, { own: h.id, sup: false }, got);
    n++;
    dmg = Math.round(dmg * 0.78);
    let nx = null, nd = 1e9;
    for (const b of W.robots) { if (b.hp <= 0 || b.sp > 0 || hit.has(b.id)) continue; const d = Math.hypot(b.x - cur.x, b.z - cur.z); if (d < S.hop * (h.ocT > 0 ? 1.5 : 1) && d < nd && losClear(W.A, cur.x, cur.z, b.x, b.z, 0)) { nd = d; nx = b; } }
    cur = nx;
  }
  return { pts, n };
}
function aoe(W, h, x, z, rad, dmg, o, host) {
  let tot = 0;
  for (const b of W.robots) {
    if (b.hp <= 0 || b.sp > 0) continue;
    const dx = b.x - x, dz = b.z - z, d = Math.hypot(dx, dz);
    if (d > rad + b.r) continue;
    const got = hurtRobot(W, b, dmg, h.id, dx / (d || 1), dz / (d || 1), { ...o, host });
    tot += got;
    if (!o.noSup) creditSup(W, { own: h.id, sup: !!o.sup }, got);
  }
  return tot;
}
export function fireHero(W, h, kind, a, dist, seed) {
  const H = HEROES[h.key];
  const S = kind === 'sup' ? H.sup : H.atk;
  const M = h.mods || baseMods();
  const host = !!W.host;
  h.aimA = a; h.aimT = 0.45; h.yaw = a; h.rec = 0.12; h.regen = 0; h.seen = W.t;
  if (kind === 'sup') { h.sup = 0; if (M.supShield) h.shield = Math.max(h.shield || 0, Math.round(h.max * M.supShield)); } else { h.ammo = Math.max(0, h.ammo - 1); h.cd = S.cd; }
  emit(W, { k: 'fire', id: h.id, kind, hero: h.key, x: h.x, z: h.z, a, dist });
  const fx = Math.sin(a), fz = Math.cos(a);
  if (S.k === 'beam') {
    const reach = rayWall(W.A, h.x, h.z, fx, fz, S.rng);
    emit(W, { k: 'beam', id: h.id, x: h.x, z: h.z, a, len: reach });
    for (const b of W.robots) {
      if (b.hp <= 0 || b.sp > 0) continue;
      const px = b.x - h.x, pz = b.z - h.z, along = px * fx + pz * fz, perp = Math.abs(px * fz - pz * fx);
      if (along > 0 && along < reach + b.r && perp < S.w + b.r) hurtRobot(W, b, dmgOf(h, S.dmg), h.id, fx, fz, { kb: 4, host });
    }
    return;
  }
  if (S.k === 'bloom') {
    emit(W, { k: 'bloom', id: h.id, x: h.x, z: h.z, r: S.rad });
    for (const o of heroList(W)) {
      if (!(W.local && W.local.has(o.id))) continue;
      const d = Math.hypot(o.x - h.x, o.z - h.z);
      if (d > S.rad) continue;
      if (o.st === 1) reviveHero(W, o, 0.55, [h.id]);
      else if (o.st === 0) { const got = healHero(W, o, S.heal * M.heal, h.id); h.stats.heal += got; }
    }
    aoe(W, h, h.x, h.z, S.rad, dmgOf(h, S.dmg), { kb: S.kb, sup: true }, host);
    return;
  }
  if (S.k === 'smash') {
    emit(W, { k: 'smash', id: h.id, x: h.x, z: h.z, a, r: S.rng, arc: S.arc });
    for (const b of W.robots) {
      if (b.hp <= 0 || b.sp > 0) continue;
      const dx = b.x - h.x, dz = b.z - h.z, d = Math.hypot(dx, dz);
      if (d > S.rng + b.r) continue;
      if (d > 0.8 && Math.abs(wrapA(Math.atan2(dx, dz) - a)) > S.arc / 2) continue;
      const got = hurtRobot(W, b, dmgOf(h, S.dmg), h.id, dx / (d || 1), dz / (d || 1), { kb: S.kb, host });
      creditSup(W, { own: h.id, sup: false }, got);
    }
    return;
  }
  if (S.k === 'slam' || S.k === 'freeze') {
    emit(W, { k: S.k, id: h.id, x: h.x, z: h.z, r: S.rad });
    aoe(W, h, h.x, h.z, S.rad, dmgOf(h, S.dmg), { kb: S.kb || 0, stun: S.stun * (S.k === 'slam' ? M.stun : M.slow), sup: true }, host);
    return;
  }
  if (S.k === 'zap') {
    const r = zapChain(W, h, a, S, M.extra + (h.ocT > 0 ? 2 : 0), host);
    emit(W, { k: 'zap', id: h.id, pts: r.pts });
    return;
  }
  if (S.k === 'turret') {
    const d = clamp(dist == null ? 1.6 : Math.min(dist, 4), 1, 4);
    const p = { x: h.x + fx * d, z: h.z + fz * d };
    pushOut(W.A, p, 0.5);
    W.turrets.push({ id: W.gid++, own: h.id, x: p.x, z: p.z, t: S.life, cd: 0.4, rad: S.rad, d: dmgOf(h, S.dmg), rate: S.rate });
    emit(W, { k: 'turret', id: h.id, x: p.x, z: p.z });
    return;
  }
  for (const sh of heroShots(W, h, kind, a, dist, seed)) W.shots.push(sh);
}
export function useGadget(W, h, a, dist, tx, tz) {
  const H = HEROES[h.key];
  const G = H.gad;
  const M = h.mods || baseMods();
  const host = !!W.host;
  h.gad = Math.max(0, h.gad - 1); h.gadCD = GADGET_CD; h.seen = W.t; h.gUse = (h.gUse || 0) + 1;
  const fx = Math.sin(a), fz = Math.cos(a);
  emit(W, { k: 'gadget', id: h.id, hero: h.key, g: G.k, x: h.x, z: h.z, a });
  if (G.k === 'ring' || G.k === 'nova') {
    emit(W, { k: G.k, id: h.id, x: h.x, z: h.z, r: G.rad });
    aoe(W, h, h.x, h.z, G.rad, dmgOf(h, G.dmg), G.k === 'nova' ? { slow: [Math.min(0.8, G.slow + (M.slow - 1) * 0.15), G.slowT * M.slow], noSup: true } : { kb: G.kb, noSup: true }, host);
  } else if (G.k === 'decoy') {
    const p = { x: h.x + fx * 1.4, z: h.z + fz * 1.4 };
    pushOut(W.A, p, 0.5);
    W.decoys.push({ key: `dc${h.id}|${h.gUse}`, own: h.id, hero: h.key, x: p.x, z: p.z, t: G.t, yaw: a });
  } else if (G.k === 'mine') {
    const p = { x: h.x + fx * 0.9, z: h.z + fz * 0.9 };
    pushOut(W.A, p, 0.4);
    W.mines.push({ id: `${h.id}|${h.gUse}`, own: h.id, x: p.x, z: p.z, t: G.t, arm: 0.6, rad: G.rad * M.rad, d: dmgOf(h, G.dmg) });
  } else if (G.k === 'bubble') {
    emit(W, { k: 'bubble', id: h.id, x: h.x, z: h.z, r: G.rad });
    for (const o of heroList(W)) { if (o.st !== 0 || !(W.local && W.local.has(o.id))) continue; if (Math.hypot(o.x - h.x, o.z - h.z) > G.rad) continue; o.shield = Math.max(o.shield, Math.round(G.shield * M.heal)); o.shT = Math.max(o.shT, G.t); }
  } else if (G.k === 'charge') {
    const reach = Math.max(0.5, rayWall(W.A, h.x, h.z, fx, fz, G.len) - 0.4);
    if (W.local && W.local.has(h.id)) { h.dashT = G.t; h.dashVx = (fx * reach) / G.t; h.dashVz = (fz * reach) / G.t; h.yaw = a; }
    emit(W, { k: 'charge', id: h.id, x: h.x, z: h.z, a, len: reach });
    for (const b of W.robots) {
      if (b.hp <= 0 || b.sp > 0) continue;
      const px = b.x - h.x, pz = b.z - h.z, along = px * fx + pz * fz, perp = px * fz - pz * fx;
      if (along < -0.5 || along > reach + b.r || Math.abs(perp) > 1.2 + b.r) continue;
      const sg = perp >= 0 ? 1 : -1;
      hurtRobot(W, b, dmgOf(h, G.dmg), h.id, fx * 0.6 + fz * sg * 0.8, fz * 0.6 - fx * sg * 0.8, { kb: G.kb, host });
    }
  } else if (G.k === 'over') {
    h.ocT = G.t;
  } else if (G.k === 'jet') {
    let x1 = tx, z1 = tz;
    if (x1 == null || z1 == null) { const d = clamp(dist == null ? G.len : dist, 2, G.len); x1 = h.x + fx * d; z1 = h.z + fz * d; }
    const v = clamp(Math.hypot(x1 - h.x, z1 - h.z), 0.5, G.len);
    x1 = h.x + Math.sin(a) * v; z1 = h.z + Math.cos(a) * v;
    for (let k = 0; k < 30 && solidAt(W.A, x1, z1); k++) { x1 -= fx * 0.3; z1 -= fz * 0.3; }
    x1 = clamp(x1, 0.7, W.A.wx - 0.7); z1 = clamp(z1, 0.7, W.A.wz - 0.7);
    h.jump = { t: 0, T: G.t, x0: h.x, z0: h.z, x1, z1 };
    W.pend.push({ t: G.t, k: 'jetland', own: h.id, x: x1, z: z1, r: G.rad, d: dmgOf(h, G.dmg) });
    return { x1, z1 };
  }
  return null;
}
export function canGadget(h) { return h.st === 0 && h.gad > 0 && h.gadCD <= 0 && !h.jump && h.dashT <= 0; }
export function canDash(h) { return h.st === 0 && h.dashCD <= 0 && !h.jump && h.dashT <= 0; }
export function startDash(W, h, a) {
  h.dashT = DASH.t; h.dashVx = (Math.sin(a) * DASH.len) / DASH.t; h.dashVz = (Math.cos(a) * DASH.len) / DASH.t; h.dashCD = DASH.cd * (h.mods ? h.mods.dashCd : 1); h.yaw = a;
  emit(W, { k: 'dash', id: h.id, x: h.x, z: h.z, a });
}
export function canFire(h) { return h.st === 0 && h.ammo >= 1 && h.cd <= 0 && !h.jump; }
export function stepHero(W, h, inp, dt) {
  const H = HEROES[h.key];
  h.flash = Math.max(0, h.flash - dt);
  h.rec = Math.max(0, h.rec - dt);
  h.aimT = Math.max(0, h.aimT - dt);
  h.pw = Math.max(0, h.pw - dt);
  if (h.st === 1) {
    h.vx = 0; h.vz = 0;
    let near = 0;
    for (const o of heroList(W)) if (o !== h && o.st === 0 && Math.hypot(o.x - h.x, o.z - h.z) < REVIVE_R) near += 1;
    if (near) { let fast = 1; for (const o of heroList(W)) if (o !== h && o.st === 0 && o.mods && o.mods.revive && Math.hypot(o.x - h.x, o.z - h.z) < REVIVE_R) fast = Math.max(fast, o.mods.revive); h.rv += dt * fast / (near >= 2 ? REVIVE_T * 0.65 : REVIVE_T); if (h.rv >= 1) reviveHero(W, h, 0.45, heroList(W).filter((o) => o !== h && o.st === 0 && Math.hypot(o.x - h.x, o.z - h.z) < REVIVE_R).map((o) => o.id)); }
    else { h.rv = Math.max(0, h.rv - dt * 0.4); h.downT -= dt; if (h.downT <= 0) { h.st = 2; h.downT = 0; emit(W, { k: 'out', id: h.id }); } }
    return;
  }
  if (h.st === 2) { h.vx = 0; h.vz = 0; return; }
  const M = h.mods || baseMods();
  h.dashCD = Math.max(0, h.dashCD - dt); h.gadCD = Math.max(0, h.gadCD - dt);
  h.ocT = Math.max(0, h.ocT - dt); h.rfT = Math.max(0, h.rfT - dt); h.spT = Math.max(0, h.spT - dt); h.rushT = Math.max(0, (h.rushT || 0) - dt);
  if (h.shT > 0) { h.shT -= dt; if (h.shT <= 0) h.shield = 0; }
  const ox = h.x, oz = h.z;
  if (h.jump) {
    const J = h.jump;
    J.t += dt;
    const u = clamp(J.t / J.T, 0, 1);
    h.x = J.x0 + (J.x1 - J.x0) * u; h.z = J.z0 + (J.z1 - J.z0) * u;
    h.yaw = Math.atan2(J.x1 - J.x0, J.z1 - J.z0);
    if (u >= 1) { h.jump = null; moveCircle(W.A, h, 0, 0, 0.55); }
    h.vx = dt > 0 ? (h.x - ox) / dt : 0; h.vz = dt > 0 ? (h.z - oz) / dt : 0;
    h.hid = false;
    return;
  }
  h.cd = Math.max(0, h.cd - dt);
  const rel = H.atk.reload / (M.reload * (h.rfT > 0 ? 2 : 1) * (h.ocT > 0 ? 1.5 : 1));
  h.ammo = Math.min(M.ammo, h.ammo + dt / rel);
  h.regen += dt;
  if (h.regen > 3 && h.hp < h.max) { h.hp = Math.min(h.max, h.hp + h.max * 0.12 * dt * M.regen); }
  if (h.dashT > 0) {
    const s0 = Math.min(dt, h.dashT);
    h.dashT -= dt;
    moveCircle(W.A, h, h.dashVx * s0, h.dashVz * s0, 0.55);
    for (const b of W.robots) { if (b.hp <= 0) continue; const dx = h.x - b.x, dz = h.z - b.z, d = Math.hypot(dx, dz), need = b.r + 0.5; if (d < need && d > 0.001) { h.x = b.x + dx / d * need; h.z = b.z + dz / d * need; } }
    moveCircle(W.A, h, 0, 0, 0.55);
    h.vx = dt > 0 ? (h.x - ox) / dt : 0; h.vz = dt > 0 ? (h.z - oz) / dt : 0;
    h.walk += Math.hypot(h.vx, h.vz) * dt;
    h.hid = bushAt(W.A, h.x, h.z);
    return;
  }
  let mx = inp ? inp.mx || 0 : 0, mz = inp ? inp.mz || 0 : 0;
  const m = Math.hypot(mx, mz);
  if (m > 1) { mx /= m; mz /= m; }
  const spd = H.spd * M.spd * (h.pw > 0 ? 1.08 : 1) * (h.spT > 0 ? 1.35 : 1) * (h.rushT > 0 ? 1.22 : 1);
  if (m > 0.05) moveCircle(W.A, h, mx * spd * dt, mz * spd * dt, 0.55);
  for (const b of W.robots) {
    if (b.hp <= 0) continue;
    const dx = h.x - b.x, dz = h.z - b.z, d = Math.hypot(dx, dz), need = b.r + 0.5;
    if (d < need && d > 0.001) { h.x = b.x + dx / d * need; h.z = b.z + dz / d * need; }
  }
  moveCircle(W.A, h, 0, 0, 0.55);
  h.vx = dt > 0 ? (h.x - ox) / dt : 0; h.vz = dt > 0 ? (h.z - oz) / dt : 0;
  const v = Math.hypot(h.vx, h.vz);
  h.walk += v * dt;
  if (h.aimT > 0) h.yaw += clamp(wrapA(h.aimA - h.yaw), -dt * 18, dt * 18);
  else if (inp && inp.aiming && inp.aimA != null) h.yaw += clamp(wrapA(inp.aimA - h.yaw), -dt * 16, dt * 16);
  else if (v > 0.4) h.yaw += clamp(wrapA(Math.atan2(h.vx, h.vz) - h.yaw), -dt * 12, dt * 12);
  h.hid = bushAt(W.A, h.x, h.z);
}

export function stepWorld(W, dt) {
  W.t += dt;
  W.ev = W.ev || [];
  if (W.host) {
    W.flowT -= dt;
    if (W.flowT <= 0) { W.flowT = 0.3; for (const h of heroList(W)) if (h.st === 0) flowFor(W, h); }
    for (const b of W.robots) if (b.hp > 0) stepRobot(W, b, dt);
    separate(W);
    for (let i = W.robots.length - 1; i >= 0; i--) if (W.robots[i].hp <= 0) W.robots.splice(i, 1);
    for (let i = W.drops.length - 1; i >= 0; i--) { const d = W.drops[i]; d.life -= dt; if (d.life <= 0) W.drops.splice(i, 1); }
    stepWave(W, dt);
  } else {
    for (const b of W.robots) { b.flash = Math.max(0, b.flash - dt); if (b.sp > 0) b.sp -= dt; }
  }
  stepShots(W, dt);
  stepZones(W, dt);
  stepGear(W, dt);
}
function stepGear(W, dt) {
  const host = !!W.host;
  for (let i = W.turrets.length - 1; i >= 0; i--) {
    const T = W.turrets[i];
    T.t -= dt; T.cd -= dt;
    if (T.t <= 0) { W.turrets.splice(i, 1); emit(W, { k: 'turretEnd', x: T.x, z: T.z }); continue; }
    if (T.cd > 0) continue;
    let best = null, bd = 1e9;
    for (const b of W.robots) { if (b.hp <= 0 || b.sp > 0) continue; const d = Math.hypot(b.x - T.x, b.z - T.z); if (d < T.rad + b.r && d < bd && losClear(W.A, T.x, T.z, b.x, b.z, 0)) { bd = d; best = b; } }
    if (!best) { T.cd = 0.2; continue; }
    T.cd = T.rate;
    const dx = best.x - T.x, dz = best.z - T.z, L = Math.hypot(dx, dz) || 1;
    hurtRobot(W, best, T.d, T.own, dx / L, dz / L, { kb: 1, host });
    emit(W, { k: 'tzap', x: T.x, z: T.z, tx: best.x, tz: best.z });
  }
  for (let i = W.mines.length - 1; i >= 0; i--) {
    const mn = W.mines[i];
    mn.t -= dt; mn.arm -= dt;
    if (mn.t <= 0) { W.mines.splice(i, 1); emit(W, { k: 'fizz', x: mn.x, z: mn.z }); continue; }
    if (!host || mn.arm > 0) continue;
    if (!W.robots.some((b) => b.hp > 0 && b.sp <= 0 && Math.hypot(b.x - mn.x, b.z - mn.z) < b.r + 0.55)) continue;
    W.mines.splice(i, 1);
    mineBoom(W, mn, host);
    net(W, ['mn', mn.id]);
  }
  for (let i = W.decoys.length - 1; i >= 0; i--) { const d = W.decoys[i]; d.t -= dt; if (d.t <= 0) { W.decoys.splice(i, 1); emit(W, { k: 'decoyEnd', x: d.x, z: d.z }); } }
  for (let i = W.pend.length - 1; i >= 0; i--) {
    const p = W.pend[i];
    p.t -= dt;
    if (p.t > 0) continue;
    W.pend.splice(i, 1);
    if (p.k === 'jetland') {
      emit(W, { k: 'blast', x: p.x, z: p.z, r: p.r, big: false, own: p.own, jet: true });
      const h = W.heroes[p.own];
      if (h) aoe(W, h, p.x, p.z, p.r, p.d, { kb: 6, noSup: true }, host);
    }
  }
}
function mineBoom(W, mn, host) {
  emit(W, { k: 'blast', x: mn.x, z: mn.z, r: mn.rad, big: true, own: mn.own });
  const h = W.heroes[mn.own];
  if (h) aoe(W, h, mn.x, mn.z, mn.rad, mn.d, { kb: 7, noSup: true }, host);
}
function separate(W) {
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
      const push = (need - d) * 0.5, ux = dx / d, uz = dz / d;
      const wa = a.type === 'boss' ? 0.1 : b.type === 'boss' ? 0.9 : 0.5;
      a.x -= ux * push * 2 * wa; a.z -= uz * push * 2 * wa; b.x += ux * push * 2 * (1 - wa); b.z += uz * push * 2 * (1 - wa);
    }
  }
  for (const b of L) if (b.hp > 0) moveCircle(W.A, b, 0, 0, b.r);
}

function pickPad(W) {
  const A = W.A;
  const alive = heroList(W).filter((h) => h.st === 0);
  const ok = A.pads.filter((p) => alive.every((h) => Math.hypot(h.x - p.x, h.z - p.z) > 9));
  const L = ok.length ? ok : A.pads;
  return L[Math.floor(W.rnd() * L.length)] || { x: A.wx / 2, z: 3 };
}
export function startWave(W, n) {
  const players = Math.max(1, heroList(W).length);
  const spec = waveSpec(n, players, W.lv, W.seed);
  W.wave = { n, st: 'fight', t: 0, queue: spec.list.slice(), spawnT: 0.4, spec, left: spec.list.length };
  emit(W, { k: 'wave', n, boss: spec.boss });
  net(W, ['w', n]);
}
function stepWave(W, dt) {
  const V = W.wave;
  if (W.over) return;
  const L = heroList(W);
  const anyUp = L.some((h) => h.st === 0);
  if (L.length && !anyUp) { W.allDownT += dt; if (W.allDownT > 0.6) { W.over = { won: false, wave: V.n }; emit(W, { k: 'over', won: false }); return; } }
  else W.allDownT = 0;
  if (V.st === 'intro' || V.st === 'break') {
    V.t -= dt;
    if (V.t <= 0) startWave(W, V.n + 1);
    return;
  }
  if (V.st !== 'fight') return;
  V.spawnT -= dt;
  if (V.queue.length && V.spawnT <= 0 && W.robots.length < V.spec.maxAlive) {
    const type = V.queue.shift();
    const p = pickPad(W);
    const j = { x: p.x + (W.rnd() - 0.5) * 0.8, z: p.z + (W.rnd() - 0.5) * 0.8 };
    const b = mkRobot(W.nextId++, type, j.x, j.z, V.spec);
    b.yaw = angTo(b.x, b.z, W.A.wx / 2, W.A.wz / 2);
    if (type === 'boss') { b.sp = 1.6; b.atkT = 3.2; }
    W.robots.push(b);
    emit(W, { k: 'spawn', id: b.id, type, x: b.x, z: b.z });
    V.spawnT = type === 'boss' ? 2.2 : V.spec.gap * (0.7 + W.rnd() * 0.6);
  }
  V.left = V.queue.length + W.robots.length;
  if (!V.queue.length && !W.robots.length) {
    if (V.n >= WIN_WAVE && !W.endless) { V.st = 'won'; W.over = { won: true, wave: V.n }; emit(W, { k: 'over', won: true }); net(W, ['c', V.n]); return; }
    V.st = 'break'; V.t = V.spec.boss ? 8 : cardWave(V.n) ? 7.5 : 5;
    emit(W, { k: 'clear', n: V.n });
    net(W, ['c', V.n]);
  }
}

export function takeDrop(W, h, d) {
  if (!h || h.st !== 0 || !d) return;
  const lk = 1 + (h.mods ? h.mods.luck : 0);
  if (d.k === 'hp') healHero(W, h, h.max * 0.35 * lk, null);
  else if (d.k === 'pw') h.pw = 10 * lk;
  else if (d.k === 'su') h.sup = Math.min(1, h.sup + 0.5 * lk);
  else if (d.k === 'sh') { h.shield = Math.max(h.shield, Math.round(900 * lk)); h.shT = Math.max(h.shT, 6 * lk); }
  else if (d.k === 'rf') h.rfT = 8 * lk;
  else if (d.k === 'sp') h.spT = 8 * lk;
  emit(W, { k: 'pick', id: h.id, kind: d.k, x: d.x, z: d.z });
}

export function botBrain(W, h, dt) {
  const H = HEROES[h.key];
  const B = h.brain || (h.brain = { t: 0, goal: null, strafe: 1, flipT: 0, F: null, Fx: -99, Fz: -99, gT: 2, dT: 1 });
  const inp = { mx: 0, mz: 0, fire: null };
  if (h.st !== 0 || h.jump) return inp;
  B.t -= dt; B.flipT -= dt; B.gT -= dt; B.dT -= dt;
  if (B.flipT <= 0) { B.flipT = 1.2 + W.rnd() * 1.6; B.strafe = W.rnd() < 0.5 ? -1 : 1; }
  let gx = null, gz = null, urgent = false;
  for (const z of W.zones) {
    if (z.k === 'laser') continue;
    const d = Math.hypot(h.x - z.x, h.z - z.z);
    if (d < (z.r || 2) + 1.2) { const k = 1 / (d || 1); gx = h.x + (h.x - z.x) * k * 4; gz = h.z + (h.z - z.z) * k * 4; urgent = true; break; }
  }
  if (!urgent) for (const b of W.robots) {
    if (b.type === 'bomber' && b.hp > 0) {
      const d = Math.hypot(h.x - b.x, h.z - b.z);
      if (d < (b.fuse > 0 ? 4.2 : 2.6)) { const k = 1 / (d || 1); gx = h.x + (h.x - b.x) * k * 4; gz = h.z + (h.z - b.z) * k * 4; urgent = true; break; }
    }
  }
  if (!urgent) for (const s of W.shots) {
    if (s.side !== 'r') continue;
    const sp = Math.hypot(s.vx, s.vz) || 1, ux = s.vx / sp, uz = s.vz / sp;
    const rx = h.x - s.x, rz = h.z - s.z, along = rx * ux + rz * uz;
    if (along < 0 || along > 7.5) continue;
    const perp = rx * uz - rz * ux;
    if (Math.abs(perp) > 1.15) continue;
    if (s.dodge == null) s.dodge = W.rnd() < 0.72;
    if (!s.dodge) continue;
    const sg = perp >= 0 ? 1 : -1;
    gx = h.x + uz * sg * 3; gz = h.z - ux * sg * 3; urgent = true;
    if (solidAt(W.A, gx, gz)) { gx = h.x - uz * sg * 3; gz = h.z + ux * sg * 3; }
    break;
  }
  const mates = heroList(W).filter((o) => o !== h);
  if (!urgent) {
    const down = mates.filter((o) => o.st === 1).sort((a, b) => Math.hypot(a.x - h.x, a.z - h.z) - Math.hypot(b.x - h.x, b.z - h.z))[0];
    if (down && Math.hypot(down.x - h.x, down.z - h.z) < 22) { gx = down.x; gz = down.z; urgent = Math.hypot(down.x - h.x, down.z - h.z) < 1.4 ? false : true; if (Math.hypot(down.x - h.x, down.z - h.z) < 1.2) { gx = h.x; gz = h.z; } }
  }
  if (gx == null && h.hp < h.max * 0.4) {
    const d0 = W.drops.filter((d) => d.k === 'hp').sort((a, b) => Math.hypot(a.x - h.x, a.z - h.z) - Math.hypot(b.x - h.x, b.z - h.z))[0];
    if (d0 && Math.hypot(d0.x - h.x, d0.z - h.z) < 14) { gx = d0.x; gz = d0.z; }
  }
  const tgt = autoAim(W, h, H.atk.k === 'lob' ? H.atk.rng : H.atk.rng * 1.25, H.atk.k !== 'lob');
  const near = W.robots.filter((b) => b.hp > 0 && b.sp <= 0).sort((a, b) => Math.hypot(a.x - h.x, a.z - h.z) - Math.hypot(b.x - h.x, b.z - h.z))[0];
  if (gx == null) {
    if (near) {
      const d = Math.hypot(near.x - h.x, near.z - h.z);
      const want = H.want * (h.hp < h.max * 0.45 ? 1.35 : 1);
      const ux = (near.x - h.x) / (d || 1), uz = (near.z - h.z) / (d || 1);
      const k = d > want + 1.2 ? 1 : d < want - 1.2 ? -1 : 0;
      if (k > 0 && !losClear(W.A, h.x, h.z, near.x, near.z, 0.3)) { gx = near.x; gz = near.z; }
      else { gx = h.x + ux * k * 3 + -uz * B.strafe * 1.6; gz = h.z + uz * k * 3 + ux * B.strafe * 1.6; }
    } else {
      const lead = heroList(W).find((o) => !o.bot && o.st === 0) || null;
      if (lead && Math.hypot(lead.x - h.x, lead.z - h.z) > 4) { gx = lead.x; gz = lead.z; }
      else if (!lead) { gx = W.A.wx / 2 + Math.sin(W.t * 0.3 + h.x) * 4; gz = W.A.wz * 0.55; }
    }
  }
  if (urgent && gx != null && B.dT <= 0 && canDash(h)) { B.dT = 0.5; if (W.rnd() < 0.45) inp.dash = Math.atan2(gx - h.x, gz - h.z); }
  if (gx != null) {
    const d = Math.hypot(gx - h.x, gz - h.z);
    if (d > 0.4) {
      const need = !walkClear(W.A, h.x, h.z, gx, gz, 0.5);
      if (need && (Math.abs(B.Fx - gx) > 1.5 || Math.abs(B.Fz - gz) > 1.5 || !B.F)) { B.F = flowFrom(W.A, gx, gz); B.Fx = gx; B.Fz = gz; }
      const [dx, dz] = need ? steerTo(W, h, gx, gz, 0.55, B.F) : [gx - h.x, gz - h.z];
      const L = Math.hypot(dx, dz) || 1;
      const sp = urgent ? 1 : clamp(d / 1.5, 0.35, 1);
      inp.mx = (dx / L) * sp; inp.mz = (dz / L) * sp;
    }
  }
  if (tgt && h.st === 0) {
    inp.aiming = true; inp.aimA = tgt.a;
    const b = W.robots.find((r) => r.id === tgt.id);
    const lead = H.atk.k === 'lob' ? H.atk.flight : tgt.d / (H.atk.spd || 30);
    const tx = b ? b.x + (b.mv ? Math.sin(b.yaw) * b.mv * lead * 0.8 : 0) : tgt.x, tz = b ? b.z + (b.mv ? Math.cos(b.yaw) * b.mv * lead * 0.8 : 0) : tgt.z;
    const a = Math.atan2(tx - h.x, tz - h.z), dist = Math.hypot(tx - h.x, tz - h.z);
    const cnt = W.robots.filter((r) => r.hp > 0 && Math.hypot(r.x - h.x, r.z - h.z) < (H.sup.rng || H.sup.rad || 8) * 0.8).length;
    const boss = W.robots.some((r) => r.type === 'boss' && r.hp > 0 && Math.hypot(r.x - h.x, r.z - h.z) < (H.sup.rng || 8));
    if (h.sup >= 1 && H.sup.k !== 'bloom' && (cnt >= 3 || boss)) inp.fire = { kind: 'sup', a, dist };
    else if (canFire(h) && dist < (H.atk.rng * (H.atk.k === 'lob' ? 1 : 0.98)) && B.t <= 0) { inp.fire = { kind: 'atk', a, dist }; B.t = 0.25 + W.rnd() * 0.35; }
  }
  if (h.sup >= 1 && H.sup.k === 'bloom') {
    const need = heroList(W).filter((o) => Math.hypot(o.x - h.x, o.z - h.z) < H.sup.rad && (o.st === 1 || (o.st === 0 && o.hp < o.max * 0.5))).length;
    if (need >= 1) inp.fire = { kind: 'sup', a: h.yaw, dist: 0 };
  }
  if (B.gT <= 0 && canGadget(h)) {
    B.gT = 0.7 + W.rnd() * 0.8;
    const G = H.gad;
    const close = W.robots.filter((r) => r.hp > 0 && r.sp <= 0 && Math.hypot(r.x - h.x, r.z - h.z) < 3.9).length;
    let use = false, ga = tgt ? tgt.a : h.yaw, gd = tgt ? tgt.d : null;
    if (G.k === 'ring' || G.k === 'nova') use = close >= 2;
    else if (G.k === 'decoy') use = h.hp < h.max * 0.55 && close >= 1;
    else if (G.k === 'mine') use = !!near && Math.hypot(near.x - h.x, near.z - h.z) < 6 && W.rnd() < 0.35;
    else if (G.k === 'bubble') use = close >= 1 && heroList(W).some((o) => o.st === 0 && o.hp < o.max * 0.6 && Math.hypot(o.x - h.x, o.z - h.z) < G.rad);
    else if (G.k === 'charge') use = !!tgt && tgt.d > 2.4 && tgt.d < 6;
    else if (G.k === 'over') use = W.robots.filter((r) => r.hp > 0 && Math.hypot(r.x - h.x, r.z - h.z) < 9).length >= 3;
    else if (G.k === 'jet' && near && h.hp < h.max * 0.4 && close >= 1) { use = true; ga = Math.atan2(h.x - near.x, h.z - near.z); gd = G.len; }
    if (use) inp.gad = { a: ga, dist: gd };
  }
  return inp;
}

export const TYPE_IDX = Object.fromEntries(ROBOT_KEYS.map((k, i) => [k, i]));
export function robotSnap(b) {
  let f = 0;
  if (b.wind > 0) f |= 1;
  if (b.fuse > 0) f |= 2;
  if (b.sp > 0) f |= 4;
  if (b.busy > 0) f |= 8;
  if (b.burst > 0) f |= 16;
  if (b.stun > 0) f |= 32;
  if (b.slowT > 0) f |= 64;
  return [b.id, TYPE_IDX[b.type], Math.round(b.x * 20), Math.round(b.z * 20), Math.round(b.yaw * 100), Math.max(0, Math.round(b.hp)), f, Math.round(b.max), Math.round((b.mv || 0) * 10)];
}
export function applyRobotSnap(W, list, now, at) {
  const seen = new Set();
  for (const a of list) {
    if (!Array.isArray(a) || a.length < 8) continue;
    const id = a[0] | 0, type = ROBOT_KEYS[a[1]] || 'grunt';
    seen.add(id);
    if (W.dead && W.dead.has(id)) continue;
    let b = W.robots.find((r) => r.id === id);
    const x = Number(a[2]) / 20, z = Number(a[3]) / 20, yaw = Number(a[4]) / 100;
    if (!Number.isFinite(x) || !Number.isFinite(z)) continue;
    if (!b) { b = mkRobot(id, type, x, z, null); b.max = Math.max(1, a[7] | 0); b.hp = a[5] | 0; b.yaw = yaw; b.nb = mkNet(); netPush(b.nb, at, [x, z, yaw]); b.netAt = now; b.sp = a[6] & 4 ? 0.6 : 0; W.robots.push(b); emit(W, { k: 'spawn', id, type, x, z, remote: true }); continue; }
    netPush(b.nb || (b.nb = mkNet()), at, [x, z, yaw]);
    b.netAt = now;
    const hp = a[5] | 0;
    b.hp = W.t - (b.predAt || -9) < 0.65 ? Math.min(b.hp, hp) : hp;
    b.max = Math.max(1, a[7] | 0);
    const f = a[6] | 0;
    b.wind = f & 1 ? 0.3 : 0; b.fuse = f & 2 ? Math.max(b.fuse || 0, 0.01) : 0; b.sp = f & 4 ? Math.max(b.sp, 0.05) : 0; b.busy = f & 8 ? 0.2 : 0; b.burst = f & 16 ? 1 : 0; b.stunV = f & 32 ? 1 : 0; b.slowV = f & 64 ? 1 : 0;
    b.mv = (a[8] | 0) / 10;
  }
  for (let i = W.robots.length - 1; i >= 0; i--) {
    const b = W.robots[i];
    if (!seen.has(b.id)) { W.robots.splice(i, 1); markDead(W, b.id); emit(W, { k: 'kill', id: b.id, type: b.type, x: b.x, z: b.z, by: null, remote: true }); }
  }
}
function markDead(W, id) { if (!W.dead) W.dead = new Map(); W.dead.set(id, W.t); if (W.dead.size > 80) for (const [k, t] of W.dead) if (W.t - t > 6) W.dead.delete(k); }
export function smoothRobots(W, dt) {
  const k = 1 - Math.exp(-dt * 24);
  for (const b of W.robots) {
    if (!b.nb) continue;
    const v = netRead(b.nb, b.nv || (b.nv = [b.x, b.z, b.yaw]), { ang: [2], lin: [0, 1], ext: 200, base: 125, cap: 440, snap: 6 });
    if (!v) continue;
    const ox = b.x, oz = b.z;
    b.x = v[0]; b.z = v[1];
    b.walk += Math.hypot(b.x - ox, b.z - oz);
    b.yaw += wrapA(v[2] - b.yaw) * k;
  }
}
export function applyNetEvent(W, e) {
  if (!Array.isArray(e)) return;
  const k = e[0];
  if (k === 's') { const rid = e[1] | 0, x = +e[2], z = +e[3], a = +e[4]; if ([x, z, a].every(Number.isFinite)) spawnRobotShot(W, rid, x, z, a, clamp(+e[5] || 12, 4, 30), clamp(e[6] | 0, 0, 5000), e[7] === 'tb' ? 'tb' : 'eb'); }
  else if (k === 'm') { const h = W.heroes[e[2]]; const d = clamp(e[3] | 0, 0, 5000); emit(W, { k: 'melee', id: e[1] | 0, to: e[2], d }); if (h && W.local && W.local.has(h.id)) hurtHero(W, h, d, e[1] | 0); }
  else if (k === 'z') {
    const z = { k: ['boom', 'stomp', 'mis', 'laser'].includes(e[1]) ? e[1] : 'boom', x: +e[2], z: +e[3], r: clamp(+e[4] || 0, 0, 12), d: clamp(e[5] | 0, 0, 6000), t: clamp(+e[6] || 0, 0, 4), a: +e[7] || 0, a1: +e[8] || 0, dur: clamp(+e[9] || 0, 0, 4), len: clamp(+e[10] || 0, 0, 40) };
    if (Number.isFinite(z.x) && Number.isFinite(z.z)) addZone(W, z, false);
  } else if (k === 'k') { const id = e[1] | 0; markDead(W, id); const b = W.robots.find((r) => r.id === id); if (b) { W.robots.splice(W.robots.indexOf(b), 1); emit(W, { k: 'kill', id: b.id, type: b.type, x: b.x, z: b.z, by: typeof e[2] === 'string' ? e[2] : null, remote: true }); } }
  else if (k === 'f') { const b = W.robots.find((r) => r.id === (e[1] | 0)); if (b) { b.fuse = ROBOTS.bomber.fuse; emit(W, { k: 'fuse', id: b.id }); } }
  else if (k === 'w') emit(W, { k: 'wave', n: e[1] | 0, remote: true });
  else if (k === 'mn') { const i = W.mines.findIndex((o) => o.id === String(e[1])); if (i >= 0) { const mn = W.mines.splice(i, 1)[0]; mineBoom(W, mn, false); } }
  else if (k === 'c') emit(W, { k: 'clear', n: e[1] | 0, remote: true });
}
