import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CreditsTab } from './gcredits.jsx';
import { GSkill, GGlyph } from './gskill.jsx';
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

const SKIN0 = { k: '', shape: 'round', face: ['rgba(74,80,116,0.92)', 'rgba(40,44,72,0.92)'], lip: 'rgba(8,8,22,0.75)', edge: INK, ico: '#FFFFFF', gloss: 0.42, panel: 'linear-gradient(90deg, rgba(0,0,0,0.46), rgba(0,0,0,0.26))', pr: 8, pEdge: 'none', note: 'rgba(10,12,18,0.82)', nr: 17, feed: 'rgba(8,10,18,0.6)', name: '#FFD27A' };
export const SKINS = {
  rally: { k: 'rally', dark: ['#3A4566', '#232B45', '#0E1426'], shape: 'sq', face: ['#323C5A', '#161D33'], lip: '#060912', lipEdge: '#060912', edge: 'rgba(255,255,255,0.82)', ico: '#FFFFFF', gloss: 0.16, panel: 'linear-gradient(180deg, rgba(16,24,48,0.84), rgba(8,13,30,0.84))', pr: 5, pEdge: 'inset 3px 0 0 #FFC93C', note: 'rgba(10,16,34,0.92)', nr: 6, feed: 'rgba(10,16,34,0.66)', name: '#FFC93C', joyRing: 'rgba(255,255,255,0.6)', joyKnob: 'rgba(255,255,255,0.45)' },
  siege: { k: 'siege', dark: ['#6E7884', '#434B57', '#1E232B'], shape: 'plate', btnShape: 'plate', face: ['#7C8794', '#434C59'], lip: '#16191F', edge: '#0E1116', ico: '#F4F6F8', gloss: 0.26, rivets: true, panel: 'linear-gradient(180deg, rgba(50,57,68,0.9), rgba(25,29,37,0.9))', pr: 3, pEdge: 'inset 0 2px 0 #F2B21B, inset 0 0 0 1px rgba(255,255,255,0.07)', note: 'rgba(28,32,40,0.95)', nr: 3, feed: 'rgba(24,28,36,0.72)', name: '#F2B21B', joyRing: 'rgba(242,178,27,0.75)', joyKnob: 'rgba(196,204,214,0.5)' },
  roll: { k: 'roll', shape: 'round', face: ['#FFFFFF', '#E2E8F6'], lip: '#8090C8', edge: '#3A3352', ico: '#3A3352', gloss: 0, panel: 'rgba(54,40,100,0.6)', pr: 16, pEdge: 'inset 0 0 0 2px rgba(255,255,255,0.36)', note: 'rgba(54,40,100,0.88)', nr: 18, feed: 'rgba(54,40,100,0.6)', name: '#FFE27A' },
  gulp: { k: 'gulp', dark: ['#2F6E9A', '#1C4C74', '#0C2A48'], shape: 'bubble', face: ['rgba(150,228,255,0.3)', 'rgba(8,72,130,0.6)'], lip: null, edge: 'rgba(205,245,255,0.85)', ico: '#FFFFFF', gloss: 0.6, panel: 'linear-gradient(180deg, rgba(4,54,96,0.62), rgba(2,30,62,0.62))', pr: 14, pEdge: 'inset 0 0 0 1px rgba(150,228,255,0.32)', note: 'rgba(3,40,74,0.88)', nr: 17, feed: 'rgba(3,40,74,0.58)', name: '#8FE8FF', joyRing: 'rgba(190,240,255,0.75)', joyKnob: 'rgba(170,230,255,0.42)' },
  duo: { k: 'duo', dark: ['#6A5644', '#43362A', '#1E1610'], shape: 'tab', face: ['#5E4C3B', '#33281F'], lip: '#160F0A', edge: '#C99A45', ico: '#FBE6B8', gloss: 0.12, panel: 'linear-gradient(180deg, rgba(46,35,25,0.9), rgba(26,19,13,0.9))', pr: 4, pEdge: 'inset 0 0 0 1px rgba(217,165,72,0.55)', note: 'rgba(32,24,16,0.95)', nr: 4, feed: 'rgba(32,24,16,0.7)', name: '#F2C46A', joyRing: 'rgba(242,196,106,0.7)', joyKnob: 'rgba(251,230,184,0.4)' },
  zombie: { k: 'zombie', dark: ['#3A3F45', '#23272B', '#111316'], shape: 'round', face: ['#2C3035', '#16191C'], lip: '#08090A', edge: 'rgba(255,255,255,0.22)', ico: '#F2F2EE', gloss: 0.08, panel: 'linear-gradient(180deg, rgba(22,25,28,0.9), rgba(11,13,15,0.92))', pr: 14, pEdge: 'inset 0 0 0 1px rgba(255,255,255,0.12)', note: 'rgba(16,18,20,0.92)', nr: 14, feed: 'rgba(14,16,18,0.6)', name: '#E0A85A', joyRing: 'rgba(255,255,255,0.55)', joyKnob: 'rgba(255,255,255,0.3)' },
};
const SkinCtx = createContext(null);
export function GSkin({ k, children }) { return <SkinCtx.Provider value={SKINS[k] || null}>{children}</SkinCtx.Provider>; }
export function useSkin() { return useContext(SkinCtx) || SKIN0; }
const CLIP = { plate: 'polygon(24% 0,76% 0,100% 24%,100% 76%,76% 100%,24% 100%,0 76%,0 24%)', cut: 'polygon(0 0,74% 0,100% 26%,100% 100%,0 100%)' };
const RAD = { round: '50%', bubble: '50%', sq: '26%', tab: '16%' };
function SkinBox({ shape, w, h, top, bg, edge, ol, shadow, inset, children, style }) {
  const clip = CLIP[shape];
  if (clip) {
    return (
      <span aria-hidden="true" style={{ position: 'absolute', left: 0, top, width: w, height: h, clipPath: clip, WebkitClipPath: clip, background: edge, filter: shadow ? 'drop-shadow(0 3px 4px rgba(0,0,0,0.3))' : undefined, ...style }}>
        <span style={{ position: 'absolute', inset: ol, clipPath: clip, WebkitClipPath: clip, overflow: 'hidden', background: bg, boxShadow: inset || undefined, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</span>
      </span>
    );
  }
  return <span aria-hidden="true" style={{ position: 'absolute', left: 0, top, width: w, height: h, borderRadius: RAD[shape] || '50%', overflow: 'hidden', background: bg, boxShadow: [ol ? `0 0 0 ${ol}px ${edge}` : '', shadow || '', inset || ''].filter(Boolean).join(', ') || undefined, display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}>{children}</span>;
}
function Rivets({ size }) {
  const d = Math.max(2, Math.round(size * 0.075));
  return <>{[['20%', '20%'], ['80%', '20%'], ['20%', '80%'], ['80%', '80%']].map(([x, y], i) => <span key={i} style={{ position: 'absolute', left: x, top: y, width: d, height: d, marginLeft: -d / 2, marginTop: -d / 2, borderRadius: d, background: 'rgba(255,255,255,0.5)', boxShadow: '0 1px 0 rgba(0,0,0,0.5)' }} />)}</>;
}

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
    '.zgk-range{-webkit-appearance:none;appearance:none;height:6px;border-radius:3px;outline:none;margin:0;cursor:pointer;touch-action:none}',
    '.zgk-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:20px;height:20px;border-radius:10px;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.45)}',
    '.zgk-range::-moz-range-thumb{width:20px;height:20px;border:none;border-radius:10px;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.45)}',
    '.zgk-range:focus-visible{box-shadow:0 0 0 3px #2479E8}',
    '.zgk-btn:focus-visible{box-shadow:0 0 0 3px #fff,0 0 0 6px #2479E8!important}',
    '[data-side="1"] [style*="overflow-y: auto"]{overflow-x:auto!important;touch-action:pan-x pan-y!important}',
    '[style*="overflow-y: auto"] .zgk-btn{touch-action:pan-x pan-y}',
    '@keyframes zgk-feed{0%{opacity:0;transform:translateX(10px)}7%{opacity:1;transform:none}82%{opacity:1}100%{opacity:0}}',
    '@keyframes zgk-feedl{0%{opacity:0;transform:translateX(-10px)}7%{opacity:1;transform:none}82%{opacity:1}100%{opacity:0}}',
    '@keyframes zgk-rib{0%{opacity:0;transform:scaleX(.6)}10%{opacity:1;transform:none}80%{opacity:1}100%{opacity:0}}',
    '@keyframes zgk-hint{0%{opacity:0}10%{opacity:1}85%{opacity:1}100%{opacity:0}}',
    '@keyframes zgk-note{0%{opacity:0;transform:translateY(-10px) scale(.96)}7%{opacity:1;transform:none}86%{opacity:1;transform:none}100%{opacity:0;transform:translateY(-4px)}}',
    '@keyframes zgk-talk{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}',
    '@keyframes zgk-chat{0%{opacity:0;transform:translateY(6px)}4%{opacity:1;transform:none}86%{opacity:1}100%{opacity:0}}',
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
  grenade: 'M9.6 9.2h4.8M10.4 9.2V7h3.2v2.2M13.6 7.6c1.2-1.6 2.9-2.4 4.4-2M7.2 15.4a4.8 5.2 0 1 0 9.6 0a4.8 5.2 0 1 0-9.6 0M8.4 13.6h7.2M8.4 17.2h7.2M12 10.4v10',
  target: 'M12 2.8v4.4M12 16.8v4.4M2.8 12h4.4M16.8 12h4.4M12 8.4a3.6 3.6 0 1 0 0 7.2a3.6 3.6 0 1 0 0-7.2',
  rocket: 'M12 2.2c2.9 2.3 4.4 5.6 4.4 9.6v4.4H7.6v-4.4C7.6 7.8 9.1 4.5 12 2.2zM7.6 12.6L4.4 16.4v2.8h3.2M16.4 12.6l3.2 3.8v2.8h-3.2M10.2 17.6h3.6L12 21.8z',
  drop: 'M12 2.8c3.2 4.4 6.2 7.9 6.2 11.4a6.2 6.2 0 0 1-12.4 0c0-3.5 3-7 6.2-11.4z',
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
  hammer: 'M12.1 4.1L19.9 11.9 16.2 15.6 8.4 7.8ZM3.6 18.6L12.1 10.1 13.9 11.9 5.4 20.4Z',
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
  chevl: 'M15 5l-7 7 7 7',
  chevr: 'M9 5l7 7-7 7',
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
const FILLED = new Set(['rocket', 'drop', 'dash', 'shield', 'bolt', 'flame', 'up', 'left', 'right', 'play', 'star', 'heart', 'crown', 'bomb', 'sword', 'hammer']);

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
  const S = useSkin();
  const [down, setDown] = useState(false);
  const c = (color === 'dark' && S.dark) || GC[color] || GC.dark;
  const light = color === 'white' || color === 'gold';
  const busy = cool > 0 || disabled;
  const fire = () => { if (busy) return; kitTap(sound); if (onPress) onPress(); };
  const frac = coolMax > 0 ? Math.max(0, Math.min(1, cool / coolMax)) : 0;
  const lip = Math.max(3, Math.round(size * 0.075));
  const ol = size >= 50 ? 2.5 : 2;
  const ink = light ? '#262B40' : '#FFFFFF';
  const press = down && !busy;
  const shp = S.btnShape && CLIP[S.btnShape] ? S.btnShape : null;
  const content = (
    <>
      <span style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: busy ? 0.55 : 1, filter: light ? 'none' : `drop-shadow(0 ${Math.max(1, Math.round(size * 0.03))}px 0 ${c[2]})` }}>
        {children || <GIcon k={icon} size={iconSize || Math.round(size * 0.46)} color={ink} line halo={false} stroke={2.6} />}
      </span>
      {cool > 0 && coolMax > 1.5 && <span style={{ position: 'absolute', left: 0, right: 0, top: '50%', transform: 'translateY(-50%)', textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: Math.round(size * 0.32), color: '#FFFFFF', textShadow: `0 2px 0 ${INK}` }}>{Math.ceil(cool)}</span>}
    </>
  );
  return (
    <button type="button" className="zgk-btn" aria-label={label} disabled={!!disabled}
      onPointerDown={(e) => { e.stopPropagation(); if (e.cancelable) e.preventDefault(); setDown(true); if (fast) fire(); }}
      onPointerUp={(e) => { e.stopPropagation(); setDown(false); }}
      onPointerCancel={() => setDown(false)}
      onPointerLeave={() => setDown(false)}
      onClick={(e) => { e.stopPropagation(); if (!fast) fire(); }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); } }}
      style={{ position: 'relative', width: size, height: size + lip, padding: 0, border: 'none', borderRadius: shp ? 4 : '50%', background: 'transparent', cursor: busy ? 'default' : 'pointer', flexShrink: 0, opacity: disabled ? 0.5 : 1, ...style }}>
      {shp ? (
        <>
          {active && <SkinBox shape={shp} w={size + 10} h={size + 10} top={-5} bg="#FFD84E" edge="#FFD84E" ol={0} style={{ left: -5 }} />}
          <SkinBox shape={shp} w={size} h={size} top={lip} bg={c[2]} edge={INK} ol={ol} shadow />
          <SkinBox shape={shp} w={size} h={size} top={press ? lip - 1 : 0} bg={`linear-gradient(180deg, ${c[0]} 0%, ${c[1]} 78%)`} edge={active ? '#FFFFFF' : INK} ol={ol} inset={`inset 0 -${Math.max(2, Math.round(size * 0.05))}px 0 rgba(0,0,0,0.16), inset 0 0 0 ${Math.max(2, Math.round(size * 0.05))}px rgba(255,255,255,0.12)`}>
            <span style={{ position: 'absolute', left: '22%', right: '22%', top: '7%', height: '30%', borderRadius: 3, background: 'linear-gradient(180deg, rgba(255,255,255,0.5), rgba(255,255,255,0.04))' }} />
            {S.rivets && size >= 44 && <Rivets size={size} />}
            {frac > 0 && <span style={{ position: 'absolute', inset: 0, background: `conic-gradient(rgba(10,8,24,0.62) ${frac * 360}deg, rgba(0,0,0,0) 0deg)` }} />}
            {content}
          </SkinBox>
        </>
      ) : (
        <>
          <span aria-hidden="true" style={{ position: 'absolute', left: 0, top: lip, width: size, height: size, borderRadius: '50%', background: c[2], boxShadow: `0 0 0 ${ol}px ${INK}, 0 ${lip}px 8px rgba(0,0,0,0.28)` }} />
          <span aria-hidden="true" style={{ position: 'absolute', left: 0, top: press ? lip - 1 : 0, width: size, height: size, borderRadius: '50%', overflow: 'hidden', background: `linear-gradient(180deg, ${c[0]} 0%, ${c[1]} 78%)`, boxShadow: `0 0 0 ${ol}px ${active ? '#FFFFFF' : INK}, inset 0 -${Math.max(2, Math.round(size * 0.05))}px 0 rgba(0,0,0,0.14)`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'top 0.05s ease-out' }}>
            <span style={{ position: 'absolute', left: '16%', right: '16%', top: '7%', height: '36%', borderRadius: '50%', background: 'linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0.06))' }} />
            {frac > 0 && <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `conic-gradient(rgba(10,8,24,0.62) ${frac * 360}deg, rgba(0,0,0,0) 0deg)` }} />}
            {content}
          </span>
          {active && <span aria-hidden="true" style={{ position: 'absolute', left: -4, top: -4, width: size + 8, height: size + 8, borderRadius: '50%', boxShadow: '0 0 0 3px #FFD84E', pointerEvents: 'none' }} />}
        </>
      )}
      {badge != null && <span aria-hidden="true" style={{ position: 'absolute', right: -4, top: -4, minWidth: 19, height: 19, padding: '0 5px', borderRadius: 10, background: '#E5484D', color: '#FFFFFF', fontFamily: FONT, fontWeight: 900, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', boxShadow: `0 0 0 2px ${INK}` }}>{badge}</span>}
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
  const lip = small ? 4 : 5;
  const c = GC[color] || GC.dark;
  const light = color === 'gold' || color === 'white';
  const ink = color === 'gold' ? '#3A2500' : color === 'white' ? '#262B40' : '#FFFFFF';
  const fire = () => { if (disabled) return; kitTap(sound); if (onPress) onPress(); };
  const press = down && !disabled;
  const r = small ? 11 : 13;
  return (
    <button type="button" className="zgk-btn" aria-label={text} disabled={!!disabled}
      onPointerDown={(e) => { e.stopPropagation(); setDown(true); if (fast) { if (e.cancelable) e.preventDefault(); fire(); } }}
      onPointerUp={() => setDown(false)} onPointerCancel={() => setDown(false)} onPointerLeave={() => setDown(false)}
      onClick={(e) => { e.stopPropagation(); if (!fast) fire(); }}
      style={{ position: 'relative', width: wide ? '100%' : undefined, height: h + lip, minWidth: Math.round(h * 2.2), padding: 0, border: 'none', background: 'transparent', cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.55 : 1, fontFamily: FONT, ...style }}>
      <span aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, top: lip, height: h, borderRadius: r, background: c[2], boxShadow: `0 0 0 2.5px ${INK}, 0 ${lip}px 10px rgba(0,0,0,0.3)` }} />
      <span style={{ position: 'relative', top: press ? lip - 1 : 0, height: h, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: `0 ${small ? 14 : 20}px`, boxSizing: 'border-box', borderRadius: r, overflow: 'hidden', background: `linear-gradient(180deg, ${c[0]} 0%, ${c[1]} 82%)`, boxShadow: `0 0 0 2.5px ${INK}, inset 0 -3px 0 rgba(0,0,0,0.13)`, transition: 'top 0.05s ease-out' }}>
        <span aria-hidden="true" style={{ position: 'absolute', left: 6, right: 6, top: 3, height: '40%', borderRadius: r - 3, background: 'linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.05))', pointerEvents: 'none' }} />
        {icon && <span style={{ position: 'relative', display: 'flex', filter: light ? 'none' : `drop-shadow(0 2px 0 ${c[2]})` }}><GIcon k={icon} size={small ? 17 : 20} color={ink} line halo={false} stroke={2.7} /></span>}
        <span style={{ position: 'relative', fontWeight: 900, fontSize: small ? 15 : 17.5, letterSpacing: '-0.005em', color: ink, textShadow: light ? '0 1px 0 rgba(255,255,255,0.55)' : `0 2px 0 ${c[2]}`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{text}</span>
      </span>
    </button>
  );
}

export function GSeg({ value, items, onPick, disabled, height = 36, label }) {
  injectKitCss();
  return (
    <div role="radiogroup" aria-label={label} style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 13, background: 'rgba(0,0,0,0.45)', boxShadow: `inset 0 2px 5px rgba(0,0,0,0.5), 0 0 0 2px ${INK}` }}>
      {items.map(([k, t]) => {
        const on = value === k;
        return (
          <button key={k} type="button" role="radio" aria-checked={on} className="zgk-btn" disabled={!!disabled && !on} {...pressProps(() => { if (!disabled && !on) onPick(k); })}
            style={{ flex: 1, minWidth: 0, height, border: 'none', borderRadius: 9, padding: '0 8px', fontFamily: FONT, fontSize: 13.5, fontWeight: 900, cursor: disabled ? 'default' : 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', background: on ? 'linear-gradient(180deg, #FFE868 0%, #F5B21E 100%)' : 'transparent', color: on ? '#3A2500' : 'rgba(255,255,255,0.84)', boxShadow: on ? `0 0 0 2px ${INK}, inset 0 -3px 0 rgba(150,90,0,0.45), inset 0 2px 0 rgba(255,255,255,0.55)` : 'none', textShadow: on ? '0 1px 0 rgba(255,255,255,0.5)' : 'none', opacity: disabled && !on ? 0.45 : 1 }}>{t}</button>
        );
      })}
    </div>
  );
}

const PANEL_EDGE = { rally: [10, 'inset 3px 0 0 #FFC93C, inset 0 0 0 1px rgba(255,255,255,0.1)', 'rgba(10,16,34,0.88)'], siege: [6, 'inset 0 2px 0 #F2B21B, inset 0 0 0 1px rgba(255,255,255,0.09)', 'rgba(26,30,38,0.9)'], roll: [20, 'inset 0 0 0 2px rgba(255,255,255,0.22)', 'rgba(40,30,78,0.86)'], gulp: [18, 'inset 0 0 0 1px rgba(150,228,255,0.3)', 'rgba(3,34,64,0.84)'], duo: [6, 'inset 0 0 0 1px rgba(217,165,72,0.5)', 'rgba(30,22,15,0.9)'], zombie: [4, 'inset 0 -2px 0 #F28C28, inset 0 0 0 1px rgba(239,232,210,0.1)', 'rgba(22,24,15,0.9)'] };
export function GPanel({ children, style, color }) {
  const P = PANEL_EDGE[useSkin().k];
  return (
    <div style={{ borderRadius: P ? P[0] : 14, background: color || (P ? P[2] : 'rgba(12,16,24,0.86)'), boxShadow: `${P ? `${P[1]}, ` : 'inset 0 0 0 1px rgba(255,255,255,0.11), '}inset 0 1px 0 rgba(255,255,255,0.08), 0 12px 32px rgba(0,0,0,0.38)`, ...style }}>{children}</div>
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
    const el = wrapRef.current;
    const { x, y } = local(e);
    if (o.zone && !o.zone(x, y, { width: el.clientWidth, height: el.clientHeight })) return;
    if (joy.current.id != null && joy.current.id !== e.pointerId && x > el.clientWidth * 0.45) return;
    Sfx.init();
    joy.current = { x: 0, y: 0, id: e.pointerId, cx: x, cy: y, mag: 0 };
    setView({ x, y });
    if (!o.noCapture) { try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} }
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
  useEffect(() => {
    const ends = (e) => { if (e.touches && e.touches.length === 0 && joy.current.id != null) reset(); };
    const vis = () => { if (document.visibilityState === 'hidden') reset(); };
    window.addEventListener('touchend', ends, true);
    window.addEventListener('touchcancel', ends, true);
    window.addEventListener('blur', reset);
    document.addEventListener('visibilitychange', vis);
    return () => { window.removeEventListener('touchend', ends, true); window.removeEventListener('touchcancel', ends, true); window.removeEventListener('blur', reset); document.removeEventListener('visibilitychange', vis); };
  }, []);
  return { joy, view, knob, handlers: { onPointerDown: onDown, onPointerMove: onMove, onPointerUp: onUp, onPointerCancel: onUp, onLostPointerCapture: onUp }, reset, R };
}

export function GJoy({ view, knobRef, color = 'blue', idle, R = 52, alpha = 1, flat = false }) {
  const c = GC[color] || GC.blue;
  const S = useSkin();
  const ring = S.joyRing || 'rgba(255,255,255,0.5)';
  const sq = S.k === 'siege';
  const flatBase = (x, y, op) => (
    <div style={{ position: 'absolute', left: x - R - 10, top: y - R - 10, width: (R + 10) * 2, height: (R + 10) * 2, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.22) 100%)', boxShadow: `inset 0 0 0 1.5px ${ring}`, pointerEvents: 'none', opacity: op * alpha }}>
      {sq && [0, 90, 180, 270].map((a) => <span key={a} style={{ position: 'absolute', left: '50%', top: '50%', width: 10, height: 2, marginLeft: -5, marginTop: -1, background: ring, transform: `rotate(${a}deg) translateX(${R + 2}px)` }} />)}
      <div ref={op === 1 ? knobRef : null} style={{ position: 'absolute', left: R + 10 - Math.round(R * 0.42), top: R + 10 - Math.round(R * 0.42), width: Math.round(R * 0.84), height: Math.round(R * 0.84), borderRadius: sq ? '30%' : '50%', background: S.joyKnob || 'rgba(255,255,255,0.42)', boxShadow: `inset 0 0 0 1.5px ${S.joyRing ? ring : 'rgba(255,255,255,0.9)'}, 0 2px 6px rgba(0,0,0,0.25)` }} />
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

export function GWatchBar({ ids, cur, nameOf, colorOf, onPick, style }) {
  injectKitCss();
  const list = (ids || []).filter(Boolean);
  if (!list.length) return null;
  const i = Math.max(0, list.indexOf(cur));
  const k = list[i];
  const go = (d) => { kitTap('click'); onPick(list[(i + d + list.length) % list.length]); };
  const dot = (id, size) => <span style={{ width: size, height: size, borderRadius: size / 2, flexShrink: 0, background: colorOf ? colorOf(id) : '#FFFFFF', boxShadow: '0 0 0 1.5px rgba(255,255,255,0.85)' }} />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, fontFamily: FONT, color: '#FFFFFF', ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {list.length > 1 && <GBtn icon="chevl" color="dark" size={40} fast={false} label="Watch the player before" onPress={() => go(-1)} />}
        <div aria-live="polite" style={{ height: 40, minWidth: 168, maxWidth: 260, padding: '0 14px', boxSizing: 'border-box', borderRadius: 20, background: 'rgba(10,14,26,0.78)', boxShadow: `0 0 0 2px ${INK}, inset 0 0 0 1.5px rgba(255,255,255,0.16)`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <GIcon k="eye" size={15} color="#CFE6FF" ink="transparent" />
          <span style={{ fontSize: 11.5, fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>Watching</span>
          {dot(k, 10)}
          <span style={{ fontSize: 14.5, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nameOf(k)}</span>
        </div>
        {list.length > 1 && <GBtn icon="chevr" color="dark" size={40} fast={false} label="Watch the next player" onPress={() => go(1)} />}
      </div>
      {list.length > 2 && !(typeof window !== 'undefined' && window.innerHeight < 430) && (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 'min(560px, 100%)' }}>
          {list.map((id) => (
            <button key={id} type="button" className="zgk-btn" aria-pressed={id === k} aria-label={`Watch ${nameOf(id)}`} {...pressProps(() => { kitTap('click'); onPick(id); })}
              style={{ height: 28, padding: '0 10px 0 7px', border: 'none', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontFamily: FONT, fontSize: 11.5, fontWeight: 900, color: id === k ? INK : '#FFFFFF', background: id === k ? 'linear-gradient(180deg, #FFE27A, #F5B321)' : 'rgba(10,14,26,0.66)' }}>
              {dot(id, 8)}{nameOf(id)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function GTalkers({ ids, nameOf, top = 10 }) {
  injectKitCss();
  if (!ids || !ids.length) return null;
  return (
    <div style={{ position: 'absolute', left: '50%', top, transform: 'translateX(-50%)', zIndex: 8, pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      {ids.slice(0, 3).map((k) => (
        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 7, height: 28, padding: '0 11px 0 4px', borderRadius: 14, background: 'rgba(8,12,22,0.76)', boxShadow: '0 0 0 1.5px rgba(255,255,255,0.16), 0 4px 10px rgba(0,0,0,0.3)', color: '#FFFFFF', fontFamily: FONT, fontSize: 12.5, fontWeight: 800, whiteSpace: 'nowrap', animation: 'zgk-pop .18s ease-out' }}>
          <span style={{ width: 21, height: 21, borderRadius: 11, background: 'linear-gradient(180deg, #4BE38E, #1FA85B)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.2)' }}><GIcon k="mic" size={12} color="#FFFFFF" ink="rgba(0,0,0,0.25)" /></span>
          <span style={{ maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis' }}>{nameOf(k)}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 2, height: 12 }}>{[0, 1, 2].map((i) => <span key={i} style={{ width: 3, height: 12, borderRadius: 2, background: '#4BE38E', animation: `zgk-talk ${0.46 + i * 0.09}s ease-in-out ${i * 0.11}s infinite` }} />)}</span>
        </div>
      ))}
    </div>
  );
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
const ctlNow = {};
const ctlKey = (g) => (g ? `${CTL_KEY}-${g}` : CTL_KEY);
function ctlRead(g) {
  try {
    const v = JSON.parse(localStorage.getItem(ctlKey(g)) || 'null') || (g ? JSON.parse(localStorage.getItem(CTL_KEY) || 'null') : null);
    if (v && typeof v === 'object') return { size: Math.min(1.25, Math.max(0.6, Number(v.size) || 1)), see: Math.min(0.7, Math.max(0, Number(v.see) || 0)), side: v.side !== false };
  } catch {}
  return { size: 1, see: 0, side: true };
}
export function ctlLook(g = '') { if (!ctlNow[g]) ctlNow[g] = ctlRead(g); return ctlNow[g]; }
export function setCtlLook(patch, g = '') {
  ctlNow[g] = { ...ctlLook(g), ...patch };
  try { localStorage.setItem(ctlKey(g), JSON.stringify(ctlNow[g])); } catch {}
  ctlSubs.forEach((f) => { try { f(g, ctlNow[g]); } catch {} });
}
export function useCtlLook(g) {
  const S = useSkin();
  const key = g != null ? g : S.k;
  const [v, setV] = useState(() => ctlLook(key));
  useEffect(() => { setV(ctlLook(key)); const f = (k, n) => { if (k === key) setV(n); }; ctlSubs.add(f); return () => { ctlSubs.delete(f); }; }, [key]);
  return v;
}
const SIZES = [[0.7, 'Small'], [0.85, 'Medium'], [1, 'Normal'], [1.15, 'Big']];
const SEES = [[0, 'Solid'], [0.25, 'Light'], [0.45, 'Half'], [0.65, 'Clear']];
function GSteps({ label, value, opts, onPick }) {
  const near = opts.reduce((a, b) => (Math.abs(b[0] - value) < Math.abs(a[0] - value) ? b : a))[0];
  return (
    <div style={{ width: '100%' }}>
      {label && <div style={{ fontSize: 13.5, fontWeight: 800, color: 'rgba(255,255,255,0.9)', marginBottom: 6 }}>{label}</div>}
      <GSeg label={label} value={near} items={opts.map(([v, t]) => [v, t])} height={32} onPick={(v) => { kitTap(); onPick(v); }} />
    </div>
  );
}
export function GSwitchRow({ label, sub, on, onToggle }) {
  return (
    <div role="switch" aria-checked={!!on} aria-label={label} tabIndex={0} {...pressProps(() => { onToggle(); kitTap(); })} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', cursor: 'pointer', fontSize: 14.5, fontWeight: 900 }}>
      <span style={{ flex: 1 }}>{label}{sub && <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.65)' }}>{sub}</span>}</span>
      <span aria-hidden="true" style={{ width: 46, height: 28, borderRadius: 14, background: on ? '#F7C53A' : 'rgba(255,255,255,0.18)', position: 'relative', flexShrink: 0 }}>
        <span style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 22, height: 22, borderRadius: 11, background: '#FFFFFF', transition: 'left .15s' }} />
      </span>
    </div>
  );
}
export function GVolBars({ name, vol = 1, muted, onVol }) {
  const steps = [0.25, 0.5, 0.75, 1];
  const v = muted ? 0 : vol;
  return (
    <div role="group" aria-label={`Voice volume for ${name}`} style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 30, flexShrink: 0 }}>
      {steps.map((s) => (
        <button key={s} type="button" className="zgk-btn" aria-label={`${name} at ${Math.round(s * 100)} percent`} aria-pressed={!muted && Math.abs(vol - s) < 0.01} onClick={(e) => { e.stopPropagation(); kitTap(); onVol(s); }}
          style={{ width: 11, height: 9 + s * 20, borderRadius: 4, border: 'none', padding: 0, cursor: 'pointer', background: v >= s - 0.01 ? '#7BE05A' : 'rgba(255,255,255,0.22)' }} />
      ))}
    </div>
  );
}
export function GVoiceRow({ name, avatar, muted, vol = 1, onMute, onVol, me }) {
  const steps = [0.25, 0.5, 0.75, 1];
  const v = muted ? 0 : vol;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
      {avatar}
      <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
      {!me && (
        <>
          <GBtn icon={muted ? 'mute' : 'sound'} color={muted ? 'red' : 'dark'} size={34} fast={false} label={muted ? `Unmute ${name}` : `Mute ${name}`} onPress={onMute} />
          {onVol && (
            <div role="group" aria-label={`Voice volume for ${name}`} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              {steps.map((s) => (
                <button key={s} type="button" className="zgk-btn" aria-label={`Volume ${Math.round(s * 100)} percent`} aria-pressed={!muted && Math.abs(vol - s) < 0.01} onClick={(e) => { e.stopPropagation(); kitTap(); onVol(s); }}
                  style={{ width: 12, height: 10 + s * 18, borderRadius: 4, border: 'none', padding: 0, cursor: 'pointer', background: v >= s - 0.01 ? '#7BE05A' : 'rgba(255,255,255,0.22)' }} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function GSetRow({ label, sub, children, stack }) {
  return (
    <div style={{ display: 'flex', flexDirection: stack ? 'column' : 'row', alignItems: stack ? 'stretch' : 'center', gap: stack ? 8 : 14, padding: '11px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
      <div style={{ flex: stack ? 'none' : '1 1 40%', minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF' }}>{label}</div>
        {sub && <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginTop: 2, lineHeight: 1.35 }}>{sub}</div>}
      </div>
      <div style={{ flex: stack ? 'none' : '1 1 62%', minWidth: 0, maxWidth: stack ? 'none' : 400, marginLeft: 'auto', textAlign: 'right' }}>{children}</div>
    </div>
  );
}

export function GSetToggle({ on, onToggle, label }) {
  return (
    <button type="button" role="switch" aria-checked={!!on} aria-label={label} className="zgk-btn" {...pressProps(() => { kitTap(); onToggle(!on); })}
      style={{ display: 'inline-block', verticalAlign: 'middle', width: 50, height: 30, borderRadius: 15, border: 'none', padding: 0, cursor: 'pointer', position: 'relative', background: on ? '#FFC23D' : 'rgba(255,255,255,0.18)', transition: 'background .15s ease', flexShrink: 0 }}>
      <span aria-hidden="true" style={{ position: 'absolute', top: 3, left: on ? 23 : 3, width: 24, height: 24, borderRadius: 12, background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.35)', transition: 'left .15s ease' }} />
    </button>
  );
}

export function GSetSlider({ value, min = 0, max = 1, step = 0.05, onChange, label, fmt }) {
  injectKitCss();
  const f = (value - min) / (max - min || 1);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
      <input type="range" className="zgk-range" aria-label={label} min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))}
        onPointerDown={(e) => e.stopPropagation()}
        style={{ flex: 1, minWidth: 0, background: `linear-gradient(90deg, #FFC23D 0%, #FFC23D ${f * 100}%, rgba(255,255,255,0.18) ${f * 100}%, rgba(255,255,255,0.18) 100%)` }} />
      <span style={{ width: 42, textAlign: 'right', fontSize: 13, fontWeight: 800, color: '#FFFFFF', fontVariantNumeric: 'tabular-nums' }}>{fmt ? fmt(value) : `${Math.round(f * 100)}%`}</span>
    </div>
  );
}

function ctlTab(g, v, sideways, pv) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 16, height: 92, padding: '6px 0 10px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ opacity: 1 - v.see, transform: `scale(${v.size})`, transformOrigin: 'bottom center', transition: 'transform .15s ease, opacity .15s ease' }}><GHudSkill icon={pv[0]} main size={66} label="Sample button" onPress={() => {}} /></div>
        <div style={{ opacity: 1 - v.see, transform: `scale(${v.size})`, transformOrigin: 'bottom center', transition: 'transform .15s ease, opacity .15s ease' }}><GHudSkill icon={pv[1]} size={50} label="Sample button" cool={3} coolMax={6} onPress={() => {}} /></div>
      </div>
      <GSetRow label="Button size"><GSteps value={v.size} opts={SIZES} onPick={(x) => setCtlLook({ size: x }, g)} /></GSetRow>
      <GSetRow label="See through" sub="How clear the buttons are"><GSteps value={v.see} opts={SEES} onPick={(x) => setCtlLook({ see: x }, g)} /></GSetRow>
      {sideways && <GSetRow label="Play sideways" sub="Turns the game without your phone setting"><GSetToggle on={v.side} label="Play sideways" onToggle={(n) => setCtlLook({ side: n }, g)} /></GSetRow>}
      <div style={{ paddingTop: 12 }}><GPill text="Reset buttons" color="white" small onPress={() => setCtlLook({ size: 1, see: 0 }, g)} /></div>
    </>
  );
}

function AudioTab({ extra }) {
  const [snd, setSnd] = useState(() => !!Sfx.sfxOn);
  const [mus, setMus] = useState(() => !!Sfx.musicOn);
  const [sv, setSv] = useState(() => Sfx.sfxVol == null ? 1 : Sfx.sfxVol);
  const [mv, setMv] = useState(() => Sfx.musicVol == null ? 1 : Sfx.musicVol);
  return (
    <>
      <GSetRow label="Sound effects"><GSetToggle on={snd} label="Sound effects" onToggle={(n) => { setSnd(n); Sfx.init(); Sfx.setSfx(n); }} /></GSetRow>
      <GSetRow label="Effects volume"><GSetSlider value={sv} label="Effects volume" onChange={(x) => { setSv(x); Sfx.init(); if (Sfx.setSfxVol) Sfx.setSfxVol(x); }} /></GSetRow>
      <GSetRow label="Music"><GSetToggle on={mus} label="Music" onToggle={(n) => { setMus(n); Sfx.init(); Sfx.setMusic(n); }} /></GSetRow>
      <GSetRow label="Music volume"><GSetSlider value={mv} label="Music volume" onChange={(x) => { setMv(x); Sfx.init(); if (Sfx.setMusicVol) Sfx.setMusicVol(x); }} /></GSetRow>
      {extra}
    </>
  );
}

const SET_ICON = { graphics: 'eye', gameplay: 'play', controls: 'hand', hud: 'target', audio: 'sound', credits: 'heart' };

export function GSettings({ onClose, sideways = true, tabs = [], audioExtra = null, controlsExtra = null, first, preview }) {
  injectKitCss();
  const g = useSkin().k;
  const v = useCtlLook(g);
  const all = [...tabs, { k: 'controls', label: 'Controls', body: <>{controlsExtra}{ctlTab(g, v, sideways, preview || ['dash', 'suck'])}</> }, { k: 'audio', label: 'Audio', body: <AudioTab extra={audioExtra} /> }, { k: 'credits', label: 'Credits', body: <CreditsTab /> }];
  const [cur, setCur] = useState(first || all[0].k);
  const tab = all.find((t) => t.k === cur) || all[0];
  return (
    <div role="dialog" aria-label="Settings" onPointerDown={(e) => e.stopPropagation()}
      style={{ width: 'min(780px, 100%)', height: 'min(560px, 100%)', display: 'flex', flexDirection: 'column', borderRadius: 14, overflow: 'hidden', background: 'rgba(14,17,22,0.97)', boxShadow: '0 18px 50px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.08)', color: '#FFFFFF', fontFamily: FONT, animation: 'zgk-pop 0.2s ease-out', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px 10px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <span style={{ flex: 1, fontSize: 18, fontWeight: 900 }}>Settings</span>
        <GHudBtn icon="close" size={36} label="Close settings" onPress={onClose} />
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <div role="tablist" aria-label="Settings sections" style={{ width: 'clamp(104px, 22%, 160px)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 6px', borderRight: '1px solid rgba(255,255,255,0.08)', overflowY: 'auto' }}>
          {all.map((t) => {
            const on = t.k === tab.k;
            return (
              <button key={t.k} type="button" role="tab" aria-selected={on} className="zgk-btn" {...pressProps(() => { kitTap(); setCur(t.k); })}
                style={{ display: 'flex', alignItems: 'center', gap: 9, minHeight: 42, padding: '0 10px', border: 'none', borderRadius: 9, cursor: 'pointer', fontFamily: FONT, fontSize: 13.5, fontWeight: 800, textAlign: 'left', color: on ? '#FFFFFF' : 'rgba(255,255,255,0.6)', background: on ? 'rgba(255,255,255,0.09)' : 'transparent', boxShadow: on ? 'inset 3px 0 0 #FFC23D' : 'none' }}>
                <GIcon k={t.icon || SET_ICON[t.k] || 'gear'} size={17} color={on ? '#FFC23D' : 'rgba(255,255,255,0.6)'} line halo={false} stroke={2.2} />
                <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.label}</span>
              </button>
            );
          })}
        </div>
        <div role="tabpanel" aria-label={tab.label} style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '6px 18px 16px', touchAction: 'pan-y' }}>
          <div style={{ fontSize: 15, fontWeight: 900, padding: '8px 0 4px', color: 'rgba(255,255,255,0.92)' }}>{tab.label}</div>
          {tab.body}
        </div>
      </div>
    </div>
  );
}

export function GControlsPanel({ onClose, sideways, tabs, first }) {
  return <GSettings onClose={onClose} sideways={sideways} tabs={tabs || []} first={first} />;
}

export function useFitScale(ref, W, H, cap = 1) {
  const [k, setK] = useState(cap);
  const key = useRef('');
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !W || !H) return;
    const sz = `${Math.round(W)}x${Math.round(H)}x${cap}`;
    if (key.current !== sz) { key.current = sz; if (k !== cap) { setK(cap); return; } }
    const sp = el.querySelector('[data-zfill]');
    const natural = Math.max(el.scrollHeight, el.clientHeight) - (sp ? sp.offsetHeight : 0);
    if (natural <= 0) return;
    const want = Math.max(0.6, Math.min(cap, H / natural));
    if (want < k - 0.005 || (want > k + 0.04 && natural * k < H - 20)) setK(Math.round(want * 1000) / 1000);
  });
  return k;
}

export function GLobby({ GS, title, sub, onClose, closeLabel = 'Leave', tools, badge, side, main, children, tint = 'rgba(6,8,18,0.6)' }) {
  injectKitCss();
  const fitRef = useRef(null);
  const land = GS.land;
  const cap = Math.round(Math.min(1, GS.W / (land ? 680 : 360)) * 1000) / 1000;
  const k = useFitScale(fitRef, GS.W, GS.H, cap);
  const { top, right, bottom, left } = GS.at;
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 5, overflow: 'hidden', fontFamily: FONT, color: '#FFFFFF' }}>
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: land ? `linear-gradient(180deg, ${tint} 0%, rgba(6,8,18,0) 30%, rgba(6,8,18,0) 46%, ${tint} 100%)` : `linear-gradient(180deg, ${tint} 0%, rgba(6,8,18,0) 20%, rgba(6,8,18,0) 38%, ${tint} 72%)` }} />
      <div ref={fitRef} style={{ position: 'absolute', left: 0, top: 0, width: GS.W / k, height: GS.H / k, transform: k === 1 ? 'none' : `scale(${k})`, transformOrigin: '0 0', boxSizing: 'border-box', padding: `${top(10)} ${right(14)} ${bottom(12)} ${left(14)}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {land ? (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexShrink: 0 }}>
            <GBtn icon="close" color="white" size={42} fast={false} label={closeLabel} onPress={onClose} />
            <div style={{ flex: 1, minWidth: 0, paddingTop: 1, animation: 'zgk-in 0.35s ease-out' }}>
              <GTitle text={title} size={34} color="#FFE15A" />
              {sub && <div style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.9)', marginTop: 2, textShadow: '0 1px 4px rgba(0,0,0,0.55)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>}
            </div>
            {(badge || tools) && <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>{badge}{tools}</div>}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <GBtn icon="close" color="white" size={42} fast={false} label={closeLabel} onPress={onClose} />
              <div style={{ flex: 1 }} />
              {tools}
            </div>
            <div style={{ animation: 'zgk-in 0.35s ease-out', paddingLeft: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
              <div>
                <GTitle text={title} size={40} color="#FFE15A" />
                {sub && <div style={{ fontSize: 13.5, fontWeight: 800, color: 'rgba(255,255,255,0.9)', marginTop: 3, textShadow: '0 1px 4px rgba(0,0,0,0.55)', lineHeight: 1.35 }}>{sub}</div>}
              </div>
              {badge}
            </div>
          </div>
        )}
        <div data-zfill="1" style={{ flex: '1 1 auto', minHeight: land ? 8 : 24 }} />
        {land ? (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, flexShrink: 0 }}>
            <div style={{ flex: '0 1 400px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10, animation: 'zgk-in 0.4s ease-out' }}>{side}</div>
            <div style={{ flex: '1 1 0', minWidth: 0 }} />
            <div style={{ flex: '0 1 330px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10, animation: 'zgk-in 0.45s ease-out' }}>{main}</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0, width: '100%', maxWidth: 460, margin: '0 auto', animation: 'zgk-in 0.4s ease-out' }}>{side}{main}</div>
        )}
      </div>
      {children}
    </div>
  );
}

export function GSlot({ art, name, ring = 'rgba(255,255,255,0.3)', talk, muted, empty, onPress, label, size = 46 }) {
  const box = (
    <>
      <span style={{ position: 'relative', width: size, height: size, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', background: empty ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.1)', border: empty ? '2px dashed rgba(255,255,255,0.3)' : 'none', boxShadow: empty ? 'none' : `0 0 0 2.5px ${talk && !muted ? '#7BE05A' : ring}` }}>
        {empty ? (onPress ? <GIcon k="plus" size={Math.round(size * 0.42)} color="rgba(255,255,255,0.75)" line halo={false} stroke={2.4} /> : null) : art}
        {!empty && (talk || muted) && (
          <span style={{ position: 'absolute', right: -4, bottom: -4, width: 19, height: 19, borderRadius: 10, background: muted ? '#C93C3C' : '#2E9E44', boxShadow: `0 0 0 2px ${INK}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GIcon k={muted ? 'mute' : 'mic'} size={11} color="#FFFFFF" line halo={false} stroke={2.4} />
          </span>
        )}
      </span>
      <span style={{ fontSize: 11.5, fontWeight: 800, maxWidth: size + 18, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: empty ? 'rgba(255,255,255,0.55)' : '#FFFFFF', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>{name}</span>
    </>
  );
  const st = { width: size + 18, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: 0, border: 'none', background: 'transparent', color: '#FFFFFF', fontFamily: FONT, flexShrink: 0 };
  if (!onPress) return <div style={st} aria-label={label}>{box}</div>;
  return <button type="button" className="zgk-btn" aria-label={label} {...pressProps(() => { kitTap(); onPress(); })} style={{ ...st, cursor: 'pointer' }}>{box}</button>;
}

export function GLobbySheet({ title, onClose, children, width = 560, GS }) {
  const at = GS ? GS.at : null;
  return (
    <div onPointerDown={(e) => { if (e.target === e.currentTarget) { e.stopPropagation(); onClose(); } }} style={{ position: 'absolute', inset: 0, zIndex: 40, background: 'rgba(4,6,14,0.58)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', padding: at ? `${at.top(10)} ${at.right(12)} ${at.bottom(10)} ${at.left(12)}` : 12, fontFamily: FONT, color: '#FFFFFF' }}>
      <GPanel style={{ width: '100%', maxWidth: width, maxHeight: '100%', display: 'flex', flexDirection: 'column', padding: '12px 14px 14px', boxSizing: 'border-box', animation: 'zgk-pop 0.25s ease-out' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexShrink: 0 }} onPointerDown={(e) => e.stopPropagation()}>
          <div style={{ flex: 1, minWidth: 0 }}><GTitle text={title} size={24} /></div>
          <button type="button" aria-label="Close" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); kitTap(); onClose(); }}
            style={{ width: 48, height: 48, margin: -6, padding: 6, border: 'none', background: 'transparent', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation' }}>
            <span style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(239,232,210,0.12)', boxShadow: 'inset 0 0 0 1.5px rgba(239,232,210,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" stroke="#EFE8D2" strokeWidth="2.2" strokeLinecap="round" /></svg>
            </span>
          </button>
        </div>
        <div style={{ minHeight: 0, overflowY: 'auto', touchAction: 'pan-y' }}>{children}</div>
      </GPanel>
    </div>
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
  return Math.min(low === 2 ? 1 : low ? 1.25 : 2, d);
}
export const weakPhone = () => { try { return (navigator.hardwareConcurrency || 4) <= 4 || (navigator.deviceMemory || 4) <= 3; } catch { return false; } };
export function newBudget() { return { avg: 16, n: 0, lv: weakPhone() ? 1 : 0 }; }
export function budgetTick(B, dt) {
  if (!(dt > 0)) return maxDpr(B.lv);
  B.avg = B.avg * 0.95 + Math.min(80, dt * 1000) * 0.05;
  B.n += 1;
  if (B.n > 90 && B.avg > 22 && B.lv < 2) { B.lv += 1; B.n = 0; B.avg = 17; }
  else if (B.n > 600 && B.avg < 12.5 && B.lv > 0 && !weakPhone()) { B.lv -= 1; B.n = 0; }
  return maxDpr(B.lv);
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
const fsEl = () => (typeof document !== 'undefined' ? document.fullscreenElement || document.webkitFullscreenElement || null : null);
const isAndroid = () => typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent || '');
function iosGap() {
  try {
    if (typeof navigator === 'undefined' || navigator.standalone !== true) return 0;
    const p = document.createElement('div');
    p.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;visibility:hidden;pointer-events:none;padding-top:env(safe-area-inset-top)';
    document.body.appendChild(p);
    const st = parseFloat(window.getComputedStyle(p).paddingTop) || 0;
    p.remove();
    const tall = window.innerHeight > window.innerWidth;
    const sw = window.screen.width, sh = window.screen.height;
    const full = tall ? Math.max(sw, sh) : Math.min(sw, sh);
    const miss = full - window.innerHeight;
    return st > 0 && miss > 4 && miss <= st + 2 ? Math.round(miss) : 0;
  } catch { return 0; }
}
export function useGameStage(look) {
  const rootRef = useRef(null);
  const box = useStageBox(rootRef);
  const want = !!(look && look.side) && TOUCHY;
  const [fsOn, setFsOn] = useState(() => !!fsEl());
  useEffect(() => {
    if (!want || !lockable()) return undefined;
    const so = window.screen.orientation;
    let tried = false;
    try { const r = so.lock('landscape'); tried = true; if (r && r.catch) r.catch(() => {}); } catch {}
    return () => { if (tried) { try { so.unlock(); } catch {} } };
  }, [want, fsOn]);
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof document === 'undefined') return undefined;
    const de = document.documentElement;
    const can = TOUCHY && isAndroid() && !!(de.requestFullscreen || de.webkitRequestFullscreen);
    let mine = false, tried = false;
    const onFs = () => { const on = !!fsEl(); setFsOn(on); if (!on) tried = false; };
    const onVis = () => { if (document.visibilityState === 'visible' && !fsEl()) tried = false; };
    document.addEventListener('fullscreenchange', onFs);
    document.addEventListener('webkitfullscreenchange', onFs);
    document.addEventListener('visibilitychange', onVis);
    const go = () => {
      if (tried || !can || fsEl()) return;
      tried = true;
      try {
        const r = de.requestFullscreen ? de.requestFullscreen({ navigationUI: 'hide' }) : de.webkitRequestFullscreen();
        mine = true;
        if (r && r.catch) r.catch(() => { mine = false; });
      } catch { mine = false; }
    };
    if (can) el.addEventListener('pointerup', go, true);
    const fix = () => { const g = iosGap(); el.style.setProperty('--zgx', `${g}px`); };
    fix();
    window.addEventListener('resize', fix);
    window.addEventListener('orientationchange', fix);
    return () => {
      el.removeEventListener('pointerup', go, true);
      document.removeEventListener('fullscreenchange', onFs);
      document.removeEventListener('webkitfullscreenchange', onFs);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('resize', fix);
      window.removeEventListener('orientationchange', fix);
      if (mine && fsEl()) { try { const r = document.exitFullscreen ? document.exitFullscreen() : document.webkitExitFullscreen(); if (r && r.catch) r.catch(() => {}); } catch {} }
    };
  }, []);
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
  const [down, setDown] = useState(false);
  const ic = Math.round(size * 0.52);
  return (
    <button type="button" className="zgk-btn" aria-label={label} aria-pressed={on || undefined} {...pressProps(() => { kitTap('click'); if (onPress) onPress(); })}
      onPointerUp={() => setDown(false)} onPointerCancel={() => setDown(false)} onPointerLeave={() => setDown(false)} onPointerDownCapture={() => setDown(true)}
      style={{ position: 'relative', width: size, height: size, borderRadius: '50%', border: 'none', padding: 0, flexShrink: 0, cursor: 'pointer', background: down ? 'rgba(255,255,255,0.3)' : on ? hexA(tone, 0.36) : 'rgba(14,17,22,0.44)', boxShadow: `inset 0 0 0 1.6px ${on ? hexA(tone, 0.98) : 'rgba(255,255,255,0.62)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: down ? 'scale(0.93)' : undefined, transition: 'transform 0.06s ease-out, background 0.08s' }}>
      <span style={{ position: 'relative', display: 'flex', filter: 'drop-shadow(0 1px 1.5px rgba(0,0,0,0.55))' }}>{children || <GIcon k={icon} size={ic} color="#FFFFFF" line halo={false} stroke={2.2} />}</span>
      {badge != null && <span aria-hidden="true" style={{ position: 'absolute', right: -4, top: -4, minWidth: 17, height: 17, padding: '0 4px', borderRadius: 9, background: '#E5484D', color: '#FFFFFF', fontFamily: FONT, fontWeight: 900, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', boxShadow: '0 0 0 1.5px rgba(14,17,22,0.85)' }}>{badge}</span>}
    </button>
  );
}

export function GHudPanel({ children, style }) {
  const S = useSkin();
  return <div style={{ borderRadius: S.pr, background: S.panel, boxShadow: S.pEdge !== 'none' ? S.pEdge : undefined, color: '#FFFFFF', fontFamily: FONT, textShadow: '0 1px 2px rgba(0,0,0,0.55)', ...style }}>{children}</div>;
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
export function useChatFeed() {
  const [items, setItems] = useState([]);
  const timers = useRef(new Set());
  useEffect(() => () => { timers.current.forEach((t) => clearTimeout(t)); timers.current.clear(); }, []);
  const push = useCallback((who, text, col) => {
    const t0 = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 90);
    if (!t0) return;
    const L = Math.min(11, 6.5 + t0.length * 0.05);
    const it = { id: `${Date.now()}${Math.random()}`, who: String(who || 'Friend').slice(0, 24), text: t0, col, life: L };
    setItems((v) => [...v.slice(-3), it]);
    const t = setTimeout(() => { timers.current.delete(t); setItems((v) => v.filter((x) => x !== it)); }, L * 1000 + 80);
    timers.current.add(t);
  }, []);
  useEffect(() => { if (typeof window !== 'undefined' && window.__zfake) window.__zfeedTest = push; }, [push]);
  return [items, push];
}
export function GChatFeed({ items, style, align = 'left' }) {
  injectKitCss();
  const S = useSkin();
  if (!items || !items.length) return null;
  const right = align === 'right';
  return (
    <div aria-live="polite" style={{ display: 'flex', flexDirection: 'column', alignItems: right ? 'flex-end' : 'flex-start', gap: 4, pointerEvents: 'none', fontFamily: FONT, ...style }}>
      {items.map((it) => (
        <div key={it.id} style={{ maxWidth: '100%', boxSizing: 'border-box', padding: '4px 10px 5px', borderRadius: Math.min(S.nr, 12), background: S.feed, boxShadow: S.k === 'siege' ? 'inset 2px 0 0 #F2B21B' : S.k === 'rally' ? 'inset 3px 0 0 #FFC93C' : S.k === 'zombie' ? 'inset 2px 0 0 #F28C28' : S.k === 'duo' ? 'inset 0 0 0 1px rgba(217,165,72,0.4)' : 'none', color: '#FFFFFF', fontSize: 12.5, fontWeight: 700, lineHeight: 1.32, textShadow: '0 1px 2px rgba(0,0,0,0.6)', overflowWrap: 'anywhere', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', animation: `zgk-chat ${it.life}s ease-out forwards` }}>
          <span style={{ fontWeight: 900, color: it.col || S.name }}>{it.who}</span> <span>{it.text}</span>
        </div>
      ))}
    </div>
  );
}
export function GJoinAsks({ asks, onAnswer, style }) {
  injectKitCss();
  if (!asks || !asks.length) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, pointerEvents: 'auto', ...style }}>
      {asks.map((a) => (
        <GPanel key={a.by} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 8px 7px 12px', animation: 'zgk-pop 0.25s ease-out' }}>
          <span style={{ flex: 1, minWidth: 0, fontFamily: FONT, fontSize: 13.5, fontWeight: 800, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{`${a.n} wants to join`}</span>
          <GPill text="Not now" color="white" small onPress={() => onAnswer(a.by, false)} />
          <GPill text="Let in" color="green" small onPress={() => onAnswer(a.by, true)} />
        </GPanel>
      ))}
    </div>
  );
}
export function GNotices({ items, style }) {
  injectKitCss();
  const S = useSkin();
  if (!items || !items.length) return null;
  return (
    <div aria-live="polite" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, pointerEvents: 'none', fontFamily: FONT, ...style }}>
      {items.map((it) => {
        const K = NOTE_KIND[it.kind] || NOTE_KIND.info;
        return (
          <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 8, maxWidth: '100%', height: 34, padding: '0 14px 0 5px', borderRadius: S.nr, background: S.note, boxShadow: '0 4px 16px rgba(0,0,0,0.32), inset 0 0 0 1px rgba(255,255,255,0.08)', color: '#FFFFFF', fontSize: 13.5, fontWeight: 800, whiteSpace: 'nowrap', boxSizing: 'border-box', animation: `zgk-note ${it.life}s ease-out forwards` }}>
            <span style={{ width: 24, height: 24, borderRadius: S.nr >= 12 ? 12 : S.nr, background: K.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><GIcon k={K.icon} size={14} color="#FFFFFF" line halo={false} stroke={2.3} /></span>
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

export function GSkillArt({ k, size = 28 }) {
  return <GGlyph k={SKILL_GI[k] || k} size={size} style={{ filter: 'drop-shadow(0 1px 1.5px rgba(0,0,0,0.45))' }} />;
}

const SKILL_GI = { dash: 'dash', suck: 'vortex', shield: 'shield', shock: 'lightning', frenzy: 'jaws', flame: 'fireball', snow: 'snowflake', hand: 'hand', swap: 'cycle', bolt: 'electric', rocket: 'rocket', bomb: 'bomb', heart: 'revive', hammer: 'hammer', bubble: 'shield', people: 'ghost' };
const SKILL_ACC = { dash: '#5BC8FF', suck: '#B98CFF', shield: '#7FE6FF', shock: '#FFD54A', frenzy: '#FF7A55' };

export function GHudSkill({ icon, art, label, onPress, size = 52, cool = 0, coolMax = 0, main = false, sound = 'pop', tone, badge, disabled }) {
  const gi = SKILL_GI[art] || SKILL_GI[icon] || icon;
  const acc = SKILL_ACC[art] || tone || '#FFC23D';
  return <GSkill icon={gi} label={label} size={size} main={main} cool={cool} coolMax={coolMax} accent={acc} badge={badge} disabled={disabled} tap={() => kitTap(sound)} onPress={() => { if (onPress) onPress(); }} />;
}
