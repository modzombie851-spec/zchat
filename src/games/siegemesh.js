import { MeshBuilder, m4, hexRgb } from './race3d.js';

const MAT = { paint: 0.553, glass: 0.665, chrome: 0.705, metal: 0.745, alloy: 0.72, plastic: 0.14, trim: 0.22, matte: 0, light: 1, glow: 0.92, flat: 0.82 };
const H32 = (n) => { let x = (n | 0) * 374761393; x = (x ^ (x >>> 13)) * 1274126177; return ((x ^ (x >>> 16)) >>> 0) / 4294967296; };
const hsh = (a, b, c = 0) => H32(a * 73856093 ^ b * 19349663 ^ c * 83492791);
const mix = (a, b, t) => { const A = hexRgb(a), B = hexRgb(b); return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]; };
const shade = (c, k) => { const A = typeof c === 'string' ? hexRgb(c) : c; return [Math.min(1, A[0] * k), Math.min(1, A[1] * k), Math.min(1, A[2] * k)]; };

function sq(m, x, y, z, hx, hy, hz, e1, e2, col, mat = 0, seg = 14, rows = 9, at) {
  const f = (w, e) => Math.sign(w) * Math.pow(Math.abs(w), e);
  const P = [];
  for (let i = 0; i <= rows; i++) {
    const v = -Math.PI / 2 + (Math.PI * i) / rows, cv = Math.cos(v), sv = Math.sin(v);
    const row = [];
    for (let j = 0; j < seg; j++) {
      const u = -Math.PI + (2 * Math.PI * j) / seg, cu = Math.cos(u), su = Math.sin(u);
      row.push([x + hx * f(cv, e1) * f(cu, e2), y + hy * f(sv, e1), z + hz * f(cv, e1) * f(su, e2)]);
    }
    P.push(row);
  }
  m.surface(P, col, mat, { wrap: true, at });
}
const ball = (m, x, y, z, r, col, mat = 0, seg = 12) => sq(m, x, y, z, r, r, r, 1, 1, col, mat, seg, Math.max(6, Math.round(seg * 0.6)));
function basis(p, d, s = 1) {
  const L = Math.hypot(d[0], d[1], d[2]) || 1;
  const y = [d[0] / L, d[1] / L, d[2] / L];
  const ref = Math.abs(y[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
  let x = [y[1] * ref[2] - y[2] * ref[1], y[2] * ref[0] - y[0] * ref[2], y[0] * ref[1] - y[1] * ref[0]];
  const lx = Math.hypot(x[0], x[1], x[2]) || 1; x = [x[0] / lx, x[1] / lx, x[2] / lx];
  const z = [x[1] * y[2] - x[2] * y[1], x[2] * y[0] - x[0] * y[2], x[0] * y[1] - x[1] * y[0]];
  return new Float32Array([x[0] * s, x[1] * s, x[2] * s, 0, y[0] * s, y[1] * s, y[2] * s, 0, z[0] * s, z[1] * s, z[2] * s, 0, p[0], p[1], p[2], 1]);
}
function withT(m, T, fn) { const prev = m.T; m.setT(prev ? m4.mul(prev, T) : T); fn(); m.setT(prev); }
function tube(m, a, b, r0, r1, seg, col, mat = 0, cap = true) {
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(d[0], d[1], d[2]);
  withT(m, basis(a, d), () => m.smoothCyl(0, 0, 0, r0, L, seg, col, mat, { r2: r1, cap }));
}
function cone(m, a, b, r, seg, col, mat = 0) { tube(m, a, b, r, 0.001, seg, col, mat, false); }
const rot = (x, y, z, yaw, pitch = 0, roll = 0) => m4.pose(x, y, z, yaw, pitch, roll, 1);
function ring(m, x, y, z, r0, r1, seg, col, mat, h = 0) {
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2;
    const p = (r, a, yy) => [x + Math.cos(a) * r, yy, z + Math.sin(a) * r];
    const c = typeof col === 'function' ? col(i) : col;
    m.quad(p(r0, a0, y + h), p(r0, a1, y + h), p(r1, a1, y + h), p(r1, a0, y + h), c, mat);
  }
}
function disc(m, x, y, z, r, seg, col, mat) { for (let i = 0; i < seg; i++) { const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2; m.tri([x, y, z], [x + Math.cos(a1) * r, y, z + Math.sin(a1) * r], [x + Math.cos(a0) * r, y, z + Math.sin(a0) * r], col, mat); } }

const SKIN = { a: '#F4C9A1', b: '#E8B48A', c: '#F0C49C', d: '#F6D2B4' };
function eyes(m, y, z, sp, col = '#1B1D26', big = 1) {
  for (const s of [-1, 1]) {
    sq(m, s * sp, y, z, 0.058 * big, 0.082 * big, 0.035, 1, 1, col, MAT.plastic, 10, 6);
    ball(m, s * sp - 0.018, y + 0.03 * big, z + 0.028, 0.019 * big, '#FFFFFF', MAT.flat, 6);
  }
}
function leg(m, pants, shoe, sole, len = 0.42) {
  tube(m, [0, 0.02, 0], [0, -len + 0.06, 0], 0.095, 0.085, 10, pants, MAT.matte, false);
  sq(m, 0, -len + 0.03, 0.045, 0.115, 0.075, 0.17, 0.6, 0.7, shoe, MAT.plastic, 12, 7);
  sq(m, 0, -len - 0.025, 0.05, 0.12, 0.03, 0.175, 0.4, 0.6, sole, MAT.matte, 12, 5);
}
function arm(m, sh, hand, sleeve, skin, r = 0.075) {
  const el = [(sh[0] + hand[0]) / 2 + (sh[0] > 0 ? 0.06 : -0.06), (sh[1] + hand[1]) / 2 - 0.05, (sh[2] + hand[2]) / 2 - 0.02];
  ball(m, sh[0], sh[1], sh[2], r * 1.15, sleeve, MAT.matte, 10);
  tube(m, sh, el, r, r * 0.92, 9, sleeve, MAT.matte, false);
  ball(m, el[0], el[1], el[2], r * 0.92, sleeve, MAT.matte, 8);
  tube(m, el, hand, r * 0.88, r * 0.8, 9, sleeve, MAT.matte, false);
  ball(m, hand[0], hand[1], hand[2], r * 1.2, skin, MAT.matte, 10);
}

function heroBlaze() {
  const b = new MeshBuilder(), l = new MeshBuilder();
  leg(l, '#384057', '#2B2F3A', '#FF7A2E');
  sq(b, 0, 0.53, 0, 0.27, 0.13, 0.2, 0.6, 0.8, '#384057', MAT.matte);
  sq(b, 0, 0.79, 0, 0.32, 0.27, 0.25, 0.55, 0.85, '#FF7A2E', MAT.trim);
  sq(b, 0, 0.8, 0.17, 0.17, 0.18, 0.08, 0.6, 0.8, '#FFB45E', MAT.trim);
  b.cyl(0, 0.6, 0, 0.3, 0.07, 16, '#2B2F3A', MAT.plastic);
  b.box(0, 0.595, 0.29, 0.1, 0.08, 0.04, '#F2C14E', MAT.metal);
  b.cyl(0, 0.98, 0, 0.2, 0.07, 14, '#E8602A', MAT.trim, { r2: 0.17 });
  sq(b, 0, 1.28, 0.01, 0.38, 0.34, 0.35, 0.78, 0.9, SKIN.a, MAT.matte, 16, 10);
  const hair = ['#E8452C', '#F25A2A', '#FF8A2E'];
  [[0, 1.6, -0.02, 0, 1, -0.35, 0.16], [-0.17, 1.55, 0.02, -0.5, 1, -0.2, 0.13], [0.17, 1.55, 0.02, 0.5, 1, -0.2, 0.13], [-0.09, 1.57, -0.2, -0.25, 0.8, -0.9, 0.14], [0.09, 1.57, -0.2, 0.25, 0.8, -0.9, 0.14], [0, 1.45, -0.3, 0, 0.3, -1, 0.15], [-0.26, 1.42, -0.12, -0.9, 0.6, -0.4, 0.12], [0.26, 1.42, -0.12, 0.9, 0.6, -0.4, 0.12]].forEach((h, i) => {
    const base = [h[0] * 0.8, h[1] - 0.12, h[2] * 0.7];
    cone(b, base, [h[0] + h[3] * 0.18, h[1] + h[4] * 0.22, h[2] + h[5] * 0.22], h[6], 8, hair[i % 3], MAT.trim);
  });
  sq(b, 0, 1.5, -0.04, 0.36, 0.16, 0.33, 0.7, 0.9, '#E8452C', MAT.trim, 14, 7);
  b.cyl(0, 1.36, 0, 0.385, 0.075, 18, '#5A3A2A', MAT.plastic);
  for (const s of [-1, 1]) withT(b, rot(s * 0.13, 1.42, 0.31, 0, Math.PI / 2), () => { b.smoothCyl(0, 0, 0, 0.105, 0.07, 14, '#3A2A22', MAT.plastic); b.smoothCyl(0, 0.07, 0, 0.082, 0.012, 14, '#8FEAFF', MAT.glass); });
  eyes(b, 1.24, 0.33, 0.125);
  for (const s of [-1, 1]) withT(b, rot(s * 0.125, 1.33, 0.335, 0, 0, s * 0.25), () => b.box(0, 0, 0, 0.12, 0.025, 0.02, '#8A2A1A', MAT.matte));
  withT(b, rot(0.02, 1.115, 0.335, 0, 0, -0.12), () => b.box(0, 0, 0, 0.13, 0.03, 0.02, '#7A2E22', MAT.matte));
  arm(b, [-0.34, 0.9, 0.02], [0.08, 0.78, 0.42], '#FF7A2E', SKIN.a);
  arm(b, [0.34, 0.9, 0.0], [0.3, 0.74, 0.2], '#FF7A2E', SKIN.a);
  sq(b, 0.22, 0.8, 0.34, 0.11, 0.1, 0.24, 0.45, 0.6, '#3A3F4E', MAT.alloy, 12, 7);
  b.box(0.22, 0.88, 0.2, 0.12, 0.05, 0.26, '#FF7A2E', MAT.trim);
  tube(b, [0.22, 0.8, 0.52], [0.22, 0.8, 0.8], 0.09, 0.13, 14, '#5B667E', MAT.metal, false);
  tube(b, [0.22, 0.8, 0.78], [0.22, 0.8, 0.9], 0.15, 0.16, 14, '#FF8A3D', MAT.trim, false);
  withT(b, rot(0.22, 0.8, 0.86, 0, Math.PI / 2), () => disc(b, 0, 0, 0, 0.15, 14, '#1B1D26', MAT.matte));
  withT(b, rot(0.22, 0.68, 0.36, 0, 0, Math.PI / 2), () => b.smoothCyl(0, -0.08, 0, 0.09, 0.16, 12, '#2B2F3A', MAT.plastic));
  return { body: b.build(), leg: l.build(), hip: [0.15, 0.52] };
}
function heroPip() {
  const b = new MeshBuilder(), l = new MeshBuilder();
  leg(l, '#2E4A3F', '#1F2A2E', '#29C48E', 0.44);
  b.revolve(0, 0, 0, [[0.36, 0.36], [0.31, 0.5], [0.26, 0.66], [0.24, 0.72]], 16, '#1F9C72', MAT.trim);
  sq(b, 0, 0.82, 0, 0.28, 0.26, 0.22, 0.55, 0.85, '#29C48E', MAT.trim);
  b.box(0, 0.72, 0.21, 0.04, 0.28, 0.03, '#147A58', MAT.matte);
  sq(b, 0, 1.0, 0, 0.27, 0.07, 0.24, 0.6, 0.9, '#FFD24A', MAT.matte, 14, 6);
  withT(b, rot(0.12, 0.98, -0.2, 0, 0.3), () => b.box(0, -0.25, 0, 0.1, 0.32, 0.03, '#FFD24A', MAT.matte));
  sq(b, 0, 1.28, 0.01, 0.36, 0.33, 0.34, 0.8, 0.9, SKIN.b, MAT.matte, 16, 10);
  sq(b, 0, 1.43, -0.02, 0.38, 0.22, 0.37, 0.75, 0.9, '#1F9C72', MAT.trim, 16, 8);
  b.smoothCyl(0, 1.36, -0.02, 0.4, 0.07, 20, '#E8F5EF', MAT.matte, { cap: false });
  ball(b, 0, 1.68, -0.05, 0.1, '#FFD24A', MAT.matte, 10);
  sq(b, 0, 1.4, 0.3, 0.3, 0.025, 0.12, 0.5, 0.7, '#147A58', MAT.trim, 12, 5);
  eyes(b, 1.25, 0.32, 0.12);
  withT(b, rot(0.12, 1.25, 0.32, 0, Math.PI / 2), () => { b.smoothCyl(0, 0, 0, 0.085, 0.12, 14, '#3A3F4E', MAT.metal); b.smoothCyl(0, 0.12, 0, 0.066, 0.01, 14, '#9BE7FF', MAT.glass); });
  withT(b, rot(0.0, 1.13, 0.325, 0, 0, 0.1), () => b.box(0, 0, 0, 0.09, 0.022, 0.02, '#6A3A2A', MAT.matte));
  arm(b, [-0.3, 0.92, 0.02], [0.04, 0.86, 0.52], '#29C48E', SKIN.b, 0.07);
  arm(b, [0.3, 0.92, 0.0], [0.2, 0.8, 0.12], '#29C48E', SKIN.b, 0.07);
  sq(b, 0.16, 0.84, 0.12, 0.06, 0.09, 0.22, 0.5, 0.6, '#8A5A3B', MAT.trim, 10, 6);
  tube(b, [0.16, 0.88, 0.2], [0.16, 0.88, 1.2], 0.042, 0.036, 10, '#3A3F4E', MAT.metal);
  b.box(0.16, 0.85, 1.16, 0.09, 0.07, 0.12, '#2B2F3A', MAT.metal);
  tube(b, [0.16, 1.0, 0.24], [0.16, 1.0, 0.62], 0.055, 0.055, 12, '#2B2F3A', MAT.metal);
  withT(b, rot(0.16, 1.0, 0.62, 0, Math.PI / 2), () => b.smoothCyl(0, 0, 0, 0.06, 0.02, 12, '#5CF2FF', MAT.glow));
  b.box(0.16, 0.95, 0.42, 0.03, 0.06, 0.04, '#2B2F3A', MAT.metal);
  return { body: b.build(), leg: l.build(), hip: [0.14, 0.55] };
}
function heroBoom() {
  const b = new MeshBuilder(), l = new MeshBuilder();
  leg(l, '#5B3BB0', '#2B2F3A', '#F2C14E', 0.4);
  sq(b, 0, 0.53, 0, 0.29, 0.14, 0.22, 0.7, 0.9, '#5B3BB0', MAT.matte);
  sq(b, 0, 0.8, 0, 0.34, 0.3, 0.28, 0.85, 0.95, '#8D5BFF', MAT.trim);
  withT(b, rot(0, 0.82, 0.01, 0, 0, 0.7), () => { sq(b, 0, 0, 0, 0.05, 0.42, 0.3, 0.4, 0.9, '#6B4A2E', MAT.trim, 12, 6); for (let i = -2; i <= 2; i++) withT(b, rot(0, i * 0.14, 0.29, 0, Math.PI / 2), () => b.smoothCyl(0, 0, 0, 0.04, 0.06, 8, '#F2C14E', MAT.metal)); });
  b.cyl(0, 0.6, 0, 0.31, 0.07, 16, '#2B2F3A', MAT.plastic);
  sq(b, 0, 1.27, 0.02, 0.36, 0.32, 0.33, 0.8, 0.9, SKIN.c, MAT.matte, 16, 10);
  sq(b, 0, 1.42, -0.01, 0.39, 0.25, 0.37, 0.8, 0.95, '#2A2D38', MAT.paint, 16, 9);
  b.smoothCyl(0, 1.34, -0.01, 0.41, 0.07, 20, '#F2C14E', MAT.trim, { cap: false });
  b.box(0, 1.33, 0.34, 0.5, 0.04, 0.05, '#2A2D38', MAT.paint);
  tube(b, [0, 1.64, -0.04], [0.06, 1.8, -0.1], 0.03, 0.025, 8, '#D9C27A', MAT.matte);
  ball(b, 0.07, 1.83, -0.11, 0.045, '#FFB43A', MAT.glow, 8);
  eyes(b, 1.24, 0.33, 0.125, '#1B1D26', 1.05);
  b.box(0, 1.1, 0.33, 0.17, 0.06, 0.03, '#FFFFFF', MAT.matte);
  b.box(0, 1.08, 0.335, 0.17, 0.015, 0.03, '#2B1A1A', MAT.matte);
  ball(b, 0, 0.88, -0.38, 0.27, '#2A2D38', MAT.paint, 14);
  b.cyl(0, 0.86, -0.38, 0.272, 0.05, 16, '#8D5BFF', MAT.trim);
  tube(b, [0, 1.14, -0.42], [0.05, 1.28, -0.5], 0.03, 0.025, 8, '#D9C27A', MAT.matte);
  for (const s of [-1, 1]) tube(b, [s * 0.2, 1.02, -0.08], [s * 0.22, 0.62, -0.14], 0.03, 0.03, 6, '#6B4A2E', MAT.matte, false);
  arm(b, [-0.36, 0.92, 0.0], [-0.3, 0.66, 0.2], '#8D5BFF', SKIN.c);
  arm(b, [0.36, 0.92, 0.0], [0.34, 0.86, 0.34], '#8D5BFF', SKIN.c);
  ball(b, 0.34, 0.94, 0.44, 0.17, '#2A2D38', MAT.paint, 12);
  b.cyl(0.34, 0.92, 0.44, 0.172, 0.04, 14, '#F2C14E', MAT.trim);
  tube(b, [0.34, 1.1, 0.44], [0.37, 1.2, 0.47], 0.022, 0.02, 6, '#D9C27A', MAT.matte);
  return { body: b.build(), leg: l.build(), hip: [0.16, 0.5] };
}
function heroMira() {
  const b = new MeshBuilder(), l = new MeshBuilder();
  leg(l, '#FBE3EE', '#FF5FA2', '#C2407A', 0.42);
  b.revolve(0, 0, 0, [[0.4, 0.36], [0.37, 0.44], [0.3, 0.58], [0.24, 0.7]], 18, '#FF8CBF', MAT.trim);
  b.cyl(0, 0.36, 0, 0.405, 0.05, 18, '#FFFFFF', MAT.matte, { r2: 0.395 });
  sq(b, 0, 0.82, 0, 0.27, 0.24, 0.21, 0.6, 0.85, '#FF5FA2', MAT.trim);
  sq(b, 0, 0.83, 0.16, 0.12, 0.13, 0.07, 0.7, 0.8, '#FFFFFF', MAT.matte);
  sq(b, 0, 1.28, 0.01, 0.36, 0.33, 0.34, 0.8, 0.9, SKIN.d, MAT.matte, 16, 10);
  sq(b, 0, 1.3, -0.08, 0.41, 0.4, 0.38, 0.8, 0.9, '#4FD8C4', MAT.trim, 16, 10);
  sq(b, 0, 1.5, 0.15, 0.33, 0.12, 0.2, 0.6, 0.8, '#4FD8C4', MAT.trim, 14, 7);
  sq(b, 0, 0.98, -0.3, 0.3, 0.32, 0.12, 0.8, 0.9, '#3BC2AE', MAT.trim, 14, 8);
  for (const s of [-1, 1]) { ball(b, s * 0.4, 1.12, -0.08, 0.13, '#4FD8C4', MAT.trim, 10); ball(b, s * 0.42, 0.95, -0.12, 0.1, '#3BC2AE', MAT.trim, 10); }
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; ball(b, 0.3 + Math.cos(a) * 0.06, 1.5 + Math.sin(a) * 0.06, 0.22, 0.05, '#FFFFFF', MAT.matte, 8); }
  ball(b, 0.3, 1.5, 0.25, 0.04, '#FFD24A', MAT.matte, 8);
  eyes(b, 1.25, 0.33, 0.12, '#2A1D3A', 1.1);
  for (const s of [-1, 1]) ball(b, s * 0.2, 1.17, 0.29, 0.045, '#FF9CC2', MAT.matte, 8);
  withT(b, rot(0, 1.12, 0.335, 0, 0, 0), () => b.box(0, 0, 0, 0.07, 0.022, 0.02, '#B0406A', MAT.matte));
  arm(b, [-0.3, 0.92, 0.0], [-0.28, 0.66, 0.16], '#FF5FA2', SKIN.d, 0.068);
  arm(b, [0.3, 0.92, 0.0], [0.36, 0.84, 0.22], '#FF5FA2', SKIN.d, 0.068);
  tube(b, [0.36, 0.1, 0.24], [0.36, 1.5, 0.2], 0.035, 0.03, 8, '#B07A4A', MAT.trim);
  withT(b, rot(0.36, 1.52, 0.2, 0, 0, 0), () => { ring(b, 0, 0, 0, 0.1, 0.14, 12, '#F2C14E', MAT.metal); for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.4; tube(b, [Math.cos(a) * 0.12, 0, Math.sin(a) * 0.12], [Math.cos(a) * 0.08, 0.2, Math.sin(a) * 0.08], 0.02, 0.012, 6, '#F2C14E', MAT.metal); } });
  ball(b, 0.36, 1.66, 0.2, 0.12, '#8CFFE0', MAT.glow, 12);
  return { body: b.build(), leg: l.build(), hip: [0.14, 0.52] };
}

function hammer(b, p0, p1, headL, col, band) {
  const d = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]], L = Math.hypot(d[0], d[1], d[2]);
  withT(b, basis(p0, d), () => {
    b.smoothCyl(0, -0.08, 0, 0.042, L + 0.1, 10, '#6B4A2E', MAT.matte);
    for (let i = 0; i < 4; i++) b.smoothCyl(0, 0.05 + i * 0.07, 0, 0.048, 0.035, 10, '#3A2A1E', MAT.matte, { cap: false });
    sq(b, 0, L + 0.02, 0, headL / 2, 0.16, 0.16, 0.35, 0.35, col, MAT.metal, 14, 7);
    for (const s of [-1, 1]) { b.smoothCyl(s * headL * 0.32, L + 0.02, 0, 0.17, 0.06, 14, band, MAT.trim, { cap: false }); }
    for (const s of [-1, 1]) withT(b, rot(s * headL / 2, L + 0.02, 0, 0, 0, Math.PI / 2), () => b.smoothCyl(0, -0.03, 0, 0.13, 0.06, 14, '#8A919E', MAT.metal));
  });
}
function heroRex() {
  const b = new MeshBuilder(), l = new MeshBuilder();
  leg(l, '#3A4558', '#4A3426', '#1E1A18', 0.42);
  sq(b, 0, 0.55, 0, 0.31, 0.14, 0.23, 0.7, 0.9, '#3A4558', MAT.matte);
  sq(b, 0, 0.84, 0, 0.4, 0.32, 0.3, 0.55, 0.8, '#C8442E', MAT.trim);
  sq(b, 0, 0.88, 0.2, 0.2, 0.2, 0.09, 0.6, 0.8, '#E86A4E', MAT.trim);
  b.cyl(0, 0.6, 0, 0.34, 0.08, 18, '#3A2A1E', MAT.plastic);
  b.box(0, 0.6, 0.33, 0.13, 0.09, 0.04, '#C9A04A', MAT.metal);
  sq(b, 0, 1.33, 0.02, 0.38, 0.34, 0.35, 0.78, 0.9, SKIN.b, MAT.matte, 16, 10);
  sq(b, 0, 1.53, -0.04, 0.37, 0.18, 0.34, 0.7, 0.9, '#3A2418', MAT.trim, 16, 8);
  for (let i = 0; i < 7; i++) { const a = -0.9 + i * 0.3; cone(b, [Math.sin(a) * 0.22, 1.6, -0.05 + Math.cos(a) * 0.12], [Math.sin(a) * 0.3, 1.78, -0.12 + Math.cos(a) * 0.05], 0.09, 7, '#2E1C12', MAT.trim); }
  b.smoothCyl(0, 1.42, -0.01, 0.395, 0.09, 22, '#D23A2A', MAT.trim, { cap: false });
  for (const s of [-1, 1]) tube(b, [s * 0.05, 1.46, -0.38], [s * 0.18, 1.3, -0.56], 0.05, 0.02, 7, '#D23A2A', MAT.trim, false);
  eyes(b, 1.27, 0.335, 0.13);
  for (const s of [-1, 1]) withT(b, rot(s * 0.13, 1.37, 0.34, 0, 0, s * -0.3), () => b.box(0, 0, 0, 0.15, 0.04, 0.03, '#2E1C12', MAT.matte));
  withT(b, rot(0.02, 1.14, 0.335, 0, 0, -0.06), () => b.box(0, 0, 0, 0.14, 0.03, 0.02, '#7A2E22', MAT.matte));
  ball(b, 0.03, 1.2, 0.36, 0.05, '#E8A27A', MAT.matte, 8);
  arm(b, [-0.42, 0.95, 0.02], [-0.06, 0.8, 0.4], SKIN.b, SKIN.b, 0.095);
  arm(b, [0.42, 0.95, 0.02], [0.26, 0.86, 0.36], SKIN.b, SKIN.b, 0.095);
  for (const s of [-1, 1]) sq(b, s * 0.44, 1.02, 0, 0.15, 0.12, 0.15, 0.7, 0.8, '#C8442E', MAT.trim, 10, 6);
  hammer(b, [0.06, 0.72, 0.36], [0.3, 1.38, 0.66], 0.62, '#5E6670', '#E0533A');
  return { body: b.build(), leg: l.build(), hip: [0.17, 0.52] };
}
function heroVolt() {
  const b = new MeshBuilder(), l = new MeshBuilder();
  leg(l, '#33415C', '#2B2F3A', '#F2C230', 0.42);
  sq(b, 0, 0.54, 0, 0.29, 0.14, 0.22, 0.7, 0.9, '#33415C', MAT.matte);
  sq(b, 0, 0.8, 0, 0.32, 0.28, 0.25, 0.6, 0.85, '#3A5A8C', MAT.trim);
  sq(b, 0, 0.98, 0.02, 0.3, 0.1, 0.24, 0.6, 0.85, '#F2C230', MAT.trim);
  for (const s of [-1, 1]) b.box(s * 0.14, 0.62, 0.22, 0.06, 0.42, 0.04, '#2E4A72', MAT.trim);
  b.cyl(0, 0.6, 0, 0.31, 0.07, 16, '#5A3E26', MAT.plastic);
  for (const [px, pc] of [[-0.24, '#7A5A36'], [0.24, '#7A5A36'], [0.1, '#C9A04A']]) b.box(px, 0.5, 0.27, 0.11, 0.13, 0.06, pc, MAT.matte);
  sq(b, 0, 1.28, 0.01, 0.36, 0.33, 0.34, 0.8, 0.9, SKIN.a, MAT.matte, 16, 10);
  sq(b, 0, 1.47, -0.01, 0.4, 0.22, 0.38, 0.6, 0.6, '#F2C230', MAT.paint, 18, 9);
  b.smoothCyl(0, 1.38, -0.01, 0.46, 0.04, 22, '#E0A61E', MAT.paint);
  b.box(0, 1.56, -0.01, 0.06, 0.12, 0.62, '#E0A61E', MAT.paint);
  for (const s of [-1, 1]) withT(b, rot(s * 0.13, 1.52, 0.32, 0, Math.PI / 2 - 0.3), () => { b.smoothCyl(0, 0, 0, 0.085, 0.06, 14, '#3A2A22', MAT.plastic); b.smoothCyl(0, 0.06, 0, 0.066, 0.01, 14, '#FFB43A', MAT.glass); });
  eyes(b, 1.24, 0.33, 0.125);
  withT(b, rot(0, 1.12, 0.335, 0, 0, 0), () => b.box(0, 0, 0, 0.12, 0.025, 0.02, '#7A3A2A', MAT.matte));
  for (const s of [-1, 1]) ball(b, s * 0.2, 1.17, 0.3, 0.04, '#F2A08A', MAT.matte, 8);
  arm(b, [-0.34, 0.92, 0.02], [-0.12, 0.82, 0.38], '#F2C230', SKIN.a);
  arm(b, [0.34, 0.92, 0.0], [0.2, 0.8, 0.3], '#F2C230', SKIN.a);
  withT(b, rot(0.06, 0.86, 0.42, 0, Math.PI / 2), () => {
    b.smoothCyl(0, -0.12, 0, 0.1, 0.36, 14, '#4A4F57', MAT.metal);
    for (let i = 0; i < 4; i++) b.smoothCyl(0, 0.0 + i * 0.07, 0, 0.12, 0.03, 14, '#C87A3A', MAT.metal, { cap: false });
    b.smoothCyl(0, 0.24, 0, 0.05, 0.1, 10, '#2B2F36', MAT.metal);
  });
  ball(b, 0.06, 0.86, 0.78, 0.08, '#8FE8FF', MAT.glow, 10);
  b.box(0.06, 0.92, 0.3, 0.09, 0.07, 0.12, '#2B2F36', MAT.metal);
  return { body: b.build(), leg: l.build(), hip: [0.15, 0.52] };
}
function heroKai() {
  const b = new MeshBuilder(), l = new MeshBuilder();
  leg(l, '#6E6A4A', '#5A3E26', '#2A1E14', 0.42);
  sq(b, 0, 0.54, 0, 0.29, 0.14, 0.22, 0.7, 0.9, '#6E6A4A', MAT.matte);
  sq(b, 0, 0.8, 0, 0.33, 0.29, 0.26, 0.6, 0.85, '#3FA2F0', MAT.trim);
  b.box(0, 0.58, 0.22, 0.04, 0.42, 0.03, '#2E7AC0', MAT.trim);
  b.smoothCyl(0, 1.0, 0, 0.27, 0.1, 18, '#E8DCC8', MAT.matte, { r2: 0.24 });
  b.cyl(0, 0.6, 0, 0.31, 0.06, 16, '#5A3E26', MAT.plastic);
  b.smoothCyl(0, 1.06, 0.01, 0.23, 0.08, 16, '#D84A3A', MAT.matte, { r2: 0.21 });
  tube(b, [0.12, 1.08, -0.18], [0.3, 0.86, -0.4], 0.05, 0.035, 7, '#D84A3A', MAT.matte, false);
  sq(b, 0, 1.3, 0.01, 0.36, 0.33, 0.34, 0.8, 0.9, SKIN.c, MAT.matte, 16, 10);
  sq(b, 0, 1.43, -0.04, 0.39, 0.26, 0.38, 0.7, 0.85, '#7A4E2E', MAT.trim, 16, 9);
  for (const s of [-1, 1]) sq(b, s * 0.34, 1.24, -0.02, 0.07, 0.17, 0.13, 0.7, 0.8, '#7A4E2E', MAT.trim, 10, 6);
  b.smoothCyl(0, 1.5, -0.02, 0.4, 0.05, 20, '#5A3820', MAT.trim, { cap: false });
  for (const s of [-1, 1]) withT(b, rot(s * 0.14, 1.52, 0.31, 0, Math.PI / 2 - 0.5), () => { b.smoothCyl(0, 0, 0, 0.1, 0.07, 14, '#3A3F46', MAT.metal); b.smoothCyl(0, 0.07, 0, 0.078, 0.012, 14, '#9BE7FF', MAT.glass); });
  eyes(b, 1.25, 0.33, 0.125);
  withT(b, rot(0.03, 1.12, 0.335, 0, 0, -0.15), () => b.box(0, 0, 0, 0.12, 0.025, 0.02, '#6A2E22', MAT.matte));
  arm(b, [-0.34, 0.92, 0.02], [-0.24, 0.7, 0.24], '#3FA2F0', SKIN.c);
  arm(b, [0.34, 0.92, 0.0], [0.3, 1.0, 0.22], '#3FA2F0', SKIN.c);
  withT(b, rot(0.3, 1.18, 0.05, 0, Math.PI / 2), () => {
    b.smoothCyl(0, -0.5, 0, 0.13, 1.05, 14, '#5E7A3A', MAT.paint);
    b.smoothCyl(0, 0.52, 0, 0.15, 0.07, 14, '#2B2F36', MAT.metal, { cap: false });
    disc(b, 0, 0.55, 0, 0.11, 12, '#141414', MAT.matte);
    b.smoothCyl(0, -0.56, 0, 0.15, 0.06, 14, '#2B2F36', MAT.metal);
    b.box(0, 0.1, -0.16, 0.08, 0.2, 0.12, '#2B2F36', MAT.metal);
  });
  b.box(0.3, 1.18, 0.4, 0.04, 0.04, 0.12, '#E8E4DC', MAT.paint);
  for (const s of [-1, 1]) {
    b.smoothCyl(s * 0.13, 0.62, -0.32, 0.1, 0.5, 14, '#B9C2CC', MAT.metal);
    ball(b, s * 0.13, 1.12, -0.32, 0.1, '#B9C2CC', MAT.metal, 10);
    b.smoothCyl(s * 0.13, 0.5, -0.32, 0.07, 0.12, 12, '#2B2F36', MAT.metal);
    b.box(s * 0.13, 0.62, -0.46, 0.03, 0.22, 0.12, '#3FA2F0', MAT.trim);
  }
  b.box(0, 0.86, -0.27, 0.36, 0.24, 0.08, '#4A4F57', MAT.metal);
  return { body: b.build(), leg: l.build(), hip: [0.15, 0.52] };
}
function crystal(b, x, y, z, w, h, col, mat = MAT.glow) { sq(b, x, y, z, w, h, w, 2.4, 2.4, col, mat, 6, 4); }
function heroIvy() {
  const b = new MeshBuilder(), l = new MeshBuilder();
  leg(l, '#DDEEFF', '#7FD7FF', '#4A8CB8', 0.42);
  b.revolve(0, 0, 0, [[0.42, 0.34], [0.38, 0.44], [0.3, 0.6], [0.24, 0.74]], 18, '#7FC8EE', MAT.trim);
  b.cyl(0, 0.34, 0, 0.425, 0.05, 18, '#F2FAFF', MAT.matte, { r2: 0.415 });
  sq(b, 0, 0.83, 0, 0.27, 0.24, 0.21, 0.6, 0.85, '#5FB4E4', MAT.trim);
  sq(b, 0, 0.84, 0.16, 0.1, 0.14, 0.07, 0.7, 0.8, '#F2FAFF', MAT.matte);
  sq(b, 0, 0.95, -0.24, 0.34, 0.42, 0.08, 0.8, 0.9, '#3E8CC4', MAT.trim, 14, 8);
  sq(b, 0, 1.28, 0.01, 0.36, 0.33, 0.34, 0.8, 0.9, SKIN.d, MAT.matte, 16, 10);
  sq(b, 0, 1.33, -0.07, 0.41, 0.4, 0.38, 0.8, 0.9, '#E6F2FF', MAT.trim, 16, 10);
  sq(b, 0, 1.5, 0.14, 0.34, 0.12, 0.2, 0.6, 0.8, '#E6F2FF', MAT.trim, 14, 7);
  for (let i = 0; i < 6; i++) ball(b, 0.3 + Math.sin(i * 0.5) * 0.04, 1.1 - i * 0.11, -0.2 - i * 0.02, 0.075 - i * 0.006, i % 2 ? '#D2E6FA' : '#E6F2FF', MAT.trim, 9);
  for (const [x, hgt] of [[-0.14, 0.12], [0, 0.18], [0.14, 0.12]]) crystal(b, x, 1.62 + hgt * 0.4, 0.12, 0.05, hgt, '#9FEAFF');
  eyes(b, 1.25, 0.33, 0.12, '#1E3A5A', 1.1);
  for (const s of [-1, 1]) ball(b, s * 0.2, 1.16, 0.29, 0.04, '#B8D8F8', MAT.matte, 8);
  withT(b, rot(0, 1.12, 0.335, 0, 0, 0), () => b.box(0, 0, 0, 0.07, 0.02, 0.02, '#5A6A9A', MAT.matte));
  arm(b, [-0.3, 0.92, 0.0], [-0.28, 0.66, 0.16], '#5FB4E4', SKIN.d, 0.068);
  arm(b, [0.3, 0.92, 0.0], [0.36, 0.84, 0.22], '#5FB4E4', SKIN.d, 0.068);
  tube(b, [0.36, 0.08, 0.24], [0.36, 1.55, 0.2], 0.033, 0.028, 8, '#B9D6EE', MAT.metal);
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; tube(b, [0.36, 1.5, 0.2], [0.36 + Math.cos(a) * 0.1, 1.68, 0.2 + Math.sin(a) * 0.1], 0.018, 0.01, 6, '#B9D6EE', MAT.metal); }
  crystal(b, 0.36, 1.78, 0.2, 0.09, 0.2, '#8FF0FF');
  return { body: b.build(), leg: l.build(), hip: [0.14, 0.52] };
}
const HERO_FN = { blaze: heroBlaze, pip: heroPip, boom: heroBoom, mira: heroMira, rex: heroRex, volt: heroVolt, kai: heroKai, ivy: heroIvy };
export function heroMeshes(key) { return (HERO_FN[key] || heroBlaze)(); }

function robotGrunt() {
  const b = new MeshBuilder(), l = new MeshBuilder();
  l.box(0, -0.36, 0, 0.17, 0.36, 0.19, '#5C6370', MAT.metal);
  sq(l, 0, -0.42, 0.05, 0.14, 0.07, 0.2, 0.4, 0.5, '#3B4049', MAT.metal, 10, 6);
  ball(l, 0, -0.02, 0, 0.12, '#3B4049', MAT.metal, 8);
  sq(b, 0, 0.86, 0, 0.5, 0.38, 0.43, 0.35, 0.4, '#D9822B', MAT.paint, 16, 9);
  sq(b, 0, 0.62, 0, 0.44, 0.1, 0.38, 0.4, 0.5, '#4A4F5A', MAT.metal, 14, 6);
  sq(b, 0, 1.22, -0.04, 0.36, 0.07, 0.3, 0.4, 0.5, '#B86A22', MAT.paint, 14, 6);
  withT(b, rot(0, 0.9, 0.38, 0, Math.PI / 2), () => { b.smoothCyl(0, 0, 0, 0.24, 0.1, 18, '#2B2F3A', MAT.metal); b.smoothCyl(0, 0.1, 0, 0.17, 0.02, 18, '#E8140C', MAT.light); ring(b, 0, 0.1, 0, 0.17, 0.24, 18, '#5C6370', MAT.chrome, 0.005); });
  for (const [x, y] of [[-0.38, 1.0], [0.38, 1.0], [-0.38, 0.72], [0.38, 0.72]]) ball(b, x, y, 0.36, 0.035, '#8A919E', MAT.metal, 6);
  b.box(-0.18, 1.05, 0.39, 0.16, 0.05, 0.03, '#2B2F3A', MAT.matte);
  tube(b, [0.18, 1.26, -0.1], [0.24, 1.62, -0.16], 0.025, 0.02, 6, '#8A919E', MAT.metal);
  ball(b, 0.245, 1.65, -0.165, 0.055, '#E8140C', MAT.light, 8);
  for (const s of [-1, 1]) {
    ball(b, s * 0.54, 0.95, 0.02, 0.15, '#5C6370', MAT.metal, 10);
    tube(b, [s * 0.58, 0.92, 0.04], [s * 0.6, 0.72, 0.32], 0.09, 0.08, 10, '#4A4F5A', MAT.metal);
    sq(b, s * 0.6, 0.7, 0.36, 0.12, 0.1, 0.12, 0.5, 0.6, '#D9822B', MAT.paint, 10, 6);
    for (const k of [-1, 1]) withT(b, rot(s * 0.6 + k * 0.06, 0.66, 0.44, 0, 0.4), () => b.box(0, 0, 0, 0.04, 0.05, 0.16, '#2B2F3A', MAT.metal));
  }
  tube(b, [-0.24, 1.0, -0.4], [-0.3, 1.32, -0.5], 0.06, 0.05, 10, '#3B4049', MAT.metal);
  return { body: b.build(), leg: l.build(), hip: [0.24, 0.46] };
}
function robotShooter() {
  const b = new MeshBuilder();
  sq(b, 0, 1.25, 0, 0.42, 0.36, 0.42, 0.85, 0.9, '#4E79B5', MAT.paint, 18, 10);
  b.cyl(0, 1.18, 0, 0.43, 0.09, 20, '#2F4A73', MAT.metal);
  sq(b, 0, 1.33, 0.33, 0.24, 0.07, 0.08, 0.4, 0.5, '#5CF2FF', MAT.light, 12, 6);
  sq(b, 0, 1.33, 0.31, 0.29, 0.11, 0.08, 0.4, 0.5, '#1B2433', MAT.plastic, 12, 6);
  tube(b, [0, 1.02, 0.15], [0, 1.0, 0.66], 0.07, 0.06, 10, '#2B2F3A', MAT.metal);
  withT(b, rot(0, 1.0, 0.66, 0, Math.PI / 2), () => b.smoothCyl(0, 0, 0, 0.065, 0.03, 10, '#5CF2FF', MAT.glow));
  for (const s of [-1, 1]) { withT(b, rot(s * 0.48, 1.22, -0.04, 0, 0, s * 0.35), () => sq(b, 0, 0, 0, 0.18, 0.04, 0.22, 0.5, 0.5, '#2F4A73', MAT.paint, 10, 5)); }
  tube(b, [0, 0.95, 0], [0, 0.72, 0], 0.2, 0.13, 14, '#2F4A73', MAT.metal);
  ring(b, 0, 0.72, 0, 0.06, 0.13, 14, '#5CF2FF', MAT.light);
  tube(b, [-0.14, 1.56, -0.05], [-0.18, 1.78, -0.08], 0.02, 0.015, 6, '#8A919E', MAT.metal);
  ball(b, -0.18, 1.8, -0.08, 0.04, '#5CF2FF', MAT.light, 6);
  return { body: b.build(), leg: null, hip: [0, 0] };
}
function robotBomber() {
  const b = new MeshBuilder();
  const R = 0.5;
  sq(b, 0, 0, 0, R, R, R, 1, 1, '#2A2C33', MAT.paint, 18, 11);
  const band = [];
  for (const y of [-0.12, 0.12]) { const row = []; const rr = Math.sqrt(R * R - y * y) + 0.012; for (let j = 0; j <= 20; j++) { const a = (j / 20) * Math.PI * 2; row.push([Math.cos(a) * rr, y, Math.sin(a) * rr]); } band.push(row); }
  withT(b, rot(0, 0, 0, 0, 0, Math.PI / 2), () => b.surface(band, '#F2C14E', MAT.paint, { at: (i, j) => [hexRgb(j % 2 ? '#F2C14E' : '#1B1D22'), MAT.paint] }));
  const top = new MeshBuilder();
  for (const s of [-1, 1]) { withT(top, rot(s * 0.2, 0.16, 0.44, s * 0.42, -0.3), () => sq(top, 0, 0, 0, 0.075, 0.045, 0.035, 0.5, 0.5, '#FFD21F', MAT.light, 8, 5)); }
  top.cyl(0, 0, 0, 0.12, 0.1, 12, '#5C6370', MAT.metal);
  ball(top, 0, 0.14, 0, 0.075, '#E8140C', MAT.light, 8);
  for (const s of [-1, 1]) { top.box(s * 0.42, -0.38, 0, 0.12, 0.16, 0.22, '#3B4049', MAT.metal); }
  return { body: b.build(), leg: top.build(), hip: [0, 0] };
}
function robotTank() {
  const b = new MeshBuilder();
  for (const s of [-1, 1]) {
    sq(b, s * 0.72, 0.3, 0, 0.2, 0.3, 0.86, 0.3, 0.3, '#2B2F36', MAT.plastic, 12, 7);
    for (let i = -2; i <= 2; i++) withT(b, rot(s * 0.93, 0.3, i * 0.34, 0, 0, Math.PI / 2), () => b.smoothCyl(0, -0.02, 0, 0.17, 0.05, 12, '#4A515C', MAT.metal));
  }
  sq(b, 0, 0.66, 0, 0.62, 0.3, 0.82, 0.3, 0.35, '#7A8A3C', MAT.paint, 16, 8);
  sq(b, 0, 0.96, -0.1, 0.44, 0.24, 0.46, 0.45, 0.5, '#5E6B2C', MAT.paint, 16, 8);
  for (const s of [-1, 1]) { tube(b, [s * 0.14, 1.0, 0.2], [s * 0.14, 1.0, 0.95], 0.075, 0.07, 10, '#3B4049', MAT.metal); withT(b, rot(s * 0.14, 1.0, 0.95, 0, Math.PI / 2), () => b.smoothCyl(0, 0, 0, 0.09, 0.08, 10, '#2B2F36', MAT.metal)); }
  ball(b, 0, 1.14, 0.25, 0.08, '#E8140C', MAT.light, 8);
  b.box(0, 1.2, -0.25, 0.08, 0.35, 0.08, '#3B4049', MAT.metal);
  const sh = [];
  const A0 = -0.95, A1 = 0.95, rr = 1.06;
  for (const y of [0.12, 0.62, 1.12]) { const row = []; for (let j = 0; j <= 12; j++) { const a = A0 + (A1 - A0) * (j / 12); const bulge = y === 0.62 ? 0.06 : 0; row.push([Math.sin(a) * (rr + bulge), y, Math.cos(a) * (rr + bulge)]); } sh.push(row); }
  b.surface(sh, '#F2C14E', MAT.paint, { at: (i, j) => [hexRgb(j % 2 ? '#F2C14E' : '#22252B'), MAT.paint] });
  const sh2 = sh.map((row) => row.map(([x, y, z]) => [x * 0.95, y, z * 0.95]));
  b.surface(sh2, '#3B4049', MAT.metal, {});
  for (const j of [0, 12]) { const a = A0 + (A1 - A0) * (j / 12); b.box(Math.sin(a) * rr, 0.12, Math.cos(a) * rr, 0.1, 1.02, 0.1, '#3B4049', MAT.metal); }
  return { body: b.build(), leg: null, hip: [0, 0] };
}
function robotBoss() {
  const b = new MeshBuilder(), l = new MeshBuilder();
  l.box(0, -0.9, 0, 0.42, 0.9, 0.46, '#3B4049', MAT.metal);
  tube(l, [0, -0.1, 0], [0, -0.85, 0.1], 0.14, 0.12, 10, '#8A919E', MAT.chrome);
  sq(l, 0, -1.05, 0.12, 0.36, 0.15, 0.5, 0.4, 0.5, '#2B2F36', MAT.metal, 12, 6);
  ball(l, 0, 0, 0, 0.3, '#5C6370', MAT.metal, 10);
  sq(b, 0, 2.3, 0, 1.25, 0.95, 1.0, 0.4, 0.45, '#454B57', MAT.paint, 18, 10);
  sq(b, 0, 1.45, 0, 1.0, 0.22, 0.85, 0.4, 0.5, '#2B2F36', MAT.metal, 16, 6);
  sq(b, 0, 3.22, -0.05, 1.0, 0.12, 0.8, 0.4, 0.5, '#E3B341', MAT.chrome, 16, 6);
  for (let i = 0; i < 5; i++) { const x = -0.7 + i * 0.35, h = i === 2 ? 0.75 : i % 2 ? 0.45 : 0.55; cone(b, [x, 3.28, 0.05], [x, 3.28 + h, 0.1], 0.13, 8, '#E3B341', MAT.chrome); ball(b, x, 3.28 + h * 0.4, 0.05 + 0.1 * 0.4 + 0.08, 0.055, i === 2 ? '#FF3B30' : '#5CF2FF', MAT.light, 6); }
  withT(b, rot(0, 2.2, 0.9, 0, Math.PI / 2), () => { b.smoothCyl(0, 0, 0, 0.42, 0.14, 20, '#2B2F36', MAT.metal); ring(b, 0, 0.14, 0, 0.3, 0.42, 20, '#E3B341', MAT.chrome, 0.003); });
  ball(b, 0, 2.2, 1.02, 0.3, '#FF5A00', MAT.glow, 14);
  sq(b, 0, 2.95, 0.72, 0.62, 0.22, 0.2, 0.4, 0.5, '#2B2F36', MAT.metal, 14, 6);
  for (const s of [-1, 1]) withT(b, rot(s * 0.27, 2.97, 0.92, 0, 0, s * -0.32), () => b.box(0, 0, 0, 0.32, 0.09, 0.04, '#FF2A22', MAT.light));
  for (const s of [-1, 1]) {
    sq(b, s * 1.42, 2.75, -0.1, 0.42, 0.34, 0.5, 0.3, 0.35, '#7A2E2E', MAT.paint, 12, 7);
    for (const [ox, oy] of [[-0.14, 0.12], [0.14, 0.12], [-0.14, -0.12], [0.14, -0.12]]) withT(b, rot(s * 1.42 + ox, 2.78 + oy, 0.38, 0, Math.PI / 2), () => { b.smoothCyl(0, 0, 0, 0.085, 0.06, 10, '#2B2F36', MAT.metal); b.smoothCyl(0, 0.06, 0, 0.06, 0.02, 10, '#E8140C', MAT.light); });
    ball(b, s * 1.38, 2.05, 0, 0.36, '#5C6370', MAT.metal, 12);
  }
  tube(b, [1.5, 1.9, 0.1], [1.55, 1.55, 0.9], 0.24, 0.22, 12, '#454B57', MAT.metal);
  tube(b, [1.55, 1.5, 0.7], [1.55, 1.5, 1.85], 0.25, 0.2, 14, '#2B2F36', MAT.metal);
  withT(b, rot(1.55, 1.5, 1.85, 0, Math.PI / 2), () => { ring(b, 0, 0, 0, 0.12, 0.22, 14, '#E3B341', MAT.chrome); b.smoothCyl(0, -0.02, 0, 0.13, 0.03, 12, '#5CF2FF', MAT.glow); });
  tube(b, [-1.5, 1.9, 0.1], [-1.5, 1.45, 0.8], 0.24, 0.22, 12, '#454B57', MAT.metal);
  for (const k of [-1, 0, 1]) withT(b, rot(-1.5 + k * 0.18, 1.35, 0.95, k * 0.25, 0.5), () => cone(b, [0, 0, 0], [0, -0.05, 0.55], 0.08, 6, '#E3B341', MAT.chrome));
  for (let i = 0; i < 6; i++) ball(b, -1.05 + i * 0.42, 1.62, 0.84, 0.06, '#8A919E', MAT.metal, 6);
  return { body: b.build(), leg: l.build(), hip: [0.72, 1.35] };
}
const ROBOT_FN = { grunt: robotGrunt, shooter: robotShooter, bomber: robotBomber, tank: robotTank, boss: robotBoss };
export function robotMeshes(type) { return (ROBOT_FN[type] || robotGrunt)(); }

export function fxSiege() {
  const bomb = new MeshBuilder();
  ball(bomb, 0, 0, 0, 0.22, '#2A2D38', MAT.paint, 12); bomb.cyl(0, -0.02, 0, 0.224, 0.05, 14, '#F2C14E', MAT.trim);
  tube(bomb, [0, 0.2, 0], [0.04, 0.32, 0], 0.025, 0.02, 6, '#D9C27A', MAT.matte); ball(bomb, 0.045, 0.34, 0, 0.04, '#FFB43A', MAT.glow, 6);
  const mega = new MeshBuilder();
  ball(mega, 0, 0, 0, 0.44, '#2A2D38', MAT.paint, 16); mega.cyl(0, -0.05, 0, 0.446, 0.1, 18, '#8D5BFF', MAT.trim);
  for (const s of [-1, 1]) ball(mega, s * 0.2, 0.1, 0.36, 0.06, '#FFE45C', MAT.light, 6);
  tube(mega, [0, 0.4, 0], [0.08, 0.6, 0], 0.04, 0.03, 6, '#D9C27A', MAT.matte); ball(mega, 0.09, 0.63, 0, 0.07, '#FFB43A', MAT.glow, 8);
  const missile = new MeshBuilder();
  tube(missile, [0, 0, 0], [0, 1.0, 0], 0.16, 0.16, 12, '#C8402F', MAT.paint);
  cone(missile, [0, 1.0, 0], [0, 1.35, 0], 0.16, 12, '#E8E4DC', MAT.paint);
  for (let i = 0; i < 4; i++) withT(missile, rot(0, 0.12, 0, (i / 4) * Math.PI * 2), () => missile.box(0, 0, 0.2, 0.03, 0.3, 0.16, '#3B4049', MAT.metal));
  const hp = new MeshBuilder();
  sq(hp, 0, 0, 0, 0.3, 0.3, 0.3, 0.3, 0.3, '#F4F7F4', MAT.plastic, 12, 7);
  for (const [ax, ay, az] of [[0, 0.3, 0], [0, 0, 0.3], [0, 0, -0.3], [0.3, 0, 0], [-0.3, 0, 0]]) {
    const vert = ay ? [0.07, 0.02, 0.24] : az ? [0.07, 0.24, 0.02] : [0.02, 0.24, 0.07];
    const hor = ay ? [0.24, 0.02, 0.07] : az ? [0.24, 0.07, 0.02] : [0.02, 0.07, 0.24];
    hp.box(ax * 1.03, ay * 1.03 - vert[1] / 2, az * 1.03, vert[0], vert[1], vert[2], '#2BC864', MAT.flat);
    hp.box(ax * 1.03, ay * 1.03 - hor[1] / 2, az * 1.03, hor[0], hor[1], hor[2], '#2BC864', MAT.flat);
  }
  const pw = new MeshBuilder();
  sq(pw, 0, 0, 0, 0.26, 0.42, 0.26, 2.2, 2.2, '#FF4FB8', MAT.glass, 4, 4);
  sq(pw, 0, 0, 0, 0.14, 0.24, 0.14, 2.2, 2.2, '#FFC2E8', MAT.glow, 4, 4);
  const su = new MeshBuilder();
  withT(su, rot(0, 0, 0, 0, Math.PI / 2), () => { su.smoothCyl(0, -0.06, 0, 0.32, 0.12, 22, '#F7C843', MAT.chrome); ring(su, 0, 0.061, 0, 0.24, 0.3, 22, '#E0A42A', MAT.chrome); ring(su, 0, -0.061, 0, 0.24, 0.3, 22, '#E0A42A', MAT.chrome); });
  for (const s of [-1, 1]) {
    const z = s * 0.065;
    const P = [[-0.05, 0.2], [0.1, 0.2], [0.02, 0.04], [0.12, 0.04], [-0.06, -0.22], [0.0, -0.04], [-0.1, -0.04]];
    const q = (p) => [p[0], p[1], z];
    su.tri(q(P[0]), q(P[1]), q(P[2]), '#7A4A12', MAT.matte); su.tri(q(P[0]), q(P[2]), q(P[6]), '#7A4A12', MAT.matte);
    su.tri(q(P[6]), q(P[3]), q(P[4]), '#7A4A12', MAT.matte); su.tri(q(P[6]), q(P[2]), q(P[3]), '#7A4A12', MAT.matte);
  }
  const strip = new MeshBuilder();
  strip.quad([-0.5, 0, 0], [0.5, 0, 0], [0.5, 0, 1], [-0.5, 0, 1], '#FFFFFF', MAT.flat);
  const fan = (arc) => { const f = new MeshBuilder(); const n = 16; for (let i = 0; i < n; i++) { const a0 = -arc / 2 + (arc * i) / n, a1 = -arc / 2 + (arc * (i + 1)) / n; f.tri([0, 0, 0], [Math.sin(a0), 0, Math.cos(a0)], [Math.sin(a1), 0, Math.cos(a1)], '#FFFFFF', MAT.flat); } return f.build(); };
  const ringM = new MeshBuilder(); ring(ringM, 0, 0, 0, 0.9, 1, 40, '#FFFFFF', MAT.flat);
  const discM = new MeshBuilder(); disc(discM, 0, 0, 0, 1, 40, '#FFFFFF', MAT.flat);
  const beam = (col) => { const m = new MeshBuilder(); m.quad([-0.5, 0, 0], [0.5, 0, 0], [0.5, 0, 1], [-0.5, 0, 1], col, MAT.light); m.quad([0, -0.5, 0], [0, 0.5, 0], [0, 0.5, 1], [0, -0.5, 1], col, MAT.light); return m.build(); };
  const shadow = new MeshBuilder(); disc(shadow, 0, 0, 0, 1, 24, '#000000', MAT.flat);
  const rocket = new MeshBuilder();
  withT(rocket, rot(0, 0, 0, 0, Math.PI / 2), () => {
    rocket.smoothCyl(0, -0.28, 0, 0.09, 0.46, 12, '#E8E4DC', MAT.paint);
    cone(rocket, [0, 0.18, 0], [0, 0.4, 0], 0.09, 12, '#D84A3A', MAT.paint);
    for (let i = 0; i < 4; i++) withT(rocket, rot(0, -0.24, 0, (i / 4) * Math.PI * 2), () => rocket.box(0, 0, 0.11, 0.02, 0.16, 0.1, '#3FA2F0', MAT.paint));
  });
  const mine = new MeshBuilder();
  mine.cyl(0, 0, 0, 0.3, 0.08, 16, '#2B2F36', MAT.trim);
  ring(mine, 0, 0.081, 0, 0.2, 0.3, 16, (i) => (i % 2 ? '#F2C14E' : '#22252B'), MAT.paint);
  sq(mine, 0, 0.09, 0, 0.11, 0.07, 0.11, 0.8, 0.8, '#FF3A2A', MAT.glow, 10, 5);
  const tower = new MeshBuilder();
  tower.cyl(0, 0, 0, 0.55, 0.16, 16, '#3A3F46', MAT.trim);
  tower.cyl(0, 0.16, 0, 0.42, 0.1, 16, '#F2C230', MAT.paint);
  tower.smoothCyl(0, 0.26, 0, 0.14, 1.3, 12, '#6A6E75', MAT.metal, { r2: 0.1 });
  for (let i = 0; i < 5; i++) tower.smoothCyl(0, 0.5 + i * 0.18, 0, 0.24 - i * 0.025, 0.05, 14, '#C87A3A', MAT.metal);
  ball(tower, 0, 1.68, 0, 0.24, '#8FE8FF', MAT.glow, 14);
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; tube(tower, [Math.cos(a) * 0.3, 0.26, Math.sin(a) * 0.3], [Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5], 0.04, 0.04, 6, '#3A3F46', MAT.trim); }
  const bubble = new MeshBuilder();
  sq(bubble, 0, 0, 0, 1, 1, 1, 1, 1, '#7FE9FF', MAT.flat, 22, 14);
  const sh = new MeshBuilder();
  withT(sh, rot(0, 0, 0, 0, Math.PI / 2), () => { sq(sh, 0, 0, 0, 0.3, 0.06, 0.36, 0.5, 1.2, '#3FA2F0', MAT.paint, 16, 6); sq(sh, 0, 0.05, 0, 0.18, 0.04, 0.22, 0.5, 1.2, '#CFF2FF', MAT.glow, 12, 4); });
  const rf = new MeshBuilder();
  for (let i = -1; i <= 1; i++) { rf.smoothCyl(i * 0.14, -0.2, 0, 0.06, 0.28, 10, '#C9A04A', MAT.metal); cone(rf, [i * 0.14, 0.08, 0], [i * 0.14, 0.24, 0], 0.06, 10, '#FF8A2E', MAT.paint); }
  const sp = new MeshBuilder();
  const bolt = [[-0.08, 0.3], [0.14, 0.3], [0.02, 0.05], [0.16, 0.05], [-0.1, -0.32], [0.0, -0.06], [-0.14, -0.06]];
  for (const zz of [-0.05, 0.05]) { const q = (p) => [p[0], p[1], zz]; sp.tri(q(bolt[0]), q(bolt[1]), q(bolt[2]), '#7BF27B', MAT.glow); sp.tri(q(bolt[0]), q(bolt[2]), q(bolt[6]), '#7BF27B', MAT.glow); sp.tri(q(bolt[6]), q(bolt[3]), q(bolt[4]), '#7BF27B', MAT.glow); sp.tri(q(bolt[6]), q(bolt[2]), q(bolt[3]), '#7BF27B', MAT.glow); }
  ring(sp, 0, 0, 0, 0.3, 0.36, 20, '#2E9C4A', MAT.paint);

  return { bomb: bomb.build(), mega: mega.build(), missile: missile.build(), hp: hp.build(), pw: pw.build(), su: su.build(), strip: strip.build(), fanBlaze: fan(0.6), fanWave: fan(1.0), ring: ringM.build(), disc: discM.build(), beamR: beam('#FF5A3A'), beamB: beam('#7FE9FF'), beamW: beam('#FFFFFF'), blob: shadow.build(), rocket: rocket.build(), mine: mine.build(), tower: tower.build(), bubble: bubble.build(), sh: sh.build(), rf: rf.build(), sp: sp.build() };
}

export { MAT, hsh, mix, shade, sq, ball, basis, withT, tube, cone, rot, ring, disc };

const lin = (h) => hexRgb(h).map((v) => v ** 2.2);
export function heroThumbEnv() {
  return { sunDir: [-0.35, 0.75, 0.56], sunCol: [2.5, 2.35, 2.15], skyCol: [0.5, 0.52, 0.6], gndCol: [0.32, 0.3, 0.34], fogCol: lin('#20263A'), fogSun: hexRgb('#FFFFFF'), fogSunLin: lin('#FFFFFF'), horizon: hexRgb('#2A3350'), zenith: hexRgb('#141A2C'), fogDen: 0.0001, exposure: 1.0, time: 0, shadowRange: 3, clouds: 0, shadows: false };
}
