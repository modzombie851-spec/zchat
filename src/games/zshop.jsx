import { useState, useRef, useEffect } from 'react';
import { SHOP, WEAPONS, BOOM } from './zsim.js';
import { BS, kitTap, injectKitCss } from './gamekit.jsx';

const GUN_COLS = [['Pistols', ['pistol', 'deagle']], ['SMGs', ['uzi', 'smg', 'qq9']], ['Rifles', ['rifle', 'ak47']], ['Shotguns', ['shotgun', 'spas']], ['Snipers', ['xpr', 'sniper', 'awm']], ['Heavy', ['lmg', 'mgl']]];
const GEAR = ['ammo', 'plate', 'band', 'med', 'nade', 'molo', 'c4'];
const SHORT = { pistol: 'Pistol', deagle: 'Desert Eagle', uzi: 'Uzi', smg: 'SMG', qq9: 'MP5', rifle: 'Rifle', ak47: 'AK47', shotgun: 'Shotgun', spas: 'SPAS 12', xpr: 'UAR 10', sniper: 'Sniper', awm: 'AWM', lmg: 'M249', mgl: 'Bomb gun', ammo: 'Ammo', plate: 'Armor plate', band: 'Bandage', med: 'Med shot', nade: 'Grenade', molo: 'Molotov', c4: 'C4' };
const KIND = { pistol: 'Pistol', deagle: 'Heavy pistol', uzi: 'Machine pistol', smg: 'SMG', qq9: 'SMG', rifle: 'Assault rifle', ak47: 'Assault rifle', shotgun: 'Shotgun', spas: 'Combat shotgun', xpr: 'Marksman rifle', sniper: 'Sniper rifle', awm: 'Sniper rifle', lmg: 'Machine gun', mgl: 'Grenade launcher' };
const INFO = { ammo: 'Fills the ammo for all your guns', plate: 'Blocks most damage until it cracks. Your vest holds 3', band: 'Heals 35 over a few seconds', med: 'Heals 60 right away', nade: 'Blows up everything near where it lands', molo: 'Leaves a patch of fire that burns zombies', c4: 'Throw it, then set it off when you want' };
const CASH = '#86F09A';
const LOW = 'rgba(255,128,116,0.92)';
const img = (k) => `/dead/p_shop_${k}.webp`;
const money = (v) => `$${Math.max(0, Math.round(v)).toLocaleString('en-US')}`;

function gunStats(k) {
  const W = WEAPONS[k];
  const d = W.boom ? BOOM.dmg : W.dmg * (W.pel || 1);
  return [['Damage', Math.min(1, Math.sqrt(d / 350))], ['Fire rate', Math.min(1, Math.sqrt(W.rate / 13.5))], ['Range', Math.min(1, W.rng / 110)], ['Accuracy', Math.max(0.08, 1 - (0.85 * W.spr) / 0.12)]];
}

function itemState(k, H, me) {
  const it = SHOP[k];
  const owned = it.c === 'gun' && (H.slots || []).includes(k);
  let have = '', full = false;
  if (k === 'plate') { have = `${H.plates || 0}/${it.max}`; full = (H.plates || 0) >= it.max; }
  else if (k === 'c4') { have = `${H.c4s || 0}/3`; full = (H.c4s || 0) >= 3; }
  else if (k === 'band') { have = `${H.band || 0}/${it.max}`; full = (H.band || 0) >= it.max; }
  else if (k === 'med') { have = `${H.med || 0}/${it.max}`; full = (H.med || 0) >= it.max; }
  else if (k === 'nade') have = String(me ? me.nades || 0 : 0);
  else if (k === 'molo') have = String(me ? me.molos || 0 : 0);
  const cash = H.cash || 0;
  return { it, owned, have, full, short: Math.max(0, it.price - cash), can: !owned && !full && cash >= it.price };
}

function Pic({ k, h }) {
  const [bad, setBad] = useState(false);
  if (bad) return <span aria-hidden="true" style={{ height: h }} />;
  return <img src={img(k)} alt="" draggable={false} decoding="async" onError={() => setBad(true)} style={{ display: 'block', maxWidth: '100%', height: h, objectFit: 'contain', pointerEvents: 'none', filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.45))' }} />;
}

function Tile({ k, H, me, sel, onPick, h, imgH, badge }) {
  const s = itemState(k, H, me);
  const on = sel === k;
  const label = `${SHOP[k].n}, ${s.owned ? 'owned' : s.full ? 'full' : `${s.it.price} dollars`}`;
  return (
    <button type="button" aria-pressed={on} aria-label={label} className="zshop-tile" onPointerDown={(e) => e.stopPropagation()} onClick={() => onPick(k)}
      style={{ position: 'relative', height: h, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'stretch', padding: '4px 6px 5px', border: 'none', borderRadius: 2, cursor: 'pointer', fontFamily: BS.font, color: '#FFFFFF', textAlign: 'left',
        background: on ? 'radial-gradient(ellipse 70% 60% at 50% 38%, rgba(242,225,27,0.16), rgba(242,225,27,0) 72%), linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0.03))' : 'radial-gradient(ellipse 70% 60% at 50% 38%, rgba(150,170,235,0.16), rgba(150,170,235,0) 72%), linear-gradient(180deg, rgba(255,255,255,0.065), rgba(255,255,255,0.02))',
        boxShadow: on ? `inset 0 0 0 2px ${BS.yel}` : 'inset 0 0 0 1px rgba(255,255,255,0.09)', opacity: s.owned || s.full ? 0.78 : 1 }}>
      <span style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Pic k={k} h={imgH} /></span>
      <span style={{ display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 0 }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{SHORT[k]}</span>
        {s.owned ? <span style={{ fontSize: 12, fontWeight: 800, color: BS.teal }}>Owned</span> : <span style={{ fontSize: 13, fontWeight: 800, color: s.full ? BS.sub : s.short ? LOW : CASH, fontVariantNumeric: 'tabular-nums' }}>{s.full ? 'Full' : money(s.it.price)}</span>}
      </span>
      {badge && s.have ? <span style={{ position: 'absolute', top: 5, right: 6, fontSize: 11.5, fontWeight: 800, color: 'rgba(232,236,248,0.85)', fontVariantNumeric: 'tabular-nums' }}>{s.it.c === 'gear' && (k === 'nade' || k === 'molo') ? `x${s.have}` : s.have}</span> : null}
    </button>
  );
}

function Bar({ label, v }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
      <span style={{ width: 54, flexShrink: 0, fontSize: 11, fontWeight: 700, color: BS.sub }}>{label}</span>
      <span style={{ position: 'relative', flex: 1, height: 5, background: 'rgba(255,255,255,0.1)' }}>
        <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.round(v * 100)}%`, background: '#E8ECF6' }} />
      </span>
    </span>
  );
}

export function ShopScreen({ GS, H, me, onBuy, onClose }) {
  injectKitCss();
  const [tab, setTab] = useState('gun');
  const [sel, setSel] = useState(() => {
    for (const [, ks] of GUN_COLS) for (const k of ks) { const s = itemState(k, H, me); if (s.can) return k; }
    return 'ammo';
  });
  const tapRef = useRef({ k: null, t: 0 });
  const wide = GS.W >= 600;
  const buy = (k) => { const s = itemState(k, H, me); if (!s.can) return; kitTap(); onBuy(k); };
  const pick = (k) => {
    const T = tapRef.current, now = Date.now();
    if (T.k === k && now - T.t < 380) { T.t = 0; buy(k); return; }
    T.k = k; T.t = now;
    if (sel !== k) { kitTap(); setSel(k); }
  };
  const goTab = (t) => { if (t === tab) return; kitTap(); setTab(t); const first = t === 'gun' ? GUN_COLS[0][1][0] : 'ammo'; if (SHOP[sel].c !== t) setSel(first); };
  useEffect(() => {
    const kd = (e) => { if (e.key === 'Escape') { e.preventDefault(); onClose(); } };
    window.addEventListener('keydown', kd);
    return () => window.removeEventListener('keydown', kd);
  }, [onClose]);
  const S = itemState(sel, H, me);
  const barH = wide ? 72 : 118;
  const headH = 46;
  const gridH = GS.H - headH - barH - 14;
  const gunTileH = wide ? Math.max(56, Math.min(96, Math.floor((gridH - 22 - 12) / 3))) : 84;
  const gearRows = 2;
  const gearTileH = wide ? Math.max(84, Math.min(150, Math.floor((gridH - 8 - 10) / gearRows))) : 110;
  const hp = Math.max(0, Math.round(H.hp || 0));
  const tabBtn = (t, label) => {
    const on = tab === t;
    return (
      <button key={t} type="button" role="tab" aria-selected={on} className="zgk-btn" onPointerDown={(e) => e.stopPropagation()} onClick={() => goTab(t)}
        style={{ height: 32, padding: '0 18px 0 20px', border: 'none', borderRadius: 0, cursor: 'pointer', fontFamily: BS.font, fontSize: 14.5, fontWeight: 800, color: on ? BS.ink : 'rgba(214,220,240,0.72)', background: on ? BS.yel : 'rgba(255,255,255,0.05)', clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)' }}>
        {label}
      </button>
    );
  };
  let btnText, btnOn = false;
  if (S.owned) btnText = 'Owned';
  else if (S.full) btnText = 'Full';
  else if (S.short) btnText = `Need ${money(S.short)} more`;
  else { btnText = `Buy  ${money(S.it.price)}`; btnOn = true; }
  return (
    <div role="dialog" aria-label="Shop" onPointerDown={(e) => e.stopPropagation()} onPointerMove={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()}
      style={{ position: 'absolute', inset: 0, zIndex: 60, display: 'flex', flexDirection: 'column', background: BS.bg, color: '#FFFFFF', fontFamily: BS.font, overflow: 'hidden', pointerEvents: 'auto', userSelect: 'none', WebkitUserSelect: 'none' }}>
      <style>{'.zshop-tile{transition:box-shadow .12s ease,transform .08s ease}.zshop-tile:active{transform:scale(0.97)}.zshop-tile:focus-visible,.zshop-buy:focus-visible{outline:2px solid #2EC5E6;outline-offset:2px}'}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: headH, flexShrink: 0, paddingLeft: 'max(16px, env(safe-area-inset-left, 0px))', paddingRight: 'max(10px, env(safe-area-inset-right, 0px))', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <span style={{ fontSize: 21, fontWeight: 800, fontStyle: 'italic', letterSpacing: '0.04em', marginRight: 8 }}>Shop</span>
        <div role="tablist" aria-label="Shop sections" style={{ display: 'flex', gap: 2 }}>{tabBtn('gun', 'Guns')}{tabBtn('gear', 'Gear')}</div>
        <span style={{ flex: 1 }} />
        <span aria-label={`Health ${hp}`} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 28, padding: '0 10px', background: 'rgba(6,8,22,0.45)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)' }}>
          <svg width="13" height="13" viewBox="0 0 13 13" aria-hidden="true"><path d="M5 1h3v4h4v3H8v4H5V8H1V5h4z" fill={hp < 35 ? '#FF6A5A' : '#E8ECF6'} /></svg>
          <span style={{ fontSize: 14, fontWeight: 800, color: hp < 35 ? '#FF6A5A' : '#FFFFFF', fontVariantNumeric: 'tabular-nums' }}>{hp}</span>
        </span>
        <span aria-label={`Your cash, ${H.cash || 0} dollars`} style={{ display: 'flex', alignItems: 'center', gap: 7, height: 28, padding: '0 12px', background: 'rgba(6,8,22,0.45)', boxShadow: 'inset 0 0 0 1px rgba(134,240,154,0.3)' }}>
          <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true"><rect x="0.75" y="0.75" width="16.5" height="10.5" rx="1.5" fill="none" stroke={CASH} strokeWidth="1.5" /><circle cx="9" cy="6" r="2.4" fill="none" stroke={CASH} strokeWidth="1.5" /></svg>
          <span style={{ fontSize: 17, fontWeight: 800, color: CASH, fontVariantNumeric: 'tabular-nums' }}>{money(H.cash || 0)}</span>
        </span>
        <button type="button" aria-label="Close shop" className="zgk-btn" onPointerDown={(e) => e.stopPropagation()} onClick={() => { kitTap(); onClose(); }}
          style={{ width: 34, height: 34, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, border: 'none', borderRadius: 0, background: 'rgba(255,255,255,0.06)', boxShadow: `inset 0 0 0 1px ${BS.edge}`, cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 2l10 10M12 2L2 12" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" /></svg>
        </button>
      </div>
      <div role="tabpanel" aria-label={tab === 'gun' ? 'Guns' : 'Gear'} style={{ flex: 1, minHeight: 0, overflowY: wide ? 'hidden' : 'auto', touchAction: 'pan-y', padding: '8px 14px 6px', paddingLeft: 'max(14px, env(safe-area-inset-left, 0px))', paddingRight: 'max(14px, env(safe-area-inset-right, 0px))' }}>
        {tab === 'gun' && wide && (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${GUN_COLS.length}, minmax(0, 1fr))`, gap: 8, height: '100%' }}>
            {GUN_COLS.map(([label, ks]) => (
              <div key={label} role="group" aria-label={label} style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                <span style={{ height: 16, fontSize: 11.5, fontWeight: 700, color: BS.sub, letterSpacing: '0.02em', paddingLeft: 2 }}>{label}</span>
                {ks.map((k) => <Tile key={k} k={k} H={H} me={me} sel={sel} onPick={pick} h={gunTileH} imgH={Math.round(gunTileH - 26)} />)}
              </div>
            ))}
          </div>
        )}
        {tab === 'gun' && !wide && GUN_COLS.map(([label, ks]) => (
          <div key={label} role="group" aria-label={label} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: BS.sub, padding: '2px 2px 5px' }}>{label}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6 }}>
              {ks.map((k) => <Tile key={k} k={k} H={H} me={me} sel={sel} onPick={pick} h={gunTileH} imgH={gunTileH - 28} />)}
            </div>
          </div>
        ))}
        {tab === 'gear' && (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${wide ? 4 : 2}, minmax(0, 1fr))`, gap: 10, alignContent: 'start' }}>
            {GEAR.filter((k) => SHOP[k]).map((k) => <Tile key={k} k={k} H={H} me={me} sel={sel} onPick={pick} h={gearTileH} imgH={Math.round(gearTileH - 30)} badge />)}
          </div>
        )}
      </div>
      <div style={{ flexShrink: 0, minHeight: barH, display: 'flex', flexWrap: wide ? 'nowrap' : 'wrap', alignItems: 'center', gap: wide ? 16 : 10, padding: '8px 14px', paddingLeft: 'max(16px, env(safe-area-inset-left, 0px))', paddingRight: 'max(14px, env(safe-area-inset-right, 0px))', paddingBottom: 'max(8px, env(safe-area-inset-bottom, 0px))', background: BS.rail, borderTop: '1px solid rgba(255,255,255,0.08)', boxSizing: 'border-box' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: wide ? '0 1 300px' : '1 1 100%' }}>
          <span style={{ width: S.it.c === 'gun' ? 92 : 50, height: 46, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Pic k={sel} h={S.it.c === 'gun' ? 44 : 46} /></span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <span style={{ fontSize: 17, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{SHOP[sel].n}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: BS.sub, lineHeight: 1.25, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {S.it.c === 'gun' ? `${KIND[sel] || ''}. ${WEAPONS[sel].boom ? 'Shoots grenades' : `Mag ${WEAPONS[sel].mag}`}` : `${INFO[sel] || ''}${S.have ? `. You have ${S.have}` : ''}`}
            </span>
          </span>
        </span>
        {S.it.c === 'gun' ? (
          <span style={{ flex: '1 1 220px', minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', columnGap: 14, rowGap: 7 }}>
            {gunStats(sel).map(([l, v]) => <Bar key={l} label={l} v={v} />)}
          </span>
        ) : <span style={{ flex: 1 }} />}
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0, marginLeft: 'auto' }}>
          <button type="button" className="zshop-buy" disabled={!btnOn} onPointerDown={(e) => e.stopPropagation()} onClick={() => buy(sel)} aria-label={btnOn ? `Buy ${SHOP[sel].n} for ${S.it.price} dollars` : btnText}
            style={{ height: 44, minWidth: 168, padding: '0 22px', border: 'none', borderRadius: 0, cursor: btnOn ? 'pointer' : 'default', fontFamily: BS.font, fontSize: btnOn ? 18 : 15, fontWeight: 900, fontStyle: btnOn ? 'italic' : 'normal', letterSpacing: '0.02em', whiteSpace: 'pre',
              color: btnOn ? BS.ink : S.owned ? BS.teal : 'rgba(232,236,248,0.6)', background: btnOn ? BS.yel : 'rgba(255,255,255,0.06)', boxShadow: btnOn ? '0 2px 0 rgba(0,0,0,0.35)' : `inset 0 0 0 1px ${BS.edge}`, clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}>
            {btnText}
          </button>
          {S.it.c === 'gun' && !S.owned && (H.slots || []).length >= 3 ? <span style={{ fontSize: 11, fontWeight: 600, color: BS.sub }}>Replaces the gun in your hands</span> : null}
        </span>
      </div>
    </div>
  );
}
