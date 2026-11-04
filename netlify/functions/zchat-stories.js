import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://etcmbghcmlgeezwgnwuz.supabase.co';
const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || 'missing', { auth: { persistSession: false, autoRefreshToken: false } });
const PHOTON = (process.env.PHOTON_URL || 'https://photon.komoot.io').replace(/\/+$/, '');
const OVERPASS = (process.env.OVERPASS_URL || 'https://overpass-api.de/api/interpreter').replace(/\/+$/, '');
const AGENT = 'ZChat/25 (+https://getzchat.com)';
const DAILY_LIMIT = 400;
const cache = new Map();
const recent = new Map();

const reply = (status, body) => ({ statusCode: status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }, body: JSON.stringify(body) });

function tokenClaims(token) {
  try { return JSON.parse(Buffer.from(String(token).split('.')[1] || '', 'base64url').toString('utf8')) || {}; } catch { return {}; }
}

async function callerFrom(event) {
  try {
    const h = event.headers || {};
    const token = String(h.authorization || h.Authorization || '').replace(/^Bearer\s+/i, '').trim();
    if (!token) return null;
    const claims = tokenClaims(token);
    const idOf = (v) => (/^[0-9a-f-]{36}$/i.test(String(v || '')) ? String(v) : null);
    const sub = idOf(claims.sub);
    const sid = idOf(claims.session_id);
    const [got, state] = await Promise.all([
      supabase.auth.getUser(token),
      sub ? supabase.rpc('zchat_session_state_for', { p_user: sub, p_session: sid }) : Promise.resolve({ data: null, error: null }),
    ]);
    const user = got && !got.error && got.data ? got.data.user : null;
    if (!user || (sub && user.id !== sub)) return null;
    const stErr = state && state.error;
    if (stErr) {
      if (!/PGRST202|42883|could not find the function|does not exist/i.test(`${stErr.code || ''} ${stErr.message || ''}`)) return null;
    } else if (state && state.data === 'pending') return null;
    return user;
  } catch { return null; }
}

async function underLimit(uid) {
  const now = Date.now();
  const list = (recent.get(uid) || []).filter((t) => now - t < 60000);
  if (list.length >= 30) return false;
  list.push(now);
  recent.set(uid, list);
  if (recent.size > 5000) recent.delete(recent.keys().next().value);
  try {
    const { data, error } = await supabase.rpc('zchat_ai_bump', { p_user: uid, p_kind: 'places' });
    if (!error && Number(data) > DAILY_LIMIT) return false;
  } catch {}
  return true;
}

function cached(key) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 15 * 60000) return hit.v;
  if (hit) cache.delete(key);
  return null;
}
function keep(key, v) {
  cache.set(key, { at: Date.now(), v });
  if (cache.size > 800) cache.delete(cache.keys().next().value);
  return v;
}

async function getJson(url, init, ms) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms || 7000);
  try {
    const res = await fetch(url, { ...(init || {}), signal: ctrl.signal, headers: { 'User-Agent': AGENT, Accept: 'application/json', ...((init && init.headers) || {}) } });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; } finally { clearTimeout(t); }
}

const KIND_OF = {
  cafe: 'cafe', coffee_shop: 'cafe', restaurant: 'food', fast_food: 'food', food_court: 'food', bar: 'night', pub: 'night', nightclub: 'night',
  school: 'school', university: 'school', college: 'school', kindergarten: 'school', library: 'school',
  beach: 'beach', bay: 'beach', park: 'park', garden: 'park', nature_reserve: 'park', playground: 'park',
  stadium: 'event', events_venue: 'event', conference_centre: 'event', exhibition_centre: 'event', theatre: 'event', cinema: 'event', arts_centre: 'event', sports_centre: 'event',
  museum: 'sight', attraction: 'sight', viewpoint: 'sight', zoo: 'sight', theme_park: 'sight', hotel: 'stay', guest_house: 'stay', hostel: 'stay',
  mall: 'shop', supermarket: 'shop', marketplace: 'shop', place_of_worship: 'sight',
};
const round = (v, d) => Math.round(v * 10 ** d) / 10 ** d;
const clean = (s, n) => String(s || '').replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);

function areaLine(p) {
  const bits = [p.street && !p.name ? p.street : null, p.district || p.locality, p.city || p.town || p.village, p.state && !(p.city || p.town) ? p.state : null, p.country].filter(Boolean);
  const seen = new Set();
  return clean(bits.filter((b) => { const k = String(b).toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 3).join(', '), 120);
}

function fromPhoton(json) {
  const list = json && Array.isArray(json.features) ? json.features : [];
  return list.map((f) => {
    const p = f.properties || {};
    const c = f.geometry && Array.isArray(f.geometry.coordinates) ? f.geometry.coordinates : null;
    if (!c || !Number.isFinite(c[0]) || !Number.isFinite(c[1])) return null;
    const name = clean(p.name || p.street || p.city || p.town || p.village || p.county, 80);
    if (!name) return null;
    const kind = KIND_OF[p.osm_value] || (['city', 'town', 'village', 'suburb', 'district', 'locality', 'county', 'state'].includes(p.type) ? 'area' : 'place');
    return { n: name, a: areaLine(p), k: kind, lat: round(c[1], 5), lng: round(c[0], 5) };
  }).filter(Boolean);
}

function distKm(a, b) {
  const r = Math.PI / 180;
  const x = (b.lng - a.lng) * r * Math.cos(((a.lat + b.lat) / 2) * r);
  const y = (b.lat - a.lat) * r;
  return Math.sqrt(x * x + y * y) * 6371;
}

function dedupe(list, origin) {
  const out = [];
  list.forEach((it) => {
    if (out.some((o) => o.n.toLowerCase() === it.n.toLowerCase() && distKm(o, it) < 0.25)) return;
    out.push(it);
  });
  if (origin) out.forEach((it) => { it.d = round(distKm(origin, it), 2); });
  return out;
}

async function nearby(lat, lng) {
  const key = `near:${round(lat, 3)},${round(lng, 3)}`;
  const hit = cached(key);
  if (hit) return hit;
  const q = `[out:json][timeout:8];(
nwr(around:900,${lat},${lng})["amenity"~"^(cafe|restaurant|fast_food|bar|pub|school|university|college|library|cinema|theatre|arts_centre|events_venue|conference_centre|exhibition_centre|marketplace|place_of_worship)$"]["name"];
nwr(around:2500,${lat},${lng})["natural"~"^(beach|bay)$"]["name"];
nwr(around:1200,${lat},${lng})["leisure"~"^(park|garden|stadium|sports_centre|nature_reserve)$"]["name"];
nwr(around:1500,${lat},${lng})["tourism"~"^(attraction|museum|viewpoint|zoo|theme_park|hotel)$"]["name"];
nwr(around:1200,${lat},${lng})["shop"~"^(mall|supermarket)$"]["name"];
);out center 60;`;
  const json = await getJson(OVERPASS, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `data=${encodeURIComponent(q)}` }, 9000);
  const els = json && Array.isArray(json.elements) ? json.elements : null;
  if (!els) return null;
  const list = els.map((e) => {
    const t = e.tags || {};
    const la = Number.isFinite(e.lat) ? e.lat : e.center && e.center.lat;
    const lo = Number.isFinite(e.lon) ? e.lon : e.center && e.center.lon;
    const name = clean(t['name:en'] || t.name, 80);
    if (!name || !Number.isFinite(la) || !Number.isFinite(lo)) return null;
    const v = t.amenity || t.natural || t.leisure || t.tourism || t.shop;
    const area = clean([t['addr:street'], t['addr:suburb'] || t['addr:city']].filter(Boolean).join(', '), 120);
    return { n: name, a: area, k: KIND_OF[v] || 'place', lat: round(la, 5), lng: round(lo, 5) };
  }).filter(Boolean);
  const origin = { lat, lng };
  const out = dedupe(list, origin).sort((a, b) => a.d - b.d).slice(0, 30);
  return keep(key, out);
}

async function search(q, lat, lng) {
  const near = Number.isFinite(lat) && Number.isFinite(lng);
  const key = `q:${q.toLowerCase()}:${near ? `${round(lat, 2)},${round(lng, 2)}` : ''}`;
  const hit = cached(key);
  if (hit) return hit;
  const params = new URLSearchParams({ q, limit: '15', lang: 'en' });
  if (near) { params.set('lat', String(lat)); params.set('lon', String(lng)); params.set('location_bias_scale', '0.4'); }
  const json = await getJson(`${PHOTON}/api/?${params.toString()}`, null, 7000);
  if (!json) return null;
  const out = dedupe(fromPhoton(json), near ? { lat, lng } : null).slice(0, 15);
  return keep(key, out);
}

async function reverse(lat, lng) {
  const key = `rev:${round(lat, 4)},${round(lng, 4)}`;
  const hit = cached(key);
  if (hit) return hit;
  const json = await getJson(`${PHOTON}/reverse?lat=${lat}&lon=${lng}&limit=6&lang=en&radius=0.3`, null, 7000);
  if (!json) return null;
  const list = fromPhoton(json);
  return keep(key, dedupe(list, { lat, lng }).slice(0, 6));
}

function coords(body, digits) {
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat: round(lat, digits), lng: round(lng, digits) };
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return reply(405, { error: 'Method not allowed' });
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch { return reply(400, { error: 'Bad request' }); }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return reply(503, { error: 'Not set up yet' });
  const user = await callerFrom(event);
  if (!user) return reply(401, { error: 'Not signed in' });
  try {
    if (body.action === 'places' || body.action === 'revgeo') {
      if (!(await underLimit(user.id))) return reply(429, { error: 'That is a lot of searching. Try again in a minute.' });
      const c = coords(body, body.action === 'revgeo' ? 4 : 3);
      if (body.action === 'revgeo') {
        if (!c) return reply(400, { error: 'Bad request' });
        const items = await reverse(c.lat, c.lng);
        return items ? reply(200, { items }) : reply(503, { error: 'Places are not answering right now. Try again soon.' });
      }
      const q = clean(body.q, 80);
      if (!q && !c) return reply(400, { error: 'Bad request' });
      const items = q ? await search(q, c && c.lat, c && c.lng) : await nearby(c.lat, c.lng);
      return items ? reply(200, { items }) : reply(503, { error: 'Places are not answering right now. Try again soon.' });
    }
    return reply(400, { error: 'Unknown action' });
  } catch (err) {
    console.error('zchat stories failed', body.action, err && err.message);
    return reply(500, { error: 'Something went wrong' });
  }
};
