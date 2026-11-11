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

const SOLID = new Set(['#', '=', 'D', '/', '\\', 'I']);
export const solidCh = (ch) => SOLID.has(ch);

export function buildLevel(index, nPlayers) {
  const { w, l } = levelOf(index);
  const rnd = rngOf(`roll:${index}`);
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const diff = w * 0.55 + l * 0.18;
  const segs = 7 + Math.min(7, Math.floor(w * 1.2 + l * 0.6));
  const cols = [];
  const ents = [];
  const coins = [];
  const stars = [];
  const flags = [];
  const buttons = [];
  const doors = [];
  const springs = [];
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
  };
  const pool = ['gap', 'hill', 'steps', 'spikes', 'walkers', 'spring', 'mover', 'tunnel'];
  if (w >= 1 || l >= 2) pool.push('hopper', 'flyers', 'tower');
  if (w >= 1 || l >= 3) pool.push('lift', 'gate');
  const wid = WORLDS[w].id;
  if (w >= 3 && wid !== 'candy') pool.push('lava', 'lava');
  if (wid === 'lava') pool.push('lava', 'hopper');
  if (wid === 'candy') pool.push('spring', 'spring', 'tower', 'flyers');
  if (w === 2) pool.push('ice', 'ice');
  if (l === 0 && w === 0) pool.splice(pool.indexOf('mover'), 1);
  start();
  let last = '';
  const order = [];
  for (let i = 0; i < segs; i++) {
    let k = pick(pool);
    for (let tries = 0; tries < 5 && (k === last || (k === 'gate' && order.includes('gate'))); tries++) k = pick(pool);
    if (i === 1 && !order.includes('gate') && (w >= 1 || l >= 3) && rnd() < 0.5) k = 'gate';
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
export const doorOpen = (W, g) => W.opened.has(g);

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
      if (!solidCh(ch)) continue;
      const c = closestOnPoly(b.x, b.y, tilePoly(ch, tx, ty));
      if (!c.inside && c.d >= R) continue;
      if (!c.inside) {
        if (ch === '#' || ch === 'I' || ch === '=' || ch === 'D') {
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
  for (const g of groups) { if (W.opened.has(g)) continue; const n = L.buttons.filter((b) => b.g === g && pressed.has(`${b.x},${b.y}`)).length; if (n >= L.need) out.push(g); }
  return out;
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
