import React, { useRef, useState } from 'react';
import { GI } from './gicons.js';

let cssOn = false;
function injectSkillCss() {
  if (cssOn || typeof document === 'undefined') return;
  cssOn = true;
  const st = document.createElement('style');
  st.textContent = [
    '@keyframes gsk-ready{0%,100%{opacity:.35}50%{opacity:.9}}',
    '.gsk{-webkit-tap-highlight-color:transparent;touch-action:none;user-select:none;-webkit-user-select:none;outline:none}',
    '.gsk:focus-visible{box-shadow:0 0 0 3px #fff,0 0 0 6px #2479E8}',
  ].join('\n');
  document.head.appendChild(st);
}

const rgba = (h, a) => { const n = parseInt(String(h).slice(1, 7), 16) || 0; return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };

function pie(c, r, f) {
  if (f >= 0.999) return `M${c} ${c - r}A${r} ${r} 0 1 1 ${c - 0.01} ${c - r}Z`;
  const a = f * Math.PI * 2 - Math.PI / 2, x = c + Math.cos(a) * r, y = c + Math.sin(a) * r;
  return `M${c} ${c}L${c} ${c - r}A${r} ${r} 0 ${f > 0.5 ? 1 : 0} 1 ${x} ${y}Z`;
}

export function GGlyph({ k, size = 24, color = '#FFFFFF', style }) {
  const d = GI[k];
  if (!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden="true" style={{ display: 'block', ...style }}>
      <path d={d} fill={color} />
    </svg>
  );
}

export function SkillFace({ size, icon, glyph, active = false, pressed = false, cool = 0, coolMax = 0, charge = null, ring = null, badge = null, disabled = false, accent = '#FFC23D', main = false, sub = null, tint = null, iconScale = 1 }) {
  injectSkillCss();
  const c = size / 2, sw = main ? 2.4 : 1.8, r = c - sw / 2;
  const busy = cool > 0 && coolMax > 0;
  const frac = busy ? Math.max(0, Math.min(1, cool / coolMax)) : 0;
  const ready = charge != null && charge >= 1 && !disabled;
  const fill = pressed ? 'rgba(255,255,255,0.3)' : active ? rgba(accent, 0.36) : tint ? rgba(tint, 0.42) : `rgba(14,17,22,${main ? 0.38 : 0.44})`;
  const edge = disabled ? 'rgba(255,255,255,0.28)' : active || ready ? rgba(accent, 0.98) : 'rgba(255,255,255,0.66)';
  const is = Math.round(size * (main ? 0.5 : 0.52) * iconScale);
  const dim = disabled ? 0.32 : busy ? 0.42 : 1;
  const arcR = c - sw - 2.2, arcL = 2 * Math.PI * arcR;
  return (
    <>
      {ready && <span aria-hidden="true" style={{ position: 'absolute', inset: -3, borderRadius: '50%', boxShadow: `0 0 0 1.5px ${rgba(accent, 0.5)}, 0 0 10px ${rgba(accent, 0.55)}`, animation: 'gsk-ready 1.8s ease-in-out infinite', pointerEvents: 'none' }} />}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none', transform: pressed ? 'scale(0.93)' : 'none', transition: 'transform 0.06s ease-out' }}>
        <circle cx={c} cy={c} r={r} fill={fill} stroke={edge} strokeWidth={sw} />
        <circle cx={c} cy={c} r={r - sw / 2 - 0.6} fill="none" stroke="rgba(0,0,0,0.28)" strokeWidth="1" />
        {busy && <path d={pie(c, r - sw / 2, frac)} fill="rgba(0,0,0,0.5)" />}
        {charge != null && !ready && charge > 0 && <circle cx={c} cy={c} r={arcR} fill="none" stroke={accent} strokeWidth={main ? 3.4 : 3} strokeLinecap="round" strokeDasharray={`${arcL * Math.max(0, Math.min(1, charge))} ${arcL}`} transform={`rotate(-90 ${c} ${c})`} />}
        {ring != null && ring > 0 && ring < 1 && <circle cx={c} cy={c} r={arcR} fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${arcL * ring} ${arcL}`} transform={`rotate(-90 ${c} ${c})`} />}
        {icon && GI[icon] && (
          <g transform={`translate(${c - is / 2} ${c - is / 2 - (sub ? size * 0.07 : 0)}) scale(${is / 512})`} opacity={dim} style={{ filter: 'drop-shadow(0 1px 1.5px rgba(0,0,0,0.6))' }}>
            <path d={GI[icon]} fill="#FFFFFF" />
          </g>
        )}
      </svg>
      {glyph && <span aria-hidden="true" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: dim, pointerEvents: 'none', transform: pressed ? 'scale(0.93)' : 'none' }}>{glyph}</span>}
      {busy && coolMax > 1.2 && <span aria-hidden="true" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit', fontWeight: 800, fontSize: Math.round(size * 0.34), color: '#FFFFFF', fontVariantNumeric: 'tabular-nums', textShadow: '0 1px 3px rgba(0,0,0,0.85)', pointerEvents: 'none' }}>{Math.ceil(cool)}</span>}
      {sub != null && !busy && <span aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, bottom: Math.round(size * 0.13), textAlign: 'center', fontWeight: 800, fontSize: Math.max(9, Math.round(size * 0.17)), color: '#FFFFFF', fontVariantNumeric: 'tabular-nums', textShadow: '0 1px 2px rgba(0,0,0,0.8)', lineHeight: 1, pointerEvents: 'none' }}>{sub}</span>}
      {badge != null && <span aria-hidden="true" style={{ position: 'absolute', right: -3, top: -3, minWidth: 19, height: 19, padding: '0 5px', boxSizing: 'border-box', borderRadius: 10, background: 'rgba(14,17,22,0.88)', boxShadow: `inset 0 0 0 1.4px ${disabled ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.75)'}`, color: '#FFFFFF', fontSize: 11, fontWeight: 800, fontVariantNumeric: 'tabular-nums', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>{badge}</span>}
    </>
  );
}

export function GSkill({ icon, glyph, label, size = 56, onPress, onDown, onUp, active = false, cool = 0, coolMax = 0, charge = null, ring = null, badge = null, disabled = false, main = false, accent, sub, tint, tap, style, iconScale }) {
  const [down, setDown] = useState(false);
  const id = useRef(null);
  const busy = cool > 0 && coolMax > 0;
  const press = (e) => {
    e.stopPropagation();
    if (e.cancelable) e.preventDefault();
    if (disabled) return;
    id.current = e.pointerId;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    setDown(true);
    if (onDown) onDown(e);
    if (!busy && onPress) { if (tap) tap(); onPress(e); }
  };
  const release = (e) => {
    if (id.current !== e.pointerId) return;
    id.current = null;
    setDown(false);
    if (onUp) onUp(e);
  };
  return (
    <button type="button" className="gsk" aria-label={label} aria-pressed={active || undefined} aria-disabled={disabled || undefined}
      onPointerDown={press} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release} onClick={(e) => e.stopPropagation()} onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !disabled && !busy && onPress) { e.preventDefault(); onPress(e); } }}
      style={{ position: 'relative', width: size, height: size, padding: 0, border: 'none', borderRadius: '50%', background: 'transparent', cursor: disabled ? 'default' : 'pointer', flexShrink: 0, ...style }}>
      <SkillFace size={size} icon={icon} glyph={glyph} active={active} pressed={down && !disabled} cool={cool} coolMax={coolMax} charge={charge} ring={ring} badge={badge} disabled={disabled} accent={accent} main={main} sub={sub} tint={tint} iconScale={iconScale} />
    </button>
  );
}
