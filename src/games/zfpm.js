export function parseFPM(buf) {
  const dv = new DataView(buf);
  if (dv.getUint32(0, true) !== 0x3250465a) throw new Error('bad fpm');
  const nb = dv.getUint32(4, true), nv = dv.getUint32(8, true), ni = dv.getUint32(12, true), ng = dv.getUint32(16, true), nf = dv.getUint32(20, true), fps = dv.getFloat32(24, true);
  let o = 28;
  const box = [];
  for (let i = 0; i < 6; i++) { box.push(dv.getFloat32(o, true)); o += 4; }
  const groups = [];
  for (let g = 0; g < ng; g++) {
    const start = dv.getUint32(o, true), count = dv.getUint32(o + 4, true);
    let key = '';
    for (let k = 0; k < 16; k++) { const c = dv.getUint8(o + 8 + k); if (c) key += String.fromCharCode(c); }
    groups.push({ start, count, key });
    o += 24;
  }
  const parent = new Int32Array(nb);
  for (let i = 0; i < nb; i++) { parent[i] = dv.getInt32(o, true); o += 4; }
  const f32 = (n) => { const a = new Float32Array(n); for (let i = 0; i < n; i++) { a[i] = dv.getFloat32(o, true); o += 4; } return a; };
  const restS = f32(nb * 3), restT = f32(nb * 3), restQ = f32(nb * 4), ib = f32(nb * 12);
  const flags = new Uint8Array(buf, o, nb).slice();
  o += Math.ceil(nb / 4) * 4;
  const nu = dv.getUint32(o, true); o += 4;
  const used = new Uint16Array(nu);
  for (let i = 0; i < nu; i++) { used[i] = dv.getUint16(o, true); o += 2; }
  if (nu % 2) o += 2;
  let nR = 0, nT = 0;
  const rSlot = new Int16Array(nb).fill(-1), tSlot = new Int16Array(nb).fill(-1);
  for (let b = 0; b < nb; b++) { if (flags[b] & 1) rSlot[b] = nR++; if (flags[b] & 2) tSlot[b] = nT++; }
  const rq = new Int16Array(nf * nR * 4);
  for (let i = 0; i < rq.length; i++) { rq[i] = dv.getInt16(o, true); o += 2; }
  const rt = new Int16Array(nf * nT * 3);
  for (let i = 0; i < rt.length; i++) { rt[i] = dv.getInt16(o, true); o += 2; }
  const verts = new Uint8Array(nv * 32), vd = new DataView(verts.buffer);
  const sx = (box[3] - box[0]) / 65535, sy = (box[4] - box[1]) / 65535, sz = (box[5] - box[2]) / 65535;
  for (let v = 0; v < nv; v++) {
    const w = v * 32;
    vd.setFloat32(w, box[0] + dv.getUint16(o, true) * sx, true);
    vd.setFloat32(w + 4, box[1] + dv.getUint16(o + 2, true) * sy, true);
    vd.setFloat32(w + 8, box[2] + dv.getUint16(o + 4, true) * sz, true);
    vd.setInt16(w + 12, dv.getInt8(o + 6) * 258, true);
    vd.setInt16(w + 14, dv.getInt8(o + 7) * 258, true);
    vd.setInt16(w + 16, dv.getInt8(o + 8) * 258, true);
    vd.setInt16(w + 18, 0, true);
    vd.setUint16(w + 20, dv.getUint16(o + 9, true), true);
    vd.setUint16(w + 22, dv.getUint16(o + 11, true), true);
    for (let k = 0; k < 8; k++) verts[w + 24 + k] = dv.getUint8(o + 13 + k);
    o += 21;
  }
  const idx = new Uint16Array(ni);
  for (let i = 0; i < ni; i++) { idx[i] = dv.getUint16(o, true); o += 2; }
  return { nb, nu, used, nv, ni, ng, nf, fps, groups, parent, restS, restT, restQ, ib, flags, rSlot, tSlot, nR, nT, rq, rt, verts, idx };
}

export function fpmLocals(M, frame, LQ, LT) {
  const last = M.nf - 1;
  const ft = frame < 0 ? 0 : frame > last ? last : frame;
  let f0 = Math.floor(ft);
  if (f0 >= last) f0 = last - 1 < 0 ? 0 : last - 1;
  const a = Math.min(1, ft - f0), b = 1 - a, f1 = Math.min(last, f0 + 1);
  const nb = M.nb, RQ = M.rq, RT = M.rt, nR = M.nR, nT = M.nT;
  for (let i = 0; i < nb; i++) {
    const r = M.rSlot[i], q4 = i * 4;
    if (r < 0) { LQ[q4] = M.restQ[q4]; LQ[q4 + 1] = M.restQ[q4 + 1]; LQ[q4 + 2] = M.restQ[q4 + 2]; LQ[q4 + 3] = M.restQ[q4 + 3]; }
    else {
      const k0 = (f0 * nR + r) * 4, k1 = (f1 * nR + r) * 4;
      let x1 = RQ[k1], y1 = RQ[k1 + 1], z1 = RQ[k1 + 2], w1 = RQ[k1 + 3];
      const x0 = RQ[k0], y0 = RQ[k0 + 1], z0 = RQ[k0 + 2], w0 = RQ[k0 + 3];
      if (x0 * x1 + y0 * y1 + z0 * z1 + w0 * w1 < 0) { x1 = -x1; y1 = -y1; z1 = -z1; w1 = -w1; }
      const x = x0 * b + x1 * a, y = y0 * b + y1 * a, z = z0 * b + z1 * a, w = w0 * b + w1 * a;
      const l = 1 / (Math.hypot(x, y, z, w) || 1);
      LQ[q4] = x * l; LQ[q4 + 1] = y * l; LQ[q4 + 2] = z * l; LQ[q4 + 3] = w * l;
    }
    const t = M.tSlot[i], t3 = i * 3;
    if (t < 0) { LT[t3] = M.restT[t3]; LT[t3 + 1] = M.restT[t3 + 1]; LT[t3 + 2] = M.restT[t3 + 2]; }
    else {
      const k0 = (f0 * nT + t) * 3, k1 = (f1 * nT + t) * 3;
      LT[t3] = (RT[k0] * b + RT[k1] * a) / 256; LT[t3 + 1] = (RT[k0 + 1] * b + RT[k1 + 1] * a) / 256; LT[t3 + 2] = (RT[k0 + 2] * b + RT[k1 + 2] * a) / 256;
    }
  }
}

export function fpmBlend(nb, LQ, LT, Q2, T2, w) {
  if (w <= 0) return;
  if (w >= 1) { LQ.set(Q2); LT.set(T2); return; }
  const b = 1 - w;
  for (let i = 0; i < nb; i++) {
    const k = i * 4;
    let x = Q2[k], y = Q2[k + 1], z = Q2[k + 2], v = Q2[k + 3];
    if (LQ[k] * x + LQ[k + 1] * y + LQ[k + 2] * z + LQ[k + 3] * v < 0) { x = -x; y = -y; z = -z; v = -v; }
    const nx = LQ[k] * b + x * w, ny = LQ[k + 1] * b + y * w, nz = LQ[k + 2] * b + z * w, nw = LQ[k + 3] * b + v * w;
    const l = 1 / (Math.hypot(nx, ny, nz, nw) || 1);
    LQ[k] = nx * l; LQ[k + 1] = ny * l; LQ[k + 2] = nz * l; LQ[k + 3] = nw * l;
    const t = i * 3;
    LT[t] = LT[t] * b + T2[t] * w; LT[t + 1] = LT[t + 1] * b + T2[t + 1] * w; LT[t + 2] = LT[t + 2] * b + T2[t + 2] * w;
  }
}

export function fpmWorld(M, LQ, LT, W) {
  const nb = M.nb, P = M.parent, S = M.restS;
  for (let i = 0; i < nb; i++) {
    const qi = i * 4, x = LQ[qi], y = LQ[qi + 1], z = LQ[qi + 2], w = LQ[qi + 3];
    const sx = S[i * 3], sy = S[i * 3 + 1], sz = S[i * 3 + 2];
    const xx = x * x, yy = y * y, zz = z * z, xy = x * y, xz = x * z, yz = y * z, wx = w * x, wy = w * y, wz = w * z;
    const a00 = (1 - 2 * (yy + zz)) * sx, a01 = 2 * (xy - wz) * sy, a02 = 2 * (xz + wy) * sz;
    const a10 = 2 * (xy + wz) * sx, a11 = (1 - 2 * (xx + zz)) * sy, a12 = 2 * (yz - wx) * sz;
    const a20 = 2 * (xz - wy) * sx, a21 = 2 * (yz + wx) * sy, a22 = (1 - 2 * (xx + yy)) * sz;
    const tx = LT[i * 3], ty = LT[i * 3 + 1], tz = LT[i * 3 + 2];
    const o = i * 12, p = P[i];
    if (p < 0) {
      W[o] = a00; W[o + 1] = a01; W[o + 2] = a02; W[o + 3] = tx;
      W[o + 4] = a10; W[o + 5] = a11; W[o + 6] = a12; W[o + 7] = ty;
      W[o + 8] = a20; W[o + 9] = a21; W[o + 10] = a22; W[o + 11] = tz;
    } else {
      const r = p * 12;
      const p00 = W[r], p01 = W[r + 1], p02 = W[r + 2], p03 = W[r + 3];
      const p10 = W[r + 4], p11 = W[r + 5], p12 = W[r + 6], p13 = W[r + 7];
      const p20 = W[r + 8], p21 = W[r + 9], p22 = W[r + 10], p23 = W[r + 11];
      W[o] = p00 * a00 + p01 * a10 + p02 * a20; W[o + 1] = p00 * a01 + p01 * a11 + p02 * a21; W[o + 2] = p00 * a02 + p01 * a12 + p02 * a22; W[o + 3] = p00 * tx + p01 * ty + p02 * tz + p03;
      W[o + 4] = p10 * a00 + p11 * a10 + p12 * a20; W[o + 5] = p10 * a01 + p11 * a11 + p12 * a21; W[o + 6] = p10 * a02 + p11 * a12 + p12 * a22; W[o + 7] = p10 * tx + p11 * ty + p12 * tz + p13;
      W[o + 8] = p20 * a00 + p21 * a10 + p22 * a20; W[o + 9] = p20 * a01 + p21 * a11 + p22 * a21; W[o + 10] = p20 * a02 + p21 * a12 + p22 * a22; W[o + 11] = p20 * tx + p21 * ty + p22 * tz + p23;
    }
  }
}

export function fpmSkin(M, W, out, pre) {
  const nu = M.nu, IB = M.ib, U = M.used;
  for (let k = 0; k < nu; k++) {
    const i = U[k], o = i * 12, d = k * 12;
    const b00 = IB[o], b01 = IB[o + 1], b02 = IB[o + 2], b03 = IB[o + 3];
    const b10 = IB[o + 4], b11 = IB[o + 5], b12 = IB[o + 6], b13 = IB[o + 7];
    const b20 = IB[o + 8], b21 = IB[o + 9], b22 = IB[o + 10], b23 = IB[o + 11];
    let w00 = W[o], w01 = W[o + 1], w02 = W[o + 2], w03 = W[o + 3];
    let w10 = W[o + 4], w11 = W[o + 5], w12 = W[o + 6], w13 = W[o + 7];
    let w20 = W[o + 8], w21 = W[o + 9], w22 = W[o + 10], w23 = W[o + 11];
    if (pre) {
      const q = pre;
      const n00 = q[0] * w00 + q[1] * w10 + q[2] * w20, n01 = q[0] * w01 + q[1] * w11 + q[2] * w21, n02 = q[0] * w02 + q[1] * w12 + q[2] * w22, n03 = q[0] * w03 + q[1] * w13 + q[2] * w23 + q[3];
      const n10 = q[4] * w00 + q[5] * w10 + q[6] * w20, n11 = q[4] * w01 + q[5] * w11 + q[6] * w21, n12 = q[4] * w02 + q[5] * w12 + q[6] * w22, n13 = q[4] * w03 + q[5] * w13 + q[6] * w23 + q[7];
      const n20 = q[8] * w00 + q[9] * w10 + q[10] * w20, n21 = q[8] * w01 + q[9] * w11 + q[10] * w21, n22 = q[8] * w02 + q[9] * w12 + q[10] * w22, n23 = q[8] * w03 + q[9] * w13 + q[10] * w23 + q[11];
      w00 = n00; w01 = n01; w02 = n02; w03 = n03; w10 = n10; w11 = n11; w12 = n12; w13 = n13; w20 = n20; w21 = n21; w22 = n22; w23 = n23;
    }
    out[d] = w00 * b00 + w01 * b10 + w02 * b20; out[d + 1] = w00 * b01 + w01 * b11 + w02 * b21; out[d + 2] = w00 * b02 + w01 * b12 + w02 * b22; out[d + 3] = w00 * b03 + w01 * b13 + w02 * b23 + w03;
    out[d + 4] = w10 * b00 + w11 * b10 + w12 * b20; out[d + 5] = w10 * b01 + w11 * b11 + w12 * b21; out[d + 6] = w10 * b02 + w11 * b12 + w12 * b22; out[d + 7] = w10 * b03 + w11 * b13 + w12 * b23 + w13;
    out[d + 8] = w20 * b00 + w21 * b10 + w22 * b20; out[d + 9] = w20 * b01 + w21 * b11 + w22 * b21; out[d + 10] = w20 * b02 + w21 * b12 + w22 * b22; out[d + 11] = w20 * b03 + w21 * b13 + w22 * b23 + w23;
  }
}
