import { RES } from './zresdata.js';

const NAME = 'zchat-dead-files';
const keyOf = (p) => `/${p}?v=${RES[p][1]}`;
const norm = (u) => String(u).replace(/^[a-z]+:\/\/[^/]+/i, '').replace(/^\/+/, '').split('?')[0];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const have = new Set();
const mem = new Map();
const urls = new Map();
const live = new Set();
const subs = new Set();
const items = new Map();
let order = [];
let cP = null;
let idxP = null;
let locked = false;
let busy = false;
let cur = null;
let curGot = 0;
let fails = 0;
let waitUntil = 0;
let soon = 0;

function openC() {
  if (!cP) cP = (async () => { try { return typeof caches !== 'undefined' ? await caches.open(NAME) : null; } catch { return null; } })();
  return cP;
}
function emit() { soon = 0; for (const f of subs) { try { f(); } catch {} } }
function emitSoon() { if (!soon) soon = setTimeout(emit, 150); }

export const resKnown = (u) => !!RES[norm(u)];
export const resHas = (u) => have.has(norm(u));
export const resSize = (list) => list.reduce((a, p) => a + (RES[p] ? RES[p][0] : 0), 0);
export const resAll = (test) => Object.keys(RES).filter(test);
export const resOn = (f) => { subs.add(f); return () => { subs.delete(f); }; };
export const resLocked = () => locked;

export function resIndex() {
  if (!idxP) idxP = (async () => {
    const c = await openC();
    if (!c) return;
    try {
      const want = new Map(Object.keys(RES).map((p) => [keyOf(p), p]));
      for (const r of await c.keys()) {
        let k = '';
        try { const u = new URL(r.url); k = u.pathname + u.search; } catch {}
        const p = want.get(k);
        if (p) have.add(p);
        else c.delete(r).catch(() => {});
      }
    } catch {}
  })();
  return idxP;
}

async function keep(p, b) {
  const c = await openC();
  if (c) {
    try {
      await c.put(keyOf(p), new Response(b, { headers: { 'content-type': b.type || 'application/octet-stream' } }));
      mem.delete(p);
      have.add(p);
      emitSoon();
      return;
    } catch {}
  }
  mem.set(p, b);
  have.add(p);
  emitSoon();
}

async function grab(p, onBytes, loose) {
  const ac = typeof AbortController !== 'undefined' ? new AbortController() : null;
  let timer = 0;
  const arm = () => { if (!ac) return; clearTimeout(timer); timer = setTimeout(() => { try { ac.abort(); } catch {} }, 15000); };
  if (ac) live.add(ac);
  try {
    arm();
    const r = await fetch(`/${p}`, ac ? { signal: ac.signal } : undefined);
    const ct = (r.headers.get('content-type') || '').toLowerCase();
    if (!r.ok || ct.includes('text/html')) throw new Error(`missing ${p}`);
    let b;
    if (r.body && r.body.getReader) {
      const rd = r.body.getReader();
      const parts = [];
      for (;;) {
        arm();
        const { done, value } = await rd.read();
        if (done) break;
        parts.push(value);
        if (onBytes) onBytes(value.byteLength);
      }
      b = new Blob(parts, { type: ct.split(';')[0] });
    } else b = await r.blob();
    if (b.size !== RES[p][0] && !loose) throw new Error(`size ${p}`);
    await keep(p, b);
    return b;
  } finally {
    clearTimeout(timer);
    if (ac) live.delete(ac);
  }
}

async function stored(p) {
  const m = mem.get(p);
  if (m) return m;
  const c = await openC();
  if (c) {
    try {
      const r = await c.match(keyOf(p));
      if (r) {
        const b = await r.blob();
        if (b.size > 0) { have.add(p); return b; }
        c.delete(keyOf(p)).catch(() => {});
      }
    } catch {}
  }
  if (have.delete(p)) emitSoon();
  return null;
}

export async function resBlob(u) {
  const p = norm(u);
  if (!RES[p]) {
    const r = await fetch(u);
    if (!r.ok) throw new Error(String(u));
    return r.blob();
  }
  await resIndex();
  const b = await stored(p);
  if (b) return b;
  if (locked) throw new Error('locked');
  return grab(p, null, true);
}
export const resBuf = async (u) => (await resBlob(u)).arrayBuffer();
export async function resUrl(u) {
  const p = norm(u);
  if (urls.has(p)) return urls.get(p);
  const url = URL.createObjectURL(await resBlob(p));
  urls.set(p, url);
  return url;
}
export const resUrlNow = (u) => urls.get(norm(u)) || '';

export async function resFetch(list, onProg, conc = 4) {
  await resIndex();
  const need = [...new Set(list)].filter((p) => RES[p] && !have.has(p));
  const total = resSize(need);
  const part = new Map();
  let done = 0;
  const tick = () => { if (!onProg) return; let n = done; for (const v of part.values()) n += v; onProg(Math.min(n, total), total); };
  tick();
  let i = 0;
  let err = null;
  const run = async () => {
    while (!err && i < need.length) {
      const p = need[i++];
      for (let tries = 0; ; tries++) {
        part.set(p, 0);
        try {
          await grab(p, (n) => { part.set(p, (part.get(p) || 0) + n); tick(); }, tries > 0);
          part.delete(p);
          done += RES[p][0];
          tick();
          break;
        } catch (e) {
          part.delete(p);
          tick();
          if (locked || tries >= 2 || (e && e.name === 'AbortError')) { err = e || new Error('download'); break; }
          await sleep(800 * (tries + 1));
        }
      }
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(conc, need.length)) }, run));
  if (err) throw err;
  return total;
}

export async function resWipe() {
  for (const ac of live) { try { ac.abort(); } catch {} }
  live.clear();
  have.clear();
  mem.clear();
  idxP = null;
  cP = null;
  try { if (typeof caches !== 'undefined') await caches.delete(NAME); } catch {}
  emit();
}

export function resLock(on) {
  locked = !!on;
  if (locked) {
    for (const ac of live) { try { ac.abort(); } catch {} }
    live.clear();
  } else {
    fails = 0;
    waitUntil = 0;
    pump();
  }
}

export function resQueue(list) {
  for (const [k, files] of list) {
    const f = [...new Set(files)].filter((p) => RES[p]);
    items.set(k, { files: f, size: resSize(f) });
  }
  const keys = list.map((x) => x[0]);
  order = [...order.filter((k) => !keys.includes(k)), ...keys];
  pump();
}
export function resFront(k, now) {
  if (!items.has(k)) return;
  if (order[0] !== k) order = [k, ...order.filter((x) => x !== k)];
  if (now) { fails = 0; waitUntil = 0; }
  pump();
}
export function resItem(k) {
  const it = items.get(k);
  if (!it) return { ready: true, got: 0, size: 0, on: false };
  const left = it.files.filter((p) => !have.has(p));
  const got = it.size - resSize(left) + (cur === k ? curGot : 0);
  return { ready: left.length === 0, got: Math.min(got, it.size), size: it.size, on: cur === k };
}
export const resReady = (files) => files.every((p) => !RES[p] || have.has(p));

async function pump() {
  if (busy || locked || Date.now() < waitUntil) return;
  await resIndex();
  if (busy || locked || Date.now() < waitUntil) return;
  const k = order.find((x) => { const it = items.get(x); return it && it.files.some((p) => !have.has(p)); });
  if (!k) return;
  busy = true;
  cur = k;
  curGot = 0;
  emit();
  let ok = true;
  for (const p of items.get(k).files) {
    if (have.has(p)) continue;
    if (locked) { ok = false; break; }
    curGot = 0;
    try { await grab(p, (n) => { curGot += n; emitSoon(); }, fails > 0); } catch { ok = false; break; }
  }
  busy = false;
  cur = null;
  curGot = 0;
  emit();
  if (ok) { fails = 0; setTimeout(pump, 120); } else if (!locked) { fails++; const ms = Math.min(30000, 3000 * fails); waitUntil = Date.now() + ms; setTimeout(pump, ms + 30); }
}

if (typeof window !== 'undefined' && window.__zfake) window.__zres = () => ({ busy, cur, curGot, fails, wait: Math.max(0, waitUntil - Date.now()), locked, live: live.size, order: order.slice(0, 4), have: have.size });
