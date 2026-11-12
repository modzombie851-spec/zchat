import { MeshBuilder, m4, hexRgb } from './race3d.js';
import { MAT, hsh, sq, ball, withT, tube, cone, rot } from './siegemesh.js';
import { GUNS, buildGun, gripHand, handFrames } from './zguns.js';
export { gunMesh, GUNS } from './zguns.js';

const C = (h) => (typeof h === 'string' ? hexRgb(h) : h);
const sh = (c, k) => { const A = C(c); return [Math.min(1, A[0] * k), Math.min(1, A[1] * k), Math.min(1, A[2] * k)]; };
const mx = (a, b, t) => { const A = C(a), B = C(b); return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]; };
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scl = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const nrm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const ap = (T, p) => { const r = m4.apply(T, p[0], p[1], p[2]); return [r[0], r[1], r[2]]; };

function ik(S, H, L1, L2, pole) {
  const d = sub(H, S);
  const D = Math.min(len(d), L1 + L2 - 0.002);
  const dir = nrm(d);
  const a = (L1 * L1 - L2 * L2 + D * D) / (2 * D);
  const h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  const p = nrm(sub(pole, scl(dir, dot(pole, dir))));
  return { el: add(add(S, scl(dir, a)), scl(p, h)), hand: add(S, scl(dir, D)) };
}

function hand(m, p, dir, skin, glove) {
  const c = glove || skin;
  const f = nrm(dir);
  withT(m, m4.mul(m4.pose(p[0], p[1], p[2], Math.atan2(f[0], f[2]), -Math.asin(Math.max(-1, Math.min(1, f[1])))), m4.ident()), () => {
    sq(m, 0, 0, 0.02, 0.045, 0.04, 0.06, 0.8, 0.85, c, MAT.matte, 10, 7);
    sq(m, 0.0, -0.01, 0.075, 0.042, 0.032, 0.03, 0.9, 0.9, sh(c, 0.94), MAT.matte, 8, 5);
    sq(m, 0.04, 0.015, 0.045, 0.016, 0.016, 0.034, 1, 1, c, MAT.matte, 6, 4);
  });
}

function arm(m, S, H, o) {
  const L1 = o.L1 || 0.3, L2 = o.L2 || 0.29;
  const { el, hand: Hh } = ik(S, H, L1, L2, o.pole || [S[0] > 0 ? 1 : -1, -1.2, -0.4]);
  const r0 = o.r || 0.062, r1 = r0 * 0.86, r2 = r0 * 0.7;
  const sl = o.sleeve == null ? 1 : o.sleeve;
  const sc = C(o.sleeveCol), sk = C(o.skin);
  ball(m, S[0], S[1], S[2], r0 * 1.22, o.shoulderCol || sc, MAT.matte, 10);
  if (sl >= 1) tube(m, S, el, r0 * 1.06, r1 * 1.08, 10, sc, MAT.matte, false);
  else {
    const mid = lerp3(S, el, Math.max(0.02, sl));
    tube(m, S, mid, r0 * 1.12, r0 * 1.1, 10, sc, MAT.matte, false);
    tube(m, lerp3(S, el, Math.max(0.0, sl - 0.05)), el, r0 * 0.92, r1, 10, sk, MAT.matte, false);
    if (sl > 0.05) withT(m, m4.mul(basisAt(mid, sub(el, S)), m4.ident()), () => m.smoothCyl(0, -0.012, 0, r0 * 1.2, 0.03, 12, sh(sc, 0.9), MAT.matte, { cap: false }));
  }
  ball(m, el[0], el[1], el[2], r1 * (sl >= 1.05 ? 1.1 : 1.0), sl >= 1.05 ? sc : sk, MAT.matte, 9);
  if (sl >= 2) tube(m, el, Hh, r1 * 1.08, r2 * 1.12, 10, sc, MAT.matte, false);
  else if (sl > 1) {
    const mid = lerp3(el, Hh, sl - 1);
    tube(m, el, mid, r1 * 1.1, r1, 10, sc, MAT.matte, false);
    tube(m, mid, Hh, r1 * 0.9, r2, 10, sk, MAT.matte, false);
  } else tube(m, el, Hh, r1 * 0.95, r2, 10, sk, MAT.matte, false);
  if (o.cuff) { const cp = lerp3(el, Hh, 0.86); withT(m, basisAt(cp, sub(Hh, el)), () => m.smoothCyl(0, 0, 0, r2 * 1.35, 0.05, 12, C(o.cuff), MAT.matte)); }
  if (o.noHand) { if (len(sub(H, Hh)) > 0.004) tube(m, Hh, H, r2 * 0.98, r2 * 0.95, 9, sl >= 2 ? sc : sk, MAT.matte, false); ball(m, H[0], H[1], H[2], r2 * 0.98, o.glove ? C(o.glove) : sl >= 2 ? sc : sk, MAT.matte, 8); }
  else hand(m, Hh, o.handDir || sub(Hh, el), o.skin, o.glove);
  return { el, hand: Hh };
}

function basisAt(p, d) {
  const y = nrm(d);
  const ref = Math.abs(y[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
  let x = [y[1] * ref[2] - y[2] * ref[1], y[2] * ref[0] - y[0] * ref[2], y[0] * ref[1] - y[1] * ref[0]];
  x = nrm(x);
  const z = [x[1] * y[2] - x[2] * y[1], x[2] * y[0] - x[0] * y[2], x[0] * y[1] - x[1] * y[0]];
  return new Float32Array([x[0], x[1], x[2], 0, y[0], y[1], y[2], 0, z[0], z[1], z[2], 0, p[0], p[1], p[2], 1]);
}

const GUN_ALIAS = { rifle: 'rifle', shotgun: 'shotgun', pistol: 'pistol', sniper: 'sniper', smg: 'smg', bat: 'bat' };

function face(m, cy, cz, o) {
  const skin = C(o.skin);
  const ey = cy + 0.005;
  for (const s of [-1, 1]) {
    const x = s * 0.074;
    if (o.zombie) {
      sq(m, x, ey, cz - 0.004, 0.04, 0.034, 0.02, 1, 1, sh(skin, 0.55), MAT.matte, 10, 6);
      ball(m, x + s * 0.004, ey - 0.002, cz + 0.008, 0.016, o.eye || '#FFB627', MAT.glow, 8);
      withT(m, rot(x, ey + 0.05, cz + 0.004, 0, 0, s * -0.32), () => m.box(0, 0, 0, 0.07, 0.016, 0.022, sh(skin, 0.5), MAT.matte));
    } else {
      sq(m, x, ey, cz - 0.002, 0.027, 0.035, 0.015, 1, 1, '#1E1A18', MAT.plastic, 12, 8);
      sq(m, x, ey - 0.004, cz + 0.006, 0.018, 0.023, 0.009, 1, 1, C(o.iris || '#5A3A24'), MAT.plastic, 10, 6);
      sq(m, x, ey - 0.004, cz + 0.011, 0.0095, 0.012, 0.006, 1, 1, '#0E0B0A', MAT.plastic, 8, 5);
      ball(m, x - 0.008, ey + 0.011, cz + 0.014, 0.0062, '#FFFFFF', MAT.flat, 6);
      ball(m, x + 0.007, ey - 0.012, cz + 0.013, 0.003, '#FFFFFF', MAT.flat, 5);
      const bc = C(o.browCol || '#3A2A20'), br = o.brow == null ? 0.08 : o.brow;
      const b0 = [x - s * 0.034, ey + 0.05 - br * 0.05 * s * -s, cz - 0.004], b1 = [x + s * 0.002, ey + 0.062, cz + 0.004], b2 = [x + s * 0.036, ey + 0.052 + br * 0.08, cz - 0.008];
      tube(m, b0, b1, 0.0095, 0.011, 6, bc, MAT.matte, true); tube(m, b1, b2, 0.011, 0.007, 6, bc, MAT.matte, true);
      if (o.lashes) tube(m, [x + s * 0.024, ey + 0.026, cz + 0.004], [x + s * 0.04, ey + 0.034, cz - 0.006], 0.005, 0.003, 5, '#1A1412', MAT.matte, true);
    }
  }
  sq(m, 0, cy - 0.045, cz + 0.008, 0.024, 0.032, 0.028, 1, 1, sh(skin, 0.95), MAT.matte, 8, 5);
  if (o.zombie) {
    sq(m, 0.005, cy - 0.11, cz - 0.012, 0.06, 0.035, 0.03, 1, 1, '#2A1514', MAT.matte, 10, 6);
    for (let i = 0; i < 5; i++) { const x = -0.04 + i * 0.02; m.box(x, cy - 0.088 - (i % 2) * 0.004, cz + 0.006, 0.012, 0.016, 0.01, '#E6DCC2', MAT.matte); }
    for (let i = 0; i < 4; i++) { const x = -0.03 + i * 0.02; m.box(x, cy - 0.138 + (i % 2) * 0.004, cz + 0.004, 0.012, 0.014, 0.01, '#D8CCB0', MAT.matte); }
  } else {
    const mc = C(o.lip || '#7A3E36'), sm = o.smirk || 0.0;
    tube(m, [-0.04, cy - 0.102 + sm * 0.02, cz - 0.03], [0.0, cy - 0.108, cz - 0.012], 0.0055, 0.006, 6, mc, MAT.matte, true);
    tube(m, [0.0, cy - 0.108, cz - 0.012], [0.04, cy - 0.102 + sm * 0.05, cz - 0.03], 0.006, 0.0055, 6, mc, MAT.matte, true);
  }
}

function hairShell(m, cx, cy, cz, rx, ry, rz, col, o = {}) {
  const seg = 20, rows = 12, cut = o.cut == null ? 0.42 : o.cut, line = o.line == null ? 0.42 : o.line, back = o.back == null ? -0.35 : o.back;
  sq(m, cx, cy, cz, rx, ry, rz, 0.98, 0.98, col, MAT.matte, seg, rows, (i, j) => {
    const v = -Math.PI / 2 + (Math.PI * (i + 0.5)) / rows;
    const u = -Math.PI + (2 * Math.PI * (j + 0.5)) / seg;
    const front = Math.sin(u);
    if (front > cut && v < line) return null;
    if (front > -0.2 && v < 0.05) return null;
    if (v < back) return null;
    return [sh(col, 0.92 + 0.12 * hsh(i, j, 7)), MAT.matte];
  });
}

function tufts(m, cy, col, n, seed, o = {}) {
  for (let i = 0; i < n; i++) {
    const a = -Math.PI * (o.spread || 0.75) + (i / Math.max(1, n - 1)) * Math.PI * 2 * (o.spread || 0.75) + (hsh(seed, i) - 0.5) * 0.3;
    const up = o.up == null ? 0.12 : o.up;
    const p0 = [Math.sin(a) * 0.16, cy + up + hsh(seed, i, 2) * 0.03, Math.cos(a) * 0.15 - (o.back || 0.02)];
    const p1 = [Math.sin(a) * 0.2 + (o.dx || 0), cy + up + 0.03 + hsh(seed, i, 3) * 0.04 + (o.lift || 0), Math.cos(a) * 0.2 - (o.back || 0.02) + (o.dz || 0)];
    cone(m, p0, p1, 0.05 + hsh(seed, i, 4) * 0.02, 6, sh(col, 0.9 + hsh(seed, i, 5) * 0.18), MAT.matte);
  }
}

function capHat(m, cy, col, o = {}) {
  const c = C(col);
  sq(m, 0, cy + 0.1, -0.01, 0.216, 0.135, 0.218, 0.9, 0.95, c, MAT.trim, 20, 10, (i) => (i < 4 ? null : [c, MAT.trim]));
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; tube(m, [0, cy + 0.235, -0.01], [Math.cos(a) * 0.2, cy + 0.11, Math.sin(a) * 0.2 - 0.01], 0.006, 0.006, 4, sh(c, 0.8), MAT.trim, false); }
  m.box(0, cy + 0.07, -0.226, 0.09, 0.05, 0.012, sh(c, 0.6), MAT.trim);
  m.smoothCyl(0, cy + 0.07, -0.01, 0.214, 0.035, 20, sh(c, 0.85), MAT.trim, { cap: false });
  withT(m, rot(0, cy + 0.085, 0.17, 0, -0.12), () => sq(m, 0, 0, 0.05, 0.16, 0.014, 0.1, 0.4, 0.8, sh(c, 0.92), MAT.trim, 14, 5));
  ball(m, 0, cy + 0.225, -0.01, 0.018, sh(c, 0.8), MAT.trim, 6);
  if (o.logo) withT(m, rot(0, cy + 0.15, 0.198, 0, -0.35), () => m.box(0, 0, 0, 0.07, 0.045, 0.01, C(o.logo), MAT.matte));
}

function torso(m, o) {
  const shirt = C(o.shirt), pants = C(o.pants);
  const fat = o.fat || 0, slim = o.slim || 0;
  sq(m, 0, 0.885, -0.01, 0.185 + fat * 0.04, 0.115, 0.122 + fat * 0.02, 0.7, 0.85, pants, MAT.matte, 14, 8);
  sq(m, 0, 1.09, 0.0, 0.212 + fat * 0.1 - slim * 0.03, 0.235, 0.135 + fat * 0.1, 0.72, 0.78, shirt, MAT.matte, 18, 10);
  if (fat) sq(m, 0, 1.0, 0.07, 0.22 * fat + 0.08, 0.17, 0.16 * fat + 0.04, 0.9, 0.9, o.belly || shirt, MAT.matte, 14, 8);
  sq(m, 0, 1.255, -0.005, 0.232 + fat * 0.05 - slim * 0.035, 0.1, 0.128 + fat * 0.04, 0.55, 0.78, shirt, MAT.matte, 18, 7);
  if (!o.zombie) m.smoothCyl(0, 0.9, -0.005, 0.2 + fat * 0.1 - slim * 0.03, 0.04, 20, sh(shirt, 0.9), MAT.matte, { cap: false });
  if (o.belt !== false) { m.smoothCyl(0, 0.9, -0.01, 0.19 + fat * 0.05, 0.045, 20, C(o.beltCol || '#3A2C22'), MAT.plastic, { cap: false }); m.box(0, 0.892, 0.122 + fat * 0.06, 0.055, 0.04, 0.02, C('#B8A070'), MAT.metal); }
  m.smoothCyl(0, 1.3, 0.0, 0.058, 0.09, 12, C(o.skin), MAT.matte, { cap: false });
  if (!o.zombie && !o.collar && !o.hood) m.smoothCyl(0, 1.335, 0.0, 0.082, 0.02, 14, sh(shirt, 0.82), MAT.matte, { cap: false });
  if (o.zip) m.box(0, 1.08, 0.136, 0.012, 0.42, 0.006, C(o.zip), MAT.metal);
  if (o.plaid) { for (let i = 0; i < 5; i++) { const y = 0.94 + i * 0.075; m.smoothCyl(0, y, 0.0, 0.216, 0.016, 18, C(o.plaid), MAT.matte, { cap: false }); } for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; m.box(Math.cos(a) * 0.205, 1.1, Math.sin(a) * 0.128, 0.018, 0.4, 0.018, C(o.plaid), MAT.matte); } }
  if (o.graphic) m.box(0.0, 1.13, 0.137, 0.11, 0.09, 0.006, C(o.graphic), MAT.matte);
  if (o.bandolier) { for (let i = 0; i < 9; i++) { const t = i / 8; const p = [-0.2 + t * 0.4, 1.3 - t * 0.38, 0.135 + Math.sin(t * Math.PI) * 0.012]; withT(m, rot(p[0], p[1], p[2], 0, 0, -0.75), () => m.box(0, 0, 0, 0.07, 0.035, 0.03, C('#5A4430'), MAT.matte)); withT(m, rot(p[0], p[1] + 0.004, p[2] + 0.018, 0, 0, -0.75), () => m.box(0, 0.0, 0, 0.022, 0.05, 0.022, C('#C8322A'), MAT.plastic)); } }
  if (o.patch) { m.box(0, 1.15, 0.138, 0.075, 0.075, 0.008, C(o.patch), MAT.matte); m.box(0, 1.15, 0.143, 0.045, 0.012, 0.004, C('#F4F4F0'), MAT.flat); m.box(0, 1.15, 0.143, 0.012, 0.045, 0.004, C('#F4F4F0'), MAT.flat); }
  if (o.scarf) { m.smoothCyl(0, 1.27, 0.0, 0.13, 0.08, 16, C(o.scarf), MAT.matte); sq(m, 0.04, 1.22, 0.11, 0.06, 0.07, 0.03, 0.8, 0.8, sh(o.scarf, 0.9), MAT.matte, 8, 5); }
}

function legMesh(o) {
  const l = new MeshBuilder();
  const pants = C(o.pants), shoe = C(o.shoe || '#3A3632'), sole = C(o.sole || '#E8E2D6');
  const L = o.legLen || 0.76, r = o.legR || 0.084;
  const knee = [0, -L * 0.5, 0.02];
  tube(l, [0, 0.04, 0], knee, r * 1.14, r * 0.98, 12, pants, MAT.matte, false);
  ball(l, knee[0], knee[1], knee[2], r * 0.99, sh(pants, 0.96), MAT.matte, 10);
  const shin = o.shorts ? C(o.skin) : pants;
  tube(l, knee, [0, -L + 0.12, 0], r * 0.97, r * 0.9, 12, shin, MAT.matte, false);
  if (o.shorts) tube(l, [0, -L * 0.12, 0.004], [0, -L * 0.42, 0.014], r * 1.3, r * 1.26, 12, pants, MAT.matte, true);
  if (!o.shorts && !o.zombie) {
    tube(l, [0, -L * 0.5 + 0.03, 0.021], [0, -L * 0.5 - 0.03, 0.021], r * 1.005, r * 1.0, 12, sh(pants, 0.86), MAT.matte, false);
    for (const y of [-L * 0.2, -L * 0.72]) l.box(0, y, r * 0.92, 0.005, 0.12, 0.004, sh(pants, 1.15), MAT.matte);
  }
  if (o.cargo) { l.box(-r * 0.98, -L * 0.36, 0.0, 0.03, 0.15, 0.12, sh(pants, 0.86), MAT.matte); l.box(-r * 1.08, -L * 0.29, 0.0, 0.012, 0.03, 0.12, sh(pants, 0.75), MAT.matte); }
  if (o.kneepad) sq(l, 0, knee[1], r * 0.95, r * 0.9, 0.07, 0.035, 0.8, 0.8, C(o.kneepad), MAT.plastic, 10, 6);
  if (o.torn) for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + hsh(i, 9) * 0.5; const p0 = [Math.cos(a) * r * 0.93, -L + 0.2, Math.sin(a) * r * 0.93]; const w = 0.03 + hsh(i, 4) * 0.02, d = 0.05 + hsh(i, 5) * 0.07; const t = [-Math.sin(a) * w, 0, Math.cos(a) * w]; l.quad([p0[0] - t[0], p0[1], p0[2] - t[2]], [p0[0] + t[0], p0[1], p0[2] + t[2]], [p0[0] * 1.06, p0[1] - d, p0[2] * 1.06], [p0[0] * 1.06, p0[1] - d * 0.6, p0[2] * 1.06], sh(pants, 0.82 + hsh(i, 6) * 0.2), MAT.matte); }
  if (o.boot) {
    tube(l, [0, -L + 0.2, 0], [0, -L + 0.045, 0.0], r * 1.06, r * 1.1, 12, shoe, MAT.plastic, false);
    l.smoothCyl(0, -L + 0.17, 0, r * 1.12, 0.03, 12, sh(shoe, 0.8), MAT.matte, { cap: false });
    sq(l, 0, -L + 0.04, 0.06, 0.085, 0.06, 0.15, 0.55, 0.65, shoe, MAT.plastic, 12, 7);
    sq(l, 0, -L - 0.005, 0.06, 0.09, 0.025, 0.155, 0.35, 0.55, sh(shoe, 0.45), MAT.matte, 12, 5);
  } else {
    sq(l, 0, -L + 0.045, 0.05, 0.082, 0.058, 0.145, 0.55, 0.65, shoe, MAT.plastic, 12, 7);
    sq(l, 0, -L + 0.03, 0.15, 0.06, 0.04, 0.05, 0.7, 0.7, sh(shoe, 1.12), MAT.plastic, 10, 6);
    sq(l, 0, -L - 0.004, 0.055, 0.088, 0.024, 0.152, 0.35, 0.55, sole, MAT.matte, 12, 5);
    if (o.laces) for (let i = 0; i < 3; i++) l.box(0, -L + 0.098 - i * 0.008, 0.035 + i * 0.03, 0.07, 0.01, 0.014, C(o.laces), MAT.matte);
  }
  return l.build();
}

function backpack(m, col, o = {}) {
  const c = C(col);
  sq(m, 0, 1.1, -0.2, 0.17, 0.2, 0.09, 0.6, 0.7, c, MAT.matte, 14, 8);
  sq(m, 0, 1.0, -0.29, 0.13, 0.09, 0.04, 0.6, 0.7, sh(c, 0.85), MAT.matte, 12, 6);
  m.box(0, 1.27, -0.2, 0.3, 0.025, 0.16, sh(c, 0.8), MAT.matte);
  if (o.roll) withT(m, rot(0, 1.34, -0.2, Math.PI / 2, 0, Math.PI / 2), () => m.smoothCyl(0, -0.19, 0, 0.065, 0.38, 14, C(o.roll), MAT.matte));
  for (const s of [-1, 1]) {
    tube(m, [s * 0.11, 1.3, -0.12], [s * 0.125, 1.345, 0.02], 0.022, 0.022, 6, sh(c, 0.75), MAT.matte, false);
    tube(m, [s * 0.125, 1.345, 0.02], [s * 0.13, 1.25, 0.13], 0.02, 0.02, 6, sh(c, 0.75), MAT.matte, false);
    tube(m, [s * 0.13, 1.25, 0.13], [s * 0.14, 1.05, 0.14], 0.02, 0.02, 6, sh(c, 0.75), MAT.matte, false);
    m.box(s * 0.13, 1.16, 0.142, 0.045, 0.03, 0.012, C('#2A2A2C'), MAT.plastic);
  }
  m.box(0.12, 1.12, -0.29, 0.06, 0.1, 0.03, sh(c, 0.7), MAT.matte);
}

function vest(m, col, o = {}) {
  const c = C(col);
  sq(m, 0, 1.1, 0.0, 0.225, 0.2, 0.15, 0.7, 0.75, c, MAT.matte, 16, 9, (i, j) => { const u = -Math.PI + (2 * Math.PI * (j + 0.5)) / 16; return Math.sin(u) > 0.88 && i > 3 ? null : [sh(c, 0.94 + 0.1 * hsh(i, j, 3)), MAT.matte]; });
  if (o.pouches) for (const x of [-0.1, 0, 0.1]) m.box(x, 0.98, 0.14, 0.07, 0.1, 0.04, sh(c, 0.82), MAT.matte);
  if (o.stripe) for (const y of [1.0, 1.16]) m.smoothCyl(0, y, 0.0, 0.232, 0.03, 18, C(o.stripe), MAT.glass, { cap: false });
}

function headBase(m, o) {
  const skin = C(o.skin);
  const hy = o.headY || 1.53, hz = o.headZ || 0.0;
  sq(m, 0, hy, hz, 0.19, 0.215, 0.19, 0.84, 0.9, skin, MAT.matte, 18, 12);
  for (const s of [-1, 1]) sq(m, s * 0.188, hy - 0.01, hz - 0.01, 0.025, 0.05, 0.035, 0.9, 0.9, sh(skin, 0.95), MAT.matte, 8, 5);
  face(m, hy, hz + 0.185, o);
  return { hy, hz };
}

const POSE = {
  aim: (kind) => ({
    pistol: { at: [-0.07, 1.28, 0.44], yaw: 0.07, pitch: 0 },
    shotgun: { at: [-0.15, 1.2, 0.4], yaw: 0.05, pitch: 0.01 },
    sniper: { at: [-0.14, 1.19, 0.37], yaw: 0.05, pitch: 0.0 },
    smg: { at: [-0.135, 1.2, 0.33], yaw: 0.05, pitch: 0.01 },
  }[kind] || { at: [-0.15, 1.2, 0.41], yaw: 0.05, pitch: 0.01 }),
  ready: (kind) => ({
    pistol: { at: [-0.14, 0.98, 0.22], yaw: 0.3, pitch: 0.75 },
    bat: { at: [-0.16, 1.02, 0.18], yaw: 0.2, pitch: -1.25 },
    sniper: { at: [-0.17, 0.98, 0.26], yaw: 0.6, pitch: 0.38, roll: -0.25 },
    shotgun: { at: [-0.17, 0.99, 0.26], yaw: 0.58, pitch: 0.4, roll: -0.22 },
  }[kind] || { at: [-0.16, 1.0, 0.25], yaw: 0.56, pitch: 0.42, roll: -0.22 }),
};

export function muzzleOf(spec, poseName = 'aim') {
  const kind = spec.gun || 'rifle';
  const P = (POSE[poseName] || POSE.ready)(kind);
  const G = m4.pose(P.at[0], P.at[1], P.at[2], P.yaw || 0, P.pitch || 0, P.roll || 0);
  return ap(G, (GUNS[kind] || GUNS.rifle).muzzle);
}

export function survivorMeshes(spec, poseName = 'ready') {
  const b = new MeshBuilder();
  const o = spec;
  torso(b, o);
  if (o.vest) vest(b, o.vest, o.vestOpt || {});
  if (o.pack) backpack(b, o.pack, { roll: o.roll });
  if (o.shirt2) { for (const s of [-1, 1]) b.box(s * 0.105, 1.07, 0.118, 0.06, 0.3, 0.02, C(o.shirt2), MAT.matte); }
  if (o.collar) { b.smoothCyl(0, 1.3, 0.0, 0.1, 0.045, 14, C(o.collar), MAT.matte, { cap: false }); }
  if (o.hood) sq(b, 0, 1.33, -0.11, 0.17, 0.08, 0.1, 0.7, 0.8, C(o.hood), MAT.matte, 12, 6);
  const headT = poseName === 'aim' ? m4.mul(m4.pose(0, 1.33, 0, -0.1, 0.12, 0.13), m4.pose(0, -1.33, 0, 0)) : m4.mul(m4.pose(0, 1.33, 0, o.lookYaw || 0, o.lookPitch || 0, 0), m4.pose(0, -1.33, 0, 0));
  withT(b, headT, () => {
  const { hy } = headBase(b, o);
  if (o.hair === 'cap') { hairShell(b, 0, hy + 0.02, -0.012, 0.205, 0.225, 0.205, o.hairCol, { cut: 0.3, line: 0.0, back: -0.55 }); capHat(b, hy, o.cap, { logo: o.capLogo }); }
  else if (o.hair === 'pony') { hairShell(b, 0, hy + 0.025, -0.01, 0.208, 0.235, 0.21, o.hairCol, { cut: 0.48, line: 0.5, back: -0.5 }); for (let i = 0; i < 5; i++) cone(b, [-0.12 + i * 0.045, hy + 0.2, 0.11], [-0.16 + i * 0.05, hy + 0.12 - i * 0.012, 0.2], 0.04, 6, sh(o.hairCol, 1.0 + (i % 2) * 0.12), MAT.matte); tube(b, [0, hy + 0.1, -0.2], [0, hy - 0.18, -0.29], 0.06, 0.035, 10, sh(o.hairCol, 0.95), MAT.matte, true); ball(b, 0, hy + 0.09, -0.21, 0.04, C(o.tie || '#C83A3A'), MAT.trim, 8); sq(b, -0.06, hy + 0.17, 0.12, 0.13, 0.05, 0.09, 0.8, 0.8, sh(o.hairCol, 1.05), MAT.matte, 10, 6); }
  else if (o.hair === 'bob') { hairShell(b, 0, hy + 0.0, -0.01, 0.215, 0.24, 0.215, o.hairCol, { cut: 0.5, line: 0.45, back: -0.95 }); for (let i = 0; i < 5; i++) { const x = -0.12 + i * 0.06; sq(b, x, hy + 0.14 - Math.abs(x) * 0.25, 0.165 - Math.abs(x) * 0.25, 0.045, 0.075, 0.035, 0.9, 0.9, sh(o.hairCol, 0.95 + (i % 2) * 0.12), MAT.matte, 8, 6); } for (const sg of [-1, 1]) for (let i = 0; i < 3; i++) sq(b, sg * 0.205, hy - 0.07, 0.06 - i * 0.09, 0.04, 0.13, 0.055, 0.9, 0.9, sh(o.hairCol, 0.92 + i * 0.05), MAT.matte, 8, 6); }
  else if (o.hair === 'beanie') { hairShell(b, 0, hy - 0.02, -0.012, 0.204, 0.22, 0.204, o.hairCol, { cut: 0.4, line: -0.1, back: -0.7 }); sq(b, 0, hy + 0.1, -0.01, 0.212, 0.15, 0.212, 0.8, 0.9, C(o.cap), MAT.matte, 18, 9, (i) => (i < 4 ? null : [C(o.cap), MAT.matte])); b.smoothCyl(0, hy + 0.05, -0.01, 0.218, 0.07, 20, sh(o.cap, 0.88), MAT.matte, { cap: false }); }
  else if (o.hair === 'short') { hairShell(b, 0, hy + 0.035, -0.012, 0.2, 0.215, 0.2, o.hairCol, { cut: 0.5, line: 0.62, back: -0.3 }); tufts(b, hy, o.hairCol, 9, 4, { up: 0.13, spread: 0.6, lift: -0.01 }); }
  else if (o.hair === 'bald' && o.bandana) { b.smoothCyl(0, hy + 0.06, -0.005, 0.196, 0.06, 20, C(o.bandana), MAT.matte, { cap: false }); }
  if (o.beard) { sq(b, 0, hy - 0.12, 0.08, 0.16, 0.1, 0.12, 0.8, 0.9, C(o.beard), MAT.matte, 14, 8, (i, j) => { const u = -Math.PI + (2 * Math.PI * (j + 0.5)) / 14; return Math.sin(u) < -0.2 ? null : [sh(o.beard, 0.9 + 0.15 * hsh(i, j, 5)), MAT.matte]; }); }
  if (o.glasses) for (const s of [-1, 1]) { withT(b, rot(s * 0.074, hy + 0.005, 0.2, 0, Math.PI / 2), () => b.smoothCyl(0, 0, 0, 0.038, 0.008, 14, C('#1E1E22'), MAT.trim)); }
  if (o.mask) sq(b, 0, hy - 0.08, 0.1, 0.16, 0.08, 0.11, 0.8, 0.8, C(o.mask), MAT.matte, 14, 7, (i, j) => { const u = -Math.PI + (2 * Math.PI * (j + 0.5)) / 14; return Math.sin(u) < 0.1 ? null : [C(o.mask), MAT.matte]; });
  });
  const kind = o.gun || 'rifle';
  const P = (POSE[poseName] || POSE.ready)(kind);
  const G = m4.pose(P.at[0], P.at[1], P.at[2], P.yaw || 0, P.pitch || 0, P.roll || 0);
  withT(b, G, () => buildGun(b, kind, o.gunOpt || {}));
  const HF = handFrames(kind, G);
  const armO = { sleeveCol: o.shirt, skin: o.skin, sleeve: o.sleeve == null ? 0.55 : o.sleeve, glove: o.glove, cuff: o.cuff, r: 0.058, L1: 0.33, L2: 0.34, noHand: true };
  if (HF.right) { arm(b, [-0.245, 1.25, -0.01], HF.right.wrist, { ...armO, pole: [-1, -1.4, -0.6] }); gripHand(b, HF.right.F, HF.right.rg, o.skin, o.glove, { trigger: true, fingerless: o.fingerless }); }
  if (HF.left) { arm(b, [0.215, 1.25, poseName === 'aim' ? 0.09 : -0.01], HF.left.wrist, { ...armO, pole: [1, -1.6, -0.2] }); gripHand(b, HF.left.F, HF.left.rg, o.skin, o.glove, { fingerless: o.fingerless }); }
  if (o.holster) { b.box(-0.2, 0.84, 0.02, 0.05, 0.14, 0.09, C('#3A2C22'), MAT.matte); }
  if (o.radio) { b.box(0.14, 1.2, 0.13, 0.04, 0.08, 0.025, C('#2A2C30'), MAT.trim); tube(b, [0.15, 1.24, 0.13], [0.15, 1.32, 0.13], 0.004, 0.004, 5, C('#2A2C30'), MAT.trim); }
  return { body: b.build(), leg: legMesh(o), hip: [0.095, 0.84], gun: kind };
}

export const SURVIVORS = [
  { key: 'jay', name: 'Jay', iris: '#6A4A2E', skin: '#E8B48C', hair: 'cap', hairCol: '#4A3326', cap: '#2F3A4A', capLogo: '#E8A63A', shirt: '#E2B33C', graphic: '#7A5A24', pants: '#3E5675', shoe: '#6A5440', sole: '#EDE6D6', laces: '#E8E0D0', pack: '#5E6B45', roll: '#8A6A44', gun: 'rifle', sleeve: 0.5, browCol: '#3A2A20' },
  { key: 'maya', name: 'Maya', iris: '#4A2E1E', lashes: true, lip: '#9A4A46', skin: '#C98E66', hair: 'pony', hairCol: '#2A1C16', tie: '#E04A3A', shirt: '#C23B37', hood: '#A93230', zip: '#D8D8D8', bandolier: true, pants: '#5A5E46', cargo: true, kneepad: '#2E3036', shoe: '#2A2A2E', sole: '#D8D2C6', gun: 'shotgun', sleeve: 1.8, cuff: '#9C2E2B', browCol: '#241612', glove: '#2E2A28' },
  { key: 'tom', name: 'Big Tom', iris: '#3E6A8A', skin: '#E3A884', hair: 'beanie', hairCol: '#6B4A32', cap: '#3E6B5A', beard: '#6B4A32', shirt: '#8A2E2A', plaid: '#4A1A18', pants: '#3A3F48', cargo: true, shoe: '#5A3E26', boot: true, gun: 'smg', sleeve: 1.9, cuff: '#5A1F1C', fat: 0.35, vest: '#2E3238', vestOpt: { pouches: true }, browCol: '#4A3020', glove: '#2A2622' },
  { key: 'rin', name: 'Rin', iris: '#2E2A26', lashes: true, lip: '#A8565A', skin: '#F0C6A4', hair: 'bob', hairCol: '#1E1E26', shirt: '#4E6B4A', zip: '#2E3A2C', scarf: '#C8B48A', pants: '#2E3540', kneepad: '#3A3E36', shoe: '#2E2A26', boot: true, gun: 'sniper', sleeve: 2, cuff: '#3E5A3A', browCol: '#1E1E26', slim: 1, pack: '#3E4E3A', radio: true, glove: '#2A2A28' },
  { key: 'doc', name: 'Doc', iris: '#3A2418', lip: '#5A3028', skin: '#8A5A3E', hair: 'short', hairCol: '#1A1412', shirt: '#3E7FC0', patch: '#3E9E5E', pants: '#2F3E5A', shoe: '#E8E8EA', sole: '#9AA0A8', laces: '#3E7FC0', gun: 'pistol', sleeve: 0.5, pack: '#E8E4DA', browCol: '#1A1412', holster: true },
];

function rags(m, y, rx, rz, col, n, seed, lenK = 1) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + hsh(seed, i) * 0.35;
    const w = 0.035 + hsh(seed, i, 3) * 0.035;
    const L = (0.05 + hsh(seed, i, 2) * 0.11) * lenK;
    const p = [Math.cos(a) * rx * 1.01, y, Math.sin(a) * rz * 1.01];
    const t = [-Math.sin(a) * w, 0, Math.cos(a) * w * (rz / rx)];
    const tip = [p[0] * 1.05 + (hsh(seed, i, 6) - 0.5) * 0.02, y - L, p[2] * 1.05];
    const c = sh(col, 0.72 + hsh(seed, i, 5) * 0.22);
    m.tri([p[0] - t[0], p[1], p[2] - t[2]], [p[0] + t[0], p[1], p[2] + t[2]], tip, c, MAT.matte);
    m.tri([p[0] + t[0], p[1], p[2] + t[2]], [p[0] - t[0], p[1], p[2] - t[2]], tip, c, MAT.matte);
  }
}

function zombieArm(m, S, H, o) {
  const r = arm(m, S, H, { sleeveCol: o.shirt, skin: o.skin, sleeve: o.sleeve == null ? 1.2 : o.sleeve, r: o.armR || 0.056, pole: [S[0] > 0 ? 1 : -1, -1.0, -0.8], handDir: [0, -0.35, 1] });
  for (let i = 0; i < 3; i++) { const f = [r.hand[0] + (i - 1) * 0.025, r.hand[1] - 0.01, r.hand[2] + 0.07]; tube(m, f, [f[0] + (i - 1) * 0.01, f[1] - 0.05, f[2] + 0.05], 0.013, 0.009, 6, C(o.skin), MAT.matte, true); }
  return r;
}

export function zombieMeshes(spec) {
  const b = new MeshBuilder();
  const o = { ...spec, zombie: true };
  const s = o.scale || 1;
  const lean = o.lean == null ? 0.22 : o.lean;
  const T = m4.mul(m4.pose(0, 0.84, 0, 0, lean, o.roll || 0.04), m4.pose(0, -0.84, 0, 0));
  withT(b, T, () => {
    torso(b, o);
    rags(b, 0.84, 0.205 + (o.fat || 0) * 0.08, 0.14 + (o.fat || 0) * 0.08, o.shirt, 9, o.seed || 3);
    if (o.tie) { tube(b, [0.01, 1.28, 0.13], [0.04, 1.02, 0.17], 0.026, 0.03, 6, C(o.tie), MAT.matte, true); }
    if (o.vest) vest(b, o.vest, o.vestOpt || {});
    if (o.number) { b.box(0, 1.12, 0.135, 0.12, 0.12, 0.012, C(o.number), MAT.matte); }
    for (let i = 0; i < 4; i++) { const a = hsh(o.seed || 1, i, 9) * Math.PI * 2; const yy = 0.95 + hsh(o.seed || 1, i, 8) * 0.3; sq(b, Math.cos(a) * 0.2, yy, Math.sin(a) * 0.13, 0.05, 0.035, 0.03, 1, 1, sh(o.shirt, 0.6), MAT.matte, 8, 5); }
    if (o.spots) for (let i = 0; i < 7; i++) { const a = 0.35 + hsh(o.seed || 2, i, 4) * 2.4; const yy = 0.9 + hsh(o.seed || 2, i, 6) * 0.22; const rr = 0.3 * (o.fat || 0) + 0.12; const p = [Math.cos(a) * rr * 0.98, yy, Math.sin(a) * (0.2 * (o.fat || 0) + 0.12) + 0.06]; const k = 0.02 + hsh(o.seed || 2, i, 7) * 0.016; const nn = nrm([p[0], 0, p[2] - 0.06]); sq(b, p[0] + nn[0] * 0.012, p[1], p[2] + nn[2] * 0.012, k * 1.3, k * 1.1, k * 0.45, 1, 1, mx(o.spots, o.skin, 0.35), MAT.matte, 8, 5); ball(b, p[0] + nn[0] * 0.02, p[1] + k * 0.15, p[2] + nn[2] * 0.02, k * 0.38, o.spots, MAT.flat, 6); }
    const hT = m4.mul(m4.pose(0, 1.35, 0.02, o.headYaw || 0.12, -lean * 0.6, o.headRoll || 0.16), m4.pose(0, -1.35, 0, 0));
    withT(b, hT, () => {
      const { hy } = headBase(b, o);
      for (let i = 0; i < 3; i++) { const a = -0.9 + hsh(o.seed || 1, i, 13) * 1.8; const yy = hy - 0.12 + hsh(o.seed || 1, i, 14) * 0.2; sq(b, Math.sin(a) * 0.18, yy, Math.cos(a) * 0.17, 0.04, 0.03, 0.02, 1, 1, mx(o.skin, '#5A4A5E', 0.45), MAT.matte, 8, 5); }
      if (o.hair === 'messy') { hairShell(b, 0, hy + 0.03, -0.012, 0.2, 0.22, 0.2, o.hairCol, { cut: 0.5, line: 0.62, back: -0.3 }); for (let i = 0; i < 6; i++) { const a = -1 + i * 0.4; cone(b, [Math.sin(a) * 0.12, hy + 0.16, Math.cos(a) * 0.06 - 0.04], [Math.sin(a) * 0.2, hy + 0.24 + hsh(i, 2) * 0.05, Math.cos(a) * 0.08 - 0.06], 0.05, 6, sh(o.hairCol, 0.9), MAT.matte); } }
      if (o.hair === 'hardhat') { b.smoothCyl(0, hy + 0.07, -0.005, 0.25, 0.022, 22, C(o.hat), MAT.paint); sq(b, 0, hy + 0.1, -0.005, 0.2, 0.15, 0.21, 0.6, 0.8, C(o.hat), MAT.paint, 18, 9, (i) => (i < 4 ? null : [C(o.hat), MAT.paint])); b.box(0, hy + 0.2, -0.005, 0.04, 0.05, 0.36, sh(o.hat, 0.9), MAT.paint); }
      if (o.hair === 'capback') { hairShell(b, 0, hy + 0.02, -0.012, 0.205, 0.225, 0.205, o.hairCol, { cut: 0.3, line: 0.0, back: -0.55 }); withT(b, rot(0, 0, 0, Math.PI), () => capHat(b, hy, o.cap)); }
      if (o.stitch) for (let i = 0; i < 4; i++) b.box(-0.06 + i * 0.035, hy + 0.17 - i * 0.012, 0.13, 0.008, 0.04, 0.01, C('#3A2A28'), MAT.matte);
      if (o.bald) sq(b, 0, hy + 0.06, -0.01, 0.2, 0.18, 0.2, 0.86, 0.9, sh(o.skin, 1.06), MAT.matte, 16, 9, (i) => (i < 6 ? null : [sh(o.skin, 1.04), MAT.matte]));
    });
    const sa = 0.225 + (o.fat || 0) * 0.08;
    zombieArm(b, [-sa, 1.245, -0.01], o.reachR || [-0.2, 1.26, 0.52], o);
    zombieArm(b, [sa, 1.245, -0.01], o.reachL || [0.16, 1.16, 0.5], o);
    if (o.chain) { for (let i = 0; i < 8; i++) { const t = i / 7; const p = [-0.36 - t * 0.05, 1.02 - t * 0.45, 0.3 - t * 0.1]; withT(b, rot(p[0], p[1], p[2], i * 0.9, i % 2 ? Math.PI / 2 : 0), () => b.smoothCyl(0, -0.02, 0, 0.03, 0.04, 8, C('#6A6E74'), MAT.metal, { cap: false })); } }
  });
  const leg = legMesh({ ...o, torn: o.tornLegs !== false });
  if (s !== 1) {
    const sc = (data) => { for (let i = 0; i < data.length; i += 10) { data[i] *= s; data[i + 1] *= s; data[i + 2] *= s; } return data; };
    return { body: sc(b.build()), leg: sc(leg), hip: [0.095 * s, 0.84 * s], scale: s };
  }
  return { body: b.build(), leg, hip: [0.095, 0.84], scale: 1 };
}

export const ZOMBIES = [
  { key: 'walker', name: 'Walker', skin: '#9AAE8C', shirt: '#D2CDBC', tie: '#7A2E34', pants: '#4A4A52', shoe: '#2A2622', hair: 'messy', hairCol: '#4A4036', sleeve: 1.4, seed: 3, eye: '#FFC23A' },
  { key: 'worker', name: 'Worker', skin: '#8E9F88', shirt: '#5E6E84', pants: '#3E4F68', shoe: '#5A3E26', boot: true, hair: 'hardhat', hat: '#F2C230', vest: '#F27A1E', vestOpt: { stripe: '#E8ECEA' }, sleeve: 0.6, seed: 5, eye: '#FFB02A', headRoll: -0.12 },
  { key: 'runner', name: 'Runner', skin: '#A6B394', shirt: '#B3302E', number: '#F2EEE6', pants: '#2E3138', shoe: '#E8E6E0', sole: '#2A2A2A', laces: '#B3302E', hair: 'capback', hairCol: '#2A221C', cap: '#2E3138', sleeve: 0.45, slim: 1, lean: 0.48, seed: 8, eye: '#FF8A2A', reachR: [-0.26, 1.02, 0.42], reachL: [0.24, 1.28, 0.36] },
  { key: 'bloater', name: 'Bloater', skin: '#97AE80', shirt: '#E2DCC8', belly: '#9DB487', pants: '#5A4E3E', shoe: '#3A3028', bald: true, fat: 1, spots: '#A8E040', sleeve: 0.0, seed: 13, eye: '#C8FF4A', lean: 0.1 },
  { key: 'brute', name: 'Brute', skin: '#7F9A72', shirt: '#4E5E34', pants: '#3A4A5E', shoe: '#2E2622', boot: true, bald: true, stitch: true, fat: 0.45, sleeve: 0.0, armR: 0.085, scale: 1.55, seed: 21, chain: true, eye: '#FF4A2A', lean: 0.16, reachR: [-0.3, 1.18, 0.48], reachL: [0.26, 1.06, 0.46] },
];

function hull(m, base, roof, glass, frame, paint, o = {}) {
  const [bx, by, bz0, bz1] = base, [rx, ry, rz0, rz1] = roof;
  const B = (sx, z) => [sx * bx, by, z], Rf = (sx, z) => [sx * rx, ry, z];
  m.quad(B(-1, bz1), B(1, bz1), Rf(1, rz1), Rf(-1, rz1), glass, MAT.glass);
  m.quad(B(1, bz0), B(-1, bz0), Rf(-1, rz0), Rf(1, rz0), glass, MAT.glass);
  for (const sx of [-1, 1]) {
    if (sx > 0) m.quad(B(1, bz1), B(1, bz0), Rf(1, rz0), Rf(1, rz1), o.sideCol || glass, o.sideCol ? MAT.paint : MAT.glass);
    else m.quad(B(-1, bz0), B(-1, bz1), Rf(-1, rz1), Rf(-1, rz0), o.sideCol || glass, o.sideCol ? MAT.paint : MAT.glass);
    tube(m, B(sx, bz1), Rf(sx, rz1), 0.045, 0.04, 6, paint, MAT.paint, false);
    tube(m, B(sx, bz0), Rf(sx, rz0), 0.07, 0.06, 6, paint, MAT.paint, false);
    if (o.bpillar != null) { const t = o.bpillar; const zb = bz0 + (bz1 - bz0) * t, zr = rz0 + (rz1 - rz0) * t; tube(m, [sx * bx * 1.002, by, zb], [sx * rx * 1.002, ry, zr], 0.04, 0.035, 6, frame, MAT.trim, false); }
    tube(m, [sx * bx * 1.004, by + 0.01, bz0], [sx * bx * 1.004, by + 0.01, bz1], 0.018, 0.018, 5, frame, MAT.trim, false);
  }
  sq(m, 0, ry + 0.012, (rz0 + rz1) / 2, rx + 0.03, 0.035, (rz1 - rz0) / 2 + 0.05, 0.4, 0.35, paint, MAT.paint, 16, 6);
}

export function carMesh(kind = 'sedan', o = {}) {
  const m = new MeshBuilder();
  const seed = o.seed || 1;
  const paint0 = C(o.paint || '#6A8CA8');
  const burnt = !!o.burnt;
  const paint = burnt ? C('#3A3532') : paint0;
  const glass = C(o.broken || burnt ? '#14181C' : '#33495A'), frame = C('#1F2124'), chrome = C(burnt ? '#3A3634' : '#B4B9C0'), dark = C('#202226');
  const dirt = o.dirt == null ? 0.4 : o.dirt;
  const pa = (yRow, rows) => (i, j) => {
    const y = i / rows;
    const r = hsh(seed, i, j);
    let c = mx(paint, sh(paint, 0.86), r * 0.5);
    if (y < 0.45) c = mx(c, C('#6A5A48'), dirt * (0.45 - y) * 1.8);
    if (o.rust && hsh(seed + 3, i >> 1, j >> 2) > 1 - o.rust) c = mx(c, C('#7A4A2A'), 0.8 + r * 0.2);
    if (burnt) c = mx(c, C(r > 0.6 ? '#5A3A26' : '#1E1C1C'), 0.4 + r * 0.4);
    return [c, burnt ? MAT.matte : MAT.paint];
  };
  const van = kind === 'van', pick = kind === 'pickup';
  const L = van ? 2.4 : pick ? 2.55 : 2.25, W = van ? 0.98 : pick ? 0.96 : 0.9;
  const wz = van ? 1.55 : pick ? 1.7 : 1.42, wr = pick ? 0.4 : 0.35;
  sq(m, 0, 0.66, 0, W, 0.3, L, 0.3, 0.2, paint, MAT.paint, 24, 10, pa(0, 10));
  if (pick) {
    const zb0 = -L + 0.15, zb1 = -0.25;
    for (const sx of [-1, 1]) m.box(sx * (W - 0.05), 0.92, (zb0 + zb1) / 2, 0.08, 0.14, zb1 - zb0, paint, MAT.paint);
    m.box(0, 0.92, zb0 + 0.04, W * 2 - 0.02, 0.14, 0.08, paint, MAT.paint);
    m.box(0, 0.955, (zb0 + zb1) / 2, W * 2 - 0.16, 0.02, zb1 - zb0 - 0.06, sh(paint, 0.45), MAT.matte);
    for (let i = 0; i < 6; i++) m.box(0, 0.968, zb0 + 0.15 + i * 0.36, W * 2 - 0.2, 0.012, 0.05, sh(paint, 0.35), MAT.matte);
    if (o.cargo) { m.box(-0.35, 0.96, -1.2, 0.62, 0.42, 0.55, C('#8A6A44'), MAT.matte); m.box(0.3, 0.96, -1.8, 0.55, 0.32, 0.5, C('#5E6E4E'), MAT.matte); withT(m, rot(0.25, 1.1, -0.85, 0.3, 0, Math.PI / 2), () => m.smoothCyl(0, -0.3, 0, 0.17, 0.6, 14, C('#C23A2A'), MAT.plastic)); }
    hull(m, [W - 0.06, 0.95, -0.2, 0.75], [W - 0.14, 1.6, -0.05, 0.3], glass, frame, paint, { bpillar: null });
  } else if (van) {
    sq(m, 0, 1.5, -0.45, W - 0.01, 0.56, L - 0.45, 0.35, 0.25, paint, MAT.paint, 24, 10, pa(0, 10));
    hull(m, [W - 0.05, 0.95, 1.35, 2.0], [W - 0.1, 1.85, 1.2, 1.55], glass, frame, paint, { bpillar: null });
    for (const sx of [-1, 1]) { m.box(sx * (W + 0.002), 1.45, 0.9, 0.01, 0.5, 0.75, glass, MAT.glass); m.box(sx * (W + 0.004), 1.1, -0.2, 0.012, 0.9, 0.012, dark, MAT.trim); m.box(sx * (W + 0.004), 1.1, -1.3, 0.012, 0.9, 0.012, dark, MAT.trim); }
    m.box(0, 1.45, -L - 0.005, W * 1.2, 0.45, 0.01, glass, MAT.glass);
    if (o.stripe) for (const sx of [-1, 1]) m.box(sx * (W + 0.003), 1.25, -0.6, 0.01, 0.16, 2.6, C(o.stripe), MAT.paint);
  } else {
    hull(m, [W - 0.06, 0.95, -1.15, 0.72], [W - 0.17, 1.47, -0.66, 0.16], glass, frame, paint, { bpillar: 0.52 });
  }
  if (!burnt && !o.broken) {
    const iz = van ? 1.2 : pick ? 0.4 : 0.2;
    for (const sx of [-1, 1]) m.box(sx * 0.36, 0.86, iz - 0.15, 0.5, 0.5, 0.45, C('#3A3A3E'), MAT.matte);
    m.box(0, 0.98, iz + 0.42, W * 1.7, 0.16, 0.25, C('#2A2A2E'), MAT.matte);
  }
  for (const sx of [-1, 1]) {
    for (const zz of [wz, -wz]) {
      const flat = (o.flat || burnt) && (zz < 0 ? sx > 0 : burnt);
      const r = flat ? wr * 0.86 : wr;
      m.wheel(sx * (W - 0.13), r, zz, r, 0.26, 20, C(burnt ? '#141414' : '#1E1E20'), burnt ? C('#4A4440') : chrome);
      withT(m, rot(sx * (W + 0.002), wr, zz, Math.PI / 2 * sx, 0, 0), () => { for (let k = 0; k < 10; k++) { const a0 = (k / 10) * Math.PI, a1 = ((k + 1) / 10) * Math.PI; const R0 = wr + 0.07, R1 = wr + 0.13; m.quad([Math.cos(a0) * R0, Math.sin(a0) * R0, 0], [Math.cos(a1) * R0, Math.sin(a1) * R0, 0], [Math.cos(a1) * R1, Math.sin(a1) * R1, 0], [Math.cos(a0) * R1, Math.sin(a0) * R1, 0], sh(paint, 0.62), MAT.paint); m.quad([Math.cos(a0) * R0, Math.sin(a0) * R0, 0.002], [Math.cos(a0) * 0.0, Math.sin(a0) * 0.0, 0.002], [Math.cos(a1) * 0.0, Math.sin(a1) * 0.0, 0.002], [Math.cos(a1) * R0, Math.sin(a1) * R0, 0.002], C('#0E0E10'), MAT.matte); } });
    }
    m.box(sx * (W - 0.25), 0.72, L - 0.005, 0.34, 0.13, 0.05, o.broken && sx > 0 ? C('#2A2A2A') : C('#F4F0DE'), o.broken && sx > 0 ? MAT.matte : MAT.glass);
    m.box(sx * (W - 0.22), 0.76, -L + 0.005, 0.28, 0.14, 0.05, C(burnt ? '#2A1A18' : '#B8221E'), burnt ? MAT.matte : MAT.glass);
    m.box(sx * (W + 0.002), 0.74, 0, 0.012, 0.035, L * 1.5, frame, MAT.trim);
    if (!van) for (const zs of pick ? [0.72, -0.22] : [0.75, -0.25, -1.2]) m.box(sx * (W + 0.0), 0.68, zs, 0.008, 0.5, 0.01, sh(paint, 0.55), MAT.matte);
    m.box(sx * (W + 0.01), 0.88, pick ? 0.38 : 0.45, 0.02, 0.025, 0.12, chrome, MAT.metal);
    const mz = van ? 1.9 : pick ? 0.68 : 0.62;
    withT(m, rot(sx * (W + 0.02), van ? 1.15 : 1.02, mz, 0), () => { m.box(sx * 0.07, 0, 0, 0.12, 0.1, 0.06, paint, MAT.paint); m.box(sx * 0.12, 0.0, -0.032, 0.03, 0.08, 0.005, C('#A8C4D8'), MAT.glass); });
  }
  m.box(0, 0.62, L + 0.01, W * 0.9, 0.16, 0.04, dark, MAT.trim);
  for (let i = 0; i < 4; i++) m.box(0, 0.57 + i * 0.035, L + 0.035, W * 0.86, 0.012, 0.012, chrome, MAT.metal);
  sq(m, 0, 0.44, L + 0.03, W + 0.02, 0.09, 0.09, 0.35, 0.35, burnt ? C('#2A2624') : sh(chrome, pick ? 1 : 0.6), pick ? MAT.metal : MAT.trim, 16, 6);
  sq(m, 0, 0.46, -L - 0.03, W + 0.02, 0.09, 0.09, 0.35, 0.35, burnt ? C('#2A2624') : dark, MAT.trim, 16, 6);
  m.box(0, 0.5, L + 0.12, 0.42, 0.13, 0.015, C('#E8E4D6'), MAT.matte);
  m.box(0, 0.62, -L - 0.03, 0.42, 0.13, 0.015, C('#E8E4D6'), MAT.matte);
  tube(m, [0.5, 0.36, -L + 0.1], [0.52, 0.34, -L - 0.08], 0.035, 0.035, 8, C('#4A4A4E'), MAT.metal, false);
  if (o.lightbar) { m.box(0, 1.5, -0.25, 1.2, 0.08, 0.22, frame, MAT.trim); m.box(-0.3, 1.58, -0.25, 0.5, 0.1, 0.18, C('#D8322A'), MAT.glass); m.box(0.3, 1.58, -0.25, 0.5, 0.1, 0.18, C('#2A62D8'), MAT.glass); }
  if (o.roofRack) for (const sx of [-1, 1]) m.box(sx * 0.6, (van ? 2.07 : 1.5), -0.2, 0.04, 0.05, 1.3, frame, MAT.trim);
  if (o.doorOpen) { withT(m, rot(W + 0.35, 0.36, 0.55, -0.9), () => { m.box(0, 0, -0.45, 0.06, 0.6, 0.9, paint, MAT.paint); m.box(0, 0.6, -0.45, 0.05, 0.42, 0.85, glass, MAT.glass); }); }
  return m.build();
}
