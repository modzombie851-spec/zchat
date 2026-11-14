import { makeSim } from '../../src/games/zsim.js';

export const CAP = { siege: 20, race: 12, roll: 8, gulp: 12, duo: 2, zombie: 5 };
export const REGIONS = { asia: 'apac', usa: 'enam', eu: 'weur' };
const TICK = 1 / 15;
export const SIM_REV = 58;

export function parseName(name) {
  const [kind, game, ...rest] = String(name || '').split(':');
  return { kind, game, rest: rest.join(':') };
}

export class RoomCore {
  constructor(name, io) {
    this.name = name;
    this.io = io;
    const p = parseName(name);
    this.game = p.game;
    this.zombie = p.kind === 'z';
    this.cap = CAP[this.game] || 20;
    this.sim = null;
    this.loop = null;
    this.snapT = 0;
    this.rosterKey = '';
    this.rate = new Map();
    this.report = null;
    this.idleAt = 0;
    const rid = this.zombie ? String(p.rest.split(':')[1] || '') : '';
    this.noBots = /^[hx]/.test(rid);
    this.open_ = /^([0-9]+|[ox][a-z0-9]+)$/.test(rid);
    this.rid = rid;
  }
  conns() { return this.io.list(); }
  others(id) { return this.conns().filter((c) => c.id !== id); }
  sendTo(c, obj) { try { this.io.send(c.ws, typeof obj === 'string' ? obj : JSON.stringify(obj)); } catch {} }
  broadcast(obj, except) { const s = JSON.stringify(obj); for (const c of this.conns()) if (c.id !== except) this.sendTo(c, s); }
  count(skip) { const ids = new Set(); for (const c of this.conns()) if (c.ws !== skip) ids.add(c.id); return ids.size; }

  open(c) {
    for (const o of this.conns()) if (o.id === c.id && o.ws !== c.ws) { try { this.io.close(o.ws, 4001, 'replaced'); } catch {} }
    const live = this.conns().filter((o) => o.ws !== c.ws && o.id !== c.id);
    if (live.length >= this.cap) { this.sendTo(c, { t: '$full', cap: this.cap }); try { this.io.close(c.ws, 4002, 'full'); } catch {} return false; }
    if (this.zombie) {
      this.ensureSim();
      this.idleAt = 0;
      this.sim.addPlayer(c.id, { n: c.m && c.m.n, sv: c.m && c.m.sv, col: c.m && c.m.col, w: c.m && c.m.w, pet: c.m && c.m.pet, cash: c.m && c.m.cash });
      if (this.io.away) this.io.away(c.id, this.name, false);
      this.sendTo(c, { t: '$hi', me: c.id, at: Date.now(), room: this.name, cap: this.cap, roster: this.sim.roster(), s: this.sim.snap(), v: SIM_REV });
      this.startLoop();
    } else {
      this.sendTo(c, { t: '$hi', me: c.id, at: Date.now(), room: this.name, cap: this.cap, peers: live.map((o) => [o.id, o.m || {}]) });
      this.broadcast({ t: '$join', id: c.id, m: c.m || {} }, c.id);
    }
    this.touch();
    return true;
  }

  close(c) {
    const still = this.conns().some((o) => o.id === c.id && o.ws !== c.ws);
    if (still) return;
    if (this.zombie && this.sim) {
      if (this.sim.awayPlayer) { this.sim.awayPlayer(c.id); if (this.io.away) this.io.away(c.id, this.name, true); }
      else this.sim.removePlayer(c.id);
    } else this.broadcast({ t: '$leave', id: c.id }, c.id);
    this.rate.delete(c.id);
    if (!this.conns().filter((o) => o.ws !== c.ws).length) {
      if (this.zombie && this.sim) this.idleAt = Date.now();
      else this.stopLoop();
    }
    this.touch(c.ws);
  }

  allow(id) {
    const now = Date.now();
    let r = this.rate.get(id);
    if (!r) { r = { t: now, n: 0 }; this.rate.set(id, r); }
    if (now - r.t > 1000) { r.t = now; r.n = 0; }
    r.n++;
    return r.n <= (this.zombie ? 40 : 60);
  }

  message(c, raw) {
    if (typeof raw !== 'string' || raw.length > 12000) return;
    if (!this.allow(c.id)) return;
    let m;
    try { m = JSON.parse(raw); } catch { return; }
    if (!m || typeof m.t !== 'string') return;
    const t = m.t;
    if (t === '$ping') { this.sendTo(c, { t: '$pong', c: m.c, at: Date.now() }); return; }
    if (t === '$meta') {
      c.m = m.m && typeof m.m === 'object' ? m.m : {};
      this.io.save(c);
      if (this.zombie && this.sim) this.sim.addPlayer(c.id, c.m);
      else this.broadcast({ t: '$meta', id: c.id, m: c.m }, c.id);
      return;
    }
    if (t[0] === '$') return;
    if (this.zombie) {
      const S = this.sim;
      if (!S) return;
      if (t === 'p') { S.setPlayer(c.id, m); if (Array.isArray(m.h) && m.h.length) S.shoot(c.id, m.w, m.h); if (Array.isArray(m.nh) && m.nh.length && S.shootNest) S.shootNest(c.id, m.w, m.nh); if (m.sh) this.broadcast({ t: 'sh', from: c.id, sh: m.sh, w: m.w }, c.id); return; }
      if (t === 'ml') { S.melee(c.id, m.k); return; }
      if (t === 'th') { S.throwAt(c.id, m.k, Number(m.x), Number(m.z)); return; }
      if (t === 'ct' || t === 'emo') { this.broadcast({ ...m, from: c.id, at: Date.now() }, c.id); return; }
      return;
    }
    const out = JSON.stringify({ ...m, from: c.id, at: Date.now() });
    if (typeof m.to === 'string') { for (const o of this.conns()) if (o.id === m.to) this.sendTo(o, out); return; }
    for (const o of this.conns()) if (o.id !== c.id) this.sendTo(o, out);
  }

  ensureSim() {
    if (this.sim) return;
    this.sim = makeSim({ maxAlive: 80, botFill: this.noBots ? 0 : 4, firstBreak: 25 });
    for (const c of this.conns()) this.sim.addPlayer(c.id, c.m || {});
  }

  startLoop() {
    if (this.loop) return;
    let last = Date.now();
    this.loop = setInterval(() => {
      const now = Date.now();
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.25) dt = 0.25;
      try { this.tick(dt); } catch {}
    }, Math.round(TICK * 1000));
  }
  stopLoop() { if (this.loop) { clearInterval(this.loop); this.loop = null; } }

  tick(dt) {
    const S = this.sim;
    if (!S) return;
    if (this.idleAt && !this.conns().length && Date.now() - this.idleAt > 35000) {
      for (const p of [...S.players.values()]) if (!p.bot) S.removePlayer(p.id);
      this.idleAt = 0;
      this.stopLoop();
      this.touch();
      return;
    }
    S.step(dt);
    this.snapT -= dt;
    if (this.snapT > 0) return;
    this.snapT = 0.095;
    const ev = S.takeEvents();
    const roster = S.roster();
    const key = roster.map((r) => r.join(',')).join('|');
    const rs = key !== this.rosterKey ? roster : undefined;
    this.rosterKey = key;
    for (const c of this.conns()) {
      const p = S.players.get(c.id);
      const snap = S.snap(p ? p.x : null, p ? p.z : null, 90);
      this.sendTo(c, { t: '$s', at: Date.now(), ...snap, ev: ev.length ? ev : undefined, rs });
    }
    this.touch();
  }

  touch(skip) {
    if (!this.io.report) return;
    const n = this.count(skip);
    const w = this.sim ? this.sim.wave : 0;
    let h = '';
    if (this.zombie && this.sim) { for (const c of this.conns()) if (c.ws !== skip) { const p = this.sim.players.get(c.id); if (p && !p.bot) { h = String(p.n || '').slice(0, 16); break; } } }
    const k = `${n}:${w}:${h}`;
    const now = Date.now();
    if (this.report && this.report.k === k && now - this.report.at < 20000) return;
    if (this.report && now - this.report.at < 3000 && this.report.n === n) return;
    this.report = { k, at: now, n };
    this.io.report({ id: this.name, n, w, cap: this.cap, h, b: this.noBots ? 0 : 1, o: this.open_ ? 1 : 0 });
  }
}
