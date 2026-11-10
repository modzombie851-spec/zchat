export const TARGET = 1000;
export const ROUND_T = 240;
export const LIVES = 3;
export const WW = 26;
export const WH = 36;
export const FLOOR = WH - 1.3;
export const PK_KINDS = ['shield', 'double', 'magnet', 'speed'];
export const PK_TIME = { shield: 6, double: 8, magnet: 6, speed: 6 };
const TAU = Math.PI * 2;
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const rOf = (n) => 0.3 + 0.28 * Math.cbrt(Math.max(1, n));
export const speedOf = (n) => 3.45 - 0.33 * Math.log10(Math.max(1, n));
export function rngOf(seed) {
  let a = 0;
  const s = String(seed);
  for (let i = 0; i < s.length; i++) a = (Math.imul(a ^ s.charCodeAt(i), 2654435761) + i) | 0;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const angLerp = (a, b, k) => { let d = ((b - a + Math.PI) % TAU + TAU) % TAU - Math.PI; return a + d * k; };

export function mkPl(kind) {
  return { kind, x: kind === 'sun' ? WW * 0.32 : WW * 0.68, y: WH * 0.5, vx: 0, vy: 0, a: kind === 'sun' ? 0 : Math.PI, n: 2, lives: LIVES, dead: 0, prot: 2.5, dashT: 0, dashCd: 0, fx: { shield: 0, double: 0, magnet: 0, speed: 0 }, eat: 0, hurt: 0, nb: null, tp: 0 };
}

export function makeGame(seed, opts) {
  const o = opts || {};
  const G = {
    seed: String(seed), rng: rngOf(seed), t: 0, left: o.time || ROUND_T, fish: [], pk: [], nextId: 1, seq: 0,
    pl: { sun: mkPl('sun'), moon: mkPl('moon') }, events: [], log: [], over: null, acks: [], spawnT: 0, pkT: 7, deco: null, bot: !!o.bot,
  };
  for (let i = 0; i < 30; i++) spawnFish(G, true);
  return G;
}

function refN(G) {
  const ns = ['sun', 'moon'].map((k) => G.pl[k]).filter((p) => p.dead <= 0).map((p) => p.n);
  return ns.length ? Math.min(...ns) : 2;
}
function pickN(G) {
  const ns = ['sun', 'moon'].map((k) => G.pl[k]).filter((p) => p.dead <= 0).map((p) => p.n);
  if (!ns.length) return 2;
  return ns[Math.floor(G.rng() * ns.length)];
}
function farFromPlayers(G, x, y, d) { return ['sun', 'moon'].every((k) => { const p = G.pl[k]; return Math.hypot(p.x - x, p.y - y) > d + rOf(p.n); }); }

export function spawnFish(G, initial) {
  const R = G.rng, nr = initial ? 2 : pickN(G);
  const hunters = G.fish.filter((f) => f.k === 'h').length;
  const roll = R();
  let k = 'p', n;
  const maxH = nr > 120 ? 4 : 3;
  if (!initial && roll < 0.17 && hunters < maxH) { k = 'h'; n = Math.round(Math.max(nr * 1.8, nr + 6) + R() * nr * 2.2); }
  else if (roll < 0.3) n = Math.max(1, Math.round(nr * (0.9 + R() * 0.5)));
  else n = Math.max(1, Math.round(1 + (nr * 0.72) * Math.pow(R(), 1.7)));
  if (initial && k === 'p') n = Math.max(1, Math.min(n, 1 + Math.floor(R() * 3)));
  let x, y, tries = 0;
  do {
    if (!initial && R() < 0.6) { x = R() < 0.5 ? -1 : WW + 1; y = 2.5 + R() * (FLOOR - 4); }
    else { x = 1 + R() * (WW - 2); y = 2 + R() * (FLOOR - 3.5); }
    tries++;
  } while (!farFromPlayers(G, x, y, k === 'h' ? 9 : 5) && tries < 12);
  const a = x < 0 ? 0 : x > WW ? Math.PI : R() * TAU;
  const f = { id: G.nextId++, n, k, x, y, a, v: k === 'h' ? 1.2 : 1.1 + R() * 1.0, sp: Math.floor(R() * 6), tt: 1 + R() * 3, chase: 0, cool: 0, ch: null, flee: 0, born: G.t };
  G.fish.push(f);
  return f;
}
function spawnPk(G) {
  const R = G.rng;
  let x, y, tries = 0;
  do { x = 2 + R() * (WW - 4); y = 3 + R() * (FLOOR - 6); tries++; } while (!farFromPlayers(G, x, y, 4) && tries < 10);
  G.pk.push({ id: G.nextId++, k: PK_KINDS[Math.floor(R() * PK_KINDS.length)], x, y, life: 16 });
}

function ev(G, e) { G.seq += 1; const x = { ...e, s: G.seq }; G.events.push(x); G.log.push(x); if (G.log.length > 24) G.log.shift(); }

export function movePlayer(G, p, input, dt) {
  if (p.dead > 0) { p.vx *= 0.9; p.vy *= 0.9; return; }
  const ix = input ? input.x || 0 : 0, iy = input ? input.y || 0 : 0;
  if (input && input.dash && p.dashCd <= 0) { p.dashT = 0.42; p.dashCd = 3; p.dashFx = 1; }
  const top = speedOf(p.n) * (p.fx.speed > 0 ? 1.35 : 1) * (p.dashT > 0 ? 2.1 : 1);
  const k = 1 - Math.exp(-dt * (p.dashT > 0 ? 10 : 5.5));
  p.vx += (ix * top - p.vx) * k; p.vy += (iy * top - p.vy) * k;
  if (p.dashT > 0 && Math.hypot(ix, iy) < 0.1) { p.vx += Math.cos(p.a) * top * k; p.vy += Math.sin(p.a) * top * k; }
  p.x += p.vx * dt; p.y += p.vy * dt;
  const r = rOf(p.n);
  p.x = clamp(p.x, r * 0.6, WW - r * 0.6); p.y = clamp(p.y, 1 + r * 0.6, FLOOR - r * 0.5);
  const sp = Math.hypot(p.vx, p.vy);
  if (sp > 0.25) p.a = angLerp(p.a, Math.atan2(p.vy, p.vx), 1 - Math.exp(-dt * 9));
}
export function tickPlayer(p, dt) {
  if (p.dashT > 0) p.dashT -= dt;
  if (p.dashCd > 0) p.dashCd -= dt;
  if (p.prot > 0) p.prot -= dt;
  if (p.eat > 0) p.eat -= dt;
  if (p.hurt > 0) p.hurt -= dt;
  for (const k of PK_KINDS) if (p.fx[k] > 0) p.fx[k] = Math.max(0, p.fx[k] - dt);
}
export const safe = (p) => p.prot > 0 || p.fx.shield > 0;

function steerFish(G, f, dt) {
  const R = G.rng;
  let tx = Math.cos(f.a), ty = Math.sin(f.a), sp = f.v;
  f.tt -= dt;
  if (f.tt <= 0) { f.tt = 1.5 + R() * 2.5; f.a += (R() - 0.5) * 1.6; tx = Math.cos(f.a); ty = Math.sin(f.a); }
  const live = ['sun', 'moon'].map((k) => G.pl[k]).filter((p) => p.dead <= 0);
  if (f.k === 'h') {
    if (f.cool > 0) f.cool -= dt;
    if (f.chase > 0) {
      f.chase -= dt;
      const p = G.pl[f.ch];
      if (!p || p.dead > 0 || safe(p) || p.n >= f.n) f.chase = 0;
      else { const dx = p.x - f.x, dy = p.y - f.y, d = Math.hypot(dx, dy) || 1; tx = dx / d; ty = dy / d; sp = Math.min(3.05, speedOf(p.n) * 0.93); }
      if (f.chase <= 0) { f.cool = 3.6; f.a += Math.PI; tx = Math.cos(f.a); ty = Math.sin(f.a); }
    } else if (f.cool <= 0) {
      let best = null, bd = 5.2;
      for (const p of live) { if (p.n >= f.n || safe(p)) continue; const d = Math.hypot(p.x - f.x, p.y - f.y) - rOf(p.n); if (d < bd) { bd = d; best = p; } }
      if (best) { f.chase = 2.3; f.ch = best.kind; ev(G, { k: 'hunt', id: f.id, who: best.kind }); }
    }
  } else {
    let threat = null, td = 3.4;
    for (const p of live) { if (p.n < f.n) continue; const d = Math.hypot(p.x - f.x, p.y - f.y) - rOf(p.n); if (d < td) { td = d; threat = p; } }
    for (const p of live) {
      if (p.fx.magnet > 0 && p.n >= f.n) { const dx = p.x - f.x, dy = p.y - f.y, d = Math.hypot(dx, dy); if (d < 5.5) { tx = dx / (d || 1); ty = dy / (d || 1); sp = 2.2; threat = null; } }
    }
    if (threat) { const dx = f.x - threat.x, dy = f.y - threat.y, d = Math.hypot(dx, dy) || 1; tx = dx / d; ty = dy / d; sp = f.v * 1.35; f.flee = 0.3; }
  }
  const m = 1.4;
  if (f.x < m && f.x >= 0) tx += (m - f.x) * 0.8; if (f.x > WW - m && f.x <= WW) tx -= (f.x - (WW - m)) * 0.8;
  if (f.y < 1.5 + m) ty += (1.5 + m - f.y) * 0.8; if (f.y > FLOOR - m) ty -= (f.y - (FLOOR - m)) * 0.8;
  if (f.x < 0) tx = 1; if (f.x > WW) tx = -1;
  const want = Math.atan2(ty, tx);
  f.a = angLerp(f.a, want, 1 - Math.exp(-dt * (f.chase > 0 ? 5 : 2.6)));
  f.x += Math.cos(f.a) * sp * dt; f.y += Math.sin(f.a) * sp * dt;
  f.y = clamp(f.y, 1.2, FLOOR - 0.3);
}

function killPlayer(G, p, by, killer) {
  if (p.dead > 0) return;
  p.dead = 1.7; p.lives -= 1; p.hurt = 0.6;
  ev(G, { k: 'die', who: p.kind, by, x: p.x, y: p.y, n: p.n, kn: killer ? killer.n : 0 });
  if (p.lives <= 0 && !G.over) { const other = p.kind === 'sun' ? 'moon' : 'sun'; G.over = { w: other === 'sun' ? 'x' : 'o', why: 'lives' }; ev(G, { k: 'over', w: G.over.w, why: 'lives' }); }
}
function respawn(G, p) {
  const R = G.rng;
  let best = null, bs = -1;
  for (let i = 0; i < 10; i++) {
    const x = 2 + R() * (WW - 4), y = 3 + R() * (FLOOR - 6);
    let sc = 99;
    for (const f of G.fish) if (f.n > p.n) sc = Math.min(sc, Math.hypot(f.x - x, f.y - y) - rOf(f.n));
    const o = G.pl[p.kind === 'sun' ? 'moon' : 'sun'];
    if (o.dead <= 0) sc = Math.min(sc, Math.hypot(o.x - x, o.y - y) - rOf(o.n));
    if (sc > bs) { bs = sc; best = [x, y]; }
  }
  p.x = best[0]; p.y = best[1]; p.vx = p.vy = 0; p.dead = 0; p.prot = 2.6; p.n = Math.max(2, Math.floor(p.n / 2)); p.tp += 1;
  if (p.nb) p.nb.buf.length = 0;
  for (const k of PK_KINDS) p.fx[k] = 0;
  ev(G, { k: 'spawn', who: p.kind });
}
export function eatFish(G, p, f) {
  const i = G.fish.indexOf(f);
  if (i < 0) return false;
  G.fish.splice(i, 1);
  const gain = f.n * (p.fx.double > 0 ? 2 : 1);
  p.n += gain; p.eat = 0.28;
  ev(G, { k: 'eat', who: p.kind, id: f.id, gain, x: f.x, y: f.y, h: f.k === 'h' ? 1 : 0 });
  return true;
}
export function takePk(G, p, pk) {
  const i = G.pk.indexOf(pk);
  if (i < 0) return false;
  G.pk.splice(i, 1);
  p.fx[pk.k] = PK_TIME[pk.k];
  ev(G, { k: 'pick', who: p.kind, id: pk.id, kind: pk.k, x: pk.x, y: pk.y });
  return true;
}
export const canEat = (p, f) => p.dead <= 0 && f.n <= p.n && Math.hypot(p.x - f.x, p.y - f.y) < rOf(p.n) * 0.85 + rOf(f.n) * 0.35;
export const canTake = (p, pk) => p.dead <= 0 && Math.hypot(p.x - pk.x, p.y - pk.y) < rOf(p.n) * 0.8 + 0.45;

export function hostStep(G, dt, ctl) {
  if (G.over) return;
  G.t += dt;
  G.left = Math.max(0, G.left - dt);
  for (const k of ['sun', 'moon']) {
    const p = G.pl[k];
    if (ctl.local.has(k)) movePlayer(G, p, ctl.inputs[k], dt);
    tickPlayer(p, dt);
    if (p.dead > 0) { p.dead -= dt; if (p.dead <= 0) { if (p.lives > 0) respawn(G, p); else p.dead = 0.001; } }
  }
  for (const f of G.fish) steerFish(G, f, dt);
  G.fish = G.fish.filter((f) => f.x > -3 && f.x < WW + 3);
  const nr = refN(G);
  G.spawnT -= dt;
  if (G.spawnT <= 0) {
    G.spawnT = 0.5;
    const prey = G.fish.filter((f) => f.k !== 'h').length;
    if (prey < 30 || G.fish.length < 34) spawnFish(G, false);
    const stale = G.fish.find((f) => f.k !== 'h' && f.n < nr * 0.04 && farFromPlayers(G, f.x, f.y, 9));
    if (stale) G.fish.splice(G.fish.indexOf(stale), 1);
  }
  G.pkT -= dt;
  if (G.pkT <= 0) { G.pkT = 8 + G.rng() * 6; if (G.pk.length < 2) spawnPk(G); }
  for (const pk of G.pk) pk.life -= dt;
  G.pk = G.pk.filter((pk) => pk.life > 0);
  for (const k of ['sun', 'moon']) {
    const p = G.pl[k];
    if (p.dead > 0 || !ctl.local.has(k)) continue;
    for (const f of G.fish.slice()) if (canEat(p, f)) eatFish(G, p, f);
    for (const pk of G.pk.slice()) if (canTake(p, pk)) takePk(G, p, pk);
  }
  for (const k of ['sun', 'moon']) {
    const p = G.pl[k];
    if (p.dead > 0 || safe(p)) continue;
    const lk = ctl.local.has(k) ? 1 : 0.86;
    for (const f of G.fish) {
      if (f.k !== 'h' || f.n <= p.n) continue;
      if (Math.hypot(p.x - f.x, p.y - f.y) < (rOf(f.n) * 0.8 + rOf(p.n) * 0.35) * lk) { killPlayer(G, p, 'fish', f); break; }
    }
  }
  const a = G.pl.sun, b = G.pl.moon;
  if (a.dead <= 0 && b.dead <= 0 && a.n !== b.n) {
    const big = a.n > b.n ? a : b, small = big === a ? b : a;
    const lk = ctl.local.has('sun') && ctl.local.has('moon') ? 1 : 0.9;
    if (!safe(small) && Math.hypot(a.x - b.x, a.y - b.y) < (rOf(big.n) * 0.8 + rOf(small.n) * 0.35) * lk) {
      const gain = small.n;
      killPlayer(G, small, 'player', big);
      big.n += gain; big.eat = 0.35;
      ev(G, { k: 'eatp', who: big.kind, gain, x: small.x, y: small.y });
    }
  }
  for (const k of ['sun', 'moon']) {
    if (G.over) break;
    if (G.pl[k].n >= TARGET) { G.over = { w: k === 'sun' ? 'x' : 'o', why: 'size' }; ev(G, { k: 'over', w: G.over.w, why: 'size' }); }
  }
  if (!G.over && G.left <= 0) { const w = a.n === b.n ? 'd' : a.n > b.n ? 'x' : 'o'; G.over = { w, why: 'time' }; ev(G, { k: 'over', w, why: 'time' }); }
}

export function applyGuestEvent(G, e) {
  const p = G.pl.moon;
  if (!e || G.over) return;
  if (e.k === 'eat') {
    const f = G.fish.find((x) => x.id === e.id);
    if (f && p.dead <= 0 && f.n <= p.n + (e.slack || 0) && Math.hypot(p.x - f.x, p.y - f.y) < rOf(p.n) + rOf(f.n) + 1.8) { eatFish(G, p, f); G.acks.push([e.id, G.t]); }
  } else if (e.k === 'pick') {
    const pk = G.pk.find((x) => x.id === e.id);
    if (pk && p.dead <= 0) { takePk(G, p, pk); G.acks.push([e.id, G.t]); }
  } else if (e.k === 'dash') { p.dashFx = 1; }
}

const q10 = (v) => Math.round(v * 10);
export function snap(G) {
  G.acks = G.acks.filter(([, t]) => G.t - t < 1.6);
  const P = (p) => [p.n, p.lives, p.dead > 0 ? Math.round(p.dead * 10) : 0, q10(p.prot), q10(p.fx.shield), q10(p.fx.double), q10(p.fx.magnet), q10(p.fx.speed), p.tp, q10(p.x), q10(p.y)];
  return {
    t: Math.round(G.left * 10), gt: Math.round(G.t * 100), seq: G.seq,
    f: G.fish.map((f) => [f.id, f.n, q10(f.x), q10(f.y), Math.round(f.a * 100), f.k === 'h' ? (f.chase > 0 ? 2 : 1) : 0, f.sp]),
    pk: G.pk.map((k) => [k.id, PK_KINDS.indexOf(k.k), q10(k.x), q10(k.y)]),
    pl: { sun: P(G.pl.sun), moon: P(G.pl.moon) },
    ack: G.acks.map(([id]) => id),
    ev: G.log.slice(-12),
    over: G.over,
  };
}
export function applySnap(G, s, mine) {
  G.left = s.t / 10;
  const dts = G.lastGt != null ? clamp((s.gt - G.lastGt) / 100, 0, 1) : 0;
  G.lastGt = s.gt;
  const seen = new Set();
  const byId = new Map(G.fish.map((f) => [f.id, f]));
  for (const [id, n, x, y, a, h, sp] of s.f) {
    seen.add(id);
    let f = byId.get(id);
    const nx = x / 10, ny = y / 10;
    if (!f) { f = { id, n, k: h ? 'h' : 'p', x: nx, y: ny, a: a / 100, sp, tx: nx, ty: ny, ta: a / 100, chase: 0, vx: 0, vy: 0, ext: 0 }; G.fish.push(f); }
    else if (dts > 0.02 && f.sx != null) { f.vx = (nx - f.sx) / dts; f.vy = (ny - f.sy) / dts; const v = Math.hypot(f.vx, f.vy); if (v > 4) { f.vx *= 4 / v; f.vy *= 4 / v; } }
    f.sx = nx; f.sy = ny; f.ext = 0;
    f.n = n; f.k = h ? 'h' : 'p'; f.chase = h === 2 ? 1 : 0; f.tx = nx; f.ty = ny; f.ta = a / 100; f.sp = sp;
    if (Math.hypot(f.x - f.tx, f.y - f.ty) > 4) { f.x = f.tx; f.y = f.ty; }
  }
  G.fish = G.fish.filter((f) => seen.has(f.id));
  G.pk = s.pk.map(([id, k, x, y]) => ({ id, k: PK_KINDS[k], x: x / 10, y: y / 10, life: 9 }));
  for (const k of ['sun', 'moon']) {
    const p = G.pl[k], v = s.pl[k];
    p.hostN = v[0]; p.lives = v[1];
    const deadNow = v[2] > 0;
    if (k !== mine) p.n = v[0];
    if (deadNow && p.dead <= 0) { p.dead = v[2] / 10; }
    if (!deadNow && p.dead > 0) p.dead = 0;
    p.prot = v[3] / 10;
    if (k !== mine) { p.fx.shield = v[4] / 10; p.fx.double = v[5] / 10; p.fx.magnet = v[6] / 10; p.fx.speed = v[7] / 10; }
    else { p.fx.shield = Math.max(p.fx.shield, v[4] / 10); }
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
  if (m.dash) p.dashFx = 1;
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
  if (N.snap || d > 4) { p.x = tx; p.y = ty; N.snap = false; }
  else { const mx = 9 * dt; const st = Math.min(d, Math.max(mx * 0.3, d * (1 - Math.exp(-dt * 14))), mx); if (d > 1e-5) { p.x += dx / d * st; p.y += dy / d * st; } }
  p.a = angLerp(p.a, ta, 1 - Math.exp(-dt * 12));
  const L = b[b.length - 1]; p.vx = L.vx; p.vy = L.vy;
}

export function botInput(G, me, dt) {
  const o = G.pl[me.kind === 'sun' ? 'moon' : 'sun'];
  if (me.dead > 0) return { x: 0, y: 0 };
  let tx = 0, ty = 0, dash = false;
  let flee = null, fd = 4.2;
  for (const f of G.fish) { if (f.k !== 'h' || f.n <= me.n) continue; const d = Math.hypot(f.x - me.x, f.y - me.y) - rOf(f.n); if (d < fd) { fd = d; flee = f; } }
  if (o.dead <= 0 && o.n > me.n) { const d = Math.hypot(o.x - me.x, o.y - me.y) - rOf(o.n); if (d < fd) { fd = d; flee = o; } }
  if (flee && !safe(me)) { const dx = me.x - flee.x, dy = me.y - flee.y, d = Math.hypot(dx, dy) || 1; tx = dx / d; ty = dy / d; dash = fd < 1.6; }
  else {
    let best = null, bs = -1;
    for (const f of G.fish) { if (f.n > me.n) continue; const d = Math.hypot(f.x - me.x, f.y - me.y); const sc = f.n / (1 + d * d * 0.08); if (sc > bs) { bs = sc; best = f; } }
    if (o.dead <= 0 && me.n > o.n * 1.15 && !safe(o)) { const d = Math.hypot(o.x - me.x, o.y - me.y); const sc = o.n / (1 + d * d * 0.08) * 1.4; if (sc > bs) { bs = sc; best = o; dash = d < 3; } }
    for (const k of G.pk) { const d = Math.hypot(k.x - me.x, k.y - me.y); if (d < 5) { best = k; break; } }
    if (best) { const dx = best.x - me.x, dy = best.y - me.y, d = Math.hypot(dx, dy) || 1; tx = dx / d; ty = dy / d; }
    else { tx = Math.cos(G.t * 0.3); ty = Math.sin(G.t * 0.4); }
  }
  const l = Math.hypot(tx, ty) || 1;
  return { x: tx / l * 0.92, y: ty / l * 0.92, dash };
}
