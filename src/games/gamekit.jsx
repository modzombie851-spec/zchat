import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FONT, hapticTap } from '../App.jsx';
import { Sfx } from './sfx.js';

export const INK = '#1B1430';
export const GC = {
  red: ['#FF6A55', '#E53A2A', '#9E1D12'],
  green: ['#7BE05A', '#36B23A', '#1C6E22'],
  blue: ['#5BB8FF', '#2479E8', '#123F8E'],
  gold: ['#FFE15A', '#F5AE1E', '#A9680A'],
  purple: ['#C08BFF', '#8045E6', '#481C94'],
  orange: ['#FFAE55', '#F0721E', '#9A3D0B'],
  white: ['#FFFFFF', '#DCE3EF', '#8D97AA'],
  dark: ['#4A4166', '#2C2546', '#15102A'],
  teal: ['#5EE6D2', '#18B3A0', '#0B6B60'],
  pink: ['#FF8FC8', '#F0509E', '#99245F'],
};

let cssDone = false;
export function injectKitCss() {
  if (cssDone || typeof document === 'undefined') return;
  cssDone = true;
  const st = document.createElement('style');
  st.textContent = [
    '@keyframes zgk-pop{0%{transform:scale(.6);opacity:0}70%{transform:scale(1.06);opacity:1}100%{transform:scale(1)}}',
    '@keyframes zgk-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}',
    '@keyframes zgk-shine{0%{transform:translateX(-120%) skewX(-20deg)}60%,100%{transform:translateX(220%) skewX(-20deg)}}',
    '@keyframes zgk-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}',
    '@keyframes zgk-in{from{transform:translateY(24px);opacity:0}to{transform:none;opacity:1}}',
    '@keyframes zgk-spin{to{transform:rotate(360deg)}}',
    '.zgk-btn{-webkit-tap-highlight-color:transparent;touch-action:none;user-select:none;-webkit-user-select:none;outline:none}',
    '.zgk-btn:focus-visible{box-shadow:0 0 0 3px #fff,0 0 0 6px #2479E8!important}',
    '[data-side="1"] [style*="overflow-y: auto"]{overflow-x:auto!important;touch-action:pan-x pan-y!important}',
    '[style*="overflow-y: auto"] .zgk-btn{touch-action:pan-x pan-y}',
    '@keyframes zgk-feed{0%{opacity:0;transform:translateX(10px)}7%{opacity:1;transform:none}82%{opacity:1}100%{opacity:0}}',
    '@keyframes zgk-feedl{0%{opacity:0;transform:translateX(-10px)}7%{opacity:1;transform:none}82%{opacity:1}100%{opacity:0}}',
    '@keyframes zgk-rib{0%{opacity:0;transform:scaleX(.6)}10%{opacity:1;transform:none}80%{opacity:1}100%{opacity:0}}',
    '@keyframes zgk-hint{0%{opacity:0}10%{opacity:1}85%{opacity:1}100%{opacity:0}}',
    '@keyframes zgk-note{0%{opacity:0;transform:translateY(-10px) scale(.96)}7%{opacity:1;transform:none}86%{opacity:1;transform:none}100%{opacity:0;transform:translateY(-4px)}}',
  ].join('');
  document.head.appendChild(st);
}

export function kitTap(kind) {
  try { hapticTap(); } catch {}
  Sfx.init();
  Sfx.play(kind || 'pop', { vol: 0.5, rate: 1.1 });
}

const ICON = {
  close: 'M7 7l10 10M17 7L7 17',
  dash: 'M3 7h6M2 12h8M3 17h6M11 5l8 7-8 7z',
  suck: 'M3.5 3.5L8.5 8.5M8.5 4.8V8.5H4.8M20.5 3.5L15.5 8.5M15.5 4.8V8.5H19.2M3.5 20.5L8.5 15.5M8.5 19.2V15.5H4.8M20.5 20.5L15.5 15.5M15.5 19.2V15.5H19.2M12 9.7a2.3 2.3 0 1 0 0 4.6a2.3 2.3 0 1 0 0-4.6z',
  shield: 'M12 3l7 3v6c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6z',
  bolt: 'M13 2L5 13h6l-1 9 8-12h-6z',
  flame: 'M12 2.5C13 6 17.5 8 17.5 13.5A5.5 5.5 0 0 1 6.5 13.5C6.5 10.5 8.3 8.7 9.5 7.5 9.7 9.4 10.6 10.6 11.6 11 11 8 11 5.5 12 2.5Z',
  up: 'M12 4l7 8h-4.5v8h-5v-8H5z',
  left: 'M4 12l8-7v4.5h8v5h-8V19z',
  right: 'M20 12l-8-7v4.5H4v5h8V19z',
  swap: 'M5 8h11l-3-3M19 16H8l3 3',
  snow: 'M12 2.5v19M3.8 7.25l16.4 9.5M3.8 16.75l16.4-9.5M9.4 3.9 12 6.3l2.6-2.4M9.4 20.1 12 17.7l2.6 2.4M4.2 10.6l3.4-.9-.9-3.4M19.8 13.4l-3.4.9.9 3.4M4.2 13.4l3.4.9-.9 3.4M19.8 10.6l-3.4-.9.9-3.4',
  map: 'M3 6.5 8.5 4l7 2.5L21 4v13.5L15.5 20l-7-2.5L3 20zM8.5 4v13.5M15.5 6.5V20',
  hand: 'M8 13V6.5a1.6 1.6 0 0 1 3.2 0V11M11.2 11V5a1.6 1.6 0 0 1 3.2 0v6M14.4 11V6.5a1.6 1.6 0 0 1 3.2 0V14c0 4-2.7 7-6.6 7-2.6 0-4.4-1.3-5.8-3.5l-2.2-3.6c-.8-1.3.9-2.6 2-1.5L8 15.4',
  sword: 'M20.5 3.5L19.6 7.9 11.2 16.3 7.7 12.8 16.1 4.4ZM6.2 11.9L7.6 10.5 13.5 16.4 12.1 17.8ZM8.6 15.4L10 16.8 6.6 20.2 5.2 18.8Z',
  pause: 'M8 5v14M16 5v14',
  play: 'M7 4l13 8-13 8z',
  replay: 'M5 12a7 7 0 1 0 2-5M5 4v4h4',
  home: 'M3 11l9-7 9 7M6 9.5V20h12V9.5',
  star: 'M12 2.8l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.6l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z',
  eye: 'M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  people: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2 20c0-3.6 3.1-6 7-6s7 2.4 7 6M16 4.5a3.3 3.3 0 0 1 0 6.4M18.5 14.3c2.1.7 3.5 2.5 3.5 5.7',
  gear: 'M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1',
  music: 'M9 18V5l11-2v13M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3zM20 16a3 3 0 1 1-3-3 3 3 0 0 1 3 3z',
  sound: 'M4 9.5h3.5L12 5.5v13l-4.5-4H4zM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11',
  mute: 'M4 9.5h3.5L12 5.5v13l-4.5-4H4zM16 9l5 6M21 9l-5 6',
  mic: 'M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21',
  micoff: 'M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M4 4l16 16',
  smile: 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM8.5 14c1 1.4 2.1 2 3.5 2s2.5-.6 3.5-2M9 10h.01M15 10h.01',
  chat: 'M4 5.5h16v10H10l-4.5 3.5V15.5H4z',
  flag: 'M6 21V4M6 4h11l-2.5 4L17 12H6',
  heart: 'M12 21s-9.5-6.2-9.5-12.6C2.5 4.9 5 2.5 8 2.5c1.8 0 3.2.9 4 2.3.8-1.4 2.2-2.3 4-2.3 3 0 5.5 2.4 5.5 5.9C21.5 14.8 12 21 12 21z',
  plus: 'M12 5v14M5 12h14',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  bubble: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM8.5 8.5a4 4 0 0 1 3-1.5',
  lock: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
  crown: 'M3 8.5L7.5 12 12 5l4.5 7L21 8.5 19.2 18H4.8z',
  bomb: 'M10 8a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM14 9l3-3M17 3v2M19.5 4.5L18 6M21 7h-2',
  magnet: 'M5.5 4v8a6.5 6.5 0 0 0 13 0V4h-4v8a2.5 2.5 0 0 1-5 0V4zM5.5 8h4M14.5 8h4',
  help: 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM9.6 9.6a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.2.9-1.2 1.7v.4M12 16.8v.2',
  eyeoff: 'M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM4 4l16 16',
  door: 'M10 4H5v16h5M14 8l4 4-4 4M18 12H9',
  enter: 'M14 4h5v16h-5M9 8l4 4-4 4M13 12H4',
};
const FILLED = new Set(['dash', 'shield', 'bolt', 'flame', 'up', 'left', 'right', 'play', 'star', 'heart', 'crown', 'bomb', 'sword']);

export function GIcon({ k, size = 26, color = '#FFFFFF', ink = 'rgba(0,0,0,0.34)', stroke, line = false, halo = true }) {
  const d = ICON[k] || ICON.star;
  const filled = FILLED.has(k);
  const sw = stroke || 2.4;
  if (line) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
        {halo && <path d={d} fill="none" stroke="rgba(0,0,0,0.28)" strokeWidth={sw + 1.6} strokeLinecap="round" strokeLinejoin="round" />}
        <path d={d} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
      <path d={d} fill={filled ? ink : 'none'} stroke={ink} strokeWidth={sw + 2} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill={filled ? color : 'none'} stroke={color} strokeWidth={filled ? 1.2 : sw} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function hexA(h, a) { const n = parseInt(String(h).slice(1, 7), 16) || 0; return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; }

export function GBtn({ icon, label, onPress, color = 'blue', size = 64, cool = 0, coolMax = 0, badge, disabled, fast = true, sound = 'pop', iconSize, style, children, active }) {
  injectKitCss();
  const [down, setDown] = useState(false);
  const plain = color === 'white' || color === 'dark' || !GC[color];
  const c = GC[color] || GC.white;
  const busy = cool > 0 || disabled;
  const fire = () => { if (busy) return; kitTap(sound); if (onPress) onPress(); };
  const frac = coolMax > 0 ? Math.max(0, Math.min(1, cool / coolMax)) : 0;
  const ring = busy ? 'rgba(255,255,255,0.3)' : active ? '#FFFFFF' : plain ? 'rgba(255,255,255,0.62)' : c[0];
  return (
    <button type="button" className="zgk-btn" aria-label={label} disabled={!!disabled}
      onPointerDown={(e) => { e.stopPropagation(); if (e.cancelable) e.preventDefault(); setDown(true); if (fast) fire(); }}
      onPointerUp={(e) => { e.stopPropagation(); setDown(false); }}
      onPointerCancel={() => setDown(false)}
      onPointerLeave={() => setDown(false)}
      onClick={(e) => { e.stopPropagation(); if (!fast) fire(); }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); } }}
      style={{ position: 'relative', width: size, height: size, padding: 0, border: 'none', borderRadius: '50%', background: 'transparent', cursor: busy ? 'default' : 'pointer', flexShrink: 0, transform: down ? 'scale(0.94)' : 'none', transition: 'transform 0.06s ease-out', ...style }}>
      <span aria-hidden="true" style={{ position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden', background: down ? 'rgba(255,255,255,0.22)' : plain ? 'rgba(6,10,18,0.5)' : hexA(c[2], 0.62), boxShadow: `inset 0 0 0 ${size >= 56 ? 2 : 1.5}px ${ring}, 0 2px 8px rgba(0,0,0,0.22)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {frac > 0 && <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `conic-gradient(rgba(0,0,0,0.5) ${frac * 360}deg, rgba(0,0,0,0) 0deg)` }} />}
        <span style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: busy ? 0.5 : 1 }}>
          {children || <GIcon k={icon} size={iconSize || Math.round(size * 0.44)} color="#FFFFFF" line stroke={2.1} />}
        </span>
        {cool > 0 && coolMax > 1.5 && <span style={{ position: 'absolute', left: 0, right: 0, top: '50%', transform: 'translateY(-50%)', textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: Math.round(size * 0.3), color: '#FFFFFF', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>{Math.ceil(cool)}</span>}
      </span>
      {badge != null && <span aria-hidden="true" style={{ position: 'absolute', right: -3, top: -3, minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9, background: '#E5484D', color: '#FFFFFF', fontFamily: FONT, fontWeight: 800, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>{badge}</span>}
    </button>
  );
}

export function GHold({ icon, label, color = 'blue', size = 72, onDown, onUp, style, flat = false, main = false }) {
  injectKitCss();
  const [down, setDown] = useState(false);
  const pid = useRef(null);
  const c = GC[color] || GC.blue;
  const edge = Math.max(4, Math.round(size * 0.075));
  const start = (e) => { e.stopPropagation(); if (e.cancelable) e.preventDefault(); if (pid.current != null) return; pid.current = e.pointerId; try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} setDown(true); if (onDown) onDown(); };
  const end = (e) => { if (e && pid.current !== e.pointerId) return; pid.current = null; setDown(false); if (onUp) onUp(); };
  if (flat) {
    return (
      <button type="button" className="zgk-btn" aria-label={label}
        onPointerDown={start} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end} onContextMenu={(e) => e.preventDefault()}
        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !down) { e.preventDefault(); setDown(true); if (onDown) onDown(); } }}
        onKeyUp={(e) => { if (e.key === 'Enter' || e.key === ' ') { setDown(false); if (onUp) onUp(); } }}
        style={{ position: 'relative', width: size, height: size, padding: 0, border: 'none', borderRadius: '50%', background: 'transparent', cursor: 'pointer', flexShrink: 0, touchAction: 'none', transform: down ? 'scale(0.93)' : 'none', transition: 'transform 0.05s ease-out', ...style }}>
        <span aria-hidden="true" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: down ? 'rgba(255,255,255,0.24)' : 'rgba(0,0,0,0.3)', boxShadow: `inset 0 0 0 ${main ? 2 : 1.5}px rgba(255,255,255,${main ? 0.82 : 0.62})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <GIcon k={icon} size={Math.round(size * 0.42)} color="#FFFFFF" line stroke={main ? 2.3 : 2.1} />
        </span>
      </button>
    );
  }
  return (
    <button type="button" className="zgk-btn" aria-label={label}
      onPointerDown={start} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end} onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !down) { e.preventDefault(); setDown(true); if (onDown) onDown(); } }}
      onKeyUp={(e) => { if (e.key === 'Enter' || e.key === ' ') { setDown(false); if (onUp) onUp(); } }}
      style={{ position: 'relative', width: size, height: size + edge, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', flexShrink: 0, touchAction: 'none', ...style }}>
      <span aria-hidden="true" style={{ position: 'absolute', left: 0, top: edge, width: size, height: size, borderRadius: '50%', background: c[2], boxShadow: `0 0 0 3px ${INK}, 0 ${edge + 4}px 10px rgba(0,0,0,0.35)` }} />
      <span aria-hidden="true" style={{ position: 'absolute', left: 0, top: down ? edge - 1 : 0, width: size, height: size, borderRadius: '50%', overflow: 'hidden', background: `linear-gradient(180deg, ${c[0]} 0%, ${c[1]} 70%)`, boxShadow: `0 0 0 3px ${INK}, inset 0 -${Math.round(size * 0.06)}px 0 rgba(0,0,0,0.18)`, transition: 'top 0.05s ease-out', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ position: 'absolute', left: '14%', right: '14%', top: '6%', height: '34%', borderRadius: '50%', background: 'linear-gradient(180deg, rgba(255,255,255,0.75), rgba(255,255,255,0.08))' }} />
        <span style={{ position: 'relative', display: 'flex' }}><GIcon k={icon} size={Math.round(size * 0.46)} color={color === 'white' ? '#3A3352' : '#FFFFFF'} ink={INK} /></span>
      </span>
    </button>
  );
}

export function GPill({ text, icon, onPress, color = 'green', height = 56, wide, disabled, style, sound = 'pop', fast = false, small }) {
  injectKitCss();
  const [down, setDown] = useState(false);
  const h = small ? Math.min(height, 40) : Math.min(height, 50);
  const kind = color === 'green' || color === 'gold' ? 'main' : color === 'red' ? 'warn' : color === 'white' || color === 'dark' || !GC[color] ? 'plain' : 'tone';
  const c = GC[color] || GC.white;
  const bg = kind === 'main' ? 'linear-gradient(180deg, #FFD84E 0%, #F2B11F 100%)' : kind === 'warn' ? 'rgba(214,52,52,0.22)' : kind === 'tone' ? hexA(c[2], 0.66) : 'rgba(255,255,255,0.09)';
  const ring = kind === 'main' ? 'inset 0 -2px 0 rgba(120,70,0,0.35), inset 0 1px 0 rgba(255,255,255,0.45)' : `inset 0 0 0 1.5px ${kind === 'warn' ? 'rgba(255,118,118,0.75)' : kind === 'tone' ? c[0] : 'rgba(255,255,255,0.4)'}`;
  const ink = kind === 'main' ? '#1F1702' : kind === 'warn' ? '#FFB4B4' : '#FFFFFF';
  const fire = () => { if (disabled) return; kitTap(sound); if (onPress) onPress(); };
  return (
    <button type="button" className="zgk-btn" aria-label={text} disabled={!!disabled}
      onPointerDown={(e) => { e.stopPropagation(); setDown(true); if (fast) { if (e.cancelable) e.preventDefault(); fire(); } }}
      onPointerUp={() => setDown(false)} onPointerCancel={() => setDown(false)} onPointerLeave={() => setDown(false)}
      onClick={(e) => { e.stopPropagation(); if (!fast) fire(); }}
      style={{ position: 'relative', width: wide ? '100%' : undefined, height: h, minWidth: Math.round(h * 2.2), padding: `0 ${small ? 16 : 22}px`, border: 'none', borderRadius: 10, background: bg, boxShadow: `${ring}, 0 3px 10px rgba(0,0,0,0.22)`, color: ink, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: FONT, fontWeight: 800, fontSize: small ? 14.5 : 16.5, letterSpacing: '0.005em', whiteSpace: 'nowrap', cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.45 : 1, transform: down ? 'scale(0.97)' : 'none', filter: down ? 'brightness(1.1)' : 'none', transition: 'transform 0.06s ease-out', boxSizing: 'border-box', ...style }}>
      {icon && <GIcon k={icon} size={small ? 16 : 18} color={ink} line halo={false} stroke={2.3} />}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{text}</span>
    </button>
  );
}

export function GPanel({ children, style, color }) {
  return (
    <div style={{ borderRadius: 14, background: color || 'rgba(12,16,24,0.86)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.11), inset 0 1px 0 rgba(255,255,255,0.08), 0 12px 32px rgba(0,0,0,0.38)', ...style }}>{children}</div>
  );
}

export function GChip({ children, style, color = 'rgba(8,12,20,0.6)' }) {
  return <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 30, padding: '0 11px', borderRadius: 8, background: color, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.16)', color: '#FFFFFF', fontFamily: FONT, fontWeight: 800, fontSize: 13.5, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', ...style }}>{children}</div>;
}

export function GTitle({ text, size = 44, color = '#FFFFFF', style }) {
  const big = size >= 40;
  return (
    <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: Math.round(size * (big ? 0.92 : 0.82)), lineHeight: 1.08, color, letterSpacing: big ? '-0.02em' : '-0.01em', textShadow: big ? '0 3px 0 rgba(0,0,0,0.28), 0 8px 24px rgba(0,0,0,0.35)' : '0 2px 10px rgba(0,0,0,0.4)', textWrap: 'balance', ...style }}>{text}</div>
  );
}

export function useJoystick(wrapRef, opts) {
  const o = opts || {};
  const joy = useRef({ x: 0, y: 0, id: null, cx: 0, cy: 0, mag: 0 });
  const [view, setView] = useState(null);
  const knob = useRef(null);
  const R = typeof o.radius === 'function' ? o.radius() : o.radius || 52;
  const local = (e) => {
    const el = wrapRef.current;
    const r = el.getBoundingClientRect();
    if (o.rot && o.rot()) return { x: e.clientY - r.top, y: r.right - e.clientX };
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const onDown = (e) => {
    if (o.enabled && !o.enabled()) return;
    if (joy.current.id != null) return;
    const el = wrapRef.current;
    const { x, y } = local(e);
    if (o.zone && !o.zone(x, y, { width: el.clientWidth, height: el.clientHeight })) return;
    Sfx.init();
    joy.current = { x: 0, y: 0, id: e.pointerId, cx: x, cy: y, mag: 0 };
    setView({ x, y });
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
  };
  const onMove = (e) => {
    const J = joy.current;
    if (J.id !== e.pointerId) return;
    const q = local(e);
    let dx = q.x - J.cx, dy = q.y - J.cy;
    const d = Math.hypot(dx, dy);
    if (d > R * 1.6) { const k = (d - R * 1.6) / d; J.cx += dx * k; J.cy += dy * k; dx -= dx * k; dy -= dy * k; setView({ x: J.cx, y: J.cy }); }
    const dd = Math.hypot(dx, dy);
    const k2 = dd > R ? R / dd : 1;
    if (knob.current) knob.current.style.transform = `translate(${dx * k2}px,${dy * k2}px)`;
    const m = Math.min(1, dd / R);
    J.mag = m;
    if (m < 0.1) { J.x = 0; J.y = 0; } else { const mm = Math.min(1, (m - 0.1) / 0.8); J.x = dx / dd * mm; J.y = dy / dd * mm; }
  };
  const onUp = (e) => { if (joy.current.id !== e.pointerId) return; joy.current = { x: 0, y: 0, id: null, cx: 0, cy: 0, mag: 0 }; setView(null); };
  const reset = () => { joy.current = { x: 0, y: 0, id: null, cx: 0, cy: 0, mag: 0 }; setView(null); };
  return { joy, view, knob, handlers: { onPointerDown: onDown, onPointerMove: onMove, onPointerUp: onUp, onPointerCancel: onUp }, reset, R };
}

export function GJoy({ view, knobRef, color = 'blue', idle, R = 52, alpha = 1, flat = false }) {
  const c = GC[color] || GC.blue;
  const flatBase = (x, y, op) => (
    <div style={{ position: 'absolute', left: x - R - 10, top: y - R - 10, width: (R + 10) * 2, height: (R + 10) * 2, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.22) 100%)', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.5)', pointerEvents: 'none', opacity: op * alpha }}>
      <div ref={op === 1 ? knobRef : null} style={{ position: 'absolute', left: R + 10 - Math.round(R * 0.42), top: R + 10 - Math.round(R * 0.42), width: Math.round(R * 0.84), height: Math.round(R * 0.84), borderRadius: '50%', background: 'rgba(255,255,255,0.42)', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.9), 0 2px 6px rgba(0,0,0,0.25)' }} />
    </div>
  );
  if (flat) {
    if (view) return flatBase(view.x, view.y, 1);
    if (idle) return flatBase(idle.x, idle.y, 0.6);
    return null;
  }
  const base = (x, y, op) => (
    <div style={{ position: 'absolute', left: x - R - 14, top: y - R - 14, width: (R + 14) * 2, height: (R + 14) * 2, borderRadius: '50%', background: 'radial-gradient(circle at 50% 40%, rgba(255,255,255,0.18), rgba(255,255,255,0.06) 70%)', boxShadow: `0 0 0 3px ${INK}, inset 0 0 0 4px rgba(255,255,255,0.22), 0 6px 14px rgba(0,0,0,0.3)`, pointerEvents: 'none', opacity: op * alpha }}>
      <div ref={op === 1 ? knobRef : null} style={{ position: 'absolute', left: R + 14 - Math.round(R * 0.575), top: R + 14 - Math.round(R * 0.575), width: Math.round(R * 1.15), height: Math.round(R * 1.15), borderRadius: '50%', background: `radial-gradient(circle at 38% 30%, ${c[0]} 0%, ${c[1]} 62%, ${c[2]} 100%)`, boxShadow: `0 0 0 3px ${INK}, 0 6px 0 rgba(0,0,0,0.3)` }}>
        <div style={{ position: 'absolute', left: 12, top: 8, width: 24, height: 14, borderRadius: '50%', background: 'rgba(255,255,255,0.65)' }} />
      </div>
    </div>
  );
  if (view) return base(view.x, view.y, 1);
  if (idle) return base(idle.x, idle.y, 0.55);
  return null;
}

export function GIconCap({ icon, text, label, onPress, on = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, minWidth: 60 }}>
      <GBtn icon={icon} color="dark" active={on} size={46} fast={false} label={label || text} onPress={onPress} />
      <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.72)', whiteSpace: 'nowrap' }}>{text}</span>
    </div>
  );
}

export function GStat({ items, accent = '#FFD84E' }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`, gap: 1, width: '100%', borderRadius: 10, overflow: 'hidden', background: 'rgba(255,255,255,0.08)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)' }}>
      {items.map(([a, v]) => (
        <div key={a} style={{ padding: '9px 4px 8px', background: 'rgba(10,14,22,0.72)', textAlign: 'center', fontFamily: FONT }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: accent, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>{v}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>{a}</div>
        </div>
      ))}
    </div>
  );
}

export function GToggle({ on, onPress, label, iconOn, iconOff }) {
  return <GBtn icon={on ? iconOn : iconOff} label={label} onPress={onPress} color={on ? 'green' : 'dark'} size={46} />;
}

const CTL_KEY = 'zchat-game-controls';
const ctlSubs = new Set();
let ctlNow = null;
function ctlRead() {
  try {
    const v = JSON.parse(localStorage.getItem(CTL_KEY) || 'null');
    if (v && typeof v === 'object') return { size: Math.min(1.25, Math.max(0.6, Number(v.size) || 1)), see: Math.min(0.7, Math.max(0, Number(v.see) || 0)), side: v.side !== false };
  } catch {}
  return { size: 1, see: 0, side: true };
}
export function ctlLook() { if (!ctlNow) ctlNow = ctlRead(); return ctlNow; }
export function setCtlLook(patch) {
  ctlNow = { ...ctlLook(), ...patch };
  try { localStorage.setItem(CTL_KEY, JSON.stringify(ctlNow)); } catch {}
  ctlSubs.forEach((f) => { try { f(ctlNow); } catch {} });
}
export function useCtlLook() {
  const [v, setV] = useState(ctlLook);
  useEffect(() => { const f = (n) => setV(n); ctlSubs.add(f); return () => { ctlSubs.delete(f); }; }, []);
  return v;
}
const SIZES = [[0.7, 'Small'], [0.85, 'Medium'], [1, 'Normal'], [1.15, 'Big']];
const SEES = [[0, 'Solid'], [0.25, 'Light'], [0.45, 'Half'], [0.65, 'Clear']];
function GSteps({ label, value, opts, onPick }) {
  const near = opts.reduce((a, b) => (Math.abs(b[0] - value) < Math.abs(a[0] - value) ? b : a))[0];
  return (
    <div style={{ width: '100%' }}>
      <div style={{ fontSize: 13.5, fontWeight: 800, color: 'rgba(255,255,255,0.9)', marginBottom: 6 }}>{label}</div>
      <div role="radiogroup" aria-label={label} style={{ display: 'grid', gridTemplateColumns: `repeat(${opts.length}, minmax(0, 1fr))`, gap: 4, padding: 3, borderRadius: 10, background: 'rgba(255,255,255,0.06)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)' }}>
        {opts.map(([v, t]) => {
          const on = v === near;
          return (
            <button key={t} type="button" role="radio" aria-checked={on} className="zgk-btn" {...pressProps(() => { kitTap(); onPick(v); })}
              style={{ height: 34, borderRadius: 7, border: 'none', background: on ? '#F7C53A' : 'transparent', color: on ? '#1F1702' : 'rgba(255,255,255,0.8)', fontFamily: FONT, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>{t}</button>
          );
        })}
      </div>
    </div>
  );
}
export function GControlsPanel({ onClose, sideways, wide }) {
  const v = useCtlLook();
  const samples = (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 14, height: wide ? 96 : 84 }}>
      <div style={{ opacity: 1 - v.see, transform: `scale(${v.size})`, transformOrigin: 'bottom center', transition: 'transform .15s ease, opacity .15s ease' }}><GHudSkill icon="dash" main size={66} label="Sample button" onPress={() => {}} /></div>
      <div style={{ opacity: 1 - v.see, transform: `scale(${v.size})`, transformOrigin: 'bottom center', transition: 'transform .15s ease, opacity .15s ease' }}><GHudSkill icon="suck" size={50} label="Sample button" onPress={() => {}} /></div>
    </div>
  );
  const opts = (
    <>
      <GSteps label="Button size" value={v.size} opts={SIZES} onPick={(x) => setCtlLook({ size: x })} />
      <GSteps label="See through" value={v.see} opts={SEES} onPick={(x) => setCtlLook({ see: x })} />
      {sideways && (
        <div role="switch" aria-checked={v.side} tabIndex={0} {...pressProps(() => { setCtlLook({ side: !v.side }); kitTap(); })} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', cursor: 'pointer', fontSize: 14, fontWeight: 900, color: '#FFFFFF' }}>
          <span style={{ flex: 1 }}>Play sideways<span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.65)' }}>No need to turn your phone setting</span></span>
          <span aria-hidden="true" style={{ width: 46, height: 28, borderRadius: 14, background: v.side ? '#F7C53A' : 'rgba(255,255,255,0.18)', position: 'relative', transition: 'background .15s ease', flexShrink: 0 }}><span style={{ position: 'absolute', top: 3, left: v.side ? 21 : 3, width: 22, height: 22, borderRadius: 11, background: '#FFFFFF', transition: 'left .15s ease' }} /></span>
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, width: '100%' }}>
        <GPill text="Reset" color="white" small onPress={() => setCtlLook({ size: 1, see: 0 })} style={{ flex: 1 }} wide />
        <GPill text="Done" color="green" small onPress={onClose} style={{ flex: 1 }} wide />
      </div>
    </>
  );
  if (wide) {
    return (
      <GPanel style={{ width: '100%', maxWidth: 640, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 18, animation: 'zgk-pop 0.25s ease-out', boxSizing: 'border-box' }}>
        <div style={{ width: 170, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <GTitle text="Controls" size={28} />
          {samples}
        </div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 11 }}>{opts}</div>
      </GPanel>
    );
  }
  return (
    <GPanel style={{ width: '100%', maxWidth: 360, padding: '16px 16px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 13, animation: 'zgk-pop 0.25s ease-out', boxSizing: 'border-box' }}>
      <GTitle text="Controls" size={28} />
      {samples}
      {opts}
    </GPanel>
  );
}

export function pressProps(fn) {
  return {
    onPointerDown: (e) => { e.stopPropagation(); if (e.button > 0) return; e.currentTarget.dataset.pd = String(Date.now()); fn(e); },
    onClick: (e) => { e.stopPropagation(); if (Date.now() - Number(e.currentTarget.dataset.pd || 0) < 800) return; fn(e); },
  };
}

export function useFrameBudget() {
  const st = useRef({ dpr: 1, avg: 16.7, n: 0, low: false });
  const tick = (ms) => {
    const S = st.current;
    S.avg = S.avg * 0.95 + ms * 0.05;
    S.n += 1;
    if (S.n > 90 && S.avg > 24 && !S.low) S.low = true;
    if (S.n > 90 && S.avg < 15 && S.low) S.low = false;
    return S;
  };
  return { st, tick };
}

export function maxDpr(low) {
  const d = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  return Math.min(low ? 1.25 : 2, d);
}

export const TOUCHY = typeof window !== 'undefined' && ((typeof navigator !== 'undefined' && (navigator.maxTouchPoints || 0) > 0) || 'ontouchstart' in window);
export function useStageBox(ref) {
  const [box, setBox] = useState(() => ({ w: typeof window !== 'undefined' ? window.innerWidth : 390, h: typeof window !== 'undefined' ? window.innerHeight : 844 }));
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const upd = () => { const w = el.clientWidth, h = el.clientHeight; if (w && h) setBox((b) => (b.w === w && b.h === h ? b : { w, h })); };
    upd();
    let ro = null;
    try { ro = new ResizeObserver(upd); ro.observe(el); } catch { window.addEventListener('resize', upd); }
    return () => { if (ro) ro.disconnect(); else window.removeEventListener('resize', upd); };
  }, []);
  return box;
}
const envIn = (n) => `env(safe-area-inset-${n}, 0px)`;
const lockable = () => typeof window !== 'undefined' && window.screen && window.screen.orientation && typeof window.screen.orientation.lock === 'function';
export function useGameStage(look) {
  const rootRef = useRef(null);
  const box = useStageBox(rootRef);
  const want = !!(look && look.side) && TOUCHY;
  useEffect(() => {
    if (!want || !lockable()) return undefined;
    const so = window.screen.orientation;
    let tried = false;
    try { const r = so.lock('landscape'); tried = true; if (r && r.catch) r.catch(() => {}); } catch {}
    return () => { if (tried) { try { so.unlock(); } catch {} } };
  }, [want]);
  const sideRef = useRef(false);
  const tall = box.h > box.w * 1.08, wide = box.w > box.h * 1.08;
  const side = want && (sideRef.current ? !wide : tall);
  sideRef.current = side;
  const W = side ? box.h : box.w, H = side ? box.w : box.h;
  const ins = side ? { t: envIn('right'), r: envIn('bottom'), b: envIn('left'), l: envIn('top') } : { t: envIn('top'), r: envIn('right'), b: envIn('bottom'), l: envIn('left') };
  const at = { top: (px) => `calc(${px}px + ${ins.t})`, right: (px) => `calc(${px}px + ${ins.r})`, bottom: (px) => `calc(${px}px + ${ins.b})`, left: (px) => `calc(${px}px + ${ins.l})` };
  const wrapStyle = side
    ? { position: 'absolute', left: 0, top: 0, width: box.h, height: box.w, transformOrigin: '0 0', transform: `translateX(${box.w}px) rotate(90deg)`, overflow: 'hidden', touchAction: 'none' }
    : { position: 'absolute', inset: 0, overflow: 'hidden', touchAction: 'none' };
  return { rootRef, box, side, W, H, land: W > H, at, wrapStyle };
}
export function stagePoint(el, e, side) {
  const r = el.getBoundingClientRect();
  return side ? { x: e.clientY - r.top, y: r.right - e.clientX } : { x: e.clientX - r.left, y: e.clientY - r.top };
}

export function GHudBtn({ icon, label, onPress, on = false, tone = '#7CF2A0', size = 36, badge, children }) {
  injectKitCss();
  const ic = Math.round(size * 0.48);
  return (
    <button type="button" className="zgk-btn" aria-label={label} aria-pressed={on || undefined} {...pressProps(() => { kitTap('click'); if (onPress) onPress(); })}
      style={{ position: 'relative', width: size, height: size, borderRadius: '50%', border: 'none', padding: 0, flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', boxShadow: `inset 0 0 0 1.5px ${on ? tone : 'rgba(255,255,255,0.58)'}` }}>
      {children || <GIcon k={icon} size={ic} color={on ? tone : '#FFFFFF'} line stroke={2} />}
      {badge != null && <span aria-hidden="true" style={{ position: 'absolute', right: -2, top: -2, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 8, background: '#E5484D', color: '#FFFFFF', fontFamily: FONT, fontWeight: 800, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>{badge}</span>}
    </button>
  );
}

export function GHudPanel({ children, style }) {
  return <div style={{ borderRadius: 8, background: 'linear-gradient(90deg, rgba(0,0,0,0.46), rgba(0,0,0,0.26))', color: '#FFFFFF', fontFamily: FONT, textShadow: '0 1px 2px rgba(0,0,0,0.55)', ...style }}>{children}</div>;
}

export function GFeed({ items, align = 'right', style }) {
  injectKitCss();
  const right = align === 'right';
  return (
    <div aria-live="polite" style={{ display: 'flex', flexDirection: 'column', alignItems: right ? 'flex-end' : 'flex-start', gap: 3, pointerEvents: 'none', fontFamily: FONT, ...style }}>
      {items.map((it) => (
        <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: right ? '3px 9px 3px 22px' : '3px 22px 3px 9px', background: `linear-gradient(${right ? 270 : 90}deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.32) 65%, rgba(0,0,0,0) 100%)`, color: it.col || '#FFFFFF', fontSize: 12, fontWeight: 700, lineHeight: 1.25, whiteSpace: 'nowrap', textShadow: '0 1px 2px rgba(0,0,0,0.7)', animation: `${right ? 'zgk-feed' : 'zgk-feedl'} ${it.life || 3.6}s ease-out forwards` }}>
          {it.dot && <span style={{ width: 6, height: 6, borderRadius: 3, background: it.dot, flexShrink: 0 }} />}
          <span>{it.text}</span>
        </div>
      ))}
    </div>
  );
}

export function GRibbon({ title, sub, col = '#FFFFFF', life = 2.4 }) {
  injectKitCss();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none', fontFamily: FONT, animation: `zgk-rib ${life}s ease-out forwards` }}>
      <div style={{ padding: '5px 46px 6px', background: 'linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 22%, rgba(0,0,0,0.55) 78%, rgba(0,0,0,0) 100%)', color: col, fontSize: 16, fontWeight: 800, whiteSpace: 'nowrap', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>{title}</div>
      {sub && <div style={{ marginTop: 2, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.86)', whiteSpace: 'nowrap', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>{sub}</div>}
    </div>
  );
}

const NOTE_KIND = {
  watch: { icon: 'eye', bg: '#2F7BF5', snd: 'click' },
  unwatch: { icon: 'eyeoff', bg: '#5B6474', snd: 'click' },
  leave: { icon: 'door', bg: '#E5484D', snd: 'bump' },
  join: { icon: 'enter', bg: '#22A55B', snd: 'pop' },
  info: { icon: 'chat', bg: '#5B6474', snd: 'click' },
};
export function useNotices() {
  const [items, setItems] = useState([]);
  const timers = useRef(new Set());
  useEffect(() => () => { timers.current.forEach((t) => clearTimeout(t)); timers.current.clear(); }, []);
  const push = useCallback((text, kind, life) => {
    const L = life || 3.6;
    const K = NOTE_KIND[kind] || NOTE_KIND.info;
    const it = { id: `${Date.now()}${Math.random()}`, text, kind: NOTE_KIND[kind] ? kind : 'info', life: L };
    setItems((v) => [...v.filter((x) => x.text !== text).slice(-2), it]);
    const t = setTimeout(() => { timers.current.delete(t); setItems((v) => v.filter((x) => x !== it)); }, L * 1000 + 80);
    timers.current.add(t);
    try { Sfx.play(K.snd, { vol: 0.45 }); } catch {}
  }, []);
  return [items, push];
}
export function useWatchNotices(list, push, on = true) {
  const S = useRef({ seen: new Map(), gone: new Map() });
  const pushRef = useRef(push);
  pushRef.current = push;
  useEffect(() => {
    if (!on) return;
    const st = S.current;
    const now = new Map();
    for (const w of list || []) if (w && w.id) now.set(w.id, w.n || 'Friend');
    for (const [id, n] of now) {
      const g = st.gone.get(id);
      if (g) { clearTimeout(g); st.gone.delete(id); } else if (!st.seen.has(id)) pushRef.current(`${n} is watching`, 'watch');
      st.seen.set(id, n);
    }
    for (const [id, n] of st.seen) {
      if (now.has(id) || st.gone.has(id)) continue;
      st.gone.set(id, setTimeout(() => { st.gone.delete(id); st.seen.delete(id); pushRef.current(`${n} stopped watching`, 'unwatch'); }, 2500));
    }
  }, [list, on]);
  useEffect(() => () => { for (const t of S.current.gone.values()) clearTimeout(t); }, []);
}
export function GNotices({ items, style }) {
  injectKitCss();
  if (!items || !items.length) return null;
  return (
    <div aria-live="polite" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, pointerEvents: 'none', fontFamily: FONT, ...style }}>
      {items.map((it) => {
        const K = NOTE_KIND[it.kind] || NOTE_KIND.info;
        return (
          <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 8, maxWidth: '100%', height: 34, padding: '0 14px 0 5px', borderRadius: 17, background: 'rgba(10,12,18,0.82)', boxShadow: '0 4px 16px rgba(0,0,0,0.32), inset 0 0 0 1px rgba(255,255,255,0.08)', color: '#FFFFFF', fontSize: 13.5, fontWeight: 800, whiteSpace: 'nowrap', boxSizing: 'border-box', animation: `zgk-note ${it.life}s ease-out forwards` }}>
            <span style={{ width: 24, height: 24, borderRadius: 12, background: K.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><GIcon k={K.icon} size={14} color="#FFFFFF" line halo={false} stroke={2.3} /></span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{it.text}</span>
          </div>
        );
      })}
    </div>
  );
}

export function GHint({ text, life = 4 }) {
  injectKitCss();
  return <div style={{ maxWidth: '100%', textAlign: 'center', fontFamily: FONT, fontSize: 12.5, fontWeight: 700, lineHeight: 1.4, color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 3px rgba(0,0,0,0.85), 0 0 8px rgba(0,0,0,0.35)', pointerEvents: 'none', animation: `zgk-hint ${life}s ease-out forwards` }}>{text}</div>;
}

const SKILL_ART = {
  dash: (g) => <><defs><linearGradient id={g} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8CF3FF" /><stop offset="1" stopColor="#1A93D4" /></linearGradient></defs><path d="M1.6 9.6h4.2M.8 12.4h4.6M1.8 15.2h3.8" stroke="#C8F8FF" strokeWidth="1.6" strokeLinecap="round" /><path d="M8.6 12.4c2.3-3.7 6.4-5.2 9.9-3.7 1.4.6 2.5 1.7 3.5 3.7-1 2-2.1 3.1-3.5 3.7-3.5 1.5-7.6 0-9.9-3.7z" fill={`url(#${g})`} /><path d="M9.2 12.4L5.9 8.8v7.2z" fill={`url(#${g})`} /><path d="M13.2 9.2c.9 1 1.3 2 1.3 3.2s-.4 2.2-1.3 3.2" stroke="#0E5E8C" strokeWidth="1" fill="none" strokeLinecap="round" opacity=".55" /><circle cx="18.4" cy="11.3" r="1.15" fill="#062A3E" /><circle cx="18.7" cy="11" r=".38" fill="#FFFFFF" /></>,
  suck: (g) => <><defs><linearGradient id={g} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#E2C6FF" /><stop offset="1" stopColor="#7B47E6" /></linearGradient></defs><path d="M10.8 12a1.2 1.2 0 0 1 2.4 0 2.4 2.4 0 0 1-4.8 0 3.6 3.6 0 0 1 7.2 0 4.8 4.8 0 0 1-9.6 0 6 6 0 0 1 12 0" fill="none" stroke={`url(#${g})`} strokeWidth="1.9" strokeLinecap="round" /><circle cx="20.6" cy="5.4" r="1.4" fill="#E9D8FF" /><circle cx="3.6" cy="18.8" r="1.2" fill="#E9D8FF" /><circle cx="20.8" cy="18.2" r=".9" fill="#E9D8FF" opacity=".8" /><circle cx="4" cy="5.8" r=".8" fill="#E9D8FF" opacity=".7" /></>,
  shield: (g) => <><defs><linearGradient id={g} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#A8E2FF" /><stop offset="1" stopColor="#2771E0" /></linearGradient></defs><path d="M12 2.6l7.8 3.1v5.9c0 4.7-3.2 8.2-7.8 9.8-4.6-1.6-7.8-5.1-7.8-9.8V5.7z" fill={`url(#${g})`} /><path d="M12 4.6l6 2.4v4.6c0 3.7-2.5 6.5-6 7.8z" fill="#FFFFFF" opacity=".16" /><circle cx="9.4" cy="10" r="2.3" fill="none" stroke="#FFFFFF" strokeWidth="1.1" opacity=".9" /><circle cx="13.6" cy="14.2" r="1.4" fill="none" stroke="#FFFFFF" strokeWidth="1" opacity=".8" /><circle cx="14.6" cy="9" r=".9" fill="#FFFFFF" opacity=".85" /></>,
  shock: (g) => <><defs><linearGradient id={g} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFF58A" /><stop offset="1" stopColor="#F59E0B" /></linearGradient></defs><circle cx="12" cy="12" r="9.6" fill="none" stroke="#FFE45A" strokeWidth="1.3" strokeDasharray="2.6 2.2" opacity=".9" /><path d="M13.6 3.4L6.6 13.4h4.8l-1.3 7.2 7.2-10.4h-4.9z" fill={`url(#${g})`} /><path d="M13.6 3.4L6.6 13.4h2.2l4.8-7.4z" fill="#FFFFFF" opacity=".35" /></>,
  frenzy: (g) => <><defs><linearGradient id={g} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FF9F6E" /><stop offset="1" stopColor="#E0303A" /></linearGradient></defs><path d="M2.6 12c2.6-5.4 16.2-5.4 18.8 0-2.6 5.4-16.2 5.4-18.8 0z" fill="#3B0B10" /><path d="M4.4 10.2l1.5 2.3 1.4-2.9 1.6 3.1 1.5-3.3 1.6 3.3 1.6-3.3 1.5 3.3 1.6-3.1 1.4 2.9 1.5-2.3" fill="#FFFFFF" /><path d="M4.6 13.9l1.5-1.8 1.4 2.4 1.6-2.6 1.5 2.8 1.4-2.8 1.5 2.8 1.6-2.6 1.4 2.4 1.5-1.8" fill="#FFFFFF" opacity=".92" /><path d="M2.6 12c2.6-5.4 16.2-5.4 18.8 0-2.6 5.4-16.2 5.4-18.8 0z" fill="none" stroke={`url(#${g})`} strokeWidth="2.4" strokeLinejoin="round" /><path d="M5 5.6l1.2 1.8M12 3.4v2.2M19 5.6l-1.2 1.8" stroke="#FFB27A" strokeWidth="1.4" strokeLinecap="round" /></>,
};
let skillSeq = 0;
export function GSkillArt({ k, size = 28 }) {
  const id = useRef(null);
  if (!id.current) { skillSeq += 1; id.current = `zsk${skillSeq}`; }
  const f = SKILL_ART[k];
  if (!f) return null;
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ display: 'block', overflow: 'visible', filter: 'drop-shadow(0 1px 1.5px rgba(0,0,0,0.45))' }}>{f(id.current)}</svg>;
}

export function GHudSkill({ icon, art, label, onPress, size = 52, cool = 0, coolMax = 0, main = false, sound = 'pop' }) {
  injectKitCss();
  const [down, setDown] = useState(false);
  const busy = cool > 0;
  const frac = coolMax > 0 ? Math.max(0, Math.min(1, cool / coolMax)) : 0;
  const fire = () => { if (busy) return; kitTap(sound); if (onPress) onPress(); };
  return (
    <button type="button" className="zgk-btn" aria-label={label}
      onPointerDown={(e) => { e.stopPropagation(); if (e.cancelable) e.preventDefault(); setDown(true); fire(); }}
      onPointerUp={(e) => { e.stopPropagation(); setDown(false); }}
      onPointerCancel={() => setDown(false)}
      onPointerLeave={() => setDown(false)}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); } }}
      style={{ position: 'relative', width: size, height: size, padding: 0, border: 'none', borderRadius: '50%', background: 'transparent', cursor: busy ? 'default' : 'pointer', flexShrink: 0, transform: down ? 'scale(0.94)' : 'none', transition: 'transform 0.06s ease-out' }}>
      <span aria-hidden="true" style={{ position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden', background: down ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.3)', boxShadow: `inset 0 0 0 ${main ? 2 : 1.5}px rgba(255,255,255,${busy ? 0.32 : main ? 0.82 : 0.62})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {frac > 0 && <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `conic-gradient(rgba(0,0,0,0.5) ${frac * 360}deg, rgba(0,0,0,0) 0deg)` }} />}
        <span style={{ position: 'relative', opacity: busy ? 0.45 : 1, filter: busy ? 'grayscale(0.6)' : 'none' }}>{art ? <GSkillArt k={art} size={Math.round(size * 0.56)} /> : <GIcon k={icon} size={Math.round(size * 0.44)} color="#FFFFFF" line stroke={main ? 2.3 : 2.1} />}</span>
        {busy && coolMax > 1.5 && <span style={{ position: 'absolute', left: 0, right: 0, top: '50%', transform: 'translateY(-50%)', textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: Math.round(size * 0.3), color: '#FFFFFF', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>{Math.ceil(cool)}</span>}
      </span>
    </button>
  );
}
