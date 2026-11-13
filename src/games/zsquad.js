import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient.js';
import { rtKeep, rtDrop } from '../App.jsx';

export const SQUAD_MAX = 5;

const clean = (id, p) => ({
  id,
  n: String((p && p.n) || 'Friend').slice(0, 16),
  sv: typeof p.sv === 'string' ? p.sv.slice(0, 12) : 'jay',
  col: p.col | 0,
  w: typeof p.w === 'string' ? p.w.slice(0, 12) : 'pistol',
  lead: !!p.lead,
  rdy: !!p.rdy,
  at: Number(p.at) || 0,
});

export function useSquad({ room, myId, me, lead, on, onGo, onEmo }) {
  const [mates, setMates] = useState([]);
  const [full, setFull] = useState(false);
  const chRef = useRef(null);
  const meRef = useRef(me);
  meRef.current = me;
  const cbRef = useRef(null);
  cbRef.current = { onGo, onEmo };
  const atRef = useRef(0);
  const okRef = useRef(false);
  const topic = on && room && room.r && myId ? `dsq-${room.reg}-${room.r}` : null;
  const card = () => ({ ...meRef.current, lead: !!lead, at: atRef.current });

  useEffect(() => {
    if (!topic) { setMates([]); setFull(false); return undefined; }
    atRef.current = Date.now();
    okRef.current = false;
    let gone = false;
    const read = (ch) => {
      if (gone) return;
      let st = {};
      try { st = ch.presenceState() || {}; } catch { st = {}; }
      const L = [];
      for (const [id, arr] of Object.entries(st)) {
        const p = Array.isArray(arr) ? arr[arr.length - 1] : null;
        if (p && id !== myId) L.push(clean(id, p));
      }
      L.sort((a, b) => (b.lead ? 1 : 0) - (a.lead ? 1 : 0) || a.at - b.at);
      const early = L.filter((q) => q.lead || q.at < atRef.current).length;
      const over = !lead && early >= SQUAD_MAX;
      setFull(over);
      if (over && okRef.current) { okRef.current = false; try { ch.untrack(); } catch {} }
      setMates(over ? [] : L.slice(0, SQUAD_MAX - 1));
    };
    const keep = rtKeep(() => {
      const ch = supabase.channel(topic, { config: { broadcast: { self: false, ack: false }, presence: { key: myId } } });
      chRef.current = ch;
      return ch
        .on('presence', { event: 'sync' }, () => read(ch))
        .on('broadcast', { event: 'go' }, (msg) => { const p = msg && msg.payload; if (p && cbRef.current.onGo) cbRef.current.onGo(p); })
        .on('broadcast', { event: 'emo' }, (msg) => { const p = msg && msg.payload; if (p && cbRef.current.onEmo) cbRef.current.onEmo(p); });
    }, {
      topic,
      onStatus: (st, err, ch) => {
        if (st !== 'SUBSCRIBED' || gone) return;
        okRef.current = true;
        try { const r = ch.track(card()); if (r && r.catch) r.catch(() => {}); } catch {}
        read(ch);
      },
    });
    return () => {
      gone = true;
      const ch = chRef.current;
      chRef.current = null;
      okRef.current = false;
      if (ch) { try { ch.untrack(); } catch {} }
      rtDrop(keep);
      setMates([]);
      setFull(false);
    };
  }, [topic, myId, lead]);

  const sig = me ? `${me.n}|${me.sv}|${me.col}|${me.w}|${me.rdy ? 1 : 0}` : '';
  useEffect(() => {
    const ch = chRef.current;
    if (!ch || !okRef.current) return;
    try { const r = ch.track(card()); if (r && r.catch) r.catch(() => {}); } catch {}
  }, [sig]);

  const send = (event, payload) => {
    const ch = chRef.current;
    if (!ch || !okRef.current) return false;
    try { ch.send({ type: 'broadcast', event, payload }); return true; } catch { return false; }
  };
  return { mates, full, send, live: !!topic };
}
