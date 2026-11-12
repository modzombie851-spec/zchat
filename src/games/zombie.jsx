import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Portal, useBackClose, FONT } from '../App.jsx';
import { createRenderer } from './race3d.js';
import { Sfx } from './sfx.js';
import { EMOTES, CHAT_PHRASES, Sheet, injectCss } from './livekit.jsx';
import { GBtn, GPill, GPanel, GTitle, GIcon, GHudBtn, GHudPanel, GNotices, useNotices, GJoy, useJoystick, injectKitCss, kitTap, pressProps, useCtlLook, useGameStage, GControlsPanel, GLobby, GLobbySheet, GSeg, GFeed, GSkin, GChatFeed, useChatFeed, TOUCHY, weakPhone } from './gamekit.jsx';
import { makeSim, collide, rayBlocked, WEAPONS, WKEYS, MELEE, THROW, ZT, ZKEYS, SURV, SURV_GUN } from './zsim.js';
import { makeView, personItems, toWorld, OUTFITS, OUTFIT_SWATCH, TIERS } from './zview.js';
import { SURVIVORS, survivorMeshes } from './zmesh.js';
import { floorH } from './ztown.js';
import { cloudOn, openCloud, pingRegions, listRooms, bestRegion, REGION_NAMES, REGION_KEYS } from './zcloud.js';

const PREF = { sv: 'zchat-zombie-sv', col: 'zchat-zombie-col', gun: 'zchat-zombie-gun', gfx: 'zchat-zombie-gfx', best: 'zchat-zombie-best' };
const getPref = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch { return d; } };
const setPref = (k, v) => { try { localStorage.setItem(k, String(v)); } catch {} };
const SV_TEXT = { jay: 'Steady with a rifle', maya: 'Shotgun at close range', tom: 'Big Tom sprays an SMG', rin: 'Sniper, one shot kills', doc: 'Quick pistol, heals a little faster' };
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const angLerp = (a, b, t) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return a + d * t; };
const fmt = (n) => Math.round(n).toLocaleString('en-US');

let noiseBuf = null;
function gunSound(kind, vol = 1) {
  const B = Sfx.bus && Sfx.bus();
  if (!B || vol < 0.04) return;
  const { ac, out } = B;
  try {
    if (!noiseBuf) { noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 1.5); }
    const t = ac.currentTime;
    const cfg = { pistol: [2400, 0.09, 0.5, 140], smg: [2800, 0.06, 0.38, 160], rifle: [1900, 0.1, 0.55, 110], shotgun: [1200, 0.22, 0.8, 70], sniper: [1500, 0.3, 0.85, 60], boom: [500, 0.9, 1, 45], bat: [900, 0.08, 0.35, 0] }[kind] || [2000, 0.1, 0.5, 120];
    const src = ac.createBufferSource(); src.buffer = noiseBuf;
    const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(cfg[0], t); f.frequency.exponentialRampToValueAtTime(Math.max(120, cfg[0] * 0.25), t + cfg[1]);
    const g = ac.createGain(); g.gain.setValueAtTime(cfg[2] * vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + cfg[1] + 0.05);
    src.connect(f); f.connect(g); g.connect(out); src.start(t); src.stop(t + cfg[1] + 0.08);
    if (cfg[3]) { const o = ac.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(cfg[3], t); o.frequency.exponentialRampToValueAtTime(cfg[3] * 0.4, t + cfg[1]); const g2 = ac.createGain(); g2.gain.setValueAtTime(0.5 * vol, t); g2.gain.exponentialRampToValueAtTime(0.001, t + cfg[1] + 0.04); o.connect(g2); g2.connect(out); o.start(t); o.stop(t + cfg[1] + 0.06); }
  } catch {}
}

const portraitCache = new Map();
let portraitR = null;
function portrait(sv, col, gun) {
  const key = `${sv}:${col}:${gun}`;
  if (portraitCache.has(key)) return portraitCache.get(key);
  let url = '';
  try {
    if (!portraitR) { const cv = document.createElement('canvas'); cv.width = 168; cv.height = 168; portraitR = { cv, R: createRenderer(cv, { keep: true, shadowSize: 256, aa: true }), cache: new Map() }; }
    const P = portraitR;
    if (P.R) {
      const S0 = SURVIVORS.find((s) => s.key === sv) || SURVIVORS[0];
      const spec = { ...S0, ...(OUTFITS[sv] && OUTFITS[sv][col] ? OUTFITS[sv][col] : {}), gun };
      let M = P.cache.get(key);
      if (!M) { const mm = survivorMeshes(spec, 'ready'); M = { body: P.R.mesh(mm.body), leg: P.R.mesh(mm.leg), hip: mm.hip }; P.cache.set(key, M); }
      const items = [];
      personItems(items, M, 0, 0, 0.35, { y: 0, cast: false });
      const env = { sunDir: [-0.5, 0.6, 0.62], sunCol: [2.1, 1.85, 1.6], skyCol: [0.5, 0.52, 0.58], gndCol: [0.3, 0.26, 0.2], fogCol: [0.2, 0.2, 0.2], fogSun: [1, 1, 1], fogSunLin: [1, 1, 1], horizon: [0.12, 0.13, 0.1], zenith: [0.2, 0.22, 0.16], fogDen: 0.0001, exposure: 1.0, shadowRange: 3, clouds: 0, cloud: [1, 1, 1], time: 0, detail: 1, shadows: false };
      P.R.render({ env, cam: { pos: [0.55, 1.5, 1.55], at: [0.02, 1.32, 0], fov: 0.62 }, items, parts: [] });
      url = P.cv.toDataURL('image/png');
    }
  } catch { url = ''; }
  portraitCache.set(key, url);
  return url;
}

function rayZombie(ox, oy, oz, dx, dy, dz, maxD, zs, skip) {
  let best = null;
  for (const z of zs) {
    const T = ZT[z.k];
    const r = T.r * 1.15, h = T.h;
    const fx = ox - z.x, fz = oz - z.z;
    const a = dx * dx + dz * dz, b = 2 * (fx * dx + fz * dz), c = fx * fx + fz * fz - r * r;
    const disc = b * b - 4 * a * c;
    if (disc < 0 || a < 1e-6) continue;
    const s = Math.sqrt(disc);
    let t = (-b - s) / (2 * a);
    if (t < skip) t = (-b + s) / (2 * a);
    if (t < skip || t > maxD || (best && t > best.t)) continue;
    const y = oy + dy * t - z.y;
    if (y < 0 || y > h) continue;
    best = { z, t, head: y > h * 0.8 };
  }
  return best;
}

export function ZombieGamePage({ me, myId, onClose }) {
  injectKitCss();
  injectCss();
  const look = useCtlLook('zombie');
  const GS = useGameStage(look);
  const { top, right, bottom, left } = GS.at;
  const land = GS.land;
  const [phase, setPhase] = useState('load');
  const [sv, setSv] = useState(() => { const v = getPref(PREF.sv, 'jay'); return SURV.includes(v) ? v : 'jay'; });
  const [col, setCol] = useState(() => clamp(Number(getPref(PREF.col, 0)) | 0, 0, 3));
  const [gun, setGun] = useState(() => { const v = getPref(PREF.gun, ''); return WEAPONS[v] ? v : SURV_GUN[sv] || 'rifle'; });
  const [tier, setTier] = useState(() => { const v = Number(getPref(PREF.gfx, -1)); return v >= 0 && v <= 2 ? v : weakPhone() ? 0 : 1; });
  const [pings, setPings] = useState(null);
  const [rooms, setRooms] = useState(null);
  const [mode, setMode] = useState(null);
  const [hud, setHud] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [result, setResult] = useState(null);
  const [banner, setBanner] = useState(null);
  const [netErr, setNetErr] = useState('');
  const [feedK, setFeedK] = useState([]);
  const [notes, pushNote] = useNotices();
  const [chatFeed, pushChat] = useChatFeed();
  const [chatLog, setChatLog] = useState([]);
  const [chatText, setChatText] = useState('');
  const [loadPct, setLoadPct] = useState(0);
  const cvRef = useRef(null);
  const wrapRef = useRef(null);
  const G = useRef(null);
  if (!G.current) G.current = { V: null, keys: new Set(), lookP: new Map(), yaw: Math.PI, pitch: -0.06, fire: false, revHold: false, snaps: [], dying: [], fires: [], fx: [], tr: [], anim: new Map(), panim: new Map(), roster: new Map(), names: {}, me: null, sim: null, net: null, t: 0, sendT: 0, pend: [], pendSh: [], hm: 0, shake: 0, hurtT: 0, menuT: 0, best: Number(getPref(PREF.best, 0)) || 0 };
  const myFirst = String((me && me.name) || 'You').split(' ')[0].slice(0, 16);
  const J = useJoystick(wrapRef, { radius: () => (GS.land ? 54 : 50), rot: () => GS.side, zone: (x, y, b) => x < b.width * 0.42 && y > b.height * 0.32, enabled: () => phase === 'play' });

  useBackClose(true, () => { if (sheet) setSheet(null); else if (phase === 'play') quit(); else onClose(); });

  useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => {
      try {
        setLoadPct(30);
        await new Promise((r) => requestAnimationFrame(() => r()));
        const V = makeView(cvRef.current, tier);
        if (!alive) { if (V) V.dispose(); return; }
        if (!V) { setNetErr('gl'); setPhase('menu'); return; }
        G.current.V = V;
        setLoadPct(100);
        setPhase('menu');
      } catch { if (alive) { setNetErr('gl'); setPhase('menu'); } }
    }, 60);
    return () => { alive = false; clearTimeout(t); };
  }, [tier]);
  useEffect(() => () => { const g = G.current; if (g.net) g.net.close(); if (g.V) g.V.dispose(); }, []);
  useEffect(() => {
    if (phase !== 'menu' || !cloudOn()) return undefined;
    let alive = true;
    pingRegions().then((p) => { if (alive) setPings(p); });
    const load = () => listRooms().then((r) => { if (alive) setRooms(r); });
    load();
    const iv = setInterval(load, 8000);
    return () => { alive = false; clearInterval(iv); };
  }, [phase]);
  useEffect(() => { if (phase === 'menu') { Sfx.init(); Sfx.music('lobbySiege', true); } else if (phase === 'play') Sfx.music('siege', true); }, [phase]);
  useEffect(() => () => Sfx.music(null, false), []);

  const roomCount = (reg) => (rooms && rooms[reg] ? rooms[reg].reduce((a, r) => a + (r.p || 0), 0) : 0);
  const pickRoom = (reg) => {
    const list = (rooms && rooms[reg]) || [];
    const open = list.filter((r) => r.p < (r.cap || 50)).sort((a, b) => b.p - a.p);
    if (open.length) return open[0].n;
    let n = 1;
    while (list.some((r) => r.n === n)) n++;
    return n;
  };

  const nameOf = (id) => { const g = G.current; if (id === myId) return 'You'; const r = g.roster.get(id); return r ? r.n : 'Friend'; };

  const start = (m) => {
    const g = G.current;
    if (!g.V) return;
    Sfx.init();
    kitTap();
    setPref(PREF.sv, sv); setPref(PREF.col, col); setPref(PREF.gun, gun);
    g.snaps = []; g.dying = []; g.fires = []; g.fx = []; g.tr = []; g.anim.clear(); g.panim.clear(); g.roster.clear(); g.pend = []; g.pendSh = []; g.t = 0; g.sendT = 0; g.lastW = 0; g.over = false;
    g.me = { x: 0, z: -24, yaw: 0, w: gun, gun, mag: { [gun]: WEAPONS[gun].mag }, rel: 0, fcd: 0, nades: 2, molos: 1, ph: 0, hp: 100, st: 0, rev: 0, kills: 0, pts: 0, mv: 0, swing: 0 };
    g.yaw = 0; g.pitch = -0.06;
    setResult(null); setSheet(null); setNetErr(''); setFeedK([]); setChatLog([]);
    if (m.solo) {
      const S = makeSim({ botFill: 4, maxAlive: TIERS[tier].zmax, firstBreak: 8 });
      S.addPlayer(myId, { n: myFirst, sv, col });
      const p = S.players.get(myId);
      g.me.x = p.x; g.me.z = p.z;
      g.sim = S; g.simAcc = 0;
      for (const r of S.roster()) g.roster.set(r[0], { n: r[1], sv: r[2], col: r[3], bot: !!r[4] });
      applySnap(S.snap(), performance.now());
    } else {
      g.sim = null;
      g.net = openCloud({
        g: 'zombie', r: m.r, reg: m.reg, meta: { n: myFirst, sv, col, w: gun },
        onState: (s) => { if (s.err === 'full') { setNetErr('full'); } else if (s.err === 'lost') setNetErr('lost'); else if (s.ok) setNetErr(''); if (s.rtt) g.rtt = s.rtt; },
        onMsg: (msg) => onNet(msg),
      });
    }
    if (typeof window !== 'undefined' && window.__zfake) window.__zdead = g;
    setMode(m);
    setPhase('play');
    J.reset();
  };
  const quit = () => {
    const g = G.current;
    if (g.net) { g.net.close(); g.net = null; }
    g.sim = null;
    setMode(null); setResult(null); setSheet(null); setHud(null);
    setPhase('menu');
  };

  const onNet = (m) => {
    const g = G.current;
    if (m.t === '$hi') {
      for (const r of m.roster || []) g.roster.set(r[0], { n: r[1], sv: r[2], col: r[3], bot: !!r[4] });
      if (m.s) applySnap(m.s, performance.now());
      const p = (m.s && m.s.p || []).find((q) => q[0] === myId);
      if (p && g.me) { g.me.x = p[1] / 10; g.me.z = p[2] / 10; }
      return;
    }
    if (m.t === '$s') {
      if (m.rs) { g.roster.clear(); for (const r of m.rs) g.roster.set(r[0], { n: r[1], sv: r[2], col: r[3], bot: !!r[4] }); }
      applySnap(m, performance.now());
      return;
    }
    if (m.t === 'sh' && Array.isArray(m.sh)) { for (const s of m.sh.slice(0, 4)) remoteShot(m.from, s, m.w); return; }
    if (m.t === 'ct' && typeof m.x === 'string') { const t = m.x.slice(0, 90); pushChat(nameOf(m.from), t, '#9CD4FF'); setChatLog((l) => [...l.slice(-30), { who: nameOf(m.from), t }]); return; }
    if (m.t === 'emo' && EMOTES.includes(m.e)) { pushChat(nameOf(m.from), m.e, '#9CD4FF'); }
  };

  const applySnap = (s, at) => {
    const g = G.current;
    const zs = new Map();
    const Z = s.z || [];
    for (let i = 0; i + 6 < Z.length; i += 7) zs.set(Z[i], { id: Z[i], k: ZKEYS[Z[i + 1]] || 'walker', x: Z[i + 2] / 10, z: Z[i + 3] / 10, yaw: Z[i + 4] / 100, hp: Z[i + 5], fl: Z[i + 6] });
    const ps = new Map();
    for (const p of s.p || []) ps.set(p[0], { id: p[0], x: p[1] / 10, z: p[2] / 10, yaw: p[3] / 100, aim: p[4] / 100, w: p[5], hp: p[6], st: p[7], rev: p[8] / 100, fl: p[9], kills: p[10], pts: p[11] });
    g.snaps.push({ at, zs, ps });
    if (g.snaps.length > 4) g.snaps.shift();
    g.wave = s.w; g.ph = s.ph; g.tl = s.tl; g.zl = s.zl;
    const mine = ps.get(myId);
    if (mine && g.me) {
      const was = g.me.st;
      g.me.hp = mine.hp; g.me.st = mine.st; g.me.rev = mine.rev; g.me.kills = mine.kills; g.me.pts = mine.pts;
      if (was !== 0 && mine.st === 0 && Math.hypot(mine.x - g.me.x, mine.z - g.me.z) > 3) { g.me.x = mine.x; g.me.z = mine.z; }
      if (was === 0 && mine.st === 1) { Sfx.play('pdie', { vol: 0.7 }); }
    }
    for (const e of s.ev || []) onEvent(e, ps);
  };

  const fxPush = (p) => { const g = G.current; if (g.fx.length < 260) g.fx.push(p); };
  const muzzleAt = (id, ps) => {
    const g = G.current;
    const p = id === myId && g.me ? { x: g.me.x, z: g.me.z, yaw: g.yaw } : ps ? ps.get(id) : null;
    if (!p) return null;
    const r = g.roster.get(id) || { sv: 'jay', col: 0 };
    const gk = id === myId ? g.me.w : p.w;
    if (!WEAPONS[gk]) return [p.x, floorH(p.x, p.z) + 1.35, p.z];
    const M = g.V.surv(r.sv || 'jay', gk, r.col | 0, 'aim');
    const w = toWorld(p.x, p.z, p.yaw, M.muzzle || [0.1, 1.4, 0.8]);
    return [w[0], w[1] + floorH(p.x, p.z), w[2]];
  };
  const remoteShot = (id, s, w) => {
    const g = G.current;
    if (!Array.isArray(s) || s.length < 7) return;
    const o = [s[0] / 10, s[1] / 10, s[2] / 10], d = [s[3] / 100, s[4] / 100, s[5] / 100], L = s[6] / 10;
    tracer(o, [o[0] + d[0] * L, o[1] + d[1] * L, o[2] + d[2] * L]);
    fxPush({ x: o[0], y: o[1], z: o[2], size: 0.5, alpha: 1, type: 16, life: 0.06 });
    if (g.me) gunSound(w || 'rifle', 0.6 / (1 + Math.hypot(o[0] - g.me.x, o[2] - g.me.z) / 10));
  };
  const tracer = (a, b) => { const g = G.current; if (g.tr.length < 80) g.tr.push({ a, b, life: 0.07 }); };

  const onEvent = (e, ps) => {
    const g = G.current;
    const k = e[0];
    if (k === 'k') {
      const last = g.snaps.length > 1 ? g.snaps[g.snaps.length - 2].zs.get(e[1]) : null;
      const cur = g.anim.get(e[1]);
      const src = cur || last;
      if (src) g.dying.push({ k: (last && last.k) || (cur && cur.k) || 'walker', x: src.x, z: src.z, yaw: src.yaw || 0, t: 0 });
      g.anim.delete(e[1]);
      if (e[2] === myId) { g.hm = 0.22; Sfx.play('poof', { vol: 0.45 }); }
    } else if (k === 'ex') {
      const x = e[1] / 10, z = e[2] / 10, r = e[3] / 10, y = floorH(x, z);
      for (let i = 0; i < 22; i++) { const a = Math.random() * 6.28, d = Math.random() * r * 0.6; fxPush({ x: x + Math.cos(a) * d, y: y + 0.4 + Math.random() * 2.2, z: z + Math.sin(a) * d, size: 1.2 + Math.random() * 1.6, alpha: 0.95, type: 12, life: 0.5 + Math.random() * 0.4, vy: 1.2 }); }
      for (let i = 0; i < 14; i++) { const a = Math.random() * 6.28, d = Math.random() * r * 0.7; fxPush({ x: x + Math.cos(a) * d, y: y + 1 + Math.random() * 2, z: z + Math.sin(a) * d, size: 2 + Math.random() * 2.4, alpha: 0.7, type: 11, life: 1.6 + Math.random(), vy: 1.6 }); }
      fxPush({ x, y: y + 1, z, size: r * 1.4, alpha: 1, type: 16, life: 0.12 });
      if (g.me) { const d = Math.hypot(x - g.me.x, z - g.me.z); gunSound('boom', 1.1 / (1 + d / 12)); g.shake = Math.max(g.shake, clamp(1 - d / 30, 0, 0.8)); }
    } else if (k === 'fi') {
      g.fires.push({ x: e[1] / 10, z: e[2] / 10, r: e[3] / 10, life: e[4], max: e[4] });
      Sfx.play('fireball', { vol: 0.6 });
    } else if (k === 'zh') {
      if (e[2] === myId) { g.hurtT = 0.45; g.shake = Math.max(g.shake, 0.35); Sfx.play('hit', { vol: 0.6 }); try { navigator.vibrate && navigator.vibrate(30); } catch {} }
      const a = g.anim.get(e[1]); if (a) a.atk = 0.35;
    } else if (k === 'bs') {
      const p = ps.get(e[1]);
      const tgt = g.anim.get(e[2]);
      if (p && tgt) { const o = muzzleAt(e[1], ps); if (o) { tracer(o, [tgt.x, floorH(tgt.x, tgt.z) + 1.2, tgt.z]); fxPush({ x: o[0], y: o[1], z: o[2], size: 0.45, alpha: 1, type: 16, life: 0.06 }); if (g.me) gunSound(p.w, 0.5 / (1 + Math.hypot(p.x - g.me.x, p.z - g.me.z) / 9)); } }
    } else if (k === 'dn') {
      pushFeed(`${nameOf(e[1])} is down`, '#FF8A7A');
    } else if (k === 'rv') {
      if (e[2]) pushFeed(`${nameOf(e[2])} helped ${nameOf(e[1])} up`, '#9CF0B4');
      if (e[1] === myId) Sfx.play('shield', { vol: 0.6 });
    } else if (k === 'w') {
      g.me && (g.me.nades = 2, g.me.molos = 1);
      setBanner({ t: `Wave ${e[1]}`, s: e[1] % 5 === 0 ? 'A brute is coming' : 'Hold the town', at: Date.now() });
      Sfx.play('alert', { vol: 0.7 });
    } else if (k === 'wc') {
      setBanner({ t: `Wave ${e[1]} cleared`, s: 'Catch your breath', at: Date.now() });
      Sfx.play('win', { vol: 0.6 });
    } else if (k === 'go') {
      const best = Math.max(g.best, e[1]);
      g.best = best; setPref(PREF.best, best);
      setResult({ wave: e[1], kills: g.me ? g.me.kills : 0, pts: g.me ? g.me.pts : 0, best, at: Date.now() });
      Sfx.play('die', { vol: 0.7 });
    } else if (k === 'rs') {
      if (e[1] === '*') { setResult(null); if (g.me) { g.me.mag = { [g.me.gun]: WEAPONS[g.me.gun].mag }; } }
    } else if (k === 'pj') {
      if (g.roster.size < 14 && e[1] !== myId) { const r = g.roster.get(e[1]); if (r && !r.bot) pushNote(`${r.n} joined`, 'join'); }
    } else if (k === 'th') {
      const p = ps.get(e[1]);
      if (p) g.fx.push({ nade: true, k: e[2], x0: p.x, z0: p.z, x1: e[3] / 10, z1: e[4] / 10, t: 0, life: e[2] === 'grenade' ? THROW.grenade.fuse : 0.9 });
    } else if (k === 'm') {
      const a = g.anim.get(e[1]); if (a) a.swing = 0.3;
    }
  };
  const pushFeed = (text, colr) => setFeedK((v) => [...v.slice(-4), { id: `${Date.now()}${Math.random()}`, text, col: colr, life: 4.2 }]);

  const fireGun = (g, now) => {
    const M = g.me;
    const W = WEAPONS[M.w];
    if (!W) return;
    if (M.rel > 0 || M.fcd > 0) return;
    if ((M.mag[M.w] == null ? W.mag : M.mag[M.w]) <= 0) { startReload(g); return; }
    M.mag[M.w] = (M.mag[M.w] == null ? W.mag : M.mag[M.w]) - 1;
    M.fcd = 1 / W.rate;
    M.fireT = 0.25;
    const cam = g.cam;
    if (!cam) return;
    const zs = [];
    for (const a of g.anim.values()) zs.push(a);
    const o = muzzleAt(myId);
    const hits = [];
    const sh = [];
    for (let p = 0; p < W.pel; p++) {
      const sp = W.spr * (M.mv ? 1.35 : 1) * (TOUCHY ? 0.9 : 1);
      let yaw = g.yaw + (Math.random() - 0.5) * 2 * sp, pit = g.pitch + (Math.random() - 0.5) * 2 * sp;
      if (TOUCHY && W.pel === 1 && p === 0) {
        let best = null, bd = 0.075;
        for (const z of zs) {
          const dx = z.x - cam.pos[0], dz = z.z - cam.pos[2], d = Math.hypot(dx, dz);
          if (d > W.rng + 4) continue;
          const ay = Math.atan2(dx, dz);
          let da = ay - g.yaw; while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2;
          const ah = Math.atan2(z.y + ZT[z.k].h * 0.6 - cam.pos[1], d) - g.pitch;
          const s = Math.hypot(da, ah * 0.7);
          if (s < bd) { bd = s; best = { z, ay, ap: Math.atan2(z.y + ZT[z.k].h * 0.62 - cam.pos[1], d) }; }
        }
        if (best) { yaw = lerp(yaw, best.ay, 0.7); pit = lerp(pit, best.ap, 0.7); }
      }
      const d = [Math.sin(yaw) * Math.cos(pit), Math.sin(pit), Math.cos(yaw) * Math.cos(pit)];
      const skip = Math.hypot(cam.pos[0] - M.x, cam.pos[2] - M.z) - 0.2;
      const hit = rayZombie(cam.pos[0], cam.pos[1], cam.pos[2], d[0], d[1], d[2], W.rng + skip, zs, skip);
      let end = W.rng + skip;
      if (hit && !rayBlocked(M.x, M.z, hit.z.x, hit.z.z)) {
        end = hit.t;
        hits.push([hit.z.id, hit.head ? 1 : 0]);
        const hx = cam.pos[0] + d[0] * hit.t, hy = cam.pos[1] + d[1] * hit.t, hz = cam.pos[2] + d[2] * hit.t;
        fxPush({ x: hx, y: hy, z: hz, size: 0.35, alpha: 0.9, type: 16, life: 0.05 });
        fxPush({ x: hx, y: hy, z: hz, size: 0.5, alpha: 0.55, type: 11, life: 0.35, vy: 0.4 });
        g.hm = hit.head ? 0.2 : 0.12; g.hmHead = hit.head;
        const a = g.anim.get(hit.z.id); if (a) a.flinch = 0.12;
      }
      const tgt = [cam.pos[0] + d[0] * end, cam.pos[1] + d[1] * end, cam.pos[2] + d[2] * end];
      if (o) { tracer(o, tgt); if (sh.length < 2) { const dd = [tgt[0] - o[0], tgt[1] - o[1], tgt[2] - o[2]]; const L = Math.hypot(dd[0], dd[1], dd[2]) || 1; sh.push([Math.round(o[0] * 10), Math.round(o[1] * 10), Math.round(o[2] * 10), Math.round(dd[0] / L * 100), Math.round(dd[1] / L * 100), Math.round(dd[2] / L * 100), Math.round(L * 10)]); } }
    }
    if (o) fxPush({ x: o[0], y: o[1], z: o[2], size: W.pel > 1 ? 0.9 : 0.6, alpha: 1, type: 16, life: 0.05 });
    gunSound(M.w, 0.9);
    g.kick = (g.kick || 0) + (M.w === 'sniper' ? 0.05 : M.w === 'shotgun' ? 0.04 : 0.012);
    if (g.sim) { if (hits.length) g.sim.shoot(myId, M.w, hits); }
    else { g.pend.push(...hits); g.pendSh.push(...sh); }
    if (M.mag[M.w] <= 0) startReload(g);
  };
  const startReload = (g) => {
    const M = g.me, W = WEAPONS[M.w];
    if (!W || M.rel > 0 || (M.mag[M.w] != null && M.mag[M.w] >= W.mag)) return;
    M.rel = W.rel; M.relMax = W.rel;
    Sfx.play('click', { vol: 0.5 });
  };
  const swing = (g) => {
    const M = g.me;
    if (M.fcd > 0) return;
    M.fcd = 1 / MELEE.bat.rate;
    M.swing = 0.32;
    gunSound('bat', 0.7);
    Sfx.play('swing', { vol: 0.6 });
    if (g.sim) g.sim.melee(myId, 'bat');
    else if (g.net) g.net.send({ t: 'ml', k: 'bat' });
  };
  const throwIt = (k) => {
    const g = G.current, M = g.me;
    if (!M || M.st !== 0 || !g.cam) return;
    if (k === 'grenade' ? M.nades <= 0 : M.molos <= 0) return;
    const d = [Math.sin(g.yaw), Math.cos(g.yaw)];
    const dist = clamp(14 + g.pitch * 30, 6, 22);
    const tx = M.x + d[0] * dist, tz = M.z + d[1] * dist;
    if (k === 'grenade') M.nades--; else M.molos--;
    kitTap('swing');
    if (g.sim) g.sim.throwAt(myId, k, tx, tz);
    else if (g.net) { g.net.send({ t: 'th', k, x: tx, z: tz }); g.fx.push({ nade: true, k, x0: M.x, z0: M.z, x1: tx, z1: tz, t: 0, life: k === 'grenade' ? THROW.grenade.fuse : 0.9 }); }
    syncHud(true);
  };
  const swap = () => { const g = G.current, M = g.me; if (!M) return; kitTap('click'); M.w = M.w === 'bat' ? M.gun : 'bat'; M.rel = 0; syncHud(true); };

  const hudAt = useRef(0);
  const syncHud = (force) => {
    const g = G.current, M = g.me;
    if (!M) return;
    const now = performance.now();
    if (!force && now - hudAt.current < 120) return;
    hudAt.current = now;
    const W = WEAPONS[M.w];
    let near = null;
    const S = g.snaps[g.snaps.length - 1];
    if (S && M.st === 0) for (const p of S.ps.values()) if (p.id !== myId && p.st === 1 && Math.hypot(p.x - M.x, p.z - M.z) < 2.2) { near = p.id; break; }
    let alive = 0, total = 0;
    if (S) for (const p of S.ps.values()) { total++; if (p.st === 0) alive++; }
    setHud({ w: M.w, gun: M.gun, mag: W ? (M.mag[M.w] == null ? W.mag : M.mag[M.w]) : 0, magMax: W ? W.mag : 0, rel: M.rel > 0 ? 1 - M.rel / (M.relMax || 1) : 0, hp: M.hp, st: M.st, rev: M.rev, wave: g.wave || 0, ph: g.ph, tl: g.tl, zl: g.zl, kills: M.kills, pts: M.pts, nades: M.nades, molos: M.molos, near, alive, total, rtt: g.rtt || 0, bleed: M.st === 1 ? Math.max(0, 30 - Math.round((g.downT || 0))) : 0 });
  };

  useEffect(() => {
    if (phase !== 'play' && phase !== 'menu') return undefined;
    let raf = 0, last = performance.now();
    const g = G.current;
    const frame = () => {
      raf = requestAnimationFrame(frame);
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const V = g.V, cv = cvRef.current;
      if (!V || !cv) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2) * V.tier.dpr;
      const W0 = Math.max(2, Math.round(GS.W * dpr)), H0 = Math.max(2, Math.round(GS.H * dpr));
      if (cv.width !== W0 || cv.height !== H0) { cv.width = W0; cv.height = H0; }
      if (phase === 'menu') { drawMenu(g, V, dt); return; }
      step(g, V, dt, now);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [phase, GS.W, GS.H, sv, col, gun]);

  const drawMenu = (g, V, dt) => {
    g.menuT += dt;
    const items = V.statics.slice();
    const M = V.surv(sv, gun, col, 'ready');
    personItems(items, M, 1.2, -25.5, 2.9 + Math.PI * 0.08, { walk: 0.04 });
    const zs = [['walker', -6, -6, 0.4], ['runner', 8, -3, -0.5], ['worker', 2, 2, 0.1], ['walker', -12, 1, 0.6]];
    zs.forEach(([k, x, z, yaw], i) => { const Z = V.zomb(k); const ph = g.menuT * 1.6 + i; personItems(items, Z, x + Math.sin(g.menuT * 0.2 + i) * 0.8, z + g.menuT * 0.25 % 4, yaw, { walk: Math.sin(ph) * 0.35, roll: Math.sin(ph * 0.5) * 0.06 }); });
    const a = 2.9 + Math.sin(g.menuT * 0.08) * 0.18;
    const cx = 1.2 + Math.sin(a) * 4.9, cz = -25.5 + Math.cos(a) * 4.9;
    const parts = [{ x: 1.2, y: floorH(1.2, -25.5) + 0.03, z: -25.5, size: 0.45, alpha: 0.45, type: 21, dw: -1 }];
    fireFx(parts, -14, floorH(-14, 1.2) + 0.4, 1.2, 0.8, g.menuT);
    const sx = Math.cos(a), sz = -Math.sin(a);
    const off = GS.land ? -1.25 : 0;
    V.R.render({ env: V.env, cam: { pos: [cx, 1.75, cz], at: [1.2 + sx * off, 1.3 + (GS.land ? 0 : -0.5), -25.5 + sz * off], fov: 0.72, shadowAt: [1.2, 0, -25.5], far: 420 }, items, parts });
  };
  const fireFx = (parts, x, y, z, k, t) => { for (let i = 0; i < 10; i++) { const s = (i * 0.37 + t * 1.4) % 1; parts.push({ x: x + Math.sin(i * 2.1 + t) * 0.5 * k, y: y + s * 2.4 * k, z: z + Math.cos(i * 1.7 + t) * 0.5 * k, size: (1.3 - s) * k, alpha: 0.85 * (1 - s), type: 12, seed: i / 10 }); } };

  const step = (g, V, dt, now) => {
    const M = g.me;
    if (!M) return;
    g.t += dt;
    const keys = g.keys;
    let mx = J.joy.current.x, my = J.joy.current.y;
    if (keys.has('KeyW') || keys.has('ArrowUp')) my -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) my += 1;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) mx -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) mx += 1;
    const ml = Math.hypot(mx, my);
    if (ml > 1) { mx /= ml; my /= ml; }
    M.mv = 0;
    if (M.st === 0) {
      const fx = Math.sin(g.yaw), fz = Math.cos(g.yaw), rx = -Math.cos(g.yaw), rz = Math.sin(g.yaw);
      const sp = 5.2 * (M.w === 'bat' ? 1.08 : M.w === 'sniper' ? 0.9 : 1);
      const vx = (fx * -my + rx * mx) * sp, vz = (fz * -my + rz * mx) * sp;
      if (Math.hypot(vx, vz) > 0.1) {
        const c = collide(M.x + vx * dt, M.z + vz * dt, 0.38);
        const moved = Math.hypot(c[0] - M.x, c[1] - M.z);
        M.ph += moved * 2.1; M.x = c[0]; M.z = c[1]; M.mv = 1;
      }
      M.fcd = Math.max(0, M.fcd - dt);
      M.fireT = Math.max(0, (M.fireT || 0) - dt);
      M.swing = Math.max(0, M.swing - dt);
      if (M.rel > 0) { M.rel -= dt; if (M.rel <= 0) { M.rel = 0; M.mag[M.w] = WEAPONS[M.w] ? WEAPONS[M.w].mag : 0; } }
      if (g.fire || keys.has('Space')) {
        if (M.w === 'bat') swing(g);
        else { const W = WEAPONS[M.w]; if (W && (W.auto || !g.fireLatch)) { fireGun(g, now); g.fireLatch = true; } }
      } else g.fireLatch = false;
    }
    g.downT = M.st === 1 ? (g.downT || 0) + dt : 0;
    const rv = g.revHold && hudRef.current && hudRef.current.near ? hudRef.current.near : null;
    if (g.sim) {
      g.sim.setPlayer(myId, { x: M.x, z: M.z, yaw: g.yaw, aim: g.pitch, w: M.w, fl: (M.mv ? 1 : 0) | (M.fireT > 0 ? 8 : 0), rv });
      g.simAcc += dt;
      let n = 0;
      while (g.simAcc >= 1 / 15 && n < 4) { g.sim.step(1 / 15); g.simAcc -= 1 / 15; n++; const s = g.sim.snap(); s.ev = g.sim.takeEvents(); applySnap(s, now); }
    } else if (g.net) {
      g.sendT -= dt;
      if (g.sendT <= 0) {
        g.sendT = 0.1;
        g.net.send({ t: 'p', x: Math.round(M.x * 100) / 100, z: Math.round(M.z * 100) / 100, yaw: Math.round(g.yaw * 100) / 100, aim: Math.round(g.pitch * 100) / 100, w: M.w, fl: (M.mv ? 1 : 0) | (M.fireT > 0 ? 8 : 0), rv, h: g.pend.length ? g.pend.splice(0, 24) : undefined, sh: g.pendSh.length ? g.pendSh.splice(0, 3) : undefined });
        g.pendSh.length = 0;
      }
    }
    render(g, V, dt, now);
    syncHud(false);
  };

  const render = (g, V, dt, now) => {
    const M = g.me;
    const S = g.snaps;
    const delay = g.sim ? 1 / 15 * 1000 : 115;
    const rt = now - delay;
    let a = S[0], b = S[S.length - 1];
    for (let i = 0; i < S.length - 1; i++) if (S[i].at <= rt && S[i + 1].at >= rt) { a = S[i]; b = S[i + 1]; break; }
    const span = Math.max(1, b.at - a.at);
    const f = a === b ? 1 : clamp((rt - a.at) / span, 0, 1);
    const items = [];
    const parts = [];
    const live = new Set();
    let drawnZ = 0;
    const zList = [];
    for (const z of b.zs.values()) zList.push(z);
    if (zList.length > V.tier.zmax) zList.sort((p, q) => Math.hypot(p.x - M.x, p.z - M.z) - Math.hypot(q.x - M.x, q.z - M.z));
    for (const z1 of zList) {
      const z0 = a.zs.get(z1.id) || z1;
      const x = lerp(z0.x, z1.x, f), z = lerp(z0.z, z1.z, f), yaw = angLerp(z0.yaw, z1.yaw, f);
      let A = g.anim.get(z1.id);
      if (!A) { A = { id: z1.id, k: z1.k, x, z, yaw, ph: Math.random() * 6, atk: 0, flinch: 0, y: floorH(x, z) }; g.anim.set(z1.id, A); }
      const mv = Math.hypot(x - A.x, z - A.z);
      A.ph += mv * (z1.k === 'runner' ? 2.2 : 1.7);
      A.x = x; A.z = z; A.yaw = yaw; A.k = z1.k; A.y = floorH(x, z); A.fl = z1.fl;
      A.atk = Math.max(0, A.atk - dt); A.flinch = Math.max(0, A.flinch - dt);
      live.add(z1.id);
      if (drawnZ >= V.tier.zmax) continue;
      drawnZ++;
      const Z = V.zomb(z1.k);
      const lunge = A.atk > 0 ? Math.sin((A.atk / 0.35) * Math.PI) * 0.35 : 0;
      personItems(items, Z, x, z, yaw, { walk: Math.sin(A.ph) * (z1.k === 'runner' ? 0.55 : 0.36), roll: Math.sin(A.ph * 0.5) * 0.07 + (A.flinch > 0 ? 0.08 : 0), pitch: lunge - (A.flinch > 0 ? 0.12 : 0), bob: Math.abs(Math.sin(A.ph)) * 0.04, cast: V.tier.shadow > 0 && Math.hypot(x - M.x, z - M.z) < 26 });
      parts.push({ x, y: A.y + 0.03, z, size: 0.5 * (Z.scale || 1), alpha: 0.42, type: 21, dw: -1 });
      if (z1.fl & 2) parts.push({ x, y: A.y + 0.8, z, size: 0.8, alpha: 0.5, type: 12, seed: Math.random() });
    }
    for (const id of g.anim.keys()) if (!live.has(id)) g.anim.delete(id);
    for (let i = g.dying.length - 1; i >= 0; i--) {
      const d = g.dying[i];
      d.t += dt;
      if (d.t > 2.6) { g.dying.splice(i, 1); continue; }
      const Z = V.zomb(d.k);
      const fall = clamp(d.t / 0.45, 0, 1);
      personItems(items, Z, d.x, d.z, d.yaw, { fall: fall * fall, sink: Math.max(0, d.t - 1.6) * 0.6, cast: false });
    }
    let pDrawn = 0;
    const shown = [];
    for (const p1 of b.ps.values()) {
      if (p1.id === myId) continue;
      const p0 = a.ps.get(p1.id) || p1;
      shown.push({ p0, p1, d: Math.hypot(p1.x - M.x, p1.z - M.z) });
    }
    shown.sort((p, q) => p.d - q.d);
    for (const { p0, p1 } of shown) {
      if (pDrawn >= V.tier.pmax) break;
      if (p1.st === 2) continue;
      pDrawn++;
      const x = lerp(p0.x, p1.x, f), z = lerp(p0.z, p1.z, f), yaw = angLerp(p0.yaw, p1.yaw, f);
      let A = g.panim.get(p1.id);
      if (!A) { A = { ph: 0, x, z }; g.panim.set(p1.id, A); }
      A.ph += Math.hypot(x - A.x, z - A.z) * 2.1; A.x = x; A.z = z;
      A.seen = g.t;
      const r = g.roster.get(p1.id) || { sv: 'jay', col: 0 };
      const wk = WEAPONS[p1.w] ? p1.w : 'bat';
      const P = V.surv(r.sv || 'jay', wk === 'bat' ? 'bat' : wk, r.col | 0, p1.fl & 8 ? 'aim' : 'ready');
      personItems(items, P, x, z, yaw, { walk: p1.fl & 1 ? Math.sin(A.ph) * 0.42 : 0, bob: p1.fl & 1 ? Math.abs(Math.sin(A.ph)) * 0.04 : 0, lie: p1.st === 1 });
      parts.push({ x, y: floorH(x, z) + 0.03, z, size: 0.45, alpha: 0.42, type: 21, dw: -1 });
    }
    for (const [k, A] of g.panim) if (g.t - (A.seen || 0) > 5) g.panim.delete(k);
    if (M.st !== 2) {
      const r = { sv, col };
      const wk = M.w;
      const P = V.surv(r.sv, wk, r.col, M.w === 'bat' ? 'ready' : 'aim');
      const lean = M.swing > 0 ? Math.sin((M.swing / 0.32) * Math.PI) * 0.5 : 0;
      personItems(items, P, M.x, M.z, g.yaw + lean, { walk: M.mv ? Math.sin(M.ph) * 0.45 : 0, bob: M.mv ? Math.abs(Math.sin(M.ph)) * 0.045 : 0, lie: M.st === 1, pitch: M.st === 0 ? -(g.kick || 0) * 0.5 : 0 });
      parts.push({ x: M.x, y: floorH(M.x, M.z) + 0.03, z: M.z, size: 0.45, alpha: 0.45, type: 21, dw: -1 });
    }
    g.kick = Math.max(0, (g.kick || 0) - dt * 0.3);
    for (let i = g.fires.length - 1; i >= 0; i--) {
      const F = g.fires[i];
      F.life -= dt;
      if (F.life <= 0) { g.fires.splice(i, 1); continue; }
      const y = floorH(F.x, F.z);
      const k = Math.min(1, F.life / 1.2);
      for (let j = 0; j < 14; j++) { const s = (j * 0.31 + g.t * 1.3) % 1; const an = j * 2.4 + g.t * 0.3, d = (j % 5) / 5 * F.r; parts.push({ x: F.x + Math.cos(an) * d, y: y + 0.2 + s * 1.6, z: F.z + Math.sin(an) * d, size: (1.2 - s * 0.7) * k, alpha: 0.85 * (1 - s) * k, type: 12, seed: j / 14 }); }
    }
    for (let i = g.fx.length - 1; i >= 0; i--) {
      const p = g.fx[i];
      if (p.nade) {
        p.t += dt;
        if (p.t > p.life) { g.fx.splice(i, 1); continue; }
        const u = clamp(p.t / 0.7, 0, 1);
        const x = lerp(p.x0, p.x1, u), z = lerp(p.z0, p.z1, u), y = lerp(floorH(p.x0, p.z0) + 1.5, floorH(p.x1, p.z1) + 0.15, u) + Math.sin(u * Math.PI) * 3;
        parts.push({ x, y, z, size: 0.22, alpha: 1, type: p.k === 'molotov' ? 12 : 4, seed: 0.5 });
        continue;
      }
      p.life -= dt;
      if (p.life <= 0) { g.fx.splice(i, 1); continue; }
      if (p.vy) p.y += p.vy * dt;
      parts.push({ x: p.x, y: p.y, z: p.z, size: p.size, alpha: p.alpha * clamp(p.life * 6, 0, 1), type: p.type, seed: p.seed || 0.5 });
    }
    for (let i = g.tr.length - 1; i >= 0; i--) {
      const t = g.tr[i];
      t.life -= dt;
      if (t.life <= 0) { g.tr.splice(i, 1); continue; }
      const dx = t.b[0] - t.a[0], dy = t.b[1] - t.a[1], dz = t.b[2] - t.a[2], L = Math.hypot(dx, dy, dz) || 1;
      parts.push({ x: (t.a[0] + t.b[0]) / 2, y: (t.a[1] + t.b[1]) / 2, z: (t.a[2] + t.b[2]) / 2, size: 0.035, alpha: clamp(t.life * 14, 0, 1) * 0.9, type: 4, dx: dx / L, dy: dy / L, dz: dz / L, dw: L / 2 });
    }
    fireFx(parts, -14, floorH(-14, 1.2) + 0.4, 1.2, 0.8, g.t);
    fireFx(parts, -13, floorH(-13, -26) + 1, -26, 0.3, g.t + 1);
    const fx = Math.sin(g.yaw), fz = Math.cos(g.yaw), rx = -Math.cos(g.yaw), rz = Math.sin(g.yaw);
    const down = M.st !== 0;
    const pv = [M.x, floorH(M.x, M.z) + (down ? 0.9 : 1.55), M.z];
    const back = down ? 4.6 : M.w === 'sniper' && g.fire ? 2.6 : 3.5, side = down ? 0 : 0.78;
    const cp = Math.cos(g.pitch), spit = Math.sin(g.pitch);
    let cx = pv[0] - fx * back * cp + rx * side, cz = pv[2] - fz * back * cp + rz * side, cy = pv[1] + 0.45 - spit * back * 0.9 + (down ? 2.2 : 0);
    const cc = collide(cx, cz, 0.3);
    cx = cc[0]; cz = cc[1];
    cy = Math.max(cy, floorH(cx, cz) + 0.5);
    g.shake = Math.max(0, g.shake - dt * 1.8);
    const sh = g.shake * 0.12;
    const pos = [cx + (Math.random() - 0.5) * sh, cy + (Math.random() - 0.5) * sh, cz + (Math.random() - 0.5) * sh];
    const at = [pos[0] + fx * cp * 20, pos[1] + (spit + (g.kick || 0)) * 20, pos[2] + fz * cp * 20];
    g.cam = { pos, at };
    V.R.render({ env: V.env, cam: { pos, at, fov: M.w === 'sniper' && g.fire ? 0.5 : 0.82, shadowAt: [M.x, 0, M.z], far: 420 }, items: V.statics.concat(items), parts });
    g.hm = Math.max(0, g.hm - dt);
    g.hurtT = Math.max(0, g.hurtT - dt);
    const el = hitRef.current;
    if (el) { el.style.opacity = g.hm > 0 ? '1' : '0'; el.style.borderColor = g.hmHead ? '#FF5A4A' : '#FFFFFF'; }
    const hv = hurtRef.current;
    if (hv) hv.style.opacity = String(clamp(g.hurtT * 1.6, 0, 0.85) + (M.hp < 35 && M.st === 0 ? 0.25 + Math.sin(g.t * 5) * 0.08 : 0));
  };
  const hitRef = useRef(null);
  const hurtRef = useRef(null);
  const hudRef = useRef(null);
  hudRef.current = hud;

  useEffect(() => {
    if (phase !== 'play') return undefined;
    const g = G.current;
    const kd = (e) => {
      if (sheet || (e.target && /INPUT|TEXTAREA/.test(e.target.tagName))) return;
      g.keys.add(e.code);
      if (e.code === 'KeyR') startReload(g);
      else if (e.code === 'KeyQ') swap();
      else if (e.code === 'KeyG') throwIt('grenade');
      else if (e.code === 'KeyF') throwIt('molotov');
      else if (e.code === 'KeyE') g.revHold = true;
      else if (e.code === 'Enter' && mode && !mode.solo) setSheet('chat');
    };
    const ku = (e) => { g.keys.delete(e.code); if (e.code === 'KeyE') g.revHold = false; };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); g.keys.clear(); };
  }, [phase, sheet, mode]);

  const lookDown = (e) => {
    if (phase !== 'play') return;
    const el = wrapRef.current;
    const r = el.getBoundingClientRect();
    const x = GS.side ? e.clientY - r.top : e.clientX - r.left;
    const y = GS.side ? r.right - e.clientX : e.clientY - r.top;
    const wid = GS.side ? r.height : r.width, hei = GS.side ? r.width : r.height;
    if (x < wid * 0.42 && y > hei * 0.32 && e.pointerType !== 'mouse') { J.handlers.onPointerDown(e); return; }
    G.current.lookP.set(e.pointerId, { x, y });
    if (e.pointerType === 'mouse') G.current.fire = e.button === 0;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
  };
  const lookMove = (e) => {
    J.handlers.onPointerMove(e);
    const g = G.current;
    const L = g.lookP.get(e.pointerId);
    if (!L) return;
    const el = wrapRef.current;
    const r = el.getBoundingClientRect();
    const x = GS.side ? e.clientY - r.top : e.clientX - r.left;
    const y = GS.side ? r.right - e.clientX : e.clientY - r.top;
    const sens = (e.pointerType === 'mouse' ? 0.0042 : 0.0062) * (g.me && g.me.w === 'sniper' && g.fire ? 0.55 : 1);
    g.yaw -= (x - L.x) * sens;
    g.pitch = clamp(g.pitch - (y - L.y) * sens * 0.8, -0.55, 0.42);
    L.x = x; L.y = y;
  };
  const lookUp = (e) => { J.handlers.onPointerUp(e); const g = G.current; if (g.lookP.delete(e.pointerId) && e.pointerType === 'mouse') g.fire = false; };
  const fireDown = (e) => {
    e.stopPropagation();
    const g = G.current;
    Sfx.init();
    g.fire = true;
    const el = wrapRef.current, r = el.getBoundingClientRect();
    g.lookP.set(e.pointerId, { x: GS.side ? e.clientY - r.top : e.clientX - r.left, y: GS.side ? r.right - e.clientX : e.clientY - r.top });
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
  };
  const fireUp = (e) => { e.stopPropagation(); const g = G.current; g.fire = false; g.lookP.delete(e.pointerId); };

  const sendChat = (t0) => {
    const t = String(t0 || '').replace(/\s+/g, ' ').trim().slice(0, 90);
    const g = G.current;
    if (!t || !g.net) return;
    g.net.send({ t: 'ct', x: t });
    pushChat('You', t);
    setChatLog((l) => [...l.slice(-30), { who: 'You', t }]);
    setChatText(''); setSheet(null);
  };
  const sendEmote = (e) => { const g = G.current; if (!g.net) return; g.net.send({ t: 'emo', e }); pushChat('You', e); setSheet(null); };

  const pingCol = (ms) => (ms == null || ms >= 9999 ? 'rgba(239,232,210,0.5)' : ms < 90 ? '#7BE05A' : ms < 180 ? '#F2C230' : '#FF7A5A');
  const best = useMemo(() => (pings ? bestRegion(pings) : null), [pings]);
  const ctrl = look.size;
  const see = 1 - look.see;
  const H = hud || {};

  const menu = phase === 'menu' && (
    <GLobby GS={GS} title="Dead Town" sub={cloudOn() ? 'Up to 50 survivors per server. Hold the town together.' : 'You and three bot friends against the waves'} onClose={onClose}
      tools={<GHudBtn icon="gear" label="Settings" size={42} onPress={() => setSheet('gfx')} />}
      side={(
        <GPanel style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}><span style={{ fontSize: 14, fontWeight: 900 }}>Your survivor</span><span style={{ fontSize: 12, fontWeight: 700, color: '#F2A23A' }}>{SV_TEXT[sv]}</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 6 }}>
            {SURV.map((k) => {
              const S0 = SURVIVORS.find((s) => s.key === k);
              const on = k === sv;
              const src = portrait(k, on ? col : 0, SURV_GUN[k]);
              return (
                <button key={k} type="button" className="zgk-btn" aria-pressed={on} aria-label={S0.name} {...pressProps(() => { kitTap(); setSv(k); setCol(0); setGun(SURV_GUN[k]); })}
                  style={{ border: 'none', padding: 0, background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, fontFamily: FONT }}>
                  <span style={{ width: '100%', aspectRatio: '1', maxWidth: 64, borderRadius: 4, overflow: 'hidden', background: on ? 'linear-gradient(180deg, #5A6440, #2E3322)' : 'rgba(239,232,210,0.08)', boxShadow: on ? 'inset 0 0 0 2px #F28C28' : 'inset 0 0 0 1px rgba(239,232,210,0.16)' }}>{src && <img src={src} alt="" draggable={false} style={{ width: '100%', height: '100%', display: 'block' }} />}</span>
                  <span style={{ fontSize: 11.5, fontWeight: 900, color: on ? '#F2A23A' : '#EFE8D2' }}>{S0.name}</span>
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12.5, fontWeight: 800, color: 'rgba(239,232,210,0.75)', width: 52 }}>Outfit</span>
            {[0, 1, 2, 3].map((i) => <button key={i} type="button" className="zgk-btn" aria-label={`Outfit ${i + 1}`} aria-pressed={col === i} {...pressProps(() => { kitTap(); setCol(i); })} style={{ width: 28, height: 28, borderRadius: 4, border: 'none', cursor: 'pointer', background: OUTFIT_SWATCH(sv, i), boxShadow: col === i ? '0 0 0 2px #1A1C12, 0 0 0 4px #F28C28' : 'inset 0 0 0 1px rgba(0,0,0,0.3)' }} />)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12.5, fontWeight: 800, color: 'rgba(239,232,210,0.75)', width: 52 }}>Gun</span>
            <div role="radiogroup" aria-label="Gun" style={{ flex: 1, minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 4 }}>
              {WKEYS.map((k) => <button key={k} type="button" role="radio" aria-checked={gun === k} className="zgk-btn" {...pressProps(() => { kitTap(); setGun(k); })} style={{ height: 30, border: 'none', borderRadius: 3, padding: 0, cursor: 'pointer', fontFamily: FONT, fontSize: 11.5, fontWeight: 900, color: gun === k ? '#1A1C12' : '#EFE8D2', background: gun === k ? '#F2A23A' : 'rgba(239,232,210,0.08)', boxShadow: gun === k ? 'none' : 'inset 0 0 0 1px rgba(239,232,210,0.14)' }}>{WEAPONS[k].n}</button>)}
            </div>
          </div>
        </GPanel>
      )}
      main={(
        <GPanel style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {cloudOn() ? (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}><span style={{ fontSize: 14, fontWeight: 900, flex: 1 }}>Servers</span><span style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(239,232,210,0.6)' }}>{pings ? 'Ping from your phone' : 'Checking ping'}</span></div>
              {REGION_KEYS.map((reg) => {
                const ms = pings ? pings[reg] : null;
                const n = roomCount(reg);
                return (
                  <button key={reg} type="button" className="zgk-btn" aria-label={`Join ${REGION_NAMES[reg]} server`} {...pressProps(() => start({ reg, r: pickRoom(reg) }))}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, height: 44, padding: '0 10px', border: 'none', borderRadius: 3, cursor: 'pointer', fontFamily: FONT, color: '#EFE8D2', background: reg === best ? 'rgba(242,140,40,0.16)' : 'rgba(239,232,210,0.06)', boxShadow: reg === best ? 'inset 3px 0 0 #F28C28' : 'none', textAlign: 'left' }}>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 14, fontWeight: 900 }}>{REGION_NAMES[reg]}{reg === best ? <span style={{ fontSize: 11, fontWeight: 800, color: '#F2A23A' }}>  Best for you</span> : null}</span>
                      <span style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'rgba(239,232,210,0.65)' }}>{n ? `${n} playing now` : 'Start a new game'}</span>
                    </span>
                    <span style={{ fontSize: 12.5, fontWeight: 900, color: pingCol(ms), fontVariantNumeric: 'tabular-nums' }}>{ms == null ? '' : ms >= 9999 ? 'No reply' : `${ms} ms`}</span>
                    <GIcon k="chevr" size={16} color="rgba(239,232,210,0.7)" line halo={false} stroke={2.4} />
                  </button>
                );
              })}
              <GPill text="Play with bots" color="white" small wide onPress={() => start({ solo: true })} />
            </>
          ) : (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.4, color: 'rgba(239,232,210,0.85)' }}>Hold the gas station with three bot friends. Waves get bigger, runners get faster and a brute shows up every fifth wave.</div>
              {G.current.best > 0 && <div style={{ fontSize: 12.5, fontWeight: 800, color: '#F2A23A' }}>Your best: wave {G.current.best}</div>}
              <GPill text="Play with bots" icon="play" color="gold" wide onPress={() => start({ solo: true })} />
            </>
          )}
        </GPanel>
      )}
    />
  );

  const btnS = Math.round(46 * ctrl), fireS = Math.round(80 * ctrl);
  const play = phase === 'play' && hud && (
    <div style={{ position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none' }}>
      <div ref={hurtRef} aria-hidden="true" style={{ position: 'absolute', inset: 0, opacity: 0, background: 'radial-gradient(ellipse at center, rgba(120,0,0,0) 45%, rgba(150,10,10,0.75) 100%)', transition: 'opacity 0.08s linear' }} />
      {H.st === 0 && H.w !== 'bat' && (
        <div aria-hidden="true" style={{ position: 'absolute', left: '50%', top: '50%', width: 0, height: 0 }}>
          {[[0, -1], [0, 1], [-1, 0], [1, 0]].map(([dx, dy], i) => <span key={i} style={{ position: 'absolute', left: dx * 9 - (dx ? 4 : 1), top: dy * 9 - (dy ? 4 : 1), width: dx ? 8 : 2, height: dy ? 8 : 2, background: 'rgba(255,255,255,0.92)', boxShadow: '0 0 2px rgba(0,0,0,0.8)' }} />)}
          <span ref={hitRef} style={{ position: 'absolute', left: -9, top: -9, width: 18, height: 18, border: '2px solid #FFFFFF', transform: 'rotate(45deg)', opacity: 0, boxSizing: 'border-box' }} />
        </div>
      )}
      <GHudPanel style={{ position: 'absolute', left: left(10), top: top(8), padding: '6px 12px 7px', minWidth: 132 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(239,232,210,0.75)' }}>Wave</span>
          <span style={{ fontSize: 26, fontWeight: 900, lineHeight: 1, color: '#F2A23A', fontVariantNumeric: 'tabular-nums' }}>{H.wave || 0}</span>
        </div>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#EFE8D2', marginTop: 2 }}>{H.ph === 0 ? `Next wave in ${H.tl || 0}` : H.ph === 2 ? 'Overrun' : `${H.zl || 0} zombies left`}</div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(239,232,210,0.7)', marginTop: 1, fontVariantNumeric: 'tabular-nums' }}>{fmt(H.pts || 0)} points, {H.kills || 0} kills</div>
      </GHudPanel>
      <div style={{ position: 'absolute', right: right(10), top: top(8), display: 'flex', gap: 6, pointerEvents: 'auto' }}>
        {mode && !mode.solo && <GHudBtn icon="chat" label="Chat" onPress={() => setSheet('chat')} />}
        <GHudBtn icon="people" label="Players" onPress={() => setSheet('players')} />
        <GHudBtn icon="pause" label="Menu" onPress={() => setSheet('pause')} />
      </div>
      {mode && !mode.solo && <div style={{ position: 'absolute', right: right(12), top: top(52), fontSize: 11, fontWeight: 800, color: pingCol(H.rtt), textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>{H.rtt ? `${H.rtt} ms` : ''}{netErr === 'lost' ? 'Reconnecting' : ''}</div>}
      <GFeed items={feedK} style={{ position: 'absolute', right: right(10), top: top(68), maxWidth: '40%' }} />
      <GChatFeed items={chatFeed} style={{ position: 'absolute', left: left(10), top: top(land ? 92 : 100), width: land ? 'min(32%, 280px)' : 'calc(100% - 24px)' }} />
      <GNotices items={notes} style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: top(land ? 54 : 110), width: 'min(52%, 420px)' }} />
      {banner && Date.now() - banner.at < 3200 && (
        <div key={banner.at} style={{ position: 'absolute', left: 0, right: 0, top: '22%', display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'zgk-rib 3.2s ease-out forwards' }}>
          <div style={{ padding: '6px 42px 7px', background: 'linear-gradient(90deg, rgba(20,22,14,0) 0%, rgba(20,22,14,0.82) 20%, rgba(20,22,14,0.82) 80%, rgba(20,22,14,0) 100%)', fontSize: 24, fontWeight: 900, color: '#F2A23A', textShadow: '0 2px 0 rgba(0,0,0,0.5)' }}>{banner.t}</div>
          <div style={{ marginTop: 3, fontSize: 13, fontWeight: 800, color: '#EFE8D2', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>{banner.s}</div>
        </div>
      )}
      <div style={{ position: 'absolute', left: '50%', bottom: bottom(14), transform: 'translateX(-50%)', width: land ? 'min(30%, 260px)' : '46%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        {H.st === 1 && <div style={{ fontSize: 13, fontWeight: 900, color: '#FF8A7A', textShadow: '0 1px 3px rgba(0,0,0,0.9)', textAlign: 'center' }}>{H.rev > 0 ? 'A friend is helping you up' : `You are down. Wait for a friend ${H.bleed}`}</div>}
        {H.st === 2 && <div style={{ fontSize: 13, fontWeight: 900, color: '#EFE8D2', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>You are back next wave</div>}
        <div style={{ width: '100%', height: 12, borderRadius: 2, background: 'rgba(20,22,14,0.75)', boxShadow: 'inset 0 0 0 1px rgba(239,232,210,0.2)', overflow: 'hidden' }}>
          <div style={{ width: `${clamp(H.st === 1 ? H.rev * 100 : H.hp, 0, 100)}%`, height: '100%', background: H.st === 1 ? '#7BE05A' : H.hp < 35 ? '#E5484D' : 'linear-gradient(180deg, #9CD86A, #5E9E3A)', transition: 'width 0.15s ease-out' }} />
        </div>
      </div>
      {H.st === 0 && (
        <div style={{ position: 'absolute', right: right(14), bottom: bottom(12), display: 'flex', alignItems: 'flex-end', gap: 10, pointerEvents: 'auto', opacity: see }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            {H.near && <div onPointerDownCapture={() => { G.current.revHold = true; }} onPointerUpCapture={() => { G.current.revHold = false; }} onPointerCancelCapture={() => { G.current.revHold = false; }} onPointerLeave={() => { G.current.revHold = false; }} style={{ touchAction: 'none' }}><GBtn icon="heart" color="green" size={btnS + 6} label="Hold to help up your friend" fast onPress={() => {}} /></div>}
            <GBtn icon="grenade" color="dark" size={btnS} label="Throw a grenade" badge={H.nades} disabled={!H.nades} onPress={() => throwIt('grenade')} />
            <GBtn icon="flame" color="dark" size={btnS} label="Throw a fire bottle" badge={H.molos} disabled={!H.molos} onPress={() => throwIt('molotov')} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            <GBtn icon="swap" color="dark" size={btnS} label={H.w === 'bat' ? 'Switch to gun' : 'Switch to bat'} onPress={swap} />
            {H.w !== 'bat' && <GBtn icon="replay" color="dark" size={btnS} label="Reload" cool={H.rel > 0 ? 1 - H.rel : 0} coolMax={1} onPress={() => startReload(G.current)} />}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: H.mag === 0 ? '#FF7A5A' : '#EFE8D2', textShadow: '0 1px 3px rgba(0,0,0,0.9)', fontVariantNumeric: 'tabular-nums' }}>{H.w === 'bat' ? 'Bat' : H.rel > 0 ? 'Reloading' : `${H.mag} / ${H.magMax}`}</div>
            <div role="button" aria-label={H.w === 'bat' ? 'Swing' : 'Shoot'} onPointerDown={fireDown} onPointerMove={lookMove} onPointerUp={fireUp} onPointerCancel={fireUp} onLostPointerCapture={fireUp} style={{ touchAction: 'none', cursor: 'pointer' }}>
              <div style={{ pointerEvents: 'none' }}><GBtn icon={H.w === 'bat' ? 'hammer' : 'target'} color="red" size={fireS} label={H.w === 'bat' ? 'Swing' : 'Shoot'} active={!!G.current.fire} onPress={() => {}} /></div>
            </div>
          </div>
        </div>
      )}
      {!TOUCHY && <div style={{ position: 'absolute', left: left(10), bottom: bottom(10), fontSize: 11.5, fontWeight: 700, color: 'rgba(239,232,210,0.7)', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>WASD move, drag to look, click to shoot, R reload, Q swap, G grenade, F fire bottle, E help up</div>}
      {TOUCHY && <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: see * 0.9 }}><GJoy flat view={J.view} knobRef={J.knob} idle={{ x: land ? 104 : 92, y: GS.H - (land ? 96 : 120) }} R={J.R} /></div>}
    </div>
  );

  const g0 = G.current;
  const players = sheet === 'players' && g0.snaps.length ? [...g0.snaps[g0.snaps.length - 1].ps.values()].sort((p, q) => q.pts - p.pts) : [];
  const sheets = (
    <>
      {sheet === 'gfx' && (
        <GLobbySheet GS={GS} title="Settings" onClose={() => setSheet(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 800 }}>Graphics</div>
            <GSeg value={tier} items={TIERS.map((t, i) => [i, t.name])} onPick={(i) => { setPref(PREF.gfx, i); setSheet(null); if (G.current.V) { G.current.V.dispose(); G.current.V = null; } setPhase('load'); setTier(i); }} label="Graphics" />
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(239,232,210,0.7)', lineHeight: 1.4 }}>Fast runs smooth on older phones. Best adds shadows, grass and glow.</div>
            <GControlsPanel onClose={() => setSheet(null)} sideways />
          </div>
        </GLobbySheet>
      )}
      {sheet === 'pause' && (
        <GLobbySheet GS={GS} title={mode && mode.solo ? 'Paused' : 'Menu'} onClose={() => setSheet(null)} width={380}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {mode && !mode.solo && <div style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(239,232,210,0.75)' }}>The town keeps going while this menu is open.</div>}
            <GPill text="Back to the fight" color="green" wide onPress={() => setSheet(null)} />
            <GPill text="Settings" color="white" wide small onPress={() => setSheet('gfx')} />
            <GPill text="Leave the town" color="red" wide small onPress={quit} />
          </div>
        </GLobbySheet>
      )}
      {sheet === 'players' && (
        <GLobbySheet GS={GS} title={`Survivors ${players.length}`} onClose={() => setSheet(null)} width={420}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {players.map((p, i) => {
              const r = g0.roster.get(p.id) || {};
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, height: 36, padding: '0 8px', borderRadius: 3, background: p.id === myId ? 'rgba(242,140,40,0.14)' : 'rgba(239,232,210,0.05)' }}>
                  <span style={{ width: 20, fontSize: 12, fontWeight: 900, color: 'rgba(239,232,210,0.6)', fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: OUTFIT_SWATCH(r.sv || 'jay', r.col | 0) }} />
                  <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.id === myId ? 'You' : r.n || 'Friend'}{r.bot ? <span style={{ fontSize: 11, color: 'rgba(239,232,210,0.55)' }}>  Bot</span> : null}</span>
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: p.st === 0 ? '#9CD86A' : p.st === 1 ? '#FF8A7A' : 'rgba(239,232,210,0.5)' }}>{p.st === 0 ? 'Fighting' : p.st === 1 ? 'Down' : 'Out'}</span>
                  <span style={{ width: 70, textAlign: 'right', fontSize: 12.5, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{fmt(p.pts)}</span>
                </div>
              );
            })}
          </div>
        </GLobbySheet>
      )}
      {sheet === 'chat' && (
        <Sheet title="Talk to the town" onClose={() => setSheet(null)}>
          {chatLog.length > 0 && <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '12px 0 4px', maxHeight: 140, overflowY: 'auto' }}>{chatLog.slice(-8).map((m, i) => <div key={i} style={{ fontSize: 13.5, lineHeight: 1.4 }}><span style={{ fontWeight: 800, color: m.who === 'You' ? '#F2A23A' : '#9CD4FF' }}>{m.who}</span> <span style={{ color: 'rgba(255,255,255,0.85)' }}>{m.t}</span></div>)}</div>}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>{CHAT_PHRASES.map((p) => <button key={p} type="button" className="zgk-btn" onClick={() => sendChat(p)} style={{ height: 38, padding: '0 14px', borderRadius: 19, border: 'none', background: 'rgba(255,255,255,0.1)', color: '#FFFFFF', fontSize: 13.5, fontWeight: 800, fontFamily: FONT, cursor: 'pointer' }}>{p}</button>)}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>{EMOTES.map((e) => <button key={e} type="button" className="zgk-btn" aria-label={`Send ${e}`} onClick={() => sendEmote(e)} style={{ flex: 1, height: 40, borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.08)', fontSize: 22, cursor: 'pointer' }}>{e}</button>)}</div>
          <form onSubmit={(e) => { e.preventDefault(); sendChat(chatText); }} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <input value={chatText} onChange={(e) => setChatText(e.target.value)} maxLength={90} placeholder="Write a message" aria-label="Message" style={{ flex: 1, minWidth: 0, height: 42, borderRadius: 21, border: 'none', padding: '0 16px', background: 'rgba(255,255,255,0.1)', color: '#FFFFFF', fontSize: 15, fontFamily: FONT, outline: 'none' }} />
            <GPill text="Send" color="green" small onPress={() => sendChat(chatText)} disabled={!chatText.trim()} />
          </form>
        </Sheet>
      )}
      {result && phase === 'play' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,8,6,0.55)', padding: 16 }}>
          <GPanel style={{ width: '100%', maxWidth: 380, padding: '16px 16px 14px', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'stretch', animation: 'zgk-pop 0.3s ease-out' }}>
            <GTitle text={`Overrun at wave ${result.wave}`} size={26} color="#F2A23A" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1, borderRadius: 3, overflow: 'hidden' }}>
              {[['Kills', result.kills], ['Points', fmt(result.pts)], ['Best wave', result.best]].map(([a, v]) => <div key={a} style={{ padding: '9px 4px 8px', background: 'rgba(239,232,210,0.07)', textAlign: 'center' }}><div style={{ fontSize: 19, fontWeight: 900, color: '#EFE8D2', fontVariantNumeric: 'tabular-nums' }}>{v}</div><div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(239,232,210,0.6)', marginTop: 2 }}>{a}</div></div>)}
            </div>
            {mode && !mode.solo ? <div style={{ fontSize: 12.5, fontWeight: 800, color: 'rgba(239,232,210,0.8)', textAlign: 'center' }}>A new game starts in a few seconds</div> : null}
            <div style={{ display: 'flex', gap: 8 }}>
              <GPill text="Leave" color="white" small wide style={{ flex: 1 }} onPress={quit} />
              {mode && mode.solo && <GPill text="Play again" color="gold" small wide style={{ flex: 1 }} onPress={() => start({ solo: true })} />}
            </div>
          </GPanel>
        </div>
      )}
    </>
  );

  return (
    <Portal><GSkin k="zombie">
      <div ref={GS.rootRef} style={{ position: 'fixed', left: 0, right: 0, top: 'var(--zvp-top, 0px)', height: 'calc(var(--zvp-h, 100%) + var(--zgx, 0px))', zIndex: 90, background: '#1A1C14', overflow: 'hidden', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', fontFamily: FONT, color: '#EFE8D2' }}>
        <div ref={wrapRef} style={GS.wrapStyle} onPointerDown={lookDown} onPointerMove={lookMove} onPointerUp={lookUp} onPointerCancel={lookUp} onLostPointerCapture={lookUp} onContextMenu={(e) => e.preventDefault()}>
          <canvas ref={cvRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
          {phase === 'load' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: '#1A1C14' }}>
              <GTitle text="Dead Town" size={40} color="#F2A23A" />
              <div style={{ width: 180, height: 6, borderRadius: 2, background: 'rgba(239,232,210,0.12)', overflow: 'hidden' }}><div style={{ width: `${Math.max(12, loadPct)}%`, height: '100%', background: '#F28C28', transition: 'width 0.4s ease-out' }} /></div>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: 'rgba(239,232,210,0.7)' }}>Building the town</div>
            </div>
          )}
          {netErr === 'gl' && phase === 'menu' && <div style={{ position: 'absolute', left: 0, right: 0, top: '40%', textAlign: 'center', fontSize: 14, fontWeight: 800 }}>This phone could not start 3D graphics.</div>}
          {menu}
          {play}
          {netErr === 'full' && phase === 'play' && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 31, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,8,6,0.6)' }}>
              <GPanel style={{ padding: 16, maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 15, fontWeight: 900 }}>This server is full</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(239,232,210,0.8)' }}>Pick another region or try again in a moment.</div>
                <GPill text="Back" color="white" small wide onPress={quit} />
              </GPanel>
            </div>
          )}
          {sheets}
        </div>
      </div>
    </GSkin></Portal>
  );
}
