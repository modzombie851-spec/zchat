import { MeshBuilder } from './race3d.js';

const OLIVE = [0.34, 0.36, 0.22], KHAKI = [0.56, 0.51, 0.36], LINE = [0.16, 0.15, 0.13], STRAP = [0.2, 0.22, 0.15];
const hsh = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };

export const CHUTE = { lines: 5.4, rise: 0.95 };

export function chuteMesh() {
  const m = new MeshBuilder();
  const G = 14, SUB = 3, ROWS = 8, R = 3.5, DOME = 2.1, rimY = CHUTE.lines + CHUTE.rise, TH = (78 * Math.PI) / 180;
  const pt = (gi, f, v) => {
    const a = ((gi + f) / G) * Math.PI * 2;
    const th = 0.06 + v * (TH - 0.06);
    let r = (R * Math.sin(th)) / Math.sin(TH);
    r *= 1 + 0.075 * Math.sin(Math.PI * f) * (0.25 + 0.75 * v);
    const y = rimY + ((Math.cos(th) - Math.cos(TH)) / (1 - Math.cos(TH))) * DOME + (v > 0.97 ? 0.22 * Math.sin(Math.PI * f) : 0);
    return [Math.cos(a) * r, y, Math.sin(a) * r];
  };
  for (let gi = 0; gi < G; gi++) {
    const base = gi % 2 ? KHAKI : OLIVE;
    for (let s = 0; s < SUB; s++) {
      for (let row = 0; row < ROWS; row++) {
        const f0 = s / SUB, f1 = (s + 1) / SUB, v0 = row / ROWS, v1 = (row + 1) / ROWS;
        const a = pt(gi, f0, v0), b = pt(gi, f1, v0), c = pt(gi, f1, v1), d = pt(gi, f0, v1);
        const k = 0.9 + 0.1 * hsh(gi * 7 + s, row) - 0.06 * v1;
        const col = [base[0] * k, base[1] * k, base[2] * k], inner = [base[0] * k * 0.62, base[1] * k * 0.62, base[2] * k * 0.62];
        m.quad(a, d, c, b, col);
        m.quad(a, b, c, d, inner);
      }
    }
  }
  const hub = [0, CHUTE.rise, 0];
  const strand = (p, q, w, col) => {
    const dx = q[0] - p[0], dy = q[1] - p[1], dz = q[2] - p[2], L = Math.hypot(dx, dy, dz) || 1;
    let sx = -dz / L, sz = dx / L;
    const sl = Math.hypot(sx, sz) || 1; sx /= sl; sz /= sl;
    const ux = sx * w, uz = sz * w;
    m.quad([p[0] - ux, p[1], p[2] - uz], [p[0] + ux, p[1], p[2] + uz], [q[0] + ux, q[1], q[2] + uz], [q[0] - ux, q[1], q[2] - uz], col);
    m.quad([p[0] + ux, p[1], p[2] + uz], [p[0] - ux, p[1], p[2] - uz], [q[0] - ux, q[1], q[2] - uz], [q[0] + ux, q[1], q[2] + uz], col);
    m.quad([p[0], p[1] - w, p[2]], [p[0], p[1] + w, p[2]], [q[0], q[1] + w, q[2]], [q[0], q[1] - w, q[2]], col);
    m.quad([p[0], p[1] + w, p[2]], [p[0], p[1] - w, p[2]], [q[0], q[1] - w, q[2]], [q[0], q[1] + w, q[2]], col);
  };
  for (let gi = 0; gi < G; gi++) strand(pt(gi, 0, 1), hub, 0.014, LINE);
  for (const [x, z] of [[1.18, 0.62], [-1.18, 0.62], [1.18, -0.62], [-1.18, -0.62]]) strand(hub, [x, 0.02, z], 0.03, STRAP);
  return m.build();
}
