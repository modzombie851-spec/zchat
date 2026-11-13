import { HOUSE, houseBlocked, stairT } from './zhouse.js';

const CLR = 0.3;

export function makeNav(o) {
  const { BX0, BZ0, GW, GH, CELL, block, solid } = o;
  const FC = HOUSE.R, K = Math.round(CELL / FC);
  const ri0 = Math.ceil((HOUSE.x0 - BX0) / CELL - 1e-6), ri1 = Math.floor((HOUSE.x1 - BX0) / CELL + 1e-6) - 1;
  const rj0 = Math.ceil((HOUSE.z0 - BZ0) / CELL - 1e-6), rj1 = Math.floor((HOUSE.z1 - BZ0) / CELL + 1e-6) - 1;
  const FX0 = BX0 + ri0 * CELL, FZ0 = BZ0 + rj0 * CELL;
  const FW = (ri1 - ri0 + 1) * K, FH = (rj1 - rj0 + 1) * K;
  const NC = GW * GH, NF = FW * FH, NN = NC + NF * 2;
  const inReg = (i, j) => i >= ri0 && i <= ri1 && j >= rj0 && j <= rj1;
  const free = new Uint8Array(NN), cost = new Float32Array(NN).fill(1);
  const cx = new Float32Array(NN), cz = new Float32Array(NN);
  for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
    const a = j * GW + i;
    free[a] = !block[a] && !inReg(i, j) ? 1 : 0;
    cx[a] = BX0 + (i + 0.5) * CELL; cz[a] = BZ0 + (j + 0.5) * CELL;
  }
  const blk = new Uint8Array(NF * 2);
  for (let lv = 0; lv < 2; lv++) for (let fz = 0; fz < FH; fz++) for (let fx = 0; fx < FW; fx++) {
    const x = FX0 + (fx + 0.5) * FC, z = FZ0 + (fz + 0.5) * FC, f = lv * NF + fz * FW + fx;
    cx[NC + f] = x; cz[NC + f] = z;
    blk[f] = houseBlocked(x, z, lv, false) || (!lv && solid && solid(x, z)) ? 1 : 0;
  }
  const M = Math.ceil(0.6 / FC);
  for (let lv = 0; lv < 2; lv++) for (let fz = 0; fz < FH; fz++) for (let fx = 0; fx < FW; fx++) {
    const f = lv * NF + fz * FW + fx;
    if (blk[f]) continue;
    let c2 = 1e9;
    for (let dz = -M; dz <= M; dz++) for (let dx = -M; dx <= M; dx++) {
      const nx = fx + dx, nz = fz + dz;
      if (nx < 0 || nz < 0 || nx >= FW || nz >= FH) continue;
      if (!blk[lv * NF + nz * FW + nx]) continue;
      const ex = Math.max(0, Math.abs(dx) - 0.5) * FC, ez = Math.max(0, Math.abs(dz) - 0.5) * FC, d2 = ex * ex + ez * ez;
      if (d2 < c2) c2 = d2;
    }
    const c = Math.sqrt(c2);
    if (c < CLR) continue;
    free[NC + f] = 1;
    cost[NC + f] = 1 + 2.5 * Math.max(0, 0.6 - c) / 0.6;
  }
  const adj = Array.from({ length: NN }, () => []);
  let ne = 0;
  const link = (a, b, w) => { if (free[a] && free[b]) { adj[a].push(b, w); adj[b].push(a, w); ne += 2; } };
  for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
    const a = j * GW + i;
    if (!free[a]) continue;
    for (const [di, dj] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
      const ni = i + di, nj = j + dj;
      if (ni < 0 || ni >= GW || nj < 0 || nj >= GH) continue;
      if (di && dj && (!free[j * GW + ni] || !free[nj * GW + i])) continue;
      link(a, nj * GW + ni, di && dj ? CELL * 1.414 : CELL);
    }
  }
  for (let lv = 0; lv < 2; lv++) {
    const base = NC + lv * NF;
    for (let fz = 0; fz < FH; fz++) for (let fx = 0; fx < FW; fx++) {
      const a = base + fz * FW + fx;
      if (!free[a]) continue;
      for (const [dx, dz] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
        const nx = fx + dx, nz = fz + dz;
        if (nx < 0 || nx >= FW || nz < 0 || nz >= FH) continue;
        if (dx && dz && (!free[base + fz * FW + nx] || !free[base + nz * FW + fx])) continue;
        const b = base + nz * FW + nx;
        link(a, b, (dx && dz ? FC * 1.414 : FC) * (cost[a] + cost[b]) * 0.5);
      }
    }
  }
  for (let f = 0; f < NF; f++) {
    const a = NC + f, b = NC + NF + f, t = stairT(cx[a], cz[a]);
    if (t >= 0.4 && t <= 0.6) link(a, b, 0.02);
  }
  const edge = (fx, fz, ci, cj) => {
    if (ci < 0 || ci >= GW || cj < 0 || cj >= GH) return;
    const a = NC + fz * FW + fx, b = cj * GW + ci;
    link(a, b, Math.hypot(cx[a] - cx[b], cz[a] - cz[b]));
  };
  for (let fz = 0; fz < FH; fz++) { const cj = rj0 + Math.floor(fz / K); edge(0, fz, ri0 - 1, cj); edge(FW - 1, fz, ri1 + 1, cj); }
  for (let fx = 0; fx < FW; fx++) { const ci = ri0 + Math.floor(fx / K); edge(fx, 0, ci, rj0 - 1); edge(fx, FH - 1, ci, rj1 + 1); }
  const isFine = (n) => n >= NC;
  const inFine = (x, z, pad) => x >= FX0 - pad && x < FX0 + FW * FC + pad && z >= FZ0 - pad && z < FZ0 + FH * FC + pad;

  const nodeAt = (x, z, lv) => {
    if (inFine(x, z, 0)) {
      const fx = Math.floor((x - FX0) / FC), fz = Math.floor((z - FZ0) / FC);
      const base = NC + (lv ? NF : 0), a = base + fz * FW + fx;
      if (free[a]) return a;
      let bn = -1, bd = 1e9;
      for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) {
        const nx = fx + dx, nz = fz + dz;
        if (nx < 0 || nz < 0 || nx >= FW || nz >= FH) continue;
        const b = base + nz * FW + nx;
        if (!free[b]) continue;
        const d = (cx[b] - x) ** 2 + (cz[b] - z) ** 2;
        if (d < bd) { bd = d; bn = b; }
      }
      return bn >= 0 ? bn : a;
    }
    const i = Math.floor((x - BX0) / CELL), j = Math.floor((z - BZ0) / CELL);
    if (i < 0 || i >= GW || j < 0 || j >= GH) return -1;
    return j * GW + i;
  };

  const cap = ne + NN + 64;
  const heap = new Int32Array(cap), hk = new Float32Array(cap);
  const solve = (seeds, fineOn) => {
    const dist = new Float32Array(NN).fill(Infinity);
    let hn = 0;
    const push = (n, d) => {
      let i = hn++;
      while (i > 0) { const p = (i - 1) >> 1; if (hk[p] <= d) break; heap[i] = heap[p]; hk[i] = hk[p]; i = p; }
      heap[i] = n; hk[i] = d;
    };
    const pop = () => {
      const top = heap[0], ln = heap[--hn], ld = hk[hn];
      let i = 0;
      for (;;) {
        let c = i * 2 + 1;
        if (c >= hn) break;
        if (c + 1 < hn && hk[c + 1] < hk[c]) c++;
        if (hk[c] >= ld) break;
        heap[i] = heap[c]; hk[i] = hk[c]; i = c;
      }
      heap[i] = ln; hk[i] = ld;
      return top;
    };
    for (const s of seeds) {
      const n = nodeAt(s.x, s.z, s.lv | 0);
      if (n < 0 || !free[n] || dist[n] === 0) continue;
      dist[n] = 0; push(n, 0);
    }
    while (hn > 0 && hn < cap - 16) {
      const d0 = hk[0], n = pop();
      if (d0 > dist[n]) continue;
      const A = adj[n];
      for (let q = 0; q < A.length; q += 2) {
        const m = A[q];
        if (!fineOn && m >= NC) continue;
        const nd = d0 + A[q + 1];
        if (nd < dist[m]) { dist[m] = nd; push(m, nd); }
      }
    }
    return dist;
  };

  const dir = (dist, x, z, lv) => {
    if (!dist) return null;
    const n = nodeAt(x, z, lv);
    if (n < 0) return null;
    if (!free[n]) {
      let bd = Infinity, bn = -1;
      for (const [dx, dz] of [[CELL, 0], [-CELL, 0], [0, CELL], [0, -CELL], [CELL, CELL], [-CELL, CELL], [CELL, -CELL], [-CELL, -CELL]]) {
        const m = nodeAt(x + dx, z + dz, lv);
        if (m >= 0 && free[m] && dist[m] < bd) { bd = dist[m]; bn = m; }
      }
      return bn < 0 ? null : [cx[bn] - x, cz[bn] - z];
    }
    let best = dist[n], bn = -1;
    const scan = (from, skip) => {
      const A = adj[from];
      for (let q = 0; q < A.length; q += 2) {
        const m = A[q];
        if (m === skip) continue;
        if (dist[m] < best) { best = dist[m]; bn = m; }
      }
    };
    scan(n, -1);
    if (bn < 0) return null;
    if (isFine(n) && isFine(bn) && Math.abs(cx[bn] - cx[n]) < 1e-3 && Math.abs(cz[bn] - cz[n]) < 1e-3) {
      const via = bn;
      best = dist[via]; bn = -1;
      scan(via, n);
      if (bn < 0) return null;
    }
    let tx = cx[bn], tz = cz[bn];
    if (isFine(bn)) {
      const A = adj[bn];
      let b2 = dist[bn], m2 = -1;
      for (let q = 0; q < A.length; q += 2) { const m = A[q]; if (dist[m] < b2 && isFine(m)) { b2 = dist[m]; m2 = m; } }
      if (m2 >= 0 && Math.abs(cx[m2] - cx[n]) + Math.abs(cz[m2] - cz[n]) > 1e-3) { tx = (tx + cx[m2]) * 0.5; tz = (tz + cz[m2]) * 0.5; }
    }
    return [tx - x, tz - z];
  };

  return { solve, dir, nodeAt, inFine, free, FX0, FZ0, FW, FH, FC, NC, NF };
}
