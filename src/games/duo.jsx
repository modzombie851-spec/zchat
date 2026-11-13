import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, Portal, useBackClose, hapticTap, FONT, Spinner } from '../App.jsx';
import { useGameLink, useRoomRelay, useWatchChannel } from './relay.jsx';
import { setWatchAllowed, useLiveBeacon, useGamePrivacy } from './live.js';
import { EMOTES, SignalBars, PingChip, SpeakerIcon, SmileIcon, Check, Heart, MicIcon, ChatIcon, SwapIcon, HandIcon, btnBase, Btn, RoundBtn, Sheet, Stars, injectCss, useVoice, setKitTap } from './livekit.jsx';
import { LIVES, GLYPHS, GLYPH_NAMES, STORY_N, ENDLESS, ATK_CD, levelDef, makeWorld, stepWorld, buddyInput, applyEvent, snapshot, mergeSnapshot, sameLevel, syncClock, setNet, nearDial, nearMirror, turnMirror, foeRows, setFoes, tryCode, hintFor, aimTarget, clamp, missionsFor, parTime, spikeAmt, crumbleState, demoInputs, demoDuoWorld } from './duoengine.js';
import { Snd, THEMES, buildStatic, buildMini, drawDuoMini, render, updateParts, dust, puffs, embers, glints, part, ring, glyph, drawExplorer , setDuoLite } from './duodraw.js';
import { GC, GBtn, GPill, GPanel, GChip, GTitle, GJoy, GIcon, GHudBtn, GHudPanel, GHudSkill, GHint, GStat, GNotices, useNotices, useWatchNotices, injectKitCss, kitTap, pressProps, INK, newBudget, budgetTick, useCtlLook, useGameStage, stagePoint, GControlsPanel, GLobby, GSlot, GLobbySheet, GVolBars, GSeg , GTalkers, GWatchBar, GSkin, GChatFeed, useChatFeed } from './gamekit.jsx';
import { Sfx } from './sfx.js';
import { useTalking } from './talk.js';

const dbud = newBudget();
const PHRASES = ['Wait for me', 'Go ahead', 'Over here', 'Hold the plate', 'Come closer, I need light', 'On three', 'Nice one', 'Sorry', 'I will get the lever', 'Follow me'];
const QUICK = ['Wait for me', 'Go ahead', 'Over here', 'Hold the plate', 'Nice one', 'Follow me'];
const BEST_KEY = (uid) => `zchat-duo-best-${uid || 'me'}`;
function readBest(uid) { try { return JSON.parse(localStorage.getItem(BEST_KEY(uid)) || '{}') || {}; } catch { return {}; } }
function saveBest(uid, key, r) {
  try {
    const all = readBest(uid);
    const old = all[key] || {};
    all[key] = { stars: Math.max(old.stars || 0, r.stars), time: old.time ? Math.min(old.time, r.time) : r.time, chest: !!(old.chest || r.chest), done: Math.max(old.done || 0, r.done || 0) };
    if (r.depth) all.endless = Math.max(all.endless || 0, r.depth);
    localStorage.setItem(BEST_KEY(uid), JSON.stringify(all));
  } catch {}
}
const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const tap = () => { try { hapticTap(); } catch {} Snd.init(); Snd.fx.click(); };
const isEndless = (li) => li >= ENDLESS;
const depthOf = (li) => li - ENDLESS + 1;
const levelTitle = (li, rs) => { const L = levelDef(li, rs); return `${isEndless(li) ? depthOf(li) : li + 1}. ${L.name}`; };
const newRunSeed = () => Math.random().toString(36).slice(2, 8);

function GlyphIcon({ k, size = 26, color = '#FFFFFF' }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const d = Math.min(2, window.devicePixelRatio || 1);
    c.width = size * d; c.height = size * d;
    const x = c.getContext('2d');
    x.setTransform(d, 0, 0, d, 0, 0);
    x.clearRect(0, 0, size, size);
    glyph(x, k, size / 2, size / 2, size * 0.9, color, size * 0.09);
  }, [k, size, color]);
  return <canvas ref={ref} aria-hidden="true" style={{ width: size, height: size, display: 'block' }} />;
}
function TorchHero({ kind, size = 64, dir = 'down' }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return undefined;
    const d = Math.min(2, window.devicePixelRatio || 1);
    c.width = size * d; c.height = size * d;
    const x = c.getContext('2d');
    let raf = 0;
    const t0 = performance.now();
    const draw = () => {
      const t = (performance.now() - t0) / 1000;
      x.setTransform(d, 0, 0, d, 0, 0);
      x.clearRect(0, 0, size, size);
      drawExplorer(x, size / 2, size * 0.92, size * 1.05, { kind, dir, phase: 0, moving: false, t, blink: (t % 3.2) > 3.05, alpha: 1 });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [kind, size, dir]);
  return <canvas ref={ref} aria-hidden="true" style={{ width: size, height: size, display: 'block', flexShrink: 0 }} />;
}
const THEME_BTN = { sand: 'gold', jungle: 'green', ice: 'teal', forge: 'orange', crystal: 'purple', tomb: 'teal', sky: 'blue' };
const DEMO_LOCAL = new Set(['sun', 'moon']);
const STORY_PAGE = 10;
const firstStory = (best) => { for (let i = 0; i < STORY_N; i++) if (!best[i] || !best[i].stars) return i; return STORY_N - 1; };
function GemIcon({ k, size = 16 }) {
  const c1 = k === 'sun' ? '#FFB020' : '#2F7BFF', c2 = k === 'sun' ? '#FFE08A' : '#A8CCFF';
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true"><path d="M3 7.5 6 3.5h8l3 4-7 9.5z" fill={c1} /><path d="M3 7.5 6 3.5l2.6 4zM8.6 7.5 6 3.5h5z" fill={c2} opacity="0.9" /><path d="M10 17 3 7.5h5.6z" fill="#FFFFFF" opacity="0.18" /></svg>
  );
}
function KeyIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><circle cx="7.5" cy="12" r="4" fill="none" stroke="#DCEBFF" strokeWidth="2.4" /><path d="M11.5 12h9M17.5 12v3M14.5 12v2.4" stroke="#DCEBFF" strokeWidth="2.4" strokeLinecap="round" /></svg>;
}



export function DuoGamePage({ solo = false, initial, me, peer, myId, onClose, onSaveState, onRematch, onPeerAway, watch = null }) {
  injectCss(); injectKitCss();
  setKitTap(tap);
  const gameId = watch ? watch.gameId : (initial && initial.id) || 'solo';
  const host = !watch && (solo || !initial || initial.x === myId);
  const myKind = host || watch ? 'sun' : 'moon';
  const theirKind = myKind === 'sun' ? 'moon' : 'sun';
  const peerFirst = solo ? 'Partner' : watch ? String((watch.names && watch.names.moon) || 'Friend').split(' ')[0] : String((peer && peer.name) || 'Friend').split(' ')[0];
  const hostFirst = watch ? String((watch.names && watch.names.sun) || 'Friend').split(' ')[0] : '';
  const relay0 = useGameLink({ id: solo || watch ? null : `duo-${gameId}`, myId, peerId: peer && peer.id, enabled: !solo && !watch, g: 'duo', fast: ['p', 'fo'] });
  const wrelay = useRoomRelay({ id: watch ? `duo-${gameId}` : null, myId, enabled: !!watch, passive: true });
  const relay = watch ? wrelay : relay0;
  const here = solo ? true : relay.here;
  const voice = useVoice(solo || watch ? null : relay, !solo && !watch, host && !solo);
  const talking = useTalking(!solo && !watch, { peer: voice.peerMuted });
  const gamePriv = useGamePrivacy();
  const allowWatch = gamePriv.show && gamePriv.watch;
  const setAllowWatch = () => {};
  const myFirstName = String((me && me.name) || 'You').split(' ')[0];
  const watchers = useWatchChannel({ room: solo ? null : `duo-${gameId}`, myId, enabled: !solo, role: watch ? 'watcher' : 'player', meta: { n: myFirstName, a: me && me.avatar }, allow: allowWatch, onDenied: () => { setToast({ text: 'The players turned off watching.', at: Date.now() }); setTimeout(() => onClose(), 1600); } });
  useWatchNotices(watchers, (t, kd) => pushNoteRef.current(t, kd), !solo && !watch);
  useEffect(() => { if (relay0.watch) relay0.watch(watchers.length > 0); }, [watchers.length]);
  useLiveBeacon({ game: 'duo', room: `duo-${gameId}`, info: { g: gameId, h: initial && initial.x, o: initial && initial.o }, active: !solo && !watch && !!initial, allow: allowWatch });
  const [phase, setPhase] = useState(solo ? 'pick' : 'lobby');
  const [li, setLi] = useState(0);
  const [rs, setRs] = useState(null);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  pausedRef.current = paused;
  const [hud, setHud] = useState({ lives: LIVES, gems: { sun: [0, 0], moon: [0, 0] }, key: null, chest: false });
  const [toast, setToast] = useState(null);
  const [notes, pushNote] = useNotices();
  const pushNoteRef = useRef(pushNote);
  pushNoteRef.current = pushNote;
  const [sheet, setSheet] = useState(null);
  const [active, setActive] = useState(myKind);
  const [result, setResult] = useState(null);
  const [best, setBest] = useState(() => readBest(myId));
  const [nearUse, setNearUse] = useState(null);
  const [atkCd, setAtkCd] = useState(0);
  const atkReq = useRef(0);
  const foeSend = useRef(0);
  const [chatText, setChatText] = useState('');
  const [feed, pushFeed] = useChatFeed();
  const [log, setLog] = useState([]);
  const [leaveAsk, setLeaveAsk] = useState(false);
  const [cleared, setCleared] = useState(0);
  const [intro, setIntro] = useState(null);
  const [quick, setQuick] = useState(false);
  const [net, setNetView] = useState({ ping: null, weak: false, lost: false });
  const [mode, setMode] = useState(() => (firstStory(readBest(myId)) > 0 ? 'endless' : 'story'));
  const [storySel, setStorySel] = useState(() => firstStory(readBest(myId)));
  const [storySheet, setStorySheet] = useState(false);
  const [storyPage, setStoryPage] = useState(0);
  const demoRef = useRef(null);
  const demoKey = useRef('e');
  demoKey.current = mode === 'endless' ? 'e' : `s:${storySel}`;
  if (typeof window !== 'undefined' && window.__zfake) window.__zduo = { world: () => WR.current, net: () => netRef.current };
  const cvRef = useRef(null);
  const wrapRef = useRef(null);
  const WR = useRef(null);
  const statRef = useRef({ cv: null, s: 0, li: -1, a: -1, rs: null });
  const cam = useRef({ x: 7, y: 20, init: false });
  const joy = useRef({ x: 0, y: 0, id: null, cx: 0, cy: 0, show: false });
  const keys = useRef(new Set());
  const bubbles = useRef({ sun: null, moon: null });
  const hintsSeen = useRef(new Set());
  const hintT = useRef(0);
  const lastSend = useRef({ at: 0, x: 0, y: 0, m: false });
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const activeRef = useRef(active);
  activeRef.current = active;
  const swapAt = useRef(0);
  const buddyMem = useRef({ sun: {}, moon: {} });
  const rsRef = useRef(rs);
  rsRef.current = rs;
  const [joyView, setJoyView] = useState(null);
  const look = useCtlLook('duo');
  const GS = useGameStage(look);
  const side = GS.side, land = GS.land;
  const sideRef = useRef(side); sideRef.current = side;
  const miniRef = useRef(null);
  const miniBase = useRef({ W: null, cv: null });
  const hudRefs = useRef({});
  const keepRef = useRef({ at: 0, list: [] });
  const hudRef = (k) => (el) => { hudRefs.current[k] = el; };
  const lookNow = useRef(look); lookNow.current = look;
  const joyR = Math.round((land ? 46 : 50) * Math.max(0.7, look.size));
  const joyRRef = useRef(joyR); joyRRef.current = joyR;
  const [ctl, setCtl] = useState(false);
  const knobRef = useRef(null);
  const toastTimer = useRef(0);
  const hudKey = useRef('');
  const solved = useRef(false);
  const outRef = useRef(false);
  const netRef = useRef({ pings: [], ping: null, n: 0, last: 0, view: '' });
  const sfxRef = useRef({ spikes: [0, 0], crumble: {}, tick: 0 });

  const say = (text, sec) => {
    setToast({ text, at: Date.now(), life: sec || 3 });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), (sec || 3) * 1000);
  };
  const bubble = (kind, text, emo) => { bubbles.current[kind] = emo ? { text, t: 0, life: 1.7, emo: true } : { text, t: 0, life: Math.max(3.4, text.length * 0.075) }; };
  const heard = () => { netRef.current.last = Date.now(); };

  const startLevel = (i, attempt, quiet, runSeed) => {
    const a = attempt == null ? Date.now() % 100000 : attempt;
    const seed = isEndless(i) ? (runSeed || rsRef.current || newRunSeed()) : null;
    const W = makeWorld(i, gameId, a, seed);
    WR.current = W;
    statRef.current = { cv: null, s: 0, li: -1, a: -1, rs: null };
    cam.current.init = false;
    sfxRef.current = { spikes: [0, 0], crumble: {}, tick: 0 };
    setLi(i);
    setRs(seed);
    rsRef.current = seed;
    setResult(null);
    setSheet(null);
    setQuick(false);
    setActive(myKind);
    hintsSeen.current = new Set();
    solved.current = false;
    outRef.current = false;
    setPhase('play');
    Snd.init();
    Sfx.init();
    Snd.music(true, W.theme);
    if (!solo && host && !quiet) relay.send('lv', { li: i, a, rs: seed });
    const ms = missionsFor(W);
    setIntro({ key: `${i}:${a}`, title: levelTitle(i, seed), place: (THEMES[W.theme] || THEMES.sand).name, goal: W.L.goal, missions: ms, endless: isEndless(i) });
    setTimeout(() => setIntro((v) => (v && v.key === `${i}:${a}` ? null : v)), 3600);
    if (!solo && host && onSaveState && initial && initial.st !== 'live') onSaveState({ ...initial, st: 'live', exp: null });
  };

  useEffect(() => {
    if (solo) return undefined;
    const offs = [
      relay.on('lv', (m) => { heard(); if (watch && m.from !== watch.host) return; if (!host) startLevel(m.li, m.a, true, m.rs); }),
      relay.on('pick', (m) => { heard(); if (watch && m.from !== watch.host) return; if (!host) { WR.current = null; setPhase((p) => (p === 'lobby' || p === 'won' || p === 'out' || p === 'play' ? 'pick' : p)); } }),
      relay.on('ev', (m) => { heard(); const W = WR.current; if (W && m.li === W.li && m.a === W.attempt && (m.rs || null) === (W.rs || null)) applyEvent(W, m.e, true); }),
      relay.on('fo', (m) => { heard(); const W = WR.current; if (!host && W && m.li === W.li && m.a === W.attempt) { if (typeof m.at === 'number') { if (m.at <= (W.foAt || 0)) return; W.foAt = m.at; } setFoes(W, m.f); } }),
      relay.on('p', (m) => { heard(); const W = WR.current; if (W && m.li === W.li && m.a === W.attempt && (watch ? (m.k === 'sun' || m.k === 'moon') : m.k === theirKind)) setNet(W, m.k, m); }),
      relay.on('sync', (m) => {
        heard();
        if (watch && m.from !== watch.host) return;
        const W = WR.current;
        if (host) { if (W && sameLevel(W, m.s)) mergeSnapshot(W, m.s, false); return; }
        if (!W || !sameLevel(W, m.s)) {
          if (m.play) { startLevel(m.s.li, m.s.a, true, m.s.rs); mergeSnapshot(WR.current, m.s, true); syncClock(WR.current, m.s.tc, netRef.current.ping); }
          else if (phaseRef.current === 'lobby') setPhase('pick');
          return;
        }
        mergeSnapshot(W, m.s, true);
        syncClock(W, m.s.tc, netRef.current.ping);
      }),
      relay.on('pi', (m) => { heard(); relay.send('po', { n: m.n, t0: m.t0 }); }),
      relay.on('po', (m) => {
        heard();
        const N = netRef.current;
        const rtt = Date.now() - (m.t0 || 0);
        if (rtt < 0 || rtt > 20000) return;
        N.pings = [...N.pings.slice(-4), rtt];
        const sorted = [...N.pings].sort((a, b) => a - b);
        N.ping = Math.max(1, Math.round(sorted[Math.floor(sorted.length / 2)]));
      }),
      relay.on('chat', (m) => { heard(); const text = String(m.text || '').slice(0, 90); if (!text) return; const kk = watch ? (m.from === watch.host ? 'sun' : 'moon') : theirKind; bubble(kk, text); pushFeed(watch && kk === 'sun' ? hostFirst : peerFirst, text, kk === 'sun' ? '#FFB066' : '#8CC8FF'); setLog((l) => [...l.slice(-30), { who: peerFirst, text }]); Snd.fx.pop(); }),
      relay.on('emo', (m) => { heard(); const e = String(m.e || ''); if (!EMOTES.includes(e)) return; const kk = watch ? (m.from === watch.host ? 'sun' : 'moon') : theirKind; bubble(kk, e, true); pushFeed(watch && kk === 'sun' ? hostFirst : peerFirst, e, kk === 'sun' ? '#FFB066' : '#8CC8FF'); Snd.fx.emote(); }),
      relay.on('hi', () => { heard(); if (host) sendSync(); }),
      relay.on('hey', heard),
      relay.on('psel', (m) => { heard(); if (host) return; if (watch && m.from !== watch.host) return; if (m.m === 'endless' || m.m === 'story') setMode(m.m); const i = Number(m.i); if (i >= 0 && i < STORY_N) setStorySel(i); }),
      relay.on('back', heard),
      relay.on('bye', () => { pushNote(`${peerFirst} left the game`, 'leave', 4.2); }),
    ];
    return () => offs.forEach((f) => f && f());
  }, [relay.on, host]);

  const sendSync = () => {
    const W = WR.current;
    if (solo) return;
    if (!host) { if (W && phaseRef.current === 'play') relay.send('sync', { s: snapshot(W), play: true }); return; }
    if (W) relay.send('sync', { s: snapshot(W), play: phaseRef.current === 'play' || phaseRef.current === 'won' || phaseRef.current === 'out' });
    else relay.send('pick', {});
  };
  useEffect(() => {
    if (solo) return undefined;
    const iv = setInterval(sendSync, 2500);
    const pv = setInterval(() => {
      const N = netRef.current;
      N.n += 1;
      relay.send('pi', { n: N.n, t0: Date.now() });
      const quiet = N.last ? Date.now() - N.last : 0;
      const live = relay.here !== false;
      const weak = live && N.last > 0 && quiet > 3200;
      const lost = live && N.last > 0 && quiet > 9000;
      const v = `${N.ping}|${weak}|${lost}`;
      if (v !== N.view) { N.view = v; setNetView({ ping: N.ping, weak, lost }); }
    }, 1500);
    return () => { clearInterval(iv); clearInterval(pv); };
  }, [solo, host, relay.here]);
  useEffect(() => {
    if (solo) return;
    if (here && phase === 'lobby') { setPhase('pick'); if (host) relay.send('pick', {}); }
  }, [here, phase]);
  useEffect(() => {
    if (solo || phase !== 'lobby' || here || !onPeerAway) return undefined;
    const t = setTimeout(() => { if (phaseRef.current === 'lobby') onPeerAway(initial); }, 2500);
    return () => clearTimeout(t);
  }, [phase, here]);

  const leave = () => {
    if (phase === 'play' && !solo && !watch) { setLeaveAsk(true); return; }
    finish();
  };
  const finish = () => {
    if (!solo && !watch) {
      relay.send('bye', {});
      if (host && onSaveState && initial) onSaveState({ ...initial, st: cleared > 0 ? 'done' : 'gone', sx: cleared, so: cleared, w: null });
    }
    Snd.music(false);
    onClose();
  };
  useBackClose(true, () => { if (ctl) setCtl(false); else if (storySheet) setStorySheet(false); else if (quick) setQuick(false); else if (sheet) setSheet(null); else if (leaveAsk) setLeaveAsk(false); else leave(); });

  useEffect(() => {
    const kd = (e) => {
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k)) {
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
        keys.current.add(k); e.preventDefault();
      }
      if (k === 'e' || k === ' ') { if (e.target && e.target.tagName === 'INPUT') return; useAction(); }
      if (k === 'f' || k === 'j' || k === 'q') { if (e.target && e.target.tagName === 'INPUT') return; atkReq.current = Date.now(); }
    };
    const ku = (e) => keys.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, []);

  const useAction = () => {
    const W = WR.current;
    if (!W || phaseRef.current !== 'play') return;
    const p = W.p[activeRef.current];
    if (nearMirror(W, p)) { turnMirror(W, p); return; }
    if (nearDial(W, p)) setSheet({ k: 'dial', picks: [] });
  };

  const levelSfx = (W, myP) => {
    const S = sfxRef.current;
    const near = (x, y, r) => Math.abs(myP.x - x - 0.5) < r && Math.abs(myP.y - y - 0.5) < r;
    if (W.spikes.length) {
      [0, 0.5].forEach((off, i) => {
        const up = spikeAmt(W, off) > 0 ? 1 : 0;
        if (up && !S.spikes[i] && W.spikes.some(([x, y, o]) => o === off && near(x, y, 4.5))) Snd.fx.spike();
        S.spikes[i] = up;
      });
    }
    for (const key in W.crumble) {
      const c = W.crumble[key];
      const st = crumbleState(W, c.x, c.y).s;
      if (st === 2 && S.crumble[key] !== 2 && near(c.x, c.y, 5)) { Snd.fx.crumble(); puffs(W, c.x, c.y + 0.3, 1, 6, 'rgba(160,140,120,0.35)'); }
      S.crumble[key] = st;
    }
    if (W.tplates.length && W.t < W.tdoorUntil) { if (W.t - S.tick > 0.5) { S.tick = W.t; Snd.fx.tick(); } }
    const onIce = myP.ice && myP.moving;
    if (onIce && Math.random() < 0.04) Snd.fx.slide();
  };

  const drawDemo = (cv, dt) => {
    const want = demoKey.current;
    let D = demoRef.current;
    const make = () => {
      const isE = want === 'e';
      const W0 = demoDuoWorld(isE ? ENDLESS : Number(want.slice(2)), isE ? newRunSeed() : null);
      D = { key: want, W: W0, mem: {}, t: 0, fade: 1, fin: false, stat: null, cam: { x: 0, y: 0, init: false }, last: D ? D.last : 0 };
      demoRef.current = D;
    };
    if (!D) make();
    if (D.key !== want) D.fin = true;
    const W = D.W;
    if (dt > 0) {
      D.t += dt;
      const inputs = demoInputs(W, D.mem, dt);
      stepWorld(W, dt, { local: DEMO_LOCAL, host: true, playing: true, inputs });
      W.fx.length = 0; W.outbox.length = 0;
      updateParts(W, dt, { x: W.p.sun.x, y: W.p.sun.y });
      if (W.out || W.won || D.t > 42) D.fin = true;
      D.fade = clamp(D.fade + (D.fin ? dt / 0.4 : -dt / 0.6), 0, 1);
      if (D.fin && D.fade >= 1) { make(); return; }
    }
    const wrap = wrapRef.current;
    const cw = wrap ? wrap.clientWidth : window.innerWidth, ch = wrap ? wrap.clientHeight : window.innerHeight;
    const dpr = budgetTick(dbud, dt);
    setDuoLite(dbud.lv >= 1);
    if (cv.width !== Math.round(cw * dpr) || cv.height !== Math.round(ch * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); }
    const s = Math.round(cw > ch ? clamp(ch / 9.5, 36, 66) : clamp(cw / 7.4, 44, 66));
    if (!D.stat || D.stat.s !== s || D.stat.d !== dpr) D.stat = { cv: buildStatic(W, s * dpr), s, d: dpr };
    const A = W.p.sun, B = W.p.moon;
    const C = D.cam;
    const tx = (A.x + B.x) / 2, ty = (A.y + B.y) / 2 - 0.6;
    if (!C.init) { C.x = tx; C.y = ty; C.init = true; }
    const kk = 1 - Math.exp(-dt * 2.4);
    C.x += (tx - C.x) * kk; C.y += (ty - C.y) * kk;
    const halfW = cw / s / 2, halfH = ch / s / 2;
    const cx = W.MW <= halfW * 2 ? W.MW / 2 : clamp(C.x, halfW - 0.4, W.MW - halfW + 0.4);
    const cy = W.MH <= halfH * 2 ? W.MH / 2 : clamp(C.y, halfH - 1.4, W.MH - halfH + 1.2);
    const ox = Math.round(cw / 2 - cx * s), oy = Math.round(ch * (cw > ch ? 0.44 : 0.36) - cy * s);
    const ctx = cv.getContext('2d');
    render(ctx, W, { cw, ch, dpr, s, ox, oy, me: A, names: {}, bubbles: {}, stat: D.stat.cv, them: null, safeTop: 30, safeBottom: 30, keep: [] });
    if (D.fade > 0.001) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(11,9,16,${D.fade.toFixed(3)})`; ctx.fillRect(0, 0, cv.width, cv.height); }
  };

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (ts) => {
      raf = requestAnimationFrame(loop);
      const dt = pausedRef.current ? 0 : Math.min(0.05, Math.max(0, (ts - last) / 1000));
      last = ts;
      const W = WR.current;
      const cv = cvRef.current;
      Snd.st.sfx = Sfx.sfxOn;
      { const wantMus = !!W && Sfx.musicOn && phaseRef.current === 'play'; if (!!Snd.st.music !== wantMus) Snd.music(wantMus, W ? W.theme : undefined); }
      if (!W && cv && (phaseRef.current === 'pick' || phaseRef.current === 'lobby')) { drawDemo(cv, Math.min(0.05, Math.max(0, (ts - (demoRef.current ? demoRef.current.last : ts)) / 1000))); if (demoRef.current) demoRef.current.last = ts; return; }
      if (!W || !cv) return;
      const wrap = wrapRef.current;
      const cw = wrap ? wrap.clientWidth : window.innerWidth, ch = wrap ? wrap.clientHeight : window.innerHeight;
      const dpr = budgetTick(dbud, dt);
      setDuoLite(dbud.lv >= 1);
      if (cv.width !== Math.round(cw * dpr) || cv.height !== Math.round(ch * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); }
      const s = Math.round(cw > ch ? clamp(ch / 9.5, 36, 66) : clamp(cw / 7.4, 44, 66));
      const st = statRef.current;
      if (!st.cv || st.s !== s || st.d !== dpr || st.li !== W.li || st.a !== W.attempt || st.rs !== W.rs) statRef.current = { cv: buildStatic(W, s * dpr), s, d: dpr, li: W.li, a: W.attempt, rs: W.rs };
      const playing = phaseRef.current === 'play';
      const act = activeRef.current;
      let ix = joy.current.x, iy = joy.current.y;
      const K = keys.current;
      const kx = (K.has('arrowright') || K.has('d') ? 1 : 0) - (K.has('arrowleft') || K.has('a') ? 1 : 0);
      const ky = (K.has('arrowdown') || K.has('s') ? 1 : 0) - (K.has('arrowup') || K.has('w') ? 1 : 0);
      if (kx || ky) { const l = Math.hypot(kx, ky); ix = kx / l; iy = ky / l; }
      const il = Math.hypot(ix, iy);
      if (il > 1) { ix /= il; iy /= il; }
      if (sheetOpen.current) { ix = 0; iy = 0; }
      const local = solo ? new Set(['sun', 'moon']) : watch ? new Set() : new Set([myKind]);
      const inputs = { sun: { x: 0, y: 0 }, moon: { x: 0, y: 0 } };
      inputs[act] = { x: ix, y: iy, atk: playing && Date.now() - atkReq.current < 320, aim: Math.hypot(ix, iy) > 0.3 ? { x: ix, y: iy } : null };
      const shotsBefore = W.p[act].shots;
      if (solo && playing) {
        const oth = act === 'sun' ? 'moon' : 'sun';
        if (Date.now() - swapAt.current > 450) inputs[oth] = buddyInput(W, W.p[oth], W.p[act], buddyMem.current[oth], dt);
        else buddyMem.current[oth] = {};
      }
      stepWorld(W, dt, { local, host, playing, inputs });
      const myP = W.p[act];
      if (myP.shots !== shotsBefore) atkReq.current = 0;
      updateParts(W, dt, { x: myP.x, y: myP.y });
      for (const k of ['sun', 'moon']) { const b = bubbles.current[k]; if (b) { b.t += dt; if (b.t > b.life) bubbles.current[k] = null; } }
      if (myP.step) { myP.step = false; Snd.fx.step(); if (Math.random() < 0.5) dust(W, myP.x, myP.y, 1); }
      const other = W.p[act === 'sun' ? 'moon' : 'sun'];
      if (other.step) other.step = false;
      while (W.fx.length) handleFx(W, W.fx.shift());
      if (playing) levelSfx(W, myP);
      if (!solo) {
        while (W.outbox.length) relay.send('ev', { e: W.outbox.shift(), li: W.li, a: W.attempt, rs: W.rs });
        if (host && W.foes.length && playing && Date.now() - foeSend.current > 120) { foeSend.current = Date.now(); relay.send('fo', { li: W.li, a: W.attempt, f: foeRows(W) }); }
        const P = W.p[myKind];
        const now = Date.now();
        const moved = Math.hypot(P.x - lastSend.current.x, P.y - lastSend.current.y) > 0.02;
        if ((moved && now - lastSend.current.at > 70) || now - lastSend.current.at > 500 || P.moving !== lastSend.current.m) {
          relay.send('p', { k: myKind, x: +P.x.toFixed(3), y: +P.y.toFixed(3), vx: +P.vx.toFixed(2), vy: +P.vy.toFixed(2), d: P.dir, m: P.moving ? 1 : 0, dd: P.dead > 0 ? 1 : 0, why: P.die, tp: P.tp, li: W.li, a: W.attempt });
          lastSend.current = { at: now, x: P.x, y: P.y, m: P.moving };
        }
      } else W.outbox.length = 0;
      if (playing) {
        hintT.current -= dt;
        if (hintT.current <= 0) {
          const h = hintFor(W, myP);
          if (h && !hintsSeen.current.has(h[0])) { hintsSeen.current.add(h[0]); say(h[1], 4); hintT.current = 3; }
        }
        const nu = nearMirror(W, myP) ? 'mirror' : nearDial(W, myP) ? 'dial' : null;
        if (nu !== nearRef.current) { nearRef.current = nu; setNearUse(nu); }
        const cdv = myP.atkCd > 0.05 ? Math.ceil(myP.atkCd * 10) : 0;
        if (cdv !== atkRef.current) { atkRef.current = cdv; setAtkCd(myP.atkCd > 0.05 ? myP.atkCd : 0); }
      }
      const C = cam.current;
      const tx = myP.x, ty = myP.y - 0.8;
      if (!C.init) { C.x = tx; C.y = ty; C.init = true; }
      const kk = 1 - Math.exp(-dt * 5);
      C.x += (tx - C.x) * kk; C.y += (ty - C.y) * kk;
      const halfW = cw / s / 2, halfH = ch / s / 2;
      const cx = W.MW <= halfW * 2 ? W.MW / 2 : clamp(C.x, halfW - 0.4, W.MW - halfW + 0.4);
      const cy = W.MH <= halfH * 2 ? W.MH / 2 : clamp(C.y, halfH - 1.4, W.MH - halfH + 1.2);
      let sx = 0, sy = 0;
      if (W.shake > 0) { sx = (Math.random() - 0.5) * 6 * W.shake; sy = (Math.random() - 0.5) * 6 * W.shake; }
      const ox = Math.round(cw / 2 - cx * s + sx), oy = Math.round(ch / 2 - cy * s + sy);
      const names = { sun: act === 'sun' || (!solo && myKind === 'sun') ? 'You' : solo ? 'Orange' : peerFirst, moon: act === 'moon' || (!solo && myKind === 'moon') ? 'You' : solo ? 'Blue' : peerFirst };
      if (solo) { names.sun = act === 'sun' ? 'You' : 'Orange'; names.moon = act === 'moon' ? 'You' : 'Blue'; }
      if (watch) { names.sun = hostFirst; names.moon = peerFirst; }
      const ctx = cv.getContext('2d');
      const KR = keepRef.current;
      if (ts - KR.at > 400) {
        KR.at = ts; KR.list = [];
        const R = hudRefs.current;
        for (const k of ['tl', 'tc', 'tr', 'sc']) { const el = R[k]; if (el && el.isConnected && el.offsetWidth) KR.list.push([el.offsetLeft, el.offsetTop, el.offsetLeft + el.offsetWidth, el.offsetTop + el.offsetHeight]); }
        const sk = R.sk;
        if (sk && sk.isConnected && sk.offsetWidth) { const q = lookNow.current.size || 1; const x1 = sk.offsetLeft + sk.offsetWidth, y1 = sk.offsetTop + sk.offsetHeight; KR.list.push([x1 - sk.offsetWidth * q * 0.8, y1 - sk.offsetHeight * q * 0.8, x1, y1]); }
        if (!watch && playing) { const jr = joyRRef.current + 12, jx = cw > ch ? 112 : 92, jy = ch - (cw > ch ? 96 : 120); KR.list.push([jx - jr, jy - jr, jx + jr, jy + jr]); }
      }
      const aimF = !watch && playing && myP && myP.dead <= 0 && W.foes.length ? aimTarget(W, myP, myP.ax, myP.ay) : null;
      render(ctx, W, { cw, ch, dpr, s, ox, oy, me: myP, names, bubbles: bubbles.current, stat: statRef.current.cv, them: act === 'sun' ? 'moon' : 'sun', safeTop: 30, safeBottom: 30, keep: KR.list, aim: aimF, aimCol: myP && myP.kind === 'sun' ? '#FFB347' : '#8CC8FF' });
      const mc = miniRef.current;
      if (mc && mc.isConnected) {
        const MB = miniBase.current;
        if (MB.W !== W) { MB.W = W; MB.cv = buildMini(W); }
        const mw = mc.clientWidth, mh = mc.clientHeight;
        if (mw && mh) {
          if (mc.width !== mw * dpr || mc.height !== mh * dpr) { mc.width = mw * dpr; mc.height = mh * dpr; }
          const x2 = mc.getContext('2d'); x2.setTransform(dpr, 0, 0, dpr, 0, 0);
          drawDuoMini(x2, W, MB.cv, mw, mh, act, { x: cx, y: cy, hw: halfW, hh: halfH });
        }
      }
      const hk = `${W.lives}|${W.gems.map((g) => (g.taken ? 1 : 0)).join('')}|${W.key ? W.key.held || (W.key.used ? 'u' : '') : ''}|${W.chest && W.chest.done ? 1 : 0}`;
      if (hk !== hudKey.current) {
        hudKey.current = hk;
        const cnt = (k) => [W.gems.filter((g) => g.k === k && g.taken).length, W.gems.filter((g) => g.k === k).length];
        setHud({ lives: W.lives, gems: { sun: cnt('sun'), moon: cnt('moon') }, key: W.key && !W.key.used ? W.key.held : null, chest: !!(W.chest && W.chest.done), hasChest: !!W.chest });
      }
      if (W.won && phaseRef.current === 'play' && W.t - W.winAt > 0.6) onWin(W);
      if (W.out && phaseRef.current === 'play' && !outRef.current) { outRef.current = true; setTimeout(() => { if (WR.current === W) setPhase('out'); }, 1200); }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [solo, host]);
  const nearRef = useRef(null);
  const atkRef = useRef(0);
  const sheetOpen = useRef(false);
  sheetOpen.current = !!sheet || leaveAsk || ctl;

  const handleFx = (W, f) => {
    const mineK = activeRef.current;
    switch (f.k) {
      case 'lever': Snd.fx.lever(); puffs(W, f.x, f.y + 0.4, 1, 3); if (f.who === mineK) say(Object.values(W.levers).filter((l) => !l.on).length ? 'Lever pulled. The gate needs every lever of its colour.' : 'Lever pulled.'); break;
      case 'gate': setTimeout(() => Snd.fx.gate(), 250); say('The gate opens.'); break;
      case 'gem': Snd.fx.gem(); glints(W, f.x + 0.5, f.y + 0.35, f.kk === 'sun' ? '#FFD27A' : '#9FD0FF'); break;
      case 'burn': Snd.fx.burn(); break;
      case 'wood': Snd.fx.burn(); break;
      case 'wooddone': { const g = W.woods && W.woods[f.g]; if (g) for (const [wx, wy] of g.tiles) puffs(W, wx, wy + 0.2, 1, 5, 'rgba(90,80,70,0.45)'); say('The wooden gate burned down.', 2.2); break; }
      case 'vinesdone': { const [vx, vy] = W.vines.tiles[0] || [0, 0]; puffs(W, vx, vy + 0.2, 1, 8, 'rgba(90,90,90,0.4)'); say('A secret room behind the vines.'); break; }
      case 'key': Snd.fx.key(); if (W.key) glints(W, W.key.x, W.key.y - 0.3, '#CFE3FF'); say(f.who === mineK ? 'You found a secret key. Find the chest it opens.' : 'Your partner found a secret key.'); break;
      case 'chest': Snd.fx.chest(); if (W.chest) for (let i = 0; i < 26; i++) part(W, W.chest.x + 0.5 + (Math.random() - 0.5) * 0.6, W.chest.y + 0.2, (Math.random() - 0.5) * 2.4, -1.2 - Math.random() * 1.8, 1.1, i % 2 ? '#FFE08A' : '#BFE0FF', 0.05, 'ember'); say('The secret chest is open!'); break;
      case 'code': Snd.fx.door(); say('The code door slides open.'); break;
      case 'fire': Snd.fx.fire(); if (W.braz && W.braz[f.b]) { const z = W.braz[f.b]; embers(W, z.x + 0.5, z.y + 0.15, f.b === 'F' ? '#FFB347' : '#8CC8FF', 18); } if (!W.great.open) say('Fire lit. Light the other one before this one burns out.', 3); break;
      case 'fizz': Snd.fx.fizz(); break;
      case 'great': setTimeout(() => Snd.fx.door(), 250); say('Both fires are lit. The great door opens.'); break;
      case 'crack': { const P = W.p[mineK]; if (Math.hypot(P.x - f.x - 0.5, P.y - f.y - 0.5) < 5) Snd.fx.crack(); break; }
      case 'tp': { Snd.fx.tp(); const col = '#B8F2FF'; ring(W, f.x0, f.y0 - 0.1, col); ring(W, f.x1, f.y1 - 0.1, col); glints(W, f.x1, f.y1 - 0.4, col, 10); break; }
      case 'tplate': Snd.fx.clock(); if (f.who === mineK) say('The timed door is open. Hurry!', 2.4); break;
      case 'shot': { const P = W.p[mineK]; const nearby = Math.hypot(P.x - f.x, P.y - f.y) < 7; if (nearby) Sfx.play(f.who === 'sun' ? 'fireball' : 'frost', { vol: f.who === mineK ? 0.75 : 0.45 }); break; }
      case 'shotend': { const col = f.sk === 'fire' ? '#FFB347' : '#BFE6FF'; for (let i = 0; i < 8; i++) part(W, f.x, f.y - 0.42, (Math.random() - 0.5) * 2.4, (Math.random() - 0.5) * 2.4 - 0.4, 0.45, col, 0.04, 'ember'); break; }
      case 'foehit': Sfx.play('hit', { vol: 0.7 }); for (let i = 0; i < 10; i++) part(W, f.x, f.y - 0.45, (Math.random() - 0.5) * 2.6, -0.5 - Math.random() * 1.5, 0.5, '#FFB347', 0.045, 'ember'); W.shake = Math.max(W.shake, 0.12); break;
      case 'freeze': Sfx.play('frost', { vol: 0.6, rate: 0.8 }); glints(W, f.x, f.y - 0.45, '#CFF0FF', 10); break;
      case 'thaw': puffs(W, f.x - 0.3, f.y - 0.5, 0.6, 5, 'rgba(220,245,255,0.4)'); break;
      case 'foedie': {
        Sfx.play(f.ice ? 'break' : 'poof', { vol: 0.85 });
        const col = f.ice ? '#DFF4FF' : f.kk === 'slime' ? '#7FE04A' : f.kk === 'bat' ? '#8A62B0' : f.kk === 'spider' ? '#6B4A86' : f.kk === 'ghost' ? '#E8EEFF' : '#ECE4D2';
        for (let i = 0; i < 22; i++) part(W, f.x + (Math.random() - 0.5) * 0.3, f.y - 0.45, (Math.random() - 0.5) * 3.4, -0.6 - Math.random() * 2.2, 0.8, i % 3 ? col : '#FFFFFF', 0.05, 'ember');
        puffs(W, f.x - 0.3, f.y - 0.6, 0.6, 6, 'rgba(255,255,255,0.35)');
        W.shake = Math.max(W.shake, 0.2);
        if (W.foes.every((q) => q.dead > 0)) say('All enemies are gone.', 2.2);
        break;
      }
      case 'swoop': { const P = W.p[mineK]; if (Math.hypot(P.x - f.x, P.y - f.y) < 6) Sfx.play('bat', { vol: 0.5 }); break; }
      case 'hop': { const P = W.p[mineK]; if (Math.hypot(P.x - f.x, P.y - f.y) < 5) Sfx.play('bump', { vol: 0.35, rate: 1.3 }); break; }
      case 'rattle': { const P = W.p[mineK]; if (Math.hypot(P.x - f.x, P.y - f.y) < 6) Sfx.play('rattle', { vol: 0.6 }); break; }
      case 'mirror': Sfx.play('lever', { vol: 0.7, rate: 1.2 }); puffs(W, f.x, f.y + 0.3, 1, 3); break;
      case 'beam': Sfx.play('door', { vol: 0.8 }); setTimeout(() => Snd.fx.gate(), 200); say('The light reached the crystal. The crystal door opens.'); W.shake = 0.3; break;
      case 'die': {
        if (f.why === 'foe') Sfx.play('pdie', { vol: 0.9 }); else ({ lava: Snd.fx.sizzle, water: Snd.fx.splash, goo: Snd.fx.goo, fall: Snd.fx.fall, spike: Snd.fx.stab }[f.why] || Snd.fx.hurt)();
        W.shake = Math.max(W.shake, 0.35);
        for (let i = 0; i < 14; i++) part(W, f.x + (Math.random() - 0.5) * 0.3, f.y - 0.6, (Math.random() - 0.5) * 3, -0.8 - Math.random() * 2, 0.9, f.who === 'sun' ? '#FFB347' : '#8CC0FF', 0.05, 'ember');
        setTimeout(() => Snd.fx.heart(), 250);
        const col = f.why === 'lava' ? '#FFB347' : f.why === 'water' ? 'rgba(235,245,255,0.8)' : f.why === 'goo' ? '#8BE04E' : f.why === 'spike' ? '#E3E8EE' : 'rgba(255,255,255,0.4)';
        for (let i = 0; i < 16; i++) part(W, f.x + (Math.random() - 0.5) * 0.4, f.y - 0.35, (Math.random() - 0.5) * 1.8, -0.4 - Math.random() * 1.6, 0.8, col, f.why === 'water' ? 0.09 : 0.045, f.why === 'water' ? 'puff' : 'ember');
        if (f.who === mineK) { try { hapticTap(); } catch {} }
        if (!W.out) say(W.lives === 1 ? 'One heart left. Go slow.' : f.who === mineK ? 'Ouch. Back to the last flag.' : `${solo ? 'Your partner' : peerFirst} fell. Back to the flag.`, 2.6);
        break;
      }
      case 'flag': if (f.who === mineK) { Snd.fx.flag(); Sfx.play('cp', { vol: 0.8 }); say('Checkpoint. You come back here if you fall.', 2.2); } { const fl = W.flags.find((q) => W.p[f.who] && Math.hypot(q.x + 0.5 - W.p[f.who].x, q.y + 0.55 - W.p[f.who].y) < 1); if (fl) { glints(W, fl.x + 0.5, fl.y - 0.3, f.who === 'sun' ? '#FFD27A' : '#9FD0FF', 14); ring(W, fl.x + 0.5, fl.y + 0.85, f.who === 'sun' ? '#FFD27A' : '#9FD0FF'); } } break;
      case 'spawn': dust(W, W.p[f.who].x, W.p[f.who].y, 6); break;
      case 'out': Snd.fx.bad(); break;
      case 'win': Snd.fx.win(); break;
      default: break;
    }
  };

  const onWin = (W) => {
    if (solved.current) return;
    solved.current = true;
    if (watch) { setPhase('won'); setResult({ li: W.li, time: W.time, stars: 1 + (W.gems.every((g) => g.taken) ? 1 : 0) + (W.deaths.size === 0 ? 1 : 0), gems: W.gems.filter((g) => g.taken).length, gemsTotal: W.gems.length, deaths: W.deaths.size, missions: [], done: 0, depth: isEndless(W.li) ? depthOf(W.li) : 0, watch: true }); return; }
    const gemsAll = W.gems.every((g) => g.taken);
    const noLoss = W.deaths.size === 0;
    const par = parTime(W);
    const stars = 1 + (gemsAll ? 1 : 0) + (noLoss ? 1 : 0);
    const marks = { out: true, gems: gemsAll, hearts: noLoss, chest: !!(W.chest && W.chest.done), time: W.time <= par };
    const missions = missionsFor(W).map((m) => ({ ...m, on: !!marks[m.k] }));
    const done = missions.filter((m) => m.on).length;
    const key = isEndless(W.li) ? `e${depthOf(W.li)}` : W.li;
    const r = { li: W.li, time: W.time, stars, gems: W.gems.filter((g) => g.taken).length, gemsTotal: W.gems.length, chest: marks.chest, hasChest: !!W.chest, deaths: W.deaths.size, missions, done, depth: isEndless(W.li) ? depthOf(W.li) : 0 };
    saveBest(myId, key, r);
    setBest(readBest(myId));
    setResult(r);
    setCleared((c) => c + 1);
    setPhase('won');
    try { window.dispatchEvent(new CustomEvent('zchat-screen-fx', { detail: 'confetti' })); } catch {}
  };

  const sendChat = (text) => {
    const t = String(text || '').trim().slice(0, 90);
    if (!t) return;
    bubble(activeRef.current, t);
    pushFeed('You', t);
    setLog((l) => [...l.slice(-30), { who: 'You', text: t }]);
    if (!solo) relay.send('chat', { text: t });
    setChatText('');
    setSheet(null);
    setQuick(false);
    Snd.fx.pop();
  };
  const sendEmote = (e) => {
    bubble(activeRef.current, e, true);
    if (!solo) relay.send('emo', { e });
    setQuick(false);
    Snd.fx.emote();
  };

  const onJoyDown = (e) => {
    if (phaseRef.current !== 'play' || sheetOpen.current) return;
    const el = wrapRef.current;
    const { x, y } = stagePoint(el, e, sideRef.current);
    const w = el.clientWidth, h = el.clientHeight;
    if (y < 52 || (x > w * 0.55 && y > h - 230)) return;
    if (joy.current.id != null && joy.current.id !== e.pointerId && x > w * 0.45) return;
    if (quick) setQuick(false);
    Snd.init();
    joy.current = { x: 0, y: 0, id: e.pointerId, cx: x, cy: y, show: true };
    setJoyView({ x, y });
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
  };
  const onJoyMove = (e) => {
    const J = joy.current;
    if (J.id !== e.pointerId) return;
    const q = stagePoint(wrapRef.current, e, sideRef.current);
    const dx = q.x - J.cx, dy = q.y - J.cy, d = Math.hypot(dx, dy), R = joyRRef.current;
    const k = d > R ? R / d : 1;
    if (knobRef.current) knobRef.current.style.transform = `translate(${dx * k}px,${dy * k}px)`;
    const m = Math.min(1, d / R);
    if (m < 0.14) { J.x = 0; J.y = 0; } else { const mm = (m - 0.14) / 0.86; J.x = dx / d * mm; J.y = dy / d * mm; }
  };
  const onJoyUp = (e) => {
    if (joy.current.id !== e.pointerId) return;
    joy.current = { x: 0, y: 0, id: null, cx: 0, cy: 0, show: false };
    setJoyView(null);
  };
  useEffect(() => {
    const clear = () => { if (joy.current.id == null) return; joy.current = { x: 0, y: 0, id: null, cx: 0, cy: 0, show: false }; setJoyView(null); };
    const ends = (e) => { if (e.touches && e.touches.length === 0) clear(); };
    const vis = () => { if (document.visibilityState === 'hidden') clear(); };
    window.addEventListener('touchend', ends, true);
    window.addEventListener('touchcancel', ends, true);
    window.addEventListener('blur', clear);
    document.addEventListener('visibilitychange', vis);
    return () => { window.removeEventListener('touchend', ends, true); window.removeEventListener('touchcancel', ends, true); window.removeEventListener('blur', clear); document.removeEventListener('visibilitychange', vis); };
  }, []);

  const startEndless = (depth) => { const seed = newRunSeed(); rsRef.current = seed; startLevel(ENDLESS + Math.max(1, depth) - 1, undefined, false, seed); };
  const toPick = () => { setPhase('pick'); if (!solo) relay.send('pick', {}); WR.current = null; };

  const W = WR.current;
  const title = phase === 'play' || phase === 'won' || phase === 'out' ? levelTitle(li, rs) : 'Two Torches';
  const partnerLine = watch ? `Watching ${hostFirst} and ${peerFirst}` : solo ? (active === 'sun' ? 'Practice, orange torch' : 'Practice, blue torch') : here ? (phase === 'play' ? `With ${peerFirst}` : `${peerFirst} is here`) : here === false ? `${peerFirst} is away` : 'Connecting';
  const endlessBest = best.endless || 0;
  const actKind = active;
  const atkCol = actKind === 'sun' ? 'orange' : 'blue';
  const { top, right, bottom, left } = GS.at;
  const hb = land ? 38 : 40;
  const SW = GS.W, SH = GS.H;
  const socialBtns = !solo && !watch ? [
    <GHudBtn key="mic" icon={voice.micOn ? 'mic' : 'micoff'} on={voice.micOn} size={hb} label={voice.micOn ? 'Turn your mic off' : 'Turn your mic on'} onPress={voice.toggle} />,
    <GHudBtn key="peer" icon={voice.peerMuted ? 'mute' : 'people'} on={voice.peerMuted || !!(sheet && sheet.k === 'voice')} tone={voice.peerMuted ? '#E53A2A' : '#7CF2A0'} size={hb} label="Voice and volume" onPress={() => { setQuick(false); setSheet({ k: 'voice' }); }} />,
    <GHudBtn key="emo" icon="smile" on={quick} tone="#F5AE1E" size={hb} label="Quick messages and emojis" onPress={() => setQuick((v) => !v)} />,
    <GHudBtn key="chat" icon="chat" size={hb} label="Chat" onPress={() => { setQuick(false); setSheet({ k: 'chat' }); }} />,
  ] : [];
  const sysBtns = [
    !watch && <GHudBtn key="gear" icon="gear" size={hb} label="Settings" onPress={() => { setQuick(false); setCtl(true); }} />,
    <GHudBtn key="x" icon={solo && phase === 'play' ? 'pause' : 'close'} size={hb} label={solo && phase === 'play' ? 'Pause' : 'Leave the game'} onPress={() => (solo && phase === 'play' ? setPaused(true) : leave())} />,
  ].filter(Boolean);
  const rowBtns = land ? [...(phase === 'play' ? socialBtns : []), ...sysBtns] : sysBtns;
  const rowW = (n) => n * hb + Math.max(0, n - 1) * 6;
  const titleW = land ? Math.round(Math.min(240, SW * 0.28)) : Math.max(150, SW - 210);
  const capW = 186;
  const lEnd = 10 + (land ? titleW : rowW(sysBtns.length)) + 8;
  const rStart = SW - 10 - (land ? rowW(rowBtns.length) + 8 : 0);
  const capX = land ? clamp(SW / 2 - capW / 2, lEnd, Math.max(lEnd, rStart - capW)) : SW - 10 - capW;
  const armB = Math.round(12 + 190 * look.size + 12);
  const joyX = land ? 112 : 92, joyY = SH - (land ? 96 : 120);
  const tlEl = hudRefs.current.tl;
  const tlBottom = tlEl && tlEl.offsetHeight ? tlEl.offsetTop + tlEl.offsetHeight : 0;
  const miniK = W ? Math.min((land ? 120 : 84) / W.MW, (land ? 136 : 120) / W.MH) : 0;
  const mini = W && phase === 'play' ? { w: Math.max(30, Math.round(W.MW * miniK)), h: Math.max(30, Math.round(W.MH * miniK)) } : null;
  const chatSheet = sheet && sheet.k === 'chat' && (
    <Sheet title={solo ? 'Notes' : `Talk to ${peerFirst}`} onClose={() => setSheet(null)}>
      {log.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '12px 0 4px', maxHeight: 150, overflowY: 'auto' }}>
          {log.slice(-8).map((m, i) => <div key={i} style={{ fontSize: 13.5, lineHeight: 1.4 }}><span style={{ fontWeight: 800, color: m.who === 'You' ? '#FFCB7A' : '#A9CCFF' }}>{m.who}</span> <span style={{ color: 'rgba(255,255,255,0.85)' }}>{m.text}</span></div>)}
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        {PHRASES.map((p) => <button key={p} type="button" className="zgk-btn" onClick={() => { tap(); sendChat(p); }} style={{ ...btnBase, height: 38, padding: '0 14px', borderRadius: 19, background: 'rgba(255,255,255,0.1)', color: '#FFFFFF', fontSize: 13.5, fontWeight: 700 }}>{p}</button>)}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); sendChat(chatText); }} style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <input value={chatText} onChange={(e) => setChatText(e.target.value)} maxLength={90} placeholder="Write a message" aria-label="Message"
          style={{ flex: 1, minWidth: 0, height: 46, borderRadius: 23, border: 'none', background: 'rgba(255,255,255,0.1)', color: '#FFFFFF', padding: '0 16px', fontSize: 16, fontFamily: FONT, outline: 'none' }} />
        <GPill text="Send" color="green" small onPress={() => sendChat(chatText)} disabled={!chatText.trim()} />
      </form>
    </Sheet>
  );
  useEffect(() => { if (phase === 'pick' || phase === 'lobby') { Sfx.init(); Sfx.music('lobbyDuo', true); } else Sfx.music(null, false); }, [phase]);
  useEffect(() => () => Sfx.music(null, false), []);
  const pickMode = (m) => { if (!host || watch) return; setMode(m); if (!solo) relay.send('psel', { m, i: storySel }); };
  const pickStory = (i) => { if (!host || watch) return; const v = clamp(i, 0, STORY_N - 1); setStorySel(v); setMode('story'); if (!solo) relay.send('psel', { m: 'story', i: v }); };
  const toggleWatch = () => { setWatchAllowed(!allowWatch); kitTap(); };
  const storyStars = Array.from({ length: STORY_N }, (_, i) => (best[i] && best[i].stars) || 0).reduce((a, b) => a + b, 0);
  const selDef = levelDef(storySel, null);
  const selB = best[storySel];
  const canPick = host && !watch;
  const waiting = phase === 'lobby';
  const torchArt = (k) => <TorchHero kind={k} size={42} dir={k === 'sun' ? 'right' : 'left'} />;
  const lobbyUi = phase !== 'pick' && phase !== 'lobby' ? null : (
    <GLobby GS={GS} title="Two Torches" onClose={finish} closeLabel={solo ? 'Leave' : 'Back to chat'}
      sub={solo ? null : watch ? `Watching ${hostFirst} and ${peerFirst}` : waiting ? `Waiting for ${peerFirst} to open the game` : host ? `Pick where to go with ${peerFirst}` : `${peerFirst} picks where to go`}
      badge={<GChip style={{ gap: 5, height: 34 }}><GIcon k="star" size={15} color="#FFD23F" />{`${storyStars}/${STORY_N * 3}`}</GChip>}
      tools={(
        <>
          {!solo && !watch && <GBtn icon="chat" color="dark" size={42} fast={false} label="Chat" onPress={() => setSheet({ k: 'chat' })} />}
          {!solo && !watch && <GBtn icon={allowWatch ? 'eye' : 'eyeoff'} color={allowWatch ? 'blue' : 'dark'} size={42} fast={false} label={allowWatch ? 'Friends can watch. Tap to stop' : 'Let friends watch'} badge={watchers.length || null} onPress={toggleWatch} />}
          {!watch && <GBtn icon="gear" color="dark" size={42} fast={false} label="Settings" onPress={() => setCtl(true)} />}
        </>
      )}
      side={solo ? (
        <GPanel style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[['sun', '#FFB347', 'Orange torch', 'Lava safe. Fireballs. Burns vines'], ['moon', '#8CC0FF', 'Blue torch', 'Water safe. Frost. Shows hidden stones']].map(([k, c, t1, t2]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <TorchHero kind={k} size={40} dir={k === 'sun' ? 'right' : 'left'} />
              <div style={{ flex: 1, minWidth: 0, lineHeight: 1.3 }}>
                <span style={{ fontSize: 13.5, fontWeight: 900, color: c }}>{t1}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>{` ${t2}`}</span>
              </div>
            </div>
          ))}
        </GPanel>
      ) : (
        <GPanel style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14.5, fontWeight: 900, flex: 1 }}>{watch ? 'Players' : here ? 'Both torches are here' : here === false ? `${peerFirst} is away` : 'Connecting'}</span>
            {watchers.length > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 800, color: '#CFE6FF' }}><GIcon k="eye" size={14} color="#CFE6FF" />{`${watchers.length} watching`}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <GSlot art={torchArt(myKind === 'sun' || watch ? 'sun' : 'moon')} name={watch ? hostFirst : 'You'} ring={myKind === 'sun' || watch ? '#FFB347' : '#8CC0FF'} talk={!watch && voice.micOn} label={watch ? hostFirst : 'You'} />
            <GSlot art={torchArt(myKind === 'sun' || watch ? 'moon' : 'sun')} name={peerFirst} ring={myKind === 'sun' || watch ? '#8CC0FF' : '#FFB347'} talk={!watch && voice.peerMic} muted={!watch && voice.peerMuted} empty={!watch && here === false} label={peerFirst} />
            {!watch && (
              <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                <GVolBars name={peerFirst} vol={voice.peerVol} muted={voice.peerMuted} onVol={(v) => { if (voice.peerMuted) voice.togglePeer(); voice.setPeerVol(v); }} />
                <GBtn icon={voice.peerMuted ? 'mute' : 'sound'} color={voice.peerMuted ? 'red' : 'dark'} size={38} fast={false} label={voice.peerMuted ? `Unmute ${peerFirst}` : `Mute ${peerFirst}`} onPress={voice.togglePeer} />
              </div>
            )}
          </div>
          {!watch && <GPill text={voice.micOn ? 'Mic off' : 'Talk with mic'} icon={voice.micOn ? 'micoff' : 'mic'} color={voice.micOn ? 'white' : 'blue'} small wide onPress={voice.toggle} />}
          {!watch && voice.err && <div style={{ fontSize: 12, fontWeight: 800, color: '#FF9C9C' }}>{voice.err}</div>}
        </GPanel>
      )}
      main={(
        <GPanel style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <GSeg label="Mode" value={mode} items={[['endless', 'Endless'], ['story', 'Story']]} disabled={!canPick} onPick={(k) => { kitTap(); pickMode(k); }} />
          {mode === 'endless' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 50 }}>
              <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>{['sand', 'jungle', 'ice', 'forge', 'crystal', 'tomb', 'sky'].map((k) => <span key={k} title={THEMES[k].name} style={{ width: 8, height: 24, borderRadius: 3, background: THEMES[k].floor[0], boxShadow: `inset 0 -5px 0 ${THEMES[k].faceB}` }} />)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15.5, fontWeight: 900 }}>A new temple every time</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>{endlessBest > 0 ? `Your best is temple ${endlessBest}` : ''}</div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {canPick && <GBtn icon="chevl" color="dark" size={38} fast={false} label="Previous level" disabled={storySel <= 0} onPress={() => pickStory(storySel - 1)} />}
              <button type="button" className="zgk-btn" aria-label={`Level ${storySel + 1}, ${selDef.name}${canPick ? '. See all levels' : ''}`} {...pressProps(() => { if (canPick) { kitTap(); setStoryPage(Math.floor(storySel / STORY_PAGE)); setStorySheet(true); } })}
                style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', padding: 0, color: '#FFFFFF', fontFamily: FONT, textAlign: 'center', cursor: canPick ? 'pointer' : 'default' }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: '#FFD36B' }}>{`Level ${storySel + 1}, ${(THEMES[selDef.theme] || THEMES.sand).name}`}</div>
                <div style={{ fontSize: 19, fontWeight: 900, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selDef.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, marginTop: 2 }}>
                  {[0, 1, 2].map((q) => <GIcon key={q} k="star" size={13} color={selB && selB.stars > q ? '#FFD23F' : 'rgba(255,255,255,0.22)'} />)}
                  {selB && selB.time ? <span style={{ fontSize: 11.5, fontWeight: 800, color: 'rgba(255,255,255,0.7)', marginLeft: 6, fontVariantNumeric: 'tabular-nums' }}>{`Best ${fmtTime(selB.time)}`}</span> : null}
                </div>
              </button>
              {canPick && <GBtn icon="chevr" color="dark" size={38} fast={false} label="Next level" disabled={storySel >= STORY_N - 1} onPress={() => pickStory(storySel + 1)} />}
            </div>
          )}
          {watch ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44, fontSize: 13.5, fontWeight: 800, color: 'rgba(255,255,255,0.85)' }}><GIcon k="eye" size={17} color="#CFE6FF" />{`${hostFirst} starts soon`}</div>
          ) : waiting ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44, fontSize: 13.5, fontWeight: 800, color: 'rgba(255,255,255,0.85)' }}><Spinner size={16} color="#FFFFFF" />{`The game starts when ${peerFirst} opens it`}</div>
          ) : canPick ? (
            mode === 'endless' ? (
              <div style={{ display: 'flex', gap: 8 }}>
                {endlessBest >= 2 && <GPill text={`Temple ${endlessBest}`} color="white" onPress={() => startEndless(endlessBest)} />}
                <GPill text="Start" icon="play" color="gold" wide onPress={() => startEndless(1)} style={{ flex: 1 }} />
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <GPill text="Levels" icon="map" color="white" onPress={() => { setStoryPage(Math.floor(storySel / STORY_PAGE)); setStorySheet(true); }} />
                <GPill text="Play" icon="play" color="gold" wide onPress={() => startLevel(storySel)} style={{ flex: 1 }} />
              </div>
            )
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44, fontSize: 13.5, fontWeight: 800, color: 'rgba(255,255,255,0.85)' }}><Spinner size={16} color="#FFFFFF" />{watch ? `${hostFirst} starts soon` : `${peerFirst} picks and starts`}</div>
          )}
        </GPanel>
      )}>
      {storySheet && (() => {
        const pages = Math.ceil(STORY_N / STORY_PAGE);
        const ids = Array.from({ length: STORY_PAGE }, (_, k) => storyPage * STORY_PAGE + k).filter((i) => i < STORY_N);
        return (
          <GLobbySheet GS={GS} title="Story" width={640} onClose={() => setStorySheet(false)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <GBtn icon="chevl" color="dark" size={36} fast={false} label="Previous page" disabled={storyPage <= 0} onPress={() => setStoryPage((v) => Math.max(0, v - 1))} />
              <div style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 900, color: 'rgba(255,255,255,0.85)' }}>{`Levels ${ids[0] + 1} to ${ids[ids.length - 1] + 1}`}</div>
              <GBtn icon="chevr" color="dark" size={36} fast={false} label="Next page" disabled={storyPage >= pages - 1} onPress={() => setStoryPage((v) => Math.min(pages - 1, v + 1))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${land ? 5 : 3}, minmax(0, 1fr))`, gap: 8, marginTop: 12 }}>
              {ids.map((i) => {
                const L = levelDef(i, null);
                const b = best[i];
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minWidth: 0 }}>
                    <GBtn color={THEME_BTN[L.theme] || 'gold'} size={48} fast={false} active={i === storySel} label={`Level ${i + 1}, ${L.name}`} onPress={() => { pickStory(i); setStorySheet(false); }}>
                      <span style={{ fontSize: 17, fontWeight: 900, color: '#FFFFFF', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>{i + 1}</span>
                    </GBtn>
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.8)', maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{L.name}</span>
                    <span style={{ display: 'flex', gap: 1 }}>{[0, 1, 2].map((q) => <GIcon key={q} k="star" size={11} color={b && b.stars > q ? '#FFD23F' : 'rgba(255,255,255,0.2)'} />)}</span>
                  </div>
                );
              })}
            </div>
          </GLobbySheet>
        );
      })()}
    </GLobby>
  );
  return (
    <Portal><GSkin k="duo">
      <div ref={GS.rootRef} style={{ position: 'fixed', left: 0, right: 0, top: 'var(--zvp-top, 0px)', height: 'calc(var(--zvp-h, 100%) + var(--zgx, 0px))', zIndex: 90, background: '#0B0910', overflow: 'hidden', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', fontFamily: FONT, color: '#FFFFFF' }}>
      <div ref={wrapRef} data-side={side ? '1' : '0'} onPointerDown={onJoyDown} onPointerMove={onJoyMove} onPointerUp={onJoyUp} onPointerCancel={onJoyUp} onLostPointerCapture={onJoyUp} style={GS.wrapStyle}>
        <canvas ref={cvRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />

        {(phase === 'play' || phase === 'won' || phase === 'out') && (
          <>
            <div ref={hudRef('tl')} style={{ position: 'absolute', left: left(10), top: top(8), display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start', zIndex: 3, pointerEvents: 'none', maxWidth: titleW }}>
              {!land && <div style={{ display: 'flex', gap: 6, pointerEvents: 'auto' }}>{sysBtns}</div>}
              <GHudPanel style={{ padding: '5px 10px 6px', maxWidth: '100%', boxSizing: 'border-box', minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.72)', display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  {!solo && <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: here ? (net.weak ? '#FFB347' : '#3DDC84') : '#8E8A9E' }} />}
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{partnerLine}</span>
                  {!solo && !watch && here && <PingChip ms={net.ping} weak={net.weak} />}
                </div>
              </GHudPanel>
              {mini && <canvas ref={miniRef} aria-hidden="true" style={{ width: mini.w, height: mini.h, display: 'block', borderRadius: 6, boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }} />}
              {!watch && watchers.length > 0 && <GHudPanel style={{ height: 24, padding: '0 9px', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 800, whiteSpace: 'nowrap' }}><GIcon k="eye" size={13} color="#CFE6FF" ink="rgba(0,0,0,0.35)" />{watchers.length === 1 ? `${watchers[0].n} is watching` : `${watchers.length} watching`}</GHudPanel>}
            </div>
            <div ref={hudRef('tc')} style={{ position: 'absolute', left: capX, top: top(8), width: capW, display: 'flex', justifyContent: land ? 'center' : 'flex-end', zIndex: 2, pointerEvents: 'none' }}>
              <GHudPanel style={{ height: 30, padding: '0 11px', display: 'flex', alignItems: 'center', gap: 9, fontSize: 12, fontWeight: 800, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                <span style={{ display: 'flex', gap: 2 }}>{Array.from({ length: LIVES }, (_, i) => <GIcon key={i} k="heart" size={13} color={i < hud.lives ? '#FF5A6E' : 'rgba(255,255,255,0.28)'} ink="rgba(0,0,0,0.35)" />)}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><GemIcon k="sun" size={13} />{hud.gems.sun[0]}/{hud.gems.sun[1]}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><GemIcon k="moon" size={13} />{hud.gems.moon[0]}/{hud.gems.moon[1]}</span>
                {hud.key && <KeyIcon />}
              </GHudPanel>
            </div>
            {land && <div ref={hudRef('tr')} style={{ position: 'absolute', right: right(10), top: top(8), display: 'flex', gap: 6, zIndex: 3 }}>{rowBtns}</div>}
            {!land && socialBtns.length > 0 && phase === 'play' && <div ref={hudRef('sc')} style={{ position: 'absolute', right: right(16), bottom: bottom(armB), display: 'flex', flexDirection: 'column', gap: 8, zIndex: 3 }}>{socialBtns}</div>}
          </>
        )}
        {toast && phase === 'play' && !intro && (
          <div key={toast.at} style={{ position: 'absolute', left: '50%', ...(land ? { bottom: bottom(16) } : { top: tlBottom ? tlBottom + 10 : top(150) }), transform: 'translateX(-50%)', width: land ? 'min(48%, 400px)' : 'min(86%, 380px)', display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 4 }}>
            <GHint text={toast.text} life={toast.life || 3} />
          </div>
        )}
        {intro && phase === 'play' && (
          <div key={intro.key} style={{ position: 'absolute', left: '50%', top: top(land ? 46 : 120), transform: 'translateX(-50%)', width: land ? 'min(50%, 340px)' : 'min(88%, 340px)', pointerEvents: 'none', animation: 'zgk-pop 0.35s ease-out', zIndex: 4 }}>
            <GHudPanel style={{ padding: land ? '10px 14px' : '14px 16px', background: 'rgba(14,10,24,0.82)' }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: '#FFD36B' }}>{intro.endless ? `Endless temples, ${intro.place}` : intro.place}</div>
              <div style={{ fontSize: land ? 18 : 21, fontWeight: 900, marginTop: 2, textShadow: `0 2px 0 ${INK}` }}>{intro.title}</div>
              <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.8)', marginTop: 4, lineHeight: 1.4, fontWeight: 700 }}>{intro.goal}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                {intro.missions.map((m) => <div key={m.k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.88)' }}><GIcon k="star" size={13} color="#5A5470" />{m.t}</div>)}
              </div>
            </GHudPanel>
          </div>
        )}
        {phase === 'play' && !solo && net.lost && (
          <div style={{ position: 'absolute', left: '50%', top: '42%', transform: 'translate(-50%, -50%)', maxWidth: '86%', pointerEvents: 'none', zIndex: 4 }}>
            <GPanel style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Spinner size={18} color="#FFFFFF" />
              <div style={{ fontSize: 13.5, fontWeight: 800, lineHeight: 1.35 }}>{`Waiting for ${peerFirst}'s connection. Keep playing, the game catches up.`}</div>
            </GPanel>
          </div>
        )}
        {phase === 'play' && watch && (
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: bottom(16), display: 'flex', justifyContent: 'center', padding: '0 14px', zIndex: 3 }}>
            <GWatchBar ids={['sun', 'moon']} cur={active} nameOf={(k) => (k === 'sun' ? hostFirst : peerFirst)} colorOf={(k) => (k === 'sun' ? '#FF9A2E' : '#3E9BFF')} onPick={(k) => { if (k !== active) { setActive(k); cam.current.init = false; } }} />
          </div>
        )}
        {phase === 'play' && !watch && <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 1 - look.see }}><GJoy flat view={joyView} knobRef={knobRef} color={actKind === 'sun' ? 'orange' : 'blue'} idle={{ x: joyX, y: joyY }} R={joyR} /></div>}
        {phase === 'play' && quick && !solo && (
          <div onPointerDown={(e) => e.stopPropagation()} style={land ? { position: 'absolute', right: right(10), top: top(54), width: 'min(300px, calc(100% - 40px))', animation: 'zgk-pop 0.2s ease-out', zIndex: 6 } : { position: 'absolute', right: right(16 + 40 + 10), bottom: bottom(armB), width: 'min(280px, calc(100% - 90px))', animation: 'zgk-pop 0.2s ease-out', zIndex: 6 }}>
            <GPanel style={{ padding: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 6 }}>
                {EMOTES.map((e) => <button key={e} type="button" className="zgk-btn" aria-label={`Send ${e}`} {...pressProps(() => sendEmote(e))} style={{ ...btnBase, height: 42, borderRadius: 14, background: 'rgba(255,255,255,0.1)', fontSize: 24, lineHeight: 1 }}>{e}</button>)}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {QUICK.map((p) => <button key={p} type="button" className="zgk-btn" {...pressProps(() => { tap(); sendChat(p); })} style={{ ...btnBase, height: 32, padding: '0 11px', borderRadius: 16, background: 'rgba(255,255,255,0.12)', color: '#FFFFFF', fontSize: 12.5, fontWeight: 800 }}>{p}</button>)}
                <button type="button" className="zgk-btn" {...pressProps(() => { tap(); setQuick(false); setSheet({ k: 'chat' }); })} style={{ ...btnBase, height: 32, padding: '0 11px', borderRadius: 16, background: 'rgba(255,255,255,0.22)', color: '#FFFFFF', fontSize: 12.5, fontWeight: 900 }}>Type a message</button>
              </div>
            </GPanel>
          </div>
        )}
        {phase === 'play' && !watch && (
          <div ref={hudRef('sk')} style={{ position: 'absolute', right: right(14), bottom: bottom(12), width: 210, height: 190, pointerEvents: 'none', transform: `scale(${look.size})`, transformOrigin: '100% 100%', opacity: 1 - look.see, zIndex: 2 }}>
            <div style={{ position: 'absolute', left: 131, top: 111, pointerEvents: 'auto' }}>
              <GHudSkill main icon={actKind === 'sun' ? 'flame' : 'snow'} tone={actKind === 'sun' ? GC.orange[1] : GC.blue[1]} size={74} label={actKind === 'sun' ? 'Throw a fireball' : 'Throw frost'} sound="none" onPress={() => { atkReq.current = Date.now(); }} />
            </div>
            {nearUse && <div style={{ position: 'absolute', left: 50, top: 120, pointerEvents: 'auto', animation: 'zgk-pop 0.25s ease-out' }}><GHudSkill icon="hand" tone="#FFD23F" size={56} label={nearUse === 'mirror' ? 'Turn the mirror' : 'Use the dial'} onPress={useAction} /></div>}
            {solo && <div style={{ position: 'absolute', left: 134, top: 32, pointerEvents: 'auto' }}><GHudSkill icon="swap" tone={actKind === 'sun' ? '#8CC0FF' : '#FFB347'} size={52} label={actKind === 'sun' ? 'Switch to the blue torch' : 'Switch to the orange torch'} onPress={() => { swapAt.current = Date.now(); setActive((a) => (a === 'sun' ? 'moon' : 'sun')); cam.current.init = true; }} /></div>}
          </div>
        )}
        {ctl && (
          <div onPointerDown={(e) => e.stopPropagation()} style={{ position: 'absolute', inset: 0, zIndex: 45, background: 'rgba(8,6,14,0.6)', display: 'flex', padding: 12, overflowY: 'auto', touchAction: 'pan-x pan-y' }}>
            <div style={{ margin: 'auto', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><GControlsPanel sideways onClose={() => setCtl(false)} /></div>
          </div>
        )}
        {voice.err && phase === 'play' && <div style={{ position: 'absolute', left: '50%', top: '22%', transform: 'translateX(-50%)', pointerEvents: 'none', zIndex: 4 }}><GChip style={{ background: 'rgba(217,75,75,0.95)' }}>{voice.err}</GChip></div>}

        {lobbyUi}

        {phase === 'won' && result && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 20, background: 'rgba(5,4,10,0.5)', display: 'flex', padding: 12, overflowY: 'auto', touchAction: 'pan-x pan-y' }}>
            <GPanel style={{ margin: 'auto', width: '100%', maxWidth: land ? 640 : 360, display: 'flex', flexDirection: land ? 'row' : 'column', alignItems: land ? 'stretch' : 'center', gap: land ? 16 : 12, textAlign: 'center', padding: land ? '14px 16px' : '20px 18px', animation: 'zgk-pop 0.35s ease-out', boxSizing: 'border-box' }}>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: land ? 10 : 12 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>{[0, 1, 2].map((i) => <div key={i} style={{ transform: i === 1 ? 'translateY(-6px)' : 'none', animation: `zgk-pop ${0.3 + i * 0.15}s ease-out` }}><GIcon k="star" size={i === 1 ? (land ? 38 : 42) : (land ? 30 : 34)} color={result.stars > i ? '#FFD23F' : 'rgba(255,255,255,0.16)'} /></div>)}</div>
                <GTitle text={result.watch ? `${hostFirst} and ${peerFirst} made it` : result.depth ? `Temple ${result.depth} cleared` : solo ? 'Both torches made it' : 'You made it together'} size={land ? 23 : 26} color="#FFE15A" />
                <GStat items={[['Time', fmtTime(result.time)], ['Gems', `${result.gems} of ${result.gemsTotal}`], ['Hearts lost', String(result.deaths)]]} />
              </div>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: land ? 8 : 12, width: '100%' }}>
                {!result.watch && <div style={{ width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: land ? 5 : 7, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)', textAlign: 'left' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.62)' }}>{`Missions, ${result.done} of ${result.missions.length}`}</div>
                  {result.missions.map((m) => <div key={m.k} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: land ? 12.5 : 13.5, fontWeight: 700, color: m.on ? '#FFFFFF' : 'rgba(255,255,255,0.5)' }}><GIcon k={m.on ? 'check' : 'star'} size={15} color={m.on ? '#7CF2A0' : 'rgba(255,255,255,0.3)'} line={m.on} halo={false} stroke={2.6} />{m.t}</div>)}
                </div>}
                {watch ? <div style={{ fontSize: 13.5, fontWeight: 800, color: 'rgba(255,255,255,0.75)' }}>The players pick what is next</div> : host ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                    {isEndless(li) ? <GPill text={`Next temple, ${depthOf(li) + 1}`} icon="play" color="green" wide height={land ? 50 : undefined} onPress={() => startLevel(li + 1, undefined, false, rs)} /> : li < STORY_N - 1 ? <GPill text="Next level" icon="play" color="green" wide height={land ? 50 : undefined} onPress={() => startLevel(li + 1)} /> : <GPill text="Try endless temples" icon="play" color="green" wide height={land ? 50 : undefined} onPress={() => startEndless(1)} />}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <GPill text="Play again" icon="replay" color="white" small onPress={() => startLevel(li, undefined, false, rs)} style={{ flex: 1 }} wide />
                      <GPill text="Levels" icon="map" color="white" small onPress={toPick} style={{ flex: 1 }} wide />
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: 'rgba(255,255,255,0.75)' }}>{`${peerFirst} picks what is next`}</div>
                )}
                <GPill text={solo ? 'Leave' : 'Back to chat'} color="dark" small wide onPress={finish} />
              </div>
            </GPanel>
          </div>
        )}

        {phase === 'out' && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 20, background: 'rgba(5,4,10,0.55)', display: 'flex', padding: 12, overflowY: 'auto', touchAction: 'pan-x pan-y' }}>
            <GPanel style={{ margin: 'auto', width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: land ? 9 : 12, textAlign: 'center', padding: land ? '14px 16px' : '22px 18px', animation: 'zgk-pop 0.35s ease-out' }}>
              <div style={{ display: 'flex', gap: 4 }}>{[0, 1, 2].map((i) => <GIcon key={i} k="heart" size={24} color="rgba(255,255,255,0.16)" />)}</div>
              <GTitle text="Out of hearts" size={28} color="#FF8F8F" />
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.78)', lineHeight: 1.5, fontWeight: 700 }}>{isEndless(li) ? 'This temple starts over with three new hearts. Talk it through first.' : 'The level starts over with three new hearts. Talk it through first.'}</div>
              {host ? <GPill text="Try again" icon="replay" color="green" wide onPress={() => startLevel(li, undefined, false, rs)} /> : <div style={{ fontSize: 13.5, fontWeight: 800, color: 'rgba(255,255,255,0.75)' }}>{`Waiting for ${peerFirst} to start again`}</div>}
              {host && <GPill text="Levels" icon="map" color="white" small wide onPress={toPick} />}
              <GPill text={solo ? 'Leave' : 'Back to chat'} color="dark" small wide onPress={finish} />
            </GPanel>
          </div>
        )}

        {sheet && sheet.k === 'dial' && W && (
          <Sheet title="Stone dial" text={W.mural > 0.5 || solo ? 'Turn in the three symbols in the right order.' : 'The code is painted where only blue light shows it. Ask the blue torch to read it.'} onClose={() => setSheet(null)}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, margin: '16px 0 14px' }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ width: 58, height: 58, borderRadius: 18, background: sheet.bad ? 'rgba(217,75,75,0.25)' : 'rgba(255,255,255,0.08)', boxShadow: `inset 0 0 0 2px rgba(255,214,120,0.4), 0 0 0 2px ${INK}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {sheet.picks[i] && <GlyphIcon k={sheet.picks[i]} size={30} color="#FFE09A" />}
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 8 }}>
              {GLYPHS.map((g) => (
                <button key={g} type="button" className="zgk-btn" aria-label={GLYPH_NAMES[g]} onClick={() => {
                  tap();
                  const picks = [...sheet.picks, g].slice(0, 3);
                  if (picks.length < 3) { setSheet({ k: 'dial', picks }); return; }
                  const ok = tryCode(WR.current, picks);
                  if (ok) { setSheet(null); }
                  else { Snd.fx.bad(); setSheet({ k: 'dial', picks, bad: true }); setTimeout(() => setSheet((s2) => (s2 && s2.k === 'dial' ? { k: 'dial', picks: [] } : s2)), 650); }
                }} style={{ ...btnBase, flexDirection: 'column', gap: 4, height: 70, borderRadius: 16, background: 'rgba(255,255,255,0.08)', color: '#FFFFFF', fontSize: 11.5, fontWeight: 800 }}>
                  <GlyphIcon k={g} size={28} color="#FFE09A" />{GLYPH_NAMES[g]}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <GPill text="Clear" color="white" small onPress={() => setSheet({ k: 'dial', picks: [] })} style={{ flex: 1 }} wide />
              <GPill text="Close" color="dark" small onPress={() => setSheet(null)} style={{ flex: 1 }} wide />
            </div>
          </Sheet>
        )}
        {leaveAsk && (
          <Sheet title="Leave the game?" text={`${peerFirst} stays in the level but cannot finish it without you.`} onClose={() => setLeaveAsk(false)}>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <GPill text="Stay" color="white" small onPress={() => setLeaveAsk(false)} style={{ flex: 1 }} wide />
              <GPill text="Leave" color="red" small onPress={() => { setLeaveAsk(false); finish(); }} style={{ flex: 1 }} wide />
            </div>
          </Sheet>
        )}
        <GTalkers ids={talking} nameOf={(k) => (k === 'me' ? 'You' : peerFirst)} top={top(phase === 'play' ? 46 : 50)} />
        <GNotices items={notes} style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', ...(phase === 'pick' ? { top: top(64) } : land ? (intro ? { bottom: bottom(64) } : { top: top(46) }) : { bottom: bottom(armB + 14) }), width: land ? 'min(52%, 420px)' : 'calc(100% - 40px)', zIndex: 30 }} />
        {phase === 'play' && <GChatFeed items={feed} style={{ position: 'absolute', left: left(12), top: top(land ? 160 : 150), width: land ? 'min(30%, 260px)' : 'calc(100% - 24px)', zIndex: 29 }} />}
        {chatSheet}
        {sheet && sheet.k === 'voice' && !solo && !watch && (
          <Sheet title="Voice" text={voice.micOn ? `Your mic is on. ${peerFirst} can hear you.` : 'Turn your mic on to talk while you play.'} onClose={() => setSheet(null)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', marginTop: 12 }}>
              <TorchHero kind={theirKind} size={38} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{peerFirst}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: voice.peerMic ? '#7BE05A' : 'rgba(255,255,255,0.55)' }}>{voice.peerMic ? 'Mic on' : 'Mic off'}</div>
              </div>
              <GVolBars name={peerFirst} vol={voice.peerVol} muted={voice.peerMuted} onVol={(v) => { if (voice.peerMuted) voice.togglePeer(); voice.setPeerVol(v); }} />
              <GBtn icon={voice.peerMuted ? 'mute' : 'sound'} color={voice.peerMuted ? 'red' : 'dark'} size={40} fast={false} label={voice.peerMuted ? `Unmute ${peerFirst}` : `Mute ${peerFirst}`} onPress={voice.togglePeer} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <GPill text={voice.micOn ? 'Mic off' : 'Mic on'} icon={voice.micOn ? 'micoff' : 'mic'} color={voice.micOn ? 'white' : 'blue'} small wide onPress={voice.toggle} style={{ flex: 1 }} />
              <GPill text="Done" color="dark" small wide onPress={() => setSheet(null)} style={{ flex: 1 }} />
            </div>
          </Sheet>
        )}
        {paused && solo && phase === 'play' && (
          <div onPointerDown={(e) => e.stopPropagation()} style={{ position: 'absolute', inset: 0, zIndex: 35, background: 'rgba(10,8,24,0.5)', display: 'flex', padding: 12, overflowY: 'auto' }}>
            <GPanel style={{ margin: 'auto', width: '100%', maxWidth: 320, padding: 16, display: 'flex', flexDirection: 'column', gap: 10, animation: 'zgk-pop 0.3s ease-out', boxSizing: 'border-box' }}>
              <GTitle text="Paused" size={28} />
              <GPill text="Resume" icon="play" color="green" wide onPress={() => setPaused(false)} />
              <div style={{ display: 'flex', gap: 8 }}>
                <GPill text="Restart" icon="replay" color="white" small wide onPress={() => { setPaused(false); startLevel(li, undefined, false, rs); }} style={{ flex: 1 }} />
                <GPill text="Settings" icon="gear" color="white" small wide onPress={() => setCtl(true)} style={{ flex: 1 }} />
              </div>
              <GPill text="Leave" color="red" small wide onPress={() => { setPaused(false); finish(); }} />
            </GPanel>
          </div>
        )}
      </div>
      </div>
    </GSkin></Portal>
  );
}

export default DuoGamePage;
