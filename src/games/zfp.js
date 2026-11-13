import { MeshBuilder, m4, hexRgb } from './race3d.js';
import { GUNS } from './zguns.js';
import { MAT, tube, ball, sq } from './siegemesh.js';
import { fpGLItems } from './zfpgl.js';

const C = (h) => (typeof h === 'string' ? hexRgb(h) : h);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;

export const VM = {
  rifle: { hip: [-0.155, -0.2, 0.36], ads: [0, -0.158, 0.27], sight: 0.158, elbowR: [-0.12, -0.3, -0.36], elbowL: [0.07, -0.4, -0.1], magPos: [0, -0.07, 0.13], kick: 0.06, back: 0.035, fov: 0.68 },
  smg: { hip: [-0.15, -0.19, 0.34], ads: [0, -0.125, 0.27], sight: 0.125, elbowR: [-0.12, -0.3, -0.34], elbowL: [0.06, -0.4, -0.14], magPos: [0, -0.1, 0.12], kick: 0.035, back: 0.025, fov: 0.72 },
  shotgun: { hip: [-0.155, -0.19, 0.33], ads: [0, -0.09, 0.2], sight: 0.088, elbowR: [-0.12, -0.3, -0.38], elbowL: [0.07, -0.4, -0.02], magPos: [0.03, -0.01, 0.12], kick: 0.16, back: 0.07, fov: 0.74 },
  sniper: { hip: [-0.155, -0.2, 0.34], ads: [0, -0.152, 0.1], sight: 0.152, elbowR: [-0.12, -0.3, -0.38], elbowL: [0.07, -0.4, -0.06], magPos: [0, -0.04, 0.1], kick: 0.14, back: 0.06, fov: 0.32 },
  pistol: { hip: [-0.13, -0.17, 0.4], ads: [0, -0.086, 0.32], sight: 0.086, elbowR: [-0.1, -0.3, -0.3], elbowL: [0.12, -0.32, -0.26], magPos: [0, -0.04, -0.03], kick: 0.1, back: 0.03, fov: 0.74 },
};

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
  const rk = F.rec;
  let gx = bx * 0.8 - F.swayX * 0.25, gy = by * 0.8 + br - F.swayY * 0.2, gz = -rk * v.back * 0.55;
  let grx = F.swayY * 0.8 * (1 - a * 0.6) - rk * v.kick * 0.5 * (1 - a * 0.5), gry = -F.swayX * 0.9 * (1 - a * 0.6) + F.recY * rk, grz = -F.swayX * 1.2 + Math.sin(F.ph) * 0.02 * bobK + F.recY * rk * 0.6;
  gx += F.spr * -0.02; gy -= F.spr * 0.05; gry += F.spr * 0.55; grz += F.spr * 0.3; grx += F.spr * 0.2;
  const Cg = camM(cam.pos, cam.yaw, cam.pitch);
  const P0 = PIVOT;
  const Lg = m4.mul(Cg, m4.mul(m4.pose(P0[0] + gx, P0[1] + gy, P0[2] + gz, gry, grx, grz), m4.pose(-P0[0], -P0[1], -P0[2], 0, 0, 0)));
  const r = V.R ? fpGLItems(out, V.R, F, s, cam, Lg) : null;
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
  }
  return { L: Lg, Cm: Cg, a };
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

export function fpState(kind, flashMesh) {
  return Object.assign(makeFPState(), { kind, flashMesh, muzzle: (GUNS[kind] && GUNS[kind].muzzle) || [0, 0.08, 0.7] });
}

export function buildFlash(R) {
  const fl = new MeshBuilder();
  for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; const r0 = 0.012, r1 = i % 2 ? 0.05 : 0.085; fl.tri([0, 0, 0], [Math.cos(a) * r1, Math.sin(a) * r1, 0.02], [Math.cos(a + 0.45) * r0, Math.sin(a + 0.45) * r0, 0.004], '#FFE4A0', 1); fl.tri([0, 0, 0.0], [Math.cos(a) * 0.02, Math.sin(a) * 0.02, 0.14], [Math.cos(a + 0.9) * 0.02, Math.sin(a + 0.9) * 0.02, 0.12], '#FFD080', 1); }
  return R.mesh(fl.build());
}

function throwObj(m, kind) {
  if (kind === 'grenade') { sq(m, 0, 0.035, 0.0, 0.03, 0.038, 0.03, 0.9, 1, C('#3E4A32'), MAT.plastic, 12, 8); tube(m, [0, 0.07, 0], [0, 0.085, 0], 0.012, 0.012, 8, C('#5A5E66'), MAT.metal); tube(m, [0.012, 0.08, 0], [0.03, 0.06, 0.01], 0.003, 0.003, 5, C('#8A8E96'), MAT.metal); }
  else { tube(m, [0, 0.0, 0], [0, 0.11, 0], 0.03, 0.03, 12, C('#3A6A2A'), MAT.glass); tube(m, [0, 0.11, 0], [0, 0.16, 0], 0.03, 0.011, 12, C('#3A6A2A'), MAT.glass); tube(m, [0, 0.16, 0], [0, 0.2, 0.01], 0.011, 0.012, 8, C('#E8E0C8'), MAT.matte); ball(m, 0, 0.205, 0.012, 0.016, C('#FFB03A'), MAT.glow, 8); }
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

