import { sampleClip, poseSkin } from './zmodel.js';

export const SCHAR = [
  { k: 'ch06', n: 'Jay', gun: 'rifle', v: 'm' },
  { k: 'ch02', n: 'Maya', gun: 'shotgun', v: 'f' },
  { k: 'ch31', n: 'Rin', gun: 'sniper', v: 'f' },
  { k: 'remy', n: 'Remy', gun: 'smg', v: 'm' },
  { k: 'ch05', n: 'Kane', gun: 'shotgun', v: 'm' },
  { k: 'ch03', n: 'Zoe', gun: 'smg', v: 'f' },
  { k: 'ch29', n: 'Lily', gun: 'pistol', v: 'f' },
  { k: 'medea', n: 'Medea', gun: 'rifle', v: 'f' },
  { k: 'lola', n: 'Lola', gun: 'smg', v: 'f' },
  { k: 'eve', n: 'Eve', gun: 'sniper', v: 'f' },
  { k: 'ch20', n: 'Max', gun: 'rifle', v: 'm' },
];
export const GUN_SV = { rifle: 'jay', shotgun: 'maya', smg: 'tom', sniper: 'rin', pistol: 'doc' };
export function charOf(sv, col) {
  const c = col | 0;
  if (c >= 100 && SCHAR[c - 100]) return SCHAR[c - 100];
  const L = SCHAR.filter((x) => GUN_SV[x.gun] === sv);
  const pool = L.length ? L : SCHAR;
  return pool[((c % pool.length) + pool.length) % pool.length];
}
export const charCol = (k) => 100 + Math.max(0, SCHAR.findIndex((c) => c.k === k));

export const EMO_CLIP = { wave: 'e_wave', cheer: 'e_cheer', point: 'e_point', thumbs: 'e_thumbs', salute: 'e_salute', dance: 'e_dance', laugh: 'e_laugh', flip: 'e_flip', samba: 'e_samba', hiphop: 'e_hiphop', clap: 'e_clap', victory: 'e_victory' };
export const EMO_DUR = { wave: 3.2, cheer: 5.8, point: 3.9, thumbs: 3.6, salute: 3.4, dance: 10.4, laugh: 6.5, flip: 2.0, samba: 10.7, hiphop: 12.6, clap: 4.6, victory: 5.6 };
const EMO_REP = { wave: 'pp', cheer: 'pp', point: 'pp', thumbs: 'pp', laugh: 'pp', dance: 'loop', samba: 'loop', hiphop: 'loop', clap: 'loop', victory: 'loop' };
export const emoDur = (k) => EMO_DUR[k] || 2.7;

const NB = 52, HAND_R = 28;
const UPPER = []; for (let i = 1; i <= 43; i++) UPPER.push(i);
const ARMS = []; for (let i = 6; i <= 43; i++) ARMS.push(i);
const LOCO = {
  F: { walk: ['walk', 'p_walk'], run: ['s_run'], spr: ['fast'] },
  B: { walk: ['s_back'], run: ['r_back'] },
  L: { walk: ['w_strl', 's_strl'], run: ['l_str', 's_strl'] },
  R: { walk: ['w_strr', 's_strr'], run: ['r_str', 'w_strr'] },
};
const LOCO_C = { F: { walk: ['c_fwd'], run: [] }, B: { walk: ['c_back'], run: [] }, L: { walk: ['c_left'], run: [] }, R: { walk: ['c_right'], run: [] } };
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const first = (C, L) => { for (const n of L) if (C[n]) return n; return null; };
const pistolish = (w) => w === 'pistol' || w === 'deagle';

function qmul(o, oi, a, ai, b, bi) {
  const ax = a[ai], ay = a[ai + 1], az = a[ai + 2], aw = a[ai + 3];
  const bx = b[bi], by = b[bi + 1], bz = b[bi + 2], bw = b[bi + 3];
  o[oi] = aw * bx + ax * bw + ay * bz - az * by;
  o[oi + 1] = aw * by - ax * bz + ay * bw + az * bx;
  o[oi + 2] = aw * bz + ax * by - ay * bx + az * bw;
  o[oi + 3] = aw * bw - ax * bx - ay * by - az * bz;
}
function nlerp(o, oi, a, ai, b, bi, t) {
  let bx = b[bi], by = b[bi + 1], bz = b[bi + 2], bw = b[bi + 3];
  if (a[ai] * bx + a[ai + 1] * by + a[ai + 2] * bz + a[ai + 3] * bw < 0) { bx = -bx; by = -by; bz = -bz; bw = -bw; }
  const s = 1 - t;
  const x = a[ai] * s + bx * t, y = a[ai + 1] * s + by * t, z = a[ai + 2] * s + bz * t, w = a[ai + 3] * s + bw * t;
  const l = 1 / (Math.hypot(x, y, z, w) || 1);
  o[oi] = x * l; o[oi + 1] = y * l; o[oi + 2] = z * l; o[oi + 3] = w * l;
}
const T4 = new Float32Array(4), T5 = new Float32Array(4), T6 = new Float32Array(4);
function axisQ(o, x, y, z, ang) { const s = Math.sin(ang / 2); o[0] = x * s; o[1] = y * s; o[2] = z * s; o[3] = Math.cos(ang / 2); return o; }
function conj(o, a, ai) { o[0] = -a[ai]; o[1] = -a[ai + 1]; o[2] = -a[ai + 2]; o[3] = a[ai + 3]; return o; }

function sampleK(md, C, name, t, q, hp) {
  const c = C[name];
  sampleClip(c, NB, t, q, hp);
  const k = md.M.hipsH / c.srcH;
  hp[0] *= k; hp[1] *= k; hp[2] *= k;
}

const bindY = (M, i) => {
  const b = M.ib, o = i * 12;
  if (!b || b.length < o + 12) return 0;
  const k = b[o] * b[o] + b[o + 4] * b[o + 4] + b[o + 8] * b[o + 8] || 1;
  return -(b[o + 1] * b[o + 3] + b[o + 5] * b[o + 7] + b[o + 9] * b[o + 11]) / k;
};
const HEAD_Y = 1.554, SHOULDER_Y = 1.4365;
export function ssScale(M) {
  if (M.ssK) return M.ssK;
  const hd = bindY(M, 5), sh = (bindY(M, 7) + bindY(M, 26)) / 2;
  let s = hd > sh && sh > M.hipsH && M.hipsH > 0 ?Math.sqrt((HEAD_Y / hd) * (SHOULDER_Y / sh)) : 0;
  if (!(s > 0.01 && s < 100)) s = M.hipsH > 1.5 || M.hipsH < 0.5 ? 0.97 / M.hipsH : 1;
  M.ssK = s;
  return s;
}

export function ssNew(md) {
  const f = () => new Float32Array(NB * 4);
  return {
    q: f(), qa: f(), qb: f(), qu: f(), qv: f(), qx: f(), qs: f(), hp: [0, 0, 0], ha: [0, 0, 0], hb: [0, 0, 0], hu: [0, 0, 0], hv: [0, 0, 0], hx: [0, 0, 0], hs: [0, 0, 0],
    W: new Float32Array(NB * 12), skin: new Float32Array(NB * 12), M: new Float32Array(16), G: new Float32Array(16),
    ph: Math.random(), it: Math.random() * 5, v: 0, dc: 1, ds: 0, aimW: 0, fireT: 9, lastFire: 0, relW: 0, thrW: 0, melW: 0, mode: '', modeT: 0, snapW: 0, hideGun: false, s: ssScale(md.M),
  };
}

function accum(acc, hacc, q, hp, w, firstOne) {
  if (firstOne) {
    for (let i = 0; i < NB * 4; i++) acc[i] = q[i] * w;
    hacc[0] = hp[0] * w; hacc[1] = hp[1] * w; hacc[2] = hp[2] * w;
    return;
  }
  for (let i = 0; i < NB; i++) {
    const k = i * 4;
    const sgn = acc[k] * q[k] + acc[k + 1] * q[k + 1] + acc[k + 2] * q[k + 2] + acc[k + 3] * q[k + 3] < 0 ? -w : w;
    acc[k] += q[k] * sgn; acc[k + 1] += q[k + 1] * sgn; acc[k + 2] += q[k + 2] * sgn; acc[k + 3] += q[k + 3] * sgn;
  }
  hacc[0] += hp[0] * w; hacc[1] += hp[1] * w; hacc[2] += hp[2] * w;
}
function normAll(q) { for (let i = 0; i < NB; i++) { const k = i * 4; const l = 1 / (Math.hypot(q[k], q[k + 1], q[k + 2], q[k + 3]) || 1); q[k] *= l; q[k + 1] *= l; q[k + 2] *= l; q[k + 3] *= l; } }

function locomotion(md, C, S, inp, dt) {
  const v = S.v;
  const pist = pistolish(inp.w);
  const dirs = [['F', Math.max(0, S.dc)], ['B', Math.max(0, -S.dc)], ['L', Math.max(0, S.ds)], ['R', Math.max(0, -S.ds)]];
  const tot = dirs.reduce((a, d) => a + d[1], 0) || 1;
  const crouch = !!inp.crouch;
  const RUNAT = { F: [1.7, 3.0], B: [1.3, 2.4], L: [0.8, 1.5], R: [0.8, 1.5] }, wSpr = inp.sprint && !crouch ? ss(4.4, 5.6, v) : 0;
  const parts = [];
  for (const [d, wd0] of dirs) {
    const wd = wd0 / tot;
    if (wd < 0.02) continue;
    const L = crouch ? LOCO_C[d] : LOCO[d], wRun = crouch ? 0 : ss(RUNAT[d][0], RUNAT[d][1], v);
    const walk = d === 'F' && pist && !crouch ? first(C, ['p_walk']) : first(C, L.walk);
    const run = d === 'F' && pist && !crouch ? first(C, ['p_run']) : first(C, L.run);
    const spr = d === 'F' && L.spr ? first(C, L.spr) : null;
    const wr = d === 'F' && spr ? wRun * (1 - wSpr) : wRun;
    if (walk && 1 - wRun > 0.02) parts.push([walk, wd * (1 - wRun)]);
    if (run && wr > 0.02) parts.push([run, wd * wr]);
    if (spr && wSpr > 0.02) parts.push([spr, wd * wSpr]);
  }
  let f = 0, wsum = 0;
  for (const p of parts) {
    const c = C[p[0]];
    const ns = c.speed * (md.M.hipsH / c.srcH) * S.s;
    const r = clamp(v / Math.max(0.05, ns), 0.5, 2.2);
    f += p[1] * r / c.dur; wsum += p[1];
  }
  if (wsum > 0) S.ph = (S.ph + (f / wsum) * dt) % 1;
  let firstOne = true;
  for (const p of parts) {
    const c = C[p[0]];
    sampleK(md, C, p[0], (((S.ph + (c.ph || 0)) % 1) + 1) % 1 * c.dur, S.qx, S.hx);
    accum(S.qa, S.ha, S.qx, S.hx, p[1] / wsum, firstOne);
    firstOne = false;
  }
  if (firstOne) return false;
  normAll(S.qa);
  return true;
}

function applyUpper(S, wq, hipsBase, qu, huHipsIdx, mode, w, yawFix) {
  if (w <= 0.001) return;
  if (mode === 'arms') {
    for (const i of ARMS) nlerp(wq, i * 4, wq, i * 4, qu, i * 4, w);
    return;
  }
  conj(T4, wq, 0);
  axisQ(T5, 0, 1, 0, yawFix || 0);
  qmul(T6, 0, T5, 0, qu, 0);
  qmul(T5, 0, T4, 0, T6, 0);
  qmul(T6, 0, T5, 0, qu, 4);
  nlerp(wq, 4, wq, 4, T6, 0, w);
  for (const i of UPPER) if (i > 1) nlerp(wq, i * 4, wq, i * 4, qu, i * 4, w);
}

const PW = new Float32Array(8);
function pitchSpine(S, q, ang) {
  if (Math.abs(ang) < 1e-4) return;
  const W = PW;
  axisQ(T4, 1, 0, 0, ang * 0.5);
  for (const bone of [1, 3]) {
    W[0] = q[0]; W[1] = q[1]; W[2] = q[2]; W[3] = q[3];
    for (let b = 1; b < bone; b++) { qmul(T5, 0, W, 0, q, b * 4); W[0] = T5[0]; W[1] = T5[1]; W[2] = T5[2]; W[3] = T5[3]; }
    conj(T5, W, 0);
    qmul(T6, 0, T4, 0, W, 0);
    qmul(W, 4, T5, 0, T6, 0);
    qmul(T6, 0, W, 4, q, bone * 4);
    q[bone * 4] = T6[0]; q[bone * 4 + 1] = T6[1]; q[bone * 4 + 2] = T6[2]; q[bone * 4 + 3] = T6[3];
  }
}

const YAW_MEMO = new WeakMap();
function gunYaw(md, C, clip, t) {
  let m = YAW_MEMO.get(md);
  if (!m) { m = {}; YAW_MEMO.set(md, m); }
  const key = clip + ':' + t;
  if (m[key] != null) return m[key];
  const q = new Float32Array(NB * 4), hp = [0, 0, 0], W = new Float32Array(NB * 12), o = new Float32Array(NB * 12);
  sampleK(md, C, clip, t, q, hp);
  poseSkin(md.M, q, hp, 1, W, o);
  const P = (i) => [W[i * 12 + 3], W[i * 12 + 7], W[i * 12 + 11]];
  let d;
  if (clip === 'p_idle' || clip === 'p_run' || clip === 'p_walk') { const a = P(26), b = P(HAND_R); d = [b[0] - a[0], b[2] - a[2]]; }
  else { const r = P(35), l = P(16); d = [l[0] - r[0], l[2] - r[2]]; }
  m[key] = -Math.atan2(d[0], d[1]);
  return m[key];
}

export function ssSocket(md, C, kind) {
  const key = pistolish(kind) ? 'sockP' : 'sockR';
  if (md[key]) return md[key];
  const clip = pistolish(kind) ? 'p_idle' : 's_fire';
  if (!C[clip]) return null;
  const q = new Float32Array(NB * 4), hp = [0, 0, 0], W = new Float32Array(NB * 12), o = new Float32Array(NB * 12);
  sampleK(md, C, clip, 0, q, hp);
  const fix = gunYaw(md, C, clip, 0);
  axisQ(T5, 0, 1, 0, fix);
  qmul(T6, 0, T5, 0, q, 0);
  conj(T4, q, 0);
  const tmp = new Float32Array(4);
  qmul(tmp, 0, T6, 0, q, 4);
  qmul(T5, 0, T4, 0, tmp, 0);
  q[4] = T5[0]; q[5] = T5[1]; q[6] = T5[2]; q[7] = T5[3];
  poseSkin(md.M, q, hp, 1, W, o);
  const P = (i) => [W[i * 12 + 3], W[i * 12 + 7], W[i * 12 + 11]];
  let F;
  if (pistolish(kind)) { const a = P(26), b = P(HAND_R); F = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]; }
  else { const r = P(35), l = P(16); F = [l[0] - r[0], l[1] - r[1], l[2] - r[2]]; }
  let fl = Math.hypot(F[0], F[1], F[2]) || 1; F = [F[0] / fl, F[1] / fl, F[2] / fl];
  const U0 = [0, 1, 0], dU = U0[0] * F[0] + U0[1] * F[1] + U0[2] * F[2];
  let U = [U0[0] - F[0] * dU, U0[1] - F[1] * dU, U0[2] - F[2] * dU];
  const ul = Math.hypot(U[0], U[1], U[2]) || 1; U = [U[0] / ul, U[1] / ul, U[2] / ul];
  const X = [U[1] * F[2] - U[2] * F[1], U[2] * F[0] - U[0] * F[2], U[0] * F[1] - U[1] * F[0]];
  const a = P(32), b = P(41), c = P(36);
  const grip = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3];
  const h = HAND_R * 12;
  const Hm = [W[h], W[h + 1], W[h + 2], W[h + 3], W[h + 4], W[h + 5], W[h + 6], W[h + 7], W[h + 8], W[h + 9], W[h + 10], W[h + 11]];
  const R = [[Hm[0], Hm[1], Hm[2]], [Hm[4], Hm[5], Hm[6]], [Hm[8], Hm[9], Hm[10]]];
  const sc = Math.hypot(R[0][0], R[1][0], R[2][0]) || 1;
  const inv = (v) => [(R[0][0] * v[0] + R[1][0] * v[1] + R[2][0] * v[2]) / (sc * sc), (R[0][1] * v[0] + R[1][1] * v[1] + R[2][1] * v[2]) / (sc * sc), (R[0][2] * v[0] + R[1][2] * v[1] + R[2][2] * v[2]) / (sc * sc)];
  const t = inv([grip[0] - Hm[3], grip[1] - Hm[7], grip[2] - Hm[11]]);
  const res = { x: inv(X), y: inv(U), z: inv(F), t };
  md[key] = res;
  return res;
}

export function ssGun(S, md, C, kind, gripO, out) {
  const so = ssSocket(md, C, kind);
  if (!so) return null;
  const W = S.W, h = HAND_R * 12, M = S.M;
  const hm = (v, w) => [W[h] * v[0] + W[h + 1] * v[1] + W[h + 2] * v[2] + W[h + 3] * w, W[h + 4] * v[0] + W[h + 5] * v[1] + W[h + 6] * v[2] + W[h + 7] * w, W[h + 8] * v[0] + W[h + 9] * v[1] + W[h + 10] * v[2] + W[h + 11] * w];
  const mm = (v, w) => [M[0] * v[0] + M[4] * v[1] + M[8] * v[2] + M[12] * w, M[1] * v[0] + M[5] * v[1] + M[9] * v[2] + M[13] * w, M[2] * v[0] + M[6] * v[1] + M[10] * v[2] + M[14] * w];
  const n = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const X = n(mm(hm(so.x, 0), 0)), Y = n(mm(hm(so.y, 0), 0)), Z = n(mm(hm(so.z, 0), 0));
  const P = mm(hm(so.t, 1), 1);
  const g = gripO || [0, 0, 0];
  const px = P[0] - (X[0] * g[0] + Y[0] * g[1] + Z[0] * g[2]), py = P[1] - (X[1] * g[0] + Y[1] * g[1] + Z[1] * g[2]), pz = P[2] - (X[2] * g[0] + Y[2] * g[1] + Z[2] * g[2]);
  out[0] = X[0]; out[1] = X[1]; out[2] = X[2]; out[3] = 0;
  out[4] = Y[0]; out[5] = Y[1]; out[6] = Y[2]; out[7] = 0;
  out[8] = Z[0]; out[9] = Z[1]; out[10] = Z[2]; out[11] = 0;
  out[12] = px; out[13] = py; out[14] = pz; out[15] = 1;
  return out;
}

export function ssPose(md, C, S, inp, dt) {
  const M = md.M;
  S.v += (inp.v - S.v) * Math.min(1, dt * 10);
  if (inp.v > 0.05) { const tc = Math.cos(inp.mdir), ts = Math.sin(inp.mdir); const k = Math.min(1, dt * 9); S.dc += (tc - S.dc) * k; S.ds += (ts - S.ds) * k; }
  const pist = pistolish(inp.w);
  let mode = 'loco', full = null, fullT = 0;
  if (inp.dead >= 0 && C.s_die) { mode = 'dead'; full = 's_die'; fullT = Math.min(inp.dead, C.s_die.dur); }
  else if ((inp.st === 1 || inp.kneel) && C.s_kneel) { mode = 'kneel'; full = 's_kneel'; }
  else if (inp.slide && C.slide) { mode = 'slide'; full = 'slide'; }
  else if (inp.air && C.j_loop) { mode = 'air'; full = 'j_loop'; }
  else if (inp.emo && C[EMO_CLIP[inp.emo]]) {
    mode = 'emo:' + inp.emo; full = EMO_CLIP[inp.emo]; fullT = inp.emoT || 0;
    const ec = C[full], rep = EMO_REP[inp.emo];
    if (rep === 'pp') { const pq = fullT % (2 * ec.dur); fullT = pq > ec.dur ? 2 * ec.dur - pq : pq; } else if (rep === 'loop') fullT %= ec.dur;
  }
  if (mode !== S.mode) {
    if (S.mode) { S.qs.set(S.q); S.hs[0] = S.hp[0]; S.hs[1] = S.hp[1]; S.hs[2] = S.hp[2]; S.snapW = 1; }
    S.mode = mode; S.modeT = 0;
  }
  const crNow = mode === 'loco' && !!inp.crouch && !!C.c_idle;
  if (S.crP != null && crNow !== S.crP && S.snapW < 0.6) { S.qs.set(S.q); S.hs[0] = S.hp[0]; S.hs[1] = S.hp[1]; S.hs[2] = S.hp[2]; S.snapW = 1; }
  S.crP = crNow;
  S.modeT += dt;
  const q = S.q, hp = S.hp;
  if (full) {
    let t = mode === 'kneel' ? S.modeT + 1.2 : fullT;
    if (mode === 'slide') t = Math.min(S.modeT + (C.slide.ph || 0.2), C.slide.dur * 0.7);
    if (mode === 'air') { if (S.modeT < 0.3 && C.j_up) { full = 'j_up'; t = Math.min(C.j_up.dur, (C.j_up.ph || 0) + S.modeT * 1.4); } else t = S.modeT; }
    sampleK(md, C, full, t, q, hp);
  } else {
    S.it += dt;
    const crouch = !!inp.crouch && !!C.c_idle;
    const idle = crouch ? 'c_idle' : pist && C.p_idle ? 'p_idle' : 's_idle';
    const idur = C[idle].dur, ip = S.it % (2 * idur);
    sampleK(md, C, idle, ip > idur ? 2 * idur - ip : ip, S.qb, S.hb);
    const wMove = ss(0.12, 0.6, S.v);
    if (wMove > 0.001 && locomotion(md, C, S, crouch ? { ...inp, crouch } : inp, dt)) {
      for (let i = 0; i < NB; i++) nlerp(q, i * 4, S.qb, i * 4, S.qa, i * 4, wMove);
      for (let k = 0; k < 3; k++) hp[k] = S.hb[k] + (S.ha[k] - S.hb[k]) * wMove;
    } else { q.set(S.qb); hp[0] = S.hb[0]; hp[1] = S.hb[1]; hp[2] = S.hb[2]; }
    const armed = !!inp.w;
    if (armed) {
      const wSpr = inp.sprint ? ss(4.4, 5.6, S.v) : 0;
      const runClip = pist ? 'p_run' : 's_run';
      if (C[runClip] && wMove > 0.001 && !crouch) {
        const c = C[runClip];
        sampleK(md, C, runClip, (((S.ph + (c.ph || 0)) % 1) + 1) % 1 * c.dur, S.qu, S.hu);
        const fix = gunYaw(md, C, runClip, 0) * 0.5;
        applyUpper(S, q, null, S.qu, 0, 'full', wMove * (1 - wSpr), fix);
        if (wSpr > 0.001) {
          sampleK(md, C, idle, ip > idur ? 2 * idur - ip : ip, S.qv, S.hv);
          applyUpper(S, q, null, S.qv, 0, 'arms', wSpr * wMove, 0);
        }
      }
      if (inp.shot) S.fireT = 0;
      S.fireT += dt;
      const aimOn = inp.aiming && !inp.sprint ? 1 : 0;
      S.aimW += (aimOn - S.aimW) * Math.min(1, dt * 9);
      if (S.aimW > 0.002) {
        const aimClip = pist ? 'p_idle' : 's_fire';
        if (C[aimClip]) {
          sampleK(md, C, aimClip, pist ? 0 : Math.min(S.fireT, C.s_fire.dur), S.qu, S.hu);
          applyUpper(S, q, null, S.qu, 0, 'full', S.aimW, gunYaw(md, C, aimClip, 0));
        }
      }
    }
    const relOn = inp.rel >= 0 && C.s_reload ? 1 : 0;
    S.relW += (relOn - S.relW) * Math.min(1, dt * 7);
    if (S.relW > 0.002 && C.s_reload) {
      const p = inp.rel >= 0 ? inp.rel : 1;
      sampleK(md, C, 's_reload', 0.35 + p * 2.6, S.qu, S.hu);
      applyUpper(S, q, null, S.qu, 0, 'full', S.relW, 0);
    }
    const thrOn = inp.thr >= 0 && C.s_toss ? 1 : 0;
    S.thrW += (thrOn - S.thrW) * Math.min(1, dt * 12);
    if (S.thrW > 0.002 && C.s_toss) {
      const pk = C.s_toss.ph || 1.8, p = inp.thr >= 0 ? inp.thr : 1;
      sampleK(md, C, 's_toss', pk - 0.3 + p * 0.85, S.qu, S.hu);
      applyUpper(S, q, null, S.qu, 0, 'full', S.thrW, 0);
    }
    const melOn = inp.mel >= 0 && C.melee ? 1 : 0;
    S.melW += (melOn - S.melW) * Math.min(1, dt * 14);
    if (S.melW > 0.002 && C.melee) {
      const pk = C.melee.ph || 0.95, p = inp.mel >= 0 ? inp.mel : 1;
      sampleK(md, C, 'melee', pk - 0.35 + p * 0.75, S.qu, S.hu);
      applyUpper(S, q, null, S.qu, 0, 'full', S.melW, 0);
    }
    if (inp.hit > 0.01 && C.s_hit) {
      sampleK(md, C, 's_hit', 0.05 + (1 - inp.hit) * 0.45, S.qu, S.hu);
      applyUpper(S, q, null, S.qu, 0, 'full', inp.hit * 0.75, 0);
    }
    if (armed) pitchSpine(S, q, -(inp.aim || 0) * (0.35 + 0.65 * Math.max(S.aimW, 0.4)));
  }
  if (S.snapW > 0) {
    S.snapW = Math.max(0, S.snapW - dt / 0.28);
    const w = S.snapW * S.snapW * (3 - 2 * S.snapW);
    for (let i = 0; i < NB; i++) nlerp(q, i * 4, q, i * 4, S.qs, i * 4, w);
    for (let k = 0; k < 3; k++) hp[k] += (S.hs[k] - hp[k]) * w;
  }
  S.hideGun = !inp.w || (mode !== 'loco' && mode !== 'air') || S.thrW > 0.5;
  poseSkin(M, q, hp, 1, S.W, S.skin);
}

export function ssMatrix(S, x, y, z, yaw) {
  const c = Math.cos(yaw), s = Math.sin(yaw), k = S.s, o = S.M;
  o[0] = c * k; o[1] = 0; o[2] = -s * k; o[3] = 0;
  o[4] = 0; o[5] = k; o[6] = 0; o[7] = 0;
  o[8] = s * k; o[9] = 0; o[10] = c * k; o[11] = 0;
  o[12] = x; o[13] = y; o[14] = z; o[15] = 1;
  return o;
}

export function ssHead(S, out) {
  const W = S.W, o = 5 * 12, M = S.M;
  const lx = W[o + 3] + W[o + 1] * 0.1, ly = W[o + 7] + W[o + 5] * 0.1, lz = W[o + 11] + W[o + 9] * 0.1;
  out[0] = M[0] * lx + M[4] * ly + M[8] * lz + M[12];
  out[1] = M[1] * lx + M[5] * ly + M[9] * lz + M[13];
  out[2] = M[2] * lx + M[6] * ly + M[10] * lz + M[14];
  return out;
}
