const MODEL = process.env.GEMINI_PHOTO_MODEL || process.env.GEMINI_TOOLS_MODEL || process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const FALLBACK = process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.8-flash';
const MAX_BYTES = 7 * 1024 * 1024;
const PATH_RE = /^(chat-media|chat-private)\/([0-9a-f-]{36})\/([A-Za-z0-9][A-Za-z0-9._-]{0,159})$/i;
const SKIP_EXT = /\.(gif|mp4|webm|mov|m4a|mp3|wav|ogg|pdf)$/i;
const SAFETY_OFF = ['HARM_CATEGORY_HARASSMENT', 'HARM_CATEGORY_HATE_SPEECH', 'HARM_CATEGORY_SEXUALLY_EXPLICIT', 'HARM_CATEGORY_DANGEROUS_CONTENT']
  .map((category) => ({ category, threshold: 'BLOCK_NONE' }));
const SYSTEM = [
  'You check photos for ZChat, a social app for people aged 13 and up, before other people can see them.',
  'Rate the photo on four scales from 0 to 3 and reply with JSON only, exactly like {"nudity":0,"sexual":0,"gore":0,"violence":0}.',
  'nudity: 0 none or normal clothes. 1 swimwear, shirtless men, cleavage, tight or short clothes, classical art statues. 2 underwear or lingerie as the focus, see through clothes, nudity covered only by hands or objects, implied nudity. 3 visible genitals, visible anus or bare buttocks, visible female nipples.',
  'sexual: 0 none. 1 kissing, cuddling, a flirty pose. 2 a sexually suggestive pose or gesture, focus on private areas, sex toys, sexual words. 3 sexual activity or sexual touching.',
  'gore: 0 none. 1 a small cut, bruise or scratch, fake or cartoon blood, raw meat. 2 clearly visible blood, open wounds, injuries, surgery or medical procedures. 3 graphic injuries, exposed organs, severed body parts, dead bodies, a lot of blood.',
  'violence: 0 none. 1 sports such as boxing or wrestling, toy or game weapons, a real weapon shown safely. 2 fighting, a weapon aimed at a person, threats, abuse, self harm. 3 killing, torture, an execution, someone being seriously hurt.',
  'If anyone who looks under 18 is shown with nudity or sexual content at level 2 or more, rate both nudity and sexual as 3.',
  'Rate only what is clearly visible. Drawings, memes and screenshots are rated the same way as photos. Ordinary selfies, food, pets, places and text are all 0.',
].join('\n');

export function photoPathOk(p) {
  const s = String(p || '');
  return PATH_RE.test(s) && !SKIP_EXT.test(s);
}

export function photoOwner(p) {
  const m = PATH_RE.exec(String(p || ''));
  return m ? m[2].toLowerCase() : null;
}

function splitPath(p) {
  const i = p.indexOf('/');
  return [p.slice(0, i), p.slice(i + 1)];
}

function withTimeout(promise, ms) {
  let timer = 0;
  return Promise.race([
    Promise.resolve(promise).catch(() => null),
    new Promise((r) => { timer = setTimeout(() => r(null), Math.max(1, ms)); }),
  ]).finally(() => clearTimeout(timer));
}

function sniff(buf) {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  if (buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  if (/^ftyp(heic|heix|hevc|heim|heis|mif1|msf1)/.test(buf.subarray(4, 12).toString('ascii'))) return 'image/heic';
  return null;
}

async function loadPhoto(supabase, path, ms) {
  const [bucket, key] = splitPath(path);
  const got = await withTimeout(supabase.storage.from(bucket).download(key), ms);
  if (!got) return { error: 'slow' };
  if (got.error || !got.data) {
    const msg = `${(got.error && got.error.message) || ''} ${(got.error && got.error.statusCode) || ''}`;
    return { error: /not ?found|404|does not exist/i.test(msg) || !got.error ? 'missing' : 'download' };
  }
  let buf = Buffer.from(await got.data.arrayBuffer());
  if (buf.length > MAX_BYTES) {
    const small = await withTimeout(supabase.storage.from(bucket).download(key, { transform: { width: 1280, height: 1280, resize: 'contain', quality: 70 } }), ms);
    if (!small || small.error || !small.data) return { error: 'big' };
    buf = Buffer.from(await small.data.arrayBuffer());
    if (buf.length > MAX_BYTES) return { error: 'big' };
  }
  const mime = sniff(buf);
  if (!mime) return { error: 'type' };
  return { buf, mime };
}

function parseJson(text) {
  const raw = String(text || '').replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  try { return JSON.parse(raw); } catch {}
  const i = raw.indexOf('{');
  const j = raw.lastIndexOf('}');
  if (i >= 0 && j > i) { try { return JSON.parse(raw.slice(i, j + 1)); } catch {} }
  return null;
}

export function photoJudge(j) {
  const n = (v) => Math.max(0, Math.min(3, Math.round(Number(v) || 0)));
  const scores = { nudity: n(j && j.nudity), sexual: n(j && j.sexual), gore: n(j && j.gore), violence: n(j && j.violence) };
  const top = Math.max(...Object.values(scores));
  const reason = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
  return { verdict: top >= 3 ? 'block' : top === 2 ? 'sensitive' : 'ok', reason: top >= 2 ? reason : null, scores };
}

async function askGemini(buf, mime, deadline) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { error: 'nokey' };
  const data = buf.toString('base64');
  let last = 'model';
  for (const model of [...new Set([MODEL, FALLBACK])]) {
    const left = deadline - Date.now();
    if (left < 1200) return { error: 'slow' };
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), left);
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        signal: ctrl.signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM }] },
          contents: [{ role: 'user', parts: [{ inlineData: { mimeType: mime, data } }, { text: 'Rate this photo.' }] }],
          safetySettings: SAFETY_OFF,
          generationConfig: { temperature: 0, maxOutputTokens: 512, responseMimeType: 'application/json' },
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        last = res.status === 429 ? 'limited' : `http ${res.status}`;
        if (res.status === 429) return { error: 'limited' };
        continue;
      }
      const fb = json && json.promptFeedback;
      if (fb && fb.blockReason) return { verdict: 'block', reason: 'unsafe', scores: { blocked: String(fb.blockReason) } };
      const cand = json && json.candidates && json.candidates[0];
      const text = ((cand && cand.content && cand.content.parts) || []).filter((p) => typeof p.text === 'string' && !p.thought).map((p) => p.text).join('').trim();
      if (!text && cand && /SAFETY|PROHIBITED|BLOCKLIST|SPII/.test(String(cand.finishReason || ''))) {
        return { verdict: 'block', reason: 'unsafe', scores: { blocked: String(cand.finishReason) } };
      }
      const j = parseJson(text);
      if (!j || typeof j !== 'object') { last = 'unreadable'; continue; }
      return photoJudge(j);
    } catch (err) {
      last = err && err.name === 'AbortError' ? 'slow' : 'network';
    } finally {
      clearTimeout(timer);
    }
  }
  return { error: last };
}

async function classifyPath(supabase, path, deadline) {
  const photo = await loadPhoto(supabase, path, Math.min(4000, Math.max(500, deadline - Date.now() - 1500)));
  if (photo.error) return { error: photo.error };
  return askGemini(photo.buf, photo.mime, deadline);
}

async function saveResult(supabase, id, got, source) {
  if (!id) return { targets: 0, saved: false };
  try {
    const { data, error } = await supabase.rpc('zchat_photo_done', {
      p_id: id, p_verdict: got.verdict || null, p_reason: got.reason || null, p_scores: got.scores || null, p_error: got.error || null, p_source: source,
    });
    if (error) return { targets: 0, saved: false };
    return { targets: Number(data && data.targets) || 0, saved: true };
  } catch { return { targets: 0, saved: false }; }
}

export async function checkPhotos(supabase, userId, paths, kind, budgetMs) {
  const deadline = Date.now() + budgetMs;
  const uid = String(userId || '').toLowerCase();
  const mine = [...new Set((paths || []).map(String))].filter((p) => photoPathOk(p) && photoOwner(p) === uid).slice(0, 10);
  if (!mine.length) return [];
  let plan = null;
  try {
    const { data, error } = await supabase.rpc('zchat_photo_begin', { p_user: userId, p_paths: mine, p_kind: kind });
    if (!error && Array.isArray(data)) plan = data;
  } catch {}
  if (!plan) plan = mine.map((path) => ({ path, run: true, id: null }));
  return Promise.all(plan.map(async (row) => {
    if (!row.run) return { path: row.path, verdict: row.status === 'done' ? row.verdict || 'ok' : null, reason: row.reason || null, state: row.status || 'working', saved: true };
    const got = await classifyPath(supabase, row.path, deadline);
    const saved = await saveResult(supabase, row.id, got, 'pre');
    if (got.verdict === 'block' && !saved.targets) {
      const [bucket, key] = splitPath(row.path);
      await withTimeout(supabase.storage.from(bucket).remove([key]), 2000);
    }
    return { path: row.path, verdict: got.verdict || null, reason: got.reason || null, state: got.verdict ? 'done' : (got.error || 'failed'), saved: saved.saved };
  }));
}

export async function sweepPhotos(supabase, budgetMs) {
  const deadline = Date.now() + budgetMs;
  if (!process.env.GEMINI_API_KEY) return { claimed: 0, skipped: 'nokey' };
  const { data, error } = await supabase.rpc('zchat_photo_claim', { p_limit: 9 });
  if (error) return { claimed: 0, error: error.message };
  const list = Array.isArray(data) ? data : [];
  let at = 0;
  let done = 0;
  const lane = async () => {
    while (at < list.length && deadline - Date.now() > 4000) {
      const row = list[at];
      at += 1;
      const got = await classifyPath(supabase, row.path, Math.min(deadline - 500, Date.now() + 14000));
      await saveResult(supabase, row.id, got, 'sweep');
      done += 1;
    }
  };
  await Promise.all([lane(), lane(), lane()]);
  return { claimed: list.length, done };
}
