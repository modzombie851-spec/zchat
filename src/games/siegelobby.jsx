import React, { useEffect, useState } from 'react';
import { Avatar, FONT, Spinner } from '../App.jsx';
import { kitTap, pressProps, GIcon } from './gamekit.jsx';
import * as E from './siegeengine.js';
import * as T from './siegeteam.js';
import { SkIcon, heroIc, LineIcon } from './siegeteamui.jsx';

export const HF = "'Barlow Condensed', 'Arial Narrow', " + FONT;
const EMB = { eagle: 'M35.31 22.3C27.498 42.766 22.138 64.643 20 87.378l103.705 27.79-4.838 18.052-99.873-26.763c-.012.954-.035 1.905-.035 2.86 0 14.055 1.196 27.83 3.48 41.23h94.146v18.687H26.393c3.368 13.324 7.83 26.207 13.29 38.547l79.184-21.216 4.838 18.05-75.64 20.27c5.994 11.096 12.817 21.67 20.396 31.636l61.933-35.756 9.343 16.183-59.22 34.192c7.782 8.728 16.18 16.885 25.132 24.4l44.73-44.726 13.214 13.215-43.055 43.052c8.963 6.406 18.374 12.215 28.186 17.357l28.734-49.772 16.186 9.346-27.987 48.472c12.545 5.367 25.63 9.697 39.156 12.87.99 3.566 2.08 7.103 3.25 10.593-12.36 9.993-24.163 20.49-35.12 31.728-4.458-2.16-9.46-3.373-14.75-3.373-18.707 0-33.874 15.164-33.874 33.873 0 1.715.13 3.402.377 5.05 2.02-11.514 12.06-20.265 24.153-20.265 3.103 0 6.068.582 8.8 1.633-10.103 12.102-19.193 25.08-26.906 39.23 13.897-7.544 27.684-15.755 41.15-24.764.96 2.63 1.485 5.468 1.485 8.43 0 12.122-8.796 22.184-20.352 24.168 1.685.258 3.412.393 5.168.393 18.71 0 33.873-15.168 33.873-33.875 0-4.17-.757-8.16-2.134-11.848 10.033-7.467 19.823-15.43 29.26-23.984 2.978 5.705 6.203 11.034 9.65 15.818l-43.53 87.17c48.267 22.47 115.7 22.76 157.872 0l-42.13-84.36c3.722-4.81 7.21-10.25 10.426-16.14 8.577 7.617 17.428 14.77 26.483 21.508-1.375 3.685-2.13 7.67-2.13 11.836 0 18.707 15.165 33.873 33.874 33.873 1.758 0 3.486-.132 5.172-.39-11.56-1.983-20.355-12.045-20.355-24.168 0-2.964.525-5.805 1.49-8.435 13.464 9.006 27.247 17.223 41.143 24.767-7.71-14.148-16.78-27.136-26.877-39.238 2.726-1.045 5.682-1.623 8.775-1.623 12.09 0 22.13 8.75 24.15 20.262.246-1.647.377-3.332.377-5.047 0-18.71-15.166-33.873-33.875-33.873-5.275 0-10.268 1.205-14.72 3.355-10.007-10.27-20.74-19.908-31.946-29.12 1.938-5.52 3.658-11.18 5.132-16.886 7.91-2.368 15.65-5.14 23.2-8.283l-28.497-49.356 16.186-9.346 29.34 50.816c9.98-5.11 19.555-10.9 28.672-17.308l-44.146-44.147 13.215-13.216 45.926 45.922c9.145-7.557 17.72-15.785 25.666-24.6l-60.95-35.19 9.343-16.182 63.748 36.804c7.76-10.087 14.746-20.807 20.87-32.07l-77.93-20.883 4.837-18.05 81.534 21.847c5.588-12.533 10.157-25.625 13.584-39.178h-92.836v-18.687h96.777c2.282-13.4 3.48-27.174 3.48-41.23 0-1.19-.025-2.376-.044-3.563L397.652 133.22l-4.836-18.054L499.09 86.69c-2.18-22.49-7.52-44.13-15.254-64.39h-.004C457.315 63.81 400.24 96.234 329.068 109.32c12.67 15.603 20.442 35.52 20.442 57.233 0 31.196-15.723 58.718-39.604 75-21.27-12.407-42.907-28.878-45.52-43.814l17.653-3.81-2.235-10.352c15.67-11.335 33.936-9.138 53.433-.01l-18.302-40.414-41.903 9.04-2.846-13.188V139l-80.87 17.453 20.458 30.266c-8.595 19.678-2.717 41.68 5.45 58.56-27.204-15.57-45.592-44.998-45.592-78.73 0-21.713 7.772-41.63 20.44-57.232C118.904 96.234 61.83 63.81 35.312 22.3zm216.45 132.567c5.244-.056 9.98 3.573 11.13 8.9 1.312 6.085-2.557 12.084-8.644 13.397-6.087 1.313-12.085-2.556-13.398-8.643-1.314-6.085 2.556-12.086 8.642-13.4.76-.163 1.52-.245 2.27-.253z', wolf: 'M179.3 38.94C154.7 77.7 142.7 139.7 168.4 185.9l-16.3 9.2c-6.7-11.9-11.2-24.4-13.9-37.2-34.5-6.3-69.42-7.5-104.98-2.1 34.07 10.1 52.77 23.7 76.68 46.7-26.82 9.7-60.25 30.2-92.93 70.2 35.47-8.8 64.83-11.5 89.43-6.3-36.94 22.5-64.06 56.1-88.34 114.1 35.9-17.2 64.89-18.8 102.94-18.8-23.07 32.7-35.27 77.2-36.31 112.8 24.51-26 57.61-60.2 87.21-79 3 29.9 15 58.3 35.9 85.3-.2-43.9 10.3-88.3 31.6-133.4-18.8 9-32.4 18.1-49.9 29.3 6.2-27.9 12.4-55.8 18.7-83.7-23.3 2.4-39 10-60.5 18.5 16.3-33.1 32.7-66.1 49.1-99.2l16.8 8.3-28.4 57.4c18.4-4.4 28.7-4.1 45.7-1.3-4.5 20.4-9 40.7-13.6 61 65.3-36.2 148.3-45.9 226.7-50 7.6-12.9 13.8-24.2 18.8-34.8l-6.3-24.4-24.4 30.8-7.8-27.5-22.5 29.2-7.5-26.1-23.9 31.5-7.7-28.2-23.8 31.4 1.2-41.1 22.6-42.7 7.6 28.3 23.9-31.5 7.6 28.2 23.5-30 6.5 26.9 24.5-30.8 7.8 27.5 24.6-32c2.3-10.8 4.6-22.4 7.4-35.7-55.5-3.7-106.3 4.8-154 9.8-38-20.8-80.8-26.8-121.9-18.5-13.6-29.69-27.2-59.38-40.9-89.06zM325.5 158.3c-4.5 14.2-13 18.3-24.7 20.6-16.1-4.4-28.3-15.5-34.4-30.2 20.4-3.8 42.4 3.4 59.1 9.6z', person: 'M250.882 22.802c-23.366 3.035-44.553 30.444-44.553 65.935 0 19.558 6.771 36.856 16.695 48.815l11.84 14.263-18.217 3.424c-12.9 2.425-22.358 9.24-30.443 20.336-8.085 11.097-14.266 26.558-18.598 44.375-7.843 32.28-9.568 71.693-9.842 106.436h42.868l11.771 157.836c29.894 6.748 61.811 6.51 90.602.025l10.414-157.86h40.816c-.027-35.169-.477-75.126-7.584-107.65-3.918-17.934-9.858-33.372-18.04-44.343-8.185-10.97-18.08-17.745-32.563-19.989l-18.592-2.88 11.736-14.704c9.495-11.897 15.932-28.997 15.932-48.082 0-37.838-23.655-65.844-49.399-65.844z' };
let fontIn = false;
export function useLobbyFont() {
  useEffect(() => {
    if (fontIn || typeof document === 'undefined') return;
    fontIn = true;
    const st = document.createElement('style');
    st.textContent = [['600', 'normal', 600], ['700', 'normal', 700], ['800', 'normal', 800], ['700i', 'italic', 700]].map(([f, sty, w]) => `@font-face{font-family:'Barlow Condensed';font-style:${sty};font-weight:${w};font-display:swap;src:url(/fonts/barlow-c-${f}.woff) format('woff')}`).join('');
    document.head.appendChild(st);
  }, []);
}
export function Emblem({ k, size = 40, color = '#FFFFFF', glow }) {
  return <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden="true" style={{ display: 'block', flexShrink: 0, filter: glow ? `drop-shadow(0 0 6px ${glow})` : 'drop-shadow(0 2px 3px rgba(0,0,0,0.5))' }}><path d={EMB[k]} fill={color} /></svg>;
}
const TC = [{ a: '#3D8BFF', b: '#1F4FB5', c: '#0F2554', t: '#8EC1FF', name: 'Blue team', emb: 'eagle' }, { a: '#FF4D5E', b: '#B8223A', c: '#4A0E18', t: '#FF9AA5', name: 'Red team', emb: 'wolf' }];
const PANEL = 'rgba(9,12,19,0.86)';
const EDGE = 'rgba(255,255,255,0.08)';
const GOLD = '#F2B21B';

function Btn({ label, onPress, children, style, off }) {
  return <button type="button" className="zgk-btn" aria-label={label} disabled={off} {...pressProps(() => { if (off) return; kitTap(); if (onPress) onPress(); })} style={{ border: 'none', padding: 0, cursor: off ? 'default' : 'pointer', fontFamily: FONT, color: '#FFFFFF', ...style }}>{children}</button>;
}
function SqBtn({ label, icon, onPress, on, badge, size = 40 }) {
  return (
    <Btn label={label} onPress={onPress} style={{ position: 'relative', width: size + 4, height: size, borderRadius: 4, background: on ? 'rgba(242,178,27,0.22)' : 'rgba(12,16,24,0.78)', boxShadow: `inset 0 0 0 1px ${on ? 'rgba(242,178,27,0.75)' : 'rgba(255,255,255,0.14)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {typeof icon === 'string' ? <LineIcon k={icon} size={Math.round(size * 0.5)} color={on ? '#FFD45A' : '#FFFFFF'} /> : icon}
      {badge ? <span style={{ position: 'absolute', right: -4, top: -4, minWidth: 16, height: 16, padding: '0 4px', boxSizing: 'border-box', borderRadius: 8, background: '#E5484D', fontSize: 10, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{badge}</span> : null}
    </Btn>
  );
}
function PHead({ icon, title, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 34, flexShrink: 0, padding: '0 10px 0 12px', background: 'linear-gradient(90deg, rgba(242,178,27,0.2), rgba(255,255,255,0.03) 75%)', boxShadow: `inset 3px 0 0 ${GOLD}` }}>
      {icon}
      <span style={{ fontFamily: HF, fontWeight: 700, fontSize: 18.5, letterSpacing: 0.3, whiteSpace: 'nowrap' }}>{title}</span>
      <span style={{ flex: 1 }} />
      {right}
    </div>
  );
}
function SRow({ label, value, onPress, off }) {
  return (
    <Btn label={`${label}, ${value}${off ? '' : '. Change'}`} onPress={onPress} off={off} style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '3px 10px 4px 12px', borderBottom: `1px solid ${EDGE}`, background: 'transparent', textAlign: 'left' }}>
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,0.56)' }}>{label}</span>
        <span style={{ fontFamily: HF, fontWeight: 700, fontSize: 16.5, lineHeight: 1.12, color: '#FFD45A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</span>
      </span>
      {!off && <span style={{ transform: 'rotate(180deg)', opacity: 0.45 }}><LineIcon k="back" size={13} /></span>}
    </Btn>
  );
}
function TeamBand({ mine, n, cap, right, label }) {
  const C = TC[mine ? 0 : 1];
  const flip = !!right;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexDirection: flip ? 'row-reverse' : 'row', height: 30, flexShrink: 0 }}>
      <Emblem k={C.emb} size={32} color={C.a} glow={`${C.a}88`} />
      <div style={{ flex: 1, height: 26, display: 'flex', alignItems: 'center', justifyContent: flip ? 'flex-end' : 'flex-start', gap: 8, padding: '0 14px', background: `linear-gradient(${flip ? 270 : 90}deg, ${C.b}DD, ${C.b}44 60%, rgba(0,0,0,0) 100%)`, clipPath: flip ? 'polygon(0 0, 100% 0, 100% 100%, 12px 100%)' : 'polygon(0 0, 100% 0, calc(100% - 12px) 100%, 0 100%)', flexDirection: flip ? 'row-reverse' : 'row' }}>
        <span style={{ fontFamily: HF, fontStyle: 'italic', fontWeight: 700, fontSize: 21, color: C.t, letterSpacing: 0.3, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{label || (mine ? 'Your team' : 'Enemy team')}</span>
        <span style={{ fontFamily: HF, fontWeight: 700, fontSize: 15, color: 'rgba(255,255,255,0.75)' }}>{`${n} of ${cap}`}</span>
      </div>
    </div>
  );
}
function Slot({ s, tm, w, thumbs, onEmpty }) {
  const C = TC[tm == null ? 0 : tm];
  const h = w * 1.18;
  if (!s || s.empty) {
    const canAdd = !!onEmpty;
    return (
      <Btn label={canAdd ? 'Invite a friend' : s && s.bot ? 'A bot plays here' : 'Open spot'} onPress={onEmpty} off={!canAdd} style={{ width: w, height: h, borderRadius: 5, flexShrink: 0, background: 'linear-gradient(180deg, rgba(30,36,48,0.78), rgba(14,18,26,0.86))', boxShadow: `inset 0 0 0 1px ${EDGE}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        <svg width={w * 0.42} height={w * 0.42} viewBox="0 0 512 512" aria-hidden="true"><path d={EMB.person} fill="rgba(255,255,255,0.22)" /></svg>
        {s && s.bot ? <span style={{ fontFamily: HF, fontWeight: 700, fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Bot</span> : canAdd ? <LineIcon k="plus" size={16} color="rgba(255,255,255,0.75)" w={2.4} /> : <span style={{ fontFamily: HF, fontWeight: 600, fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Open</span>}
      </Btn>
    );
  }
  return (
    <div style={{ position: 'relative', width: w, height: h, borderRadius: 5, overflow: 'hidden', flexShrink: 0, background: `linear-gradient(180deg, ${C.b}, ${C.c} 78%)`, boxShadow: s.me ? '0 0 0 2px #FFD45A, 0 4px 10px rgba(0,0,0,0.4)' : `0 0 0 1.5px ${C.a}AA, 0 4px 10px rgba(0,0,0,0.35)` }}>
      {thumbs[s.hero] ? <img src={thumbs[s.hero]} alt="" draggable={false} style={{ position: 'absolute', left: 0, right: 0, top: 0, width: '100%', height: h - 24, objectFit: 'cover', display: 'block' }} /> : null}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 25, padding: '1px 4px 0', background: 'linear-gradient(180deg, rgba(4,6,12,0.55), rgba(4,6,12,0.92))', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
        <span style={{ maxWidth: '100%', fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: s.me ? '#FFE15A' : '#FFFFFF' }}>{s.me ? 'You' : s.name}</span>
        {s.pw ? <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontFamily: HF, fontWeight: 700, fontSize: 12.5, color: '#FFD45A' }}><GIcon k="bolt" size={10} color="#FFD45A" ink="transparent" />{s.pw}</span> : null}
      </div>
      {s.host && <span aria-label="Host" style={{ position: 'absolute', left: 3, top: 3, width: 18, height: 16, borderRadius: 3, background: 'linear-gradient(180deg, #FFE27A, #F5B321)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><GIcon k="crown" size={12} color="#3A2500" ink="transparent" /></span>}
      {s.talk && <span aria-label="Talking" style={{ position: 'absolute', right: 3, top: 3, width: 16, height: 16, borderRadius: 8, background: 'rgba(20,160,80,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LineIcon k="mic" size={11} /></span>}
    </div>
  );
}
function Sheet({ title, onClose, children, width = 440 }) {
  return (
    <div role="dialog" aria-label={title} onPointerDown={(e) => { if (e.target === e.currentTarget) { e.stopPropagation(); onClose(); } }} style={{ position: 'absolute', inset: 0, zIndex: 30, background: 'rgba(2,4,8,0.62)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12, boxSizing: 'border-box' }}>
      <div onPointerDown={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: width, maxHeight: '100%', display: 'flex', flexDirection: 'column', background: PANEL, boxShadow: `0 0 0 1px ${EDGE}, 0 18px 40px rgba(0,0,0,0.55)`, borderRadius: 4, overflow: 'hidden' }}>
        <PHead title={title} right={<SqBtn label="Close" icon={<GIcon k="close" size={16} color="#FFFFFF" line halo={false} />} size={30} onPress={onClose} />} />
        <div style={{ padding: 12, overflowY: 'auto', minHeight: 0, touchAction: 'pan-y' }}>{children}</div>
      </div>
    </div>
  );
}
function OptList({ items, value, onPick, off }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map(([v, t, sub]) => {
        const on = v === value;
        return (
          <Btn key={String(v)} label={t} off={off && !on} onPress={() => onPick(v)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 4, textAlign: 'left', background: on ? 'rgba(242,178,27,0.16)' : 'rgba(255,255,255,0.05)', boxShadow: on ? `inset 0 0 0 1.5px ${GOLD}` : `inset 0 0 0 1px ${EDGE}` }}>
            <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{ fontFamily: HF, fontWeight: 700, fontSize: 18, color: on ? '#FFD45A' : '#FFFFFF' }}>{t}</span>
              {sub ? <span style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>{sub}</span> : null}
            </span>
            {on && <GIcon k="check" size={16} color="#FFD45A" line halo={false} />}
          </Btn>
        );
      })}
    </div>
  );
}

export function SiegeLobby({ L }) {
  useLobbyFont();
  const [sheet, setSheet] = useState(null);
  const [tab, setTab] = useState('friends');
  const GS = L.GS;
  const BW = 860, BH = 396;
  const k = Math.max(0.62, Math.min(1.7, GS.W / BW, GS.H / BH));
  const W0 = GS.W / k, H0 = GS.H / k;
  const team = L.mode === 'team';
  const host = L.isHost && !L.watch;
  const sideW = W0 >= 900 ? 190 : 168;
  const invW = W0 >= 900 ? 200 : 172;
  const midW = W0 - sideW - invW - 40;
  const cap = team ? L.cap : Math.min(5, L.cap);
  const availH = H0 - 132;
  const slotW = Math.max(46, Math.min(78, Math.floor((midW - 46) / Math.max(5, cap) - 7), Math.floor((availH - 118) / 2 / 1.18)));
  const modeName = team ? T.GM_NAME[L.gm] : 'Waves';
  const open = (k2) => () => { if (!host) return; if (k2 === 'arena') { if (L.onArena) L.onArena(); return; } if (k2 === 'map' && L.onMapSheet) L.onMapSheet(); setSheet(k2); };
  const rows = team ? [
    ['Match mode', modeName, 'mode'], ['Map', T.MAPS[L.map] ? T.MAPS[L.map].name : 'Map', 'map'], ['Time limit', `${L.tlim} minutes`, 'time'],
    ['Score limit', L.goalText, 'goal'], ['Team size', `${L.ts}v${L.ts}`, 'size'], ['Bots', ['Easy', 'Normal', 'Hard'][L.bl] || 'Normal', 'bots'],
  ] : [
    ['Match mode', modeName, 'mode'], ['Arena', L.arenaName, 'arena'], ['Aliens', L.lvName, 'arena'], ['Waves', L.wavesText, 'arena'], ['Bots', L.botText, 'wbots'],
  ];
  const friends = (L.friends || []).slice().sort((a, b) => (b.on ? 1 : 0) - (a.on ? 1 : 0) || String(a.name).localeCompare(String(b.name)));
  const blue = team ? L.blue : [], red = team ? L.red : [];
  const myTm = L.myTm === 1 ? 1 : 0;
  const teamRow = (list, tm) => (
    <div style={{ display: 'flex', gap: 7, justifyContent: tm === myTm ? 'flex-start' : 'flex-end', paddingLeft: tm === myTm ? 40 : 0, paddingRight: tm === myTm ? 0 : 40 }}>
      {Array.from({ length: cap }, (_, i) => <Slot key={i} s={list[i]} tm={tm === myTm ? 0 : 1} w={slotW} thumbs={L.thumbs} onEmpty={L.onInviteSlot && !(list[i] && list[i].bot) ? L.onInviteSlot : null} />)}
    </div>
  );
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 5, overflow: 'hidden', fontFamily: FONT, color: '#FFFFFF' }}>
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 45%, rgba(6,9,15,0.18), rgba(3,5,9,0.72) 82%)' }} />
      <div aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 90, pointerEvents: 'none', background: 'linear-gradient(180deg, rgba(3,5,9,0.85), rgba(3,5,9,0))' }} />
      <div aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 110, pointerEvents: 'none', background: 'linear-gradient(0deg, rgba(3,5,9,0.9), rgba(3,5,9,0))' }} />
      <div style={{ position: 'absolute', left: 0, top: 0, width: W0, height: H0, transform: k === 1 ? 'none' : `scale(${k})`, transformOrigin: '0 0', boxSizing: 'border-box', padding: `${GS.at.top(8)} ${GS.at.right(12)} ${GS.at.bottom(8)} ${GS.at.left(12)}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 42, flexShrink: 0 }}>
          <SqBtn label={L.closeLabel} icon={<LineIcon k="back" size={20} color="#FFD45A" w={2.6} />} size={38} onPress={L.onClose} />
          <span style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.25)' }} />
          <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span style={{ fontFamily: HF, fontWeight: 800, fontSize: 28, letterSpacing: 0.4, textShadow: '0 2px 6px rgba(0,0,0,0.6)' }}>{L.title}</span>
            {L.sub ? <span style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{L.sub}</span> : null}
          </span>
          <span style={{ flex: 1 }} />
          {L.scrap != null && <span style={{ display: 'flex', alignItems: 'center', gap: 5, height: 30, padding: '0 10px', borderRadius: 4, background: 'rgba(12,16,24,0.78)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.14)', fontFamily: HF, fontWeight: 700, fontSize: 16, color: '#FFD45A' }}><GIcon k="star" size={13} color="#FFD45A" ink="transparent" />{`${L.scrap} scrap`}</span>}
          {L.onWatch && <SqBtn label={L.allowWatch ? 'Friends can watch. Tap to stop' : 'Let friends watch'} icon="eye" on={L.allowWatch} badge={L.watchers || null} onPress={L.onWatch} />}
          {L.onPeople && <SqBtn label="Players and voice" icon="people" onPress={L.onPeople} />}
          <SqBtn label="Settings" icon={<GIcon k="gear" size={20} color="#FFFFFF" line halo={false} stroke={2} />} onPress={L.onSettings} />
        </div>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 10 }}>
          <div style={{ width: sideW, flexShrink: 0, display: 'flex', flexDirection: 'column', alignSelf: 'flex-start', background: PANEL, boxShadow: `0 0 0 1px ${EDGE}`, borderRadius: 3, overflow: 'hidden', maxHeight: '100%' }}>
            <PHead title="Match settings" />
            <div style={{ overflowY: 'auto', minHeight: 0 }}>
              {rows.map(([lab, val, key]) => <SRow key={lab} label={lab} value={val} off={!host} onPress={open(key)} />)}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
            {team ? (
              <>
                <TeamBand mine label={L.watch ? TC[0].name : null} n={(myTm === 0 ? blue : red).filter((s) => s && !s.empty && !s.bot).length} cap={cap} />
                {teamRow(myTm === 0 ? blue : red, myTm)}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 34, flexShrink: 0 }}>
                  <span style={{ flex: 1, height: 2, background: `linear-gradient(90deg, rgba(255,255,255,0), ${TC[0].a}AA)` }} />
                  <span style={{ fontFamily: HF, fontStyle: 'italic', fontWeight: 700, fontSize: 36, lineHeight: 1, letterSpacing: 1, textShadow: '0 3px 10px rgba(0,0,0,0.7)' }}>VS</span>
                  <span style={{ flex: 1, height: 2, background: `linear-gradient(90deg, ${TC[1].a}AA, rgba(255,255,255,0))` }} />
                  {L.onSwap && <Btn label="Switch team" onPress={L.onSwap} style={{ display: 'flex', alignItems: 'center', gap: 5, height: 28, padding: '0 10px', borderRadius: 3, background: 'rgba(12,16,24,0.8)', boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.18)`, fontFamily: HF, fontWeight: 700, fontSize: 14.5 }}><LineIcon k="swap" size={15} />Switch team</Btn>}
                </div>
                {teamRow(myTm === 0 ? red : blue, 1 - myTm)}
                <TeamBand label={L.watch ? TC[1].name : null} n={(myTm === 0 ? red : blue).filter((s) => s && !s.empty && !s.bot).length} cap={cap} right />
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 34 }}>
                  <Emblem k="eagle" size={34} color="#FFD45A" glow="rgba(255,212,90,0.5)" />
                  <div style={{ flex: 1, height: 26, display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px', background: 'linear-gradient(90deg, rgba(196,140,20,0.85), rgba(196,140,20,0.2) 60%, rgba(0,0,0,0))', clipPath: 'polygon(0 0, 100% 0, calc(100% - 12px) 100%, 0 100%)' }}>
                    <span style={{ fontFamily: HF, fontStyle: 'italic', fontWeight: 700, fontSize: 21, color: '#FFE9A8' }}>Your squad</span>
                    <span style={{ fontFamily: HF, fontWeight: 700, fontSize: 15, color: 'rgba(255,255,255,0.75)' }}>{`${L.squad.filter((s) => s && !s.empty && !s.bot).length} of ${L.cap}`}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, paddingLeft: 40 }}>
                  {Array.from({ length: L.cap }, (_, i) => <Slot key={i} s={L.squad[i]} tm={0} w={Math.min(slotW, 64)} thumbs={L.thumbs} onEmpty={L.onInviteSlot && !(L.squad[i] && L.squad[i].bot) ? L.onInviteSlot : null} />)}
                </div>
                {L.best ? <span style={{ alignSelf: 'flex-start', marginLeft: 40, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, height: 28, padding: '0 10px', borderRadius: 3, background: 'rgba(12,16,24,0.78)', fontFamily: HF, fontWeight: 700, fontSize: 15.5, color: '#FFD45A' }}><GIcon k="crown" size={13} color="#FFD45A" ink="transparent" />{`Best wave ${L.best}`}</span> : null}
              </>
            )}
          </div>
          <div style={{ width: invW, flexShrink: 0, display: 'flex', flexDirection: 'column', background: PANEL, boxShadow: `0 0 0 1px ${EDGE}`, borderRadius: 3, overflow: 'hidden', alignSelf: 'stretch' }}>
            <PHead icon={<LineIcon k="people" size={18} color="#FFD45A" />} title={L.watch ? 'Players' : 'Invite'} />
            <div style={{ display: 'flex', gap: 4, padding: '6px 6px 4px' }}>
              {[['friends', 'Friends'], ['room', L.solo ? 'Squad' : 'Room']].map(([kk, t]) => (
                <Btn key={kk} label={t} onPress={() => setTab(kk)} style={{ flex: 1, height: 26, borderRadius: 3, fontFamily: HF, fontWeight: 700, fontSize: 15, background: tab === kk ? 'linear-gradient(180deg, rgba(242,178,27,0.32), rgba(242,178,27,0.14))' : 'rgba(255,255,255,0.04)', boxShadow: tab === kk ? `inset 0 0 0 1.5px ${GOLD}` : `inset 0 0 0 1px ${EDGE}`, color: tab === kk ? '#FFE9A8' : 'rgba(255,255,255,0.75)' }}>{t}</Btn>
              ))}
            </div>
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '2px 6px 6px', display: 'flex', flexDirection: 'column', gap: 4, touchAction: 'pan-y' }}>
              {tab === 'friends' ? (friends.length ? friends.map((p) => {
                const inRoom = L.inRoom && L.inRoom.has(p.id);
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 6px', borderRadius: 3, background: 'rgba(255,255,255,0.04)' }}>
                    <span style={{ position: 'relative', flexShrink: 0 }}><Avatar emoji={p.avatar} name={p.name} size={30} />{p.on && <span style={{ position: 'absolute', right: -1, bottom: -1, width: 9, height: 9, borderRadius: 5, background: '#46D36B', boxShadow: '0 0 0 2px #0E121B' }} />}</span>
                    <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: inRoom ? '#FFD45A' : p.on ? '#5BE37D' : 'rgba(255,255,255,0.45)' }}>{inRoom ? 'In the room' : p.on ? 'Online' : 'Offline'}</span>
                    </span>
                    {L.onInvite && !inRoom && <Btn label={`Invite ${p.name}`} onPress={() => L.onInvite(p)} style={{ width: 26, height: 26, borderRadius: 3, flexShrink: 0, background: 'linear-gradient(180deg, #FFE27A, #F5B321)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LineIcon k="plus" size={15} color="#2A1D05" w={2.8} /></Btn>}
                  </div>
                );
              }) : <span style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.4, color: 'rgba(255,255,255,0.62)', padding: '6px 4px' }}>Chat with someone first, then you can invite them here.</span>) : (
                (L.roomList || []).map((p) => (
                  <Btn key={p.id} label={p.me ? 'You' : `${p.name}, voice and volume`} off={p.me || !L.onPeople} onPress={L.onPeople} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 6px', borderRadius: 3, background: 'rgba(255,255,255,0.04)', textAlign: 'left' }}>
                    <span style={{ width: 30, height: 30, borderRadius: 3, overflow: 'hidden', flexShrink: 0, background: '#141A2C' }}>{L.thumbs[p.hero] ? <img src={L.thumbs[p.hero]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : null}</span>
                    <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: p.me ? '#FFE15A' : '#FFFFFF' }}>{p.me ? 'You' : p.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: p.watch ? '#9FD0FF' : p.host ? '#FFD45A' : 'rgba(255,255,255,0.55)' }}>{p.watch ? 'Watching' : p.host ? 'Host' : p.bot ? 'Bot' : 'Ready'}</span>
                    </span>
                    {p.talk && <LineIcon k="mic" size={14} color="#5BE37D" />}
                    {p.muted && <LineIcon k="mute" size={14} color="rgba(255,255,255,0.6)" />}
                  </Btn>
                ))
              )}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 50, flexShrink: 0 }}>
          {L.onChat && <SqBtn label="Chat" icon="chat" badge={L.chatN || null} onPress={L.onChat} size={42} />}
          {L.onMic && <SqBtn label={L.micOn ? 'Turn your mic off' : 'Talk with your mic'} icon={L.micOn ? 'mic' : 'micoff'} on={L.micOn} onPress={L.onMic} size={42} />}
          {L.onPeople && <SqBtn label="Voice volume" icon={L.allMuted ? 'mute' : 'sound'} onPress={L.onPeople} size={42} />}
          {L.micErr ? <span style={{ fontSize: 11.5, fontWeight: 800, color: '#FF9C9C', maxWidth: 160 }}>{L.micErr}</span> : null}
          <span style={{ flex: 1 }} />
          {!L.watch && <Btn label="Loadout. Pick your hero and skill" onPress={L.onLoadout} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 16px 0 10px', background: 'rgba(12,16,24,0.82)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.18)', clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)' }}>
            <span style={{ width: 30, height: 30, borderRadius: 3, overflow: 'hidden', background: '#141A2C' }}>{L.thumbs[L.heroKey] ? <img src={L.thumbs[L.heroKey]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : null}</span>
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1, textAlign: 'left' }}><span style={{ fontFamily: HF, fontWeight: 700, fontSize: 18 }}>Loadout</span><span style={{ fontSize: 10.5, fontWeight: 800, color: 'rgba(255,255,255,0.65)' }}>{L.heroLine}</span></span>
          </Btn>}
          <Btn label="How to play" onPress={() => setSheet('how')} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 16px 0 12px', background: 'rgba(12,16,24,0.82)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.18)', clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)' }}>
            <LineIcon k="info" size={18} color="#FFD45A" /><span style={{ fontFamily: HF, fontWeight: 700, fontSize: 18 }}>How to play</span>
          </Btn>
          {L.failed ? <span style={{ width: 230, fontSize: 12, fontWeight: 800, lineHeight: 1.35, color: '#FFB4B4' }}>This phone could not start the 3D game. Close other apps, then open it again.</span>
            : host ? (
              <Btn label={L.ready ? 'Start match' : L.readyText} off={!L.ready} onPress={L.onStart} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: 224, height: 50, background: L.ready ? 'linear-gradient(180deg, #FFD84A, #F2A60C)' : 'rgba(255,255,255,0.12)', clipPath: 'polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%)', color: L.ready ? '#1E1300' : 'rgba(255,255,255,0.7)', boxShadow: L.ready ? 'inset 0 -3px 0 rgba(120,70,0,0.45), inset 0 2px 0 rgba(255,255,255,0.5)' : 'none' }}>
                {L.ready ? <svg width="18" height="20" viewBox="0 0 18 20" aria-hidden="true"><path d="M2 1.5l14.5 8.5L2 18.5z" fill="#1E1300" /></svg> : <Spinner size={16} color="#FFFFFF" />}
                <span style={{ fontFamily: HF, fontWeight: 800, fontSize: L.ready ? 26 : 17, letterSpacing: 0.4 }}>{L.ready ? 'Start match' : L.readyText}</span>
              </Btn>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: 224, height: 50, background: 'rgba(12,16,24,0.82)', clipPath: 'polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%)', fontFamily: HF, fontWeight: 700, fontSize: 16 }}><Spinner size={15} color="#FFFFFF" />{L.waitText}</span>
            )}
        </div>
      </div>
      {sheet === 'mode' && <Sheet title="Match mode" onClose={() => setSheet(null)}><OptList value={team ? L.gm : 'waves'} items={[['tdm', 'Team deathmatch', 'Every takedown is a point for your team'], ['hp', 'Hardpoint', 'Hold the zone to score. It moves every minute'], ['waves', 'Waves', 'Your squad against alien waves']]} onPick={(v) => { L.onPlay(v); setSheet(null); }} /></Sheet>}
      {sheet === 'map' && (
        <Sheet title="Map" width={620} onClose={() => setSheet(null)}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(3, T.MAP_KEYS.length)}, minmax(0, 1fr))`, gap: 8 }}>
            {T.MAP_KEYS.map((mk) => {
              const on = mk === L.map;
              return (
                <Btn key={mk} label={T.MAPS[mk].name} onPress={() => { L.onMap(mk); setSheet(null); }} style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: 5, borderRadius: 3, textAlign: 'left', background: on ? 'rgba(242,178,27,0.14)' : 'rgba(255,255,255,0.05)', boxShadow: on ? `inset 0 0 0 1.5px ${GOLD}` : `inset 0 0 0 1px ${EDGE}` }}>
                  <span style={{ width: '100%', aspectRatio: '16 / 9', borderRadius: 2, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.MAPS[mk].bg || '#2A2620' }}>{L.mapThumbs[mk] ? <img src={L.mapThumbs[mk]} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : <Spinner size={16} color="#FFFFFF" />}</span>
                  <span style={{ fontFamily: HF, fontWeight: 700, fontSize: 18, padding: '0 3px', color: on ? '#FFD45A' : '#FFFFFF' }}>{T.MAPS[mk].name}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', padding: '0 3px 2px' }}>{T.MAPS[mk].text}</span>
                </Btn>
              );
            })}
          </div>
        </Sheet>
      )}
      {sheet === 'time' && <Sheet title="Time limit" onClose={() => setSheet(null)}><OptList value={L.tlim} items={[[5, '5 minutes'], [8, '8 minutes'], [10, '10 minutes'], [15, '15 minutes']]} onPick={(v) => { L.onTlim(v); setSheet(null); }} /></Sheet>}
      {sheet === 'goal' && <Sheet title="Score limit" onClose={() => setSheet(null)}><OptList value={L.glim} items={L.goalItems} onPick={(v) => { L.onGlim(v); setSheet(null); }} /></Sheet>}
      {sheet === 'size' && <Sheet title="Team size" onClose={() => setSheet(null)}><OptList value={L.ts} items={[1, 2, 3, 4, 5].map((n) => [n, `${n}v${n}`, n === 1 ? 'Just you against one' : `Bots fill open spots`])} onPick={(v) => { L.onTs(v); setSheet(null); }} /></Sheet>}
      {sheet === 'bots' && <Sheet title="Bots" onClose={() => setSheet(null)}><OptList value={L.bl} items={[[0, 'Easy', 'Slow to react and miss more'], [1, 'Normal', 'A fair fight'], [2, 'Hard', 'Quick and sharp']]} onPick={(v) => { L.onBl(v); setSheet(null); }} /></Sheet>}
      {sheet === 'wbots' && <Sheet title={L.solo ? 'Bot friends' : 'Bots fill empty spots'} onClose={() => setSheet(null)}><OptList value={L.botN} items={L.botItems} onPick={(v) => { L.onBots(v); setSheet(null); }} /></Sheet>}
      {sheet === 'how' && <Sheet title="How to play" width={520} onClose={() => setSheet(null)}>{L.howTo}</Sheet>}
    </div>
  );
}

const RANGE_T = ['', 'Very short', 'Short', 'Medium', 'Long', 'Very long'];
const SPEED_T = ['', 'Slow', 'Steady', 'Normal', 'Quick', 'Very quick'];
function Bar({ label, f, text, add, col }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.62)', flex: 1 }}>{label}</span>
        <span style={{ fontFamily: HF, fontWeight: 700, fontSize: 15.5 }}>{text}</span>
        {add ? <span style={{ fontFamily: HF, fontWeight: 700, fontSize: 14, color: '#5BE37D' }}>{add}</span> : null}
      </div>
      <span style={{ height: 6, borderRadius: 1, background: 'rgba(255,255,255,0.1)', overflow: 'hidden', display: 'block' }}><span style={{ display: 'block', height: '100%', width: `${Math.round(Math.max(0.04, Math.min(1, f)) * 100)}%`, background: col }} /></span>
    </div>
  );
}
export function SiegeLoadout({ D }) {
  useLobbyFont();
  const GS = D.GS;
  const BW = 860, BH = 396;
  const k = Math.max(0.62, Math.min(1.7, GS.W / BW, GS.H / BH));
  const W0 = GS.W / k, H0 = GS.H / k;
  const H = E.HEROES[D.heroKey];
  const lvl = D.levels ? D.levels[D.heroKey] || 1 : 1;
  const top = lvl >= E.MAX_LEVEL;
  const lm = E.levelMods(lvl), ln = E.levelMods(Math.min(E.MAX_LEVEL, lvl + 1));
  const hpNow = Math.round(H.hp * lm.hp), hpNext = Math.round(H.hp * ln.hp);
  const dNow = Math.round(D.shotDmg(H) * lm.dmg), dNext = Math.round(D.shotDmg(H) * ln.dmg);
  const cost = E.levelCost(lvl);
  const short = D.scrap != null ? Math.max(0, cost - D.scrap) : 0;
  const leftW = W0 >= 900 ? 320 : 292, rightW = W0 >= 900 ? 300 : 270;
  const tileW = Math.floor((leftW - 24 - 3 * 6) / 4);
  const abil = [['atk', 'Attack', H.atkName || 'Main attack', H.text], ['sup', 'Super', H.sup.name, H.sup.text], ['gad', 'Gadget', H.gad.name, `${H.gad.text} ${E.GADGETS} uses each game.`]];
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 6, overflow: 'hidden', fontFamily: FONT, color: '#FFFFFF' }}>
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(90deg, rgba(3,5,9,0.86) 0%, rgba(3,5,9,0.25) 36%, rgba(3,5,9,0.25) 62%, rgba(3,5,9,0.86) 100%)' }} />
      <div style={{ position: 'absolute', left: 0, top: 0, width: W0, height: H0, transform: k === 1 ? 'none' : `scale(${k})`, transformOrigin: '0 0', boxSizing: 'border-box', padding: `${GS.at.top(8)} ${GS.at.right(12)} ${GS.at.bottom(8)} ${GS.at.left(12)}`, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 42, flexShrink: 0, pointerEvents: 'auto' }}>
          <SqBtn label="Back to the lobby" icon={<LineIcon k="back" size={20} color="#FFD45A" w={2.6} />} size={38} onPress={D.onBack} />
          <span style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.25)' }} />
          <span style={{ fontFamily: HF, fontWeight: 800, fontSize: 28, letterSpacing: 0.4 }}>Loadout</span>
          <span style={{ flex: 1 }} />
          {D.scrap != null && <span style={{ display: 'flex', alignItems: 'center', gap: 5, height: 30, padding: '0 10px', borderRadius: 4, background: 'rgba(12,16,24,0.78)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.14)', fontFamily: HF, fontWeight: 700, fontSize: 16, color: '#FFD45A' }}><GIcon k="star" size={13} color="#FFD45A" ink="transparent" />{`${D.scrap} scrap`}</span>}
        </div>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 10 }}>
          <div style={{ width: leftW, flexShrink: 0, display: 'flex', flexDirection: 'column', background: PANEL, boxShadow: `0 0 0 1px ${EDGE}`, borderRadius: 3, overflow: 'hidden', pointerEvents: 'auto' }}>
            <PHead title="Heroes" right={<span style={{ fontSize: 11.5, fontWeight: 800, color: 'rgba(255,255,255,0.6)' }}>{`${E.HERO_KEYS.length} heroes`}</span>} />
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 8, display: 'grid', gridTemplateColumns: `repeat(4, ${tileW}px)`, gap: 6, alignContent: 'start', touchAction: 'pan-y' }}>
              {E.HERO_KEYS.map((hk) => {
                const on = hk === D.heroKey, L0 = D.levels ? D.levels[hk] || 1 : 1, HH = E.HEROES[hk], lock = D.taken(hk);
                return (
                  <Btn key={hk} label={`${HH.name}, ${HH.role}, level ${L0}${lock ? ', taken' : ''}`} onPress={() => D.onPick(hk)} style={{ position: 'relative', width: tileW, height: tileW * 1.22, borderRadius: 3, overflow: 'hidden', opacity: lock ? 0.45 : 1, background: `linear-gradient(180deg, ${HH.col}55, #121722 80%)`, boxShadow: on ? `0 0 0 2px ${GOLD}` : `inset 0 0 0 1px ${EDGE}` }}>
                    {D.thumbs[hk] ? <img src={D.thumbs[hk]} alt="" draggable={false} style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: tileW * 1.22 - 18, objectFit: 'cover', display: 'block' }} /> : null}
                    <span style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 19, background: on ? 'rgba(242,178,27,0.92)' : 'rgba(4,6,12,0.86)', color: on ? '#1E1300' : '#FFFFFF', fontFamily: HF, fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{lock ? 'Taken' : HH.name}</span>
                    <span style={{ position: 'absolute', right: 2, top: 2, minWidth: 17, height: 17, padding: '0 3px', boxSizing: 'border-box', borderRadius: 2, background: 'rgba(4,6,12,0.82)', fontFamily: HF, fontWeight: 700, fontSize: 13, color: '#FFD45A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{L0}</span>
                  </Btn>
                );
              })}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: HF, fontStyle: 'italic', fontWeight: 700, fontSize: 44, lineHeight: 0.95, textShadow: '0 3px 10px rgba(0,0,0,0.7)' }}>{H.name}</span>
            <span style={{ fontFamily: HF, fontWeight: 700, fontSize: 17, color: H.col, textShadow: '0 2px 6px rgba(0,0,0,0.7)' }}>{H.role}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '5px 10px', background: 'rgba(9,12,19,0.82)', boxShadow: `0 0 0 1px ${EDGE}`, borderRadius: 3, pointerEvents: 'auto' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.62)' }}>Colour</span>
              {[0, 1, 2, 3].map((c) => <Btn key={c} label={`Colour ${c + 1}`} onPress={() => D.onCol(c)} style={{ width: 22, height: 22, borderRadius: 2, background: D.tint(D.heroKey, c), boxShadow: D.col === c ? `0 0 0 2px #0B0E15, 0 0 0 4px ${GOLD}` : 'inset 0 0 0 1px rgba(0,0,0,0.3)' }} />)}
            </div>
            {D.team && <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: 'rgba(9,12,19,0.82)', boxShadow: `0 0 0 1px ${EDGE}`, borderRadius: 3, pointerEvents: 'auto' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.62)', marginRight: 2 }}>Skill</span>
              {T.SKILL_KEYS.map((sk) => <Btn key={sk} label={`Battle skill, ${T.SKILLS[sk].name}`} onPress={() => D.onSkill(sk)} style={{ width: 30, height: 30, borderRadius: 15, background: '#0D111C', boxShadow: D.skill === sk ? `0 0 0 2px ${GOLD}` : '0 0 0 1px rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><SkIcon k={`sk.${sk}`} size={28} dim={D.skill !== sk} /></Btn>)}
            </div>}
            {D.team && <span style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.78)', textShadow: '0 1px 3px rgba(0,0,0,0.8)', textAlign: 'center' }}><span style={{ color: '#FFD45A', fontWeight: 900 }}>{T.SKILLS[D.skill] ? T.SKILLS[D.skill].name : ''}</span>{T.SKILLS[D.skill] ? `. ${T.SKILLS[D.skill].text}` : ''}</span>}
          </div>
          <div style={{ width: rightW, flexShrink: 0, display: 'flex', flexDirection: 'column', background: PANEL, boxShadow: `0 0 0 1px ${EDGE}`, borderRadius: 3, overflow: 'hidden', pointerEvents: 'auto' }}>
            <PHead title="Hero card" right={<span style={{ display: 'flex', alignItems: 'center', gap: 3, fontFamily: HF, fontWeight: 700, fontSize: 16, color: '#FFD45A' }}><GIcon k="bolt" size={12} color="#FFD45A" ink="transparent" />{`Level ${lvl}`}</span>} />
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 8, touchAction: 'pan-y' }}>
              <div style={{ display: 'flex', gap: 2 }}>{Array.from({ length: E.MAX_LEVEL }, (_, i) => <span key={i} style={{ flex: 1, height: 5, background: i < lvl ? GOLD : 'rgba(255,255,255,0.12)', transform: 'skewX(-18deg)' }} />)}</div>
              <Bar label="Health" f={hpNow / 7000} text={hpNow.toLocaleString()} add={!top ? `+${(hpNext - hpNow).toLocaleString()}` : null} col="linear-gradient(90deg, #3FBF62, #6BF28E)" />
              <Bar label="Damage" f={dNow / 2000} text={`${dNow.toLocaleString()} a shot`} add={!top ? `+${(dNext - dNow).toLocaleString()}` : null} col="linear-gradient(90deg, #E5483B, #FF8A5C)" />
              <Bar label="Range" f={H.stats[2] / 5} text={RANGE_T[H.stats[2]]} col="linear-gradient(90deg, #2563C4, #6FB8FF)" />
              <Bar label="Speed" f={H.stats[3] / 5} text={SPEED_T[H.stats[3]]} col="linear-gradient(90deg, #8045E6, #C08BFF)" />
              {abil.map(([sl, lab, nm, tx]) => (
                <div key={sl} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ width: 34, height: 34, borderRadius: 17, flexShrink: 0, background: '#0D111C', boxShadow: `0 0 0 1.5px ${sl === 'sup' ? GOLD : 'rgba(255,255,255,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{heroIc(D.heroKey, sl) ? <SkIcon k={heroIc(D.heroKey, sl)} size={32} /> : null}</span>
                  <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}><span style={{ fontFamily: HF, fontWeight: 700, fontSize: 16 }}>{nm}</span><span style={{ fontSize: 10.5, fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>{lab}</span></span>
                    <span style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.3, color: 'rgba(255,255,255,0.7)' }}>{tx}</span>
                  </span>
                </div>
              ))}
            </div>
            <div style={{ padding: 8, borderTop: `1px solid ${EDGE}`, display: 'flex', flexDirection: 'column', gap: 5 }}>
              {D.scrap == null ? <span style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.65)' }}>Hero levels show up once they load.</span>
                : top ? <span style={{ fontFamily: HF, fontWeight: 700, fontSize: 17, color: '#FFD45A', textAlign: 'center' }}>{`${H.name} is at the top level`}</span>
                  : <Btn label={`Upgrade ${H.name} for ${cost} scrap`} off={D.upBusy || short > 0} onPress={D.onUpgrade} style={{ height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: short > 0 ? 'rgba(255,255,255,0.1)' : 'linear-gradient(180deg, #FFD84A, #F2A60C)', color: short > 0 ? 'rgba(255,255,255,0.6)' : '#1E1300', clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)' }}>
                    <LineIcon k="up" size={17} color={short > 0 ? 'rgba(255,255,255,0.6)' : '#1E1300'} w={2.6} />
                    <span style={{ fontFamily: HF, fontWeight: 800, fontSize: 19 }}>{D.upBusy ? 'Upgrading' : `Upgrade to level ${lvl + 1}`}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontFamily: HF, fontWeight: 700, fontSize: 16 }}><GIcon k="star" size={12} color={short > 0 ? 'rgba(255,255,255,0.6)' : '#1E1300'} ink="transparent" />{cost}</span>
                  </Btn>}
              {D.scrap != null && !top && <span style={{ fontSize: 11, fontWeight: 700, color: short > 0 ? '#FFB49A' : 'rgba(255,255,255,0.6)', textAlign: 'center' }}>{short > 0 ? `You need ${short} more scrap. Play matches to earn it.` : 'Upgrades last forever and count toward your power.'}</span>}
              {D.upMsg ? <span style={{ fontSize: 11.5, fontWeight: 800, color: '#FFB49A', textAlign: 'center' }}>{D.upMsg}</span> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

let resCss = false;
function useResultCss() {
  useEffect(() => {
    if (resCss || typeof document === 'undefined') return;
    resCss = true;
    const st = document.createElement('style');
    st.textContent = '@keyframes zres-pop{0%{opacity:0;transform:scale(1.5)}60%{opacity:1;transform:scale(0.96)}100%{opacity:1;transform:scale(1)}}@keyframes zres-band{0%{transform:scaleX(0)}100%{transform:scaleX(1)}}@keyframes zres-in{0%{opacity:0;transform:translateY(10px)}100%{opacity:1;transform:none}}@media (prefers-reduced-motion: reduce){.zres-a{animation:none!important}}';
    document.head.appendChild(st);
  }, []);
}
const rateOf = (r) => r.k * 3 + r.a * 1.2 - r.d * 0.6 + (r.dmg || 0) / 2500;
const fmtD = (n) => (n >= 10000 ? `${Math.round(n / 1000)}k` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n | 0));
function ResTable({ title, color, score, emb, cols, rows, myK, thumbs, nameOf, mvpId, rh = 27, anim = true }) {
  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: PANEL, boxShadow: `0 0 0 1px ${EDGE}`, borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 32, flexShrink: 0, padding: '0 10px 0 8px', background: color ? `linear-gradient(90deg, ${color.b}CC, ${color.b}33 75%, rgba(0,0,0,0))` : 'linear-gradient(90deg, rgba(242,178,27,0.2), rgba(255,255,255,0.03) 75%)', boxShadow: `inset 3px 0 0 ${color ? color.a : GOLD}` }}>
        {emb && <Emblem k={emb} size={22} color={color.t} />}
        <span style={{ flex: 1, minWidth: 0, fontFamily: HF, fontStyle: 'italic', fontWeight: 700, fontSize: 18.5, color: color ? color.t : '#FFFFFF', whiteSpace: 'nowrap' }}>{title}</span>
        {score != null && <span style={{ fontFamily: HF, fontWeight: 800, fontSize: 22, lineHeight: 1 }}>{score}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 20, padding: '0 8px', fontSize: 10.5, fontWeight: 800, color: 'rgba(255,255,255,0.5)', borderBottom: `1px solid ${EDGE}` }}>
        <span style={{ flex: 1 }}>Player</span>
        {cols.map(([lab, w]) => <span key={lab} style={{ width: w, textAlign: 'right' }}>{lab}</span>)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {rows.map((r, i) => {
          const me = r.id === myK;
          return (
            <div key={r.id} className="zres-a" style={{ display: 'flex', alignItems: 'center', gap: 4, height: rh, padding: '0 8px', opacity: r.dim ? 0.55 : 1, background: me ? 'linear-gradient(90deg, rgba(242,178,27,0.26), rgba(242,178,27,0.06))' : i % 2 ? 'rgba(255,255,255,0.03)' : 'transparent', boxShadow: me ? `inset 2px 0 0 ${GOLD}` : 'none', animation: anim ? `zres-in 0.35s ease-out ${0.35 + i * 0.05}s both` : 'none' }}>
              <span style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 21, height: 21, borderRadius: 3, overflow: 'hidden', flexShrink: 0, background: '#141A2C', boxShadow: `0 0 0 1px ${color ? color.a : 'rgba(255,255,255,0.3)'}` }}>{thumbs[r.key] ? <img src={thumbs[r.key]} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : null}</span>
                <span style={{ minWidth: 0, fontSize: 13, fontWeight: 800, color: me ? '#FFD45A' : '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{me ? 'You' : nameOf(r.id)}</span>
                {r.id === mvpId && <span style={{ flexShrink: 0, height: 15, padding: '0 5px', borderRadius: 2, background: 'linear-gradient(180deg, #FFE27A, #F5B321)', color: '#2A1D05', fontFamily: HF, fontWeight: 800, fontSize: 12, lineHeight: '15px' }}>MVP</span>}
                {r.note ? <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>{r.note}</span> : null}
              </span>
              {r.v.map((v, j) => <span key={j} style={{ width: cols[j][1], textAlign: 'right', fontFamily: HF, fontWeight: 700, fontSize: 16, fontVariantNumeric: 'tabular-nums', color: j === 0 && cols[0][0] === 'Lv' ? '#FFD45A' : '#FFFFFF' }}>{v}</span>)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
export function SiegeResult({ R }) {
  useLobbyFont();
  useResultCss();
  const GS = R.GS;
  const land = GS.W >= GS.H * 1.1;
  const BW = land ? 860 : 430, BH = land ? 396 : 860;
  const k = Math.max(0.62, Math.min(1.7, GS.W / BW, GS.H / BH));
  const W0 = GS.W / k, H0 = GS.H / k;
  const tone = R.tone;
  const tc = tone === 'win' ? '#FFD84A' : tone === 'lose' ? '#FF7C88' : tone === 'draw' ? '#9CC8FF' : '#FFFFFF';
  const band = tone === 'win' ? 'rgba(242,170,20,0.42)' : tone === 'lose' ? 'rgba(200,34,58,0.42)' : 'rgba(60,110,200,0.38)';
  const my = R.my === 1 ? 1 : 0;
  const col = (tm) => TC[R.rel ? (tm === my ? 0 : 1) : tm];
  const rows = R.rows || [];
  const waves = !!R.waves;
  const mvp = rows.length > 1 && !R.lost ? rows.reduce((a, b) => ((waves ? b.k * 2 + b.dmg / 2000 : rateOf(b)) > (waves ? a.k * 2 + a.dmg / 2000 : rateOf(a)) ? b : a), rows[0]) : null;
  const cols = waves ? [['Aliens', 46], ['Damage', 52], ['Revives', 50]] : [['Lv', 26], ['K', 26], ['D', 26], ['A', 26], ['Damage', 50]];
  const vals = (r) => (waves ? [r.k, fmtD(r.dmg), r.rev | 0] : [r.tl, r.k, r.d, r.a, fmtD(r.dmg)]);
  const side = (tm) => rows.filter((r) => r.tm === tm).map((r) => ({ ...r, v: vals(r) }));
  const order = R.rel ? [my, 1 - my] : [0, 1];
  const tName = (tm) => (R.rel ? (tm === my ? 'Your team' : 'Enemy team') : col(tm).name);
  const perSide = waves ? rows.length : Math.max(1, ...[0, 1].map((t) => rows.filter((r) => r.tm === t).length));
  const rh = perSide >= 5 ? 23 : perSide === 4 ? 25 : 27;
  const mvpStats = mvp ? (waves ? [['Aliens', mvp.k], ['Damage', fmtD(mvp.dmg)]] : [['Takedowns', mvp.k], ['Damage', fmtD(mvp.dmg)]]) : [];
  const mvpCard = mvp && (
    <div className="zres-a" style={{ width: land ? 150 : '100%', flexShrink: 0, display: 'flex', flexDirection: land ? 'column' : 'row', alignItems: land ? 'stretch' : 'center', gap: land ? 6 : 12, padding: land ? '7px 9px 9px' : 10, boxSizing: 'border-box', background: `linear-gradient(180deg, rgba(242,178,27,0.2), ${PANEL} 55%)`, boxShadow: `0 0 0 1px rgba(242,178,27,0.45)`, borderRadius: 3, animation: 'zres-in 0.4s ease-out 0.3s both' }}>
      {land && <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: HF, fontWeight: 800, fontSize: 17, lineHeight: 1, color: '#FFD45A' }}><GIcon k="crown" size={15} color="#FFD45A" ink="transparent" />MVP</span>}
      <span style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0, flex: land ? 'none' : 1 }}>
        <span style={{ width: land ? 58 : 60, height: land ? 58 : 60, borderRadius: 4, overflow: 'hidden', flexShrink: 0, background: 'radial-gradient(circle at 50% 35%, #33415E, #121827)', boxShadow: `0 0 0 2px ${waves ? GOLD : col(mvp.tm).a}` }}>{R.thumbs[mvp.key] ? <img src={R.thumbs[mvp.key]} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : null}</span>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
          {!land && <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: HF, fontWeight: 800, fontSize: 15, color: '#FFD45A' }}><GIcon k="crown" size={13} color="#FFD45A" ink="transparent" />MVP</span>}
          <span style={{ fontFamily: HF, fontWeight: 800, fontSize: 21, lineHeight: 1.05, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mvp.id === R.myK ? 'You' : R.nameOf(mvp.id)}</span>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap' }}>{E.HEROES[mvp.key] ? E.HEROES[mvp.key].name : ''}</span>
        </span>
      </span>
      <span style={{ display: 'flex', gap: 12, justifyContent: land ? 'space-around' : 'flex-end' }}>
        {mvpStats.map(([a, b]) => (
          <span key={a} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
            <span style={{ fontFamily: HF, fontWeight: 800, fontSize: 22 }}>{b}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{a}</span>
          </span>
        ))}
      </span>
    </div>
  );
  const scoreRow = waves ? (
    <div className="zres-a" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, animation: 'zres-in 0.4s ease-out 0.2s both' }}>
      <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}><span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Wave</span><span style={{ fontFamily: HF, fontWeight: 800, fontSize: 40, lineHeight: 1 }}>{R.wave}</span></span>
      {R.best > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 5, height: 26, padding: '0 9px', borderRadius: 3, background: 'rgba(242,178,27,0.16)', boxShadow: 'inset 0 0 0 1px rgba(242,178,27,0.5)', fontFamily: HF, fontWeight: 700, fontSize: 16, color: '#FFD45A' }}>{R.newBest ? `New best, wave ${R.best}` : `Best wave ${R.best}`}</span>}
      {R.score > 0 && <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}><span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Score</span><span style={{ fontFamily: HF, fontWeight: 800, fontSize: 26 }}>{R.score.toLocaleString()}</span></span>}
    </div>
  ) : !R.lost && (
    <div className="zres-a" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: land ? 14 : 8, animation: 'zres-in 0.4s ease-out 0.2s both' }}>
      <Emblem k={col(order[0]).emb} size={30} color={col(order[0]).a} glow={`${col(order[0]).a}88`} />
      <span style={{ fontFamily: HF, fontStyle: 'italic', fontWeight: 700, fontSize: 19, color: col(order[0]).t, whiteSpace: 'nowrap' }}>{tName(order[0])}</span>
      <span style={{ fontFamily: HF, fontWeight: 800, fontSize: 42, lineHeight: 1, minWidth: 44, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{R.sc[order[0]]}</span>
      <span style={{ fontFamily: HF, fontWeight: 700, fontSize: 30, lineHeight: 1, color: 'rgba(255,255,255,0.45)' }}>:</span>
      <span style={{ fontFamily: HF, fontWeight: 800, fontSize: 42, lineHeight: 1, minWidth: 44, fontVariantNumeric: 'tabular-nums' }}>{R.sc[order[1]]}</span>
      <span style={{ fontFamily: HF, fontStyle: 'italic', fontWeight: 700, fontSize: 19, color: col(order[1]).t, whiteSpace: 'nowrap' }}>{tName(order[1])}</span>
      <Emblem k={col(order[1]).emb} size={30} color={col(order[1]).a} glow={`${col(order[1]).a}88`} />
    </div>
  );
  const tables = R.lost || !rows.length ? null : waves ? (
    <ResTable title="Your squad" cols={cols} rows={rows.map((r) => ({ ...r, v: vals(r) }))} myK={R.myK} thumbs={R.thumbs} nameOf={R.nameOf} mvpId={mvp && mvp.id} rh={rh} />
  ) : order.map((tm) => <ResTable key={tm} title={tName(tm)} color={col(tm)} emb={col(tm).emb} score={R.sc[tm]} cols={cols} rows={side(tm)} myK={R.myK} thumbs={R.thumbs} nameOf={R.nameOf} mvpId={mvp && mvp.id} rh={rh} />);
  const reward = R.scrap != null && R.scrap > 0 && (
    <span className="zres-a" style={{ display: 'flex', alignItems: 'center', gap: 7, height: 36, padding: '0 12px', borderRadius: 3, background: 'rgba(12,16,24,0.82)', boxShadow: 'inset 0 0 0 1px rgba(242,178,27,0.5)', animation: 'zres-in 0.35s ease-out both' }}>
      <GIcon k="star" size={18} color="#FFD45A" ink="transparent" />
      <span style={{ fontFamily: HF, fontWeight: 800, fontSize: 20, color: '#FFD45A' }}>{`+${R.scrap}`}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>scrap</span>
    </span>
  );
  const skew = 'polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%)';
  const dark = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, height: 46, padding: '0 22px', background: 'rgba(12,16,24,0.86)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.2)', clipPath: skew, fontFamily: HF, fontWeight: 700, fontSize: 20 };
  const buttons = R.host ? (
    <>
      <Btn label={R.solo ? 'Leave' : 'Back to chat'} onPress={R.onLeave} style={dark}>{R.solo ? 'Leave' : 'Back to chat'}</Btn>
      <Btn label="Lobby" onPress={R.onLobby} style={dark}>Lobby</Btn>
      <Btn label="Play again" onPress={R.onAgain} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, width: land ? 200 : 'auto', flex: land ? 'none' : 1, height: 50, background: 'linear-gradient(180deg, #FFD84A, #F2A60C)', clipPath: skew, color: '#1E1300', boxShadow: 'inset 0 -3px 0 rgba(120,70,0,0.45), inset 0 2px 0 rgba(255,255,255,0.5)' }}>
        <svg width="16" height="18" viewBox="0 0 16 18" aria-hidden="true"><path d="M1 1.5v15l13.5-7.5z" fill="#1E1300" /></svg>
        <span style={{ fontFamily: HF, fontWeight: 800, fontSize: 25, letterSpacing: 0.3 }}>Play again</span>
      </Btn>
    </>
  ) : (
    <>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>{`${R.hostName} picks what is next`}</span>
      <Btn label="Back to chat" onPress={R.onLeave} style={dark}>Back to chat</Btn>
    </>
  );
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 20, overflow: 'hidden', fontFamily: FONT, color: '#FFFFFF', background: 'radial-gradient(ellipse at 50% 40%, rgba(5,8,14,0.74), rgba(2,4,8,0.95) 80%)' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: W0, height: H0, transform: k === 1 ? 'none' : `scale(${k})`, transformOrigin: '0 0', boxSizing: 'border-box', padding: `${GS.at.top(8)} ${GS.at.right(14)} ${GS.at.bottom(10)} ${GS.at.left(14)}`, display: 'flex', flexDirection: 'column', gap: land ? 6 : 10 }}>
        <div style={{ position: 'relative', height: land ? 62 : 84, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div aria-hidden="true" className="zres-a" style={{ position: 'absolute', left: '6%', right: '6%', top: 8, bottom: 8, background: `linear-gradient(90deg, rgba(0,0,0,0), ${band} 28%, ${band} 72%, rgba(0,0,0,0))`, clipPath: 'polygon(2% 0, 100% 0, 98% 100%, 0 100%)', animation: 'zres-band 0.45s ease-out both' }} />
          <span className="zres-a" style={{ position: 'relative', fontFamily: HF, fontStyle: 'italic', fontWeight: 800, fontSize: land ? 52 : 54, lineHeight: 1, letterSpacing: 1.5, color: tc, textShadow: '0 4px 16px rgba(0,0,0,0.65)', animation: 'zres-pop 0.5s ease-out 0.1s both', whiteSpace: 'nowrap' }}>{R.title}</span>
          {R.sub ? <span className="zres-a" style={{ position: 'relative', fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,0.82)', marginTop: 3, animation: 'zres-in 0.4s ease-out 0.3s both' }}>{R.sub}</span> : null}
        </div>
        {scoreRow}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: land ? 'row' : 'column', alignItems: land ? 'flex-start' : 'stretch', justifyContent: 'center', gap: 10, overflowY: land ? 'visible' : 'auto' }}>
          {mvpCard}
          {tables}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, flexWrap: land ? 'nowrap' : 'wrap', justifyContent: 'flex-end' }}>
          {reward}
          {R.info ? <span style={{ minWidth: 0, fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{R.info}</span> : null}
          <span style={{ flex: 1 }} />
          {buttons}
        </div>
      </div>
    </div>
  );
}

export function SiegeBoard({ B }) {
  useLobbyFont();
  const GS = B.GS;
  const k = Math.max(0.62, Math.min(1.7, GS.W / 860, GS.H / 396));
  const W0 = GS.W / k, H0 = GS.H / k;
  const my = B.my === 1 ? 1 : 0;
  const rows = B.rows || [];
  const per = Math.max(1, ...[0, 1].map((t) => rows.filter((r) => r.tm === t).length));
  const rh = per >= 5 ? 24 : 27;
  const cols = [['Lv', 26], ['K', 26], ['D', 26], ['A', 26], ['Damage', 50]];
  const side = (tm) => rows.filter((r) => r.tm === tm).map((r) => ({ ...r, dim: r.dead, note: r.dead && r.resp > 0 ? `${Math.ceil(r.resp)}s` : '', v: [r.tl, r.k, r.d, r.a, fmtD(r.dmg)] }));
  const order = [my, 1 - my];
  return (
    <div onPointerDown={(e) => e.stopPropagation()} style={{ position: 'absolute', inset: 0, zIndex: 40, overflow: 'hidden', fontFamily: FONT, color: '#FFFFFF', background: 'rgba(3,5,9,0.8)' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: W0, height: H0, transform: k === 1 ? 'none' : `scale(${k})`, transformOrigin: '0 0', boxSizing: 'border-box', padding: `${GS.at.top(10)} ${GS.at.right(14)} ${GS.at.bottom(10)} ${GS.at.left(14)}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 40, flexShrink: 0 }}>
          <span style={{ fontFamily: HF, fontWeight: 800, fontSize: 26, letterSpacing: 0.4 }}>Scoreboard</span>
          {B.info ? <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{B.info}</span> : null}
          <span style={{ flex: 1 }} />
          <SqBtn label="Close" icon={<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" /></svg>} size={38} onPress={B.onClose} />
        </div>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          {order.map((tm, i) => <ResTable key={tm} title={i === 0 ? 'Your team' : 'Enemy team'} color={TC[i]} emb={TC[i].emb} score={B.sc[tm]} cols={cols} rows={side(tm)} myK={B.myK} thumbs={B.thumbs} nameOf={B.nameOf} rh={rh} anim={false} />)}
        </div>
      </div>
    </div>
  );
}
