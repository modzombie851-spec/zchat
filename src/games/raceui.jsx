import React, { useMemo, useState } from 'react';
import { FONT } from '../App.jsx';
import { buildTrack } from './racetrack.js';
import { MAPS, MAP_KEYS, bottleSpots } from './racemaps.js';
import { fmtRace, LAPS } from './raceengine.js';
import { GBtn, GPill, kitTap } from './gamekit.jsx';
import { GGlyph } from './gskill.jsx';


const RACE_GI = { rocket: 'rocket', shield: 'shield', oil: 'oil', shock: 'electric', mine: 'mine', emp: 'emp', ghost: 'ghost', hop: 'hop', spike: 'spikes', block: 'barrier', ram: 'ram' };
export function SkillIcon({ k, size = 34 }) {
  return <GGlyph k={RACE_GI[k] || 'rocket'} size={size} style={{ filter: 'drop-shadow(0 1px 1.5px rgba(0,0,0,0.55))' }} />;
}
export const raceGlyph = (k) => RACE_GI[k] || 'rocket';

export function NitroIcon({ size = 30 }) {
  return <GGlyph k="nitro" size={size} style={{ filter: 'drop-shadow(0 1px 1.5px rgba(0,0,0,0.55))' }} />;
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
  return <GGlyph k="drift" size={34} color={drift ? '#FFD27A' : '#FFFFFF'} style={{ filter: 'drop-shadow(0 1px 1.5px rgba(0,0,0,0.55))' }} />;
}

export const skillGlow = () => 'rgba(255,194,61,0.5)';
export function skillFace(k, ok) {
  return ok ? 'radial-gradient(circle at 50% 32%, #3A4250 0%, #1B2028 82%)' : 'radial-gradient(circle at 50% 32%, #2E333C 0%, #181B21 82%)';
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
