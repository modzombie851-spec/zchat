import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://etcmbghcmlgeezwgnwuz.supabase.co';
const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || 'missing', { auth: { persistSession: false, autoRefreshToken: false } });
const LIMITS = { movies: 400 };
const movieCache = new Map();

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

async function bumpUsage(uid, kind) {
  try {
    const { data, error } = await supabase.rpc('zchat_ai_bump', { p_user: uid, p_kind: kind });
    if (error) return 0;
    return Number(data) || 0;
  } catch { return 0; }
}

function appleUrl(u, hosts) {
  try {
    const x = new URL(String(u || ''));
    if (x.protocol !== 'https:' || !hosts.test(x.hostname)) return null;
    return x.toString();
  } catch { return null; }
}

async function getJson(url, ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms || 7000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { accept: 'application/json', 'user-agent': 'ZChat/25 (+https://getzchat.com)' } });
    if (!res.ok) return { status: res.status, json: null };
    return { status: res.status, json: await res.json().catch(() => null) };
  } catch { return { status: 0, json: null }; } finally { clearTimeout(timer); }
}

function cleanTitle(t) {
  return String(t || '').replace(/[\u0000-\u001f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 120);
}

function posterOf(r) {
  const raw = appleUrl(r.artworkUrl100 || r.artworkUrl60, /(^|\.)mzstatic\.com$/i);
  return raw ? raw.replace(/\/\d+x\d+(bb)?\.(jpg|png)$/i, '/300x450bb.jpg') : null;
}

function movieItem(r) {
  if (!r || r.kind !== 'feature-movie' || !r.trackName) return null;
  const year = Number(String(r.releaseDate || '').slice(0, 4)) || null;
  return { t: cleanTitle(r.trackName), y: year, kind: 'movie', poster: posterOf(r), link: appleUrl(r.trackViewUrl, /(^|\.)apple\.com$/i) };
}

function showItem(r) {
  const name = cleanTitle(r && (r.artistName || r.collectionName));
  if (!r || r.wrapperType !== 'collection' || !name) return null;
  const year = Number(String(r.releaseDate || '').slice(0, 4)) || null;
  return { t: name, y: year, kind: 'show', poster: posterOf(r), link: appleUrl(r.collectionViewUrl, /(^|\.)apple\.com$/i) };
}

async function searchTitles(q, country) {
  const base = 'https://itunes.apple.com/search?';
  const [m, s] = await Promise.all([
    getJson(`${base}${new URLSearchParams({ term: q, media: 'movie', entity: 'movie', limit: '10', country }).toString()}`),
    getJson(`${base}${new URLSearchParams({ term: q, media: 'tvShow', entity: 'tvSeason', limit: '15', country }).toString()}`),
  ]);
  if ((!m.json && !s.json) && [m.status, s.status].some((x) => x === 403 || x === 429)) return 'busy';
  if (!m.json && !s.json) return null;
  const movies = (m.json && Array.isArray(m.json.results) ? m.json.results : []).map(movieItem).filter(Boolean);
  const seen = new Set();
  const shows = [];
  (s.json && Array.isArray(s.json.results) ? s.json.results : []).map(showItem).filter(Boolean).forEach((x) => {
    const k = x.t.toLowerCase();
    if (seen.has(k)) return;
    seen.add(k);
    shows.push(x);
  });
  const out = [];
  for (let i = 0; out.length < 12 && (i < movies.length || i < shows.length); i++) {
    if (movies[i]) out.push(movies[i]);
    if (shows[i] && out.length < 12) out.push(shows[i]);
  }
  return out;
}

async function movies(user, body) {
  const q = String(body.q || '').replace(/\s+/g, ' ').trim().slice(0, 60);
  if (q.length < 2) return reply(200, { items: [] });
  const country = /^[A-Za-z]{2}$/.test(String(body.country || '')) ? String(body.country).toLowerCase() : 'us';
  const ck = `${country}|${q.toLowerCase()}`;
  const hit = movieCache.get(ck);
  if (hit && Date.now() - hit.at < 6 * 3600 * 1000) return reply(200, { items: hit.items });
  if ((await bumpUsage(user.id, 'movies')) > LIMITS.movies) return reply(429, { error: 'Lots of searches today. Add it by name instead.' });
  const items = await searchTitles(q, country);
  if (items === 'busy') return reply(429, { error: 'Search is busy right now. Add it by name instead.' });
  if (!Array.isArray(items)) return reply(503, { error: 'Search is not available right now.' });
  if (movieCache.size > 600) movieCache.clear();
  movieCache.set(ck, { at: Date.now(), items });
  return reply(200, { items });
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return reply(405, { error: 'Method not allowed' });
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch { return reply(400, { error: 'Bad request' }); }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return reply(503, { error: 'Not set up yet' });
  const user = await callerFrom(event);
  if (!user) return reply(401, { error: 'Not signed in' });
  try {
    if (body.action === 'movies') return await movies(user, body);
    return reply(400, { error: 'Unknown action' });
  } catch (err) {
    console.error('zchat profile failed', body.action, err && err.message);
    return reply(500, { error: 'Something went wrong' });
  }
};
