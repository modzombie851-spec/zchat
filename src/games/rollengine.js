export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const R = 0.42;
export const H = 18;
export const WORLDS = [
  { id: 'meadow', name: 'Sunny meadow', n: 6 },
  { id: 'canyon', name: 'Red canyon', n: 6 },
  { id: 'frost', name: 'Frost peaks', n: 6 },
  { id: 'works', name: 'Clockwork works', n: 6 },
  { id: 'night', name: 'Star night', n: 6 },
  { id: 'candy', name: 'Candy hills', n: 6 },
  { id: 'lava', name: 'Lava caves', n: 6 },
  { id: 'beach', name: 'Coral beach', n: 6 },
  { id: 'cloud', name: 'Cloud kingdom', n: 6 },
];
export const LEVEL_N = WORLDS.reduce((a, w) => a + w.n, 0);
export const BALLS = [
  { id: 'sunny', name: 'Sunny', body: '#FFC93C', dark: '#E08E1B', light: '#FFF0A8', mark: '#FF7A3D' },
  { id: 'minty', name: 'Minty', body: '#5FD38D', dark: '#2E9C5E', light: '#C6F5D8', mark: '#2C7A4B' },
  { id: 'skye', name: 'Skye', body: '#5AB8FF', dark: '#2A78C8', light: '#CDEBFF', mark: '#FFFFFF' },
  { id: 'plum', name: 'Plum', body: '#B07CFF', dark: '#7445C9', light: '#E6D6FF', mark: '#FFD23F' },
];

export function rngOf(seed) {
  let a = 0;
  const s = String(seed);
  for (let i = 0; i < s.length; i++) a = (Math.imul(a ^ s.charCodeAt(i), 2654435761) + i) | 0;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export const levelOf = (i) => { let k = i; for (let w = 0; w < WORLDS.length; w++) { if (k < WORLDS[w].n) return { w, l: k }; k -= WORLDS[w].n; } return { w: WORLDS.length - 1, l: 0 }; };
export const levelName = (i) => String(i + 1);

const SOLID = new Set(['#', '=', 'D', '/', '\\', 'I', 'H']);
export const solidCh = (ch) => SOLID.has(ch);

export function buildLevel(index, nPlayers) {
  const { w, l } = levelOf(index);
  const rnd = rngOf(`roll:${index}`);
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const diff = w * 0.55 + l * 0.18;
  const segs = 10 + Math.min(10, Math.floor(w * 1.3 + l * 0.7));
  const cols = [];
  const ents = [];
  const coins = [];
  const stars = [];
  const flags = [];
  const buttons = [];
  const doors = [];
  const springs = [];
  const plates = [];
  const bridges = [];
  const plateGroups = [];
  const needOf = {};
  const team = Math.min(4, Math.max(1, nPlayers || 1));
  let gid = 0;
  let base = 12;
  const col = (top, opts) => {
    const o = opts || {};
    const c = new Array(H).fill('.');
    if (top != null) for (let y = top; y < H; y++) c[y] = '#';
    if (o.slope) c[top - 1] = o.slope;
    cols.push(c);
    return cols.length - 1;
  };
  const x0 = () => cols.length;
  const coinArc = (cx, cy, n, hgt) => { for (let i = 0; i < n; i++) { const k = n > 1 ? i / (n - 1) : 0.5; coins.push({ x: cx + i - (n - 1) / 2 + 0.5, y: cy - Math.sin(k * Math.PI) * (hgt || 0) + 0.5 }); } };
  const ice = WORLDS[w].id === 'frost';
  const flat = (n, coinsOn) => { const s = x0(); for (let i = 0; i < n; i++) col(base); if (coinsOn) coinArc(s + n / 2 - 0.5, base - 1.6, Math.min(n - 1, 5), 0); };
  const start = () => { flat(8); ents.push({ k: 'start', x: 3, y: base - 1 }); flags.push({ x: 3, y: base - 1, start: true }); };
  const plate = (x, y, g) => { cols[x][y] = 'P'; plates.push({ x, y, g }); };
  const button = (x, y, g) => { cols[x][y] = 'B'; buttons.push({ x, y, g }); };
  const SEG = {
    gap() {
      flat(ri(2, 3));
      const g = Math.min(4, 2 + Math.floor(diff * 0.8) + ri(0, 1));
      const s = x0();
      for (let i = 0; i < g; i++) col(null);
      coinArc(s + g / 2 - 0.5, base - 3, g + 1, 1.5);
      flat(ri(2, 3));
    },
    hill() {
      flat(1);
      const up = ri(2, 3);
      for (let i = 0; i < up; i++) { const c = cols[col(base - i)]; c[base - i - 1] = '/'; }
      base -= up;
      const s = x0();
      flat(ri(2, 4), true);
      if (rnd() < 0.4 && stars.length < 3) stars.push({ x: s + 1.5, y: base - 4.5 });
      for (let i = 0; i < up; i++) { const c = cols[col(base + i + 1)]; c[base + i] = '\\'; }
      base += up;
      flat(1);
    },
    steps() {
      const n = ri(3, 4);
      for (let i = 0; i < n; i++) { col(base - i); col(base - i); }
      const top = base - n + 1;
      const s = x0();
      for (let i = 0; i < 2; i++) col(top);
      coinArc(s + 0.5, top - 2, 3, 0.8);
      for (let i = n - 2; i >= 0; i--) { col(base - i); col(base - i); }
    },
    spikes() {
      flat(2);
      const n = Math.min(5, 2 + Math.floor(diff) + ri(0, 1));
      const s = x0();
      for (let i = 0; i < n; i++) { const c = cols[col(base)]; c[base - 1] = '^'; }
      coinArc(s + n / 2 - 0.5, base - 3.2, n, 1.2);
      flat(2);
    },
    spring() {
      flat(2);
      const s = x0();
      col(base); springs.push({ x: s, y: base - 1 }); cols[s][base - 1] = 'S';
      flat(1);
      const wh = ri(4, 5);
      const t = x0();
      for (let i = 0; i < 3; i++) col(base - wh);
      coinArc(t + 1, base - wh - 2, 3, 0.6);
      if (stars.length < 3 && rnd() < 0.55) stars.push({ x: t + 1.5, y: base - wh - 4.2 });
      flat(2);
    },
    walkers() {
      const n = ri(5, 7);
      const s = x0();
      flat(n, true);
      const cnt = 1 + (diff > 1.2 ? 1 : 0);
      for (let i = 0; i < cnt; i++) ents.push({ k: rnd() < 0.25 + w * 0.08 ? 'burr' : 'grub', x0: s + 0.6 + i * 2, x1: s + n - 0.6, y: base, sp: 1.3 + diff * 0.25 + rnd() * 0.3, ph: rnd() });
    },
    hopper() {
      flat(2);
      const s = x0();
      flat(4);
      ents.push({ k: 'jelly', x: s + 2, y: base, hh: 2.4 + rnd(), per: 1.5 + rnd() * 0.6, ph: rnd() });
      flat(2);
    },
    flyers() {
      flat(2);
      const g = 3 + (diff > 1.5 ? 1 : 0);
      const s = x0();
      for (let i = 0; i < g; i++) col(null);
      const pl = x0();
      for (let i = 0; i < 2; i++) { const c = cols[col(null)]; c[base] = '='; }
      for (let i = 0; i < g; i++) col(null);
      ents.push({ k: 'buzz', x: pl + 1, y: base - 2.6, rx: 1.6, ry: 0.6, ph: rnd() * TAU, sp: 1 + diff * 0.15 });
      coinArc(pl + 0.5, base - 1.6, 2, 0);
      coinArc(s + g / 2 - 0.5, base - 2.4, g, 0.8);
      flat(2);
    },
    mover() {
      flat(2);
      const g = 5 + Math.min(2, Math.floor(diff * 0.6));
      const s = x0();
      for (let i = 0; i < g; i++) col(null);
      ents.push({ k: 'mover', x0: s + 0.2, x1: s + g - 2.2, y: base, w: 2, sp: 1.4 + diff * 0.2, ph: rnd() });
      coinArc(s + g / 2 - 0.5, base - 2, g - 1, 1);
      flat(2);
    },
    lift() {
      flat(2);
      const s = x0();
      const hgt = ri(5, 6);
      for (let i = 0; i < 2; i++) col(base + 2);
      ents.push({ k: 'lift', x: s, y0: base, y1: base - hgt + 1, w: 2, sp: 1.3, ph: rnd() });
      const t = x0();
      for (let i = 0; i < 4; i++) col(base - hgt + 1);
      base = base - hgt + 1;
      coinArc(t + 1.5, base - 1.6, 3, 0);
      if (stars.length < 3 && rnd() < 0.5) stars.push({ x: t + 3.5, y: base - 2.5 });
      const dn = x0();
      for (let i = 0; i < 2; i++) col(base);
      base = Math.min(13, base + hgt - 1);
      for (let i = 0; i < 2; i++) col(base);
      void dn;
    },
    tower() {
      flat(1);
      const s = x0();
      const n = 5;
      for (let i = 0; i < n; i++) col(base);
      for (let k = 1; k <= 3; k++) { const y = base - 1 - k * 2.5; const yy = Math.round(y); const xa = k % 2 ? s : s + 2; for (let i = 0; i < 3; i++) cols[xa + i][yy] = '-'; coins.push({ x: xa + 1.5, y: yy - 0.8 }); }
      if (stars.length < 3) stars.push({ x: s + 1.5, y: Math.round(base - 1 - 7.5) - 1.6 });
      flat(1);
    },
    tunnel() {
      flat(1);
      const n = ri(5, 7);
      const s = x0();
      for (let i = 0; i < n; i++) { const c = cols[col(base)]; for (let y = 0; y <= base - 3; y++) c[y] = '#'; }
      coinArc(s + n / 2 - 0.5, base - 1.5, n - 1, 0);
      flat(1);
    },
    gate() {
      flat(1);
      const s = x0();
      for (let i = 0; i < 9; i++) col(base);
      gid += 1;
      const b1 = s + 1, b2 = s + 4, dx = s + 7;
      cols[b1][base - 1] = 'B'; cols[b2][base - 1] = 'B';
      buttons.push({ x: b1, y: base - 1, g: gid }, { x: b2, y: base - 1, g: gid });
      for (let y = base - 5; y < base; y++) cols[dx][y] = 'D';
      for (let y = 0; y < base - 5; y++) cols[dx][y] = '#';
      doors.push({ x: dx, y0: base - 5, y1: base - 1, g: gid });
      flat(2);
    },
    lava() {
      flat(2);
      const n = 6;
      const s = x0();
      for (let i = 0; i < n; i++) { const c = cols[col(base + 1)]; c[base] = 'L'; }
      for (const k of [0, 1, 4, 5]) { cols[s + k][base - 2] = '='; }
      ents.push({ k: 'buzz', x: s + 3, y: base - 4, rx: 1.2, ry: 0.4, ph: rnd() * TAU, sp: 1 });
      coinArc(s + 2.5, base - 3.5, 4, 0.6);
      flat(2);
    },
    ice() { flat(1); const s = x0(); for (let i = 0; i < 7; i++) { const c = cols[col(base)]; c[base] = 'I'; } coinArc(s + 3, base - 1.6, 5, 0); flat(1); },
    bridge() {
      flat(2);
      gid += 1;
      const g = gid;
      plateGroups.push(g);
      const s = x0();
      flat(3);
      plate(s + 1, base - 1, g);
      const gs = x0();
      const n = 6 + Math.min(2, Math.floor(diff * 0.5)) + ri(0, 1);
      for (let i = 0; i < n; i++) col(null);
      for (let i = 0; i < n; i++) { cols[gs + i][base] = 'H'; bridges.push({ x: gs + i, y: base, g }); }
      if (wid === 'lava') for (let i = 0; i < n; i++) { cols[gs + i][base + 3] = 'L'; for (let y = base + 4; y < H; y++) cols[gs + i][y] = '#'; }
      coinArc(gs + n / 2 - 0.5, base - 2.2, n - 1, 0.9);
      const e = x0();
      flat(4);
      plate(e + 2, base - 1, g);
      if (stars.length < 3 && rnd() < 0.5) stars.push({ x: gs + n / 2, y: base - 4.6 });
    },
    relay() {
      flat(1);
      gid += 1;
      const g = gid;
      plateGroups.push(g);
      const s = x0();
      for (let i = 0; i < 10; i++) col(base);
      plate(s + 2, base - 1, g);
      const dx = s + 5;
      for (let y = base - 4; y < base; y++) cols[dx][y] = 'D';
      for (let y = 0; y < base - 4; y++) cols[dx][y] = '#';
      doors.push({ x: dx, y0: base - 4, y1: base - 1, g, hold: true });
      plate(s + 8, base - 1, g);
      coinArc(s + 7.5, base - 1.6, 3, 0);
      flat(1);
    },
    team() {
      flat(1);
      gid += 1;
      const g = gid;
      needOf[g] = team;
      const s = x0();
      for (let i = 0; i < 14; i++) col(base);
      for (let i = 3; i <= 5; i++) cols[s + i][base - 1] = '#';
      for (let i = 4; i <= 5; i++) cols[s + i][base - 2] = '#';
      button(s + 1, base - 1, g);
      button(s + 5, base - 3, g);
      cols[s + 7][base - 1] = 'S'; springs.push({ x: s + 7, y: base - 1 });
      for (let i = 8; i <= 9; i++) cols[s + i][base - 5] = '-';
      button(s + 9, base - 6, g);
      button(s + 11, base - 1, g);
      const dx = s + 13;
      for (let y = base - 5; y < base; y++) cols[dx][y] = 'D';
      for (let y = 0; y < base - 5; y++) cols[dx][y] = '#';
      doors.push({ x: dx, y0: base - 5, y1: base - 1, g });
      coins.push({ x: s + 9, y: base - 7.6 }, { x: s + 5.5, y: base - 4.4 });
      flat(2);
    },
    climb() {
      flat(2);
      const s = x0();
      for (let i = 0; i < 6; i++) col(base);
      const steps = Math.min(4, Math.max(3, Math.floor((base - 4) / 2)));
      for (let k = 1; k <= steps; k++) {
        const y = base - k * 2;
        const xa = k % 2 ? s + 1 : s + 3;
        cols[xa][y] = '-'; cols[xa + 1][y] = '-';
        coins.push({ x: xa + 1, y: y - 0.9 });
      }
      const top = base - steps * 2;
      const nb = Math.max(5, top + 1);
      const t = x0();
      for (let i = 0; i < 5; i++) col(nb);
      if (stars.length < 3) stars.push({ x: t + 2.5, y: nb - 2.4 });
      coinArc(t + 2, nb - 1.6, 4, 0);
      base = nb;
      while (base < 12) { const c = cols[col(base + 1)]; c[base] = '\\'; base += 1; }
      flat(2);
    },
  };
  const wid = WORLDS[w].id;
  const SIG = {
    meadow: ['walkers', 'hill', 'steps', 'spring', 'gap', 'spikes', 'tunnel', 'mover', 'bridge', 'team'],
    canyon: ['gap', 'gap', 'bridge', 'bridge', 'hill', 'climb', 'mover', 'spikes', 'hopper', 'team'],
    frost: ['ice', 'ice', 'steps', 'relay', 'flyers', 'spikes', 'gap', 'bridge', 'climb', 'walkers'],
    works: ['mover', 'mover', 'lift', 'lift', 'relay', 'relay', 'gate', 'team', 'tunnel', 'spikes'],
    night: ['flyers', 'flyers', 'tower', 'climb', 'bridge', 'tunnel', 'walkers', 'hopper', 'relay', 'gap'],
    candy: ['spring', 'spring', 'tower', 'tower', 'hopper', 'climb', 'team', 'walkers', 'flyers', 'hill'],
    lava: ['lava', 'lava', 'hopper', 'mover', 'bridge', 'relay', 'lift', 'spikes', 'flyers', 'team'],
    beach: ['gap', 'walkers', 'spring', 'hill', 'bridge', 'team', 'hopper', 'mover', 'steps', 'climb'],
    cloud: ['flyers', 'mover', 'mover', 'lift', 'climb', 'climb', 'bridge', 'bridge', 'relay', 'team'],
  };
  const pool = (SIG[wid] || SIG.meadow).slice();
  if (w === 0 && l < 2) { for (const k of ['bridge', 'team', 'mover']) { const i = pool.indexOf(k); if (i >= 0) pool.splice(i, 1); } }
  if (w === 0 && l >= 2 && l < 4) { const i = pool.indexOf('team'); if (i >= 0) pool.splice(i, 1); }
  start();
  let last = '';
  const order = [];
  for (let i = 0; i < segs; i++) {
    let k = pick(pool);
    for (let tries = 0; tries < 6 && (k === last || ((k === 'gate' || k === 'team') && (order.includes('gate') || order.includes('team'))) || (k === 'climb' && base < 9)); tries++) k = pick(pool);
    if (k === 'climb' && base < 9) k = 'gap';
    if (i === 1 && !order.includes('gate') && !order.includes('team') && (w >= 1 || l >= 3) && rnd() < 0.5) k = pool.includes('team') ? 'team' : 'gate';
    order.push(k);
    SEG[k]();
    last = k;
    if (i % 3 === 2 && i < segs - 1) { const fx = x0(); flat(2); flags.push({ x: fx, y: base - 1 }); }
  }
  while (stars.length < 3) { const fx = x0(); flat(3); stars.push({ x: fx + 1.5, y: base - 4.4 }); cols[fx + 1][base - 1] = 'S'; springs.push({ x: fx + 1, y: base - 1 }); }
  const gx = x0();
  flat(9);
  ents.push({ k: 'goal', x: gx + 5, y: base - 1 });
  const MW = cols.length;
  const map = [];
  for (let y = 0; y < H; y++) { let r = ''; for (let x = 0; x < MW; x++) r += cols[x][y]; map.push(r); }
  let eid = 1;
  const foes = ents.filter((e) => ['grub', 'burr', 'jelly', 'buzz'].includes(e.k)).map((e) => ({ ...e, id: eid++ }));
  const movers = ents.filter((e) => e.k === 'mover' || e.k === 'lift').map((e) => ({ ...e, id: eid++ }));
  const st = ents.find((e) => e.k === 'start'), goal = ents.find((e) => e.k === 'goal');
  return {
    index, w, l, world: WORLDS[w].id, name: levelName(index), map, MW, MH: H, ice,
    start: { x: st.x + 0.5, y: st.y + 1 - R - 0.02 }, goal: { x: goal.x + 0.5, y: goal.y + 0.5 },
    coins: coins.map((c, i) => ({ id: i, x: c.x, y: c.y })), stars: stars.slice(0, 3).map((c, i) => ({ id: i, x: c.x, y: c.y })),
    flags: flags.map((f, i) => ({ id: i, x: f.x + 0.5, y: f.y + 1, start: !!f.start })), buttons, doors, springs, foes, movers, order,
    plates, plateGroups, needOf, bridgeG: Object.fromEntries(bridges.map((q) => [`${q.x},${q.y}`, q.g])),
    need: Math.min(2, Math.max(1, nPlayers || 1)),
  };
}

export function makeWorld(index, nPlayers) {
  const L = buildLevel(index, nPlayers);
  return {
    L, t: 0, clk: 0, time: 0, coins: new Set(), stars: new Set(), kills: new Set(), opened: new Set(), cps: new Set(), home: new Set(),
    deaths: 0, fx: [], out: [], parts: [], won: false, shake: 0, springT: {},
  };
}

export const atL = (L, x, y) => (y < 0 ? '.' : x < 0 || x >= L.MW ? '#' : y >= L.MH ? '.' : L.map[y][x]);
const pingpong = (v, len) => { const m = v % (2 * len); return m < len ? m : 2 * len - m; };
export function moverPos(W, m) {
  const t = W.t + W.clk;
  if (m.k === 'mover') { const len = m.x1 - m.x0; const px = m.x0 + pingpong(t * m.sp + m.ph * len * 2, len); return { x: px, y: m.y, w: m.w, h: 0.5 }; }
  const len = m.y0 - m.y1; const py = m.y0 - pingpong(t * m.sp + m.ph * len * 2, len); return { x: m.x, y: py, w: m.w, h: 0.5 };
}
export function moverVel(W, m) { const a = moverPos(W, m); const W2 = { ...W, t: W.t + 0.02 }; const b = moverPos(W2, m); return { vx: (b.x - a.x) / 0.02, vy: (b.y - a.y) / 0.02 }; }
export function foePos(W, f) {
  const t = W.t + W.clk;
  if (f.k === 'grub' || f.k === 'burr') { const len = Math.max(0.1, f.x1 - f.x0); const v = t * f.sp + f.ph * len * 2; const m = v % (2 * len); return { x: f.x0 + pingpong(v, len), y: f.y - (f.k === 'burr' ? 0.42 : 0.36), dir: m < len ? 1 : -1, r: f.k === 'burr' ? 0.42 : 0.4 }; }
  if (f.k === 'jelly') { const k = ((t / f.per + f.ph) % 1); const hop = k < 0.55 ? Math.sin(k / 0.55 * Math.PI) : 0; return { x: f.x, y: f.y - 0.4 - hop * f.hh, dir: 1, r: 0.4, hop, sq: k >= 0.55 && k < 0.7 ? 1 - (k - 0.55) / 0.15 : 0 }; }
  return { x: f.x + Math.sin(t * 0.9 * f.sp + f.ph) * f.rx, y: f.y + Math.sin(t * 2.1 + f.ph) * f.ry, dir: Math.cos(t * 0.9 * f.sp + f.ph) >= 0 ? 1 : -1, r: 0.36 };
}
export const doorOpen = (W, g) => W.opened.has(g) || (!!W.live && W.live.has(g));
export const bridgeOn = (W, x, y) => { const g = W.L.bridgeG ? W.L.bridgeG[`${x},${y}`] : null; return g != null && !!W.live && W.live.has(g); };

function closestOnPoly(px, py, pts) {
  let inside = true, best = null, bd = Infinity;
  for (let i = 0; i < pts.length; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
    const ex = bx - ax, ey = by - ay;
    const cross = ex * (py - ay) - ey * (px - ax);
    if (cross < 0) inside = false;
    const l2 = ex * ex + ey * ey;
    const t = clamp(((px - ax) * ex + (py - ay) * ey) / l2, 0, 1);
    const cx = ax + ex * t, cy = ay + ey * t, d = Math.hypot(px - cx, py - cy);
    if (d < bd) { bd = d; best = [cx, cy]; }
  }
  return { x: best[0], y: best[1], inside, d: bd };
}
function tilePoly(ch, tx, ty) {
  if (ch === '/') return [[tx, ty + 1], [tx + 1, ty + 1], [tx + 1, ty]];
  if (ch === '\\') return [[tx, ty], [tx, ty + 1], [tx + 1, ty + 1]];
  return [[tx, ty], [tx, ty + 1], [tx + 1, ty + 1], [tx + 1, ty]];
}
function pushOut(b, cx, cy, inside, d, r) {
  let nx, ny;
  if (inside) { nx = cx - b.x; ny = cy - b.y; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l; b.x = cx + nx * r; b.y = cy + ny * r; }
  else { nx = (b.x - cx) / (d || 1); ny = (b.y - cy) / (d || 1); b.x = cx + nx * r; b.y = cy + ny * r; }
  const vn = b.vx * nx + b.vy * ny;
  if (vn < 0) { b.vx -= vn * nx * (ny < -0.5 ? 1 : 1.0); b.vy -= vn * ny; if (ny > 0.5 && vn < -2) b.bonk = true; }
  if (ny < -0.45) { b.ground = true; b.gnx = nx; b.gny = ny; }
  return { nx, ny };
}

export function mkBall(kind, x, y) { return { kind, x, y, vx: 0, vy: 0, a: 0, ground: false, coy: 0, buf: 0, jumpHeld: false, dead: 0, home: false, cp: { x, y }, sq: 0, look: 1, blink: 2, onIce: false, carry: null, landV: 0, jumped: false, bonk: false, air2: true }; }

export const PHYS = { acc: 38, air: 27, max: 7.4, fric: 32, airFric: 7, g: 34, jump: 15, jump2: 12.6, spring: 22, term: 19 };

export function stepBall(W, b, input, dt, others) {
  const L = W.L;
  if (b.home) return;
  if (b.dead > 0) { b.dead -= dt; if (b.dead <= 0) { b.x = b.cp.x; b.y = b.cp.y; b.vx = 0; b.vy = 0; b.dead = 0; b.spawn = 0.8; W.fx.push({ k: 'spawn', who: b.kind }); } return; }
  if (b.spawn > 0) b.spawn -= dt;
  const P = PHYS;
  const ix = input ? input.x || 0 : 0;
  const onIce = b.ground && b.onIce;
  const acc = b.ground ? (onIce ? 9 : P.acc) : P.air;
  if (ix) { b.vx += ix * acc * dt; if (Math.sign(ix) !== Math.sign(b.vx) && !onIce) b.vx += ix * acc * 0.9 * dt; b.look = ix > 0 ? 1 : -1; }
  else { const slope = b.ground && b.gny != null && b.gny > -0.97; const f = (b.ground ? (onIce || slope ? 1.2 : P.fric) : P.airFric) * dt; if (Math.abs(b.vx) <= f) b.vx = 0; else b.vx -= Math.sign(b.vx) * f; }
  b.vx = clamp(b.vx, -P.max * (onIce ? 1.15 : 1), P.max * (onIce ? 1.15 : 1));
  if (input && input.jump && !b.jumpHeld) b.buf = 0.13;
  b.jumpHeld = !!(input && input.jump);
  if (b.buf > 0) b.buf -= dt;
  if (b.ground) b.coy = 0.1; else if (b.coy > 0) b.coy -= dt;
  if (b.buf > 0 && b.coy > 0) { b.vy = -P.jump; b.buf = 0; b.coy = 0; b.jumped = true; b.carry = null; W.fx.push({ k: 'jump', who: b.kind, x: b.x, y: b.y }); }
  else if (b.buf > 0 && b.coy <= 0 && !b.ground && b.air2 && b.vy > -P.jump * 0.55) { b.vy = -P.jump2; b.buf = 0; b.air2 = false; b.jumped = true; b.sq = 0.5; W.fx.push({ k: 'jump2', who: b.kind, x: b.x, y: b.y + R }); }
  if (!b.jumpHeld && b.vy < -5 && b.jumped) b.vy *= Math.pow(0.0005, dt);
  const uphill = b.ground && b.gny != null && b.gny > -0.97 && ix * -b.gnx > 0;
  b.vy = Math.min(P.term, b.vy + P.g * (uphill ? 0.3 : 1) * dt);
  if (b.carry) { const mv = L.movers.find((m) => m.id === b.carry); if (mv) { const v = moverVel(W, mv); b.x += v.vx * dt; if (v.vy < 0) b.y += v.vy * dt; } }
  const wasGround = b.ground;
  const vyBefore = b.vy;
  b.ground = false; b.gny = null; b.carry = null; b.onIce = false; b.bonk = false;
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(b.vx), Math.abs(b.vy)) * dt / 0.18));
  const prevY = b.y;
  for (let s = 0; s < steps; s++) {
    b.x += b.vx * dt / steps; b.y += b.vy * dt / steps;
    const x0 = Math.floor(b.x - R), x1 = Math.floor(b.x + R), y0 = Math.floor(b.y - R), y1 = Math.floor(b.y + R);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      const ch = atL(L, tx, ty);
      if (ch === '-') {
        if (b.vy < 0 || prevY + R > ty + 0.08 + 0.02) continue;
        if (b.y + R > ty && b.x > tx - 0.3 && b.x < tx + 1.3 && b.y < ty + 0.3) { b.y = ty - R; b.vy = Math.min(0, b.vy); b.ground = true; b.gnx = 0; b.gny = -1; }
        continue;
      }
      if (ch === 'D') { const d = L.doors.find((q) => q.x === tx); if (d && doorOpen(W, d.g)) continue; }
      if (ch === 'H') { if (!bridgeOn(W, tx, ty)) continue; if (b.vy < -0.5 && b.y > ty + 0.5) continue; }
      if (!solidCh(ch)) continue;
      const c = closestOnPoly(b.x, b.y, tilePoly(ch, tx, ty));
      if (!c.inside && c.d >= R) continue;
      if (!c.inside) {
        if (ch === '#' || ch === 'I' || ch === '=' || ch === 'D' || ch === 'H') {
          if (c.y === ty && atL(L, tx, ty - 1) === '/' && b.x < tx + 1) continue;
          if (c.y === ty && atL(L, tx, ty - 1) === '\\' && b.x > tx) continue;
        }
      }
      const n = pushOut(b, c.x, c.y, c.inside, c.d, R);
      if (n.ny < -0.45 && ch === 'I') b.onIce = true;
    }
    for (const m of L.movers) {
      const p = moverPos(W, m);
      const pts = [[p.x, p.y], [p.x, p.y + p.h], [p.x + p.w, p.y + p.h], [p.x + p.w, p.y]];
      const c = closestOnPoly(b.x, b.y, pts);
      if (!c.inside && c.d >= R) continue;
      const n = pushOut(b, c.x, c.y, c.inside, c.d, R);
      if (n.ny < -0.45) b.carry = m.id;
    }
    for (const o of others || []) {
      if (!o || o.dead > 0 || o.home) continue;
      const dx = b.x - o.x, dy = b.y - o.y, d = Math.hypot(dx, dy);
      if (d >= R * 2 || d < 1e-4) continue;
      pushOut(b, o.x + dx / d * R, o.y + dy / d * R, false, R, R);
    }
  }
  if (b.ground) b.air2 = true;
  if (b.ground && !wasGround) { b.jumped = false; b.landV = vyBefore; if (vyBefore > 6) { b.sq = Math.min(1, vyBefore / 20); W.fx.push({ k: 'land', who: b.kind, x: b.x, y: b.y + R, v: vyBefore }); } }
  if (b.bonk) W.fx.push({ k: 'bonk', who: b.kind, x: b.x, y: b.y - R });
  if (b.sq > 0) b.sq = Math.max(0, b.sq - dt * 5);
  b.a += b.vx * dt / R;
  b.blink -= dt;
  if (b.blink < -0.12) b.blink = 2 + Math.random() * 3;
  const tx = Math.floor(b.x), ty = Math.floor(b.y + R + 0.05);
  for (const sp of L.springs) { if (Math.abs(b.x - (sp.x + 0.5)) < 0.6 && b.y + R > sp.y + 0.3 && b.y + R < sp.y + 1.08 && b.vy >= -1) { b.vy = -PHYS.spring; b.jumped = false; b.air2 = true; W.springT[`${sp.x},${sp.y}`] = 0.35; W.fx.push({ k: 'spring', who: b.kind, x: sp.x + 0.5, y: sp.y + 0.6 }); } }
  void tx; void ty;
  const hit = (x, y) => atL(L, Math.floor(x), Math.floor(y));
  if (b.y > L.MH + 2) return die(W, b, 'fall');
  if (b.spawn > 0) return null;
  const bot = hit(b.x, b.y + R * 0.75), bl = hit(b.x - R * 0.6, b.y + R * 0.7), br = hit(b.x + R * 0.6, b.y + R * 0.7);
  if ((bot === '^' || bl === '^' || br === '^') && b.y + R > Math.floor(b.y + R * 0.75) + 0.45) return die(W, b, 'spike');
  if (hit(b.x, b.y + R * 0.5) === 'L' || hit(b.x, b.y) === 'L') return die(W, b, 'lava');
  return null;
}
function die(W, b, why) {
  if (b.dead > 0 || b.home) return null;
  b.dead = 1.1; b.vx = 0; b.vy = 0;
  W.fx.push({ k: 'die', who: b.kind, x: b.x, y: b.y, why });
  return why;
}
export function killBall(W, b, why) { return die(W, b, why); }

export function interact(W, b, emit) {
  const L = W.L;
  if (b.dead > 0 || b.home) return;
  for (const c of L.coins) if (!W.coins.has(c.id) && Math.hypot(b.x - c.x, b.y - c.y) < R + 0.3) emit({ k: 'coin', id: c.id, who: b.kind });
  for (const s of L.stars) if (!W.stars.has(s.id) && Math.hypot(b.x - s.x, b.y - s.y) < R + 0.45) emit({ k: 'star', id: s.id, who: b.kind });
  for (const f of L.flags) if (!f.start && Math.abs(b.x - f.x) < 0.7 && Math.abs(b.y - (f.y - 0.6)) < 1.2 && b.cp.x !== f.x) { b.cp = { x: f.x, y: f.y - R - 0.05 }; emit({ k: 'cp', id: f.id, who: b.kind }); }
  for (const f of L.foes) {
    if (W.kills.has(f.id)) continue;
    const p = foePos(W, f);
    const d = Math.hypot(b.x - p.x, b.y - p.y);
    if (d > R + p.r) continue;
    if (f.k !== 'burr' && b.vy > 1 && b.y < p.y - 0.15) { emit({ k: 'kill', id: f.id, who: b.kind }); b.vy = -10.5; b.jumped = true; b.jumpHeld = true; continue; }
    if (b.spawn > 0) continue;
    die(W, b, 'foe');
    return;
  }
  if (Math.abs(b.x - L.goal.x) < 0.8 && Math.abs(b.y - L.goal.y) < 1.1) emit({ k: 'home', who: b.kind });
}

export function pressedButtons(W, balls) {
  const L = W.L;
  const out = new Set();
  for (const bt of L.buttons) for (const b of balls) { if (!b || b.dead > 0 || b.home) continue; if (Math.abs(b.x - (bt.x + 0.5)) < 0.62 && Math.abs(b.y + R - (bt.y + 0.85)) < 0.35) out.add(`${bt.x},${bt.y}`); }
  return out;
}
export function gatesToOpen(W, pressed) {
  const L = W.L;
  const out = [];
  const groups = new Set(L.buttons.map((b) => b.g));
  for (const g of groups) { if (W.opened.has(g)) continue; const n = L.buttons.filter((b) => b.g === g && pressed.has(`${b.x},${b.y}`)).length; const need = L.needOf && L.needOf[g] ? Math.min(L.needOf[g], Math.max(1, W.active || L.needOf[g])) : L.need; if (n >= need) out.push(g); }
  return out;
}

export function stepPlates(W, balls, dt) {
  const L = W.L;
  W.moved = W.moved || {};
  let act = 0;
  for (const b of balls) {
    if (!b || b.home) continue;
    const m = W.moved[b.kind];
    if (!m || Math.hypot(b.x - m.x, b.y - m.y) > 0.4) W.moved[b.kind] = { x: b.x, y: b.y, t: W.t };
    if (W.t - W.moved[b.kind].t < 15) act += 1;
  }
  W.active = Math.max(1, act);
  if (!L.plates || !L.plates.length) { W.live = null; return; }
  W.holdT = W.holdT || {};
  const on = new Set();
  for (const p of L.plates) for (const b of balls) {
    if (!b || b.dead > 0 || b.home) continue;
    if (Math.abs(b.x - (p.x + 0.5)) < 0.66 && Math.abs(b.y + R - (p.y + 0.85)) < 0.42) on.add(p.g);
  }
  W.plateOn = on;
  const keep = W.active > 1 ? 0.45 : 2.8;
  const live = new Set();
  for (const g of L.plateGroups) {
    if (on.has(g)) W.holdT[g] = keep;
    else W.holdT[g] = Math.max(0, (W.holdT[g] || 0) - dt);
    if (W.holdT[g] > 0) live.add(g);
  }
  W.live = live;
}

export function applyEvent(W, e) {
  switch (e.k) {
    case 'coin': if (W.coins.has(e.id)) return false; W.coins.add(e.id); W.fx.push({ k: 'coin', id: e.id, who: e.who }); return true;
    case 'star': if (W.stars.has(e.id)) return false; W.stars.add(e.id); W.fx.push({ k: 'star', id: e.id, who: e.who }); return true;
    case 'kill': if (W.kills.has(e.id)) return false; W.kills.add(e.id); W.fx.push({ k: 'stomp', id: e.id, who: e.who }); return true;
    case 'door': if (W.opened.has(e.g)) return false; W.opened.add(e.g); W.fx.push({ k: 'door', g: e.g }); return true;
    case 'cp': W.cps.add(`${e.id}:${e.who}`); W.fx.push({ k: 'cp', id: e.id, who: e.who }); return true;
    case 'home': if (W.home.has(e.who)) return false; W.home.add(e.who); W.fx.push({ k: 'home', who: e.who }); return true;
    default: return false;
  }
}

export function demoWorld(index, n) {
  const W = makeWorld(index, n);
  W.demo = true;
  W.live = new Set(W.L.plateGroups || []);
  for (const d of W.L.doors) W.opened.add(d.g);
  W.doorAmt = {}; for (const d of W.L.doors) W.doorAmt[d.g] = 1;
  W.bridgeAmt = {}; for (const g of W.L.plateGroups || []) W.bridgeAmt[g] = 1;
  return W;
}
export function botInput(W, b, mem, dt, others) {
  const L = W.L;
  if (b.dead > 0 || b.home) { mem.hold = 0; mem.prev = false; return { x: 0, jump: false }; }
  if (mem.bx == null || b.x > mem.bx + 0.35) { mem.bx = b.x; mem.stuck = 0; } else mem.stuck = (mem.stuck || 0) + dt;
  const sol = (x, y) => { const ch = atL(L, Math.floor(x), Math.floor(y)); if (ch === 'D') return !W.opened.has((L.doors.find((q) => q.x === Math.floor(x)) || {}).g); if (ch === 'H') return !bridgeOn(W, Math.floor(x), Math.floor(y)); return solidCh(ch) && ch !== '/'; };
  const feet = b.y + R;
  const support = (x) => { for (let y = Math.floor(feet + 0.05); y < Math.min(L.MH, Math.floor(feet) + 5); y++) { const ch = atL(L, Math.floor(x), y); if (ch === '^' || ch === 'L') return false; if (solidCh(ch) || ch === '-' || (ch === 'H' && bridgeOn(W, Math.floor(x), y))) return true; } for (const m of L.movers) { const p = moverPos(W, m); if (x > p.x - 0.1 && x < p.x + p.w + 0.1 && p.y > feet - 0.6 && p.y < feet + 4) return true; } return false; };
  const hazard = (x) => { const a = atL(L, Math.floor(x), Math.floor(feet - 0.3)), c = atL(L, Math.floor(x), Math.floor(feet + 0.3)); return a === '^' || c === '^' || a === 'L' || c === 'L'; };
  const hold = (x) => { mem.prev = false; mem.hold = 0; return { x, jump: false }; };
  const os = (others || []).filter((o) => o && !(o.dead > 0) && !o.home);
  const lift = L.movers.find((m) => m.k === 'lift' && m.x > b.x - 2.2 && m.x < b.x + 4.6);
  if (lift) {
    const p = moverPos(W, lift);
    const vy = moverVel(W, lift).vy;
    if (b.carry === lift.id) { if (p.y > lift.y1 + 0.2) return hold(0); }
    else if (b.x > lift.x - 0.1 && b.x < lift.x + lift.w + 0.1 && feet > lift.y0 + 0.4) { mem.prev = !mem.prev; return { x: -1, jump: mem.prev }; }
    else if (b.ground && b.x < lift.x + 0.2) {
      const riders = os.filter((o) => o.carry === lift.id || (o.x > lift.x - 0.6 && o.x < lift.x + lift.w + 0.2 && o.y < feet)).length;
      const soon = (vy > 0.2 && p.y > feet - 1.1) || Math.abs(p.y - feet) < 0.25;
      if (!soon || riders >= 2) return hold(b.x < lift.x - 0.8 - riders * 0.2 ? 0.4 : 0);
      if (b.x > lift.x - 0.75 && !mem.prev) { mem.prev = true; return { x: 1, jump: true }; }
      mem.prev = false;
      return { x: 1, jump: false };
    }
  }
  if (b.ground) for (const o of os) { const dx = o.x - b.x; if (dx > 0.2 && dx < 1.15 && Math.abs(o.y - b.y) < 0.7 && o.vx < 2.5 && o.ground) return hold(0); }
  const wallAt = (x) => sol(x, feet - 0.5) && sol(x, feet - 2.4) && sol(x, feet - 3.4);
  let tall = false;
  for (let dx = R + 0.3; dx < R + 4.6; dx += 0.5) { if (sol(b.x + dx, feet - 0.5)) { tall = wallAt(b.x + dx); break; } if (!b.ground && !b.carry) break; }
  if (tall) {
    let best = null;
    for (let y = Math.floor(feet - (b.ground || b.carry ? 3.4 : 4.4)); y <= Math.floor(feet - (b.ground || b.carry ? 1 : -0.6)); y++) for (let x = Math.floor(b.x - 5); x <= Math.floor(b.x + 1.2); x++) { if (atL(L, x, y) !== '-' || y > feet - 0.5) continue; const d = Math.abs(x + 0.5 - b.x) * 0.4 + (y - (feet - 3.4)) * 0.3; if (!best || d < best.d) best = { x: x + 0.5, y, d }; }
    if (best) {
      const dx = best.x - b.x;
      if (b.ground || b.carry) {
        if (Math.abs(dx) > 0.5) return hold(Math.sign(dx) * Math.min(1, Math.abs(dx)));
        if (!mem.prev) mem.hold = 0.34;
        const j = mem.hold > 0; mem.hold -= dt; mem.prev = j;
        return { x: 0, jump: j };
      }
      const j = (mem.hold || 0) > 0; mem.hold = (mem.hold || 0) - dt; mem.prev = j;
      return { x: Math.abs(dx) > 0.25 ? Math.sign(dx) : 0, jump: j };
    }
  }
  let want = false;
  if (b.ground) {
    if (sol(b.x + R + 0.3, b.y) || sol(b.x + R + 0.3, b.y - 0.6)) want = true;
    for (let dx = 0.5; dx <= 1.7 && !want; dx += 0.4) if (hazard(b.x + dx)) want = true;
    if (!want && !support(b.x + 0.75 + Math.max(0, b.vx) * 0.06)) want = true;
    if (!want) for (const f of L.foes) { if (W.kills.has(f.id)) continue; const p = foePos(W, f); if (p.x > b.x - 0.2 && p.x - b.x < 2.1 + Math.max(0, b.vx) * 0.12 && Math.abs(p.y - b.y) < 1.6) { want = true; break; } }
    if (mem.stuck > 0.45) want = true;
  }
  if (want && (mem.hold || 0) <= 0 && !mem.prev) mem.hold = 0.3 + (mem.seed || 0) * 0.06;
  let jump = (mem.hold || 0) > 0;
  mem.hold = (mem.hold || 0) - dt;
  if (!b.ground && !jump && b.air2 && b.vy > 0.5 && !support(b.x + 0.4) && !support(b.x + 1.4) && !mem.prev) jump = true;
  if (!b.ground && b.air2 && mem.stuck > 0.45 && b.vy > -2 && !mem.prev) jump = true;
  mem.prev = jump;
  const back = b.x > L.goal.x + 0.2 && b.ground;
  return { x: back ? -1 : mem.stuck > 0.2 && mem.stuck < 0.32 ? -1 : 1, jump: back ? false : jump };
}
export function demoStarts(L) {
  return [{ x: L.start.x, y: L.start.y }].concat(L.flags.filter((f) => !f.start).map((f) => ({ x: f.x, y: f.y - R - 0.05 })));
}
export function demoSetup(index, si, n) {
  const W = demoWorld(index, n);
  const st = demoStarts(W.L)[si] || demoStarts(W.L)[0];
  const balls = [], mems = [];
  for (let i = 0; i < n; i++) { const b = mkBall(`d${i}`, st.x - i * 0.95, st.y); b.cp = { x: st.x - i * 0.95, y: st.y }; balls.push(b); mems.push({ seed: i / n }); }
  return { W, balls, mems, si, t: 0, lead: st.x, leadAt: 0, dead: 0, home: false };
}
export const DEMO_DT = 1 / 60;
export function demoStep(S) {
  const W = S.W, dt = DEMO_DT;
  S.t += dt; W.t += dt;
  for (let i = 0; i < S.balls.length; i++) {
    const b = S.balls[i];
    const was = b.dead > 0;
    const os = S.balls.filter((o) => o !== b);
    stepBall(W, b, botInput(W, b, S.mems[i], dt, os), dt, os);
    interact(W, b, (e) => { applyEvent(W, e); if (e.k === 'home') { b.home = true; S.home = true; } });
    if (!was && b.dead > 0) S.dead += 1;
  }
  let mx = -1e9;
  for (const b of S.balls) if (b.x > mx) mx = b.x;
  if (mx > S.lead + 0.5) { S.lead = mx; S.leadAt = S.t; }
}
export function clipStart(index, si, n, cap) { return { S: demoSetup(index, si, n), cap: cap || 16, len: null }; }
export function clipRun(P, steps) {
  const S = P.S;
  for (let k = 0; k < steps && P.len == null; k++) {
    demoStep(S);
    S.W.fx.length = 0;
    if (S.dead > 2) P.len = Math.max(0, S.t - 0.35);
    else if (S.t - S.leadAt > 1.1) P.len = Math.max(0, S.leadAt + 0.5);
    else if (S.home) P.len = S.t + 1.2;
    else if (S.t >= P.cap) P.len = P.cap;
  }
  return P.len;
}
export function demoClip(index, si, n, maxT) { const P = clipStart(index, si, n, maxT); while (clipRun(P, 600) == null); return P.len; }
