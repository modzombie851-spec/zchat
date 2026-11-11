import React, { useId, useMemo, useState } from 'react';
import { FONT } from '../App.jsx';
import { buildTrack } from './racetrack.js';
import { MAPS, MAP_KEYS, bottleSpots } from './racemaps.js';
import { fmtRace, LAPS } from './raceengine.js';
import { GBtn, GPill, kitTap } from './gamekit.jsx';

const OUT = '#14171F';

export function SkillIcon({ k, size = 34 }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const g = (n) => `${id}${n}`;
  if (k === 'rocket') {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id={g('b')} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#FFFFFF" /><stop offset="0.55" stopColor="#E6EBF2" /><stop offset="1" stopColor="#A9B4C4" /></linearGradient>
          <linearGradient id={g('f')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFF4A8" /><stop offset="0.45" stopColor="#FFB020" /><stop offset="1" stopColor="#F0441C" stopOpacity="0" /></linearGradient>
        </defs>
        <g transform="rotate(45 32 32)">
          <path d="M24.5 44 C24 52 32 63 32 63 C32 63 40 52 39.5 44 Z" fill={`url(#${g('f')})`} />
          <path d="M28.5 44 C28.5 49.5 32 55 32 55 C32 55 35.5 49.5 35.5 44 Z" fill="#FFFBE6" />
          <path d="M24.2 31 L15.5 43 L15.5 47.5 L25 44.2 Z" fill="#E5342B" stroke={OUT} strokeWidth="2" strokeLinejoin="round" />
          <path d="M39.8 31 L48.5 43 L48.5 47.5 L39 44.2 Z" fill="#C42620" stroke={OUT} strokeWidth="2" strokeLinejoin="round" />
          <path d="M32 4.5 C40.5 11 42.6 23.5 41.3 35.5 L40.2 45 L23.8 45 L22.7 35.5 C21.4 23.5 23.5 11 32 4.5 Z" fill={`url(#${g('b')})`} stroke={OUT} strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M32 4.5 C36.8 8.2 39.1 13 40 17.5 L24 17.5 C24.9 13 27.2 8.2 32 4.5 Z" fill="#EF3B30" stroke={OUT} strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M26.4 17.5 C27 13.2 28.8 9.8 31.4 7.4" stroke="#FFB4AE" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <circle cx="32" cy="27.5" r="5" fill="#2FB4F4" stroke={OUT} strokeWidth="2.2" />
          <circle cx="30.4" cy="25.9" r="1.6" fill="#DFF6FF" />
          <path d="M23.8 45 L40.2 45 L39.6 40 L24.4 40 Z" fill="#8792A3" stroke={OUT} strokeWidth="2" strokeLinejoin="round" />
          <path d="M32 37 L32 49" stroke={OUT} strokeWidth="4.4" strokeLinecap="round" />
          <path d="M32 37.5 L32 48.5" stroke="#E5342B" strokeWidth="2" strokeLinecap="round" />
        </g>
      </svg>
    );
  }
  if (k === 'shield') {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id={g('s')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7CE8FF" /><stop offset="0.5" stopColor="#2A8CFF" /><stop offset="1" stopColor="#1546B8" /></linearGradient>
          <linearGradient id={g('r')} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#9FB3CC" /></linearGradient>
        </defs>
        <path d="M32 3.5 L54.5 11.5 C54.5 32 47.5 49 32 60.5 C16.5 49 9.5 32 9.5 11.5 Z" fill={`url(#${g('r')})`} stroke={OUT} strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M32 9.5 L49 15.6 C48.6 32.4 42.8 45.5 32 54.2 C21.2 45.5 15.4 32.4 15 15.6 Z" fill={`url(#${g('s')})`} />
        <path d="M32 9.5 L49 15.6 C48.6 32.4 42.8 45.5 32 54.2 Z" fill="#0B2E7A" opacity="0.28" />
        <path d="M32 18 L35.6 25.6 L43.8 26.5 L37.7 32.1 L39.4 40.3 L32 36.1 L24.6 40.3 L26.3 32.1 L20.2 26.5 L28.4 25.6 Z" fill="#FFFFFF" stroke="#0E3B91" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M19 17.6 C19.6 25 21.4 31 24 36" stroke="#C8F4FF" strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="0.85" />
      </svg>
    );
  }
  if (k === 'oil') {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <radialGradient id={g('o')} cx="0.38" cy="0.3" r="0.8"><stop offset="0" stopColor="#7F5FD0" /><stop offset="0.45" stopColor="#35205C" /><stop offset="1" stopColor="#0D0716" /></radialGradient>
          <linearGradient id={g('p')} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#2A1B45" /><stop offset="0.5" stopColor="#4C3485" /><stop offset="1" stopColor="#1B1030" /></linearGradient>
        </defs>
        <ellipse cx="32" cy="52.5" rx="24" ry="7.5" fill={`url(#${g('p')})`} stroke={OUT} strokeWidth="2" />
        <path d="M17 51 C22 48.8 28 48.6 33 49.6" stroke="#B9A0FF" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
        <path d="M44.5 50.5 C47 50 49.5 50.6 51 51.6" stroke="#5EE7C8" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.55" />
        <path d="M32 4 C32 4 47.5 23.5 47.5 35.5 C47.5 44.1 40.6 50.5 32 50.5 C23.4 50.5 16.5 44.1 16.5 35.5 C16.5 23.5 32 4 32 4 Z" fill={`url(#${g('o')})`} stroke={OUT} strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M25.5 29.5 C23.2 33.6 23.2 39.4 26.6 43" stroke="#FFFFFF" strokeWidth="3.4" strokeLinecap="round" fill="none" opacity="0.8" />
        <circle cx="29.5" cy="22" r="2.2" fill="#FFFFFF" opacity="0.75" />
        <path d="M37 41 C39.8 40 41.4 37.6 41.6 35" stroke="#5EE7C8" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7" />
      </svg>
    );
  }
  if (k === 'shock') {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id={g('l')} x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stopColor="#FFF9B8" /><stop offset="0.45" stopColor="#FFD21F" /><stop offset="1" stopColor="#FF8A00" /></linearGradient>
        </defs>
        <path d="M51 7 l4.5 -4.5 M56 15.5 l6 -1 M8 45 l-5.2 3 M11.5 54.5 l-3.4 5.6 M50 52 l5 3.5" stroke="#FFE45C" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M38.5 3 L13 36.5 L29 36.5 L23.5 61 L51 24.5 L34.5 24.5 Z" fill={`url(#${g('l')})`} stroke="#3A2200" strokeWidth="2.6" strokeLinejoin="round" />
        <path d="M35.5 9 L19.5 31.8 L29.5 31.8" stroke="#FFFDEB" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.95" />
        <path d="M34.8 29.4 L44.6 29.4 L30.5 49.5" stroke="#C25E00" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
      </svg>
    );
  }
  return null;
}

export function NitroIcon({ size = 30, lit }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`${id}c`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#5FB8FF" /><stop offset="0.5" stopColor="#1F6FE5" /><stop offset="1" stopColor="#143E9A" /></linearGradient>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={lit ? '#FFFFFF' : '#FFF2A8'} /><stop offset="0.5" stopColor={lit ? '#7FE3FF' : '#FFA41C'} /><stop offset="1" stopColor={lit ? '#2E7BFF' : '#F0441C'} stopOpacity="0" /></linearGradient>
      </defs>
      <g transform="rotate(-35 32 32)">
        <path d="M24 46 C23.5 54 32 63 32 63 C32 63 40.5 54 40 46 Z" fill={`url(#${id}f)`} />
        <rect x="21" y="14" width="22" height="34" rx="9" fill={`url(#${id}c)`} stroke={OUT} strokeWidth="2.4" />
        <rect x="21" y="27" width="22" height="8" fill="#F4F6FA" stroke={OUT} strokeWidth="2" />
        <path d="M28.6 33.4 L28.6 28.6 L35.4 33.4 L35.4 28.6" stroke="#1F6FE5" strokeWidth="1.9" fill="none" strokeLinejoin="round" strokeLinecap="round" />
        <rect x="26" y="6" width="12" height="9" rx="2.5" fill="#C9D1DC" stroke={OUT} strokeWidth="2.2" />
        <rect x="29" y="2.5" width="6" height="5" rx="1.5" fill="#E5342B" stroke={OUT} strokeWidth="2" />
        <path d="M25 19 C25 17.5 26 16.4 27.5 16.2" stroke="#CFE9FF" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      </g>
    </svg>
  );
}

export function SteerArrow({ dir, on }) {
  return (
    <svg width="46" height="46" viewBox="0 0 46 46" aria-hidden="true" style={{ display: 'block', transform: dir === 'r' ? 'scaleX(-1)' : 'none' }}>
      <path d="M30 7 L12 23 L30 39" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" transform="translate(1 2)" />
      <path d="M30 7 L12 23 L30 39" fill="none" stroke={on ? '#1B1F27' : '#FFFFFF'} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PedalArt({ drift }) {
  return (
    <svg width="50" height="66" viewBox="0 0 50 66" aria-hidden="true" style={{ display: 'block' }}>
      <rect x="3" y="3" width="44" height="60" rx="11" fill="#2C313A" stroke="#9AA4B2" strokeWidth="2.4" />
      <rect x="8" y="8" width="34" height="50" rx="7" fill="#1A1D23" />
      {Array.from({ length: 6 }, (_, i) => <rect key={i} x="11" y={11.5 + i * 7.6} width="28" height="3.8" rx="1.9" fill={drift ? (i % 2 ? '#FFB547' : '#FFD27A') : (i % 2 ? '#5A626F' : '#737C8A')} />)}
    </svg>
  );
}

const SKILL_TONE = {
  rocket: ['#FF7A4D', '#B3261E'],
  shield: ['#5CCBFF', '#1E5BC6'],
  oil: ['#8E6BE0', '#2C1950'],
  shock: ['#FFD54A', '#C76A00'],
};
export function skillFace(k, ok) {
  const t = SKILL_TONE[k] || ['#5A6170', '#2A2F39'];
  return ok ? `radial-gradient(circle at 50% 28%, ${t[0]} 0%, ${t[1]} 78%)` : 'radial-gradient(circle at 50% 30%, #4A505C 0%, #23272F 80%)';
}

const statMem = new Map();
function mapStats(k) {
  if (statMem.has(k)) return statMem.get(k);
  let out = null;
  try {
    const T = buildTrack(MAPS[k]);
    let turns = 0, inTurn = false;
    for (const p of T.S) { const c = Math.abs(p.curv) > 0.012; if (c && !inTurn) turns++; inTurn = c; }
    out = { km: T.total / 1000, turns, jumps: (T.ramps || []).length, pads: (T.pads || []).length, bottles: bottleSpots(T).length };
  } catch {}
  statMem.set(k, out);
  return out;
}

function Stat({ label, value }) {
  return (
    <div style={{ padding: '6px 10px', borderRadius: 12, background: 'rgba(255,255,255,0.08)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)', minWidth: 0 }}>
      <div style={{ fontSize: 10.5, fontWeight: 800, color: 'rgba(255,255,255,0.62)', whiteSpace: 'nowrap' }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 900, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{value}</div>
    </div>
  );
}

export function MapSelect({ value, onPick, onClose, canPick, bestOf, land, pad, mode }) {
  const [cur, setCur] = useState(MAPS[value] ? value : MAP_KEYS[0]);
  const M = MAPS[cur];
  const st = useMemo(() => mapStats(cur), [cur]);
  const best = bestOf ? bestOf(cur) : 0;
  const tile = (k) => {
    const on = k === cur;
    const picked = k === value;
    return (
      <button key={k} type="button" className="zgk-btn" aria-pressed={on} aria-label={`Map ${MAPS[k].name}`} onClick={(e) => { e.stopPropagation(); kitTap(); setCur(k); }}
        style={{ position: 'relative', padding: 0, border: 'none', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', background: '#1A1F2B', boxShadow: on ? '0 0 0 3px #FFD23F, 0 8px 18px rgba(0,0,0,0.45)' : 'inset 0 0 0 1.5px rgba(255,255,255,0.16)', flexShrink: 0, width: land ? '100%' : 'calc(50% - 4px)', aspectRatio: land ? '2.3 / 1' : '16 / 9', fontFamily: FONT, transform: on ? 'scale(1)' : 'scale(0.97)', transition: 'transform 0.12s, box-shadow 0.12s' }}>
        <img src={`/race-map-${k}.webp`} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: on ? 'none' : 'saturate(0.8) brightness(0.8)' }} />
        <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.75) 100%)' }} />
        <span style={{ position: 'absolute', left: 10, bottom: 7, right: 10, textAlign: 'left', fontSize: 13.5, fontWeight: 900, color: '#FFFFFF', textShadow: '0 1px 4px rgba(0,0,0,0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{MAPS[k].name}</span>
        {picked && <span style={{ position: 'absolute', top: 6, right: 6, height: 20, padding: '0 8px', borderRadius: 10, background: '#FFD23F', color: '#2A1D05', fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center' }}>Selected</span>}
      </button>
    );
  };
  const choose = () => { if (canPick) { onPick(cur); } else onClose(); };
  return (
    <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', inset: 0, zIndex: 40, background: '#0B0E16', color: '#FFFFFF', fontFamily: FONT, overflow: 'hidden' }}>
      <img src={`/race-map-${cur}.webp`} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(14px) brightness(0.42)', transform: 'scale(1.12)' }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: pad, boxSizing: 'border-box', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <GBtn icon="left" color="white" size={38} fast={false} label="Back" onPress={onClose} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 19, fontWeight: 900, letterSpacing: '-0.01em' }}>Choose a map</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{mode === 'attack' ? 'Attack race' : 'Race'}, {LAPS} laps</div>
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: land ? 'row' : 'column', gap: 12, overflowY: land ? 'hidden' : 'auto', touchAction: 'pan-x pan-y' }}>
          <div style={{ flex: land ? '1 1 62%' : '0 0 auto', minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', boxShadow: '0 14px 34px rgba(0,0,0,0.5), 0 0 0 1.5px rgba(255,255,255,0.14)', flex: land ? '1 1 auto' : '0 0 auto', minHeight: 0, aspectRatio: land ? undefined : '16 / 9' }}>
              <img key={cur} src={`/race-map-${cur}.webp`} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', animation: 'zgk-pop 0.25s ease-out' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(4,6,12,0.85) 100%)' }} />
              <div style={{ position: 'absolute', left: 14, right: 14, bottom: 10 }}>
                <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.015em', textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}>{M.name}</div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,0.85)', lineHeight: 1.35, maxWidth: 420 }}>{M.blurb}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 6, flexShrink: 0 }}>
              <Stat label="Track" value={st ? `${st.km.toFixed(1)} km` : '...'} />
              <Stat label="Jumps" value={st ? String(st.jumps) : '...'} />
              <Stat label="Boost pads" value={st ? String(st.pads) : '...'} />
              <Stat label="Your best lap" value={best > 0 ? fmtRace(best) : 'None yet'} />
            </div>
          </div>
          <div style={{ flex: land ? '0 0 34%' : '0 0 auto', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
            <div style={{ flex: land ? 1 : '0 0 auto', minHeight: 0, overflowY: land ? 'auto' : 'visible', touchAction: 'pan-x pan-y', display: 'flex', flexDirection: land ? 'column' : 'row', flexWrap: land ? 'nowrap' : 'wrap', gap: 8, padding: 3 }}>
              {MAP_KEYS.map(tile)}
            </div>
            <div style={{ flexShrink: 0 }}>
              {canPick ? <GPill text={cur === value ? 'Keep this map' : 'Race here'} icon="flag" color="gold" wide onPress={choose} />
                : <div style={{ padding: '10px 12px', borderRadius: 14, background: 'rgba(255,255,255,0.08)', fontSize: 12.5, fontWeight: 800, textAlign: 'center', color: 'rgba(255,255,255,0.8)' }}>The host picks the map</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
