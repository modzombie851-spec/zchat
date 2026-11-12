import { BOUNDS, solids, SPAWNS, PSPAWN, rng } from './ztown.js';

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
};
export const ZKEYS = ['walker', 'worker', 'runner', 'bloater', 'brute'];
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
    for (const r of rects) if (x > r[0] - 0.6 && x < r[2] + 0.6 && z > r[1] - 0.6 && z < r[3] + 0.6) { block[j * GW + i] = 1; break; }
    if (!block[j * GW + i]) for (const c of circles) if (c[2] > 0.9 && Math.hypot(x - c[0], z - c[1]) < c[2] + 0.4) { block[j * GW + i] = 1; break; }
  }
  geo = { buckets, block };
  return geo;
}

export function collide(x, z, r) {
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
  if (x < BX0 + r) x = BX0 + r; else if (x > BX1 - r) x = BX1 - r;
  if (z < BZ0 + r) z = BZ0 + r; else if (z > BZ1 - r) z = BZ1 - r;
  return [x, z];
}

export function rayBlocked(x0, z0, x1, z1) {
  const G = geometry();
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

export function makeSim(o = {}) {
  const R = rng(o.seed || (Date.now() & 0xffff) || 7);
  const S = {
    t: 0, wave: 0, ph: 'break', tl: o.firstBreak || 10, left: 0, spawnT: 0, nid: 1,
    players: new Map(), zs: new Map(), ev: [], fires: [], nades: [],
    maxAlive: o.maxAlive || 70, botFill: o.botFill == null ? 4 : o.botFill, best: 0, kills: 0,
    flow: null, flowT: 0, botSeq: 0,
  };
  const emit = (e) => { S.ev.push(e); };
  const alivePlayers = () => { const a = []; for (const p of S.players.values()) if (p.st === 0) a.push(p); return a; };
  const humans = () => { let n = 0; for (const p of S.players.values()) if (!p.bot) n++; return n; };
  const spawnAt = (i) => { const s = PSPAWN[i % PSPAWN.length]; return [s[0] + (R() - 0.5) * 2.4, s[1] + (R() - 0.5) * 2.4]; };

  S.addPlayer = (id, m = {}) => {
    const old = S.players.get(id);
    if (old) { old.n = m.n || old.n; old.sv = m.sv || old.sv; old.col = m.col | 0; old.gone = 0; return old; }
    const [x, z] = spawnAt(S.players.size);
    const sv = SURV.includes(m.sv) ? m.sv : SURV[S.players.size % SURV.length];
    const p = { id, n: String(m.n || 'Player').slice(0, 20), sv, col: m.col | 0, bot: !!m.bot, x, z, yaw: Math.PI, aim: 0, w: m.w || SURV_GUN[sv], hp: 100, st: 0, bleed: 0, rev: 0, revBy: null, kills: 0, pts: 0, downs: 0, budget: 120, mcd: 0, tcd: 0, seen: S.t, fl: 0 };
    S.players.set(id, p);
    if (!p.bot) S.fillBots();
    emit(['pj', id]);
    return p;
  };
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
    if (!p || p.bot) return;
    const now = S.t, dt = Math.max(0.05, now - (p.seen || now));
    p.seen = now;
    if (p.st === 0 && Number.isFinite(s.x) && Number.isFinite(s.z)) {
      let dx = s.x - p.x, dz = s.z - p.z;
      const lim = 7.5 * dt + 1.2, d = Math.hypot(dx, dz);
      if (d > lim) { dx *= lim / d; dz *= lim / d; }
      const c = collide(p.x + dx, p.z + dz, 0.38);
      p.x = c[0]; p.z = c[1];
    }
    if (Number.isFinite(s.yaw)) p.yaw = s.yaw;
    if (Number.isFinite(s.aim)) p.aim = Math.max(-1, Math.min(1, s.aim));
    if (WEAPONS[s.w] || MELEE[s.w]) p.w = s.w;
    p.fl = s.fl | 0;
    p.revT = typeof s.rv === 'string' ? s.rv : null;
  };

  const hurtZ = (z, dmg, by, head) => {
    if (z.hp <= 0) return false;
    z.hp -= dmg;
    if (z.hp > 0) return false;
    S.zs.delete(z.id);
    S.kills++;
    const T = ZT[z.k];
    const p = by ? S.players.get(by) : null;
    if (p) { p.kills++; p.pts += Math.round(T.pts * (head ? 1.5 : 1)); }
    emit(['k', z.id, by || '', head ? 1 : 0]);
    if (T.boom) blast(z.x, z.z, 3.6, 120, null, 'b');
    return true;
  };
  const blast = (x, z, r, dmg, by, kind) => {
    emit(['ex', Math.round(x * 10), Math.round(z * 10), Math.round(r * 10), kind || 'g']);
    for (const q of [...S.zs.values()]) { const d = Math.hypot(q.x - x, q.z - z); if (d < r + q.r) { hurtZ(q, dmg * (1 - Math.min(0.6, d / r * 0.6)), by, false); if (q.hp > 0) { const k = (r - d) / r * 1.6 / Math.max(0.3, d); q.x += (q.x - x) * k; q.z += (q.z - z) * k; } } }
    if (kind === 'b') for (const p of S.players.values()) if (p.st === 0 && Math.hypot(p.x - x, p.z - z) < r) hurtP(p, 14, null);
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
      let dmg = W.dmg * (h[1] ? 2 : 1);
      if (W.pel > 1) dmg *= 1 - Math.min(0.65, (d / W.rng) * 0.65);
      if (p.budget < dmg * 0.5) break;
      p.budget -= dmg;
      hurtZ(z, dmg, id, !!h[1]);
    }
  };
  S.melee = (id, k) => {
    const p = S.players.get(id), M = MELEE[k];
    if (!p || !M || p.st !== 0 || p.mcd > 0) return;
    p.mcd = 1 / M.rate * 0.85;
    const fx = Math.sin(p.yaw), fz = Math.cos(p.yaw);
    for (const z of [...S.zs.values()]) {
      const dx = z.x - p.x, dz = z.z - p.z, d = Math.hypot(dx, dz);
      if (d > M.rng + z.r) continue;
      const dot = (dx * fx + dz * fz) / Math.max(0.01, d);
      if (d > 0.8 && dot < Math.cos(M.arc / 2)) continue;
      if (!hurtZ(z, M.dmg, id, false)) { const k2 = M.push / Math.max(0.5, d); const c = collide(z.x + dx * k2 * 0.4, z.z + dz * k2 * 0.4, z.r); z.x = c[0]; z.z = c[1]; z.stun = 0.35; }
    }
    emit(['m', id, k]);
  };
  S.throwAt = (id, k, tx, tz) => {
    const p = S.players.get(id), T = THROW[k];
    if (!p || !T || p.st !== 0 || p.tcd > 0 || !Number.isFinite(tx) || !Number.isFinite(tz)) return;
    let dx = tx - p.x, dz = tz - p.z;
    const d = Math.hypot(dx, dz);
    if (d > 24) { dx *= 24 / d; dz *= 24 / d; }
    p.tcd = 3.5;
    const x = p.x + dx, z = p.z + dz;
    S.nades.push({ k, x, z, t: k === 'grenade' ? T.fuse : 0.9, by: id });
    emit(['th', id, k, Math.round(x * 10), Math.round(z * 10)]);
  };

  const flowField = () => {
    const G = geometry();
    const dist = new Int16Array(GW * GH).fill(-1);
    const q = new Int32Array(GW * GH);
    let qh = 0, qt = 0;
    for (const p of S.players.values()) {
      if (p.st !== 0) continue;
      const i = Math.floor((p.x - BX0) / CELL), j = Math.floor((p.z - BZ0) / CELL);
      if (i < 0 || i >= GW || j < 0 || j >= GH) continue;
      const c = j * GW + i;
      if (dist[c] === 0) continue;
      dist[c] = 0; q[qt++] = c;
    }
    while (qh < qt) {
      const c = q[qh++], i = c % GW, j = (c / GW) | 0, nd = dist[c] + 1;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        const ni = i + di, nj = j + dj;
        if (ni < 0 || ni >= GW || nj < 0 || nj >= GH) continue;
        const n = nj * GW + ni;
        if (dist[n] !== -1 || G.block[n]) continue;
        if (di && dj && (G.block[j * GW + ni] || G.block[nj * GW + i])) continue;
        dist[n] = nd; q[qt++] = n;
      }
    }
    return dist;
  };
  const flowDir = (x, z) => {
    const D = S.flow;
    if (!D) return null;
    const i = Math.floor((x - BX0) / CELL), j = Math.floor((z - BZ0) / CELL);
    if (i < 0 || i >= GW || j < 0 || j >= GH) return [BX0 + (BX1 - BX0) / 2 - x, BZ0 + (BZ1 - BZ0) / 2 - z];
    let best = D[j * GW + i], bx = 0, bz = 0;
    if (best < 0) best = 1e4;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue;
      const ni = i + di, nj = j + dj;
      if (ni < 0 || ni >= GW || nj < 0 || nj >= GH) continue;
      const v = D[nj * GW + ni];
      if (v >= 0 && v < best) { best = v; bx = di; bz = dj; }
    }
    if (!bx && !bz) return null;
    const cx = BX0 + (i + bx + 0.5) * CELL, cz = BZ0 + (j + bz + 0.5) * CELL;
    return [cx - x, cz - z];
  };

  const spawnZombie = () => {
    const al = alivePlayers();
    if (!al.length) return false;
    let pick = null;
    for (let tries = 0; tries < 10 && !pick; tries++) {
      const s = SPAWNS[(R() * SPAWNS.length) | 0];
      let near = 1e9;
      for (const p of al) near = Math.min(near, Math.hypot(p.x - s[0], p.z - s[1]));
      if (near > 24 || tries > 7) pick = s;
    }
    const w = S.wave;
    const r = R();
    let k = 'walker';
    if (w >= 4 && r < 0.09) k = 'bloater';
    else if (w >= 3 && r < 0.26) k = 'runner';
    else if (w >= 2 && r < 0.5) k = 'worker';
    if (S.bruteLeft > 0 && S.left <= S.bruteAt) { k = 'brute'; S.bruteLeft--; S.bruteAt = Math.floor(S.left * 0.5); }
    const T = ZT[k];
    const c = collide(pick[0] + (R() - 0.5) * 6, pick[1] + (R() - 0.5) * 6, T.r);
    const hpK = 1 + Math.max(0, w - 5) * 0.06;
    const z = { id: S.nid++, k, x: c[0], z: c[1], yaw: 0, hp: T.hp * hpK, max: T.hp * hpK, r: T.r, cd: 0, tg: null, tgT: 0, st: 0, slow: 0, stun: 0, burn: 0, sp: T.spd * (0.88 + R() * 0.24) * (1 + Math.min(0.3, w * 0.012)) };
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
    S.ph = 'break';
    S.tl = 18;
    S.best = Math.max(S.best, S.wave);
    for (const p of S.players.values()) {
      if (p.st === 2) { const [x, z] = spawnAt((R() * 8) | 0); p.x = x; p.z = z; p.st = 0; p.hp = 100; emit(['rs', p.id]); }
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
    S.zs.clear(); S.fires = []; S.nades = []; S.wave = 0; S.ph = 'break'; S.tl = 10;
    let i = 0;
    for (const p of S.players.values()) { const [x, z] = spawnAt(i++); Object.assign(p, { x, z, hp: 100, st: 0, bleed: 0, rev: 0, revBy: null, kills: 0, pts: 0, downs: 0 }); }
    emit(['rs', '*']);
  };

  const botThink = (b, dt) => {
    if (b.st !== 0) return;
    const W = WEAPONS[b.w] || WEAPONS.rifle;
    b.fcd = Math.max(0, (b.fcd || 0) - dt);
    if (b.rl > 0) { b.rl -= dt; if (b.rl <= 0) b.mag = W.mag; }
    let near = null, nd = 1e9;
    for (const z of S.zs.values()) { const d = Math.hypot(z.x - b.x, z.z - b.z); if (d < nd) { nd = d; near = z; } }
    let mx = 0, mz = 0;
    let lead = null, ld = 1e9;
    for (const p of S.players.values()) if (!p.bot && p.st === 0) { const d = Math.hypot(p.x - b.x, p.z - b.z); if (d < ld) { ld = d; lead = p; } }
    let downed = null, dd = 1e9;
    for (const p of S.players.values()) if (p.st === 1 && p !== b) { const d = Math.hypot(p.x - b.x, p.z - b.z); if (d < 26 && d < dd) { dd = d; downed = p; } }
    b.revT = null;
    if (downed && (!near || nd > 4.5)) {
      if (dd > 1.3) { mx = downed.x - b.x; mz = downed.z - b.z; } else b.revT = downed.id;
    } else if (near && nd < 5.5) { mx = b.x - near.x; mz = b.z - near.z; }
    else if (lead && ld > 11) { mx = lead.x - b.x; mz = lead.z - b.z; }
    else if (!lead && near && nd > W.rng * 0.7) { mx = near.x - b.x; mz = near.z - b.z; }
    else { const a = (S.t * 0.3 + b.x) % 6.28; mx = Math.cos(a) * 0.2; mz = Math.sin(a) * 0.2; }
    const ml = Math.hypot(mx, mz);
    b.mv = 0;
    if (ml > 0.05) {
      const sp = 4.4 * Math.min(1, ml);
      const c = collide(b.x + (mx / ml) * sp * dt, b.z + (mz / ml) * sp * dt, 0.38);
      b.x = c[0]; b.z = c[1]; b.mv = 1;
      if (!near || nd > W.rng) b.yaw = Math.atan2(mx, mz);
    }
    if (near && nd < W.rng * 0.85) {
      b.yaw = Math.atan2(near.x - b.x, near.z - b.z);
      if (b.fcd <= 0 && b.rl <= 0 && !rayBlocked(b.x, b.z, near.x, near.z)) {
        b.fcd = 1 / W.rate * (W.auto ? 2.2 : 1.5);
        b.mag = (b.mag == null ? W.mag : b.mag) - 1;
        if (b.mag <= 0) b.rl = W.rel;
        const acc = W.bot * 0.8 * (1 - (nd / W.rng) * 0.4);
        const hits = [];
        for (let k = 0; k < W.pel; k++) if (R() < acc) hits.push([near.id, R() < 0.14 ? 1 : 0]);
        emit(['bs', b.id, near.id]);
        b.budget = 1e6;
        S.shoot(b.id, b.w, hits);
      }
    }
  };

  S.step = (dt) => {
    S.t += dt;
    for (const p of S.players.values()) {
      p.budget = Math.min(260, p.budget + dt * 140);
      p.mcd = Math.max(0, p.mcd - dt);
      p.tcd = Math.max(0, p.tcd - dt);
      if (p.bot) botThink(p, dt);
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
    if (S.flowT <= 0) { S.flow = flowField(); S.flowT = 0.45; }
    const al = alivePlayers();
    const cells = new Map();
    for (const z of S.zs.values()) { const key = (Math.floor(z.x / 2) * 4099 + Math.floor(z.z / 2)) | 0; let a = cells.get(key); if (!a) cells.set(key, (a = [])); a.push(z); }
    for (const z of S.zs.values()) {
      const T = ZT[z.k];
      z.cd = Math.max(0, z.cd - dt);
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
        if (dist > 7) { const f = flowDir(z.x, z.z); if (f) { dx = f[0]; dz = f[1]; } }
      }
      const reach = T.r + 0.75;
      z.st = 0;
      if (tg && dist < reach + 0.15) {
        z.st = 1;
        z.yaw = Math.atan2(tg.x - z.x, tg.z - z.z);
        if (z.cd <= 0) { z.cd = T.cd; hurtP(tg, T.dmg); emit(['zh', z.id, tg.id]); }
        continue;
      }
      const L = Math.hypot(dx, dz);
      if (L < 1e-3) continue;
      let sx = 0, sz = 0;
      const ci = Math.floor(z.x / 2), cj = Math.floor(z.z / 2);
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
        const arr = cells.get(((ci + a) * 4099 + (cj + b)) | 0);
        if (!arr) continue;
        for (const o of arr) { if (o === z) continue; const ox = z.x - o.x, oz = z.z - o.z, od = Math.hypot(ox, oz), min = z.r + o.r; if (od < min && od > 1e-4) { const k = (min - od) / od; sx += ox * k; sz += oz * k; } }
      }
      const sp = z.sp * (z.slow > 0 ? 0.55 : 1);
      z.slow = Math.max(0, z.slow - dt);
      const vx = (dx / L) * sp * dt + sx * 0.5, vz = (dz / L) * sp * dt + sz * 0.5;
      const c = collide(z.x + vx, z.z + vz, z.r);
      z.x = c[0]; z.z = c[1];
      const want = Math.atan2(dx, dz);
      let dy = want - z.yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
      z.yaw += dy * Math.min(1, dt * 6);
    }
    for (let i = S.nades.length - 1; i >= 0; i--) {
      const n = S.nades[i];
      n.t -= dt;
      if (n.t > 0) continue;
      S.nades.splice(i, 1);
      if (n.k === 'grenade') blast(n.x, n.z, THROW.grenade.r, THROW.grenade.dmg, n.by, 'g');
      else { S.fires.push({ x: n.x, z: n.z, r: THROW.molotov.r, life: THROW.molotov.life, by: n.by }); emit(['fi', Math.round(n.x * 10), Math.round(n.z * 10), Math.round(THROW.molotov.r * 10), THROW.molotov.life]); }
    }
    for (let i = S.fires.length - 1; i >= 0; i--) {
      const f = S.fires[i];
      f.life -= dt;
      if (f.life <= 0) { S.fires.splice(i, 1); continue; }
      for (const z of [...S.zs.values()]) if (Math.hypot(z.x - f.x, z.z - f.z) < f.r + z.r * 0.5) { z.slow = 0.4; hurtZ(z, THROW.molotov.dps * dt, f.by, false); }
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
      z.push(q.id, ZKEYS.indexOf(q.k), Math.round(q.x * 10), Math.round(q.z * 10), Math.round(q.yaw * 100), Math.max(1, Math.round((q.hp / q.max) * 100)), (q.st ? 1 : 0) | (q.slow > 0 ? 2 : 0));
    }
    const p = [];
    for (const q of S.players.values()) p.push([q.id, Math.round(q.x * 10), Math.round(q.z * 10), Math.round(q.yaw * 100), Math.round(q.aim * 100), q.w, Math.round(q.hp), q.st, Math.round(q.rev * 100), q.fl | (q.mv ? 1 : 0) | (q.revT ? 4 : 0), q.kills, q.pts]);
    return { w: S.wave, ph: PH[S.ph], tl: Math.ceil(Math.max(0, S.tl)), zl: S.left + S.zs.size, z, p };
  };
  S.roster = () => [...S.players.values()].map((q) => [q.id, q.n, q.sv, q.col, q.bot ? 1 : 0]);
  S.takeEvents = () => { const e = S.ev; S.ev = []; return e; };
  return S;
}
