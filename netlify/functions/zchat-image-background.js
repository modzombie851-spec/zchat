import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://etcmbghcmlgeezwgnwuz.supabase.co';
const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || 'missing', { auth: { persistSession: false, autoRefreshToken: false } });
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-lite-image';
const IMAGE_FALLBACK = process.env.GEMINI_IMAGE_FALLBACK || 'gemini-nano-banana-2.1';
const USER_LIMIT = Number(process.env.AI_IMAGE_USER_LIMIT || 15);
const DAY_CAP = Number(process.env.AI_IMAGE_DAY_CAP || 400);
const EVERYONE = '00000000-0000-4000-8000-00000000a11a';
const MAX_PHOTO_CHARS = 300000;
const RATIOS = new Set(['1:1', '4:5', '3:4', '9:16', '16:9', '4:3']);
const STYLES = {
  cartoon: 'in a bright modern cartoon style with clean outlines and soft shading',
  anime: 'in a detailed anime illustration style',
  threed: 'as a glossy 3D rendered character like a modern animated film',
  comic: 'in a bold comic book style with ink lines and halftone colour',
  watercolor: 'as a soft watercolour painting with gentle washes',
  pixel: 'as crisp pixel art',
  clay: 'as a handmade clay figure with soft studio lighting',
  sticker: 'as a cute die cut sticker with a thick white border',
  pop: 'in a vivid pop art style with flat bold colours',
  sketch: 'as a pencil sketch with light cross hatching',
  oil: 'as a classical oil painting with visible brush strokes',
  neon: 'in a neon cyberpunk style with glowing colours',
  dreamy: 'in a dreamy pastel style with soft light',
  minimal: 'as a minimal flat illustration with few colours',
  realistic: 'as a realistic photograph with natural light',
};

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

function clean(s, max) {
  return String(s || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function promptFor(row) {
  const style = STYLES[row.style] || STYLES.cartoon;
  const wish = clean(row.prompt, 600);
  if (row.kind === 'avatar') {
    return [
      `Turn the person in this photo into a portrait avatar ${style}.`,
      'Keep the same face shape, skin tone, hair, eyes and expression so friends recognise them.',
      'Head and shoulders, centred, facing the camera, friendly and flattering.',
      'Simple clean background in one soft colour.',
      wish ? `Extra wishes: ${wish}.` : '',
      'No text, no watermark, no logo, no frame.',
    ].filter(Boolean).join(' ');
  }
  if (row.kind === 'wallpaper') {
    return [
      `${wish || 'A calm scene'}, ${style}.`,
      'This is a phone wallpaper for behind a chat, so keep it calm and uncluttered with gentle detail and soft contrast so chat bubbles stay easy to read.',
      'Fill the whole tall frame. No text, no watermark, no logo.',
    ].join(' ');
  }
  if (row.kind === 'profile') {
    return [
      `${wish || 'A friendly character'}, ${style}.`,
      'A square profile picture with the subject centred and a clean simple background.',
      'No text, no watermark, no logo.',
    ].join(' ');
  }
  return `${wish}, ${style}. No watermark or logo. Do not add text unless the description asks for it.`;
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
          console.error('Gemini image error', model, res.status, json && json.error && json.error.message);
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
        console.error('Gemini image failed', model, err && err.name);
        break;
      } finally { clearTimeout(timer); }
    }
  }
  return null;
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
  const { data: row } = await supabase.from('ai_images').select('id, user_id, kind, prompt, style, ratio, status').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (!row || row.status !== 'queued') return done;
  const { data: claimed } = await supabase.from('ai_images').update({ status: 'working' }).eq('id', id).eq('status', 'queued').select('id');
  if (!claimed || !claimed.length) return done;
  const fail = async (message) => {
    await supabase.from('ai_images').update({ status: 'failed', error: message, done_at: new Date().toISOString() }).eq('id', id);
    return done;
  };
  try {
    if (!process.env.GEMINI_API_KEY) return await fail('AI images are not switched on yet.');
    const photo = typeof body.photo === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(body.photo) && body.photo.length <= MAX_PHOTO_CHARS ? body.photo : null;
    if (row.kind === 'avatar' && !photo) return await fail('Add a photo of you first.');
    if (row.kind !== 'avatar' && !clean(row.prompt, 600)) return await fail('Describe what you want to see.');
    if ((await bumpUsage(user.id, 'image')) > USER_LIMIT) return await fail(`You have made ${USER_LIMIT} images today. More tomorrow.`);
    if ((await bumpUsage(EVERYONE, 'image_all')) > DAY_CAP) return await fail('AI images are resting for today. Try again tomorrow.');
    const ratio = RATIOS.has(row.ratio) ? row.ratio : row.kind === 'wallpaper' ? '9:16' : '1:1';
    const parts = [];
    if (photo) {
      const m = photo.match(/^data:(image\/[a-z]+);base64,(.+)$/);
      parts.push({ inlineData: { mimeType: m[1], data: m[2] } });
    }
    parts.push({ text: promptFor(row) });
    const out = await geminiImage(parts, ratio);
    if (!out) return await fail('The picture could not be made. Try different words.');
    if (out.limited) return await fail('AI images are busy right now. Try again in a minute.');
    if (out.blocked) return await fail('That picture is not allowed. Try different words.');
    const buf = Buffer.from(out.data, 'base64');
    if (!buf.length) return await fail('The picture came back empty. Try again.');
    const ext = /jpe?g/i.test(out.mime) ? 'jpg' : /webp/i.test(out.mime) ? 'webp' : 'png';
    const path = `${user.id}/ai-${id}.${ext}`;
    const { error: upErr } = await supabase.storage.from('chat-media').upload(path, buf, { contentType: out.mime, upsert: true });
    if (upErr) { console.error('AI image upload failed', upErr.message); return await fail('The picture could not be saved. Try again.'); }
    const { data: pub } = supabase.storage.from('chat-media').getPublicUrl(path);
    await supabase.from('ai_images').update({ status: 'done', url: pub.publicUrl, error: null, done_at: new Date().toISOString() }).eq('id', id);
    return done;
  } catch (err) {
    console.error('AI image job failed', err && err.message);
    return await fail('Something went wrong. Try again.');
  }
};
