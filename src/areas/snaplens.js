const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

const MP_VER = '0.10.14';
const MP_BASES = [`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VER}`, `https://unpkg.com/@mediapipe/tasks-vision@${MP_VER}`];
const FACE_MODEL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
const SEG_MODEL = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite';
const MP = { vis: null, fs: null, face: null, seg: null, jobs: {} };
const dynImport = (u) => new Function('u', 'return import(u)')(u);

async function loadVision() {
  if (MP.vis) return MP;
  if (!MP.jobs.vis) {
    MP.jobs.vis = (async () => {
      let last = null;
      for (const base of MP_BASES) {
        for (const file of ['vision_bundle.mjs', '+esm']) {
          try {
            const mod = await dynImport(`${base}/${file}`);
            const V = mod && mod.FilesetResolver ? mod : mod && mod.default && mod.default.FilesetResolver ? mod.default : null;
            if (!V) continue;
            MP.fs = await V.FilesetResolver.forVisionTasks(`${base}/wasm`);
            MP.vis = V;
            return MP;
          } catch (e) { last = e; }
        }
      }
      throw last || new Error('vision');
    })().catch((e) => { MP.jobs.vis = null; throw e; });
  }
  return MP.jobs.vis;
}
export function faceReady() { return !!MP.face; }
export function segReady() { return !!MP.seg; }
export async function loadFace() {
  if (typeof window !== 'undefined' && window.__zfakeFace) return { fake: true };
  if (MP.face) return MP.face;
  if (!MP.jobs.face) {
    MP.jobs.face = (async () => {
      await loadVision();
      const mk = (delegate) => MP.vis.FaceLandmarker.createFromOptions(MP.fs, { baseOptions: { modelAssetPath: FACE_MODEL, delegate }, runningMode: 'VIDEO', numFaces: 2, outputFaceBlendshapes: true });
      try { MP.face = await mk('GPU'); } catch { MP.face = await mk('CPU'); }
      return MP.face;
    })().catch((e) => { MP.jobs.face = null; throw e; });
  }
  return MP.jobs.face;
}
export async function loadSeg() {
  if (typeof window !== 'undefined' && window.__zfakeMask) return { fake: true };
  if (MP.seg) return MP.seg;
  if (!MP.jobs.seg) {
    MP.jobs.seg = (async () => {
      await loadVision();
      const mk = (delegate) => MP.vis.ImageSegmenter.createFromOptions(MP.fs, { baseOptions: { modelAssetPath: SEG_MODEL, delegate }, runningMode: 'VIDEO', outputCategoryMask: false, outputConfidenceMasks: true });
      try { MP.seg = await mk('GPU'); } catch { MP.seg = await mk('CPU'); }
      return MP.seg;
    })().catch((e) => { MP.jobs.seg = null; throw e; });
  }
  return MP.jobs.seg;
}
export function detectFaces(video, ts) {
  if (typeof window !== 'undefined' && window.__zfakeFace) { const f = window.__zfakeFace(ts / 1000); return { faces: f ? [f] : [], jaw: [null] }; }
  if (!MP.face) return null;
  const r = MP.face.detectForVideo(video, ts);
  const faces = (r && r.faceLandmarks) || [];
  const jaw = faces.map((_, i) => {
    const bs = r.faceBlendshapes && r.faceBlendshapes[i];
    const c = bs && bs.categories ? bs.categories.find((q) => q.categoryName === 'jawOpen') : null;
    return c ? c.score : null;
  });
  return { faces, jaw };
}
export function segmentInto(video, ts, M) {
  if (typeof window !== 'undefined' && window.__zfakeMask) { window.__zfakeMask(M); return true; }
  if (!MP.seg) return false;
  let ok = false;
  MP.seg.segmentForVideo(video, ts, (res) => {
    const list = res && res.confidenceMasks;
    if (!list || !list.length) return;
    const m = list.length > 1 ? list[1] : list[0];
    const arr = m.getAsFloat32Array();
    const w = m.width, h = m.height;
    if (!M.cv || M.cv.width !== w || M.cv.height !== h) {
      M.cv = document.createElement('canvas'); M.cv.width = w; M.cv.height = h;
      M.ctx = M.cv.getContext('2d'); M.img = M.ctx.createImageData(w, h);
    }
    if (list.length === 1 && Math.abs(M.votes || 0) < 6) {
      const at = (fx, fy) => arr[Math.min(h - 1, Math.floor(fy * h)) * w + Math.min(w - 1, Math.floor(fx * w))] || 0;
      const mid = (at(0.5, 0.45) + at(0.45, 0.6) + at(0.55, 0.6) + at(0.5, 0.75)) / 4;
      const edge = (at(0.04, 0.04) + at(0.96, 0.04) + at(0.04, 0.3) + at(0.96, 0.3)) / 4;
      if (mid > 0.6 && edge < 0.4) M.votes = (M.votes || 0) + 1;
      else if (mid < 0.4 && edge > 0.6) M.votes = (M.votes || 0) - 1;
    }
    const inv = list.length === 1 && (M.votes || 0) <= -3;
    const d = M.img.data;
    for (let i = 0, j = 0; i < arr.length; i++, j += 4) { const v = inv ? 1 - arr[i] : arr[i]; d[j] = 255; d[j + 1] = 255; d[j + 2] = 255; d[j + 3] = clamp((v - 0.25) / 0.45, 0, 1) * 255; }
    M.ctx.putImageData(M.img, 0, 0);
    M.at = ts;
    ok = true;
  });
  return ok;
}

export const LM = { top: 10, chin: 152, nose: 1, bridge: 168, eyeR: 468, eyeL: 473, lipU: 13, lipD: 14, mouthR: 61, mouthL: 291, edgeR: 234, edgeL: 454, cheekR: 50, cheekL: 280, browR: 105, browL: 334 };
export const OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];

export function coverBox(vw, vh, W, H, zoom) {
  const s = Math.max(W / vw, H / vh) * (zoom || 1);
  const dw = vw * s, dh = vh * s;
  return { dw, dh, dx: (W - dw) / 2, dy: (H - dh) / 2 };
}
export function mapper(B, mirror, W) {
  return (p) => { let x = B.dx + p.x * B.dw; if (mirror) x = W - x; return { x, y: B.dy + p.y * B.dh }; };
}
const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
export function geomOf(P, jaw) {
  const a = P(LM.eyeR), b = P(LM.eyeL);
  const sl = a.x <= b.x ? a : b, sr = a.x <= b.x ? b : a;
  const roll = Math.atan2(sr.y - sl.y, sr.x - sl.x);
  const ed = Math.max(4, Math.hypot(sr.x - sl.x, sr.y - sl.y));
  const o = mid(sl, sr);
  const cr = Math.cos(-roll), sn = Math.sin(-roll), k = 100 / ed;
  const loc = (p) => { const dx = p.x - o.x, dy = p.y - o.y; return { x: (dx * cr - dy * sn) * k, y: (dx * sn + dy * cr) * k }; };
  const top = loc(P(LM.top)), chin = loc(P(LM.chin)), nose = loc(P(LM.nose));
  const lu = loc(P(LM.lipU)), ld = loc(P(LM.lipD));
  const m1 = loc(P(LM.mouthR)), m2 = loc(P(LM.mouthL));
  const c1 = loc(P(LM.cheekR)), c2 = loc(P(LM.cheekL));
  const e1 = loc(P(LM.edgeR)), e2 = loc(P(LM.edgeL));
  const faceH = Math.max(40, chin.y - top.y);
  const gap = Math.hypot(lu.x - ld.x, lu.y - ld.y) / faceH;
  let open = clamp((gap - 0.02) / 0.09, 0, 1);
  if (jaw != null) open = Math.max(open, clamp((jaw - 0.12) / 0.45, 0, 1));
  return {
    o, roll, ed, sl, sr, top, chin, nose, lipU: lu, lipD: ld, mouth: mid(lu, ld),
    mouthL: m1.x <= m2.x ? m1 : m2, mouthR: m1.x <= m2.x ? m2 : m1,
    cheekL: c1.x <= c2.x ? c1 : c2, cheekR: c1.x <= c2.x ? c2 : c1,
    edgeL: e1.x <= e2.x ? e1 : e2, edgeR: e1.x <= e2.x ? e2 : e1,
    faceH, open, oval: OVAL.map((i) => P(i)),
  };
}
export function smoothGeom(prev, g, k) {
  if (!prev) return g;
  const L = (a, b) => (a == null ? b : a + (b - a) * k);
  const P = (a, b) => (a ? { x: L(a.x, b.x), y: L(a.y, b.y) } : b);
  let dr = g.roll - prev.roll; while (dr > Math.PI) dr -= TAU; while (dr < -Math.PI) dr += TAU;
  return { ...g, o: P(prev.o, g.o), roll: prev.roll + dr * k, ed: L(prev.ed, g.ed), top: P(prev.top, g.top), chin: P(prev.chin, g.chin), nose: P(prev.nose, g.nose), mouth: P(prev.mouth, g.mouth), lipU: P(prev.lipU, g.lipU), lipD: P(prev.lipD, g.lipD), open: L(prev.open, g.open) };
}

function heart(c, x, y, s) {
  c.beginPath();
  c.moveTo(x, y + s * 0.35);
  c.bezierCurveTo(x - s * 0.55, y - s * 0.05, x - s * 0.5, y - s * 0.6, x, y - s * 0.28);
  c.bezierCurveTo(x + s * 0.5, y - s * 0.6, x + s * 0.55, y - s * 0.05, x, y + s * 0.35);
  c.closePath();
}
function star(c, x, y, r, n = 5, k = 0.45) {
  c.beginPath();
  for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, rr = i % 2 ? r * k : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  c.closePath();
}
function sparkle(c, x, y, r, a) {
  c.save(); c.globalAlpha *= a; c.fillStyle = '#FFFFFF';
  c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.fill();
  c.restore();
}
function flower(c, x, y, r, col, rot) {
  c.save(); c.translate(x, y); c.rotate(rot);
  c.fillStyle = col;
  for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; c.beginPath(); c.ellipse(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, r * 0.5, r * 0.36, a, 0, TAU); c.fill(); }
  c.fillStyle = '#FFC93C'; c.beginPath(); c.arc(0, 0, r * 0.32, 0, TAU); c.fill();
  c.restore();
}
const INKL = 'rgba(40,24,30,0.55)';

const DRAW = {
  puppy(c, G, t) {
    const ty = G.top.y;
    for (const sd of [-1, 1]) {
      c.save(); c.translate(sd * 92, ty + 18); c.rotate(sd * (0.38 + Math.sin(t * 3.2 + sd) * 0.06));
      c.fillStyle = '#7A4A2C'; c.beginPath(); c.ellipse(sd * 16, 62, 36, 76, 0, 0, TAU); c.fill();
      c.fillStyle = '#5E3820'; c.beginPath(); c.ellipse(sd * 18, 70, 20, 54, 0, 0, TAU); c.fill();
      c.restore();
    }
    const n = G.nose;
    c.fillStyle = '#231510'; c.beginPath(); c.ellipse(n.x, n.y - 4, 30, 21, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.ellipse(n.x - 9, n.y - 12, 10, 5, -0.3, 0, TAU); c.fill();
    c.fillStyle = 'rgba(60,32,20,0.55)';
    for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(n.x + sd * (40 + i * 11), n.y + 14 + (i % 2) * 8, 3.4, 0, TAU); c.fill(); }
    if (G.open > 0.2) {
      const m = G.mouth, L = 30 + G.open * 70, w = Math.sin(t * 9) * 4;
      c.fillStyle = '#FF6F8E';
      c.beginPath(); c.moveTo(m.x - 24, m.y); c.quadraticCurveTo(m.x - 30 + w, m.y + L, m.x + w * 0.5, m.y + L + 8); c.quadraticCurveTo(m.x + 30 + w, m.y + L, m.x + 24, m.y); c.closePath(); c.fill();
      c.strokeStyle = '#E04B6E'; c.lineWidth = 3; c.beginPath(); c.moveTo(m.x, m.y + 6); c.lineTo(m.x + w * 0.4, m.y + L - 4); c.stroke();
    }
  },
  kitty(c, G, t) {
    const ty = G.top.y;
    for (const sd of [-1, 1]) {
      c.save(); c.translate(sd * 78, ty + 12); c.rotate(sd * (0.3 + Math.sin(t * 2.6 + sd) * 0.04));
      c.fillStyle = '#F2A35E'; c.beginPath(); c.moveTo(-34, 22); c.lineTo(sd * 6, -78); c.lineTo(34, 22); c.closePath(); c.fill();
      c.fillStyle = '#FFB7C9'; c.beginPath(); c.moveTo(-18, 14); c.lineTo(sd * 4, -50); c.lineTo(18, 14); c.closePath(); c.fill();
      c.restore();
    }
    const n = G.nose;
    c.fillStyle = '#FF8FAE'; c.beginPath(); c.moveTo(n.x - 13, n.y - 8); c.lineTo(n.x + 13, n.y - 8); c.lineTo(n.x, n.y + 6); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(40,30,40,0.85)'; c.lineWidth = 3.4; c.lineCap = 'round';
    for (const sd of [-1, 1]) for (const dy of [-10, 4, 18]) { c.beginPath(); c.moveTo(n.x + sd * 34, n.y + 12 + dy * 0.3); c.quadraticCurveTo(n.x + sd * 80, n.y + 8 + dy, n.x + sd * 128, n.y + 2 + dy * 1.6); c.stroke(); }
  },
  bunny(c, G, t) {
    const ty = G.top.y;
    for (const sd of [-1, 1]) {
      c.save(); c.translate(sd * 46, ty + 10); c.rotate(sd * (0.18 + Math.sin(t * 2.4 + sd * 2) * 0.07));
      c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(0, -96, 30, 104, 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(0,0,0,0.12)'; c.lineWidth = 3; c.stroke();
      c.fillStyle = '#FFB3C7'; c.beginPath(); c.ellipse(0, -92, 15, 80, 0, 0, TAU); c.fill();
      c.restore();
    }
    const n = G.nose;
    c.fillStyle = '#FF8FAE'; c.beginPath(); c.ellipse(n.x, n.y - 4, 15, 11, 0, 0, TAU); c.fill();
    if (G.open > 0.15) { const m = G.lipU; c.fillStyle = '#FFFFFF'; c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 2; for (const sd of [-1, 1]) { c.beginPath(); c.rect(m.x + (sd < 0 ? -21 : 1), m.y - 2, 20, 26 + G.open * 6); c.fill(); c.stroke(); } }
  },
  bear(c, G) {
    const ty = G.top.y;
    for (const sd of [-1, 1]) { c.fillStyle = '#7A4E2D'; c.beginPath(); c.arc(sd * 104, ty + 8, 36, 0, TAU); c.fill(); c.fillStyle = '#C8915E'; c.beginPath(); c.arc(sd * 104, ty + 10, 19, 0, TAU); c.fill(); }
    const n = G.nose;
    c.fillStyle = 'rgba(232,201,160,0.75)'; c.beginPath(); c.ellipse(n.x, n.y + 22, 52, 38, 0, 0, TAU); c.fill();
    c.fillStyle = '#2E1C12'; c.beginPath(); c.ellipse(n.x, n.y - 2, 22, 15, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.ellipse(n.x - 7, n.y - 8, 7, 3.5, -0.3, 0, TAU); c.fill();
  },
  hearts(c, G, t) {
    const p = 1 + Math.sin(t * 6) * 0.08;
    for (const sd of [-1, 1]) {
      const x = sd * 50;
      c.save(); c.translate(x, 2); c.scale(p, p);
      c.fillStyle = '#FF3D6E'; heart(c, 0, 0, 78); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.ellipse(-14, -14, 9, 5, -0.6, 0, TAU); c.fill();
      c.restore();
    }
    for (let i = 0; i < 7; i++) {
      const ph = (t * 0.35 + i / 7) % 1, sd = i % 2 ? 1 : -1;
      const x = sd * (120 + Math.sin(t * 2 + i) * 18), y = G.top.y + 120 - ph * 260;
      c.save(); c.globalAlpha = Math.sin(ph * Math.PI); c.fillStyle = i % 3 ? '#FF6B95' : '#FFB3C7'; heart(c, x, y, 26 + (i % 3) * 6); c.fill(); c.restore();
    }
  },
  crown(c, G, t) {
    const y = G.top.y - 6;
    const g = c.createLinearGradient(0, y - 90, 0, y);
    g.addColorStop(0, '#FFE883'); g.addColorStop(1, '#F2A900');
    c.fillStyle = g; c.strokeStyle = '#B87900'; c.lineWidth = 4; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(-100, y); c.lineTo(-110, y - 70); c.lineTo(-58, y - 34); c.lineTo(0, y - 92); c.lineTo(58, y - 34); c.lineTo(110, y - 70); c.lineTo(100, y); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#F7C531'; c.fillRect(-100, y - 14, 200, 18); c.strokeRect(-100, y - 14, 200, 18);
    [['#E5484D', -52], ['#2F7BF5', 0], ['#22A55B', 52]].forEach(([col, x]) => { c.fillStyle = col; c.beginPath(); c.arc(x, y - 5, 8, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,0.6)'; c.beginPath(); c.arc(x - 2.5, y - 7.5, 2.6, 0, TAU); c.fill(); });
    [-110, 0, 110].forEach((x) => { c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(x, x === 0 ? y - 96 : y - 74, 7, 0, TAU); c.fill(); });
    for (let i = 0; i < 5; i++) { const a = (Math.sin(t * 3 + i * 1.7) + 1) / 2; sparkle(c, -130 + i * 65, y - 110 + (i % 2) * 30, 10 + a * 8, a); }
  },
  flowers(c, G, t) {
    const y0 = G.top.y + 26;
    const cols = ['#FF8FB1', '#FFFFFF', '#FFD166', '#C3A6FF', '#FF8FB1', '#FFFFFF', '#FFD166', '#C3A6FF', '#FF8FB1'];
    c.fillStyle = '#5FB86A';
    for (let i = 0; i < 8; i++) { const k = (i + 0.5) / 8, x = -120 + k * 240, y = y0 - Math.sin(k * Math.PI) * 44; c.beginPath(); c.ellipse(x, y + 4, 14, 7, k * 2 - 1, 0, TAU); c.fill(); }
    cols.forEach((col, i) => { const k = i / 8, x = -124 + k * 248, y = y0 - Math.sin(k * Math.PI) * 46; flower(c, x, y, 22 + (i % 2) * 5, col, t * 0.4 + i); });
  },
  shades(c, G) {
    const g = c.createLinearGradient(0, -30, 0, 30);
    g.addColorStop(0, '#2A2A33'); g.addColorStop(1, '#0E0E12');
    c.strokeStyle = '#0E0E12'; c.lineWidth = 6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-90, -8); c.lineTo(-128, -14); c.moveTo(90, -8); c.lineTo(128, -14); c.moveTo(-14, -6); c.quadraticCurveTo(0, -14, 14, -6); c.stroke();
    for (const sd of [-1, 1]) {
      c.fillStyle = g; c.beginPath(); c.roundRect ? c.roundRect(sd * 50 - 42, -28, 84, 58, 20) : c.rect(sd * 50 - 42, -28, 84, 58); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.22)'; c.beginPath(); c.moveTo(sd * 50 - 30, -22); c.lineTo(sd * 50 - 8, -22); c.lineTo(sd * 50 - 30, 14); c.closePath(); c.fill();
    }
  },
  nerd(c, G) {
    c.strokeStyle = '#2B2540'; c.lineWidth = 8;
    for (const sd of [-1, 1]) { c.beginPath(); c.arc(sd * 50, 2, 38, 0, TAU); c.stroke(); c.fillStyle = 'rgba(200,230,255,0.18)'; c.fill(); c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 4; c.beginPath(); c.arc(sd * 50 - 8, -6, 22, 3.6, 4.6); c.stroke(); c.strokeStyle = '#2B2540'; c.lineWidth = 8; }
    c.beginPath(); c.moveTo(-12, -2); c.quadraticCurveTo(0, -12, 12, -2); c.stroke();
    c.beginPath(); c.moveTo(-88, -2); c.lineTo(-122, -8); c.moveTo(88, -2); c.lineTo(122, -8); c.stroke();
    c.fillStyle = 'rgba(150,80,40,0.55)';
    for (const sd of [-1, 1]) for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(sd * (52 + (i % 3) * 12), 70 + Math.floor(i / 3) * 12 + (i % 2) * 4, 3, 0, TAU); c.fill(); }
  },
  blush(c, G, t) {
    for (const ch of [G.cheekL, G.cheekR]) {
      const g = c.createRadialGradient(ch.x, ch.y + 6, 0, ch.x, ch.y + 6, 46);
      g.addColorStop(0, 'rgba(255,110,140,0.5)'); g.addColorStop(1, 'rgba(255,110,140,0)');
      c.fillStyle = g; c.beginPath(); c.arc(ch.x, ch.y + 6, 46, 0, TAU); c.fill();
    }
    c.fillStyle = 'rgba(160,90,60,0.45)';
    for (const sd of [-1, 1]) for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(sd * (26 + i * 9), 52 + (i % 2) * 7, 2.6, 0, TAU); c.fill(); }
    for (let i = 0; i < 6; i++) { const a = (Math.sin(t * 2.6 + i * 1.3) + 1) / 2; sparkle(c, (i % 2 ? 1 : -1) * (90 + (i % 3) * 18), -40 + i * 18, 6 + a * 7, 0.4 + a * 0.6); }
  },
  devil(c, G, t) {
    const y = G.top.y + 18;
    const g = c.createRadialGradient(0, 30, 40, 0, 30, 220);
    g.addColorStop(0, 'rgba(255,40,40,0)'); g.addColorStop(1, 'rgba(255,40,40,0.18)');
    c.fillStyle = g; c.beginPath(); c.arc(0, 30, 220, 0, TAU); c.fill();
    for (const sd of [-1, 1]) {
      const hg = c.createLinearGradient(sd * 70, y, sd * 100, y - 90);
      hg.addColorStop(0, '#B3121F'); hg.addColorStop(1, '#FF5A5A');
      c.fillStyle = hg; c.beginPath(); c.moveTo(sd * 48, y + 6); c.quadraticCurveTo(sd * 70, y - 40, sd * (102 + Math.sin(t * 2) * 3), y - 96); c.quadraticCurveTo(sd * 96, y - 30, sd * 86, y + 10); c.closePath(); c.fill();
    }
  },
  angel(c, G, t) {
    const y = G.top.y - 52 + Math.sin(t * 2) * 6;
    c.save(); c.shadowColor = '#FFE27A'; c.shadowBlur = 24; c.strokeStyle = '#FFD84D'; c.lineWidth = 12; c.beginPath(); c.ellipse(0, y, 84, 20, 0, 0, TAU); c.stroke(); c.restore();
    c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 3; c.beginPath(); c.ellipse(0, y - 3, 78, 15, 0, Math.PI * 1.1, Math.PI * 1.7); c.stroke();
    for (let i = 0; i < 4; i++) { const a = (Math.sin(t * 2.2 + i * 1.6) + 1) / 2; sparkle(c, -110 + i * 74, y - 30 + (i % 2) * 18, 7 + a * 7, a); }
  },
  stars(c, G, t) {
    const y = G.top.y + 4;
    for (let i = 0; i < 5; i++) {
      const a = t * 2.4 + i / 5 * TAU, x = Math.cos(a) * 128, yy = y + Math.sin(a) * 26, s = 0.75 + (Math.sin(a) + 1) * 0.2;
      c.save(); c.translate(x, yy); c.scale(s, s); c.rotate(t * 3 + i);
      c.fillStyle = '#FFD84D'; star(c, 0, 0, 20); c.fill(); c.strokeStyle = '#E09A00'; c.lineWidth = 3; c.stroke();
      c.restore();
    }
  },
  mustache(c, G) {
    const n = G.nose, my = (n.y + G.lipU.y) / 2 + 4;
    c.fillStyle = '#2B1A12';
    for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(n.x, my - 6); c.bezierCurveTo(n.x + sd * 30, my - 22, n.x + sd * 62, my - 8, n.x + sd * 70, my + 6); c.bezierCurveTo(n.x + sd * 78, my + 18, n.x + sd * 92, my + 4, n.x + sd * 86, my - 8); c.bezierCurveTo(n.x + sd * 92, my + 14, n.x + sd * 60, my + 22, n.x, my + 8); c.closePath(); c.fill(); }
    const y = G.top.y + 6;
    c.fillStyle = '#1C1C22'; c.beginPath(); c.ellipse(0, y, 128, 22, 0, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(-80, y); c.bezierCurveTo(-84, y - 70, -50, y - 104, 0, y - 104); c.bezierCurveTo(50, y - 104, 84, y - 70, 80, y); c.closePath(); c.fill();
    c.fillStyle = '#8A2A2A'; c.fillRect(-80, y - 26, 160, 16);
  },
  clown(c, G) {
    const n = G.nose;
    const g = c.createRadialGradient(n.x - 8, n.y - 12, 2, n.x, n.y - 4, 30);
    g.addColorStop(0, '#FF8A8A'); g.addColorStop(1, '#D3121F');
    c.fillStyle = g; c.beginPath(); c.arc(n.x, n.y - 4, 28, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.ellipse(n.x - 9, n.y - 15, 8, 5, -0.4, 0, TAU); c.fill();
    for (const ch of [G.cheekL, G.cheekR]) { c.fillStyle = 'rgba(255,70,90,0.55)'; c.beginPath(); c.arc(ch.x, ch.y + 8, 22, 0, TAU); c.fill(); }
    const cols = ['#FF5A5A', '#FFC93C', '#5FD38D', '#5AB8FF', '#B07CFF'];
    for (const sd of [-1, 1]) for (let i = 0; i < 6; i++) { c.fillStyle = cols[(i + (sd > 0 ? 2 : 0)) % 5]; c.beginPath(); c.arc(sd * (112 + (i % 3) * 18), G.top.y + 20 + Math.floor(i / 3) * 26 - (i % 3) * 8, 22, 0, TAU); c.fill(); }
  },
  rainbow(c, G, t) {
    if (G.open < 0.25) return;
    const m = G.mouth, L = 80 + G.open * 340;
    const cols = ['#FF3B3B', '#FF9F1C', '#FFE14D', '#4CD964', '#2F9BFF', '#5856D6', '#B66DFF'];
    c.lineCap = 'round';
    cols.forEach((col, i) => {
      const off = (i - 3) * 9;
      c.strokeStyle = col; c.lineWidth = 11;
      c.beginPath();
      for (let s = 0; s <= 16; s++) { const k = s / 16, y = m.y + 6 + k * L, x = m.x + off * (0.6 + k * 1.6) + Math.sin(k * 6 - t * 8) * 10 * k; if (s) c.lineTo(x, y); else c.moveTo(x, y); }
      c.stroke();
    });
    for (let i = 0; i < 6; i++) { const ph = (t * 1.2 + i / 6) % 1; sparkle(c, m.x + Math.sin(i * 2.1) * 60 * ph, m.y + 20 + ph * L, 8, 1 - ph); }
  },
};
const BIG_EYES = 'bigeyes';
export const LENSES = [
  { k: 'puppy', name: 'Puppy', hint: 'Open your mouth' },
  { k: 'kitty', name: 'Kitty' },
  { k: 'bunny', name: 'Bunny', hint: 'Open your mouth' },
  { k: 'bear', name: 'Bear' },
  { k: 'hearts', name: 'Heart eyes' },
  { k: 'crown', name: 'Crown' },
  { k: 'flowers', name: 'Flower crown' },
  { k: 'shades', name: 'Cool shades' },
  { k: 'nerd', name: 'Glasses' },
  { k: 'blush', name: 'Blush' },
  { k: BIG_EYES, name: 'Big eyes' },
  { k: 'rainbow', name: 'Rainbow', hint: 'Open your mouth' },
  { k: 'stars', name: 'Dizzy' },
  { k: 'devil', name: 'Devil' },
  { k: 'angel', name: 'Angel' },
  { k: 'mustache', name: 'Gentleman' },
  { k: 'clown', name: 'Clown' },
];
export function drawLens(ctx, k, G, t) {
  const f = DRAW[k];
  if (!f || !G) return;
  ctx.save();
  ctx.translate(G.o.x, G.o.y); ctx.rotate(G.roll); ctx.scale(G.ed / 100, G.ed / 100);
  try { f(ctx, G, t); } catch {}
  ctx.restore();
}
export function drawBigEyes(ctx, G, src, cache) {
  if (!G || !src) return;
  const S = Math.round(G.ed * 0.62);
  if (S < 8) return;
  const T = cache.eye || (cache.eye = document.createElement('canvas'));
  const R = cache.eyeR || (cache.eyeR = document.createElement('canvas'));
  if (T.width !== S) { T.width = S; T.height = S; }
  const big = Math.round(S * 1.55);
  if (R.width !== big) { R.width = big; R.height = big; }
  const tc = T.getContext('2d'), rc = R.getContext('2d');
  for (const e of [G.sl, G.sr]) {
    tc.clearRect(0, 0, S, S);
    try { tc.drawImage(src, e.x - S / 2, e.y - S / 2, S, S, 0, 0, S, S); } catch { return; }
    rc.clearRect(0, 0, big, big);
    rc.globalCompositeOperation = 'source-over';
    rc.drawImage(T, 0, 0, big, big);
    rc.globalCompositeOperation = 'destination-in';
    const g = rc.createRadialGradient(big / 2, big / 2, big * 0.28, big / 2, big / 2, big / 2);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    rc.fillStyle = g; rc.fillRect(0, 0, big, big);
    rc.globalCompositeOperation = 'source-over';
    ctx.drawImage(R, e.x - big / 2, e.y - big / 2);
  }
}

const LENS_ICONS = {
  puppy: '<path d="M8.6 6.2C6 4.4 3 6 3.2 9.6c.2 2.6 1.4 4.6 3.2 5"/><path d="M15.4 6.2C18 4.4 21 6 20.8 9.6c-.2 2.6-1.4 4.6-3.2 5"/><path d="M7 10.5c0-2.6 2.2-4.3 5-4.3s5 1.7 5 4.3v3.3c0 3-2.2 5.2-5 5.2s-5-2.2-5-5.2z"/><ellipse cx="12" cy="13.6" rx="1.6" ry="1.1" fill="#fff" stroke="none"/><path d="M12 14.7v1.6"/>',
  kitty: '<path d="M5.5 11.5V4.8l4 3.2M18.5 11.5V4.8l-4 3.2"/><path d="M5.5 11.5C5.5 16 8.4 19 12 19s6.5-3 6.5-7.5c0-2.4-2.9-3.5-6.5-3.5s-6.5 1.1-6.5 3.5z"/><path d="M2.5 13.2l4 .4M2.8 16l3.8-1M21.5 13.2l-4 .4M21.2 16l-3.8-1"/>',
  bunny: '<path d="M9.4 9.8C8 8.4 7.4 2.6 9.2 2.4s2 5.4 1.8 7.2M14.6 9.8c1.4-1.4 2-7.2.2-7.4s-2 5.4-1.8 7.2"/><circle cx="12" cy="14.6" r="5.6"/><path d="M10.8 15.8l1.2.8 1.2-.8"/>',
  bear: '<circle cx="6.6" cy="7.4" r="2.6"/><circle cx="17.4" cy="7.4" r="2.6"/><circle cx="12" cy="13.4" r="6.4"/><ellipse cx="12" cy="15.4" rx="2.6" ry="2"/><circle cx="12" cy="14.7" r=".7" fill="#fff" stroke="none"/>',
  hearts: '<path d="M7 17.2S2.6 14.2 2.6 11c0-1.6 1.2-2.8 2.6-2.8 1 0 1.6.5 1.8 1.1.2-.6.9-1.1 1.8-1.1 1.4 0 2.6 1.2 2.6 2.8 0 3.2-4.4 6.2-4.4 6.2z" fill="#fff"/><path d="M17 17.2s-4.4-3-4.4-6.2c0-1.6 1.2-2.8 2.6-2.8 1 0 1.6.5 1.8 1.1.2-.6.9-1.1 1.8-1.1 1.4 0 2.6 1.2 2.6 2.8 0 3.2-4.4 6.2-4.4 6.2z" fill="#fff"/>',
  crown: '<path d="M4 17.5L3 7.5l5 4 4-6 4 6 5-4-1 10z"/><path d="M4.5 20h15"/>',
  flowers: '<circle cx="5.5" cy="13" r="1.3" fill="#fff"/><circle cx="12" cy="9.5" r="1.3" fill="#fff"/><circle cx="18.5" cy="13" r="1.3" fill="#fff"/><path d="M5.5 10.2v.4M5.5 15.4v.4M2.7 13h.4M7.9 13h.4M12 6.7v.4M12 11.9v.4M9.2 9.5h.4M14.4 9.5h.4M18.5 10.2v.4M18.5 15.4v.4M15.7 13h.4M20.9 13h.4"/><path d="M3.5 18c2.8-3 5.6-4.4 8.5-4.4s5.7 1.4 8.5 4.4"/>',
  shades: '<path d="M2.5 9.5h19"/><path d="M3.4 9.5h7.1v2.6c0 2-1.4 3.4-3.5 3.4S3.4 14 3.4 12z" fill="#fff"/><path d="M13.5 9.5h7.1v2.6c0 2-1.4 3.4-3.6 3.4s-3.5-1.4-3.5-3.4z" fill="#fff"/>',
  nerd: '<circle cx="7" cy="12" r="3.6"/><circle cx="17" cy="12" r="3.6"/><path d="M10.6 11.4c.9-.7 1.9-.7 2.8 0M3.4 11.2L2 10M20.6 11.2L22 10"/>',
  blush: '<ellipse cx="6.5" cy="13.5" rx="3" ry="1.8" fill="#fff" fill-opacity=".55" stroke="none"/><ellipse cx="17.5" cy="13.5" rx="3" ry="1.8" fill="#fff" fill-opacity=".55" stroke="none"/><path d="M5 13.4l1-1M7 14.4l1-1M16 13.4l1-1M18 14.4l1-1"/><path d="M12 4.5v3M10.5 6h3"/>',
  bigeyes: '<circle cx="7.2" cy="12" r="4.4"/><circle cx="16.8" cy="12" r="4.4"/><circle cx="8" cy="12.6" r="1.8" fill="#fff" stroke="none"/><circle cx="17.6" cy="12.6" r="1.8" fill="#fff" stroke="none"/>',
  rainbow: '<path d="M3 17a9 9 0 0 1 18 0"/><path d="M6.2 17a5.8 5.8 0 0 1 11.6 0"/><path d="M9.4 17a2.6 2.6 0 0 1 5.2 0"/>',
  stars: '<path d="M12 3.5l1.3 2.7 3 .4-2.2 2 .5 3-2.6-1.4-2.6 1.4.5-3-2.2-2 3-.4z"/><path d="M5.2 12.4l.8 1.6 1.7.3-1.2 1.2.3 1.7-1.6-.8-1.5.8.3-1.7-1.2-1.2 1.7-.3z"/><path d="M18.8 12.4l.8 1.6 1.7.3-1.2 1.2.3 1.7-1.6-.8-1.5.8.3-1.7-1.2-1.2 1.7-.3z"/><path d="M4 21c4-2.6 12-2.6 16 0"/>',
  devil: '<path d="M6.5 11.5C4 10.4 3 7.4 3.8 4c1.2 2.4 3.4 3.4 5.4 3.6"/><path d="M17.5 11.5c2.5-1.1 3.5-4.1 2.7-7.5-1.2 2.4-3.4 3.4-5.4 3.6"/><path d="M6.8 14.5c0-3 2.3-5.4 5.2-5.4s5.2 2.4 5.2 5.4"/>',
  angel: '<ellipse cx="12" cy="6" rx="6.4" ry="2.2"/><path d="M7.4 13.8c0-2.8 2-4.6 4.6-4.6s4.6 1.8 4.6 4.6v1.4"/><path d="M3 12.5c1.6.2 2.9 1.4 3.4 3M21 12.5c-1.6.2-2.9 1.4-3.4 3"/>',
  mustache: '<path d="M12 12.4c-1.2-2.2-3.6-3-5.6-1.8-1.4.8-2.2 2.4-3.9 2.2.8 2.6 3.6 3.6 6 2.8 1.6-.5 2.8-1.6 3.5-3.2.7 1.6 1.9 2.7 3.5 3.2 2.4.8 5.2-.2 6-2.8-1.7.2-2.5-1.4-3.9-2.2-2-1.2-4.4-.4-5.6 1.8z" fill="#fff"/>',
  clown: '<circle cx="12" cy="12" r="4.2" fill="#fff"/><path d="M4.5 6.5c1 .6 1.6 1.6 1.6 2.8M19.5 6.5c-1 .6-1.6 1.6-1.6 2.8M6.5 18.5c1.6 1.2 3.4 1.8 5.5 1.8s3.9-.6 5.5-1.8"/>',
};
const thumbCache = new Map();
export function lensThumb(k) {
  if (thumbCache.has(k)) return thumbCache.get(k);
  const body = LENS_ICONS[k] || LENS_ICONS.bigeyes;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 32 32" width="96" height="96"><g fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;
  const url = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  thumbCache.set(k, url);
  return url;
}
export { BIG_EYES, TAU, clamp };
