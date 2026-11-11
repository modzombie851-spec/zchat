import { useEffect } from 'react';
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
  useEffect(() => {
    if (!active || !room) return undefined;
    const push = () => call('zchat_live_set', { p_game: game, p_room: room, p_watch: !!allow, p_info: info || {} });
    push();
    const iv = setInterval(push, 60000);
    return () => { clearInterval(iv); call('zchat_live_clear'); };
  }, [active, room, allow]);
}

export async function loadLiveFriends() {
  const d = await call('zchat_live_friends');
  return Array.isArray(d) ? d : [];
}
