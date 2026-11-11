import React, { useEffect, useRef, useState } from 'react';
import { useBackClose, FONT, hapticTap, playUiSound, applyPhotoFilter, photoFilterCss, FilterFx, paintFilterFx, PHOTO_FILTERS, Spinner, playSong, stopSong, MusicPicker } from '../App.jsx';

import { LENSES, BIG_EYES, lensThumb, loadFace, loadSeg, faceReady, segReady, detectFaces, segmentInto, coverBox, mapper, geomOf, smoothGeom, drawLens, drawBigEyes } from './snaplens.js';

const MAX_MS = 60000;
const ITEM = 60, GAP = 14;
const CTX_FILTER = typeof document !== 'undefined' && (() => { try { const c = document.createElement('canvas').getContext('2d'); return !!c && 'filter' in c; } catch { return false; } })();
const BGS = [
  { k: 'none', name: 'No background' },
  { k: 'blur', name: 'Blur', fx: 'blur(1.4px)' },
  { k: 'blur2', name: 'Strong blur', fx: 'blur(3px)' },
  { k: 'mono', name: 'Black and white', fx: 'grayscale(1)' },
  { k: 'dim', name: 'Dim', fx: 'brightness(0.45)' },
  { k: 'photo', name: 'Your photo' },
];
const MID = { x: 0.5, y: 0.5 };
const NIGHT_CSS = 'brightness(1.4) contrast(1.06) saturate(1.08)';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const canvasOf = (cache, key, w, h) => {
  let c = cache[key];
  if (!c) { c = document.createElement('canvas'); cache[key] = c; }
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  return c;
};
function photoCanvas(img) {
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  const k = Math.min(1, 1280 / Math.max(iw, ih));
  const c = document.createElement('canvas'); c.width = Math.max(2, Math.round(iw * k)); c.height = Math.max(2, Math.round(ih * k));
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return c;
}
function drawCover(ctx, img, W, H) {
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;
  const s = Math.max(W / iw, H / ih), dw = iw * s, dh = ih * s;
  ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
}
function blurInto(ctx, src, W, H, cache, strong) {
  if (CTX_FILTER) {
    const h = canvasOf(cache, 'bh', Math.max(8, Math.round(W / 3)), Math.max(8, Math.round(H / 3)));
    const hx = h.getContext('2d');
    hx.filter = `blur(${Math.max(2, Math.round(h.width / (strong ? 14 : 30)))}px)`;
    hx.drawImage(src, 0, 0, h.width, h.height);
    hx.filter = 'none';
    ctx.save(); ctx.imageSmoothingEnabled = true; ctx.drawImage(h, 0, 0, W, H); ctx.restore();
    return;
  }
  let cur = src, w = W, h = H;
  for (let i = 0; i < (strong ? 5 : 4); i++) {
    w = Math.max(4, Math.round(w / 2)); h = Math.max(4, Math.round(h / 2));
    const c = canvasOf(cache, `m${i}`, w, h);
    c.getContext('2d').drawImage(cur, 0, 0, w, h);
    cur = c;
  }
  const up = canvasOf(cache, 'mu', Math.max(8, Math.round(W / 4)), Math.max(8, Math.round(H / 4)));
  up.getContext('2d').drawImage(cur, 0, 0, up.width, up.height);
  ctx.save(); ctx.imageSmoothingEnabled = true; ctx.drawImage(up, 0, 0, W, H); ctx.restore();
}
function toScreen(G, p) {
  const k = G.ed / 100, c = Math.cos(G.roll), n = Math.sin(G.roll);
  return { x: G.o.x + (p.x * c - p.y * n) * k, y: G.o.y + (p.x * n + p.y * c) * k };
}
function beautyPass(ctx, W, H, geoms, amt, cache) {
  const hw = Math.max(8, Math.round(W / 2)), hh = Math.max(8, Math.round(H / 2));
  const sm = canvasOf(cache, 'bsm', Math.max(8, Math.round(W / 5)), Math.max(8, Math.round(H / 5)));
  sm.getContext('2d').drawImage(ctx.canvas, 0, 0, sm.width, sm.height);
  const mk = canvasOf(cache, 'bmk', hw, hh);
  const mx = mk.getContext('2d');
  mx.setTransform(1, 0, 0, 1, 0, 0);
  mx.globalCompositeOperation = 'source-over';
  mx.clearRect(0, 0, hw, hh);
  for (const G of geoms) {
    const k = G.ed / 100;
    const c = toScreen(G, { x: 0, y: (G.top.y + G.chin.y) / 2 });
    const rx = Math.max(10, ((G.edgeR.x - G.edgeL.x) / 2) * k * 1.02), ry = Math.max(14, (G.faceH / 2) * k * 1.04);
    mx.setTransform(Math.cos(G.roll) * rx / 2, Math.sin(G.roll) * rx / 2, -Math.sin(G.roll) * ry / 2, Math.cos(G.roll) * ry / 2, c.x / 2, c.y / 2);
    const g = mx.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.62, 'rgba(0,0,0,0.92)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    mx.fillStyle = g; mx.beginPath(); mx.arc(0, 0, 1, 0, Math.PI * 2); mx.fill();
    mx.setTransform(1, 0, 0, 1, 0, 0);
    mx.globalCompositeOperation = 'destination-out';
    const hole = (p, rx2, ry2) => {
      mx.setTransform(Math.cos(G.roll) * rx2 / 2, Math.sin(G.roll) * rx2 / 2, -Math.sin(G.roll) * ry2 / 2, Math.cos(G.roll) * ry2 / 2, p.x / 2, p.y / 2);
      const q = mx.createRadialGradient(0, 0, 0, 0, 0, 1);
      q.addColorStop(0, 'rgba(0,0,0,1)'); q.addColorStop(0.55, 'rgba(0,0,0,0.85)'); q.addColorStop(1, 'rgba(0,0,0,0)');
      mx.fillStyle = q; mx.beginPath(); mx.arc(0, 0, 1, 0, Math.PI * 2); mx.fill();
    };
    hole(G.sl, G.ed * 0.34, G.ed * 0.22);
    hole(G.sr, G.ed * 0.34, G.ed * 0.22);
    hole(toScreen(G, G.mouth), G.ed * 0.42, G.ed * (0.2 + G.open * 0.25));
    mx.setTransform(1, 0, 0, 1, 0, 0);
    mx.globalCompositeOperation = 'source-over';
  }
  const ly = canvasOf(cache, 'bly', hw, hh);
  const lx = ly.getContext('2d');
  lx.globalCompositeOperation = 'source-over';
  lx.clearRect(0, 0, hw, hh);
  lx.imageSmoothingEnabled = true;
  lx.drawImage(sm, 0, 0, hw, hh);
  lx.globalCompositeOperation = 'screen';
  lx.fillStyle = 'rgba(255,228,214,0.14)';
  lx.fillRect(0, 0, hw, hh);
  lx.globalCompositeOperation = 'destination-in';
  lx.drawImage(mk, 0, 0);
  lx.globalCompositeOperation = 'source-over';
  ctx.save();
  ctx.globalAlpha = Math.min(1, 0.72 * amt);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(ly, 0, 0, W, H);
  ctx.restore();
}
function composeFrame(ctx, W, H, F, cache, smooth) {
  const v = F.v;
  const vw = v && v.videoWidth, vh = v && v.videoHeight;
  if (!vw || !vh) return [];
  const B = coverBox(vw, vh, W, H, F.zoom);
  const drawV = (c) => { c.save(); if (F.mirror) { c.translate(W, 0); c.scale(-1, 1); } c.drawImage(v, B.dx, B.dy, B.dw, B.dh); c.restore(); };
  const useBg = F.bg !== 'none' && F.mask && F.mask.cv;
  if (useBg) {
    const Fc = canvasOf(cache, 'frame', W, H);
    const fx = Fc.getContext('2d');
    fx.clearRect(0, 0, W, H); drawV(fx);
    if (F.bg === 'blur' || F.bg === 'blur2') blurInto(ctx, Fc, W, H, cache, F.bg === 'blur2');
    else if (F.bg === 'mono' || F.bg === 'dim') {
      ctx.drawImage(Fc, 0, 0);
      ctx.save();
      if (F.bg === 'mono') { ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = '#808080'; } else ctx.fillStyle = 'rgba(0,0,0,0.58)';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    } else if (F.bgImg && (F.bgImg.naturalWidth || F.bgImg.width)) drawCover(ctx, F.bgImg, W, H);
    else { ctx.fillStyle = '#1A1A1E'; ctx.fillRect(0, 0, W, H); }
    const Pc = canvasOf(cache, 'person', W, H);
    const px = Pc.getContext('2d');
    px.globalCompositeOperation = 'source-over';
    px.clearRect(0, 0, W, H); px.drawImage(Fc, 0, 0);
    px.globalCompositeOperation = 'destination-in';
    px.save(); if (F.mirror) { px.translate(W, 0); px.scale(-1, 1); } px.imageSmoothingEnabled = true; px.drawImage(F.mask.cv, B.dx, B.dy, B.dw, B.dh); px.restore();
    px.globalCompositeOperation = 'source-over';
    ctx.drawImage(Pc, 0, 0);
  } else drawV(ctx);
  const P = mapper(B, F.mirror, W);
  const geoms = (F.raw || []).map((lm, i) => {
    const at = typeof lm === 'function' ? lm : (idx) => lm[idx] || lm[1] || MID;
    const g = geomOf((idx) => P(at(idx) || MID), F.jaw ? F.jaw[i] : null);
    if (!smooth) return g;
    const s = smoothGeom(cache.prev && cache.prev[i], g, 0.55);
    (cache.prev || (cache.prev = []))[i] = s;
    return s;
  });
  if (F.beauty > 0.01 && geoms.length) beautyPass(ctx, W, H, geoms, F.beauty, cache);
  if (F.lens && F.lens !== 'none') for (const G of geoms) { if (F.lens === BIG_EYES) drawBigEyes(ctx, G, ctx.canvas, cache); else drawLens(ctx, F.lens, G, F.t); }
  return geoms;
}
function brighten(ctx, W, H, k) {
  let img;
  try { img = ctx.getImageData(0, 0, W, H); } catch { return; }
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) { d[i] = d[i] * k + 6; d[i + 1] = d[i + 1] * k + 6; d[i + 2] = d[i + 2] * k + 6; }
  ctx.putImageData(img, 0, 0);
}

const IC = {
  flip: 'M4 8.5h11.5l-3-3M20 15.5H8.5l3 3M19.5 8.5a7.8 7.8 0 0 0-1.1-1.7M4.5 15.5c.3.6.7 1.2 1.1 1.7',
  flash: 'M13 2.5L5.5 13.5h5.2l-1.2 8 7.8-11h-5.3z',
  flashoff: 'M13 2.5L5.5 13.5h5.2l-1.2 8 7.8-11h-5.3zM3.5 3.5l17 17',
  timer: 'M12 7.5v5l3 2M9.5 2.5h5M12 4.8a8.2 8.2 0 1 0 0 16.4 8.2 8.2 0 0 0 0-16.4z',
  night: 'M20 14.5A8 8 0 1 1 9.5 4a6.4 6.4 0 0 0 10.5 10.5z',
  grid: 'M3.5 3.5h17v17h-17zM9.2 3.5v17M14.8 3.5v17M3.5 9.2h17M3.5 14.8h17',
  beauty: 'M12 3.5l1.6 4.4 4.4 1.6-4.4 1.6L12 15.5l-1.6-4.4L6 9.5l4.4-1.6zM18.5 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z',
  music: 'M9 18V5.5l11-2v13M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3zM20 16.5a3 3 0 1 1-3-3 3 3 0 0 1 3 3z',
  close: 'M6 6l12 12M18 6L6 18',
  gallery: 'M4 5.5h16v13H4zM4 15.5l4.5-4.5 4 4 2.5-2.5 5 5M15.5 9.5a1.2 1.2 0 1 0 0-.01',
  lock: 'M7 11h10v9H7zM9 11V8a3 3 0 0 1 6 0v3',
  none: 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM6 6l12 12',
  blur: 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM8 9.5h.01M12 8h.01M16 9.5h.01M8 14.5h.01M12 16h.01M16 14.5h.01M12 12h.01',
  photo: 'M4 5.5h16v13H4zM4 15.5l4.5-4.5 4 4 2.5-2.5 5 5',
};
function CamIcon({ k, size = 22, stroke = 2, color = '#FFFFFF', fill }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ display: 'block', overflow: 'visible', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.45))' }}>
      <path d={IC[k] || IC.none} fill={fill || 'none'} stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function RailBtn({ k, label, on, badge, onPress, fill }) {
  return (
    <div role="button" aria-label={label} aria-pressed={on || undefined} onClick={(e) => { e.stopPropagation(); hapticTap(); onPress(); }}
      style={{ position: 'relative', width: 42, height: 42, borderRadius: 21, background: on ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
      <CamIcon k={k} size={21} color={on ? '#111114' : '#FFFFFF'} fill={fill ? (on ? '#111114' : '#FFFFFF') : undefined} />
      {badge && <span style={{ position: 'absolute', right: -3, bottom: -3, minWidth: 17, height: 17, padding: '0 4px', borderRadius: 9, background: '#FFFFFF', color: '#111114', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', boxShadow: '0 1px 3px rgba(0,0,0,0.35)' }}>{badge}</span>}
    </div>
  );
}

export function SnapCamera({ onClose, onCapture, onPickGallery, startMode = 'photo', songs = false, country }) {
  useBackClose(true, onClose);
  const [mode, setMode] = useState(startMode === 'dual' ? 'dual' : startMode === 'boomerang' ? 'boomerang' : 'photo');
  const [facing, setFacing] = useState(() => {
    if (startMode === 'dual') return 'environment';
    try { const f = localStorage.getItem('zchat-cam-facing'); if (f === 'user' || f === 'environment') return f; } catch {}
    return songs ? 'user' : 'environment';
  });
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [rec, setRec] = useState(false);
  const [locked, setLocked] = useState(false);
  const [holding, setHolding] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [making, setMaking] = useState('');
  const [tray, setTray] = useState('lenses');
  const [lens, setLens] = useState('none');
  const [filter, setFilter] = useState('none');
  const [bg, setBg] = useState('none');
  const [flash, setFlash] = useState('off');
  const [timer, setTimer] = useState(0);
  const [night, setNight] = useState(false);
  const [grid, setGrid] = useState(false);
  const [beauty, setBeauty] = useState(0);
  const [beautyOpen, setBeautyOpen] = useState(false);
  const [song, setSong] = useState(null);
  const [picker, setPicker] = useState(false);
  const [count, setCount] = useState(0);
  const [screenFlash, setScreenFlash] = useState(false);
  const [toast, setToast] = useState(null);
  const [faceState, setFaceState] = useState('idle');
  const [segState, setSegState] = useState('idle');
  const [noFace, setNoFace] = useState(false);
  const [zoomChip, setZoomChip] = useState(0);
  const [nameChip, setNameChip] = useState(null);
  const videoRef = useRef(null);
  const stageRef = useRef(null);
  const boxRef = useRef(null);
  const carRef = useRef(null);
  const streamRef = useRef(null);
  const streamNo = useRef(0);
  const S = useRef({ zoom: 1, raw: [], jaw: [], mask: {}, lastFace: 0, lastSeg: 0, seenFace: 0, cache: {}, bgImg: null, userImg: null });
  const recRef = useRef(null);
  const holdT = useRef(null);
  const ptr = useRef(null);
  const pinch = useRef({ pts: new Map(), d0: 0, z0: 1, lastTap: 0 });
  const countRef = useRef(null);
  const toastT = useRef(0);
  const chipT = useRef(0);
  const scrollT = useRef(0);
  const wantFace = lens !== 'none' || beauty > 0.01;
  const live = useRef({});
  live.current = { lens, filter, bg, beauty, night, mode, rec, locked, facing, song, flash, timer, tray, faceState, segState, wantFace };

  const say = (text) => { setToast({ text, at: Date.now() }); clearTimeout(toastT.current); toastT.current = setTimeout(() => setToast(null), 1500); };

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    (async () => {
      try {
        if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
        const md = navigator.mediaDevices;
        if (!md || !md.getUserMedia) { setError('This browser cannot open the camera. Pick from your gallery instead.'); return; }
        const video = { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } };
        let stream = null;
        try { stream = await md.getUserMedia({ video, audio: true }); } catch { stream = await md.getUserMedia({ video, audio: false }); }
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        const v = videoRef.current;
        if (v) { v.srcObject = stream; v.play().catch(() => {}); }
        streamNo.current += 1;
        setReady(true);
        setError('');
      } catch {
        setError('Allow camera access to take photos and videos.');
      }
    })();
    return () => { cancelled = true; };
  }, [facing]);

  useEffect(() => () => {
    clearTimeout(holdT.current); clearInterval(countRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    const R = recRef.current; recRef.current = null;
    if (R && R.rec && R.rec.state !== 'inactive') { R.drop = true; try { R.rec.stop(); } catch {} }
    try { stopSong(); } catch {}
    if (S.current.userUrl) URL.revokeObjectURL(S.current.userUrl);
  }, []);

  useEffect(() => {
    if (!wantFace || faceState === 'ready' || faceState === 'loading') return;
    if (faceReady()) { setFaceState('ready'); return; }
    let alive = true;
    setFaceState('loading');
    loadFace().then(() => { if (alive) setFaceState('ready'); }, () => { if (alive) setFaceState('error'); });
    return () => { alive = false; };
  }, [wantFace, faceState === 'error' ? 0 : 1]);
  useEffect(() => {
    if (bg === 'none' || segState === 'ready' || segState === 'loading') return;
    if (segReady()) { setSegState('ready'); return; }
    let alive = true;
    setSegState('loading');
    loadSeg().then(() => { if (alive) setSegState('ready'); }, () => { if (alive) setSegState('error'); });
    return () => { alive = false; };
  }, [bg, segState === 'error' ? 0 : 1]);
  useEffect(() => { S.current.bgImg = bg === 'photo' ? S.current.userImg : null; }, [bg]);
  const [liveThumb, setLiveThumb] = useState(null);
  useEffect(() => {
    if (tray === 'lenses' || !ready) return undefined;
    const grab = () => {
      const cv = stageRef.current;
      if (!cv || !cv.width) return;
      try {
        const c = S.current.thumbCv || (S.current.thumbCv = document.createElement('canvas'));
        c.width = 96; c.height = 96;
        const s2 = Math.min(cv.width, cv.height) * 0.86;
        c.getContext('2d').drawImage(cv, (cv.width - s2) / 2, Math.max(0, (cv.height - s2) / 2 - cv.height * 0.08), s2, s2, 0, 0, 96, 96);
        setLiveThumb(c.toDataURL('image/jpeg', 0.72));
      } catch {}
    };
    const t0 = setTimeout(grab, 120);
    const t = setInterval(grab, 900);
    return () => { clearTimeout(t0); clearInterval(t); };
  }, [tray, ready]);

  useEffect(() => {
    let raf = 0, last = 0;
    const loop = (ts) => {
      raf = requestAnimationFrame(loop);
      if (ts - last < 15) return;
      last = ts;
      const cv = stageRef.current, box = boxRef.current, v = videoRef.current;
      if (!cv || !box || !v || !v.videoWidth || v.readyState < 2) return;
      const L = live.current, st = S.current;
      const cw = box.clientWidth, chh = box.clientHeight;
      const k = Math.min(window.devicePixelRatio || 1, 2, 1280 / Math.max(cw, chh));
      const W = Math.max(2, Math.round(cw * k)), H = Math.max(2, Math.round(chh * k));
      if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; st.cache.prev = null; }
      const now = performance.now();
      if (L.wantFace && L.faceState === 'ready' && now - st.lastFace > 32) {
        st.lastFace = now;
        try { const r = detectFaces(v, now); if (r) { st.raw = r.faces; st.jaw = r.jaw; if (r.faces.length) st.seenFace = now; } } catch {}
      } else if (!L.wantFace && st.raw.length) { st.raw = []; st.cache.prev = null; }
      if (L.bg !== 'none' && L.segState === 'ready' && now - st.lastSeg > 60) { st.lastSeg = now; try { segmentInto(v, now, st.mask); } catch {} }
      const ctx = cv.getContext('2d');
      const F = { v, mirror: L.facing === 'user', zoom: st.zoom, raw: L.wantFace ? st.raw : [], jaw: st.jaw, lens: L.lens, bg: L.segState === 'ready' ? L.bg : 'none', bgImg: st.bgImg, mask: st.mask, beauty: L.beauty, t: now / 1000 };
      composeFrame(ctx, W, H, F, st.cache, true);
      const nf = L.lens !== 'none' && L.faceState === 'ready' && now - st.seenFace > 1300;
      if (nf !== st.nf) { st.nf = nf; setNoFace(nf); }
      const R = recRef.current;
      if (R && R.ctx) {
        const rw = R.c.width, rh = R.c.height;
        if (R.cpu) {
          R.ctx.drawImage(cv, 0, 0, rw, rh);
          if (L.filter !== 'none') applyPhotoFilter(R.ctx, rw, rh, L.filter);
          if (L.night) brighten(R.ctx, rw, rh, 1.32);
        } else {
          const css = [L.filter !== 'none' ? photoFilterCss(L.filter) : '', L.night ? NIGHT_CSS : ''].filter((x) => x && x !== 'none').join(' ');
          if (CTX_FILTER) R.ctx.filter = css || 'none';
          R.ctx.drawImage(cv, 0, 0, rw, rh);
          if (CTX_FILTER) R.ctx.filter = 'none';
          if (L.filter !== 'none') paintFilterFx(R.ctx, rw, rh, L.filter);
        }
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!rec) return undefined;
    const t = setInterval(() => { const R = recRef.current; if (!R) return; const ms = Date.now() - R.at; setElapsed(ms); if (ms >= MAX_MS) stopRec(); }, 100);
    return () => clearInterval(t);
  }, [rec]);

  const torch = async (on) => {
    const s = streamRef.current; const tr = s && s.getVideoTracks()[0];
    if (!tr || facing === 'user') return false;
    try { const caps = tr.getCapabilities ? tr.getCapabilities() : {}; if (!caps.torch) return false; await tr.applyConstraints({ advanced: [{ torch: on }] }); return true; } catch { return false; }
  };
  const frameState = () => {
    const L = live.current, st = S.current;
    return { v: videoRef.current, mirror: L.facing === 'user', zoom: st.zoom, raw: L.wantFace ? st.raw : [], jaw: st.jaw, lens: L.lens, bg: L.segState === 'ready' ? L.bg : 'none', bgImg: st.bgImg, mask: st.mask, beauty: L.beauty, t: performance.now() / 1000 };
  };
  const renderStill = (longSide) => {
    const cv = stageRef.current;
    if (!cv || !cv.width) return null;
    const k = longSide / Math.max(cv.width, cv.height);
    const W = Math.round(cv.width * k), H = Math.round(cv.height * k);
    const out = document.createElement('canvas'); out.width = W; out.height = H;
    const ctx = out.getContext('2d');
    composeFrame(ctx, W, H, frameState(), {}, false);
    const L = live.current;
    if (L.filter !== 'none') applyPhotoFilter(ctx, W, H, L.filter);
    if (L.night) brighten(ctx, W, H, 1.32);
    return out;
  };
  const meta = () => (live.current.song ? { song: live.current.song } : {});
  const snapPhoto = async () => {
    if (making) return;
    const L = live.current;
    let lit = false;
    if (L.flash === 'on') {
      if (L.facing === 'user') { setScreenFlash(true); await wait(260); } else { lit = await torch(true); if (lit) await wait(320); }
    }
    const out = renderStill(1920);
    if (L.flash === 'on') { if (L.facing === 'user') setTimeout(() => setScreenFlash(false), 120); else if (lit) torch(false); }
    if (!out) return;
    playUiSound('shutter');
    setScreenFlash((v) => v || L.flash !== 'on');
    setTimeout(() => setScreenFlash(false), 140);
    try { out.toBlob((blob) => { if (blob) onCapture(new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' }), meta()); else say('That photo did not work. Try again.'); }, 'image/jpeg', 0.92); } catch { say('That photo did not work. Try again.'); }
  };
  const startRec = () => {
    const raw = streamRef.current;
    const cv = stageRef.current;
    if (!raw || !cv || typeof MediaRecorder === 'undefined' || typeof cv.captureStream !== 'function') { say('Video does not work in this browser'); return; }
    const L0 = live.current;
    const cpu = !CTX_FILTER && (L0.filter !== 'none' || L0.night);
    const rk = cpu ? Math.min(1, 720 / Math.max(cv.width, cv.height)) : 1;
    const c = document.createElement('canvas'); c.width = Math.max(2, Math.round(cv.width * rk / 2) * 2); c.height = Math.max(2, Math.round(cv.height * rk / 2) * 2);
    const ctx = c.getContext('2d', cpu ? { willReadFrequently: true } : undefined);
    ctx.drawImage(cv, 0, 0, c.width, c.height);
    const stream = c.captureStream(30);
    if (!L0.song) raw.getAudioTracks().forEach((t) => stream.addTrack(t));
    const types = ['video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
    const mime = types.find((t) => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t));
    let r;
    try { r = mime ? new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 5000000 }) : new MediaRecorder(stream); } catch { say('Video does not work in this browser'); return; }
    const R = { rec: r, c, ctx, cpu, chunks: [], at: Date.now(), drop: false };
    r.ondataavailable = (e) => { if (e.data && e.data.size) R.chunks.push(e.data); };
    r.onstop = () => {
      stream.getVideoTracks().forEach((t) => t.stop());
      if (R.drop) return;
      const type = r.mimeType || mime || 'video/webm';
      const blob = new Blob(R.chunks, { type });
      if (blob.size > 2000) onCapture(new File([blob], `video-${Date.now()}.${type.includes('mp4') ? 'mp4' : 'webm'}`, { type }), meta());
    };
    recRef.current = R;
    r.start(250);
    setElapsed(0); setRec(true); setLocked(false);
    if (live.current.flash === 'on') torch(true);
    if (live.current.song) { try { playSong(live.current.song, true); } catch {} }
    playUiSound('record-start');
  };
  function stopRec() {
    const R = recRef.current;
    recRef.current = null;
    setRec(false); setLocked(false); setHolding(false);
    S.current.zoom = Math.max(1, Math.min(S.current.zoom, 5));
    torch(false);
    try { stopSong(); } catch {}
    if (R && R.rec && R.rec.state !== 'inactive') { playUiSound('record-stop'); R.rec.stop(); }
  }
  const makeBoomerang = async () => {
    if (making || typeof MediaRecorder === 'undefined') { if (typeof MediaRecorder === 'undefined') say('Boomerang does not work in this browser'); return; }
    setMaking('Hold still');
    playUiSound('record-start');
    const frames = [];
    for (let i = 0; i < 18; i++) { const f = renderStill(720); if (f) frames.push(f); await wait(62); }
    if (frames.length < 4) { setMaking(''); return; }
    setMaking('Making your boomerang');
    try {
      const cv = document.createElement('canvas'); cv.width = frames[0].width; cv.height = frames[0].height;
      const cx = cv.getContext('2d'); cx.drawImage(frames[0], 0, 0);
      if (typeof cv.captureStream !== 'function') throw new Error('nocapture');
      const stream = cv.captureStream(30);
      const types = ['video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
      const mime = types.find((t) => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t));
      const r = mime ? new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 4000000 }) : new MediaRecorder(stream);
      const chunks = [];
      r.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      const stopped = new Promise((res) => { r.onstop = res; });
      r.start(200);
      const seq = [...frames, ...frames.slice(1, -1).reverse()];
      for (let loop = 0; loop < 3; loop++) for (const f of seq) { cx.drawImage(f, 0, 0); await wait(1000 / 30); }
      cx.drawImage(frames[0], 0, 0); await wait(80);
      r.stop(); await stopped;
      stream.getTracks().forEach((t) => t.stop());
      const type = r.mimeType || mime || 'video/webm';
      const blob = new Blob(chunks, { type });
      setMaking('');
      if (blob.size > 2000) onCapture(new File([blob], `boomerang-${Date.now()}.${type.includes('mp4') ? 'mp4' : 'webm'}`, { type }), meta());
    } catch { setMaking(''); setError('That boomerang did not work. Try again.'); }
  };
  const makeDual = async () => {
    if (making) return;
    const first = renderStill(1600);
    if (!first) return;
    playUiSound('shutter');
    setScreenFlash(true); setTimeout(() => setScreenFlash(false), 140);
    setMaking('Now smile');
    const before = streamNo.current;
    setFacing((f) => (f === 'user' ? 'environment' : 'user'));
    const t0 = Date.now();
    while (Date.now() - t0 < 5000) { await wait(120); const v = videoRef.current; if (streamNo.current !== before && v && v.videoWidth) break; }
    await wait(650);
    const second = streamNo.current !== before ? renderStill(900) : null;
    playUiSound('shutter');
    setScreenFlash(true); setTimeout(() => setScreenFlash(false), 140);
    const W = 1200, H = 1600;
    const out = document.createElement('canvas'); out.width = W; out.height = H;
    const ctx = out.getContext('2d');
    const cover = (img, x, y, w, h) => { const r = Math.max(w / img.width, h / img.height); const sw = w / r, sh = h / r; ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h); };
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    cover(first, 0, 0, W, H);
    if (second) {
      const iw = Math.round(W * 0.31), ih = Math.round(iw * 4 / 3), ix = 36, iy = 36, rr = 34;
      const path = () => { ctx.beginPath(); ctx.moveTo(ix + rr, iy); ctx.arcTo(ix + iw, iy, ix + iw, iy + ih, rr); ctx.arcTo(ix + iw, iy + ih, ix, iy + ih, rr); ctx.arcTo(ix, iy + ih, ix, iy, rr); ctx.arcTo(ix, iy, ix + iw, iy, rr); ctx.closePath(); };
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 24; path(); ctx.fillStyle = '#000'; ctx.fill(); ctx.restore();
      ctx.save(); path(); ctx.clip(); cover(second, ix, iy, iw, ih); ctx.restore();
      path(); ctx.lineWidth = 7; ctx.strokeStyle = '#000'; ctx.stroke();
    }
    setMaking('');
    try { out.toBlob((blob) => { if (blob) onCapture(new File([blob], `moment-${Date.now()}.jpg`, { type: 'image/jpeg' }), meta()); else say('That photo did not work. Try again.'); }, 'image/jpeg', 0.92); } catch { say('That photo did not work. Try again.'); }
  };
  const runTimer = (fn) => {
    clearInterval(countRef.current);
    let n = timer;
    setCount(n);
    playUiSound('tap');
    countRef.current = setInterval(() => {
      n -= 1;
      if (n <= 0) { clearInterval(countRef.current); countRef.current = null; setCount(0); fn(); return; }
      setCount(n); playUiSound('tap');
    }, 1000);
  };
  const cancelTimer = () => { clearInterval(countRef.current); countRef.current = null; setCount(0); };

  const trayItems = tray === 'lenses'
    ? [{ k: 'none', name: 'No lens', icon: 'none' }, ...LENSES.map((l) => ({ k: l.k, name: l.name, glyph: lensThumb(l.k) }))]
    : tray === 'filters'
      ? PHOTO_FILTERS.map((f) => ({ k: f.k, name: f.label, thumb: liveThumb, css: photoFilterCss(f.k) }))
      : BGS.map((b) => ({ k: b.k, name: b.name, thumb: b.fx ? liveThumb : (b.k === 'photo' && S.current.userThumb) || null, css: b.fx || 'none', icon: b.fx ? null : b.k === 'none' ? 'none' : 'photo' }));
  const curKey = tray === 'lenses' ? lens : tray === 'filters' ? filter : bg;
  const curIdx = Math.max(0, trayItems.findIndex((it) => it.k === curKey));
  const userPick = useRef(null);
  const pickIdx = (i) => {
    const it = trayItems[i];
    if (!it || it.k === curKey) return;
    hapticTap();
    if (tray === 'lenses') setLens(it.k);
    else if (tray === 'filters') setFilter(it.k);
    else if (it.k === 'photo' && !S.current.userImg) { if (userPick.current) userPick.current.click(); return; }
    else setBg(it.k);
    setNameChip({ text: it.k === 'none' ? (tray === 'lenses' ? 'No lens' : 'No background') : it.name, at: Date.now() });
    clearTimeout(chipT.current); chipT.current = setTimeout(() => setNameChip(null), 1400);
  };
  useEffect(() => {
    const el = carRef.current;
    if (el) el.scrollLeft = curIdx * (ITEM + GAP);
  }, [tray]);
  const onCarScroll = () => {
    clearTimeout(scrollT.current);
    scrollT.current = setTimeout(() => {
      const el = carRef.current;
      if (!el || ptr.current) return;
      const i = Math.max(0, Math.min(trayItems.length - 1, Math.round(el.scrollLeft / (ITEM + GAP))));
      pickIdx(i);
    }, 110);
  };
  const scrollToIdx = (i, smooth) => {
    const el = carRef.current;
    if (!el) return;
    const left = i * (ITEM + GAP);
    try { el.scrollTo({ left, behavior: smooth ? 'smooth' : 'auto' }); } catch { el.scrollLeft = left; }
  };

  const ringDown = (e) => {
    e.preventDefault();
    if (!ready || making || error) return;
    if (countRef.current) { cancelTimer(); return; }
    if (rec && locked) { stopRec(); return; }
    const el = carRef.current;
    ptr.current = { id: e.pointerId, x: e.clientX, y: e.clientY, sl: el ? el.scrollLeft : 0, drag: false, z0: S.current.zoom };
    clearTimeout(scrollT.current);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    setHolding(true);
    clearTimeout(holdT.current);
    if (mode === 'photo') holdT.current = setTimeout(() => { holdT.current = null; if (ptr.current && !ptr.current.drag) startRec(); }, 320);
  };
  const ringMove = (e) => {
    const p = ptr.current;
    if (!p || p.id !== e.pointerId) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    if (recRef.current) {
      const z = Math.max(1, Math.min(5, p.z0 + Math.max(0, -dy) / 110));
      if (Math.abs(z - S.current.zoom) > 0.01) { S.current.zoom = z; setZoomChip(z); }
      if (!locked && dx < -70 && Math.abs(dy) < 60) { setLocked(true); hapticTap(); say('Hands free recording'); }
      return;
    }
    if (!p.drag && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) { p.drag = true; clearTimeout(holdT.current); holdT.current = null; if (carRef.current) carRef.current.style.scrollSnapType = 'none'; }
    if (p.drag && carRef.current) carRef.current.scrollLeft = p.sl - dx;
  };
  const ringUp = (e) => {
    const p = ptr.current;
    if (!p || p.id !== e.pointerId) return;
    ptr.current = null;
    setHolding(false);
    if (p.drag) {
      const el = carRef.current;
      if (el) el.style.scrollSnapType = 'x mandatory';
      const i = el ? Math.max(0, Math.min(trayItems.length - 1, Math.round(el.scrollLeft / (ITEM + GAP)))) : curIdx;
      scrollToIdx(i, true); pickIdx(i);
      return;
    }
    if (holdT.current) {
      clearTimeout(holdT.current); holdT.current = null;
      const go = mode === 'boomerang' ? makeBoomerang : mode === 'dual' ? makeDual : snapPhoto;
      if (timer && mode !== 'dual') runTimer(go); else go();
      return;
    }
    if (mode !== 'photo') { (mode === 'boomerang' ? makeBoomerang : makeDual)(); return; }
    if (recRef.current && !locked) stopRec();
  };

  const stageDown = (e) => {
    const P = pinch.current;
    P.pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (P.pts.size === 2) { const [a, b] = [...P.pts.values()]; P.d0 = Math.hypot(a.x - b.x, a.y - b.y); P.z0 = S.current.zoom; }
    if (P.pts.size === 1) {
      const now = Date.now();
      if (now - P.lastTap < 300 && !rec && !making) { P.lastTap = 0; flip(); } else P.lastTap = now;
    }
  };
  const stageMove = (e) => {
    const P = pinch.current;
    if (!P.pts.has(e.pointerId)) return;
    P.pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (P.pts.size === 2 && P.d0 > 10) { const [a, b] = [...P.pts.values()]; const z = Math.max(1, Math.min(5, P.z0 * Math.hypot(a.x - b.x, a.y - b.y) / P.d0)); S.current.zoom = z; setZoomChip(z); }
  };
  const stageUp = (e) => { pinch.current.pts.delete(e.pointerId); if (!pinch.current.pts.size) setTimeout(() => setZoomChip((z) => (recRef.current ? z : 0)), 900); };
  const flip = () => { if (rec || making) return; S.current.zoom = 1; S.current.cache = {}; S.current.raw = []; setFacing((f) => { const n = f === 'user' ? 'environment' : 'user'; try { localStorage.setItem('zchat-cam-facing', n); } catch {} return n; }); };
  const onUserPhoto = (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    if (S.current.userUrl) URL.revokeObjectURL(S.current.userUrl);
    const url = URL.createObjectURL(f);
    S.current.userUrl = url;
    const img = new Image();
    img.onload = () => { const c = photoCanvas(img); URL.revokeObjectURL(url); S.current.userUrl = null; S.current.userImg = c; S.current.bgImg = c; try { const t = document.createElement('canvas'); t.width = 96; t.height = 96; const m = Math.min(c.width, c.height); t.getContext('2d').drawImage(c, (c.width - m) / 2, (c.height - m) / 2, m, m, 0, 0, 96, 96); S.current.userThumb = t.toDataURL('image/jpeg', 0.75); } catch {} setBg('photo'); };
    img.src = url;
  };

  const css = [filter !== 'none' ? photoFilterCss(filter) : '', night ? NIGHT_CSS : ''].filter((x) => x && x !== 'none').join(' ') || 'none';
  const ring = rec ? Math.min(1, elapsed / MAX_MS) : 0;
  const secs = Math.floor(elapsed / 1000);
  const curLens = LENSES.find((l) => l.k === lens);
  const status = wantFace && faceState === 'loading' ? (lens !== 'none' ? 'Getting lenses ready' : 'Getting beauty ready') : bg !== 'none' && segState === 'loading' ? 'Getting backgrounds ready' : null;
  const failed = (wantFace && faceState === 'error') || (bg !== 'none' && segState === 'error');
  const showUi = !rec && !making && !count;
  const tabs = [['lenses', 'Lenses'], ['filters', 'Filters'], ['backgrounds', 'Backgrounds']];
  const shadow = '0 1px 6px rgba(0, 0, 0, 0.55)';

  return (
    <div className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 520, background: '#000', color: '#FFFFFF', fontFamily: FONT, overflow: 'hidden', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}>
      <video ref={videoRef} playsInline muted autoPlay style={{ position: 'absolute', left: 0, top: 0, width: 2, height: 2, opacity: 0.01, pointerEvents: 'none' }} />
      <div ref={boxRef} onPointerDown={stageDown} onPointerMove={stageMove} onPointerUp={stageUp} onPointerCancel={stageUp} style={{ position: 'absolute', inset: 0 }}>
        <canvas ref={stageRef} aria-label="Camera" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', filter: css }} />
        <FilterFx k={filter} />
        {grid && (
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {[1, 2].map((i) => <div key={`v${i}`} style={{ position: 'absolute', top: 0, bottom: 0, left: `${(i * 100) / 3}%`, width: 1, background: 'rgba(255,255,255,0.45)' }} />)}
            {[1, 2].map((i) => <div key={`h${i}`} style={{ position: 'absolute', left: 0, right: 0, top: `${(i * 100) / 3}%`, height: 1, background: 'rgba(255,255,255,0.45)' }} />)}
          </div>
        )}
      </div>
      {screenFlash && <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: '#FFFFFF', opacity: 0.92, zIndex: 5 }} />}
      <input ref={userPick} type="file" accept="image/*" aria-label="Pick a background photo" style={{ display: 'none' }} onChange={onUserPhoto} />

      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, padding: 'calc(12px + env(safe-area-inset-top)) 14px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', zIndex: 3, pointerEvents: 'none' }}>
        <div role="button" aria-label="Close" onClick={() => { if (rec) stopRec(); onClose(); }} style={{ width: 42, height: 42, borderRadius: 21, background: 'rgba(0,0,0,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', pointerEvents: 'auto' }}><CamIcon k="close" size={22} stroke={2.4} /></div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, paddingTop: 6, minWidth: 0 }}>
          {rec && (
            <div role="timer" aria-label="Recording time" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px', borderRadius: 16, background: 'rgba(0,0,0,0.35)', fontWeight: 800, fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#FF3B30' }} />{Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}
            </div>
          )}
          {song && !rec && (
            <div role="button" aria-label={`Remove sound ${song.t}`} onClick={() => { setSong(null); try { stopSong(); } catch {} }} style={{ display: 'flex', alignItems: 'center', gap: 7, maxWidth: '100%', padding: '6px 12px', borderRadius: 16, background: 'rgba(0,0,0,0.35)', fontSize: 13, fontWeight: 700, cursor: 'pointer', pointerEvents: 'auto' }}>
              <CamIcon k="music" size={15} /><span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.a ? `${song.t}, ${song.a}` : song.t}</span><CamIcon k="close" size={13} />
            </div>
          )}
          {zoomChip > 1.01 && <div style={{ padding: '4px 10px', borderRadius: 12, background: 'rgba(0,0,0,0.35)', fontSize: 13, fontWeight: 800 }}>{`${zoomChip.toFixed(1)}x`}</div>}
          {status && <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 16, background: 'rgba(0,0,0,0.4)', fontSize: 13, fontWeight: 700 }}><Spinner size={14} color="#FFFFFF" />{status}</div>}
          {failed && <div role="button" aria-label="Try loading the effects again" onClick={() => { if (faceState === 'error') setFaceState('idle'); if (segState === 'error') setSegState('idle'); }} style={{ padding: '6px 12px', borderRadius: 16, background: 'rgba(0,0,0,0.45)', fontSize: 13, fontWeight: 700, cursor: 'pointer', pointerEvents: 'auto', textAlign: 'center' }}>Effects did not load. Tap to try again.</div>}
        </div>
        {showUi ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'auto' }}>
            <RailBtn k="flip" label="Flip camera" onPress={flip} />
            <RailBtn k={flash === 'on' ? 'flash' : 'flashoff'} label={flash === 'on' ? 'Flash on' : 'Flash off'} on={flash === 'on'} fill={flash === 'on'} onPress={() => { const n = flash === 'on' ? 'off' : 'on'; setFlash(n); say(n === 'on' ? 'Flash on' : 'Flash off'); }} />
            <RailBtn k="timer" label={timer ? `Timer ${timer} seconds` : 'Timer off'} on={!!timer} badge={timer ? `${timer}` : null} onPress={() => { const n = timer === 0 ? 3 : timer === 3 ? 10 : 0; setTimer(n); say(n ? `Timer ${n} seconds` : 'Timer off'); }} />
            <RailBtn k="night" label={night ? 'Night mode on' : 'Night mode off'} on={night} onPress={() => { setNight((v) => !v); say(night ? 'Night mode off' : 'Night mode on'); }} />
            <RailBtn k="grid" label={grid ? 'Grid on' : 'Grid off'} on={grid} onPress={() => setGrid((v) => !v)} />
            <RailBtn k="beauty" label="Beauty" on={beauty > 0 || beautyOpen} onPress={() => setBeautyOpen((v) => !v)} />
            {songs && <RailBtn k="music" label="Add a sound" on={!!song} onPress={() => setPicker(true)} />}
          </div>
        ) : <div style={{ width: 42 }} />}
      </div>

      {beautyOpen && showUi && (
        <div onPointerDown={(e) => e.stopPropagation()} style={{ position: 'absolute', right: 66, top: 'calc(271px + env(safe-area-inset-top))', zIndex: 4, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 18, background: 'rgba(0,0,0,0.45)' }}>
          <span style={{ fontSize: 13, fontWeight: 700, width: 44 }}>Beauty</span>
          <input type="range" min="0" max="100" value={Math.round(beauty * 100)} aria-label="Beauty strength" onChange={(e) => setBeauty(Number(e.target.value) / 100)} style={{ width: 130, accentColor: '#FFFFFF' }} />
          <span style={{ fontSize: 12.5, fontWeight: 800, width: 26, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{Math.round(beauty * 100)}</span>
        </div>
      )}

      {error && <div style={{ position: 'absolute', left: 24, right: 24, top: '38%', textAlign: 'center', fontSize: 15, fontWeight: 600, zIndex: 3, textShadow: shadow }}>{error}</div>}
      {count > 0 && <div aria-live="polite" style={{ position: 'absolute', left: 0, right: 0, top: '36%', textAlign: 'center', fontSize: 96, fontWeight: 800, zIndex: 4, textShadow: '0 4px 24px rgba(0,0,0,0.45)' }}>{count}</div>}
      {making && (
        <div className="zchat-pop" style={{ position: 'absolute', left: '50%', top: '42%', transform: 'translate(-50%, -50%)', padding: '12px 20px', borderRadius: 22, background: 'rgba(0,0,0,0.6)', fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap', zIndex: 4 }}>
          {making !== 'Now smile' && making !== 'Hold still' && <Spinner size={16} color="#FFFFFF" />}{making}
        </div>
      )}
      {toast && <div key={toast.at} style={{ position: 'absolute', left: '50%', top: '44%', transform: 'translateX(-50%)', padding: '8px 14px', borderRadius: 16, background: 'rgba(0,0,0,0.5)', fontSize: 14, fontWeight: 700, zIndex: 4, whiteSpace: 'nowrap', pointerEvents: 'none' }}>{toast.text}</div>}

      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingBottom: 'calc(14px + env(safe-area-inset-bottom))', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div style={{ minHeight: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, pointerEvents: 'none' }}>
          {nameChip && showUi && <div key={nameChip.at} className="zchat-pop" style={{ padding: '5px 12px', borderRadius: 14, background: 'rgba(0,0,0,0.35)', fontSize: 14, fontWeight: 800 }}>{nameChip.text}</div>}
          {!nameChip && noFace && lens !== 'none' && <div style={{ padding: '5px 12px', borderRadius: 14, background: 'rgba(0,0,0,0.35)', fontSize: 13, fontWeight: 700 }}>Point the camera at a face</div>}
          {!nameChip && !noFace && curLens && curLens.hint && faceState === 'ready' && showUi && <div style={{ padding: '5px 12px', borderRadius: 14, background: 'rgba(0,0,0,0.35)', fontSize: 13, fontWeight: 700 }}>{curLens.hint}</div>}
        </div>
        {showUi && (
          <div role="tablist" aria-label="Camera effects" style={{ display: 'flex', gap: 20 }}>
            {tabs.map(([k, label]) => (
              <div key={k} role="tab" aria-selected={tray === k} onClick={() => { hapticTap(); setTray(k); }} style={{ fontSize: 14, fontWeight: tray === k ? 800 : 600, color: tray === k ? '#FFFFFF' : 'rgba(255,255,255,0.62)', textShadow: shadow, padding: '4px 0', cursor: 'pointer', boxShadow: tray === k ? 'inset 0 -2px 0 #FFFFFF' : 'none' }}>{label}</div>
            ))}
          </div>
        )}
        <div style={{ position: 'relative', width: '100%', height: 92 }}>
          <div ref={carRef} onScroll={onCarScroll} aria-label="Effects" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: GAP, overflowX: 'auto', scrollSnapType: 'x mandatory', scrollbarWidth: 'none', padding: `0 calc(50% - ${ITEM / 2}px)`, boxSizing: 'border-box', visibility: showUi ? 'visible' : 'hidden', touchAction: 'pan-x' }}>
            {trayItems.map((it, i) => (
              <div key={`${tray}.${it.k}`} role="button" aria-label={it.name} aria-pressed={i === curIdx} onClick={() => { if (i !== curIdx) { scrollToIdx(i, true); pickIdx(i); } }}
                style={{ width: ITEM, height: ITEM, flexShrink: 0, borderRadius: '50%', overflow: 'hidden', scrollSnapAlign: 'center', background: it.glyph ? 'rgba(0,0,0,0.42)' : 'rgba(255,255,255,0.18)', boxShadow: '0 0 0 2px rgba(255,255,255,0.75), 0 2px 8px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: i === curIdx ? 0 : 1, transition: 'opacity 120ms' }}>
                {it.glyph ? <img src={it.glyph} alt="" draggable={false} style={{ width: '74%', height: '74%', display: 'block' }} /> : it.thumb ? <img src={it.thumb} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: it.css || 'none' }} /> : <CamIcon k={it.icon || 'none'} size={26} />}
              </div>
            ))}
          </div>
          <div role="button" aria-label={rec ? (locked ? 'Stop recording' : 'Recording, let go to stop') : mode === 'photo' ? 'Take a photo, hold for video' : mode === 'boomerang' ? 'Make a boomerang' : 'Take a dual photo'}
            onPointerDown={ringDown} onPointerMove={ringMove} onPointerUp={ringUp} onPointerCancel={ringUp} onContextMenu={(e) => e.preventDefault()}
            style={{ position: 'absolute', left: '50%', top: '50%', width: 88, height: 88, marginLeft: -44, marginTop: -44, borderRadius: '50%', cursor: 'pointer', touchAction: 'none', transform: holding && !rec ? 'scale(0.94)' : 'none', transition: 'transform 0.12s' }}>
            {!rec && trayItems[curIdx] && (
              <div style={{ position: 'absolute', inset: 13, borderRadius: '50%', overflow: 'hidden', background: trayItems[curIdx].k === 'none' ? 'transparent' : trayItems[curIdx].glyph ? 'rgba(0,0,0,0.42)' : 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {trayItems[curIdx].glyph ? <img src={trayItems[curIdx].glyph} alt="" draggable={false} style={{ width: '74%', height: '74%', display: 'block' }} /> : trayItems[curIdx].thumb ? <img src={trayItems[curIdx].thumb} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: trayItems[curIdx].css || 'none' }} /> : null}
              </div>
            )}
            <svg width="88" height="88" viewBox="0 0 88 88" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.35))' }}>
              <circle cx="44" cy="44" r="39" fill="none" stroke="#FFFFFF" strokeWidth="6" opacity={rec ? 0.4 : 1} />
              {rec && <circle cx="44" cy="44" r="39" fill="none" stroke="#FF3B30" strokeWidth="6" strokeDasharray={`${2 * Math.PI * 39 * ring} ${2 * Math.PI * 39}`} strokeLinecap="round" />}
            </svg>
            {rec && <div style={{ position: 'absolute', inset: locked ? 30 : 24, borderRadius: locked ? 8 : '50%', background: '#FF3B30', transition: 'all 0.18s' }} />}
          </div>
          {rec && !locked && (
            <div aria-hidden="true" style={{ position: 'absolute', top: '50%', left: 'calc(50% - 128px)', marginTop: -20, width: 40, height: 40, borderRadius: 20, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CamIcon k="lock" size={18} />
            </div>
          )}
        </div>
        {showUi && (
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', boxSizing: 'border-box' }}>
            {onPickGallery ? <div role="button" aria-label="Gallery" onClick={onPickGallery} style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><CamIcon k="gallery" size={21} /></div> : <div style={{ width: 42 }} />}
            <div role="group" aria-label="Camera mode" style={{ display: 'flex', gap: 18 }}>
              {[['photo', 'Photo'], ['boomerang', 'Boomerang'], ['dual', 'Dual']].map(([k, label]) => (
                <div key={k} role="button" aria-label={`${label} mode`} aria-pressed={mode === k} onClick={() => { hapticTap(); setMode(k); }} style={{ fontSize: 14, fontWeight: mode === k ? 800 : 600, color: mode === k ? '#FFFFFF' : 'rgba(255,255,255,0.62)', textShadow: shadow, cursor: 'pointer' }}>{label}</div>
              ))}
            </div>
            <div style={{ width: 42 }} />
          </div>
        )}
        {rec && !locked && <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.85, textShadow: shadow }}>Slide left to lock, slide up to zoom</div>}
      </div>
      {picker && <MusicPicker title="Add a sound" country={country} zIndex={560} onClose={() => setPicker(false)} onPick={(s) => { setPicker(false); setSong({ ...s, pos: { x: 0.5, y: 0.2, s: 1, r: 0 }, look: 'pill' }); say('Sound added'); }} />}
    </div>
  );
}
export default SnapCamera;
