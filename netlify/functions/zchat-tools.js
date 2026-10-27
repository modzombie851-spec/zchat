import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://etcmbghcmlgeezwgnwuz.supabase.co';
const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || 'missing', { auth: { persistSession: false, autoRefreshToken: false } });
const GEMINI_MODEL = process.env.GEMINI_TOOLS_MODEL || process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const GEMINI_FALLBACK = process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.8-flash';
const OLLAMA_URL = (process.env.OLLAMA_URL || '').replace(/\/+$/, '');
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3:14b';
const LIMITS = { translate: 150, transcribe: 40, summary: 40, translate_many: 150, gifs: 1000, music: 300 };
const MAX_AUDIO_BYTES = 12 * 1024 * 1024;
const LANGS = { en: 'English', si: 'Sinhala', ta: 'Tamil', hi: 'Hindi', ar: 'Arabic', es: 'Spanish', fr: 'French', de: 'German', pt: 'Portuguese', ru: 'Russian', ja: 'Japanese', ko: 'Korean', zh: 'Chinese', id: 'Indonesian', ms: 'Malay', th: 'Thai', tr: 'Turkish', it: 'Italian', ur: 'Urdu', bn: 'Bengali' };

let turnCache = { at: 0, data: null };
const gifCache = new Map();
const musicCache = new Map();

const reply = (status, body) => ({ statusCode: status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }, body: JSON.stringify(body) });

async function callerFrom(event) {
  try {
    const h = event.headers || {};
    const token = String(h.authorization || h.Authorization || '').replace(/^Bearer\s+/i, '').trim();
    if (!token) return null;
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data || !data.user) return null;
    return data.user;
  } catch { return null; }
}

async function bumpUsage(uid, kind) {
  try {
    const { data, error } = await supabase.rpc('zchat_ai_bump', { p_user: uid, p_kind: kind });
    if (error) return 0;
    return Number(data) || 0;
  } catch { return 0; }
}

function cleanIceServers(list) {
  return (Array.isArray(list) ? list : []).map((s) => {
    const urls = (Array.isArray(s.urls) ? s.urls : [s.urls]).filter((u) => typeof u === 'string' && !/:53(\?|$)/.test(u));
    return urls.length ? { ...s, urls } : null;
  }).filter(Boolean);
}

async function turnServers() {
  if (turnCache.data && Date.now() - turnCache.at < 10 * 60 * 1000) return turnCache.data;
  const keyId = process.env.CF_TURN_KEY_ID;
  const keyToken = process.env.CF_TURN_API_TOKEN;
  if (keyId && keyToken) {
    try {
      const res = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${encodeURIComponent(keyId)}/credentials/generate-ice-servers`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${keyToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ttl: 86400 }),
      });
      const json = await res.json().catch(() => null);
      const raw = json ? json.iceServers : null;
      const list = cleanIceServers(Array.isArray(raw) ? raw : raw ? [raw] : []);
      if (res.ok && list.length) {
        turnCache = { at: Date.now(), data: { iceServers: list, ttl: 86400, source: 'cloudflare' } };
        return turnCache.data;
      }
      console.error('Cloudflare TURN failed', res.status);
    } catch (err) { console.error('Cloudflare TURN error', err && err.name); }
  }
  const urls = String(process.env.TURN_URLS || '').split(',').map((u) => u.trim()).filter(Boolean);
  if (urls.length) {
    const data = { iceServers: [{ urls, username: process.env.TURN_USERNAME || '', credential: process.env.TURN_CREDENTIAL || '' }], ttl: 86400, source: 'static' };
    turnCache = { at: Date.now(), data };
    return data;
  }
  return { iceServers: [], ttl: 3600, source: 'none' };
}

async function geminiText(parts, systemText, timeoutMs = 20000, asJson = false) {
  if (!process.env.GEMINI_API_KEY) return null;
  for (const model of [...new Set([GEMINI_MODEL, GEMINI_FALLBACK])]) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: systemText }] }, contents: [{ role: 'user', parts }], generationConfig: { maxOutputTokens: 4096, temperature: 0.2, ...(asJson ? { responseMimeType: 'application/json' } : {}) } }),
        signal: ctrl.signal,
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) { console.error('Gemini tools error', model, res.status); if (res.status === 429) return { limited: true }; continue; }
      const cand = json && json.candidates && json.candidates[0];
      const text = ((cand && cand.content && cand.content.parts) || []).filter((p) => typeof p.text === 'string' && !p.thought).map((p) => p.text).join('').trim();
      if (text) return { text };
    } catch (err) {
      console.error('Gemini tools failed', model, err && err.name);
    } finally { clearTimeout(timer); }
  }
  return null;
}

async function ollamaText(systemText, userText, timeoutMs = 9000, asJson = false) {
  if (!OLLAMA_URL) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const headers = { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': '1' };
    if (process.env.OLLAMA_AUTH) headers.Authorization = `Basic ${Buffer.from(process.env.OLLAMA_AUTH).toString('base64')}`;
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST', headers, signal: ctrl.signal,
      body: JSON.stringify({ model: OLLAMA_MODEL, stream: false, think: false, ...(asJson ? { format: 'json' } : {}), options: { temperature: 0.2 }, messages: [{ role: 'system', content: systemText }, { role: 'user', content: userText }] }),
    });
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    const text = json && json.message && typeof json.message.content === 'string' ? json.message.content.replace(/<think>[\s\S]*?<\/think>/g, '').trim() : '';
    return text ? { text } : null;
  } catch { return null; } finally { clearTimeout(timer); }
}

async function translate(user, body) {
  const text = String(body.text || '').trim().slice(0, 3000);
  const to = LANGS[String(body.to || 'en').slice(0, 2).toLowerCase()] || 'English';
  if (!text) return reply(400, { error: 'Nothing to translate' });
  if ((await bumpUsage(user.id, 'translate')) > LIMITS.translate) return reply(429, { error: 'You have translated a lot today. Try again tomorrow.' });
  const systemText = `You translate chat messages into ${to}. Keep the meaning, tone, emojis, names, numbers and links exactly. If the message is already in ${to}, return it unchanged. Reply with only the translated message and nothing else.`;
  const out = (await ollamaText(systemText, text)) || (await geminiText([{ text }], systemText));
  if (!out || out.limited || !out.text) return reply(503, { error: 'Translation is busy right now. Try again soon.' });
  return reply(200, { text: out.text.slice(0, 6000), to });
}

function jsonItems(text) {
  const raw = String(text || '').replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  const pick = (v) => (Array.isArray(v) ? v : v && Array.isArray(v.items) ? v.items : null);
  try { const v = pick(JSON.parse(raw)); if (v) return v; } catch {}
  for (const [a, b] of [['{', '}'], ['[', ']']]) {
    const i = raw.indexOf(a);
    const j = raw.lastIndexOf(b);
    if (i >= 0 && j > i) { try { const v = pick(JSON.parse(raw.slice(i, j + 1))); if (v) return v; } catch {} }
  }
  return null;
}

async function translateMany(user, body) {
  const to = LANGS[String(body.to || 'en').slice(0, 2).toLowerCase()] || 'English';
  const items = (Array.isArray(body.items) ? body.items : []).slice(0, 20)
    .map((x) => ({ id: String((x && x.id) || '').slice(0, 64), t: String((x && x.t) || '').trim().slice(0, 1000) }))
    .filter((x) => x.id && x.t);
  if (!items.length) return reply(400, { error: 'Nothing to translate' });
  if ((await bumpUsage(user.id, 'translate_many')) > LIMITS.translate_many) return reply(429, { error: 'Auto translate is resting for today. It comes back tomorrow.' });
  const systemText = `You translate chat messages into ${to}. You get JSON like {"items":[{"id":"1","t":"text"}]}. Reply with only JSON in the same shape, with the same ids and each "t" holding the translation. Keep the meaning, tone, emojis, names, numbers and links exactly. If a message is already in ${to}, keep it unchanged.`;
  const input = JSON.stringify({ items });
  const out = (await ollamaText(systemText, input, 15000, true)) || (await geminiText([{ text: input }], systemText, 30000, true));
  if (!out || out.limited || !out.text) return reply(503, { error: 'Translation is busy right now. Try again soon.' });
  const ids = new Set(items.map((x) => x.id));
  const done = (jsonItems(out.text) || [])
    .filter((x) => x && ids.has(String(x.id)) && typeof x.t === 'string' && x.t.trim())
    .map((x) => ({ id: String(x.id), t: x.t.slice(0, 3000) }));
  if (!done.length) return reply(503, { error: 'Translation is busy right now. Try again soon.' });
  return reply(200, { items: done, to });
}

async function summary(user, body) {
  const items = (Array.isArray(body.items) ? body.items : []).slice(-150)
    .map((x) => ({ n: String((x && x.n) || 'Someone').replace(/\s+/g, ' ').trim().slice(0, 40), t: String((x && x.t) || '').replace(/\s+/g, ' ').trim().slice(0, 500) }))
    .filter((x) => x.t);
  if (items.length < 3) return reply(400, { error: 'Not much to catch up on yet' });
  if ((await bumpUsage(user.id, 'summary')) > LIMITS.summary) return reply(429, { error: 'You have used Catch me up a lot today. Try again tomorrow.' });
  const chat = String(body.chat || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  const transcript = `${chat ? `Chat: ${chat}\n` : ''}${items.map((x) => `${x.n}: ${x.t}`).join('\n')}`.slice(0, 24000);
  const systemText = 'You catch someone up on a chat they missed. The person reading is called "Me" in the chat. Write 2 to 6 short lines, each starting with "• ". Cover plans, decisions, questions still waiting for an answer and anything that needs the reader. Use first names. Keep it friendly and plain. Never use hyphens, dashes or underscores. Write in the main language of the chat. Reply with only the lines.';
  const out = (await ollamaText(systemText, transcript, 15000)) || (await geminiText([{ text: transcript }], systemText, 30000));
  if (!out || out.limited || !out.text) return reply(503, { error: 'Catch me up is busy right now. Try again soon.' });
  return reply(200, { text: out.text.slice(0, 3000) });
}

function cleanGifUrl(u) {
  try { const x = new URL(u); return /(^|\.)giphy\.com$/i.test(x.hostname) ? `https://${x.hostname}${x.pathname}` : null; } catch { return null; }
}

async function gifs(user, body) {
  const key = process.env.GIPHY_KEY || process.env.GIPHY_API_KEY;
  if (!key) return reply(503, { error: 'GIF search is not set up yet' });
  const q = String(body.q || '').replace(/\s+/g, ' ').trim().slice(0, 50);
  const limit = Math.max(6, Math.min(50, parseInt(body.limit, 10) || 24));
  const offset = Math.max(0, Math.min(4900, parseInt(body.offset, 10) || 0));
  const rating = ['g', 'pg', 'pg-13', 'r'].includes(String(process.env.GIPHY_RATING || '').toLowerCase()) ? String(process.env.GIPHY_RATING).toLowerCase() : 'pg';
  const ck = `${q.toLowerCase()}|${limit}|${offset}`;
  const hit = gifCache.get(ck);
  if (hit && Date.now() - hit.at < 15 * 60 * 1000) return reply(200, { items: hit.items, next: hit.next });
  if ((await bumpUsage(user.id, 'gifs')) > LIMITS.gifs) return reply(429, { error: 'Lots of GIF searches today. Try again tomorrow.' });
  const base = q ? 'https://api.giphy.com/v1/gifs/search' : 'https://api.giphy.com/v1/gifs/trending';
  const params = new URLSearchParams({ api_key: key, limit: String(limit), rating, bundle: 'messaging_non_clips' });
  if (offset) params.set('offset', String(offset));
  if (q) { params.set('q', q); params.set('lang', 'en'); }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(`${base}?${params.toString()}`, { signal: ctrl.signal });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json || !Array.isArray(json.data)) {
      console.error('Giphy failed', res.status);
      return res.status === 429 ? reply(429, { error: 'Lots of GIF searches right now. Try again soon.' }) : reply(503, { error: 'GIFs did not load. Try again.' });
    }
    const items = json.data.map((g) => {
      const im = (g && g.images) || {};
      const full = im.downsized_medium || im.downsized || im.fixed_width || im.original || {};
      const small = im.fixed_width_downsampled || im.fixed_width || full;
      const url = cleanGifUrl(full.url);
      if (!url) return null;
      return { id: String(g.id), title: String(g.title || '').replace(/\s+GIF\b.*$/i, '').trim().slice(0, 60), url, preview: cleanGifUrl(small.url) || url, w: Number(small.width) || Number(full.width) || 200, h: Number(small.height) || Number(full.height) || 200 };
    }).filter(Boolean);
    const pg = json.pagination || {};
    const seen = offset + (Number(pg.count) || json.data.length);
    const next = json.data.length && seen < Math.min(Number(pg.total_count) || 0, 4999) ? seen : null;
    if (gifCache.size > 300) gifCache.clear();
    gifCache.set(ck, { at: Date.now(), items, next });
    return reply(200, { items, next });
  } catch (err) {
    console.error('Giphy error', err && err.name);
    return reply(503, { error: 'GIFs did not load. Try again.' });
  } finally { clearTimeout(timer); }
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
    const res = await fetch(url, { signal: ctrl.signal, headers: { accept: 'application/json', 'user-agent': 'ZChat/18 (+https://getzchat.com)' } });
    if (!res.ok) return { status: res.status, json: null };
    return { status: res.status, json: await res.json().catch(() => null) };
  } catch { return { status: 0, json: null }; } finally { clearTimeout(timer); }
}

function songItem(r) {
  if (!r || r.kind !== 'song' || !r.trackId || !r.previewUrl) return null;
  const p = appleUrl(r.previewUrl, /(^|\.)(apple|mzstatic)\.com$/i);
  if (!p) return null;
  const artRaw = appleUrl(r.artworkUrl100 || r.artworkUrl60, /(^|\.)mzstatic\.com$/i);
  return {
    id: String(r.trackId),
    t: String(r.trackName || '').trim().slice(0, 120),
    a: String(r.artistName || '').trim().slice(0, 120),
    art: artRaw ? artRaw.replace(/\/\d+x\d+bb\./, '/200x200bb.') : null,
    p,
    u: appleUrl(r.trackViewUrl, /^music\.apple\.com$/i),
  };
}

async function topSongs(country) {
  const feed = await getJson(`https://rss.applemarketingtools.com/api/v2/${country}/music/most-played/25/songs.json`);
  const ids = ((feed.json && feed.json.feed && feed.json.feed.results) || []).map((r) => String(r.id || '')).filter((id) => /^\d+$/.test(id)).slice(0, 25);
  if (!ids.length) return null;
  const look = await getJson(`https://itunes.apple.com/lookup?${new URLSearchParams({ id: ids.join(','), country }).toString()}`);
  const rows = (look.json && Array.isArray(look.json.results)) ? look.json.results : null;
  if (!rows) return null;
  const byId = new Map(rows.map((r) => [String(r.trackId), r]));
  return ids.map((id) => songItem(byId.get(id))).filter(Boolean);
}

async function searchSongs(q, country) {
  const r = await getJson(`https://itunes.apple.com/search?${new URLSearchParams({ term: q, media: 'music', entity: 'song', limit: '25', country }).toString()}`);
  if (!r.json || !Array.isArray(r.json.results)) return r.status === 403 || r.status === 429 ? 'busy' : null;
  return r.json.results.map(songItem).filter(Boolean);
}

async function music(user, body) {
  const q = String(body.q || '').replace(/\s+/g, ' ').trim().slice(0, 60);
  const country = /^[A-Za-z]{2}$/.test(String(body.country || '')) ? String(body.country).toLowerCase() : 'us';
  const ck = `${country}|${q.toLowerCase()}`;
  const hit = musicCache.get(ck);
  if (hit && Date.now() - hit.at < 30 * 60 * 1000) return reply(200, { items: hit.items });
  if ((await bumpUsage(user.id, 'music')) > LIMITS.music) return reply(429, { error: 'Lots of song searches today. Try again tomorrow.' });
  let items = q ? await searchSongs(q, country) : await topSongs(country);
  if (items === 'busy') return reply(429, { error: 'Lots of song searches right now. Try again soon.' });
  if ((!items || !items.length) && country !== 'us') {
    const again = q ? await searchSongs(q, 'us') : await topSongs('us');
    if (Array.isArray(again)) items = again;
  }
  if (!Array.isArray(items)) return reply(503, { error: 'Songs did not load. Try again.' });
  if (musicCache.size > 400) musicCache.clear();
  musicCache.set(ck, { at: Date.now(), items });
  return reply(200, { items });
}

async function readMedia(url, ownerId) {
  if (typeof url !== 'string' || !ownerId) return null;
  if (url.startsWith('zp:')) {
    const path = url.slice(3);
    if (!path.startsWith(`${ownerId}/`) || path.includes('..')) return null;
    const { data, error } = await supabase.storage.from('chat-private').download(path);
    if (error || !data) return null;
    const buf = Buffer.from(await data.arrayBuffer());
    return { mimeType: data.type || 'audio/webm', buf };
  }
  let parsed;
  try { parsed = new URL(url); } catch { return null; }
  const path = decodeURIComponent(parsed.pathname);
  if (parsed.protocol !== 'https:' || parsed.host !== new URL(SUPABASE_URL).host || !path.startsWith(`/storage/v1/object/public/chat-media/${ownerId}/`) || path.includes('..')) return null;
  const res = await fetch(parsed.toString());
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  return { mimeType: (res.headers.get('content-type') || 'audio/webm').split(';')[0], buf };
}

async function transcribe(user, body) {
  const messageId = String(body.messageId || '');
  if (!messageId) return reply(400, { error: 'Missing message' });
  const { data: m } = await supabase.from('messages').select('id, sender_id, receiver_id, group_id, type, media_url, deleted').eq('id', messageId).maybeSingle();
  if (!m || m.deleted || !m.media_url || !['audio', 'voice'].includes(m.type)) return reply(404, { error: 'That voice message is not available' });
  let allowed = m.sender_id === user.id || m.receiver_id === user.id;
  if (!allowed && m.group_id) {
    const { data: gm } = await supabase.from('group_members').select('user_id').eq('group_id', m.group_id).eq('user_id', user.id).maybeSingle();
    allowed = !!gm;
  }
  if (!allowed) return reply(403, { error: 'That voice message is not available' });
  if ((await bumpUsage(user.id, 'transcribe')) > LIMITS.transcribe) return reply(429, { error: 'You have turned a lot of voice messages into text today. Try again tomorrow.' });
  const media = await readMedia(m.media_url, m.sender_id);
  if (!media || !media.buf.length || media.buf.length > MAX_AUDIO_BYTES) return reply(404, { error: 'Could not open that voice message' });
  const mimeType = /^audio\//.test(media.mimeType) || /^video\//.test(media.mimeType) ? media.mimeType : 'audio/webm';
  const out = await geminiText([
    { inlineData: { mimeType, data: media.buf.toString('base64') } },
    { text: 'Write down exactly what is said in this voice message, in the language it is spoken in. Use normal punctuation. If nothing can be heard, reply with only: (no speech)' },
  ], 'You turn voice messages into text. Reply with only the words that were said.', 40000);
  if (!out || out.limited || !out.text) return reply(503, { error: 'Voice to text is busy right now. Try again soon.' });
  return reply(200, { text: out.text.slice(0, 6000) });
}

async function safe(fn) { try { return await fn(); } catch { return null; } }

function storagePathFrom(url) {
  if (typeof url !== 'string') return null;
  const marker = '/storage/v1/object/public/chat-media/';
  const i = url.indexOf(marker);
  if (i < 0) return null;
  return decodeURIComponent(url.slice(i + marker.length).split('?')[0].split('#')[0]);
}

async function deleteAccount(user) {
  const uid = user.id;
  const files = new Set();
  const collect = (url) => { const p = storagePathFrom(url); if (p && p.startsWith(`${uid}/`)) files.add(p); };
  const { data: prof } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
  if (prof) collect(prof.avatar);
  const grab = async (table, cols, col) => {
    const { data } = await supabase.from(table).select(cols).eq(col, uid).limit(5000);
    (data || []).forEach((r) => Object.values(r).forEach(collect));
  };
  await safe(() => grab('posts', 'media_url, overlay_url', 'user_id'));
  await safe(() => grab('stories', 'media_url, overlay_url', 'user_id'));
  await safe(() => grab('highlights', 'cover_url', 'user_id'));
  await safe(() => grab('highlight_items', 'media_url', 'user_id'));
  await safe(() => grab('user_stickers', 'url', 'user_id'));
  await safe(() => grab('album_photos', 'media_url', 'user_id'));
  await safe(() => grab('channel_posts', 'media_url', 'author_id'));
  await safe(() => grab('channels', 'avatar', 'owner_id'));
  const wipe = async (table, col, value = uid) => { await safe(() => supabase.from(table).delete().eq(col, value)); };
  const plan = [
    ['post_comment_likes', 'user_id'], ['post_comments', 'user_id'], ['post_likes', 'user_id'], ['posts', 'user_id'],
    ['story_views', 'viewer_id'], ['story_likes', 'user_id'], ['stories', 'user_id'],
    ['highlight_likes', 'user_id'], ['highlight_items', 'user_id'], ['highlights', 'user_id'],
    ['follows', 'follower_id'], ['follows', 'following_id'], ['group_members', 'user_id'],
    ['saved_messages', 'user_id'], ['user_rewards', 'user_id'], ['user_devices', 'user_id'], ['push_subscriptions', 'user_id'],
    ['privacy_allow', 'user_id'], ['privacy_allow', 'viewer_id'], ['chat_locks', 'owner_id'], ['blocks', 'blocker_id'], ['blocks', 'blocked_id'],
    ['contact_nicknames', 'owner_id'], ['self_aliases', 'user_id'], ['user_stickers', 'user_id'], ['sticker_favorites', 'user_id'],
    ['message_likes', 'user_id'], ['mails', 'recipient_id'], ['game_stats', 'user_id'], ['close_friends', 'owner_id'], ['close_friends', 'friend_id'],
    ['story_hidden', 'owner_id'], ['story_hidden', 'hidden_id'], ['chat_accepts', 'user_id'], ['chat_accepts', 'other_id'],
    ['hidden_messages', 'user_id'], ['scheduled_messages', 'sender_id'], ['ai_usage', 'user_id'],
    ['notes', 'user_id'], ['birthdays', 'user_id'], ['story_responses', 'user_id'], ['broadcast_lists', 'owner_id'],
    ['album_photos', 'user_id'], ['sticker_packs', 'owner_id'], ['device_keys', 'user_id'], ['channel_post_likes', 'user_id'],
    ['channel_follows', 'user_id'], ['channel_posts', 'author_id'], ['channels', 'owner_id'], ['away_log', 'owner_id'], ['away_log', 'sender_id'],
  ];
  await safe(() => supabase.from('albums').update({ created_by: null }).eq('created_by', uid));
  for (const [table, col] of plan) await wipe(table, col);
  const list = [...files];
  for (let i = 0; i < list.length; i += 100) await safe(() => supabase.storage.from('chat-media').remove(list.slice(i, i + 100)));
  const short = uid.replace(/-/g, '').slice(0, 10);
  const blank = { name: 'Deleted Account', username: `deleted${short}`, avatar: null, bio: null, is_deleted: true };
  const optional = ['pronouns', 'country', 'age', 'social_links', 'whatsapp', 'avatar_frame', 'nameplate', 'charm', 'name_bar', 'device_id', 'chat_lock_hash', 'website', 'birthday', 'location', 'banner', 'cover_url', 'status_text', 'status_emoji', 'status_until', 'away_text', 'avatar_cfg'];
  const patch = { ...blank };
  if (prof) optional.forEach((k) => { if (Object.prototype.hasOwnProperty.call(prof, k)) patch[k] = null; });
  const upd = await safe(() => supabase.from('profiles').update(patch).eq('id', uid));
  if (!upd || upd.error) await safe(() => supabase.from('profiles').update(blank).eq('id', uid));
  const del = await safe(() => supabase.auth.admin.deleteUser(uid));
  if (del && !del.error) return reply(200, { ok: true, mode: 'deleted' });
  console.error('Auth delete failed, closing the login instead', del && del.error && del.error.message);
  const closed = await safe(() => supabase.auth.admin.updateUserById(uid, { ban_duration: '876000h', email: `closed${short}@users.getzchat.com`, email_confirm: true }));
  if (closed && !closed.error) return reply(200, { ok: true, mode: 'closed' });
  const banOnly = await safe(() => supabase.auth.admin.updateUserById(uid, { ban_duration: '876000h' }));
  if (banOnly && !banOnly.error) return reply(200, { ok: true, mode: 'closed' });
  return reply(500, { error: 'Could not finish deleting the account' });
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return reply(405, { error: 'Method not allowed' });
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch { return reply(400, { error: 'Bad request' }); }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return reply(503, { error: 'Not set up yet' });
  const user = await callerFrom(event);
  if (!user) return reply(401, { error: 'Not signed in' });
  try {
    if (body.action === 'turn') return reply(200, await turnServers());
    if (body.action === 'translate') return await translate(user, body);
    if (body.action === 'transcribe') return await transcribe(user, body);
    if (body.action === 'translate_many') return await translateMany(user, body);
    if (body.action === 'summary') return await summary(user, body);
    if (body.action === 'gifs') return await gifs(user, body);
    if (body.action === 'music') return await music(user, body);
    if (body.action === 'mapkey') return reply(200, { key: process.env.CARTO_KEY || process.env.CARTO_BASEMAPS_KEY || null });
    if (body.action === 'delete_account') {
      if (String(body.confirm || '') !== 'DELETE') return reply(400, { error: 'Not confirmed' });
      return await deleteAccount(user);
    }
    if (body.action === 'status') return reply(200, { turn: !!(process.env.CF_TURN_KEY_ID || process.env.TURN_URLS), ai: !!process.env.GEMINI_API_KEY, ollama: !!OLLAMA_URL, gifs: !!(process.env.GIPHY_KEY || process.env.GIPHY_API_KEY), music: true });
    return reply(400, { error: 'Unknown action' });
  } catch (err) {
    console.error('zchat tools failed', body.action, err && err.message);
    return reply(500, { error: 'Something went wrong' });
  }
};
