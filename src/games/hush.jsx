import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, Portal, useBackClose, FONT, ConfirmSheet, rtKeep, rtDrop } from '../App.jsx';
import { useJoystick, GJoy, TOUCHY, weakPhone, injectKitCss, useGameStage, stagePoint, GSkin, GSettings, GSetHead, GSetRow, GSeg, GSetSlider, GLobbySheet, GScroll } from './gamekit.jsx';
import { Ico, CBtn, TopBtn, tapProps } from './zhud.jsx';
import { MetalRing } from './zbtn.jsx';
import { CFONT } from './zlobby.jsx';
import { parseModel, parseAnims } from './zmodel.js';
import { resFetch, resBlob, resBuf, resKnown } from './zres.js';
import { HA, HUSH_SND, HUSH_MUS } from './hushaudio.js';
import { useRoomLink } from './relay.jsx';
import { supabase } from '../supabaseClient.js';
import { SCHAR } from './zsurv.js';
import { useTalking } from './talk.js';

const CREAM = '#EFE8D2';
const MUTED = 'rgba(239,232,210,0.62)';
const PANEL = 'rgba(12,12,13,0.8)';
const LINE = 'rgba(239,232,210,0.15)';
const BLOOD = '#C8352B';
const EXITG = '#5FD98A';
const KEYC = '#E8C77A';
const cut = (n) => `polygon(0 0, calc(100% - ${n}px) 0, 100% ${n}px, 100% 100%, ${n}px 100%, 0 calc(100% - ${n}px))`;
const slantBtn = (n) => `polygon(${n}px 0, 100% 0, calc(100% - ${n}px) 100%, 0 100%)`;
const GEO = 'hush/geo-v2.bin';
const TEXS = ['hush/alb1-v3.webp', 'hush/mat1-v3.webp', 'hush/alb2-v2.webp', 'hush/mat2-v2.webp'];
const MON = ['hush/mon-v2.bin', 'hush/mon-v2_d.webp', 'hush/mon-v2_n.webp', 'dead/zanim.bin', 'dead/zanim2.bin'];
const GAME_MUS = ['explore', 'hunt', 'chase', 'dead'].map((k) => HUSH_MUS[k]);
const KEYI = '/hush/key-v1.webp';
const ART = '/hush/art-v2.webp';
const PREF = { gfx: 'zchat-hush-gfx', sens: 'zchat-hush-sens', seen: 'zchat-hush-seen', best: 'zchat-hush-best', runs: 'zchat-hush-runs' };
const getPref = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch { return d; } };
const setPref = (k, v) => { try { localStorage.setItem(k, String(v)); } catch {} };
const QUICK = ['Over here', 'Quiet', 'Run', 'Help me', 'Key here', 'Follow me'];
const RULES = [
  ['It is blind', 'It hunts by sound. Running, doors, keys and talking all make noise. When it hears you, it screams and comes for you.'],
  ['Stay quiet', 'Walk or crouch to stay quiet. Running is fast but loud.'],
  ['Find 3 keys', 'Each key opens one of the 3 locks on the exit. Then get out.'],
  ['Hide', 'Get under beds and tables. Hold your breath when it gets close.'],
  ['Use what you find', 'Drop a radio to lure it away. A knife saves you once. Batteries keep your light on.'],
  ['If it catches you, you die', 'With friends, you watch your team until the round ends. Stay together and warn each other.'],
];
const DESK_KEYS = [['W A S D', 'Move'], ['Mouse', 'Look'], ['Shift', 'Run'], ['C', 'Crouch'], ['F', 'Light'], ['E', 'Use'], ['Space', 'Hold breath'], ['Q', 'Drop radio'], ['M', 'Map'], ['Esc', 'Pause']];
const MB = 1048576;
const mb = (n) => (n / MB).toFixed(n >= 10 * MB ? 0 : 1);

let cssDone = false;
function injectHushCss() {
  if (cssDone || typeof document === 'undefined') return;
  cssDone = true;
  const el = document.createElement('style');
  el.textContent = `
.hz-b{-webkit-tap-highlight-color:transparent;touch-action:manipulation;user-select:none;-webkit-user-select:none;border:none;cursor:pointer;outline:none;transition:transform .08s ease-out,filter .12s}
.hz-b:active{transform:scale(.97)}
.hz-b:focus-visible{box-shadow:0 0 0 2px #fff,0 0 0 4px ${BLOOD}}
.hz-in{animation:hz-in .35s ease both}
@keyframes hz-in{from{opacity:0}to{opacity:1}}
.hz-toast{animation:hz-toast 2.6s ease both}
@keyframes hz-toast{0%{opacity:0;transform:translateY(-4px)}10%{opacity:1;transform:none}85%{opacity:1}100%{opacity:0}}
.hz-dead{animation:hz-dead 1.4s ease both}
@keyframes hz-dead{0%{opacity:0;letter-spacing:.3em}100%{opacity:1;letter-spacing:.04em}}
@media (prefers-reduced-motion:reduce){.hz-in,.hz-toast,.hz-dead{animation:none!important}}
`;
  document.head.appendChild(el);
}

async function loadImg(path) {
  const b = await resBlob(`/${path}`);
  return createImageBitmap(b, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
}

const survFiles = (k) => [`dead/s${k}.bin`, `dead/s${k}_d.webp`, `dead/s${k}_n.webp`];
function survKeyOf(sv) { const c = SCHAR[Math.abs(sv | 0) % SCHAR.length]; return c ? c.k : 'ch06'; }

function useSpeed(got, on) {
  const r = useRef({ pts: [], v: 0 });
  const now = typeof performance !== 'undefined' ? performance.now() : 0;
  const S = r.current;
  if (!on) { S.pts = []; S.v = 0; return 0; }
  const last = S.pts[S.pts.length - 1];
  if (!last || last[1] !== got) S.pts.push([now, got]);
  while (S.pts.length > 2 && now - S.pts[0][0] > 3000) S.pts.shift();
  if (S.pts.length > 1) { const a = S.pts[0], b = S.pts[S.pts.length - 1]; if (b[0] - a[0] > 400) S.v = ((b[1] - a[1]) / (b[0] - a[0])) * 1000; }
  return S.v;
}

function drawMap(cv, d) {
  const dpr = Math.min(2.5, window.devicePixelRatio || 1);
  const cw = cv.clientWidth, ch = cv.clientHeight;
  if (!cw || !ch) return;
  if (cv.width !== Math.round(cw * dpr) || cv.height !== Math.round(ch * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); }
  const ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cw, ch);
  const pad = 10;
  const cs = Math.min((cw - pad * 2) / d.W, (ch - pad * 2) / d.H);
  const ox = (cw - cs * d.W) / 2, oy = (ch - cs * d.H) / 2;
  const X = (x) => ox + (x / 2) * cs, Y = (z) => oy + (z / 2) * cs;
  const seen = (x, y) => x >= 0 && y >= 0 && x < d.W && y < d.H && d.seen[y * d.W + x];
  for (let y = 0; y < d.H; y++) for (let x = 0; x < d.W; x++) {
    if (!seen(x, y)) continue;
    ctx.fillStyle = d.reg[y * d.W + x] === 0 ? 'rgba(239,232,210,0.1)' : 'rgba(239,232,210,0.2)';
    ctx.fillRect(ox + x * cs - 0.25, oy + y * cs - 0.25, cs + 0.5, cs + 0.5);
  }
  const lw = Math.max(1.4, cs * 0.075);
  const seg = (x0, y0, x1, y1, col, w) => { ctx.strokeStyle = col; ctx.lineWidth = w || lw; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); };
  ctx.lineCap = 'round';
  const WALL = 'rgba(239,232,210,0.82)', EXIT = '#5FD98A';
  for (let y = 0; y <= d.H; y++) for (let x = 0; x < d.W; x++) {
    const e = d.hE[y * d.W + x];
    if (e === 0 || e === 5) continue;
    if (!seen(x, y - 1) && !seen(x, y) && e !== 4) continue;
    const yy = oy + y * cs, xa = ox + x * cs, xb = xa + cs;
    if (e === 2) { seg(xa, yy, xa + cs * 0.27, yy, WALL); seg(xb - cs * 0.27, yy, xb, yy, WALL); }
    else if (e === 4) seg(xa, yy, xb, yy, EXIT, lw * 2.2);
    else seg(xa, yy, xb, yy, WALL);
  }
  for (let y = 0; y < d.H; y++) for (let x = 0; x <= d.W; x++) {
    const e = d.vE[y * (d.W + 1) + x];
    if (e === 0 || e === 5) continue;
    if (!seen(x - 1, y) && !seen(x, y)) continue;
    const xx = ox + x * cs, ya = oy + y * cs, yb = ya + cs;
    if (e === 2) { seg(xx, ya, xx, ya + cs * 0.27, WALL); seg(xx, yb - cs * 0.27, xx, yb, WALL); }
    else seg(xx, ya, xx, yb, WALL);
  }
  for (const dr of d.doors) {
    const cx = Math.floor(dr.x / 2 - (dr.h ? 0 : 0.5)), cy = Math.floor(dr.z / 2 - (dr.h ? 0.5 : 0));
    const vis = dr.h ? seen(Math.floor(dr.x / 2), Math.round(dr.z / 2) - 1) || seen(Math.floor(dr.x / 2), Math.round(dr.z / 2)) : seen(Math.round(dr.x / 2) - 1, Math.floor(dr.z / 2)) || seen(Math.round(dr.x / 2), Math.floor(dr.z / 2));
    if (!vis || dr.open || cx < -1 || cy < -1) continue;
    const px = X(dr.x), py = Y(dr.z), hw = cs * 0.23;
    if (dr.h) seg(px - hw, py, px + hw, py, 'rgba(232,199,122,0.95)', lw * 1.3); else seg(px, py - hw, px, py + hw, 'rgba(232,199,122,0.95)', lw * 1.3);
  }
  if (d.exit) {
    const ex = X(d.exit.x), ey = Y(d.exit.z);
    ctx.fillStyle = EXIT;
    ctx.beginPath(); ctx.arc(ex, ey, Math.max(4, cs * 0.22), 0, Math.PI * 2); ctx.fill();
    ctx.font = `800 ${Math.max(11, Math.round(cs * 0.42))}px ${FONT}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('Exit', ex, ey - Math.max(5, cs * 0.28));
  }
  for (const q of d.team) {
    ctx.fillStyle = '#9DD9FF';
    ctx.beginPath(); ctx.arc(X(q.x), Y(q.z), Math.max(3.5, cs * 0.17), 0, Math.PI * 2); ctx.fill();
  }
  const px = X(d.me.x), py = Y(d.me.z), r = Math.max(7, cs * 0.34);
  const fx = Math.sin(d.me.yaw), fy = Math.cos(d.me.yaw);
  ctx.beginPath();
  ctx.moveTo(px + fx * r, py + fy * r);
  ctx.lineTo(px - fx * r * 0.6 + fy * r * 0.6, py - fy * r * 0.6 - fx * r * 0.6);
  ctx.lineTo(px - fx * r * 0.25, py - fy * r * 0.25);
  ctx.lineTo(px - fx * r * 0.6 - fy * r * 0.6, py - fy * r * 0.6 + fx * r * 0.6);
  ctx.closePath();
  ctx.fillStyle = '#E0584A'; ctx.fill();
  ctx.lineWidth = 1.5; ctx.strokeStyle = '#FFFFFF'; ctx.stroke();
}

function HushMap({ GS, getData, onClose }) {
  const ref = useRef(null);
  const [info, setInfo] = useState(null);
  useEffect(() => {
    let dead = false;
    const draw = () => { if (dead) return; const d = getData(); if (!d || !ref.current) return; drawMap(ref.current, d); setInfo((o) => (o && o.keys === d.keys && o.locks === d.locks && o.open === d.open ? o : { keys: d.keys, locks: d.locks, open: d.open })); };
    draw();
    const iv = setInterval(draw, 200);
    return () => { dead = true; clearInterval(iv); };
  }, []);
  const { top, right, bottom, left } = GS.at;
  return (
    <div className="hz-in" onPointerDown={(e) => e.stopPropagation()} style={{ position: 'absolute', inset: 0, zIndex: 30, background: '#060607', pointerEvents: 'auto' }}>
      <div style={{ position: 'absolute', top: top(10), left: left(18), right: right(14), display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontFamily: CFONT, fontSize: 26, fontWeight: 800, color: CREAM, lineHeight: 1 }}>Map</span>
        {info && <Tag text={info.open ? 'The exit is open' : `${info.keys} of 3 keys`} color={info.open ? EXITG : KEYC} />}
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: MUTED }}>Only places you have seen</span>
        <TopBtn icon="close" label="Close the map" size={40} onTap={onClose} />
      </div>
      <canvas ref={ref} aria-label="Map of the hospital" style={{ position: 'absolute', left: left(18), right: right(18), top: `calc(${top(0)} + 62px)`, bottom: bottom(14), width: `calc(100% - ${left(18)} - ${right(18)})`, height: `calc(100% - ${top(0)} - 62px - ${bottom(14)})`, display: 'block' }} />
    </div>
  );
}

function VentView() {
  return (
    <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      <defs>
        <filter id="hz-vsoft" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="0.45 0.7" /></filter>
        <mask id="hz-vent" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
          <rect width="100" height="100" fill="white" />
          <g filter="url(#hz-vsoft)">{[0, 1, 2, 3, 4].map((i) => <rect key={i} x="24" y={31 + i * 8} width="52" height="4.6" rx="1.4" fill="black" />)}</g>
        </mask>
        <linearGradient id="hz-vmetal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#141518" /><stop offset="0.5" stopColor="#0B0C0E" /><stop offset="1" stopColor="#060607" /></linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#hz-vmetal)" mask="url(#hz-vent)" />
      {[0, 1, 2, 3, 4].map((i) => <rect key={i} x="24.5" y={35.4 + i * 8} width="51" height="0.5" fill="rgba(150,150,158,0.16)" />)}
    </svg>
  );
}

function HushBoot({ GS, boot, onRetry, onClose }) {
  const { top, right, bottom, left } = GS.at;
  const down = boot.st === 'down';
  const err = boot.st === 'err';
  const speed = useSpeed(boot.got, down);
  const f = down ? (boot.tot ? boot.got / boot.tot : 0) : boot.st === 'load' ? boot.pct : 0;
  const msg = err ? (boot.why === 'net' ? 'Download stopped. Check your internet and try again.' : 'The game files could not load. Try again.') : down ? 'Downloading game files' : boot.st === 'load' ? 'Opening the hospital' : 'Checking game files';
  const side = down ? `${mb(boot.got)} of ${mb(boot.tot)} MB` : boot.st === 'load' ? `${Math.round(boot.pct * 100)}%` : '';
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 40, background: '#070708', overflow: 'hidden', fontFamily: FONT, color: CREAM, pointerEvents: 'auto' }}>
      <img src={ART} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 40%', display: 'block' }} />
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(7,7,8,0.55) 0%, rgba(7,7,8,0) 26%, rgba(7,7,8,0) 44%, rgba(7,7,8,0.88) 76%, #070708 100%)' }} />
      <div style={{ position: 'absolute', top: top(10), left: left(14) }}>
        <TopBtn icon="close" label="Leave" size={42} onTap={onClose} />
      </div>
      <div style={{ position: 'absolute', left: left(22), right: right(22), bottom: bottom(16), display: 'flex', flexDirection: 'column', gap: 9 }}>
        <div style={{ fontFamily: CFONT, fontSize: 40, fontWeight: 800, color: CREAM, lineHeight: 1, letterSpacing: '0.02em', textShadow: '0 2px 0 rgba(0,0,0,0.5)' }}>Hush</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }} role="status" aria-live="polite">
          <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 800 }}>{msg}</span>
          {side && !err && <span style={{ fontSize: 13, fontWeight: 800, color: MUTED, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{side}</span>}
        </div>
        {err ? (
          <div style={{ display: 'flex' }}>
            <button type="button" className="hz-b" onClick={onRetry} style={{ height: 38, padding: '0 22px', clipPath: slantBtn(10), background: `linear-gradient(180deg, #D8473B, ${BLOOD} 55%, #8E1F18)`, color: '#FFF', fontFamily: CFONT, fontSize: 16, fontWeight: 800 }}>Try again</button>
          </div>
        ) : (
          <>
            <div role="progressbar" aria-label={msg} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(f * 100)} style={{ position: 'relative', height: 8, borderRadius: 4, background: 'rgba(239,232,210,0.13)', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.max(1.5, Math.min(100, f * 100))}%`, borderRadius: 4, background: 'linear-gradient(90deg, #5A120D 0%, #A82A22 55%, #E0584A 100%)', boxShadow: '0 0 14px rgba(224,88,74,0.45)', transition: 'width 0.25s ease' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, minHeight: 16, fontSize: 12, fontWeight: 700, color: 'rgba(239,232,210,0.6)' }}>
              <span style={{ flex: 1, minWidth: 0 }}>{down ? 'Saved on your phone, so this only happens once' : ''}</span>
              {down && speed > 0 && <span style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{`${(speed / MB).toFixed(1)} MB/s`}</span>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function BigBtn({ text, sub, onPress, w, h = 58, disabled, icon = true }) {
  return (
    <button type="button" className="hz-b" disabled={disabled} onClick={onPress} onPointerDown={(e) => e.stopPropagation()} aria-label={text}
      style={{ width: w, height: h, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, clipPath: slantBtn(14), background: disabled ? 'linear-gradient(180deg, #5B3B37, #3F2825)' : 'linear-gradient(180deg, #E0483B 0%, #B92E24 55%, #84190F 100%)', color: '#FFFFFF', opacity: disabled ? 0.7 : 1 }}>
      {icon && !disabled && <svg width="19" height="21" viewBox="0 0 20 22" aria-hidden="true"><path d="M3 2.2v17.6c0 .9 1 1.4 1.7.9l13.3-8.8c.6-.4.6-1.4 0-1.8L4.7 1.3C4 .8 3 1.3 3 2.2z" fill="currentColor" /></svg>}
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1 }}>
        <span style={{ fontFamily: CFONT, fontSize: sub ? 24 : 27, fontWeight: 800, letterSpacing: '0.01em', textShadow: '0 2px 0 rgba(0,0,0,0.35)' }}>{text}</span>
        {sub && <span style={{ fontSize: 11.5, fontWeight: 800, color: 'rgba(255,255,255,0.82)', marginTop: 3 }}>{sub}</span>}
      </span>
    </button>
  );
}

function DarkBtn({ text, sub, onPress, w, h = 46, icon, active }) {
  return (
    <button type="button" className="hz-b" onClick={onPress} onPointerDown={(e) => e.stopPropagation()} aria-label={text}
      style={{ width: w, height: h, display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px 0 18px', clipPath: slantBtn(10), background: active ? 'rgba(200,53,43,0.32)' : PANEL, boxShadow: `inset 0 0 0 1px ${active ? 'rgba(224,88,74,0.7)' : LINE}`, color: CREAM, textAlign: 'left' }}>
      {icon && <Ico k={icon} size={20} color={CREAM} />}
      <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0, lineHeight: 1.05 }}>
        <span style={{ fontFamily: CFONT, fontSize: 17, fontWeight: 800, whiteSpace: 'nowrap' }}>{text}</span>
        {sub && <span style={{ fontSize: 11, fontWeight: 700, color: MUTED, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</span>}
      </span>
    </button>
  );
}

function Tag({ text, color = CREAM, style }) {
  return <span style={{ display: 'inline-block', padding: '3px 9px', background: 'rgba(10,11,13,0.72)', boxShadow: `inset 0 0 0 1px ${LINE}`, borderRadius: 6, fontFamily: CFONT, fontSize: 12.5, fontWeight: 800, color, whiteSpace: 'nowrap', textShadow: '0 1px 2px rgba(0,0,0,0.8)', ...style }}>{text}</span>;
}

function RingBtn({ size, text, sub, label, on, disabled, onDown, onUp, onTap, style }) {
  const [down, setDown] = useState(false);
  const idRef = useRef(null);
  const upRef = useRef(onUp);
  upRef.current = onUp;
  useEffect(() => () => { if (idRef.current != null && upRef.current) upRef.current(); }, []);
  const press = (e) => {
    if (disabled) return;
    e.stopPropagation(); e.preventDefault();
    idRef.current = e.pointerId;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    setDown(true);
    if (onDown) onDown();
    if (onTap) onTap();
  };
  const rel = (e) => { if (idRef.current !== e.pointerId) return; idRef.current = null; setDown(false); if (onUp) onUp(); };
  return (
    <div role="button" aria-label={label} aria-pressed={on || undefined} aria-disabled={disabled || undefined} onPointerDown={press} onPointerUp={rel} onPointerCancel={rel} onLostPointerCapture={rel} onContextMenu={(e) => e.preventDefault()}
      style={{ position: 'absolute', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'none', pointerEvents: 'auto', cursor: 'pointer', opacity: disabled ? 0.42 : 1, ...style }}>
      <MetalRing size={size} pressed={down} color={on ? '#7CF0A6' : null} active={!!on} />
      <span style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
        <span style={{ fontFamily: CFONT, fontSize: Math.round(size * (text.length > 3 ? 0.2 : 0.34)), fontWeight: 800, fontStyle: 'italic', color: '#FFFFFF', textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}>{text}</span>
        {sub && <span style={{ fontFamily: CFONT, fontSize: Math.round(size * 0.17), fontWeight: 800, color: 'rgba(255,255,255,0.86)', marginTop: 1 }}>{sub}</span>}
      </span>
    </div>
  );
}

function useHushMatch(myId, on) {
  const ch = useRef(null);
  const [ready, setReady] = useState(false);
  const mine = useRef(null);
  useEffect(() => {
    if (!on || !myId) return undefined;
    setReady(false);
    const keep = rtKeep(() => {
      const c = supabase.channel('hush-mm', { config: { presence: { key: myId } } });
      ch.current = c;
      return c.on('presence', { event: 'sync' }, () => setReady(true));
    }, { topic: 'hush-mm', onStatus: (s, err, c) => { if (s === 'SUBSCRIBED') { setReady(true); if (mine.current) { try { c.track(mine.current); } catch {} } } } });
    return () => { ch.current = null; rtDrop(keep); };
  }, [on, myId]);
  const list = () => {
    const c = ch.current;
    if (!c) return [];
    try {
      const s = c.presenceState() || {};
      const out = [];
      for (const [k, arr] of Object.entries(s)) for (const v of arr || []) if (v && v.r && k !== myId) out.push({ ...v, by: k });
      return out;
    } catch { return []; }
  };
  const advertise = (info) => { mine.current = info; const c = ch.current; if (c) { try { if (info) c.track(info); else c.untrack(); } catch {} } };
  return { ready, list, advertise };
}

export function HushGamePage(props) {
  return <GSkin k="hush"><HushInner {...props} /></GSkin>;
}

function HushInner({ me, myId, join, friends = [], online = [], onInvite, onSearch, onClose }) {
  injectKitCss();
  injectHushCss();
  const GS = useGameStage({ side: true });
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const runRef = useRef(null);
  const myFirst = String((me && me.name) || 'You').split(' ')[0];
  const sv = useMemo(() => { try { const v = Number(localStorage.getItem('zchat-zombie-col')); return Number.isFinite(v) && v >= 100 ? v - 100 : Math.floor(Math.random() * SCHAR.length); } catch { return 0; } }, []);
  const [screen, setScreen] = useState(join ? 'room' : 'menu');
  const [room, setRoom] = useState(() => (join ? { r: join.r, pub: !!join.pub, host: join.from || null } : null));
  const [sheet, setSheet] = useState(null);
  const [gfx, setGfx] = useState(() => getPref(PREF.gfx, 'auto'));
  const [sens, setSens] = useState(() => Math.max(0.4, Math.min(2.2, Number(getPref(PREF.sens, 1)) || 1)));
  const [boot, setBoot] = useState(null);
  const [hud, setHud] = useState(null);
  const [end, setEnd] = useState(null);
  const [paused, setPaused] = useState(false);
  const [leaveAsk, setLeaveAsk] = useState(false);
  const [quick, setQuick] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [bubbles, setBubbles] = useState([]);
  const [names, setNames] = useState({});
  const [lobby, setLobby] = useState({ ids: [], ph: 'lobby', seed: 0, cd: 0 });
  const [crouchOn, setCrouchOn] = useState(false);
  const [lightOn, setLightOn] = useState(true);
  const [mm, setMm] = useState('');
  const [err, setErr] = useState('');
  const assets = useRef(null);
  const pending = useRef(null);
  const tier = gfx === 'auto' ? (weakPhone() ? 'fast' : 'mid') : gfx === 'best' ? 'best' : gfx === 'fast' ? 'fast' : 'mid';
  const inRoom = !!room;
  const pub = !!(room && room.pub);
  const relay = useRoomLink({ id: room ? `hush-${room.r}` : null, myId, enabled: inRoom, meta: { n: myFirst, a: me && me.avatar, sv }, fast: ['hp', 'hs'], audio: inRoom && !pub, cloud: 'hush' });
  const relayRef = useRef(relay);
  relayRef.current = relay;
  const peers = relay.peers || [];
  const present = useMemo(() => [myId, ...peers].filter(Boolean).sort(), [myId, peers.join(',')]);
  const leader = (relay.lead && present.includes(relay.lead) ? relay.lead : present[0]) || myId;
  const isLeader = !inRoom || leader === myId;
  const leaderRef = useRef(isLeader);
  leaderRef.current = isLeader;
  const match = useHushMatch(myId, pub);
  const screenRef = useRef(screen);
  screenRef.current = screen;
  const lobbyRef = useRef(lobby);
  lobbyRef.current = lobby;
  const namesRef = useRef(names);
  namesRef.current = names;

  useEffect(() => { HA.init(); HA.load(); }, []);
  useEffect(() => {
    if (screen === 'menu') HA.music({ menu: 0.85 }, 2.2);
    else if (screen === 'room') HA.music({ room: 0.8 }, 2.2);
    else if (screen === 'play' && end && end.k === 'won') HA.music({ menu: 0.6 }, 3);
    return undefined;
  }, [screen, end && end.k]);
  useEffect(() => () => { HA.music(null, 0.6); HA.stopAll(); if (runRef.current) { runRef.current.dispose(); runRef.current = null; } }, []);

  const ensureAssets = async (coop) => {
    if (assets.current && (!coop || assets.current.coop)) return assets.current;
    setBoot({ st: 'check', got: 0, tot: 0, pct: 0 });
    const files = [GEO, ...TEXS, ...MON, ...HUSH_SND, ...GAME_MUS];
    if (coop) files.push('dead/sanim.bin');
    try {
      await resFetch(files, (got, tot) => setBoot((b) => (b ? { ...b, st: tot > 0 && got < tot ? 'down' : 'load', got, tot } : b)));
      setBoot((b) => (b ? { ...b, st: 'load', pct: 0.1 } : b));
      const step = (k) => setBoot((b) => (b ? { ...b, st: 'load', pct: Math.max(b.pct || 0, k) } : b));
      const geo = await resBuf(`/${GEO}`);
      step(0.25);
      const [alb1, mat1, alb2, mat2] = await Promise.all(TEXS.map((p) => loadImg(p)));
      step(0.6);
      const [mb2, md, mn, ab, ab2] = await Promise.all([resBuf(`/${MON[0]}`), loadImg(MON[1]), loadImg(MON[2]).catch(() => null), resBuf(`/${MON[3]}`), resBuf(`/${MON[4]}`)]);
      step(0.85);
      const A = { geo, alb1, mat1, alb2, mat2, mon: { M: parseModel(mb2), img: md, nrm: mn }, monA: parseAnims(ab), monA2: parseAnims(ab2), coop: false, survs: new Map() };
      if (coop) { A.sanim = parseAnims(await resBuf('/dead/sanim.bin')); A.coop = true; }
      HA.load();
      assets.current = A;
      setBoot(null);
      return A;
    } catch (e) {
      setBoot({ st: 'err', why: typeof navigator !== 'undefined' && navigator.onLine === false ? 'net' : 'load', got: 0, tot: 0, pct: 0 });
      return null;
    }
  };
  const survLoad = (A, k) => {
    if (A.survs.has(k)) return A.survs.get(k);
    A.survs.set(k, null);
    (async () => {
      try {
        await resFetch(survFiles(k));
        const [b, img, nrm] = await Promise.all([resBuf(`/dead/s${k}.bin`), loadImg(`dead/s${k}_d.webp`), resKnown(`/dead/s${k}_n.webp`) ? loadImg(`dead/s${k}_n.webp`).catch(() => null) : null]);
        A.survs.set(k, { M: parseModel(b), img, nrm });
      } catch { A.survs.delete(k); }
    })();
    return null;
  };

  const startRun = async (o) => {
    pending.current = o;
    const A = await ensureAssets(!o.solo);
    if (!A || pending.current !== o) return;
    pending.current = null;
    setEnd(null); setHud(null); setPaused(false); setMapOpen(false); setCrouchOn(false); setLightOn(true); setErr('');
    setScreen('play');
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const cv = canvasRef.current;
    if (!cv) return;
    if (runRef.current) { runRef.current.dispose(); runRef.current = null; }
    try {
      const { createRun } = await import('./hushrun.js');
      const seenT = getPref(PREF.seen, '0') !== '1';
      runRef.current = await createRun(cv, {
        seed: o.seed, solo: o.solo, slot: o.slot || 0, tier, sens, tutorial: seenT,
        me: { id: o.solo ? 'me' : myId, n: myFirst, sv },
        others: o.others || [],
        assets: { ...A, surv: (k) => (A.coop ? survLoad(A, k) || A.survs.get(k) : null) },
        survKey: (q) => survKeyOf(q.sv),
        isHost: () => leaderRef.current,
        net: { send: (t, d) => relayRef.current.send(t, d) },
        onHud: (h) => setHud(h),
        onEnd: (r) => {
          setEnd(r);
          setPref(PREF.runs, (Number(getPref(PREF.runs, 0)) || 0) + 1);
          if (o.solo && r.k === 'won') { const best = Number(getPref(PREF.best, 0)) || 0; if (!best || r.t < best) setPref(PREF.best, r.t); }
        },
        onError: () => { setErr('Hush stopped. Try again.'); setScreen(inRoom ? 'room' : 'menu'); },
      });
      setPref(PREF.seen, '1');
      if (typeof window !== 'undefined' && window.__zfake) { window.__hushRun = runRef.current; window.__hushHA = HA; }
    } catch {
      setErr('Your phone could not start 3D graphics.');
      setScreen(inRoom ? 'room' : 'menu');
    }
  };
  const stopRun = () => { if (runRef.current) { runRef.current.dispose(); runRef.current = null; } HA.stopAll(); };

  useEffect(() => {
    if (!inRoom) return undefined;
    const offs = [
      relay.on('hm', (m) => { if (m.from) setNames((p) => (p[m.from] && p[m.from].n === m.n ? p : { ...p, [m.from]: { n: String(m.n || 'Player').slice(0, 20), a: m.a || null, sv: m.sv | 0 } })); }),
      relay.on('hl', (m) => { if (leaderRef.current) return; setLobby({ ids: Array.isArray(m.ids) ? m.ids.slice(0, 4) : [], ph: m.ph || 'lobby', seed: m.seed | 0, cd: m.cd | 0 }); }),
      relay.on('hgo', (m) => {
        if (leaderRef.current && m.from !== myId) return;
        const ids = Array.isArray(m.ids) ? m.ids : [];
        if (!ids.includes(myId)) return;
        const others = ids.filter((x) => x !== myId).map((x) => ({ id: x, slot: ids.indexOf(x), n: (namesRef.current[x] || {}).n || 'Friend', sv: (namesRef.current[x] || {}).sv | 0 }));
        startRun({ seed: m.seed | 0, solo: false, slot: ids.indexOf(myId), others });
      }),
      relay.on('hq', (m) => { const t = QUICK[m.i | 0]; if (!t) return; const n = (namesRef.current[m.from] || {}).n || 'Friend'; setBubbles((b) => [...b.slice(-3), { id: Math.random(), text: `${n}: ${t}` }]); }),
      relay.on('hend', () => { if (!leaderRef.current) { stopRun(); setEnd(null); setScreen('room'); } }),
    ];
    for (const t of ['hp', 'hs', 'he', 'hn', 'ha', 'bye']) offs.push(relay.on(t, (m) => { if (runRef.current) runRef.current.netIn(t, m); }));
    return () => offs.forEach((f) => f && f());
  }, [inRoom, relay.on]);

  useEffect(() => {
    if (!inRoom) return undefined;
    const hi = () => relayRef.current.send('hm', { n: myFirst, a: (me && me.avatar) || null, sv });
    hi();
    const iv = setInterval(hi, 6000);
    return () => clearInterval(iv);
  }, [inRoom, peers.length]);

  useEffect(() => {
    if (!inRoom || !isLeader) return undefined;
    const next = { ...lobbyRef.current, ids: present.slice(0, 4), ph: screenRef.current === 'play' ? 'play' : 'lobby' };
    setLobby(next);
    relay.send('hl', next);
    const iv = setInterval(() => relayRef.current.send('hl', { ...lobbyRef.current, ids: present.slice(0, 4), ph: screenRef.current === 'play' ? 'play' : 'lobby' }), 3000);
    return () => clearInterval(iv);
  }, [inRoom, isLeader, present.join(','), screen]);

  useEffect(() => {
    if (!runRef.current) return;
    const gone = Object.keys(runRef.current.G.players).filter((id) => id !== myId && !peers.includes(id));
    for (const id of gone) runRef.current.dropPeer(id);
  }, [peers.join(',')]);

  useEffect(() => {
    if (!pub || !isLeader || !match.ready) return undefined;
    match.advertise({ r: room.r, n: present.length, ph: screen === 'play' ? 'play' : 'lobby', at: Date.now() });
    return undefined;
  }, [pub, isLeader, match.ready, present.length, screen]);
  useEffect(() => { if (!pub) return undefined; return () => match.advertise(null); }, [pub]);

  useEffect(() => {
    if (!pub || !isLeader || screen !== 'room' || present.length < 2) { if (lobby.cd) setLobby((l) => ({ ...l, cd: 0 })); return undefined; }
    let left = 20;
    setLobby((l) => ({ ...l, cd: left }));
    const iv = setInterval(() => {
      left -= 1;
      setLobby((l) => ({ ...l, cd: left }));
      if (left <= 0) { clearInterval(iv); hostStart(); }
    }, 1000);
    return () => clearInterval(iv);
  }, [pub, isLeader, screen, present.length]);

  const hostStart = () => {
    if (!inRoom) return;
    const ids = present.slice(0, 4);
    const seed = 1 + Math.floor(Math.random() * 2e9);
    relay.send('hgo', { seed, ids });
    const others = ids.filter((x) => x !== myId).map((x) => ({ id: x, slot: ids.indexOf(x), n: (names[x] || {}).n || 'Friend', sv: (names[x] || {}).sv | 0 }));
    startRun({ seed, solo: false, slot: ids.indexOf(myId), others });
  };

  const playSolo = () => { setRoom(null); startRun({ seed: 1 + Math.floor(Math.random() * 2e9), solo: true }); };
  const newFriendRoom = () => {
    const r = `f${Math.random().toString(36).slice(2, 10)}`;
    setRoom({ r, pub: false, host: myId });
    setScreen('room');
    ensureAssets(true);
  };
  const quickMatch = () => {
    setMm('Looking for a room');
    setRoom({ r: 'wait', pub: true, wait: true });
    ensureAssets(true);
  };
  useEffect(() => { if (join) ensureAssets(true); }, []);
  useEffect(() => {
    if (!room || !room.wait || !match.ready) return undefined;
    const t = setTimeout(() => {
      const open = match.list().filter((v) => v.ph === 'lobby' && (v.n | 0) < 4 && Date.now() - (v.at || 0) < 120000).sort((a, b) => (b.n | 0) - (a.n | 0));
      const r = open.length ? open[0].r : `p${Math.random().toString(36).slice(2, 10)}`;
      setRoom({ r, pub: true });
      setScreen('room');
      setMm('');
    }, 1400);
    return () => clearTimeout(t);
  }, [room && room.wait, match.ready]);

  const leaveRoom = () => { relay.send('bye', {}); setRoom(null); setScreen('menu'); setLobby({ ids: [], ph: 'lobby', seed: 0, cd: 0 }); setMm(''); };
  const backToMenu = () => { stopRun(); setEnd(null); if (inRoom) { if (isLeader) relay.send('hend', {}); setScreen('room'); } else setScreen('menu'); };
  const leaveGame = () => { setLeaveAsk(false); setPaused(false); stopRun(); setEnd(null); if (inRoom) { relay.send('bye', {}); setRoom(null); } setScreen('menu'); };
  const cancelBoot = () => { pending.current = null; setBoot(null); if (screen === 'room' && !assets.current) leaveRoom(); };

  const back = () => {
    if (sheet) { setSheet(null); return; }
    if (mapOpen) { setMapOpen(false); return; }
    if (leaveAsk) { setLeaveAsk(false); return; }
    if (boot) { cancelBoot(); return; }
    if (screen === 'play' && !end) { if (paused) setLeaveAsk(true); else setPaused(true); return; }
    if (screen === 'play' && end) { backToMenu(); return; }
    if (screen === 'room') { leaveRoom(); return; }
    onClose();
  };
  useBackClose(true, back);

  useEffect(() => { if (runRef.current) runRef.current.pause(paused || (mapOpen && !inRoom)); }, [paused, mapOpen, inRoom]);
  useEffect(() => { if (screen !== 'play' || end) setMapOpen(false); }, [screen, end]);
  useEffect(() => {
    if (screen !== 'play' || end) return undefined;
    const vis = () => { if (document.hidden) setPaused(true); };
    document.addEventListener('visibilitychange', vis);
    return () => document.removeEventListener('visibilitychange', vis);
  }, [screen, end]);

  const look = useRef({ id: null, x: 0, y: 0 });
  const J = useJoystick(wrapRef, { radius: () => (GS.land ? 46 : 42), rot: () => GS.side, zone: (x, y, b) => x < b.width * 0.42 && y > b.height * 0.3, enabled: () => screen === 'play' && !paused && !end, noCapture: true });
  useEffect(() => {
    if (screen !== 'play') return undefined;
    let raf = 0;
    const tick = () => { raf = requestAnimationFrame(tick); const r = runRef.current; if (r) r.move(J.joy.current.x, J.joy.current.y); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [screen]);
  const lookDown = (e) => {
    if (screen !== 'play' || paused || end) return;
    const p = stagePoint(wrapRef.current, e, GS.side);
    if (e.pointerType === 'mouse') {
      if (wrapRef.current && document.pointerLockElement !== wrapRef.current) { try { const r = wrapRef.current.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch {} }
      return;
    }
    if (p.x < GS.W * 0.42 && p.y > GS.H * 0.3) { J.handlers.onPointerDown(e); return; }
    if (look.current.id != null) return;
    look.current = { id: e.pointerId, x: p.x, y: p.y };
  };
  const lookMove = (e) => {
    if (e.pointerType === 'mouse') return;
    if (J.joy.current.id === e.pointerId) { J.handlers.onPointerMove(e); return; }
    if (look.current.id !== e.pointerId) return;
    const p = stagePoint(wrapRef.current, e, GS.side);
    const dx = p.x - look.current.x, dy = p.y - look.current.y;
    look.current.x = p.x; look.current.y = p.y;
    if (runRef.current) runRef.current.look(dx * 1.15, dy * 1.15);
  };
  const lookUp = (e) => { if (J.joy.current.id === e.pointerId) J.handlers.onPointerUp(e); if (look.current.id === e.pointerId) look.current.id = null; };
  useEffect(() => {
    if (screen !== 'play') return undefined;
    const mm2 = (e) => { if (document.pointerLockElement && runRef.current && !paused) runRef.current.look(e.movementX, e.movementY); };
    const keys = new Set();
    const mv = () => { const r = runRef.current; if (!r) return; const x = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0); const y = (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) - (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0); if (x || y || J.joy.current.id == null) r.move(x, y); };
    const kd = (e) => {
      if (e.repeat) { if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault(); return; }
      const r = runRef.current;
      if (!r) return;
      keys.add(e.code);
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') r.run(true);
      else if (e.code === 'KeyC' || e.code === 'ControlLeft') setCrouchOn(r.crouch());
      else if (e.code === 'KeyF') setLightOn(r.light());
      else if (e.code === 'KeyE') r.use(true);
      else if (e.code === 'Space') { e.preventDefault(); r.breath(true); }
      else if (e.code === 'KeyQ' || e.code === 'KeyG') r.item();
      else if (e.code === 'KeyM') setMapOpen((v) => !v);
      mv();
    };
    const ku = (e) => {
      keys.delete(e.code);
      const r = runRef.current;
      if (!r) return;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') r.run(false);
      else if (e.code === 'KeyE') r.use(false);
      else if (e.code === 'Space') r.breath(false);
      mv();
    };
    window.addEventListener('mousemove', mm2);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    const rs = () => { if (runRef.current) runRef.current.resize(); };
    window.addEventListener('resize', rs);
    return () => { window.removeEventListener('mousemove', mm2); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); window.removeEventListener('resize', rs); try { if (document.pointerLockElement) document.exitPointerLock(); } catch {} };
  }, [screen, paused]);
  useEffect(() => { if (runRef.current) runRef.current.resize(); }, [GS.W, GS.H, GS.side]);
  useEffect(() => { if (!bubbles.length) return undefined; const t = setTimeout(() => setBubbles((b) => b.slice(1)), 3200); return () => clearTimeout(t); }, [bubbles]);

  const talking = useTalking(inRoom && !pub && screen === 'play');
  useEffect(() => { if (talking.includes(myId) && runRef.current) runRef.current.talk(); }, [talking]);
  useEffect(() => {
    if (!(inRoom && !pub && screen === 'play')) return undefined;
    const iv = setInterval(() => { if (talking.includes(myId) && runRef.current) runRef.current.talk(); }, 800);
    return () => clearInterval(iv);
  }, [inRoom, pub, screen, talking.includes(myId)]);
  const sendQuick = (i) => { setQuick(false); relay.send('hq', { i }); setBubbles((b) => [...b.slice(-3), { id: Math.random(), text: `You: ${QUICK[i]}` }]); };
  const r = runRef.current;
  const h = hud || {};
  const W = GS.W, H = GS.H;
  const small = H < 380;
  const best = Number(getPref(PREF.best, 0)) || 0;
  const fmtT = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const slotIds = inRoom ? (isLeader ? present.slice(0, 4) : (lobby.ids.length ? lobby.ids : present.slice(0, 4))) : [];
  const nameFor = (id) => (id === myId ? myFirst : (names[id] || {}).n || 'Player');
  const avaFor = (id) => (id === myId ? me && me.avatar : (names[id] || {}).a);
  const roomFull = present.length > 4 && !present.slice(0, 4).includes(myId);
  const { top, right, bottom, left } = GS.at;
  const colW = Math.min(300, Math.round(W * 0.34));
  const useS = small ? 78 : 88, bs = small ? 56 : 62, ss = small ? 50 : 56;
  const micOn = !!(relay.mic && relay.mic.on);

  return (
    <div ref={GS.rootRef} onPointerDownCapture={() => HA.init()} style={{ position: 'fixed', left: 0, right: 0, top: 'var(--zvp-top, 0px)', height: 'calc(var(--zvp-h, 100%) + var(--zgx, 0px))', zIndex: 90, background: '#070708', overflow: 'hidden', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none', fontFamily: FONT, color: CREAM }}>
      <div ref={wrapRef} style={GS.wrapStyle} onPointerDown={lookDown} onPointerMove={lookMove} onPointerUp={lookUp} onPointerCancel={lookUp} onContextMenu={(e) => e.preventDefault()}>
        {screen === 'play' && <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />}
        {screen === 'play' && !end && hud && hud.hidden === 'locker' && !hud.scare && <VentView />}

        {screen !== 'play' && (
          <div style={{ position: 'absolute', inset: 0 }}>
            <img src={ART} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '62% 45%' }} />
            <div style={{ position: 'absolute', inset: 0, background: screen === 'menu' ? 'linear-gradient(90deg, rgba(5,5,6,0.9) 0%, rgba(5,5,6,0.55) 34%, rgba(5,5,6,0.05) 62%, rgba(5,5,6,0.35) 100%)' : 'rgba(5,5,6,0.55)' }} />
          </div>
        )}

        {screen === 'menu' && (
          <div className="hz-in" style={{ position: 'absolute', inset: 0 }}>
            <div style={{ position: 'absolute', top: top(10), left: left(14), display: 'flex', alignItems: 'center', gap: 12 }}>
              <TopBtn icon="close" label="Leave Hush" size={40} onTap={onClose} />
            </div>
            <div style={{ position: 'absolute', top: top(10), right: right(14), display: 'flex', gap: 10 }}>
              <TopBtn icon="gear" label="Settings" size={40} onTap={() => setSheet('set')} />
            </div>
            <div style={{ position: 'absolute', left: left(26), top: `calc(${top(0)} + ${small ? 58 : 70}px)`, display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 360 }}>
              <div style={{ fontFamily: CFONT, fontSize: small ? 58 : 72, fontWeight: 800, color: CREAM, lineHeight: 0.92, letterSpacing: '0.02em', textShadow: '0 3px 0 rgba(0,0,0,0.5)' }}>Hush</div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: MUTED }}>It cannot see you. It can hear you.</div>
              {best > 0 && <div style={{ marginTop: 8 }}><Tag text={`Best escape ${fmtT(best)}`} color={KEYC} /></div>}
            </div>
            <div style={{ position: 'absolute', right: right(14), bottom: bottom(12), width: colW, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'stretch' }}>
              <DarkBtn text="Play with friends" sub="Up to 4 players, with voice" icon="invite" onPress={newFriendRoom} />
              <DarkBtn text="Quick match" sub={mm || 'Team up with players online'} icon="people" onPress={quickMatch} active={!!mm} />
              <DarkBtn text="How to play" icon="chat" onPress={() => setSheet('rules')} h={40} />
              <BigBtn text="Play" sub="Alone in the dark" onPress={playSolo} w="100%" />
            </div>
            {err && <div role="alert" style={{ position: 'absolute', left: left(26), bottom: bottom(16), maxWidth: 320 }}><Tag text={err} color="#FF9D92" /></div>}
          </div>
        )}

        {screen === 'room' && (
          <div className="hz-in" style={{ position: 'absolute', inset: 0 }}>
            <div style={{ position: 'absolute', top: top(10), left: left(14), right: right(14), display: 'flex', alignItems: 'center', gap: 12 }}>
              <TopBtn icon="left" label="Leave the room" size={40} onTap={leaveRoom} />
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                <span style={{ fontFamily: CFONT, fontSize: 26, fontWeight: 800, lineHeight: 1 }}>{pub ? 'Quick match' : 'Friend room'}</span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: MUTED, marginTop: 2 }}>
                  {roomFull ? 'This room is full' : lobby.ph === 'play' && !isLeader ? 'A round is on. You join the next one.' : pub ? (present.length < 2 ? 'Waiting for players to join' : lobby.cd ? `Starting in ${lobby.cd}` : 'Waiting for the room leader') : isLeader ? 'Invite friends, then start. Voice is on in friend rooms.' : `Waiting for ${nameFor(leader)} to start`}
                </span>
              </div>
              {!pub && <TopBtn icon={micOn ? 'mic' : 'micoff'} on={micOn} label={micOn ? 'Turn your mic off' : 'Turn your mic on'} size={40} onTap={() => relay.toggleMic && relay.toggleMic()} />}
              <TopBtn icon="gear" label="Settings" size={40} onTap={() => setSheet('set')} />
            </div>
            <div style={{ position: 'absolute', left: left(18), top: `calc(${top(0)} + 66px)`, right: !pub ? `calc(${right(14)} + ${colW + 14}px)` : right(18), display: 'flex', gap: 10, flexWrap: 'wrap', alignContent: 'flex-start' }}>
              {[0, 1, 2, 3].map((i) => {
                const id = slotIds[i];
                const talk = id && relay.mics && relay.mics[id];
                return (
                  <div key={i} style={{ width: small ? 92 : 104, height: small ? 108 : 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, clipPath: cut(10), background: id ? 'rgba(18,18,20,0.86)' : 'rgba(18,18,20,0.45)', boxShadow: `inset 0 0 0 1.5px ${id ? (talk ? EXITG : id === myId ? 'rgba(232,199,122,0.7)' : LINE) : 'rgba(239,232,210,0.08)'}` }}>
                    {id ? <Avatar emoji={avaFor(id)} name={nameFor(id)} size={small ? 48 : 54} /> : <svg width="34" height="40" viewBox="0 0 34 40" aria-hidden="true"><circle cx="17" cy="11" r="8" fill="rgba(239,232,210,0.16)" /><path d="M3 38c1.5-9 7-14 14-14s12.5 5 14 14z" fill="rgba(239,232,210,0.16)" /></svg>}
                    <span style={{ fontFamily: CFONT, fontSize: 14, fontWeight: 800, color: id ? CREAM : 'rgba(239,232,210,0.35)', maxWidth: 96, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{id ? (id === myId ? 'You' : nameFor(id)) : 'Open'}</span>
                  </div>
                );
              })}
            </div>
            {!pub && (
              <div style={{ position: 'absolute', right: right(14), top: `calc(${top(0)} + 66px)`, bottom: `calc(${bottom(12)} + 70px)`, width: colW, display: 'flex', flexDirection: 'column', background: PANEL, boxShadow: `inset 0 0 0 1px ${LINE}`, clipPath: cut(10) }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px 6px', borderLeft: `3px solid ${BLOOD}` }}>
                  <Ico k="invite" size={18} color={CREAM} />
                  <span style={{ fontFamily: CFONT, fontSize: 17, fontWeight: 800 }}>Invite</span>
                </div>
                <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: '4px 10px 10px' }}>
                  <InviteList friends={friends} online={online} onSearch={onSearch} onPick={(p) => { if (onInvite) onInvite([p], { r: room.r }); }} />
                </div>
              </div>
            )}
            <div style={{ position: 'absolute', left: left(18), bottom: bottom(14), display: 'flex', gap: 10 }}>
              <DarkBtn text="How to play" icon="chat" onPress={() => setSheet('rules')} h={42} />
            </div>
            <div style={{ position: 'absolute', right: right(14), bottom: bottom(12), width: colW }}>
              {isLeader && !roomFull ? <BigBtn text="Start" sub={present.length > 1 ? `${present.length} players` : 'Start alone or wait for friends'} onPress={hostStart} w="100%" /> : <div style={{ height: 58, display: 'flex', alignItems: 'center', justifyContent: 'center', clipPath: slantBtn(14), background: PANEL, boxShadow: `inset 0 0 0 1px ${LINE}`, fontFamily: CFONT, fontSize: 16, fontWeight: 800, color: MUTED }}>{lobby.cd ? `Starting in ${lobby.cd}` : `${nameFor(leader)} starts the round`}</div>}
            </div>
          </div>
        )}

        {screen === 'play' && !end && (
          <>
            {!h.scare && (
              <div style={{ position: 'absolute', left: left(14), top: top(10), display: 'flex', flexDirection: 'column', gap: 6, pointerEvents: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px 5px 8px', background: 'rgba(10,11,13,0.62)', boxShadow: `inset 0 0 0 1px ${LINE}`, clipPath: cut(6) }}>
                  {[0, 1, 2].map((i) => <img key={i} src={KEYI} alt="" width={small ? 24 : 28} height={small ? 24 : 28} draggable={false} style={{ opacity: i < (h.keys || 0) ? 1 : 0.25, filter: i < (h.keys || 0) ? 'drop-shadow(0 0 4px rgba(232,199,122,0.6))' : 'grayscale(1)' }} />)}
                  <span style={{ fontFamily: CFONT, fontSize: 15, fontWeight: 800, color: KEYC, marginLeft: 2 }}>{`${h.keys || 0}/3`}</span>
                </div>
                {h.locks > 0 && <Tag text={`${h.locks} of 3 locks open`} color={EXITG} />}
                {h.item && <Tag text={h.item === 'radio' ? 'Radio' : h.item === 'knife' ? 'Knife' : h.item} color={KEYC} />}
              </div>
            )}
            {!h.scare && !h.dead && !h.out && (
              <div style={{ position: 'absolute', left: '50%', bottom: bottom(10), transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'none' }} aria-label={`Light ${Math.round((h.bat == null ? 1 : h.bat) * 100)} percent`}>
                <span style={{ fontFamily: CFONT, fontSize: 13, fontWeight: 800, color: h.light === false ? MUTED : CREAM }}>Light</span>
                <div style={{ display: 'flex', gap: 3 }}>
                  {[0, 1, 2, 3, 4].map((i) => { const f = h.bat == null ? 1 : h.bat; const on = f > i / 5 + 0.02; return <div key={i} style={{ width: small ? 22 : 28, height: 6, borderRadius: 1, background: on ? (f < 0.15 ? BLOOD : 'rgba(239,232,210,0.9)') : 'rgba(239,232,210,0.18)' }} />; })}
                </div>
              </div>
            )}
            <div style={{ position: 'absolute', left: 0, right: 0, top: top(12), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, pointerEvents: 'none' }}>
              {!h.scare && (h.toasts || []).slice(-2).map((t) => (
                <div key={t.at} className="hz-toast" style={{ fontFamily: CFONT, fontSize: small ? 16 : 18, fontWeight: 800, color: t.k === 'bad' ? '#FF8B80' : t.k === 'key' ? KEYC : CREAM, textShadow: '0 1px 4px rgba(0,0,0,0.95)', padding: '0 12px', textAlign: 'center' }}>{t.text}</div>
              ))}
              {bubbles.map((b) => <div key={b.id} className="hz-toast" style={{ fontSize: 13, fontWeight: 800, color: '#BFD9FF', textShadow: '0 1px 4px rgba(0,0,0,0.95)' }}>{b.text}</div>)}
            </div>
            {!h.scare && (
              <div style={{ position: 'absolute', right: right(14), top: top(10), display: 'flex', gap: 8, alignItems: 'center' }}>
                {inRoom && pub && <TopBtn icon="chat" label="Quick lines" size={40} on={quick} onTap={() => setQuick((v) => !v)} />}
                {inRoom && !pub && <TopBtn icon={micOn ? 'mic' : 'micoff'} on={micOn} label={micOn ? 'Turn your mic off' : 'Turn your mic on'} size={40} onTap={() => relay.toggleMic && relay.toggleMic()} />}
                <TopBtn icon="map" label="Map" size={40} onTap={() => setMapOpen(true)} />
                <TopBtn icon="pause" label="Pause" size={40} onTap={() => setPaused(true)} />
              </div>
            )}
            {inRoom && h.team && h.team.length > 0 && !h.scare && (
              <div style={{ position: 'absolute', right: right(14), top: `calc(${top(10)} + 50px)`, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, pointerEvents: 'none' }}>
                {h.team.map((q) => <Tag key={q.id} text={`${q.n}${q.dead ? ' is dead' : q.out ? ' got out' : ''}`} color={q.dead ? '#FF8B80' : q.out ? EXITG : talking.includes(q.id) ? '#9DF0B8' : CREAM} />)}
              </div>
            )}
            {quick && (
              <div style={{ position: 'absolute', right: right(14), top: `calc(${top(10)} + 50px)`, display: 'flex', flexDirection: 'column', gap: 6, pointerEvents: 'auto', zIndex: 5 }}>
                {QUICK.map((q, i) => <button key={q} type="button" className="hz-b" {...tapProps(() => sendQuick(i))} style={{ height: 34, padding: '0 16px', clipPath: slantBtn(8), background: 'rgba(12,12,13,0.88)', boxShadow: `inset 0 0 0 1px ${LINE}`, color: CREAM, fontFamily: CFONT, fontWeight: 800, fontSize: 15, textAlign: 'right' }}>{q}</button>)}
              </div>
            )}
            {(h.dead || h.out) && !h.scare && (
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: bottom(small ? 30 : 40), display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
                <Tag text={h.spect ? `${h.out ? 'You got out. ' : 'You are dead. '}Watching ${h.spect}` : h.out ? 'You got out' : 'You are dead'} color={h.out ? EXITG : '#FF8B80'} style={{ fontSize: 15 }} />
              </div>
            )}
            {TOUCHY && !h.dead && !h.out && !h.scare && (
              <>
                <GJoy view={J.view} knobRef={J.knob} R={J.R} idle={{ x: W * 0.15, y: H * 0.72 }} alpha={0.85} />
                <CBtn big size={useS} icon="h_use" label={h.prompt || 'Use'} disabled={!h.can} ring={h.hold >= 0 && h.hold > 0 ? h.hold : null} onDown={() => r && r.use(true)} onUp={() => r && r.use(false)} style={{ right: right(24), bottom: bottom(small ? 30 : 36) }} />
                {h.prompt && <div style={{ position: 'absolute', right: `calc(${right(24)} - 30px)`, width: useS + 60, bottom: `calc(${bottom(small ? 30 : 36)} - 24px)`, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}><Tag text={h.prompt} color={h.can ? CREAM : MUTED} /></div>}
                <CBtn size={bs} icon="h_run" label="Run" onDown={() => r && r.run(true)} onUp={() => r && r.run(false)} style={{ right: `calc(${right(24)} + ${useS + 16}px)`, bottom: bottom(small ? 24 : 30) }} />
                <CBtn size={ss} icon="crouch" label={crouchOn ? 'Stand up' : 'Crouch'} active={crouchOn} onTap={() => { if (r) setCrouchOn(r.crouch()); }} style={{ right: `calc(${right(24)} + ${Math.round((useS - ss) / 2)}px)`, bottom: `calc(${bottom(small ? 30 : 36)} + ${useS + 22}px)` }} />
                <RingBtn size={ss} text={h.breath ? `${Math.max(0, Math.ceil((1 - (h.breathT || 0)) * 8))}` : 'Hold'} sub={h.breath ? null : 'breath'} label="Hold your breath" on={!!h.breath} disabled={!!h.breathCd && !h.breath} onDown={() => r && r.breath(true)} onUp={() => r && r.breath(false)} style={{ right: `calc(${right(24)} + ${useS + 16 + Math.round((bs - ss) / 2)}px)`, bottom: `calc(${bottom(small ? 24 : 30)} + ${bs + 14}px)` }} />
                <CBtn size={48} icon="h_torch" label={h.light ? 'Turn the light off' : 'Turn the light on'} active={!!h.light} onTap={() => { if (r) setLightOn(r.light()); }} style={{ right: right(16), top: `calc(${top(10)} + ${inRoom && h.team ? 52 + h.team.length * 26 : 52}px)` }} />
                {h.item === 'radio' && <RingBtn size={ss} text="Drop" sub="radio" label="Drop the radio" onTap={() => r && r.item()} style={{ right: `calc(${right(24)} + ${useS + 16 + bs + 14}px)`, bottom: bottom(small ? 26 : 32) }} />}
              </>
            )}
            {!TOUCHY && !h.dead && !h.out && !h.scare && h.prompt && (
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: `calc(${bottom(10)} + 30px)`, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
                <Tag text={h.can ? `E   ${h.prompt}` : h.prompt} color={h.can ? CREAM : MUTED} style={{ fontSize: 15 }} />
              </div>
            )}
            {h.hold >= 0 && !TOUCHY && <div style={{ position: 'absolute', left: '50%', top: '56%', width: 120, height: 4, marginLeft: -60, background: 'rgba(239,232,210,0.2)', borderRadius: 2 }}><div style={{ width: `${h.hold * 100}%`, height: '100%', background: EXITG, borderRadius: 2 }} /></div>}
          </>
        )}

        {screen === 'play' && end && (
          <div className="hz-in" style={{ position: 'absolute', inset: 0, background: end.k === 'won' ? 'rgba(4,8,6,0.62)' : 'rgba(10,2,2,0.66)', pointerEvents: 'auto' }}>
            <div style={{ position: 'absolute', left: left(30), top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 8, maxWidth: Math.round(W * 0.55) }}>
              <div className="hz-dead" style={{ fontFamily: CFONT, fontSize: small ? 54 : 70, fontWeight: 800, color: end.k === 'won' ? EXITG : '#D9443A', lineHeight: 0.95, textShadow: '0 3px 0 rgba(0,0,0,0.6)' }}>{end.k === 'won' ? (end.me === 'out' ? 'You got out' : 'Your team got out') : end.me === 'down' ? 'You died' : 'Your team died'}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Tag text={`${fmtT(end.t)} in the hospital`} />
                <Tag text={`${end.keys} of 3 keys`} color={KEYC} />
              </div>
              {inRoom && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{end.team.map((q) => <Tag key={q.id} text={`${q.id === myId ? 'You' : q.n} ${q.out ? 'got out' : 'died'}`} color={q.out ? EXITG : '#FF8B80'} />)}</div>}
            </div>
            <div style={{ position: 'absolute', right: right(14), bottom: bottom(12), width: colW, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <DarkBtn text={inRoom ? 'Back to the room' : 'Menu'} onPress={backToMenu} />
              {(!inRoom || isLeader) ? <BigBtn text="Play again" onPress={() => { if (inRoom) { relay.send('hend', {}); setTimeout(hostStart, 300); } else playSolo(); }} w="100%" /> : <Tag text={`${nameFor(leader)} can start a new round`} />}
            </div>
          </div>
        )}

        {mapOpen && screen === 'play' && !end && !paused && <HushMap GS={GS} getData={() => (runRef.current ? runRef.current.mapData() : null)} onClose={() => setMapOpen(false)} />}

        {paused && screen === 'play' && !end && (
          <div className="hz-in" style={{ position: 'absolute', inset: 0, background: 'rgba(4,4,5,0.8)', zIndex: 20, pointerEvents: 'auto' }}>
            <div style={{ position: 'absolute', left: left(30), top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontFamily: CFONT, fontSize: 44, fontWeight: 800, lineHeight: 1 }}>Paused</div>
              {inRoom && <div style={{ fontSize: 12.5, fontWeight: 700, color: MUTED }}>The game keeps going for your team</div>}
            </div>
            <div style={{ position: 'absolute', right: right(14), bottom: bottom(12), width: colW, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <DarkBtn text="How to play" icon="chat" onPress={() => setSheet('rules')} />
              <DarkBtn text="Settings" icon="gear" onPress={() => setSheet('set')} />
              <DarkBtn text="Leave" icon="close" onPress={() => setLeaveAsk(true)} />
              <BigBtn text="Resume" onPress={() => setPaused(false)} w="100%" />
            </div>
          </div>
        )}

        {sheet === 'rules' && (
          <GLobbySheet title="How to play" onClose={() => setSheet(null)} GS={GS} width={560}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 6 }}>
              {RULES.map(([t, d]) => <div key={t}><div style={{ fontFamily: CFONT, fontSize: 17, fontWeight: 800, color: CREAM }}>{t}</div><div style={{ fontSize: 13.5, fontWeight: 600, color: MUTED, lineHeight: 1.4 }}>{d}</div></div>)}
              {!TOUCHY && <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px', marginTop: 4 }}>{DESK_KEYS.map(([k, v]) => <React.Fragment key={k}><span style={{ fontSize: 12.5, fontWeight: 900, color: KEYC }}>{k}</span><span style={{ fontSize: 12.5, fontWeight: 700, color: MUTED }}>{v}</span></React.Fragment>)}</div>}
            </div>
          </GLobbySheet>
        )}
        {sheet === 'set' && (
          <GSettings onClose={() => { setSheet(null); HA.sync(); }} first="graphics" buttons={false} at={GS.at} keys={DESK_KEYS}
            tabs={[{ k: 'graphics', label: 'Graphics', body: (
              <>
                <GSetHead>Picture</GSetHead>
                <GSetRow label="Graphics quality" sub="Changes start with your next round"><GSeg value={gfx} items={[['auto', 'Auto'], ['best', 'Best'], ['mid', 'Balanced'], ['fast', 'Fast']]} onPick={(v) => { setGfx(v); setPref(PREF.gfx, v); }} label="Graphics quality" /></GSetRow>
              </>
            ) }]}
            controlsExtra={(
              <>
                <GSetHead>Sensitivity</GSetHead>
                <GSetRow label="Camera sensitivity"><GSetSlider value={sens} min={0.4} max={2.2} step={0.05} label="Camera sensitivity" fmt={(x) => x.toFixed(2)} onChange={(x) => { setSens(x); setPref(PREF.sens, x); if (runRef.current && runRef.current.setSens) runRef.current.setSens(x); }} /></GSetRow>
              </>
            )} />
        )}
        {boot && <HushBoot GS={GS} boot={boot} onRetry={() => { const o = pending.current; setBoot(null); if (o) startRun(o); else ensureAssets(inRoom); }} onClose={cancelBoot} />}
      </div>
      {leaveAsk && <Portal><ConfirmSheet title="Leave Hush?" text={inRoom ? 'Your team keeps going without you.' : 'Your round ends.'} confirmLabel="Leave" zIndex={120} onConfirm={leaveGame} onCancel={() => setLeaveAsk(false)} /></Portal>}
    </div>
  );
}

function InviteList({ friends, online, onSearch, onPick }) {
  const [q, setQ] = useState('');
  const [found, setFound] = useState(null);
  const [sent, setSent] = useState({});
  const on = new Set(online || []);
  useEffect(() => {
    if (!q.trim() || !onSearch) { setFound(null); return undefined; }
    let dead = false;
    const t = setTimeout(async () => { try { const r = await onSearch(q.trim()); if (!dead) setFound(r || []); } catch { if (!dead) setFound([]); } }, 350);
    return () => { dead = true; clearTimeout(t); };
  }, [q]);
  const list = found || [...(friends || [])].sort((a, b) => (on.has(b.id) ? 1 : 0) - (on.has(a.id) ? 1 : 0)).slice(0, 30);
  return (
    <>
      {onSearch && <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by username" aria-label="Search by username" onPointerDown={(e) => e.stopPropagation()} style={{ height: 38, flexShrink: 0, borderRadius: 6, border: `1px solid ${LINE}`, background: 'rgba(239,232,210,0.06)', color: CREAM, padding: '0 10px', fontSize: 16, fontFamily: FONT, outline: 'none', marginBottom: 6, touchAction: 'manipulation' }} />}
      <GScroll style={{ flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {list.length === 0 && <div style={{ fontSize: 13, color: MUTED, fontWeight: 600, padding: '6px 2px' }}>{found ? 'No one found' : 'Your friends show up here'}</div>}
          {list.map((p) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <Avatar emoji={p.avatar} name={p.name} size={34} online={on.has(p.id)} />
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 14, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name || 'Friend'}</span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: on.has(p.id) ? EXITG : MUTED }}>{on.has(p.id) ? 'Online' : 'Offline'}</span>
              </div>
              <button type="button" className="hz-b" disabled={!!sent[p.id]} onClick={() => { setSent((s) => ({ ...s, [p.id]: 1 })); onPick(p); }} aria-label={sent[p.id] ? `Invited ${p.name || 'friend'}` : `Invite ${p.name || 'friend'}`}
                style={{ height: 32, minWidth: 32, padding: sent[p.id] ? '0 10px' : 0, clipPath: cut(5), background: sent[p.id] ? 'rgba(239,232,210,0.1)' : BLOOD, color: sent[p.id] ? MUTED : '#FFF', fontFamily: CFONT, fontWeight: 800, fontSize: sent[p.id] ? 13 : 20 }}>{sent[p.id] ? 'Invited' : '+'}</button>
            </div>
          ))}
        </div>
      </GScroll>
    </>
  );
}

export default HushGamePage;
