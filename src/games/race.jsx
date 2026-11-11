import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, Portal, useBackClose, FONT, Spinner } from '../App.jsx';
import { useRoomLink } from './relay.jsx';
import { EMOTES, Sheet, injectCss } from './livekit.jsx';
import { GBtn, GPill, GPanel, GChip, GTitle, GIcon, GHudBtn, GHudPanel, GNotices, useNotices, useWatchNotices, injectKitCss, kitTap, pressProps, maxDpr, INK, useCtlLook, useGameStage, GControlsPanel } from './gamekit.jsx';
import { Sfx } from './sfx.js';
import { watchAllowed, setWatchAllowed, useLiveBeacon } from './live.js';
import { createRenderer, m4, MeshBuilder } from './race3d.js';
import { buildTrack, buildWorld } from './racetrack.js';
import { carMesh } from './racecars.js';
import { CARS, CAR_KEYS, COLORS, BOT_NAMES, MAX_RACERS, LAPS, mkCar, stepCar, collide, botInput, standings, lapOf, fmtRace, clamp } from './raceengine.js';

const CAR_PREF = 'zchat-race-car';
const TILT_PREF = 'zchat-race-tilt';
const BEST_KEY = (uid) => `zchat-race-best-${uid || 'me'}`;
const readPref = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch { return d; } };
const savePref = (k, v) => { try { localStorage.setItem(k, String(v)); } catch {} };
const lin = (h) => { const n = parseInt(h.slice(1), 16); return [((n >> 16) / 255) ** 2.2, (((n >> 8) & 255) / 255) ** 2.2, ((n & 255) / 255) ** 2.2]; };
const srgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };
const ordinal = (n) => (n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`);
const SEND_MS = 100;
const num = (v, d = 0) => { const n = Number(v); return Number.isFinite(n) ? n : d; };

let WORLD = null;
function getWorld() {
  if (!WORLD) WORLD = { T: buildTrack(), W: null };
  if (!WORLD.W) WORLD.W = buildWorld(WORLD.T, { seed: 11, trees: 460, cell: 8 });
  return WORLD;
}
function envFor(T, low) {
  const h = T.at(T.total * 0.565).heading - 1.12, el = (16 * Math.PI) / 180;
  return {
    sunDir: [Math.sin(h) * Math.cos(el), Math.sin(el), Math.cos(h) * Math.cos(el)], sunCol: [3.1, 2.35, 1.6], skyCol: [0.34, 0.43, 0.62], gndCol: [0.26, 0.23, 0.17],
    fogCol: lin('#C9D7E4'), fogSun: srgb('#FFBE82'), fogSunLin: lin('#FFBE82'), horizon: srgb('#C9D7E4'), zenith: srgb('#2A63B0'), fogDen: 0.0013, exposure: 0.95, time: 0, shadowRange: 58, shadows: !low,
  };
}
const THUMBS = new Map();
function carThumbs(color) {
  if (THUMBS.has(color)) return THUMBS.get(color);
  const out = {};
  try {
    const cv = document.createElement('canvas'); cv.width = 240; cv.height = 150;
    const R = createRenderer(cv, { keep: true, shadowSize: 512 });
    if (!R) return out;
    const fl = new MeshBuilder();
    for (let k = 0; k < 24; k++) { const a0 = (k / 24) * Math.PI * 2, a1 = ((k + 1) / 24) * Math.PI * 2; fl.tri([0, 0, 0], [Math.cos(a1) * 3.4, 0, Math.sin(a1) * 3.4], [Math.cos(a0) * 3.4, 0, Math.sin(a0) * 3.4], '#D9DEE6', 0.05); }
    const floor = R.mesh(fl.build());
    const env = { sunDir: [0.45, 0.78, 0.43], sunCol: [2.4, 2.25, 2.1], skyCol: [0.48, 0.52, 0.6], gndCol: [0.3, 0.3, 0.32], fogCol: lin('#E6EBF2'), fogSun: srgb('#FFFFFF'), fogSunLin: lin('#FFFFFF'), horizon: srgb('#E9EEF5'), zenith: srgb('#B9C8DE'), fogDen: 0.0001, exposure: 1, time: 0, shadowRange: 5 };
    for (const k of CAR_KEYS) {
      const mesh = R.mesh(carMesh(k, color));
      R.render({ env, cam: { pos: [4.4, 2.1, 4.9], at: [0, 0.62, 0.1], fov: 0.6, shadowAt: [0, 0, 0] }, items: [{ mesh: floor }, { mesh, cast: true, model: m4.pose(0, 0, 0, -0.62) }] });
      out[k] = cv.toDataURL('image/png');
      R.drop(mesh);
    }
    R.dispose();
  } catch {}
  THUMBS.set(color, out);
  return out;
}

function engineSound() {
  const B = Sfx.bus();
  if (!B) return null;
  const { ac, out } = B;
  try {
    const g = ac.createGain(); g.gain.value = 0;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = 2;
    const o1 = ac.createOscillator(); o1.type = 'sawtooth';
    const o2 = ac.createOscillator(); o2.type = 'square';
    const g2 = ac.createGain(); g2.gain.value = 0.45;
    o1.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(g); g.connect(out);
    const len = ac.sampleRate * 0.6, nb = ac.createBuffer(1, len, ac.sampleRate), d = nb.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const nz = ac.createBufferSource(); nz.buffer = nb; nz.loop = true;
    const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1700; bp.Q.value = 1.3;
    const ng = ac.createGain(); ng.gain.value = 0;
    nz.connect(bp); bp.connect(ng); ng.connect(out);
    o1.start(); o2.start(); nz.start();
    return {
      set(v, boost, drift, on) {
        const t = ac.currentTime;
        const f = 52 + v * 2.9 * (boost ? 1.18 : 1);
        o1.frequency.setTargetAtTime(f, t, 0.06); o2.frequency.setTargetAtTime(f / 2, t, 0.06);
        lp.frequency.setTargetAtTime(500 + v * 26 + (boost ? 600 : 0), t, 0.08);
        g.gain.setTargetAtTime(on ? 0.035 + Math.min(1, v / 50) * 0.05 : 0, t, 0.1);
        ng.gain.setTargetAtTime(on ? drift * 0.05 : 0, t, 0.05);
      },
      stop() { try { o1.stop(); o2.stop(); nz.stop(); g.disconnect(); ng.disconnect(); } catch {} },
    };
  } catch { return null; }
}

function CarPick({ k, on, img, color, onPress }) {
  return (
    <button type="button" className="zgk-btn" aria-label={`Drive the ${CARS[k].name.toLowerCase()}`} aria-pressed={on} {...pressProps(onPress)}
      style={{ flex: '1 1 0', minWidth: 0, border: 'none', padding: '6px 4px 8px', borderRadius: 16, cursor: 'pointer', background: on ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.1)', boxShadow: on ? `0 0 0 3px ${color}` : 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, fontFamily: FONT }}>
      {img ? <img src={img} alt="" draggable={false} style={{ width: '100%', maxWidth: 120, aspectRatio: '1.6', objectFit: 'cover', borderRadius: 10, display: 'block' }} /> : <div style={{ width: '100%', aspectRatio: '1.6', borderRadius: 10, background: 'rgba(255,255,255,0.12)' }} />}
      <span style={{ fontSize: 12.5, fontWeight: 900, color: on ? INK : '#FFFFFF' }}>{CARS[k].name}</span>
    </button>
  );
}

export function RaceGamePage({ solo = false, room, me, myId, onClose, onInvite, watch = false }) {
  injectCss(); injectKitCss();
  const uid = solo ? 'me' : myId;
  const isHost = solo || (room && room.host === myId);
  const myFirst = String((me && me.name) || 'You').split(' ')[0];
  const [myCar, setMyCar] = useState(() => (CARS[readPref(CAR_PREF, 'sport')] ? readPref(CAR_PREF, 'sport') : 'sport'));
  const meta = { n: myFirst, a: me && me.avatar, w: watch ? 1 : 0, c: myCar };
  const relay = useRoomLink({ id: solo || !room ? null : `race-${room.rm}`, myId, enabled: !solo && !!room, meta, fast: ['pl', 'bt'], audio: !watch });
  const [phase, setPhase] = useState('menu');
  const [ready, setReady] = useState(() => !!(WORLD && WORLD.W));
  const [roster, setRoster] = useState(solo ? ['me'] : [room && room.host].filter(Boolean));
  const [names, setNames] = useState({});
  const [carsOf, setCarsOf] = useState({});
  const [watchers, setWatchers] = useState([]);
  const [laps, setLaps] = useState(LAPS);
  const [fill, setFill] = useState(true);
  const [hud, setHud] = useState({ pos: 1, n: 1, lap: 1, time: 0, order: [], fin: false });
  const [count, setCount] = useState(0);
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState(null);
  const [paused, setPaused] = useState(false);
  const [leaveAsk, setLeaveAsk] = useState(false);
  const [quick, setQuick] = useState(false);
  const [people, setPeople] = useState(false);
  const [ctl, setCtl] = useState(false);
  const [follow, setFollow] = useState(null);
  const [allowWatch, setAllowWatch] = useState(watchAllowed());
  const [tilt, setTilt] = useState(() => readPref(TILT_PREF, '0') === '1');
  const [thumbs, setThumbs] = useState({});
  const [bubbles, setBubbles] = useState({});
  const [failed, setFailed] = useState(false);
  const [notes, pushNote] = useNotices();
  const look = useCtlLook();
  const GS = useGameStage(useMemo(() => ({ ...look, side: true }), [look]));
  const { top, right, bottom, left } = GS.at;
  const land = GS.land;
  useLiveBeacon({ game: 'race', room: room ? room.rm : null, info: { h: room && room.host, n: Math.max(1, roster.length) }, active: !solo && !watch && !!room, allow: allowWatch });

  const cvRef = useRef(null);
  const wrapRef = useRef(null);
  const miniRef = useRef(null);
  const speedRef = useRef(null);
  const meterRef = useRef(null);
  const tagRefs = useRef({});
  const RR = useRef(null);
  const G = useRef({ cars: {}, ids: [], bots: [], rid: '', t0: 0, goAt: 0, fins: {}, sendAt: 0, botAt: 0, hudAt: 0, cam: null, parts: [], fx: [], meshes: new Map(), net: {}, endAt: 0, resAt: 0, lapSeen: 0, budget: { avg: 16, n: 0, low: false }, eng: null, laps: LAPS, botMeta: {} });
  const hold = useRef({ l: false, r: false, d: false, b: false });
  const keys = useRef(new Set());
  const tiltV = useRef(0);
  const phaseRef = useRef(phase); phaseRef.current = phase;
  const pausedRef = useRef(paused); pausedRef.current = paused;
  const rosterRef = useRef(roster); rosterRef.current = roster;
  const namesRef = useRef(names); namesRef.current = names;
  const carsOfRef = useRef(carsOf); carsOfRef.current = carsOf;
  const followRef = useRef(follow); followRef.current = follow;
  const myCarRef = useRef(myCar); myCarRef.current = myCar;
  const metaRef = useRef({});
  const joinOrder = useRef([]);
  const toastT = useRef(0);
  const rosterSeen = useRef({ list: null, at: Date.now(), bye: new Set() });
  const kindOf = () => (solo ? 'me' : myId);
  const inRace = () => G.current.ids.includes(kindOf()) && !watch;
  if (typeof window !== 'undefined' && window.__zfake) window.__zrace = { G: () => G.current, phase: () => phaseRef.current, hold: () => hold.current, roster: () => rosterRef.current, total: () => (WORLD ? WORLD.T.total : 0) };

  const say = (text, sec = 2.2) => { setToast({ text, at: Date.now() }); clearTimeout(toastT.current); toastT.current = setTimeout(() => setToast(null), sec * 1000); };
  const nameOf = (k) => (k === kindOf() ? 'You' : G.current.botMeta[k] ? G.current.botMeta[k].n : names[k] || 'Friend');
  const slotColor = (k) => { const i = G.current.ids.indexOf(k); return COLORS[(i >= 0 ? i : Math.max(0, rosterRef.current.indexOf(k))) % COLORS.length]; };
  const myColor = COLORS[Math.max(0, roster.indexOf(kindOf())) % COLORS.length];

  useEffect(() => {
    if (ready) return undefined;
    const t = setTimeout(() => { try { getWorld(); setReady(true); } catch { setFailed(true); } }, 60);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    const t = setTimeout(() => setThumbs(carThumbs(myColor)), 120);
    return () => clearTimeout(t);
  }, [myColor]);

  useEffect(() => {
    if (!ready) return undefined;
    const cv = cvRef.current;
    if (!cv) return undefined;
    let R = null;
    try { R = createRenderer(cv, { shadowSize: 2048 }); } catch { R = null; }
    if (!R) { setFailed(true); return undefined; }
    const { T, W } = getWorld();
    const st = { R, T, env: envFor(T, false), items: [{ mesh: R.mesh(W.ring) }, { mesh: R.mesh(W.water) }, { mesh: R.mesh(W.ground) }, { mesh: R.mesh(W.road) }, { mesh: R.mesh(W.props), cast: true }] };
    RR.current = st;
    WORLD.W = null;
    return () => {
      RR.current = null;
      const g = G.current; g.meshes = new Map();
      try { R.dispose(); } catch {}
      setTimeout(() => { if (!cv.isConnected) R.lose(); }, 0);
    };
  }, [ready]);

  const meshFor = (type, color) => {
    const st = RR.current;
    if (!st) return null;
    const k = `${type}|${color}`;
    const M = G.current.meshes;
    if (!M.has(k)) M.set(k, st.R.mesh(carMesh(type, color)));
    return M.get(k);
  };

  const freshRoster = () => {
    if (solo) return ['me'];
    const present = relay.peers.filter((p) => !(metaRef.current[p] && metaRef.current[p].w));
    const order = joinOrder.current.filter((p) => present.includes(p));
    present.forEach((p) => { if (!order.includes(p)) order.push(p); });
    return [myId, ...order.filter((p) => p !== myId)].slice(0, MAX_RACERS);
  };

  const beginRace = (cfg) => {
    const g = G.current;
    g.rid = cfg.rid; g.ids = cfg.ids.slice(); g.laps = cfg.laps || LAPS;
    g.cars = {}; g.fins = {}; g.parts = []; g.fx = []; g.net = {}; g.endAt = 0; g.resAt = 0; g.lapSeen = 0;
    g.botMeta = {};
    cfg.ids.forEach((k, slot) => {
      const b = (cfg.bots || []).find((x) => x.id === k);
      if (b) g.botMeta[k] = { n: b.n, skill: b.sk };
      g.cars[k] = mkCar(k, slot, (cfg.cars && cfg.cars[k]) || (b && b.c) || 'sport');
    });
    g.bots = (cfg.bots || []).map((b) => b.id);
    g.goAt = performance.now() + (cfg.in || 3600);
    g.t0 = g.goAt;
    g.cam = null;
    setResult(null); setPaused(false); setQuick(false); setFollow(null);
    setLaps(g.laps);
    setHud({ pos: Math.max(1, cfg.ids.indexOf(kindOf()) + 1), n: cfg.ids.length, lap: 1, time: 0, order: cfg.ids.slice(), fin: false });
    setPhase('count');
    setCount(3);
    hold.current = { l: false, r: false, d: false, b: false };
    Sfx.init();
    if (!g.eng && !watch) g.eng = engineSound();
  };
  const startRace = () => {
    if (!isHost || !ready) return;
    Sfx.init();
    const ids = solo ? ['me'] : freshRoster();
    const cars = {};
    ids.forEach((k) => { cars[k] = k === kindOf() ? myCarRef.current : CARS[carsOfRef.current[k]] ? carsOfRef.current[k] : metaRef.current[k] && CARS[metaRef.current[k].c] ? metaRef.current[k].c : 'sport'; });
    const bots = [];
    const want = solo ? MAX_RACERS : fill ? MAX_RACERS : ids.length;
    for (let i = ids.length; i < want; i++) {
      const id = `bot${i}`;
      bots.push({ id, n: BOT_NAMES[i % BOT_NAMES.length], c: CAR_KEYS[(i * 3 + 1) % CAR_KEYS.length], sk: 0.9 + ((i * 37) % 9) / 100 });
      ids.push(id);
      cars[id] = bots[bots.length - 1].c;
    }
    const cfg = { rid: `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`, ids, cars, bots, laps, in: 3600 };
    if (!solo) { setRoster(ids.filter((k) => !k.startsWith('bot'))); relay.send('go', cfg); }
    beginRace(cfg);
  };
  const toMenu = (quiet) => {
    const g = G.current;
    g.ids = []; g.cars = {};
    setPhase('menu'); setResult(null); setCount(0);
    if (g.eng) g.eng.set(0, false, 0, false);
    if (!solo && isHost && !quiet) relay.send('menu', {});
  };
  const finishUp = (order) => {
    const g = G.current;
    if (phaseRef.current === 'done') return;
    const list = order || standings(Object.values(g.cars), getWorld().T, g.laps).map((c) => [c.id, c.fin || 0]);
    const mine = list.findIndex(([k]) => k === kindOf());
    const meC = g.cars[kindOf()];
    const prev = Number(readPref(BEST_KEY(uid), '0')) || 0;
    if (meC && meC.lapBest && (!prev || meC.lapBest < prev)) savePref(BEST_KEY(uid), meC.lapBest.toFixed(3));
    setResult({ list, mine: mine >= 0 ? mine + 1 : 0, best: meC ? meC.lapBest : 0, prev });
    setPhase('done');
    if (mine === 0) { Sfx.play('win', { vol: 0.8 }); try { window.dispatchEvent(new CustomEvent('zchat-screen-fx', { detail: 'confetti' })); } catch {} }
  };

  useEffect(() => {
    if (solo || !room) return undefined;
    const offs = [
      relay.on('*', (m) => { if (m.m) { metaRef.current[m.from] = m.m; setNames((p) => (p[m.from] === m.m.n ? p : { ...p, [m.from]: m.m.n })); if (m.m.c && CARS[m.m.c]) setCarsOf((p) => (p[m.from] ? p : { ...p, [m.from]: m.m.c })); } if (!joinOrder.current.includes(m.from)) joinOrder.current.push(m.from); }),
      relay.on('roster', (m) => {
        if (isHost || !Array.isArray(m.ids)) return;
        setRoster(m.ids.slice(0, MAX_RACERS));
        if (m.nm) setNames((p) => ({ ...p, ...m.nm }));
        if (m.cs) setCarsOf((p) => ({ ...p, ...m.cs }));
        if (m.lp) setLaps(clamp(Math.round(num(m.lp, LAPS)), 1, 9));
        if (typeof m.fl === 'number') setFill(!!m.fl);
        if (m.cfg && phaseRef.current === 'menu' && !G.current.ids.length && typeof m.cfg.rid === 'string' && Array.isArray(m.cfg.ids)) beginRace({ rid: m.cfg.rid, ids: m.cfg.ids.filter((k) => typeof k === 'string').slice(0, MAX_RACERS), cars: m.cfg.cars && typeof m.cfg.cars === 'object' ? m.cfg.cars : {}, bots: Array.isArray(m.cfg.bots) ? m.cfg.bots.filter((b) => b && typeof b.id === 'string').map((b) => ({ id: b.id, n: String(b.n || 'Bot').slice(0, 20), c: b.c, sk: clamp(num(b.sk, 0.95), 0.8, 1) })) : [], laps: clamp(Math.round(num(m.cfg.laps, LAPS)), 1, 9), in: 600 });
      }),
      relay.on('go', (m) => { if (isHost || !m || !Array.isArray(m.ids) || typeof m.rid !== 'string') return; beginRace({ rid: m.rid, ids: m.ids.filter((k) => typeof k === 'string').slice(0, MAX_RACERS), cars: m.cars && typeof m.cars === 'object' ? m.cars : {}, bots: Array.isArray(m.bots) ? m.bots.filter((b) => b && typeof b.id === 'string').slice(0, MAX_RACERS).map((b) => ({ id: b.id, n: String(b.n || 'Bot').slice(0, 20), c: b.c, sk: clamp(num(b.sk, 0.95), 0.8, 1) })) : [], laps: clamp(Math.round(num(m.laps, LAPS)), 1, 9), in: clamp(num(m.in, 3600), 300, 6000) }); }),
      relay.on('menu', () => { if (!isHost) toMenu(true); }),
      relay.on('pl', (m) => {
        const g = G.current;
        if (!m || m.r !== g.rid) return;
        const c = g.cars[m.from];
        if (!c || m.from === kindOf()) return;
        if (typeof m.at === 'number') { if (m.at < (c.netAt || 0)) return; c.netAt = m.at; }
        g.net[m.from] = { s: num(m.s, c.s), x: clamp(num(m.x), -20, 20), v: clamp(num(m.v), 0, 90), y: clamp(num(m.y), -1.2, 1.2), at: performance.now() };
        c.drift = clamp(num(m.d), 0, 1); c.boostT = m.b ? 0.3 : 0; c.steer = clamp(num(m.st), -1, 1);
        if (Number(m.f) > 0 && !c.fin) c.fin = Number(m.f);
      }),
      relay.on('bt', (m) => {
        const g = G.current;
        if (isHost || !m || m.r !== g.rid || !Array.isArray(m.a)) return;
        for (const a of m.a) {
          const k = g.ids[a[0]];
          const c = k && g.cars[k];
          if (!c) continue;
          g.net[k] = { s: num(a[1], c.s), x: clamp(num(a[2]), -20, 20), v: clamp(num(a[3]), 0, 90), y: clamp(num(a[4]), -1.2, 1.2), at: performance.now() };
          c.drift = Number(a[5]) || 0; c.boostT = a[6] ? 0.3 : 0; if (Number(a[7]) > 0 && !c.fin) c.fin = Number(a[7]);
        }
      }),
      relay.on('fin', (m) => { const g = G.current; const ft = Number(m && m.ft); if (!m || m.r !== g.rid || !(ft > 0) || !Number.isFinite(ft)) return; const c = g.cars[m.from]; if (c && !c.fin) c.fin = ft; g.fins[m.from] = ft; }),
      relay.on('res', (m) => { const g = G.current; if (!m || m.r !== g.rid || !Array.isArray(m.o)) return; finishUp(m.o.filter((e) => Array.isArray(e) && typeof e[0] === 'string').map((e) => [e[0], Number(e[1]) > 0 ? Number(e[1]) : 0])); }),
      relay.on('car', (m) => { if (m && CARS[m.c]) setCarsOf((p) => ({ ...p, [m.from]: m.c })); }),
      relay.on('emo', (m) => { const e = String(m.e || ''); if (!EMOTES.includes(e)) return; setBubbles((p) => ({ ...p, [m.from]: { e, at: Date.now() } })); Sfx.play('pop', { vol: 0.45 }); }),
      relay.on('bye', (m) => { const n = namesRef.current[m.from] || 'A friend'; if (rosterRef.current.includes(m.from) && !rosterSeen.current.bye.has(m.from)) { rosterSeen.current.bye.add(m.from); pushNote(`${n} left the race`, 'leave'); } }),
    ];
    return () => offs.forEach((f) => f && f());
  }, [relay.on]);

  useEffect(() => {
    if (solo || !room || !isHost) return undefined;
    const tick = () => {
      const present = relay.peers.filter((p) => !(metaRef.current[p] && metaRef.current[p].w));
      const cur = rosterRef.current;
      const racing = phaseRef.current !== 'menu';
      const next = racing ? cur.filter((p) => p === myId || present.includes(p)) : freshRoster();
      const w = relay.peers.filter((p) => metaRef.current[p] && metaRef.current[p].w);
      setWatchers((prev) => (prev.join('|') === w.join('|') ? prev : w));
      if (next.join('|') !== cur.join('|')) setRoster(next);
      const nm = {}; const cs = {};
      next.concat(w).forEach((p) => { nm[p] = p === myId ? myFirst : (metaRef.current[p] && metaRef.current[p].n) || 'Friend'; });
      next.forEach((p) => { cs[p] = p === myId ? myCarRef.current : CARS[carsOfRef.current[p]] ? carsOfRef.current[p] : metaRef.current[p] && CARS[metaRef.current[p].c] ? metaRef.current[p].c : 'sport'; });
      const g = G.current;
      const cfg = racing && g.ids.length ? { rid: g.rid, ids: g.ids, cars: Object.fromEntries(g.ids.map((k) => [k, g.cars[k] ? g.cars[k].type : 'sport'])), bots: g.bots.map((k) => ({ id: k, n: g.botMeta[k] ? g.botMeta[k].n : 'Bot', c: g.cars[k] ? g.cars[k].type : 'sport', sk: g.botMeta[k] ? g.botMeta[k].skill : 0.95 })), laps: g.laps } : null;
      relay.send('roster', { ids: next, nm, cs, lp: laps, fl: fill ? 1 : 0, cfg });
    };
    tick();
    const iv = setInterval(tick, 1500);
    return () => clearInterval(iv);
  }, [relay.peers, allowWatch, laps, fill]);
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
    for (const k of prev) if (!roster.includes(k) && k !== me0 && !R0.bye.has(k)) { R0.bye.add(k); pushNote(`${namesRef.current[k] || 'A friend'} left the race`, 'leave'); }
  }, [roster]);
  const watchList = useMemo(() => watchers.map((id) => ({ id, n: names[id] || 'Friend' })), [watchers, names]);
  useWatchNotices(watchList, pushNote, !solo && !watch);

  const pickCar = (k) => {
    if (!CARS[k]) return;
    kitTap();
    setMyCar(k); savePref(CAR_PREF, k);
    if (!solo) relay.send('car', { c: k });
  };

  useEffect(() => {
    const kd = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      const k = e.key.toLowerCase();
      if (['arrowleft', 'arrowright', 'arrowup', 'a', 'd', 'w', ' ', 'shift', 'b'].includes(k)) { keys.current.add(k); e.preventDefault(); }
    };
    const ku = (e) => keys.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, []);
  useEffect(() => {
    if (!tilt) return undefined;
    const on = (e) => {
      const ang = (window.screen && window.screen.orientation && window.screen.orientation.angle) || window.orientation || 0;
      const raw = ang === 90 ? e.beta : ang === -90 || ang === 270 ? -e.beta : e.gamma;
      tiltV.current = clamp((raw || 0) / 22, -1, 1);
    };
    window.addEventListener('deviceorientation', on);
    return () => { window.removeEventListener('deviceorientation', on); tiltV.current = 0; };
  }, [tilt]);
  const toggleTilt = async () => {
    const next = !tilt;
    if (next && typeof window.DeviceOrientationEvent !== 'undefined' && typeof window.DeviceOrientationEvent.requestPermission === 'function') {
      try { const r = await window.DeviceOrientationEvent.requestPermission(); if (r !== 'granted') { say('Allow motion to steer by tilting', 2.6); return; } } catch { return; }
    }
    setTilt(next); savePref(TILT_PREF, next ? '1' : '0'); kitTap();
  };

  useEffect(() => {
    let raf = 0, last = performance.now();
    const loop = (ts) => {
      raf = requestAnimationFrame(loop);
      const st = RR.current, cv = cvRef.current, wrap = wrapRef.current;
      if (!st || !cv || !wrap) return;
      let dt = (ts - last) / 1000;
      last = ts;
      if (dt <= 0) return;
      dt = Math.min(0.25, dt);
      const g = G.current, T = st.T;
      const B = g.budget;
      B.avg = B.avg * 0.94 + Math.min(80, dt * 1000) * 0.06; B.n += 1;
      if (((B.n > 40 && B.avg > 30) || window.__zraceLow) && !B.low) { B.low = true; st.env = envFor(T, true); }
      const cw = wrap.clientWidth, ch = wrap.clientHeight;
      const dpr = Math.min(maxDpr(B.low), B.low ? 1 : 1.6);
      if (cv.width !== Math.round(cw * dpr) || cv.height !== Math.round(ch * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); }
      const ph = phaseRef.current;
      const now = performance.now();
      const myK = kindOf();
      const playing = g.ids.includes(myK) && !watch;
      const step = pausedRef.current ? 0 : dt;
      const subs = Math.max(1, Math.ceil(step / 0.034));
      const sdt = step / subs;
      if (ph === 'count') {
        const left = Math.ceil((g.goAt - now) / 1000);
        if (left !== g.lastCount) { g.lastCount = left; if (left > 0 && left <= 3) { setCount(left); Sfx.play('click', { vol: 0.7 }); } }
        if (now >= g.goAt) { setPhase('race'); setCount(0); Sfx.play('cp', { vol: 0.8 }); say('Go!', 1); }
      }
      const racing = ph === 'race' || ph === 'done';
      const raceT = Math.max(0, (now - g.t0) / 1000);
      let all = g.ids.map((k) => g.cars[k]).filter(Boolean);
      if (ph === 'menu') {
        const want = (solo ? ['me', 'bot1', 'bot2', 'bot3', 'bot4', 'bot5'] : rosterRef.current).map((k, i) => `${k}:${k === myK ? myCarRef.current : solo ? CAR_KEYS[(i * 3 + 1) % CAR_KEYS.length] : carsOfRef.current[k] || 'sport'}`).join('|');
        if (g.menuKey !== want) {
          g.menuKey = want;
          g.menuCars = want.split('|').map((e, i) => { const [k, t] = e.split(':'); return mkCar(k, i, t); });
        }
        all = g.menuCars || [];
      }
      const fx = g.fx;
      if (racing && step > 0) {
        for (let sub = 0; sub < subs; sub++) {
          const K = keys.current, H = hold.current;
          const mine = g.cars[myK];
          if (mine && playing) {
            let inp;
            if (mine.fin) inp = { ...botInput(mine, T, all, raceT, 0.8), drift: false, boost: false };
            else {
              const steerKeys = ((K.has('arrowleft') || K.has('a') || H.l) ? 1 : 0) - ((K.has('arrowright') || K.has('d') || H.r) ? 1 : 0);
              const steer = tilt ? clamp(-tiltV.current * 1.2 + steerKeys, -1, 1) : steerKeys;
              inp = { steer, drift: K.has('shift') || K.has(' ') || H.d, boost: K.has('arrowup') || K.has('w') || K.has('b') || H.b };
              if (sub === subs - 1) H.b = false;
            }
            stepCar(mine, T, inp, sdt, { fx, mul: mine.fin ? 0.55 : 1 });
            for (const o of all) if (o !== mine) { const hit = collide(mine, o, solo || (isHost && g.bots.includes(o.id))); if (hit > 0.12) fx.push({ k: 'bump', id: myK, f: hit }); }
            const lapNow = Math.floor(Math.max(0, mine.s) / T.total);
            if (lapNow > (mine.lap || 0) && mine.s > 0) {
              const lt = raceT - (mine.lapAt || 0);
              if (lapNow >= 1 && lt > 5) mine.lapBest = mine.lapBest ? Math.min(mine.lapBest, lt) : lt;
              mine.lap = lapNow; mine.lapAt = raceT;
              if (!mine.fin) {
                if (lapNow >= g.laps) {
                  mine.fin = Math.max(0.01, raceT);
                  g.fins[myK] = mine.fin;
                  const place = standings(all, T, g.laps).findIndex((c) => c.id === myK) + 1;
                  say(`You finished ${ordinal(place)}`, 3);
                  Sfx.play(place === 1 ? 'win' : 'star', { vol: 0.8 });
                  if (!solo) relay.send('fin', { r: g.rid, ft: mine.fin });
                } else if (lapNow === g.laps - 1) { say('Final lap', 1.8); Sfx.play('coin', { vol: 0.7 }); } else { say(`Lap ${lapNow + 1}`, 1.6); Sfx.play('coin', { vol: 0.6 }); }
              }
            }
          }
          if (isHost) {
            const lead = all.filter((c) => !g.bots.includes(c.id)).reduce((m, c) => Math.max(m, c.s), -1e9);
            for (const k of g.bots) {
              const c = g.cars[k];
              if (!c) continue;
              const sk = g.botMeta[k] ? g.botMeta[k].skill : 0.95;
              const gap = c.s - lead;
              const band = gap > 70 ? 0.9 : gap > 30 ? 0.96 : gap < -90 ? 1.07 : gap < -40 ? 1.03 : 1;
              const inp = botInput(c, T, all, raceT, sk);
              stepCar(c, T, inp, sdt, { mul: (c.fin ? 0.55 : sk) * band });
              for (const o of all) if (o !== c && g.bots.includes(o.id)) collide(c, o, true);
              if (!c.fin && c.s >= T.total * g.laps) { c.fin = Math.max(0.01, raceT); g.fins[k] = c.fin; }
            }
          }
        }
        for (const k of Object.keys(g.net)) {
          const c = g.cars[k], N = g.net[k];
          if (!c || k === myK) continue;
          const age = Math.min(0.35, (now - N.at) / 1000);
          const ts2 = N.s + N.v * Math.cos(N.y) * age, tx = N.x + N.v * Math.sin(N.y) * age;
          if (Math.abs(ts2 - c.s) > 25) { c.s = ts2; c.x = tx; } else { const kk = 1 - Math.exp(-step * 10); c.s += (ts2 - c.s) * kk + c.v * Math.cos(c.yaw) * step * (1 - kk); c.x += (tx - c.x) * kk; }
          c.v = N.v; c.yaw += (N.y - c.yaw) * Math.min(1, step * 10);
        }
        if (!solo && playing && g.cars[myK] && now - g.sendAt > SEND_MS) {
          g.sendAt = now;
          const c = g.cars[myK];
          relay.send('pl', { r: g.rid, s: +c.s.toFixed(2), x: +c.x.toFixed(2), v: +c.v.toFixed(2), y: +c.yaw.toFixed(3), d: +c.drift.toFixed(2), b: c.boostT > 0 ? 1 : 0, st: +c.steer.toFixed(2), f: c.fin ? +c.fin.toFixed(2) : 0, at: Date.now() });
        }
        if (!solo && isHost && g.bots.length && now - g.botAt > 120) {
          g.botAt = now;
          relay.send('bt', { r: g.rid, a: g.bots.map((k) => { const c = g.cars[k]; return c ? [g.ids.indexOf(k), +c.s.toFixed(2), +c.x.toFixed(2), +c.v.toFixed(2), +c.yaw.toFixed(3), +c.drift.toFixed(2), c.boostT > 0 ? 1 : 0, c.fin ? +c.fin.toFixed(2) : 0] : null; }).filter(Boolean) });
        }
        if (isHost && ph === 'race') {
          const humans = all.filter((c) => !g.bots.includes(c.id));
          const done = humans.length && humans.every((c) => c.fin);
          const first = all.filter((c) => c.fin).reduce((m, c) => Math.min(m, c.fin), Infinity);
          if (!g.endAt && (done || (first < Infinity && raceT - first > 30))) g.endAt = now + (done ? 1500 : 0);
          if (g.endAt && now >= g.endAt && !g.resAt) {
            g.resAt = now;
            const goal = T.total * g.laps;
            for (const c of all) if (!c.fin && g.bots.includes(c.id)) c.fin = raceT + Math.max(0, goal - c.s) / Math.max(12, c.v || 30);
            const o = standings(all, T, g.laps).map((c) => [c.id, Number(c.fin) > 0 ? +Number(c.fin).toFixed(2) : 0]);
            if (!solo) relay.send('res', { r: g.rid, o });
            finishUp(o);
          }
        }
        if (!isHost && ph === 'race') {
          const mine = g.cars[myK];
          if (mine && mine.fin && raceT - mine.fin > 40 && !g.resAt) { g.resAt = now; finishUp(null); }
        }
      }
      while (fx.length) {
        const f = fx.shift();
        const local = f.id === myK;
        if (f.k === 'boost') { if (local) { Sfx.play('dash', { vol: 0.75 }); try { navigator.vibrate && navigator.vibrate(18); } catch {} } }
        else if (f.k === 'ready') { if (local) Sfx.play('pick', { vol: 0.5 }); }
        else if (f.k === 'wall' || f.k === 'bump') { if (local) { Sfx.play('bump', { vol: 0.35 + f.f * 0.5, gap: 0.2 }); g.shake = Math.max(g.shake || 0, 0.18 + f.f * 0.25); } }
      }
      const mineC = g.cars[myK];
      if (g.eng) g.eng.set(mineC ? mineC.v : 0, mineC && mineC.boostT > 0, mineC ? mineC.drift : 0, racing && !!mineC && !pausedRef.current);
      const P = g.parts;
      const items = st.items.slice();
      const tagPos = {};
      for (const c of all) {
        const p = T.at(c.s, c.x);
        const vis = c.drift * c.steer * 0.34 + (c.bump > 0 ? Math.sin(now / 30) * 0.03 : 0);
        const hd = p.heading + c.yaw + vis;
        c.wx = p.x; c.wy = p.y; c.wz = p.z; c.hd = hd;
        const mesh = meshFor(c.type, ph === 'menu' ? COLORS[c.slot % COLORS.length] : slotColor(c.id));
        if (mesh) items.push({ mesh, cast: true, model: m4.pose(p.x, p.y, p.z, hd, -p.slope, p.bank) });
        const fxv = Math.sin(hd), fzv = Math.cos(hd), rxv = Math.cos(hd), rzv = -Math.sin(hd);
        const back = (CARS[c.type] || CARS.sport).len;
        if (step > 0 && c.drift > 0.45 && c.v > 12 && P.length < 260) {
          for (const sg of [-1, 1]) P.push({ x: p.x - fxv * (back - 0.5) + rxv * sg * 0.85, y: p.y + 0.25, z: p.z - fzv * (back - 0.5) + rzv * sg * 0.85, vx: -fxv * 2 + (Math.random() - 0.5), vy: 0.6 + Math.random() * 0.5, vz: -fzv * 2 + (Math.random() - 0.5), life: 0, max: 0.9 + Math.random() * 0.4, s0: 0.35, s1: 1.6, a0: 0.3 });
        }
        if (step > 0 && c.boostT > 0 && P.length < 300) {
          for (const sg of [-1, 1]) P.push({ x: p.x - fxv * (back + 0.1) + rxv * sg * 0.38, y: p.y + 0.4, z: p.z - fzv * (back + 0.1) + rzv * sg * 0.38, vx: -fxv * 9, vy: 0, vz: -fzv * 9, life: 0, max: 0.16, s0: 0.3, s1: 0.08, a0: 0.95, fire: true });
        }
        tagPos[c.id] = [p.x, p.y + (c.type === 'jeep' ? 2.4 : c.type === 'tuktuk' ? 2.25 : c.type === 'hatch' ? 2.05 : 1.75), p.z];
      }
      const parts = [];
      for (let i = P.length - 1; i >= 0; i--) {
        const q = P[i];
        q.life += step;
        if (q.life >= q.max) { P.splice(i, 1); continue; }
        q.x += q.vx * step; q.y += q.vy * step; q.z += q.vz * step;
        const u = q.life / q.max;
        parts.push({ x: q.x, y: q.y, z: q.z, size: q.s0 + (q.s1 - q.s0) * u, alpha: q.a0 * (1 - u), fire: !!q.fire });
      }
      let camPos, camAt, fov = 1.0;
      if (ph === 'menu' || !g.ids.length) {
        g.orbit = (g.orbit || 0) + dt;
        const sw = Math.sin(g.orbit * 0.16) * 2.2;
        const eye = T.at(7 + sw, 4.6), look0 = T.at(-16, -1.8);
        camPos = [eye.x, eye.y + 2.9 + Math.sin(g.orbit * 0.11) * 0.3, eye.z];
        camAt = [look0.x, look0.y + 0.6, look0.z];
        fov = 0.92;
      } else {
        const fk = followRef.current && g.cars[followRef.current] ? followRef.current : playing ? myK : standings(all, T, g.laps)[0].id;
        const c = g.cars[fk] || all[0];
        const want = (c.hd != null ? c.hd : 0) - (c.drift * c.steer * 0.2);
        if (!g.cam || g.camFor !== c.id) g.cam = { yaw: want, x: c.wx, y: c.wy, z: c.wz }, g.camFor = c.id;
        const C = g.cam;
        let dy = want - C.yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
        C.yaw += dy * Math.min(1, dt * 4.2);
        const kk = Math.min(1, dt * 12);
        C.x += (c.wx - C.x) * kk; C.y += (c.wy - C.y) * Math.min(1, dt * 6); C.z += (c.wz - C.z) * kk;
        const fxv = Math.sin(C.yaw), fzv = Math.cos(C.yaw);
        const sp = clamp(c.v / 50, 0, 1.3);
        const backD = 7.2 + sp * 0.8, up = 2.65;
        camPos = [C.x - fxv * backD, C.y + up, C.z - fzv * backD];
        camAt = [C.x + fxv * 9, C.y + 1.05, C.z + fzv * 9];
        if (g.shake > 0) { g.shake = Math.max(0, g.shake - dt); const s2 = g.shake * 0.35; camPos[0] += (Math.random() - 0.5) * s2; camPos[1] += (Math.random() - 0.5) * s2; }
        fov = 0.98 + sp * 0.12 + (c.boostT > 0 ? 0.08 : 0);
        g.fovNow = (g.fovNow || fov) + (fov - (g.fovNow || fov)) * Math.min(1, dt * 3);
        fov = g.fovNow;
      }
      st.env.time = now / 1000;
      const VP = st.R.render({ env: st.env, cam: { pos: camPos, at: camAt, fov, shadowAt: [camAt[0], camAt[1] - 1, camAt[2]] }, items, parts });
      const W2 = cv.width / dpr, H2 = cv.height / dpr;
      for (const k of Object.keys(tagRefs.current)) {
        const el = tagRefs.current[k];
        if (!el) continue;
        const tp = tagPos[k];
        if (!tp || (k === myK && playing && ph !== 'menu')) { el.style.opacity = '0'; continue; }
        const q = m4.apply(VP, tp[0], tp[1], tp[2]);
        if (q[3] <= 0.5 || q[2] > 1 || Math.abs(q[0]) > 1.2 || Math.abs(q[1]) > 1.2) { el.style.opacity = '0'; continue; }
        const d = Math.hypot(tp[0] - camPos[0], tp[2] - camPos[2]);
        el.style.opacity = d > 140 ? '0' : '1';
        el.style.transform = `translate(${((q[0] * 0.5 + 0.5) * W2).toFixed(1)}px, ${((1 - (q[1] * 0.5 + 0.5)) * H2).toFixed(1)}px) translate(-50%, -100%) scale(${clamp(16 / Math.max(6, d), 0.62, 1).toFixed(2)})`;
      }
      if (speedRef.current) speedRef.current.textContent = String(Math.round((mineC && playing ? mineC.v : 0) * 3.6));
      if (meterRef.current && mineC) {
        const m = mineC.boostT > 0 ? 1 : mineC.meter;
        meterRef.current.setAttribute('stroke-dasharray', `${(m * 188.5).toFixed(1)} 400`);
        meterRef.current.setAttribute('stroke', mineC.boostT > 0 ? '#FFE15A' : m >= 0.3 ? '#FFB020' : 'rgba(255,255,255,0.55)');
      }
      const mc = miniRef.current;
      const live = racing || ph === 'count';
      if (mc && live && now - (g.miniAt || 0) > 120) {
        g.miniAt = now;
        drawMini(mc, T, all, myK, (k) => slotColor(k));
      }
      if (live && now - g.hudAt > 180) {
        g.hudAt = now;
        const ord = standings(all, T, g.laps);
        const meIdx = ord.findIndex((c) => c.id === (playing ? myK : ord[0] && ord[0].id));
        const cur = g.cars[myK];
        const lap = cur ? lapOf(cur, T, g.laps) : 1;
        const time = cur && cur.fin ? cur.fin : raceT;
        const order = ord.map((c) => c.id);
        setHud((h) => (h.pos === meIdx + 1 && h.lap === lap && Math.floor(h.time * 10) === Math.floor(time * 10) && h.order.join('|') === order.join('|') && h.fin === !!(cur && cur.fin) ? h : { pos: meIdx + 1, n: ord.length, lap, time, order, fin: !!(cur && cur.fin) }));
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tilt]);

  useEffect(() => () => { const g = G.current; if (g.eng) { g.eng.stop(); g.eng = null; } Sfx.stopAll(); }, []);
  useEffect(() => {
    const g = G.current;
    if (paused) g.pauseAt = performance.now();
    else if (g.pauseAt) { g.t0 += performance.now() - g.pauseAt; g.pauseAt = 0; }
  }, [paused]);
  useEffect(() => {
    const vis = () => { const hidden = document.visibilityState === 'hidden'; Sfx.pause(hidden); if (hidden && solo && phaseRef.current === 'race') setPaused(true); };
    document.addEventListener('visibilitychange', vis);
    return () => document.removeEventListener('visibilitychange', vis);
  }, []);

  const finish = () => { const g = G.current; if (g.eng) { g.eng.stop(); g.eng = null; } Sfx.stopAll(); onClose(); };
  const leave = () => { if ((phase === 'race' || phase === 'count') && !solo && !watch) { setLeaveAsk(true); return; } finish(); };
  useBackClose(true, () => { if (ctl) setCtl(false); else if (people) setPeople(false); else if (quick) setQuick(false); else if (leaveAsk) setLeaveAsk(false); else if (paused) setPaused(false); else if (phase === 'race' && solo) setPaused(true); else leave(); });
  const sendEmote = (e) => { setBubbles((p) => ({ ...p, [kindOf()]: { e, at: Date.now() } })); if (!solo) relay.send('emo', { e }); setQuick(false); Sfx.play('pop', { vol: 0.5 }); };
  useEffect(() => {
    const keysB = Object.keys(bubbles);
    if (!keysB.length) return undefined;
    const t = setTimeout(() => setBubbles((p) => { const n = {}; for (const k of Object.keys(p)) if (Date.now() - p[k].at < 2200) n[k] = p[k]; return n; }), 2300);
    return () => clearTimeout(t);
  }, [bubbles]);

  const press = (k, on) => (e) => {
    if (e && e.cancelable) e.preventDefault();
    if (on && e && e.currentTarget && e.pointerId != null) { try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} }
    if (k === 'b') { if (on) hold.current.b = true; return; }
    hold.current[k] = on;
    setPressed((p) => (p[k] === on ? p : { ...p, [k]: on }));
  };
  const [pressed, setPressed] = useState({});
  const btnZone = (k, label, size, children, style) => (
    <div role="button" aria-label={label} onPointerDown={press(k, true)} onPointerUp={press(k, false)} onPointerCancel={press(k, false)} onLostPointerCapture={press(k, false)} onContextMenu={(e) => e.preventDefault()}
      style={{ position: 'absolute', width: size, height: size, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'none', cursor: 'pointer', transform: `scale(${look.size}) ${pressed[k] ? 'scale(0.92)' : ''}`, opacity: 1 - look.see, transition: 'transform 0.06s', zIndex: 4, ...style }}>
      {children}
    </div>
  );

  const playingNow = inRace() && (phase === 'race' || phase === 'count');
  const talkOn = !solo && !watch;
  const hb = 38;
  const rowBtns = [
    talkOn && <GHudBtn key="mic" icon={relay.mic.on ? 'mic' : 'micoff'} on={relay.mic.on} size={hb} label={relay.mic.on ? 'Turn your mic off' : 'Turn your mic on'} onPress={relay.toggleMic} />,
    !solo && <GHudBtn key="ppl" icon="people" on={people} size={hb} label="Players and voice" badge={roster.length > 1 ? roster.length : null} onPress={() => { setQuick(false); setPeople(true); }} />,
    talkOn && <GHudBtn key="emo" icon="smile" on={quick} tone="#F5AE1E" size={hb} label="Emojis" onPress={() => setQuick((v) => !v)} />,
    playingNow && <GHudBtn key="gear" icon="gear" size={hb} label="Controls" onPress={() => { setQuick(false); if (solo) setPaused(true); setCtl(true); }} />,
    <GHudBtn key="x" icon={solo && phase === 'race' ? 'pause' : 'close'} size={hb} label={solo && phase === 'race' ? 'Pause' : 'Leave the race'} onPress={() => (solo && phase === 'race' ? setPaused(true) : leave())} />,
  ].filter(Boolean);
  const g0 = G.current;
  const raceIds = phase === 'menu' ? [] : g0.ids;
  const listOrder = hud.order.length ? hud.order : raceIds;
  const micOf = (k) => (k === kindOf() ? relay.mic.on : !!relay.mics[k]);

  return (
    <Portal>
      <div ref={GS.rootRef} style={{ position: 'fixed', left: 0, right: 0, top: 'var(--zvp-top, 0px)', height: 'var(--zvp-h, 100%)', zIndex: 90, background: '#9FC4E4', overflow: 'hidden', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', fontFamily: FONT, color: '#FFFFFF' }}>
        <div ref={wrapRef} style={GS.wrapStyle}>
          <canvas ref={cvRef} aria-label="Race" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2 }}>
            {(phase === 'menu' ? [] : raceIds).map((k) => (
              <div key={k} ref={(el) => { tagRefs.current[k] = el; }} style={{ position: 'absolute', left: 0, top: 0, opacity: 0, transformOrigin: '50% 100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, willChange: 'transform' }}>
                {bubbles[k] && <span style={{ fontSize: 26, lineHeight: 1, animation: 'zgk-pop 0.25s ease-out' }}>{bubbles[k].e}</span>}
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 9px 3px 6px', borderRadius: 11, background: 'rgba(10,14,26,0.66)', fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap' }}>
                  <span style={{ width: 9, height: 9, borderRadius: 5, background: slotColor(k), boxShadow: '0 0 0 1.5px #FFFFFF' }} />
                  {nameOf(k)}
                  {micOf(k) && !relay.muted[k] && <GIcon k="mic" size={12} color="#7BE05A" ink="rgba(0,0,0,0.3)" />}
                </span>
              </div>
            ))}
          </div>

          {(phase === 'race' || phase === 'count' || phase === 'done') && (
            <>
              <div style={{ position: 'absolute', left: left(10), top: top(8), display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-start', zIndex: 3, pointerEvents: 'none' }}>
                {inRace() && (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, textShadow: '0 2px 8px rgba(0,0,0,0.5)', lineHeight: 1 }}>
                    <span style={{ fontSize: 40, fontWeight: 900 }}>{hud.pos || 1}</span>
                    <span style={{ fontSize: 16, fontWeight: 900, marginBottom: 20 }}>{ordinal(hud.pos || 1).replace(/^\d+/, '')}</span>
                    <span style={{ fontSize: 16, fontWeight: 900, opacity: 0.85, marginBottom: 2 }}>{`/${hud.n || raceIds.length}`}</span>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 5 }}>
                  <GHudPanel style={{ height: 24, padding: '0 9px', display: 'flex', alignItems: 'center', fontSize: 12, fontWeight: 900, whiteSpace: 'nowrap' }}>{`Lap ${hud.lap} of ${laps}`}</GHudPanel>
                  <GHudPanel style={{ height: 24, padding: '0 9px', display: 'flex', alignItems: 'center', fontSize: 12, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{fmtRace(phase === 'count' ? 0 : hud.time)}</GHudPanel>
                </div>
                {land && listOrder.map((k, i) => (
                  <GHudPanel key={k} style={{ height: 21, padding: '0 8px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap', background: k === kindOf() ? 'rgba(255,194,61,0.92)' : undefined, color: k === kindOf() ? INK : '#FFFFFF', textShadow: k === kindOf() ? 'none' : undefined, minWidth: 92 }}>
                    <span style={{ width: 10, fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>
                    <span style={{ width: 9, height: 9, borderRadius: 5, background: slotColor(k), boxShadow: '0 0 0 1.4px #FFFFFF' }} />
                    <span style={{ flex: 1 }}>{nameOf(k)}</span>
                    {G.current.cars[k] && G.current.cars[k].fin ? <GIcon k="flag" size={11} color={k === kindOf() ? INK : '#FFFFFF'} ink="transparent" /> : micOf(k) && !relay.muted[k] ? <GIcon k="mic" size={11} color={k === kindOf() ? '#14532D' : '#7BE05A'} ink="transparent" /> : null}
                  </GHudPanel>
                ))}
              </div>
              <div style={{ position: 'absolute', right: right(10), top: top(8), display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 7, zIndex: 3 }}>
                <div style={{ display: 'flex', gap: 6 }}>{rowBtns}</div>
                <canvas ref={miniRef} aria-hidden="true" width={240} height={150} style={{ width: 120, height: 75, borderRadius: 12, background: 'rgba(10,14,26,0.45)', pointerEvents: 'none' }} />
              </div>
              {phase === 'count' && (
                <div aria-live="polite" style={{ position: 'absolute', left: '50%', top: top(14), transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 4, pointerEvents: 'none' }}>
                  <div style={{ display: 'flex', gap: 8, padding: '8px 11px', borderRadius: 16, background: 'rgba(10,14,26,0.66)' }}>
                    {[3, 2, 1].map((n) => <span key={n} style={{ width: 22, height: 22, borderRadius: 11, background: count && count <= n ? 'radial-gradient(circle at 40% 35%, #FF8A80, #E5192A)' : '#3A1214', boxShadow: count && count <= n ? '0 0 14px rgba(255,40,40,0.8)' : 'inset 0 0 0 1.5px rgba(255,255,255,0.15)' }} />)}
                  </div>
                  <span style={{ fontSize: 72, fontWeight: 900, lineHeight: 1, textShadow: '0 4px 20px rgba(0,0,0,0.45)' }}>{count || ''}</span>
                </div>
              )}
              {toast && <div key={toast.at} style={{ position: 'absolute', left: '50%', top: '30%', transform: 'translateX(-50%)', padding: '9px 18px', borderRadius: 18, background: 'rgba(10,14,26,0.6)', fontSize: 20, fontWeight: 900, whiteSpace: 'nowrap', zIndex: 4, pointerEvents: 'none', animation: 'zgk-pop 0.25s ease-out' }}>{toast.text}</div>}
              {inRace() && (
                <div style={{ position: 'absolute', left: '50%', bottom: bottom(10), transform: 'translateX(-50%)', display: 'flex', alignItems: 'baseline', gap: 4, zIndex: 3, pointerEvents: 'none', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                  <span ref={speedRef} style={{ fontSize: 34, fontWeight: 900, fontVariantNumeric: 'tabular-nums', minWidth: 60, textAlign: 'right' }}>0</span>
                  <span style={{ fontSize: 12, fontWeight: 800, opacity: 0.9 }}>km/h</span>
                </div>
              )}
              {inRace() && phase !== 'done' && !hud.fin && (
                <>
                  {!tilt && btnZone('l', 'Steer left', 72, <GIcon k="left" size={30} color="#FFFFFF" line stroke={2.4} />, { left: left(18), bottom: bottom(18), background: pressed.l ? 'rgba(255,255,255,0.28)' : 'rgba(10,14,26,0.32)', boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.7)', transformOrigin: '0 100%' })}
                  {!tilt && btnZone('r', 'Steer right', 72, <GIcon k="right" size={30} color="#FFFFFF" line stroke={2.4} />, { left: left(102), bottom: bottom(18), background: pressed.r ? 'rgba(255,255,255,0.28)' : 'rgba(10,14,26,0.32)', boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.7)', transformOrigin: '0 100%' })}
                  {btnZone('d', 'Hold to drift', 62, <span style={{ fontSize: 12.5, fontWeight: 900 }}>Drift</span>, { right: right(104), bottom: bottom(22), background: pressed.d ? 'rgba(255,255,255,0.3)' : 'rgba(10,14,26,0.4)', boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.8)', transformOrigin: '100% 100%' })}
                  {btnZone('b', 'Boost', 80, (
                    <>
                      <svg width="80" height="80" viewBox="0 0 80 80" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}><circle cx="40" cy="40" r="30" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="5" /><circle ref={meterRef} cx="40" cy="40" r="30" fill="none" stroke="#FFB020" strokeWidth="5" strokeLinecap="round" strokeDasharray="0 400" /></svg>
                      <span style={{ position: 'absolute', inset: 13, borderRadius: '50%', background: 'linear-gradient(#FF9F1C, #E5641E)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 900, boxShadow: '0 2px 10px rgba(255,140,30,0.45)' }}>Boost</span>
                    </>
                  ), { right: right(16), bottom: bottom(14), transformOrigin: '100% 100%' })}
                </>
              )}
              {!inRace() && phase !== 'done' && (
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: bottom(14), display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', padding: '0 14px', zIndex: 3 }}>
                  <GHudPanel style={{ height: 32, padding: '0 11px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 800 }}><GIcon k="eye" size={14} color="#CFE6FF" ink="rgba(0,0,0,0.3)" />Watching</GHudPanel>
                  {raceIds.filter((k) => !g0.bots.includes(k)).map((k) => <GPill key={k} small text={nameOf(k)} color={follow === k ? 'gold' : 'white'} onPress={() => setFollow(k)} height={38} />)}
                </div>
              )}
              {quick && (
                <div onPointerDown={(e) => e.stopPropagation()} style={{ position: 'absolute', right: right(10), top: top(8 + hb + 90), width: 'min(250px, calc(100% - 28px))', animation: 'zgk-pop 0.2s ease-out', zIndex: 6 }}>
                  <GPanel style={{ padding: 10, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 6 }}>
                    {EMOTES.map((e) => <button key={e} type="button" className="zgk-btn" aria-label={`Send ${e}`} {...pressProps(() => sendEmote(e))} style={{ height: 40, borderRadius: 14, border: 'none', background: 'rgba(255,255,255,0.1)', fontSize: 23, cursor: 'pointer' }}>{e}</button>)}
                  </GPanel>
                </div>
              )}
            </>
          )}

          {phase === 'menu' && (
            <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', touchAction: 'pan-x pan-y', padding: `${top(12)} ${right(16)} ${bottom(22)} ${left(16)}`, boxSizing: 'border-box', background: 'linear-gradient(90deg, rgba(10,14,26,0.72) 0%, rgba(10,14,26,0.45) 46%, rgba(10,14,26,0) 70%)', zIndex: 5 }}>
              <div style={{ maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <GBtn icon="close" color="white" size={42} fast={false} label={solo ? 'Leave' : 'Back to chat'} onPress={finish} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <GTitle text="Island Rally" size={34} color="#FFE15A" />
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.85)' }}>{solo ? 'Race five bots around the island' : 'Up to six friends race in 3D'}</div>
                  </div>
                </div>
                {failed && <GPanel style={{ padding: 12, fontSize: 13.5, fontWeight: 800, lineHeight: 1.45 }}>This phone could not start the 3D race. Try closing other apps, then open it again.</GPanel>}
                {!ready && !failed && <GChip style={{ gap: 8 }}><Spinner size={15} color="#FFFFFF" />Getting the island ready</GChip>}
                {!watch && (
                  <GPanel style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 900 }}>Your ride</div>
                    <div style={{ display: 'flex', gap: 6 }}>{CAR_KEYS.map((k) => <CarPick key={k} k={k} on={myCar === k} img={thumbs[k]} color={myColor} onPress={() => pickCar(k)} />)}</div>
                  </GPanel>
                )}
                {!solo && (
                  <GPanel style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 900, flex: 1 }}>{watch ? 'Watching' : `Racers ${roster.length} of 6`}</span>
                      {isHost && onInvite && roster.length < MAX_RACERS && <GPill small text="Invite" icon="plus" color="green" height={40} onPress={onInvite} />}
                    </div>
                    {roster.map((k, i) => {
                      const isMe = k === kindOf();
                      const off = !!relay.muted[k];
                      return (
                        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ width: 14, height: 14, borderRadius: 7, background: COLORS[i % COLORS.length], boxShadow: '0 0 0 2px #FFFFFF', flexShrink: 0 }} />
                          <span style={{ fontSize: 14.5, fontWeight: 800, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nameOf(k)}{k === (room && room.host) ? ', host' : ''}</span>
                          <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>{CARS[isMe ? myCar : carsOf[k] || 'sport'].name}</span>
                          {micOf(k) && <GIcon k="mic" size={16} color="#7BE05A" />}
                          {!isMe && !watch && <GBtn icon={off ? 'mute' : 'sound'} color={off ? 'red' : 'dark'} size={34} fast={false} label={off ? `Unmute ${nameOf(k)}` : `Mute ${nameOf(k)}`} onPress={() => relay.toggleMute(k)} />}
                        </div>
                      );
                    })}
                    {!watch && <GPill text={relay.mic.on ? 'Mic off' : 'Talk with mic'} icon={relay.mic.on ? 'micoff' : 'mic'} color={relay.mic.on ? 'white' : 'blue'} small wide onPress={relay.toggleMic} />}
                    {!watch && relay.mic.err && <div style={{ fontSize: 12.5, fontWeight: 800, color: '#FF9C9C' }}>{relay.mic.err}</div>}
                    {roster.length < 2 && <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}><Spinner size={16} color="#FFFFFF" />Waiting for friends to join</div>}
                    {watchers.length > 0 && <div style={{ fontSize: 12.5, fontWeight: 800, color: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', gap: 6 }}><GIcon k="eye" size={14} color="#CFE6FF" />{`Watching: ${watchers.map((w) => names[w] || 'Friend').join(', ')}`}</div>}
                    {isHost && (
                      <div role="button" tabIndex={0} onClick={() => { const v = !allowWatch; setAllowWatch(v); setWatchAllowed(v); kitTap(); }} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', paddingTop: 4 }}>
                        <span style={{ flex: 1, fontSize: 13.5, fontWeight: 800 }}>Let friends watch</span>
                        <span aria-hidden="true" style={{ width: 46, height: 28, borderRadius: 14, background: allowWatch ? '#F7C53A' : 'rgba(255,255,255,0.18)', position: 'relative', transition: 'background 0.2s' }}><span style={{ position: 'absolute', top: 3, left: allowWatch ? 21 : 3, width: 22, height: 22, borderRadius: 11, background: '#FFFFFF', transition: 'left 0.2s' }} /></span>
                      </div>
                    )}
                  </GPanel>
                )}
                {isHost && !watch && (
                  <GPanel style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 900, flex: 1 }}>Laps</span>
                      {[2, 3, 5].map((n) => <GPill key={n} small text={String(n)} color={laps === n ? 'gold' : 'white'} height={36} onPress={() => setLaps(n)} style={{ minWidth: 48 }} />)}
                    </div>
                    {!solo && (
                      <div role="button" tabIndex={0} onClick={() => { setFill((v) => !v); kitTap(); }} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                        <span style={{ flex: 1, fontSize: 13.5, fontWeight: 800 }}>Fill empty spots with bots</span>
                        <span aria-hidden="true" style={{ width: 46, height: 28, borderRadius: 14, background: fill ? '#F7C53A' : 'rgba(255,255,255,0.18)', position: 'relative', transition: 'background 0.2s' }}><span style={{ position: 'absolute', top: 3, left: fill ? 21 : 3, width: 22, height: 22, borderRadius: 11, background: '#FFFFFF', transition: 'left 0.2s' }} /></span>
                      </div>
                    )}
                    <div role="button" tabIndex={0} onClick={toggleTilt} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                      <span style={{ flex: 1, fontSize: 13.5, fontWeight: 800 }}>Tilt your phone to steer</span>
                      <span aria-hidden="true" style={{ width: 46, height: 28, borderRadius: 14, background: tilt ? '#F7C53A' : 'rgba(255,255,255,0.18)', position: 'relative', transition: 'background 0.2s' }}><span style={{ position: 'absolute', top: 3, left: tilt ? 21 : 3, width: 22, height: 22, borderRadius: 11, background: '#FFFFFF', transition: 'left 0.2s' }} /></span>
                    </div>
                    <GPill text={ready ? 'Start the race' : 'Getting ready'} icon="play" color="green" wide disabled={!ready || failed} onPress={startRace} />
                  </GPanel>
                )}
                {!isHost && !watch && (
                  <GPanel style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div role="button" tabIndex={0} onClick={toggleTilt} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                      <span style={{ flex: 1, fontSize: 13.5, fontWeight: 800 }}>Tilt your phone to steer</span>
                      <span aria-hidden="true" style={{ width: 46, height: 28, borderRadius: 14, background: tilt ? '#F7C53A' : 'rgba(255,255,255,0.18)', position: 'relative', transition: 'background 0.2s' }}><span style={{ position: 'absolute', top: 3, left: tilt ? 21 : 3, width: 22, height: 22, borderRadius: 11, background: '#FFFFFF', transition: 'left 0.2s' }} /></span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.78)' }}>{`${names[room && room.host] || 'The host'} starts the race`}</div>
                  </GPanel>
                )}
                {!watch && (
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,0.78)', lineHeight: 1.5, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>Steer with the arrows, hold Drift round corners to fill your boost, then tap Boost. Best lap so far: {Number(readPref(BEST_KEY(uid), '0')) ? fmtRace(Number(readPref(BEST_KEY(uid), '0'))) : 'none yet'}</div>
                )}
              </div>
            </div>
          )}

          {paused && phase === 'race' && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 20, background: 'rgba(10,8,24,0.5)', display: 'flex', padding: 12, overflowY: 'auto', touchAction: 'pan-x pan-y' }}>
              <GPanel style={{ margin: 'auto', width: '100%', maxWidth: 320, padding: '16px', display: 'flex', flexDirection: 'column', gap: 10, animation: 'zgk-pop 0.3s ease-out', boxSizing: 'border-box' }}>
                <GTitle text="Paused" size={28} />
                <GPill text="Resume" icon="play" color="green" wide onPress={() => setPaused(false)} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <GPill text="Restart" icon="replay" color="white" small wide onPress={() => { setPaused(false); toMenu(true); setTimeout(startRace, 50); }} style={{ flex: 1 }} />
                  <GPill text="Controls" icon="gear" color="white" small wide onPress={() => setCtl(true)} style={{ flex: 1 }} />
                </div>
                <GPill text="Leave" color="red" small wide onPress={finish} />
              </GPanel>
            </div>
          )}

          {phase === 'done' && result && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 20, background: 'rgba(10,8,24,0.42)', display: 'flex', padding: 12, overflowY: 'auto', touchAction: 'pan-x pan-y' }}>
              <GPanel style={{ margin: 'auto', width: '100%', maxWidth: 380, padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 10, animation: 'zgk-pop 0.35s ease-out', boxSizing: 'border-box' }}>
                <GTitle text={result.mine ? `You finished ${ordinal(result.mine)}` : 'Race over'} size={28} color={result.mine === 1 ? '#FFE15A' : '#FFFFFF'} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {result.list.map(([k, t], i) => (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 9px', borderRadius: 12, background: k === kindOf() ? 'rgba(255,194,61,0.22)' : 'rgba(255,255,255,0.06)' }}>
                      <span style={{ width: 22, fontSize: 14, fontWeight: 900 }}>{i + 1}</span>
                      <span style={{ width: 11, height: 11, borderRadius: 6, background: slotColor(k), boxShadow: '0 0 0 1.5px #FFFFFF' }} />
                      <span style={{ flex: 1, fontSize: 14, fontWeight: 800, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nameOf(k)}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: 'rgba(255,255,255,0.8)' }}>{t ? fmtRace(t) : 'Did not finish'}</span>
                    </div>
                  ))}
                </div>
                {result.best > 0 && <div style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.8)' }}>{`Your best lap ${fmtRace(result.best)}${!result.prev || result.best <= result.prev ? ', a new best' : ''}`}</div>}
                {isHost ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <GPill text="Race again" icon="replay" color="green" small wide onPress={() => { toMenu(true); setTimeout(startRace, 60); }} style={{ flex: 1 }} />
                    <GPill text="Lobby" color="white" small wide onPress={() => toMenu(false)} style={{ flex: 1 }} />
                  </div>
                ) : <div style={{ fontSize: 13.5, fontWeight: 800, color: 'rgba(255,255,255,0.75)' }}>{`${names[room && room.host] || 'The host'} picks what is next`}</div>}
                <GPill text={solo ? 'Leave' : 'Back to chat'} color="dark" small wide onPress={finish} />
              </GPanel>
            </div>
          )}

          {ctl && (
            <div onPointerDown={(e) => e.stopPropagation()} style={{ position: 'absolute', inset: 0, zIndex: 45, background: 'rgba(10,8,24,0.55)', display: 'flex', padding: 12, overflowY: 'auto', touchAction: 'pan-x pan-y' }}>
              <div style={{ margin: 'auto', width: '100%', display: 'flex', justifyContent: 'center' }}><GControlsPanel sideways wide={land} onClose={() => setCtl(false)} /></div>
            </div>
          )}
          <GNotices items={notes} style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: top(phase === 'menu' ? 64 : 92), width: 'min(52%, 420px)', zIndex: 30 }} />
          {people && !solo && (
            <Sheet title="Players and voice" text={relay.mic.on ? 'Your mic is on. Everyone in the race can hear you.' : 'Turn your mic on to talk while you race.'} onClose={() => setPeople(false)}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                {roster.map((k, i) => {
                  const isMe = k === kindOf();
                  const nm = nameOf(k);
                  const talk = micOf(k);
                  const off = !!relay.muted[k];
                  return (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', borderRadius: 14, background: 'rgba(255,255,255,0.06)' }}>
                      <span style={{ width: 14, height: 14, borderRadius: 7, background: COLORS[i % COLORS.length], boxShadow: '0 0 0 2px #FFFFFF' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14.5, fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nm}{k === (room && room.host) ? ', host' : ''}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: talk ? '#7BE05A' : 'rgba(255,255,255,0.55)' }}>{talk ? 'Mic on' : 'Mic off'}</div>
                      </div>
                      {!isMe && <GBtn icon={off ? 'mute' : 'sound'} color={off ? 'red' : 'dark'} size={40} fast={false} label={off ? `Unmute ${nm}` : `Mute ${nm}`} onPress={() => relay.toggleMute(k)} />}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                {!watch && <GPill text={relay.mic.on ? 'Mic off' : 'Mic on'} icon={relay.mic.on ? 'micoff' : 'mic'} color={relay.mic.on ? 'white' : 'blue'} small wide onPress={relay.toggleMic} style={{ flex: 1 }} />}
                <GPill text="Done" color="dark" small wide onPress={() => setPeople(false)} style={{ flex: 1 }} />
              </div>
            </Sheet>
          )}
          {leaveAsk && (
            <Sheet title="Leave the race?" text="Your friends can keep racing without you." onClose={() => setLeaveAsk(false)}>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <GPill text="Stay" color="white" small onPress={() => setLeaveAsk(false)} style={{ flex: 1 }} wide />
                <GPill text="Leave" color="red" small onPress={() => { setLeaveAsk(false); finish(); }} style={{ flex: 1 }} wide />
              </div>
            </Sheet>
          )}
        </div>
      </div>
    </Portal>
  );
}

const MINI = { key: null, cv: null, box: null };
function drawMini(mc, T, cars, myK, colorOf) {
  const W = mc.width, H = mc.height;
  if (MINI.key !== T) {
    const { minX, maxX, minZ, maxZ } = T.bounds;
    const pad = 16, s = Math.min((W - pad * 2) / (maxX - minX), (H - pad * 2) / (maxZ - minZ));
    const ox = (W - (maxX - minX) * s) / 2, oz = (H - (maxZ - minZ) * s) / 2;
    const P = (x, z) => [ox + (maxX - x) * s, oz + (maxZ - z) * s];
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const c = cv.getContext('2d');
    c.lineJoin = 'round'; c.lineCap = 'round';
    c.beginPath();
    T.S.forEach((p, i) => { if (i % 4) return; const [a, b] = P(p.x, p.z); if (!i) c.moveTo(a, b); else c.lineTo(a, b); });
    c.closePath();
    c.strokeStyle = 'rgba(255,255,255,0.92)'; c.lineWidth = 6; c.stroke();
    const st = P(T.S[0].x, T.S[0].z);
    c.fillStyle = '#FFFFFF'; c.fillRect(st[0] - 5, st[1] - 5, 10, 10);
    MINI.key = T; MINI.cv = cv; MINI.P = P;
  }
  const x = mc.getContext('2d');
  x.clearRect(0, 0, W, H);
  x.drawImage(MINI.cv, 0, 0);
  for (const c of cars) {
    if (c.wx == null) continue;
    const [a, b] = MINI.P(c.wx, c.wz);
    x.beginPath(); x.arc(a, b, c.id === myK ? 8 : 6, 0, Math.PI * 2);
    x.fillStyle = colorOf(c.id); x.fill();
    x.lineWidth = 2.4; x.strokeStyle = '#101418'; x.stroke();
  }
}

export function RaceInviteSheet({ friends, onClose, onInvite, already }) {
  injectKitCss();
  useBackClose(true, onClose);
  const [sel, setSel] = useState([]);
  const left = MAX_RACERS - 1 - (already || 0);
  const list = (friends || []).filter((p) => p && p.id && !p.is_bot);
  const toggle = (id) => { kitTap(); setSel((v) => (v.includes(id) ? v.filter((x) => x !== id) : v.length >= left ? v : [...v, id])); };
  return (
    <Portal>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 96, background: 'rgba(10,8,24,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT, color: '#FFFFFF' }}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, maxHeight: 'min(86vh, 640px)', display: 'flex', flexDirection: 'column', padding: '14px 14px calc(14px + env(safe-area-inset-bottom))', boxSizing: 'border-box', animation: 'zgk-pop 0.25s ease-out' }}>
          <GPanel style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex' }}>{COLORS.slice(0, 3).map((c, i) => <span key={c} style={{ width: 22, height: 22, borderRadius: 11, background: c, boxShadow: '0 0 0 2.5px #FFFFFF', marginLeft: i ? -7 : 0 }} />)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 17, fontWeight: 900 }}>Invite friends to race</div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,0.72)' }}>{`Pick up to ${left}. Each one gets an invite in your chat.`}</div>
              </div>
              <GBtn icon="close" color="white" size={38} fast={false} label="Close" onPress={onClose} />
            </div>
            <div style={{ overflowY: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '52vh', WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y' }}>
              {list.length === 0 && <div style={{ fontSize: 13.5, fontWeight: 700, color: 'rgba(255,255,255,0.75)', padding: '12px 4px' }}>Chat with someone first, then you can invite them here.</div>}
              {list.map((p) => {
                const on = sel.includes(p.id);
                return (
                  <div key={p.id} role="button" tabIndex={0} aria-pressed={on} onClick={() => toggle(p.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 16, background: on ? 'rgba(91,227,125,0.18)' : 'rgba(255,255,255,0.06)', cursor: 'pointer' }}>
                    <Avatar emoji={p.avatar} name={p.name} size={40} />
                    <span style={{ flex: 1, minWidth: 0, fontSize: 14.5, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                    <span aria-hidden="true" style={{ width: 26, height: 26, borderRadius: 13, background: on ? '#F7C53A' : 'transparent', boxShadow: on ? 'none' : 'inset 0 0 0 2px rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{on && <GIcon k="check" size={16} color={INK} ink="transparent" line stroke={3} />}</span>
                  </div>
                );
              })}
            </div>
            <GPill text={sel.length ? `Invite ${sel.length} and race` : 'Pick friends'} icon="play" color="green" wide disabled={!sel.length} onPress={() => onInvite(list.filter((p) => sel.includes(p.id)))} />
          </GPanel>
        </div>
      </div>
    </Portal>
  );
}
