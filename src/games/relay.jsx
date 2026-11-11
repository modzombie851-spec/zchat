import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../supabaseClient.js';
import { rtKeep, rtDrop, rtReady, gameIceConfig } from '../App.jsx';

const testHooks = new Set();
if (typeof window !== 'undefined' && window.__zfake) {
  window.__zgr = { deliver: (payload, topic) => testHooks.forEach((h) => { if (topic && h.topic && h.topic !== topic) return; try { h.fn(payload); } catch {} }) };
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
    const hook = { topic, fn: (p) => deliver(p) };
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
    const hook = { topic, fn: (p) => deliver(p) };
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

const MESH_FAST = ['gp', 'gs', 'pl'];
const meshSid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const iceDone = (pc, ms) => new Promise((res) => {
  if (pc.iceGatheringState === 'complete') { res(); return; }
  let t = 0;
  const chk = () => { if (pc.iceGatheringState === 'complete') done(); };
  function done() { clearTimeout(t); try { pc.removeEventListener('icegatheringstatechange', chk); } catch {} res(); }
  t = setTimeout(done, ms || 2600);
  try { pc.addEventListener('icegatheringstatechange', chk); } catch { done(); }
});

export function useMeshRoom({ id, myId, enabled = true, meta, fast, audio = false }) {
  const [peers, setPeers] = useState([]);
  const [links, setLinks] = useState({});
  const [metas, setMetas] = useState({});
  const [mic, setMic] = useState({ on: false, err: '' });
  const [mics, setMics] = useState({});
  const [muted, setMuted] = useState({});
  const [ready, setReady] = useState(false);
  const S = useRef(null);
  if (!S.current) S.current = { sid: meshSid(), conns: new Map(), metas: {}, pres: [], seen: new Map(), peers: [], ch: null, ok: false, subs: new Map(), track: null, muted: {}, cloudAt: new Map(), alive: false, ice: null, linkKey: '', needPlay: false, fast: new Set(fast || MESH_FAST) };
  const metaRef = useRef(meta || {});
  metaRef.current = meta || {};
  const env = (t, data) => ({ ...(data || {}), t, from: myId, at: Date.now() });
  const cloud = (payload) => {
    const st = S.current;
    if (!st.ch || !st.ok) return false;
    try { const r = st.ch.send({ type: 'broadcast', event: 'g', payload }); if (r && r.catch) r.catch(() => {}); } catch { return false; }
    return true;
  };
  const dispatch = (payload) => {
    const st = S.current;
    const set = st.subs.get(payload.t);
    if (set) set.forEach((fn) => { try { fn(payload); } catch {} });
    const all = st.subs.get('*');
    if (all) all.forEach((fn) => { try { fn(payload); } catch {} });
  };
  const showLinks = () => {
    const st = S.current;
    const out = {};
    for (const p of st.peers) { const c = st.conns.get(p); out[p] = c && c.state === 'open' ? 'p2p' : 'cloud'; }
    const key = st.peers.map((p) => `${p}:${out[p]}`).join('|');
    if (key !== st.linkKey) { st.linkKey = key; setLinks(out); }
  };
  const dropAudio = (c) => { if (c && c.audio) { try { c.audio.pause(); } catch {} try { c.audio.srcObject = null; } catch {} c.audio = null; } };
  const closeConn = (p) => {
    const st = S.current;
    const c = st.conns.get(p);
    if (!c) return;
    st.conns.delete(p);
    c.dead = true;
    dropAudio(c);
    try { if (c.pc) c.pc.close(); } catch {}
    showLinks();
  };
  const failConn = (p, c) => {
    const st = S.current;
    if (st.conns.get(p) !== c || c.dead) return;
    const tries = (c.tries || 0) + 1;
    dropAudio(c);
    try { if (c.pc) c.pc.close(); } catch {}
    c.dead = true;
    const next = { sid: c.sid, state: tries >= 3 ? 'cloud' : 'wait', tries, at: Date.now(), reqs: 0 };
    st.conns.set(p, next);
    showLinks();
    if (tries < 3 && myId < p) setTimeout(() => { const cur = S.current.conns.get(p); if (cur === next && S.current.alive && S.current.peers.includes(p)) offer(p, next.sid, tries); }, 1500 * tries);
  };
  const attachAudio = (p, c, e) => {
    const st = S.current;
    const stream = e.streams && e.streams[0] ? e.streams[0] : new MediaStream([e.track]);
    if (!c.audio) { const a = new Audio(); a.autoplay = true; a.playsInline = true; c.audio = a; }
    c.audio.srcObject = stream;
    c.audio.muted = !!st.muted[p];
    const r = c.audio.play();
    if (r && r.catch) r.catch(() => { st.needPlay = true; });
  };
  const mkConn = (p, peerSid, tries) => {
    const st = S.current;
    const pc = new RTCPeerConnection(st.ice || undefined);
    const c = { pc, sid: peerSid, state: 'new', tries: tries || 0, at: Date.now(), dcU: null, dcR: null, tr: null, audio: null, dead: false };
    st.conns.set(p, c);
    c.dcU = pc.createDataChannel('u', { negotiated: true, id: 1, ordered: false, maxRetransmits: 0 });
    c.dcR = pc.createDataChannel('r', { negotiated: true, id: 2, ordered: true });
    const opened = () => { if (!c.dead && c.dcU.readyState === 'open' && c.dcR.readyState === 'open') { c.state = 'open'; c.tries = 0; showLinks(); } };
    const closed = () => { if (!c.dead && st.conns.get(p) === c && c.state === 'open') failConn(p, c); };
    const got = (e) => {
      let m = null;
      try { m = JSON.parse(e.data); } catch {}
      if (!m || !m.t) return;
      m.from = p;
      st.seen.set(p, Date.now());
      if (m.t === 'mic') setMics((v) => (v[p] === !!m.on ? v : { ...v, [p]: !!m.on }));
      dispatch(m);
    };
    for (const dc of [c.dcU, c.dcR]) { dc.onopen = opened; dc.onclose = closed; dc.onmessage = got; }
    if (audio && !(st.metas[p] && st.metas[p].w)) {
      if (myId < p) { c.tr = pc.addTransceiver('audio', { direction: 'sendrecv' }); if (st.track) c.tr.sender.replaceTrack(st.track).catch(() => {}); }
      pc.ontrack = (e) => { if (!c.dead) attachAudio(p, c, e); };
    }
    pc.onconnectionstatechange = () => { if (pc.connectionState === 'failed') failConn(p, c); };
    return c;
  };
  const offer = async (p, peerSid, tries) => {
    const st = S.current;
    if (!st.alive) return;
    if (!st.ice) { try { st.ice = await gameIceConfig(); } catch { st.ice = {}; } }
    const old = st.conns.get(p);
    if (old && old.pc && !old.dead) { old.dead = true; dropAudio(old); try { old.pc.close(); } catch {} }
    let c = null;
    try {
      c = mkConn(p, peerSid, tries);
      const desc = await c.pc.createOffer();
      await c.pc.setLocalDescription(desc);
      await iceDone(c.pc);
      if (st.conns.get(p) !== c || c.dead) return;
      c.state = 'offer';
      c.at = Date.now();
      cloud(env('sig', { to: p, ps: peerSid, sid: st.sid, d: { type: 'offer', sdp: c.pc.localDescription.sdp } }));
    } catch { if (c) failConn(p, c); }
  };
  const onSig = async (m) => {
    const st = S.current;
    const p = m.from;
    if (m.to !== myId || !m.d || (m.ps && m.ps !== st.sid)) return;
    if (m.sid) st.metas[p] = { ...(st.metas[p] || {}), sid: m.sid };
    if (m.d.type === 'offer') {
      if (myId < p) return;
      if (!st.ice) { try { st.ice = await gameIceConfig(); } catch { st.ice = {}; } }
      const old = st.conns.get(p);
      if (old && old.pc && !old.dead) { old.dead = true; dropAudio(old); try { old.pc.close(); } catch {} }
      let c = null;
      try {
        c = mkConn(p, m.sid, old ? old.tries : 0);
        await c.pc.setRemoteDescription({ type: 'offer', sdp: m.d.sdp });
        if (audio && !(st.metas[p] && st.metas[p].w)) {
          c.tr = c.pc.getTransceivers().find((x) => x.receiver && x.receiver.track && x.receiver.track.kind === 'audio') || null;
          if (c.tr) { try { c.tr.direction = 'sendrecv'; } catch {} if (st.track) { try { await c.tr.sender.replaceTrack(st.track); } catch {} } }
        }
        const ans = await c.pc.createAnswer();
        await c.pc.setLocalDescription(ans);
        await iceDone(c.pc);
        if (st.conns.get(p) !== c || c.dead) return;
        c.state = 'answer';
        c.at = Date.now();
        cloud(env('sig', { to: p, ps: m.sid, sid: st.sid, d: { type: 'answer', sdp: c.pc.localDescription.sdp } }));
      } catch { if (c) failConn(p, c); }
    } else if (m.d.type === 'answer') {
      const c = st.conns.get(p);
      if (!c || !c.pc || c.dead || c.pc.signalingState !== 'have-local-offer') return;
      try { await c.pc.setRemoteDescription({ type: 'answer', sdp: m.d.sdp }); c.state = 'answered'; c.at = Date.now(); } catch { failConn(p, c); }
    }
  };
  const ensureConn = (p) => {
    const st = S.current;
    if (!st.alive || typeof RTCPeerConnection === 'undefined') return;
    const m = st.metas[p];
    if (!m || !m.sid) return;
    const c = st.conns.get(p);
    if (c && c.sid === m.sid) return;
    if (c) closeConn(p);
    if (myId < p) offer(p, m.sid, 0);
    else st.conns.set(p, { sid: m.sid, state: 'wait', tries: 0, at: Date.now(), reqs: 0 });
  };
  const refresh = () => {
    const st = S.current;
    const now = Date.now();
    const ids = new Set(st.pres);
    for (const [k, at] of st.seen) if (now - at < 9000) ids.add(k);
    ids.delete(myId);
    const next = [...ids].sort();
    if (next.join('|') !== st.peers.join('|')) { st.peers = next; setPeers(next); }
    for (const [p, c] of st.conns) {
      if (!next.includes(p)) { if (!c.goneAt) c.goneAt = now; else if (now - c.goneAt > 6000) closeConn(p); }
      else c.goneAt = 0;
    }
    for (const p of next) ensureConn(p);
    showLinks();
  };
  const tick = () => {
    const st = S.current;
    if (!st.alive) return;
    const now = Date.now();
    refresh();
    for (const [p, c] of st.conns) {
      if (c.dead) continue;
      if ((c.state === 'new' || c.state === 'offer' || c.state === 'answer' || c.state === 'answered') && now - c.at > 11000) failConn(p, c);
      else if (c.state === 'wait' && myId > p && now - c.at > 6500) {
        c.at = now; c.reqs = (c.reqs || 0) + 1;
        if (c.reqs > 3) { c.state = 'cloud'; showLinks(); } else cloud(env('sigreq', { to: p, ps: c.sid, sid: st.sid }));
      }
    }
    send('ka', {}, { every: 8000 });
  };
  const deliverCloud = (payload) => {
    const st = S.current;
    if (!payload || payload.from === myId || !payload.t) return;
    const from = payload.from;
    if (payload.t === 'bye') { st.seen.delete(from); st.pres = st.pres.filter((k) => k !== from); closeConn(from); refresh(); dispatch(payload); return; }
    st.seen.set(from, Date.now());
    if (payload.to && payload.to !== myId) return;
    if (payload.t === 'sig') { onSig(payload); return; }
    if (payload.t === 'sigreq') { if (myId < from && (!payload.ps || payload.ps === st.sid)) { const m = st.metas[from]; const c = st.conns.get(from); if (m && m.sid && !(c && c.state === 'open')) offer(from, m.sid, c ? c.tries || 0 : 0); } return; }
    if (payload.skip && payload.skip.includes(myId)) return;
    if (payload.t === 'hi' || payload.t === 'hey') {
      const prev = st.metas[from];
      const m = { ...(payload.m || {}), sid: payload.sid || (prev && prev.sid) || null };
      st.metas[from] = m;
      setMetas((v) => ({ ...v, [from]: m }));
      if (typeof payload.mic === 'boolean') setMics((v) => (v[from] === payload.mic ? v : { ...v, [from]: payload.mic }));
      if (payload.t === 'hi') cloud(env('hey', { m: metaRef.current, sid: st.sid, mic: !!st.track }));
    }
    if (payload.t === 'mic') setMics((v) => (v[from] === !!payload.on ? v : { ...v, [from]: !!payload.on }));
    refresh();
    dispatch(payload);
  };
  const send = (t, data, opt) => {
    const st = S.current;
    const o = opt || {};
    const payload = env(t, data);
    const isFast = st.fast.has(t);
    let str = null;
    const via = [];
    let need = !!o.cloud;
    for (const p of st.peers) {
      const c = st.conns.get(p);
      const dc = c && c.state === 'open' && !c.dead ? (isFast ? c.dcU : c.dcR) : null;
      if (dc && dc.readyState === 'open') {
        if (isFast && dc.bufferedAmount > 196608) { via.push(p); continue; }
        try { if (!str) str = JSON.stringify(payload); dc.send(str); via.push(p); continue; } catch {}
      }
      need = true;
    }
    if (!need) return true;
    if (o.every) { const now = Date.now(); const last = st.cloudAt.get(t) || 0; if (now - last < o.every) return false; st.cloudAt.set(t, now); }
    return cloud(via.length ? { ...payload, skip: via } : payload);
  };
  const sendTo = (p, t, data, opt) => {
    const st = S.current;
    const o = opt || {};
    const payload = env(t, data);
    const c = st.conns.get(p);
    const isFast = st.fast.has(t);
    const dc = c && c.state === 'open' && !c.dead ? (isFast ? c.dcU : c.dcR) : null;
    if (dc && dc.readyState === 'open') {
      if (isFast && dc.bufferedAmount > 196608) return false;
      try { dc.send(JSON.stringify(payload)); return true; } catch {}
    }
    if (o.every) { const k = `${t}>${p}`; const now = Date.now(); const last = st.cloudAt.get(k) || 0; if (now - last < o.every) return false; st.cloudAt.set(k, now); }
    return cloud({ ...payload, to: p });
  };
  useEffect(() => {
    if (!enabled || !id || !myId) { setPeers([]); return undefined; }
    const st = S.current;
    st.alive = true;
    let keep = null;
    const topic = `zgr-${id}`;
    const hook = { topic, fn: (p) => deliverCloud(p) };
    testHooks.add(hook);
    gameIceConfig().then((cfg) => { st.ice = cfg; }, () => { st.ice = {}; });
    const iv = setInterval(tick, 2000);
    const replay = () => { if (!st.needPlay) return; st.needPlay = false; for (const c of st.conns.values()) if (c.audio) { const r = c.audio.play(); if (r && r.catch) r.catch(() => { st.needPlay = true; }); } };
    if (audio) document.addEventListener('pointerdown', replay, true);
    rtReady(topic).then(() => {
      if (!st.alive) return;
      keep = rtKeep(() => {
        st.ok = false;
        const ch = supabase.channel(topic, { config: { broadcast: { self: false, ack: false }, presence: { key: myId } } });
        ch.on('presence', { event: 'sync' }, () => { let keys = []; try { keys = Object.keys(ch.presenceState() || {}); } catch {} st.pres = keys; refresh(); });
        ch.on('broadcast', { event: 'g' }, ({ payload }) => deliverCloud(payload));
        st.ch = ch;
        return ch;
      }, {
        topic,
        onStatus: (status, err, ch) => {
          if (status !== 'SUBSCRIBED' || ch !== st.ch) return;
          st.ok = true;
          setReady(true);
          try { const r = ch.track({ at: Date.now(), sid: st.sid }); if (r && r.catch) r.catch(() => {}); } catch {}
          cloud(env('hi', { m: metaRef.current, sid: st.sid, mic: !!st.track }));
        },
      });
    });
    if (typeof window !== 'undefined' && window.__zfake) window.__zmesh = { st: () => S.current, links: () => { const o = {}; for (const [p, c] of S.current.conns) o[p] = c.state; return o; } };
    return () => {
      st.alive = false;
      clearInterval(iv);
      testHooks.delete(hook);
      if (audio) document.removeEventListener('pointerdown', replay, true);
      cloud(env('bye', {}));
      for (const p of [...st.conns.keys()]) closeConn(p);
      if (st.track) { try { st.track.stop(); } catch {} st.track = null; }
      const ch = st.ch;
      if (ch) { try { const r = ch.untrack(); if (r && r.catch) r.catch(() => {}); } catch {} }
      st.ok = false;
      setReady(false);
      st.ch = null;
      st.peers = [];
      st.seen = new Map();
      st.metas = {};
      if (keep) rtDrop(keep);
    };
  }, [enabled, id, myId]);
  const on = useMemo(() => (t, fn) => {
    const st = S.current;
    let set = st.subs.get(t);
    if (!set) { set = new Set(); st.subs.set(t, set); }
    set.add(fn);
    return () => set.delete(fn);
  }, []);
  const toggleMic = async () => {
    const st = S.current;
    if (st.track) {
      const t = st.track;
      st.track = null;
      for (const c of st.conns.values()) if (c.tr && !c.dead) { try { await c.tr.sender.replaceTrack(null); } catch {} }
      try { t.stop(); } catch {}
      setMic({ on: false, err: '' });
      send('mic', { on: false });
      return;
    }
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { setMic({ on: false, err: 'Voice is not available on this device' }); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      const t = stream.getAudioTracks()[0];
      if (!st.alive) { try { t.stop(); } catch {} return; }
      st.track = t;
      for (const c of st.conns.values()) if (c.tr && !c.dead) { try { await c.tr.sender.replaceTrack(t); } catch {} }
      setMic({ on: true, err: '' });
      send('mic', { on: true });
      for (const c of st.conns.values()) if (c.audio) { const r = c.audio.play(); if (r && r.catch) r.catch(() => {}); }
    } catch { setMic({ on: false, err: 'Allow the microphone to talk' }); }
  };
  const toggleMute = (p) => {
    const st = S.current;
    st.muted = { ...st.muted, [p]: !st.muted[p] };
    const c = st.conns.get(p);
    if (c && c.audio) c.audio.muted = !!st.muted[p];
    setMuted(st.muted);
  };
  return useMemo(() => ({ peers, links, metas, send, sendTo, on, me: myId, here: peers.length > 0, ready, mic, mics, muted, toggleMic, toggleMute }), [peers, links, metas, mic, mics, muted, myId, ready]);
}

export function useGameLink({ id, myId, peerId, enabled = true, g, fast }) {
  const on0 = enabled && !!id && !!myId;
  const fastSet = useRef(new Set(fast || MESH_FAST));
  const mesh = useMeshRoom({ id: on0 ? id : null, myId, enabled: on0, meta: { g: g || null }, fast });
  const [away, setAway] = useState(false);
  const watched = useRef(false);
  const sendRef = useRef(mesh.send);
  sendRef.current = mesh.send;
  useEffect(() => {
    if (!on0) return undefined;
    setAway(false);
    const offs = [
      mesh.on('away', (m) => { if (!peerId || m.from === peerId) setAway(true); }),
      mesh.on('back', (m) => { if (!peerId || m.from === peerId) setAway(false); }),
      mesh.on('hi', (m) => { if (!peerId || m.from === peerId) setAway(false); }),
    ];
    const vis = () => sendRef.current(document.visibilityState === 'hidden' ? 'away' : 'back', {}, { cloud: true });
    document.addEventListener('visibilitychange', vis);
    return () => { offs.forEach((f) => f && f()); document.removeEventListener('visibilitychange', vis); };
  }, [on0, id, myId, peerId]);
  const present = peerId ? mesh.peers.includes(peerId) : mesh.peers.length > 0;
  const [seen, setSeen] = useState(false);
  useEffect(() => { if (present) setSeen(true); }, [present]);
  useEffect(() => { setSeen(false); }, [id]);
  useEffect(() => {
    if (!on0 || present || !mesh.ready) return undefined;
    const t = setTimeout(() => setSeen((v) => v || 'gone'), 2600);
    return () => clearTimeout(t);
  }, [on0, present, id, mesh.ready]);
  const here = !on0 ? null : present && !away ? true : seen ? false : null;
  const send = (t, data) => sendRef.current(t, data, watched.current ? { cloud: true, every: fastSet.current.has(t) ? 180 : 0 } : undefined);
  const on = useMemo(() => (t, fn) => mesh.on(t, (m) => { if (peerId && m.from !== peerId) return; fn(m); }), [mesh.on, peerId]);
  const watch = (v) => { watched.current = !!v; };
  return useMemo(() => ({ here, send, on, me: myId, watch }), [here, on, myId]);
}

export function useRoomLink({ id, myId, enabled = true, meta, fast, audio = false }) {
  const mesh = useMeshRoom({ id, myId, enabled, meta, fast, audio });
  const meshRef = useRef(mesh);
  meshRef.current = mesh;
  return useMemo(() => ({ peers: mesh.peers, send: (t, d) => mesh.send(t, d), on: mesh.on, me: myId, here: mesh.peers.length > 0, links: mesh.links, mic: mesh.mic, mics: mesh.mics, muted: mesh.muted, toggleMic: () => meshRef.current.toggleMic(), toggleMute: (p) => meshRef.current.toggleMute(p) }), [mesh.peers, mesh.on, mesh.links, mesh.mic, mesh.mics, mesh.muted, myId]);
}
