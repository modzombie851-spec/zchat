import React, { useEffect, useRef, useState } from 'react';
import { Avatar, Portal, useBackClose, hapticTap, FONT, Spinner } from '../App.jsx';
import { useGameRelay } from './relay.jsx';
import { EMOTES, PingChip, SpeakerIcon, SmileIcon, MicIcon, ChatIcon, btnBase, Btn, RoundBtn, Sheet, injectCss, useVoice, setKitTap } from './livekit.jsx';
import { TARGET, ROUND_T, LIVES, WW, WH, FLOOR, rOf, clamp, makeGame, hostStep, applyGuestEvent, snap, applySnap, guestFollow, setNet, followNet, movePlayer, tickPlayer, canEat, canTake, botInput, mkPl, PK_TIME } from './gulpengine.js';
import { Snd, render, makeDeco, updateParts, bubbles, floatText, burst } from './gulpdraw.js';

const QUICK = ['Come here', 'Run', 'Big fish', 'Nice one', 'Watch out', 'Good game'];
const PHRASES = ['Come here', 'Run', 'Big fish behind you', 'Nice one', 'Watch out', 'Good game', 'Rematch', 'Sorry'];
const BEST_KEY = (uid) => `zchat-gulp-best-${uid || 'me'}`;
function readBest(uid) { try { return JSON.parse(localStorage.getItem(BEST_KEY(uid)) || '{}') || {}; } catch { return {}; } }
function saveBest(uid, r) { try { const b = readBest(uid); b.top = Math.max(b.top || 0, r.n); b.wins = (b.wins || 0) + (r.win ? 1 : 0); b.games = (b.games || 0) + 1; localStorage.setItem(BEST_KEY(uid), JSON.stringify(b)); } catch {} }
const tap = () => { try { hapticTap(); } catch {} Snd.init(); Snd.fx.click(); };
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const newSeed = () => Math.random().toString(36).slice(2, 9);

function DashIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8h7M2 12h9M4 16h7" /><path d="M13 6l7 6-7 6z" fill="#FFFFFF" /></svg>;
}
function Bar({ n, col, right }) {
  const k = clamp(Math.log(Math.max(2, n)) / Math.log(TARGET), 0, 1);
  return <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.16)', overflow: 'hidden', display: 'flex', justifyContent: right ? 'flex-end' : 'flex-start' }}><div style={{ width: `${k * 100}%`, height: '100%', borderRadius: 3, background: col, transition: 'width 0.25s ease-out' }} /></div>;
}
function Hearts({ n }) {
  return (
    <span aria-label={`${n} ${n === 1 ? 'heart' : 'hearts'} left`} style={{ display: 'inline-flex', gap: 2, flexShrink: 0 }}>
      {[0, 1, 2].map((i) => <svg key={i} width="12" height="11" viewBox="0 0 24 22" aria-hidden="true"><path d="M12 21s-9.5-6.2-9.5-12.6C2.5 4.9 5 2.5 8 2.5c1.8 0 3.2.9 4 2.3.8-1.4 2.2-2.3 4-2.3 3 0 5.5 2.4 5.5 5.9C21.5 14.8 12 21 12 21z" fill={i < n ? '#FF5A6E' : 'rgba(255,255,255,0.2)'} /></svg>)}
    </span>
  );
}

export function GulpGamePage({ solo = false, initial, me, peer, myId, onClose, onSaveState, onRematch, onPeerAway }) {
  injectCss();
  setKitTap(tap);
  const gameId = (initial && initial.id) || 'solo';
  const host = solo || !initial || initial.x === myId;
  const mine = host ? 'sun' : 'moon';
  const theirs = mine === 'sun' ? 'moon' : 'sun';
  const peerFirst = solo ? 'Bot' : String((peer && peer.name) || 'Friend').split(' ')[0];
  const relay = useGameRelay({ id: solo ? null : `gulp-${gameId}`, myId, peerId: peer && peer.id, enabled: !solo, g: 'gulp' });
  const here = solo ? true : relay.here;
  const voice = useVoice(solo ? null : relay, !solo, host && !solo);
  const [phase, setPhase] = useState(solo ? 'ready' : 'lobby');
  const [hud, setHud] = useState({ mine: 2, theirs: 2, ml: LIVES, tl: LIVES, left: ROUND_T, dash: 0, fx: {} });
  const [toast, setToast] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [quick, setQuick] = useState(false);
  const [chatText, setChatText] = useState('');
  const [log, setLog] = useState([]);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState({ x: 0, o: 0 });
  const [leaveAsk, setLeaveAsk] = useState(false);
  const [net, setNetView] = useState({ ping: null, weak: false, lost: false });
  const [joyView, setJoyView] = useState(null);
  const best = useRef(readBest(myId));
  const cvRef = useRef(null);
  const wrapRef = useRef(null);
  const GR = useRef(null);
  const partsRef = useRef([]);
  const hiddenRef = useRef(new Map());
  const pendRef = useRef([]);
  const lastSeq = useRef(0);
  const cam = useRef({ x: WW / 2, y: WH / 2, z: 60, init: false });
  const joy = useRef({ x: 0, y: 0, id: null, cx: 0, cy: 0 });
  const keys = useRef(new Set());
  const dashReq = useRef(false);
  const knobRef = useRef(null);
  const bubblesRef = useRef({ sun: null, moon: null });
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const scoreRef = useRef(score);
  scoreRef.current = score;
  const netRef = useRef({ pings: [], ping: null, n: 0, last: 0, view: '' });
  const sendT = useRef({ s: 0, p: 0 });
  const hudKey = useRef('');
  const toastTimer = useRef(0);
  const overRef = useRef(false);
  const tickRef = useRef(0);
  if (typeof window !== 'undefined' && window.__zfake) window.__zgulp = { game: () => GR.current };

  const say = (text, sec) => { setToast({ text, at: Date.now() }); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(null), (sec || 2.6) * 1000); };
  const bubble = (kind, text, emo) => { bubblesRef.current[kind] = emo ? { text, t: 0, life: 1.7, emo: true } : { text, t: 0, life: Math.max(3.2, text.length * 0.075) }; };
  const heard = () => { netRef.current.last = Date.now(); };

  const startRound = (seed, quiet) => {
    const G = makeGame(seed, { bot: solo });
    if (!host) G.fish = [];
    G.deco = makeDeco(seed);
    GR.current = G;
    partsRef.current = [];
    hiddenRef.current = new Map();
    pendRef.current = [];
    lastSeq.current = host ? 0 : -1;
    overRef.current = false;
    cam.current.init = false;
    setResult(null);
    setSheet(null);
    setQuick(false);
    setPhase('play');
    Snd.init();
    Snd.music(true);
    if (!solo && host && !quiet) relay.send('gl', { seed, sc: scoreRef.current });
    say(`Eat fish with smaller numbers. First to ${TARGET} wins.`, 3.4);
    if (!solo && host && onSaveState && initial && initial.st !== 'live') onSaveState({ ...initial, st: 'live', exp: null });
  };

  useEffect(() => {
    if (solo) return undefined;
    const offs = [
      relay.on('gl', (m) => { heard(); if (!host) { if (m.sc) setScore(m.sc); startRound(m.seed, true); } }),
      relay.on('gready', (m) => { heard(); if (!host) { if (m.sc) setScore(m.sc); setPhase((p) => (p === 'lobby' || p === 'over' ? 'ready' : p)); } }),
      relay.on('gs', (m) => {
        heard();
        if (host) return;
        let G = GR.current;
        if (!G || G.seed !== m.seed) { startRound(m.seed, true); G = GR.current; }
        applySnap(G, m.s, 'moon');
        if (m.sc) setScore(m.sc);
        if (lastSeq.current < 0) lastSeq.current = m.s.seq || 0;
        for (const e of m.s.ev || []) { if (e.s <= lastSeq.current) continue; lastSeq.current = e.s; handleEv(G, e, true); }
        const now = Date.now();
        const acked = G.acked || new Set();
        pendRef.current = pendRef.current.filter((p) => !acked.has(p.id) && now - p.at < 1600);
        for (const [id, at] of hiddenRef.current) if (now - at > 1600) hiddenRef.current.delete(id);
        if (G.over && !overRef.current) finishRound(G, m.sc);
      }),
      relay.on('gp', (m) => { heard(); const G = GR.current; if (G && m.k === theirs) setNet(G.pl[theirs], m); }),
      relay.on('ge', (m) => { heard(); const G = GR.current; if (host && G && m.seed === G.seed) applyGuestEvent(G, m.e); }),
      relay.on('pi', (m) => { heard(); relay.send('po', { n: m.n, t0: m.t0 }); }),
      relay.on('po', (m) => { heard(); const N = netRef.current; const rtt = Date.now() - (m.t0 || 0); if (rtt < 0 || rtt > 20000) return; N.pings = [...N.pings.slice(-4), rtt]; const so = [...N.pings].sort((a, b) => a - b); N.ping = Math.max(1, Math.round(so[Math.floor(so.length / 2)])); }),
      relay.on('chat', (m) => { heard(); const text = String(m.text || '').slice(0, 90); if (!text) return; bubble(theirs, text); setLog((l) => [...l.slice(-30), { who: peerFirst, text }]); Snd.fx.pop(); }),
      relay.on('emo', (m) => { heard(); const e = String(m.e || ''); if (!EMOTES.includes(e)) return; bubble(theirs, e, true); Snd.fx.emote(); }),
      relay.on('hi', () => { heard(); if (host) { if (GR.current && phaseRef.current === 'play') relay.send('gl', { seed: GR.current.seed, sc: scoreRef.current }); else relay.send('gready', { sc: scoreRef.current }); } }),
      relay.on('hey', heard),
      relay.on('back', heard),
      relay.on('bye', () => {
        say(`${peerFirst} left the game`, 4);
        const G = GR.current;
        if (!G || G.over || phaseRef.current !== 'play') return;
        G.over = { w: host ? 'x' : 'o', why: 'left' };
        if (!host) finishRound(G, scoreRef.current);
      }),
    ];
    return () => offs.forEach((f) => f && f());
  }, [relay.on, host]);

  useEffect(() => {
    if (solo) return undefined;
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
  }, [solo, relay.here]);
  useEffect(() => {
    if (solo) return;
    if (here && phase === 'lobby') { setPhase('ready'); if (host) relay.send('gready', { sc: scoreRef.current }); }
  }, [here, phase]);
  useEffect(() => {
    if (solo || phase !== 'lobby' || here || !onPeerAway) return undefined;
    const t = setTimeout(() => { if (phaseRef.current === 'lobby') onPeerAway(initial); }, 2500);
    return () => clearTimeout(t);
  }, [phase, here]);

  const finishRound = (G, sc) => {
    if (overRef.current) return;
    overRef.current = true;
    const o = G.over || { w: 'd', why: 'time' };
    const myW = mine === 'sun' ? 'x' : 'o';
    const win = o.w === myW, draw = o.w === 'd';
    let nsc = sc || scoreRef.current;
    if (host && !sc) { nsc = { ...scoreRef.current }; if (o.w === 'x') nsc.x += 1; else if (o.w === 'o') nsc.o += 1; setScore(nsc); scoreRef.current = nsc; }
    G.sc = nsc;
    G.overAt = Date.now();
    const r = { win, draw, why: o.why, mn: G.pl[mine].n, tn: G.pl[theirs].n, sc: nsc };
    saveBest(myId, { n: r.mn, win });
    best.current = readBest(myId);
    Snd.music(false);
    setTimeout(() => { if (GR.current === G) { setResult(r); setPhase('over'); (win ? Snd.fx.win : draw ? Snd.fx.pop : Snd.fx.lose)(); if (win) { try { window.dispatchEvent(new CustomEvent('zchat-screen-fx', { detail: 'confetti' })); } catch {} } } }, 900);
    if (host && !solo && onSaveState && initial) onSaveState({ ...initial, st: 'live', exp: null, sx: nsc.x, so: nsc.o, w: nsc.x > nsc.o ? 'x' : nsc.o > nsc.x ? 'o' : 'd' });
  };

  const handleEv = (G, e, remote) => {
    const P = partsRef.current;
    const me2 = G.pl[mine];
    const near = (x, y) => Math.hypot(me2.x - x, me2.y - y) < 9;
    switch (e.k) {
      case 'eat': if (remote && e.who === mine) break; bubbles(P, e.x, e.y, e.h ? 10 : 4, 0.1); if (near(e.x, e.y)) Snd.fx.gulp(!!e.h); floatText(P, e.x, e.y - 0.4, `+${e.gain}`, e.who === 'sun' ? '#FFD27A' : '#A9DCFF'); if (e.h) burst(P, e.x, e.y, '#FFFFFF', 12); break;
      case 'eatp': Snd.fx.eatp(); burst(P, e.x, e.y, '#FFD27A', 22); floatText(P, e.x, e.y - 0.6, `+${e.gain}`, '#FFFFFF'); if (e.who === mine) say(`You ate ${peerFirst}!`, 2.4); break;
      case 'die': Snd.fx.die(); burst(P, e.x, e.y, '#FFFFFF', 16); bubbles(P, e.x, e.y, 14, 0.12); if (e.who === mine) { pendRef.current = []; try { hapticTap(); } catch {} say(e.by === 'player' ? `${peerFirst} ate you. You lost a life.` : 'A big fish ate you. You lost a life.', 2.6); } else say(e.by === 'player' ? `You ate ${peerFirst}!` : `${peerFirst} got eaten`, 2.2); break;
      case 'pick': if (remote && e.who === mine) break; Snd.fx.pick(); burst(P, e.x, e.y, '#BFEFFF', 10); if (e.who === mine) say({ shield: 'Shield on. Nothing can eat you for a moment.', double: 'Double food for a few seconds.', magnet: 'Magnet on. Small fish swim to you.', speed: 'Speed boost.' }[e.kind] || '', 2); break;
      case 'hunt': if (e.who === mine) { Snd.fx.hunt(); try { hapticTap(); } catch {} } break;
      case 'spawn': if (e.who === mine) Snd.fx.spawn(); break;
      default: break;
    }
  };

  const leave = () => { if (phase === 'play' && !solo) { setLeaveAsk(true); return; } finish(); };
  const finish = () => {
    if (!solo) {
      relay.send('bye', {});
      const sc = scoreRef.current;
      if (host && onSaveState && initial) onSaveState({ ...initial, st: sc.x + sc.o > 0 ? 'done' : 'gone', sx: sc.x, so: sc.o, w: sc.x > sc.o ? 'x' : sc.o > sc.x ? 'o' : 'd' });
    }
    Snd.music(false);
    onClose();
  };
  useBackClose(true, () => { if (quick) setQuick(false); else if (sheet) setSheet(null); else if (leaveAsk) setLeaveAsk(false); else leave(); });

  useEffect(() => () => { Snd.music(false); clearTimeout(toastTimer.current); }, []);
  useEffect(() => {
    const kd = (e) => {
      const k = e.key.toLowerCase();
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k)) { keys.current.add(k); e.preventDefault(); }
      if (k === ' ' || k === 'shift') { dashReq.current = true; e.preventDefault(); }
    };
    const ku = (e) => keys.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, []);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (ts) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, Math.max(0, (ts - last) / 1000));
      last = ts;
      const G = GR.current, cv = cvRef.current;
      if (!G || !cv) return;
      const wrap = wrapRef.current;
      const cw = wrap ? wrap.clientWidth : window.innerWidth, ch = wrap ? wrap.clientHeight : window.innerHeight;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (cv.width !== Math.round(cw * dpr) || cv.height !== Math.round(ch * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); }
      const playing = phaseRef.current === 'play' && !G.over;
      let ix = joy.current.x, iy = joy.current.y;
      const K = keys.current;
      const kx = (K.has('arrowright') || K.has('d') ? 1 : 0) - (K.has('arrowleft') || K.has('a') ? 1 : 0);
      const ky = (K.has('arrowdown') || K.has('s') ? 1 : 0) - (K.has('arrowup') || K.has('w') ? 1 : 0);
      if (kx || ky) { const l = Math.hypot(kx, ky); ix = kx / l; iy = ky / l; }
      if (sheetOpen.current || !playing) { ix = 0; iy = 0; }
      const dash = dashReq.current && playing; dashReq.current = false;
      const input = { x: ix, y: iy, dash };
      const meP = G.pl[mine];
      const wasDash = meP.dashT > 0;
      if (host) {
        if (!solo) followNet(G.pl.moon, dt);
        const inputs = { sun: input, moon: solo ? botInput(G, G.pl.moon, dt) : null };
        if (playing) hostStep(G, dt, { local: solo ? new Set(['sun', 'moon']) : new Set(['sun']), inputs });
        while (G.events.length) handleEv(G, G.events.shift(), false);
        if (G.over && !overRef.current) finishRound(G);
        if (!solo && (!G.overAt || Date.now() - G.overAt < 3000)) {
          const now = Date.now();
          if (now - sendT.current.s > 125) { sendT.current.s = now; relay.send('gs', { seed: G.seed, s: snap(G), sc: G.sc || scoreRef.current }); }
        }
      } else {
        followNet(G.pl.sun, dt);
        guestFollow(G, dt);
        for (const k of ['sun', 'moon']) { const q = G.pl[k]; if (q.dead > 0) q.dead = Math.max(0.001, q.dead - dt); }
        if (meP.respawned) { meP.respawned = false; cam.current.init = false; joy.current.x = 0; joy.current.y = 0; }
        if (playing) {
          movePlayer(G, meP, input, dt);
          tickPlayer(meP, dt);
          if (meP.dead <= 0) {
            const now = Date.now();
            for (const f of G.fish) {
              if (hiddenRef.current.has(f.id) || !canEat({ ...meP, n: meP.n }, f)) continue;
              hiddenRef.current.set(f.id, now);
              const gain = f.n * (meP.fx.double > 0 ? 2 : 1);
              pendRef.current.push({ id: f.id, gain, at: now });
              relay.send('ge', { seed: G.seed, e: { k: 'eat', id: f.id, slack: Math.ceil(gain * 0.1) } });
              meP.eat = 0.28;
              handleEv(G, { k: 'eat', who: mine, gain, x: f.x, y: f.y, h: f.k === 'h' ? 1 : 0 }, false);
            }
            for (const pk of G.pk) {
              if (hiddenRef.current.has(pk.id) || !canTake(meP, pk)) continue;
              hiddenRef.current.set(pk.id, now);
              meP.fx[pk.k] = PK_TIME[pk.k];
              relay.send('ge', { seed: G.seed, e: { k: 'pick', id: pk.id } });
              handleEv(G, { k: 'pick', who: mine, kind: pk.k, x: pk.x, y: pk.y }, false);
            }
          }
          const now = Date.now();
          meP.n = (meP.hostN || 2) + pendRef.current.filter((p) => now - p.at < 1600).reduce((a, p) => a + p.gain, 0);
        }
        G.pk = G.pk.filter((pk) => !hiddenRef.current.has(pk.id));
      }
      if (!wasDash && meP.dashT > 0) { Snd.fx.dash(); bubbles(partsRef.current, meP.x - Math.cos(meP.a) * rOf(meP.n), meP.y - Math.sin(meP.a) * rOf(meP.n), 6, 0.09); if (!solo && !host) relay.send('ge', { seed: G.seed, e: { k: 'dash' } }); }
      const other = G.pl[theirs];
      if (other.dashFx) { other.dashFx = 0; bubbles(partsRef.current, other.x, other.y, 5, 0.09); }
      if (meP.dashFx) meP.dashFx = 0;
      if (!solo) {
        const now = Date.now();
        if (now - sendT.current.p > 70) { sendT.current.p = now; relay.send('gp', { k: mine, x: +meP.x.toFixed(2), y: +meP.y.toFixed(2), vx: +meP.vx.toFixed(2), vy: +meP.vy.toFixed(2), a: +meP.a.toFixed(2), tp: meP.tp, dash: meP.dashT > 0.35 ? 1 : 0 }); }
      }
      updateParts(partsRef.current, dt);
      for (const k of ['sun', 'moon']) { const b = bubblesRef.current[k]; if (b) { b.t += dt; if (b.t > b.life) bubblesRef.current[k] = null; } }
      if (Math.random() < dt * 2 && meP.dead <= 0 && Math.hypot(meP.vx, meP.vy) > 1) bubbles(partsRef.current, meP.x - Math.cos(meP.a) * rOf(meP.n) * 0.9, meP.y, 1, 0.06);
      const C = cam.current;
      const r = rOf(meP.n);
      const zoom = clamp(cw / (8.5 + r * 3.2), 26, 72);
      if (!C.init) { C.x = meP.x; C.y = meP.y; C.z = zoom; C.init = true; }
      const k1 = 1 - Math.exp(-dt * 5);
      C.x += (meP.x - C.x) * k1; C.y += (meP.y - C.y) * k1; C.z += (zoom - C.z) * (1 - Math.exp(-dt * 2));
      const s = C.z;
      const halfW = cw / s / 2, halfH = ch / s / 2;
      const cx = WW <= halfW * 2 ? WW / 2 : clamp(C.x, halfW, WW - halfW);
      const cy = WH <= halfH * 2 ? WH / 2 : clamp(C.y, halfH - 1, WH - halfH + 0.4);
      const ox = Math.round(cw / 2 - cx * s), oy = Math.round(ch / 2 - cy * s);
      const names = { [mine]: 'You', [theirs]: peerFirst };
      render(cv.getContext('2d'), G, { cw, ch, dpr, s, ox, oy, mine, names, bubbles: bubblesRef.current, parts: partsRef.current, hidden: host ? null : hiddenRef.current, safeTop: 120, safeBottom: 200 });
      tickRef.current += dt;
      if (playing && G.left < 10.5 && Math.floor(G.left) !== Math.floor(G.left + dt) && G.left > 0) Snd.fx.tick();
      const hk = `${meP.n}|${other.n}|${meP.lives}|${other.lives}|${Math.ceil(G.left)}|${meP.dashCd > 0 ? Math.ceil(meP.dashCd * 4) : 0}|${['shield', 'double', 'magnet', 'speed'].map((x) => (meP.fx[x] > 0 ? Math.ceil(meP.fx[x]) : 0)).join(',')}`;
      if (hk !== hudKey.current) { hudKey.current = hk; setHud({ mine: meP.n, theirs: other.n, ml: meP.lives, tl: other.lives, left: G.left, dash: meP.dashCd, fx: { ...meP.fx } }); }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [solo, host]);
  const sheetOpen = useRef(false);
  sheetOpen.current = !!sheet || leaveAsk;

  const sendChat = (text) => {
    const t = String(text || '').trim().slice(0, 90);
    if (!t) return;
    bubble(mine, t);
    setLog((l) => [...l.slice(-30), { who: 'You', text: t }]);
    if (!solo) relay.send('chat', { text: t });
    setChatText(''); setSheet(null); setQuick(false);
    Snd.fx.pop();
  };
  const sendEmote = (e) => { bubble(mine, e, true); if (!solo) relay.send('emo', { e }); setQuick(false); Snd.fx.emote(); };

  const onJoyDown = (e) => {
    if (phaseRef.current !== 'play' || sheetOpen.current) return;
    if (joy.current.id != null) return;
    const r = wrapRef.current.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (x > r.width * 0.58 && y > r.height - 250) return;
    if (quick) setQuick(false);
    Snd.init();
    joy.current = { x: 0, y: 0, id: e.pointerId, cx: x, cy: y };
    setJoyView({ x, y });
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
  };
  const onJoyMove = (e) => {
    const J = joy.current;
    if (J.id !== e.pointerId) return;
    const r = wrapRef.current.getBoundingClientRect();
    const dx = e.clientX - r.left - J.cx, dy = e.clientY - r.top - J.cy, d = Math.hypot(dx, dy), R = 50;
    const k = d > R ? R / d : 1;
    if (knobRef.current) knobRef.current.style.transform = `translate(${dx * k}px,${dy * k}px)`;
    const m = Math.min(1, d / R);
    if (m < 0.12) { J.x = 0; J.y = 0; } else { const mm = (m - 0.12) / 0.88; J.x = dx / d * mm; J.y = dy / d * mm; }
  };
  const onJoyUp = (e) => { if (joy.current.id !== e.pointerId) return; joy.current = { x: 0, y: 0, id: null, cx: 0, cy: 0 }; setJoyView(null); };

  const myCol = mine === 'sun' ? '#FFB347' : '#46B7FF', theirCol = mine === 'sun' ? '#46B7FF' : '#FFB347';
  const mySc = mine === 'sun' ? score.x : score.o, theirSc = mine === 'sun' ? score.o : score.x;
  const fxList = [['shield', 'Shield', '#7FD4FF'], ['double', 'x2 food', '#FFD23F'], ['magnet', 'Magnet', '#FF6B8A'], ['speed', 'Speed', '#9BFF7A']].filter(([k]) => hud.fx[k] > 0);
  return (
    <Portal>
      <div ref={wrapRef} onPointerDown={onJoyDown} onPointerMove={onJoyMove} onPointerUp={onJoyUp} onPointerCancel={onJoyUp}
        style={{ position: 'fixed', left: 0, right: 0, top: 'var(--zvp-top, 0px)', height: 'var(--zvp-h, 100%)', zIndex: 90, background: '#0A2A4A', overflow: 'hidden', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', fontFamily: FONT, color: '#FFFFFF' }}>
        <canvas ref={cvRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, padding: 'calc(10px + env(safe-area-inset-top)) 12px 10px', display: 'flex', alignItems: 'center', gap: 10, background: 'linear-gradient(180deg, rgba(4,20,40,0.78) 0%, rgba(4,20,40,0) 100%)', pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'auto' }}>
            <RoundBtn label="Leave the game" size={42} onClick={leave}><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" /></svg></RoundBtn>
          </div>
          {phase === 'play' ? (
            <div style={{ flex: 1, minWidth: 0, display: 'flex', gap: 12, alignItems: 'center', padding: '7px 12px', borderRadius: 16, background: 'rgba(4,16,32,0.6)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12)' }}>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 15, fontWeight: 900, color: myCol, fontVariantNumeric: 'tabular-nums' }}>{hud.mine}</span>
                  <Hearts n={hud.ml} />
                </div>
                <Bar n={hud.mine} col={myCol} />
              </div>
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: hud.left < 15 ? '#FF8A8A' : '#FFFFFF' }}>{fmt(hud.left)}</div>
                <div style={{ fontSize: 9.5, fontWeight: 800, color: 'rgba(255,255,255,0.6)' }}>{`to ${TARGET}`}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 7 }}>
                  <Hearts n={hud.tl} />
                  <span style={{ fontSize: 15, fontWeight: 900, color: theirCol, fontVariantNumeric: 'tabular-nums' }}>{hud.theirs}</span>
                </div>
                <Bar n={hud.theirs} col={theirCol} right />
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15.5, fontWeight: 900 }}>Gulp</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.72)' }}>{solo ? 'Practice against a bot' : here ? `${peerFirst} is here` : here === false ? `${peerFirst} is away` : 'Connecting'}</div>
            </div>
          )}
        </div>
        {!solo && phase === 'play' && (
          <div style={{ position: 'absolute', top: 'calc(66px + env(safe-area-inset-top))', left: 12, display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'none' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: here ? (net.weak ? '#FFB347' : '#3DDC84') : '#8E8A9E' }} />
            {here && <PingChip ms={net.ping} weak={net.weak} />}
            {voice.peerMic && !voice.peerMuted && <span style={{ display: 'inline-flex', transform: 'scale(0.7)' }}><MicIcon /></span>}
          </div>
        )}
        {phase === 'play' && fxList.length > 0 && (
          <div style={{ position: 'absolute', top: 'calc(66px + env(safe-area-inset-top))', right: 12, display: 'flex', gap: 6, pointerEvents: 'none' }}>
            {fxList.map(([k, label, col]) => <span key={k} style={{ padding: '3px 8px', borderRadius: 10, background: 'rgba(4,16,32,0.7)', color: col, fontSize: 11.5, fontWeight: 900 }}>{`${label} ${Math.ceil(hud.fx[k])}`}</span>)}
          </div>
        )}
        {toast && phase === 'play' && (
          <div key={toast.at} style={{ position: 'absolute', left: '50%', top: 'calc(96px + env(safe-area-inset-top))', transform: 'translateX(-50%)', maxWidth: 'min(90%, 400px)', padding: '9px 14px', borderRadius: 16, background: 'rgba(4,16,32,0.84)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.14)', fontSize: 13.5, fontWeight: 700, lineHeight: 1.4, textAlign: 'center', pointerEvents: 'none', animation: 'zduo-toast 0.25s ease-out' }}>{toast.text}</div>
        )}
        {phase === 'play' && !solo && net.lost && (
          <div style={{ position: 'absolute', left: '50%', top: '42%', transform: 'translate(-50%, -50%)', padding: '14px 18px', borderRadius: 18, background: 'rgba(4,16,32,0.88)', display: 'flex', alignItems: 'center', gap: 10, pointerEvents: 'none', maxWidth: '86%' }}>
            <Spinner size={18} color="#FFFFFF" />
            <div style={{ fontSize: 13.5, fontWeight: 800, lineHeight: 1.35 }}>{`Waiting for ${peerFirst}'s connection`}</div>
          </div>
        )}
        {phase === 'play' && joyView && (
          <div style={{ position: 'absolute', left: joyView.x - 60, top: joyView.y - 60, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.22)', pointerEvents: 'none' }}>
            <div ref={knobRef} style={{ position: 'absolute', left: 33, top: 33, width: 54, height: 54, borderRadius: '50%', background: 'rgba(255,255,255,0.86)', boxShadow: '0 6px 16px rgba(0,0,0,0.35)' }} />
          </div>
        )}
        {phase === 'play' && !joyView && (
          <div style={{ position: 'absolute', left: 22, bottom: 'calc(28px + env(safe-area-inset-bottom))', width: 112, height: 112, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.14)', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(255,255,255,0.24)' }} />
          </div>
        )}
        {phase === 'play' && quick && !solo && (
          <div onPointerDown={(e) => e.stopPropagation()} style={{ position: 'absolute', right: 12, bottom: 'calc(214px + env(safe-area-inset-bottom))', width: 'min(300px, calc(100% - 24px))', padding: 10, borderRadius: 20, background: 'rgba(6,18,34,0.94)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.14), 0 14px 34px rgba(0,0,0,0.5)', animation: 'zduo-up 0.18s ease-out', zIndex: 5 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 6 }}>
              {EMOTES.map((e) => <button key={e} type="button" aria-label={`Send ${e}`} onClick={(ev) => { ev.stopPropagation(); sendEmote(e); }} style={{ ...btnBase, height: 46, borderRadius: 14, background: 'rgba(255,255,255,0.08)', fontSize: 26, lineHeight: 1 }}>{e}</button>)}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {QUICK.map((p) => <button key={p} type="button" onClick={(ev) => { ev.stopPropagation(); tap(); sendChat(p); }} style={{ ...btnBase, height: 34, padding: '0 12px', borderRadius: 17, background: 'rgba(255,255,255,0.1)', color: '#FFFFFF', fontSize: 12.5, fontWeight: 700 }}>{p}</button>)}
              <button type="button" onClick={(ev) => { ev.stopPropagation(); tap(); setQuick(false); setSheet({ k: 'chat' }); }} style={{ ...btnBase, height: 34, padding: '0 12px', borderRadius: 17, background: 'rgba(255,255,255,0.18)', color: '#FFFFFF', fontSize: 12.5, fontWeight: 800 }}>Type a message</button>
            </div>
          </div>
        )}
        {phase === 'play' && (
          <div style={{ position: 'absolute', right: 14, bottom: 'calc(22px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
            <div style={{ position: 'relative' }}>
              <RoundBtn label="Dash" size={74} onClick={() => { dashReq.current = true; }} bg={hud.dash > 0 ? 'rgba(14,22,40,0.7)' : 'linear-gradient(180deg, #4FD0FF 0%, #1E86D6 100%)'} style={{ boxShadow: hud.dash > 0 ? 'inset 0 0 0 1px rgba(255,255,255,0.16)' : '0 4px 0 #135A96, 0 10px 22px rgba(0,0,0,0.4)' }}><DashIcon /></RoundBtn>
              {hud.dash > 0 && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, pointerEvents: 'none' }}>{Math.ceil(hud.dash)}</div>}
            </div>
            {!solo && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 50px)', gap: 8 }}>
                <RoundBtn size={50} label={voice.peerMuted ? `Unmute ${peerFirst}` : `Mute ${peerFirst}`} onClick={voice.togglePeer} bg={voice.peerMuted ? 'rgba(217,75,75,0.85)' : 'rgba(4,16,32,0.62)'}><SpeakerIcon off={voice.peerMuted} /></RoundBtn>
                <RoundBtn size={50} label={voice.micOn ? 'Turn your mic off' : 'Turn your mic on'} onClick={voice.toggle} bg={voice.micOn ? 'rgba(46,180,99,0.9)' : 'rgba(4,16,32,0.62)'}><MicIcon off={!voice.micOn} /></RoundBtn>
                <RoundBtn size={50} label="Quick messages and emojis" onClick={() => setQuick((v) => !v)} bg={quick ? 'rgba(255,255,255,0.28)' : 'rgba(4,16,32,0.62)'}><SmileIcon /></RoundBtn>
                <RoundBtn size={50} label="Chat" onClick={() => { setQuick(false); setSheet({ k: 'chat' }); }} bg="rgba(4,16,32,0.62)"><ChatIcon /></RoundBtn>
              </div>
            )}
          </div>
        )}
        {voice.err && phase === 'play' && <div style={{ position: 'absolute', right: 14, bottom: 'calc(220px + env(safe-area-inset-bottom))', padding: '6px 10px', borderRadius: 12, background: 'rgba(217,75,75,0.9)', fontSize: 12, fontWeight: 800 }}>{voice.err}</div>}

        {phase === 'lobby' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'radial-gradient(circle at 50% 30%, #1C6FA8 0%, #0A2A4A 70%)' }}>
            <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center', padding: '26px 20px', borderRadius: 26, background: 'rgba(4,16,32,0.82)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12)', animation: 'zduo-pop 0.3s ease-out' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Avatar emoji={me && me.avatar} name={(me && me.name) || 'You'} size={58} />
                <Avatar emoji={peer && peer.avatar} name={(peer && peer.name) || 'Friend'} size={58} />
              </div>
              <div style={{ fontSize: 21, fontWeight: 900 }}>{here === false || here == null ? `Waiting for ${peerFirst}` : 'Joining'}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>{`The game starts when ${peerFirst} opens it.`}</div>
              <Spinner size={22} color="#FFFFFF" />
              <Btn label="Leave" onClick={finish} />
            </div>
          </div>
        )}

        {phase === 'ready' && (
          <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: 'calc(70px + env(safe-area-inset-top)) 16px calc(24px + env(safe-area-inset-bottom))', boxSizing: 'border-box', background: 'radial-gradient(circle at 50% 0%, #2A8FCB 0%, #0F4C7E 45%, #082A4C 100%)' }}>
            <div style={{ maxWidth: 440, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <img src="/gulp-art.webp" alt="" draggable={false} style={{ width: '100%', aspectRatio: '16 / 10', objectFit: 'cover', borderRadius: 22, boxShadow: '0 12px 30px rgba(0,0,0,0.35)' }} />
              <div style={{ fontSize: 26, fontWeight: 900, textAlign: 'center' }}>Gulp</div>
              {!solo && (score.x + score.o > 0) && <div style={{ textAlign: 'center', fontSize: 15, fontWeight: 900 }}>{`You ${mySc} : ${theirSc} ${peerFirst}`}</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, padding: '14px 14px', borderRadius: 20, background: 'rgba(4,16,32,0.55)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)' }}>
                {[
                  ['#C8FFB0', 'Green numbers are food', 'You start at 2. Eat fish with a number smaller than or equal to yours, and their number adds to yours.'],
                  ['#FF9A9A', 'Red numbers eat you', 'Big hunters chase you for a moment, then give up. Dash away or hide behind smaller fish.'],
                  [mine === 'sun' ? '#46B7FF' : '#FFB347', solo ? 'Race the bot' : `Race ${peerFirst}`, `If you are bigger you can eat ${solo ? 'the bot' : peerFirst} too. First to ${TARGET} wins, or the last one with hearts left.`],
                  ['#FFD23F', 'Grab the bubbles', 'Shield, double food, magnet and speed. Dash with the big button.'],
                ].map(([c, t1, t2]) => (
                  <div key={t1} style={{ display: 'flex', gap: 10 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 5, background: c, marginTop: 5, flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 900 }}>{t1}</div><div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>{t2}</div></div>
                  </div>
                ))}
              </div>
              {best.current.top ? <div style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>{`Your biggest fish: ${best.current.top}`}</div> : null}
              {host && !solo && !here && <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>{`Waiting for ${peerFirst} to open the game`}</div>}
              {host ? <Btn kind="gold" label={solo ? 'Start practice' : 'Start'} disabled={!solo && !here} onClick={() => startRound(newSeed())} style={{ height: 52 }} /> : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13.5, fontWeight: 800, color: 'rgba(255,255,255,0.8)' }}><Spinner size={16} color="#FFFFFF" />{`${peerFirst} starts the round`}</div>}
              <Btn label={solo ? 'Leave' : 'Back to chat'} onClick={finish} />
            </div>
          </div>
        )}

        {phase === 'over' && result && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(2,10,22,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
            <div style={{ width: '100%', maxWidth: 350, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center', padding: '24px 20px', borderRadius: 26, background: '#0C2238', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12), 0 20px 50px rgba(0,0,0,0.5)', animation: 'zduo-pop 0.32s ease-out' }}>
              <div style={{ fontSize: 26, fontWeight: 900 }}>{result.draw ? 'Draw' : result.win ? 'You won' : `${peerFirst} won`}</div>
              <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.75)' }}>{result.why === 'size' ? `${result.win ? 'You' : peerFirst} reached ${TARGET} first.` : result.why === 'lives' ? `${result.win ? peerFirst : 'You'} ran out of hearts.` : result.why === 'left' ? `${peerFirst} left the game.` : 'Time is up. The bigger fish wins.'}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, width: '100%' }}>
                {[['You', result.mn, myCol], [peerFirst, result.tn, theirCol]].map(([a, b, c]) => (
                  <div key={a} style={{ padding: '10px 6px', borderRadius: 14, background: 'rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: c, fontVariantNumeric: 'tabular-nums' }}>{b}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{a}</div>
                  </div>
                ))}
              </div>
              {!solo && <div style={{ fontSize: 15, fontWeight: 900 }}>{`Rounds ${mySc} : ${theirSc}`}</div>}
              {host && (result.why !== 'left' || here) ? <Btn kind="go" label="Play again" onClick={() => startRound(newSeed())} style={{ width: '100%' }} /> : result.why !== 'left' ? <div style={{ fontSize: 13.5, fontWeight: 700, color: 'rgba(255,255,255,0.72)' }}>{`${peerFirst} starts the next round`}</div> : null}
              <Btn label={solo ? 'Leave' : 'Back to chat'} onClick={finish} style={{ width: '100%' }} />
            </div>
          </div>
        )}

        {sheet && sheet.k === 'chat' && (
          <Sheet title={`Talk to ${peerFirst}`} onClose={() => setSheet(null)}>
            {log.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '12px 0 4px', maxHeight: 150, overflowY: 'auto' }}>
                {log.slice(-8).map((m, i) => <div key={i} style={{ fontSize: 13.5, lineHeight: 1.4 }}><span style={{ fontWeight: 800, color: m.who === 'You' ? '#FFCB7A' : '#A9CCFF' }}>{m.who}</span> <span style={{ color: 'rgba(255,255,255,0.85)' }}>{m.text}</span></div>)}
              </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {PHRASES.map((p) => <button key={p} type="button" onClick={() => { tap(); sendChat(p); }} style={{ ...btnBase, height: 38, padding: '0 14px', borderRadius: 19, background: 'rgba(255,255,255,0.1)', color: '#FFFFFF', fontSize: 13.5, fontWeight: 700 }}>{p}</button>)}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); sendChat(chatText); }} style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <input value={chatText} onChange={(e) => setChatText(e.target.value)} maxLength={90} placeholder="Write a message" aria-label="Message"
                style={{ flex: 1, minWidth: 0, height: 46, borderRadius: 23, border: 'none', background: 'rgba(255,255,255,0.1)', color: '#FFFFFF', padding: '0 16px', fontSize: 16, fontFamily: FONT, outline: 'none' }} />
              <Btn kind="go" label="Send" onClick={() => sendChat(chatText)} disabled={!chatText.trim()} />
            </form>
          </Sheet>
        )}
        {leaveAsk && (
          <Sheet title="Leave the game?" text={`${peerFirst} wins this round if you leave.`} onClose={() => setLeaveAsk(false)}>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <Btn label="Stay" onClick={() => setLeaveAsk(false)} style={{ flex: 1 }} />
              <Btn kind="danger" label="Leave" onClick={() => { setLeaveAsk(false); finish(); }} style={{ flex: 1 }} />
            </div>
          </Sheet>
        )}
      </div>
    </Portal>
  );
}

export default GulpGamePage;
