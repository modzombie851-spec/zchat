import React, { useRef, useState } from 'react';
import { SkillFace } from './gskill.jsx';

const P = {
  fire: <><circle cx="12" cy="12" r="7.2" /><path d="M12 2.5v4.2M12 17.3v4.2M2.5 12h4.2M17.3 12h4.2" /><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" /></>,
  bullet: <><path d="M9.5 9.2c0-3.4 1.1-5.7 2.5-6.7 1.4 1 2.5 3.3 2.5 6.7v8.3h-5z" /><path d="M8.6 17.5h6.8v3.3H8.6z" /></>,
  scope: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M12 1.8v5.2M12 17v5.2M1.8 12h5.2M17 12h5.2" /></>,
  mag: <><path d="M8.4 3.5h6.4l-.6 6.2 1.9 9.8a1 1 0 0 1-1 1.2H9.4a1 1 0 0 1-1-1.1l.8-9.9z" /><path d="M9.4 7.5h4.8M9.2 11h5.4" /></>,
  grenade: <><path d="M12 8.2a6 6 0 1 1-.01 0z" /><path d="M10.2 8.6V5.8h3.6v2.8M13.8 6.4l3.4-2.2M17.2 4.2l1.3 2.6" /><path d="M8.6 14.2h6.8M12 10.8v6.8" opacity=".55" /></>,
  bottle: <><path d="M10 2.8h4v3.6l1.6 2.4v11.3a1.2 1.2 0 0 1-1.2 1.2H9.6a1.2 1.2 0 0 1-1.2-1.2V8.8L10 6.4z" /><path d="M8.4 13h7.2" /><path d="M12 1.2c1.2.8 1.6 1.8 1.2 2.8" /></>,
  knife: <><path d="M4.2 19.8l9.3-9.3 2.6 2.6-9.3 9.3H4.2z" /><path d="M13.5 10.5l5.8-6.9 1.1 1.1-6.9 5.8" /><path d="M11.6 8.6l4.5 4.5" /></>,
  swap: <><path d="M5 8.5h13M14.5 5l3.5 3.5-3.5 3.5M19 15.5H6M9.5 12L6 15.5 9.5 19" /></>,
  smile: <><circle cx="12" cy="12" r="8.6" /><path d="M8.2 14.2c1 1.5 2.3 2.2 3.8 2.2s2.8-.7 3.8-2.2" /><circle cx="9" cy="10" r="1.1" fill="currentColor" stroke="none" /><circle cx="15" cy="10" r="1.1" fill="currentColor" stroke="none" /></>,
  chat: <><path d="M4.5 5.5h15a1.5 1.5 0 0 1 1.5 1.5v8.4a1.5 1.5 0 0 1-1.5 1.5H11l-4.6 3.6v-3.6H4.5A1.5 1.5 0 0 1 3 15.4V7a1.5 1.5 0 0 1 1.5-1.5z" /></>,
  people: <><circle cx="9" cy="8.5" r="3.3" /><path d="M2.8 19.5c.6-3.4 3-5.3 6.2-5.3s5.6 1.9 6.2 5.3" /><path d="M15.5 5.6a3.1 3.1 0 0 1 0 5.9M17.4 14.6c2 .7 3.4 2.4 3.8 4.9" /></>,
  pause: <><path d="M8.5 5v14M15.5 5v14" /></>,
  gear: <><circle cx="12" cy="12" r="3.2" /><path d="M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.5 5.5l1.9 1.9M16.6 16.6l1.9 1.9M5.5 18.5l1.9-1.9M16.6 7.4l1.9-1.9" /></>,
  paw: <><ellipse cx="12" cy="15.5" rx="4.4" ry="3.6" /><circle cx="6.4" cy="10.4" r="1.7" /><circle cx="9.6" cy="6.8" r="1.7" /><circle cx="14.4" cy="6.8" r="1.7" /><circle cx="17.6" cy="10.4" r="1.7" /></>,
  heart: <><path d="M12 20s-7.5-4.6-7.5-10.1A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z" /><path d="M12 10.3v5.2M9.4 12.9h5.2" /></>,
  run: <><circle cx="14.6" cy="4.4" r="1.9" /><path d="M9 21l2.6-5.4 3 2.4v3.6M8.2 9.6l3.6-2.4 3.2 2.6 3.4.6M11.8 7.2l-1.4 6.4 3.4 2.4M6.8 13.4l2.8-.6" /></>,
  invite: <><circle cx="9.5" cy="8.4" r="3.4" /><path d="M3 19.6c.6-3.5 3.2-5.5 6.5-5.5 2 0 3.7.7 4.9 2" /><path d="M18 11.5v7M14.5 15h7" /></>,
  close: <><path d="M6 6l12 12M18 6L6 18" /></>,
  down: <><path d="M6 9l6 6 6-6" /></>,
};

export function Ico({ k, size = 22, sw = 1.7, color = '#FFFFFF' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: 'block', color }}>{P[k] || null}</svg>;
}

const CB_ICON = { bullet: 'bullets', scope: 'crosshair', mag: 'magazine', knife: 'knife', grenade: 'grenade', bottle: 'molotov', heart: 'revive', torch: 'flashlight', swap: 'cycle' };

export function CBtn({ size = 54, icon, label, onDown, onUp, onMove, onTap, active, badge, ring, disabled, style, sub, big, tone }) {
  const st = useRef({ id: null, x: 0, y: 0, moved: 0 });
  const [down, setDown] = useState(false);
  const press = (e) => {
    if (disabled) return;
    e.stopPropagation();
    e.preventDefault();
    st.current = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: 0 };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    setDown(true);
    onDown && onDown(e);
  };
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
  const gi = CB_ICON[icon];
  return (
    <div role="button" aria-label={label} aria-disabled={disabled ? 'true' : undefined} onPointerDown={press} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onLostPointerCapture={up} onContextMenu={(e) => e.preventDefault()}
      style={{ position: 'absolute', width: size, height: size, borderRadius: '50%', touchAction: 'none', pointerEvents: 'auto', cursor: 'pointer', ...style }}>
      <SkillFace size={size} icon={gi} glyph={gi ? null : <Ico k={icon} size={Math.round(size * 0.48)} sw={1.9} />} main={big} active={!!active} pressed={down} ring={ring} badge={badge} disabled={disabled} sub={sub} tint={tone === 'green' ? '#2E9A5A' : tone === 'red' ? '#C8281E' : null} accent={tone === 'green' ? '#7CF0A6' : '#FFC23D'} />
    </div>
  );
}

export function TopBtn({ icon, label, onTap, style, badge }) {
  return (
    <button type="button" aria-label={label} onClick={(e) => { e.stopPropagation(); onTap(); }} onPointerDown={(e) => e.stopPropagation()}
      style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', padding: 0, cursor: 'pointer', background: 'rgba(14,17,22,0.44)', boxShadow: 'inset 0 0 0 1.6px rgba(255,255,255,0.62)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto', position: 'relative', ...style }}>
      <Ico k={icon} size={19} />
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
  for (const z of d.zs || []) { const [a, b] = tx(z[0], z[1]); ctx.fillStyle = z[2] ? '#FF3B2E' : 'rgba(255,70,60,0.85)'; ctx.beginPath(); ctx.arc(a, b, z[2] ? 3.4 : 2.3, 0, Math.PI * 2); ctx.fill(); }
  for (const a0 of d.acid || []) { const [a, b] = tx(a0[0], a0[1]); ctx.fillStyle = 'rgba(140,220,60,0.45)'; ctx.beginPath(); ctx.arc(a, b, 2.2 * sc, 0, Math.PI * 2); ctx.fill(); }
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
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(5, 5); ctx.lineTo(0, 2.4); ctx.lineTo(-5, 5); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(r, r, r - 1, 0, Math.PI * 2); ctx.stroke();
  const n = d.yaw;
  const nx = r - Math.sin(n) * (r - 8), ny = r + Math.cos(n) * (r - 8);
  ctx.fillStyle = '#FFFFFF'; ctx.font = '800 10px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('N', nx, ny);
}

export const EMOTE_LIST = [['wave', 'Wave'], ['cheer', 'Cheer'], ['point', 'This way'], ['thumbs', 'Nice'], ['salute', 'Salute'], ['dance', 'Dance'], ['laugh', 'Laugh'], ['flip', 'Flip']];
export const QUICK_EMOJI = ['😀', '😂', '😱', '😡', '👍', '🔥', '💀', '❤️'];
export const QUICK_LINES = ['Behind you', 'Help me up', 'Reloading', 'Big one coming', 'Stay together', 'Nice shot'];
