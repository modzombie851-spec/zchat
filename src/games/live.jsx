import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient.js';
import { rtReady } from '../App.jsx';

export function useLiveLink(topic, myId, onEvent) {
  const chRef = useRef(null);
  const cbRef = useRef(onEvent);
  cbRef.current = onEvent;
  const [here, setHere] = useState(false);
  useEffect(() => {
    if (!topic || !myId) return undefined;
    let alive = true;
    const hold = { ch: null };
    rtReady(topic).then(() => {
      if (!alive) return;
      let ch;
      try { ch = supabase.channel(topic, { config: { broadcast: { self: false }, presence: { key: myId } } }); } catch { return; }
      hold.ch = ch;
      ch.on('presence', { event: 'sync' }, () => {
        let h = false;
        try { h = Object.keys(ch.presenceState() || {}).some((k) => k !== myId); } catch {}
        setHere(h);
      });
      ch.on('broadcast', { event: 'g' }, (msg) => { const p = msg && msg.payload; if (p && p.by !== myId && cbRef.current) cbRef.current(p); });
      ch.subscribe((status) => {
        if (status !== 'SUBSCRIBED' || !alive) return;
        chRef.current = ch;
        try { const r = ch.track({ at: Date.now() }); if (r && r.catch) r.catch(() => {}); } catch {}
      });
    }, () => {});
    return () => {
      alive = false;
      chRef.current = null;
      const ch = hold.ch;
      if (ch) { try { ch.untrack(); } catch {} try { supabase.removeChannel(ch); } catch {} }
    };
  }, [topic, myId]);
  const send = (payload) => {
    const ch = chRef.current;
    if (!ch) return;
    try { const r = ch.send({ type: 'broadcast', event: 'g', payload: { ...payload, by: myId } }); if (r && r.catch) r.catch(() => {}); } catch {}
  };
  return { send, here };
}

export function useShotLink(topic, myId, relay, onEvent) {
  const cbRef = useRef(onEvent);
  cbRef.current = onEvent;
  const own = useLiveLink(relay ? null : topic, myId, (p) => { if (cbRef.current) cbRef.current(p); });
  const on = relay && relay.on;
  useEffect(() => {
    if (!on) return undefined;
    return on('gb', (d) => { if (d && d.by && d.by !== myId && cbRef.current) cbRef.current(d); });
  }, [on, myId]);
  if (!relay) return own;
  return { send: (p) => relay.send('gb', { ...p, by: myId }), here: !!relay.here };
}

export function throttle(fn, ms) {
  let last = 0;
  let timer = 0;
  let pending = null;
  const run = () => { timer = 0; last = Date.now(); const a = pending; pending = null; fn(a); };
  return (arg) => {
    pending = arg;
    const wait = ms - (Date.now() - last);
    if (wait <= 0) { if (timer) { clearTimeout(timer); timer = 0; } run(); } else if (!timer) timer = setTimeout(run, wait);
  };
}
