function rng(seed) {
  let h = 1779033703 ^ String(seed).length;
  for (let i = 0; i < String(seed).length; i++) { h = Math.imul(h ^ String(seed).charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
}

const BR = 14;
const CR = 27;
const DT = 1 / 240;
const MAXS = 6;
const VCAP = 640;
const SUB = 4;
const R = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

const HOLES = [
  { n: 'First tee', par: 2, out: R(300, 160, 700, 1400), tee: [500, 1270], cup: [500, 330], hills: [[500, 820, 120, 260]], blocks: [], bumps: [], water: [], sand: [], slopes: [] },
  { n: 'Dog leg', par: 3, out: [[210, 1400], [470, 1400], [470, 560], [820, 560], [820, 170], [210, 170]], tee: [340, 1280], cup: [700, 320], via: [[340, 360]], hills: [], blocks: [], bumps: [[470, 420, 30]], water: [], sand: [R(210, 170, 330, 260)], slopes: [{ p: R(210, 620, 470, 900), a: [-140, 0] }] },
  { n: 'The pond', par: 3, out: R(200, 150, 800, 1420), tee: [500, 1300], cup: [500, 290], via: [[300, 760]], hills: [], blocks: [], bumps: [[650, 470, 26], [350, 470, 26]], water: [[[400, 600], [690, 560], [770, 760], [680, 960], [420, 990], [380, 800]]], sand: [], slopes: [] },
  { n: 'Hillside', par: 2, out: R(260, 150, 740, 1420), tee: [610, 1300], cup: [380, 330], hills: [], blocks: [], bumps: [], water: [], sand: [R(600, 200, 740, 330)], slopes: [{ p: R(260, 560, 740, 980), a: [380, 0] }] },
  { n: 'Zig zag', par: 3, out: R(190, 120, 810, 1440), tee: [300, 1320], cup: [300, 270], via: [[720, 1030], [280, 640]], hills: [], blocks: [R(190, 980, 610, 1036), R(390, 590, 810, 646)], bumps: [[690, 820, 24]], water: [], sand: [], slopes: [] },
  { n: 'The bowl', par: 2, out: [[260, 1420], [740, 1420], [800, 760], [700, 200], [300, 200], [200, 760]], tee: [500, 1300], cup: [500, 560], hills: [[500, 560, 230, -320]], blocks: [], bumps: [], water: [], sand: [[[260, 300], [370, 260], [400, 360], [300, 410]], [[740, 300], [630, 260], [600, 360], [700, 410]]], slopes: [] },
  { n: 'Bank shot', par: 3, out: R(200, 140, 800, 1420), tee: [660, 1300], cup: [640, 380], via: [[270, 760]], hills: [], blocks: [R(330, 700, 800, 770)], bumps: [[470, 1030, 34]], water: [], sand: [R(200, 280, 330, 520)], slopes: [] },
  { n: 'Island green', par: 3, out: R(170, 130, 830, 1430), tee: [500, 1320], cup: [500, 360], via: [[500, 800]], hills: [[500, 360, 150, 120]], blocks: [], bumps: [], water: [R(170, 520, 440, 1080), R(560, 520, 830, 1080)], sand: [R(330, 180, 670, 230)], slopes: [] },
  { n: 'The long way', par: 4, out: [[170, 1430], [440, 1430], [440, 440], [560, 440], [560, 1430], [830, 1430], [830, 130], [170, 130]], tee: [305, 1310], cup: [695, 1190], via: [[305, 300], [695, 300]], hills: [[305, 820, 110, 200]], blocks: [], bumps: [[500, 250, 38]], water: [], sand: [R(560, 620, 830, 700)], slopes: [{ p: R(560, 960, 830, 1260), a: [0, 110] }] },
];

function segsOf(h) {
  const out = [];
  const add = (poly) => { for (let i = 0; i < poly.length; i++) { const a = poly[i]; const b = poly[(i + 1) % poly.length]; out.push([a[0], a[1], b[0], b[1]]); } };
  add(h.out);
  h.blocks.forEach(add);
  return out;
}
const SEGS = HOLES.map(segsOf);
function inPoly(poly, x, y) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0]; const yi = poly[i][1]; const xj = poly[j][0]; const yj = poly[j][1];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
function speedOf(p) {
  const q = clamp(p, 1, 1000) / 1000;
  return 60 + 2140 * (0.35 * q + 0.65 * q * q);
}

function simulate(hi, from, shot, coarse) {
  const H = HOLES[hi];
  const segs = SEGS[hi];
  const dt = coarse ? DT * 2 : DT;
  let x = from[0];
  let y = from[1];
  const n = Math.sqrt(shot[0] * shot[0] + shot[1] * shot[1]) || 1;
  const v0 = speedOf(shot[2]);
  let vx = (shot[0] / n) * v0;
  let vy = (shot[1] / n) * v0;
  const frames = coarse ? null : [[x, y]];
  const hits = coarse ? null : [];
  let holed = false;
  let water = false;
  let steps = 0;
  let slow = 0;
  const every = coarse ? 0 : SUB;
  const maxSteps = Math.round(14 / dt);
  for (steps = 0; steps < maxSteps; steps++) {
    let ax = 0;
    let ay = 0;
    for (const s of H.slopes) if (inPoly(s.p, x, y)) { ax += s.a[0]; ay += s.a[1]; }
    for (const hl of H.hills) {
      const dx = x - hl[0];
      const dy = y - hl[1];
      const d2 = dx * dx + dy * dy;
      const r2 = hl[2] * hl[2];
      if (d2 < r2 && d2 > 1) {
        const d = Math.sqrt(d2);
        const u = d / hl[2];
        const f = hl[3] * 4 * u * (1 - u * u) / 1.5396;
        ax += (dx / d) * f;
        ay += (dy / d) * f;
      }
    }
    let rollA = 290;
    let drag = 0.72;
    for (const sd of H.sand) if (inPoly(sd, x, y)) { rollA = 1700; drag = 2.6; }
    vx += ax * dt;
    vy += ay * dt;
    const sp = Math.sqrt(vx * vx + vy * vy);
    if (sp > 0) {
      const ns = sp - (rollA + drag * sp) * dt;
      const pull = Math.sqrt(ax * ax + ay * ay);
      if (ns <= 0 || (ns < 7 && pull < 120)) { vx = 0; vy = 0; } else { vx *= ns / sp; vy *= ns / sp; }
    }
    x += vx * dt;
    y += vy * dt;
    for (const sg of segs) {
      const ex = sg[2] - sg[0];
      const ey = sg[3] - sg[1];
      const L = ex * ex + ey * ey;
      let t = ((x - sg[0]) * ex + (y - sg[1]) * ey) / L;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const px = sg[0] + ex * t;
      const py = sg[1] + ey * t;
      const dx = x - px;
      const dy = y - py;
      const d2 = dx * dx + dy * dy;
      if (d2 >= BR * BR || d2 === 0) continue;
      const d = Math.sqrt(d2);
      const nx = dx / d;
      const ny = dy / d;
      x = px + nx * BR;
      y = py + ny * BR;
      const vn = vx * nx + vy * ny;
      if (vn < 0) {
        const tx = vx - vn * nx;
        const ty = vy - vn * ny;
        vx = tx * 0.95 - vn * 0.74 * nx;
        vy = ty * 0.95 - vn * 0.74 * ny;
        if (hits) hits.push([frames.length, Math.min(1, -vn / 1500)]);
      }
    }
    for (const b of H.bumps) {
      const dx = x - b[0];
      const dy = y - b[1];
      const rr = b[2] + BR;
      const d2 = dx * dx + dy * dy;
      if (d2 >= rr * rr || d2 === 0) continue;
      const d = Math.sqrt(d2);
      const nx = dx / d;
      const ny = dy / d;
      x = b[0] + nx * rr;
      y = b[1] + ny * rr;
      const vn = vx * nx + vy * ny;
      if (vn < 0) {
        vx -= 1.86 * vn * nx;
        vy -= 1.86 * vn * ny;
        if (hits) hits.push([frames.length, Math.min(1, -vn / 1200), 1]);
      }
    }
    for (const w of H.water) if (inPoly(w, x, y)) { water = true; break; }
    if (water) { if (frames) frames.push([x, y]); break; }
    const cx = x - H.cup[0];
    const cy = y - H.cup[1];
    const c2 = cx * cx + cy * cy;
    if (c2 < CR * CR) {
      const sp2 = Math.sqrt(vx * vx + vy * vy);
      const k = c2 / (CR * CR);
      if (sp2 < VCAP * (1 - 0.55 * k)) { holed = true; x = H.cup[0]; y = H.cup[1]; if (frames) frames.push([x, y]); break; }
      const c = Math.sqrt(c2) || 1;
      vx -= (cx / c) * 2600 * dt;
      vy -= (cy / c) * 2600 * dt;
      vx *= 0.994;
      vy *= 0.994;
    }
    if (frames && steps % every === every - 1) frames.push([x, y]);
    if (vx === 0 && vy === 0) break;
    if (vx * vx + vy * vy < 144) { slow += dt; if (slow > 0.35) { vx = 0; vy = 0; break; } } else slow = 0;
  }
  if (frames) frames.push([x, y]);
  const r2 = (v) => Math.round(v * 100) / 100;
  if (water) return { frames, end: [r2(from[0]), r2(from[1])], holed: false, water: true, hits, splash: [r2(x), r2(y)] };
  return { frames, end: [r2(x), r2(y)], holed, water: false, hits };
}

function putt(hi, from, shot) { return simulate(hi, from, shot, false); }
function playHole(hi, shots) {
  let at = HOLES[hi].tee.slice();
  let holed = false;
  const parts = [];
  for (let i = 0; i < shots.length && !holed; i++) {
    const r = putt(hi, at, shots[i]);
    parts.push(r);
    at = r.end;
    holed = r.holed;
  }
  return { holed, strokes: holed ? parts.length : MAXS + 1, parts, end: at };
}
function initial(t) { return { ...t, f: t.t, h: 1, sx: [], so: [], ls: null, lh: 0, lb: null, w: null, why: null }; }
function finishHole(st, shots, me) {
  const o = playHole(st.h - 1, shots);
  const mark = me === st.x ? 'x' : 'o';
  const sx = mark === 'x' ? st.sx.concat([o.strokes]) : st.sx.slice();
  const so = mark === 'o' ? st.so.concat([o.strokes]) : st.so.slice();
  const other = me === st.x ? st.o : st.x;
  const second = me !== st.f;
  const nh = second ? st.h + 1 : st.h;
  let w = null;
  if ((sx.length >= 9 && so.length >= 9) || (second && st.h >= 9)) {
    const a = sx.reduce((p, v) => p + v, 0);
    const b = so.reduce((p, v) => p + v, 0);
    w = a === b ? 'd' : a < b ? 'x' : 'o';
  }
  return { ...st, sx, so, h: w ? 9 : nh, t: w ? st.t : second ? st.f : other, n: (st.n || 0) + 1, ls: shots, lh: st.h, lb: me, w, why: w ? 'done' : null };
}

function pathLeft(H, pts, k0) {
  const way = (H.via || []).concat([H.cup]);
  let k = Math.max(0, Math.min(k0, way.length - 1));
  const [ex, ey] = pts;
  while (k < way.length - 1) {
    const dx = ex - way[k][0];
    const dy = ey - way[k][1];
    if (dx * dx + dy * dy < 140 * 140 || clearLine(H, ex, ey, way[k + 1][0], way[k + 1][1])) k += 1; else break;
  }
  let d = Math.sqrt((ex - way[k][0]) ** 2 + (ey - way[k][1]) ** 2);
  for (let i = k; i < way.length - 1; i++) d += Math.sqrt((way[i + 1][0] - way[i][0]) ** 2 + (way[i + 1][1] - way[i][1]) ** 2);
  return { d, k };
}
function clearLine(H, x0, y0, x1, y1) {
  const segs = SEGS[HOLES.indexOf(H)];
  for (const s of segs) if (crosses(x0, y0, x1, y1, s[0], s[1], s[2], s[3])) return false;
  for (const w of H.water) for (let i = 0; i < w.length; i++) { const a = w[i]; const b = w[(i + 1) % w.length]; if (crosses(x0, y0, x1, y1, a[0], a[1], b[0], b[1])) return false; }
  return true;
}
function crosses(ax, ay, bx, by, cx, cy, dx, dy) {
  const o = (px, py, qx, qy, rx, ry) => (qx - px) * (ry - py) - (qy - py) * (rx - px);
  const d1 = o(ax, ay, bx, by, cx, cy);
  const d2 = o(ax, ay, bx, by, dx, dy);
  const d3 = o(cx, cy, dx, dy, ax, ay);
  const d4 = o(cx, cy, dx, dy, bx, by);
  return ((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0));
}
function shotAt(deg, p) {
  const a = (deg * Math.PI) / 180;
  return [Math.round(Math.cos(a) * 1e6), Math.round(Math.sin(a) * 1e6), Math.round(clamp(p, 1, 1000))];
}
function findPutt(hi, from, k0 = 0) {
  const H = HOLES[hi];
  const way = (H.via || []).concat([H.cup]);
  let k = Math.min(k0, way.length - 1);
  while (k < way.length - 1 && clearLine(H, from[0], from[1], way[k + 1][0], way[k + 1][1])) k += 1;
  const tgt = way[k];
  const base = (Math.atan2(tgt[1] - from[1], tgt[0] - from[0]) * 180) / Math.PI;
  let best = { d: Infinity, deg: base, p: 400, k };
  const test = (deg, p, coarse) => {
    const r = simulate(hi, from, shotAt(deg, p), coarse);
    if (r.holed) return { d: -1, deg, p, k: way.length - 1, holed: true };
    if (r.water) return { d: 1e9, deg, p, k };
    const left = pathLeft(H, r.end, k);
    return { d: left.d - left.k * 1000, deg, p, k: left.k };
  };
  for (let da = -60; da <= 60; da += 3) {
    for (let p = 60; p <= 1000; p += 35) {
      const r = test(base + da, p, true);
      if (r.d < best.d) best = r;
    }
  }
  let fine = { d: Infinity, deg: best.deg, p: best.p };
  for (let da = -3; da <= 3; da += 0.5) {
    for (let dp = -40; dp <= 40; dp += 8) {
      const r = test(best.deg + da, clamp(best.p + dp, 1, 1000), false);
      if (r.holed) return { shot: shotAt(r.deg, r.p), k: r.k, holed: true };
      if (r.d < fine.d) fine = r;
    }
  }
  return { shot: shotAt(fine.deg, fine.p), k: fine.k || k, holed: false };
}
function botHole(hi, lv, seed) {
  const r = rng(`golfbot:${seed}:${hi}`);
  const noiseA = lv <= 1 ? 6 : lv === 2 ? 3.4 : 1.1;
  const noiseP = lv <= 1 ? 0.13 : lv === 2 ? 0.085 : 0.025;
  const shots = [];
  let at = HOLES[hi].tee.slice();
  let k = 0;
  for (let i = 0; i < MAXS; i++) {
    const f = findPutt(hi, at, k);
    const deg = (Math.atan2(f.shot[1], f.shot[0]) * 180) / Math.PI + (r() * 2 - 1) * noiseA;
    const p = clamp(f.shot[2] * (1 + (r() * 2 - 1) * noiseP), 1, 1000);
    const shot = shotAt(deg, p);
    const res = putt(hi, at, shot);
    shots.push(shot);
    if (res.holed) break;
    at = res.end;
    k = pathLeft(HOLES[hi], at, k).k;
  }
  return shots;
}

function bboxOf(H) {
  let x0 = Infinity; let y0 = Infinity; let x1 = -Infinity; let y1 = -Infinity;
  H.out.forEach(([x, y]) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); });
  return [x0 - 70, y0 - 70, x1 + 70, y1 + 70];
}
function viewOf(hi, w, h) {
  const [x0, y0, x1, y1] = bboxOf(HOLES[hi]);
  const sc = Math.min(w / (x1 - x0), h / (y1 - y0));
  return { sc, ox: (w - (x1 - x0) * sc) / 2 - x0 * sc, oy: (h - (y1 - y0) * sc) / 2 - y0 * sc };
}
const ART = new Map();
const dprOf = () => Math.min(2.5, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
function trace(ctx, poly, v) { ctx.beginPath(); poly.forEach(([x, y], i) => (i ? ctx.lineTo(v.ox + x * v.sc, v.oy + y * v.sc) : ctx.moveTo(v.ox + x * v.sc, v.oy + y * v.sc))); ctx.closePath(); }
function noiseFill(ctx, w, h, r, amt, light) {
  const n = Math.round((w * h) / 26);
  ctx.fillStyle = light ? `rgba(255,255,255,${amt})` : `rgba(0,0,0,${amt})`;
  for (let i = 0; i < n; i++) ctx.fillRect(r() * w, r() * h, 1, 1);
}
function shrub(ctx, x, y, s, r) {
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath(); ctx.ellipse(x + s * 0.18, y + s * 0.28, s * 1.05, s * 0.75, 0, 0, Math.PI * 2); ctx.fill();
  const tones = ['#1F5A33', '#26693C', '#2E7A45', '#378A4E'];
  for (let i = 0; i < 7; i++) {
    const a = r() * Math.PI * 2;
    const d = r() * s * 0.5;
    const rr = s * (0.45 + r() * 0.35);
    ctx.fillStyle = tones[Math.floor(r() * tones.length)];
    ctx.beginPath(); ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, rr, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath(); ctx.arc(x - s * 0.25, y - s * 0.3, s * 0.4, 0, Math.PI * 2); ctx.fill();
  if (r() < 0.45) {
    const fc = ['#F6D365', '#F28AB2', '#FFFFFF', '#F59E62'][Math.floor(r() * 4)];
    for (let i = 0; i < 6; i++) { ctx.fillStyle = fc; ctx.beginPath(); ctx.arc(x + (r() - 0.5) * s * 1.3, y + (r() - 0.5) * s, Math.max(1, s * 0.07), 0, Math.PI * 2); ctx.fill(); }
  }
}
function rock(ctx, x, y, s, r) {
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(x + s * 0.2, y + s * 0.3, s, s * 0.6, 0, 0, Math.PI * 2); ctx.fill();
  const g = ctx.createLinearGradient(x - s, y - s, x + s, y + s);
  g.addColorStop(0, '#B9B4A8'); g.addColorStop(1, '#6E6A62');
  ctx.fillStyle = g;
  ctx.beginPath();
  for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; const d = s * (0.75 + r() * 0.3); const px = x + Math.cos(a) * d; const py = y + Math.sin(a) * d * 0.7; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
  ctx.closePath(); ctx.fill();
}
function courseArt(hi, w, h) {
  const dpr = dprOf();
  const key = `${hi}:${w}:${h}:${dpr}`;
  if (ART.has(key)) return ART.get(key);
  const H = HOLES[hi];
  const v = viewOf(hi, w, h);
  const cv = document.createElement('canvas');
  cv.width = Math.max(1, Math.round(w * dpr));
  cv.height = Math.max(1, Math.round(h * dpr));
  const ctx = cv.getContext('2d');
  ctx.scale(dpr, dpr);
  const r = rng(`golfart:${hi}`);
  const bg = ctx.createRadialGradient(w * 0.5, h * 0.42, 10, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
  bg.addColorStop(0, '#2C6B3E'); bg.addColorStop(1, '#173D25');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  noiseFill(ctx, w, h, r, 0.05, false);
  noiseFill(ctx, w, h, r, 0.035, true);
  const S = v.sc;
  const inside = (x, y) => inPoly(H.out, (x - v.ox) / S, (y - v.oy) / S);
  const near = (x, y) => { for (let a = 0; a < 8; a++) { const ang = (a / 8) * Math.PI * 2; if (inside(x + Math.cos(ang) * 40 * S + Math.cos(ang) * 14, y + Math.sin(ang) * 40 * S + Math.sin(ang) * 14)) return true; } return inside(x, y); };
  for (let i = 0; i < 70; i++) {
    const x = r() * w; const y = r() * h;
    if (near(x, y)) continue;
    if (r() < 0.22) rock(ctx, x, y, 6 + r() * 10, r); else shrub(ctx, x, y, 10 + r() * 16, r);
  }
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  const fadeTop = ctx.createLinearGradient(0, 0, 0, 44);
  fadeTop.addColorStop(0, 'rgba(0,0,0,1)'); fadeTop.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = fadeTop; ctx.fillRect(0, 0, w, 44);
  ctx.restore();
  ctx.save();
  trace(ctx, H.out, v);
  ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 10;
  ctx.lineJoin = 'round'; ctx.lineWidth = 30 * S + 8; ctx.strokeStyle = '#5A3A22'; ctx.stroke();
  ctx.restore();
  trace(ctx, H.out, v);
  ctx.lineJoin = 'round'; ctx.lineWidth = 30 * S + 8;
  const wood = ctx.createLinearGradient(0, 0, w, h);
  wood.addColorStop(0, '#B07A4A'); wood.addColorStop(0.5, '#93633A'); wood.addColorStop(1, '#7A4F2C');
  ctx.strokeStyle = wood; ctx.stroke();
  trace(ctx, H.out, v);
  ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,230,190,0.45)'; ctx.stroke();
  ctx.save();
  trace(ctx, H.out, v);
  ctx.clip();
  const turf = ctx.createLinearGradient(0, v.oy + 100 * S, 0, v.oy + 1450 * S);
  turf.addColorStop(0, '#4DB86A'); turf.addColorStop(1, '#2F9550');
  ctx.fillStyle = turf; ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.translate(w / 2, h / 2); ctx.rotate(-0.28); ctx.translate(-w, -h);
  for (let y = 0; y < h * 2; y += 34) { ctx.fillStyle = (y / 34) % 2 ? 'rgba(255,255,255,0.055)' : 'rgba(0,0,0,0.035)'; ctx.fillRect(0, y, w * 2, 17); }
  ctx.restore();
  noiseFill(ctx, w, h, r, 0.06, false);
  noiseFill(ctx, w, h, r, 0.05, true);
  H.slopes.forEach((s) => {
    const xs = s.p.map((p) => p[0]); const ys = s.p.map((p) => p[1]);
    const x0 = Math.min(...xs); const x1 = Math.max(...xs); const y0 = Math.min(...ys); const y1 = Math.max(...ys);
    const len = Math.sqrt(s.a[0] * s.a[0] + s.a[1] * s.a[1]) || 1;
    const ux = s.a[0] / len; const uy = s.a[1] / len;
    const cx = (x0 + x1) / 2; const cy = (y0 + y1) / 2;
    const span = Math.max(x1 - x0, y1 - y0) / 2;
    const g = ctx.createLinearGradient(v.ox + (cx - ux * span) * S, v.oy + (cy - uy * span) * S, v.ox + (cx + ux * span) * S, v.oy + (cy + uy * span) * S);
    g.addColorStop(0, 'rgba(255,255,255,0.13)'); g.addColorStop(1, 'rgba(0,30,10,0.22)');
    trace(ctx, s.p, v); ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (let gx = x0 + 45; gx < x1; gx += 90) {
      for (let gy = y0 + 45; gy < y1; gy += 90) {
        const px = v.ox + gx * S; const py = v.oy + gy * S; const k = 9;
        ctx.beginPath();
        ctx.moveTo(px - ux * k - uy * k * 0.8, py - uy * k + ux * k * 0.8);
        ctx.lineTo(px + ux * k * 0.4, py + uy * k * 0.4);
        ctx.lineTo(px - ux * k + uy * k * 0.8, py - uy * k - ux * k * 0.8);
        ctx.stroke();
      }
    }
  });
  H.hills.forEach(([hx, hy, hr, hs]) => {
    const px = v.ox + hx * S; const py = v.oy + hy * S; const pr = hr * S;
    const g = ctx.createRadialGradient(px - pr * 0.3 * Math.sign(hs), py - pr * 0.35 * Math.sign(hs), pr * 0.05, px, py, pr);
    if (hs > 0) { g.addColorStop(0, 'rgba(255,255,255,0.2)'); g.addColorStop(0.6, 'rgba(255,255,255,0.04)'); g.addColorStop(1, 'rgba(0,30,10,0.0)'); } else { g.addColorStop(0, 'rgba(0,30,10,0.3)'); g.addColorStop(0.7, 'rgba(0,30,10,0.1)'); g.addColorStop(1, 'rgba(255,255,255,0.0)'); }
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fill();
    const sh = ctx.createRadialGradient(px - pr * 0.25 * Math.sign(hs), py - pr * 0.3 * Math.sign(hs), pr * 0.55, px, py, pr);
    sh.addColorStop(0, 'rgba(0,30,10,0)'); sh.addColorStop(1, hs > 0 ? 'rgba(0,30,10,0.16)' : 'rgba(255,255,255,0.1)');
    ctx.fillStyle = sh; ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fill();
  });
  H.sand.forEach((poly) => {
    ctx.save();
    trace(ctx, poly, v);
    ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
    ctx.fillStyle = '#E3C98C'; ctx.fill();
    ctx.restore();
    ctx.save(); trace(ctx, poly, v); ctx.clip();
    const sg = ctx.createLinearGradient(0, v.oy + Math.min(...poly.map((p) => p[1])) * S, 0, v.oy + Math.max(...poly.map((p) => p[1])) * S);
    sg.addColorStop(0, '#F0DCA8'); sg.addColorStop(1, '#D6B877');
    ctx.fillStyle = sg; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 400; i++) { ctx.fillStyle = r() < 0.5 ? 'rgba(120,90,40,0.22)' : 'rgba(255,255,255,0.35)'; ctx.fillRect(r() * w, r() * h, 1.2, 1.2); }
    ctx.strokeStyle = 'rgba(150,115,60,0.25)'; ctx.lineWidth = 1.2;
    for (let k = 0; k < 6; k++) { const yy = r() * h; ctx.beginPath(); ctx.moveTo(0, yy); ctx.bezierCurveTo(w * 0.3, yy - 10, w * 0.6, yy + 10, w, yy); ctx.stroke(); }
    ctx.restore();
  });
  H.water.forEach((poly) => {
    ctx.save(); trace(ctx, poly, v); ctx.clip();
    const ys = poly.map((p) => p[1]);
    const wg = ctx.createLinearGradient(0, v.oy + Math.min(...ys) * S, 0, v.oy + Math.max(...ys) * S);
    wg.addColorStop(0, '#3C9BD6'); wg.addColorStop(1, '#1D5F9E');
    ctx.fillStyle = wg; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    for (let i = 0; i < 26; i++) { const x = r() * w; const y = r() * h; const L = 8 + r() * 16; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + L / 2, y - 3, x + L, y); ctx.stroke(); }
    ctx.restore();
    ctx.save(); trace(ctx, poly, v); ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(10,40,70,0.35)'; ctx.stroke(); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(220,240,255,0.5)'; ctx.stroke(); ctx.restore();
  });
  const [tx, ty] = H.tee;
  ctx.fillStyle = 'rgba(10,50,25,0.55)';
  if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(v.ox + (tx - 60) * S, v.oy + (ty - 38) * S, 120 * S, 76 * S, 10 * S); ctx.fill(); } else ctx.fillRect(v.ox + (tx - 60) * S, v.oy + (ty - 38) * S, 120 * S, 76 * S);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath(); ctx.arc(v.ox + (tx - 46) * S, v.oy + ty * S, 4 * S + 1, 0, Math.PI * 2); ctx.arc(v.ox + (tx + 46) * S, v.oy + ty * S, 4 * S + 1, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  H.blocks.forEach((poly) => {
    ctx.save(); trace(ctx, poly, v);
    ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 10; ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 6;
    ctx.fillStyle = '#7A4F2C'; ctx.fill(); ctx.restore();
    ctx.save(); trace(ctx, poly, v); ctx.clip();
    const bg2 = ctx.createLinearGradient(0, 0, w, h); bg2.addColorStop(0, '#B98352'); bg2.addColorStop(1, '#8A5A33');
    ctx.fillStyle = bg2; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(60,30,10,0.25)'; ctx.lineWidth = 1;
    for (let k = 0; k < 40; k++) { const y = r() * h; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y + (r() - 0.5) * 6); ctx.stroke(); }
    ctx.restore();
    trace(ctx, poly, v); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,230,190,0.5)'; ctx.stroke();
  });
  H.bumps.forEach(([bx, by, brr]) => {
    const px = v.ox + bx * S; const py = v.oy + by * S; const pr = brr * S;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(px + pr * 0.15, py + pr * 0.35, pr * 1.02, pr * 0.9, 0, 0, Math.PI * 2); ctx.fill();
    const g = ctx.createRadialGradient(px - pr * 0.35, py - pr * 0.4, pr * 0.1, px, py, pr);
    g.addColorStop(0, '#FF8F86'); g.addColorStop(0.55, '#E4413A'); g.addColorStop(1, '#9E1F1A');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = Math.max(1.5, pr * 0.16); ctx.beginPath(); ctx.arc(px, py, pr * 0.62, 0, Math.PI * 2); ctx.stroke();
  });
  const [cx, cy] = H.cup;
  const pcx = v.ox + cx * S; const pcy = v.oy + cy * S; const pr = CR * S;
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.arc(pcx, pcy, pr * 1.9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#F2F2EA'; ctx.beginPath(); ctx.arc(pcx, pcy, pr + 1.6, 0, Math.PI * 2); ctx.fill();
  const hg = ctx.createRadialGradient(pcx, pcy + pr * 0.45, pr * 0.1, pcx, pcy, pr);
  hg.addColorStop(0, '#2B2620'); hg.addColorStop(1, '#050403');
  ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(pcx, pcy, pr, 0, Math.PI * 2); ctx.fill();
  const out = { cv, v, w, h };
  if (ART.size > 6) ART.delete(ART.keys().next().value);
  ART.set(key, out);
  return out;
}

function drawFlag(ctx, v, H, t, near) {
  const [cx, cy] = H.cup;
  const px = v.ox + cx * v.sc;
  const py = v.oy + cy * v.sc;
  const len = Math.max(42, 150 * v.sc);
  const lift = near ? Math.min(1, near) : 0;
  ctx.save();
  ctx.globalAlpha = 1 - lift * 0.75;
  ctx.strokeStyle = 'rgba(0,0,0,0.16)'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(px + 2, py + 1); ctx.lineTo(px + len * 0.42, py + len * 0.2); ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath(); ctx.ellipse(px + len * 0.52, py + len * 0.22, len * 0.13, len * 0.05, 0.4, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#F7F5EE'; ctx.lineWidth = 2.6;
  ctx.beginPath(); ctx.moveTo(px, py - lift * 10); ctx.lineTo(px, py - len - lift * 10); ctx.stroke();
  const top = py - len - lift * 10;
  const wv = Math.sin(t / 240) * 4;
  const fl = len * 0.42;
  ctx.fillStyle = '#E4413A';
  ctx.beginPath();
  ctx.moveTo(px, top);
  ctx.bezierCurveTo(px + fl * 0.35, top - 3 + wv, px + fl * 0.7, top + 3 - wv, px + fl, top + 2 + wv * 0.6);
  ctx.lineTo(px + fl * 0.96, top + len * 0.17 + wv * 0.6);
  ctx.bezierCurveTo(px + fl * 0.65, top + len * 0.18 - wv, px + fl * 0.32, top + len * 0.14 + wv, px, top + len * 0.17);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath(); ctx.moveTo(px, top); ctx.lineTo(px + fl * 0.5, top + 1 + wv * 0.5); ctx.lineTo(px, top + len * 0.07); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function drawBall(ctx, v, x, y, trail, sink) {
  const px = v.ox + x * v.sc;
  const py = v.oy + y * v.sc;
  const rr = Math.max(4, BR * v.sc) * (1 - (sink || 0) * 0.45);
  if (trail && trail.length > 1) {
    ctx.lineCap = 'round';
    for (let i = 1; i < trail.length; i++) {
      const a = i / trail.length;
      ctx.strokeStyle = `rgba(255,255,255,${0.22 * a})`;
      ctx.lineWidth = rr * 1.4 * a;
      ctx.beginPath(); ctx.moveTo(v.ox + trail[i - 1][0] * v.sc, v.oy + trail[i - 1][1] * v.sc); ctx.lineTo(v.ox + trail[i][0] * v.sc, v.oy + trail[i][1] * v.sc); ctx.stroke();
    }
  }
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.beginPath(); ctx.ellipse(px + rr * 0.35, py + rr * 0.5, rr * 1.05, rr * 0.8, 0.3, 0, Math.PI * 2); ctx.fill();
  const g = ctx.createRadialGradient(px - rr * 0.38, py - rr * 0.42, rr * 0.1, px, py, rr);
  g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.65, '#F1F0EC'); g.addColorStop(1, '#B9B7B0');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, rr, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(120,118,110,0.22)';
  for (let i = 0; i < 6; i++) { const a = i * 1.05 + 0.4; ctx.beginPath(); ctx.arc(px + Math.cos(a) * rr * 0.5, py + Math.sin(a) * rr * 0.5, rr * 0.11, 0, Math.PI * 2); ctx.fill(); }
}
function drawAim(ctx, v, x, y, aim) {
  const px = v.ox + x * v.sc;
  const py = v.oy + y * v.sc;
  const rr = Math.max(4, BR * v.sc);
  const p = aim.p;
  const len = 26 + p * 170;
  const col = p < 0.5 ? mixHex('#5BE38A', '#FACC15', p * 2) : mixHex('#FACC15', '#EF4444', (p - 0.5) * 2);
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 3; ctx.setLineDash([1, 8]); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(px + aim.ux * rr * 1.6, py + aim.uy * rr * 1.6); ctx.lineTo(px + aim.ux * len, py + aim.uy * len); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.moveTo(px + aim.ux * (len + 13), py + aim.uy * (len + 13)); ctx.lineTo(px + aim.ux * len - aim.uy * 8, py + aim.uy * len + aim.ux * 8); ctx.lineTo(px + aim.ux * len + aim.uy * 8, py + aim.uy * len - aim.ux * 8); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.arc(px, py, rr + 12, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p); ctx.stroke();
  ctx.strokeStyle = col; ctx.lineWidth = 4.5;
  ctx.beginPath(); ctx.arc(px, py, rr + 12, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p); ctx.stroke();
  if (aim.drag) {
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - aim.ux * aim.drag, py - aim.uy * aim.drag); ctx.stroke();
  }
  ctx.restore();
}
function mixHex(a, b, t) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * clamp(t, 0, 1)));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

function mount(host, opts) {
  const cv = document.createElement('canvas');
  cv.style.display = 'block';
  cv.style.touchAction = 'none';
  cv.style.width = '100%';
  cv.style.height = '100%';
  host.appendChild(cv);
  let o = { ...opts };
  let ctx = null;
  let W = 0;
  let Hh = 0;
  let ball = HOLES[o.hole].tee.slice();
  let aim = null;
  let drag = null;
  let anim = null;
  let raf = 0;
  let dead = false;
  let trail = [];
  let sink = 0;
  let splash = null;
  let idleRaf = 0;
  const art = () => courseArt(o.hole, W, Hh);
  const draw = (t) => {
    if (!ctx || dead) return;
    const a = art();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(a.cv, 0, 0, cv.width, cv.height);
    const d = dprOf();
    ctx.setTransform(d, 0, 0, d, 0, 0);
    const H = HOLES[o.hole];
    const dx = ball[0] - H.cup[0];
    const dy = ball[1] - H.cup[1];
    const near = Math.sqrt(dx * dx + dy * dy) < 220 ? 1 - Math.sqrt(dx * dx + dy * dy) / 220 : 0;
    if (o.ghost) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(a.v.ox + o.ghost[0] * a.v.sc, a.v.oy + o.ghost[1] * a.v.sc, Math.max(4, BR * a.v.sc), 0, Math.PI * 2); ctx.fill(); }
    if (splash) {
      const k = splash.k;
      ctx.strokeStyle = `rgba(255,255,255,${0.8 * (1 - k)})`; ctx.lineWidth = 2.5;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(a.v.ox + splash.x * a.v.sc, a.v.oy + splash.y * a.v.sc, (6 + k * 34 + i * 9) * Math.max(0.5, a.v.sc * 2.4), 0, Math.PI * 2); ctx.stroke(); }
    }
    if (!o.gone && sink < 1) {
      if (aim && o.canPutt && !anim) drawAim(ctx, a.v, ball[0], ball[1], aim);
      drawBall(ctx, a.v, ball[0], ball[1], anim ? trail : null, sink);
    }
    drawFlag(ctx, a.v, H, t || performance.now(), anim ? near : 0);
  };
  const idle = () => {
    if (dead) return;
    if (!anim && typeof document !== 'undefined' && document.visibilityState !== 'hidden') draw(performance.now());
    idleRaf = setTimeout(() => { requestAnimationFrame(idle); }, 120);
  };
  const resize = () => {
    const b = host.getBoundingClientRect();
    W = Math.max(120, Math.floor(b.width));
    Hh = Math.max(160, Math.floor(b.height));
    const d = dprOf();
    cv.width = Math.round(W * d);
    cv.height = Math.round(Hh * d);
    ctx = cv.getContext('2d');
    draw();
  };
  const toCourse = (e) => {
    const b = cv.getBoundingClientRect();
    const v = viewOf(o.hole, W, Hh);
    return [(e.clientX - b.left - v.ox) / v.sc, (e.clientY - b.top - v.oy) / v.sc, v.sc];
  };
  const down = (e) => {
    if (!o.canPutt || anim) return;
    try { cv.setPointerCapture(e.pointerId); } catch {}
    const [x, y] = toCourse(e);
    drag = { id: e.pointerId, x, y };
  };
  const move = (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    const [x, y, sc] = toCourse(e);
    const dx = drag.x - x;
    const dy = drag.y - y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d * sc < 10) { aim = null; draw(); return; }
    const p = clamp(d / 560, 0.02, 1);
    aim = { ux: dx / d, uy: dy / d, p, drag: Math.min(d * sc, 120) };
    if (o.onAim) o.onAim(p);
    draw();
  };
  const up = (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    drag = null;
    if (aim && o.canPutt && !anim) {
      const shot = [Math.round(aim.ux * 1e6), Math.round(aim.uy * 1e6), Math.round(aim.p * 1000)];
      aim = null;
      draw();
      if (o.onPutt) o.onPutt(shot);
    } else { aim = null; draw(); }
  };
  const cancel = () => { drag = null; aim = null; draw(); };
  cv.addEventListener('pointerdown', down);
  cv.addEventListener('pointermove', move);
  cv.addEventListener('pointerup', up);
  cv.addEventListener('pointercancel', cancel);
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => resize()) : null;
  if (ro) ro.observe(host);
  let gen = 0;
  const run = (parts, done) => {
    const my = ++gen;
    let idx = 0;
    const next = () => {
      if (dead || my !== gen) return;
      if (idx >= parts.length) { anim = null; trail = []; draw(); if (done) done(); return; }
      const part = parts[idx++];
      anim = part;
      trail = [];
      sink = 0;
      let t0 = 0;
      let hi = 0;
      const step = (now) => {
        if (dead || my !== gen) return;
        if (!t0) t0 = now;
        const f = Math.min(part.frames.length - 1, Math.floor(((now - t0) / 1000) * 60));
        ball = part.frames[f];
        trail.push(ball);
        if (trail.length > 9) trail.shift();
        while (hi < part.hits.length && part.hits[hi][0] <= f) { if (o.onHit) o.onHit(part.hits[hi][1], part.hits[hi][2]); hi += 1; }
        draw(now);
        if (f >= part.frames.length - 1) {
          if (part.holed) {
            if (o.onHoled) o.onHoled();
            const s0 = now;
            const sinkStep = (n2) => { if (dead || my !== gen) return; sink = Math.min(1, (n2 - s0) / 260); draw(n2); if (sink < 1) raf = requestAnimationFrame(sinkStep); else setTimeout(next, 240); };
            raf = requestAnimationFrame(sinkStep);
            return;
          }
          if (part.water) {
            if (o.onWater) o.onWater();
            splash = { x: part.splash[0], y: part.splash[1], k: 0 };
            const s0 = now;
            const spl = (n2) => { if (dead || my !== gen) return; splash.k = Math.min(1, (n2 - s0) / 700); ball = part.end; o.gone = splash.k < 0.6; draw(n2); if (splash.k < 1) raf = requestAnimationFrame(spl); else { splash = null; o.gone = false; setTimeout(next, 120); } };
            raf = requestAnimationFrame(spl);
            return;
          }
          ball = part.end;
          setTimeout(next, 320);
          return;
        }
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    next();
  };
  const api = {
    set(p) {
      const prev = o.hole;
      o = { ...o, ...p };
      if (p.hole != null && p.hole !== prev) { ball = HOLES[o.hole].tee.slice(); sink = 0; }
      if (p.ball) { ball = p.ball.slice(); sink = 0; }
      draw();
    },
    animate(parts, done) { cancelAnimationFrame(raf); run(parts, done); },
    busy() { return !!anim; },
    ball() { return ball.slice(); },
    destroy() { dead = true; gen += 1; cancelAnimationFrame(raf); clearTimeout(idleRaf); if (ro) ro.disconnect(); cv.remove(); },
  };
  resize();
  idle();
  return api;
}

export const GOLF = { HOLES, MAXS, BR, CR, putt, playHole, initial, finishHole, findPutt, botHole, mount };
