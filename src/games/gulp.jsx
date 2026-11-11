import React, { useEffect, useRef, useState } from 'react';
import { Avatar, Portal, useBackClose, hapticTap, FONT, Spinner } from '../App.jsx';
import { useGameLink, useRoomRelay, useWatchChannel, useMeshRoom } from './relay.jsx';
import { watchAllowed, setWatchAllowed, useLiveBeacon } from './live.js';
import { EMOTES, PingChip, Sheet, injectCss, useVoice } from './livekit.jsx';
import { GC, GBtn, GPill, GPanel, GChip, GTitle, GJoy, GIcon, GControlsPanel, GHudBtn, GHudPanel, GHudSkill, useCtlLook, useGameStage, useJoystick, injectKitCss, kitTap, pressProps, maxDpr, INK } from './gamekit.jsx';
import { Sfx } from './sfx.js';
import { WW, WH, LIVES, STAGES, SKILLS, SKILL_KEYS, SPECIES, rOf, viewOf, stageOf, clamp, makeGame, spawnFish, hostStep, applyGuestEvent, snap, applySnap, guestFollow, setNet, followNet, movePlayer, tickPlayer, canEat, canTake, canOpen, chestGain, eatGain, botInput, useSkill, addPlayer, dropPlayer, adoptHost } from './gulpengine.js';
import { render, makeDeco, updateParts, bubbles, floatText, burst, bits, ring, drawMinimap, drawBadge, fmtN, PLAYER_PAL, SLOT_KEYS, warmSprites } from './gulpdraw.js';
import { GULP_LEVELS, goalText, rulesText, goalProgress, starsFor, readLevels, saveLevel, pickMission, missionProgress, missionLabel, REWARDS } from './gulplevels.js';

const QUICK = ['Come here', 'Run', 'Big fish', 'Nice one', 'Watch out', 'Good game'];
const PHRASES = ['Come here', 'Run', 'Big fish behind you', 'Nice one', 'Watch out', 'Good game', 'Rematch', 'Sorry'];
const ROOM_MAX = 10;
const BEST_KEY = (uid) => `zchat-gulp2-best-${uid || 'me'}`;
const SKILL_COL = { dash: 'blue', suck: 'purple', shield: 'teal', shock: 'gold', frenzy: 'red' };
const SKILL_ICON = { dash: 'dash', suck: 'suck', shield: 'shield', shock: 'bolt', frenzy: 'flame' };
const ARC = { suck: 180, shield: 145, shock: 112, frenzy: 82 };
const FX_NAME = { shield: 'a shield', double: 'double food', magnet: 'a magnet', speed: 'a speed boost' };
const MINI_W = 168, MINI_H = 44;
const SK_X = 186, SK_Y = 156, SK_R = 94;
const skillAt = (k) => {
  if (k === 'dash') return [SK_X - 36, SK_Y - 36];
  const a = (ARC[k] * Math.PI) / 180;
  return [Math.round(SK_X + Math.cos(a) * SK_R - 26), Math.round(SK_Y - Math.sin(a) * SK_R - 26)];
};
const BOT_NAMES = ['Bubbles', 'Finn'];
const JOY_COL = { sun: 'orange', moon: 'blue', c0: 'orange', c1: 'blue', c2: 'green', c3: 'pink', c4: 'purple', c5: 'gold', c6: 'teal', c7: 'red', c8: 'white', c9: 'orange' };
function readBest(uid) { try { return JSON.parse(localStorage.getItem(BEST_KEY(uid)) || '{}') || {}; } catch { return {}; } }
function saveBest(uid, r) {
  try {
    const b = readBest(uid);
    const out = { top: Math.max(b.top || 0, r.n), time: Math.max(b.time || 0, r.time || 0), eaten: (b.eaten || 0) + (r.eaten || 0), wins: (b.wins || 0) + (r.win ? 1 : 0), games: (b.games || 0) + 1, missions: (b.missions || 0) + (r.missions || 0) };
    localStorage.setItem(BEST_KEY(uid), JSON.stringify(out));
    return { ...out, newTop: r.n > (b.top || 0) };
  } catch { return { top: r.n }; }
}
const fmtT = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const newSeed = () => Math.random().toString(36).slice(2, 9);
const firstName = (v, d) => String(v || d || 'Friend').trim().split(' ')[0].slice(0, 16) || d || 'Friend';
const SPNAME = { minnow: 'Minnow', guppy: 'Guppy', clown: 'Clownfish', tang: 'Tang', angel: 'Angelfish', puffer: 'Pufferfish', snapper: 'Snapper', tuna: 'Tuna', lantern: 'Lanternfish', squid: 'Squid', jelly: 'Jellyfish', barra: 'Barracuda', shark: 'Shark', angler: 'Anglerfish', orca: 'Orca', whale: 'Whale' };

export function FishBadge({ color, stage, size = 64 }) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const d = Math.min(2, window.devicePixelRatio || 1);
    cv.width = size * d; cv.height = size * d;
    const c = cv.getContext('2d');
    c.setTransform(d, 0, 0, d, 0, 0);
    try { drawBadge(c, color, stage, size); } catch {}
  }, [color, stage, size]);
  return <canvas ref={ref} aria-hidden="true" style={{ width: size, height: size, display: 'block', flexShrink: 0 }} />;
}

function Toggle({ on }) {
  return <span aria-hidden="true" style={{ width: 46, height: 28, borderRadius: 14, background: on ? '#5BE37D' : '#5A5470', boxShadow: `0 0 0 2.5px ${INK}`, position: 'relative', flexShrink: 0 }}><span style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 22, height: 22, borderRadius: 11, background: '#FFFFFF', boxShadow: `0 0 0 2px ${INK}`, transition: 'left 0.2s' }} /></span>;
}

export function GulpGamePage({ solo = false, initial, me, peer, myId, onClose, onSaveState, onPeerAway, watch = null, room = null, onInvite }) {
  injectCss(); injectKitCss();
  const isRoom = !!room;
  const isWatch = !isRoom && !!watch;
  const isSolo = !isRoom && !isWatch && !!solo;
  const isDuel = !isRoom && !isWatch && !isSolo;
  const gameId = isWatch ? watch.gameId : isRoom ? room.rm : (initial && initial.id) || 'solo';
  const host = isSolo || (isDuel && (!initial || initial.x === myId));
  const mine = isWatch ? 'none' : isRoom ? myId : host ? 'sun' : 'moon';
  const theirs = mine === 'sun' ? 'moon' : 'sun';
  const myFirst = firstName(me && me.name, 'You');
  const peerFirst = isSolo ? 'Bot' : isWatch ? firstName(watch.names && watch.names.moon) : isDuel ? firstName(peer && peer.name) : 'Friend';
  const hostFirst = isWatch ? firstName(watch.names && watch.names.sun) : '';
  const look = useCtlLook();
  const lookNow = useRef(look); lookNow.current = look;
  const relay0 = useGameLink({ id: isDuel ? `gulp-${gameId}` : null, myId, peerId: peer && peer.id, enabled: isDuel, g: 'gulp', fast: ['gp', 'gs'] });
  const wrelay = useRoomRelay({ id: isWatch ? `gulp-${gameId}` : null, myId, enabled: isWatch, passive: true });
  const myAva = me && typeof me.avatar === 'string' && me.avatar.length < 400 ? me.avatar : null;
  const mesh = useMeshRoom({ id: isRoom ? `gulpco-${room.rm}` : null, myId, enabled: isRoom, meta: { n: myFirst, a: myAva }, fast: ['gp', 'gs'], audio: true });
  const relay = isRoom ? mesh : isWatch ? wrelay : relay0;
  const here = isSolo ? true : relay.here;
  const voice = useVoice(isDuel ? relay0 : null, isDuel, host && isDuel);
  const [allowWatch, setAllowWatch] = useState(watchAllowed());
  const [followK, setFollowK] = useState('sun');
  const followRef = useRef('sun'); followRef.current = followK;
  const watchers = useWatchChannel({ room: isDuel || isWatch ? `gulp-${gameId}` : null, myId, enabled: isDuel || isWatch, role: isWatch ? 'watcher' : 'player', meta: { n: myFirst, a: myAva }, allow: allowWatch, onDenied: () => { setToast({ text: 'The players turned off watching.', at: Date.now() }); setTimeout(() => onClose(), 1600); } });
  const watchersRef = useRef(watchers); watchersRef.current = watchers;
  useEffect(() => { if (relay0.watch) relay0.watch(watchers.length > 0); }, [watchers.length]);
  const [phase, setPhase] = useState(isSolo ? 'menu' : isRoom ? 'join' : 'lobby');
  const [hud, setHud] = useState({ n: 2, st: 0, lives: LIVES, time: 0, cd: {}, fx: {}, on: null, combo: 0, dead: 0, goal: null });
  const [toast, setToast] = useState(null);
  const [banner, setBanner] = useState(null);
  const [deathMsg, setDeathMsg] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [quick, setQuick] = useState(false);
  const [paused, setPaused] = useState(false);
  const [ctl, setCtl] = useState(false);
  const [chatText, setChatText] = useState('');
  const [log, setLog] = useState([]);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState({ x: 0, o: 0 });
  const [leaveAsk, setLeaveAsk] = useState(false);
  const [net, setNetView] = useState({ ping: null, weak: false, lost: false });
  const [snd, setSnd] = useState({ sfx: Sfx.sfxOn, mus: Sfx.musicOn });
  const [lvls, setLvls] = useState(() => readLevels(myId));
  const [roomHost, setRoomHost] = useState(null);
  const [roster, setRoster] = useState({ ids: [], nm: {}, col: {} });
  useLiveBeacon({ game: 'gulp', room: isRoom ? `gulpco-${gameId}` : `gulp-${gameId}`, info: isRoom ? { co: 1, rm: gameId, n: Math.max(1, roster.ids.length) } : { g: gameId, h: initial && initial.x, o: initial && initial.o }, active: isRoom || (isDuel && !!initial), allow: allowWatch });
  const [feed, setFeed] = useState([]);
  const [full, setFull] = useState(false);
  const best = useRef(readBest(myId));
  const GS = useGameStage(look);
  const rootRef = GS.rootRef;
  const cvRef = useRef(null);
  const miniRef = useRef(null);
  const hudRefs = useRef({});
  const keepRef = useRef({ at: 0, list: [] });
  const hudRef = (k) => (el) => { hudRefs.current[k] = el; };
  const wrapRef = useRef(null);
  const GR = useRef(null);
  const demoRef = useRef(null);
  const partsRef = useRef([]);
  const hiddenRef = useRef(new Map());
  const pendRef = useRef([]);
  const lastSeq = useRef(0);
  const cam = useRef({ x: 40, y: 40, z: 40, init: false, shake: 0 });
  const keys = useRef(new Set());
  const skillReq = useRef(null);
  const bubblesRef = useRef({});
  const phaseRef = useRef(phase); phaseRef.current = phase;
  const pausedRef = useRef(false); pausedRef.current = paused;
  const scoreRef = useRef(score); scoreRef.current = score;
  const netRef = useRef({ pings: [], ping: null, n: 0, last: 0, view: '' });
  const sendT = useRef({ s: 0, p: 0 });
  const hudKey = useRef('');
  const toastTimer = useRef(0);
  const bannerTimer = useRef(0);
  const overRef = useRef(false);
  const budget = useRef({ avg: 16, low: false, n: 0 });
  const sheetOpen = useRef(false);
  const levelRef = useRef(null);
  const hostRef = useRef(null);
  const rosterRef = useRef({ ids: [], nm: {}, col: {}, sent: 0 });
  const linksRef = useRef({}); linksRef.current = mesh.links;
  const peersRef = useRef([]); peersRef.current = mesh.peers;
  const readyRef = useRef(false); readyRef.current = mesh.ready;
  const sinceRef = useRef(0);
  const metasRef = useRef({}); metasRef.current = mesh.metas;
  const micsRef = useRef({}); micsRef.current = isRoom ? { ...mesh.mics, [myId]: mesh.mic.on } : null;
  const goneAt = useRef(new Map());
  const snapAt = useRef(new Map());
  const lastGt = useRef(null);
  const hostHeard = useRef(0);
  const joinedAt = useRef(Date.now());
  const side = GS.side;
  const sideRef = useRef(side); sideRef.current = side;
  const cw0 = GS.W, ch0 = GS.H;
  const land = GS.land;
  const missRef = useRef(null);
  sheetOpen.current = !!sheet || leaveAsk || paused || ctl;
  const amHost = () => (isRoom ? hostRef.current === myId : host);
  const J = useJoystick(wrapRef, {
    enabled: () => phaseRef.current === 'play' && !sheetOpen.current,
    rot: () => sideRef.current,
    radius: () => Math.round((land ? 46 : 52) * Math.max(0.7, look.size)),
    zone: (x, y, r) => (r.width > r.height ? x < r.width * 0.52 && y > 64 : !(x > r.width * 0.55 && y > r.height - 300) && y > 90),
  });
  if (typeof window !== 'undefined' && window.__zfake) window.__zgulp = { game: () => GR.current, demo: () => demoRef.current, host: () => hostRef.current, roster: () => rosterRef.current, level: () => levelRef.current, miss: () => missRef.current };

  const say = (text, sec) => { setToast({ text, at: Date.now() }); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(null), (sec || 2.6) * 1000); };
  const showBanner = (b, sec) => { setBanner({ ...b, at: Date.now() }); clearTimeout(bannerTimer.current); bannerTimer.current = setTimeout(() => setBanner(null), (sec || 2.8) * 1000); };
  const bubble = (kind, text, emo) => { bubblesRef.current[kind] = emo ? { text, t: 0, life: 1.7, emo: true } : { text, t: 0, life: Math.max(3.2, text.length * 0.075) }; };
  const heard = () => { netRef.current.last = Date.now(); };
  const nameOf = (k) => (k === mine ? 'You' : isRoom ? rosterRef.current.nm[k] || (metasRef.current[k] && metasRef.current[k].n) || 'Friend' : k === theirs ? peerFirst : 'Friend');
  const pushFeed = (text, kind) => { const it = { id: `${Date.now()}${Math.random()}`, text, kind }; setFeed((f) => [...f.slice(-3), it]); setTimeout(() => setFeed((f) => f.filter((x) => x !== it)), 6500); };
  const names = () => {
    const n = { [mine]: 'You' };
    if (isRoom) { const R = rosterRef.current; for (const k of R.ids) if (k !== mine) n[k] = R.nm[k] || 'Friend'; }
    else if (isSolo) { n.b1 = BOT_NAMES[0]; n.b2 = BOT_NAMES[1]; } else if (isWatch) { n.sun = hostFirst; n.moon = peerFirst; } else n[theirs] = peerFirst;
    return n;
  };
  const paintRoster = (G) => { const R = rosterRef.current; for (const k of G.order) { const p = G.pl[k]; if (p && R.col[k] != null) { p.color = SLOT_KEYS[R.col[k]] || 'c0'; p.name = R.nm[k] || p.name; } } };

  useEffect(() => {
    try { warmSprites(); } catch {}
    const D = makeGame('menu', { solo: true, demo: true, players: [] });
    D.deco = makeDeco('menu');
    demoRef.current = D;
    return () => { Sfx.stopAll(); clearTimeout(toastTimer.current); clearTimeout(bannerTimer.current); };
  }, []);

  const initRound = (G) => {
    GR.current = G;
    partsRef.current = [];
    hiddenRef.current = new Map();
    pendRef.current = [];
    lastSeq.current = amHost() ? 0 : -1;
    lastGt.current = null;
    overRef.current = false;
    cam.current.init = false;
    J.reset();
    setResult(null); setSheet(null); setQuick(false); setPaused(false); setDeathMsg(null); setBanner(null);
    setPhase('play');
    Sfx.init();
    Sfx.music('sea', true);
    Sfx.amb(true, 0.45);
  };

  const startRound = (seed, quiet) => {
    levelRef.current = null;
    const players = isSolo ? [{ kind: 'sun', name: 'You' }, { kind: 'b1', name: BOT_NAMES[0], bot: true }, { kind: 'b2', name: BOT_NAMES[1], bot: true }] : isWatch ? [{ kind: 'sun', name: hostFirst }, { kind: 'moon', name: peerFirst }] : [{ kind: 'sun', name: host ? myFirst : peerFirst }, { kind: 'moon', name: host ? peerFirst : myFirst }];
    const G = makeGame(seed, { solo: isSolo, players });
    if (!host) G.fish = [];
    G.deco = makeDeco(seed);
    missRef.current = null;
    if (isSolo) {
      const p0 = G.pl.sun;
      const M = { list: [], done: 0, seq: 0, picks: 0 };
      for (let k = 0; k < 3; k++) { const m = pickMission(M.list, p0, { picks: 0, t: 0 }); m.id = ++M.seq; m.cur = 0; M.list.push(m); }
      missRef.current = M;
    }
    initRound(G);
    if (isDuel && host && !quiet) relay.send('gl', { seed, sc: scoreRef.current });
    say('Eat fish with smaller numbers to grow. Red numbers can eat you.', 3.6);
    if (isDuel && host && onSaveState && initial && initial.st !== 'live') onSaveState({ ...initial, st: 'live', exp: null });
  };

  const startLevel = (i) => {
    const L = GULP_LEVELS[i];
    if (!L) return;
    Sfx.init();
    const seed = `lv${i}-${newSeed()}`;
    const G = makeGame(seed, { solo: true, players: [{ kind: 'sun', name: 'You' }], cfg: L.cfg });
    const p = G.pl.sun;
    if (L.start) { p.x = L.start[0]; p.y = L.start[1]; }
    if (L.n) { p.n = L.n; p.best = L.n; p.stage = stageOf(L.n); }
    if (L.lives) { p.lives = L.lives; p.maxLives = L.lives; }
    G.fish = [];
    for (let k = 0; k < 26; k++) spawnFish(G, true, p);
    G.deco = makeDeco(seed);
    levelRef.current = { i, L, picks: 0, combo: 0 };
    missRef.current = null;
    initRound(G);
    showBanner({ title: `Level ${i + 1}`, sub: goalText(L) }, 2.6);
  };

  const resetGuestSync = () => {
    lastSeq.current = -1;
    lastGt.current = null;
    pendRef.current = [];
    hiddenRef.current = new Map();
    const G = GR.current;
    if (G) G.lastGt = null;
  };
  const applyRoster = (next) => {
    const prev = rosterRef.current;
    rosterRef.current = next;
    setRoster(next);
    if (prev.ids.length) {
      for (const id of next.ids) if (!prev.ids.includes(id) && id !== myId) { pushFeed(`${next.nm[id] || 'A friend'} joined`, 'in'); Sfx.play('pop', { vol: 0.5 }); }
      for (const id of prev.ids) if (!next.ids.includes(id) && id !== myId) pushFeed(`${prev.nm[id] || 'A friend'} left`, 'out');
    }
    if (GR.current) paintRoster(GR.current);
  };
  const startRoomAsHost = () => {
    const seed = newSeed();
    const G = makeGame(seed, { coop: true, players: [{ kind: myId, name: myFirst, color: 'c0' }] });
    G.deco = makeDeco(seed);
    hostRef.current = myId;
    setRoomHost(myId);
    sinceRef.current = Date.now();
    initRound(G);
    applyRoster({ ids: [myId], nm: { [myId]: myFirst }, col: { [myId]: 0 }, sent: 0 });
    say('Your room is open. Friends can drop in any time.', 3.2);
  };
  const startGuest = (seed) => {
    const G = makeGame(seed, { coop: true, players: [] });
    G.fish = [];
    G.deco = makeDeco(seed);
    initRound(G);
    resetGuestSync();
  };
  const promote = () => {
    const G = GR.current;
    if (!G) { startRoomAsHost(); return; }
    const old = hostRef.current;
    adoptHost(G, G.seed);
    hostRef.current = myId;
    setRoomHost(myId);
    if (old && old !== myId) dropPlayer(G, old);
    pendRef.current = [];
    hiddenRef.current = new Map();
    lastSeq.current = 0;
    const R = rosterRef.current;
    const ids = R.ids.filter((x) => x !== old);
    if (!ids.includes(myId)) ids.unshift(myId);
    const col = { ...R.col }; delete col[old];
    if (col[myId] == null) col[myId] = 0;
    const nm = { ...R.nm, [myId]: myFirst };
    for (const k of ids) if (!G.pl[k] && k !== myId) addPlayer(G, k, nm[k] || 'Friend', SLOT_KEYS[col[k] || 0]);
    applyRoster({ ids, nm, col, sent: Date.now() });
    mesh.send('ro', { h: myId, ids, nm, col, seed: G.seed, since: sinceRef.current });
  };

  const finishRound = (G, sc) => {
    if (overRef.current) return;
    overRef.current = true;
    if (isWatch) { const o0 = G.over || {}; setTimeout(() => { if (GR.current === G) { setResult({ watch: true, w: o0.w, why: o0.why, mn: G.pl.sun ? G.pl.sun.best : 0, tn: G.pl.moon ? G.pl.moon.best : 0, time: G.t, eaten: 0, sc: sc || scoreRef.current }); setPhase('over'); Sfx.music(null, false); } }, 1300); return; }
    const o = G.over || { w: null };
    const meP = G.pl[mine];
    const Lv = levelRef.current;
    if (Lv) {
      const win = o.why === 'goal';
      const r = { level: Lv.i, win, why: o.why, time: G.t, deaths: (meP && meP.deaths) || 0, mn: meP ? meP.best : 2, eaten: meP ? meP.eaten : 0 };
      r.stars = win ? starsFor(Lv.L, r) : 0;
      if (win) setLvls(saveLevel(myId, Lv.i, r));
      Sfx.music(null, false);
      setTimeout(() => { if (GR.current === G) { setResult(r); setPhase('over'); Sfx.play(win ? 'win' : 'die', { vol: 0.7 }); if (win) { try { window.dispatchEvent(new CustomEvent('zchat-screen-fx', { detail: 'confetti' })); } catch {} } } }, win ? 900 : 1300);
      return;
    }
    const win = isDuel && o.w === mine;
    let nsc = sc || scoreRef.current;
    if (isDuel && host && !sc) { nsc = { ...scoreRef.current }; if (o.w === 'sun') nsc.x += 1; else if (o.w === 'moon') nsc.o += 1; setScore(nsc); scoreRef.current = nsc; }
    G.sc = nsc; G.overAt = Date.now();
    const rec = saveBest(myId, { n: meP ? meP.best : 2, time: G.t, eaten: meP ? meP.eaten : 0, win, missions: missRef.current ? missRef.current.done : 0 });
    best.current = readBest(myId);
    const other = G.pl[theirs];
    const r = { win, solo: isSolo, why: o.why, mn: meP ? meP.best : 2, tn: other ? other.best : 0, time: G.t, eaten: meP ? meP.eaten : 0, newTop: !!rec.newTop, sc: nsc, missions: missRef.current ? missRef.current.done : 0 };
    Sfx.music(null, false);
    setTimeout(() => { if (GR.current === G) { setResult(r); setPhase('over'); Sfx.play(win || (isSolo && rec.newTop) ? 'win' : 'die', { vol: 0.7 }); if (win) { try { window.dispatchEvent(new CustomEvent('zchat-screen-fx', { detail: 'confetti' })); } catch {} } } }, 1300);
    if (host && isDuel && onSaveState && initial) onSaveState({ ...initial, st: 'live', exp: null, sx: nsc.x, so: nsc.o, w: nsc.x > nsc.o ? 'x' : nsc.o > nsc.x ? 'o' : 'd' });
  };

  const handleEv = (G, e, remote) => {
    const P = partsRef.current;
    const me2 = G.pl[mine];
    const V = me2 ? viewOf(me2.n) : 10;
    const near = (x, y) => !me2 || Math.hypot(me2.x - x, me2.y - y) < V * 1.2;
    switch (e.k) {
      case 'eat': {
        if (remote && e.who === mine) break;
        const sc = rOf(Math.max(2, e.gain)) * 0.5;
        bubbles(P, e.x, e.y, e.big ? 8 : 3, sc * 0.4 + 0.05);
        bits(P, e.x, e.y, (SPECIES[e.sp] && SPECIES[e.sp].pal[0][0]) || '#FFD23F', e.big ? 10 : 5, Math.max(0.3, sc));
        if (near(e.x, e.y)) {
          const eater = G.pl[e.who];
          const rel = e.gain / Math.max(2, eater ? eater.n : 2);
          const pick = (a) => a[Math.floor(Math.random() * a.length)];
          const snd = e.big || rel > 0.2 ? pick(['bigchomp1', 'bigchomp2']) : rel > 0.035 ? pick(['munch1', 'munch2', 'munch3']) : pick(['nib1', 'nib2']);
          Sfx.play(snd, { vol: e.who === mine ? (snd.indexOf('nib') === 0 ? 0.7 : 0.95) : 0.35, rate: 0.88 + Math.random() * 0.24, gap: snd.indexOf('nib') === 0 ? 0.07 : 0.05 });
          if (e.who === mine && e.c >= 3) Sfx.play('combo', { vol: 0.5, rate: Math.min(2, 0.9 + e.c * 0.08), gap: 0.05 });
          if (e.who === mine && e.c >= 10 && e.c % 10 === 0) setTimeout(() => Sfx.play('burp', { vol: 0.7, rate: 0.9 + Math.random() * 0.2 }), 450);
        }
        if (e.n && near(e.x, e.y)) P.push({ k: 'swal', x: e.x, y: e.y, sp: e.sp, pv: e.pv || 0, n: e.n, who: e.who, life: 0.16, max: 0.16, vx: 0, vy: 0 });
        if (e.gold && e.who === mine) { setToast(null); showBanner({ title: 'Golden fish', sub: `+${fmtN(e.gain)}` }, 2.4); Sfx.play('star', { vol: 0.8 }); burst(P, e.x, e.y, '#FFE15A', 26, 1.6); }
        const mp = G.pl[mine];
        if (e.who === mine ? e.gain >= Math.max(2, (mp ? mp.n : 2) * 0.025) || e.big : e.big) floatText(P, e.x, e.y - 0.4, `+${fmtN(e.gain)}`, e.who === mine ? '#FFF2A8' : '#CFE9FF');
        if (e.who === mine && e.c >= 3) {
          const p2 = G.pl[mine];
          const old = P.find((q) => q.combo);
          const cy = p2 ? p2.y - rOf(p2.n) * 2.2 : e.y - 1.2;
          if (old) { old.text = `Combo x${e.c}`; old.life = 1.3; old.x = p2 ? p2.x : e.x; old.y = cy; }
          else { floatText(P, p2 ? p2.x : e.x, cy, `Combo x${e.c}`, '#FFB34D', true); P[P.length - 1].combo = true; }
        }
        break;
      }
      case 'eatp': Sfx.play('bigchomp2', { vol: 1, force: true }); Sfx.play('gulp3', { vol: 0.6 }); burst(P, e.x, e.y, '#FFD27A', 26, 1.5); floatText(P, e.x, e.y - 0.6, `+${fmtN(e.gain)}`, '#FFFFFF', true); if (e.who === mine) { say(`You ate ${(G.pl[e.vic] && G.pl[e.vic].name) || 'them'}!`, 2.4); cam.current.shake = 0.4; } break;
      case 'die': {
        bubbles(P, e.x, e.y, 18, 0.18); burst(P, e.x, e.y, '#FFFFFF', 20, 1.2);
        if (e.who === mine) {
          pendRef.current = [];
          Sfx.play('die', { vol: 1, force: true }); cam.current.shake = 0.7;
          try { hapticTap(); } catch {}
          const killer = e.kwho ? ((G.pl[e.kwho] && G.pl[e.kwho].name) || 'A player') : `a ${(SPNAME[SPECIES[e.ksp] ? SPECIES[e.ksp].id : ''] || 'big fish').toLowerCase()}`;
          setDeathMsg({ text: e.kwho ? `${killer} ate you` : `Eaten by ${killer}`, n: e.kn, at: Date.now() });
          setTimeout(() => setDeathMsg(null), 2400);
        } else if (near(e.x, e.y)) Sfx.play('bigchomp1', { vol: 0.6 });
        break;
      }
      case 'out': if (e.who !== mine && isDuel) say(`${peerFirst} is out of lives`, 3); break;
      case 'chest': {
        if (remote && e.who === mine) break;
        burst(P, e.x, e.y - 1, '#FFD23F', 30, 1.8); bubbles(P, e.x, e.y - 1, 10, 0.25);
        if (near(e.x, e.y)) Sfx.play('pick', { vol: 0.9 });
        if (e.who === mine) { Sfx.play('coin', { vol: 0.8 }); floatText(P, e.x, e.y - 2, `+${fmtN(e.gain)}`, '#FFE15A', true); say(`Treasure. +${fmtN(e.gain)}${e.kind && FX_NAME[e.kind] ? ` and ${FX_NAME[e.kind]}` : ''}${e.life ? ', plus an extra life' : ''}.`, 2.6); }
        break;
      }
      case 'goldin': if (e.who === mine) { say('A golden fish is close. Catch it before it gets away.', 3); Sfx.play('pick', { vol: 0.5, rate: 1.3 }); } break;
      case 'pick': if (remote && e.who === mine) break; Sfx.play('pick', { vol: 0.7 }); burst(P, e.x, e.y, '#BFEFFF', 12); if (e.who === mine) { if (levelRef.current) levelRef.current.picks += 1; if (missRef.current) missRef.current.picks += 1; say({ shield: 'Shield on. Nothing can eat you for a moment.', double: 'Double food for a few seconds.', magnet: 'Magnet on. Small fish swim to you.', speed: 'Speed boost.', life: 'Extra life.' }[e.kind] || '', 2); } break;
      case 'hunt': if (e.who === mine) { Sfx.play('alert', { vol: 0.7, gap: 1.5 }); try { hapticTap(); } catch {} } break;
      case 'spawn': if (e.who === mine) { Sfx.play('pop', { vol: 0.6 }); cam.current.init = false; } break;
      case 'evolve': if (e.who === mine) { Sfx.play('evolve', { vol: 0.9, force: true }); const st = STAGES[e.st]; const sk = SKILL_KEYS.find((k) => SKILLS[k].stage === e.st); showBanner({ title: `You grew into a ${st.name}`, sub: sk ? `New skill: ${SKILLS[sk].name}` : 'Your skills got stronger' }, 3.2); const p = G.pl[mine]; if (p) { ring(P, p.x, p.y, rOf(p.n) * 4, '#FFE15A'); burst(P, p.x, p.y, '#FFE15A', 30, 2); } } break;
      case 'feast': if (near(e.x, e.y)) { bits(P, e.x, e.y, '#FF9A9A', 6, 0.5); Sfx.play('chomp', { vol: 0.25, gap: 0.3 }); } break;
      default: break;
    }
  };

  useEffect(() => {
    if (!isDuel && !isWatch) return undefined;
    const offs = [
      relay.on('gl', (m) => { heard(); if (!host) { if (m.sc) setScore(m.sc); startRound(m.seed, true); } }),
      relay.on('gready', (m) => { heard(); if (!host) { if (m.sc) setScore(m.sc); setPhase((p) => (p === 'lobby' || p === 'over' ? 'menu' : p)); } }),
      relay.on('gs', (m) => {
        heard();
        if (host) return;
        let G = GR.current;
        if (!G || G.seed !== m.seed) { startRound(m.seed, true); G = GR.current; }
        if (G.lastGt != null && m.s.gt <= G.lastGt && m.s.gt > G.lastGt - 6000) return;
        applySnap(G, m.s, isWatch ? null : mine);
        if (m.sc) setScore(m.sc);
        if (lastSeq.current < 0) lastSeq.current = m.s.seq || 0;
        for (const e of m.s.ev || []) { if (e.s <= lastSeq.current) continue; lastSeq.current = e.s; handleEv(G, e, true); }
        const now = Date.now();
        const acked = G.acked || new Set();
        pendRef.current = pendRef.current.filter((p) => !acked.has(p.id) && now - p.at < 1600);
        for (const [id, at] of hiddenRef.current) if (now - at > 1600) hiddenRef.current.delete(id);
        if (G.over && !overRef.current) finishRound(G, m.sc);
      }),
      relay.on('gp', (m) => { heard(); const G = GR.current; if (G && (isWatch ? (m.k === 'sun' || m.k === 'moon') : m.k === theirs) && G.pl[m.k]) setNet(G.pl[m.k], m); }),
      relay.on('ge', (m) => { heard(); const G = GR.current; if (host && G && m.seed === G.seed) applyGuestEvent(G, theirs, m.e); }),
      relay.on('pi', (m) => { heard(); relay.send('po', { n: m.n, t0: m.t0 }); }),
      relay.on('po', (m) => { heard(); const N = netRef.current; const rtt = Date.now() - (m.t0 || 0); if (rtt < 0 || rtt > 20000) return; N.pings = [...N.pings.slice(-4), rtt]; const so = [...N.pings].sort((a, b) => a - b); N.ping = Math.max(1, Math.round(so[Math.floor(so.length / 2)])); }),
      relay.on('chat', (m) => { heard(); const text = String(m.text || '').slice(0, 90); if (!text) return; bubble(theirs, text); setLog((l) => [...l.slice(-30), { who: peerFirst, text }]); Sfx.play('pop'); }),
      relay.on('emo', (m) => { heard(); const e = String(m.e || ''); if (!EMOTES.includes(e)) return; bubble(theirs, e, true); Sfx.play('bub3', { vol: 0.6 }); }),
      relay.on('hi', () => { heard(); if (host) { if (GR.current && phaseRef.current === 'play') relay.send('gl', { seed: GR.current.seed, sc: scoreRef.current }); else relay.send('gready', { sc: scoreRef.current }); } }),
      relay.on('hey', heard),
      relay.on('back', heard),
      relay.on('bye', () => {
        say(`${peerFirst} left the game`, 4);
        const G = GR.current;
        if (!G || G.over || phaseRef.current !== 'play') return;
        G.over = { w: mine, why: 'left' };
        if (!host) finishRound(G, scoreRef.current);
      }),
    ];
    return () => offs.forEach((f) => f && f());
  }, [relay.on, host]);

  useEffect(() => {
    if (!isRoom) return undefined;
    const offs = [
      mesh.on('ro', (m) => {
        if (!m || m.h !== m.from || !Array.isArray(m.ids)) return;
        if (hostRef.current === myId) {
          const mine0 = rosterRef.current.ids.filter((x) => x !== m.from).length, theirs0 = m.ids.filter((x) => x !== myId).length;
          const theyWin = theirs0 !== mine0 ? theirs0 > mine0 : (m.since || 0) !== sinceRef.current ? (m.since || 0) < sinceRef.current : m.from < myId;
          if (!theyWin) { mesh.send('ro', { h: myId, ids: rosterRef.current.ids, nm: rosterRef.current.nm, col: rosterRef.current.col, seed: GR.current ? GR.current.seed : '', since: sinceRef.current }); return; }
          hostRef.current = m.from;
          setRoomHost(m.from);
          resetGuestSync();
        } else if (hostRef.current !== m.from) {
          hostRef.current = m.from;
          setRoomHost(m.from);
          resetGuestSync();
        }
        hostHeard.current = Date.now();
        if (m.since) sinceRef.current = m.since;
        if (!GR.current || GR.current.seed !== m.seed) startGuest(m.seed);
        const ids = m.ids.filter((x) => typeof x === 'string').slice(0, ROOM_MAX);
        applyRoster({ ids, nm: m.nm || {}, col: m.col || {}, sent: 0 });
        if (!ids.includes(myId) && ids.length >= ROOM_MAX) setFull(true);
      }),
      mesh.on('gs', (m) => {
        if (!m || !m.s || m.from !== hostRef.current || hostRef.current === myId) return;
        let G = GR.current;
        if (!G || G.seed !== m.seed) { startGuest(m.seed); G = GR.current; }
        hostHeard.current = Date.now();
        if (lastGt.current != null && m.s.gt <= lastGt.current && m.s.gt > lastGt.current - 6000) return;
        lastGt.current = m.s.gt;
        applySnap(G, m.s, mine);
        paintRoster(G);
        if (lastSeq.current < 0) lastSeq.current = m.s.seq || 0;
        for (const e of m.s.ev || []) { if (e.s <= lastSeq.current) continue; lastSeq.current = e.s; handleEv(G, e, true); }
        const now = Date.now();
        const acked = G.acked || new Set();
        pendRef.current = pendRef.current.filter((p) => !acked.has(p.id) && now - p.at < 1600);
        for (const [id, at] of hiddenRef.current) if (now - at > 1600) hiddenRef.current.delete(id);
      }),
      mesh.on('gp', (m) => { const G = GR.current; if (G && m.from !== myId && G.pl[m.from]) setNet(G.pl[m.from], m); }),
      mesh.on('ge', (m) => { const G = GR.current; if (G && hostRef.current === myId && m.seed === G.seed && G.pl[m.from]) applyGuestEvent(G, m.from, m.e); }),
      mesh.on('chat', (m) => { const text = String(m.text || '').slice(0, 90); if (!text) return; bubble(m.from, text); setLog((l) => [...l.slice(-30), { who: nameOf(m.from), text }]); Sfx.play('pop'); }),
      mesh.on('emo', (m) => { const e = String(m.e || ''); if (!EMOTES.includes(e)) return; bubble(m.from, e, true); Sfx.play('bub3', { vol: 0.6 }); }),
    ];
    return () => offs.forEach((f) => f && f());
  }, [mesh.on]);

  useEffect(() => {
    if (!isRoom) return undefined;
    const iv = setInterval(() => {
      const now = Date.now();
      const present = peersRef.current;
      if (!hostRef.current) {
        if (!readyRef.current) { joinedAt.current = now; return; }
        const wait = present.length ? 7000 : 3200;
        if (now - joinedAt.current > wait) startRoomAsHost();
        return;
      }
      if (hostRef.current !== myId) {
        const h = hostRef.current;
        const k = `h:${h}`;
        const quiet = hostHeard.current && now - hostHeard.current > 7000;
        if (present.includes(h) && !quiet) goneAt.current.delete(k);
        else if (!goneAt.current.has(k)) goneAt.current.set(k, now);
        else if (now - goneAt.current.get(k) > 3500) {
          goneAt.current.delete(k);
          const cands = rosterRef.current.ids.filter((id) => id !== h && (id === myId || present.includes(id)));
          const nh = cands[0] || myId;
          if (nh === myId) promote();
          else { hostRef.current = nh; setRoomHost(nh); resetGuestSync(); hostHeard.current = now; }
        }
        return;
      }
      const G = GR.current;
      if (!G) return;
      const R = rosterRef.current;
      let ids = R.ids.slice();
      const nm = { ...R.nm };
      const col = { ...R.col };
      let changed = false;
      for (const id of R.ids) {
        if (id === myId) continue;
        if (present.includes(id)) { goneAt.current.delete(id); continue; }
        if (!goneAt.current.has(id)) { goneAt.current.set(id, now); continue; }
        if (now - goneAt.current.get(id) < 4000) continue;
        goneAt.current.delete(id);
        ids = ids.filter((x) => x !== id);
        delete col[id];
        dropPlayer(G, id);
        changed = true;
      }
      for (const id of present) {
        if (ids.includes(id) || ids.length >= ROOM_MAX) continue;
        const m = metasRef.current[id];
        if (!m) continue;
        const used = new Set(Object.values(col));
        let slot = 0;
        while (used.has(slot) && slot < 9) slot += 1;
        ids.push(id);
        col[id] = slot;
        nm[id] = firstName(m.n);
        addPlayer(G, id, nm[id], SLOT_KEYS[slot]);
        changed = true;
      }
      if (changed) applyRoster({ ids, nm, col, sent: now });
      if (changed || now - (R.sent || 0) > 5000) {
        if (!changed) rosterRef.current = { ...R, sent: now };
        mesh.send('ro', { h: myId, ids, nm, col, seed: G.seed, since: sinceRef.current });
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [isRoom]);

  useEffect(() => {
    if (isSolo || isRoom) return undefined;
    const pv = setInterval(() => {
      const N = netRef.current;
      N.n += 1;
      relay.send('pi', { n: N.n, t0: Date.now() });
      const quiet = N.last ? Date.now() - N.last : 0;
      const live = relay.here !== false;
      const weak = live && N.last > 0 && quiet > 3200, lost = live && N.last > 0 && quiet > 9000;
      const v = `${N.ping}|${weak}|${lost}`;
      if (v !== N.view) { N.view = v; setNetView({ ping: N.ping, weak, lost }); }
    }, 1500);
    return () => clearInterval(pv);
  }, [isSolo, relay.here]);
  useEffect(() => {
    if (isSolo || isRoom) return;
    if (here && phase === 'lobby') { setPhase('menu'); if (host) relay.send('gready', { sc: scoreRef.current }); }
  }, [here, phase]);
  useEffect(() => {
    if (!isDuel || phase !== 'lobby' || here || !onPeerAway) return undefined;
    const t = setTimeout(() => { if (phaseRef.current === 'lobby') onPeerAway(initial); }, 2500);
    return () => clearTimeout(t);
  }, [phase, here]);

  const leave = () => { if (phase === 'play' && isDuel) { setLeaveAsk(true); return; } finish(); };
  const finish = () => {
    if (isDuel) {
      relay.send('bye', {});
      const sc = scoreRef.current;
      if (host && onSaveState && initial) onSaveState({ ...initial, st: sc.x + sc.o > 0 ? 'done' : 'gone', sx: sc.x, so: sc.o, w: sc.x > sc.o ? 'x' : sc.o > sc.x ? 'o' : 'd' });
    }
    Sfx.stopAll();
    onClose();
  };
  const toMenu = () => { levelRef.current = null; GR.current = null; setPaused(false); setResult(null); setPhase('menu'); Sfx.stopAll(); };
  useBackClose(true, () => {
    if (ctl) setCtl(false);
    else if (quick) setQuick(false);
    else if (sheet) setSheet(null);
    else if (leaveAsk) setLeaveAsk(false);
    else if (paused) setPaused(false);
    else if (phase === 'play' && isSolo) setPaused(true);
    else if (isSolo && phase === 'over') toMenu();
    else leave();
  });

  useEffect(() => {
    const kd = (e) => {
      const k = e.key.toLowerCase();
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k)) { keys.current.add(k); e.preventDefault(); }
      if (k === ' ' || k === 'shift') { skillReq.current = 'dash'; e.preventDefault(); }
      if (k === 'e') skillReq.current = 'suck';
      if (k === 'q') skillReq.current = 'shield';
      if (k === 'r') skillReq.current = 'shock';
      if (k === 'f') skillReq.current = 'frenzy';
    };
    const ku = (e) => keys.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, []);

  const sendGE = (G, e) => {
    if (isRoom) { if (hostRef.current && hostRef.current !== myId) mesh.sendTo(hostRef.current, 'ge', { seed: G.seed, e }); }
    else relay.send('ge', { seed: G.seed, e });
  };
  const sendRoomSnaps = (G) => {
    const now = Date.now();
    const ids = rosterRef.current.ids;
    const n = Math.max(1, ids.length - 1);
    const fastMs = n <= 2 ? 115 : n <= 5 ? 145 : 175;
    for (const id of ids) {
      if (id === myId) continue;
      const q = G.pl[id];
      if (!q) continue;
      const every = linksRef.current[id] === 'p2p' ? fastMs : 360;
      if (now - (snapAt.current.get(id) || 0) < every) continue;
      snapAt.current.set(id, now);
      const s = snap(G, [{ x: q.x, y: q.y, R: viewOf(q.n) * 1.7 }], id);
      s.all = 1;
      mesh.sendTo(id, 'gs', { seed: G.seed, s });
    }
  };
  const checkLevel = (G) => {
    const Lv = levelRef.current;
    const p = G.pl.sun;
    if (!Lv || !p || G.over) return null;
    Lv.combo = Math.max(Lv.combo, p.combo || 0);
    const pr = goalProgress(Lv.L, { n: p.n, eaten: p.eaten, picks: Lv.picks, combo: Lv.combo, time: G.t, chests: p.chests || 0, golds: p.golds || 0 });
    if (pr.cur >= pr.need) G.over = { w: 'sun', why: 'goal' };
    else if (Lv.L.limit && G.t >= Lv.L.limit) G.over = { w: null, why: 'time' };
    return pr;
  };

  const checkMissions = (G) => {
    const M = missRef.current;
    const p = G.pl.sun;
    if (!M || !p || G.over) return;
    const st = { picks: M.picks, t: G.t };
    for (let i = 0; i < M.list.length; i++) {
      const m = M.list[i];
      if (!m.doneAt) {
        m.cur = missionProgress(m, p, st);
        if (m.cur >= m.v) {
          m.doneAt = G.t;
          const rw = REWARDS[M.done % REWARDS.length];
          M.done += 1;
          if (rw.k === 'life') p.lives = Math.min(p.maxLives || LIVES, p.lives + 1);
          else if (rw.k === 'double') p.fx.double = Math.max(p.fx.double, 10);
          else if (rw.k === 'shield') p.fx.shield = Math.max(p.fx.shield, 8);
          else p.fx.magnet = Math.max(p.fx.magnet, 10);
          showBanner({ title: 'Mission done', sub: rw.text }, 2.6);
          Sfx.play('star', { vol: 0.75 });
        }
      } else if (G.t - m.doneAt > 1.6) {
        const nm = pickMission(M.list, p, st);
        nm.id = ++M.seq; nm.cur = missionProgress(nm, p, st);
        M.list[i] = nm;
      }
    }
  };

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const loop = (ts) => {
      raf = requestAnimationFrame(loop);
      const rawDt = (ts - last) / 1000;
      if (rawDt < 0.0155 && acc < 0.0155) { acc += Math.max(0, rawDt); last = ts; if (acc < 0.0155) return; }
      const dt = Math.min(0.05, Math.max(0, rawDt + acc));
      acc = 0;
      last = ts;
      const t0 = performance.now();
      const ph = phaseRef.current;
      const demo = ph !== 'play' && ph !== 'over';
      const G = demo ? demoRef.current : GR.current;
      const cv = cvRef.current;
      if (!G || !cv) return;
      const wrap = wrapRef.current;
      const cw = wrap ? wrap.clientWidth : window.innerWidth, ch = wrap ? wrap.clientHeight : window.innerHeight;
      const B = budget.current;
      const dpr = maxDpr(B.low);
      if (cv.width !== Math.round(cw * dpr) || cv.height !== Math.round(ch * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); }
      if (demo) {
        hostStep(G, dt, { local: new Set(), inputs: {} });
        const d = G.pl.demo;
        const C = cam.current;
        const s = Math.min(cw, ch * 0.62) / viewOf(40);
        C.x += (d.x - C.x) * 0.05; C.y += (d.y - C.y) * 0.05;
        const ox = Math.round(cw / 2 - C.x * s), oy = Math.round(ch / 2 - C.y * s);
        updateParts(partsRef.current, dt);
        render(cv.getContext('2d'), G, { cw, ch, dpr, s, ox, oy, mine: 'demo', names: {}, bubbles: {}, parts: partsRef.current, hidden: null, noArrows: true });
        return;
      }
      const H = amHost();
      const hold = isSolo && pausedRef.current;
      const playing = ph === 'play' && !G.over && !hold;
      let ix = J.joy.current.x, iy = J.joy.current.y;
      const K = keys.current;
      const kx = (K.has('arrowright') || K.has('d') ? 1 : 0) - (K.has('arrowleft') || K.has('a') ? 1 : 0);
      const ky = (K.has('arrowdown') || K.has('s') ? 1 : 0) - (K.has('arrowup') || K.has('w') ? 1 : 0);
      if (kx || ky) { const l = Math.hypot(kx, ky); ix = kx / l; iy = ky / l; }
      if (sheetOpen.current && !isSolo) { ix = 0; iy = 0; }
      const skill = playing ? skillReq.current : null;
      skillReq.current = null;
      const input = { x: ix, y: iy, skill };
      const meP = isWatch ? G.pl[followRef.current] : G.pl[mine];
      const wasDash = meP && meP.dashT > 0;
      const step = hold ? 0 : dt;
      let goal = null;
      if (isWatch) {
        for (const k of ['sun', 'moon']) if (G.pl[k]) followNet(G.pl[k], dt);
        guestFollow(G, dt);
        for (const k of G.order) { const q = G.pl[k]; if (q && q.dead > 0) q.dead = Math.max(0.001, q.dead - dt); }
      } else if (H) {
        for (const k of G.order) if (k !== mine && G.pl[k] && !G.pl[k].bot) followNet(G.pl[k], step);
        const inputs = { [mine]: input };
        if (isSolo) for (const k of G.order) if (G.pl[k] && G.pl[k].bot) inputs[k] = botInput(G, G.pl[k], step);
        const local = new Set(isSolo ? G.order : [mine]);
        if (playing) hostStep(G, step, { local, inputs });
        else if (step > 0) { G.t += step * 0.2; for (const f of G.fish) { f.x += Math.cos(f.a) * 0.2 * step; } }
        while (G.events.length) handleEv(G, G.events.shift(), false);
        if (levelRef.current) goal = checkLevel(G);
        else if (missRef.current) checkMissions(G);
        if (G.over && !overRef.current) finishRound(G);
        if (isDuel && (!G.overAt || Date.now() - G.overAt < 3000)) {
          const now = Date.now();
          if (now - sendT.current.s > 120) {
            sendT.current.s = now;
            const o = G.pl[theirs];
            const views = o ? [{ x: o.x, y: o.y, R: viewOf(o.n) * 1.7 }] : null;
            if (views && watchersRef.current.length && meP) views.push({ x: meP.x, y: meP.y, R: viewOf(meP.n) * 1.7 });
            relay.send('gs', { seed: G.seed, s: snap(G, views), sc: G.sc || scoreRef.current });
          }
        }
        if (isRoom) sendRoomSnaps(G);
      } else {
        for (const k of G.order) if (k !== mine && G.pl[k]) followNet(G.pl[k], dt);
        guestFollow(G, dt);
        for (const k of G.order) { const q = G.pl[k]; if (q && q.dead > 0) q.dead = Math.max(0.001, q.dead - dt); }
        if (meP && meP.respawned) { meP.respawned = false; cam.current.init = false; }
        if (meP && playing) {
          if (skill && useSkill(G, meP, skill)) sendGE(G, { k: 'skill', s: skill });
          movePlayer(G, meP, input, dt);
          tickPlayer(meP, dt);
          if (meP.dead <= 0 && !meP.out) {
            const now = Date.now();
            for (const f of G.fish) {
              if (hiddenRef.current.has(f.id) || !canEat(meP, f)) continue;
              hiddenRef.current.set(f.id, now);
              const gain = eatGain(meP, f);
              pendRef.current.push({ id: f.id, gain, at: now });
              sendGE(G, { k: 'eat', id: f.id, slack: Math.ceil(gain * 0.2) });
              meP.eat = 0.3;
              handleEv(G, { k: 'eat', who: mine, gain, x: f.x, y: f.y, sp: f.sp, pv: f.pv, n: f.n, gold: f.gold ? 1 : 0, c: 0, big: f.n > meP.n * 0.35 ? 1 : 0 }, false);
            }
            for (const ch of G.chests || []) {
              const hk = `c${ch.id}`;
              if (hiddenRef.current.has(hk) || !canOpen(meP, ch)) continue;
              hiddenRef.current.set(hk, now);
              ch.cool = 45;
              const gain = chestGain(meP);
              pendRef.current.push({ id: hk, gain, at: now });
              sendGE(G, { k: 'chest', id: ch.id });
              handleEv(G, { k: 'chest', who: mine, id: ch.id, gain, x: ch.x, y: ch.y }, false);
            }
            for (const pk of G.pk) {
              if (hiddenRef.current.has(pk.id) || !canTake(meP, pk)) continue;
              hiddenRef.current.set(pk.id, now);
              sendGE(G, { k: 'pick', id: pk.id });
              handleEv(G, { k: 'pick', who: mine, kind: pk.k, x: pk.x, y: pk.y }, false);
            }
          }
          if (meP.hostN) meP.n = meP.hostN + pendRef.current.reduce((a, q) => a + q.gain, 0);
        }
        G.pk = G.pk.filter((pk) => !hiddenRef.current.has(pk.id));
      }
      if (!meP) {
        const fk = isRoom ? (G.pl[hostRef.current] ? hostRef.current : G.order[0]) : null;
        const fp = fk ? G.pl[fk] : null;
        if (!fp) return;
        const s0 = (cw > ch ? Math.min(cw * 0.5, ch * 0.76) : Math.min(cw, ch * 0.62)) / viewOf(fp.n);
        updateParts(partsRef.current, dt);
        render(cv.getContext('2d'), G, { cw, ch, dpr, s: s0, ox: Math.round(cw / 2 - fp.x * s0), oy: Math.round(ch / 2 - fp.y * s0), mine: fk, names: names(), bubbles: bubblesRef.current, parts: partsRef.current, hidden: null, noArrows: true, mics: micsRef.current });
        return;
      }
      if (!wasDash && meP.dashT > 0) { Sfx.play('dash', { vol: 0.7 }); bubbles(partsRef.current, meP.x - Math.cos(meP.a) * rOf(meP.n), meP.y - Math.sin(meP.a) * rOf(meP.n), 7, rOf(meP.n) * 0.25 + 0.06); }
      if (skill === 'suck' && meP.fx.suck > 0.9) { Sfx.play('suck', { vol: 0.7 }); Sfx.play('slurp', { vol: 0.8 }); }
      if (skill === 'shield' && meP.fx.shield > 0) Sfx.play('shield', { vol: 0.7 });
      if (skill === 'shock' && meP.cd.shock > 0) { Sfx.play('shock', { vol: 0.9 }); ring(partsRef.current, meP.x, meP.y, rOf(meP.n) * 6 + 4, '#FFE15A'); cam.current.shake = 0.35; }
      if (skill === 'frenzy' && meP.fx.frenzy > 0) Sfx.play('skill', { vol: 0.8 });
      if (isDuel || isRoom) {
        const now = Date.now();
        if (now - sendT.current.p > 70) {
          sendT.current.p = now;
          const pos = { k: mine, x: +meP.x.toFixed(2), y: +meP.y.toFixed(2), vx: +meP.vx.toFixed(2), vy: +meP.vy.toFixed(2), a: +meP.a.toFixed(2), tp: meP.tp, dash: meP.dashT > 0.25 ? 1 : 0 };
          if (isRoom) mesh.send('gp', pos, { every: 240 }); else relay.send('gp', pos);
        }
      }
      updateParts(partsRef.current, step);
      for (const k of Object.keys(bubblesRef.current)) { const b = bubblesRef.current[k]; if (b) { b.t += dt; if (b.t > b.life) bubblesRef.current[k] = null; } }
      if (Math.random() < step * 2.5 && meP.dead <= 0 && Math.hypot(meP.vx, meP.vy) > 1) bubbles(partsRef.current, meP.x - Math.cos(meP.a) * rOf(meP.n) * 1.1, meP.y, 1, rOf(meP.n) * 0.15 + 0.05);
      if (playing && Math.random() < step * 0.4) Sfx.play(['bub1', 'bub2', 'bub3', 'bub4'][Math.floor(Math.random() * 4)], { vol: 0.12 + Math.random() * 0.1, rate: 0.8 + Math.random() * 0.5 });
      const C = cam.current;
      const V = viewOf(meP.n);
      const base = cw > ch ? Math.min(cw * 0.5, ch * 0.76) : Math.min(cw, ch * 0.62);
      const zoom = base / V;
      const lead = 0.12 * V;
      const tx = meP.x + Math.cos(meP.a) * lead * Math.min(1, Math.hypot(meP.vx, meP.vy) / 3), ty = meP.y + Math.sin(meP.a) * lead * 0.6 * Math.min(1, Math.hypot(meP.vx, meP.vy) / 3);
      if (!C.init) { C.x = tx; C.y = ty; C.z = zoom; C.init = true; }
      const k1 = 1 - Math.exp(-dt * 4.5);
      C.x += (tx - C.x) * k1; C.y += (ty - C.y) * k1; C.z += (zoom - C.z) * (1 - Math.exp(-dt * 1.6));
      const s = C.z;
      const halfW = cw / s / 2, halfH = ch / s / 2;
      let cx = WW <= halfW * 2 ? WW / 2 : clamp(C.x, halfW, WW - halfW);
      let cy = clamp(C.y, halfH - 3, Math.max(halfH - 3, WH - halfH + 1));
      if (C.shake > 0) { C.shake = Math.max(0, C.shake - dt); const a = C.shake * 0.4; cx += (Math.random() - 0.5) * a; cy += (Math.random() - 0.5) * a; }
      const ox = Math.round(cw / 2 - cx * s), oy = Math.round(ch / 2 - cy * s);
      const KR = keepRef.current;
      const kNow = performance.now();
      if (kNow - KR.at > 400) {
        KR.at = kNow; KR.list = [];
        const R = hudRefs.current;
        for (const k of ['tl', 'tc', 'tr', 'sc']) { const el = R[k]; if (el && el.offsetWidth) KR.list.push([el.offsetLeft, el.offsetTop, el.offsetLeft + el.offsetWidth, el.offsetTop + el.offsetHeight]); }
        const sk = R.sk;
        if (sk && sk.offsetWidth) { const q = lookNow.current.size || 1; const x1 = sk.offsetLeft + sk.offsetWidth, y1 = sk.offsetTop + sk.offsetHeight; KR.list.push([x1 - sk.offsetWidth * q, y1 - sk.offsetHeight * q * 0.8, x1, y1]); }
        if (!isWatch && phaseRef.current === 'play') { const jr = J.R + 12, jx = cw > ch ? 116 : 96, jy = ch - (cw > ch ? 98 : 132); KR.list.push([jx - jr, jy - jr, jx + jr, jy + jr]); }
      }
      render(cv.getContext('2d'), G, { cw, ch, dpr, s, ox, oy, mine: isWatch ? followRef.current : mine, names: names(), bubbles: bubblesRef.current, parts: partsRef.current, hidden: H ? null : hiddenRef.current, safeTop: 28, safeBottom: 28, keep: KR.list, mics: micsRef.current });
      const mc = miniRef.current;
      if (mc) { const md = Math.min(2, window.devicePixelRatio || 1); if (mc.width !== MINI_W * md) { mc.width = MINI_W * md; mc.height = MINI_H * md; } const x2 = mc.getContext('2d'); x2.setTransform(md, 0, 0, md, 0, 0); drawMinimap(x2, G, isWatch ? followRef.current : mine, MINI_W, MINI_H, { x: cx, y: cy, hw: halfW, hh: halfH }); }
      const otherK = isWatch ? (followRef.current === 'sun' ? 'moon' : 'sun') : isDuel ? theirs : null;
      const other = otherK ? G.pl[otherK] : null;
      const gk = goal ? goal.label : '';
      const MM = missRef.current;
      const mk = MM ? MM.list.map((m) => `${m.id}:${Math.floor(m.cur || 0)}:${m.doneAt ? 1 : 0}`).join(',') : '';
      const hk = `${otherK}|${fmtN(meP.n)}|${meP.stage}|${meP.lives}|${Math.floor(G.t)}|${SKILL_KEYS.map((k) => Math.ceil(meP.cd[k] * 2)).join(',')}|${meP.combo}|${meP.dead > 0 ? 1 : 0}|${other ? `${other.n},${other.lives},${other.out}` : ''}|${['shield', 'double', 'magnet', 'speed', 'frenzy'].map((x) => (meP.fx[x] > 0 ? Math.ceil(meP.fx[x]) : 0)).join(',')}|${gk}|${isRoom ? G.order.length : ''}|${mk}`;
      const hnow = performance.now();
      if (hk !== hudKey.current && (hnow - (hudKey.at || 0) > 90 || meP.dead > 0)) { hudKey.current = hk; hudKey.at = hnow; setHud({ n: meP.n, st: meP.stage, lives: meP.lives, time: G.t, cd: { ...meP.cd }, fx: { ...meP.fx }, combo: meP.combo, dead: meP.dead, on: other ? { n: other.n, lives: other.lives, out: other.out, k: otherK } : null, goal: goal ? { label: goal.label, frac: Math.min(1, goal.cur / Math.max(1, goal.need)) } : null, missDone: MM ? MM.done : 0, miss: MM ? MM.list.map((m) => ({ id: m.id, text: m.text, done: !!m.doneAt, label: m.doneAt ? 'Done' : missionLabel(m, m.cur || 0), frac: Math.min(1, (m.cur || 0) / Math.max(1, m.v)) })) : null }); }
      const ms = performance.now() - t0;
      B.avg = B.avg * 0.95 + ms * 0.05; B.n += 1;
      if (B.n > 120 && B.avg > 14 && !B.low) B.low = true;
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [isSolo, host]);

  const sendChat = (text) => {
    const t = String(text || '').trim().slice(0, 90);
    if (!t) return;
    bubble(mine, t);
    setLog((l) => [...l.slice(-30), { who: 'You', text: t }]);
    if (!isSolo) relay.send('chat', { text: t });
    setChatText(''); setSheet(null); setQuick(false);
    Sfx.play('pop');
  };
  const sendEmote = (e) => { bubble(mine, e, true); if (!isSolo) relay.send('emo', { e }); setQuick(false); Sfx.play('bub3', { vol: 0.6 }); };
  const toggleSfx = () => { Sfx.init(); Sfx.setSfx(!Sfx.sfxOn); setSnd({ sfx: Sfx.sfxOn, mus: Sfx.musicOn }); };
  const toggleMus = () => { Sfx.init(); Sfx.setMusic(!Sfx.musicOn); setSnd({ sfx: Sfx.sfxOn, mus: Sfx.musicOn }); };
  const play = () => { Sfx.init(); startRound(newSeed()); };
  const toggleAllow = () => { const v = !allowWatch; setAllowWatch(v); setWatchAllowed(v); kitTap(); };

  const stage = STAGES[hud.st] || STAGES[0];
  const nextSt = STAGES[hud.st + 1];
  const prog = nextSt ? clamp((Math.log(Math.max(2, hud.n)) - Math.log(Math.max(2, stage.n || 2))) / (Math.log(nextSt.n) - Math.log(Math.max(2, stage.n || 2))), 0, 1) : 1;
  const myColKey = isRoom ? SLOT_KEYS[roster.col[myId] || 0] : isWatch ? followK : mine;
  const myCol = (PLAYER_PAL[myColKey] || PLAYER_PAL.sun)[0];
  const skillsOn = SKILL_KEYS.filter((k) => SKILLS[k].stage <= hud.st);
  const fxList = [['shield', 'Shield', '#7FD4FF'], ['double', 'x2 food', '#FFD23F'], ['magnet', 'Magnet', '#FF6B8A'], ['speed', 'Speed', '#9BFF7A'], ['frenzy', 'Frenzy', '#FF9A3C']].filter(([k]) => hud.fx[k] > 0);
  const mySc = mine === 'sun' ? score.x : score.o, theirSc = mine === 'sun' ? score.o : score.x;
  const B = best.current;
  const Lv = levelRef.current;
  const sz = look.size;
  const see = 1 - look.see;
  const W = cw0, Ht = ch0;
  const { top, bottom, left, right } = GS.at;
  const showSide = (isDuel || isRoom) && phase === 'play';
  const totalStars = Object.values(lvls).reduce((a, b) => a + ((b && b.stars) || 0), 0);
  const G0 = GR.current;
  const roomCount = roster.ids.length || 1;
  const pauseOn = paused && phase === 'play';
  const hb = land ? 38 : 40;
  const heartsMax = Lv && Lv.L.lives ? Lv.L.lives : LIVES;
  const softInk = 'rgba(0,0,0,0.35)';

  const socialBtns = showSide ? [
    isRoom ? <GHudBtn key="mic" icon={mesh.mic.on ? 'mic' : 'micoff'} on={mesh.mic.on} size={hb} label={mesh.mic.on ? 'Turn your mic off' : 'Turn your mic on'} onPress={mesh.toggleMic} />
      : <GHudBtn key="mic" icon={voice.micOn ? 'mic' : 'micoff'} on={voice.micOn} size={hb} label={voice.micOn ? 'Turn your mic off' : 'Turn your mic on'} onPress={voice.toggle} />,
    isRoom ? <GHudBtn key="ppl" icon="people" on={!!(sheet && sheet.k === 'room')} tone="#F5AE1E" size={hb} label="Players and voice" badge={roomCount > 1 ? roomCount : null} onPress={() => { setQuick(false); setSheet({ k: 'room' }); }} />
      : <GHudBtn key="ppl" icon={voice.peerMuted ? 'mute' : 'sound'} on={voice.peerMuted} tone="#E53A2A" size={hb} label={voice.peerMuted ? `Unmute ${peerFirst}` : `Mute ${peerFirst}`} onPress={voice.togglePeer} />,
    <GHudBtn key="emo" icon="smile" on={quick} tone="#F5AE1E" size={hb} label="Quick messages and emojis" onPress={() => setQuick((v) => !v)} />,
    <GHudBtn key="chat" icon="chat" size={hb} label="Chat" onPress={() => { setQuick(false); setSheet({ k: 'chat' }); }} />,
  ] : [];
  const sysBtns = [
    !isWatch && <GHudBtn key="gear" icon="gear" size={hb} label="Controls" onPress={() => { setQuick(false); if (isSolo) setPaused(true); setCtl(true); }} />,
    <GHudBtn key="x" icon={isSolo ? 'pause' : 'close'} size={hb} label={isSolo ? 'Pause' : 'Leave the game'} onPress={() => (isSolo ? setPaused(true) : leave())} />,
  ].filter(Boolean);
  const rowBtns = land ? [...socialBtns, ...sysBtns] : sysBtns;
  const rowW = (n) => n * hb + Math.max(0, n - 1) * 6;
  const lEnd = 10 + (land ? MINI_W : rowW(sysBtns.length)) + 8;
  const rStart = W - 10 - (land ? rowW(rowBtns.length) : isRoom ? 84 : 40 + heartsMax * 14) - 8;
  const capW = Math.max(104, Math.min(land ? 150 : 132, rStart - lEnd));
  const capX = clamp(W / 2 - capW / 2, lEnd, Math.max(lEnd, rStart - capW));
  const armB = Math.round(12 + 200 * sz + 12);
  const tlEl = hudRefs.current.tl;
  const tlBottom = tlEl && tlEl.offsetHeight ? tlEl.offsetTop + tlEl.offsetHeight : 0;
  const oppChip = (isDuel || isWatch) && hud.on ? (
    <GHudPanel style={{ height: 24, padding: '0 9px', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 800, whiteSpace: 'nowrap' }}>
      <span style={{ width: 8, height: 8, borderRadius: 4, background: PLAYER_PAL[hud.on.k || theirs][0], flexShrink: 0 }} />
      <span>{isWatch ? (hud.on.k === 'sun' ? hostFirst : peerFirst) : peerFirst}</span>
      <span style={{ color: PLAYER_PAL[hud.on.k || theirs][2], fontVariantNumeric: 'tabular-nums' }}>{hud.on.out ? 'out' : fmtN(hud.on.n)}</span>
      <span style={{ display: 'flex', gap: 1 }}>{Array.from({ length: LIVES }, (_, i) => <GIcon key={i} k="heart" size={9} color={i < hud.on.lives ? '#FF5A6E' : 'rgba(255,255,255,0.28)'} ink={softInk} />)}</span>
    </GHudPanel>
  ) : null;
  const statusChip = isRoom
    ? <GHudPanel style={{ height: 26, padding: '0 9px', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap' }}><GIcon k="people" size={14} color="#CFE6FF" ink={softInk} />{`${roomCount} of ${ROOM_MAX}`}</GHudPanel>
    : <GHudPanel style={{ height: 26, padding: '0 9px', display: 'flex', alignItems: 'center', gap: 2, whiteSpace: 'nowrap' }}>{Array.from({ length: heartsMax }, (_, i) => <GIcon key={i} k="heart" size={12} color={i < hud.lives ? '#FF5A6E' : 'rgba(255,255,255,0.28)'} ink={softInk} />)}<span style={{ marginLeft: 6, fontSize: 12, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{fmtT(hud.time)}</span></GHudPanel>;

  const chatSheet = sheet && sheet.k === 'chat' && (
    <Sheet title={isRoom ? 'Talk to the room' : `Talk to ${peerFirst}`} onClose={() => setSheet(null)}>
      {log.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '12px 0 4px', maxHeight: 150, overflowY: 'auto' }}>
          {log.slice(-8).map((m, i) => <div key={i} style={{ fontSize: 13.5, lineHeight: 1.4 }}><span style={{ fontWeight: 800, color: m.who === 'You' ? '#FFCB7A' : '#A9CCFF' }}>{m.who}</span> <span style={{ color: 'rgba(255,255,255,0.85)' }}>{m.text}</span></div>)}
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        {PHRASES.map((p) => <button key={p} type="button" className="zgk-btn" onClick={() => { kitTap(); sendChat(p); }} style={{ height: 38, padding: '0 14px', borderRadius: 19, border: 'none', background: 'rgba(255,255,255,0.1)', color: '#FFFFFF', fontFamily: FONT, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>{p}</button>)}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); sendChat(chatText); }} style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <input value={chatText} onChange={(e) => setChatText(e.target.value)} maxLength={90} placeholder="Write a message" aria-label="Message"
          style={{ flex: 1, minWidth: 0, height: 46, borderRadius: 23, border: 'none', background: 'rgba(255,255,255,0.1)', color: '#FFFFFF', padding: '0 16px', fontSize: 16, fontFamily: FONT, outline: 'none' }} />
        <GPill text="Send" color="green" small onPress={() => sendChat(chatText)} disabled={!chatText.trim()} />
      </form>
    </Sheet>
  );

  return (
    <Portal>
      <div ref={rootRef} style={{ position: 'fixed', left: 0, right: 0, top: 'var(--zvp-top, 0px)', height: 'var(--zvp-h, 100%)', zIndex: 90, background: '#0A2A4A', overflow: 'hidden', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', fontFamily: FONT, color: '#FFFFFF' }}>
        <div ref={wrapRef} {...J.handlers} data-side={side ? '1' : '0'}
          style={GS.wrapStyle}>
          <canvas ref={cvRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />

          {phase === 'play' && (
            <>
              <div ref={hudRef('tl')} style={{ position: 'absolute', left: left(10), top: top(8), display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start', zIndex: 3, pointerEvents: 'none' }}>
                {!land && <div style={{ display: 'flex', gap: 6, pointerEvents: 'auto' }}>{sysBtns}</div>}
                <canvas ref={miniRef} aria-hidden="true" style={{ width: MINI_W, height: MINI_H, display: 'block', borderRadius: 7, boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }} />
                {hud.goal && Lv && (
                  <GHudPanel style={{ width: MINI_W, boxSizing: 'border-box', padding: '6px 9px 7px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 800, lineHeight: 1.25 }}>{hud.goal.label}</span>
                    <span style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.18)', overflow: 'hidden' }}><span style={{ display: 'block', width: `${hud.goal.frac * 100}%`, height: '100%', background: '#5BE37D', transition: 'width 0.3s' }} /></span>
                    {Lv.L.limit ? <span style={{ fontSize: 11, fontWeight: 800, color: Lv.L.limit - hud.time < 15 ? '#FF8F8F' : 'rgba(255,255,255,0.75)', fontVariantNumeric: 'tabular-nums' }}>{`${fmtT(Math.max(0, Lv.L.limit - hud.time))} left`}</span> : null}
                  </GHudPanel>
                )}
                {hud.miss && (
                  <GHudPanel style={{ width: MINI_W, boxSizing: 'border-box', padding: '6px 9px 8px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 10.5, fontWeight: 900, color: 'rgba(255,255,255,0.62)' }}>
                      <span>Missions</span>
                      {hud.missDone > 0 && <span style={{ color: '#7BE05A', fontVariantNumeric: 'tabular-nums' }}>{`${hud.missDone} done`}</span>}
                    </div>
                    {hud.miss.map((m) => (
                      <div key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: 3, animation: 'zgk-in 0.3s ease-out' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: 6, flexShrink: 0, background: m.done ? '#5BE37D' : 'transparent', boxShadow: m.done ? 'none' : 'inset 0 0 0 1.5px rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{m.done && <GIcon k="check" size={9} color="#FFFFFF" ink="rgba(0,0,0,0.2)" stroke={3} />}</span>
                          <span style={{ flex: 1, minWidth: 0, fontSize: 11.5, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: m.done ? '#B9F5C6' : '#FFFFFF' }}>{m.text}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 18 }}>
                          <span style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.16)', overflow: 'hidden' }}><span style={{ display: 'block', width: `${m.frac * 100}%`, height: '100%', background: m.done ? '#5BE37D' : '#FFD23F', transition: 'width 0.3s' }} /></span>
                          <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.7)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{m.label}</span>
                        </div>
                      </div>
                    ))}
                  </GHudPanel>
                )}
                {isRoom && feed.length > 0 && (
                  <div aria-live="polite" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {feed.map((f) => (
                      <GHudPanel key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 9px', fontSize: 11.5, fontWeight: 800, animation: 'zgk-in 0.25s ease-out', maxWidth: MINI_W, boxSizing: 'border-box' }}>
                        <span style={{ width: 7, height: 7, borderRadius: 4, background: f.kind === 'in' ? '#5BE37D' : '#9AA3B5', flexShrink: 0 }} />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.text}</span>
                      </GHudPanel>
                    ))}
                  </div>
                )}
                {!isWatch && !isRoom && watchers.length > 0 && <GHudPanel style={{ height: 24, padding: '0 9px', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 800, whiteSpace: 'nowrap' }}><GIcon k="eye" size={13} color="#CFE6FF" ink={softInk} />{watchers.length === 1 ? `${watchers[0].n} is watching` : `${watchers.length} watching`}</GHudPanel>}
              </div>
              <div ref={hudRef('tc')} style={{ position: 'absolute', left: capX, top: top(8), width: capW, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, pointerEvents: 'none', zIndex: 2 }}>
                <GHudPanel style={{ width: '100%', boxSizing: 'border-box', padding: '4px 10px 6px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 6 }}>
                    <span style={{ fontSize: 19, fontWeight: 900, color: myCol, fontVariantNumeric: 'tabular-nums', lineHeight: 1.15, textShadow: '0 1px 3px rgba(0,0,0,0.55)' }}>{fmtN(hud.n)}</span>
                    <span style={{ minWidth: 0, fontSize: 10.5, fontWeight: 800, color: 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stage.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.16)', overflow: 'hidden' }}><span style={{ display: 'block', width: `${prog * 100}%`, height: '100%', background: myCol, transition: 'width 0.3s' }} /></span>
                    {nextSt && <span style={{ fontSize: 9.5, fontWeight: 900, color: 'rgba(255,255,255,0.65)', fontVariantNumeric: 'tabular-nums' }}>{fmtN(nextSt.n)}</span>}
                  </div>
                </GHudPanel>
                {land && oppChip}
              </div>
              <div ref={hudRef('tr')} style={{ position: 'absolute', right: right(10), top: top(8), display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, zIndex: 3, pointerEvents: 'none' }}>
                {land && <div style={{ display: 'flex', gap: 6, pointerEvents: 'auto' }}>{rowBtns}</div>}
                {statusChip}
                {!land && oppChip}
                {isDuel && <PingChip ms={net.ping} weak={net.weak} />}
                {fxList.map(([k, label, col]) => <GHudPanel key={k} style={{ height: 22, padding: '0 8px', display: 'flex', alignItems: 'center', fontSize: 11, fontWeight: 900, color: col, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{`${label} ${Math.ceil(hud.fx[k])}`}</GHudPanel>)}
              </div>
              {!land && socialBtns.length > 0 && <div ref={hudRef('sc')} style={{ position: 'absolute', right: right(16), bottom: bottom(armB), display: 'flex', flexDirection: 'column', gap: 8, zIndex: 3 }}>{socialBtns}</div>}
              {toast && (
                <div key={`t${toast.at}`} style={{ position: 'absolute', left: '50%', ...(land ? { bottom: bottom(16) } : { top: tlBottom ? tlBottom + 10 : top(224) }), transform: 'translateX(-50%)', maxWidth: land ? 'min(44%, 360px)' : 'min(80%, 340px)', width: 'max-content', pointerEvents: 'none', animation: 'zduo-toast 0.25s ease-out', zIndex: 4 }}>
                  <GHudPanel style={{ padding: '7px 12px', fontSize: 12.5, fontWeight: 800, lineHeight: 1.35, textAlign: 'center' }}>{toast.text}</GHudPanel>
                </div>
              )}
              {banner && (
                <div key={`b${banner.at}`} style={{ position: 'absolute', left: 0, right: 0, top: land ? '23%' : '32%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, pointerEvents: 'none', animation: 'zgk-pop 0.4s ease-out' }}>
                  <GTitle text={banner.title} size={land ? 24 : 26} color="#FFE15A" style={{ textAlign: 'center', padding: '0 20px' }} />
                  <GChip style={{ fontSize: 13.5 }}>{banner.sub}</GChip>
                </div>
              )}
              {deathMsg && (
                <div key={`d${deathMsg.at}`} style={{ position: 'absolute', left: 0, right: 0, top: land ? '34%' : '38%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, pointerEvents: 'none', animation: 'zgk-pop 0.35s ease-out' }}>
                  <GTitle text={deathMsg.text} size={land ? 22 : 24} color="#FF8F8F" style={{ textAlign: 'center', padding: '0 20px' }} />
                  <GChip>{isRoom ? 'You come back a bit smaller.' : hud.lives > 0 ? `${hud.lives} ${hud.lives === 1 ? 'life' : 'lives'} left. You come back smaller.` : 'No lives left'}</GChip>
                </div>
              )}
              {isDuel && net.lost && (
                <div style={{ position: 'absolute', left: '50%', top: '46%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}>
                  <GPanel style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}><Spinner size={18} color="#FFFFFF" /><span style={{ fontSize: 13.5, fontWeight: 800 }}>{`Waiting for ${peerFirst}'s connection`}</span></GPanel>
                </div>
              )}
              {isRoom && G0 && !G0.pl[mine] && (
                <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}>
                  <GPanel style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}><Spinner size={18} color="#FFFFFF" /><span style={{ fontSize: 13.5, fontWeight: 800 }}>Diving in</span></GPanel>
                </div>
              )}
              {isWatch && (
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: bottom(18), display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '0 14px', flexWrap: 'wrap' }}>
                  <GHudPanel style={{ height: 32, padding: '0 11px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 800 }}><GIcon k="eye" size={14} color="#CFE6FF" ink={softInk} />Follow</GHudPanel>
                  <GPill small text={hostFirst} color={followK === 'sun' ? 'orange' : 'white'} height={40} onPress={() => { setFollowK('sun'); cam.current.init = false; }} />
                  <GPill small text={peerFirst} color={followK === 'moon' ? 'blue' : 'white'} height={40} onPress={() => { setFollowK('moon'); cam.current.init = false; }} />
                </div>
              )}
              {!isWatch && <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: see }}><GJoy flat view={J.view} knobRef={J.knob} color={JOY_COL[myColKey] || 'orange'} idle={{ x: land ? 116 : 96, y: Ht - (land ? 98 : 132) }} R={J.R} /></div>}
              {!isWatch && (
                <div ref={hudRef('sk')} style={{ position: 'absolute', right: right(14), bottom: bottom(12), width: 230, height: 200, pointerEvents: 'none', transform: `scale(${sz})`, transformOrigin: '100% 100%', opacity: see, zIndex: 2 }}>
                  {skillsOn.map((k) => {
                    const main = k === 'dash';
                    const s = main ? 72 : 52;
                    const [x, y] = skillAt(k);
                    return (
                      <div key={k} style={{ position: 'absolute', left: x, top: y, pointerEvents: 'auto', animation: 'zgk-pop 0.35s ease-out' }}>
                        <GHudSkill icon={SKILL_ICON[k]} tone={GC[SKILL_COL[k]][0]} main={main} size={s} label={SKILLS[k].name} cool={hud.cd[k] || 0} coolMax={SKILLS[k].cd} sound={main ? 'click' : 'pop'} onPress={() => { skillReq.current = k; }} />
                      </div>
                    );
                  })}
                </div>
              )}
              {quick && !isSolo && (
                <div onPointerDown={(e) => e.stopPropagation()} style={land ? { position: 'absolute', right: right(10), top: top(8 + hb + 8), width: 'min(300px, calc(100% - 40px))', animation: 'zgk-pop 0.2s ease-out', zIndex: 6 } : { position: 'absolute', right: right(16 + hb + 10), bottom: bottom(armB), width: 'min(280px, calc(100% - 90px))', animation: 'zgk-pop 0.2s ease-out', zIndex: 6 }}>
                  <GPanel style={{ padding: 10 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 6 }}>
                      {EMOTES.map((e) => <button key={e} type="button" className="zgk-btn" aria-label={`Send ${e}`} {...pressProps(() => sendEmote(e))} style={{ height: 42, borderRadius: 14, border: 'none', background: 'rgba(255,255,255,0.1)', fontSize: 24, cursor: 'pointer' }}>{e}</button>)}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                      {QUICK.map((p) => <button key={p} type="button" className="zgk-btn" {...pressProps(() => { kitTap(); sendChat(p); })} style={{ height: 32, padding: '0 11px', borderRadius: 16, border: 'none', background: 'rgba(255,255,255,0.12)', color: '#FFFFFF', fontFamily: FONT, fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>{p}</button>)}
                      <button type="button" className="zgk-btn" {...pressProps(() => { kitTap(); setQuick(false); setSheet({ k: 'chat' }); })} style={{ height: 32, padding: '0 11px', borderRadius: 16, border: 'none', background: 'rgba(255,255,255,0.22)', color: '#FFFFFF', fontFamily: FONT, fontSize: 12.5, fontWeight: 900, cursor: 'pointer' }}>Type a message</button>
                    </div>
                  </GPanel>
                </div>
              )}
              {(voice.err || mesh.mic.err) && <div style={{ position: 'absolute', left: '50%', top: '22%', transform: 'translateX(-50%)', pointerEvents: 'none' }}><GChip style={{ background: 'rgba(217,75,75,0.95)' }}>{voice.err || mesh.mic.err}</GChip></div>}
            </>
          )}

          {phase === 'join' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 20, background: 'rgba(4,20,44,0.45)' }}>
              <div style={{ position: 'absolute', left: left(12), top: top(10) }}><GBtn icon="close" color="white" size={44} fast={false} label="Leave" onPress={finish} /></div>
              <GTitle text="Gulp room" size={44} color="#FFE15A" />
              <GPanel style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}><Spinner size={18} color="#FFFFFF" /><span style={{ fontSize: 14.5, fontWeight: 800 }}>Finding your friends</span></GPanel>
            </div>
          )}

          {(phase === 'menu' || phase === 'lobby') && (
            <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', touchAction: 'pan-y', padding: `${top(14)} ${right(16)} ${bottom(22)} ${left(16)}`, boxSizing: 'border-box', background: 'linear-gradient(180deg, rgba(4,30,60,0.15) 0%, rgba(4,30,60,0) 30%, rgba(4,20,44,0.55) 100%)' }}>
              <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <GBtn icon="close" color="white" size={44} fast={false} label={isSolo ? 'Leave' : 'Back to chat'} onPress={finish} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <GBtn icon="gear" color="dark" size={44} fast={false} label="Controls" onPress={() => setCtl(true)} />
                    <GBtn icon={snd.mus ? 'music' : 'mute'} color={snd.mus ? 'purple' : 'dark'} size={44} fast={false} label={snd.mus ? 'Turn music off' : 'Turn music on'} onPress={toggleMus} />
                    <GBtn icon={snd.sfx ? 'sound' : 'mute'} color={snd.sfx ? 'blue' : 'dark'} size={44} fast={false} label={snd.sfx ? 'Turn sounds off' : 'Turn sounds on'} onPress={toggleSfx} />
                  </div>
                </div>
                <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: land ? 'row' : 'column', alignItems: 'center', justifyContent: land ? 'center' : 'flex-start', gap: land ? 28 : 0 }}>
                  <div style={{ marginTop: land ? 0 : '8vh', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, animation: 'zgk-pop 0.5s ease-out' }}>
                    <div style={{ animation: 'zgk-bob 3s ease-in-out infinite' }}><GTitle text="Gulp" size={land ? 64 : 78} color="#FFE15A" /></div>
                    <GChip style={{ fontSize: 14 }}>Eat smaller fish. Grow forever.</GChip>
                  </div>
                  {!land && <div style={{ flex: 1, minHeight: 24 }} />}
                  <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 12, animation: 'zgk-in 0.45s ease-out', paddingTop: land ? 10 : 0 }}>
                    <GPanel style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <FishBadge color={mine === 'none' ? 'sun' : mine} stage={B.top ? stageOf(B.top) : 0} size={66} />
                      <div style={{ flex: 1, minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, textAlign: 'center' }}>
                        {[['Biggest', B.top ? fmtN(B.top) : 'None yet'], isSolo ? ['Stars', `${totalStars} of ${GULP_LEVELS.length * 3}`] : ['Longest', B.time ? fmtT(B.time) : 'None'], ['Fish eaten', B.eaten ? fmtN(B.eaten) : '0']].map(([a, v]) => (
                          <div key={a} style={{ minWidth: 0 }}><div style={{ fontSize: 17, fontWeight: 900, color: '#FFE15A', fontVariantNumeric: 'tabular-nums', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</div><div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>{a}</div></div>
                        ))}
                      </div>
                    </GPanel>
                    {isDuel && (
                      <GPanel style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar emoji={me && me.avatar} name={(me && me.name) || 'You'} size={40} />
                        <div style={{ fontSize: 14, fontWeight: 900, flex: 1, minWidth: 0 }}>{`You ${mySc} : ${theirSc} ${peerFirst}`}</div>
                        <Avatar emoji={peer && peer.avatar} name={(peer && peer.name) || 'Friend'} size={40} />
                        <span style={{ width: 10, height: 10, borderRadius: 5, background: here ? '#3DDC84' : '#8E8A9E', boxShadow: `0 0 0 2px ${INK}` }} />
                      </GPanel>
                    )}
                    {isDuel && (
                      <GPanel style={{ padding: '10px 14px' }}>
                        <div role="switch" aria-checked={allowWatch} tabIndex={0} onClick={toggleAllow} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                          <GIcon k="eye" size={20} color="#CFE6FF" />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 900 }}>Let friends watch</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{watchers.length ? `Watching now: ${watchers.map((w) => w.n).join(', ')}` : 'Friends can watch your rounds live'}</div>
                          </div>
                          <Toggle on={allowWatch} />
                        </div>
                      </GPanel>
                    )}
                    {isWatch ? <GPanel style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}><GIcon k="eye" size={20} color="#CFE6FF" /><span style={{ fontSize: 14.5, fontWeight: 800 }}>{`Watching ${hostFirst} and ${peerFirst}. The round starts soon.`}</span></GPanel>
                      : isSolo ? (
                        <div style={{ display: 'flex', gap: 10 }}>
                          <GPill text="Levels" icon="map" color="blue" height={58} onPress={() => setSheet({ k: 'levels' })} style={{ flex: 1 }} wide />
                          <GPill text="Endless" icon="play" color="green" height={58} onPress={play} style={{ flex: 1 }} wide />
                        </div>
                      )
                      : phase === 'lobby' || !here ? <GPanel style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}><Spinner size={18} color="#FFFFFF" /><span style={{ fontSize: 14.5, fontWeight: 800 }}>{`Waiting for ${peerFirst} to open the game`}</span></GPanel>
                      : host ? <GPill text="Start" icon="play" color="green" wide height={62} onPress={play} />
                      : <GPanel style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}><Spinner size={18} color="#FFFFFF" /><span style={{ fontSize: 14.5, fontWeight: 800 }}>{`${peerFirst} starts the round`}</span></GPanel>}
                    <GPill text="How to play" color="white" small onPress={() => setSheet({ k: 'how' })} wide />
                  </div>
                </div>
              </div>
            </div>
          )}

          {pauseOn && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 20, background: 'rgba(2,10,22,0.55)', display: 'flex', padding: 12, overflowY: 'auto', touchAction: 'pan-y' }}>
              <GPanel style={{ margin: 'auto', width: '100%', maxWidth: 330, padding: land ? '12px 16px' : '18px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: land ? 9 : 12, animation: 'zgk-pop 0.3s ease-out' }}>
                <GTitle text="Paused" size={34} />
                <GPill text="Resume" icon="play" color="green" wide onPress={() => setPaused(false)} />
                <div style={{ display: 'flex', gap: 10 }}>
                  <GBtn icon="gear" color="dark" size={52} fast={false} label="Controls" onPress={() => setCtl(true)} />
                  <GBtn icon={snd.mus ? 'music' : 'mute'} color={snd.mus ? 'purple' : 'dark'} size={52} fast={false} label={snd.mus ? 'Turn music off' : 'Turn music on'} onPress={toggleMus} />
                  <GBtn icon={snd.sfx ? 'sound' : 'mute'} color={snd.sfx ? 'blue' : 'dark'} size={52} fast={false} label={snd.sfx ? 'Turn sounds off' : 'Turn sounds on'} onPress={toggleSfx} />
                  <GBtn icon="bubble" color="teal" size={52} fast={false} label="How to play" onPress={() => setSheet({ k: 'how' })} />
                </div>
                {Lv && <GPill text="Restart level" icon="replay" color="white" small wide onPress={() => startLevel(Lv.i)} />}
                <GPill text={Lv ? 'Levels' : 'Menu'} icon={Lv ? 'map' : 'home'} color="white" small wide onPress={() => { toMenu(); if (Lv) setSheet({ k: 'levels' }); }} />
                <GPill text="Leave" color="red" small wide onPress={finish} />
              </GPanel>
            </div>
          )}

          {phase === 'over' && result && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 20, background: 'rgba(2,10,22,0.5)', display: 'flex', padding: 12, overflowY: 'auto', touchAction: 'pan-y' }}>
              <div style={{ margin: 'auto', width: '100%', display: 'flex', justifyContent: 'center' }}>
              {result.level != null ? (
                <GPanel style={{ width: '100%', maxWidth: 360, padding: '20px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center', animation: 'zgk-pop 0.35s ease-out' }}>
                  {result.win && <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>{[0, 1, 2].map((q) => <div key={q} style={{ transform: q === 1 ? 'translateY(-8px)' : 'none' }}><GIcon k="star" size={q === 1 ? 50 : 40} color={result.stars > q ? '#FFD23F' : '#5A5470'} /></div>)}</div>}
                  <GTitle text={result.win ? `Level ${result.level + 1} clear` : result.why === 'time' ? 'Out of time' : 'Try again'} size={28} color={result.win ? '#FFE15A' : '#FFFFFF'} />
                  <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.8)', fontWeight: 700 }}>{GULP_LEVELS[result.level].name}. {goalText(GULP_LEVELS[result.level])}.</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, width: '100%' }}>
                    {[['Time', fmtT(result.time)], ['Biggest', fmtN(result.mn)], ['Eaten', fmtN(result.eaten)]].map(([a, v]) => (
                      <div key={a} style={{ padding: '10px 4px', borderRadius: 14, background: 'rgba(255,255,255,0.07)' }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: '#FFE15A', fontVariantNumeric: 'tabular-nums' }}>{v}</div>
                        <div style={{ fontSize: 11.5, fontWeight: 800, color: 'rgba(255,255,255,0.62)', marginTop: 2 }}>{a}</div>
                      </div>
                    ))}
                  </div>
                  {result.win && result.level < GULP_LEVELS.length - 1 ? <GPill text="Next level" icon="play" color="green" wide onPress={() => startLevel(result.level + 1)} /> : !result.win ? <GPill text="Try again" icon="replay" color="green" wide onPress={() => startLevel(result.level)} /> : <GPill text="Play endless" icon="play" color="green" wide onPress={play} />}
                  <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                    {result.win && <GPill text="Replay" icon="replay" color="white" small wide onPress={() => startLevel(result.level)} style={{ flex: 1 }} />}
                    <GPill text="Levels" icon="map" color="white" small wide onPress={() => { toMenu(); setSheet({ k: 'levels' }); }} style={{ flex: 1 }} />
                  </div>
                </GPanel>
              ) : (
                <GPanel style={{ width: '100%', maxWidth: 360, padding: '22px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center', animation: 'zgk-pop 0.35s ease-out' }}>
                  <GTitle text={result.watch ? `${result.w === 'sun' ? hostFirst : result.w === 'moon' ? peerFirst : 'Nobody'} won` : result.solo ? (result.newTop ? 'New record' : 'Game over') : result.why === 'left' ? 'You won' : result.win ? 'You won' : `${peerFirst} won`} size={34} color={result.win || result.newTop ? '#FFE15A' : '#FFFFFF'} />
                  <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.78)', fontWeight: 700 }}>{result.watch ? 'Thanks for watching.' : result.solo ? 'You ran out of lives. Your biggest size counts.' : result.why === 'left' ? `${peerFirst} left the game.` : result.win ? `${peerFirst} ran out of lives.` : 'You ran out of lives.'}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, width: '100%' }}>
                    {[['Biggest', fmtN(result.mn)], ['Time', fmtT(result.time)], ['Eaten', fmtN(result.eaten)]].map(([a, v]) => (
                      <div key={a} style={{ padding: '10px 4px', borderRadius: 14, background: 'rgba(255,255,255,0.07)', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.08)' }}>
                        <div style={{ fontSize: 19, fontWeight: 900, color: '#FFE15A', fontVariantNumeric: 'tabular-nums' }}>{v}</div>
                        <div style={{ fontSize: 11.5, fontWeight: 800, color: 'rgba(255,255,255,0.62)', marginTop: 2 }}>{a}</div>
                      </div>
                    ))}
                  </div>
                  {!isSolo && <div style={{ fontSize: 15, fontWeight: 900 }}>{isWatch ? `${hostFirst} ${score.x} : ${score.o} ${peerFirst}` : `Rounds ${mySc} : ${theirSc}`}</div>}
                  {isSolo || (host && (result.why !== 'left' || here)) ? <GPill text="Play again" icon="replay" color="green" wide onPress={play} /> : result.why !== 'left' ? <div style={{ fontSize: 13.5, fontWeight: 800, color: 'rgba(255,255,255,0.75)' }}>{`${isWatch ? 'The players start' : `${peerFirst} starts`} the next round`}</div> : null}
                  <GPill text={isSolo ? 'Menu' : 'Back to chat'} icon={isSolo ? 'home' : 'chat'} color="white" wide small onPress={() => (isSolo ? toMenu() : finish())} />
                </GPanel>
              )}
              </div>
            </div>
          )}

          {sheet && sheet.k === 'levels' && (
            <Sheet title="Levels" text={`${totalStars} of ${GULP_LEVELS.length * 3} stars`} onClose={() => setSheet(null)}>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${land ? 5 : 4}, minmax(0, 1fr))`, gap: 10, marginTop: 14 }}>
                {GULP_LEVELS.map((L, i) => {
                  const b = lvls[i];
                  return (
                    <div key={i} role="button" tabIndex={0} aria-label={`Level ${i + 1}, ${L.name}. ${goalText(L)}`} onClick={() => { kitTap(); setSheet(null); startLevel(i); }}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 4px 8px', borderRadius: 16, background: b && b.stars ? 'rgba(91,227,125,0.14)' : 'rgba(255,255,255,0.07)', boxShadow: b && b.stars === 3 ? 'inset 0 0 0 2px #FFD23F' : 'inset 0 0 0 1.5px rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                      <span style={{ fontSize: 20, fontWeight: 900, color: '#FFFFFF', textShadow: `0 2px 0 ${INK}` }}>{i + 1}</span>
                      <span style={{ display: 'flex', gap: 1 }}>{[0, 1, 2].map((q) => <GIcon key={q} k="star" size={11} color={b && b.stars > q ? '#FFD23F' : 'rgba(255,255,255,0.25)'} />)}</span>
                      <span style={{ fontSize: 10.5, fontWeight: 800, color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 1.2, minHeight: 25 }}>{L.name}</span>
                    </div>
                  );
                })}
              </div>
            </Sheet>
          )}

          {sheet && sheet.k === 'how' && (
            <Sheet title="How to play Gulp" onClose={() => setSheet(null)}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                {[
                  ['#C8FFB0', 'Green numbers are food', 'Touch any fish with a number the same or smaller than yours. Even your tail works. Its number adds to yours.'],
                  ['#FF9A9A', 'Red numbers eat you', 'Hunters show a red mark, then chase you for a moment and give up. Dash away or hide.'],
                  ['#C08BFF', 'Suck', 'Pulls every fish you can eat near your mouth straight in.'],
                  ['#FFE15A', 'Grow forever', 'There is no end. Grow into bigger fish and unlock a shield, a shock wave and frenzy.'],
                  ['#7FD4FF', 'Levels', 'Each level has its own goal, like growing to a size or eating a number of fish. Finish fast for three stars.'],
                  ['#FFD23F', 'Treasure and gold', 'Chests sit on the sea floor. Swim into one for food and a power up. A golden fish shows up now and then. Catch it for a huge boost.'],
                  ['#9BE7FF', 'Currents', 'Streaks in the water push you along. Ride them to cross the sea fast.'],
                  ...(isSolo ? [['#5BE37D', 'Missions', 'In endless play you always have three missions. Finish one to get an extra life or a power up, then a new one appears.']] : []),
                  ['#FF7A8A', isRoom ? 'Team up' : 'Five lives', isRoom ? 'Friends can join or leave any time. Nobody eats anyone here, so swim together and grow.' : isSolo ? 'Each time you get eaten you come back smaller. Lose all five and the game ends.' : `Each time you get eaten you come back smaller. Whoever keeps their lives longer wins. You can eat ${peerFirst} if you are bigger.`],
                ].map(([c, t1, t2]) => (
                  <div key={t1} style={{ display: 'flex', gap: 10 }}>
                    <span style={{ width: 12, height: 12, borderRadius: 6, background: c, marginTop: 4, flexShrink: 0, boxShadow: `0 0 0 2px ${INK}` }} />
                    <div style={{ minWidth: 0 }}><div style={{ fontSize: 14.5, fontWeight: 900 }}>{t1}</div><div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.45 }}>{t2}</div></div>
                  </div>
                ))}
              </div>
            </Sheet>
          )}

          {sheet && sheet.k === 'room' && (
            <Sheet title="Players" text={`${roomCount} of ${ROOM_MAX}. Friends can join or leave any time.`} onClose={() => setSheet(null)}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                {roster.ids.map((id) => {
                  const p = G0 && G0.pl[id];
                  const isMe = id === myId;
                  const nm = isMe ? 'You' : roster.nm[id] || 'Friend';
                  const talk = isMe ? mesh.mic.on : !!mesh.mics[id];
                  const off = !!mesh.muted[id];
                  return (
                    <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', borderRadius: 14, background: 'rgba(255,255,255,0.06)' }}>
                      <FishBadge color={SLOT_KEYS[roster.col[id] || 0]} stage={p ? p.stage : 0} size={38} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14.5, fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nm}{id === roomHost ? ', host' : ''}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{p ? fmtN(p.n) : '2'}</span>
                          {talk && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#7BE05A' }}><GIcon k="mic" size={12} color="#7BE05A" />Mic on</span>}
                        </div>
                      </div>
                      {!isMe && <GBtn icon={off ? 'mute' : 'sound'} color={off ? 'red' : 'dark'} size={40} fast={false} label={off ? `Unmute ${nm}` : `Mute ${nm}`} onPress={() => mesh.toggleMute(id)} />}
                    </div>
                  );
                })}
              </div>
              <div role="switch" aria-checked={allowWatch} tabIndex={0} onClick={toggleAllow} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginTop: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 900 }}>Friends can see and join</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.65)' }}>Shows this room in their games page</div>
                </div>
                <Toggle on={allowWatch} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                {onInvite && roomCount < ROOM_MAX && <GPill text="Invite friends" icon="plus" color="green" small wide onPress={() => { setSheet(null); onInvite(roomCount, side); }} style={{ flex: 1 }} />}
                <GPill text={mesh.mic.on ? 'Mic off' : 'Mic on'} icon={mesh.mic.on ? 'micoff' : 'mic'} color={mesh.mic.on ? 'white' : 'blue'} small wide onPress={mesh.toggleMic} style={{ flex: 1 }} />
              </div>
            </Sheet>
          )}

          {ctl && (
            <div onPointerDown={(e) => e.stopPropagation()} style={{ position: 'absolute', inset: 0, zIndex: 45, background: 'rgba(2,10,22,0.6)', display: 'flex', padding: 12, overflowY: 'auto', touchAction: 'pan-y' }}>
              <div style={{ margin: 'auto', width: '100%', display: 'flex', justifyContent: 'center' }}><GControlsPanel sideways wide={land} onClose={() => setCtl(false)} /></div>
            </div>
          )}

          {leaveAsk && (
            <Sheet title="Leave the game?" text={`${peerFirst} wins this round if you leave.`} onClose={() => setLeaveAsk(false)}>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <GPill text="Stay" color="white" small onPress={() => setLeaveAsk(false)} style={{ flex: 1 }} wide />
                <GPill text="Leave" color="red" small onPress={() => { setLeaveAsk(false); finish(); }} style={{ flex: 1 }} wide />
              </div>
            </Sheet>
          )}

          {full && (
            <Sheet title="This room is full" text={`Ten friends are already playing. Try again in a bit.`} onClose={finish}>
              <div style={{ marginTop: 16 }}><GPill text="Back" color="white" small wide onPress={finish} /></div>
            </Sheet>
          )}

          {!side && chatSheet}
        </div>
        {side && chatSheet}
      </div>
    </Portal>
  );
}

export function GulpInviteSheet({ friends, onClose, onInvite, onSolo, already, side }) {
  injectKitCss();
  useBackClose(true, onClose);
  const [sel, setSel] = useState([]);
  const left = Math.max(0, ROOM_MAX - Math.max(1, already || 1));
  const list = (friends || []).filter((p) => p && p.id && !p.is_bot);
  const toggle = (id) => { kitTap(); setSel((v) => (v.includes(id) ? v.filter((x) => x !== id) : v.length >= left ? v : [...v, id])); };
  return (
    <Portal>
      <div onClick={onClose} data-side={side ? '1' : '0'} style={{ position: 'fixed', ...(side && typeof window !== 'undefined' ? { left: 0, top: 0, width: window.innerHeight, height: window.innerWidth, transformOrigin: '0 0', transform: `translateX(${window.innerWidth}px) rotate(90deg)` } : { inset: 0 }), zIndex: 96, background: 'rgba(4,14,30,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT, color: '#FFFFFF' }}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, maxHeight: side ? '100%' : 'min(88vh, 660px)', display: 'flex', flexDirection: 'column', padding: side ? '10px 14px' : '14px 14px calc(14px + env(safe-area-inset-bottom))', boxSizing: 'border-box', animation: 'zgk-in 0.25s ease-out' }}>
          <GPanel color="rgba(10,40,74,0.96)" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex' }}>{['c0', 'c1', 'c2'].map((c, i) => <div key={c} style={{ marginLeft: i ? -14 : 0 }}><FishBadge color={c} stage={i} size={40} /></div>)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 17, fontWeight: 900 }}>Gulp room</div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,0.72)' }}>{`Up to ten players. Pick up to ${left} friends. They can join any time.`}</div>
              </div>
              <GBtn icon="close" color="white" size={38} fast={false} label="Close" onPress={onClose} />
            </div>
            <div style={{ overflowY: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: side ? 150 : '50vh', WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
              {list.length === 0 && <div style={{ fontSize: 13.5, fontWeight: 700, color: 'rgba(255,255,255,0.75)', padding: '12px 4px' }}>Chat with someone first, then you can invite them here.</div>}
              {list.map((p) => {
                const on = sel.includes(p.id);
                return (
                  <div key={p.id} role="button" tabIndex={0} aria-pressed={on} onClick={() => toggle(p.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 16, background: on ? 'rgba(91,227,125,0.18)' : 'rgba(255,255,255,0.06)', boxShadow: on ? 'inset 0 0 0 2px #5BE37D' : 'none', cursor: 'pointer' }}>
                    <Avatar emoji={p.avatar} name={p.name} size={40} />
                    <span style={{ flex: 1, minWidth: 0, fontSize: 14.5, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                    <span aria-hidden="true" style={{ width: 26, height: 26, borderRadius: 13, background: on ? '#5BE37D' : 'transparent', boxShadow: `0 0 0 2.5px ${on ? INK : 'rgba(255,255,255,0.4)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{on && <GIcon k="check" size={16} color="#FFFFFF" />}</span>
                  </div>
                );
              })}
            </div>
            <GPill text={sel.length ? `Invite ${sel.length} and play` : 'Pick friends'} icon="play" color="green" wide disabled={!sel.length} onPress={() => onInvite(list.filter((p) => sel.includes(p.id)))} />
            {onSolo && <GPill text="Open the room without inviting" color="white" small wide onPress={onSolo} />}
          </GPanel>
        </div>
      </div>
    </Portal>
  );
}

export default GulpGamePage;
