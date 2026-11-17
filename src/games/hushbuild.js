import { m4 } from './race3d.js';
import { EDGE, WALL_H, DOOR_W } from './hushlevel.js';

export const LAY = { walls: 0, doorway: 1, floor: 2, ceiling: 3, door: 4, bed: 5, wood: 6, locker: 7, lamp: 8, exit: 9, ivbag: 10, ivpole: 11, magazine: 12, wheelchair: 13, window: 14, flashlight: 15, key: 16, knife: 17, lock: 18, radio: 19 };

export function parseGeo(buf) {
  const dv = new DataView(buf);
  if (dv.getUint32(0, true) !== 0x48535548) throw new Error('bad geo');
  const n = dv.getUint32(8, true), nv = dv.getUint32(12, true);
  const ENT = 64, HEAD = 16;
  const vOff = HEAD + n * ENT;
  const iOff = vOff + nv * 24;
  const pieces = {};
  for (let i = 0; i < n; i++) {
    const o = HEAD + i * ENT;
    let name = '';
    for (let k = 0; k < 16; k++) { const c = dv.getUint8(o + k); if (c) name += String.fromCharCode(c); }
    const vs = dv.getUint32(o + 16, true), vc = dv.getUint32(o + 20, true), is = dv.getUint32(o + 24, true), ic = dv.getUint32(o + 28, true);
    const mn = [dv.getFloat32(o + 32, true), dv.getFloat32(o + 36, true), dv.getFloat32(o + 40, true)];
    const mx = [dv.getFloat32(o + 44, true), dv.getFloat32(o + 48, true), dv.getFloat32(o + 52, true)];
    pieces[name] = { name, v: new Uint8Array(buf, vOff + vs * 24, vc * 24), vf: new Float32Array(buf.slice(vOff + vs * 24, vOff + (vs + vc) * 24)), vc, idx: new Uint16Array(buf.slice(iOff + is * 2, iOff + (is + ic) * 2)), mn, mx };
  }
  return pieces;
}

class Batch {
  constructor() { this.f = []; this.v = 0; this.parts = []; this.min = [1e9, 1e9, 1e9]; this.max = [-1e9, -1e9, -1e9]; }
  add(pc, M, opt = {}) {
    const vc = pc.vc, src = pc.vf, bytes = pc.v;
    const out = new Float32Array(vc * 6);
    const o8 = new Int8Array(out.buffer), u8 = new Uint8Array(out.buffer);
    const lay = opt.layer;
    const nsx = opt.nscale ? opt.nscale : null;
    for (let i = 0; i < vc; i++) {
      const x = src[i * 6], y = src[i * 6 + 1], z = src[i * 6 + 2];
      const px = M[0] * x + M[4] * y + M[8] * z + M[12], py = M[1] * x + M[5] * y + M[9] * z + M[13], pz = M[2] * x + M[6] * y + M[10] * z + M[14];
      out[i * 6] = px; out[i * 6 + 1] = py; out[i * 6 + 2] = pz;
      out[i * 6 + 3] = src[i * 6 + 3]; out[i * 6 + 4] = src[i * 6 + 4];
      let nx = (bytes[i * 24 + 20] << 24 >> 24) / 127, ny = (bytes[i * 24 + 21] << 24 >> 24) / 127, nz = (bytes[i * 24 + 22] << 24 >> 24) / 127;
      if (nsx) { nx /= nsx[0]; ny /= nsx[1]; nz /= nsx[2]; }
      let tx = M[0] * nx + M[4] * ny + M[8] * nz, ty = M[1] * nx + M[5] * ny + M[9] * nz, tz = M[2] * nx + M[6] * ny + M[10] * nz;
      const l = Math.hypot(tx, ty, tz) || 1;
      o8[i * 24 + 20] = Math.round(tx / l * 127); o8[i * 24 + 21] = Math.round(ty / l * 127); o8[i * 24 + 22] = Math.round(tz / l * 127);
      u8[i * 24 + 23] = lay != null ? lay : bytes[i * 24 + 23];
      if (px < this.min[0]) this.min[0] = px; if (py < this.min[1]) this.min[1] = py; if (pz < this.min[2]) this.min[2] = pz;
      if (px > this.max[0]) this.max[0] = px; if (py > this.max[1]) this.max[1] = py; if (pz > this.max[2]) this.max[2] = pz;
    }
    const det = M[0] * (M[5] * M[10] - M[6] * M[9]) - M[4] * (M[1] * M[10] - M[2] * M[9]) + M[8] * (M[1] * M[6] - M[2] * M[5]);
    this.parts.push({ out, idx: pc.idx, base: this.v, flip: det < 0 });
    this.v += vc;
  }
  build(R) {
    if (!this.v) return null;
    const vb = new Float32Array(this.v * 6);
    const lay = new Uint8Array(vb.buffer);
    let n = 0;
    for (const p of this.parts) n += p.idx.length;
    const big = this.v > 65535;
    const A = big ? new Uint32Array(n) : new Uint16Array(n), B = big ? new Uint32Array(n) : new Uint16Array(n);
    let a = 0, b = 0;
    for (const p of this.parts) vb.set(p.out, p.base * 6);
    for (const p of this.parts) {
      const I = p.idx;
      for (let i = 0; i < I.length; i += 3) {
        const i0 = I[i] + p.base, i1 = (p.flip ? I[i + 2] : I[i + 1]) + p.base, i2 = (p.flip ? I[i + 1] : I[i + 2]) + p.base;
        if (lay[i0 * 24 + 23] < SMALL0) { A[a++] = i0; A[a++] = i1; A[a++] = i2; } else { B[b++] = i0; B[b++] = i1; B[b++] = i2; }
      }
    }
    const ib = big ? new Uint32Array(a + b) : new Uint16Array(a + b);
    ib.set(A.subarray(0, a), 0); ib.set(B.subarray(0, b), a);
    const c = [(this.min[0] + this.max[0]) / 2, (this.min[1] + this.max[1]) / 2, (this.min[2] + this.max[2]) / 2];
    const r = Math.hypot(this.max[0] - c[0], this.max[1] - c[1], this.max[2] - c[2]);
    return { mesh: R.staticMesh(vb, ib), c, r, tris: n / 3, nBig: a, nSmall: b };
  }
}

export const SMALL0 = 8;
export function meshItems(m, extra) {
  if (!m) return [];
  const out = [];
  if (m.nBig) out.push({ mesh: m.mesh, c: m.c, r: m.r, grp: 0, first: 0, count: m.nBig, ...extra });
  if (m.nSmall) out.push({ mesh: m.mesh, c: m.c, r: m.r, grp: 1, first: m.nBig, count: m.nSmall, ...extra });
  return out;
}

function sc(M, sx, sy, sz) {
  const o = M.slice();
  o[0] *= sx; o[1] *= sx; o[2] *= sx; o[4] *= sy; o[5] *= sy; o[6] *= sy; o[8] *= sz; o[9] *= sz; o[10] *= sz;
  return o;
}

export function doorMatrix(d, open) {
  const half = DOOR_W / 2;
  const hingeOff = -d.flip * half;
  const hx = d.h ? d.x + hingeOff : d.x, hz = d.h ? d.z : d.z + hingeOff;
  const yaw0 = (d.h ? 0 : -Math.PI / 2) + (d.flip < 0 ? Math.PI : 0);
  const dirx = -Math.sin(yaw0), dirz = -Math.cos(yaw0);
  const nx = d.h ? 0 : 1, nz = d.h ? 1 : 0;
  const sgn = Math.sign(dirx * nx + dirz * nz) || 1;
  const yaw = yaw0 + sgn * d.side * open * 1.62;
  const M = m4.pose(hx, 0, hz, yaw);
  return sc(M, DOOR_W, 1.0, 1.0);
}

export function doorLeafBox(d, open) {
  if (open > 0.55) return null;
  const T = 0.09;
  return d.h ? [d.x - DOOR_W / 2, d.z - T, d.x + DOOR_W / 2, d.z + T, 0, 0, 1] : [d.x - T, d.z - DOOR_W / 2, d.x + T, d.z + DOOR_W / 2, 0, 0, 1];
}

export function buildWorld(R, lv, G, opt = {}) {
  const CH = 4;
  const cw = Math.ceil(lv.W / CH), chh = Math.ceil(lv.H / CH);
  const batches = Array.from({ length: cw * chh }, () => new Batch());
  const bAt = (x, z) => batches[Math.min(chh - 1, Math.max(0, Math.floor(z / (CH * 2)))) * cw + Math.min(cw - 1, Math.max(0, Math.floor(x / (CH * 2))))];
  const put = (name, M, x, z, o) => { const pc = G[name]; if (!pc) return; bAt(x, z).add(pc, M, o); };
  const { W, H, reg, hE, vE } = lv;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const r = reg[y * W + x];
    const px = x * 2 + 1, pz = y * 2 + 1;
    const fl = r === 0 ? 'floor2' : 'floor1';
    put(fl, m4.pose(px, 0, pz, ((x * 7 + y * 3) & 3) * Math.PI / 2), px, pz);
    put('ceil', m4.pose(px, WALL_H, pz, ((x * 5 + y) & 3) * Math.PI / 2), px, pz);
  }
  for (let y = 0; y <= H; y++) for (let x = 0; x < W; x++) {
    const e = hE[y * W + x];
    const px = x * 2 + 1, pz = y * 2;
    if (e === EDGE.WALL) put('wall', m4.pose(px, 0, pz, 0), px, pz);
    else if (e === EDGE.DOOR) put('doorway', m4.pose(px, 0, pz, 0), px, pz);
    else if (e === EDGE.WINDOW) put('window', m4.pose(px, 0, pz, y === 0 ? Math.PI : 0), px, pz);
  }
  for (let y = 0; y < H; y++) for (let x = 0; x <= W; x++) {
    const e = vE[y * (W + 1) + x];
    const px = x * 2, pz = y * 2 + 1;
    if (e === EDGE.WALL) put('wall', m4.pose(px, 0, pz, Math.PI / 2), px, pz);
    else if (e === EDGE.DOOR) put('doorway', m4.pose(px, 0, pz, Math.PI / 2), px, pz);
    else if (e === EDGE.WINDOW) put('window', m4.pose(px, 0, pz, x === 0 ? -Math.PI / 2 : Math.PI / 2), px, pz);
  }
  const ex = lv.exit;
  {
    const x0 = ex.x - 2, z = ex.z;
    put('doorway2', m4.pose(ex.x, 0, z, 0), ex.x, z - 0.5);
    put('wallh', sc(m4.pose(x0 + 0.25, 0, z, 0), 0.5, 1, 1), x0 + 0.25, z - 0.5, { nscale: [0.5, 1, 1] });
    put('wallh', sc(m4.pose(x0 + 3.75, 0, z, 0), 0.5, 1, 1), x0 + 3.75, z - 0.5, { nscale: [0.5, 1, 1] });
    put('exit', m4.pose(ex.x, 2.24, z - 0.12, Math.PI), ex.x, z - 0.5);
  }
  const wallAt = (gx, gy) => {
    let n = 0, hz = 0, vt = 0;
    const he = (xx, yy) => (xx >= 0 && xx < W && yy >= 0 && yy <= H ? hE[yy * W + xx] : 0);
    const ve = (xx, yy) => (xx >= 0 && xx <= W && yy >= 0 && yy < H ? vE[yy * (W + 1) + xx] : 0);
    const solid = (e) => e !== EDGE.OPEN && e !== EDGE.ARCH;
    if (solid(he(gx - 1, gy))) { n++; hz++; }
    if (solid(he(gx, gy))) { n++; hz++; }
    if (solid(ve(gx, gy - 1))) { n++; vt++; }
    if (solid(ve(gx, gy))) { n++; vt++; }
    return n >= 2 && hz > 0 && vt > 0;
  };
  const pillars = [];
  for (let gy = 0; gy <= H; gy++) for (let gx = 0; gx <= W; gx++) {
    if (!wallAt(gx, gy)) continue;
    put('pillar', m4.pose(gx * 2, 0, gy * 2, 0), gx * 2, gy * 2);
    pillars.push([gx * 2, gy * 2]);
  }
  const PH = { bed: 'bed', bench: 'bench', cab1: 'cab1', cab2: 'cab2', cab3: 'cab3', chair: 'chair', table: 'table', wheelchair: 'wheelchair', iv: 'iv', mag: 'mag', locker: 'locker' };
  for (const p of lv.props) {
    const pc = G[PH[p.k]];
    if (!pc) continue;
    let M;
    if (p.tip) {
      const hw = (pc.mx[0] - pc.mn[0]) / 2;
      M = m4.mul(m4.pose(p.x, hw, p.z, p.yaw), m4.pose(0, 0, 0, 0, 0, Math.PI / 2));
    } else M = m4.pose(p.x, p.y || 0, p.z, p.yaw);
    put(PH[p.k], M, p.x, p.z);
  }
  const lampStatic = [];
  for (const l of lv.lamps) {
    if (l.mode) continue;
    put('lamp', m4.pose(l.x, WALL_H - 0.1, l.z, 0), l.x, l.z);
    lampStatic.push(l);
  }
  const chunks = [];
  let tris = 0;
  for (const b of batches) { const c = b.build(R); if (c) { c.emLay = LAY.exit; c.tint = new Float32Array([1, 1, 1, 0.9]); chunks.push(c); tris += c.tris; } }
  const lampMesh = G.lamp ? (() => { const b = new Batch(); b.add(G.lamp, m4.ident()); return b.build(R); })() : null;
  const pieceMesh = {};
  for (const k of ['door', 'door2', 'key', 'lock', 'radio', 'knife', 'flashlight']) {
    if (!G[k]) continue;
    const b = new Batch(); b.add(G[k], m4.ident());
    pieceMesh[k] = b.build(R);
  }
  return { chunks, tris, lampMesh, pieceMesh, pillars };
}

export function buildAO(lv, K = 6) {
  const w = lv.W * 2 * K, h = lv.H * 2 * K;
  const INF = 1e9;
  const dw = new Float32Array(w * h).fill(INF), dp = new Float32Array(w * h).fill(INF);
  const under = new Uint8Array(w * h);
  const mark = (s, arr, inside) => {
    const x0 = Math.max(0, Math.floor(s[0] * K)), x1 = Math.min(w - 1, Math.ceil(s[2] * K) - 1);
    const z0 = Math.max(0, Math.floor(s[1] * K)), z1 = Math.min(h - 1, Math.ceil(s[3] * K) - 1);
    for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) { arr[z * w + x] = 0; if (inside) under[z * w + x] = 1; }
  };
  for (const s of lv.solid) { if (s[4]) continue; if (s[5]) mark(s, dp, true); else mark(s, dw, false); }
  const chamfer = (d) => {
    const a = 1, b = Math.SQRT2;
    for (let z = 0; z < h; z++) for (let x = 0; x < w; x++) {
      let v = d[z * w + x];
      if (x > 0) v = Math.min(v, d[z * w + x - 1] + a);
      if (z > 0) { v = Math.min(v, d[(z - 1) * w + x] + a); if (x > 0) v = Math.min(v, d[(z - 1) * w + x - 1] + b); if (x < w - 1) v = Math.min(v, d[(z - 1) * w + x + 1] + b); }
      d[z * w + x] = v;
    }
    for (let z = h - 1; z >= 0; z--) for (let x = w - 1; x >= 0; x--) {
      let v = d[z * w + x];
      if (x < w - 1) v = Math.min(v, d[z * w + x + 1] + a);
      if (z < h - 1) { v = Math.min(v, d[(z + 1) * w + x] + a); if (x < w - 1) v = Math.min(v, d[(z + 1) * w + x + 1] + b); if (x > 0) v = Math.min(v, d[(z + 1) * w + x - 1] + b); }
      d[z * w + x] = v;
    }
  };
  chamfer(dw); chamfer(dp);
  const raw = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const a = 1 - 0.62 * Math.exp(-(dw[i] / K) / 0.34);
    const b = under[i] ? 0.5 : 1 - 0.32 * Math.exp(-(dp[i] / K) / 0.22);
    raw[i] = a * b;
  }
  const out = new Uint8Array(w * h);
  for (let z = 0; z < h; z++) for (let x = 0; x < w; x++) {
    let s = 0, n = 0;
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, zz = z + dz; if (xx < 0 || zz < 0 || xx >= w || zz >= h) continue; s += raw[zz * w + xx]; n++; }
    out[z * w + x] = Math.round(255 * Math.max(0, Math.min(1, s / n)));
  }
  return { data: out, w, h, x0: 0, z0: 0, sx: lv.W * 2, sz: lv.H * 2 };
}
