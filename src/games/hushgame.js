import { makeLevel, navPath, collideCircle, lineBlocked, rng, PROP, DOOR_W } from './hushlevel.js';

export const TUNE = {
  walk: 2.05, run: 4.0, crouch: 1.05, crawl: 0.38,
  stamMax: 6, stamRegen: 0.9,
  nz: { run: 9, walk: 3.4, crouch: 0.9, door: 4.2, slam: 12, pick: 4, lock: 11, unlock: 13, radio: 26, breath: 2.3, gasp: 4.8, talk: 9, flash: 1.2, revive: 4.5, knock: 6.5 },
  mon: { wander: 1.12, hunt: 2.2, chase: 3.85, catchR: 0.95, feelR: 1.5, scale: 1.18, r: 0.42 },
  battery: 300, breathMax: 8, downT: 40, reviveT: 3, unlockT: 2.6,
};
export const ST = ['wander', 'hunt', 'chase', 'search', 'attack', 'stun', 'roar', 'smash', 'idle'];
export const CLIPS = ['m_idle', 'stride', 'm_run', 'm_roar', 'm_swipe', 'z_nbite', 'crawl', 'scream', 'm_punch'];
const HURT = new Set(['attack']);

const d2 = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);
const angTo = (ax, az, bx, bz) => Math.atan2(bx - ax, bz - az);
const wrap = (a) => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };

export function newPlayer(id, sp, meta = {}) {
  return { id, n: meta.n || 'Player', sv: meta.sv || 0, x: sp.x, z: sp.z, yaw: Math.PI, pitch: 0, cr: 0, run: 0, hide: -1, fl: 1, bat: TUNE.battery, down: 0, downT: 0, dead: 0, out: 0, item: null, hold: 0, holdT: 0, holdCd: 0, stam: TUNE.stamMax, stepT: 0, breathT: 0, mv: 0, rv: 0, panic: 0, lastNz: -9, at: 0 };
}

export function makeGame(seed, opts = {}) {
  const lv = makeLevel(seed, opts.size || 0);
  const R = rng(seed * 31 + 7);
  const G = {
    seed, lv, t: 0, phase: 'play', winT: 0, players: {}, ev: [], nz: [], items: [], keys: 0, locks: [0, 0, 0], exitOpen: 0,
    doors: new Float32Array(lv.doors.map((d) => d.open)), doorTo: new Float32Array(lv.doors.map((d) => d.open)),
    mon: null, navBuf: {}, solo: !!opts.solo,
  };
  const spots = lv.spots.slice();
  const ex = lv.exit;
  const far = (sp) => d2(sp.x, sp.z, ex.x, ex.z);
  const usedRooms = new Set();
  const pickSpot = (minD, filter) => {
    const pool = R.shuffle(spots.filter((s) => far(s) > minD && (!filter || filter(s))));
    for (const s of pool) {
      if (usedRooms.has(s.room) && s.room > 0) continue;
      spots.splice(spots.indexOf(s), 1);
      usedRooms.add(s.room);
      return s;
    }
    return pool[0] || spots[0];
  };
  let id = 0;
  for (let i = 0; i < 3; i++) { const s = pickSpot(14 + i * 2, (q) => q.room > 0); G.items.push({ id: id++, k: 'key', x: s.x, y: s.y, z: s.z, yaw: R.range(0, 6.28), st: 0, by: '' }); }
  for (let i = 0; i < 2; i++) { const s = pickSpot(8); G.items.push({ id: id++, k: 'radio', x: s.x, y: s.y, z: s.z, yaw: R.range(0, 6.28), st: 0, by: '' }); }
  { const s = pickSpot(10); G.items.push({ id: id++, k: 'knife', x: s.x, y: s.y, z: s.z, yaw: R.range(0, 6.28), st: 0, by: '' }); }
  for (let i = 0; i < 4; i++) { const s = pickSpot(6); G.items.push({ id: id++, k: 'cell', x: s.x, y: s.y, z: s.z, yaw: R.range(0, 6.28), st: 0, by: '' }); }
  const ms = lv.monsterStart;
  G.mon = { x: ms.x, z: ms.z, yaw: 0, st: 'wander', clip: 'm_idle', ct: 0, tgt: null, path: null, pi: 0, repath: 0, spd: 0, heard: null, interest: 0, searchT: 0, wanderT: 2, roarCd: 8, cool: 0, victim: '', actT: 0, stuck: 0, lastX: ms.x, lastZ: ms.z, chaseId: '', chaseT: 0, sniffT: 0, idleT: 0 };
  G.doorCell = doorCells(lv);
  return G;
}

function doorCells(lv) {
  const { S, NW, NH } = lv.nav;
  const out = new Int16Array(NW * NH).fill(-1);
  for (const d of lv.doors) {
    const hw = DOOR_W / 2 + 0.2;
    const x0 = d.h ? d.x - hw : d.x - 0.35, x1 = d.h ? d.x + hw : d.x + 0.35;
    const z0 = d.h ? d.z - 0.35 : d.z - hw, z1 = d.h ? d.z + 0.35 : d.z + hw;
    for (let z = Math.floor(z0 / S); z <= Math.floor(z1 / S); z++) for (let x = Math.floor(x0 / S); x <= Math.floor(x1 / S); x++) if (x >= 0 && z >= 0 && x < NW && z < NH) out[z * NW + x] = d.id;
  }
  return out;
}

export function exitSolid(G) {
  if (G.exitOpen) return null;
  const ex = G.lv.exit;
  return [ex.x - 1.0, ex.z - 0.12, ex.x + 1.0, ex.z + 0.12, 0, 0, 1];
}

export function dynSolids(G, leafBox) {
  const out = [];
  G.lv.doors.forEach((d, i) => { const b = leafBox(d, G.doors[i]); if (b) out.push(b); });
  const e = exitSolid(G);
  if (e) out.push(e);
  return out;
}

export function emit(G, x, z, r, k, pid) {
  G.nz.push({ x, z, r, k, pid: pid || '', t: G.t });
  G.ev.push({ e: 'nz', x, z, r, k, pid: pid || '' });
}

function hearDist(G, x, z, r) {
  const M = G.mon;
  const lv = G.lv;
  const straight = d2(x, z, M.x, M.z);
  if (straight > r) return null;
  if (straight < 1.6) return straight;
  const cost = (j) => { const di = G.doorCell[j]; return di >= 0 && G.doors[di] < 0.5 ? 5 : 0; };
  const p = navPath(lv, M.x, M.z, x, z, { limit: r * 1.25, buf: G.navBuf, cost, props: true });
  if (!p) return null;
  return p.len <= r ? p.len : null;
}

const KW = { run: 1, walk: 0.7, crouch: 0.5, door: 0.75, slam: 0.3, pick: 0.8, lock: 1, unlock: 1, radio: 1.1, breath: 0.95, gasp: 1, talk: 1, flash: 0.4, revive: 0.9, knock: 0.85 };

function hostHear(G) {
  const M = G.mon;
  if (!G.nz.length) return;
  const list = G.nz.splice(0);
  if (M.st === 'attack' || M.st === 'stun' || M.st === 'smash') return;
  for (const n of list) {
    if (n.k === 'slam') continue;
    const d = hearDist(G, n.x, n.z, n.r);
    if (d == null) continue;
    const loud = (1 - d / n.r) * (KW[n.k] || 0.7) + 0.15;
    const P = n.pid ? G.players[n.pid] : null;
    if (P && (P.dead || P.out || P.down)) continue;
    const chase = P && (n.k === 'run' || n.k === 'talk' || n.k === 'gasp' || n.k === 'breath' || n.k === 'unlock' || n.k === 'lock' || (d < 5 && n.k !== 'flash'));
    if (loud < M.interest * 0.8 && !(chase && M.chaseId === n.pid)) continue;
    M.heard = { x: n.x, z: n.z, t: G.t, k: n.k, pid: n.pid };
    M.interest = loud;
    if (chase && P) {
      if (M.st !== 'chase' && M.roarCd <= 0 && (M.st === 'wander' || M.st === 'idle' || M.st === 'search')) {
        M.st = 'roar'; M.actT = 1.6; M.clip = 'm_roar'; M.ct = 0; M.yaw = angTo(M.x, M.z, n.x, n.z); M.roarCd = 14; M.chaseId = n.pid; M.chaseT = 4.5;
        G.ev.push({ e: 'roar', x: M.x, z: M.z, pid: n.pid, spot: 1 });
        continue;
      }
      if (M.st !== 'roar') { M.st = 'chase'; M.chaseId = n.pid; M.chaseT = 3.2; M.tgt = { x: n.x, z: n.z }; M.repath = 0; }
      else { M.chaseId = n.pid; M.chaseT = 3.2; }
    } else if (M.st !== 'chase' && M.st !== 'roar') {
      M.st = 'hunt'; M.tgt = { x: n.x, z: n.z }; M.repath = 0; M.searchT = 0;
      if (n.k === 'radio') M.radio = true;
    }
  }
}

function pickWander(G, R) {
  const lv = G.lv, M = G.mon;
  const alive = Object.values(G.players).filter((p) => !p.dead && !p.out && !p.down);
  const tries = 30;
  const near = alive.length && R() < 0.38 ? alive[Math.floor(R() * alive.length)] : null;
  for (let i = 0; i < tries; i++) {
    const s = lv.spots[Math.floor(R() * lv.spots.length)];
    if (!s) break;
    const dm = d2(s.x, s.z, M.x, M.z);
    if (dm < 5) continue;
    if (near) { const dp = d2(s.x, s.z, near.x, near.z); if (dp < 8 || dp > 20) continue; }
    return { x: s.x, z: s.z };
  }
  const s = lv.spots[Math.floor(R() * lv.spots.length)];
  return s ? { x: s.x, z: s.z } : { x: M.x, z: M.z };
}

function clearLine(lv, x0, z0, x1, z1, r) {
  if (lineBlocked(lv, x0, z0, x1, z1)) return false;
  const dx = x1 - x0, dz = z1 - z0, l = Math.hypot(dx, dz) || 1;
  const px = -dz / l * r, pz = dx / l * r;
  return !lineBlocked(lv, x0 + px, z0 + pz, x1 + px, z1 + pz) && !lineBlocked(lv, x0 - px, z0 - pz, x1 - px, z1 - pz);
}

function doorAhead(G, P, from) {
  const { S, NW, NH } = G.lv.nav;
  for (let k = from; k < Math.min(P.length, from + 5); k++) {
    const x = Math.floor(P[k][0] / S), z = Math.floor(P[k][1] / S);
    if (x < 0 || z < 0 || x >= NW || z >= NH) continue;
    const di = G.doorCell[z * NW + x];
    if (di >= 0) return di;
  }
  return -1;
}

function follow(G, dt, speed) {
  const M = G.mon, lv = G.lv;
  if (!M.tgt) return true;
  M.repath -= dt;
  if (!M.path || M.repath <= 0) {
    const cost = (j) => { const di = G.doorCell[j]; return di >= 0 && G.doors[di] < 0.5 ? 1.5 : 0; };
    const p = navPath(lv, M.x, M.z, M.tgt.x, M.tgt.z, { buf: G.navBuf, cost, props: false, mon: true });
    M.path = p ? p.pts : null; M.pi = 0;
    M.repath = M.st === 'chase' ? 0.35 : 1.2;
    if (!p) { M.tgt = null; return true; }
  }
  const P = M.path;
  while (M.pi < P.length - 1) {
    const [px, pz] = P[M.pi];
    if (d2(px, pz, M.x, M.z) < 0.5) M.pi++; else break;
  }
  const di = doorAhead(G, P, M.pi);
  if (di >= 0 && G.doors[di] < 0.72) {
    const d = lv.doors[di];
    const dd = d2(d.x, d.z, M.x, M.z);
    if (dd < 1.35) {
      M.spd = 0;
      M.clip = 'm_idle';
      const da = wrap(angTo(M.x, M.z, d.x, d.z) - M.yaw), turn = 4 * dt;
      M.yaw = wrap(M.yaw + Math.max(-turn, Math.min(turn, da)));
      if (M.doorId !== di) { M.doorId = di; M.doorT = 0; M.rattle = 0; }
      M.doorT += dt;
      const bash = M.st === 'chase';
      if (G.doorTo[di] < 0.72) {
        const closed = G.doors[di] < 0.25;
        if (closed && !M.rattle && !bash) { M.rattle = 1; G.ev.push({ e: 'rattle', id: di, x: d.x, z: d.z }); }
        if (M.doorT >= (bash ? 0.18 : closed ? 0.95 : 0.25)) {
          G.doorTo[di] = 1;
          if (bash) G.doors[di] = Math.max(G.doors[di], 0.3);
          G.ev.push({ e: 'slam', id: di, x: d.x, z: d.z, b: bash ? 1 : 0 });
        }
      }
      return false;
    }
  }
  let look = M.pi;
  for (let k = M.pi + 1; k < Math.min(P.length, M.pi + 6); k++) { if (!clearLine(lv, M.x, M.z, P[k][0], P[k][1], TUNE.mon.r * 0.85)) break; look = k; }
  const [tx, tz] = P[look];
  const dist = d2(tx, tz, M.x, M.z);
  const goal = d2(M.tgt.x, M.tgt.z, M.x, M.z);
  if (goal < 0.6 || (M.pi >= P.length - 1 && dist < 0.5)) { M.spd = 0; return true; }
  const want = angTo(M.x, M.z, tx, tz);
  const da = wrap(want - M.yaw);
  const turn = (M.st === 'chase' ? 6 : 3.4) * dt;
  M.yaw = wrap(M.yaw + Math.max(-turn, Math.min(turn, da)));
  const slow = Math.abs(da) > 1.2 ? 0.3 : Math.abs(da) > 0.6 ? 0.65 : 1;
  M.spd += (speed * slow - M.spd) * Math.min(1, dt * 3);
  const step = Math.min(M.spd * dt, dist);
  const nx = M.x + Math.sin(M.yaw) * step, nz = M.z + Math.cos(M.yaw) * step;
  const [cx, cz] = collideCircle(lv, nx, nz, TUNE.mon.r);
  M.x = cx; M.z = cz;
  return false;
}

export function hostStep(G, dt) {
  if (G.phase !== 'play') { G.t += dt; return; }
  G.t += dt;
  const M = G.mon;
  const R = G.rnd || (G.rnd = rng(G.seed * 13 + 5));
  for (let i = 0; i < G.doors.length; i++) {
    const to = G.doorTo[i], cur = G.doors[i];
    if (cur !== to) { const s = dt * 2.2; G.doors[i] = Math.abs(to - cur) < s ? to : cur + Math.sign(to - cur) * s; }
  }
  M.roarCd -= dt; M.cool -= dt; M.interest = Math.max(0, M.interest - dt * 0.12);
  hostHear(G);
  const players = Object.values(G.players);
  const alive = players.filter((p) => !p.dead && !p.out);
  for (const p of players) {
    if (p.down && !p.dead) {
      p.downT -= dt;
      if (p.downT <= 0) { p.dead = 1; p.down = 0; G.ev.push({ e: 'dead', pid: p.id }); }
    }
  }
  const standing = alive.filter((p) => !p.down);
  if (alive.length && !standing.length) { G.phase = 'lost'; G.ev.push({ e: 'lost' }); return; }
  if (!alive.length && players.some((p) => p.out)) { G.phase = 'won'; G.ev.push({ e: 'won' }); return; }
  if (!players.length) return;
  if (!alive.length) { G.phase = 'lost'; G.ev.push({ e: 'lost' }); return; }
  M.ct += dt;
  switch (M.st) {
    case 'roar':
      M.spd = 0; M.clip = 'm_roar';
      M.actT -= dt;
      if (M.actT <= 0) {
        const P = G.players[M.chaseId];
        if (M.after) { M.after = 0; M.st = 'wander'; M.tgt = pickFar(G, R); M.path = null; M.wanderT = 14; M.interest = 0; M.heard = null; }
        else if (P && !P.down && !P.dead && !P.out) { M.st = 'chase'; M.tgt = { x: P.x, z: P.z }; M.repath = 0; }
        else { M.st = 'hunt'; M.tgt = M.heard ? { x: M.heard.x, z: M.heard.z } : null; }
      }
      break;
    case 'chase': {
      M.clip = 'm_run';
      const P = G.players[M.chaseId];
      M.chaseT -= dt;
      if (!P || P.down || P.dead || P.out) { M.st = 'search'; M.searchT = 6; M.tgt = M.heard ? { x: M.heard.x, z: M.heard.z } : null; break; }
      if (M.heard && M.heard.pid === P.id && G.t - M.heard.t < 0.05) M.chaseT = Math.max(M.chaseT, 2.4);
      const close = d2(P.x, P.z, M.x, M.z) < TUNE.mon.feelR && P.hide < 0;
      if (close) M.chaseT = Math.max(M.chaseT, 1.2);
      if (M.chaseT > 0 && (close || G.t - (M.heard ? M.heard.t : -99) < 2.6)) M.tgt = { x: P.x, z: P.z };
      if (M.chaseT <= 0) { M.st = 'search'; M.searchT = 7; M.tgt = M.heard ? { x: M.heard.x, z: M.heard.z } : { x: P.x, z: P.z }; M.path = null; G.ev.push({ e: 'sniff', x: M.x, z: M.z }); break; }
      follow(G, dt, TUNE.mon.chase);
      break;
    }
    case 'hunt': {
      M.clip = 'stride';
      if (!M.tgt) { M.st = 'search'; M.searchT = 5; break; }
      const done = follow(G, dt, TUNE.mon.hunt);
      if (done) {
        const radio = G.items.find((it) => it.k === 'radio' && it.st === 3 && d2(it.x, it.z, M.x, M.z) < 1.8);
        if (radio) { M.st = 'smash'; M.actT = 1.3; M.clip = 'm_swipe'; M.ct = 0; M.smash = radio.id; M.yaw = angTo(M.x, M.z, radio.x, radio.z); break; }
        M.st = 'search'; M.searchT = 6 + R() * 4; M.tgt = null; M.sniffT = 0; G.ev.push({ e: 'sniff', x: M.x, z: M.z });
      }
      break;
    }
    case 'search': {
      M.searchT -= dt;
      M.sniffT -= dt;
      if (!M.tgt || follow(G, dt, TUNE.mon.wander * 1.1)) {
        M.clip = 'm_idle'; M.spd = 0;
        if (M.sniffT <= 0) {
          M.sniffT = 1.6 + R() * 1.6;
          const base = M.heard || M;
          const a = R() * Math.PI * 2, r = 1.5 + R() * 3;
          M.tgt = { x: base.x + Math.sin(a) * r, z: base.z + Math.cos(a) * r };
          M.path = null;
        }
      } else M.clip = 'stride';
      if (M.searchT <= 0) { M.st = 'wander'; M.tgt = null; M.wanderT = 0; M.interest = 0; }
      break;
    }
    case 'smash':
      M.spd = 0; M.clip = 'm_swipe';
      M.actT -= dt;
      if (M.actT < 0.7 && M.smash != null) { const it = G.items[M.smash]; if (it && it.st === 3) { it.st = 2; G.ev.push({ e: 'smash', id: it.id, x: it.x, z: it.z }); } M.smash = null; }
      if (M.actT <= 0) { M.st = 'search'; M.searchT = 5; M.tgt = null; M.radio = false; }
      break;
    case 'attack': {
      M.spd = 0;
      M.actT -= dt;
      if (M.actT <= 0) { M.st = 'roar'; M.actT = 1.6; M.clip = 'm_roar'; M.ct = 0; M.chaseId = ''; M.cool = 10; G.ev.push({ e: 'roar', x: M.x, z: M.z }); M.after = 1; }
      break;
    }
    case 'stun':
      M.spd = 0; M.clip = 'm_roar';
      M.actT -= dt;
      if (M.actT <= 0) { M.st = 'search'; M.searchT = 4; M.tgt = null; }
      break;
    case 'idle':
      M.spd = 0; M.clip = 'm_idle';
      M.idleT -= dt;
      if (M.idleT <= 0) { M.st = 'wander'; M.tgt = null; }
      break;
    default: {
      M.wanderT -= dt;
      if (!M.tgt || M.wanderT <= 0) { M.tgt = pickWander(G, R); M.path = null; M.wanderT = 18 + R() * 10; }
      M.clip = 'stride';
      if (follow(G, dt, TUNE.mon.wander)) { M.st = 'idle'; M.idleT = 1.5 + R() * 2.5; M.tgt = null; if (R() < 0.35) G.ev.push({ e: 'growl', x: M.x, z: M.z }); }
    }
  }
  if (M.cool <= 0 && M.st !== 'attack' && M.st !== 'stun' && M.st !== 'roar') {
    for (const P of standing) {
      if (P.out) continue;
      const dd = d2(P.x, P.z, M.x, M.z);
      const hidden = P.hide >= 0;
      if (dd > TUNE.mon.catchR + (M.st === 'chase' ? 0.25 : 0)) continue;
      if (hidden && !(M.foundId === P.id && G.t - M.foundT < 1.6)) continue;
      catchPlayer(G, P, R);
      break;
    }
  }
  const dx = M.x - M.lastX, dz = M.z - M.lastZ;
  M.lastX = M.x; M.lastZ = M.z;
  if (M.tgt && M.spd > 0.5 && Math.hypot(dx, dz) < M.spd * dt * 0.15) { M.stuck += dt; if (M.stuck > 1.2) { M.path = null; M.repath = 0; M.stuck = 0; if (M.st === 'wander') M.tgt = null; } } else M.stuck = 0;
}

function pickFar(G, R) {
  const M = G.mon, lv = G.lv;
  let best = null, bd = -1;
  for (let i = 0; i < 14; i++) {
    const s = lv.spots[Math.floor(R() * lv.spots.length)];
    if (!s) continue;
    const d = d2(s.x, s.z, M.x, M.z);
    if (d > bd && d < 26) { bd = d; best = s; }
  }
  return best ? { x: best.x, z: best.z } : null;
}

function catchPlayer(G, P, R) {
  const M = G.mon;
  M.yaw = angTo(M.x, M.z, P.x, P.z);
  M.ct = 0;
  if (P.item === 'knife') {
    P.item = null;
    const it = G.items.find((q) => q.k === 'knife' && q.by === P.id);
    if (it) it.st = 2;
    M.st = 'stun'; M.actT = 3.4; M.clip = 'm_roar'; M.cool = 5;
    G.ev.push({ e: 'stab', pid: P.id, x: M.x, z: M.z });
    return;
  }
  const others = Object.values(G.players).filter((q) => q.id !== P.id && !q.dead && !q.out && !q.down);
  M.st = 'attack'; M.actT = 2.6; M.clip = 'm_punch'; M.victim = P.id; M.spd = 0;
  if (P.hide >= 0) P.hide = -1;
  P.down = 0; P.dead = 1; P.downT = 0;
  P.item = dropItem(G, P);
  const a = angTo(M.x, M.z, P.x, P.z);
  G.ev.push({ e: 'catch', pid: P.id, x: M.x, z: M.z, px: P.x, pz: P.z, a: Math.round(a * 100) / 100, clip: M.clip, last: others.length ? 0 : 1 });
}

function dropItem(G, P) {
  if (!P.item) return null;
  const it = G.items.find((q) => q.by === P.id && q.st === 1);
  if (it) { it.st = 0; it.by = ''; it.x = P.x; it.z = P.z; it.y = 0.02; }
  return null;
}

export function hostAction(G, pid, a) {
  const P = G.players[pid];
  if (!P || G.phase !== 'play') return false;
  if (a.k === 'pick') {
    const it = G.items[a.id];
    if (!it || it.st !== 0 || d2(it.x, it.z, P.x, P.z) > 2.4 || P.down) return false;
    if (it.k === 'key') { it.st = 2; G.keys++; emit(G, it.x, it.z, TUNE.nz.pick, 'pick', pid); G.ev.push({ e: 'key', pid, id: it.id, n: G.keys }); return true; }
    if (it.k === 'cell') { it.st = 2; P.bat = TUNE.battery; G.ev.push({ e: 'cell', pid, id: it.id }); return true; }
    if (P.item) { const old = G.items.find((q) => q.by === pid && q.st === 1); if (old) { old.st = 0; old.by = ''; old.x = it.x; old.z = it.z; old.y = it.y; } }
    it.st = 1; it.by = pid; P.item = it.k;
    G.ev.push({ e: 'item', pid, id: it.id, k: it.k });
    return true;
  }
  if (a.k === 'door') {
    const d = G.lv.doors[a.id];
    if (!d || d2(d.x, d.z, P.x, P.z) > 2.6) return false;
    const open = G.doorTo[a.id] > 0.5 ? 0 : 1;
    G.doorTo[a.id] = open;
    emit(G, d.x, d.z, TUNE.nz.door, 'door', pid);
    G.ev.push({ e: open ? 'dopen' : 'dclose', id: a.id, x: d.x, z: d.z });
    return true;
  }
  if (a.k === 'radio') {
    const it = G.items.find((q) => q.k === 'radio' && q.by === pid && q.st === 1);
    if (!it) return false;
    it.st = 3; it.by = ''; it.x = a.x; it.z = a.z; it.y = 0.02; it.on = G.t + 2.2; it.end = G.t + 16; it.nt = 0;
    P.item = null;
    G.ev.push({ e: 'radio', id: it.id, x: it.x, z: it.z });
    return true;
  }
  if (a.k === 'unlock') {
    const i = a.i | 0;
    if (i < 0 || i > 2 || G.locks[i] || G.keys <= G.locks.reduce((s, v) => s + v, 0)) return false;
    if (d2(G.lv.exit.x, G.lv.exit.z, P.x, P.z) > 3.2) return false;
    G.locks[i] = 1;
    emit(G, G.lv.exit.x, G.lv.exit.z - 0.5, TUNE.nz.unlock, 'unlock', pid);
    G.ev.push({ e: 'lock', i, pid });
    if (G.locks.every((v) => v)) { G.exitOpen = 1; G.ev.push({ e: 'exit' }); }
    return true;
  }
  if (a.k === 'revive') {
    const T = G.players[a.to];
    if (!T || !T.down || T.dead || d2(T.x, T.z, P.x, P.z) > 2.4) return false;
    T.down = 0; T.downT = 0;
    G.ev.push({ e: 'revive', pid: a.to, by: pid });
    return true;
  }
  if (a.k === 'out') {
    if (!G.exitOpen || P.z < G.lv.exit.z + 0.3) return false;
    P.out = 1;
    G.ev.push({ e: 'out', pid });
    return true;
  }
  return false;
}

export function hostRadio(G) {
  for (const it of G.items) {
    if (it.k !== 'radio' || it.st !== 3) continue;
    if (G.t < it.on) continue;
    if (G.t > it.end) { it.st = 2; G.ev.push({ e: 'radiooff', id: it.id }); continue; }
    if (G.t >= it.nt) { it.nt = G.t + 0.9; emit(G, it.x, it.z, TUNE.nz.radio, 'radio', ''); }
  }
}

export function hostBreath(G, dt) {
  const M = G.mon;
  for (const P of Object.values(G.players)) {
    if (P.dead || P.out || P.down) continue;
    const d = d2(P.x, P.z, M.x, M.z);
    if (d < 3.4 && !P.nearM) { P.nearM = 1; P.breathT = Math.max(P.breathT, 1.3); }
    if (d > 4.2) P.nearM = 0;
    P.breathT -= dt;
    if (d < 3.4 && !P.hold && P.breathT <= 0) {
      P.breathT = 0.9;
      const hd = hearDist(G, P.x, P.z, TUNE.nz.breath);
      if (hd != null) { if (P.hide >= 0) { M.foundId = P.id; M.foundT = G.t; } G.nz.push({ x: P.x, z: P.z, r: TUNE.nz.breath, k: 'breath', pid: P.id, t: G.t }); }
    }
  }
}

export function snapOf(G) {
  const M = G.mon;
  return {
    t: Math.round(G.t * 100) / 100, ph: G.phase,
    m: [Math.round(M.x * 100) / 100, Math.round(M.z * 100) / 100, Math.round(M.yaw * 100) / 100, ST.indexOf(M.st), CLIPS.indexOf(M.clip), Math.round(M.ct * 100) / 100, Math.round(M.spd * 100) / 100],
    d: Array.from(G.doorTo, (v) => (v > 0.5 ? 1 : 0)).join(''),
    k: G.keys, l: G.locks.join(''), x: G.exitOpen,
    it: G.items.map((it) => (it.st === 0 ? [0, Math.round(it.x * 100) / 100, Math.round(it.y * 100) / 100, Math.round(it.z * 100) / 100] : it.st === 1 ? [1, it.by] : it.st === 3 ? [3, Math.round(it.x * 100) / 100, Math.round(it.z * 100) / 100, Math.round((it.on - G.t) * 10) / 10, Math.round((it.end - G.t) * 10) / 10] : [2])),
    pd: Object.values(G.players).filter((p) => p.down || p.dead || p.out).map((p) => [p.id, p.down ? 1 : 0, p.dead ? 1 : 0, p.out ? 1 : 0, Math.round(p.downT)]),
  };
}

export function applySnap(G, s, me) {
  const M = G.mon;
  if (s.ph && s.ph !== G.phase) G.phase = s.ph;
  G.t = s.t;
  const [x, z, yaw, st, clip, ct, spd] = s.m;
  M.nx = x; M.nz = z; M.nyaw = yaw; M.spd = spd;
  if (M.x == null || d2(M.x, M.z, x, z) > 4) { M.x = x; M.z = z; M.yaw = yaw; }
  const ns = ST[st] || 'wander', nc = CLIPS[clip] || 'm_idle';
  if (nc !== M.clip) { M.clip = nc; M.ct = ct; } else if (Math.abs(M.ct - ct) > 0.6) M.ct = ct;
  M.st = ns;
  for (let i = 0; i < s.d.length && i < G.doorTo.length; i++) G.doorTo[i] = s.d[i] === '1' ? 1 : 0;
  G.keys = s.k; G.locks = s.l.split('').map((c) => (c === '1' ? 1 : 0)); G.exitOpen = s.x;
  s.it.forEach((a, i) => {
    const it = G.items[i];
    if (!it) return;
    it.st = a[0];
    if (a[0] === 0) { it.x = a[1]; it.y = a[2]; it.z = a[3]; it.by = ''; }
    else if (a[0] === 1) it.by = a[1];
    else if (a[0] === 3) { it.x = a[1]; it.z = a[2]; it.y = 0.02; it.on = G.t + a[3]; it.end = G.t + a[4]; }
  });
  const flags = new Map(s.pd.map((r) => [r[0], r]));
  for (const p of Object.values(G.players)) {
    const r = flags.get(p.id);
    if (r) { p.down = r[1]; p.dead = r[2]; p.out = r[3]; p.downT = r[4]; } else if (p.id !== me || p.down || p.dead) { p.down = 0; p.dead = 0; if (p.id !== me) p.out = 0; }
    if (p.id === me && r) { p.down = r[1]; p.dead = r[2]; p.out = r[3]; }
  }
  const mine = G.players[me];
  if (mine) { const held = G.items.find((it) => it.st === 1 && it.by === me); mine.item = held ? held.k : null; }
}

export function smoothMon(G, dt) {
  const M = G.mon;
  if (M.nx == null) return;
  const k = Math.min(1, dt * 8);
  M.x += (M.nx - M.x) * k; M.z += (M.nz - M.z) * k;
  M.yaw = M.yaw + wrap(M.nyaw - M.yaw) * k;
  M.ct += dt;
}

export function stepDoors(G, dt) {
  for (let i = 0; i < G.doors.length; i++) {
    const to = G.doorTo[i], cur = G.doors[i];
    if (cur !== to) { const s = dt * 2.2; G.doors[i] = Math.abs(to - cur) < s ? to : cur + Math.sign(to - cur) * s; }
  }
}

export function movePlayer(G, P, inp, dt, extra) {
  if (P.dead || P.out) return 0;
  const lv = G.lv;
  if (P.hide >= 0) { P.mv = 0; return 0; }
  let sp = P.down ? TUNE.crawl : P.cr ? TUNE.crouch : inp.run && P.stam > 0.2 ? TUNE.run : TUNE.walk;
  if (P.boost > 0) { sp *= 1.25; P.boost -= dt; }
  const mx = inp.mx || 0, mz = inp.mz || 0;
  const mag = Math.min(1, Math.hypot(mx, mz));
  const running = !P.down && !P.cr && inp.run && mag > 0.3 && P.stam > 0.2;
  P.run = running ? 1 : 0;
  if (running) P.stam = Math.max(0, P.stam - dt); else P.stam = Math.min(TUNE.stamMax, P.stam + dt * TUNE.stamRegen * (mag < 0.1 ? 1.6 : 1));
  if (mag < 0.05) { P.mv = 0; return 0; }
  const fx = Math.sin(P.yaw), fz = Math.cos(P.yaw), rx = -Math.cos(P.yaw), rz = Math.sin(P.yaw);
  const vx = (fx * -mz + rx * mx) * sp, vz = (fz * -mz + rz * mx) * sp;
  const nx = P.x + vx * dt, nz = P.z + vz * dt;
  const [cx, cz] = collideCircle(lv, nx, nz, 0.28, extra);
  const moved = Math.hypot(cx - P.x, cz - P.z);
  P.x = cx; P.z = cz;
  P.mv = moved / Math.max(dt, 1e-4);
  return P.mv;
}

export function footNoise(G, P, dt) {
  if (P.dead || P.out || P.hide >= 0 || P.mv < 0.3) { P.stepT = 0; return null; }
  P.stepT -= dt;
  if (P.stepT > 0) return null;
  const k = P.down ? 'crouch' : P.cr ? 'crouch' : P.run ? 'run' : 'walk';
  P.stepT = P.run ? 0.34 : P.cr || P.down ? 0.7 : 0.52;
  return { x: P.x, z: P.z, r: TUNE.nz[k], k };
}

export function nearestHide(G, P, fx, fz) {
  let best = null, bs = -9;
  for (const h of G.lv.hides) {
    const d = d2(h.x, h.z, P.x, P.z);
    if (d > 1.6) continue;
    if (h.k === 'locker') {
      const front = (P.x - h.x) * Math.sin(h.yaw) + (P.z - h.z) * Math.cos(h.yaw);
      if (front < 0.2) continue;
      if (Object.values(G.players).some((q) => q.id !== P.id && q.hide === h.id)) continue;
    }
    const dir = fx == null ? 1 : ((h.x - P.x) * fx + (h.z - P.z) * fz) / (d || 1);
    if (d > 0.95 && dir < 0.35) continue;
    const sc = dir - d * 0.5;
    if (sc > bs) { bs = sc; best = h; }
  }
  return best;
}

export function hideView(G, h) {
  const p = G.lv.props[h.prop];
  if (!p) return null;
  const s = PROP[p.k];
  if (p.k === 'bed') return { x: p.x, z: p.z, y: 0.16, len: s[1] };
  if (p.k === 'locker') return { x: p.x, z: p.z, y: 1.5, len: s[1] };
  return { x: p.x, z: p.z, y: 0.5, len: s[1] };
}

export function itemNear(G, P, fx, fz) {
  let best = null, bs = -1;
  for (const it of G.items) {
    if (it.st !== 0) continue;
    const d = d2(it.x, it.z, P.x, P.z);
    if (d > 2.0) continue;
    const dir = (it.x - P.x) * fx + (it.z - P.z) * fz;
    const sc = (d < 0.8 ? 1 : dir / (d || 1)) - d * 0.2;
    if (sc > bs && (d < 0.9 || dir / (d || 1) > 0.45)) { bs = sc; best = it; }
  }
  return best;
}

export function doorNear(G, P, fx, fz) {
  let best = -1, bs = -9;
  G.lv.doors.forEach((d, i) => {
    const dd = d2(d.x, d.z, P.x, P.z);
    if (dd > 2.4) return;
    const dir = ((d.x - P.x) * fx + (d.z - P.z) * fz) / (dd || 1);
    if (dir < 0.35 && dd > 0.8) return;
    const sc = dir * 1.4 - dd * 0.45;
    if (sc > bs) { bs = sc; best = i; }
  });
  return best;
}

export function lockNear(G, P) {
  const ex = G.lv.exit;
  return d2(ex.x, ex.z, P.x, P.z) < 2.6 && !G.exitOpen;
}

export function downNear(G, P) {
  for (const q of Object.values(G.players)) if (q.id !== P.id && q.down && !q.dead && d2(q.x, q.z, P.x, P.z) < 1.9) return q;
  return null;
}

export const lockPos = (G, i) => { const ex = G.lv.exit; return [ex.x - 0.32 + i * 0.32, 1.05 + (i === 1 ? 0.1 : 0), ex.z - 0.16]; };
export { d2, angTo, wrap, HURT };
