import { m4 } from './race3d.js';
import { createHush3D } from './hush3d.js';
import { parseGeo, buildWorld, doorMatrix, doorLeafBox, LAY } from './hushbuild.js';
import { lineBlocked, WALL_H } from './hushlevel.js';
import {
  makeGame, newPlayer, hostStep, hostAction, hostRadio, hostBreath, snapOf, applySnap, smoothMon, stepDoors, movePlayer, footNoise,
  nearestHide, itemNear, doorNear, lockNear, downNear, lockPos, dynSolids, emit, TUNE, d2, angTo, wrap,
} from './hushgame.js';
import { sampleClip, blendInto, poseSkin } from './zmodel.js';
import { HA } from './hushaudio.js';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const TIER = { fast: { h: 200, sh: 0, dust: 110 }, mid: { h: 256, sh: 512, dust: 200 }, best: { h: 336, sh: 1024, dust: 300 } };
const MONK = 1.18;
const HEAD = 5;
const RAND = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const NAMES = { key: 'key', radio: 'radio', knife: 'knife', cell: 'batteries' };

function animState() { return { cur: 'm_idle', t: 0, prev: null, pt: 0, fade: 1, rate: 1, prate: 1 }; }
function animPlay(S, clip, t0 = 0, fd = 0.28) { if (S.cur === clip) return; S.prev = S.cur; S.pt = S.t; S.prate = S.rate; S.cur = clip; S.t = t0; S.fade = 0; S.fd = fd; }
function animTick(S, dt) { S.t += dt * S.rate; if (S.prev) { S.pt += dt * S.prate; S.fade += dt / (S.fd || 0.28); if (S.fade >= 1) { S.prev = null; S.fade = 1; } } }

export async function createRun(canvas, o) {
  const tier = TIER[o.tier] || TIER.mid;
  const R = createHush3D(canvas, { shadow: tier.sh || 256 });
  if (!R) throw new Error('webgl');
  R.texArray(o.assets.tex, o.assets.texLayers, o.assets.texSize, o.tier === 'fast' ? 1 : 0);
  const geo = parseGeo(o.assets.geo);
  const G = makeGame(o.seed, { solo: o.solo });
  const lv = G.lv;
  const world = buildWorld(R, lv, geo);
  const monMesh = R.skinMesh(o.assets.mon.M);
  const monTex = R.tex2d(o.assets.mon.img);
  const MA = o.assets.monA.clips;
  if (o.assets.monA2) Object.assign(MA, o.assets.monA2.clips);
  const MM = o.assets.mon.M;
  const mon = { S: animState(), q: new Float32Array(MM.nb * 4), hp: [0, 0, 0], q2: new Float32Array(MM.nb * 4), hp2: [0, 0, 0], W: new Float32Array(MM.nb * 12), skin: new Float32Array(MM.nb * 12), stepD: 0, voiceT: 2, lastX: 0, lastZ: 0 };
  const surv = new Map();
  const survMesh = new Map();
  const me = o.me;
  const sp = lv.spawn[Math.max(0, o.slot || 0) % lv.spawn.length];
  G.players[me.id] = newPlayer(me.id, sp, me);
  G.players[me.id].yaw = sp.yaw == null ? Math.PI : sp.yaw;
  for (const p of o.others || []) G.players[p.id] = newPlayer(p.id, lv.spawn[(p.slot || 0) % lv.spawn.length], p);
  const P = () => G.players[me.id];
  const cam = { yaw: sp.yaw == null ? Math.PI : sp.yaw, pitch: 0, eyeY: 1.62, bob: 0, bobA: 0, shake: 0, fov: 1, hideBlend: 0, scare: 0, scareT: 0, fade: 1, red: 0, stat: 0, flick: 0 };
  const inp = { mx: 0, mz: 0, run: false, cr: false, breath: false, use: false };
  const st = { use: null, useT: 0, useHold: false, entry: null, hint: '', toastQ: [], hold: 0, holdT: 0, holdCd: 0, breathPlay: 0, ambT: 4, whispT: 18, stingT: 30, netT: 0, snapT: 0, hudT: 0, lightOn: true, battLow: false, startT: performance.now(), paused: false, dead: false, endT: 0, spect: null, keysSeen: 0, nearT: 0, chaseSeen: false, tutorial: o.tutorial ? 1 : 0, tutT: 0 };
  const dust = new Float32Array(tier.dust * 4);
  for (let i = 0; i < tier.dust; i++) dust.set([RAND(-5, 5), RAND(0.1, 2.4), RAND(-5, 5), RAND(0.3, 1)], i * 4);
  const dustBase = [0, 0, 0];
  const dustLive = new Float32Array(dust.length);
  const isHost = () => (o.solo ? true : o.isHost());
  const net = o.net || { send() {} };
  const say = (text, k = 'info', sec = 2.6) => { st.toastQ.push({ text, k, sec, at: performance.now() }); if (st.toastQ.length > 3) st.toastQ.shift(); };
  const occ = (x, z) => (lineBlocked(lv, x, z, cam.ex || 0, cam.ez || 0) ? 1 : 0);

  function hearSelf(n) {
    if (!n) return;
    if (isHost()) emit(G, n.x, n.z, n.r, n.k, me.id);
    else net.send('hn', { x: Math.round(n.x * 100) / 100, z: Math.round(n.z * 100) / 100, r: n.r, k: n.k });
  }
  function act(a) {
    if (isHost()) { const ok = hostAction(G, me.id, a); return ok; }
    net.send('ha', a);
    return true;
  }

  function soundAt(name, x, z, o2 = {}) { HA.play(name, { pos: [x, o2.y == null ? 1 : o2.y, z], vol: o2.vol == null ? 1 : o2.vol, rate: o2.rate, ref: o2.ref || 3, roll: o2.roll, max: o2.max, rev: o2.rev }); }

  function onEvent(e) {
    const p = P();
    switch (e.e) {
      case 'roar': soundAt(pick(['roar1', 'roar2']), e.x, e.z, { vol: 1.25, ref: 6, rate: RAND(0.86, 0.96), y: 2 }); if (d2(e.x, e.z, p.x, p.z) < 14) { HA.play(pick(['hit1', 'hit2', 'hit4']), { vol: 0.75 }); cam.shake = Math.max(cam.shake, 0.35); } break;
      case 'growl': soundAt(pick(['growl1', 'growl2', 'growl3']), e.x, e.z, { vol: 0.9, ref: 4, rate: RAND(0.82, 0.95), y: 2 }); break;
      case 'sniff': soundAt('sniff', e.x, e.z, { vol: 0.9, ref: 3, rate: RAND(0.7, 0.85), y: 1.9 }); break;
      case 'slam': soundAt('slam', e.x, e.z, { vol: 1.2, ref: 5 }); soundAt('thud', e.x, e.z, { vol: 0.9, ref: 5 }); if (d2(e.x, e.z, p.x, p.z) < 10) cam.shake = Math.max(cam.shake, 0.18); break;
      case 'dopen': soundAt(pick(['dopen1', 'dopen2']), e.x, e.z, { vol: 0.85 }); soundAt(pick(['creak0', 'creak1', 'creak2']), e.x, e.z, { vol: 0.5, rate: RAND(0.85, 1) }); break;
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
      case 'radiooff': break;
      case 'smash': soundAt('tin', e.x, e.z, { vol: 1.1, y: 0.3 }); soundAt('snarl', e.x, e.z, { vol: 1, y: 2, ref: 4 }); break;
      case 'lock': HA.play('latch', { vol: 1 }); HA.play('clank1', { vol: 0.7 }); say(G.locks.reduce((s, v) => s + v, 0) >= 3 ? 'The last lock is open' : 'A lock is open', 'key'); break;
      case 'exit': soundAt('gate', lv.exit.x, lv.exit.z, { vol: 1.2, ref: 6 }); HA.play('hit3', { vol: 0.6 }); say('The exit is open. Get out', 'key', 4); break;
      case 'catch':
        soundAt(pick(['bone1', 'bone2']), e.x, e.z, { vol: 1 });
        if (e.pid === me.id) { startScare(e); }
        else { soundAt(pick(['scream1', 'scream2']), G.players[e.pid] ? G.players[e.pid].x : e.x, G.players[e.pid] ? G.players[e.pid].z : e.z, { vol: 1.2, ref: 6 }); say(`${nameOf(e.pid)} is down. Help them up`, 'bad', 3.4); }
        break;
      case 'stab':
        soundAt('stab', e.x, e.z, { vol: 1.2 });
        soundAt('roar1', e.x, e.z, { vol: 1.2, rate: 1.1, y: 2 });
        if (e.pid === me.id) { p.boost = 3; cam.shake = 0.5; cam.red = 0.25; say('You stabbed it. Run', 'key', 3); }
        break;
      case 'revive': if (e.pid === me.id) { say('You are back up', 'key'); cam.red = 0; } else say(`${nameOf(e.pid)} is back up`, 'info'); break;
      case 'dead': if (e.pid !== me.id) say(`${nameOf(e.pid)} did not make it`, 'bad', 3.4); break;
      case 'out': if (e.pid === me.id) { HA.play('hit3', { vol: 0.5 }); } else say(`${nameOf(e.pid)} got out`, 'key', 3); break;
      case 'won': if (!st.endWant) st.endWant = { k: 'won', at: performance.now() + 1800 }; break;
      case 'lost': if (!st.endWant) st.endWant = { k: 'lost', at: performance.now() + (cam.scare ? 3400 : 1200) }; break;
      default: break;
    }
  }
  const nameOf = (id) => { const q = G.players[id]; return q && q.n ? q.n : 'A friend'; };

  function startScare() {
    cam.scare = 1; cam.scareT = 0;
    HA.duck(0.35, 0.2);
    HA.play('hit1', { vol: 1.3 });
    HA.play(pick(['roar1', 'roar2']), { vol: 1.45, rate: 0.9 });
    HA.play(pick(['scream1', 'scream2']), { vol: 0.9, at: 0.15 });
    cam.shake = 1.2;
    if (navigator.vibrate) { try { navigator.vibrate([60, 40, 140]); } catch {} }
  }
  function endRound(k) {
    if (st.endT) return;
    st.endT = performance.now();
    const p = P();
    HA.stopLoop('heart', 2);
    HA.stopLoop('mbreath', 1);
    if (k === 'won') HA.play('win', { vol: 0.9, at: 1.2 }); else HA.play('lose', { vol: 0.9, at: 1.6 });
    if (o.onEnd) o.onEnd({ k, me: p.out ? 'out' : p.dead || p.down ? 'down' : 'in', t: Math.round((performance.now() - st.startT) / 1000), keys: G.keys, team: Object.values(G.players).map((q) => ({ id: q.id, n: q.n, out: q.out, dead: q.dead || q.down })) });
  }

  function target(p, fx, fz) {
    if (p.dead || p.out) return null;
    if (p.hide >= 0) return { k: 'unhide', label: 'Get out' };
    if (p.down) return null;
    const q = downNear(G, p);
    if (q) return { k: 'revive', label: 'Help up', hold: TUNE.reviveT, to: q.id, key: `r${q.id}` };
    if (lockNear(G, p)) {
      const open = G.locks.reduce((s, v) => s + v, 0);
      if (G.keys > open) return { k: 'unlock', label: 'Unlock', hold: TUNE.unlockT, i: G.locks.indexOf(0), key: `u${open}` };
      return { k: 'none', label: G.keys >= 3 ? 'Unlock' : 'Find keys' };
    }
    const it = itemNear(G, p, fx, fz);
    if (it) return { k: 'pick', id: it.id, label: `Pick up ${NAMES[it.k]}` };
    const di = doorNear(G, p, fx, fz);
    if (di >= 0) return { k: 'door', id: di, label: G.doorTo[di] > 0.5 ? 'Close' : 'Open' };
    const h = nearestHide(G, p);
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
      st.hv = { x: h.x + lx * side * off, z: h.z + lz * side * off, y: pr.k === 'bed' ? 0.085 : 0.48, yaw: Math.atan2(lx * side, lz * side) };
      cam.yaw = st.hv.yaw; cam.pitch = pr.k === 'bed' ? 0.02 : 0;
      HA.play('cloth', { vol: 0.8 });
      if (st.tutorial === 1) { say('Hold your breath when it gets close', 'info', 3.4); }
      return;
    }
    if (tg.k === 'unhide') {
      p.hide = -1;
      if (st.entry) { p.x = st.entry.x; p.z = st.entry.z; }
      HA.play('cloth', { vol: 0.8 });
      return;
    }
    if (tg.k === 'unlock') { act({ k: 'unlock', i: tg.i }); return; }
    if (tg.k === 'revive') { act({ k: 'revive', to: tg.to }); }
  }

  const api = {
    G,
    look(dx, dy) {
      const p = P();
      if (!p || cam.scare) return;
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
      if (!p || p.item !== 'radio' || p.down || p.hide >= 0) return;
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
      if (t === 'bye') { if (from && G.players[from]) { delete G.players[from]; } }
    },
    dropPeer(id) { if (G.players[id] && id !== me.id) delete G.players[id]; },
    state() { return { phase: G.phase }; },
    dispose() { stop = true; cancelAnimationFrame(raf); HA.stopAll(); R.dispose(); },
    resize() { fit(); },
  };

  function fit() {
    const r = canvas.getBoundingClientRect();
    const w = Math.max(64, r.width), h = Math.max(64, r.height);
    const H = tier.h, W = Math.round(H * (w / h));
    R.resize(W, H);
  }
  fit();

  HA.loop('amb', { vol: 0.55, fade: 3 });
  HA.loop('drip', { vol: 0.22, fade: 4 });
  HA.loop('hum', { vol: 0.16, fade: 4 });
  HA.loop('heart', { vol: 0, fade: 0.2 });

  let raf = 0, last = performance.now(), stop = false;
  const frame = (now) => {
    if (stop) return;
    raf = requestAnimationFrame(frame);
    if (R.lost()) return;
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.1) dt = 0.1;
    if (dt <= 0) return;
    try { step(dt, now); } catch (err) { if (o.onError) o.onError(err); stop = true; }
  };
  raf = requestAnimationFrame(frame);

  function step(dt, now) {
    const p = P();
    if (st.endWant && performance.now() >= st.endWant.at && !st.endT) endRound(st.endWant.k);
    const host = isHost();
    const fx = Math.sin(cam.yaw), fz = Math.cos(cam.yaw);
    p.yaw = cam.yaw; p.pitch = cam.pitch;
    if (!p.down && !p.dead && !p.out && !cam.scare && !st.paused) {
      if (inp.cr !== !!p.cr) p.cr = inp.cr ? 1 : 0;
      const extra = dynSolids(G, doorLeafBox);
      movePlayer(G, p, { mx: inp.mx, mz: inp.mz, run: inp.run }, dt, extra);
      hearSelf(footNoise(G, p, dt));
      if (p.mv > 0.3 && p.hide < 0) {
        p.stepS = (p.stepS || 0) - dt;
        if (p.stepS <= 0) { p.stepS = p.run ? 0.34 : p.cr ? 0.62 : 0.5; HA.play(`step${Math.floor(Math.random() * 9)}`, { vol: p.run ? 0.75 : p.cr ? 0.22 : 0.45, rate: RAND(0.92, 1.06) }); }
      }
    } else if (p.down && !p.dead && !cam.scare) {
      const extra = dynSolids(G, doorLeafBox);
      movePlayer(G, p, { mx: inp.mx, mz: inp.mz, run: false }, dt, extra);
    } else { p.mv = 0; }
    if (p.down && !st.wasDown) { st.wasDown = true; inp.cr = false; }
    if (!p.down && st.wasDown) { st.wasDown = false; }
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
        if (st.clankT <= 0) {
          st.clankT = tg.k === 'unlock' ? 0.85 : 1.1;
          if (tg.k === 'unlock') { HA.play(pick(['clank1', 'clank2']), { vol: 0.75, rate: RAND(0.9, 1.1) }); hearSelf({ x: p.x, z: p.z, r: TUNE.nz.lock, k: 'lock' }); }
          else hearSelf({ x: p.x, z: p.z, r: TUNE.nz.revive, k: 'revive' });
        }
        if (st.useT >= tg.hold) { st.useHold = false; st.useT = 0; doUse(tg, p); }
      }
    }
    st.target = tg;
    if (G.exitOpen && !p.out && !p.down && !p.dead && p.z > lv.exit.z + 0.4) { act({ k: 'out' }); p.out = 1; st.lightOn = false; }
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
      if (q.id === me.id || q.tx == null) continue;
      const k = Math.min(1, dt * 10);
      q.x += (q.tx - q.x) * k; q.z += (q.tz - q.z) * k;
    }
    st.netT -= dt;
    if (!o.solo && st.netT <= 0) {
      st.netT = 0.1;
      net.send('hp', { x: Math.round(p.x * 100) / 100, z: Math.round(p.z * 100) / 100, y: Math.round(cam.yaw * 100) / 100, p: Math.round(cam.pitch * 100) / 100, c: p.cr ? 1 : 0, h: p.hide, f: p.fl, r: p.run, v: Math.round(p.mv * 10) / 10, b: p.hold ? 1 : 0, n: me.n, sv: me.sv, sl: o.slot || 0 });
    }
    camera(p, dt);
    audio(p, dt);
    render(p, dt, now);
    st.hudT -= dt;
    if (st.hudT <= 0 && o.onHud) {
      st.hudT = 0.12;
      const M = G.mon;
      const dm = d2(M.x, M.z, p.x, p.z);
      while (st.toastQ.length && performance.now() - st.toastQ[0].at > st.toastQ[0].sec * 1000) st.toastQ.shift();
      o.onHud({
        keys: G.keys, locks: G.locks.reduce((s, v) => s + v, 0), bat: p.bat / TUNE.battery, light: st.lightOn, stam: p.stam / TUNE.stamMax, item: p.item,
        prompt: tg ? tg.label : '', can: !!tg && tg.k !== 'none', hold: tg && tg.hold ? (st.useHold ? st.useT / tg.hold : 0) : -1,
        hidden: p.hide >= 0, down: !!p.down, downT: Math.max(0, Math.round(p.downT || 0)), dead: !!p.dead, out: !!p.out, cr: !!p.cr, breath: st.hold, breathT: st.holdT / TUNE.breathMax, breathCd: st.holdCd > 0,
        near: dm < 9 ? 1 - dm / 9 : 0, scare: !!cam.scare, toasts: st.toastQ.map((t) => ({ text: t.text, k: t.k, at: t.at })), phase: G.phase, spect: st.spect ? nameOf(st.spect) : '',
        team: Object.values(G.players).filter((q) => q.id !== me.id).map((q) => ({ id: q.id, n: q.n, down: !!q.down, dead: !!q.dead, out: !!q.out })),
      });
    }
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
    if (p.down) want = 0.36;
    if (p.hide >= 0 && st.hv) { want = st.hv.y; ex = st.hv.x; ez = st.hv.z; }
    if (p.hide >= 0 && st.hv && cam.eyeY > 0.6) cam.eyeY += (want - cam.eyeY) * 0.5;
    cam.eyeY += (want - cam.eyeY) * Math.min(1, dt * (p.hide >= 0 ? 6 : 9));
    const sp = p.mv;
    cam.bobA += dt * (sp > 0.2 ? (p.run ? 12.5 : p.cr ? 6 : 8.5) : 0);
    const bobAmp = p.hide >= 0 ? 0 : sp > 0.2 ? (p.run ? 0.055 : p.cr ? 0.02 : 0.032) : 0;
    cam.bob += (bobAmp - cam.bob) * Math.min(1, dt * 6);
    ey = cam.eyeY + Math.sin(cam.bobA) * cam.bob;
    cam.shake = Math.max(0, cam.shake - dt * 1.6);
    let yaw = cam.yaw, pitch = cam.pitch;
    if (cam.scare) {
      cam.scareT += dt;
      const hx = M.hx != null ? M.hx : M.x, hy = M.hy != null ? M.hy : 2.0, hz = M.hz != null ? M.hz : M.z;
      const ty = angTo(ex, ez, hx, hz), tp = Math.atan2(hy - ey, Math.max(0.3, d2(ex, ez, hx, hz)));
      cam.yaw = wrap(cam.yaw + wrap(ty - cam.yaw) * Math.min(1, dt * 14));
      cam.pitch += (tp - cam.pitch) * Math.min(1, dt * 14);
      yaw = cam.yaw; pitch = cam.pitch;
      if (cam.scareT > 2.4) { cam.scare = 0; cam.fade = 0.0; }
    }
    if (p.dead || p.out) {
      const alive = Object.values(G.players).filter((q) => q.id !== me.id && !q.dead && !q.out);
      const s = alive.find((q) => q.id === st.spect) || alive[0];
      st.spect = s ? s.id : null;
      if (s) { ex = s.x; ez = s.z; ey = s.cr ? crouchY : s.down ? 0.36 : standY; yaw = s.yaw; pitch = s.pitch || 0; }
    }
    const sk = cam.shake * cam.shake;
    yaw += (Math.random() - 0.5) * sk * 0.12; pitch += (Math.random() - 0.5) * sk * 0.12;
    cam.ex = ex; cam.ey = ey; cam.ez = ez; cam.vy = yaw; cam.vp = pitch;
    cam.red = Math.max(0, cam.red - dt * 0.25);
    if (p.down && !p.dead) cam.red = Math.max(cam.red, 0.35 + 0.12 * Math.sin(performance.now() / 300));
    const dm = d2(M.x, M.z, ex, ez);
    const nearK = clamp(1 - dm / 7, 0, 1);
    cam.stat = cam.scare ? clamp(0.85 - cam.scareT * 0.2, 0.2, 0.85) : nearK * nearK * 0.32;
    cam.fade = st.endT ? Math.min(1, (performance.now() - st.endT) / 2600) * 0.85 : Math.max(0, cam.fade - dt * 0.8);
    if (cam.scare && cam.scareT > 1.7) cam.fade = Math.min(1, (cam.scareT - 1.7) * 1.5);
  }

  function audio(p, dt) {
    const M = G.mon;
    HA.setListener(cam.ex, cam.ey, cam.ez, cam.vy, occ);
    const dm = d2(M.x, M.z, cam.ex, cam.ez);
    const fear = clamp(1 - dm / 15, 0, 1);
    HA.loopVol('heart', fear > 0.05 && !p.dead && !p.out ? 0.25 + fear * 0.9 : 0, 0.85 + fear * 0.75);
    HA.loopVol('amb', 0.55 - fear * 0.25);
    mon.stepD += Math.hypot(M.x - mon.lastX, M.z - mon.lastZ);
    mon.lastX = M.x; mon.lastZ = M.z;
    const stride = M.clip === 'm_run' ? 1.55 : 1.05;
    if (mon.stepD > stride) {
      mon.stepD = 0;
      soundAt(`mstep${Math.floor(Math.random() * 4)}`, M.x, M.z, { vol: M.clip === 'm_run' ? 1.15 : 0.8, rate: RAND(0.62, 0.74), y: 0.1, ref: 3.5 });
    }
    mon.voiceT -= dt;
    if (mon.voiceT <= 0) {
      const sts = M.st;
      if (sts === 'chase') { mon.voiceT = RAND(1.6, 2.8); soundAt(pick(['growl1', 'growl2', 'growl3', 'snarl']), M.x, M.z, { vol: 1.05, rate: RAND(0.85, 0.95), y: 2, ref: 4 }); }
      else if (sts === 'search' || sts === 'hunt') { mon.voiceT = RAND(1.8, 3.4); soundAt(pick(['sniff', 'groan4', 'groan3']), M.x, M.z, { vol: 0.85, rate: RAND(0.72, 0.86), y: 1.9, ref: 3 }); }
      else if (sts === 'attack' || sts === 'roar' || sts === 'stun' || sts === 'smash') mon.voiceT = 1.5;
      else { mon.voiceT = RAND(3.5, 7.5); soundAt(pick(['groan1', 'groan2', 'groan3', 'growl4']), M.x, M.z, { vol: 0.75, rate: RAND(0.78, 0.9), y: 1.9, ref: 3 }); }
    }
    if (M.st === 'chase' && !st.chaseSeen && dm < 16) { st.chaseSeen = true; HA.play(pick(['hit2', 'hit4']), { vol: 0.8 }); }
    if (M.st !== 'chase') st.chaseSeen = false;
    st.breathPlay -= dt;
    if (st.breathPlay <= 0 && !p.dead && !p.out && !st.hold) {
      const tired = p.stam < TUNE.stamMax * 0.45;
      if (fear > 0.55 || tired || p.down) { st.breathPlay = RAND(1.3, 1.9); HA.play(`breath${Math.floor(Math.random() * 6)}`, { vol: (fear > 0.55 ? 0.65 : 0.38) + (p.down ? 0.2 : 0), rate: RAND(0.95, 1.05) }); }
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
      const on = it.st === 3 && G.t >= it.on && G.t < it.end;
      if (on) {
        it.wT = (it.wT || 0) - dt;
        if (it.wT <= 0) { it.wT = RAND(2.4, 3.4); HA.play(`whisper${Math.floor(Math.random() * 6)}`, { pos: [it.x, 0.3, it.z], vol: 1.4, radio: true, rate: RAND(0.9, 1.1), ref: 5 }); }
      }
    }
    HA.tick();
  }

  function monPose(M, dt) {
    const S = mon.S;
    const want = M.clip;
    if (want !== S.cur && MA[want]) animPlay(S, want, want === 'm_roar' || want === 'z_nbite' || want === 'm_swipe' ? 0 : Math.random() * 0.5, want === 'm_run' ? 0.2 : 0.3);
    const c = MA[S.cur];
    if (c && c.speed > 0 && M.spd > 0.05) { const nat = c.speed * (MM.hipsH / c.srcH) * MONK; S.rate = clamp(M.spd / Math.max(0.05, nat), 0.5, 1.8); } else S.rate = M.st === 'roar' || M.st === 'stun' ? 0.95 : 1;
    animTick(S, dt);
    const sample = (name, t, q, hp) => { const cl = MA[name] || MA.m_idle; sampleClip(cl, MM.nb, t, q, hp); const k = MM.hipsH / cl.srcH; hp[0] *= k; hp[1] *= k; hp[2] *= k; };
    sample(S.cur, S.t, mon.q, mon.hp);
    let Q = mon.q, HP = mon.hp;
    if (S.prev) { sample(S.prev, S.pt, mon.q2, mon.hp2); blendInto(mon.q2, mon.hp2, mon.q, mon.hp, MM.nb, S.fade); Q = mon.q2; HP = mon.hp2; }
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
    if (!k || !o.assets.surv) return null;
    const a = o.assets.surv(k);
    if (!a) return null;
    let s = surv.get(q.id);
    if (!s || s.k !== k) {
      let mesh = survMesh.get(k);
      if (!mesh) { mesh = { mesh: R.skinMesh(a.M), tex: R.tex2d(a.img) }; survMesh.set(k, mesh); }
      s = { k, a, mesh, S: animState(), q: new Float32Array(a.M.nb * 4), hp: [0, 0, 0], q2: new Float32Array(a.M.nb * 4), hp2: [0, 0, 0], W: new Float32Array(a.M.nb * 12), skin: new Float32Array(a.M.nb * 12) };
      s.S.cur = 'p_idle';
      surv.set(q.id, s);
    }
    return s;
  }
  function survPose(q, s, dt) {
    const A = o.assets.sanim.clips;
    const M2 = s.a.M;
    let want = q.mv > 2.8 ? 'p_run' : q.mv > 0.25 ? (q.cr ? 'c_fwd' : 'p_walk') : q.cr ? 'c_idle' : 'p_idle';
    if (q.down) want = A.crawl ? 'crawl' : 's_kneel';
    if (q.dead) want = 's_die';
    if (!A[want]) want = 'p_idle';
    if (want !== s.S.cur) animPlay(s.S, want, 0, 0.25);
    const c = A[s.S.cur];
    if (c && c.speed > 0 && q.mv > 0.05) s.S.rate = clamp(q.mv / Math.max(0.05, c.speed * (M2.hipsH / c.srcH)), 0.6, 1.6); else s.S.rate = 1;
    animTick(s.S, dt);
    const smp = (name, t, qq, hp) => { const cl = A[name] || A.p_idle; sampleClip(cl, M2.nb, t, qq, hp); const k = M2.hipsH / cl.srcH; hp[0] *= k; hp[1] *= k; hp[2] *= k; };
    smp(s.S.cur, s.S.t, s.q, s.hp);
    let Q = s.q, HP = s.hp;
    if (s.S.prev) { smp(s.S.prev, s.S.pt, s.q2, s.hp2); blendInto(s.q2, s.hp2, s.q, s.hp, M2.nb, s.S.fade); Q = s.q2; HP = s.hp2; }
    poseSkin(M2, Q, HP, 1, s.W, s.skin);
  }

  const lampItems = world.chunks.map((c) => ({ mesh: c.mesh, c: c.c, r: c.r, emLay: LAY.exit, tint: c.tint }));
  const TK = new Float32Array([1, 1, 1, 0]);
  function render(p, dt, now) {
    const M = G.mon;
    const t = now / 1000;
    const statics = lampItems.slice();
    G.lv.doors.forEach((d, i) => { statics.push({ mesh: world.pieceMesh[d.kind].mesh, model: doorMatrix(d, G.doors[i]), c: [d.x, 1, d.z], r: 1.3 }); });
    const ex = lv.exit;
    const exOpen = G.exitOpen ? Math.min(1, (st.exitA = (st.exitA || 0) + dt * 0.6)) : 0;
    for (const s of [-1, 1]) {
      const hx = ex.x + s * 0.98, hz = ex.z;
      const yaw = (s < 0 ? 0 : Math.PI) + s * -exOpen * 1.5;
      const M2 = m4.pose(hx, 0, hz, yaw);
      M2[0] *= 0.98; M2[1] *= 0.98; M2[2] *= 0.98;
      statics.push({ mesh: world.pieceMesh.door2.mesh, model: M2, c: [ex.x, 1, ex.z], r: 2 });
    }
    for (let i = 0; i < 3; i++) {
      if (G.locks[i]) continue;
      const [lx, ly, lz] = lockPos(G, i);
      statics.push({ mesh: world.pieceMesh.lock.mesh, model: m4.pose(lx, ly, lz, Math.PI / 2, 0, 0, 1.4), c: [lx, ly, lz], r: 0.3, emis: 0.05 });
    }
    const lights = [];
    for (const l of lv.lamps) {
      if (!l.mode) continue;
      if (Math.abs(l.x - cam.ex) > 22 || Math.abs(l.z - cam.ez) > 22) continue;
      let fl = 1;
      if (l.mode === 1) { const a = Math.sin(t * 17 + l.ph) + Math.sin(t * 5.3 + l.ph * 1.7) * 0.8 + Math.sin(t * 1.1 + l.ph * 0.3) * 1.2; fl = a > 0.6 ? 1 : a > 0.2 ? 0.35 : 0.03; }
      const dm = d2(M.x, M.z, l.x, l.z);
      if (dm < 4.5) fl *= Math.random() < 0.35 ? 0.05 : 0.6;
      const col = l.red ? [0.85 * fl, 0.07 * fl, 0.05 * fl] : [0.62 * fl, 0.68 * fl, 0.74 * fl];
      statics.push({ mesh: world.lampMesh.mesh, model: m4.pose(l.x, WALL_H - 0.1, l.z, 0), emis: fl * (l.red ? 0.6 : 1.3), tint: l.red ? RED_T : TK, c: [l.x, 2.4, l.z], r: 0.5 });
      lights.push({ p: [l.x, 2.15, l.z], r: 6.5, c: col, d: d2(l.x, l.z, cam.ex, cam.ez) });
    }
    lights.sort((a, b) => a.d - b.d);
    const L6 = [{ p: [ex.x, 2.15, ex.z - 0.6], r: 3.6, c: [0.04, 0.42, 0.1] }, ...lights.slice(0, 5)];
    for (const it of G.items) {
      if (it.st === 2 || it.st === 1) continue;
      const mesh = world.pieceMesh[it.k === 'cell' ? 'flashlight' : it.k];
      if (!mesh) continue;
      const glint = it.k === 'key' ? 0.18 + 0.12 * Math.sin(t * 3 + it.id) : 0.03;
      const sc = it.k === 'key' ? 1.6 : 1.0;
      const lie = it.k === 'radio' && it.st === 0 ? Math.PI / 2 : 0;
      statics.push({ mesh: mesh.mesh, model: m4.pose(it.x, it.y + (lie ? 0.045 : 0), it.z, it.yaw, 0, lie, sc), emis: glint, c: [it.x, it.y, it.z], r: 0.4 });
      if (it.k === 'radio' && it.st === 3 && G.t >= it.on && G.t < it.end) L6.push({ p: [it.x, 0.35, it.z], r: 2.2, c: [0.5 * (0.6 + 0.4 * Math.sin(t * 20)), 0.08, 0.05] });
    }
    const skins = [];
    const model = monPose(M, dt);
    skins.push({ mesh: monMesh, tex: monTex, bones: mon.skin, model, c: [M.x, 1.2, M.z], r: 2.2, tint: MON_T });
    const flashes = [];
    for (const q of Object.values(G.players)) {
      if (q.id === me.id || q.dead || q.out) continue;
      const s = survFor(q);
      if (s) {
        survPose(q, s, dt);
        skins.push({ mesh: s.mesh.mesh, tex: s.mesh.tex, bones: s.skin, model: m4.pose(q.x, 0, q.z, q.yaw), c: [q.x, 1, q.z], r: 1.3, tint: TK });
      }
      if (q.fl && !q.down && q.hide < 0) {
        const qy = q.cr ? 1.0 : 1.45;
        const d3 = [Math.sin(q.yaw) * Math.cos(q.pitch || 0), Math.sin(q.pitch || 0), Math.cos(q.yaw) * Math.cos(q.pitch || 0)];
        flashes.push({ p: [q.x - Math.cos(q.yaw) * -0.2, qy, q.z + Math.sin(q.yaw) * -0.2], d: d3, range: 15, cosO: Math.cos(0.4), cosI: Math.cos(0.19), c: [1.7, 1.6, 1.4], dd: d2(q.x, q.z, cam.ex, cam.ez) });
      }
    }
    flashes.sort((a, b) => a.dd - b.dd);
    const yaw = cam.vy, pitch = cam.vp;
    const fwd = [Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)];
    const eye = [cam.ex, cam.ey, cam.ez];
    const right = [-Math.cos(yaw), 0, Math.sin(yaw)];
    let flash = null;
    const mine = !(p.dead || p.out);
    const batK = p.bat < 35 ? (Math.random() < 0.08 + (35 - p.bat) / 120 ? 0.15 : 1) : 1;
    const nearM = d2(M.x, M.z, cam.ex, cam.ez) < 5.5 && Math.random() < 0.12 ? 0.25 : 1;
    if (mine && st.lightOn) {
      const low = eye[1] < 0.6;
      const fp = [eye[0] + right[0] * (low ? 0.08 : 0.17), low ? eye[1] * 0.6 : eye[1] - 0.18, eye[2] + right[2] * (low ? 0.08 : 0.17)];
      const k = batK * nearM;
      flash = { p: fp, d: fwd, range: 17, cosO: Math.cos(0.43), cosI: Math.cos(0.2), c: [1.75 * k, 1.63 * k, 1.42 * k] };
    } else if (!mine && st.spect) {
      const s = G.players[st.spect];
      if (s && s.fl) flash = { p: [eye[0], eye[1] - 0.15, eye[2]], d: fwd, range: 17, cosO: Math.cos(0.43), cosI: Math.cos(0.2), c: [2, 1.9, 1.65] };
    }
    const hand = [];
    if (mine && p.hide < 0 && !p.down && !cam.scare && world.pieceMesh.flashlight) {
      const sway = Math.sin(cam.bobA * 0.5) * cam.bob * 0.6;
      const hp = [eye[0] + right[0] * (0.2 + sway) + fwd[0] * 0.34, eye[1] - 0.24 + Math.abs(Math.sin(cam.bobA)) * cam.bob * 0.4 + fwd[1] * 0.34, eye[2] + right[2] * (0.2 + sway) + fwd[2] * 0.34];
      hand.push({ mesh: world.pieceMesh.flashlight.mesh, model: m4.mul(m4.pose(hp[0], hp[1], hp[2], yaw, -pitch), m4.pose(0, -0.03, 0, -Math.PI / 2, 0, 0, 0.95)), emis: 0.16, tint: HAND_T });
      if (p.item === 'radio' && world.pieceMesh.radio) {
        const rp = [eye[0] - right[0] * 0.24 + fwd[0] * 0.36, eye[1] - 0.3 + fwd[1] * 0.36, eye[2] - right[2] * 0.24 + fwd[2] * 0.36];
        hand.push({ mesh: world.pieceMesh.radio.mesh, model: m4.mul(m4.pose(rp[0], rp[1], rp[2], yaw, -pitch), m4.pose(0, 0, 0, Math.PI / 2 + 0.3, 0.2, 0, 0.9)), emis: 0.14, tint: HAND_T });
      }
    }
    const db = dustBase;
    if (Math.abs(db[0] - eye[0]) > 2.5 || Math.abs(db[2] - eye[2]) > 2.5) { db[0] = eye[0]; db[2] = eye[2]; }
    const dl = dust.length / 4;
    const live = dustLive;
    for (let i = 0; i < dl; i++) {
      const bx = dust[i * 4], by = dust[i * 4 + 1], bz = dust[i * 4 + 2];
      live[i * 4] = db[0] + bx + Math.sin(t * 0.21 + i) * 0.25;
      live[i * 4 + 1] = by + Math.sin(t * 0.13 + i * 1.7) * 0.15;
      live[i * 4 + 2] = db[2] + bz + Math.cos(t * 0.17 + i * 0.7) * 0.25;
      live[i * 4 + 3] = dust[i * 4 + 3] * 0.55;
    }
    R.setDust(live);
    const W = canvas.width, H = canvas.height;
    const hf = 1.62;
    const vf = 2 * Math.atan(Math.tan(hf / 2) / (W / H));
    const fov = clamp(vf, 0.9, 1.25) * (cam.scare ? 0.88 : 1);
    R.frame({
      eye, at: [eye[0] + fwd[0], eye[1] + fwd[1], eye[2] + fwd[2]], fov, near: 0.05, far: 24,
      statics, skins, flash, flashes: flashes.slice(0, 3), shadows: tier.sh > 0, lights: L6.slice(0, 6),
      amb: p.hide >= 0 ? [0.012, 0.013, 0.018] : [0.017, 0.019, 0.027], fog: [0.003, 0.004, 0.006], fogD: 0.078,
      fx: [t, 0.05, cam.stat, cam.red], fx2: [cam.fade, 0.75, 1, 0.86], snap: 0.5, aff: 0.28, hand,
    });
  }
  const RED_T = new Float32Array([1, 0.3, 0.25, 0]);
  const MON_T = new Float32Array([0.8, 0.74, 0.74, 0]);
  const HAND_T = new Float32Array([0.85, 0.85, 0.85, 0]);
  if (o.tutorial) setTimeout(() => say('Find 3 keys. It hunts by sound', 'info', 4.2), 1200);
  return api;
}
