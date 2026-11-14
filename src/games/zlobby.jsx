import React from 'react';
import { Avatar, FONT } from '../App.jsx';
import { GBtn } from './gamekit.jsx';
import { Ico } from './zhud.jsx';
import { DlMark } from './zboot.jsx';

export const CFONT = `'Roboto Condensed', 'sans-serif-condensed', 'Avenir Next Condensed', 'Arial Narrow', ${FONT}`;
const AMBER = '#E0A85A';
const CREAM = '#EFE8D2';
const MUTED = 'rgba(239,232,210,0.62)';
const PANEL = 'rgba(14,13,12,0.74)';
const LINE = 'rgba(239,232,210,0.14)';
const cut = (n) => `polygon(0 0, calc(100% - ${n}px) 0, 100% ${n}px, 100% 100%, ${n}px 100%, 0 calc(100% - ${n}px))`;
const slant = (n) => `polygon(0 0, 100% 0, calc(100% - ${n}px) 100%, 0 100%)`;

let cssOn = false;
function injectCss() {
  if (cssOn || typeof document === 'undefined') return;
  cssOn = true;
  const st = document.createElement('style');
  st.textContent = [
    '.zl-b{-webkit-tap-highlight-color:transparent;touch-action:manipulation;user-select:none;-webkit-user-select:none;border:none;cursor:pointer;outline:none;transition:transform .08s ease-out,filter .12s}',
    '.zl-b:active{transform:scale(.97)}',
    '.zl-b:focus-visible{box-shadow:0 0 0 2px #fff,0 0 0 4px #2479E8}',
    '@keyframes zl-up{from{opacity:0;transform:translate(-50%,12px)}to{opacity:1;transform:translate(-50%,0)}}',
    '.zl-up{animation:zl-up .18s ease-out}',
    '.zl-col::-webkit-scrollbar{display:none}',
    '@media (prefers-reduced-motion: reduce){.zl-up{animation:none}.zl-b{transition:none}}',
  ].join('\n');
  document.head.appendChild(st);
}

function Bars({ ms, u }) {
  const q = !ms || ms >= 9999 ? 0 : ms < 70 ? 4 : ms < 130 ? 3 : ms < 220 ? 2 : 1;
  const col = q >= 3 ? '#7CC46B' : q === 2 ? AMBER : '#D9573F';
  return (
    <svg width={u(16)} height={u(14)} viewBox="0 0 16 14" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => <rect key={i} x={i * 4.2} y={10 - i * 3.2} width="3" height={4 + i * 3.2} rx="0.8" fill={i < q ? col : 'rgba(239,232,210,0.22)'} />)}
    </svg>
  );
}

function IconBtn({ u, label, onPress, children, badge }) {
  return (
    <button type="button" className="zl-b" aria-label={label} onClick={onPress}
      style={{ position: 'relative', width: u(36), height: u(36), display: 'flex', alignItems: 'center', justifyContent: 'center', background: PANEL, clipPath: cut(u(7)), boxShadow: `inset 0 0 0 1px ${LINE}`, padding: 0 }}>
      {children}
      {badge ? <span style={{ position: 'absolute', top: u(3), right: u(4), width: u(7), height: u(7), borderRadius: '50%', background: '#D9573F' }} /> : null}
    </button>
  );
}

function Squad({ u, S }) {
  return (
    <div role="group" aria-label="Squad" style={{ background: PANEL, clipPath: cut(u(10)), padding: `${u(7)}px ${u(8)}px ${u(5)}px` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: u(6), marginBottom: u(3) }}>
        <span style={{ fontFamily: CFONT, fontSize: u(16), fontWeight: 800 }}>Squad</span>
        <span style={{ flex: 1, fontSize: u(11), fontWeight: 700, color: MUTED }}>{`${S.n} of 5`}</span>
        {S.voice && (
          <button type="button" className="zl-b" aria-pressed={S.mic} aria-label={S.mic ? 'Turn your mic off' : 'Turn your mic on'} onClick={S.onMic}
            style={{ height: u(26), display: 'flex', alignItems: 'center', gap: u(5), padding: `0 ${u(9)}px`, background: S.mic ? 'rgba(124,196,107,0.2)' : 'rgba(239,232,210,0.08)', boxShadow: `inset 0 0 0 1.5px ${S.mic ? '#7CC46B' : LINE}`, clipPath: cut(u(5)), color: S.mic ? '#8FD07E' : CREAM, fontFamily: CFONT, fontSize: u(13), fontWeight: 800 }}>
            <Ico k={S.mic ? 'mic' : 'micoff'} size={u(15)} color={S.mic ? '#8FD07E' : CREAM} />{S.mic ? 'Mic on' : 'Mic off'}
          </button>
        )}
      </div>
      {S.rows.map((r) => {
        const st = r.lead ? 'Leader' : r.rdy ? 'Ready' : 'Not ready';
        const ask = S.kickAsk === r.id;
        return (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: u(7), minHeight: u(32), padding: `${u(2)}px 0`, borderTop: `1px solid ${LINE}` }}>
            <span aria-hidden="true" style={{ width: u(7), height: u(7), flexShrink: 0, borderRadius: '50%', background: r.talk ? '#7CF29A' : r.you ? AMBER : 'rgba(239,232,210,0.28)', boxShadow: r.talk ? '0 0 0 3px rgba(124,242,154,0.25)' : 'none' }} />
            <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: u(12.5), fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.you ? `${r.n} (you)` : r.n}</span>
              <span style={{ fontSize: u(10.5), fontWeight: 700, color: r.lead ? AMBER : r.rdy ? '#8FD07E' : MUTED }}>{st}</span>
            </span>
            {!r.you && S.voice && (
              <button type="button" className="zl-b" aria-pressed={!!r.muted} aria-label={r.muted ? `Unmute ${r.n}` : `Mute ${r.n}`} onClick={() => S.onMute(r.id)}
                style={{ width: u(28), height: u(28), display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, background: r.muted ? 'rgba(217,87,63,0.2)' : 'rgba(239,232,210,0.08)', boxShadow: `inset 0 0 0 1.5px ${r.muted ? '#D9573F' : LINE}`, clipPath: cut(u(5)) }}>
                <Ico k={r.muted ? 'spkoff' : 'spk'} size={u(15)} color={r.muted ? '#FF8A74' : CREAM} />
              </button>
            )}
            {!r.you && S.lead && (
              <button type="button" className="zl-b" aria-label={ask ? `Tap again to remove ${r.n}` : `Remove ${r.n} from the squad`} onClick={() => S.onKick(r.id)}
                style={{ height: u(28), minWidth: u(28), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: u(4), padding: ask ? `0 ${u(8)}px` : 0, background: ask ? '#C9483A' : 'rgba(239,232,210,0.08)', boxShadow: `inset 0 0 0 1.5px ${ask ? '#C9483A' : LINE}`, clipPath: cut(u(5)), color: '#FFFFFF', fontFamily: CFONT, fontSize: u(13), fontWeight: 800 }}>
                {ask ? 'Remove' : <svg width={u(13)} height={u(13)} viewBox="0 0 14 14" aria-hidden="true"><path d="M2.5 2.5l9 9M11.5 2.5l-9 9" stroke={CREAM} strokeWidth="2" strokeLinecap="round" /></svg>}
              </button>
            )}
            {r.you && !S.lead && (
              <button type="button" className="zl-b" aria-label="Leave the squad" onClick={S.onLeave}
                style={{ height: u(26), padding: `0 ${u(10)}px`, background: 'rgba(239,232,210,0.08)', boxShadow: `inset 0 0 0 1.5px ${LINE}`, clipPath: cut(u(5)), color: CREAM, fontFamily: CFONT, fontSize: u(13), fontWeight: 800 }}>Leave</button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Mode({ u, on, title, sub, onPress, tone }) {
  return (
    <button type="button" className="zl-b" aria-pressed={on} onClick={onPress}
      style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', width: '100%', minHeight: u(38), padding: `${u(4)}px ${u(18)}px ${u(4)}px ${u(12)}px`, clipPath: slant(u(12)), background: on ? `linear-gradient(100deg, ${tone || AMBER}, #C98B3E)` : PANEL, boxShadow: on ? 'none' : `inset 3px 0 0 ${tone || AMBER}`, color: on ? '#17140F' : CREAM, textAlign: 'left', fontFamily: CFONT }}>
      <span style={{ fontSize: u(17), fontWeight: 800, lineHeight: 1.05 }}>{title}</span>
      {sub ? <span style={{ fontSize: u(11), fontWeight: 700, lineHeight: 1.2, opacity: on ? 0.75 : 0.62, fontFamily: FONT }}>{sub}</span> : null}
    </button>
  );
}

function Stat({ u, label, v }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `${u(64)}px 1fr`, alignItems: 'center', gap: u(8) }}>
      <span style={{ fontSize: u(11.5), fontWeight: 700, color: MUTED }}>{label}</span>
      <span style={{ height: u(5), background: 'rgba(239,232,210,0.12)', position: 'relative', overflow: 'hidden' }}>
        <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.round(Math.max(0.06, Math.min(1, v)) * 100)}%`, background: AMBER }} />
      </span>
    </div>
  );
}

function Panel({ u, title, onClose, children, w }) {
  return (
    <div className="zl-up" role="dialog" aria-label={title} onPointerDown={(e) => e.stopPropagation()}
      style={{ position: 'absolute', left: '50%', bottom: u(74), transform: 'translateX(-50%)', width: w, maxWidth: '96%', background: 'rgba(12,11,10,0.9)', clipPath: cut(u(12)), boxShadow: `inset 0 0 0 1px ${LINE}`, padding: `${u(10)}px ${u(12)}px ${u(12)}px`, zIndex: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: u(8) }}>
        <span style={{ flex: 1, fontFamily: CFONT, fontSize: u(18), fontWeight: 800, color: CREAM }}>{title}</span>
        <button type="button" className="zl-b" aria-label="Close" onClick={onClose} style={{ width: u(30), height: u(30), display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,232,210,0.08)', clipPath: cut(u(6)), padding: 0 }}><Ico k="close" size={u(16)} color={CREAM} /></button>
      </div>
      {children}
    </div>
  );
}

export function ZLobby({ L }) {
  injectCss();
  const { GS } = L;
  const { top, right, bottom, left } = GS.at;
  const k = Math.max(0.72, Math.min(1.15, GS.W / 820, GS.H / 380));
  const u = (n) => Math.round(n * k * 10) / 10;
  const colW = u(206);
  const tab = L.tab;
  const plateGun = L.gunIcon(L.gun);
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 5, overflow: 'hidden', fontFamily: FONT, color: CREAM, touchAction: 'none' }}
      onPointerDown={(e) => { if (tab) L.setTab(null); if (L.spin) { L.spin(e, 0); try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} } }}
      onPointerMove={(e) => { if (L.spin) L.spin(e, 1); }}
      onPointerUp={(e) => { if (L.spin) L.spin(e, 2); }}
      onPointerCancel={(e) => { if (L.spin) L.spin(e, 2); }}>
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(90deg, rgba(8,7,6,0.62) 0%, rgba(8,7,6,0) 30%, rgba(8,7,6,0) 70%, rgba(8,7,6,0.62) 100%), linear-gradient(180deg, rgba(8,7,6,0.55) 0%, rgba(8,7,6,0) 18%, rgba(8,7,6,0) 72%, rgba(8,7,6,0.7) 100%)' }} />

      <div style={{ position: 'absolute', top: top(8), left: left(12), right: right(12), display: 'flex', alignItems: 'center', gap: u(10) }} onPointerDown={(e) => e.stopPropagation()}>
        <GBtn icon="close" color="white" size={u(36)} fast={false} label="Leave" onPress={L.onClose} />
        <div style={{ display: 'flex', alignItems: 'center', gap: u(8), padding: `${u(3)}px ${u(14)}px ${u(3)}px ${u(3)}px`, background: PANEL, clipPath: slant(u(10)), minWidth: 0 }}>
          <Avatar emoji={L.me && L.me.avatar} name={L.name} size={u(32)} />
          <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{ fontFamily: CFONT, fontSize: u(16), fontWeight: 800, lineHeight: 1.05, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: u(150) }}>{L.name}</span>
            {L.best > 0 ? <span style={{ fontSize: u(11), fontWeight: 700, color: AMBER, whiteSpace: 'nowrap' }}>{`Best wave ${L.best}`}</span> : null}
          </span>
        </div>
        <div role="status" aria-label={`Your cash, ${L.cash} dollars`}
          style={{ height: u(36), display: 'flex', alignItems: 'center', padding: `0 ${u(12)}px`, background: PANEL, clipPath: cut(u(7)), boxShadow: `inset 0 0 0 1px ${LINE}` }}>
          <span style={{ fontFamily: CFONT, fontSize: u(18), fontWeight: 800, color: '#86F09A', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{`$${(L.cash || 0).toLocaleString()}`}</span>
        </div>
        <div style={{ flex: 1 }} />
        {L.cloud && (
          <button type="button" className="zl-b" aria-label="Server" onClick={L.onServer}
            style={{ height: u(36), display: 'flex', alignItems: 'center', gap: u(7), padding: `0 ${u(12)}px`, background: PANEL, clipPath: cut(u(7)), boxShadow: `inset 0 0 0 1px ${LINE}`, color: CREAM, fontFamily: CFONT }}>
            <Bars ms={L.ping} u={u} />
            <span style={{ fontSize: u(15), fontWeight: 800 }}>{L.server}</span>
            {L.ping && L.ping < 9999 ? <span style={{ fontSize: u(12), fontWeight: 700, color: MUTED, fontFamily: FONT }}>{`${L.ping} ms`}</span> : null}
          </button>
        )}
        {L.canInvite && <IconBtn u={u} label="Invite friends" onPress={L.onFriends}><Ico k="people" size={u(19)} color={CREAM} /></IconBtn>}
        {L.onMaker && <IconBtn u={u} label="Map maker" onPress={L.onMaker}><Ico k="map" size={u(19)} color={CREAM} /></IconBtn>}
        <IconBtn u={u} label="Settings" onPress={L.onSettings}><Ico k="gear" size={u(19)} color={CREAM} /></IconBtn>
      </div>

      <div style={{ position: 'absolute', top: `calc(${top(8)} + ${u(46)}px)`, left: left(12), width: colW, display: 'flex', flexDirection: 'column', gap: u(6) }} onPointerDown={(e) => e.stopPropagation()}>
        <div style={{ fontFamily: CFONT, fontSize: u(24), fontWeight: 800, color: AMBER, lineHeight: 1.05, letterSpacing: '0.005em', whiteSpace: 'nowrap', textShadow: '0 2px 0 rgba(0,0,0,0.45), 0 0 18px rgba(200,68,46,0.35)', marginBottom: u(4) }}>Zombie Junction</div>
        {L.modes.map((m) => <Mode key={m.k} u={u} on={L.mode === m.k} title={m.t} sub={m.s} tone={m.tone} onPress={() => L.setMode(m.k)} />)}
        {L.rooms.length > 0 && L.mode === 'online' && (
          <div style={{ marginTop: u(4), background: PANEL, clipPath: cut(u(9)), padding: `${u(6)}px ${u(8)}px`, display: 'flex', flexDirection: 'column', gap: u(3) }}>
            <span style={{ fontSize: u(11), fontWeight: 800, color: MUTED }}>Open rooms</span>
            {L.rooms.slice(0, 3).map((o) => (
              <button key={`${o.reg}:${o.r}`} type="button" className="zl-b" disabled={o.p >= (o.cap || 50)} onClick={() => L.onRoom(o)}
                style={{ display: 'flex', alignItems: 'center', gap: u(6), padding: `${u(3)}px 0`, background: 'transparent', color: CREAM, textAlign: 'left', fontFamily: FONT }}>
                <span style={{ flex: 1, minWidth: 0, fontSize: u(12.5), fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.h ? `${o.h}'s room` : 'Room'}</span>
                <span style={{ fontSize: u(11), fontWeight: 700, color: MUTED, whiteSpace: 'nowrap' }}>{`${o.p} playing${o.w ? `, wave ${o.w}` : ''}`}</span>
                <span style={{ fontSize: u(11.5), fontWeight: 900, color: AMBER }}>Join</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="zl-col" style={{ position: 'absolute', top: `calc(${top(8)} + ${u(46)}px)`, bottom: `calc(${bottom(10)} + ${u(L.startNote ? 86 : 68)}px)`, right: right(12), width: colW, display: 'grid', alignContent: 'start', gap: u(6), overflowY: 'auto', overscrollBehavior: 'contain', scrollbarWidth: 'none' }} onPointerDown={(e) => e.stopPropagation()}>
        {L.squad && <Squad u={u} S={L.squad} />}
        {L.friendRows.length > 0 && (
          <div style={{ background: PANEL, clipPath: cut(u(10)), padding: `${u(7)}px ${u(8)}px ${u(5)}px` }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: u(6), marginBottom: u(4) }}>
              <span style={{ fontFamily: CFONT, fontSize: u(16), fontWeight: 800 }}>Friends</span>
              <span style={{ fontSize: u(11), fontWeight: 700, color: MUTED }}>{L.onlineN > 0 ? `${L.onlineN} online` : 'No one online'}</span>
            </div>
            {L.friendRows.map((f) => (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: u(8), padding: `${u(3)}px 0`, borderTop: `1px solid ${LINE}` }}>
                <Avatar emoji={f.avatar} name={f.name} size={u(28)} />
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: u(12.5), fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: u(4), fontSize: u(10.5), fontWeight: 700, color: f.on ? '#8FD07E' : MUTED }}>
                    <span style={{ width: u(6), height: u(6), borderRadius: '50%', background: f.on ? '#6CC25A' : 'rgba(239,232,210,0.3)' }} />
                    {f.on ? 'Online' : 'Offline'}
                  </span>
                </span>
                <button type="button" className="zl-b" aria-label={f.sent ? `Invite sent to ${f.name}` : `Invite ${f.name}`} disabled={f.sent} onClick={() => L.onInviteFriend(f)}
                  style={{ width: u(28), height: u(28), display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, background: f.sent ? 'rgba(124,196,107,0.18)' : 'rgba(224,168,90,0.14)', boxShadow: `inset 0 0 0 1.5px ${f.sent ? '#7CC46B' : AMBER}`, clipPath: cut(u(5)), color: f.sent ? '#7CC46B' : AMBER, fontSize: u(18), fontWeight: 800, lineHeight: 1 }}>
                  {f.sent ? <svg width={u(14)} height={u(14)} viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg> : '+'}
                </button>
              </div>
            ))}
          </div>
        )}
        {L.showBots && (
          <div role="radiogroup" aria-label="Bots" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: u(4) }}>
            {[[true, 'With bots'], [false, 'No bots']].map(([v, t]) => (
              <button key={t} type="button" role="radio" aria-checked={L.bots === v} className="zl-b" onClick={() => L.setBots(v)}
                style={{ height: u(32), background: L.bots === v ? 'rgba(224,168,90,0.2)' : PANEL, boxShadow: `inset 0 0 0 1.5px ${L.bots === v ? AMBER : LINE}`, clipPath: cut(u(6)), color: L.bots === v ? AMBER : CREAM, fontFamily: CFONT, fontSize: u(15), fontWeight: 800 }}>{t}</button>
            ))}
          </div>
        )}
      </div>

      <div style={{ position: 'absolute', left: '50%', bottom: `calc(${bottom(10)} + ${u(62)}px)`, transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: u(6), pointerEvents: 'auto' }} onPointerDown={(e) => e.stopPropagation()}>
        {L.petName && (
          <button type="button" className="zl-b" onClick={() => L.setTab('dog')} aria-label={`Dog, ${L.petName}`}
            style={{ height: u(32), display: 'flex', alignItems: 'center', gap: u(6), padding: `0 ${u(10)}px`, background: PANEL, clipPath: cut(u(6)), color: CREAM, fontFamily: CFONT, fontSize: u(15), fontWeight: 800 }}>
            <Ico k="paw" size={u(15)} color={AMBER} />{L.petName}
          </button>
        )}
        <button type="button" className="zl-b" onClick={() => L.setTab('survivor')} aria-label={`Survivor, ${L.charName}`}
          style={{ height: u(36), display: 'flex', alignItems: 'center', gap: u(9), padding: `0 ${u(12)}px`, background: 'rgba(14,13,12,0.82)', clipPath: cut(u(7)), boxShadow: `inset 0 -2px 0 ${AMBER}`, color: CREAM }}>
          <span style={{ fontFamily: CFONT, fontSize: u(19), fontWeight: 800 }}>{L.charName}</span>
          <span style={{ fontSize: u(12), fontWeight: 800, color: MUTED }}>Starts with a pistol</span>
        </button>
      </div>

      <div role="tablist" aria-label="Loadout" style={{ position: 'absolute', left: '50%', bottom: bottom(10), transform: 'translateX(-50%)', display: 'flex', gap: u(4) }} onPointerDown={(e) => e.stopPropagation()}>
        <button type="button" className="zl-b" onClick={L.onEmote} aria-label="Emotes"
          style={{ width: u(88), height: u(52), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: u(2), background: PANEL, clipPath: cut(u(8)), boxShadow: `inset 0 -2px 0 ${LINE}`, color: CREAM, padding: 0 }}>
          <Ico k="smile" size={u(20)} color={CREAM} />
          <span style={{ fontFamily: CFONT, fontSize: u(14), fontWeight: 800 }}>Emotes</span>
        </button>
        {[['survivor', 'Survivor'], ['dog', 'Dog']].map(([key, t]) => {
          const on = tab === key;
          return (
            <button key={key} type="button" role="tab" aria-selected={on} className="zl-b" onClick={() => L.setTab(on ? null : key)}
              style={{ width: u(88), height: u(52), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: u(2), background: on ? 'rgba(224,168,90,0.22)' : PANEL, clipPath: cut(u(8)), boxShadow: `inset 0 ${on ? -3 : -2}px 0 ${on ? AMBER : LINE}`, color: on ? AMBER : CREAM, padding: 0 }}>
              {key === 'loadout' && plateGun ? <img src={plateGun} alt="" draggable={false} style={{ height: u(20), width: 'auto' }} /> : key === 'dog' ? <Ico k="paw" size={u(20)} color={on ? AMBER : CREAM} /> : (
                <svg width={u(20)} height={u(20)} viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7.2" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M4.8 20.5c.7-4.1 3.5-6.4 7.2-6.4s6.5 2.3 7.2 6.4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
              )}
              <span style={{ fontFamily: CFONT, fontSize: u(14), fontWeight: 800 }}>{t}</span>
            </button>
          );
        })}
      </div>

      {L.mates && L.mates.length > 0 && (
        <div ref={L.tagRef} aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          {L.mates.map((m) => (
            <div key={m.id} data-sq={m.id} style={{ position: 'absolute', left: 0, top: 0, opacity: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: u(2) }}>
              <span style={{ padding: `${u(2)}px ${u(9)}px`, background: 'rgba(14,13,12,0.74)', clipPath: cut(u(4)), fontFamily: CFONT, fontSize: u(15), fontWeight: 800, color: CREAM, whiteSpace: 'nowrap' }}>{m.n}</span>
              {m.lead || m.rdy ? <span style={{ fontSize: u(10.5), fontWeight: 800, color: m.lead ? AMBER : '#8FD07E', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>{m.lead ? 'Leader' : 'Ready'}</span> : null}
            </div>
          ))}
        </div>
      )}

      {L.toast ? (
        <div key={L.toast.at} role="status" aria-live="polite" className="zl-up" style={{ position: 'absolute', left: '50%', top: `calc(${top(8)} + ${u(50)}px)`, padding: `${u(7)}px ${u(16)}px`, background: 'rgba(14,13,12,0.86)', clipPath: cut(u(7)), boxShadow: `inset 0 0 0 1px ${LINE}`, fontFamily: CFONT, fontSize: u(15), fontWeight: 800, color: CREAM, whiteSpace: 'nowrap', pointerEvents: 'none', transform: 'translateX(-50%)' }}>{L.toast.t}</div>
      ) : null}

      {L.startNote ? (
        <div role="status" style={{ position: 'absolute', right: right(12), bottom: `calc(${bottom(10)} + ${u(62)}px)`, width: colW, textAlign: 'center', fontSize: u(12), fontWeight: 800, color: CREAM, textShadow: '0 1px 3px rgba(0,0,0,0.85)', pointerEvents: 'none' }}>{L.startNote}</div>
      ) : null}

      <button type="button" className="zl-b" onClick={L.onStart} onPointerDown={(e) => e.stopPropagation()} aria-label={L.startLabel}
        style={{ position: 'absolute', right: right(12), bottom: bottom(10), width: colW, height: u(58), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: u(10), clipPath: `polygon(${u(14)}px 0, 100% 0, calc(100% - ${u(14)}px) 100%, 0 100%)`, background: L.startReady ? 'linear-gradient(180deg, #F2C04E 0%, #E3A233 55%, #C9862A 100%)' : 'linear-gradient(180deg, #8C7A55, #6E5F43)', color: '#17140F', boxShadow: 'inset 0 -3px 0 rgba(0,0,0,0.25)' }}>
        {L.startReady && L.startIcon !== false ? <svg width={u(20)} height={u(22)} viewBox="0 0 20 22" aria-hidden="true"><path d="M3 2.2v17.6c0 .9 1 1.4 1.7.9l13.3-8.8c.6-.4.6-1.4 0-1.8L4.7 1.3C4 .8 3 1.3 3 2.2z" fill="currentColor" /></svg> : null}
        <span style={{ fontFamily: CFONT, fontSize: L.startReady ? u(28) : u(18), fontWeight: 800, letterSpacing: '0.01em' }}>{L.startText}</span>
      </button>

      {tab === 'survivor' && (
        <Panel u={u} title="Survivor" onClose={() => L.setTab(null)} w={u(560)}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, minmax(0, 1fr))', gap: u(6) }}>
            {L.chars.map((c) => (
              <button key={c.k} type="button" className="zl-b" aria-pressed={c.on} aria-label={c.n} onClick={() => L.pickChar(c)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: u(3), padding: 0, background: 'transparent', color: c.on ? AMBER : CREAM, fontFamily: CFONT }}>
                <span style={{ position: 'relative', width: '100%', aspectRatio: '1', clipPath: cut(u(7)), background: c.on ? 'linear-gradient(180deg, #3A3226, #1C1915)' : 'rgba(239,232,210,0.07)', boxShadow: `inset 0 0 0 ${c.on ? 2 : 1}px ${c.on ? AMBER : LINE}` }}>
                  <img src={c.img} alt="" draggable={false} style={{ width: '100%', height: '100%', display: 'block' }} />
                  <DlMark st={c.st} />
                </span>
                <span style={{ fontSize: u(14), fontWeight: 800, lineHeight: 1 }}>{c.n}</span>
                <span style={{ fontSize: u(10.5), fontWeight: 700, color: MUTED, fontFamily: FONT, lineHeight: 1 }}>{c.g}</span>
              </button>
            ))}
          </div>
        </Panel>
      )}
      {tab === 'loadout' && (
        <Panel u={u} title="Loadout" onClose={() => L.setTab(null)} w={u(600)}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: u(6) }}>
            {L.guns.map((g) => (
              <button key={g.k} type="button" className="zl-b" aria-pressed={g.on} aria-label={g.n} onClick={() => L.pickGun(g.k)}
                style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: u(4), padding: `${u(6)}px ${u(6)}px ${u(7)}px`, clipPath: cut(u(8)), background: g.on ? 'linear-gradient(180deg, #3A3226, #1C1915)' : 'rgba(239,232,210,0.06)', boxShadow: `inset 0 0 0 ${g.on ? 2 : 1}px ${g.on ? AMBER : LINE}`, color: g.on ? AMBER : CREAM, textAlign: 'left' }}>
                <span style={{ height: u(40), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{g.img ? <img src={g.img} alt="" draggable={false} style={{ maxWidth: '100%', maxHeight: '100%' }} /> : null}</span>
                <span style={{ fontFamily: CFONT, fontSize: u(15), fontWeight: 800 }}>{g.n}</span>
                <Stat u={u} label="Damage" v={g.dmg} />
                <Stat u={u} label="Fire rate" v={g.rate} />
                <Stat u={u} label="Range" v={g.rng} />
                <DlMark st={g.st} />
              </button>
            ))}
          </div>
          <div style={{ marginTop: u(8), fontSize: u(11.5), fontWeight: 700, color: MUTED }}>{`Second gun: ${L.secondName}`}</div>
        </Panel>
      )}
      {tab === 'server' && (
        <Panel u={u} title="Server" onClose={() => L.setTab(null)} w={u(360)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: u(5) }}>
            {L.servers.map((sv) => (
              <button key={sv.k} type="button" className="zl-b" aria-pressed={sv.on} onClick={() => { L.pickServer(sv.k); L.setTab(null); }}
                style={{ display: 'flex', alignItems: 'center', gap: u(10), height: u(40), padding: `0 ${u(12)}px`, clipPath: cut(u(7)), background: sv.on ? 'rgba(224,168,90,0.18)' : 'rgba(239,232,210,0.06)', boxShadow: `inset 0 0 0 ${sv.on ? 2 : 1}px ${sv.on ? AMBER : LINE}`, color: sv.on ? AMBER : CREAM, fontFamily: CFONT }}>
                <Bars ms={sv.ping} u={u} />
                <span style={{ flex: 1, textAlign: 'left', fontSize: u(17), fontWeight: 800 }}>{sv.n}</span>
                <span style={{ fontSize: u(12.5), fontWeight: 700, color: MUTED, fontFamily: FONT }}>{sv.ping && sv.ping < 9999 ? `${sv.ping} ms` : 'Checking'}</span>
              </button>
            ))}
          </div>
        </Panel>
      )}
      {tab === 'dog' && (
        <Panel u={u} title="Dog" onClose={() => L.setTab(null)} w={u(420)}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: u(8) }}>
            {L.dogs.map((d) => (
              <button key={d.k} type="button" className="zl-b" aria-pressed={d.on} aria-label={d.n} onClick={() => L.pickDog(d.k)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: u(4), padding: 0, background: 'transparent', color: d.on ? AMBER : CREAM, fontFamily: CFONT }}>
                <span style={{ width: '100%', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', clipPath: cut(u(7)), background: d.on ? 'linear-gradient(180deg, #3A3226, #1C1915)' : 'rgba(239,232,210,0.07)', boxShadow: `inset 0 0 0 ${d.on ? 2 : 1}px ${d.on ? AMBER : LINE}`, overflow: 'hidden' }}>
                  {d.img ? <img src={d.img} alt="" draggable={false} style={{ width: '100%', height: '100%', display: 'block' }} /> : <Ico k="close" size={u(20)} color={MUTED} />}
                </span>
                <span style={{ fontSize: u(14), fontWeight: 800 }}>{d.n}</span>
              </button>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
