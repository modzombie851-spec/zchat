import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient.js';

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

export const LIVE_ROOM_MAX = { gulpco: 10, roll: 4, race: 8, siege: 10 };
export function liveKind(r, max = LIVE_ROOM_MAX) {
  const info = (r && r.info) || {};
  const k = r && r.game === 'gulp' && info.co ? 'gulpco' : (r && r.game) || '';
  const n = Math.max(1, Number(info.n) || 1);
  const cap = max[k] || (info.lob ? 2 : 0);
  const canJoin = info.j !== false;
  const watch = info.w !== false;
  if (cap) {
    const full = n >= cap;
    return { k, n, max: cap, join: canJoin && !full, full, watch, act: canJoin && !full ? 'Join' : watch && !info.lob ? 'Watch' : null };
  }
  if (info.so) return { k, n: 1, max: 0, join: canJoin, full: false, watch, act: watch ? 'Watch' : canJoin ? 'Play too' : null, play: canJoin };
  return { k, n, max: 0, join: false, full: false, watch, act: watch ? 'Watch' : null };
}
