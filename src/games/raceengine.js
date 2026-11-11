export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const LAPS = 3;
export const MAX_RACERS = 6;
export const CAR_KEYS = ['sport', 'hatch', 'jeep', 'tuktuk'];
export const CARS = {
  sport: { name: 'Sports car', vmax: 49, acc: 10.5, turn: 1.15, grip: 1, boost: 1, mass: 1, len: 2.2 },
  hatch: { name: 'Hatchback', vmax: 47.5, acc: 11.5, turn: 1.25, grip: 1.05, boost: 1.05, mass: 0.95, len: 1.95 },
  jeep: { name: 'Jeep', vmax: 46.5, acc: 10, turn: 1.1, grip: 1.1, boost: 1, mass: 1.35, len: 2.1 },
  tuktuk: { name: 'Tuk tuk', vmax: 44.5, acc: 12.5, turn: 1.45, grip: 1.15, boost: 1.3, mass: 0.75, len: 1.45 },
};
export const COLORS = ['#FFC23D', '#FF5146', '#3D8BFF', '#3FC67E', '#A979FF', '#FF7EB9'];
export const BOT_NAMES = ['Kasun', 'Ishara', 'Amaya', 'Ravi', 'Dulani', 'Tharaka'];

export function gridSpot(slot) {
  const row = Math.floor(slot / 2);
  return { s: -7 - row * 8.5, x: slot % 2 ? -3 : 3 };
}
export function mkCar(id, slot, type) {
  const g = gridSpot(slot);
  return { id, slot, type: CARS[type] ? type : 'sport', s: g.s, x: g.x, v: 0, yaw: 0, steer: 0, drift: 0, meter: 0, boostT: 0, bump: 0, fin: 0, lapAt: 0, lapBest: 0, lap: 0, wall: 0 };
}

export function lapOf(c, T, laps) { return clamp(Math.floor(Math.max(0, c.s) / T.total) + 1, 1, laps); }

export function stepCar(c, T, inp, dt, o = {}) {
  const spec = CARS[c.type] || CARS.sport;
  const fx = o.fx || null;
  if (!(c.v >= 0)) c.v = 0;
  const p = T.at(c.s);
  const curv = T.S[p.i].curv;
  const want = clamp(inp.steer || 0, -1, 1);
  c.steer += (want - c.steer) * Math.min(1, dt * 6.5);
  const drifting = !!inp.drift && c.v > 15 && Math.abs(c.steer) > 0.18;
  c.drift += ((drifting ? 1 : 0) - c.drift) * Math.min(1, dt * (drifting ? 5 : 2.6));
  if (inp.boost && c.meter >= 0.3 && c.boostT <= 0) {
    c.boostT = 1.1 + c.meter * 1.7;
    c.meter = 0;
    if (fx) fx.push({ k: 'boost', id: c.id });
  }
  if (c.boostT > 0) c.boostT = Math.max(0, c.boostT - dt);
  const w = T.w;
  const off = Math.abs(c.x) > w + 1.4;
  let vmax = spec.vmax * (o.mul || 1);
  if (c.boostT > 0) vmax += 15;
  if (off) vmax *= 0.56;
  vmax *= 1 - c.drift * 0.07;
  vmax *= 1 - clamp(p.slope * 0.9, -0.04, 0.08);
  if (c.v < vmax) c.v += spec.acc * (c.boostT > 0 ? 1.7 : 1) * (1 - (c.v / (vmax + 2)) * 0.55) * dt;
  else c.v = Math.max(vmax, c.v - (off ? 22 : 7) * dt);
  if (c.bump > 0) c.bump = Math.max(0, c.bump - dt);
  const grip = Math.min(1, c.v / 16);
  const rate = c.steer * spec.turn * grip * (1 + c.drift * 0.55);
  c.yaw += rate * dt;
  const ds = c.v * Math.cos(c.yaw) * dt;
  c.yaw -= curv * ds;
  c.yaw *= Math.exp(-dt * (Math.abs(want) < 0.08 ? 1.1 * spec.grip : 0.35));
  c.yaw = clamp(c.yaw, -0.85, 0.85);
  c.s += ds;
  c.x += c.v * Math.sin(c.yaw) * dt;
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
  if (c.drift > 0.55) {
    const before = c.meter;
    c.meter = Math.min(1, c.meter + dt * 0.36 * spec.boost * clamp(c.v / 38, 0.4, 1.2));
    if (fx && before < 0.3 && c.meter >= 0.3) fx.push({ k: 'ready', id: c.id });
  }
  return c;
}

export function collide(a, b, both) {
  const ds = b.s - a.s, dx = b.x - a.x;
  const LA = (CARS[a.type] || CARS.sport).len, LB = (CARS[b.type] || CARS.sport).len;
  const ls = LA + LB, lx = 1.95;
  const ns = ds / ls, nx = dx / lx;
  const d = Math.hypot(ns, nx);
  if (d >= 1 || d < 1e-4) return 0;
  const pen = 1 - d;
  const us = ns / d, ux = nx / d;
  const ma = (CARS[a.type] || CARS.sport).mass, mb = (CARS[b.type] || CARS.sport).mass;
  const ka = both ? mb / (ma + mb) : 1, kb = both ? ma / (ma + mb) : 0;
  a.s -= us * pen * ls * ka; a.x -= ux * pen * lx * ka * 1.1;
  if (both) { b.s += us * pen * ls * kb; b.x += ux * pen * lx * kb * 1.1; }
  const closing = (a.v - b.v) * us;
  if (closing > 0) {
    a.v = clamp(a.v - closing * 0.55 * ka * us, 0, 70);
    if (both) b.v = clamp(b.v + closing * 0.45 * kb * us, 0, 70);
  }
  a.yaw += -ux * 0.06 * ka;
  a.bump = 0.25;
  return Math.min(1, Math.abs(closing) / 12 + pen * 0.5);
}

export function botInput(c, T, all, t, skill = 1) {
  const spec = CARS[c.type] || CARS.sport;
  const near = T.S[T.at(c.s).i].curv;
  const ahead = T.at(c.s + 16 + c.v * 0.45);
  const ca = T.S[ahead.i].curv;
  let tx = clamp(Math.sign(ca) * Math.min(4.6, Math.abs(ca) * 330), -4.6, 4.6);
  tx += Math.sin(t * 0.37 + c.slot * 1.7) * 0.8;
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

export function standings(cars, T, laps) {
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
