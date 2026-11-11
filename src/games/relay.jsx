import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../supabaseClient.js';
import { rtKeep, rtDrop, rtReady } from '../App.jsx';

const testHooks = new Set();
if (typeof window !== 'undefined' && window.__zfake) {
  window.__zgr = { deliver: (payload) => testHooks.forEach((fn) => { try { fn(payload); } catch {} }) };
}

export function useGameRelay({ id, myId, peerId, enabled = true, g }) {
  const [here, setHere] = useState(null);
  const chRef = useRef(null);
  const okRef = useRef(false);
  const subs = useRef(new Map());
  const hereRef = useRef(false);
  const lastPeer = useRef(0);
  const mark = (v) => { hereRef.current = v; setHere(v); };
  const deliver = (payload) => {
    if (!payload || payload.from === myId || !payload.t) return;
    if (peerId && payload.from !== peerId) return;
    lastPeer.current = Date.now();
    if (payload.t === 'hi' || payload.t === 'back') { if (!hereRef.current) mark(true); if (payload.t === 'hi') send('hey', {}); }
    else if (payload.t === 'hey') { if (!hereRef.current) mark(true); }
    else if (payload.t === 'bye' || payload.t === 'away') mark(false);
    else if (!hereRef.current) mark(true);
    const set = subs.current.get(payload.t);
    if (set) set.forEach((fn) => { try { fn(payload); } catch {} });
  };
  const send = (t, data) => {
    const ch = chRef.current;
    if (!ch || !okRef.current) return false;
    try {
      const r = ch.send({ type: 'broadcast', event: 'g', payload: { ...(data || {}), t, from: myId, at: Date.now() } });
      if (r && r.catch) r.catch(() => {});
    } catch { return false; }
    return true;
  };
  useEffect(() => {
    if (!enabled || !id || !myId) { setHere(null); return undefined; }
    hereRef.current = false;
    setHere(null);
    let alive = true;
    let keep = null;
    const topic = `zgr-${id}`;
    const hook = (p) => deliver(p);
    testHooks.add(hook);
    rtReady(topic).then(() => {
      if (!alive) return;
      keep = rtKeep(() => {
        okRef.current = false;
        const ch = supabase.channel(topic, { config: { broadcast: { self: false, ack: false }, presence: { key: myId } } });
        ch.on('presence', { event: 'sync' }, () => {
          let keys = [];
          try { keys = Object.keys(ch.presenceState() || {}); } catch {}
          const on = keys.some((k) => k !== myId && (!peerId || k === peerId));
          if (on !== hereRef.current && (on || Date.now() - lastPeer.current > 4000)) mark(on);
        });
        ch.on('broadcast', { event: 'g' }, ({ payload }) => deliver(payload));
        chRef.current = ch;
        return ch;
      }, {
        topic,
        onStatus: (status, err, ch) => {
          if (status !== 'SUBSCRIBED' || ch !== chRef.current) return;
          okRef.current = true;
          try { const r = ch.track({ at: Date.now(), g: g || null }); if (r && r.catch) r.catch(() => {}); } catch {}
          send('hi', {});
          setTimeout(() => { if (alive && !hereRef.current && Date.now() - lastPeer.current > 2400) mark(false); }, 2600);
        },
      });
    });
    const vis = () => {
      if (document.visibilityState === 'hidden') send('away', {});
      else send('back', {});
    };
    document.addEventListener('visibilitychange', vis);
    return () => {
      alive = false;
      testHooks.delete(hook);
      document.removeEventListener('visibilitychange', vis);
      send('bye', {});
      const ch = chRef.current;
      if (ch) { try { const r = ch.untrack(); if (r && r.catch) r.catch(() => {}); } catch {} }
      okRef.current = false;
      chRef.current = null;
      if (keep) rtDrop(keep);
    };
  }, [enabled, id, myId]);
  const on = useMemo(() => (t, fn) => {
    let set = subs.current.get(t);
    if (!set) { set = new Set(); subs.current.set(t, set); }
    set.add(fn);
    return () => set.delete(fn);
  }, []);
  return useMemo(() => ({ here, send, on, me: myId }), [here, myId]);
}

export function useRoomRelay({ id, myId, enabled = true, meta, passive = false }) {
  const [peers, setPeers] = useState([]);
  const chRef = useRef(null);
  const okRef = useRef(false);
  const subs = useRef(new Map());
  const seen = useRef(new Map());
  const metaRef = useRef(meta || {});
  metaRef.current = meta || {};
  const pres = useRef([]);
  const refresh = () => {
    const now = Date.now();
    const ids = new Set(pres.current);
    for (const [k, at] of seen.current) if (now - at < 9000) ids.add(k);
    ids.delete(myId);
    const next = [...ids].sort();
    setPeers((prev) => (prev.join('|') === next.join('|') ? prev : next));
  };
  const send = (t, data) => {
    const ch = chRef.current;
    if (passive || !ch || !okRef.current) return false;
    try { const r = ch.send({ type: 'broadcast', event: 'g', payload: { ...(data || {}), t, from: myId, at: Date.now() } }); if (r && r.catch) r.catch(() => {}); } catch { return false; }
    return true;
  };
  const deliver = (payload) => {
    if (!payload || payload.from === myId || !payload.t) return;
    if (payload.t === 'bye') seen.current.delete(payload.from); else seen.current.set(payload.from, Date.now());
    if (payload.t === 'hi' && !passive) send('hey', { m: metaRef.current });
    refresh();
    const set = subs.current.get(payload.t);
    if (set) set.forEach((fn) => { try { fn(payload); } catch {} });
    const all = subs.current.get('*');
    if (all) all.forEach((fn) => { try { fn(payload); } catch {} });
  };
  useEffect(() => {
    if (!enabled || !id || !myId) { setPeers([]); return undefined; }
    let alive = true;
    let keep = null;
    const topic = `zgr-${id}`;
    const hook = (p) => deliver(p);
    testHooks.add(hook);
    const iv = setInterval(refresh, 2000);
    rtReady(topic).then(() => {
      if (!alive) return;
      keep = rtKeep(() => {
        okRef.current = false;
        const ch = supabase.channel(topic, { config: { broadcast: { self: false, ack: false }, presence: { key: passive ? `w-${myId}` : myId } } });
        if (!passive) ch.on('presence', { event: 'sync' }, () => { let keys = []; try { keys = Object.keys(ch.presenceState() || {}); } catch {} pres.current = keys; refresh(); });
        ch.on('broadcast', { event: 'g' }, ({ payload }) => deliver(payload));
        chRef.current = ch;
        return ch;
      }, {
        topic,
        onStatus: (status, err, ch) => {
          if (status !== 'SUBSCRIBED' || ch !== chRef.current) return;
          okRef.current = true;
          if (passive) return;
          try { const r = ch.track({ at: Date.now() }); if (r && r.catch) r.catch(() => {}); } catch {}
          send('hi', { m: metaRef.current });
        },
      });
    });
    return () => {
      alive = false;
      clearInterval(iv);
      testHooks.delete(hook);
      if (!passive) send('bye', {});
      const ch = chRef.current;
      if (ch && !passive) { try { const r = ch.untrack(); if (r && r.catch) r.catch(() => {}); } catch {} }
      okRef.current = false;
      chRef.current = null;
      if (keep) rtDrop(keep);
    };
  }, [enabled, id, myId]);
  const on = useMemo(() => (t, fn) => {
    let set = subs.current.get(t);
    if (!set) { set = new Set(); subs.current.set(t, set); }
    set.add(fn);
    return () => set.delete(fn);
  }, []);
  const sendOut = passive ? () => false : send;
  return useMemo(() => ({ peers, send: sendOut, on, me: myId, here: peers.length > 0 }), [peers, myId]);
}

const watchHooks = new Set();
if (typeof window !== 'undefined' && window.__zfake) window.__zgw = { deliver: (p) => watchHooks.forEach((fn) => { try { fn(p); } catch {} }) };

export function useWatchChannel({ room, myId, enabled = true, role = 'player', meta, allow = true, onDenied }) {
  const [watchers, setWatchers] = useState([]);
  const chRef = useRef(null);
  const okRef = useRef(false);
  const allowRef = useRef(allow);
  allowRef.current = allow;
  const deniedRef = useRef(onDenied);
  deniedRef.current = onDenied;
  const metaRef = useRef(meta || {});
  metaRef.current = meta || {};
  const fake = useRef(new Map());
  const listFrom = (state) => {
    const out = [];
    for (const k of Object.keys(state || {})) { const arr = state[k] || []; const m = arr[0] || {}; if (m.w) out.push({ id: m.id || k, n: m.n || 'Friend', a: m.a || null }); }
    for (const [k, v] of fake.current) if (!out.some((x) => x.id === k)) out.push(v);
    return out;
  };
  const sendNo = () => { const ch = chRef.current; if (!ch || !okRef.current) return; try { const r = ch.send({ type: 'broadcast', event: 'w', payload: { t: 'nowatch', at: Date.now() } }); if (r && r.catch) r.catch(() => {}); } catch {} };
  useEffect(() => {
    if (!enabled || !room || !myId) { setWatchers([]); return undefined; }
    let alive = true;
    let keep = null;
    const topic = `zgw-${room}`;
    const hook = (p) => {
      if (!p) return;
      if (p.t === 'nowatch' && role === 'watcher' && deniedRef.current) deniedRef.current();
      if (p.t === 'watch' && role === 'player') { if (p.on) fake.current.set(p.id, { id: p.id, n: p.n || 'Friend', a: null }); else fake.current.delete(p.id); setWatchers(listFrom({})); }
    };
    watchHooks.add(hook);
    rtReady(topic).then(() => {
      if (!alive) return;
      keep = rtKeep(() => {
        okRef.current = false;
        const ch = supabase.channel(topic, { config: { broadcast: { self: false, ack: false }, presence: { key: `${role}-${myId}` } } });
        ch.on('presence', { event: 'sync' }, () => { let st = {}; try { st = ch.presenceState() || {}; } catch {} if (role === 'player') setWatchers(listFrom(st)); });
        ch.on('broadcast', { event: 'w' }, ({ payload }) => hook(payload));
        chRef.current = ch;
        return ch;
      }, {
        topic,
        onStatus: (status, err, ch) => {
          if (status !== 'SUBSCRIBED' || ch !== chRef.current) return;
          okRef.current = true;
          if (role === 'watcher') { try { const r = ch.track({ w: 1, id: myId, n: metaRef.current.n || 'Friend', a: metaRef.current.a || null }); if (r && r.catch) r.catch(() => {}); } catch {} }
        },
      });
    });
    const iv = setInterval(() => { if (role === 'player' && !allowRef.current) sendNo(); }, 3000);
    return () => {
      alive = false;
      clearInterval(iv);
      watchHooks.delete(hook);
      const ch = chRef.current;
      if (ch) { try { const r = ch.untrack(); if (r && r.catch) r.catch(() => {}); } catch {} }
      okRef.current = false;
      chRef.current = null;
      if (keep) rtDrop(keep);
    };
  }, [enabled, room, myId, role]);
  useEffect(() => { if (role === 'player' && !allow && watchers.length) sendNo(); }, [allow, watchers.length]);
  return watchers;
}
