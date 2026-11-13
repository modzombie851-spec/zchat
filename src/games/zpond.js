import { POND, FALL, pondR, pondDepth } from './ztown.js';

export const FALL_HIT = [FALL.x + 1.48, FALL.z];

function surface() {
  const R = [0, 0.15, 0.3, 0.45, 0.6, 0.72, 0.8, 0.86, 0.9, 0.94, 0.98, 1.02], N = 96, ring = [];
  for (let i = 0; i < R.length; i++) {
    const row = [];
    for (let j = 0; j < N; j++) {
      const a = (j / N) * Math.PI * 2, r = R[i] * pondR(a);
      const x = POND.x + Math.cos(a) * POND.rx * r, z = POND.z + Math.sin(a) * POND.rz * r;
      const dep = Math.max(0, POND.y - pondDepth(x, z));
      row.push([x, POND.y, z, 1 - Math.max(0, Math.min(1, (R[i] - 0.84) / 0.16)) * 0.55, Math.min(1, dep / 0.95)]);
    }
    ring.push(row);
  }
  const out = [];
  const put = (v) => out.push(v[0], v[1], v[2], v[3], v[4]);
  for (let i = 0; i < R.length - 1; i++) for (let j = 0; j < N; j++) {
    const a = ring[i][j], b = ring[i][(j + 1) % N], c = ring[i + 1][j], d = ring[i + 1][(j + 1) % N];
    put(a); put(c); put(b); put(b); put(c); put(d);
  }
  return new Float32Array(out);
}

function sheet(off, wide, push) {
  const NU = 8, NV = 22, pts = [];
  for (let iv = 0; iv <= NV; iv++) {
    const v = iv / NV, row = [];
    for (let iu = 0; iu <= NU; iu++) {
      const u = iu / NU;
      const x = FALL.x + 0.16 + off + push * Math.pow(v, 1.6) + 0.12 * v;
      const y = POND.y + 0.01 + (FALL.top - POND.y) * (1 - Math.pow(v, 1.25));
      const z = FALL.z + (u - 0.5) * FALL.w * wide * (1 + 0.28 * v) + Math.sin(u * 9.0 + v * 2.0) * 0.03;
      row.push([x, y, z, u, v]);
    }
    pts.push(row);
  }
  const out = [];
  const put = (q) => out.push(q[0], q[1], q[2], q[3], q[4]);
  for (let iv = 0; iv < NV; iv++) for (let iu = 0; iu < NU; iu++) {
    const a = pts[iv][iu], b = pts[iv][iu + 1], c = pts[iv + 1][iu], d = pts[iv + 1][iu + 1];
    put(a); put(c); put(b); put(b); put(c); put(d);
  }
  return out;
}

export function pondItems(R) {
  if (!R.wmesh) return [];
  const r = Math.max(POND.rx, POND.rz) * 1.15;
  const imp = [FALL_HIT[0], FALL_HIT[1], 1];
  return [
    { mesh: R.wmesh(new Float32Array(sheet(-0.06, 0.8, 1.05))), water: 1, cast: false, bs: [FALL.x + 0.8, FALL.top * 0.5, FALL.z, 2.8], kind: 'pond', imp, deep: [0.02, 0.05, 0.05], shal: [0.16, 0.22, 0.2] },
    { mesh: R.wmesh(new Float32Array(sheet(0.02, 1.0, 1.25))), water: 1, cast: false, bs: [FALL.x + 0.8, FALL.top * 0.5, FALL.z, 2.8], kind: 'pond', imp, deep: [0.02, 0.05, 0.05], shal: [0.16, 0.22, 0.2] },
    { mesh: R.wmesh(surface()), water: 0, cast: false, bs: [POND.x, POND.y, POND.z, r], kind: 'pond', imp, deep: [0.008, 0.016, 0.012], shal: [0.05, 0.062, 0.04] },
  ];
}

export function pondParts(parts, t, near) {
  if (near > 80) return;
  const bx = FALL_HIT[0], bz = FALL_HIT[1], by = POND.y + 0.05;
  for (let i = 0; i < 10; i++) {
    const s0 = (i / 10 + t * 0.42) % 1;
    const a = i * 2.4;
    parts.push({ x: bx + Math.cos(a) * 0.45 * (0.4 + s0) + s0 * 0.3, y: by + 0.1 + s0 * 1.3, z: bz + Math.sin(a) * 0.75 * (0.4 + s0), size: 0.6 + s0 * 1.3, alpha: 0.3 * (1 - s0) * Math.min(1, s0 * 6), type: 18, seed: (i * 0.13) % 1 });
  }
  for (let i = 0; i < 8; i++) {
    const s0 = (i / 8 + t * 0.9) % 1;
    parts.push({ x: bx + s0 * 0.5 - 0.15, y: by + 0.03 + s0 * 0.25, z: bz + (i - 3.5) * 0.2, size: 0.28 + s0 * 0.45, alpha: 0.55 * (1 - s0), type: 18, seed: (i * 0.29) % 1 });
  }
}
