import { BN, PARENT, DOG_PARENT } from './zbody.js';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const bell = (t, a, b) => (t <= a || t >= b ? 0 : Math.sin(((t - a) / (b - a)) * Math.PI));

export function makeRig(joints, dog = false) {
  const P = dog ? DOG_PARENT : PARENT;
  const n = P.length;
  return { n, J: joints, P, dog, G: new Float32Array(n * 16), S: new Float32Array(20 * 16), e: new Float32Array(n * 3), root: [0, 0, 0], rot: [0, 0, 0], done: new Uint8Array(n), ik: null, gun: null };
}

function eulerM(o, k, rx, ry, rz, tx, ty, tz) {
  const cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry), cz = Math.cos(rz), sz = Math.sin(rz);
  const a00 = cy * cz + sy * sx * sz, a01 = -cy * sz + sy * sx * cz, a02 = sy * cx;
  const a10 = cx * sz, a11 = cx * cz, a12 = -sx;
  const a20 = -sy * cz + cy * sx * sz, a21 = sy * sz + cy * sx * cz, a22 = cy * cx;
  o[k] = a00; o[k + 1] = a10; o[k + 2] = a20; o[k + 3] = 0;
  o[k + 4] = a01; o[k + 5] = a11; o[k + 6] = a21; o[k + 7] = 0;
  o[k + 8] = a02; o[k + 9] = a12; o[k + 10] = a22; o[k + 11] = 0;
  o[k + 12] = tx; o[k + 13] = ty; o[k + 14] = tz; o[k + 15] = 1;
}
const TMP = new Float32Array(16);
function mulTo(o, ok, a, ak, b, bk) {
  for (let c = 0; c < 4; c++) {
    const b0 = b[bk + c * 4], b1 = b[bk + c * 4 + 1], b2 = b[bk + c * 4 + 2], b3 = b[bk + c * 4 + 3];
    TMP[c * 4] = a[ak] * b0 + a[ak + 4] * b1 + a[ak + 8] * b2 + a[ak + 12] * b3;
    TMP[c * 4 + 1] = a[ak + 1] * b0 + a[ak + 5] * b1 + a[ak + 9] * b2 + a[ak + 13] * b3;
    TMP[c * 4 + 2] = a[ak + 2] * b0 + a[ak + 6] * b1 + a[ak + 10] * b2 + a[ak + 14] * b3;
    TMP[c * 4 + 3] = a[ak + 3] * b0 + a[ak + 7] * b1 + a[ak + 11] * b2 + a[ak + 15] * b3;
  }
  for (let i = 0; i < 16; i++) o[ok + i] = TMP[i];
}
export function apply(G, k, x, y, z) { return [G[k] * x + G[k + 4] * y + G[k + 8] * z + G[k + 12], G[k + 1] * x + G[k + 5] * y + G[k + 9] * z + G[k + 13], G[k + 2] * x + G[k + 6] * y + G[k + 10] * z + G[k + 14]]; }
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scl = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const nrm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const JP = (J, i) => [J[i * 3], J[i * 3 + 1], J[i * 3 + 2]];

function frameRot(o, k, dB, sB, dT, sT, pos) {
  const b1 = nrm(dB), b2 = nrm(sub(sB, scl(b1, dot(sB, b1)))), b3 = crs(b1, b2);
  const t1 = nrm(dT), t2 = nrm(sub(sT, scl(t1, dot(sT, t1)))), t3 = crs(t1, t2);
  for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) o[k + c * 4 + r] = t1[r] * b1[c] + t2[r] * b2[c] + t3[r] * b3[c];
  o[k + 3] = 0; o[k + 7] = 0; o[k + 11] = 0;
  o[k + 12] = pos[0]; o[k + 13] = pos[1]; o[k + 14] = pos[2]; o[k + 15] = 1;
}

function ikArm(rig, side, tgt) {
  const J = rig.J, G = rig.G;
  const iU = side > 0 ? BN.UAL : BN.UAR, iF = iU + 1, iH = iU + 2;
  const jS = JP(J, iU), jE = JP(J, iF), jW = JP(J, iH);
  const S = apply(G, BN.CHS * 16, jS[0] - J[6], jS[1] - J[7], jS[2] - J[8]);
  const a = Math.hypot(...sub(jE, jS)), b = Math.hypot(...sub(jW, jE));
  let W = tgt.w;
  let dv = sub(W, S);
  let d = Math.hypot(dv[0], dv[1], dv[2]);
  const mx = (a + b) * 0.995;
  if (d > mx) { W = add(S, scl(dv, mx / d)); dv = sub(W, S); d = mx; }
  if (d < Math.abs(a - b) + 0.02) { d = Math.abs(a - b) + 0.02; }
  const u = nrm(dv);
  const pole = tgt.pole || [side * 0.5, -1, -0.4];
  const v = nrm(sub(pole, scl(u, dot(pole, u))));
  const cosA = clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1), sinA = Math.sqrt(1 - cosA * cosA);
  const E = add(S, add(scl(u, cosA * a), scl(v, sinA * a)));
  const h = nrm(crs(v, u));
  const X = [-1, 0, 0];
  frameRot(G, iU * 16, nrm(sub(jE, jS)), X, nrm(sub(E, S)), h, S);
  frameRot(G, iF * 16, nrm(sub(jW, jE)), X, nrm(sub(W, E)), h, E);
  if (tgt.f && tgt.n) frameRot(G, iH * 16, [0, -1, 0], [-side, 0, 0], tgt.f, tgt.n, W);
  else frameRot(G, iH * 16, nrm(sub(jW, jE)), X, nrm(sub(W, E)), h, W);
  rig.done[iU] = 1; rig.done[iF] = 1; rig.done[iH] = 1;
}

const LOC = new Float32Array(16);
export function solve(rig) {
  const { n, J, P, G, S, e, root, rot } = rig;
  rig.done.fill(0);
  for (let i = 0; i < n; i++) {
    if (rig.done[i]) continue;
    if (!rig.dog && rig.ik && (i === BN.UAL || i === BN.UAR)) {
      const t = i === BN.UAL ? rig.ik.L : rig.ik.R;
      if (t) { ikArm(rig, i === BN.UAL ? 1 : -1, t); continue; }
    }
    const p = P[i];
    if (p < 0) {
      eulerM(G, 0, rot[0], rot[1], rot[2], J[0] + root[0], J[1] + root[1], J[2] + root[2]);
      if (e[0] || e[1] || e[2]) { eulerM(LOC, 0, e[0], e[1], e[2], 0, 0, 0); mulTo(G, 0, G, 0, LOC, 0); }
      continue;
    }
    eulerM(LOC, 0, e[i * 3], e[i * 3 + 1], e[i * 3 + 2], J[i * 3] - J[p * 3], J[i * 3 + 1] - J[p * 3 + 1], J[i * 3 + 2] - J[p * 3 + 2]);
    mulTo(G, i * 16, G, p * 16, LOC, 0);
  }
  for (let i = 0; i < n; i++) {
    const k = i * 16;
    const x = J[i * 3], y = J[i * 3 + 1], z = J[i * 3 + 2];
    for (let q = 0; q < 12; q++) S[k + q] = G[k + q];
    S[k + 12] = G[k + 12] - (G[k] * x + G[k + 4] * y + G[k + 8] * z);
    S[k + 13] = G[k + 13] - (G[k + 1] * x + G[k + 5] * y + G[k + 9] * z);
    S[k + 14] = G[k + 14] - (G[k + 2] * x + G[k + 6] * y + G[k + 10] * z);
    S[k + 15] = 1;
  }
  return S;
}

function setE(rig, i, x, y, z) { rig.e[i * 3] = x; rig.e[i * 3 + 1] = y; rig.e[i * 3 + 2] = z; }
function addE(rig, i, x, y, z) { rig.e[i * 3] += x; rig.e[i * 3 + 1] += y; rig.e[i * 3 + 2] += z; }

function legs(rig, ph, amp, knee, mdir, run, o = {}) {
  const cm = Math.cos(mdir), sm = Math.sin(mdir);
  for (const s of [1, -1]) {
    const ps = ph + (s > 0 ? 0 : Math.PI);
    const sw = Math.sin(ps), cw = Math.cos(ps);
    const lim = o.limp && o.limp === s ? 0.45 : 1;
    const th = amp * sw * (o.limp === s ? 0.75 : 1);
    const kn = (knee * Math.pow(Math.max(0, cw), 1.4) * lim + (0.08 + run * 0.25) * Math.max(0, -cw) * 0.6 + (o.bend || 0)) * (o.kneeK || 1);
    const iT = s > 0 ? BN.THL : BN.THR, iS = iT + 1, iF = iT + 2;
    const spread = (o.spread || 0.035) * s;
    setE(rig, iT, -th * cm - (o.bend || 0) * 0.5 - (o.thighF || 0), (o.turn || 0) * s, th * sm + spread);
    setE(rig, iS, kn, 0, -spread * 0.6);
    const toe = run * 0.5 * Math.max(0, Math.sin(ps - 0.6)) * Math.max(0, -cw);
    setE(rig, iF, -(kn - th * cm * 0.6) * 0.55 + toe + (o.drag === s ? 0.5 : 0) + (o.thighF || 0) * 0.5, (o.footOut === s ? 0.35 : 0) * s, -spread * 0.4);
  }
}

function armSwing(rig, ph, amp, elbow, o = {}) {
  for (const s of [1, -1]) {
    const ps = ph + (s > 0 ? Math.PI : 0);
    const iU = s > 0 ? BN.UAL : BN.UAR;
    const sw = Math.sin(ps + (o.lag || 0));
    setE(rig, iU, -amp * sw + (o.fwd || 0), 0, (o.out || 0.08) * s);
    setE(rig, iU + 1, -(elbow + Math.max(0, sw) * amp * 0.5), 0, 0);
    setE(rig, iU + 2, 0, 0, 0);
  }
}

export function gaitAdvance(st, speed, dt, stride) { st.ph = (st.ph || 0) + (speed * dt / stride) * Math.PI * 2; return st.ph; }

export function poseHuman(rig, s) {
  rig.e.fill(0);
  rig.root[0] = 0; rig.root[1] = 0; rig.root[2] = 0; rig.rot[0] = 0; rig.rot[1] = 0; rig.rot[2] = 0;
  rig.ik = null;
  const t = s.t || 0;
  const v = s.mv || 0;
  const w = clamp(v / 1.1, 0, 1), run = clamp((v - 2.6) / 2.2, 0, 1);
  const ph = s.ph || 0;
  const breathe = Math.sin(t * 1.7) * 0.015;
  if (s.st === 1) { downed(rig, s); return; }
  if (s.kneel) { kneel(rig, s); return; }
  const md = s.mdir || 0;
  legs(rig, ph, lerp(0.36, 0.78, run) * w, lerp(0.75, 1.65, run) * w, md, run, { spread: lerp(0.05, 0.03, w) });
  const bob = w * (run > 0.3 ? -0.045 * Math.abs(Math.sin(ph)) : -0.022 * (1 - Math.abs(Math.cos(ph))));
  rig.root[1] = bob - (1 - w) * 0.008;
  addE(rig, BN.PEL, 0, 0.1 * w * Math.sin(ph) * Math.cos(md), 0.035 * w * Math.sin(ph));
  const lean = run * 0.16 * Math.cos(md);
  const emo = s.emo && s.emo.k ? s.emo : null;
  const armed = !emo && s.w && s.w !== 'none';
  const aim = s.aim || 0;
  if (armed && s.w !== 'bat') {
    const ready = s.aiming ? 1 : 0.35;
    const tw = -0.06 * w * Math.sin(ph);
    setE(rig, BN.SPN, lean * 0.5 - aim * 0.25 + 0.04, tw, 0);
    setE(rig, BN.CHS, lean * 0.5 - aim * 0.35 + breathe, tw * 1.4 - 0.1, 0);
    setE(rig, BN.NCK, -aim * 0.2, 0.1, 0);
    setE(rig, BN.HED, -aim * 0.2 + 0.03 * ready, 0.02, -0.06 * ready);
    weaponHold(rig, s, ready, -(tw * 2.4 - 0.1), lean - aim * 0.6 + 0.04);
  } else if (armed && s.w === 'bat') {
    setE(rig, BN.SPN, lean * 0.5 + 0.03, 0, 0);
    setE(rig, BN.CHS, lean * 0.5 + breathe, -0.1 * w * Math.sin(ph), 0);
    batHold(rig, s);
  } else {
    setE(rig, BN.SPN, lean * 0.5 + 0.02, -0.08 * w * Math.sin(ph), 0);
    setE(rig, BN.CHS, lean * 0.5 + breathe, -0.14 * w * Math.sin(ph), 0);
    setE(rig, BN.HED, -0.03, 0, 0);
    armSwing(rig, ph, lerp(0.32, 0.85, run) * w + 0.03, lerp(0.15, 1.45, run) + 0.1, { out: 0.1 });
  }
  if (s.thr != null && s.thr >= 0) throwArm(rig, s.thr);
  if (emo) emote(rig, emo, t);
  if (s.hit > 0) { const f = s.hit; addE(rig, BN.CHS, -0.22 * f, (s.hitSide || 1) * 0.25 * f, 0); addE(rig, BN.HED, -0.3 * f, 0, 0.1 * f); }
  if (s.look) addE(rig, BN.HED, 0, s.look, 0);
}

const GUNPOSE = {
  rifle: { anchor: [-0.105, 1.4, 0.09], stock: [0, 0.03, -0.22], low: [0.06, -0.12, -0.08] },
  smg: { anchor: [-0.095, 1.38, 0.13], stock: [0, 0.02, -0.12], low: [0.06, -0.12, -0.06] },
  shotgun: { anchor: [-0.105, 1.4, 0.08], stock: [0, 0.02, -0.25], low: [0.06, -0.12, -0.08] },
  sniper: { anchor: [-0.105, 1.41, 0.08], stock: [0, 0.03, -0.3], low: [0.06, -0.12, -0.08] },
  pistol: { anchor: [-0.03, 1.37, 0.42], stock: [0, 0, 0], low: [0.0, -0.2, -0.16], two: true },
};


function weaponHold(rig, s, ready, twist, chestP) {
  const gp = GUNPOSE[s.w] || GUNPOSE.rifle;
  const aim = s.aim || 0;
  const lowK = 1 - ready;
  const pitch = aim + chestP - lowK * 0.55 + (s.fire || 0) * 0.1;
  const yaw = lowK * 0.35 + twist;
  const rel = s.rel != null && s.rel >= 0 ? s.rel : -1;
  const rr = rel >= 0 ? bell(rel, 0, 1) : 0;
  const roll = rr * 0.55;
  const R = new Float32Array(16);
  eulerM(R, 0, -pitch, yaw, roll, 0, 0, 0);
  const ax = gp.anchor[0] + gp.low[0] * lowK, ay = gp.anchor[1] + gp.low[1] * lowK - rr * 0.06, az = gp.anchor[2] + gp.low[2] * lowK - (s.fire || 0) * 0.05;
  const so = apply(R, 0, -gp.stock[0], -gp.stock[1], -gp.stock[2]);
  const Gm = new Float32Array(16);
  for (let q = 0; q < 16; q++) Gm[q] = R[q];
  Gm[12] = ax + so[0]; Gm[13] = ay + so[1]; Gm[14] = az + so[2];
  rig.gunLocal = Gm;
  rig.ik = { L: null, R: null, chestRel: true };
  rig.ikDefer = { kind: s.w, Gm, rel, two: gp.two };
}

function batHold(rig, s) {
  const m = s.mel != null && s.mel >= 0 ? s.mel : -1;
  for (const sd of [1, -1]) {
    const iU = sd > 0 ? BN.UAL : BN.UAR;
    if (m < 0) { setE(rig, iU, -0.5, sd > 0 ? 0.6 : 0.2, sd * 0.35); setE(rig, iU + 1, -1.6, 0, 0); }
    else {
      const wind = ss(0, 0.35, m), hit = ss(0.35, 0.6, m), back = ss(0.7, 1, m);
      const a = -0.5 - wind * 1.6 + hit * 2.4 - back * 0.8;
      setE(rig, iU, a, sd > 0 ? 0.8 - hit * 1.2 : 0.4 - hit * 0.9, sd * (0.35 + wind * 0.4 - hit * 0.5));
      setE(rig, iU + 1, -1.5 + hit * 1.0 - back * 0.9, 0, 0);
      addE(rig, BN.CHS, 0, 0.5 * wind - 1.0 * hit + 0.5 * back, 0);
    }
  }
}

function throwArm(rig, p) {
  const wind = ss(0, 0.45, p), rel = ss(0.45, 0.7, p), back = ss(0.75, 1, p);
  setE(rig, BN.UAR, -0.3 - 3.1 * wind + 2.4 * rel + 0.6 * back, 0, -0.3 * wind + 0.2 * rel);
  setE(rig, BN.FAR, -1.7 * wind + 1.5 * rel, 0, 0);
  setE(rig, BN.UAL, -1.2 * wind + 0.6 * rel, 0, 0.2);
  addE(rig, BN.CHS, 0.1 * rel, 0.5 * wind - 0.8 * rel, 0);
  rig.hideGun = p < 0.95;
  if (rig.ik) rig.ik.R = null;
}

function emote(rig, E, t) {
  const k = E.k, u = E.t || 0, osc = Math.sin(t * 9);
  const inOut = ss(0, 0.25, u) * (1 - ss(2.2, 2.6, u));
  rig.hideGun = true;
  rig.ik = null;
  const arm = (i, x, y, z) => setE(rig, i, x * inOut, y * inOut, z * inOut);
  if (k === 'wave') { arm(BN.UAR, -0.3, 0, -2.5); arm(BN.FAR, -0.35 - 0.45 * (osc * 0.5 + 0.5), 0, 0.3 * osc); }
  else if (k === 'cheer') { arm(BN.UAR, -0.4, 0, -2.75); arm(BN.UAL, -0.4, 0, 2.75); const p = Math.sin(t * 8); arm(BN.FAR, -0.5 - 0.4 * p, 0, 0); arm(BN.FAL, -0.5 - 0.4 * p, 0, 0); rig.root[1] += Math.max(0, p) * 0.06 * inOut; }
  else if (k === 'point') { arm(BN.UAR, -1.5, 0.2, -0.1); arm(BN.FAR, -0.05, 0, 0); addE(rig, BN.HED, 0, -0.1 * inOut, 0); }
  else if (k === 'thumbs') { arm(BN.UAR, -1.0, 0, -0.3); arm(BN.FAR, -1.4, 0, 0); }
  else if (k === 'salute') { arm(BN.UAR, -1.1, 0.4, -1.2); arm(BN.FAR, -2.3, 0, 0); }
  else if (k === 'dance') {
    const d = Math.sin(t * 6), d2 = Math.sin(t * 12);
    addE(rig, BN.PEL, 0, 0.2 * d * inOut, 0.12 * d * inOut);
    addE(rig, BN.CHS, 0, -0.35 * d * inOut, -0.1 * d * inOut);
    arm(BN.UAR, -0.6 - 0.8 * Math.max(0, d), 0, -0.9 - 0.6 * d); arm(BN.UAL, -0.6 - 0.8 * Math.max(0, -d), 0, 0.9 - 0.6 * d);
    arm(BN.FAR, -1.4, 0, 0); arm(BN.FAL, -1.4, 0, 0);
    rig.root[1] += -0.04 * Math.abs(d2) * inOut;
    for (const i of [BN.SHL, BN.SHR]) addE(rig, i, 0.25 * Math.abs(d2) * inOut, 0, 0);
  } else if (k === 'laugh') { const d = Math.sin(t * 14); addE(rig, BN.CHS, (0.2 + 0.08 * d) * inOut, 0, 0); arm(BN.UAR, -0.5, 0, -0.3); arm(BN.UAL, -0.5, 0, 0.3); arm(BN.FAR, -1.7, 0, 0); arm(BN.FAL, -1.7, 0, 0); addE(rig, BN.HED, -0.3 * inOut, 0, 0); }
  else if (k === 'come') { arm(BN.UAR, -1.3, 0, -0.2); arm(BN.FAR, -0.6 - 0.8 * (osc * 0.5 + 0.5), 0, 0); }
}

function downed(rig, s) {
  const t = s.t || 0;
  rig.rot[0] = -1.38; rig.root[1] = -0.8; rig.root[2] = -0.05;
  setE(rig, BN.SPN, 0.25, 0, 0); setE(rig, BN.CHS, 0.3 + Math.sin(t * 2) * 0.03, 0, 0); setE(rig, BN.HED, 0.45, 0.2 * Math.sin(t * 0.7), 0);
  setE(rig, BN.UAL, -0.2, 0, 0.6); setE(rig, BN.FAL, -0.6, 0, 0);
  setE(rig, BN.UAR, -1.2, 0, -0.2); setE(rig, BN.FAR, -1.2 + Math.sin(t * 3) * 0.15, 0, 0);
  setE(rig, BN.THL, -0.6, 0, 0.12); setE(rig, BN.SHL, 1.1, 0, 0);
  setE(rig, BN.THR, -0.15, 0, -0.1); setE(rig, BN.SHR, 0.3, 0, 0);
  rig.hideGun = true;
}

function kneel(rig, s) {
  rig.root[1] = -0.42;
  setE(rig, BN.THR, -0.1, 0, -0.05); setE(rig, BN.SHR, 1.55, 0, 0); setE(rig, BN.FTR, 0.9, 0, 0);
  setE(rig, BN.THL, -1.45, 0, 0.1); setE(rig, BN.SHL, 1.5, 0, 0); setE(rig, BN.FTL, 0.0, 0, 0);
  setE(rig, BN.SPN, 0.25, 0, 0); setE(rig, BN.CHS, 0.3, 0, 0); setE(rig, BN.HED, 0.35, 0, 0);
  const p = Math.sin((s.t || 0) * 5) * 0.15;
  setE(rig, BN.UAR, -1.0 + p, 0, -0.1); setE(rig, BN.FAR, -0.6, 0, 0);
  setE(rig, BN.UAL, -1.0 - p, 0, 0.1); setE(rig, BN.FAL, -0.6, 0, 0);
  rig.hideGun = true;
}

export function finishHuman(rig, handFrames) {
  const D = rig.ikDefer;
  rig.ikDefer = null;
  if (!D || !rig.ik) { rig.gun = null; return solve(rig); }
  rig.ik = null;
  solveCore(rig);
  const C = rig.G.subarray(BN.CHS * 16, BN.CHS * 16 + 16);
  const J = rig.J;
  const cx = J[BN.CHS * 3], cy = J[BN.CHS * 3 + 1], cz = J[BN.CHS * 3 + 2];
  const L = D.Gm;
  const T = new Float32Array(16);
  for (let q = 0; q < 16; q++) T[q] = L[q];
  T[12] -= cx; T[13] -= cy; T[14] -= cz;
  const Gw = new Float32Array(16);
  mulTo(Gw, 0, C, 0, T, 0);
  rig.gun = Gw;
  const H = handFrames ? handFrames(D.kind, Gw) : null;
  const tgt = (h, side) => {
    if (!h) return null;
    const F = h.F;
    return { w: h.wrist, f: nrm(sub([F[12], F[13], F[14]], h.wrist)), n: [F[0], F[1], F[2]], pole: [side * 0.7, -1, -0.35] };
  };
  rig.ik = { R: H ? tgt(H.right, -1) : null, L: H ? tgt(H.left, 1) : null };
  if (D.rel >= 0 && rig.ik.L) {
    const k = bell(D.rel, 0.1, 0.85);
    const mag = apply(Gw, 0, 0.0, -0.16, 0.12);
    rig.ik.L.w = [lerp(rig.ik.L.w[0], mag[0], k), lerp(rig.ik.L.w[1], mag[1], k), lerp(rig.ik.L.w[2], mag[2], k)];
    rig.ik.L.f = null;
  }
  return solve(rig);
}

function solveCore(rig) {
  const { J, P, G, e, root, rot } = rig;
  for (let i = 0; i <= BN.CHS; i++) {
    const p = P[i];
    if (p < 0) {
      eulerM(G, 0, rot[0], rot[1], rot[2], J[0] + root[0], J[1] + root[1], J[2] + root[2]);
      if (e[0] || e[1] || e[2]) { eulerM(LOC, 0, e[0], e[1], e[2], 0, 0, 0); mulTo(G, 0, G, 0, LOC, 0); }
      continue;
    }
    eulerM(LOC, 0, e[i * 3], e[i * 3 + 1], e[i * 3 + 2], J[i * 3] - J[p * 3], J[i * 3 + 1] - J[p * 3 + 1], J[i * 3 + 2] - J[p * 3 + 2]);
    mulTo(G, i * 16, G, p * 16, LOC, 0);
  }
}

export const ZSTYLE = (id, k) => {
  const h = (n) => ((id * 2654435761 + n * 97) >>> 0) % 1000 / 1000;
  return { arms: k === 'runner' ? 3 : k === 'bloater' ? 4 : k === 'brute' ? 5 : Math.floor(h(1) * 3), limp: h(2) < 0.35 ? (h(3) < 0.5 ? 1 : -1) : 0, tilt: (h(4) - 0.5) * 0.6, hunch: 0.18 + h(5) * 0.22, att: h(6) < 0.5 ? 0 : 1, rate: 0.88 + h(7) * 0.24, death: Math.floor(h(8) * 3), off: h(9) * 6.28 };
};

export function poseZombie(rig, s) {
  rig.e.fill(0);
  rig.root[0] = 0; rig.root[1] = 0; rig.root[2] = 0; rig.rot[0] = 0; rig.rot[1] = 0; rig.rot[2] = 0;
  rig.ik = null;
  const k = s.k, Y = s.sty, t = (s.t || 0) + Y.off, ph = s.ph || 0;
  const v = s.mv || 0;
  const w = clamp(v / (k === 'runner' ? 2.5 : 0.9), 0, 1);
  if (s.dead != null) { zDeath(rig, s, Y); return; }
  if (k === 'crawler') { crawl(rig, s, Y, t, ph, w); return; }
  const run = k === 'runner' ? clamp(v / 3.2, 0, 1) : 0;
  const heavy = k === 'brute' ? 1 : 0, fat = k === 'bloater' ? 1 : 0;
  const amp = lerp(0.3, 0.8, run) * w * (heavy ? 0.85 : 1);
  legs(rig, ph, amp, lerp(0.55, 1.5, run) * w, 0, run, { limp: Y.limp, drag: Y.limp, footOut: Y.limp, spread: fat ? 0.14 : heavy ? 0.08 : 0.05, bend: heavy * 0.12 + fat * 0.08, kneeK: 1 });
  const dip = Y.limp ? Math.max(0, Math.sin(ph + (Y.limp > 0 ? 0 : Math.PI))) * 0.05 : 0;
  rig.root[1] = -w * (run > 0.3 ? 0.05 * Math.abs(Math.sin(ph)) : 0.02 * (1 - Math.abs(Math.cos(ph)))) - dip - heavy * 0.04;
  const sway = Math.sin(ph) * (0.06 + fat * 0.12 + heavy * 0.05) * w + (Y.limp ? Y.limp * 0.05 : 0);
  addE(rig, BN.PEL, 0, 0.08 * Math.sin(ph) * w, sway);
  const hunch = Y.hunch + run * 0.35 + heavy * 0.18 - fat * 0.1;
  setE(rig, BN.SPN, hunch * 0.45, 0, -sway * 0.5);
  setE(rig, BN.CHS, hunch * 0.55 + Math.sin(t * 1.3) * 0.03, -0.12 * Math.sin(ph) * w - heavy * 0.12 * Math.sin(ph), -sway * 0.4);
  setE(rig, BN.NCK, run * -0.3 - hunch * 0.3, 0, 0);
  setE(rig, BN.HED, 0.12 + Math.sin(t * 0.9 + 1) * 0.1 - run * 0.25, Math.sin(t * 0.6) * 0.2, Y.tilt + Math.sin(t * 0.7) * 0.08);
  setE(rig, BN.JAW, 0.12 + Math.max(0, Math.sin(t * 1.4)) * 0.18 + run * 0.25, 0, 0);
  const st = Y.arms;
  const bob = Math.sin(ph) * 0.1 * w;
  const reach = (iU, s) => { setE(rig, iU, -1.35 + bob * s + Math.sin(t * 1.1 + s) * 0.06, 0, s * 0.18); setE(rig, iU + 1, -0.35, 0, 0); setE(rig, iU + 2, 0.35, 0, 0); };
  const hang = (iU, s) => { const sw = Math.sin(ph + (s > 0 ? Math.PI : 0) + 0.6) * 0.3 * w; setE(rig, iU, 0.05 + sw, 0, s * 0.1); setE(rig, iU + 1, -0.2 - Math.max(0, sw) * 0.4, 0, 0); setE(rig, iU + 2, 0.2, 0, 0); };
  if (st === 0) { reach(BN.UAL, 1); reach(BN.UAR, -1); }
  else if (st === 1) { hang(BN.UAL, 1); hang(BN.UAR, -1); }
  else if (st === 2) { reach(BN.UAL, 1); hang(BN.UAR, -1); }
  else if (st === 3) { for (const sd of [1, -1]) { const iU = sd > 0 ? BN.UAL : BN.UAR; const p = Math.sin(ph + (sd > 0 ? Math.PI : 0)); setE(rig, iU, -0.6 - p * 1.1 * w - 0.3, 0.3 * sd, sd * (0.3 + Math.sin(t * 7 + sd) * 0.15)); setE(rig, iU + 1, -1.0 - Math.max(0, p) * 0.6, 0, 0); } }
  else if (st === 4) { for (const sd of [1, -1]) { const iU = sd > 0 ? BN.UAL : BN.UAR; setE(rig, iU, -0.4 + bob, 0, sd * (0.75 + Math.sin(ph) * 0.1)); setE(rig, iU + 1, -0.5, 0, 0); } }
  else { for (const sd of [1, -1]) { const iU = sd > 0 ? BN.UAL : BN.UAR; const p = Math.sin(ph + (sd > 0 ? Math.PI : 0)); setE(rig, iU, -0.3 - p * 0.35 * w, 0, sd * 0.28); setE(rig, iU + 1, -0.5, 0, 0); } }
  if (s.scream > 0) {
    const q = bell(s.scream, 0, 1);
    addE(rig, BN.CHS, -0.35 * q, 0, 0); addE(rig, BN.NCK, -0.3 * q, 0, 0); addE(rig, BN.HED, -0.45 * q + Math.sin(t * 40) * 0.04 * q, 0, 0); setE(rig, BN.JAW, 0.7 * q + 0.1, 0, 0);
    for (const sd of [1, -1]) { const iU = sd > 0 ? BN.UAL : BN.UAR; setE(rig, iU, lerp(rig.e[iU * 3], -0.4, q), 0, lerp(rig.e[iU * 3 + 2], sd * 1.3, q)); setE(rig, iU + 1, lerp(rig.e[(iU + 1) * 3], -0.6, q), 0, 0); }
  }
  if (s.att != null && s.att >= 0) zAttack(rig, s, Y, heavy);
  if (s.hit > 0) { const f = s.hit; addE(rig, BN.CHS, -0.35 * f, (s.hitSide || 1) * 0.3 * f, 0); addE(rig, BN.SPN, -0.15 * f, 0, 0); addE(rig, BN.HED, s.head ? -0.6 * f : -0.2 * f, 0, s.head ? 0.25 * f : 0); rig.root[2] -= 0.05 * f; }
  if (s.stun > 0) { const f = Math.min(1, s.stun * 2); addE(rig, BN.CHS, -0.4 * f, 0, Math.sin(t * 9) * 0.1 * f); addE(rig, BN.UAL, -0.6 * f, 0, 0.5 * f); addE(rig, BN.UAR, -0.6 * f, 0, -0.5 * f); setE(rig, BN.JAW, 0.4, 0, 0); }
}

function zAttack(rig, s, Y, heavy) {
  const p = s.att;
  if (heavy) {
    const up = ss(0, 0.5, p), down = ss(0.5, 0.7, p), rec = ss(0.75, 1, p);
    for (const sd of [1, -1]) { const iU = sd > 0 ? BN.UAL : BN.UAR; setE(rig, iU, lerp(lerp(rig.e[iU * 3], -2.9, up), -0.9, down) * (1 - rec) + rig.e[iU * 3] * rec, 0, sd * 0.25); setE(rig, iU + 1, -0.6 * up * (1 - down), 0, 0); }
    addE(rig, BN.CHS, -0.35 * up + 0.8 * down * (1 - rec), 0, 0);
    rig.root[1] -= 0.12 * down * (1 - rec);
    setE(rig, BN.JAW, 0.5 * up, 0, 0);
    return;
  }
  if (Y.att === 0) {
    const wind = ss(0, 0.45, p), hit = ss(0.45, 0.62, p), rec = ss(0.7, 1, p);
    const k = 1 - rec;
    setE(rig, BN.UAR, (-2.2 * wind + 1.9 * hit) * k + rig.e[BN.UAR * 3] * rec, 0.3 * wind * k, (-0.9 * wind + 0.7 * hit) * k - 0.1);
    setE(rig, BN.FAR, -0.9 * wind * k, 0, 0);
    addE(rig, BN.CHS, 0.3 * hit * k, (0.45 * wind - 0.8 * hit) * k, 0);
    setE(rig, BN.JAW, 0.15 + 0.5 * hit * k, 0, 0);
  } else {
    const lean = ss(0, 0.5, p) * (1 - ss(0.7, 1, p)), snap = bell(p, 0.4, 0.75);
    addE(rig, BN.CHS, 0.45 * lean, 0, 0); addE(rig, BN.NCK, 0.25 * lean, 0, 0); addE(rig, BN.HED, -0.2 * lean, 0, 0);
    for (const sd of [1, -1]) { const iU = sd > 0 ? BN.UAL : BN.UAR; setE(rig, iU, lerp(rig.e[iU * 3], -1.55, lean), 0, sd * lerp(0.2, -0.05, lean)); setE(rig, iU + 1, -0.3 - 0.6 * snap, 0, 0); }
    setE(rig, BN.JAW, 0.15 + 0.65 * snap, 0, 0);
    rig.root[2] += 0.12 * lean;
  }
}

function crawl(rig, s, Y, t, ph, w) {
  rig.rot[0] = 1.32; rig.root[1] = -0.74; rig.root[2] = -0.18;
  const p = ph * 0.8;
  setE(rig, BN.SPN, -0.1 + Math.sin(p) * 0.05, Math.sin(p) * 0.12, 0); setE(rig, BN.CHS, -0.15, Math.sin(p) * 0.15, Math.sin(p) * 0.05);
  setE(rig, BN.NCK, -0.5, 0, 0); setE(rig, BN.HED, -0.55 + Math.sin(t) * 0.08, Math.sin(t * 0.6) * 0.2, Y.tilt * 0.5);
  setE(rig, BN.JAW, 0.25 + Math.max(0, Math.sin(t * 1.6)) * 0.3, 0, 0);
  for (const sd of [1, -1]) {
    const iU = sd > 0 ? BN.UAL : BN.UAR, q = Math.sin(p + (sd > 0 ? 0 : Math.PI));
    setE(rig, iU, -1.9 - 0.55 * q * w - 0.2, 0, sd * (0.35 + 0.1 * q));
    setE(rig, iU + 1, -0.5 - 0.7 * Math.max(0, -q) * w, 0, 0);
    setE(rig, iU + 2, 0.5, 0, 0);
  }
  for (const sd of [1, -1]) { const iT = sd > 0 ? BN.THL : BN.THR; setE(rig, iT, 0.1 + Math.sin(p + sd) * 0.1, 0, sd * 0.15); setE(rig, iT + 1, 0.3 + Math.max(0, Math.sin(p * 0.5 + sd)) * 0.5, 0, 0); setE(rig, iT + 2, 0.6, 0, 0); }
  if (s.att != null && s.att >= 0) { const q = bell(s.att, 0.2, 0.8); addE(rig, BN.CHS, -0.4 * q, 0, 0); setE(rig, BN.JAW, 0.8 * q, 0, 0); for (const sd of [1, -1]) addE(rig, sd > 0 ? BN.UAL : BN.UAR, -0.4 * q, 0, 0); }
  if (s.hit > 0) addE(rig, BN.HED, -0.4 * s.hit, 0, 0);
}

export function zDeath(rig, s, Y) {
  const d = s.dead, T = d.t || 0, mode = d.mode != null ? d.mode : Y.death;
  const crawler = s.k === 'crawler';
  const side = d.side || 1;
  if (crawler) {
    const f = ss(0, 0.5, T);
    rig.rot[0] = 1.32 + 0.22 * f; rig.root[1] = -0.74 - 0.1 * f; rig.root[2] = -0.18;
    setE(rig, BN.HED, lerp(-0.55, 0.3, f), 0.6 * f * side, 0); setE(rig, BN.NCK, lerp(-0.5, 0, f), 0, 0);
    for (const sd of [1, -1]) { const iU = sd > 0 ? BN.UAL : BN.UAR; setE(rig, iU, lerp(-2.0, -1.4, f), 0, sd * lerp(0.35, 0.9, f)); setE(rig, iU + 1, -0.3, 0, 0); }
    return;
  }
  const buck = ss(0, 0.32, T), fall = Math.pow(ss(0.18, 0.78, T), 1.6), land = ss(0.72, 0.95, T), settle = ss(0.9, 1.6, T);
  const bounce = bell(T, 0.78, 1.0) * 0.06;
  if (mode === 3) {
    const blow = ss(0, 0.35, T);
    rig.root[2] = -2.2 * blow * (d.push || 1); rig.root[1] = Math.sin(blow * Math.PI) * 0.5 - (0.85) * fall;
    rig.rot[0] = -1.5 * fall - 0.4 * blow * (1 - fall); rig.rot[2] = side * 0.4 * blow;
    setE(rig, BN.SPN, -0.3 * blow, 0, 0); setE(rig, BN.CHS, -0.2, 0, 0); setE(rig, BN.HED, -0.5 * (1 - settle) + 0.3 * settle, 0.5 * settle * side, 0);
    for (const sd of [1, -1]) { const iU = sd > 0 ? BN.UAL : BN.UAR; setE(rig, iU, -2.2 * blow * (1 - settle) - 0.4, 0, sd * (0.8 + 0.6 * settle)); setE(rig, iU + 1, -0.4, 0, 0); const iT = sd > 0 ? BN.THL : BN.THR; setE(rig, iT, -0.9 * blow * (1 - settle) - 0.2, 0, sd * 0.2); setE(rig, iT + 1, 0.4 + 0.5 * settle * (sd > 0 ? 1 : 0), 0, 0); }
    return;
  }
  const fwd = mode === 0 || mode === 2;
  const dir = fwd ? 1 : -1;
  rig.root[1] = -0.24 * buck * (1 - fall) - 0.84 * fall + bounce;
  rig.root[2] = dir * 0.25 * fall;
  rig.rot[0] = dir * 1.5 * fall;
  rig.rot[2] = mode === 2 ? side * (0.35 * buck + 0.25 * fall) : side * 0.12 * fall;
  rig.rot[1] = mode === 2 ? side * 0.6 * fall : 0;
  for (const sd of [1, -1]) {
    const iT = sd > 0 ? BN.THL : BN.THR;
    const kneeB = 1.5 * buck * (1 - fall);
    const lieT = fwd ? (sd > 0 ? 0.15 : -0.1) : (sd > 0 ? -0.5 : -0.1);
    const lieK = fwd ? (sd > 0 ? 0.25 : 0.9) : (sd > 0 ? 0.9 : 0.2);
    setE(rig, iT, lerp(-0.75 * buck, lieT, fall), 0, sd * lerp(0.05, 0.18, fall));
    setE(rig, iT + 1, lerp(kneeB, lieK, fall), 0, 0);
    setE(rig, iT + 2, lerp(-0.4 * buck, 0.6, fall), 0, 0);
  }
  setE(rig, BN.SPN, lerp(dir * 0.35 * buck, dir * -0.05, fall), 0, 0);
  setE(rig, BN.CHS, lerp(dir * 0.3 * buck, -0.05, fall), side * 0.2 * buck, 0);
  setE(rig, BN.HED, lerp(dir * 0.4 * buck + (d.head ? -0.8 * (1 - buck) : 0), 0.1, land), lerp(0, side * 1.1, settle), lerp(0.2 * buck, side * 0.2, settle));
  setE(rig, BN.JAW, 0.15 + 0.4 * (1 - land), 0, 0);
  for (const sd of [1, -1]) {
    const iU = sd > 0 ? BN.UAL : BN.UAR;
    const flail = Math.sin(T * 12 + sd) * 0.4 * buck * (1 - land);
    const lieA = fwd ? (sd === side ? -2.4 : -0.3) : (sd === side ? -0.5 : -2.0);
    setE(rig, iU, lerp(-0.6 * buck + flail, lieA, land), 0, sd * lerp(0.3 + 0.5 * buck, sd === side ? 0.9 : 0.4, land));
    setE(rig, iU + 1, lerp(-0.8 * buck, sd === side ? -0.6 : -1.1, land), 0, 0);
    setE(rig, iU + 2, lerp(0, 0.4, land), 0, 0);
  }
}

export function poseDog(rig, s) {
  rig.e.fill(0);
  rig.root[0] = 0; rig.root[1] = 0; rig.root[2] = 0; rig.rot[0] = 0; rig.rot[1] = 0; rig.rot[2] = 0;
  const t = s.t || 0, ph = s.ph || 0, v = s.mv || 0;
  const w = clamp(v / 1.2, 0, 1), gal = clamp((v - 3.4) / 2, 0, 1);
  const se = (i, x, y, z) => { rig.e[i * 3] = x; rig.e[i * 3 + 1] = y; rig.e[i * 3 + 2] = z; };
  if (s.sit) {
    rig.root[1] = -0.16; rig.rot[0] = -0.55;
    se(1, 0.1, 0, 0); se(2, 0.2, 0, 0); se(3, -0.15, 0, 0); se(4, 0.3 + Math.sin(t * 0.8) * 0.05, Math.sin(t * 0.5) * 0.3, 0);
    se(6, 0.55, 0, 0); se(7, 0, 0, 0); se(8, 0.55, 0, 0); se(9, 0, 0, 0);
    se(10, -0.9, 0, 0.1); se(11, 1.9, 0, 0); se(12, -0.9, 0, -0.1); se(13, 1.9, 0, 0);
    se(5, 0.25 + Math.abs(Math.sin(t * 9)) * 0.15, 0, 0);
    se(14, 0.6, Math.sin(t * 6) * 0.4, 0); se(15, 0.2, Math.sin(t * 6 + 1) * 0.3, 0);
    return;
  }
  const legs4 = [[6, 0], [8, Math.PI], [10, Math.PI], [12, 0]];
  for (const [i, o] of legs4) {
    const front = i < 10;
    const p = ph + o + (gal > 0 ? (front ? 0 : 1.2) - o * gal * 0.8 : 0);
    const sw = Math.sin(p), cw = Math.cos(p);
    const amp = lerp(0.45, 0.85, gal) * w;
    se(i, -sw * amp, 0, 0);
    se(i + 1, front ? -Math.max(0, cw) * 0.9 * w : Math.max(0, cw) * 1.0 * w, 0, 0);
  }
  rig.root[1] = -Math.abs(Math.sin(ph)) * 0.03 * w - gal * 0.03 * Math.sin(ph * 2);
  se(0, gal * 0.15 * Math.sin(ph), 0, 0.03 * Math.sin(ph) * w);
  se(1, -gal * 0.2 * Math.sin(ph), 0, 0);
  se(2, gal * 0.1 * Math.sin(ph), 0, 0);
  se(3, -0.15 - gal * 0.2, 0, 0);
  se(4, 0.15 + gal * 0.15 + Math.sin(ph * 2) * 0.04 * w, (s.look || 0) + Math.sin(t * 0.7) * 0.15 * (1 - w), 0);
  se(5, s.bark > 0 ? 0.5 * bell(s.bark, 0, 1) : 0.1 + (v > 2 ? 0.25 : 0) + Math.abs(Math.sin(t * 8)) * 0.08, 0, 0);
  se(14, 0.5 - gal * 0.4, Math.sin(t * (s.happy ? 14 : 5)) * (s.happy ? 0.5 : 0.2), 0);
  se(15, 0.2, Math.sin(t * (s.happy ? 14 : 5) + 1) * 0.3, 0);
  if (s.bite > 0) { const q = bell(s.bite, 0, 1); se(3, -0.15 + 0.5 * q, 0, 0); se(4, 0.2 + 0.4 * q, Math.sin(t * 30) * 0.2 * q, 0); se(5, 0.7 * q, 0, 0); rig.root[2] += 0.12 * q; }
  if (s.leap > 0) { const q = s.leap; rig.root[1] += Math.sin(q * Math.PI) * 0.45; rig.rot[0] = lerp(-0.4, 0.3, q); for (const i of [6, 8]) se(i, -1.1, 0, 0); for (const i of [10, 12]) se(i, 0.9, 0, 0); }
}
