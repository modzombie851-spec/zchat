function rngOf(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function hashStr(s) {
  let h = 2166136261;
  const str = String(s);
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export const THEME_IDS = ['sand', 'jungle', 'ice', 'forge', 'crystal'];
const NAMES = {
  sand: [['Sun', 'Dust', 'Golden', 'Old', 'Silent', 'Amber'], ['shrine', 'vault', 'steps', 'court', 'tomb']],
  jungle: [['Moss', 'Root', 'Green', 'Rain', 'Fern', 'Hidden'], ['ruins', 'garden', 'temple', 'well', 'grove']],
  ice: [['Frost', 'Snow', 'Glass', 'Cold', 'Pale', 'Winter'], ['hall', 'cave', 'keep', 'stair', 'crypt']],
  forge: [['Ember', 'Iron', 'Ash', 'Coal', 'Red', 'Cinder'], ['forge', 'works', 'furnace', 'pit', 'foundry']],
  crystal: [['Amethyst', 'Prism', 'Glow', 'Deep', 'Violet', 'Quartz'], ['mine', 'grotto', 'vein', 'hollow', 'chamber']],
};
const GOALS = {
  gate: 'Pull every lever to lift the gate',
  plate: 'Hold the door for each other on the round plates',
  bridge: 'Blue light shows the stone bridge',
  code: 'Read the hidden code in blue light',
  fires: 'Light both fires together',
  spikes: 'Cross the spikes when they drop',
  crumble: 'Cracked floor falls away, keep moving',
  split: 'Each torch takes its own road',
  portal: 'Step on the glowing rings to jump',
  ice: 'Slide across the ice with care',
  timed: 'Buttons open the door for a few seconds',
  hall: 'Find the way through',
};

function grid(w, h) {
  const g = [];
  for (let y = 0; y <= h; y++) {
    const r = [];
    for (let x = 0; x < w; x++) r.push(x === 0 || x === w - 1 || y === 0 ? '#' : '.');
    g.push(r);
  }
  return g;
}
const put = (g, x, y, ch) => { if (y >= 0 && y < g.length && x > 0 && x < g[0].length - 1) g[y][x] = ch; };
const fill = (g, x0, y0, x1, y1, ch) => { for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) put(g, x, y, ch); };
const get = (g, x, y) => (y < 0 || y >= g.length || x < 0 || x >= g[0].length ? '#' : g[y][x]);

function tools(rng) {
  const ri = (a, b) => a + Math.floor(rng() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];
  const chance = (p) => rng() < p;
  return { ri, pick, chance };
}

function openRow0(g, x0, n) { for (let i = 0; i < n; i++) g[0][x0 + i] = '.'; return Array.from({ length: n }, (_, i) => x0 + i); }
function exitPair(exits) { const a = exits[0], b = exits.length > 1 ? exits[1] : exits[0]; return [a, b]; }
function pillars(g, T, n, keep) {
  const w = g[0].length, h = g.length - 1;
  for (let i = 0; i < n; i++) {
    const x = T.ri(2, w - 3), y = T.ri(2, h - 2);
    if (keep && keep(x, y)) continue;
    if (get(g, x, y) !== '.' || get(g, x, y - 1) === '#' && y - 1 === 0) continue;
    let ok = true;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const c = get(g, x + dx, y + dy); if (c !== '.' && c !== '#') ok = false; }
    if (!ok) continue;
    put(g, x, y, '#');
  }
}

function bStart(ctx) {
  const { w, T } = ctx;
  const g = grid(w, 3);
  const a = T.ri(2, 4), b = w - 1 - T.ri(2, 4);
  put(g, a, 3, 'A'); put(g, b, 3, 'B');
  const ow = T.ri(2, 3), ox = T.ri(3, w - 3 - ow);
  const exits = openRow0(g, ox, ow);
  return { g, plan: [], gems: [], exits };
}

function bExit(ctx) {
  const { w, T, entry, chest } = ctx;
  const h = chest ? 4 : 3;
  const g = grid(w, h);
  const mid = Math.floor(w / 2);
  const sx = mid - T.ri(1, 2), mx = mid + T.ri(1, 2);
  const sunLeft = T.chance(0.5);
  put(g, sunLeft ? sx : mx, 1, 'X'); put(g, sunLeft ? mx : sx, 1, 'Y');
  const plan = [];
  if (chest) {
    const left = T.chance(0.5);
    const vx = left ? 3 : w - 4, kx = left ? 1 : w - 2, px = left ? 2 : w - 3;
    put(g, vx, 1, 'V'); put(g, vx, 2, '#'); put(g, px, 2, '#'); put(g, kx, 2, '#'); put(g, px, 1, '.'); put(g, kx, 1, 'k');
    const tx = left ? w - 3 : 2;
    put(g, tx, 1, 'T');
    plan.push({ sun: [vx + (left ? 1 : -1), 2], moon: [mid, 3] });
    plan.push({ sun: 'V', until: 'vines' });
    plan.push({ sun: 'k' });
    plan.push({ sun: 'T', until: 'chest' });
  }
  plan.push({ sun: 'X', moon: 'Y' });
  return { g, plan, gems: [], exits: [], entry };
}

function bGate(ctx) {
  const { w, T, gate } = ctx;
  const h = T.ri(6, 7);
  const g = grid(w, h);
  const lever = gate === 'H' ? 'h' : 'j';
  const lavaLeft = T.chance(0.5);
  const bw = T.ri(3, 4), bh = 3;
  const by = T.ri(2, h - 4);
  const lx0 = lavaLeft ? 1 : w - 1 - bw, wx0 = lavaLeft ? w - 1 - bw : 1;
  fill(g, lx0, by, lx0 + bw - 1, by + bh - 1, 'L');
  fill(g, wx0, by, wx0 + bw - 1, by + bh - 1, 'W');
  const lvx = lx0 + 1 + (bw === 4 ? T.ri(0, 1) : 0), wvx = wx0 + 1 + (bw === 4 ? T.ri(0, 1) : 0);
  put(g, lvx, by + 1, lever); put(g, wvx, by + 1, lever);
  const gems = [];
  const lc = [[lx0, by], [lx0 + bw - 1, by + bh - 1], [lx0 + bw - 1, by]].filter(([x, y]) => get(g, x, y) === 'L');
  const wc = [[wx0, by], [wx0 + bw - 1, by + bh - 1], [wx0, by + bh - 1]].filter(([x, y]) => get(g, x, y) === 'W');
  if (lc.length) { const c = T.pick(lc); gems.push([c[0], c[1], 'sun']); }
  if (wc.length) { const c = T.pick(wc); gems.push([c[0], c[1], 'moon']); }
  if (T.chance(0.5) && w - 2 * bw - 2 >= 5) { const gx = T.ri(bw + 2, w - bw - 4); const gy = T.ri(by, by + 1); fill(g, gx, gy, gx + 1, gy, 'P'); }
  const gw = T.ri(2, 3), gx0 = T.ri(Math.max(2, bw), Math.min(w - 2 - gw, w - 1 - bw - gw));
  for (let i = 0; i < gw; i++) g[0][gx0 + i] = gate;
  const exits = Array.from({ length: gw }, (_, i) => gx0 + i);
  const [ea, eb] = exitPair(exits);
  const plan = [
    { sun: [lvx, by + 1], moon: [wvx, by + 1], until: `lever${gate}` },
    { sun: [ea, -1], moon: [eb, -1] },
  ];
  return { g, plan, gems, exits, kind: 'gate' };
}

function bPlate(ctx) {
  const { w, T } = ctx;
  const h = 7;
  const g = grid(w, h);
  fill(g, 1, 3, w - 2, 3, '#');
  const dw = T.ri(1, 2), dx = T.ri(3, w - 4 - dw);
  for (let i = 0; i < dw; i++) put(g, dx + i, 3, 'O');
  const leftDoor = dx + dw / 2 < w / 2;
  const p1x = leftDoor ? T.ri(Math.min(w - 2, dx + dw + 3), w - 2) : T.ri(1, Math.max(1, dx - 4));
  const p1y = T.ri(5, 6);
  const p2x = leftDoor ? T.ri(Math.min(w - 2, dx + dw + 3), w - 2) : T.ri(1, Math.max(1, dx - 4));
  const p2y = T.ri(1, 2);
  put(g, p1x, p1y, 'o'); put(g, p2x, p2y, 'o');
  const gems = [];
  const side = leftDoor ? [1, Math.max(1, dx - 2)] : [Math.min(w - 2, dx + dw + 1), w - 2];
  if (side[1] - side[0] >= 1) {
    const hz = T.chance(0.5) ? 'L' : 'W';
    const hy = T.ri(5, 6);
    fill(g, side[0], hy, side[1], hy, hz);
    gems.push([T.ri(side[0], side[1]), hy, hz === 'L' ? 'sun' : 'moon']);
  }
  const first = T.chance(0.5) ? 'sun' : 'moon', second = first === 'sun' ? 'moon' : 'sun';
  const ow = 2, ox = T.ri(2, w - 2 - ow);
  const exits = openRow0(g, ox, ow);
  if (T.chance(0.6)) gems.push([leftDoor ? 1 : w - 2, 1, T.chance(0.5) ? 'sun' : 'moon']);
  const plan = [
    { [first]: [p1x, p1y], [second]: [dx, 4] },
    { [first]: 'stay', [second]: [p2x, p2y] },
    { [second]: 'stay', [first]: [dx, 2] },
    { sun: [exits[0], -1], moon: [exits[1], -1] },
  ];
  return { g, plan, gems, exits, kind: 'plate' };
}

function bBridge(ctx) {
  const { w, T } = ctx;
  const h = T.ri(7, 8);
  const g = grid(w, h);
  fill(g, 1, 2, w - 2, h - 1, 'C');
  let x = T.ri(3, w - 4);
  const x0 = x;
  const path = [[x, h - 1]];
  put(g, x, h - 1, 'b');
  const corners = [];
  for (let y = h - 2; y >= 2; y--) {
    put(g, x, y, 'b'); path.push([x, y]);
    if (y > 2 && y < h - 1 && T.chance(0.55)) {
      const dir = x < 4 ? 1 : x > w - 5 ? -1 : (T.chance(0.5) ? 1 : -1);
      const n = T.ri(1, 3);
      corners.push([x, y]);
      for (let i = 0; i < n; i++) { const nx = x + dir; if (nx < 2 || nx > w - 3) break; x = nx; put(g, x, y, 'b'); path.push([x, y]); }
      corners.push([x, y]);
    }
  }
  const top = [x, 1];
  const gems = [];
  if (T.chance(0.7)) {
    const cands = path.filter(([px, py]) => py > 2 && py < h - 1);
    if (cands.length) {
      const [bx, by] = T.pick(cands);
      const dir = bx < w / 2 ? 1 : -1;
      let ex = bx, ok = true;
      const stub = [];
      for (let i = 0; i < 2; i++) { ex += dir; if (ex < 1 || ex > w - 2 || get(g, ex, by) !== 'C' || get(g, ex, by - 1) === 'b' || get(g, ex, by + 1) === 'b') { ok = false; break; } stub.push(ex); }
      if (ok && stub.length) { stub.forEach((sx) => put(g, sx, by, 'b')); gems.push([stub[stub.length - 1], by, T.chance(0.5) ? 'moon' : 'sun']); }
    }
  }
  const ow = 2, ox = T.ri(2, w - 2 - ow);
  const exits = openRow0(g, ox, ow);
  const plan = [{ moon: [x0, h], sun: [x0 + (x0 < w / 2 ? 1 : -1), h] }];
  const wps = [];
  path.forEach(([px, py], i) => { const isCorner = corners.some(([cx, cy]) => cx === px && cy === py); if (isCorner || i % 2 === 1 || i === path.length - 1) wps.push([px, py]); });
  wps.forEach((p) => plan.push({ moon: p, sun: 'follow', lead: 'moon' }));
  plan.push({ moon: top, sun: 'follow', lead: 'moon' });
  plan.push({ moon: [top[0] + (top[0] < w / 2 ? 1 : -1), 1], sun: [top[0], 1] });
  plan.push({ sun: [exits[0], -1], moon: [exits[1], -1] });
  if (T.chance(0.5)) gems.push([T.chance(0.5) ? 1 : w - 2, 1, T.chance(0.5) ? 'sun' : 'moon']);
  return { g, plan, gems, exits, kind: 'bridge' };
}

function bCode(ctx) {
  const { w, T } = ctx;
  const h = 5;
  const g = grid(w, h);
  const doorLeft = T.chance(0.5);
  const dx = doorLeft ? T.ri(3, 4) : T.ri(w - 6, w - 5);
  const qx = dx + 1;
  const mx = doorLeft ? T.ri(w - 4, w - 3) : T.ri(2, 3);
  g[0][dx] = 'D'; g[0][qx] = 'q'; g[0][mx] = 'M';
  fill(g, mx - 1, 1, mx + 1, 2, 'W');
  const gems = [[mx, 2, 'moon']];
  const lx = doorLeft ? T.ri(dx + 3, mx - 3) : T.ri(mx + 3, dx - 3);
  if (lx > 1 && lx < w - 2 && Math.abs(lx - mx) >= 3) { fill(g, lx, 3, lx + 1, 3, 'L'); gems.push([lx, 3, 'sun']); }
  pillars(g, T, 2, (x, y) => y <= 2 || Math.abs(x - dx) < 2 || Math.abs(x - mx) < 2);
  const plan = [
    { moon: [mx, 1], sun: [qx, 1], max: 40 },
    { sun: 'dial', act: 'code', until: 'code' },
    { sun: [dx, -1], moon: [dx, -1] },
  ];
  return { g, plan, gems, exits: [dx], kind: 'code', narrowExit: true };
}

function bFires(ctx) {
  const { w, T } = ctx;
  const h = 6;
  const g = grid(w, h);
  const sunLeft = T.chance(0.5);
  const fx = sunLeft ? 2 : w - 3, nx = sunLeft ? w - 3 : 2, by = 2;
  put(g, fx, by, 'F'); put(g, nx, by, 'N');
  const guard = (x, ch) => { fill(g, x - 1, by, x + 1, by + 2, ch); put(g, x, by, x === fx ? 'F' : 'N'); };
  guard(fx, 'L'); guard(nx, 'W');
  const ex = Math.floor(w / 2) - 1;
  for (let i = 0; i < 3; i++) g[0][ex + i] = 'E';
  const gems = [[fx + (sunLeft ? 1 : -1), by + 2, 'sun'], [nx + (sunLeft ? -1 : 1), by + 2, 'moon']];
  if (T.chance(0.6)) { const px = T.ri(5, w - 6); fill(g, px, 4, px + 1, 4, 'P'); }
  const plan = [
    { sun: [fx, by + 3], moon: [nx, by + 3] },
    { sun: 'F', moon: 'N', until: 'great' },
    { sun: [ex, -1], moon: [ex + 2, -1] },
  ];
  return { g, plan, gems, exits: [ex, ex + 1, ex + 2], kind: 'fires' };
}

function bSpikes(ctx) {
  const { w, T } = ctx;
  const h = 7;
  const g = grid(w, h);
  const rowsA = [2, 3], rowB = 5;
  rowsA.forEach((y) => fill(g, 1, y, w - 2, y, 'S'));
  fill(g, 1, rowB, w - 2, rowB, 's');
  for (let i = 0; i < 2; i++) { const px = T.ri(2, w - 3); put(g, px, 4, '#'); }
  const gems = [[T.ri(2, w - 3), 4, 'sun'], [T.ri(2, w - 3), 2, 'moon']].filter(([x, y]) => get(g, x, y) !== '#');
  const ow = 2, ox = T.ri(2, w - 2 - ow);
  const exits = openRow0(g, ox, ow);
  const lanes = [];
  for (let x = 2; x <= w - 3; x++) if (get(g, x, 4) === '.') lanes.push(x);
  const a = lanes[Math.floor(lanes.length / 3)], b = lanes[Math.floor(lanes.length * 2 / 3)];
  const plan = [
    { sun: [a, 6], moon: [b, 6] },
    { sun: [a, 4], moon: [b, 4], when: 'spikeB' },
    { sun: [a, 1], moon: [b, 1], when: 'spikeA' },
    { sun: [exits[0], -1], moon: [exits[1], -1] },
  ];
  return { g, plan, gems, exits, kind: 'spikes' };
}

function bCrumble(ctx) {
  const { w, T } = ctx;
  const h = 6;
  const g = grid(w, h);
  fill(g, 1, 2, w - 2, h - 1, 'C');
  const a = T.ri(2, Math.floor(w / 2) - 2), b = T.ri(Math.floor(w / 2) + 2, w - 3);
  const lane = (x0) => {
    let x = x0;
    const pts = [];
    for (let y = h - 1; y >= 2; y--) {
      put(g, x, y, 'K'); pts.push([x, y]);
      if (y === 3 && T.chance(0.5)) { const nx = x + (T.chance(0.5) ? 1 : -1); if (nx >= 2 && nx <= w - 3 && get(g, nx, y) === 'C') { x = nx; put(g, x, y, 'K'); pts.push([x, y]); } }
    }
    return { x, pts };
  };
  const la = lane(a), lb = lane(b);
  const gems = [];
  const gl = T.chance(0.5) ? la : lb;
  const gp = gl.pts[Math.min(gl.pts.length - 1, 2)];
  gems.push([gp[0], gp[1], T.chance(0.5) ? 'sun' : 'moon']);
  const ow = 2, ox = T.ri(2, w - 2 - ow);
  const exits = openRow0(g, ox, ow);
  const sunA = T.chance(0.5);
  const plan = [
    { sun: [sunA ? a : b, h], moon: [sunA ? b : a, h] },
    { sun: [sunA ? la.x : lb.x, 1], moon: [sunA ? lb.x : la.x, 1] },
    { sun: [exits[0], -1], moon: [exits[1], -1] },
  ];
  return { g, plan, gems, exits, kind: 'crumble' };
}

function bSplit(ctx) {
  const { w, T } = ctx;
  const h = 6;
  const g = grid(w, h);
  const mid = Math.floor(w / 2);
  fill(g, mid, 1, mid, h - 1, '#');
  fill(g, 1, h - 1, w - 2, h - 1, '#');
  const sunLeft = T.chance(0.5);
  const lz = T.ri(2, mid - 2), rz = T.ri(mid + 2, w - 3);
  put(g, lz, h - 1, sunLeft ? 'Z' : 'z'); put(g, rz, h - 1, sunLeft ? 'z' : 'Z');
  const half = (x0, x1, own) => {
    const bad = own === 'sun' ? 'W' : 'L', good = own === 'sun' ? 'L' : 'W';
    const gems = [];
    const y1 = T.ri(2, 3);
    fill(g, x0, y1, x1, y1, good);
    gems.push([T.ri(x0, x1), y1, own]);
    const by = y1 + 1 <= h - 2 ? y1 + 1 : y1 - 1;
    const bx = T.ri(x0, x1);
    if (get(g, bx, by) === '.' && by !== 1) put(g, bx, by, bad);
    return gems;
  };
  const gems = [...half(1, mid - 1, sunLeft ? 'sun' : 'moon'), ...half(mid + 1, w - 2, sunLeft ? 'moon' : 'sun')];
  const lx = T.ri(1, mid - 2), rx = T.ri(mid + 1, w - 3);
  g[0][lx] = '.'; g[0][rx] = '.';
  const sx = sunLeft ? lx : rx, mx = sunLeft ? rx : lx;
  const plan = [
    { sun: [sunLeft ? lz : rz, h], moon: [sunLeft ? rz : lz, h] },
    { sun: [sx, -1], moon: [mx, -1] },
  ];
  return { g, plan, gems, exits: [lx, rx], kind: 'split' };
}

function bPortal(ctx) {
  const { w, T, tp } = ctx;
  const h = 7;
  const g = grid(w, h);
  fill(g, 1, 4, w - 2, 4, '#');
  const d1 = String(tp.next++);
  const bLeft = T.chance(0.5);
  const bx = bLeft ? T.ri(1, 2) : T.ri(w - 3, w - 2);
  const ax = T.ri(Math.floor(w / 3), Math.floor(w * 2 / 3));
  put(g, ax, 5, d1); put(g, bx, 3, d1);
  const gems = [];
  let pocket = null;
  if (tp.next <= 4 && T.chance(0.7)) {
    const d2 = String(tp.next++);
    const px0 = bLeft ? w - 4 : 1;
    fill(g, px0, 1, px0 + 2, 3, '#');
    put(g, px0 + 1, 2, d2);
    const gx = bLeft ? px0 + 2 : px0;
    put(g, gx, 2, '.');
    gems.push([gx, 2, T.chance(0.5) ? 'sun' : 'moon']);
    const cx = bLeft ? 1 : w - 2;
    put(g, cx, 5, d2);
    pocket = px0;
  }
  if (T.chance(0.6)) {
    const hx = T.ri(2, w - 4);
    if (Math.abs(hx - ax) > 1 && Math.abs(hx + 1 - ax) > 1 && get(g, hx, 6) === '.' && get(g, hx + 1, 6) === '.') fill(g, hx, 6, hx + 1, 6, 'P');
  }
  if (T.chance(0.5)) gems.push([bLeft ? T.ri(w - 3, w - 2) : T.ri(1, 2), 7, T.chance(0.5) ? 'sun' : 'moon']);
  const ow = 2;
  const lo = bLeft ? 4 : (pocket != null ? 5 : 2), hi = bLeft ? (pocket != null ? w - 7 : w - 4) : w - 6;
  const ox = T.ri(Math.min(lo, hi), Math.max(lo, hi));
  const exits = openRow0(g, ox, ow);
  const nx = bx + (bLeft ? 1 : -1);
  const plan = [
    { sun: [nx, 3], moon: [nx, 2], max: 40 },
    { sun: [exits[0], -1], moon: [exits[1], -1] },
  ];
  return { g, plan, gems: gems.filter(([x, y]) => get(g, x, y) === '.'), exits, kind: 'portal' };
}

function bIce(ctx) {
  const { w, T } = ctx;
  const h = 6;
  const g = grid(w, h);
  fill(g, 1, 2, w - 2, h - 1, 'I');
  const laneA = T.ri(3, Math.floor(w / 2) - 1), laneB = laneA + 2;
  const gems = [];
  const pool = (x, y, ch) => { if (Math.abs(x - laneA) <= 1 || Math.abs(x - laneB) <= 1) return false; if (get(g, x, y) !== 'I') return false; put(g, x, y, ch); return true; };
  for (let i = 0; i < 6; i++) { const x = T.ri(1, w - 2), y = T.ri(2, h - 2); pool(x, y, T.chance(0.5) ? 'L' : 'W'); }
  for (let i = 0; i < 2; i++) {
    const x = T.ri(1, w - 2), y = T.ri(2, h - 2);
    if (Math.abs(x - laneA) > 1 && Math.abs(x - laneB) > 1 && get(g, x, y) === 'I') gems.push([x, y, T.chance(0.5) ? 'sun' : 'moon']);
  }
  const exits = openRow0(g, laneA, 1).concat(openRow0(g, laneB, 1));
  const plan = [
    { sun: [laneA, h], moon: [laneB, h] },
    { sun: [laneA, 1], moon: [laneB, 1] },
    { sun: [laneA, -1], moon: [laneB, -1] },
  ];
  return { g, plan, gems, exits, kind: 'ice' };
}

function bTimed(ctx) {
  const { w, T } = ctx;
  const h = 7;
  const g = grid(w, h);
  fill(g, 1, 4, w - 2, 4, '#');
  const doorLeft = T.chance(0.5);
  const dx = doorLeft ? T.ri(2, 4) : T.ri(w - 5, w - 3);
  put(g, dx, 4, 'Q');
  const t1x = doorLeft ? w - 2 : 1, t2x = doorLeft ? w - 2 : 1;
  put(g, t1x, 7, 't'); put(g, t2x, 1, 't');
  const wx = Math.floor(w / 2);
  fill(g, wx, 5, wx, 6, '#');
  const gems = [[doorLeft ? 1 : w - 2, 1, T.chance(0.5) ? 'sun' : 'moon']];
  const ow = 2, ox = T.ri(2, w - 2 - ow);
  const exits = openRow0(g, ox, ow);
  const first = T.chance(0.5) ? 'sun' : 'moon', second = first === 'sun' ? 'moon' : 'sun';
  const plan = [
    { [first]: [t1x, 7], [second]: [dx, 5] },
    { [first]: 'stay', [second]: [dx, 3] },
    { [second]: [t2x, 1], [first]: [dx, 5] },
    { [second]: 'stay', [first]: [dx, 3] },
    { sun: [exits[0], -1], moon: [exits[1], -1] },
  ];
  return { g, plan, gems, exits, kind: 'timed' };
}

function bHall(ctx) {
  const { w, T } = ctx;
  const h = T.ri(5, 6);
  const g = grid(w, h);
  const gems = [];
  const lane = T.ri(3, w - 4);
  for (let i = 0; i < 5; i++) {
    const bw = T.ri(2, 3), bh = T.ri(1, 2);
    const x = T.ri(1, w - 1 - bw), y = T.ri(2, h - 1 - bh);
    if (x <= lane + 1 && x + bw - 1 >= lane - 1) continue;
    const ch = T.pick(['L', 'W', 'L', 'W', 'P']);
    let free = true;
    for (let yy = y - 1; yy <= y + bh; yy++) for (let xx = x - 1; xx <= x + bw; xx++) { const c = get(g, xx, yy); if (c !== '.' && c !== '#') free = false; }
    if (!free) continue;
    fill(g, x, y, x + bw - 1, y + bh - 1, ch);
    if (ch !== 'P' && T.chance(0.7)) gems.push([x + T.ri(0, bw - 1), y, ch === 'L' ? 'sun' : 'moon']);
  }
  pillars(g, T, 3, (x) => Math.abs(x - lane) <= 1);
  const ow = T.ri(2, 3);
  const ox = Math.max(1, Math.min(w - 1 - ow, lane - 1));
  const exits = openRow0(g, ox, ow);
  const plan = [{ sun: [exits[0], -1], moon: [exits[1], -1] }];
  return { g, plan, gems, exits, kind: 'hall' };
}

const BUILD = { gate: bGate, plate: bPlate, bridge: bBridge, code: bCode, fires: bFires, spikes: bSpikes, crumble: bCrumble, split: bSplit, portal: bPortal, ice: bIce, timed: bTimed, hall: bHall };
const UNIQUE = new Set(['plate', 'code', 'fires', 'timed']);
const TIERS = [
  ['gate', 'plate', 'bridge', 'split', 'hall'],
  ['portal', 'spikes', 'code', 'crumble'],
  ['fires', 'timed', 'ice'],
];

function chooseRooms(T, depth, theme) {
  const n = Math.min(6, 1 + Math.ceil(depth / 2) + (depth > 2 && T.chance(0.4) ? 1 : 0));
  const pool = [...TIERS[0], ...(depth >= 2 ? TIERS[1] : []), ...(depth >= 3 ? TIERS[2] : [])];
  const out = [];
  let gates = 0;
  for (let i = 0; i < n * 6 && out.length < n; i++) {
    let k = T.pick(pool);
    if (theme === 'ice' && depth >= 2 && !out.includes('ice') && T.chance(0.4)) k = 'ice';
    if (k === 'gate' && gates >= 2) continue;
    if (UNIQUE.has(k) && out.includes(k)) continue;
    if (out.length && out[out.length - 1] === k) continue;
    if (k !== 'hall' && k !== 'gate' && out.filter((x) => x === k).length >= 1 && T.chance(0.7)) continue;
    if (k === 'gate') gates++;
    out.push(k);
  }
  return out;
}

export function genTemple(rs, depth, salt, opts) {
  const o = opts || {};
  const rng = rngOf(hashStr(`${rs}|${depth}|${salt || 0}`));
  const T = tools(rng);
  const theme = o.theme || THEME_IDS[(hashStr(String(rs)) + depth) % THEME_IDS.length];
  const w = o.w || (depth >= 4 && T.chance(0.35) ? 17 : 15);
  const rooms = o.rooms || chooseRooms(T, depth, theme);
  const chest = o.chest != null ? o.chest : depth >= 2 && T.chance(0.5);
  const bands = [];
  const ctx = { w, T, depth, tp: { next: 1 } };
  const start = bStart({ ...ctx });
  bands.push(start);
  let entry = start.exits;
  let gateUse = 0;
  for (const k of rooms) {
    const b = BUILD[k]({ ...ctx, entry, gate: k === 'gate' ? (gateUse++ === 0 ? 'H' : 'J') : null });
    b.entry = entry;
    bands.push(b);
    entry = b.exits;
  }
  bands.push(bExit({ ...ctx, entry, chest }));
  const rows = [];
  const offs = [];
  let y = 0;
  for (let i = bands.length - 1; i >= 0; i--) { offs[i] = y; bands[i].g.forEach((r) => rows.push(r)); y += bands[i].g.length; }
  const bottom = [];
  for (let x = 0; x < w; x++) bottom.push('#');
  rows.push(bottom);
  const gems = [];
  const plan = [];
  for (let i = 0; i < bands.length; i++) {
    const b = bands[i], oy = offs[i];
    b.gems.forEach(([gx, gy, k]) => { if (rows[gy + oy][gx] !== '#' && !gems.some(([a, c]) => a === gx && c === gy + oy)) gems.push([gx, gy + oy, k]); });
    if (i < bands.length - 1 && i > 0) {
      const fy = oy + b.g.length - 1;
      const cand = (b.entry || []).map((x) => x + 1).concat((b.entry || []).map((x) => x - 1)).filter((x) => x > 0 && x < w - 1 && rows[fy][x] === '.');
      if (cand.length) rows[fy][T.pick(cand)] = 'f';
    }
    b.plan.forEach((st) => {
      const s2 = { ...st };
      for (const who of ['sun', 'moon']) if (Array.isArray(st[who])) s2[who] = [st[who][0], st[who][1] + oy];
      plan.push(s2);
    });
  }
  const NM = NAMES[theme];
  const name = `${T.pick(NM[0])} ${T.pick(NM[1])}`;
  const main = rooms.filter((k) => k !== 'hall');
  const goal = GOALS[main.length ? main[T.ri(0, main.length - 1)] : 'hall'];
  return { name, goal, theme, map: rows.map((r) => r.join('')), gems, plan, rooms, depth, gen: true };
}
