import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, Portal, useBackClose, FONT, ConfirmSheet, rtKeep, rtDrop } from '../App.jsx';
import { useJoystick, GJoy, TOUCHY, weakPhone, injectKitCss, useGameStage, stagePoint, GSkin, GSettings, GSetHead, GSetRow, GSeg, GSetSlider } from './gamekit.jsx';
import { GI } from './gicons.js';
import { Ico } from './zhud.jsx';
import { parseModel, parseAnims } from './zmodel.js';
import { resFetch, resBlob, resBuf } from './zres.js';
import { HA, HUSH_SND } from './hushaudio.js';
import { useRoomLink } from './relay.jsx';
import { supabase } from '../supabaseClient.js';
import { SCHAR } from './zsurv.js';
import { useTalking } from './talk.js';

const INK = '#07080A';
const BONE = '#E9E4DA';
const DIM = 'rgba(233,228,218,0.6)';
const BLOOD = '#C1352B';
const EXITG = '#4CD07A';
const WARM = '#F1D9A6';
const GEO = 'hush/geo-v1.bin';
const TEX = 'hush/tex-v1.webp';
const KEYI = '/hush/key-v1.webp';
const ART = '/hush/menu-v1.webp';
const MON = ['dead/zpara.bin', 'dead/zpara_d.webp', 'dead/zanim.bin', 'dead/zanim2.bin'];
const PREF = { gfx: 'zchat-hush-gfx', sens: 'zchat-hush-sens', seen: 'zchat-hush-seen', best: 'zchat-hush-best' };
const getPref = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch { return d; } };
const setPref = (k, v) => { try { localStorage.setItem(k, String(v)); } catch {} };
const QUICK = ['Over here', 'Quiet', 'Run', 'Help me', 'Key here', 'Follow me'];
const RULES = [
  ['It is blind', 'It hunts by sound. Running, doors, keys and talking all make noise.'],
  ['Stay quiet', 'Walk or crouch to stay quiet. Running is fast but loud.'],
  ['Find 3 keys', 'Each key opens one of the 3 locks on the exit. Then get out.'],
  ['Hide', 'Get under beds and tables. Hold your breath when it gets close.'],
  ['Use what you find', 'Drop a radio to lure it away. A knife saves you once. Batteries keep your light on.'],
  ['Play as a team', 'If it catches a friend, help them up before their time runs out.'],
];
const DESK_KEYS = [['W A S D', 'Move'], ['Mouse', 'Look'], ['Shift', 'Run'], ['C', 'Crouch'], ['F', 'Light'], ['E', 'Use'], ['Space', 'Hold breath'], ['Q', 'Drop radio'], ['Esc', 'Pause']];

let cssDone = false;
function injectHushCss() {
  if (cssDone || typeof document === 'undefined') return;
  cssDone = true;
  const el = document.createElement('style');
  el.textContent = `
.hush-flick{animation:hush-flick 6s steps(1,end) infinite}
@keyframes hush-flick{0%,100%{opacity:1}7%{opacity:.55}7.6%{opacity:1}43%{opacity:1}43.4%{opacity:.4}44%{opacity:.95}44.5%{opacity:.5}45%{opacity:1}}
.hush-in{animation:hush-in .5s ease both}
@keyframes hush-in{from{opacity:0}to{opacity:1}}
.hush-toast{animation:hush-toast 2.6s ease both}
@keyframes hush-toast{0%{opacity:0;transform:translateY(-4px)}10%{opacity:1;transform:none}85%{opacity:1}100%{opacity:0}}
.hush-item{transition:color .15s ease, transform .15s ease}
.hush-item:active{transform:translateX(4px);color:#fff}
@media (prefers-reduced-motion:reduce){.hush-flick,.hush-in,.hush-toast{animation:none!important}}
`;
  document.head.appendChild(el);
}

function GIcon({ k, size = 26, color = BONE }) {
  const d = GI[k];
  if (!d) return <Ico k={k} size={size} color={color} />;
  return <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden="true" style={{ display: 'block' }}><path d={d} fill={color} /></svg>;
}

function Btn({ size = 58, icon, text, label, on, onDown, onUp, onTap, style, ring, disabled, children }) {
  const st = useRef({ id: null });
  const [down, setDown] = useState(false);
  const press = (e) => {
    if (disabled) return;
    e.stopPropagation();
    e.preventDefault();
    const id = e.pointerId;
    st.current.id = id;
    try { e.currentTarget.setPointerCapture(id); } catch {}
    setDown(true);
    if (onDown) onDown();
    if (onTap) onTap();
  };
  const rel = (e) => { if (st.current.id !== e.pointerId) return; st.current.id = null; setDown(false); if (onUp) onUp(); };
  const upRef = useRef(onUp);
  upRef.current = onUp;
  useEffect(() => () => { if (st.current.id != null && upRef.current) upRef.current(); }, []);
  const lit = on || down;
  return (
    <div role="button" aria-label={label} aria-pressed={on || undefined} aria-disabled={disabled || undefined} onPointerDown={press} onPointerUp={rel} onPointerCancel={rel} onLostPointerCapture={rel} onContextMenu={(e) => e.preventDefault()}
      style={{ position: 'absolute', width: size, height: size, borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', background: lit ? 'rgba(233,228,218,0.22)' : 'rgba(8,9,12,0.42)', border: `1.5px solid ${ring || (lit ? 'rgba(233,228,218,0.85)' : 'rgba(233,228,218,0.32)')}`, opacity: disabled ? 0.38 : 1, touchAction: 'none', pointerEvents: 'auto', cursor: 'pointer', userSelect: 'none', WebkitUserSelect: 'none', transform: down ? 'scale(0.94)' : 'none', transition: 'transform .08s ease, background .12s ease', ...style }}>
      {icon && <GIcon k={icon} size={Math.round(size * 0.44)} color={lit ? '#FFFFFF' : BONE} />}
      {text && <span style={{ fontSize: Math.max(9.5, Math.round(size * 0.18)), fontWeight: 800, color: BONE, lineHeight: 1.05, textAlign: 'center', padding: '0 4px' }}>{text}</span>}
      {children}
    </div>
  );
}

function Ring({ size, f, color = BONE }) {
  const r = size / 2 - 3, c = Math.PI * 2 * r;
  return (
    <svg width={size} height={size} style={{ position: 'absolute', left: 0, top: 0, transform: 'rotate(-90deg)', pointerEvents: 'none' }} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="3" strokeDasharray={`${c * Math.max(0, Math.min(1, f))} ${c}`} strokeLinecap="round" />
    </svg>
  );
}

function KeyRow({ n, size = 30 }) {
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }} aria-label={`${n} of 3 keys`}>
      {[0, 1, 2].map((i) => (
        <img key={i} src={KEYI} alt="" width={size} height={size} draggable={false} style={{ width: size, height: size, opacity: i < n ? 1 : 0.22, filter: i < n ? 'drop-shadow(0 0 4px rgba(241,217,166,0.55))' : 'grayscale(1)', transition: 'opacity .3s ease' }} />
      ))}
    </div>
  );
}

function Battery({ f, on }) {
  const low = f < 0.12;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} aria-label={`Light ${Math.round(f * 100)} percent`}>
      <GIcon k="flashlight" size={18} color={on ? WARM : DIM} />
      <div style={{ width: 46, height: 8, borderRadius: 2, border: `1px solid ${DIM}`, padding: 1, boxSizing: 'border-box' }}>
        <div style={{ width: `${Math.max(0, Math.min(1, f)) * 100}%`, height: '100%', borderRadius: 1, background: low ? BLOOD : WARM }} />
      </div>
    </div>
  );
}

function Sheet({ title, onClose, children, width = 520 }) {
  return (
    <div className="hush-in" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{ position: 'absolute', inset: 0, zIndex: 30, background: 'rgba(3,3,5,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14, boxSizing: 'border-box', pointerEvents: 'auto' }}>
      <div style={{ width: '100%', maxWidth: width, maxHeight: '100%', overflowY: 'auto', background: '#0E0F12', border: '1px solid rgba(233,228,218,0.16)', borderRadius: 14, padding: '16px 18px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ flex: 1, fontSize: 19, fontWeight: 900, color: BONE }}>{title}</div>
          <button type="button" aria-label="Close" onClick={onClose} style={{ width: 36, height: 36, border: 'none', borderRadius: 18, background: 'rgba(233,228,218,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Ico k="close" size={18} color={BONE} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Seg({ value, items, onPick }) {
  return (
    <div style={{ display: 'flex', gap: 4, background: 'rgba(233,228,218,0.06)', borderRadius: 10, padding: 3 }}>
      {items.map(([v, t]) => (
        <button key={v} type="button" onClick={() => onPick(v)} aria-pressed={value === v} style={{ flex: 1, height: 34, border: 'none', borderRadius: 8, background: value === v ? BONE : 'transparent', color: value === v ? INK : BONE, fontWeight: 800, fontSize: 13.5, fontFamily: FONT, cursor: 'pointer' }}>{t}</button>
      ))}
    </div>
  );
}

function MenuItem({ text, sub, onPress, strong, disabled }) {
  return (
    <button type="button" className="hush-item" onClick={disabled ? undefined : onPress} disabled={disabled} style={{ display: 'block', textAlign: 'left', background: 'transparent', border: 'none', padding: '7px 0', cursor: disabled ? 'default' : 'pointer', color: disabled ? 'rgba(233,228,218,0.3)' : strong ? '#FFFFFF' : BONE, fontFamily: FONT }}>
      <span style={{ display: 'block', fontSize: strong ? 23 : 19, fontWeight: strong ? 900 : 700, lineHeight: 1.1 }}>{text}</span>
      {sub && <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: DIM, marginTop: 2 }}>{sub}</span>}
    </button>
  );
}

async function loadImg(path) {
  const b = await resBlob(`/${path}`);
  return createImageBitmap(b, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
}

const survFiles = (k) => [`dead/s${k}.bin`, `dead/s${k}_d.webp`];
function survKeyOf(sv) { const c = SCHAR[Math.abs(sv | 0) % SCHAR.length]; return c ? c.k : 'ch06'; }

function useHushMatch(myId, on) {
  const ch = useRef(null);
  const [ready, setReady] = useState(false);
  const mine = useRef(null);
  useEffect(() => {
    if (!on || !myId) return undefined;
    setReady(false);
    const keep = rtKeep(() => {
      const c = supabase.channel('hush-mm', { config: { presence: { key: myId } } });
      ch.current = c;
      return c.on('presence', { event: 'sync' }, () => setReady(true));
    }, { topic: 'hush-mm', onStatus: (s, err, c) => { if (s === 'SUBSCRIBED') { setReady(true); if (mine.current) { try { c.track(mine.current); } catch {} } } } });
    return () => { ch.current = null; rtDrop(keep); };
  }, [on, myId]);
  const list = () => {
    const c = ch.current;
    if (!c) return [];
    try {
      const s = c.presenceState() || {};
      const out = [];
      for (const [k, arr] of Object.entries(s)) for (const v of arr || []) if (v && v.r && k !== myId) out.push({ ...v, by: k });
      return out;
    } catch { return []; }
  };
  const advertise = (info) => { mine.current = info; const c = ch.current; if (c) { try { if (info) c.track(info); else c.untrack(); } catch {} } };
  return { ready, list, advertise };
}

export function HushGamePage({ me, myId, join, friends = [], online = [], onInvite, onSearch, onClose }) {
  injectKitCss();
  injectHushCss();
  const GS = useGameStage({ side: true });
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const runRef = useRef(null);
  const myFirst = String((me && me.name) || 'You').split(' ')[0];
  const sv = useMemo(() => { try { const v = Number(localStorage.getItem('zchat-zombie-col')); return Number.isFinite(v) && v >= 100 ? v - 100 : Math.floor(Math.random() * SCHAR.length); } catch { return 0; } }, []);
  const [screen, setScreen] = useState(join ? 'room' : 'menu');
  const [room, setRoom] = useState(() => (join ? { r: join.r, pub: !!join.pub, host: join.from || null } : null));
  const [sheet, setSheet] = useState(null);
  const [gfx, setGfx] = useState(() => getPref(PREF.gfx, 'auto'));
  const [sens, setSens] = useState(() => Math.max(0.4, Math.min(2.2, Number(getPref(PREF.sens, 1)) || 1)));
  const [load, setLoad] = useState({ on: false, f: 0, err: '' });
  const [hud, setHud] = useState(null);
  const [end, setEnd] = useState(null);
  const [paused, setPaused] = useState(false);
  const [leaveAsk, setLeaveAsk] = useState(false);
  const [quick, setQuick] = useState(false);
  const [bubbles, setBubbles] = useState([]);
  const [names, setNames] = useState({});
  const [lobby, setLobby] = useState({ ids: [], ph: 'lobby', seed: 0, cd: 0 });
  const [crouchOn, setCrouchOn] = useState(false);
  const [lightOn, setLightOn] = useState(true);
  const [mm, setMm] = useState('');
  const assets = useRef(null);
  const tier = gfx === 'auto' ? (weakPhone() ? 'fast' : 'mid') : gfx === 'best' ? 'best' : gfx === 'fast' ? 'fast' : 'mid';
  const inRoom = !!room;
  const pub = !!(room && room.pub);
  const relay = useRoomLink({ id: room ? `hush-${room.r}` : null, myId, enabled: inRoom, meta: { n: myFirst, a: me && me.avatar, sv }, fast: ['hp', 'hs'], audio: inRoom && !pub, cloud: 'hush' });
  const relayRef = useRef(relay);
  relayRef.current = relay;
  const peers = relay.peers || [];
  const present = useMemo(() => [myId, ...peers].filter(Boolean).sort(), [myId, peers.join(',')]);
  const leader = present[0] || myId;
  const isLeader = !inRoom || leader === myId;
  const leaderRef = useRef(isLeader);
  leaderRef.current = isLeader;
  const match = useHushMatch(myId, pub);
  const screenRef = useRef(screen);
  screenRef.current = screen;
  const lobbyRef = useRef(lobby);
  lobbyRef.current = lobby;
  const namesRef = useRef(names);
  namesRef.current = names;

  useEffect(() => { HA.init(); HA.load(); }, []);
  useEffect(() => {
    const menuish = screen === 'menu' || screen === 'room' || screen === 'end';
    HA.menuMusic(menuish);
    return undefined;
  }, [screen]);
  useEffect(() => () => { HA.menuMusic(false); HA.stopAll(); if (runRef.current) { runRef.current.dispose(); runRef.current = null; } }, []);

  const ensureAssets = async (coop) => {
    if (assets.current && (!coop || assets.current.coop)) return assets.current;
    setLoad({ on: true, f: 0, err: '' });
    const files = [GEO, TEX, ...MON, ...HUSH_SND];
    if (coop) files.push('dead/sanim.bin');
    try {
      await resFetch(files, (got, total) => setLoad((l) => ({ ...l, f: total ? got / total : 1 })));
      const [geo, tex, mb, mt, ab, ab2] = await Promise.all([resBuf(`/${GEO}`), loadImg(TEX), resBuf(`/${MON[0]}`), loadImg(MON[1]), resBuf(`/${MON[2]}`), resBuf(`/${MON[3]}`)]);
      const A = { geo, tex, texLayers: Math.round(tex.height / tex.width), texSize: tex.width, mon: { M: parseModel(mb), img: mt }, monA: parseAnims(ab), monA2: parseAnims(ab2), coop: false, survs: new Map() };
      if (coop) {
        A.sanim = parseAnims(await resBuf('/dead/sanim.bin'));
        A.coop = true;
      }
      assets.current = A;
      setLoad({ on: false, f: 1, err: '' });
      return A;
    } catch {
      setLoad({ on: false, f: 0, err: 'Could not load Hush. Check your connection and try again.' });
      return null;
    }
  };
  const survLoad = (A, k) => {
    if (A.survs.has(k)) return A.survs.get(k);
    A.survs.set(k, null);
    (async () => {
      try {
        await resFetch(survFiles(k));
        const [b, img] = await Promise.all([resBuf(`/dead/s${k}.bin`), loadImg(`dead/s${k}_d.webp`)]);
        A.survs.set(k, { M: parseModel(b), img });
      } catch { A.survs.delete(k); }
    })();
    return null;
  };

  const startRun = async (o) => {
    const A = await ensureAssets(!o.solo);
    if (!A) return;
    setEnd(null); setHud(null); setPaused(false); setCrouchOn(false); setLightOn(true);
    setScreen('play');
    HA.menuMusic(false);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const cv = canvasRef.current;
    if (!cv) return;
    if (runRef.current) { runRef.current.dispose(); runRef.current = null; }
    try {
      const { createRun } = await import('./hushrun.js');
      const seenT = getPref(PREF.seen, '0') !== '1';
      runRef.current = await createRun(cv, {
        seed: o.seed, solo: o.solo, slot: o.slot || 0, tier, sens, tutorial: seenT,
        me: { id: o.solo ? 'me' : myId, n: myFirst, sv },
        others: o.others || [],
        assets: { ...A, surv: (k) => (A.coop ? survLoad(A, k) || A.survs.get(k) : null) },
        survKey: (q) => survKeyOf(q.sv),
        isHost: () => leaderRef.current,
        net: { send: (t, d) => relayRef.current.send(t, d) },
        onHud: (h) => setHud(h),
        onEnd: (r) => { setEnd(r); if (!o.solo) return; if (r.k === 'won') { const best = Number(getPref(PREF.best, 0)) || 0; if (!best || r.t < best) setPref(PREF.best, r.t); } },
        onError: () => { setLoad({ on: false, f: 0, err: 'Hush stopped. Try again.' }); setScreen(inRoom ? 'room' : 'menu'); },
      });
      setPref(PREF.seen, '1');
      if (typeof window !== 'undefined' && window.__zfake) window.__hushRun = runRef.current;
    } catch {
      setLoad({ on: false, f: 0, err: 'Your phone could not start 3D graphics.' });
      setScreen(inRoom ? 'room' : 'menu');
    }
  };
  const stopRun = () => { if (runRef.current) { runRef.current.dispose(); runRef.current = null; } HA.stopAll(); };

  useEffect(() => {
    if (!inRoom) return undefined;
    const offs = [
      relay.on('hm', (m) => { if (m.from) setNames((p) => (p[m.from] && p[m.from].n === m.n ? p : { ...p, [m.from]: { n: String(m.n || 'Player').slice(0, 20), a: m.a || null, sv: m.sv | 0 } })); }),
      relay.on('hl', (m) => { if (leaderRef.current) return; setLobby({ ids: Array.isArray(m.ids) ? m.ids.slice(0, 4) : [], ph: m.ph || 'lobby', seed: m.seed | 0, cd: m.cd | 0 }); }),
      relay.on('hgo', (m) => {
        if (leaderRef.current && m.from !== myId) return;
        const ids = Array.isArray(m.ids) ? m.ids : [];
        if (!ids.includes(myId)) return;
        const others = ids.filter((x) => x !== myId).map((x) => ({ id: x, slot: ids.indexOf(x), n: (namesRef.current[x] || {}).n || 'Friend', sv: (namesRef.current[x] || {}).sv | 0 }));
        startRun({ seed: m.seed | 0, solo: false, slot: ids.indexOf(myId), others });
      }),
      relay.on('hq', (m) => { const t = QUICK[m.i | 0]; if (!t) return; const n = (namesRef.current[m.from] || {}).n || 'Friend'; setBubbles((b) => [...b.slice(-3), { id: Math.random(), text: `${n}: ${t}` }]); }),
      relay.on('hend', () => { if (!leaderRef.current) { stopRun(); setScreen('room'); } }),
    ];
    for (const t of ['hp', 'hs', 'he', 'hn', 'ha', 'bye']) offs.push(relay.on(t, (m) => { if (runRef.current) runRef.current.netIn(t, m); }));
    return () => offs.forEach((f) => f && f());
  }, [inRoom, relay.on]);

  useEffect(() => {
    if (!inRoom) return undefined;
    const hi = () => relayRef.current.send('hm', { n: myFirst, a: (me && me.avatar) || null, sv });
    hi();
    const iv = setInterval(hi, 6000);
    return () => clearInterval(iv);
  }, [inRoom, peers.length]);

  useEffect(() => {
    if (!inRoom || !isLeader) return undefined;
    const ids = present.slice(0, 4);
    const next = { ...lobbyRef.current, ids, ph: screenRef.current === 'play' ? 'play' : 'lobby' };
    setLobby(next);
    relay.send('hl', next);
    const iv = setInterval(() => relayRef.current.send('hl', { ...lobbyRef.current, ids: present.slice(0, 4), ph: screenRef.current === 'play' ? 'play' : 'lobby' }), 3000);
    return () => clearInterval(iv);
  }, [inRoom, isLeader, present.join(','), screen]);

  useEffect(() => {
    if (!runRef.current) return;
    const gone = Object.keys(runRef.current.G.players).filter((id) => id !== myId && !peers.includes(id));
    for (const id of gone) runRef.current.dropPeer(id);
  }, [peers.join(',')]);

  useEffect(() => {
    if (!pub || !isLeader || !match.ready) return undefined;
    match.advertise({ r: room.r, n: present.length, ph: screen === 'play' ? 'play' : 'lobby', at: Date.now() });
    return undefined;
  }, [pub, isLeader, match.ready, present.length, screen]);
  useEffect(() => { if (!pub) return undefined; return () => match.advertise(null); }, [pub]);

  useEffect(() => {
    if (!pub || !isLeader || screen !== 'room' || present.length < 2) { if (lobby.cd) setLobby((l) => ({ ...l, cd: 0 })); return undefined; }
    let left = 20;
    setLobby((l) => ({ ...l, cd: left }));
    const iv = setInterval(() => {
      left -= 1;
      setLobby((l) => ({ ...l, cd: left }));
      if (left <= 0) { clearInterval(iv); hostStart(); }
    }, 1000);
    return () => clearInterval(iv);
  }, [pub, isLeader, screen, present.length]);

  const hostStart = () => {
    if (!inRoom) return;
    const ids = present.slice(0, 4);
    const seed = 1 + Math.floor(Math.random() * 2e9);
    relay.send('hgo', { seed, ids });
    const others = ids.filter((x) => x !== myId).map((x) => ({ id: x, slot: ids.indexOf(x), n: (names[x] || {}).n || 'Friend', sv: (names[x] || {}).sv | 0 }));
    startRun({ seed, solo: false, slot: ids.indexOf(myId), others });
  };

  const playSolo = () => { setRoom(null); startRun({ seed: 1 + Math.floor(Math.random() * 2e9), solo: true }); };
  const newFriendRoom = () => {
    const r = `f${Math.random().toString(36).slice(2, 10)}`;
    setRoom({ r, pub: false, host: myId });
    setScreen('room');
    ensureAssets(true);
  };
  const quickMatch = async () => {
    setMm('Looking for a room');
    ensureAssets(true);
    setRoom({ r: 'wait', pub: true, wait: true });
  };
  useEffect(() => {
    if (!room || !room.wait || !match.ready) return undefined;
    const t = setTimeout(() => {
      const open = match.list().filter((v) => v.ph === 'lobby' && (v.n | 0) < 4 && Date.now() - (v.at || 0) < 120000).sort((a, b) => (b.n | 0) - (a.n | 0));
      const r = open.length ? open[0].r : `p${Math.random().toString(36).slice(2, 10)}`;
      setRoom({ r, pub: true });
      setScreen('room');
      setMm('');
    }, 1400);
    return () => clearTimeout(t);
  }, [room && room.wait, match.ready]);

  const leaveRoom = () => { relay.send('bye', {}); setRoom(null); setScreen('menu'); setLobby({ ids: [], ph: 'lobby', seed: 0, cd: 0 }); };
  const backToMenu = () => { stopRun(); setEnd(null); if (inRoom) { if (isLeader) relay.send('hend', {}); setScreen('room'); } else setScreen('menu'); };
  const leaveGame = () => { setLeaveAsk(false); setPaused(false); stopRun(); setEnd(null); if (inRoom) { relay.send('bye', {}); setRoom(null); } setScreen('menu'); };

  const back = () => {
    if (sheet) { setSheet(null); return; }
    if (leaveAsk) { setLeaveAsk(false); return; }
    if (screen === 'play' && !end) { if (paused) setLeaveAsk(true); else { setPaused(true); if (runRef.current) runRef.current.pause(true); } return; }
    if (screen === 'play' && end) { backToMenu(); return; }
    if (screen === 'room') { leaveRoom(); return; }
    onClose();
  };
  useBackClose(true, back);

  useEffect(() => {
    if (!runRef.current) return;
    runRef.current.pause(paused);
  }, [paused]);

  const look = useRef({ id: null, x: 0, y: 0 });
  const J = useJoystick(wrapRef, { radius: () => (GS.land ? 44 : 40), rot: () => GS.side, zone: (x, y, b) => x < b.width * 0.42 && y > b.height * 0.28, enabled: () => screen === 'play' && !paused && !end, noCapture: true });
  useEffect(() => {
    if (screen !== 'play') return undefined;
    let raf = 0;
    const tick = () => { raf = requestAnimationFrame(tick); const r = runRef.current; if (r) r.move(J.joy.current.x, J.joy.current.y); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [screen]);
  const lookDown = (e) => {
    if (screen !== 'play' || paused || end) return;
    const p = stagePoint(wrapRef.current, e, GS.side);
    if (e.pointerType === 'mouse') {
      if (wrapRef.current && document.pointerLockElement !== wrapRef.current) { try { const r = wrapRef.current.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch {} }
      return;
    }
    if (p.x < GS.W * 0.42 && p.y > GS.H * 0.28) { J.handlers.onPointerDown(e); return; }
    if (look.current.id != null) return;
    look.current = { id: e.pointerId, x: p.x, y: p.y };
  };
  const lookMove = (e) => {
    if (e.pointerType === 'mouse') return;
    if (J.joy.current.id === e.pointerId) { J.handlers.onPointerMove(e); return; }
    if (look.current.id !== e.pointerId) return;
    const p = stagePoint(wrapRef.current, e, GS.side);
    const dx = p.x - look.current.x, dy = p.y - look.current.y;
    look.current.x = p.x; look.current.y = p.y;
    if (runRef.current) runRef.current.look(dx * 1.15, dy * 1.15);
  };
  const lookUp = (e) => { if (J.joy.current.id === e.pointerId) J.handlers.onPointerUp(e); if (look.current.id === e.pointerId) look.current.id = null; };
  useEffect(() => {
    if (screen !== 'play') return undefined;
    const mm2 = (e) => { if (document.pointerLockElement && runRef.current && !paused) runRef.current.look(e.movementX, e.movementY); };
    const keys = new Set();
    const mv = () => { const r = runRef.current; if (!r) return; const x = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0); const y = (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) - (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0); if (x || y || J.joy.current.id == null) r.move(x, y); };
    const kd = (e) => {
      if (e.repeat) { if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault(); return; }
      const r = runRef.current;
      if (!r) return;
      keys.add(e.code);
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') r.run(true);
      else if (e.code === 'KeyC' || e.code === 'ControlLeft') setCrouchOn(r.crouch());
      else if (e.code === 'KeyF') setLightOn(r.light());
      else if (e.code === 'KeyE') r.use(true);
      else if (e.code === 'Space') { e.preventDefault(); r.breath(true); }
      else if (e.code === 'KeyQ' || e.code === 'KeyG') r.item();
      mv();
    };
    const ku = (e) => {
      keys.delete(e.code);
      const r = runRef.current;
      if (!r) return;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') r.run(false);
      else if (e.code === 'KeyE') r.use(false);
      else if (e.code === 'Space') r.breath(false);
      mv();
    };
    window.addEventListener('mousemove', mm2);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    const rs = () => { if (runRef.current) runRef.current.resize(); };
    window.addEventListener('resize', rs);
    return () => { window.removeEventListener('mousemove', mm2); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); window.removeEventListener('resize', rs); try { if (document.pointerLockElement) document.exitPointerLock(); } catch {} };
  }, [screen, paused]);
  useEffect(() => { if (runRef.current) runRef.current.resize(); }, [GS.W, GS.H]);
  useEffect(() => { if (!bubbles.length) return undefined; const t = setTimeout(() => setBubbles((b) => b.slice(1)), 3200); return () => clearTimeout(t); }, [bubbles]);

  const talking = useTalking(inRoom && !pub && screen === 'play');
  useEffect(() => { if (talking.includes(myId) && runRef.current) runRef.current.talk(); }, [talking]);
  useEffect(() => {
    if (!(inRoom && !pub && screen === 'play')) return undefined;
    const iv = setInterval(() => { if (talking.includes(myId) && runRef.current) runRef.current.talk(); }, 800);
    return () => clearInterval(iv);
  }, [inRoom, pub, screen, talking.includes(myId)]);
  const sendQuick = (i) => { setQuick(false); relay.send('hq', { i }); setBubbles((b) => [...b.slice(-3), { id: Math.random(), text: `You: ${QUICK[i]}` }]); };
  const r = runRef.current;
  const h = hud || {};
  const W = GS.W, H = GS.H;
  const small = H < 380;
  const bs = small ? 52 : 60;
  const useS = small ? 70 : 80;
  const best = Number(getPref(PREF.best, 0)) || 0;
  const fmtT = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const slotIds = inRoom ? (isLeader ? present.slice(0, 4) : (lobby.ids.length ? lobby.ids : present.slice(0, 4))) : [];
  const nameFor = (id) => (id === myId ? myFirst : (names[id] || {}).n || 'Player');
  const avaFor = (id) => (id === myId ? me && me.avatar : (names[id] || {}).a);
  const roomFull = present.length > 4 && !present.slice(0, 4).includes(myId);

  return (
    <div ref={GS.rootRef} onPointerDownCapture={() => HA.init()} style={{ position: 'fixed', left: 0, right: 0, top: 'var(--zvp-top, 0px)', height: 'calc(var(--zvp-h, 100%) + var(--zgx, 0px))', zIndex: 90, background: INK, overflow: 'hidden', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none', fontFamily: FONT, color: BONE }}>
      <div ref={wrapRef} style={GS.wrapStyle} onPointerDown={lookDown} onPointerMove={lookMove} onPointerUp={lookUp} onPointerCancel={lookUp} onContextMenu={(e) => e.preventDefault()}>
        {screen === 'play' && <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', imageRendering: 'pixelated', display: 'block' }} />}

        {screen !== 'play' && (
          <div style={{ position: 'absolute', inset: 0 }}>
            <img src={ART} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'pixelated', opacity: 0.9 }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(4,4,6,0.94) 0%, rgba(4,4,6,0.78) 38%, rgba(4,4,6,0.2) 72%, rgba(4,4,6,0.45) 100%)' }} />
          </div>
        )}

        {screen === 'menu' && (
          <div className="hush-in" style={{ position: 'absolute', left: GS.at.left(28), top: GS.at.top(14), bottom: GS.at.bottom(14), display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 380 }}>
            <div className="hush-flick" style={{ fontSize: small ? 54 : 68, fontWeight: 900, letterSpacing: '0.06em', color: '#FFFFFF', lineHeight: 0.95, marginBottom: 4 }}>Hush</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: DIM, marginBottom: small ? 10 : 18, maxWidth: 300 }}>It cannot see you. It can hear you.</div>
            <MenuItem strong text="Play alone" onPress={playSolo} sub={best ? `Best escape ${fmtT(best)}` : null} />
            <MenuItem text="Play with friends" sub="Up to 4, with voice" onPress={newFriendRoom} />
            <MenuItem text="Quick match" sub="Team up with players online" onPress={quickMatch} />
            <MenuItem text="How to play" onPress={() => setSheet('rules')} />
            <MenuItem text="Settings" onPress={() => setSheet('set')} />
            {mm && <div style={{ fontSize: 13, fontWeight: 700, color: WARM, marginTop: 6 }}>{mm}</div>}
          </div>
        )}

        {screen === 'room' && (
          <div className="hush-in" style={{ position: 'absolute', left: GS.at.left(26), right: GS.at.right(26), top: GS.at.top(14), bottom: GS.at.bottom(14), display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 560 }}>
            <div style={{ fontSize: small ? 26 : 32, fontWeight: 900, color: '#FFFFFF' }}>{pub ? 'Quick match' : 'Friend room'}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: DIM, marginBottom: 12 }}>
              {roomFull ? 'This room is full.' : lobby.ph === 'play' && !isLeader ? 'A round is on. You join the next one.' : pub ? (present.length < 2 ? 'Waiting for players to join' : lobby.cd ? `Starting in ${lobby.cd}` : 'Waiting for the room leader') : isLeader ? 'Invite friends, then start. Voice is on in friend rooms.' : `Waiting for ${nameFor(leader)} to start`}
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              {[0, 1, 2, 3].map((i) => {
                const id = slotIds[i];
                const talk = id && relay.mics && relay.mics[id];
                return (
                  <div key={i} style={{ width: 92, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 58, height: 58, borderRadius: 29, border: id ? `2px solid ${talk ? EXITG : 'rgba(233,228,218,0.3)'}` : '2px dashed rgba(233,228,218,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {id ? <Avatar emoji={avaFor(id)} name={nameFor(id)} size={52} /> : null}
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: id ? BONE : 'rgba(233,228,218,0.35)', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{id ? (id === myId ? 'You' : nameFor(id)) : 'Open'}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              {isLeader && !roomFull && <button type="button" onClick={hostStart} style={{ height: 46, padding: '0 22px', border: 'none', borderRadius: 10, background: '#FFFFFF', color: INK, fontWeight: 900, fontSize: 16, fontFamily: FONT, cursor: 'pointer' }}>Start</button>}
              {!pub && <button type="button" onClick={() => setSheet('invite')} style={{ height: 46, padding: '0 18px', borderRadius: 10, border: '1px solid rgba(233,228,218,0.35)', background: 'transparent', color: BONE, fontWeight: 800, fontSize: 15, fontFamily: FONT, cursor: 'pointer' }}>Invite friends</button>}
              {!pub && <button type="button" aria-label={relay.mic && relay.mic.on ? 'Turn your mic off' : 'Turn your mic on'} onClick={() => relay.toggleMic && relay.toggleMic()} style={{ height: 46, width: 46, borderRadius: 23, border: '1px solid rgba(233,228,218,0.35)', background: relay.mic && relay.mic.on ? 'rgba(76,208,122,0.22)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Ico k={relay.mic && relay.mic.on ? 'mic' : 'micoff'} size={22} color={BONE} /></button>}
              <button type="button" onClick={leaveRoom} style={{ height: 46, padding: '0 16px', borderRadius: 10, border: 'none', background: 'transparent', color: DIM, fontWeight: 800, fontSize: 15, fontFamily: FONT, cursor: 'pointer' }}>Leave</button>
            </div>
            {load.on && <div style={{ fontSize: 12.5, fontWeight: 700, color: DIM, marginTop: 10 }}>{`Getting the hospital ready ${Math.round(load.f * 100)}%`}</div>}
          </div>
        )}

        {screen === 'play' && !end && (
          <>
            <div style={{ position: 'absolute', left: GS.at.left(16), top: GS.at.top(10), display: 'flex', flexDirection: 'column', gap: 6, pointerEvents: 'none' }}>
              <KeyRow n={h.keys || 0} size={small ? 26 : 30} />
              <Battery f={h.bat == null ? 1 : h.bat} on={h.light !== false} />
              {h.locks > 0 && <div style={{ fontSize: 11.5, fontWeight: 800, color: EXITG }}>{`${h.locks} of 3 locks open`}</div>}
            </div>
            <div style={{ position: 'absolute', left: '50%', top: '50%', width: 4, height: 4, marginLeft: -2, marginTop: -2, borderRadius: 2, background: h.can ? '#FFFFFF' : 'rgba(255,255,255,0.35)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: 0, right: 0, top: GS.at.top(12), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, pointerEvents: 'none' }}>
              {(h.toasts || []).slice(-2).map((t) => (
                <div key={t.at} className="hush-toast" style={{ fontSize: small ? 13 : 14.5, fontWeight: 800, color: t.k === 'bad' ? '#FF8B80' : t.k === 'key' ? WARM : BONE, textShadow: '0 1px 4px rgba(0,0,0,0.95)', padding: '0 12px', textAlign: 'center' }}>{t.text}</div>
              ))}
              {bubbles.map((b) => <div key={b.id} className="hush-toast" style={{ fontSize: 13, fontWeight: 800, color: '#BFD9FF', textShadow: '0 1px 4px rgba(0,0,0,0.95)' }}>{b.text}</div>)}
            </div>
            <div style={{ position: 'absolute', right: GS.at.right(14), top: GS.at.top(10), display: 'flex', gap: 8, alignItems: 'center' }}>
              {inRoom && pub && <button type="button" aria-label="Quick lines" onClick={() => setQuick((v) => !v)} style={{ width: 40, height: 40, borderRadius: 20, border: '1px solid rgba(233,228,218,0.3)', background: 'rgba(8,9,12,0.42)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', pointerEvents: 'auto' }}><Ico k="chat" size={20} color={BONE} /></button>}
              {inRoom && !pub && <button type="button" aria-label={relay.mic && relay.mic.on ? 'Turn your mic off' : 'Turn your mic on'} onClick={() => relay.toggleMic && relay.toggleMic()} style={{ width: 40, height: 40, borderRadius: 20, border: '1px solid rgba(233,228,218,0.3)', background: relay.mic && relay.mic.on ? 'rgba(76,208,122,0.25)' : 'rgba(8,9,12,0.42)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', pointerEvents: 'auto' }}><Ico k={relay.mic && relay.mic.on ? 'mic' : 'micoff'} size={20} color={BONE} /></button>}
              <button type="button" aria-label="Pause" onClick={() => setPaused(true)} style={{ width: 40, height: 40, borderRadius: 20, border: '1px solid rgba(233,228,218,0.3)', background: 'rgba(8,9,12,0.42)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', pointerEvents: 'auto' }}><Ico k="pause" size={18} color={BONE} /></button>
            </div>
            {inRoom && h.team && h.team.length > 0 && (
              <div style={{ position: 'absolute', right: GS.at.right(14), top: GS.at.top(58), display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, pointerEvents: 'none' }}>
                {h.team.map((q) => <div key={q.id} style={{ fontSize: 11.5, fontWeight: 800, color: q.dead ? 'rgba(233,228,218,0.35)' : q.down ? '#FF8B80' : q.out ? EXITG : talking.includes(q.id) ? '#9DF0B8' : DIM, textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>{`${q.n}${q.dead ? ' is gone' : q.down ? ' is down' : q.out ? ' got out' : ''}`}</div>)}
              </div>
            )}
            {quick && (
              <div style={{ position: 'absolute', right: GS.at.right(14), top: GS.at.top(56), display: 'flex', flexDirection: 'column', gap: 6, pointerEvents: 'auto', zIndex: 5 }}>
                {QUICK.map((q, i) => <button key={q} type="button" onClick={() => sendQuick(i)} style={{ height: 34, padding: '0 14px', borderRadius: 8, border: '1px solid rgba(233,228,218,0.28)', background: 'rgba(8,9,12,0.8)', color: BONE, fontWeight: 800, fontSize: 13.5, fontFamily: FONT, cursor: 'pointer', textAlign: 'right' }}>{q}</button>)}
              </div>
            )}
            {(h.down || h.dead || h.out) && (
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: GS.at.bottom(small ? 18 : 28), display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none', textShadow: '0 1px 5px rgba(0,0,0,0.95)' }}>
                {h.down && !h.dead && <><div style={{ fontSize: 20, fontWeight: 900, color: '#FF8B80' }}>You are down</div><div style={{ fontSize: 13.5, fontWeight: 700, color: BONE }}>{`A friend can help you up. ${h.downT}`}</div></>}
                {(h.dead || h.out) && <div style={{ fontSize: 14, fontWeight: 800, color: BONE }}>{h.spect ? `${h.out ? 'You got out. ' : ''}Watching ${h.spect}` : h.out ? 'You got out' : 'You are gone'}</div>}
              </div>
            )}
            {TOUCHY && !h.dead && !h.out && !h.scare && (
              <>
                <GJoy view={J.view} knobRef={J.knob} R={J.R} flat idle={{ x: GS.W * 0.14, y: GS.H * 0.74 }} alpha={0.75} />
                {!h.down && <Btn size={useS} label={h.prompt || 'Use'} icon="hand" disabled={!h.can} onDown={() => r && r.use(true)} onUp={() => r && r.use(false)} style={{ right: `calc(${GS.at.right(26)})`, bottom: `calc(${GS.at.bottom(small ? 30 : 38)})` }}>
                  {h.hold >= 0 && <Ring size={useS} f={h.hold} color={EXITG} />}
                </Btn>}
                {!h.down && h.prompt && <div style={{ position: 'absolute', right: GS.at.right(26), width: useS, bottom: GS.at.bottom(small ? 8 : 14), textAlign: 'center', fontSize: 12, fontWeight: 900, color: h.can ? BONE : DIM, textShadow: '0 1px 3px rgba(0,0,0,0.95)', pointerEvents: 'none', whiteSpace: 'nowrap', display: 'flex', justifyContent: 'center' }}>{h.prompt}</div>}
                {!h.down && <Btn size={bs} label="Run" icon="run" onDown={() => r && r.run(true)} onUp={() => r && r.run(false)} style={{ right: `calc(${GS.at.right(26 + useS + 14)})`, bottom: GS.at.bottom(small ? 26 : 32) }} />}
                {!h.down && <Btn size={bs - 4} label={crouchOn ? 'Stand up' : 'Crouch'} icon="crouch" on={crouchOn} onTap={() => { if (r) setCrouchOn(r.crouch()); }} style={{ right: GS.at.right(26 + Math.round((useS - bs + 4) / 2)), bottom: `calc(${GS.at.bottom((small ? 30 : 38) + useS + 12)})` }} />}
                {!h.down && <Btn size={bs - 4} label="Hold breath" text={h.breath ? `${Math.max(0, Math.ceil((1 - (h.breathT || 0)) * 8))}` : 'Hold breath'} on={!!h.breath} disabled={!!h.breathCd && !h.breath} onDown={() => r && r.breath(true)} onUp={() => r && r.breath(false)} style={{ right: `calc(${GS.at.right(26 + useS + 14 + 2)})`, bottom: `calc(${GS.at.bottom((small ? 26 : 32) + bs + 10)})` }} />}
                <Btn size={bs - 8} label={lightOn ? 'Turn the light off' : 'Turn the light on'} icon="flashlight" on={!!h.light} onTap={() => { if (r) setLightOn(r.light()); }} style={{ right: GS.at.right(16), top: `calc(${GS.at.top(58 + (inRoom && h.team ? h.team.length * 16 : 0))})` }} />
                {h.item === 'radio' && !h.down && <Btn size={bs - 4} label="Drop the radio" text="Drop radio" onTap={() => r && r.item()} style={{ right: `calc(${GS.at.right(26 + useS + 14 + bs + 12)})`, bottom: GS.at.bottom(small ? 26 : 32) }} />}
                {h.item === 'knife' && <div style={{ position: 'absolute', left: GS.at.left(16), top: GS.at.top(small ? 74 : 82), display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'none' }}><Ico k="knife" size={18} color={WARM} /><span style={{ fontSize: 11.5, fontWeight: 800, color: WARM }}>Knife</span></div>}
              </>
            )}
            {!TOUCHY && !h.dead && !h.out && (
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: GS.at.bottom(18), display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
                {h.prompt && <div style={{ fontSize: 15, fontWeight: 900, color: h.can ? BONE : DIM, textShadow: '0 1px 4px rgba(0,0,0,0.95)' }}>{h.can ? `E  ${h.prompt}` : h.prompt}</div>}
              </div>
            )}
            {h.hold >= 0 && !TOUCHY && <div style={{ position: 'absolute', left: '50%', top: '56%', width: 120, height: 4, marginLeft: -60, background: 'rgba(233,228,218,0.2)', borderRadius: 2 }}><div style={{ width: `${h.hold * 100}%`, height: '100%', background: EXITG, borderRadius: 2 }} /></div>}
          </>
        )}

        {screen === 'play' && end && (
          <div className="hush-in" style={{ position: 'absolute', inset: 0, background: 'rgba(3,3,5,0.62)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto' }}>
            <div style={{ textAlign: 'center', padding: 18, maxWidth: 460 }}>
              <div style={{ fontSize: small ? 34 : 44, fontWeight: 900, color: end.k === 'won' ? EXITG : '#FF8B80', lineHeight: 1 }}>{end.k === 'won' ? (end.me === 'out' ? 'You got out' : 'Your team got out') : 'It found you'}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: DIM, marginTop: 8 }}>{`${fmtT(end.t)} in the hospital. ${end.keys} of 3 keys found.`}</div>
              {inRoom && <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>{end.team.map((q) => <span key={q.id} style={{ fontSize: 13, fontWeight: 800, color: q.out ? EXITG : '#FF8B80' }}>{`${q.id === (inRoom ? myId : 'me') ? 'You' : q.n} ${q.out ? 'got out' : 'did not'}`}</span>)}</div>}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 18, flexWrap: 'wrap' }}>
                {(!inRoom || isLeader) && <button type="button" onClick={() => { if (inRoom) { relay.send('hend', {}); setTimeout(hostStart, 300); } else playSolo(); }} style={{ height: 46, padding: '0 22px', border: 'none', borderRadius: 10, background: '#FFFFFF', color: INK, fontWeight: 900, fontSize: 16, fontFamily: FONT, cursor: 'pointer' }}>Play again</button>}
                <button type="button" onClick={backToMenu} style={{ height: 46, padding: '0 18px', borderRadius: 10, border: '1px solid rgba(233,228,218,0.35)', background: 'transparent', color: BONE, fontWeight: 800, fontSize: 15, fontFamily: FONT, cursor: 'pointer' }}>{inRoom ? 'Back to the room' : 'Menu'}</button>
              </div>
              {inRoom && !isLeader && <div style={{ fontSize: 12.5, fontWeight: 700, color: DIM, marginTop: 10 }}>{`${nameFor(leader)} can start a new round`}</div>}
            </div>
          </div>
        )}

        {paused && screen === 'play' && !end && (
          <div className="hush-in" style={{ position: 'absolute', inset: 0, background: 'rgba(3,3,5,0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20, pointerEvents: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, minWidth: 220 }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#FFFFFF', marginBottom: 6 }}>Paused</div>
              {inRoom && <div style={{ fontSize: 12.5, fontWeight: 700, color: DIM, marginBottom: 6 }}>The game keeps going for your team</div>}
              <MenuItem strong text="Resume" onPress={() => setPaused(false)} />
              <MenuItem text="How to play" onPress={() => setSheet('rules')} />
              <MenuItem text="Settings" onPress={() => setSheet('set')} />
              <MenuItem text="Leave" onPress={() => setLeaveAsk(true)} />
            </div>
          </div>
        )}

        {sheet === 'rules' && (
          <Sheet title="How to play" onClose={() => setSheet(null)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {RULES.map(([t, d]) => <div key={t}><div style={{ fontSize: 15, fontWeight: 900, color: '#FFFFFF' }}>{t}</div><div style={{ fontSize: 13.5, fontWeight: 600, color: DIM, lineHeight: 1.4 }}>{d}</div></div>)}
              {!TOUCHY && <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px', marginTop: 4 }}>{DESK_KEYS.map(([k, v]) => <React.Fragment key={k}><span style={{ fontSize: 12.5, fontWeight: 900, color: WARM }}>{k}</span><span style={{ fontSize: 12.5, fontWeight: 700, color: DIM }}>{v}</span></React.Fragment>)}</div>}
            </div>
          </Sheet>
        )}
        {sheet === 'set' && (
          <GSkin k="hush">
            <GSettings onClose={() => { setSheet(null); HA.sync(); }} first="graphics" buttons={false} at={GS.at} keys={DESK_KEYS}
              tabs={[{ k: 'graphics', label: 'Graphics', body: (
                <>
                  <GSetHead>Picture</GSetHead>
                  <GSetRow label="Graphics quality" sub="Changes start with your next round"><GSeg value={gfx} items={[['auto', 'Auto'], ['best', 'Best'], ['mid', 'Balanced'], ['fast', 'Fast']]} onPick={(v) => { setGfx(v); setPref(PREF.gfx, v); }} label="Graphics quality" /></GSetRow>
                </>
              ) }]}
              controlsExtra={(
                <>
                  <GSetHead>Sensitivity</GSetHead>
                  <GSetRow label="Camera sensitivity"><GSetSlider value={sens} min={0.4} max={2.2} step={0.05} label="Camera sensitivity" fmt={(x) => x.toFixed(2)} onChange={(x) => { setSens(x); setPref(PREF.sens, x); if (runRef.current && runRef.current.setSens) runRef.current.setSens(x); }} /></GSetRow>
                </>
              )} />
          </GSkin>
        )}
        {sheet === 'invite' && (
          <Sheet title="Invite friends" onClose={() => setSheet(null)}>
            <InviteList friends={friends} online={online} onSearch={onSearch} onPick={(p) => { if (onInvite) onInvite([p], { r: room.r }); }} />
          </Sheet>
        )}
        {load.on && screen === 'play' && <div style={{ position: 'absolute', inset: 0, background: INK, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: DIM }}>{`Getting the hospital ready ${Math.round(load.f * 100)}%`}</div>}
        {load.err && (
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: GS.at.bottom(14), display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: '#FF8B80', background: 'rgba(8,9,12,0.85)', padding: '8px 14px', borderRadius: 8 }}>{load.err}</div>
          </div>
        )}
        {screen !== 'play' && (
          <button type="button" aria-label="Back" onClick={back} style={{ position: 'absolute', left: GS.at.left(10), top: GS.at.top(8), width: 40, height: 40, border: 'none', borderRadius: 20, background: 'rgba(233,228,218,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Ico k="left" size={20} color={BONE} /></button>
        )}
      </div>
      {leaveAsk && <Portal><ConfirmSheet title="Leave Hush?" text={inRoom ? 'Your team keeps going without you.' : 'Your round ends.'} confirmLabel="Leave" zIndex={120} onConfirm={leaveGame} onCancel={() => setLeaveAsk(false)} /></Portal>}
    </div>
  );
}

function InviteList({ friends, online, onSearch, onPick }) {
  const [q, setQ] = useState('');
  const [found, setFound] = useState(null);
  const [sent, setSent] = useState({});
  const on = new Set(online || []);
  useEffect(() => {
    if (!q.trim() || !onSearch) { setFound(null); return undefined; }
    let dead = false;
    const t = setTimeout(async () => { try { const r = await onSearch(q.trim()); if (!dead) setFound(r || []); } catch { if (!dead) setFound([]); } }, 350);
    return () => { dead = true; clearTimeout(t); };
  }, [q]);
  const list = found || [...(friends || [])].sort((a, b) => (on.has(b.id) ? 1 : 0) - (on.has(a.id) ? 1 : 0)).slice(0, 30);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {onSearch && <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by username" aria-label="Search by username" onPointerDown={(e) => e.stopPropagation()} style={{ height: 40, borderRadius: 10, border: '1px solid rgba(233,228,218,0.25)', background: 'rgba(233,228,218,0.06)', color: BONE, padding: '0 12px', fontSize: 16, fontFamily: FONT, outline: 'none' }} />}
      {list.length === 0 && <div style={{ fontSize: 13, color: DIM, fontWeight: 600 }}>{found ? 'No one found' : 'Your friends show up here'}</div>}
      {list.map((p) => (
        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar emoji={p.avatar} name={p.name} size={36} online={on.has(p.id)} />
          <div style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name || 'Friend'}</div>
          <button type="button" disabled={!!sent[p.id]} onClick={() => { setSent((s) => ({ ...s, [p.id]: 1 })); onPick(p); }} style={{ height: 34, padding: '0 14px', borderRadius: 8, border: 'none', background: sent[p.id] ? 'rgba(233,228,218,0.12)' : '#FFFFFF', color: sent[p.id] ? DIM : INK, fontWeight: 900, fontSize: 13, fontFamily: FONT, cursor: 'pointer' }}>{sent[p.id] ? 'Invited' : 'Invite'}</button>
        </div>
      ))}
    </div>
  );
}

export default HushGamePage;
