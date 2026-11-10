import React, { useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { GameRoom, RoomButton, RoomSheet, sfx, haptic } from './kit.jsx';
import { useGameRelay } from './relay.jsx';
import { useMyLevels, useLevels, recordFinish, xpSpan, LEVEL_GAMES, noteRecent } from './levels.jsx';
import { preloadScene } from './scenes.jsx';
import { withFaces } from './faces.jsx';
import { GOLF } from './golf.jsx';
import { useKit } from './kits.jsx';
import {
  ThemeContext, THEMES, Avatar, GAME_TITLES, GAME_RULES, GameArt, g1Mem, g1Send,
  ANIM_STICKERS, useBackClose, reducedMotion, appSnack, ga1Name, GameBareCtx, gameBoardCard, chatGameLink, g1Load,
  PoolTable, CarromTable, ZapTable,
} from '../App.jsx';

export function warmRoom(g) {
  preloadScene(g);
  if (['chess', 'ckr', 'golf'].includes(g)) g1Load();
  if (g === 'pool') import('./pool.jsx').catch(() => {});
  if (g === 'crm') import('./carrom.jsx').catch(() => {});
  if (g === 'zap') import('./cards.jsx').catch(() => {});
}

const STICKER_ORDER = ['haha', 'love', 'hi', 'yes', 'no', 'angry', 'cry', 'thanks', 'sorry', 'omw', 'sleepy', 'night'];
let stickerList = null;
function roomStickers() {
  if (stickerList) return stickerList;
  const by = new Map((ANIM_STICKERS || []).map((s) => [s.key, s]));
  const out = [];
  STICKER_ORDER.forEach((id) => ['cat', 'tuk', 'ele'].forEach((p) => { const s = by.get(`as-${p}-${id}`); if (s) out.push(s); }));
  stickerList = withFaces(out);
  return stickerList;
}
const PHRASES = {
  pool: ['Good luck', 'Nice shot', 'Well played', 'Unlucky', 'Oops', 'Wow', 'Thanks', 'Rematch?'],
  golf: ['Good luck', 'Nice putt', 'Hole in one', 'So close', 'Oops', 'Well played', 'Thanks', 'Rematch?'],
  chess: ['Good luck', 'Nice move', 'Hmm', 'Take your time', 'Oops', 'Well played', 'Thanks', 'Rematch?'],
  crm: ['Good luck', 'Nice shot', 'Great flick', 'So close', 'Oops', 'Well played', 'Thanks', 'Rematch?'],
  zap: ['Good luck', 'Nice one', 'Oh no', 'Last card', 'Not again', 'Well played', 'Thanks', 'Rematch?'],
};
const firstName = (n) => String(n || '').trim().split(' ')[0] || 'Them';
const BOT_FACE_BACK = { 'fc-lol': ['fc-lol', 'fc-grin'], 'fc-grin': ['fc-grin', 'fc-wink'], 'fc-wink': ['fc-smug', 'fc-wink'], 'fc-cool': ['fc-smug', 'fc-cool'], 'fc-love': ['fc-love', 'fc-grin'], 'fc-wow': ['fc-cool', 'fc-smug'], 'fc-smug': ['fc-think', 'fc-smug'], 'fc-think': ['fc-think', 'fc-phew'], 'fc-cry': ['fc-wink', 'fc-love'], 'fc-angry': ['fc-phew', 'fc-scared'], 'fc-phew': ['fc-smug', 'fc-lol'], 'fc-sleep': ['fc-wow', 'fc-angry'], 'fc-dizzy': ['fc-lol', 'fc-wink'], 'fc-scared': ['fc-devil', 'fc-smug'], 'fc-devil': ['fc-scared', 'fc-devil'], 'fc-party': ['fc-party', 'fc-cool'] };
const BOT_LINES = ['Nice one', 'Hmm, let me think', 'You are good at this', 'Watch this', 'Not bad at all', 'Good game so far'];
function useBotSocial(on, myId, botId, g) {
  const subs = useRef(new Map());
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  return useMemo(() => {
    if (!on || !botId) return null;
    const emit = (t, d) => { (subs.current.get(t) || new Set()).forEach((fn) => { try { fn(d); } catch {} }); };
    const later = (fn, ms) => { timers.current.push(setTimeout(fn, ms)); };
    const faces = roomStickers().filter((x) => x.face).map((x) => x.key);
    return {
      me: myId,
      stickers: roomStickers(),
      phrases: PHRASES[g] || PHRASES[g === 'ckr' ? 'chess' : ''],
      on: (t, fn) => { const set = subs.current.get(t) || new Set(); set.add(fn); subs.current.set(t, set); return () => set.delete(fn); },
      send: (t, d) => {
        if (t === 'rx' && d && d.s && Math.random() < 0.85) {
          const pool = BOT_FACE_BACK[d.s] || faces;
          later(() => emit('rx', { from: botId, s: pool[Math.floor(Math.random() * pool.length)] }), 900 + Math.random() * 900);
        }
        if (t === 'say' && Math.random() < 0.7) later(() => emit('say', { from: botId, text: BOT_LINES[Math.floor(Math.random() * BOT_LINES.length)] }), 1200 + Math.random() * 1000);
      },
    };
  }, [on, myId, botId, g]);
}
const pingG1 = () => g1Mem.subs.forEach((f) => { try { f(); } catch {} });
const testing = () => typeof window !== 'undefined' && !!window.__zfake;

function useBox(ref) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const read = () => { const r = { width: el.clientWidth, height: el.clientHeight }; setBox((b) => (Math.abs(b.w - r.width) < 1 && Math.abs(b.h - r.height) < 1 ? b : { w: r.width, h: r.height })); };
    read();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(read) : null;
    if (ro) ro.observe(el); else window.addEventListener('resize', read);
    return () => { if (ro) ro.disconnect(); else window.removeEventListener('resize', read); };
  }, []);
  return box;
}

function usePieceTrack(b, sideOf) {
  const ref = useRef(null);
  const seq = useRef(0);
  return useMemo(() => {
    const prev = ref.current;
    let next = [];
    if (!prev) {
      for (let i = 0; i < 64; i++) if (b[i] !== '.') next.push({ id: ++seq.current, p: b[i], sq: i });
    } else {
      const at = new Map(prev.map((x) => [x.sq, x]));
      const arrivals = [];
      const leaving = [];
      for (let i = 0; i < 64; i++) {
        const old = at.get(i);
        if (b[i] !== '.' && old && old.p === b[i]) next.push(old);
        else { if (b[i] !== '.') arrivals.push(i); if (old) leaving.push(old); }
      }
      const used = new Set();
      const dist = (a, c) => Math.abs((a >> 3) - (c >> 3)) + Math.abs((a & 7) - (c & 7));
      arrivals.forEach((sq) => {
        const p = b[sq];
        let best = null;
        leaving.forEach((d) => { if (!used.has(d.id) && d.p === p && (!best || dist(d.sq, sq) < dist(best.sq, sq))) best = d; });
        if (!best) leaving.forEach((d) => { if (!used.has(d.id) && sideOf(d.p) === sideOf(p) && (!best || dist(d.sq, sq) < dist(best.sq, sq))) best = d; });
        if (best) { used.add(best.id); next.push({ id: best.id, p, sq }); } else next.push({ id: ++seq.current, p, sq });
      });
      leaving.forEach((d) => { if (!used.has(d.id)) next.push({ ...d, gone: true }); });
    }
    ref.current = next.filter((x) => !x.gone);
    return next;
  }, [b]);
}

function sqXY(i, flip, cell) {
  const r = i >> 3;
  const c = i & 7;
  return flip ? [(7 - c) * cell, (7 - r) * cell] : [c * cell, r * cell];
}
function sqAt(x, y, flip, cell) {
  const c = Math.floor(x / cell);
  const r = Math.floor(y / cell);
  if (c < 0 || c > 7 || r < 0 || r > 7) return -1;
  return flip ? (7 - r) * 8 + (7 - c) : r * 8 + c;
}

const BoardSquares = React.memo(function BoardSquares({ size, flip, light, dark, ink, coords, veins }) {
  const c = size / 8;
  const rects = [];
  for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) if ((r + f) % 2 === 1) rects.push(<rect key={r * 8 + f} x={f * c} y={r * c} width={c} height={c} fill={dark} />);
  const files = flip ? 'hgfedcba' : 'abcdefgh';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, display: 'block' }}>
      <defs>
        <pattern id="zgrGrain" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-6)"><path d="M0 2 H7 M0 5.5 H7" stroke="#000000" strokeOpacity="0.045" strokeWidth="0.8" /></pattern>
        <linearGradient id="zgrSheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity="0.14" /><stop offset="0.55" stopColor="#FFFFFF" stopOpacity="0" /><stop offset="1" stopColor="#000000" stopOpacity="0.12" /></linearGradient>
      </defs>
      <rect width={size} height={size} fill={light} />
      {rects}
      <rect width={size} height={size} fill="url(#zgrGrain)" />
      {veins && <path d={`M0 ${size * 0.3} Q${size * 0.3} ${size * 0.22} ${size * 0.5} ${size * 0.42} T${size} ${size * 0.36} M0 ${size * 0.74} Q${size * 0.4} ${size * 0.62} ${size * 0.62} ${size * 0.82} T${size} ${size * 0.7} M${size * 0.2} 0 Q${size * 0.28} ${size * 0.4} ${size * 0.12} ${size}`} fill="none" stroke="#FFFFFF" strokeOpacity="0.28" strokeWidth={Math.max(1, size / 260)} />}
      <rect width={size} height={size} fill="url(#zgrSheen)" />
      {coords && Array.from({ length: 8 }).map((_, i) => (
        <text key={`f${i}`} x={i * c + c - 3} y={size - 3} textAnchor="end" fontSize={Math.max(8, c * 0.2)} fontWeight="800" fontFamily="system-ui, sans-serif" fill={i % 2 ? ink[0] : ink[1]}>{files[i]}</text>
      ))}
      {coords && Array.from({ length: 8 }).map((_, i) => (
        <text key={`r${i}`} x={3} y={i * c + Math.max(9, c * 0.24)} fontSize={Math.max(8, c * 0.2)} fontWeight="800" fontFamily="system-ui, sans-serif" fill={i % 2 ? ink[0] : ink[1]}>{flip ? i + 1 : 8 - i}</text>
      ))}
    </svg>
  );
});

const ChessGlyph = React.memo(function ChessGlyph({ art, white, size, shadow = true, tone }) {
  if (!art) return null;
  const t = tone || null;
  return (
    <svg width={size} height={size} viewBox="0 0 45 45" aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
      {shadow && <ellipse cx="23.5" cy="40.5" rx="12.5" ry="3" fill="#000000" opacity="0.28" />}
      <path d={art.body} fill={white ? 'url(#zgrPw)' : 'url(#zgrPb)'} stroke={white ? (t ? t.ws : '#3A2A1C') : (t ? t.bs : '#0B0806')} strokeWidth="1.4" strokeLinejoin="round" />
      {art.lines && <path d={art.lines} fill="none" stroke={white ? (t ? t.wl : 'rgba(58,42,28,0.7)') : (t ? t.bl : 'rgba(255,236,200,0.42)')} strokeWidth="1.2" strokeLinecap="round" />}
      {art.eye && <circle cx={art.eye[0]} cy={art.eye[1]} r={art.eye[2]} fill={white ? (t ? t.ws : '#3A2A1C') : (t ? t.bl : '#F4E6C8')} />}
    </svg>
  );
});

function PieceDefs({ kit }) {
  const pw = kit && kit.pieces ? kit.pieces.w : ['#FFFDF6', '#F1E6CF', '#D9C6A2'];
  const pb = kit && kit.pieces ? kit.pieces.b : ['#5A4A40', '#2E2420', '#15100D'];
  const dw = kit && kit.discs ? kit.discs.w : ['#FFFFFF', '#F1E7D4', '#C9B48E'];
  const db = kit && kit.discs ? kit.discs.b : ['#6A4F44', '#3A2622', '#1C1210'];
  return (
    <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
      <defs>
        <linearGradient id="zgrPw" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stopColor={pw[0]} /><stop offset="0.6" stopColor={pw[1]} /><stop offset="1" stopColor={pw[2]} /></linearGradient>
        <linearGradient id="zgrPb" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stopColor={pb[0]} /><stop offset="0.5" stopColor={pb[1]} /><stop offset="1" stopColor={pb[2]} /></linearGradient>
        <radialGradient id="zgrDw" cx="0.38" cy="0.32" r="0.75"><stop offset="0" stopColor={dw[0]} /><stop offset="0.55" stopColor={dw[1]} /><stop offset="1" stopColor={dw[2]} /></radialGradient>
        <radialGradient id="zgrDb" cx="0.38" cy="0.32" r="0.75"><stop offset="0" stopColor={db[0]} /><stop offset="0.55" stopColor={db[1]} /><stop offset="1" stopColor={db[2]} /></radialGradient>
      </defs>
    </svg>
  );
}

function BoardFrame({ size, children, wood = ['#5B3A22', '#3A2414'], gild, glow }) {
  return (
    <div style={{ padding: 9, borderRadius: 14, background: `linear-gradient(160deg, ${wood[0]} 0%, ${wood[1]} 100%)`, boxShadow: `0 18px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -2px 0 rgba(0,0,0,0.35)${glow ? `, 0 0 26px ${glow}66, inset 0 0 0 1.5px ${glow}AA` : ''}${gild ? ', inset 0 0 0 2px rgba(255,241,194,0.75)' : ''}` }}>
      <div style={{ position: 'relative', width: size, height: size, borderRadius: 4, overflow: 'hidden', boxShadow: gild ? '0 0 0 1.5px rgba(255,236,170,0.9)' : glow ? `0 0 0 1px ${glow}` : '0 0 0 1px rgba(0,0,0,0.45)' }}>{children}</div>
    </div>
  );
}

function useBoardInput({ size, flip, enabled, canPick, onTap, onDrop }) {
  const ref = useRef(null);
  const st = useRef(null);
  const [drag, setDrag] = useState(null);
  const pos = (e) => { const r = ref.current.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const cell = size / 8;
  const handlers = {
    onPointerDown: (e) => {
      if (!enabled || !ref.current) return;
      const [x, y] = pos(e);
      const sq = sqAt(x, y, flip, cell);
      if (sq < 0) return;
      st.current = { id: e.pointerId, sq, x, y, pick: canPick(sq), moved: false };
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    },
    onPointerMove: (e) => {
      const s = st.current;
      if (!s || s.id !== e.pointerId || !s.pick) return;
      const [x, y] = pos(e);
      if (!s.moved && Math.hypot(x - s.x, y - s.y) < 7) return;
      if (!s.moved) { s.moved = true; onTap(s.sq, true); }
      setDrag({ sq: s.sq, x, y });
    },
    onPointerUp: (e) => {
      const s = st.current;
      st.current = null;
      if (!s || s.id !== e.pointerId) return;
      if (s.moved) {
        const [x, y] = pos(e);
        setDrag(null);
        onDrop(s.sq, sqAt(x, y, flip, cell));
        return;
      }
      onTap(s.sq, false);
    },
    onPointerCancel: () => { st.current = null; setDrag(null); },
  };
  return { ref, handlers, drag };
}

function ChessView({ Z, st, myId, onMove, onMeta, peerSel, onSel, peerName, still }) {
  const kit = useKit('chess');
  const wrap = useRef(null);
  const box = useBox(wrap);
  const size = Math.max(200, Math.floor(Math.min(box.w - 44, box.h - 34, 520) / 8) * 8);
  const cell = size / 8;
  const C = Z ? Z.chess : null;
  const player = myId === st.x || myId === st.o;
  const meWhite = myId === st.wh || !player;
  const flip = !meWhite;
  const finished = !!st.w;
  const myTurn = !!C && !finished && player && st.t === myId;
  const pos = { b: st.b, c: st.c || '', e: st.e == null ? -1 : st.e, h: st.h || 0 };
  const legal = useMemo(() => (C && myTurn ? C.legalMoves(pos, st.t === st.wh) : []), [C, myTurn, st.b, st.c, st.e, st.t]);
  const inCheck = C ? C.inCheck(st.b, st.t === st.wh) : false;
  const last = C && st.m ? C.parseMove(st.m) : null;
  const [sel, setSel] = useState(null);
  const [promo, setPromo] = useState(null);
  useEffect(() => { setSel(null); setPromo(null); }, [st.n]);
  const pieces = usePieceTrack(st.b, (p) => (p === p.toUpperCase() ? 'w' : 'b'));
  const prevN = useRef(st.n);
  useEffect(() => {
    if (prevN.current === st.n) return;
    const grew = (st.n || 0) > (prevN.current || 0);
    prevN.current = st.n;
    if (!grew || !C) return;
    if (st.w) return;
    if (inCheck) sfx('check');
    else if (st.t === myId) sfx('turn');
  }, [st.n]);
  const mineSq = (i) => { const p = st.b[i]; return p !== '.' && (meWhite ? p === p.toUpperCase() : p === p.toLowerCase()); };
  const movable = (i) => myTurn && mineSq(i) && legal.some((m) => m[0] === i);
  const targetsOf = (from) => (from == null ? [] : legal.filter((m) => m[0] === from).map((m) => m[1]));
  const doMove = (f, t, q) => {
    const next = C.play(st, f, t, q || '', myId);
    if (!next) return;
    const capture = st.b[t] !== '.' || (st.b[f].toUpperCase() === 'P' && t === st.e);
    setSel(null); setPromo(null);
    haptic(capture ? 14 : 8);
    sfx(capture ? 'capture' : 'place');
    if (onSel) onSel(null);
    onMove(next);
  };
  const tryMove = (f, t) => {
    const opts = legal.filter((m) => m[0] === f && m[1] === t);
    if (!opts.length) return false;
    if (opts.length > 1) { setPromo({ f, t }); return true; }
    doMove(f, t, opts[0][2]);
    return true;
  };
  const input = useBoardInput({
    size, flip, enabled: myTurn && !promo,
    canPick: movable,
    onTap: (sq, dragging) => {
      if (movable(sq)) { if (dragging || sel !== sq) { setSel(sq); sfx('select'); if (onSel) onSel(sq); } else { setSel(null); if (onSel) onSel(null); } return; }
      if (sel != null && tryMove(sel, sq)) return;
      setSel(null);
      if (onSel) onSel(null);
    },
    onDrop: (from, to) => { if (to < 0 || to === from || !tryMove(from, to)) { setSel(from); } },
  });
  const capsBy = (white) => (st.k || '').split('').filter((ch) => (white ? ch === ch.toLowerCase() : ch === ch.toUpperCase()));
  const val = (arr) => arr.reduce((a, ch) => a + ((C && C.PIECE_VALUE[ch.toLowerCase()]) || 0), 0);
  const mineCaps = capsBy(meWhite);
  const theirCaps = capsBy(!meWhite);
  const diff = val(mineCaps) - val(theirCaps);
  const capLine = (arr, plus) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', minHeight: 16 }}>
      {arr.slice().sort((a, b) => ((C && C.PIECE_VALUE[b.toLowerCase()]) || 0) - ((C && C.PIECE_VALUE[a.toLowerCase()]) || 0)).slice(0, 9).map((ch, i) => <span key={i} style={{ marginRight: -6 }}><ChessGlyph art={C && C.PIECES[ch.toLowerCase()]} white={ch === ch.toUpperCase()} size={17} shadow={false} /></span>)}
      {plus > 0 && <span style={{ marginLeft: 9, fontSize: 11.5, fontWeight: 900 }}>{`+${plus}`}</span>}
      {!arr.length && <span style={{ opacity: 0.7 }}>{meWhite === (arr === mineCaps) ? 'White' : 'Black'}</span>}
    </span>
  );
  const status = finished ? '' : !C ? 'Setting up the board' : myTurn ? (inCheck ? 'Check, your move' : 'Your move') : (inCheck ? `Check, ${peerName} to move` : `${peerName} is thinking`);
  useEffect(() => { onMeta({ status, hot: myTurn, me: capLine(mineCaps, diff), peer: capLine(theirCaps, -diff), center: null }); }, [status, myTurn, st.k, st.n, !!C]);
  const targets = targetsOf(sel);
  const kingSq = inCheck ? st.b.indexOf(st.t === st.wh ? 'K' : 'k') : -1;
  const hl = (i, bg, extra) => { const [x, y] = sqXY(i, flip, cell); return <div key={`h${i}${bg}`} style={{ position: 'absolute', left: x, top: y, width: cell, height: cell, background: bg, ...(extra || {}) }} />; };
  return (
    <div ref={wrap} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {box.w > 0 && (
        <BoardFrame size={size} wood={kit ? kit.board.wood : undefined} gild={!!(kit && kit.board.gild)} glow={kit ? kit.board.glow : null}>
          <PieceDefs kit={kit} />
          <BoardSquares size={size} flip={flip} light={kit ? kit.board.light : '#ECD7B2'} dark={kit ? kit.board.dark : '#A26B45'} ink={kit ? kit.board.ink : ['#ECD7B2', '#8A5634']} veins={!!(kit && kit.board.veins)} coords />
          {last && hl(last[0], 'rgba(255,210,90,0.42)')}
          {last && hl(last[1], 'rgba(255,210,90,0.5)')}
          {sel != null && hl(sel, 'rgba(255,255,255,0.32)', { boxShadow: 'inset 0 0 0 3px rgba(255,255,255,0.85)' })}
          {peerSel != null && !myTurn && hl(peerSel, 'transparent', { boxShadow: 'inset 0 0 0 3px rgba(125,211,252,0.9)', borderRadius: 4 })}
          {kingSq >= 0 && hl(kingSq, 'radial-gradient(circle, rgba(239,68,68,0.9) 0%, rgba(239,68,68,0.35) 45%, rgba(239,68,68,0) 72%)')}
          {pieces.map((pc) => {
            const [x, y] = sqXY(pc.sq, flip, cell);
            const dragging = input.drag && input.drag.sq === pc.sq && !pc.gone;
            const tx = dragging ? input.drag.x - cell / 2 : x;
            const ty = dragging ? input.drag.y - cell * 0.62 : y;
            return (
              <div key={pc.id} style={{ position: 'absolute', left: 0, top: 0, width: cell, height: cell, transform: `translate(${tx}px, ${ty}px)${dragging ? ' scale(1.14)' : ''}`, transition: dragging || still ? 'none' : 'transform 230ms cubic-bezier(.2,.8,.2,1), opacity 260ms ease', opacity: pc.gone ? 0 : 1, zIndex: dragging ? 5 : 2, pointerEvents: 'none', willChange: 'transform' }}>
                <div style={{ padding: cell * 0.04 }}><ChessGlyph art={C && C.PIECES[pc.p.toLowerCase()]} white={pc.p === pc.p.toUpperCase()} size={cell * 0.92} tone={kit && kit.pieces ? kit.pieces : null} /></div>
              </div>
            );
          })}
          {targets.map((t) => {
            const [x, y] = sqXY(t, flip, cell);
            const cap = st.b[t] !== '.';
            return <div key={`t${t}`} style={{ position: 'absolute', left: x, top: y, width: cell, height: cell, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3, pointerEvents: 'none' }}>{cap ? <div style={{ position: 'absolute', inset: 2, borderRadius: '50%', boxShadow: 'inset 0 0 0 4px rgba(30,18,8,0.36)' }} /> : <div style={{ width: cell * 0.3, height: cell * 0.3, borderRadius: '50%', background: 'rgba(30,18,8,0.32)' }} />}</div>;
          })}
          <div ref={input.ref} {...input.handlers} role="grid" aria-label="Chess board" style={{ position: 'absolute', inset: 0, zIndex: 4, touchAction: 'none', cursor: myTurn ? 'pointer' : 'default' }} />
          {promo && C && (
            <div onClick={() => setPromo(null)} style={{ position: 'absolute', inset: 0, zIndex: 8, background: 'rgba(10,6,4,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: 6, padding: 10, borderRadius: 16, background: '#2A1D14', boxShadow: '0 12px 30px rgba(0,0,0,0.5)' }}>
                {['q', 'r', 'b', 'n'].map((q) => (
                  <button key={q} type="button" aria-label={`Promote to ${C.PIECE_NAMES[q]}`} onClick={() => doMove(promo.f, promo.t, q)} className="zgr-press" style={{ width: 54, height: 54, borderRadius: 12, border: 'none', background: '#ECD7B2', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <ChessGlyph art={C.PIECES[q]} white={meWhite} size={46} shadow={false} tone={kit && kit.pieces ? kit.pieces : null} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </BoardFrame>
      )}
    </div>
  );
}

function Disc({ p, size, kit }) {
  const white = p === 'w' || p === 'W';
  const king = p === 'W' || p === 'B';
  const D = kit && kit.discs ? kit.discs : null;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
      <ellipse cx="21" cy="24" rx="17" ry="15" fill="#000000" opacity="0.32" />
      <circle cx="20" cy="22" r="16.5" fill={white ? (D ? D.wb : '#B8A27C') : (D ? D.bb : '#120B09')} />
      <circle cx="20" cy="19.5" r="16.5" fill={white ? 'url(#zgrDw)' : 'url(#zgrDb)'} />
      <circle cx="20" cy="19.5" r="11.5" fill="none" stroke={white ? 'rgba(120,90,50,0.35)' : 'rgba(255,230,200,0.16)'} strokeWidth="1.6" />
      <circle cx="20" cy="19.5" r="7" fill="none" stroke={white ? 'rgba(120,90,50,0.22)' : 'rgba(255,230,200,0.1)'} strokeWidth="1.2" />
      {king && <path d="M11.5 23.5 L13 14.5 L17 18.5 L20 12 L23 18.5 L27 14.5 L28.5 23.5 Z" fill="#E7B53C" stroke="#8A5A10" strokeWidth="1" strokeLinejoin="round" />}
    </svg>
  );
}

function CheckersView({ Z, st, myId, onMove, onMeta, peerSel, onSel, peerName, still }) {
  const kit = useKit('ckr');
  const wrap = useRef(null);
  const box = useBox(wrap);
  const size = Math.max(200, Math.floor(Math.min(box.w - 44, box.h - 34, 520) / 8) * 8);
  const cell = size / 8;
  const K = Z ? Z.ckr : null;
  const player = myId === st.x || myId === st.o;
  const meWhite = myId === st.wh || !player;
  const flip = !meWhite;
  const finished = !!st.w;
  const myTurn = !!K && !finished && player && st.t === myId;
  const legal = useMemo(() => (K && myTurn ? K.legalMoves(st.b, st.t === st.wh) : []), [K, myTurn, st.b, st.t]);
  const [path, setPath] = useState([]);
  useEffect(() => { setPath([]); }, [st.n]);
  const pieces = usePieceTrack(st.b, (p) => p.toLowerCase());
  const prevN = useRef(st.n);
  useEffect(() => {
    if (prevN.current === st.n) return;
    const grew = (st.n || 0) > (prevN.current || 0);
    prevN.current = st.n;
    if (grew && !st.w && st.t === myId) sfx('turn');
  }, [st.n]);
  const must = legal.length && legal[0].taken.length;
  const matching = legal.filter((mv) => path.every((sq, k) => mv.path[k] === sq));
  const nextSquares = path.length ? matching.filter((mv) => mv.path.length > path.length).map((mv) => mv.path[path.length]) : [];
  const starts = [...new Set(legal.map((mv) => mv.path[0]))];
  const pendingTaken = path.length > 1 ? (matching[0] ? matching[0].taken.slice(0, path.length - 1) : []) : [];
  const commit = (np) => {
    const done = legal.find((mv) => mv.path.length === np.length && mv.path.every((sq, k) => sq === np[k]));
    if (!done) return false;
    const next = K.play(st, np, myId);
    if (!next) return false;
    setPath([]);
    haptic(done.taken.length ? 14 : 8);
    sfx(done.taken.length ? 'capture' : 'place');
    const crowned = st.b[np[0]] !== next.b[np[np.length - 1]];
    if (crowned) setTimeout(() => sfx('king'), 220);
    if (onSel) onSel(null);
    onMove(next);
    return true;
  };
  const step = (i) => {
    if (starts.includes(i) && (path.length <= 1 || !nextSquares.includes(i))) { const np = path[0] === i && path.length === 1 ? [] : [i]; setPath(np); sfx('select'); if (onSel) onSel(np.length ? i : null); return; }
    if (!nextSquares.includes(i)) { if (path.length === 1) { setPath([]); if (onSel) onSel(null); } return; }
    const np = path.concat([i]);
    if (commit(np)) return;
    sfx('select');
    setPath(np);
  };
  const input = useBoardInput({
    size, flip, enabled: myTurn,
    canPick: (sq) => starts.includes(sq) && path.length <= 1,
    onTap: (sq, dragging) => { if (dragging) { if (path[0] !== sq) { setPath([sq]); if (onSel) onSel(sq); } return; } step(sq); },
    onDrop: (from, to) => {
      if (to < 0 || to === from) return;
      const direct = legal.find((mv) => mv.path[0] === from && mv.path[mv.path.length - 1] === to);
      if (direct && commit(direct.path)) return;
      if (nextSquares.includes(to)) step(to);
    },
  });
  const counts = K ? K.count(st.b) : { w: 12, b: 12 };
  const mine = meWhite ? counts.w : counts.b;
  const theirs = meWhite ? counts.b : counts.w;
  const status = finished ? '' : !K ? 'Setting up the board' : myTurn ? (path.length > 1 ? 'Keep jumping' : must ? 'Your move, you must take' : 'Your move') : `${peerName} is thinking`;
  const line = (n, white) => <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Disc p={white ? 'w' : 'b'} size={14} />{`${n} left`}</span>;
  useEffect(() => { onMeta({ status, hot: myTurn, me: line(mine, meWhite), peer: line(theirs, !meWhite), center: `${12 - theirs} : ${12 - mine}` }); }, [status, myTurn, mine, theirs]);
  const lastPath = Array.isArray(st.m) ? st.m : [];
  const hl = (i, bg, extra) => { const [x, y] = sqXY(i, flip, cell); return <div key={`h${i}${bg}`} style={{ position: 'absolute', left: x, top: y, width: cell, height: cell, background: bg, ...(extra || {}) }} />; };
  return (
    <div ref={wrap} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {box.w > 0 && (
        <BoardFrame size={size} wood={kit ? kit.board.wood : ['#6A4428', '#40281A']} gild={!!(kit && kit.board.gild)}>
          <PieceDefs kit={kit} />
          <BoardSquares size={size} flip={flip} light={kit ? kit.board.light : '#F0E0BE'} dark={kit ? kit.board.dark : '#5F7A4E'} ink={['#F0E0BE', '#4C6640']} coords={false} />
          {lastPath.map((i) => hl(i, 'rgba(255,214,102,0.38)'))}
          {path.map((i) => hl(i, 'rgba(255,255,255,0.28)', { boxShadow: 'inset 0 0 0 3px rgba(255,255,255,0.85)' }))}
          {peerSel != null && !myTurn && hl(peerSel, 'transparent', { boxShadow: 'inset 0 0 0 3px rgba(125,211,252,0.9)' })}
          {!path.length && myTurn && must ? starts.map((i) => hl(i, 'transparent', { boxShadow: 'inset 0 0 0 3px rgba(250,204,21,0.85)' })) : null}
          {pieces.map((pc) => {
            const moving = path.length > 1 && pc.sq === path[0] && !pc.gone;
            const at = moving ? path[path.length - 1] : pc.sq;
            const [x, y] = sqXY(at, flip, cell);
            const dragging = input.drag && input.drag.sq === pc.sq && !pc.gone;
            const tx = dragging ? input.drag.x - cell / 2 : x;
            const ty = dragging ? input.drag.y - cell * 0.6 : y;
            return (
              <div key={pc.id} style={{ position: 'absolute', left: 0, top: 0, width: cell, height: cell, transform: `translate(${tx}px, ${ty}px)${dragging ? ' scale(1.12)' : ''}`, transition: dragging || still ? 'none' : 'transform 240ms cubic-bezier(.2,.8,.2,1), opacity 300ms ease', opacity: pc.gone ? 0 : pendingTaken.includes(pc.sq) ? 0.35 : 1, zIndex: dragging ? 5 : 2, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', willChange: 'transform' }}>
                <Disc p={pc.p} size={cell * 0.84} kit={kit} />
              </div>
            );
          })}
          {nextSquares.map((t) => { const [x, y] = sqXY(t, flip, cell); return <div key={`n${t}`} style={{ position: 'absolute', left: x, top: y, width: cell, height: cell, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3, pointerEvents: 'none' }}><div style={{ width: cell * 0.3, height: cell * 0.3, borderRadius: '50%', background: 'rgba(255,248,220,0.55)', boxShadow: '0 0 0 2px rgba(40,26,10,0.25)' }} /></div>; })}
          <div ref={input.ref} {...input.handlers} role="grid" aria-label="Checkers board" style={{ position: 'absolute', inset: 0, zIndex: 4, touchAction: 'none', cursor: myTurn ? 'pointer' : 'default' }} />
        </BoardFrame>
      )}
    </div>
  );
}

function golfSaved(id, n) {
  const k = `${id}:${n}`;
  if (g1Mem.golf.has(k)) return g1Mem.golf.get(k);
  try { const v = JSON.parse(localStorage.getItem(`zchat-g2-golf-${k}`) || 'null'); if (v && Array.isArray(v)) return v; } catch {}
  return [];
}
function golfSave(id, n, shots) {
  const k = `${id}:${n}`;
  g1Mem.golf.set(k, shots);
  try { if (shots.length) localStorage.setItem(`zchat-g2-golf-${k}`, JSON.stringify(shots)); else localStorage.removeItem(`zchat-g2-golf-${k}`); } catch {}
}

function GolfView({ st, myId, onMove, onMeta, peerName, onBusy, onFlash }) {
  const Z = { golf: GOLF };
  const hostRef = useRef(null);
  const ctl = useRef(null);
  const busy = useRef(false);
  const stRef = useRef(st);
  stRef.current = st;
  const shown = useRef(null);
  const [shots, setShots] = useState(() => golfSaved(st.id, st.n));
  const shotsRef = useRef(shots);
  shotsRef.current = shots;
  const [watch, setWatch] = useState(null);
  const [, setTick] = useState(0);
  const myMark = st.x === myId ? 'x' : 'o';
  const setBusy = (v) => { busy.current = v; if (onBusy) onBusy(v); };
  const canPutt = () => { const s = stRef.current; return !s.w && s.t === myId && !busy.current && shown.current === s.n; };
  const putt = (shot) => {
    const c = ctl.current;
    const s = stRef.current;
    if (!c || !Z || !canPutt()) return false;
    const from = Z.golf.playHole(s.h - 1, shotsRef.current).end;
    const r = Z.golf.putt(s.h - 1, from, shot);
    setBusy(true);
    haptic(10);
    sfx('putt', { v: (shot[2] || 500) / 1000 });
    c.set({ canPutt: false });
    c.animate([r], () => {
      setBusy(false);
      if (stRef.current.n !== s.n || stRef.current.id !== s.id) { c.set({ canPutt: canPutt() }); setTick((x) => x + 1); return; }
      const ns = shotsRef.current.concat([shot]);
      if (r.holed || ns.length >= Z.golf.MAXS) {
        const next = Z.golf.finishHole(stRef.current, ns, myId);
        golfSave(s.id, s.n, []);
        setShots([]);
        const strokes = r.holed ? ns.length : Z.golf.MAXS + 1;
        const par = Z.golf.HOLES[s.h - 1].par;
        if (onFlash) onFlash(r.holed ? (strokes === 1 ? 'Hole in one' : strokes === par - 2 ? 'Eagle' : strokes === par - 1 ? 'Birdie' : strokes === par ? 'Par' : strokes === par + 1 ? 'Bogey' : `In ${strokes}`) : 'Picked up, that counts 7');
        if (r.holed && strokes <= 2) sfx('win');
        onMove(next);
      } else {
        golfSave(s.id, s.n, ns);
        setShots(ns);
        if (r.water && onFlash) onFlash('In the water, play again from the same spot');
        c.set({ canPutt: canPutt() });
      }
      setTick((x) => x + 1);
    });
    return true;
  };
  useEffect(() => {
    if (!Z || !hostRef.current) return undefined;
    const saved = shotsRef.current;
    const ball = saved.length ? Z.golf.playHole(st.h - 1, saved).end : null;
    shown.current = st.n;
    const c = Z.golf.mount(hostRef.current, { hole: Math.max(0, Math.min(8, st.h - 1)), dark: true, canPutt: canPutt(), ball, onPutt: putt, onHit: (s, bump) => { if (s > 0.08) sfx(bump ? 'bumper' : 'cushion', { v: s }); }, onHoled: () => { sfx('cup'); haptic(14); }, onWater: () => { sfx('splash'); haptic(10); } });
    if (ball) c.set({ ball });
    ctl.current = c;
    if (testing()) window.__zgrGolf = { putt: (shot) => putt(shot), find: (k) => Z.golf.findPutt(stRef.current.h - 1, Z.golf.playHole(stRef.current.h - 1, shotsRef.current).end, k || 0), busy: () => busy.current || c.busy(), state: () => stRef.current };
    return () => { c.destroy(); ctl.current = null; if (window.__zgrGolf) delete window.__zgrGolf; };
  }, []);
  const rest = (s) => { const sv = golfSaved(s.id, s.n); return sv.length ? Z.golf.playHole(s.h - 1, sv).end : Z.golf.HOLES[s.h - 1].tee.slice(); };
  useEffect(() => {
    const c = ctl.current;
    if (!c || shown.current === st.n) return;
    shown.current = st.n;
    setShots(golfSaved(st.id, st.n));
    if (st.lb && st.lb !== myId && st.ls && st.lh) {
      const parts = Z.golf.playHole(st.lh - 1, st.ls).parts;
      setBusy(true);
      setWatch({ h: st.lh });
      c.set({ hole: st.lh - 1, canPutt: false });
      c.animate(parts, () => { setBusy(false); setWatch(null); const hs = stRef.current; c.set({ hole: Math.min(8, hs.h - 1), canPutt: canPutt(), ...(!hs.w && hs.t === myId ? { ball: rest(hs) } : {}) }); if (!hs.w && hs.t === myId) sfx('turn'); setTick((x) => x + 1); });
    } else if (!busy.current) {
      c.set({ hole: Math.min(8, st.h - 1), canPutt: canPutt(), ...(!st.w && st.t === myId ? { ball: rest(st) } : {}) });
    }
    setTick((x) => x + 1);
  }, [st.n]);
  const sum = (a) => (a || []).reduce((p, v) => p + v, 0);
  const mine = myMark === 'x' ? st.sx : st.so;
  const theirs = myMark === 'x' ? st.so : st.sx;
  const hole = watch ? watch.h : st.h;
  const H = Z ? Z.golf.HOLES[Math.max(0, Math.min(8, hole - 1))] : null;
  const status = st.w ? '' : watch ? `Watching ${peerName} on hole ${watch.h}` : st.t === myId ? (shots.length ? `Putt ${shots.length + 1}, drag back from the ball` : `Hole ${st.h}, drag back from the ball`) : `${peerName} is on hole ${st.h}`;
  useEffect(() => { onMeta({ status, hot: !st.w && st.t === myId && !watch, me: `${sum(mine)} strokes`, peer: `${sum(theirs)} strokes`, center: st.w ? 'Final' : `${Math.min(9, st.h)}/9`, sub: H ? `Hole ${hole}, ${H.n}, par ${H.par}` : null }); }, [status, st.n, hole, !!H]);
  return <div ref={hostRef} style={{ width: '100%', height: '100%', position: 'relative' }} />;
}

function ClassicView({ st, myId, onMove, peerName, onMeta }) {
  const Card = gameBoardCard(st.g);
  const outer = useContext(ThemeContext);
  const value = useMemo(() => ({ ...outer, theme: { ...outer.theme, ...THEMES.dark, coral: outer.theme.coral, accentSoft: outer.theme.accentSoft }, dark: true }), [outer]);
  const [stat, setStat] = useState({ s: '', hot: false });
  const bare = useMemo(() => ({ onStatus: (s, hot) => setStat((p) => (p.s === s && p.hot === !!hot ? p : { s, hot: !!hot })) }), []);
  const boxRef = useRef(null);
  const innerRef = useRef(null);
  const box = useBox(boxRef);
  const [nat, setNat] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return undefined;
    const read = () => setNat((n) => (n.w === el.offsetWidth && n.h === el.offsetHeight ? n : { w: el.offsetWidth, h: el.offsetHeight }));
    read();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(read) : null;
    if (ro) ro.observe(el);
    return () => { if (ro) ro.disconnect(); };
  }, []);
  const zoom = nat.w && box.w ? Math.max(0.8, Math.min(1.5, (box.w - 36) / nat.w, (box.h - 30) / nat.h)) : 1;
  useEffect(() => { onMeta({ status: st.w ? '' : stat.s, hot: stat.hot, me: null, peer: null, center: null }); }, [stat.s, stat.hot, !!st.w]);
  if (!Card) return null;
  return (
    <div ref={boxRef} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: nat.w ? nat.w * zoom : 'auto', height: nat.h ? nat.h * zoom : 'auto', opacity: nat.w ? 1 : 0 }}>
        <div ref={innerRef} style={{ position: nat.w ? 'absolute' : 'relative', left: 0, top: 0, transform: `scale(${zoom})`, transformOrigin: '0 0', padding: 12, borderRadius: 26, background: 'rgba(14,12,22,0.66)', boxShadow: '0 18px 40px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.1)' }}>
          <ThemeContext.Provider value={value}>
            <GameBareCtx.Provider value={bare}>
              <Card state={st} myId={myId} live fresh={false} peerName={peerName} onMove={onMove} onRematch={null} />
            </GameBareCtx.Provider>
          </ThemeContext.Provider>
        </div>
      </div>
    </div>
  );
}

const WHY = {
  mate: 'Checkmate', resign: 'Resigned', stale: 'Stalemate', rep: 'Repeated position', fifty: 'Fifty move rule', mat: 'Not enough pieces to win', agree: 'Draw agreed', kings: 'Only kings moving',
};

function roomOutcome(st, myId) {
  if (st.g === 'zap') return st.w ? (st.w === myId ? 'win' : 'lose') : 'none';
  const mark = st.x === myId ? 'x' : 'o';
  return st.w === 'd' ? 'draw' : st.w === mark ? 'win' : 'lose';
}

function ResultCard({ st, myId, peerName, g, xp, still, onRematch, onClose, canRematch, player, whyText, extra }) {
  const out = roomOutcome(st, myId);
  const title = !player ? (out === 'draw' ? 'Draw' : 'Game over') : out === 'win' ? 'You won' : out === 'draw' ? 'Draw' : out === 'none' ? 'Game ended' : `${peerName} won`;
  const why = whyText || (st.why && WHY[st.why] ? (st.why === 'resign' ? (out === 'win' ? `${peerName} resigned` : 'You resigned') : WHY[st.why]) : null);
  const span = xp && xp.xp != null ? xpSpan(xp.xp) : null;
  const up = xp && xp.level && xp.prev_level && xp.level > xp.prev_level;
  const [fill, setFill] = useState(0);
  useEffect(() => { if (span) { const t = setTimeout(() => setFill(span.pct), still ? 0 : 280); return () => clearTimeout(t); } return undefined; }, [span && span.pct]);
  return (
    <div className="zgr-up" onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', left: 14, right: 14, bottom: 'calc(84px + env(safe-area-inset-bottom))', zIndex: 18, borderRadius: 26, padding: '18px 18px 16px', background: 'rgba(16,13,24,0.94)', boxShadow: '0 22px 50px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.1)', textAlign: 'center' }}>
      {out === 'win' && player && (
        <svg width="46" height="46" viewBox="0 0 24 24" aria-hidden="true" style={{ display: 'block', margin: '-40px auto 4px', filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.5))' }}>
          <path d="M3 8.5 7.5 12 12 5l4.5 7L21 8.5 19.2 18H4.8z" fill="#F5C443" stroke="#8A5A10" strokeWidth="0.8" strokeLinejoin="round" /><rect x="4.8" y="18.6" width="14.4" height="2.4" rx="1.2" fill="#F5C443" />
        </svg>
      )}
      <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.02em', color: '#FFFFFF' }}>{title}</div>
      {why && <div style={{ marginTop: 2, fontSize: 13.5, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{why}</div>}
      {extra}
      {span && (
        <div style={{ marginTop: 14, textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 800, color: 'rgba(255,255,255,0.8)' }}>
            <span>{up ? `Level ${span.level} reached` : `Level ${span.level}`}</span>
            <span style={{ color: '#F5C443' }}>{xp.gained ? `+${xp.gained} XP` : `${xp.xp} XP`}</span>
          </div>
          <div style={{ marginTop: 6, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
            <div style={{ width: `${Math.round(fill * 100)}%`, height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, #F2A93B, #FFD36B)', transition: still ? 'none' : 'width 900ms cubic-bezier(.2,.8,.2,1)' }} />
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <RoomButton label="Back to chat" onClick={onClose} style={{ flex: 1 }} />
        {canRematch && <RoomButton label="Rematch" kind="go" onClick={onRematch} style={{ flex: 1.2 }} />}
      </div>
    </div>
  );
}

const PACK_GAMES = ['chess', 'ckr'];
const LAZY_BOARDS = ['pool', 'crm', 'zap'];
const RESIGN_GAMES = ['chess', 'ckr', 'pool', 'golf', 'crm'];
function usePack(need) {
  const [, setT] = useState(0);
  useEffect(() => {
    if (!need) return undefined;
    const f = () => setT((x) => x + 1);
    g1Mem.subs.add(f);
    if (!g1Mem.pack) g1Load();
    return () => { g1Mem.subs.delete(f); };
  }, [need]);
  return need ? g1Mem.pack : null;
}

export function GameRoomPage({ st, prevOf, myId, me, peer, intent, onClose }) {
  const g = st.g;
  const zap = g === 'zap';
  const Z = usePack(PACK_GAMES.includes(g));
  const still = reducedMotion();
  const seats = zap && Array.isArray(st.p) ? st.p : [];
  const other = zap ? (seats.find((u) => u !== myId) || (peer && peer.id !== myId ? peer.id : null)) : (st.x === myId ? st.o : st.x);
  const player = zap ? (seats.includes(myId) || st.st === 'lobby') : (st.x === myId || st.o === myId);
  const fin = zap ? st.st === 'done' : !!st.w;
  const isBot = !!(peer && peer.is_bot);
  const peerFull = (peer && peer.id === other ? peer.name : null) || ga1Name(other, 'Friend');
  const peerName = firstName(peerFull);
  const relay = useGameRelay({ id: st.id, myId, peerId: other, enabled: player && !isBot, g });
  const latest = useRef(st);
  latest.current = st;
  const [meta, setMeta] = useState({ status: '', hot: false, me: null, peer: null, center: null });
  const [peerSel, setPeerSel] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [ask, setAsk] = useState(null);
  const [xp, setXp] = useState(null);
  const [showEnd, setShowEnd] = useState(fin);
  const myLevels = useMyLevels();
  const levelMap = useLevels(LEVEL_GAMES.includes(g) ? g : null, player && !isBot && other ? [other] : []);
  useBackClose(true, onClose);
  useEffect(() => { noteRecent(g); }, [g]);
  const flash = (text) => {
    const id = `${Date.now()}${Math.random()}`;
    setToast({ id, text });
    setTimeout(() => setToast((t) => (t && t.id === id ? null : t)), 2600);
  };
  useEffect(() => {
    const offMv = relay.on('mv', (d) => {
      const s = d && d.st;
      const cur = latest.current;
      if (!s || s.id !== cur.id || s.g !== cur.g || (s.n || 0) <= (cur.n || 0)) return;
      const p = g1Mem.pending.get(s.id);
      if (p && p !== true && (p.n || 0) >= (s.n || 0)) return;
      g1Mem.pending.set(s.id, s);
      g1Mem.relayed = g1Mem.relayed || new Map();
      g1Mem.relayed.set(s.id, { n: s.n, at: Date.now() });
      setPeerSel(null);
      pingG1();
      setTimeout(() => {
        const q = g1Mem.pending.get(s.id);
        if (q === s) { g1Mem.pending.delete(s.id); pingG1(); }
      }, 25000);
    });
    const offNv = relay.on('nv', (d) => {
      const q = d && g1Mem.pending.get(d.id);
      if (q && q !== true && q.n === d.n && q.lb !== myId) { g1Mem.pending.delete(d.id); pingG1(); }
    });
    const offSel = relay.on('sel', (d) => { if (d && d.id === latest.current.id) setPeerSel(typeof d.sq === 'number' ? d.sq : null); });
    return () => { offMv(); offNv(); offSel(); };
  }, []);
  const lastJoin = useRef(null);
  useEffect(() => {
    if (relay.here == null) return;
    if (lastJoin.current === null) { lastJoin.current = relay.here; return; }
    if (relay.here !== lastJoin.current) { lastJoin.current = relay.here; sfx(relay.here ? 'join' : 'leave'); }
  }, [relay.here]);
  useEffect(() => {
    if (!player || isBot) return undefined;
    const tick = () => { if (document.visibilityState !== 'hidden' && chatGameLink.activity) { try { chatGameLink.activity(`game:${g}`); } catch {} } };
    tick();
    const iv = setInterval(tick, 2500);
    return () => clearInterval(iv);
  }, [g, player, isBot]);
  const wasDone = useRef(fin);
  useEffect(() => {
    if (!fin) { wasDone.current = false; setShowEnd(false); setXp(null); return undefined; }
    const fresh = !wasDone.current;
    wasDone.current = true;
    const out = roomOutcome(st, myId);
    const delay = fresh ? (g === 'pool' || g === 'golf' || g === 'crm' ? 1900 : zap ? 1200 : 900) : 0;
    const t = setTimeout(() => {
      setShowEnd(true);
      if (fresh && player) {
        sfx(out === 'win' ? 'win' : out === 'lose' ? 'lose' : 'turn');
        haptic(out === 'win' ? 30 : 12);
      }
    }, delay);
    if (player && st.w && LEVEL_GAMES.includes(g)) {
      recordFinish(st, other).then((r) => {
        if (!r || !r.ok) return;
        setXp(r);
        if (r.gained) setTimeout(() => { sfx(r.level > r.prev_level ? 'levelup' : 'xp'); flash(r.level > r.prev_level ? `Level ${r.level}` : `+${r.gained} XP`); }, delay + 500);
      });
    }
    return () => clearTimeout(t);
  }, [st.id, fin]);
  const move = (next) => {
    if (!next || !player) return false;
    const cur = latest.current;
    if ((next.n || 0) <= (cur.n || 0)) return false;
    relay.send('mv', { st: next });
    Promise.resolve(g1Send(next, { quiet: relay.here === true })).then((ok) => { if (!ok) { relay.send('nv', { id: next.id, n: next.n }); sfx('error'); } });
    return true;
  };
  const selSent = useRef(0);
  const sendSel = (sq) => {
    const now = Date.now();
    if (now - selSent.current < 120 && sq != null) return;
    selSent.current = now;
    relay.send('sel', { id: st.id, sq });
  };
  const send = (patch) => move({ ...latest.current, n: (latest.current.n || 0) + 1, ...patch });
  const mark = st.x === myId ? 'x' : 'o';
  const theirMark = mark === 'x' ? 'o' : 'x';
  const resign = () => {
    setAsk(null);
    if (g === 'chess' || g === 'ckr') send({ w: theirMark, why: 'resign', a: 'resign', dr: null });
    else if (g === 'pool' || g === 'crm') send({ w: theirMark, why: 'resign', ls: null, ev: null, lb: myId });
    else if (g === 'golf') send({ w: theirMark, why: 'resign', ls: null, lb: myId });
  };
  const canResign = player && !fin && RESIGN_GAMES.includes(g);
  const drawOffer = (g === 'chess' || g === 'ckr') && !st.w && st.dr && st.dr !== myId && player;
  const canOffer = (g === 'chess' || g === 'ckr') && player && !st.w && !st.dr && st.a === 'mv' && st.t !== myId;
  const menu = [
    ...((g === 'chess' || g === 'ckr') && player && !st.w ? [{ label: st.dr === myId ? 'Draw offered' : 'Offer a draw', onClick: () => { if (st.dr === myId) return; if (canOffer) { send({ dr: myId, a: 'offer' }); flash('Draw offered'); } else appSnack('You can offer a draw right after your move'); } }] : []),
    ...(canResign ? [{ label: g === 'chess' || g === 'ckr' ? 'Resign' : 'Give up', danger: true, onClick: () => setAsk('resign') }] : []),
    ...(meta.menu || []),
  ];
  const rematch = () => {
    sfx('tap');
    if (g1Mem.host && g1Mem.host.rematch) g1Mem.host.rematch(st);
  };
  const levelOfMe = myLevels && myLevels[g] ? myLevels[g].level : (LEVEL_GAMES.includes(g) && myLevels ? 1 : null);
  const peerLevel = levelMap && levelMap.get(other) ? levelMap.get(other) : (LEVEL_GAMES.includes(g) && levelMap && !isBot ? 1 : null);
  const players = [
    { id: myId, name: 'You', avatar: <Avatar emoji={me && me.avatar} name={(me && me.name) || 'You'} size={50} />, level: levelOfMe, turn: !fin && st.t === myId && !busy, line: meta.me },
    { id: other, name: peerName, avatar: <Avatar emoji={peer && peer.id === other ? peer.avatar : null} name={peerFull} size={50} />, level: peerLevel, turn: !fin && !!other && st.t === other && !busy, here: isBot ? null : relay.here, line: meta.peer },
  ];
  const botSocial = useBotSocial(player && isBot, myId, other, g);
  const social = useMemo(() => (player && !isBot ? { me: myId, send: relay.send, on: relay.on, stickers: roomStickers(), phrases: PHRASES[g] || PHRASES[g === 'ckr' ? 'chess' : ''] } : botSocial), [relay.send, relay.on, player, isBot, g, botSocial]);
  const away = player && !isBot && relay.here === false && !fin;
  const status = fin ? null : away && !meta.hot ? `Waiting for ${peerName}` : (meta.status || null);
  const ready = PACK_GAMES.includes(g) ? !!Z : LAZY_BOARDS.includes(g) ? !!meta.ready : true;
  const title = zap && st.md === 'mayhem' ? 'Zap Mayhem' : (GAME_TITLES[g] || 'Game');
  const crmWhy = g === 'crm' && st.w && st.why !== 'resign' ? `${st.pts || 0} points` : null;
  const board = g === 'chess' ? <ChessView Z={Z} st={st} myId={myId} onMove={move} onMeta={setMeta} peerSel={peerSel} onSel={sendSel} peerName={peerName} still={still} />
    : g === 'ckr' ? <CheckersView Z={Z} st={st} myId={myId} onMove={move} onMeta={setMeta} peerSel={peerSel} onSel={sendSel} peerName={peerName} still={still} />
      : g === 'pool' ? <PoolTable st={st} prevOf={prevOf} myId={myId} peerName={peerName} relay={relay} onMove={move} onMeta={setMeta} onBusy={setBusy} onFlash={flash} />
        : g === 'crm' ? <CarromTable st={st} prevOf={prevOf} myId={myId} peerName={peerName} relay={relay} onMove={move} onMeta={setMeta} onBusy={setBusy} onFlash={flash} />
          : zap ? <ZapTable st={st} myId={myId} peerName={peerName} relay={relay} intent={intent} onMeta={setMeta} />
            : g === 'golf' ? <GolfView st={st} myId={myId} onMove={move} onMeta={setMeta} peerName={peerName} onBusy={setBusy} onFlash={flash} />
              : <ClassicView st={st} myId={myId} onMove={move} peerName={peerName} onMeta={setMeta} />;
  return (
    <GameRoom k={g} title={title} sub={meta.sub || (isBot ? 'With ZChat Bot' : relay.here ? `${peerName} is here` : `With ${peerName}`)} players={players} center={meta.center} status={status} statusHot={meta.hot}
      menu={menu} rules={zap && st.md === 'mayhem' ? (GAME_RULES.zapMayhem || GAME_RULES[g]) : GAME_RULES[g]} social={social} toast={toast} still={still} ready={ready} bottom={meta.bottom || null}
      splash={{ title, sub: `You vs ${peerName}`, art: <GameArt k={g} width={236} height={148} radius={30} />, players: [players[0], players[1]] }}
      onClose={onClose}
      top={drawOffer ? (
        <div className="zgr-pop" style={{ margin: '10px 14px 0', padding: '10px 12px', borderRadius: 18, background: 'rgba(16,13,24,0.88)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 800 }}>{`${peerName} offers a draw`}</span>
          <RoomButton small label="Decline" onClick={() => send({ dr: null, a: 'decline' })} />
          <RoomButton small kind="go" label="Accept" onClick={() => send({ w: 'd', why: 'agree', a: 'accept', dr: null })} />
        </div>
      ) : null}
      overlay={(
        <>
          {showEnd && fin && <ResultCard st={st} myId={myId} peerName={peerName} g={g} xp={xp} still={still} onClose={onClose} onRematch={rematch} canRematch={player} player={player} whyText={zap ? meta.why : crmWhy} extra={zap ? meta.result : null} />}
          {ask === 'resign' && (
            <RoomSheet title={g === 'chess' || g === 'ckr' ? 'Resign this game?' : 'Give up this game?'} text={`${peerName} wins this one.`} onClose={() => setAsk(null)}>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <RoomButton label="Keep playing" onClick={() => setAsk(null)} style={{ flex: 1 }} />
                <RoomButton label={g === 'chess' || g === 'ckr' ? 'Resign' : 'Give up'} kind="danger" onClick={resign} style={{ flex: 1 }} />
              </div>
            </RoomSheet>
          )}
        </>
      )}>
      {board}
    </GameRoom>
  );
}

export function DuelRoomPage({ st, title, me, peer, myId, rules, onClose, children }) {
  const outer = useContext(ThemeContext);
  const value = useMemo(() => ({ ...outer, theme: { ...outer.theme, ...THEMES.dark, coral: outer.theme.coral, accentSoft: outer.theme.accentSoft }, dark: true }), [outer]);
  const still = reducedMotion();
  const k = st.g === 'sd' ? st.k : st.g;
  const peerName = firstName(peer && peer.name);
  const mineDone = (st.x === myId ? st.rx : st.ro) != null;
  const theirsDone = (st.x === myId ? st.ro : st.rx) != null;
  useEffect(() => { noteRecent(st.g === 'sd' ? `sd:${st.k}` : st.g); }, [st.id]);
  const players = [
    { id: myId, name: 'You', avatar: <Avatar emoji={me && me.avatar} name={(me && me.name) || 'You'} size={50} />, line: mineDone ? 'Played' : 'Your turn', turn: !mineDone },
    { id: peer && peer.id, name: peerName, avatar: <Avatar emoji={peer && peer.avatar} name={(peer && peer.name) || 'Friend'} size={50} />, line: theirsDone ? 'Played' : 'Not played yet' },
  ];
  return (
    <GameRoom k={k} sceneKey={st.g === 'sd' ? 'arena' : undefined} title={title} sub={`Your round against ${peerName}`} players={players} rules={rules} still={still} onClose={onClose}
      splash={{ title, sub: `You vs ${peerName}`, art: <GameArt k={st.g === 'sd' ? `sd:${st.k}` : st.g} width={236} height={148} radius={0} />, players }}>
      <ThemeContext.Provider value={value}>
        <div style={{ width: '100%', height: '100%', maxWidth: 480, overflowY: 'auto', padding: '6px 14px 10px', boxSizing: 'border-box' }}>
          <div style={{ borderRadius: 24, background: 'rgba(12,10,22,0.62)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)', padding: '12px 10px', minHeight: '100%', boxSizing: 'border-box' }}>{children}</div>
        </div>
      </ThemeContext.Provider>
    </GameRoom>
  );
}
