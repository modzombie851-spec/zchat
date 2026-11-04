import { createHash, createHmac, randomBytes } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://etcmbghcmlgeezwgnwuz.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(SUPABASE_URL, SERVICE_KEY || 'missing', { auth: { persistSession: false, autoRefreshToken: false } });
const GEMINI_MODEL = process.env.GEMINI_TOOLS_MODEL || process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const GEMINI_FALLBACK = process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.8-flash';
const OLLAMA_URL = (process.env.OLLAMA_URL || '').replace(/\/+$/, '');
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3:14b';
const SITE = (process.env.ZCHAT_SITE || process.env.URL || 'https://getzchat.com').replace(/\/+$/, '');
const MAIL_FROM = process.env.RESEND_FROM || 'ZChat <hello@getzchat.com>';
const FEED_URL = process.env.SAFETY_FEED_URL === 'off' ? '' : (process.env.SAFETY_FEED_URL || 'https://openphish.com/feed.txt');
const LIMITS = { kindcheck: 150, linkcheck: 400, export_link: 60 };
const STORAGE_HOST = (() => { try { return new URL(SUPABASE_URL).host; } catch { return ''; } })();

const reply = (status, body) => ({ statusCode: status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }, body: JSON.stringify(body) });
const soft = (status, body) => reply(200, { ...(body || {}), fail: status });

function tokenClaims(token) {
  try { return JSON.parse(Buffer.from(String(token).split('.')[1] || '', 'base64url').toString('utf8')) || {}; } catch { return {}; }
}

async function callerFrom(event) {
  try {
    const token = headerOf(event, 'authorization').replace(/^Bearer\s+/i, '').trim();
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

function headerOf(event, name) {
  const h = event.headers || {};
  const want = name.toLowerCase();
  const key = Object.keys(h).find((k) => k.toLowerCase() === want);
  return key ? String(h[key] || '') : '';
}

function ipOf(event) {
  const direct = headerOf(event, 'x-nf-client-connection-ip').trim();
  if (direct) return direct.slice(0, 64);
  return (headerOf(event, 'x-forwarded-for').split(',')[0].trim() || 'unknown').slice(0, 64);
}

function sha256Hex(text) {
  return createHash('sha256').update(String(text), 'utf8').digest('hex');
}

function placeOf(event) {
  const raw = headerOf(event, 'x-nf-geo');
  if (!raw) return null;
  try {
    const g = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
    return [g && g.city, g && g.country && g.country.name].filter(Boolean).join(', ').slice(0, 80) || null;
  } catch { return null; }
}

function deviceOf(ua) {
  const s = String(ua || '');
  let os = 'a device';
  if (/iPhone/.test(s)) os = 'iPhone';
  else if (/iPad/.test(s)) os = 'iPad';
  else if (/Android/.test(s)) os = 'Android';
  else if (/Windows/.test(s)) os = 'Windows';
  else if (/CrOS/.test(s)) os = 'Chromebook';
  else if (/Mac OS X|Macintosh/.test(s)) os = 'Mac';
  else if (/Linux/.test(s)) os = 'Linux';
  let browser = 'Browser';
  if (/Edg\//.test(s)) browser = 'Edge';
  else if (/OPR\/|Opera/.test(s)) browser = 'Opera';
  else if (/Firefox|FxiOS/.test(s)) browser = 'Firefox';
  else if (/CriOS|Chrome/.test(s)) browser = 'Chrome';
  else if (/Safari/.test(s)) browser = 'Safari';
  return `${browser} on ${os}`;
}

async function bumpUsage(uid, kind) {
  try {
    const { data, error } = await supabase.rpc('zchat_ai_bump', { p_user: uid, p_kind: kind });
    if (error) return 0;
    return Number(data) || 0;
  } catch { return 0; }
}

async function rpc(name, args) {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw new Error(`${name}: ${error.message}`);
  return data;
}

async function geminiText(parts, systemText, timeoutMs = 9000, asJson = false) {
  if (!process.env.GEMINI_API_KEY) return null;
  for (const model of [...new Set([GEMINI_MODEL, GEMINI_FALLBACK])]) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: systemText }] }, contents: [{ role: 'user', parts }], generationConfig: { maxOutputTokens: 256, temperature: 0, ...(asJson ? { responseMimeType: 'application/json' } : {}) } }),
        signal: ctrl.signal,
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) { if (res.status === 429) return { limited: true }; continue; }
      const cand = json && json.candidates && json.candidates[0];
      const text = ((cand && cand.content && cand.content.parts) || []).filter((p) => typeof p.text === 'string' && !p.thought).map((p) => p.text).join('').trim();
      if (text) return { text };
    } catch {
      continue;
    } finally { clearTimeout(timer); }
  }
  return null;
}

async function ollamaText(systemText, userText, timeoutMs = 6000, asJson = false) {
  if (!OLLAMA_URL) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const headers = { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': '1' };
    if (process.env.OLLAMA_AUTH) headers.Authorization = `Basic ${Buffer.from(process.env.OLLAMA_AUTH).toString('base64')}`;
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST', headers, signal: ctrl.signal,
      body: JSON.stringify({ model: OLLAMA_MODEL, stream: false, think: false, ...(asJson ? { format: 'json' } : {}), options: { temperature: 0 }, messages: [{ role: 'system', content: systemText }, { role: 'user', content: userText }] }),
    });
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    const text = json && json.message && typeof json.message.content === 'string' ? json.message.content.replace(/<think>[\s\S]*?<\/think>/g, '').trim() : '';
    return text ? { text } : null;
  } catch { return null; } finally { clearTimeout(timer); }
}

function parseJson(text) {
  const raw = String(text || '').replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  try { return JSON.parse(raw); } catch {}
  const i = raw.indexOf('{');
  const j = raw.lastIndexOf('}');
  if (i >= 0 && j > i) { try { return JSON.parse(raw.slice(i, j + 1)); } catch {} }
  return null;
}

async function kindcheck(user, body) {
  const text = String(body.text || '').replace(/\s+/g, ' ').trim().slice(0, 600);
  if (!text) return reply(400, { error: 'Nothing to check' });
  if ((await bumpUsage(user.id, 'kindcheck')) > LIMITS.kindcheck) return reply(200, { hurtful: false, skipped: true });
  const sys = 'You read one comment that someone is about to post under another person\'s photo or post. Decide if it would likely hurt the person it is about: insults, mocking their looks, body, skin, voice or family, slurs, threats, telling them to harm themselves, or cruel jokes. Friendly teasing that is clearly kind, swearing that is not aimed at anyone, disagreeing with an idea, and sharing your own sad or angry feelings are not hurtful. It may be written in English, Sinhala, Tamil or a mix in English letters. Reply with JSON only, like {"hurtful":false}.';
  const out = (await ollamaText(sys, text, 5000, true)) || (await geminiText([{ text }], sys, 7000, true));
  if (!out || out.limited || !out.text) return reply(200, { hurtful: false, skipped: true });
  const j = parseJson(out.text);
  return reply(200, { hurtful: !!(j && j.hurtful === true) });
}

const SHORTENERS = new Set(['bit.ly', 'bitly.com', 'tinyurl.com', 'goo.gl', 'is.gd', 'cutt.ly', 'rb.gy', 'shorturl.at', 'tiny.cc', 'ow.ly', 'buff.ly', 'rebrand.ly', 's.id', 't.ly', 'v.gd', 'shorte.st', 'adf.ly', 'tiny.one', 'qrco.de', 'urlz.fr', 'clck.ru', 'u.to', 'x.gd', 't.co', 'lnkd.in', 'bit.do', 'cutt.us', 'surl.li', 'shorturl.asia', 'tinu.be', 'gg.gg']);
const RISKY_TLDS = new Set(['zip', 'mov', 'top', 'click', 'loan', 'work', 'gq', 'tk', 'ml', 'cf', 'ga', 'icu', 'cam', 'rest', 'country', 'kim', 'bid', 'win', 'cyou', 'sbs', 'cfd', 'quest', 'monster', 'buzz', 'xyz', 'su', 'lat', 'bond', 'shop', 'live', 'site', 'online', 'store', 'fun', 'today', 'support', 'help']);
const BRANDS = [
  ['paypal', ['paypal.com', 'paypal.me']], ['apple', ['apple.com', 'icloud.com', 'apple.co']], ['icloud', ['icloud.com', 'apple.com']],
  ['google', ['google.com', 'youtube.com', 'goo.gl', 'g.co', 'gmail.com', 'google.lk']], ['gmail', ['gmail.com', 'google.com']], ['youtube', ['youtube.com', 'youtu.be']],
  ['facebook', ['facebook.com', 'fb.com', 'fb.me', 'meta.com']], ['instagram', ['instagram.com', 'instagr.am']], ['whatsapp', ['whatsapp.com', 'whatsapp.net', 'wa.me']],
  ['netflix', ['netflix.com']], ['amazon', ['amazon.com', 'amzn.to', 'amzn.eu', 'amazon.in']], ['microsoft', ['microsoft.com', 'live.com', 'office.com', 'outlook.com']],
  ['outlook', ['outlook.com', 'live.com', 'microsoft.com']], ['binance', ['binance.com']], ['coinbase', ['coinbase.com']], ['metamask', ['metamask.io']],
  ['steamcommunity', ['steamcommunity.com']], ['steampowered', ['steampowered.com']], ['steam', ['steampowered.com', 'steamcommunity.com']], ['discord', ['discord.com', 'discord.gg', 'discordapp.com', 'discord.new']],
  ['telegram', ['telegram.org', 't.me', 'telegram.me']], ['tiktok', ['tiktok.com']], ['snapchat', ['snapchat.com']], ['twitter', ['twitter.com', 'x.com', 't.co']],
  ['zchat', ['getzchat.com']], ['getzchat', ['getzchat.com']], ['dialog', ['dialog.lk']], ['sampath', ['sampath.lk']], ['combank', ['combank.lk', 'combank.net']],
  ['peoplesbank', ['peoplesbank.lk']], ['frimi', ['frimi.lk']], ['ezcash', ['ezcash.lk']], ['dhl', ['dhl.com']], ['fedex', ['fedex.com']], ['roblox', ['roblox.com']], ['garena', ['garena.com']], ['pubg', ['pubg.com', 'pubgmobile.com']],
];
const PATH_WORDS = /(login|log-in|signin|sign-in|verify|verification|secure|account|update|wallet|airdrop|claim|gift|prize|bonus|recover|unlock|suspend|otp|password|kyc|free|reward|nitro|giveaway)/i;
const SCAM_HOST_WORDS = /(free-?nitro|airdrop|giveaway|claim-?reward|gift-?card|crypto-?double|double-?your|wallet-?connect|verify-?account|account-?verify|security-?check|login-?secure|secure-?login)/i;

function fold(s) {
  return String(s || '').toLowerCase().replace(/rn/g, 'm').replace(/vv/g, 'w').replace(/0/g, 'o').replace(/[1l|]/g, 'i').replace(/3/g, 'e').replace(/5/g, 's').replace(/4/g, 'a').replace(/7/g, 't').replace(/\$/g, 's');
}
const BRANDS_FOLD = BRANDS.map(([b, list]) => [b, fold(b), list]);

function registrable(host) {
  const parts = host.split('.').filter(Boolean);
  if (parts.length <= 2) return parts.join('.');
  const second = parts[parts.length - 2];
  const top = parts[parts.length - 1];
  if (top.length === 2 && /^(co|com|net|org|gov|ac|edu|ltd|plc|sch)$/.test(second)) return parts.slice(-3).join('.');
  return parts.slice(-2).join('.');
}

const BRAND_NAMES = { paypal: 'PayPal', icloud: 'iCloud', youtube: 'YouTube', tiktok: 'TikTok', whatsapp: 'WhatsApp', metamask: 'MetaMask', steamcommunity: 'Steam', steampowered: 'Steam', combank: 'Commercial Bank', peoplesbank: 'People\'s Bank', frimi: 'FriMi', ezcash: 'eZ Cash', dhl: 'DHL', fedex: 'FedEx', pubg: 'PUBG', zchat: 'ZChat', getzchat: 'ZChat' };
function brandName(b) { return BRAND_NAMES[b] || `${b.charAt(0).toUpperCase()}${b.slice(1)}`; }

function patternVerdict(u) {
  const host = u.hostname.toLowerCase().replace(/\.$/, '');
  const reg = registrable(host);
  const tld = host.split('.').pop();
  if (u.username || u.password) return { v: 'danger', why: 'This link hides where it really goes.' };
  if (isIP(host.replace(/^\[|\]$/g, ''))) return { v: 'danger', why: 'This link goes to a bare number address instead of a real website.' };
  if (host.split('.').some((l) => l.indexOf('xn--') === 0)) return { v: 'danger', why: 'This website name uses look alike letters.' };
  const tokens = host.split(/[.-]/).filter(Boolean);
  const regLabel = reg.split('.')[0];
  for (const [brand, brandFold, official] of BRANDS_FOLD) {
    const hit = tokens.some((t) => t === brand || fold(t) === brandFold || (brand.length >= 6 && fold(t).includes(brandFold)));
    if (!hit) continue;
    if (official.includes(reg) || regLabel === brand) continue;
    if (brand === 'zchat' || brand === 'getzchat') return { v: 'danger', why: 'This is not a real ZChat page. ZChat only uses getzchat.com.' };
    return { v: 'danger', why: `This is not the real ${brandName(brand)} website.` };
  }
  if (SCAM_HOST_WORDS.test(host)) return { v: 'danger', why: 'This website name matches a common scam.' };
  if (RISKY_TLDS.has(tld) && PATH_WORDS.test(`${host}${u.pathname}`)) return { v: 'danger', why: 'This website looks like a trick to get your login or money.' };
  return null;
}

const feedState = { at: 0, hosts: null, job: null };
async function feedHosts() {
  if (!FEED_URL) return null;
  if (feedState.hosts && Date.now() - feedState.at < 6 * 3600000) return feedState.hosts;
  if (feedState.job) return feedState.job;
  feedState.job = (async () => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    try {
      const res = await fetch(FEED_URL, { signal: ctrl.signal });
      if (!res.ok) return feedState.hosts;
      const text = (await res.text()).slice(0, 3000000);
      const set = new Set();
      text.split('\n').forEach((line) => { try { const h = new URL(line.trim()).hostname.toLowerCase(); if (h && !isIP(h)) set.add(h); } catch {} });
      feedState.hosts = set;
      feedState.at = Date.now();
      return set;
    } catch { return feedState.hosts; } finally { clearTimeout(timer); feedState.job = null; }
  })();
  return feedState.job;
}

function privateAddress(ip) {
  if (!ip) return true;
  if (ip.includes(':')) {
    const s = ip.toLowerCase();
    return s === '::1' || s === '::' || s.startsWith('fc') || s.startsWith('fd') || s.startsWith('fe80') || s.startsWith('::ffff:10.') || s.startsWith('::ffff:127.') || s.startsWith('::ffff:192.168.') || s.startsWith('::ffff:169.254.');
  }
  const p = ip.split('.').map(Number);
  if (p.length !== 4 || p.some((x) => !Number.isFinite(x))) return true;
  return p[0] === 10 || p[0] === 127 || p[0] === 0 || (p[0] === 169 && p[1] === 254) || (p[0] === 172 && p[1] >= 16 && p[1] <= 31) || (p[0] === 192 && p[1] === 168) || (p[0] === 100 && p[1] >= 64 && p[1] <= 127) || p[0] >= 224;
}

async function safeToFetch(u) {
  if (!/^https?:$/.test(u.protocol) || (u.port && !['80', '443'].includes(u.port))) return false;
  const host = u.hostname.replace(/^\[|\]$/g, '');
  if (isIP(host)) return !privateAddress(host);
  try {
    const all = await lookup(host, { all: true });
    return all.length > 0 && all.every((a) => !privateAddress(a.address));
  } catch { return false; }
}

async function expandShort(u) {
  let cur = u;
  for (let hop = 0; hop < 5; hop++) {
    if (!(await safeToFetch(cur))) return null;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3500);
    try {
      const res = await fetch(cur.href, { method: 'GET', redirect: 'manual', signal: ctrl.signal, headers: { 'user-agent': 'ZChatLinkCheck/1.0' } });
      try { await res.body?.cancel(); } catch {}
      const loc = res.headers.get('location');
      if (res.status >= 300 && res.status < 400 && loc) {
        cur = new URL(loc, cur);
        const reg = registrable(cur.hostname.toLowerCase());
        if (!SHORTENERS.has(reg)) return cur;
        continue;
      }
      return hop === 0 ? null : cur;
    } catch { return null; } finally { clearTimeout(timer); }
  }
  return null;
}

async function fakeLoginPage(u) {
  if (!PATH_WORDS.test(u.pathname + u.search) || !(await safeToFetch(u))) return false;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 3500);
  try {
    const res = await fetch(u.href, { redirect: 'follow', signal: ctrl.signal, headers: { 'user-agent': 'Mozilla/5.0 ZChatLinkCheck/1.0' } });
    if (!res.ok || !/text\/html/i.test(res.headers.get('content-type') || '')) { try { await res.body?.cancel(); } catch {} return false; }
    const reader = res.body.getReader();
    let got = '';
    while (got.length < 200000) {
      const { value, done } = await reader.read();
      if (done) break;
      got += Buffer.from(value).toString('utf8');
    }
    try { await reader.cancel(); } catch {}
    const html = got.toLowerCase();
    return /type\s*=\s*["']?password/.test(html) && /zchat/.test(html);
  } catch { return false; } finally { clearTimeout(timer); }
}

const memo = new Map();
function memoGet(k) { const m = memo.get(k); if (m && m.until > Date.now()) return m.val; if (m) memo.delete(k); return null; }
function memoPut(k, val, hours) { if (memo.size > 3000) memo.clear(); memo.set(k, { val, until: Date.now() + hours * 3600000 }); }

async function linkcheck(user, body) {
  const urls = (Array.isArray(body.urls) ? body.urls : []).map((x) => String(x || '').trim()).filter((x) => /^https?:\/\//i.test(x) && x.length <= 2000).slice(0, 20);
  if (!urls.length) return reply(400, { error: 'Nothing to check' });
  if ((await bumpUsage(user.id, 'linkcheck')) > LIMITS.linkcheck) return reply(200, { results: {} });
  const parsed = [];
  urls.forEach((href) => { try { const u = new URL(href); parsed.push({ href, u, host: u.hostname.toLowerCase().replace(/\.$/, ''), reg: registrable(u.hostname.toLowerCase().replace(/\.$/, '')) }); } catch {} });
  const keys = [...new Set(parsed.flatMap((p) => [p.host, p.reg, SHORTENERS.has(p.reg) ? `url:${sha256Hex(p.href)}` : null]).filter(Boolean))];
  let cache = {};
  let blocked = {};
  try { const r = await rpc('zchat_link_lookup', { p_keys: keys }); cache = (r && r.cache) || {}; blocked = (r && r.blocked) || {}; } catch {}
  const feed = await feedHosts();
  const store = [];
  const judgeHost = async (u) => {
    const host = u.hostname.toLowerCase().replace(/\.$/, '');
    const reg = registrable(host);
    const hit = memoGet(host) || (cache[host] && { v: cache[host].v, why: cache[host].why });
    if (hit) return hit;
    let out = null;
    if (blocked[host] || blocked[reg]) out = { v: 'danger', why: 'People reported this website as a scam.' };
    if (!out && feed && (feed.has(host) || feed.has(reg))) out = { v: 'danger', why: 'This website is on a public list of scam pages.' };
    if (!out) out = patternVerdict(u);
    if (!out && /zchat/i.test(u.href) && reg !== 'getzchat.com' && (await fakeLoginPage(u))) out = { v: 'danger', why: 'This page copies the ZChat login. ZChat only uses getzchat.com.' };
    if (!out) out = { v: 'ok', why: null };
    memoPut(host, out, out.v === 'ok' ? 12 : 72);
    store.push({ k: host, v: out.v, why: out.why, h: out.v === 'ok' ? 24 : 168 });
    return out;
  };
  const results = {};
  await Promise.all(parsed.map(async (p) => {
    if (SHORTENERS.has(p.reg)) {
      const key = `url:${sha256Hex(p.href)}`;
      const hit = memoGet(key) || (cache[key] && { v: cache[key].v, why: cache[key].why, to: cache[key].to });
      if (hit) { results[p.href] = hit; return; }
      const target = await expandShort(p.u);
      let out;
      if (!target) out = { v: 'warn', why: 'This short link hides where it really goes.' };
      else {
        const t = await judgeHost(target);
        out = t.v === 'ok' ? { v: 'ok', why: null, to: target.hostname } : { v: t.v, why: `This short link leads to a risky page. ${t.why || ''}`.trim(), to: target.hostname };
      }
      memoPut(key, out, 24);
      store.push({ k: key, v: out.v, why: out.why, to: out.to || null, h: 24 });
      results[p.href] = out;
      return;
    }
    const out = await judgeHost(p.u);
    results[p.href] = out;
  }));
  if (store.length) { try { await rpc('zchat_link_store', { p_rows: store.slice(0, 60) }); } catch {} }
  return reply(200, { results });
}

function taskSig(id, uid, n) {
  return createHmac('sha256', `zchat-export:${SERVICE_KEY}`).update(`${id}:${uid}:${n}`).digest('hex');
}

const DEVICE_KEYS = /^zchat-(theme-mode|theme-sched|sound|reaction-sound|data-saver|hidden-words|translate-to|fontscale|reduce-motion|format|spam-filter|quiet|tone|chat-tones|enter-send|autoplay|auto-download|bubble|wallpaper)/;
function cleanDevice(input) {
  const out = {};
  if (!input || typeof input !== 'object') return out;
  Object.entries(input).slice(0, 80).forEach(([k, v]) => {
    if (!DEVICE_KEYS.test(k) || /token|lock|secret|hash|auth|session|pin|key/i.test(k.replace(/^zchat-/, ''))) return;
    const s = typeof v === 'string' ? v.slice(0, 2000) : null;
    if (s !== null) out[k] = s;
  });
  return out;
}

async function exportStart(event, user, body) {
  const r = await rpc('zchat_export_begin', { p_user: user.id });
  if (!r || !r.ok) {
    const why = r && r.reason;
    if (why === 'busy') return reply(200, { id: r.id, status: 'working' });
    if (why === 'limited') return soft(429, { error: 'You can ask for your data once a day.', id: r.id, next_at: r.next_at });
    return reply(403, { error: 'Could not start right now. Try again later.' });
  }
  const id = r.id;
  const n = 0;
  const payload = { id, uid: user.id, n, device: cleanDevice(body.device) };
  try {
    const res = await fetch(`${SITE}/.netlify/functions/zchat-safety-background`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-zchat-task': taskSig(id, user.id, n) },
      body: JSON.stringify(payload),
    });
    if (res.status >= 400) throw new Error(String(res.status));
  } catch {
    await supabase.from('zchat_data_exports').update({ status: 'failed', error: 'start', updated_at: new Date().toISOString() }).eq('id', id);
    return reply(503, { error: 'Could not start right now. Try again later.' });
  }
  return reply(200, { id, status: 'queued' });
}

async function exportLink(user, body) {
  const id = String(body.id || '');
  const part = Math.max(1, Math.min(99, Number(body.part) || 1));
  if (!/^[0-9a-f-]{36}$/i.test(id)) return reply(400, { error: 'Bad request' });
  if ((await bumpUsage(user.id, 'export_link')) > LIMITS.export_link) return soft(429, { error: 'Too many downloads today. Try again tomorrow.' });
  const { data: row } = await supabase.from('zchat_data_exports').select('id, user_id, status, parts, expires_at').eq('id', id).maybeSingle();
  if (!row || row.user_id !== user.id) return soft(404, { error: 'That download is not here anymore.' });
  if (row.status !== 'ready' || !row.expires_at || new Date(row.expires_at).getTime() < Date.now()) return soft(410, { error: 'This download expired. You can ask for a new one.' });
  const item = (Array.isArray(row.parts) ? row.parts : []).find((p) => Number(p.n) === part);
  if (!item || typeof item.path !== 'string' || item.path.indexOf(`${user.id}/`) !== 0) return reply(404, { error: 'That part is missing.' });
  const total = row.parts.length;
  const name = total > 1 ? `ZChat data part ${part} of ${total}.zip` : 'ZChat data.zip';
  const { data, error } = await supabase.storage.from('zchat-exports').createSignedUrl(item.path, 600, { download: name });
  if (error || !data || !data.signedUrl) return reply(503, { error: 'Could not make the link. Try again.' });
  return reply(200, { url: data.signedUrl, name });
}

function maskEmail(email) {
  const [a, b] = String(email || '').split('@');
  if (!a || !b) return 'a new address';
  return `${a.charAt(0)}•••@${b}`;
}
function escHtml(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

let mailWarned = false;
async function sendNoticeEmail(to, name, newEmail, cancelUrl) {
  const key = process.env.RESEND_API_KEY;
  if (!key) { if (!mailWarned) { mailWarned = true; console.error('zchat safety: RESEND_API_KEY is not set, recovery emails are skipped'); } return false; }
  if (!to) return false;
  const first = String(name || '').split(' ')[0] || 'there';
  const text = `Hi ${first},\n\nThree of your trusted friends just helped someone get back into your ZChat account. In 24 hours your login email changes to ${maskEmail(newEmail)} and a new password is set.\n\nIf this was you, there is nothing to do.\n\nIf it was not you, stop it now:\n${cancelUrl}\n\nZChat`;
  const html = `<!doctype html><html><body style="margin:0;background:#F4F3F8;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#16151C">
<div style="max-width:480px;margin:0 auto;padding:28px 20px">
<img src="${SITE}/logo.png" width="44" height="44" alt="ZChat" style="display:block;border-radius:12px">
<div style="background:#FFFFFF;border-radius:18px;padding:22px 20px;margin-top:18px">
<p style="margin:0 0 12px;font-size:16px">Hi ${escHtml(first)},</p>
<p style="margin:0 0 12px;font-size:15px;line-height:1.55">Three of your trusted friends just helped someone get back into your ZChat account. In 24 hours your login email changes to <b>${escHtml(maskEmail(newEmail))}</b> and a new password is set.</p>
<p style="margin:0 0 18px;font-size:15px;line-height:1.55">If this was you, there is nothing to do. If it was not you, stop it now.</p>
<a href="${escHtml(cancelUrl)}" style="display:inline-block;background:#7C5CFC;color:#FFFFFF;text-decoration:none;font-weight:700;font-size:15px;padding:12px 22px;border-radius:12px">Stop this change</a>
</div>
<p style="font-size:12px;color:#8A8794;margin:16px 4px 0;line-height:1.5">You got this because a recovery was started for your ZChat account. ZChat will never ask you for this link or for a code.</p>
</div></body></html>`;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: MAIL_FROM, to: [to], subject: 'Someone is changing your ZChat login', text, html }),
    });
    return res.ok;
  } catch { return false; }
}

const REC_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const REC_SECRET = /^[A-Za-z0-9_-]{43}$/;
const REC_ERRORS = {
  input: 'Check what you typed and try again.',
  not_found: 'We could not find that username. Check it and try again.',
  not_ready: 'This account cannot use trusted friends yet. Friends need to be picked at least 3 days before.',
  limited: 'Too many tries for now. Wait an hour and try again.',
  locked: 'Getting help from friends is paused for this account for now. Try again in a few days.',
  busy: 'There is already a request for this account. Use the phone that started it, or wait a day.',
  gone: 'This request is not active anymore. Start again.',
  expired: 'This request expired. Start again.',
  denied: 'A trusted friend said this was not you, so the request was stopped.',
  cancelled: 'The request was stopped from the account email.',
  taken: 'That email is already used by another account.',
  wrong: 'That code is not right. Check it with your friend.',
};
function recError(r, status = 400) {
  const why = (r && r.reason) || 'gone';
  return soft(why === 'limited' ? 429 : status, { error: REC_ERRORS[why] || REC_ERRORS.gone, reason: why, left: r && r.left });
}
function cleanCode(c) { return String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8); }

async function recStart(event, body) {
  const hash = String(body.hash || '');
  const username = String(body.username || '').trim().slice(0, 40);
  if (!/^[0-9a-f]{64}$/.test(hash) || !username) return recError({ reason: 'input' });
  const r = await rpc('zchat_rec_start', { p_username: username, p_secret_hash: hash, p_ip: ipOf(event), p_device: deviceOf(headerOf(event, 'user-agent')), p_place: placeOf(event) });
  if (!r || !r.ok) return recError(r);
  return reply(200, { id: r.id, friends: r.friends, expires_at: r.expires_at });
}

async function recCode(event, body) {
  const id = String(body.id || '');
  const secret = String(body.secret || '');
  const code = cleanCode(body.code);
  if (!REC_ID.test(id) || !REC_SECRET.test(secret) || code.length !== 8) return recError({ reason: 'wrong', left: undefined });
  const r = await rpc('zchat_rec_check', { p_id: id, p_secret_hash: sha256Hex(secret), p_code_hash: sha256Hex(`${id}:${code}`), p_ip: ipOf(event) });
  if (!r || !r.ok) return recError(r);
  return reply(200, { used: r.used, need: r.need, status: r.status });
}

async function recStatus(body) {
  const id = String(body.id || '');
  const secret = String(body.secret || '');
  if (!REC_ID.test(id) || !REC_SECRET.test(secret)) return recError({ reason: 'gone' }, 404);
  const r = await rpc('zchat_rec_status', { p_id: id, p_secret_hash: sha256Hex(secret) });
  if (!r || !r.ok) return recError(r, 404);
  return reply(200, { status: r.status, used: r.used, need: r.need, friends: r.friends, expires_at: r.expires_at, apply_after: r.apply_after, has_email: r.has_email });
}

async function recEmail(body) {
  const id = String(body.id || '');
  const secret = String(body.secret || '');
  const email = String(body.email || '').trim().toLowerCase();
  if (!REC_ID.test(id) || !REC_SECRET.test(secret) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return recError({ reason: 'input' });
  const cancel = randomBytes(32).toString('base64url');
  const r = await rpc('zchat_rec_email', { p_id: id, p_secret_hash: sha256Hex(secret), p_email: email, p_cancel_hash: sha256Hex(cancel) });
  if (!r || !r.ok) return recError(r);
  await sendNoticeEmail(r.old_email, r.name, email, `${SITE}/?recovery_cancel=${cancel}`);
  return reply(200, { apply_after: r.apply_after });
}

async function recFinish(body) {
  const id = String(body.id || '');
  const secret = String(body.secret || '');
  const password = String(body.password || '');
  if (!REC_ID.test(id) || !REC_SECRET.test(secret)) return recError({ reason: 'gone' }, 404);
  if (password.length < 8 || password.length > 72) return soft(400, { error: 'Use at least 8 characters for your new password.' });
  const hash = sha256Hex(secret);
  const r = await rpc('zchat_rec_ready', { p_id: id, p_secret_hash: hash });
  if (!r || !r.ok) {
    if (r && r.reason === 'wait') return soft(425, { error: 'Not yet. Your account opens after the 24 hour wait.', apply_after: r.apply_after });
    return recError(r);
  }
  const upd = await supabase.auth.admin.updateUserById(r.user_id, { email: r.new_email, email_confirm: true, password });
  if (upd.error) return /already|registered|exists/i.test(String(upd.error.message || '')) ? soft(409, { error: REC_ERRORS.taken, reason: 'taken' }) : reply(500, { error: 'Could not finish right now. Try again soon.' });
  const done = await rpc('zchat_rec_mark_done', { p_id: id, p_secret_hash: hash });
  if (!done || !done.ok) return reply(409, { error: 'Could not finish right now. Try again soon.' });
  const { data: link, error: linkErr } = await supabase.auth.admin.generateLink({ type: 'magiclink', email: r.new_email });
  const tokenHash = !linkErr && link && link.properties ? link.properties.hashed_token : null;
  if (!tokenHash) return reply(200, { done: true, token_hash: null, approval_off: !!done.approval_off });
  return reply(200, { done: true, token_hash: tokenHash, approval_off: !!done.approval_off });
}

async function recCancel(event, body) {
  const token = String(body.token || '');
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return soft(400, { error: 'This link is not valid.' });
  const r = await rpc('zchat_rec_cancel', { p_cancel_hash: sha256Hex(token), p_ip: ipOf(event) });
  if (r && r.ok) return reply(200, { ok: true });
  if (r && r.reason && ['done'].includes(r.reason)) return soft(409, { error: 'This change already went through. Log in with your trusted friends or contact ZChat support.' });
  return soft(404, { error: 'This change was already stopped or is no longer active.' });
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return reply(405, { error: 'Method not allowed' });
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch { return reply(400, { error: 'Bad request' }); }
  if (!SERVICE_KEY) return reply(503, { error: 'Not set up yet' });
  const action = String((body && body.action) || '');
  try {
    if (action === 'rec_start') return await recStart(event, body);
    if (action === 'rec_code') return await recCode(event, body);
    if (action === 'rec_status') return await recStatus(body);
    if (action === 'rec_email') return await recEmail(body);
    if (action === 'rec_finish') return await recFinish(body);
    if (action === 'rec_cancel') return await recCancel(event, body);
    const user = await callerFrom(event);
    if (!user) return reply(401, { error: 'Not signed in' });
    if (action === 'kindcheck') return await kindcheck(user, body);
    if (action === 'linkcheck') return await linkcheck(user, body);
    if (action === 'export_start') return await exportStart(event, user, body);
    if (action === 'export_link') return await exportLink(user, body);
    return reply(400, { error: 'Unknown action' });
  } catch (err) {
    console.error('zchat safety failed', action, err && err.message);
    return reply(500, { error: 'Something went wrong. Try again.' });
  }
};

