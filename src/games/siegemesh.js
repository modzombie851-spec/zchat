import { MeshBuilder, m4, hexRgb } from './race3d.js';
import { TILE, C_WALL, C_CRATE, C_BUSH, C_WATER, C_PAD, C_HOME } from './siegeengine.js';

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
const HERO_FN = { blaze: heroBlaze, pip: heroPip, boom: heroBoom, mira: heroMira };
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
  return { bomb: bomb.build(), mega: mega.build(), missile: missile.build(), hp: hp.build(), pw: pw.build(), su: su.build(), strip: strip.build(), fanBlaze: fan(0.6), fanWave: fan(1.0), ring: ringM.build(), disc: discM.build(), beamR: beam('#FF5A3A'), beamB: beam('#7FE9FF'), beamW: beam('#FFFFFF'), blob: shadow.build() };
}

const THEME = {
  yard: {
    floorA: '#C4AF8A', floorB: '#BBA682', grout: '#94846A', out: '#8C8070', outB: '#7D7264', bushA: '#4FAE3E', bushB: '#7BCB4E', water: '#2BB5A5', rim: '#8A919E', rimTop: '#F2C14E',
    env: { sunDir: [-0.42, 0.8, -0.43], sunCol: [2.55, 2.25, 1.86], skyCol: [0.4, 0.43, 0.5], gndCol: [0.32, 0.28, 0.23], fog: '#D8CDB8', horizon: '#E9DFCB', zenith: '#6F9AD0', fogDen: 0.0035, exposure: 0.86, shadowRange: 32 },
  },
  ruins: {
    floorA: '#7EBF55', floorB: '#76B64D', grout: '#5A9440', out: '#3F6B2E', outB: '#365E27', bushA: '#2FA84F', bushB: '#5FD06A', water: '#37C2D0', rim: '#A39C86', rimTop: '#7DBD52',
    env: { sunDir: [-0.36, 0.84, -0.4], sunCol: [2.5, 2.4, 2.05], skyCol: [0.4, 0.5, 0.48], gndCol: [0.24, 0.32, 0.18], fog: '#C9DDC0', horizon: '#DCE9D3', zenith: '#5E9CCB', fogDen: 0.0035, exposure: 0.9, shadowRange: 32 },
  },
};
const lin = (h) => hexRgb(h).map((v) => v ** 2.2);
export function arenaEnv(A) {
  const T = (THEME[A.theme] || THEME.yard).env;
  const s = T.sunDir, L = Math.hypot(s[0], s[1], s[2]);
  return { sunDir: [s[0] / L, s[1] / L, s[2] / L], sunCol: T.sunCol, skyCol: T.skyCol, gndCol: T.gndCol, fogCol: lin(T.fog), fogSun: hexRgb('#FFF1D8'), fogSunLin: lin('#FFF1D8'), horizon: hexRgb(T.horizon), zenith: hexRgb(T.zenith), fogDen: T.fogDen, exposure: T.exposure, shadowRange: T.shadowRange, clouds: 0, time: 0 };
}

const CAR_COLS = ['#C8402F', '#3B6FB6', '#2E9C8F', '#E3B341', '#E8E4DC', '#7A4FA8', '#5C6370'];
function junkBlock(m, x, z, h, seed) {
  let y = 0;
  const layers = Math.max(2, Math.round(h / 0.62));
  const lh = h / layers;
  for (let i = 0; i < layers; i++) {
    const c = CAR_COLS[Math.floor(hsh(seed, i, 1) * CAR_COLS.length)];
    const ox = (hsh(seed, i, 2) - 0.5) * 0.14, oz = (hsh(seed, i, 3) - 0.5) * 0.14;
    const w = 1.86 - hsh(seed, i, 4) * 0.1;
    m.box(x + ox, y, z + oz, w, lh * 0.82, w, shade(c, 0.85 + hsh(seed, i, 5) * 0.25), MAT.paint, { taper: 0.04 });
    m.box(x + ox * 0.5, y + lh * 0.82, z + oz * 0.5, w - 0.1, lh * 0.18, w - 0.1, '#2B2F36', MAT.metal);
    if (hsh(seed, i, 6) < 0.5) m.box(x + ox + (hsh(seed, i, 7) - 0.5) * 0.8, y + lh * 0.25, z + oz + w / 2 - 0.02, 0.5, lh * 0.3, 0.05, '#1B2433', MAT.glass);
    y += lh;
  }
  if (hsh(seed, 9, 9) < 0.35) { for (let k = 0; k < 2; k++) withT(m, rot(x + (hsh(seed, k, 11) - 0.5) * 0.6, y + 0.12 + k * 0.24, z + (hsh(seed, k, 12) - 0.5) * 0.6, 0), () => { m.smoothCyl(0, 0, 0, 0.42, 0.22, 16, '#22252B', MAT.plastic, { cap: true }); ring(m, 0, 0.222, 0, 0.18, 0.42, 16, '#2B2F36', MAT.plastic); disc(m, 0, 0.221, 0, 0.18, 12, '#7A808C', MAT.metal); }); }
}
function crate(m, x, z, seed) {
  const h = 1.42;
  m.box(x, 0, z, 1.9, h, 1.9, '#4E5866', MAT.metal, { taper: 0.03 });
  const pc = hsh(seed, 1) < 0.5 ? '#76879C' : '#6E8299';
  for (const [dx, dz, sx, sz] of [[0, 0.95, 1.6, 0.04], [0, -0.95, 1.6, 0.04], [0.95, 0, 0.04, 1.6], [-0.95, 0, 0.04, 1.6]]) m.box(x + dx, 0.12, z + dz, sx, h - 0.24, sz, pc, MAT.paint);
  m.box(x, h, z, 1.66, 0.04, 1.66, pc, MAT.paint);
  m.box(x, h + 0.04, z - 0.5, 1.66, 0.012, 0.22, '#F2C14E', MAT.flat);
  for (const [dx, dz] of [[0.95, 0.95], [-0.95, 0.95], [0.95, -0.95], [-0.95, -0.95]]) m.box(x + dx * 0.98, 0, z + dz * 0.98, 0.14, h + 0.03, 0.14, '#3B4049', MAT.metal);
  withT(m, rot(x, h * 0.5, z + 0.975, 0, 0, 0.62), () => m.box(0, -0.85, 0, 0.1, 1.7, 0.03, '#3B4049', MAT.metal));
}
function stone(m, x, z, h, seed, moss) {
  const t = 0.05 + hsh(seed, 1) * 0.06;
  m.box(x, 0, z, 1.96, h, 1.96, mix('#A39C86', '#B5AE96', hsh(seed, 2)), MAT.matte, { taper: t });
  m.box(x + (hsh(seed, 3) - 0.5) * 0.5, h * 0.45, z + 0.985, 0.9, 0.06, 0.02, '#7E7864', MAT.matte);
  m.box(x - 0.985, h * 0.6, z + (hsh(seed, 4) - 0.5) * 0.5, 0.02, 0.06, 0.8, '#7E7864', MAT.matte);
  if (moss) m.box(x, h, z, 1.96 - t * 2, 0.1, 1.96 - t * 2, mix('#5E9E3B', '#78B84A', hsh(seed, 5)), MAT.matte, { taper: 0.08 });
  if (hsh(seed, 6) < 0.3) for (let k = 0; k < 3; k++) ball(m, x + (hsh(seed, k, 7) - 0.5) * 1.6, h * (0.3 + hsh(seed, k, 8) * 0.5), z + 0.99, 0.08, '#4E8C34', MAT.matte, 6);
}
function bushCell(m, x, z, seed, T) {
  const n = 5;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + hsh(seed, i) * 0.8, d = i === 0 ? 0 : 0.5 + hsh(seed, i, 2) * 0.25;
    const r = 0.5 + hsh(seed, i, 3) * 0.2;
    const c = mix(T.bushA, T.bushB, 0.15 + hsh(seed, i, 4) * 0.4);
    sq(m, x + Math.cos(a) * d, 0.5 + hsh(seed, i, 5) * 0.25, z + Math.sin(a) * d, r, r * 0.95, r, 0.9, 0.9, c, MAT.matte, 10, 6);
  }
  sq(m, x, 1.0, z, 0.55, 0.32, 0.55, 0.9, 0.9, mix(T.bushA, T.bushB, 0.7), MAT.matte, 10, 6);
}
function palm(m, x, z, s, seed) {
  tube(m, [x, 0, z], [x + 0.4 * s, 4.6 * s, z + 0.2 * s], 0.32 * s, 0.22 * s, 10, '#8A6A45', MAT.matte);
  for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2 + hsh(seed, i); const tx = x + 0.4 * s, ty = 4.6 * s, tz = z + 0.2 * s; sq(m, tx + Math.cos(a) * 1.2 * s, ty - 0.2 * s, tz + Math.sin(a) * 1.2 * s, 1.3 * s, 0.25 * s, 0.5 * s, 0.9, 0.9, mix('#2F8A3E', '#4FAE3E', hsh(seed, i, 2)), MAT.matte, 10, 5); }
  ball(m, x + 0.4 * s, 4.6 * s, z + 0.2 * s, 0.55 * s, '#2F8A3E', MAT.matte, 10);
}
function bigTree(m, x, z, s, seed) {
  tube(m, [x, 0, z], [x, 3.2 * s, z], 0.45 * s, 0.32 * s, 10, '#6B4E33', MAT.matte);
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + hsh(seed, i) * 0.7, d = 1.2 * s; sq(m, x + Math.cos(a) * d, 3.6 * s + hsh(seed, i, 2) * 0.8 * s, z + Math.sin(a) * d, 1.5 * s, 1.1 * s, 1.5 * s, 0.9, 0.9, mix('#2E7D38', '#4FAE3E', hsh(seed, i, 3)), MAT.matte, 10, 6); }
  sq(m, x, 4.8 * s, z, 1.7 * s, 1.2 * s, 1.7 * s, 0.9, 0.9, '#3F9A45', MAT.matte, 10, 6);
}
function junkPile(m, x, z, s, seed) {
  for (let i = 0; i < 9; i++) {
    const a = hsh(seed, i) * Math.PI * 2, d = hsh(seed, i, 2) * 1.6 * s;
    const c = CAR_COLS[Math.floor(hsh(seed, i, 3) * CAR_COLS.length)];
    const w = (0.8 + hsh(seed, i, 4) * 1.2) * s;
    withT(m, rot(x + Math.cos(a) * d, (1 - d / (1.7 * s)) * 1.4 * s, z + Math.sin(a) * d, hsh(seed, i, 5) * 3, (hsh(seed, i, 6) - 0.5) * 0.8, (hsh(seed, i, 7) - 0.5) * 0.8), () => m.box(0, -w * 0.3, 0, w, w * 0.55, w * 0.8, shade(c, 0.8), MAT.paint));
  }
}
function container(m, x, z, yaw, col) {
  withT(m, rot(x, 0, z, yaw), () => {
    m.box(0, 0, 0, 2.4, 2.5, 6, col, MAT.paint);
    for (let i = -5; i <= 5; i++) m.box(0, 0.1, i * 0.52, 2.46, 2.3, 0.1, shade(col, 0.82), MAT.paint);
    m.box(0, 2.5, 0, 2.3, 0.05, 5.9, shade(col, 0.9), MAT.paint);
  });
}
function crane(m, x, z) {
  m.box(x, 0, z, 1.6, 0.6, 1.6, '#3B4049', MAT.metal);
  for (let i = 0; i < 6; i++) { m.box(x, 0.6 + i * 1.5, z, 0.9, 1.5, 0.9, '#E3B341', MAT.paint); m.box(x, 0.6 + i * 1.5 + 1.4, z, 1.0, 0.1, 1.0, '#2B2F36', MAT.metal); }
  m.box(x - 1.2, 9.6, z - 0.4, 7, 0.6, 0.8, '#E3B341', MAT.paint);
  m.box(x + 2.6, 8.2, z - 0.4, 0.06, 1.4, 0.06, '#22252B', MAT.metal);
  m.box(x - 4.2, 9.0, z - 0.6, 1.4, 1.2, 1.2, '#3B4049', MAT.metal);
}
function temple(m, x, z, s) {
  for (let i = 0; i < 4; i++) { const w = (6 - i * 1.3) * s; m.box(x, i * 1.1 * s, z, w, 1.1 * s, w, mix('#A39C86', '#8E8772', i / 4), MAT.matte, { taper: 0.1 }); m.box(x, (i + 1) * 1.1 * s, z, w - 0.2, 0.08, w - 0.2, '#5E9E3B', MAT.matte); }
  m.box(x, 4.4 * s, z + 1.0 * s, 1.0 * s, 1.0 * s, 0.1, '#2B2620', MAT.matte);
}

export function arenaMeshes(A) {
  const T = THEME[A.theme] || THEME.yard;
  const g = new MeshBuilder(), p = new MeshBuilder(), w = new MeshBuilder(), deco = new MeshBuilder();
  const W = A.W, Hh = A.H;
  const yard = A.theme === 'yard';
  const M0 = 22;
  const ox0 = -M0, ox1 = A.wx + M0, oz0 = -M0 - 6, oz1 = A.wz + 10;
  const step = 4;
  for (let x = ox0; x < ox1; x += step) for (let z = oz0; z < oz1; z += step) {
    const inside = x >= 0 && x < A.wx && z >= 0 && z < A.wz;
    if (inside) continue;
    const c = mix(T.out, T.outB, hsh(x, z, 3) * 0.8);
    g.quad([x, -0.02, z], [x, -0.02, z + step], [x + step, -0.02, z + step], [x + step, -0.02, z], c, MAT.matte);
  }
  for (let r = 0; r < Hh; r++) for (let c = 0; c < W; c++) {
    const v = A.cells[r * W + c];
    const x = c * TILE, z = r * TILE;
    if (v === C_WATER) continue;
    g.quad([x, -0.01, z], [x, -0.01, z + TILE], [x + TILE, -0.01, z + TILE], [x + TILE, -0.01, z], T.grout, MAT.matte);
    const base = (r + c) % 2 ? T.floorA : T.floorB;
    const col = shade(base, 0.96 + hsh(c, r, 1) * 0.08);
    const e = 0.06;
    g.quad([x + e, 0, z + e], [x + e, 0, z + TILE - e], [x + TILE - e, 0, z + TILE - e], [x + TILE - e, 0, z + e], v === C_BUSH ? shade(col, 0.82) : col, MAT.matte);
    if (v === C_WALL || v === C_CRATE) continue;
    const k = hsh(c, r, 7);
    if (yard) {
      if (k < 0.12) sq(deco, x + 0.5 + hsh(c, r, 8) * 1, 0.004, z + 0.5 + hsh(c, r, 9) * 1, 0.35 + hsh(c, r, 10) * 0.3, 0.002, 0.25 + hsh(c, r, 11) * 0.25, 1, 1, '#4A4238', MAT.glass, 10, 3);
      else if (k < 0.2) { withT(deco, rot(x + 1, 0.006, z + 1, hsh(c, r, 12) * 3), () => { deco.box(-0.4, 0, 0, 0.8, 0.004, 0.04, '#8A7A60', MAT.matte); deco.box(0.1, 0, 0.12, 0.5, 0.004, 0.035, '#8A7A60', MAT.matte); }); }
      else if (k < 0.24) { const bx = x + 0.4 + hsh(c, r, 13) * 1.2, bz = z + 0.4 + hsh(c, r, 14) * 1.2; deco.cyl(bx, 0, bz, 0.07, 0.05, 6, '#7A808C', MAT.metal); }
    } else {
      if (k < 0.18) for (let f = 0; f < 3; f++) { const fx = x + 0.3 + hsh(c, r, 20 + f) * 1.4, fz = z + 0.3 + hsh(c, r, 30 + f) * 1.4; const fc = ['#FFFFFF', '#FFD24A', '#FF8CBF'][Math.floor(hsh(c, r, 40 + f) * 3)]; ball(deco, fx, 0.06, fz, 0.06, fc, MAT.matte, 6); }
      else if (k < 0.26) { const sx = x + 0.4 + hsh(c, r, 13) * 1.2, sz = z + 0.4 + hsh(c, r, 14) * 1.2; sq(deco, sx, 0.03, sz, 0.18, 0.08, 0.14, 0.8, 0.8, '#A39C86', MAT.matte, 8, 5); }
      else if (k < 0.34) { for (let f = 0; f < 4; f++) { const fx = x + 0.3 + hsh(c, r, 50 + f) * 1.4, fz = z + 0.3 + hsh(c, r, 60 + f) * 1.4; withT(deco, rot(fx, 0, fz, hsh(c, r, 70 + f) * 3), () => { deco.tri([-0.05, 0, 0], [0.05, 0, 0], [0, 0.22, 0.03], '#5FA844', MAT.matte); }); } }
    }
  }
  const lowS = 0.75, midS = 1.75, highN = 2.7;
  for (let r = 0; r < Hh; r++) for (let c = 0; c < W; c++) {
    const v = A.cells[r * W + c];
    const x = (c + 0.5) * TILE, z = (r + 0.5) * TILE, sd = r * 131 + c * 7;
    if (v === C_WALL) {
      const border = r === 0 || r === Hh - 1 || c === 0 || c === W - 1;
      const h = !border ? (yard ? 1.6 : 1.55) : r === Hh - 1 ? lowS : r === 0 ? highN : midS;
      if (yard) {
        if (border && r === Hh - 1) { p.box(x, 0, z, 1.98, h, 1.98, '#8E949C', MAT.matte, { taper: 0.05, top: '#7B8189' }); p.box(x, h, z - 0.78, 1.9, 0.012, 0.16, c % 2 ? '#E8B83C' : '#2B2F36', MAT.flat); }
        else junkBlock(p, x, z, h, sd);
      } else {
        if (border && r === Hh - 1) stone(p, x, z, h, sd, true);
        else stone(p, x, z, h, sd, !border || hsh(sd, 3) < 0.7);
        if (border && r === 0 && c % 3 === 1) { tube(p, [x, h, z], [x, h + 1.0, z], 0.42, 0.36, 10, '#B5AE96', MAT.matte); p.box(x, h + 1.0, z, 1.0, 0.18, 1.0, '#A39C86', MAT.matte); }
      }
    } else if (v === C_CRATE) {
      if (yard) crate(p, x, z, sd); else stone(p, x, z, 1.3, sd, true);
    } else if (v === C_WATER) {
      w.quad([x - 1, -0.16, z - 1], [x - 1, -0.16, z + 1], [x + 1, -0.16, z + 1], [x + 1, -0.16, z - 1], T.water, MAT.glass);
      g.quad([x - 1, -0.5, z - 1], [x - 1, -0.5, z + 1], [x + 1, -0.5, z + 1], [x + 1, -0.5, z - 1], shade(T.water, 0.45), MAT.matte);
      for (const [dc, dr, ex, ez] of [[1, 0, 1, 0], [-1, 0, -1, 0], [0, 1, 0, 1], [0, -1, 0, -1]]) {
        const nv = A.cells[(r + dr) * W + (c + dc)];
        if (nv === C_WATER) continue;
        const rx = x + ex * 0.92, rz = z + ez * 0.92;
        p.box(rx, -0.5, rz, ex ? 0.2 : 2.0, 0.62, ez ? 0.2 : 2.0, T.rim, MAT.matte);
        if (yard) p.box(rx, 0.12, rz, ex ? 0.21 : 2.0, 0.03, ez ? 0.21 : 2.0, T.rimTop, MAT.flat);
        else p.box(rx, 0.12, rz, ex ? 0.24 : 2.0, 0.06, ez ? 0.24 : 2.0, '#5E9E3B', MAT.matte);
      }
      if (!yard && hsh(c, r, 77) < 0.7) for (let k = 0; k < 2; k++) { const lx = x + (hsh(c, r, 80 + k) - 0.5) * 1.3, lz = z + (hsh(c, r, 90 + k) - 0.5) * 1.3; sq(deco, lx, -0.145, lz, 0.28, 0.01, 0.28, 1, 1, '#4FAE3E', MAT.matte, 10, 3); if (k === 0) ball(deco, lx + 0.08, -0.11, lz, 0.06, '#FF8CBF', MAT.matte, 6); }
    } else if (v === C_PAD) {
      deco.cyl(x, 0, z, 0.86, 0.04, 24, '#3B4049', MAT.metal);
      ring(deco, x, 0.041, z, 0.62, 0.86, 16, (i) => (i % 2 ? '#F2C14E' : '#22252B'), MAT.paint);
      disc(deco, x, 0.042, z, 0.62, 20, '#5C6370', MAT.metal);
      for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + Math.PI / 4; deco.box(x + Math.cos(a) * 0.98, 0, z + Math.sin(a) * 0.98, 0.16, 0.12, 0.16, '#2B2F36', MAT.metal); }
      for (let i = 0; i < 3; i++) deco.box(x, 0.043, z - 0.3 + i * 0.3, 0.9, 0.004, 0.06, '#2B2F36', MAT.matte);
    } else if (v === C_HOME) {
      ring(deco, x, 0.006, z, 0.6, 0.72, 28, '#5AA8FF', MAT.flat);
      ring(deco, x, 0.006, z, 0.3, 0.36, 20, '#5AA8FF', MAT.flat);
    }
  }
  const bushes = A.clusters.map((list) => {
    const m = new MeshBuilder();
    let sx = 0, sz = 0;
    for (const { c, r } of list) { const x = (c + 0.5) * TILE, z = (r + 0.5) * TILE; bushCell(m, x, z, r * 31 + c * 17, T); sx += x; sz += z; }
    const cx = sx / list.length, cz = sz / list.length;
    let rad = 0; for (const { c, r } of list) rad = Math.max(rad, Math.hypot((c + 0.5) * TILE - cx, (r + 0.5) * TILE - cz));
    return { data: m.build(), bs: [cx, 0.8, cz, rad + 1.6], cells: list.map(({ c, r }) => r * W + c) };
  });
  const out = new MeshBuilder();
  const spots = [];
  for (let i = 0; i < 70; i++) {
    const side = i % 4;
    const u = hsh(i, 5);
    let x, z;
    if (side === 0) { x = -M0 + u * (A.wx + M0 * 2); z = -3 - hsh(i, 6) * (M0 - 4); }
    else if (side === 1) { x = -2.5 - hsh(i, 7) * (M0 - 4); z = -M0 + u * (A.wz + M0 + 6); }
    else if (side === 2) { x = A.wx + 2.5 + hsh(i, 7) * (M0 - 4); z = -M0 + u * (A.wz + M0 + 6); }
    else { x = -M0 + u * (A.wx + M0 * 2); z = A.wz + 2.5 + hsh(i, 6) * 6; }
    if (spots.some((s) => Math.hypot(s[0] - x, s[1] - z) < 4.2)) continue;
    spots.push([x, z]);
    const s = 0.8 + hsh(i, 8) * 0.6, kind = hsh(i, 9);
    if (yard) {
      if (side === 3) { if (kind < 0.5) { for (let k = 0; k < 3; k++) withT(out, rot(x, k * 0.24, z, 0), () => { out.smoothCyl(0, 0, 0, 0.42, 0.22, 14, '#22252B', MAT.plastic); disc(out, 0, 0.222, 0, 0.42, 14, '#2B2F36', MAT.plastic); }); } else { out.cyl(x, 0, z, 0.36, 1.0, 14, kind < 0.75 ? '#C8402F' : '#3B6FB6', MAT.paint); out.cyl(x, 0.3, z, 0.37, 0.06, 14, '#2B2F36', MAT.metal); } }
      else if (kind < 0.45) junkPile(out, x, z, s * 1.4, i);
      else if (kind < 0.7) container(out, x, z, hsh(i, 10) * 3, CAR_COLS[Math.floor(hsh(i, 11) * 4)]);
      else junkBlock(out, x, z, 1.2 + hsh(i, 12) * 1.8, i * 3);
    } else {
      if (side === 3) { bushCell(out, x, z, i, T); }
      else if (kind < 0.55) bigTree(out, x, z, s, i);
      else if (kind < 0.8) palm(out, x, z, s, i);
      else stone(out, x, z, 1.2 + hsh(i, 12) * 1.4, i, true);
    }
  }
  if (yard) { crane(out, A.wx * 0.72, -9); container(out, A.wx * 0.25, -8, 0.2, '#2E9C8F'); }
  else { temple(out, A.wx * 0.5, -12, 1.4); }
  return { ground: g.build(), props: p.build(), water: w.build(), deco: deco.build(), outer: out.build(), bushes };
}

export function heroThumbEnv() {
  return { sunDir: [-0.35, 0.75, 0.56], sunCol: [2.5, 2.35, 2.15], skyCol: [0.5, 0.52, 0.6], gndCol: [0.32, 0.3, 0.34], fogCol: lin('#20263A'), fogSun: hexRgb('#FFFFFF'), fogSunLin: lin('#FFFFFF'), horizon: hexRgb('#2A3350'), zenith: hexRgb('#141A2C'), fogDen: 0.0001, exposure: 1.0, time: 0, shadowRange: 3, clouds: 0, shadows: false };
}
