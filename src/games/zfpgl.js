import { m4 } from './race3d.js';
import { parseFPM, fpmLocals, fpmBlend, fpmWorld, fpmSkin } from './zfpm.js';
import { GUNS } from './zguns.js';
import { resBlob, resReady } from './zres.js';
import { gunzip } from './zinflate.js';

const BASE = '/dead/fp';
const RATE = 30;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

export const FPG = {
  pistol: { tex: { material: 'arms', Mat_0: 'pistol' }, root: 57, grip: [0, -1.55, -0.08], muz: [0, 7.4, 29], hip: [8.5, 25, -22], ads: [0, 9.45, -30], adsP: 0, c: { fire: [0, 8], relA: [9, 64], relB: [65, 130], hol: [131, 142], draw: [142, 177], idle: [179, 204], mel: [205, 224] } },
  rifle: { tex: { carbine: 'rifle', lens: 'rifle_lens', arms: 'arms' }, root: 5, grip: [0, -2.7, 0.98], muz: [0, 10, 68], hip: [14, 24.5, -30], ads: [0, 16.82, -17], adsP: 0, c: { fire: [0, 8], relA: [8, 66], relB: [66, 132], hol: [132, 144], draw: [144, 176], idle: [176, 204], mel: [204, 222] } },
  shotgun: { tex: { material: 'arms', shotgun: 'shotgun' }, root: 57, grip: [0, -2.07, 0.66], muz: [0, 8.5, 82], hip: [14, 23, -28], ads: [0, 14.9, -4], adsP: -0.0187, c: { fire: [0, 12], pump: [0, 36], rel: [36, 87], ins: [45, 60], hol: [87, 102], draw: [102, 129], idle: [129, 159], mel: [159, 180] } },
  smg: { tex: { arms: 'arms', smg45: 'smg' }, root: 57, grip: [0, -2.81, 0.6], muz: [0, 8, 41], hip: [13, 24.5, -22], ads: [0, 15.67, -36], adsP: 0.0085, c: { fire: [0, 9], relA: [9, 80], relB: [82, 128], hol: [130, 140], draw: [140, 175], idle: [175, 215], mel: [215, 234] } },
  sniper: { tex: { arms: 'arms', sniper: 'sniper', lens: 'glass' }, root: 57, grip: [0, -1.16, 1.83], muz: [0, 7.6, 107], hip: [14, 22.5, -32], ads: [0, 14.08, -6], adsP: 0, c: { fire: [0, 48], fsp: 1.4, bolt: [9, 48], rel: [48, 96], hol: [96, 108], draw: [108, 147], idle: [147, 180], mel: [180, 200] } },
  qq9: { tex: { arms: 'arms', qq9: 'qq9' }, root: 57, grip: [0, -2.81, 0.6], muz: [0, 8, 50.6], hip: [13, 24.5, -22], ads: [0.78, 16.64, -36], adsP: -0.0052, c: { fire: [0, 9], relA: [9, 80], relB: [82, 128], hol: [130, 140], draw: [140, 175], idle: [175, 215], mel: [215, 234] } },
  uzi: { tex: { arms: 'arms', uzi0: 'uzi0', uzi1: 'uzi1', uzi2: 'uzi2', uzi3: 'uzi3', uzi4: 'uzi4' }, root: 57, grip: [0, -2.81, 0.6], muz: [0, 8, 43.0], hip: [13, 24.5, -22], ads: [0.5, 18.9, -34], adsP: -0.0465, c: { fire: [0, 9], relA: [9, 80], relB: [82, 128], hol: [130, 140], draw: [140, 175], idle: [175, 215], mel: [215, 234] } },
  ak47: { tex: { arms: 'arms', ak47: 'ak47' }, root: 5, grip: [0, -2.7, 0.98], muz: [0, 10, 70.2], hip: [14, 24.5, -30], ads: [-0.45, 16.45, -20], adsP: -0.0312, c: { fire: [0, 8], relA: [8, 66], relB: [66, 132], hol: [132, 144], draw: [144, 176], idle: [176, 204], mel: [204, 222] } },
  xpr: { tex: { arms: 'arms', xpr0: 'xpr0', xpr1: 'xpr1', xpr2: 'xpr2', xpr3: 'xpr3', xpr4: 'xpr4', xpr5: 'xpr5' }, root: 5, grip: [0, -2.7, 0.98], muz: [0, 10, 75.3], hip: [14, 24.5, -30], ads: [0, 16.82, -17], adsP: 0, c: { fire: [0, 8], relA: [8, 66], relB: [66, 132], hol: [132, 144], draw: [144, 176], idle: [176, 204], mel: [204, 222] } },
  lmg: { tex: { arms: 'arms', lmg0: 'lmg0', lmg1: 'lmg1' }, root: 5, grip: [0, -2.7, 0.98], muz: [0, 10, 77.8], hip: [14, 24.5, -30], ads: [-0.5, 18.3, -26], adsP: 0, c: { fire: [0, 8], relA: [8, 66], relB: [66, 132], hol: [132, 144], draw: [144, 176], idle: [176, 204], mel: [204, 222] } },
  mgl: { tex: { arms: 'arms', mgl0: 'mgl0', mgl1: 'mgl1' }, root: 5, grip: [0, -2.7, 0.98], muz: [0, 10, 65.2], hip: [14, 24.5, -30], ads: [0, 16.82, -17], adsP: 0, c: { fire: [0, 8], relA: [8, 66], relB: [66, 132], hol: [132, 144], draw: [144, 176], idle: [176, 204], mel: [204, 222] } },
  deagle: { tex: { material: 'arms', deagle0: 'deagle0', deagle1: 'deagle1', deagle2: 'deagle2', deagle3: 'deagle3', deagle4: 'deagle4', deagle5: 'deagle5', deagle6: 'deagle6' }, root: 57, grip: [0, -1.55, -0.08], muz: [0, 7.4, 42.2], hip: [8.5, 25, -22], ads: [0, 9.45, -30], adsP: 0, c: { fire: [0, 8], relA: [9, 64], relB: [65, 130], hol: [131, 142], draw: [142, 177], idle: [179, 204], mel: [205, 224] } },
  awm: { tex: { arms: 'arms', awm: 'awm' }, root: 57, grip: [0, -1.16, 1.83], muz: [0, 7.6, 107.9], hip: [14, 22.5, -32], ads: [0, 14.08, -6], adsP: 0, c: { fire: [0, 48], fsp: 1.4, bolt: [9, 48], rel: [48, 96], hol: [96, 108], draw: [108, 147], idle: [147, 180], mel: [180, 200] } },
  spas: { tex: { material: 'arms', spas0: 'spas0', spas1: 'spas1', spas2: 'spas2', spas3: 'spas3' }, root: 57, grip: [0, -2.07, 0.66], muz: [0, 8.5, 83.9], hip: [14, 23, -28], ads: [0, 14.9, -4], adsP: -0.0187, c: { fire: [0, 12], pump: [0, 36], rel: [36, 87], ins: [45, 60], hol: [87, 102], draw: [102, 129], idle: [129, 159], mel: [159, 180] } },
  throw: { tex: { arms: 'throw' }, hand: [40, 44, 49, 52], hip: [0, 20, -30], c: { all: [0, 30] } },
};

const stores = new WeakMap();
const texStores = new WeakMap();
const mapOf = (W, R) => { let m = W.get(R); if (!m) { m = new Map(); W.set(R, m); } return m; };

async function fetchFPZ(url) {
  const raw = await (await resBlob(url)).arrayBuffer();
  const u = new Uint8Array(raw, 0, 2);
  if (u[0] !== 0x1f || u[1] !== 0x8b) return raw;
  const DS = globalThis.DecompressionStream;
  if (DS) { try { return await new Response(new Blob([raw]).stream().pipeThrough(new DS('gzip'))).arrayBuffer(); } catch {} }
  const out = gunzip(new Uint8Array(raw));
  return out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength);
}
const halfOn = new WeakSet();
export function setFPGHalf(R, on) { if (on) halfOn.add(R); else halfOn.delete(R); }
async function fetchImg(url, half) {
  const b = await resBlob(url);
  let bm = null;
  try { bm = await createImageBitmap(b, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' }); } catch { bm = null; }
  if (!bm) return new Promise((res, rej) => { const im = new Image(); const u = URL.createObjectURL(b); im.onload = () => { URL.revokeObjectURL(u); res(im); }; im.onerror = (e) => { URL.revokeObjectURL(u); rej(e); }; im.src = u; });
  if (!half || bm.width < 128) return bm;
  try { const sm = await createImageBitmap(bm, { resizeWidth: bm.width >> 1, resizeHeight: bm.height >> 1, resizeQuality: 'medium', premultiplyAlpha: 'none' }); bm.close(); return sm; } catch { return bm; }
}
const filesOf = new Map();
export function fpFiles(kind) {
  if (filesOf.has(kind)) return filesOf.get(kind);
  const C = FPG[kind];
  if (!C) return [];
  const out = [`${BASE.slice(1)}/${kind}.fpz`];
  filesOf.set(kind, out);
  for (const name of new Set(Object.values(C.tex))) {
    out.push(`${BASE.slice(1)}/${name}_d.webp`);
    if (!/lens|glass/.test(name)) out.push(`${BASE.slice(1)}/${name}_n.webp`);
  }
  return out;
}
export function fpgReady(R, kind) {
  const m = R && stores.get(R);
  const e = m && m.get(kind);
  return e && e.ready ? e : null;
}
export function fpgFailed(R, kind) {
  const m = R && stores.get(R);
  const e = m && m.get(kind);
  return !!(e && !e.ready && e.fail >= 3);
}
function texOf(R, name) {
  const texStore = mapOf(texStores, R);
  let t = texStore.get(name);
  if (!t) {
    const half = halfOn.has(R);
    t = Promise.all([fetchImg(`${BASE}/${name}_d.webp`, half), /lens|glass/.test(name) ? null : fetchImg(`${BASE}/${name}_n.webp`, half).catch(() => null)]).then(([d, n]) => {
      const o = { d: R.texture(d), n: n ? R.texture(n) : null };
      if (d.close) d.close();
      if (n && n.close) n.close();
      return o;
    });
    t.catch(() => texStore.delete(name));
    texStore.set(name, t);
  }
  return t;
}

export function getFPG(R, kind) {
  const C = FPG[kind];
  if (!C || !R) return null;
  const store = mapOf(stores, R);
  let e = store.get(kind);
  if (!e) {
    if (!resReady(fpFiles(kind))) return null;
    e = { ready: false, fail: 0 };
    store.set(kind, e);
    const go = () => {
      fetchFPZ(`${BASE}/${kind}.fpz`).then(async (buf) => {
        const M = parseFPM(buf);
        const mesh = R.tskin({ verts: M.verts, idx: M.idx, ni: M.ni, nb: M.nu });
        const gl = M.groups.filter((g) => C.tex[g.key]);
        const txs = await Promise.all(gl.map((g) => texOf(R, C.tex[g.key])));
        const groups = gl.map((g, i) => { const name = C.tex[g.key]; return { off: g.start, cnt: g.count, tex: txs[i].d, nrm: txs[i].n, arms: name === 'arms' || name === 'throw', lens: /lens/.test(name) }; });
        const LQ = new Float32Array(M.nb * 4), LT = new Float32Array(M.nb * 3), W = new Float32Array(M.nb * 12);
        let Gi = null, tp = null;
        if (C.root != null) {
          fpmLocals(M, C.c.idle[0], LQ, LT);
          fpmWorld(M, LQ, LT, W);
          const o = C.root * 12;
          Gi = m4.inv(new Float32Array([W[o], W[o + 4], W[o + 8], 0, W[o + 1], W[o + 5], W[o + 9], 0, W[o + 2], W[o + 6], W[o + 10], 0, W[o + 3], W[o + 7], W[o + 11], 1]));
          const skin = new Float32Array(M.nu * 12);
          fpmSkin(M, W, skin, null);
          const go = (GUNS[kind] && GUNS[kind].grip.o) || [0, 0, 0], gp = C.grip || [0, 0, 0];
          const Mtp = m4.mul(new Float32Array([0.01, 0, 0, 0, 0, 0.01, 0, 0, 0, 0, 0.01, 0, go[0] - gp[0] * 0.01, go[1] - gp[1] * 0.01, go[2] - gp[2] * 0.01, 1]), Gi);
          const mz = C.muz;
          tp = { skin, M: Mtp, groups: groups.filter((g) => !g.arms), muz: [go[0] + (mz[0] - gp[0]) * 0.01, go[1] + (mz[1] - gp[1]) * 0.01, go[2] + (mz[2] - gp[2]) * 0.01] };
        }
        Object.assign(e, { M, mesh, groups, Gi, tp, ready: true });
      }).catch(() => { e.fail++; if (e.fail < 3) setTimeout(go, 2500 * e.fail); });
    };
    go();
  }
  return e.ready ? e : null;
}

function qFromM(m) {
  const t = m[0] + m[5] + m[10];
  let x, y, z, w;
  if (t > 0) { const s = Math.sqrt(t + 1) * 2; w = 0.25 * s; x = (m[6] - m[9]) / s; y = (m[8] - m[2]) / s; z = (m[1] - m[4]) / s; }
  else if (m[0] > m[5] && m[0] > m[10]) { const s = Math.sqrt(1 + m[0] - m[5] - m[10]) * 2; w = (m[6] - m[9]) / s; x = 0.25 * s; y = (m[4] + m[1]) / s; z = (m[8] + m[2]) / s; }
  else if (m[5] > m[10]) { const s = Math.sqrt(1 + m[5] - m[0] - m[10]) * 2; w = (m[8] - m[2]) / s; x = (m[4] + m[1]) / s; y = 0.25 * s; z = (m[9] + m[6]) / s; }
  else { const s = Math.sqrt(1 + m[10] - m[0] - m[5]) * 2; w = (m[1] - m[4]) / s; x = (m[8] + m[2]) / s; y = (m[9] + m[6]) / s; z = 0.25 * s; }
  return [x, y, z, w];
}
function rigToCam(C, e, a, out) {
  let qx = 0, qy = 0, qz = 0, qw = 1, tx = -C.hip[0] * 0.01, ty = -C.hip[1] * 0.01, tz = -C.hip[2] * 0.01;
  if (a > 0.001 && e.Gi && C.ads) {
    const p = C.adsP || 0, cp = Math.cos(p), sp = Math.sin(p);
    const Rc = new Float32Array([1, 0, 0, 0, 0, cp, sp, 0, 0, -sp, cp, 0, 0, 0, 0, 1]);
    const E = C.ads;
    const T = m4.mul(Rc, m4.mul(new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -E[0], -E[1], -E[2], 1]), e.Gi));
    const q = qFromM(T);
    const d = q[3] < 0 ? -1 : 1;
    const ax = q[0] * d, ay = q[1] * d, az = q[2] * d, aw = q[3] * d;
    qx = ax * a; qy = ay * a; qz = az * a; qw = 1 - a + aw * a;
    const l = 1 / Math.hypot(qx, qy, qz, qw); qx *= l; qy *= l; qz *= l; qw *= l;
    tx = lerp(tx, T[12] * 0.01, a); ty = lerp(ty, T[13] * 0.01, a); tz = lerp(tz, T[14] * 0.01, a);
  }
  const s = 0.01;
  const xx = qx * qx, yy = qy * qy, zz = qz * qz, xy = qx * qy, xz = qx * qz, yz = qy * qz, wx = qw * qx, wy = qw * qy, wz = qw * qz;
  out[0] = (1 - 2 * (yy + zz)) * s; out[1] = 2 * (xy - wz) * s; out[2] = 2 * (xz + wy) * s; out[3] = tx;
  out[4] = 2 * (xy + wz) * s; out[5] = (1 - 2 * (xx + zz)) * s; out[6] = 2 * (yz - wx) * s; out[7] = ty;
  out[8] = 2 * (xz - wy) * s; out[9] = 2 * (yz + wx) * s; out[10] = (1 - 2 * (xx + yy)) * s; out[11] = tz;
  return out;
}

function stateOf(F, e) {
  if (!F.gl || F.gl.e !== e) {
    const nb = e.M.nb;
    F.gl = { e, LQ: new Float32Array(nb * 4), LT: new Float32Array(nb * 3), Q2: new Float32Array(nb * 4), T2: new Float32Array(nb * 3), FQ: new Float32Array(nb * 4), FT: new Float32Array(nb * 3), W: new Float32Array(nb * 12), skin: new Float32Array(e.M.nu * 12), A: new Float32Array(12), mode: '', bw: 1, idleT: 0, has: false };
  }
  return F.gl;
}

function pick(F, C, s, st) {
  const c = C.c;
  if (F.swap > 0 && F.swap < 0.5 && !F.drawOn) return ['hol', lerp(c.hol[0], c.hol[1], ss(0, 1, F.swap * 2))];
  if (F.swap >= 0.5 && F.drawT == null) F.drawT = 0;
  if (F.mel >= 0) return ['mel', lerp(c.mel[0], c.mel[1], F.mel)];
  if (F.rel >= 0) {
    if (!st.relOn) { st.relOn = true; st.relK = c.rel ? 'rel' : s.mag > 0 ? 'relA' : 'relB'; st.relN = Math.max(1, s.need || 1); }
    if (C.c.ins && st.relK === 'rel') {
      const p = F.rel, a = 0.14, b = 0.8;
      if (p < a) return ['rel', lerp(c.rel[0], c.ins[0], p / a)];
      if (p < b) { const k = ((p - a) / (b - a)) * st.relN; return ['rel', lerp(c.ins[0], c.ins[1], k - Math.floor(k))]; }
      return ['rel', lerp(c.ins[1], c.rel[1], (p - b) / (1 - b))];
    }
    const seg = c[st.relK];
    return ['rel', lerp(seg[0], seg[1], F.rel)];
  }
  st.relOn = false;
  if (F.drawT != null) {
    const len = c.draw[1] - c.draw[0];
    const f = F.drawT * RATE * 1.7;
    if (f < len) return ['draw', c.draw[0] + f];
    F.drawT = null;
  }
  if (F.shotT != null) {
    const seg = c.pump && s.pump ? c.pump : c.fire;
    const sp = c.pump && s.pump ? (seg[1] - seg[0]) / RATE / 0.66 : c.fsp || 1;
    const f = F.shotT * RATE * sp;
    if (f < seg[1] - seg[0]) return ['fire', seg[0] + f];
    F.shotT = null;
  }
  const L = c.idle[1] - c.idle[0];
  const p = (st.idleT * RATE * 0.8) % (2 * L);
  return ['idle', c.idle[0] + Math.min(L - 0.001, p > L ? 2 * L - p : p)];
}

export function fpGLItems(out, R, F, s, cam, camM) {
  const throwing = F.thr >= 0 || F.thrHold > 0;
  const kind = throwing ? 'throw' : F.kind;
  const e = getFPG(R, kind);
  if (!throwing) getFPG(R, 'throw');
  if (!e) return null;
  const C = FPG[kind];
  const st = stateOf(F, e);
  const dt = s.dt;
  st.idleT += dt;
  if (F.shotT != null) F.shotT += dt;
  if (F.drawT != null) F.drawT += dt;
  let mode, fr;
  if (throwing) {
    mode = 'thr';
    if (F.thrHold > 0) fr = lerp(0, 6, ss(0, 0.25, F.thrHold));
    else fr = lerp(6, 30, F.thr);
  } else [mode, fr] = pick(F, C, s, st);
  const M = e.M;
  fpmLocals(M, fr, st.Q2, st.T2);
  if (!st.has) { st.LQ.set(st.Q2); st.LT.set(st.T2); st.has = true; st.mode = mode; }
  if (mode !== st.mode) {
    st.FQ.set(st.LQ); st.FT.set(st.LT);
    st.bw = 0; st.mode = mode;
  }
  st.bw = Math.min(1, st.bw + dt / (mode === 'fire' ? 0.05 : 0.12));
  if (st.bw < 1) { st.LQ.set(st.FQ); st.LT.set(st.FT); fpmBlend(M.nb, st.LQ, st.LT, st.Q2, st.T2, ss(0, 1, st.bw)); }
  else { st.LQ.set(st.Q2); st.LT.set(st.T2); }
  fpmWorld(M, st.LQ, st.LT, st.W);
  const a = throwing ? 0 : F.ads;
  rigToCam(C, e, a, st.A);
  fpmSkin(M, st.W, st.skin, st.A);
  const L = camM;
  const hide = s.scope && a > 0.85;
  if (!hide) for (const g of e.groups) { if (g.lens && a > 0.45) continue; out.push({ mesh: e.mesh, off: g.off, cnt: g.cnt, tex: g.tex, nrm: g.nrm, skin: st.skin, model: L, gloss: !g.arms && !g.lens, col: g.lens ? LENS : g.arms ? ARMS : GUNC }); }
  const res = { L, a, hide };
  const A = st.A, W = st.W;
  const toCam = (x, y, z) => [A[0] * x + A[1] * y + A[2] * z + A[3], A[4] * x + A[5] * y + A[6] * z + A[7], A[8] * x + A[9] * y + A[10] * z + A[11]];
  if (C.root != null) {
    const o = C.root * 12, m = C.muz;
    const px = W[o] * m[0] + W[o + 1] * m[1] + W[o + 2] * m[2] + W[o + 3], py = W[o + 4] * m[0] + W[o + 5] * m[1] + W[o + 6] * m[2] + W[o + 7], pz = W[o + 8] * m[0] + W[o + 9] * m[1] + W[o + 10] * m[2] + W[o + 11];
    res.muz = toCam(px, py, pz);
    F.muzCam = res.muz;
  }
  if (throwing && C.hand) {
    let x = 0, y = 0, z = 0;
    for (const b of C.hand) { x += W[b * 12 + 3]; y += W[b * 12 + 7]; z += W[b * 12 + 11]; }
    const n = C.hand.length;
    res.hand = toCam(x / n, y / n, z / n);
  }
  return res;
}

const ARMS = new Float32Array([1, 1, 1, 0]);
const GUNC = new Float32Array([1, 1, 1, 0]);
const LENS = new Float32Array([0.35, 0.4, 0.45, 0.3]);

const TP_ORDER = ['rifle', 'smg', 'pistol', 'shotgun', 'sniper'];
export function tpGunItems(out, R, kind, Gm, cast) {
  let e = FPG[kind] && FPG[kind].root != null ? getFPG(R, kind) : null;
  if (!e || !e.tp) { e = null; for (const k of TP_ORDER) { const f = fpgReady(R, k); if (f && f.tp) { e = f; break; } } }
  if (!e) return null;
  const model = m4.mul(Gm, e.tp.M);
  for (const g of e.tp.groups) out.push({ mesh: e.mesh, off: g.off, cnt: g.cnt, tex: g.tex, nrm: g.nrm, skin: e.tp.skin, model, gloss: !g.lens, col: g.lens ? LENS : GUNC, cast });
  return e.tp.muz;
}
