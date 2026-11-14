import React, { memo, useRef } from 'react';

const CUT = '#14171C';
const rot = (a) => `rotate(${a} 32 32)`;

const MI = {
  bullet: [
    { d: 'M32 4.5C37 8.6 40.2 15.4 40.2 23.4V26.4H23.8V23.4C23.8 15.4 27 8.6 32 4.5Z' },
    { d: 'M24.8 29H39.2V31.6L42 35V51.2H22V35L24.8 31.6Z' },
    { d: 'M23 53.6H41V59H23Z' },
    { d: 'M26 37.5H38', k: 'cs', w: 1.6 },
  ],
  scope: [
    { d: 'M32 14.2A17.8 17.8 0 1 1 31.99 14.2ZM32 18.6A13.4 13.4 0 1 0 32.01 18.6Z', rule: 'evenodd' },
    { d: 'M29.8 4.5H34.2V20H29.8Z' },
    { d: 'M29.8 44H34.2V59.5H29.8Z' },
    { d: 'M4.5 29.8H20V34.2H4.5Z' },
    { d: 'M44 29.8H59.5V34.2H44Z' },
    { d: 'M32 28.4A3.6 3.6 0 1 1 31.99 28.4Z' },
  ],
  mag: [
    { d: 'M11.33 25.48A22 22 0 0 1 51.05 22', k: 's', w: 5 },
    { d: 'M54.05 27.2L54.88 18.63L46.22 23.63Z' },
    { d: 'M52.67 40.52A22 22 0 0 1 12.95 44', k: 's', w: 5 },
    { d: 'M9.95 38.8L9.12 47.37L17.78 42.37Z' },
    { d: 'M26 17.5H37.4L38 23.6C38.9 31 40.8 37.4 44 43.4L35.2 47C32.1 40.4 29.7 33 28.4 25.2Z' },
    { d: 'M29.6 24.6H37.6', k: 'cs', w: 1.7 },
    { d: 'M31 31.4H39.4', k: 'cs', w: 1.7 },
    { d: 'M33 38H41.4', k: 'cs', w: 1.7 },
  ],
  knife: [
    { tf: rot(-38), parts: [
      { d: 'M3 28.6H7V35.4H3Z' },
      { d: 'M6 27H21A3.5 3.5 0 0 1 24.5 30.5V33.5A3.5 3.5 0 0 1 21 37H6Z' },
      { d: 'M11.2 32A1.5 1.5 0 1 1 11.19 32ZM17.2 32A1.5 1.5 0 1 1 17.19 32Z', k: 'c' },
      { d: 'M23.2 22.5H27.6V41.5H23.2Z' },
      { d: 'M27.6 27.2H50C53 27.2 56 28.6 60 31.8C56 35.4 51.8 37.2 47 37.2H27.6Z' },
      { d: 'M30 27.2L31.5 29.4L33 27.2L34.5 29.4L36 27.2L37.5 29.4L39 27.2L40.5 29.4L42 27.2Z', k: 'c' },
      { d: 'M31 32.6H47.5', k: 'cs', w: 1.5 },
    ] },
  ],
  grenade: [
    { d: 'M30 24.5C37.5 24.5 43 30.8 43 39.8C43 48.8 37.5 55.5 30 55.5C22.5 55.5 17 48.8 17 39.8C17 30.8 22.5 24.5 30 24.5Z' },
    { d: 'M25.3 26.6C23.6 35 23.6 45 25.3 53.4M34.7 26.6C36.4 35 36.4 45 34.7 53.4M18.2 35.3C25 33.8 35 33.8 41.8 35.3M18.2 45C25 46.5 35 46.5 41.8 45', k: 'cs', w: 1.9 },
    { d: 'M25.6 16.8H34.4V25.4H25.6Z' },
    { d: 'M24.4 14H35.6V17.6H24.4Z' },
    { d: 'M34.4 14.2H40.2C43 14.2 44.6 16.6 44.4 19.8L43.2 38.4L40.4 37.6L40.9 20.2C40.9 18.6 40.2 17.8 38.6 17.8H34.4Z' },
    { d: 'M47.4 11.6A4.6 4.6 0 1 1 47.39 11.6', k: 's', w: 2.5 },
    { d: 'M43.6 14.4L40.6 15.6', k: 's', w: 2.2 },
  ],
  bottle: [
    { tf: 'rotate(35 28 42)', parts: [
      { d: 'M24.6 10.4H31.4V13.4H24.6Z' },
      { d: 'M25.3 13H30.7V25.4H25.3Z' },
      { d: 'M20.4 31.4C20.4 27.6 22.6 25.8 25.2 25H30.8C33.4 25.8 35.6 27.6 35.6 31.4V55.4C35.6 57.2 34.2 58.6 32.4 58.6H23.6C21.8 58.6 20.4 57.2 20.4 55.4Z' },
      { d: 'M22.4 37.6H33.6V48.4H22.4Z', k: 'c' },
      { d: 'M24.6 40H31.4V46H24.6Z' },
      { d: 'M26 10.6C25.2 7.6 26.4 6 28.4 5.4L30.2 10.6Z' },
    ] },
    { d: 'M42 16C39.5 12.5 40 8.5 43 5.5C43.2 8 44.2 9.4 45.6 10C45 6.5 46.8 3.2 50 1.8C49.4 5 50.2 7.6 52.2 9.4C53.4 8.4 53.8 7 53.7 5.6C56.2 8.6 56.6 12.8 54 16.4C51.8 19.2 44.6 19.4 42 16Z' },
    { d: 'M46.5 15.5C45.8 13.6 46.3 11.8 47.6 10.6C47.8 12 48.6 12.8 49.6 13.2C50 12.4 50.2 11.6 50 10.8C51.6 12.4 51.6 14.6 50.2 16Z', k: 'c' },
  ],
  plate: [
    { d: 'M17.5 13.5L25 7H39L46.5 13.5V52C46.5 54.5 44.8 56.5 42.4 56.5H21.6C19.2 56.5 17.5 54.5 17.5 52Z' },
    { d: 'M21.6 15.1L26.6 10.8H37.4L42.4 15.1V50.8C42.4 51.9 41.7 52.6 40.6 52.6H23.4C22.3 52.6 21.6 51.9 21.6 50.8Z', k: 'cs', w: 1.6 },
    { d: 'M26 23H38M26 28.4H38', k: 'cs', w: 2.2 },
  ],
  c4: [
    { d: 'M8 26H56V50H8Z' },
    { d: 'M20 26V50M44 26V50', k: 'cs', w: 2.4 },
    { d: 'M24 17H40V28H24Z' },
    { d: 'M27 19.6H37V24.6H27Z', k: 'c' },
    { d: 'M29 21.1H33V23.1H29Z', k: 'r' },
    { d: 'M26.5 17.5C24 11 17 10.5 14 16M37.5 17.5C40 11 47 10.5 50 16', k: 's', w: 2.4 },
  ],
  det: [
    { d: 'M24.5 22H39.5A4.5 4.5 0 0 1 44 26.5V53.5A4.5 4.5 0 0 1 39.5 58H24.5A4.5 4.5 0 0 1 20 53.5V26.5A4.5 4.5 0 0 1 24.5 22Z' },
    { d: 'M36 7H39.6V23H36Z' },
    { d: 'M37.8 3.6A2.5 2.5 0 1 1 37.79 3.6Z' },
    { d: 'M32 29A7 7 0 1 1 31.99 29Z', k: 'c' },
    { d: 'M32 31A5 5 0 1 1 31.99 31Z', k: 'r' },
    { d: 'M25.5 50H38.5', k: 'cs', w: 2 },
    { d: 'M43.5 4.5A6.5 6.5 0 0 1 46.6 10M47 1.4A10.5 10.5 0 0 1 51.8 10.6', k: 's', w: 2.2 },
  ],
  jump: [
    { d: 'M33.6 10.8C33.6 6.6 36 4.2 39.4 4.2C42.6 4.2 44.9 6.2 45.3 9.4L47.8 10.5L33.6 11.4Z' },
    { d: 'M39.2 6.4A4.7 4.7 0 1 1 39.19 6.4Z' },
    { d: 'M35 16L42 16.8L40.8 30.4L33 31.6L32 21Z' },
    { d: 'M33.8 23.5L40.2 23.2', k: 'cs', w: 1.4 },
    { d: 'M34.4 18.4L27.6 22.8L22.6 18.8', k: 's', w: 6.1 },
    { d: 'M40 18.8L46.2 24.2L51.6 20.6', k: 's', w: 6.1 },
    { d: 'M37.6 30L45.2 34.6L43.6 44', k: 's', w: 7.3 },
    { d: 'M42.6 44.6L48 45.6', k: 's', w: 6.1 },
    { d: 'M35 30.6L31 40L24.6 47.4', k: 's', w: 7.3 },
    { d: 'M25.4 47.4L21 50', k: 's', w: 6.1 },
    { d: 'M14.4 58.2C18 54.6 21.6 52.8 26.4 52.2', k: 's', w: 2.4, op: 0.75 },
    { d: 'M20.4 61C23.6 58.4 27 57 31.2 56.8', k: 's', w: 2.2, op: 0.5 },
  ],
  crouch: [
    { d: 'M27.6 15.6C27.6 11.4 30 9 33.4 9C36.6 9 38.9 11 39.3 14.2L41.8 15.3L27.6 16.2Z' },
    { d: 'M33.2 11.2A4.7 4.7 0 1 1 33.19 11.2Z' },
    { d: 'M28.8 21L35.8 21.6L35 33.4L27.4 34.6L26.4 25.6Z' },
    { d: 'M30 27.5L53.5 24.6', k: 's', w: 3.2 },
    { d: 'M41 26.4L42.2 31', k: 's', w: 2.6 },
    { d: 'M29.6 22.6L31.4 29L37 27.2', k: 's', w: 5.4 },
    { d: 'M34.6 23L41 27.6L45.6 25.4', k: 's', w: 5.4 },
    { d: 'M32.4 34L41.6 36.6L40.6 47.6', k: 's', w: 7.1 },
    { d: 'M40 48.2L45.6 48.6', k: 's', w: 5.9 },
    { d: 'M29.4 34.6L26.6 47L18 46.4', k: 's', w: 7.1 },
    { d: 'M18.6 46.4L13.6 45.2', k: 's', w: 5.9 },
    { d: 'M9 52.4H55', k: 's', w: 2.4, op: 0.55 },
  ],
  slide: [
    { d: 'M13.6 25.6C13.6 21.4 16 19 19.4 19C22.6 19 24.9 21 25.3 24.2L27.8 25.3L13.6 26.2Z' },
    { d: 'M19.2 21.2A4.7 4.7 0 1 1 19.19 21.2Z' },
    { d: 'M17.4 31.4L24.8 28.6L33.6 39L28 43.6Z' },
    { d: 'M21 31.8L17 38.6L13 45', k: 's', w: 5.7 },
    { d: 'M24 30.2L31 26.6L38.6 24.6', k: 's', w: 5.7 },
    { d: 'M31 41.8L41.6 44.6L51.6 46', k: 's', w: 7.1 },
    { d: 'M51.8 46L55.6 45', k: 's', w: 5.9 },
    { d: 'M29.6 42.4L38 37L44.6 42.8', k: 's', w: 6.6 },
    { d: 'M7 50.8H58', k: 's', w: 2.4, op: 0.6 },
    { d: 'M3.5 29.6H11M2.5 36H9M4.5 42.4H9.5', k: 's', w: 2.2, op: 0.7 },
  ],
  emote: [
    { d: 'M32 13A19 19 0 1 1 31.99 13Z' },
    { d: 'M25 23.6A2.6 3.4 0 1 1 24.99 23.6ZM39 23.6A2.6 3.4 0 1 1 38.99 23.6Z', k: 'c' },
    { d: 'M22.6 36.4C25.6 42.6 38.4 42.6 41.4 36.4', k: 'cs', w: 3.4 },
  ],
  shop: [
    { d: 'M5 12.5H12.5L18.5 40.5H50', k: 's', w: 4.2 },
    { d: 'M15 18.5H57L52.5 35H19Z' },
    { d: 'M27 19L28.2 34.6M37 19L37.4 34.6M47 19L45.8 34.6M17.4 26.8H54.6', k: 'cs', w: 1.8 },
    { d: 'M23.5 44.9A4.6 4.6 0 1 1 23.49 44.9ZM46 44.9A4.6 4.6 0 1 1 45.99 44.9Z' },
  ],
  heart: [
    { d: 'M32 55C22 47.5 8.5 38.5 8.5 25.8C8.5 17.8 14.5 11.5 22 11.5C26.4 11.5 30 13.8 32 17.2C34 13.8 37.6 11.5 42 11.5C49.5 11.5 55.5 17.8 55.5 25.8C55.5 38.5 42 47.5 32 55Z' },
    { d: 'M28.6 21H35.4V41H28.6ZM22 27.6H42V34.4H22Z', k: 'c' },
  ],
  bandage: [
    { tf: rot(-45), parts: [
      { d: 'M17 24H47A8 8 0 0 1 55 32A8 8 0 0 1 47 40H17A8 8 0 0 1 9 32A8 8 0 0 1 17 24Z' },
      { d: 'M25 26.4H39V37.6H25Z', k: 'c' },
      { d: 'M27 28.4H37V35.6H27Z' },
      { d: 'M14.6 29A1.1 1.1 0 1 1 14.59 29ZM14.6 35A1.1 1.1 0 1 1 14.59 35ZM19.4 32A1.1 1.1 0 1 1 19.39 32ZM49.4 29A1.1 1.1 0 1 1 49.39 29ZM49.4 35A1.1 1.1 0 1 1 49.39 35ZM44.6 32A1.1 1.1 0 1 1 44.59 32Z', k: 'c' },
    ] },
  ],
  syringe: [
    { tf: rot(-45), parts: [
      { d: 'M7.5 29H12V35H7.5Z' },
      { d: 'M18 26H40.5V38H18A6 6 0 0 1 12 32A6 6 0 0 1 18 26Z' },
      { d: 'M42.5 26.6H45.5A5.4 5.4 0 0 1 50.9 32A5.4 5.4 0 0 1 45.5 37.4H42.5Z' },
      { d: 'M50.5 31H56V33H50.5Z' },
      { d: 'M18.5 29.4H33.5V34.6H18.5Z', k: 'c' },
    ] },
    { d: 'M47.6 6.8H52.4V21.2H47.6ZM42.8 11.6H57.2V16.4H42.8Z' },
  ],
};

function Parts({ list, mode }) {
  return list.map((p, i) => {
    if (p.parts) return <g key={i} transform={p.tf}><Parts list={p.parts} mode={mode} /></g>;
    const k = p.k || 'f';
    if (mode === 'sh') {
      if (k === 'c' || k === 'cs') return null;
      if (k === 's') return <path key={i} d={p.d} fill="none" stroke="#000" strokeWidth={p.w || 3} strokeLinecap="round" strokeLinejoin="round" />;
      return <path key={i} d={p.d} fill="#000" fillRule={p.rule} />;
    }
    if (k === 's') return <path key={i} d={p.d} fill="none" stroke={mode} strokeWidth={p.w || 3} strokeLinecap="round" strokeLinejoin="round" opacity={p.op} />;
    if (k === 'cs') return <path key={i} d={p.d} fill="none" stroke={CUT} strokeWidth={p.w || 2} strokeLinecap="round" strokeLinejoin="round" />;
    if (k === 'c') return <path key={i} d={p.d} fill={CUT} fillRule={p.rule} />;
    if (k === 'r') return <path key={i} d={p.d} fill="#FF4A3D" />;
    return <path key={i} d={p.d} fill={mode} fillRule={p.rule} opacity={p.op} />;
  });
}

export const hasMIcon = (k) => !!MI[k];

export function MIconG({ k, x, y, s, fill, shadow = true }) {
  const list = MI[k];
  if (!list) return null;
  return (
    <g transform={`translate(${x} ${y}) scale(${s / 64})`}>
      {shadow && <g transform="translate(0 1.6)" opacity="0.6"><Parts list={list} mode="sh" /></g>}
      <Parts list={list} mode={fill} />
    </g>
  );
}

export function MIcon({ k, size = 22, color = '#FFFFFF' }) {
  return <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}><MIconG k={k} x={0} y={0} s={64} fill={color} /></svg>;
}

const ISC = { knife: 1.3, grenade: 1.14, bottle: 1.14, jump: 1.2, crouch: 1.2, slide: 1.16, bandage: 1.14, syringe: 1.1, shop: 1.06, c4: 1.04, mag: 1.04 };
const RING_TONE = { green: '#7CF0A6', gold: '#FFC83A', red: '#FF6B5E' };
const TICKS = Array.from({ length: 8 }, (_, i) => {
  const a = (-90 + i * 45) * Math.PI / 180, h = 7 * Math.PI / 180, r = 44.8;
  return `M${(50 + r * Math.cos(a - h)).toFixed(2)} ${(50 + r * Math.sin(a - h)).toFixed(2)}A${r} ${r} 0 0 1 ${(50 + r * Math.cos(a + h)).toFixed(2)} ${(50 + r * Math.sin(a + h)).toFixed(2)}`;
}).join('');
let faceN = 0;

function useGradId() {
  const idRef = useRef(null);
  if (!idRef.current) idRef.current = `mf${(faceN += 1)}`;
  return idRef.current;
}

function RingDefs({ id }) {
  return (
    <defs>
      <linearGradient id={`${id}r`} x1="0.15" y1="0" x2="0.55" y2="1">
        <stop offset="0" stopColor="#FFFFFF" />
        <stop offset="0.3" stopColor="#AEB5BE" />
        <stop offset="0.52" stopColor="#F2F4F6" />
        <stop offset="0.78" stopColor="#737A84" />
        <stop offset="1" stopColor="#D3D8DD" />
      </linearGradient>
      <linearGradient id={`${id}i`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFFFFF" />
        <stop offset="1" stopColor="#E3E7EC" />
      </linearGradient>
    </defs>
  );
}

function RingShape({ id, square, active, pressed, color, ring, accent, ticks = true, bare = false }) {
  const shape = (r) => (square ? <rect x={50 - r} y={50 - r} width={r * 2} height={r * 2} rx={r * 0.34} /> : <circle cx="50" cy="50" r={r} />);
  const sh = (r, props) => React.cloneElement(shape(r), props);
  const arcL = 2 * Math.PI * 44.8;
  const rim = active ? accent : color || `url(#${id}r)`;
  if (bare) return <>{(pressed || active) && <rect x="3" y="3" width="94" height="94" rx="6" fill={pressed ? 'rgba(255,255,255,0.2)' : 'rgba(255,200,58,0.22)'} />}</>;
  return (
    <>
      {sh(44.8, { fill: pressed ? 'rgba(255,255,255,0.2)' : 'rgba(8,10,14,0.18)' })}
      {sh(44.8, { fill: 'none', stroke: 'rgba(0,0,0,0.45)', strokeWidth: 8.8 })}
      {sh(44.8, { fill: 'none', stroke: rim, strokeWidth: 6.2 })}
      {ticks && !square && <path d={TICKS} fill="none" stroke={active ? '#FFF6D8' : '#FFFFFF'} strokeWidth="3" opacity="0.95" />}
      {ring != null && ring > 0 && ring < 1 && <circle cx="50" cy="50" r="44.8" fill="none" stroke={accent} strokeWidth="6.2" strokeDasharray={`${arcL * ring} ${arcL}`} transform="rotate(-90 50 50)" />}
    </>
  );
}

export const MetalFace = memo(function MetalFace({ size, k, big = false, active = false, pressed = false, ring = null, disabled = false, tone = null, sub = null, accent = '#FFC83A', square = false, bare = false }) {
  const id = useGradId();
  const is = (big ? 54 : sub ? 50 : square || bare ? 62 : 58) * (ISC[k] || 1);
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none', opacity: disabled ? 0.42 : 1, transform: pressed && !bare ? 'scale(0.93)' : 'none', transition: 'transform 0.06s ease-out', filter: active && !bare ? `drop-shadow(0 0 ${Math.max(3, size * 0.07)}px ${accent})` : 'none' }}>
      <RingDefs id={id} />
      <RingShape id={id} square={square} active={active} pressed={pressed} color={RING_TONE[tone] || null} ring={ring} accent={accent} bare={bare} />
      <MIconG k={k} x={50 - is / 2} y={50 - is / 2 - (sub ? 7 : 0)} s={is} fill={`url(#${id}i)`} />
    </svg>
  );
});

export const MetalRing = memo(function MetalRing({ size, active = false, pressed = false, accent = '#FFC83A', color = null }) {
  const id = useGradId();
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none', transform: pressed ? 'scale(0.93)' : 'none', transition: 'transform 0.06s ease-out' }}>
      <RingDefs id={id} />
      <RingShape id={id} active={active} pressed={pressed} color={color} accent={accent} ticks={false} />
    </svg>
  );
});

export const BoxFrame = memo(function BoxFrame({ w, h, split = 0 }) {
  const id = useGradId();
  const vw = 100, vh = (100 * h) / w;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${vw} ${vh}`} aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }}>
      <RingDefs id={id} />
      <rect x="3.1" y="3.1" width={vw - 6.2} height={vh - 6.2} rx="15" fill="rgba(8,10,14,0.18)" />
      <rect x="3.1" y="3.1" width={vw - 6.2} height={vh - 6.2} rx="15" fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth="8.8" />
      <rect x="3.1" y="3.1" width={vw - 6.2} height={vh - 6.2} rx="15" fill="none" stroke={`url(#${id}r)`} strokeWidth="6.2" />
      {split > 0 && <path d={`M12 ${vh * split}H${vw - 12}`} stroke="rgba(0,0,0,0.5)" strokeWidth="5" strokeLinecap="round" />}
      {split > 0 && <path d={`M12 ${vh * split}H${vw - 12}`} stroke="#D3D8DD" strokeWidth="2.6" strokeLinecap="round" />}
    </svg>
  );
});
