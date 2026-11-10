const VAL = [0, 100, 320, 330, 500, 900, 0];
const PST = [
  null,
  [0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0],
  [-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50],
  [-20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20],
  [0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0],
  [-20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20],
  [-30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20],
];
const KING_END = [-50, -40, -30, -20, -20, -30, -40, -50, -30, -20, -10, 0, 0, -10, -20, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -30, 0, 0, 0, 0, -30, -30, -50, -30, -30, -30, -30, -30, -30, -50];
const LETTER = { p: 1, n: 2, b: 3, r: 4, q: 5, k: 6 };
const PROMO = ['', '', 'n', 'b', 'r', 'q'];
const KN = [];
const KG = [];
const RAY = [];
(() => {
  const D = [[-1, 0], [1, 0], [0, 1], [0, -1], [-1, 1], [-1, -1], [1, 1], [1, -1]];
  const N = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
  for (let s = 0; s < 64; s++) {
    const r = s >> 3;
    const c = s & 7;
    KN[s] = N.map(([a, b]) => [r + a, c + b]).filter(([a, b]) => a >= 0 && a < 8 && b >= 0 && b < 8).map(([a, b]) => a * 8 + b);
    KG[s] = D.map(([a, b]) => [r + a, c + b]).filter(([a, b]) => a >= 0 && a < 8 && b >= 0 && b < 8).map(([a, b]) => a * 8 + b);
    RAY[s] = D.map(([a, b]) => { const out = []; let y = r + a; let x = c + b; while (y >= 0 && y < 8 && x >= 0 && x < 8) { out.push(y * 8 + x); y += a; x += b; } return out; });
  }
})();

function fromState(st) {
  const b = new Int8Array(64);
  for (let i = 0; i < 64; i++) {
    const ch = st.b[i];
    if (ch === '.') continue;
    const t = LETTER[ch.toLowerCase()];
    b[i] = ch === ch.toUpperCase() ? t : t + 8;
  }
  const c = st.c || '';
  return { b, wk: c.includes('K'), wq: c.includes('Q'), bk: c.includes('k'), bq: c.includes('q'), ep: st.e == null ? -1 : st.e, white: st.t === st.wh };
}
const isW = (p) => p > 0 && p < 8;
const isB = (p) => p > 8;
const own = (p, white) => (white ? isW(p) : isB(p));
const foe = (p, white) => (white ? isB(p) : isW(p));

function attacked(b, sq, byWhite) {
  const pawn = byWhite ? 1 : 9;
  const r = sq >> 3;
  const c = sq & 7;
  if (byWhite) {
    if (r < 7 && c > 0 && b[sq + 7] === pawn) return true;
    if (r < 7 && c < 7 && b[sq + 9] === pawn) return true;
  } else {
    if (r > 0 && c > 0 && b[sq - 9] === pawn) return true;
    if (r > 0 && c < 7 && b[sq - 7] === pawn) return true;
  }
  const kn = byWhite ? 2 : 10;
  for (const t of KN[sq]) if (b[t] === kn) return true;
  const kg = byWhite ? 6 : 14;
  for (const t of KG[sq]) if (b[t] === kg) return true;
  const rk = byWhite ? 4 : 12;
  const bs = byWhite ? 3 : 11;
  const qn = byWhite ? 5 : 13;
  for (let d = 0; d < 8; d++) {
    const ray = RAY[sq][d];
    for (let i = 0; i < ray.length; i++) {
      const p = b[ray[i]];
      if (!p) continue;
      if (p === qn || (d < 4 ? p === rk : p === bs)) return true;
      break;
    }
  }
  return false;
}
function kingSq(b, white) { const k = white ? 6 : 14; for (let i = 0; i < 64; i++) if (b[i] === k) return i; return -1; }

function gen(P, capsOnly) {
  const { b, white, ep } = P;
  const out = [];
  const add = (f, t, pr, score) => out.push({ f, t, pr: pr || 0, s: score || 0 });
  for (let f = 0; f < 64; f++) {
    const p = b[f];
    if (!p || !own(p, white)) continue;
    const type = p & 7;
    const r = f >> 3;
    const c = f & 7;
    if (type === 1) {
      const dir = white ? -8 : 8;
      const last = white ? 0 : 7;
      const start = white ? 6 : 1;
      const one = f + dir;
      const promoRow = (one >> 3) === last;
      if (!capsOnly || promoRow) {
        if (!b[one]) {
          if (promoRow) { add(f, one, 5, 800); if (!capsOnly) { add(f, one, 2, 200); add(f, one, 4, 100); add(f, one, 3, 90); } } else {
            add(f, one);
            if (r === start && !b[one + dir]) add(f, one + dir);
          }
        }
      }
      for (const dc of [-1, 1]) {
        if (c + dc < 0 || c + dc > 7) continue;
        const t = one + dc;
        const v = b[t];
        if ((v && foe(v, white)) || t === ep) {
          const gain = v ? VAL[v & 7] * 10 - 1 : 990;
          if (promoRow) { add(f, t, 5, gain + 800); if (!capsOnly) add(f, t, 2, gain + 200); } else add(f, t, 0, gain);
        }
      }
      continue;
    }
    if (type === 2 || type === 6) {
      for (const t of (type === 2 ? KN : KG)[f]) {
        const v = b[t];
        if (v && !foe(v, white)) continue;
        if (capsOnly && !v) continue;
        add(f, t, 0, v ? VAL[v & 7] * 10 - VAL[type] / 100 : 0);
      }
      if (type === 6 && !capsOnly) {
        const home = white ? 60 : 4;
        if (f === home && !attacked(b, f, !white)) {
          if ((white ? P.wk : P.bk) && !b[f + 1] && !b[f + 2] && b[f + 3] === (white ? 4 : 12) && !attacked(b, f + 1, !white) && !attacked(b, f + 2, !white)) add(f, f + 2, 0, 30);
          if ((white ? P.wq : P.bq) && !b[f - 1] && !b[f - 2] && !b[f - 3] && b[f - 4] === (white ? 4 : 12) && !attacked(b, f - 1, !white) && !attacked(b, f - 2, !white)) add(f, f - 2, 0, 30);
        }
      }
      continue;
    }
    const from = type === 4 ? 0 : type === 3 ? 4 : 0;
    const to = type === 4 ? 4 : 8;
    for (let d = from; d < to; d++) {
      const ray = RAY[f][d];
      for (let i = 0; i < ray.length; i++) {
        const t = ray[i];
        const v = b[t];
        if (!v) { if (!capsOnly) add(f, t); continue; }
        if (foe(v, white)) add(f, t, 0, VAL[v & 7] * 10 - VAL[type] / 100);
        break;
      }
    }
  }
  return out;
}

function make(P, m) {
  const { b } = P;
  const p = b[m.f];
  const type = p & 7;
  const undo = { m, p, cap: b[m.t], capSq: m.t, ep: P.ep, wk: P.wk, wq: P.wq, bk: P.bk, bq: P.bq, rook: null };
  if (type === 1 && m.t === P.ep && !b[m.t]) { undo.capSq = P.white ? m.t + 8 : m.t - 8; undo.cap = b[undo.capSq]; b[undo.capSq] = 0; }
  b[m.t] = m.pr ? (P.white ? m.pr : m.pr + 8) : p;
  b[m.f] = 0;
  if (type === 6 && Math.abs(m.t - m.f) === 2) {
    const rf = m.t > m.f ? m.f + 3 : m.f - 4;
    const rt = m.t > m.f ? m.f + 1 : m.f - 1;
    b[rt] = b[rf]; b[rf] = 0; undo.rook = [rf, rt];
  }
  P.ep = type === 1 && Math.abs(m.t - m.f) === 16 ? (m.t + m.f) / 2 : -1;
  if (type === 6) { if (P.white) { P.wk = false; P.wq = false; } else { P.bk = false; P.bq = false; } }
  for (const s of [m.f, m.t]) { if (s === 63) P.wk = false; if (s === 56) P.wq = false; if (s === 7) P.bk = false; if (s === 0) P.bq = false; }
  P.white = !P.white;
  return undo;
}
function unmake(P, u) {
  const { b } = P;
  P.white = !P.white;
  b[u.m.f] = u.p;
  b[u.m.t] = 0;
  if (u.capSq !== u.m.t) b[u.capSq] = u.cap; else b[u.m.t] = u.cap;
  if (u.rook) { b[u.rook[0]] = b[u.rook[1]]; b[u.rook[1]] = 0; }
  P.ep = u.ep; P.wk = u.wk; P.wq = u.wq; P.bk = u.bk; P.bq = u.bq;
}

function evaluate(P) {
  const { b } = P;
  let mat = 0;
  let heavy = 0;
  for (let i = 0; i < 64; i++) { const p = b[i]; if (p && (p & 7) !== 1 && (p & 7) !== 6) heavy += VAL[p & 7]; }
  const endgame = heavy <= 1400;
  for (let i = 0; i < 64; i++) {
    const p = b[i];
    if (!p) continue;
    const type = p & 7;
    const w = isW(p);
    const idx = w ? i : (7 - (i >> 3)) * 8 + (i & 7);
    const table = type === 6 && endgame ? KING_END : PST[type];
    const v = VAL[type] + table[idx];
    if (w) { mat += v; } else { mat -= v; }
  }
  return (P.white ? 1 : -1) * mat;
}

const MATE = 100000;
function search(P, depth, alpha, beta, ply, clock) {
  if ((clock.n++ & 1023) === 0 && Date.now() > clock.end) clock.out = true;
  if (clock.out) return 0;
  if (depth <= 0) return quiesce(P, alpha, beta, 0, clock);
  const moves = gen(P, false);
  moves.sort((a, c) => c.s - a.s);
  let legal = 0;
  let best = -MATE * 2;
  for (const m of moves) {
    const u = make(P, m);
    if (attacked(P.b, kingSq(P.b, !P.white), P.white)) { unmake(P, u); continue; }
    legal += 1;
    const v = -search(P, depth - 1, -beta, -alpha, ply + 1, clock);
    unmake(P, u);
    if (clock.out) return 0;
    if (v > best) best = v;
    if (v > alpha) alpha = v;
    if (alpha >= beta) break;
  }
  if (!legal) return attacked(P.b, kingSq(P.b, P.white), !P.white) ? -MATE + ply : 0;
  return best;
}
function quiesce(P, alpha, beta, qd, clock) {
  const stand = evaluate(P);
  if (stand >= beta) return stand;
  if (stand > alpha) alpha = stand;
  if (qd > 5) return stand;
  const moves = gen(P, true);
  moves.sort((a, c) => c.s - a.s);
  for (const m of moves) {
    const u = make(P, m);
    if (attacked(P.b, kingSq(P.b, !P.white), P.white)) { unmake(P, u); continue; }
    const v = -quiesce(P, -beta, -alpha, qd + 1, clock);
    unmake(P, u);
    if (v >= beta) return v;
    if (v > alpha) alpha = v;
  }
  return alpha;
}

function rootMoves(P) {
  const out = [];
  for (const m of gen(P, false)) {
    const u = make(P, m);
    const ok = !attacked(P.b, kingSq(P.b, !P.white), P.white);
    unmake(P, u);
    if (ok) out.push(m);
  }
  return out;
}

export function pickChess(st, lv) {
  const P = fromState(st);
  const moves = rootMoves(P);
  if (!moves.length) return null;
  if (lv <= 1 && Math.random() < 0.22) return moves[Math.floor(Math.random() * moves.length)];
  const maxDepth = lv <= 1 ? 1 : lv === 2 ? 2 : 5;
  const budget = lv <= 1 ? 150 : lv === 2 ? 450 : 1300;
  const noise = lv <= 1 ? 140 : lv === 2 ? 28 : 0;
  const clock = { n: 0, end: Date.now() + budget, out: false };
  let scored = moves.map((m) => ({ m, v: 0 }));
  for (let d = 1; d <= maxDepth; d++) {
    const round = [];
    for (const e of scored) {
      const u = make(P, e.m);
      const v = -search(P, d - 1, -MATE * 2, MATE * 2, 1, clock);
      unmake(P, u);
      if (clock.out) break;
      round.push({ m: e.m, v });
    }
    if (clock.out && round.length < scored.length) break;
    scored = round.sort((a, c) => c.v - a.v);
    if (scored[0].v > MATE - 1000) break;
  }
  if (!noise) return scored[0].m;
  const jitter = scored.map((x) => ({ m: x.m, v: x.v + (Math.random() * 2 - 1) * noise }));
  jitter.sort((a, c) => c.v - a.v);
  return jitter[0].m;
}

function offerReply(st, me, accept) {
  if (accept) return { ...st, n: (st.n || 0) + 1, w: 'd', why: 'agree', a: 'accept', dr: null };
  return { ...st, n: (st.n || 0) + 1, dr: null, a: 'decline' };
}

export function botDue(st, botId) {
  if (!st || st.w || !botId) return false;
  if (st.a === 'offer' && st.dr && st.dr !== botId) return true;
  return st.t === botId;
}

export function chessBot(Z) {
  return (st, ctx) => {
    const C = Z && Z.chess;
    if (!C || !st || st.w) return null;
    const me = ctx.me;
    const lv = Number(ctx.lv) || 2;
    if (st.a === 'offer' && st.dr && st.dr !== me) {
      const P = fromState(st);
      const ev = evaluate(P) * (P.white === (st.wh === me) ? 1 : -1);
      return offerReply(st, me, lv <= 1 ? Math.random() < 0.5 : ev < -150);
    }
    if (st.t !== me) return null;
    const pick = pickChess(st, lv);
    const pos = { b: st.b, c: st.c || '', e: st.e == null ? -1 : st.e, h: st.h || 0 };
    const legal = C.legalMoves(pos, st.t === st.wh);
    if (!legal.length) return null;
    const pr = pick && pick.pr ? PROMO[pick.pr] : '';
    const hit = pick ? legal.find((m) => m[0] === pick.f && m[1] === pick.t && (m[2] || '') === pr) : null;
    const use = hit || legal[Math.floor(Math.random() * legal.length)];
    return C.play(st, use[0], use[1], use[2] || '', me);
  };
}

function ckrScore(b, white) {
  let s = 0;
  for (let i = 0; i < 64; i++) {
    const p = b[i];
    if (p === '.') continue;
    const r = i >> 3;
    const c = i & 7;
    const mine = white ? (p === 'w' || p === 'W') : (p === 'b' || p === 'B');
    let v = p === 'W' || p === 'B' ? 175 : 100;
    if (p === 'w') v += (6 - r) * 4 + (r === 7 ? 8 : 0);
    if (p === 'b') v += (r - 1) * 4 + (r === 0 ? 8 : 0);
    if (c >= 2 && c <= 5 && r >= 2 && r <= 5) v += 6;
    if (c === 0 || c === 7) v -= 3;
    s += mine ? v : -v;
  }
  return s;
}
function ckrSearch(K, b, white, depth, alpha, beta, clock) {
  if ((clock.n++ & 255) === 0 && Date.now() > clock.end) clock.out = true;
  if (clock.out) return 0;
  const moves = K.legalMoves(b, white);
  if (!moves.length) return -10000 - depth;
  if (depth <= 0 && !moves[0].taken.length) return ckrScore(b, white);
  if (depth <= -4) return ckrScore(b, white);
  let best = -1e9;
  for (const m of moves) {
    const v = -ckrSearch(K, K.applyMove(b, m), !white, depth - 1, -beta, -alpha, clock);
    if (clock.out) return 0;
    if (v > best) best = v;
    if (v > alpha) alpha = v;
    if (alpha >= beta) break;
  }
  return best;
}
export function ckrBot(Z) {
  return (st, ctx) => {
    const K = Z && Z.ckr;
    if (!K || !st || st.w) return null;
    const me = ctx.me;
    const lv = Number(ctx.lv) || 2;
    const white = st.t === st.wh;
    if (st.a === 'offer' && st.dr && st.dr !== me) {
      const mineWhite = st.wh === me;
      return offerReply(st, me, lv <= 1 ? Math.random() < 0.5 : ckrScore(st.b, mineWhite) < -120);
    }
    if (st.t !== me) return null;
    const moves = K.legalMoves(st.b, white);
    if (!moves.length) return null;
    let pick = moves[0];
    if (moves.length > 1) {
      if (lv <= 1 && Math.random() < 0.3) pick = moves[Math.floor(Math.random() * moves.length)];
      else {
        const maxDepth = lv <= 1 ? 1 : lv === 2 ? 3 : 8;
        const clock = { n: 0, end: Date.now() + (lv <= 1 ? 120 : lv === 2 ? 400 : 1200), out: false };
        let scored = moves.map((m) => ({ m, v: 0 }));
        for (let d = 1; d <= maxDepth; d++) {
          const round = [];
          for (const e of scored) {
            const v = -ckrSearch(K, K.applyMove(st.b, e.m), !white, d - 1, -1e9, 1e9, clock);
            if (clock.out) break;
            round.push({ m: e.m, v });
          }
          if (clock.out && round.length < scored.length) break;
          scored = round.sort((a, c) => c.v - a.v);
        }
        const noise = lv <= 1 ? 60 : lv === 2 ? 14 : 0;
        const jitter = scored.map((x) => ({ m: x.m, v: x.v + (Math.random() * 2 - 1) * noise }));
        jitter.sort((a, c) => c.v - a.v);
        pick = jitter[0].m;
      }
    }
    return K.play(st, pick.path, me);
  };
}
