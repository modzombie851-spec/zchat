import { backdropProps } from './tap.js';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, Portal, useBackClose, hapticTap, FONT, Spinner } from '../App.jsx';
import { useRoomLink } from './relay.jsx';
import { EMOTES, Sheet, injectCss, useGameChat, ChatSheet } from './livekit.jsx';
import { GBtn, GHold, GPill, GPanel, GChip, GTitle, GIcon, GHudBtn, GHudPanel, GHint, GStat, GNotices, useNotices, useWatchNotices, stagePoint, injectKitCss, kitTap, pressProps, maxDpr, newBudget, budgetTick, INK, useCtlLook, useGameStage, GControlsPanel, GVolBars, GLobby, GSlot, GLobbySheet, GTalkers, GWatchBar, GSkin, GChatFeed, useChatFeed, GJoinAsks } from './gamekit.jsx';
import { Sfx } from './sfx.js';
import { setWatchAllowed, useLiveBeacon, useGamePrivacy, useJoinAsks } from './live.js';
import { WORLDS, LEVEL_N, BALLS, R, levelOf, levelName, makeWorld, mkBall, stepBall, interact, applyEvent, pressedButtons, gatesToOpen, stepPlates, foePos, clamp, demoSetup, demoStep, demoStarts, clipStart, clipRun, DEMO_DT } from './rollengine.js';
import { render, drawBall, updateParts, burst, dust, popText, clearChunks, buildRollMini, drawRollMini } from './rolldraw.js';
import { useTalking } from './talk.js';
import { mkNet, netPush, netRead } from './netlerp.js';

const BEST_KEY = (uid) => `zchat-roll-best-${uid || 'me'}`;
const MINI_W = 168, MINI_H = 36;
function readBest(uid) { try { return JSON.parse(localStorage.getItem(BEST_KEY(uid)) || '{}') || {}; } catch { return {}; } }
function saveBest(uid, i, r) {
  try {
    const all = readBest(uid);
    const o = all[i] || {};
    all[i] = { stars: Math.max(o.stars || 0, r.stars), time: o.time ? Math.min(o.time, r.time) : r.time, coins: Math.max(o.coins || 0, r.coins) };
    localStorage.setItem(BEST_KEY(uid), JSON.stringify(all));
  } catch {}
}
const fmtT = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const WORLD_BTN = ['green', 'orange', 'teal', 'blue', 'purple', 'pink', 'red', 'teal', 'purple', 'blue', 'purple'];
const WORLD_TINT = ['#7BD25A', '#FF9E6B', '#BFE6FF', '#9AA3AD', '#8A7AD0', '#FF9FD0', '#FF8A3D', '#5FD0C9', '#C7B8FF', '#9FB4D8', '#B9A6F0'];
const DEMO_N = 3;
const clipCache = new Map();
const rbud = newBudget();
function planClips(li, ms) {
  let c = clipCache.get(li);
  if (!c) { c = { lens: [], si: 0, P: null, total: 0, done: false }; clipCache.set(li, c); }
  for (const [k, v] of clipCache) if (k !== li && v.P) v.P = null;
  const t0 = performance.now();
  while (!c.done && performance.now() - t0 < ms) {
    if (!c.P) { c.P = clipStart(li, c.si, DEMO_N, 16); if (!c.total) c.total = demoStarts(c.P.S.W.L).length; }
    const len = clipRun(c.P, 30);
    if (len != null) { c.lens[c.si] = len; c.P = null; c.si += 1; if (c.si >= c.total) c.done = true; }
  }
  return c;
}
function nextClip(li, cur) {
  const c = clipCache.get(li);
  if (!c) return [0, null];
  const good = c.lens.map((l, i) => [i, l]).filter(([, l]) => l >= 5);
  if (good.length) return good.find(([i]) => i > cur) || good[0];
  if (!c.done) return [0, c.lens[0] != null ? Math.max(3, c.lens[0]) : null];
  const best = c.lens.map((l, i) => [i, l]).sort((a, b) => b[1] - a[1])[0];
  return best ? [best[0], Math.max(4, best[1])] : [0, 6];
}
const firstOpen = (best) => { for (let i = 0; i < LEVEL_N; i++) if (!best[i] || !best[i].stars) return i; return LEVEL_N - 1; };

function BallBadge({ ci, size = 44, happy }) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const d = Math.min(2, window.devicePixelRatio || 1);
    cv.width = size * d; cv.height = size * d;
    const c = cv.getContext('2d');
    c.setTransform(d, 0, 0, d, 0, 0);
    c.clearRect(0, 0, size, size);
    drawBall(c, size / 2, size / 2, size / (R * 2 + 0.25), { a: 0.4, vy: happy ? -4 : 0, look: 1, blink: 1, sq: 0 }, ci, 0, { happy });
  }, [ci, size, happy]);
  return <canvas ref={ref} aria-hidden="true" style={{ width: size, height: size, display: 'block', flexShrink: 0 }} />;
}

export function RollGamePage({ solo = false, room, me, myId, onClose, onInvite, watch = false }) {
  injectCss(); injectKitCss();
  const uid = solo ? 'me' : myId;
  const isHost = solo || (room && room.host === myId);
  const myFirst = String((me && me.name) || 'You').split(' ')[0];
  const meta = { n: myFirst, a: me && me.avatar, w: watch ? 1 : 0 };
  const relay = useRoomLink({ id: solo || !room ? null : `roll-${room.rm}`, myId, enabled: !solo && !!room, meta, fast: ['pl'], audio: !watch });
  const [phase, setPhase] = useState('menu');
  const [roster, setRoster] = useState(solo ? ['me'] : [room && room.host].filter(Boolean));
  const [names, setNames] = useState({});
  const [watchers, setWatchers] = useState([]);
  const [hud, setHud] = useState({ coins: 0, stars: 0, time: 0, deaths: 0, home: [], dead: [] });
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState(null);
  const [paused, setPaused] = useState(false);
  const [leaveAsk, setLeaveAsk] = useState(false);
  const [quick, setQuick] = useState(false);
  const [people, setPeople] = useState(false);
  const [notes, pushNote] = useNotices();
  const [best, setBest] = useState(() => readBest(uid));
  const [lvl, setLvl] = useState(0);
  const [sel, setSel] = useState(() => firstOpen(readBest(uid)));
  const [lvSheet, setLvSheet] = useState(false);
  const [sheetW, setSheetW] = useState(0);
  const [follow, setFollow] = useState(null);
  const [camK, setCamK] = useState(null);
  const camKRef = useRef(null);
  const gamePriv = useGamePrivacy();
  const allowWatch = gamePriv.show && gamePriv.watch;
  const setAllowWatch = () => {};
  const look = useCtlLook('roll');
  const GS = useGameStage(look);
  const side = GS.side, land = GS.land;
  const padRef = useRef(null);
  const touch = useRef({ mv: null, cx: 0, jp: new Set() });
  const [padDir, setPadDir] = useState(0);
  const [jumpOn, setJumpOn] = useState(false);
  const padCenter = () => {
    const el = padRef.current, wrap = wrapRef.current;
    if (!el || !wrap) return 90;
    const r = el.getBoundingClientRect();
    return stagePoint(wrap, { clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 }, side).x;
  };
  const setDir = (d) => { hold.current.l = d < 0; hold.current.r = d > 0; setPadDir((v) => (v === d ? v : d)); };
  useEffect(() => { if (!paused && phase === 'play') return; touch.current = { mv: null, cx: 0, jp: new Set() }; hold.current = { l: false, r: false, j: false }; setPadDir(0); setJumpOn(false); }, [paused, phase]);
  const zoneDown = (e) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (e.cancelable) e.preventDefault();
    const p = stagePoint(wrap, e, side);
    const T = touch.current;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    if (p.x < GS.W * 0.5) {
      T.mv = e.pointerId; T.cx = padCenter();
      setDir(p.x < T.cx - 3 ? -1 : 1);
    } else {
      T.jp.add(e.pointerId);
      hold.current.j = true; setJumpOn(true);
    }
  };
  const zoneMove = (e) => {
    const T = touch.current;
    if (e.pointerId !== T.mv || !wrapRef.current) return;
    const x = stagePoint(wrapRef.current, e, side).x;
    if (x < T.cx - 6) setDir(-1); else if (x > T.cx + 6) setDir(1);
  };
  const zoneUp = (e) => {
    const T = touch.current;
    if (e.pointerId === T.mv) { T.mv = null; setDir(0); }
    if (T.jp.delete(e.pointerId) && !T.jp.size) { hold.current.j = false; setJumpOn(false); }
  };
  useEffect(() => {
    const clear = () => { const T = touch.current; T.mv = null; T.jp = new Set(); hold.current.l = false; hold.current.r = false; hold.current.j = false; setPadDir(0); setJumpOn(false); };
    const ends = (e) => { if (e.touches && e.touches.length === 0) clear(); };
    const vis = () => { if (document.visibilityState === 'hidden') clear(); };
    window.addEventListener('touchend', ends, true);
    window.addEventListener('touchcancel', ends, true);
    window.addEventListener('blur', clear);
    document.addEventListener('visibilitychange', vis);
    return () => { window.removeEventListener('touchend', ends, true); window.removeEventListener('touchcancel', ends, true); window.removeEventListener('blur', clear); document.removeEventListener('visibilitychange', vis); };
  }, []);
  const miniRef = useRef(null);
  const miniBase = useRef({ L: null, cv: null });
  const hudRefs = useRef({});
  const hudRef = (k) => (el) => { hudRefs.current[k] = el; };
  const [ctl, setCtl] = useState(false);
  useLiveBeacon({ game: 'roll', room: room ? room.rm : null, info: { h: room && room.host, n: Math.max(1, roster.length) }, active: !solo && !watch && !!room, allow: allowWatch });
  const cvRef = useRef(null);
  const wrapRef = useRef(null);
  const WR = useRef(null);
  const balls = useRef({});
  const partsRef = useRef([]);
  const cam = useRef({ x: 5, y: 10, init: false });
  const hold = useRef({ l: false, r: false, j: false });
  const keys = useRef(new Set());
  const phaseRef = useRef(phase); phaseRef.current = phase;
  const selRef = useRef(sel); selRef.current = sel;
  const demoRef = useRef(null);
  const pausedRef = useRef(paused); pausedRef.current = paused;
  const rosterRef = useRef(roster); rosterRef.current = roster;
  const followRef = useRef(follow); followRef.current = follow;
  const namesRef = useRef(names); namesRef.current = names;
  const feedRef = useRef(null);
  const hudKey = useRef('');
  const sendT = useRef(0);
  const doneRef = useRef(false);
  const toastTimer = useRef(0);
  const bubblesRef = useRef({});
  const flagBy = useRef({});
  const metaRef = useRef({});
  const joinOrder = useRef([]);
  const watchRef = useRef(watch);
  const rosterSeen = useRef({ list: null, at: Date.now(), bye: new Set() });
  if (typeof window !== 'undefined' && window.__zfake) window.__zroll = { world: () => WR.current, balls: () => balls.current, roster: () => rosterRef.current, start: (i) => startLevelRef.current && startLevelRef.current(i) };

  const say = (text, sec) => { setToast({ text, at: Date.now(), life: sec || 2.4 }); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(null), (sec || 2.4) * 1000); };
  const kindOf = () => (solo ? 'me' : myId);
  const playing = () => !watchRef.current && rosterRef.current.includes(kindOf());

  const freshRoster = () => {
    if (solo) return ['me'];
    const present = relay.peers.filter((p) => !(metaRef.current[p] && metaRef.current[p].w));
    const order = joinOrder.current.filter((p) => present.includes(p));
    present.forEach((p) => { if (!order.includes(p)) order.push(p); });
    return [myId, ...order.filter((p) => p !== myId)].slice(0, 4);
  };
  const startLevelRef = useRef(null);
  const startLevel = (i, ids, quiet) => {
    const list = ids || (isHost && !solo ? freshRoster() : rosterRef.current);
    if (!solo) { setRoster(list); rosterRef.current = list; }
    const W = makeWorld(i, list.length);
    WR.current = W;
    balls.current = {};
    list.forEach((k, n) => { const b = mkBall(k, W.L.start.x + n * 0.95, W.L.start.y); balls.current[k] = b; });
    partsRef.current = [];
    flagBy.current = {};
    cam.current.init = false;
    doneRef.current = false;
    hold.current = { l: false, r: false, j: false };
    touch.current = { mv: null, cx: 0, jp: new Set() };
    setPadDir(0); setJumpOn(false);
    clearChunks();
    setLvl(i); setResult(null); setPaused(false); setQuick(false);
    setPhase('play');
    Sfx.init();
    Sfx.music('roll', true);
    if (!solo && isHost && !quiet) relay.send('lv', { i, ids: list });
    const { w } = levelOf(i);
    say(`${WORLDS[w].name}, level ${levelName(i)}`, 2.2);
  };
  startLevelRef.current = startLevel;
  const emit = (e) => {
    const W = WR.current;
    if (!W) return;
    if (applyEvent(W, e) && !solo) relay.send('ev', { e, i: W.L.index });
    if (e.k === 'home' && balls.current[e.who]) balls.current[e.who].home = true;
  };

  useEffect(() => {
    if (solo || !room) return undefined;
    const offs = [
      relay.on('*', (m) => { if (m.m) { metaRef.current[m.from] = m.m; setNames((prev) => (prev[m.from] === m.m.n ? prev : { ...prev, [m.from]: m.m.n })); } if (!joinOrder.current.includes(m.from)) joinOrder.current.push(m.from); }),
      relay.on('roster', (m) => { if (isHost) return; if (Array.isArray(m.ids)) { setRoster(m.ids.slice(0, 4)); if (m.nm) setNames((prev) => ({ ...prev, ...m.nm })); if (m.cur != null && !WR.current) startLevel(m.cur, m.ids.slice(0, 4), true); } if (typeof m.sl === 'number' && m.sl >= 0 && m.sl < LEVEL_N) setSel(m.sl); if (m.nw && watchRef.current) { say('The players turned off watching.', 3); setTimeout(() => onClose(), 1500); } }),
      relay.on('lv', (m) => { if (isHost) return; if (Array.isArray(m.ids)) setRoster(m.ids); startLevel(m.i, m.ids, true); }),
      relay.on('menu', () => { if (!isHost) { setPhase('menu'); Sfx.music('lobbyRoll', true); } }),
      relay.on('sel', (m) => { if (isHost) return; const i = Number(m.i); if (i >= 0 && i < LEVEL_N) setSel(i); }),
      relay.on('pl', (m) => {
        const W = WR.current;
        if (!W || m.i !== W.L.index) return;
        let b = balls.current[m.from];
        if (!b) { if (!rosterRef.current.includes(m.from)) return; b = mkBall(m.from, m.x, m.y); balls.current[m.from] = b; }
        if (typeof m.at === 'number') { if (m.at < (b.netAt || 0)) return; b.netAt = m.at; }
        if (m.d && !(b.dead > 0)) { burst(partsRef.current, b.x, b.y, BALLS[rosterRef.current.indexOf(m.from) % 4].body, 16, 6, 'shard'); }
        b.dead = m.d ? 1 : 0; b.home = !!m.h; b.look = m.lk || 1;
        const nx = Number(m.x), ny = Number(m.y);
        if (Number.isFinite(nx) && Number.isFinite(ny)) netPush(b.nb || (b.nb = mkNet()), m.at, [nx, ny, Number(m.vx) || 0, Number(m.vy) || 0]);
        if (m.ht != null && !isHost && m.from === room.host) { const target = m.ht - W.t; if (Math.abs(target - W.clk) > 0.5) W.clk = target; else W.clk += (target - W.clk) * 0.2; }
      }),
      relay.on('ev', (m) => { const W = WR.current; if (!W || m.i !== W.L.index || !m.e) return; applyEvent(W, m.e); if (m.e.k === 'home' && balls.current[m.e.who]) balls.current[m.e.who].home = true; }),
      relay.on('emo', (m) => { const e = String(m.e || ''); if (!EMOTES.includes(e)) return; bubblesRef.current[m.from] = { text: e, t: 0, life: 1.8 }; if (feedRef.current) feedRef.current(namesRef.current[m.from] || 'Friend', e, BALLS[Math.max(0, rosterRef.current.indexOf(m.from)) % 4].body); Sfx.play('pop', { vol: 0.5 }); }),
      relay.on('bye', (m) => { const n = namesRef.current[m.from] || 'A friend'; if (rosterRef.current.includes(m.from) && !rosterSeen.current.bye.has(m.from)) { rosterSeen.current.bye.add(m.from); pushNote(`${n} left the game`, 'leave'); } }),
    ];
    return () => offs.forEach((f) => f && f());
  }, [relay.on]);

  useEffect(() => {
    if (solo || !room || !isHost) return undefined;
    const tick = () => {
      const present = relay.peers.filter((p) => !(metaRef.current[p] && metaRef.current[p].w));
      const cur = rosterRef.current;
      const inGame = phaseRef.current === 'play' || phaseRef.current === 'done';
      const next = inGame ? cur.filter((p) => p === myId || present.includes(p)) : freshRoster();
      const w = relay.peers.filter((p) => metaRef.current[p] && metaRef.current[p].w);
      setWatchers((prev) => (prev.join('|') === w.join('|') ? prev : w));
      if (next.join('|') !== cur.join('|')) setRoster(next);
      const nm = {}; next.concat(w).forEach((p) => { nm[p] = p === myId ? myFirst : (metaRef.current[p] && metaRef.current[p].n) || 'Friend'; });
      relay.send('roster', { ids: next, nm, nw: !allowWatch && w.length ? 1 : 0, cur: phaseRef.current === 'play' && WR.current ? WR.current.L.index : null, sl: selRef.current });
    };
    tick();
    const iv = setInterval(tick, 1500);
    return () => clearInterval(iv);
  }, [relay.peers, allowWatch]);

  useEffect(() => {
    if (solo || !room || isHost) return undefined;
    const w = relay.peers.filter((p) => metaRef.current[p] && metaRef.current[p].w);
    setWatchers((prev) => (prev.join('|') === w.join('|') ? prev : w));
    return undefined;
  }, [relay.peers]);

  useEffect(() => {
    if (solo) return;
    const R0 = rosterSeen.current;
    const prev = R0.list;
    R0.list = roster;
    if (!prev || Date.now() - R0.at < 2500) return;
    const me0 = kindOf();
    for (const k of roster) if (!prev.includes(k) && k !== me0) { R0.bye.delete(k); pushNote(`${namesRef.current[k] || 'A friend'} joined`, 'join'); }
    for (const k of prev) if (!roster.includes(k) && k !== me0 && !R0.bye.has(k)) { R0.bye.add(k); pushNote(`${namesRef.current[k] || 'A friend'} left the game`, 'leave'); }
  }, [roster]);
  const watchList = useMemo(() => watchers.map((id) => ({ id, n: names[id] || 'Friend' })), [watchers, names]);
  useWatchNotices(watchList, pushNote, !solo && !watch);

  const leave = () => { if (phase === 'play' && !solo && !watch) { setLeaveAsk(true); return; } finish(); };
  const finish = () => { Sfx.stopAll(); onClose(); };
  useBackClose(true, () => { if (chatOpen) setChatOpen(false); else if (lvSheet) setLvSheet(false); else if (ctl) setCtl(false); else if (people) setPeople(false); else if (quick) setQuick(false); else if (leaveAsk) setLeaveAsk(false); else if (paused) setPaused(false); else if (phase === 'play' && solo) setPaused(true); else if (phase !== 'menu') { if (solo || isHost) toMenu(); else leave(); } else leave(); });
  const toMenu = () => { setPhase('menu'); Sfx.music('lobbyRoll', true); WR.current = null; if (!solo && isHost) relay.send('menu', {}); };

  useEffect(() => {
    const kd = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      const k = e.key.toLowerCase();
      if (['arrowleft', 'arrowright', 'arrowup', 'a', 'd', 'w', ' '].includes(k)) { keys.current.add(k); e.preventDefault(); }
    };
    const ku = (e) => keys.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, []);

  const drawDemo = (cv, raw) => {
    const li = selRef.current;
    let D = demoRef.current;
    const fresh = (si, len) => { D.si = si; D.len = len; D.S = demoSetup(li, si, DEMO_N); D.parts = []; D.cam = { x: 0, y: 0, init: false }; D.acc = 0; };
    if (!D || D.li !== li) { D = { li, fade: 1, fin: false }; demoRef.current = D; planClips(li, 6); const [si, len] = nextClip(li, -1); fresh(si, len); }
    planClips(li, 2.5);
    const S = D.S, W = S.W, P = D.parts;
    D.acc += Math.min(0.1, raw);
    let n = 0;
    while (D.acc >= DEMO_DT && n < 5) {
      D.acc -= DEMO_DT; n += 1;
      demoStep(S);
      W.killT = W.killT || {};
      for (const id of W.kills) W.killT[id] = (W.killT[id] || 0) + DEMO_DT;
      for (const k of Object.keys(W.springT)) { W.springT[k] -= DEMO_DT; if (W.springT[k] <= 0) delete W.springT[k]; }
      while (W.fx.length) {
        const f = W.fx.shift();
        const ci = Math.max(0, S.balls.findIndex((b) => b.kind === f.who));
        if (f.k === 'coin') { const cn = W.L.coins[f.id]; if (cn) { burst(P, cn.x, cn.y, '#FFD23F', 6, 3, 'spark'); popText(P, cn.x, cn.y - 0.3, '+1', '#FFE15A'); } }
        else if (f.k === 'star') { const st = W.L.stars[f.id]; if (st) burst(P, st.x, st.y, '#FFE15A', 20, 6, 'spark'); }
        else if (f.k === 'stomp') { const fo = W.L.foes.find((q) => q.id === f.id); if (fo) { const p = foePos(W, fo); burst(P, p.x, p.y, '#FFFFFF', 10, 4, 'spark'); popText(P, p.x, p.y - 0.6, 'Bop', '#FFFFFF'); } }
        else if (f.k === 'jump2') { dust(P, f.x, f.y, 7); burst(P, f.x, f.y, '#FFFFFF', 6, 3, 'dot'); }
        else if (f.k === 'land') dust(P, f.x, f.y, 5);
        else if (f.k === 'die') { burst(P, f.x, f.y, BALLS[ci % 4].body, 18, 6.5, 'shard'); burst(P, f.x, f.y, '#FFFFFF', 8, 4); }
        else if (f.k === 'home') burst(P, W.L.goal.x, W.L.goal.y - 0.5, BALLS[ci % 4].light, 22, 5, 'spark');
      }
      updateParts(P, DEMO_DT);
    }
    if (n >= 5) D.acc = 0;
    const end = D.len != null ? S.t >= D.len : (S.dead > 2 || S.t - S.leadAt > 1.1 || S.home || S.t > 16);
    if (end) D.fin = true;
    D.fade = clamp(D.fade + (D.fin ? raw / 0.35 : -raw / 0.5), 0, 1);
    if (D.fin && D.fade >= 1) { const [si, len] = nextClip(li, D.si); fresh(si, len); D.fin = false; }
    const wrap = wrapRef.current;
    const cw = wrap ? wrap.clientWidth : window.innerWidth, ch = wrap ? wrap.clientHeight : window.innerHeight;
    const dpr = budgetTick(rbud, raw);
    if (cv.width !== Math.round(cw * dpr) || cv.height !== Math.round(ch * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); clearChunks(); }
    const s = Math.round(clamp((cw > ch ? ch / 10 : cw / 10.5), 30, 58));
    const live = D.S.balls.filter((b) => !(b.dead > 0) && !b.home);
    const fb = live.length ? live.reduce((a, b) => (b.x > a.x ? b : a)) : D.S.balls[0];
    const C = D.cam;
    const tx = fb.x + clamp(fb.vx * 0.32, -2.2, 2.2) - (cw > ch ? 1.2 : 0), ty = fb.y - 1.2;
    if (!C.init) { C.x = tx; C.y = ty; C.init = true; }
    const k1 = 1 - Math.exp(-raw * 4), k2 = 1 - Math.exp(-raw * 3);
    C.x += (tx - C.x) * k1; C.y += (ty - C.y) * k2;
    const W2 = D.S.W;
    const halfW = cw / s / 2, halfH = ch / s / 2;
    const cx = clamp(C.x, halfW, Math.max(halfW, W2.L.MW - halfW));
    let cy = Math.min(C.y, W2.L.MH - halfH + 2.5);
    cy = Math.max(cy, Math.min(W2.L.MH - halfH + 2.5, halfH - 6));
    const ox = Math.round(cw / 2 - cx * s), oy = Math.round(ch * (cw > ch ? 0.47 : 0.36) - cy * s);
    const list = D.S.balls.map((b, i) => ({ k: b.kind, b, ci: i }));
    const ctx = cv.getContext('2d');
    render(ctx, W2, { cw, ch, dpr, s, ox, oy, camX: cx, camY: cy, balls: list, me: null, names: {}, bubbles: {}, parts: D.parts, pressed: new Set(), flagBy: {} });
    if (D.fade > 0.001) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(14,20,40,${D.fade.toFixed(3)})`; ctx.fillRect(0, 0, cv.width, cv.height); }
  };

  useEffect(() => {
    let raf = 0, last = performance.now(), acc = 0;
    const loop = (ts) => {
      raf = requestAnimationFrame(loop);
      const raw = (ts - last) / 1000;
      last = ts;
      acc += raw;
      if (acc < 0.0105) return;
      const dt = Math.min(0.04, acc);
      acc = 0;
      const W = WR.current, cv = cvRef.current;
      if (cv && phaseRef.current === 'menu') { drawDemo(cv, dt); return; }
      if (!W || !cv || (phaseRef.current !== 'play' && phaseRef.current !== 'done')) return;
      const wrap = wrapRef.current;
      const cw = wrap ? wrap.clientWidth : window.innerWidth, ch = wrap ? wrap.clientHeight : window.innerHeight;
      const dpr = budgetTick(rbud, dt);
      if (cv.width !== Math.round(cw * dpr) || cv.height !== Math.round(ch * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); clearChunks(); }
      const step = pausedRef.current ? 0 : dt;
      const myK = kindOf();
      const mine = balls.current[myK];
      const K = keys.current, Hd = hold.current;
      const ix = ((K.has('arrowright') || K.has('d') || Hd.r) ? 1 : 0) - ((K.has('arrowleft') || K.has('a') || Hd.l) ? 1 : 0);
      const jump = K.has('arrowup') || K.has('w') || K.has(' ') || Hd.j;
      if (step > 0) {
        W.t += step;
        if (!doneRef.current) W.time += step;
        const all = Object.keys(balls.current).map((k) => balls.current[k]);
        if (mine && playing()) {
          const others = all.filter((b) => b !== mine);
          stepBall(W, mine, { x: ix, jump }, step, others);
          interact(W, mine, emit);
        }
        for (const b of all) {
          if (b === mine || !b.nb) continue;
          const v = netRead(b.nb, b.nv || (b.nv = [0, 0, 0, 0]), { vel: [[0, 2], [1, 3]], snap: 3, ext: 140, base: 70 });
          if (v) { b.x = v[0]; b.y = v[1]; b.vx = v[2]; b.vy = v[3]; }
          b.a += b.vx * step / R;
          b.blink -= step; if (b.blink < -0.12) b.blink = 2 + Math.random() * 3;
        }
        stepPlates(W, all, step);
        const pressed = pressedButtons(W, all);
        W.pressed = pressed;
        for (const g of gatesToOpen(W, pressed)) emit({ k: 'door', g });
        W.doorAmt = W.doorAmt || {};
        for (const d of W.L.doors) W.doorAmt[d.g] = clamp((W.doorAmt[d.g] || 0) + (W.opened.has(d.g) || (d.hold && W.live && W.live.has(d.g)) ? step * (d.hold ? 4 : 1.8) : -step * (d.hold ? 4 : 2)), 0, 1);
        W.bridgeAmt = W.bridgeAmt || {};
        for (const g of W.L.plateGroups || []) W.bridgeAmt[g] = clamp((W.bridgeAmt[g] || 0) + (W.live && W.live.has(g) ? step * 6 : -step * 5), 0, 1);
        if (mine && !mine.dead && !W.tipped) {
          const near = (list) => list.some((q) => Math.abs(mine.x - (q.x + 0.5)) < 4 && Math.abs(mine.y - q.y) < 4);
          if ((W.L.plates || []).length && near(W.L.plates)) { W.tipped = 1; say(W.active > 1 ? 'Stand on the blue plate to hold it for your friends' : 'Step on the blue plate, then hurry across', 3.2); }
          else if (Object.keys(W.L.needOf || {}).length && near(W.L.buttons.filter((q) => W.L.needOf[q.g]))) { W.tipped = 1; say(W.active > 1 ? 'Team gate: press the buttons together' : 'Press a button to open the gate', 3.2); }
        }
        W.killT = W.killT || {};
        for (const id of W.kills) W.killT[id] = (W.killT[id] || 0) + step;
        for (const k of Object.keys(W.springT)) { W.springT[k] -= step; if (W.springT[k] <= 0) delete W.springT[k]; }
        for (const k of Object.keys(bubblesRef.current)) { const bb = bubblesRef.current[k]; if (bb) { bb.t += step; if (bb.t > bb.life) bubblesRef.current[k] = null; } }
      }
      const P = partsRef.current;
      while (W.fx.length) {
        const f = W.fx.shift();
        const local = f.who === myK;
        const ci = Math.max(0, rosterRef.current.indexOf(f.who));
        switch (f.k) {
          case 'jump': if (local) Sfx.play('jump', { vol: 0.5, rate: 0.95 + Math.random() * 0.1 }); break;
          case 'jump2': { if (local) Sfx.play('jump', { vol: 0.55, rate: 1.25 + Math.random() * 0.08 }); dust(P, f.x, f.y, 7); burst(P, f.x, f.y, '#FFFFFF', 6, 3, 'dot'); break; }
          case 'land': if (local) { Sfx.play('land', { vol: Math.min(0.8, f.v / 22) }); dust(P, f.x, f.y, 5); } break;
          case 'bonk': if (local) Sfx.play('bump', { vol: 0.5 }); break;
          case 'spring': Sfx.play('spring', { vol: local ? 0.8 : 0.4 }); break;
          case 'coin': { const cn = W.L.coins[f.id]; if (cn) { burst(P, cn.x, cn.y, '#FFD23F', 6, 3, 'spark'); popText(P, cn.x, cn.y - 0.3, '+1', '#FFE15A'); } Sfx.play('coin', { vol: local ? 0.6 : 0.35, rate: 1 + (W.coins.size % 5) * 0.04 }); break; }
          case 'star': { const st = W.L.stars[f.id]; if (st) { burst(P, st.x, st.y, '#FFE15A', 20, 6, 'spark'); } Sfx.play('star', { vol: 0.9 }); say(local ? 'You found a star!' : `${namesRef.current[f.who] || 'A friend'} found a star!`, 2); break; }
          case 'stomp': { const fo = W.L.foes.find((q) => q.id === f.id); if (fo) { const p = foePos(W, fo); burst(P, p.x, p.y, '#FFFFFF', 10, 4, 'spark'); popText(P, p.x, p.y - 0.6, 'Bop', '#FFFFFF'); } Sfx.play('stomp', { vol: 0.8 }); W.shake = 0.15; break; }
          case 'die': { if (local) W.deaths += 1; burst(P, f.x, f.y, BALLS[ci % 4].body, 18, 6.5, 'shard'); burst(P, f.x, f.y, '#FFFFFF', 8, 4); Sfx.play('ballpop', { vol: local ? 0.9 : 0.5 }); if (local) { W.shake = 0.35; try { hapticTap(); } catch {} } break; }
          case 'spawn': if (local) Sfx.play('pop', { vol: 0.5 }); break;
          case 'cp': { flagBy.current[f.id] = ci; const fl = W.L.flags[f.id]; if (fl) burst(P, fl.x, fl.y - 1.5, BALLS[ci % 4].light, 12, 4, 'spark'); if (local) { Sfx.play('cp', { vol: 0.8 }); say('Checkpoint', 1.4); } break; }
          case 'door': Sfx.play('door', { vol: 0.8 }); say('The gate opens', 1.8); W.shake = 0.2; break;
          case 'home': { burst(P, W.L.goal.x, W.L.goal.y - 0.5, BALLS[ci % 4].light, 22, 5, 'spark'); Sfx.play('key', { vol: 0.8 }); if (!local) say(`${namesRef.current[f.who] || 'A friend'} made it to the portal`, 2); break; }
          default: break;
        }
      }
      updateParts(P, step);
      if (!doneRef.current) {
        const need = rosterRef.current.filter((k) => balls.current[k]);
        if (need.length && need.every((k) => W.home.has(k))) {
          doneRef.current = true;
          W.won = true;
          setTimeout(() => {
            if (WR.current !== W) return;
            const r = { i: W.L.index, time: W.time, coins: W.coins.size, coinsAll: W.L.coins.length, stars: W.stars.size, deaths: W.deaths };
            saveBest(uid, W.L.index, r); setBest(readBest(uid)); setResult(r); setPhase('done');
            Sfx.music(null, false); Sfx.play('win', { vol: 0.8 });
            try { window.dispatchEvent(new CustomEvent('zchat-screen-fx', { detail: 'confetti' })); } catch {}
          }, 900);
        }
      }
      if (!solo && mine && playing()) {
        const now = performance.now();
        if (now - sendT.current > 80) { sendT.current = now; relay.send('pl', { i: W.L.index, x: +mine.x.toFixed(2), y: +mine.y.toFixed(2), vx: +mine.vx.toFixed(2), vy: +mine.vy.toFixed(2), d: mine.dead > 0 ? 1 : 0, h: mine.home ? 1 : 0, lk: mine.look, ht: isHost ? +W.t.toFixed(2) : undefined }); }
      }
      const s = Math.round(clamp((cw > ch ? ch / 10 : cw / 10.5), 30, 58));
      let fb = mine && playing() && !mine.home ? mine : null;
      if (!fb) {
        const fk = followRef.current && balls.current[followRef.current] && !balls.current[followRef.current].home ? followRef.current : rosterRef.current.find((k) => balls.current[k] && !balls.current[k].home && !(balls.current[k].dead > 0));
        fb = fk ? balls.current[fk] : mine;
        if (fk && fk !== camKRef.current) { camKRef.current = fk; setCamK(fk); }
      }
      const C = cam.current;
      if (fb) {
        const lead = clamp(fb.vx * 0.32, -2.2, 2.2);
        const tx = fb.x + lead, ty = fb.y - 1.2;
        if (!C.init) { C.x = tx; C.y = ty; C.init = true; }
        const k1 = 1 - Math.exp(-dt * 5), k2 = 1 - Math.exp(-dt * 3.5);
        C.x += (tx - C.x) * k1; C.y += (ty - C.y) * k2;
      }
      const halfW = cw / s / 2, halfH = ch / s / 2;
      let cx = clamp(C.x, halfW, Math.max(halfW, W.L.MW - halfW));
      let cy = Math.min(C.y, W.L.MH - halfH + 2.5);
      cy = Math.max(cy, Math.min(W.L.MH - halfH + 2.5, halfH - 6));
      if (W.shake > 0) { W.shake = Math.max(0, W.shake - dt); cx += (Math.random() - 0.5) * W.shake * 0.5; cy += (Math.random() - 0.5) * W.shake * 0.5; }
      const ox = Math.round(cw / 2 - cx * s), oy = Math.round(ch * 0.5 - cy * s);
      const list = rosterRef.current.map((k, i) => ({ k, b: balls.current[k], ci: i }));
      const nm = {};
      if (!solo) rosterRef.current.forEach((k) => { nm[k] = k === myK ? '' : namesRef.current[k] || 'Friend'; });
      render(cv.getContext('2d'), W, { cw, ch, dpr, s, ox, oy, camX: cx, camY: cy, balls: list, me: mine, names: nm, bubbles: bubblesRef.current, parts: P, pressed: W.pressed, flagBy: flagBy.current });
      const mc = miniRef.current;
      if (mc && mc.isConnected) {
        const MB = miniBase.current;
        if (MB.L !== W.L) { MB.L = W.L; MB.cv = buildRollMini(W.L); }
        const md = Math.min(2, window.devicePixelRatio || 1);
        if (mc.width !== MINI_W * md) { mc.width = MINI_W * md; mc.height = MINI_H * md; }
        const x2 = mc.getContext('2d'); x2.setTransform(md, 0, 0, md, 0, 0);
        drawRollMini(x2, W, MB.cv, MINI_W, MINI_H, list, fb, { x: cx, hw: halfW }, myK);
      }
      const hk = `${W.coins.size}|${W.stars.size}|${Math.floor(W.time)}|${W.deaths}|${[...W.home].join(',')}|${rosterRef.current.map((k) => (balls.current[k] && balls.current[k].dead > 0 ? 1 : 0)).join('')}`;
      if (hk !== hudKey.current) { hudKey.current = hk; setHud({ coins: W.coins.size, stars: W.stars.size, time: W.time, deaths: W.deaths, home: [...W.home], dead: rosterRef.current.filter((k) => balls.current[k] && balls.current[k].dead > 0) }); }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const sendEmote = (e) => { bubblesRef.current[kindOf()] = { text: e, t: 0, life: 1.8 }; if (!solo) relay.send('emo', { e }); setQuick(false); Sfx.play('pop', { vol: 0.5 }); };
  const pick = (i) => { if (!isHost) return; Sfx.init(); startLevel(i); };
  const myIdx = roster.indexOf(kindOf());
  const totalStars = Object.values(best).reduce((a, b) => a + (b.stars || 0), 0);
  const nameOf = (k) => (k === kindOf() ? 'You' : names[k] || 'Friend');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatNew, setChatNew] = useState(0);
  const [feed, pushFeed] = useChatFeed();
  const jask = useJoinAsks({ myId, on: !solo && !!room && isHost && !watch, game: 'roll' });
  feedRef.current = pushFeed;
  const chat = useGameChat(solo || watch ? null : relay, nameOf, (s, who, t, from) => { pushFeed(who, t, BALLS[Math.max(0, roster.indexOf(from)) % 4].body); setChatNew((n) => n + 1); }, (t) => pushFeed('You', t));
  const { top, right, bottom, left } = GS.at;
  const hb = land ? 38 : 40;
  const talkOn = !solo && playing();
  const talking = useTalking(!solo, relay.muted);
  const rowBtns = [
    talkOn && <GHudBtn key="mic" icon={relay.mic.on ? 'mic' : 'micoff'} on={relay.mic.on} size={hb} label={relay.mic.on ? 'Turn your mic off' : 'Turn your mic on'} onPress={relay.toggleMic} />,
    talkOn && <GHudBtn key="ppl" icon="people" on={people} size={hb} label="Players and voice" badge={roster.length > 1 ? roster.length : null} onPress={() => { setQuick(false); setPeople(true); }} />,
    talkOn && <GHudBtn key="chat" icon="chat" size={hb} label="Chat" badge={chatNew || null} onPress={() => { setQuick(false); setChatNew(0); setChatOpen(true); }} />,
    talkOn && <GHudBtn key="emo" icon="smile" on={quick} tone="#F5AE1E" size={hb} label="Emojis" onPress={() => setQuick((v) => !v)} />,
    playing() && <GHudBtn key="gear" icon="gear" size={hb} label="Settings" onPress={() => { setQuick(false); if (solo) setPaused(true); setCtl(true); }} />,
    <GHudBtn key="x" icon={solo ? 'pause' : 'close'} size={hb} label={solo ? 'Pause' : 'Leave the game'} onPress={() => (solo ? setPaused(true) : leave())} />,
  ].filter(Boolean);
  const capW = 150;
  const lEnd = 10 + MINI_W + 8;
  const rStart = GS.W - 10 - (rowBtns.length * hb + (rowBtns.length - 1) * 6) - 8;
  const capX = clamp(GS.W / 2 - capW / 2, lEnd, Math.max(lEnd, rStart - capW));
  const tlEl = hudRefs.current.tl;
  const tlBottom = tlEl && tlEl.offsetHeight ? tlEl.offsetTop + tlEl.offsetHeight : 0;
  const capsule = (
    <GHudPanel style={{ height: 30, padding: '0 11px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 900, whiteSpace: 'nowrap' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 13, height: 13, borderRadius: 7, background: '#FFD23F', boxShadow: `0 0 0 1.5px ${INK}` }} /><span style={{ fontVariantNumeric: 'tabular-nums' }}>{hud.coins}</span></span>
      <span style={{ display: 'flex', gap: 2 }}>{[0, 1, 2].map((q) => <GIcon key={q} k="star" size={15} color={hud.stars > q ? '#FFD23F' : 'rgba(255,255,255,0.28)'} ink="rgba(0,0,0,0.35)" />)}</span>
    </GHudPanel>
  );

  useEffect(() => { if (phase === 'menu') { Sfx.init(); Sfx.music('lobbyRoll', true); } }, [phase]);
  const pickSel = (i) => { if (!isHost || watch) return; const v = clamp(i, 0, LEVEL_N - 1); setSel(v); if (!solo) relay.send('sel', { i: v }); };
  const openLevels = () => { setSheetW(levelOf(sel).w); setLvSheet(true); };
  const toggleWatch = () => { setWatchAllowed(!allowWatch); kitTap(); };
  const hostName = names[room && room.host] || 'The host';
  const selW = levelOf(sel).w;
  const selBest = best[sel];
  const canPick = isHost && !watch;
  const lobby = phase !== 'menu' ? null : (
    <GLobby GS={GS} title="Roll Squad" onClose={finish} closeLabel={solo ? 'Leave' : 'Back to chat'}
      sub={solo ? 'Roll, jump and bop your way to the portal' : watch ? `Watching ${hostName} and friends` : 'Up to four friends roll together'}
      badge={<GChip style={{ gap: 5, height: 34 }}><GIcon k="star" size={15} color="#FFD23F" />{`${totalStars}/${LEVEL_N * 3}`}</GChip>}
      tools={(
        <>
          {!solo && !watch && <GBtn icon="chat" color="dark" size={42} fast={false} label="Chat" badge={chatNew || null} onPress={() => { setChatNew(0); setChatOpen(true); }} />}
          {!solo && isHost && !watch && <GBtn icon={allowWatch ? 'eye' : 'eyeoff'} color={allowWatch ? 'blue' : 'dark'} size={42} fast={false} label={allowWatch ? 'Friends can watch. Tap to stop' : 'Let friends watch'} badge={watchers.length || null} onPress={toggleWatch} />}
          <GBtn icon="gear" color="dark" size={42} fast={false} label="Settings" onPress={() => setCtl(true)} />
        </>
      )}
      side={solo ? (
        <GPanel style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', flexShrink: 0 }}>{BALLS.map((b, i) => <div key={b.id} style={{ marginLeft: i ? -12 : 0 }}><BallBadge ci={i} size={32} /></div>)}</div>
          <div style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 800, lineHeight: 1.4, color: 'rgba(255,255,255,0.86)' }}>Hold the arrows to roll. Tap jump, hold it to jump higher. Land on enemies to bop them.</div>
        </GPanel>
      ) : (
        <GPanel style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14.5, fontWeight: 900, flex: 1 }}>{watch ? 'The squad' : `Squad ${roster.length} of 4`}</span>
            {watchers.length > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 800, color: '#CFE6FF' }}><GIcon k="eye" size={14} color="#CFE6FF" />{`${watchers.length} watching`}</span>}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
            {[0, 1, 2, 3].map((i) => {
              const k = roster[i];
              if (!k) return <GSlot key={`e${i}`} empty name={isHost && onInvite && !watch ? 'Invite' : 'Open'} label="Invite a friend" onPress={isHost && onInvite && !watch ? onInvite : null} />;
              const isMe = k === kindOf();
              return <GSlot key={k} art={<BallBadge ci={i} size={42} />} name={isMe ? 'You' : nameOf(k)} ring={BALLS[i % 4].body} talk={isMe ? relay.mic.on : !!relay.mics[k]} muted={!!relay.muted[k]} label={isMe ? 'You' : `${nameOf(k)}, voice and volume`} onPress={!isMe && !watch ? () => setPeople(true) : null} />;
            })}
          </div>
          {!watch && (
            <div style={{ display: 'flex', gap: 8 }}>
              <GPill text={relay.mic.on ? 'Mic off' : 'Talk with mic'} icon={relay.mic.on ? 'micoff' : 'mic'} color={relay.mic.on ? 'white' : 'blue'} small onPress={relay.toggleMic} style={{ flex: 1 }} wide />
              <GPill text="Voice" icon="people" color="white" small onPress={() => setPeople(true)} />
            </div>
          )}
          {!watch && relay.mic.err && <div style={{ fontSize: 12, fontWeight: 800, color: '#FF9C9C' }}>{relay.mic.err}</div>}
        </GPanel>
      )}
      main={(
        <GPanel style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {canPick && <GBtn icon="chevl" color="dark" size={38} fast={false} label="Previous level" disabled={sel <= 0} onPress={() => pickSel(sel - 1)} />}
            <button type="button" className="zgk-btn" aria-label={canPick ? `Level ${levelName(sel)}, ${WORLDS[selW].name}. See all levels` : `Level ${levelName(sel)}, ${WORLDS[selW].name}`} {...pressProps(() => { if (canPick) { kitTap(); openLevels(); } })}
              style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', padding: 0, color: '#FFFFFF', fontFamily: FONT, cursor: canPick ? 'pointer' : 'default', textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: WORLD_TINT[selW], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{WORLDS[selW].name}</div>
              <div style={{ fontSize: 23, fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.01em' }}>{`Level ${levelName(sel)}`}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, marginTop: 2 }}>
                {[0, 1, 2].map((q) => <GIcon key={q} k="star" size={14} color={selBest && selBest.stars > q ? '#FFD23F' : 'rgba(255,255,255,0.22)'} />)}
                {selBest && selBest.time ? <span style={{ fontSize: 11.5, fontWeight: 800, color: 'rgba(255,255,255,0.7)', marginLeft: 6, fontVariantNumeric: 'tabular-nums' }}>{`Best ${fmtT(selBest.time)}`}</span> : null}
              </div>
            </button>
            {canPick && <GBtn icon="chevr" color="dark" size={38} fast={false} label="Next level" disabled={sel >= LEVEL_N - 1} onPress={() => pickSel(sel + 1)} />}
          </div>
          {canPick ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <GPill text="Levels" icon="map" color="white" onPress={openLevels} />
              <GPill text={solo ? 'Play' : roster.length > 1 ? `Play with ${roster.length}` : 'Play'} icon="play" color="gold" onPress={() => pick(sel)} style={{ flex: 1 }} wide />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44, fontSize: 13.5, fontWeight: 800, color: 'rgba(255,255,255,0.85)' }}><Spinner size={16} color="#FFFFFF" />{watch ? `${hostName} starts the level soon` : `${hostName} picks the level`}</div>
          )}
        </GPanel>
      )}>
      {lvSheet && (() => {
        const first = WORLDS.slice(0, sheetW).reduce((a, x) => a + x.n, 0);
        const ids = Array.from({ length: WORLDS[sheetW].n }, (_, k) => first + k);
        const got = ids.reduce((a, i) => a + ((best[i] && best[i].stars) || 0), 0);
        return (
          <GLobbySheet GS={GS} title="Levels" width={640} onClose={() => setLvSheet(false)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <GBtn icon="chevl" color="dark" size={36} fast={false} label="Previous world" disabled={sheetW <= 0} onPress={() => setSheetW((w) => Math.max(0, w - 1))} />
              <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
                <div style={{ fontSize: 17, fontWeight: 900, color: WORLD_TINT[sheetW] }}>{WORLDS[sheetW].name}</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>{`World ${sheetW + 1} of ${WORLDS.length}, ${got} of ${ids.length * 3} stars`}</div>
              </div>
              <GBtn icon="chevr" color="dark" size={36} fast={false} label="Next world" disabled={sheetW >= WORLDS.length - 1} onPress={() => setSheetW((w) => Math.min(WORLDS.length - 1, w + 1))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${land ? ids.length : 3}, minmax(0, 1fr))`, gap: 8, marginTop: 14 }}>
              {ids.map((i) => {
                const b = best[i];
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <GBtn color={WORLD_BTN[sheetW]} size={54} fast={false} active={i === sel} label={`Level ${levelName(i)}`} onPress={() => { pickSel(i); setLvSheet(false); }}>
                      <span style={{ fontSize: 18, fontWeight: 900, color: '#FFFFFF', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>{levelName(i)}</span>
                    </GBtn>
                    <span style={{ display: 'flex', gap: 1 }}>{[0, 1, 2].map((q) => <GIcon key={q} k="star" size={12} color={b && b.stars > q ? '#FFD23F' : 'rgba(255,255,255,0.2)'} />)}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 14 }}>
              {WORLDS.map((wd, wi) => <button key={wd.id} type="button" className="zgk-btn" aria-label={wd.name} aria-pressed={wi === sheetW} {...pressProps(() => setSheetW(wi))} style={{ width: wi === sheetW ? 22 : 10, height: 10, borderRadius: 5, border: 'none', padding: 0, cursor: 'pointer', background: wi === sheetW ? WORLD_TINT[wi] : 'rgba(255,255,255,0.25)', transition: 'width .15s ease' }} />)}
            </div>
          </GLobbySheet>
        );
      })()}
    </GLobby>
  );

  return (
    <Portal><GSkin k="roll">
      <div ref={GS.rootRef} style={{ position: 'fixed', left: 0, right: 0, top: 'var(--zvp-top, 0px)', height: 'calc(var(--zvp-h, 100%) + var(--zgx, 0px))', zIndex: 90, background: '#6EC6FF', overflow: 'hidden', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', fontFamily: FONT, color: '#FFFFFF' }}>
      <div ref={wrapRef} data-side={side ? '1' : '0'} style={GS.wrapStyle}>
        <canvas ref={cvRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />

        {phase === 'play' && (
          <>
            <div ref={hudRef('tl')} style={{ position: 'absolute', left: left(10), top: top(8), display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start', zIndex: 3, pointerEvents: 'none' }}>
              <GHudPanel style={{ height: 28, padding: '0 10px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 900, whiteSpace: 'nowrap' }}>
                <span style={{ color: '#FFD23F' }}>{levelName(lvl)}</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtT(hud.time)}</span>
              </GHudPanel>
              <canvas ref={miniRef} aria-hidden="true" style={{ width: MINI_W, height: MINI_H, display: 'block', borderRadius: 7, boxShadow: '0 2px 10px rgba(0,0,0,0.25)' }} />
              {!solo && roster.map((k, i) => (
                <GHudPanel key={k} style={{ height: 24, padding: '0 9px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 800, whiteSpace: 'nowrap', opacity: hud.dead.includes(k) ? 0.6 : 1 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 5, background: BALLS[i % 4].body, boxShadow: `0 0 0 1.5px ${INK}` }} />
                  <span>{nameOf(k)}</span>
                  {(k === kindOf() ? relay.mic.on : !!relay.mics[k]) && <GIcon k={relay.muted[k] ? 'mute' : 'mic'} size={12} color={relay.muted[k] ? '#FF8C8C' : '#7BE05A'} ink="rgba(0,0,0,0.3)" />}
                  {hud.home.includes(k) && <GIcon k="check" size={12} color="#5BE37D" ink="rgba(0,0,0,0.3)" />}
                </GHudPanel>
              ))}
              {!solo && watchers.length > 0 && <GHudPanel style={{ height: 24, padding: '0 9px', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 800, whiteSpace: 'nowrap' }}><GIcon k="eye" size={13} color="#CFE6FF" ink="rgba(0,0,0,0.3)" />{`${watchers.length} watching`}</GHudPanel>}
            </div>
            <div ref={hudRef('tr')} style={{ position: 'absolute', right: right(10), top: top(8), display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, zIndex: 3, pointerEvents: 'none' }}>
              <div style={{ display: 'flex', gap: 6, pointerEvents: 'auto' }}>{rowBtns}</div>
              {!land && capsule}
            </div>
            {land && <div style={{ position: 'absolute', left: capX, top: top(8), width: capW, display: 'flex', justifyContent: 'center', zIndex: 2, pointerEvents: 'none' }}>{capsule}</div>}
            {toast && (
              <div key={toast.at} style={{ position: 'absolute', left: '50%', ...(land ? { bottom: bottom(18) } : { top: tlBottom ? tlBottom + 10 : top(150) }), transform: 'translateX(-50%)', width: land ? 'min(44%, 360px)' : '80%', display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 4 }}>
                <GHint text={toast.text} life={toast.life || 2.4} />
              </div>
            )}
            {relay.mic.err && <div style={{ position: 'absolute', left: '50%', top: '24%', transform: 'translateX(-50%)', pointerEvents: 'none', zIndex: 5 }}><GChip style={{ background: 'rgba(217,75,75,0.95)' }}>{relay.mic.err}</GChip></div>}
            {playing() && (
              <>
                <div role="group" aria-label="Touch the left side to roll and the right side to jump" onPointerDown={zoneDown} onPointerMove={zoneMove} onPointerUp={zoneUp} onPointerCancel={zoneUp} onLostPointerCapture={zoneUp} onContextMenu={(e) => e.preventDefault()}
                  style={{ position: 'absolute', inset: 0, zIndex: 1, touchAction: 'none' }} />
                <div ref={padRef} aria-hidden="true" style={{ position: 'absolute', left: left(16), bottom: bottom(16), width: 156, height: 70, transform: `scale(${look.size})`, transformOrigin: '0 100%', opacity: 1 - look.see, zIndex: 2, pointerEvents: 'none', borderRadius: 35, background: 'rgba(0,0,0,0.26)', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.6)', display: 'flex', overflow: 'hidden' }}>
                  {[-1, 1].map((d) => (
                    <div key={d} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: padDir === d ? 'rgba(255,255,255,0.26)' : 'transparent', transition: 'background 0.06s' }}>
                      <GIcon k={d < 0 ? 'left' : 'right'} size={28} color="#FFFFFF" line stroke={2.2} />
                    </div>
                  ))}
                  <div style={{ position: 'absolute', left: '50%', top: 14, bottom: 14, width: 1.5, marginLeft: -0.75, background: 'rgba(255,255,255,0.4)' }} />
                </div>
                <div aria-hidden="true" style={{ position: 'absolute', right: right(16), bottom: bottom(14), width: 80, height: 80, transform: `scale(${look.size}) ${jumpOn ? 'scale(0.93)' : ''}`, transformOrigin: '100% 100%', opacity: 1 - look.see, zIndex: 2, pointerEvents: 'none', borderRadius: '50%', background: jumpOn ? 'rgba(255,255,255,0.24)' : 'rgba(0,0,0,0.3)', boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.05s' }}>
                  <GIcon k="up" size={34} color="#FFFFFF" line stroke={2.3} />
                </div>
              </>
            )}
            {!playing() && (
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: bottom(16), display: 'flex', justifyContent: 'center', padding: '0 14px', zIndex: 3 }}>
                <GWatchBar ids={roster.filter((k) => !hud.home.includes(k)).length ? roster.filter((k) => !hud.home.includes(k)) : roster} cur={camK} nameOf={nameOf} colorOf={(k) => BALLS[Math.max(0, roster.indexOf(k)) % 4].body} onPick={(k) => { setFollow(k); camKRef.current = k; setCamK(k); }} />
              </div>
            )}
            {quick && (
              <div onPointerDown={(e) => e.stopPropagation()} style={{ position: 'absolute', right: right(10), top: top(8 + hb + 8), width: 'min(260px, calc(100% - 28px))', animation: 'zgk-pop 0.2s ease-out', zIndex: 6 }}>
                <GPanel style={{ padding: 10, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 6 }}>
                  {EMOTES.map((e) => <button key={e} type="button" className="zgk-btn" aria-label={`Send ${e}`} {...pressProps(() => sendEmote(e))} style={{ height: 42, borderRadius: 14, border: 'none', background: 'rgba(255,255,255,0.1)', fontSize: 24, cursor: 'pointer' }}>{e}</button>)}
                </GPanel>
              </div>
            )}
          </>
        )}

        {lobby}

        {paused && phase === 'play' && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 20, background: 'rgba(10,8,24,0.5)', display: 'flex', padding: 12, overflowY: 'auto', touchAction: 'pan-x pan-y' }}>
            <GPanel style={{ margin: 'auto', width: '100%', maxWidth: 330, padding: land ? '14px 16px' : '18px 18px', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: land ? 10 : 12, animation: 'zgk-pop 0.3s ease-out', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                <GTitle text="Paused" size={28} />
                <span style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,0.62)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{`Level ${levelName(lvl)}, ${fmtT(hud.time)}`}</span>
              </div>
              <GPill text="Resume" icon="play" color="green" wide onPress={() => setPaused(false)} />
              <div style={{ display: 'flex', gap: 8 }}>
                <GPill text="Restart" icon="replay" color="white" small wide onPress={() => startLevel(lvl)} style={{ flex: 1 }} />
                <GPill text="Settings" icon="gear" color="white" small wide onPress={() => setCtl(true)} style={{ flex: 1 }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <GPill text="Levels" icon="map" color="white" small wide onPress={toMenu} style={{ flex: 1 }} />
                <GPill text="Leave" color="red" small wide onPress={finish} style={{ flex: 1 }} />
              </div>
            </GPanel>
          </div>
        )}

        {phase === 'done' && result && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 20, background: 'rgba(10,8,24,0.45)', display: 'flex', padding: 12, overflowY: 'auto', touchAction: 'pan-x pan-y' }}>
            <GPanel style={{ margin: 'auto', width: '100%', maxWidth: 350, padding: land ? '14px 16px' : '20px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: land ? 9 : 12, textAlign: 'center', animation: 'zgk-pop 0.35s ease-out' }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>{[0, 1, 2].map((q) => <div key={q} style={{ transform: q === 1 ? 'translateY(-6px)' : 'none' }}><GIcon k="star" size={q === 1 ? 42 : 34} color={result.stars > q ? '#FFD23F' : 'rgba(255,255,255,0.16)'} /></div>)}</div>
              <GTitle text={`Level ${levelName(result.i)} clear`} size={28} color="#FFE15A" />
              <GStat items={[['Time', fmtT(result.time)], ['Coins', `${result.coins}/${result.coinsAll}`], ['Pops', String(result.deaths)]]} />
              {isHost ? (
                <>
                  {result.i < LEVEL_N - 1 && <GPill text="Next level" icon="play" color="green" wide onPress={() => startLevel(result.i + 1)} />}
                  <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                    <GPill text="Replay" icon="replay" color="white" small wide onPress={() => startLevel(result.i)} style={{ flex: 1 }} />
                    <GPill text="Levels" icon="map" color="white" small wide onPress={toMenu} style={{ flex: 1 }} />
                  </div>
                </>
              ) : <div style={{ fontSize: 13.5, fontWeight: 800, color: 'rgba(255,255,255,0.75)' }}>{`${names[room && room.host] || 'The host'} picks what is next`}</div>}
              <GPill text={solo ? 'Leave' : 'Back to chat'} color="dark" small wide onPress={finish} />
            </GPanel>
          </div>
        )}

        {ctl && (
          <div onPointerDown={(e) => e.stopPropagation()} style={{ position: 'absolute', inset: 0, zIndex: 45, background: 'rgba(10,8,24,0.55)', display: 'flex', padding: 12, overflowY: 'auto', touchAction: 'pan-y' }}>
            <div style={{ margin: 'auto', width: '100%', display: 'flex', justifyContent: 'center' }}><GControlsPanel sideways wide={land} onClose={() => setCtl(false)} /></div>
          </div>
        )}
        <GTalkers ids={talking} nameOf={nameOf} top={top(phase === 'play' && land ? 46 : 50)} />
        <GNotices items={notes} style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', ...(phase !== 'play' ? { top: top(64) } : land ? { top: top(46) } : { bottom: bottom(112) }), width: land ? 'min(52%, 420px)' : 'calc(100% - 40px)', zIndex: 30 }} />
        <GJoinAsks asks={jask.asks} onAnswer={jask.answer} style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: top(110), width: 'min(80%, 380px)', zIndex: 35 }} />
        {phase === 'play' && <GChatFeed items={feed} style={{ position: 'absolute', left: left(12), top: top(land ? 82 : 150), width: land ? 'min(40%, 330px)' : 'calc(100% - 24px)', zIndex: 29 }} />}
        {people && !solo && (
          <Sheet title="Players and voice" text={relay.mic.on ? 'Your mic is on. Everyone in the game can hear you.' : 'Turn your mic on to talk while you play.'} onClose={() => setPeople(false)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
              {roster.map((k, i) => {
                const isMe = k === kindOf();
                const nm = nameOf(k);
                const talk = isMe ? relay.mic.on : !!relay.mics[k];
                const off = !!relay.muted[k];
                return (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', borderRadius: 14, background: 'rgba(255,255,255,0.06)' }}>
                    <BallBadge ci={i} size={36} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nm}{k === (room && room.host) ? ', host' : ''}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: talk ? '#7BE05A' : 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center', gap: 4 }}><GIcon k={talk ? 'mic' : 'micoff'} size={12} color={talk ? '#7BE05A' : 'rgba(255,255,255,0.55)'} />{talk ? 'Mic on' : 'Mic off'}{off ? ', muted by you' : ''}</div>
                    </div>
                    {!isMe && relay.setVol && <GVolBars name={nm} vol={relay.vols && relay.vols[k] != null ? relay.vols[k] : 1} muted={off} onVol={(v) => { if (off) relay.toggleMute(k); relay.setVol(k, v); }} />}
                    {!isMe && <GBtn icon={off ? 'mute' : 'sound'} color={off ? 'red' : 'dark'} size={40} fast={false} label={off ? `Unmute ${nm}` : `Mute ${nm}`} onPress={() => relay.toggleMute(k)} />}
                  </div>
                );
              })}
            </div>
            {watchers.length > 0 && <div style={{ fontSize: 12.5, fontWeight: 800, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}><GIcon k="eye" size={14} color="#CFE6FF" />{`Watching: ${watchers.map((w) => names[w] || 'Friend').join(', ')}. They cannot hear you.`}</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <GPill text={relay.mic.on ? 'Mic off' : 'Mic on'} icon={relay.mic.on ? 'micoff' : 'mic'} color={relay.mic.on ? 'white' : 'blue'} small wide onPress={relay.toggleMic} style={{ flex: 1 }} />
              <GPill text="Done" color="dark" small wide onPress={() => setPeople(false)} style={{ flex: 1 }} />
            </div>
          </Sheet>
        )}
        {chatOpen && <ChatSheet title="Talk to the room" chat={chat} onClose={() => setChatOpen(false)} />}
        {leaveAsk && (
          <Sheet title="Leave the game?" text="Your friends can keep playing without you." onClose={() => setLeaveAsk(false)}>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <GPill text="Stay" color="white" small onPress={() => setLeaveAsk(false)} style={{ flex: 1 }} wide />
              <GPill text="Leave" color="red" small onPress={() => { setLeaveAsk(false); finish(); }} style={{ flex: 1 }} wide />
            </div>
          </Sheet>
        )}
      </div>
      </div>
    </GSkin></Portal>
  );
}

export function RollInviteSheet({ friends, onClose, onInvite, already }) {
  injectKitCss();
  useBackClose(true, onClose);
  const [sel, setSel] = useState([]);
  const left = 3 - (already || 0);
  const list = (friends || []).filter((p) => p && p.id && !p.is_bot);
  const toggle = (id) => { kitTap(); setSel((v) => (v.includes(id) ? v.filter((x) => x !== id) : v.length >= left ? v : [...v, id])); };
  return (
    <Portal>
      <div {...backdropProps(onClose)} style={{ position: 'fixed', inset: 0, zIndex: 96, background: 'rgba(10,8,24,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT, color: '#FFFFFF' }}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, maxHeight: 'min(86vh, 640px)', display: 'flex', flexDirection: 'column', padding: '14px 14px calc(14px + env(safe-area-inset-bottom))', boxSizing: 'border-box', animation: 'zgk-in 0.25s ease-out' }}>
          <GPanel style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex' }}>{[0, 1, 2].map((i) => <div key={i} style={{ marginLeft: i ? -12 : 0 }}><BallBadge ci={i + 1} size={36} /></div>)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 17, fontWeight: 900 }}>Invite friends</div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,0.72)' }}>{`Pick up to ${left}. Each one gets an invite in your chat.`}</div>
              </div>
              <GBtn icon="close" color="white" size={38} fast={false} label="Close" onPress={onClose} />
            </div>
            <div style={{ overflowY: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '52vh', WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
              {list.length === 0 && <div style={{ fontSize: 13.5, fontWeight: 700, color: 'rgba(255,255,255,0.75)', padding: '12px 4px' }}>Chat with someone first, then you can invite them here.</div>}
              {list.map((p) => {
                const on = sel.includes(p.id);
                return (
                  <div key={p.id} role="button" tabIndex={0} aria-pressed={on} onClick={() => toggle(p.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 16, background: on ? 'rgba(91,227,125,0.18)' : 'rgba(255,255,255,0.06)', boxShadow: on ? 'inset 0 0 0 2px #5BE37D' : 'none', cursor: 'pointer' }}>
                    <Avatar emoji={p.avatar} name={p.name} size={40} />
                    <span style={{ flex: 1, minWidth: 0, fontSize: 14.5, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                    <span aria-hidden="true" style={{ width: 26, height: 26, borderRadius: 13, background: on ? '#F7C53A' : 'transparent', boxShadow: on ? 'none' : 'inset 0 0 0 2px rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{on && <GIcon k="check" size={16} color="#1F1702" line halo={false} stroke={2.6} />}</span>
                  </div>
                );
              })}
            </div>
            <GPill text={sel.length ? `Invite ${sel.length} and play` : 'Pick friends'} icon="play" color="green" wide disabled={!sel.length} onPress={() => onInvite(list.filter((p) => sel.includes(p.id)))} />
          </GPanel>
        </div>
      </div>
    </Portal>
  );
}

export default RollGamePage;
