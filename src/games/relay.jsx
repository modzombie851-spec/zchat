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
