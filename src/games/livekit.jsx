import React, { useEffect, useRef, useState } from 'react';
import { FONT, hapticTap, gameIceConfig } from '../App.jsx';

export const EMOTES = ['👍', '😂', '😮', '😅', '❤️', '👋', '🔥', '😡'];
let kitTap = () => { try { hapticTap(); } catch {} };
export function setKitTap(fn) { kitTap = fn; }
const tap = () => kitTap();
export function SignalBars({ ms }) {
  const lvl = ms == null ? 0 : ms <= 90 ? 4 : ms <= 170 ? 3 : ms <= 280 ? 2 : 1;
  const col = lvl >= 4 ? '#3DDC84' : lvl === 3 ? '#C6E05A' : lvl === 2 ? '#FFB347' : '#FF5A5A';
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => <rect key={i} x={i * 4} y={9 - i * 3} width="3" height={3 + i * 3} rx="1" fill={i < lvl ? col : 'rgba(255,255,255,0.22)'} />)}
    </svg>
  );
}

export function PingChip({ ms, weak }) {
  const col = weak ? '#FF5A5A' : ms == null ? 'rgba(255,255,255,0.6)' : ms <= 90 ? '#3DDC84' : ms <= 170 ? '#C6E05A' : ms <= 280 ? '#FFB347' : '#FF5A5A';
  return (
    <span aria-label={ms == null ? 'Checking connection' : `Ping ${ms} milliseconds`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 7px', borderRadius: 9, background: 'rgba(0,0,0,0.35)', color: col, fontSize: 11, fontWeight: 900, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', flexShrink: 0 }}>
      <SignalBars ms={weak ? 999 : ms} />{weak ? 'Weak' : ms == null ? '...' : `${ms} ms`}
    </span>
  );
}

export function SpeakerIcon({ off }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="#FFFFFF" />
      {off ? <path d="M16 9l5 6M21 9l-5 6" stroke="#FF6B6B" strokeWidth="2.4" /> : <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />}
    </svg>
  );
}

export function SmileIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="8.5" /><path d="M8.5 14c1 1.4 2.1 2 3.5 2s2.5-.6 3.5-2" /><circle cx="9.2" cy="10" r="0.6" fill="#FFFFFF" /><circle cx="14.8" cy="10" r="0.6" fill="#FFFFFF" /></svg>;
}

export function Check({ on }) {
  return (
    <span style={{ width: 20, height: 20, borderRadius: 7, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: on ? '#2FB463' : 'rgba(255,255,255,0.1)' }}>
      {on ? <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /></svg> : null}
    </span>
  );
}

export function Heart({ on }) {
  return <svg width="20" height="18" viewBox="0 0 24 22" aria-hidden="true"><path d="M12 21s-9.5-6.2-9.5-12.6C2.5 4.9 5 2.5 8 2.5c1.8 0 3.2.9 4 2.3.8-1.4 2.2-2.3 4-2.3 3 0 5.5 2.4 5.5 5.9C21.5 14.8 12 21 12 21z" fill={on ? '#FF5A6E' : 'rgba(255,255,255,0.16)'} stroke={on ? '#C2283F' : 'rgba(255,255,255,0.25)'} strokeWidth="1.4" /></svg>;
}

export function MicIcon({ off }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round">
      <rect x="9" y="3" width="6" height="11" rx="3" fill={off ? 'none' : '#FFFFFF'} />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
      {off && <path d="M4 4l16 16" stroke="#FF6B6B" strokeWidth="2.4" />}
    </svg>
  );
}

export function ChatIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinejoin="round"><path d="M4 5.5h16v10H10l-4.5 3.5V15.5H4z" /></svg>;
}

export function SwapIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7h11l-3-3M17 17H6l3 3" /></svg>;
}

export function HandIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#3A2508" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 13V6.2a1.6 1.6 0 0 1 3.2 0V11M11.2 11V4.6a1.6 1.6 0 0 1 3.2 0V11M14.4 11V6a1.6 1.6 0 0 1 3.2 0v8c0 4.1-2.7 7.2-6.6 7.2-2.6 0-4.4-1.3-5.8-3.5l-2.4-3.8c-.8-1.3.9-2.6 2-1.5L8 15.6" /></svg>;
}

export const btnBase = { border: 'none', fontFamily: FONT, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, WebkitTapHighlightColor: 'transparent' };

export function Btn({ label, onClick, kind = 'glass', disabled, style, ariaLabel, children }) {
  const bg = kind === 'go' ? 'linear-gradient(180deg, #52D681 0%, #2FB463 100%)' : kind === 'gold' ? 'linear-gradient(180deg, #FFD36B 0%, #F2A93B 100%)' : kind === 'danger' ? '#D94B4B' : 'rgba(255,255,255,0.14)';
  const shadow = kind === 'go' ? '0 3px 0 #1E8A47' : kind === 'gold' ? '0 3px 0 #B9741C' : 'inset 0 0 0 1px rgba(255,255,255,0.16)';
  return (
    <button type="button" aria-label={ariaLabel || label} disabled={disabled} onClick={(e) => { e.stopPropagation(); if (!disabled && onClick) { tap(); onClick(e); } }}
      style={{ ...btnBase, height: 48, padding: '0 20px', borderRadius: 24, background: bg, color: kind === 'gold' ? '#3A2508' : '#FFFFFF', boxShadow: shadow, fontSize: 15.5, opacity: disabled ? 0.45 : 1, ...style }}>
      {children}{label}
    </button>
  );
}

export function RoundBtn({ onClick, label, children, size = 54, bg = 'rgba(14,12,22,0.62)', style }) {
  return (
    <button type="button" aria-label={label} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); tap(); onClick && onClick(); }}
      style={{ ...btnBase, width: size, height: size, borderRadius: '50%', background: bg, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.16), 0 6px 16px rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', ...style }}>
      {children}
    </button>
  );
}

export function Sheet({ title, text, onClose, children }) {
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

export function Stars({ n, size = 18 }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {[0, 1, 2].map((i) => <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.6l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z" fill={i < n ? '#FFC93C' : 'rgba(255,255,255,0.14)'} stroke={i < n ? '#C98A16' : 'none'} strokeWidth="1.2" strokeLinejoin="round" /></svg>)}
    </div>
  );
}

let cssDone = false;
export function injectCss() {
  if (cssDone || typeof document === 'undefined') return;
  cssDone = true;
  const st = document.createElement('style');
  st.textContent = '@keyframes zduo-up{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}@keyframes zduo-pop{0%{transform:scale(.85);opacity:0}60%{transform:scale(1.04);opacity:1}100%{transform:scale(1)}}@keyframes zduo-toast{from{transform:translate(-50%,-8px);opacity:0}to{transform:translate(-50%,0);opacity:1}}';
  document.head.appendChild(st);
}

export function useVoice(relay, enabled, host) {
  const [micOn, setMicOn] = useState(false);
  const [peerMic, setPeerMic] = useState(false);
  const [err, setErr] = useState('');
  const [peerMuted, setPeerMuted] = useState(false);
  const S = useRef({ pc: null, tr: null, track: null, stream: null, queue: [], audio: null, making: false, muted: false });
  const send = (t, d) => { if (relay) relay.send(t, d || {}); };
  const attach = (pc) => {
    pc.ontrack = (e) => {
      const s = S.current;
      if (!s.audio) { s.audio = new Audio(); s.audio.autoplay = true; s.audio.playsInline = true; }
      s.audio.muted = s.muted;
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
  const togglePeer = () => {
    const s = S.current;
    s.muted = !s.muted;
    if (s.audio) s.audio.muted = s.muted;
    setPeerMuted(s.muted);
  };
  return { micOn, peerMic, err, toggle, peerMuted, togglePeer };
}

