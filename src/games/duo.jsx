import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, Portal, useBackClose, hapticTap, FONT, Spinner, gameIceConfig } from '../App.jsx';
import { useGameRelay } from './relay.jsx';
import { LEVELS, LIVES, GLYPHS, GLYPH_NAMES, makeWorld, stepWorld, applyEvent, snapshot, mergeSnapshot, setNet, nearDial, tryCode, hintFor, alive, clamp } from './duoengine.js';
import { Snd, buildStatic, render, updateParts, dust, puffs, embers, glints, part, glyph } from './duodraw.js';

const PHRASES = ['Wait for me', 'Go ahead', 'Over here', 'Pull your lever', 'Stand on the plate', 'Come closer, I need light', 'On three', 'Nice one', 'Sorry'];
const BEST_KEY = (uid) => `zchat-duo-best-${uid || 'me'}`;
function readBest(uid) { try { return JSON.parse(localStorage.getItem(BEST_KEY(uid)) || '{}') || {}; } catch { return {}; } }
function saveBest(uid, li, r) {
  try {
    const all = readBest(uid);
    const old = all[li] || {};
    all[li] = { stars: Math.max(old.stars || 0, r.stars), time: old.time ? Math.min(old.time, r.time) : r.time, chest: !!(old.chest || r.chest) };
    localStorage.setItem(BEST_KEY(uid), JSON.stringify(all));
  } catch {}
}
const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const tap = () => { try { hapticTap(); } catch {} Snd.init(); Snd.fx.click(); };

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
function GemIcon({ k, size = 16 }) {
  const c1 = k === 'sun' ? '#FFB020' : '#2F7BFF', c2 = k === 'sun' ? '#FFE08A' : '#A8CCFF';
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true"><path d="M3 7.5 6 3.5h8l3 4-7 9.5z" fill={c1} /><path d="M3 7.5 6 3.5l2.6 4zM8.6 7.5 6 3.5h5z" fill={c2} opacity="0.9" /><path d="M10 17 3 7.5h5.6z" fill="#FFFFFF" opacity="0.18" /></svg>
  );
}
function Heart({ on }) {
  return <svg width="20" height="18" viewBox="0 0 24 22" aria-hidden="true"><path d="M12 21s-9.5-6.2-9.5-12.6C2.5 4.9 5 2.5 8 2.5c1.8 0 3.2.9 4 2.3.8-1.4 2.2-2.3 4-2.3 3 0 5.5 2.4 5.5 5.9C21.5 14.8 12 21 12 21z" fill={on ? '#FF5A6E' : 'rgba(255,255,255,0.16)'} stroke={on ? '#C2283F' : 'rgba(255,255,255,0.25)'} strokeWidth="1.4" /></svg>;
}
function KeyIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><circle cx="7.5" cy="12" r="4" fill="none" stroke="#DCEBFF" strokeWidth="2.4" /><path d="M11.5 12h9M17.5 12v3M14.5 12v2.4" stroke="#DCEBFF" strokeWidth="2.4" strokeLinecap="round" /></svg>;
}
function MicIcon({ off }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round">
      <rect x="9" y="3" width="6" height="11" rx="3" fill={off ? 'none' : '#FFFFFF'} />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
      {off && <path d="M4 4l16 16" stroke="#FF6B6B" strokeWidth="2.4" />}
    </svg>
  );
}
function ChatIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinejoin="round"><path d="M4 5.5h16v10H10l-4.5 3.5V15.5H4z" /></svg>;
}
function SwapIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7h11l-3-3M17 17H6l3 3" /></svg>;
}
function HandIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#3A2508" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 13V6.2a1.6 1.6 0 0 1 3.2 0V11M11.2 11V4.6a1.6 1.6 0 0 1 3.2 0V11M14.4 11V6a1.6 1.6 0 0 1 3.2 0v8c0 4.1-2.7 7.2-6.6 7.2-2.6 0-4.4-1.3-5.8-3.5l-2.4-3.8c-.8-1.3.9-2.6 2-1.5L8 15.6" /></svg>;
}

const btnBase = { border: 'none', fontFamily: FONT, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, WebkitTapHighlightColor: 'transparent' };
function Btn({ label, onClick, kind = 'glass', disabled, style, ariaLabel, children }) {
  const bg = kind === 'go' ? 'linear-gradient(180deg, #52D681 0%, #2FB463 100%)' : kind === 'gold' ? 'linear-gradient(180deg, #FFD36B 0%, #F2A93B 100%)' : kind === 'danger' ? '#D94B4B' : 'rgba(255,255,255,0.14)';
  const shadow = kind === 'go' ? '0 3px 0 #1E8A47' : kind === 'gold' ? '0 3px 0 #B9741C' : 'inset 0 0 0 1px rgba(255,255,255,0.16)';
  return (
    <button type="button" aria-label={ariaLabel || label} disabled={disabled} onClick={(e) => { e.stopPropagation(); if (!disabled && onClick) { tap(); onClick(e); } }}
      style={{ ...btnBase, height: 48, padding: '0 20px', borderRadius: 24, background: bg, color: kind === 'gold' ? '#3A2508' : '#FFFFFF', boxShadow: shadow, fontSize: 15.5, opacity: disabled ? 0.45 : 1, ...style }}>
      {children}{label}
    </button>
  );
}
function RoundBtn({ onClick, label, children, size = 54, bg = 'rgba(14,12,22,0.62)', style }) {
  return (
    <button type="button" aria-label={label} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); tap(); onClick && onClick(); }}
      style={{ ...btnBase, width: size, height: size, borderRadius: '50%', background: bg, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.16), 0 6px 16px rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', ...style }}>
      {children}
    </button>
  );
}
function Sheet({ title, text, onClose, children }) {
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, maxHeight: '86%', overflowY: 'auto', borderRadius: '26px 26px 0 0', background: '#17141F', padding: '18px 18px calc(18px + env(safe-area-inset-bottom))', boxShadow: '0 -12px 40px rgba(0,0,0,0.5)', color: '#FFFFFF', fontFamily: FONT, boxSizing: 'border-box', animation: 'zduo-up 0.26s cubic-bezier(.2,.8,.2,1)' }}>
        <div style={{ width: 38, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)', margin: '-6px auto 12px' }} />
        {title && <div style={{ fontSize: 19, fontWeight: 900 }}>{title}</div>}
        {text && <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.72)', marginTop: 6, lineHeight: 1.5 }}>{text}</div>}
        {children}
      </div>
    </div>
  );
}
function Stars({ n, size = 18 }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {[0, 1, 2].map((i) => <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.6l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z" fill={i < n ? '#FFC93C' : 'rgba(255,255,255,0.14)'} stroke={i < n ? '#C98A16' : 'none'} strokeWidth="1.2" strokeLinejoin="round" /></svg>)}
    </div>
  );
}

let cssDone = false;
function injectCss() {
  if (cssDone || typeof document === 'undefined') return;
  cssDone = true;
  const st = document.createElement('style');
  st.textContent = '@keyframes zduo-up{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}@keyframes zduo-pop{0%{transform:scale(.85);opacity:0}60%{transform:scale(1.04);opacity:1}100%{transform:scale(1)}}@keyframes zduo-toast{from{transform:translate(-50%,-8px);opacity:0}to{transform:translate(-50%,0);opacity:1}}';
  document.head.appendChild(st);
}

function useVoice(relay, enabled, host) {
  const [micOn, setMicOn] = useState(false);
  const [peerMic, setPeerMic] = useState(false);
  const [err, setErr] = useState('');
  const S = useRef({ pc: null, tr: null, track: null, stream: null, queue: [], audio: null, making: false });
  const send = (t, d) => { if (relay) relay.send(t, d || {}); };
  const attach = (pc) => {
    pc.ontrack = (e) => {
      const s = S.current;
      if (!s.audio) { s.audio = new Audio(); s.audio.autoplay = true; s.audio.playsInline = true; }
      s.audio.srcObject = e.streams && e.streams[0] ? e.streams[0] : new MediaStream([e.track]);
      const r = s.audio.play(); if (r && r.catch) r.catch(() => {});
    };
    pc.onicecandidate = (e) => { if (e.candidate) send('rtc', { c: e.candidate.toJSON ? e.candidate.toJSON() : e.candidate }); };
    pc.onconnectionstatechange = () => { if (pc.connectionState === 'failed') setErr('Voice could not connect'); };
  };
  const flushIce = async () => {
    const s = S.current;
    if (!s.pc || !s.pc.remoteDescription) return;
    const q = s.queue.splice(0);
    for (const c of q) { try { await s.pc.addIceCandidate(c); } catch {} }
  };
  const hostOffer = async () => {
    const s = S.current;
    if (s.making) return;
    s.making = true;
    try {
      if (!s.pc) {
        const cfg = await gameIceConfig();
        s.pc = new RTCPeerConnection(cfg);
        attach(s.pc);
        s.tr = s.pc.addTransceiver('audio', { direction: 'sendrecv' });
        if (s.track) await s.tr.sender.replaceTrack(s.track);
      }
      const offer = await s.pc.createOffer();
      await s.pc.setLocalDescription(offer);
      send('rtc', { sdp: { type: offer.type, sdp: offer.sdp } });
    } catch { setErr('Voice could not connect'); }
    s.making = false;
  };
  useEffect(() => {
    if (!relay || !enabled) return undefined;
    const offs = [
      relay.on('rtc', async (m) => {
        const s = S.current;
        try {
          if (m.sdp && m.sdp.type === 'offer' && !host) {
            if (!s.pc) { const cfg = await gameIceConfig(); s.pc = new RTCPeerConnection(cfg); attach(s.pc); }
            await s.pc.setRemoteDescription(m.sdp);
            s.tr = s.pc.getTransceivers()[0] || s.pc.addTransceiver('audio', { direction: 'sendrecv' });
            try { s.tr.direction = 'sendrecv'; } catch {}
            if (s.track) await s.tr.sender.replaceTrack(s.track);
            const ans = await s.pc.createAnswer();
            await s.pc.setLocalDescription(ans);
            send('rtc', { sdp: { type: ans.type, sdp: ans.sdp } });
            flushIce();
          } else if (m.sdp && m.sdp.type === 'answer' && host && s.pc) {
            await s.pc.setRemoteDescription(m.sdp);
            flushIce();
          } else if (m.c) {
            s.queue.push(m.c);
            flushIce();
          }
        } catch { setErr('Voice could not connect'); }
      }),
      relay.on('rtcneed', () => { if (host) hostOffer(); }),
      relay.on('mic', (m) => setPeerMic(!!m.on)),
      relay.on('hi', () => { if (S.current.track) send('mic', { on: true }); if (host && S.current.pc) { S.current.pc.close(); S.current.pc = null; S.current.tr = null; if (S.current.track) hostOffer(); } }),
    ];
    return () => offs.forEach((f) => f && f());
  }, [relay, enabled, host]);
  useEffect(() => () => {
    const s = S.current;
    try { if (s.track) s.track.stop(); } catch {}
    try { if (s.pc) s.pc.close(); } catch {}
    try { if (s.audio) { s.audio.srcObject = null; } } catch {}
  }, []);
  const toggle = async () => {
    const s = S.current;
    setErr('');
    if (micOn) {
      try { if (s.tr) await s.tr.sender.replaceTrack(null); } catch {}
      try { if (s.track) s.track.stop(); } catch {}
      s.track = null;
      setMicOn(false);
      send('mic', { on: false });
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { setErr('Voice is not available on this device'); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      s.track = stream.getAudioTracks()[0];
      setMicOn(true);
      send('mic', { on: true });
      if (s.tr) { try { await s.tr.sender.replaceTrack(s.track); } catch {} }
      else if (host) hostOffer();
      else send('rtcneed', {});
      if (s.audio) { const r = s.audio.play(); if (r && r.catch) r.catch(() => {}); }
    } catch { setErr('Allow the microphone to talk'); }
  };
  return { micOn, peerMic, err, toggle };
}

export function DuoGamePage({ solo = false, initial, me, peer, myId, onClose, onSaveState, onRematch, onPeerAway }) {
  injectCss();
  const gameId = (initial && initial.id) || 'solo';
  const host = solo || !initial || initial.x === myId;
  const myKind = host ? 'sun' : 'moon';
  const theirKind = myKind === 'sun' ? 'moon' : 'sun';
  const peerFirst = solo ? 'Partner' : String((peer && peer.name) || 'Friend').split(' ')[0];
  const meFirst = String((me && me.name) || 'You').split(' ')[0];
  const relay = useGameRelay({ id: solo ? null : `duo-${gameId}`, myId, peerId: peer && peer.id, enabled: !solo, g: 'duo' });
  const here = solo ? true : relay.here;
  const voice = useVoice(solo ? null : relay, !solo, host && !solo);
  const [phase, setPhase] = useState(solo ? 'pick' : 'lobby');
  const [li, setLi] = useState(0);
  const [hud, setHud] = useState({ lives: LIVES, gems: { sun: [0, 0], moon: [0, 0] }, key: null, chest: false });
  const [toast, setToast] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [active, setActive] = useState(myKind);
  const [result, setResult] = useState(null);
  const [best, setBest] = useState(() => readBest(myId));
  const [nearUse, setNearUse] = useState(false);
  const [chatText, setChatText] = useState('');
  const [log, setLog] = useState([]);
  const [leaveAsk, setLeaveAsk] = useState(false);
  const [cleared, setCleared] = useState(0);
  if (typeof window !== 'undefined' && window.__zfake) window.__zduo = { world: () => WR.current };
  const cvRef = useRef(null);
  const wrapRef = useRef(null);
  const WR = useRef(null);
  const statRef = useRef({ cv: null, s: 0, li: -1, a: -1 });
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
  const [joyView, setJoyView] = useState(null);
  const knobRef = useRef(null);
  const toastTimer = useRef(0);
  const hudKey = useRef('');
  const solved = useRef(false);
  const outRef = useRef(false);

  const say = (text, sec) => {
    setToast({ text, at: Date.now() });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), (sec || 3) * 1000);
  };
  const bubble = (kind, text) => { bubbles.current[kind] = { text, t: 0, life: Math.max(3.4, text.length * 0.075) }; };

  const startLevel = (i, attempt, quiet) => {
    const a = attempt == null ? Date.now() % 100000 : attempt;
    const W = makeWorld(i, gameId, a);
    WR.current = W;
    statRef.current = { cv: null, s: 0, li: -1, a: -1 };
    cam.current.init = false;
    setLi(i);
    setResult(null);
    setSheet(null);
    setActive(myKind);
    hintsSeen.current = new Set();
    solved.current = false;
    outRef.current = false;
    setPhase('play');
    Snd.init();
    Snd.music(true);
    if (!solo && host && !quiet) relay.send('lv', { li: i, a });
    say(LEVELS[i].goal, 4.5);
    if (!solo && host && onSaveState && initial && initial.st !== 'live') onSaveState({ ...initial, st: 'live', exp: null });
  };

  useEffect(() => {
    if (solo) return undefined;
    const offs = [
      relay.on('lv', (m) => { if (!host) startLevel(m.li, m.a, true); }),
      relay.on('pick', () => { if (!host) { WR.current = null; setPhase((p) => (p === 'lobby' || p === 'won' || p === 'out' || p === 'play' ? 'pick' : p)); } }),
      relay.on('ev', (m) => { const W = WR.current; if (W && m.li === W.li && m.a === W.attempt) applyEvent(W, m.e, true); }),
      relay.on('p', (m) => { const W = WR.current; if (W && m.li === W.li && m.a === W.attempt && m.k === theirKind) setNet(W, theirKind, m); }),
      relay.on('sync', (m) => {
        const W = WR.current;
        if (host) return;
        if (!W || m.s.li !== W.li || m.s.a !== W.attempt) { if (m.play) { startLevel(m.s.li, m.s.a, true); mergeSnapshot(WR.current, m.s); } else if (phaseRef.current === 'lobby') setPhase('pick'); return; }
        mergeSnapshot(W, m.s);
      }),
      relay.on('chat', (m) => { const text = String(m.text || '').slice(0, 90); if (!text) return; bubble(theirKind, text); setLog((l) => [...l.slice(-30), { who: peerFirst, text }]); Snd.fx.pop(); }),
      relay.on('hi', () => { if (host) sendSync(); }),
      relay.on('bye', () => { say(`${peerFirst} left the game`, 4); }),
    ];
    return () => offs.forEach((f) => f && f());
  }, [relay.on, host]);

  const sendSync = () => {
    const W = WR.current;
    if (solo || !host) return;
    if (W) relay.send('sync', { s: snapshot(W), play: phaseRef.current === 'play' || phaseRef.current === 'won' || phaseRef.current === 'out' });
    else relay.send('pick', {});
  };
  useEffect(() => {
    if (solo || !host) return undefined;
    const iv = setInterval(sendSync, 2500);
    return () => clearInterval(iv);
  }, [solo, host]);
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
    if (phase === 'play' && !solo) { setLeaveAsk(true); return; }
    finish();
  };
  const finish = () => {
    if (!solo) {
      relay.send('bye', {});
      if (host && onSaveState && initial) onSaveState({ ...initial, st: cleared > 0 ? 'done' : 'gone', sx: cleared, so: cleared, w: null });
    }
    Snd.music(false);
    onClose();
  };
  useBackClose(true, () => { if (sheet) setSheet(null); else if (leaveAsk) setLeaveAsk(false); else leave(); });

  useEffect(() => {
    const kd = (e) => {
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k)) {
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
        keys.current.add(k); e.preventDefault();
      }
      if (k === 'e' || k === ' ') { if (e.target && e.target.tagName === 'INPUT') return; useAction(); }
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
    if (nearDial(W, p)) setSheet({ k: 'dial', picks: [] });
  };

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (ts) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, Math.max(0, (ts - last) / 1000));
      last = ts;
      const W = WR.current;
      const cv = cvRef.current;
      if (!W || !cv) return;
      const wrap = wrapRef.current;
      const cw = wrap ? wrap.clientWidth : window.innerWidth, ch = wrap ? wrap.clientHeight : window.innerHeight;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (cv.width !== Math.round(cw * dpr) || cv.height !== Math.round(ch * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); }
      const s = Math.round(clamp(cw / 7.4, 44, 66));
      if (!statRef.current.cv || statRef.current.s !== s || statRef.current.li !== W.li || statRef.current.a !== W.attempt) statRef.current = { cv: buildStatic(W, s * dpr), s, li: W.li, a: W.attempt };
      const playing = phaseRef.current === 'play';
      const act = activeRef.current;
      let ix = joy.current.x, iy = joy.current.y;
      const K = keys.current;
      const kx = (K.has('arrowright') || K.has('d') ? 1 : 0) - (K.has('arrowleft') || K.has('a') ? 1 : 0);
      const ky = (K.has('arrowdown') || K.has('s') ? 1 : 0) - (K.has('arrowup') || K.has('w') ? 1 : 0);
      if (kx || ky) { const l = Math.hypot(kx, ky); ix = kx / l; iy = ky / l; }
      if (sheetOpen.current) { ix = 0; iy = 0; }
      const local = solo ? new Set(['sun', 'moon']) : new Set([myKind]);
      const inputs = { sun: { x: 0, y: 0 }, moon: { x: 0, y: 0 } };
      inputs[act] = { x: ix, y: iy };
      stepWorld(W, dt, { local, host, playing, inputs });
      updateParts(W, dt);
      for (const k of ['sun', 'moon']) { const b = bubbles.current[k]; if (b) { b.t += dt; if (b.t > b.life) bubbles.current[k] = null; } }
      const myP = W.p[act];
      if (myP.step) { myP.step = false; Snd.fx.step(); if (Math.random() < 0.5) dust(W, myP.x, myP.y, 1); }
      const other = W.p[act === 'sun' ? 'moon' : 'sun'];
      if (other.step) other.step = false;
      while (W.fx.length) handleFx(W, W.fx.shift());
      if (!solo) {
        while (W.outbox.length) relay.send('ev', { e: W.outbox.shift(), li: W.li, a: W.attempt });
        const P = W.p[myKind];
        const now = Date.now();
        const moved = Math.hypot(P.x - lastSend.current.x, P.y - lastSend.current.y) > 0.02;
        if ((moved && now - lastSend.current.at > 80) || now - lastSend.current.at > 500 || P.moving !== lastSend.current.m) {
          relay.send('p', { k: myKind, x: +P.x.toFixed(3), y: +P.y.toFixed(3), vx: +P.vx.toFixed(2), vy: +P.vy.toFixed(2), d: P.dir, m: P.moving ? 1 : 0, dd: P.dead > 0 ? 1 : 0, why: P.die, li: W.li, a: W.attempt });
          lastSend.current = { at: now, x: P.x, y: P.y, m: P.moving };
        }
      } else W.outbox.length = 0;
      if (playing) {
        hintT.current -= dt;
        if (hintT.current <= 0) {
          const h = hintFor(W, myP);
          if (h && !hintsSeen.current.has(h[0])) { hintsSeen.current.add(h[0]); say(h[1], 4); hintT.current = 3; }
        }
        const nu = nearDial(W, myP);
        if (nu !== nearRef.current) { nearRef.current = nu; setNearUse(nu); }
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
      const ctx = cv.getContext('2d');
      render(ctx, W, { cw, ch, dpr, s, ox, oy, me: myP, names, bubbles: bubbles.current, stat: statRef.current.cv, them: act === 'sun' ? 'moon' : 'sun', safeTop: 110, safeBottom: 190 });
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
  const nearRef = useRef(false);
  const sheetOpen = useRef(false);
  sheetOpen.current = !!sheet || leaveAsk;

  const handleFx = (W, f) => {
    const mineK = activeRef.current;
    switch (f.k) {
      case 'lever': Snd.fx.lever(); puffs(W, f.x, f.y + 0.4, 1, 3); if (f.who === mineK) say(Object.values(W.levers).filter((l) => !l.on).length ? 'Lever pulled. The gate needs every lever of its colour.' : 'Lever pulled.'); break;
      case 'gate': setTimeout(() => Snd.fx.gate(), 250); say('The gate opens.'); break;
      case 'gem': Snd.fx.gem(); glints(W, f.x + 0.5, f.y + 0.35, f.kk === 'sun' ? '#FFD27A' : '#9FD0FF'); break;
      case 'burn': Snd.fx.burn(); break;
      case 'vinesdone': { const [vx, vy] = W.vines.tiles[0] || [0, 0]; puffs(W, vx, vy + 0.2, 1, 8, 'rgba(90,90,90,0.4)'); say('A secret room behind the vines.'); break; }
      case 'key': Snd.fx.key(); if (W.key) glints(W, W.key.x, W.key.y - 0.3, '#CFE3FF'); say(f.who === mineK ? 'You found a secret key. Find the chest it opens.' : 'Your partner found a secret key.'); break;
      case 'chest': Snd.fx.chest(); if (W.chest) for (let i = 0; i < 26; i++) part(W, W.chest.x + 0.5 + (Math.random() - 0.5) * 0.6, W.chest.y + 0.2, (Math.random() - 0.5) * 2.4, -1.2 - Math.random() * 1.8, 1.1, i % 2 ? '#FFE08A' : '#BFE0FF', 0.05, 'ember'); say('The secret chest is open!'); break;
      case 'code': Snd.fx.door(); say('The code door slides open.'); break;
      case 'fire': Snd.fx.fire(); if (W.braz) { const z = W.braz[f.b]; embers(W, z.x + 0.5, z.y + 0.15, f.b === 'F' ? '#FFB347' : '#8CC8FF', 18); } if (!W.great.open) say('Fire lit. Light the other one before this one burns out.', 3); break;
      case 'fizz': Snd.fx.fizz(); break;
      case 'great': setTimeout(() => Snd.fx.door(), 250); say('Both fires are lit. The great door opens.'); break;
      case 'die': {
        ({ lava: Snd.fx.sizzle, water: Snd.fx.splash, goo: Snd.fx.goo, fall: Snd.fx.fall }[f.why] || Snd.fx.hurt)();
        setTimeout(() => Snd.fx.heart(), 250);
        const col = f.why === 'lava' ? '#FFB347' : f.why === 'water' ? 'rgba(235,245,255,0.8)' : f.why === 'goo' ? '#8BE04E' : 'rgba(255,255,255,0.4)';
        for (let i = 0; i < 16; i++) part(W, f.x + (Math.random() - 0.5) * 0.4, f.y - 0.35, (Math.random() - 0.5) * 1.8, -0.4 - Math.random() * 1.6, 0.8, col, f.why === 'water' ? 0.09 : 0.045, f.why === 'water' ? 'puff' : 'ember');
        if (f.who === mineK) { try { hapticTap(); } catch {} }
        if (!W.out) say(W.lives === 1 ? 'One heart left. Go slow.' : f.who === mineK ? 'Ouch. Back to the last flag.' : `${solo ? 'Your partner' : peerFirst} fell. Back to the flag.`, 2.6);
        break;
      }
      case 'flag': if (f.who === mineK) Snd.fx.flag(); break;
      case 'spawn': dust(W, W.p[f.who].x, W.p[f.who].y, 6); break;
      case 'out': Snd.fx.bad(); break;
      case 'win': Snd.fx.win(); break;
      default: break;
    }
  };

  const onWin = (W) => {
    if (solved.current) return;
    solved.current = true;
    const gemsAll = W.gems.every((g) => g.taken);
    const noLoss = W.deaths.size === 0;
    const stars = 1 + (gemsAll ? 1 : 0) + (noLoss ? 1 : 0);
    const r = { li: W.li, time: W.time, stars, gems: W.gems.filter((g) => g.taken).length, gemsTotal: W.gems.length, chest: !!(W.chest && W.chest.done), hasChest: !!W.chest, deaths: W.deaths.size };
    saveBest(myId, W.li, r);
    setBest(readBest(myId));
    setResult(r);
    setCleared((c) => Math.max(c, W.li + 1));
    setPhase('won');
    try { window.dispatchEvent(new CustomEvent('zchat-screen-fx', { detail: 'confetti' })); } catch {}
  };

  const sendChat = (text) => {
    const t = String(text || '').trim().slice(0, 90);
    if (!t) return;
    bubble(activeRef.current, t);
    setLog((l) => [...l.slice(-30), { who: 'You', text: t }]);
    if (!solo) relay.send('chat', { text: t });
    setChatText('');
    setSheet(null);
    Snd.fx.pop();
  };

  const onJoyDown = (e) => {
    if (phaseRef.current !== 'play' || sheetOpen.current) return;
    if (joy.current.id != null) return;
    const r = wrapRef.current.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (x > r.width * 0.62 && y > r.height - 220) return;
    Snd.init();
    joy.current = { x: 0, y: 0, id: e.pointerId, cx: x, cy: y, show: true };
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
    if (m < 0.14) { J.x = 0; J.y = 0; } else { const mm = (m - 0.14) / 0.86; J.x = dx / d * mm; J.y = dy / d * mm; }
  };
  const onJoyUp = (e) => {
    if (joy.current.id !== e.pointerId) return;
    joy.current = { x: 0, y: 0, id: null, cx: 0, cy: 0, show: false };
    setJoyView(null);
  };

  const W = WR.current;
  const level = LEVELS[li];
  const partnerLine = solo ? (active === 'sun' ? 'Practice, orange torch' : 'Practice, blue torch') : here ? `${peerFirst} is here` : here === false ? `${peerFirst} is away` : 'Connecting';
  return (
    <Portal>
      <div ref={wrapRef} onPointerDown={onJoyDown} onPointerMove={onJoyMove} onPointerUp={onJoyUp} onPointerCancel={onJoyUp}
        style={{ position: 'fixed', left: 0, right: 0, top: 'var(--zvp-top, 0px)', height: 'var(--zvp-h, 100%)', zIndex: 90, background: '#0B0910', overflow: 'hidden', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', fontFamily: FONT, color: '#FFFFFF' }}>
        <canvas ref={cvRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, padding: 'calc(10px + env(safe-area-inset-top)) 12px 10px', display: 'flex', alignItems: 'center', gap: 10, background: 'linear-gradient(180deg, rgba(8,6,14,0.82) 0%, rgba(8,6,14,0) 100%)', pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'auto' }}>
            <RoundBtn label="Leave the game" size={42} onClick={leave}><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" /></svg></RoundBtn>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15.5, fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{phase === 'play' || phase === 'won' || phase === 'out' ? `${li + 1}. ${level.name}` : 'Two Torches'}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 6 }}>
              {!solo && <span style={{ width: 7, height: 7, borderRadius: '50%', background: here ? '#3DDC84' : '#8E8A9E' }} />}
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{partnerLine}</span>
              {!solo && voice.peerMic && <span style={{ display: 'inline-flex', transform: 'scale(0.7)' }}><MicIcon /></span>}
            </div>
          </div>
          {(phase === 'play' || phase === 'won' || phase === 'out') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 16, background: 'rgba(14,12,22,0.62)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12)' }}>
              <div style={{ display: 'flex', gap: 2 }}>{[0, 1, 2].map((i) => <Heart key={i} on={i < hud.lives} />)}</div>
              <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.18)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 13, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}><GemIcon k="sun" />{hud.gems.sun[0]}/{hud.gems.sun[1]}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 13, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}><GemIcon k="moon" />{hud.gems.moon[0]}/{hud.gems.moon[1]}</div>
              {hud.key && <KeyIcon />}
            </div>
          )}
        </div>
        {toast && phase === 'play' && (
          <div key={toast.at} style={{ position: 'absolute', left: '50%', top: 'calc(70px + env(safe-area-inset-top))', transform: 'translateX(-50%)', maxWidth: 'min(92%, 420px)', padding: '10px 14px', borderRadius: 16, background: 'rgba(14,12,22,0.84)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.14), 0 10px 26px rgba(0,0,0,0.4)', fontSize: 13.5, fontWeight: 700, lineHeight: 1.4, textAlign: 'center', pointerEvents: 'none', animation: 'zduo-toast 0.25s ease-out' }}>{toast.text}</div>
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
        {phase === 'play' && (
          <div style={{ position: 'absolute', right: 14, bottom: 'calc(22px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
            {nearUse && <RoundBtn label="Use the dial" size={72} bg="linear-gradient(180deg, #FFD36B 0%, #F2A93B 100%)" onClick={useAction} style={{ boxShadow: '0 4px 0 #B9741C, 0 10px 22px rgba(0,0,0,0.4)' }}><HandIcon /></RoundBtn>}
            <div style={{ display: 'flex', gap: 10 }}>
              {solo && <RoundBtn label={active === 'sun' ? 'Switch to the blue torch' : 'Switch to the orange torch'} onClick={() => { setActive((a) => (a === 'sun' ? 'moon' : 'sun')); cam.current.init = true; }} bg={active === 'sun' ? 'rgba(62,127,214,0.85)' : 'rgba(229,146,56,0.85)'}><SwapIcon /></RoundBtn>}
              {!solo && <RoundBtn label={voice.micOn ? 'Turn your mic off' : 'Turn your mic on'} onClick={voice.toggle} bg={voice.micOn ? 'rgba(46,180,99,0.9)' : 'rgba(14,12,22,0.62)'}><MicIcon off={!voice.micOn} /></RoundBtn>}
              {!solo && <RoundBtn label="Chat" onClick={() => setSheet({ k: 'chat' })}><ChatIcon /></RoundBtn>}
            </div>
          </div>
        )}
        {voice.err && phase === 'play' && <div style={{ position: 'absolute', right: 14, bottom: 'calc(150px + env(safe-area-inset-bottom))', padding: '6px 10px', borderRadius: 12, background: 'rgba(217,75,75,0.9)', fontSize: 12, fontWeight: 800 }}>{voice.err}</div>}

        {phase === 'lobby' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'radial-gradient(circle at 50% 40%, rgba(255,160,60,0.16), rgba(11,9,16,0) 60%)' }}>
            <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center', padding: '26px 20px', borderRadius: 26, background: 'rgba(23,20,31,0.92)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)', animation: 'zduo-pop 0.3s ease-out' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Avatar emoji={me && me.avatar} name={(me && me.name) || 'You'} size={58} />
                <div style={{ width: 34, height: 34, margin: '0 -6px', borderRadius: '50%', background: '#17141F', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}><GlyphIcon k="sun" size={22} color="#FFB347" /></div>
                <Avatar emoji={peer && peer.avatar} name={(peer && peer.name) || 'Friend'} size={58} />
              </div>
              <div style={{ fontSize: 21, fontWeight: 900 }}>{here === false || here == null ? `Waiting for ${peerFirst}` : 'Joining'}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.72)', lineHeight: 1.5 }}>{`You carry the orange torch, ${peerFirst} carries the blue one. The game starts when ${peerFirst} opens it.`}</div>
              <Spinner size={22} color="#FFFFFF" />
              <Btn label="Leave" onClick={finish} style={{ marginTop: 4 }} />
            </div>
          </div>
        )}

        {phase === 'pick' && (
          <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: 'calc(72px + env(safe-area-inset-top)) 16px calc(24px + env(safe-area-inset-bottom))', boxSizing: 'border-box', background: 'radial-gradient(circle at 50% 0%, rgba(255,160,60,0.14), rgba(11,9,16,0) 55%)' }}>
            <div style={{ maxWidth: 460, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ textAlign: 'center', padding: '6px 6px 4px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 8 }}><GlyphIcon k="sun" size={30} color="#FFB347" /><GlyphIcon k="moon" size={30} color="#8CC0FF" /></div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>Two Torches</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.72)', lineHeight: 1.5, marginTop: 4 }}>{solo ? 'Practice alone. Switch between the two torches with the arrows button.' : host ? `Pick a level to play with ${peerFirst}.` : `${peerFirst} is picking a level.`}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)' }}>
                {[['sun', '#FFB347', 'Orange torch', 'Walks through lava, burns vines, lights the orange fire.'], ['moon', '#8CC0FF', 'Blue torch', 'Wades through water, lights hidden stones, reads hidden codes.']].map(([k, c, t1, t2]) => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 13, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><GlyphIcon k={k} size={24} color={c} /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 800, color: c }}>{t1}{!solo ? (k === myKind ? ', you' : `, ${peerFirst}`) : ''}</div>
                      <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>{t2}</div>
                    </div>
                  </div>
                ))}
                <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.45 }}>You share three hearts. Flags save where you come back. Green goo and dark drops hurt you both.</div>
              </div>
              {LEVELS.map((L, i) => {
                const b = best[i];
                return (
                  <div key={i} role={host ? 'button' : undefined} aria-label={host ? `Play level ${i + 1}, ${L.name}` : undefined} onClick={host ? () => { tap(); startLevel(i); } : undefined}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 18, background: 'rgba(255,255,255,0.06)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)', cursor: host ? 'pointer' : 'default' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 13, background: i === 3 ? 'linear-gradient(180deg, #FFB347, #E8761E)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 900, flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15.5, fontWeight: 800 }}>{L.name}</div>
                      <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.68)', lineHeight: 1.4 }}>{L.goal}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                      <Stars n={b ? b.stars : 0} size={15} />
                      {b && b.time ? <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)', fontVariantNumeric: 'tabular-nums' }}>{fmtTime(b.time)}</div> : null}
                    </div>
                  </div>
                );
              })}
              {!host && <div style={{ display: 'flex', justifyContent: 'center', padding: 8 }}><Spinner size={20} color="#FFFFFF" /></div>}
            </div>
          </div>
        )}

        {phase === 'won' && result && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(5,4,10,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
            <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center', padding: '24px 20px', borderRadius: 26, background: '#17141F', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1), 0 20px 50px rgba(0,0,0,0.5)', animation: 'zduo-pop 0.32s ease-out' }}>
              <Stars n={result.stars} size={34} />
              <div style={{ fontSize: 24, fontWeight: 900 }}>{solo ? 'Both torches made it out' : 'You made it out together'}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, width: '100%' }}>
                {[['Time', fmtTime(result.time)], ['Gems', `${result.gems} of ${result.gemsTotal}`], ['Hearts lost', String(result.deaths)]].map(([a, b]) => (
                  <div key={a} style={{ padding: '10px 6px', borderRadius: 14, background: 'rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 16, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{b}</div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{a}</div>
                  </div>
                ))}
              </div>
              {result.hasChest && <div style={{ fontSize: 13, fontWeight: 800, color: result.chest ? '#FFD36B' : 'rgba(255,255,255,0.55)' }}>{result.chest ? 'Secret chest found' : 'The secret chest stayed closed'}</div>}
              <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.45 }}>One star for escaping, one for every gem, one for keeping all three hearts.</div>
              {host ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', marginTop: 4 }}>
                  {li < LEVELS.length - 1 && <Btn kind="go" label="Next level" onClick={() => startLevel(li + 1)} />}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Btn label="Play again" onClick={() => startLevel(li)} style={{ flex: 1 }} />
                    <Btn label="Levels" onClick={() => { setPhase('pick'); if (!solo) relay.send('pick', {}); WR.current = null; }} style={{ flex: 1 }} />
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'rgba(255,255,255,0.72)' }}>{`${peerFirst} picks what is next`}</div>
              )}
              <Btn label={solo ? 'Leave' : 'Back to chat'} onClick={finish} style={{ width: '100%' }} />
            </div>
          </div>
        )}

        {phase === 'out' && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(5,4,10,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
            <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center', padding: '24px 20px', borderRadius: 26, background: '#17141F', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)', animation: 'zduo-pop 0.32s ease-out' }}>
              <div style={{ display: 'flex', gap: 4 }}>{[0, 1, 2].map((i) => <Heart key={i} on={false} />)}</div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>Out of hearts</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.72)', lineHeight: 1.5 }}>The level starts over with three new hearts. Talk it through first.</div>
              {host ? <Btn kind="go" label="Try again" onClick={() => startLevel(li)} style={{ width: '100%' }} /> : <div style={{ fontSize: 13.5, fontWeight: 700, color: 'rgba(255,255,255,0.72)' }}>{`Waiting for ${peerFirst} to start again`}</div>}
              <Btn label={solo ? 'Leave' : 'Back to chat'} onClick={finish} style={{ width: '100%' }} />
            </div>
          </div>
        )}

        {sheet && sheet.k === 'chat' && (
          <Sheet title={solo ? 'Notes' : `Talk to ${peerFirst}`} onClose={() => setSheet(null)}>
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
        {sheet && sheet.k === 'dial' && W && (
          <Sheet title="Stone dial" text={W.mural > 0.5 || solo ? 'Turn in the three symbols in the right order.' : 'The code is painted where only blue light shows it. Ask the blue torch to read it.'} onClose={() => setSheet(null)}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, margin: '16px 0 14px' }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ width: 58, height: 58, borderRadius: 18, background: sheet.bad ? 'rgba(217,75,75,0.25)' : 'rgba(255,255,255,0.08)', boxShadow: 'inset 0 0 0 1.5px rgba(255,214,120,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {sheet.picks[i] && <GlyphIcon k={sheet.picks[i]} size={30} color="#FFE09A" />}
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 8 }}>
              {GLYPHS.map((g) => (
                <button key={g} type="button" aria-label={GLYPH_NAMES[g]} onClick={() => {
                  tap();
                  const picks = [...sheet.picks, g].slice(0, 3);
                  if (picks.length < 3) { setSheet({ k: 'dial', picks }); return; }
                  const ok = tryCode(WR.current, picks);
                  if (ok) { setSheet(null); }
                  else { Snd.fx.bad(); setSheet({ k: 'dial', picks, bad: true }); setTimeout(() => setSheet((s) => (s && s.k === 'dial' ? { k: 'dial', picks: [] } : s)), 650); }
                }} style={{ ...btnBase, flexDirection: 'column', gap: 4, height: 70, borderRadius: 16, background: 'rgba(255,255,255,0.08)', color: '#FFFFFF', fontSize: 11.5, fontWeight: 800 }}>
                  <GlyphIcon k={g} size={28} color="#FFE09A" />{GLYPH_NAMES[g]}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <Btn label="Clear" onClick={() => setSheet({ k: 'dial', picks: [] })} style={{ flex: 1 }} />
              <Btn label="Close" onClick={() => setSheet(null)} style={{ flex: 1 }} />
            </div>
          </Sheet>
        )}
        {leaveAsk && (
          <Sheet title="Leave the game?" text={`${peerFirst} stays in the level but cannot finish it without you.`} onClose={() => setLeaveAsk(false)}>
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

export default DuoGamePage;
