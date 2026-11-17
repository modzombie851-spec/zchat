export const CELL = 2;
export const WALL_H = 2.5;
export const DOOR_W = 0.96;
export const EXIT_W = 1.96;
export const PROP = {
  bed: [1.1, 2.51, 0.92], bench: [1.65, 0.55, 0.89], cab1: [1.9, 0.74, 0.81], cab2: [1.01, 0.49, 0.65], cab3: [0.65, 0.54, 0.78],
  chair: [0.56, 0.66, 0.95], table: [1.74, 1.17, 0.75], wheelchair: [0.7, 1.04, 0.95], iv: [0.5, 0.5, 1.8], mag: [0.19, 0.27, 0.01],
  locker: [0.56, 0.58, 1.86],
};

export function rng(seed) {
  let a = (seed >>> 0) || 1;
  const f = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  f.int = (n) => Math.floor(f() * n);
  f.pick = (arr) => arr[Math.floor(f() * arr.length)];
  f.range = (a0, b0) => a0 + f() * (b0 - a0);
  f.chance = (p) => f() < p;
  f.shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(f() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
  return f;
}

const E_OPEN = 0, E_WALL = 1, E_DOOR = 2, E_WINDOW = 3, E_EXIT = 4, E_ARCH = 5;
export const EDGE = { OPEN: E_OPEN, WALL: E_WALL, DOOR: E_DOOR, WINDOW: E_WINDOW, EXIT: E_EXIT, ARCH: E_ARCH };

function splitLen(R, total, min, max) {
  const out = [];
  let left = total;
  while (left > 0) {
    if (left <= max) { if (left < min && out.length) { out[out.length - 1] += left; } else out.push(left); break; }
    let n = min + R.int(max - min + 1);
    if (left - n > 0 && left - n < min) n = left - min >= min ? left - min : left;
    out.push(n);
    left -= n;
  }
  return out;
}

export function makeLevel(seed, size = 0) {
  const R = rng(seed * 7919 + 13);
  const W = size === 1 ? 18 : 22, H = size === 1 ? 14 : 16;
  const D = 3;
  const reg = new Int16Array(W * H).fill(-1);
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? -2 : reg[y * W + x]);
  const rooms = [];
  const addRoom = (x0, y0, w, h, type) => {
    const id = rooms.length + 1;
    rooms.push({ id, x: x0, y: y0, w, h, type, doors: [] });
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) reg[y * W + x] = id;
    return id;
  };
  const cx = Math.floor(W / 2) + (R.chance(0.5) ? 0 : -1);
  for (let y = D; y <= H - 1 - D; y++) for (let x = D; x <= W - 1 - D; x++) {
    if (x === D || x === W - 1 - D || y === D || y === H - 1 - D || x === cx) reg[y * W + x] = 0;
  }
  const lobbyW = 6;
  const lobbyX = D + 1 + R.int(Math.max(1, W - 2 * D - lobbyW - 1));
  const lobby = addRoom(lobbyX, H - D, lobbyW, D, 'lobby');
  const bandTop = splitLen(R, W, 3, 5);
  let x = 0;
  for (const n of bandTop) { addRoom(x, 0, n, D, 'band'); x += n; }
  const left = lobbyX, right = W - lobbyX - lobbyW;
  x = 0;
  for (const n of splitLen(R, left, 3, 5)) { addRoom(x, H - D, n, D, 'band'); x += n; }
  x = lobbyX + lobbyW;
  for (const n of splitLen(R, right, 3, 5)) { addRoom(x, H - D, n, D, 'band'); x += n; }
  let y = D;
  for (const n of splitLen(R, H - 2 * D, 2, 4)) { addRoom(0, y, D, n, 'band'); y += n; }
  y = D;
  for (const n of splitLen(R, H - 2 * D, 2, 4)) { addRoom(W - D, y, D, n, 'band'); y += n; }
  for (const [bx0, bx1] of [[D + 1, cx - 1], [cx + 1, W - D - 2]]) {
    const bw = bx1 - bx0 + 1;
    if (bw <= 0) continue;
    y = D + 1;
    const hs = splitLen(R, H - 2 * D - 2, 2, 4);
    for (const n of hs) {
      if (bw >= 6 && R.chance(0.45)) {
        const a = 2 + R.int(bw - 3);
        addRoom(bx0, y, a, n, 'core');
        addRoom(bx0 + a, y, bw - a, n, 'core');
      } else addRoom(bx0, y, bw, n, 'core');
      y += n;
    }
  }
  for (let i = 0; i < W * H; i++) if (reg[i] === -1) reg[i] = 0;
  const hE = new Uint8Array((H + 1) * W), vE = new Uint8Array(H * (W + 1));
  for (let yy = 0; yy <= H; yy++) for (let xx = 0; xx < W; xx++) {
    const a = at(xx, yy - 1), b = at(xx, yy);
    hE[yy * W + xx] = a === b ? E_OPEN : E_WALL;
  }
  for (let yy = 0; yy < H; yy++) for (let xx = 0; xx <= W; xx++) {
    const a = at(xx - 1, yy), b = at(xx, yy);
    vE[yy * (W + 1) + xx] = a === b ? E_OPEN : E_WALL;
  }
  const doorEdges = [];
  const edgeCells = (e) => (e.h ? [[e.x, e.y - 1], [e.x, e.y]] : [[e.x - 1, e.y], [e.x, e.y]]);
  const setE = (e, v) => { if (e.h) hE[e.y * W + e.x] = v; else vE[e.y * (W + 1) + e.x] = v; };
  const getE = (e) => (e.h ? hE[e.y * W + e.x] : vE[e.y * (W + 1) + e.x]);
  const roomEdges = (rm, other) => {
    const list = [];
    for (let yy = rm.y; yy < rm.y + rm.h; yy++) for (let xx = rm.x; xx < rm.x + rm.w; xx++) {
      for (const [dx, dy, e] of [[0, -1, { h: 1, x: xx, y: yy }], [0, 1, { h: 1, x: xx, y: yy + 1 }], [-1, 0, { h: 0, x: xx, y: yy }], [1, 0, { h: 0, x: xx + 1, y: yy }]]) {
        const r2 = at(xx + dx, yy + dy);
        if (r2 === rm.id) continue;
        if (other(r2)) list.push({ ...e, to: r2 });
      }
    }
    return list;
  };
  const addDoor = (e, rm) => {
    setE(e, E_DOOR);
    const id = doorEdges.length;
    doorEdges.push({ ...e, id, room: rm.id });
    rm.doors.push(id);
  };
  for (const rm of rooms) {
    if (rm.type === 'lobby') continue;
    const cand = roomEdges(rm, (r2) => r2 === 0);
    if (!cand.length) continue;
    const mid = cand.filter((e) => { const [[ax, ay], [bx, by]] = edgeCells(e); const inner = at(ax, ay) === rm.id ? [ax, ay] : [bx, by]; const nx = inner[0], ny = inner[1]; return !(nx === rm.x && ny === rm.y) && !(nx === rm.x + rm.w - 1 && ny === rm.y + rm.h - 1) && !(nx === rm.x && ny === rm.y + rm.h - 1) && !(nx === rm.x + rm.w - 1 && ny === rm.y); });
    const pool = mid.length ? mid : cand;
    addDoor(R.pick(pool), rm);
    if (rm.type === 'core' && rm.w >= 4 && R.chance(0.5)) {
      const far = pool.filter((e) => Math.abs((e.h ? e.x : e.y) - (doorEdges[rm.doors[0]].h ? doorEdges[rm.doors[0]].x : doorEdges[rm.doors[0]].y)) >= 3 || e.h !== doorEdges[rm.doors[0]].h);
      if (far.length) addDoor(R.pick(far), rm);
    }
  }
  for (let pass = 0; pass < 3; pass++) for (const rm of rooms) {
    if (rm.type === 'lobby' || rm.doors.length) continue;
    const nb = roomEdges(rm, (r2) => r2 > 0 && r2 !== rm.id && rooms[r2 - 1].doors.length > 0);
    if (nb.length) { const e = R.pick(nb); addDoor(e, rm); rooms[e.to - 1].doors.push(doorEdges.length - 1); }
  }
  const lob = rooms[lobby - 1];
  const lobCand = roomEdges(lob, (r2) => r2 === 0);
  const lobTop = lobCand.filter((e) => e.h);
  R.shuffle(lobTop);
  for (const e of lobTop.slice(0, 3)) setE(e, E_ARCH);
  const exitX = lob.x + Math.floor(lob.w / 2);
  setE({ h: 1, x: exitX - 1, y: H }, E_EXIT);
  setE({ h: 1, x: exitX, y: H }, E_EXIT);
  for (const rm of rooms) {
    if (rm.type === 'lobby') continue;
    const nb = roomEdges(rm, (r2) => r2 > 0 && r2 !== rm.id && rooms[r2 - 1].type !== 'lobby');
    if (nb.length && R.chance(0.3)) {
      const e = R.pick(nb);
      if (getE(e) === E_WALL) { addDoor(e, rm); rooms[e.to - 1].doors.push(doorEdges.length - 1); }
    }
  }
  for (let xx = 0; xx < W; xx++) for (const yy of [0, H]) {
    const e = { h: 1, x: xx, y: yy };
    const r0 = at(xx, yy === 0 ? 0 : H - 1);
    if (getE(e) === E_WALL && r0 > 0 && rooms[r0 - 1].type !== 'lobby' && R.chance(0.45)) setE(e, E_WINDOW);
  }
  for (let yy = 0; yy < H; yy++) for (const xx of [0, W]) {
    const e = { h: 0, x: xx, y: yy };
    const r0 = at(xx === 0 ? 0 : W - 1, yy);
    if (getE(e) === E_WALL && r0 > 0 && R.chance(0.45)) setE(e, E_WINDOW);
  }
  const types = ['ward', 'ward', 'ward', 'office', 'office', 'storage', 'waiting', 'exam', 'exam'];
  const core = [], band = [];
  for (const rm of rooms) { if (rm.type === 'core') core.push(rm); else if (rm.type === 'band') band.push(rm); }
  for (const rm of [...band, ...core]) {
    let t = R.pick(types);
    if (Math.min(rm.w, rm.h) < 2 && t === 'ward') t = 'storage';
    if (rm.w * rm.h <= 4 && (t === 'ward' || t === 'waiting')) t = R.pick(['office', 'storage', 'exam']);
    rm.type = t;
  }
  const doors = doorEdges.map((e) => {
    const [[ax, ay], [bx, by]] = edgeCells(e);
    const ra = at(ax, ay), rb = at(bx, by);
    const roomSide = ra > 0 && (rb <= 0 || rooms[ra - 1].id === e.room) ? 0 : 1;
    const wx = e.h ? e.x * CELL + 1 : e.x * CELL;
    const wz = e.h ? e.y * CELL : e.y * CELL + 1;
    const flip = R.chance(0.5) ? 1 : -1;
    const st = R();
    const open = st < 0.45 ? 1 : st < 0.75 ? 0.25 + R() * 0.35 : 0;
    return { id: e.id, h: e.h, x: wx, z: wz, cx: e.x, cy: e.y, side: roomSide === 0 ? -1 : 1, flip, open, room: e.room, kind: R.chance(0.6) ? 'door' : 'door2' };
  });
  const lv = { seed, W, H, reg, rooms, hE, vE, doors, props: [], lamps: [], signs: [], spots: [], hides: [], cross: cx };
  furnish(lv, R);
  lightUp(lv, R);
  lv.exit = { x: exitX * CELL, z: H * CELL, yaw: Math.PI };
  const spawnCells = [];
  for (let yy = D; yy <= H - 1 - D; yy++) for (let xx = D; xx <= W - 1 - D; xx++) if (reg[yy * W + xx] === 0) spawnCells.push([xx, yy]);
  const lobCx = exitX, lobCy = H - D;
  spawnCells.sort((a, b) => Math.hypot(a[0] - lobCx, a[1] - lobCy) - Math.hypot(b[0] - lobCx, b[1] - lobCy));
  const runLen = (xx, yy, dx, dy) => { let n = 0; let cx2 = xx, cy2 = yy; for (let i = 0; i < 12; i++) { const nx = cx2 + dx, ny = cy2 + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) break; const e = dy ? hE[(dy > 0 ? ny : cy2) * W + nx] : vE[ny * (W + 1) + (dx > 0 ? nx : cx2)]; if (e !== E_OPEN && e !== E_ARCH) break; n++; cx2 = nx; cy2 = ny; } return n; };
  lv.spawn = spawnCells.slice(0, 4).map(([xx, yy]) => {
    const dirs = [[0, -1, Math.PI], [0, 1, 0], [-1, 0, -Math.PI / 2], [1, 0, Math.PI / 2]].map(([dx, dy, yaw]) => [runLen(xx, yy, dx, dy), yaw]).sort((a, b) => b[0] - a[0]);
    return { x: xx * CELL + 1, z: yy * CELL + 1, yaw: dirs[0][1] };
  });
  const far = spawnCells.slice().sort((a, b) => Math.hypot(b[0] - lobCx, b[1] - lobCy) - Math.hypot(a[0] - lobCx, a[1] - lobCy));
  lv.monsterStart = { x: far[0][0] * CELL + 1, z: far[0][1] * CELL + 1 };
  lv.solid = buildSolid(lv);
  lv.nav = buildNav(lv);
  const reach = flood(lv, lv.spawn[0].x, lv.spawn[0].z);
  lv.reach = reach;
  const ok = (x, z) => reach[Math.floor(z / lv.nav.S) * lv.nav.NW + Math.floor(x / lv.nav.S)] === 1;
  lv.spots = lv.spots.filter((sp) => { const c = [[0, 0], [0.4, 0], [-0.4, 0], [0, 0.4], [0, -0.4], [0.7, 0], [-0.7, 0], [0, 0.7], [0, -0.7], [1.2, 0], [-1.2, 0], [0, 1.2], [0, -1.2]]; return c.some(([dx, dz]) => ok(sp.x + dx, sp.z + dz)); });
  for (const hd of lv.hides) if (lv.props[hd.prop]) delete lv.props[hd.prop].hide;
  lv.hides = lv.hides.filter((hd) => [[0.9, 0], [-0.9, 0], [0, 0.9], [0, -0.9], [0, 1.5], [0, -1.5], [1.5, 0], [-1.5, 0]].some(([dx, dz]) => ok(hd.x + dx, hd.z + dz)));
  lv.hides.forEach((hd, i) => { hd.id = i; if (lv.props[hd.prop]) lv.props[hd.prop].hide = i; });
  if (!ok(lv.monsterStart.x, lv.monsterStart.z)) lv.monsterStart = { ...lv.spawn[lv.spawn.length - 1] };
  return lv;
}

function propBox(k, x, z, yaw, pad = 0) {
  const s = PROP[k];
  const q = Math.round(yaw / (Math.PI / 2)) & 3;
  const hw = (q & 1 ? s[1] : s[0]) / 2 + pad, hd = (q & 1 ? s[0] : s[1]) / 2 + pad;
  return [x - hw, z - hd, x + hw, z + hd];
}

function furnish(lv, R) {
  const { W, rooms, reg } = lv;
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= lv.H ? -2 : reg[y * W + x]);
  const occ = [];
  const clear = (b) => occ.every((o) => b[2] <= o[0] || b[0] >= o[2] || b[3] <= o[1] || b[1] >= o[3]);
  const doorKeep = [];
  for (const d of lv.doors) {
    const r = 1.25;
    doorKeep.push([d.x - (d.h ? 0.7 : r), d.z - (d.h ? r : 0.7), d.x + (d.h ? 0.7 : r), d.z + (d.h ? r : 0.7)]);
  }
  occ.push(...doorKeep);
  for (let y = 0; y <= lv.H; y++) for (let x = 0; x < W; x++) if (lv.hE[y * W + x] === EDGE.ARCH) occ.push([x * 2 - 0.2, y * 2 - 1.4, x * 2 + 2.2, y * 2 + 1.4]);
  for (let y = 0; y < lv.H; y++) for (let x = 0; x <= W; x++) if (lv.vE[y * (W + 1) + x] === EDGE.ARCH) occ.push([x * 2 - 1.4, y * 2 - 0.2, x * 2 + 1.4, y * 2 + 2.2]);
  const put = (k, x, z, yaw, extra = {}) => {
    const b = propBox(k, x, z, yaw, 0.04);
    if (!clear(b)) return null;
    occ.push(b);
    const p = { k, x, z, yaw: yaw + (extra.jit ? extra.jit : 0), box: propBox(k, x, z, yaw), ...extra };
    delete p.jit;
    lv.props.push(p);
    return p;
  };
  const walls = (rm) => {
    const out = [];
    for (let y = rm.y; y < rm.y + rm.h; y++) for (let x = rm.x; x < rm.x + rm.w; x++) {
      if (at(x, y - 1) !== rm.id) out.push({ x: x * 2 + 1, z: y * 2, nx: 0, nz: 1, yaw: 0 });
      if (at(x, y + 1) !== rm.id) out.push({ x: x * 2 + 1, z: y * 2 + 2, nx: 0, nz: -1, yaw: Math.PI });
      if (at(x - 1, y) !== rm.id) out.push({ x: x * 2, z: y * 2 + 1, nx: 1, nz: 0, yaw: Math.PI / 2 });
      if (at(x + 1, y) !== rm.id) out.push({ x: x * 2 + 2, z: y * 2 + 1, nx: -1, nz: 0, yaw: -Math.PI / 2 });
    }
    return R.shuffle(out);
  };
  const along = (w, depth, k, extra, sideOff = 0) => {
    const yaw = w.yaw;
    const x = w.x + w.nx * (depth + 0.1) + (w.nz !== 0 ? sideOff : 0);
    const z = w.z + w.nz * (depth + 0.1) + (w.nx !== 0 ? sideOff : 0);
    return put(k, x, z, yaw, extra);
  };
  const hideSpot = (p, kind) => { if (!p) return; const id = lv.hides.length; lv.hides.push({ id, x: p.x, z: p.z, yaw: p.yaw, k: kind, prop: lv.props.length - 1 }); p.hide = id; };
  const lockers = (w, n) => {
    let made = 0;
    const offs = n === 1 ? [0] : n === 2 ? [-0.29, 0.29] : [-0.58, 0, 0.58];
    for (const o of offs) { const p = along(w, 0.3, 'locker', {}, o); if (p) { hideSpot(p, 'locker'); made++; } }
    return made;
  };
  for (const rm of rooms) {
    const ws = walls(rm);
    const cx = (rm.x + rm.w / 2) * 2, cz = (rm.y + rm.h / 2) * 2;
    const t = rm.type;
    if (t === 'ward') {
      let beds = 0;
      for (const w of ws) {
        if (beds >= Math.min(4, Math.floor(rm.w * rm.h / 2))) break;
        const b = along(w, 1.26, 'bed', { jit: R.range(-0.05, 0.05) });
        if (b) {
          beds++; hideSpot(b, 'bed');
          const sx = w.nz !== 0 ? 1 : 0, sz = w.nx !== 0 ? 1 : 0;
          const s = R.chance(0.5) ? 1 : -1;
          put('iv', w.x + w.nx * 0.45 + sx * s * 0.95, w.z + w.nz * 0.45 + sz * s * 0.95, R.range(0, 6.28));
          put('cab3', w.x + w.nx * 0.4 - sx * s * 0.95, w.z + w.nz * 0.4 - sz * s * 0.95, w.yaw);
        }
      }
      if (R.chance(0.3)) for (const w of ws) { if (lockers(w, 1)) break; }
      if (R.chance(0.5)) put('wheelchair', cx + R.range(-1, 1), cz + R.range(-1, 1), R.range(0, 6.28));
      if (R.chance(0.5)) put('chair', cx + R.range(-1.5, 1.5), cz + R.range(-1.5, 1.5), R.range(0, 6.28));
    } else if (t === 'office') {
      const tb = put('table', cx, cz, R.chance(0.5) ? 0 : Math.PI / 2);
      if (tb) {
        hideSpot(tb, 'table');
        const n = 2 + R.int(3);
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 + R.range(-0.3, 0.3);
          const rx = 1.25, rz = 1.0;
          const tipped = R.chance(0.2);
          put('chair', cx + Math.cos(a) * rx, cz + Math.sin(a) * rz, -a - Math.PI / 2 + R.range(-0.4, 0.4), tipped ? { tip: 1 } : {});
        }
        if (R.chance(0.7)) lv.props.push({ k: 'mag', x: cx + R.range(-0.5, 0.5), z: cz + R.range(-0.3, 0.3), y: 0.75, yaw: R.range(0, 6.28), box: null });
      }
      if (R.chance(0.55)) for (const w of ws) { if (lockers(w, R.chance(0.4) ? 2 : 1)) break; }
      for (const w of ws.slice(0, 3)) along(w, 0.38, R.pick(['cab1', 'cab2', 'cab3']), {});
    } else if (t === 'storage') {
      let n = 0, lk = 0;
      for (const w of ws) { if (lk >= 1) break; const m = lockers(w, R.chance(0.5) ? 3 : 2); if (m) { lk++; n += m; } }
      for (const w of ws) { if (n >= 7) break; if (along(w, 0.38, R.pick(['cab1', 'cab2', 'cab3', 'cab1']), {})) n++; }
      for (let i = 0; i < 2; i++) put(R.pick(['wheelchair', 'iv', 'chair']), cx + R.range(-1.2, 1.2), cz + R.range(-1.2, 1.2), R.range(0, 6.28), R.chance(0.25) ? { tip: 1 } : {});
    } else if (t === 'waiting') {
      let n = 0;
      for (const w of ws) { if (n >= 4) break; if (along(w, 0.3, 'bench', {})) n++; }
      if (R.chance(0.6)) { const tb = put('table', cx, cz, 0); if (tb) hideSpot(tb, 'table'); }
      for (let i = 0; i < 3; i++) lv.props.push({ k: 'mag', x: cx + R.range(-1.5, 1.5), z: cz + R.range(-1.5, 1.5), y: 0, yaw: R.range(0, 6.28), box: null });
    } else if (t === 'exam') {
      const b = put('bed', cx, cz, R.chance(0.5) ? 0 : Math.PI / 2);
      if (b) hideSpot(b, 'bed');
      if (R.chance(0.35)) for (const w of ws) { if (lockers(w, 1)) break; }
      put('iv', cx + 1.0, cz + 0.9, R.range(0, 6.28));
      for (const w of ws.slice(0, 2)) along(w, 0.3, R.pick(['cab2', 'cab3', 'cab1']), {});
      if (R.chance(0.5)) put('wheelchair', cx - 1.4, cz - 1.2, R.range(0, 6.28));
    } else if (t === 'lobby') {
      const ex = (rm.x + Math.floor(rm.w / 2)) * 2, ez = (rm.y + rm.h) * 2;
      occ.push([ex - 2.2, ez - 2.6, ex + 2.2, ez]);
      for (const w of ws) { if (w.nz === -1) continue; along(w, 0.3, R.chance(0.7) ? 'bench' : 'chair', {}); }
      const tb = put('table', cx + (R.chance(0.5) ? -3 : 3), cz - 0.6, 0);
      if (tb) hideSpot(tb, 'table');
      put('wheelchair', cx + R.range(-2, 2), cz - 1.5, R.range(0, 6.28));
    }
  }
  for (let y = 0; y < lv.H; y++) for (let x = 0; x < W; x++) {
    if (reg[y * W + x] !== 0) continue;
    if (R.chance(0.06)) {
      const sides = [[0, -1], [0, 1], [-1, 0], [1, 0]].filter(([dx, dy]) => at(x + dx, y + dy) !== 0 && at(x + dy, y + dx) === 0 && at(x - dy, y - dx) === 0);
      if (sides.length) {
        const [dx, dy] = R.pick(sides);
        const p = put('locker', x * 2 + 1 + dx * 0.6, y * 2 + 1 + dy * 0.6, dx !== 0 ? (dx > 0 ? -Math.PI / 2 : Math.PI / 2) : (dy > 0 ? Math.PI : 0));
        if (p) { hideSpot(p, 'locker'); continue; }
      }
    }
    if (!R.chance(0.09)) continue;
    const k = R.pick(['wheelchair', 'iv', 'chair', 'bench', 'chair']);
    const px = x * 2 + 1 + R.range(-0.5, 0.5), pz = y * 2 + 1 + R.range(-0.5, 0.5);
    const tip = k === 'chair' && R.chance(0.5);
    if (k === 'bench') {
      const sides = [[0, -1], [0, 1], [-1, 0], [1, 0]].filter(([dx, dy]) => at(x + dx, y + dy) !== 0);
      if (!sides.length) continue;
      const [dx, dy] = R.pick(sides);
      put('bench', x * 2 + 1 + dx * 0.68, y * 2 + 1 + dy * 0.68, dx !== 0 ? (dx > 0 ? -Math.PI / 2 : Math.PI / 2) : (dy > 0 ? Math.PI : 0));
    } else put(k, px, pz, R.range(0, 6.28), tip ? { tip: 1 } : {});
  }
  const spots = [];
  for (const p of lv.props) {
    if (p.k === 'table') spots.push({ x: p.x + R.range(-0.5, 0.5), z: p.z + R.range(-0.3, 0.3), y: 0.76 });
    else if (p.k === 'cab1' || p.k === 'cab2' || p.k === 'cab3') spots.push({ x: p.x, z: p.z, y: PROP[p.k][2] + 0.01 });
    else if (p.k === 'bed') spots.push({ x: p.x, z: p.z, y: 0.69 });
    else if (p.k === 'bench') spots.push({ x: p.x + R.range(-0.4, 0.4), z: p.z, y: 0.47 });
  }
  for (let y = 0; y < lv.H; y++) for (let x = 0; x < W; x++) if (reg[y * W + x] > 0 && R.chance(0.25)) spots.push({ x: x * 2 + 1 + R.range(-0.6, 0.6), z: y * 2 + 1 + R.range(-0.6, 0.6), y: 0.0, floor: 1 });
  lv.spots = spots.map((s, i) => ({ ...s, id: i, room: at(Math.floor(s.x / 2), Math.floor(s.z / 2)) }));
}

function lightUp(lv, R) {
  const { W, H, reg } = lv;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const r = reg[y * W + x];
    const corr = r === 0;
    if (corr ? (x + y) % 2 !== 0 : !(x % 2 === 0 && y % 2 === 0)) continue;
    const roll = R();
    const mode = roll < (corr ? 0.16 : 0.08) ? 1 : roll < (corr ? 0.2 : 0.1) ? 2 : 0;
    lv.lamps.push({ x: x * 2 + 1, z: y * 2 + 1, mode, ph: R() * 100, red: mode === 2 && R.chance(0.6) ? 1 : 0 });
  }
}

function buildSolid(lv) {
  const { W, H, hE, vE } = lv;
  const T = 0.11;
  const segs = [];
  for (let y = 0; y <= H; y++) for (let x = 0; x < W; x++) {
    const e = hE[y * W + x];
    if (e === EDGE.OPEN || e === EDGE.ARCH) continue;
    const z = y * 2, x0 = x * 2, x1 = x0 + 2;
    if (e === EDGE.DOOR) { segs.push([x0, z - T, x0 + 1 - DOOR_W / 2, z + T]); segs.push([x0 + 1 + DOOR_W / 2, z - T, x1, z + T]); }
    else if (e === EDGE.EXIT) segs.push([x0, z - T, x1, z + T, 1]);
    else segs.push([x0, z - T, x1, z + T]);
  }
  for (let y = 0; y < H; y++) for (let x = 0; x <= W; x++) {
    const e = vE[y * (W + 1) + x];
    if (e === EDGE.OPEN || e === EDGE.ARCH) continue;
    const xx = x * 2, z0 = y * 2, z1 = z0 + 2;
    if (e === EDGE.DOOR) { segs.push([xx - T, z0, xx + T, z0 + 1 - DOOR_W / 2]); segs.push([xx - T, z0 + 1 + DOOR_W / 2, xx + T, z1]); }
    else segs.push([xx - T, z0, xx + T, z1]);
  }
  for (const p of lv.props) if (p.box && !p.tip) segs.push([...p.box, 0, 1]);
  for (const p of lv.props) if (p.box && p.tip) { const c = [(p.box[0] + p.box[2]) / 2, (p.box[1] + p.box[3]) / 2]; segs.push([c[0] - 0.35, c[1] - 0.35, c[0] + 0.35, c[1] + 0.35, 0, 1]); }
  return segs;
}

function buildNav(lv) {
  const S = 0.5;
  const NW = lv.W * 2 / S, NH = lv.H * 2 / S;
  const block = new Uint8Array(NW * NH);
  for (const s of lv.solid) {
    const pad = s[5] ? 0.12 : 0.2;
    const x0 = Math.max(0, Math.ceil((s[0] - pad) / S - 0.5)), x1 = Math.min(NW - 1, Math.floor((s[2] + pad) / S - 0.5));
    const z0 = Math.max(0, Math.ceil((s[1] - pad) / S - 0.5)), z1 = Math.min(NH - 1, Math.floor((s[3] + pad) / S - 0.5));
    for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) if (block[z * NW + x] !== 1) block[z * NW + x] = s[5] ? 2 : 1;
  }
  const mblock = new Uint8Array(NW * NH);
  for (const s of lv.solid) {
    const pad = s[5] ? 0.34 : 0.4;
    const x0 = Math.max(0, Math.ceil((s[0] - pad) / S - 0.5)), x1 = Math.min(NW - 1, Math.floor((s[2] + pad) / S - 0.5));
    const z0 = Math.max(0, Math.ceil((s[1] - pad) / S - 0.5)), z1 = Math.min(NH - 1, Math.floor((s[3] + pad) / S - 0.5));
    for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) mblock[z * NW + x] = 1;
  }
  for (const d of lv.doors || []) {
    const ax = d.h ? 0.3 : 1.15, az = d.h ? 1.15 : 0.3;
    for (let z = Math.floor((d.z - az) / S); z <= Math.floor((d.z + az) / S); z++) for (let x = Math.floor((d.x - ax) / S); x <= Math.floor((d.x + ax) / S); x++) {
      if (x < 0 || z < 0 || x >= NW || z >= NH) continue;
      const i = z * NW + x;
      if (block[i] === 0) mblock[i] = 0;
    }
  }
  return { S, NW, NH, block, mblock };
}

function flood(lv, x, z) {
  const { S, NW, NH, block } = lv.nav;
  const out = new Uint8Array(NW * NH);
  const st = [Math.floor(z / S) * NW + Math.floor(x / S)];
  out[st[0]] = 1;
  while (st.length) {
    const i = st.pop(), ix = i % NW, iz = (i / NW) | 0;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const xx = ix + dx, zz = iz + dz;
      if (xx < 0 || zz < 0 || xx >= NW || zz >= NH) continue;
      const j = zz * NW + xx;
      if (out[j] || block[j]) continue;
      out[j] = 1; st.push(j);
    }
  }
  return out;
}

export function navPath(lv, x0, z0, x1, z1, opts = {}) {
  const { S, NW, NH } = lv.nav;
  const block = opts.mon && lv.nav.mblock ? lv.nav.mblock : lv.nav.block;
  const ci = (x, z) => Math.min(NH - 1, Math.max(0, Math.floor(z / S))) * NW + Math.min(NW - 1, Math.max(0, Math.floor(x / S)));
  let a = ci(x0, z0), b = ci(x1, z1);
  const free = (i) => block[i] === 0 || (opts.props && block[i] === 2);
  const near = (i) => {
    if (free(i)) return i;
    const ix = i % NW, iz = (i / NW) | 0;
    for (let r = 1; r < 6; r++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
      const x = ix + dx, z = iz + dz;
      if (x < 0 || z < 0 || x >= NW || z >= NH) continue;
      if (free(z * NW + x)) return z * NW + x;
    }
    return i;
  };
  a = near(a); b = near(b);
  const N = NW * NH;
  const g = opts.buf && opts.buf.g && opts.buf.g.length === N ? opts.buf.g : new Float32Array(N);
  const from = opts.buf && opts.buf.f && opts.buf.f.length === N ? opts.buf.f : new Int32Array(N);
  const seen = opts.buf && opts.buf.s && opts.buf.s.length === N ? opts.buf.s : new Uint32Array(N);
  if (opts.buf) { opts.buf.g = g; opts.buf.f = from; opts.buf.s = seen; opts.buf.gen = (opts.buf.gen || 0) + 1; }
  const gen = opts.buf ? opts.buf.gen : 1;
  if (!opts.buf) seen.fill(0);
  const bx = b % NW, bz = (b / NW) | 0;
  const heap = [];
  const push = (f, i) => { heap.push([f, i]); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
  const pop = () => { const t = heap[0], l = heap.pop(); if (heap.length) { heap[0] = l; let k = 0; for (;;) { const L = k * 2 + 1, Rr = L + 1; let m = k; if (L < heap.length && heap[L][0] < heap[m][0]) m = L; if (Rr < heap.length && heap[Rr][0] < heap[m][0]) m = Rr; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return t; };
  const h = (i) => { const x = i % NW, z = (i / NW) | 0; return Math.hypot(x - bx, z - bz); };
  g[a] = 0; from[a] = -1; seen[a] = gen; push(h(a), a);
  const limit = opts.limit || 1e9;
  let found = false, it = 0;
  while (heap.length && it++ < 20000) {
    const [, i] = pop();
    if (i === b) { found = true; break; }
    if (g[i] * S > limit) break;
    const ix = i % NW, iz = (i / NW) | 0;
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dz) continue;
      const x = ix + dx, z = iz + dz;
      if (x < 0 || z < 0 || x >= NW || z >= NH) continue;
      const j = z * NW + x;
      if (!free(j)) continue;
      if (dx && dz && (!free(iz * NW + x) || !free(z * NW + ix))) continue;
      const ng = g[i] + (dx && dz ? 1.4142 : 1) + (opts.cost ? opts.cost(j) : 0);
      if (seen[j] === gen && ng >= g[j]) continue;
      seen[j] = gen; g[j] = ng; from[j] = i;
      push(ng + h(j), j);
    }
  }
  if (!found) return null;
  const pts = [];
  for (let i = b; i >= 0; i = from[i]) { pts.push([(i % NW + 0.5) * S, (((i / NW) | 0) + 0.5) * S]); if (i === a) break; }
  pts.reverse();
  return { pts, len: g[b] * S };
}

export function collideCircle(lv, x, z, r, extra) {
  for (let it = 0; it < 3; it++) {
    let moved = false;
    const list = extra ? lv.solid.concat(extra) : lv.solid;
    for (const s of list) {
      if (x + r <= s[0] || x - r >= s[2] || z + r <= s[1] || z - r >= s[3]) continue;
      const nx = Math.max(s[0], Math.min(x, s[2])), nz = Math.max(s[1], Math.min(z, s[3]));
      let dx = x - nx, dz = z - nz;
      let d = Math.hypot(dx, dz);
      if (d >= r) continue;
      if (d < 1e-5) {
        const l = x - s[0], rr = s[2] - x, t = z - s[1], b = s[3] - z;
        const m = Math.min(l, rr, t, b);
        if (m === l) { x = s[0] - r; } else if (m === rr) { x = s[2] + r; } else if (m === t) { z = s[1] - r; } else { z = s[3] + r; }
      } else { const k = (r - d) / d; x += dx * k; z += dz * k; }
      moved = true;
    }
    if (!moved) break;
  }
  return [x, z];
}

export function lineBlocked(lv, x0, z0, x1, z1, doorsClosed) {
  const segs = lv.solid;
  const test = (s) => {
    let t0 = 0, t1 = 1;
    const dx = x1 - x0, dz = z1 - z0;
    for (const [p, q] of [[-dx, x0 - s[0]], [dx, s[2] - x0], [-dz, z0 - s[1]], [dz, s[3] - z0]]) {
      if (p === 0) { if (q < 0) return false; continue; }
      const r = q / p;
      if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; }
    }
    return t0 <= t1;
  };
  for (const s of segs) { if (s[5]) continue; if (test(s)) return true; }
  if (doorsClosed) for (const s of doorsClosed) if (test(s)) return true;
  return false;
}

export function cellAt(lv, x, z) {
  const cx = Math.floor(x / CELL), cy = Math.floor(z / CELL);
  if (cx < 0 || cy < 0 || cx >= lv.W || cy >= lv.H) return -2;
  return lv.reg[cy * lv.W + cx];
}
