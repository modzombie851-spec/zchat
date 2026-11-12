export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const LAPS = 3;
export const MAX_RACERS = 8;
export const CAR_KEYS = ['sport', 'hatch', 'jeep', 'tuktuk'];
export const CARS = {
  sport: { name: 'Sports car', vmax: 49, acc: 10.5, turn: 1.15, grip: 1, boost: 1, mass: 1, len: 2.2 },
  hatch: { name: 'Hatchback', vmax: 47.5, acc: 11.5, turn: 1.25, grip: 1.05, boost: 1.05, mass: 0.95, len: 1.95 },
  jeep: { name: 'Jeep', vmax: 46.5, acc: 10, turn: 1.1, grip: 1.1, boost: 1, mass: 1.35, len: 2.1 },
  tuktuk: { name: 'Tuk tuk', vmax: 44.5, acc: 12.5, turn: 1.45, grip: 1.15, boost: 1.3, mass: 0.75, len: 1.45 },
  cop: { name: 'Police car', vmax: 50.5, acc: 11.5, turn: 1.22, grip: 1.08, boost: 1.05, mass: 1.25, len: 2.0 },
};
export const COLORS = ['#FFC23D', '#FF5146', '#3D8BFF', '#3FC67E', '#A979FF', '#FF7EB9', '#FF8A2A', '#2BC7D6'];
export const BOT_NAMES = ['Kasun', 'Ishara', 'Amaya', 'Ravi', 'Dulani', 'Tharaka', 'Nethmi', 'Sahan'];
export const SKILLS = {
  rocket: { name: 'Rocket', cost: 35, cd: 6, icon: 'rocket', key: '1' },
  shield: { name: 'Shield', cost: 25, cd: 9, icon: 'shield', key: '2' },
  oil: { name: 'Oil', cost: 20, cd: 5, icon: 'drop', key: '3' },
  shock: { name: 'Shock', cost: 40, cd: 10, icon: 'bolt', key: '4' },
  mine: { name: 'Mine', cost: 25, cd: 6, text: 'Drop a mine behind you' },
  emp: { name: 'EMP', cost: 30, cd: 9, text: 'Stop the car ahead from using skills and nitro' },
  ghost: { name: 'Ghost', cost: 30, cd: 12, text: 'Nothing can hit you for a few seconds' },
  hop: { name: 'Super jump', cost: 20, cd: 6, text: 'Jump over oil, mines and cars' },
  spike: { name: 'Spike strip', cost: 30, cd: 8, text: 'Throw spikes in front of a racer' },
  block: { name: 'Roadblock', cost: 40, cd: 14, text: 'Block the road ahead of the leader' },
  ram: { name: 'Ram', cost: 20, cd: 7, text: 'Speed up and smash into racers' },
};
SKILLS.rocket.text = 'A rocket that chases the car ahead';
SKILLS.shield.text = 'Block one hit';
SKILLS.oil.text = 'Leave oil that spins cars';
SKILLS.shock.text = 'Shock every car close to you';
export const SKILL_KEYS = ['rocket', 'shield', 'oil', 'shock'];
export const RACER_SKILLS = ['rocket', 'shield', 'oil', 'shock', 'mine', 'emp', 'ghost', 'hop'];
export const COP_SKILLS = ['spike', 'emp', 'block', 'ram'];
export const BUST_R = 4.6;
export const BUST_V = 12.5;
export const EN_START = 40;
export const EN_MAX = 100;
export const BOTTLE_EN = 34;
export const BOTTLE_BACK = 6;
export const DRINKS = {
  en: { name: 'Energy drink', col: '#36E0B0', band: '#F4F6F8', cap: '#E9EDF2', glow: 3 },
  nitro: { name: 'Nitro drink', col: '#2F7BFF', band: '#DCEAFF', cap: '#C9D6E8', glow: 6 },
  shield: { name: 'Shield drink', col: '#8EE6FF', band: '#FFFFFF', cap: '#D7F6FF', glow: 6 },
  rage: { name: 'Rage drink', col: '#FF3D4E', band: '#FFE1E1', cap: '#2A1A1C', glow: 8 },
  gold: { name: 'Gold drink', col: '#FFC23D', band: '#FFF2C7', cap: '#7A5410', glow: 7 },
};
export const DRINK_KEYS = ['en', 'nitro', 'shield', 'rage', 'gold'];
export function drinkOf(i) {
  const row = Math.floor(i / 3), lane = i % 3;
  if (row % 4 === 3 && lane === 1) return 'gold';
  return ['en', 'nitro', 'en', 'shield', 'en', 'rage'][(row * 2 + lane) % 6];
}
export function drinkUse(c, k) {
  if (k === 'nitro') { c.meter = 1; c.boostT = Math.max(c.boostT || 0, 0.9); }
  else if (k === 'rage') { c.en = Math.min(EN_MAX, c.en + 20); c.rage = 8; }
  else if (k === 'gold') { c.en = EN_MAX; if (c.cd) for (const q in c.cd) c.cd[q] = 0; }
  else if (k === 'shield') c.en = Math.min(EN_MAX, c.en + 10);
  else c.en = Math.min(EN_MAX, c.en + BOTTLE_EN);
}
export const ROCKET_V = 96;
export const SPIN_ROCKET = 1.35;
export const SPIN_OIL = 0.95;
export const SLOW_SHOCK = 1.8;
export const SHIELD_T = 4;
export const GRAV = 27;

export function groundAt(T, s) {
  const R = T && T.ramps;
  if (!R || !R.length) return 0;
  const tot = T.total;
  const u = ((s % tot) + tot) % tot;
  for (let i = 0; i < R.length; i++) { const r = R[i]; const d = u - r.s0; if (d >= 0 && d <= r.len) return r.h * Math.pow(d / r.len, 1.15); }
  return 0;
}
export function groundSlope(T, s) { return (groundAt(T, s + 0.6) - groundAt(T, s - 0.6)) / 1.2; }
export function padAt(T, s, x) {
  const P = T && T.pads;
  if (!P || !P.length) return null;
  const tot = T.total;
  const u = ((s % tot) + tot) % tot;
  for (let i = 0; i < P.length; i++) { const p = P[i]; const d = u - p.s0; if (d >= 0 && d <= p.len && Math.abs(x - p.x) < p.hw + 0.6) return p; }
  return null;
}
export function launchCar(c, vy, dir, slide) {
  c.inAir = 1;
  c.vy = Math.max(c.vy || 0, vy);
  c.air = Math.max(c.air || 0, 0.04);
  const t = (2 * c.vy) / GRAV;
  c.flipV = dir ? (dir * Math.PI * 2) / Math.max(0.35, t) : 0;
  c.flip = 0;
  if (slide) c.slide = slide;
}
export function airStep(c, T, dt, fx) {
  if (c.air == null) { c.air = 0; c.vy = 0; c.flip = 0; c.flipV = 0; c.slide = 0; c.inAir = 0; c.prevG = 0; c.lift = 0; }
  const g = groundAt(T, c.s);
  if (!c.inAir && c.prevG > 0.35 && g < c.prevG - 0.01) {
    c.inAir = 1;
    c.vy = c.lift * 0.96;
    c.air = c.prevG;
    c.flip = 0;
    c.flipV = 0;
    if (fx) fx.push({ k: 'jump', id: c.id });
  }
  if (c.inAir) {
    c.vy -= GRAV * dt;
    c.air += c.vy * dt;
    if (c.flipV) c.flip += c.flipV * dt;
    if (c.air <= g) {
      const hit = -c.vy;
      c.air = g;
      if (hit > 6.5) { c.vy = hit * 0.28; c.flipV = 0; c.flip = 0; }
      else { c.vy = 0; c.inAir = 0; c.flip = 0; c.flipV = 0; }
      if (fx && hit > 2.5) fx.push({ k: 'land', id: c.id, f: Math.min(1, hit / 15) });
    }
  } else {
    c.air = g;
    c.lift = g > 0 ? c.v * groundSlope(T, c.s) : 0;
  }
  c.prevG = g;
  if (c.slide) { c.x += c.slide * dt; c.slide *= Math.exp(-dt * 2.4); if (Math.abs(c.slide) < 0.05) c.slide = 0; }
}

export function gridSpot(slot) {
  const row = Math.floor(slot / 2);
  return { s: -7 - row * 8.5, x: slot % 2 ? -3 : 3 };
}
export function mkCar(id, slot, type) {
  const g = gridSpot(slot);
  return { id, slot, type: CARS[type] ? type : 'sport', s: g.s, x: g.x, v: 0, yaw: 0, steer: 0, drift: 0, meter: 0, boostT: 0, bump: 0, fin: 0, lapAt: 0, lapBest: 0, lap: 0, wall: 0, en: EN_START, cd: {}, shield: 0, spin: 0, spinMax: 1, slow: 0, wheel: 0, brake: 0 };
}

export function lapOf(c, T, laps) { return clamp(Math.floor(Math.max(0, c.s) / T.total) + 1, 1, laps); }

export function stepCar(c, T, inp, dt, o = {}) {
  const spec = CARS[c.type] || CARS.sport;
  const fx = o.fx || null;
  if (!(c.v >= 0)) c.v = 0;
  const p = T.at(c.s);
  const curv = T.S[p.i].curv;
  const spinning = c.spin > 0;
  const flying = !!c.inAir;
  const want = spinning ? 0 : clamp(inp.steer || 0, -1, 1);
  c.steer += (want - c.steer) * Math.min(1, dt * 6.5);
  const pedal = !spinning && !!(inp.drift || inp.brake);
  const drifting = pedal && c.v > 15 && Math.abs(c.steer) > 0.18;
  const braking = pedal && !drifting && !!inp.brake;
  c.brake = braking ? 1 : 0;
  c.drift += ((drifting ? 1 : 0) - c.drift) * Math.min(1, dt * (drifting ? 5 : 2.6));
  if (c.hold > 0) { c.hold = Math.max(0, c.hold - dt); c.v = Math.max(0, c.v - 40 * dt); return c; }
  if (!spinning && inp.boost && c.meter >= 0.3 && c.boostT <= 0 && !(c.emp > 0)) {
    c.boostT = 1.1 + c.meter * 1.7;
    c.meter = 0;
    if (fx) fx.push({ k: 'boost', id: c.id });
  }
  if (c.boostT > 0) c.boostT = Math.max(0, c.boostT - dt);
  if (c.shield > 0) c.shield = Math.max(0, c.shield - dt);
  if (c.ghost > 0) c.ghost = Math.max(0, c.ghost - dt);
  if (c.emp > 0) c.emp = Math.max(0, c.emp - dt);
  if (c.flat > 0) c.flat = Math.max(0, c.flat - dt);
  if (c.ram > 0) { c.ram = Math.max(0, c.ram - dt); c.boostT = Math.max(c.boostT, 0.15); }
  if (c.slow > 0) c.slow = Math.max(0, c.slow - dt);
  if (c.cd) { const cdt = c.rage > 0 ? dt * 2 : dt; for (const k in c.cd) if (c.cd[k] > 0) c.cd[k] = Math.max(0, c.cd[k] - cdt); }
  if (c.rage > 0) c.rage = Math.max(0, c.rage - dt);
  const w = T.w;
  const off = Math.abs(c.x) > w + 1.4;
  let vmax = spec.vmax * (o.mul || 1);
  if (c.boostT > 0) vmax += 15;
  if (off) vmax *= 0.56;
  if (c.slow > 0) vmax *= 0.55;
  if (c.emp > 0) vmax *= 0.86;
  if (c.flat > 0) vmax *= 0.62;
  vmax *= 1 - c.drift * 0.07;
  vmax *= 1 - clamp(p.slope * 0.9, -0.04, 0.08);
  if (spinning) {
    c.spin = Math.max(0, c.spin - dt);
    c.v = Math.max(0, c.v - (flying ? 8 : 34) * dt);
    c.yaw *= Math.exp(-dt * 3);
  } else if (flying) c.v = Math.max(0, c.v - 1.2 * dt);
  else if (braking) c.v = Math.max(0, c.v - 26 * dt);
  else if (c.v < vmax) c.v += spec.acc * (c.boostT > 0 ? 1.7 : 1) * (1 - (c.v / (vmax + 2)) * 0.55) * dt;
  else c.v = Math.max(vmax, c.v - (off ? 22 : 7) * dt);
  if (c.bump > 0) c.bump = Math.max(0, c.bump - dt);
  const grip = Math.min(1, c.v / 16) * (flying ? 0.18 : 1);
  const rate = c.steer * spec.turn * grip * (1 + c.drift * 0.55);
  c.yaw += rate * dt;
  const ds = c.v * Math.cos(c.yaw) * dt;
  c.yaw -= curv * ds;
  c.yaw *= Math.exp(-dt * (Math.abs(want) < 0.08 ? 1.1 * spec.grip : 0.35));
  c.yaw = clamp(c.yaw, -0.85, 0.85);
  c.s += ds;
  c.x += c.v * Math.sin(c.yaw) * dt;
  c.wheel = (c.wheel + (c.v * dt) / 0.34) % (Math.PI * 2);
  const lim = w + 6.5;
  if (Math.abs(c.x) > lim) {
    const side = Math.sign(c.x);
    const out = c.v * Math.sin(c.yaw) * side;
    c.x = side * lim;
    if (out > 0) {
      c.v = Math.max(0, c.v - out * 0.7);
      c.yaw = -c.yaw * 0.35 - side * 0.04;
      if (fx && out > 3 && c.wall <= 0) fx.push({ k: 'wall', id: c.id, f: Math.min(1, out / 18) });
      c.wall = 0.4;
    }
  }
  if (c.wall > 0) c.wall -= dt;
  airStep(c, T, dt, fx);
  if (!c.inAir && T.pads) {
    const pad = padAt(T, c.s, c.x);
    if (pad && c.padAt !== pad.s0) {
      c.padAt = pad.s0;
      c.boostT = Math.max(c.boostT, 0.85);
      c.v = Math.max(c.v, Math.min(vmax + 10, c.v + 6));
      if (fx) fx.push({ k: 'pad', id: c.id });
    } else if (!pad && c.padAt != null && Math.abs(((c.s - c.padAt) % T.total + T.total) % T.total) > 30) c.padAt = null;
  }
  if (c.drift > 0.55) {
    const before = c.meter;
    c.meter = Math.min(1, c.meter + dt * 0.36 * spec.boost * clamp(c.v / 38, 0.4, 1.2));
    if (fx && before < 0.3 && c.meter >= 0.3) fx.push({ k: 'ready', id: c.id });
  }
  return c;
}

export function collide(a, b, both) {
  if (Math.abs((a.air || 0) - (b.air || 0)) > 1.3) return 0;
  const ds = b.s - a.s, dx = b.x - a.x;
  const LA = (CARS[a.type] || CARS.sport).len, LB = (CARS[b.type] || CARS.sport).len;
  const ls = LA + LB, lx = 1.95;
  const ns = ds / ls, nx = dx / lx;
  const d = Math.hypot(ns, nx);
  if (d >= 1 || d < 1e-4) return 0;
  const pen = 1 - d;
  const us = ns / d, ux = nx / d;
  const ma = (CARS[a.type] || CARS.sport).mass, mb = (CARS[b.type] || CARS.sport).mass;
  const ka = both ? mb / (ma + mb) : 0.6, kb = both ? ma / (ma + mb) : 0;
  a.s -= us * pen * ls * ka; a.x -= ux * pen * lx * ka * 0.9;
  if (both) { b.s += us * pen * ls * kb; b.x += ux * pen * lx * kb * 0.9; }
  const closing = (a.v - b.v) * us;
  if (closing > 0) {
    a.v = clamp(a.v - closing * 0.4 * ka * us, 0, 70);
    if (both) b.v = clamp(b.v + closing * 0.4 * kb * us, 0, 70);
  }
  if (Math.abs(closing) > 2.5) a.yaw -= ux * 0.02 * ka;
  a.bump = 0.25;
  return Math.min(1, Math.abs(closing) / 12 + pen * 0.5);
}

export function botInput(c, T, all, t, skill = 1, seek = null) {
  const spec = CARS[c.type] || CARS.sport;
  const near = T.S[T.at(c.s).i].curv;
  const ahead = T.at(c.s + 16 + c.v * 0.45);
  const ca = T.S[ahead.i].curv;
  let tx = clamp(Math.sign(ca) * Math.min(4.6, Math.abs(ca) * 330), -4.6, 4.6);
  tx += Math.sin(t * 0.37 + c.slot * 1.7) * 0.8;
  if (seek != null && Math.abs(ca) < 0.02) tx = seek;
  for (const o of all) {
    if (o === c || o.fin) continue;
    const ds = o.s - c.s;
    if (ds > 0 && ds < 14 && Math.abs(o.x - tx) < 2.4) tx = o.x + (o.x > 0 ? -3.2 : 3.2);
  }
  tx = clamp(tx, -T.w + 1.2, T.w - 1.2);
  const desired = Math.atan2(tx - c.x, 15 + c.v * 0.2);
  const feed = (near * c.v) / Math.max(0.5, spec.turn);
  const steer = clamp((desired - c.yaw) * 2.6 + feed * 1.05, -1, 1);
  const drift = Math.abs(ca) > 0.017 && c.v > 32 && skill > 0.9;
  const boost = c.meter > 0.75 && Math.abs(ca) < 0.007;
  return { steer, drift, boost };
}

export function botSkill(c, all, rockets, rnd, dt, o = {}) {
  if (c.fin || c.spin > 0 || c.busted || c.emp > 0) return null;
  const kit = c.kit || SKILL_KEYS;
  const has = (k) => kit.includes(k);
  const can = (k) => has(k) && c.en >= SKILLS[k].cost && !(c.cd[k] > 0);
  const incoming = rockets.some((r) => r.tg === c.id && r.s < c.s && c.s - r.s < 50);
  if (incoming && can('shield') && c.shield <= 0 && rnd() < 0.65) return { k: 'shield' };
  if (incoming && can('ghost') && rnd() < 0.5) return { k: 'ghost' };
  if (o.danger && can('hop') && rnd() < 0.5) return { k: 'hop' };
  if (o.danger && can('ghost') && rnd() < 0.4) return { k: 'ghost' };
  if (rnd() > dt * 1.1) return null;
  const foe = o.foe || (() => true);
  let ahead = null, best = 1e9, behind = 0, close = 0;
  for (const q of all) {
    if (q === c || q.fin || q.busted || !foe(q)) continue;
    const ds = q.s - c.s;
    if (ds > 6 && ds < 110 && ds < best) { best = ds; ahead = q; }
    if (ds < -3 && ds > -24 && Math.abs(q.x - c.x) < 4.5) behind++;
    if (Math.abs(ds) < 17 && Math.abs(q.x - c.x) < 9) close++;
  }
  if (c.cop) {
    if (ahead && best < 18 && can('ram')) return { k: 'ram', tg: ahead.id };
    if (ahead && best < 90 && can('emp')) return { k: 'emp', tg: ahead.id };
    if (ahead && best < 120 && can('spike')) return { k: 'spike', tg: ahead.id };
    if (ahead && best < 150 && can('block') && rnd() < 0.5) return { k: 'block', tg: ahead.id };
    return null;
  }
  if (can('rocket') && ahead) return { k: 'rocket', tg: ahead.id };
  if (can('emp') && ahead && best < 80) return { k: 'emp', tg: ahead.id };
  if (can('shock') && close >= 2) return { k: 'shock' };
  if (can('mine') && behind > 0) return { k: 'mine' };
  if (can('oil') && behind > 0) return { k: 'oil' };
  return null;
}

export function rocketStep(r, cars, dt) {
  r.life -= dt;
  r.age = (r.age || 0) + dt;
  const t0 = r.tg ? cars[r.tg] : null;
  if (t0 && (t0.sc >= 0 || t0.ghost > 0)) r.tg = null;
  const tgt = r.tg ? cars[r.tg] : null;
  r.s += r.v * dt;
  if (tgt && !tgt.fin) { const dx = tgt.x - r.x; r.x += Math.sign(dx) * Math.min(Math.abs(dx), (10 + r.age * 8) * dt); }
  for (const id of Object.keys(cars)) {
    if (id === r.by) continue;
    const c = cars[id];
    if (c.fin || c.sc >= 0 || c.ghost > 0 || c.park || c.busted) continue;
    if (Math.abs(c.s - r.s) < 2.1 && Math.abs(c.x - r.x) < 1.6 && (c.air || 0) < 2.2) return c;
  }
  return null;
}

export function standings(cars) {
  return cars.slice().sort((a, b) => {
    if (a.fin && b.fin) return a.fin - b.fin;
    if (a.fin) return -1;
    if (b.fin) return 1;
    return b.s - a.s;
  });
}

export function raceDist(T, laps) { return T.total * laps; }

export const fmtRace = (t) => {
  if (!(t > 0)) return '0:00.00';
  const m = Math.floor(t / 60), s = t - m * 60;
  return `${m}:${s < 10 ? '0' : ''}${s.toFixed(2)}`;
};

export const cutOf = (T, c) => (c && c.sc >= 0 && T && T.cuts ? T.cuts[c.sc] || null : null);
export const carAt = (T, c) => { const P = cutOf(T, c); return P ? P.at(c.ss, c.sx) : T.at(c.s, c.x); };
const wrapA = (a) => { let d = a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };
export function driveCar(T, c, inpOf, dt, o) {
  const P = cutOf(T, c);
  if (P) {
    const base = c.cutBase;
    c.s = c.ss; c.x = c.sx;
    stepCar(c, P, inpOf(P), dt, { ...o, mul: (o.mul || 1) * 0.95 });
    c.ss = c.s; c.sx = c.x;
    if (c.ss >= P.total - 0.2) {
      const e = P.S[P.N - 1], q = T.at(P.s1, P.side * (T.w + 0.3));
      const dh = wrapA(e.heading - q.heading);
      c.sc = -1; c.s = base + P.arc + (c.ss - P.total); c.x = P.side * (T.w + 0.3) + c.sx * Math.cos(dh); c.yaw = clamp(c.yaw + dh, -0.85, 0.85);
    } else if (c.ss < -0.5) {
      c.sc = -1; c.s = base + c.ss; c.x = P.side * (T.w + 0.3) + c.sx;
    } else { c.s = base + (c.ss / P.total) * P.arc; c.x = P.side * (T.w + 2); }
    return;
  }
  stepCar(c, T, inpOf(T), dt, o);
  if (!T.cuts || !T.cuts.length || c.inAir) return;
  const u = ((c.s % T.total) + T.total) % T.total;
  for (let i = 0; i < T.cuts.length; i++) {
    const C = T.cuts[i];
    if (u > C.s0 - 10 && u < C.s0 + 8 && c.x * C.side > T.w - 1.2 && c.yaw * C.side > -0.3) {
      const pw = T.at(c.s, c.x), e = C.S[0];
      const dx = pw.x - e.x, dz = pw.z - e.z;
      c.cutBase = c.s - u + C.s0;
      c.ss = Math.max(0, dx * e.tx + dz * e.tz);
      c.sx = clamp(dx * e.rx + dz * e.rz, -C.w, C.w);
      c.yaw = clamp(c.yaw + wrapA(pw.heading - e.heading), -0.85, 0.85);
      c.sc = i;
      c.s = c.cutBase + (c.ss / C.total) * C.arc; c.x = C.side * (T.w + 2);
      return;
    }
  }
}

