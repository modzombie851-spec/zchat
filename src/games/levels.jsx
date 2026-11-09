import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient.js';

export const LEVEL_GAMES = ['pool', 'chess', 'ckr', 'golf', 'crm', 'zap', 'c4', 'ship', 'ttt', 'dots', 'reversi', 'gomoku', 'hang', 'rps', 'wduel', 'tug', 'qrace', 'rrace'];

const L = { missing: false, mine: null, mineAt: 0, job: null, others: new Map(), subs: new Set(), done: new Map() };
const CACHE_KEY = 'zchat-game-levels';

export function levelOf(xp) {
  const v = Math.max(0, Number(xp) || 0);
  return Math.max(1, Math.floor((-40 + Math.sqrt(6400 + 80 * v)) / 40));
}
export function xpAt(level) { const n = Math.max(1, level); return (n - 1) * (20 * n + 60); }
export function xpSpan(xp) {
  const lv = levelOf(xp);
  const from = xpAt(lv);
  const to = xpAt(lv + 1);
  return { level: lv, from, to, pct: Math.max(0, Math.min(1, (xp - from) / Math.max(1, to - from))) };
}

function isMissing(error) {
  if (!error) return false;
  const code = String(error.code || '');
  return code === 'PGRST202' || code === '42883' || code === 'PGRST205' || code === '42P01' || /Could not find the function|does not exist|schema cache/i.test(String(error.message || ''));
}
function ping() { L.subs.forEach((f) => { try { f(); } catch {} }); }
function readCache() {
  try { const v = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); return v && typeof v === 'object' ? v : null; } catch { return null; }
}
function writeCache(map) { try { localStorage.setItem(CACHE_KEY, JSON.stringify(map)); } catch {} }

export function levelsReady() { return !L.missing; }

export function loadMyLevels(force) {
  if (L.missing) return Promise.resolve(null);
  if (!L.mine) L.mine = readCache();
  if (!force && L.mine && Date.now() - L.mineAt < 120000) return Promise.resolve(L.mine);
  if (L.job) return L.job;
  L.job = (async () => {
    try {
      const { data, error } = await supabase.rpc('zchat_game_xp_mine');
      if (error) { if (isMissing(error)) { L.missing = true; ping(); } return L.mine; }
      const map = {};
      (Array.isArray(data) ? data : []).forEach((r) => { if (r && r.game) map[r.game] = { xp: r.xp || 0, level: r.level || levelOf(r.xp), wins: r.wins || 0, plays: r.plays || 0 }; });
      L.mine = map;
      L.mineAt = Date.now();
      writeCache(map);
      ping();
      return map;
    } catch { return L.mine; } finally { L.job = null; }
  })();
  return L.job;
}

export function useMyLevels() {
  const [, setT] = useState(0);
  useEffect(() => {
    const f = () => setT((x) => x + 1);
    L.subs.add(f);
    loadMyLevels(false);
    return () => { L.subs.delete(f); };
  }, []);
  if (L.missing) return null;
  return L.mine || readCache() || {};
}

export async function levelsFor(game, ids) {
  const out = new Map();
  if (L.missing || !game || !ids || !ids.length) return out;
  const need = [];
  ids.forEach((id) => { const k = `${game}:${id}`; if (L.others.has(k)) out.set(id, L.others.get(k)); else need.push(id); });
  if (!need.length) return out;
  try {
    const { data, error } = await supabase.rpc('zchat_game_xp_levels', { p_game: game, p_users: need.slice(0, 100) });
    if (error) { if (isMissing(error)) { L.missing = true; ping(); } return out; }
    need.forEach((id) => L.others.set(`${game}:${id}`, 1));
    (Array.isArray(data) ? data : []).forEach((r) => { if (r && r.user_id) { L.others.set(`${game}:${r.user_id}`, r.level || 1); out.set(r.user_id, r.level || 1); } });
    need.forEach((id) => { if (!out.has(id)) out.set(id, 1); });
  } catch {}
  return out;
}

export function useLevels(game, ids) {
  const key = (ids || []).filter(Boolean).join(',');
  const [map, setMap] = useState(() => new Map());
  useEffect(() => {
    let alive = true;
    if (!game || !key || L.missing) { setMap(new Map()); return undefined; }
    levelsFor(game, key.split(',')).then((m) => { if (alive) setMap(m); });
    return () => { alive = false; };
  }, [game, key]);
  return L.missing ? null : map;
}

export async function recordFinish(st, peerId) {
  if (L.missing || !st || !st.id || !st.w || !peerId || !LEVEL_GAMES.includes(st.g)) return null;
  if (L.done.has(st.id)) return L.done.get(st.id);
  const job = (async () => {
    for (let i = 0; i < 4; i++) {
      try {
        const { data, error } = await supabase.rpc('zchat_game_xp_finish', { p_game_id: st.id, p_peer: peerId });
        if (error) { if (isMissing(error)) { L.missing = true; ping(); return null; } }
        else if (data && data.ok) {
          if (data.game) {
            const mine = L.mine || {};
            mine[data.game] = { ...(mine[data.game] || {}), xp: data.xp || 0, level: data.level || levelOf(data.xp), wins: data.wins != null ? data.wins : (mine[data.game] || {}).wins || 0, plays: data.plays != null ? data.plays : (mine[data.game] || {}).plays || 0 };
            L.mine = mine;
            writeCache(mine);
            L.others.delete(`${data.game}:me`);
            ping();
          }
          return data;
        } else if (data && !['open', 'unknown', 'slow'].includes(data.why)) return data;
      } catch {}
      await new Promise((r) => setTimeout(r, 1400 + i * 1200));
    }
    return null;
  })();
  L.done.set(st.id, job);
  const res = await job;
  if (!res) L.done.delete(st.id);
  return res;
}

const RECENT_KEY = 'zchat-games-recent';
export function readRecent() {
  try { const v = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); return Array.isArray(v) ? v.filter((k) => typeof k === 'string').slice(0, 8) : []; } catch { return []; }
}
export function noteRecent(k) {
  if (!k) return;
  try { const list = readRecent().filter((x) => x !== k); list.unshift(k); localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 8))); } catch {}
}
