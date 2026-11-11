import React, { useEffect, useRef, useState } from 'react';
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
};
const FILLED = new Set(['dash', 'shield', 'bolt', 'flame', 'up', 'left', 'right', 'play', 'star', 'heart', 'crown', 'bomb', 'sword']);

export function GIcon({ k, size = 26, color = '#FFFFFF', ink = INK, stroke }) {
  const d = ICON[k] || ICON.star;
  const filled = FILLED.has(k);
  const sw = stroke || 2.4;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
      <path d={d} fill={filled ? ink : 'none'} stroke={ink} strokeWidth={sw + 3.2} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill={filled ? color : 'none'} stroke={color} strokeWidth={filled ? 1.2 : sw} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function GBtn({ icon, label, onPress, color = 'blue', size = 64, cool = 0, coolMax = 0, badge, disabled, fast = true, sound = 'pop', iconSize, style, children, active }) {
  injectKitCss();
  const [down, setDown] = useState(false);
  const c = GC[color] || GC.blue;
  const edge = Math.max(4, Math.round(size * 0.075));
  const busy = cool > 0 || disabled;
  const fire = () => { if (busy) return; kitTap(sound); if (onPress) onPress(); };
  const frac = coolMax > 0 ? Math.max(0, Math.min(1, cool / coolMax)) : 0;
  return (
    <button type="button" className="zgk-btn" aria-label={label} disabled={!!disabled}
      onPointerDown={(e) => { e.stopPropagation(); if (e.cancelable) e.preventDefault(); setDown(true); if (fast) fire(); }}
      onPointerUp={(e) => { e.stopPropagation(); setDown(false); }}
      onPointerCancel={() => setDown(false)}
      onPointerLeave={() => setDown(false)}
      onClick={(e) => { e.stopPropagation(); if (!fast) fire(); }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); } }}
      style={{ position: 'relative', width: size, height: size + edge, padding: 0, border: 'none', background: 'transparent', cursor: busy ? 'default' : 'pointer', flexShrink: 0, ...style }}>
      <span aria-hidden="true" style={{ position: 'absolute', left: 0, top: edge, width: size, height: size, borderRadius: '50%', background: c[2], boxShadow: `0 0 0 3px ${INK}, 0 ${edge + 4}px 10px rgba(0,0,0,0.35)` }} />
      <span aria-hidden="true" style={{ position: 'absolute', left: 0, top: down ? edge - 1 : 0, width: size, height: size, borderRadius: '50%', overflow: 'hidden', background: busy ? `linear-gradient(180deg, ${GC.dark[0]} 0%, ${GC.dark[1]} 100%)` : `linear-gradient(180deg, ${c[0]} 0%, ${c[1]} 70%)`, boxShadow: `0 0 0 3px ${INK}, inset 0 -${Math.round(size * 0.06)}px 0 rgba(0,0,0,0.18)`, transition: 'top 0.06s ease-out', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ position: 'absolute', left: '14%', right: '14%', top: '6%', height: '34%', borderRadius: '50%', background: 'linear-gradient(180deg, rgba(255,255,255,0.75), rgba(255,255,255,0.08))' }} />
        {active && <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', boxShadow: 'inset 0 0 0 4px rgba(255,255,255,0.85)' }} />}
        {frac > 0 && <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `conic-gradient(rgba(10,6,24,0.62) ${frac * 360}deg, rgba(10,6,24,0) 0deg)` }} />}
        <span style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: busy ? 0.75 : 1 }}>
          {children || <GIcon k={icon} size={iconSize || Math.round(size * 0.46)} color={color === 'white' ? '#3A3352' : '#FFFFFF'} ink={INK} />}
        </span>
        {cool > 0 && <span style={{ position: 'absolute', right: '50%', bottom: '8%', transform: 'translateX(50%)', fontFamily: FONT, fontWeight: 900, fontSize: Math.round(size * 0.24), color: '#FFFFFF', textShadow: `0 2px 0 ${INK}, 0 0 4px ${INK}` }}>{Math.ceil(cool)}</span>}
      </span>
      {badge != null && <span aria-hidden="true" style={{ position: 'absolute', right: -4, top: -4, minWidth: 22, height: 22, padding: '0 5px', borderRadius: 11, background: GC.red[1], color: '#FFFFFF', fontFamily: FONT, fontWeight: 900, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 0 2.5px ${INK}` }}>{badge}</span>}
    </button>
  );
}

export function GHold({ icon, label, color = 'blue', size = 72, onDown, onUp, style }) {
  injectKitCss();
  const [down, setDown] = useState(false);
  const pid = useRef(null);
  const c = GC[color] || GC.blue;
  const edge = Math.max(4, Math.round(size * 0.075));
  const start = (e) => { e.stopPropagation(); if (e.cancelable) e.preventDefault(); if (pid.current != null) return; pid.current = e.pointerId; try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} setDown(true); if (onDown) onDown(); };
  const end = (e) => { if (e && pid.current !== e.pointerId) return; pid.current = null; setDown(false); if (onUp) onUp(); };
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
  const c = GC[color] || GC.green;
  const edge = small ? 4 : 6;
  const h = small ? Math.min(height, 44) : height;
  const ink = color === 'gold' || color === 'white' ? '#3A2508' : '#FFFFFF';
  const fire = () => { if (disabled) return; kitTap(sound); if (onPress) onPress(); };
  return (
    <button type="button" className="zgk-btn" aria-label={text} disabled={!!disabled}
      onPointerDown={(e) => { e.stopPropagation(); setDown(true); if (fast) { if (e.cancelable) e.preventDefault(); fire(); } }}
      onPointerUp={() => setDown(false)} onPointerCancel={() => setDown(false)} onPointerLeave={() => setDown(false)}
      onClick={(e) => { e.stopPropagation(); if (!fast) fire(); }}
      style={{ position: 'relative', width: wide ? '100%' : undefined, height: h + edge, padding: 0, border: 'none', background: 'transparent', cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.55 : 1, ...style }}>
      <span aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, top: edge, height: h, borderRadius: h / 2, background: c[2], boxShadow: `0 0 0 3px ${INK}, 0 ${edge + 4}px 12px rgba(0,0,0,0.3)` }} />
      <span style={{ position: 'relative', top: down ? edge - 1 : 0, height: h, minWidth: h * 2, padding: `0 ${small ? 16 : 24}px`, borderRadius: h / 2, overflow: 'hidden', background: `linear-gradient(180deg, ${c[0]} 0%, ${c[1]} 72%)`, boxShadow: `0 0 0 3px ${INK}, inset 0 -5px 0 rgba(0,0,0,0.16)`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'top 0.06s ease-out', boxSizing: 'border-box' }}>
        <span style={{ position: 'absolute', left: 14, right: 14, top: 4, height: h * 0.32, borderRadius: h, background: 'linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0.05))' }} />
        {icon && <span style={{ position: 'relative' }}><GIcon k={icon} size={small ? 18 : 22} color={ink === '#FFFFFF' ? '#FFFFFF' : '#3A2508'} ink={INK} /></span>}
        <span style={{ position: 'relative', fontFamily: FONT, fontWeight: 900, fontSize: small ? 15 : 19, color: ink, letterSpacing: '0.01em', whiteSpace: 'nowrap', textShadow: ink === '#FFFFFF' ? `0 2px 0 ${INK}, 1px 0 0 ${INK}, -1px 0 0 ${INK}, 0 -1px 0 ${INK}` : 'none' }}>{text}</span>
      </span>
    </button>
  );
}

export function GPanel({ children, style, color = 'rgba(28,20,52,0.92)', edge = '#0E0A1E' }) {
  return (
    <div style={{ borderRadius: 22, background: color, boxShadow: `0 0 0 3px ${INK}, inset 0 2px 0 rgba(255,255,255,0.14), 0 6px 0 ${edge}, 0 14px 30px rgba(0,0,0,0.35)`, ...style }}>{children}</div>
  );
}

export function GChip({ children, style, color = 'rgba(20,14,40,0.82)' }) {
  return <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 12px', borderRadius: 17, background: color, boxShadow: `0 0 0 2.5px ${INK}, 0 3px 0 rgba(0,0,0,0.35)`, color: '#FFFFFF', fontFamily: FONT, fontWeight: 900, fontSize: 15, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', ...style }}>{children}</div>;
}

export function GTitle({ text, size = 44, color = '#FFE15A', style }) {
  return (
    <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: size, lineHeight: 1, color, letterSpacing: '-0.01em', textShadow: `0 4px 0 ${INK}, 3px 0 0 ${INK}, -3px 0 0 ${INK}, 0 -3px 0 ${INK}, 3px 3px 0 ${INK}, -3px 3px 0 ${INK}, 3px -3px 0 ${INK}, -3px -3px 0 ${INK}, 0 10px 18px rgba(0,0,0,0.35)`, ...style }}>{text}</div>
  );
}

export function useJoystick(wrapRef, opts) {
  const o = opts || {};
  const joy = useRef({ x: 0, y: 0, id: null, cx: 0, cy: 0, mag: 0 });
  const [view, setView] = useState(null);
  const knob = useRef(null);
  const R = o.radius || 52;
  const onDown = (e) => {
    if (o.enabled && !o.enabled()) return;
    if (joy.current.id != null) return;
    const r = wrapRef.current.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (o.zone && !o.zone(x, y, r)) return;
    Sfx.init();
    joy.current = { x: 0, y: 0, id: e.pointerId, cx: x, cy: y, mag: 0 };
    setView({ x, y });
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
  };
  const onMove = (e) => {
    const J = joy.current;
    if (J.id !== e.pointerId) return;
    const r = wrapRef.current.getBoundingClientRect();
    let dx = e.clientX - r.left - J.cx, dy = e.clientY - r.top - J.cy;
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

export function GJoy({ view, knobRef, color = 'blue', idle, R = 52 }) {
  const c = GC[color] || GC.blue;
  const base = (x, y, op) => (
    <div style={{ position: 'absolute', left: x - R - 14, top: y - R - 14, width: (R + 14) * 2, height: (R + 14) * 2, borderRadius: '50%', background: 'radial-gradient(circle at 50% 40%, rgba(255,255,255,0.18), rgba(255,255,255,0.06) 70%)', boxShadow: `0 0 0 3px ${INK}, inset 0 0 0 4px rgba(255,255,255,0.22), 0 6px 14px rgba(0,0,0,0.3)`, pointerEvents: 'none', opacity: op }}>
      <div ref={op === 1 ? knobRef : null} style={{ position: 'absolute', left: R + 14 - 30, top: R + 14 - 30, width: 60, height: 60, borderRadius: '50%', background: `radial-gradient(circle at 38% 30%, ${c[0]} 0%, ${c[1]} 62%, ${c[2]} 100%)`, boxShadow: `0 0 0 3px ${INK}, 0 6px 0 rgba(0,0,0,0.3)` }}>
        <div style={{ position: 'absolute', left: 12, top: 8, width: 24, height: 14, borderRadius: '50%', background: 'rgba(255,255,255,0.65)' }} />
      </div>
    </div>
  );
  if (view) return base(view.x, view.y, 1);
  if (idle) return base(idle.x, idle.y, 0.55);
  return null;
}

export function GToggle({ on, onPress, label, iconOn, iconOff }) {
  return <GBtn icon={on ? iconOn : iconOff} label={label} onPress={onPress} color={on ? 'green' : 'dark'} size={46} fast={false} />;
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
