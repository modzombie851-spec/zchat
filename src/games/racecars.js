import { MeshBuilder, hexRgb } from './race3d.js';

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const toRgb = (c) => (typeof c === 'string' ? hexRgb(c) : c);
const shade = (c, k) => { const a = toRgb(c); return k < 0 ? a.map((v) => v * (1 + k)) : a.map((v) => v + (1 - v) * k); };
export const MAT = { paint: 0.553, paintFlat: 0.551, glass: 0.665, chrome: 0.705, alloy: 0.72, metal: 0.745, plastic: 0.14, trim: 0.22, rubber: 0.01, matte: 0, light: 1, glow: 0.92 };
const DARK = '#141518';
const TRIM = '#1D1F23';
const GLASS = '#121A24';
const CHROME = '#D9DDE3';
const HEAD = '#FFF6DC';
const TAIL = '#FF2A22';

function keyAt(keys, z, f) {
  if (z <= keys[0].z) return keys[0][f];
  const n = keys.length;
  if (z >= keys[n - 1].z) return keys[n - 1][f];
  let i = 0;
  while (i < n - 2 && keys[i + 1].z < z) i++;
  const k0 = keys[Math.max(0, i - 1)], k1 = keys[i], k2 = keys[i + 1], k3 = keys[Math.min(n - 1, i + 2)];
  const t = (z - k1.z) / Math.max(1e-6, k2.z - k1.z);
  const p0 = k0[f], p1 = k1[f], p2 = k2[f], p3 = k3[f];
  const m1 = ((p2 - p0) / Math.max(1e-6, k2.z - k0.z)) * (k2.z - k1.z), m2 = ((p3 - p1) / Math.max(1e-6, k3.z - k1.z)) * (k2.z - k1.z);
  const t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * p1 + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * p2 + (t3 - t2) * m2;
}

function profile(w, yb, ys, yt, box) {
  const h = ys - yb;
  const x5 = w * (0.84 + 0.13 * box), y5 = ys + (yt - ys) * (0.5 + 0.4 * box);
  const cy = (x) => yt - (yt - y5) * Math.pow(Math.min(1, x / x5), 1.8);
  const x6 = w * 0.52, x7 = Math.min(0.21, w * 0.4), x8 = Math.min(0.075, w * 0.14);
  return [
    [w * (0.9 + 0.08 * box), yb],
    [w * (0.975 + 0.02 * box), yb + h * 0.16],
    [w, yb + h * 0.5],
    [w * (0.987 + 0.011 * box), yb + h * 0.84],
    [w * (0.95 + 0.045 * box), ys],
    [x5, y5],
    [x6, cy(x6)],
    [x7, cy(x7)],
    [x8, cy(x8)],
    [0, yt],
  ];
}

function makeBody(def) {
  const { keys, wheels } = def;
  const z0 = keys[0].z, z1 = keys[keys.length - 1].z;
  const zs = [];
  const nz = def.rows || 46;
  for (let i = 0; i <= nz; i++) { const u = i / nz; const e = 0.5 - 0.5 * Math.cos(u * Math.PI); zs.push(lerp(z0, z1, lerp(u, e, 0.45))); }
  for (const wh of wheels) for (let k = -6; k <= 6; k++) zs.push(wh.z + (k / 6) * (wh.ra + 0.02));
  zs.sort((a, b) => a - b);
  const Z = zs.filter((z, i) => i === 0 || z - zs[i - 1] > 0.012);
  const sec = (z) => {
    const w = keyAt(keys, z, 'w'), ys = keyAt(keys, z, 'ys'), yt = keyAt(keys, z, 'yt');
    let yb = keyAt(keys, z, 'yb');
    for (const wh of wheels) {
      const d = Math.abs(z - wh.z);
      if (d < wh.ra) yb = Math.max(yb, wh.y + Math.sqrt(wh.ra * wh.ra - d * d) * 0.97);
    }
    yb = Math.min(yb, ys - 0.07);
    return { w, yb, ys, yt, box: def.box || 0 };
  };
  const S = Z.map((z) => ({ z, ...sec(z) }));
  const P = S.map((s) => profile(s.w, s.yb, s.ys, s.yt, s.box).map(([x, y]) => [x, y, s.z]));
  const point = (z, t) => {
    const s = sec(z);
    const pr = profile(s.w, s.yb, s.ys, s.yt, s.box);
    const i = Math.max(0, Math.min(pr.length - 2, Math.floor(t))), f = t - i;
    return [lerp(pr[i][0], pr[i + 1][0], f), lerp(pr[i][1], pr[i + 1][1], f), z];
  };
  const normal = (z, t) => {
    const e = 0.01;
    const a = point(z - e, t), b = point(z + e, t), c = point(z, Math.max(0, t - 0.05)), d = point(z, Math.min(6.99, t + 0.05));
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - c[0], vy = d[1] - c[1], vz = d[2] - c[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    if (nx * a[0] + ny * (a[1] - 0.5) < 0) { nx = -nx; ny = -ny; nz = -nz; }
    return [nx, ny, nz];
  };
  return { S, P, Z, sec, point, normal, z0, z1 };
}

function paintAt(def, col) {
  const stripe = def.stripe ? toRgb(def.stripe) : null;
  return (x, j) => (stripe && j === 7 ? stripe : col);
}

function buildLower(mb, B, def, col) {
  const lowerCol = def.lower ? toRgb(def.lower) : shade(col, -0.05);
  const pick = paintAt(def, col);
  const from = mb.mark();
  mb.surface(B.P, col, MAT.paint, {
    flip: true,
    at: (i, j) => {
      const x = (B.P[i][j][0] + B.P[i][j + 1][0]) / 2;
      if (j === 0) return [def.skirt ? toRgb(def.skirt) : lowerCol, def.skirt ? MAT.plastic : MAT.paint];
      return [pick(x, j), MAT.paint];
    },
  });
  const n = B.S.length;
  const capF = B.S[n - 1], capR = B.S[0];
  const fan = (s, front) => {
    const pr = profile(s.w, s.yb, s.ys, s.yt, s.box);
    const c = [0, (s.yb + s.yt) / 2, s.z];
    for (let j = 0; j < pr.length - 1; j++) {
      const a = [pr[j][0], pr[j][1], s.z], b = [pr[j + 1][0], pr[j + 1][1], s.z];
      if (front) mb.tri(c, a, b, col, MAT.paint); else mb.tri(c, b, a, col, MAT.paint);
    }
    mb.tri([0, s.yb, s.z], [pr[0][0], pr[0][1], s.z], c, col, MAT.paint);
  };
  fan(capF, true); fan(capR, false);
  for (let i = 0; i < n - 1; i++) {
    const a = B.S[i], b = B.S[i + 1];
    const ya = Math.min(a.yb, def.floor || 0.3), yb2 = Math.min(b.yb, def.floor || 0.3);
    mb.quad([0, ya, a.z], [a.w * 0.88, ya, a.z], [b.w * 0.88, yb2, b.z], [0, yb2, b.z], DARK, MAT.matte);
  }
  mb.mirrorX(from);
}

function buildArches(mb, B, def) {
  const from = mb.mark();
  for (const wh of def.wheels) {
    const s = B.sec(wh.z);
    const xo = s.w * 0.985, xi = s.w * 0.52;
    const seg = 14;
    const rows = [];
    for (const x of [xo, xi]) {
      const row = [];
      for (let k = 0; k <= seg; k++) { const a = Math.PI * (-0.08 + 1.16 * (k / seg)); row.push([x, wh.y + Math.sin(a) * wh.ra, wh.z + Math.cos(a) * wh.ra]); }
      rows.push(row);
    }
    mb.surface(rows, DARK, MAT.matte);
    if (def.flares) {
      const fr = [];
      for (const [x, r] of [[s.w * 0.96, wh.ra + 0.0], [s.w + 0.07, wh.ra + 0.03], [s.w + 0.07, wh.ra + 0.12], [s.w * 0.9, wh.ra + 0.14]]) {
        const row = [];
        for (let k = 0; k <= seg; k++) { const a = Math.PI * (-0.06 + 1.12 * (k / seg)); row.push([x, wh.y + Math.sin(a) * r, wh.z + Math.cos(a) * r]); }
        fr.push(row);
      }
      mb.surface(fr, toRgb(def.flares), MAT.plastic, { flip: true });
    }
  }
  mb.mirrorX(from);
}

function buildCabin(mb, B, def, col) {
  const c = def.cabin;
  const zs = [];
  const n = 30;
  for (let i = 0; i <= n; i++) zs.push(lerp(c.zr, c.zf, i / n));
  for (const z of [c.zrr, c.zrf, c.g0, c.g1, c.bp != null ? c.bp - (c.bpw || 0.05) : null, c.bp != null ? c.bp + (c.bpw || 0.05) : null, c.cp != null ? c.cp - (c.cpw || 0.05) : null, c.cp != null ? c.cp + (c.cpw || 0.05) : null]) if (z != null && z > c.zr && z < c.zf) zs.push(z);
  zs.sort((a, b) => a - b);
  const Z = zs.filter((z, i) => i === 0 || z - zs[i - 1] > 0.006);
  const hAt = (z) => {
    if (z < c.zrr) { const u = clamp01((z - c.zr) / (c.zrr - c.zr)); return lerp(c.ybR, c.yrR != null ? c.yrR : c.yr, 1 - (1 - u) ** (c.pr || 1.3)); }
    if (z > c.zrf) { const u = clamp01((z - c.zrf) / (c.zf - c.zrf)); return lerp(c.yr, c.ybF, u ** (c.pf || 1.35)); }
    const u = (z - c.zrr) / (c.zrf - c.zrr);
    return lerp(c.yrR != null ? c.yrR : c.yr, c.yr, u) + Math.sin(u * Math.PI) * (c.arc != null ? c.arc : 0.012);
  };
  const crown = c.crown != null ? c.crown : 0.05;
  const rows = Z.map((z) => {
    const s = B.sec(z);
    const wb = s.w * (c.belt || 0.93), ys = s.ys + 0.004;
    const yh = Math.max(ys + 0.004, hAt(z));
    const k = clamp01((yh - ys) / Math.max(0.05, c.yr - Math.min(c.ybF, c.ybR)));
    const wr = lerp(wb, (c.wr || 0.78) * s.w, Math.min(1, k * 1.4));
    const wt = lerp(wb - 0.012, wr * 1.012, 0.98);
    const x7 = Math.min(0.21, wr * 0.42), x8 = Math.min(0.075, wr * 0.15);
    const rc = (x) => yh + crown * k * (1 - Math.pow(x / Math.max(0.01, wr), 1.8));
    return [[wb, ys, z], [wb - 0.012, ys + 0.022 * k, z], [wt, lerp(ys + 0.022 * k, yh - 0.04 * k, 1), z], [wr, yh, z], [wr * 0.55, rc(wr * 0.55), z], [x7, rc(x7), z], [x8, rc(x8), z], [0, yh + crown * k, z]];
  });
  const pillar = (z) => (c.bp != null && Math.abs(z - c.bp) < (c.bpw || 0.05)) || (c.cp != null && Math.abs(z - c.cp) < (c.cpw || 0.05));
  const sideGlass = (z) => z > c.g0 && z < c.g1 && !pillar(z);
  const roofCol = def.roofCol ? toRgb(def.roofCol) : col;
  const from = mb.mark();
  mb.surface(rows.map((r) => r.slice(0, 4)), col, MAT.paint, {
    flip: true,
    at: (i, j) => {
      const z = (Z[i] + Z[i + 1]) / 2;
      if (j === 0) return [toRgb(c.trim || TRIM), MAT.trim];
      if (j === 1) return sideGlass(z) ? [toRgb(GLASS), MAT.glass] : [def.pillar ? toRgb(def.pillar) : col, def.pillar ? MAT.plastic : MAT.paint];
      return [def.rail ? toRgb(def.rail) : roofCol, def.rail ? MAT.trim : MAT.paint];
    },
  });
  mb.surface(rows.map((r) => r.slice(3)), col, MAT.paint, {
    flip: true,
    at: (i, j) => {
      const z = (Z[i] + Z[i + 1]) / 2;
      if (z > c.zrf + 0.015 || z < c.zrr - 0.015) return [toRgb(GLASS), MAT.glass];
      if (def.stripe && j === 2) return [toRgb(def.stripe), MAT.paint];
      return [roofCol, MAT.paint];
    },
  });
  mb.mirrorX(from);
  return { hAt };
}

function patch(mb, B, zA, zB, tA, tB, col, mat, lift = 0.006, nz = 5, nt = 4, mirror = true) {
  const rows = [];
  for (let i = 0; i <= nz; i++) {
    const z = lerp(zA, zB, i / nz);
    const row = [];
    for (let j = 0; j <= nt; j++) {
      const t = lerp(tA, tB, j / nt);
      const p = B.point(z, t), q = B.normal(z, t);
      row.push([p[0] + q[0] * lift, p[1] + q[1] * lift, p[2] + q[2] * lift]);
    }
    rows.push(row);
  }
  const from = mb.mark();
  mb.surface(rows, col, mat, { flip: true });
  if (mirror) mb.mirrorX(from);
}

function plate(mb, z, y, front) {
  const a = [-0.25, y - 0.065, z], b = [0.25, y - 0.065, z], c = [0.25, y + 0.065, z], d = [-0.25, y + 0.065, z];
  if (front) mb.quad(a, b, c, d, '#EDEDE6', 0.2); else mb.quad(b, a, d, c, '#EDEDE6', 0.2);
  const e = front ? 0.002 : -0.002;
  for (let k = 0; k < 5; k++) { const x0 = -0.17 + k * 0.075; const p = [[x0, y - 0.03, z + e], [x0 + 0.045, y - 0.03, z + e], [x0 + 0.045, y + 0.03, z + e], [x0, y + 0.03, z + e]]; if (front) mb.quad(p[0], p[1], p[2], p[3], '#23262B', 0.1); else mb.quad(p[1], p[0], p[3], p[2], '#23262B', 0.1); }
}

function mirrorBox(mb, x, y, z, col) {
  const from = mb.mark();
  mb.quad([x - 0.02, y - 0.02, z - 0.02], [x + 0.06, y - 0.03, z - 0.02], [x + 0.06, y - 0.03, z + 0.04], [x - 0.02, y - 0.02, z + 0.04], DARK, MAT.plastic);
  mb.blob(x + 0.085, y + 0.03, z, 0.07, 0.045, 0.04, col, MAT.paint, null, 8, true);
  mb.quad([x + 0.15, y, z - 0.037], [x + 0.15, y + 0.06, z - 0.037], [x + 0.025, y + 0.06, z - 0.04], [x + 0.025, y, z - 0.04], '#9AA6B4', MAT.chrome);
  mb.mirrorX(from);
}

function exhaust(mb, x, y, z, r, len) {
  mb.lathe(x, y, z, [[r * 0.75, 0], [r, 0.0], [r, 0], [r * 0.75, 0]].map(([rr]) => [rr, 0]), 4, CHROME, MAT.chrome);
  const prof = [[r * 0.72, 0], [r, 0.002], [r, len], [r * 0.72, len]];
  const rows = prof.map(([rr, l]) => { const row = []; for (let j = 0; j < 12; j++) { const a = (j / 12) * Math.PI * 2; row.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr, z + l]); } return row; });
  mb.surface(rows, CHROME, MAT.chrome, { wrap: true, flip: true });
  const cap = []; for (let j = 0; j < 12; j++) { const a = (j / 12) * Math.PI * 2; cap.push([x + Math.cos(a) * r * 0.72, y + Math.sin(a) * r * 0.72, z + 0.004]); }
  for (let j = 0; j < 12; j++) mb.tri([x, y, z + 0.004], cap[j], cap[(j + 1) % 12], '#0B0B0C', MAT.matte);
}

function wing(mb, def, col) {
  const g = def.wing;
  const from = mb.mark();
  for (const sx of [g.sx]) {
    mb.quad([sx - 0.02, g.y0, g.z - 0.05], [sx + 0.02, g.y0, g.z - 0.05], [sx + 0.02, g.y1, g.z - 0.02], [sx - 0.02, g.y1, g.z - 0.02], DARK, MAT.plastic);
    mb.quad([sx + 0.02, g.y0, g.z + 0.08], [sx - 0.02, g.y0, g.z + 0.08], [sx - 0.02, g.y1, g.z + 0.06], [sx + 0.02, g.y1, g.z + 0.06], DARK, MAT.plastic);
    mb.quad([sx + 0.02, g.y0, g.z - 0.05], [sx + 0.02, g.y0, g.z + 0.08], [sx + 0.02, g.y1, g.z + 0.06], [sx + 0.02, g.y1, g.z - 0.02], DARK, MAT.plastic);
  }
  const prof = [[0, g.y1 + 0.03], [0.07, g.y1 + 0.055], [0.2, g.y1 + 0.045], [0.3, g.y1 + 0.015], [0.2, g.y1 + 0.0], [0.05, g.y1 + 0.005], [0, g.y1 + 0.03]];
  const rows = [];
  for (const x of [0, g.w * 0.6, g.w]) rows.push(prof.map(([dz, y]) => [x, y + (x / g.w) * 0.015, g.z + 0.16 - dz]));
  mb.surface(rows, col, MAT.paint, { flip: true });
  const end = (x) => { const r = prof.map(([dz, y]) => [x, y + 0.015, g.z + 0.16 - dz]); for (let k = 1; k < r.length - 1; k++) mb.tri(r[0], r[k], r[k + 1], DARK, MAT.plastic); };
  end(g.w);
  mb.quad([g.w + 0.005, g.y1 - 0.01, g.z - 0.15], [g.w + 0.005, g.y1 + 0.08, g.z - 0.15], [g.w + 0.005, g.y1 + 0.1, g.z + 0.18], [g.w + 0.005, g.y1 + 0.02, g.z + 0.18], DARK, MAT.plastic);
  mb.mirrorX(from);
}

export function wheelMesh(o = {}) {
  const mb = new MeshBuilder();
  const R = o.r || 0.35, W = o.w || 0.26, seg = o.seg || 26;
  const rimR = R * (o.rim || 0.66), hw = W / 2;
  const tread = toRgb('#1A1B1E'), side = toRgb('#24262A'), groove = toRgb('#0E0F11');
  const tp = [[rimR * 0.98, -hw * 0.82], [R * 0.86, -hw], [R * 0.97, -hw * 0.94], [R, -hw * 0.7], [R, -hw * 0.25], [R, hw * 0.25], [R, hw * 0.7], [R * 0.97, hw * 0.94], [R * 0.86, hw], [rimR * 0.98, hw * 0.82]];
  mb.lathe(0, 0, 0, tp.map(([r, x]) => [r, x]), seg, tread, MAT.rubber, {
    at: (i, j) => {
      if (i === 0 || i === tp.length - 2) return [side, MAT.rubber];
      if (i === 1 || i === tp.length - 3) return [side, 0.06];
      if (i === 4) return [groove, MAT.rubber];
      return [j % 2 ? tread : groove, MAT.rubber];
    },
  });
  const rimCol = toRgb(o.rimCol || '#C7CCD3');
  const face = hw * 0.62;
  const lip = [[rimR, -face - 0.004], [rimR, face + 0.004]];
  mb.lathe(0, 0, 0, lip, seg, shade(rimCol, -0.35), MAT.metal, { flip: true });
  const disc = [];
  for (let j = 0; j <= seg; j++) { const a = (j / seg) * Math.PI * 2; disc.push([face - 0.06, Math.sin(a) * rimR * 0.95, Math.cos(a) * rimR * 0.95]); }
  for (let j = 0; j < seg; j++) mb.tri([face - 0.06, 0, 0], disc[j], disc[j + 1], '#2B2D31', MAT.metal);
  for (let j = 0; j < seg; j++) mb.tri([-face + 0.06, 0, 0], [-face + 0.06, disc[j + 1][1], disc[j + 1][2]], [-face + 0.06, disc[j][1], disc[j][2]], '#2B2D31', MAT.metal);
  const brake = [];
  for (let j = 0; j <= 20; j++) { const a = (j / 20) * Math.PI * 2; brake.push([face - 0.07, Math.sin(a) * rimR * 0.78, Math.cos(a) * rimR * 0.78]); }
  for (let j = 0; j < 20; j++) mb.tri([face - 0.069, 0, 0], brake[j], brake[j + 1], '#8E949C', MAT.alloy + 0.03);
  if (o.caliper) { mb.box(face - 0.075, rimR * 0.45, -0.08, 0.05, rimR * 0.35, 0.16, o.caliper, 0.3); }
  const spokes = o.spokes || 5;
  const sp = (side2) => {
    const x0 = side2 * face, x1 = side2 * (face - 0.035);
    for (let k = 0; k < spokes; k++) {
      const a = (k / spokes) * Math.PI * 2;
      const wA = o.spokeW || 0.16;
      const pts = [];
      for (const [rr, ww] of [[rimR * 0.2, wA * 0.7], [rimR * 0.95, wA]]) {
        pts.push([rr, a - ww / 2 / (rr / rimR + 0.4)], [rr, a + ww / 2 / (rr / rimR + 0.4)]);
      }
      const P2 = (rr, aa, x) => [x, Math.sin(aa) * rr, Math.cos(aa) * rr];
      const [A, Bq, C, D] = [P2(pts[0][0], pts[0][1], x0), P2(pts[1][0], pts[1][1], x0), P2(pts[3][0], pts[3][1], x0), P2(pts[2][0], pts[2][1], x0)];
      if (side2 > 0) mb.quad(A, Bq, C, D, rimCol, MAT.alloy); else mb.quad(A, D, C, Bq, rimCol, MAT.alloy);
      const A2 = P2(pts[0][0], pts[0][1], x1), B2 = P2(pts[1][0], pts[1][1], x1), C2 = P2(pts[3][0], pts[3][1], x1), D2 = P2(pts[2][0], pts[2][1], x1);
      mb.quad(A, A2, D2, D, shade(rimCol, -0.25), MAT.alloy);
      mb.quad(Bq, C, C2, B2, shade(rimCol, -0.25), MAT.alloy);
    }
    const hub = [];
    for (let j = 0; j <= 12; j++) { const a = (j / 12) * Math.PI * 2; hub.push([x0 + side2 * 0.004, Math.sin(a) * rimR * 0.24, Math.cos(a) * rimR * 0.24]); }
    for (let j = 0; j < 12; j++) { if (side2 > 0) mb.tri([x0 + 0.01, 0, 0], hub[j], hub[j + 1], shade(rimCol, -0.1), MAT.chrome); else mb.tri([x0 - 0.01, 0, 0], hub[j + 1], hub[j], shade(rimCol, -0.1), MAT.chrome); }
  };
  sp(1); sp(-1);
  return mb.build();
}

const DEFS = {
  sport: {
    rows: 54, box: 0, floor: 0.24, skirt: '#16171A',
    keys: [
      { z: -2.24, w: 0.7, yb: 0.38, ys: 0.68, yt: 0.71 }, { z: -2.12, w: 0.9, yb: 0.3, ys: 0.8, yt: 0.83 }, { z: -1.85, w: 1.0, yb: 0.26, ys: 0.86, yt: 0.88 },
      { z: -1.3, w: 1.02, yb: 0.25, ys: 0.87, yt: 0.89 }, { z: -0.7, w: 0.99, yb: 0.25, ys: 0.83, yt: 0.86 }, { z: 0.1, w: 0.95, yb: 0.25, ys: 0.8, yt: 0.83 },
      { z: 0.9, w: 0.97, yb: 0.25, ys: 0.8, yt: 0.83 }, { z: 1.4, w: 0.98, yb: 0.26, ys: 0.77, yt: 0.8 }, { z: 1.85, w: 0.92, yb: 0.28, ys: 0.66, yt: 0.7 },
      { z: 2.1, w: 0.8, yb: 0.31, ys: 0.56, yt: 0.6 }, { z: 2.22, w: 0.66, yb: 0.33, ys: 0.5, yt: 0.53 },
    ],
    wheels: [{ z: 1.36, y: 0.33, ra: 0.39 }, { z: -1.36, y: 0.35, ra: 0.41 }],
    cabin: { zr: -1.78, zrr: -0.9, zrf: -0.08, zf: 0.86, ybR: 0.88, ybF: 0.82, yr: 1.15, wr: 0.72, crown: 0.05, g0: -1.2, g1: 0.42, bp: -0.46, bpw: 0.03, pr: 1.7, pf: 1.3, belt: 0.9 },
    stripe: '#F4F2EC', stripeW: 0.21, stripeGap: 0.075,
    wing: { sx: 0.5, y0: 0.86, y1: 1.06, z: -2.02, w: 0.88 },
  },
  hatch: {
    rows: 46, box: 0.18, floor: 0.27, skirt: '#1A1B1E',
    keys: [
      { z: -1.86, w: 0.8, yb: 0.36, ys: 0.86, yt: 0.9 }, { z: -1.74, w: 0.9, yb: 0.3, ys: 0.92, yt: 0.95 }, { z: -1.4, w: 0.93, yb: 0.28, ys: 0.94, yt: 0.97 },
      { z: -0.3, w: 0.93, yb: 0.28, ys: 0.93, yt: 0.96 }, { z: 0.7, w: 0.93, yb: 0.28, ys: 0.9, yt: 0.93 }, { z: 1.25, w: 0.91, yb: 0.29, ys: 0.84, yt: 0.88 },
      { z: 1.68, w: 0.85, yb: 0.31, ys: 0.72, yt: 0.76 }, { z: 1.9, w: 0.74, yb: 0.34, ys: 0.6, yt: 0.63 },
    ],
    wheels: [{ z: 1.18, y: 0.32, ra: 0.38 }, { z: -1.18, y: 0.32, ra: 0.38 }],
    cabin: { zr: -1.8, zrr: -1.5, zrf: 0.05, zf: 1.02, ybR: 0.97, ybF: 0.9, yr: 1.47, yrR: 1.41, wr: 0.82, crown: 0.045, g0: -1.42, g1: 0.88, bp: -0.28, bpw: 0.04, cp: -1.16, cpw: 0.12, pr: 0.5, pf: 1.2, belt: 0.93, arc: 0.01 },
    roofSpoiler: true,
  },
  jeep: {
    rows: 42, box: 0.85, floor: 0.52, skirt: '#202225', flares: '#202225', lower: '#2A2C30',
    keys: [
      { z: -2.0, w: 0.9, yb: 0.62, ys: 1.12, yt: 1.14 }, { z: -1.94, w: 0.96, yb: 0.56, ys: 1.16, yt: 1.18 }, { z: -1.5, w: 0.98, yb: 0.55, ys: 1.17, yt: 1.19 },
      { z: 1.0, w: 0.98, yb: 0.55, ys: 1.15, yt: 1.18 }, { z: 1.8, w: 0.97, yb: 0.57, ys: 1.1, yt: 1.13 }, { z: 2.04, w: 0.92, yb: 0.6, ys: 1.03, yt: 1.06 },
    ],
    wheels: [{ z: 1.32, y: 0.46, ra: 0.52 }, { z: -1.3, y: 0.46, ra: 0.52 }],
    cabin: { zr: -1.88, zrr: -1.8, zrf: 0.6, zf: 0.86, ybR: 1.19, ybF: 1.17, yr: 1.88, wr: 0.93, crown: 0.015, g0: -1.72, g1: 0.72, bp: -0.26, bpw: 0.06, cp: -1.06, cpw: 0.06, pr: 1, pf: 1, belt: 0.97, arc: 0 },
    pillar: '#1E2023',
  },
};

function lightsFor(mb, B, type) {
  if (type === 'sport') {
    patch(mb, B, 1.9, 2.1, 4.25, 4.95, CHROME, MAT.chrome, 0.004, 4, 3);
    patch(mb, B, 1.93, 2.09, 4.4, 4.85, HEAD, MAT.light, 0.008, 3, 3);
    patch(mb, B, -2.21, -2.06, 3.7, 4.9, TAIL, MAT.light, 0.008, 3, 3);
    patch(mb, B, -2.235, -2.2, 5.0, 6.6, TAIL, MAT.glow, 0.007, 1, 3);
    patch(mb, B, 2.05, 2.2, 0.6, 1.6, DARK, MAT.plastic, 0.006, 3, 3);
    patch(mb, B, -2.22, -2.12, 0.8, 1.9, DARK, MAT.plastic, 0.006, 2, 3);
  } else if (type === 'hatch') {
    patch(mb, B, 1.7, 1.86, 3.9, 4.85, CHROME, MAT.chrome, 0.004, 3, 3);
    patch(mb, B, 1.72, 1.85, 4.05, 4.75, HEAD, MAT.light, 0.008, 3, 3);
    patch(mb, B, -1.86, -1.7, 3.3, 4.95, TAIL, MAT.light, 0.008, 3, 3);
    patch(mb, B, 1.8, 1.9, 1.2, 2.6, DARK, MAT.plastic, 0.006, 2, 3);
  } else {
    patch(mb, B, -2.0, -1.9, 2.3, 4.7, TAIL, MAT.light, 0.008, 2, 3);
  }
}

export function carMesh(type, color) {
  const col = toRgb(color);
  if (type === 'tuktuk') return tuktuk(col);
  const def = DEFS[type] || DEFS.sport;
  const mb = new MeshBuilder();
  const B = makeBody(def);
  buildLower(mb, B, def, col);
  buildArches(mb, B, def);
  buildCabin(mb, B, def, col);
  lightsFor(mb, B, type);
  const fz = B.z1, rz = B.z0;
  if (type === 'sport') {
    wing(mb, def, col);
    grille(mb, fz, 0.36, 0.47, 0.42, 0.34);
    mb.quad([-0.62, 0.3, fz + 0.025], [0.62, 0.3, fz + 0.025], [0.66, 0.31, fz - 0.06], [-0.66, 0.31, fz - 0.06], '#0D0E10', MAT.plastic);
    for (const x of [-0.42, -0.3, 0.3, 0.42]) exhaust(mb, x, 0.34, rz - 0.02, 0.045, -0.08);
    mb.quad([-0.6, 0.29, rz - 0.01], [0.6, 0.29, rz - 0.01], [0.66, 0.33, rz + 0.08], [-0.66, 0.33, rz + 0.08], '#0D0E10', MAT.plastic);
    mirrorBox(mb, 0.84, 0.86, 0.5, col);
    plate(mb, rz - 0.012, 0.47, false);
  } else if (type === 'hatch') {
    mb.quad([-0.76, 1.53, -1.3], [0.76, 1.53, -1.3], [0.74, 1.56, -1.74], [-0.74, 1.56, -1.74], shade(col, -0.08), MAT.paint);
    mb.quad([-0.74, 1.56, -1.74], [0.74, 1.56, -1.74], [0.72, 1.5, -1.8], [-0.72, 1.5, -1.8], DARK, MAT.plastic);
    exhaust(mb, 0.5, 0.32, rz + 0.02, 0.04, -0.08);
    mirrorBox(mb, 0.84, 0.99, 0.82, col);
    mb.box(0, 0.26, fz - 0.02, 1.5, 0.12, 0.1, '#202226', MAT.plastic);
    grille(mb, fz, 0.4, 0.55, 0.36, 0.3);
    mb.box(0, 0.28, rz + 0.02, 1.5, 0.14, 0.1, '#202226', MAT.plastic);
    plate(mb, fz + 0.04, 0.42, true);
    plate(mb, rz - 0.012, 0.6, false);
    for (const sx of [-1, 1]) mb.box(sx * 0.6, 1.5, -0.45, 0.035, 0.035, 1.3, '#202226', MAT.trim);
  } else {
    mb.box(0, 1.86, -0.45, 1.6, 0.06, 2.1, '#1E2023', MAT.trim);
    for (const sx of [-1, 1]) mb.box(sx * 0.82, 1.86, -0.45, 0.06, 0.14, 2.1, '#1E2023', MAT.trim);
    for (const z of [-1.3, -0.45, 0.4]) mb.box(0, 1.98, z, 1.7, 0.04, 0.06, '#1E2023', MAT.trim);
    mb.box(0, 0.5, fz + 0.05, 1.86, 0.18, 0.16, '#24262A', MAT.metal);
    for (const sx of [-1, 1]) mb.box(sx * 0.42, 0.6, fz + 0.12, 0.08, 0.5, 0.08, '#24262A', MAT.metal);
    mb.box(0, 1.02, fz + 0.14, 0.95, 0.06, 0.06, '#24262A', MAT.metal);
    mb.box(0, 0.68, fz + 0.012, 0.9, 0.34, 0.02, '#0F1012', MAT.plastic);
    for (const sx of [-1, 1]) { patch2(mb, [sx * 0.66, 0.86, fz + 0.005], 0.11, HEAD, CHROME); mb.box(sx * 0.66, 0.66, fz + 0.01, 0.16, 0.06, 0.02, '#FFB020', MAT.glow); }
    for (let k = 0; k < 6; k++) mb.box(-0.36 + k * 0.144, 0.7, fz + 0.022, 0.05, 0.28, 0.01, '#3A3D42', MAT.metal);
    mb.box(0, 0.48, rz - 0.05, 1.8, 0.16, 0.14, '#24262A', MAT.metal);
    mirrorBox(mb, 0.92, 1.24, 0.72, col);
    plate(mb, rz - 0.06, 0.78, false);
    const sp = wheelMesh({ r: 0.4, w: 0.26, seg: 18, spokes: 6, rimCol: '#2A2C30' });
    const pv = sp;
    for (let k = 0; k < pv.length; k += 10) {
      const x = pv[k], y = pv[k + 1], z = pv[k + 2];
      mb.v.push(z, y + 1.06, -x + rz - 0.2, pv[k + 5], pv[k + 4], -pv[k + 3], pv[k + 6], pv[k + 7], pv[k + 8], pv[k + 9]);
    }
  }
  return mb.build();
}

function tuktuk(col) {
  const mb = new MeshBuilder();
  const canopy = toRgb('#1C1E22');
  const front = [];
  const prof = (z) => {
    const u = clamp01((z - 0.55) / 0.9);
    const w = lerp(0.6, 0.24, Math.pow(u, 1.3)), yb = lerp(0.3, 0.36, u), yt = lerp(1.02, 0.72, Math.pow(u, 2.2));
    return { w, yb, yt };
  };
  for (let i = 0; i <= 14; i++) {
    const z = lerp(0.55, 1.42, i / 14);
    const p = prof(z);
    const row = [];
    for (let k = 0; k <= 8; k++) {
      const a = (k / 8) * Math.PI;
      row.push([Math.cos(a) * p.w, p.yb + (p.yt - p.yb) * (0.5 + 0.5 * Math.sin(a) * (k === 0 || k === 8 ? 0 : 1)) * (k === 0 || k === 8 ? 0 : 1) + (k === 0 || k === 8 ? 0 : 0), z]);
    }
    front.push(row);
  }
  const cowl = front.map((row, i) => row.map(([x, y, z], k) => { const p = prof(z); const a = (k / 8) * Math.PI; return [Math.cos(a) * p.w, p.yb + Math.sin(a) * (p.yt - p.yb), z]; }));
  mb.surface(cowl, col, MAT.paint, { flip: false });
  const end = cowl[cowl.length - 1];
  for (let k = 0; k < end.length - 1; k++) mb.tri([0, (prof(1.42).yb + prof(1.42).yt) / 2, 1.42], end[k], end[k + 1], col, MAT.paint);
  mb.box(0, 0.3, -0.55, 1.36, 0.45, 2.1, col, MAT.paint);
  mb.box(0, 0.75, -0.55, 1.38, 0.05, 2.12, shade(col, -0.25), MAT.paint);
  mb.box(0, 0.3, -1.6, 1.3, 0.3, 0.04, DARK, MAT.plastic);
  for (const sx of [-1, 1]) {
    mb.box(sx * 0.66, 0.78, 0.5, 0.05, 0.9, 0.05, canopy, MAT.trim);
    mb.box(sx * 0.66, 0.78, -1.58, 0.05, 0.92, 0.05, canopy, MAT.trim);
    mb.box(sx * 0.66, 0.78, -0.6, 0.04, 0.6, 0.04, canopy, MAT.trim);
  }
  const roofRows = [];
  for (const z of [-1.66, -1.2, -0.4, 0.4, 0.62]) {
    const row = [];
    for (let k = 0; k <= 10; k++) { const a = Math.PI * (k / 10); row.push([Math.cos(a) * 0.74, 1.66 + Math.sin(a) * 0.2 - (z > 0.5 ? 0.04 : 0), z]); }
    roofRows.push(row);
  }
  mb.surface(roofRows, canopy, 0.12, { flip: true });
  mb.surface(roofRows.map((r) => r.map(([x, y, z]) => [x, y - 0.01, z])), canopy, 0.05, {});
  mb.box(0, 1.6, -1.66, 1.5, 0.08, 0.04, col, MAT.paint);
  mb.box(0, 1.58, 0.62, 1.5, 0.1, 0.04, col, MAT.paint);
  mb.quad([-0.56, 0.98, 0.62], [0.56, 0.98, 0.62], [0.52, 1.56, 0.56], [-0.52, 1.56, 0.56], GLASS, MAT.glass);
  mb.quad([0.56, 0.98, 0.62], [-0.56, 0.98, 0.62], [-0.52, 1.56, 0.56], [0.52, 1.56, 0.56], GLASS, MAT.glass);
  mb.box(0, 0.75, -1.05, 1.24, 0.12, 0.62, '#2C221E', 0.1);
  mb.box(0, 0.87, -1.32, 1.24, 0.5, 0.12, '#2C221E', 0.1);
  mb.box(0, 0.75, 0.05, 0.42, 0.12, 0.46, '#2C221E', 0.1);
  mb.box(0, 0.87, -0.15, 0.42, 0.42, 0.08, '#2C221E', 0.1);
  mb.blob(0, 1.32, 0.08, 0.14, 0.17, 0.14, '#7A4E32', 0.05, null, 10, true);
  mb.blob(0, 1.4, 0.06, 0.15, 0.1, 0.15, '#1A1412', 0.05, null, 10, true);
  mb.box(0, 0.86, 0.1, 0.36, 0.42, 0.26, '#2F6DB5', 0.05);
  mb.box(0, 1.08, 0.5, 0.78, 0.04, 0.04, CHROME, MAT.chrome);
  mb.box(0, 0.98, 0.46, 0.06, 0.12, 0.06, DARK, MAT.plastic);
  patch2(mb, [0, 0.86, 1.36], 0.13, HEAD, CHROME);
  for (const sx of [-1, 1]) mb.box(sx * 0.6, 0.48, -1.62, 0.14, 0.12, 0.02, TAIL, MAT.light);
  mb.box(0, 0.32, 1.12, 0.14, 0.34, 0.14, DARK, MAT.metal);
  const fr = [];
  for (const [x, r] of [[0.13, 0.36], [0.13, 0.4], [-0.13, 0.4], [-0.13, 0.36]]) { const row = []; for (let k = 0; k <= 10; k++) { const a = Math.PI * (0.15 + 0.7 * (k / 10)); row.push([x, 0.3 + Math.sin(a) * r, 1.12 + Math.cos(a) * r]); } fr.push(row); }
  mb.surface(fr, col, MAT.paint, { flip: true });
  return mb.build();
}

function grille(mb, fz, y0, y1, hw0, hw1) {
  const z = fz + 0.004;
  mb.quad([-hw0, y0, z], [hw0, y0, z], [hw1, y1, z], [-hw1, y1, z], '#0B0C0E', MAT.plastic);
  for (let k = 1; k < 4; k++) { const y = y0 + ((y1 - y0) * k) / 4; const w = hw0 + ((hw1 - hw0) * k) / 4; mb.quad([-w, y - 0.006, z + 0.002], [w, y - 0.006, z + 0.002], [w, y + 0.006, z + 0.002], [-w, y + 0.006, z + 0.002], '#3A3E45', MAT.metal); }
}

function patch2(mb, c, r, col, rim) {
  const seg = 14;
  const ring = (rr, dz) => { const row = []; for (let j = 0; j <= seg; j++) { const a = (j / seg) * Math.PI * 2; row.push([c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr, c[2] + dz]); } return row; };
  mb.surface([ring(r * 1.35, -0.02), ring(r * 1.25, 0.03), ring(r * 1.05, 0.035)], rim, MAT.chrome, { flip: true });
  const face = ring(r, 0.04);
  for (let j = 0; j < seg; j++) mb.tri([c[0], c[1], c[2] + 0.045], face[j], face[j + 1], col, MAT.light);
}

export const WHEELS = {
  sport: { list: [[0.84, 0.33, 1.36, 0.33, 0.29, 1], [0.86, 0.35, -1.36, 0.35, 0.33, 0]], rim: '#C9CED6', spokes: 5, caliper: '#E5292E' },
  hatch: { list: [[0.8, 0.32, 1.18, 0.32, 0.25, 1], [0.8, 0.32, -1.18, 0.32, 0.25, 0]], rim: '#AEB4BC', spokes: 7 },
  jeep: { list: [[0.88, 0.46, 1.32, 0.46, 0.37, 1], [0.88, 0.46, -1.3, 0.46, 0.37, 0]], rim: '#6A7078', spokes: 6 },
  tuktuk: { list: [[0, 0.3, 1.12, 0.3, 0.2, 1], [0.72, 0.3, -0.85, 0.3, 0.2, 0]], rim: '#B9BEC6', spokes: 4 },
};

export function fxMeshes() {
  const rk = new MeshBuilder();
  rk.setT(new Float32Array([1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1]));
  rk.revolve(0, -0.55, 0, [[0.1, 0], [0.15, 0.06], [0.16, 0.12], [0.16, 0.75], [0.15, 0.82]], 12, '#EEF1F4', 0.2, { at: (i) => [hexRgb(i === 1 ? '#E5292E' : '#EEF1F4'), 0.2] });
  rk.revolve(0, 0.27, 0, [[0.15, 0], [0.13, 0.12], [0.08, 0.26], [0.0, 0.36]], 12, '#E5292E', 0.25);
  rk.revolve(0, -0.62, 0, [[0.07, 0], [0.11, 0.07], [0.1, 0.08]], 10, '#2A2C31', 0.3);
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + Math.PI / 4, ca = Math.cos(a), sa = Math.sin(a);
    rk.quad([ca * 0.15, -0.5, sa * 0.15], [ca * 0.36, -0.58, sa * 0.36], [ca * 0.36, -0.36, sa * 0.36], [ca * 0.15, -0.2, sa * 0.15], '#2A2C31', 0.2);
  }
  rk.setT(null);
  const bt = new MeshBuilder();
  const prof = [[0, 0], [0.24, 0], [0.29, 0.06], [0.3, 0.16], [0.3, 0.62], [0.24, 0.78], [0.13, 0.9], [0.12, 1.02], [0.13, 1.06]];
  bt.revolve(0, 0, 0, prof.map(([r, y]) => [r * 1.25, y * 1.25]), 14, '#36E0B0', 0.9, { at: (i) => (i >= 6 ? [hexRgb('#E9EDF2'), 0.72] : i === 3 ? [hexRgb('#F4F6F8'), 0.86] : [hexRgb('#36E0B0'), 0.9]) });
  bt.revolve(0, 1.32, 0, [[0.17, 0], [0.17, 0.14], [0.0, 0.16]], 12, '#E9EDF2', 0.72);
  const sh = new MeshBuilder();
  sh.blob(0, 0.95, 0.05, 1.55, 1.35, 2.85, '#7FDBFF', 0.9, null, 18, true);
  const oil = new MeshBuilder();
  const n = 16, pts = [];
  for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2; const r = 1.9 + Math.sin(k * 2.7) * 0.35 + Math.cos(k * 1.3) * 0.25; pts.push([Math.cos(a) * r * 1.15, 0.04, Math.sin(a) * r * 1.4]); }
  for (let k = 0; k < n; k++) oil.tri([0, 0.045, 0], pts[(k + 1) % n], pts[k], '#0A0A0E', 0.665);
  for (let k = 0; k < 5; k++) { const a = k * 1.3, r = 0.5 + k * 0.25; oil.tri([Math.cos(a) * r, 0.05, Math.sin(a) * r], [Math.cos(a + 0.5) * (r + 0.3), 0.05, Math.sin(a + 0.5) * (r + 0.3)], [Math.cos(a + 0.2) * (r + 0.5), 0.05, Math.sin(a + 0.2) * (r + 0.5)], '#1E1530', 0.69); }
  return { rocket: rk.build(), bottle: bt.build(), shield: sh.build(), oil: oil.build() };
}
