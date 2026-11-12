import { MeshBuilder, m4, hexRgb } from './race3d.js';
import { MAT, hsh, sq, ball, withT, tube, rot } from './siegemesh.js';

const C = (h) => (typeof h === 'string' ? hexRgb(h) : h);
const sh = (c, k) => { const A = C(c); return [Math.min(1, A[0] * k), Math.min(1, A[1] * k), Math.min(1, A[2] * k)]; };
const nrm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

function rb(m, x, y, z, hx, hy, hz, col, mat, e = 0.2, seg = 12, rows = 7) { sq(m, x, y, z, hx, hy, hz, e, e, col, mat, seg, rows); }
function grain(m, x, y, z, hx, hy, hz, col, seed, e = 0.32) {
  const c = C(col);
  sq(m, x, y, z, hx, hy, hz, e, e, c, MAT.plastic, 14, 12, (i) => { const k = 0.93 + 0.06 * Math.sin(i * 1.1 + seed * 1.7) + (hsh(seed, i, 3) - 0.5) * 0.04; return [sh(c, k), MAT.plastic]; });
}
const zc = (m, x, y, z, r, h, seg, col, mat, o) => withT(m, rot(x, y, z, 0, Math.PI / 2), () => m.smoothCyl(0, 0, 0, r, h, seg, col, mat, o));
const disc = (m, x, y, z, r, col, mat, seg = 14) => withT(m, rot(x, y, z, 0, Math.PI / 2), () => m.cyl(0, 0, 0, r, 0.0015, seg, col, mat));

export function frameAt(o, yAxis, zHint, mirror = false) {
  const Y = nrm(yAxis);
  const Z = nrm([zHint[0] - Y[0] * dot(zHint, Y), zHint[1] - Y[1] * dot(zHint, Y), zHint[2] - Y[2] * dot(zHint, Y)]);
  let X = crs(Y, Z);
  if (mirror) X = [-X[0], -X[1], -X[2]];
  return new Float32Array([X[0], X[1], X[2], 0, Y[0], Y[1], Y[2], 0, Z[0], Z[1], Z[2], 0, o[0], o[1], o[2], 1]);
}

function loftZ(m, st, seg, col, mat, e, seed) {
  const c = C(col);
  const P = st.map((S) => { const row = []; for (let j = 0; j < seg; j++) { const a = (j / seg) * Math.PI * 2; const cs = Math.cos(a), sn = Math.sin(a); const f = (w) => Math.sign(w) * Math.pow(Math.abs(w), e); row.push([f(cs) * S.hx, S.yc + f(sn) * S.hy, S.z]); } return row; });
  m.surface(P, c, mat, { wrap: true, at: (i, j) => [sh(c, 0.9 + 0.07 * Math.sin(j * 1.9 + seed) + (hsh(seed, j, 2) - 0.5) * 0.05), mat] });
  for (const [k, sg] of [[0, 1], [st.length - 1, -1]]) { const row = P[k], S = st[k]; for (let j = 0; j < seg; j++) { const j1 = (j + 1) % seg; if (sg > 0) m.tri([0, S.yc, S.z], row[j1], row[j], sh(c, 0.85), mat); else m.tri([0, S.yc, S.z], row[j], row[j1], sh(c, 0.85), mat); } }
}

function rifleMag(m, furn, dark) {
  let p = [0, -0.018, 0.108], ang = 0;
  for (let i = 0; i < 5; i++) {
    ang += 0.075;
    const P = p, A = ang;
    withT(m, rot(P[0], P[1], P[2], 0, -A), () => { rb(m, 0, -0.022, 0, 0.0165, 0.0235, 0.03, furn, MAT.plastic, 0.22); for (const s of [-1, 1]) m.box(s * 0.0168, -0.034, -0.006, 0.002, 0.016, 0.04, sh(furn, 0.78), MAT.plastic); });
    p = [0, P[1] - 0.043 * Math.cos(A), P[2] + 0.043 * Math.sin(A)];
  }
  withT(m, rot(p[0], p[1] + 0.004, p[2], 0, -ang), () => rb(m, 0, -0.004, 0, 0.02, 0.009, 0.034, dark, MAT.trim, 0.3));
}
function rifle(m, o) {
  const body = C(o.body || '#2A2C30'), furn = C(o.furn || '#30333A'), dark = C('#18191C'), metal = C('#4C5058'), bore = 0.082;
  rb(m, 0, 0.032, 0.06, 0.022, 0.03, 0.13, body, MAT.trim, 0.18);
  rb(m, 0, -0.004, 0.108, 0.025, 0.026, 0.042, body, MAT.trim, 0.25);
  rb(m, 0, 0.087, 0.065, 0.025, 0.027, 0.14, sh(body, 1.1), MAT.trim, 0.18);
  m.box(0, 0.112, 0.065, 0.034, 0.012, 0.28, dark, MAT.trim);
  for (let i = 0; i < 14; i++) m.box(0, 0.124, -0.065 + i * 0.02, 0.036, 0.005, 0.01, metal, MAT.metal);
  m.box(-0.0255, 0.074, 0.05, 0.003, 0.022, 0.062, dark, MAT.trim);
  m.box(-0.026, 0.072, 0.092, 0.004, 0.022, 0.012, metal, MAT.metal);
  tube(m, [-0.022, 0.092, -0.045], [-0.034, 0.092, -0.025], 0.009, 0.009, 8, metal, MAT.metal);
  m.box(0, 0.104, -0.085, 0.052, 0.011, 0.016, dark, MAT.trim);
  m.box(0.0245, 0.03, 0.02, 0.003, 0.012, 0.012, metal, MAT.metal);
  m.box(0.0245, 0.04, 0.075, 0.003, 0.02, 0.008, metal, MAT.metal);
  zc(m, 0, bore, 0.205, 0.031, 0.29, 8, furn, MAT.trim);
  for (let i = 0; i < 4; i++) { for (const s of [-1, 1]) m.box(s * 0.0305, bore - 0.01, 0.24 + i * 0.062, 0.004, 0.012, 0.036, dark, MAT.trim); m.box(0, bore - 0.0305, 0.24 + i * 0.062, 0.014, 0.004, 0.036, dark, MAT.trim); }
  m.box(0, 0.112, 0.35, 0.03, 0.012, 0.29, dark, MAT.trim);
  for (let i = 0; i < 14; i++) m.box(0, 0.124, 0.215 + i * 0.02, 0.032, 0.004, 0.01, metal, MAT.metal);
  tube(m, [0, bore, 0.495], [0, bore, 0.645], 0.0105, 0.0105, 10, metal, MAT.metal);
  rb(m, 0, bore, 0.53, 0.016, 0.016, 0.012, dark, MAT.trim, 0.3);
  m.box(0, bore + 0.012, 0.53, 0.008, 0.045, 0.008, dark, MAT.trim);
  zc(m, 0, bore, 0.64, 0.016, 0.06, 10, dark, MAT.metal);
  for (let i = 0; i < 3; i++) for (const s of [-1, 1]) m.box(s * 0.0158, bore - 0.006, 0.648 + i * 0.016, 0.003, 0.012, 0.008, C('#060606'), MAT.matte);
  disc(m, 0, bore, 0.7005, 0.007, C('#050505'), MAT.matte, 10);
  if (!o.noMag) rifleMag(m, furn, dark);
  const ga = 0.32;
  withT(m, rot(0, -0.004, -0.012, 0, ga), () => { rb(m, 0, -0.05, 0, 0.0205, 0.058, 0.029, furn, MAT.plastic, 0.35); for (let i = 0; i < 3; i++) ball(m, 0, -0.03 - i * 0.026, 0.028, 0.009, sh(furn, 0.9), MAT.plastic, 6); for (let i = 0; i < 6; i++) for (const s of [-1, 1]) ball(m, s * 0.02, -0.025 - i * 0.014, -0.006 + (i % 2) * 0.008, 0.0035, sh(furn, 0.8), MAT.plastic, 4); });
  tube(m, [0, 0.0, 0.016], [0, -0.03, 0.03], 0.0038, 0.0038, 5, body, MAT.trim, false);
  tube(m, [0, -0.03, 0.03], [0, -0.03, 0.084], 0.0038, 0.0038, 5, body, MAT.trim, false);
  tube(m, [0, -0.03, 0.084], [0, -0.004, 0.09], 0.0038, 0.0038, 5, body, MAT.trim, false);
  tube(m, [0, 0.0, 0.048], [0, -0.016, 0.054], 0.003, 0.0022, 5, metal, MAT.metal, true);
  tube(m, [0, 0.085, -0.075], [0, 0.085, -0.25], 0.0155, 0.0155, 10, dark, MAT.trim);
  for (let i = 0; i < 5; i++) m.box(0, 0.068, -0.12 - i * 0.022, 0.012, 0.006, 0.008, metal, MAT.metal);
  rb(m, 0, 0.068, -0.245, 0.023, 0.046, 0.065, furn, MAT.plastic, 0.3);
  rb(m, 0, 0.052, -0.316, 0.025, 0.062, 0.012, C('#151515'), MAT.matte, 0.3);
  rb(m, 0, 0.114, -0.235, 0.019, 0.012, 0.05, sh(furn, 1.05), MAT.plastic, 0.3);
  tube(m, [0.026, 0.05, -0.29], [0.026, 0.03, -0.27], 0.005, 0.005, 5, metal, MAT.metal, false);
  rb(m, 0, 0.138, 0.04, 0.021, 0.012, 0.05, dark, MAT.trim, 0.25);
  for (const s of [-1, 1]) m.box(s * 0.0195, 0.148, 0.04, 0.006, 0.048, 0.072, dark, MAT.trim);
  m.box(0, 0.193, 0.04, 0.045, 0.007, 0.072, dark, MAT.trim);
  if (!o.fp) { m.box(0, 0.15, 0.066, 0.033, 0.042, 0.003, C('#8FB4CC'), MAT.glass); ball(m, 0, 0.172, 0.0685, 0.0032, C('#FF3A24'), MAT.glow, 6); }
  m.box(-0.026, 0.14, 0.03, 0.006, 0.012, 0.012, metal, MAT.metal);
  tube(m, [0.039, bore - 0.004, 0.37], [0.039, bore - 0.004, 0.46], 0.011, 0.0125, 10, dark, MAT.trim);
  disc(m, 0.039, bore - 0.004, 0.4605, 0.011, C('#FFF2D6'), MAT.glow, 10);
  m.box(0.03, bore - 0.004, 0.41, 0.012, 0.012, 0.03, dark, MAT.trim);
}

function shotgun(m, o) {
  const wood = C(o.furn || '#6E4226'), steel = C('#3C4148'), dark = C('#1E2024'), shell = C('#C4302A'), brass = C('#C9A458');
  rb(m, 0, 0.046, 0.05, 0.025, 0.042, 0.11, steel, MAT.metal, 0.18);
  m.box(-0.0255, 0.056, 0.055, 0.003, 0.026, 0.07, dark, MAT.trim);
  for (let i = 0; i < 3; i++) m.box(0.0255, 0.05 + i * 0.01, 0.06, 0.002, 0.003, 0.12, sh(steel, 1.25), MAT.metal);
  m.box(0.031, 0.048, 0.0, 0.007, 0.052, 0.11, dark, MAT.trim);
  for (let i = 0; i < 4; i++) { const z = -0.04 + i * 0.026; tube(m, [0.038, 0.032, z], [0.038, 0.07, z], 0.0098, 0.0098, 8, shell, MAT.plastic, true); tube(m, [0.038, 0.07, z], [0.038, 0.08, z], 0.0102, 0.0102, 8, brass, MAT.metal, true); }
  tube(m, [0, 0.076, 0.16], [0, 0.076, 0.8], 0.0145, 0.0145, 12, steel, MAT.metal);
  m.box(0, 0.09, 0.48, 0.008, 0.006, 0.64, dark, MAT.trim);
  ball(m, 0, 0.098, 0.79, 0.0045, C('#F2E8C8'), MAT.metal, 6);
  disc(m, 0, 0.076, 0.8005, 0.011, C('#050505'), MAT.matte, 12);
  tube(m, [0, 0.042, 0.16], [0, 0.042, 0.72], 0.0135, 0.0135, 10, dark, MAT.metal);
  zc(m, 0, 0.042, 0.718, 0.0145, 0.012, 10, steel, MAT.metal);
  withT(m, rot(0, 0.045, 0.3, 0, Math.PI / 2), () => { m.smoothCyl(0, 0, 0, 0.027, 0.2, 14, wood, MAT.plastic); for (let i = 0; i < 8; i++) m.smoothCyl(0, 0.022 + i * 0.022, 0, 0.0278, 0.006, 14, sh(wood, 0.68), MAT.plastic, { cap: false }); });
  withT(m, rot(0, 0.006, -0.034, 0, 0.42), () => grain(m, 0, -0.045, 0, 0.02, 0.056, 0.028, wood, 3));
  loftZ(m, [{ z: -0.05, yc: 0.046, hy: 0.032, hx: 0.022 }, { z: -0.09, yc: 0.036, hy: 0.031, hx: 0.019 }, { z: -0.15, yc: 0.028, hy: 0.04, hx: 0.02 }, { z: -0.23, yc: 0.022, hy: 0.052, hx: 0.022 }, { z: -0.31, yc: 0.017, hy: 0.063, hx: 0.025 }, { z: -0.37, yc: 0.014, hy: 0.068, hx: 0.026 }], 18, wood, MAT.plastic, 0.55, 5);
  rb(m, 0, 0.004, -0.376, 0.027, 0.07, 0.012, C('#161616'), MAT.matte, 0.3);
  tube(m, [0, 0.002, 0.012], [0, -0.026, 0.026], 0.0038, 0.0038, 5, steel, MAT.trim, false);
  tube(m, [0, -0.026, 0.026], [0, -0.026, 0.074], 0.0038, 0.0038, 5, steel, MAT.trim, false);
  tube(m, [0, -0.026, 0.074], [0, 0.004, 0.082], 0.0038, 0.0038, 5, steel, MAT.trim, false);
  tube(m, [0, 0.004, 0.046], [0, -0.014, 0.052], 0.003, 0.0022, 5, C('#C9A458'), MAT.metal, true);
}

function pistol(m, o) {
  const slide = C(o.slide || '#3A3D43'), frame = C(o.frame || '#232529'), dark = C('#121316'), metal = C('#5A5F66');
  rb(m, 0, 0.06, 0.055, 0.0145, 0.019, 0.1, slide, MAT.metal, 0.2);
  for (let i = 0; i < 7; i++) for (const s of [-1, 1]) m.box(s * 0.0146, 0.05, -0.032 + i * 0.007, 0.002, 0.028, 0.003, dark, MAT.trim);
  m.box(-0.0148, 0.067, 0.06, 0.002, 0.012, 0.03, dark, MAT.trim);
  m.box(0, 0.08, -0.036, 0.017, 0.008, 0.008, dark, MAT.trim);
  for (const s of [-1, 1]) ball(m, s * 0.0055, 0.085, -0.031, 0.0022, C('#F4F2E8'), MAT.flat, 5);
  m.box(0, 0.08, 0.146, 0.005, 0.01, 0.006, dark, MAT.trim);
  ball(m, 0, 0.087, 0.15, 0.0022, C('#F4F2E8'), MAT.flat, 5);
  disc(m, 0, 0.064, 0.1555, 0.0065, C('#060606'), MAT.matte, 10);
  rb(m, 0, 0.027, 0.055, 0.0135, 0.014, 0.088, frame, MAT.plastic, 0.25);
  m.box(0, 0.006, 0.11, 0.022, 0.009, 0.05, frame, MAT.plastic);
  tube(m, [0, 0.012, 0.012], [0, -0.016, 0.026], 0.0035, 0.0035, 5, frame, MAT.plastic, false);
  tube(m, [0, -0.016, 0.026], [0, -0.016, 0.07], 0.0035, 0.0035, 5, frame, MAT.plastic, false);
  tube(m, [0, -0.016, 0.07], [0, 0.012, 0.078], 0.0035, 0.0035, 5, frame, MAT.plastic, false);
  tube(m, [0, 0.012, 0.042], [0, -0.006, 0.048], 0.0028, 0.002, 5, metal, MAT.metal, true);
  withT(m, rot(0, 0.012, -0.012, 0, 0.26), () => { rb(m, 0, -0.046, 0, 0.0155, 0.055, 0.0235, frame, MAT.plastic, 0.35); for (let i = 0; i < 7; i++) for (const s of [-1, 1]) ball(m, s * 0.0152, -0.018 - i * 0.012, -0.008 + (i % 2) * 0.008, 0.003, sh(frame, 0.75), MAT.plastic, 4); m.box(0, -0.105, -0.002, 0.034, 0.008, 0.05, dark, MAT.trim); });
  m.box(0, 0.054, -0.048, 0.014, 0.02, 0.012, frame, MAT.plastic);
}

function sniper(m, o) {
  const stock = C(o.body || '#4E5A3C'), dark = C('#1C1E22'), steel = C('#3A3F46'), metal = C('#5C626A'), bore = 0.085;
  rb(m, 0, 0.042, 0.29, 0.026, 0.03, 0.2, stock, MAT.plastic, 0.3);
  for (let i = 0; i < 5; i++) for (const s of [-1, 1]) m.box(s * 0.026, 0.045, 0.16 + i * 0.05, 0.003, 0.014, 0.03, sh(stock, 0.75), MAT.plastic);
  rb(m, 0, 0.045, 0.06, 0.028, 0.036, 0.09, stock, MAT.plastic, 0.3);
  withT(m, rot(0, 0.0, -0.03, 0, 0.35), () => rb(m, 0, -0.045, 0, 0.02, 0.055, 0.026, stock, MAT.plastic, 0.35));
  rb(m, 0, 0.028, -0.17, 0.024, 0.058, 0.1, stock, MAT.plastic, 0.3);
  rb(m, 0, 0.098, -0.15, 0.019, 0.016, 0.07, sh(stock, 1.1), MAT.plastic, 0.3);
  for (const s of [-1, 1]) zc(m, s * 0.02, 0.085, -0.15, 0.006, 0.005, 8, metal, MAT.metal);
  rb(m, 0, 0.016, -0.282, 0.026, 0.072, 0.012, C('#151515'), MAT.matte, 0.3);
  tube(m, [0, bore, -0.04], [0, bore, 0.17], 0.02, 0.02, 12, steel, MAT.metal);
  tube(m, [-0.019, bore, 0.0], [-0.055, 0.068, 0.002], 0.0048, 0.0048, 6, metal, MAT.metal, false);
  ball(m, -0.058, 0.066, 0.002, 0.011, dark, MAT.plastic, 8);
  if (!o.noMag) rb(m, 0, -0.002, 0.1, 0.017, 0.03, 0.034, dark, MAT.trim, 0.2);
  tube(m, [0, 0.002, 0.016], [0, -0.028, 0.03], 0.0038, 0.0038, 5, dark, MAT.trim, false);
  tube(m, [0, -0.028, 0.03], [0, -0.028, 0.066], 0.0038, 0.0038, 5, dark, MAT.trim, false);
  tube(m, [0, bore, 0.17], [0, bore, 0.96], 0.0135, 0.011, 12, steel, MAT.metal);
  for (const a of [0.6, 2.2, 3.8, 5.4]) m.box(Math.cos(a) * 0.012, bore + Math.sin(a) * 0.012, 0.56, 0.003, 0.003, 0.5, dark, MAT.trim);
  rb(m, 0, bore, 0.98, 0.017, 0.017, 0.032, dark, MAT.metal, 0.3);
  for (let i = 0; i < 3; i++) for (const s of [-1, 1]) m.box(s * 0.017, bore, 0.962 + i * 0.016, 0.003, 0.012, 0.008, C('#060606'), MAT.matte);
  disc(m, 0, bore, 1.0125, 0.0075, C('#050505'), MAT.matte, 10);
  const sy = 0.152;
  for (const z of [-0.01, 0.12]) { rb(m, 0, 0.126, z, 0.019, 0.024, 0.011, dark, MAT.trim, 0.3); m.box(0.02, 0.122, z, 0.006, 0.01, 0.01, metal, MAT.metal); }
  tube(m, [0, sy, -0.08], [0, sy, 0.2], 0.0165, 0.0165, 16, dark, MAT.trim);
  tube(m, [0, sy, 0.2], [0, sy, 0.275], 0.0165, 0.029, 16, dark, MAT.trim);
  tube(m, [0, sy, 0.275], [0, sy, 0.31], 0.029, 0.029, 16, dark, MAT.trim);
  tube(m, [0, sy, -0.118], [0, sy, -0.08], 0.023, 0.0165, 16, dark, MAT.trim);
  tube(m, [0, sy, -0.152], [0, sy, -0.118], 0.023, 0.023, 16, dark, MAT.trim);
  disc(m, 0, sy, 0.3105, 0.026, C('#3E7EC0'), MAT.glass, 18);
  disc(m, 0, sy, -0.1525, 0.02, C('#2A5A8A'), MAT.glass, 16);
  m.smoothCyl(0, sy + 0.012, 0.06, 0.0125, 0.02, 12, dark, MAT.trim);
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; m.box(Math.cos(a) * 0.0125, sy + 0.022, 0.06 + Math.sin(a) * 0.0125, 0.002, 0.012, 0.002, metal, MAT.metal); }
  withT(m, rot(-0.012, sy, 0.06, 0, 0, Math.PI / 2), () => m.smoothCyl(0, 0, 0, 0.0115, 0.02, 12, dark, MAT.trim));
  withT(m, rot(0.012, sy, -0.03, 0, 0, -Math.PI / 2), () => m.smoothCyl(0, 0, 0, 0.009, 0.014, 10, dark, MAT.trim));
  for (const s of [-1, 1]) { tube(m, [s * 0.014, 0.018, 0.44], [s * 0.022, 0.004, 0.66], 0.0065, 0.0055, 6, dark, MAT.trim, true); ball(m, s * 0.022, 0.004, 0.666, 0.008, C('#151515'), MAT.matte, 6); }
  m.box(0, 0.006, 0.44, 0.036, 0.016, 0.03, dark, MAT.trim);
}

function smgMag(m, dark) {
  rb(m, 0, -0.065, 0.12, 0.0135, 0.07, 0.021, dark, MAT.trim, 0.25);
  for (const s of [-1, 1]) m.box(s * 0.0137, -0.07, 0.115, 0.002, 0.09, 0.02, sh(dark, 1.5), MAT.trim);
}
function smg(m, o) {
  const body = C(o.body || '#2E3036'), dark = C('#17181B'), metal = C('#4C5058'), bore = 0.07;
  rb(m, 0, 0.045, 0.07, 0.022, 0.04, 0.14, body, MAT.trim, 0.2);
  m.box(0, 0.085, 0.07, 0.03, 0.012, 0.26, dark, MAT.trim);
  for (let i = 0; i < 12; i++) m.box(0, 0.097, -0.04 + i * 0.02, 0.032, 0.004, 0.01, metal, MAT.metal);
  m.box(-0.0225, 0.055, 0.06, 0.003, 0.02, 0.05, dark, MAT.trim);
  zc(m, 0, bore, 0.21, 0.021, 0.21, 16, dark, MAT.trim);
  for (let i = 0; i < 6; i++) withT(m, rot(0, bore, 0.23 + i * 0.03, 0, Math.PI / 2), () => m.smoothCyl(0, 0, 0, 0.0215, 0.004, 16, sh(dark, 1.6), MAT.trim, { cap: false }));
  disc(m, 0, bore, 0.4205, 0.008, C('#050505'), MAT.matte, 10);
  if (!o.noMag) smgMag(m, dark);
  rb(m, 0, -0.03, 0.2, 0.0135, 0.04, 0.0145, body, MAT.plastic, 0.4);
  for (let i = 0; i < 4; i++) ball(m, 0, -0.012 - i * 0.017, 0.214, 0.006, sh(body, 0.85), MAT.plastic, 5);
  withT(m, rot(0, 0.0, -0.012, 0, 0.3), () => rb(m, 0, -0.048, 0, 0.0195, 0.055, 0.027, body, MAT.plastic, 0.35));
  tube(m, [0, 0.0, 0.016], [0, -0.026, 0.03], 0.0036, 0.0036, 5, body, MAT.trim, false);
  tube(m, [0, -0.026, 0.03], [0, -0.026, 0.07], 0.0036, 0.0036, 5, body, MAT.trim, false);
  for (const yy of [0.075, 0.02]) tube(m, [0.016, yy, -0.07], [0.016, yy + 0.004, -0.27], 0.0055, 0.0055, 6, metal, MAT.metal, false);
  for (const yy of [0.075, 0.02]) tube(m, [-0.016, yy, -0.07], [-0.016, yy + 0.004, -0.27], 0.0055, 0.0055, 6, metal, MAT.metal, false);
  rb(m, 0, 0.05, -0.275, 0.024, 0.045, 0.01, dark, MAT.matte, 0.3);
  rb(m, 0, 0.115, 0.03, 0.013, 0.018, 0.03, dark, MAT.trim, 0.3);
  if (!o.fp) { m.box(0, 0.125, 0.051, 0.018, 0.022, 0.002, C('#8FB4CC'), MAT.glass); ball(m, 0, 0.137, 0.052, 0.0028, C('#FF3A24'), MAT.glow, 6); }
}

function bat(m) {
  const wood = C('#B58A54');
  tube(m, [0, -0.09, 0], [0, -0.07, 0.08], 0.018, 0.019, 10, C('#2A2522'), MAT.matte, true);
  for (let i = 0; i < 5; i++) tube(m, [0, -0.088 + i * 0.004, i * 0.016], [0, -0.084 + i * 0.004, 0.008 + i * 0.016], 0.0195, 0.0195, 10, C('#3A3330'), MAT.matte, false);
  tube(m, [0, -0.07, 0.08], [0, 0.02, 0.86], 0.019, 0.042, 14, wood, MAT.plastic, true);
  for (let i = 0; i < 7; i++) { const t = 0.5 + i * 0.05; const y = -0.07 + 0.09 * ((t * 0.86 - 0.08) / 0.78) + 0.0; const zz = t * 0.86; tube(m, [-0.06, y, zz], [0.06, y + 0.004, zz + 0.003], 0.003, 0.0028, 5, C('#9AA0A6'), MAT.metal, false); }
  tube(m, [0.042, -0.004, 0.62], [0.0, 0.012, 0.6], 0.004, 0.004, 5, C('#C2A04A'), MAT.metal, false);
}
function machete(m) {
  rb(m, 0, -0.06, 0, 0.012, 0.012, 0.075, C('#2A2420'), MAT.matte, 0.4);
  for (let i = 0; i < 6; i++) m.box(0, -0.06, -0.06 + i * 0.024, 0.026, 0.026, 0.006, C('#4A3A2E'), MAT.matte);
  m.box(0, -0.068, 0.082, 0.03, 0.034, 0.012, C('#3A3E44'), MAT.metal);
  const L = 0.5;
  for (let i = 0; i < 10; i++) {
    const t0 = i / 10, t1 = (i + 1) / 10;
    const w0 = 0.045 + Math.sin(t0 * Math.PI * 0.8) * 0.015, w1 = 0.045 + Math.sin(t1 * Math.PI * 0.8) * 0.015;
    const z0 = 0.09 + t0 * L, z1 = 0.09 + t1 * L;
    const yb0 = -0.08, yb1 = -0.08 + (i === 9 ? 0.04 : 0);
    m.quad([0.0015, yb0, z0], [0.0015, yb0 + w0, z0], [0.0015, yb1 + w1 - (i === 9 ? 0.03 : 0), z1], [0.0015, yb1, z1], C('#8E949C'), MAT.metal);
    m.quad([-0.0015, yb1, z1], [-0.0015, yb1 + w1 - (i === 9 ? 0.03 : 0), z1], [-0.0015, yb0 + w0, z0], [-0.0015, yb0, z0], C('#8E949C'), MAT.metal);
    m.quad([0.0016, yb0, z0], [0.0016, yb0 + 0.008, z0], [0.0016, yb1 + 0.008, z1], [0.0016, yb1, z1], C('#D8DCE2'), MAT.chrome);
  }
}
function fireAxe(m) {
  tube(m, [0, -0.1, -0.1], [0, 0.0, 0.62], 0.016, 0.018, 10, C('#C8A06A'), MAT.plastic, true);
  rb(m, 0, 0.0, 0.58, 0.012, 0.07, 0.035, C('#C2302A'), MAT.paint, 0.3);
  m.quad([0.006, -0.06, 0.6], [0.006, 0.06, 0.6], [0.006, 0.09, 0.7], [0.006, -0.09, 0.7], C('#C2302A'), MAT.paint);
  m.quad([-0.006, -0.09, 0.7], [-0.006, 0.09, 0.7], [-0.006, 0.06, 0.6], [-0.006, -0.06, 0.6], C('#C2302A'), MAT.paint);
  m.box(0, -0.09, 0.698, 0.014, 0.18, 0.012, C('#D8DCE2'), MAT.chrome);
  for (const s of [-1, 1]) tube(m, [0, 0.01, 0.56], [0, s * 0.0, 0.48], 0.014, 0.004, 6, C('#A8262A'), MAT.paint, false);
  for (let i = 0; i < 4; i++) m.box(0, -0.078 + i * 0.004, -0.04 + i * 0.03, 0.036, 0.022, 0.02, C('#2A2A2A'), MAT.matte);
}
function grenade(m) {
  sq(m, 0, 0.04, 0, 0.032, 0.042, 0.032, 0.9, 0.9, C('#4E5A3C'), MAT.paint, 14, 10, (i, j) => [((i + j) % 2 ? C('#4E5A3C') : C('#45503A')), MAT.paint]);
  for (let i = 0; i < 4; i++) m.smoothCyl(0, 0.02 + i * 0.016, 0, 0.0325 + (i === 1 || i === 2 ? 0.002 : 0), 0.003, 14, C('#3A4430'), MAT.paint, { cap: false });
  m.smoothCyl(0, 0.08, 0, 0.012, 0.02, 10, C('#8A8E94'), MAT.metal);
  tube(m, [0.008, 0.095, 0], [0.034, 0.06, 0.0], 0.005, 0.004, 5, C('#9A9EA4'), MAT.metal, false);
  tube(m, [0.034, 0.06, 0], [0.036, 0.0, 0.0], 0.0045, 0.004, 5, C('#9A9EA4'), MAT.metal, false);
  withT(m, rot(-0.016, 0.092, 0, 0, 0, Math.PI / 2), () => { for (let i = 0; i < 12; i++) { const a0 = (i / 12) * Math.PI * 2, a1 = ((i + 1) / 12) * Math.PI * 2; tube(m, [Math.cos(a0) * 0.014, 0, Math.sin(a0) * 0.014], [Math.cos(a1) * 0.014, 0, Math.sin(a1) * 0.014], 0.0018, 0.0018, 4, C('#C8CCD2'), MAT.metal, false); } });
}
function molotov(m) {
  const glass = C('#5E7A3A');
  m.revolve(0, 0, 0, [[0.001, 0], [0.034, 0.004], [0.036, 0.02], [0.036, 0.12], [0.03, 0.15], [0.014, 0.18], [0.0125, 0.24]], 18, glass, MAT.glass);
  m.revolve(0, 0, 0, [[0.03, 0.01], [0.031, 0.08]], 16, C('#B86A1E'), MAT.plastic);
  tube(m, [0, 0.235, 0], [0.004, 0.28, 0.004], 0.011, 0.008, 8, C('#E8E0CC'), MAT.matte, false);
  tube(m, [0.004, 0.28, 0.004], [0.03, 0.3, 0.01], 0.008, 0.005, 6, C('#D8CEB8'), MAT.matte, false);
  tube(m, [0.004, 0.27, 0.004], [-0.022, 0.25, 0.02], 0.007, 0.004, 6, C('#C8BEA8'), MAT.matte, false);
}

export const GUNS = {
  rifle: { name: 'Rifle', build: rifle, grip: { o: [0, -0.052, -0.028], a: [0, 0.949, 0.315], rg: 0.024 }, fore: { o: [0, 0.08, 0.32], a: [0, 0, 1], rg: 0.031, hint: [0, -1, 0] }, muzzle: [0, 0.082, 0.71] },
  shotgun: { name: 'Shotgun', build: shotgun, grip: { o: [0, -0.04, -0.054], a: [0, 0.913, 0.408], rg: 0.025 }, fore: { o: [0, 0.045, 0.41], a: [0, 0, 1], rg: 0.027, hint: [0, -1, 0] }, muzzle: [0, 0.076, 0.81] },
  pistol: { name: 'Pistol', build: pistol, grip: { o: [0, -0.033, -0.024], a: [0, 0.966, 0.257], rg: 0.02 }, fore: { o: [0.03, -0.045, -0.01], a: [0, 0.966, 0.257], rg: 0.026, hint: [0, 0, 1], cup: true }, muzzle: [0, 0.064, 0.16] },
  sniper: { name: 'Sniper', build: sniper, grip: { o: [0, -0.044, -0.046], a: [0, 0.94, 0.343], rg: 0.024 }, fore: { o: [0, 0.042, 0.31], a: [0, 0, 1], rg: 0.03, hint: [0, -1, 0] }, muzzle: [0, 0.085, 1.02] },
  smg: { name: 'SMG', build: smg, grip: { o: [0, -0.046, -0.026], a: [0, 0.955, 0.296], rg: 0.024 }, fore: { o: [0, -0.034, 0.2], a: [0, 1, 0], rg: 0.016, hint: [0, 0, 1], vert: true }, muzzle: [0, 0.07, 0.43] },
  bat: { name: 'Bat', build: bat, grip: { o: [0, -0.08, 0.02], a: [0, 0.2, 1], rg: 0.02, hint: [0, 1, 0] }, fore: { o: [0, -0.075, 0.12], a: [0, 0.2, 1], rg: 0.021, hint: [0, 1, 0] }, muzzle: [0, 0, 0.8] },
  machete: { name: 'Machete', build: machete, grip: { o: [0, -0.06, 0.0], a: [0, 0, 1], rg: 0.014, hint: [0, 1, 0] }, muzzle: [0, -0.05, 0.6] },
  axe: { name: 'Fire axe', build: fireAxe, grip: { o: [0, -0.07, 0.05], a: [0, 0.14, 1], rg: 0.018, hint: [0, 1, 0] }, muzzle: [0, 0, 0.7] },
  grenade: { name: 'Grenade', build: grenade },
  molotov: { name: 'Molotov', build: molotov },
};

export function magMesh(kind) {
  const m = new MeshBuilder();
  if (kind === 'rifle') rifleMag(m, C('#30333A'), C('#18191C'));
  else if (kind === 'smg') smgMag(m, C('#17181B'));
  else if (kind === 'sniper') rb(m, 0, -0.002, 0.1, 0.017, 0.03, 0.034, C('#1C1E22'), MAT.trim, 0.2);
  else if (kind === 'pistol') rb(m, 0, -0.04, -0.03, 0.012, 0.045, 0.018, C('#121316'), MAT.trim, 0.3);
  else { zc(m, 0, 0, 0, 0.0095, 0.06, 10, C('#C4302A'), MAT.plastic); zc(m, 0, 0, -0.012, 0.0098, 0.012, 10, C('#C9A458'), MAT.metal); }
  return m.build();
}
export function gunMesh(kind, o = {}) { const m = new MeshBuilder(); (GUNS[kind] || GUNS.rifle).build(m, o); return m.build(); }
export function buildGun(m, kind, o = {}) { (GUNS[kind] || GUNS.rifle).build(m, o); }

export function gripHand(m, F, rg, skin, glove, o = {}) {
  withT(m, F, () => {
    const R = rg + 0.0115;
    const sk = C(skin), gv = glove ? C(glove) : sk;
    const fingerCol = glove && !o.fingerless ? gv : sk;
    sq(m, -rg - 0.012, -0.002, -0.014, 0.0165, 0.05, 0.036, 0.72, 0.8, gv, MAT.matte, 10, 7);
    sq(m, -rg - 0.024, -0.02, -0.034, 0.021, 0.042, 0.03, 0.8, 0.85, gv, MAT.matte, 9, 6);
    const ys = [0.034, 0.011, -0.012, -0.034];
    ys.forEach((y, k) => {
      const fr = (k === 3 ? 0.0084 : 0.0098) * (o.big || 1);
      const degs = k === 0 && o.trigger ? [205, 160, 118, 85] : [205, 150, 102, 58];
      const pts = degs.map((d) => { const a = (d * Math.PI) / 180; const rr = R + (d < 120 ? 0.001 : 0); return [Math.cos(a) * rr, y + (k === 0 && o.trigger ? 0.006 : 0), Math.sin(a) * rr]; });
      ball(m, pts[0][0], pts[0][1], pts[0][2], fr * 1.08, gv, MAT.matte, 7);
      for (let i = 0; i < 3; i++) {
        const c = i === 0 ? gv : fingerCol;
        tube(m, pts[i], pts[i + 1], fr * (1 - i * 0.06), fr * (0.95 - i * 0.06), 7, c, MAT.matte, false);
        ball(m, pts[i + 1][0], pts[i + 1][1], pts[i + 1][2], fr * (0.96 - i * 0.07), c, MAT.matte, 7);
      }
    });
    const T = o.thumb || [[-R * 0.98, 0.04, -0.012], [-R * 0.45, 0.058, -R * 0.92], [R * 0.45, 0.056, -R * 0.9], [R * 0.95, 0.05, -R * 0.2]];
    for (let i = 0; i < 3; i++) { const c = i === 0 ? gv : o.fingerless ? sk : gv; tube(m, T[i], T[i + 1], 0.0118 - i * 0.0012, 0.0108 - i * 0.0012, 7, c, MAT.matte, false); ball(m, T[i + 1][0], T[i + 1][1], T[i + 1][2], 0.0106 - i * 0.0012, c, MAT.matte, 7); }
  });
}

export function handFrames(kind, G) {
  const g = GUNS[kind] || GUNS.rifle;
  const out = {};
  const tr = (p) => { const r = m4.apply(G, p[0], p[1], p[2]); return [r[0], r[1], r[2]]; };
  const td = (d) => nrm([G[0] * d[0] + G[4] * d[1] + G[8] * d[2], G[1] * d[0] + G[5] * d[1] + G[9] * d[2], G[2] * d[0] + G[6] * d[1] + G[10] * d[2]]);
  if (g.grip) {
    const o = tr(g.grip.o), a = td(g.grip.a), h = td(g.grip.hint || [0, 0, 1]);
    const F = frameAt(o, a, h);
    const W = m4.apply(F, -g.grip.rg - 0.034, -0.045, -0.05);
    out.right = { F, rg: g.grip.rg, wrist: [W[0], W[1], W[2]] };
  }
  if (g.fore) {
    const o = tr(g.fore.o), a = td(g.fore.a), h = td(g.fore.hint || [0, 0, 1]);
    const F = frameAt(o, a, h, true);
    const W = g.fore.cup ? m4.apply(F, -g.fore.rg - 0.03, -0.05, -0.04) : g.fore.vert ? m4.apply(F, -g.fore.rg - 0.03, -0.045, -0.045) : m4.apply(F, -g.fore.rg - 0.028, -0.07, -0.012);
    out.left = { F, rg: g.fore.rg, wrist: [W[0], W[1], W[2]] };
  }
  return out;
}

export function ammoCan(m, x, y, z, yaw, label) {
  withT(m, rot(x, y, z, yaw), () => {
    rb(m, 0, 0.09, 0, 0.14, 0.09, 0.055, C('#4E5A3C'), MAT.paint, 0.18);
    m.box(0, 0.18, 0, 0.29, 0.02, 0.118, C('#45503A'), MAT.paint);
    tube(m, [-0.06, 0.2, 0], [-0.04, 0.23, 0], 0.006, 0.006, 5, C('#3A3E36'), MAT.metal, false);
    tube(m, [-0.04, 0.23, 0], [0.04, 0.23, 0], 0.006, 0.006, 5, C('#3A3E36'), MAT.metal, false);
    tube(m, [0.04, 0.23, 0], [0.06, 0.2, 0], 0.006, 0.006, 5, C('#3A3E36'), MAT.metal, false);
    m.box(0.12, 0.13, 0, 0.03, 0.05, 0.12, C('#3A4430'), MAT.paint);
    if (label) label(m);
  });
}
export function shellBox(m, x, y, z, yaw) {
  withT(m, rot(x, y, z, yaw), () => {
    m.box(0, 0, 0, 0.12, 0.06, 0.08, C('#C8302A'), MAT.matte);
    m.box(0, 0.06, 0, 0.12, 0.004, 0.08, C('#E8E0CC'), MAT.matte);
    for (let i = 0; i < 3; i++) withT(m, rot(0.08 + i * 0.022, 0.01, 0.06 + (i % 2) * 0.02, 0.4 * i, Math.PI / 2), () => { m.smoothCyl(0, -0.03, 0, 0.0098, 0.05, 8, C('#C4302A'), MAT.plastic); m.smoothCyl(0, -0.04, 0, 0.0102, 0.012, 8, C('#C9A458'), MAT.metal); });
  });
}
export function medkit(m, x, y, z, yaw) {
  withT(m, rot(x, y, z, yaw), () => {
    rb(m, 0, 0.055, 0, 0.11, 0.055, 0.07, C('#CFCBC0'), MAT.plastic, 0.3);
    m.box(0, 0.1, 0, 0.226, 0.008, 0.012, C('#3E9E5E'), MAT.plastic);
    m.box(0, 0.109, 0, 0.05, 0.004, 0.014, C('#F6F6F2'), MAT.flat);
    m.box(0, 0.109, 0, 0.014, 0.004, 0.05, C('#F6F6F2'), MAT.flat);
    for (const s of [-1, 1]) m.box(s * 0.08, 0.098, 0.0, 0.02, 0.02, 0.15, C('#3A3A3E'), MAT.trim);
  });
}
