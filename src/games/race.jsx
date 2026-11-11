import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, Portal, useBackClose, FONT, Spinner } from '../App.jsx';
import { useRoomLink } from './relay.jsx';
import { EMOTES, Sheet, injectCss, useGameChat, ChatSheet } from './livekit.jsx';
import { GBtn, GPill, GPanel, GChip, GTitle, GIcon, GHudBtn, GHudPanel, GNotices, useNotices, useWatchNotices, injectKitCss, kitTap, pressProps, maxDpr, INK, useCtlLook, useGameStage, GControlsPanel, GVolBars, GLobby, GSlot, GLobbySheet, GSwitchRow } from './gamekit.jsx';
import { Sfx } from './sfx.js';
import { setWatchAllowed, useLiveBeacon, useGamePrivacy } from './live.js';
import { createRenderer, m4, MeshBuilder } from './race3d.js';
import { buildTrack, buildWorld } from './racetrack.js';
import { MAPS, MAP_KEYS, bottleSpots } from './racemaps.js';
import { carMesh, wheelMesh, WHEELS, fxMeshes } from './racecars.js';
import { SkillIcon, NitroIcon, SteerArrow, PedalArt, skillFace, MapSelect } from './raceui.jsx';
import { CARS, CAR_KEYS, COLORS, BOT_NAMES, MAX_RACERS, LAPS, SKILLS, SKILL_KEYS, EN_MAX, BOTTLE_EN, BOTTLE_BACK, ROCKET_V, SPIN_ROCKET, SPIN_OIL, SLOW_SHOCK, SHIELD_T, mkCar, stepCar, airStep, launchCar, groundSlope, collide, botInput, botSkill, rocketStep, standings, lapOf, fmtRace, clamp } from './raceengine.js';

const CAR_PREF = 'zchat-race-car';
const TILT_PREF = 'zchat-race-tilt';
const MAP_PREF = 'zchat-race-map';
const MODE_PREF = 'zchat-race-mode';
const GFX_PREF = 'zchat-race-gfx';
const BEST_KEY = (uid, map) => (map && map !== 'coast' ? `zchat-race-best-${uid || 'me'}-${map}` : `zchat-race-best-${uid || 'me'}`);
const readPref = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch { return d; } };
const savePref = (k, v) => { try { localStorage.setItem(k, String(v)); } catch {} };
const ordinal = (n) => (n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`);
const SEND_MS = 100;
const num = (v, d = 0) => { const n = Number(v); return Number.isFinite(n) ? n : d; };
const lin = (h) => { const n = parseInt(h.slice(1), 16); return [((n >> 16) / 255) ** 2.2, (((n >> 8) & 255) / 255) ** 2.2, ((n & 255) / 255) ** 2.2]; };
const srgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };
const MODES = { race: 'Race', attack: 'Attack race' };
const GFX = [['auto', 'Auto'], ['best', 'Best'], ['fast', 'Fast']];
const validMap = (k) => (MAPS[k] ? k : 'coast');
const weakDevice = () => { try { return (navigator.hardwareConcurrency || 4) <= 4 || (navigator.deviceMemory || 4) <= 3; } catch { return false; } };
const mul = m4.mul;
const trans = (x, y, z) => m4.pose(x, y, z, 0);
const TMP = new Float32Array(16);
function wheelInto(out, a, x, y, z, yaw, spin) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw), c = Math.cos(spin), s = Math.sin(spin);
  const b = TMP;
  b[0] = cy; b[1] = 0; b[2] = -sy; b[3] = 0;
  b[4] = sy * s; b[5] = c; b[6] = cy * s; b[7] = 0;
  b[8] = sy * c; b[9] = -s; b[10] = cy * c; b[11] = 0;
  b[12] = x; b[13] = y; b[14] = z; b[15] = 1;
  for (let col = 0; col < 4; col++) for (let r = 0; r < 4; r++) out[col * 4 + r] = a[r] * b[col * 4] + a[4 + r] * b[col * 4 + 1] + a[8 + r] * b[col * 4 + 2] + a[12 + r] * b[col * 4 + 3];
  return out;
}

let WORLD = null;
function getWorld(key, cell = 8) {
  if (!WORLD || WORLD.key !== key) WORLD = { key, T: buildTrack(MAPS[key]), W: null };
  if (!WORLD.W) WORLD.W = buildWorld(WORLD.T, { cell });
  return WORLD;
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
    for (let k = 0; k < 32; k++) { const a0 = (k / 32) * Math.PI * 2, a1 = ((k + 1) / 32) * Math.PI * 2; fl.tri([0, 0, 0], [Math.cos(a1) * 4, 0, Math.sin(a1) * 4], [Math.cos(a0) * 4, 0, Math.sin(a0) * 4], '#D3D8E0', 0.2); }
    const floor = R.mesh(fl.build());
    const env = { sunDir: [0.48, 0.74, 0.47], sunCol: [2.2, 2.1, 1.95], skyCol: [0.44, 0.48, 0.56], gndCol: [0.28, 0.28, 0.3], fogCol: lin('#E6EBF2'), fogSun: srgb('#FFFFFF'), fogSunLin: lin('#FFFFFF'), horizon: srgb('#E9EEF5'), zenith: srgb('#7F9CC4'), fogDen: 0.0001, exposure: 0.95, time: 0, shadowRange: 5, clouds: 0 };
    for (const k of CAR_KEYS) {
      const mesh = R.mesh(carMesh(k, color));
      const model = m4.pose(0, 0, 0, 0.55);
      const wm = {};
      const items = [{ mesh: floor }, { mesh, cast: true, model }];
      WHEELS[k].list.forEach((e, idx) => {
        wm[idx] = R.mesh(wheelMesh({ r: e[3], w: e[4], seg: 20, spokes: WHEELS[k].spokes, rimCol: WHEELS[k].rim, caliper: WHEELS[k].caliper }));
        for (const sg of e[0] === 0 ? [0] : [-1, 1]) items.push({ mesh: wm[idx], model: mul(model, trans(sg * e[0], e[1], e[2])), cast: true });
      });
      R.render({ env, cam: { pos: [4.3, 2.0, 4.6], at: [0, 0.62, 0.1], fov: 0.58, shadowAt: [0, 0, 0] }, items });
      out[k] = cv.toDataURL('image/png');
      R.drop(mesh); for (const m of Object.values(wm)) R.drop(m);
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

function CarPick({ k, on, img, color, onPress, mini }) {
  if (mini) {
    return (
      <button type="button" className="zgk-btn" aria-label={`Drive the ${CARS[k].name.toLowerCase()}`} aria-pressed={on} onClick={(e) => { e.stopPropagation(); onPress(); }}
        style={{ flex: '1 1 0', minWidth: 0, border: 'none', padding: '4px 4px 5px', borderRadius: 12, cursor: 'pointer', background: on ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.08)', boxShadow: on ? `0 0 0 2.5px ${color}` : 'inset 0 0 0 1px rgba(255,255,255,0.12)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, fontFamily: FONT }}>
        {img ? <img src={img} alt="" draggable={false} style={{ width: '100%', maxWidth: 96, aspectRatio: '1.7', objectFit: 'cover', borderRadius: 8, display: 'block' }} /> : <div style={{ width: '100%', aspectRatio: '1.7', borderRadius: 8, background: 'rgba(255,255,255,0.12)' }} />}
        <span style={{ fontSize: 11.5, fontWeight: 900, color: on ? INK : '#FFFFFF', whiteSpace: 'nowrap' }}>{CARS[k].name}</span>
      </button>
    );
  }
  return (
    <button type="button" className="zgk-btn" aria-label={`Drive the ${CARS[k].name.toLowerCase()}`} aria-pressed={on} onClick={(e) => { e.stopPropagation(); onPress(); }}
      style={{ flex: '1 1 0', minWidth: 0, border: 'none', padding: '6px 4px 8px', borderRadius: 16, cursor: 'pointer', background: on ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.1)', boxShadow: on ? `0 0 0 3px ${color}` : 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, fontFamily: FONT }}>
      {img ? <img src={img} alt="" draggable={false} style={{ width: '100%', maxWidth: 120, aspectRatio: '1.6', objectFit: 'cover', borderRadius: 10, display: 'block' }} /> : <div style={{ width: '100%', aspectRatio: '1.6', borderRadius: 10, background: 'rgba(255,255,255,0.12)' }} />}
      <span style={{ fontSize: 12.5, fontWeight: 900, color: on ? INK : '#FFFFFF' }}>{CARS[k].name}</span>
    </button>
  );
}

function Seg({ value, items, onPick, disabled }) {
  return (
    <div role="radiogroup" style={{ display: 'flex', gap: 4, padding: 3, borderRadius: 13, background: 'rgba(0,0,0,0.28)' }}>
      {items.map(([k, label]) => (
        <button key={k} type="button" role="radio" aria-checked={value === k} disabled={disabled && value !== k} onClick={(e) => { e.stopPropagation(); if (!disabled) onPick(k); }}
          style={{ flex: 1, minWidth: 0, height: 34, border: 'none', borderRadius: 10, padding: '0 8px', fontFamily: FONT, fontSize: 13, fontWeight: 900, cursor: disabled ? 'default' : 'pointer', background: value === k ? 'linear-gradient(180deg, #FFD84E 0%, #F2B11F 100%)' : 'transparent', color: value === k ? INK : 'rgba(255,255,255,0.86)', whiteSpace: 'nowrap', opacity: disabled && value !== k ? 0.45 : 1 }}>
          {label}
        </button>
      ))}
    </div>
  );
}

const Chevron = ({ dir }) => (
  <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true" style={{ display: 'block', transform: dir === 'r' ? 'scaleX(-1)' : 'none' }}>
    <path d="M23 9 L12 20 L23 31" fill="none" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M31 13 L24 20 L31 27" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function RaceGamePage({ solo = false, room, me, myId, onClose, onInvite, watch = false }) {
  injectCss(); injectKitCss();
  const uid = solo ? 'me' : myId;
  const isHost = solo || (room && room.host === myId);
  const myFirst = String((me && me.name) || 'You').split(' ')[0];
  const [myCar, setMyCar] = useState(() => (CARS[readPref(CAR_PREF, 'sport')] ? readPref(CAR_PREF, 'sport') : 'sport'));
  const meta = { n: myFirst, a: me && me.avatar, w: watch ? 1 : 0, c: myCar };
  const relay = useRoomLink({ id: solo || !room ? null : `race-${room.rm}`, myId, enabled: !solo && !!room, meta, fast: ['pl', 'bt'], audio: !watch });
  const [phase, setPhase] = useState('menu');
  const [ready, setReady] = useState(false);
  const [mapKey, setMapKey] = useState(() => (isHost ? validMap(readPref(MAP_PREF, 'coast')) : 'coast'));
  const [mode, setMode] = useState(() => (isHost && readPref(MODE_PREF, 'race') === 'attack' ? 'attack' : 'race'));
  const [gfx, setGfx] = useState(() => { const v = readPref(GFX_PREF, 'auto'); return v === 'best' || v === 'fast' ? v : 'auto'; });
  const [roster, setRoster] = useState(solo ? ['me'] : [room && room.host].filter(Boolean));
  const [names, setNames] = useState({});
  const [carsOf, setCarsOf] = useState({});
  const [watchers, setWatchers] = useState([]);
  const [laps, setLaps] = useState(LAPS);
  const [fill, setFill] = useState(true);
  const [hud, setHud] = useState({ pos: 1, n: 1, lap: 1, time: 0, order: [], fin: false, en: 0, cd: {}, drift: 0, warn: false });
  const [count, setCount] = useState(0);
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState(null);
  const [paused, setPaused] = useState(false);
  const [leaveAsk, setLeaveAsk] = useState(false);
  const [quick, setQuick] = useState(false);
  const [people, setPeople] = useState(false);
  const [ctl, setCtl] = useState(false);
  const [mapSheet, setMapSheet] = useState(false);
  const [optSheet, setOptSheet] = useState(false);
  const [follow, setFollow] = useState(null);
  const gamePriv = useGamePrivacy();
  const allowWatch = gamePriv.show && gamePriv.watch;
  const setAllowWatch = () => {};
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
  const gaugeRef = useRef(null);
  const meterRef = useRef(null);
  const enRef = useRef(null);
  const enTxtRef = useRef(null);
  const tagRefs = useRef({});
  const RR = useRef(null);
  const G = useRef({ cars: {}, ids: [], bots: [], rid: '', t0: 0, goAt: 0, fins: {}, sendAt: 0, botAt: 0, hudAt: 0, cam: null, parts: [], fx: [], meshes: new Map(), wheelMeshes: {}, net: {}, endAt: 0, resAt: 0, lapSeen: 0, budget: { avg: 16, n: 0, tier: 0, set: false }, eng: null, laps: LAPS, botMeta: {}, mode: 'race', map: 'coast', rockets: [], oils: [], bottles: [], skillQ: [], nonce: 0, hits: 0, warnAt: 0 });
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
  const modeRef = useRef(mode); modeRef.current = mode;
  const mapRef = useRef(mapKey); mapRef.current = mapKey;
  const gfxRef = useRef(gfx); gfxRef.current = gfx;
  const metaRef = useRef({});
  const joinOrder = useRef([]);
  const toastT = useRef(0);
  const rosterSeen = useRef({ list: null, at: Date.now(), bye: new Set() });
  const kindOf = () => (solo ? 'me' : myId);
  const inRace = () => G.current.ids.includes(kindOf()) && !watch;
  if (typeof window !== 'undefined' && window.__zfake) window.__zrace = { T: () => (RR.current ? RR.current.T : null), hitMe: (k) => { const c = G.current.cars[kindOf()]; if (c) applyHitRef.current(c, k, 'bot1', true); }, G: () => G.current, phase: () => phaseRef.current, hold: () => hold.current, roster: () => rosterRef.current, total: () => (RR.current && RR.current.T ? RR.current.T.total : 0), skill: (k) => G.current.skillQ.push(k), map: () => (RR.current ? RR.current.key : null), mode: () => G.current.mode, drawn: () => (RR.current ? RR.current.R.drawn() : 0), tier: () => G.current.budget.tier };

  const say = (text, sec = 2.2) => { setToast({ text, at: Date.now() }); clearTimeout(toastT.current); toastT.current = setTimeout(() => setToast(null), sec * 1000); };
  const nameOf = (k) => (k === kindOf() ? 'You' : G.current.botMeta[k] ? G.current.botMeta[k].n : names[k] || 'Friend');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatNew, setChatNew] = useState(0);
  const chat = useGameChat(solo || watch ? null : relay, nameOf, (s) => { pushNote(s, 'chat'); setChatNew((n) => n + 1); });
  const nameRef = (k) => (k === kindOf() ? 'You' : G.current.botMeta[k] ? G.current.botMeta[k].n : namesRef.current[k] || 'Friend');
  const slotColor = (k) => { const i = G.current.ids.indexOf(k); return COLORS[(i >= 0 ? i : Math.max(0, rosterRef.current.indexOf(k))) % COLORS.length]; };
  const myColor = COLORS[Math.max(0, roster.indexOf(kindOf())) % COLORS.length];

  const ensureMap = (key) => {
    const st = RR.current;
    if (!st) return false;
    if (st.key === key) return true;
    const { T, W } = getWorld(key, G.current.budget.tier >= 2 ? 10 : 8);
    for (const it of st.world) st.R.drop(it.mesh);
    const world = [{ mesh: st.R.mesh(W.ring) }];
    if (W.water.length) world.push({ mesh: st.R.mesh(W.water) });
    for (const t of W.ground) world.push({ mesh: st.R.mesh(t.data), bs: t.bs });
    for (const t of W.road) world.push({ mesh: st.R.mesh(t.data), bs: t.bs });
    for (const t of W.props) world.push({ mesh: st.R.mesh(t.data), bs: t.bs, cast: true });
    st.world = world; st.T = T; st.key = key; st.glows = W.glows;
    st.env = MAPS[key].env(T); st.env.time = 0;
    st.env.baseFog = st.env.fogDen;
    if (G.current.budget.tier >= 2) { st.env.shadows = false; st.env.fogDen = st.env.baseFog * 1.35; }
    st.bottleSpots = bottleSpots(T);
    WORLD.W = null;
    G.current.menuKey = null;
    return true;
  };

  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return undefined;
    const g = G.current;
    const pref = gfxRef.current;
    g.budget.tier = pref === 'fast' || window.__zraceLow ? 2 : pref === 'best' ? 0 : weakDevice() ? 1 : 0;
    let R = null;
    try { R = createRenderer(cv, { shadowSize: g.budget.tier === 0 ? 2048 : 1024 }); } catch { R = null; }
    if (!R) { setFailed(true); return undefined; }
    let fxm = null;
    try { const F = fxMeshes(); fxm = { rocket: R.mesh(F.rocket), bottle: R.mesh(F.bottle), shield: R.mesh(F.shield), oil: R.mesh(F.oil) }; } catch { fxm = null; }
    RR.current = { R, T: null, key: null, world: [], env: null, glows: new Float32Array(0), fx: fxm, bottleSpots: [] };
    const t = setTimeout(() => { try { ensureMap(mapRef.current); setReady(true); } catch { setFailed(true); } }, 60);
    return () => {
      clearTimeout(t);
      RR.current = null;
      g.meshes = new Map(); g.wheelMeshes = {};
      try { R.dispose(); } catch {}
      setTimeout(() => { if (!cv.isConnected) R.lose(); }, 0);
    };
  }, []);
  useEffect(() => {
    const st = RR.current;
    if (!st || !st.key || st.key === mapKey || phaseRef.current !== 'menu') return undefined;
    setReady(false);
    const t = setTimeout(() => { try { ensureMap(mapKey); setReady(true); } catch { setFailed(true); } }, 40);
    return () => clearTimeout(t);
  }, [mapKey]);
  useEffect(() => {
    const t = setTimeout(() => setThumbs(carThumbs(myColor)), 120);
    return () => clearTimeout(t);
  }, [myColor]);

  const meshFor = (type, color) => {
    const st = RR.current;
    if (!st) return null;
    const k = `${type}|${color}`;
    const M = G.current.meshes;
    if (!M.has(k)) M.set(k, st.R.mesh(carMesh(type, color)));
    return M.get(k);
  };
  const wheelsFor = (type) => {
    const st = RR.current;
    if (!st) return null;
    const W = G.current.wheelMeshes;
    if (!W[type]) {
      const def = WHEELS[type] || WHEELS.sport;
      const seg = G.current.budget.tier >= 2 ? 16 : 24;
      W[type] = def.list.map((e) => st.R.mesh(wheelMesh({ r: e[3], w: e[4], seg, spokes: def.spokes, rimCol: def.rim, caliper: def.caliper })));
    }
    return W[type];
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
    const mk = validMap(cfg.map || mapRef.current);
    if (mk !== mapRef.current) setMapKey(mk);
    try { ensureMap(mk); } catch {}
    const st = RR.current;
    g.rid = cfg.rid; g.ids = cfg.ids.slice(); g.laps = cfg.laps || LAPS;
    g.mode = cfg.mode === 'attack' ? 'attack' : 'race'; g.map = mk;
    if (g.mode !== modeRef.current) setMode(g.mode);
    g.cars = {}; g.fins = {}; g.parts = []; g.fx = []; g.net = {}; g.endAt = 0; g.resAt = 0; g.lapSeen = 0;
    g.rockets = []; g.oils = []; g.skillQ = []; g.hits = 0; g.warnAt = 0;
    g.bottles = (st && st.bottleSpots ? st.bottleSpots : []).map((b) => ({ ...b, took: {} }));
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
    setResult(null); setPaused(false); setQuick(false); setFollow(null); setMapSheet(false);
    setLaps(g.laps);
    setHud({ pos: Math.max(1, cfg.ids.indexOf(kindOf()) + 1), n: cfg.ids.length, lap: 1, time: 0, order: cfg.ids.slice(), fin: false, en: g.cars[kindOf()] ? g.cars[kindOf()].en : 0, cd: {}, drift: 0, warn: false });
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
    const cfg = { rid: `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`, ids, cars, bots, laps, in: 3600, map: mapRef.current, mode: modeRef.current };
    if (!solo) { setRoster(ids.filter((k) => !k.startsWith('bot'))); relay.send('go', cfg); }
    beginRace(cfg);
  };
  const toMenu = (quiet) => {
    const g = G.current;
    g.ids = []; g.cars = {}; g.rockets = []; g.oils = [];
    setPhase('menu'); setResult(null); setCount(0);
    if (g.eng) g.eng.set(0, false, 0, false);
    if (!solo && isHost && !quiet) relay.send('menu', {});
  };
  const finishUp = (order) => {
    const g = G.current;
    if (phaseRef.current === 'done') return;
    const list = order || standings(Object.values(g.cars)).map((c) => [c.id, c.fin || 0]);
    const mine = list.findIndex(([k]) => k === kindOf());
    const meC = g.cars[kindOf()];
    const bk = BEST_KEY(uid, g.map);
    const prev = Number(readPref(bk, '0')) || 0;
    if (meC && meC.lapBest && (!prev || meC.lapBest < prev)) savePref(bk, meC.lapBest.toFixed(3));
    setResult({ list, mine: mine >= 0 ? mine + 1 : 0, best: meC ? meC.lapBest : 0, prev, hits: g.mode === 'attack' ? g.hits : -1, map: g.map });
    setPhase('done');
    if (mine === 0) { Sfx.play('win', { vol: 0.8 }); try { window.dispatchEvent(new CustomEvent('zchat-screen-fx', { detail: 'confetti' })); } catch {} }
  };

  const spawnBurst = (x, y, z, n, type, speed, life, size) => {
    const P = G.current.parts;
    const cap = [340, 240, 140][G.current.budget.tier] || 200;
    for (let k = 0; k < n && P.length < cap; k++) {
      const a = Math.random() * Math.PI * 2, e = (Math.random() - 0.3) * 1.2;
      const sp = speed * (0.4 + Math.random() * 0.6);
      P.push({ x, y, z, vx: Math.cos(a) * Math.cos(e) * sp, vy: Math.abs(Math.sin(e)) * sp + speed * 0.2, vz: Math.sin(a) * Math.cos(e) * sp, life: 0, max: life * (0.6 + Math.random() * 0.6), s0: size * 0.6, s1: size * (type === 4 ? 0.3 : 1.6), a0: type === 4 ? 1 : 0.8, type, g: type === 4 ? 9 : 0 });
    }
  };
  const boom = (c, big = true) => {
    const st = RR.current;
    if (!st || !st.T || !c) return;
    const g = G.current;
    const now = performance.now();
    g.boomAt = g.boomAt || {};
    if (now - (g.boomAt[c.id] || 0) < 1200) return;
    g.boomAt[c.id] = now;
    const p = st.T.at(c.s, c.x);
    spawnBurst(p.x, p.y + 0.9, p.z, big ? 16 : 8, 1, 7, 0.55, 1.1);
    spawnBurst(p.x, p.y + 1.1, p.z, big ? 10 : 5, 5, 3, 1.2, 1.4);
    spawnBurst(p.x, p.y + 0.8, p.z, big ? 10 : 6, 4, 11, 0.6, 0.35);
  };
  const crashCar = (c, k, by) => {
    const side = (String(by || '').charCodeAt(0) + Math.floor(c.s)) % 2 ? 1 : -1;
    if (k === 'rocket') { c.spin = SPIN_ROCKET; c.spinMax = SPIN_ROCKET; c.spinTurns = 2; c.v *= 0.5; c.boostT = 0; c.smokeT = 2.6; launchCar(c, 9.2, side, side * 3.6); }
    else if (k === 'oil') { c.spin = SPIN_OIL * 1.3; c.spinMax = SPIN_OIL * 1.3; c.spinTurns = 4; c.v *= 0.78; c.slide = side * 5.2; }
    else if (k === 'shock') { c.slow = SLOW_SHOCK; c.zapT = 1.1; launchCar(c, 3.4, 0, 0); }
  };
  const applyHitRef = useRef(null);
  const applyHit = (c, k, by, local) => {
    const g = G.current;
    if (!c || c.fin) return false;
    let blocked = false;
    if (c.shield > 0) { c.shield = 0; blocked = true; }
    else crashCar(c, k, by);
    if (local && !solo) relay.send('hit', { r: g.rid, id: c.id, k, b: blocked ? 1 : 0, by });
    hitFx(c, k, by, blocked);
    return !blocked;
  };
  applyHitRef.current = applyHit;
  const hitFx = (c, k, by, blocked) => {
    const g = G.current;
    const myK = kindOf();
    if (k === 'rocket') boom(c, !blocked);
    if (blocked) { const st = RR.current; if (st && st.T) { const p = st.T.at(c.s, c.x); spawnBurst(p.x, p.y + 1, p.z, 12, 6, 6, 0.5, 0.6); } }
    if (c.id === myK) {
      Sfx.play(blocked ? 'shield' : k === 'shock' ? 'shock' : 'hurt', { vol: 0.8 });
      if (!blocked) { g.shake = Math.max(g.shake || 0, k === 'rocket' ? 0.5 : 0.3); try { navigator.vibrate && navigator.vibrate(k === 'rocket' ? 60 : 30); } catch {} }
      say(blocked ? 'Your shield blocked it' : k === 'rocket' ? `Hit by ${nameRef(by)}` : k === 'oil' ? 'You slid on oil' : `Shocked by ${nameRef(by)}`, 1.6);
    } else if (by === myK && !blocked) {
      g.hits += 1;
      Sfx.play('combo', { vol: 0.6 });
      say(`You hit ${nameRef(c.id)}`, 1.4);
    } else if (k === 'rocket') Sfx.play('break', { vol: 0.35 });
  };
  const spawnSkill = (id, k, s, x, tg, n) => {
    const g = G.current;
    const c = g.cars[id];
    if (k === 'rocket') {
      g.rockets.push({ n, by: id, tg: tg && g.cars[tg] ? tg : null, s: s + 2.4, x, v: ROCKET_V, life: 3.6 });
      Sfx.play('fireball', { vol: id === kindOf() ? 0.7 : 0.35 });
      if (tg === kindOf()) { g.warnAt = performance.now(); Sfx.play('alert', { vol: 0.6 }); }
    } else if (k === 'oil') {
      g.oils.push({ n, by: id, s: s - 3.2, x, at: performance.now(), until: performance.now() + 14000, hit: {} });
      Sfx.play('poof', { vol: id === kindOf() ? 0.6 : 0.3 });
    } else if (k === 'shield') {
      if (c) c.shield = SHIELD_T;
      Sfx.play('shield', { vol: id === kindOf() ? 0.7 : 0.3 });
    } else if (k === 'shock') {
      const st = RR.current;
      if (st && st.T) { const p = st.T.at(s, x); for (let q = 0; q < 26; q++) { const a = (q / 26) * Math.PI * 2; g.parts.push({ x: p.x, y: p.y + 0.8, z: p.z, vx: Math.cos(a) * 26, vy: 0.6, vz: Math.sin(a) * 26, life: 0, max: 0.7, s0: 1.1, s1: 2.2, a0: 0.9, type: 6 }); } }
      Sfx.play('shock', { vol: id === kindOf() ? 0.8 : 0.45 });
      const myK = kindOf();
      for (const o of Object.values(g.cars)) {
        if (o.id === id || o.fin) continue;
        const mine = o.id === myK && !watch;
        const bot = isHost && g.bots.includes(o.id);
        if (!mine && !bot) continue;
        if (Math.abs(o.s - s) < 20 && Math.abs(o.x - x) < 11) applyHit(o, 'shock', id, true);
      }
    }
    void n;
  };
  const castSkill = (id, k, tg) => {
    const g = G.current;
    const c = g.cars[id];
    if (!c || c.fin || c.spin > 0) return false;
    const S0 = SKILLS[k];
    if (!S0 || c.en < S0.cost || c.cd[k] > 0) return false;
    c.en -= S0.cost; c.cd[k] = S0.cd;
    let target = tg || null;
    if (k === 'rocket' && !target) {
      let best = 1e9;
      for (const o of Object.values(g.cars)) { if (o.id === id || o.fin) continue; const ds = o.s - c.s; if (ds > 4 && ds < 140 && ds < best) { best = ds; target = o.id; } }
    }
    const n = `${id.slice(0, 4)}${(g.nonce += 1)}`;
    spawnSkill(id, k, c.s, c.x, target, n);
    if (!solo) relay.send('sk', { r: g.rid, id, k, s: +c.s.toFixed(2), x: +c.x.toFixed(2), tg: target, n });
    return true;
  };

  useEffect(() => {
    if (solo || !room) return undefined;
    const cleanBots = (list) => (Array.isArray(list) ? list.filter((b) => b && typeof b.id === 'string').slice(0, MAX_RACERS).map((b) => ({ id: b.id, n: String(b.n || 'Bot').slice(0, 20), c: b.c, sk: clamp(num(b.sk, 0.95), 0.8, 1) })) : []);
    const offs = [
      relay.on('*', (m) => { if (m.m) { metaRef.current[m.from] = m.m; setNames((p) => (p[m.from] === m.m.n ? p : { ...p, [m.from]: m.m.n })); if (m.m.c && CARS[m.m.c]) setCarsOf((p) => (p[m.from] ? p : { ...p, [m.from]: m.m.c })); } if (!joinOrder.current.includes(m.from)) joinOrder.current.push(m.from); }),
      relay.on('roster', (m) => {
        if (isHost || !Array.isArray(m.ids)) return;
        setRoster(m.ids.slice(0, MAX_RACERS));
        if (m.nm) setNames((p) => ({ ...p, ...m.nm }));
        if (m.cs) setCarsOf((p) => ({ ...p, ...m.cs }));
        if (m.lp) setLaps(clamp(Math.round(num(m.lp, LAPS)), 1, 9));
        if (typeof m.fl === 'number') setFill(!!m.fl);
        if (typeof m.mp === 'string' && MAPS[m.mp] && phaseRef.current === 'menu') setMapKey(m.mp);
        if (m.md === 'race' || m.md === 'attack') setMode(m.md);
        if (m.cfg && phaseRef.current === 'menu' && !G.current.ids.length && typeof m.cfg.rid === 'string' && Array.isArray(m.cfg.ids)) beginRace({ rid: m.cfg.rid, ids: m.cfg.ids.filter((k) => typeof k === 'string').slice(0, MAX_RACERS), cars: m.cfg.cars && typeof m.cfg.cars === 'object' ? m.cfg.cars : {}, bots: cleanBots(m.cfg.bots), laps: clamp(Math.round(num(m.cfg.laps, LAPS)), 1, 9), in: 600, map: validMap(m.cfg.map), mode: m.cfg.mode });
      }),
      relay.on('go', (m) => { if (isHost || !m || !Array.isArray(m.ids) || typeof m.rid !== 'string') return; beginRace({ rid: m.rid, ids: m.ids.filter((k) => typeof k === 'string').slice(0, MAX_RACERS), cars: m.cars && typeof m.cars === 'object' ? m.cars : {}, bots: cleanBots(m.bots), laps: clamp(Math.round(num(m.laps, LAPS)), 1, 9), in: clamp(num(m.in, 3600), 300, 6000), map: validMap(m.map), mode: m.mode }); }),
      relay.on('menu', () => { if (!isHost) toMenu(true); }),
      relay.on('pl', (m) => {
        const g = G.current;
        if (!m || m.r !== g.rid) return;
        const c = g.cars[m.from];
        if (!c || m.from === kindOf()) return;
        if (typeof m.at === 'number') { if (m.at < (c.netAt || 0)) return; c.netAt = m.at; }
        g.net[m.from] = { s: num(m.s, c.s), x: clamp(num(m.x), -20, 20), v: clamp(num(m.v), 0, 90), y: clamp(num(m.y), -1.2, 1.2), at: performance.now() };
        c.drift = clamp(num(m.d), 0, 1); c.boostT = m.b ? 0.3 : 0; c.steer = clamp(num(m.st), -1, 1); c.brake = m.k ? 1 : 0;
        const sp = clamp(num(m.sp), 0, 3); if (sp > 0 && c.spin <= 0) c.spinMax = Math.max(sp, 0.9); c.spin = sp;
        c.shield = clamp(num(m.sh), 0, SHIELD_T);
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
          const sp = clamp(num(a[8]), 0, 3); if (sp > 0 && c.spin <= 0) c.spinMax = Math.max(sp, 0.9); c.spin = sp;
          c.shield = clamp(num(a[9]), 0, SHIELD_T);
        }
      }),
      relay.on('sk', (m) => {
        const g = G.current;
        if (!m || m.r !== g.rid || g.mode !== 'attack' || !SKILLS[m.k]) return;
        const id = typeof m.id === 'string' && g.cars[m.id] ? m.id : m.from;
        if (id === kindOf() || (g.bots.includes(id) && m.from !== (room && room.host))) return;
        if (!g.cars[id]) return;
        spawnSkill(id, m.k, num(m.s, g.cars[id].s), clamp(num(m.x), -20, 20), typeof m.tg === 'string' ? m.tg : null, String(m.n || ''));
      }),
      relay.on('hit', (m) => {
        const g = G.current;
        if (!m || m.r !== g.rid || typeof m.id !== 'string') return;
        const c = g.cars[m.id];
        if (!c || m.id === kindOf()) return;
        const k = m.k === 'oil' || m.k === 'shock' ? m.k : 'rocket';
        const blocked = !!m.b;
        if (blocked) c.shield = 0;
        else crashCar(c, k, typeof m.by === 'string' ? m.by : '');
        if (k === 'rocket') g.rockets = g.rockets.filter((r) => !(r.tg === m.id && Math.abs(r.s - c.s) < 30));
        hitFx(c, k, typeof m.by === 'string' ? m.by : '', blocked);
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
      const cfg = racing && g.ids.length ? { rid: g.rid, ids: g.ids, cars: Object.fromEntries(g.ids.map((k) => [k, g.cars[k] ? g.cars[k].type : 'sport'])), bots: g.bots.map((k) => ({ id: k, n: g.botMeta[k] ? g.botMeta[k].n : 'Bot', c: g.cars[k] ? g.cars[k].type : 'sport', sk: g.botMeta[k] ? g.botMeta[k].skill : 0.95 })), laps: g.laps, map: g.map, mode: g.mode } : null;
      relay.send('roster', { ids: next, nm, cs, lp: laps, fl: fill ? 1 : 0, mp: mapRef.current, md: modeRef.current, cfg });
    };
    tick();
    const iv = setInterval(tick, 1500);
    return () => clearInterval(iv);
  }, [relay.peers, allowWatch, laps, fill, mapKey, mode]);
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
  const pickMap = (k) => { if (!isHost || !MAPS[k]) return; kitTap(); setMapKey(k); savePref(MAP_PREF, k); setMapSheet(false); };
  const pickMode = (k) => { if (!isHost || !MODES[k]) return; kitTap(); setMode(k); savePref(MODE_PREF, k); };
  const pickGfx = (k) => {
    kitTap(); setGfx(k); savePref(GFX_PREF, k);
    const g = G.current, st = RR.current;
    g.budget.tier = k === 'fast' ? 2 : k === 'best' ? 0 : weakDevice() ? 1 : 0; g.budget.n = 0; g.budget.avg = 16;
    if (st && st.env) { st.env.shadows = g.budget.tier < 2; st.env.fogDen = st.env.baseFog * (g.budget.tier >= 2 ? 1.35 : 1); }
  };

  useEffect(() => {
    const kd = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      const k = e.key.toLowerCase();
      if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'a', 'd', 'w', 's', ' ', 'shift', 'b'].includes(k)) { keys.current.add(k); e.preventDefault(); }
      const sk = SKILL_KEYS.find((q) => SKILLS[q].key === k);
      if (sk && !e.repeat) G.current.skillQ.push(sk);
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
      if (!st || !st.T || !cv || !wrap) return;
      let dt = (ts - last) / 1000;
      last = ts;
      if (dt <= 0) return;
      dt = Math.min(0.25, dt);
      const g = G.current, T = st.T;
      const B = g.budget;
      B.avg = B.avg * 0.94 + Math.min(80, dt * 1000) * 0.06; B.n += 1;
      if (window.__zraceLow && B.tier < 2) { B.tier = 2; st.env.shadows = false; st.env.fogDen = st.env.baseFog * 1.35; }
      if (gfxRef.current === 'auto' && B.n > 70 && B.avg > 26 && B.tier < 2) { B.tier += 1; B.n = 0; B.avg = 18; if (B.tier >= 2) { st.env.shadows = false; st.env.fogDen = st.env.baseFog * 1.35; } }
      const cw = wrap.clientWidth, ch = wrap.clientHeight;
      const dpr = Math.min(maxDpr(B.tier >= 2), [1.75, 1.3, 1][B.tier]);
      if (cv.width !== Math.round(cw * dpr) || cv.height !== Math.round(ch * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); }
      const ph = phaseRef.current;
      const now = performance.now();
      const myK = kindOf();
      const playing = g.ids.includes(myK) && !watch;
      const attack = g.mode === 'attack' && ph !== 'menu';
      const step = pausedRef.current ? 0 : dt;
      const subs = Math.max(1, Math.ceil(step / 0.034));
      const sdt = step / subs;
      if (ph === 'count') {
        const leftS = Math.ceil((g.goAt - now) / 1000);
        if (leftS !== g.lastCount) { g.lastCount = leftS; if (leftS > 0 && leftS <= 3) { setCount(leftS); Sfx.play('click', { vol: 0.7 }); } }
        if (now >= g.goAt) { setPhase('race'); setCount(0); Sfx.play('cp', { vol: 0.8 }); say('Go!', 1); }
      }
      const racing = ph === 'race' || ph === 'done';
      const raceT = Math.max(0, (now - g.t0) / 1000);
      let all = g.ids.map((k) => g.cars[k]).filter(Boolean);
      if (ph === 'menu') {
        const want = `${st.key}#${(solo ? ['me', 'bot1', 'bot2', 'bot3', 'bot4', 'bot5'] : rosterRef.current).map((k, i) => `${k}:${k === myK ? myCarRef.current : solo ? CAR_KEYS[(i * 3 + 1) % CAR_KEYS.length] : carsOfRef.current[k] || 'sport'}`).join('|')}`;
        if (g.menuKey !== want) {
          g.menuKey = want;
          g.menuCars = want.split('#')[1].split('|').map((e, i) => { const [k, t] = e.split(':'); return mkCar(k, i, t); });
          g.menuT = 0; g.tv = null;
        }
        all = g.menuCars || [];
        if (step > 0) {
          g.menuT = (g.menuT || 0) + step;
          if (g.menuT > 1.6) {
            for (let sub = 0; sub < subs; sub++) {
              for (const c of all) {
                const sk = 0.84 + (c.slot % 4) * 0.04;
                stepCar(c, T, botInput(c, T, all, g.menuT, sk), sdt, { mul: sk });
                for (const o of all) if (o !== c) collide(c, o, true);
              }
            }
          }
        }
      }
      const fx = g.fx;
      const total = T.total;
      const takeBottles = (c) => {
        for (const b of g.bottles) {
          if (b.took[c.id] > now) continue;
          const ds = (((c.s - b.s) % total) + total) % total;
          if ((ds < 2.6 || ds > total - 1.4) && Math.abs(c.x - b.x) < 1.9) {
            b.took[c.id] = now + BOTTLE_BACK * 1000;
            c.en = Math.min(EN_MAX, c.en + BOTTLE_EN);
            if (c.id === myK) { Sfx.play('pick', { vol: 0.7 }); const p = T.at(b.s, b.x); spawnBurst(p.x, p.y + 1.2, p.z, 12, 3, 5, 0.6, 0.55); }
          }
        }
      };
      const checkOil = (c) => {
        for (const o of g.oils) {
          if (o.hit[c.id] || now > o.until) continue;
          if (c.id === o.by && now - o.at < 2500) continue;
          if (Math.abs(c.s - o.s) < 2.4 && Math.abs(c.x - o.x) < 2.1) { o.hit[c.id] = 1; applyHit(c, 'oil', o.by, true); }
        }
      };
      if (racing && step > 0) {
        if (attack && playing && ph === 'race') while (g.skillQ.length) { const k = g.skillQ.shift(); if (!castSkill(myK, k)) { const c = g.cars[myK]; if (c && !c.fin) Sfx.play('click', { vol: 0.3 }); } }
        else g.skillQ.length = 0;
        for (let sub = 0; sub < subs; sub++) {
          const K = keys.current, H = hold.current;
          const mine = g.cars[myK];
          if (mine && playing) {
            let inp;
            if (mine.fin) inp = { ...botInput(mine, T, all, raceT, 0.8), drift: false, boost: false };
            else {
              const steerKeys = ((K.has('arrowleft') || K.has('a') || H.l) ? 1 : 0) - ((K.has('arrowright') || K.has('d') || H.r) ? 1 : 0);
              const steer = tilt ? clamp(-tiltV.current * 1.2 + steerKeys, -1, 1) : steerKeys;
              inp = { steer, brake: K.has('shift') || K.has(' ') || K.has('arrowdown') || K.has('s') || H.d, boost: K.has('arrowup') || K.has('w') || K.has('b') || H.b };
              if (sub === subs - 1) H.b = false;
            }
            stepCar(mine, T, inp, sdt, { fx, mul: mine.fin ? 0.55 : 1 });
            for (const o of all) if (o !== mine) { const hit = collide(mine, o, solo || (isHost && g.bots.includes(o.id))); if (hit > 0.12) fx.push({ k: 'bump', id: myK, f: hit }); }
            if (attack && !mine.fin) { takeBottles(mine); checkOil(mine); }
            const lapNow = Math.floor(Math.max(0, mine.s) / total);
            if (lapNow > (mine.lap || 0) && mine.s > 0) {
              const lt = raceT - (mine.lapAt || 0);
              if (lapNow >= 1 && lt > 5) mine.lapBest = mine.lapBest ? Math.min(mine.lapBest, lt) : lt;
              mine.lap = lapNow; mine.lapAt = raceT;
              if (!mine.fin) {
                if (lapNow >= g.laps) {
                  mine.fin = Math.max(0.01, raceT);
                  g.fins[myK] = mine.fin;
                  const place = standings(all).findIndex((c) => c.id === myK) + 1;
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
              let seek = null;
              if (attack && c.en < 70) { let bd = 1e9; for (const b of g.bottles) { if (b.took[k] > now) continue; const ds = (((b.s - c.s) % total) + total) % total; if (ds > 6 && ds < 45 && ds < bd) { bd = ds; seek = b.x; } } }
              const inp = botInput(c, T, all, raceT, sk, seek);
              stepCar(c, T, inp, sdt, { mul: (c.fin ? 0.55 : sk) * band });
              for (const o of all) if (o !== c && g.bots.includes(o.id)) collide(c, o, true);
              if (attack && !c.fin) {
                takeBottles(c); checkOil(c);
                if (sub === 0 && ph === 'race' && raceT > 6) { const d0 = botSkill(c, all, g.rockets, Math.random, step); if (d0) castSkill(k, d0.k, d0.tg); }
              }
              if (!c.fin && c.s >= total * g.laps) { c.fin = Math.max(0.01, raceT); g.fins[k] = c.fin; }
            }
          }
          if (g.rockets.length) {
            for (let i = g.rockets.length - 1; i >= 0; i--) {
              const r = g.rockets[i];
              const hitC = rocketStep(r, g.cars, sdt);
              if (hitC) {
                g.rockets.splice(i, 1);
                const mineHit = hitC.id === myK && playing;
                const botHit = isHost && g.bots.includes(hitC.id);
                if (mineHit || botHit) applyHit(hitC, 'rocket', r.by, true); else boom(hitC, true);
              } else if (r.life <= 0) { g.rockets.splice(i, 1); const p = T.at(r.s, r.x); spawnBurst(p.x, p.y + 0.6, p.z, 6, 5, 2, 0.8, 0.9); }
            }
          }
        }
        if (g.oils.length) g.oils = g.oils.filter((o) => now < o.until);
        for (const c of all) if (c.id !== myK && !(isHost && g.bots.includes(c.id))) { if (c.spin > 0) c.spin = Math.max(0, c.spin - step); if (c.shield > 0) c.shield = Math.max(0, c.shield - step); if (step > 0) airStep(c, T, step, fx); }
        for (const k of Object.keys(g.net)) {
          const c = g.cars[k], N = g.net[k];
          if (!c || k === myK) continue;
          const age = Math.min(0.35, (now - N.at) / 1000);
          const ts2 = N.s + N.v * Math.cos(N.y) * age, tx = N.x + N.v * Math.sin(N.y) * age;
          if (Math.abs(ts2 - c.s) > 25) { c.s = ts2; c.x = tx; } else { const kk = 1 - Math.exp(-step * 10); c.s += (ts2 - c.s) * kk + c.v * Math.cos(c.yaw) * step * (1 - kk); c.x += (tx - c.x) * kk; }
          c.v = N.v; c.yaw += (N.y - c.yaw) * Math.min(1, step * 10);
          c.wheel = (c.wheel + (c.v * step) / 0.34) % (Math.PI * 2);
        }
        if (!solo && playing && g.cars[myK] && now - g.sendAt > SEND_MS) {
          g.sendAt = now;
          const c = g.cars[myK];
          relay.send('pl', { r: g.rid, s: +c.s.toFixed(2), x: +c.x.toFixed(2), v: +c.v.toFixed(2), y: +c.yaw.toFixed(3), d: +c.drift.toFixed(2), b: c.boostT > 0 ? 1 : 0, k: c.brake ? 1 : 0, st: +c.steer.toFixed(2), sp: c.spin > 0 ? +c.spin.toFixed(2) : 0, sh: c.shield > 0 ? +c.shield.toFixed(1) : 0, f: c.fin ? +c.fin.toFixed(2) : 0, at: Date.now() });
        }
        if (!solo && isHost && g.bots.length && now - g.botAt > 120) {
          g.botAt = now;
          relay.send('bt', { r: g.rid, a: g.bots.map((k) => { const c = g.cars[k]; return c ? [g.ids.indexOf(k), +c.s.toFixed(2), +c.x.toFixed(2), +c.v.toFixed(2), +c.yaw.toFixed(3), +c.drift.toFixed(2), c.boostT > 0 ? 1 : 0, c.fin ? +c.fin.toFixed(2) : 0, c.spin > 0 ? +c.spin.toFixed(2) : 0, c.shield > 0 ? +c.shield.toFixed(1) : 0] : null; }).filter(Boolean) });
        }
        if (isHost && ph === 'race') {
          const humans = all.filter((c) => !g.bots.includes(c.id));
          const done = humans.length && humans.every((c) => c.fin);
          const first = all.filter((c) => c.fin).reduce((m, c) => Math.min(m, c.fin), Infinity);
          if (!g.endAt && (done || (first < Infinity && raceT - first > 30))) g.endAt = now + (done ? 1500 : 0);
          if (g.endAt && now >= g.endAt && !g.resAt) {
            g.resAt = now;
            const goal = total * g.laps;
            for (const c of all) if (!c.fin && g.bots.includes(c.id)) c.fin = raceT + Math.max(0, goal - c.s) / Math.max(12, c.v || 30);
            const o = standings(all).map((c) => [c.id, Number(c.fin) > 0 ? +Number(c.fin).toFixed(2) : 0]);
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
        else if (f.k === 'land') {
          const lc = g.cars[f.id];
          if (lc) { const lp = T.at(lc.s, lc.x); spawnBurst(lp.x, lp.y + (lc.air || 0) + 0.2, lp.z, 5 + Math.round(f.f * 10), 2, 3 + f.f * 5, 1.2, 0.9); }
          if (local) { Sfx.play('bump', { vol: 0.35 + f.f * 0.55, gap: 0.12 }); g.shake = Math.max(g.shake || 0, 0.16 + f.f * 0.45); try { if (navigator.vibrate) navigator.vibrate(Math.round(10 + f.f * 30)); } catch {} }
        } else if (f.k === 'jump') { if (local) Sfx.play('dash', { vol: 0.4 }); }
        else if (f.k === 'pad') { if (local) { Sfx.play('dash', { vol: 0.85 }); try { if (navigator.vibrate) navigator.vibrate(16); } catch {} } }
      }
      const mineC = g.cars[myK];
      if (g.eng) g.eng.set(mineC ? mineC.v : 0, mineC && mineC.boostT > 0, mineC ? mineC.drift : 0, racing && !!mineC && !pausedRef.current);
      const P = g.parts;
      const cap = [340, 240, 140][B.tier] || 200;
      const items = st.world.slice();
      const pool = g.pool || (g.pool = []);
      let pi = 0;
      const tagPos = {};
      for (const c of all) {
        const p = T.at(c.s, c.x);
        const spinA = c.spin > 0 ? (1 - c.spin / Math.max(0.5, c.spinMax || 1)) * Math.PI * 2 * (c.spinTurns || 1.5) : 0;
        const vis = c.drift * c.steer * 0.34 + (c.bump > 0 ? Math.sin(now / 30) * 0.03 : 0) + spinA;
        const hd = p.heading + c.yaw + vis;
        const air = c.air || 0;
        const fl = c.flip || 0;
        c.wx = p.x; c.wy = p.y + air; c.wz = p.z; c.hd = hd; c.hdCam = p.heading + c.yaw + c.drift * c.steer * 0.2;
        const color = ph === 'menu' ? COLORS[c.slot % COLORS.length] : slotColor(c.id);
        const mesh = meshFor(c.type, color);
        const roll = -c.steer * clamp(c.v / 45, 0, 1) * 0.035 + p.bank;
        const rampP = c.inAir ? Math.atan2(c.vy || 0, Math.max(10, c.v)) * 0.55 : Math.atan(groundSlope(T, c.s));
        const pitch = -p.slope - rampP + (c.brake ? 0.018 : c.boostT > 0 ? -0.012 : 0);
        const ox = Math.sin(fl) * 0.62, oy = (1 - Math.cos(fl)) * 0.62;
        const model = m4.pose(p.x + Math.cos(hd) * ox, p.y + air + oy, p.z - Math.sin(hd) * ox, hd, pitch, roll + fl);
        if (mesh) items.push({ mesh, cast: true, model });
        const wm = wheelsFor(c.type);
        if (wm) {
          const W0 = WHEELS[c.type] || WHEELS.sport;
          W0.list.forEach((e, idx) => {
            for (const sg of e[0] === 0 ? [0] : [-1, 1]) {
              const mm = pool[pi] || (pool[pi] = new Float32Array(16)); pi++;
              items.push({ mesh: wm[idx], model: wheelInto(mm, model, sg * e[0], e[1], e[2], e[5] ? c.steer * 0.42 : 0, c.wheel || 0) });
            }
          });
        }
        if (c.shield > 0 && st.fx) items.push({ mesh: st.fx.shield, model, blend: 1, alpha: 0.85 * Math.min(1, c.shield * 2) });
        const fxv = Math.sin(hd), fzv = Math.cos(hd), rxv = Math.cos(hd), rzv = -Math.sin(hd);
        const back = (CARS[c.type] || CARS.sport).len;
        if (step > 0 && (c.drift > 0.45 || c.spin > 0) && c.v > 8 && P.length < cap) {
          const dust = st.key === 'rock';
          for (const sg of [-1, 1]) P.push({ x: p.x - fxv * (back - 0.5) + rxv * sg * 0.85, y: p.y + 0.25, z: p.z - fzv * (back - 0.5) + rzv * sg * 0.85, vx: -fxv * 2 + (Math.random() - 0.5), vy: 0.6 + Math.random() * 0.5, vz: -fzv * 2 + (Math.random() - 0.5), life: 0, max: 0.9 + Math.random() * 0.4, s0: 0.35, s1: 1.6, a0: dust ? 0.4 : 0.3, type: dust ? 2 : 0 });
        }
        if (step > 0 && st.key === 'rock' && c.v > 20 && P.length < cap * 0.7 && Math.random() < 0.45) P.push({ x: p.x - fxv * back, y: p.y + 0.3, z: p.z - fzv * back, vx: -fxv * 3, vy: 0.8, vz: -fzv * 3, life: 0, max: 1.1, s0: 0.5, s1: 2.2, a0: 0.22, type: 2 });
        if (step > 0 && c.inAir && c.flipV && P.length < cap) P.push({ x: p.x, y: p.y + air + 0.7, z: p.z, vx: (Math.random() - 0.5) * 1.6, vy: 0.5 + Math.random() * 0.6, vz: (Math.random() - 0.5) * 1.6, life: 0, max: 0.9, s0: 0.6, s1: 2.2, a0: 0.55, type: 5 });
        if (step > 0 && c.smokeT > 0) { c.smokeT = Math.max(0, c.smokeT - step); if (P.length < cap && Math.random() < 0.55) P.push({ x: p.x + fxv * 0.9, y: p.y + air + 0.9, z: p.z + fzv * 0.9, vx: -fxv * 1.5 + (Math.random() - 0.5), vy: 1.1 + Math.random() * 0.6, vz: -fzv * 1.5 + (Math.random() - 0.5), life: 0, max: 1.2, s0: 0.5, s1: 2, a0: 0.5 * Math.min(1, c.smokeT), type: 5 }); }
        if (step > 0 && c.zapT > 0) { c.zapT = Math.max(0, c.zapT - step); if (P.length < cap && Math.random() < 0.7) { const a = Math.random() * Math.PI * 2; P.push({ x: p.x + Math.cos(a) * 1.1, y: p.y + air + 0.4 + Math.random() * 0.9, z: p.z + Math.sin(a) * 1.1, vx: Math.cos(a) * 3, vy: 1 + Math.random() * 2, vz: Math.sin(a) * 3, life: 0, max: 0.28, s0: 0.35, s1: 0.1, a0: 1, type: 4 }); } }
        if (step > 0 && c.boostT > 0 && P.length < cap) {
          for (const sg of [-1, 1]) P.push({ x: p.x - fxv * (back + 0.1) + rxv * sg * 0.38, y: p.y + 0.4, z: p.z - fzv * (back + 0.1) + rzv * sg * 0.38, vx: -fxv * 9, vy: 0, vz: -fzv * 9, life: 0, max: 0.16, s0: 0.3, s1: 0.08, a0: 0.95, type: 1 });
        }
        if (c.shield > 0 && step > 0 && Math.random() < 0.3 && P.length < cap) { const a = Math.random() * Math.PI * 2; P.push({ x: p.x + Math.cos(a) * 1.6, y: p.y + 0.4 + Math.random() * 1.4, z: p.z + Math.sin(a) * 2.2, vx: 0, vy: 1.2, vz: 0, life: 0, max: 0.5, s0: 0.25, s1: 0.05, a0: 0.9, type: 3 }); }
        if (c.slow > 0 && step > 0 && Math.random() < 0.4 && P.length < cap) P.push({ x: p.x + (Math.random() - 0.5) * 2, y: p.y + 0.6 + Math.random(), z: p.z + (Math.random() - 0.5) * 3, vx: 0, vy: 0.5, vz: 0, life: 0, max: 0.3, s0: 0.35, s1: 0.1, a0: 1, type: 6 });
        tagPos[c.id] = [p.x, p.y + (c.type === 'jeep' ? 2.4 : c.type === 'tuktuk' ? 2.25 : c.type === 'hatch' ? 2.05 : 1.75), p.z];
      }
      if (attack && st.fx) {
        for (const r of g.rockets) {
          const p = T.at(r.s, r.x);
          const tg = r.tg && g.cars[r.tg];
          const yaw = p.heading + (tg ? Math.atan2(tg.x - r.x, Math.max(4, tg.s - r.s)) * 0.6 : 0);
          items.push({ mesh: st.fx.rocket, model: m4.pose(p.x, p.y + 0.85, p.z, yaw) });
          if (step > 0 && P.length < cap) {
            const fxv = Math.sin(yaw), fzv = Math.cos(yaw);
            P.push({ x: p.x - fxv * 0.7, y: p.y + 0.85, z: p.z - fzv * 0.7, vx: -fxv * 6, vy: 0, vz: -fzv * 6, life: 0, max: 0.14, s0: 0.42, s1: 0.1, a0: 1, type: 1 });
            P.push({ x: p.x - fxv * 1.0, y: p.y + 0.85, z: p.z - fzv * 1.0, vx: (Math.random() - 0.5), vy: 0.5, vz: (Math.random() - 0.5), life: 0, max: 0.8, s0: 0.3, s1: 1.1, a0: 0.35, type: 0 });
          }
        }
        for (const o of g.oils) {
          const p = T.at(o.s, o.x);
          const k = clamp((o.until - now) / 2000, 0, 1);
          items.push({ mesh: st.fx.oil, model: m4.pose(p.x, p.y, p.z, p.heading, -p.slope, p.bank, 0.3 + 0.7 * k) });
        }
        const camS = mineC ? mineC.s : all.length ? all[0].s : 0;
        for (const b of g.bottles) {
          if (b.took[myK] > now) continue;
          const ds = (((b.s - camS) % total) + total) % total;
          if (ds > 170 && ds < total - 30) continue;
          const p = T.at(b.s, b.x);
          const bob = Math.sin(now / 320 + b.s) * 0.18;
          items.push({ mesh: st.fx.bottle, model: m4.pose(p.x, p.y + 0.55 + bob, p.z, now / 600 + b.s, 0, 0, 1) });
          if (P.length < cap) P.push({ x: p.x, y: p.y + 1.25 + bob, z: p.z, vx: 0, vy: 0, vz: 0, life: 0, max: 0.03, s0: 0.95, s1: 0.95, a0: 0.32 + Math.sin(now / 200 + b.s) * 0.08, type: 3 });
        }
      }
      const parts = [];
      for (let i = P.length - 1; i >= 0; i--) {
        const q = P[i];
        q.life += step || 0.016;
        if (q.life >= q.max) { P.splice(i, 1); continue; }
        if (q.g) q.vy -= q.g * step;
        q.x += q.vx * step; q.y += q.vy * step; q.z += q.vz * step;
        const u = q.life / q.max;
        parts.push({ x: q.x, y: q.y, z: q.z, size: q.s0 + (q.s1 - q.s0) * u, alpha: q.a0 * (1 - u), type: q.type || 0 });
      }
      let camPos, camAt, fov = 1.0;
      const tvCars = ph === 'menu' && (g.menuT || 0) > 1.6 ? all.filter((c) => c.wx != null) : [];
      if (tvCars.length) {
        const lead = tvCars.reduce((m, c) => (c.s > m.s ? c : m), tvCars[0]);
        const tv = g.tv;
        if (!tv || g.menuT - tv.at > 8 || (tv.k === 'side' && (tvCars.find((c) => c.id === tv.id) || lead).s > tv.s + 4)) {
          const k = !tv || tv.k === 'chase' ? 'side' : 'chase';
          const pickC = k === 'chase' ? tvCars[Math.floor(Math.random() * tvCars.length)] : lead;
          g.tv = { k, at: g.menuT, s: pickC.s + 26 + Math.random() * 10, side: tv && tv.side ? -tv.side : 1, id: pickC.id, cam: null };
        }
        const tv2 = g.tv;
        const car = tvCars.find((c) => c.id === tv2.id) || lead;
        if (tv2.k === 'side') {
          const e = T.at(tv2.s, tv2.side * (T.w + 1.6));
          camPos = [e.x, e.y + 2.4, e.z];
          camAt = [car.wx, car.wy + 0.7, car.wz];
          fov = 0.78;
        } else {
          const h = car.hdCam || 0, fxv = Math.sin(h), fzv = Math.cos(h), rxv = Math.cos(h), rzv = -Math.sin(h);
          const want = [car.wx - fxv * 8.5 + rxv * tv2.side * 4.2, car.wy + 3.6, car.wz - fzv * 8.5 + rzv * tv2.side * 4.2];
          if (!tv2.cam) tv2.cam = want.slice();
          const kq = Math.min(1, dt * 3.2);
          for (let q = 0; q < 3; q++) tv2.cam[q] += (want[q] - tv2.cam[q]) * kq;
          camPos = tv2.cam.slice();
          camAt = [car.wx + fxv * 7, car.wy + 0.9, car.wz + fzv * 7];
          fov = 0.95;
        }
      } else if (ph === 'menu' || !g.ids.length) {
        g.orbit = (g.orbit || 0) + dt;
        const sw = Math.sin(g.orbit * 0.16) * 2.2;
        const eye = T.at(7 + sw, 4.6), look0 = T.at(-16, -1.8);
        camPos = [eye.x, eye.y + 2.9 + Math.sin(g.orbit * 0.11) * 0.3, eye.z];
        camAt = [look0.x, look0.y + 0.6, look0.z];
        fov = 0.92;
      } else {
        const fk = followRef.current && g.cars[followRef.current] ? followRef.current : playing ? myK : standings(all)[0].id;
        const c = g.cars[fk] || all[0];
        const want = c.hdCam != null ? c.hdCam : 0;
        if (!g.cam || g.camFor !== c.id) g.cam = { yaw: want, x: c.wx, y: c.wy, z: c.wz }, g.camFor = c.id;
        const Cm = g.cam;
        let dy = want - Cm.yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
        Cm.yaw += dy * Math.min(1, dt * 4.2);
        const kk = Math.min(1, dt * 12);
        Cm.x += (c.wx - Cm.x) * kk; Cm.y += (c.wy - Cm.y) * Math.min(1, dt * 6); Cm.z += (c.wz - Cm.z) * kk;
        const fxv = Math.sin(Cm.yaw), fzv = Math.cos(Cm.yaw);
        const sp = clamp(c.v / 50, 0, 1.3);
        const backD = 7.2 + sp * 0.8, up = 2.65;
        camPos = [Cm.x - fxv * backD, Cm.y + up, Cm.z - fzv * backD];
        camAt = [Cm.x + fxv * 9, Cm.y + 1.05, Cm.z + fzv * 9];
        if (g.shake > 0) { g.shake = Math.max(0, g.shake - dt); const s2 = g.shake * 0.35; camPos[0] += (Math.random() - 0.5) * s2; camPos[1] += (Math.random() - 0.5) * s2; }
        fov = 0.98 + sp * 0.12 + (c.boostT > 0 ? 0.08 : 0);
        g.fovNow = (g.fovNow || fov) + (fov - (g.fovNow || fov)) * Math.min(1, dt * 3);
        fov = g.fovNow;
      }
      const GL = st.glows;
      if (GL && GL.length) {
        let n = 0;
        for (let k = 0; k < GL.length && n < 70; k += 5) {
          const dx = GL[k] - camPos[0], dz = GL[k + 2] - camPos[2];
          if (dx * dx + dz * dz > 240 * 240) continue;
          parts.push({ x: GL[k], y: GL[k + 1], z: GL[k + 2], size: GL[k + 4], alpha: 0.85, type: GL[k + 3] });
          n++;
        }
      }
      st.env.time = now / 1000;
      const VP = st.R.render({ env: st.env, cam: { pos: camPos, at: camAt, fov, shadowAt: [camAt[0], camAt[1] - 1, camAt[2]], far: B.tier >= 2 ? 900 : 1600 }, items, parts });
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
      const kmh = Math.round((mineC && playing ? mineC.v : 0) * 3.6);
      if (speedRef.current) speedRef.current.textContent = String(kmh);
      if (gaugeRef.current) gaugeRef.current.setAttribute('stroke-dasharray', `${(clamp(kmh / 240, 0, 1) * 172).toFixed(1)} 400`);
      if (meterRef.current && mineC) {
        const m = mineC.boostT > 0 ? 1 : mineC.meter;
        meterRef.current.setAttribute('stroke-dasharray', `${(m * 213.6).toFixed(1)} 400`);
        meterRef.current.setAttribute('stroke', mineC.boostT > 0 ? '#FFE15A' : m >= 0.3 ? '#FFB020' : 'rgba(255,255,255,0.5)');
      }
      if (enRef.current && mineC) { enRef.current.style.width = `${clamp(mineC.en / EN_MAX, 0, 1) * 100}%`; if (enTxtRef.current) enTxtRef.current.textContent = String(Math.floor(mineC.en)); }
      const mc = miniRef.current;
      const live = racing || ph === 'count';
      if (mc && live && now - (g.miniAt || 0) > 120) {
        g.miniAt = now;
        drawMini(mc, T, all, myK, (k) => slotColor(k), attack ? g.rockets : null);
      }
      if (live && now - g.hudAt > 180) {
        g.hudAt = now;
        const ord = standings(all);
        const meIdx = ord.findIndex((c) => c.id === (playing ? myK : ord[0] && ord[0].id));
        const cur = g.cars[myK];
        const lap = cur ? lapOf(cur, T, g.laps) : 1;
        const time = cur && cur.fin ? cur.fin : raceT;
        const order = ord.map((c) => c.id);
        const en = cur ? Math.floor(cur.en) : 0;
        const cd = cur ? Object.fromEntries(SKILL_KEYS.map((k) => [k, Math.ceil(cur.cd[k] * 2) / 2])) : {};
        const drift = cur && cur.drift > 0.5 ? 1 : 0;
        const warn = attack && cur && !cur.fin && g.rockets.some((r) => r.tg === myK && r.s < cur.s && cur.s - r.s < 70);
        setHud((h) => (h.pos === meIdx + 1 && h.lap === lap && Math.floor(h.time * 10) === Math.floor(time * 10) && h.order.join('|') === order.join('|') && h.fin === !!(cur && cur.fin) && h.en === en && h.drift === drift && h.warn === warn && SKILL_KEYS.every((k) => h.cd[k] === cd[k]) ? h : { pos: meIdx + 1, n: ord.length, lap, time, order, fin: !!(cur && cur.fin), en, cd, drift, warn }));
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tilt]);

  useEffect(() => () => { const g = G.current; if (g.eng) { g.eng.stop(); g.eng = null; } Sfx.stopAll(); }, []);
  useEffect(() => {
    const g = G.current;
    if (paused) g.pauseAt = performance.now();
    else if (g.pauseAt) { const d = performance.now() - g.pauseAt; g.t0 += d; for (const o of g.oils) o.until += d; for (const b of g.bottles) for (const k of Object.keys(b.took)) b.took[k] += d; g.pauseAt = 0; }
  }, [paused]);
  useEffect(() => {
    const vis = () => { const hidden = document.visibilityState === 'hidden'; Sfx.pause(hidden); if (hidden && solo && phaseRef.current === 'race') setPaused(true); };
    document.addEventListener('visibilitychange', vis);
    return () => document.removeEventListener('visibilitychange', vis);
  }, []);

  const finish = () => { const g = G.current; if (g.eng) { g.eng.stop(); g.eng = null; } Sfx.stopAll(); onClose(); };
  const leave = () => { if ((phase === 'race' || phase === 'count') && !solo && !watch) { setLeaveAsk(true); return; } finish(); };
  useBackClose(true, () => { if (chatOpen) setChatOpen(false); else if (ctl) setCtl(false); else if (optSheet) setOptSheet(false); else if (mapSheet) setMapSheet(false); else if (people) setPeople(false); else if (quick) setQuick(false); else if (leaveAsk) setLeaveAsk(false); else if (paused) setPaused(false); else if (phase === 'race' && solo) setPaused(true); else leave(); });
  const sendEmote = (e) => { setBubbles((p) => ({ ...p, [kindOf()]: { e, at: Date.now() } })); if (!solo) relay.send('emo', { e }); setQuick(false); Sfx.play('pop', { vol: 0.5 }); };
  useEffect(() => {
    const keysB = Object.keys(bubbles);
    if (!keysB.length) return undefined;
    const t = setTimeout(() => setBubbles((p) => { const n = {}; for (const k of Object.keys(p)) if (Date.now() - p[k].at < 2200) n[k] = p[k]; return n; }), 2300);
    return () => clearTimeout(t);
  }, [bubbles]);

  const [pressed, setPressed] = useState({});
  const press = (k, on) => (e) => {
    if (e && e.cancelable) e.preventDefault();
    if (on && e && e.currentTarget && e.pointerId != null) { try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} }
    if (k === 'b') { if (on) hold.current.b = true; setPressed((p) => (p.b === on ? p : { ...p, b: on })); return; }
    hold.current[k] = on;
    setPressed((p) => (p[k] === on ? p : { ...p, [k]: on }));
  };
  const zone = (k, label, style, children) => (
    <div role="button" aria-label={label} onPointerDown={press(k, true)} onPointerUp={press(k, false)} onPointerCancel={press(k, false)} onLostPointerCapture={press(k, false)} onContextMenu={(e) => e.preventDefault()}
      style={{ position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'none', cursor: 'pointer', opacity: 1 - look.see, transition: 'transform 0.06s', zIndex: 4, ...style, transform: `scale(${look.size * (pressed[k] ? 0.94 : 1)})` }}>
      {children}
    </div>
  );
  const skillPress = (k) => (e) => { if (e && e.cancelable) e.preventDefault(); e.stopPropagation(); G.current.skillQ.push(k); };

  const playingNow = inRace() && (phase === 'race' || phase === 'count');
  const talkOn = !solo && !watch;
  const hb = 38;
  const rowBtns = [
    talkOn && <GHudBtn key="mic" icon={relay.mic.on ? 'mic' : 'micoff'} on={relay.mic.on} size={hb} label={relay.mic.on ? 'Turn your mic off' : 'Turn your mic on'} onPress={relay.toggleMic} />,
    !solo && <GHudBtn key="ppl" icon="people" on={people} size={hb} label="Players and voice" badge={roster.length > 1 ? roster.length : null} onPress={() => { setQuick(false); setPeople(true); }} />,
    talkOn && <GHudBtn key="chat" icon="chat" size={hb} label="Chat" badge={chatNew || null} onPress={() => { setQuick(false); setChatNew(0); setChatOpen(true); }} />,
    talkOn && <GHudBtn key="emo" icon="smile" on={quick} tone="#F5AE1E" size={hb} label="Emojis" onPress={() => setQuick((v) => !v)} />,
    playingNow && <GHudBtn key="gear" icon="gear" size={hb} label="Settings" onPress={() => { setQuick(false); if (solo) setPaused(true); setCtl(true); }} />,
    <GHudBtn key="x" icon={solo && phase === 'race' ? 'pause' : 'close'} size={hb} label={solo && phase === 'race' ? 'Pause' : 'Leave the race'} onPress={() => (solo && phase === 'race' ? setPaused(true) : leave())} />,
  ].filter(Boolean);
  const g0 = G.current;
  const raceIds = phase === 'menu' ? [] : g0.ids;
  const listOrder = hud.order.length ? hud.order : raceIds;
  const micOf = (k) => (k === kindOf() ? relay.mic.on : !!relay.mics[k]);
  const attackNow = g0.mode === 'attack' && phase !== 'menu';
  const bestLap = Number(readPref(BEST_KEY(uid, mapKey), '0'));
  const hostName = names[room && room.host] || 'The host';

  const toggleWatchR = () => { const v = !allowWatch; setAllowWatch(v); setWatchAllowed(v); kitTap(); };
  const lobbyUi = phase !== 'menu' ? null : (
    <GLobby GS={GS} title="Island Rally" onClose={finish} closeLabel={solo ? 'Leave' : 'Back to chat'} tint="rgba(8,12,24,0.6)"
      sub={solo ? 'Race five bots on four maps' : watch ? `Watching ${hostName} and friends` : 'Up to six friends race in 3D'}
      badge={bestLap ? <GChip style={{ height: 34, gap: 6 }}><GIcon k="flag" size={14} color="#FFD84E" />{`Best lap ${fmtRace(bestLap)}`}</GChip> : null}
      tools={(
        <>
          {!solo && !watch && <GBtn icon="chat" color="dark" size={42} fast={false} label="Chat" badge={chatNew || null} onPress={() => { setChatNew(0); setChatOpen(true); }} />}
          {!solo && isHost && !watch && <GBtn icon={allowWatch ? 'eye' : 'eyeoff'} color={allowWatch ? 'blue' : 'dark'} size={42} fast={false} label={allowWatch ? 'Friends can watch. Tap to stop' : 'Let friends watch'} badge={watchers.length || null} onPress={toggleWatchR} />}
          {!watch && <GBtn icon="gear" color="dark" size={42} fast={false} label="Race settings" onPress={() => setOptSheet(true)} />}
        </>
      )}
      side={(
        <>
          {!watch && (
            <GPanel style={{ padding: '8px 10px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 13.5, fontWeight: 900 }}>Your ride</div>
              <div style={{ display: 'flex', gap: 6 }}>{CAR_KEYS.map((k) => <CarPick key={k} mini k={k} on={myCar === k} img={thumbs[k]} color={myColor} onPress={() => pickCar(k)} />)}</div>
              {solo && <div style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.75)', lineHeight: 1.35 }}>Steer with the arrows. Hold Brake while you turn to drift. Drifting fills Nitro.</div>}
            </GPanel>
          )}
          {!solo && (
            <GPanel style={{ padding: '8px 10px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13.5, fontWeight: 900, flex: 1 }}>{watch ? 'Racers' : `Racers ${roster.length} of ${MAX_RACERS}`}</span>
                {watchers.length > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 800, color: '#CFE6FF' }}><GIcon k="eye" size={14} color="#CFE6FF" />{`${watchers.length} watching`}</span>}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {Array.from({ length: MAX_RACERS }, (_, i) => {
                  const k = roster[i];
                  if (!k) return <GSlot key={`e${i}`} size={36} empty name={isHost && onInvite && !watch ? 'Invite' : fill && isHost ? 'Bot' : 'Open'} label="Invite a friend" onPress={isHost && onInvite && !watch ? () => onInvite(roster.length, GS.side) : null} />;
                  const isMe = k === kindOf();
                  return <GSlot key={k} size={36} art={<span style={{ width: 26, height: 26, borderRadius: 13, background: COLORS[i % COLORS.length], boxShadow: '0 0 0 2px #FFFFFF', display: 'block' }} />} name={isMe ? 'You' : nameOf(k)} ring={COLORS[i % COLORS.length]} talk={micOf(k)} muted={!!relay.muted[k]} label={isMe ? 'You' : `${nameOf(k)}, voice and volume`} onPress={!isMe && !watch ? () => setPeople(true) : null} />;
                })}
              </div>
              {!watch && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <GPill text={relay.mic.on ? 'Mic off' : 'Talk with mic'} icon={relay.mic.on ? 'micoff' : 'mic'} color={relay.mic.on ? 'white' : 'blue'} small wide onPress={relay.toggleMic} style={{ flex: 1 }} />
                  <GPill text="Voice" icon="people" color="white" small onPress={() => setPeople(true)} />
                </div>
              )}
              {!watch && relay.mic.err && <div style={{ fontSize: 12, fontWeight: 800, color: '#FF9C9C' }}>{relay.mic.err}</div>}
            </GPanel>
          )}
        </>
      )}
      main={(
        <GPanel style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 9 }}>
          <Seg value={mode} items={Object.entries(MODES)} onPick={pickMode} disabled={!isHost || watch} />
          <button type="button" className="zgk-btn" aria-label={isHost && !watch ? `Map ${MAPS[mapKey].name}. Change map` : `Map ${MAPS[mapKey].name}`} onClick={(e) => { e.stopPropagation(); kitTap(); setMapSheet(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 5, border: 'none', borderRadius: 12, background: 'rgba(255,255,255,0.07)', cursor: 'pointer', color: '#FFFFFF', fontFamily: FONT, textAlign: 'left' }}>
            <img src={`/race-map-${mapKey}.webp`} alt="" draggable={false} style={{ width: 92, aspectRatio: '16 / 9', objectFit: 'cover', borderRadius: 8, display: 'block', background: '#2A3040', flexShrink: 0 }} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 15, fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{MAPS[mapKey].name}</span>
              <span style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mode === 'attack' ? 'Rockets, oil and shields' : `${laps} laps`}</span>
            </span>
            <span style={{ height: 26, padding: '0 10px', borderRadius: 13, background: isHost && !watch ? 'linear-gradient(180deg, #FFE27A, #F5B321)' : 'rgba(10,14,26,0.7)', color: isHost && !watch ? '#2A1D05' : '#FFFFFF', fontSize: 11.5, fontWeight: 900, display: 'flex', alignItems: 'center', flexShrink: 0 }}>{isHost && !watch ? 'Change' : 'See maps'}</span>
          </button>
          {failed ? <div style={{ fontSize: 12.5, fontWeight: 800, lineHeight: 1.4, color: '#FFB4B4' }}>This phone could not start the 3D race. Try closing other apps, then open it again.</div>
            : watch ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44, fontSize: 13.5, fontWeight: 800 }}><Spinner size={16} color="#FFFFFF" />{`${hostName} starts the race soon`}</div>
            : isHost ? <GPill text={ready ? 'Start the race' : `Building ${MAPS[mapKey].name}`} icon="play" color="gold" wide disabled={!ready} onPress={startRace} />
            : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44, fontSize: 13.5, fontWeight: 800 }}><Spinner size={16} color="#FFFFFF" />{`${hostName} picks the map and starts`}</div>}
        </GPanel>
      )}>
      {optSheet && (
        <GLobbySheet GS={GS} title="Race settings" width={520} onClose={() => setOptSheet(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {isHost && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14.5, fontWeight: 900, flex: 1 }}>Laps</span>
                {[2, 3, 5].map((n) => <GPill key={n} small text={String(n)} color={laps === n ? 'gold' : 'white'} height={36} onPress={() => setLaps(n)} style={{ minWidth: 52 }} />)}
              </div>
            )}
            {isHost && !solo && <GSwitchRow label="Fill empty spots with bots" on={fill} onToggle={() => setFill((v) => !v)} />}
            <GSwitchRow label="Tilt your phone to steer" on={tilt} onToggle={toggleTilt} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 14.5, fontWeight: 900, flex: 1 }}>Graphics</span>
              <div style={{ width: 200 }}><Seg value={gfx} items={GFX} onPick={pickGfx} /></div>
            </div>
            <GPill text="Buttons and sound" icon="gear" color="white" small wide onPress={() => { setOptSheet(false); setCtl(true); }} />
          </div>
        </GLobbySheet>
      )}
    </GLobby>
  );

  return (
    <Portal>
      <div ref={GS.rootRef} style={{ position: 'fixed', left: 0, right: 0, top: 'var(--zvp-top, 0px)', height: 'var(--zvp-h, 100%)', zIndex: 90, background: '#2A3446', overflow: 'hidden', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', fontFamily: FONT, color: '#FFFFFF' }}>
        <div ref={wrapRef} data-side={GS.side ? '1' : '0'} style={GS.wrapStyle}>
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
              {hud.warn && <div aria-live="assertive" style={{ position: 'absolute', left: '50%', top: top(64), transform: 'translateX(-50%)', padding: '6px 14px', borderRadius: 14, background: 'rgba(214,40,40,0.82)', fontSize: 14, fontWeight: 900, whiteSpace: 'nowrap', zIndex: 4, pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: 6 }}><GIcon k="rocket" size={16} color="#FFFFFF" ink="transparent" />Rocket behind you</div>}
              {inRace() && (
                <div style={{ position: 'absolute', left: '50%', bottom: bottom(6), transform: 'translateX(-50%)', width: 150, height: 86, zIndex: 3, pointerEvents: 'none' }}>
                  <svg width="150" height="86" viewBox="0 0 150 86" style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
                    <path d="M20 78 A55 55 0 0 1 130 78" fill="none" stroke="rgba(10,14,26,0.55)" strokeWidth="12" strokeLinecap="round" />
                    <path ref={gaugeRef} d="M20 78 A55 55 0 0 1 130 78" fill="none" stroke="#FFD84E" strokeWidth="7" strokeLinecap="round" strokeDasharray="0 400" />
                    {Array.from({ length: 9 }, (_, i) => { const a = Math.PI * (1 - i / 8); return <line key={i} x1={75 + Math.cos(a) * 44} y1={78 - Math.sin(a) * 44} x2={75 + Math.cos(a) * 39} y2={78 - Math.sin(a) * 39} stroke="rgba(255,255,255,0.75)" strokeWidth="2" strokeLinecap="round" />; })}
                  </svg>
                  <div style={{ position: 'absolute', left: 0, right: 0, bottom: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1, textShadow: '0 2px 8px rgba(0,0,0,0.55)' }}>
                    <span ref={speedRef} style={{ fontSize: 30, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>0</span>
                    <span style={{ fontSize: 10.5, fontWeight: 800, opacity: 0.9 }}>km/h</span>
                  </div>
                </div>
              )}
              {inRace() && phase !== 'done' && !hud.fin && (
                <>
                  {!tilt && zone('l', 'Steer left', { left: left(16), bottom: bottom(16), width: 88, height: 88, borderRadius: 26, background: pressed.l ? 'linear-gradient(180deg, #FFFFFF 0%, #D9DEE6 100%)' : 'linear-gradient(180deg, rgba(46,52,64,0.78) 0%, rgba(16,19,26,0.78) 100%)', boxShadow: pressed.l ? '0 0 0 3px rgba(255,255,255,0.5), 0 4px 10px rgba(0,0,0,0.3)' : 'inset 0 1.5px 0 rgba(255,255,255,0.22), inset 0 0 0 2px rgba(255,255,255,0.32), 0 8px 18px rgba(0,0,0,0.35)', transformOrigin: '0 100%' }, <SteerArrow dir="l" on={!!pressed.l} />)}
                  {!tilt && zone('r', 'Steer right', { left: left(116), bottom: bottom(16), width: 88, height: 88, borderRadius: 26, background: pressed.r ? 'linear-gradient(180deg, #FFFFFF 0%, #D9DEE6 100%)' : 'linear-gradient(180deg, rgba(46,52,64,0.78) 0%, rgba(16,19,26,0.78) 100%)', boxShadow: pressed.r ? '0 0 0 3px rgba(255,255,255,0.5), 0 4px 10px rgba(0,0,0,0.3)' : 'inset 0 1.5px 0 rgba(255,255,255,0.22), inset 0 0 0 2px rgba(255,255,255,0.32), 0 8px 18px rgba(0,0,0,0.35)', transformOrigin: '0 100%' }, <SteerArrow dir="r" on={!!pressed.r} />)}
                  {zone('d', 'Brake, hold while steering to drift', { right: right(122), bottom: bottom(14), width: 70, height: 104, borderRadius: 18, background: pressed.d ? 'linear-gradient(180deg, #3D434E 0%, #23272E 100%)' : 'linear-gradient(180deg, rgba(46,52,64,0.82) 0%, rgba(16,19,26,0.82) 100%)', boxShadow: `inset 0 0 0 2px ${hud.drift ? '#FFB020' : 'rgba(255,255,255,0.3)'}, ${hud.drift ? '0 0 18px rgba(255,170,40,0.55), ' : ''}0 8px 18px rgba(0,0,0,0.35)`, flexDirection: 'column', gap: 4, transformOrigin: '100% 100%' }, (
                    <>
                      <PedalArt drift={!!hud.drift} />
                      <span style={{ fontSize: 11.5, fontWeight: 900, color: hud.drift ? '#FFD84E' : '#FFFFFF', letterSpacing: '0.02em' }}>{hud.drift ? 'Drift' : 'Brake'}</span>
                    </>
                  ))}
                  {zone('b', 'Nitro', { right: right(16), bottom: bottom(14), width: 96, height: 96, borderRadius: '50%', transformOrigin: '100% 100%' }, (
                    <>
                      <svg width="96" height="96" viewBox="0 0 96 96" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }} aria-hidden="true"><circle cx="48" cy="48" r="45" fill="rgba(10,13,20,0.62)" /><circle cx="48" cy="48" r="38" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="6" /><circle ref={meterRef} cx="48" cy="48" r="34" fill="none" stroke="#FFB020" strokeWidth="6" strokeLinecap="round" strokeDasharray="0 400" /></svg>
                      <span style={{ position: 'absolute', inset: 19, borderRadius: '50%', background: pressed.b ? 'radial-gradient(circle at 50% 30%, #6FC2FF 0%, #1D5FD6 85%)' : 'radial-gradient(circle at 50% 28%, #4A92F0 0%, #183C8C 85%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 12px rgba(30,110,255,0.45), inset 0 1.5px 0 rgba(255,255,255,0.4), inset 0 0 0 2px rgba(255,255,255,0.22)' }}>
                        <NitroIcon size={34} lit={!!pressed.b} />
                      </span>
                      <span style={{ position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%)', padding: '1px 8px', borderRadius: 8, background: 'rgba(10,13,20,0.82)', fontSize: 10.5, fontWeight: 900, letterSpacing: '0.03em' }}>Nitro</span>
                    </>
                  ))}
                  {attackNow && (
                    <>
                      <div style={{ position: 'absolute', right: right(16), bottom: bottom(216), width: 270, display: 'flex', alignItems: 'center', gap: 8, zIndex: 4, pointerEvents: 'none', opacity: 1 - look.see * 0.6, transform: `scale(${look.size})`, transformOrigin: '100% 100%' }}>
                        <GIcon k="bolt" size={15} color="#5BF0C2" ink="rgba(0,0,0,0.3)" />
                        <div style={{ flex: 1, height: 11, borderRadius: 6, background: 'rgba(10,14,26,0.6)', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.35)', overflow: 'hidden', position: 'relative' }}>
                          <div ref={enRef} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '40%', borderRadius: 6, background: 'linear-gradient(90deg, #1FBF8F, #5BF0C2)' }} />
                          {[25, 50, 75].map((p) => <span key={p} style={{ position: 'absolute', left: `${p}%`, top: 2, bottom: 2, width: 1.5, background: 'rgba(10,14,26,0.5)' }} />)}
                        </div>
                        <span ref={enTxtRef} style={{ width: 26, fontSize: 12.5, fontWeight: 900, fontVariantNumeric: 'tabular-nums', textAlign: 'right', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>0</span>
                      </div>
                      <div style={{ position: 'absolute', right: right(16), bottom: bottom(126), display: 'flex', alignItems: 'flex-end', gap: 10, zIndex: 4, transform: `scale(${look.size})`, transformOrigin: '100% 100%', opacity: 1 - look.see * 0.6 }}>
                        {SKILL_KEYS.map((k, i) => {
                          const S0 = SKILLS[k];
                          const cd = hud.cd[k] || 0;
                          const okEn = hud.en >= S0.cost;
                          const ok = okEn && cd <= 0;
                          return (
                            <button key={k} type="button" className="zgk-btn" aria-label={`${S0.name}, uses ${S0.cost} energy`} onPointerDown={skillPress(k)} onClick={(e) => e.stopPropagation()}
                              style={{ position: 'relative', width: 62, height: 62, borderRadius: '50%', border: 'none', padding: 0, cursor: 'pointer', marginBottom: [0, 10, 16, 18][i] || 0, background: 'linear-gradient(180deg, #E8ECF2 0%, #8A94A5 55%, #4B5262 100%)', boxShadow: ok ? `0 0 16px ${k === 'rocket' ? 'rgba(255,110,60,0.55)' : k === 'shield' ? 'rgba(80,190,255,0.55)' : k === 'oil' ? 'rgba(150,110,240,0.55)' : 'rgba(255,210,60,0.55)'}, 0 6px 14px rgba(0,0,0,0.4)` : '0 6px 14px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ position: 'absolute', inset: 3.5, borderRadius: '50%', background: skillFace(k, okEn), boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -3px 6px rgba(0,0,0,0.35)' }} />
                              <span style={{ position: 'relative', display: 'flex', filter: ok ? 'drop-shadow(0 2px 2px rgba(0,0,0,0.45))' : 'grayscale(0.9) brightness(0.8)', opacity: okEn ? 1 : 0.6 }}><SkillIcon k={k} size={36} /></span>
                              {cd > 0 && <span style={{ position: 'absolute', inset: 3.5, borderRadius: '50%', background: `conic-gradient(rgba(5,8,14,0.7) ${(cd / S0.cd) * 360}deg, rgba(0,0,0,0) 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 900, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{Math.ceil(cd)}</span>}
                              <span style={{ position: 'absolute', right: -5, top: -4, minWidth: 24, height: 19, borderRadius: 10, padding: '0 5px', background: okEn ? 'linear-gradient(180deg, #3FE0A8, #13996E)' : '#4A4F5A', fontSize: 10.5, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, boxShadow: '0 0 0 1.5px rgba(10,14,26,0.85)' }}>{S0.cost}</span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
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

          {lobbyUi}
          {phase === 'menu' && mapSheet && (
            <MapSelect value={mapKey} canPick={isHost} mode={mode} land={land} pad={`${top(10)} ${right(14)} ${bottom(10)} ${left(14)}`}
              bestOf={(k) => Number(readPref(BEST_KEY(uid, k), '0')) || 0}
              onPick={(k) => pickMap(k)} onClose={() => setMapSheet(false)} />
          )}

          {paused && phase === 'race' && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 20, background: 'rgba(10,8,24,0.5)', display: 'flex', padding: 12, overflowY: 'auto', touchAction: 'pan-x pan-y' }}>
              <GPanel style={{ margin: 'auto', width: '100%', maxWidth: 320, padding: '16px', display: 'flex', flexDirection: 'column', gap: 10, animation: 'zgk-pop 0.3s ease-out', boxSizing: 'border-box' }}>
                <GTitle text="Paused" size={28} />
                <GPill text="Resume" icon="play" color="green" wide onPress={() => setPaused(false)} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <GPill text="Restart" icon="replay" color="white" small wide onPress={() => { setPaused(false); toMenu(true); setTimeout(startRace, 50); }} style={{ flex: 1 }} />
                  <GPill text="Settings" icon="gear" color="white" small wide onPress={() => setCtl(true)} style={{ flex: 1 }} />
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
                {result.hits >= 0 && <div style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: 6 }}><GIcon k="rocket" size={15} color="#FFD84E" ink="transparent" />{result.hits === 1 ? 'You hit 1 rival' : `You hit ${result.hits} rivals`}</div>}
                {isHost ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <GPill text="Race again" icon="replay" color="green" small wide onPress={() => { toMenu(true); setTimeout(startRace, 60); }} style={{ flex: 1 }} />
                    <GPill text="Lobby" color="white" small wide onPress={() => toMenu(false)} style={{ flex: 1 }} />
                  </div>
                ) : <div style={{ fontSize: 13.5, fontWeight: 800, color: 'rgba(255,255,255,0.75)' }}>{`${hostName} picks what is next`}</div>}
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
                      {!isMe && relay.setVol && <GVolBars name={nm} vol={relay.vols && relay.vols[k] != null ? relay.vols[k] : 1} muted={off} onVol={(v) => { if (off) relay.toggleMute(k); relay.setVol(k, v); }} />}
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
          {chatOpen && <ChatSheet title="Talk to the room" chat={chat} onClose={() => setChatOpen(false)} />}
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

const MINI = { key: null, cv: null, P: null };
function drawMini(mc, T, cars, myK, colorOf, rockets) {
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
  if (rockets) for (const r of rockets) { const p = T.at(r.s, r.x); const [a, b] = MINI.P(p.x, p.z); x.fillStyle = '#FF3B30'; x.fillRect(a - 3, b - 3, 6, 6); }
  for (const c of cars) {
    if (c.wx == null) continue;
    const [a, b] = MINI.P(c.wx, c.wz);
    x.beginPath(); x.arc(a, b, c.id === myK ? 8 : 6, 0, Math.PI * 2);
    x.fillStyle = colorOf(c.id); x.fill();
    x.lineWidth = 2.4; x.strokeStyle = '#101418'; x.stroke();
  }
}

export function RaceInviteSheet({ friends, onClose, onInvite, already, side = false }) {
  injectKitCss();
  useBackClose(true, onClose);
  const [sel, setSel] = useState([]);
  const left = Math.max(0, MAX_RACERS - Math.max(1, already || 1));
  const list = (friends || []).filter((p) => p && p.id && !p.is_bot);
  const toggle = (id) => { kitTap(); setSel((v) => (v.includes(id) ? v.filter((x) => x !== id) : v.length >= left ? v : [...v, id])); };
  return (
    <Portal>
      <div onClick={onClose} data-side={side ? '1' : '0'} style={{ position: 'fixed', ...(side && typeof window !== 'undefined' ? { left: 0, top: 0, width: window.innerHeight, height: window.innerWidth, transformOrigin: '0 0', transform: `translateX(${window.innerWidth}px) rotate(90deg)` } : { inset: 0 }), zIndex: 96, background: 'rgba(10,8,24,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT, color: '#FFFFFF' }}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, maxHeight: side ? '100%' : 'min(86vh, 640px)', display: 'flex', flexDirection: 'column', padding: side ? '10px 14px' : '14px 14px calc(14px + env(safe-area-inset-bottom))', boxSizing: 'border-box', animation: 'zgk-pop 0.25s ease-out' }}>
          <GPanel style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex' }}>{COLORS.slice(0, 3).map((c, i) => <span key={c} style={{ width: 22, height: 22, borderRadius: 11, background: c, boxShadow: '0 0 0 2.5px #FFFFFF', marginLeft: i ? -7 : 0 }} />)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 17, fontWeight: 900 }}>Invite friends to race</div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,0.72)' }}>{`Pick up to ${left}. Each one gets an invite in your chat.`}</div>
              </div>
              <GBtn icon="close" color="white" size={38} fast={false} label="Close" onPress={onClose} />
            </div>
            <div style={{ overflowY: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: side ? 'none' : '52vh', WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y' }}>
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
