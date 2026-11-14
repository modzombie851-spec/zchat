import React, { useRef } from 'react';
import { FONT } from '../App.jsx';
import { GBtn, GPill, GTitle } from './gamekit.jsx';

const MB = 1048576;
const mb = (n) => (n / MB).toFixed(n >= 10 * MB ? 0 : 1);

function useSpeed(got, on) {
  const r = useRef({ pts: [], v: 0 });
  const now = typeof performance !== 'undefined' ? performance.now() : 0;
  const S = r.current;
  if (!on) { S.pts = []; S.v = 0; return 0; }
  const last = S.pts[S.pts.length - 1];
  if (!last || last[1] !== got) S.pts.push([now, got]);
  while (S.pts.length > 2 && now - S.pts[0][0] > 3000) S.pts.shift();
  if (S.pts.length > 1) {
    const a = S.pts[0], b = S.pts[S.pts.length - 1];
    if (b[0] - a[0] > 400) S.v = ((b[1] - a[1]) / (b[0] - a[0])) * 1000;
  }
  return S.v;
}

export function ZBoot({ GS, boot, onRetry, onClose }) {
  const { top, right, bottom, left } = GS.at;
  const down = boot.st === 'down';
  const err = boot.st === 'err';
  const speed = useSpeed(boot.got, down);
  const f = down ? (boot.tot ? boot.got / boot.tot : 0) : boot.st === 'load' ? boot.pct : 0;
  const msg = err
    ? (boot.why === 'net' ? 'Download stopped. Check your internet and try again.' : 'The game files could not load. Try again.')
    : down ? 'Downloading game files' : boot.st === 'load' ? 'Loading the town' : 'Checking game files';
  const side = down ? `${mb(boot.got)} of ${mb(boot.tot)} MB` : boot.st === 'load' ? `${Math.round(boot.pct * 100)}%` : '';
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 6, background: '#0D0C0B', overflow: 'hidden', fontFamily: FONT, color: '#EFE8D2' }}>
      <img src="/zombie-art3.webp" alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 38%', display: 'block' }} />
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(13,12,11,0.6) 0%, rgba(13,12,11,0) 24%, rgba(13,12,11,0) 42%, rgba(13,12,11,0.86) 74%, #0D0C0B 100%)' }} />
      <div style={{ position: 'absolute', top: top(10), left: left(14) }}>
        <GBtn icon="close" color="white" size={42} fast={false} label="Leave" onPress={onClose} />
      </div>
      <div style={{ position: 'absolute', left: left(22), right: right(22), bottom: bottom(16), display: 'flex', flexDirection: 'column', gap: 9 }}>
        <GTitle text="Zombie Junction" size={36} color="#E0A85A" />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }} role="status" aria-live="polite">
          <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 800 }}>{msg}</span>
          {side && !err && <span style={{ fontSize: 13, fontWeight: 800, color: 'rgba(239,232,210,0.78)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{side}</span>}
        </div>
        {err ? (
          <div style={{ display: 'flex' }}><GPill text="Try again" color="gold" small onPress={onRetry} /></div>
        ) : (
          <>
            <div role="progressbar" aria-label={msg} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(f * 100)} style={{ position: 'relative', height: 8, borderRadius: 4, background: 'rgba(239,232,210,0.13)', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.max(1.5, Math.min(100, f * 100))}%`, borderRadius: 4, background: 'linear-gradient(90deg, #7E2418 0%, #C8442E 55%, #E0A85A 100%)', boxShadow: '0 0 14px rgba(224,168,90,0.4)', transition: 'width 0.2s linear' }} />
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

export function DlMark({ st, round }) {
  if (!st || st.ready) return null;
  const f = st.size ? st.got / st.size : 0;
  const r = 9, L = 2 * Math.PI * r;
  return (
    <span aria-hidden="true" style={{ position: 'absolute', inset: 0, borderRadius: round ? '50%' : 'inherit', background: 'rgba(10,9,8,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
      <svg width="24" height="24" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r={r} fill="rgba(10,9,8,0.6)" stroke="rgba(239,232,210,0.25)" strokeWidth="2" />
        {st.on && <circle cx="12" cy="12" r={r} fill="none" stroke="#E0A85A" strokeWidth="2.4" strokeLinecap="round" strokeDasharray={`${Math.max(0.5, L * f)} ${L}`} transform="rotate(-90 12 12)" />}
        <path d="M12 7.6v7M9 12l3 3 3-3" fill="none" stroke={st.on ? '#E0A85A' : '#EFE8D2'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function GunDl({ st }) {
  if (!st || st.ready) return null;
  const f = st.size ? st.got / st.size : 0;
  return (
    <span aria-hidden="true" style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', background: 'rgba(10,9,8,0.45)', pointerEvents: 'none' }}>
      <span style={{ position: 'absolute', left: 8, right: 8, bottom: 4, height: 2, borderRadius: 1, background: 'rgba(239,232,210,0.18)', overflow: 'hidden' }}>
        <span style={{ display: 'block', height: '100%', width: `${st.on ? Math.max(6, f * 100) : 0}%`, background: '#E0A85A', transition: 'width 0.2s linear' }} />
      </span>
    </span>
  );
}
