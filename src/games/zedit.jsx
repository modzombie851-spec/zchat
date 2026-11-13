import React, { useEffect, useRef, useState } from 'react';
import { FONT } from '../App.jsx';
import { CFONT } from './zlobby.jsx';
import { surf } from './ztownview.js';
import { makeEditView, camRay, MAP_CATS, MAP_PARTS, PART_BY, MARKS, EDGE, isMark, mkPart, clampPart, pineCreek, emptyMap, mapToFile, mapFromFile, mapWeight, forestParts } from './zeditview.js';

const AMBER = '#E0A85A', CREAM = '#EFE8D2', MUTED = 'rgba(239,232,210,0.62)', PANEL = 'rgba(14,13,12,0.82)', LINE = 'rgba(239,232,210,0.14)', RED = '#E06A4E', GREEN = '#86C873', SHEET = '#17150F';
const cut = (n) => `polygon(0 0, calc(100% - ${n}px) 0, 100% ${n}px, 100% 100%, ${n}px 100%, 0 calc(100% - ${n}px))`;
const STORE = 'zchat-zmaps-v1', TIP = 'zchat-zmaps-tip';
const ATLAS = '/dead/mk-v1.webp', ACOLS = 8;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const TOUCH = typeof window !== 'undefined' && ('ontouchstart' in window || (navigator.maxTouchPoints || 0) > 0);
const newId = () => `m${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;

function readMaps() { try { const o = JSON.parse(localStorage.getItem(STORE) || 'null'); return o && Array.isArray(o.maps) ? o.maps.filter((m) => m && m.id && m.f) : []; } catch { return []; } }
function writeMaps(maps) { try { localStorage.setItem(STORE, JSON.stringify({ maps })); return true; } catch { return false; } }

const IP = {
  close: <path d="M6 6l12 12M18 6L6 18" />,
  maps: <><path d="M3.5 6.2l5.5-2.2 6 2.2 5.5-2.2v13.6l-5.5 2.2-6-2.2-5.5 2.2z" /><path d="M9 4v13.6M15 6.2v13.6" /></>,
  undo: <><path d="M9 13.5L4.5 9 9 4.5" /><path d="M4.5 9h10a5 5 0 0 1 0 10H11" /></>,
  redo: <><path d="M15 13.5L19.5 9 15 4.5" /><path d="M19.5 9h-10a5 5 0 0 0 0 10H13" /></>,
  grid: <><path d="M4.5 4.5h15v15h-15z" /><path d="M9.5 4.5v15M14.5 4.5v15M4.5 9.5h15M4.5 14.5h15" /></>,
  tree: <><path d="M12 3l-5.5 7.5h3L6 16h12l-3.5-5.5h3z" /><path d="M12 16v5" /></>,
  rotL: <><path d="M4.5 5v5h5" /><path d="M5.2 10A7.2 7.2 0 1 1 7 16.8" /></>,
  rotR: <><path d="M19.5 5v5h-5" /><path d="M18.8 10A7.2 7.2 0 1 0 17 16.8" /></>,
  minus: <path d="M5.5 12h13" />,
  plus: <path d="M12 5.5v13M5.5 12h13" />,
  up: <><path d="M7 10l5-5 5 5" /><path d="M12 5v14" /></>,
  down: <><path d="M7 14l5 5 5-5" /><path d="M12 19V5" /></>,
  copy: <><path d="M8.5 8.5h11v11h-11z" /><path d="M15.5 8.5v-4h-11v11h4" /></>,
  trash: <><path d="M4.5 6.5h15M9.5 6.5V4h5v2.5M6.5 6.5l1 13.5h9l1-13.5" /><path d="M10.2 10.5v6M13.8 10.5v6" /></>,
  check: <path d="M5 12.5l4.2 4.2L19 7" />,
  plusBox: <><path d="M4.5 4.5h15v15h-15z" /><path d="M12 8.5v7M8.5 12h7" /></>,
  town: <><path d="M3.5 20.5V11l5-4 5 4v9.5" /><path d="M13.5 20.5V8.5l4-3 3 2.5v12.5" /><path d="M2.5 20.5h19M7 20.5v-4.5h3v4.5" /></>,
  open: <path d="M3.5 6.5h6l2 2h9v11h-17z" />,
  share: <><path d="M12 14.5V4M7.8 8L12 3.8 16.2 8" /><path d="M8 11H5v9.5h14V11h-3" /></>,
  save: <><path d="M12 4v10.5M7.8 10.3L12 14.5l4.2-4.2" /><path d="M5 18.5h14" /></>,
  code: <path d="M8.5 7.5L4 12l4.5 4.5M15.5 7.5L20 12l-4.5 4.5" />,
  pen: <path d="M4.5 19.5l1-4.5L15.8 4.7l3.5 3.5L9 18.5z" />,
  hide: <path d="M6 9l6 6 6-6" />,
  show: <path d="M6 15l6-6 6 6" />,
  pin: <><path d="M12 21s-6.2-6.3-6.2-11.1a6.2 6.2 0 0 1 12.4 0C18.2 14.7 12 21 12 21z" /><circle cx="12" cy="9.9" r="2.3" /></>,
  send: <><path d="M3.8 11.6L20 4.5l-5.6 15.7-3.2-5.6z" /><path d="M11.2 14.6L20 4.5" /></>,
};
function Ic({ k, s = 20, c = CREAM, w = 1.8 }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: 'block', flexShrink: 0 }}>{IP[k]}</svg>;
}

function Btn({ u, label, icon, text, onPress, onHold, on, tone, disabled, size = 36, wide, style }) {
  const tm = useRef(0);
  const stop = () => { clearTimeout(tm.current); clearInterval(tm.current); tm.current = 0; };
  useEffect(() => stop, []);
  const down = (e) => {
    e.stopPropagation();
    if (!onHold || disabled) return;
    stop();
    onHold(true);
    tm.current = setTimeout(() => { tm.current = setInterval(() => onHold(false), 85); }, 360);
  };
  const click = (e) => {
    e.stopPropagation();
    if (disabled) return;
    if (onHold) { if (e.detail === 0) onHold(true); return; }
    if (onPress) onPress();
  };
  const bg = tone === 'amber' ? AMBER : tone === 'red' ? 'rgba(224,106,78,0.16)' : on ? 'rgba(224,168,90,0.2)' : PANEL;
  const fg = tone === 'amber' ? '#1B1712' : tone === 'red' ? RED : on ? AMBER : CREAM;
  return (
    <button type="button" aria-label={label} aria-pressed={on == null ? undefined : !!on} disabled={disabled} onPointerDown={down} onPointerUp={stop} onPointerCancel={stop} onPointerLeave={stop} onClick={click}
      style={{ height: u(size), minWidth: u(size), padding: text ? `0 ${u(wide ? 16 : 11)}px` : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: u(6), border: 'none', cursor: disabled ? 'default' : 'pointer', background: bg, color: fg, opacity: disabled ? 0.38 : 1, clipPath: cut(u(7)), boxShadow: tone === 'amber' ? 'none' : `inset 0 0 0 1px ${on ? AMBER : LINE}`, fontFamily: CFONT, fontSize: u(15), fontWeight: 800, whiteSpace: 'nowrap', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', ...style }}>
      {icon ? <Ic k={icon} s={u(19)} c={fg} /> : null}
      {text ? <span>{text}</span> : null}
    </button>
  );
}

function Tile({ u, p, atlas, onPress }) {
  const t = u(58);
  const mk = MARKS[p.id];
  const col = p.i % ACOLS, row = Math.floor(p.i / ACOLS);
  return (
    <button type="button" aria-label={`Add ${p.n}`} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onPress(p.id); }}
      style={{ flexShrink: 0, width: u(80), padding: `${u(5)}px ${u(4)}px ${u(4)}px`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: u(3), border: 'none', cursor: 'pointer', background: PANEL, boxShadow: `inset 0 0 0 1px ${LINE}`, clipPath: cut(u(8)), color: CREAM, touchAction: 'pan-x', WebkitTapHighlightColor: 'transparent' }}>
      <span aria-hidden="true" style={{ width: t, height: t, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: u(4), background: mk ? 'rgba(239,232,210,0.05)' : atlas ? `url(${ATLAS}) -${col * t}px -${row * t}px / ${ACOLS * t}px auto no-repeat` : 'rgba(239,232,210,0.05)' }}>
        {mk ? <Ic k="pin" s={u(34)} c={mk.hex} w={2} /> : null}
      </span>
      <span style={{ fontFamily: FONT, fontSize: u(10.5), fontWeight: 700, lineHeight: 1.15, textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.n}</span>
    </button>
  );
}

const camOf = (c) => {
  const t = clamp((c.dist - 6) / 224, 0, 1), pitch = 0.36 + t * 0.86;
  const ty = surf(c.x, c.z), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const pos = [c.x + Math.sin(c.yaw) * cp * c.dist, ty + 0.8 + sp * c.dist, c.z + Math.cos(c.yaw) * cp * c.dist];
  const gh = surf(pos[0], pos[2]) + 1.2;
  if (pos[1] < gh) pos[1] = gh;
  return { pos, at: [c.x, ty + 0.8, c.z], fov: 0.95, near: 0.25, far: 1100, shadowAt: [c.x, 0, c.z] };
};
const onPlane = (ray, h) => {
  if (!ray || Math.abs(ray.d[1]) < 0.02) return null;
  const t = (h - ray.o[1]) / ray.d[1];
  if (t <= 0 || t > 3000) return null;
  return [ray.o[0] + ray.d[0] * t, h, ray.o[2] + ray.d[2] * t];
};
const CAM0 = { x: 2, z: -16, yaw: 0.5, dist: 72 };
const ago = (t) => {
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Date(t).toLocaleDateString();
};

export function ZMaker({ GS, tier, onClose }) {
  const stageRef = useRef(null), cvRef = useRef(null), ER = useRef(null), fileRef = useRef(null), nameRef = useRef(null);
  const [cvKey, setCvKey] = useState(0);
  const [load, setLoad] = useState({ p: 0, ready: false, err: null });
  const [maps, setMaps] = useState(readMaps);
  const [cur, setCur] = useState(null);
  const [sel, setSelS] = useState(-1);
  const [cat, setCat] = useState('build');
  const [sheet, setSheet] = useState('maps');
  const [snap, setSnap] = useState(true);
  const [tray, setTray] = useState(true);
  const [toast, setToast] = useState(null);
  const [tip, setTip] = useState(() => { try { return !localStorage.getItem(TIP); } catch { return true; } });
  const [naming, setNaming] = useState(false);
  const [atlas, setAtlas] = useState(false);
  const [lost, setLost] = useState(false);
  const [wInfo, setWInfo] = useState(false);
  const [askDel, setAskDel] = useState(null);
  const [forestMenu, setForestMenu] = useState(false);
  const [, setHv] = useState(0);
  const H = useRef({ undo: [], redo: [] });
  const camR = useRef({ ...CAM0 });
  const S = useRef({ cur: null, sel: -1, snap: true, sheet: 'maps' });
  const mapsRef = useRef(maps);
  const need = useRef(true);
  const keys = useRef(new Set());
  const P = useRef({ pts: new Map(), mode: null });
  const A = useRef({});
  const GSR = useRef(GS);
  GSR.current = GS;
  S.current.snap = snap;
  S.current.sheet = sheet;
  const poke = () => { need.current = true; };
  const setSel = (i) => { S.current.sel = i; setSelS(i); poke(); };
  const say = (t) => setToast({ t, at: Date.now() });
  const k = clamp(Math.min(GS.W / 820, GS.H / 380), 0.72, 1.15);
  const u = (n) => Math.round(n * k * 10) / 10;
  const { top, right, bottom, left } = GS.at;

  const live = (parts) => { const c = S.current.cur; if (!c) return; const nx = { ...c, parts }; S.current.cur = nx; setCur(nx); poke(); };
  const begin = () => { const c = S.current.cur; if (!c) return; const h = H.current; h.undo.push(c.parts); if (h.undo.length > 80) h.undo.shift(); h.redo = []; setHv((n) => n + 1); };
  const commit = (parts) => { begin(); live(parts); };
  const undo = () => { const c = S.current.cur, h = H.current; if (!c || !h.undo.length) return; h.redo.push(c.parts); const parts = h.undo.pop(); setSel(-1); live(parts); setHv((n) => n + 1); };
  const redo = () => { const c = S.current.cur, h = H.current; if (!c || !h.redo.length) return; h.undo.push(c.parts); const parts = h.redo.pop(); setSel(-1); live(parts); setHv((n) => n + 1); };

  const persist = (m) => {
    if (!m) return;
    const next = [{ id: m.id, t: Date.now(), f: mapToFile(m) }, ...mapsRef.current.filter((x) => x.id !== m.id)].slice(0, 30);
    mapsRef.current = next;
    setMaps(next);
    if (!writeMaps(next)) say('This phone is out of space for maps. Save the map file to keep it.');
  };
  useEffect(() => {
    if (!cur) return undefined;
    const t = setTimeout(() => persist(cur), 700);
    return () => clearTimeout(t);
  }, [cur]);
  useEffect(() => { if (!toast) return undefined; const t = setTimeout(() => setToast(null), 2600); return () => clearTimeout(t); }, [toast]);
  useEffect(() => { const im = new Image(); im.onload = () => setAtlas(true); im.src = ATLAS; }, []);
  useEffect(() => { poke(); }, [GS.W, GS.H, sheet, tray]);

  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return undefined;
    let E = null;
    try { E = makeEditView(cv, tier); } catch { E = null; }
    if (!E) { setLoad({ p: 0, ready: false, err: 'gl' }); return undefined; }
    ER.current = E;
    const onLost = (e) => { try { e.preventDefault(); } catch {} setLost(true); };
    cv.addEventListener('webglcontextlost', onLost);
    let raf = 0, lp = -1, lr = false, le = null, last = performance.now();
    const frame = () => {
      raf = requestAnimationFrame(frame);
      const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (E.dead) return;
      if (E.ready !== lr || E.err !== le || Math.abs(E.p - lp) > 0.02) { lp = E.p; lr = E.ready; le = E.err; setLoad({ p: E.p, ready: E.ready, err: E.err }); }
      const ks = keys.current;
      if (ks.size && !S.current.sheet) {
        const c = camR.current, sp = c.dist * 0.9 * dt;
        const f = (ks.has('KeyW') || ks.has('ArrowUp') ? 1 : 0) - (ks.has('KeyS') || ks.has('ArrowDown') ? 1 : 0);
        const r = (ks.has('KeyD') || ks.has('ArrowRight') ? 1 : 0) - (ks.has('KeyA') || ks.has('ArrowLeft') ? 1 : 0);
        const t = (ks.has('KeyE') ? 1 : 0) - (ks.has('KeyQ') ? 1 : 0);
        if (f || r || t) {
          c.x = clamp(c.x - Math.sin(c.yaw) * f * sp + Math.cos(c.yaw) * r * sp, EDGE[0], EDGE[2]);
          c.z = clamp(c.z - Math.cos(c.yaw) * f * sp - Math.sin(c.yaw) * r * sp, EDGE[1], EDGE[3]);
          c.yaw += t * 1.6 * dt;
          need.current = true;
        }
      }
      if (!E.dirty && !need.current) return;
      need.current = false;
      const dpr = Math.min(window.devicePixelRatio || 1, 2) * E.dpr;
      const W0 = Math.max(2, Math.round(GSR.current.W * dpr)), H0 = Math.max(2, Math.round(GSR.current.H * dpr));
      if (cv.width !== W0 || cv.height !== H0) { cv.width = W0; cv.height = H0; }
      const c = camR.current, sc = S.current;
      E.env.fogDen = 0.0042 * clamp(70 / c.dist, 0.3, 1.2);
      E.draw(camOf(c), sc.cur ? sc.cur.parts : [], sc.sel, sc.cur ? sc.cur.forest | 0 : 1);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); cv.removeEventListener('webglcontextlost', onLost); E.dispose(); if (ER.current === E) ER.current = null; };
  }, [cvKey, tier]);
  const loc = (e) => {
    const el = stageRef.current, r = el.getBoundingClientRect();
    return GS.side ? { x: e.clientY - r.top, y: r.right - e.clientX } : { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const rayAt = (p) => camRay(camOf(camR.current), GS.W / GS.H, (p.x / GS.W) * 2 - 1, 1 - (p.y / GS.H) * 2);
  const ready = () => !!(ER.current && ER.current.ready && S.current.cur && !S.current.sheet);

  const beginDrag = (hit, ray) => {
    const g = P.current, p0 = S.current.cur.parts[hit.i];
    g.mode = 'part'; g.pi = hit.i; g.p0 = p0; g.began = false;
    g.hp = [ray.o[0] + ray.d[0] * hit.t, ray.o[1] + ray.d[1] * hit.t, ray.o[2] + ray.d[2] * hit.t];
  };
  const startOne = (p, e) => {
    const g = P.current, E = ER.current, sc = S.current;
    clearTimeout(g.hold);
    g.mode = 'pan'; g.moved = false; g.last = p;
    if (e && e.pointerType === 'mouse' && e.button !== 0) { g.mode = 'turn'; g.c0 = { ...camR.current }; return; }
    const ray = rayAt(p), gh = E.ground(ray), hit = E.pick(ray, sc.cur.parts);
    g.py = gh ? gh[1] : surf(camR.current.x, camR.current.z);
    const onPart = hit.i >= 0 && (!gh || hit.t < gh[3] + 0.05);
    g.hit = onPart ? hit : null;
    if (onPart && hit.i === sc.sel) { beginDrag(hit, ray); return; }
    if (onPart) g.hold = setTimeout(() => { const q = P.current; if (q.mode === 'pan' && !q.moved && q.pts.size === 1) { setSel(hit.i); try { if (navigator.vibrate) navigator.vibrate(12); } catch {} beginDrag(hit, ray); } }, 430);
  };
  const startTwo = () => {
    const g = P.current;
    clearTimeout(g.hold);
    const [a, b] = [...g.pts.values()];
    g.mode = 'two'; g.moved = true;
    g.d0 = Math.hypot(b.x - a.x, b.y - a.y) || 1; g.a0 = Math.atan2(b.y - a.y, b.x - a.x);
    g.mLast = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; g.c0 = { ...camR.current };
    g.py = surf(camR.current.x, camR.current.z);
  };
  const onDown = (e) => {
    if (!ready()) return;
    const g = P.current;
    if (g.pts.size >= 2) return;
    const p = loc(e);
    g.pts.set(e.pointerId, { ...p, x0: p.x, y0: p.y, t0: performance.now() });
    if (g.pts.size === 1) startOne(p, e);
    else startTwo();
  };
  const onMove = (e) => {
    const g = P.current, q = g.pts.get(e.pointerId);
    if (!q || !ER.current) return;
    const p = loc(e);
    q.x = p.x; q.y = p.y;
    const c = camR.current, sc = S.current;
    if (!g.moved && Math.hypot(p.x - q.x0, p.y - q.y0) > 7) { g.moved = true; clearTimeout(g.hold); }
    if (g.mode === 'two' && g.pts.size === 2) {
      const [a, b] = [...g.pts.values()];
      const d = Math.hypot(b.x - a.x, b.y - a.y) || 1, ang = Math.atan2(b.y - a.y, b.x - a.x), m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      c.dist = clamp((g.c0.dist * g.d0) / d, 6, 230);
      let da = ang - g.a0;
      if (da > Math.PI) da -= Math.PI * 2; else if (da < -Math.PI) da += Math.PI * 2;
      c.yaw = g.c0.yaw + da;
      const p1 = onPlane(rayAt(g.mLast), g.py), p2 = onPlane(rayAt(m), g.py);
      if (p1 && p2) { c.x = clamp(c.x + p1[0] - p2[0], EDGE[0], EDGE[2]); c.z = clamp(c.z + p1[2] - p2[2], EDGE[1], EDGE[3]); }
      g.mLast = m;
      poke();
      return;
    }
    if (g.mode === 'turn') {
      c.yaw = g.c0.yaw - (p.x - q.x0) * 0.006;
      c.dist = clamp(g.c0.dist * Math.exp((p.y - q.y0) * 0.004), 6, 230);
      poke();
      return;
    }
    if (g.mode === 'part' && sc.cur) {
      const h = onPlane(rayAt(p), g.hp[1]);
      if (!h || !g.moved) return;
      let nx = g.p0.x + (h[0] - g.hp[0]), nz = g.p0.z + (h[2] - g.hp[2]);
      if (Math.hypot(nx - g.p0.x, nz - g.p0.z) > 400) return;
      if (sc.snap) { nx = Math.round(nx * 2) / 2; nz = Math.round(nz * 2) / 2; }
      if (!g.began) { begin(); g.began = true; }
      const parts = sc.cur.parts.slice();
      parts[g.pi] = clampPart({ ...g.p0, x: nx, z: nz });
      live(parts);
      return;
    }
    if (g.mode === 'pan' && g.moved) {
      const a = onPlane(rayAt(g.last), g.py), b = onPlane(rayAt(p), g.py);
      if (a && b) { c.x = clamp(c.x + a[0] - b[0], EDGE[0], EDGE[2]); c.z = clamp(c.z + a[2] - b[2], EDGE[1], EDGE[3]); poke(); }
      g.last = p;
    }
  };
  const onUp = (e) => {
    const g = P.current, q = g.pts.get(e.pointerId);
    if (!q) return;
    g.pts.delete(e.pointerId);
    clearTimeout(g.hold);
    if (g.mode === 'pan' && !g.moved && g.pts.size === 0 && performance.now() - q.t0 < 600) setSel(g.hit ? g.hit.i : -1);
    if (g.pts.size === 1) { const r = [...g.pts.values()][0]; g.mode = 'pan'; g.moved = true; g.last = { x: r.x, y: r.y }; g.py = surf(camR.current.x, camR.current.z); }
    else if (g.pts.size === 0) g.mode = null;
  };
  A.current = { onMove, onUp, undo, redo };
  useEffect(() => {
    const mv = (e) => A.current.onMove(e), up = (e) => A.current.onUp(e);
    window.addEventListener('pointermove', mv, { passive: true });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    const el = stageRef.current;
    const wh = (e) => { if (e.target !== cvRef.current || S.current.sheet) return; e.preventDefault(); const c = camR.current; c.dist = clamp(c.dist * Math.exp(e.deltaY * 0.0011), 6, 230); need.current = true; };
    if (el) el.addEventListener('wheel', wh, { passive: false });
    return () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); if (el) el.removeEventListener('wheel', wh); };
  }, []);

  const mod = (fn, first) => {
    const sc = S.current, c = sc.cur;
    if (!c || sc.sel < 0 || !c.parts[sc.sel]) return;
    if (first) begin();
    const parts = c.parts.slice();
    parts[sc.sel] = clampPart(fn(parts[sc.sel], sc.snap));
    live(parts);
  };
  const turn = (dir) => (first) => mod((p, sn) => ({ ...p, yaw: sn ? Math.round((p.yaw + dir * 15) / 15) * 15 : p.yaw + dir * 3 }), first);
  const size = (dir) => (first) => mod((p, sn) => ({ ...p, s: sn ? Math.max(0.3, Math.round(p.s * (dir > 0 ? 1.1 : 1 / 1.1) * 20) / 20) : p.s * (dir > 0 ? 1.03 : 1 / 1.03) }), first);
  const lift = (dir) => (first) => mod((p, sn) => ({ ...p, dy: Math.round((p.dy + dir * (sn ? 0.1 : 0.02)) * 100) / 100 }), first);
  const copySel = () => {
    const sc = S.current, c = sc.cur, E = ER.current;
    if (!c || sc.sel < 0 || !E) return;
    const p = c.parts[sc.sel];
    let dx, dz;
    if (isMark(p.id) || !E.M || !E.M[p.id]) { const cy = camR.current.yaw; dx = Math.cos(cy) * 2.5; dz = -Math.sin(cy) * 2.5; }
    else { const m = E.M[p.id], w = (m.max[0] - m.min[0]) * p.s + (sc.snap ? 0 : 0.1), a = (p.yaw * Math.PI) / 180; dx = Math.cos(a) * w; dz = -Math.sin(a) * w; }
    const np = clampPart({ ...p, x: p.x + dx, z: p.z + dz });
    delete np.f;
    commit([...c.parts, np]);
    setSel(c.parts.length);
  };
  const delSel = () => {
    const sc = S.current, c = sc.cur;
    if (!c || sc.sel < 0) return;
    commit(c.parts.filter((_, i) => i !== sc.sel));
    setSel(-1);
  };
  const addPart = (id) => {
    const sc = S.current, c = sc.cur;
    if (!c) return;
    if (id === '@b') {
      const bi = c.parts.findIndex((p) => p.id === '@b');
      if (bi >= 0) { const parts = c.parts.slice(); parts[bi] = clampPart({ ...parts[bi], x: camR.current.x, z: camR.current.z }); commit(parts); setSel(bi); say('There is one boss spawn. It moved here.'); return; }
    }
    let x = camR.current.x, z = camR.current.z;
    for (let n = 0; n < 10 && c.parts.some((p) => Math.abs(p.x - x) < 0.6 && Math.abs(p.z - z) < 0.6); n++) x += 1.6;
    if (sc.snap) { x = Math.round(x * 2) / 2; z = Math.round(z * 2) / 2; }
    commit([...c.parts, clampPart(mkPart(id, x, z))]);
    setSel(c.parts.length);
  };
  A.current.copySel = copySel; A.current.delSel = delSel; A.current.turn = turn; A.current.size = size;
  useEffect(() => {
    const kd = (e) => {
      if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
      if (S.current.sheet) return;
      const mk = e.ctrlKey || e.metaKey, key = e.key.toLowerCase();
      if (mk && key === 'z') { e.preventDefault(); if (e.shiftKey) A.current.redo(); else A.current.undo(); return; }
      if (mk && key === 'y') { e.preventDefault(); A.current.redo(); return; }
      if (mk && key === 'd') { e.preventDefault(); A.current.copySel(); return; }
      if (mk) return;
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); A.current.delSel(); return; }
      if (e.key === 'Escape') { setSel(-1); return; }
      if (key === 'r') { A.current.turn(e.shiftKey ? -1 : 1)(true); return; }
      if (e.key === '+' || e.key === '=') { A.current.size(1)(true); return; }
      if (e.key === '-' || e.key === '_') { A.current.size(-1)(true); return; }
      keys.current.add(e.code);
    };
    const ku = (e) => keys.current.delete(e.code);
    const bl = () => keys.current.clear();
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    window.addEventListener('blur', bl);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); window.removeEventListener('blur', bl); };
  }, []);

  const startMap = (m) => {
    H.current = { undo: [], redo: [] };
    setHv((n) => n + 1);
    S.current.cur = m;
    setCur(m);
    setSel(-1);
    setNaming(false);
    setAskDel(null);
    camR.current = { ...CAM0 };
    setSheet(null);
    poke();
  };
  const nextName = () => { const names = new Set(mapsRef.current.map((r) => r.f && r.f.name)); let n = mapsRef.current.length + 1; while (names.has(`Map ${n}`)) n++; return `Map ${n}`; };
  const openRec = (r) => { const m = mapFromFile(r.f); if (!m) { say('This map could not be opened'); return; } startMap({ id: r.id, ...m }); };
  const importFile = (file) => {
    if (!file) return;
    if (file.size > 3e6) { say('This file is too big to be a map'); return; }
    const rd = new FileReader();
    rd.onload = () => {
      let m = null;
      try { m = mapFromFile(JSON.parse(String(rd.result || ''))); } catch {}
      if (!m) { say('This file is not a map'); return; }
      const nm = { id: newId(), ...m };
      persist(nm);
      startMap(nm);
    };
    rd.onerror = () => say('This file could not be read');
    rd.readAsText(file);
  };
  const delRec = (id) => {
    const next = mapsRef.current.filter((r) => r.id !== id);
    mapsRef.current = next;
    setMaps(next);
    writeMaps(next);
    setAskDel(null);
    if (S.current.cur && S.current.cur.id === id) { S.current.cur = null; setCur(null); setSel(-1); }
  };
  const leave = () => { if (S.current.cur) persist(S.current.cur); onClose(); };
  const rename = (v) => {
    const n = String(v || '').trim().slice(0, 40);
    setNaming(false);
    const c = S.current.cur;
    if (!c || !n || n === c.name) return;
    const nx = { ...c, name: n };
    S.current.cur = nx;
    setCur(nx);
  };
  const setForest = (m) => {
    const c = S.current.cur;
    setForestMenu(false);
    if (!c || (c.forest | 0) === m) return;
    let parts = c.parts.filter((q) => !q.f);
    if (m === 2) parts = [...parts, ...forestParts()];
    const nx = { ...c, forest: m, parts };
    S.current.cur = nx;
    H.current = { undo: [], redo: [] };
    setHv((n) => n + 1);
    setCur(nx);
    setSel(-1);
    poke();
    say(m === 2 ? 'Every tree in the town can now be moved, turned or deleted' : m === 1 ? 'Trees are back to the normal forest' : 'Trees removed');
  };
  const fileOf = () => {
    const c = S.current.cur;
    const text = JSON.stringify(mapToFile(c));
    const base = String(c.name || 'Map').replace(/[\\/:*?"<>|.]+/g, ' ').replace(/\s+/g, ' ').trim() || 'Map';
    return { text, name: `${base}.json` };
  };
  const saveFile = () => {
    const { text, name } = fileOf();
    try {
      const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url; a.download = name; a.rel = 'noopener';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      say('Map file saved');
    } catch { say('Saving did not work here. Try Copy map code.'); }
  };
  const canShare = (() => { try { return !!(navigator.canShare && navigator.canShare({ files: [new File(['{}'], 'map.json', { type: 'application/json' })] })); } catch { return false; } })();
  const shareFile = async () => {
    const { text, name } = fileOf();
    try { await navigator.share({ files: [new File([text], name, { type: 'application/json' })], title: S.current.cur.name }); } catch (e) { if (!e || e.name !== 'AbortError') saveFile(); }
  };
  const copyCode = async () => {
    const { text } = fileOf();
    try { await navigator.clipboard.writeText(text); say('Map code copied'); } catch { say('Copy did not work here. Save the map file instead.'); }
  };
  const hideTip = () => { setTip(false); try { localStorage.setItem(TIP, '1'); } catch {} };

  const E = ER.current;
  const W8 = cur && load.ready && E ? mapWeight(cur.parts, E.M) : null;
  const wCol = !W8 ? MUTED : W8.k <= 0.85 ? GREEN : W8.k <= 1 ? AMBER : RED;
  const wTxt = !W8 ? '' : W8.k <= 0.85 ? 'Phones will run this map well.' : W8.k <= 1 ? 'Getting heavy. Older phones may slow down.' : 'Too heavy for phones. Remove some parts.';
  const count = (id) => (cur ? cur.parts.filter((p) => p.id === id).length : 0);
  const sp = cur && sel >= 0 ? cur.parts[sel] : null;
  const spInfo = sp ? PART_BY[sp.id] : null;
  const canUndo = H.current.undo.length > 0, canRedo = H.current.redo.length > 0;
  const trayH = tray ? u(128) : u(48);

  const checks = cur ? [
    ['Player starts', count('@p'), count('@p') >= 1, 'Add at least 1'],
    ['Zombie spawns', count('@z'), count('@z') >= 4, 'Add at least 4'],
    ['Boss spawn', count('@b'), count('@b') === 1, 'Add 1'],
  ] : [];

  return (
    <div ref={stageRef} onPointerDown={onDown} onContextMenu={(e) => e.preventDefault()} style={{ position: 'absolute', inset: 0, zIndex: 40, overflow: 'hidden', background: '#0E0D0B', fontFamily: FONT, color: CREAM, touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}>
      <canvas key={cvKey} ref={cvRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />

      {cur && load.ready && (
        <div onPointerDown={(e) => e.stopPropagation()} style={{ position: 'absolute', top: top(8), left: left(10), right: right(10), display: 'flex', alignItems: 'center', gap: u(6) }}>
          <Btn u={u} icon="close" label="Leave map maker" onPress={leave} />
          <Btn u={u} icon="maps" label="Your maps" onPress={() => { setSel(-1); setSheet('maps'); }} />
          {naming ? (
            <input ref={nameRef} defaultValue={cur.name} maxLength={40} autoFocus aria-label="Map name" onBlur={(e) => rename(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') setNaming(false); }}
              style={{ height: u(36), width: u(190), minWidth: 0, padding: `0 ${u(10)}px`, border: 'none', outline: `1.5px solid ${AMBER}`, background: SHEET, color: CREAM, fontFamily: CFONT, fontSize: u(16), fontWeight: 800 }} />
          ) : (
            <button type="button" aria-label={`Rename ${cur.name}`} onClick={() => setNaming(true)}
              style={{ height: u(36), minWidth: 0, maxWidth: u(230), display: 'flex', alignItems: 'center', gap: u(7), padding: `0 ${u(11)}px`, border: 'none', cursor: 'pointer', background: PANEL, boxShadow: `inset 0 0 0 1px ${LINE}`, clipPath: cut(u(7)), color: CREAM }}>
              <span style={{ fontFamily: CFONT, fontSize: u(16), fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cur.name}</span>
              <Ic k="pen" s={u(14)} c={MUTED} />
            </button>
          )}
          <div style={{ flex: 1 }} />
          <Btn u={u} icon="undo" label="Undo" disabled={!canUndo} onPress={undo} />
          <Btn u={u} icon="redo" label="Redo" disabled={!canRedo} onPress={redo} />
          <Btn u={u} icon="grid" label="Snap to grid" on={snap} onPress={() => setSnap((v) => !v)} />
          <Btn u={u} icon="tree" label="Trees" on={!!cur.forest} onPress={() => { setWInfo(false); setForestMenu((v) => !v); }} />
          <button type="button" aria-label="Map weight" onClick={() => { setForestMenu(false); setWInfo((v) => !v); }}
            style={{ height: u(36), display: 'flex', alignItems: 'center', gap: u(7), padding: `0 ${u(10)}px`, border: 'none', cursor: 'pointer', background: PANEL, boxShadow: `inset 0 0 0 1px ${LINE}`, clipPath: cut(u(7)), color: CREAM }}>
            <span style={{ fontSize: u(11.5), fontWeight: 800, color: MUTED }}>Weight</span>
            <span aria-hidden="true" style={{ width: u(46), height: u(6), background: 'rgba(239,232,210,0.12)', overflow: 'hidden' }}>
              <span style={{ display: 'block', height: '100%', width: `${W8 ? Math.min(100, (W8.k / 1.25) * 100) : 0}%`, background: wCol }} />
            </span>
            <span style={{ fontFamily: CFONT, fontSize: u(14), fontWeight: 800, color: wCol, minWidth: u(34), textAlign: 'right' }}>{W8 ? `${Math.round(W8.k * 100)}%` : ''}</span>
          </button>
          <Btn u={u} icon="send" text="Send" tone="amber" label="Send your map" onPress={() => { setSel(-1); setSheet('send'); }} />
        </div>
      )}

      {cur && load.ready && forestMenu && (
        <div onPointerDown={(e) => e.stopPropagation()} style={{ position: 'absolute', top: `calc(${top(8)} + ${u(44)}px)`, right: `calc(${right(10)} + ${u(170)}px)`, width: u(230), padding: u(8), background: SHEET, boxShadow: `inset 0 0 0 1px ${LINE}`, clipPath: cut(u(9)), display: 'flex', flexDirection: 'column', gap: u(5) }}>
          {[[1, 'Normal forest', 'Trees grow on their own'], [2, 'Move trees myself', 'Pick, move or delete any tree'], [0, 'No trees', 'Only what you place']].map(([m, t, sub]) => (
            <button key={m} type="button" onClick={() => setForest(m)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: u(1), padding: `${u(7)}px ${u(9)}px`, border: 'none', cursor: 'pointer', background: (cur.forest | 0) === m ? 'rgba(224,168,90,0.18)' : 'rgba(239,232,210,0.05)', boxShadow: `inset 0 0 0 1px ${(cur.forest | 0) === m ? AMBER : LINE}`, clipPath: cut(u(6)), color: CREAM, textAlign: 'left' }}>
              <span style={{ fontFamily: CFONT, fontSize: u(15), fontWeight: 800, color: (cur.forest | 0) === m ? AMBER : CREAM }}>{t}</span>
              <span style={{ fontSize: u(11), fontWeight: 700, color: MUTED }}>{sub}</span>
            </button>
          ))}
        </div>
      )}

      {cur && load.ready && wInfo && W8 && (
        <div onPointerDown={(e) => e.stopPropagation()} style={{ position: 'absolute', top: `calc(${top(8)} + ${u(44)}px)`, right: `calc(${right(10)} + ${u(80)}px)`, width: u(250), padding: `${u(10)}px ${u(12)}px`, background: SHEET, boxShadow: `inset 0 0 0 1px ${LINE}`, clipPath: cut(u(9)), display: 'flex', flexDirection: 'column', gap: u(4) }}>
          <span style={{ fontFamily: CFONT, fontSize: u(15), fontWeight: 800, color: wCol }}>{wTxt}</span>
          <span style={{ fontSize: u(12), fontWeight: 700, color: MUTED }}>{`${W8.n} parts. Pine Creek is about 80%.`}</span>
        </div>
      )}

      {cur && load.ready && tip && !sheet && (
        <div onPointerDown={(e) => e.stopPropagation()} style={{ position: 'absolute', top: `calc(${top(8)} + ${u(46)}px)`, left: '50%', transform: 'translateX(-50%)', width: `min(${u(420)}px, 70%)`, padding: `${u(10)}px ${u(12)}px`, background: SHEET, boxShadow: `inset 0 0 0 1px ${LINE}`, clipPath: cut(u(10)), display: 'flex', alignItems: 'center', gap: u(12) }}>
          <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: u(3), fontSize: u(12.5), fontWeight: 700, lineHeight: 1.35 }}>
            {TOUCH ? (
              <>
                <span>Drag to move around. Pinch to zoom, twist two fingers to turn.</span>
                <span style={{ color: MUTED }}>Tap a part to pick it. Hold a part to drag it.</span>
              </>
            ) : (
              <>
                <span>Drag to move around. Scroll to zoom. Right drag to turn.</span>
                <span style={{ color: MUTED }}>Click a part to pick it, then drag it. R turns it, Delete removes it.</span>
              </>
            )}
          </span>
          <Btn u={u} text="Got it" label="Got it" onPress={hideTip} />
        </div>
      )}

      {cur && load.ready && sp && spInfo && !sheet && (
        <div style={{ position: 'absolute', top: `calc(${top(8)} + ${u(50)}px)`, bottom: `calc(${bottom(8)} + ${trayH}px)`, right: right(10), display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
          <div onPointerDown={(e) => e.stopPropagation()} style={{ pointerEvents: 'auto', padding: u(8), background: PANEL, boxShadow: `inset 0 0 0 1px ${LINE}`, clipPath: cut(u(10)), display: 'flex', flexDirection: 'column', gap: u(6) }}>
            <span style={{ display: 'flex', flexDirection: 'column', padding: `0 ${u(2)}px`, maxWidth: u(3 * 40 + 12) }}>
              <span style={{ fontFamily: CFONT, fontSize: u(15), fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{spInfo.n}</span>
              {!isMark(sp.id) && <span style={{ fontSize: u(11), fontWeight: 700, color: MUTED, whiteSpace: 'nowrap' }}>{`${Math.round(sp.yaw)}°, size ${sp.s.toFixed(2)}${sp.dy ? `, up ${sp.dy.toFixed(2)} m` : ''}`}</span>}
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(3, ${u(40)}px)`, gap: u(6) }}>
              {!isMark(sp.id) && (
                <>
                  <Btn u={u} size={40} icon="rotL" label="Turn left" onHold={turn(-1)} />
                  <Btn u={u} size={40} icon="rotR" label="Turn right" onHold={turn(1)} />
                  <Btn u={u} size={40} icon="copy" label="Copy" onPress={copySel} />
                  <Btn u={u} size={40} icon="minus" label="Smaller" onHold={size(-1)} />
                  <Btn u={u} size={40} icon="plus" label="Bigger" onHold={size(1)} />
                  <Btn u={u} size={40} icon="trash" label="Delete" tone="red" onPress={delSel} />
                  <Btn u={u} size={40} icon="down" label="Lower" onHold={lift(-1)} />
                  <Btn u={u} size={40} icon="up" label="Raise" onHold={lift(1)} />
                </>
              )}
              {isMark(sp.id) && (
                <>
                  <Btn u={u} size={40} icon="copy" label="Copy" onPress={copySel} disabled={sp.id === '@b'} />
                  <Btn u={u} size={40} icon="trash" label="Delete" tone="red" onPress={delSel} />
                </>
              )}
              <Btn u={u} size={40} icon="check" label="Done" on onPress={() => setSel(-1)} />
            </div>
          </div>
        </div>
      )}

      {cur && load.ready && !sheet && (tray ? (
        <div onPointerDown={(e) => e.stopPropagation()} style={{ position: 'absolute', left: left(10), right: right(10), bottom: bottom(8), display: 'flex', flexDirection: 'column', gap: u(5) }}>
          <div role="tablist" aria-label="Parts" style={{ display: 'flex', alignItems: 'center', gap: u(4), minWidth: 0 }}>
            <div style={{ display: 'flex', gap: u(4), overflowX: 'auto', minWidth: 0, touchAction: 'pan-x', scrollbarWidth: 'none' }}>
              {MAP_CATS.map(([kk, n]) => (
                <button key={kk} type="button" role="tab" aria-selected={cat === kk} onClick={() => setCat(kk)}
                  style={{ flexShrink: 0, height: u(30), padding: `0 ${u(12)}px`, border: 'none', cursor: 'pointer', background: cat === kk ? 'rgba(224,168,90,0.2)' : PANEL, boxShadow: `inset 0 0 0 1px ${cat === kk ? AMBER : LINE}`, clipPath: cut(u(6)), color: cat === kk ? AMBER : CREAM, fontFamily: CFONT, fontSize: u(14), fontWeight: 800, touchAction: 'pan-x' }}>{n}</button>
              ))}
            </div>
            <div style={{ flex: 1 }} />
            <Btn u={u} size={30} icon="hide" label="Hide parts" onPress={() => setTray(false)} />
          </div>
          <div style={{ display: 'flex', gap: u(6), overflowX: 'auto', paddingBottom: u(2), touchAction: 'pan-x', scrollbarWidth: 'none' }}>
            {MAP_PARTS.filter((p) => p.cat === cat).map((p) => <Tile key={p.id} u={u} p={PART_BY[p.id]} atlas={atlas} onPress={addPart} />)}
          </div>
        </div>
      ) : (
        <div onPointerDown={(e) => e.stopPropagation()} style={{ position: 'absolute', left: left(10), bottom: bottom(8) }}>
          <Btn u={u} icon="show" text="Parts" label="Show parts" onPress={() => setTray(true)} />
        </div>
      ))}

      {!load.ready && !load.err && (
        <div role="status" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: u(10), background: 'rgba(10,9,8,0.9)', pointerEvents: 'none' }}>
          <span style={{ fontFamily: CFONT, fontSize: u(18), fontWeight: 800 }}>Loading the town</span>
          <span aria-hidden="true" style={{ width: u(220), height: u(6), background: 'rgba(239,232,210,0.12)' }}><span style={{ display: 'block', height: '100%', width: `${Math.round(load.p * 100)}%`, background: AMBER, transition: 'width 0.2s' }} /></span>
        </div>
      )}
      {(load.err || lost) && (
        <div onPointerDown={(e) => e.stopPropagation()} style={{ position: 'absolute', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: u(12), background: 'rgba(10,9,8,0.92)' }}>
          <span style={{ fontFamily: CFONT, fontSize: u(18), fontWeight: 800, textAlign: 'center', maxWidth: u(360) }}>{load.err === 'gl' ? 'This phone could not start 3D graphics.' : lost ? 'The graphics stopped.' : 'The town could not load.'}</span>
          <div style={{ display: 'flex', gap: u(8) }}>
            {load.err !== 'gl' && <Btn u={u} text="Try again" tone="amber" label="Try again" onPress={() => { setLost(false); setLoad({ p: 0, ready: false, err: null }); setCvKey((n) => n + 1); }} />}
            <Btn u={u} text="Back" label="Back" onPress={leave} />
          </div>
        </div>
      )}

      {sheet === 'maps' && (
        <div onPointerDown={(e) => e.stopPropagation()} style={{ position: 'absolute', inset: 0, zIndex: 45, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(8,7,6,0.72)', padding: `${top(10)} ${right(12)} ${bottom(10)} ${left(12)}` }}>
          <div style={{ width: `min(${u(600)}px, 100%)`, maxHeight: '100%', display: 'flex', flexDirection: 'column', gap: u(10), padding: u(14), background: SHEET, boxShadow: `inset 0 0 0 1px ${LINE}`, clipPath: cut(u(14)), boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: u(10) }}>
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: u(3) }}>
                <span style={{ fontFamily: CFONT, fontSize: u(24), fontWeight: 800, color: AMBER, lineHeight: 1 }}>Map maker</span>
                <span style={{ fontSize: u(12.5), fontWeight: 700, color: MUTED, lineHeight: 1.35 }}>Only you can see this. Build a map, then send it to Claude to add it to the game for everyone.</span>
              </span>
              <Btn u={u} icon="close" label={cur ? 'Back to the map' : 'Leave map maker'} onPress={() => { if (cur) setSheet(null); else leave(); }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: u(8) }}>
              {[
                ['plusBox', 'New map', 'Empty ground with roads', () => startMap({ id: newId(), ...emptyMap(nextName()) })],
                ['town', 'Copy Pine Creek', 'Start from the town', () => startMap({ id: newId(), ...pineCreek() })],
                ['open', 'Open a file', 'A map file you saved', () => fileRef.current && fileRef.current.click()],
              ].map(([ic, t, s, fn]) => (
                <button key={t} type="button" onClick={fn}
                  style={{ minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: u(6), padding: u(10), border: 'none', cursor: 'pointer', background: 'rgba(239,232,210,0.06)', boxShadow: `inset 0 0 0 1px ${LINE}`, clipPath: cut(u(9)), color: CREAM, textAlign: 'left' }}>
                  <Ic k={ic} s={u(24)} c={AMBER} />
                  <span style={{ fontFamily: CFONT, fontSize: u(16), fontWeight: 800, lineHeight: 1.05 }}>{t}</span>
                  <span style={{ fontSize: u(11.5), fontWeight: 700, color: MUTED, lineHeight: 1.25 }}>{s}</span>
                </button>
              ))}
            </div>
            <input ref={fileRef} type="file" accept=".json,.zmap,application/json,text/plain" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files && e.target.files[0]; e.target.value = ''; importFile(f); }} />
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
              <span style={{ fontFamily: CFONT, fontSize: u(15), fontWeight: 800, marginBottom: u(4) }}>Your maps</span>
              {maps.length === 0 ? (
                <span style={{ fontSize: u(12.5), fontWeight: 700, color: MUTED, padding: `${u(6)}px 0` }}>No maps yet. Start a new one above.</span>
              ) : (
                <div style={{ overflowY: 'auto', minHeight: 0, maxHeight: u(150), touchAction: 'pan-y', display: 'flex', flexDirection: 'column' }}>
                  {maps.map((r) => {
                    const f = r.f || {};
                    const n = (f.parts ? f.parts.length : 0);
                    const isCur = cur && cur.id === r.id;
                    return (
                      <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: u(8), padding: `${u(5)}px 0`, borderTop: `1px solid ${LINE}` }}>
                        <button type="button" onClick={() => { if (isCur) setSheet(null); else openRec(r); }}
                          style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: u(1), padding: `${u(3)}px 0`, border: 'none', background: 'transparent', cursor: 'pointer', color: CREAM, textAlign: 'left' }}>
                          <span style={{ fontFamily: CFONT, fontSize: u(15), fontWeight: 800, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name || 'Map'}{isCur ? <span style={{ color: AMBER, fontFamily: FONT, fontSize: u(11), fontWeight: 800 }}>{'  Open now'}</span> : null}</span>
                          <span style={{ fontSize: u(11.5), fontWeight: 700, color: MUTED }}>{`${n} parts, ${ago(r.t)}`}</span>
                        </button>
                        {askDel === r.id ? (
                          <>
                            <Btn u={u} size={32} text="Delete" tone="red" label={`Delete ${f.name || 'map'}`} onPress={() => delRec(r.id)} />
                            <Btn u={u} size={32} text="Keep" label="Keep it" onPress={() => setAskDel(null)} />
                          </>
                        ) : (
                          <Btn u={u} size={32} icon="trash" label={`Delete ${f.name || 'map'}`} onPress={() => setAskDel(r.id)} />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {sheet === 'send' && cur && (
        <div onPointerDown={(e) => e.stopPropagation()} style={{ position: 'absolute', inset: 0, zIndex: 45, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(8,7,6,0.72)', padding: `${top(10)} ${right(12)} ${bottom(10)} ${left(12)}` }}>
          <div style={{ width: `min(${u(460)}px, 100%)`, maxHeight: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: u(10), padding: u(14), background: SHEET, boxShadow: `inset 0 0 0 1px ${LINE}`, clipPath: cut(u(14)), boxSizing: 'border-box', touchAction: 'pan-y' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: u(10) }}>
              <span style={{ flex: 1, minWidth: 0, fontFamily: CFONT, fontSize: u(22), fontWeight: 800, color: AMBER, lineHeight: 1 }}>Send your map</span>
              <Btn u={u} icon="close" label="Back to the map" onPress={() => setSheet(null)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {checks.map(([t, n, ok, fix]) => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: u(8), padding: `${u(6)}px 0`, borderTop: `1px solid ${LINE}` }}>
                  <Ic k={ok ? 'check' : 'close'} s={u(17)} c={ok ? GREEN : RED} w={2.2} />
                  <span style={{ flex: 1, fontSize: u(13.5), fontWeight: 800 }}>{t}</span>
                  <span style={{ fontSize: u(12.5), fontWeight: 700, color: ok ? MUTED : RED }}>{ok ? String(n) : `${n}. ${fix}`}</span>
                </div>
              ))}
              {W8 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: u(8), padding: `${u(6)}px 0`, borderTop: `1px solid ${LINE}` }}>
                  <Ic k={W8.k <= 1 ? 'check' : 'close'} s={u(17)} c={wCol} w={2.2} />
                  <span style={{ flex: 1, fontSize: u(13.5), fontWeight: 800 }}>Weight</span>
                  <span style={{ fontSize: u(12.5), fontWeight: 700, color: W8.k <= 1 ? MUTED : RED }}>{`${Math.round(W8.k * 100)}%`}</span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: u(8) }}>
              {canShare && <Btn u={u} icon="share" text="Share map file" tone="amber" wide label="Share map file" onPress={shareFile} />}
              <Btn u={u} icon="save" text="Save map file" tone={canShare ? undefined : 'amber'} wide label="Save map file" onPress={saveFile} />
              <Btn u={u} icon="code" text="Copy map code" wide label="Copy map code" onPress={copyCode} />
            </div>
            <span style={{ fontSize: u(12.5), fontWeight: 700, color: MUTED, lineHeight: 1.4 }}>Then send the file to Claude in your chat. Claude fixes the zombie paths and adds your map to the game.</span>
          </div>
        </div>
      )}

      {toast && (
        <div role="status" style={{ position: 'absolute', left: '50%', bottom: `calc(${bottom(8)} + ${trayH + u(10)}px)`, transform: 'translateX(-50%)', zIndex: 60, maxWidth: '80%', padding: `${u(8)}px ${u(14)}px`, background: SHEET, boxShadow: `inset 0 0 0 1px ${LINE}`, clipPath: cut(u(8)), fontSize: u(13), fontWeight: 800, textAlign: 'center', pointerEvents: 'none' }}>{toast.t}</div>
      )}
    </div>
  );
}
