import { useState, useEffect } from 'react';
import { SHOP, WEAPONS } from './zsim.js';
import { BS, kitTap, injectKitCss } from './gamekit.jsx';

const CASH = '#86F09A';
const ITEMS = ['plate', 'band', 'med', 'nade', 'molo', 'c4'];
const money = (v) => `$${Math.max(0, Math.round(v)).toLocaleString('en-US')}`;
const pic = (k) => `/dead/p_shop_${k}.webp`;

function countOf(k, H) {
  if (k === 'plate') return H.plates | 0;
  if (k === 'band') return H.band | 0;
  if (k === 'med') return H.med | 0;
  if (k === 'nade') return H.nades | 0;
  if (k === 'molo') return H.molos | 0;
  if (k === 'c4') return H.c4s | 0;
  return 0;
}

function Slot({ id, sel, onPick, children, label, h, tag, count }) {
  const on = sel === id;
  return (
    <button type="button" aria-pressed={on} aria-label={label} className="zbag-slot" onPointerDown={(e) => e.stopPropagation()} onClick={() => onPick(id)}
      style={{ position: 'relative', height: h, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 6, border: 'none', borderRadius: 2, cursor: 'pointer', fontFamily: BS.font, color: '#FFFFFF',
        background: on ? 'radial-gradient(ellipse 70% 60% at 50% 45%, rgba(242,225,27,0.16), rgba(242,225,27,0) 72%), linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0.03))' : 'radial-gradient(ellipse 70% 60% at 50% 45%, rgba(150,170,235,0.13), rgba(150,170,235,0) 72%), linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
        boxShadow: on ? `inset 0 0 0 2px ${BS.yel}` : 'inset 0 0 0 1px rgba(255,255,255,0.09)' }}>
      {children}
      {tag ? <span style={{ position: 'absolute', left: 6, top: 5, fontSize: 10.5, fontWeight: 800, color: BS.ink, background: BS.yel, padding: '1px 5px' }}>{tag}</span> : null}
      {count != null ? <span style={{ position: 'absolute', right: 6, bottom: 4, fontSize: 13, fontWeight: 900, fontVariantNumeric: 'tabular-nums', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>{`x${count}`}</span> : null}
    </button>
  );
}

function Act({ text, onPress, off, gold }) {
  return (
    <button type="button" className="zbag-act" disabled={off} onPointerDown={(e) => e.stopPropagation()} onClick={() => { if (off) return; kitTap(); onPress(); }}
      style={{ height: 40, minWidth: 74, padding: '0 16px', border: 'none', borderRadius: 0, cursor: off ? 'default' : 'pointer', fontFamily: BS.font, fontSize: 15, fontWeight: 900, fontStyle: gold && !off ? 'italic' : 'normal', whiteSpace: 'nowrap',
        color: off ? 'rgba(232,236,248,0.4)' : gold ? BS.ink : '#FFFFFF', background: off ? 'rgba(255,255,255,0.04)' : gold ? BS.yel : 'rgba(255,255,255,0.08)', boxShadow: off || gold ? 'none' : `inset 0 0 0 1px ${BS.edge}`, clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}>
      {text}
    </button>
  );
}

export function BagScreen({ GS, H, off, onDrop, onClose }) {
  injectKitCss();
  const guns = (H.slots || []).filter((w) => WEAPONS[w]);
  const cash = H.cash | 0;
  const items = ITEMS.filter((k) => countOf(k, H) > 0);
  const ids = [...guns.map((w) => `g:${w}`), 'cash', ...items];
  const [sel, setSel] = useState(() => (H.w && guns.includes(H.w) ? `g:${H.w}` : ids[0] || 'cash'));
  const cur = ids.includes(sel) ? sel : ids[0] || 'cash';
  const pick = (id) => { if (id !== sel) { kitTap(); setSel(id); } };
  useEffect(() => {
    const kd = (e) => { if (e.key === 'Escape') { e.preventDefault(); onClose(); } };
    window.addEventListener('keydown', kd);
    return () => window.removeEventListener('keydown', kd);
  }, [onClose]);
  const wide = GS.W >= 600;
  const headH = 46, barH = wide ? 70 : 112;
  const bodyH = GS.H - headH - barH - 12;
  const gunH = Math.max(58, Math.min(104, Math.floor((bodyH - 30) / 3)));
  const itemH = Math.max(70, Math.min(116, Math.floor((bodyH - 30) / 2)));
  let name, sub, picEl, acts;
  if (cur.startsWith('g:')) {
    const w = cur.slice(2);
    name = WEAPONS[w].n;
    sub = w === H.w ? 'In your hands' : '';
    picEl = <img src={pic(w)} alt="" draggable={false} style={{ maxWidth: 96, maxHeight: 46, objectFit: 'contain' }} />;
    acts = [<Act key="d" text="Drop" gold off={off || guns.length < 2} onPress={() => onDrop('gun', w)} />];
  } else if (cur === 'cash') {
    name = 'Cash';
    sub = money(cash);
    picEl = <span style={{ fontSize: 30, fontWeight: 900, color: CASH }}>$</span>;
    acts = [100, 500, 1000].map((v) => <Act key={v} text={money(v)} off={off || cash < v} onPress={() => onDrop('cash', v)} />).concat(<Act key="all" text="All" gold off={off || cash < 1} onPress={() => onDrop('cash', cash)} />);
  } else {
    const n = countOf(cur, H);
    name = SHOP[cur] ? SHOP[cur].n : cur;
    sub = `x${n}`;
    picEl = <img src={pic(cur)} alt="" draggable={false} style={{ maxWidth: 50, maxHeight: 46, objectFit: 'contain' }} />;
    acts = [<Act key="1" text="Drop 1" off={off || n < 1} onPress={() => onDrop(cur, 1)} />];
    if (n > 1) acts.push(<Act key="a" text="Drop all" gold off={off} onPress={() => onDrop(cur, n)} />);
  }
  const gunCards = guns.map((w) => (
    <Slot key={w} id={`g:${w}`} sel={cur} onPick={pick} h={gunH} label={`${WEAPONS[w].n}${w === H.w ? ', in your hands' : ''}`} tag={w === H.w ? 'In hand' : ''}>
      <img src={pic(w)} alt="" draggable={false} style={{ maxWidth: '88%', maxHeight: gunH - 16, objectFit: 'contain', filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.45))', pointerEvents: 'none' }} />
    </Slot>
  ));
  const itemTiles = [
    <Slot key="cash" id="cash" sel={cur} onPick={pick} h={itemH} label={`Cash, ${cash} dollars`}>
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <span style={{ fontSize: 26, fontWeight: 900, color: CASH, lineHeight: 1 }}>$</span>
        <span style={{ fontSize: 15, fontWeight: 900, color: CASH, fontVariantNumeric: 'tabular-nums' }}>{money(cash)}</span>
      </span>
    </Slot>,
    ...items.map((k) => (
      <Slot key={k} id={k} sel={cur} onPick={pick} h={itemH} label={`${SHOP[k] ? SHOP[k].n : k}, ${countOf(k, H)}`} count={countOf(k, H)}>
        <img src={pic(k)} alt="" draggable={false} style={{ maxWidth: '78%', maxHeight: itemH - 22, objectFit: 'contain', filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.45))', pointerEvents: 'none' }} />
      </Slot>
    )),
  ];
  const head = (t) => <span style={{ height: 16, fontSize: 11.5, fontWeight: 700, color: BS.sub, paddingLeft: 2 }}>{t}</span>;
  return (
    <div role="dialog" aria-label="Backpack" onPointerDown={(e) => e.stopPropagation()} onPointerMove={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()}
      style={{ position: 'absolute', inset: 0, zIndex: 60, display: 'flex', flexDirection: 'column', background: BS.bg, color: '#FFFFFF', fontFamily: BS.font, overflow: 'hidden', pointerEvents: 'auto', userSelect: 'none', WebkitUserSelect: 'none' }}>
      <style>{'.zbag-slot{transition:box-shadow .12s ease,transform .08s ease}.zbag-slot:active,.zbag-act:active{transform:scale(0.97)}.zbag-slot:focus-visible,.zbag-act:focus-visible{outline:2px solid #2EC5E6;outline-offset:2px}'}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: headH, flexShrink: 0, paddingLeft: 'max(16px, env(safe-area-inset-left, 0px))', paddingRight: 'max(10px, env(safe-area-inset-right, 0px))', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <span style={{ fontSize: 21, fontWeight: 800, fontStyle: 'italic', letterSpacing: '0.04em' }}>Backpack</span>
        <span style={{ flex: 1 }} />
        <span aria-label={`Your cash, ${cash} dollars`} style={{ display: 'flex', alignItems: 'center', gap: 7, height: 28, padding: '0 12px', background: 'rgba(6,8,22,0.45)', boxShadow: 'inset 0 0 0 1px rgba(134,240,154,0.3)' }}>
          <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true"><rect x="0.75" y="0.75" width="16.5" height="10.5" rx="1.5" fill="none" stroke={CASH} strokeWidth="1.5" /><circle cx="9" cy="6" r="2.4" fill="none" stroke={CASH} strokeWidth="1.5" /></svg>
          <span style={{ fontSize: 17, fontWeight: 800, color: CASH, fontVariantNumeric: 'tabular-nums' }}>{money(cash)}</span>
        </span>
        <button type="button" aria-label="Close backpack" className="zgk-btn" onPointerDown={(e) => e.stopPropagation()} onClick={() => { kitTap(); onClose(); }}
          style={{ width: 34, height: 34, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, border: 'none', borderRadius: 0, background: 'rgba(255,255,255,0.06)', boxShadow: `inset 0 0 0 1px ${BS.edge}`, cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 2l10 10M12 2L2 12" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" /></svg>
        </button>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: wide ? 'row' : 'column', gap: 12, overflowY: wide ? 'hidden' : 'auto', touchAction: 'pan-y', padding: '8px 14px 6px', paddingLeft: 'max(14px, env(safe-area-inset-left, 0px))', paddingRight: 'max(14px, env(safe-area-inset-right, 0px))' }}>
        <div role="group" aria-label="Weapons" style={{ flex: wide ? '0 0 36%' : 'none', display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
          {head('Weapons')}
          {gunCards}
        </div>
        <div role="group" aria-label="Items" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {head('Items')}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${wide ? 4 : 3}, minmax(0, 1fr))`, gap: 8, alignContent: 'start' }}>{itemTiles}</div>
        </div>
      </div>
      <div style={{ flexShrink: 0, minHeight: barH, display: 'flex', flexWrap: wide ? 'nowrap' : 'wrap', alignItems: 'center', gap: wide ? 16 : 10, padding: '8px 14px', paddingLeft: 'max(16px, env(safe-area-inset-left, 0px))', paddingRight: 'max(14px, env(safe-area-inset-right, 0px))', paddingBottom: 'max(8px, env(safe-area-inset-bottom, 0px))', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(6,8,22,0.35)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: wide ? '1 1 auto' : '1 1 100%' }}>
          <span style={{ width: 96, height: 46, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{picEl}</span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <span style={{ fontSize: 17, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
            {sub ? <span style={{ fontSize: 12.5, fontWeight: 700, color: BS.sub }}>{sub}</span> : null}
          </span>
          {off ? <span style={{ marginLeft: 6, fontSize: 11.5, fontWeight: 800, color: '#FFB0A4', background: 'rgba(255,90,70,0.12)', padding: '3px 8px', whiteSpace: 'nowrap' }}>Can't drop now</span> : null}
        </span>
        <span style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 'auto', flexWrap: 'wrap', justifyContent: 'flex-end' }}>{acts}</span>
      </div>
    </div>
  );
}
