import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, Portal, useBackClose, FONT, Spinner } from '../App.jsx';
import { useRoomLink } from './relay.jsx';
import { EMOTES, Sheet, injectCss, useGameChat, ChatSheet } from './livekit.jsx';
import { GBtn, GPill, GPanel, GChip, GTitle, GIcon, GHudBtn, GHudPanel, GNotices, useNotices, useWatchNotices, injectKitCss, kitTap, pressProps, maxDpr, weakPhone, INK, useCtlLook, useGameStage, GControlsPanel, GVolBars, GLobby, GSlot, GLobbySheet, GSeg, GTalkers, GJoy, useJoystick, stagePoint, TOUCHY } from './gamekit.jsx';
import { Sfx } from './sfx.js';
import { setWatchAllowed, useLiveBeacon, useGamePrivacy } from './live.js';
import { createRenderer, m4 } from './race3d.js';
import * as E from './siegeengine.js';
import { heroMeshes, robotMeshes, arenaMeshes, arenaEnv, heroThumbEnv, fxSiege } from './siegemesh.js';
import { useTalking } from './talk.js';

const PREF = { hero: 'zchat-siege-hero', arena: 'zchat-siege-arena', lv: 'zchat-siege-level', bots: 'zchat-siege-bots', gfx: 'zchat-siege-gfx', end: 'zchat-siege-endless' };
const BEST_KEY = (uid, a, lv) => `zchat-siege-best-${uid || 'me'}-${a}-${lv}`;
const readPref = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch { return d; } };
const savePref = (k, v) => { try { localStorage.setItem(k, String(v)); } catch {} };
const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const { clamp, wrapA } = E;
const validHero = (k) => (E.HEROES[k] ? k : 'blaze');
const validArena = (k) => (E.ARENAS[k] ? k : 'yard');
const validLv = (k) => (E.LEVELS[k] ? k : 'normal');
const BOT_NAMES = ['Ash', 'Bo', 'Cleo', 'Dex'];
const SLOT_COLS = ['#FFC23D', '#4DA3FF', '#FF6FA8', '#7BE05A'];
const SEND_MS = 100, SNAP_MS = 110, RE_MS = 80;
const GFX = [['auto', 'Auto'], ['best', 'Best'], ['fast', 'Fast']];
const LV_ITEMS = E.LEVEL_KEYS.map((k) => [k, E.LEVELS[k].name]);
const BOT_ITEMS = [['0', 'None'], ['1', '1'], ['2', '2'], ['3', '3']];
const WAVE_ITEMS = [['15', `${E.WIN_WAVE} waves`], ['end', 'Endless']];
const ST_CODE = { intro: 0, fight: 1, break: 2, won: 3 };
const ST_NAME = ['intro', 'fight', 'break', 'won'];
const fmtK = (n) => (n >= 10000 ? `${Math.round(n / 1000)}k` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(Math.round(n)));
const srgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };
const TINT = { white: [1, 1, 1], gold: srgb('#FFD24A'), red: srgb('#FF3B2E'), mint: srgb('#6CFFD4'), me: srgb('#6BF26B'), ally: srgb('#4DA3FF'), foe: srgb('#FF4A3D'), dark: [0, 0, 0], cyan: srgb('#7FE9FF') };
const mul = m4.mul;
function scl(M, sx, sy, sz) { const o = new Float32Array(M); for (let i = 0; i < 3; i++) { o[i] *= sx; o[4 + i] *= sy; o[8 + i] *= sz; } return o; }

let NOISE = null;
const sndAt = {};
function zap(kind, vol = 1) {
  const B = Sfx.bus();
  if (!B || vol <= 0.02) return;
  const { ac, out } = B;
  const t = ac.currentTime;
  if ((sndAt[kind] || -1) > t - 0.05) return;
  sndAt[kind] = t;
  try {
    if (!NOISE || NOISE.sampleRate !== ac.sampleRate) { const len = ac.sampleRate; NOISE = ac.createBuffer(1, len, ac.sampleRate); const d = NOISE.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; }
    const g = ac.createGain(); g.connect(out);
    const env = (a, d, peak) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak * vol), t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); };
    const nz = (f0, f1, q, type, dur) => { const s = ac.createBufferSource(); s.buffer = NOISE; const f = ac.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur); f.Q.value = q; s.connect(f); f.connect(g); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05); };
    const osc = (type, f0, f1, dur, gg) => { const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur); const og = ac.createGain(); og.gain.value = gg; o.connect(og); og.connect(g); o.start(t); o.stop(t + dur + 0.05); };
    if (kind === 'pellet') { env(0.004, 0.17, 0.42); nz(2600, 500, 0.8, 'bandpass', 0.18); osc('triangle', 190, 55, 0.13, 0.9); }
    else if (kind === 'bolt') { env(0.003, 0.34, 0.38); osc('sawtooth', 1900, 210, 0.3, 0.3); osc('sine', 2700, 900, 0.18, 0.4); nz(5200, 2200, 1.2, 'highpass', 0.1); }
    else if (kind === 'lob') { env(0.02, 0.3, 0.3); nz(420, 1900, 1.4, 'bandpass', 0.32); osc('sine', 300, 520, 0.2, 0.3); }
    else if (kind === 'orb') { env(0.006, 0.45, 0.28); osc('sine', 880, 1320, 0.4, 0.5); osc('sine', 1320, 1760, 0.3, 0.3); }
    else if (kind === 'eshot') { env(0.003, 0.2, 0.24); osc('square', 960, 300, 0.18, 0.22); }
    else if (kind === 'tshot') { env(0.003, 0.25, 0.32); osc('square', 430, 140, 0.22, 0.26); nz(1300, 400, 1, 'bandpass', 0.15); }
    else if (kind === 'boom') { env(0.005, 0.7, 0.8); nz(950, 70, 0.7, 'lowpass', 0.7); osc('sine', 92, 34, 0.6, 1); }
    else if (kind === 'bigboom') { env(0.005, 1.25, 0.95); nz(750, 45, 0.7, 'lowpass', 1.2); osc('sine', 72, 26, 1.1, 1); }
    else if (kind === 'crunch') { env(0.003, 0.32, 0.42); nz(1900, 280, 0.9, 'bandpass', 0.3); osc('square', 210, 48, 0.26, 0.28); }
    else if (kind === 'hurt') { env(0.003, 0.2, 0.4); osc('square', 330, 110, 0.17, 0.32); nz(950, 300, 1, 'bandpass', 0.12); }
    else if (kind === 'heal') { env(0.01, 0.5, 0.26); osc('sine', 660, 990, 0.45, 0.5); osc('triangle', 990, 1320, 0.35, 0.22); }
    else if (kind === 'super') { env(0.01, 0.8, 0.45); osc('sawtooth', 220, 880, 0.6, 0.26); nz(400, 4200, 0.8, 'bandpass', 0.7); }
    else if (kind === 'beam') { env(0.01, 0.6, 0.42); osc('sawtooth', 300, 1300, 0.5, 0.36); osc('square', 150, 640, 0.5, 0.16); }
    else if (kind === 'laser') { env(0.06, 1.6, 0.3); osc('sawtooth', 160, 118, 1.6, 0.5); osc('square', 322, 248, 1.6, 0.18); }
    else if (kind === 'stomp') { env(0.005, 0.8, 0.85); nz(320, 40, 0.8, 'lowpass', 0.8); osc('sine', 62, 24, 0.7, 1); }
    else if (kind === 'spawn') { env(0.02, 0.4, 0.2); osc('sawtooth', 120, 540, 0.36, 0.28); nz(3000, 6200, 2, 'bandpass', 0.3); }
    else if (kind === 'fuse') { env(0.002, 0.08, 0.26); osc('square', 1550, 1500, 0.06, 0.3); }
    else if (kind === 'wind') { env(0.02, 0.22, 0.16); osc('sawtooth', 140, 260, 0.2, 0.3); }
    else if (kind === 'clank') { env(0.002, 0.16, 0.3); osc('square', 760, 520, 0.12, 0.25); nz(4000, 2500, 3, 'bandpass', 0.1); }
  } catch {}
}

const THUMB = { heroes: null, arenas: {} };
function heroThumbs() {
  if (THUMB.heroes) return THUMB.heroes;
  const out = {};
  try {
    const cv = document.createElement('canvas'); cv.width = 168; cv.height = 168;
    const R = createRenderer(cv, { keep: true, shadowSize: 256 });
    if (!R) return out;
    const env = heroThumbEnv();
    for (const k of E.HERO_KEYS) {
      const H = heroMeshes(k);
      const body = R.mesh(H.body), leg = R.mesh(H.leg);
      const M = m4.pose(0, 0, 0, 0.42);
      const items = [{ mesh: body, model: M }];
      for (const s of [-1, 1]) items.push({ mesh: leg, model: mul(M, m4.pose(s * H.hip[0], H.hip[1], 0, 0, s * 0.18, 0)) });
      R.render({ env, cam: { pos: [0.55, 1.32, 2.7], at: [0.05, 0.9, 0], fov: 0.6 }, items, parts: [] });
      out[k] = cv.toDataURL('image/png');
      R.drop(body); R.drop(leg);
    }
    R.dispose(); R.lose();
  } catch {}
  THUMB.heroes = out;
  return out;
}
function arenaThumb(key) {
  if (THUMB.arenas[key]) return THUMB.arenas[key];
  let url = '';
  try {
    const cv = document.createElement('canvas'); cv.width = 320; cv.height = 180;
    const R = createRenderer(cv, { keep: true, shadowSize: 1024 });
    if (!R) return '';
    const A = E.makeArena(key);
    const M = arenaMeshes(A);
    const env = arenaEnv(A); env.shadowRange = 34;
    const items = [{ mesh: R.mesh(M.ground) }, { mesh: R.mesh(M.deco) }, { mesh: R.mesh(M.water) }, { mesh: R.mesh(M.props), cast: true }, { mesh: R.mesh(M.outer), cast: true }];
    for (const b of M.bushes) items.push({ mesh: R.mesh(b.data), cast: true });
    const tx = A.wx / 2, tz = A.wz / 2 + 1, D = 40, P = 1.02;
    R.render({ env, cam: { pos: [tx, Math.sin(P) * D, tz + Math.cos(P) * D], at: [tx, 0, tz], fov: 0.72, shadowAt: [tx, 0, tz] }, items, parts: [] });
    url = cv.toDataURL('image/jpeg', 0.86);
    R.dispose(); R.lose();
  } catch {}
  THUMB.arenas[key] = url;
  return url;
}

function HeroCard({ k, on, img, onPress, size = 64, label }) {
  const H = E.HEROES[k];
  return (
    <button type="button" className="zgk-btn" aria-pressed={on} aria-label={label || `${H.name}, ${H.role}`} {...pressProps(onPress)}
      style={{ position: 'relative', width: size, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: FONT, color: '#FFFFFF' }}>
      <span style={{ width: size, height: size, borderRadius: 14, overflow: 'hidden', display: 'block', background: `radial-gradient(circle at 50% 35%, ${H.col}55, #141A2C 75%)`, boxShadow: on ? `0 0 0 3px #FFD45A, 0 4px 12px rgba(0,0,0,0.4)` : 'inset 0 0 0 1.5px rgba(255,255,255,0.16)' }}>
        {img ? <img src={img} alt="" draggable={false} style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }} /> : null}
      </span>
      <span style={{ fontSize: 11.5, fontWeight: 900, color: on ? '#FFE15A' : '#FFFFFF', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>{H.name}</span>
    </button>
  );
}

function SuperArt({ k, size = 34 }) {
  const c = '#2A1A00';
  if (k === 'blaze') { const pts = Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 6.5 : 14; return `${(16 + Math.cos(a) * r).toFixed(1)},${(16 + Math.sin(a) * r).toFixed(1)}`; }).join(' '); return <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true"><polygon points={pts} fill="#FF8A2E" stroke={c} strokeWidth="2" strokeLinejoin="round" /><circle cx="16" cy="16" r="5" fill="#FFF3C4" /></svg>; }
  if (k === 'pip') return <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true"><path d="M12 16 H30" stroke={c} strokeWidth="7" strokeLinecap="round" /><path d="M12 16 H30" stroke="#9BF0FF" strokeWidth="3.5" strokeLinecap="round" /><circle cx="10" cy="16" r="7.5" fill="#E8FDFF" stroke={c} strokeWidth="2.2" /><path d="M10 10 V22 M4 16 H16" stroke={c} strokeWidth="1.8" /></svg>;
  if (k === 'boom') return <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true"><circle cx="15" cy="18" r="10" fill="#3A2F5C" stroke={c} strokeWidth="2" /><path d="M21 9 Q25 4 28 6" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" /><path d="M27 3 L28.5 6 L31 6.5 L28.5 7.5 L28 10 L27 7.5 L24.5 7 L27 6 Z" fill="#FFD24A" /><circle cx="11" cy="14" r="2.4" fill="#FFFFFF" opacity="0.7" /></svg>;
  return <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="12" fill="none" stroke="#BFFFEA" strokeWidth="2.5" strokeDasharray="4 3" /><path d="M16 8 V24 M8 16 H24" stroke={c} strokeWidth="6" strokeLinecap="round" /><path d="M16 8 V24 M8 16 H24" stroke="#6CFFD4" strokeWidth="3.4" strokeLinecap="round" /></svg>;
}

export function SiegeGamePage({ solo = false, room, me, myId, onClose, onInvite, watch = false }) {
  injectCss(); injectKitCss();
  const uid = solo ? 'me' : myId;
  const isHost = solo || (room && room.host === myId);
  const hostId = solo ? 'me' : room && room.host;
  const myFirst = String((me && me.name) || 'You').split(' ')[0];
  const [heroKey, setHeroKey] = useState(() => validHero(readPref(PREF.hero, 'blaze')));
  const meta = { n: myFirst, a: me && me.avatar, w: watch ? 1 : 0, h: heroKey };
  const relay = useRoomLink({ id: solo || !room ? null : `siege-${room.rm}`, myId, enabled: !solo && !!room, meta, fast: ['hs', 'es'], audio: !watch });
  const [phase, setPhase] = useState('menu');
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [arena, setArena] = useState(() => (isHost ? validArena(readPref(PREF.arena, 'yard')) : 'yard'));
  const [lv, setLv] = useState(() => (isHost ? validLv(readPref(PREF.lv, 'normal')) : 'normal'));
  const [botN, setBotN] = useState(() => clamp(Math.round(num(readPref(PREF.bots, '2'), 2)), 0, 3));
  const [endless, setEndless] = useState(() => isHost && readPref(PREF.end, '0') === '1');
  const [gfx, setGfx] = useState(() => { const v = readPref(PREF.gfx, 'auto'); return v === 'best' || v === 'fast' ? v : 'auto'; });
  const [roster, setRoster] = useState(solo ? ['me'] : [room && room.host].filter(Boolean));
  const [names, setNames] = useState({});
  const [heroOf, setHeroOf] = useState({});
  const [watchers, setWatchers] = useState([]);
  const [hud, setHud] = useState({ wave: 0, st: 'intro', t: 0, left: 0, score: 0, team: [], boss: null, me: null });
  const [banner, setBanner] = useState(null);
  const [result, setResult] = useState(null);
  const [paused, setPaused] = useState(false);
  const [leaveAsk, setLeaveAsk] = useState(false);
  const [quick, setQuick] = useState(false);
  const [people, setPeople] = useState(false);
  const [ctl, setCtl] = useState(false);
  const [optSheet, setOptSheet] = useState(false);
  const [arenaSheet, setArenaSheet] = useState(false);
  const [follow, setFollow] = useState(null);
  const [thumbs, setThumbs] = useState({});
  const [aThumbs, setAThumbs] = useState({});
  const [bubbles, setBubbles] = useState({});
  const [aimUi, setAimUi] = useState(null);
  const gamePriv = useGamePrivacy();
  const allowWatch = gamePriv.show && gamePriv.watch;
  const [notes, pushNote] = useNotices();
  const look = useCtlLook();
  const GS = useGameStage(useMemo(() => ({ ...look, side: true }), [look]));
  const { top, right, bottom, left } = GS.at;
  const land = GS.land;
  useLiveBeacon({ game: 'siege', room: room ? room.rm : null, info: { h: room && room.host, n: Math.max(1, roster.length) }, active: !solo && !watch && !!room, allow: allowWatch });

  const cvRef = useRef(null);
  const ovRef = useRef(null);
  const wrapRef = useRef(null);
  const atkRef = useRef(null);
  const supRef = useRef(null);
  const atkKnob = useRef(null);
  const supKnob = useRef(null);
  const ammoRef = useRef([]);
  const supRing = useRef(null);
  const hurtRef = useRef(null);
  const RR = useRef(null);
  const G = useRef({ W: null, rid: '', ids: [], bots: [], botMeta: {}, parts: [], nums: [], budget: { avg: 16, n: 0, tier: 0 }, sendAt: 0, snapAt: 0, reAt: 0, seq: 0, hsq: 0, lastSeq: -1, lastSnapAt: 0, cam: null, shake: 0, aim: { on: false }, fireQ: [], hudAt: 0, waveSeen: 0, stSeen: '', claimed: new Set(), beams: [], menuT: 0, mouse: null, hurtT: 0, over: false, overAt: 0, keyMove: [0, 0] });
  const keys = useRef(new Set());
  const phaseRef = useRef(phase); phaseRef.current = phase;
  const pausedRef = useRef(paused); pausedRef.current = paused;
  const rosterRef = useRef(roster); rosterRef.current = roster;
  const namesRef = useRef(names); namesRef.current = names;
  const heroOfRef = useRef(heroOf); heroOfRef.current = heroOf;
  const heroRef = useRef(heroKey); heroRef.current = heroKey;
  const arenaRef = useRef(arena); arenaRef.current = arena;
  const lvRef = useRef(lv); lvRef.current = lv;
  const botNRef = useRef(botN); botNRef.current = botN;
  const endRef = useRef(endless); endRef.current = endless;
  const gfxRef = useRef(gfx); gfxRef.current = gfx;
  const followRef = useRef(follow); followRef.current = follow;
  const sideRef = useRef(GS.side); sideRef.current = GS.side;
  const metaRef = useRef({});
  const joinOrder = useRef([]);
  const rosterSeen = useRef({ list: null, at: Date.now(), bye: new Set() });
  const sheetOpen = useRef(false);
  sheetOpen.current = !!(paused || leaveAsk || ctl || optSheet || arenaSheet || people || quick);
  const kindOf = () => (solo ? 'me' : myId);
  const inGame = () => !watch && G.current.ids.includes(kindOf());
  const nameOf = (k) => (k === kindOf() ? 'You' : G.current.botMeta[k] ? G.current.botMeta[k].n : namesRef.current[k] || names[k] || 'Friend');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatNew, setChatNew] = useState(0);
  const chat = useGameChat(solo || watch ? null : relay, nameOf, (s) => { pushNote(s, 'chat'); setChatNew((n) => n + 1); });
  const bannerT = useRef(0);
  const showBanner = (text, sub, tone, sec = 2.4) => { setBanner({ text, sub, tone, at: Date.now() }); clearTimeout(bannerT.current); bannerT.current = setTimeout(() => setBanner(null), sec * 1000); };

  const J = useJoystick(wrapRef, {
    enabled: () => phaseRef.current === 'play' && !sheetOpen.current,
    rot: () => sideRef.current,
    radius: () => Math.round(52 * Math.max(0.75, look.size)),
    zone: (x, y, r) => x < r.width * 0.5 && y > 70,
  });

  const P3 = (o) => {
    const g = G.current;
    const cap = [520, 360, 220][g.budget.tier] || 300;
    if (g.parts.length >= cap) return;
    g.parts.push({ life: 0, vx: 0, vy: 0, vz: 0, a0: 1, seed: Math.random(), ...o });
  };
  const R0 = (a, b) => a + Math.random() * (b - a);
  const blast = (x, y, z, big, scale = 1) => {
    const lite = G.current.budget.tier >= 2;
    const k = scale;
    P3({ x, y, z, max: 0.14, s0: 1.1 * k, s1: (big ? 4.2 : 2.6) * k, a0: 0.75, type: 16 });
    P3({ x, y: 0.12, z, max: 0.5, s0: 1, s1: (big ? 7 : 4.4) * k, a0: 0.6, type: 13, flat: 1 });
    for (let i = 0; i < (big ? (lite ? 5 : 9) : 4); i++) { const a = R0(0, 6.283), d = R0(0, 0.9) * k; P3({ x: x + Math.cos(a) * d, y: y + R0(-0.1, 0.6), z: z + Math.sin(a) * d, vx: Math.cos(a) * R0(0.8, 2.4) * k, vy: R0(1.4, 3.4) * k, vz: Math.sin(a) * R0(0.8, 2.4) * k, max: R0(0.32, 0.62), s0: R0(0.7, 1.2) * k, s1: R0(1.7, 2.7) * k, a0: 1, type: 12, fin: 1 }); }
    for (let i = 0; i < (big ? (lite ? 4 : 7) : 3); i++) { const a = R0(0, 6.283), d = R0(0, 1.1) * k; P3({ x: x + Math.cos(a) * d, y: y + R0(0.2, 0.9), z: z + Math.sin(a) * d, vx: Math.cos(a) * R0(0.3, 1), vy: R0(1.3, 2.6), vz: Math.sin(a) * R0(0.3, 1), max: R0(1.1, 1.8), s0: R0(0.7, 1.1) * k, s1: R0(2.2, 3.3) * k, a0: 0.5, type: 11, fin: 1 }); }
    for (let i = 0; i < (big ? 10 : 5); i++) { const a = R0(0, 6.283); const sp = R0(5, 10); P3({ x, y: y + 0.3, z, vx: Math.cos(a) * sp * 0.7, vy: R0(4, 9), vz: Math.sin(a) * sp * 0.7, g: 22, max: R0(0.7, 1.2), s0: R0(0.14, 0.26), s1: 0.12, a0: 1, type: 5 }); }
    for (let i = 0; i < (big ? 18 : 8); i++) { const a = R0(0, 6.283); const sp = R0(9, 18); P3({ x, y: y + 0.2, z, vx: Math.cos(a) * sp * 0.8, vy: R0(3, 10), vz: Math.sin(a) * sp * 0.8, g: 18, max: R0(0.3, 0.6), s0: 0.09, s1: 0.05, a0: 1, type: 4, st: 0.035 }); }
  };
  const sparks = (x, y, z, n, type = 4, sp = 7) => { for (let i = 0; i < n; i++) { const a = R0(0, 6.283); const v = R0(sp * 0.4, sp); P3({ x, y, z, vx: Math.cos(a) * v, vy: R0(1, 5), vz: Math.sin(a) * v, g: 14, max: R0(0.18, 0.36), s0: 0.08, s1: 0.04, a0: 1, type, st: 0.03 }); } };
  const bolts = (x, y, z, R1, n) => {
    for (let b = 0; b < n; b++) {
      let a = (b / n) * 6.283 + Math.random() * 0.5, px = x, py = y, pz = z;
      const life = 0.14 + Math.random() * 0.12;
      for (let j = 1; j <= 5; j++) {
        a += (Math.random() - 0.5) * 0.9;
        const d = (R1 / 5) * (0.7 + Math.random() * 0.6);
        const qx = px + Math.cos(a) * d, qz = pz + Math.sin(a) * d, qy = y + (Math.random() - 0.3) * 0.7;
        const L = Math.hypot(qx - px, qy - py, qz - pz) * 0.5 + 0.05;
        P3({ x: (px + qx) / 2, y: (py + qy) / 2, z: (pz + qz) / 2, max: life, s0: 0.14, s1: 0.1, a0: 1, type: 15, d: [qx - px, qy - py, qz - pz], L });
        px = qx; py = qy; pz = qz;
      }
    }
  };
  const popNum = (x, z, text, col, big = false, y = 2.1) => {
    const g = G.current;
    if (g.nums.length > 40) g.nums.shift();
    g.nums.push({ x: x + R0(-0.3, 0.3), z, y, text, col, t: 0, life: big ? 1.1 : 0.85, big });
  };
  const camFoc = () => { const g = G.current; return g.cam ? g.cam.at : [0, 0, 0]; };
  const volAt = (x, z) => { const c = camFoc(); return clamp(1.1 - Math.hypot(x - c[0], z - c[2]) / 26, 0.12, 1); };

  const heroMesh = (key) => {
    const st = RR.current;
    if (!st) return null;
    if (!st.heroM[key]) { const H = heroMeshes(key); st.heroM[key] = { body: st.R.mesh(H.body), leg: st.R.mesh(H.leg), hip: H.hip }; }
    return st.heroM[key];
  };
  const robotMesh = (type) => {
    const st = RR.current;
    if (!st) return null;
    if (!st.robM[type]) { const M = robotMeshes(type); st.robM[type] = { body: st.R.mesh(M.body), leg: M.leg ? st.R.mesh(M.leg) : null, hip: M.hip }; }
    return st.robM[type];
  };
  const ensureArena = (key) => {
    const st = RR.current;
    if (!st) return false;
    const k = validArena(key);
    if (st.arena && st.arena.key === k) return true;
    if (st.arena) for (const it of st.arena.items) st.R.drop(it.mesh);
    const A = E.makeArena(k);
    const M = arenaMeshes(A);
    const items = [{ mesh: st.R.mesh(M.ground) }, { mesh: st.R.mesh(M.deco) }, { mesh: st.R.mesh(M.water) }, { mesh: st.R.mesh(M.props), cast: true }, { mesh: st.R.mesh(M.outer), cast: true }];
    const bushes = M.bushes.map((b) => ({ mesh: st.R.mesh(b.data), bs: b.bs, cells: b.cells }));
    for (const b of bushes) items.push(b);
    const env = arenaEnv(A);
    env.baseFog = env.fogDen;
    if (G.current.budget.tier >= 2) env.shadows = false;
    st.arena = { key: k, A, items, bushes, env };
    return true;
  };

  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return undefined;
    const g = G.current;
    const pref = gfxRef.current;
    g.budget.tier = pref === 'fast' || window.__zsiegeLow ? 2 : pref === 'best' ? 0 : weakPhone() ? 1 : 0;
    let R = null;
    try { R = createRenderer(cv, { shadowSize: g.budget.tier === 0 ? 2048 : 1024 }); } catch { R = null; }
    if (!R) { setFailed(true); return undefined; }
    let fx = null;
    try { const F = fxSiege(); fx = Object.fromEntries(Object.keys(F).map((k) => [k, R.mesh(F[k])])); } catch { fx = null; }
    RR.current = { R, arena: null, heroM: {}, robM: {}, fx };
    const t = setTimeout(() => { try { ensureArena(arenaRef.current); setReady(true); } catch { setFailed(true); } }, 50);
    return () => {
      clearTimeout(t);
      RR.current = null;
      try { R.dispose(); } catch {}
      setTimeout(() => { if (!cv.isConnected) R.lose(); }, 0);
    };
  }, []);
  useEffect(() => {
    const st = RR.current;
    if (!st || !st.arena || st.arena.key === arena || phaseRef.current !== 'menu') return undefined;
    setReady(false);
    const t = setTimeout(() => { try { ensureArena(arena); setReady(true); } catch { setFailed(true); } }, 40);
    return () => clearTimeout(t);
  }, [arena]);
  useEffect(() => { const t = setTimeout(() => setThumbs(heroThumbs()), 140); return () => clearTimeout(t); }, []);
  useEffect(() => { if (aThumbs[arena] || phase !== 'menu') return undefined; const t = setTimeout(() => { const u = arenaThumb(arena); if (u) setAThumbs((p) => ({ ...p, [arena]: u })); }, 900); return () => clearTimeout(t); }, [arena, phase]);
  useEffect(() => { if (!arenaSheet) return undefined; const t = setTimeout(() => { const o = {}; for (const k of E.ARENA_KEYS) o[k] = arenaThumb(k); setAThumbs(o); }, 60); return () => clearTimeout(t); }, [arenaSheet]);

  const freshRoster = () => {
    if (solo) return ['me'];
    const present = relay.peers.filter((p) => !(metaRef.current[p] && metaRef.current[p].w));
    const order = joinOrder.current.filter((p) => present.includes(p));
    present.forEach((p) => { if (!order.includes(p)) order.push(p); });
    return [myId, ...order.filter((p) => p !== myId)].slice(0, E.SQUAD_MAX);
  };
  const heroFor = (k) => (k === kindOf() ? heroRef.current : validHero(heroOfRef.current[k] || (metaRef.current[k] && metaRef.current[k].h)));

  const beginGame = (cfg) => {
    const g = G.current;
    const ak = validArena(cfg.arena);
    if (ak !== arenaRef.current) setArena(ak);
    try { ensureArena(ak); } catch {}
    const W = E.newWorld(ak, validLv(cfg.lv), cfg.seed | 0 || 1, { endless: !!cfg.en });
    W.host = isHost; W.local = new Set(); W.nowMs = performance.now();
    cfg.ids.forEach((k, i) => {
      const p = E.heroSpawn(W.A, i);
      const h = E.mkHero(k, validHero(cfg.heroes && cfg.heroes[k]), p.x, p.z, k.startsWith('bot'));
      W.heroes[k] = h; W.order.push(k);
    });
    if (!watch && cfg.ids.includes(kindOf())) W.local.add(kindOf());
    g.botMeta = {};
    for (const b of cfg.bots || []) { g.botMeta[b.id] = { n: b.n }; if (isHost) W.local.add(b.id); }
    g.W = W; g.rid = cfg.rid; g.ids = cfg.ids.slice(); g.bots = (cfg.bots || []).map((b) => b.id);
    g.parts = []; g.nums = []; g.beams = []; g.seq = 0; g.hsq = 0; g.lastSeq = -1; g.lastSnapAt = performance.now(); g.waveSeen = 0; g.stSeen = ''; g.claimed = new Set(); g.over = false; g.cam = null; g.shake = 0; g.fireQ = []; g.aim = { on: false };
    if (cfg.lv !== lvRef.current && E.LEVELS[cfg.lv]) setLv(cfg.lv);
    setEndless(!!cfg.en);
    setResult(null); setPaused(false); setQuick(false); setFollow(null); setArenaSheet(false); setOptSheet(false);
    setPhase('play');
    showBanner('Get ready', `${E.ARENAS[ak].name}, ${E.LEVELS[W.lv].name}`, 'blue', 2.6);
    J.reset();
    Sfx.init();
  };
  const startGame = () => {
    if (!isHost || !ready) return;
    Sfx.init();
    const ids = solo ? ['me'] : freshRoster();
    const heroes = {};
    ids.forEach((k) => { heroes[k] = heroFor(k); });
    const used = new Set(Object.values(heroes));
    const bots = [];
    const want = Math.min(E.SQUAD_MAX, ids.length + botNRef.current);
    for (let i = ids.length; i < want; i++) {
      const id = `bot${i}`;
      const free = E.HERO_KEYS.filter((k) => !used.has(k));
      const k = free.length ? (free.includes('mira') && !used.has('mira') && i === ids.length ? 'mira' : free[(i * 7) % free.length]) : E.HERO_KEYS[i % 4];
      used.add(k);
      bots.push({ id, n: BOT_NAMES[i % BOT_NAMES.length] });
      ids.push(id); heroes[id] = k;
    }
    const cfg = { rid: `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`, ids, heroes, bots, arena: arenaRef.current, lv: lvRef.current, en: endRef.current ? 1 : 0, seed: (Math.random() * 1e9) | 0 };
    if (!solo) { setRoster(ids.filter((k) => !k.startsWith('bot'))); relay.send('go', cfg); }
    beginGame(cfg);
  };
  const toMenu = (quiet) => {
    const g = G.current;
    g.W = null; g.ids = []; g.bots = []; g.parts = []; g.nums = []; g.beams = [];
    setPhase('menu'); setResult(null); setBanner(null);
    if (!solo && isHost && !quiet) relay.send('menu', {});
  };
  const finishUp = (res) => {
    const g = G.current;
    if (phaseRef.current === 'done' || g.over) return;
    g.over = true; g.overAt = performance.now();
    const W = g.W;
    const wave = res.wave || (W ? W.wave.n : 0);
    const bk = BEST_KEY(uid, W ? W.A.key : arenaRef.current, W ? W.lv : lvRef.current);
    const prev = Number(readPref(bk, '0')) || 0;
    const reached = res.won ? wave : Math.max(0, wave);
    if (reached > prev && inGame()) savePref(bk, reached);
    const list = (res.list || []).filter((r) => Array.isArray(r) && typeof r[0] === 'string');
    setResult({ won: !!res.won, wave, score: res.score || 0, list, prev, best: Math.max(prev, reached), newBest: inGame() && reached > prev, lost: !!res.lost, endless: W ? W.endless : false });
    setTimeout(() => { if (G.current.over) setPhase('done'); }, res.won ? 1400 : 1100);
    if (res.won) { Sfx.play('win', { vol: 0.85 }); try { window.dispatchEvent(new CustomEvent('zchat-screen-fx', { detail: 'confetti' })); } catch {} }
    else Sfx.play('die', { vol: 0.6 });
  };
  const statList = (W) => W.order.map((k) => { const h = W.heroes[k]; return [k, h.stats.kills, Math.round(h.stats.dmg), h.stats.rev, Math.round(h.stats.heal), h.key]; });
  const hostOver = () => {
    const g = G.current, W = g.W;
    if (!W || g.over) return;
    const res = { won: !!W.over.won, wave: W.wave.n, score: W.score, list: statList(W) };
    if (!solo) relay.send('over', { r: g.rid, w: res.won ? 1 : 0, n: res.wave, sc: res.score, l: res.list });
    finishUp(res);
  };

  const tryFire = (h, f) => {
    const g = G.current, W = g.W;
    if (!W || !h || h.st !== 0) return false;
    const H = E.HEROES[h.key];
    const sup = f.kind === 'sup';
    if (sup ? h.sup < 1 : !E.canFire(h)) return false;
    const S = sup ? H.sup : H.atk;
    const lob = S.k === 'lob' || S.k === 'mega';
    let a = f.a, dist = f.dist;
    if (f.auto || a == null) {
      const rng = S.rng || S.rad || H.atk.rng;
      const t = E.autoAim(W, h, rng, !lob);
      if (t) {
        const b = W.robots.find((r) => r.id === t.id);
        const tt = lob ? S.flight : t.d / (S.spd || 30);
        const vx = b && b.mv ? Math.sin(b.yaw) * b.mv : 0, vz = b && b.mv ? Math.cos(b.yaw) * b.mv : 0;
        const tx = t.x + vx * tt * 0.7, tz = t.z + vz * tt * 0.7;
        a = Math.atan2(tx - h.x, tz - h.z); dist = Math.hypot(tx - h.x, tz - h.z);
      } else { a = h.yaw; dist = (S.rng || 8) * 0.7; }
    }
    if (lob && f.mag != null && !f.auto) dist = Math.max(1.5, f.mag * S.rng);
    const seed = (Math.random() * 1e9) | 0;
    E.fireHero(W, h, f.kind, a, dist, seed);
    if (!solo) relay.send('f', { r: g.rid, h: h.id, c: sup ? 's' : 'a', a: +a.toFixed(3), d: dist == null ? null : +dist.toFixed(2), s: seed, x: +h.x.toFixed(2), z: +h.z.toFixed(2) });
    if (h.id === kindOf() && sup) { try { navigator.vibrate && navigator.vibrate(18); } catch {} }
    return true;
  };
  const heroPack = (W, h) => {
    const mv = Math.hypot(h.vx, h.vz) > 0.4 ? 1 : 0;
    const f = mv | (h.hid ? 2 : 0) | (W.t - h.seen < 1.2 ? 4 : 0) | (h.pw > 0 ? 8 : 0);
    return [Math.round(h.x * 20), Math.round(h.z * 20), Math.round(h.yaw * 100), Math.round(h.hp), h.st, f, Math.round(h.sup * 100), Math.round(h.rv * 100), Math.round(h.downT * 10)];
  };
  const applyPack = (W, h, p, now) => {
    if (!Array.isArray(p) || p.length < 9) return;
    const x = num(p[0]) / 20, z = num(p[1]) / 20;
    if (!Number.isFinite(x) || !Number.isFinite(z)) return;
    h.nx = clamp(x, 0, W.A.wx); h.nz = clamp(z, 0, W.A.wz); h.nyaw = num(p[2]) / 100;
    if (h.x == null || h.netAt == null) { h.x = h.nx; h.z = h.nz; }
    const hp = clamp(num(p[3]), 0, h.max);
    if (hp < h.hp - 1 && h.st === 0) h.flash = 0.12;
    h.hp = hp;
    const st = clamp(p[4] | 0, 0, 2);
    if (st !== h.st) {
      if (st === 1 && h.st === 0) W.ev.push({ k: 'down', id: h.id, x: h.x, z: h.z, remote: true });
      else if (st === 0 && h.st !== 0) W.ev.push({ k: 'revive', id: h.id, x: h.x, z: h.z, remote: true });
      h.st = st;
    }
    const f = p[5] | 0;
    h.mvF = f & 1; h.hid = !!(f & 2); if (f & 4) h.seen = W.t; h.pw = f & 8 ? 1 : 0;
    h.sup = clamp(num(p[6]) / 100, 0, 1); h.rv = clamp(num(p[7]) / 100, 0, 1); h.downT = clamp(num(p[8]) / 10, 0, E.DOWN_T);
    h.netAt = now; h.gone = false;
  };

  useEffect(() => {
    if (solo || !room) return undefined;
    const cleanCfg = (m) => {
      if (!m || !Array.isArray(m.ids) || typeof m.rid !== 'string') return null;
      const ids = m.ids.filter((k) => typeof k === 'string').slice(0, E.SQUAD_MAX);
      const heroes = {};
      for (const k of ids) heroes[k] = validHero(m.heroes && m.heroes[k]);
      const bots = Array.isArray(m.bots) ? m.bots.filter((b) => b && typeof b.id === 'string' && ids.includes(b.id)).map((b) => ({ id: b.id, n: String(b.n || 'Bot').slice(0, 16) })) : [];
      return { rid: m.rid, ids, heroes, bots, arena: validArena(m.arena), lv: validLv(m.lv), en: m.en ? 1 : 0, seed: num(m.seed, 1) | 0 };
    };
    const offs = [
      relay.on('*', (m) => { if (m.m) { metaRef.current[m.from] = m.m; setNames((p) => (p[m.from] === m.m.n ? p : { ...p, [m.from]: m.m.n })); if (m.m.h && E.HEROES[m.m.h]) setHeroOf((p) => (p[m.from] ? p : { ...p, [m.from]: m.m.h })); } if (!joinOrder.current.includes(m.from)) joinOrder.current.push(m.from); }),
      relay.on('roster', (m) => {
        if (isHost || !Array.isArray(m.ids)) return;
        setRoster(m.ids.filter((k) => typeof k === 'string').slice(0, E.SQUAD_MAX));
        if (m.nm && typeof m.nm === 'object') setNames((p) => ({ ...p, ...m.nm }));
        if (m.hk && typeof m.hk === 'object') setHeroOf((p) => ({ ...p, ...Object.fromEntries(Object.entries(m.hk).filter(([, v]) => E.HEROES[v])) }));
        if (typeof m.ar === 'string' && E.ARENAS[m.ar] && phaseRef.current === 'menu') setArena(m.ar);
        if (typeof m.lv === 'string' && E.LEVELS[m.lv]) setLv(m.lv);
        if (typeof m.bn === 'number') setBotN(clamp(m.bn | 0, 0, 3));
        if (typeof m.en === 'number') setEndless(!!m.en);
        const cfg = cleanCfg(m.cfg);
        if (cfg && phaseRef.current === 'menu' && !G.current.W) beginGame(cfg);
      }),
      relay.on('go', (m) => { if (isHost) return; const cfg = cleanCfg(m); if (cfg) beginGame(cfg); }),
      relay.on('menu', () => { if (!isHost) toMenu(true); }),
      relay.on('hero', (m) => { if (m && E.HEROES[m.k]) setHeroOf((p) => ({ ...p, [m.from]: m.k })); }),
      relay.on('hs', (m) => {
        const g = G.current, W = g.W;
        if (!W || !m || m.r !== g.rid || m.from === kindOf()) return;
        const h = W.heroes[m.from];
        if (!h || h.bot) return;
        if (typeof m.q === 'number') { if (m.q <= (h.netQ == null ? -1 : h.netQ)) return; h.netQ = m.q; }
        applyPack(W, h, m.p, performance.now());
      }),
      relay.on('f', (m) => {
        const g = G.current, W = g.W;
        if (!W || !m || m.r !== g.rid) return;
        const hid = typeof m.h === 'string' ? m.h : m.from;
        const h = W.heroes[hid];
        if (!h || W.local.has(hid)) return;
        if (hid !== m.from && !(g.bots.includes(hid) && m.from === hostId)) return;
        const x = num(m.x, h.x), z = num(m.z, h.z);
        if (Math.hypot(x - h.x, z - h.z) < 4) { h.x = x; h.z = z; }
        const a = num(m.a, h.yaw);
        E.fireHero(W, h, m.c === 's' ? 'sup' : 'atk', a, m.d == null ? null : clamp(num(m.d), 0, 30), num(m.s, 1) | 0);
      }),
      relay.on('es', (m) => {
        const g = G.current, W = g.W;
        if (isHost || !W || !m || m.r !== g.rid) return;
        if (typeof m.q === 'number') { if (m.q <= g.lastSeq) return; g.lastSeq = m.q; }
        const now = performance.now();
        g.lastSnapAt = now;
        if (Array.isArray(m.a)) E.applyRobotSnap(W, m.a, now);
        if (Array.isArray(m.w) && m.w.length >= 4) { W.wave.n = m.w[0] | 0; W.wave.st = ST_NAME[m.w[1] | 0] || 'fight'; W.wave.t = num(m.w[2]) / 10; W.wave.left = m.w[3] | 0; }
        if (typeof m.sc === 'number') W.score = m.sc;
        if (Array.isArray(m.d)) W.drops = m.d.filter((d) => Array.isArray(d) && !g.claimed.has(d[0])).map((d) => ({ id: d[0] | 0, k: E.DROP_KEYS[d[1] | 0] || 'hp', x: num(d[2]) / 10, z: num(d[3]) / 10, life: num(d[4], 140) / 10 }));
        if (Array.isArray(m.b)) for (const b of m.b) { if (!Array.isArray(b) || typeof b[0] !== 'string') continue; const h = W.heroes[b[0]]; if (h && h.bot) applyPack(W, h, b.slice(1), now); }
      }),
      relay.on('re', (m) => {
        const g = G.current, W = g.W;
        if (isHost || !W || !m || m.r !== g.rid || !Array.isArray(m.e)) return;
        for (const e of m.e.slice(0, 200)) {
          if (Array.isArray(e) && e[0] === 'pg') { const h = W.heroes[e[2]]; if (h && W.local.has(h.id)) E.takeDrop(W, h, { k: E.DROP_KEYS[e[3] | 0] || 'hp', x: h.x, z: h.z }); continue; }
          E.applyNetEvent(W, e);
        }
      }),
      relay.on('ev', (m) => {
        const g = G.current, W = g.W;
        if (!isHost || !W || !m || m.r !== g.rid) return;
        if (m.k === 'pk') {
          const i = W.drops.findIndex((d) => d.id === (m.i | 0));
          const h = W.heroes[m.from];
          if (i < 0 || !h || h.st !== 0 || Math.hypot(W.drops[i].x - h.x, W.drops[i].z - h.z) > 3.5) return;
          const d = W.drops.splice(i, 1)[0];
          W.net.push(['pg', d.id, m.from, E.DROP_KEYS.indexOf(d.k)]);
          W.ev.push({ k: 'pick', id: m.from, kind: d.k, x: d.x, z: d.z, remote: true });
        } else if (m.k === 'rv' && Array.isArray(m.by)) {
          for (const k of m.by.slice(0, 4)) { const h = W.heroes[k]; if (h) h.stats.rev += 1; }
        }
      }),
      relay.on('over', (m) => {
        const g = G.current;
        if (isHost || !m || m.r !== g.rid) return;
        finishUp({ won: !!m.w, wave: m.n | 0, score: m.sc | 0, list: Array.isArray(m.l) ? m.l.slice(0, 4) : [] });
      }),
      relay.on('emo', (m) => { const e = String(m.e || ''); if (!EMOTES.includes(e)) return; setBubbles((p) => ({ ...p, [m.from]: { e, at: Date.now() } })); Sfx.play('pop', { vol: 0.45 }); }),
      relay.on('bye', (m) => { const n = namesRef.current[m.from] || 'A friend'; if (rosterRef.current.includes(m.from) && !rosterSeen.current.bye.has(m.from)) { rosterSeen.current.bye.add(m.from); pushNote(`${n} left the game`, 'leave'); } }),
    ];
    return () => offs.forEach((f) => f && f());
  }, [relay.on]);

  useEffect(() => {
    if (solo || !room || !isHost) return undefined;
    const tick = () => {
      const present = relay.peers.filter((p) => !(metaRef.current[p] && metaRef.current[p].w));
      const cur = rosterRef.current;
      const playing = phaseRef.current !== 'menu';
      const next = playing ? cur.filter((p) => p === myId || present.includes(p)) : freshRoster();
      const w = relay.peers.filter((p) => metaRef.current[p] && metaRef.current[p].w);
      setWatchers((prev) => (prev.join('|') === w.join('|') ? prev : w));
      if (next.join('|') !== cur.join('|')) setRoster(next);
      const nm = {}, hk = {};
      next.concat(w).forEach((p) => { nm[p] = p === myId ? myFirst : (metaRef.current[p] && metaRef.current[p].n) || 'Friend'; });
      next.forEach((p) => { hk[p] = heroFor(p); });
      const g = G.current, W = g.W;
      const cfg = playing && W && !g.over ? { rid: g.rid, ids: g.ids, heroes: Object.fromEntries(g.ids.map((k) => [k, W.heroes[k] ? W.heroes[k].key : 'blaze'])), bots: g.bots.map((k) => ({ id: k, n: g.botMeta[k] ? g.botMeta[k].n : 'Bot' })), arena: W.A.key, lv: W.lv, en: W.endless ? 1 : 0, seed: W.seed } : null;
      relay.send('roster', { ids: next, nm, hk, ar: arenaRef.current, lv: lvRef.current, bn: botNRef.current, en: endRef.current ? 1 : 0, cfg });
    };
    tick();
    const iv = setInterval(tick, 1500);
    return () => clearInterval(iv);
  }, [relay.peers, allowWatch, arena, lv, botN, endless, heroKey]);
  useEffect(() => {
    if (solo || !room || isHost) return undefined;
    const w = relay.peers.filter((p) => metaRef.current[p] && metaRef.current[p].w);
    setWatchers((prev) => (prev.join('|') === w.join('|') ? prev : w));
    return undefined;
  }, [relay.peers]);
  useEffect(() => {
    if (solo) return;
    const R1 = rosterSeen.current;
    const prev = R1.list;
    R1.list = roster;
    if (!prev || Date.now() - R1.at < 2500) return;
    const me0 = kindOf();
    for (const k of roster) if (!prev.includes(k) && k !== me0) { R1.bye.delete(k); pushNote(`${namesRef.current[k] || 'A friend'} joined`, 'join'); }
    for (const k of prev) if (!roster.includes(k) && k !== me0 && !R1.bye.has(k)) { R1.bye.add(k); pushNote(`${namesRef.current[k] || 'A friend'} left the game`, 'leave'); }
  }, [roster]);
  const watchList = useMemo(() => watchers.map((id) => ({ id, n: names[id] || 'Friend' })), [watchers, names]);
  useWatchNotices(watchList, pushNote, !solo && !watch);

  const pickHero = (k) => { if (!E.HEROES[k]) return; kitTap(); setHeroKey(k); savePref(PREF.hero, k); if (!solo) relay.send('hero', { k }); };
  const pickArena = (k) => { if (!isHost || !E.ARENAS[k]) return; kitTap(); setArena(k); savePref(PREF.arena, k); };
  const pickLv = (k) => { if (!isHost || !E.LEVELS[k]) return; kitTap(); setLv(k); savePref(PREF.lv, k); };
  const pickBots = (v) => { if (!isHost) return; const n = clamp(Number(v) | 0, 0, 3); kitTap(); setBotN(n); savePref(PREF.bots, n); };
  const pickWaves = (v) => { if (!isHost) return; kitTap(); const on = v === 'end'; setEndless(on); savePref(PREF.end, on ? '1' : '0'); };
  const pickGfx = (k) => { kitTap(); setGfx(k); savePref(PREF.gfx, k); const g = G.current; g.budget.tier = k === 'fast' ? 2 : k === 'best' ? 0 : weakPhone() ? 1 : 0; g.budget.n = 0; const st = RR.current; if (st && st.arena) st.arena.env.shadows = g.budget.tier < 2; };

  useEffect(() => {
    const kd = (e) => {
      if (phaseRef.current !== 'play') return;
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) { keys.current.add(k); e.preventDefault(); }
      else if (k === ' ' || k === 'e') { const g = G.current; const mo = g.mouse; G.current.fireQ.push(mo ? { kind: 'sup', a: mo.a, dist: mo.d } : { kind: 'sup', auto: true }); e.preventDefault(); }
      else if (k === 'f' || k === 'j') { G.current.fireQ.push({ kind: 'atk', auto: true }); }
    };
    const ku = (e) => keys.current.delete(e.key.toLowerCase());
    const blur = () => keys.current.clear();
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku); window.addEventListener('blur', blur);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); window.removeEventListener('blur', blur); };
  }, []);

  const toWorld = (sx, sy) => {
    const st = RR.current, g = G.current, wrap = wrapRef.current;
    if (!st || !g.VP || !wrap) return null;
    const cw = wrap.clientWidth, ch = wrap.clientHeight;
    const inv = g.invVP || (g.invVP = m4.inv(g.VP));
    const nx = (sx / cw) * 2 - 1, ny = 1 - (sy / ch) * 2;
    const p0 = m4.apply(inv, nx, ny, -1), p1 = m4.apply(inv, nx, ny, 1);
    const dy = p0[1] - p1[1];
    if (Math.abs(dy) < 1e-6) return null;
    const t = p0[1] / dy;
    return { x: p0[0] + (p1[0] - p0[0]) * t, z: p0[2] + (p1[2] - p0[2]) * t };
  };
  const mouseAim = (e) => {
    const g = G.current, W = g.W;
    if (!W || !wrapRef.current) return;
    const p = stagePoint(wrapRef.current, e, sideRef.current);
    const q = toWorld(p.x, p.y);
    const h = W.heroes[kindOf()];
    if (!q || !h) { g.mouse = null; return; }
    g.mouse = { x: q.x, z: q.z, a: Math.atan2(q.x - h.x, q.z - h.z), d: Math.hypot(q.x - h.x, q.z - h.z) };
  };
  const wrapDown = (e) => {
    if (e.pointerType === 'mouse') {
      if (phaseRef.current !== 'play' || sheetOpen.current) return;
      mouseAim(e);
      const mo = G.current.mouse;
      if (mo) G.current.fireQ.push({ kind: e.button === 2 ? 'sup' : 'atk', a: mo.a, dist: mo.d, mag: null });
      return;
    }
    J.handlers.onPointerDown(e);
  };
  const wrapMove = (e) => { if (e.pointerType === 'mouse') { mouseAim(e); return; } J.handlers.onPointerMove(e); };

  const aimDown = (kind) => (e) => {
    e.stopPropagation();
    if (e.cancelable) e.preventDefault();
    if (phaseRef.current !== 'play' || sheetOpen.current) return;
    Sfx.init();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    const p = stagePoint(wrapRef.current, e, sideRef.current);
    G.current.aim = { on: true, kind, id: e.pointerId, ox: p.x, oy: p.y, dx: 0, dy: 0, eng: false, a: 0, mag: 0 };
    setAimUi(kind);
  };
  const aimMove = (e) => {
    const A = G.current.aim;
    if (!A.on || A.id !== e.pointerId) return;
    const p = stagePoint(wrapRef.current, e, sideRef.current);
    A.dx = p.x - A.ox; A.dy = p.y - A.oy;
    const L = Math.hypot(A.dx, A.dy);
    const R2 = 58 * look.size;
    if (L > 14) A.eng = true;
    A.mag = clamp((L - 10) / R2, 0, 1);
    if (L > 4) A.a = Math.atan2(A.dx, A.dy);
    const knob = A.kind === 'sup' ? supKnob.current : atkKnob.current;
    if (knob) { const k = L > R2 ? R2 / L : 1; knob.style.transform = `translate(${A.dx * k * 0.62}px,${A.dy * k * 0.62}px)`; }
  };
  const aimUp = (e) => {
    const g = G.current, A = g.aim;
    if (!A.on || A.id !== e.pointerId) return;
    const L = Math.hypot(A.dx, A.dy);
    const knob = A.kind === 'sup' ? supKnob.current : atkKnob.current;
    if (knob) knob.style.transform = 'translate(0px,0px)';
    g.aim = { on: false };
    setAimUi(null);
    if (e.type === 'pointercancel' || e.type === 'lostpointercapture') { if (!A.eng) return; }
    if (A.eng && L < 12) return;
    if (A.eng) g.fireQ.push({ kind: A.kind, a: A.a, mag: A.mag });
    else g.fireQ.push({ kind: A.kind, auto: true });
  };

  if (typeof window !== 'undefined' && window.__zfake) window.__zsiege = { W: () => G.current.W, g: () => G.current, fire: (kind, a, dist) => G.current.fireQ.push(a == null ? { kind, auto: true } : { kind, a, dist }), move: (x, z) => { G.current.keyMove = [x, z]; }, god: (on) => { const W = G.current.W; const h = W && W.heroes[kindOf()]; if (h) h.god = on !== false; }, wave: (n) => { const W = G.current.W; if (W && isHost) { W.robots.length = 0; W.wave.st = 'break'; W.wave.t = 0.1; W.wave.n = Math.max(0, n - 1); } }, kill: () => { const W = G.current.W; if (W && isHost) for (const b of W.robots) E.hurtRobot(W, b, 1e6, kindOf(), 0, 1, {}); }, start: () => startGame(), sup: () => { const W = G.current.W; const h = W && W.heroes[kindOf()]; if (h) h.sup = 1; }, hurt: (d) => { const W = G.current.W; const h = W && W.heroes[kindOf()]; if (h) E.hurtHero(W, h, d || 500, 'test'); } };

  const handleEvents = (W, now) => {
    const g = G.current;
    const myK = kindOf();
    for (const e of W.ev) {
      const k = e.k;
      if (k === 'fire') {
        const H = E.HEROES[e.hero];
        const mine = e.id === myK;
        const v = mine ? 1 : volAt(e.x, e.z) * 0.8;
        const fx = e.x + Math.sin(e.a) * 0.8, fz = e.z + Math.cos(e.a) * 0.8;
        if (e.kind === 'sup') { zap('super', v * 0.8); P3({ x: e.x, y: 0.1, z: e.z, max: 0.4, s0: 0.6, s1: 2.3, a0: 0.6, type: 14, flat: 1 }); for (let i = 0; i < 10; i++) { const a = R0(0, 6.283); P3({ x: e.x + Math.cos(a) * 0.5, y: R0(0.3, 1.3), z: e.z + Math.sin(a) * 0.5, vx: Math.cos(a) * 2, vy: R0(1, 2.5), vz: Math.sin(a) * 2, max: R0(0.35, 0.6), s0: 0.32, s1: 0.05, a0: 1, type: 7 }); } }
        if (!H) continue;
        const sk = (e.kind === 'sup' ? H.sup : H.atk).k;
        if (sk === 'spread' || sk === 'wave') { zap('pellet', v); P3({ x: fx, y: 0.85, z: fz, max: 0.09, s0: 0.5, s1: sk === 'wave' ? 1.9 : 1.1, a0: 0.9, type: 16 }); if (sk === 'wave') zap('boom', v * 0.7); }
        else if (sk === 'bolt') { zap('bolt', v); P3({ x: fx, y: 0.95, z: fz, max: 0.09, s0: 0.4, s1: 0.9, a0: 0.9, type: 6 }); }
        else if (sk === 'lob' || sk === 'mega') zap('lob', v);
        else if (sk === 'orb') { zap('orb', v); P3({ x: fx, y: 1, z: fz, max: 0.2, s0: 0.3, s1: 1, a0: 0.8, type: 3 }); }
        else if (sk === 'beam') zap('beam', v);
        else if (sk === 'bloom') zap('heal', v);
        if (mine) g.shake = Math.max(g.shake, e.kind === 'sup' ? 0.35 : 0.08);
      } else if (k === 'beam') {
        g.beams.push({ x: e.x, z: e.z, a: e.a, len: e.len, t: 0, max: 0.4 });
        const ux = Math.sin(e.a), uz = Math.cos(e.a);
        for (let d = 1; d < e.len; d += 0.9) P3({ x: e.x + ux * d, y: 0.95, z: e.z + uz * d, vy: R0(0.3, 1.2), max: R0(0.3, 0.5), s0: 0.5, s1: 0.1, a0: 0.8, type: 6 });
        sparks(e.x + ux * e.len, 0.9, e.z + uz * e.len, 8, 4, 8);
      } else if (k === 'bloom') {
        P3({ x: e.x, y: 0.12, z: e.z, max: 0.7, s0: 1, s1: e.r * 2.1, a0: 0.9, type: 14, flat: 1 });
        for (let i = 0; i < 22; i++) { const a = R0(0, 6.283), d = R0(0, e.r); P3({ x: e.x + Math.cos(a) * d, y: R0(0.2, 1), z: e.z + Math.sin(a) * d, vy: R0(1, 2.6), max: R0(0.6, 1.1), s0: R0(0.25, 0.45), s1: 0.05, a0: 0.9, type: 3 }); }
      } else if (k === 'blast') {
        blast(e.x, 0.5, e.z, e.big, e.big ? 1.25 : 0.75);
        zap(e.big ? 'bigboom' : 'boom', volAt(e.x, e.z) * (e.big ? 1 : 0.8));
        const c = camFoc(); const d = Math.hypot(e.x - c[0], e.z - c[2]);
        g.shake = Math.max(g.shake, (e.big ? 0.6 : 0.25) * clamp(1 - d / 16, 0, 1));
      } else if (k === 'hitR') {
        const mine = e.by === myK;
        sparks(e.x, 0.9, e.z, e.block ? 5 : 3, e.block ? 6 : 4, 6);
        P3({ x: e.x, y: 0.95, z: e.z, max: 0.1, s0: 0.5, s1: 1.1, a0: 0.8, type: e.block ? 6 : 7 });
        if (mine) { popNum(e.x, e.z, String(e.d), e.block ? '#B8C4D6' : e.d >= 1000 ? '#FFE15A' : '#FFFFFF', e.d >= 1000); if (e.block) zap('clank', 0.6); else Sfx.play('hit', { vol: 0.32 }); }
      } else if (k === 'kill') {
        const big = e.type === 'tank' || e.type === 'boss' || e.type === 'bomber';
        blast(e.x, 0.6, e.z, big, e.type === 'boss' ? 2 : e.type === 'tank' ? 1.2 : e.type === 'bomber' ? 1 : 0.65);
        if (e.type === 'boss') { for (let i = 1; i <= 3; i++) setTimeout(() => { if (G.current.W) blast(e.x + R0(-1.6, 1.6), 1.5, e.z + R0(-1.6, 1.6), true, 1.3); zap('bigboom', 0.8); }, i * 260); g.shake = 1; }
        zap(big ? 'bigboom' : 'crunch', volAt(e.x, e.z) * (big ? 0.9 : 0.75));
        for (let i = 0; i < (big ? 10 : 5); i++) { const a = R0(0, 6.283), sp = R0(3, 7); P3({ x: e.x, y: 0.8, z: e.z, vx: Math.cos(a) * sp, vy: R0(4, 8), vz: Math.sin(a) * sp, g: 20, max: R0(0.6, 1.1), s0: R0(0.18, 0.32), s1: 0.14, a0: 1, type: 5 }); }
      } else if (k === 'spawn') {
        bolts(e.x, 0.5, e.z, 1.4, 3);
        P3({ x: e.x, y: 0.08, z: e.z, max: 0.5, s0: 0.5, s1: 3, a0: 0.9, type: 14, flat: 1 });
        if (!e.remote || volAt(e.x, e.z) > 0.3) zap('spawn', volAt(e.x, e.z) * 0.7);
        if (e.type === 'boss') { g.shake = Math.max(g.shake, 0.4); }
      } else if (k === 'rshot') {
        P3({ x: e.x, y: 1, z: e.z, max: 0.08, s0: 0.4, s1: 0.9, a0: 0.9, type: 8 });
        zap(e.type === 'tank' ? 'tshot' : 'eshot', volAt(e.x, e.z) * 0.55);
      } else if (k === 'hurtH') {
        const mine = e.id === myK;
        sparks(e.x, 0.9, e.z, 3, 8, 5);
        if (mine) { popNum(e.x, e.z, `${e.d}`, '#FF5A4E', e.d >= 900); zap('hurt', 0.8); g.shake = Math.max(g.shake, 0.18); g.hurtT = 0.4; }
      } else if (k === 'heal') {
        for (let i = 0; i < 6; i++) P3({ x: e.x + R0(-0.4, 0.4), y: R0(0.4, 1.4), z: e.z + R0(-0.4, 0.4), vy: R0(0.8, 1.8), max: R0(0.5, 0.9), s0: 0.3, s1: 0.06, a0: 0.9, type: 3 });
        if (e.id === myK || e.by === myK) { popNum(e.x, e.z, `+${e.n}`, '#6BF26B'); if (e.id === myK) zap('heal', 0.5); }
      } else if (k === 'down') {
        if (e.id === myK) { Sfx.play('pdie', { vol: 0.7 }); showBanner('You are down', 'A friend can revive you', 'red', 2.6); }
        else if (W.heroes[e.id]) pushNote(`${nameOf(e.id)} is down`, 'leave');
        sparks(e.x, 0.8, e.z, 8, 9, 5);
      } else if (k === 'revive') {
        for (let i = 0; i < 14; i++) { const a = R0(0, 6.283); P3({ x: e.x + Math.cos(a) * 0.8, y: R0(0.2, 1.6), z: e.z + Math.sin(a) * 0.8, vy: R0(1, 2.2), max: R0(0.5, 0.9), s0: 0.3, s1: 0.05, a0: 1, type: 9 }); }
        Sfx.play('star', { vol: e.id === myK ? 0.7 : 0.35 });
        if (e.id === myK) showBanner('Back in the fight', null, 'green', 1.6);
        if (W.local.has(e.id) && Array.isArray(e.by) && e.by.length) {
          if (isHost) for (const b of e.by) { const h = W.heroes[b]; if (h) h.stats.rev += 1; }
          else relay.send('ev', { r: g.rid, k: 'rv', by: e.by.slice(0, 4) });
        }
      } else if (k === 'out') {
        if (e.id === myK) showBanner('You are out', 'You come back next wave', 'red', 2.6);
      } else if (k === 'melee') {
        const h = W.heroes[e.to];
        if (h) sparks(h.x, 0.9, h.z, 4, 4, 6);
        zap('clank', volAt(h ? h.x : 0, h ? h.z : 0) * 0.6);
      } else if (k === 'wind') zap('wind', 0.35);
      else if (k === 'fuse') zap('fuse', 0.5);
      else if (k === 'zone') {
        if (e.z === 'stomp') { P3({ x: e.x, y: 0.12, z: e.z2, max: 0.6, s0: 1, s1: e.r * 2.2, a0: 0.75, type: 13, flat: 1 }); for (let i = 0; i < 16; i++) { const a = R0(0, 6.283), d = R0(0.5, e.r); P3({ x: e.x + Math.cos(a) * d, y: 0.3, z: e.z2 + Math.sin(a) * d, vy: R0(1, 3), max: R0(0.5, 0.9), s0: 0.6, s1: 1.6, a0: 0.5, type: 2 }); } zap('stomp', volAt(e.x, e.z2)); g.shake = Math.max(g.shake, 0.55); }
        else { blast(e.x, 0.5, e.z2, e.r > 2.5, e.r / 2.4); zap('boom', volAt(e.x, e.z2)); g.shake = Math.max(g.shake, 0.3 * volAt(e.x, e.z2)); }
      } else if (k === 'laserOn') zap('laser', volAt(e.x, e.z));
      else if (k === 'bossMis' || k === 'bossCall') { Sfx.play('alert', { vol: 0.4 }); }
      else if (k === 'pick') {
        if (e.id === myK) { Sfx.play(e.kind === 'hp' ? 'pick' : 'coin', { vol: 0.7 }); popNum(e.x, e.z, e.kind === 'hp' ? 'Health' : e.kind === 'pw' ? 'Power up' : 'Super charged', e.kind === 'hp' ? '#6BF26B' : e.kind === 'pw' ? '#FF7AD9' : '#FFE15A', true); }
        for (let i = 0; i < 10; i++) P3({ x: e.x + R0(-0.5, 0.5), y: R0(0.3, 1.2), z: e.z + R0(-0.5, 0.5), vy: R0(1, 2.5), max: R0(0.4, 0.8), s0: 0.3, s1: 0.05, a0: 1, type: e.kind === 'pw' ? 10 : e.kind === 'su' ? 7 : 3 });
      } else if (k === 'wallHit') { P3({ x: e.x, y: 0.9, z: e.z, max: 0.35, s0: 0.3, s1: 0.8, a0: 0.5, type: 2 }); sparks(e.x, 0.9, e.z, 2, e.side === 'r' ? 8 : 4, 4); }
      else if (k === 'fizz') P3({ x: e.x, y: 0.9, z: e.z, max: 0.25, s0: 0.25, s1: 0.5, a0: 0.4, type: 0 });
      else if (k === 'spark') sparks(e.x, 0.9, e.z, 3, 8, 4);
      else if (k === 'over' && isHost) hostOver();
    }
    W.ev.length = 0;
  };

  useEffect(() => {
    let raf = 0, last = performance.now();
    const loop = (ts) => {
      raf = requestAnimationFrame(loop);
      const st = RR.current, cv = cvRef.current, wrap = wrapRef.current, ov = ovRef.current;
      if (!st || !st.arena || !cv || !wrap) return;
      let dt = (ts - last) / 1000;
      last = ts;
      if (dt <= 0) return;
      dt = Math.min(0.1, dt) * (window.__zsiegeTS || 1);
      const g = G.current;
      const B = g.budget;
      B.avg = B.avg * 0.94 + Math.min(80, dt * 1000) * 0.06; B.n += 1;
      if (gfxRef.current === 'auto' && B.n > 80 && B.avg > 26 && B.tier < 2) { B.tier += 1; B.n = 0; B.avg = 18; if (B.tier >= 2) st.arena.env.shadows = false; }
      const cw = wrap.clientWidth, ch = wrap.clientHeight;
      const dpr = Math.min(maxDpr(B.tier >= 2), [1.75, 1.3, 1][B.tier]);
      if (cv.width !== Math.round(cw * dpr) || cv.height !== Math.round(ch * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); }
      const odpr = Math.min(2, window.devicePixelRatio || 1);
      if (ov && (ov.width !== Math.round(cw * odpr) || ov.height !== Math.round(ch * odpr))) { ov.width = Math.round(cw * odpr); ov.height = Math.round(ch * odpr); }
      const ph = phaseRef.current;
      const now = performance.now();
      const myK = kindOf();
      const step = pausedRef.current ? 0 : dt;
      const W = ph !== 'menu' ? g.W : null;
      const A = W ? W.A : st.arena.A;
      if (W) {
        W.nowMs = now;
        const mine = W.heroes[myK];
        if (mine && W.local.has(myK) && step > 0) {
          let mx = J.joy.current.x, mz = J.joy.current.y;
          const kk = keys.current;
          const kx = (kk.has('d') || kk.has('arrowright') ? 1 : 0) - (kk.has('a') || kk.has('arrowleft') ? 1 : 0);
          const kz = (kk.has('s') || kk.has('arrowdown') ? 1 : 0) - (kk.has('w') || kk.has('arrowup') ? 1 : 0);
          if (kx || kz) { mx = kx; mz = kz; }
          if (g.keyMove[0] || g.keyMove[1]) { mx = g.keyMove[0]; mz = g.keyMove[1]; }
          const aiming = g.aim.on && g.aim.eng;
          const inp = { mx, mz, aiming: aiming || !!g.mouse, aimA: aiming ? g.aim.a : g.mouse ? g.mouse.a : null };
          if (mine.god) mine.hp = mine.max;
          while (g.fireQ.length) tryFire(mine, g.fireQ.shift());
          E.stepHero(W, mine, inp, step);
          if (mine.st === 0) for (let i = W.drops.length - 1; i >= 0; i--) {
            const d = W.drops[i];
            if (Math.hypot(d.x - mine.x, d.z - mine.z) > 1.15) continue;
            if (isHost) { E.takeDrop(W, mine, d); W.drops.splice(i, 1); W.net.push(['pg', d.id, '', 0]); }
            else if (!g.claimed.has(d.id)) { g.claimed.add(d.id); W.drops.splice(i, 1); relay.send('ev', { r: g.rid, k: 'pk', i: d.id }); }
          }
        } else g.fireQ.length = 0;
        if (isHost && step > 0) for (const id of g.bots) {
          const h = W.heroes[id];
          if (!h) continue;
          const inp = E.botBrain(W, h, step);
          if (inp.fire) tryFire(h, inp.fire);
          E.stepHero(W, h, inp, step);
          if (h.st === 0) for (let i = W.drops.length - 1; i >= 0; i--) { const d = W.drops[i]; if (Math.hypot(d.x - h.x, d.z - h.z) < 1.15) { E.takeDrop(W, h, d); W.drops.splice(i, 1); } }
        }
        const kS = 1 - Math.exp(-step * 12);
        for (const id of W.order) {
          if (W.local.has(id)) continue;
          const h = W.heroes[id];
          if (h.nx == null) continue;
          const ox = h.x, oz = h.z;
          if (Math.hypot(h.nx - h.x, h.nz - h.z) > 5) { h.x = h.nx; h.z = h.nz; } else { h.x += (h.nx - h.x) * kS; h.z += (h.nz - h.z) * kS; }
          h.yaw += wrapA(h.nyaw - h.yaw) * kS;
          h.vx = step > 0 ? (h.x - ox) / step : 0; h.vz = step > 0 ? (h.z - oz) / step : 0;
          h.walk += Math.hypot(h.x - ox, h.z - oz);
          h.flash = Math.max(0, h.flash - step);
          h.rec = Math.max(0, (h.rec || 0) - step);
          if (isHost && !h.bot && now - (h.netAt || now) > 5000 && h.st === 0) { h.st = 2; h.gone = true; }
        }
        if (!isHost) E.smoothRobots(W, step);
        if (step > 0) { const subs = Math.max(1, Math.ceil(step / 0.034)); for (let i = 0; i < subs; i++) E.stepWorld(W, step / subs); }
        if (W.wave.n > g.waveSeen) {
          g.waveSeen = W.wave.n;
          const spec = E.waveSpec(W.wave.n, 1, W.lv, 1);
          if (spec.boss) { showBanner('Boss wave', `${E.ROBOTS.boss.name} is coming`, 'red', 2.8); Sfx.play('alert', { vol: 0.6 }); }
          else { showBanner(`Wave ${W.wave.n}`, W.wave.n === 1 ? 'Robots incoming' : W.endless || W.wave.n < E.WIN_WAVE ? null : 'Last wave', 'gold', 2); Sfx.play('cp', { vol: 0.6 }); }
          for (const id of W.local) { const h = W.heroes[id]; if (h && h.st === 2) { const p = E.heroSpawn(W.A, W.order.indexOf(id)); h.x = p.x; h.z = p.z; h.st = 0; h.hp = h.max; h.ammo = 3; h.downT = 0; W.ev.push({ k: 'revive', id, x: h.x, z: h.z }); } }
        }
        if (W.wave.st !== g.stSeen) {
          if (W.wave.st === 'break' && g.stSeen === 'fight') { showBanner(`Wave ${W.wave.n} cleared`, 'Catch your breath', 'green', 2.2); Sfx.play('combo', { vol: 0.6 }); }
          g.stSeen = W.wave.st;
        }
        handleEvents(W, now);
        if (isHost && W.over && !g.over) hostOver();
        if (!solo && !watch && W.local.has(myK) && now - g.sendAt > SEND_MS && W.heroes[myK]) { g.sendAt = now; g.hsq += 1; relay.send('hs', { r: g.rid, q: g.hsq, p: heroPack(W, W.heroes[myK]) }); }
        if (!solo && isHost) {
          if (now - g.snapAt > SNAP_MS) {
            g.snapAt = now; g.seq += 1;
            relay.send('es', { r: g.rid, q: g.seq, a: W.robots.filter((b) => b.hp > 0).map(E.robotSnap), w: [W.wave.n, ST_CODE[W.wave.st] || 0, Math.round(Math.max(0, W.wave.t) * 10), W.wave.left], sc: W.score, d: W.drops.map((d) => [d.id, E.DROP_KEYS.indexOf(d.k), Math.round(d.x * 10), Math.round(d.z * 10), Math.round(d.life * 10)]), b: g.bots.map((id) => [id, ...heroPack(W, W.heroes[id])]) });
          }
          if (W.net.length && now - g.reAt > RE_MS) { g.reAt = now; relay.send('re', { r: g.rid, e: W.net.splice(0, W.net.length) }); }
        } else W.net.length = 0;
        if (!solo && !isHost && ph === 'play' && !g.over && now - g.lastSnapAt > 7000) finishUp({ won: false, wave: W.wave.n, score: W.score, list: statList(W), lost: true });
      }

      const P = g.parts;
      const parts = [];
      for (let i = P.length - 1; i >= 0; i--) {
        const q = P[i];
        q.life += step || 0.016;
        if (q.life >= q.max) { P.splice(i, 1); continue; }
        if (q.g) q.vy -= q.g * step;
        q.x += q.vx * step; q.y += q.vy * step; q.z += q.vz * step;
        if (q.g && q.y < 0.05) { q.y = 0.05; q.vy *= -0.3; q.vx *= 0.6; q.vz *= 0.6; }
        const u = q.life / q.max;
        const sz = q.s0 + (q.s1 - q.s0) * (q.fin ? 1 - (1 - u) * (1 - u) : u);
        const pt = { x: q.x, y: q.y, z: q.z, size: sz, alpha: q.a0 * (q.fin ? Math.min(1, u / 0.1) * (1 - u) * (1 - u * 0.3) : 1 - u), type: q.type || 0, seed: q.seed || 0 };
        if (q.st) { const sp = Math.hypot(q.vx, q.vy, q.vz); if (sp > 0.5) { pt.dx = q.vx; pt.dy = q.vy; pt.dz = q.vz; pt.dw = sz + sp * q.st; } }
        else if (q.d) { pt.dx = q.d[0]; pt.dy = q.d[1]; pt.dz = q.d[2]; pt.dw = q.L; }
        else if (q.flat) pt.dw = -1;
        parts.push(pt);
      }

      const items = [];
      const fx = st.fx;
      const tsec = now / 1000;
      const myH = W ? W.heroes[myK] : null;
      const bushHide = new Set();
      if (myH && myH.st === 0) { const ci = E.cellIdx(A, myH.x, myH.z); if (ci >= 0) st.arena.bushes.forEach((b, i) => { if (b.cells.includes(ci)) bushHide.add(i); }); }
      for (const it of st.arena.items) {
        const bi = st.arena.bushes.indexOf(it);
        if (bi >= 0 && bushHide.has(bi)) items.push({ mesh: it.mesh, blend: 1, alpha: 0.42, bs: it.bs });
        else items.push(it);
      }
      const ringAt = (x, z, r, tint, alpha) => { if (fx) items.push({ mesh: fx.ring, model: scl(m4.pose(x, 0.03, z, 0), r, 1, r), blend: 3, alpha, tint }); };
      const discAt = (x, z, r, tint, alpha, y = 0.025) => { if (fx) items.push({ mesh: fx.disc, model: scl(m4.pose(x, y, z, 0), r, 1, r), blend: 3, alpha, tint }); };
      const drawHero = (h, key, x, z, yaw, o = {}) => {
        const HM = heroMesh(key);
        if (!HM) return;
        const spd = Math.hypot(h.vx || 0, h.vz || 0);
        const mv = clamp(spd / 3, 0, 1);
        const ph2 = (h.walk || 0) * 2.6;
        const bob = Math.abs(Math.sin(ph2)) * 0.06 * mv + (o.idle ? Math.sin(tsec * 2.2 + x) * 0.012 : 0);
        const rec = (h.rec || 0) * 0.7;
        const M = m4.pose(x - Math.sin(yaw) * rec, 0, z - Math.cos(yaw) * rec, yaw);
        if (o.down) {
          const Md = mul(M, m4.pose(0, 0.18, -0.2, 0, -1.35, 0));
          items.push({ mesh: HM.body, model: Md, cast: true });
          return;
        }
        const body = mul(M, m4.pose(0, bob, 0, 0, mv * 0.1, 0));
        items.push({ mesh: HM.body, model: body, cast: true });
        for (const s of [-1, 1]) items.push({ mesh: HM.leg, model: mul(M, m4.pose(s * HM.hip[0], HM.hip[1] + bob * 0.5, 0, 0, Math.sin(ph2) * 0.7 * mv * s, 0)), cast: true });
        if (h.flash > 0) items.push({ mesh: HM.body, model: body, blend: 3, alpha: 0.6, tint: TINT.white });
      };

      if (ph === 'menu' || !W) {
        g.menuT += step;
        const hc = A.homes.length ? A.homes : [{ x: A.wx / 2, z: A.wz - 3 }];
        const cx = hc.reduce((s, p) => s + p.x, 0) / hc.length, cz = hc.reduce((s, p) => s + p.z, 0) / hc.length - 1;
        const list = solo ? ['me'] : rosterRef.current.slice(0, 4);
        list.forEach((k, i) => {
          const key = k === myK ? heroRef.current : validHero(heroOfRef.current[k] || (metaRef.current[k] && metaRef.current[k].h));
          const off = [[0, 0], [-1.6, -0.9], [1.6, -0.9], [0, -1.8]][i] || [0, 0];
          const fake = { vx: 0, vz: 0, walk: 0, flash: 0, rec: 0 };
          drawHero(fake, key, cx + off[0], cz + off[1], Math.sin(tsec * 0.6 + i) * 0.25, { idle: true });
          ringAt(cx + off[0], cz + off[1], 0.7, k === myK ? TINT.me : TINT.ally, 0.75);
        });
        const sw = Math.sin(g.menuT * 0.15) * 0.5;
        const wide = cw > ch * 1.15;
        const cam = wide ? { pos: [cx - 1.25 + sw, 3.5, cz + 7.6], at: [cx - 1.25, 0.66, cz - 0.3], fov: 0.62, shadowAt: [cx, 0, cz - 1] } : { pos: [cx + sw, 5.2, cz + 10], at: [cx, 0.2, cz + 1.4], fov: 0.66, shadowAt: [cx, 0, cz - 1] };
        g.cam = cam;
        const VP = st.R.render({ env: st.arena.env, cam, items, parts });
        g.VP = VP; g.invVP = null;
        if (ov) { const c2 = ov.getContext('2d'); c2.setTransform(1, 0, 0, 1, 0, 0); c2.clearRect(0, 0, ov.width, ov.height); }
        return;
      }

      for (const id of W.order) {
        const h = W.heroes[id];
        if (!h || h.st === 2) continue;
        const isMe = id === myK;
        drawHero(h, h.key, h.x, h.z, h.yaw, { down: h.st === 1 });
        if (h.st === 0) ringAt(h.x, h.z, 0.72, isMe ? TINT.me : TINT.ally, isMe ? 0.85 : 0.6);
        else { discAt(h.x, h.z, E.REVIVE_R, TINT.mint, 0.12 + 0.05 * Math.sin(tsec * 5)); ringAt(h.x, h.z, E.REVIVE_R, TINT.mint, 0.5); }
        if (h.pw > 0 && h.st === 0 && Math.random() < 0.35) P3({ x: h.x + R0(-0.4, 0.4), y: R0(0.3, 1.5), z: h.z + R0(-0.4, 0.4), vy: R0(0.6, 1.4), max: 0.5, s0: 0.22, s1: 0.04, a0: 0.9, type: 10 });
        if (h.key === 'mira' && h.st === 0) { const hx = h.x + Math.cos(h.yaw) * 0.36 + Math.sin(h.yaw) * 0.2, hz = h.z - Math.sin(h.yaw) * 0.36 + Math.cos(h.yaw) * 0.2; parts.push({ x: hx, y: 1.66, z: hz, size: 0.55, alpha: 0.5, type: 3 }); }
      }
      for (const b of W.robots) {
        if (b.hp <= 0) continue;
        const RM = robotMesh(b.type);
        if (!RM) continue;
        const rise = b.sp > 0 ? -clamp(b.sp / 0.7, 0, 1) * 1.6 : 0;
        const M = m4.pose(b.x, rise, b.z, b.yaw);
        const mv = clamp((b.mv || 0) / 2.5, 0, 1);
        const ph2 = (b.walk || 0) * (b.type === 'boss' ? 1.1 : 2.4);
        let body;
        if (b.type === 'shooter') { body = mul(M, m4.pose(0, 0.12 + Math.sin(tsec * 3 + b.id) * 0.08, 0, 0, mv * 0.15, 0)); parts.push({ x: b.x, y: 0.7 + rise, z: b.z, size: 0.6, alpha: 0.55, type: 20 }); }
        else if (b.type === 'bomber') {
          const top = mul(M, m4.pose(0, 0.5, 0, 0));
          body = mul(M, m4.pose(0, 0.5, 0, 0, (b.walk || 0) / 0.5, 0));
          items.push({ mesh: RM.leg, model: top, cast: true });
          const blink = b.fuse > 0 ? (Math.sin(tsec * 30) > 0 ? 1 : 0.2) : 0.5 + 0.5 * Math.sin(tsec * 6 + b.id);
          parts.push({ x: b.x, y: 0.5 + 0.64 + rise, z: b.z, size: b.fuse > 0 ? 1.1 : 0.5, alpha: 0.4 + blink * 0.5, type: 8 });
          if (b.fuse > 0) discAt(b.x, b.z, E.ROBOTS.bomber.rad, TINT.red, 0.18 + 0.12 * blink);
        } else if (b.type === 'tank') body = mul(M, m4.pose(0, Math.abs(Math.sin(ph2 * 2)) * 0.02 * mv, 0, 0));
        else if (b.type === 'boss') {
          const lift = b.act && b.act.k === 'stomp' ? 0.4 : 0;
          body = mul(M, m4.pose(0, Math.abs(Math.sin(ph2)) * 0.12 * mv + lift, 0, 0));
          for (const s of [-1, 1]) items.push({ mesh: RM.leg, model: mul(M, m4.pose(s * RM.hip[0], RM.hip[1], 0, 0, Math.sin(ph2) * 0.45 * mv * s, 0)), cast: true });
          parts.push({ x: b.x + Math.sin(b.yaw) * 1.05, y: 2.2 + rise, z: b.z + Math.cos(b.yaw) * 1.05, size: 1.4 + Math.sin(tsec * 6) * 0.2, alpha: 0.5, type: 1 });
        } else {
          const lean = b.wind > 0 ? -0.35 : 0;
          body = mul(M, m4.pose(0, Math.abs(Math.sin(ph2)) * 0.05 * mv, 0, 0, lean + mv * 0.08, 0));
          if (RM.leg) for (const s of [-1, 1]) items.push({ mesh: RM.leg, model: mul(M, m4.pose(s * RM.hip[0], RM.hip[1], 0, 0, Math.sin(ph2) * 0.6 * mv * s, 0)), cast: true });
        }
        items.push({ mesh: RM.body, model: body, cast: true });
        if (b.flash > 0) items.push({ mesh: RM.body, model: body, blend: 3, alpha: 0.55, tint: TINT.white });
        if (b.sp <= 0 && (b.type === 'grunt' || b.type === 'tank')) { const fy = Math.sin(b.yaw), fz = Math.cos(b.yaw); const e0 = b.type === 'grunt' ? [0.47, 0.9] : [0.33, 1.14]; parts.push({ x: b.x + fy * e0[0], y: e0[1], z: b.z + fz * e0[0], size: b.wind > 0 || b.burst > 0 ? 0.75 : 0.42, alpha: 0.75, type: 8 }); }
        else if (b.type === 'boss' && b.sp <= 0) { const fy = Math.sin(b.yaw), fz = Math.cos(b.yaw), rx = Math.cos(b.yaw), rz = -Math.sin(b.yaw); for (const sgn of [-1, 1]) parts.push({ x: b.x + fy * 0.95 + rx * sgn * 0.27, y: 2.97, z: b.z + fz * 0.95 + rz * sgn * 0.27, size: 0.5, alpha: 0.8, type: 8 }); }
        if (b.sp <= 0) ringAt(b.x, b.z, b.r + 0.12, TINT.foe, 0.4);
      }
      for (const d of W.drops) {
        const mk = fx && fx[d.k];
        if (!mk) continue;
        if (d.life < 3 && Math.sin(tsec * 18) < 0) continue;
        const y = 0.75 + Math.sin(tsec * 3 + d.id) * 0.12;
        items.push({ mesh: mk, model: m4.pose(d.x, y, d.z, tsec * 1.6 + d.id, d.k === 'hp' ? 0.25 : 0, 0), cast: true });
        parts.push({ x: d.x, y: 0.35, z: d.z, size: 1.3, alpha: 0.4, type: d.k === 'hp' ? 3 : d.k === 'pw' ? 10 : 7 });
        ringAt(d.x, d.z, 0.6, d.k === 'hp' ? TINT.mint : d.k === 'pw' ? srgb('#FF7AD9') : TINT.gold, 0.5);
      }
      for (const s of W.shots) {
        if (s.k === 'lob' || s.k === 'mega') {
          const mk = fx && (s.k === 'mega' ? fx.mega : fx.bomb);
          if (mk) items.push({ mesh: mk, model: m4.pose(s.x, s.y, s.z, s.t * 9, s.t * 7, 0), cast: true });
          discAt(s.x, s.z, (s.k === 'mega' ? 0.7 : 0.38) * (1 - clamp(s.y / 6, 0, 0.6)), TINT.dark, 0.28, 0.03);
          if (Math.random() < 0.6) P3({ x: s.x, y: s.y + 0.3, z: s.z, max: 0.25, s0: 0.25, s1: 0.05, a0: 0.9, type: 1 });
          ringAt(s.x1, s.z1, s.rad, s.own === myK ? TINT.white : TINT.gold, 0.35);
          continue;
        }
        const sp = Math.hypot(s.vx, s.vz) || 1;
        if (s.side === 'r') parts.push({ x: s.x, y: s.y, z: s.z, size: s.k === 'tb' ? 0.62 : 0.5, alpha: 1, type: s.k === 'tb' ? 1 : 8, dx: s.vx, dy: 0, dz: s.vz, dw: 0.5 + sp * 0.03 });
        else if (s.k === 'bolt') parts.push({ x: s.x, y: s.y, z: s.z, size: 0.42, alpha: 1, type: 6, dx: s.vx, dy: 0, dz: s.vz, dw: 0.5 + sp * 0.05 });
        else if (s.k === 'orb') { parts.push({ x: s.x, y: s.y, z: s.z, size: 0.95, alpha: 0.95, type: 3 }); if (Math.random() < 0.5) P3({ x: s.x, y: s.y, z: s.z, vy: 0.4, max: 0.4, s0: 0.3, s1: 0.05, a0: 0.8, type: 3 }); }
        else parts.push({ x: s.x, y: s.y, z: s.z, size: s.k === 'wave' ? 0.5 : 0.36, alpha: 1, type: s.k === 'wave' ? 7 : 1, dx: s.vx, dy: 0, dz: s.vz, dw: 0.36 + sp * 0.02 });
      }
      for (const z of W.zones) {
        if (z.k === 'boom') continue;
        if (z.k === 'laser') {
          const ux0 = Math.sin(z.a), uz0 = Math.cos(z.a);
          if (z.t > 0) { const reach = E.rayWall(A, z.x, z.z, ux0, uz0, z.len); if (fx) items.push({ mesh: fx.strip, model: scl(m4.pose(z.x, 0.05, z.z, z.a), 1.6, 1, reach), blend: 3, alpha: 0.25 + 0.15 * Math.sin(tsec * 20), tint: TINT.red }); }
          else if (z.cur != null && fx) {
            const L = z.reach || z.len;
            items.push({ mesh: fx.beamR, model: scl(m4.pose(z.x, 1.5, z.z, z.cur), 0.6, 0.6, L), blend: 2, alpha: 0.9 });
            items.push({ mesh: fx.beamW, model: scl(m4.pose(z.x, 1.5, z.z, z.cur), 0.22, 0.22, L), blend: 2, alpha: 0.9 });
            const ux = Math.sin(z.cur), uz = Math.cos(z.cur);
            if (Math.random() < 0.7) sparks(z.x + ux * L, 0.4, z.z + uz * L, 2, 8, 6);
            parts.push({ x: z.x + ux * L, y: 0.4, z: z.z + uz * L, size: 1.4, alpha: 0.8, type: 8 });
          }
          continue;
        }
        const u = clamp(1 - z.t / 1.4, 0, 1);
        discAt(z.x, z.z, z.r, TINT.red, 0.1 + 0.22 * u);
        discAt(z.x, z.z, z.r * u, TINT.red, 0.16);
        ringAt(z.x, z.z, z.r, TINT.red, 0.75);
        if (z.k === 'mis' && z.t < 0.5 && fx) items.push({ mesh: fx.missile, model: m4.pose(z.x, z.t * 26, z.z, 0, Math.PI, 0), cast: false });
      }
      for (let i = g.beams.length - 1; i >= 0; i--) {
        const bm = g.beams[i];
        bm.t += step;
        if (bm.t >= bm.max) { g.beams.splice(i, 1); continue; }
        const f = 1 - bm.t / bm.max;
        if (fx) { items.push({ mesh: fx.beamB, model: scl(m4.pose(bm.x, 0.95, bm.z, bm.a), 1.1 * f + 0.2, 1.1 * f + 0.2, bm.len), blend: 2, alpha: f }); items.push({ mesh: fx.beamW, model: scl(m4.pose(bm.x, 0.95, bm.z, bm.a), 0.35 * f, 0.35 * f, bm.len), blend: 2, alpha: f }); }
      }
      if (myH && myH.st === 0 && fx) {
        const A0 = g.aim;
        const H = E.HEROES[myH.key];
        let show = null;
        if (A0.on && A0.eng) show = { kind: A0.kind, a: A0.a, mag: A0.mag };
        else if (g.mouse && !TOUCHY) show = { kind: 'atk', a: g.mouse.a, mag: clamp(g.mouse.d / (H.atk.rng || 10), 0, 1) };
        if (show) {
          const S = show.kind === 'sup' ? H.sup : H.atk;
          const tint = show.kind === 'sup' ? TINT.gold : TINT.white;
          const al = show.kind === 'sup' ? 0.42 : 0.3;
          const ux = Math.sin(show.a), uz = Math.cos(show.a);
          if (S.k === 'spread' || S.k === 'wave') items.push({ mesh: S.k === 'wave' ? fx.fanWave : fx.fanBlaze, model: scl(m4.pose(myH.x, 0.04, myH.z, show.a), S.rng, 1, S.rng), blend: 3, alpha: al, tint });
          else if (S.k === 'bolt' || S.k === 'orb' || S.k === 'beam') { const reach = E.rayWall(A, myH.x, myH.z, ux, uz, S.rng); items.push({ mesh: fx.strip, model: scl(m4.pose(myH.x, 0.04, myH.z, show.a), S.k === 'beam' ? 1.9 : S.k === 'orb' ? 1.5 : 0.7, 1, reach), blend: 3, alpha: al, tint }); }
          else if (S.k === 'lob' || S.k === 'mega') {
            const d = Math.max(1.5, show.mag * S.rng);
            const tx = myH.x + ux * d, tz = myH.z + uz * d;
            discAt(tx, tz, S.rad, tint, al * 0.7); ringAt(tx, tz, S.rad, tint, 0.9);
            for (let j = 1; j < 9; j++) { const u = j / 9; parts.push({ x: myH.x + ux * d * u, y: 0.9 + (S.k === 'mega' ? 4.2 : 3.2) * 4 * u * (1 - u) * 0.6, z: myH.z + uz * d * u, size: 0.28, alpha: 0.8, type: 9 }); }
          } else if (S.k === 'bloom') { discAt(myH.x, myH.z, S.rad, TINT.mint, 0.18); ringAt(myH.x, myH.z, S.rad, TINT.mint, 0.85); }
        }
        if (myH.sup >= 1) parts.push({ x: myH.x, y: 0.15, z: myH.z, size: 1.6 + Math.sin(tsec * 6) * 0.15, alpha: 0.35, type: 7, dw: -1 });
      }

      let fx0 = null;
      const fl = followRef.current;
      if (myH && (myH.st !== 2 || !W.order.some((k) => W.heroes[k].st !== 2))) fx0 = myH;
      else fx0 = (fl && W.heroes[fl] && W.heroes[fl].st !== 2 ? W.heroes[fl] : null) || W.order.map((k) => W.heroes[k]).find((h) => h.st !== 2) || myH || W.heroes[W.order[0]];
      const tx0 = fx0 ? fx0.x : A.wx / 2, tz0 = fx0 ? fx0.z : A.wz / 2;
      const asp = cw / Math.max(1, ch);
      const Dz = asp >= 1.5 ? 15.5 : asp >= 1.1 ? 18.5 : 24;
      const halfW = Math.tan(0.36) * Dz * asp * 0.92;
      const cxT = clamp(tx0, Math.min(A.wx / 2, halfW - 3), Math.max(A.wx / 2, A.wx - halfW + 3));
      const czT = clamp(tz0 + 0.6, 8.5, A.wz - Dz * 0.36);
      if (!g.cam || !g.cam.tx) g.cam = { tx: cxT, tz: czT };
      const kc = 1 - Math.exp(-dt * 6);
      g.cam.tx += (cxT - g.cam.tx) * kc; g.cam.tz += (czT - g.cam.tz) * kc;
      g.shake = Math.max(0, g.shake - dt * 2.2);
      const sh = g.shake * g.shake * 0.5;
      const sx = (Math.random() - 0.5) * sh, sz = (Math.random() - 0.5) * sh;
      const Pp = 0.98;
      const cam = { pos: [g.cam.tx + sx, Math.sin(Pp) * Dz, g.cam.tz + Math.cos(Pp) * Dz + sz], at: [g.cam.tx + sx, 0, g.cam.tz + sz], fov: 0.72, shadowAt: [g.cam.tx, 0, g.cam.tz - 2] };
      g.cam.pos = cam.pos; g.cam.at = cam.at;
      const VP = st.R.render({ env: st.arena.env, cam, items, parts });
      g.VP = VP; g.invVP = null;

      if (ov) {
        const c2 = ov.getContext('2d');
        c2.setTransform(odpr, 0, 0, odpr, 0, 0);
        c2.clearRect(0, 0, cw, ch);
        const proj = (x, y, z) => { const p = m4.apply(VP, x, y, z); if (p[3] <= 0) return null; return [(p[0] * 0.5 + 0.5) * cw, (0.5 - p[1] * 0.5) * ch]; };
        const rr = (x, y, w, h, r) => { c2.beginPath(); c2.moveTo(x + r, y); c2.arcTo(x + w, y, x + w, y + h, r); c2.arcTo(x + w, y + h, x, y + h, r); c2.arcTo(x, y + h, x, y, r); c2.arcTo(x, y, x + w, y, r); c2.closePath(); };
        const bar = (x, y, w, h, f, col, back = 'rgba(12,10,26,0.82)') => { rr(x - 1.5, y - 1.5, w + 3, h + 3, (h + 3) / 2); c2.fillStyle = back; c2.fill(); if (f > 0) { rr(x, y, Math.max(h, w * f), h, h / 2); c2.fillStyle = col; c2.fill(); c2.fillStyle = 'rgba(255,255,255,0.28)'; rr(x + 1, y + 1, Math.max(h - 2, w * f - 2), h * 0.38, h * 0.2); c2.fill(); } };
        const txt = (s, x, y, size, col, al = 'center') => { c2.font = `900 ${size}px ${FONT}`; c2.textAlign = al; c2.textBaseline = 'middle'; c2.lineJoin = 'round'; c2.lineWidth = Math.max(2.5, size * 0.24); c2.strokeStyle = 'rgba(16,10,30,0.92)'; c2.strokeText(s, x, y); c2.fillStyle = col; c2.fillText(s, x, y); };
        for (const b of W.robots) {
          if (b.hp <= 0 || b.sp > 0 || b.type === 'boss') continue;
          const p = proj(b.x, b.type === 'tank' ? 1.75 : b.type === 'shooter' ? 2.0 : 1.7, b.z);
          if (!p) continue;
          const w = b.type === 'tank' ? 52 : 40;
          bar(p[0] - w / 2, p[1], w, 5.5, clamp(b.hp / b.max, 0, 1), '#FF4A3D');
        }
        for (const id of W.order) {
          const h = W.heroes[id];
          if (!h || h.st === 2) continue;
          const isMe = id === myK;
          const p = proj(h.x, 2.05, h.z);
          if (!p) continue;
          if (h.st === 0) {
            const w = 58;
            bar(p[0] - w / 2, p[1], w, 10, clamp(h.hp / h.max, 0, 1), isMe ? '#5BE35B' : '#3D9BFF');
            txt(String(Math.ceil(h.hp)), p[0], p[1] + 5, 9.5, '#FFFFFF');
            if (!isMe || !solo) txt(isMe ? 'You' : nameOf(id), p[0], p[1] - 9, 11, isMe ? '#C9FFC0' : '#D8EAFF');
            if (isMe) for (let i = 0; i < 3; i++) { const f = clamp(h.ammo - i, 0, 1); bar(p[0] - w / 2 + i * (w / 3 + 0.5), p[1] + 14, w / 3 - 3, 4.5, f, f >= 1 ? '#FF9F1A' : '#B06A14'); }
            if (h.pw > 0) txt('Power', p[0], p[1] - (isMe && solo ? 9 : 21), 9.5, '#FF8AE0');
          } else {
            const q = proj(h.x, 0.4, h.z) || p;
            c2.lineWidth = 5; c2.strokeStyle = 'rgba(12,10,26,0.75)'; c2.beginPath(); c2.arc(q[0], q[1] - 24, 17, 0, Math.PI * 2); c2.stroke();
            c2.strokeStyle = '#6CFFD4'; c2.beginPath(); c2.arc(q[0], q[1] - 24, 17, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(h.rv, 0, 1)); c2.stroke();
            txt(String(Math.ceil(h.downT)), q[0], q[1] - 24, 13, '#FF9C8F');
            txt(isMe ? 'Wait for a friend' : `Revive ${nameOf(id)}`, q[0], q[1] - 50, 11.5, '#BFFFEA');
          }
          if (!isMe && h.st === 1 && (p[0] < 0 || p[0] > cw || p[1] < 0 || p[1] > ch)) {
            const ex = clamp(p[0], 26, cw - 26), ey = clamp(p[1], 80, ch - 26);
            c2.fillStyle = 'rgba(12,10,26,0.8)'; c2.beginPath(); c2.arc(ex, ey, 16, 0, Math.PI * 2); c2.fill();
            txt('+', ex, ey + 1, 18, '#6CFFD4');
          }
        }
        for (let i = g.nums.length - 1; i >= 0; i--) {
          const n = g.nums[i];
          n.t += dt;
          if (n.t >= n.life) { g.nums.splice(i, 1); continue; }
          const p = proj(n.x, n.y + n.t * 1.6, n.z);
          if (!p) continue;
          const u = n.t / n.life;
          const sc = u < 0.12 ? 0.6 + (u / 0.12) * 0.6 : 1.2 - Math.min(0.2, (u - 0.12) * 0.8);
          c2.globalAlpha = u > 0.7 ? (1 - u) / 0.3 : 1;
          txt(n.text, p[0], p[1], (n.big ? 19 : 14.5) * sc, n.col);
          c2.globalAlpha = 1;
        }
      }
      if (hurtRef.current) { g.hurtT = Math.max(0, g.hurtT - dt); hurtRef.current.style.opacity = String(clamp(g.hurtT / 0.4, 0, 1) * 0.85 + (myH && myH.st === 0 && myH.hp < myH.max * 0.3 ? 0.25 + 0.15 * Math.sin(tsec * 6) : 0)); }
      if (myH) {
        const arcs = ammoRef.current;
        for (let i = 0; i < 3; i++) { const el = arcs[i]; if (el) { const f = clamp(myH.ammo - i, 0, 1); el.style.strokeDashoffset = String(66 * (1 - f)); el.style.stroke = f >= 1 ? '#FFA726' : '#8A5A1A'; } }
        if (supRing.current) supRing.current.style.strokeDashoffset = String(226 * (1 - clamp(myH.sup, 0, 1)));
      }
      if (now - g.hudAt > 125) {
        g.hudAt = now;
        const boss = W.robots.find((b) => b.type === 'boss' && b.hp > 0);
        const team = W.order.map((k) => { const h = W.heroes[k]; return { id: k, key: h.key, hp: Math.ceil(h.hp), max: h.max, st: h.st, dt: Math.ceil(h.downT) }; });
        const meH = W.heroes[myK];
        setHud({ wave: W.wave.n, st: W.wave.st, t: Math.ceil(W.wave.t), left: W.wave.left, score: W.score, team, boss: boss ? { hp: boss.hp, max: boss.max } : null, me: meH ? { st: meH.st, sup: meH.sup >= 1, dt: Math.ceil(meH.downT), key: meH.key, pw: meH.pw > 0 } : null });
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const finish = () => { Sfx.stopAll(); onClose(); };
  const leave = () => { if (phase === 'play' && !solo && !watch) { setLeaveAsk(true); return; } finish(); };
  useBackClose(true, () => { if (chatOpen) setChatOpen(false); else if (ctl) setCtl(false); else if (optSheet) setOptSheet(false); else if (arenaSheet) setArenaSheet(false); else if (people) setPeople(false); else if (quick) setQuick(false); else if (leaveAsk) setLeaveAsk(false); else if (paused) setPaused(false); else if (phase === 'play' && solo) setPaused(true); else leave(); });
  const sendEmote = (e) => { setBubbles((p) => ({ ...p, [kindOf()]: { e, at: Date.now() } })); if (!solo) relay.send('emo', { e }); setQuick(false); Sfx.play('pop', { vol: 0.5 }); };
  useEffect(() => {
    if (!Object.keys(bubbles).length) return undefined;
    const t = setTimeout(() => setBubbles((p) => { const n = {}; for (const k of Object.keys(p)) if (Date.now() - p[k].at < 2200) n[k] = p[k]; return n; }), 2300);
    return () => clearTimeout(t);
  }, [bubbles]);
  useEffect(() => { if (phase === 'menu') { Sfx.init(); Sfx.music('lobbySiege', true); } else if (phase === 'play') Sfx.music('siege', true); else Sfx.music(null, false); }, [phase]);
  useEffect(() => () => Sfx.music(null, false), []);
  useEffect(() => { if (paused || phase !== 'play') { J.reset(); G.current.aim = { on: false }; setAimUi(null); } }, [paused, phase]);

  const talkOn = !solo && !watch;
  const talking = useTalking(!solo, relay.muted);
  const micOf = (k) => (k === kindOf() ? relay.mic.on : !!relay.mics[k]);
  const hb = 38;
  const playing = inGame() && phase === 'play';
  const rowBtns = [
    talkOn && <GHudBtn key="mic" icon={relay.mic.on ? 'mic' : 'micoff'} on={relay.mic.on} size={hb} label={relay.mic.on ? 'Turn your mic off' : 'Turn your mic on'} onPress={relay.toggleMic} />,
    !solo && <GHudBtn key="ppl" icon="people" on={people} size={hb} label="Players and voice" badge={roster.length > 1 ? roster.length : null} onPress={() => { setQuick(false); setPeople(true); }} />,
    talkOn && <GHudBtn key="chat" icon="chat" size={hb} label="Chat" badge={chatNew || null} onPress={() => { setQuick(false); setChatNew(0); setChatOpen(true); }} />,
    talkOn && <GHudBtn key="emo" icon="smile" on={quick} tone="#F5AE1E" size={hb} label="Emojis" onPress={() => setQuick((v) => !v)} />,
    playing && <GHudBtn key="gear" icon="gear" size={hb} label="Settings" onPress={() => { setQuick(false); if (solo) setPaused(true); setCtl(true); }} />,
    <GHudBtn key="x" icon={solo && phase === 'play' ? 'pause' : 'close'} size={hb} label={solo && phase === 'play' ? 'Pause' : 'Leave the game'} onPress={() => (solo && phase === 'play' ? setPaused(true) : leave())} />,
  ].filter(Boolean);
  const hostName = names[room && room.host] || 'The host';
  const best = Number(readPref(BEST_KEY(uid, arena, lv), '0')) || 0;
  const H0 = E.HEROES[heroKey];
  const toggleWatch = () => { setWatchAllowed(!allowWatch); kitTap(); };
  const meHud = hud.me;
  const g0 = G.current;
  const ids0 = phase === 'menu' ? [] : g0.ids;

  const lobbyUi = phase !== 'menu' ? null : (
    <GLobby GS={GS} title="Scrap Siege" onClose={finish} closeLabel={solo ? 'Leave' : 'Back to chat'} tint="rgba(8,10,22,0.62)"
      sub={solo ? (botN ? `You and ${botN === 1 ? 'a bot friend' : `${botN} bot friends`} against robot waves` : 'You alone against robot waves') : watch ? `Watching ${hostName} and friends` : 'Up to four friends against robot waves'}
      badge={best ? <GChip style={{ height: 34, gap: 6 }}><GIcon k="crown" size={14} color="#FFD84E" />{`Best wave ${best}`}</GChip> : null}
      tools={(
        <>
          {!solo && !watch && <GBtn icon="chat" color="dark" size={42} fast={false} label="Chat" badge={chatNew || null} onPress={() => { setChatNew(0); setChatOpen(true); }} />}
          {!solo && isHost && !watch && <GBtn icon={allowWatch ? 'eye' : 'eyeoff'} color={allowWatch ? 'blue' : 'dark'} size={42} fast={false} label={allowWatch ? 'Friends can watch. Tap to stop' : 'Let friends watch'} badge={watchers.length || null} onPress={toggleWatch} />}
          {!watch && <GBtn icon="gear" color="dark" size={42} fast={false} label="Game settings" onPress={() => setOptSheet(true)} />}
        </>
      )}
      side={(
        <>
          {!watch && (
            <GPanel style={{ padding: '8px 10px 10px', display: 'flex', flexDirection: 'column', gap: 7 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 13.5, fontWeight: 900 }}>Your hero</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: H0.col }}>{`${H0.name}, ${H0.role}`}</span>
              </div>
              <div style={{ display: 'flex', gap: 7 }}>{E.HERO_KEYS.map((k) => <HeroCard key={k} k={k} on={heroKey === k} img={thumbs[k]} size={land ? 62 : 58} onPress={() => pickHero(k)} />)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 7px', borderRadius: 12, background: 'rgba(255,255,255,0.07)' }}>
                <span style={{ width: 34, height: 34, borderRadius: 17, flexShrink: 0, background: 'radial-gradient(circle at 40% 30%, #FFE98A, #F2A81D)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 0 2px ${INK}` }}><SuperArt k={heroKey} size={24} /></span>
                <span style={{ fontSize: 11.5, fontWeight: 700, lineHeight: 1.3, color: 'rgba(255,255,255,0.85)', minWidth: 0 }}><b style={{ color: '#FFFFFF' }}>{H0.text}</b>{` Super: ${H0.sup.name}. ${H0.sup.text}`}</span>
              </div>
            </GPanel>
          )}
          {!solo && (
            <GPanel style={{ padding: '8px 10px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13.5, fontWeight: 900, flex: 1 }}>{watch ? 'Squad' : `Squad ${roster.length} of ${E.SQUAD_MAX}`}</span>
                {watchers.length > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 800, color: '#CFE6FF' }}><GIcon k="eye" size={14} color="#CFE6FF" />{`${watchers.length} watching`}</span>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', justifyItems: 'center' }}>
                {Array.from({ length: E.SQUAD_MAX }, (_, i) => {
                  const k = roster[i];
                  if (!k) return <GSlot key={`e${i}`} size={40} empty name={isHost && onInvite && !watch ? 'Invite' : botN > i - roster.length && isHost ? 'Bot' : 'Open'} label="Invite a friend" onPress={isHost && onInvite && !watch ? () => onInvite(roster.length, GS.side) : null} />;
                  const isMe = k === kindOf();
                  const hk = isMe ? heroKey : validHero(heroOf[k]);
                  return <GSlot key={k} size={40} art={thumbs[hk] ? <img src={thumbs[hk]} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : <span style={{ width: 26, height: 26, borderRadius: 13, background: SLOT_COLS[i] }} />} name={isMe ? 'You' : names[k] || 'Friend'} ring={SLOT_COLS[i]} talk={micOf(k)} muted={!!relay.muted[k]} label={isMe ? 'You' : `${names[k] || 'Friend'}, voice and volume`} onPress={!isMe && !watch ? () => setPeople(true) : null} />;
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
          <button type="button" className="zgk-btn" aria-label={isHost && !watch ? `Arena ${E.ARENAS[arena].name}. Change arena` : `Arena ${E.ARENAS[arena].name}`} {...pressProps(() => { kitTap(); setArenaSheet(true); })}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 5, border: 'none', borderRadius: 12, background: 'rgba(255,255,255,0.07)', cursor: 'pointer', color: '#FFFFFF', fontFamily: FONT, textAlign: 'left' }}>
            <span style={{ width: 92, aspectRatio: '16 / 9', borderRadius: 8, overflow: 'hidden', display: 'block', background: arena === 'yard' ? 'linear-gradient(135deg, #CDBB9A, #7D7264)' : 'linear-gradient(135deg, #86C65A, #365E27)', flexShrink: 0 }}>{aThumbs[arena] ? <img src={aThumbs[arena]} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : null}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 15, fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{E.ARENAS[arena].name}</span>
              <span style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.72)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{`${E.LEVELS[lv].name}, ${endless ? 'endless waves' : `${E.WIN_WAVE} waves`}`}</span>
            </span>
            <span style={{ height: 26, padding: '0 10px', borderRadius: 13, background: isHost && !watch ? 'linear-gradient(180deg, #FFE27A, #F5B321)' : 'rgba(10,14,26,0.7)', color: isHost && !watch ? '#2A1D05' : '#FFFFFF', fontSize: 11.5, fontWeight: 900, display: 'flex', alignItems: 'center', flexShrink: 0 }}>{isHost && !watch ? 'Change' : 'See arenas'}</span>
          </button>
          {failed ? <div style={{ fontSize: 12.5, fontWeight: 800, lineHeight: 1.4, color: '#FFB4B4' }}>This phone could not start the 3D game. Try closing other apps, then open it again.</div>
            : watch ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44, fontSize: 13.5, fontWeight: 800 }}><Spinner size={16} color="#FFFFFF" />{`${hostName} starts soon`}</div>
            : isHost ? <GPill text={ready ? 'Start the fight' : `Building ${E.ARENAS[arena].name}`} icon="play" color="gold" wide disabled={!ready} onPress={startGame} />
            : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44, fontSize: 13.5, fontWeight: 800 }}><Spinner size={16} color="#FFFFFF" />{`${hostName} picks the arena and starts`}</div>}
        </GPanel>
      )}>
      {arenaSheet && (
        <GLobbySheet GS={GS} title="Arena" width={600} onClose={() => setArenaSheet(false)}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
            {E.ARENA_KEYS.map((k) => {
              const on = arena === k;
              const b = Number(readPref(BEST_KEY(uid, k, lv), '0')) || 0;
              return (
                <button key={k} type="button" className="zgk-btn" aria-pressed={on} aria-label={E.ARENAS[k].name} disabled={!isHost || watch} {...pressProps(() => pickArena(k))}
                  style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: 6, border: 'none', borderRadius: 14, cursor: isHost && !watch ? 'pointer' : 'default', fontFamily: FONT, color: '#FFFFFF', textAlign: 'left', background: on ? 'rgba(255,214,90,0.16)' : 'rgba(255,255,255,0.06)', boxShadow: on ? 'inset 0 0 0 2.5px #FFD45A' : 'inset 0 0 0 1.5px rgba(255,255,255,0.12)' }}>
                  <span style={{ width: '100%', aspectRatio: '16 / 9', borderRadius: 10, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: k === 'yard' ? 'linear-gradient(135deg, #CDBB9A, #7D7264)' : 'linear-gradient(135deg, #86C65A, #365E27)' }}>{aThumbs[k] ? <img src={aThumbs[k]} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : <Spinner size={18} color="#FFFFFF" />}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 3px' }}>
                    <span style={{ flex: 1, fontSize: 14.5, fontWeight: 900 }}>{E.ARENAS[k].name}</span>
                    {b > 0 && <span style={{ fontSize: 11, fontWeight: 800, color: '#FFE15A' }}>{`Best wave ${b}`}</span>}
                  </span>
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 900, width: 82 }}>Robots</span>
              <div style={{ flex: 1 }}><GSeg value={lv} items={LV_ITEMS} onPick={pickLv} disabled={!isHost || watch} label="How tough the robots are" /></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 900, width: 82 }}>Waves</span>
              <div style={{ flex: 1 }}><GSeg value={endless ? 'end' : '15'} items={WAVE_ITEMS} onPick={pickWaves} disabled={!isHost || watch} label="How many waves" /></div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>{endless ? 'Robots never stop coming. See how far your squad gets.' : `A boss shows up every 5 waves. Beat wave ${E.WIN_WAVE} to win.`}</div>
            <GPill text="Done" color="gold" wide onPress={() => setArenaSheet(false)} />
          </div>
        </GLobbySheet>
      )}
      {optSheet && (
        <GLobbySheet GS={GS} title="Game settings" width={520} onClose={() => setOptSheet(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {isHost && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 14.5, fontWeight: 900, flex: 1 }}>{solo ? 'Bot friends' : 'Bots fill empty spots'}</span>
                <div style={{ width: 230 }}><GSeg value={String(botN)} items={BOT_ITEMS} onPick={pickBots} label="Bot friends" /></div>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 14.5, fontWeight: 900, flex: 1 }}>Graphics</span>
              <div style={{ width: 200 }}><GSeg value={gfx} items={GFX} onPick={pickGfx} label="Graphics" /></div>
            </div>
            <GPill text="Buttons and sound" icon="gear" color="white" small wide onPress={() => { setOptSheet(false); setCtl(true); }} />
          </div>
        </GLobbySheet>
      )}
    </GLobby>
  );

  const waveLine = hud.st === 'fight' ? (hud.left === 1 ? '1 robot left' : `${hud.left} robots left`) : hud.st === 'break' ? `Next wave in ${Math.max(1, hud.t)}` : hud.st === 'won' ? 'All waves cleared' : 'Get ready';
  const superOn = !!(meHud && meHud.sup && meHud.st === 0);
  const ctrlScale = look.size;
  return (
    <Portal>
      <div ref={GS.rootRef} style={{ position: 'fixed', left: 0, right: 0, top: 'var(--zvp-top, 0px)', height: 'var(--zvp-h, 100%)', zIndex: 90, background: '#2A2620', overflow: 'hidden', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', fontFamily: FONT, color: '#FFFFFF' }}>
        <div ref={wrapRef} data-side={GS.side ? '1' : '0'} style={GS.wrapStyle} onPointerDown={wrapDown} onPointerMove={wrapMove} onPointerUp={J.handlers.onPointerUp} onPointerCancel={J.handlers.onPointerCancel} onLostPointerCapture={J.handlers.onLostPointerCapture} onPointerLeave={(e) => { if (e.pointerType === 'mouse') G.current.mouse = null; }} onContextMenu={(e) => e.preventDefault()}>
          <canvas ref={cvRef} aria-label="Scrap Siege" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
          <canvas ref={ovRef} aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', pointerEvents: 'none', zIndex: 1 }} />
          <div ref={hurtRef} aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2, opacity: 0, background: 'radial-gradient(ellipse at center, rgba(255,0,0,0) 55%, rgba(220,20,20,0.55) 100%)' }} />

          {(phase === 'play' || phase === 'done') && (
            <>
              <div style={{ position: 'absolute', left: left(10), top: top(8), display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-start', zIndex: 3, pointerEvents: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ display: 'flex', alignItems: 'baseline', gap: 4, padding: '3px 11px 4px', borderRadius: 12, background: 'linear-gradient(180deg, rgba(40,24,6,0.85), rgba(20,12,4,0.78))', boxShadow: 'inset 0 0 0 1.5px rgba(255,200,80,0.45)', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                    <span style={{ fontSize: 12, fontWeight: 900, color: '#FFD45A' }}>Wave</span>
                    <span style={{ fontSize: 24, fontWeight: 900, lineHeight: 1 }}>{hud.wave || 1}</span>
                    {!endless && <span style={{ fontSize: 12, fontWeight: 900, opacity: 0.75 }}>{`of ${E.WIN_WAVE}`}</span>}
                  </span>
                  <GHudPanel style={{ height: 26, padding: '0 10px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 900, whiteSpace: 'nowrap' }}>{waveLine}</GHudPanel>
                </div>
                {hud.team.length > 1 && hud.team.map((t, i) => (
                  <GHudPanel key={t.id} style={{ height: 22, padding: '0 8px 0 4px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 800, whiteSpace: 'nowrap', minWidth: land ? 150 : 132 }}>
                    {thumbs[t.key] ? <img src={thumbs[t.key]} alt="" style={{ width: 18, height: 18, borderRadius: 9, objectFit: 'cover', boxShadow: `0 0 0 1.5px ${SLOT_COLS[i % 4]}` }} /> : <span style={{ width: 10, height: 10, borderRadius: 5, background: SLOT_COLS[i % 4] }} />}
                    <span style={{ width: 52, overflow: 'hidden', textOverflow: 'ellipsis' }}>{nameOf(t.id)}</span>
                    {t.st === 0 ? <span style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.18)', overflow: 'hidden', display: 'block', minWidth: 40 }}><span style={{ display: 'block', height: '100%', width: `${Math.round(clamp(t.hp / t.max, 0, 1) * 100)}%`, background: t.id === kindOf() ? '#5BE35B' : '#3D9BFF' }} /></span>
                      : <span style={{ flex: 1, fontSize: 10.5, fontWeight: 900, color: t.st === 1 ? '#6CFFD4' : '#FF9C8F' }}>{t.st === 1 ? `Down ${t.dt}` : 'Out'}</span>}
                    {micOf(t.id) && !relay.muted[t.id] && <GIcon k="mic" size={11} color="#7BE05A" ink="transparent" />}
                  </GHudPanel>
                ))}
              </div>
              <div style={{ position: 'absolute', right: right(10), top: top(8), display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 7, zIndex: 4 }}>
                <div style={{ display: 'flex', gap: 6 }}>{rowBtns}</div>
                <GHudPanel style={{ height: 24, padding: '0 9px', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 900 }}><GIcon k="star" size={13} color="#FFD84E" ink="transparent" />{hud.score.toLocaleString()}</GHudPanel>
              </div>
              {hud.boss && (
                <div aria-label="Boss health" style={{ position: 'absolute', left: '50%', top: top(54), transform: 'translateX(-50%)', width: 'min(46%, 360px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, zIndex: 3, pointerEvents: 'none' }}>
                  <span style={{ fontSize: 13, fontWeight: 900, color: '#FFD45A', textShadow: '0 2px 5px rgba(0,0,0,0.6)' }}>{E.ROBOTS.boss.name}</span>
                  <span style={{ width: '100%', height: 13, borderRadius: 7, background: 'rgba(12,10,26,0.82)', boxShadow: '0 0 0 2px rgba(255,255,255,0.25)', overflow: 'hidden', display: 'block' }}><span style={{ display: 'block', height: '100%', width: `${Math.round(clamp(hud.boss.hp / hud.boss.max, 0, 1) * 1000) / 10}%`, background: 'linear-gradient(180deg, #FF7A5C, #D9261A)', transition: 'width 0.2s' }} /></span>
                </div>
              )}
              {banner && (
                <div key={banner.at} aria-live="polite" style={{ position: 'absolute', left: '50%', top: '22%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, zIndex: 4, pointerEvents: 'none', animation: 'zgk-pop 0.3s ease-out' }}>
                  <span style={{ fontSize: 40, fontWeight: 900, lineHeight: 1.05, whiteSpace: 'nowrap', color: banner.tone === 'red' ? '#FF6B5C' : banner.tone === 'green' ? '#7BF27B' : banner.tone === 'blue' ? '#9FD0FF' : '#FFE15A', textShadow: `0 4px 0 ${INK}, 0 0 3px ${INK}, 0 8px 22px rgba(0,0,0,0.5)`, WebkitTextStroke: `1.5px ${INK}` }}>{banner.text}</span>
                  {banner.sub && <span style={{ fontSize: 14, fontWeight: 800, padding: '4px 12px', borderRadius: 12, background: 'rgba(10,14,26,0.66)' }}>{banner.sub}</span>}
                </div>
              )}
              {playing && meHud && meHud.st === 1 && (
                <div style={{ position: 'absolute', left: '50%', bottom: bottom(18), transform: 'translateX(-50%)', padding: '7px 14px', borderRadius: 14, background: 'rgba(10,14,26,0.72)', fontSize: 13.5, fontWeight: 900, zIndex: 4, pointerEvents: 'none', textAlign: 'center' }}>{`You are down. ${meHud.dt}s left for a friend to revive you`}</div>
              )}
              {playing && meHud && meHud.st === 2 && (
                <div style={{ position: 'absolute', left: '50%', bottom: bottom(18), transform: 'translateX(-50%)', padding: '7px 14px', borderRadius: 14, background: 'rgba(10,14,26,0.72)', fontSize: 13.5, fontWeight: 900, zIndex: 4, pointerEvents: 'none' }}>You come back when the next wave starts</div>
              )}
              {playing && meHud && meHud.st === 0 && (
                <>
                  {TOUCHY && <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 1 - look.see, zIndex: 3 }}><GJoy flat view={J.view} knobRef={J.knob} idle={{ x: land ? 110 : 96, y: GS.H - (land ? 104 : 128) }} R={J.R} /></div>}
                  <div ref={supRef} role="button" aria-label={superOn ? `Super, ${E.HEROES[meHud.key].sup.name}. Ready` : 'Super, charging'} onPointerDown={aimDown('sup')} onPointerMove={aimMove} onPointerUp={aimUp} onPointerCancel={aimUp} onLostPointerCapture={aimUp} onContextMenu={(e) => e.preventDefault()}
                    style={{ position: 'absolute', right: right(136), bottom: bottom(58), width: 80, height: 80, borderRadius: '50%', touchAction: 'none', zIndex: 5, opacity: superOn ? 1 : 0.85 - look.see * 0.4, transform: `scale(${ctrlScale})`, transformOrigin: '100% 100%' }}>
                    <svg width="80" height="80" viewBox="0 0 80 80" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }} aria-hidden="true">
                      <circle cx="40" cy="40" r="38" fill="rgba(10,12,22,0.55)" />
                      <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="5" />
                      <circle ref={supRing} cx="40" cy="40" r="36" fill="none" stroke="#FFC93A" strokeWidth="5" strokeLinecap="round" strokeDasharray="226 226" strokeDashoffset="226" />
                    </svg>
                    <span ref={supKnob} style={{ position: 'absolute', left: 13, top: 13, width: 54, height: 54, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: superOn ? 'radial-gradient(circle at 40% 30%, #FFF0A0, #F5A814 75%)' : 'radial-gradient(circle at 40% 30%, #8A8576, #4A463C 80%)', boxShadow: superOn ? `0 0 0 2.5px ${INK}, 0 0 18px rgba(255,200,60,0.85)` : `0 0 0 2.5px ${INK}`, animation: superOn ? 'zgk-pulse 1.4s ease-in-out infinite' : 'none' }}>
                      <span style={{ filter: superOn ? 'none' : 'grayscale(1) brightness(0.8)', display: 'flex' }}><SuperArt k={meHud.key} size={32} /></span>
                    </span>
                  </div>
                  <div ref={atkRef} role="button" aria-label="Attack. Tap to aim at the closest robot, or drag to aim" onPointerDown={aimDown('atk')} onPointerMove={aimMove} onPointerUp={aimUp} onPointerCancel={aimUp} onLostPointerCapture={aimUp} onContextMenu={(e) => e.preventDefault()}
                    style={{ position: 'absolute', right: right(22), bottom: bottom(20), width: 112, height: 112, borderRadius: '50%', touchAction: 'none', zIndex: 5, opacity: 1 - look.see * 0.5, transform: `scale(${ctrlScale})`, transformOrigin: '100% 100%' }}>
                    <svg width="112" height="112" viewBox="0 0 112 112" style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
                      <circle cx="56" cy="56" r="54" fill="rgba(10,12,22,0.5)" />
                      {[0, 1, 2].map((i) => { const a0 = -Math.PI / 2 + i * (Math.PI * 2 / 3) + 0.09, a1 = a0 + Math.PI * 2 / 3 - 0.18; const r = 51; const p0 = [56 + Math.cos(a0) * r, 56 + Math.sin(a0) * r], p1 = [56 + Math.cos(a1) * r, 56 + Math.sin(a1) * r]; const d = `M${p0[0]} ${p0[1]} A${r} ${r} 0 0 1 ${p1[0]} ${p1[1]}`; return <g key={i}><path d={d} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="6" strokeLinecap="round" /><path ref={(el) => { ammoRef.current[i] = el; }} d={d} fill="none" stroke="#FFA726" strokeWidth="6" strokeLinecap="round" strokeDasharray="66 66" strokeDashoffset="0" /></g>; })}
                    </svg>
                    <span ref={atkKnob} style={{ position: 'absolute', left: 22, top: 22, width: 68, height: 68, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: aimUi === 'atk' ? 'radial-gradient(circle at 40% 30%, #FFB0A6, #E5483B 80%)' : 'radial-gradient(circle at 40% 30%, #FF8A7A, #C8321F 80%)', boxShadow: `0 0 0 2.5px ${INK}, 0 4px 10px rgba(0,0,0,0.35)` }}>
                      <GIcon k={meHud.key === 'boom' ? 'bomb' : meHud.key === 'mira' ? 'heart' : meHud.key === 'pip' ? 'bolt' : 'flame'} size={30} color="#FFFFFF" ink="rgba(0,0,0,0.3)" />
                    </span>
                  </div>
                </>
              )}
              {!inGame() && phase === 'play' && (
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: bottom(14), display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', padding: '0 14px', zIndex: 3 }}>
                  <GHudPanel style={{ height: 32, padding: '0 11px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 800 }}><GIcon k="eye" size={14} color="#CFE6FF" ink="rgba(0,0,0,0.3)" />Watching</GHudPanel>
                  {ids0.filter((k) => !g0.bots.includes(k)).map((k) => <GPill key={k} small text={nameOf(k)} color={follow === k ? 'gold' : 'white'} onPress={() => setFollow(k)} height={38} />)}
                </div>
              )}
              {quick && (
                <div onPointerDown={(e) => e.stopPropagation()} style={{ position: 'absolute', right: right(10), top: top(8 + hb + 40), width: 'min(250px, calc(100% - 28px))', animation: 'zgk-pop 0.2s ease-out', zIndex: 6 }}>
                  <GPanel style={{ padding: 10, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 6 }}>
                    {EMOTES.map((e) => <button key={e} type="button" className="zgk-btn" aria-label={`Send ${e}`} {...pressProps(() => sendEmote(e))} style={{ height: 40, borderRadius: 14, border: 'none', background: 'rgba(255,255,255,0.1)', fontSize: 23, cursor: 'pointer' }}>{e}</button>)}
                  </GPanel>
                </div>
              )}
              {Object.keys(bubbles).length > 0 && (
                <div style={{ position: 'absolute', left: '50%', top: top(90), transform: 'translateX(-50%)', display: 'flex', gap: 8, zIndex: 4, pointerEvents: 'none' }}>
                  {Object.entries(bubbles).map(([k, b]) => <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 14, background: 'rgba(10,14,26,0.7)', fontSize: 12.5, fontWeight: 800, animation: 'zgk-pop 0.25s ease-out' }}><span style={{ fontSize: 22 }}>{b.e}</span>{nameOf(k)}</span>)}
                </div>
              )}
            </>
          )}

          {lobbyUi}

          {paused && phase === 'play' && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 20, background: 'rgba(10,8,24,0.5)', display: 'flex', padding: 12, overflowY: 'auto', touchAction: 'pan-x pan-y' }}>
              <GPanel style={{ margin: 'auto', width: '100%', maxWidth: 320, padding: 16, display: 'flex', flexDirection: 'column', gap: 10, animation: 'zgk-pop 0.3s ease-out', boxSizing: 'border-box' }}>
                <GTitle text="Paused" size={28} />
                <GPill text="Resume" icon="play" color="green" wide onPress={() => setPaused(false)} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <GPill text="Restart" icon="replay" color="white" small wide onPress={() => { setPaused(false); toMenu(true); setTimeout(startGame, 50); }} style={{ flex: 1 }} />
                  <GPill text="Settings" icon="gear" color="white" small wide onPress={() => setCtl(true)} style={{ flex: 1 }} />
                </div>
                <GPill text="Leave" color="red" small wide onPress={finish} />
              </GPanel>
            </div>
          )}

          {phase === 'done' && result && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 20, background: 'rgba(10,8,24,0.45)', display: 'flex', padding: 12, overflowY: 'auto', touchAction: 'pan-x pan-y' }}>
              <GPanel style={{ margin: 'auto', width: '100%', maxWidth: 420, padding: 16, display: 'flex', flexDirection: 'column', gap: 10, animation: 'zgk-pop 0.35s ease-out', boxSizing: 'border-box' }}>
                <GTitle text={result.won ? 'Victory' : result.lost ? 'Connection lost' : 'Game over'} size={30} color={result.won ? '#FFE15A' : '#FFFFFF'} />
                <div style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.88)' }}>{result.won ? `Your squad beat all ${result.wave} waves` : result.lost ? 'The host stopped sending the game' : `Your squad reached wave ${result.wave}`}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <GChip style={{ height: 30, gap: 6 }}><GIcon k="star" size={13} color="#FFD84E" ink="transparent" />{`Score ${result.score.toLocaleString()}`}</GChip>
                  {result.best > 0 && <GChip style={{ height: 30, gap: 6 }}><GIcon k="crown" size={13} color="#FFD84E" ink="transparent" />{result.newBest ? `New best, wave ${result.best}` : `Best wave ${result.best}`}</GChip>}
                </div>
                {result.list.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', gap: 8, padding: '0 9px', fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.6)' }}>
                      <span style={{ flex: 1 }}>Hero</span><span style={{ width: 44, textAlign: 'right' }}>Robots</span><span style={{ width: 48, textAlign: 'right' }}>Damage</span><span style={{ width: 46, textAlign: 'right' }}>Revives</span>
                    </div>
                    {result.list.map(([k, kills, dmg, rev, , hk], i) => (
                      <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 9px', borderRadius: 12, background: k === kindOf() ? 'rgba(255,194,61,0.2)' : 'rgba(255,255,255,0.06)' }}>
                        {thumbs[validHero(hk)] ? <img src={thumbs[validHero(hk)]} alt="" style={{ width: 24, height: 24, borderRadius: 12, objectFit: 'cover', boxShadow: `0 0 0 1.5px ${SLOT_COLS[i % 4]}` }} /> : <span style={{ width: 12, height: 12, borderRadius: 6, background: SLOT_COLS[i % 4] }} />}
                        <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nameOf(k)}</span>
                        <span style={{ width: 44, textAlign: 'right', fontSize: 13, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{kills | 0}</span>
                        <span style={{ width: 48, textAlign: 'right', fontSize: 13, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{fmtK(dmg | 0)}</span>
                        <span style={{ width: 46, textAlign: 'right', fontSize: 13, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{rev | 0}</span>
                      </div>
                    ))}
                  </div>
                )}
                {isHost ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <GPill text="Play again" icon="replay" color="green" small wide onPress={() => { toMenu(true); setTimeout(startGame, 60); }} style={{ flex: 1 }} />
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
          <GTalkers ids={talking} nameOf={nameOf} top={top(phase === 'play' ? (hud.boss ? 92 : 54) : 50)} />
          <GNotices items={notes} style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: top(phase === 'menu' ? 64 : 104), width: 'min(52%, 420px)', zIndex: 30 }} />
          {people && !solo && (
            <Sheet title="Players and voice" text={relay.mic.on ? 'Your mic is on. Everyone in the game can hear you.' : 'Turn your mic on to talk while you play.'} onClose={() => setPeople(false)}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                {roster.map((k, i) => {
                  const isMe = k === kindOf();
                  const nm = isMe ? 'You' : names[k] || 'Friend';
                  const talk = micOf(k);
                  const off = !!relay.muted[k];
                  return (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', borderRadius: 14, background: 'rgba(255,255,255,0.06)' }}>
                      <span style={{ width: 14, height: 14, borderRadius: 7, background: SLOT_COLS[i % 4], boxShadow: '0 0 0 2px #FFFFFF' }} />
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
          {chatOpen && <ChatSheet title="Talk to your squad" chat={chat} onClose={() => setChatOpen(false)} />}
          {leaveAsk && (
            <Sheet title="Leave the game?" text="Your squad can keep fighting without you." onClose={() => setLeaveAsk(false)}>
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

export function SiegeInviteSheet({ friends, onClose, onInvite, already, side = false }) {
  injectKitCss();
  useBackClose(true, onClose);
  const [sel, setSel] = useState([]);
  const room = Math.max(0, E.SQUAD_MAX - Math.max(1, already || 1));
  const list = (friends || []).filter((p) => p && p.id && !p.is_bot);
  const toggle = (id) => { kitTap(); setSel((v) => (v.includes(id) ? v.filter((x) => x !== id) : v.length >= room ? v : [...v, id])); };
  return (
    <Portal>
      <div onClick={onClose} data-side={side ? '1' : '0'} style={{ position: 'fixed', ...(side && typeof window !== 'undefined' ? { left: 0, top: 0, width: window.innerHeight, height: window.innerWidth, transformOrigin: '0 0', transform: `translateX(${window.innerWidth}px) rotate(90deg)` } : { inset: 0 }), zIndex: 96, background: 'rgba(10,8,24,0.55)', display: 'flex', alignItems: side ? 'center' : 'flex-end', justifyContent: 'center', fontFamily: FONT, color: '#FFFFFF' }}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, maxHeight: side ? '100%' : 'min(86vh, 640px)', display: 'flex', flexDirection: 'column', padding: side ? '10px 14px' : '14px 14px calc(14px + env(safe-area-inset-bottom))', boxSizing: 'border-box', animation: 'zgk-pop 0.25s ease-out' }}>
          <GPanel style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex' }}>{SLOT_COLS.slice(0, 3).map((c, i) => <span key={c} style={{ width: 22, height: 22, borderRadius: 11, background: c, boxShadow: '0 0 0 2.5px #FFFFFF', marginLeft: i ? -7 : 0 }} />)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 17, fontWeight: 900 }}>Invite friends to your squad</div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,0.72)' }}>{room ? `Pick up to ${room}. Each one gets an invite in your chat.` : 'Your squad is full.'}</div>
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
                    <span aria-hidden="true" style={{ width: 26, height: 26, borderRadius: 13, background: on ? '#F7C53A' : 'transparent', boxShadow: on ? 'none' : 'inset 0 0 0 2px rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{on && <GIcon k="check" size={15} color={INK} ink="transparent" />}</span>
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
