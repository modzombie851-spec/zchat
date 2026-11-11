import { useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient.js';

const KEY = 'zchat-game-watchable';
export const watchAllowed = () => { try { return localStorage.getItem(KEY) !== '0'; } catch { return true; } };
export const setWatchAllowed = (v) => { try { localStorage.setItem(KEY, v ? '1' : '0'); } catch {} };

async function call(fn, args) {
  try {
    if (typeof window !== 'undefined' && window.__zfake) (window.__zlive = window.__zlive || []).push([fn, args || {}]);
    const r = await supabase.rpc(fn, args || {});
    return r && !r.error ? r.data : null;
  } catch { return null; }
}

export function useLiveBeacon({ game, room, info, active, allow }) {
  const infoRef = useRef(info);
  infoRef.current = info;
  const on = !!active && !!room;
  const key = JSON.stringify(info || {});
  const sent = useRef('');
  useEffect(() => {
    if (!on) return undefined;
    const push = () => { sent.current = JSON.stringify(infoRef.current || {}); call('zchat_live_set', { p_game: game, p_room: room, p_watch: !!allow, p_info: infoRef.current || {} }); };
    push();
    const iv = setInterval(push, 60000);
    return () => { clearInterval(iv); call('zchat_live_clear'); };
  }, [on, room, allow]);
  useEffect(() => {
    if (!on || key === sent.current) return undefined;
    const t = setTimeout(() => { sent.current = JSON.stringify(infoRef.current || {}); call('zchat_live_set', { p_game: game, p_room: room, p_watch: !!allow, p_info: infoRef.current || {} }); }, 2000);
    return () => clearTimeout(t);
  }, [key, on]);
}

export async function loadLiveFriends() {
  const d = await call('zchat_live_friends');
  return Array.isArray(d) ? d : [];
}
