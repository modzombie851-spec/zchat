import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://etcmbghcmlgeezwgnwuz.supabase.co';
const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || 'missing', { auth: { persistSession: false, autoRefreshToken: false } });
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-lite-image';
const IMAGE_FALLBACK = process.env.GEMINI_IMAGE_FALLBACK || 'gemini-nano-banana-2.1';
const TEXT_MODEL = process.env.GEMINI_TOOLS_MODEL || process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const OLLAMA_URL = (process.env.OLLAMA_URL || '').replace(/\/+$/, '');
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3:14b';
const DAY_CAP = Number(process.env.AI_IMAGE_DAY_CAP || 400);
const STICKER_COUNT = Math.max(1, Math.min(4, Number(process.env.AI_STICKER_COUNT || 4)));
const EVERYONE = '00000000-0000-4000-8000-00000000a11a';
const MAX_PHOTO_CHARS = 250000;
const RATIOS = new Set(['1:1', '4:5', '3:4', '9:16', '16:9', '4:3']);
const STICKER_LOOK = {
  cartoon: 'a bright modern cartoon with bold clean lines and flat colours',
  sticker: 'a cute kawaii drawing with soft round shapes and pastel colours',
  threed: 'a glossy 3D render like a modern animated film',
  pixel: 'crisp pixel art with a limited palette',
  comic: 'a bold comic book drawing with ink lines',
  clay: 'a handmade clay figure with soft studio light',
  anime: 'a clean anime illustration',
  watercolor: 'a soft watercolour painting with clean edges',
};
const RESTYLE_LOOK = {
  oil: 'a classical oil painting with visible brush strokes',
  cartoon: 'a bright modern cartoon with clean outlines and flat colours',
  sketch: 'a pencil sketch with soft shading and light cross hatching',
  comic: 'a bold comic book panel with ink lines and halftone colour',
  watercolor: 'a soft watercolour painting with gentle washes on paper',
};
const UNSAFE_WORDS = /\b(nude|nudes|naked|nsfw|porn\w*|sex|sexy|sexual|boobs?|breasts?|penis|vagina|genitals?|lingerie|stripper|hentai|gore|gory|decapitat\w*|dismember\w*|nazi\w*|swastika|kkk|hitler|isis|suicide|self harm|cocaine|heroin|meth)\b/i;
const MSG = {
  limited: 'ZChat Bot is busy drawing right now. Try again in a minute.',
  resting: 'AI pictures are resting for today. Try again tomorrow.',
  off: 'AI pictures are not switched on yet.',
  sticker: 'Let us keep stickers friendly. Try describing something else.',
  restyle: 'This photo cannot be restyled.',
  child: 'Photos with children in them cannot be restyled.',
  stickerFail: 'The stickers could not be drawn. Try different words.',
  restyleFail: 'The photo could not be restyled. Try another style.',
  save: 'The picture could not be saved. Try again.',
  busy: 'Restyle is busy right now. Try again soon.',
};

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

async function take(uid, kind, n, cap) {
  try {
    const { data, error } = await supabase.rpc('zchat_aiphoto_take', { p_user: uid, p_kind: kind, p_n: n, p_cap: cap });
    if (error) return null;
    return Number(data) || 0;
  } catch { return null; }
}

function clean(s, max) {
  return String(s || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

async function geminiJson(parts, systemText, timeoutMs) {
  if (!process.env.GEMINI_API_KEY) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: systemText }] }, contents: [{ role: 'user', parts }], generationConfig: { maxOutputTokens: 200, temperature: 0, responseMimeType: 'application/json' } }),
      signal: ctrl.signal,
    });
    const json = await res.json().catch(() => null);
    if (res.status === 429) return { limited: true };
    if (!res.ok) return null;
    if (json && json.promptFeedback && json.promptFeedback.blockReason) return { blocked: true };
    const cand = json && json.candidates && json.candidates[0];
    const text = ((cand && cand.content && cand.content.parts) || []).filter((p) => typeof p.text === 'string' && !p.thought).map((p) => p.text).join('').trim();
    if (!text) return cand && /SAFETY|PROHIBITED|BLOCK/i.test(String(cand.finishReason || '')) ? { blocked: true } : null;
    try { return { json: JSON.parse(text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '')) }; } catch { return null; }
  } catch { return null; } finally { clearTimeout(timer); }
}

async function ollamaJson(systemText, userText, timeoutMs) {
  if (!OLLAMA_URL) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const headers = { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': '1' };
    if (process.env.OLLAMA_AUTH) headers.Authorization = `Basic ${Buffer.from(process.env.OLLAMA_AUTH).toString('base64')}`;
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST', headers, signal: ctrl.signal,
      body: JSON.stringify({ model: OLLAMA_MODEL, stream: false, think: false, format: 'json', options: { temperature: 0 }, messages: [{ role: 'system', content: systemText }, { role: 'user', content: userText }] }),
    });
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    const text = json && json.message && typeof json.message.content === 'string' ? json.message.content.replace(/<think>[\s\S]*?<\/think>/g, '').trim() : '';
    try { return text ? { json: JSON.parse(text) } : null; } catch { return null; }
  } catch { return null; } finally { clearTimeout(timer); }
}

async function stickerWordsOk(words) {
  if (UNSAFE_WORDS.test(words)) return false;
  const sys = 'You check a short description for a sticker in a chat app used by teens and adults. Reply with JSON only, like {"ok":true}. Set ok to false if it asks for sexual or nude content, gore, hate symbols or slurs, self harm, hard drugs, a real living person or celebrity, a company logo, or anything meant to mock or bully a real person. Cartoon fun like a cat with a water pistol or a grumpy potato is fine.';
  const out = (await ollamaJson(sys, words, 8000)) || (await geminiJson([{ text: words }], sys, 12000));
  if (out && out.blocked) return false;
  if (out && out.json && out.json.ok === false) return false;
  return true;
}

async function photoCheck(img) {
  const sys = 'You check a photo before it is redrawn in an art style. Reply with JSON only, like {"child":false,"unsafe":false}. child is true if any person in the photo looks younger than about 16. unsafe is true if it shows nudity, sexual content, gore or hate symbols.';
  const out = await geminiJson([img, { text: 'Check this photo.' }], sys, 15000);
  if (!out) return 'unknown';
  if (out.limited) return 'limited';
  if (out.blocked) return 'unsafe';
  const j = out.json || {};
  if (j.child === true) return 'child';
  if (j.unsafe === true) return 'unsafe';
  return typeof j.child === 'boolean' ? 'ok' : 'unknown';
}

async function geminiImage(parts, ratio) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  for (const model of [...new Set([IMAGE_MODEL, IMAGE_FALLBACK])]) {
    for (const withConfig of [true, false]) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 110000);
      try {
        const generationConfig = { responseModalities: ['IMAGE', 'TEXT'], ...(withConfig ? { imageConfig: { aspectRatio: ratio } } : {}) };
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
          body: JSON.stringify({ contents: [{ role: 'user', parts }], generationConfig }),
          signal: ctrl.signal,
        });
        const json = await res.json().catch(() => null);
        if (res.status === 429) return { limited: true };
        if (!res.ok) {
          console.error('Gemini aiphoto image error', model, res.status, json && json.error && json.error.message);
          if (res.status === 400 && withConfig) continue;
          break;
        }
        const feedback = json && json.promptFeedback;
        if (feedback && feedback.blockReason) return { blocked: true };
        const cand = json && json.candidates && json.candidates[0];
        const reason = String((cand && cand.finishReason) || '');
        const part = ((cand && cand.content && cand.content.parts) || []).find((p) => p.inlineData && p.inlineData.data);
        if (part) return { mime: part.inlineData.mimeType || 'image/png', data: part.inlineData.data };
        if (/SAFETY|PROHIBITED|BLOCK/i.test(reason)) return { blocked: true };
        break;
      } catch (err) {
        console.error('Gemini aiphoto image failed', model, err && err.name);
        break;
      } finally { clearTimeout(timer); }
    }
  }
  return null;
}

function stickerPrompt(words, style, n) {
  const look = STICKER_LOOK[style] || STICKER_LOOK.cartoon;
  const twist = ['', ' Try a different pose.', ' Show it from a slightly different angle.', ' Give it a different expression.'][n % 4];
  return [
    `A single die cut sticker of ${words}, drawn as ${look}.`,
    'One subject only, centred, with empty space all around it.',
    'A thick clean white outline goes all the way around the whole design.',
    'Put it on a plain flat solid medium grey background with nothing else on it, no shadow, no texture and no gradient.',
    'No text unless the description asks for words, no watermark, no logo, no frame.',
    twist,
  ].join(' ').trim();
}

function restylePrompt(style) {
  const look = RESTYLE_LOOK[style] || RESTYLE_LOOK.oil;
  return [
    `Redraw this exact photo as ${look}.`,
    'Keep every person recognisable with the same face shape, features, skin tone, hair, expression and pose.',
    'Keep the same people, animals, objects, background, framing and composition, and roughly the same colours.',
    'Change only the art style. Do not add, remove, move or change anything else, and do not make anyone look older, younger, thinner or different.',
    'No text, no watermark, no logo, no frame.',
  ].join(' ');
}

async function save(uid, id, n, out) {
  const buf = Buffer.from(out.data, 'base64');
  if (!buf.length) return null;
  const ext = /jpe?g/i.test(out.mime) ? 'jpg' : /webp/i.test(out.mime) ? 'webp' : 'png';
  const path = `${uid}/aip-${id}-${n}.${ext}`;
  const priv = await supabase.storage.from('chat-private').upload(path, buf, { contentType: out.mime, upsert: true });
  if (!priv.error) return `zp:${path}`;
  const pub = await supabase.storage.from('chat-media').upload(path, buf, { contentType: out.mime, upsert: true });
  if (pub.error) { console.error('aiphoto upload failed', pub.error.message); return null; }
  return supabase.storage.from('chat-media').getPublicUrl(path).data.publicUrl;
}

async function sweep(uid) {
  try {
    const cut = Date.now() - 24 * 3600 * 1000;
    const { data } = await supabase.storage.from('chat-private').list(uid, { limit: 100, search: 'aip-' });
    const old = (data || []).filter((f) => f && f.name && f.name.startsWith('aip-') && Date.parse(f.created_at || 0) < cut).map((f) => `${uid}/${f.name}`);
    if (old.length) await supabase.storage.from('chat-private').remove(old);
    await supabase.from('ai_photo_jobs').delete().eq('user_id', uid).lt('created_at', new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString());
  } catch {}
}

export const handler = async (event) => {
  const done = { statusCode: 200, body: '' };
  if (event.httpMethod !== 'POST' || !process.env.SUPABASE_SERVICE_ROLE_KEY) return done;
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch { return done; }
  const id = String(body.id || '');
  if (!/^[0-9a-f-]{36}$/i.test(id)) return done;
  const user = await callerFrom(event);
  if (!user) return done;
  const { data: row } = await supabase.from('ai_photo_jobs').select('id, user_id, kind, prompt, style, status').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (!row || row.status !== 'queued') return done;
  const { data: claimed } = await supabase.from('ai_photo_jobs').update({ status: 'working' }).eq('id', id).eq('status', 'queued').select('id');
  if (!claimed || !claimed.length) return done;
  const finish = async (patch) => { await supabase.from('ai_photo_jobs').update({ ...patch, done_at: new Date().toISOString() }).eq('id', id); return done; };
  const fail = (message) => finish({ status: 'failed', error: message });
  sweep(user.id);
  try {
    if (!process.env.GEMINI_API_KEY) return await fail(MSG.off);
    if (row.kind === 'sticker') {
      const words = clean(row.prompt, 200);
      if (words.length < 3) return await fail(MSG.stickerFail);
      if (!(await stickerWordsOk(words))) return await fail(MSG.sticker);
      const n = await take(EVERYONE, 'image_all', STICKER_COUNT, DAY_CAP);
      if (n === null) return await fail(MSG.off);
      if (n < 1) return await fail(MSG.resting);
      const outs = await Promise.all(Array.from({ length: n }, (_, i) => geminiImage([{ text: stickerPrompt(words, row.style, i) }], '1:1')));
      if (outs.some((o) => o && o.blocked) && !outs.some((o) => o && o.data)) return await fail(MSG.sticker);
      if (outs.every((o) => !o || o.limited)) return await fail(outs.some((o) => o && o.limited) ? MSG.limited : MSG.stickerFail);
      const urls = (await Promise.all(outs.map((o, i) => (o && o.data ? save(user.id, id, i, o) : null)))).filter(Boolean);
      if (!urls.length) return await fail(MSG.save);
      return await finish({ status: 'done', urls, error: null });
    }
    if (row.kind === 'restyle') {
      const photo = typeof body.photo === 'string' && body.photo.length <= MAX_PHOTO_CHARS ? body.photo.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/) : null;
      if (!photo) return await fail(MSG.restyleFail);
      const img = { inlineData: { mimeType: photo[1], data: photo[2] } };
      const check = await photoCheck(img);
      if (check === 'child') return await fail(MSG.child);
      if (check === 'unsafe') return await fail(MSG.restyle);
      if (check === 'limited') return await fail(MSG.limited);
      if (check !== 'ok') return await fail(MSG.busy);
      const n = await take(EVERYONE, 'image_all', 1, DAY_CAP);
      if (n === null) return await fail(MSG.off);
      if (n < 1) return await fail(MSG.resting);
      const ratio = RATIOS.has(String(body.ratio || '')) ? String(body.ratio) : '1:1';
      const out = await geminiImage([img, { text: restylePrompt(row.style) }], ratio);
      if (!out) return await fail(MSG.restyleFail);
      if (out.limited) return await fail(MSG.limited);
      if (out.blocked) return await fail(MSG.restyle);
      const url = await save(user.id, id, 0, out);
      if (!url) return await fail(MSG.save);
      return await finish({ status: 'done', urls: [url], error: null });
    }
    return await fail(MSG.stickerFail);
  } catch (err) {
    console.error('aiphoto job failed', err && err.message);
    return await fail('Something went wrong. Try again.');
  }
};
