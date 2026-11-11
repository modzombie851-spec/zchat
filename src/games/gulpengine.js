export const WW = 640;
export const WH = 330;
export const LIVES = 3;
export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const PK_KINDS = ['shield', 'double', 'magnet', 'speed', 'life'];
export const PK_TIME = { shield: 6, double: 8, magnet: 7, speed: 6, life: 0 };

export const STAGES = [
  { n: 0, name: 'Guppy', sp: 'guppy' },
  { n: 50, name: 'Clownfish', sp: 'clown' },
  { n: 500, name: 'Snapper', sp: 'snapper' },
  { n: 5000, name: 'Barracuda', sp: 'barra' },
  { n: 50000, name: 'Shark', sp: 'shark' },
  { n: 500000, name: 'Whale', sp: 'whale' },
];
export const SKILLS = {
  dash: { cd: 2.4, stage: 0, name: 'Dash' },
  suck: { cd: 9, stage: 0, name: 'Suck' },
  shield: { cd: 18, stage: 1, dur: 3.2, name: 'Bubble shield' },
  shock: { cd: 16, stage: 2, dur: 2.6, name: 'Shock wave' },
  frenzy: { cd: 30, stage: 3, dur: 6, name: 'Frenzy' },
};
export const SKILL_KEYS = ['dash', 'suck', 'shield', 'shock', 'frenzy'];

export const SPECIES = [
  { id: 'minnow', shape: 'slim', school: true, zones: [0, 1, 2], pal: [['#C9D8E6', '#7F97B2', '#E9F1F8', '#3B4E68']] },
  { id: 'guppy', shape: 'round', zones: [0, 1], pal: [['#FFD23F', '#E8A800', '#FFB000', null], ['#FF6FAE', '#D94B8A', '#FF9CC8', null], ['#4FD27A', '#2FA857', '#9BEA8A', null], ['#A07BFF', '#7650E0', '#C8B2FF', null]] },
  { id: 'clown', shape: 'oval', zones: [0], stripes: 2, pal: [['#FF7A2A', '#D9541A', '#FF9A50', '#FFFFFF']] },
  { id: 'tang', shape: 'oval', zones: [0, 1], pal: [['#2E6BFF', '#1E46B8', '#FFD23F', '#13245E']] },
  { id: 'angel', shape: 'disc', zones: [0, 1], stripes: 3, pal: [['#FFE066', '#E8B800', '#FFF2A8', '#2A2A3A'], ['#9BE7FF', '#4DB6E0', '#E0F7FF', '#1F4E79']] },
  { id: 'puffer', shape: 'puff', zones: [0, 1], pal: [['#E8C26A', '#B8913A', '#F4DE9C', '#6B5020']] },
  { id: 'snapper', shape: 'oval', zones: [1, 2], pal: [['#FF6B6B', '#C94141', '#FFB3A8', null], ['#F49B5E', '#C46A2E', '#FFD0A8', null]] },
  { id: 'tuna', shape: 'long', zones: [1, 2], pal: [['#7E9CC2', '#3E5878', '#E4EEF8', '#FFD23F']] },
  { id: 'lantern', shape: 'slim', school: true, zones: [2, 3], glow: '#7DF9FF', pal: [['#3A4A6A', '#1E2A44', '#5A6E94', null]] },
  { id: 'squid', shape: 'squid', zones: [1, 2, 3], pal: [['#F49BB8', '#C2577E', '#FFD0E0', null]] },
  { id: 'jelly', shape: 'jelly', zones: [2, 3], glow: '#C9A6FF', pal: [['#D7B8FF', '#9A6FE0', '#F2E6FF', null]] },
  { id: 'barra', shape: 'long', hunter: true, teeth: true, zones: [0, 1, 2], pal: [['#9FB4C8', '#5D7189', '#E2EAF2', '#2C3A4C']] },
  { id: 'shark', shape: 'shark', hunter: true, teeth: true, zones: [1, 2, 3], pal: [['#7D8FA3', '#4F6075', '#E6EDF3', null]] },
  { id: 'angler', shape: 'angler', hunter: true, teeth: true, zones: [3], glow: '#FFF3A0', pal: [['#4A3A5C', '#2A1F38', '#6A587E', null]] },
  { id: 'orca', shape: 'orca', hunter: true, teeth: true, zones: [1, 2, 3], pal: [['#1E2230', '#0E1018', '#F2F4F8', null]] },
  { id: 'whale', shape: 'whale', zones: [2, 3], pal: [['#5A7393', '#36485F', '#B9C7D6', null]] },
];
export const SP_INDEX = Object.fromEntries(SPECIES.map((s, i) => [s.id, i]));
const PREY_IDS = ['minnow', 'guppy', 'clown', 'tang', 'angel', 'puffer', 'snapper', 'tuna', 'lantern', 'squid', 'jelly', 'whale'];
const HUNTER_IDS = ['barra', 'shark', 'angler', 'orca'];
export const PLAYER_SP = ['guppy', 'clown', 'snapper', 'barra', 'shark', 'whale'];

export function rOf(n) {
  const v = Math.max(1, n);
  if (v <= 10000) return 0.17 * Math.pow(v, 0.45);
  return 0.17 * Math.pow(10000, 0.45) * Math.pow(v / 10000, 0.2);
}
export function viewOf(n) { const r = rOf(n); return Math.min(230, r <= 6 ? 3.4 + 10 * r : 63.4 + 6.5 * (r - 6)); }
export function speedOf(n) { return viewOf(n) * (0.6 - 0.045 * Math.log10(Math.max(1, n))); }
export function stageOf(n) { let s = 0; for (let i = 0; i < STAGES.length; i++) if (n >= STAGES[i].n) s = i; return s; }

export function rngOf(seed) {
  let a = 0;
  const s = String(seed);
  for (let i = 0; i < s.length; i++) a = (Math.imul(a ^ s.charCodeAt(i), 2654435761) + i) | 0;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const angLerp = (a, b, k) => { const d = ((b - a + Math.PI) % TAU + TAU) % TAU - Math.PI; return a + d * k; };
const angDiff = (a, b) => ((b - a + Math.PI) % TAU + TAU) % TAU - Math.PI;

function vn(x) { const i = Math.floor(x), f = x - i; const h = (k) => { const s = Math.sin(k * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }; const u = f * f * (3 - 2 * f); return h(i) * (1 - u) + h(i + 1) * u; }
export function floorAt(x) {
  const n = (vn(x * 0.045) - 0.5) * 9 + (vn(x * 0.17 + 9) - 0.5) * 3;
  let base;
  if (x < 150) base = 80;
  else if (x < 235) { const k = (x - 150) / 85; base = 80 + (270 - 80) * (k * k * (3 - 2 * k)); }
  else if (x < 520) base = 270;
  else { const k = Math.min(1, (x - 520) / 60); base = 270 + 42 * (k * k * (3 - 2 * k)); }
  return Math.min(WH - 2, base + n);
}
export function zoneAt(x, y) {
  if (y < 76 && x < 190) return 0;
  if (y < 110) return 1;
  if (y < 255) return 2;
  return 3;
}

export function mkPl(kind, name, x, y) {
  return {
    kind, name: name || '', x, y, vx: 0, vy: 0, a: 0, n: 2, best: 2, lives: LIVES, dead: 0, prot: 2.5, eat: 0, hurt: 0,
    cd: { dash: 0, suck: 0, shield: 0, shock: 0, frenzy: 0 }, fx: { shield: 0, double: 0, magnet: 0, speed: 0, frenzy: 0, suck: 0 },
    sto: 0, dashT: 0, combo: 0, comboT: 0, eaten: 0, stage: 0, tp: 0, nb: null, bot: false, out: false, by: null, wob: 0,
  };
}

export function makeGame(seed, opts) {
  const o = opts || {};
  const R = rngOf(seed);
  const G = {
    seed: String(seed), rng: R, t: 0, fish: [], pk: [], nextId: 1, seq: 0, events: [], log: [], over: null, acks: [],
    pl: {}, order: [], spawnT: 0, pkT: 6, deco: null, solo: !!o.solo, botMem: {}, demo: !!o.demo, coop: !!o.coop,
    cfg: { hunt: 1, pk: 1, ...(o.cfg || {}) },
  };
  const spots = [[30, 34], [52, 40], [70, 30], [40, 52], [86, 46]];
  (o.players || [{ kind: 'sun' }]).forEach((pp, i) => {
    const s = spots[i % spots.length];
    const p = mkPl(pp.kind, pp.name, s[0] + R() * 6, s[1] + R() * 6);
    p.bot = !!pp.bot;
    p.color = pp.color || null;
    p.a = R() < 0.5 ? 0 : Math.PI;
    G.pl[pp.kind] = p;
    G.order.push(pp.kind);
  });
  if (G.demo) { const p = mkPl('demo', '', 62, 60); p.out = true; p.n = 12; G.pl.demo = p; G.order.push('demo'); }
  for (const p of anchorPlayers(G)) for (let i = 0; i < 26; i++) spawnFish(G, true, p);
  return G;
}

export function livePlayers(G) { return G.order.map((k) => G.pl[k]).filter((p) => p && !p.out); }

export function addPlayer(G, kind, name, color, near) {
  if (G.pl[kind]) { G.pl[kind].name = name || G.pl[kind].name; if (color) G.pl[kind].color = color; return G.pl[kind]; }
  const R = G.rng;
  const others = G.order.map((k) => G.pl[k]).filter((q) => q && !q.out && !q.bot && q.kind !== 'demo');
  let ref = near && G.pl[near] && !G.pl[near].out ? G.pl[near] : null;
  if (!ref && others.length) ref = others.reduce((a, b) => (b.n < a.n ? b : a));
  const p = mkPl(kind, name, 40 + R() * 30, 34 + R() * 12);
  p.color = color || null;
  if (ref) {
    p.n = Math.max(2, Math.floor(ref.n * 0.3));
    p.best = p.n;
    p.stage = stageOf(p.n);
    const V = viewOf(ref.n);
    p.x = clamp(ref.x + (R() - 0.5) * V * 0.8, 4, WW - 4);
    p.y = clamp(ref.y + (R() - 0.5) * V * 0.5, 4, floorAt(p.x) - 4);
  }
  p.prot = 3.5;
  p.a = R() < 0.5 ? 0 : Math.PI;
  G.pl[kind] = p;
  if (!G.order.includes(kind)) G.order.push(kind);
  ev(G, { k: 'spawn', who: kind });
  return p;
}
export function dropPlayer(G, kind) {
  if (!G.pl[kind]) return;
  delete G.pl[kind];
  G.order = G.order.filter((k) => k !== kind);
  delete G.botMem[kind];
  for (const f of G.fish) if (f.ch === kind) { f.ch = null; f.chase = 0; f.warn = 0; }
}
const SHAPE_V = (S) => (S.shape === 'long' || S.shape === 'shark' ? 1.25 : S.shape === 'jelly' ? 0.35 : S.shape === 'whale' ? 0.7 : 1);
export function adoptHost(G, seed) {
  G.rng = rngOf(`${seed}:${Date.now()}`);
  const R = G.rng;
  let top = G.nextId || 1;
  for (const f of G.fish) {
    if (f.id >= top) top = f.id + 1;
    const S = SPECIES[f.sp] || SPECIES[0];
    if (f.v == null) f.v = SHAPE_V(S) * (0.55 + R() * 0.35);
    f.tt = 0.5 + R(); f.va = 0; f.cool = 1 + R() * 2; f.ch = null; f.warn = 0; f.chase = 0; f.stun = 0;
    if (f.born == null) f.born = G.t - 1;
    f.tx = null; f.ty = null; f.vx = 0; f.vy = 0;
  }
  G.nextId = top + 50000;
  G.acks = []; G.events = []; G.log = [];
  G.seq = (G.seq || 0) + 100000;
  G.spawnT = 0; G.pkT = 4;
  for (const k of G.order) { const p = G.pl[k]; if (p && p.hostN != null) { p.n = Math.max(p.n, p.hostN); p.hostN = null; } }
  G.over = null;
}

function ev(G, e) { G.seq += 1; const x = { ...e, s: G.seq }; G.events.push(x); G.log.push(x); if (G.log.length > 40) G.log.shift(); }

function anchorPlayers(G) {
  const ps = G.order.map((k) => G.pl[k]).filter((p) => p && !p.bot && (!p.out || p.kind === 'demo'));
  if (ps.length) return ps;
  return G.order.map((k) => G.pl[k]).filter((p) => p && !p.out);
}
function nearestPlayer(G, x, y) {
  let best = null, bd = Infinity;
  for (const p of anchorPlayers(G)) { const d = Math.hypot(p.x - x, p.y - y) / viewOf(p.n); if (d < bd) { bd = d; best = p; } }
  return best;
}

function pickSpecies(G, zone, want) {
  const R = G.rng;
  const ids = (want === 'hunter' ? HUNTER_IDS : PREY_IDS).filter((id) => SPECIES[SP_INDEX[id]].zones.includes(zone) && (want !== 'school' || SPECIES[SP_INDEX[id]].school) && (want === 'school' || !SPECIES[SP_INDEX[id]].school));
  const pool = ids.length ? ids : (want === 'hunter' ? ['barra'] : ['guppy']);
  return SP_INDEX[pool[Math.floor(R() * pool.length)]];
}

function addFish(G, sp, n, x, y, a, extra) {
  const S = SPECIES[sp];
  const R = G.rng;
  const f = {
    id: G.nextId++, sp, pv: Math.floor(R() * S.pal.length), n: Math.max(1, Math.round(n)), x, y, a, va: 0,
    v: (S.shape === 'long' || S.shape === 'shark' ? 1.25 : S.shape === 'jelly' ? 0.35 : S.shape === 'whale' ? 0.7 : 1) * (0.55 + R() * 0.35),
    tt: 1 + R() * 3, chase: 0, cool: R() * 2, ch: null, stun: 0, hunter: !!S.hunter, school: extra && extra.school != null ? extra.school : null, born: G.t, puff: 0,
  };
  G.fish.push(f);
  return f;
}

export function spawnFish(G, initial, anchor) {
  const R = G.rng;
  const anchors = anchorPlayers(G);
  if (!anchors.length) return null;
  const P = anchor || anchors[Math.floor(R() * anchors.length)];
  const V = viewOf(P.n);
  let x, y, tries = 0;
  do {
    const ang = R() * TAU;
    const dist = initial ? (0.3 + R() * 1.25) * V : (1.05 + R() * 0.55) * V;
    x = P.x + Math.cos(ang) * dist; y = P.y + Math.sin(ang) * dist * 0.9;
    tries++;
  } while ((x < 2 || x > WW - 2 || y < 2 || y > floorAt(x) - 2) && tries < 14);
  if (x < 2 || x > WW - 2 || y < 2 || y > floorAt(x) - 2) return null;
  const zone = zoneAt(x, y);
  const n = P.n;
  const roll = R();
  const nearHunters = G.fish.filter((f) => f.hunter && f.n > n && Math.hypot(f.x - P.x, f.y - P.y) < V * 2).length;
  const hk = G.cfg ? G.cfg.hunt : 1;
  const maxH = (n > 20000 ? 2 : 1) + (hk > 1.5 ? 1 : 0);
  const q = (a, b) => Math.max(1, Math.round(n * (a + R() * (b - a))));
  const qs = 1 / (1 + 0.8 * stageOf(n));
  const qf = (a, b) => q(a * qs, b * qs);
  if (!initial && roll < 0.035 * hk && nearHunters < maxH && G.t > (hk > 1.5 ? 6 : 20)) {
    const sp = pickSpecies(G, zone, 'hunter');
    return addFish(G, sp, Math.max(n + 3, q(1.5, 4.5)), x, y, R() * TAU);
  }
  if (roll < 0.24) {
    const sp = pickSpecies(G, zone, 'school');
    const cnt = 5 + Math.floor(R() * 5);
    const sid = G.nextId;
    const fn = qf(0.0015, 0.004);
    const head = R() * TAU;
    let first = null;
    for (let i = 0; i < cnt; i++) {
      const f = addFish(G, sp, fn, x + (R() - 0.5) * 2.5 * rOf(fn) * 6, y + (R() - 0.5) * 2 * rOf(fn) * 6, head + (R() - 0.5) * 0.4, { school: sid });
      if (!first) first = f;
    }
    return first;
  }
  let fnum;
  if (roll < 0.76) fnum = qf(0.003, 0.018);
  else if (roll < 0.86) fnum = qf(0.02, 0.07);
  else if (roll < 0.94) fnum = q(0.95, 1.4);
  else fnum = Math.max(n + 1, q(1.3, 4));
  if (initial && fnum > n) fnum = q(0.004, 0.1);
  const sp = pickSpecies(G, zone, 'prey');
  return addFish(G, sp, fnum, x, y, R() * TAU);
}

function spawnPk(G) {
  const R = G.rng;
  const anchors = anchorPlayers(G).filter((p) => p.kind !== 'demo');
  if (!anchors.length) return;
  const P = anchors[Math.floor(R() * anchors.length)];
  const V = viewOf(P.n);
  const ang = R() * TAU, d = (0.5 + R() * 0.8) * V;
  const x = clamp(P.x + Math.cos(ang) * d, 3, WW - 3), y = clamp(P.y + Math.sin(ang) * d * 0.7, 3, floorAt(x) - 3);
  const kinds = P.lives < LIVES && R() < 0.12 ? ['life'] : ['shield', 'double', 'magnet', 'speed'];
  G.pk.push({ id: G.nextId++, k: kinds[Math.floor(R() * kinds.length)], x, y, life: 20, r: Math.max(0.35, rOf(P.n) * 0.7) });
}

export function bodySeg(p, r) {
  const rr = r == null ? rOf(p.n) : r;
  const ca = Math.cos(p.a), sa = Math.sin(p.a);
  return { hx: p.x + ca * rr * 0.95, hy: p.y + sa * rr * 0.95, tx: p.x - ca * rr * 1.05, ty: p.y - sa * rr * 1.05, w: rr * 0.78, r: rr };
}
function segDist(px, py, s) {
  const dx = s.hx - s.tx, dy = s.hy - s.ty, l2 = dx * dx + dy * dy || 1e-9;
  const t = clamp(((px - s.tx) * dx + (py - s.ty) * dy) / l2, 0, 1);
  return Math.hypot(px - (s.tx + dx * t), py - (s.ty + dy * t));
}
export function touches(p, f) {
  if (p.dead > 0) return false;
  const s = bodySeg(p);
  const fr = rOf(f.n);
  return segDist(f.x, f.y, s) < s.w + fr * 0.45;
}
export const suckR = (p) => rOf(p.n) * 3.6 + viewOf(p.n) * 0.06;
export const canEat = (p, f) => !p.out && p.dead <= 0 && f.n <= p.n && f.stun >= 0 && touches(p, f);
export const safe = (p) => p.prot > 0 || p.fx.shield > 0;

export function useSkill(G, p, k) {
  if (!p || p.dead > 0 || p.out) return false;
  const S = SKILLS[k];
  if (!S || p.stage < S.stage || p.cd[k] > 0) return false;
  const cdK = Math.max(0.55, 1 - 0.08 * Math.max(0, p.stage - S.stage));
  p.cd[k] = S.cd * cdK;
  if (k === 'dash') { p.dashT = 0.36; }
  if (k === 'suck') { p.fx.suck = 1.0; }
  if (k === 'shield') { p.fx.shield = Math.max(p.fx.shield, S.dur); }
  if (k === 'frenzy') { p.fx.frenzy = S.dur; }
  if (k === 'shock') {
    const R = rOf(p.n) * 6 + 4;
    for (const f of G.fish) if (Math.hypot(f.x - p.x, f.y - p.y) < R) { f.stun = S.dur; f.chase = 0; }
  }
  return true;
}

export function movePlayer(G, p, input, dt) {
  if (p.out) return;
  if (p.dead > 0) { p.vx *= 0.92; p.vy *= 0.92; p.y -= dt * 0.6; return; }
  const ix = input ? input.x || 0 : 0, iy = input ? input.y || 0 : 0;
  const mag = Math.min(1, Math.hypot(ix, iy));
  const base = speedOf(p.n) * (p.fx.speed > 0 ? 1.3 : 1) * (p.fx.frenzy > 0 ? 1.25 : 1);
  const top = base * (p.dashT > 0 ? 2.25 : 1);
  if (mag > 0.05) {
    const want = Math.atan2(iy, ix);
    const turn = (p.dashT > 0 ? 7 : 11) / (1 + rOf(p.n) * 0.12);
    p.a = angLerp(p.a, want, 1 - Math.exp(-dt * turn));
  }
  const fwd = p.dashT > 0 ? 1 : mag;
  const tvx = Math.cos(p.a) * top * fwd, tvy = Math.sin(p.a) * top * fwd;
  const acc = p.dashT > 0 ? 14 : mag > 0.05 ? 7.5 : 3.2;
  const k = 1 - Math.exp(-dt * acc);
  p.vx += (tvx - p.vx) * k; p.vy += (tvy - p.vy) * k;
  p.x += p.vx * dt; p.y += p.vy * dt;
  const r = rOf(p.n);
  p.x = clamp(p.x, r, WW - r);
  const fl = floorAt(p.x) - r * 0.7;
  if (p.y > fl) { p.y = fl; if (p.vy > 0) p.vy *= -0.2; }
  if (p.y < r * 0.6 + 0.3) { p.y = r * 0.6 + 0.3; if (p.vy < 0) p.vy *= -0.2; }
  p.wob += dt * (2 + Math.hypot(p.vx, p.vy) * 1.6);
}
export function tickPlayer(p, dt) {
  if (p.dashT > 0) p.dashT -= dt;
  for (const k of SKILL_KEYS) if (p.cd[k] > 0) p.cd[k] = Math.max(0, p.cd[k] - dt);
  if (p.prot > 0) p.prot -= dt;
  if (p.eat > 0) p.eat -= dt;
  if (p.hurt > 0) p.hurt -= dt;
  if (p.comboT > 0) { p.comboT -= dt; if (p.comboT <= 0) p.combo = 0; }
  for (const k of Object.keys(p.fx)) if (p.fx[k] > 0) p.fx[k] = Math.max(0, p.fx[k] - dt);
}

function steerFish(G, f, dt) {
  const R = G.rng;
  const S = SPECIES[f.sp];
  const r = rOf(f.n);
  if (f.stun > 0) { f.stun -= dt; f.x += Math.cos(f.a) * 0.1 * dt; f.y += 0.25 * dt; return; }
  let want = f.a;
  let sp = f.v * (1.4 + r * 0.5);
  f.tt -= dt;
  if (f.tt <= 0) { f.tt = 1.6 + R() * 2.6; f.va = (R() - 0.5) * 1.4; }
  want = f.a + f.va * 0.9;
  if (f.school != null) {
    let cx = 0, cy = 0, ax = 0, ay = 0, c = 0;
    for (const o of (G.schools && G.schools.get(f.school)) || G.fish) {
      if (o.school !== f.school || o === f) continue;
      const d = Math.hypot(o.x - f.x, o.y - f.y);
      if (d > r * 14) continue;
      cx += o.x; cy += o.y; ax += Math.cos(o.a); ay += Math.sin(o.a); c++;
      if (d < r * 2.2) { want += angDiff(Math.atan2(f.y - o.y, f.x - o.x), want) * 0.03; }
    }
    if (c) {
      const toC = Math.atan2(cy / c - f.y, cx / c - f.x);
      const al = Math.atan2(ay, ax);
      want = f.a + angDiff(f.a, al) * 0.6 + angDiff(f.a, toC) * 0.25;
    }
  }
  const live = G.order.map((k) => G.pl[k]).filter((p) => p && !p.out && p.dead <= 0);
  if (f.hunter) {
    if (f.cool > 0) f.cool -= dt;
    if (f.warn > 0) {
      f.warn -= dt;
      const p = G.pl[f.ch];
      if (!p || p.dead > 0 || p.out || safe(p) || p.n >= f.n) { f.warn = 0; f.cool = 4; }
      else { want = Math.atan2(p.y - f.y, p.x - f.x); sp *= 0.35; if (f.warn <= 0) f.chase = 1.2; }
    } else if (f.chase > 0) {
      f.chase -= dt;
      const p = G.pl[f.ch];
      if (!p || p.dead > 0 || p.out || safe(p) || p.n >= f.n) f.chase = 0;
      else { want = Math.atan2(p.y - f.y, p.x - f.x); sp = Math.min(speedOf(p.n) * 0.64, speedOf(f.n) * 0.66); }
      if (f.chase <= 0) { f.cool = 8.5; f.va = (R() < 0.5 ? -1 : 1) * 1.2; f.tt = 1.4; }
    } else if (f.cool <= 0) {
      let best = null, bd = 3 + r * 2.2;
      for (const p of live) { if (p.n >= f.n || safe(p)) continue; const d = Math.hypot(p.x - f.x, p.y - f.y) - rOf(p.n); if (d < bd) { bd = d; best = p; } }
      if (best) { f.warn = 0.75; f.ch = best.kind; ev(G, { k: 'hunt', id: f.id, who: best.kind }); }
    }
  } else {
    for (const p of live) {
      const pull = p.fx.magnet > 0 || p.fx.frenzy > 0;
      if (p.fx.suck > 0 && p.n >= f.n) {
        const hx = p.x + Math.cos(p.a) * rOf(p.n), hy = p.y + Math.sin(p.a) * rOf(p.n);
        const d = Math.hypot(hx - f.x, hy - f.y), RR = suckR(p);
        if (d < RR) { const k2 = 1 - d / RR; f.x += (hx - f.x) / (d || 1) * dt * (6 + 14 * k2) * (1 + rOf(p.n) * 0.4); f.y += (hy - f.y) / (d || 1) * dt * (6 + 14 * k2) * (1 + rOf(p.n) * 0.4); f.a = Math.atan2(hy - f.y, hx - f.x) + Math.PI; f.sucked = 0.2; continue; }
      }
      if (pull && p.n >= f.n) { const dx = p.x - f.x, dy = p.y - f.y, d = Math.hypot(dx, dy); if (d < rOf(p.n) * 5 + 3) { want = Math.atan2(dy, dx); sp = Math.max(sp, 2.2); } }
    }
    if (S.shape === 'puff') { let near = false; for (const p of live) if (p.n > f.n && Math.hypot(p.x - f.x, p.y - f.y) < rOf(p.n) * 3 + 1.5) near = true; f.puff = clamp(f.puff + (near ? dt * 3 : -dt * 1.2), 0, 1); }
  }
  const fl = floorAt(f.x);
  const m = 1.5 + r;
  if (f.y > fl - m) want = angLerp(want, -Math.PI / 2 * 0.6 + (Math.cos(f.a) > 0 ? 0 : Math.PI), 0.5);
  if (f.y < m) want = angLerp(want, Math.PI / 2 * 0.5 + (Math.cos(f.a) > 0 ? 0 : Math.PI), 0.5);
  if (f.x < m) want = angLerp(want, 0, 0.6);
  if (f.x > WW - m) want = angLerp(want, Math.PI, 0.6);
  f.a = angLerp(f.a, want, 1 - Math.exp(-dt * (f.chase > 0 ? 5 : 2.2)));
  if (f.sucked > 0) { f.sucked -= dt; return; }
  f.x += Math.cos(f.a) * sp * dt; f.y += Math.sin(f.a) * sp * dt * (S.shape === 'jelly' ? 0.3 : 1);
  if (S.shape === 'jelly') f.y += Math.sin(G.t * 1.6 + f.id) * 0.25 * dt;
  f.y = clamp(f.y, 0.6, fl - r * 0.5);
  f.x = clamp(f.x, 0.5, WW - 0.5);
}

function killPlayer(G, p, by, killer) {
  if (p.dead > 0 || p.out) return;
  p.dead = 2.2; if (!G.coop) p.lives -= 1; p.sto = 0; p.hurt = 0.8; p.combo = 0; p.deaths = (p.deaths || 0) + 1;
  p.by = killer ? { sp: killer.sp != null ? killer.sp : -1, n: killer.n, who: killer.kind || null } : null;
  ev(G, { k: 'die', who: p.kind, by, x: p.x, y: p.y, n: p.n, kn: killer ? killer.n : 0, ksp: killer && killer.sp != null ? killer.sp : -1, kwho: killer && killer.kind ? killer.kind : null });
  if (p.lives <= 0) { p.out = true; ev(G, { k: 'out', who: p.kind, n: p.best }); }
}
function respawn(G, p) {
  const R = G.rng;
  let best = [p.x, Math.min(p.y, floorAt(p.x) - 4)], bs = -Infinity;
  for (let i = 0; i < 12; i++) {
    const x = clamp(p.x + (R() - 0.5) * viewOf(p.n) * 2, 4, WW - 4), y = clamp(p.y + (R() - 0.5) * viewOf(p.n), 4, floorAt(x) - 4);
    let sc = 99;
    for (const f of G.fish) if (f.n > p.n * 0.6) sc = Math.min(sc, Math.hypot(f.x - x, f.y - y) - rOf(f.n));
    for (const k of G.order) { const o = G.pl[k]; if (o !== p && o && !o.out && o.dead <= 0) sc = Math.min(sc, Math.hypot(o.x - x, o.y - y) - rOf(o.n)); }
    if (sc > bs) { bs = sc; best = [x, y]; }
  }
  p.x = best[0]; p.y = best[1]; p.vx = p.vy = 0; p.dead = 0; p.prot = 3; p.n = Math.max(2, Math.floor(p.n * 0.6)); p.tp += 1;
  p.stage = stageOf(p.n);
  for (const k of Object.keys(p.fx)) p.fx[k] = 0;
  if (p.nb) p.nb.buf.length = 0;
  ev(G, { k: 'spawn', who: p.kind });
}
const STAGE_GAIN = [1, 1, 0.85, 0.7, 0.6, 0.55];
export function gainFor(p, n) {
  const mult = (p.fx.double > 0 ? 2 : 1) * (p.fx.frenzy > 0 ? 2 : 1) * (p.bot ? 0.6 : 1);
  const bonus = p.combo >= 3 ? 1 + Math.min(0.3, (p.combo - 2) * 0.05) : 1;
  const g = Math.max(1, Math.floor(n * mult * bonus * STAGE_GAIN[Math.min(5, p.stage || 0)]));
  return Math.min(g, Math.max(24, Math.floor(p.n * 0.9)));
}
function feed(G, p, gain) { p.sto = 0; grow(G, p, gain); }
function grow(G, p, gain) {
  if (p.bot) { const hum = G.pl[G.order.find((k) => G.pl[k] && !G.pl[k].bot && k !== 'demo')]; if (hum) gain = Math.max(0, Math.min(gain, Math.floor(hum.best * 0.85) - p.n)); }
  p.n += gain;
  if (p.n > p.best) p.best = p.n;
  const st = stageOf(p.n);
  if (st > p.stage) {
    p.stage = st;
    if (p.lives < LIVES) p.lives += 1;
    ev(G, { k: 'evolve', who: p.kind, st });
  }
}
export function eatFish(G, p, f) {
  const i = G.fish.indexOf(f);
  if (i < 0) return false;
  G.fish.splice(i, 1);
  p.combo = p.comboT > 0 ? p.combo + 1 : 1;
  p.comboT = 1.6;
  const gain = gainFor(p, f.n);
  p.eat = 0.3; p.eaten += 1;
  feed(G, p, gain);
  ev(G, { k: 'eat', who: p.kind, id: f.id, gain, x: f.x, y: f.y, sp: f.sp, c: p.combo, big: f.n > p.n * 0.35 ? 1 : 0 });
  return true;
}
export function takePk(G, p, pk) {
  const i = G.pk.indexOf(pk);
  if (i < 0) return false;
  G.pk.splice(i, 1);
  if (pk.k === 'life') p.lives = Math.min(LIVES, p.lives + 1);
  else p.fx[pk.k] = Math.max(p.fx[pk.k] || 0, PK_TIME[pk.k]);
  ev(G, { k: 'pick', who: p.kind, id: pk.id, kind: pk.k, x: pk.x, y: pk.y });
  return true;
}
export const canTake = (p, pk) => !p.out && p.dead <= 0 && Math.hypot(p.x - pk.x, p.y - pk.y) < rOf(p.n) * 1.1 + pk.r;

export function hostStep(G, dt, ctl) {
  G.t += dt;
  for (const k of G.order) {
    const p = G.pl[k];
    if (!p || k === 'demo') continue;
    if (ctl.local.has(k)) {
      const inp = ctl.inputs[k];
      if (inp && inp.skill) useSkill(G, p, inp.skill);
      movePlayer(G, p, inp, dt);
    }
    tickPlayer(p, dt);
    if (p.dead > 0 && !p.out) { p.dead -= dt; if (p.dead <= 0) respawn(G, p); }
    if (p.bot && p.out) {
      p.reviveT = (p.reviveT == null ? 5 : p.reviveT) - dt;
      if (p.reviveT <= 0) {
        const me = G.pl[G.order.find((x) => !G.pl[x].bot)] || p;
        const R = G.rng;
        Object.assign(p, mkPl(k, p.name, clamp(me.x + (R() - 0.5) * viewOf(me.n) * 3, 4, WW - 4), 0), { bot: true, color: p.color, reviveT: null });
        p.y = clamp(me.y + (R() - 0.5) * viewOf(me.n), 4, floorAt(p.x) - 4);
        p.n = Math.max(2, Math.floor(me.n * (0.25 + R() * 0.5)));
        p.best = p.n; p.stage = stageOf(p.n); p.prot = 3;
        ev(G, { k: 'spawn', who: k });
      }
    }
  }
  if (G.demo) { const d = G.pl.demo; d.x = 62 + Math.sin(G.t * 0.04) * 38; d.y = 60 + Math.sin(G.t * 0.07) * 3; }
  const schools = new Map();
  for (const f of G.fish) if (f.school != null) { let arr = schools.get(f.school); if (!arr) { arr = []; schools.set(f.school, arr); } arr.push(f); }
  G.schools = schools;
  for (const f of G.fish) steerFish(G, f, dt);
  G.schools = null;
  const anchors = anchorPlayers(G);
  const keep = [];
  for (const f of G.fish) {
    let near = false;
    for (const p of anchors) { if (Math.hypot(f.x - p.x, f.y - p.y) < viewOf(p.n) * 2.2 + rOf(f.n) * 2) { near = true; break; } }
    if (near) keep.push(f);
  }
  G.fish = keep;
  G.spawnT -= dt;
  if (G.spawnT <= 0) {
    G.spawnT = 0.25;
    for (const p of anchors) {
      const V = viewOf(p.n);
      let around = 0;
      for (const f of G.fish) if (Math.abs(f.x - p.x) < V * 2.2 && Math.abs(f.y - p.y) < V * 2.2 && Math.hypot(f.x - p.x, f.y - p.y) < V * 2.2) around++;
      if (around < 48) { spawnFish(G, false, p); if (around < 30) spawnFish(G, false, p); }
      const tiny = G.fish.find((f) => f.n < p.n * 0.012 && Math.hypot(f.x - p.x, f.y - p.y) > V * 0.9);
      if (tiny) G.fish.splice(G.fish.indexOf(tiny), 1);
    }
  }
  G.pkT -= dt;
  if (G.pkT <= 0) { G.pkT = (7 + G.rng() * 6) / Math.max(0.3, G.cfg ? G.cfg.pk : 1); if (G.pk.length < Math.max(2, anchors.length + 1)) spawnPk(G); }
  for (const pk of G.pk) pk.life -= dt;
  G.pk = G.pk.filter((pk) => pk.life > 0);
  for (const k of G.order) {
    const p = G.pl[k];
    if (!p || p.dead > 0 || p.out || k === 'demo' || !ctl.local.has(k)) continue;
    for (const f of G.fish.slice()) if (canEat(p, f)) eatFish(G, p, f);
    for (const pk of G.pk.slice()) if (canTake(p, pk)) takePk(G, p, pk);
  }
  for (const f of G.fish) {
    if (f.stun > 0) continue;
    const hr = rOf(f.n);
    const hx = f.x + Math.cos(f.a) * hr * 0.8, hy = f.y + Math.sin(f.a) * hr * 0.8;
    for (const k of G.order) {
      const p = G.pl[k];
      if (!p || p.dead > 0 || p.out || safe(p) || p.n >= f.n || k === 'demo' || (!f.hunter && f.n < p.n * 1.3)) continue;
      const lk = ctl.local.has(k) ? 1 : 0.85;
      if (segDist(hx, hy, bodySeg(p)) < (hr * (f.hunter ? 0.36 : 0.45) + rOf(p.n) * (f.hunter ? 0.36 : 0.45)) * lk) { f.eat = 0.4; killPlayer(G, p, 'fish', f); }
    }
    if (f.hunter && G.rng() < dt * 2) {
      for (const o of G.fish) {
        if (o === f || o.hunter || o.n >= f.n * 0.6) continue;
        if (Math.hypot(o.x - hx, o.y - hy) < hr * 0.7) { o.gone = true; f.eat = 0.3; ev(G, { k: 'feast', x: o.x, y: o.y }); break; }
      }
    }
  }
  if (G.fish.some((f) => f.gone)) G.fish = G.fish.filter((f) => !f.gone);
  const ps = G.coop ? [] : G.order.map((k) => G.pl[k]).filter((p) => p && !p.out && p.dead <= 0 && p.kind !== 'demo');
  for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
    const a = ps[i], b = ps[j];
    if (a.n === b.n || a.dead > 0 || b.dead > 0) continue;
    const big = a.n > b.n ? a : b, small = big === a ? b : a;
    if (safe(small)) continue;
    const lk = ctl.local.has(big.kind) && ctl.local.has(small.kind) ? 1 : 0.9;
    if (segDist(small.x, small.y, bodySeg(big)) < (bodySeg(big).w + rOf(small.n) * 0.4) * lk) {
      const gain = gainFor(big, small.n);
      killPlayer(G, small, 'player', big);
      big.eat = 0.4; big.eaten += 1;
      feed(G, big, gain);
      ev(G, { k: 'eatp', who: big.kind, vic: small.kind, gain, x: small.x, y: small.y });
    }
  }
  if (!G.over && !G.solo && !G.coop && G.order.length > 1) {
    const alive = G.order.filter((k) => k !== 'demo' && G.pl[k] && !G.pl[k].out);
    if (alive.length <= 1) { G.over = { w: alive[0] || null, why: 'lives' }; ev(G, { k: 'over', w: G.over.w }); }
  }
  if (!G.over && G.solo && !G.demo) {
    const me = G.pl[G.order[0]];
    if (me && me.out) { G.over = { w: null, why: 'out' }; ev(G, { k: 'over', w: null }); }
  }
}

export function applyGuestEvent(G, kind, e) {
  const p = G.pl[kind];
  if (!e || !p || G.over) return;
  if (e.k === 'eat') {
    const f = G.fish.find((x) => x.id === e.id);
    if (f && p.dead <= 0 && !p.out && f.n <= p.n + (e.slack || 0) && Math.hypot(p.x - f.x, p.y - f.y) < rOf(p.n) * 2.2 + rOf(f.n) + 2) { eatFish(G, p, f); G.acks.push([e.id, G.t]); }
  } else if (e.k === 'pick') {
    const pk = G.pk.find((x) => x.id === e.id);
    if (pk && p.dead <= 0) { takePk(G, p, pk); G.acks.push([e.id, G.t]); }
  } else if (e.k === 'skill') {
    useSkill(G, p, e.s);
  }
}

const q10 = (v) => Math.round(v * 10);
export function snap(G, views, forKey) {
  G.acks = G.acks.filter(([, t]) => G.t - t < 1.6);
  const inView = (f) => !views || views.some((v) => Math.hypot(f.x - v.x, f.y - v.y) < v.R + rOf(f.n));
  const evOk = (e) => !forKey || !views || e.who === forKey || e.vic === forKey || e.k === 'over' || e.k === 'out' || e.k === 'evolve' || e.x == null || views.some((v) => Math.hypot(e.x - v.x, e.y - v.y) < v.R);
  const P = (p) => [Math.floor(p.n), p.lives, p.dead > 0 ? Math.round(p.dead * 10) : 0, q10(p.prot), q10(p.fx.shield), q10(p.fx.double), q10(p.fx.magnet), q10(p.fx.speed), p.tp, q10(p.x), q10(p.y), p.out ? 1 : 0, p.stage, Math.floor(p.best), p.eaten, q10(p.fx.frenzy), q10(p.fx.suck)];
  const pl = {};
  for (const k of G.order) if (G.pl[k] && k !== 'demo') pl[k] = P(G.pl[k]);
  return {
    gt: Math.round(G.t * 100), seq: G.seq,
    f: G.fish.filter(inView).map((f) => [f.id, f.sp * 10 + f.pv, f.n, q10(f.x), q10(f.y), Math.round(f.a * 100), (f.hunter ? 1 : 0) + (f.chase > 0 ? 2 : 0) + (f.stun > 0 ? 4 : 0) + (f.warn > 0 ? 8 : 0), f.school != null ? f.school : 0, Math.round(f.puff * 10)]),
    pk: G.pk.map((k) => [k.id, PK_KINDS.indexOf(k.k), q10(k.x), q10(k.y), q10(k.r)]),
    pl, ack: G.acks.map(([id]) => id), ev: (forKey ? G.log.filter(evOk) : G.log).slice(-14), over: G.over,
  };
}
export function applySnap(G, s, mine) {
  const dts = G.lastGt != null ? clamp((s.gt - G.lastGt) / 100, 0, 1) : 0;
  G.lastGt = s.gt;
  G.hostT = s.gt / 100;
  const seen = new Set();
  const byId = new Map(G.fish.map((f) => [f.id, f]));
  for (const row of s.f) {
    const [id, spv, n, x, y, a, fl, sch, puff] = row;
    seen.add(id);
    const nx = x / 10, ny = y / 10;
    let f = byId.get(id);
    const sp = Math.floor(spv / 10), pv = spv % 10;
    if (!f) { f = { id, sp, pv, n, x: nx, y: ny, a: a / 100, tx: nx, ty: ny, ta: a / 100, vx: 0, vy: 0, ext: 0, hunter: !!(fl & 1), chase: 0, stun: 0, school: sch || null, puff: 0, born: G.t }; G.fish.push(f); }
    else if (dts > 0.02 && f.sx != null) { f.vx = (nx - f.sx) / dts; f.vy = (ny - f.sy) / dts; const v = Math.hypot(f.vx, f.vy); const cap = 3 + rOf(n) * 3; if (v > cap) { f.vx *= cap / v; f.vy *= cap / v; } }
    f.sx = nx; f.sy = ny; f.ext = 0;
    f.sp = sp; f.pv = pv; f.n = n; f.hunter = !!(fl & 1); f.chase = fl & 2 ? 1 : 0; f.stun = fl & 4 ? 1 : 0; f.warn = fl & 8 ? 1 : 0; f.tx = nx; f.ty = ny; f.ta = a / 100; f.puff = (puff || 0) / 10;
    if (Math.hypot(f.x - f.tx, f.y - f.ty) > 4 + rOf(n) * 2) { f.x = f.tx; f.y = f.ty; }
  }
  G.fish = G.fish.filter((f) => seen.has(f.id));
  G.pk = s.pk.map(([id, k, x, y, r]) => ({ id, k: PK_KINDS[k], x: x / 10, y: y / 10, r: r / 10, life: 9 }));
  if (s.all) for (const k of G.order.slice()) if (k !== 'demo' && !s.pl[k]) { delete G.pl[k]; G.order = G.order.filter((x) => x !== k); }
  for (const k of Object.keys(s.pl)) {
    let p = G.pl[k];
    if (!p) { p = mkPl(k, '', s.pl[k][9] / 10, s.pl[k][10] / 10); G.pl[k] = p; if (!G.order.includes(k)) G.order.push(k); }
    const v = s.pl[k];
    p.hostN = v[0]; p.lives = v[1];
    const deadNow = v[2] > 0;
    if (k !== mine) { p.n = v[0]; p.fx.shield = v[4] / 10; p.fx.double = v[5] / 10; p.fx.magnet = v[6] / 10; p.fx.speed = v[7] / 10; p.fx.frenzy = (v[15] || 0) / 10; p.fx.suck = (v[16] || 0) / 10; }
    else { p.fx.shield = Math.max(p.fx.shield, v[4] / 10); }
    if (deadNow && p.dead <= 0) p.dead = v[2] / 10;
    if (!deadNow && p.dead > 0) p.dead = 0;
    p.prot = v[3] / 10;
    p.out = !!v[11]; p.stage = v[12] || 0; p.best = v[13] || p.best; p.eaten = v[14] || 0;
    if (k === mine && v[8] !== p.tp) { p.tp = v[8]; p.x = v[9] / 10; p.y = v[10] / 10; p.vx = 0; p.vy = 0; p.respawned = true; }
  }
  G.acked = new Set(s.ack);
  G.over = s.over || null;
}
export function guestFollow(G, dt) {
  G.t += dt;
  const k = 1 - Math.exp(-dt * 10);
  for (const f of G.fish) {
    if (f.tx == null) continue;
    if (f.ext < 0.3) { f.tx += (f.vx || 0) * dt; f.ty += (f.vy || 0) * dt; f.ext += dt; }
    f.x += (f.tx - f.x) * k; f.y += (f.ty - f.y) * k;
    f.a = angLerp(f.a, f.ta, k);
  }
}

export function setNet(p, m) {
  const now = Date.now();
  if ((m.tp || 0) < (p.tp || 0)) return;
  const N = p.nb || (p.nb = { buf: [], off: null, jit: 60, tp: m.tp || 0, last: 0, snap: true });
  const sent = typeof m.at === 'number' ? m.at : now;
  const lag = now - sent;
  N.off = N.off == null ? lag : Math.min(N.off + 0.6, lag);
  N.jit = Math.max(lag - N.off, N.jit * 0.97);
  const t = sent + N.off;
  if ((m.tp || 0) !== N.tp) { N.tp = m.tp || 0; N.buf.length = 0; N.snap = true; }
  if (N.buf.length && t <= N.buf[N.buf.length - 1].t) return;
  N.buf.push({ t, x: m.x, y: m.y, vx: m.vx || 0, vy: m.vy || 0, a: m.a || 0 });
  if (N.buf.length > 24) N.buf.shift();
  N.last = now;
  if (m.dash) p.dashT = Math.max(p.dashT, 0.3);
}
export function followNet(p, dt) {
  const N = p.nb;
  if (!N || !N.buf.length) return;
  const now = Date.now();
  const delay = 70 + clamp(N.jit * 1.3, 0, 280);
  const rt = now - delay, b = N.buf;
  let tx, ty, ta;
  if (rt <= b[0].t) { tx = b[0].x; ty = b[0].y; ta = b[0].a; }
  else {
    let done = false;
    for (let i = b.length - 1; i >= 1; i--) { const a = b[i - 1], c = b[i]; if (rt >= a.t && rt <= c.t) { const f = c.t > a.t ? (rt - a.t) / (c.t - a.t) : 1; tx = a.x + (c.x - a.x) * f; ty = a.y + (c.y - a.y) * f; ta = f < 0.5 ? a.a : c.a; done = true; break; } }
    if (!done) { const L = b[b.length - 1]; const ex = clamp((rt - L.t) / 1000, 0, 0.18); tx = L.x + L.vx * ex; ty = L.y + L.vy * ex; ta = L.a; }
  }
  const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
  if (N.snap || d > 4 + rOf(p.n) * 2) { p.x = tx; p.y = ty; N.snap = false; }
  else { const mx = speedOf(p.n) * 2.6 * dt; const st = Math.min(d, Math.max(mx * 0.3, d * (1 - Math.exp(-dt * 14))), mx); if (d > 1e-5) { p.x += dx / d * st; p.y += dy / d * st; } }
  p.a = angLerp(p.a, ta, 1 - Math.exp(-dt * 12));
  const L = b[b.length - 1]; p.vx = L.vx; p.vy = L.vy;
  p.wob += dt * (2 + Math.hypot(p.vx, p.vy) * 1.6);
}

export function botInput(G, me, dt) {
  if (me.dead > 0 || me.out) return { x: 0, y: 0 };
  const M = G.botMem[me.kind] || (G.botMem[me.kind] = { t: 0, out: { x: 0, y: 0 }, idle: 0, skillT: 3 + G.rng() * 4 });
  M.t -= dt;
  M.skillT -= dt;
  if (M.idle > 0) { M.idle -= dt; return { x: M.out.x * 0.3, y: M.out.y * 0.3 }; }
  if (M.t > 0) return M.out;
  M.t = 0.45 + G.rng() * 0.35;
  if (G.rng() < 0.1) { M.idle = 0.8 + G.rng() * 1.2; return { x: 0, y: 0 }; }
  let tx = 0, ty = 0;
  const hum = G.pl[G.order.find((k) => G.pl[k] && !G.pl[k].bot && k !== 'demo')];
  if (hum && !hum.out) {
    const d = Math.hypot(hum.x - me.x, hum.y - me.y);
    if (d > viewOf(hum.n) * 1.8) { const l = d || 1; M.out = { x: (hum.x - me.x) / l * 0.62, y: (hum.y - me.y) / l * 0.62 }; return M.out; }
  }
  let flee = null, fd = 3 + rOf(me.n) * 2;
  for (const f of G.fish) { if (f.n <= me.n) continue; const d = Math.hypot(f.x - me.x, f.y - me.y) - rOf(f.n); if (d < (f.hunter ? fd : Math.min(fd, 0.9 + rOf(me.n)))) { fd = d; flee = f; } }
  let skill = null;
  if (flee && !safe(me)) { tx = me.x - flee.x; ty = me.y - flee.y; if (fd < 1.5 && G.rng() < 0.3) skill = 'dash'; }
  else {
    let best = null, bs = -1;
    for (const f of G.fish) { if (f.n > me.n) continue; const d = Math.hypot(f.x - me.x, f.y - me.y); const sc = f.n / (1 + d * d * 0.05 / Math.max(1, rOf(me.n))) * (0.7 + G.rng() * 0.6); if (sc > bs) { bs = sc; best = f; } }
    if (best) { tx = best.x - me.x; ty = best.y - me.y; }
    else { tx = Math.cos(G.t * 0.2 + me.x); ty = Math.sin(G.t * 0.3) * 0.5; }
    if (M.skillT <= 0 && best) { M.skillT = 6 + G.rng() * 6; skill = 'suck'; }
  }
  const l = Math.hypot(tx, ty) || 1;
  M.out = { x: tx / l * 0.62, y: ty / l * 0.62 };
  return { x: M.out.x, y: M.out.y, skill };
}

export function newRound(G) {
  for (const k of G.order) {
    const p = G.pl[k];
    if (!p || k === 'demo') continue;
    Object.assign(p, mkPl(k, p.name, p.x, p.y), { bot: p.bot, color: p.color });
  }
  G.over = null;
}
