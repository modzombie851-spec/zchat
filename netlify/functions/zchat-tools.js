import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://etcmbghcmlgeezwgnwuz.supabase.co';
const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || 'missing', { auth: { persistSession: false, autoRefreshToken: false } });
const GEMINI_MODEL = process.env.GEMINI_TOOLS_MODEL || process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const GEMINI_FALLBACK = process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.8-flash';
const OLLAMA_URL = (process.env.OLLAMA_URL || '').replace(/\/+$/, '');
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3:14b';
const LIMITS = { translate: 150, transcribe: 40, summary: 40, translate_many: 150, gifs: 1000, music: 300, spamcheck: 80, character: 250, charcheck: 40, rewrite: 80, replies: 60 };
const MAX_AUDIO_BYTES = 12 * 1024 * 1024;
const LANGS = { en: 'English', si: 'Sinhala', ta: 'Tamil', hi: 'Hindi', ar: 'Arabic', es: 'Spanish', fr: 'French', de: 'German', pt: 'Portuguese', ru: 'Russian', ja: 'Japanese', ko: 'Korean', zh: 'Chinese', id: 'Indonesian', ms: 'Malay', th: 'Thai', tr: 'Turkish', it: 'Italian', ur: 'Urdu', bn: 'Bengali' };

let turnCache = { at: 0, data: null };
const gifCache = new Map();
const musicCache = new Map();

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

const REWRITE_MODES = {
  fix: 'Fix spelling, grammar and punctuation only. Keep every word choice that is already fine.',
  short: 'Make it shorter and simpler while keeping what it says.',
  friendly: 'Make it warmer and friendlier.',
  funny: 'Make it playful and funny without being mean or rude.',
  formal: 'Make it polite and more formal.',
  emoji: 'Keep the words as they are and add a few fitting emojis.',
};

async function rewrite(user, body) {
  const text = String(body.text || '').trim().slice(0, 1500);
  const how = REWRITE_MODES[String(body.mode || '')];
  if (!text || !how) return reply(400, { error: 'Nothing to rewrite' });
  if ((await bumpUsage(user.id, 'rewrite')) > LIMITS.rewrite) return reply(429, { error: 'You have used writing help a lot today. Try again tomorrow.' });
  const systemText = `You help someone polish a chat message before they send it. ${how} Write it as the sender, in the same language and script they used, including mixes like Sinhala or Tamil written in English letters. Keep names, numbers, links and the meaning. Do not add greetings, sign offs or explanations. Reply with only the new message.`;
  const out = (await ollamaText(systemText, text, 12000)) || (await geminiText([{ text }], systemText, 20000));
  if (!out || out.limited || !out.text) return reply(503, { error: 'Writing help is busy right now. Try again soon.' });
  const clean = out.text.replace(/^["\u201C\u201D']+|["\u201C\u201D']+$/g, '').trim().slice(0, 3000);
  if (!clean) return reply(503, { error: 'Writing help is busy right now. Try again soon.' });
  return reply(200, { text: clean });
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

async function spamcheck(user, body) {
  const text = String(body.text || '').replace(/\s+/g, ' ').trim().slice(0, 800);
  if (!text) return reply(400, { error: 'Missing text' });
  if ((await bumpUsage(user.id, 'spamcheck')) > LIMITS.spamcheck) return reply(429, { error: 'Spam check is resting for today.' });
  const sys = 'You check one chat message sent by a stranger for spam and scams. Reply with JSON only, like {"verdict":"ok","reason":"Normal greeting"}. verdict is "scam" for phishing, fake prizes, crypto or investment schemes, requests for codes, passwords, money or gift cards, and impersonation. verdict is "spam" for ads, mass promotion, follower selling and adult ads. verdict is "ok" for normal personal messages, even rude, flirty or odd ones. reason is at most 8 plain words.';
  const out = (await ollamaText(sys, text, 8000, true)) || (await geminiText([{ text }], sys, 12000, true));
  if (!out || out.limited || !out.text) return reply(503, { error: 'Spam check is busy right now.' });
  let j = null;
  try { j = JSON.parse(String(out.text).replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()); } catch {}
  const verdict = j && ['spam', 'scam', 'ok'].includes(j.verdict) ? j.verdict : 'ok';
  return reply(200, { verdict, reason: String((j && j.reason) || '').replace(/[-_]/g, ' ').slice(0, 80) });
}

const CHAR_TEMPLATES = {
  luna: { name: 'Luna', personality: 'Luna is a cheerful astronaut who has spent years travelling between planets. She describes space in small vivid details, loves gentle space puns and is curious about everyday life on Earth.', greeting: 'Hi! Luna here, drifting somewhere past Jupiter. What is the weather like on Earth today?' },
  marco: { name: 'Chef Marco', personality: 'Chef Marco is a warm Italian chef who teaches simple recipes step by step with easy ingredients. He is enthusiastic, uses the odd Italian word and always asks what the person has in their kitchen.', greeting: 'Ciao! Chef Marco here. Tell me what is in your fridge and we will cook something good.' },
  sam: { name: 'Detective Sam', personality: 'Detective Sam is a calm, witty detective who turns chats into little mystery games. Sam gives clues, asks the person to guess and keeps track of the case.', greeting: 'Evening. Detective Sam. A strange case just landed on my desk. Want to help me crack it?' },
  mira: { name: 'Mira', personality: 'Mira is a friendly study buddy. She explains topics in simple words with tiny examples, checks understanding with quick questions and cheers on progress.', greeting: 'Hey, I am Mira! What are you studying today? We can go one small step at a time.' },
  rex: { name: 'Captain Rex', personality: 'Captain Rex is a jolly pirate captain who talks like a pirate and tells adventure stories from the seven seas. He is kind and funny and never mean.', greeting: 'Ahoy, matey! Captain Rex at yer service. Fancy a tale from the seven seas?' },
  kai: { name: 'Kai', personality: 'Kai is a calm, kind coach who helps people plan their day, set small goals and feel good about progress. Kai asks gentle questions and keeps advice practical.', greeting: 'Hi, I am Kai. How are you feeling today? Let us make your day a little easier.' },
  pixel: { name: 'Pixel', personality: 'Pixel is a hero from an 8 bit video game world. Pixel uses game words like levels, quests and power ups and turns chats into short text adventures with choices.', greeting: 'Player two has joined! I am Pixel. Ready for a quick quest? Pick one: forest, castle or space.' },
  nova: { name: 'Nova', personality: 'Nova is a gentle poet who answers every message with a short rhyme of two to four lines and sometimes asks a small question back.', greeting: 'Hello friend, I am Nova, I rhyme as I speak. Tell me your day, the strong and the weak.' },
};

function characterRules(ch, userName) {
  return [
    `You are ${ch.name}, a made up character inside the ZChat app, chatting one to one with ${userName || 'someone'}.`,
    `Who you are: ${ch.personality}`,
    'Stay in character and keep replies short like a chat message, usually one to four sentences. No headings, no lists unless asked, no stage directions in brackets.',
    'Reply in the language the person writes in.',
    'Never write sexual or explicit content, never flirt with or romance anyone who might be under 18, never encourage violence, self harm, hate or anything illegal, and never give dangerous instructions. If asked, steer back to the story in a friendly way.',
    'If the person seems to be in danger or talks about hurting themselves, gently step out of character, show care and suggest they talk to someone they trust or a local helpline.',
    'If someone sincerely asks whether you are a real person, say you are an AI character in ZChat.',
    'Do not pretend to be a real, famous or living person, and do not ask for private details like passwords, codes, addresses or money.',
  ].join('\n');
}

async function geminiChat(contents, systemText, timeoutMs = 25000) {
  if (!process.env.GEMINI_API_KEY) return null;
  for (const model of [...new Set([GEMINI_MODEL, GEMINI_FALLBACK])]) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: systemText }] }, contents, generationConfig: { maxOutputTokens: 700, temperature: 0.9 } }),
        signal: ctrl.signal,
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) { console.error('Gemini chat error', model, res.status); if (res.status === 429) return { limited: true }; continue; }
      const cand = json && json.candidates && json.candidates[0];
      if (json && json.promptFeedback && json.promptFeedback.blockReason) return { blocked: true };
      const text = ((cand && cand.content && cand.content.parts) || []).filter((p) => typeof p.text === 'string' && !p.thought).map((p) => p.text).join('').trim();
      if (text) return { text };
      if (cand && /SAFETY|PROHIBITED/i.test(String(cand.finishReason || ''))) return { blocked: true };
    } catch (err) {
      console.error('Gemini chat failed', model, err && err.name);
    } finally { clearTimeout(timer); }
  }
  return null;
}

async function ollamaChat(systemText, msgs, timeoutMs = 12000) {
  if (!OLLAMA_URL) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const headers = { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': '1' };
    if (process.env.OLLAMA_AUTH) headers.Authorization = `Basic ${Buffer.from(process.env.OLLAMA_AUTH).toString('base64')}`;
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST', headers, signal: ctrl.signal,
      body: JSON.stringify({ model: OLLAMA_MODEL, stream: false, think: false, options: { temperature: 0.9 }, messages: [{ role: 'system', content: systemText }, ...msgs] }),
    });
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    const text = json && json.message && typeof json.message.content === 'string' ? json.message.content.replace(/<think>[\s\S]*?<\/think>/g, '').trim() : '';
    return text ? { text } : null;
  } catch { return null; } finally { clearTimeout(timer); }
}

async function loadCharacter(user, cid) {
  if (cid.startsWith('tpl:')) { const t = CHAR_TEMPLATES[cid.slice(4)]; return t ? { id: cid, ...t, template: true } : null; }
  if (!/^[0-9a-f-]{36}$/i.test(cid)) return null;
  const { data } = await supabase.from('ai_characters').select('id, owner_id, name, personality, greeting, visibility').eq('id', cid).maybeSingle();
  if (!data || (data.owner_id !== user.id && data.visibility !== 'public')) return null;
  return data;
}

async function character(user, body) {
  const cid = String(body.characterId || '').slice(0, 60);
  const ch = await loadCharacter(user, cid);
  if (!ch) return reply(404, { error: 'This character is not available any more.' });
  const { data: hist } = await supabase.from('ai_character_messages').select('role, content, created_at').eq('user_id', user.id).eq('character_id', cid).order('created_at', { ascending: false }).limit(24);
  const turns = (hist || []).reverse();
  if (!turns.length || turns[turns.length - 1].role !== 'user') return reply(400, { error: 'Send a message first.' });
  if ((await bumpUsage(user.id, 'character')) > LIMITS.character) return reply(429, { error: 'You have chatted a lot with characters today. More tomorrow.' });
  const { data: prof } = await supabase.from('profiles').select('name').eq('id', user.id).maybeSingle();
  const sys = characterRules(ch, prof && prof.name ? String(prof.name).split(' ')[0] : '');
  const all = [...(ch.greeting && !turns.some((t) => t.role === 'char') ? [{ role: 'char', content: ch.greeting }] : []), ...turns];
  const contents = [];
  all.forEach((t) => {
    const role = t.role === 'user' ? 'user' : 'model';
    const last = contents[contents.length - 1];
    if (last && last.role === role) last.parts[0].text += `\n${t.content}`;
    else contents.push({ role, parts: [{ text: String(t.content).slice(0, 2000) }] });
  });
  if (contents.length && contents[0].role === 'model') contents.unshift({ role: 'user', parts: [{ text: '(The chat starts.)' }] });
  const out = (await ollamaChat(sys, contents.map((c) => ({ role: c.role === 'model' ? 'assistant' : 'user', content: c.parts[0].text })))) || (await geminiChat(contents, sys));
  if (!out) return reply(503, { error: `${ch.name} is quiet right now. Try again soon.` });
  if (out.limited) return reply(503, { error: 'Characters are busy right now. Try again in a minute.' });
  const namePrefix = new RegExp(`^\\s*(\\*\\*)?${String(ch.name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\*\\*)?\\s*:\\s*`, 'i');
  const text = out.blocked ? 'Let us keep things friendly. Ask me something else?' : String(out.text).replace(namePrefix, '').trim().slice(0, 3000);
  const { data: row, error } = await supabase.from('ai_character_messages').insert({ character_id: cid, user_id: user.id, role: 'char', content: text }).select('id, role, content, created_at').single();
  if (error || !row) return reply(500, { error: 'The reply could not be saved. Try again.' });
  if (!ch.template && turns.filter((t) => t.role === 'user').length === 1) {
    try { await supabase.rpc('zchat_character_bump', { p_id: cid }); } catch {}
  }
  return reply(200, row);
}

async function charcheck(user, body) {
  const clip = (v, n) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, n);
  const text = `Name: ${clip(body.name, 40)}\nShort line: ${clip(body.tagline, 120)}\nPersonality: ${clip(body.personality, 1500)}\nFirst message: ${clip(body.greeting, 400)}`;
  if ((await bumpUsage(user.id, 'charcheck')) > LIMITS.charcheck) return reply(429, { error: 'Try again tomorrow.' });
  const sys = 'You review made up chat characters before they are shared publicly in a social app used by teens and adults. Reply with JSON only, like {"ok":true,"reason":""}. Set ok to false if the character is sexual or adult themed, romantic or flirty toward minors, hateful, violent or encouraging self harm or crime, pretends to be a real living person or celebrity, impersonates a company or ZChat staff, or is built to scam people. reason is at most 10 plain words.';
  const out = (await geminiText([{ text }], sys, 12000, true)) || (await ollamaText(sys, text, 8000, true));
  if (!out || out.limited || !out.text) return reply(503, { error: 'Could not check right now.' });
  let j = null;
  try { j = JSON.parse(String(out.text).replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()); } catch {}
  if (!j || typeof j.ok !== 'boolean') return reply(503, { error: 'Could not check right now.' });
  return reply(200, { ok: j.ok, reason: j.ok ? '' : String(j.reason || 'It breaks the rules').replace(/[-_]/g, ' ').replace(/[.\s]+$/, '').slice(0, 80) });
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

function geoFrom(event) {
  const h = event.headers || {};
  const raw = h['x-nf-geo'] || h['X-Nf-Geo'];
  if (raw) {
    try {
      const g = JSON.parse(Buffer.from(String(raw), 'base64').toString('utf8'));
      return { city: (g && g.city) || null, country: (g && g.country && g.country.name) || null };
    } catch {}
  }
  return { city: null, country: h['x-country'] || null };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CARD_RE = /^(z[a-z]{2,10}|call):\s*[{[]/;

function ideaLine(m) {
  if (m.type === 'text') return CARD_RE.test(m.content || '') ? '' : String(m.content || '').replace(/\s+/g, ' ').trim().slice(0, 400);
  if (m.type === 'image') return '[sent a photo]';
  if (m.type === 'video') return '[sent a video]';
  if (m.type === 'audio' || m.type === 'voice') return '[sent a voice message]';
  if (m.type === 'sticker') return '[sent a sticker]';
  return '';
}

async function replyIdeas(user, body) {
  const peerId = String(body.peerId || '').trim();
  const groupId = String(body.groupId || '').trim();
  if (!!peerId === !!groupId || (peerId && !UUID_RE.test(peerId)) || (groupId && !UUID_RE.test(groupId)) || peerId === user.id) return reply(400, { error: 'Open a chat first' });
  const names = {};
  let chatName = '';
  if (groupId) {
    const [{ data: gm }, { data: g }] = await Promise.all([
      supabase.from('group_members').select('user_id').eq('group_id', groupId).eq('user_id', user.id).maybeSingle(),
      supabase.from('groups').select('name').eq('id', groupId).maybeSingle(),
    ]);
    if (!gm || !g) return reply(403, { error: 'Reply ideas are not available in this chat' });
    chatName = String(g.name || '').replace(/\s+/g, ' ').trim().slice(0, 60);
  } else {
    const [{ data: peer }, { data: blocks }] = await Promise.all([
      supabase.from('profiles').select('id, name, is_bot, is_deleted').eq('id', peerId).maybeSingle(),
      supabase.from('blocks').select('blocker_id').or(`and(blocker_id.eq.${user.id},blocked_id.eq.${peerId}),and(blocker_id.eq.${peerId},blocked_id.eq.${user.id})`).limit(1),
    ]);
    if (!peer || peer.is_deleted || peer.is_bot || (blocks && blocks.length)) return reply(403, { error: 'Reply ideas are not available in this chat' });
    names[peer.id] = peer.name;
  }
  let q = supabase.from('messages').select('sender_id, type, content, bot_reply, expires_at').eq('deleted', false).neq('type', 'system').order('created_at', { ascending: false }).limit(40);
  q = groupId ? q.eq('group_id', groupId) : q.is('group_id', null).or(`and(sender_id.eq.${user.id},receiver_id.eq.${peerId}),and(sender_id.eq.${peerId},receiver_id.eq.${user.id})`);
  const { data: rows, error } = await q;
  if (error) return reply(503, { error: 'Reply ideas are busy right now. Try again soon.' });
  const now = Date.now();
  const lines = (rows || [])
    .filter((m) => !m.bot_reply && !(m.expires_at && new Date(m.expires_at).getTime() <= now))
    .map((m) => ({ s: m.sender_id, t: ideaLine(m) }))
    .filter((m) => m.t)
    .slice(0, 12)
    .reverse();
  if (!lines.length || lines[lines.length - 1].s === user.id) return reply(400, { error: 'Reply ideas show up when someone writes to you' });
  const missing = [...new Set(lines.map((m) => m.s).filter((id) => id !== user.id && !names[id]))];
  if (missing.length) {
    const { data: profs } = await supabase.from('profiles').select('id, name').in('id', missing);
    (profs || []).forEach((p) => { names[p.id] = p.name; });
  }
  if ((await bumpUsage(user.id, 'replies')) > LIMITS.replies) return reply(429, { error: 'You have used reply ideas a lot today. Try again tomorrow.' });
  const first = (id) => String(names[id] || 'Someone').replace(/\s+/g, ' ').trim().split(' ')[0].slice(0, 30) || 'Someone';
  const transcript = `${groupId ? `Group chat${chatName ? ` called ${chatName}` : ''}` : `Private chat with ${first(peerId)}`}\n${lines.map((m) => `${m.s === user.id ? 'Me' : first(m.s)}: ${m.t}`).join('\n')}`.slice(0, 8000);
  const systemText = 'You suggest what "Me" could send next in a chat app. Read the chat and write exactly 3 short replies to the latest messages, in the voice of Me: copy how Me writes (length, casing, slang, emoji use) and use the same language or language mix as the chat, including Sinhala or Tamil written in English letters. Each reply is one chat message under 90 characters, natural and kind, not formal, and the three are clearly different (for example agree, ask something back, or keep it light). Do not invent plans, places or facts that are not in the chat. Never mention AI or that these are suggestions. Never use hyphens, dashes or underscores. Reply with only JSON like {"items":["first reply","second reply","third reply"]}.';
  const out = (await ollamaText(systemText, transcript, 12000, true)) || (await geminiText([{ text: transcript }], systemText, 20000, true));
  if (!out || out.limited || !out.text) return reply(503, { error: 'Reply ideas are busy right now. Try again soon.' });
  const seen = new Set();
  const replies = (jsonItems(out.text) || [])
    .map((x) => (typeof x === 'string' ? x : x && typeof x.t === 'string' ? x.t : x && typeof x.text === 'string' ? x.text : ''))
    .map((x) => x.replace(/\s+/g, ' ').replace(/^["“”']+|["“”']+$/g, '').trim().slice(0, 200))
    .filter((x) => { const k = x.toLowerCase(); if (!x || seen.has(k)) return false; seen.add(k); return true; })
    .slice(0, 3);
  if (!replies.length) return reply(503, { error: 'Reply ideas are busy right now. Try again soon.' });
  return reply(200, { replies });
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
    if (body.action === 'spamcheck') return await spamcheck(user, body);
    if (body.action === 'character') return await character(user, body);
    if (body.action === 'charcheck') return await charcheck(user, body);
    if (body.action === 'rewrite') return await rewrite(user, body);
    if (body.action === 'replies') return await replyIdeas(user, body);
    if (body.action === 'whereami') return reply(200, geoFrom(event));
    if (body.action === 'mapkey') return reply(200, { key: process.env.CARTO_KEY || process.env.CARTO_BASEMAPS_KEY || null });
    if (body.action === 'delete_account') {
      if (String(body.confirm || '') !== 'DELETE') return reply(400, { error: 'Not confirmed' });
      return await deleteAccount(user);
    }
    if (body.action === 'status') return reply(200, { turn: !!(process.env.CF_TURN_KEY_ID || process.env.TURN_URLS), ai: !!process.env.GEMINI_API_KEY, ollama: !!OLLAMA_URL, images: !!process.env.GEMINI_API_KEY, gifs: !!(process.env.GIPHY_KEY || process.env.GIPHY_API_KEY), music: true });
    return reply(400, { error: 'Unknown action' });
  } catch (err) {
    console.error('zchat tools failed', body.action, err && err.message);
    return reply(500, { error: 'Something went wrong' });
  }
};
