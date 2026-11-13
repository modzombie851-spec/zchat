import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../supabaseClient.js';

const RAW = (() => { try { return String(import.meta.env.VITE_ZGAME_URL || '').trim().replace(/\/+$/, ''); } catch { return ''; } })();
export const ZG_HTTP = RAW ? RAW.replace(/^ws/, 'http') : '';
export const ZG_WS = RAW ? RAW.replace(/^http/, 'ws') : '';
export const cloudOn = () => !!ZG_HTTP && typeof WebSocket !== 'undefined';
export const REGION_NAMES = { asia: 'Asia', usa: 'USA', eu: 'Europe' };
export const REGION_KEYS = ['asia', 'usa', 'eu'];

async function token() {
  try { const { data } = await supabase.auth.getSession(); return (data && data.session && data.session.access_token) || ''; } catch { return ''; }
}

let pingCache = null;
export async function pingRegions(force) {
  if (!cloudOn()) return null;
  if (!force && pingCache && Date.now() - pingCache.at < 5 * 60 * 1000) return pingCache.v;
  const one = async (reg) => {
    let best = 9999;
    for (let i = 0; i < 3; i++) {
      const url = `${ZG_HTTP}/ping?reg=${reg}&n=${i}&t=${Date.now()}`;
      const t0 = performance.now();
      try {
        const r = await fetch(url, { cache: 'no-store' });
        if (r.ok) {
          await r.text();
          let ms = performance.now() - t0;
          try { const e = performance.getEntriesByName(url).pop(); if (e && e.requestStart > 0 && e.responseStart > e.requestStart) ms = e.responseStart - e.requestStart; } catch {}
          best = Math.min(best, Math.round(ms));
        }
      } catch {}
    }
    return best;
  };
  const vals = await Promise.all(REGION_KEYS.map(one));
  const v = {};
  REGION_KEYS.forEach((k, i) => { v[k] = vals[i]; });
  pingCache = { at: Date.now(), v };
  return v;
}
export function bestRegion(p) {
  if (!p) return 'usa';
  return REGION_KEYS.reduce((a, b) => (p[b] < p[a] ? b : a), 'usa');
}
export async function listRooms() {
  if (!cloudOn()) return null;
  try { const r = await fetch(`${ZG_HTTP}/rooms`, { cache: 'no-store' }); if (!r.ok) return null; const j = await r.json(); if (!j || !j.rooms) return null; const out = { ...j.rooms }; out.open = Array.isArray(j.open) ? j.open : []; return out; } catch { return null; }
}
export async function mineRoom() {
  if (!cloudOn()) return null;
  const tk = await token();
  if (!tk) return null;
  try { const r = await fetch(`${ZG_HTTP}/mine?tk=${encodeURIComponent(tk)}`, { cache: 'no-store' }); if (!r.ok) return null; const j = await r.json(); return j && j.room && j.room.reg && j.room.r ? { reg: j.room.reg, r: String(j.room.r), left: j.left | 0 } : null; } catch { return null; }
}
const LIVE_KEY = 'zchat-zombie-live';
export function saveLive(room) { try { if (room) localStorage.setItem(LIVE_KEY, JSON.stringify({ reg: room.reg, r: String(room.r), at: Date.now() })); else localStorage.removeItem(LIVE_KEY); } catch {} }
export function readLive(maxAge = 32000) { try { const v = JSON.parse(localStorage.getItem(LIVE_KEY) || 'null'); if (v && v.reg && v.r && Date.now() - v.at < maxAge) return v; } catch {} return null; }

export function openCloud({ g, r, reg, meta, onMsg, onState }) {
  let ws = null, dead = false, tries = 0, timer = null, pingT = null;
  const st = { ok: false, rtt: 0 };
  const go = async () => {
    if (dead) return;
    const tk = await token();
    if (dead) return;
    if (!tk) { onState && onState({ ok: false, err: 'auth' }); return; }
    const q = new window.URLSearchParams({ g, r: String(r || ''), reg: reg || 'usa', tk, m: JSON.stringify(meta || {}) });
    try { ws = new WebSocket(`${ZG_WS}/ws?${q.toString()}`); } catch { retry(); return; }
    ws.onopen = () => { tries = 0; st.ok = true; onState && onState({ ok: true }); ping(); };
    ws.onmessage = (e) => {
      let m;
      try { m = JSON.parse(e.data); } catch { return; }
      if (m.t === '$pong') { st.rtt = Math.round(performance.now() - (m.c || 0)); onState && onState({ ok: true, rtt: st.rtt }); return; }
      onMsg(m);
    };
    ws.onclose = (e) => {
      st.ok = false;
      clearTimeout(pingT);
      if (dead) return;
      if (e.code === 4002) { onState && onState({ ok: false, err: 'full' }); return; }
      if (e.code === 4001) { onState && onState({ ok: false, err: 'replaced' }); return; }
      onState && onState({ ok: false, err: 'lost' });
      retry();
    };
    ws.onerror = () => {};
  };
  const retry = () => { if (dead) return; tries++; clearTimeout(timer); timer = setTimeout(go, Math.min(8000, 600 * tries)); };
  const ping = () => { clearTimeout(pingT); if (dead || !ws || ws.readyState !== 1) return; try { ws.send(JSON.stringify({ t: '$ping', c: performance.now() })); } catch {} pingT = setTimeout(ping, 4000); };
  go();
  return {
    send: (obj) => { if (!ws || ws.readyState !== 1) return false; try { ws.send(JSON.stringify(obj)); return true; } catch { return false; } },
    close: () => { dead = true; clearTimeout(timer); clearTimeout(pingT); try { if (ws) ws.close(1000, 'bye'); } catch {} },
    get ok() { return st.ok; },
    get rtt() { return st.rtt; },
  };
}

export function useCloudRoom({ g, id, myId, enabled = true, meta, reg }) {
  const [peers, setPeers] = useState([]);
  const [state, setState] = useState({ ok: false });
  const subs = useRef(new Map());
  const conn = useRef(null);
  const metas = useRef({});
  const metaRef = useRef(meta || {});
  metaRef.current = meta || {};
  const deliver = (payload) => {
    const set = subs.current.get(payload.t);
    if (set) set.forEach((fn) => { try { fn(payload); } catch {} });
    const all = subs.current.get('*');
    if (all) all.forEach((fn) => { try { fn(payload); } catch {} });
  };
  useEffect(() => {
    if (!enabled || !id || !myId || !cloudOn()) { setPeers([]); return undefined; }
    const list = new Set();
    const sync = () => { const next = [...list].filter((p) => p !== myId).sort(); setPeers((prev) => (prev.join('|') === next.join('|') ? prev : next)); };
    const c = openCloud({
      g, r: id, reg, meta: metaRef.current,
      onState: (s) => setState((p) => ({ ...p, ...s })),
      onMsg: (m) => {
        if (m.t === '$hi') { list.clear(); for (const [p, mm] of m.peers || []) { list.add(p); metas.current[p] = mm; deliver({ t: 'hi', from: p, m: mm, at: Date.now() }); } sync(); return; }
        if (m.t === '$join') { list.add(m.id); metas.current[m.id] = m.m; sync(); deliver({ t: 'hi', from: m.id, m: m.m, at: Date.now() }); return; }
        if (m.t === '$meta') { metas.current[m.id] = m.m; deliver({ t: 'hey', from: m.id, m: m.m, at: Date.now() }); return; }
        if (m.t === '$leave') { list.delete(m.id); sync(); deliver({ t: 'bye', from: m.id, at: Date.now() }); return; }
        if (!m.from || m.from === myId || !m.t) return;
        if (!list.has(m.from)) { list.add(m.from); sync(); }
        deliver(m);
      },
    });
    conn.current = c;
    return () => { c.close(); conn.current = null; list.clear(); setPeers([]); };
  }, [enabled, id, myId, g, reg]);
  const metaKey = JSON.stringify(meta || {});
  useEffect(() => { if (conn.current && conn.current.ok) conn.current.send({ t: '$meta', m: metaRef.current }); }, [metaKey]);
  const on = useMemo(() => (t, fn) => {
    let set = subs.current.get(t);
    if (!set) { set = new Set(); subs.current.set(t, set); }
    set.add(fn);
    return () => set.delete(fn);
  }, []);
  const send = (t, data) => (conn.current ? conn.current.send({ ...(data || {}), t }) : false);
  return useMemo(() => ({ peers, send, on, me: myId, here: peers.length > 0, ok: state.ok, rtt: state.rtt, err: state.err, metas: metas.current }), [peers, myId, state.ok, state.rtt, state.err]);
}
