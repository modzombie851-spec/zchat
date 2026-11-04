import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://etcmbghcmlgeezwgnwuz.supabase.co';
const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || 'missing', { auth: { persistSession: false, autoRefreshToken: false } });
const GEMINI_MODEL = process.env.GEMINI_TOOLS_MODEL || process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const GEMINI_FALLBACK = process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.8-flash';
const OLLAMA_URL = (process.env.OLLAMA_URL || '').replace(/\/+$/, '');
const OLLAMA_VISION_MODEL = process.env.OLLAMA_VISION_MODEL || '';
const EVERYONE = '00000000-0000-4000-8000-00000000a11a';
const LIMITS = { photo_ocr: 80, photo_ask: 60, photo_label: 300 };
const DAY_CAPS = { photo_ocr_all: Number(process.env.AI_PHOTO_OCR_DAY_CAP || 4000), photo_ask_all: Number(process.env.AI_PHOTO_ASK_DAY_CAP || 4000), photo_label_all: Number(process.env.AI_PHOTO_LABEL_DAY_CAP || 30000) };
const IMAGE_RE = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;

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

async function take(uid, kind, n, cap) {
  try {
    const { data, error } = await supabase.rpc('zchat_aiphoto_take', { p_user: uid, p_kind: kind, p_n: n, p_cap: cap });
    if (error) { console.error('aiphoto take failed', kind, error.code || error.message); return null; }
    return Number(data) || 0;
  } catch { return null; }
}

function clean(s, max) {
  return String(s || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function imagePart(dataUrl, maxChars) {
  if (typeof dataUrl !== 'string' || dataUrl.length > maxChars) return null;
  const m = dataUrl.match(IMAGE_RE);
  return m ? { inlineData: { mimeType: m[1], data: m[2] } } : null;
}

async function geminiTurns(contents, systemText, timeoutMs, asJson, temperature = 0.2) {
  if (!process.env.GEMINI_API_KEY) return null;
  let limited = false;
  for (const model of [...new Set([GEMINI_MODEL, GEMINI_FALLBACK])]) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: systemText }] }, contents, generationConfig: { maxOutputTokens: 2048, temperature, ...(asJson ? { responseMimeType: 'application/json' } : {}) } }),
        signal: ctrl.signal,
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) { console.error('Gemini aiphoto error', model, res.status); if (res.status === 429) limited = true; continue; }
      if (json && json.promptFeedback && json.promptFeedback.blockReason) return { blocked: true };
      const cand = json && json.candidates && json.candidates[0];
      const text = ((cand && cand.content && cand.content.parts) || []).filter((p) => typeof p.text === 'string' && !p.thought).map((p) => p.text).join('').trim();
      if (text) return { text };
      if (cand && /SAFETY|PROHIBITED|BLOCK/i.test(String(cand.finishReason || ''))) return { blocked: true };
    } catch (err) {
      console.error('Gemini aiphoto failed', model, err && err.name);
    } finally { clearTimeout(timer); }
  }
  return limited ? { limited: true } : null;
}

async function ollamaVision(systemText, turns, timeoutMs, asJson) {
  if (!OLLAMA_URL || !OLLAMA_VISION_MODEL) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const headers = { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': '1' };
    if (process.env.OLLAMA_AUTH) headers.Authorization = `Basic ${Buffer.from(process.env.OLLAMA_AUTH).toString('base64')}`;
    const messages = [{ role: 'system', content: systemText }, ...turns.map((t) => ({
      role: t.role === 'model' ? 'assistant' : 'user',
      content: t.parts.filter((p) => typeof p.text === 'string').map((p) => p.text).join('\n'),
      ...(t.parts.some((p) => p.inlineData) ? { images: t.parts.filter((p) => p.inlineData).map((p) => p.inlineData.data) } : {}),
    }))];
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST', headers, signal: ctrl.signal,
      body: JSON.stringify({ model: OLLAMA_VISION_MODEL, stream: false, think: false, ...(asJson ? { format: 'json' } : {}), options: { temperature: 0.2 }, messages }),
    });
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    const text = json && json.message && typeof json.message.content === 'string' ? json.message.content.replace(/<think>[\s\S]*?<\/think>/g, '').trim() : '';
    return text ? { text } : null;
  } catch { return null; } finally { clearTimeout(timer); }
}

async function vision(turns, systemText, timeoutMs, asJson, temperature) {
  const out = await geminiTurns(turns, systemText, timeoutMs, asJson, temperature);
  if (out && (out.text || out.blocked)) return out;
  const local = await ollamaVision(systemText, turns, Math.min(timeoutMs, 20000), asJson);
  return local || out;
}

function parseJson(text) {
  const raw = String(text || '').replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  try { return JSON.parse(raw); } catch {}
  const i = raw.indexOf('{');
  const j = raw.lastIndexOf('}');
  if (i >= 0 && j > i) { try { return JSON.parse(raw.slice(i, j + 1)); } catch {} }
  return null;
}

function noDashes(s) {
  return String(s || '').replace(/\s*[\u2013\u2014]\s*/g, ', ').replace(/([A-Za-z])-([A-Za-z])/g, '$1 $2').replace(/_/g, ' ').replace(/\*\*(.+?)\*\*/g, '$1').trim();
}

async function quota(uid, kind, n) {
  const mine = await take(uid, kind, n, LIMITS[kind]);
  if (mine === null) return { stop: reply(503, { error: 'This switches on once the latest ZChat setup is finished.' }) };
  if (mine < 1) return { stop: null, none: true };
  const all = await take(EVERYONE, `${kind}_all`, mine, DAY_CAPS[`${kind}_all`]);
  if (all === null) return { stop: reply(503, { error: 'This switches on once the latest ZChat setup is finished.' }) };
  if (all < 1) return { stop: reply(503, { error: 'ZChat Bot is resting for today. Try again tomorrow.' }) };
  return { n: Math.min(mine, all) };
}

async function ocr(user, body) {
  const img = imagePart(body.image, 3200000);
  if (!img) return reply(400, { error: 'That photo could not be opened.' });
  const q = await quota(user.id, 'photo_ocr', 1);
  if (q.stop) return q.stop;
  if (q.none) return reply(429, { error: 'You have read the text in a lot of photos today. Try again tomorrow.' });
  const sys = 'You read the text in a photo for someone who wants to copy it. Reply with JSON only, like {"text":"OPEN 9 TO 5\\nFresh bread","lang":"en"}. "text" holds every piece of readable text in the photo in reading order, with a line break between lines and a blank line between separate blocks. Keep the original language, spelling, numbers, prices and symbols exactly. Do not translate, explain, describe the photo or add anything. If there is no readable text, use an empty string. "lang" is the two letter code of the main language, or an empty string.';
  const out = await vision([{ role: 'user', parts: [img, { text: 'Read the text in this photo.' }] }], sys, 30000, true, 0);
  if (!out || out.limited) return reply(503, { error: 'Copy text is busy right now. Try again soon.' });
  if (out.blocked) return reply(200, { text: '', lang: '', blocked: true });
  const j = parseJson(out.text);
  const text = String(j && typeof j.text === 'string' ? j.text : (j ? '' : out.text)).replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim().slice(0, 8000);
  const lang = j && typeof j.lang === 'string' && /^[a-z]{2}$/i.test(j.lang) ? j.lang.toLowerCase() : '';
  return reply(200, { text, lang });
}

async function ask(user, body) {
  const img = imagePart(body.image, 1800000);
  if (!img) return reply(400, { error: 'That photo could not be opened.' });
  const question = clean(body.q, 300);
  if (!question) return reply(400, { error: 'Ask something about the photo first.' });
  const history = (Array.isArray(body.history) ? body.history : []).slice(-6)
    .map((x) => ({ q: clean(x && x.q, 300), a: clean(x && x.a, 900) }))
    .filter((x) => x.q && x.a);
  const q = await quota(user.id, 'photo_ask', 1);
  if (q.stop) return q.stop;
  if (q.none) return reply(429, { error: 'You have asked about a lot of photos today. Try again tomorrow.' });
  const sys = [
    'You are ZChat Bot, the helper inside the ZChat chat app. Someone is looking at a photo and asks you about it.',
    'Answer in one to three short sentences, plain and friendly, in the language of the question.',
    'Only say what you can see in the photo or know for sure about it. If you are not sure, say so briefly.',
    'You can not tell who a real person is from their face. If asked, say so kindly and describe what you can see instead.',
    'Never guess anyone\'s age, ethnicity, religion, health or other private traits.',
    'For medical, legal or safety questions give general information only and suggest asking someone qualified.',
    'No markdown, no lists, no hyphens or dashes.',
  ].join('\n');
  const turns = [];
  const first = history.length ? history[0].q : question;
  turns.push({ role: 'user', parts: [img, { text: first }] });
  history.forEach((h, i) => {
    turns.push({ role: 'model', parts: [{ text: h.a }] });
    turns.push({ role: 'user', parts: [{ text: i + 1 < history.length ? history[i + 1].q : question }] });
  });
  const out = await vision(turns, sys, 30000, false, 0.4);
  if (!out || out.limited) return reply(503, { error: 'ZChat Bot is busy right now. Try again soon.' });
  if (out.blocked) return reply(200, { text: 'I would rather not answer that one. Ask me something else about the photo?' });
  return reply(200, { text: noDashes(out.text).slice(0, 1500) });
}

function labelWords(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 400);
}

async function labels(user, body) {
  const seen = new Set();
  const items = (Array.isArray(body.items) ? body.items : []).slice(0, 8)
    .map((x) => ({ id: String((x && x.id) || ''), img: imagePart(x && x.img, 200000) }))
    .filter((x) => /^[0-9]{1,18}$/.test(x.id) && x.img && !seen.has(x.id) && seen.add(x.id));
  if (!items.length) return reply(400, { error: 'No photos to look at.' });
  const { data: todo, error } = await supabase.rpc('zchat_photo_labels_todo', { p_user: user.id, p_ids: items.map((x) => x.id) });
  if (error) { console.error('aiphoto todo failed', error.code || error.message); return reply(503, { error: 'Search photos switches on once the latest ZChat setup is finished.' }); }
  const want = new Set((todo || []).map(String));
  const keep = items.filter((x) => want.has(x.id));
  if (!keep.length) return reply(200, { items: [], skipped: items.map((x) => x.id) });
  const q = await quota(user.id, 'photo_label', keep.length);
  if (q.stop) return q.stop;
  if (q.none) return reply(429, { error: 'You have looked through a lot of photos today. More tomorrow.' });
  const batch = keep.slice(0, q.n);
  const sys = 'You label chat photos so their owner can find them later by searching. You get several photos, numbered from 0 in order. For each photo write 6 to 14 short lowercase English search words separated by spaces: the main things in it, people words like person, selfie or group, animals, food, places, the scene, the event, colours that stand out, the kind of image such as screenshot, receipt, document, meme or drawing, and simple synonyms people would type. Do not name or identify real people and never guess age, ethnicity or other private traits. Reply with JSON only, like {"items":[{"i":0,"w":"beach sea sand sunset holiday"}]}.';
  const parts = [];
  batch.forEach((x, i) => { parts.push({ text: `Photo ${i}` }); parts.push(x.img); });
  const out = await vision([{ role: 'user', parts }], sys, 40000, true, 0.2);
  if (!out || out.limited) return reply(503, { error: 'Search photos is busy right now. Try again soon.' });
  const j = out.blocked ? null : parseJson(out.text);
  const list = j && Array.isArray(j.items) ? j.items : Array.isArray(j) ? j : [];
  const byIndex = new Map();
  list.forEach((r) => { const i = Number(r && r.i); if (Number.isInteger(i) && i >= 0 && i < batch.length) byIndex.set(i, labelWords(r.w || r.words || r.labels)); });
  const rows = batch.map((x, i) => ({ id: x.id, labels: byIndex.get(i) || (out.blocked ? 'photo' : '') })).filter((r) => r.labels);
  if (!rows.length) return reply(503, { error: 'Search photos is busy right now. Try again soon.' });
  const { error: putErr } = await supabase.rpc('zchat_photo_labels_put', { p_user: user.id, p_items: rows });
  if (putErr) { console.error('aiphoto put failed', putErr.code || putErr.message); return reply(503, { error: 'Search photos is busy right now. Try again soon.' }); }
  return reply(200, { items: rows, capped: q.n < keep.length });
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return reply(405, { error: 'Method not allowed' });
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch { return reply(400, { error: 'Bad request' }); }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return reply(503, { error: 'Not set up yet' });
  const user = await callerFrom(event);
  if (!user) return reply(401, { error: 'Not signed in' });
  try {
    if (body.action === 'status') return reply(200, { ai: !!process.env.GEMINI_API_KEY, local: !!(OLLAMA_URL && OLLAMA_VISION_MODEL) });
    if (!process.env.GEMINI_API_KEY && !(OLLAMA_URL && OLLAMA_VISION_MODEL)) return reply(503, { error: 'Not set up yet' });
    if (body.action === 'ocr') return await ocr(user, body);
    if (body.action === 'ask') return await ask(user, body);
    if (body.action === 'labels') return await labels(user, body);
    return reply(400, { error: 'Unknown action' });
  } catch (err) {
    console.error('zchat aiphoto failed', body.action, err && err.message);
    return reply(500, { error: 'Something went wrong' });
  }
};
