import { DurableObject } from 'cloudflare:workers';
import { RoomCore, REGIONS, CAP, parseName } from './core.js';

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'content-type', 'Timing-Allow-Origin': '*', 'Cache-Control': 'no-store' };
const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { ...CORS, 'content-type': 'application/json' } });
const authCache = new Map();

async function whoIs(env, tk) {
  if (!tk || tk.length > 4096) return null;
  const hit = authCache.get(tk);
  if (hit && hit.exp > Date.now()) return hit.id;
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return null;
  const r = await fetch(`${String(env.SUPABASE_URL).replace(/\/+$/, '')}/auth/v1/user`, { headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${tk}` } });
  if (!r.ok) return null;
  const u = await r.json().catch(() => null);
  if (!u || !u.id) return null;
  if (authCache.size > 5000) authCache.clear();
  authCache.set(tk, { id: u.id, exp: Date.now() + 5 * 60 * 1000 });
  return u.id;
}

function roomName(u) {
  const g = String(u.searchParams.get('g') || '').replace(/[^a-z]/g, '').slice(0, 12);
  const r = String(u.searchParams.get('r') || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64);
  const reg = REGIONS[u.searchParams.get('reg')] ? u.searchParams.get('reg') : 'usa';
  if (!g || !CAP[g]) return null;
  if (g === 'zombie') {
    if (/^f[a-z0-9]{6,12}$/.test(r)) return { name: `z:zombie:${reg}:${r}`, reg };
    const n = Math.max(1, Math.min(20, parseInt(r, 10) || 1));
    return { name: `z:zombie:${reg}:${n}`, reg };
  }
  if (!r) return null;
  return { name: `r:${g}:${r}`, reg };
}

export default {
  async fetch(request, env) {
    const u = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (u.pathname === '/' || u.pathname === '/health') return json({ ok: true, name: 'zchat games' });
    if (u.pathname === '/ping') {
      const reg = REGIONS[u.searchParams.get('reg')] ? u.searchParams.get('reg') : 'usa';
      const stub = env.PING.get(env.PING.idFromName(`ping:${reg}`), { locationHint: REGIONS[reg] });
      return stub.fetch('https://ping/');
    }
    if (u.pathname === '/rooms') {
      const stub = env.LOBBY.get(env.LOBBY.idFromName('lobby:zombie'));
      return stub.fetch('https://lobby/list');
    }
    if (u.pathname === '/ws') {
      if (request.headers.get('Upgrade') !== 'websocket') return json({ error: 'websocket only' }, 426);
      const rn = roomName(u);
      if (!rn) return json({ error: 'bad room' }, 400);
      const uid = await whoIs(env, u.searchParams.get('tk'));
      if (!uid) return json({ error: 'sign in' }, 401);
      const h = new Headers(request.headers);
      h.set('x-zuid', uid);
      h.set('x-zroom', rn.name);
      let m = {};
      try { m = JSON.parse(u.searchParams.get('m') || '{}') || {}; } catch {}
      const meta = {};
      for (const [k, v] of Object.entries(m).slice(0, 12)) if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') meta[k] = typeof v === 'string' ? v.slice(0, 300) : v;
      if (JSON.stringify(meta).length > 1200) delete meta.a;
      if (JSON.stringify(meta).length > 1200) for (const k of Object.keys(meta)) if (typeof meta[k] === 'string') meta[k] = meta[k].slice(0, 40);
      h.set('x-zmeta', encodeURIComponent(JSON.stringify(meta)));
      const stub = env.ROOM.get(env.ROOM.idFromName(rn.name), { locationHint: REGIONS[rn.reg] });
      return stub.fetch(new Request('https://room/ws', { headers: h }));
    }
    return json({ error: 'not found' }, 404);
  },
};

export class Room extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.env = env;
    this.core = null;
    this.io = {
      list: () => this.ctx.getWebSockets().map((ws) => { const a = ws.deserializeAttachment() || {}; return { ws, id: a.id, m: a.m }; }).filter((c) => c.id),
      send: (ws, s) => ws.send(s),
      close: (ws, code, why) => ws.close(code, why),
      save: (c) => { try { c.ws.serializeAttachment({ id: c.id, m: c.m, room: this.roomName }); } catch {} },
      report: (r) => { if (!r.id.startsWith('z:')) return; try { const stub = this.env.LOBBY.get(this.env.LOBBY.idFromName('lobby:zombie')); this.ctx.waitUntil(stub.fetch('https://lobby/report', { method: 'POST', body: JSON.stringify(r) }).catch(() => {})); } catch {} },
    };
  }
  getCore(name) {
    if (!this.core && name) { this.roomName = name; this.core = new RoomCore(name, this.io); }
    if (!this.core) {
      const any = this.ctx.getWebSockets()[0];
      const a = any ? any.deserializeAttachment() : null;
      if (a && a.room) { this.roomName = a.room; this.core = new RoomCore(a.room, this.io); }
    }
    return this.core;
  }
  async fetch(request) {
    const name = request.headers.get('x-zroom');
    const id = request.headers.get('x-zuid');
    if (!name || !id) return new Response('bad', { status: 400 });
    let m = {};
    try { m = JSON.parse(decodeURIComponent(request.headers.get('x-zmeta') || '%7B%7D')) || {}; } catch {}
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ id, m, room: name });
    const core = this.getCore(name);
    core.open({ ws: server, id, m });
    return new Response(null, { status: 101, webSocket: client });
  }
  async webSocketMessage(ws, msg) {
    const core = this.getCore();
    if (!core) return;
    const a = ws.deserializeAttachment() || {};
    if (core.zombie && !core.sim) { core.ensureSim(); core.startLoop(); }
    core.message({ ws, id: a.id, m: a.m }, typeof msg === 'string' ? msg : '');
  }
  async webSocketClose(ws) {
    const core = this.getCore();
    const a = ws.deserializeAttachment() || {};
    try { ws.close(); } catch {}
    if (core) core.close({ ws, id: a.id, m: a.m });
  }
  async webSocketError(ws) { await this.webSocketClose(ws); }
}

export class Lobby extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.rooms = null;
  }
  async load() {
    if (this.rooms) return;
    this.rooms = (await this.ctx.storage.get('rooms')) || {};
  }
  async fetch(request) {
    await this.load();
    const u = new URL(request.url);
    const now = Date.now();
    if (u.pathname === '/report' && request.method === 'POST') {
      const r = await request.json().catch(() => null);
      if (r && typeof r.id === 'string') {
        if (r.n > 0) this.rooms[r.id] = { n: r.n | 0, w: r.w | 0, cap: r.cap | 0, at: now };
        else delete this.rooms[r.id];
        await this.ctx.storage.put('rooms', this.rooms);
      }
      return new Response('ok');
    }
    const out = { asia: [], usa: [], eu: [] };
    for (const [id, r] of Object.entries(this.rooms)) {
      if (now - r.at > 90000) { delete this.rooms[id]; continue; }
      const p = parseName(id);
      const [reg, n] = p.rest.split(':');
      if (!/^[0-9]+$/.test(n || '')) continue;
      if (out[reg]) out[reg].push({ n: Number(n) || 1, p: r.n, w: r.w, cap: r.cap || 50 });
    }
    for (const k of Object.keys(out)) out[k].sort((a, b) => a.n - b.n);
    return json({ at: now, rooms: out });
  }
}

export class Ping extends DurableObject {
  async fetch() { return json({ ok: true, at: Date.now() }); }
}
