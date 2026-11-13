import { MeshBuilder, m4, hexRgb } from './race3d.js';
import { gunMesh, magMesh, gripHand, handFrames, GUNS } from './zguns.js';
import { MAT, tube, ball, withT, rot, sq } from './siegemesh.js';
import { SURV_LOOK, survLook } from './zlooks.js';
import { fpGLItems } from './zfpgl.js';

const C = (h) => (typeof h === 'string' ? hexRgb(h) : h);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const bell = (t, a, b) => (t <= a || t >= b ? 0 : Math.sin(((t - a) / (b - a)) * Math.PI));
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scl = (a, k) => [a[0] * k, a[1] * k, a[2] * k];

export const VM = {
  rifle: { hip: [-0.155, -0.2, 0.36], ads: [0, -0.158, 0.27], sight: 0.158, elbowR: [-0.12, -0.3, -0.36], elbowL: [0.07, -0.4, -0.1], magPos: [0, -0.07, 0.13], kick: 0.06, back: 0.035, fov: 0.68 },
  smg: { hip: [-0.15, -0.19, 0.34], ads: [0, -0.125, 0.27], sight: 0.125, elbowR: [-0.12, -0.3, -0.34], elbowL: [0.06, -0.4, -0.14], magPos: [0, -0.1, 0.12], kick: 0.035, back: 0.025, fov: 0.72 },
  shotgun: { hip: [-0.155, -0.19, 0.33], ads: [0, -0.09, 0.2], sight: 0.088, elbowR: [-0.12, -0.3, -0.38], elbowL: [0.07, -0.4, -0.02], magPos: [0.03, -0.01, 0.12], kick: 0.16, back: 0.07, fov: 0.74 },
  sniper: { hip: [-0.155, -0.2, 0.34], ads: [0, -0.152, 0.1], sight: 0.152, elbowR: [-0.12, -0.3, -0.38], elbowL: [0.07, -0.4, -0.06], magPos: [0, -0.04, 0.1], kick: 0.14, back: 0.06, fov: 0.32 },
  pistol: { hip: [-0.13, -0.17, 0.4], ads: [0, -0.086, 0.32], sight: 0.086, elbowR: [-0.1, -0.3, -0.3], elbowL: [0.12, -0.32, -0.26], magPos: [0, -0.04, -0.03], kick: 0.1, back: 0.03, fov: 0.74 },
};

function arm(m, kind, side, look, H) {
  const sleeve = C(look.shirt || '#4E5A3C');
  const skin = C(look.skin || '#C8956E');
  const glove = look.glove ? C(look.glove) : null;
  const v = VM[kind] || VM.rifle;
  if (!H) return;
  const W = H.wrist;
  const E = side > 0 ? v.elbowL : v.elbowR;
  const cuffAt = add(W, scl(sub(E, W), 0.18));
  const skinUntil = look.sleeve != null && look.sleeve < 0.9 ? 0.75 : 0.18;
  const mid = add(W, scl(sub(E, W), skinUntil));
  tube(m, W, mid, 0.025, 0.03, 10, glove && skinUntil < 0.3 ? glove : skin, MAT.matte, false);
  if (skinUntil < 0.3) {
    tube(m, cuffAt, add(cuffAt, scl(sub(E, W), 0.06)), 0.035, 0.036, 12, sleeve, MAT.matte, false);
    tube(m, add(cuffAt, scl(sub(E, W), 0.06)), E, 0.035, 0.043, 12, sleeve, MAT.matte, false);
    if (side > 0) tube(m, add(W, scl(sub(E, W), 0.08)), add(W, scl(sub(E, W), 0.13)), 0.031, 0.031, 12, C('#141414'), MAT.trim, false);
  } else tube(m, mid, E, 0.033, 0.05, 10, sleeve, MAT.matte, false);
  gripHand(m, H.F, H.rg, skin, glove, { trigger: side < 0 });
}

export function buildFP(R, kind, sv, col) {
  const look = survLook(sv, col);
  const I = m4.ident();
  const H = handFrames(kind, I);
  const g = gunMesh(kind, { noMag: true, fp: true });
  const mR = new MeshBuilder(); arm(mR, kind, -1, look, H.right);
  const mL = new MeshBuilder(); arm(mL, kind, 1, look, H.left);
  const out = { kind, gun: R.mesh(g), mag: R.mesh(magMesh(kind)), armR: R.mesh(mR.build()), armL: R.mesh(mL.build()), H, muzzle: (GUNS[kind] && GUNS[kind].muzzle) || [0, 0.08, 0.7] };
  const fl = new MeshBuilder();
  for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; const r0 = 0.012, r1 = i % 2 ? 0.05 : 0.085; fl.tri([0, 0, 0], [Math.cos(a) * r1, Math.sin(a) * r1, 0.02], [Math.cos(a + 0.45) * r0, Math.sin(a + 0.45) * r0, 0.004], '#FFE4A0', 1); fl.tri([0, 0, 0.0], [Math.cos(a) * 0.02, Math.sin(a) * 0.02, 0.14], [Math.cos(a + 0.9) * 0.02, Math.sin(a + 0.9) * 0.02, 0.12], '#FFD080', 1); }
  out.flashMesh = R.mesh(fl.build());
  return out;
}

export function buildThrowFP(R, kind, sv, col) {
  const look = survLook(sv, col);
  const m = new MeshBuilder();
  const skin = C(look.skin || '#C8956E'), sleeve = C(look.shirt || '#4E5A3C'), glove = look.glove ? C(look.glove) : null;
  withT(m, rot(0, 0, 0, 0, 0), () => {
    sq(m, 0, -0.01, -0.03, 0.04, 0.045, 0.05, 0.7, 0.8, glove || skin, MAT.matte, 10, 7);
    tube(m, [0, -0.04, -0.06], [0.02, -0.3, -0.3], 0.03, 0.045, 10, glove || skin, MAT.matte, false);
    tube(m, [0.008, -0.1, -0.12], [0.02, -0.3, -0.3], 0.042, 0.05, 12, sleeve, MAT.matte, false);
  });
  throwObj(m, kind);
  return R.mesh(m.build());
}

function throwObj(m, kind) {
  if (kind === 'grenade') { sq(m, 0, 0.035, 0.0, 0.03, 0.038, 0.03, 0.9, 1, C('#3E4A32'), MAT.plastic, 12, 8); tube(m, [0, 0.07, 0], [0, 0.085, 0], 0.012, 0.012, 8, C('#5A5E66'), MAT.metal); tube(m, [0.012, 0.08, 0], [0.03, 0.06, 0.01], 0.003, 0.003, 5, C('#8A8E96'), MAT.metal); }
  else { tube(m, [0, 0.0, 0], [0, 0.11, 0], 0.03, 0.03, 12, C('#3A6A2A'), MAT.glass); tube(m, [0, 0.11, 0], [0, 0.16, 0], 0.03, 0.011, 12, C('#3A6A2A'), MAT.glass); tube(m, [0, 0.16, 0], [0, 0.2, 0.01], 0.011, 0.012, 8, C('#E8E0C8'), MAT.matte); ball(m, 0, 0.205, 0.012, 0.016, C('#FFB03A'), MAT.glow, 8); }
}

export function buildBatFP(R, sv, col) {
  const look = survLook(sv, col);
  const m = new MeshBuilder();
  const skin = C(look.skin || '#C8956E'), sleeve = C(look.shirt || '#4E5A3C'), glove = look.glove ? C(look.glove) : null;
  sq(m, 0, 0, 0, 0.04, 0.045, 0.045, 0.7, 0.8, glove || skin, MAT.matte, 10, 7);
  tube(m, [0, -0.02, -0.03], [0.02, -0.28, -0.3], 0.03, 0.045, 10, glove || skin, MAT.matte, false);
  tube(m, [0.008, -0.09, -0.1], [0.02, -0.28, -0.3], 0.042, 0.05, 12, sleeve, MAT.matte, false);
  tube(m, [0, 0.02, 0], [0, 0.12, 0.0], 0.016, 0.018, 10, C('#2A2420'), MAT.plastic);
  tube(m, [0, 0.12, 0], [0, 0.62, 0.0], 0.019, 0.034, 12, C('#8A5A32'), MAT.plastic);
  ball(m, 0, 0.62, 0, 0.034, C('#8A5A32'), MAT.plastic, 10);
  for (let i = 0; i < 6; i++) tube(m, [0.03, 0.4 + i * 0.03, 0], [-0.03, 0.42 + i * 0.03, 0.0], 0.0025, 0.0025, 4, C('#A0A4AA'), MAT.metal);
  return R.mesh(m.build());
}

const camM = (pos, yaw, pitch) => m4.pose(pos[0], pos[1], pos[2], yaw, -pitch, 0);
const PIVOT = [-0.12, -0.17, 0.36];

export function buildThrowObj(R, kind) {
  const m = new MeshBuilder();
  throwObj(m, kind);
  return R.mesh(m.build());
}

export function makeFPState() {
  return { ads: 0, rec: 0, recY: 0, recP: 0, swayX: 0, swayY: 0, lyaw: null, lpitch: 0, ph: 0, spr: 0, swap: 0, swapK: null, rel: -1, bolt: -1, thr: -1, thrHold: 0, mel: -1, flash: 0, flashRot: 0, land: 0 };
}

export function fpItems(out, V, F, s, cam) {
  const v = VM[F.kind] || VM.rifle;
  const dt = s.dt;
  if (F.lyaw == null) { F.lyaw = cam.yaw; F.lpitch = cam.pitch; }
  let dy = cam.yaw - F.lyaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
  const dp = cam.pitch - F.lpitch;
  F.lyaw = cam.yaw; F.lpitch = cam.pitch;
  F.swayX = lerp(F.swayX, clamp(dy * 1.6, -0.08, 0.08), Math.min(1, dt * 10));
  F.swayY = lerp(F.swayY, clamp(dp * 1.6, -0.06, 0.06), Math.min(1, dt * 10));
  F.ads = lerp(F.ads, s.ads ? 1 : 0, Math.min(1, dt * 14));
  F.spr = lerp(F.spr, s.sprint && !s.ads ? 1 : 0, Math.min(1, dt * 8));
  F.rec = Math.max(0, F.rec - dt * 9);
  F.flash = Math.max(0, F.flash - dt);
  const t = s.t;
  const mv = s.speed || 0;
  F.ph += mv * dt * 1.9;
  const bobK = clamp(mv / 5, 0, 1) * (1 - F.ads * 0.85);
  const bx = Math.sin(F.ph) * 0.011 * bobK, by = -Math.abs(Math.cos(F.ph)) * 0.012 * bobK;
  const br = Math.sin(t * 1.4) * 0.0025 * (1 - F.ads * 0.8);
  const a = F.ads;
  let ox = lerp(v.hip[0], v.ads[0], a) + bx - F.swayX * 0.25, oy = lerp(v.hip[1], v.ads[1], a) + by + br - F.swayY * 0.2, oz = lerp(v.hip[2], v.ads[2], a);
  let rx = F.swayY * 0.8 * (1 - a * 0.6), ry = -F.swayX * 0.9 * (1 - a * 0.6), rz = -F.swayX * 1.2 + Math.sin(F.ph) * 0.02 * bobK;
  const rk = F.rec;
  if (V.R && !s.oldFP) {
    let gx = bx * 0.8 - F.swayX * 0.25, gy = by * 0.8 + br - F.swayY * 0.2, gz = -rk * v.back * 0.55;
    let grx = F.swayY * 0.8 * (1 - a * 0.6) - rk * v.kick * 0.5 * (1 - a * 0.5), gry = -F.swayX * 0.9 * (1 - a * 0.6) + F.recY * rk, grz = -F.swayX * 1.2 + Math.sin(F.ph) * 0.02 * bobK + F.recY * rk * 0.6;
    gx += F.spr * -0.02; gy -= F.spr * 0.05; gry += F.spr * 0.55; grz += F.spr * 0.3; grx += F.spr * 0.2;
    const Cg = camM(cam.pos, cam.yaw, cam.pitch);
    const P0 = PIVOT;
    const Lg = m4.mul(Cg, m4.mul(m4.pose(P0[0] + gx, P0[1] + gy, P0[2] + gz, gry, grx, grz), m4.pose(-P0[0], -P0[1], -P0[2], 0, 0, 0)));
    const r = fpGLItems(out, V.R, F, s, cam, Lg);
    if (r) {
      if (!r.hide && F.flash > 0 && r.muz && F.flashMesh) {
        F.flashRot += 1.7;
        out.push({ mesh: F.flashMesh, model: m4.mul(Lg, m4.pose(r.muz[0], r.muz[1], r.muz[2] + 0.01, 0, 0, F.flashRot, 0.8 + F.flash * 9)), blend: 2, alpha: 1 });
      }
      if (r.hand && !(F.thr >= 0 && F.thr > 0.1)) {
        const mol = (s.throwK || 'grenade') === 'molotov';
        const mesh = mol ? V.molObj : V.nadeObj;
        if (mesh) out.push({ mesh, model: m4.mul(Lg, m4.pose(r.hand[0], r.hand[1] - (mol ? 0.05 : 0.0), r.hand[2] + 0.02, 0, 0, 0)) });
      }
      return { L: Lg, Cm: Cg, a };
    }
  }
  oz -= rk * v.back; rx -= rk * v.kick * (1 - a * 0.4); oy += rk * 0.008;
  ry += F.recY * rk; rz += F.recY * rk * 0.6;
  ox += F.spr * -0.03; oy -= F.spr * 0.06; ry += F.spr * 0.75; rz += F.spr * 0.35; rx += F.spr * 0.25;
  let magOff = null, lOff = null, shell = false;
  if (F.rel >= 0) {
    const p = F.rel;
    if (F.kind === 'shotgun') {
      const n = 4, cyc = clamp((p - 0.08) / 0.7, 0, 1) * n, c = cyc % 1, lp = p < 0.08 || p > 0.78 ? 0 : 1;
      rz += 0.45 * ss(0, 0.1, p) * (1 - ss(0.8, 0.92, p)); rx -= 0.12 * ss(0, 0.1, p) * (1 - ss(0.8, 0.92, p));
      oy += 0.03 * ss(0, 0.1, p) * (1 - ss(0.8, 0.92, p));
      if (lp) { lOff = [0.02, -0.12 * (1 - bell(c, 0.15, 0.95)) - 0.02, -0.2 + 0.12 * bell(c, 0.15, 0.95)]; shell = c > 0.1 && c < 0.75; oy += bell(c, 0.7, 0.95) * 0.008; }
      const pump = bell(p, 0.84, 0.98);
      if (pump > 0) lOff = [0, 0, -0.09 * pump];
    } else {
      const tilt = ss(0, 0.12, p) * (1 - ss(0.82, 0.96, p));
      rz += 0.55 * tilt; rx -= 0.18 * tilt; ox += 0.03 * tilt; oy += 0.04 * tilt;
      const out = ss(0.12, 0.3, p), back = ss(0.38, 0.62, p), seat = ss(0.62, 0.7, p);
      const handDown = ss(0.1, 0.28, p) * (1 - ss(0.4, 0.62, p));
      lOff = [0.03 * handDown, -0.32 * handDown + 0.0, -0.1 * handDown];
      if (p > 0.66 && p < 0.76) { oy += bell(p, 0.66, 0.76) * 0.025; rx -= bell(p, 0.66, 0.76) * 0.05; }
      if (p < 0.38) magOff = [0, -0.45 * out * out, -0.05 * out];
      else magOff = [0, -0.3 * (1 - back), -0.05 * (1 - back)];
      if (p >= 0.62) magOff = [0, 0.012 * (1 - seat), 0];
      if (p > 0.38 && p < 0.62) lOff = [0.02 * (1 - back), lerp(-0.32, 0, back), lerp(-0.1, 0, back)];
      const rack = bell(p, 0.76, 0.92);
      if (rack > 0) { rz -= 0.12 * rack; rx += 0.05 * rack; }
    }
  }
  if (F.bolt >= 0) { const b = bell(F.bolt, 0, 1); rz += 0.25 * b; rx -= 0.06 * b; oy += 0.02 * b; }
  let hideGun = false, extra = null;
  if (F.swap > 0) { const k = 1 - Math.abs(F.swap - 0.5) * 2; oy -= 0.34 * k; rx += 0.5 * k; }
  if (F.thr >= 0 || F.thrHold > 0) {
    const p = F.thr >= 0 ? F.thr : 0;
    const down = F.thrHold > 0 ? 1 : 1 - ss(0.55, 1, p);
    oy -= 0.42 * down; rx += 0.6 * down;
    const up = F.thrHold > 0 ? ss(0, 0.2, F.thrHold) : 1 - ss(0, 0.5, p);
    const fling = F.thr >= 0 ? ss(0.0, 0.25, p) : 0;
    if (up > 0.01 || fling > 0) extra = { k: s.throwK || 'grenade', M: [0.06 - fling * 0.05, -0.22 + up * 0.12 + fling * 0.12, 0.34 + fling * 0.3], r: [-0.3 - fling * 1.2, 0.2, 0.1], hide: fling > 0.85 };
    hideGun = down > 0.98;
  }
  if (F.mel >= 0) {
    const p = F.mel;
    const off = 1 - ss(0.7, 1, p) + ss(0, 0.08, p) - 1;
    oy -= 0.35 * clamp(off, 0, 1); ox -= 0.15 * clamp(off, 0, 1);
    const sw = ss(0.1, 0.42, p), back = ss(0.55, 0.9, p);
    extra = { k: 'bat', M: [lerp(-0.25, 0.25, sw) - back * 0.1, lerp(0.05, -0.18, sw) - back * 0.2, 0.42], r: [lerp(-0.6, -1.4, sw), lerp(0.9, -0.6, sw), lerp(0.5, 1.4, sw)], hide: p > 0.92 };
    hideGun = clamp(off, 0, 1) > 0.95;
  }
  const Cm = camM(cam.pos, cam.yaw, cam.pitch);
  const L = m4.mul(Cm, m4.mul(m4.pose(ox, oy, oz, ry, rx, rz), m4.ident()));
  if (!hideGun && !(s.scope && a > 0.85)) {
    out.push({ mesh: F.gun, model: L });
    out.push({ mesh: F.armR, model: L });
    const LM = lOff ? m4.mul(L, m4.pose(lOff[0], lOff[1], lOff[2], 0, lOff[1] * 0.6, 0)) : L;
    out.push({ mesh: F.armL, model: LM });
    if (magOff) {
      const inHand = F.rel > 0.38 && F.rel < 0.66;
      out.push({ mesh: F.mag, model: inHand ? m4.mul(LM, m4.pose(0, 0, 0, 0, 0, 0)) : m4.mul(L, m4.pose(magOff[0], magOff[1], magOff[2], 0, magOff[1] * 1.2, 0)) });
    } else out.push({ mesh: F.mag, model: L });
    if (shell && V.shell) out.push({ mesh: V.shell, model: m4.mul(LM, m4.pose(0.0, 0.0, 0.32, 0, Math.PI / 2, 0)) });
    if (F.flash > 0) {
      const mz = F.muzzle;
      F.flashRot += 1.7;
      out.push({ mesh: F.flashMesh, model: m4.mul(L, m4.pose(mz[0], mz[1], mz[2] + 0.005, 0, 0, F.flashRot, 0.7 + F.flash * 8)), blend: 2, alpha: 1 });
    }
  }
  if (extra && !extra.hide) {
    const mesh = extra.k === 'bat' ? V.batFP : extra.k === 'molotov' ? V.molFP : V.nadeFP;
    if (mesh) out.push({ mesh, model: m4.mul(Cm, m4.pose(extra.M[0], extra.M[1], extra.M[2], extra.r[1], extra.r[0], extra.r[2])) });
  }
  return { L, Cm, a };
}

export function muzzleWorld(F, s, cam) {
  const v = VM[F.kind] || VM.rifle;
  if (F.muzCam && F.gl) {
    const Cm0 = camM(cam.pos, cam.yaw, cam.pitch);
    const k0 = Math.tan((cam.vmFov || 0.85) / 2) / Math.tan((cam.fov || 0.85) / 2);
    const q = m4.apply(Cm0, F.muzCam[0] * k0, F.muzCam[1] * k0, F.muzCam[2]);
    return [q[0], q[1], q[2]];
  }
  const a = F.ads;
  const ox = lerp(v.hip[0], v.ads[0], a), oy = lerp(v.hip[1], v.ads[1], a), oz = lerp(v.hip[2], v.ads[2], a);
  const Cm = camM(cam.pos, cam.yaw, cam.pitch);
  const mz = F.muzzle;
  const k = Math.tan((cam.vmFov || 0.85) / 2) / Math.tan((cam.fov || 0.85) / 2);
  const p = m4.apply(Cm, (ox + mz[0]) * k, (oy + mz[1]) * k, oz + mz[2]);
  return [p[0], p[1], p[2]];
}

export { SURV_LOOK };
