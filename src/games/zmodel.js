import { resBlob } from './zres.js';
export function parseModel(buf) {
  const dv = new DataView(buf);
  if (dv.getUint32(0, true) !== 0x4c444d5a) throw new Error('bad model');
  const nb = dv.getUint32(8, true), nv = dv.getUint32(12, true), ni = dv.getUint32(16, true);
  const alpha = (dv.getUint32(20, true) & 1) === 1;
  const hipsH = dv.getFloat32(24, true);
  let o = 32;
  const parent = new Int32Array(buf.slice(o, o + nb * 4)); o += nb * 4;
  const restT = new Float32Array(buf.slice(o, o + nb * 12)); o += nb * 12;
  const restQ = new Float32Array(buf.slice(o, o + nb * 16)); o += nb * 16;
  const ib = new Float32Array(buf.slice(o, o + nb * 48)); o += nb * 48;
  const verts = new Uint8Array(buf, o, nv * 32); o += nv * 32;
  const idx = new Uint16Array(buf.slice(o, o + ni * 2));
  let top = 0;
  for (let v = 0; v < nv; v++) top = Math.max(top, dv.getFloat32(32 + nb * 80 + v * 32 + 4, true));
  return { nb, nv, ni, alpha, hipsH, parent, restT, restQ, ib, verts, idx, top };
}

export function parseAnims(buf) {
  const dv = new DataView(buf);
  if (dv.getUint32(0, true) !== 0x4d4e415a || dv.getUint32(4, true) !== 2) throw new Error('bad anims');
  const n = dv.getUint32(8, true), nb = dv.getUint32(12, true);
  const clips = {};
  let o = 16;
  for (let c = 0; c < n; c++) {
    let name = '';
    for (let i = 0; i < 12; i++) { const ch = dv.getUint8(o + i); if (ch) name += String.fromCharCode(ch); }
    const fps = dv.getUint16(o + 12, true), nf = dv.getUint16(o + 14, true), loop = (dv.getUint32(o + 16, true) & 1) === 1;
    const srcH = dv.getFloat32(o + 20, true), speed = dv.getFloat32(o + 24, true), ph = dv.getFloat32(o + 28, true);
    o += 32;
    const cst = new Uint8Array(buf.slice(o, o + nb));
    o += Math.ceil(nb / 4) * 4;
    const hp = new Float32Array(buf.slice(o, o + nf * 12)); o += nf * 12;
    const off = new Int32Array(nb);
    let cnt = 0;
    for (let i = 0; i < nb; i++) { off[i] = cnt; cnt += (cst[i] ? 1 : nf) * 4; }
    const q = new Int16Array(buf.slice(o, o + cnt * 2)); o += cnt * 2;
    clips[name] = { name, fps, nf, loop, srcH, speed, ph, hp, q, off, cst, dur: (nf - 1) / fps };
  }
  return { nb, clips };
}

export function sampleClip(clip, nb, t, q, hp) {
  const fps = clip.fps, last = clip.nf - 1;
  let ft = t * fps;
  if (clip.loop) { ft %= last; if (ft < 0) ft += last; } else ft = Math.min(Math.max(ft, 0), last);
  let f0 = Math.floor(ft);
  if (f0 >= last) f0 = last - 1;
  const a = ft - f0, b = 1 - a;
  const Q = clip.q, off = clip.off, cst = clip.cst;
  for (let i = 0; i < nb; i++) {
    let k0 = off[i], k1 = k0;
    if (!cst[i]) { k0 += f0 * 4; k1 = k0 + 4; }
    const x0 = Q[k0], y0 = Q[k0 + 1], z0 = Q[k0 + 2], w0 = Q[k0 + 3];
    let x1 = Q[k1], y1 = Q[k1 + 1], z1 = Q[k1 + 2], w1 = Q[k1 + 3];
    if (x0 * x1 + y0 * y1 + z0 * z1 + w0 * w1 < 0) { x1 = -x1; y1 = -y1; z1 = -z1; w1 = -w1; }
    const x = x0 * b + x1 * a, y = y0 * b + y1 * a, z = z0 * b + z1 * a, w = w0 * b + w1 * a;
    const l = 1 / (Math.hypot(x, y, z, w) || 1);
    q[i * 4] = x * l; q[i * 4 + 1] = y * l; q[i * 4 + 2] = z * l; q[i * 4 + 3] = w * l;
  }
  const H = clip.hp, h0 = f0 * 3, h1 = h0 + 3;
  hp[0] = H[h0] * b + H[h1] * a; hp[1] = H[h0 + 1] * b + H[h1 + 1] * a; hp[2] = H[h0 + 2] * b + H[h1 + 2] * a;
}

export function blendMask(q, q2, mask, w) {
  if (w <= 0) return;
  const b = 1 - w;
  for (const i of mask) {
    const k = i * 4;
    let x = q2[k], y = q2[k + 1], z = q2[k + 2], v = q2[k + 3];
    if (q[k] * x + q[k + 1] * y + q[k + 2] * z + q[k + 3] * v < 0) { x = -x; y = -y; z = -z; v = -v; }
    const nx = q[k] * b + x * w, ny = q[k + 1] * b + y * w, nz = q[k + 2] * b + z * w, nw = q[k + 3] * b + v * w;
    const l = 1 / (Math.hypot(nx, ny, nz, nw) || 1);
    q[k] = nx * l; q[k + 1] = ny * l; q[k + 2] = nz * l; q[k + 3] = nw * l;
  }
}

export function blendInto(q, hp, q2, hp2, nb, w) {
  if (w <= 0) return;
  const b = 1 - w;
  for (let i = 0; i < nb; i++) {
    const k = i * 4;
    let x = q2[k], y = q2[k + 1], z = q2[k + 2], v = q2[k + 3];
    if (q[k] * x + q[k + 1] * y + q[k + 2] * z + q[k + 3] * v < 0) { x = -x; y = -y; z = -z; v = -v; }
    const nx = q[k] * b + x * w, ny = q[k + 1] * b + y * w, nz = q[k + 2] * b + z * w, nw = q[k + 3] * b + v * w;
    const l = 1 / (Math.hypot(nx, ny, nz, nw) || 1);
    q[k] = nx * l; q[k + 1] = ny * l; q[k + 2] = nz * l; q[k + 3] = nw * l;
  }
  hp[0] = hp[0] * b + hp2[0] * w; hp[1] = hp[1] * b + hp2[1] * w; hp[2] = hp[2] * b + hp2[2] * w;
}

export function poseSkin(M, q, hp, k, W, out) {
  const nb = M.nb, P = M.parent, T = M.restT, IB = M.ib;
  for (let i = 0; i < nb; i++) {
    const qi = i * 4, x = q[qi], y = q[qi + 1], z = q[qi + 2], w = q[qi + 3];
    const xx = x * x, yy = y * y, zz = z * z, xy = x * y, xz = x * z, yz = y * z, wx = w * x, wy = w * y, wz = w * z;
    const a00 = 1 - 2 * (yy + zz), a01 = 2 * (xy - wz), a02 = 2 * (xz + wy);
    const a10 = 2 * (xy + wz), a11 = 1 - 2 * (xx + zz), a12 = 2 * (yz - wx);
    const a20 = 2 * (xz - wy), a21 = 2 * (yz + wx), a22 = 1 - 2 * (xx + yy);
    let tx, ty, tz;
    if (i === 0) { tx = T[0] + hp[0] * k; ty = hp[1] * k; tz = T[2] + hp[2] * k; } else { tx = T[i * 3]; ty = T[i * 3 + 1]; tz = T[i * 3 + 2]; }
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
    const b00 = IB[o], b01 = IB[o + 1], b02 = IB[o + 2], b03 = IB[o + 3];
    const b10 = IB[o + 4], b11 = IB[o + 5], b12 = IB[o + 6], b13 = IB[o + 7];
    const b20 = IB[o + 8], b21 = IB[o + 9], b22 = IB[o + 10], b23 = IB[o + 11];
    const w00 = W[o], w01 = W[o + 1], w02 = W[o + 2], w03 = W[o + 3];
    const w10 = W[o + 4], w11 = W[o + 5], w12 = W[o + 6], w13 = W[o + 7];
    const w20 = W[o + 8], w21 = W[o + 9], w22 = W[o + 10], w23 = W[o + 11];
    out[o] = w00 * b00 + w01 * b10 + w02 * b20; out[o + 1] = w00 * b01 + w01 * b11 + w02 * b21; out[o + 2] = w00 * b02 + w01 * b12 + w02 * b22; out[o + 3] = w00 * b03 + w01 * b13 + w02 * b23 + w03;
    out[o + 4] = w10 * b00 + w11 * b10 + w12 * b20; out[o + 5] = w10 * b01 + w11 * b11 + w12 * b21; out[o + 6] = w10 * b02 + w11 * b12 + w12 * b22; out[o + 7] = w10 * b03 + w11 * b13 + w12 * b23 + w13;
    out[o + 8] = w20 * b00 + w21 * b10 + w22 * b20; out[o + 9] = w20 * b01 + w21 * b11 + w22 * b21; out[o + 10] = w20 * b02 + w21 * b12 + w22 * b22; out[o + 11] = w20 * b03 + w21 * b13 + w22 * b23 + w23;
  }
}

const cache = new Map();
function once(key, fn) {
  if (!cache.has(key)) { const p = fn(); cache.set(key, p); p.catch(() => cache.delete(key)); }
  return cache.get(key);
}
async function fetchBuf(url) { return (await resBlob(url)).arrayBuffer(); }
export const IOS_DEV = (() => { try { return /iP(hone|ad|od)/.test(navigator.userAgent || '') || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); } catch { return false; } })();
const decQ = [];
let decN = 0;
const DEC_MAX = IOS_DEV ? 1 : 6;
export function decodeSlot() {
  return new Promise((res) => {
    const go = () => { decN++; let done = false; res(() => { if (done) return; done = true; decN--; const nx = decQ.shift(); if (nx) nx(); }); };
    if (decN < DEC_MAX) go(); else decQ.push(go);
  });
}
export async function fetchImg(url, half) {
  const free = await decodeSlot();
  try { return await fetchImgNow(url, half); } finally { free(); }
}
async function fetchImgNow(url, half) {
  const b = await resBlob(url);
  if (typeof createImageBitmap === 'function') {
    try {
      const bm = await createImageBitmap(b, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
      if (!half) return bm;
      try { const sm = await createImageBitmap(bm, { resizeWidth: bm.width >> 1, resizeHeight: bm.height >> 1, resizeQuality: 'medium', premultiplyAlpha: 'none' }); bm.close(); return sm; } catch { return bm; }
    } catch {}
  }
  return new Promise((res, rej) => { const im = new Image(); const u = URL.createObjectURL(b); im.onload = () => { URL.revokeObjectURL(u); res(im); }; im.onerror = (e) => { URL.revokeObjectURL(u); rej(e); }; im.src = u; });
}
export const dropImgs = (x) => { for (const im of [x && x.img, x && x.nrm]) if (im && im.close) { try { im.close(); } catch {} } };
export function loadZAnims(base, file = 'zanim') {
  return once(`${base}/${file}`, async () => parseAnims(await fetchBuf(`${base}/${file}.bin`)));
}
export async function loadZModel(base, n, withNormals, half) {
  const [model, img, nrm] = await Promise.all([
    once(`${base}/${n}.bin`, async () => parseModel(await fetchBuf(`${base}/${n}.bin`))),
    fetchImg(`${base}/${n}_d.webp`, half),
    withNormals ? fetchImg(`${base}/${n}_n.webp`, half).catch(() => null) : null,
  ]);
  return { model, img, nrm };
}
export function parseStatic(buf) {
  const dv = new DataView(buf);
  const nv = dv.getUint32(8, true), ni = dv.getUint32(12, true), ng = dv.getUint16(16, true), ib = dv.getUint16(18, true);
  const min = [dv.getFloat32(20, true), dv.getFloat32(24, true), dv.getFloat32(28, true)];
  const max = [dv.getFloat32(32, true), dv.getFloat32(36, true), dv.getFloat32(40, true)];
  const groups = [];
  let o = 64;
  for (let i = 0; i < ng; i++, o += 12) groups.push({ arr: dv.getUint16(o, true), start: dv.getUint32(o + 4, true), count: dv.getUint32(o + 8, true) });
  const verts = new Uint8Array(buf, o, nv * 36);
  o += nv * 36;
  const idx = ib === 4 ? new Uint32Array(buf.slice(o, o + ni * 4)) : new Uint16Array(buf.slice(o, o + ni * 2));
  return { verts, idx, ni, nv, groups, min, max };
}
export function loadStatic(base, id) {
  return once(`${base}/st_${id}`, async () => parseStatic(await fetchBuf(`${base}/st_${id}.bin`)));
}
export function loadTexArrays(base, man, shrink, onP) {
  return (async () => {
    const out = {};
    const tot = Object.values(man.arrays).reduce((n, a) => n + a.files.length, 0) || 1;
    let got = 0;
    for (const [k, a] of Object.entries(man.arrays)) {
      const size = Math.max(16, a.size >> shrink);
      const strips = [];
      for (const f of a.files) { strips.push(await fetchImg(`${base}/${f}`)); got++; if (onP) onP(got / tot); }
      const layers = [];
      for (let i = 0; i < a.layers; i++) {
        const src = strips[Math.floor(i / a.per)], j = i % a.per;
        let bm = null;
        if (!IOS_DEV && typeof createImageBitmap === 'function' && typeof ImageBitmap !== 'undefined' && src instanceof ImageBitmap) {
          try { bm = await createImageBitmap(src, 0, j * a.size, a.size, a.size, { premultiplyAlpha: 'none', colorSpaceConversion: 'none', resizeWidth: size, resizeHeight: size, resizeQuality: 'high' }); } catch { bm = null; }
        }
        if (!bm) {
          const c = Object.assign(document.createElement('canvas'), { width: size, height: size });
          c.getContext('2d').drawImage(src, 0, j * a.size, a.size, a.size, 0, 0, size, size);
          bm = c;
        }
        layers.push(bm);
      }
      for (const st of strips) if (st && st.close) st.close();
      out[k] = { size, layers };
    }
    return out;
  })();
}
