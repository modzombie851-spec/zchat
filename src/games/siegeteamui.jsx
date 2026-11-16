import React from 'react';
import { GPill, GHudPanel, GIcon, kitTap, pressProps, INK, GLobbySheet, GSeg } from './gamekit.jsx';
import { GGlyph } from './gskill.jsx';
import { FONT } from '../App.jsx';
import * as E from './siegeengine.js';
import * as T from './siegeteam.js';
import { parseSBM } from './siegechar.js';

export const TCOL = T.TEAM_COL;
export const TNAME = ['Blue', 'Red'];
export const TS_ITEMS = [1, 2, 3, 4, 5].map((n) => [String(n), `${n}v${n}`]);
export const MODE_ITEMS = [['waves', 'Waves'], ['tdm', 'Team deathmatch'], ['hp', 'Hardpoint']];
export function ModePick({ value, onPick, disabled }) {
  return (
    <div role="radiogroup" aria-label="Game mode" style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: 4, borderRadius: 13, background: 'rgba(0,0,0,0.45)', boxShadow: `inset 0 2px 5px rgba(0,0,0,0.5), 0 0 0 2px ${INK}` }}>
      {MODE_ITEMS.map(([k, t]) => {
        const on = value === k;
        return (
          <button key={k} type="button" role="radio" aria-checked={on} className="zgk-btn" disabled={!!disabled && !on} {...pressProps(() => { if (!disabled && !on) onPick(k); })}
            style={{ flex: '1 0 auto', height: 34, border: 'none', borderRadius: 9, padding: '0 10px', fontFamily: FONT, fontSize: 13, fontWeight: 900, cursor: disabled ? 'default' : 'pointer', whiteSpace: 'nowrap', background: on ? 'linear-gradient(180deg, #FFE868 0%, #F5B21E 100%)' : 'transparent', color: on ? '#3A2500' : 'rgba(255,255,255,0.84)', boxShadow: on ? `0 0 0 2px ${INK}, inset 0 -3px 0 rgba(150,90,0,0.45), inset 0 2px 0 rgba(255,255,255,0.55)` : 'none', textShadow: on ? '0 1px 0 rgba(255,255,255,0.5)' : 'none', opacity: disabled && !on ? 0.45 : 1 }}>{t}</button>
        );
      })}
    </div>
  );
}
export const mmss = (s) => { const v = Math.max(0, Math.floor(s)); return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`; };

export const TLOOK = {
  mel: { m: 'us_rover', s: 1.25, y: 0, rot: 0, bar: 1.5, w: 34 },
  rng: { m: 'us_rrover', s: 1.55, y: 0, rot: 0, bar: 1.85, w: 32 },
  sie: { m: 'us_brover', s: 2.1, y: 0, rot: 0, bar: 2.4, w: 44 },
  tow: { m: 'us_antenna', s: 5.6, y: 0, rot: 0, bar: 6.0, w: 64, base: 'us_ring', bs: 0.55, glow: 5.1 },
  gua: { m: 'us_radar', s: 5.2, y: 0, rot: 0, bar: 5.6, w: 76, base: 'us_ring', bs: 0.7, glow: 4.4 },
  cor: { m: 'us_dome', s: 3.8, y: 0, rot: 0, bar: 4.3, w: 96, glow: 3.2 },
  shp: { m: 'us_ship', s: 4.6, y: 1.3, rot: 0, bar: 4.5, w: 0 },
};
const TINTS = [new Float32Array([0.62, 0.86, 1.45, 0.553]), new Float32Array([1.45, 0.66, 0.62, 0.553]), new Float32Array([1.12, 0.84, 1.42, 0.553])];
const TINTF = new Float32Array([1.9, 1.9, 1.9, 0.553]);
const TINTI = new Float32Array([0.75, 0.95, 1.4, 0.553]);
const TINTSOFT = [new Float32Array([0.74, 0.92, 1.38, 0.553]), new Float32Array([1.38, 0.74, 0.7, 0.553]), new Float32Array([1.08, 0.9, 1.3, 0.553])];
export const unitCol = (b, my, soft) => (b.flash > 0 ? TINTF : b.stun > 0 || b.stunV ? TINTI : (soft ? TINTSOFT : TINTS)[b.tm == null || b.tm < 0 ? 2 : b.tm === my ? 0 : 1]);

export const SKI = {'blaze.atk': 0, 'blaze.sup': 1, 'blaze.gad': 2, 'pip.atk': 3, 'pip.sup': 4, 'pip.gad': 5, 'boom.atk': 6, 'boom.sup': 7, 'boom.gad': 8, 'mira.atk': 9, 'mira.sup': 10, 'mira.gad': 11, 'rex.atk': 12, 'rex.sup': 13, 'rex.gad': 14, 'volt.atk': 15, 'volt.sup': 16, 'volt.gad': 17, 'kai.atk': 18, 'kai.sup': 19, 'kai.gad': 20, 'ivy.atk': 21, 'ivy.sup': 22, 'ivy.gad': 23, 'nyx.atk': 24, 'nyx.sup': 25, 'nyx.gad': 26, 'arlo.atk': 27, 'arlo.sup': 28, 'arlo.gad': 29, 'wren.atk': 30, 'wren.sup': 31, 'wren.gad': 32, 'sk.blink': 33, 'sk.mend': 34, 'sk.hunter': 35, 'sk.guard': 36, 'sk.sprint': 37, 'sk.shock': 38, 'dash': 39, 'home': 40};
export const SKI_URL = '/bolt/skill-icons-v2.webp';
export const heroIc = (key, slot) => (SKI[`${key}.${slot}`] != null ? `${key}.${slot}` : null);
export function SkIcon({ k, size = 40, dim, style }) {
  const i = SKI[k];
  if (i == null) return null;
  return <span aria-hidden="true" style={{ display: 'block', width: size, height: size, borderRadius: '50%', flexShrink: 0, backgroundImage: `url(${SKI_URL})`, backgroundSize: `${8 * size}px ${6 * size}px`, backgroundPosition: `${-(i % 8) * size}px ${-Math.floor(i / 8) * size}px`, boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.3), inset 0 -5px 9px rgba(0,0,0,0.35)', filter: dim ? 'grayscale(0.75) brightness(0.55)' : 'none', ...style }} />;
}
export function PaintSkill({ ic, size = 56, cool = 0, coolMax = 0, badge, disabled, label, onPress, ring = '#E9C46A', glow }) {
  const f = coolMax > 0 && cool > 0.05 ? Math.min(1, cool / coolMax) : 0;
  const off = disabled || f > 0;
  return (
    <button type="button" className="zgk-btn" aria-label={label} onPointerDown={(e) => { e.stopPropagation(); if (e.cancelable) e.preventDefault(); if (off) return; kitTap('click'); if (onPress) onPress(); }}
      style={{ position: 'relative', width: size, height: size, borderRadius: '50%', border: 'none', padding: 0, cursor: off ? 'default' : 'pointer', touchAction: 'none', background: 'radial-gradient(circle at 50% 35%, #2A3247, #0D111C 75%)', boxShadow: `0 0 0 2px ${off ? 'rgba(200,205,215,0.55)' : ring}, 0 0 0 4px rgba(10,12,20,0.55), 0 4px 10px rgba(0,0,0,0.45)${glow && !off ? `, 0 0 14px ${glow}` : ''}` }}>
      <SkIcon k={ic} size={size - 6} dim={off} style={{ position: 'absolute', left: 3, top: 3 }} />
      {f > 0 && <span aria-hidden="true" style={{ position: 'absolute', left: 3, top: 3, width: size - 6, height: size - 6, borderRadius: '50%', background: `conic-gradient(rgba(4,6,12,0.62) ${(f * 360).toFixed(1)}deg, rgba(0,0,0,0) 0deg)` }} />}
      {f > 0 && <span aria-hidden="true" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.round(size * 0.34), fontWeight: 900, color: '#FFFFFF', textShadow: '0 1px 3px #000, 0 0 2px #000', fontFamily: FONT }}>{Math.ceil(cool)}</span>}
      {badge != null && <span aria-hidden="true" style={{ position: 'absolute', right: -4, top: -4, minWidth: 19, height: 19, padding: '0 4px', borderRadius: 10, background: '#141A29', boxShadow: '0 0 0 1.5px rgba(255,255,255,0.75)', fontSize: 11, fontWeight: 900, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>{badge}</span>}
    </button>
  );
}

export function riftUnpack(buf, img) {
  const dv = new DataView(buf);
  if (dv.byteLength < 8 || dv.getUint32(0, true) !== 0x314b5052) return null;
  const u8 = new Uint8Array(buf);
  const n = dv.getUint32(4, true);
  const cv = document.createElement('canvas');
  cv.width = img.naturalWidth || img.width; cv.height = img.naturalHeight || img.height;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  cx.drawImage(img, 0, 0);
  const px = cx.getImageData(0, 0, cv.width, cv.height).data;
  const AW = cv.width, AH = cv.height;
  const td = new TextDecoder();
  const out = { m: {}, kit: {} };
  let o = 8;
  for (let i = 0; i < n && o < u8.length; i++) {
    const nl = u8[o]; o += 1;
    const name = td.decode(u8.subarray(o, o + nl)); o += nl;
    const len = dv.getUint32(o, true); o += 4;
    let M = null;
    try { M = parseSBM(u8.slice(o, o + len)); } catch { M = null; }
    o += len;
    if (!M || !M.verts) continue;
    if (name.startsWith('ud_')) out.kit[name] = bakeKit(M, px, AW, AH);
    else out.m[name] = M;
  }
  return out;
}
function bakeKit(M, px, AW, AH) {
  const nv = M.nv, V = new DataView(M.verts.buffer, M.verts.byteOffset, M.verts.byteLength);
  const P = new Float32Array(nv * 3), N = new Float32Array(nv * 3), C = new Float32Array(nv * 3);
  for (let i = 0; i < nv; i++) {
    const b = i * 32, k3 = i * 3;
    P[k3] = V.getFloat32(b, true); P[k3 + 1] = V.getFloat32(b + 4, true); P[k3 + 2] = V.getFloat32(b + 8, true);
    const nx = V.getInt16(b + 12, true) / 32767, ny = V.getInt16(b + 14, true) / 32767, nz = V.getInt16(b + 16, true) / 32767;
    const l = Math.hypot(nx, ny, nz) || 1;
    N[k3] = nx / l; N[k3 + 1] = ny / l; N[k3 + 2] = nz / l;
    const u = V.getUint16(b + 20, true) / 65535, v = V.getUint16(b + 22, true) / 65535;
    const x = Math.min(AW - 1, Math.max(0, Math.floor(u * AW))), y = Math.min(AH - 1, Math.max(0, Math.floor(v * AH)));
    const q = (y * AW + x) * 4;
    C[k3] = px[q] / 255; C[k3 + 1] = px[q + 1] / 255; C[k3 + 2] = px[q + 2] / 255;
  }
  return { P, N, C, I: M.idx };
}

export function TeamScore({ hud, onPress }) {
  const t = hud.tm;
  if (!t) return null;
  const a = t.sc[t.my === 1 ? 1 : 0], b = t.sc[t.my === 1 ? 0 : 1];
  const left = t.gm ? Math.max(0, t.tlim - t.t) : t.t;
  const sub = t.od ? 'Overtime' : t.goal ? `First to ${t.goal}` : `${t.k} ${t.d} ${t.a}`;
  return (
    <button type="button" className="zgk-btn" aria-label={`Your team ${a}, enemy team ${b}. Open the scoreboard`} {...pressProps(() => { kitTap(); onPress(); })}
      style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'stretch', height: 34, padding: 0, border: 'none', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', fontFamily: FONT, color: '#FFFFFF', boxShadow: '0 2px 6px rgba(0,0,0,0.3)', background: 'rgba(8,12,22,0.62)' }}>
      <span style={{ minWidth: 38, padding: '0 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg, #3D8BFF, #2364D6)', fontSize: 18, fontWeight: 900, fontVariantNumeric: 'tabular-nums', textShadow: '0 1px 2px rgba(0,0,0,0.45)' }}>{a}</span>
      <span style={{ minWidth: 58, padding: '0 7px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1.1 }}>
        <span style={{ fontSize: 13, fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: t.gm && left < 60 && !t.od ? '#FFD45A' : '#FFFFFF' }}>{t.od ? '0:00' : mmss(left)}</span>
        <span style={{ fontSize: 9, fontWeight: 800, color: t.od ? '#FFD45A' : 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap' }}>{sub}</span>
      </span>
      <span style={{ minWidth: 38, padding: '0 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg, #FF4D5E, #CC2B3C)', fontSize: 18, fontWeight: 900, fontVariantNumeric: 'tabular-nums', textShadow: '0 1px 2px rgba(0,0,0,0.45)' }}>{b}</span>
    </button>
  );
}

export function ZoneChip({ hud }) {
  const t = hud.tm;
  if (!t || !t.zn) return null;
  const z = t.zn;
  const col = !z.on ? '#FFFFFF' : z.hold === t.my ? '#62B0FF' : z.hold === 2 ? '#FFD45A' : z.hold >= 0 ? '#FF6B78' : '#E8EAF0';
  const word = !z.on ? 'opens in' : z.hold === t.my ? 'ours' : z.hold === 2 ? 'contested' : z.hold >= 0 ? 'theirs' : 'empty';
  return (
    <span aria-live="polite" style={{ display: 'flex', alignItems: 'center', gap: 6, height: 24, padding: '0 9px', borderRadius: 7, background: 'rgba(8,12,22,0.62)', boxShadow: `inset 0 0 0 1.5px ${col}55`, fontSize: 11.5, fontWeight: 900, whiteSpace: 'nowrap', pointerEvents: 'none' }}>
      <span style={{ width: 9, height: 9, borderRadius: 2, transform: 'rotate(45deg)', background: col, boxShadow: z.on && z.hold === 2 ? `0 0 6px ${col}` : 'none' }} />
      <span>{z.n}</span>
      <span style={{ color: col }}>{word}</span>
      <span style={{ fontVariantNumeric: 'tabular-nums', color: 'rgba(255,255,255,0.8)' }}>{mmss(z.t)}</span>
    </span>
  );
}

export function TeamShip({ hud }) {
  const t = hud.tm;
  if (!t || !t.ship) return null;
  const s = t.ship;
  const txt = s.k === 'wait' ? `Hive Ship in ${mmss(s.t)}` : s.k === 'here' ? 'Hive Ship is here' : s.k === 'ours' ? 'Our Hive Ship is pushing' : 'Their Hive Ship is pushing';
  const col = s.k === 'here' ? '#FFD45A' : s.k === 'ours' ? '#9FD0FF' : s.k === 'theirs' ? '#FF9C8F' : 'rgba(255,255,255,0.8)';
  return <GHudPanel style={{ height: 22, padding: '0 9px', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 900, color: col, whiteSpace: 'nowrap' }}><GGlyph k="vortex" size={13} color={col} />{txt}</GHudPanel>;
}

export function TeamMe({ hud, powers }) {
  const t = hud.tm;
  if (!t) return null;
  const f = t.tl >= T.TL_MAX ? 1 : Math.max(0, Math.min(1, t.xp / Math.max(1, t.need)));
  const C = 2 * Math.PI * 17;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
      <span aria-label={`Level ${t.tl}`} style={{ position: 'relative', width: 40, height: 40, display: 'block', flexShrink: 0 }}>
        <svg width="40" height="40" viewBox="0 0 40 40" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }} aria-hidden="true">
          <circle cx="20" cy="20" r="17" fill="rgba(10,14,26,0.82)" stroke="rgba(255,255,255,0.16)" strokeWidth="3.5" />
          <circle cx="20" cy="20" r="17" fill="none" stroke="#FFD45A" strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${(C * f).toFixed(1)} ${C.toFixed(1)}`} />
        </svg>
        <span style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
          <span style={{ fontSize: 8.5, fontWeight: 900, color: '#FFD45A' }}>Lv</span>
          <span style={{ fontSize: 15, fontWeight: 900 }}>{t.tl}</span>
        </span>
      </span>
      {powers}
      {t.buffs.map((b) => (
        <GHudPanel key={b.k} style={{ height: 24, padding: '0 8px', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 900, color: b.col, whiteSpace: 'nowrap' }}>
          <span style={{ width: 8, height: 8, borderRadius: 4, background: b.col, boxShadow: `0 0 6px ${b.col}` }} />{`${b.name} ${Math.ceil(b.t)}`}
        </GHudPanel>
      ))}
    </div>
  );
}

export const TXT_COL = ['#62B0FF', '#FF6B78'];
export function KillFeed({ items }) {
  if (!items.length) return null;
  return (
    <div aria-live="polite" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 3, pointerEvents: 'none' }}>
      {items.map((it) => (
        <span key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 5, height: 20, padding: '0 8px', borderRadius: 6, background: 'rgba(8,12,22,0.5)', fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap', textShadow: '0 1px 2px rgba(0,0,0,0.6)', animation: 'zgk-pop 0.22s ease-out' }}>
          {it.kill ? (
            <>
              <span style={{ color: it.kill[1], fontWeight: 900, maxWidth: 92, overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.kill[0]}</span>
              {it.ic && SKI[it.ic] != null ? <SkIcon k={it.ic} size={15} /> : <GGlyph k="crosshair" size={12} color="#FFFFFF" />}
              <span style={{ color: it.kill[3], fontWeight: 900, maxWidth: 92, overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.kill[2]}</span>
            </>
          ) : it.parts.map(([t, c], i) => <span key={i} style={{ color: c || 'rgba(255,255,255,0.85)', fontWeight: c ? 900 : 800 }}>{t}</span>)}
        </span>
      ))}
    </div>
  );
}

export function SkillPick({ value, onPick, disabled, compact }) {
  const S = T.SKILLS[value] || T.SKILLS.blink;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div role="radiogroup" aria-label="Battle skill" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {T.SKILL_KEYS.map((k) => {
          const on = k === value;
          const K = T.SKILLS[k];
          return (
            <button key={k} type="button" role="radio" aria-checked={on} aria-label={K.name} className="zgk-btn" disabled={disabled && !on} {...pressProps(() => { if (!disabled && !on) { kitTap(); onPick(k); } })}
              style={{ width: compact ? 36 : 40, height: compact ? 36 : 40, borderRadius: '50%', border: 'none', padding: 0, cursor: disabled ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0D111C', boxShadow: on ? `0 0 0 2.5px #FFD45A, 0 0 12px ${K.col}AA` : '0 0 0 1.5px rgba(255,255,255,0.22)', opacity: disabled && !on ? 0.5 : 1 }}>
              {SKI[`sk.${k}`] != null ? <SkIcon k={`sk.${k}`} size={compact ? 32 : 36} dim={!on} /> : <GGlyph k={K.icon} size={compact ? 20 : 22} color={on ? '#FFFFFF' : K.col} />}
            </button>
          );
        })}
      </div>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.78)', lineHeight: 1.3 }}><span style={{ fontWeight: 900, color: S.col }}>{S.name}</span>{`. ${S.text}`}</div>
    </div>
  );
}

export function TeamSlots({ list, ts, thumbs, myK, onSwap, canSwap, botsOn, hostId }) {
  const col = (tm) => {
    const L = list.filter((p) => p.tm === tm);
    return (
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4, padding: 6, borderRadius: 10, background: tm === 0 ? 'rgba(61,139,255,0.14)' : 'rgba(255,77,94,0.14)', boxShadow: `inset 0 0 0 1.5px ${TCOL[tm]}66` }}>
        <span style={{ fontSize: 12, fontWeight: 900, color: tm === 0 ? '#AFCBFF' : '#FFB3BB' }}>{`${TNAME[tm]} ${Math.min(L.length, ts)} of ${ts}`}</span>
        {Array.from({ length: ts }, (_, i) => {
          const p = L[i];
          if (!p) return <span key={`e${i}`} style={{ height: 26, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}><span style={{ width: 22, height: 22, borderRadius: 11, boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.2)' }} />{botsOn ? 'Bot' : 'Open'}</span>;
          return (
            <span key={p.id} style={{ height: 26, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, minWidth: 0 }}>
              <span style={{ width: 22, height: 22, borderRadius: 11, overflow: 'hidden', flexShrink: 0, background: '#141A2C', boxShadow: `0 0 0 1.5px ${p.id === myK ? '#FFD45A' : TCOL[tm]}` }}>{thumbs[p.h] ? <img src={thumbs[p.h]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : null}</span>
              <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: p.id === myK ? '#FFE15A' : '#FFFFFF' }}>{p.id === myK ? 'You' : p.n}{p.id === hostId ? ', host' : ''}</span>
              {p.pw ? <span aria-label={`Power ${p.pw}`} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 2, fontSize: 10.5, fontWeight: 900, color: '#FFD45A' }}><GIcon k="bolt" size={11} color="#FFD45A" ink="transparent" />{p.pw}</span> : null}
            </span>
          );
        })}
      </div>
    );
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 6 }}>{col(0)}{col(1)}</div>
      {canSwap && <GPill text="Switch team" icon="replay" color="white" small wide onPress={onSwap} />}
    </div>
  );
}

export function TeamBoard({ GS, rows, myK, myTeam, thumbs, nameOf, score, onClose, title = 'Scoreboard' }) {
  const rate = (r) => r.k * 3 + r.a * 1.2 - r.d * 0.6 + (r.dmg || 0) / 2500;
  const mvp = !onClose && rows.length > 1 ? rows.reduce((a, b) => (rate(b) > rate(a) ? b : a), rows[0]).id : null;
  const head = <div style={{ display: 'flex', gap: 6, padding: '0 8px', fontSize: 10.5, fontWeight: 900, color: 'rgba(255,255,255,0.6)' }}><span style={{ flex: 1 }}>Hero</span><span style={{ width: 28, textAlign: 'right' }}>Lv</span><span style={{ width: 62, textAlign: 'right' }}>K D A</span><span style={{ width: 44, textAlign: 'right' }}>Damage</span></div>;
  const side = (tm) => {
    const mine = tm === myTeam, c = mine ? 0 : 1;
    return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px' }}>
        <span style={{ width: 12, height: 12, borderRadius: 3, background: TCOL[c] }} />
        <span style={{ flex: 1, fontSize: 14, fontWeight: 900 }}>{mine ? 'Your team' : 'Enemy team'}</span>
        <span style={{ fontSize: 16, fontWeight: 900, color: TXT_COL[c] }}>{score ? score[tm] : 0}</span>
      </div>
      {head}
      {rows.filter((r) => r.tm === tm).map((r) => (
        <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 10, background: r.id === myK ? 'rgba(255,194,61,0.2)' : 'rgba(255,255,255,0.06)', minWidth: 0, opacity: r.dead ? 0.6 : 1 }}>
          <span style={{ width: 24, height: 24, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: '#141A2C', boxShadow: `0 0 0 1.5px ${TCOL[c]}` }}>{thumbs[r.key] ? <img src={thumbs[r.key]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : null}</span>
          <span style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ minWidth: 0, fontSize: 12.5, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.id === myK ? 'You' : nameOf(r.id)}{r.dead && r.resp > 0 ? `, back in ${Math.ceil(r.resp)}` : ''}</span>
            {r.id === mvp && <span style={{ flexShrink: 0, height: 17, padding: '0 6px', borderRadius: 5, background: 'linear-gradient(180deg, #FFE27A, #F5B321)', color: '#2A1D05', fontSize: 10, fontWeight: 900, display: 'flex', alignItems: 'center' }}>MVP</span>}
          </span>
          <span style={{ width: 28, textAlign: 'right', fontSize: 12.5, fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: '#FFD45A' }}>{r.tl}</span>
          <span style={{ width: 62, textAlign: 'right', fontSize: 12.5, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{`${r.k} ${r.d} ${r.a}`}</span>
          <span style={{ width: 44, textAlign: 'right', fontSize: 12.5, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{r.dmg >= 10000 ? `${Math.round(r.dmg / 1000)}k` : r.dmg >= 1000 ? `${(r.dmg / 1000).toFixed(1)}k` : r.dmg}</span>
        </div>
      ))}
    </div>
    );
  };
  const body = <div style={{ display: 'grid', gridTemplateColumns: GS.land ? 'repeat(2, minmax(0, 1fr))' : '1fr', gap: 12 }}>{side(myTeam === 1 ? 1 : 0)}{side(myTeam === 1 ? 0 : 1)}</div>;
  if (!onClose) return body;
  return (
    <GLobbySheet GS={GS} title={title} width={720} onClose={onClose}>
      {body}
      <div style={{ marginTop: 12 }}><GPill text="Done" color="dark" small wide onPress={onClose} /></div>
    </GLobbySheet>
  );
}

export const BL_ITEMS = [['0', 'Easy'], ['1', 'Normal'], ['2', 'Hard']];
export function TeamSettings({ ts, onTs, disabled, bl, onBl }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 900, width: 82 }}>Team size</span>
        <div style={{ flex: 1 }}><GSeg value={String(ts)} items={TS_ITEMS} onPick={(v) => onTs(Number(v))} disabled={disabled} label="Team size" /></div>
      </div>
      {onBl && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 900, width: 82 }}>Bot difficulty</span>
          <div style={{ flex: 1 }}><GSeg value={String(bl)} items={BL_ITEMS} onPick={(v) => onBl(Number(v))} disabled={disabled} label="Bot difficulty" /></div>
        </div>
      )}
    </div>
  );
}

export function TeamMapCard({ img, ts, isHost, onPress, gm }) {
  const mode = T.GM_NAME[T.validGm(gm)];
  return (
    <button type="button" className="zgk-btn" aria-label={`Map ${E.ARENAS.base.name}, ${mode}, ${ts}v${ts}`} {...pressProps(() => { kitTap(); if (onPress) onPress(); })}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 5, border: 'none', borderRadius: 12, background: 'rgba(255,255,255,0.07)', cursor: onPress ? 'pointer' : 'default', color: '#FFFFFF', fontFamily: FONT, textAlign: 'left' }}>
      <span style={{ width: 92, aspectRatio: '16 / 9', borderRadius: 8, overflow: 'hidden', display: 'block', background: 'linear-gradient(135deg, #B9542A, #6E3A2A)', flexShrink: 0 }}>{img ? <img src={img} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : null}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 15, fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{E.ARENAS.base.name}</span>
        <span style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.72)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{`${ts}v${ts}, ${mode}`}</span>
      </span>
      {onPress && <span style={{ height: 26, padding: '0 10px', borderRadius: 13, background: isHost ? 'linear-gradient(180deg, #FFE27A, #F5B321)' : 'rgba(10,14,26,0.7)', color: isHost ? '#2A1D05' : '#FFFFFF', fontSize: 11.5, fontWeight: 900, display: 'flex', alignItems: 'center', flexShrink: 0 }}>{isHost ? 'Change' : 'Details'}</span>}
    </button>
  );
}

export function TeamHowTo({ gm }) {
  const hp = gm === 'hp';
  const rows = [
    hp ? ['vortex', 'Stand in the zone to score a point every second. If both teams are inside, nobody scores. The zone moves every minute.'] : ['crosshair', 'Every takedown scores a point for your team. The first team to the goal wins.'],
    ['revive', 'You come back at your base a few seconds after you fall. Your base heals you, and the enemy base hurts you.'],
    ['flame', 'Monsters live around the map. Beat them for XP. The big ones give Fury and Flow.'],
    ['sprint', 'Every level up gives you a new power, up to level 20.'],
    ['shield', 'Fair fight. Everyone starts at level 1 with the same stats, and players are split by power.'],
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {rows.map(([ic, t]) => (
        <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 8px', borderRadius: 10, background: 'rgba(255,255,255,0.06)' }}>
          <span style={{ width: 28, height: 28, borderRadius: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(20,24,30,0.85)' }}><GGlyph k={ic} size={17} color="#FFD45A" /></span>
          <span style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.35, color: 'rgba(255,255,255,0.88)' }}>{t}</span>
        </div>
      ))}
    </div>
  );
}

export function RespawnBox({ t, bottom }) {
  return (
    <div style={{ position: 'absolute', left: '50%', bottom, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '8px 18px', borderRadius: 16, background: 'rgba(10,14,26,0.78)', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.18)', zIndex: 4, pointerEvents: 'none' }}>
      <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.75)' }}>You are back in</span>
      <span style={{ fontSize: 30, fontWeight: 900, lineHeight: 1, color: '#FFE15A', fontVariantNumeric: 'tabular-nums' }}>{Math.max(1, Math.ceil(t))}</span>
    </div>
  );
}

const spotted = (W, o, tm) => W.t - (o.seen || -9) < 1.6 || E.heroList(W).some((a) => a.st === 0 && a.tm === tm && Math.hypot(a.x - o.x, a.z - o.z) < 17);
export function drawTeamMini(m2, A, W, myK, mini, flip, MW, MH = MW) {
  const sx = MW / A.wx;
  const P = (x, z) => (flip ? [MW - x * sx, MH - z * sx] : [x * sx, z * sx]);
  m2.save();
  if (flip) { m2.translate(MW, MH); m2.rotate(Math.PI); }
  m2.drawImage(mini, 0, 0, MW, MH);
  m2.restore();
  const me = W.heroes[myK];
  const myTm = me ? me.tm : 0;
  const S = W.tm;
  if (S && S.gm === 'hp') {
    const Z = T.zoneNow(W), N2 = T.zoneNext(W);
    if (S.zon && Z) {
      const [x, y] = P(Z.x, Z.z);
      const col = S.zh === myTm ? '#62B0FF' : S.zh === 2 ? '#FFD45A' : S.zh >= 0 ? '#FF6B78' : '#FFFFFF';
      m2.globalAlpha = 0.35; m2.fillStyle = col; m2.beginPath(); m2.arc(x, y, T.ZONE_R * sx * 1.15, 0, Math.PI * 2); m2.fill(); m2.globalAlpha = 1;
      m2.strokeStyle = col; m2.lineWidth = 1.5; m2.beginPath(); m2.arc(x, y, T.ZONE_R * sx * 1.15, 0, Math.PI * 2); m2.stroke();
    }
    if (N2 && (!S.zon || S.zt < 10)) { const [x, y] = P(N2.x, N2.z); m2.setLineDash([2, 2]); m2.strokeStyle = 'rgba(255,255,255,0.85)'; m2.lineWidth = 1; m2.beginPath(); m2.arc(x, y, T.ZONE_R * sx * 1.15, 0, Math.PI * 2); m2.stroke(); m2.setLineDash([]); }
  }
  for (const b of W.robots) {
    if (b.hp <= 0) continue;
    const [x, y] = P(b.x, b.z);
    if (b.type === 'tow' || b.type === 'gua' || b.type === 'cor') {
      const r = b.type === 'cor' ? 4 : b.type === 'gua' ? 3.2 : 2.6;
      m2.fillStyle = '#0E1018'; m2.fillRect(x - r - 1, y - r - 1, r * 2 + 2, r * 2 + 2);
      m2.fillStyle = TCOL[b.tm === myTm ? 0 : 1]; m2.fillRect(x - r, y - r, r * 2, r * 2);
      continue;
    }
    if (b.type === 'shp') { m2.fillStyle = b.ally ? TCOL[b.tm === myTm ? 0 : 1] : '#B88CFF'; m2.strokeStyle = '#0E1018'; m2.lineWidth = 1; m2.beginPath(); m2.arc(x, y, 3.6, 0, Math.PI * 2); m2.fill(); m2.stroke(); continue; }
    m2.fillStyle = b.tm == null || b.tm < 0 ? '#F2D35C' : b.tm === myTm ? '#8FB8FF' : '#FF9AA4';
    m2.fillRect(x - 1.2, y - 1.2, 2.4, 2.4);
  }
  for (const k of W.order) {
    const h = W.heroes[k];
    if (!h || h.st !== 0) continue;
    if (h.tm !== myTm && (!E.seenBy(W, h, myTm) || (S && S.gm && !spotted(W, h, myTm)))) continue;
    const [x, y] = P(h.x, h.z);
    const isMe = k === myK;
    m2.fillStyle = isMe ? '#FFE15A' : TCOL[h.tm === myTm ? 0 : 1];
    m2.strokeStyle = isMe ? '#1B1430' : '#FFFFFF'; m2.lineWidth = isMe ? 1.5 : 1;
    m2.beginPath(); m2.arc(x, y, isMe ? 3.4 : 2.8, 0, Math.PI * 2); m2.fill(); m2.stroke();
  }
}

const MINI_DECO = { 35: 'rgba(84,44,28,0.96)', 114: 'rgba(120,64,38,0.96)', 77: 'rgba(222,226,230,0.96)', 71: 'rgba(222,226,230,0.96)', 76: 'rgba(200,204,210,0.96)', 90: 'rgba(200,204,210,0.96)', 84: 'rgba(214,96,78,0.96)', 120: 'rgba(214,96,78,0.96)', 99: 'rgba(120,150,200,0.9)', 115: 'rgba(120,150,200,0.9)', 61: 'rgba(150,146,142,0.9)', 112: 'rgba(110,108,108,0.92)' };
export function teamMiniBase(A, myTm = 0) {
  const oc = document.createElement('canvas');
  oc.width = A.W * 4; oc.height = A.H * 4;
  const o2 = oc.getContext('2d');
  if (A.deco) {
    o2.fillStyle = 'rgba(166,86,48,0.9)'; o2.fillRect(0, 0, oc.width, oc.height);
    for (let r = 0; r < A.H; r++) for (let c = 0; c < A.W; c++) {
      const ch = A.deco[r * A.W + c];
      const col = ch === 66 ? (c < A.W / 2 === (myTm === 0) ? 'rgba(61,139,255,0.75)' : 'rgba(255,77,94,0.75)') : MINI_DECO[ch];
      if (col) { o2.fillStyle = col; o2.fillRect(c * 4, r * 4, 4, 4); }
    }
    return oc;
  }
  o2.fillStyle = 'rgba(28,62,58,0.92)'; o2.fillRect(0, 0, oc.width, oc.height);
  const CC = { [E.C_WALL]: 'rgba(14,16,26,0.92)', [E.C_BUSH]: 'rgba(110,80,170,0.85)', [E.C_RIVER]: 'rgba(60,150,200,0.95)', [E.C_LANE]: 'rgba(196,170,128,0.95)', [E.C_BASE]: 'rgba(120,132,148,0.95)' };
  for (let r = 0; r < A.H; r++) for (let c = 0; c < A.W; c++) { const v = A.cells[r * A.W + c]; if (CC[v]) { o2.fillStyle = CC[v]; o2.fillRect(c * 4, r * 4, 4, 4); } }
  const T0 = A.team;
  if (T0) {
    for (const p of T0.portals) { o2.fillStyle = '#C9B6FF'; o2.beginPath(); o2.arc(p.x * 2, p.z * 2, 5, 0, Math.PI * 2); o2.fill(); }
    for (const f of T0.founts) { o2.fillStyle = TCOL[f.tm === myTm ? 0 : 1]; o2.globalAlpha = 0.55; o2.beginPath(); o2.arc(f.x * 2, f.z * 2, 12, 0, Math.PI * 2); o2.fill(); o2.globalAlpha = 1; }
  }
  return oc;
}

export function teamHudOf(W, myK) {
  const S = W.tm;
  const me = W.heroes[myK];
  if (!S) return null;
  const kd = (me && S.kd[me.id]) || { k: 0, d: 0, a: 0 };
  const tl = me ? me.tl || 1 : 1;
  const buffs = [];
  if (me && me.buffs) for (const k of Object.keys(me.buffs)) if (T.BUFFS[k] && me.buffs[k] > 0) buffs.push({ k, name: T.BUFFS[k].name, col: T.BUFFS[k].col, t: me.buffs[k] });
  let ship = null;
  const sh = W.robots.find((b) => b.type === 'shp' && b.hp > 0);
  const myTm = me ? me.tm : 0;
  if (sh) ship = sh.ally ? { k: sh.tm === myTm ? 'ours' : 'theirs' } : { k: 'here' };
  else if (S.shipT > 0 && S.shipT < 60) ship = { k: 'wait', t: S.shipT };
  return {
    my: myTm, sc: S.score.slice(), t: S.t, k: kd.k, d: kd.d, a: kd.a, tl, xp: me ? me.xp || 0 : 0, need: T.xpNeed(tl, !!S.gm),
    buffs, ship, resp: me && me.st === 2 ? me.respT || 0 : 0, rec: me && me.recT > 0 ? 1 - me.recT / 4.5 : -1,
    sk: me ? me.sk : 'blink', skCD: me ? Math.ceil((me.skCD || 0) * 10) / 10 : 0, skMax: me && T.SKILLS[me.sk] ? T.SKILLS[me.sk].cd : 1,
    gate: me && me.gate ? Math.max(0, me.gate.t - W.t) : 0, bl: S.bl, gm: S.gm, goal: S.goal, tlim: S.tlim, od: S.od,
    zn: S.gm === 'hp' ? (() => { const Z = S.zon ? T.zoneNow(W) : T.zoneNext(W); return Z ? { n: Z.n, on: !!S.zon, hold: S.zon ? S.zh : -1, t: S.zt } : null; })() : null,
  };
}

export function teamRows(W) {
  const S = W.tm;
  return W.order.map((k) => {
    const h = W.heroes[k];
    const kd = (S && S.kd[k]) || { k: 0, d: 0, a: 0 };
    return { id: k, tm: h.tm, key: h.key, tl: h.tl || 1, k: kd.k, d: kd.d, a: kd.a, dmg: Math.round(h.stats ? h.stats.hd || 0 : 0), dead: h.st === 2, resp: h.respT || 0 };
  });
}
