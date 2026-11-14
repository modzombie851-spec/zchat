import React, { useEffect, useRef, useState } from 'react';
import { SkillFace } from './gskill.jsx';
import { MetalFace, MetalRing, BoxFrame, hasMIcon } from './zbtn.jsx';

const P = {
  fire: <><circle cx="12" cy="12" r="7.2" /><path d="M12 2.5v4.2M12 17.3v4.2M2.5 12h4.2M17.3 12h4.2" /><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" /></>,
  bullet: <><path d="M9.5 9.2c0-3.4 1.1-5.7 2.5-6.7 1.4 1 2.5 3.3 2.5 6.7v8.3h-5z" /><path d="M8.6 17.5h6.8v3.3H8.6z" /></>,
  scope: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M12 1.8v5.2M12 17v5.2M1.8 12h5.2M17 12h5.2" /></>,
  mag: <><path d="M8.4 3.5h6.4l-.6 6.2 1.9 9.8a1 1 0 0 1-1 1.2H9.4a1 1 0 0 1-1-1.1l.8-9.9z" /><path d="M9.4 7.5h4.8M9.2 11h5.4" /></>,
  grenade: <><path d="M12 8.2a6 6 0 1 1-.01 0z" /><path d="M10.2 8.6V5.8h3.6v2.8M13.8 6.4l3.4-2.2M17.2 4.2l1.3 2.6" /><path d="M8.6 14.2h6.8M12 10.8v6.8" opacity=".55" /></>,
  bottle: <><path d="M10 2.8h4v3.6l1.6 2.4v11.3a1.2 1.2 0 0 1-1.2 1.2H9.6a1.2 1.2 0 0 1-1.2-1.2V8.8L10 6.4z" /><path d="M8.4 13h7.2" /><path d="M12 1.2c1.2.8 1.6 1.8 1.2 2.8" /></>,
  plate: <><path d="M7.2 3.6h9.6l2.7 3.1v11.6a2 2 0 0 1-2 2H6.5a2 2 0 0 1-2-2V6.7z" /><path d="M8.2 9.6h7.6M8.2 13.2h7.6" opacity=".6" /></>,
  c4: <><path d="M3.8 9.2h16.4v8.6H3.8z" /><path d="M7.6 9.2v8.6M16.4 9.2v8.6" opacity=".6" /><path d="M10.2 11.6h3.6v2.6h-3.6z" /><path d="M6 9.2c0-2.6 1.8-4 4.2-3.8M18 9.2c0-2.2-1.4-3.6-3.6-3.6" /></>,
  det: <><path d="M8.2 9h7.6a1.6 1.6 0 0 1 1.6 1.6v8.2a1.6 1.6 0 0 1-1.6 1.6H8.2a1.6 1.6 0 0 1-1.6-1.6v-8.2A1.6 1.6 0 0 1 8.2 9z" /><path d="M14.6 9V3.6" /><path d="M12 13.4a1.9 1.9 0 1 0 .01 0z" /><path d="M17.4 4.4a3 3 0 0 1 2.1 2.1M17.2 1.8a5.6 5.6 0 0 1 4.6 4.6" /></>,
  knife: <><path d="M4.2 19.8l9.3-9.3 2.6 2.6-9.3 9.3H4.2z" /><path d="M13.5 10.5l5.8-6.9 1.1 1.1-6.9 5.8" /><path d="M11.6 8.6l4.5 4.5" /></>,
  swap: <><path d="M5 8.5h13M14.5 5l3.5 3.5-3.5 3.5M19 15.5H6M9.5 12L6 15.5 9.5 19" /></>,
  jump: <><path d="M6.5 12.5L12 7l5.5 5.5" /><path d="M6.5 18L12 12.5l5.5 5.5" opacity=".6" /><path d="M5 21h14" opacity=".45" /></>,
  crouch: <><circle cx="14.4" cy="4.6" r="2.15" fill="currentColor" stroke="none" /><path d="M13.6 7.8l-2.9 5.4 5 1.2-.4 6" /><path d="M10.7 13.2l-1.1 6.2H5.8" /><path d="M12.9 9.4l5.2 1.1" /><path d="M3.8 21.6h16.4" opacity=".45" /></>,
  slide: <><circle cx="6.8" cy="8.4" r="2.1" fill="currentColor" stroke="none" /><path d="M8.4 10.6l4.4 5.2 7.8 1.8" /><path d="M12.8 15.8l-1.7 3.6 4 .8" /><path d="M9.5 11.9l-4.3 3" /><path d="M1.8 18.5h3.4M3 15.6h2.2" opacity=".6" /><path d="M3.8 21.6h17" opacity=".45" /></>,
  smile: <><circle cx="12" cy="12" r="8.6" /><path d="M8.2 14.2c1 1.5 2.3 2.2 3.8 2.2s2.8-.7 3.8-2.2" /><circle cx="9" cy="10" r="1.1" fill="currentColor" stroke="none" /><circle cx="15" cy="10" r="1.1" fill="currentColor" stroke="none" /></>,
  chat: <><path d="M4.5 5.5h15a1.5 1.5 0 0 1 1.5 1.5v8.4a1.5 1.5 0 0 1-1.5 1.5H11l-4.6 3.6v-3.6H4.5A1.5 1.5 0 0 1 3 15.4V7a1.5 1.5 0 0 1 1.5-1.5z" /></>,
  people: <><circle cx="9" cy="8.5" r="3.3" /><path d="M2.8 19.5c.6-3.4 3-5.3 6.2-5.3s5.6 1.9 6.2 5.3" /><path d="M15.5 5.6a3.1 3.1 0 0 1 0 5.9M17.4 14.6c2 .7 3.4 2.4 3.8 4.9" /></>,
  pause: <><path d="M8.5 5v14M15.5 5v14" /></>,
  gear: <><path d="M10.72 5.02L10.91 2.76L13.09 2.76L13.28 5.02A7.1 7.1 0 0 1 16.04 6.16L17.76 4.70L19.30 6.24L17.84 7.96A7.1 7.1 0 0 1 18.98 10.72L21.24 10.91L21.24 13.09L18.98 13.28A7.1 7.1 0 0 1 17.84 16.04L19.30 17.76L17.76 19.30L16.04 17.84A7.1 7.1 0 0 1 13.28 18.98L13.09 21.24L10.91 21.24L10.72 18.98A7.1 7.1 0 0 1 7.96 17.84L6.24 19.30L4.70 17.76L6.16 16.04A7.1 7.1 0 0 1 5.02 13.28L2.76 13.09L2.76 10.91L5.02 10.72A7.1 7.1 0 0 1 6.16 7.96L4.70 6.24L6.24 4.70L7.96 6.16A7.1 7.1 0 0 1 10.72 5.02Z" /><circle cx="12" cy="12" r="3" /></>,
  paw: <><ellipse cx="12" cy="15.5" rx="4.4" ry="3.6" /><circle cx="6.4" cy="10.4" r="1.7" /><circle cx="9.6" cy="6.8" r="1.7" /><circle cx="14.4" cy="6.8" r="1.7" /><circle cx="17.6" cy="10.4" r="1.7" /></>,
  heart: <><path d="M12 20s-7.5-4.6-7.5-10.1A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z" /><path d="M12 10.3v5.2M9.4 12.9h5.2" /></>,
  run: <><circle cx="14.6" cy="4.4" r="1.9" /><path d="M9 21l2.6-5.4 3 2.4v3.6M8.2 9.6l3.6-2.4 3.2 2.6 3.4.6M11.8 7.2l-1.4 6.4 3.4 2.4M6.8 13.4l2.8-.6" /></>,
  invite: <><circle cx="9.5" cy="8.4" r="3.4" /><path d="M3 19.6c.6-3.5 3.2-5.5 6.5-5.5 2 0 3.7.7 4.9 2" /><path d="M18 11.5v7M14.5 15h7" /></>,
  close: <><path d="M6 6l12 12M18 6L6 18" /></>,
  bag: <><path d="M9 6.5V5a3 3 0 0 1 6 0v1.5" /><path d="M5.5 9.5a3 3 0 0 1 3-3h7a3 3 0 0 1 3 3V19a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 5.5 19z" /><path d="M9 13.5h6v3.5H9z" /></>,
  bandage: <><path d="M5.2 14.6l9.4-9.4a3 3 0 0 1 4.2 4.2l-9.4 9.4a3 3 0 0 1-4.2-4.2z" /><path d="M10 10l4 4" /><circle cx="11.2" cy="12.8" r=".3" /><circle cx="12.8" cy="11.2" r=".3" /></>,
  syringe: <><path d="M14.5 4.5l5 5M17 7l-8.8 8.8-2.9.6.6-2.9L14.7 4.7" /><path d="M10.6 8.2l1.6 1.6M8.6 10.2l1.6 1.6M5.4 18.6L3.8 20.2" /></>,
  shop: <><path d="M2.5 4.5h3l2.6 11.4h10.4" /><path d="M6.6 7h13.4l-1.6 6.1H7.9" /><circle cx="9.6" cy="19.6" r="1.5" /><circle cx="17" cy="19.6" r="1.5" /></>,
  cam: <><circle cx="12" cy="9" r="2.8" /><path d="M7 19.5c.7-3 2.6-4.6 5-4.6s4.3 1.6 5 4.6" /><path d="M4.2 13.5A8.2 8.2 0 0 1 7 4.6M19.8 13.5A8.2 8.2 0 0 0 17 4.6" /><path d="M5.8 3.8L7 4.6l-.4 1.4M18.2 3.8L17 4.6l.4 1.4" /></>,
  map: <><path d="M3.5 6.2l5.5-2.2 6 2.2 5.5-2.2v13.6l-5.5 2.2-6-2.2-5.5 2.2z" /><path d="M9 4v13.6M15 6.2v13.6" /></>,
  down: <><path d="M6 9l6 6 6-6" /></>,
  left: <><path d="M15 6l-6 6 6 6" /></>,
  mic: <><path d="M12 3.2a2.9 2.9 0 0 1 2.9 2.9v5.6a2.9 2.9 0 0 1-5.8 0V6.1A2.9 2.9 0 0 1 12 3.2z" /><path d="M6 11.4a6 6 0 0 0 12 0M12 17.4v3.4" /></>,
  micoff: <><path d="M12 3.2a2.9 2.9 0 0 1 2.9 2.9v5.6a2.9 2.9 0 0 1-5.8 0V6.1A2.9 2.9 0 0 1 12 3.2z" /><path d="M6 11.4a6 6 0 0 0 12 0M12 17.4v3.4M4.5 4.5l15 15" /></>,
  spk: <><path d="M4.5 9.5h3.2l4.3-3.6v12.2l-4.3-3.6H4.5z" /><path d="M15.4 9.2a4 4 0 0 1 0 5.6M17.8 6.8a7.4 7.4 0 0 1 0 10.4" /></>,
  spkoff: <><path d="M4.5 9.5h3.2l4.3-3.6v12.2l-4.3-3.6H4.5z" /><path d="M15.5 9.5l5 5M20.5 9.5l-5 5" /></>,
  right: <><path d="M9 6l6 6-6 6" /></>,
};

export function Ico({ k, size = 22, sw = 1.7, color = '#FFFFFF' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: 'block', color }}>{P[k] || null}</svg>;
}

const CB_ICON = { emote: 'hand', bullet: 'bullets', scope: 'crosshair', mag: 'magazine', knife: 'knife', grenade: 'grenade', bottle: 'molotov', heart: 'revive', torch: 'flashlight', swap: 'cycle' };

const ZG = {
  bullet: '<path d="M24 4.5c4.3 3.6 6.4 8.4 6.4 14.2V22H17.6v-3.3c0-5.8 2.1-10.6 6.4-14.2z"/><rect x="17.6" y="24" width="12.8" height="14.5" rx="1"/><rect x="16" y="40.2" width="16" height="3.6" rx="1"/>',
  scope: '<circle cx="24" cy="24" r="12.5" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="3.4"/><path d="M24 3.5v11M24 33.5v11M3.5 24h11M33.5 24h11" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="3.4"/><circle cx="24" cy="24" r="3"/>',
  mag: '<path d="M19.4 5c.3-1.8 1.6-2.7 3.2-2.7s2.9.9 3.2 2.7z"/><path d="M17 5.6h13c.4 12 2 24.4 5.4 35.4L23.3 43.4C20.4 31.9 18.2 18.6 17 5.6z"/><path d="M19.6 15.5h11.3M20.6 22.5h11.3M21.8 29.5h11.2" stroke="rgba(0,0,0,0.45)" stroke-width="1.7" fill="none"/>',
  knife: '<path d="M40.8 5.2c.9 4.9-1.2 9.8-6.1 14.7L21.2 33.4l-6.6-6.6L28.1 13.3c4.9-4.9 8-7.4 12.7-8.1z"/><path d="M12.6 25.4l10 10-2.5 2.5-10-10z"/><path d="M12 33.3l2.7 2.7-6 6a1.9 1.9 0 0 1-2.7-2.7z"/>',
  grenade: '<path d="M24 16.5c7.4 0 12.6 5.3 12.6 12.7 0 7.5-5.6 14.3-12.6 14.3s-12.6-6.8-12.6-14.3c0-7.4 5.2-12.7 12.6-12.7z"/><rect x="19.6" y="10" width="8.8" height="6.2" rx="1"/><path d="M28.2 11.2l8.6-4.6 1.7 3.1-8.7 4.7z"/><circle cx="16.3" cy="9.6" r="3.3" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.3"/><path d="M14.4 28.6h19.2M24 19.4v21" stroke="rgba(0,0,0,0.35)" stroke-width="1.8" fill="none"/>',
  bottle: '<path d="M21.2 14.6h5.6v5.2l3.6 4.9v17.1a2.4 2.4 0 0 1-2.4 2.4h-8a2.4 2.4 0 0 1-2.4-2.4V24.7l3.6-4.9z"/><path d="M24.3 2.6c3.9 3.1 5 6.3 3 9.6-.7-1.5-1.9-2.5-3.5-3 .5 1.6.1 2.9-1.2 3.7-1.7-2.7-.8-6.3 1.7-10.3z"/><path d="M17.6 30.5h12.8" stroke="rgba(0,0,0,0.4)" stroke-width="2" fill="none"/>',
  plate: '<path d="M12.5 8l6-4h11l6 4v24.2c0 4.6-4.8 8.6-11.5 11.6-6.7-3-11.5-7-11.5-11.6z"/><path d="M17 13.5h14" stroke="rgba(0,0,0,0.4)" stroke-width="2" fill="none"/>',
  c4: '<rect x="5" y="17" width="38" height="22" rx="2"/><path d="M17.7 17v22M30.3 17v22" stroke="rgba(0,0,0,0.45)" stroke-width="2" fill="none"/><rect x="18.5" y="8.5" width="11" height="8" rx="1.2"/><rect x="20.2" y="10.3" width="7.6" height="4.4" rx="0.6" fill="rgba(0,0,0,0.6)"/><path d="M29.5 12.5c4.2 0 7.4 1.6 9.3 4.5" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2"/>',
  det: '<rect x="14" y="16" width="20" height="28" rx="3"/><circle cx="24" cy="25" r="5.2" fill="rgba(0,0,0,0.55)"/><circle cx="24" cy="25" r="3" fill="#ff4a3d"/><path d="M29 16V5" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="3"/><circle cx="29" cy="4.5" r="2.2"/><rect x="18" y="35" width="12" height="3" rx="1" fill="rgba(0,0,0,0.45)"/>',
  jump: '<path d="M24 7.5l13.5 13.4-3.6 3.6L24 14.7l-9.9 9.8-3.6-3.6z"/><path d="M24 21.5l13.5 13.4-3.6 3.6L24 28.7l-9.9 9.8-3.6-3.6z"/>',
  crouch: '<circle cx="28.5" cy="8.8" r="4.7"/><path d="M25.5 16.5l-5 10.5 9.5 4.5v11M20.5 27l-6 8.5 4.5 7" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="5"/><path d="M25.2 18.6l8.2 4.2" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="4.4"/>',
  slide: '<circle cx="34" cy="13" r="4.6"/><path d="M31 19.5l-9 7.5 12 5.5M22 27l-12 9" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="5"/><path d="M6 42.5h30" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="3"/><path d="M4 34h7M2 28h6" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.4" opacity="0.7"/>',
  emote: '<circle cx="24" cy="24" r="16.5" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="3.4"/><circle cx="18" cy="20" r="2.8"/><circle cx="30" cy="20" r="2.8"/><path d="M16.4 28.2c2 3.6 4.7 5.4 7.6 5.4s5.6-1.8 7.6-5.4" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="3.4"/>',
  mic: '<rect x="18" y="5" width="12" height="22" rx="6"/><path d="M12 22c0 6.8 5.4 12 12 12s12-5.2 12-12M24 34v8M17 42h14" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="3.2"/>',
  micoff: '<rect x="18" y="5" width="12" height="22" rx="6"/><path d="M12 22c0 6.8 5.4 12 12 12s12-5.2 12-12M24 34v8M17 42h14" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="3.2"/><path d="M9 7l30 34" stroke="rgba(0,0,0,0.6)" stroke-width="6.5" stroke-linecap="round"/><path d="M9 7l30 34" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="3.4"/>',
  chat: '<path d="M8 10h32a3 3 0 0 1 3 3v17a3 3 0 0 1-3 3H21l-9 7v-7H8a3 3 0 0 1-3-3V13a3 3 0 0 1 3-3z"/>',
  invite: '<circle cx="19" cy="15" r="7"/><path d="M5 40c1-8.4 6.6-13.4 14-13.4S32 31.6 33 40z"/><path d="M38 12v14M31 19h14" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="3.4"/>',
  people: '<circle cx="17" cy="15" r="6.4"/><path d="M4 39c.9-7.6 6-12.2 13-12.2S29.1 31.4 30 39z"/><circle cx="32" cy="14" r="5.6"/><path d="M33 25.4c6 .2 10.2 4.6 11 11.6H32.4c-.4-4.6-2.2-8.4-5.2-11 1.8-.4 3.8-.6 5.8-.6z"/>',
  pause: '<rect x="13" y="9" width="7.5" height="30" rx="2"/><rect x="27.5" y="9" width="7.5" height="30" rx="2"/>',
  cam: '<path d="M9 14h7l3-5h10l3 5h7a3 3 0 0 1 3 3v19a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V17a3 3 0 0 1 3-3z"/><circle cx="24" cy="26" r="7" fill="rgba(0,0,0,0.55)"/><circle cx="24" cy="26" r="4.2"/>',
  shop: '<path d="M3.5 8.5h6.4l5.6 25.2h23.2" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="3.6"/><path d="M12.2 13.5h30.6a1.8 1.8 0 0 1 1.7 2.3l-3.4 11.4a2.6 2.6 0 0 1-2.5 1.9H15.4z"/><circle cx="19" cy="40.2" r="3.6"/><circle cx="35.4" cy="40.2" r="3.6"/>',
};
export function ZGlyph({ k, size = 22, color = '#FFFFFF' }) {
  return <svg width={size} height={size} viewBox="0 0 48 48" fill={color} aria-hidden="true" style={{ display: 'block', filter: 'drop-shadow(0 1px 1.5px rgba(0,0,0,0.55))' }} dangerouslySetInnerHTML={{ __html: ZG[k] }} />;
}
export const hasGlyph = (k) => !!ZG[k];

export function CBtn({ size = 54, icon, label, onDown, onUp, onMove, onTap, active, badge, ring, disabled, style, sub, big, tone, shape = 'round' }) {
  const st = useRef({ id: null, x: 0, y: 0, moved: 0 });
  const [down, setDown] = useState(false);
  const live = useRef(null);
  const press = (e) => {
    if (disabled) return;
    e.stopPropagation();
    e.preventDefault();
    if (st.current.id != null && live.current) live.current();
    st.current = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: 0 };
    const id = e.pointerId;
    const mv = (ev) => { if (ev.pointerId === id) move(ev); };
    const fin = (ev) => { if (ev.pointerId !== id) return; stop(); up(ev); };
    const stop = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', fin); window.removeEventListener('pointercancel', fin); live.current = null; };
    window.addEventListener('pointermove', mv, { passive: true });
    window.addEventListener('pointerup', fin);
    window.addEventListener('pointercancel', fin);
    live.current = stop;
    setDown(true);
    onDown && onDown(e);
  };
  const upRef = useRef(onUp);
  upRef.current = onUp;
  useEffect(() => () => { if (live.current) { live.current(); if (upRef.current) upRef.current({ cancel: true, clientX: -1e9, clientY: -1e9 }); } }, []);
  const move = (e) => {
    if (st.current.id !== e.pointerId) return;
    const dx = e.clientX - st.current.x, dy = e.clientY - st.current.y;
    st.current.moved += Math.abs(dx) + Math.abs(dy);
    st.current.x = e.clientX; st.current.y = e.clientY;
    onMove && onMove(dx, dy, e);
  };
  const up = (e) => {
    if (st.current.id !== e.pointerId) return;
    st.current.id = null;
    setDown(false);
    onUp && onUp(e, st.current.moved);
    if (onTap && st.current.moved < 14) onTap(e);
  };
  const zg = !!ZG[icon];
  const gi = zg ? null : CB_ICON[icon];
  const metal = hasMIcon(icon);
  return (
    <div role="button" aria-label={label} aria-disabled={disabled ? 'true' : undefined} onPointerDown={press} onContextMenu={(e) => e.preventDefault()}
      style={{ position: 'absolute', width: size, height: size, borderRadius: shape === 'round' ? '50%' : Math.round(size * 0.16), touchAction: 'none', pointerEvents: 'auto', cursor: 'pointer', ...style }}>
      {metal ? (
        <>
          <MetalFace size={size} k={icon} big={big} active={!!active} pressed={down} ring={ring} disabled={disabled} tone={tone} sub={sub} accent={tone === 'green' ? '#7CF0A6' : '#FFC83A'} square={shape === 'square'} bare={shape === 'bare'} />
          {sub != null && <span aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, bottom: Math.round(size * 0.15), textAlign: 'center', fontWeight: 800, fontSize: Math.max(9, Math.round(size * 0.16)), color: '#FFFFFF', textShadow: '0 1px 2px rgba(0,0,0,0.85)', lineHeight: 1, pointerEvents: 'none' }}>{sub}</span>}
          {badge != null && shape === 'bare' && <span aria-hidden="true" style={{ position: 'absolute', right: Math.round(size * 0.1), bottom: Math.round(size * 0.06), fontSize: Math.max(10, Math.round(size * 0.24)), fontWeight: 900, color: disabled ? 'rgba(255,255,255,0.55)' : '#FFFFFF', textShadow: '0 1px 2px rgba(0,0,0,0.95), 0 0 3px rgba(0,0,0,0.8)', fontVariantNumeric: 'tabular-nums', lineHeight: 1, pointerEvents: 'none' }}>{badge}</span>}
          {badge != null && shape !== 'bare' && <span aria-hidden="true" style={{ position: 'absolute', right: size < 44 ? -6 : -2, top: size < 44 ? -6 : -2, minWidth: size < 44 ? 16 : 20, height: size < 44 ? 16 : 20, padding: size < 44 ? '0 4px' : '0 5px', boxSizing: 'border-box', borderRadius: 10, background: 'radial-gradient(circle at 50% 35%, #3A4049, #0C0E12)', boxShadow: `0 0 0 1.6px ${disabled ? 'rgba(200,205,212,0.5)' : '#DDE2E8'}, 0 1px 3px rgba(0,0,0,0.6)`, color: '#FFFFFF', fontSize: size < 44 ? 10 : 11.5, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', fontVariantNumeric: 'tabular-nums', pointerEvents: 'none' }}>{badge}</span>}
        </>
      ) : (
        <SkillFace size={size} icon={gi} glyph={gi ? null : zg ? <ZGlyph k={icon} size={Math.round(size * (big ? 0.46 : 0.5))} /> : <Ico k={icon} size={Math.round(size * 0.48)} sw={1.9} />} main={big} active={!!active} pressed={down} ring={ring} badge={badge} disabled={disabled} sub={sub} tint={tone === 'green' ? '#2E9A5A' : tone === 'red' ? '#C8281E' : null} accent={tone === 'green' ? '#7CF0A6' : '#FFC23D'} />
      )}
    </div>
  );
}

export function ThrowBox({ size, style, nade, molo, nadeOn, moloOn, onNade, onMolo, onMove, preview }) {
  return (
    <div style={{ position: 'absolute', width: size, height: size * 2, pointerEvents: preview ? 'none' : 'auto', ...style }}>
      <BoxFrame w={size} h={size * 2} split={0.5} />
      <CBtn shape="bare" size={size} icon="grenade" label="Throw a grenade" badge={preview ? undefined : nade} disabled={!preview && !nade} active={!!nadeOn} style={{ left: 0, top: 0, pointerEvents: preview ? 'none' : 'auto' }} onDown={onNade} onMove={onMove} />
      <CBtn shape="bare" size={size} icon="bottle" label="Throw a fire bottle" badge={preview ? undefined : molo} disabled={!preview && !molo} active={!!moloOn} style={{ left: 0, top: size, pointerEvents: preview ? 'none' : 'auto' }} onDown={onMolo} onMove={onMove} />
    </div>
  );
}

export function TopBtn({ icon, label, onTap, style, badge, on, size = 36, text }) {
  const [down, setDown] = useState(false);
  return (
    <button type="button" aria-label={label} onClick={(e) => { e.stopPropagation(); onTap(); }} onPointerDown={(e) => { e.stopPropagation(); setDown(true); }} onPointerUp={() => setDown(false)} onPointerCancel={() => setDown(false)} onPointerLeave={() => setDown(false)}
      style={{ position: 'relative', width: size, height: size, borderRadius: '50%', border: 'none', padding: 0, cursor: 'pointer', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto', touchAction: 'manipulation', flexShrink: 0, ...style }}>
      <MetalRing size={size} pressed={down} color={on ? '#7CF0A6' : null} />
      {text ? <span style={{ position: 'relative', fontSize: Math.round(size * 0.3), fontWeight: 900, fontStyle: 'italic', letterSpacing: '0.03em', color: '#FFFFFF', textShadow: '0 1px 2px rgba(0,0,0,0.9)', lineHeight: 1 }}>{text}</span> : <span style={{ position: 'relative', display: 'flex' }}>{ZG[icon] ? <ZGlyph k={icon} size={Math.round(size * 0.53)} /> : <Ico k={icon} size={Math.round(size * 0.53)} />}</span>}
      {badge ? <span style={{ position: 'absolute', right: -3, top: -3, width: 9, height: 9, borderRadius: 5, background: '#FF5A4A' }} /> : null}
    </button>
  );
}

export function drawMinimap(cv, d) {
  if (!cv) return;
  const ctx = cv.getContext('2d');
  if (!ctx) return;
  const W = cv.width, H = cv.height, r = W / 2;
  const sc = d.scale || 2.4;
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.beginPath(); ctx.arc(r, r, r - 1, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = 'rgba(14,18,20,0.62)'; ctx.fillRect(0, 0, W, H);
  ctx.translate(r, r);
  ctx.rotate(d.yaw);
  const tx = (x, z) => [-(x - d.x) * sc, -(z - d.z) * sc];
  if (d.water) {
    ctx.fillStyle = 'rgba(52,104,128,0.85)';
    for (const P of d.water) { ctx.beginPath(); P.forEach((q, i) => { const [a, b] = tx(q[0], q[1]); if (i) ctx.lineTo(a, b); else ctx.moveTo(a, b); }); ctx.closePath(); ctx.fill(); }
  }
  ctx.fillStyle = 'rgba(70,74,78,0.9)';
  for (const R of d.roads || []) { const [a, b] = tx(R[0], R[1]), [c, e] = tx(R[2], R[3]); ctx.fillRect(Math.min(a, c), Math.min(b, e), Math.abs(c - a), Math.abs(e - b)); }
  ctx.fillStyle = 'rgba(150,140,120,0.55)';
  for (const R of d.blocks || []) { const [a, b] = tx(R[0], R[1]), [c, e] = tx(R[2], R[3]); ctx.fillRect(Math.min(a, c), Math.min(b, e), Math.abs(c - a), Math.abs(e - b)); }
  for (const z of d.zs || []) {
    const [a, b] = tx(z[0], z[1]), L = Math.hypot(a, b);
    if (L > r - 7) {
      const ux = a / L, uy = b / L, ex = ux * (r - 7), ey = uy * (r - 7);
      ctx.fillStyle = z[2] ? '#FF3B2E' : 'rgba(255,70,60,0.9)';
      ctx.beginPath(); ctx.moveTo(ex + ux * 5, ey + uy * 5); ctx.lineTo(ex - uy * 3.6, ey + ux * 3.6); ctx.lineTo(ex + uy * 3.6, ey - ux * 3.6); ctx.closePath(); ctx.fill();
      continue;
    }
    ctx.fillStyle = z[2] ? '#FF3B2E' : 'rgba(255,70,60,0.85)'; ctx.beginPath(); ctx.arc(a, b, z[2] ? 3.4 : 2.3, 0, Math.PI * 2); ctx.fill();
  }
  for (const a0 of d.acid || []) { const [a, b] = tx(a0[0], a0[1]); ctx.fillStyle = 'rgba(140,220,60,0.45)'; ctx.beginPath(); ctx.arc(a, b, 2.2 * sc, 0, Math.PI * 2); ctx.fill(); }
  for (const n0 of d.nests || []) { const [a, b] = tx(n0[0], n0[1]); ctx.fillStyle = 'rgba(150,210,60,0.95)'; ctx.strokeStyle = 'rgba(20,30,10,0.9)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(a, b, Math.max(3.2, 1.6 * sc), 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  for (const m0 of d.drops || []) { const [a, b] = tx(m0[0], m0[1]); ctx.fillStyle = '#FF6A4A'; ctx.strokeStyle = 'rgba(40,10,0,0.9)'; ctx.lineWidth = 1.2; ctx.fillRect(a - 3.4, b - 2.6, 6.8, 5.2); ctx.strokeRect(a - 3.4, b - 2.6, 6.8, 5.2); }
  if (d.heli) { const [a, b] = tx(d.heli[0], d.heli[1]); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(a - 5, b); ctx.lineTo(a + 5, b); ctx.moveTo(a, b - 5); ctx.lineTo(a, b + 5); ctx.stroke(); ctx.beginPath(); ctx.arc(a, b, 2, 0, Math.PI * 2); ctx.fillStyle = '#FFFFFF'; ctx.fill(); }
  for (const m0 of d.ammo || []) { const [a, b] = tx(m0[0], m0[1]); ctx.fillStyle = '#FFD84A'; ctx.strokeStyle = 'rgba(40,30,0,0.9)'; ctx.lineWidth = 1; ctx.fillRect(a - 2.6, b - 2, 5.2, 4); ctx.strokeRect(a - 2.6, b - 2, 5.2, 4); }
  for (const h0 of d.heal || []) { const [a, b] = tx(h0[0], h0[1]); ctx.fillStyle = 'rgba(80,240,130,0.32)'; ctx.strokeStyle = 'rgba(120,255,160,0.95)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(a, b, Math.max(3, h0[2] * sc), 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  for (const p of d.ps || []) {
    const [a, b] = tx(p[0], p[1]);
    ctx.save(); ctx.translate(a, b); ctx.rotate(-p[2]);
    ctx.fillStyle = p[3] === 1 ? '#FFB43A' : '#5CC8FF';
    ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(3.6, 3.6); ctx.lineTo(0, 1.6); ctx.lineTo(-3.6, 3.6); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  if (d.pet) { const [a, b] = tx(d.pet[0], d.pet[1]); ctx.fillStyle = '#F2D27A'; ctx.beginPath(); ctx.arc(a, b, 2.6, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
  ctx.save(); ctx.translate(r, r);
  const cg = ctx.createRadialGradient(0, 0, 4, 0, 0, r * 0.82);
  cg.addColorStop(0, 'rgba(255,214,90,0.42)'); cg.addColorStop(1, 'rgba(255,214,90,0)');
  ctx.fillStyle = cg;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r * 0.82, -Math.PI / 2 - 0.62, -Math.PI / 2 + 0.62); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(5, 5); ctx.lineTo(0, 2.4); ctx.lineTo(-5, 5); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(r, r, r - 1, 0, Math.PI * 2); ctx.stroke();
  const n = d.yaw;
  const nx = r - Math.sin(n) * (r - 8), ny = r + Math.cos(n) * (r - 8);
  ctx.fillStyle = '#FFFFFF'; ctx.font = '800 10px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('N', nx, ny);
}

export const EMOTE_LIST = [['wave', 'Wave'], ['cheer', 'Cheer'], ['point', 'This way'], ['thumbs', 'Nice'], ['salute', 'Salute'], ['dance', 'Dance'], ['laugh', 'Laugh'], ['flip', 'Flip'], ['samba', 'Samba'], ['hiphop', 'Hip hop'], ['clap', 'Clap'], ['victory', 'Victory']];
export const QUICK_LINES = ['Behind you', 'Help me up', 'Reloading', 'Big one coming', 'Stay together', 'Nice shot'];

let wheelCss = false;
function injectWheelCss() {
  if (wheelCss || typeof document === 'undefined') return;
  wheelCss = true;
  const st = document.createElement('style');
  st.textContent = '@keyframes zw-in{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:none}}.zw-in{animation:zw-in .16s ease-out}@media (prefers-reduced-motion: reduce){.zw-in{animation:none}}';
  document.head.appendChild(st);
}

const WR_I = 30, WR_O = 97, W_GAP = 2.4;
const wpt = (a, r) => [Math.sin(a) * r, -Math.cos(a) * r];
function wedgePath(i, n) {
  const step = (Math.PI * 2) / n;
  const ao = W_GAP / WR_O, ai = W_GAP / WR_I;
  const a0 = (i - 0.5) * step, a1 = (i + 0.5) * step;
  const [x0, y0] = wpt(a0 + ao, WR_O), [x1, y1] = wpt(a1 - ao, WR_O), [x2, y2] = wpt(a1 - ai, WR_I), [x3, y3] = wpt(a0 + ai, WR_I);
  const f = (v) => v.toFixed(2);
  return `M${f(x0)} ${f(y0)}A${WR_O} ${WR_O} 0 0 1 ${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}A${WR_I} ${WR_I} 0 0 0 ${f(x3)} ${f(y3)}Z`;
}
function arcPath(i, n, r) {
  const step = (Math.PI * 2) / n, d = W_GAP / r;
  const [x0, y0] = wpt((i - 0.5) * step + d, r), [x1, y1] = wpt((i + 0.5) * step - d, r);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

export function EmoteWheel({ icons, onPick, onClose }) {
  injectWheelCss();
  const [hot, setHot] = useState(-1);
  const ref = useRef(null);
  const down = useRef(false);
  const n = EMOTE_LIST.length;
  const at = (e) => {
    const el = ref.current;
    if (!el) return -1;
    const b = el.getBoundingClientRect();
    const x = e.clientX - (b.left + b.width / 2), y = e.clientY - (b.top + b.height / 2);
    const r = (Math.hypot(x, y) / (b.width / 2)) * 100;
    if (r < WR_I) return -2;
    if (r > 122) return -1;
    let a = Math.atan2(x, -y);
    if (a < 0) a += Math.PI * 2;
    return Math.round(a / ((Math.PI * 2) / n)) % n;
  };
  useEffect(() => {
    const key = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      const d = Number(e.key);
      if (d >= 1 && d <= n) { e.preventDefault(); onPick(EMOTE_LIST[d - 1][0]); }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [n, onPick, onClose]);
  const lab = hot >= 0 ? EMOTE_LIST[hot][1] : 'Emotes';
  return (
    <div role="dialog" aria-label="Emotes" onPointerDown={(e) => { e.stopPropagation(); if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'absolute', inset: 0, zIndex: 25, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0.42), rgba(0,0,0,0.18) 70%)', touchAction: 'none' }}>
      <div ref={ref} className="zw-in"
        onPointerDown={(e) => { e.stopPropagation(); down.current = true; try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} const i = at(e); setHot(i >= 0 ? i : -1); }}
        onPointerMove={(e) => { if (!down.current && e.pointerType !== 'mouse') return; const i = at(e); setHot(i >= 0 ? i : -1); }}
        onPointerUp={(e) => { e.stopPropagation(); const was = down.current; down.current = false; const i = at(e); setHot(-1); if (!was) return; if (i >= 0) onPick(EMOTE_LIST[i][0]); else onClose(); }}
        onPointerCancel={() => { down.current = false; setHot(-1); }}
        onPointerLeave={(e) => { if (e.pointerType === 'mouse' && !down.current) setHot(-1); }}
        style={{ position: 'relative', width: 'min(80vmin, 330px)', aspectRatio: '1', maxWidth: '100%', cursor: 'pointer', userSelect: 'none', WebkitUserSelect: 'none' }}>
        <svg viewBox="-104 -104 208 208" width="100%" height="100%" aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <defs>
            <radialGradient id="zw-hot" cx="0" cy="0" r="100" gradientUnits="userSpaceOnUse">
              <stop offset="0.3" stopColor="rgba(224,168,90,0.14)" />
              <stop offset="1" stopColor="rgba(224,168,90,0.46)" />
            </radialGradient>
          </defs>
          <circle r={WR_O + 5} fill="none" stroke="rgba(239,232,210,0.1)" strokeWidth="1" />
          {EMOTE_LIST.map(([k], i) => (
            <path key={k} d={wedgePath(i, n)} fill={hot === i ? 'url(#zw-hot)' : 'rgba(15,16,17,0.84)'} stroke={hot === i ? 'rgba(224,168,90,0.9)' : 'rgba(239,232,210,0.13)'} strokeWidth={hot === i ? 1.2 : 0.8} />
          ))}
          {hot >= 0 && <path d={arcPath(hot, n, WR_O + 5)} fill="none" stroke="#E0A85A" strokeWidth="3" strokeLinecap="round" />}
          <circle r={WR_I - 4} fill="rgba(12,12,13,0.92)" stroke="rgba(239,232,210,0.18)" strokeWidth="1" />
        </svg>
        {EMOTE_LIST.map(([k, l], i) => {
          const a = (i / n) * Math.PI * 2, rc = (WR_I + WR_O) / 2 + 1;
          const x = 50 + (Math.sin(a) * rc) / 2.08, y = 50 - (Math.cos(a) * rc) / 2.08;
          const on = hot === i;
          return (
            <div key={k} style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: `${Math.min(25, 200 / n)}%`, transform: `translate(-50%,-50%) scale(${on ? 1.08 : 1})`, transition: 'transform 0.1s ease-out', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, pointerEvents: 'none' }}>
              {icons && icons[i] ? <img src={icons[i]} alt="" draggable={false} style={{ width: '88%', aspectRatio: '1', objectFit: 'contain', display: 'block', filter: on ? 'drop-shadow(0 0 6px rgba(224,168,90,0.55))' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))' }} /> : null}
              <span style={{ fontSize: n > 8 ? 9.5 : 10.5, fontWeight: 900, lineHeight: 1.1, color: on ? '#F2C27E' : 'rgba(239,232,210,0.82)', whiteSpace: 'nowrap', textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}>{l}</span>
            </div>
          );
        })}
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: '24%', textAlign: 'center', pointerEvents: 'none', fontSize: 13, fontWeight: 900, lineHeight: 1.1, color: hot >= 0 ? '#F2C27E' : 'rgba(239,232,210,0.7)' }}>{lab}</div>
      </div>
    </div>
  );
}
