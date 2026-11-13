import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, Portal, useBackClose, FONT } from '../App.jsx';
import { createRenderer, m4 } from './race3d.js';
import { Sfx } from './sfx.js';
import { Sheet, injectCss } from './livekit.jsx';
import { GPill, GPanel, GTitle, GNotices, useNotices, useJoystick, GJoy, injectKitCss, kitTap, useCtlLook, useGameStage, GLobbySheet, GSeg, GFeed, GSkin, GChatFeed, useChatFeed, TOUCHY, weakPhone, GSettings, GSetRow, GSetSlider, GSetToggle } from './gamekit.jsx';
import { makeSim, collide, rayBlocked, WEAPONS, WKEYS, THROW, ZT, ZKEYS, SURV, SURV_GUN, hitDamage, PETS, ACID, waveSize } from './zsim.js';
import { makeView, TIERS, ZMODEL, coreFiles, packList } from './zview.js';
import { resIndex, resFetch, resLock, resQueue, resFront, resItem, resOn, resSize, resHas, resUrl, resWipe } from './zres.js';
import { ZBoot } from './zboot.jsx';
import { ZLobby, CFONT as WFONT } from './zlobby.jsx';
import { sampleClip, blendInto, blendMask, poseSkin } from './zmodel.js';
import { RDOG_COL, poseRealDog, realDogState } from './zdog.js';
import { stepSurf } from './zsurf.js';
import { hitRay } from './zhit.js';
import { makeRig, poseDog, solve } from './zrig.js';
import { GUNS } from './zguns.js';
import { SCHAR, GUN_SV, charOf, charCol, emoDur, ssNew, ssPose, ssMatrix, ssGun } from './zsurv.js';
import { fpItems, muzzleWorld, ID_SKIN } from './zfp.js';
import { DOGS } from './zlooks.js';
import { buildDog } from './zbody.js';
import { floorH, TOWN, solids, FALL, POND, pondR, RAIL } from './ztown.js';
import { pondParts } from './zpond.js';
import { tpGunItems } from './zfpgl.js';
import { houseY, levelStep, inHouse, houseBlocked, houseRects, HOUSE } from './zhouse.js';
import { ZA } from './zaudio.js';
import { CBtn, TopBtn, Ico, drawMinimap, EMOTE_LIST, QUICK_LINES, EmoteWheel } from './zhud.jsx';
import { cloudOn, openCloud, pingRegions, listRooms, bestRegion, mineRoom, saveLive, readLive, REGION_NAMES, REGION_KEYS } from './zcloud.js';

const PREF = { gfxo: 'zchat-zombie-gfxo', opt: 'zchat-zombie-opt', bots: 'zchat-zombie-bots', sv: 'zchat-zombie-sv', col: 'zchat-zombie-col', gun: 'zchat-zombie-gun', gfx: 'zchat-zombie-gfx', best: 'zchat-zombie-best', pet: 'zchat-zombie-pet', view: 'zchat-zombie-view', sens: 'zchat-zombie-sens', torch: 'zchat-zombie-torch' };
const readJson = (k) => { try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch { return {}; } };
const OPT0 = { adsK: 1, assist: 1, dmg: 1, vib: 1, bars: 1, xcol: 'white', fps: 60, spr: 0, adsMode: 'tap' };
const HUD_KEY = 'zchat-zombie-hud';
const XCOL = { white: '#FFFFFF', green: '#7CFF6B', yellow: '#FFE14A', cyan: '#5FF2FF' };
const getPref = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch { return d; } };
const setPref = (k, v) => { try { localStorage.setItem(k, String(v)); } catch {} };
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const THR_COL = new Float32Array([1, 1, 1, 0]);
const BOSS_K = 1.65;
const fy = (x, z, lv) => { const h = houseY(x, z, lv | 0); return h == null ? floorH(x, z) : h; };
const landLv = (x, z, lv) => (lv && houseY(x, z, 1) != null && !houseBlocked(x, z, 1, false) ? 1 : 0);
const lerp = (a, b, t) => a + (b - a) * t;
const angLerp = (a, b, t) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return a + d * t; };
const angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };
const fmt = (n) => Math.round(n).toLocaleString('en-US');
const rnd = (a, b) => a + Math.random() * (b - a);
const secondOf = (g) => (g === 'pistol' ? 'smg' : 'pistol');
const ADS_FOV = { rifle: 0.6, smg: 0.68, shotgun: 0.74, pistol: 0.7, sniper: 0.26 };
const BASE_FOV = 0.94;
const ROADS = [[-200, -4, 200, 4], [TOWN.sideX - TOWN.sideW, -200, TOWN.sideX + TOWN.sideW, -4]];
const BLOCKS = solids().rects.filter((r) => (r[2] - r[0]) * (r[3] - r[1]) > 1.5).concat(houseRects());
const WATER = [Array.from({ length: 40 }, (_, i) => { const a = (i / 40) * Math.PI * 2, r = 0.92 * pondR(a); return [POND.x + Math.cos(a) * POND.rx * r, POND.z + Math.sin(a) * POND.rz * r]; })];

const CORPSES = [[-8, 1.6, 0.4, 'walker', 101, 0], [12, -2.2, 2.2, 'worker', 102, 1], [24.5, 2.6, -1.2, 'walker', 103, 0], [-30, -12, 1.4, 'runner', 104, 1], [40, -30, 0.2, 'walker', 105, 0], [48, -6.5, 2.8, 'riot', 106, 1], [13, -33, -0.6, 'walker', 107, 0], [-18, 16, 1.1, 'worker', 108, 1], [58, -20, -2.2, 'walker', 109, 0], [16, 12, 0.7, 'screamer', 110, 1], [-4, -12, 2.6, 'walker', 111, 0], [-21, -30, 0.9, 'runner', 112, 1]];
const FIRES = [[-14, 1.2, 0.8, 0.85], [-11, -24.5, 0.42, 0.97], [36, -3, 0.55, 0.9], [-52, -1.5, 0.9, 0.85], [46.5, -62, 0.7, 0.8], [62, 10, 0.42, 0.97], [-38, -45, 0.42, 0.97]];
const SMOKES = [[-52, -1.5, 1], [65, -50, 1.3], [-38, -45, 0.7], [46.5, -66, 0.8]];
const STAINS = [[-6, 0.5, 1.4], [0, -1.8, 0.9], [9, 1.2, 1.1], [18, -0.6, 1.6], [30, 2, 1.0], [-20, -2.6, 1.2], [44, -14, 1.0], [5, -20, 1.3], [-10, -32, 0.9], [-2, -6, 0.8], [26, -24, 1.1]];
function scenery(g, V) {
  const zm = V.zm, zn = zm ? zm.n : -1;
  if (g.scn && g.scn.V === V && g.scn.zn === zn) return g.scn;
  const corpses = CORPSES.map(([x, z, yaw, k, id, mode]) => {
    const y = floorH(x, z);
    const ck = zm && mzPick(zm, k, id), md = ck && zm[ck];
    if (md) {
      const S = mzNew(md, k), cn = mode === 0 ? 'dying' : 'death', c = zm.anims.clips[cn];
      mzPlay(S, cn, c.dur - 0.02, true); S.prev = null; S.fade = 1; S.rate = 0;
      S.s = ((MZ_TALL[k] || (ZT[k] || ZT.walker).h) / md.M.top) * S.sv;
      mzPose(md, zm.anims, S);
      mzMatrix(S, x, y, z, yaw, S.s);
      const W = S.W, M = S.M;
      const px = M[0] * W[3] + M[4] * W[7] + M[8] * W[11] + M[12], pz = M[2] * W[3] + M[6] * W[7] + M[10] * W[11] + M[14];
      return { x, z, yaw, k, id, y, md, S, px, pz };
    }
    return null;
  }).filter(Boolean);
  g.scn = { V, zn, corpses };
  return g.scn;
}
function drawScenery(g, V, items, parts, lights, at, t, inView) {
  const S = scenery(g, V);
  V.env.time = t;
  pondParts(parts, t, Math.hypot(FALL.x - at[0], FALL.z - at[2]));
  for (const c of S.corpses) {
    const d = Math.hypot(c.x - at[0], c.z - at[2]);
    parts.push({ x: c.px, y: c.y + 0.02, z: c.pz, size: 1.0, alpha: 0.85, type: 22, dw: -1, seed: (c.id % 13) / 13 });
    if (d > 70 || !inView(c.x, c.y + 0.3, c.z, 1.6)) continue;
    items.push({ mesh: c.md.mesh, model: c.S.M, skin: c.S.skin, tex: c.md.tex, nrm: c.md.nrm, col: c.S.col, cast: false });
  }
  for (const [x, z, k] of STAINS) parts.push({ x, y: floorH(x, z) + 0.015, z, size: k, alpha: 0.7, type: 22, dw: -1, seed: ((x * 13 + z * 7) % 10 + 10) % 10 / 10 });
  for (const [x, z, k, h] of FIRES) {
    const y = floorH(x, z) + h;
    for (let i = 0; i < 12; i++) {
      const s0 = (i * 0.31 + t * (1.1 + (i % 3) * 0.25)) % 1, sp = 0.3 + s0;
      parts.push({ x: x + Math.sin(i * 2.1 + t * 2.3) * 0.25 * k * sp, y: y + s0 * 1.9 * k, z: z + Math.cos(i * 1.7 + t * 1.9) * 0.25 * k * sp, size: (1.15 - s0 * 0.75) * k, alpha: 0.95 * (1 - s0) * Math.min(1, s0 * 8), type: 12, seed: (i * 0.618) % 1 });
    }
    for (let i = 0; i < 6; i++) {
      const s0 = (i / 6 + t * 0.45) % 1;
      parts.push({ x: x + s0 * 0.8 * k + Math.sin(i + t) * 0.2 * k, y: y + 1.2 * k + s0 * 3.5 * k, z: z - s0 * 0.4 * k, size: (0.7 + s0 * 1.6) * k, alpha: 0.42 * (1 - s0) * Math.min(1, s0 * 5), type: 11, seed: (i * 0.37) % 1 });
    }
    for (let i = 0; i < 5; i++) {
      const s0 = (i / 5 + t * 0.7 + i * 0.13) % 1;
      parts.push({ x: x + Math.sin(i * 3.3 + s0 * 5) * 0.4 * k * s0, y: y + 0.3 * k + s0 * 2.6 * k, z: z + Math.cos(i * 2.7 + s0 * 4) * 0.4 * k * s0, size: 0.05, alpha: 0.9 * (1 - s0), type: 7, seed: 0 });
    }
    lights.push({ p: [x, y + 1, z], r: 6 + k * 6, c: [(2.0 + Math.sin(t * 13 + x) * 0.3) * k * 1.4, 1.1 * k * 1.4, 0.4 * k * 1.4], d: Math.hypot(x - at[0], z - at[2]) });
  }
  for (const [x, z, k] of SMOKES) for (let i = 0; i < 9; i++) { const s0 = (i / 9 + t * 0.035) % 1; parts.push({ x: x + s0 * 7 * k, y: floorH(x, z) + 2 + s0 * 28 * k, z: z - s0 * 3 * k, size: (2.5 + s0 * 8) * k, alpha: 0.55 * (1 - s0) * Math.min(1, s0 * 6), type: 11, seed: (i * 0.13) % 1 }); }
}

function poseInto(o, x, y, z, yaw) { const c = Math.cos(yaw), s = Math.sin(yaw); o[0] = c; o[1] = 0; o[2] = -s; o[3] = 0; o[4] = 0; o[5] = 1; o[6] = 0; o[7] = 0; o[8] = s; o[9] = 0; o[10] = c; o[11] = 0; o[12] = x; o[13] = y; o[14] = z; o[15] = 1; return o; }

const portraitCache = new Map();
let portraitR = null;
function portrait(kind, key) {
  const k = `${kind}:${key}`;
  if (portraitCache.has(k)) return portraitCache.get(k);
  let url = '';
  try {
    if (!portraitR) { const cv = document.createElement('canvas'); cv.width = 168; cv.height = 168; portraitR = { cv, R: createRenderer(cv, { keep: true, shadowSize: 256, aa: true }) }; }
    const P = portraitR;
    if (P.R) {
      const items = [];
      const D = DOGS.find((d) => d.key === key) || DOGS[0];
      const B = buildDog(D, 1);
      const rig = makeRig(B.joints, true);
      poseDog(rig, { t: 1, sit: true });
      items.push({ mesh: P.R.skin(B.data), model: m4.pose(0, 0, 0, 0.5), bones: new Float32Array(solve(rig)) });
      const cam = { pos: [0.55, 0.85, 1.25], at: [0, 0.62, 0.15], fov: 0.62 };
      const env = { sunDir: [-0.5, 0.6, 0.62], sunCol: [2.0, 1.75, 1.5], skyCol: [0.5, 0.52, 0.58], gndCol: [0.3, 0.26, 0.2], fogCol: [0.2, 0.2, 0.2], fogSun: [1, 1, 1], fogSunLin: [1, 1, 1], horizon: [0.1, 0.11, 0.1], zenith: [0.16, 0.17, 0.15], fogDen: 0.0001, exposure: 1.0, shadowRange: 3, clouds: 0, cloud: [1, 1, 1], time: 0, detail: 0, shadows: false };
      P.R.render({ env, cam, items, parts: [] });
      url = P.cv.toDataURL('image/png');
      for (const it of items) if (it.bones) P.R.drop(it.mesh);
    }
  } catch { url = ''; }
  portraitCache.set(k, url);
  return url;
}

function rayZ(o, d, maxD, list) {
  let best = null;
  for (const A of list) {
    const T = ZT[A.k] || ZT.walker;
    if (A.k === 'crawler') {
      const fx = Math.sin(A.yaw), fz = Math.cos(A.yaw);
      const cx = A.x + fx * 0.15, cz = A.z + fz * 0.15, r = 0.5;
      const ox = o[0] - cx, oz = o[2] - cz;
      const a = d[0] * d[0] + d[2] * d[2], b = 2 * (ox * d[0] + oz * d[2]), c = ox * ox + oz * oz - r * r;
      const disc = b * b - 4 * a * c;
      if (disc < 0 || a < 1e-6) continue;
      const t = (-b - Math.sqrt(disc)) / (2 * a);
      if (t < 0.2 || t > maxD || (best && t > best.t)) continue;
      const y = o[1] + d[1] * t - A.y;
      if (y < 0 || y > 0.62) continue;
      const hx = o[0] + d[0] * t - A.x, hz = o[2] + d[2] * t - A.z;
      best = { A, t, head: hx * fx + hz * fz > 0.35 && y > 0.25 };
      continue;
    }
    if (A.hd) {
      const hx = A.hd[0] - o[0], hy = A.hd[1] - o[1], hz = A.hd[2] - o[2];
      const tc = hx * d[0] + hy * d[1] + hz * d[2];
      const hr = A.hr || 0.15;
      if (tc > 0.2 && tc < maxD && (!best || tc < best.t) && hx * hx + hy * hy + hz * hz - tc * tc < hr * hr) { best = { A, t: tc, head: true }; continue; }
    }
    const r = T.r * 1.08 * (A.boss ? 1.45 : 1), h = A.hd ? A.top : T.h * (A.boss ? BOSS_K : 1);
    const fx = o[0] - A.x, fz = o[2] - A.z;
    const a = d[0] * d[0] + d[2] * d[2], b = 2 * (fx * d[0] + fz * d[2]), c = fx * fx + fz * fz - r * r;
    const disc = b * b - 4 * a * c;
    if (disc < 0 || a < 1e-6) continue;
    const s = Math.sqrt(disc);
    let t = (-b - s) / (2 * a);
    if (t < 0.2) t = (-b + s) / (2 * a);
    if (t < 0.2 || t > maxD || (best && t > best.t)) continue;
    const y = o[1] + d[1] * t - A.y;
    if (y < 0 || y > h) continue;
    best = { A, t, head: !A.hd && y > h * 0.82 };
  }
  return best;
}

const MZ_HEAD = 5;
const MZ_UPPER = Array.from({ length: 43 }, (_, i) => i + 1);
const MZ_FADE = 0.22;
const MZ_TALL = { crawler: 1.75 };
const MZ_HIT = { attack: 0.8, m_swipe: 1.07, m_punch: 0.1, bite: 0.75 };
const MZ_LOW = new Set(['crawl', 'bite', 'death', 'dying', 'm_die']);
function mzPick(zm, k, id) {
  const L = ZMODEL[k] || ZMODEL.walker;
  const pref = L[(id * 7 + 3) % L.length];
  if (zm[pref]) return pref;
  for (const n of L) if (zm[n]) return n;
  return k !== 'brute' && zm.zgirl ? 'zgirl' : null;
}
function mzNew(md, k) {
  const nb = md.M.nb, f = () => new Float32Array(nb * 4);
  const S = { q: f(), q2: f(), q3: f(), q4: f(), hp: [0, 0, 0], hp2: [0, 0, 0], hp3: [0, 0, 0], W: new Float32Array(nb * 12), skin: new Float32Array(nb * 12), cur: k === 'crawler' ? 'crawl' : 'stride', t: Math.random() * 4, rate: 1, prev: null, pt: 0, prate: 1, fade: 1, fdur: MZ_FADE, M: new Float32Array(16), col: new Float32Array(4), sv: 0.95 + Math.random() * 0.09, attN: 0, s: 1, ht: 9, ua: null, ut: 0, ur: 1, uEnd: 0, act: null, actUntil: 0, actMin: 0 };
  const v = k === 'brute' ? 0.9 : 0.74 + Math.random() * 0.12;
  S.col[0] = v * (0.96 + Math.random() * 0.1); S.col[1] = v * (0.93 + Math.random() * 0.08); S.col[2] = v * (0.92 + Math.random() * 0.1); S.col[3] = 0;
  return S;
}
function mzPlay(S, clip, t0, force, fdur) {
  if (S.cur === clip && !force) return;
  S.prev = S.cur; S.pt = S.t; S.prate = S.rate; S.cur = clip; S.t = t0 || 0; S.fade = 0; S.fdur = fdur || MZ_FADE;
}
function mzTick(S, dt) {
  S.t += dt * S.rate;
  if (S.prev) { S.pt += dt * S.prate; S.fade += dt / S.fdur; if (S.fade >= 1) { S.prev = null; S.fade = 1; } }
  S.ht += dt;
  if (S.ua) { S.ut += dt * S.ur; if (S.ut > S.uEnd + 0.3) S.ua = null; }
}
function mzSample(md, C, name, t, q, hp) {
  const c = C[name];
  sampleClip(c, md.M.nb, t, q, hp);
  const k = md.M.hipsH / c.srcH;
  hp[0] *= k; hp[1] *= k; hp[2] *= k;
}
function mzPose(md, anims, S) {
  const M = md.M, nb = M.nb, C = anims.clips;
  mzSample(md, C, C[S.cur] ? S.cur : 'stride', S.t, S.q, S.hp);
  let Q = S.q, HP = S.hp;
  if (S.prev && C[S.prev]) { mzSample(md, C, S.prev, S.pt, S.q2, S.hp2); blendInto(S.q2, S.hp2, S.q, S.hp, nb, S.fade); Q = S.q2; HP = S.hp2; }
  const low = MZ_LOW.has(S.cur);
  if (S.ua && C[S.ua] && !low) {
    const w = Math.min(1, (S.ut - S.u0) / 0.25) * Math.min(1, Math.max(0, (S.uEnd + 0.3 - S.ut) / 0.3));
    if (w > 0) { sampleClip(C[S.ua], nb, S.ut, S.q3, S.hp3); blendMask(Q, S.q3, MZ_UPPER, w); }
  }
  if (S.ht < 1.05 && C.hit && !low) {
    const w = Math.min(1, S.ht / 0.08) * (1 - Math.max(0, (S.ht - 0.45) / 0.6)) * 0.9;
    if (w > 0) { sampleClip(C.hit, nb, S.ht + 0.05, S.q4, S.hp3); blendMask(Q, S.q4, MZ_UPPER, w); }
  }
  poseSkin(M, Q, HP, 1, S.W, S.skin);
}
function mzUpper(S, clip, t0, rate, end) { S.ua = clip; S.ut = t0; S.u0 = t0; S.ur = rate; S.uEnd = end; }
function mzLoco(S, md, C, k, v, stun) {
  const nat = (n) => C[n].speed * (md.M.hipsH / C[n].srcH) * S.s;
  let want;
  if (k === 'crawler') want = 'crawl';
  else if (k === 'brute') want = v < 0.1 ? 'm_idle' : v < 2.6 ? 'stride' : 'm_run';
  else { const g = S.cur; want = v < 0.1 ? 'idle' : v < (g === 'walk' ? 0.85 : 0.65) ? 'walk' : v < (g === 'run' ? 1.9 : 2.15) ? 'stride' : 'run'; }
  if (want !== S.cur) {
    const cur = C[S.cur], nxt = C[want];
    const ph = cur && cur.loop && nxt.loop ? ((S.t / cur.dur) % 1 + 1) % 1 : Math.random();
    mzPlay(S, want, ph * nxt.dur, true, 0.3);
  }
  const c = C[want];
  if (c.speed > 0) { const lo = want === 'walk' ? 0.5 : 0.6, hi = want === 'walk' ? 2.4 : want === 'crawl' ? 2.6 : 1.7; S.rate = v < 0.1 ? 0.35 : clamp(v / Math.max(0.05, nat(want)), lo, hi); } else S.rate = 1;
  if (stun) S.rate *= 0.35;
}
function mzMatrix(S, x, y, z, yaw, s) {
  poseInto(S.M, x, y, z, yaw);
  const M = S.M;
  M[0] *= s; M[1] *= s; M[2] *= s; M[4] *= s; M[5] *= s; M[6] *= s; M[8] *= s; M[9] *= s; M[10] *= s;
}
function mzHead(S, out) {
  const W = S.W, o = MZ_HEAD * 12, M = S.M;
  const lx = W[o + 3] + W[o + 1] * 0.09, ly = W[o + 7] + W[o + 5] * 0.09, lz = W[o + 11] + W[o + 9] * 0.09;
  out[0] = M[0] * lx + M[4] * ly + M[8] * lz + M[12];
  out[1] = M[1] * lx + M[5] * ly + M[9] * lz + M[13];
  out[2] = M[2] * lx + M[6] * ly + M[10] * lz + M[14];
  return out;
}
function mzImpact(c) {
  if (c.impact != null) return c.impact;
  const y0 = c.hp[1];
  let f = c.nf - 1;
  for (let i = 0; i < c.nf; i++) if (c.hp[i * 3 + 1] < y0 * 0.4) { f = i; break; }
  c.impact = f / c.fps;
  return c.impact;
}

function arcLand(o, yaw, pitch, speed, lv0) {
  const pts = [];
  const vh = Math.cos(pitch) * speed, vy = Math.sin(pitch) * speed;
  let x = o[0], y = o[1], z = o[2], vx = Math.sin(yaw) * vh, vz = Math.cos(yaw) * vh, uy = vy;
  for (let i = 0; i < 90; i++) {
    const dt = 0.035;
    x += vx * dt; z += vz * dt; y += uy * dt; uy -= 9.8 * dt;
    if (i % 2 === 0) pts.push([x, y, z]);
    const lv = landLv(x, z, lv0), gy = fy(x, z, lv);
    if (y <= gy + 0.05) { pts.push([x, gy + 0.05, z]); return { x, z, lv, pts }; }
    if (rayBlocked(o[0], o[2], x, z, o[1], y)) { const c = collide(x - vx * dt * 2, z - vz * dt * 2, 0.3, lv); return { x: c[0], z: c[1], lv, pts }; }
  }
  return { x, z, lv: landLv(x, z, lv0), pts };
}

const WAVE_NEW = { 2: 'Workers and crawlers join in', 3: 'Runners join in. They are fast', 4: 'Bloaters and screamers join in', 5: 'Riot zombies join in. They wear armor', 6: 'Spitters join in. Stay out of their acid' };
function waveNote(w) { return [WAVE_NEW[w], w % 5 === 0 ? 'Brutes are coming' : ''].filter(Boolean).join('. '); }
const TIPS = [
  'Reload now so the wave starts with a full magazine',
  'Grenades refill when the next wave starts',
  'You heal a little after every wave',
  'Hold the green heart near a downed friend to help them up',
  'Head shots do the most damage',
  'Kill screamers first. Their scream makes others angry',
  'Shoot bloaters from far away. They explode',
  'Stay out of the green acid spitters leave behind',
  'Brutes come every fifth wave. Throw grenades at them',
  'Your dog bites zombies that get close to you',
  'Stay close to your team so they can help you up',
];
function breakTip(wave) {
  const next = (wave || 0) + 1;
  if (WAVE_NEW[next] && Math.floor(Date.now() / 5000) % 2 === 0) return `Next wave: ${WAVE_NEW[next].toLowerCase()}`;
  if (next % 5 === 0 && Math.floor(Date.now() / 5000) % 2 === 0) return 'Next wave brings brutes. Save your grenades';
  return TIPS[Math.floor(Date.now() / 6000) % TIPS.length];
}

export function ZombieGamePage({ me, myId, onClose, join = null, friends = [], onInvite = null, online = null, isAdmin = false }) {
  injectKitCss();
  injectCss();
  const look = useCtlLook('zombie');
  const GS = useGameStage(look);
  const { top, right, bottom, left } = GS.at;
  const land = GS.land;
  const [phase, setPhase] = useState('load');
  const [sv, setSv] = useState(() => { const v = getPref(PREF.sv, 'jay'); return SURV.includes(v) ? v : 'jay'; });
  const [col, setCol] = useState(() => { const v = Number(getPref(PREF.col, 0)) | 0; if (v >= 100 && v < 100 + SCHAR.length) return v; const s0 = getPref(PREF.sv, 'jay'); return charCol(charOf(SURV.includes(s0) ? s0 : 'jay', v).k); });
  const [gun, setGun] = useState(() => { const v = getPref(PREF.gun, ''); return WEAPONS[v] ? v : SURV_GUN[sv] || 'rifle'; });
  const [pet, setPet] = useState(() => { const v = getPref(PREF.pet, 'rex'); return PETS.includes(v) || v === 'none' ? v : 'rex'; });
  const [tier, setTier] = useState(() => { const v = Number(getPref(PREF.gfx, -1)); return v >= 0 && v <= 2 ? v : weakPhone() ? 0 : 1; });
  const [view, setView] = useState(() => (getPref(PREF.view, 'fp') === 'tp' ? 'tp' : 'fp'));
  const [sens, setSens] = useState(() => clamp(Number(getPref(PREF.sens, 1)) || 1, 0.4, 2.2));
  const [torch, setTorch] = useState(() => getPref(PREF.torch, '1') !== '0');
  const [hudL, setHudL] = useState(() => readJson(HUD_KEY) || {});
  const [hudEdit, setHudEdit] = useState(null);
  const [hudSel, setHudSel] = useState(null);
  const [locked, setLocked] = useState(false);
  const [pings, setPings] = useState(null);
  const [rooms, setRooms] = useState(null);
  const [reg, setReg] = useState(null);
  const [bots, setBots] = useState(() => getPref(PREF.bots, '1') !== '0');
  const [rejoin, setRejoin] = useState(null);
  const [lobbyTab, setLobbyTab] = useState(null);
  const [lobbyMode, setLobbyMode] = useState(null);
  const [myRoom, setMyRoom] = useState(null);
  const [invited, setInvited] = useState(() => new Set());
  const [gunIcons, setGunIcons] = useState({});
  const [pendJoin, setPendJoin] = useState(() => (join && !join.back ? join : null));
  const [gfxo, setGfxo] = useState(() => readJson(PREF.gfxo));
  const [tierWant, setTierWant] = useState(null);
  const [gfxBuilt, setGfxBuilt] = useState(() => JSON.stringify(readJson(PREF.gfxo)));
  const [opt, setOpt] = useState(() => ({ ...OPT0, ...readJson(PREF.opt) }));
  const best = useMemo(() => (pings ? bestRegion(pings) : null), [pings]);
  const [mode, setMode] = useState(null);
  const [hud, setHud] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [result, setResult] = useState(null);
  const [banner, setBanner] = useState(null);
  const [netErr, setNetErr] = useState('');
  const [feedK, setFeedK] = useState([]);
  const [notes, pushNote] = useNotices();
  const [chatFeed, pushChat] = useChatFeed();
  const [chatLog, setChatLog] = useState([]);
  const [chatText, setChatText] = useState('');
  const [boot, setBoot] = useState({ st: 'check', got: 0, tot: 0, pct: 0 });
  const [bootTry, setBootTry] = useState(0);
  const [cvKey, setCvKey] = useState(0);
  const [MakerC, setMakerC] = useState(null);
  const [makerErr, setMakerErr] = useState(false);
  const [fix, setFix] = useState(0);
  const lostRef = useRef(null);
  const bootFails = useRef(0);
  const [emoIcons, setEmoIcons] = useState([]);
  const [resTick, setResTick] = useState(0);
  const [lo, setLo] = useState({ ok: false, f: 0 });
  const pendRef = useRef(null);
  const cvRef = useRef(null);
  const wrapRef = useRef(null);
  const mapRef = useRef(null);
  const hitRef = useRef(null);
  const hurtRef = useRef(null);
  const xhRef = useRef(null);
  const sexRef = useRef('m');
  useEffect(() => { sexRef.current = charOf(sv, col).v || 'm'; }, [sv, col]);
  const rdRef = useRef(null);
  const bossRef = useRef(null);
  const dmgRef = useRef(null);
  const hbRef = useRef(null);
  const dirRef = useRef(null);
  const tagRef = useRef(null);
  const hudRef = useRef(null);
  const scopeRef = useRef(null);
  const G = useRef(null);
  if (!G.current) G.current = { V: null, keys: new Set(), lookP: new Map(), yaw: Math.PI, pitch: -0.04, fire: false, fireL: false, ads: false, revHold: false, snaps: [], dying: [], fires: [], fx: [], tr: [], dn: [], anim: new Map(), panim: new Map(), pets: new Map(), pemo: new Map(), roster: new Map(), me: null, sim: null, net: null, t: 0, sendT: 0, pend: [], pendSh: [], hm: 0, hmKill: 0, hurtT: 0, hurtDirs: [], menuT: 0, best: Number(getPref(PREF.best, 0)) || 0, lights: [], flashT: 0, recP: 0, bloom: 0, thr: null, emo: null, stepPh: 0, voiceT: 0, heartT: 0, seenBrute: new Set(), menuRigs: null, mapT: 0, lastAt: 0 };
  const myFirst = String((me && me.name) || 'You').split(' ')[0].slice(0, 16);
  const J = useJoystick(wrapRef, { radius: () => (GS.land ? 56 : 50), rot: () => GS.side, zone: (x, y, b) => x < b.width * 0.42 && y > b.height * 0.3, enabled: () => phase === 'play', noCapture: true });
  const canInvite = cloudOn() && !!onInvite;

  useBackClose(true, () => { if (sheet) setSheet(null); else if (phase === 'play') quit(); else onClose(); });

  useEffect(() => {
    let alive = true;
    let iv = 0;
    const g = G.current;
    const k = charOf(sv, col).k, guns = [gun, secondOf(gun)];
    const t = setTimeout(async () => {
      try {
        setPhase('load');
        setBoot({ st: 'check', got: 0, tot: 0, pct: 0 });
        resLock(false);
        if (bootFails.current >= 2) { bootFails.current = 0; await resWipe(); }
        await resIndex();
        const mu = 'sounds/dead/mu_lobby.mp3';
        if (!resHas(mu)) { try { await resFetch([mu]); } catch {} }
        if (alive && ZA.start()) ZA.music('mu_lobby', { vol: 0.9 });
        const core = coreFiles(k, guns);
        const tot = resSize(core.filter((p) => !resHas(p)));
        if (tot > 0) {
          let last = 0;
          setBoot({ st: 'down', got: 0, tot, pct: 0 });
          await resFetch(core, (got, total) => { const now = performance.now(); if (alive && (now - last > 80 || got >= total)) { last = now; setBoot({ st: 'down', got, tot: total, pct: 0 }); } });
        }
        if (!alive) return;
        setBoot({ st: 'load', got: 0, tot: 0, pct: 0 });
        await new Promise((r) => requestAnimationFrame(() => r()));
        if (!alive) return;
        if (g.V) { g.V.dispose(); g.V = null; }
        const V = makeView(cvRef.current, tier, JSON.parse(gfxBuilt || '{}'));
        if (!alive) { if (V) V.dispose(); return; }
        if (!V) { setNetErr('gl'); setPhase('menu'); return; }
        g.V = V;
        V.onLost = () => lostRef.current && lostRef.current();
        g.menuRigs = null;
        Promise.all(EMOTE_LIST.map(([e]) => resUrl(`/dead/emo/${e}.webp`).catch(() => ''))).then((u) => { if (alive) setEmoIcons(u); });
        Promise.all(WKEYS.map((w) => resUrl(`/dead/ui/g_${w}.webp`).then((u) => [w, u]).catch(() => [w, '']))).then((l) => { if (alive) setGunIcons(Object.fromEntries(l)); });
        iv = setInterval(() => {
          if (!alive || V.dead) { clearInterval(iv); return; }
          const r = V.readyFor(k, guns);
          if (r.err) { clearInterval(iv); bootFails.current++; setBoot({ st: 'err', why: 'load', got: 0, tot: 0, pct: 0 }); return; }
          setBoot((b) => (b.st === 'load' && Math.abs(b.pct - r.pct) < 0.01 ? b : { st: 'load', got: 0, tot: 0, pct: r.pct }));
          if (r.ok) { clearInterval(iv); bootFails.current = 0; resQueue(packList(k, guns)); setPhase('menu'); }
        }, 100);
      } catch { if (alive) { bootFails.current++; setBoot({ st: 'err', why: 'net', got: 0, tot: 0, pct: 0 }); } }
    }, 60);
    return () => { alive = false; clearTimeout(t); clearInterval(iv); };
  }, [tier, gfxBuilt, bootTry]);
  useEffect(() => () => { const g = G.current; if (g.net) g.net.close(); if (g.V) g.V.dispose(); ZA.stopAll(); resLock(true); }, []);
  useEffect(() => {
    if (phase !== 'menu' || !cloudOn() || join) return undefined;
    let alive = true;
    const loc = readLive();
    if (loc) setRejoin(loc);
    mineRoom().then((m) => { if (alive && m) setRejoin(m); });
    const tm = setTimeout(() => { if (alive) setRejoin(null); }, 32000);
    return () => { alive = false; clearTimeout(tm); };
  }, [phase]);
  useEffect(() => {
    if (phase !== 'menu' || !cloudOn()) return undefined;
    let alive = true;
    pingRegions().then((p) => { if (alive) setPings(p); });
    const load = () => listRooms().then((r) => { if (alive) setRooms(r); });
    load();
    const iv = setInterval(load, 8000);
    return () => { alive = false; clearInterval(iv); };
  }, [phase]);
  useEffect(() => {
    if (phase === 'menu' || phase === 'play') {
      Sfx.music(null, false);
      if (ZA.init()) { ZA.ambience(true, phase === 'play' ? 0.3 : 0); ZA.music(phase === 'play' ? 'mu_game' : 'mu_lobby', { vol: phase === 'play' ? 0.5 : 0.9 }); }
      if (phase === 'play') { const g = G.current; g.voStart = true; g.bestSaid = false; g.waveDown = 0; g.lastTl = -1; }
    }
  }, [phase]);
  useEffect(() => () => { ZA.ambience(false); }, []);
  useEffect(() => {
    if (phase !== 'menu' || !join || !join.back || !cloudOn() || G.current.joined) return;
    G.current.joined = true;
    const tm = setTimeout(() => start({ reg: join.reg, r: join.r, squad: /^[fh]/.test(String(join.r)) }), 300);
    return () => clearTimeout(tm);
  }, [phase, join]);
  useEffect(() => { if (phase === 'play') { setPendJoin(null); setLobbyTab(null); } }, [phase]);

  const loadout = () => ({ k: charOf(sv, col).k, guns: [gun, secondOf(gun)] });
  const loadoutReady = () => { const V = G.current.V; const L = loadout(); return !!V && V.readyFor(L.k, L.guns).ok; };
  const wantLoadout = (now) => { const L = loadout(); resFront(`g:${L.guns[1]}`, now); resFront(`g:${L.guns[0]}`, now); resFront(`s:${L.k}`, now); };
  useEffect(() => {
    if (phase !== 'menu') return undefined;
    const warm = () => {
      const V = G.current.V;
      if (!V) return;
      for (const c of SCHAR) if (resItem(`s:${c.k}`).ready) V.warm(c.k);
      for (const w of WKEYS) if (resItem(`g:${w}`).ready) V.fp(w);
    };
    warm();
    return resOn(() => { setResTick((n) => n + 1); warm(); });
  }, [phase]);
  useEffect(() => {
    if (phase !== 'menu') return undefined;
    const L = loadout();
    const keys = [`s:${L.k}`, ...L.guns.map((w) => `g:${w}`)];
    const tick = () => {
      const V = G.current.V;
      let got = 0, size = 0;
      for (const k of keys) { const st = resItem(k); got += st.ready ? st.size : st.got; size += st.size; }
      const ok = !!V && V.readyFor(L.k, L.guns).ok;
      const f = size ? got / size : 1;
      setLo((o) => (o.ok === ok && Math.abs(o.f - f) < 0.01 ? o : { ...o, ok, f }));
      return ok;
    };
    tick();
    const iv = setInterval(tick, 200);
    return () => clearInterval(iv);
  }, [phase, sv, col, gun, resTick]);
  useEffect(() => {
    if (phase === 'menu' && !loadoutReady()) wantLoadout(false);
  }, [phase, sv, col, gun]);
  useEffect(() => {
    if (!lo.ok || phase !== 'menu' || !pendRef.current) return;
    const m = pendRef.current;
    pendRef.current = null;
    start(m);
  }, [lo.ok, phase]);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  lostRef.current = () => {
    const g = G.current;
    if (g.V) { try { g.V.dispose(); } catch {} }
    g.V = null;
    g.scn = null;
    g.menuRigs = null;
    if (g.pets) g.pets.clear();
    setCvKey((n) => n + 1);
    if (phaseRef.current === 'play') setFix((n) => n + 1);
    else setBootTry((n) => n + 1);
  };
  useEffect(() => {
    if (!fix) return undefined;
    let alive = true;
    let iv = 0;
    const g = G.current;
    const t = setTimeout(() => {
      if (!alive || !cvRef.current) return;
      const V = makeView(cvRef.current, tier, JSON.parse(gfxBuilt || '{}'));
      if (!V) { setFix(0); quit(); return; }
      V.onLost = () => lostRef.current && lostRef.current();
      const k = charOf(sv, col).k, guns = g.me && g.me.slots ? g.me.slots.slice() : [gun, secondOf(gun)];
      iv = setInterval(() => {
        if (!alive || V.dead) { clearInterval(iv); return; }
        const r = V.readyFor(k, guns);
        if (r.err) { clearInterval(iv); V.dispose(); setFix(0); quit(); return; }
        if (!r.ok) return;
        clearInterval(iv);
        V.prepHands();
        for (const c of SCHAR) V.warm(c.k);
        g.V = V;
        if (g.me) { const nf = V.fp(g.me.w); nf.rel = -1; nf.thr = -1; nf.thrHold = 0; nf.mel = -1; nf.bolt = -1; nf.swap = 0; g.F = nf; }
        setFix(0);
      }, 100);
    }, 80);
    return () => { alive = false; clearTimeout(t); clearInterval(iv); };
  }, [fix]);
  const pickRoom = (reg) => {
    const list = (rooms && rooms[reg]) || [];
    const open = list.filter((r) => r.p < (r.cap || 50)).sort((a, b) => b.p - a.p);
    if (open.length) return open[0].n;
    let n = 1;
    while (list.some((r) => r.n === n)) n++;
    return n;
  };
  const newRoomId = (k) => `${k}${Math.random().toString(36).slice(2, 10).replace(/[^a-z0-9]/g, 'x').padEnd(8, '0')}`;
  const newSquad = () => newRoomId(bots ? 'f' : 'h');
  const regNow = reg || best || 'asia';
  const openRooms = ((rooms && rooms.open) || []).filter((o) => !(mode && String(mode.r) === o.r)).slice(0, 20);
  const quickPlay = () => {
    const rg = regNow;
    if (bots) { start({ reg: rg, r: pickRoom(rg) }); return; }
    const list = ((rooms && rooms.open) || []).filter((o) => o.reg === rg && !o.b && o.p < (o.cap || 50)).sort((a, b) => b.p - a.p);
    start({ reg: rg, r: list.length ? list[0].r : newRoomId('x') });
  };
  const createRoom = (who) => {
    const id = newRoomId(who === 'friends' ? (bots ? 'f' : 'h') : (bots ? 'o' : 'x'));
    setSheet(null);
    start({ reg: regNow, r: id, squad: who === 'friends' });
    if (who === 'friends' && canInvite) setTimeout(() => setSheet('invite'), 400);
  };

  const nameOf = (id) => { const g = G.current; if (id === myId) return 'You'; const r = g.roster.get(id); return r ? r.n : 'Friend'; };

  const start = (m) => {
    const g = G.current;
    if (!g.V) return;
    if (!loadoutReady()) { pendRef.current = m; wantLoadout(true); return; }
    pendRef.current = null;
    Sfx.init();
    ZA.init();
    kitTap();
    setPref(PREF.sv, sv); setPref(PREF.col, col); setPref(PREF.gun, gun); setPref(PREF.pet, pet);
    g.snaps = []; g.dying = []; g.fires = []; g.fx = []; g.holes = []; g.tr = []; g.dn = []; g.anim.clear(); g.panim.clear(); g.pets.clear(); g.pemo.clear(); g.roster.clear(); g.pend = []; g.pendSh = []; g.t = 0; g.sendT = 0; g.over = false; g.seenBrute = new Set(); g.thr = null; g.emo = null; g.hurtDirs = [];
    const second = secondOf(gun);
    g.me = { x: 0, z: -24, lv: 0, w: gun, slots: [gun, second], slot: 0, mag: { [gun]: WEAPONS[gun].mag, [second]: WEAPONS[second].mag }, rel: 0, relMax: 1, fcd: 0, nades: 2, molos: 1, ph: 0, hp: 100, st: 0, rev: 0, kills: 0, pts: 0, mv: 0, speed: 0, mcd: 0, swapT: 0, sprint: false, bolt: 0 };
    g.V.prepHands();
    g.F = g.V.fp(gun);
    g.F.rel = -1; g.F.swap = 0; g.F.thr = -1; g.F.thrHold = 0; g.F.mel = -1; g.F.bolt = -1;
    g.yaw = 0; g.pitch = -0.04;
    setResult(null); setSheet(null); setNetErr(''); setFeedK([]); setChatLog([]);
    const meta = { n: myFirst, sv, col, w: gun, pet: pet === 'none' ? '' : pet };
    if (m.solo) {
      g.room = null;
      const S = makeSim({ botFill: bots ? 4 : 0, maxAlive: TIERS[tier].zmax, firstBreak: 8 });
      S.addPlayer(myId, meta);
      const p = S.players.get(myId);
      g.me.x = p.x; g.me.z = p.z;
      g.sim = S; g.simAcc = 0;
      for (const r of S.roster()) g.roster.set(r[0], { n: r[1], sv: r[2], col: r[3], bot: !!r[4], pk: r[5] || '', st: r[6] | 0 });
      applySnap(S.snap(), performance.now());
    } else {
      g.sim = null;
      g.net = openCloud({
        g: 'zombie', r: m.r, reg: m.reg, meta,
        onState: (s) => { if (s.err === 'full') { setNetErr('full'); } else if (s.err === 'lost') setNetErr('lost'); else if (s.ok) setNetErr(''); if (s.rtt) g.rtt = s.rtt; },
        onMsg: (msg) => onNet(msg),
      });
      g.room = { reg: m.reg, r: String(m.r) };
      saveLive(g.room);
      g.liveAt = Date.now();
    }
    if (typeof window !== 'undefined' && window.__zfake) window.__zdead = g;
    for (const h of g.loops || []) h.stop();
    g.loops = null;
    const wl = () => {
      if (G.current !== g || g.loops || !g.sim && !g.net) return;
      const w = ZA.loopAt('water', [FALL.x + 1.2, 1.0, FALL.z], { ref: 5, roll: 1.2, max: 46, vol: 1.1 });
      if (!w) { setTimeout(wl, 1500); return; }
      g.loops = [w];
      for (const [x, z, k, h] of FIRES) { const f = ZA.loopAt('fire', [x, floorH(x, z) + h + 0.4, z], { ref: 1.5 + k * 2, roll: 1.4, max: 24, vol: 0.45 + k * 0.4 }); if (f) g.loops.push(f); }
    };
    setTimeout(wl, 800);
    resLock(true);
    hudPrev.current = null;
    setMode(m);
    setPhase('play');
    J.reset();
  };
  const quit = () => {
    const g = G.current;
    if (g.net) { g.net.close(); g.net = null; saveLive(null); }
    g.room = null;
    for (const h of g.loops || []) h.stop();
    g.loops = null;
    g.sim = null;
    setMode(null); setResult(null); setSheet(null); setHud(null);
    hudPrev.current = null;
    resLock(false);
    const want = JSON.stringify(readJson(PREF.gfxo));
    const tw = tierWant != null && tierWant !== tier ? tierWant : null;
    if (want !== gfxBuilt || tw != null) { if (g.V) { g.V.dispose(); g.V = null; } setPhase('load'); setGfxBuilt(want); if (tw != null) setTier(tw); setTierWant(null); return; }
    setPhase('menu');
  };

  const onNet = (m) => {
    const g = G.current;
    if (m.t === '$hi') {
      for (const r of m.roster || []) g.roster.set(r[0], { n: r[1], sv: r[2], col: r[3], bot: !!r[4], pk: r[5] || '', st: r[6] | 0 });
      if (m.s) applySnap(m.s, performance.now());
      const p = (m.s && m.s.p || []).find((q) => q[0] === myId);
      if (p && g.me) { g.me.x = p[1] / 10; g.me.z = p[2] / 10; g.me.lv = p[9] & 64 ? 1 : 0; g.me.ys = null; }
      return;
    }
    if (m.t === '$s') {
      if (m.rs) { g.roster.clear(); for (const r of m.rs) g.roster.set(r[0], { n: r[1], sv: r[2], col: r[3], bot: !!r[4], pk: r[5] || '', st: r[6] | 0 }); }
      applySnap(m, performance.now());
      return;
    }
    if (m.t === 'sh' && Array.isArray(m.sh)) { for (const s of m.sh.slice(0, 4)) remoteShot(m.from, s, m.w); return; }
    if (m.t === 'ct' && typeof m.x === 'string') { const t = m.x.slice(0, 90); pushChat(nameOf(m.from), t, '#9CD4FF'); setChatLog((l) => [...l.slice(-30), { who: nameOf(m.from), t }]); return; }
    if (m.t === 'emo' && typeof m.e === 'string') remoteEmote(m.from, m.e);
  };
  const remoteEmote = (id, e) => {
    const g = G.current;
    if (EMOTE_LIST.some((q) => q[0] === e)) g.pemo.set(id, { k: e, t: 0 });
  };

  const applySnap = (s, at) => {
    const g = G.current;
    const zs = new Map();
    const Z = s.z || [];
    for (let i = 0; i + 6 < Z.length; i += 7) zs.set(Z[i], { id: Z[i], k: ZKEYS[Z[i + 1]] || 'walker', x: Z[i + 2] / 10, z: Z[i + 3] / 10, yaw: Z[i + 4] / 100, hp: Z[i + 5], fl: Z[i + 6], lv: Z[i + 6] & 32 ? 1 : 0 });
    const ps = new Map();
    for (const p of s.p || []) ps.set(p[0], { id: p[0], x: p[1] / 10, z: p[2] / 10, yaw: p[3] / 100, aim: p[4] / 100, w: p[5], hp: p[6], st: p[7], rev: p[8] / 100, fl: p[9], kills: p[10], pts: p[11], px: (p[12] || 0) / 10, pz: (p[13] || 0) / 10, pyaw: (p[14] || 0) / 100, pst: p[15] == null ? -1 : p[15], lv: p[9] & 64 ? 1 : 0, plv: p[16] | 0 });
    g.snaps.push({ at, zs, ps, ac: s.ac || [] });
    if (g.snaps.length > 4) g.snaps.shift();
    g.wave = s.w; g.ph = s.ph; g.tl = s.tl; g.zl = s.zl;
    if (g.voStart) { g.voStart = false; ZA.say('vo_survival', { at: 0.6 }); }
    if (s.ph === 0 && s.tl !== g.lastTl) {
      if (s.tl === 6) ZA.say('vo_prepare');
      if (s.tl > 0 && s.tl <= 3) ZA.play('thud', { rate: 0.6, vol: 1 });
    }
    g.lastTl = s.ph === 0 ? s.tl : -1;
    const mine = ps.get(myId);
    const sex = sexRef.current;
    if (mine && g.me) {
      const was = g.me.st;
      if (mine.hp < g.me.hp - 0.5 && mine.st === 0) g.hurtT = Math.max(g.hurtT, 0.35);
      if (mine.st === 0 && mine.hp < 35 && g.me.hp >= 35) ZA.call('medic', sex, { cd: 25 });
      g.me.hp = mine.hp; g.me.st = mine.st; g.me.rev = mine.rev; g.me.kills = mine.kills; g.me.pts = mine.pts;
      if (was !== 0 && mine.st === 0 && Math.hypot(mine.x - g.me.x, mine.z - g.me.z) > 3) { g.me.x = mine.x; g.me.z = mine.z; g.me.lv = mine.lv; }
      if (was === 0 && mine.st === 1) { ZA.synth('thump', { vol: 0.8, f: 50, len: 0.4 }); g.F && (g.F.rel = -1); g.me.rel = 0; ZA.call('help', sex, { cd: 10, at: 0.7 }); }
      if (s.ph === 1 && mine.st === 0) {
        let near = 0;
        for (const z of zs.values()) if (Math.abs(z.x - g.me.x) < 6 && Math.abs(z.z - g.me.z) < 6) near++;
        if (near >= 6) ZA.call('back', sex, { cd: 40, chance: 0.5 });
        if (ps.size > 1 && g.suddenW !== s.w) {
          let up = 0;
          for (const q of ps.values()) if (q.st === 0) up++;
          if (up === 1) { g.suddenW = s.w; ZA.say('vo_sudden'); }
        }
      }
    }
    for (const z of zs.values()) if (z.k === 'brute' && !g.seenBrute.has(z.id)) { g.seenBrute.add(z.id); ZA.play('stinger', { vol: 0.9 }); ZA.call('look', sex, { cd: 20, at: 0.9 }); pushFeed('A brute is here', '#FF8A7A'); }
    for (const e of s.ev || []) onEvent(e, ps, zs);
  };

  const fxPush = (p) => { const g = G.current; if (g.fx.length < 320) g.fx.push(p); };
  const lightPush = (p, r, c, life) => { const g = G.current; if (g.lights.length < 10) g.lights.push({ p, r, c, life, max: life }); };
  const remoteShot = (id, s, w) => {
    if (!Array.isArray(s) || s.length < 7) return;
    const o = [s[0] / 10, s[1] / 10, s[2] / 10], d = [s[3] / 100, s[4] / 100, s[5] / 100], L = s[6] / 10;
    const rh = holeAt(o, d, Math.min(L, 70), 0);
    tracer(o, rh ? rh.p : [o[0] + d[0] * L, o[1] + d[1] * L, o[2] + d[2] * L]);
    flash(o, d, w === 'shotgun' ? 1.3 : w === 'pistol' ? 0.75 : 1, false);
    lightPush(o, 6, [2.6, 1.6, 0.7], 0.06);
    ZA.gun(w || 'rifle', { pos: o, vol: 0.7 });
    const P = G.current.panim.get(id);
    if (P) P.fireT = 0.15;
  };
  const tracer = (a, b) => { const g = G.current; if (g.tr.length < 80) g.tr.push({ a, b, life: 0.06 }); };
  const flash = (o, d, k, fp) => {
    fxPush({ x: o[0] + d[0] * 0.03, y: o[1] + d[1] * 0.03, z: o[2] + d[2] * 0.03, size: (fp ? 0.13 : 0.32) * k, alpha: 1, type: 29, life: 0.045, hold: 1, seed: Math.random() });
    const L = (fp ? 0.2 : 0.42) * k;
    fxPush({ x: o[0] + d[0] * L, y: o[1] + d[1] * L, z: o[2] + d[2] * L, size: (fp ? 0.045 : 0.1) * k, alpha: 1, type: 30, life: 0.04, hold: 1, dx: d[0], dy: d[1], dz: d[2], dw: L });
  };
  const holeAt = (o, d, maxT, n) => {
    const g = G.current;
    const h = hitRay(o, d, maxT);
    if (!h) return null;
    if (n < 4) {
      g.holes = g.holes || [];
      g.holes.push({ x: h.p[0], y: h.p[1], z: h.p[2], n: h.n, s: rnd(0.07, 0.1), seed: Math.random(), t: 0 });
      if (g.holes.length > 70) g.holes.shift();
      fxPush({ x: h.p[0] + h.n[0] * 0.08, y: h.p[1] + h.n[1] * 0.08, z: h.p[2] + h.n[2] * 0.08, size: rnd(0.16, 0.26), alpha: 0.55, type: 24, life: 0.55, vy: 0.35, seed: Math.random() });
      if (!h.ground && Math.random() < 0.5) for (let i = 0; i < 3; i++) fxPush({ x: h.p[0], y: h.p[1], z: h.p[2], size: 0.025, alpha: 1, type: 27, life: 0.25, vx: h.n[0] * 3 + rnd(-1.5, 1.5), vy: h.n[1] * 3 + rnd(0, 2), vz: h.n[2] * 3 + rnd(-1.5, 1.5), grav: 1 });
    }
    return h;
  };
  const blood = (x, y, z, n, k = 1) => { for (let i = 0; i < n; i++) fxPush({ x: x + rnd(-0.1, 0.1), y: y + rnd(-0.1, 0.12), z: z + rnd(-0.1, 0.1), size: rnd(0.14, 0.3) * k, alpha: 0.9, type: 23, life: rnd(0.25, 0.5), vy: rnd(-0.6, 0.8), vx: rnd(-1, 1), vz: rnd(-1, 1), seed: Math.random(), grav: 1 }); };

  const onEvent = (e, ps, zs) => {
    const g = G.current;
    const k = e[0];
    if (k === 'k') {
      const A = g.anim.get(e[1]);
      const last = g.snaps.length > 1 ? g.snaps[g.snaps.length - 2].zs.get(e[1]) : null;
      const src = A || last;
      if (src) {
        const kk = (A && A.k) || (last && last.k) || 'walker';
        const by = e[2] === myId && g.me ? g.me : ps && ps.get(e[2]);
        let mode = 0, side = Math.random() < 0.5 ? 1 : -1;
        if (e[4] === 'x') mode = 3;
        else if (by) { const a = Math.atan2(by.x - src.x, by.z - src.z); const rel = Math.abs(angDiff(src.yaw || 0, a)); mode = rel < Math.PI / 2 ? 1 : 0; if (e[3] && Math.random() < 0.5) mode = 2; }
        const dlv = src.lv | 0;
        g.dying.push({ id: e[1], k: kk, x: src.x, z: src.z, y: fy(src.x, src.z, dlv), yaw: src.yaw || 0, t: 0, mode, side, head: !!e[3], thud: false, M: new Float32Array(16), ma: A && A.ma ? A.ma : null, mk: A && A.ma ? A.mk : null });
        if (g.dying.length > 16) g.dying.shift();
        const y = fy(src.x, src.z, dlv);
        blood(src.x, y + 1.2, src.z, e[3] ? 10 : 6, e[3] ? 1.3 : 1);
        ZA.zvoice(kk, [src.x, y + 1.4, src.z], 'die');
        if (e[3]) ZA.play('bone', { pos: [src.x, y + 1.6, src.z], vol: 0.6, rate: 1.3 });
      }
      g.anim.delete(e[1]);
      if (e[2] === myId) {
        g.hmKill = 0.35; g.hm = 0.25; ZA.synth('click', { f: 4200, vol: 0.35 });
        const now = performance.now();
        g.kt = (g.kt || []).filter((t) => now - t < 1600);
        g.kt.push(now);
        if (g.kt.length >= 3 && now > (g.multiT || 0)) { g.multiT = now + 9000; g.kt = []; ZA.say('vo_multi'); }
        if (src && ((A && A.k) || (last && last.k)) === 'brute') ZA.call('kill', sexRef.current, { cd: 4, at: 0.5 });
      }
    } else if (k === 'ex') {
      const x = e[1] / 10, z = e[2] / 10, r = e[3] / 10, y = fy(x, z, e[5]);
      if (G.current.V && G.current.V.R && G.current.V.R.fxOk()) {
        fxPush({ x, y: y + r * 0.62, z, size: r * 1.35, alpha: 1, type: 31, life: 1.5, flip: 1.5, vy: 0.5, grow: r * 0.12 });
        for (let i = 0; i < 2; i++) { const a = Math.random() * 6.28, d = r * 0.35; fxPush({ x: x + Math.cos(a) * d, y: y + r * 0.45, z: z + Math.sin(a) * d, size: r * 0.8, alpha: 0.9, type: 31, life: 1.3 + i * 0.2, flip: 1.3 + i * 0.2, vy: 0.7 }); }
        for (let i = 0; i < 6; i++) { const a = Math.random() * 6.28, d = Math.random() * r * 0.7; fxPush({ x: x + Math.cos(a) * d, y: y + 1.2 + Math.random() * 2, z: z + Math.sin(a) * d, size: 2.2 + Math.random() * 2.4, alpha: 0.55, type: 11, life: 2.2 + Math.random(), vy: 1.2 }); }
        G.current.holes = G.current.holes || [];
        G.current.holes.push({ x, y: y + 0.02, z, n: [0, 1, 0], s: r * 0.42, seed: Math.random(), t: 0 });
      } else {
        for (let i = 0; i < 26; i++) { const a = Math.random() * 6.28, d = Math.random() * r * 0.6; fxPush({ x: x + Math.cos(a) * d, y: y + 0.4 + Math.random() * 2.2, z: z + Math.sin(a) * d, size: 1.2 + Math.random() * 1.6, alpha: 0.95, type: 12, life: 0.45 + Math.random() * 0.4, vy: 1.2 }); }
        for (let i = 0; i < 16; i++) { const a = Math.random() * 6.28, d = Math.random() * r * 0.7; fxPush({ x: x + Math.cos(a) * d, y: y + 1 + Math.random() * 2, z: z + Math.sin(a) * d, size: 2 + Math.random() * 2.4, alpha: 0.7, type: 11, life: 1.8 + Math.random(), vy: 1.4 }); }
      }
      for (let i = 0; i < 14; i++) fxPush({ x, y: y + 0.3, z, size: 0.06, alpha: 1, type: 27, life: 0.6, vx: rnd(-8, 8), vy: rnd(3, 9), vz: rnd(-8, 8), grav: 1 });
      if (e[4] === 'b') { blood(x, y + 1, z, 22, 2); for (let i = 0; i < 8; i++) fxPush({ x: x + rnd(-1.5, 1.5), y: y + 0.4, z: z + rnd(-1.5, 1.5), size: 1.2, alpha: 0.6, type: 26, life: 2.5, seed: Math.random() }); }
      lightPush([x, y + 1.2, z], 16, [5, 3, 1.4], 0.35);
      ZA.play(e[4] === 'b' ? 'boom2' : 'boom', { pos: [x, y + 1, z], ref: 14, roll: 0.6, muff: 80, rev: 0.4 });
      if (g.me) { const d = Math.hypot(x - g.me.x, z - g.me.z); if (d < 12) g.shake = Math.max(g.shake || 0, (1 - d / 12) * 0.5); }
    } else if (k === 'fi') {
      const fyy = fy(e[1] / 10, e[2] / 10, e[5]);
      g.fires.push({ x: e[1] / 10, z: e[2] / 10, lv: e[5] | 0, r: e[3] / 10, life: e[4], max: e[4], snd: 0 });
      ZA.synth('glass', { pos: [e[1] / 10, fyy + 0.4, e[2] / 10] });
      ZA.synth('fire', { pos: [e[1] / 10, fyy + 0.4, e[2] / 10], vol: 1.2 });
    } else if (k === 'bo') {
      const A = g.anim.get(e[1]);
      setBanner({ t: 'Boss incoming', s: 'A giant brute is coming. Aim for the head and keep moving', w: g.wave || 0, at: Date.now(), boss: 1 });
      ZA.play('scream1', { rate: 0.5, vol: 1.2, pri: 3 });
      ZA.play('z_war', { rate: 0.45, vol: 1.3, at: 0.25, pri: 3 });
      ZA.play('boom3', { rate: 0.6, vol: 0.6, at: 0.1 });
      ZA.musLevel(1);
      g.shake = Math.max(g.shake || 0, 0.35);
      if (A) A.boss = 1;
    } else if (k === 'bk') {
      setBanner({ t: 'Boss down', s: e[2] === myId ? 'You killed the boss. Bonus points' : 'The boss is dead', w: g.wave || 0, at: Date.now(), boss: 2 });
      ZA.say('vo_flawless');
      ZA.musLevel(0.8);
      g.bossA = null;
    } else if (k === 'zh') {
      const A = g.anim.get(e[1]);
      if (A) { const T0 = e[2] === myId ? g.me : ps && ps.get(e[2]); A.biteDown = !!(T0 && T0.st === 1); A.att = 0; A.attN = (A.attN || 0) + 1; if (Math.random() < 0.6) ZA.zvoice(A.k, [A.x, A.y + 1.5, A.z], 'attack'); }
      if (A && A.boss) {
        ZA.play('thud', { pos: [A.x, A.y, A.z], rate: 0.5, vol: 1.3, ref: 8, roll: 0.6, max: 70 });
        if (g.me) { const d0 = Math.hypot(A.x - g.me.x, A.z - g.me.z); if (d0 < 16) g.shake = Math.max(g.shake || 0, (1 - d0 / 16) * 0.45); }
        for (let i = 0; i < 10; i++) { const an = (i / 10) * 6.28; fxPush({ x: A.x + Math.cos(an) * 1.6, y: A.y + 0.2, z: A.z + Math.sin(an) * 1.6, size: rnd(0.8, 1.3), alpha: 0.45, type: 24, life: 0.9, vy: 0.5, seed: Math.random() }); }
      }
      if (e[2] === myId) {
        g.hurtT = 0.5;
        ZA.synth('hit', { vol: 0.9 });
        if (A && g.me) g.hurtDirs.push({ a: Math.atan2(A.x - g.me.x, A.z - g.me.z), t: 1 });
        try { if (!g.opt || g.opt.vib) { if (navigator.vibrate) navigator.vibrate(25); } } catch {}
      } else { const P = g.panim.get(e[2]); if (P) P.hit = 1; }
    } else if (k === 'bs') {
      const p = ps.get(e[1]);
      const tg = g.anim.get(e[2]);
      const P = g.panim.get(e[1]);
      if (p) {
        const o = P && P.muzzle ? P.muzzle : [p.x, fy(p.x, p.z, p.lv) + 1.4, p.z];
        if (tg) tracer(o, [tg.x, tg.y + 1.2, tg.z]);
        if (tg) { const dx = tg.x - o[0], dy = tg.y + 1.2 - o[1], dz = tg.z - o[2], L = Math.hypot(dx, dy, dz) || 1; flash(o, [dx / L, dy / L, dz / L], 0.9, false); }
        lightPush(o, 5, [2.4, 1.5, 0.6], 0.05);
        ZA.gun(p.w, { pos: o, vol: 0.6 });
        if (P) P.fireT = 0.15;
      }
    } else if (k === 'dn') {
      g.waveDown = (g.waveDown || 0) + 1;
      pushFeed(`${nameOf(e[1])} is down`, '#FF8A7A');
    } else if (k === 'rv') {
      if (e[2]) pushFeed(`${nameOf(e[2])} helped ${nameOf(e[1])} up`, '#9CF0B4');
      if (e[1] === myId) ZA.synth('calm', { vol: 0.6 });
    } else if (k === 'w') {
      if (g.me) { g.me.nades = 2; g.me.molos = 1; }
      setBanner({ t: `Wave ${e[1]}`, s: waveNote(e[1]), d: waveSize(e[1], Math.max(1, ps ? [...ps.values()].filter((q) => q.st !== 2).length : 1)), w: e[1], at: Date.now() });
      ZA.play('wave_go');
      ZA.play('z_horde', { at: 0.9, vol: 0.55, cat: 'horde', lim: 1 });
      if (e[1] <= 5) { ZA.say(`vo_r${e[1]}`, { at: 0.75 }); ZA.say('vo_fight'); } else ZA.say('vo_fight', { at: 0.75 });
      ZA.call('go', sexRef.current, { at: 2.9, cd: 40, chance: 0.5 });
      ZA.musLevel(0.8);
      g.waveDown = 0;
      ZA.ambience(true, 1);
    } else if (k === 'wc') {
      const healed = g.me && g.me.st === 0 && g.me.hp < 100;
      setBanner({ t: `Wave ${e[1]} cleared`, s: '', clear: true, pts: 25 * e[1], heal: healed, back: g.waveDown > 0, w: e[1], at: Date.now() });
      ZA.synth('calm', { vol: 0.8 });
      ZA.say(g.waveDown ? 'vo_obj' : 'vo_flawless', { at: 0.4 });
      if (e[1] > g.best && !g.bestSaid) { g.bestSaid = true; ZA.say('vo_best'); }
      ZA.musLevel(0.5);
      ZA.ambience(true, 0.3);
    } else if (k === 'go') {
      const best = Math.max(g.best, e[1]);
      g.best = best; setPref(PREF.best, best);
      setResult({ wave: e[1], kills: g.me ? g.me.kills : 0, pts: g.me ? g.me.pts : 0, best, at: Date.now() });
      ZA.synth('horn', { vol: 0.6 });
      ZA.say('vo_failed', { at: 0.5 }); ZA.say('vo_gameover');
      ZA.musLevel(0.3);
    } else if (k === 'rs') {
      if (e[1] === '*') { setResult(null); if (g.me) { for (const s0 of g.me.slots) g.me.mag[s0] = WEAPONS[s0].mag; } }
    } else if (k === 'pj') {
      if (g.roster.size < 14 && e[1] !== myId) { const r = g.roster.get(e[1]); if (r && !r.bot) pushNote(`${r.n} joined`, 'join'); }
    } else if (k === 'pa' || k === 'pb' || k === 'px') {
      const r = g.roster.get(e[1]);
      if (r) r.st = k === 'pa' ? 1 : k === 'px' ? 2 : 0;
      if (e[1] !== myId && r && !r.bot) pushNote(k === 'pa' ? `${r.n} lost connection` : k === 'pb' ? `${r.n} is back` : `${r.n} left. A bot plays for them this wave`, k === 'pb' ? 'join' : 'leave');
    } else if (k === 'th') {
      const p = ps.get(e[1]);
      if (p && e[1] !== myId) { g.fx.push({ nade: true, k: e[2], x0: p.x, z0: p.z, lv0: p.lv | 0, x1: e[3] / 10, z1: e[4] / 10, lv1: e[5] | 0, t: 0, life: e[2] === 'grenade' ? THROW.grenade.fuse : 0.9 }); const P = g.panim.get(e[1]); if (P) P.thr = 0; ZA.play('whoosh', { pos: [p.x, 1.5, p.z] }); }
    } else if (k === 'm') {
      const P = g.panim.get(e[1]); if (P) P.mel = 0;
    } else if (k === 'pz') {
      const A = g.anim.get(e[2]);
      const D = g.pets.get(e[1]);
      if (D) { D.bite = 1; if (e[3]) D.leap = 1; }
      if (A) { A.hit = 1; A.hitSide = Math.random() < 0.5 ? 1 : -1; blood(A.x, A.y + (e[3] ? 1.2 : 0.8), A.z, 4); }
      if (D && (e[3] || Math.random() < 0.45)) {
        const near = e[1] === myId ? 1 : 0.6, pos = [D.x, (D.y || 0) + 0.6, D.z];
        if (e[3] && (D.angryT || 0) < g.t) { D.angryT = g.t + 6; ZA.play('d_angry', { pos, vol: near, vary: 0.04, cat: 'dog', lim: 2, ref: 5, roll: 0.9, max: 60 }); }
        else ZA.play(e[3] ? 'd_growl' : `d_bark${1 + ((Math.random() * 4) | 0)}`, { pos, vol: near, dur: e[3] ? 0.9 : 0, vary: 0.06, cat: 'dog', lim: 2, ref: 5, roll: 0.9, max: 60 });
      }
    } else if (k === 'sc') {
      const A = g.anim.get(e[1]);
      if (A) { A.scr = 0.001; ZA.synth('shriek', { pos: [A.x, A.y + 1.6, A.z], vol: 1.1, ref: 8, muff: 60 }); ZA.zvoice('screamer', [A.x, A.y + 1.6, A.z], 'attack'); }
      if (A && g.me && Math.hypot(A.x - g.me.x, A.z - g.me.z) < 20) pushFeed('A screamer made them angry', '#FFB86A');
    } else if (k === 'sp') {
      const A = g.anim.get(e[1]);
      if (A) { A.spit = 0.001; A.spitN = (A.spitN || 0) + 1; g.fx.push({ spit: true, x0: A.x, y0: A.y + 1.55, z0: A.z, x1: e[2] / 10, z1: e[3] / 10, lv1: A.lv | 0, t: 0, life: 0.85 }); ZA.synth('spit', { pos: [A.x, A.y + 1.5, A.z], vol: 1 }); }
    } else if (k === 'ah') {
      if (e[1] === myId) { g.hurtT = Math.max(g.hurtT, 0.3); g.acidT = 0.5; ZA.synth('sizzle', { vol: 0.6, len: 0.4 }); }
    }
  };
  const pushFeed = (text, colr) => setFeedK((v) => [...v.slice(-4), { id: `${Date.now()}${Math.random()}`, text, col: colr, life: 4.2 }]);

  const camDir = (g, extraYaw = 0, extraPitch = 0) => { const y = g.yaw + extraYaw, p = g.pitch + extraPitch; return [Math.sin(y) * Math.cos(p), Math.sin(p), Math.cos(y) * Math.cos(p)]; };
  const assist = (g, W, list) => {
    if (!TOUCHY) return null;
    const cam = g.cam;
    let best = null, bd = g.ads ? 0.085 : 0.06;
    for (const A of list) {
      const T = ZT[A.k] || ZT.walker;
      const d = Math.hypot(A.x - cam.pos[0], A.z - cam.pos[2]);
      if (d > W.rng + 4 || d < 0.5) continue;
      const ay = Math.atan2(A.x - cam.pos[0], A.z - cam.pos[2]);
      const hy = A.k === 'crawler' ? 0.35 : T.h * 0.62;
      const ap = Math.atan2(A.y + hy - cam.pos[1], d);
      const s = Math.hypot(angDiff(g.yaw, ay), (ap - g.pitch) * 0.8);
      const hx = A.hd ? A.hd[0] : A.x, hz = A.hd ? A.hd[2] : A.z, hY = A.hd ? A.hd[1] : A.y + (A.k === 'crawler' ? 0.45 : T.h * 0.9);
      const hd = Math.hypot(hx - cam.pos[0], hz - cam.pos[2]);
      const ay2 = Math.atan2(hx - cam.pos[0], hz - cam.pos[2]), ap2 = Math.atan2(hY - cam.pos[1], hd);
      const s2 = Math.hypot(angDiff(g.yaw, ay2), (ap2 - g.pitch) * 0.8);
      const lim = bd * (1 + 1.2 / Math.max(2, d));
      if (s2 < s && s2 < lim && s2 < (best ? best.s : 9)) best = { s: s2, ay: ay2, ap: ap2, A };
      else if (s < lim && s < (best ? best.s : 9)) best = { s, ay, ap, A };
    }
    return best;
  };

  const fireGun = (g) => {
    const M = g.me;
    const W = WEAPONS[M.w];
    if (!W || M.st !== 0) return;
    if (M.rel > 0 || M.fcd > 0 || M.swapT > 0 || g.thr || M.bolt > 0) return;
    if ((M.mag[M.w] == null ? W.mag : M.mag[M.w]) <= 0) { ZA.play('dry', {}); M.fcd = 0.25; startReload(g); return; }
    M.mag[M.w] = (M.mag[M.w] == null ? W.mag : M.mag[M.w]) - 1;
    M.fcd = 1 / W.rate;
    M.fireT = 0.25;
    M.sprint = false;
    const cam = g.cam;
    if (!cam) return;
    const list = [];
    for (const a of g.anim.values()) list.push(a);
    const hits = [], sh = [];
    const mz = g.view === 'fp' ? muzzleWorld(g.F, {}, { pos: cam.pos, yaw: g.yaw, pitch: g.pitch, fov: cam.fov, vmFov: 0.98 }) : (g.myMuzzle || cam.pos);
    const as = W.pel === 1 && (!g.opt || g.opt.assist) ? assist(g, W, list) : null;
    if (as && g.fire) { g.yaw = angLerp(g.yaw, as.ay, 0.12); g.pitch = lerp(g.pitch, as.ap, 0.08); }
    const sp0 = W.spr * (M.speed > 1 ? 1.5 : 1) * (g.ads ? 0.3 : 1) * (W.pel > 1 ? 1 : 1) + g.bloom * (g.ads ? 0.3 : 1);
    let killShown = false, nHole = W.pel > 1 ? 1 : 0;
    for (let p = 0; p < W.pel; p++) {
      const sp = W.pel > 1 ? W.spr * (g.ads ? 0.75 : 1) : sp0;
      let ey = (Math.random() - 0.5) * 2 * sp, ep = (Math.random() - 0.5) * 2 * sp;
      if (as && p === 0) { ey = angDiff(g.yaw, as.ay) * 0.85 + ey * 0.3; ep = (as.ap - g.pitch) * 0.85 + ep * 0.3; }
      const d = camDir(g, ey, ep);
      const hit = rayZ(cam.pos, d, W.rng, list);
      let end = W.rng;
      if (hit && !rayBlocked(M.x, M.z, hit.A.x, hit.A.z, fy(M.x, M.z, M.lv) + 1.45, cam.pos[1] + d[1] * hit.t)) {
        end = hit.t;
        hits.push([hit.A.id, hit.head ? 1 : 0]);
        const hx = cam.pos[0] + d[0] * hit.t, hy = cam.pos[1] + d[1] * hit.t, hz = cam.pos[2] + d[2] * hit.t;
        const dmg = hitDamage(M.w, hit.A.k, hit.head, hit.t);
        blood(hx, hy, hz, hit.head ? 4 : 2, hit.head ? 1.2 : 0.8);
        g.hm = 0.16; g.hmHead = hit.head;
        hit.A.hit = 1; hit.A.head = hit.head; hit.A.hitSide = Math.random() < 0.5 ? 1 : -1;
        hit.A.hpGuess = (hit.A.hpGuess == null ? (ZT[hit.A.k] || ZT.walker).hp : hit.A.hpGuess) - dmg;
        if ((!g.opt || g.opt.dmg) && g.dn.length < 24) g.dn.push({ x: hx + rnd(-0.12, 0.12), y: hy + 0.1, z: hz + rnd(-0.12, 0.12), v: Math.round(dmg), head: hit.head, armor: (ZT[hit.A.k] || {}).armor && !hit.head, t: 0 });
        if (!killShown) { ZA.synth('hit', { pos: [hx, hy, hz], head: hit.head, vol: 0.9 }); killShown = true; }
        if ((hit.A.voiceT || 0) < g.t && Math.random() < 0.3) { hit.A.voiceT = g.t + 0.8; ZA.zvoice(hit.A.k, [hit.A.x, hit.A.y + 1.5, hit.A.z], 'hurt'); }
      }
      let tgt = [cam.pos[0] + d[0] * end, cam.pos[1] + d[1] * end, cam.pos[2] + d[2] * end];
      if (end >= W.rng && nHole < 4) {
        const t0 = g.view === 'fp' ? 0 : Math.max(0, (M.x - cam.pos[0]) * d[0] + (fy(M.x, M.z, M.lv) + 1.45 - cam.pos[1]) * d[1] + (M.z - cam.pos[2]) * d[2]);
        const h = holeAt([cam.pos[0] + d[0] * t0, cam.pos[1] + d[1] * t0, cam.pos[2] + d[2] * t0], d, Math.min(W.rng, 70) - t0, nHole++);
        if (h) tgt = h.p;
      }
      if (p < 3) tracer(mz, tgt);
      if (sh.length < 2) { const dd = [tgt[0] - mz[0], tgt[1] - mz[1], tgt[2] - mz[2]]; const L = Math.hypot(dd[0], dd[1], dd[2]) || 1; sh.push([Math.round(mz[0] * 10), Math.round(mz[1] * 10), Math.round(mz[2] * 10), Math.round(dd[0] / L * 100), Math.round(dd[1] / L * 100), Math.round(dd[2] / L * 100), Math.round(L * 10)]); }
    }
    flash(mz, camDir(g, 0, 0), { pistol: 0.75, smg: 0.85, shotgun: 1.35, sniper: 1.2 }[M.w] || 1, g.view === 'fp');
    fxPush({ x: mz[0], y: mz[1], z: mz[2], size: 0.35, alpha: 0.35, type: 11, life: 0.5, vy: 0.5 });
    const rt = [Math.cos(g.yaw), 0, -Math.sin(g.yaw)];
    fxPush({ x: mz[0] - rt[0] * 0.05, y: mz[1] - 0.05, z: mz[2] - rt[2] * 0.05, size: 0.03, alpha: 1, type: 27, life: 0.45, vx: -rt[0] * 2.4 + rnd(-0.4, 0.4), vy: rnd(1.4, 2.4), vz: -rt[2] * 2.4 + rnd(-0.4, 0.4), grav: 1 });
    lightPush(mz, 7, [3.4, 2.2, 1.0], 0.055);
    ZA.gun(M.w);
    const kick = { rifle: 0.0045, smg: 0.0035, shotgun: 0.016, sniper: 0.02, pistol: 0.006 }[M.w] || 0.005;
    g.recP += kick * (g.ads ? 0.65 : 1);
    g.yaw += (Math.random() - 0.5) * kick * 0.6;
    g.bloom = Math.min(W.spr * 2.5, g.bloom + W.spr * 0.35);
    const F = g.F;
    if (F) { F.rec = Math.min(1.4, F.rec + (W.auto ? 0.55 : 1)); F.recY = (Math.random() - 0.5) * 0.06; F.flash = 0.05; F.shotT = 0; }
    if (M.w === 'sniper' && M.mag[M.w] > 0) { M.bolt = 0.75; setTimeout(() => ZA.play('r_cock', { rate: 1.15 }), 220); }
    if (M.w === 'shotgun' && M.mag[M.w] > 0) { setTimeout(() => ZA.play('r_pump', { rate: 1.25, vol: 0.7 }), 260); }
    if (g.sim) { if (hits.length) g.sim.shoot(myId, M.w, hits); }
    else { g.pend.push(...hits); g.pendSh.push(...sh); }
    if (M.mag[M.w] <= 0) setTimeout(() => startReload(G.current), 180);
  };
  const startReload = (g) => {
    const M = g.me, W = WEAPONS[M.w];
    if (!W || M.st !== 0 || M.rel > 0 || M.swapT > 0 || (M.mag[M.w] != null && M.mag[M.w] >= W.mag)) return;
    M.rel = W.rel; M.relMax = W.rel;
    if (g.F) g.F.rel = 0;
    ZA.reload(M.w, W.rel);
    ZA.call('reload', sexRef.current, { cd: 9, chance: 0.55, at: 0.15 });
  };
  const swapRef = useRef(null);
  const swapGun = () => {
    const g = G.current, M = g.me;
    if (!M || M.st !== 0 || M.swapT > 0 || g.thr) return;
    ZA.synth('tap', { f: 500, vol: 0.4 });
    M.rel = 0;
    M.swapT = 0.5;
    M.swapTo = M.slot ? 0 : 1;
    if (g.F) { g.F.rel = -1; g.F.swap = 0.001; }
    syncHud(true);
  };
  swapRef.current = swapGun;

  const melee = () => {
    const g = G.current, M = g.me;
    if (!M || M.st !== 0 || M.mcd > 0 || g.thr) return;
    M.mcd = 0.62;
    M.rel = 0;
    if (g.F) { g.F.rel = -1; g.F.mel = 0; }
    ZA.synth('swing', { vol: 0.8 });
    setTimeout(() => {
      const gg = G.current;
      if (!gg.me) return;
      let hitAny = false;
      for (const A of gg.anim.values()) {
        const d = Math.hypot(A.x - gg.me.x, A.z - gg.me.z);
        if (d > 2.6 + (ZT[A.k] || ZT.walker).r) continue;
        if (Math.abs(angDiff(gg.yaw, Math.atan2(A.x - gg.me.x, A.z - gg.me.z))) > 0.8 && d > 0.9) continue;
        hitAny = true; A.hit = 1; A.stunV = 0.5;
        blood(A.x, A.y + 1.3, A.z, 5);
        if ((!gg.opt || gg.opt.dmg) && gg.dn.length < 24) gg.dn.push({ x: A.x, y: A.y + 1.6, z: A.z, v: 60, head: false, t: 0 });
      }
      if (hitAny) { ZA.synth('hit', { vol: 1 }); ZA.synth('thump', { vol: 0.6, f: 90 }); gg.hm = 0.15; }
      if (gg.sim) gg.sim.melee(myId, 'bat');
      else if (gg.net) gg.net.send({ t: 'ml', k: 'bat' });
    }, 170);
  };
  const throwStart = (k) => {
    const g = G.current, M = g.me;
    if (!M || M.st !== 0 || g.thr || M.swapT > 0) return;
    if (k === 'grenade' ? M.nades <= 0 : M.molos <= 0) return;
    M.rel = 0;
    g.thr = { k, t: 0 };
    if (g.F) { g.F.rel = -1; g.F.thrHold = 0.001; }
    ZA.play(k === 'grenade' ? 'pin' : 'r_cock', { vol: 0.6, rate: k === 'grenade' ? 1 : 1.6 });
  };
  const throwEnd = (cancel) => {
    const g = G.current, M = g.me, T = g.thr;
    if (!T) return;
    g.thr = null;
    if (g.F) { g.F.thrHold = 0; g.F.thr = cancel ? -1 : 0; }
    if (cancel || !M || M.st !== 0 || !g.aimLand) return;
    if (T.k === 'grenade') M.nades--; else M.molos--;
    g.lastThrowK = T.k;
    const L = g.aimLand;
    ZA.play('whoosh', { vol: 0.9 });
    ZA.call('nade', sexRef.current, { cd: 4 });
    if (g.sim) g.sim.throwAt(myId, T.k, L.x, L.z);
    else if (g.net) g.net.send({ t: 'th', k: T.k, x: Math.round(L.x * 10) / 10, z: Math.round(L.z * 10) / 10 });
    g.fx.push({ nade: true, k: T.k, x0: M.x, z0: M.z, lv0: M.lv | 0, x1: L.x, z1: L.z, lv1: L.lv | 0, t: 0, life: T.k === 'grenade' ? THROW.grenade.fuse : 0.9, arc: L.pts, mine: true });
    syncHud(true);
  };
  const doEmote = (e) => {
    const g = G.current;
    setSheet(null);
    if (!g.me || !EMOTE_LIST.some((q) => q[0] === e)) return;
    ZA.synth('tap', { f: 900, vol: 0.4 });
    g.emo = { k: e, t: 0 };
    if (g.net) g.net.send({ t: 'emo', e });
  };
  const hudAt = useRef(0);
  const hudPrev = useRef(null);
  const syncHud = (force) => {
    const g = G.current, M = g.me;
    if (!M) return;
    const now = performance.now();
    if (!force && now - hudAt.current < 120) return;
    hudAt.current = now;
    const W = WEAPONS[M.w];
    let near = null;
    const S = g.snaps[g.snaps.length - 1];
    if (S && M.st === 0) for (const p of S.ps.values()) if (p.id !== myId && p.st === 1 && Math.hypot(p.x - M.x, p.z - M.z) < 2.2) { near = p.id; break; }
    let alive = 0, total = 0;
    if (S) for (const p of S.ps.values()) { total++; if (p.st === 0) alive++; }
    const mine = S && S.ps.get(myId);
    const r = g.roster.get(myId);
    const next = { w: M.w, slots: M.slots, slot: M.slot, mag: W ? (M.mag[M.w] == null ? W.mag : M.mag[M.w]) : 0, magMax: W ? W.mag : 0, mag2: M.mag[M.slots[M.slot ? 0 : 1]], rel: M.rel > 0 ? 1 - M.rel / (M.relMax || 1) : 0, hp: M.hp, st: M.st, rev: M.rev, wave: g.wave || 0, ph: g.ph, tl: g.tl, zl: g.zl, kills: M.kills, pts: M.pts, nades: M.nades, molos: M.molos, near, alive, total, rtt: g.rtt || 0, ads: g.ads, aiming: !!g.thr, cr: !!(M.cr || M.sl > 0), sprint: M.sprint, pet: mine && mine.pst >= 0 ? (r && r.pk) || pet : null, bleed: M.st === 1 ? Math.max(0, 30 - Math.round(g.downT || 0)) : 0, view: g.view };
    const prev = hudPrev.current;
    if (!force && prev && Object.keys(next).every((k) => prev[k] === next[k])) return;
    hudPrev.current = next;
    setHud(next);
  };

  useEffect(() => { G.current.view = view; G.current.sens = sens; G.current.torch = torch; G.current.opt = opt; }, [view, sens, torch, opt]);

  useEffect(() => {
    if (phase !== 'play' && phase !== 'menu') return undefined;
    let raf = 0, last = performance.now();
    const g = G.current;
    const frame = () => {
      raf = requestAnimationFrame(frame);
      const now = performance.now();
      if (g.opt && g.opt.fps === 30 && now - last < 31) return;
      const gap = now - last;
      const dt = Math.min(0.05, gap / 1000);
      last = now;
      const V = g.V, cv = cvRef.current;
      if (!V || !cv) return;
      const A = g.ad || (g.ad = { k: 1, avg: 16.7, t: 0 });
      if (gap < 250) { A.avg += (gap - A.avg) * 0.06; A.t += gap; }
      if (A.t > 2000) {
        A.t = 0;
        const want = g.opt && g.opt.fps === 30 ? 37 : 19.5;
        if (A.avg > want && A.k > 0.62) A.k = Math.max(0.62, Math.round((A.k - 0.08) * 100) / 100);
        else if (A.avg < want * 0.78 && A.k < 1) A.k = Math.min(1, Math.round((A.k + 0.04) * 100) / 100);
      }
      const dpr = Math.min(window.devicePixelRatio || 1, 2) * V.tier.dpr * A.k;
      const W0 = Math.max(2, Math.round(GS.W * dpr)), H0 = Math.max(2, Math.round(GS.H * dpr));
      if (cv.width !== W0 || cv.height !== H0) { cv.width = W0; cv.height = H0; }
      if (phase === 'menu') { drawMenu(g, V, dt); return; }
      step(g, V, dt, now);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [phase, GS.W, GS.H, sv, col, gun, pet]);

  const drawMenu = (g, V, dt) => {
    g.menuT += dt;
    if (V.tick) V.tick(Date.now());
    const items = V.statics.slice();
    const parts = [];
    const key = `${sv}:${col}:${gun}:${pet}`;
    if (!g.menuRigs || g.menuRigs.key !== key) {
      const zs = [['walker', 2], ['runner', 5], ['worker', 9], ['walker', 13], ['crawler', 4], ['screamer', 7]].map(([k, id], i) => ({ k, id, x: -6 + i * 3.4, z: -2 - (i % 3) * 3, ph: i }));
      g.menuRigs = { key, zs, dog: pet !== 'none' ? { D: V.dog(pet), rig: null, M: new Float32Array(16) } : null };
      if (g.menuRigs.dog) g.menuRigs.dog.rig = makeRig(g.menuRigs.dog.D.joints, true);
    }
    const MR = g.menuRigs;
    const px = 1.2, pz = -25.5, pyaw = 2.9 + Math.PI * 0.08;
    const chM = charOf(sv, col);
    const smd = V.sm && V.sm.anims ? V.survModel(chM.k) : null;
    if (smd) {
      if (!MR.ss || MR.ssM !== smd) { MR.ss = ssNew(smd); MR.ssM = smd; }
      const S = MR.ss;
      ssPose(smd, V.sm.anims.clips, S, { v: 0, mdir: 0, sprint: false, w: gun, aim: 0, aiming: false, st: 0, kneel: false, emo: null, emoT: 0, thr: -1, mel: -1, hit: 0, rel: -1, shot: false, dead: -1 }, dt);
      ssMatrix(S, px, floorH(px, pz), pz, pyaw);
      items.push({ mesh: smd.mesh, model: S.M, skin: S.skin, tex: smd.tex, nrm: smd.nrm, col: g.survCol || (g.survCol = new Float32Array([0.95, 0.95, 0.95, 0])), cast: true });
      if (!S.hideGun) { const gd = GUNS[gun] || GUNS.rifle; const Gm = ssGun(S, smd, V.sm.anims.clips, gun, gd.grip.o, S.G); if (Gm) tpGunItems(items, V.R, gun, Gm, true); }
    }
    parts.push({ x: px, y: floorH(px, pz) + 0.03, z: pz, size: 0.45, alpha: 0.45, type: 21, dw: -1 });
    if (MR.dog && V.realDog) {
      const RD = V.realDog, S = MR.dog.rd || (MR.dog.rd = realDogState(RD));
      poseRealDog(RD, S, 0, dt, 0, 0, true);
      items.push({ mesh: RD.mesh, model: poseInto(MR.dog.M, px + 0.95, floorH(px, pz), pz - 0.25, pyaw - 0.45), skin: S.skin, tex: RD.tex[pet] || RD.tex.rex, nrm: RD.nrm, col: RDOG_COL, cast: true });
    } else if (MR.dog) {
      poseDog(MR.dog.rig, { t: g.menuT, sit: true, look: Math.sin(g.menuT * 0.3) * 0.4 });
      solve(MR.dog.rig);
      items.push({ mesh: MR.dog.D.mesh, model: poseInto(MR.dog.M, px + 0.95, floorH(px, pz), pz - 0.25, pyaw - 0.45), bones: MR.dog.rig.S, cast: true });
    }
    for (const Q of MR.zs) {
      Q.ph += dt * 1.9;
      const zx = Q.x + Math.sin(g.menuT * 0.1 + Q.id) * 1.2, zz = Q.z + ((g.menuT * 0.35 + Q.id) % 6);
      if (V.zm && !Q.mk) Q.mk = mzPick(V.zm, Q.k, Q.id);
      const qmd = Q.mk && V.zm[Q.mk];
      if (qmd) {
        const S = Q.S || (Q.S = mzNew(qmd, Q.k));
        const want = Q.k === 'crawler' ? 'crawl' : Q.k === 'runner' ? 'stride' : 'walk';
        if (S.cur !== want) mzPlay(S, want, Math.random() * 2, true);
        S.rate = want === 'stride' ? 0.55 : want === 'crawl' ? 0.9 : 1.15;
        S.s = ((MZ_TALL[Q.k] || (ZT[Q.k] || ZT.walker).h) / qmd.M.top) * S.sv;
        mzTick(S, dt);
        mzPose(qmd, V.zm.anims, S);
        mzMatrix(S, zx, floorH(zx, zz), zz, 0.1 + Math.sin(Q.id) * 0.2, S.s);
        items.push({ mesh: qmd.mesh, model: S.M, skin: S.skin, tex: qmd.tex, nrm: qmd.nrm, col: S.col, cast: false });
      }
    }
    const lights = [];
    drawScenery(g, V, items, parts, lights, [px, 0, pz], g.menuT, () => true);
    lights.sort((p, q) => p.d - q.d);
    const a = 2.95 + Math.sin(g.menuT * 0.08) * 0.12;
    const dist = GS.land ? 4.3 : 6.2;
    const cx = px + Math.sin(a) * dist, cz = pz + Math.cos(a) * dist;
    const fy0 = floorH(px, pz);
    V.R.render({ env: V.env, cam: { pos: [cx, fy0 + 1.42, cz], at: [px, fy0 + 0.98, pz], fov: 0.62, shadowAt: [px, 0, pz], far: 420 }, items, parts, lights: lights.slice(0, 4) });
  };

  const step = (g, V, dt, now) => {
    const M = g.me;
    if (!M) return;
    if (!Number.isFinite(g.yaw)) g.yaw = 0;
    else if (g.yaw > Math.PI || g.yaw < -Math.PI) g.yaw = Math.atan2(Math.sin(g.yaw), Math.cos(g.yaw));
    if (!Number.isFinite(g.pitch)) g.pitch = -0.04;
    if (!Number.isFinite(M.x) || !Number.isFinite(M.z)) { const q = g.safe || { x: 0, z: -24, lv: 0 }; M.x = q.x; M.z = q.z; M.lv = q.lv; M.vx = 0; M.vz = 0; M.ys = null; }
    else g.safe = { x: M.x, z: M.z, lv: M.lv | 0 };
    if (!Number.isFinite(M.vx)) M.vx = 0;
    if (!Number.isFinite(M.vz)) M.vz = 0;
    g.t += dt;
    const keys = g.keys;
    let mx = J.joy.current.x, my = J.joy.current.y;
    if (keys.has('KeyW') || keys.has('ArrowUp')) my -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) my += 1;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) mx -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) mx += 1;
    const ml = Math.hypot(mx, my);
    if (ml > 1) { mx /= ml; my /= ml; }
    const Wc = WEAPONS[M.w];
    const joyRun = J.joy.current.id != null && (g.opt && g.opt.spr ? J.joy.current.mag > 0.62 && my < -0.5 : J.joy.current.mag > 0.97 && my < -0.82);
    M.sprint = M.st === 0 && (joyRun || (keys.has('ShiftLeft') && my < -0.5)) && !g.fire && !g.fireL && !g.ads && !g.thr && M.rel <= 0 && M.mcd <= 0 && !(M.sl > 0);
    if (M.st !== 0) { M.cr = 0; M.sl = 0; M.jy = 0; M.jv = 0; M.air = false; }
    if (g.crReq) {
      g.crReq = false;
      if (M.st === 0 && !M.air) {
        if (M.sprint && M.speed > 4.2) {
          const L = Math.hypot(M.vx, M.vz) || 1;
          M.sl = 0.85; M.cr = 1; M.sdx = M.vx / L; M.sdz = M.vz / L; M.sprint = false;
          ZA.play('whoosh', { vol: 0.45, rate: 0.62 });
          ZA.synth('step', { surf: stepSurf(M.x, M.z, M.lv), vol: 0.9 });
          ZA.synth('step', { surf: stepSurf(M.x, M.z, M.lv), vol: 0.6, at: 0.12 });
        } else if (!(M.sl > 0)) M.cr = M.cr ? 0 : 1;
      }
    }
    if (g.jumpReq) {
      g.jumpReq = false;
      if (M.st === 0 && !M.air) {
        if (M.cr && !(M.sl > 0)) M.cr = 0;
        else { M.air = true; M.jv = 4.8; M.sl = 0; M.cr = 0; ZA.synth('step', { surf: stepSurf(M.x, M.z, M.lv), vol: 0.5 }); }
      }
    }
    if (M.sprint && M.cr && !(M.sl > 0)) M.cr = 0;
    if (M.sl > 0) { M.sl -= dt; if (M.sl <= 0) M.sl = 0; }
    if (M.air) {
      M.jy = (M.jy || 0) + M.jv * dt; M.jv -= 14 * dt;
      if (M.jy <= 0) { M.jy = 0; M.jv = 0; M.air = false; g.land = 0.14; ZA.synth('step', { surf: stepSurf(M.x, M.z, M.lv), vol: 1 }); }
    }
    g.land = Math.max(0, (g.land || 0) - dt * 0.9);
    M.crK = lerp(M.crK || 0, M.sl > 0 ? 1.15 : M.cr ? 1 : 0, Math.min(1, dt * 11));
    M.mv = 0;
    const ox = M.x, oz = M.z;
    if (M.st === 0) {
      const fx = Math.sin(g.yaw), fz = Math.cos(g.yaw), rx = -Math.cos(g.yaw), rz = Math.sin(g.yaw);
      const sp = (M.sprint ? 6.4 : 4.7) * (g.ads ? 0.55 : 1) * (g.thr ? 0.7 : 1) * (M.cr && !(M.sl > 0) ? 0.52 : 1) * ({ sniper: 0.92, shotgun: 0.97, smg: 1.04, pistol: 1.05 }[M.w] || 1);
      let tvx = (fx * -my + rx * mx) * sp, tvz = (fz * -my + rz * mx) * sp;
      if (M.sl > 0) { const ss0 = 3 + 5.6 * clamp(M.sl / 0.85, 0, 1); tvx = M.sdx * ss0 + tvx * 0.15; tvz = M.sdz * ss0 + tvz * 0.15; }
      M.vx = lerp(M.vx || 0, tvx, Math.min(1, dt * 12)); M.vz = lerp(M.vz || 0, tvz, Math.min(1, dt * 12));
      if (Math.hypot(M.vx, M.vz) > 0.05) {
        let nx = M.x + M.vx * dt, nz = M.z + M.vz * dt;
        for (const A of g.anim.values()) { if ((A.lv | 0) !== (M.lv | 0)) continue; const r = (ZT[A.k] || ZT.walker).r + 0.32; const dx = nx - A.x, dz = nz - A.z, d = Math.hypot(dx, dz); if (d < r && d > 1e-4) { nx = A.x + dx / d * r; nz = A.z + dz / d * r; } }
        const e0 = { x: nx, z: nz, lv: M.lv | 0 };
        levelStep(e0);
        const c = collide(nx, nz, 0.38, e0.lv);
        M.x = c[0]; M.z = c[1]; M.lv = e0.lv;
        levelStep(M);
      }
    } else { M.vx = 0; M.vz = 0; }
    const moved = Math.hypot(M.x - ox, M.z - oz);
    M.speed = lerp(M.speed || 0, moved / Math.max(dt, 1e-3), Math.min(1, dt * 10));
    M.mv = M.speed > 0.4 ? 1 : 0;
    const F = g.F;
    M.fcd = Math.max(0, M.fcd - dt);
    M.mcd = Math.max(0, M.mcd - dt);
    M.fireT = Math.max(0, (M.fireT || 0) - dt);
    if (M.bolt > 0) { M.bolt -= dt; if (F) F.bolt = M.bolt > 0 ? 1 - M.bolt / 0.75 : -1; }
    if (M.swapT > 0) {
      const was = M.swapT;
      M.swapT -= dt;
      if (was > 0.25 && M.swapT <= 0.25) { M.slot = M.swapTo; M.w = M.slots[M.slot]; const nf = V.fp(M.w); nf.rel = -1; nf.thr = -1; nf.thrHold = 0; nf.mel = -1; nf.bolt = -1; nf.swap = F ? F.swap : 0.5; g.F = nf; ZA.play('r_cock', { vol: 0.5, rate: 1.3 }); }
      if (g.F) g.F.swap = M.swapT > 0 ? 1 - M.swapT / 0.5 : 0;
    }
    if (M.rel > 0) { M.rel -= dt; if (F) F.rel = clamp(1 - M.rel / (M.relMax || 1), 0, 1); if (M.rel <= 0) { M.rel = 0; M.mag[M.w] = WEAPONS[M.w] ? WEAPONS[M.w].mag : 0; if (F) F.rel = -1; } }
    if (F) {
      if (F.mel >= 0) { F.mel += dt / 0.55; if (F.mel >= 1) F.mel = -1; }
      if (F.thr >= 0) { F.thr += dt / 0.45; if (F.thr >= 1) F.thr = -1; }
      if (g.thr) F.thrHold += dt;
    }
    const wantFire = (g.fire || g.fireL) && M.st === 0;
    if (wantFire) { const W = WEAPONS[M.w]; if (W && (W.auto || !g.fireLatch)) { fireGun(g); g.fireLatch = true; } }
    else g.fireLatch = false;
    if (Wc) g.bloom = Math.max(0, g.bloom - dt * Wc.spr * 4);
    g.recP *= Math.exp(-dt * 7);
    g.downT = M.st === 1 ? (g.downT || 0) + dt : 0;
    if (g.emo) { g.emo.t += dt; if (g.emo.t > emoDur(g.emo.k) || M.st !== 0 || (g.emo.t > 0.25 && (M.mv || g.fire || g.ads))) g.emo = null; }
    for (const [id, e] of g.pemo) { e.t += dt; if (e.t > (e.k ? emoDur(e.k) + 0.2 : 3)) g.pemo.delete(id); }
    const rv = g.revHold && hudRef.current && hudRef.current.near ? hudRef.current.near : null;
    const fl = (M.mv ? 1 : 0) | (M.fireT > 0 || g.ads ? 8 : 0) | (M.rel > 0 ? 16 : 0) | (M.sprint ? 32 : 0) | (M.cr ? 128 : 0) | (M.air ? 256 : 0) | (M.sl > 0 ? 512 : 0);
    if (g.sim) {
      g.sim.setPlayer(myId, { x: M.x, z: M.z, lv: M.lv | 0, yaw: g.yaw, aim: g.pitch, w: M.w, fl, rv });
      g.simAcc += dt;
      let n = 0;
      while (g.simAcc >= 1 / 15 && n < 4) { g.sim.step(1 / 15); g.simAcc -= 1 / 15; n++; const s = g.sim.snap(); s.ev = g.sim.takeEvents(); applySnap(s, now); }
    } else if (g.net) {
      if (g.room && Date.now() - (g.liveAt || 0) > 5000) { g.liveAt = Date.now(); saveLive(g.room); }
      g.sendT -= dt;
      if (g.sendT <= 0) {
        g.sendT = 0.1;
        g.net.send({ t: 'p', x: Math.round(M.x * 100) / 100, z: Math.round(M.z * 100) / 100, lv: M.lv | 0, yaw: Math.round(g.yaw * 100) / 100, aim: Math.round(g.pitch * 100) / 100, w: M.w, fl, rv, h: g.pend.length ? g.pend.splice(0, 24) : undefined, sh: g.pendSh.length ? g.pendSh.splice(0, 3) : undefined });
        g.pendSh.length = 0;
      }
    }
    ZA.listen(M.x, fy(M.x, M.z, M.lv) + 1.6, M.z, g.yaw);
    if (M.st === 0 && M.speed > 1 && !M.air && !(M.sl > 0)) {
      g.stepPh += moved / (clamp(0.55 + 0.23 * M.speed, 0.9, 2.1) * (M.cr ? 0.85 : 1));
      if (g.stepPh >= 1) { g.stepPh -= 1; const surf = stepSurf(M.x, M.z, M.lv, M.y); ZA.synth('step', { surf, vol: (M.sprint ? 0.8 : 0.6) * (surf === 'water' ? 1.15 : 1) * (M.cr ? 0.45 : 1) }); }
    }
    g.voiceT -= dt;
    if (g.voiceT <= 0) {
      g.voiceT = 0.35;
      let pickA = null, pd = 1e9;
      for (const A of g.anim.values()) { const d = Math.hypot(A.x - M.x, A.z - M.z); if (d < 26 && (A.nextV || 0) < g.t && d < pd) { pd = d; pickA = A; } }
      if (pickA) {
        const talk = pd < 16 && pickA.k !== 'screamer' && (g.talkT || 0) < g.t && Math.random() < 0.4;
        if (talk) g.talkT = g.t + rnd(4.5, 9);
        pickA.nextV = g.t + (talk ? rnd(9, 15) : pickA.k === 'runner' ? rnd(2, 4) : rnd(4, 9));
        ZA.zvoice(pickA.k, [pickA.x, pickA.y + 1.6, pickA.z], talk ? 'talk' : 'idle');
      }
    }
    render(g, V, dt, now);
    syncHud(false);
  };

  const render = (g, V, dt, now) => {
    const M = g.me;
    const S = g.snaps;
    if (!S.length) return;
    const delay = g.sim ? 1 / 15 * 1000 : 115;
    const rt = now - delay;
    let a = S[0], b = S[S.length - 1];
    for (let i = 0; i < S.length - 1; i++) if (S[i].at <= rt && S[i + 1].at >= rt) { a = S[i]; b = S[i + 1]; break; }
    const span = Math.max(1, b.at - a.at);
    const f = a === b ? 1 : clamp((rt - a.at) / span, 0, 1);
    const T = V.tier;
    const tr = V.tick ? V.tick(Date.now()) : null;
    if (tr && tr.on && g.me) {
      const dx = tr.x - g.me.x, app = dx * tr.dir < 0;
      const ts = g.trs || (g.trs = { cyc: -1, pass: false, horn: false });
      if (ts.cyc !== tr.cyc) { ts.cyc = tr.cyc; ts.pass = false; ts.horn = false; }
      if (!ts.pass && app && Math.abs(dx) < 290) { ts.pass = true; ZA.mover('tr_pass', tr.lpos, { ref: 26, roll: 0.55, muff: 140, rev: 0.3, max: 520 }); }
      const sd = (tr.x - RAIL.sx) * tr.dir;
      if (!ts.horn && sd > -230 && sd < -150) { ts.horn = true; ZA.mover('tr_horn', tr.lpos, { ref: 40, roll: 0.45, muff: 220, rev: 0.4, max: 900 }); }
      if (Math.abs(tr.front[0] - g.me.x) < 140) lightPush([tr.front[0] + tr.dir * 0.6, tr.front[1], tr.front[2]], 18, [3.2, 2.8, 2.2], 0.04);
    }
    const items = V.statics.slice();
    const parts = [];
    const vm = [];
    const out = M.st === 2;
    const emoteCam = !!g.emo;
    const fp = g.view === 'fp' && !out && !emoteCam;
    let pos, yaw = g.yaw, pitch = g.pitch + g.recP, fov = BASE_FOV;
    const gyT = fy(M.x, M.z, M.lv);
    M.ys = M.ys == null || Math.abs(M.ys - gyT) > 1.5 ? gyT : lerp(M.ys, gyT, Math.min(1, dt * 16));
    const gy = M.ys;
    if (out) {
      let tgt = null, td = 1e9;
      for (const p of b.ps.values()) if (p.id !== myId && p.st === 0) { const d = Math.hypot(p.x - M.x, p.z - M.z); if (d < td) { td = d; tgt = p; } }
      const c = tgt || M;
      g.specA = (g.specA || 0) + dt * 0.25;
      pos = [c.x - Math.sin(g.specA) * 5, fy(c.x, c.z, c.lv) + 3.2, c.z - Math.cos(g.specA) * 5];
      yaw = g.specA; pitch = -0.32;
    } else if (fp) {
      const bob = M.st === 0 ? Math.abs(Math.sin(g.stepPh * Math.PI)) * 0.025 * clamp(M.speed / 5, 0, 1) * (g.ads ? 0.3 : 1) : 0;
      const ck = M.crK || 0;
      pos = [M.x, gy + (M.st === 1 ? 0.5 : 1.62 - 0.55 * Math.min(1, ck) - Math.max(0, ck - 1) * 0.8 + (M.jy || 0) - (g.land || 0) * 0.5) - bob, M.z];
      if (M.sl > 0) fov = BASE_FOV + 0.06 * clamp(M.sl / 0.4, 0, 1);
      if (g.ads && WEAPONS[M.w]) fov = lerp(BASE_FOV, ADS_FOV[M.w] || 0.7, g.F ? g.F.ads : 1);
      if (M.sprint) fov = BASE_FOV + 0.04;
    } else {
      const fx = Math.sin(g.yaw), fz = Math.cos(g.yaw), rx = -Math.cos(g.yaw), rz = Math.sin(g.yaw);
      const back = emoteCam ? 3.4 : M.st === 1 ? 3.6 : 3.1, side = emoteCam ? 0 : 0.72;
      const ea = emoteCam ? g.emo.t * 0.5 + 2.6 : 0;
      const bx = emoteCam ? Math.sin(g.yaw + ea) : fx, bz = emoteCam ? Math.cos(g.yaw + ea) : fz;
      const cp = Math.cos(g.pitch);
      let cx = M.x - bx * back * (emoteCam ? 1 : cp) + rx * side, cz = M.z - bz * back * (emoteCam ? 1 : cp) + rz * side;
      if (inHouse(M.x, M.z, 4)) {
        const bdx = cx - M.x, bdz = cz - M.z, bl = Math.hypot(bdx, bdz), n = Math.ceil(bl / 0.08);
        let keep = bl;
        for (let i = 1; i <= n; i++) { const t = i / n, qx = M.x + bdx * t, qz = M.z + bdz * t; if (houseBlocked(qx, qz, M.lv | 0, false) || (M.lv && houseY(qx, qz, 1) == null)) { keep = Math.max(0.25, bl * t - 0.3); break; } }
        if (keep < bl) { cx = M.x + bdx / bl * keep; cz = M.z + bdz / bl * keep; }
      }
      const cc = collide(cx, cz, 0.3, M.lv); cx = cc[0]; cz = cc[1];
      let cy = Math.max(gy + 1.95 + (M.jy || 0) * 0.7 - Math.min(1, M.crK || 0) * 0.45 - (emoteCam ? 0.2 : Math.sin(g.pitch) * back * 0.9), fy(cx, cz, M.lv) + 0.5);
      if (inHouse(cx, cz) && houseY(cx, cz, 1) != null) cy = Math.min(cy, M.lv ? HOUSE.f1 + 2.05 : HOUSE.f1 - 0.3);
      pos = [cx, cy, cz];
      if (emoteCam) { yaw = Math.atan2(M.x - cx, M.z - cz); pitch = Math.atan2(gy + 1.1 - cy, Math.hypot(M.x - cx, M.z - cz)); }
      if (g.ads && WEAPONS[M.w]) fov = lerp(BASE_FOV, ADS_FOV[M.w] || 0.7, 0.6);
    }
    if (g.shake > 0) { g.shake = Math.max(0, g.shake - dt * 2.5); const k = g.shake * 0.02; pitch += Math.sin(g.t * 47) * k; yaw += Math.sin(g.t * 39) * k; }
    const fwd = [Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)];
    g.cam = { pos, fwd, yaw, pitch, fov };
    const cfov = Math.cos(Math.min(1.45, fov * 1.25));
    const inView = (x, y, z, r) => { const dx = x - pos[0], dy = y - pos[1], dz = z - pos[2]; const d = Math.hypot(dx, dy, dz); if (d < r + 2) return true; return (dx * fwd[0] + dy * fwd[1] + dz * fwd[2]) / d > cfov - r / d; };

    const live = new Set();
    const zList = [];
    for (const z of b.zs.values()) zList.push(z);
    for (const z of zList) z.d = Math.hypot(z.x - M.x, z.z - M.z);
    zList.sort((p, q) => p.d - q.d);
    let drawnZ = 0, shadowN = 0;
    for (const z1 of zList) {
      const z0 = a.zs.get(z1.id) || z1;
      const x = lerp(z0.x, z1.x, f), z = lerp(z0.z, z1.z, f), zyaw = angLerp(z0.yaw, z1.yaw, f);
      let A = g.anim.get(z1.id);
      if (!A) { A = { id: z1.id, k: z1.k, x, z, yaw: zyaw, lv: z1.lv, y: fy(x, z, z1.lv), ph: Math.random() * 6, mv: 0, att: -1, hit: 0, hitSide: 1, head: false, scr: 0, spit: 0, M: new Float32Array(16), off: Math.random() * 10 }; g.anim.set(z1.id, A); }
      const mvd = Math.hypot(x - A.x, z - A.z);
      A.mv = lerp(A.mv, mvd / Math.max(dt, 1e-3), Math.min(1, dt * 6));
      const stride = A.k === 'runner' ? 2.1 : A.k === 'brute' ? 1.5 : A.k === 'crawler' ? 0.7 : 1.05;
      A.ph += (mvd / stride) * Math.PI * 2;
      const zyT = fy(x, z, z1.lv);
      A.y = Math.abs(A.y - zyT) > 1.2 ? zyT : lerp(A.y, zyT, Math.min(1, dt * 14));
      A.x = x; A.z = z; A.yaw = zyaw; A.lv = z1.lv; A.fl = z1.fl; A.hpp = z1.hp; A.boss = z1.fl & 64 ? 1 : 0;
      if (A.boss) {
        g.bossA = A;
        const mv0 = Math.hypot(x - (A.bx == null ? x : A.bx), z - (A.bz == null ? z : A.bz));
        A.bx = x; A.bz = z;
        A.stepD = (A.stepD || 0) + mv0;
        if (A.stepD > 1.9) { A.stepD = 0; ZA.play('thud', { pos: [x, A.y, z], rate: 0.62, vol: 1.1, ref: 6, roll: 0.7, max: 60, vary: 0.05 }); if (z1.d < 14) g.shake = Math.max(g.shake || 0, (1 - z1.d / 14) * 0.16); }
      }
      if (A.att >= 0) { A.att += dt / (A.k === 'brute' ? 1.0 : 0.62); if (A.att > 1) A.att = -1; }
      A.hit = Math.max(0, A.hit - dt * 5);
      if ((z1.fl & 4) && !(A.scr > 0)) A.scr = 0.001;
      if (A.scr > 0) { A.scr += dt / 1.5; if (A.scr > 1) A.scr = 0; }
      A.stunV = Math.max(0, (A.stunV || 0) - dt);
      live.add(z1.id);
      A.hd = null;
      if (!A.boss && (drawnZ >= T.zmax || z1.d > 95)) continue;
      const r0 = A.boss ? 3.8 : A.k === 'brute' ? 2.2 : 1.3;
      if (!inView(x, A.y + 1, z, r0)) continue;
      drawnZ++;
      const cast = T.shadowN > 0 && shadowN < T.shadowN && z1.d < 26;
      if (cast) shadowN++;
      if (V.zm && !A.mk) A.mk = mzPick(V.zm, A.k, A.id);
      const md = A.mk && V.zm[A.mk];
      if (md) {
        const S = A.ma || (A.ma = mzNew(md, A.k));
        const C = V.zm.anims.clips, K = A.k;
        S.s = ((MZ_TALL[K] || (ZT[K] || ZT.walker).h) / md.M.top) * S.sv * (A.boss ? BOSS_K : 1);
        if ((A.attN || 0) !== S.attN) {
          S.attN = A.attN || 0;
          if (K === 'crawler' || A.biteDown) { if (S.cur !== 'bite') mzPlay(S, 'bite', MZ_HIT.bite, true, 0.3); S.rate = 1; S.act = 'bite'; S.actUntil = g.t + 1.6; S.actMin = g.t + 0.8; }
          else if (K === 'brute') { const n = S.attN % 2 ? 'm_swipe' : 'm_punch'; mzPlay(S, n, MZ_HIT[n], true, 0.16); S.rate = 1.2; S.act = n; S.actUntil = g.t + (n === 'm_swipe' ? 1.25 : 0.85); S.actMin = g.t + 0.45; }
          else { mzPlay(S, 'attack', MZ_HIT.attack, true, 0.16); S.rate = 1.25; S.act = 'attack'; S.actUntil = g.t + 1.0; S.actMin = g.t + 0.45; }
        }
        if (A.scr > 0 && !S.scrOn) { S.scrOn = true; mzUpper(S, 'scream', 0.2, 1.15, C.scream.dur - 0.3); }
        if (!(A.scr > 0)) S.scrOn = false;
        if ((A.spitN || 0) !== (S.spitN || 0)) { S.spitN = A.spitN || 0; mzUpper(S, 'scream', 0.55, 1.7, 1.7); }
        if (K === 'brute' && !S.roared) { S.roared = true; mzUpper(S, 'm_roar', 0.3, 1.1, 3.2); }
        if (A.hit >= 0.99 && S.ht > 0.15) S.ht = 0;
        if (S.act && (g.t > S.actUntil || (A.mv > 0.6 && g.t > S.actMin))) S.act = null;
        if (!S.act) mzLoco(S, md, C, K, A.mv, (z1.fl & 8) || A.stunV > 0);
        mzTick(S, dt);
        mzPose(md, V.zm.anims, S);
        mzMatrix(S, x, A.y, z, zyaw, S.s);
        A.hd = mzHead(S, A.hdv || (A.hdv = [0, 0, 0]));
        A.hr = 0.15 * (MZ_TALL[K] || (ZT[K] || ZT.walker).h) / 1.75 * (A.boss ? BOSS_K : 1);
        A.top = A.hd[1] - A.y + A.hr;
        items.push({ mesh: md.mesh, model: S.M, skin: S.skin, tex: md.tex, nrm: md.nrm, col: S.col, cast });
      }
      parts.push({ x, y: A.y + 0.03, z, size: A.boss ? 1.45 : A.k === 'brute' ? 0.85 : A.k === 'bloater' ? 0.65 : 0.5, alpha: A.boss ? 0.5 : 0.4, type: 21, dw: -1 });
      if (z1.fl & 2) parts.push({ x, y: A.y + 0.8, z, size: 0.8, alpha: 0.55, type: 12, seed: Math.random() });
      if (A.k === 'spitter' && z1.d < 30) parts.push({ x: x + Math.sin(zyaw) * 0.08, y: A.y + 1.5, z: z + Math.cos(zyaw) * 0.08, size: 0.22, alpha: 0.5, type: 25, seed: 0.3 });
      if (A.k === 'bloater' && z1.d < 30) parts.push({ x, y: A.y + 1.1, z, size: 1.1, alpha: 0.18, type: 26, seed: 0.5 });
    }
    for (const id of g.anim.keys()) if (!live.has(id)) g.anim.delete(id);

    for (let i = g.dying.length - 1; i >= 0; i--) {
      const d = g.dying[i];
      d.t += dt;
      if (d.t > 10.5) { g.dying.splice(i, 1); continue; }
      const dm = d.ma && V.zm && V.zm[d.mk];
      if (dm) {
        const S = d.ma, C = V.zm.anims.clips;
        if (!d.mzd) {
          d.mzd = true; S.ua = null; S.ht = 9; S.act = null;
          const cn = d.k === 'brute' ? 'm_die' : d.k === 'crawler' ? 'dying' : d.mode === 0 ? 'dying' : 'death';
          const c = C[cn], t0 = d.k === 'crawler' ? c.dur - 0.02 : cn === 'm_die' ? 0.2 : cn === 'dying' ? 0.3 : 0.25;
          const rate = d.k === 'crawler' ? 0 : cn === 'm_die' ? 1.2 : cn === 'dying' ? 1.3 : 1.4;
          mzPlay(S, cn, t0, true, d.k === 'crawler' ? 0.35 : MZ_FADE); S.rate = rate;
          const k = (dm.M.hipsH / c.srcH) * S.s, L = (c.nf - 1) * 3, lx = c.hp[L] * k, lz = c.hp[L + 2] * k, cy = Math.cos(d.yaw), sy = Math.sin(d.yaw);
          d.px = d.x + cy * lx + sy * lz; d.pz = d.z - sy * lx + cy * lz;
          d.imp = rate > 0 ? Math.max(0.3, (mzImpact(c) - t0) / rate) : 0.35;
          d.pool = d.k === 'brute' ? 1.7 : 1;
        }
        mzTick(S, dt);
        const sink = d.t > 8.5 ? (d.t - 8.5) * 0.3 : 0;
        if (d.t > d.imp && !d.thud) { d.thud = true; for (let k = 0; k < 8; k++) fxPush({ x: d.px + rnd(-0.6, 0.6), y: d.y + 0.15, z: d.pz + rnd(-0.6, 0.6), size: rnd(0.5, 0.9), alpha: 0.5, type: 24, life: rnd(0.6, 1.1), vy: 0.35, seed: Math.random() }); ZA.synth('thump', { pos: [d.px, d.y, d.pz], vol: 0.6, f: 60 }); }
        if (d.t > d.imp + 0.1) { const k = clamp((d.t - d.imp - 0.1) / 1.6, 0, 1); parts.push({ x: d.px, y: d.y + 0.02, z: d.pz, size: (0.25 + 0.8 * k) * d.pool, alpha: 0.9 * (1 - clamp((d.t - 8.5) / 1.5, 0, 1)), type: 22, dw: -1, seed: (d.id % 97) / 97 }); }
        if (!inView(d.x, d.y + 0.5, d.z, 2)) continue;
        mzPose(dm, V.zm.anims, S);
        mzMatrix(S, d.x, d.y - sink, d.z, d.yaw, S.s);
        items.push({ mesh: dm.mesh, model: S.M, skin: S.skin, tex: dm.tex, nrm: dm.nrm, col: S.col, cast: false });
        continue;
      }
      g.dying.splice(i, 1);
    }

    const tagList = [];
    const meNow = { id: myId, x: M.x, z: M.z, yaw: g.yaw, aim: g.pitch, w: M.w, hp: M.hp, st: M.st, fl: (M.mv ? 1 : 0) | (M.fireT > 0 || g.ads ? 8 : 0) | (M.rel > 0 ? 16 : 0) | (M.sprint ? 32 : 0) | (M.cr ? 128 : 0) | (M.air ? 256 : 0) | (M.sl > 0 ? 512 : 0) };
    const SC = g.survCol || (g.survCol = new Float32Array([0.95, 0.95, 0.95, 0]));
    const drawPlayer = (p1, x, z, pyaw, isMe) => {
      let A = g.panim.get(p1.id);
      const r = isMe ? { sv, col } : g.roster.get(p1.id) || { sv: 'jay', col: 0 };
      const dist = Math.hypot(x - M.x, z - M.z);
      const chP = charOf(r.sv || 'jay', r.col | 0);
      const smd = V.sm && V.sm.anims ? V.survModel(chP.k) : null;
      if (!A) { A = { x, z, ph: 0, mv: 0, rig: null, M: new Float32Array(16), hit: 0, thr: -1, mel: -1, fireT: 0, lastFire: 0, relT: -1, deadT: null }; g.panim.set(p1.id, A); }
      const mvd = Math.hypot(x - A.x, z - A.z);
      A.mv = lerp(A.mv, mvd / Math.max(dt, 1e-3), Math.min(1, dt * 8));
      const mdir = mvd > 1e-3 ? angDiff(pyaw, Math.atan2(x - A.x, z - A.z)) : A.mdir || 0;
      A.mdir = mdir;
      A.ph += (mvd / (A.mv > 3 ? 1.9 : 1.35)) * Math.PI * 2;
      A.x = x; A.z = z; A.seen = g.t;
      A.hit = Math.max(0, A.hit - dt * 4);
      if (A.thr >= 0) { A.thr += dt / 0.6; if (A.thr > 1) A.thr = -1; }
      if (A.mel >= 0) { A.mel += dt / 0.5; if (A.mel > 1) A.mel = -1; }
      A.fireT = Math.max(0, A.fireT - dt);
      A.deadT = p1.st === 2 ? (A.deadT == null ? 0 : A.deadT + dt) : null;
      if (!inView(x, 1, z, 1.5)) return;
      if (!isMe && Math.hypot(x - pos[0], z - pos[2]) < 0.8) return;
      if (!smd) return;
      if (!isMe && A.mv > 0.8) { const pe = g.pemo.get(p1.id); if (pe && pe.k && pe.t > 0.4) g.pemo.delete(p1.id); }
      const emo = isMe ? g.emo : g.pemo.get(p1.id);
      const wk = WEAPONS[p1.w] ? p1.w : 'rifle';
      const plv = isMe ? M.lv | 0 : p1.lv | 0;
      const yyT = isMe ? gy : fy(x, z, plv);
      A.yy = A.yy == null || Math.abs(A.yy - yyT) > 1.2 ? yyT : lerp(A.yy, yyT, Math.min(1, dt * 14));
      if (!isMe) { const air = !!(p1.fl & 256); if (air && A.jT == null) A.jT = 0; else if (!air) A.jT = null; if (A.jT != null) A.jT += dt; }
      const yy = A.yy + (isMe ? M.jy || 0 : A.jT != null ? Math.max(0, 4.8 * A.jT - 7 * A.jT * A.jT) : 0);
      {
        if (!A.ss || A.ssM !== smd) { A.ss = ssNew(smd); A.ssM = smd; }
        const S = A.ss;
        const ft = isMe ? M.fireT || 0 : A.fireT;
        const shot = ft > (A.lastFire || 0) + 0.02;
        A.lastFire = ft;
        const relOn = isMe ? M.rel > 0 : !!(p1.fl & 16);
        A.relT = relOn ? (A.relT < 0 ? 0 : A.relT + dt) : -1;
        const rel = isMe ? (M.rel > 0 ? clamp(1 - M.rel / (M.relMax || 1), 0, 1) : -1) : A.relT >= 0 ? clamp(A.relT / ((WEAPONS[wk] && WEAPONS[wk].rel) || 2), 0, 1) : -1;
        ssPose(smd, V.sm.anims.clips, S, { v: A.mv, mdir, sprint: isMe ? !!M.sprint : !!(p1.fl & 32), w: p1.st === 0 ? wk : null, aim: p1.aim || 0, aiming: !!(p1.fl & 8) || ft > 0, st: p1.st, kneel: (!!(p1.fl & 4) || (!V.sm.anims.clips.c_idle && !!(p1.fl & 640))) && p1.st === 0, crouch: !!(p1.fl & 128) && !(p1.fl & 512), slide: !!(p1.fl & 512), air: !!(p1.fl & 256), emo: emo && emo.k ? emo.k : null, emoT: emo ? emo.t : 0, thr: A.thr, mel: A.mel, hit: A.hit, rel, shot, dead: A.deadT == null ? -1 : A.deadT }, dt);
        ssMatrix(S, x, yy, z, pyaw);
        items.push({ mesh: smd.mesh, model: S.M, skin: S.skin, tex: smd.tex, nrm: smd.nrm, col: SC, cast: T.shadow > 0 && dist < 30 });
        if (!S.hideGun && p1.st === 0) {
          const gd = GUNS[wk] || GUNS.rifle;
          const Gm = ssGun(S, smd, V.sm.anims.clips, wk, gd.grip.o, S.G);
          if (Gm) {
            const mzN = dist < 70 ? tpGunItems(items, V.R, wk, Gm, T.shadow > 0 && dist < 12) : null;
            const mz = mzN || gd.muzzle || [0, 0.08, 0.7];
            const w0 = m4.apply(Gm, mz[0], mz[1], mz[2]);
            A.muzzle = [w0[0], w0[1], w0[2]];
            if (isMe) g.myMuzzle = A.muzzle;
          }
        }
      }
      if (p1.st !== 2) parts.push({ x, y: yy + 0.03, z, size: 0.45, alpha: 0.42, type: 21, dw: -1 });
      if (!isMe && dist < 45 && p1.st !== 2) tagList.push({ x, y: yy + 2.05, z, n: r.st === 1 ? `${r.n || 'Friend'}, reconnecting` : r.st === 2 ? `${r.n || 'Friend'}, left` : r.n || 'Friend', bot: !!r.bot || r.st === 2, st: p1.st });
    };
    const shown = [];
    for (const p1 of b.ps.values()) { if (p1.id === myId) continue; shown.push({ p1, d: Math.hypot(p1.x - M.x, p1.z - M.z) }); }
    shown.sort((p, q) => p.d - q.d);
    let pDrawn = 0;
    for (const { p1 } of shown) {
      if (pDrawn >= T.pmax) break;
      if (p1.st === 2) { const Ad = g.panim.get(p1.id); if (!Ad || !Ad.ss || (Ad.deadT != null && Ad.deadT > 14)) continue; }
      const p0 = a.ps.get(p1.id) || p1;
      pDrawn++;
      drawPlayer(p1, lerp(p0.x, p1.x, f), lerp(p0.z, p1.z, f), angLerp(p0.yaw, p1.yaw, f), false);
    }
    if (!fp && M.st !== 2) drawPlayer(meNow, M.x, M.z, emoteCam ? g.yaw : g.yaw, true);
    for (const [k, A] of g.panim) if (g.t - (A.seen || 0) > 5) g.panim.delete(k);

    const petSeen = new Set();
    for (const p1 of b.ps.values()) {
      if (p1.pst == null || p1.pst < 0) continue;
      const p0 = a.ps.get(p1.id) || p1;
      const x = lerp(p0.px, p1.px, f), z = lerp(p0.pz, p1.pz, f), pyaw = angLerp(p0.pyaw, p1.pyaw, f);
      const r = p1.id === myId ? { pk: pet } : g.roster.get(p1.id) || {};
      const key = r.pk || 'rex';
      let D = g.pets.get(p1.id);
      if (!D || D.key !== key) { const DM = V.dog(key); D = { key, DM, rig: makeRig(DM.joints, true), x, z, ph: 0, mv: 0, bite: 0, leap: 0, M: new Float32Array(16) }; g.pets.set(p1.id, D); }
      const mvd = Math.hypot(x - D.x, z - D.z);
      D.mv = lerp(D.mv, mvd / Math.max(dt, 1e-3), Math.min(1, dt * 8));
      D.ph += (mvd / (D.mv > 3.5 ? 1.6 : 0.9)) * Math.PI * 2;
      D.x = x; D.z = z;
      D.bite = Math.max(0, D.bite - dt * 3); D.leap = Math.max(0, D.leap - dt * 2.6);
      petSeen.add(p1.id);
      if (D.mv > 0.8 && M && Math.abs(x - M.x) + Math.abs(z - M.z) < 18) { D.stepPh = (D.stepPh || 0) + mvd / (D.mv > 3.5 ? 0.85 : 0.55); if (D.stepPh >= 1) { D.stepPh -= 1; ZA.synth('paw', { pos: [x, (D.y || 0) + 0.1, z], vol: D.mv > 3.5 ? 0.6 : 0.4, ref: 2.5, roll: 1.2, max: 20 }); } }
      if (p1.pst === 2 && D.bite <= 0) D.bite = 0.999;
      if (!inView(x, 0.5, z, 1)) continue;
      const dyT = fy(x, z, p1.plv);
      D.y = D.y == null || Math.abs(D.y - dyT) > 1.2 ? dyT : lerp(D.y, dyT, Math.min(1, dt * 14));
      const RD = V.realDog;
      if (RD) {
        const S = D.rd || (D.rd = realDogState(RD));
        const lunge = poseRealDog(RD, S, D.mv, dt, D.bite, D.leap > 0 ? 1 - D.leap : 0, p1.pst === 3 && D.mv < 0.4);
        const M0 = poseInto(D.M, x + Math.sin(pyaw) * lunge.f, D.y + lunge.y, z + Math.cos(pyaw) * lunge.f, pyaw);
        items.push({ mesh: RD.mesh, model: M0, skin: S.skin, tex: RD.tex[key] || RD.tex.rex, nrm: RD.nrm, col: RDOG_COL, cast: T.shadow > 0 });
      } else {
        poseDog(D.rig, { t: g.t, ph: D.ph, mv: D.mv, sit: p1.pst === 3 && D.mv < 0.4, bite: D.bite, leap: D.leap > 0 ? 1 - D.leap : 0, happy: p1.pst === 0 });
        solve(D.rig);
        items.push({ mesh: D.DM.mesh, model: poseInto(D.M, x, D.y, z, pyaw), bones: D.rig.S, cast: T.shadow > 0 });
      }
      parts.push({ x, y: D.y + 0.03, z, size: 0.4, alpha: 0.38, type: 21, dw: -1 });
    }
    for (const k of g.pets.keys()) if (!petSeen.has(k)) g.pets.delete(k);

    const lights = [];
    for (let i = g.lights.length - 1; i >= 0; i--) { const L = g.lights[i]; L.life -= dt; if (L.life <= 0) { g.lights.splice(i, 1); continue; } const k = L.life / L.max; lights.push({ p: L.p, r: L.r, c: [L.c[0] * k, L.c[1] * k, L.c[2] * k], d: Math.hypot(L.p[0] - M.x, L.p[2] - M.z) }); }
    for (let i = g.fires.length - 1; i >= 0; i--) {
      const Fr = g.fires[i];
      Fr.life -= dt;
      if (Fr.life <= 0) { g.fires.splice(i, 1); continue; }
      const y = fy(Fr.x, Fr.z, Fr.lv);
      const k = Math.min(1, Fr.life / 1.2);
      for (let j = 0; j < 14; j++) { const s = (j * 0.31 + g.t * 1.3) % 1; const an = j * 2.4 + g.t * 0.3, dd = (j % 5) / 5 * Fr.r; parts.push({ x: Fr.x + Math.cos(an) * dd, y: y + 0.2 + s * 1.6, z: Fr.z + Math.sin(an) * dd, size: (1.2 - s * 0.7) * k, alpha: 0.85 * (1 - s) * k, type: 12, seed: j / 14 }); }
      lights.push({ p: [Fr.x, y + 1, Fr.z], r: 9, c: [2.2 * k * (0.85 + Math.sin(g.t * 17 + i) * 0.15), 1.1 * k, 0.35 * k], d: Math.hypot(Fr.x - M.x, Fr.z - M.z) });
      Fr.snd -= dt; if (Fr.snd <= 0) { Fr.snd = 1.1; ZA.synth('fire', { pos: [Fr.x, y + 0.5, Fr.z], vol: 0.5 }); }
    }
    for (const ac of b.ac || []) { const x = ac[0] / 10, z = ac[1] / 10, k = clamp(ac[2] / 10 / 0.6, 0, 1), ay = fy(x, z, ac[3]); parts.push({ x, y: ay + 0.04, z, size: ACID.r * 1.1, alpha: 0.75 * k, type: 26, dw: -1, seed: (x * 7) % 1 }); if (Math.random() < 0.3) parts.push({ x: x + rnd(-1.5, 1.5), y: ay + rnd(0.1, 0.5), z: z + rnd(-1.5, 1.5), size: 0.2, alpha: 0.6, type: 25, seed: Math.random() }); }
    for (let i = g.fx.length - 1; i >= 0; i--) {
      const p = g.fx[i];
      if (p.nade) {
        p.t += dt;
        if (p.t > p.life) { g.fx.splice(i, 1); continue; }
        const u = clamp(p.t / 0.75, 0, 1);
        let x, y, z;
        if (p.arc && p.arc.length > 1) { const q = u * (p.arc.length - 1), j = Math.floor(q), fr = q - j, A0 = p.arc[j], B0 = p.arc[Math.min(p.arc.length - 1, j + 1)]; x = lerp(A0[0], B0[0], fr); y = lerp(A0[1], B0[1], fr); z = lerp(A0[2], B0[2], fr); }
        else { x = lerp(p.x0, p.x1, u); z = lerp(p.z0, p.z1, u); y = lerp(fy(p.x0, p.z0, p.lv0) + 1.5, fy(p.x1, p.z1, p.lv1) + 0.12, u) + Math.sin(u * Math.PI) * 2.6; }
        const TM = V.thrM && V.thrM[p.k === 'molotov' ? 'molo' : 'nade'];
        if (TM) items.push({ mesh: TM.mesh, model: m4.pose(x, y, z, p.t * 9, p.t * 11, 0, 1.25), skin: ID_SKIN, tex: TM.tex, nrm: TM.nrm, col: THR_COL, cast: false });
        else items.push({ mesh: p.k === 'molotov' ? V.molObj : V.nadeObj, model: m4.pose(x, y - 0.06, z, p.t * 9, p.t * 11, 0, 1.4) });
        if (p.k === 'molotov') parts.push({ x, y: y + 0.15, z, size: 0.25, alpha: 0.9, type: 12, seed: 0.5 });
        else if (u >= 1 && Math.sin(p.t * 20) > 0) parts.push({ x, y: y + 0.1, z, size: 0.12, alpha: 1, type: 8, seed: 0.5 });
        continue;
      }
      if (p.spit) {
        p.t += dt;
        if (p.t > p.life) { g.fx.splice(i, 1); const y1 = fy(p.x1, p.z1, p.lv1); for (let k = 0; k < 6; k++) fxPush({ x: p.x1 + rnd(-0.6, 0.6), y: y1 + 0.2, z: p.z1 + rnd(-0.6, 0.6), size: rnd(0.3, 0.6), alpha: 0.8, type: 25, life: 0.6, vy: 0.6, seed: Math.random() }); ZA.synth('sizzle', { pos: [p.x1, y1, p.z1], vol: 0.8, len: 1.2 }); continue; }
        const u = p.t / p.life;
        const x = lerp(p.x0, p.x1, u), z = lerp(p.z0, p.z1, u), y = lerp(p.y0, fy(p.x1, p.z1, p.lv1), u) + Math.sin(u * Math.PI) * 2.2;
        parts.push({ x, y, z, size: 0.32, alpha: 1, type: 25, seed: 0.4 });
        continue;
      }
      p.life -= dt;
      if (p.life <= 0) { g.fx.splice(i, 1); continue; }
      if (p.vy) p.y += p.vy * dt;
      if (p.vx) p.x += p.vx * dt;
      if (p.vz) p.z += p.vz * dt;
      if (p.grav) { p.vy -= 9.8 * dt; const gy2 = p.lv != null ? fy(p.x, p.z, p.lv) : Math.max(floorH(p.x, p.z), (houseY(p.x, p.z, 1) != null && p.y > HOUSE.f1 - 0.2 ? houseY(p.x, p.z, 1) : houseY(p.x, p.z, 0)) || -99); if (p.y < gy2 + 0.02) { p.y = gy2 + 0.02; p.vy = 0; p.vx = (p.vx || 0) * 0.3; p.vz = (p.vz || 0) * 0.3; } }
      if (p.grow) p.size += p.grow * dt;
      parts.push({ x: p.x, y: p.y, z: p.z, size: p.size, alpha: p.hold || p.flip ? p.alpha : p.alpha * clamp(p.life * 6, 0, 1), type: p.type, seed: p.flip ? 1 - p.life / p.flip : p.seed || 0.5, dx: p.dx, dy: p.dy, dz: p.dz, dw: p.dw });
    }
    if (g.holes && g.holes.length) {
      const cp = g.cam ? g.cam.pos : [M.x, 1.6, M.z];
      for (let i = g.holes.length - 1; i >= 0; i--) {
        const h = g.holes[i];
        h.t += dt;
        if (h.t > 30) { g.holes.splice(i, 1); continue; }
        if (Math.abs(h.x - cp[0]) + Math.abs(h.z - cp[2]) > 60) continue;
        parts.push({ x: h.x, y: h.y, z: h.z, size: h.s, alpha: clamp((30 - h.t) / 5, 0, 1), type: 28, seed: h.seed, dx: h.n[0], dy: h.n[1], dz: h.n[2], dw: -2 });
      }
    }
    for (let i = g.tr.length - 1; i >= 0; i--) {
      const t = g.tr[i];
      t.life -= dt;
      if (t.life <= 0) { g.tr.splice(i, 1); continue; }
      const dx = t.b[0] - t.a[0], dy = t.b[1] - t.a[1], dz = t.b[2] - t.a[2], L = Math.hypot(dx, dy, dz) || 1;
      const u = 1 - t.life / 0.06, s0 = clamp(u * 1.4 - 0.4, 0, 1), s1 = clamp(u * 1.4, 0, 1);
      const ax = t.a[0] + dx * s0, ay = t.a[1] + dy * s0, az = t.a[2] + dz * s0, bx = t.a[0] + dx * s1, by = t.a[1] + dy * s1, bz = t.a[2] + dz * s1;
      const LL = Math.max(0.05, L * (s1 - s0));
      parts.push({ x: (ax + bx) / 2, y: (ay + by) / 2, z: (az + bz) / 2, size: 0.022, alpha: 0.85, type: 4, dx: dx / L, dy: dy / L, dz: dz / L, dw: LL / 2 });
    }
    drawScenery(g, V, items, parts, lights, [M.x, 0, M.z], g.t, inView);
    g.aimLand = null;
    if (g.thr && M.st === 0) {
      const o = [pos[0] + Math.cos(g.yaw) * -0.15, pos[1] - 0.1, pos[2] - Math.sin(g.yaw) * -0.15];
      const L = arcLand(o, g.yaw, g.pitch + 0.32, g.thr.k === 'grenade' ? 17 : 15, M.lv);
      g.aimLand = L;
      L.pts.forEach((q, i) => { if (i > 0) parts.push({ x: q[0], y: q[1], z: q[2], size: 0.07, alpha: 0.95, type: 8, seed: 0.5 }); });
      const R0 = g.thr.k === 'grenade' ? THROW.grenade.r : THROW.molotov.r;
      const ly = fy(L.x, L.z, L.lv) + 0.08;
      for (let i = 0; i < 28; i++) { const an = (i / 28) * Math.PI * 2 + g.t * 0.6; parts.push({ x: L.x + Math.cos(an) * R0, y: ly, z: L.z + Math.sin(an) * R0, size: 0.11, alpha: 0.95, type: 8, seed: 0.5 }); }
      parts.push({ x: L.x, y: ly, z: L.z, size: 0.35, alpha: 0.9, type: 8, seed: 0.5 });
    }
    lights.sort((p, q) => p.d - q.d);
    const useLights = lights.slice(0, 4);
    const spot = g.torch && M.st !== 2 ? { p: [pos[0] - Math.cos(yaw) * 0.12, pos[1] - 0.1, pos[2] + Math.sin(yaw) * 0.12], d: fwd, cos: 0.84, r: 30, c: [1.5, 1.42, 1.25] } : null;
    let vmLights = null;
    if (fp && M.st === 0 && g.F) {
      const Wn = WEAPONS[M.w], mg = M.mag[M.w] == null ? (Wn ? Wn.mag : 0) : M.mag[M.w];
      fpItems(vm, V, g.F, { dt, t: g.t, ads: g.ads && !g.thr, speed: M.speed, sprint: M.sprint, scope: M.w === 'sniper', throwK: g.thr ? g.thr.k : g.lastThrowK, mag: mg, need: Wn ? Wn.mag - mg : 0, pump: M.w === 'shotgun' && mg > 0 }, { pos, yaw, pitch });
      vmLights = [{ p: [pos[0] - Math.cos(yaw) * 0.35, pos[1] + 0.3, pos[2] + Math.sin(yaw) * 0.35], r: 1.5, c: [0.9, 0.85, 0.8] }].concat(useLights.filter((l) => l.d < 6));
    }
    const at = [pos[0] + fwd[0] * 10, pos[1] + fwd[1] * 10, pos[2] + fwd[2] * 10];
    const VP = V.R.render({ env: V.env, cam: { pos, at, fov, vmFov: 0.98, vmNear: 0.02, shadowAt: [M.x, 0, M.z], far: 380 }, items, parts, vm, lights: useLights, spot, vmLights });
    overlay(g, VP, tagList, dt);
  };

  const overlay = (g, VP, tags, dt) => {
    const M = g.me;
    const W = GS.W, H = GS.H;
    const proj = (x, y, z) => { const cw = VP[3] * x + VP[7] * y + VP[11] * z + VP[15]; if (cw <= 0.05) return null; const cx = (VP[0] * x + VP[4] * y + VP[8] * z + VP[12]) / cw, cy = (VP[1] * x + VP[5] * y + VP[9] * z + VP[13]) / cw; return [(cx * 0.5 + 0.5) * W, (0.5 - cy * 0.5) * H, cw]; };
    const dm = dmgRef.current;
    if (dm) {
      let k = 0;
      for (let i = g.dn.length - 1; i >= 0; i--) {
        const n = g.dn[i];
        n.t += dt;
        if (n.t > 0.85) { g.dn.splice(i, 1); continue; }
        const p = proj(n.x, n.y + n.t * 0.55, n.z);
        if (!p || k >= dm.children.length) continue;
        const el = dm.children[k++];
        const pop = n.t < 0.08 ? 1.35 - n.t * 4 : 1;
        el.style.transform = `translate(${p[0].toFixed(1)}px,${p[1].toFixed(1)}px) translate(-50%,-50%) scale(${pop.toFixed(2)})`;
        el.style.opacity = String(clamp((0.85 - n.t) * 4, 0, 1));
        el.style.color = n.head ? '#FFD23A' : n.armor ? '#A8B4C0' : '#FFFFFF';
        el.style.fontSize = n.head ? '19px' : '16px';
        if (el.textContent !== String(n.v)) el.textContent = String(n.v);
        el.style.display = 'block';
      }
      for (; k < dm.children.length; k++) dm.children[k].style.display = 'none';
    }
    const hb = hbRef.current;
    if (hb) {
      const cand = [];
      if (!g.opt || g.opt.bars) for (const A of g.anim.values()) {
        if (!(A.hpp < 100) || A.dead) continue;
        const d = Math.hypot(A.x - M.x, A.z - M.z);
        if (d > 32) continue;
        cand.push([d, A]);
      }
      cand.sort((a, b) => a[0] - b[0]);
      let k = 0;
      for (const [d, A] of cand) {
        if (k >= hb.children.length) break;
        const T = ZT[A.k] || ZT.walker;
        const top = A.hd ? A.hd[1] + 0.34 : A.y + (A.k === 'crawler' ? 0.85 : T.h + 0.22);
        const p = proj(A.x, top, A.z);
        if (!p) continue;
        const el = hb.children[k++];
        const w = clamp(46 - d * 0.75, 26, 42);
        el.style.width = `${w.toFixed(0)}px`;
        el.style.transform = `translate(${(p[0] - w / 2).toFixed(1)}px,${(p[1] - 2).toFixed(1)}px)`;
        el.style.opacity = String(clamp((32 - d) / 6, 0, 1));
        el.firstChild.style.transform = `scaleX(${(clamp(A.hpp, 0, 100) / 100).toFixed(3)})`;
        el.style.display = 'block';
      }
      for (; k < hb.children.length; k++) hb.children[k].style.display = 'none';
    }
    const tg = tagRef.current;
    if (tg) {
      let k = 0;
      for (const t of tags) {
        if (k >= tg.children.length) break;
        const p = proj(t.x, t.y, t.z);
        if (!p) continue;
        const el = tg.children[k++];
        el.style.display = 'block';
        el.style.transform = `translate(${p[0].toFixed(1)}px,${p[1].toFixed(1)}px) translate(-50%,-100%)`;
        const txt = t.n || '';
        if (el.textContent !== txt) el.textContent = txt;
        el.style.color = t.st === 1 ? '#FF8A7A' : t.bot ? 'rgba(220,226,232,0.85)' : '#8FD8FF';
      }
      for (; k < tg.children.length; k++) tg.children[k].style.display = 'none';
    }
    g.hm = Math.max(0, g.hm - dt); g.hmKill = Math.max(0, g.hmKill - dt);
    const hel = hitRef.current;
    if (hel) { hel.style.opacity = g.hm > 0 ? '1' : '0'; const c = g.hmKill > 0 ? '#FF3B2E' : g.hmHead ? '#FFD23A' : '#FFFFFF'; for (const s of hel.children) s.style.background = c; hel.style.transform = `scale(${g.hmKill > 0 ? 1.25 : 1})`; }
    const bb = bossRef.current;
    if (bb) {
      const BA = g.bossA && g.anim.get(g.bossA.id) === g.bossA ? g.bossA : null;
      const show = !!(BA && M);
      if (bb.dataset.on !== (show ? '1' : '0')) { bb.dataset.on = show ? '1' : '0'; bb.style.display = show ? 'flex' : 'none'; }
      if (show) { const f = clamp((BA.hpp || 100) / 100, 0, 1); const bar = bb.lastChild.firstChild; const v = f.toFixed(3); if (bar.dataset.v !== v) { bar.dataset.v = v; bar.style.transform = `scaleX(${v})`; } }
    }
    const xh = xhRef.current;
    if (xh) {
      const Wc = WEAPONS[M.w];
      const gap = Wc ? 6 + (Wc.spr * 170 + g.bloom * 250) * (M.speed > 1 ? 1.4 : 1) * (g.ads ? 0.3 : 1) : 8;
      xh.style.setProperty('--gap', `${gap.toFixed(1)}px`);
      const kind = M.w === 'shotgun' ? '1' : M.w === 'sniper' ? '2' : '0';
      if (xh.dataset.k !== kind) { xh.dataset.k = kind; const ch = xh.children; for (let i = 0; i < 4; i++) ch[i].style.display = kind === '0' ? 'block' : 'none'; ch[4].style.display = kind === '1' ? 'block' : 'none'; ch[5].style.display = kind === '2' ? 'block' : 'none'; }
      if (kind === '1') xh.style.setProperty('--rr', `${(gap * 1.5 + 9).toFixed(1)}px`);
      let onZ = false;
      if (Wc && g.cam && M.st === 0) { const d = camDir(g); const h = rayZ(g.cam.pos, d, Wc.rng, g.anim.values()); onZ = !!h && !rayBlocked(M.x, M.z, h.A.x, h.A.z, fy(M.x, M.z, M.lv) + 1.45, g.cam.pos[1] + d[1] * h.t); }
      const xc = onZ ? '#FF3B30' : XCOL[(g.opt && g.opt.xcol) || 'white'] || '#FFFFFF';
      if (xh.dataset.xc !== xc) { xh.dataset.xc = xc; xh.style.setProperty('--xc', xc); }
      xh.style.opacity = M.st === 0 && !g.thr && !g.emo && !(g.ads && g.view === 'fp') && !M.sprint ? '1' : '0';
      const rd = rdRef.current;
      if (rd) { const on = M.w === 'rifle' && g.ads && g.view === 'fp' && M.st === 0 && !g.thr && g.F && g.F.ads > 0.8; rd.style.opacity = on ? '1' : '0'; if (on && rd.dataset.xc !== xc) { rd.dataset.xc = xc; rd.style.background = onZ ? '#FF3B30' : '#FF2A1F'; } }
    }
    const sc = scopeRef.current;
    if (sc) { const on = g.ads && M.w === 'sniper' && g.view === 'fp' && g.F && g.F.ads > 0.85; sc.style.display = on ? 'block' : 'none'; const dot = sc.nextSibling; if (dot) dot.style.display = g.ads && M.w !== 'sniper' && g.view === 'fp' && g.F && g.F.ads > 0.6 && !g.thr ? 'block' : 'none'; }
    g.hurtT = Math.max(0, g.hurtT - dt);
    const hv = hurtRef.current;
    if (hv) { hv.style.opacity = String(clamp(g.hurtT * 1.8, 0, 0.8) + (M.hp < 35 && M.st === 0 ? 0.22 + Math.sin(g.t * 5) * 0.08 : 0)); hv.style.filter = g.acidT > 0 ? 'hue-rotate(80deg)' : 'none'; }
    g.acidT = Math.max(0, (g.acidT || 0) - dt);
    const dr = dirRef.current;
    if (dr) {
      let k = 0;
      for (let i = g.hurtDirs.length - 1; i >= 0; i--) { const h = g.hurtDirs[i]; h.t -= dt * 1.2; if (h.t <= 0) { g.hurtDirs.splice(i, 1); continue; } if (k >= dr.children.length) continue; const el = dr.children[k++]; const rel = angDiff(g.yaw, h.a); el.style.display = 'block'; el.style.opacity = String(clamp(h.t, 0, 1)); el.style.transform = `rotate(${(-rel * 180 / Math.PI).toFixed(1)}deg)`; }
      for (; k < dr.children.length; k++) dr.children[k].style.display = 'none';
    }
    g.mapT -= dt;
    if (g.mapT <= 0 && mapRef.current) {
      g.mapT = 0.1;
      const zs = [], ps = [];
      for (const A of g.anim.values()) if (Math.hypot(A.x - M.x, A.z - M.z) < 46) zs.push([A.x, A.z, A.k === 'brute' ? 1 : 0]);
      const Sn = g.snaps[g.snaps.length - 1];
      let petp = null;
      if (Sn) for (const p of Sn.ps.values()) { if (p.id !== myId && p.st !== 2) ps.push([p.x, p.z, p.yaw, p.st]); if (p.id === myId && p.pst >= 0) petp = [p.px, p.pz]; }
      drawMinimap(mapRef.current, { x: M.x, z: M.z, yaw: g.yaw, scale: 2.2, roads: ROADS, blocks: BLOCKS, water: WATER, zs, ps, pet: petp, acid: Sn ? (Sn.ac || []).map((q) => [q[0] / 10, q[1] / 10]) : [] });
    }
  };

  const ptr = (e) => { const el = wrapRef.current; const r = el.getBoundingClientRect(); return GS.side ? { x: e.clientY - r.top, y: r.right - e.clientX } : { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const lookBy = (dx, dy, mouse) => {
    const g = G.current;
    if (!g.me) return;
    const M = g.me;
    const k = (mouse ? 0.0036 : 0.0056) * (g.sens || 1) * (g.ads ? (M.w === 'sniper' ? 0.32 : 0.6) * ((g.opt && g.opt.adsK) || 1) : 1);
    const ddx = GS.side ? dy : dx, ddy = GS.side ? -dx : dy;
    g.yaw -= ddx * k;
    g.pitch = clamp(g.pitch - ddy * k * 0.85, -1.25, 1.2);
  };
  const lookDown = (e) => {
    if (phase !== 'play') return;
    const el = wrapRef.current;
    const p = ptr(e);
    const wid = GS.side ? el.clientHeight : el.clientWidth, hei = GS.side ? el.clientWidth : el.clientHeight;
    void wid; void hei;
    if (e.pointerType !== 'mouse' && p.x < GS.W * 0.42 && p.y > GS.H * 0.3) { J.handlers.onPointerDown(e); return; }
    ZA.init();
    if (e.pointerType === 'mouse') {
      const el0 = wrapRef.current;
      if (el0 && el0.requestPointerLock && !G.current.lockFail && document.pointerLockElement !== el0) { try { const pr = el0.requestPointerLock(); if (pr && pr.catch) pr.catch(() => { G.current.lockFail = true; }); } catch { G.current.lockFail = true; } return; }
      const g = G.current;
      if (e.button === 0) g.fire = true;
      if (e.button === 2) { g.ads = g.opt && g.opt.adsMode === 'tap' ? !g.ads : true; syncHud(true); }
      g.lookP.set(e.pointerId, { x: e.clientX, y: e.clientY });
      return;
    }
    G.current.lookP.set(e.pointerId, { x: e.clientX, y: e.clientY });
  };
  const lookMove = (e) => {
    J.handlers.onPointerMove(e);
    const g = G.current;
    if (e.pointerType === 'mouse' && wrapRef.current && document.pointerLockElement === wrapRef.current) return;
    const L = g.lookP.get(e.pointerId);
    if (!L) return;
    lookBy(e.clientX - L.x, e.clientY - L.y, e.pointerType === 'mouse');
    L.x = e.clientX; L.y = e.clientY;
  };
  const lookUp = (e) => { J.handlers.onPointerUp(e); const g = G.current; if (g.lookP.delete(e.pointerId) && e.pointerType === 'mouse') { if (e.button === 0) g.fire = false; if (e.button === 2 && !(g.opt && g.opt.adsMode === 'tap')) { g.ads = false; syncHud(true); } } };
  const lookRef = useRef(null);
  lookRef.current = { move: lookMove, up: lookUp, look: (dx, dy) => { if (phase === 'play') lookBy(dx, dy, true); } };
  useEffect(() => {
    const ch = () => setLocked(!!wrapRef.current && document.pointerLockElement === wrapRef.current);
    const mm = (e) => { if (!wrapRef.current || document.pointerLockElement !== wrapRef.current) return; const dx = e.movementX || 0, dy = e.movementY || 0; if (Math.abs(dx) > 400 || Math.abs(dy) > 400) return; lookRef.current.look(dx, dy); };
    document.addEventListener('mousemove', mm);
    const bad = () => { G.current.lockFail = true; setLocked(false); };
    document.addEventListener('pointerlockchange', ch);
    document.addEventListener('pointerlockerror', bad);
    return () => { document.removeEventListener('pointerlockchange', ch); document.removeEventListener('pointerlockerror', bad); document.removeEventListener('mousemove', mm); };
  }, []);
  useEffect(() => {
    if (phase === 'play' && !sheet) return undefined;
    try { if (document.pointerLockElement && document.exitPointerLock) document.exitPointerLock(); } catch {}
    return undefined;
  }, [phase, sheet]);
  useEffect(() => {
    if (phase !== 'play') return undefined;
    const el = wrapRef.current;
    if (!el) return undefined;
    const wh = (e) => { if (document.pointerLockElement === el && Math.abs(e.deltaY) > 4) { e.preventDefault(); swapRef.current(); } };
    el.addEventListener('wheel', wh, { passive: false });
    return () => el.removeEventListener('wheel', wh);
  }, [phase]);
  useEffect(() => {
    if (phase !== 'play') return undefined;
    const mv = (e) => { if (e.pointerType !== 'mouse') lookRef.current.move(e); };
    const up = (e) => { if (e.pointerType !== 'mouse') lookRef.current.up(e); };
    window.addEventListener('pointermove', mv, { passive: true });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'play') return undefined;
    const g = G.current;
    const kd = (e) => {
      if (sheet || (e.target && /INPUT|TEXTAREA/.test(e.target.tagName))) return;
      if (e.repeat) return;
      g.keys.add(e.code);
      if (e.code === 'KeyR') startReload(g);
      else if (e.code === 'KeyQ') swapGun();
      else if (e.code === 'KeyG') throwStart('grenade');
      else if (e.code === 'KeyF') throwStart('molotov');
      else if (e.code === 'KeyV') melee();
      else if (e.code === 'Space') g.jumpReq = true;
      else if (e.code === 'KeyC' || e.code === 'ControlLeft') g.crReq = true;
      else if (e.code === 'KeyE') { if (!g.revHold && hudRef.current && hudRef.current.near) ZA.call('cover', sexRef.current, { cd: 12 }); g.revHold = true; }
      else if (e.code === 'KeyB') setSheet('emote');
      else if (e.code === 'Enter' && mode && !mode.solo) setSheet('chat');
    };
    const ku = (e) => { g.keys.delete(e.code); if (e.code === 'KeyE') g.revHold = false; if ((e.code === 'KeyG' || e.code === 'KeyF') && g.thr) throwEnd(false); };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); g.keys.clear(); };
  }, [phase, sheet, mode]);

  const cancelRef = useRef(null);
  const overCancel = (e) => { const el = cancelRef.current; if (!el) return false; const r = el.getBoundingClientRect(); return e.clientX >= r.left - 8 && e.clientX <= r.right + 8 && e.clientY >= r.top - 8 && e.clientY <= r.bottom + 8; };
  const sendChat = (t0) => {
    const t = String(t0 || '').replace(/\s+/g, ' ').trim().slice(0, 90);
    const g = G.current;
    if (!t || !g.net) return;
    g.net.send({ t: 'ct', x: t });
    pushChat('You', t);
    setChatLog((l) => [...l.slice(-30), { who: 'You', t }]);
    setChatText(''); setSheet(null);
  };
  const ensureRoom = () => {
    if (myRoom) return myRoom;
    const rm = { reg: regNow, r: newSquad() };
    setMyRoom(rm);
    return rm;
  };
  const inviteNow = (fr) => {
    const g = G.current;
    if (!onInvite || !fr) return;
    let room;
    if (phase === 'play' && mode && !mode.solo && g.net) room = { reg: mode.reg, r: String(mode.r) };
    else { room = ensureRoom(); setLobbyMode('friends'); }
    try { onInvite([fr], room); } catch {}
    setInvited((s0) => new Set(s0).add(fr.id));
    pushNote(`Invite sent to ${String(fr.name || 'Friend').split(' ')[0]}`, 'join');
  };
  const inviteOne = (f) => {
    if (!onInvite) return;
    const room = ensureRoom();
    setLobbyMode('friends');
    try { onInvite([f], room); } catch {}
    setInvited((s0) => new Set(s0).add(f.id));
    pushNote(`Invite sent to ${String(f.name || 'Friend').split(' ')[0]}`, 'join');
  };


  const H = hud || {};
  const s = look.size * (land ? 1 : 0.86) * 0.82;
  const see = 1 - look.see;
  const px = (v) => Math.round(v * s);
  const WN = (k) => (WEAPONS[k] ? WEAPONS[k].n : '');
  const CTL = [
    { id: 'fire', icon: 'bullet', big: true, size: px(88), st: { right: right(26), bottom: bottom(px(54)) }, label: 'Shoot' },
    { id: 'ads', icon: 'scope', size: px(56), st: { right: right(px(132)), bottom: bottom(px(118)) }, label: 'Aim down sights' },
    { id: 'rel', icon: 'mag', size: px(52), st: { right: right(px(34)), bottom: bottom(px(160)) }, label: 'Reload' },
    { id: 'mel', icon: 'knife', size: px(48), st: { right: right(px(140)), bottom: bottom(px(34)) }, label: 'Melee' },
    { id: 'nade', icon: 'grenade', size: px(50), st: { right: right(px(208)), bottom: bottom(px(64)) }, label: 'Throw a grenade' },
    { id: 'molo', icon: 'bottle', size: px(50), st: { right: right(px(208)), bottom: bottom(px(130)) }, label: 'Throw a fire bottle' },
    { id: 'jump', icon: 'jump', size: px(50), st: { right: right(px(30)), bottom: bottom(px(280)) }, label: 'Jump' },
    { id: 'crouch', icon: 'crouch', size: px(50), st: { right: right(px(206)), bottom: bottom(px(196)) }, label: 'Crouch or slide' },
    { id: 'emote', icon: 'emote', size: px(42), st: { right: right(px(118)), bottom: bottom(px(190)) }, label: 'Emotes' },
    { id: 'fireL', icon: 'bullet', size: px(60), st: { left: left(px(150)), bottom: bottom(px(178)) }, label: 'Shoot with left hand' },
  ];
  const CD = Object.fromEntries(CTL.map((c) => [c.id, c]));
  const hx = (id) => { const L = (hudEdit || hudL)[id]; if (!L) return null; return { transform: `translate(${Math.round(L.dx || 0)}px, ${Math.round(L.dy || 0)}px) scale(${L.s || 1})`, ...(L.o != null && L.o < 1 ? { opacity: L.o } : null) }; };
  const hs = (id) => ({ ...CD[id].st, ...hx(id) });
  const saveHud = (L) => { setHudL(L); try { localStorage.setItem(HUD_KEY, JSON.stringify(L)); } catch {} };
  const hudDrag = (e, id) => {
    e.stopPropagation(); e.preventDefault();
    setHudSel(id);
    const L0 = { dx: 0, dy: 0, s: 1, ...((hudEdit || {})[id] || {}) };
    const x0 = e.clientX, y0 = e.clientY, pid = e.pointerId;
    const mv = (ev) => { if (ev.pointerId !== pid) return; const ddx = ev.clientX - x0, ddy = ev.clientY - y0; const lx = GS.side ? ddy : ddx, ly = GS.side ? -ddx : ddy; setHudEdit((d) => ({ ...(d || {}), [id]: { ...L0, dx: L0.dx + lx, dy: L0.dy + ly } })); };
    const end = (ev) => { if (ev.pointerId !== pid) return; window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', end); window.removeEventListener('pointercancel', end); };
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  };
  const hudSet = (id, k, v) => setHudEdit((d) => ({ ...(d || {}), [id]: { dx: 0, dy: 0, s: 1, ...((d || {})[id] || {}), [k]: v } }));

  const setOptK = (k, v) => setOpt((o) => { const n = { ...o, [k]: v }; try { localStorage.setItem(PREF.opt, JSON.stringify(n)); } catch {} return n; });
  const T0 = TIERS[tierWant != null ? tierWant : tier] || TIERS[1];
  const gv = (k) => (gfxo[k] != null ? gfxo[k] : T0[k]);
  const setGfxK = (k, v) => setGfxo((o) => { const n = { ...o, [k]: v }; try { localStorage.setItem(PREF.gfxo, JSON.stringify(n)); } catch {} return n; });
  const pickTier = (i, later) => { setPref(PREF.gfx, i); setGfxo({}); try { localStorage.removeItem(PREF.gfxo); } catch {} if (later) setTierWant(i); else { setTierWant(null); setTier(i); setGfxBuilt('{}'); } };
  const gfxPending = JSON.stringify(gfxo) !== gfxBuilt || (tierWant != null && tierWant !== tier);
  const closeSettings = () => {
    setSheet(null);
    if (phase !== 'play' && JSON.stringify(gfxo) !== gfxBuilt) { const g = G.current; if (g.V) { g.V.dispose(); g.V = null; } setPhase('load'); setGfxBuilt(JSON.stringify(gfxo)); }
  };
  const setTabs = [
    { k: 'graphics', label: 'Graphics', body: (
      <>
        <GSetRow label="Quality" sub="Sets every option below"><GSeg value={tierWant != null ? tierWant : tier} items={TIERS.map((t, i) => [i, t.name])} onPick={(i) => { if (phase === 'play') { pickTier(i, true); } else { if (i === tier && !Object.keys(gfxo).length) return; const g = G.current; setSheet(null); if (g.V) { g.V.dispose(); g.V = null; } setPhase('load'); pickTier(i); } }} label="Quality" /></GSetRow>
        <GSetRow label="Resolution"><GSeg value={gv('dpr')} items={[[0.6, 'Low'], [0.8, 'Medium'], [1, 'High'], [1.25, 'Ultra']]} onPick={(v) => setGfxK('dpr', v)} label="Resolution" /></GSetRow>
        <GSetRow label="Shadows"><GSeg value={gv('shadow')} items={[[0, 'Off'], [1024, 'Low'], [2048, 'High']]} onPick={(v) => { setGfxK('shadow', v); setGfxK('shadowN', v ? (v > 1024 ? 22 : 10) : 0); }} label="Shadows" /></GSetRow>
        <GSetRow label="Grass"><GSeg value={gv('grass')} items={[[0, 'Off'], [6500, 'Low'], [15000, 'High']]} onPick={(v) => setGfxK('grass', v)} label="Grass" /></GSetRow>
        <GSetRow label="Trees"><GSeg value={gv('trees')} items={[[0.25, 'Few'], [0.5, 'Some'], [1, 'Full']]} onPick={(v) => setGfxK('trees', v)} label="Trees" /></GSetRow>
        <GSetRow label="Glow and color"><GSetToggle on={!!gv('post')} label="Glow and color" onToggle={(n) => setGfxK('post', n)} /></GSetRow>
        <GSetRow label="Zombies on screen"><GSeg value={gv('zmax')} items={[[34, 'Fewer'], [56, 'Normal'], [80, 'More']]} onPick={(v) => setGfxK('zmax', v)} label="Zombies on screen" /></GSetRow>
        <GSetRow label="Frame rate" sub="30 saves battery"><GSeg value={opt.fps} items={[[30, '30'], [60, '60']]} onPick={(v) => setOptK('fps', v)} label="Frame rate" /></GSetRow>
        {gfxPending && <div style={{ fontSize: 12, fontWeight: 700, color: '#FFC23D', paddingTop: 10 }}>{phase === 'play' ? 'Changes apply when you leave this game' : 'Changes apply when you close settings'}</div>}
      </>
    ) },
    { k: 'gameplay', label: 'Gameplay', body: (
      <>
        <GSetRow label="Camera"><GSeg value={view} items={[['fp', 'First person'], ['tp', 'Third person']]} onPick={(v) => { setView(v); setPref(PREF.view, v); }} label="Camera" /></GSetRow>
        <GSetRow label="Flashlight"><GSetToggle on={!!torch} label="Flashlight" onToggle={(n) => { setTorch(n); setPref(PREF.torch, n ? 1 : 0); }} /></GSetRow>
        <GSetRow label="Bots in offline games"><GSetToggle on={bots} label="Bots in offline games" onToggle={(n) => { setBots(n); setPref(PREF.bots, n ? '1' : '0'); }} /></GSetRow>
      </>
    ) },
    { k: 'hud', label: 'HUD', body: (
      <>
        <GSetRow label="Crosshair color" sub="Turns red on a zombie"><GSeg value={opt.xcol} items={[['white', 'White'], ['green', 'Green'], ['yellow', 'Yellow'], ['cyan', 'Cyan']]} onPick={(v) => setOptK('xcol', v)} label="Crosshair color" /></GSetRow>
        <GSetRow label="Damage numbers"><GSetToggle on={!!opt.dmg} label="Damage numbers" onToggle={(n) => setOptK('dmg', n ? 1 : 0)} /></GSetRow>
        <GSetRow label="Zombie health bars"><GSetToggle on={!!opt.bars} label="Zombie health bars" onToggle={(n) => setOptK('bars', n ? 1 : 0)} /></GSetRow>
      </>
    ) },
  ];

  const playText = (t) => (lo.ok ? t : lo.f < 1 ? `Downloading ${Math.round(lo.f * 100)}%` : 'Loading');
  const joinName = (() => { if (!pendJoin) return ''; const f = friends.find((x) => x.id === pendJoin.from); return f ? String(f.name || 'Friend').split(' ')[0] : ''; })();
  const lobbyModes = [];
  if (pendJoin && cloudOn()) lobbyModes.push({ k: 'join', t: joinName ? `Join ${joinName}` : pendJoin.from ? 'Join your friend' : 'Join the room', s: pendJoin.from ? 'You were invited' : 'Your room is ready', tone: '#7CC46B' });
  if (rejoin && cloudOn()) lobbyModes.push({ k: 'rejoin', t: 'Rejoin your game', s: `${REGION_NAMES[rejoin.reg] || 'Server'}, your spot is held`, tone: '#7CC46B' });
  if (cloudOn()) {
    lobbyModes.push({ k: 'online', t: 'Online', s: 'Play with anyone' });
    if (canInvite) lobbyModes.push({ k: 'friends', t: 'With friends', s: myRoom ? `${invited.size} invited` : 'Your own room' });
    lobbyModes.push({ k: 'custom', t: 'Custom room', s: 'Choose who can join' });
  }
  lobbyModes.push({ k: 'offline', t: 'Offline', s: 'No internet needed' });
  const modeNow = lobbyMode && lobbyModes.some((m) => m.k === lobbyMode) ? lobbyMode : lobbyModes[0].k;
  const lobbyStart = () => {
    kitTap();
    if (modeNow === 'join' && pendJoin) { start({ reg: pendJoin.reg, r: pendJoin.r, squad: /^[fh]/.test(String(pendJoin.r)) }); return; }
    if (modeNow === 'rejoin' && rejoin) { const r0 = rejoin; start({ reg: r0.reg, r: r0.r, squad: /^[fh]/.test(String(r0.r)) }); return; }
    if (modeNow === 'online') { quickPlay(); return; }
    if (modeNow === 'friends') { const rm = ensureRoom(); start({ reg: rm.reg, r: rm.r, squad: true }); return; }
    start({ solo: true });
  };
  const chNow = charOf(sv, col);
  const friendRows = (canInvite ? friends : []).map((f) => ({ id: f.id, name: f.name || 'Friend', avatar: f.avatar, on: !!(online && online.has && online.has(f.id)), sent: invited.has(f.id), raw: f }))
    .sort((a, b) => (b.on ? 1 : 0) - (a.on ? 1 : 0)).slice(0, 4);
  const startLabel = { join: 'Join', rejoin: 'Rejoin', online: 'Start', friends: 'Start', offline: 'Start' }[modeNow] || 'Start';
  const openMaker = () => {
    kitTap();
    const g = G.current;
    if (g.V) { const R = g.V.R; try { g.V.dispose(); } catch {} try { R.lose(); } catch {} }
    g.V = null; g.scn = null; g.menuRigs = null;
    if (g.pets) g.pets.clear();
    setSheet(null);
    setLobbyTab(null);
    setMakerErr(false);
    setPhase('maker');
    if (!MakerC) import('./zedit.jsx').then((m) => setMakerC(() => m.ZMaker)).catch(() => setMakerErr(true));
  };
  const closeMaker = () => { setPhase('load'); setCvKey((n) => n + 1); setBootTry((n) => n + 1); };
  const L = {
    GS, me, name: myFirst, best: G.current.best || 0, cloud: cloudOn(), canInvite,
    server: REGION_NAMES[regNow] || 'Server', ping: pings ? pings[regNow] : null,
    servers: REGION_KEYS.map((k0) => ({ k: k0, n: REGION_NAMES[k0], ping: pings ? pings[k0] : null, on: k0 === regNow })),
    pickServer: (k0) => { kitTap(); setReg(k0); if (!invited.size) setMyRoom(null); },
    onServer: () => setLobbyTab('server'), onFriends: () => setSheet('invite'), onSettings: () => setSheet('gfx'), onClose,
    modes: lobbyModes, mode: modeNow,
    setMode: (k0) => { kitTap(); if (k0 === 'custom') { setSheet('room'); return; } setLobbyMode(k0); },
    rooms: openRooms, onRoom: (o) => { kitTap(); start({ reg: o.reg, r: o.r }); },
    friendRows, onlineN: (canInvite ? friends : []).filter((f) => online && online.has && online.has(f.id)).length,
    onInviteFriend: (f) => { kitTap(); inviteOne(f.raw); },
    showBots: modeNow === 'online' || modeNow === 'friends' || modeNow === 'offline', bots,
    setBots: (v) => { kitTap(); setBots(v); setPref(PREF.bots, v ? '1' : '0'); if (!invited.size) setMyRoom(null); },
    startReady: lo.ok, startText: lo.ok ? startLabel : playText(startLabel), startLabel, onStart: lobbyStart,
    tab: lobbyTab, setTab: setLobbyTab,
    charName: chNow.n, gun, gunName: WEAPONS[gun] ? WEAPONS[gun].n : '', gunIcon: (w) => gunIcons[w] || '',
    secondName: WEAPONS[secondOf(gun)] ? WEAPONS[secondOf(gun)].n : '',
    petName: pet !== 'none' ? ((DOGS.find((d) => d.key === pet) || {}).name || '') : '',
    chars: SCHAR.map((c, i) => ({ k: c.k, n: c.n, g: WEAPONS[c.gun] ? WEAPONS[c.gun].n : '', img: `/dead/p_${c.k}.webp`, on: col === 100 + i, st: resItem(`s:${c.k}`), i, gun: c.gun })),
    pickChar: (c) => { kitTap(); setSv(GUN_SV[c.gun]); setCol(100 + c.i); setGun(c.gun); if (!c.st.ready) resFront(`s:${c.k}`, true); },
    guns: WKEYS.map((w) => { const W0 = WEAPONS[w]; return { k: w, n: W0.n, on: gun === w, img: gunIcons[w] || '', st: resItem(`g:${w}`), dmg: (W0.dmg * (W0.pel || 1)) / 150, rate: W0.rate / 11, rng: W0.rng / 95 }; }),
    pickGun: (w) => { kitTap(); setGun(w); if (!resItem(`g:${w}`).ready) resFront(`g:${w}`, true); },
    dogs: [...DOGS.map((d) => ({ k: d.key, n: d.name, img: portrait('dog', d.key), on: pet === d.key })), { k: 'none', n: 'None', img: '', on: pet === 'none' }],
    pickDog: (k0) => { kitTap(); setPet(k0); },
    onMaker: isAdmin ? openMaker : null,
  };
  const menu = phase === 'menu' && <ZLobby L={L} />;

  const play = phase === 'play' && hud && (
    <div style={{ position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none' }}>
      <div ref={hurtRef} aria-hidden="true" style={{ position: 'absolute', inset: 0, opacity: 0, background: 'radial-gradient(ellipse at center, rgba(110,0,0,0) 42%, rgba(150,8,8,0.78) 100%)' }} />
      <div ref={scopeRef} aria-hidden="true" style={{ position: 'absolute', inset: 0, display: 'none', background: 'radial-gradient(circle at center, rgba(0,0,0,0) 0, rgba(0,0,0,0) 34vmin, rgba(0,0,0,0.96) 34.4vmin)' }}>
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1.5, background: 'rgba(0,0,0,0.85)' }} />
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1.5, background: 'rgba(0,0,0,0.85)' }} />
        <div style={{ position: 'absolute', left: '50%', top: '50%', width: 6, height: 6, margin: -3, borderRadius: 3, background: '#FF3B2E' }} />
      </div>
      <div aria-hidden="true" style={{ position: 'absolute', left: '50%', top: '50%', width: 6, height: 6, margin: -3, borderRadius: 3, background: '#FF2A1E', boxShadow: '0 0 6px rgba(255,40,30,0.9)', display: 'none' }} />
      <div ref={bossRef} aria-hidden="true" style={{ position: 'absolute', left: '50%', top: top(64), transform: 'translateX(-50%)', width: land ? 300 : 220, display: 'none', flexDirection: 'column', alignItems: 'center', gap: 3, pointerEvents: 'none', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
        <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: 0.4, color: '#FFD2C4' }}>Giant brute</span>
        <div style={{ width: '100%', height: 8, borderRadius: 4, background: 'rgba(10,8,8,0.6)', boxShadow: '0 0 0 1px rgba(255,255,255,0.18)', overflow: 'hidden' }}>
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, #8E1B12, #E2452F)', transformOrigin: 'left center', transition: 'transform 0.15s linear' }} />
        </div>
      </div>
      <div ref={rdRef} aria-hidden="true" style={{ position: 'absolute', left: '50%', top: '50%', width: 5, height: 5, marginLeft: -2.5, marginTop: -2.5, borderRadius: '50%', background: '#FF2A1F', boxShadow: '0 0 4px 1px rgba(255,40,30,0.85)', opacity: 0, transition: 'opacity 0.08s', pointerEvents: 'none' }} />
      <div ref={xhRef} aria-hidden="true" data-k="0" style={{ position: 'absolute', left: '50%', top: '50%', width: 0, height: 0, transition: 'opacity 0.12s' }}>
        {[[0, -1], [0, 1], [-1, 0], [1, 0]].map(([dx, dy], i) => <span key={i} style={{ position: 'absolute', left: dx ? (dx < 0 ? 'calc(-1 * var(--gap, 8px) - 10px)' : 'var(--gap, 8px)') : -1, top: dy ? (dy < 0 ? 'calc(-1 * var(--gap, 8px) - 10px)' : 'var(--gap, 8px)') : -1, width: dx ? 10 : 2, height: dy ? 10 : 2, borderRadius: 1, background: 'var(--xc, #FFFFFF)', boxShadow: '0 0 0 0.6px rgba(0,0,0,0.55), 0 0 3px rgba(0,0,0,0.35)' }} />)}
        <span style={{ position: 'absolute', left: 'calc(-1 * var(--rr, 16px))', top: 'calc(-1 * var(--rr, 16px))', width: 'calc(2 * var(--rr, 16px))', height: 'calc(2 * var(--rr, 16px))', boxSizing: 'border-box', borderRadius: '50%', border: '1.6px solid var(--xc, #FFFFFF)', boxShadow: '0 0 0 0.6px rgba(0,0,0,0.45), inset 0 0 0 0.6px rgba(0,0,0,0.45)', display: 'none' }} />
        <span style={{ position: 'absolute', left: -2, top: -2, width: 4, height: 4, borderRadius: 2, background: 'var(--xc, #FFFFFF)', boxShadow: '0 0 0 0.6px rgba(0,0,0,0.6)', display: 'none' }} />
      </div>
      <div ref={hitRef} aria-hidden="true" style={{ position: 'absolute', left: '50%', top: '50%', width: 0, height: 0, opacity: 0, transition: 'transform 0.08s' }}>
        {[45, 135, 225, 315].map((r) => <span key={r} style={{ position: 'absolute', left: -1, top: -12, width: 2.5, height: 8, background: '#FFFFFF', transformOrigin: '1px 12px', transform: `rotate(${r}deg)`, boxShadow: '0 0 2px rgba(0,0,0,0.7)' }} />)}
      </div>
      <div ref={dirRef} aria-hidden="true" style={{ position: 'absolute', left: '50%', top: '50%', width: 0, height: 0 }}>
        {[0, 1, 2, 3].map((i) => <span key={i} style={{ position: 'absolute', left: -60, top: -120, width: 120, height: 120, display: 'none', borderRadius: '50%', borderTop: '6px solid rgba(255,40,30,0.8)', transformOrigin: '60px 120px' }} />)}
      </div>
      <div ref={hbRef} aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, width: 0, height: 0 }}>
        {Array.from({ length: 16 }, (_, i) => <div key={i} style={{ position: 'absolute', left: 0, top: 0, width: 34, height: 4, borderRadius: 2, background: 'rgba(12,12,12,0.6)', boxShadow: '0 0 0 1px rgba(0,0,0,0.35)', display: 'none', overflow: 'hidden', willChange: 'transform' }}><div style={{ height: '100%', width: '100%', background: '#E8352B', transformOrigin: '0 50%' }} /></div>)}
      </div>
      <div ref={dmgRef} aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, width: 0, height: 0 }}>
        {Array.from({ length: 22 }, (_, i) => <span key={i} style={{ position: 'absolute', left: 0, top: 0, display: 'none', fontWeight: 900, fontSize: 16, color: '#FFFFFF', textShadow: '0 1px 0 #000, 0 0 4px rgba(0,0,0,0.85)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', willChange: 'transform' }} />)}
      </div>
      <div ref={tagRef} aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, width: 0, height: 0 }}>
        {Array.from({ length: 10 }, (_, i) => <span key={i} style={{ position: 'absolute', left: 0, top: 0, display: 'none', fontWeight: 800, fontSize: 12, color: '#8FD8FF', textShadow: '0 1px 2px rgba(0,0,0,0.9)', whiteSpace: 'nowrap', willChange: 'transform' }} />)}
      </div>
      <canvas ref={mapRef} width={116} height={116} aria-label="Map" style={{ position: 'absolute', left: left(12), top: top(10), width: 116, height: 116 }} />
      <div style={{ position: 'absolute', left: '50%', top: top(8), transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, padding: '2px 14px', borderRadius: 14, background: 'rgba(10,12,14,0.45)' }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.75)' }}>Wave</span>
          <span style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.1, color: '#FFFFFF', fontVariantNumeric: 'tabular-nums' }}>{H.wave || 0}</span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, color: H.ph === 0 ? '#9CF0B4' : '#FFD7C8' }}>{H.ph === 0 ? `Next wave in ${H.tl || 0}` : H.ph === 2 ? 'Overrun' : `${H.zl || 0} zombies left`}</span>
        {H.ph === 0 && H.st !== 2 ? <span style={{ maxWidth: land ? 360 : 250, marginTop: 3, padding: '3px 10px', textAlign: 'center', fontSize: 11.5, fontWeight: 600, lineHeight: 1.3, color: '#EFE8D2', background: 'rgba(12,11,10,0.5)', boxShadow: 'inset 2px 0 0 #E0A85A', textShadow: 'none' }}>{breakTip(H.wave)}</span> : null}
      </div>
      <div style={{ position: 'absolute', right: right(12), top: top(8), display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textShadow: '0 1px 3px rgba(0,0,0,0.9)', paddingTop: 1 }}>
          <span style={{ fontSize: 15, fontWeight: 900, color: '#FFFFFF', fontVariantNumeric: 'tabular-nums' }}>{fmt(H.pts || 0)}</span>
          <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.75)' }}>{H.kills === 1 ? '1 kill' : `${H.kills || 0} kills`}{mode && !mode.solo && H.rtt ? `, ${H.rtt} ms` : ''}</span>
          {netErr === 'lost' && <span style={{ fontSize: 11, fontWeight: 800, color: '#FFB86A' }}>Reconnecting</span>}
        </div>
        {mode && !mode.solo && <TopBtn icon="chat" label="Chat" onTap={() => setSheet('chat')} />}
        {canInvite && <TopBtn icon="invite" label="Invite friends" onTap={() => setSheet('invite')} />}
        <TopBtn icon="people" label="Players" onTap={() => setSheet('players')} />
        <TopBtn icon="pause" label="Menu" onTap={() => setSheet('pause')} />
      </div>
      <GFeed items={feedK} style={{ position: 'absolute', right: right(12), top: top(56), maxWidth: '40%' }} />
      <GChatFeed items={chatFeed} style={{ position: 'absolute', left: left(12), top: top(134), width: land ? 'min(30%, 260px)' : 'calc(100% - 24px)' }} />
      <GNotices items={notes} style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: top(land ? 58 : 110), width: 'min(52%, 420px)' }} />
      {banner && Date.now() - banner.at < 4200 && (
        <div key={banner.at} aria-live="polite" style={{ position: 'absolute', left: 0, right: 0, top: land ? '25%' : '27%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, pointerEvents: 'none', fontFamily: WFONT, animation: 'zgk-rib 4.2s ease-out forwards' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 46, height: 2, background: 'linear-gradient(90deg, rgba(224,168,90,0), #E0A85A)' }} />
            <span style={{ fontSize: banner.clear ? 30 : 40, fontWeight: 800, lineHeight: 1, letterSpacing: 1, color: banner.clear ? '#EFE8D2' : '#FFFFFF', textShadow: banner.clear ? '0 2px 10px rgba(0,0,0,0.85)' : '0 0 18px rgba(200,40,24,0.75), 0 2px 6px rgba(0,0,0,0.9)' }}>{banner.t}</span>
            <span style={{ width: 46, height: 2, background: 'linear-gradient(90deg, #E0A85A, rgba(224,168,90,0))' }} />
          </div>
          {!banner.clear && banner.d ? <span style={{ fontSize: 15, fontWeight: 700, color: '#E0A85A', textShadow: '0 1px 4px rgba(0,0,0,0.95)' }}>{`${banner.d} zombies are coming`}</span> : null}
          {banner.s ? <span style={{ maxWidth: '86%', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#EFE8D2', textShadow: '0 1px 4px rgba(0,0,0,0.95)' }}>{banner.s}</span> : null}
          {banner.clear ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 2 }}>
              {[`+${banner.pts} points`, banner.heal ? 'Some health back' : '', banner.back ? 'Downed friends are back up' : '', 'Grenades refill next wave'].filter(Boolean).map((x) => (
                <span key={x} style={{ padding: '3px 10px', fontSize: 12, fontWeight: 700, color: '#EFE8D2', background: 'rgba(16,14,12,0.62)', boxShadow: 'inset 0 0 0 1px rgba(224,168,90,0.45)', clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)' }}>{x}</span>
              ))}
            </div>
          ) : null}
        </div>
      )}
      <div style={{ position: 'absolute', left: '50%', bottom: bottom(12), transform: 'translateX(-50%)', width: land ? 'min(28%, 250px)' : '52%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        {H.st === 1 && <div style={{ fontSize: 13, fontWeight: 900, color: '#FF8A7A', textShadow: '0 1px 3px rgba(0,0,0,0.9)', textAlign: 'center' }}>{H.rev > 0 ? 'A friend is helping you up' : `You are down. Wait for a friend ${H.bleed}`}</div>}
        {H.st === 2 && <div style={{ fontSize: 13, fontWeight: 900, color: '#FFFFFF', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>You are back next wave</div>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
          <span style={{ fontSize: 13, fontWeight: 900, color: H.hp < 35 ? '#FF6A5A' : '#FFFFFF', textShadow: '0 1px 2px rgba(0,0,0,0.9)', fontVariantNumeric: 'tabular-nums', minWidth: 26, textAlign: 'right' }}>{Math.max(0, Math.round(H.st === 1 ? H.rev * 100 : H.hp))}</span>
          <div style={{ flex: 1, height: 8, display: 'flex', gap: 2 }}>
            {[0, 1, 2, 3].map((i) => { const v = clamp(((H.st === 1 ? H.rev * 100 : H.hp) - i * 25) / 25, 0, 1); return <div key={i} style={{ flex: 1, background: 'rgba(10,12,14,0.55)', borderRadius: 2, overflow: 'hidden', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.25)' }}><div style={{ width: `${v * 100}%`, height: '100%', background: H.st === 1 ? '#7BE05A' : H.hp < 35 ? '#E5484D' : '#F2F2EE', transition: 'width 0.15s' }} /></div>; })}
          </div>
          {H.pet && <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11.5, fontWeight: 800, color: '#F2D27A', textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}><Ico k="paw" size={14} color="#F2D27A" />{(DOGS.find((d) => d.key === H.pet) || DOGS[0]).name}</span>}
        </div>
      </div>
      {H.st === 0 && (
        <div style={{ position: 'absolute', inset: 0, opacity: see }}>
          <div onPointerDown={(e) => { e.stopPropagation(); swapGun(); }} role="button" aria-label="Switch weapon" style={{ position: 'absolute', right: right(16), bottom: bottom(px(222)), ...hx('wpn'), pointerEvents: 'auto', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', padding: '6px 10px', borderRadius: 12, background: 'rgba(10,12,14,0.42)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.3)', textShadow: '0 1px 2px rgba(0,0,0,0.8)', minWidth: 112 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 12.5, fontWeight: 900, color: '#FFFFFF' }}>{WN(H.w)}</span>
              <span style={{ fontSize: 20, fontWeight: 900, color: H.mag === 0 ? '#FF6A5A' : '#FFFFFF', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{H.rel > 0 ? '...' : H.mag}<span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}> / {H.magMax}</span></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
              <Ico k="swap" size={13} color="rgba(255,255,255,0.7)" />
              <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>{WN(H.slots ? H.slots[H.slot ? 0 : 1] : '')}</span>
            </div>
          </div>
          {TOUCHY && !hudEdit && <>
          <CBtn big size={CD.fire.size} icon="bullet" label="Shoot" active={!!G.current.fire} style={hs('fire')}
            onDown={() => { ZA.init(); G.current.fire = true; }} onMove={(dx, dy) => lookBy(dx, dy)} onUp={() => { G.current.fire = false; }} />
          <CBtn size={CD.ads.size} icon="scope" label={H.ads ? 'Stop aiming' : 'Aim down sights'} active={H.ads} style={hs('ads')} onMove={(dx, dy) => lookBy(dx, dy)}
            onDown={() => { if (opt.adsMode === 'hold') { const g = G.current; g.ads = true; ZA.synth('tap', { f: 700, vol: 0.3 }); syncHud(true); } }}
            onUp={() => { if (opt.adsMode === 'hold') { G.current.ads = false; syncHud(true); } }}
            onTap={() => { if (opt.adsMode === 'hold') return; const g = G.current; g.ads = !g.ads; ZA.synth('tap', { f: 700, vol: 0.3 }); syncHud(true); }} />
          <CBtn size={CD.rel.size} icon="mag" label="Reload" ring={H.rel} style={hs('rel')} onTap={() => startReload(G.current)} />
          <CBtn size={CD.mel.size} icon="knife" label="Melee" style={hs('mel')} onTap={melee} />
          <CBtn size={CD.nade.size} icon="grenade" label="Throw a grenade" badge={H.nades} disabled={!H.nades} active={H.aiming && G.current.thr && G.current.thr.k === 'grenade'} style={hs('nade')}
            onDown={() => throwStart('grenade')} onMove={(dx, dy) => lookBy(dx, dy)} onUp={(e) => throwEnd(overCancel(e))} />
          <CBtn size={CD.molo.size} icon="bottle" label="Throw a fire bottle" badge={H.molos} disabled={!H.molos} active={H.aiming && G.current.thr && G.current.thr.k === 'molotov'} style={hs('molo')}
            onDown={() => throwStart('molotov')} onMove={(dx, dy) => lookBy(dx, dy)} onUp={(e) => throwEnd(overCancel(e))} />
          <CBtn size={CD.jump.size} icon="jump" label="Jump" style={hs('jump')} onDown={() => { ZA.init(); G.current.jumpReq = true; }} />
          <CBtn size={CD.crouch.size} icon="crouch" label={H.cr ? 'Stand up' : 'Crouch or slide'} active={!!H.cr} style={hs('crouch')} onDown={() => { ZA.init(); G.current.crReq = true; }} />
          <CBtn size={CD.emote.size} icon="emote" label="Emotes" style={hs('emote')} onTap={() => setSheet('emote')} />
          <CBtn size={CD.fireL.size} icon="bullet" label="Shoot with left hand" active={!!G.current.fireL} style={hs('fireL')}
            onDown={() => { ZA.init(); G.current.fireL = true; }} onMove={(dx, dy) => lookBy(dx, dy)} onUp={() => { G.current.fireL = false; }} />
          </>}
          {H.near && <CBtn size={px(66)} icon="heart" tone="green" label="Hold to help up your friend" style={{ right: right(px(280)), bottom: bottom(px(110)) }} onDown={() => { G.current.revHold = true; ZA.call('cover', sexRef.current, { cd: 12 }); }} onUp={() => { G.current.revHold = false; }} sub="Hold" />}
          {H.aiming && <div ref={cancelRef} style={{ position: 'absolute', right: right(px(290)), top: top(90), width: 56, height: 56, borderRadius: 28, background: 'rgba(160,20,20,0.45)', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}><Ico k="close" size={22} /><span style={{ fontSize: 9.5, fontWeight: 800, color: '#FFFFFF' }}>Cancel</span></div>}
          {H.sprint && <div style={{ position: 'absolute', left: left(px(70)), bottom: bottom(px(186)), display: 'flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 12, background: 'rgba(10,12,14,0.45)' }}><Ico k="run" size={16} /><span style={{ fontSize: 11, fontWeight: 800, color: '#FFFFFF' }}>Running</span></div>}
        </div>
      )}
      {!TOUCHY && phase === 'play' && !locked && !G.current.lockFail && !sheet && H.st !== 2 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '16px 20px', borderRadius: 16, background: 'rgba(8,10,14,0.72)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12)' }}>
            <span style={{ fontSize: 17, fontWeight: 900, color: '#FFFFFF' }}>Click to play</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto auto auto auto', columnGap: 12, rowGap: 6, alignItems: 'center' }}>
              {[['W A S D', 'Move'], ['Mouse', 'Look'], ['Left click', 'Shoot'], ['Right click', 'Aim'], ['Shift', 'Run'], ['Space', 'Jump'], ['C', 'Crouch or slide'], ['R', 'Reload'], ['Q or wheel', 'Switch gun'], ['G', 'Grenade'], ['F', 'Fire bottle'], ['V', 'Knife'], ['E', 'Help up'], ['B', 'Emotes'], ['Esc', 'Free the mouse']].map(([k, v]) => (
                <React.Fragment key={k}>
                  <span style={{ justifySelf: 'end', padding: '2px 7px', borderRadius: 6, background: 'rgba(255,255,255,0.12)', boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.18)', fontSize: 11.5, fontWeight: 800, color: '#FFFFFF', whiteSpace: 'nowrap' }}>{k}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.78)', whiteSpace: 'nowrap' }}>{v}</span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}
      {hudEdit && (
        <div onPointerDown={(e) => { e.stopPropagation(); setHudSel(null); }} style={{ position: 'absolute', inset: 0, zIndex: 70, background: 'rgba(6,8,12,0.5)', touchAction: 'none', pointerEvents: 'auto' }}>
          <div style={{ position: 'absolute', right: right(16), bottom: bottom(px(222)), ...hx('wpn'), width: px(132), height: px(46), borderRadius: 12, background: 'rgba(10,12,14,0.42)', boxShadow: hudSel === 'wpn' ? '0 0 0 2px #FFC23D' : 'inset 0 0 0 1px rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'none', cursor: 'grab', pointerEvents: 'auto' }} onPointerDown={(e) => hudDrag(e, 'wpn')}>
            <span style={{ fontSize: 12.5, fontWeight: 900, color: '#FFFFFF' }}>Rifle 30 / 30</span>
          </div>
          {CTL.map((c) => (
            <div key={c.id} onPointerDownCapture={(e) => hudDrag(e, c.id)} style={{ position: 'absolute', width: c.size, height: c.size, ...hs(c.id), borderRadius: '50%', boxShadow: hudSel === c.id ? '0 0 0 3px #FFC23D' : 'none', touchAction: 'none', cursor: 'grab', pointerEvents: 'auto' }}>
              <CBtn size={c.size} big={c.big} icon={c.icon} label={c.label} style={{ position: 'relative', left: 0, top: 0, right: 'auto', bottom: 'auto', pointerEvents: 'none' }} />
            </div>
          ))}
          <div onPointerDown={(e) => e.stopPropagation()} style={{ position: 'absolute', left: '50%', top: top(10), transform: 'translateX(-50%)', width: land ? 420 : 300, maxWidth: '92%', display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 12px', borderRadius: 14, background: 'rgba(14,16,20,0.94)', boxShadow: '0 6px 20px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.1)', pointerEvents: 'auto' }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#FFFFFF', textAlign: 'center' }}>{hudSel ? 'Drag to move, or change the size below' : 'Drag any button to move it'}</span>
            {hudSel && hudSel !== 'wpn' ? (
              <>
                <GSetRow label="Size"><GSetSlider value={((hudEdit[hudSel] || {}).s) || 1} min={0.6} max={1.6} step={0.05} label="Size" fmt={(x) => `${Math.round(x * 100)}%`} onChange={(x) => hudSet(hudSel, 's', x)} /></GSetRow>
                <GSetRow label="See through"><GSetSlider value={(hudEdit[hudSel] || {}).o == null ? 1 : hudEdit[hudSel].o} min={0.3} max={1} step={0.05} label="See through" fmt={(x) => `${Math.round(x * 100)}%`} onChange={(x) => hudSet(hudSel, 'o', x)} /></GSetRow>
              </>
            ) : null}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => { setHudEdit({}); setHudSel(null); }} style={{ flex: 1, height: 36, border: 'none', borderRadius: 10, background: 'rgba(255,255,255,0.1)', color: '#FFFFFF', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Reset</button>
              <button type="button" onClick={() => { setHudEdit(null); setHudSel(null); }} style={{ flex: 1, height: 36, border: 'none', borderRadius: 10, background: 'rgba(255,255,255,0.1)', color: '#FFFFFF', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
              <button type="button" onClick={() => { saveHud(hudEdit); setHudEdit(null); setHudSel(null); }} style={{ flex: 1, height: 36, border: 'none', borderRadius: 10, background: '#FFC23D', color: '#141414', fontSize: 13, fontWeight: 900, cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}
      {TOUCHY && H.st === 0 && <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: see * 0.9 }}><GJoy flat view={J.view} knobRef={J.knob} idle={{ x: land ? 110 : 96, y: GS.H - (land ? 100 : 124) }} R={J.R} /></div>}
    </div>
  );

  const g0 = G.current;
  const players = sheet === 'players' && g0.snaps.length ? [...g0.snaps[g0.snaps.length - 1].ps.values()].sort((p, q) => q.pts - p.pts) : [];
  const sheets = (
    <>
      {sheet === 'gfx' && (
        <div onPointerDown={(e) => e.stopPropagation()} onPointerMove={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} style={{ position: 'absolute', inset: 0, zIndex: 60, background: 'rgba(4,6,10,0.62)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 10, pointerEvents: 'auto' }}>
          <GSettings onClose={closeSettings} first="graphics" tabs={setTabs} preview={['bullets', 'grenade']} controlsExtra={(
            <>
              <GSetRow label="Look speed"><GSetSlider value={sens} min={0.4} max={2.2} step={0.05} label="Look speed" fmt={(x) => x.toFixed(2)} onChange={(x) => { setSens(x); setPref(PREF.sens, x); }} /></GSetRow>
              <GSetRow label="Aim look speed" sub="While aiming down sights"><GSetSlider value={opt.adsK} min={0.4} max={1.4} step={0.05} label="Aim look speed" fmt={(x) => x.toFixed(2)} onChange={(x) => setOptK('adsK', x)} /></GSetRow>
              <GSetRow label="Aim assist" sub="Helps your first shot land"><GSetToggle on={!!opt.assist} label="Aim assist" onToggle={(n) => setOptK('assist', n ? 1 : 0)} /></GSetRow>
              <GSetRow label="Aim button" sub="Tap to switch, or hold while you aim"><GSeg value={opt.adsMode} items={[['tap', 'Tap'], ['hold', 'Hold']]} onPick={(v) => setOptK('adsMode', v)} label="Aim button" /></GSetRow>
              <GSetRow label="Always sprint" sub="Push the stick forward to run"><GSetToggle on={!!opt.spr} label="Always sprint" onToggle={(n) => setOptK('spr', n ? 1 : 0)} /></GSetRow>
              {TOUCHY && <GSetRow label="Custom HUD" sub="Move and resize every button"><button type="button" onClick={() => { closeSettings(); setHudEdit({ ...hudL }); setHudSel(null); }} style={{ height: 32, padding: '0 14px', border: 'none', borderRadius: 9, background: '#FFC23D', color: '#141414', fontSize: 12.5, fontWeight: 900, cursor: 'pointer' }}>Edit</button></GSetRow>}
              <GSetRow label="Vibration"><GSetToggle on={!!opt.vib} label="Vibration" onToggle={(n) => setOptK('vib', n ? 1 : 0)} /></GSetRow>
            </>
          )} />
        </div>
      )}
      {sheet === 'pause' && (
        <GLobbySheet GS={GS} title={mode && mode.solo ? 'Paused' : 'Menu'} onClose={() => setSheet(null)} width={380}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {mode && !mode.solo && <div style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(239,232,210,0.75)' }}>The town keeps going while this menu is open.</div>}
            <GPill text="Back to the fight" color="green" wide onPress={() => setSheet(null)} />
            {canInvite && <GPill text="Invite friends" icon="people" color="gold" wide small onPress={() => setSheet('invite')} />}
            <GPill text="Settings" color="white" wide small onPress={() => setSheet('gfx')} />
            <GPill text="Leave the town" color="red" wide small onPress={quit} />
          </div>
        </GLobbySheet>
      )}
      {sheet === 'room' && (
        <GLobbySheet GS={GS} title="Create room" onClose={() => setSheet(null)} width={400}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12.5, fontWeight: 800, color: 'rgba(239,232,210,0.75)', width: 52 }}>Server</span>
              <div style={{ flex: 1, minWidth: 0 }}><GSeg value={regNow} items={REGION_KEYS.map((k) => [k, REGION_NAMES[k]])} onPick={(k) => setReg(k)} label="Server" /></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12.5, fontWeight: 800, color: 'rgba(239,232,210,0.75)', width: 52 }}>Bots</span>
              <div style={{ flex: 1, minWidth: 0 }}><GSeg value={bots ? 'on' : 'off'} items={[['on', 'With bots'], ['off', 'No bots']]} onPick={(v) => { setBots(v === 'on'); setPref(PREF.bots, v === 'on' ? '1' : '0'); }} label="Bots" /></div>
            </div>
            <GPill text="Open room" color="gold" wide onPress={() => createRoom('open')} />
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(239,232,210,0.65)', marginTop: -4 }}>Shows in Open rooms. Anyone can join.</div>
            <GPill text="Friends only" color="white" wide onPress={() => createRoom('friends')} />
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(239,232,210,0.65)', marginTop: -4 }}>Only friends you invite can join.</div>
          </div>
        </GLobbySheet>
      )}
      {sheet === 'invite' && (
        <GLobbySheet GS={GS} title="Invite friends" onClose={() => setSheet(null)} width={420}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(239,232,210,0.75)', lineHeight: 1.4 }}>
              {phase === 'play' && mode && !mode.solo ? 'Friends join your server. Each one takes a bot spot right away.' : phase === 'play' ? 'Your game moves to a server so friends can join. Bots fill the empty spots until they arrive.' : 'Tap Invite next to a friend. They join you here before the game starts.'}
            </div>
            {friends.length === 0 && <div style={{ fontSize: 13, fontWeight: 800, color: 'rgba(239,232,210,0.8)', padding: '8px 0' }}>Chat with a friend first, then they show up here.</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 236, overflowY: 'auto', touchAction: 'pan-y', overscrollBehavior: 'contain' }}>
              {[...friends].sort((a, b) => (online && online.has && online.has(b.id) ? 1 : 0) - (online && online.has && online.has(a.id) ? 1 : 0)).map((fr) => {
                const sent = invited.has(fr.id);
                const on = !!(online && online.has && online.has(fr.id));
                return (
                  <div key={fr.id} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 52, padding: '0 6px 0 10px', borderRadius: 10, color: '#EFE8D2', background: 'rgba(239,232,210,0.05)' }}>
                    <span style={{ position: 'relative', flexShrink: 0 }}>
                      <Avatar emoji={fr.avatar} name={fr.name} size={34} />
                      {on ? <span style={{ position: 'absolute', right: -1, bottom: -1, width: 10, height: 10, borderRadius: 5, background: '#5BD37A', boxShadow: '0 0 0 2px #1B1A17' }} /> : null}
                    </span>
                    <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 14, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fr.name}</span>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: on ? '#8FDCA2' : 'rgba(239,232,210,0.5)' }}>{on ? 'Online' : 'Offline'}</span>
                    </span>
                    <button type="button" className="zgk-btn" disabled={sent} aria-label={sent ? `Invited ${fr.name}` : `Invite ${fr.name}`}
                      onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); if (sent) return; kitTap(); inviteNow(fr); }}
                      style={{ flexShrink: 0, minWidth: 92, height: 38, padding: '0 14px', border: 'none', cursor: sent ? 'default' : 'pointer', fontFamily: WFONT, fontSize: 16, fontWeight: 800, letterSpacing: 0.3, color: sent ? 'rgba(239,232,210,0.7)' : '#1B140C', background: sent ? 'rgba(239,232,210,0.1)' : 'linear-gradient(180deg, #F1C27A, #D99A48)', clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)' }}>
                      {sent ? 'Invited' : 'Invite'}
                    </button>
                  </div>
                );
              })}
            </div>
            <GPill text="Done" color="white" wide onPress={() => setSheet(null)} />
          </div>
        </GLobbySheet>
      )}
      {sheet === 'players' && (
        <GLobbySheet GS={GS} title={`Survivors ${players.length}`} onClose={() => setSheet(null)} width={420}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {players.map((p, i) => {
              const r = g0.roster.get(p.id) || {};
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, height: 36, padding: '0 8px', borderRadius: 8, background: p.id === myId ? 'rgba(224,168,90,0.14)' : 'rgba(239,232,210,0.05)' }}>
                  <span style={{ width: 20, fontSize: 12, fontWeight: 900, color: 'rgba(239,232,210,0.6)', fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>
                  <img src={`/dead/p_${charOf(r.sv || 'jay', r.col | 0).k}.webp`} alt="" draggable={false} style={{ width: 26, height: 26, borderRadius: 13, display: 'block', background: 'rgba(239,232,210,0.08)' }} />
                  <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.id === myId ? 'You' : r.n || 'Friend'}{r.bot ? <span style={{ fontSize: 11, color: 'rgba(239,232,210,0.55)' }}>  Bot</span> : r.st === 1 ? <span style={{ fontSize: 11, color: '#F2C230' }}>  Reconnecting</span> : r.st === 2 ? <span style={{ fontSize: 11, color: 'rgba(239,232,210,0.55)' }}>  Left</span> : null}</span>
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: p.st === 0 ? '#9CD86A' : p.st === 1 ? '#FF8A7A' : 'rgba(239,232,210,0.5)' }}>{p.st === 0 ? 'Fighting' : p.st === 1 ? 'Down' : 'Out'}</span>
                  <span style={{ width: 70, textAlign: 'right', fontSize: 12.5, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{fmt(p.pts)}</span>
                </div>
              );
            })}
          </div>
        </GLobbySheet>
      )}
      {sheet === 'chat' && (
        <Sheet title="Talk to the town" onClose={() => setSheet(null)}>
          {chatLog.length > 0 && <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '12px 0 4px', maxHeight: 140, overflowY: 'auto' }}>{chatLog.slice(-8).map((m0, i) => <div key={i} style={{ fontSize: 13.5, lineHeight: 1.4 }}><span style={{ fontWeight: 800, color: m0.who === 'You' ? '#E0A85A' : '#9CD4FF' }}>{m0.who}</span> <span style={{ color: 'rgba(255,255,255,0.85)' }}>{m0.t}</span></div>)}</div>}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>{QUICK_LINES.map((p) => <button key={p} type="button" className="zgk-btn" onClick={() => sendChat(p)} style={{ height: 38, padding: '0 14px', borderRadius: 19, border: 'none', background: 'rgba(255,255,255,0.1)', color: '#FFFFFF', fontSize: 13.5, fontWeight: 800, fontFamily: FONT, cursor: 'pointer' }}>{p}</button>)}</div>
          <form onSubmit={(e) => { e.preventDefault(); sendChat(chatText); }} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <input value={chatText} onChange={(e) => setChatText(e.target.value)} maxLength={90} placeholder="Write a message" aria-label="Message" style={{ flex: 1, minWidth: 0, height: 42, borderRadius: 21, border: 'none', padding: '0 16px', background: 'rgba(255,255,255,0.1)', color: '#FFFFFF', fontSize: 15, fontFamily: FONT, outline: 'none' }} />
            <GPill text="Send" color="green" small onPress={() => sendChat(chatText)} disabled={!chatText.trim()} />
          </form>
        </Sheet>
      )}
      {sheet === 'emote' && phase === 'play' && <EmoteWheel icons={emoIcons} onPick={doEmote} onClose={() => setSheet(null)} />}
      {result && phase === 'play' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,6,6,0.6)', padding: 16 }}>
          <GPanel style={{ width: '100%', maxWidth: 380, padding: '16px 16px 14px', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'stretch', animation: 'zgk-pop 0.3s ease-out' }}>
            <GTitle text={`Overrun at wave ${result.wave}`} size={26} color="#E0A85A" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1, borderRadius: 8, overflow: 'hidden' }}>
              {[['Kills', result.kills], ['Points', fmt(result.pts)], ['Best wave', result.best]].map(([a0, v]) => <div key={a0} style={{ padding: '9px 4px 8px', background: 'rgba(239,232,210,0.07)', textAlign: 'center' }}><div style={{ fontSize: 19, fontWeight: 900, color: '#EFE8D2', fontVariantNumeric: 'tabular-nums' }}>{v}</div><div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(239,232,210,0.6)', marginTop: 2 }}>{a0}</div></div>)}
            </div>
            {mode && !mode.solo ? <div style={{ fontSize: 12.5, fontWeight: 800, color: 'rgba(239,232,210,0.8)', textAlign: 'center' }}>A new game starts in a few seconds</div> : null}
            <div style={{ display: 'flex', gap: 8 }}>
              <GPill text="Leave" color="white" small wide style={{ flex: 1 }} onPress={quit} />
              {mode && mode.solo && <GPill text="Play again" color="gold" small wide style={{ flex: 1 }} onPress={() => start({ solo: true })} />}
            </div>
          </GPanel>
        </div>
      )}
    </>
  );

  return (
    <Portal><GSkin k="zombie">
      <div ref={GS.rootRef} style={{ position: 'fixed', left: 0, right: 0, top: 'var(--zvp-top, 0px)', height: 'calc(var(--zvp-h, 100%) + var(--zgx, 0px))', zIndex: 90, background: '#101214', overflow: 'hidden', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', fontFamily: FONT, color: '#EFE8D2' }}>
        <div ref={wrapRef} style={GS.wrapStyle} onPointerDown={lookDown} onPointerMove={(e) => { if (e.pointerType === 'mouse') lookMove(e); }} onPointerUp={(e) => { if (e.pointerType === 'mouse') lookUp(e); }} onPointerCancel={(e) => { if (e.pointerType === 'mouse') lookUp(e); }} onLostPointerCapture={(e) => { if (e.pointerType === 'mouse') lookUp(e); }} onContextMenu={(e) => e.preventDefault()}>
          <canvas key={cvKey} ref={cvRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
          {phase === 'load' && <ZBoot GS={GS} boot={boot} onRetry={() => setBootTry((n) => n + 1)} onClose={onClose} />}
          {netErr === 'gl' && phase === 'menu' && <div style={{ position: 'absolute', left: 0, right: 0, top: '40%', textAlign: 'center', fontSize: 14, fontWeight: 800 }}>This phone could not start 3D graphics.</div>}
          {menu}
          {phase === 'maker' && (MakerC ? <MakerC GS={GS} tier={tier} onClose={closeMaker} /> : <div role="status" style={{ position: 'absolute', inset: 0, zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0E0D0B', fontSize: 14, fontWeight: 800 }}>{makerErr ? <GPill text="Back" color="white" small onPress={closeMaker} /> : 'Opening the map maker'}</div>)}
          {play}
          {fix > 0 && phase === 'play' && (
            <div role="status" style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,9,8,0.82)', fontSize: 14, fontWeight: 800, color: '#EFE8D2' }}>Loading the town</div>
          )}
          {netErr === 'full' && phase === 'play' && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 31, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,8,6,0.6)' }}>
              <GPanel style={{ padding: 16, maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 15, fontWeight: 900 }}>This server is full</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(239,232,210,0.8)' }}>Pick another region or try again in a moment.</div>
                <GPill text="Back" color="white" small wide onPress={quit} />
              </GPanel>
            </div>
          )}
          {sheets}
        </div>
      </div>
    </GSkin></Portal>
  );
}
