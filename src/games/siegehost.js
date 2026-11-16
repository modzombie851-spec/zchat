import * as E from './siegeengine.js';
import * as T from './siegeteam.js';
import { mkNet, netPush, netRead } from './netlerp.js';

export const BOLT_REV = 1;
export const SRV_ID = '$srv';
const BOT_NAMES = ['Ash', 'Bo', 'Cleo', 'Dex', 'Eli', 'Fay', 'Gus', 'Hana', 'Ivo'];
const TEAM_BOT_SK = ['shock', 'mend', 'hunter', 'guard', 'sprint', 'blink'];
const SNAP_MS = 110, RE_MS = 80, ROSTER_MS = 1500;
const LOBBY_WAIT = 20, PUB_TS = 5, OVER_WAIT = 14, MAX_HUMANS = 10;
export const ROTATION = [['tdm', 'city'], ['hp', 'base'], ['tdm', 'grave'], ['hp', 'fort'], ['tdm', 'base'], ['hp', 'grave'], ['tdm', 'fort'], ['hp', 'city']];

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const num = (v, d = 0) => { const n = Number(v); return Number.isFinite(n) ? n : d; };
const wrapA = (a) => { let x = a; while (x > Math.PI) x -= Math.PI * 2; while (x < -Math.PI) x += Math.PI * 2; return x; };
const validHero = (k) => (E.HEROES[k] ? k : 'blaze');
const r2 = (v) => Math.round(v * 100) / 100;

const modsPack = (h) => { const M = h.mods; const o = [Math.round(M.dmg * 100), M.extra | 0, M.pierce | 0, Math.round(M.rad * 100), Math.round(M.heal * 100), Math.round(M.stun * 100), Math.round(M.slow * 100)]; o.push(h.buffs && h.buffs.fury ? 1 : 0, Math.round((M.fade || 1) * 100)); return o; };
const modsTake = (h, k) => { if (!Array.isArray(k) || k.length < 7 || !h.mods) return; const M = h.mods; M.dmg = clamp(num(k[0], 100) / 100, 0.5, 4); M.extra = clamp(k[1] | 0, 0, 4); M.pierce = clamp(k[2] | 0, 0, 3); M.rad = clamp(num(k[3], 100) / 100, 0.5, 2.5); M.heal = clamp(num(k[4], 100) / 100, 0.5, 3); M.stun = clamp(num(k[5], 100) / 100, 0.5, 3); M.slow = clamp(num(k[6], 100) / 100, 0.5, 3); if (k.length >= 9) { (h.buffs || (h.buffs = {})).fury = k[7] ? 1 : 0; M.fade = clamp(num(k[8], 100) / 100, 1, 2); } };

function heroPack(W, h) {
  const mv = Math.hypot(h.vx || 0, h.vz || 0) > 0.4 ? 1 : 0;
  const f = mv | (h.hid ? 2 : 0) | (W.t - h.seen < 1.2 ? 4 : 0) | (h.pw > 0 ? 8 : 0) | (h.ocT > 0 ? 16 : 0) | (h.shield > 0 ? 32 : 0) | (h.rfT > 0 ? 64 : 0) | (h.spT > 0 ? 128 : 0) | (h.dashT > 0 ? 256 : 0) | (h.jump ? 512 : 0);
  const o = [Math.round(h.x * 20), Math.round(h.z * 20), Math.round(h.yaw * 100), Math.round(h.hp), h.st, f, Math.round(h.sup * 100), Math.round(h.rv * 100), Math.round(h.downT * 10), Math.round(h.max), Math.round((h.shield || 0) / 10), h.lv | 0];
  const f2 = ((h.clkT || 0) > 0 ? 1 : 0) | ((h.recT || 0) > 0 ? 2 : 0) | ((h.stunT || 0) > 0 ? 4 : 0) | (h.buffs && h.buffs.fury ? 8 : 0) | (h.buffs && h.buffs.flow ? 16 : 0) | ((h.sprT || 0) > 0 ? 32 : 0) | ((h.spawnT || 0) > 0 ? 64 : 0) | (h.buffs && h.buffs.guard ? 128 : 0);
  o.push(h.tl | 0, Math.round((h.respT || 0) * 10), f2, Math.round(((h.stats && h.stats.hd) || 0) / 10));
  return o;
}

function applyPack(W, h, p, now, at) {
  if (!Array.isArray(p) || p.length < 9) return;
  const x = num(p[0]) / 20, z = num(p[1]) / 20;
  if (!Number.isFinite(x) || !Number.isFinite(z)) return;
  h.nx = clamp(x, 0, W.A.wx); h.nz = clamp(z, 0, W.A.wz); h.nyaw = num(p[2]) / 100;
  netPush(h.nb || (h.nb = mkNet()), at, [h.nx, h.nz, h.nyaw], now);
  if (h.x == null || h.netAt == null) { h.x = h.nx; h.z = h.nz; h.yaw = h.nyaw; }
  if (p.length >= 12) { h.max = clamp(num(p[9], h.max), 1, 5000000); h.shield = clamp(num(p[10]) * 10, 0, 5000000); h.lv = clamp(p[11] | 0, 1, E.MAX_LEVEL); }
  h.hp = clamp(num(p[3]), 0, h.max);
  const st = clamp(p[4] | 0, 0, 2);
  if (st !== h.st) {
    if (st === 0 && h.st !== 0) { h.x = x; h.z = z; h.nb = null; h.nv = null; }
    h.st = st;
  }
  if (p.length >= 16) {
    h.tl = clamp(p[12] | 0, 1, T.TL_MAX); h.respT = clamp(num(p[13]) / 10, 0, 60);
    const f2 = p[14] | 0;
    h.clkT = f2 & 1 ? 0.35 : 0; h.recV = !!(f2 & 2); h.stunV = !!(f2 & 4); h.sprV = !!(f2 & 32); h.spawnV = !!(f2 & 64);
    const bf = h.buffs || (h.buffs = {});
    bf.fury = f2 & 8 ? 1 : 0; bf.flow = f2 & 16 ? 1 : 0; bf.guard = f2 & 128 ? 1 : 0;
    if (h.stats) h.stats.hd = Math.max(0, num(p[15]) * 10);
  }
  const f = p[5] | 0;
  h.mvF = f & 1; h.hid = !!(f & 2); if (f & 4) h.seen = W.t; h.pw = f & 8 ? 1 : 0;
  h.ocT = f & 16 ? Math.max(h.ocT, 0.3) : 0; h.rfT = f & 64 ? Math.max(h.rfT, 0.3) : 0; h.spT = f & 128 ? Math.max(h.spT, 0.3) : 0; h.dashNet = !!(f & 256); if (!(f & 32)) h.shield = 0;
  h.sup = clamp(num(p[6]) / 100, 0, 1); h.rv = clamp(num(p[7]) / 100, 0, 1); h.downT = clamp(num(p[8]) / 10, 0, E.DOWN_T);
  h.netAt = now; h.gone = false;
}

export function teamRowsOf(W) {
  const S = W.tm;
  return W.order.map((k) => {
    const h = W.heroes[k];
    const kd = (S && S.kd[k]) || { k: 0, d: 0, a: 0 };
    return [k, h.tm, h.key, h.tl || 1, kd.k, kd.d, kd.a, Math.round(h.stats ? h.stats.hd || 0 : 0)];
  });
}

export function makeBoltHost(opt = {}) {
  E.setSquadMax(20);
  const pub = !!opt.pub;
  const now = opt.now || (() => Date.now());
  const rnd = opt.rnd || Math.random;
  const players = new Map();
  const out = [];
  const set = { gm: 'tdm', map: 'city', tl: 8, goal: 0, ts: pub ? PUB_TS : 3, bl: 1, cs: 0 };
  let rot = Math.floor(rnd() * ROTATION.length);
  if (pub) { set.gm = ROTATION[rot][0]; set.map = ROTATION[rot][1]; }
  const H = { phase: 'lobby', W: null, rid: '', ids: [], bots: [], botMeta: {}, seq: 0, snapAt: 0, reAt: 0, rosterAt: 0, lobbyT: LOBBY_WAIT, overT: 0, lead: opt.lead || null, startAt: 0, ms: 0 };
  const send = (t, data, to) => { out.push([to || null, { ...(data || {}), t, from: SRV_ID, at: now() }]); };
  const humans = () => [...players.values()].filter((p) => !p.w).sort((a, b) => a.at - b.at);
  const heroOf = (p) => validHero(p.h || (p.m && p.m.h));
  const powerOf = (p) => clamp(Number(p.m && p.m.pw) | 0 || E.HERO_KEYS.length, 1, 999);
  const sidesFor = (list) => {
    const outS = {}, cnt = [0, 0], sum = [0, 0];
    const cap = Math.max(set.ts, Math.ceil(list.length / 2));
    const fixed = list.filter((p) => p.side === 0 || p.side === 1);
    const free = list.filter((p) => !fixed.includes(p)).sort((a, b) => powerOf(b) - powerOf(a) || a.at - b.at);
    for (const p of fixed) { let s0 = p.side; if (cnt[s0] >= cap) s0 = 1 - s0; outS[p.id] = s0; cnt[s0] += 1; sum[s0] += powerOf(p); }
    for (const p of free) {
      let s0 = sum[0] === sum[1] ? (cnt[0] <= cnt[1] ? 0 : 1) : sum[0] < sum[1] ? 0 : 1;
      if (cnt[s0] >= cap) s0 = 1 - s0;
      outS[p.id] = s0; cnt[s0] += 1; sum[s0] += powerOf(p);
    }
    return outS;
  };
  const leadId = () => {
    if (pub) return null;
    if (H.lead && players.has(H.lead) && !players.get(H.lead).w) return H.lead;
    const hs = humans();
    return hs.length ? hs[0].id : null;
  };

  const cfgNow = () => {
    const W = H.W;
    if (!W || H.phase !== 'play') return null;
    const ids = H.ids;
    return {
      md: 'team', gm: W.tm.gm || 'tdm', map: W.A.key, tl: Math.round(W.tm.tlim / 60), goal: W.tm.goal, ts: W.tm.size, bl: W.tm.bl,
      rid: H.rid, ids, heroes: Object.fromEntries(ids.map((k) => [k, W.heroes[k] ? W.heroes[k].key : 'blaze'])),
      bots: H.bots.map((k) => ({ id: k, n: H.botMeta[k] ? H.botMeta[k].n : 'Bot' })), arena: W.A.key, lv: 'normal', en: 0, seed: W.seed,
      tms: Object.fromEntries(ids.map((k) => [k, W.heroes[k] ? W.heroes[k].tm : 0])), sks: Object.fromEntries(ids.map((k) => [k, W.heroes[k] ? W.heroes[k].sk : 'shock'])),
      cols: Object.fromEntries(ids.map((k) => [k, W.heroes[k] ? W.heroes[k].hc | 0 : 0])), tls: Object.fromEntries(ids.map((k) => [k, W.heroes[k] ? W.heroes[k].tl | 0 : 1])),
    };
  };
  const roster = () => {
    const hs = humans();
    const ids = hs.map((p) => p.id);
    const nm = {}, hk = {};
    for (const p of players.values()) nm[p.id] = String((p.m && p.m.n) || 'Player').slice(0, 16);
    for (const p of hs) hk[p.id] = heroOf(p);
    const playing = H.phase === 'play' && H.W;
    const tm = playing ? Object.fromEntries(ids.map((k) => [k, H.W.heroes[k] ? H.W.heroes[k].tm : 0])) : sidesFor(hs);
    send('roster', {
      ids, nm, hk, ar: 'yard', lv: 'normal', bn: 0, en: 0, md: 'team', gm: set.gm, tmap: set.map, tl: set.tl, gl: set.goal, ts: set.ts, cs: set.cs, tm,
      cfg: cfgNow(), sv: { ph: H.phase, left: H.phase === 'lobby' && pub ? Math.ceil(H.lobbyT) : H.phase === 'over' ? Math.ceil(H.overT) : 0, pub: pub ? 1 : 0, lead: leadId(), bl: set.bl, rev: BOLT_REV },
    });
    H.rosterAt = H.ms;
  };

  const start = () => {
    const hs = humans().slice(0, MAX_HUMANS);
    if (!hs.length) return false;
    const ts0 = clamp(Math.max(set.ts, Math.ceil(hs.length / 2)), 1, 5);
    const sides = sidesFor(hs);
    const heroes = {}, cols = {}, sks = {}, bots = [], ids = [], tms = {};
    const used = [new Set(), new Set()];
    for (const tm of [0, 1]) {
      const mine = hs.filter((p) => sides[p.id] === tm);
      for (const p of mine) {
        const k = heroOf(p);
        heroes[p.id] = k; used[tm].add(k);
        cols[p.id] = clamp(Number(p.c != null ? p.c : p.m && p.m.hc) | 0, 0, 3);
        const sk = p.sk || (p.m && p.m.sk);
        sks[p.id] = T.SKILLS[sk] ? sk : 'shock';
        tms[p.id] = tm;
        ids.push(p.id);
      }
      for (let i = mine.length; i < ts0; i++) {
        const id = `bot${tm}${i}`;
        const free = E.HERO_KEYS.filter((k) => !used[tm].has(k));
        const k = free.length ? free[Math.floor(rnd() * free.length)] : E.HERO_KEYS[(i + tm) % E.HERO_KEYS.length];
        used[tm].add(k);
        heroes[id] = k; cols[id] = (i + tm * 2) % 4; sks[id] = TEAM_BOT_SK[(i + tm * 2 + Math.floor(rnd() * 3)) % TEAM_BOT_SK.length];
        bots.push({ id, n: BOT_NAMES[(bots.length + Math.floor(rnd() * 4)) % BOT_NAMES.length] });
        ids.push(id); tms[id] = tm;
      }
    }
    const cfg = { md: 'team', gm: set.gm, map: set.map, tl: set.tl, goal: set.goal, ts: ts0, bl: set.bl, tms, sks, cols, rid: `${now().toString(36)}${Math.floor(rnd() * 1e4)}`, ids, heroes, bots, arena: set.map, lv: 'normal', en: 0, seed: (rnd() * 1e9) | 0 };
    begin(cfg);
    send('go', cfg);
    roster();
    return true;
  };

  const begin = (cfg) => {
    const ak = T.validMap(cfg.map);
    const W = E.newWorld(ak, 'normal', cfg.seed | 0 || 1, { mode: 'team' });
    W.host = true; W.local = new Set(); W.nowMs = H.ms;
    T.setupTeamWorld(W, { ts: cfg.ts, bl: cfg.bl, gm: cfg.gm, tl: cfg.tl, goal: cfg.goal });
    const slot = [0, 0];
    for (const k of cfg.ids) {
      const h = E.mkHero(k, validHero(cfg.heroes[k]), 0, 0, k.startsWith('bot'), 1);
      h.hc = clamp(Number(cfg.cols && cfg.cols[k]) | 0, 0, 3);
      const tm = cfg.tms && cfg.tms[k] === 1 ? 1 : 0;
      T.initHero(W, h, tm, cfg.sks && cfg.sks[k], slot[tm]++);
      W.heroes[k] = h; W.order.push(k);
    }
    for (const tm of [0, 1]) T.assignRoles(W.order.map((k) => W.heroes[k]).filter((h) => h.tm === tm && h.bot), cfg.ts);
    H.botMeta = {};
    for (const b of cfg.bots || []) { H.botMeta[b.id] = { n: b.n }; W.local.add(b.id); }
    H.W = W; H.rid = cfg.rid; H.ids = cfg.ids.slice(); H.bots = (cfg.bots || []).map((b) => b.id);
    H.seq = 0; H.snapAt = 0; H.reAt = 0; H.phase = 'play'; H.startAt = H.ms;
  };

  const fire = (h, f) => {
    const W = H.W;
    if (!W || !h || h.st !== 0) return false;
    const HD = E.HEROES[h.key];
    const sup = f.kind === 'sup';
    if (sup ? h.sup < 1 : !E.canFire(h)) return false;
    const S = sup ? HD.sup : HD.atk;
    const lob = S.k === 'lob' || S.k === 'mega' || S.k === 'barrage';
    let a = f.a, dist = f.dist;
    if (f.auto || a == null) {
      const rng = S.k === 'turret' ? 9 : S.k === 'slam' || S.k === 'freeze' || S.k === 'bloom' ? HD.atk.rng : S.rng || S.rad || HD.atk.rng;
      const t = E.autoAim(W, h, rng, !lob);
      if (t) {
        const b = W.robots.find((r) => r.id === t.id);
        const tt = lob ? S.flight : t.d / (S.spd || 30);
        const vx = b && b.mv ? Math.sin(b.yaw) * b.mv : 0, vz = b && b.mv ? Math.cos(b.yaw) * b.mv : 0;
        const tx = t.x + vx * tt * 0.7, tz = t.z + vz * tt * 0.7;
        a = Math.atan2(tx - h.x, tz - h.z); dist = Math.hypot(tx - h.x, tz - h.z);
      } else { a = h.yaw; dist = (S.rng || 8) * 0.7; }
    }
    if (S.k === 'blink' && (f.auto || f.a == null)) dist = clamp((dist || S.rng) + 1.2, 2, S.rng);
    const seed = (rnd() * 1e9) | 0;
    const x0 = h.x, z0 = h.z;
    E.fireHero(W, h, f.kind, a, dist, seed);
    send('f', { r: H.rid, h: h.id, c: sup ? 's' : 'a', a: +a.toFixed(3), d: dist == null ? null : +dist.toFixed(2), s: seed, x: r2(x0), z: r2(z0), k: modsPack(h) });
    return true;
  };
  const gadget = (h, f) => {
    const W = H.W;
    if (!W || !h || !E.canGadget(h)) return false;
    const GD = E.HEROES[h.key].gad;
    let a = f && f.a != null ? f.a : null, dist = f && f.dist != null ? f.dist : null;
    if (a == null) {
      if (GD.k === 'jet') { const mv = Math.hypot(h.vx, h.vz); a = mv > 0.5 ? Math.atan2(h.vx, h.vz) : h.yaw; dist = GD.len; }
      else { const t = E.autoAim(W, h, GD.k === 'charge' ? GD.len + 1 : 10, true); a = t ? t.a : h.yaw; dist = t ? t.d : null; }
    }
    const r = E.useGadget(W, h, a, dist);
    send('f', { r: H.rid, h: h.id, c: 'g', a: +a.toFixed(3), d: dist == null ? null : +dist.toFixed(2), x: r2(h.x), z: r2(h.z), k: modsPack(h), tx: r ? r2(r.x1) : undefined, tz: r ? r2(r.z1) : undefined });
    return true;
  };
  const skill = (h, a0) => {
    const W = H.W;
    if (!W || !h || h.st !== 0) return false;
    let a = a0;
    if (a == null) { const mv = Math.hypot(h.vx, h.vz); a = mv > 0.5 ? Math.atan2(h.vx, h.vz) : h.yaw; }
    const r = T.useSkill(W, h, a);
    if (!r) return false;
    send('f', { r: H.rid, h: h.id, c: 'k', sk: r.sk, a: r.a, x: r.x, z: r.z, x1: r.x1, z1: r.z1, t: r.t == null ? undefined : r.t, w: r.w == null ? undefined : r.w });
    return true;
  };
  const dash = (h, a0) => {
    const W = H.W;
    if (!W || !h || !E.canDash(h)) return false;
    let a = a0;
    if (a == null) { const mv = Math.hypot(h.vx, h.vz); a = mv > 0.5 ? Math.atan2(h.vx, h.vz) : h.yaw; }
    E.startDash(W, h, a);
    send('f', { r: H.rid, h: h.id, c: 'd', a: +a.toFixed(3), x: r2(h.x), z: r2(h.z) });
    return true;
  };

  const swapIn = (p) => {
    const W = H.W;
    if (!W || H.ids.includes(p.id)) return;
    const bot = H.bots.find((b) => W.heroes[b]);
    if (!bot) return;
    const old = W.heroes[bot];
    const key = heroOf(p), c = clamp(Number(p.c != null ? p.c : p.m && p.m.hc) | 0, 0, 3);
    const sk0 = T.SKILLS[p.sk || (p.m && p.m.sk)] ? p.sk || p.m.sk : 'shock';
    const x = old.x, z = old.z;
    W.order = W.order.map((k) => (k === bot ? p.id : k)); H.ids = H.ids.map((k) => (k === bot ? p.id : k)); H.bots = H.bots.filter((k) => k !== bot); W.local.delete(bot);
    delete W.heroes[bot];
    const h = E.mkHero(p.id, key, x, z, false, 1); h.hc = c;
    T.initHero(W, h, old.tm, sk0, 0); h.x = x; h.z = z; h.tl = old.tl || 1; h.st = old.st; h.respT = old.respT || 0; h.netAt = now();
    if (W.tm && W.tm.kd && W.tm.kd[bot]) { W.tm.kd[p.id] = W.tm.kd[bot]; delete W.tm.kd[bot]; }
    W.heroes[p.id] = h;
    send('swap', { r: H.rid, b: bot, id: p.id, k: key, c, x: r2(x), z: r2(z), tm: old.tm, sk: sk0, tl: old.tl || 1 });
  };
  const botBack = (id) => {
    const W = H.W;
    const h = W && W.heroes[id];
    if (!h || h.bot) return;
    const bid = `bot${h.tm}${H.ms | 0}`.slice(0, 16);
    const used = new Set(W.order.map((k) => W.heroes[k] && W.heroes[k].key));
    const free = E.HERO_KEYS.filter((k) => !used.has(k));
    const key = free.length ? free[Math.floor(rnd() * free.length)] : h.key;
    const b = E.mkHero(bid, key, h.x, h.z, true, 1); b.hc = (h.hc + 1) % 4;
    T.initHero(W, b, h.tm, TEAM_BOT_SK[Math.floor(rnd() * TEAM_BOT_SK.length)], 0); b.x = h.x; b.z = h.z; b.tl = h.tl || 1; b.st = h.st === 0 ? 0 : 2; b.respT = h.st === 0 ? 0 : Math.max(2, h.respT || 3);
    if (W.tm && W.tm.kd && W.tm.kd[id]) W.tm.kd[bid] = W.tm.kd[id];
    W.order = W.order.map((k) => (k === id ? bid : k)); H.ids = H.ids.map((k) => (k === id ? bid : k));
    delete W.heroes[id]; W.heroes[bid] = b; W.local.add(bid); H.bots.push(bid);
    H.botMeta[bid] = { n: BOT_NAMES[Math.floor(rnd() * BOT_NAMES.length)] };
    T.assignRoles([b], W.tm.size);
    send('swap', { r: H.rid, b: id, id: bid, k: key, c: b.hc, x: r2(b.x), z: r2(b.z), tm: b.tm, sk: b.sk, tl: b.tl, bot: 1, n: H.botMeta[bid].n });
  };

  const over = () => {
    const W = H.W;
    const win = W.over && (W.over.team === 1 || W.over.team === 2) ? W.over.team : 0;
    send('over', { r: H.rid, tw: win, sc: W.tm.score, tr: teamRowsOf(W) });
    H.phase = 'over'; H.overT = OVER_WAIT;
  };
  const toLobby = () => {
    H.W = null; H.phase = 'lobby'; H.lobbyT = LOBBY_WAIT; H.ids = []; H.bots = [];
    if (pub) { rot = (rot + 1) % ROTATION.length; set.gm = ROTATION[rot][0]; set.map = ROTATION[rot][1]; set.cs += 1; }
    send('menu', {});
    roster();
  };

  const events = (W) => {
    for (const e of W.ev) {
      if (e.k === 'down' && e.team) {
        const h = W.heroes[e.id];
        if (h && !e.remote && W.local.has(e.id)) {
          const info = T.deathInfo(W, h);
          send('tk', { r: H.rid, v: info.v, k: info.k, by: info.by, as: info.as });
          T.applyKill(W, info);
        }
      } else if (e.k === 'lvl' && e.card) {
        const h = W.heroes[e.id];
        if (h && h.bot) { const ch = E.cardChoices(h, rnd, E.TEAM_SKIP_CARDS); if (ch.length) E.applyCard(h, ch[Math.floor(rnd() * ch.length)]); }
      }
    }
    W.ev.length = 0;
  };

  const stepPlay = (dt) => {
    const W = H.W;
    W.nowMs = H.ms;
    for (const id of H.bots) {
      const h = W.heroes[id];
      if (!h) continue;
      const inp = T.teamBot(W, h, dt);
      if (inp.fire) fire(h, inp.fire);
      if (inp.gad) gadget(h, inp.gad);
      if (inp.dash != null) dash(h, inp.dash);
      if (inp.skill != null) skill(h, inp.skill);
      if (inp.recall) T.startRecall(W, h);
      E.stepHero(W, h, inp, dt);
      T.stepLocal(W, h, dt, inp);
    }
    const kS = 1 - Math.exp(-dt * 26);
    const tNow = now();
    for (const id of W.order) {
      if (W.local.has(id)) continue;
      const h = W.heroes[id];
      if (!h) continue;
      if (h.nb) {
        const ox = h.x, oz = h.z;
        const v = netRead(h.nb, h.nv || (h.nv = [h.x, h.z, h.yaw]), { ang: [2], lin: [0, 1], ext: 180, base: 110, cap: 420, snap: 5 });
        if (v) { h.x = v[0]; h.z = v[1]; }
        h.yaw += wrapA((v ? v[2] : h.yaw) - h.yaw) * kS;
        h.vx = dt > 0 ? (h.x - ox) / dt : 0; h.vz = dt > 0 ? (h.z - oz) / dt : 0;
      }
      h.ocT = Math.max(0, (h.ocT || 0) - dt); h.rfT = Math.max(0, (h.rfT || 0) - dt); h.spT = Math.max(0, (h.spT || 0) - dt);
      if (h.clkT > 0) h.clkT = Math.max(0, h.clkT - dt);
      if (h.jump) { h.jump.t += dt; if (h.jump.t >= h.jump.T) h.jump = null; }
      if (tNow - (h.netAt || tNow) > 5000 && h.st === 0) { h.st = 2; h.gone = true; }
    }
    const subs = Math.max(1, Math.ceil(dt / 0.034));
    for (let i = 0; i < subs; i++) E.stepWorld(W, dt / subs);
    events(W);
    if (W.over) { over(); return; }
    if (H.ms - H.snapAt > SNAP_MS) {
      H.snapAt = H.ms; H.seq += 1;
      send('es', { r: H.rid, q: H.seq, a: W.robots.filter((b) => b.hp > 0 && !E.STILL_TYPES.has(b.type)).slice(0, 140).map(E.robotSnap), tq: T.snapTeam(W), b: H.bots.map((id) => [id, ...heroPack(W, W.heroes[id])]) });
    }
    if (W.net.length && H.ms - H.reAt > RE_MS) { H.reAt = H.ms; send('re', { r: H.rid, e: W.net.splice(0, W.net.length) }); }
  };

  return {
    pub,
    get phase() { return H.phase; },
    get world() { return H.W; },
    join(id, meta) {
      const m = meta && typeof meta === 'object' ? meta : {};
      const p = players.get(id) || { id, at: H.ms + players.size * 0.001, side: null };
      p.m = m; p.w = !!m.w;
      if (m.h && E.HEROES[m.h]) p.h = m.h;
      if (T.SKILLS[m.sk]) p.sk = m.sk;
      if (typeof m.hc === 'number') p.c = clamp(m.hc | 0, 0, 3);
      players.set(id, p);
      if (!p.w && H.phase === 'play' && H.W && !H.ids.includes(id) && humans().length <= MAX_HUMANS) swapIn(p);
      roster();
    },
    meta(id, meta) {
      const p = players.get(id);
      if (!p) { this.join(id, meta); return; }
      p.m = meta && typeof meta === 'object' ? meta : {};
      if (p.m.h && E.HEROES[p.m.h] && H.phase !== 'play') p.h = p.m.h;
      if (T.SKILLS[p.m.sk] && H.phase !== 'play') p.sk = p.m.sk;
    },
    leave(id) {
      const p = players.get(id);
      players.delete(id);
      if (p && !p.w && H.phase === 'play' && H.W && H.W.heroes[id]) botBack(id);
      if (H.lead === id && !pub) H.lead = null;
      if (!humans().length) { if (H.phase !== 'lobby') { H.W = null; H.phase = 'lobby'; H.ids = []; H.bots = []; } H.lobbyT = LOBBY_WAIT; }
      roster();
    },
    msg(id, m) {
      if (!m || typeof m.t !== 'string') return;
      const p = players.get(id);
      if (!p) return;
      const W = H.W;
      const t = m.t;
      if (t === 'hs') {
        if (!W || m.r !== H.rid) return;
        const h = W.heroes[id];
        if (!h || h.bot) return;
        if (typeof m.q === 'number') { if (m.q <= (h.netQ == null ? -1 : h.netQ)) return; h.netQ = m.q; }
        applyPack(W, h, m.p, now(), num(m.at, now()));
        return;
      }
      if (t === 'f') {
        if (!W || m.r !== H.rid) return;
        const h = W.heroes[id];
        if (!h || W.local.has(id)) return;
        const x = num(m.x, h.x), z = num(m.z, h.z);
        const ox = h.x, oz = h.z;
        if (Math.hypot(x - h.x, z - h.z) < 4) { h.x = x; h.z = z; }
        const a = num(m.a, h.yaw);
        if (m.c === 'd') { h.x = ox; h.z = oz; return; }
        if (m.c === 'k') {
          const sk = String(m.sk || '');
          if (T.SKILLS[sk]) { h.sk = sk; T.applySkill(W, h, { sk, a, x, z, x1: m.x1 == null ? undefined : num(m.x1), z1: m.z1 == null ? undefined : num(m.z1), t: m.t == null ? null : m.t | 0, w: m.w === 0 || m.w === 1 ? m.w : undefined }, false); }
          h.x = ox; h.z = oz; return;
        }
        modsTake(h, m.k);
        if (m.c === 'g') { if (h.gad <= 0) h.gad = 1; h.gadCD = 0; E.useGadget(W, h, a, m.d == null ? null : clamp(num(m.d), 0, 30), m.tx == null ? null : num(m.tx), m.tz == null ? null : num(m.tz)); }
        else E.fireHero(W, h, m.c === 's' ? 'sup' : 'atk', a, m.d == null ? null : clamp(num(m.d), 0, 30), num(m.s, 1) | 0);
        h.x = ox; h.z = oz;
        return;
      }
      if (t === 'tk') {
        if (!W || m.r !== H.rid || typeof m.v !== 'string' || !W.heroes[m.v] || m.v !== id) return;
        T.applyKill(W, { v: m.v, k: typeof m.k === 'string' && W.heroes[m.k] ? m.k : null, by: typeof m.by === 'number' || typeof m.by === 'string' ? m.by : null, as: Array.isArray(m.as) ? m.as.filter((x) => typeof x === 'string' && W.heroes[x]).slice(0, 4) : [] });
        return;
      }
      if (t === 'hero') {
        if (E.HEROES[m.k]) p.h = m.k;
        if (typeof m.c === 'number') p.c = clamp(m.c | 0, 0, 3);
        if (T.SKILLS[m.sk]) p.sk = m.sk;
        if (H.phase !== 'play') roster();
        return;
      }
      if (t === 'side') { if (H.phase !== 'play') { p.side = m.s === 1 ? 1 : 0; roster(); } return; }
      if (t === 'cfg') {
        if (pub || id !== leadId() || H.phase === 'play') return;
        if (m.gm === 'tdm' || m.gm === 'hp') set.gm = m.gm;
        if (typeof m.map === 'string') set.map = T.validMap(m.map);
        if (typeof m.tl === 'number') set.tl = clamp(m.tl | 0, 3, 20);
        if (typeof m.gl === 'number') set.goal = clamp(m.gl | 0, 0, 500);
        if (typeof m.ts === 'number') set.ts = clamp(m.ts | 0, 1, 5);
        if (typeof m.bl === 'number') set.bl = clamp(m.bl | 0, 0, 2);
        set.cs = Math.max(set.cs + 1, Number.isFinite(m.cs) ? Math.min(1e9, m.cs | 0) : 0);
        roster();
        return;
      }
      if (t === 'start') { if (!pub && id === leadId() && H.phase !== 'play') start(); return; }
      if (t === 'menu') { if (!pub && id === leadId() && H.phase === 'over') toLobby(); }
    },
    tick(dt) {
      H.ms += dt * 1000;
      if (H.phase === 'play' && H.W) stepPlay(dt);
      else if (H.phase === 'over') { H.overT -= dt; if (H.overT <= 0) { if (pub) toLobby(); else H.overT = 1e9; } }
      else if (H.phase === 'lobby' && pub) { if (humans().length) { H.lobbyT -= dt; if (H.lobbyT <= 0) start(); } else H.lobbyT = LOBBY_WAIT; }
      if (H.ms - H.rosterAt > ROSTER_MS) roster();
    },
    take() { return out.splice(0, out.length); },
    info() {
      const W = H.W;
      return { n: humans().length, cap: MAX_HUMANS, gm: set.gm, map: set.map, ph: H.phase, left: W && W.tm ? Math.max(0, Math.round(W.tm.tlim - W.tm.t)) : 0, sc: W && W.tm ? W.tm.score.slice() : [0, 0] };
    },
  };
}
