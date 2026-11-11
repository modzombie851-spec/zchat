import { genTemple } from './duogen.js';

export const TAU = Math.PI * 2;
export const SPEED = 3.1;
export const LIGHT_R = 2.7;
export const LIVES = 3;
export const SPIKE_P = 2.4;
export const SPIKE_UP = 1.0;
export const TDOOR_T = 5;
export const CRACK_T = 0.6;
export const FALLEN_T = 3.4;
export const ENDLESS = 100;
export const GLYPHS = ['sun', 'moon', 'leaf', 'wave', 'star'];
export const FOES = { bat: { hp: 1, r: 0.28, sp: 1.5, name: 'bat' }, slime: { hp: 2, r: 0.32, sp: 1.25, name: 'slime' }, skel: { hp: 3, r: 0.3, sp: 1.25, name: 'bone knight' } };
const FOE_CH = { v: 'bat', g: 'slime', x: 'skel' };
export const SHOT_SP = 8.5, SHOT_LIFE = 0.72, ATK_CD = 0.42, FREEZE_T = 3.4;
export const GLYPH_NAMES = { sun: 'Sun', moon: 'Moon', leaf: 'Leaf', wave: 'Wave', star: 'Star' };
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export function mulberry(a) {
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export function hashSeed(s) {
  let h = 2166136261;
  const str = String(s || 'duo');
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export const LEVELS = [
  {
    name: 'First light',
    goal: 'Pull both levers, then stand on your doors together',
    theme: 'sand', par: 10.5,
    map: [
      '###############',
      '####..X.Y..####',
      '####.......####',
      '#######H#######',
      '#.............#',
      '#.LLL.....WWW.#',
      '#.LhL.....WhW.#',
      '#.LLL.....WWW.#',
      '#.............#',
      '#......f......#',
      '#..A.......B..#',
      '###############',
    ],
    gems: [[3, 5, 'sun'], [13, 4, 'sun'], [11, 7, 'moon'], [1, 4, 'moon']],
  },
  {
    name: 'Hold the door',
    goal: 'Stand on a round plate to hold the door open for your partner',
    theme: 'crystal', par: 20.7,
    map: [
      '###############',
      '###..X...Y..###',
      '###.........###',
      '###...o.....###',
      '######OOO######',
      '#.......o.....#',
      '#......f......#',
      '#CCCCCbbCCCCCC#',
      '#CCCCbbCCCCCCC#',
      '#CCCCCbbbCCCCC#',
      '#CCCCCCCbCCCCC#',
      '#......f......#',
      '#.WWW.....LLL.#',
      '#.WWW.....LLL.#',
      '#..A.......B..#',
      '###############',
    ],
    gems: [[11, 13, 'sun'], [11, 2, 'sun'], [2, 13, 'moon'], [5, 8, 'moon']],
  },
  {
    name: 'Old secrets',
    goal: 'Read the code in blue light, burn the vines, light both fires',
    theme: 'jungle', par: 26.8,
    map: [
      '###############',
      '###..X...Y..###',
      '###....T....###',
      '###.........###',
      '######EEE######',
      '#F...........N#',
      '#......f......#',
      '#M#####Dq######',
      '#.........#...#',
      '#.........V.k.#',
      '#..PPP....#...#',
      '#......f..#####',
      '#.WW.....LL...#',
      '#..A.......B..#',
      '###############',
    ],
    gems: [[9, 12, 'sun'], [3, 6, 'sun'], [2, 12, 'moon'], [13, 8, 'moon']],
  },
  {
    name: 'Two Torches',
    goal: 'Everything you learned, in one long climb',
    theme: 'forge', par: 42.8,
    map: [
      '###############',
      '###..X...Y..###',
      '###....T....###',
      '###...f.....###',
      '######EEE######',
      '#F...........N#',
      '#.WWW.....LLL.#',
      '#.WWW.....LLL.#',
      '######...######',
      '#......f......#',
      '#CCCCCbbCCCCCC#',
      '#CCCbbbCCCCCCC#',
      '#CCCCCbbbCCCCC#',
      '#CCCCCCCbCCCCC#',
      '#.......f.....#',
      '#M####Dq#######',
      '#..........#..#',
      '#..........V.k#',
      '#...PPP....#..#',
      '#......f...####',
      '#######H#######',
      '#.............#',
      '#LLLLL...WWWWW#',
      '#LhLLL...WWWhW#',
      '#LLLLL...WWWWW#',
      '#.............#',
      '#..A.......B..#',
      '#......f......#',
      '###############',
    ],
    gems: [[4, 23, 'sun'], [4, 11, 'sun'], [11, 7, 'sun'], [10, 23, 'moon'], [13, 18, 'moon'], [3, 7, 'moon']],
  },
  {
    name: 'Deep halls',
    goal: 'Two doors, two plates and a long dark bridge',
    theme: 'ice', par: 31.9,
    map: [
      '###############',
      '###..X...Y..###',
      '###.........###',
      '#####JJJ#######',
      '#..j.......j..#',
      '#.PPP.....PPP.#',
      '#......f......#',
      '#CCCCCCbCCCCCC#',
      '#CCCCCCbbCCCCC#',
      '#CCCCCCCbCCCCC#',
      '#CCCCCbbbCCCCC#',
      '#CCCCCbCCCCCCC#',
      '#..o...f......#',
      '#####OOO#######',
      '#.........o...#',
      '#.WWWW...LLLL.#',
      '#.WWWW...LLLL.#',
      '#..A.......B..#',
      '###############',
    ],
    gems: [[10, 16, 'sun'], [12, 4, 'sun'], [2, 16, 'moon'], [7, 8, 'moon'], [6, 11, 'moon'], [13, 14, 'sun']],
  },
];

const CURATED = [
  { seed: 'story6', theme: 'jungle', rooms: ['portal', 'gate'], name: 'Ring of roots', goal: 'Step on the glowing rings to jump across' },
  { seed: 'story7', theme: 'sand', rooms: ['spikes', 'split'], name: 'Spike court', goal: 'Cross the spikes when they drop, then take your own road' },
  { seed: 'story8', theme: 'ice', rooms: ['ice', 'plate'], name: 'Slippery keep', goal: 'Slide across the ice and hold the door for each other' },
  { seed: 'story9', theme: 'crystal', rooms: ['crumble', 'code', 'bridge'], name: 'Falling floors', goal: 'Cracked floor falls away, keep moving' },
  { seed: 'story10', theme: 'forge', rooms: ['timed', 'gate', 'fires'], name: 'The furnace', goal: 'Race the timed door, then light both fires' },
  { seed: 'story11', theme: 'crystal', rooms: ['foes', 'gate'], name: 'Bat cave', goal: 'Fire burns the bats. Frost freezes them, then one more hit breaks them', depth: 2 },
  { seed: 'story12', theme: 'sand', rooms: ['beam', 'plate'], name: 'Mirror hall', goal: 'Turn the mirrors so the light reaches the crystal', depth: 2 },
  { seed: 'story13', theme: 'jungle', rooms: ['split', 'foes', 'bridge'], name: 'Slime garden', goal: 'Slimes hop at you. Freeze them and break them together', depth: 3 },
  { seed: 'story14', theme: 'ice', rooms: ['beam', 'ice', 'foes'], name: 'Cold light', goal: 'Bend the light across the frozen hall', depth: 3 },
  { seed: 'story15', theme: 'tomb', rooms: ['foes', 'spikes', 'gate'], name: 'Bone keep', goal: 'Bone knights take three fireballs. Frost them first', depth: 3 },
  { seed: 'story16', theme: 'sky', rooms: ['portal', 'beam', 'crumble'], name: 'Sky steps', goal: 'Rings, mirrors and falling floors high above the clouds', depth: 4 },
  { seed: 'story17', theme: 'tomb', rooms: ['foes', 'code', 'hall', 'foes'], name: 'Old guard', goal: 'Get past the guards and read the hidden code', depth: 4 },
  { seed: 'story18', theme: 'sky', rooms: ['beam', 'fires', 'foes', 'gate'], name: 'Sun prism', goal: 'Light, fire and a long climb', depth: 4 },
  { seed: 'story19', theme: 'forge', rooms: ['foes', 'timed', 'beam', 'crumble'], name: 'Deep forge', goal: 'Every trick you know, in one hot temple', depth: 5 },
  { seed: 'story20', theme: 'crystal', rooms: ['split', 'beam', 'foes', 'fires', 'gate'], name: 'The last torch', goal: 'The longest temple. Stay together', depth: 6 },
];
export const STORY_N = LEVELS.length + CURATED.length;

const defCache = new Map();
export function levelDef(li, rs) {
  const key = li >= ENDLESS ? `e:${rs}:${li}` : `s:${li}`;
  if (defCache.has(key)) return defCache.get(key);
  let L;
  if (li >= ENDLESS) L = makeChecked(String(rs || 'run'), li - ENDLESS + 1, null);
  else if (li < LEVELS.length) L = LEVELS[li] || LEVELS[0];
  else {
    const c = CURATED[li - LEVELS.length] || CURATED[0];
    L = makeChecked(c.seed, c.depth || 3, { theme: c.theme, rooms: c.rooms, chest: true });
    L = { ...L, name: c.name, goal: c.goal };
  }
  defCache.set(key, L);
  return L;
}
function makeChecked(rs, depth, opts) {
  for (let salt = 0; salt < 24; salt++) {
    const L = genTemple(rs, depth, salt, opts);
    if (checkDef(L).ok) return L;
  }
  return LEVELS[0];
}

const WALLISH = new Set(['#', 'M', 'q', 'U', 'R']);
export const isWallCh = (ch) => WALLISH.has(ch);
const PADS = '1234';
export const isPad = (ch) => PADS.includes(ch);

function findAll(map, ch) {
  const out = [];
  for (let y = 0; y < map.length; y++) for (let x = 0; x < map[y].length; x++) if (map[y][x] === ch) out.push([x, y]);
  return out;
}

export function mkPlayer(kind, x, y) {
  return { kind, x: x + 0.5, y: y + 0.55, vx: 0, vy: 0, r: 0.27, dir: 'down', phase: 0, moving: false, cp: { x: x + 0.5, y: y + 0.55 }, ax: 0, ay: 1, atkCd: 0, shots: 0, atkT: 0, dead: 0, die: null, fallT: 0, stepT: 0, blinkT: 2 + Math.random() * 3, blink: 0, spawnT: 0.6, deaths: 0, tp: 0, tpLock: null, onT: false, nb: null };
}

export function makeWorld(li, seed, attempt, rs) {
  const L = levelDef(li, rs);
  return worldFrom(L, li, seed, attempt, rs);
}
export function worldFrom(L, li, seed, attempt, rs) {
  const map = L.map;
  const MH = map.length, MW = map[0].length;
  const rnd = mulberry(hashSeed(`${seed}:${li}:${rs || ''}`));
  const pool = GLYPHS.slice();
  const code = [];
  for (let i = 0; i < 3; i++) code.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
  const one = (ch) => { const a = findAll(map, ch); return a.length ? { x: a[0][0], y: a[0][1] } : null; };
  const A = one('A'), B = one('B');
  const W = {
    li, rs: rs || null, L, map, MW, MH, theme: L.theme || 'sand', seed, attempt: attempt || 0, t: 0, clk: 0, time: 0,
    lives: LIVES, deaths: new Set(), out: false, won: false, winAt: 0,
    p: { sun: mkPlayer('sun', A.x, A.y), moon: mkPlayer('moon', B.x, B.y) },
    levers: {}, gateAmt: { H: 0, J: 0 },
    plates: findAll(map, 'o'), pdoor: 0, pressed: false,
    tplates: findAll(map, 't'), tdoorUntil: -99, qdoor: 0,
    spikes: findAll(map, 'S').map(([x, y]) => [x, y, 0]).concat(findAll(map, 's').map(([x, y]) => [x, y, 0.5])),
    crumble: {}, tps: {},
    code, codeSolved: false, codeAmt: 0, codeGlow: 0, mural: 0,
    muralAt: one('M'), dialAt: one('q'),
    vines: { tiles: findAll(map, 'V'), burn: 0, done: false },
    key: null, chest: null, braz: null, great: { open: false, amt: 0, tiles: findAll(map, 'E') },
    gems: (L.gems || []).map(([x, y, k]) => ({ x, y, k, taken: false, pop: 0 })),
    flags: findAll(map, 'f').map(([x, y]) => ({ x, y, by: null, wave: 0 })),
    exits: { sun: one('X'), moon: one('Y') }, exitT: 0, doorOn: { sun: false, moon: false },
    outbox: [], fx: [], parts: [], shake: 0,
  };
  findAll(map, 'K').forEach(([x, y]) => { W.crumble[`${x},${y}`] = { x, y, n: 0, at: -99 }; });
  for (const d of PADS) { const a = findAll(map, d); if (a.length === 2) W.tps[d] = a; }
  findAll(map, 'h').forEach(([x, y]) => { W.levers[`${x},${y}`] = { x, y, g: 'H', on: 0 }; });
  findAll(map, 'j').forEach(([x, y]) => { W.levers[`${x},${y}`] = { x, y, g: 'J', on: 0 }; });
  const k = one('k');
  if (k) W.key = { x: k.x + 0.5, y: k.y + 0.55, held: null, used: false };
  const T = one('T');
  if (T) W.chest = { x: T.x, y: T.y, done: false, open: 0 };
  const F = one('F'), N = one('N');
  if (F && N) W.braz = { F: { x: F.x, y: F.y, lit: 0, perm: false }, N: { x: N.x, y: N.y, lit: 0, perm: false } };
  W.lava = findAll(map, 'L');
  W.foes = [];
  let fid = 1;
  for (const ch of Object.keys(FOE_CH)) findAll(map, ch).forEach(([x, y]) => { const k = FOE_CH[ch]; W.foes.push({ id: fid++, k, x: x + 0.5, y: y + 0.55, hx: x + 0.5, hy: y + 0.55, hp: FOES[k].hp, frz: 0, dead: 0, vx: 0, vy: 0, t: rnd() * 6, mode: 0, mt: rnd() * 1.2, cool: 1 + rnd() * 2, dir: rnd() < 0.5 ? -1 : 1, hit: 0, face: 1, r: FOES[k].r, kind: 'foe', tx: null, ty: null, hop: 0 }); });
  W.shots = [];
  W.mirrors = {};
  findAll(map, 'm').forEach(([x, y]) => { W.mirrors[`${x},${y}`] = { x, y, o: 0, spin: 0 }; });
  findAll(map, 'n').forEach(([x, y]) => { W.mirrors[`${x},${y}`] = { x, y, o: 1, spin: 0 }; });
  const U = one('U'), R = one('R');
  if (U && R) {
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const d = dirs.find(([dx, dy]) => { const c = (map[U.y + dy] || '')[U.x + dx]; return c && !isWallCh(c); }) || [1, 0];
    W.beam = { src: U, dst: R, dir: d, path: [], hit: false, amt: 0, open: false };
  } else W.beam = null;
  return W;
}

export const at = (W, x, y) => (x < 0 || y < 0 || x >= W.MW || y >= W.MH ? '#' : W.map[y][x]);
export const alive = (p) => p.dead <= 0;
export const dist = (p, x, y) => Math.hypot(p.x - x, p.y - y);
export function gateOpen(W, g) { const ls = Object.values(W.levers).filter((l) => l.g === g); return ls.length > 0 && ls.every((l) => l.on); }

export function spikePhase(W, off) { const P = SPIKE_P; return ((((W.t + W.clk) / P + off) % 1) + 1) % 1 * P; }
export function spikeAmt(W, off) {
  const ph = spikePhase(W, off);
  if (ph >= SPIKE_UP) return 0;
  if (ph < 0.1) return ph / 0.1;
  if (ph > SPIKE_UP - 0.12) return (SPIKE_UP - ph) / 0.12;
  return 1;
}
export function spikeWarn(W, off) { const ph = spikePhase(W, off); return ph > SPIKE_P - 0.45 ? (ph - (SPIKE_P - 0.45)) / 0.45 : 0; }
export function spikeOff(ch) { return ch === 's' ? 0.5 : 0; }
export function crumbleState(W, x, y) {
  const c = W.crumble[`${x},${y}`];
  if (!c || c.at < -50) return { s: 0, k: 0 };
  const e = W.t - c.at;
  if (e < 0) return { s: 0, k: 0 };
  if (e < CRACK_T) return { s: 1, k: e / CRACK_T };
  if (e < CRACK_T + FALLEN_T) return { s: 2, k: (e - CRACK_T) / FALLEN_T };
  return { s: 0, k: 0 };
}

const MIRROR = [0.12, 0.18, 0.88, 0.9];
const FULL = [0, 0, 1, 1], BRAZ = [0.16, 0.22, 0.84, 0.86], LEVER = [0.18, 0.3, 0.82, 0.82], CHEST = [0.08, 0.3, 0.92, 0.9];
export function box(W, tx, ty, kind) {
  const ch = at(W, tx, ty);
  switch (ch) {
    case '#': case 'M': case 'q': case 'U': case 'R': return FULL;
    case 'H': return W.gateAmt.H > 0.82 ? null : FULL;
    case 'J': return W.gateAmt.J > 0.82 ? null : FULL;
    case 'O': return W.pdoor > 0.82 ? null : FULL;
    case 'Q': return W.qdoor > 0.82 ? null : FULL;
    case 'D': return W.codeAmt > 0.82 ? null : FULL;
    case 'E': return W.great.amt > 0.82 ? null : FULL;
    case 'G': return W.beam && W.beam.amt > 0.82 ? null : FULL;
    case 'm': case 'n': return MIRROR;
    case 'V': return W.vines.done ? null : FULL;
    case 'Z': return kind === 'sun' ? null : FULL;
    case 'z': return kind === 'moon' ? null : FULL;
    case 'F': case 'N': return BRAZ;
    case 'h': case 'j': return LEVER;
    case 'T': return CHEST;
    default: return null;
  }
}
export function resolve(W, e) {
  for (let it = 0; it < 2; it++) {
    const x0 = Math.floor(e.x - e.r), x1 = Math.floor(e.x + e.r), y0 = Math.floor(e.y - e.r), y1 = Math.floor(e.y + e.r);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      const b = box(W, tx, ty, e.kind);
      if (!b) continue;
      const bx0 = tx + b[0], by0 = ty + b[1], bx1 = tx + b[2], by1 = ty + b[3];
      const cx = clamp(e.x, bx0, bx1), cy = clamp(e.y, by0, by1);
      const dx = e.x - cx, dy = e.y - cy, d2 = dx * dx + dy * dy;
      if (d2 >= e.r * e.r) continue;
      if (d2 > 1e-10) { const d = Math.sqrt(d2), pp = e.r - d; e.x += dx / d * pp; e.y += dy / d * pp; }
      else { const l = e.x - bx0, r = bx1 - e.x, u = e.y - by0, dn = by1 - e.y, m = Math.min(l, r, u, dn); if (m === l) e.x = bx0 - e.r; else if (m === r) e.x = bx1 + e.r; else if (m === u) e.y = by0 - e.r; else e.y = by1 + e.r; }
    }
  }
}
function moveEnt(W, e, dx, dy) { const n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 0.12)); for (let i = 0; i < n; i++) { e.x += dx / n; e.y += dy / n; resolve(W, e); } }
export function onTile(p, tx, ty, inset) { const k = inset == null ? 0.12 : inset; return p.x > tx + k && p.x < tx + 1 - k && p.y > ty + k && p.y < ty + 1 - k; }
export function litAt(W, x, y) {
  const m = W.p.moon;
  if (!alive(m)) return 0;
  const d = Math.hypot(m.x - (x + 0.5), m.y - 0.3 - (y + 0.5));
  return clamp((LIGHT_R + 0.3 - d) / 0.6, 0, 1);
}
export function deadly(W, kind, tx, ty) {
  const ch = at(W, tx, ty);
  if (ch === 'P') return 'goo';
  if (ch === 'C') return 'fall';
  if (ch === 'L' && kind === 'moon') return 'lava';
  if (ch === 'W' && kind === 'sun') return 'water';
  if ((ch === 'S' || ch === 's') && spikeAmt(W, spikeOff(ch)) > 0.5) return 'spike';
  if (ch === 'K' && crumbleState(W, tx, ty).s === 2) return 'fall';
  return null;
}
export function passFor(W, kind, x, y, opts) {
  const ch = at(W, x, y);
  const o = opts || {};
  if (WALLISH.has(ch)) return false;
  if (ch === 'H') return !!(o.H || W.gateAmt.H > 0.82);
  if (ch === 'J') return !!(o.J || W.gateAmt.J > 0.82);
  if (ch === 'O') return !!(o.O || W.pdoor > 0.82);
  if (ch === 'Q') return !!(o.Q || W.qdoor > 0.82);
  if (ch === 'D') return !!(o.D || W.codeAmt > 0.82);
  if (ch === 'E') return !!(o.E || W.great.amt > 0.82);
  if (ch === 'G') return !!(o.G || (W.beam && W.beam.amt > 0.82));
  if (ch === 'm' || ch === 'n') return false;
  if (ch === 'V') return !!(o.V || W.vines.done);
  if (ch === 'Z') return kind === 'sun';
  if (ch === 'z') return kind === 'moon';
  if (ch === 'F' || ch === 'N' || ch === 'h' || ch === 'j' || ch === 'T') return false;
  if (ch === 'P' || ch === 'C') return false;
  if (ch === 'L' && kind === 'moon') return false;
  if (ch === 'W' && kind === 'sun') return false;
  if (ch === 'b' && kind === 'sun') return o.b ? o.b(x, y) : litAt(W, x, y) >= 0.9;
  if (ch === 'K' && !o.b && crumbleState(W, x, y).s === 2) return false;
  return true;
}
function padPair(W, x, y) {
  const ch = at(W, x, y);
  const pr = W.tps[ch];
  if (!pr) return null;
  return pr[0][0] === x && pr[0][1] === y ? pr[1] : pr[0];
}
export function bfs(W, sx, sy, gx, gy, kind, opts) {
  const MW = W.MW, MH = W.MH, N = MW * MH;
  const prev = new Int32Array(N).fill(-2), q = new Int32Array(N);
  let h = 0, tl = 0;
  const s0 = sy * MW + sx;
  prev[s0] = -1; q[tl++] = s0;
  const goal = gy * MW + gx;
  while (h < tl) {
    const k = q[h++];
    if (k === goal) break;
    const x = k % MW, y = (k / MW) | 0;
    const nb = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
    const pp = padPair(W, x, y);
    if (pp) nb.push(pp);
    for (const [nx, ny] of nb) {
      if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) continue;
      const nk = ny * MW + nx;
      if (prev[nk] !== -2) continue;
      if (nk !== goal && !passFor(W, kind, nx, ny, opts)) continue;
      prev[nk] = k; q[tl++] = nk;
    }
  }
  if (prev[goal] === -2) return null;
  const path = [];
  let k = goal;
  while (k !== -1) { path.push({ x: k % MW, y: (k / MW) | 0 }); k = prev[k]; }
  return path.reverse();
}

function emit(W, ev) { W.outbox.push(ev); applyEvent(W, ev, false); }
function fx(W, k, extra) { W.fx.push({ k, ...(extra || {}) }); }

export function applyEvent(W, ev, remote) {
  if (!ev || !ev.k) return;
  switch (ev.k) {
    case 'lever': { const l = W.levers[ev.id]; if (!l || l.on) return; l.on = 1; fx(W, 'lever', { x: l.x, y: l.y, who: ev.who }); if (gateOpen(W, l.g)) fx(W, 'gate', { g: l.g }); break; }
    case 'gem': { const g = W.gems[ev.i]; if (!g || g.taken) return; g.taken = true; fx(W, 'gem', { x: g.x, y: g.y, kk: g.k, who: ev.who }); break; }
    case 'burn': if (W.vines.done || W.vines.burn > 0) return; W.vines.burn = 0.001; fx(W, 'burn'); break;
    case 'key':
      if (!W.key || W.key.used || W.key.held) return;
      if (ev.req && !W.host) return;
      W.key.held = ev.who; fx(W, 'key', { who: ev.who });
      if (ev.req && W.host) W.outbox.push({ k: 'key', who: ev.who });
      break;
    case 'chest': if (!W.chest || W.chest.done) return; W.chest.done = true; if (W.key) { W.key.used = true; W.key.held = null; } fx(W, 'chest'); break;
    case 'code': if (W.codeSolved) return; W.codeSolved = true; fx(W, 'code'); break;
    case 'light': { if (!W.braz) return; const z = W.braz[ev.b]; if (!z || z.perm) return; z.lit = 7; fx(W, 'fire', { b: ev.b }); break; }
    case 'great': if (!W.braz || W.great.open) return; W.great.open = true; W.braz.F.perm = W.braz.N.perm = true; W.shake = 0.5; fx(W, 'great'); break;
    case 'crack': { const c = W.crumble[ev.id]; if (!c || (ev.n || 0) <= c.n) return; c.n = ev.n; c.at = W.t; fx(W, 'crack', { x: c.x, y: c.y }); break; }
    case 'tplate': { const was = W.t < W.tdoorUntil; W.tdoorUntil = Math.max(W.tdoorUntil, W.t + TDOOR_T); if (!was) fx(W, 'tplate', { who: ev.who }); break; }
    case 'die': {
      if (W.deaths.has(ev.id)) return;
      W.deaths.add(ev.id);
      W.lives = Math.max(0, LIVES - W.deaths.size);
      const p = W.p[ev.who];
      if (p && remote && p.dead <= 0) { p.dead = 1.15; p.die = ev.why; p.fallT = 0; }
      fx(W, 'die', { who: ev.who, why: ev.why, x: p ? p.x : 0, y: p ? p.y : 0 });
      if (W.lives <= 0 && !W.won) { W.out = true; fx(W, 'out'); }
      break;
    }
    case 'flag': { const f = W.flags[ev.i]; if (!f) return; f.by = ev.who; f.wave = 1; break; }
    case 'win': if (W.won || W.out) return; W.won = true; W.winAt = W.t; fx(W, 'win'); break;
    case 'shot': {
      if (!W.shots || W.shots.some((q) => q.id === ev.id)) return;
      W.shots.push({ id: ev.id, who: ev.who, k: ev.who === 'sun' ? 'fire' : 'ice', x: ev.x, y: ev.y, dx: ev.dx, dy: ev.dy, life: SHOT_LIFE, age: 0 });
      const sp = W.p[ev.who]; if (sp && remote) sp.atkT = 0.2;
      fx(W, 'shot', { who: ev.who, x: ev.x, y: ev.y });
      break;
    }
    case 'foe': {
      const f = W.foes && W.foes.find((q) => q.id === ev.id);
      if (!f || f.dead > 0) return;
      f.hp = ev.hp;
      if (ev.frz != null) f.frz = ev.frz;
      if (ev.dead) { f.dead = 0.001; f.frz = 0; fx(W, 'foedie', { x: f.x, y: f.y, kk: f.k, by: ev.by, ice: ev.hit === 'ice' || ev.shatter }); }
      else if (ev.hit) { f.hit = 0.25; fx(W, ev.hit === 'ice' ? 'freeze' : 'foehit', { x: f.x, y: f.y, kk: f.k }); }
      break;
    }
    case 'mir': { const m = W.mirrors && W.mirrors[ev.id]; if (!m || m.o === ev.o) return; m.o = ev.o; m.spin = 0.25; if (!remote) m.at = W.t; fx(W, 'mirror', { x: m.x, y: m.y, who: ev.who }); break; }
    case 'beam': if (!W.beam || W.beam.open) return; W.beam.open = true; fx(W, 'beam'); break;
    default: break;
  }
}

export function snapshot(W) {
  return {
    li: W.li, a: W.attempt, rs: W.rs, tc: +W.t.toFixed(2),
    lv: Object.keys(W.levers).filter((k) => W.levers[k].on),
    gm: W.gems.map((g, i) => (g.taken ? i : -1)).filter((i) => i >= 0),
    bu: W.vines.burn > 0 || W.vines.done ? 1 : 0,
    ky: W.key ? (W.key.used ? 'used' : W.key.held) : null,
    ch: W.chest && W.chest.done ? 1 : 0,
    cd: W.codeSolved ? 1 : 0,
    gr: W.great.open ? 1 : 0,
    de: [...W.deaths],
    wn: W.won ? 1 : 0,
    fo: (W.foes || []).map((f) => [f.id, f.hp, f.dead > 0 ? 1 : 0]),
    mr: Object.keys(W.mirrors || {}).map((k) => W.mirrors[k].o).join(''),
    bm: W.beam && W.beam.open ? 1 : 0,
  };
}
export function sameLevel(W, s) { return !!s && s.li === W.li && s.a === W.attempt && (s.rs || null) === (W.rs || null); }
export function mergeSnapshot(W, s, fromHost) {
  if (!sameLevel(W, s)) return;
  (s.lv || []).forEach((id) => applyEvent(W, { k: 'lever', id }, true));
  (s.gm || []).forEach((i) => applyEvent(W, { k: 'gem', i }, true));
  if (s.bu) applyEvent(W, { k: 'burn' }, true);
  if (s.ky && W.key) {
    if (s.ky === 'used') { if (!W.key.used) { W.key.used = true; W.key.held = null; } }
    else if (!W.key.held && !W.key.used) { if (fromHost || W.host) applyEvent(W, { k: 'key', who: s.ky }, true); }
    else if (fromHost && W.key.held !== s.ky) W.key.held = s.ky;
  }
  if (s.ch) applyEvent(W, { k: 'chest' }, true);
  if (s.cd) applyEvent(W, { k: 'code' }, true);
  if (s.gr && fromHost) applyEvent(W, { k: 'great' }, true);
  (s.de || []).forEach((id) => { if (!W.deaths.has(id)) { const who = String(id).split(':')[0]; applyEvent(W, { k: 'die', id, who, why: 'fall' }, true); } });
  if (s.wn && fromHost) applyEvent(W, { k: 'win' }, true);
  if (fromHost && s.fo && W.foes) s.fo.forEach(([id, hp, dd]) => { const f = W.foes.find((q) => q.id === id); if (!f || f.dead > 0) return; if (dd) applyEvent(W, { k: 'foe', id, hp: 0, dead: 1 }, true); else f.hp = hp; });
  if (fromHost && s.mr && W.mirrors) Object.keys(W.mirrors).forEach((k, i) => { const m = W.mirrors[k]; const o = Number(s.mr[i]); if ((o === 0 || o === 1) && m.o !== o && !(m.at != null && W.t - m.at < 3.5)) applyEvent(W, { k: 'mir', id: k, o }, true); });
  if (s.bm && fromHost) applyEvent(W, { k: 'beam' }, true);
}
export function foeRows(W) { return (W.foes || []).filter((f) => f.dead <= 0).map((f) => [f.id, Math.round(f.x * 100), Math.round(f.y * 100), Math.round(f.frz * 10), f.mode, Math.round((f.hop || 0) * 100)]); }
export function setFoes(W, rows) {
  for (const [id, x, y, frz, mode, hop] of rows || []) {
    const f = W.foes.find((q) => q.id === id);
    if (!f || f.dead > 0) continue;
    if (f.tx == null || Math.hypot(x / 100 - f.x, y / 100 - f.y) > 3) { f.x = x / 100; f.y = y / 100; }
    f.tx = x / 100; f.ty = y / 100; f.frz = frz / 10; f.mode = mode; f.thop = hop / 100; f.seen = Date.now();
  }
}
export function syncClock(W, hostT, rttMs) {
  const target = hostT + Math.min(0.6, (rttMs || 0) / 2000) - W.t;
  if (Math.abs(target - W.clk) > 0.6) W.clk = target; else W.clk += (target - W.clk) * 0.35;
}

function die(W, p, why) {
  if (p.dead > 0 || W.won || W.out) return;
  p.die = why; p.dead = 1.15; p.fallT = 0; p.deaths += 1;
  emit(W, { k: 'die', who: p.kind, why, id: `${p.kind}:${W.attempt}:${p.deaths}` });
}
function respawn(W, p) {
  p.x = p.cp.x; p.y = p.cp.y; p.vx = p.vy = 0; p.die = null; p.spawnT = 0.6; p.fallT = 0; p.tp += 1; p.tpLock = null;
  fx(W, 'spawn', { who: p.kind });
}
function drive(W, p, tx, ty, dt) {
  if (p.dead > 0) { tx = 0; ty = 0; }
  const ice = at(W, Math.floor(p.x), Math.floor(p.y)) === 'I';
  const k = 1 - Math.exp(-dt * (ice ? 2.2 : 14));
  p.vx += (tx - p.vx) * k; p.vy += (ty - p.vy) * k;
  if (p.dead > 0) { p.vx *= 0.8; p.vy *= 0.8; }
  const sp0 = Math.hypot(p.vx, p.vy), cap = SPEED * 1.05;
  if (sp0 > cap) { p.vx *= cap / sp0; p.vy *= cap / sp0; }
  moveEnt(W, p, p.vx * dt, p.vy * dt);
  const sp = Math.hypot(p.vx, p.vy);
  p.moving = sp > 0.3 && p.dead <= 0;
  if (sp > 0.6 && Math.hypot(tx, ty) > 0.3) { const tl = Math.hypot(tx, ty); p.ax = tx / tl; p.ay = ty / tl; }
  p.ice = ice;
  animate(p, dt, sp);
}
function animate(p, dt, sp) {
  if (p.moving) {
    p.phase += dt * (5 + sp * 2.4);
    if (Math.abs(p.vx) > Math.abs(p.vy) * 1.15) p.dir = p.vx < 0 ? 'left' : 'right';
    else if (Math.abs(p.vy) > Math.abs(p.vx) * 1.15) p.dir = p.vy < 0 ? 'up' : 'down';
    p.stepT -= dt * sp;
    if (p.stepT <= 0) { p.stepT = 0.9; p.step = true; }
  }
  p.blinkT -= dt;
  if (p.blinkT <= 0) { p.blink = 0.12; p.blinkT = 2.5 + Math.random() * 3; }
  if (p.blink > 0) p.blink -= dt;
  if (p.spawnT > 0) p.spawnT -= dt;
}

function netTarget(N, now) {
  const b = N.buf;
  if (!b.length) return null;
  const delay = 70 + clamp(N.jit * 1.3, 0, 280);
  const rt = now - delay;
  if (rt <= b[0].t) return { x: b[0].x, y: b[0].y, s: b[0] };
  for (let i = b.length - 1; i >= 1; i--) {
    const a = b[i - 1], c = b[i];
    if (rt >= a.t && rt <= c.t) {
      const f = c.t > a.t ? (rt - a.t) / (c.t - a.t) : 1;
      return { x: a.x + (c.x - a.x) * f, y: a.y + (c.y - a.y) * f, s: f < 0.5 ? a : c };
    }
  }
  const L = b[b.length - 1];
  const ex = clamp((rt - L.t) / 1000, 0, 0.18);
  return { x: L.x + L.vx * ex, y: L.y + L.vy * ex, s: L, stale: rt - L.t };
}
function follow(W, p, dt) {
  const N = p.nb;
  if (!N) return;
  const tg = netTarget(N, Date.now());
  if (!tg) return;
  const dx = tg.x - p.x, dy = tg.y - p.y, d = Math.hypot(dx, dy);
  if (N.snap || d > 3) { p.x = tg.x; p.y = tg.y; N.snap = false; }
  else {
    const maxStep = SPEED * 1.45 * dt;
    const step = Math.min(d, Math.max(maxStep * 0.35, d * (1 - Math.exp(-dt * 16))), maxStep);
    if (d > 1e-5) { p.x += dx / d * step; p.y += dy / d * step; }
  }
  const s = tg.s;
  p.vx = s.vx; p.vy = s.vy;
  const sp = Math.hypot(s.vx, s.vy);
  p.moving = !!s.m && p.dead <= 0 && !(tg.stale > 600);
  if (s.d) p.dir = s.d;
  p.ice = at(W, Math.floor(p.x), Math.floor(p.y)) === 'I';
  animate(p, dt, p.moving ? Math.max(sp, 1) : 0);
}
export function setNet(W, kind, m) {
  const p = W.p[kind];
  if (!p) return;
  const now = Date.now();
  const N = p.nb || (p.nb = { buf: [], off: null, jit: 60, tp: m.tp || 0, last: 0, snap: true });
  const sent = typeof m.at === 'number' ? m.at : now;
  const lag = now - sent;
  N.off = N.off == null ? lag : Math.min(N.off + 0.6, lag);
  const j = lag - N.off;
  N.jit = Math.max(j, N.jit * 0.97);
  const t = sent + N.off;
  if ((m.tp || 0) !== N.tp) { N.tp = m.tp || 0; N.buf.length = 0; N.snap = true; }
  if (N.buf.length && t <= N.buf[N.buf.length - 1].t) return;
  N.buf.push({ t, x: m.x, y: m.y, vx: m.vx || 0, vy: m.vy || 0, d: m.d, m: m.m });
  if (N.buf.length > 24) N.buf.shift();
  N.last = now;
  if (m.dd && p.dead <= 0 && !W.won) { p.dead = 1.15; p.die = m.why || 'fall'; }
  if (!m.dd && p.dead > 0 && p.dead < 0.4) { p.dead = 0; p.die = null; }
}
export function netAge(W, kind) { const p = W.p[kind]; return p && p.nb && p.nb.last ? Date.now() - p.nb.last : Infinity; }

export function stepWorld(W, dt, ctl) {
  W.t += dt;
  W.host = !!ctl.host;
  if (!W.won && !W.out && ctl.playing) W.time += dt;
  const kinds = ['sun', 'moon'];
  for (const kind of kinds) {
    const p = W.p[kind];
    if (ctl.local.has(kind)) {
      const inp = ctl.inputs[kind] || { x: 0, y: 0 };
      const stop = !ctl.playing || W.won || W.out;
      drive(W, p, stop ? 0 : inp.x * SPEED, stop ? 0 : inp.y * SPEED, dt);
    } else follow(W, p, dt);
  }
  for (const g of ['H', 'J']) W.gateAmt[g] = clamp(W.gateAmt[g] + (gateOpen(W, g) ? 1 : -1) * dt * 2.2, 0, 1);
  W.pressed = W.plates.some(([x, y]) => kinds.some((k) => alive(W.p[k]) && onTile(W.p[k], x, y, 0.1)));
  W.pdoor = clamp(W.pdoor + (W.pressed ? dt * 3.2 : -dt * 2.2), 0, 1);
  if (W.tplates.length) {
    const held = W.tplates.some(([x, y]) => kinds.some((k) => alive(W.p[k]) && onTile(W.p[k], x, y, 0.1)));
    if (held) W.tdoorUntil = Math.max(W.tdoorUntil, W.t + 0.35);
    W.qdoor = clamp(W.qdoor + (W.t < W.tdoorUntil ? dt * 3.4 : -dt * 2.4), 0, 1);
  }
  for (const kind of kinds) {
    const p = W.p[kind];
    const local = ctl.local.has(kind);
    if (p.dead > 0) {
      p.dead -= dt;
      if (p.dead <= 0) { if (local && !W.out) respawn(W, p); else if (!local) { p.dead = 0; p.die = null; } }
      continue;
    }
    if (!local || W.won || !ctl.playing) continue;
    const tx = Math.floor(p.x), ty = Math.floor(p.y);
    const fxp = p.x - tx, fyp = p.y - ty;
    const inside = fxp > 0.1 && fxp < 0.9 && fyp > 0.1 && fyp < 0.9;
    const ch = at(W, tx, ty);
    const why = inside ? deadly(W, kind, tx, ty) : null;
    if (why) { die(W, p, why); continue; }
    if (p.atkCd > 0) p.atkCd -= dt;
    if (p.atkT > 0) p.atkT -= dt;
    const inp2 = ctl.inputs[kind];
    if (inp2 && inp2.atk && p.atkCd <= 0) shoot(W, p, inp2.aim);
    if (p.spawnT <= 0 && W.foes.length) {
      const foe = W.foes.find((f) => f.dead <= 0 && f.frz <= 0 && Math.hypot(f.x - p.x, f.y - p.y) < p.r + f.r - 0.06);
      if (foe) { die(W, p, 'foe'); continue; }
    }
    if (ch === 'b' && inside) {
      if (litAt(W, tx, ty) < 0.5) { p.fallT += dt; if (p.fallT > 0.35) { die(W, p, 'fall'); continue; } } else p.fallT = 0;
    } else p.fallT = 0;
    if (ch === 'K' && inside) { const c = W.crumble[`${tx},${ty}`]; if (c && crumbleState(W, tx, ty).s === 0) emit(W, { k: 'crack', id: `${tx},${ty}`, n: c.n + 1, who: kind }); }
    if ((ch === 'O' && W.pdoor < 0.5 && inside) || (ch === 'Q' && W.qdoor < 0.5 && inside)) resolve(W, p);
    const onT = ch === 't' && onTile(p, tx, ty, 0.1);
    if (onT && !p.onT) emit(W, { k: 'tplate', who: kind });
    p.onT = onT;
    const lockKey = `${tx},${ty}`;
    if (p.tpLock && p.tpLock !== lockKey) p.tpLock = null;
    if (isPad(ch) && !p.tpLock && onTile(p, tx, ty, 0.24)) {
      const dst = padPair(W, tx, ty);
      if (dst) {
        const x0 = p.x, y0 = p.y;
        p.x = dst[0] + 0.5; p.y = dst[1] + 0.55; p.vx *= 0.25; p.vy *= 0.25; p.tp += 1; p.tpLock = `${dst[0]},${dst[1]}`;
        fx(W, 'tp', { who: kind, x0, y0, x1: p.x, y1: p.y });
      }
    }
    W.flags.forEach((fl, i) => {
      if (dist(p, fl.x + 0.5, fl.y + 0.55) < 0.7 && (p.cp.x !== fl.x + 0.5 || p.cp.y !== fl.y + 0.55)) {
        p.cp = { x: fl.x + 0.5, y: fl.y + 0.55 };
        emit(W, { k: 'flag', i, who: kind });
        fx(W, 'flag', { who: kind });
      }
    });
    W.gems.forEach((g, i) => { if (!g.taken && g.k === kind && dist(p, g.x + 0.5, g.y + 0.5) < 0.55) emit(W, { k: 'gem', i, who: kind }); });
    Object.keys(W.levers).forEach((id) => { const l = W.levers[id]; if (!l.on && dist(p, l.x + 0.5, l.y + 0.6) < 0.62) emit(W, { k: 'lever', id, who: kind }); });
    if (kind === 'sun' && !W.vines.done && W.vines.burn <= 0 && W.vines.tiles.some(([x, y]) => dist(p, x + 0.5, y + 0.5) < 0.85)) emit(W, { k: 'burn' });
    if (W.key && !W.key.held && !W.key.used && dist(p, W.key.x, W.key.y) < 0.55) {
      if (W.host) emit(W, { k: 'key', who: kind });
      else if (!W.keyAsked || W.t - W.keyAsked > 1.5) { W.keyAsked = W.t; W.outbox.push({ k: 'key', who: kind, req: 1 }); }
    }
    if (W.chest && !W.chest.done && W.key && W.key.held === kind && dist(p, W.chest.x + 0.5, W.chest.y + 0.75) < 0.8) emit(W, { k: 'chest', who: kind });
    if (W.braz) {
      const mine = kind === 'sun' ? 'F' : 'N';
      const z = W.braz[mine];
      if (!z.perm && z.lit <= 0 && dist(p, z.x + 0.5, z.y + 0.6) < 0.8) emit(W, { k: 'light', b: mine });
    }
  }
  if (W.codeSolved) W.codeAmt = Math.min(1, W.codeAmt + dt * 0.7);
  W.codeGlow += ((W.codeSolved ? 1 : 0) - W.codeGlow) * Math.min(1, dt * 3);
  if (W.vines.burn > 0 && !W.vines.done) { W.vines.burn += dt; if (W.vines.burn > 1.2) { W.vines.done = true; fx(W, 'vinesdone'); } }
  if (W.braz) {
    for (const k of ['F', 'N']) { const z = W.braz[k]; if (!z.perm && z.lit > 0) { z.lit -= dt; if (z.lit <= 0) { z.lit = 0; fx(W, 'fizz', { b: k }); } } }
    if (W.host && !W.great.open && W.braz.F.lit > 0 && W.braz.N.lit > 0) emit(W, { k: 'great' });
  }
  if (W.great.open) W.great.amt = Math.min(1, W.great.amt + dt * 0.55);
  if (W.chest && W.chest.done) W.chest.open = Math.min(1, W.chest.open + dt * 2);
  const m = W.p.moon;
  W.mural += ((W.muralAt && alive(m) && dist(m, W.muralAt.x + 0.5, W.muralAt.y + 1.3) < 2.3 ? 1 : 0) - W.mural) * Math.min(1, dt * 3);
  for (const fl of W.flags) if (fl.wave > 0) fl.wave = Math.max(0, fl.wave - dt);
  for (const g of W.gems) if (g.taken) g.pop = Math.min(1, g.pop + dt * 3);
  const ex = W.exits;
  const sunOk = alive(W.p.sun) && ex.sun && onTile(W.p.sun, ex.sun.x, ex.sun.y, 0.08);
  const moonOk = alive(W.p.moon) && ex.moon && onTile(W.p.moon, ex.moon.x, ex.moon.y, 0.08);
  W.doorOn = { sun: !!sunOk, moon: !!moonOk };
  if (sunOk && moonOk && !W.won && !W.out) { W.exitT += dt; if (W.exitT > 0.9 && W.host) emit(W, { k: 'win' }); } else W.exitT = 0;
  if (W.shake > 0) W.shake -= dt;
  for (const kind of kinds) { const p = W.p[kind]; if (!ctl.local.has(kind) && p.atkT > 0) p.atkT -= dt; }
  if (W.foes.length) {
    if (ctl.host) { if (ctl.playing && !W.won) stepFoes(W, dt); }
    else for (const f of W.foes) {
      if (f.dead > 0) { f.dead += dt; continue; }
      if (f.hit > 0) f.hit -= dt;
      if (f.frz > 0) f.frz = Math.max(0, f.frz - dt);
      if (f.tx == null) continue;
      const k = 1 - Math.exp(-dt * 10);
      const ddx = f.tx - f.x;
      if (Math.abs(ddx) > 0.01) f.face = ddx < 0 ? -1 : 1;
      f.walk = (f.walk || 0) + Math.hypot(f.tx - f.x, f.ty - f.y) * 6;
      f.x += (f.tx - f.x) * k; f.y += (f.ty - f.y) * k; f.hop += ((f.thop || 0) - (f.hop || 0)) * k; f.t += dt;
    }
  }
  if (W.shots.length) stepShots(W, dt, ctl);
  for (const k in W.mirrors) { const m = W.mirrors[k]; if (m.spin > 0) m.spin = Math.max(0, m.spin - dt); }
  if (W.beam) {
    computeBeam(W);
    if (W.beam.hit && !W.beam.open && ctl.host) emit(W, { k: 'beam' });
    W.beam.amt = clamp(W.beam.amt + (W.beam.open ? dt * 1.6 : -dt * 2), 0, 1);
  }
}

function shoot(W, p, aim) {
  let dx = aim && (aim.x || aim.y) ? aim.x : p.ax, dy = aim && (aim.x || aim.y) ? aim.y : p.ay;
  const l0 = Math.hypot(dx, dy) || 1; dx /= l0; dy /= l0;
  let best = null, bs = 0.8;
  for (const f of W.foes) { if (f.dead > 0) continue; const vx = f.x - p.x, vy = f.y - p.y, d = Math.hypot(vx, vy); if (d > 6.8 || d < 0.05) continue; const c = (vx * dx + vy * dy) / d + (f.frz > 0 && p.kind === 'sun' ? 0.05 : 0); if (c > bs) { bs = c; best = [vx / d, vy / d]; } }
  if (best) { dx = best[0]; dy = best[1]; }
  p.atkCd = ATK_CD; p.atkT = 0.22; p.shots += 1;
  if (Math.abs(dx) > Math.abs(dy) * 1.15) p.dir = dx < 0 ? 'left' : 'right'; else if (Math.abs(dy) > Math.abs(dx) * 1.15) p.dir = dy < 0 ? 'up' : 'down';
  emit(W, { k: 'shot', who: p.kind, id: `${p.kind}:${W.attempt}:${p.shots}`, x: +(p.x + dx * 0.3).toFixed(2), y: +(p.y + dy * 0.3).toFixed(2), dx: +dx.toFixed(3), dy: +dy.toFixed(3) });
}
function foeSolid(W, f, tx, ty) {
  if (box(W, tx, ty, 'foe')) return true;
  if (f.k === 'bat') return false;
  return 'LWPCSsKb1234'.includes(at(W, tx, ty));
}
function foeMove(W, f, vx, vy, dt) {
  const nx = f.x + vx * dt, ny = f.y + vy * dt;
  let blocked = false;
  if (vx) { const cx = Math.floor(nx + Math.sign(vx) * 0.32); if (foeSolid(W, f, cx, Math.floor(f.y))) blocked = true; else f.x = nx; }
  if (vy) { const cy = Math.floor(ny + Math.sign(vy) * 0.32); if (foeSolid(W, f, Math.floor(f.x), cy)) blocked = true; else f.y = ny; }
  resolve(W, f);
  f.mvx = vx; f.mvy = vy;
  if (Math.abs(vx) > 0.05) f.face = vx < 0 ? -1 : 1;
  return blocked;
}
function stepFoes(W, dt) {
  const ps = ['sun', 'moon'].map((k) => W.p[k]).filter((p) => alive(p) && p.spawnT <= 0);
  for (const f of W.foes) {
    if (f.dead > 0) { f.dead += dt; continue; }
    if (f.hit > 0) f.hit -= dt;
    if (f.frz > 0) { f.frz -= dt; if (f.frz <= 0) { f.frz = 0; fx(W, 'thaw', { x: f.x, y: f.y }); } continue; }
    f.t += dt;
    let near = null, nd = 1e9;
    for (const p of ps) { const d = Math.hypot(p.x - f.x, p.y - f.y); if (d < nd) { nd = d; near = p; } }
    const S = FOES[f.k];
    if (f.k === 'bat') {
      f.cool -= dt;
      if (f.mode === 1) {
        f.mt -= dt;
        const dx = f.ax - f.x, dy = f.ay - f.y, d = Math.hypot(dx, dy) || 1;
        const bl = foeMove(W, f, dx / d * 2.5, dy / d * 2.5, dt);
        if (f.mt <= 0 || d < 0.15 || bl) { f.mode = 2; f.cool = 2.4; }
      } else {
        const gx = f.mode === 2 ? f.hx : f.hx + Math.sin(f.t * 1.25) * 1.1, gy = f.hy + Math.sin(f.t * 2.2) * 0.45;
        const dx = gx - f.x, dy = gy - f.y, d = Math.hypot(dx, dy);
        const sp = f.mode === 2 ? 1.7 : 1.3;
        if (d > 0.02) foeMove(W, f, dx / Math.max(d, 0.4) * sp, dy / Math.max(d, 0.4) * sp, dt);
        if (f.mode === 2 && d < 0.35) f.mode = 0;
        if (f.mode === 0 && near && nd < 3.4 && f.cool <= 0) { f.mode = 1; f.mt = 1.25; f.ax = near.x + (near.x - f.x) * 0.25; f.ay = near.y + (near.y - f.y) * 0.25; fx(W, 'swoop', { x: f.x, y: f.y }); }
      }
    } else if (f.k === 'slime') {
      f.mt -= dt;
      if (f.mt <= 0) {
        f.mt = 1.1;
        let dx, dy;
        if (near && nd < 4.6) { dx = near.x - f.x; dy = near.y - f.y; } else { const a = Math.random() * TAU; dx = Math.cos(a); dy = Math.sin(a); }
        const d = Math.hypot(dx, dy) || 1;
        f.vx = dx / d; f.vy = dy / d;
        if (near && nd < 6) fx(W, 'hop', { x: f.x, y: f.y });
      }
      const ph = 1.1 - f.mt;
      if (ph < 0.5) { f.hop = Math.sin(ph / 0.5 * Math.PI); if (foeMove(W, f, f.vx * S.sp * 1.9, f.vy * S.sp * 1.9, dt)) { f.vx = -f.vx; f.vy = -f.vy; } }
      else f.hop = 0;
    } else {
      let vx, vy;
      if (near && nd < 3.6) { const dx = near.x - f.x, dy = near.y - f.y, d = Math.hypot(dx, dy) || 1; vx = dx / d * S.sp; vy = dy / d * S.sp; if (f.mode !== 1) fx(W, 'rattle', { x: f.x, y: f.y }); f.mode = 1; }
      else { vx = f.dir * S.sp * 0.7; vy = clamp((f.hy - f.y) * 1.5, -0.8, 0.8); f.mode = 0; }
      if (foeMove(W, f, vx, vy, dt) && f.mode === 0) f.dir = -f.dir;
      if (f.mode === 0 && Math.abs(f.x - f.hx) > 3.5) f.dir = f.x > f.hx ? -1 : 1;
      f.walk = (f.walk || 0) + dt * Math.hypot(vx, vy) * 3;
    }
  }
}
function hitFoe(W, f, q) {
  let hp = f.hp, frz = f.frz, dead = 0;
  const shatter = frz > 0;
  if (shatter) { dead = 1; hp = 0; } else if (q.k === 'fire') { hp -= 1; if (hp <= 0) dead = 1; } else frz = FREEZE_T;
  if (!dead && q.k === 'fire') { f.x += q.dx * 0.25; f.y += q.dy * 0.25; resolve(W, f); }
  emit(W, { k: 'foe', id: f.id, hp, frz, dead, hit: q.k, by: q.who, shatter });
}
function stepShots(W, dt, ctl) {
  for (const q of W.shots) {
    q.life -= dt; q.age += dt;
    for (let i = 0; i < 3 && q.life > 0; i++) {
      q.x += q.dx * SHOT_SP * dt / 3; q.y += q.dy * SHOT_SP * dt / 3;
      const tx = Math.floor(q.x), ty = Math.floor(q.y);
      const ch = at(W, tx, ty);
      if (q.k === 'fire' && ch === 'V' && !W.vines.done && W.vines.burn <= 0) { if (ctl.local.has(q.who)) emit(W, { k: 'burn' }); q.life = 0; break; }
      if (box(W, tx, ty, 'shot') && !(ch === 'Z' && q.k === 'fire') && !(ch === 'z' && q.k === 'ice')) { q.life = 0; q.wall = true; break; }
      for (const f of W.foes) {
        if (f.dead > 0 || Math.hypot(f.x - q.x, f.y - q.y) > f.r + 0.24) continue;
        q.life = 0;
        if (ctl.host) hitFoe(W, f, q);
        break;
      }
    }
    if (q.life <= 0) fx(W, 'shotend', { x: q.x, y: q.y, sk: q.k, wall: !!q.wall });
  }
  W.shots = W.shots.filter((q) => q.life > 0);
}
function computeBeam(W) {
  const B = W.beam;
  let x = B.src.x, y = B.src.y, dx = B.dir[0], dy = B.dir[1];
  const path = [[x + 0.5 + dx * 0.45, y + 0.5 + dy * 0.45]];
  let hit = false;
  for (let i = 0; i < 90; i++) {
    x += dx; y += dy;
    if (x === B.dst.x && y === B.dst.y) { hit = true; path.push([x + 0.5 - dx * 0.4, y + 0.5 - dy * 0.4]); break; }
    const m = W.mirrors[`${x},${y}`];
    if (m) { path.push([x + 0.5, y + 0.5]); if (m.o === 0) { const t = dx; dx = -dy; dy = -t; } else { const t = dx; dx = dy; dy = t; } continue; }
    if (box(W, x, y, 'beam')) { path.push([x + 0.5 - dx * 0.5, y + 0.5 - dy * 0.5]); break; }
  }
  B.path = path; B.hit = hit;
}
export function nearMirror(W, p) {
  if (!W.mirrors || !alive(p)) return null;
  let best = null, bd = 1.1;
  for (const k in W.mirrors) { const m = W.mirrors[k]; const d = dist(p, m.x + 0.5, m.y + 0.62); if (d < bd) { bd = d; best = k; } }
  return best;
}
export function turnMirror(W, p) {
  const k = nearMirror(W, p);
  if (!k) return false;
  const m = W.mirrors[k];
  if (m.spin > 0) return false;
  m.at = W.t;
  emit(W, { k: 'mir', id: k, o: 1 - m.o, who: p.kind });
  return true;
}

export function nearDial(W, p) { return !!(W.dialAt && !W.codeSolved && alive(p) && dist(p, W.dialAt.x + 0.5, W.dialAt.y + 1.45) < 1.05); }
export function tryCode(W, picks) {
  if (W.codeSolved) return true;
  if (picks.length === 3 && picks.every((g, i) => g === W.code[i])) { emit(W, { k: 'code' }); return true; }
  return false;
}

export function hintFor(W, p) {
  if (!alive(p)) return null;
  if (W.foes && W.foes.some((f) => f.dead <= 0 && Math.hypot(f.x - p.x, f.y - p.y) < 4.5)) return ['foe', p.kind === 'sun' ? 'Tap the fire button to throw fireballs. Frozen enemies break with one hit.' : 'Tap the frost button to freeze an enemy. Hit it again to break it.'];
  if (nearMirror(W, p) && !(W.beam && W.beam.open)) return ['mirror', 'Tap the hand button next to a mirror to turn it. Point the light at the crystal.'];
  if (!p.moving) return null;
  const ax = p.x + (p.dir === 'left' ? -0.6 : p.dir === 'right' ? 0.6 : 0), ay = p.y + (p.dir === 'up' ? -0.6 : p.dir === 'down' ? 0.6 : 0);
  const tx = Math.floor(ax), ty = Math.floor(ay);
  const ch = at(W, tx, ty);
  if (ch === 'W' && p.kind === 'sun') return ['water', 'Water puts out the orange fire. Only the blue torch can wade in.'];
  if (ch === 'L' && p.kind === 'moon') return ['lava', 'Lava burns the blue torch. Only the orange torch can cross.'];
  if (ch === 'P') return ['goo', 'Green goo hurts you both. Walk around it.'];
  if (ch === 'C') return ['chasm', 'That is a long drop. Find another way.'];
  if (ch === 'b' && p.kind === 'sun' && litAt(W, tx, ty) < 0.6) return ['bridge', 'These stones only appear in blue light. Walk close to the blue torch.'];
  if ((ch === 'H' && W.gateAmt.H < 0.3) || (ch === 'J' && W.gateAmt.J < 0.3)) return ['gate', 'This gate needs every lever of its colour pulled.'];
  if (ch === 'O' && W.pdoor < 0.3) return ['plate', 'Someone has to stand on a round plate to hold this door open.'];
  if (ch === 'Q' && W.qdoor < 0.3) return ['timed', 'Press a clock button and this door opens for a few seconds.'];
  if (ch === 'D' && W.codeAmt < 0.3) return ['code', 'A code door. The code is painted where only blue light shows it.'];
  if (ch === 'E' && W.great.amt < 0.3) return ['great', 'Light both fires at the same time to open this door.'];
  if (ch === 'G' && W.beam && W.beam.amt < 0.3) return ['beamdoor', 'This crystal door opens when the light beam reaches the crystal. Turn the mirrors.'];
  if (ch === 'V' && !W.vines.done) return ['vines', p.kind === 'sun' ? 'Walk into the vines to burn them.' : 'Thick vines. The orange torch can burn them.'];
  if (ch === 'Z' && p.kind === 'moon') return ['fire', 'A wall of fire. Only the orange torch can walk through it.'];
  if (ch === 'z' && p.kind === 'sun') return ['falls', 'A curtain of water. Only the blue torch can walk through it.'];
  if (ch === 'S' || ch === 's') return ['spike', 'Spikes come up and go down. Cross when they drop.'];
  if (ch === 'K') return ['crumble', 'Cracked floor falls away a moment after you step on it. Keep moving.'];
  if (isPad(ch)) return ['pad', 'Step on the glowing ring to jump to its twin.'];
  if (ch === 'I') return ['ice', 'Ice is slippery. Let go early to stop in time.'];
  if (ch === 't') return ['tplate', 'This button opens the timed door for a few seconds.'];
  return null;
}

export function checkDef(L) { return checkWorld(worldFrom(L, 0, 'check', 0, null)); }
export function checkLevel(li, rs) { return checkWorld(makeWorld(li, 'check', 0, rs)); }
function checkWorld(W) {
  const flags = { H: false, J: false, O: false, Q: false, D: false, E: false, V: false, G: false, key: false, chest: false };
  const lit = new Set();
  const map = W.map;
  const reach = (kind) => {
    const st = kind === 'sun' ? findAll(map, 'A')[0] : findAll(map, 'B')[0];
    const seen = new Set([`${st[0]},${st[1]}`]);
    const q = [st];
    const touch = new Set();
    const opts = { ...flags, b: (bx, by) => lit.has(`${bx},${by}`) };
    while (q.length) {
      const [x, y] = q.shift();
      const nb = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
      const pp = padPair(W, x, y);
      if (pp) nb.push(pp);
      for (const [nx, ny] of nb) {
        const key = `${nx},${ny}`;
        if (seen.has(key)) continue;
        const ch = at(W, nx, ny);
        if ('hjFNTqVmn'.includes(ch) || ch === 'M') touch.add(`${ch}:${key}`);
        if (!passFor(W, kind, nx, ny, opts)) continue;
        seen.add(key); q.push([nx, ny]);
      }
    }
    return { seen, touch };
  };
  let rs, rm;
  for (let iter = 0; iter < 40; iter++) {
    rs = reach('sun'); rm = reach('moon');
    let changed = false;
    rm.seen.forEach((k) => { const [x, y] = k.split(',').map(Number); for (let yy = y - 2; yy <= y + 2; yy++) for (let xx = x - 2; xx <= x + 2; xx++) { if (Math.hypot(xx - x, yy - y + 0.3) <= LIGHT_R - 0.4 && at(W, xx, yy) === 'b' && !lit.has(`${xx},${yy}`)) { lit.add(`${xx},${yy}`); changed = true; } } });
    const both = new Set([...rs.touch, ...rm.touch]);
    const leverAll = (g) => Object.values(W.levers).filter((l) => l.g === g).every((l) => both.has(`${g.toLowerCase()}:${l.x},${l.y}`));
    if (!flags.H && Object.values(W.levers).some((l) => l.g === 'H') && leverAll('H')) { flags.H = true; changed = true; }
    if (!flags.J && Object.values(W.levers).some((l) => l.g === 'J') && leverAll('J')) { flags.J = true; changed = true; }
    if (!flags.O && W.plates.length) {
      const sp = W.plates.filter(([x, y]) => rs.seen.has(`${x},${y}`)).length, mp = W.plates.filter(([x, y]) => rm.seen.has(`${x},${y}`)).length;
      if (sp + mp >= 1) { flags.O = true; changed = true; }
    }
    if (!flags.Q && W.tplates.length) {
      const sp = W.tplates.filter(([x, y]) => rs.seen.has(`${x},${y}`)).length, mp = W.tplates.filter(([x, y]) => rm.seen.has(`${x},${y}`)).length;
      if (sp + mp >= 1) { flags.Q = true; changed = true; }
    }
    if (!flags.D && W.dialAt && W.muralAt && [...rm.seen].some((k) => { const [x, y] = k.split(',').map(Number); return Math.hypot(x + 0.5 - (W.muralAt.x + 0.5), y + 0.5 - (W.muralAt.y + 1.3)) < 2.3; }) && (rs.seen.has(`${W.dialAt.x},${W.dialAt.y + 1}`) || rm.seen.has(`${W.dialAt.x},${W.dialAt.y + 1}`))) { flags.D = true; changed = true; }
    if (!flags.V && W.vines.tiles.length && [...rs.touch].some((t) => t.startsWith('V:'))) { flags.V = true; changed = true; }
    if (!flags.E && W.braz && rs.touch.has(`F:${W.braz.F.x},${W.braz.F.y}`) && rm.touch.has(`N:${W.braz.N.x},${W.braz.N.y}`)) { flags.E = true; changed = true; }
    if (!flags.G && W.beam && Object.keys(W.mirrors).length && Object.values(W.mirrors).every((m) => both.has(`m:${m.x},${m.y}`) || both.has(`n:${m.x},${m.y}`))) { flags.G = true; changed = true; }
    if (!changed) break;
  }
  const problems = [];
  if (!W.exits.sun || !rs.seen.has(`${W.exits.sun.x},${W.exits.sun.y}`)) problems.push('sun cannot reach its door');
  if (!W.exits.moon || !rm.seen.has(`${W.exits.moon.x},${W.exits.moon.y}`)) problems.push('moon cannot reach its door');
  W.gems.forEach((g) => { if (!(g.k === 'sun' ? rs : rm).seen.has(`${g.x},${g.y}`)) problems.push(`${g.k} gem at ${g.x},${g.y} unreachable`); });
  if (W.key && !rs.seen.has(`${Math.floor(W.key.x)},${Math.floor(W.key.y)}`) && !rm.seen.has(`${Math.floor(W.key.x)},${Math.floor(W.key.y)}`)) problems.push('key unreachable');
  if (W.chest) { const near = [[0, 1], [1, 0], [-1, 0], [0, -1]].some(([dx, dy]) => rs.seen.has(`${W.chest.x + dx},${W.chest.y + dy}`) || rm.seen.has(`${W.chest.x + dx},${W.chest.y + dy}`)); if (!near) problems.push('chest unreachable'); }
  return { ok: problems.length === 0, problems, flags };
}

export function missionsFor(W) {
  const out = [
    { k: 'out', t: 'Escape together' },
    { k: 'gems', t: `Find all ${W.gems.length} gems` },
    { k: 'hearts', t: 'Keep all three hearts' },
  ];
  if (W.chest) out.push({ k: 'chest', t: 'Open the secret chest' });
  out.push({ k: 'time', t: `Escape in under ${fmtPar(parTime(W))}` });
  return out;
}
const PAR_ADJ = { bridge: -2.31, code: 0, crumble: -3.41, fires: -2.91, gate: -3.27, hall: -5.76, ice: -7.19, plate: 0.26, portal: -6.71, spikes: -5.22, split: -4.82, timed: 1.3, foes: 2.5, beam: 4 };
export function parTime(W) {
  const L = W.L || {};
  let est = 30;
  if (L.par) est = L.par;
  else if (L.rooms) est = Math.max(8, 1.52 * W.MH + (W.chest ? 6.77 : 0) + L.rooms.reduce((a, k) => a + (PAR_ADJ[k] || 0), 0) - 10.23);
  return Math.ceil((est * 2.4 + 20) / 5) * 5;
}
export const fmtPar = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export function buddyInput(W, me, lead, mem, dt) {
  const zero = { x: 0, y: 0 };
  if (!me || !lead || !alive(me) || W.won || W.out) return zero;
  if (W.foes && W.foes.length) {
    const los = (bx, by) => { const n = Math.ceil(Math.hypot(bx - me.x, by - me.y) / 0.3); for (let i = 1; i < n; i++) { const x = me.x + (bx - me.x) * i / n, y = me.y + (by - me.y) * i / n; if (box(W, Math.floor(x), Math.floor(y), 'shot')) return false; } return true; };
    mem.ign = mem.ign || {};
    let tgt = null, td = 3.4;
    for (const f of W.foes) { if (f.dead > 0 || (mem.ign[f.id] || 0) > W.t) continue; const d = Math.hypot(f.x - me.x, f.y - me.y); if (d < td && los(f.x, f.y)) { td = d; tgt = f; } }
    if (tgt) {
      const dx = tgt.x - me.x, dy = tgt.y - me.y, d = Math.hypot(dx, dy) || 1;
      if (mem.eid !== tgt.id) { mem.eid = tgt.id; mem.eng = 0; }
      mem.eng += dt;
      if (mem.eng > 5) { mem.ign[tgt.id] = W.t + 3; mem.eid = null; }
      mem.atkT = (mem.atkT || 0) - dt;
      let atk = false;
      if (mem.atkT <= 0) { mem.atkT = 0.6; atk = true; }
      if (tgt.frz <= 0 && d < 1.5) return { x: -dx / d * 0.92, y: -dy / d * 0.92, atk, aim: { x: dx / d, y: dy / d } };
      return { x: 0, y: 0, atk, aim: { x: dx / d, y: dy / d } };
    }
  }
  const tx = Math.floor(me.x), ty = Math.floor(me.y);
  const lx = Math.floor(lead.x), ly = Math.floor(lead.y);
  const tr = mem.trail || (mem.trail = []);
  const last = tr[tr.length - 1];
  if (alive(lead) && (!last || last.x !== lx || last.y !== ly)) { tr.push({ x: lx, y: ly }); if (tr.length > 60) tr.shift(); }
  const ex = W.exits[lead.kind], mine = W.exits[me.kind];
  const leadHome = ex && Math.hypot(lead.x - (ex.x + 0.5), lead.y - (ex.y + 0.5)) < 1.3;
  let goal = null;
  if (leadHome && mine) goal = { x: mine.x, y: mine.y, home: true };
  else if (alive(lead)) {
    if (Math.hypot(me.x - lead.x, me.y - lead.y) < 1.6) { mem.path = null; return zero; }
    goal = { x: lx, y: ly };
  }
  if (!goal) return zero;
  mem.t = (mem.t || 0) - dt;
  const key = `${goal.x},${goal.y}`;
  if (!mem.path || mem.key !== key || mem.t <= 0) {
    mem.t = 0.35;
    mem.key = key;
    let path = bfs(W, tx, ty, goal.x, goal.y, me.kind);
    if (!path && !goal.home) {
      for (let i = tr.length - 1; i >= Math.max(0, tr.length - 30) && !path; i--) {
        const c = tr[i];
        if (c.x === tx && c.y === ty) break;
        path = bfs(W, tx, ty, c.x, c.y, me.kind);
      }
    }
    mem.path = path;
    mem.i = 1;
  }
  const path = mem.path;
  if (!path || path.length < 2) return zero;
  while (mem.i < path.length - 1 && path[mem.i].x === tx && path[mem.i].y === ty) mem.i++;
  const nx = path[Math.min(mem.i, path.length - 1)];
  if (!nx) return zero;
  const ch = at(W, nx.x, nx.y);
  if ((ch === 'S' || ch === 's') && (spikeAmt(W, spikeOff(ch)) > 0.05 || spikeWarn(W, spikeOff(ch)) > 0)) return zero;
  if (deadly(W, me.kind, nx.x, nx.y)) return zero;
  const gx = nx.x + 0.5, gy = nx.y + 0.5;
  const dx = gx - me.x, dy = gy - me.y, d = Math.hypot(dx, dy);
  if (d < 0.08) return zero;
  const end = mem.i >= path.length - 1;
  const k = end ? Math.min(1, d * 1.6) : 1;
  return { x: dx / d * k * 0.92, y: dy / d * k * 0.92 };
}
