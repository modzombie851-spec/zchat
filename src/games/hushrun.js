import { m4 } from './race3d.js';
import { createHush3D } from './hush3d.js';
import { parseGeo, buildWorld, doorMatrix, doorLeafBox, LAY, meshItems, buildAO } from './hushbuild.js';
import { lineBlocked, collideCircle, WALL_H } from './hushlevel.js';
import {
  makeGame, newPlayer, hostStep, hostAction, hostRadio, hostBreath, snapOf, applySnap, smoothMon, stepDoors, movePlayer, footNoise,
  nearestHide, itemNear, doorNear, lockNear, lockPos, dynSolids, emit, TUNE, d2, angTo, wrap,
} from './hushgame.js';
import { sampleClip, blendInto, poseSkin } from './zmodel.js';
import { HA } from './hushaudio.js';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const TIER = {
  fast: { scale: 0.62, maxH: 540, sh: 0, shHQ: false, dust: 70, big: 512, small: 256, mat: false, beam: 0 },
  mid: { scale: 0.8, maxH: 760, sh: 1024, shHQ: false, dust: 140, big: 1024, small: 512, mat: true, beam: 0.003 },
  best: { scale: 1, maxH: 1080, sh: 2048, shHQ: true, dust: 220, big: 1024, small: 512, mat: true, beam: 0.004 },
};
const MONK = 1.22;
const HEAD = 5;
const RAND = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const NAMES = { key: 'key', radio: 'radio', knife: 'knife', cell: 'batteries' };
const FLASH_C = [13, 12.1, 10.4];

function animState() { return { cur: 'm_idle', t: 0, prev: null, pt: 0, fade: 1, rate: 1, prate: 1 }; }
function animPlay(S, clip, t0 = 0, fd = 0.28) { if (S.cur === clip) return; S.prev = S.cur; S.pt = S.t; S.prate = S.rate; S.cur = clip; S.t = t0; S.fade = 0; S.fd = fd; }
function animTick(S, dt) { S.t += dt * S.rate; if (S.prev) { S.pt += dt * S.prate; S.fade += dt / (S.fd || 0.28); if (S.fade >= 1) { S.prev = null; S.fade = 1; } } }

export async function createRun(canvas, o) {
  const tier = TIER[o.tier] || TIER.mid;
  const R = createHush3D(canvas, { shadow: tier.sh || 256, aa: true });
  if (!R) throw new Error('webgl');
  const A = o.assets;
  R.setGroup(0, A.alb1, tier.mat ? A.mat1 : null, 7, tier.big);
  R.setGroup(1, A.alb2, tier.mat ? A.mat2 : null, 12, tier.small);
  const geo = parseGeo(A.geo);
  const G = makeGame(o.seed, { solo: o.solo });
  const lv = G.lv;
  const world = buildWorld(R, lv, geo);
  const ao = buildAO(lv);
  R.setAO(ao.data, ao.w, ao.h, ao.x0, ao.z0, ao.sx, ao.sz);
  const monMesh = R.skinMesh(A.mon.M);
  const monTex = R.tex2d(A.mon.img);
  const monNrm = A.mon.nrm && tier.mat ? R.tex2d(A.mon.nrm, { raw: true }) : null;
  const MA = A.monA.clips;
  if (A.monA2) Object.assign(MA, A.monA2.clips);
  const MM = A.mon.M;
  const mon = { S: animState(), q: new Float32Array(MM.nb * 4), hp: [0, 0, 0], q2: new Float32Array(MM.nb * 4), hp2: [0, 0, 0], W: new Float32Array(MM.nb * 12), skin: new Float32Array(MM.nb * 12), stepD: 0, voiceT: 2, lastX: 0, lastZ: 0 };
  const surv = new Map();
  const survMesh = new Map();
  const me = o.me;
  const sp = lv.spawn[Math.max(0, o.slot || 0) % lv.spawn.length];
  G.players[me.id] = newPlayer(me.id, sp, me);
  G.players[me.id].yaw = sp.yaw == null ? Math.PI : sp.yaw;
  for (const p of o.others || []) G.players[p.id] = newPlayer(p.id, lv.spawn[(p.slot || 0) % lv.spawn.length], p);
  const P = () => G.players[me.id];
  const cam = { yaw: sp.yaw == null ? Math.PI : sp.yaw, pitch: 0, eyeY: 1.62, bob: 0, bobA: 0, shake: 0, fov: 1, scare: 0, scareT: 0, fade: 1, red: 0, roll: 0, flash: 0, sat: 1, brown: 1 };
  const inp = { mx: 0, mz: 0, run: false, cr: false, breath: false, use: false };
  const st = { useT: 0, useHold: false, entry: null, toastQ: [], hold: 0, holdT: 0, holdCd: 0, breathPlay: 0, ambT: 4, whispT: 18, scareT: RAND(35, 60), netT: 0, snapT: 0, hudT: 0, lightOn: true, battLow: false, startT: performance.now(), paused: false, endT: 0, spect: null, chaseSeen: false, tutorial: o.tutorial ? 1 : 0, scale: tier.scale, ft: 16, ftN: 0, scaleT: 0, mus: '', musT: 0, chaseHold: 0, tauntT: 0, bumpT: 0, popped: new Set() };
  const death = { on: false, t: 0 };
  const dust = new Float32Array(tier.dust * 4);
  for (let i = 0; i < tier.dust; i++) dust.set([RAND(-5, 5), RAND(0.1, 2.4), RAND(-5, 5), RAND(0.3, 1)], i * 4);
  const dustBase = [0, 0, 0];
  const dustLive = new Float32Array(dust.length);
  const isHost = () => (o.solo ? true : o.isHost());
  const net = o.net || { send() {} };
  const say = (text, k = 'info', sec = 2.6) => { st.toastQ.push({ text, k, sec, at: performance.now() }); if (st.toastQ.length > 3) st.toastQ.shift(); };
  const occ = (x, z) => (lineBlocked(lv, x, z, cam.ex || 0, cam.ez || 0) ? 1 : 0);
  const nameOf = (id) => { const q = G.players[id]; return q && q.n ? q.n : 'A friend'; };

  function hearSelf(n) {
    if (!n) return;
    if (isHost()) emit(G, n.x, n.z, n.r, n.k, me.id);
    else net.send('hn', { x: Math.round(n.x * 100) / 100, z: Math.round(n.z * 100) / 100, r: n.r, k: n.k });
  }
  function act(a) {
    if (isHost()) return hostAction(G, me.id, a);
    net.send('ha', a);
    return true;
  }
  function soundAt(name, x, z, o2 = {}) { return HA.play(name, { pos: [x, o2.y == null ? 1 : o2.y, z], vol: o2.vol == null ? 1 : o2.vol, rate: o2.rate, ref: o2.ref || 3, roll: o2.roll, max: o2.max, rev: o2.rev, at: o2.at }); }
  const headPos = () => { const M = G.mon; return [M.hx != null ? M.hx : M.x, M.hy != null ? M.hy : 2.1, M.hz != null ? M.hz : M.z]; };

  function onEvent(e) {
    const p = P();
    switch (e.e) {
      case 'roar': {
        soundAt(pick(['roar1', 'roar2']), e.x, e.z, { vol: 1.3, ref: 7, rate: RAND(0.84, 0.94), y: 2.2 });
        if (e.spot) {
          const mine = e.pid === me.id;
          const h = headPos();
          HA.play('isee', { pos: [h[0], h[1], h[2]], vol: mine ? 1.5 : 1, ref: mine ? 9 : 5, rev: 0.3, at: 0.35 });
          if (mine) { HA.play(pick(['hit2', 'hit4']), { vol: 1 }); cam.shake = Math.max(cam.shake, 0.55); st.chaseHold = 6; setMusic('chase', true); }
        }
        if (d2(e.x, e.z, p.x, p.z) < 14) cam.shake = Math.max(cam.shake, 0.35);
        break;
      }
      case 'growl': soundAt(pick(['growl1', 'growl2', 'growl3']), e.x, e.z, { vol: 0.95, ref: 4, rate: RAND(0.8, 0.92), y: 2.2 }); break;
      case 'sniff': soundAt('sniff', e.x, e.z, { vol: 0.95, ref: 3, rate: RAND(0.7, 0.85), y: 2 }); break;
      case 'slam': soundAt('slam', e.x, e.z, { vol: 1.25, ref: 5 }); soundAt('thud', e.x, e.z, { vol: 0.95, ref: 5 }); if (d2(e.x, e.z, p.x, p.z) < 10) cam.shake = Math.max(cam.shake, 0.2); break;
      case 'dopen': soundAt(pick(['dopen1', 'dopen2']), e.x, e.z, { vol: 0.85 }); soundAt(pick(['creak0', 'creak1', 'creak2']), e.x, e.z, { vol: 0.55, rate: RAND(0.8, 1) }); break;
      case 'dclose': soundAt(pick(['dclose1', 'dclose2']), e.x, e.z, { vol: 0.85 }); break;
      case 'key': {
        HA.play(pick(['keys', 'keys2']), { vol: 0.9 });
        if (e.pid === me.id || o.solo) HA.play('hit5', { vol: 0.5 });
        const left = 3 - e.n;
        say(e.pid === me.id ? (left === 0 ? 'All keys found. Get to the exit' : left === 1 ? 'You found a key. One left' : 'You found a key. Two left') : `${nameOf(e.pid)} found a key. ${left === 0 ? 'Get to the exit' : left === 1 ? 'One left' : 'Two left'}`, 'key', 3.2);
        break;
      }
      case 'cell': if (e.pid === me.id) { HA.play('mclick', { vol: 0.9 }); say('New batteries', 'info'); } break;
      case 'item':
        if (e.pid === me.id) {
          HA.play('grab', { vol: 0.9 });
          if (e.k === 'radio') say('You have a radio. Drop it to lure it away', 'info', 3.4);
          if (e.k === 'knife') say('You have a knife. It saves you once', 'info', 3.4);
        }
        break;
      case 'radio': soundAt('drop', e.x, e.z, { vol: 0.8, y: 0.2 }); break;
      case 'smash': soundAt('tin', e.x, e.z, { vol: 1.1, y: 0.3 }); soundAt('snarl', e.x, e.z, { vol: 1, y: 2, ref: 4 }); break;
      case 'lock': HA.play('latch', { vol: 1 }); HA.play('clank1', { vol: 0.7 }); say(G.locks.reduce((s, v) => s + v, 0) >= 3 ? 'The last lock is open' : 'A lock is open', 'key'); break;
      case 'exit': soundAt('gate', lv.exit.x, lv.exit.z, { vol: 1.2, ref: 6 }); HA.play('hit3', { vol: 0.6 }); say('The exit is open. Get out', 'key', 4); break;
      case 'catch':
        if (e.pid === me.id) startDeath(e);
        else {
          const q = G.players[e.pid];
          const qx = q ? q.x : e.px, qz = q ? q.z : e.pz;
          soundAt(pick(['scream1', 'scream2', 'scream3', 'scream4']), qx, qz, { vol: 1.3, ref: 6 });
          soundAt('body0', qx, qz, { vol: 1.1, ref: 5, at: 0.5 });
          soundAt(pick(['crunch1', 'crunch2']), qx, qz, { vol: 1.1, ref: 5, at: 0.55 });
          soundAt('gore', qx, qz, { vol: 0.9, ref: 4, at: 0.6 });
          if (q) { q.dead = 1; q.fly = { t: 0, a: e.a || 0 }; }
          say(`${nameOf(e.pid)} is dead`, 'bad', 3.4);
        }
        break;
      case 'stab':
        soundAt(pick(['stab', 'stab2']), e.x, e.z, { vol: 1.25 });
        soundAt('roar1', e.x, e.z, { vol: 1.25, rate: 1.1, y: 2.2 });
        if (e.pid === me.id) { p.boost = 3; cam.shake = 0.6; cam.red = 0.25; say('You stabbed it. Run', 'key', 3); }
        break;
      case 'out': if (e.pid === me.id) HA.play('hit3', { vol: 0.5 }); else say(`${nameOf(e.pid)} got out`, 'key', 3); break;
      case 'won': if (!st.endWant) st.endWant = { k: 'won', at: performance.now() + 1800 }; break;
      case 'lost': if (!st.endWant) st.endWant = { k: 'lost', at: death.on ? Infinity : performance.now() + 1400 }; break;
      default: break;
    }
  }

  function startDeath(e) {
    const p = P();
    const a = e.a != null ? e.a : angTo(G.mon.x, G.mon.z, p.x, p.z);
    Object.assign(death, { on: true, t: 0, x: cam.ex, y: cam.ey, z: cam.ez, cx: null, cy: null, cz: null, vx: 0, vy: 0, vz: 0, dx: Math.sin(a), dz: Math.cos(a), flying: false, landed: false, wall: false, roll: 0, vroll: 0, pitch: 0, vp: 0, yaw: wrap(a + Math.PI), stage: 0 });
    cam.scare = 1; cam.scareT = 0;
    HA.duck(0.4, 0.25);
    HA.play('hit1', { vol: 1.35 });
    const h = headPos();
    HA.play(pick(['roar1', 'roar2']), { pos: h, vol: 1.6, rate: 0.86, ref: 9 });
    HA.play(pick(['breath2', 'breath4']), { vol: 0.9 });
    cam.shake = 1.1; cam.flash = 0.6;
    setMusic('', true);
    if (navigator.vibrate) { try { navigator.vibrate([80, 60, 200]); } catch {} }
  }

  function stepDeath(dt) {
    const d = death;
    d.t += dt;
    const M = G.mon;
    if (d.stage === 0) {
      const h = headPos();
      const my = G.mon.yaw;
      const gx = h[0] + Math.sin(my) * 0.66, gz = h[2] + Math.cos(my) * 0.66, gy = Math.max(0.9, h[1] + 0.06);
      const kk = Math.min(1, dt * (d.t < 0.1 ? 4 : 10));
      if (d.cx == null) { d.cx = d.x; d.cz = d.z; d.cy = d.y; }
      d.cx += (gx - d.cx) * kk; d.cz += (gz - d.cz) * kk; d.cy += (gy - d.cy) * kk;
      const ty = angTo(d.cx, d.cz, h[0], h[2]);
      const tp = Math.atan2(h[1] + 0.1 - d.cy, Math.max(0.2, d2(d.cx, d.cz, h[0], h[2])));
      d.yaw = wrap(d.yaw + wrap(ty - d.yaw) * Math.min(1, dt * 14));
      d.pitch += (tp - d.pitch) * Math.min(1, dt * 14);
      if (d.t >= 0.8) {
        d.stage = 1;
        d.x = d.cx; d.z = d.cz; d.y = d.cy;
        d.vx = d.dx * 7.2; d.vz = d.dz * 7.2; d.vy = 2.6;
        d.vroll = (Math.random() < 0.5 ? -1 : 1) * 7.5; d.vp = -6;
        HA.play('body0', { vol: 1.5 });
        HA.play('crunch1', { vol: 1.4, at: 0.02 });
        HA.play('gore', { vol: 1.1, at: 0.05 });
        HA.play('whoosh', { vol: 0.9, at: 0.08 });
        HA.play(pick(['scream3', 'scream4']), { vol: 0.75, at: 0.06, rate: 1.05 });
        cam.shake = 1.4; cam.flash = 0.8; cam.red = 0.55;
        if (navigator.vibrate) { try { navigator.vibrate(160); } catch {} }
      }
      return;
    }
    if (d.stage === 1) {
      d.vy -= 15 * dt;
      const nx = d.x + d.vx * dt, nz = d.z + d.vz * dt;
      const [cx, cz] = collideCircle(lv, nx, nz, 0.22);
      const hitWall = Math.hypot(cx - nx, cz - nz) > 0.03;
      d.x = cx; d.z = cz; d.y += d.vy * dt;
      d.roll += d.vroll * dt; d.pitch += d.vp * dt; d.yaw += d.vroll * 0.15 * dt;
      if (hitWall && !d.wall) {
        d.wall = true;
        d.vx *= -0.12; d.vz *= -0.12; d.vy = Math.min(d.vy, 0.4);
        HA.play('body1', { vol: 1.4 }); HA.play('crunch2', { vol: 1.3, at: 0.03 }); HA.play('thud', { vol: 1.2 });
        cam.shake = 1.3; cam.flash = 0.7; d.vroll *= -0.5;
      }
      if (d.y <= 0.16 || d.t > 3.2) {
        d.y = 0.16; d.stage = 2; d.landT = d.t;
        HA.play('body2', { vol: 1.3 }); HA.play(pick(['bone1', 'bone2']), { vol: 1.3, at: 0.04 }); HA.play('thud', { vol: 1 });
        cam.shake = 1; cam.flash = 0.5;
        d.vroll = 0; d.vp = 0;
      }
      return;
    }
    const k = Math.min(1, dt * 3);
    const h = headPos();
    const ty = angTo(d.x, d.z, h[0], h[2]);
    d.roll += ((d.roll > 0 ? 1.25 : -1.25) - d.roll) * k;
    d.yaw = wrap(d.yaw + wrap(ty - d.yaw) * dt * 1.2);
    d.pitch += (0.28 - d.pitch) * k;
    const since = d.t - d.landT;
    if (since > 0.9 && !d.g1) { d.g1 = 1; HA.play(pick(['breath0', 'breath3']), { vol: 0.7, rate: 0.85 }); }
    if (since > 2.0 && !d.g2) { d.g2 = 1; HA.play('crunch1', { vol: 0.9 }); HA.play(pick(['laugh1', 'laugh2']), { pos: h, vol: 0.85, ref: 6, rate: 0.85 }); }
    if (since > 2.6 && !d.g3) { d.g3 = 1; HA.stopLoop('heart', 1.8); setMusic('dead', true); }
    if (since > 3.6 && st.endWant && st.endWant.at === Infinity) st.endWant.at = performance.now();
  }

  function endRound(k) {
    if (st.endT) return;
    st.endT = performance.now();
    const p = P();
    HA.stopLoop('heart', 2);
    if (k === 'won') { HA.play('win', { vol: 0.9, at: 1.2 }); setMusic('', true); } else if (!death.on) setMusic('dead', true);
    if (o.onEnd) o.onEnd({ k, me: p.out ? 'out' : p.dead ? 'down' : 'in', t: Math.round((performance.now() - st.startT) / 1000), keys: G.keys, team: Object.values(G.players).map((q) => ({ id: q.id, n: q.n, out: q.out, dead: q.dead })) });
  }

  function target(p, fx, fz) {
    if (p.dead || p.out) return null;
    if (p.hide >= 0) return { k: 'unhide', label: 'Get out' };
    if (lockNear(G, p)) {
      const open = G.locks.reduce((s, v) => s + v, 0);
      if (G.keys > open) return { k: 'unlock', label: 'Unlock', hold: TUNE.unlockT, i: G.locks.indexOf(0), key: `u${open}` };
      return { k: 'none', label: G.keys >= 3 ? 'Unlock' : 'Find keys' };
    }
    const it = itemNear(G, p, fx, fz);
    if (it) return { k: 'pick', id: it.id, label: `Pick up ${NAMES[it.k]}` };
    const di = doorNear(G, p, fx, fz);
    const h = nearestHide(G, p, fx, fz);
    if (di >= 0 && h) {
      const d = lv.doors[di];
      const dd = d2(d.x, d.z, p.x, p.z), hd = d2(h.x, h.z, p.x, p.z);
      const ddir = ((d.x - p.x) * fx + (d.z - p.z) * fz) / (dd || 1), hdir = ((h.x - p.x) * fx + (h.z - p.z) * fz) / (hd || 1);
      if (hdir - hd * 0.5 > ddir * 1.4 - dd * 0.45 + 0.25) return { k: 'hide', id: h.id, label: 'Hide' };
    }
    if (di >= 0) return { k: 'door', id: di, label: G.doorTo[di] > 0.5 ? 'Close door' : 'Open door' };
    if (h) return { k: 'hide', id: h.id, label: 'Hide' };
    return null;
  }

  function doUse(tg, p) {
    if (!tg) return;
    if (tg.k === 'door') { act({ k: 'door', id: tg.id }); return; }
    if (tg.k === 'pick') { act({ k: 'pick', id: tg.id }); return; }
    if (tg.k === 'hide') {
      const h = lv.hides[tg.id];
      st.entry = { x: p.x, z: p.z };
      p.hide = h.id;
      const pr = lv.props[h.prop];
      const lx = Math.cos(pr.yaw), lz = -Math.sin(pr.yaw);
      const side = ((p.x - h.x) * lx + (p.z - h.z) * lz) >= 0 ? 1 : -1;
      const off = pr.k === 'bed' ? 0.3 : 0.15;
      st.hv = { x: h.x + lx * side * off, z: h.z + lz * side * off, y: pr.k === 'bed' ? 0.12 : 0.5, yaw: Math.atan2(lx * side, lz * side) };
      cam.yaw = st.hv.yaw; cam.pitch = pr.k === 'bed' ? 0.02 : 0;
      HA.play('cloth', { vol: 0.8 });
      if (st.tutorial === 1) say('Hold your breath when it gets close', 'info', 3.4);
      return;
    }
    if (tg.k === 'unhide') {
      p.hide = -1;
      if (st.entry) { p.x = st.entry.x; p.z = st.entry.z; }
      HA.play('cloth', { vol: 0.8 });
      return;
    }
    if (tg.k === 'unlock') act({ k: 'unlock', i: tg.i });
  }

  function setMusic(k, now) {
    if (k === st.mus && !now) return;
    st.mus = k;
    const lv2 = k === 'chase' ? { chase: 0.85, hunt: 0.08 } : k === 'hunt' ? { hunt: 0.62, explore: 0.1 } : k === 'explore' ? { explore: 0.42 } : k === 'dead' ? { dead: 0.75 } : null;
    HA.music(lv2, k === 'chase' ? 0.6 : k === 'dead' ? 2.5 : 2.2);
  }

  const api = {
    G,
    look(dx, dy) {
      const p = P();
      if (!p || cam.scare || death.on) return;
      const k = 0.0042 * (st.sens || o.sens || 1);
      cam.yaw = wrap(cam.yaw - dx * k);
      cam.pitch = clamp(cam.pitch - dy * k, -1.3, 1.25);
      if (p.hide >= 0 && st.hv) { const rel = clamp(wrap(cam.yaw - st.hv.yaw), -1.25, 1.25); cam.yaw = wrap(st.hv.yaw + rel); cam.pitch = clamp(cam.pitch, -0.35, st.hv.y < 0.2 ? 0.16 : 0.45); }
    },
    move(x, y) { inp.mx = x; inp.mz = y; },
    run(b) { inp.run = !!b; },
    crouch(b) { inp.cr = b == null ? !inp.cr : !!b; HA.play('cloth', { vol: 0.35 }); return inp.cr; },
    light() { const p = P(); if (!p || p.bat <= 0) { HA.play('mclick', { vol: 0.6 }); return false; } st.lightOn = !st.lightOn; HA.play('click', { vol: 0.9 }); hearSelf({ x: p.x, z: p.z, r: TUNE.nz.flash, k: 'flash' }); return st.lightOn; },
    breath(b) { inp.breath = !!b; },
    use(b) {
      const p = P();
      if (!p) return;
      inp.use = !!b;
      if (b) {
        const tg = st.target;
        if (tg && !tg.hold && tg.k !== 'none') doUse(tg, p);
        if (tg && tg.hold) { st.useHold = true; st.useT = 0; st.useKey = tg.key; }
      } else { st.useHold = false; st.useT = 0; }
    },
    item() {
      const p = P();
      if (!p || p.item !== 'radio' || p.dead || p.hide >= 0) return;
      const fx = Math.sin(cam.yaw), fz = Math.cos(cam.yaw);
      act({ k: 'radio', x: Math.round((p.x + fx * 0.5) * 100) / 100, z: Math.round((p.z + fz * 0.5) * 100) / 100 });
    },
    talk() { const p = P(); if (!p || p.dead || p.out) return; const now = performance.now(); if (now - (st.talkAt || 0) < 700) return; st.talkAt = now; hearSelf({ x: p.x, z: p.z, r: p.hide >= 0 ? TUNE.nz.talk * 0.7 : TUNE.nz.talk, k: 'talk' }); },
    pause(b) { st.paused = !!b; },
    setSens(v) { st.sens = v; },
    netIn(t, m) {
      const from = m.from;
      if (t === 'hp') {
        if (!from || from === me.id) return;
        let q = G.players[from];
        if (!q) { q = G.players[from] = newPlayer(from, lv.spawn[(m.sl || 0) % lv.spawn.length], { n: m.n, sv: m.sv }); }
        q.tx = m.x; q.tz = m.z; q.yaw = m.y; q.pitch = m.p || 0; q.cr = m.c ? 1 : 0; q.hide = m.h == null ? -1 : m.h; q.fl = m.f ? 1 : 0; q.run = m.r ? 1 : 0; q.mv = m.v || 0; q.at = performance.now();
        if (m.n) q.n = m.n;
        if (m.sv != null) q.sv = m.sv;
        if (q.x == null || d2(q.x, q.z, m.x, m.z) > 5) { q.x = m.x; q.z = m.z; }
        q.hold = m.b ? 1 : 0;
        return;
      }
      if (t === 'hs') { if (!isHost()) applySnap(G, m.s, me.id); return; }
      if (t === 'he') { if (!isHost() && Array.isArray(m.ev)) for (const e of m.ev) onEvent(e); return; }
      if (t === 'hn') { if (isHost() && from) emit(G, Number(m.x) || 0, Number(m.z) || 0, Math.min(30, Number(m.r) || 1), String(m.k || 'walk'), from); return; }
      if (t === 'ha') { if (isHost() && from && m && typeof m.k === 'string') hostAction(G, from, m); return; }
      if (t === 'bye') { if (from && G.players[from]) delete G.players[from]; }
    },
    dropPeer(id) { if (G.players[id] && id !== me.id) delete G.players[id]; },
    state() { return { phase: G.phase }; },
    dispose() { stop = true; cancelAnimationFrame(raf); HA.stopAll(); R.dispose(); },
    resize() { fit(); },
    get scale() { return st.scale; },
    setScale(v) { st.scale = v; st.lock = true; fit(); },
  };

  function fit() {
    const cw = canvas.clientWidth || 640, chh = canvas.clientHeight || 360;
    const dpr = Math.min((typeof window !== 'undefined' && window.devicePixelRatio) || 1, 2.5);
    let w = cw * dpr * st.scale, h = chh * dpr * st.scale;
    const lim = tier.maxH;
    const short = Math.min(w, h);
    if (short > lim) { const k = lim / short; w *= k; h *= k; }
    R.resize(Math.max(64, Math.round(w)), Math.max(64, Math.round(h)));
  }
  fit();

  HA.loop('amb', { vol: 0.4, fade: 3 });
  HA.loop('drip', { vol: 0.18, fade: 4 });
  HA.loop('hum', { vol: 0.12, fade: 4 });
  HA.loop('heart', { vol: 0, fade: 0.2 });
  HA.dropMusic(['explore', 'hunt', 'chase', 'dead']);
  setMusic('explore', true);

  let raf = 0, last = performance.now(), stop = false;
  const frame = (now) => {
    if (stop) return;
    raf = requestAnimationFrame(frame);
    if (R.lost()) return;
    let dt = (now - last) / 1000;
    last = now;
    if (dt <= 0 || (st.paused && o.solo && !death.on && !st.endT)) return;
    budget(dt);
    if (dt > 0.1) dt = 0.1;
    try { step(dt, now); } catch (err) { if (o.onError) o.onError(err); stop = true; }
  };
  raf = requestAnimationFrame(frame);

  function budget(dt) {
    const ms = dt * 1000;
    st.ft += (ms - st.ft) * 0.05;
    st.scaleT += dt;
    if (st.scaleT < 2.5 || st.lock) return;
    if (st.ft > 26 && st.scale > 0.5) { st.scale = Math.max(0.5, st.scale - 0.08); st.scaleT = 0; fit(); }
    else if (st.ft < 15 && st.scale < tier.scale) { st.scale = Math.min(tier.scale, st.scale + 0.05); st.scaleT = -2; fit(); }
  }

  function step(dt, now) {
    const p = P();
    if (st.endWant && performance.now() >= st.endWant.at && !st.endT) endRound(st.endWant.k);
    const host = isHost();
    const fx = Math.sin(cam.yaw), fz = Math.cos(cam.yaw);
    p.yaw = cam.yaw; p.pitch = cam.pitch;
    if (!p.dead && !p.out && !cam.scare && !st.paused) {
      if (inp.cr !== !!p.cr) p.cr = inp.cr ? 1 : 0;
      const extra = dynSolids(G, doorLeafBox);
      const px = p.x, pz = p.z;
      movePlayer(G, p, { mx: inp.mx, mz: inp.mz, run: inp.run }, dt, extra);
      doorAssist(p, px, pz, dt, extra);
      hearSelf(footNoise(G, p, dt));
      if (p.mv > 0.3 && p.hide < 0) {
        p.stepS = (p.stepS || 0) - dt;
        if (p.stepS <= 0) { p.stepS = p.run ? 0.34 : p.cr ? 0.62 : 0.5; HA.play(`step${Math.floor(Math.random() * 9)}`, { vol: p.run ? 0.75 : p.cr ? 0.22 : 0.45, rate: RAND(0.92, 1.06) }); }
      }
    } else p.mv = 0;
    if (st.lightOn && !p.dead && !p.out) {
      p.bat = Math.max(0, p.bat - dt);
      if (p.bat <= 0) { st.lightOn = false; say('Your light died. Find batteries', 'bad', 3.4); HA.play('mclick', { vol: 0.7 }); }
      else if (p.bat < 35 && !st.battLow) { st.battLow = true; say('Your light is dying', 'bad'); }
    }
    if (p.bat > 35) st.battLow = false;
    p.fl = st.lightOn ? 1 : 0;
    holdBreath(p, dt);
    const tg = target(p, fx, fz);
    if (st.useHold) {
      if (!tg || tg.key !== st.useKey || !inp.use) { st.useHold = false; st.useT = 0; }
      else {
        st.useT += dt;
        st.clankT = (st.clankT || 0) - dt;
        if (st.clankT <= 0) { st.clankT = 0.85; HA.play(pick(['clank1', 'clank2']), { vol: 0.75, rate: RAND(0.9, 1.1) }); hearSelf({ x: p.x, z: p.z, r: TUNE.nz.lock, k: 'lock' }); }
        if (st.useT >= tg.hold) { st.useHold = false; st.useT = 0; doUse(tg, p); }
      }
    }
    st.target = tg;
    if (G.exitOpen && !p.out && !p.dead && p.z > lv.exit.z + 0.4) { act({ k: 'out' }); p.out = 1; st.lightOn = false; }
    if (host) {
      hostBreath(G, dt);
      hostRadio(G);
      hostStep(G, dt);
      if (G.ev.length) {
        const evs = G.ev.splice(0).filter((e) => e.e !== 'nz');
        for (const e of evs) onEvent(e);
        if (!o.solo && evs.length) net.send('he', { ev: evs });
      }
      st.snapT -= dt;
      if (!o.solo && st.snapT <= 0) { st.snapT = 0.125; net.send('hs', { s: snapOf(G) }); }
    } else {
      G.t += dt;
      stepDoors(G, dt);
      smoothMon(G, dt);
      G.ev.length = 0;
    }
    if (host) stepDoors(G, 0);
    for (const q of Object.values(G.players)) {
      if (q.id === me.id || q.tx == null || q.dead) continue;
      const k = Math.min(1, dt * 10);
      q.x += (q.tx - q.x) * k; q.z += (q.tz - q.z) * k;
    }
    st.netT -= dt;
    if (!o.solo && st.netT <= 0) {
      st.netT = 0.1;
      net.send('hp', { x: Math.round(p.x * 100) / 100, z: Math.round(p.z * 100) / 100, y: Math.round(cam.yaw * 100) / 100, p: Math.round(cam.pitch * 100) / 100, c: p.cr ? 1 : 0, h: p.hide, f: p.fl, r: p.run, v: Math.round(p.mv * 10) / 10, b: p.hold ? 1 : 0, n: me.n, sv: me.sv, sl: o.slot || 0 });
    }
    if (death.on) stepDeath(dt);
    camera(p, dt);
    audio(p, dt);
    scares(p, dt);
    render(p, dt, now);
    st.hudT -= dt;
    if (st.hudT <= 0 && o.onHud) {
      st.hudT = 0.12;
      const M = G.mon;
      const dm = d2(M.x, M.z, p.x, p.z);
      while (st.toastQ.length && performance.now() - st.toastQ[0].at > st.toastQ[0].sec * 1000) st.toastQ.shift();
      o.onHud({
        keys: G.keys, locks: G.locks.reduce((s, v) => s + v, 0), bat: p.bat / TUNE.battery, light: st.lightOn, stam: p.stam / TUNE.stamMax, item: p.item,
        prompt: tg ? tg.label : '', can: !!tg && tg.k !== 'none', hold: tg && tg.hold ? (st.useHold ? st.useT / tg.hold : 0) : -1, tk: tg ? tg.k : '',
        hidden: p.hide >= 0, dead: !!p.dead, out: !!p.out, cr: !!p.cr, breath: st.hold, breathT: st.holdT / TUNE.breathMax, breathCd: st.holdCd > 0,
        near: dm < 9 ? 1 - dm / 9 : 0, scare: !!cam.scare || death.on, toasts: st.toastQ.map((t) => ({ text: t.text, k: t.k, at: t.at })), phase: G.phase, spect: st.spect ? nameOf(st.spect) : '',
        team: Object.values(G.players).filter((q) => q.id !== me.id).map((q) => ({ id: q.id, n: q.n, dead: !!q.dead, out: !!q.out })),
      });
    }
  }

  function doorAssist(p, px, pz, dt, extra) {
    if (p.mv < 0.2 || p.hide >= 0) { st.bumpT = 0; return; }
    const mx = p.x - px, mz = p.z - pz;
    const ml = Math.hypot(mx, mz);
    let best = -1, bd = 1.3;
    lv.doors.forEach((d, i) => { const dd = d2(d.x, d.z, p.x, p.z); if (dd < bd) { bd = dd; best = i; } });
    if (best < 0) { st.bumpT = 0; return; }
    const d = lv.doors[best];
    const along = d.h ? p.x - d.x : p.z - d.z;
    const across = d.h ? p.z - d.z : p.x - d.x;
    const open = G.doors[best] > 0.55;
    const wantIn = (inp.mz < -0.3 || Math.abs(inp.mx) > 0.3);
    if (open && Math.abs(across) < 1.1 && Math.abs(along) > 0.04 && Math.abs(along) < 0.5 && wantIn) {
      const fx = Math.sin(cam.yaw), fz = Math.cos(cam.yaw);
      const toward = d.h ? Math.sign(-across) * fz : Math.sign(-across) * fx;
      if (toward > 0.3) {
        const k = Math.min(Math.abs(along), dt * 1.6) * Math.sign(along);
        const nx = d.h ? p.x - k : p.x, nz = d.h ? p.z : p.z - k;
        const [cx, cz] = collideCircle(lv, nx, nz, 0.28, extra);
        p.x = cx; p.z = cz;
      }
    }
    if (!open && G.doorTo[best] < 0.5 && Math.abs(across) < 0.75 && Math.abs(along) < 0.42 && ml < p.mv * dt * 0.5 && wantIn) {
      st.bumpT += dt;
      if (st.bumpT > 0.22) { st.bumpT = -1.2; act({ k: 'door', id: best }); }
    } else if (st.bumpT > 0) st.bumpT = 0;
    else if (st.bumpT < 0) st.bumpT = Math.min(0, st.bumpT + dt);
  }

  function holdBreath(p, dt) {
    st.holdCd = Math.max(0, st.holdCd - dt);
    if (inp.breath && !st.hold && st.holdCd <= 0 && !p.dead && !p.out) { st.hold = 1; st.holdT = 0; }
    if (st.hold) {
      st.holdT += dt;
      if (!inp.breath || st.holdT >= TUNE.breathMax) {
        const long = st.holdT >= TUNE.breathMax * 0.75;
        st.hold = 0;
        st.holdCd = long ? 3 : 0.8;
        if (long) { HA.play(pick(['breath2', 'breath4']), { vol: 1 }); hearSelf({ x: p.x, z: p.z, r: TUNE.nz.gasp, k: 'gasp' }); }
        inp.breath = false;
      }
    } else st.holdT = Math.max(0, st.holdT - dt * 2);
    p.hold = st.hold ? 1 : 0;
  }

  function camera(p, dt) {
    const M = G.mon;
    let ex = p.x, ez = p.z, ey;
    const crouchY = 1.08, standY = 1.62;
    let want = p.cr ? crouchY : standY;
    if (p.hide >= 0 && st.hv) { want = st.hv.y; ex = st.hv.x; ez = st.hv.z; }
    if (p.hide >= 0 && st.hv && cam.eyeY > 0.6) cam.eyeY += (want - cam.eyeY) * 0.5;
    cam.eyeY += (want - cam.eyeY) * Math.min(1, dt * (p.hide >= 0 ? 6 : 9));
    const sp = p.mv;
    cam.bobA += dt * (sp > 0.2 ? (p.run ? 12.5 : p.cr ? 6 : 8.5) : 0);
    const bobAmp = p.hide >= 0 ? 0 : sp > 0.2 ? (p.run ? 0.05 : p.cr ? 0.018 : 0.028) : 0;
    cam.bob += (bobAmp - cam.bob) * Math.min(1, dt * 6);
    ey = cam.eyeY + Math.sin(cam.bobA) * cam.bob;
    cam.shake = Math.max(0, cam.shake - dt * 1.4);
    cam.flash = Math.max(0, cam.flash - dt * 2.2);
    let yaw = cam.yaw, pitch = cam.pitch, roll = Math.sin(cam.bobA * 0.5) * cam.bob * 0.35;
    if (death.on) {
      cam.scareT += dt;
      if (death.stage === 0) { ex = death.cx != null ? death.cx : death.x; ez = death.cz != null ? death.cz : death.z; ey = death.cy != null ? death.cy : death.y; }
      else { ex = death.x; ez = death.z; ey = death.y; }
      yaw = death.yaw; pitch = death.pitch; roll = death.roll;
      cam.yaw = yaw; cam.pitch = clamp(pitch, -1.3, 1.25);
    } else if (cam.scare) cam.scare = 0;
    if (!death.on && (p.dead || p.out)) {
      const alive = Object.values(G.players).filter((q) => q.id !== me.id && !q.dead && !q.out);
      const s = alive.find((q) => q.id === st.spect) || alive[0];
      st.spect = s ? s.id : null;
      if (s) { ex = s.x; ez = s.z; ey = s.cr ? crouchY : standY; yaw = s.yaw; pitch = s.pitch || 0; roll = 0; }
    }
    const sk = cam.shake * cam.shake;
    yaw += (Math.random() - 0.5) * sk * 0.1; pitch += (Math.random() - 0.5) * sk * 0.1; roll += (Math.random() - 0.5) * sk * 0.06;
    cam.ex = ex; cam.ey = ey; cam.ez = ez; cam.vy = yaw; cam.vp = pitch; cam.roll = roll;
    cam.red = Math.max(death.on ? 0.18 + Math.min(0.3, death.t * 0.08) : 0, cam.red - dt * 0.25);
    cam.sat = death.on ? Math.max(0.15, 1 - death.t * 0.22) : Math.min(1, cam.sat + dt);
    const fading = death.on && death.stage === 2 ? clamp((death.t - death.landT - 2.4) / 1.6, 0, 1) : 0;
    cam.fade = st.endT ? Math.max(fading, Math.min(1, (performance.now() - st.endT) / 2600) * 0.85) : Math.max(fading, cam.fade - dt * 0.8);
    if (death.on && death.t > 6.5 && !o.solo && st.spect) { death.on = false; cam.fade = 0.6; cam.red = 0; }
  }

  function audio(p, dt) {
    const M = G.mon;
    HA.setListener(cam.ex, cam.ey, cam.ez, cam.vy, occ);
    const dm = d2(M.x, M.z, cam.ex, cam.ez);
    const fear = clamp(1 - dm / 15, 0, 1);
    if (!death.on) HA.loopVol('heart', fear > 0.05 && !p.dead && !p.out ? 0.22 + fear * 0.85 : 0, 0.85 + fear * 0.75);
    HA.loopVol('amb', 0.42 - fear * 0.2);
    mon.stepD += Math.hypot(M.x - mon.lastX, M.z - mon.lastZ);
    mon.lastX = M.x; mon.lastZ = M.z;
    const stride = M.clip === 'm_run' ? 1.6 : 1.1;
    if (mon.stepD > stride) {
      mon.stepD = 0;
      soundAt(`mstep${Math.floor(Math.random() * 4)}`, M.x, M.z, { vol: M.clip === 'm_run' ? 1.2 : 0.85, rate: RAND(0.6, 0.72), y: 0.1, ref: 3.5 });
    }
    mon.voiceT -= dt;
    if (mon.voiceT <= 0) {
      const sts = M.st;
      if (sts === 'chase') { mon.voiceT = RAND(1.6, 2.8); soundAt(pick(['growl1', 'growl2', 'growl3', 'snarl']), M.x, M.z, { vol: 1.1, rate: RAND(0.82, 0.92), y: 2.2, ref: 4 }); }
      else if (sts === 'search' || sts === 'hunt') { mon.voiceT = RAND(1.8, 3.4); soundAt(pick(['sniff', 'groan4', 'groan3']), M.x, M.z, { vol: 0.9, rate: RAND(0.7, 0.84), y: 2, ref: 3 }); }
      else if (sts === 'attack' || sts === 'roar' || sts === 'stun' || sts === 'smash') mon.voiceT = 1.5;
      else { mon.voiceT = RAND(3.5, 7.5); soundAt(pick(['groan1', 'groan2', 'groan3', 'growl4']), M.x, M.z, { vol: 0.8, rate: RAND(0.76, 0.88), y: 2, ref: 3 }); }
    }
    if (!death.on && !p.dead && !p.out) {
      const chasing = (M.st === 'chase' || M.st === 'roar' || M.st === 'attack') && (M.chaseId === me.id || dm < 14);
      if (chasing) st.chaseHold = Math.max(st.chaseHold, 4);
      st.chaseHold = Math.max(0, st.chaseHold - dt);
      const hunting = ((M.st === 'hunt' || M.st === 'search') && dm < 15) || dm < 7;
      setMusic(st.chaseHold > 0 ? 'chase' : hunting ? 'hunt' : 'explore');
      if (M.st === 'chase' && !st.chaseSeen && dm < 16) { st.chaseSeen = true; HA.play(pick(['hit2', 'hit4']), { vol: 0.8 }); }
      if (M.st !== 'chase') st.chaseSeen = false;
    }
    st.breathPlay -= dt;
    if (st.breathPlay <= 0 && !p.dead && !p.out && !st.hold && !death.on) {
      const tired = p.stam < TUNE.stamMax * 0.45;
      if (fear > 0.55 || tired) { st.breathPlay = RAND(1.3, 1.9); HA.play(`breath${Math.floor(Math.random() * 6)}`, { vol: fear > 0.55 ? 0.6 : 0.36, rate: RAND(0.95, 1.05) }); }
      else st.breathPlay = 0.5;
    }
    st.ambT -= dt;
    if (st.ambT <= 0) {
      st.ambT = RAND(5, 12);
      const a = Math.random() * Math.PI * 2, r = RAND(6, 16);
      const ax = cam.ex + Math.sin(a) * r, az = cam.ez + Math.cos(a) * r;
      const k = Math.random();
      if (k < 0.32) soundAt(`drip${Math.floor(Math.random() * 4)}`, ax, az, { vol: 0.7, y: RAND(0.5, 2.4) });
      else if (k < 0.55) soundAt(`creak${Math.floor(Math.random() * 3)}`, ax, az, { vol: 0.65, rate: RAND(0.7, 0.95) });
      else if (k < 0.7) soundAt('knock', ax, az, { vol: 0.5, rate: RAND(0.8, 1) });
      else if (k < 0.82) soundAt(pick(['moan1', 'moan2']), ax, az, { vol: 0.35, rate: RAND(0.7, 0.85) });
      else soundAt(pick(['sting1', 'sting2', 'sting3']), ax, az, { vol: 0.45, rate: RAND(0.8, 1) });
    }
    st.whispT -= dt;
    if (st.whispT <= 0) {
      st.whispT = RAND(22, 45);
      const a = Math.random() * Math.PI * 2;
      HA.play(`whisper${Math.floor(Math.random() * 6)}`, { pos: [cam.ex + Math.sin(a) * 2.5, 1.6, cam.ez + Math.cos(a) * 2.5], vol: 0.35, rate: RAND(0.85, 1) });
    }
    for (const it of G.items) {
      if (it.k !== 'radio') continue;
      if (it.st === 3 && G.t >= it.on && G.t < it.end) {
        it.wT = (it.wT || 0) - dt;
        if (it.wT <= 0) { it.wT = RAND(2.4, 3.4); HA.play(`whisper${Math.floor(Math.random() * 6)}`, { pos: [it.x, 0.3, it.z], vol: 1.4, radio: true, rate: RAND(0.9, 1.1), ref: 5 }); }
      }
    }
    HA.tick();
  }

  function scares(p, dt) {
    if (p.dead || p.out || death.on) return;
    const M = G.mon;
    const dm = d2(M.x, M.z, p.x, p.z);
    st.tauntT -= dt;
    if (p.hide >= 0 && dm < 3.8 && (M.st === 'search' || M.st === 'hunt') && st.tauntT <= 0) {
      st.tauntT = RAND(18, 28);
      const h = headPos();
      HA.play('iseew', { pos: h, vol: 1.2, ref: 4, rev: 0.25 });
      cam.shake = Math.max(cam.shake, 0.15);
    }
    for (const l of lv.lamps) {
      if (!l.mode || st.popped.has(l)) continue;
      if (d2(M.x, M.z, l.x, l.z) < 2.2 && d2(p.x, p.z, l.x, l.z) < 14 && Math.random() < dt * 0.6) {
        st.popped.add(l);
        l.dieT = G.t;
        soundAt('tin', l.x, l.z, { y: 2.4, vol: 1.1, rate: 0.7 });
        soundAt(pick(['sting1', 'sting2']), l.x, l.z, { y: 2.4, vol: 0.7 });
      }
    }
    st.scareT -= dt;
    if (st.scareT <= 0) {
      st.scareT = RAND(40, 75);
      if (dm > 12 && M.st !== 'chase') {
        const k = Math.random();
        const a = cam.vy + Math.PI + RAND(-0.9, 0.9), r = RAND(5, 9);
        const ax = cam.ex + Math.sin(a) * r, az = cam.ez + Math.cos(a) * r;
        if (k < 0.4) { soundAt('slam', ax, az, { vol: 1.3, ref: 5 }); soundAt('thud', ax, az, { vol: 1 }); cam.shake = Math.max(cam.shake, 0.15); }
        else if (k < 0.7) soundAt(pick(['laugh1', 'laugh2']), ax, az, { vol: 0.75, ref: 4, rate: RAND(0.78, 0.9), y: 1.7 });
        else HA.play('iseew', { pos: [ax, 1.7, az], vol: 0.8, ref: 4 });
      }
    }
  }

  function monPose(M, dt) {
    const S = mon.S;
    let want = M.clip, t0 = -1;
    const lockRoot = death.on && (death.stage === 0 || M.st === 'attack');
    if (lockRoot) { want = death.stage === 0 ? 'm_roar' : 'm_swipe'; t0 = death.stage === 0 ? 0.5 : 0.95; }
    if (want !== S.cur && MA[want]) animPlay(S, want, t0 >= 0 ? t0 : want === 'm_roar' || want === 'z_nbite' || want === 'm_swipe' || want === 'm_punch' ? 0 : Math.random() * 0.5, want === 'm_run' ? 0.2 : t0 >= 0 ? 0.12 : 0.25);
    const c = MA[S.cur];
    if (c && c.speed > 0 && M.spd > 0.05) { const nat = c.speed * (MM.hipsH / c.srcH) * MONK; S.rate = clamp(M.spd / Math.max(0.05, nat), 0.5, 1.8); } else S.rate = M.st === 'roar' || M.st === 'stun' ? 0.95 : M.st === 'attack' ? 1.15 : 1;
    animTick(S, dt);
    const sample = (name, t, q, hp) => { const cl = MA[name] || MA.m_idle; sampleClip(cl, MM.nb, t, q, hp); const k = MM.hipsH / cl.srcH; hp[0] *= k; hp[1] *= k; hp[2] *= k; };
    sample(S.cur, S.t, mon.q, mon.hp);
    if (lockRoot) { mon.hp[0] = 0; mon.hp[2] = 0; }
    let Q = mon.q, HP = mon.hp;
    if (S.prev) { sample(S.prev, S.pt, mon.q2, mon.hp2); if (lockRoot) { mon.hp2[0] = 0; mon.hp2[2] = 0; } blendInto(mon.q2, mon.hp2, mon.q, mon.hp, MM.nb, S.fade); Q = mon.q2; HP = mon.hp2; }
    poseSkin(MM, Q, HP, 1, mon.W, mon.skin);
    const model = m4.pose(M.x, 0, M.z, M.yaw, 0, 0, MONK);
    const W = mon.W;
    const hx = W[HEAD * 12 + 3], hy = W[HEAD * 12 + 7], hz = W[HEAD * 12 + 11];
    M.hx = model[0] * hx + model[4] * hy + model[8] * hz + model[12];
    M.hy = model[1] * hx + model[5] * hy + model[9] * hz + model[13];
    M.hz = model[2] * hx + model[6] * hy + model[10] * hz + model[14];
    return model;
  }

  function survFor(q) {
    const k = o.survKey ? o.survKey(q) : null;
    if (!k || !A.surv) return null;
    const a = A.surv(k);
    if (!a) return null;
    let s = surv.get(q.id);
    if (!s || s.k !== k) {
      let mesh = survMesh.get(k);
      if (!mesh) { mesh = { mesh: R.skinMesh(a.M), tex: R.tex2d(a.img), nrm: a.nrm && tier.mat ? R.tex2d(a.nrm, { raw: true }) : null }; survMesh.set(k, mesh); }
      s = { k, a, mesh, S: animState(), q: new Float32Array(a.M.nb * 4), hp: [0, 0, 0], q2: new Float32Array(a.M.nb * 4), hp2: [0, 0, 0], W: new Float32Array(a.M.nb * 12), skin: new Float32Array(a.M.nb * 12) };
      s.S.cur = 'p_idle';
      surv.set(q.id, s);
    }
    return s;
  }
  function survPose(q, s, dt) {
    const AN = A.sanim.clips;
    const M2 = s.a.M;
    let want = q.mv > 2.8 ? 'p_run' : q.mv > 0.25 ? (q.cr ? 'c_fwd' : 'p_walk') : q.cr ? 'c_idle' : 'p_idle';
    if (q.dead) want = 's_die';
    if (!AN[want]) want = 'p_idle';
    if (want !== s.S.cur) animPlay(s.S, want, 0, 0.2);
    const c = AN[s.S.cur];
    if (c && c.speed > 0 && q.mv > 0.05) s.S.rate = clamp(q.mv / Math.max(0.05, c.speed * (M2.hipsH / c.srcH)), 0.6, 1.6); else s.S.rate = 1;
    if (q.dead && c && s.S.t > c.dur - 0.05) s.S.t = c.dur - 0.05; else animTick(s.S, dt);
    const smp = (name, t, qq, hp) => { const cl = AN[name] || AN.p_idle; sampleClip(cl, M2.nb, t, qq, hp); const k = M2.hipsH / cl.srcH; hp[0] *= k; hp[1] *= k; hp[2] *= k; };
    smp(s.S.cur, s.S.t, s.q, s.hp);
    let Q = s.q, HP = s.hp;
    if (s.S.prev) { smp(s.S.prev, s.S.pt, s.q2, s.hp2); blendInto(s.q2, s.hp2, s.q, s.hp, M2.nb, s.S.fade); Q = s.q2; HP = s.hp2; }
    poseSkin(M2, Q, HP, 1, s.W, s.skin);
  }

  const EXIT_T = new Float32Array([1, 1, 1, 0.9]);
  const worldItems = world.chunks.flatMap((c) => meshItems(c, { emLay: LAY.exit, tint: EXIT_T }));
  const TK = new Float32Array([1, 1, 1, 0]);
  const RED_T = new Float32Array([1, 0.25, 0.2, 0]);
  const MON_T = new Float32Array([0.9, 0.86, 0.86, 0]);
  const HAND_T = new Float32Array([0.9, 0.9, 0.9, 0]);
  const pieces = (k, extra) => meshItems(world.pieceMesh[k], extra);
  function render(p, dt, now) {
    const M = G.mon;
    const t = now / 1000;
    const statics = worldItems.slice();
    G.lv.doors.forEach((d, i) => { statics.push(...pieces(d.kind, { model: doorMatrix(d, G.doors[i]), c: [d.x, 1, d.z], r: 1.3 })); });
    const ex = lv.exit;
    const exOpen = G.exitOpen ? Math.min(1, (st.exitA = (st.exitA || 0) + dt * 0.6)) : 0;
    for (const s of [-1, 1]) {
      const M2 = m4.pose(ex.x + s * 0.98, 0, ex.z, (s < 0 ? 0 : Math.PI) + s * -exOpen * 1.5);
      M2[0] *= 0.98; M2[1] *= 0.98; M2[2] *= 0.98;
      statics.push(...pieces('door2', { model: M2, c: [ex.x, 1, ex.z], r: 2 }));
    }
    for (let i = 0; i < 3; i++) {
      if (G.locks[i]) continue;
      const [lx, ly, lz] = lockPos(G, i);
      statics.push(...pieces('lock', { model: m4.pose(lx, ly, lz, Math.PI / 2, 0, 0, 1.4), c: [lx, ly, lz], r: 0.3, emis: 0.02 }));
    }
    const lights = [], glows = [];
    for (const l of lv.lamps) {
      if (!l.mode) continue;
      if (Math.abs(l.x - cam.ex) > 24 || Math.abs(l.z - cam.ez) > 24) continue;
      let fl = 1;
      if (l.mode === 1) { const a = Math.sin(t * 17 + l.ph) + Math.sin(t * 5.3 + l.ph * 1.7) * 0.8 + Math.sin(t * 1.1 + l.ph * 0.3) * 1.2; fl = a > 0.6 ? 1 : a > 0.2 ? 0.4 : 0.04; }
      if (l.dieT != null) { const k = G.t - l.dieT; fl *= k < 1.2 ? (Math.sin(k * 60) > 0 ? 1 : 0.05) * (1 - k / 1.2) : 0; }
      const dm = d2(M.x, M.z, l.x, l.z);
      if (dm < 4.5) fl *= 0.35 + 0.35 * Math.sin(t * 23 + l.ph);
      const col = l.red ? [2.1 * fl, 0.09 * fl, 0.06 * fl] : [1.9 * fl, 2.05 * fl, 2.3 * fl];
      statics.push(...meshItems(world.lampMesh, { model: m4.pose(l.x, WALL_H - 0.1, l.z, 0), emis: fl * (l.red ? 0.9 : 2.2), tint: l.red ? RED_T : TK, c: [l.x, 2.4, l.z], r: 0.5, noShadow: true }));
      if (fl > 0.02) {
        lights.push({ p: [l.x, 2.2, l.z], r: 6, c: col, d: d2(l.x, l.z, cam.ex, cam.ez) });
        glows.push({ p: [l.x, WALL_H - 0.16, l.z], s: 0.75, c: l.red ? [0.55 * fl, 0.04 * fl, 0.03 * fl] : [0.3 * fl, 0.32 * fl, 0.34 * fl] });
      }
    }
    lights.sort((a, b) => a.d - b.d);
    const L8 = [{ p: [ex.x, 2.1, ex.z - 0.55], r: 4, c: [0.25, 2.8, 0.7] }, ...lights.slice(0, 6)];
    glows.push({ p: [ex.x, 2.25, ex.z - 0.2], s: 0.55, c: [0.03, 0.32, 0.08] });
    for (const it of G.items) {
      if (it.st === 2 || it.st === 1) continue;
      const k2 = it.k === 'cell' ? 'flashlight' : it.k;
      if (!world.pieceMesh[k2]) continue;
      const glint = it.k === 'key' ? 0.25 + 0.15 * Math.sin(t * 3 + it.id) : 0.02;
      const sc = it.k === 'key' ? 1.6 : 1.0;
      const lie = it.k === 'radio' && it.st === 0 ? Math.PI / 2 : 0;
      statics.push(...pieces(k2, { model: m4.pose(it.x, it.y + (lie ? 0.045 : 0), it.z, it.yaw, 0, lie, sc), emis: glint, c: [it.x, it.y, it.z], r: 0.4 }));
      if (it.k === 'radio' && it.st === 3 && G.t >= it.on && G.t < it.end) { const b = 0.6 + 0.4 * Math.sin(t * 20); L8.push({ p: [it.x, 0.35, it.z], r: 2.4, c: [3 * b, 0.35, 0.2] }); glows.push({ p: [it.x, 0.2, it.z], s: 0.3, c: [0.4 * b, 0.03, 0.02] }); }
    }
    const skins = [];
    const model = monPose(M, dt);
    skins.push({ mesh: monMesh, tex: monTex, nrm: monNrm, bones: mon.skin, model, c: [M.x, 1.2, M.z], r: 2.4, tint: MON_T, rough: 0.74, wet: 0.3 });
    const flashes = [];
    for (const q of Object.values(G.players)) {
      if (q.id === me.id || q.out) continue;
      const s = survFor(q);
      let qx = q.x, qz = q.z;
      if (q.fly) { q.fly.t = Math.min(0.5, q.fly.t + dt); const k = Math.sin(q.fly.t / 0.5 * Math.PI / 2) * 2.6; qx += Math.sin(q.fly.a) * k; qz += Math.cos(q.fly.a) * k; }
      if (s) {
        survPose(q, s, dt);
        skins.push({ mesh: s.mesh.mesh, tex: s.mesh.tex, nrm: s.mesh.nrm, bones: s.skin, model: m4.pose(qx, 0, qz, q.dead && q.fly ? q.fly.a + Math.PI : q.yaw), c: [qx, 1, qz], r: 1.3, tint: TK, rough: 0.7 });
      }
      if (q.fl && !q.dead && q.hide < 0) {
        const qy = q.cr ? 1.0 : 1.45;
        const d3 = [Math.sin(q.yaw) * Math.cos(q.pitch || 0), Math.sin(q.pitch || 0), Math.cos(q.yaw) * Math.cos(q.pitch || 0)];
        const fp = [q.x + Math.cos(q.yaw) * -0.2 * -1, qy, q.z - Math.sin(q.yaw) * 0.2];
        flashes.push({ p: fp, d: d3, range: 16, cosO: Math.cos(0.5), cosI: Math.cos(0.17), c: FLASH_C, dd: d2(q.x, q.z, cam.ex, cam.ez) });
        const tx = cam.ex - fp[0], ty = cam.ey - fp[1], tz = cam.ez - fp[2];
        const tl = Math.hypot(tx, ty, tz) || 1;
        const face = (tx * d3[0] + ty * d3[1] + tz * d3[2]) / tl;
        if (face > 0.6) glows.push({ p: [fp[0] + d3[0] * 0.1, fp[1], fp[2] + d3[2] * 0.1], s: 0.35 + face * 0.25, c: [0.5 * face, 0.47 * face, 0.4 * face] });
      }
    }
    flashes.sort((a, b) => a.dd - b.dd);
    const yaw = cam.vy, pitch = cam.vp;
    const fwd = [Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)];
    const eye = [cam.ex, cam.ey, cam.ez];
    const right = [-Math.cos(yaw), 0, Math.sin(yaw)];
    const up0 = [right[1] * fwd[2] - right[2] * fwd[1], right[2] * fwd[0] - right[0] * fwd[2], right[0] * fwd[1] - right[1] * fwd[0]];
    const cr = Math.cos(cam.roll), sr = Math.sin(cam.roll);
    const up = [up0[0] * cr + right[0] * sr, up0[1] * cr + right[1] * sr, up0[2] * cr + right[2] * sr];
    let flash = null;
    const mine = !(p.dead || p.out) || death.on;
    const dmc = d2(M.x, M.z, cam.ex, cam.ez);
    const lowBat = p.bat < 35 ? 0.55 + 0.45 * clamp(Math.sin(t * 9) * 0.5 + Math.sin(t * 23.7) * 0.5 + 0.6, 0, 1) : 1;
    const brown = dmc < 6 ? 0.45 + 0.55 * clamp(0.5 + 0.5 * Math.sin(t * 13 + Math.sin(t * 3.1) * 4), 0, 1) : 1;
    cam.brown += (brown - cam.brown) * Math.min(1, dt * 10);
    if (mine && st.lightOn) {
      const low = eye[1] < 0.6;
      const fp = [eye[0] + right[0] * (low ? 0.08 : 0.16), low ? Math.max(0.3, eye[1] + 0.12) : eye[1] - 0.16, eye[2] + right[2] * (low ? 0.08 : 0.16)];
      const k = lowBat * cam.brown;
      flash = { p: fp, d: fwd, range: 18, cosO: Math.cos(0.5), cosI: Math.cos(0.17), c: [FLASH_C[0] * k, FLASH_C[1] * k, FLASH_C[2] * k] };
    } else if (!mine && st.spect) {
      const s = G.players[st.spect];
      if (s && s.fl) flash = { p: [eye[0], eye[1] - 0.15, eye[2]], d: fwd, range: 18, cosO: Math.cos(0.5), cosI: Math.cos(0.17), c: FLASH_C };
    }
    const hand = [];
    if (mine && !death.on && p.hide < 0 && world.pieceMesh.flashlight) {
      const sway = Math.sin(cam.bobA * 0.5) * cam.bob * 0.6;
      const hp = [eye[0] + right[0] * (0.2 + sway) + fwd[0] * 0.34, eye[1] - 0.24 + Math.abs(Math.sin(cam.bobA)) * cam.bob * 0.4 + fwd[1] * 0.34, eye[2] + right[2] * (0.2 + sway) + fwd[2] * 0.34];
      hand.push(...pieces('flashlight', { model: m4.mul(m4.pose(hp[0], hp[1], hp[2], yaw, -pitch), m4.pose(0, -0.03, 0, -Math.PI / 2, 0, 0, 0.95)), emis: 0.05, tint: HAND_T }));
      if (p.item === 'radio' && world.pieceMesh.radio) {
        const rp = [eye[0] - right[0] * 0.24 + fwd[0] * 0.36, eye[1] - 0.3 + fwd[1] * 0.36, eye[2] - right[2] * 0.24 + fwd[2] * 0.36];
        hand.push(...pieces('radio', { model: m4.mul(m4.pose(rp[0], rp[1], rp[2], yaw, -pitch), m4.pose(0, 0, 0, Math.PI / 2 + 0.3, 0.2, 0, 0.9)), emis: 0.04, tint: HAND_T }));
      }
    }
    const db = dustBase;
    if (Math.abs(db[0] - eye[0]) > 2.5 || Math.abs(db[2] - eye[2]) > 2.5) { db[0] = eye[0]; db[2] = eye[2]; }
    const dl = dust.length / 4;
    for (let i = 0; i < dl; i++) {
      dustLive[i * 4] = db[0] + dust[i * 4] + Math.sin(t * 0.21 + i) * 0.25;
      dustLive[i * 4 + 1] = dust[i * 4 + 1] + Math.sin(t * 0.13 + i * 1.7) * 0.15;
      dustLive[i * 4 + 2] = db[2] + dust[i * 4 + 2] + Math.cos(t * 0.17 + i * 0.7) * 0.25;
      dustLive[i * 4 + 3] = dust[i * 4 + 3];
    }
    R.setDust(dustLive);
    const W = canvas.width, H = canvas.height;
    const vf = 2 * Math.atan(Math.tan(1.62 / 2) / (W / H));
    const fov = clamp(vf, 0.9, 1.25) * (death.on && death.stage === 0 ? 0.85 : 1);
    const hidden = p.hide >= 0;
    R.frame({
      eye, at: [eye[0] + fwd[0], eye[1] + fwd[1], eye[2] + fwd[2]], up, fov, near: 0.05, far: 26,
      statics, skins, flash, flashes: flashes.slice(0, 3), shadows: tier.sh > 0, shadowHQ: tier.shHQ, lights: L8.slice(0, 8), glows,
      amb: hidden ? [0.008, 0.009, 0.012] : [0.012, 0.0135, 0.018], fog: [0.0035, 0.0045, 0.0065], fogD: 0.072, wallH: WALL_H, mat: tier.mat,
      post: [1.0 + cam.flash * 1.5, 0.32, cam.red, cam.fade], post2: [tier.beam, cam.sat, 0, 0], hand,
    });
  }
  if (o.tutorial) setTimeout(() => say('Find 3 keys. It hunts by sound', 'info', 4.2), 1200);
  return api;
}
