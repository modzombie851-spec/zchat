import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { supabase } from '../supabaseClient.js';
import { useMeshRoom } from './relay.jsx';
import { useLiveBeacon, useGamePrivacy, setGamePrivacy, castMe, liveKind } from './live.js';
import { Avatar, GameArt, GAME_TITLES, GameButton, useBackClose, reducedMotion, useTheme } from '../App.jsx';
import { KitIcon, sfx, haptic } from './kit.jsx';

const REACTS = ['👏', '😂', '😮', '🔥', '❤️'];
const first = (n) => String(n || '').trim().split(' ')[0] || 'Friend';
const canUnzip = () => typeof DecompressionStream !== 'undefined';
let castMod = null;
export function loadCast() {
  if (!castMod) castMod = import('./castcap.js').then((m) => { try { m.setCastHost(supabase.supabaseUrl || supabase.restUrl || ''); } catch {} return m; });
  return castMod;
}

function scoreOf(items) {
  if (!Array.isArray(items)) return null;
  for (const it of items) {
    if (!Array.isArray(it) || it[0] === 'Best' || it[0] === 'Average') continue;
    const v = it[1];
    if (typeof v === 'number' || (typeof v === 'string' && v.length < 24)) return { l: String(it[0]).slice(0, 20), v: typeof v === 'number' ? v : String(v) };
  }
  return null;
}

export function useLiveCast({ game, room, myId: myId0, me: me0, active, info, rootRef, solo = false }) {
  const P = useGamePrivacy();
  const myId = myId0 || castMe.id;
  const me = me0 || castMe.me;
  const on = !!active && !!room && !!myId && !!game;
  useLiveBeacon({ game: game || 'game', room, info: { ...(info || {}), c: 1, so: solo ? 1 : 0 }, active: on, allow: P.watch });
  const want = on && P.show && (P.watch || (solo && P.join));
  const [meshOn, setMeshOn] = useState(want);
  useEffect(() => {
    if (want) { setMeshOn(true); return undefined; }
    const t = setTimeout(() => setMeshOn(false), 1500);
    return () => clearTimeout(t);
  }, [want]);
  const mesh = useMeshRoom({ id: meshOn ? `lc-${room}` : null, myId, enabled: meshOn, meta: { h: 1, n: first(me && me.name), a: (me && me.avatar) || null }, fast: ['lf'] });
  const meshRef = useRef(mesh);
  meshRef.current = mesh;
  const list = mesh.peers.map((p) => ({ id: p, m: mesh.metas[p] || {} }));
  const watchers = list.filter((x) => x.m.w).map((x) => ({ id: x.id, n: first(x.m.n), a: x.m.a || null }));
  const racers = list.filter((x) => x.m.r).map((x) => ({ id: x.id, n: first(x.m.n), a: x.m.a || null }));
  const slowRef = useRef(false);
  slowRef.current = watchers.some((w) => mesh.links[w.id] !== 'p2p');
  const zipRef = useRef(true);
  zipRef.current = list.filter((x) => x.m.w).every((x) => x.m.z);
  const streaming = meshOn && want && P.show && P.watch && watchers.length > 0;
  const capRef = useRef(null);
  const wantKey = useRef(new Set());
  useEffect(() => {
    if (!streaming) return undefined;
    let dead = false;
    let cap = null;
    loadCast().then((M) => {
      if (dead) return;
      cap = M.startCapture({
        getRoot: () => (rootRef && rootRef.current) || null,
        send: (t, d, o) => meshRef.current.send(t, d, o),
        sendTo: (p, t, d) => meshRef.current.sendTo(p, t, d),
        slow: () => slowRef.current,
        zipOk: () => zipRef.current,
      });
      capRef.current = cap;
      wantKey.current.forEach((p) => cap.key(p));
      wantKey.current.clear();
    }, () => {});
    return () => { dead = true; if (cap) cap.stop(); capRef.current = null; };
  }, [streaming]);
  const seenW = useRef(new Set());
  const [toast, setToast] = useState(null);
  const watchKey = watchers.map((w) => w.id).join('|');
  useEffect(() => {
    const now = new Set(watchers.map((w) => w.id));
    watchers.forEach((w) => {
      if (seenW.current.has(w.id)) return;
      seenW.current.add(w.id);
      if (capRef.current) capRef.current.key(w.id); else wantKey.current.add(w.id);
      const id = `${Date.now()}${Math.random()}`;
      setToast({ id, text: `${w.n} is watching` });
      setTimeout(() => setToast((t) => (t && t.id === id ? null : t)), 2600);
      try { sfx('join'); } catch {}
    });
    seenW.current.forEach((k) => { if (!now.has(k)) seenW.current.delete(k); });
  }, [watchKey]);
  const [floats, setFloats] = useState([]);
  const [scores, setScores] = useState({});
  const lastR = useRef(new Map());
  useEffect(() => {
    if (!meshOn) return undefined;
    const offs = [
      mesh.on('lq', (m) => { if (!m.from) return; if (capRef.current) capRef.current.key(m.from); else wantKey.current.add(m.from); }),
      mesh.on('lr', (m) => {
        const e = typeof m.e === 'string' && REACTS.includes(m.e) ? m.e : null;
        if (!e || !m.from) return;
        const now = Date.now();
        if (now - (lastR.current.get(m.from) || 0) < 500) return;
        lastR.current.set(m.from, now);
        const meta = meshRef.current.metas[m.from] || {};
        const id = `${now}${Math.random()}`;
        setFloats((f) => [...f.slice(-7), { id, e, n: first(meta.n), x: 12 + Math.random() * 70 }]);
        setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 2400);
      }),
      mesh.on('sc', (m) => { if (!m.from) return; setScores((s) => ({ ...s, [m.from]: { v: m.v, l: m.l } })); }),
    ];
    return () => offs.forEach((f) => f && f());
  }, [meshOn]);
  const canWatch = P.show && P.watch;
  const wasWatch = useRef(canWatch);
  useEffect(() => {
    if (wasWatch.current && !canWatch && meshOn) meshRef.current.send('lx', {}, { cloud: true });
    wasWatch.current = canWatch;
  }, [canWatch]);
  const myScore = useRef(null);
  const scAt = useRef(0);
  const scT = useRef(0);
  const pushScore = () => {
    const s = myScore.current;
    if (!s || !meshRef.current.peers.length) return;
    scAt.current = Date.now();
    meshRef.current.send('sc', s, { every: 900 });
  };
  const setStat = useMemo(() => (items) => {
    const s = scoreOf(items);
    if (!s) return;
    const prev = myScore.current;
    if (prev && prev.v === s.v && prev.l === s.l) return;
    myScore.current = s;
    clearTimeout(scT.current);
    const wait = Math.max(0, 450 - (Date.now() - scAt.current));
    scT.current = setTimeout(pushScore, wait);
  }, []);
  useEffect(() => () => clearTimeout(scT.current), []);
  const peerKey = mesh.peers.join('|');
  useEffect(() => { if (mesh.peers.length && myScore.current) { const t = setTimeout(pushScore, 600); return () => clearTimeout(t); } return undefined; }, [peerKey]);
  return { P, on, meshOn, watchers, racers, scores, floats, toast, setStat, game };
}

export function useRaceLink({ row, myId, me, active }) {
  const room = row && row.room;
  const host = row && row.user_id;
  const on = !!active && !!room && !!myId;
  const mesh = useMeshRoom({ id: on ? `lc-${room}` : null, myId, enabled: on, meta: { r: 1, n: first(me && me.name), a: (me && me.avatar) || null } });
  const meshRef = useRef(mesh);
  meshRef.current = mesh;
  const [them, setThem] = useState(null);
  useEffect(() => {
    if (!on) return undefined;
    const off = mesh.on('sc', (m) => { if (m.from === host) setThem({ v: m.v, l: m.l }); });
    return () => off && off();
  }, [on, host]);
  const mine = useRef(null);
  const t = useRef(0);
  const at = useRef(0);
  const setStat = useMemo(() => (items) => {
    const s = scoreOf(items);
    if (!s) return;
    if (mine.current && mine.current.v === s.v) return;
    mine.current = s;
    clearTimeout(t.current);
    t.current = setTimeout(() => { at.current = Date.now(); meshRef.current.send('sc', mine.current, { every: 900 }); }, Math.max(0, 450 - (Date.now() - at.current)));
  }, []);
  useEffect(() => () => clearTimeout(t.current), []);
  const here = mesh.peers.includes(host);
  return { them, here, setStat };
}

function Switch({ on, dim }) {
  return (
    <span aria-hidden="true" style={{ width: 46, height: 28, borderRadius: 14, background: on ? '#34C46A' : 'rgba(255,255,255,0.18)', position: 'relative', flexShrink: 0, opacity: dim ? 0.45 : 1, transition: reducedMotion() ? 'none' : 'background 0.18s' }}>
      <span style={{ position: 'absolute', top: 3, left: 3, width: 22, height: 22, borderRadius: 11, background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.3)', transform: on ? 'translateX(18px)' : 'none', transition: reducedMotion() ? 'none' : 'transform 0.18s' }} />
    </span>
  );
}

function SwitchRow({ label, sub, on, dim, onPress }) {
  return (
    <div role="switch" aria-checked={!!on} aria-label={label} tabIndex={0} onClick={() => { if (dim) return; onPress(); }} onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !dim) { e.preventDefault(); onPress(); } }}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 2px', cursor: dim ? 'default' : 'pointer', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ flex: 1, minWidth: 0, opacity: dim ? 0.5 : 1 }}>
        <div style={{ fontSize: 15, fontWeight: 800 }}>{label}</div>
        <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.68)', marginTop: 2, lineHeight: 1.4 }}>{sub}</div>
      </div>
      <Switch on={on} dim={dim} />
    </div>
  );
}

export function CastSheet({ cast, onClose, z = 45 }) {
  const P = cast.P;
  const tap = (patch) => { try { sfx('tap'); haptic(8); } catch {} setGamePrivacy(patch); };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: z, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', pointerEvents: 'auto' }}>
      <div className="zgr-up" role="dialog" aria-label="Friends and this game" onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 480, maxHeight: '86%', overflowY: 'auto', borderRadius: '26px 26px 0 0', background: '#17141F', color: '#FFFFFF', padding: '18px 18px calc(18px + env(safe-area-inset-bottom))', boxSizing: 'border-box', boxShadow: '0 -12px 40px rgba(0,0,0,0.45)', fontFamily: 'inherit' }}>
        <div style={{ width: 38, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)', margin: '-6px auto 12px' }} />
        <div style={{ fontSize: 19, fontWeight: 900, letterSpacing: '-0.01em' }}>Friends and this game</div>
        <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.7)', marginTop: 4, lineHeight: 1.45 }}>These switches work for every game you play.</div>
        <div style={{ marginTop: 8 }}>
          <SwitchRow label="Show friends what I play" sub="Friends see the game you are in on Games and in your chat" on={P.show} onPress={() => tap({ show: !P.show })} />
          <SwitchRow label="Let friends watch" sub="They see your game live. They cannot touch anything." on={P.show && P.watch} dim={!P.show} onPress={() => tap({ watch: !P.watch })} />
          <SwitchRow label="Let friends join" sub="They can take a free seat or play the same game with you" on={P.show && P.join} dim={!P.show} onPress={() => tap({ join: !P.join })} />
        </div>
        <div style={{ marginTop: 16, fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.66)' }}>{cast.watchers.length ? `Watching now, ${cast.watchers.length}` : 'Watching now'}</div>
        {cast.watchers.length ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 10 }}>
            {cast.watchers.map((w) => (
              <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px 6px 6px', borderRadius: 999, background: 'rgba(255,255,255,0.08)' }}>
                <Avatar emoji={w.a} name={w.n} size={28} />
                <span style={{ fontSize: 13.5, fontWeight: 800 }}>{w.n}</span>
              </div>
            ))}
          </div>
        ) : <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>{P.show && P.watch ? 'Nobody is watching right now.' : 'Watching is off.'}</div>}
        {cast.racers.length > 0 && (
          <>
            <div style={{ marginTop: 16, fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.66)' }}>Playing with you</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
              {cast.racers.map((r) => {
                const s = cast.scores[r.id];
                return (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar emoji={r.a} name={r.n} size={30} />
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 800 }}>{r.n}</span>
                    <span style={{ fontSize: 13.5, fontWeight: 800, color: 'rgba(255,255,255,0.8)', fontVariantNumeric: 'tabular-nums' }}>{s ? `${s.l} ${s.v}` : 'Starting'}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
        <button type="button" onClick={onClose} style={{ marginTop: 18, width: '100%', height: 46, borderRadius: 16, border: 'none', background: 'rgba(255,255,255,0.12)', color: '#FFFFFF', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Done</button>
      </div>
    </div>
  );
}

export function CastEye({ cast, size = 36, glass = true, onOpen }) {
  const { theme } = useTheme();
  const n = cast.watchers.length;
  const off = !cast.P.show;
  const color = glass ? '#FFFFFF' : theme.ink;
  return (
    <button type="button" aria-label={n ? `${n} watching. Friends and this game` : 'Friends and this game'} onClick={(e) => { e.stopPropagation(); onOpen(); }}
      style={{ position: 'relative', height: size, minWidth: size, padding: n ? '0 10px 0 8px' : 0, borderRadius: size / 2, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, cursor: 'pointer', background: glass ? (n ? 'rgba(229,72,77,0.9)' : 'rgba(255,255,255,0.14)') : (n ? '#E5484D' : 'transparent'), color: n ? '#FFFFFF' : color, flexShrink: 0, WebkitTapHighlightColor: 'transparent', fontFamily: 'inherit' }}>
      <KitIcon name="eye" size={19} color={n ? '#FFFFFF' : color} on={!off} />
      {n > 0 && <span style={{ fontSize: 13, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{n}</span>}
    </button>
  );
}

export function CastLayer({ cast, z = 30 }) {
  return (
    <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: z, pointerEvents: 'none', overflow: 'hidden' }}>
      {cast.toast && <div key={cast.toast.id} className="zgr-toast" style={{ position: 'absolute', left: '50%', top: 'calc(64px + env(safe-area-inset-top))', transform: 'translateX(-50%)', padding: '8px 14px', borderRadius: 999, background: 'rgba(16,14,24,0.88)', color: '#FFFFFF', fontSize: 13.5, fontWeight: 800, whiteSpace: 'nowrap' }}>{cast.toast.text}</div>}
      {cast.floats.map((f) => (
        <div key={f.id} className={reducedMotion() ? undefined : 'zlc-float'} style={{ position: 'absolute', left: `${f.x}%`, bottom: 'calc(110px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span style={{ fontSize: 40, lineHeight: 1, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.35))' }}>{f.e}</span>
          <span style={{ fontSize: 11.5, fontWeight: 800, color: '#FFFFFF', padding: '2px 7px', borderRadius: 8, background: 'rgba(0,0,0,0.45)' }}>{f.n}</span>
        </div>
      ))}
    </div>
  );
}

let css = false;
export function injectCastCss() {
  if (css || typeof document === 'undefined') return;
  css = true;
  const el = document.createElement('style');
  el.textContent = '@keyframes zlc-up{0%{opacity:0;transform:translateY(16px) scale(.7)}14%{opacity:1;transform:translateY(0) scale(1.08)}70%{opacity:1}100%{opacity:0;transform:translateY(-150px) scale(1)}}.zlc-float{animation:zlc-up 2.3s ease-out both}@keyframes zlc-spin{to{transform:rotate(360deg)}}.zlc-spin{animation:zlc-spin 0.9s linear infinite}.zlc-tap{transition:transform .12s ease}.zlc-tap:active{transform:scale(.9)}';
  document.head.appendChild(el);
}

export function LiveWatchPage({ row, profile, me, myId, onClose, onJoin, onPlayToo, onChallenge }) {
  useBackClose(true, onClose);
  injectCastCss();
  const host = row.user_id;
  const info = row.info || {};
  const K = liveKind(row);
  const name = first(profile && profile.name);
  const title = GAME_TITLES[K.k] || 'Game';
  const mesh = useMeshRoom({ id: `lc-${row.room}`, myId, enabled: true, meta: { w: 1, n: first(me && me.name), a: (me && me.avatar) || null, z: canUnzip() ? 1 : 0 }, fast: ['lf'] });
  const meshRef = useRef(mesh);
  meshRef.current = mesh;
  const stageRef = useRef(null);
  const mirRef = useRef(null);
  const pend = useRef({ styles: null, snap: null, frames: [] });
  const [phase, setPhase] = useState('wait');
  const [styled, setStyled] = useState(false);
  const [score, setScore] = useState(null);
  const [mine, setMine] = useState([]);
  const gotSnap = useRef(false);
  useEffect(() => {
    let dead = false;
    loadCast().then((M) => {
      if (dead || !stageRef.current) return;
      const mir = M.createMirror(stageRef.current);
      mirRef.current = mir;
      const r = stageRef.current.getBoundingClientRect();
      mir.setBox(r.width, r.height);
      const p = pend.current;
      if (p.styles) { mir.setStyles(p.styles).then(() => setStyled(true)); }
      if (p.snap) mir.setSnap(p.snap);
      p.frames.forEach((f) => f && mir.setFrame(f));
    }, () => {});
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => { const el = stageRef.current; if (el && mirRef.current) { const r = el.getBoundingClientRect(); mirRef.current.setBox(r.width, r.height); } }) : null;
    if (ro && stageRef.current) ro.observe(stageRef.current);
    return () => { dead = true; if (ro) ro.disconnect(); if (mirRef.current) mirRef.current.destroy(); mirRef.current = null; };
  }, []);
  useEffect(() => {
    const offs = [
      mesh.on('ls', (m) => { if (m.from !== host) return; const mir = mirRef.current; if (mir) mir.setStyles(m).then(() => setStyled(true)); else pend.current.styles = m; }),
      mesh.on('lv', (m) => {
        if (m.from !== host) return;
        gotSnap.current = true;
        setPhase((p) => (p === 'off' ? p : 'live'));
        const mir = mirRef.current;
        if (mir) mir.setSnap(m); else pend.current.snap = m;
      }),
      mesh.on('lf', (m) => { if (m.from !== host) return; const mir = mirRef.current; if (mir) mir.setFrame(m); else pend.current.frames[Number(m.i) || 0] = m; }),
      mesh.on('lx', (m) => { if (m.from === host) setPhase('off'); }),
      mesh.on('bye', (m) => { if (m.from === host) setPhase((p) => (p === 'off' ? p : 'gone')); }),
      mesh.on('sc', (m) => { if (m.from === host && (typeof m.v === 'number' || typeof m.v === 'string')) setScore({ v: m.v, l: typeof m.l === 'string' ? m.l : 'Score' }); }),
    ];
    return () => offs.forEach((f) => f && f());
  }, [host]);
  const hostHere = mesh.peers.includes(host);
  useEffect(() => {
    if (!hostHere) return undefined;
    if (phase === 'gone') setPhase(gotSnap.current ? 'live' : 'wait');
    meshRef.current.sendTo(host, 'lq', {});
    const iv = setInterval(() => { if (!gotSnap.current || !(mirRef.current && mirRef.current.hasStyles())) meshRef.current.sendTo(host, 'lq', {}); }, 3500);
    return () => clearInterval(iv);
  }, [hostHere]);
  useEffect(() => {
    if (hostHere || phase === 'off') return undefined;
    const t = setTimeout(() => setPhase((p) => (p === 'off' ? p : 'gone')), gotSnap.current ? 9000 : 16000);
    return () => clearTimeout(t);
  }, [hostHere, phase]);
  const others = mesh.peers.filter((p) => p !== host && mesh.metas[p] && mesh.metas[p].w).length;
  const react = (e) => {
    try { sfx('pop'); haptic(8); } catch {}
    meshRef.current.sendTo(host, 'lr', { e });
    const id = `${Date.now()}${Math.random()}`;
    setMine((f) => [...f.slice(-5), { id, e, x: 20 + Math.random() * 60 }]);
    setTimeout(() => setMine((f) => f.filter((x) => x.id !== id)), 2300);
  };
  const live = phase === 'live';
  const action = K.join && !K.full && onJoin && (K.max || info.lob) ? { label: 'Join', go: () => onJoin(row) }
    : K.play && onPlayToo ? { label: 'Play too', go: () => onPlayToo(row) }
      : onChallenge && !K.max && !info.so ? { label: 'Play next', aria: `Play ${name} next`, go: () => onChallenge(row) } : null;
  const hold = phase === 'wait' || !styled;
  return (
    <div role="dialog" aria-label={`Watching ${name} play ${title}`} style={{ position: 'fixed', inset: 0, zIndex: 120, background: '#0B0A10', color: '#FFFFFF', display: 'flex', flexDirection: 'column', fontFamily: 'inherit' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 'calc(8px + env(safe-area-inset-top)) 12px 8px' }}>
        <button type="button" aria-label="Back" onClick={onClose} className="zlc-tap" style={{ width: 40, height: 40, borderRadius: 20, border: 'none', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}><KitIcon name="back" size={22} /></button>
        <Avatar emoji={profile && profile.avatar} name={(profile && profile.name) || name} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15.5, fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{score ? `${title}, ${score.l} ${score.v}` : title}</div>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 999, background: live ? '#E5484D' : 'rgba(255,255,255,0.14)', fontSize: 12, fontWeight: 900, flexShrink: 0 }}>
          <span className={live && !reducedMotion() ? 'zchat-live-dot' : undefined} style={{ width: 7, height: 7, borderRadius: '50%', background: '#FFFFFF', opacity: live ? 1 : 0.6 }} />
          {live ? (others ? `Live, ${others + 1} watching` : 'Live') : 'Waiting'}
        </span>
      </div>
      <div style={{ flex: 1, minHeight: 0, padding: '4px 12px 8px', display: 'flex' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 0, borderRadius: 22, overflow: 'hidden', background: '#15131D', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)' }}>
          <div ref={stageRef} style={{ position: 'absolute', inset: 0, opacity: hold || phase === 'off' ? 0.25 : 1, transition: reducedMotion() ? 'none' : 'opacity 0.25s' }} />
          {(hold || phase !== 'live') && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, textAlign: 'center' }}>
              {phase === 'wait' || (phase === 'live' && hold) ? (
                <>
                  <div style={{ borderRadius: 22, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}><GameArt k={K.k} width={150} height={96} radius={0} /></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 800 }}>
                    <span className={reducedMotion() ? undefined : 'zlc-spin'} style={{ width: 16, height: 16, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.25)', borderTopColor: '#FFFFFF' }} />
                    {`Connecting to ${name}'s game`}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 18, fontWeight: 900 }}>{phase === 'off' ? `${name} turned off watching` : `${name} left the game`}</div>
                  <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.7)', maxWidth: 280, lineHeight: 1.45 }}>{phase === 'off' ? 'You can watch again when they switch it back on.' : 'The game may have ended. Check Games to see who is playing now.'}</div>
                  <GameButton color="white" label="Close" onClick={onClose} style={{ marginTop: 6, minWidth: 140 }} />
                </>
              )}
            </div>
          )}
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
            {mine.map((f) => <span key={f.id} className={reducedMotion() ? undefined : 'zlc-float'} style={{ position: 'absolute', left: `${f.x}%`, bottom: 16, fontSize: 36 }}>{f.e}</span>)}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px calc(12px + env(safe-area-inset-bottom))' }}>
        <div style={{ display: 'flex', gap: 4, flex: 1, minWidth: 0, overflowX: 'auto' }}>
          {REACTS.map((e) => (
            <button key={e} type="button" aria-label={`Send ${e}`} disabled={!live} onClick={() => react(e)} className="zlc-tap"
              style={{ width: 44, height: 44, borderRadius: 22, border: 'none', background: 'rgba(255,255,255,0.1)', fontSize: 22, cursor: live ? 'pointer' : 'default', opacity: live ? 1 : 0.4, flexShrink: 0, padding: 0 }}>{e}</button>
          ))}
        </div>
        {action && <GameButton color={action.label === 'Join' ? 'green' : 'gold'} label={action.label} ariaLabel={action.aria || action.label} onClick={action.go} style={{ flexShrink: 0 }} />}
      </div>
    </div>
  );
}

export function PageCast({ game, room, info, solo = false, size = 36 }) {
  injectCastCss();
  const rootRef = useRef(null);
  const live = useLiveCast({ game, room, info, solo, active: !!game && !!room, rootRef });
  const [open, setOpen] = useState(false);
  const layer = typeof document !== 'undefined' ? ReactDOM.createPortal(<>
    <CastLayer cast={live} z={70} />
    {open && <CastSheet cast={live} z={72} onClose={() => setOpen(false)} />}
  </>, document.body) : null;
  return (
    <span ref={(n) => { rootRef.current = n ? (n.closest('.zchat-wide-page') || null) : null; }} style={{ display: 'inline-flex' }}>
      <CastEye cast={live} glass={false} size={size} onOpen={() => setOpen(true)} />
      {layer}
    </span>
  );
}
