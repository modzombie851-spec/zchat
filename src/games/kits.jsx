import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient.js';

const GOLD = { w: ['#FFF4CC', '#F0C566', '#B07F22'], b: ['#8A919C', '#3E434C', '#15181D'], ws: '#6E4A0C', bs: '#07080A', wl: 'rgba(110,74,12,0.6)', bl: 'rgba(235,238,245,0.42)' };
export const GAME_KITS = [
  { key: 'chess-club', game: 'chess', label: 'Club green', price: 200, rarity: 'rare', about: 'The calm green and cream of a chess club table. Easy on the eyes for long games.', board: { light: '#E9EDCF', dark: '#6F8F4E', ink: ['#E9EDCF', '#55733A'], wood: ['#34432A', '#1C2516'] } },
  { key: 'chess-marble', game: 'chess', label: 'Marble', price: 400, rarity: 'epic', about: 'A cool marble board with white stone and dark onyx pieces.', board: { light: '#EEECE6', dark: '#9CA2A8', ink: ['#EEECE6', '#6B727A'], wood: ['#D4D0C8', '#8C887F'], veins: true }, pieces: { w: ['#FFFFFF', '#EEEEEA', '#C7C7C1'], b: ['#5C616A', '#2B2F35', '#101215'], ws: '#4B4F56', bs: '#030405', wl: 'rgba(75,79,86,0.6)', bl: 'rgba(228,232,238,0.4)' } },
  { key: 'chess-royal', game: 'chess', label: 'Royal gold', price: 800, rarity: 'legendary', vip: true, about: 'Gold against gunmetal on a deep navy board with a gilded edge.', board: { light: '#DCCB9E', dark: '#2B3B5E', ink: ['#DCCB9E', '#1E2B48'], wood: ['#F2D27E', '#9B7124'], gild: true }, pieces: GOLD },
  { key: 'chess-midnight', game: 'chess', label: 'Midnight glass', price: 1200, rarity: 'mythic', vip: true, about: 'Ice glass and violet glass pieces on a midnight board that glows at the edge.', board: { light: '#3B4262', dark: '#1B1F33', ink: ['#7FE3FF', '#7FE3FF'], wood: ['#161A2E', '#07080F'], glow: '#58D8FF' }, pieces: { w: ['#F4FCFF', '#BFE8FF', '#78C3EE'], b: ['#D2B9FF', '#7D52E3', '#3A1E8E'], ws: '#2C6F9A', bs: '#1B0B47', wl: 'rgba(44,111,154,0.55)', bl: 'rgba(232,218,255,0.5)' } },
  { key: 'ckr-candy', game: 'ckr', label: 'Candy', price: 200, rarity: 'rare', about: 'Mint and strawberry pieces on a soft pink board.', board: { light: '#FFF2F5', dark: '#E996B0', wood: ['#F7B8CB', '#C26B88'] }, discs: { w: ['#FFFFFF', '#CFFAEB', '#7ADFC0'], wb: '#3E9E80', b: ['#FFE5EE', '#FF9DBB', '#DA5A84'], bb: '#9E2E52' } },
  { key: 'ckr-stone', game: 'ckr', label: 'River stone', price: 350, rarity: 'epic', about: 'Smooth sandstone and slate pieces on a grey stone board.', board: { light: '#CFCAC0', dark: '#5D6570', wood: ['#8F8B83', '#4C4A45'] }, discs: { w: ['#F6F1E8', '#D9CDB9', '#A8977E'], wb: '#786752', b: ['#8A929C', '#4B5159', '#23272C'], bb: '#101215' } },
  { key: 'ckr-royal', game: 'ckr', label: 'Royal', price: 700, rarity: 'legendary', vip: true, about: 'Gold and gunmetal pieces on a navy board with a gilded edge.', board: { light: '#DCCB9E', dark: '#2B3B5E', wood: ['#F2D27E', '#9B7124'], gild: true }, discs: { w: ['#FFF4CC', '#F0C566', '#B07F22'], wb: '#6E4A0C', b: ['#8A919C', '#3E434C', '#15181D'], bb: '#07080A' } },
  { key: 'pool-blue', game: 'pool', label: 'Tournament blue', price: 250, rarity: 'rare', about: 'Blue cloth like the big tournaments. Every ball pops against it.', cloth: '#1D5E9E' },
  { key: 'pool-wine', game: 'pool', label: 'Wine red', price: 400, rarity: 'epic', about: 'Deep red cloth for a warm, late night table.', cloth: '#7A2433' },
  { key: 'pool-velvet', game: 'pool', label: 'Velvet purple', price: 400, rarity: 'epic', about: 'Purple velvet cloth that looks rich under the lamps.', cloth: '#4F2C84' },
  { key: 'pool-midnight', game: 'pool', label: 'Midnight', price: 900, rarity: 'legendary', vip: true, about: 'Near black cloth that makes every ball glow. A table for the best.', cloth: '#1A2030' },
  { key: 'crm-walnut', game: 'crm', label: 'Dark walnut', price: 350, rarity: 'epic', about: 'A dark walnut board with a warm, polished finish.', surface: ['#B88452', '#8C5C33', '#D2A271'] },
  { key: 'crm-ice', game: 'crm', label: 'Ice maple', price: 700, rarity: 'legendary', vip: true, about: 'Pale maple that is almost white, smooth and fast like a champion board.', surface: ['#F2ECE0', '#D6CCBB', '#FFFFFF'] },
  { key: 'cue-ember', game: 'cue', label: 'Ember cue', price: 250, rarity: 'rare', about: 'A maple cue with a flame red forearm. The other player sees it every time you shoot.', cue: { joint: ['#B88A2E', '#F5D78A', '#7A5A18'], fore: ['#C2410C', '#FB923C', '#7C2D12'], wrap: ['#1C1917', '#44403C', '#0C0A09'], butt: ['#991B1B', '#EF4444', '#450A0A'] } },
  { key: 'cue-ocean', game: 'cue', label: 'Deep sea cue', price: 250, rarity: 'rare', about: 'Ocean blue inlays on light maple. The other player sees it every time you shoot.', cue: { joint: ['#C0C7D6', '#FFFFFF', '#7D8799'], fore: ['#0E7490', '#22D3EE', '#164E63'], wrap: ['#0F172A', '#334155', '#020617'], butt: ['#1E3A8A', '#3B82F6', '#172554'] } },
  { key: 'cue-neon', game: 'cue', label: 'Neon cue', price: 450, rarity: 'epic', about: 'Hot pink and cyan like an arcade at night. The other player sees it every time you shoot.', cue: { shaft: ['#D9C29A', '#F5E9D2', '#B39668'], joint: ['#E5E7EB', '#FFFFFF', '#9CA3AF'], fore: ['#C026D3', '#F0ABFC', '#701A75'], wrap: ['#111827', '#374151', '#030712'], butt: ['#0891B2', '#67E8F9', '#164E63'] } },
  { key: 'cue-dragon', game: 'cue', label: 'Dragon gold cue', price: 900, rarity: 'legendary', vip: true, about: 'Gold and dragon red with a black wrap. A cue the other player will notice.', cue: { joint: ['#D4A017', '#FFF1B8', '#8A6508'], fore: ['#B45309', '#FCD34D', '#78350F'], wrap: ['#0B0B0B', '#3F3F46', '#000000'], butt: ['#7F1D1D', '#DC2626', '#450A0A'] } },
  { key: 'cue-galaxy', game: 'cue', label: 'Galaxy cue', price: 1400, rarity: 'mythic', vip: true, about: 'Deep space purple with a silver joint. The rarest cue on the table.', cue: { shaft: ['#CDB98F', '#EFE3C8', '#A88F62'], joint: ['#C0C7D6', '#FFFFFF', '#7D8799'], fore: ['#4C1D95', '#8B5CF6', '#1E1B4B'], wrap: ['#0B1026', '#1E293B', '#020617'], butt: ['#1E1B4B', '#6366F1', '#0F0A2E'] } },
  { key: 'striker-ruby', game: 'striker', label: 'Ruby striker', price: 200, rarity: 'rare', about: 'A deep red striker with a gold star. The other player sees it on every shot.', striker: { base: '#C8102E', dark: '#6E0A19', ring: '#FFD36E', accent: '#FFFFFF' } },
  { key: 'striker-ocean', game: 'striker', label: 'Ocean striker', price: 200, rarity: 'rare', about: 'Sea blue with a white star. The other player sees it on every shot.', striker: { base: '#1D6FB8', dark: '#0B3463', ring: '#FFFFFF', accent: '#7FE3FF' } },
  { key: 'striker-galaxy', game: 'striker', label: 'Galaxy striker', price: 450, rarity: 'epic', about: 'Purple space swirls with a silver star. The other player sees it on every shot.', striker: { base: '#4C1D95', dark: '#1E1048', ring: '#E5E7EB', accent: '#A78BFA' } },
  { key: 'striker-gold', game: 'striker', label: 'Royal gold striker', price: 900, rarity: 'legendary', vip: true, about: 'Polished gold with a black star. A champion striker everyone notices.', striker: { base: '#E8B931', dark: '#8A6508', ring: '#1B1B1F', accent: '#FFF1B8' } },
];
export const GAME_KIT_BY = Object.fromEntries(GAME_KITS.map((k) => [k.key, k]));
export const KIT_GAMES = ['chess', 'ckr', 'pool', 'crm', 'cue', 'striker'];
export const KIT_GAME_NAMES = { chess: 'Chess', ckr: 'Checkers', pool: '8 ball pool', crm: 'Carrom', cue: '8 ball pool', striker: 'Carrom' };
const gear = { cue: { me: null, peer: null }, striker: { me: null, peer: null } };
export function setGear(slot, me, peer) { if (gear[slot]) gear[slot] = { me: me || null, peer: peer || null }; }
export function gearLook(slot, side) {
  const g = gear[slot];
  const k = g ? g[side === 'peer' ? 'peer' : 'me'] : null;
  const kit = k ? GAME_KIT_BY[k] : null;
  return kit && kit.game === slot ? kit[slot] || null : null;
}
const peerKits = new Map();
export function usePeerKit(uid) {
  const [v, setV] = useState(() => (uid && peerKits.has(uid) ? peerKits.get(uid) : null));
  useEffect(() => {
    if (!uid) return undefined;
    let alive = true;
    try {
      supabase.rpc('zchat_game_kit_of', { p_user: uid }).then(({ data, error }) => {
        if (!alive || error || !data || typeof data !== 'object') return;
        peerKits.set(uid, data);
        setV(data);
      }, () => {});
    } catch {}
    return () => { alive = false; };
  }, [uid]);
  return v;
}

const kitMem = { uid: null, map: null, subs: new Set() };
function store() { return `zchat-gamekits-${kitMem.uid || 'x'}`; }
function load() {
  if (kitMem.map) return kitMem.map;
  let v = null;
  try { v = JSON.parse(localStorage.getItem(store()) || 'null'); } catch { v = null; }
  kitMem.map = v && typeof v === 'object' ? v : {};
  return kitMem.map;
}
function ping() { kitMem.subs.forEach((f) => { try { f(); } catch {} }); }
export function kitUser(uid) {
  if (kitMem.uid === uid) return;
  kitMem.uid = uid || null;
  kitMem.map = null;
  ping();
}
export function kitKeyFor(game) { const k = load()[game]; return k && GAME_KIT_BY[k] && GAME_KIT_BY[k].game === game ? k : null; }
export function kitFor(game) { const k = kitKeyFor(game); return k ? GAME_KIT_BY[k] : null; }
export function kitSet(game, key) {
  const m = { ...load() };
  if (key && GAME_KIT_BY[key] && GAME_KIT_BY[key].game === game) m[game] = key; else delete m[game];
  kitMem.map = m;
  try { localStorage.setItem(store(), JSON.stringify(m)); } catch {}
  ping();
}
export function kitMerge(remote) {
  if (!remote || typeof remote !== 'object') return;
  const m = { ...load() };
  let changed = false;
  KIT_GAMES.forEach((g) => { const k = remote[g]; if (typeof k === 'string' && (k === '' || GAME_KIT_BY[k]) && m[g] !== (k || undefined)) { if (k) m[g] = k; else delete m[g]; changed = true; } });
  if (!changed) return;
  kitMem.map = m;
  try { localStorage.setItem(store(), JSON.stringify(m)); } catch {}
  ping();
}
export function gameKitSave(game, key) {
  try { supabase.rpc('zchat_game_kit_set', { p_game: game, p_key: key || '' }).then(() => {}, () => {}); } catch {}
}
let kitPulled = null;
export function gameKitPull() {
  if (kitPulled === kitMem.uid) return;
  kitPulled = kitMem.uid;
  try { supabase.rpc('zchat_game_kit_get').then(({ data, error }) => { if (!error && data && typeof data === 'object') kitMerge(data); }, () => { kitPulled = null; }); } catch { kitPulled = null; }
}
export function useKit(game) {
  const [, setT] = useState(0);
  useEffect(() => { const f = () => setT((x) => x + 1); kitMem.subs.add(f); return () => { kitMem.subs.delete(f); }; }, []);
  return kitFor(game);
}

const PAWN = 'M22.5 9 c-2.2 0 -4 1.8 -4 4 c0 .9 .3 1.7 .8 2.4 c-2 1.1 -3.3 3.2 -3.3 5.6 c0 2 .9 3.8 2.4 5 c-3 1 -7.4 5.5 -7.4 13.5 h23 c0 -8 -4.4 -12.5 -7.4 -13.5 c1.5 -1.2 2.4 -3 2.4 -5 c0 -2.4 -1.3 -4.5 -3.3 -5.6 c.5 -.7 .8 -1.5 .8 -2.4 c0 -2.2 -1.8 -4 -4 -4 z';
const KING = 'M22.5 5.5 v7 M19.3 8.7 h6.4 M15.6 22.6 c-.6 -6.8 14.4 -6.8 13.8 0 l-1.8 5 h-10.2 z M17.6 27.6 l-2.2 7.6 h14.2 l-2.2 -7.6 z M12 35.2 h21 a1.2 1.2 0 0 1 1.2 1.2 v2.4 a1.2 1.2 0 0 1 -1.2 1.2 h-21 a1.2 1.2 0 0 1 -1.2 -1.2 v-2.4 a1.2 1.2 0 0 1 1.2 -1.2 z';
export function GameKitArt({ k, size = 120 }) {
  const kit = GAME_KIT_BY[k];
  if (!kit) return null;
  const id = `gk${k.replace(/[^a-z0-9]/gi, '')}`;
  if (kit.game === 'cue') {
    const c = kit.cue;
    const seg = (x0, x1, h0, h1, col, key) => <path key={key} d={`M${x0} ${60 - h0}L${x1} ${60 - h1}L${x1} ${60 + h1}L${x0} ${60 + h0}z`} fill={`url(#${id}${key})`} />;
    const grads = [['t', ['#2F5C9E', '#5C8AD0', '#244A82']], ['s', c.shaft || ['#C99A62', '#F1D9AE', '#A87A47']], ['j', c.joint], ['f', c.fore], ['w', c.wrap], ['b', c.butt]];
    return (
      <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true" style={{ display: 'block' }}>
        <defs>
          <radialGradient id={`${id}bg`} cx="0.5" cy="0.4" r="0.8"><stop offset="0" stopColor="#2E7D4F" /><stop offset="1" stopColor="#123D27" /></radialGradient>
          {grads.map(([n, col]) => <linearGradient key={n} id={`${id}${n}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={col[2]} /><stop offset="0.4" stopColor={col[1]} /><stop offset="0.65" stopColor={col[0]} /><stop offset="1" stopColor={col[2]} /></linearGradient>)}
        </defs>
        <rect width="120" height="120" rx="20" fill={`url(#${id}bg)`} />
        <circle cx="26" cy="86" r="9" fill="#FFFFFF" />
        <circle cx="23" cy="83" r="3" fill="rgba(255,255,255,0.9)" />
        <g transform="rotate(-32 60 60)">
          {seg(-6, -2, 1.6, 1.7, null, 't')}{seg(-2, 40, 1.7, 2.6, null, 's')}{seg(40, 44, 2.6, 2.7, null, 'j')}{seg(44, 76, 2.7, 3.4, null, 'f')}{seg(76, 100, 3.4, 3.8, null, 'w')}{seg(100, 128, 3.8, 4.1, null, 'b')}
        </g>
      </svg>
    );
  }
  if (kit.game === 'striker') {
    const p = kit.striker;
    const star = [];
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 - Math.PI / 2; const r = i % 2 ? 9 : 21; star.push(`${(60 + Math.cos(a) * r).toFixed(1)},${(60 + Math.sin(a) * r).toFixed(1)}`); }
    return (
      <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true" style={{ display: 'block' }}>
        <defs>
          <radialGradient id={`${id}bd`} cx="0.5" cy="0.45" r="0.8"><stop offset="0" stopColor="#E9C58F" /><stop offset="1" stopColor="#B07F45" /></radialGradient>
          <radialGradient id={`${id}st`} cx="0.35" cy="0.3" r="0.9"><stop offset="0" stopColor={p.accent} stopOpacity="0.5" /><stop offset="0.45" stopColor={p.base} /><stop offset="1" stopColor={p.dark} /></radialGradient>
        </defs>
        <rect width="120" height="120" rx="20" fill={`url(#${id}bd)`} />
        <ellipse cx="62" cy="66" rx="36" ry="34" fill="rgba(0,0,0,0.25)" />
        <circle cx="60" cy="60" r="36" fill={`url(#${id}st)`} />
        <circle cx="60" cy="60" r="31" fill="none" stroke={p.ring} strokeWidth="3" opacity="0.9" />
        <circle cx="60" cy="60" r="23" fill="none" stroke={p.accent} strokeWidth="1.6" opacity="0.8" />
        <polygon points={star.join(' ')} fill={p.ring} />
        <circle cx="60" cy="60" r="35" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="2" />
        <ellipse cx="48" cy="44" rx="14" ry="7" fill="rgba(255,255,255,0.28)" transform="rotate(-30 48 44)" />
      </svg>
    );
  }
  if (kit.game === 'chess' || kit.game === 'ckr') {
    const b = kit.board;
    const cells = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) cells.push(<rect key={`${r}${c}`} x={10 + c * 25} y={10 + r * 25} width="25" height="25" fill={(r + c) % 2 ? b.dark : b.light} />);
    const P = kit.pieces || { w: ['#FFFDF6', '#F1E6CF', '#D9C6A2'], b: ['#5A4A40', '#2E2420', '#15100D'], ws: '#3A2A1C', bs: '#0B0806' };
    const D = kit.discs;
    return (
      <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true" style={{ display: 'block' }}>
        <defs>
          <linearGradient id={`${id}f`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={b.wood[0]} /><stop offset="1" stopColor={b.wood[1]} /></linearGradient>
          <linearGradient id={`${id}w`} x1="0" y1="0" x2="0.4" y2="1">{(D ? D.w : P.w).map((c, i) => <stop key={i} offset={i / 2} stopColor={c} />)}</linearGradient>
          <linearGradient id={`${id}b`} x1="0" y1="0" x2="0.4" y2="1">{(D ? D.b : P.b).map((c, i) => <stop key={i} offset={i / 2} stopColor={c} />)}</linearGradient>
        </defs>
        <rect x="2" y="2" width="116" height="116" rx="14" fill={`url(#${id}f)`} />
        {b.glow && <rect x="5" y="5" width="110" height="110" rx="11" fill="none" stroke={b.glow} strokeOpacity="0.55" strokeWidth="2" />}
        {b.gild && <rect x="6" y="6" width="108" height="108" rx="10" fill="none" stroke="#FFF1C2" strokeOpacity="0.7" strokeWidth="1.4" />}
        <g>{cells}</g>
        {b.veins && <path d="M10 40 Q40 30 60 52 T110 46 M14 88 Q48 76 70 96 T108 84" fill="none" stroke="#FFFFFF" strokeOpacity="0.35" strokeWidth="1.4" />}
        {D ? (
          <g>
            <circle cx="47" cy="75" r="15" fill={D.wb} /><circle cx="47" cy="72" r="15" fill={`url(#${id}w)`} /><circle cx="47" cy="72" r="9.5" fill="none" stroke={D.wb} strokeOpacity="0.45" strokeWidth="1.4" />
            <circle cx="76" cy="48" r="15" fill={D.bb} /><circle cx="76" cy="45" r="15" fill={`url(#${id}b)`} /><circle cx="76" cy="45" r="9.5" fill="none" stroke="#FFFFFF" strokeOpacity="0.18" strokeWidth="1.4" />
            <path d="M68 49 L69.5 40 L73 44 L76 37.5 L79 44 L82.5 40 L84 49 Z" fill="#E7B53C" stroke="#8A5A10" strokeWidth="1" strokeLinejoin="round" />
          </g>
        ) : (
          <g>
            <g transform="translate(16 36) scale(1.3)"><path d={KING} fill={`url(#${id}w)`} stroke={P.ws} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" /></g>
            <g transform="translate(60 28) scale(1.2)"><path d={PAWN} fill={`url(#${id}b)`} stroke={P.bs} strokeWidth="1.4" strokeLinejoin="round" /></g>
          </g>
        )}
      </svg>
    );
  }
  if (kit.game === 'pool') {
    return (
      <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true" style={{ display: 'block' }}>
        <defs><radialGradient id={`${id}c`} cx="0.5" cy="0.45" r="0.7"><stop offset="0" stopColor={kit.cloth} /><stop offset="1" stopColor="#000000" stopOpacity="0.55" /></radialGradient></defs>
        <rect x="8" y="22" width="104" height="76" rx="12" fill="#3A2412" />
        <rect x="16" y="30" width="88" height="60" rx="5" fill={kit.cloth} />
        <rect x="16" y="30" width="88" height="60" rx="5" fill={`url(#${id}c)`} opacity="0.55" />
        {[[18, 32], [60, 30], [102, 32], [18, 88], [60, 90], [102, 88]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4.2" fill="#050407" />)}
        <circle cx="40" cy="62" r="6" fill="#F7F4EC" /><circle cx="38" cy="60" r="1.6" fill="#FFFFFF" />
        <circle cx="74" cy="54" r="6" fill="#F2B21B" /><circle cx="84" cy="62" r="6" fill="#2F86E8" /><circle cx="74" cy="68" r="6" fill="#121212" />
        <circle cx="74" cy="68" r="2.4" fill="#FFFFFF" />
        {kit.vip && <path d="M16 30 h88" stroke="#F2D27E" strokeWidth="1.2" strokeOpacity="0.8" />}
      </svg>
    );
  }
  const s = kit.surface || ['#E9C99A', '#C9A06A', '#F7E2BE'];
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true" style={{ display: 'block' }}>
      <defs><linearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={s[2]} /><stop offset="0.5" stopColor={s[0]} /><stop offset="1" stopColor={s[1]} /></linearGradient></defs>
      <rect x="6" y="6" width="108" height="108" rx="10" fill="#2A1A0E" />
      <rect x="14" y="14" width="92" height="92" rx="3" fill={`url(#${id}s)`} />
      {[[20, 20], [100, 20], [20, 100], [100, 100]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="5.5" fill="#0B0705" />)}
      <circle cx="60" cy="60" r="16" fill="none" stroke="#8E1F1F" strokeOpacity="0.7" strokeWidth="1.5" />
      <circle cx="60" cy="60" r="5" fill="#C8323A" />
      {[[48, 52], [72, 52], [52, 70], [68, 70]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="5" fill={i % 2 ? '#151010' : '#F6EEDC'} />)}
    </svg>
  );
}
