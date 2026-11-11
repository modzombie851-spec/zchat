import { MeshBuilder, hexRgb } from './race3d.js';

const shade = (c, k) => { const a = typeof c === 'string' ? hexRgb(c) : c; return k < 0 ? a.map((v) => v * (1 + k)) : a.map((v) => v + (1 - v) * k); };
const GLASS = '#1E2A38';
const TIRE = '#1C1D21';
const RIM = '#C9CED6';

function hull(mb, st, col, mat) {
  const side = shade(col, -0.06), lower = shade(col, -0.32);
  for (let i = 0; i < st.length - 1; i++) {
    const a = st[i], b = st[i + 1];
    for (const sg of [-1, 1]) {
      const ab = [sg * a.wb, a.b, a.z], at = [sg * a.w, a.t, a.z], bb = [sg * b.wb, b.b, b.z], bt = [sg * b.w, b.t, b.z];
      const am = [sg * (a.wb + 0.02), a.b + (a.t - a.b) * 0.35, a.z], bm = [sg * (b.wb + 0.02), b.b + (b.t - b.b) * 0.35, b.z];
      mb.quad(ab, bb, bm, am, lower, 0.2);
      mb.quad(am, bm, bt, at, side, mat);
    }
    mb.quad([-a.w, a.t, a.z], [a.w, a.t, a.z], [b.w, b.t, b.z], [-b.w, b.t, b.z], col, mat);
    mb.quad([-a.wb, a.b, a.z], [-b.wb, b.b, b.z], [b.wb, b.b, b.z], [a.wb, a.b, a.z], '#202226', 0);
  }
  const f = st[st.length - 1], r = st[0];
  mb.quad([-f.wb, f.b, f.z], [f.wb, f.b, f.z], [f.w, f.t, f.z], [-f.w, f.t, f.z], shade(col, -0.12), mat);
  mb.quad([r.wb, r.b, r.z], [-r.wb, r.b, r.z], [-r.w, r.t, r.z], [r.w, r.t, r.z], shade(col, -0.12), mat);
}
function cabin(mb, c, col, mat) {
  const { z0, z1, r0, r1, by0, by1, bw, rw, ry } = c;
  const roof = col;
  const B = (sg, z, y) => [sg * bw, y, z], Rr = (sg, z) => [sg * rw, ry, z];
  mb.quad(B(-1, z1, by1), B(1, z1, by1), Rr(1, r1), Rr(-1, r1), GLASS, 0.9);
  if (c.pillar) {
    const k = c.pillar;
    const g0 = (sg) => [sg * bw * k, by0, z0], g1 = (sg) => [sg * rw * (k + (1 - k) * 0.4), ry, r0];
    mb.quad(g0(1), g0(-1), g1(-1), g1(1), GLASS, 0.9);
    for (const sg of [-1, 1]) mb.quad(sg > 0 ? B(1, z0, by0) : g0(-1), sg > 0 ? g0(1) : B(-1, z0, by0), sg > 0 ? g1(1) : Rr(-1, r0), sg > 0 ? Rr(1, r0) : g1(-1), shade(col, -0.05), mat);
  } else mb.quad(B(1, z0, by0), B(-1, z0, by0), Rr(-1, r0), Rr(1, r0), GLASS, 0.9);
  mb.quad(Rr(-1, r0), Rr(-1, r1), Rr(1, r1), Rr(1, r0), roof, mat);
  for (const sg of [-1, 1]) {
    const p0 = B(sg, z0, by0), p1 = B(sg, z1, by1), q0 = Rr(sg, r0), q1 = Rr(sg, r1);
    mb.quad(p0, p1, q1, q0, GLASS, 0.9);
    const pil = 0.07;
    mb.quad(p1, [p1[0], p1[1], p1[2] - pil], [q1[0], q1[1], q1[2] - pil * 0.6], q1, shade(col, -0.2), mat);
    mb.quad([p0[0], p0[1], p0[2] + pil], p0, q0, [q0[0], q0[1], q0[2] + pil * 0.6], shade(col, -0.2), mat);
  }
}
function lights(mb, z, y, xs, w, h, col, sg = 1) {
  for (const x of xs) mb.box(x, y, z, w, h, 0.05 * sg, col, 1);
}

export function carMesh(type, color) {
  const mb = new MeshBuilder();
  const col = typeof color === 'string' ? hexRgb(color) : color;
  if (type === 'tuktuk') return tuktuk(mb, col);
  if (type === 'sport') {
    const st = [
      { z: -2.22, wb: 0.76, w: 0.68, b: 0.34, t: 0.64 }, { z: -2.06, wb: 0.92, w: 0.88, b: 0.28, t: 0.75 }, { z: -1.62, wb: 1.0, w: 0.99, b: 0.26, t: 0.8 },
      { z: -1.05, wb: 0.97, w: 0.94, b: 0.26, t: 0.8 }, { z: 0.1, wb: 0.94, w: 0.91, b: 0.26, t: 0.76 }, { z: 0.95, wb: 0.99, w: 0.97, b: 0.26, t: 0.69 },
      { z: 1.6, wb: 0.96, w: 0.92, b: 0.27, t: 0.61 }, { z: 2.06, wb: 0.85, w: 0.79, b: 0.3, t: 0.52 }, { z: 2.26, wb: 0.7, w: 0.6, b: 0.34, t: 0.44 },
    ];
    hull(mb, st, col, 0.85);
    cabin(mb, { z0: -1.3, z1: 0.98, r0: -0.62, r1: 0.18, by0: 0.8, by1: 0.71, bw: 0.83, rw: 0.62, ry: 1.12, pillar: 0.62 }, col, 0.85);
    lights(mb, 2.14, 0.47, [-0.58, 0.58], 0.44, 0.08, '#FFF4D6');
    mb.box(0, 0.62, -2.235, 1.24, 0.05, 0.04, '#FF2D2D', 1);
    lights(mb, -2.22, 0.58, [-0.5, 0.5], 0.34, 0.1, '#FF2D2D');
    mb.box(0, 0.3, 2.24, 1.1, 0.06, 0.12, '#17181B', 0.2);
    mb.box(0, 0.36, 2.2, 0.82, 0.08, 0.05, '#1B1D21', 0.2);
    mb.box(0, 0.3, -2.2, 1.2, 0.12, 0.1, '#17181B', 0.2);
    for (const sg of [-1, 1]) { mb.cyl(sg * 0.42, 0.36, -2.25, 0.07, 0.01, 6, '#2A2C31', 0.4); mb.box(sg * 0.42, 0.31, -2.24, 0.16, 0.1, 0.06, '#9AA1AA', 0.6); }
    for (const sg of [-1, 1]) mb.box(sg * 0.5, 0.79, -1.98, 0.06, 0.16, 0.08, '#24262B', 0.3);
    mb.box(0, 0.94, -2.02, 1.7, 0.045, 0.3, shade(col, -0.18), 0.85);
    for (const sg of [-1, 1]) mb.box(sg * 0.69, 0.92, -2.02, 0.04, 0.12, 0.34, '#1B1D21', 0.3);
    for (const sg of [-1, 1]) mb.box(sg * 0.97, 0.26, 0, 0.05, 0.12, 2.2, '#17181B', 0.2);
    for (const sg of [-1, 1]) mb.box(sg * 0.95, 0.8, 0.78, 0.13, 0.09, 0.16, shade(col, -0.1), 0.7);
    mb.box(0, 0.701, 1.35, 0.5, 0.012, 1.1, shade(col, -0.25), 0.85);
    for (const sg of [-1, 1]) for (const z of [-1.38, 1.3]) mb.wheel(sg * 0.87, 0.35, z, 0.35, 0.3, 14, TIRE, RIM);
  } else if (type === 'hatch') {
    const st = [
      { z: -1.85, wb: 0.84, w: 0.82, b: 0.3, t: 0.9 }, { z: -1.6, wb: 0.9, w: 0.9, b: 0.28, t: 0.96 }, { z: -0.6, wb: 0.92, w: 0.92, b: 0.28, t: 0.96 },
      { z: 0.6, wb: 0.92, w: 0.92, b: 0.28, t: 0.92 }, { z: 1.4, wb: 0.9, w: 0.88, b: 0.3, t: 0.82 }, { z: 1.85, wb: 0.8, w: 0.76, b: 0.34, t: 0.66 },
    ];
    hull(mb, st, col, 0.6);
    cabin(mb, { z0: -1.78, z1: 0.75, r0: -1.66, r1: -0.05, by0: 0.96, by1: 0.92, bw: 0.86, rw: 0.76, ry: 1.52 }, col, 0.6);
    lights(mb, 1.8, 0.62, [-0.56, 0.56], 0.36, 0.14, '#FFF4D6');
    lights(mb, -1.87, 0.78, [-0.62, 0.62], 0.2, 0.26, '#FF2D2D');
    mb.box(0, 0.36, 1.86, 0.8, 0.14, 0.06, '#1B1D21', 0.2);
    for (const sg of [-1, 1]) mb.box(sg * 0.95, 1.0, 0.62, 0.12, 0.1, 0.16, shade(col, -0.1), 0.6);
    mb.box(0, 1.53, -0.8, 1.2, 0.05, 1.4, '#2A2C31', 0.3);
    for (const sg of [-1, 1]) for (const z of [-1.18, 1.18]) mb.wheel(sg * 0.84, 0.34, z, 0.34, 0.26, 12, TIRE, RIM);
  } else {
    const st = [
      { z: -1.95, wb: 0.9, w: 0.9, b: 0.55, t: 1.12 }, { z: -1.8, wb: 0.96, w: 0.96, b: 0.52, t: 1.16 }, { z: 0.9, wb: 0.96, w: 0.96, b: 0.52, t: 1.16 },
      { z: 1.7, wb: 0.96, w: 0.94, b: 0.55, t: 1.06 }, { z: 2.0, wb: 0.92, w: 0.9, b: 0.6, t: 1.0 },
    ];
    hull(mb, st, col, 0.35);
    cabin(mb, { z0: -1.6, z1: 0.7, r0: -1.55, r1: 0.4, by0: 1.16, by1: 1.16, bw: 0.9, rw: 0.88, ry: 1.82 }, col, 0.35);
    lights(mb, 2.02, 0.86, [-0.6, 0.6], 0.26, 0.26, '#FFF4D6');
    lights(mb, -1.97, 0.95, [-0.72, 0.72], 0.16, 0.3, '#FF2D2D');
    mb.box(0, 0.5, 2.05, 1.9, 0.16, 0.16, '#2A2C31', 0.3);
    mb.box(0, 0.86, 2.02, 0.7, 0.3, 0.05, '#1B1D21', 0.2);
    mb.box(0, 1.84, -0.6, 1.7, 0.08, 1.9, '#2A2C31', 0.3);
    for (const sg of [-1, 1]) mb.box(sg * 0.8, 1.88, -0.6, 0.06, 0.12, 1.9, '#2A2C31', 0.3);
    mb.wheel(0, 1.1, -2.12, 0.42, 0.26, 12, TIRE, RIM);
    for (const sg of [-1, 1]) for (const z of [-1.25, 1.3]) mb.wheel(sg * 0.9, 0.46, z, 0.46, 0.36, 12, TIRE, RIM);
  }
  return mb.build();
}

function tuktuk(mb, col) {
  const canopy = '#1F2126';
  mb.box(0, 0.32, -0.55, 1.36, 0.42, 1.5, col, 0.6);
  mb.box(0, 0.32, 0.55, 0.98, 0.38, 0.9, col, 0.6);
  mb.quad([-0.5, 0.7, 1.0], [0.5, 0.7, 1.0], [0.4, 0.42, 1.38], [-0.4, 0.42, 1.38], col, 0.6);
  mb.quad([-0.5, 0.7, 1.0], [-0.4, 0.42, 1.38], [-0.45, 0.32, 1.32], [-0.5, 0.32, 1.0], shade(col, -0.1), 0.6);
  mb.quad([0.5, 0.7, 1.0], [0.5, 0.32, 1.0], [0.45, 0.32, 1.32], [0.4, 0.42, 1.38], shade(col, -0.1), 0.6);
  mb.quad([-0.5, 0.7, 0.98], [-0.5, 1.5, 0.9], [0.5, 1.5, 0.9], [0.5, 0.7, 0.98], GLASS, 0.9);
  for (const sg of [-1, 1]) {
    mb.box(sg * 0.6, 0.7, 0.95, 0.06, 1.0, 0.06, canopy, 0.2);
    mb.box(sg * 0.62, 0.74, -1.25, 0.06, 0.96, 0.06, canopy, 0.2);
  }
  const R = 0.72, cz = -0.15, cy = 1.62;
  for (let k = 0; k < 8; k++) {
    const a0 = Math.PI * (k / 8), a1 = Math.PI * ((k + 1) / 8);
    const x0 = Math.cos(a0) * R, y0 = Math.sin(a0) * 0.22, x1 = Math.cos(a1) * R, y1 = Math.sin(a1) * 0.22;
    mb.quad([x0, cy + y0, -1.32], [x0, cy + y0, 1.0], [x1, cy + y1, 1.0], [x1, cy + y1, -1.32], canopy, 0.2);
  }
  mb.quad([-R, cy, 1.0], [R, cy, 1.0], [R * 0.9, cy - 0.12, 1.06], [-R * 0.9, cy - 0.12, 1.06], canopy, 0.2);
  mb.box(0, cy - 0.1, cz - 1.17, 1.44, 0.1, 0.06, shade(col, 0.15), 0.4);
  mb.box(0, 0.74, -0.85, 1.2, 0.36, 0.5, '#3A2A24', 0.1);
  mb.box(0, 0.74, -0.62, 1.2, 0.08, 0.06, '#3A2A24', 0.1);
  mb.box(0, 0.86, 0.45, 0.4, 0.3, 0.4, '#3A2A24', 0.1);
  mb.box(0, 1.25, 0.82, 0.9, 0.05, 0.05, '#C9CED6', 0.5);
  lights(mb, 1.39, 0.56, [0], 0.24, 0.14, '#FFF4D6');
  lights(mb, -1.31, 0.5, [-0.55, 0.55], 0.18, 0.12, '#FF2D2D');
  mb.wheel(0, 0.3, 1.12, 0.3, 0.22, 12, TIRE, RIM);
  for (const sg of [-1, 1]) mb.wheel(sg * 0.72, 0.3, -0.8, 0.3, 0.22, 12, TIRE, RIM);
  return mb.build();
}
