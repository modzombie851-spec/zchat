import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://etcmbghcmlgeezwgnwuz.supabase.co';
const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || 'missing', { auth: { persistSession: false, autoRefreshToken: false } });
const GEMINI_MODEL = process.env.GEMINI_TOOLS_MODEL || process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const GEMINI_FALLBACK = process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.8-flash';
const LIMITS = { alt: 60, captions: 240 };
const MAX_IMAGE_BYTES = 1600 * 1024;
const MAX_AUDIO_BYTES = 2600 * 1024;
const LANGS = { en: 'English', si: 'Sinhala', ta: 'Tamil', hi: 'Hindi', ar: 'Arabic', es: 'Spanish', fr: 'French', de: 'German', pt: 'Portuguese', ru: 'Russian', ja: 'Japanese', ko: 'Korean', zh: 'Chinese', id: 'Indonesian', ms: 'Malay', th: 'Thai', tr: 'Turkish', it: 'Italian', ur: 'Urdu', bn: 'Bengali' };

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

async function geminiText(parts, systemText, timeoutMs = 25000, asJson = false) {
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
      if (!res.ok) { console.error('Gemini posts error', model, res.status); if (res.status === 429) return { limited: true }; continue; }
      const cand = json && json.candidates && json.candidates[0];
      const text = ((cand && cand.content && cand.content.parts) || []).filter((p) => typeof p.text === 'string' && !p.thought).map((p) => p.text).join('').trim();
      if (text) return { text };
    } catch (err) {
      console.error('Gemini posts failed', model, err && err.name);
    } finally { clearTimeout(timer); }
  }
  return null;
}

function inlineData(b64, allowed, maxBytes) {
  const raw = String(b64 || '').replace(/^data:[^;,]+;base64,/, '').replace(/\s+/g, '');
  if (!raw || !/^[A-Za-z0-9+/]+=*$/.test(raw)) return null;
  const bytes = Math.floor((raw.length * 3) / 4);
  if (bytes < 200 || bytes > maxBytes) return null;
  const buf = Buffer.from(raw, 'base64');
  const mime = allowed.find((m) => m.test(buf));
  return mime ? { mimeType: mime.type, data: raw } : null;
}

const IMAGE_TYPES = [
  { type: 'image/jpeg', test: (b) => b[0] === 0xff && b[1] === 0xd8 },
  { type: 'image/png', test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { type: 'image/webp', test: (b) => b.slice(0, 4).toString('ascii') === 'RIFF' && b.slice(8, 12).toString('ascii') === 'WEBP' },
];
const AUDIO_TYPES = [
  { type: 'audio/wav', test: (b) => b.slice(0, 4).toString('ascii') === 'RIFF' && b.slice(8, 12).toString('ascii') === 'WAVE' },
];

function cleanLine(t, max) {
  return String(t || '').replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

async function altText(user, body) {
  const img = inlineData(body.image, IMAGE_TYPES, MAX_IMAGE_BYTES);
  if (!img) return reply(400, { error: 'That photo could not be read' });
  if ((await bumpUsage(user.id, 'alt')) > LIMITS.alt) return reply(429, { error: 'You asked for a lot of descriptions today. Try again tomorrow.' });
  const lang = LANGS[String(body.lang || 'en').slice(0, 2).toLowerCase()] || 'English';
  const systemText = `You write alt text for photos people post, so someone using a screen reader knows what is in the photo. Write one or two short plain sentences in ${lang}, under 250 characters. Say what matters most: the people and what they are doing, the place, the mood, and any readable text. Never guess who someone is and never name real people. Do not start with words like Image of or Photo of. No hyphens, dashes or emojis. Reply with only the alt text.`;
  const out = await geminiText([{ inlineData: img }, { text: 'Write the alt text for this photo.' }], systemText, 25000);
  if (!out || out.limited || !out.text) return reply(503, { error: 'Suggestions are busy right now. Try again soon.' });
  const text = cleanLine(out.text.replace(/^["\u201C\u201D']+|["\u201C\u201D']+$/g, '').replace(/[\u2013\u2014-]+/g, ' '), 300);
  if (!text) return reply(503, { error: 'Suggestions are busy right now. Try again soon.' });
  return reply(200, { text });
}

function parseCues(text) {
  const raw = String(text || '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]+/g, ' ').replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  const tryParse = (s) => { try { return JSON.parse(s); } catch { return null; } };
  let v = tryParse(raw);
  if (!v) { const i = raw.indexOf('{'); const j = raw.lastIndexOf('}'); if (i >= 0 && j > i) v = tryParse(raw.slice(i, j + 1)); }
  if (!v || typeof v !== 'object') return null;
  const list = Array.isArray(v) ? v : Array.isArray(v.cues) ? v.cues : null;
  if (!list) return null;
  return { lang: typeof v.lang === 'string' ? v.lang.slice(0, 12) : '', cues: list };
}

async function captions(user, body) {
  const audio = inlineData(body.audio, AUDIO_TYPES, MAX_AUDIO_BYTES);
  if (!audio) return reply(400, { error: 'That sound could not be read' });
  const offset = Math.max(0, Math.min(600, Number(body.offset) || 0));
  const dur = Math.max(1, Math.min(40, Number(body.dur) || 30));
  if ((await bumpUsage(user.id, 'captions')) > LIMITS.captions) return reply(429, { error: 'You made a lot of captions today. Try again tomorrow.' });
  const systemText = 'You make subtitles for a short video clip from its sound. Write down exactly what is said, in the language it is spoken in, with normal punctuation. Reply with only JSON like {"lang":"en","cues":[{"s":0.0,"e":2.4,"t":"words"}]}. "s" and "e" are seconds from the start of this clip. Keep each cue under 6 seconds and under 70 characters, in order, never overlapping. Leave out music, noises and silence. If nobody speaks, reply {"lang":"","cues":[]}.';
  const out = await geminiText([{ inlineData: audio }, { text: `This clip is ${dur.toFixed(1)} seconds long. Make the subtitles.` }], systemText, 40000, true);
  if (!out || out.limited || !out.text) return reply(503, { error: 'Captions are busy right now. Try again soon.' });
  const got = parseCues(out.text);
  if (!got) return reply(503, { error: 'Captions are busy right now. Try again soon.' });
  let last = 0;
  const cues = [];
  got.cues.slice(0, 120).forEach((c) => {
    if (!c || typeof c !== 'object') return;
    const t = cleanLine(c.t, 200);
    let s = Number(c.s);
    let e = Number(c.e);
    if (!t || !Number.isFinite(s) || !Number.isFinite(e)) return;
    s = Math.max(last, Math.min(dur, s));
    e = Math.max(s + 0.3, Math.min(dur + 0.5, e));
    last = e;
    cues.push([Math.round((s + offset) * 100) / 100, Math.round((e + offset) * 100) / 100, t]);
  });
  return reply(200, { lang: /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(got.lang) ? got.lang : '', cues });
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return reply(405, { error: 'Method not allowed' });
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch { return reply(400, { error: 'Bad request' }); }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return reply(503, { error: 'Not set up yet' });
  const user = await callerFrom(event);
  if (!user) return reply(401, { error: 'Not signed in' });
  try {
    if (body.action === 'alt') return await altText(user, body);
    if (body.action === 'captions') return await captions(user, body);
    if (body.action === 'status') return reply(200, { ai: !!process.env.GEMINI_API_KEY });
    return reply(400, { error: 'Unknown action' });
  } catch (err) {
    console.error('zchat posts failed', body.action, err && err.message);
    return reply(500, { error: 'Something went wrong. Try again.' });
  }
};
