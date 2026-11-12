import { hexRgb } from './race3d.js';
import { fbm, mixc, smooth, hash2 } from './racetrack.js';
import { drinkOf } from './raceengine.js';

const C = (h) => hexRgb(h);
const lin = (h) => C(h).map((v) => v ** 2.2);
const srgb = (h) => C(h);
const rotT = (yaw, x, y, z) => { const cy = Math.cos(yaw), sy = Math.sin(yaw); return new Float32Array([cy, 0, -sy, 0, 0, 1, 0, 0, sy, 0, cy, 0, x, y, z, 1]); };
const vary = (c, p) => { const v = 0.94 + hash2(p[0] * 0.1, p[2] * 0.1) * 0.1; return [c[0] * v, c[1] * v, c[2] * v]; };

function sunDir(az, elDeg) { const el = (elDeg * Math.PI) / 180; return [Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)]; }

const coast = {
  key: 'coast', name: 'Palm coast', blurb: 'Beach road, fishing boats and a lighthouse', seed: 11, w: 7, laps: 3,
  pts: [[0, 0, 0], [120, 0, 0], [230, 6, 1], [300, 70, 3], [310, 160, 9], [262, 236, 15], [170, 262, 13], [92, 222, 8], [62, 150, 4], [0, 128, 2], [-90, 160, 1], [-190, 176, 1], [-262, 120, 2], [-280, 30, 5], [-236, -46, 6], [-150, -60, 3], [-70, -28, 1]],
  zones: { town: [[0.93, 1], [0, 0.1]], beach: [[0.5, 0.74]], tea: [[0.22, 0.42]] },
  terrain: { amp: 46, sea: 'beach' },
  water: { y: -1.1, a: '#2B86BE', b: '#3AA3CF', mat: 0.67 },
  barrier: 'armco',
  road: { shoulder: (p, sg) => (p.zone.beach && sg < 0 ? '#E3C88E' : p.zone.town ? '#9C968B' : '#8E9A5A') },
  env(T) {
    const h = T.at(T.total * 0.565).heading - 1.12;
    return { sunDir: sunDir(h, 16), sunCol: [3.1, 2.35, 1.6], skyCol: [0.34, 0.43, 0.62], gndCol: [0.26, 0.23, 0.17], fogCol: lin('#C9D7E4'), fogSun: srgb('#FFBE82'), fogSunLin: lin('#FFBE82'), horizon: srgb('#C9D7E4'), zenith: srgb('#2A63B0'), fogDen: 0.0013, exposure: 0.95, shadowRange: 58 };
  },
  groundColor(T) {
    const grassA = C('#649A41'), grassB = C('#4A8136'), dry = C('#97A255'), sand = C('#E8CF95'), wet = C('#C9AF78'), rock = C('#8D8A7C');
    return (p, slope) => {
      if (p[1] < -0.6) return mixc(wet, sand, smooth(-3, -0.6, p[1]));
      if (p[1] < 1.2) { const n = T.near(p[0], p[2], 2); const tp = n.i >= 0 ? T.S[n.i] : null; if (tp && tp.zone.beach && n.d > T.w + 4 && T.side(p[0], p[2], n.i) < 0) return mixc(sand, C('#F0DAA6'), hash2(p[0], p[2]) * 0.6); }
      let c = mixc(grassA, grassB, smooth(0.3, 0.7, fbm(p[0] * 0.012 + 7, p[2] * 0.012, 4)));
      c = mixc(c, dry, smooth(14, 34, p[1]) * 0.7);
      c = mixc(c, rock, smooth(0.55, 0.85, slope));
      return vary(c, p);
    };
  },
  scenery(K, X) {
    const { T, w, R, free, place, gy, pb } = K;
    const { S, N } = T;
    for (let i = 0; i < N; i++) {
      const p = S[i];
      if (p.zone.town && i % 12 === 0) for (const sgn of [-1, 1]) K.lamp(p.x + p.rx * sgn * (w + 4.5), p.z + p.rz * sgn * (w + 4.5), Math.atan2(-p.rx * sgn, -p.rz * sgn));
      if (p.zone.town && i % 5 === 0) for (const sgn of [-1, 1]) {
        const off = w + 15 + R() * 10 + (i % 10 === 0 ? 14 : 0);
        const x = p.x + p.rx * sgn * off, z = p.z + p.rz * sgn * off;
        if (free(x, z, 6)) { K.house(x, z, p.heading + (sgn > 0 ? -Math.PI / 2 : Math.PI / 2), 1); place(x, z, 6); }
      }
      if (p.zone.beach && i % 6 === 0) for (const sgn of [-1, 1]) {
        const off = w + 9 + R() * 9 + (sgn < 0 ? 0 : 6);
        const x = p.x + p.rx * sgn * off, z = p.z + p.rz * sgn * off;
        if (free(x, z, 2)) { K.palm(x, z, 0.9 + R() * 0.35, R() * Math.PI * 2); place(x, z, 2); }
      }
      if (p.zone.tea && i % 4 === 0) for (const sgn of [-1, 1]) for (let r = 0; r < 4; r++) K.teaRow(p.x + p.rx * sgn * (w + 11 + r * 2.6), p.z + p.rz * sgn * (w + 11 + r * 2.6), p.heading + Math.PI / 2, 3.2);
    }
    K.grandstand(30, 1, 44);
    K.grandstand(-40, -1, 30);
    K.billboard(...(() => { const p = T.at(70, w + 13); return [p.x, p.z, p.heading - Math.PI / 2]; })(), ['#1D7BF0', '#FFC23D', '#F4F1EA']);
    for (const s0 of [120, 160]) { const p = T.at(s0, -(w + 11)); K.flag(p.x, p.z, R() > 0.5 ? '#E5484D' : '#FFC23D'); }
    const { minX: bx0, maxX: bx1, minZ: bz0, maxZ: bz1 } = T.bounds;
    for (let k = 0; k < 460; k++) {
      const x = bx0 - 180 + R() * (bx1 - bx0 + 360), z = bz0 - 180 + R() * (bz1 - bz0 + 360);
      const y = gy(x, z);
      if (y < 0.4 || !free(x, z, 2.5)) continue;
      const n = T.near(x, z, 2);
      if (n.i >= 0 && T.S[n.i].zone.tea && n.d < 50) continue;
      if (R() < 0.18) K.bush(x, z, 0.8 + R() * 0.6); else K.tree(x, z, 0.75 + R() * 0.6);
      place(x, z, 2.5);
    }
    for (let i = 0; i < N; i += 55) { const p = S[i]; if (!p.zone.beach) continue; const off = w + 70 + R() * 70; K.boat(p.x - p.rx * off, p.z - p.rz * off, p.heading + R() * 0.8, X.WY); }
    {
      const p = T.at(T.total * 0.66, 0);
      const lx = p.x - Math.cos(p.heading) * (w + 24), lz = p.z + Math.sin(p.heading) * (w + 24);
      const ly = gy(lx, lz);
      pb.cyl(lx, ly - 0.5, lz, 3.4, 1.4, 12, '#9AA0A8', 0);
      for (let k = 0; k < 6; k++) pb.cyl(lx, ly + 0.9 + k * 3.2, lz, 2.2 - k * 0.12, 3.2, 12, k % 2 ? '#E5484D' : '#F6F4EE', 0.1, { r2: 2.2 - (k + 1) * 0.12 });
      const ty = ly + 0.9 + 6 * 3.2;
      pb.cyl(lx, ty, lz, 2.0, 0.3, 12, '#2A2C31', 0.2);
      pb.cyl(lx, ty + 0.3, lz, 1.3, 2.0, 10, '#FFF3C2', 1);
      pb.cyl(lx, ty + 2.3, lz, 1.55, 1.4, 10, '#2A2C31', 0.3, { r2: 0.1 });
      place(lx, lz, 5);
    }
    for (let i = 0; i < N; i += 9) {
      const p = S[i];
      if (!p.zone.beach || R() > 0.45) continue;
      const off = w + 14 + R() * 10;
      const x = p.x - p.rx * off, z = p.z - p.rz * off, y = gy(x, z);
      if (y < -0.4 || !free(x, z, 1.5)) continue;
      const uc = ['#E5484D', '#1D7BF0', '#FFC23D', '#3FC67E'][Math.floor(R() * 4)];
      pb.cyl(x, y, z, 0.05, 2.4, 5, '#EDEDED', 0.2);
      pb.cyl(x, y + 2.1, z, 1.5, 0.55, 8, uc, 0.1, { r2: 0.05 });
      place(x, z, 1.5);
    }
  },
};

const hills = {
  key: 'hills', name: 'Tea hills', blurb: 'Misty climbs through tea estates and under an old rail bridge', seed: 23, w: 7, laps: 3,
  pts: [[0, 0, 0], [110, 0, 2], [195, 28, 8], [240, 100, 16], [220, 185, 24], [155, 228, 30], [80, 255, 34], [10, 300, 38], [-75, 295, 40], [-140, 245, 38], [-160, 175, 32], [-128, 110, 24], [-150, 45, 16], [-205, -20, 10], [-185, -90, 6], [-110, -100, 3], [-50, -55, 1]],
  zones: { estate: [[0.12, 0.5], [0.62, 0.8]], village: [[0.94, 1], [0, 0.06]], factory: [[0.53, 0.6]] },
  bank: 7,
  terrain: { amp: 82, freq: 0.0048, base: 0.38, detail: 6, blend: 42, rise: [380, 0.16] },
  barrier: 'armco', gantry: '#2E8B57',
  road: { a: '#565B62', b: '#5D626A', shoulder: (p) => (p.zone.village ? '#9C968B' : '#7F8862') },
  ring: { near: ['#4E7A5C', '#557F60'], far: ['#7F97AE', '#889FB5'], scale: 1.5 },
  env(T) {
    const h = T.at(T.total * 0.3).heading + 0.8;
    return { sunDir: sunDir(h, 32), sunCol: [2.6, 2.45, 2.2], skyCol: [0.38, 0.46, 0.6], gndCol: [0.22, 0.24, 0.18], fogCol: lin('#C3CED8'), fogSun: srgb('#F6E7CF'), fogSunLin: lin('#F6E7CF'), horizon: srgb('#CBD6E0'), zenith: srgb('#4C7DB8'), fogDen: 0.0021, exposure: 0.95, shadowRange: 58, clouds: 1.25, cloud: srgb('#F4F6F8') };
  },
  groundColor(T) {
    const tea = C('#4F8F3B'), tea2 = C('#3F7F33'), soil = C('#7A6A52'), grass = C('#6C9A46'), rock = C('#7D7F78'), mist = C('#86A07A');
    return (p, slope) => {
      const n = T.near(p[0], p[2], 2);
      const near = n.i >= 0 ? T.S[n.i] : null;
      let c = mixc(grass, tea, smooth(0.35, 0.6, fbm(p[0] * 0.02 + 3, p[2] * 0.02, 3)));
      if (near && near.zone.estate && n.d < 120) c = (Math.floor((p[1] + 400) / 2.2) % 2) ? tea : tea2;
      if (n.d < T.w + 4) c = mixc(soil, c, smooth(T.w + 2.6, T.w + 4, n.d));
      c = mixc(c, mist, smooth(40, 110, p[1]) * 0.4);
      c = mixc(c, rock, smooth(0.62, 0.9, slope));
      return vary(c, p);
    };
  },
  scenery(K) {
    const { T, w, R, free, place, gy, pb } = K;
    const { S, N } = T;
    K.hedgeRows('estate', [12, 14.4, 16.8, 19.2, 21.6, 24, 26.4, 28.8]);
    for (let i = 0; i < N; i += 3) {
      const p = S[i];
      if (p.zone.village && i % 15 === 0) for (const sgn of [-1, 1]) {
        const off = w + 15 + R() * 8;
        const x = p.x + p.rx * sgn * off, z = p.z + p.rz * sgn * off;
        if (free(x, z, 6)) { K.house(x, z, p.heading + (sgn > 0 ? -Math.PI / 2 : Math.PI / 2), 1, ['#F4F1EA', '#E9D9B8', '#B9D6E8', '#F2C9A0']); place(x, z, 6); }
      }
      if (p.zone.village && i % 12 === 0) for (const sgn of [-1, 1]) K.lamp(p.x + p.rx * sgn * (w + 4.5), p.z + p.rz * sgn * (w + 4.5), Math.atan2(-p.rx * sgn, -p.rz * sgn));
    }
    {
      const s0 = T.total * 0.565;
      const p = T.at(s0, w + 30);
      const yaw = p.heading;
      const y = gy(p.x, p.z) - 0.4;
      pb.setT(rotT(yaw, p.x, y, p.z));
      pb.box(0, 0, 0, 14, 12, 52, '#F1EEE6', 0.05);
      for (let f = 0; f < 3; f++) for (let k = 0; k < 12; k++) for (const sx of [-7.03, 7.03]) {
        const z0 = -24 + k * 4.1, yy = 1.6 + f * 3.6;
        if (sx > 0) pb.quad([sx, yy, z0], [sx, yy, z0 + 2.2], [sx, yy + 2.2, z0 + 2.2], [sx, yy + 2.2, z0], '#2F4A5C', 0.66); else pb.quad([sx, yy, z0 + 2.2], [sx, yy, z0], [sx, yy + 2.2, z0], [sx, yy + 2.2, z0 + 2.2], '#2F4A5C', 0.66);
      }
      pb.quad([-7.6, 12, -26.5], [0, 15.5, -26.5], [0, 15.5, 26.5], [-7.6, 12, 26.5], '#3E7D5A', 0.15);
      pb.quad([0, 15.5, -26.5], [7.6, 12, -26.5], [7.6, 12, 26.5], [0, 15.5, 26.5], '#3E7D5A', 0.15);
      pb.tri([-7.6, 12, 26.5], [0, 15.5, 26.5], [7.6, 12, 26.5], '#F1EEE6', 0.05);
      pb.tri([7.6, 12, -26.5], [0, 15.5, -26.5], [-7.6, 12, -26.5], '#F1EEE6', 0.05);
      pb.cyl(4, 12, 18, 0.9, 7, 8, '#B9A68C', 0.05);
      pb.setT(null);
      place(p.x, p.z, 30);
    }
    {
      const s0 = T.total * 0.86;
      const p = T.at(s0, 0);
      const yaw = p.heading + Math.PI / 2;
      const ca = Math.sin(yaw), sa = Math.cos(yaw);
      const deck = p.y + 13;
      const span = 15, half = 6;
      for (let k = -half; k <= half; k++) {
        const off = k * span + (k > 0 ? span * 0.5 : k < 0 ? -span * 0.5 : 0);
        if (k === 0) continue;
        const x = p.x + ca * off, z = p.z + sa * off;
        const gyv = gy(x, z) - 1;
        pb.setT(rotT(yaw, x, 0, z));
        pb.box(0, gyv, 0, 3.4, deck - gyv, 2.4, '#8C7D6B', 0.03, { top: '#7D705F' });
        pb.setT(null);
      }
      pb.setT(rotT(yaw, p.x, 0, p.z));
      const L = half * span + span * 0.5 + 2;
      pb.box(0, deck, 0, 3.6, 2.0, L * 2, '#8F806D', 0.03);
      pb.box(1.65, deck + 2, 0, 0.3, 0.9, L * 2, '#7C6F5E', 0.03);
      pb.box(-1.65, deck + 2, 0, 0.3, 0.9, L * 2, '#7C6F5E', 0.03);
      for (const sx of [-0.7, 0.7]) pb.box(sx, deck + 2, 0, 0.12, 0.14, L * 2, '#5A5550', 0.4);
      const arch = (c0, c1) => {
        const segs = 12, r = (c1 - c0) / 2, mid = (c0 + c1) / 2;
        const rise = Math.min(r * 0.7, deck - p.y - 7.5);
        for (let j = 0; j < segs; j++) {
          const t0 = Math.PI * (j / segs), t1 = Math.PI * ((j + 1) / segs);
          const z0 = mid - Math.cos(t0) * r, z1 = mid - Math.cos(t1) * r, y0 = deck - Math.sin(t0) * rise - 0.2, y1 = deck - Math.sin(t1) * rise - 0.2;
          pb.quad([1.8, y0, z0], [1.8, y1, z1], [1.8, deck, z1], [1.8, deck, z0], '#8F806D', 0.03);
          pb.quad([-1.8, y1, z1], [-1.8, y0, z0], [-1.8, deck, z0], [-1.8, deck, z1], '#8F806D', 0.03);
          pb.quad([1.8, y1, z1], [1.8, y0, z0], [-1.8, y0, z0], [-1.8, y1, z1], '#76695A', 0.02);
        }
      };
      const piers = [];
      for (let k = -half; k <= half; k++) { if (k === 0) continue; piers.push(k * span + (k > 0 ? span * 0.5 : -span * 0.5)); }
      piers.sort((a, b) => a - b);
      for (let k = 0; k < piers.length - 1; k++) arch(piers[k] + 1.2, piers[k + 1] - 1.2);
      pb.setT(null);
      for (let k = -half; k <= half; k++) { const off = k * span; place(p.x + ca * off, p.z + sa * off, 4); }
    }
    const { minX: bx0, maxX: bx1, minZ: bz0, maxZ: bz1 } = T.bounds;
    for (let k = 0; k < 520; k++) {
      const x = bx0 - 200 + R() * (bx1 - bx0 + 400), z = bz0 - 200 + R() * (bz1 - bz0 + 400);
      if (!free(x, z, 2.5)) continue;
      const n = T.near(x, z, 2);
      if (n.i >= 0 && T.S[n.i].zone.estate && n.d < 34) continue;
      const r = R();
      if (r < 0.42) K.euca(x, z, 0.8 + R() * 0.5); else if (r < 0.75) K.pine(x, z, 0.8 + R() * 0.6); else K.tree(x, z, 0.7 + R() * 0.5, ['#3F7F3A', '#4A8A40', '#3A7334']);
      place(x, z, 2.5);
    }
    for (let k = 0; k < 40; k++) { const p = T.at(R() * T.total, (R() > 0.5 ? 1 : -1) * (w + 20 + R() * 40)); if (free(p.x, p.z, 3)) { K.rock(p.x, p.z, 0.8 + R() * 1.4, '#7F8079'); place(p.x, p.z, 3); } }
    K.grandstand(34, 1, 36);
    for (const s0 of [90, 140]) { const p = T.at(s0, w + 11); K.flag(p.x, p.z, '#2E8B57'); }
  },
};

const city = {
  key: 'city', name: 'City lights', blurb: 'Night streets, tall towers and the harbour cranes', seed: 37, w: 7.5, laps: 3,
  pts: [[0, 0, 0], [140, 0, 0], [220, 10, 0], [260, 60, 0], [260, 160, 0], [230, 220, 0], [160, 240, 0], [90, 230, 0], [40, 190, 0], [-20, 200, 0], [-90, 240, 0], [-170, 230, 0], [-220, 170, 0], [-230, 80, 0], [-200, 10, 0], [-120, -10, 0], [-50, -10, 0]],
  zones: { harbor: [[0.14, 0.34]], park: [[0.48, 0.56]] },
  bank: 3,
  terrain: { amp: 3, base: 0.5, detail: 0.6, floor: -0.15, sea: 'harbor', blend: 20 },
  water: { y: -1.6, a: '#122238', b: '#18304A', mat: 0.69 },
  barrier: 'concrete', gantry: '#7C4DFF',
  road: { a: '#34383F', b: '#3A3E45', gloss: 0.32, lanes: true, center: false, edgeCol: '#F2EFE6', shoulder: () => '#6E7178' },
  ring: { near: ['#262B3D', '#2B3044'], far: ['#353A57', '#3A3F5E'], scale: 0.45 },
  env(T) {
    const h = T.at(T.total * 0.2).heading + 2.2;
    return { sunDir: sunDir(h, 5), sunCol: [1.7, 0.95, 0.6], skyCol: [0.16, 0.17, 0.3], gndCol: [0.1, 0.08, 0.1], fogCol: lin('#4B3F63'), fogSun: srgb('#FF8C5A'), fogSunLin: lin('#FF8C5A'), horizon: srgb('#C0627A'), zenith: srgb('#141C44'), reflHor: srgb('#7A4F78'), reflZen: srgb('#1A2350'), fogDen: 0.0019, exposure: 1.25, shadowRange: 58, clouds: 0.55, cloud: srgb('#6B4E7E'), stars: 0.7 };
  },
  groundColor(T) {
    const walk = C('#7E8189'), lot = C('#4E525A'), park = C('#2F5A35'), quay = C('#6B655E');
    return (p) => {
      const n = T.near(p[0], p[2], 3);
      const near = n.i >= 0 ? T.S[n.i] : null;
      if (p[1] < -1) return C('#3A3A3E');
      if (n.d < T.w + 10) return walk;
      if (near && near.zone.park && n.d < 90) return vary(park, p);
      if (near && near.zone.harbor && T.side(p[0], p[2], n.i) < 0) return vary(quay, p);
      return vary(mixc(lot, C('#565A63'), hash2(Math.floor(p[0] / 24), Math.floor(p[2] / 24))), p);
    };
  },
  scenery(K, X) {
    const { T, w, R, free, place, gy, pb } = K;
    const { S, N } = T;
    const towerCols = ['#3C465A', '#4A5468', '#2F3747', '#5A6378', '#3A4252', '#6B7389'];
    const wins = ['#FFD99A', '#FFE7B8', '#BFE3FF', '#FFC27A'];
    for (let i = 0; i < N; i++) {
      const p = S[i];
      if (i % 12 === 0) for (const sgn of [-1, 1]) K.lamp(p.x + p.rx * sgn * (w + 4), p.z + p.rz * sgn * (w + 4), Math.atan2(-p.rx * sgn, -p.rz * sgn), { glow: true, h: 8, light: '#FFE2A8' });
      if (i % 7 === 0) for (const sgn of [-1, 1]) {
        if (p.zone.harbor && sgn < 0) continue;
        if (p.zone.park) continue;
        const off = w + 26 + R() * 14;
        const x = p.x + p.rx * sgn * off, z = p.z + p.rz * sgn * off;
        const bw = 14 + R() * 10, bd = 14 + R() * 10, bh = 18 + R() * R() * 70;
        if (!free(x, z, Math.max(bw, bd) * 0.62, 6)) continue;
        K.building(x, z, p.heading, bw, bd, bh, { col: towerCols[Math.floor(R() * towerCols.length)], win: wins[Math.floor(R() * wins.length)], bands: R() < 0.35, crown: bh > 55 && R() > 0.4, litP: 0.4 + R() * 0.3 });
        place(x, z, Math.max(bw, bd) * 0.62);
      }
      if (p.zone.park && i % 5 === 0) for (const sgn of [-1, 1]) { const q = T.at(p.s, sgn * (w + 14 + R() * 30)); if (free(q.x, q.z, 2.5)) { K.tree(q.x, q.z, 0.8 + R() * 0.4, ['#2F6A35', '#3A7A3E']); place(q.x, q.z, 2.5); } }
      if (p.zone.harbor && i % 26 === 0) {
        const q = T.at(p.s, -(w + 34));
        const yaw = p.heading;
        const y = gy(q.x, q.z);
        pb.setT(rotT(yaw, q.x, y, q.z));
        for (const sx of [-5, 5]) for (const sz of [-4, 4]) pb.box(sx, 0, sz, 0.8, 26, 0.8, '#E0A12A', 0.2);
        pb.box(0, 26, 0, 11, 2.2, 9.8, '#E0A12A', 0.2);
        pb.box(-14, 27, 0, 46, 1.6, 2.0, '#E0A12A', 0.2);
        pb.box(8, 28.6, 0, 4, 3, 3, '#2B2F37', 0.3);
        pb.box(-30, 20, 0, 0.3, 8, 0.3, '#2B2F37', 0.4);
        pb.box(-1, 29.2, 0, 0.5, 0.5, 0.5, '#FF3B30', 1);
        pb.setT(null);
        K.glows.push([q.x, y + 29.4, q.z, 8, 2]);
        place(q.x, q.z, 10);
      }
      if (p.zone.harbor && i % 9 === 0) {
        const q = T.at(p.s, -(w + 16 + R() * 8));
        if (free(q.x, q.z, 4)) {
          const yaw = p.heading;
          const y = gy(q.x, q.z);
          pb.setT(rotT(yaw, q.x, y, q.z));
          const cc = ['#C0392B', '#2E86C1', '#D4AC0D', '#1E8449', '#7D3C98', '#CA6F1E'];
          const st = 1 + Math.floor(R() * 3);
          for (let k = 0; k < st; k++) pb.box(0, k * 2.6, 0, 2.5, 2.6, 6.1, cc[Math.floor(R() * cc.length)], 0.12);
          pb.setT(null);
          place(q.x, q.z, 4);
        }
      }
    }
    {
      const p = T.at(T.total * 0.53, w + 80);
      const y = gy(p.x, p.z);
      pb.cyl(p.x, y, p.z, 4.2, 4, 10, '#4A4F5C', 0.2);
      pb.cyl(p.x, y + 4, p.z, 2.6, 120, 10, '#D8DCE4', 0.2, { r2: 1.6 });
      pb.blob(p.x, y + 112, p.z, 8, 7, 8, '#7C4DFF', 0.86, null, 12, true);
      pb.cyl(p.x, y + 118, p.z, 0.6, 30, 6, '#D8DCE4', 0.3, { r2: 0.2 });
      for (let k = 0; k < 6; k++) K.glows.push([p.x + Math.cos(k) * 8.2, y + 112, p.z + Math.sin(k) * 8.2, 10, 4]);
      K.glows.push([p.x, y + 148, p.z, 8, 2.5]);
      place(p.x, p.z, 12);
    }
    for (const [s0, sg] of [[110, 1], [300, -1], [600, 1], [900, -1], [1150, 1]]) { const q = T.at(s0, sg * (w + 12)); if (free(q.x, q.z, 5)) { K.billboard(q.x, q.z, T.at(s0).heading + (sg > 0 ? -Math.PI / 2 : Math.PI / 2), [['#7C4DFF', '#FF3D7F', '#FFE15A'], ['#00B8D9', '#FFC23D', '#F4F1EA'], ['#FF6B35', '#1D7BF0', '#FFFFFF']][Math.floor(R() * 3)]); place(q.x, q.z, 5); } }
    const ringR = 520;
    const cx = (T.bounds.minX + T.bounds.maxX) / 2, cz = (T.bounds.minZ + T.bounds.maxZ) / 2;
    for (let k = 0; k < 90; k++) {
      const a = (k / 90) * Math.PI * 2 + R() * 0.03;
      const rr = ringR + R() * 200;
      const x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr;
      const bh = 30 + R() * R() * 120, bw = 20 + R() * 20;
      if (gy(x, z) < -0.8) continue;
      K.building(x, z, a, bw, bw, bh, { col: '#262C3C', win: wins[k % 4], bands: true, litP: 0.5 });
    }
    K.grandstand(30, 1, 40);
    void X;
  },
};

const rock = {
  key: 'rock', name: 'Lion rock', blurb: 'Red dirt roads, big jumps, elephants by the lake and a giant rock', seed: 51, w: 7, laps: 3, ramps: 3, rampH: 2.1,
  pts: [[0, 0, 0], [130, -10, 1], [240, 20, 3], [300, 100, 5], [280, 200, 7], [200, 260, 6], [100, 250, 4], [40, 190, 3], [-30, 170, 2], [-110, 210, 3], [-200, 190, 4], [-250, 110, 3], [-230, 20, 2], [-160, -40, 1], [-80, -40, 0]],
  zones: { lake: [[0.6, 0.72]], village: [[0.93, 1], [0, 0.05]] },
  bank: 5,
  terrain: { amp: 26, base: 0.45, detail: 3, lakes: [{ x: -150, z: 260, r: 110, y: -5 }], blend: 28 },
  water: { y: -1.8, a: '#3F7F86', b: '#4A8C91', mat: 0.66 },
  barrier: 'wood', gantry: '#C2582B',
  road: { a: '#94603F', b: '#9B6744', gloss: 0, center: false, edge: false, curbs: false, ruts: '#7F5236', shoulder: () => '#A2754F' },
  ring: { near: ['#8A7A5C', '#927F60'], far: ['#A39C8E', '#ADA597'], scale: 0.8 },
  env(T) {
    const h = T.at(T.total * 0.1).heading - 0.9;
    return { sunDir: sunDir(h, 22), sunCol: [3.0, 2.3, 1.5], skyCol: [0.36, 0.42, 0.55], gndCol: [0.3, 0.2, 0.13], fogCol: lin('#D9C9AC'), fogSun: srgb('#FFC38A'), fogSunLin: lin('#FFC38A'), horizon: srgb('#E3D2B6'), zenith: srgb('#3B78C4'), fogDen: 0.0015, exposure: 0.95, shadowRange: 58, clouds: 0.5 };
  },
  groundColor(T) {
    const red = C('#A8653F'), red2 = C('#9A5C3A'), dry = C('#A29B5A'), green = C('#6E9440'), rockc = C('#8E7A66'), mud = C('#6E5A40');
    return (p, slope) => {
      if (p[1] < -1.2) return mud;
      const n = T.near(p[0], p[2], 2);
      let c = mixc(dry, mixc(red, red2, hash2(p[0], p[2])), smooth(0.4, 0.62, fbm(p[0] * 0.015 + 9, p[2] * 0.015, 4)));
      if (n.d < T.w + 5) c = mixc(red, c, smooth(T.w + 2.5, T.w + 5, n.d));
      const L = Math.hypot(p[0] + 150, p[2] - 260);
      if (L < 160) c = mixc(green, c, smooth(110, 160, L));
      c = mixc(c, rockc, smooth(0.6, 0.9, slope));
      return vary(c, p);
    };
  },
  scenery(K) {
    const { T, w, R, free, place, gy, pb } = K;
    const { S, N } = T;
    const rx = 30, rz = 105;
    {
      const y0 = gy(rx, rz) - 4;
      const rows = [];
      const prof = [[1.0, 0], [0.98, 0.04], [0.82, 0.14], [0.76, 0.4], [0.74, 0.7], [0.72, 0.88], [0.7, 0.95], [0.62, 1.0], [0.0, 1.03]];
      const H = 105, Rb = 58;
      for (const [rf, hf] of prof) {
        const row = [];
        for (let j = 0; j <= 40; j++) {
          const a = (j / 40) * Math.PI * 2;
          const nn = 0.88 + fbm(Math.cos(a) * 2 + 4, Math.sin(a) * 2 + hf * 3, 3) * 0.3;
          row.push([rx + Math.cos(a) * Rb * rf * nn * (j === 40 ? 1 : 1), y0 + hf * H, rz + Math.sin(a) * Rb * rf * nn * 0.82]);
        }
        row[40] = row[0].slice();
        rows.push(row);
      }
      pb.surface(rows, '#9B7457', 0.03, { flip: false, at: (i, j) => [hexRgb(i >= 7 ? '#6E8A43' : (j + i) % 3 === 0 ? '#8E6A50' : '#9B7457'), 0.03] });
      for (let k = 0; k < 14; k++) { const a = R() * Math.PI * 2, r = R() * 28; pb.blob(rx + Math.cos(a) * r, y0 + H + 2, rz + Math.sin(a) * r * 0.8, 4, 2.4, 4, '#5E7F3A', 0, R, 6); }
      place(rx, rz, 64);
    }
    const L = { x: -150, z: 260 };
    for (let k = 0; k < 6; k++) {
      const a = 0.6 + k * 0.42, r = 96 + R() * 14;
      const x = L.x + Math.cos(a) * r, z = L.z + Math.sin(a) * r;
      if (free(x, z, 4, 8)) { K.elephant(x, z, a + Math.PI / 2 + (R() - 0.5), k === 3 ? 0.55 : 0.85 + R() * 0.2); place(x, z, 4); }
    }
    for (let i = 0; i < N; i++) {
      const p = S[i];
      if (p.zone.village && i % 14 === 0) for (const sgn of [-1, 1]) {
        const off = w + 15 + R() * 8;
        const x = p.x + p.rx * sgn * off, z = p.z + p.rz * sgn * off;
        if (free(x, z, 6)) { K.house(x, z, p.heading + (sgn > 0 ? -Math.PI / 2 : Math.PI / 2), 0.9, ['#E9D4B0', '#D8B48A', '#F1E6CF', '#C99A6B']); place(x, z, 6); }
      }
      if (Math.abs(p.curv) > 0.016 && i % 6 === 0) { const sg = p.curv > 0 ? -1 : 1; const q = T.at(p.s, sg * (w + 6.8)); K.tires(q.x, q.z, 3); }
    }
    const { minX: bx0, maxX: bx1, minZ: bz0, maxZ: bz1 } = T.bounds;
    for (let k = 0; k < 420; k++) {
      const x = bx0 - 200 + R() * (bx1 - bx0 + 400), z = bz0 - 200 + R() * (bz1 - bz0 + 400);
      if (gy(x, z) < -1 || !free(x, z, 2.5)) continue;
      const r = R();
      const nearLake = Math.hypot(x - L.x, z - L.z) < 170;
      if (nearLake && r < 0.5) K.palm(x, z, 0.8 + R() * 0.3, R() * 6);
      else if (r < 0.55) K.dryTree(x, z, 0.8 + R() * 0.5);
      else if (r < 0.8) K.bush(x, z, 0.7 + R() * 0.5, ['#7C8A3C', '#6A7A35']);
      else K.rock(x, z, 0.8 + R() * 1.8, R() > 0.5 ? '#9C8572' : '#8A7564');
      place(x, z, 2.5);
    }
    K.grandstand(30, 1, 38);
    for (const s0 of [100, 150]) { const p = T.at(s0, -(w + 11)); K.flag(p.x, p.z, '#C2582B'); }
  },
};

export const MAPS = { coast, hills, city, rock };
export const MAP_KEYS = ['coast', 'hills', 'city', 'rock'];
export function bottleSpots(T) {
  const out = [];
  const gap = 230;
  for (let s = 180; s < T.total - 60; s += gap) for (const x of [-3.8, 0, 3.8]) out.push({ s: s + (x === 0 ? 0 : 1.5), x, k: drinkOf(out.length) });
  return out;
}
