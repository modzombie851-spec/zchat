import { gunzip } from './zinflate.js';

export function parseSBM(input) {
  let u8 = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (u8[0] === 0x1f && u8[1] === 0x8b) u8 = gunzip(u8);
  const buf = u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
  const dv = new DataView(buf);
  if (dv.getUint32(0, true) !== 0x314d4253) throw new Error('bad sbm');
  const jl = dv.getUint32(4, true);
  const meta = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 8, jl)));
  const base = 8 + jl, nb = meta.nb, O = meta.off;
  const M = { nb, names: meta.bones.map((b) => b.n), parent: Int16Array.from(meta.bones.map((b) => b.p)), groups: meta.groups, palette: meta.palette, pw: meta.pw, ph: meta.ph, h: meta.h, clips: {} };
  M.restT = new Float32Array(buf, base + O.restT, nb * 3);
  M.restQ = new Float32Array(buf, base + O.restQ, nb * 4);
  M.ib = new Float32Array(buf, base + O.ib, nb * 12);
  if (O.verts >= 0) { M.nv = meta.nv; M.ni = meta.ni; M.verts = new Uint8Array(buf, base + O.verts, meta.nv * 32); M.idx = new Uint16Array(buf, base + O.idx, meta.ni); }
  for (const c of meta.clips || []) {
    const rot = new Int16Array(buf, base + O.anim + c.ro, c.nf * nb * 4);
    const pos = c.po >= 0 ? new Float32Array(buf, base + O.anim + c.po, c.pb.length * c.nf * 3) : null;
    const pbi = new Int16Array(nb).fill(-1);
    c.pb.forEach((b, j) => { pbi[b] = j; });
    M.clips[c.name] = { name: c.name, fps: c.fps, nf: c.nf, loop: c.loop, dur: (c.nf - 1) / c.fps, rot, pos, pbi };
  }
  return M;
}

export function boneMap(model, anim) {
  const map = new Int16Array(model.nb).fill(-1);
  for (let i = 0; i < model.nb; i++) map[i] = anim.names.indexOf(model.names[i]);
  return map;
}

export function newPose(nb) { return { q: new Float32Array(nb * 4), t: new Float32Array(nb * 3), W: new Float32Array(nb * 12), S: new Float32Array(nb * 12) }; }

export function restPose(model, P) { P.q.set(model.restQ); P.t.set(model.restT); }

export function clipTime(clip, t) {
  const last = clip.nf - 1;
  let ft = t * clip.fps;
  if (clip.loop) { ft %= last; if (ft < 0) ft += last; } else ft = Math.min(Math.max(ft, 0), last);
  return ft;
}

export function sampleInto(model, anim, map, clip, t, P, w = 1, mask = null) {
  if (!clip || w <= 0) return;
  const nb = model.nb, anb = anim.nb, last = clip.nf - 1;
  const ft = clipTime(clip, t);
  let f0 = Math.floor(ft); if (f0 >= last) f0 = last - 1; if (f0 < 0) f0 = 0;
  const a = Math.min(1, Math.max(0, ft - f0)), b = 1 - a;
  const R = clip.rot, Pp = clip.pos, q = P.q, T = P.t;
  for (let i = 0; i < nb; i++) {
    if (mask && !mask[i]) continue;
    const j = map ? map[i] : i;
    if (j < 0) continue;
    const k0 = (f0 * anb + j) * 4, k1 = k0 + anb * 4;
    let x = R[k0] * b + R[k1] * a, y = R[k0 + 1] * b + R[k1 + 1] * a, z = R[k0 + 2] * b + R[k1 + 2] * a, ww = R[k0 + 3] * b + R[k1 + 3] * a;
    const l = 1 / (Math.hypot(x, y, z, ww) || 1);
    x *= l; y *= l; z *= l; ww *= l;
    const qi = i * 4;
    if (w >= 1) { q[qi] = x; q[qi + 1] = y; q[qi + 2] = z; q[qi + 3] = ww; }
    else {
      if (q[qi] * x + q[qi + 1] * y + q[qi + 2] * z + q[qi + 3] * ww < 0) { x = -x; y = -y; z = -z; ww = -ww; }
      const nx = q[qi] * (1 - w) + x * w, ny = q[qi + 1] * (1 - w) + y * w, nz = q[qi + 2] * (1 - w) + z * w, nw = q[qi + 3] * (1 - w) + ww * w;
      const l2 = 1 / (Math.hypot(nx, ny, nz, nw) || 1);
      q[qi] = nx * l2; q[qi + 1] = ny * l2; q[qi + 2] = nz * l2; q[qi + 3] = nw * l2;
    }
    const pj = clip.pbi[j];
    if (pj >= 0 && Pp) {
      const o0 = (pj * clip.nf + f0) * 3, o1 = o0 + 3;
      const tx = Pp[o0] * b + Pp[o1] * a, ty = Pp[o0 + 1] * b + Pp[o1 + 1] * a, tz = Pp[o0 + 2] * b + Pp[o1 + 2] * a;
      const ti = i * 3;
      if (w >= 1) { T[ti] = tx; T[ti + 1] = ty; T[ti + 2] = tz; } else { T[ti] += (tx - T[ti]) * w; T[ti + 1] += (ty - T[ti + 1]) * w; T[ti + 2] += (tz - T[ti + 2]) * w; }
    } else if (w >= 1) { const ti = i * 3; T[ti] = model.restT[ti]; T[ti + 1] = model.restT[ti + 1]; T[ti + 2] = model.restT[ti + 2]; }
  }
}

export function skinPose(model, P) {
  const nb = model.nb, par = model.parent, q = P.q, T = P.t, W = P.W, S = P.S, IB = model.ib;
  for (let i = 0; i < nb; i++) {
    const qi = i * 4, x = q[qi], y = q[qi + 1], z = q[qi + 2], w = q[qi + 3];
    const xx = x * x, yy = y * y, zz = z * z, xy = x * y, xz = x * z, yz = y * z, wx = w * x, wy = w * y, wz = w * z;
    const a00 = 1 - 2 * (yy + zz), a01 = 2 * (xy - wz), a02 = 2 * (xz + wy);
    const a10 = 2 * (xy + wz), a11 = 1 - 2 * (xx + zz), a12 = 2 * (yz - wx);
    const a20 = 2 * (xz - wy), a21 = 2 * (yz + wx), a22 = 1 - 2 * (xx + yy);
    const tx = T[i * 3], ty = T[i * 3 + 1], tz = T[i * 3 + 2];
    const o = i * 12, p = par[i];
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
    S[o] = w00 * b00 + w01 * b10 + w02 * b20; S[o + 1] = w00 * b01 + w01 * b11 + w02 * b21; S[o + 2] = w00 * b02 + w01 * b12 + w02 * b22; S[o + 3] = w00 * b03 + w01 * b13 + w02 * b23 + w03;
    S[o + 4] = w10 * b00 + w11 * b10 + w12 * b20; S[o + 5] = w10 * b01 + w11 * b11 + w12 * b21; S[o + 6] = w10 * b02 + w11 * b12 + w12 * b22; S[o + 7] = w10 * b03 + w11 * b13 + w12 * b23 + w13;
    S[o + 8] = w20 * b00 + w21 * b10 + w22 * b20; S[o + 9] = w20 * b01 + w21 * b11 + w22 * b21; S[o + 10] = w20 * b02 + w21 * b12 + w22 * b22; S[o + 11] = w20 * b03 + w21 * b13 + w22 * b23 + w23;
  }
}

export function attach(P, bone, off, out) {
  const W = P.W, o = bone * 12;
  for (let r = 0; r < 3; r++) {
    const w0 = W[o + r * 4], w1 = W[o + r * 4 + 1], w2 = W[o + r * 4 + 2], w3 = W[o + r * 4 + 3];
    out[r * 4] = w0 * off[0] + w1 * off[4] + w2 * off[8];
    out[r * 4 + 1] = w0 * off[1] + w1 * off[5] + w2 * off[9];
    out[r * 4 + 2] = w0 * off[2] + w1 * off[6] + w2 * off[10];
    out[r * 4 + 3] = w0 * off[3] + w1 * off[7] + w2 * off[11] + w3;
  }
  return out;
}

export function upperMask(model, from = 'spine') {
  const m = new Uint8Array(model.nb);
  const s = model.names.indexOf(from);
  if (s < 0) return m;
  for (let i = 0; i < model.nb; i++) { let p = i; while (p >= 0 && p !== s) p = model.parent[p]; if (p === s) m[i] = 1; }
  return m;
}

function hsv(r, g, b) { const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = 0; if (d > 1e-6) { if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; if (h < 0) h += 360; } return [h, mx ? d / mx : 0, mx]; }
function rgb(h, s, v) { const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c; const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]; return [r + m, g + m, b + m]; }
const inBand = (h, a, b) => (a <= b ? h >= a && h <= b : h >= a || h <= b);

export function recolor(img, size, band, target, shift, lift = 1) {
  const cv = document.createElement('canvas'); cv.width = size; cv.height = size;
  const x = cv.getContext('2d', { willReadFrequently: true });
  x.drawImage(img, 0, 0, size, size);
  if (!band) return cv;
  const d = x.getImageData(0, 0, size, size), p = d.data;
  const mid = band[2] != null ? band[2] : band[0] <= band[1] ? (band[0] + band[1]) / 2 : ((band[0] + band[1] + 360) / 2) % 360;
  const smin = band[3] != null ? band[3] : 0.18;
  const rot = target == null ? shift : target - mid + shift;
  if (!rot && lift === 1) return cv;
  for (let i = 0; i < p.length; i += 4) {
    const [h, s, v] = hsv(p[i] / 255, p[i + 1] / 255, p[i + 2] / 255);
    if (s < smin || !inBand(h, band[0], band[1])) continue;
    const [r, g, b] = rgb(((h + rot) % 360 + 360) % 360, s, Math.min(1, v * lift));
    p[i] = r * 255; p[i + 1] = g * 255; p[i + 2] = b * 255;
  }
  x.putImageData(d, 0, 0);
  return cv;
}

export function paletteCanvas(model) {
  const pw = model.pw || 16, ph = model.ph || 1;
  const cv = document.createElement('canvas'); cv.width = pw * 4; cv.height = ph * 4;
  const x = cv.getContext('2d');
  (model.palette || []).forEach((c, i) => { x.fillStyle = c; x.fillRect((i % pw) * 4, Math.floor(i / pw) * 4, 4, 4); });
  return cv;
}
