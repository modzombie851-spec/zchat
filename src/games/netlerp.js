const clampN = (v, a, b) => (v < a ? a : v > b ? b : v);
const wrapPi = (a) => { let v = a; while (v > Math.PI) v -= Math.PI * 2; while (v < -Math.PI) v += Math.PI * 2; return v; };

export function mkNet() { return { buf: [], off: null, jit: 40, last: 0, d: null, rd: 0 }; }

export function netPush(N, at, vals, now = Date.now()) {
  const sent = typeof at === 'number' && Number.isFinite(at) ? at : now;
  const lag = now - sent;
  const prev = N.off;
  N.off = prev == null ? lag : Math.min(prev + 0.5, lag);
  if (prev != null && N.off < prev - 1) { const d = prev - N.off; for (const e of N.buf) e.t -= d; }
  N.jit = Math.max(lag - N.off, N.jit * 0.97);
  const t = sent + N.off;
  const B = N.buf;
  if (B.length && t <= B[B.length - 1].t) return false;
  B.push({ t, v: vals });
  if (B.length > 40) B.shift();
  N.last = now;
  return true;
}

export function netReset(N) { if (N) { N.buf.length = 0; N.last = 0; N.d = null; N.rd = 0; } }

export function netDelay(N, base = 70, cap = 340) { return clampN(base + N.jit * 1.3, base, cap); }

export function netAgeMs(N, now = Date.now()) {
  const B = N.buf;
  return B.length ? now - B[B.length - 1].t : Infinity;
}

export function netRead(N, out, o = {}) {
  const B = N.buf;
  if (!B.length) return null;
  const now = Date.now();
  const want = o.delay != null ? o.delay : netDelay(N, o.base, o.cap);
  if (N.d == null || !N.rd || now - N.rd > 1000) N.d = want;
  else { const lim = (now - N.rd) * 0.12; N.d += clampN(want - N.d, -lim, lim); }
  N.rd = now;
  const rt = now - N.d;
  const n = out.length;
  const ang = o.ang || null;
  const same = o.same || null;
  const copy = (v) => { for (let k = 0; k < n; k++) out[k] = v[k]; };
  out.stale = 0;
  const L = B[B.length - 1];
  if (rt >= L.t) {
    copy(L.v);
    const ex = clampN((rt - L.t) / 1000, 0, (o.ext == null ? 160 : o.ext) / 1000);
    if (ex > 0 && o.vel) for (const [pi, vi] of o.vel) out[pi] = L.v[pi] + L.v[vi] * ex;
    else if (ex > 0 && o.lin && B.length >= 2) {
      const P = B[B.length - 2], dt = (L.t - P.t) / 1000;
      if (dt > 0.001 && !(same && same.some((k) => P.v[k] !== L.v[k]))) for (const pi of o.lin) out[pi] = L.v[pi] + ((L.v[pi] - P.v[pi]) / dt) * ex;
    }
    out.stale = rt - L.t;
    return out;
  }
  if (rt <= B[0].t) { copy(B[0].v); return out; }
  let i = B.length - 1;
  while (i > 0 && B[i - 1].t > rt) i -= 1;
  const a = B[i - 1], c = B[i];
  const f = c.t > a.t ? (rt - a.t) / (c.t - a.t) : 1;
  if ((same && same.some((k) => a.v[k] !== c.v[k])) || (o.snap && Math.hypot(c.v[0] - a.v[0], c.v[1] - a.v[1]) > o.snap)) { copy(f < 0.5 ? a.v : c.v); return out; }
  for (let k = 0; k < n; k++) {
    const av = a.v[k], cv = c.v[k];
    out[k] = ang && ang.includes(k) ? av + wrapPi(cv - av) * f : av + (cv - av) * f;
  }
  return out;
}
