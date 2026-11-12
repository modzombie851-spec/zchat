import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient.js';
import { cloudOn } from './zcloud.js';

export const castMe = { id: null, me: null };
const KEY = 'zchat-game-watchable';
const PKEY = 'zchat-game-privacy';
const psubs = new Set();
let priv = null;

async function call(fn, args) {
  try {
    if (typeof window !== 'undefined' && window.__zfake) (window.__zlive = window.__zlive || []).push([fn, args || {}]);
    const r = await supabase.rpc(fn, args || {});
    return r && !r.error ? r.data : null;
  } catch { return null; }
}

function readPriv() {
  if (priv) return priv;
  let v = null;
  try { v = JSON.parse(localStorage.getItem(PKEY) || 'null'); } catch {}
  if (!v || typeof v !== 'object') {
    let w = true;
    try { w = localStorage.getItem(KEY) !== '0'; } catch {}
    v = { show: true, watch: w, join: true };
  }
  priv = { show: v.show !== false, watch: v.watch !== false, join: v.join !== false };
  return priv;
}
function keepPriv(next) {
  priv = next;
  try { localStorage.setItem(PKEY, JSON.stringify(next)); localStorage.setItem(KEY, next.watch ? '1' : '0'); } catch {}
  psubs.forEach((fn) => { try { fn(next); } catch {} });
}
export const gamePrivacy = () => readPriv();
export function setGamePrivacy(patch) {
  const next = { ...readPriv(), ...(patch || {}) };
  keepPriv(next);
  call('zchat_game_privacy_set', { p_show: next.show, p_watch: next.watch, p_join: next.join });
  if (!next.show) call('zchat_live_clear');
  return next;
}
let pulled = 0;
export function pullGamePrivacy(force) {
  if (!force && Date.now() - pulled < 600000) return;
  pulled = Date.now();
  call('zchat_game_privacy_get').then((d) => {
    if (!d || typeof d !== 'object' || d.ok === false) return;
    const next = { show: d.show !== false, watch: d.watch !== false, join: d.join !== false };
    const cur = readPriv();
    if (next.show !== cur.show || next.watch !== cur.watch || next.join !== cur.join) keepPriv(next);
  });
}
export function useGamePrivacy() {
  const [v, setV] = useState(readPriv);
  useEffect(() => { psubs.add(setV); setV(readPriv()); pullGamePrivacy(false); return () => { psubs.delete(setV); }; }, []);
  return v;
}
export const watchAllowed = () => { const p = readPriv(); return p.watch; };
export const setWatchAllowed = (v) => { setGamePrivacy(v ? { watch: true, show: true } : { watch: false }); };

export function useLiveBeacon({ game, room, info, active, allow }) {
  const P = useGamePrivacy();
  const infoRef = useRef(info);
  const full = { ...(info || {}), w: allow !== false && P.watch, j: P.join && !(info && info.j === false) };
  infoRef.current = full;
  const on = !!active && !!room && P.show;
  const key = JSON.stringify(full);
  const sent = useRef('');
  useEffect(() => {
    if (!on) return undefined;
    const push = () => { sent.current = JSON.stringify(infoRef.current || {}); call('zchat_live_set', { p_game: game, p_room: room, p_watch: true, p_info: infoRef.current || {} }); };
    push();
    const iv = setInterval(push, 60000);
    return () => { clearInterval(iv); call('zchat_live_clear'); };
  }, [on, room, game]);
  useEffect(() => {
    if (!on || key === sent.current) return undefined;
    const t = setTimeout(() => { sent.current = JSON.stringify(infoRef.current || {}); call('zchat_live_set', { p_game: game, p_room: room, p_watch: true, p_info: infoRef.current || {} }); }, 1500);
    return () => clearTimeout(t);
  }, [key, on]);
}

export async function loadLiveFriends() {
  const d = await call('zchat_live_friends');
  return Array.isArray(d) ? d : [];
}

export const LIVE_ROOM_MAX = { gulpco: 10, roll: 4, race: 8, siege: cloudOn() ? 20 : 10 };
export function liveKind(r, max = LIVE_ROOM_MAX) {
  const info = (r && r.info) || {};
  const k = r && r.game === 'gulp' && info.co ? 'gulpco' : (r && r.game) || '';
  const n = Math.max(1, Number(info.n) || 1);
  const cap = max[k] || (info.lob ? 2 : 0);
  const canJoin = info.j !== false;
  const watch = info.w !== false;
  if (cap) {
    const full = n >= cap;
    return { k, n, max: cap, join: canJoin && !full, full, watch, ask: !canJoin && !full && !info.lob, act: canJoin && !full ? 'Join' : watch && !info.lob ? 'Watch' : null };
  }
  if (info.so) return { k, n: 1, max: 0, join: canJoin, full: false, watch, act: watch ? 'Watch' : canJoin ? 'Play too' : null, play: canJoin };
  return { k, n, max: 0, join: false, full: false, watch, act: watch ? 'Watch' : null };
}

function boxSend(topic, payload) {
  let ch;
  try { ch = supabase.channel(topic, { config: { broadcast: { self: false, ack: false } } }); } catch { return; }
  let done = false;
  const drop = () => { if (done) return; done = true; try { supabase.removeChannel(ch); } catch {} };
  ch.subscribe((status) => {
    if (status !== 'SUBSCRIBED') return;
    try { const r = ch.send({ type: 'broadcast', event: 'ja', payload }); if (r && r.catch) r.catch(() => {}); } catch {}
    setTimeout(drop, 2500);
  });
  setTimeout(drop, 9000);
}
function useBox(topic, onMsg) {
  const cb = useRef(onMsg);
  cb.current = onMsg;
  useEffect(() => {
    if (!topic) return undefined;
    let ch = null;
    try { ch = supabase.channel(topic, { config: { broadcast: { self: false, ack: false } } }); } catch { return undefined; }
    ch.on('broadcast', { event: 'ja' }, (m) => { const p = m && m.payload; if (p && cb.current) cb.current(p); });
    ch.subscribe(() => {});
    return () => { try { supabase.removeChannel(ch); } catch {} };
  }, [topic]);
}

export function useJoinAsks({ myId, on, game }) {
  const [asks, setAsks] = useState([]);
  useBox(on && myId ? `zja-${myId}` : null, (p) => {
    if (p.t !== 'ask' || typeof p.by !== 'string' || p.by === myId || (game && p.game && p.game !== game)) return;
    const n = String(p.n || 'A friend').split(' ')[0].slice(0, 20);
    setAsks((v) => (v.some((a) => a.by === p.by) ? v : [...v.slice(-2), { by: p.by, n, at: Date.now() }]));
  });
  useEffect(() => {
    if (!asks.length) return undefined;
    const t = setTimeout(() => setAsks((v) => v.filter((a) => Date.now() - a.at < 60000)), 61000);
    return () => clearTimeout(t);
  }, [asks]);
  const answer = (by, ok) => {
    setAsks((v) => v.filter((a) => a.by !== by));
    boxSend(`zja-${by}`, { t: ok ? 'ok' : 'no', by: myId, game });
  };
  return { asks, answer };
}

export function useJoinWait(myId) {
  const [wait, setWait] = useState({});
  const okRef = useRef({});
  useBox(myId && Object.values(wait).some((w) => w === 'wait') ? `zja-${myId}` : null, (p) => {
    if (!p || typeof p.by !== 'string' || (p.t !== 'ok' && p.t !== 'no')) return;
    setWait((v) => (v[p.by] === 'wait' ? { ...v, [p.by]: p.t === 'ok' ? 'ok' : 'no' } : v));
    if (p.t === 'ok' && okRef.current[p.by]) { const f = okRef.current[p.by]; delete okRef.current[p.by]; f(); }
  });
  const ask = (row, me, onOk) => {
    const host = row && row.user_id;
    if (!host || !myId || wait[host] === 'wait') return;
    okRef.current[host] = onOk;
    setWait((v) => ({ ...v, [host]: 'wait' }));
    setTimeout(() => boxSend(`zja-${host}`, { t: 'ask', by: myId, n: (me && me.name) || '', game: row.game, room: row.room }), 600);
    setTimeout(() => setWait((v) => (v[host] === 'wait' ? { ...v, [host]: 'no' } : v)), 60000);
  };
  return { state: (row) => (row && wait[row.user_id]) || 'idle', ask };
}
