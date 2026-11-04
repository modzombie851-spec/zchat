import { createHmac, timingSafeEqual } from 'node:crypto';
import { deflateRawSync } from 'node:zlib';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://etcmbghcmlgeezwgnwuz.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(SUPABASE_URL, SERVICE_KEY || 'missing', { auth: { persistSession: false, autoRefreshToken: false } });
const SITE = (process.env.ZCHAT_SITE || process.env.URL || 'https://getzchat.com').replace(/\/+$/, '');
const STORAGE_HOST = (() => { try { return new URL(SUPABASE_URL).host; } catch { return ''; } })();
const PART_LIMIT = 40 * 1024 * 1024;
const MEDIA_MAX = 30 * 1024 * 1024;
const TIME_BUDGET = 11 * 60 * 1000;
const BUCKET = 'zchat-exports';
const PAGE = 1000;

function taskSig(id, uid, n) {
  return createHmac('sha256', `zchat-export:${SERVICE_KEY}`).update(`${id}:${uid}:${n}`).digest('hex');
}
function sigOk(given, want) {
  const a = Buffer.from(String(given || ''), 'utf8');
  const b = Buffer.from(want, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}
function headerOf(event, name) {
  const h = event.headers || {};
  const key = Object.keys(h).find((k) => k.toLowerCase() === name);
  return key ? String(h[key] || '') : '';
}

const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

class ZipPart {
  constructor() { this.chunks = []; this.central = []; this.size = 0; this.count = 0; this.names = new Set(); }
  add(name, data, compress) {
    let n = name;
    for (let i = 2; this.names.has(n); i++) n = name.replace(/(\.[a-z0-9]+)?$/i, (m) => ` ${i}${m || ''}`);
    this.names.add(n);
    const raw = Buffer.isBuffer(data) ? data : Buffer.from(String(data), 'utf8');
    const packed = compress ? deflateRawSync(raw, { level: 6 }) : raw;
    const method = compress ? 8 : 0;
    const nameBuf = Buffer.from(n, 'utf8');
    const crc = crc32(raw);
    const now = new Date();
    const dosTime = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xFFFF;
    const dosDate = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xFFFF;
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x0800, 6); lh.writeUInt16LE(method, 8);
    lh.writeUInt16LE(dosTime, 10); lh.writeUInt16LE(dosDate, 12); lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(packed.length, 18); lh.writeUInt32LE(raw.length, 22); lh.writeUInt16LE(nameBuf.length, 26); lh.writeUInt16LE(0, 28);
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0x0800, 8); ch.writeUInt16LE(method, 10);
    ch.writeUInt16LE(dosTime, 12); ch.writeUInt16LE(dosDate, 14); ch.writeUInt32LE(crc, 16);
    ch.writeUInt32LE(packed.length, 20); ch.writeUInt32LE(raw.length, 24); ch.writeUInt16LE(nameBuf.length, 28);
    ch.writeUInt32LE(this.size, 42);
    this.chunks.push(lh, nameBuf, packed);
    this.central.push(ch, nameBuf);
    this.size += 30 + nameBuf.length + packed.length;
    this.count += 1;
    return n;
  }
  fits(bytes) { return this.count === 0 || (this.count < 60000 && this.size + bytes + 200 <= PART_LIMIT); }
  finish() {
    const cd = Buffer.concat(this.central);
    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(this.count, 8); end.writeUInt16LE(this.count, 10);
    end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(this.size, 16);
    return Buffer.concat([...this.chunks, cd, end]);
  }
}

async function patch(id, fields) {
  await supabase.from('zchat_data_exports').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', id);
}

async function pageAll(build, max = 200000) {
  const out = [];
  for (let from = 0; from < max; from += PAGE) {
    const { data, error } = await build().range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    const rows = data || [];
    out.push(...rows);
    if (rows.length < PAGE) break;
  }
  return out;
}

const SAFE_PROFILE = /hash|secret|token|device|lock|banned|is_admin|admin/i;
function cleanProfile(p) {
  return Object.fromEntries(Object.entries(p || {}).filter(([k]) => !SAFE_PROFILE.test(k)));
}
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

function mediaPath(u) {
  if (typeof u !== 'string' || !u) return null;
  if (u.indexOf('zp:') === 0) return { bucket: 'chat-private', path: u.slice(3) };
  try {
    const url = new URL(u);
    if (url.host !== STORAGE_HOST) return null;
    const m = url.pathname.match(/^\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)$/);
    if (!m) return null;
    return { bucket: decodeURIComponent(m[1]), path: decodeURIComponent(m[2]) };
  } catch { return null; }
}
function extOf(path, type) {
  const m = String(path || '').toLowerCase().match(/\.([a-z0-9]{2,5})$/);
  if (m) return m[1];
  const t = String(type || '').toLowerCase();
  if (/jpeg|jpg/.test(t)) return 'jpg';
  if (/png/.test(t)) return 'png';
  if (/webp/.test(t)) return 'webp';
  if (/gif/.test(t)) return 'gif';
  if (/mp4/.test(t)) return 'mp4';
  if (/webm/.test(t)) return 'webm';
  if (/mpeg/.test(t)) return 'mp3';
  return 'bin';
}
async function download(ref) {
  try {
    const { data, error } = await supabase.storage.from(ref.bucket).download(ref.path);
    if (error || !data) return null;
    const buf = Buffer.from(await data.arrayBuffer());
    if (!buf.length || buf.length > MEDIA_MAX) return null;
    return { buf, type: data.type || '' };
  } catch { return null; }
}

function messageText(m) {
  const c = typeof m.content === 'string' ? m.content : '';
  if (m.type === 'sticker') return '[Sticker]';
  if (m.type === 'audio') return '[Voice message]';
  if (/^zonce:/.test(c)) return '[View once]';
  if (/^zsec:|^zwrap:/.test(c)) return '[Secret message]';
  if (/^z[a-z]{2,10}:\s*[{[]/.test(c)) return `[${c.slice(1, c.indexOf(':'))} card]`;
  return c;
}

async function collectText(uid, device) {
  const files = [];
  const [{ data: prof }, userRes, { data: wallet }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
    supabase.auth.admin.getUserById(uid),
    supabase.from('wallets').select('coins, streak, last_claim, free_sets, free_bubbles, updated_at').eq('user_id', uid).maybeSingle(),
  ]);
  const email = userRes && userRes.data && userRes.data.user ? userRes.data.user.email : null;
  const me = cleanProfile(prof || {});
  const [posts, stories, highlights, hlItems, ledger, closeF, blocks, followingRows, followerRows, trusted, groupsMine, searchPref] = await Promise.all([
    pageAll(() => supabase.from('posts').select('*').eq('user_id', uid).order('created_at', { ascending: true })),
    pageAll(() => supabase.from('stories').select('id, media_url, media_type, caption, created_at, expires_at, audience').eq('user_id', uid).order('created_at', { ascending: true })),
    pageAll(() => supabase.from('highlights').select('id, title, cover_url, created_at').eq('user_id', uid)).catch(() => []),
    pageAll(() => supabase.from('highlight_items').select('id, highlight_id, media_url, media_type, created_at').eq('user_id', uid)).catch(() => []),
    pageAll(() => supabase.from('coin_ledger').select('delta, reason, note, created_at').eq('user_id', uid).order('created_at', { ascending: true })),
    pageAll(() => supabase.from('close_friends').select('friend_id, created_at').eq('owner_id', uid)).catch(() => []),
    pageAll(() => supabase.from('blocks').select('blocked_id, created_at').eq('blocker_id', uid)).catch(() => []),
    pageAll(() => supabase.from('follows').select('following_id, status, created_at').eq('follower_id', uid)),
    pageAll(() => supabase.from('follows').select('follower_id, status, created_at').eq('following_id', uid)),
    pageAll(() => supabase.from('zchat_trusted_friends').select('friend_id, added_at').eq('owner_id', uid)).catch(() => []),
    pageAll(() => supabase.from('group_members').select('group_id, role').eq('user_id', uid)),
    supabase.from('zchat_search_prefs').select('visible').eq('user_id', uid).maybeSingle().then((r) => r.data, () => null),
  ]);
  const dms = await pageAll(() => supabase.from('messages').select('id, sender_id, receiver_id, group_id, type, content, media_url, created_at, deleted').or(`sender_id.eq.${uid},receiver_id.eq.${uid}`).is('group_id', null).order('id', { ascending: true }), 400000);
  const groupIds = [...new Set(groupsMine.map((g) => g.group_id))];
  const groupMsgs = [];
  for (let i = 0; i < groupIds.length; i += 30) {
    const ids = groupIds.slice(i, i + 30);
    const rows = await pageAll(() => supabase.from('messages').select('id, sender_id, group_id, type, content, media_url, created_at, deleted').in('group_id', ids).order('id', { ascending: true }), 400000);
    groupMsgs.push(...rows);
  }
  const { data: hiddenRows } = await supabase.from('hidden_messages').select('message_id').eq('user_id', uid).limit(20000);
  const hidden = new Set((hiddenRows || []).map((r) => String(r.message_id)));
  const people = new Set();
  [...dms, ...groupMsgs].forEach((m) => { if (m.sender_id) people.add(m.sender_id); if (m.receiver_id) people.add(m.receiver_id); });
  [...closeF.map((r) => r.friend_id), ...blocks.map((r) => r.blocked_id), ...followingRows.map((r) => r.following_id), ...followerRows.map((r) => r.follower_id), ...trusted.map((r) => r.friend_id)].forEach((id) => people.add(id));
  people.delete(uid);
  const names = {};
  const list = [...people];
  for (let i = 0; i < list.length; i += 300) {
    const { data } = await supabase.from('profiles').select('id, name, username').in('id', list.slice(i, i + 300));
    (data || []).forEach((p) => { names[p.id] = { name: p.name || '', username: p.username || '' }; });
  }
  const groupNames = {};
  if (groupIds.length) {
    for (let i = 0; i < groupIds.length; i += 200) {
      const { data } = await supabase.from('groups').select('id, name').in('id', groupIds.slice(i, i + 200));
      (data || []).forEach((g) => { groupNames[g.id] = g.name || 'Group'; });
    }
  }
  const who = (id) => (id === uid ? 'You' : (names[id] && (names[id].name || names[id].username)) || 'Someone');
  const chats = new Map();
  const push = (key, title, kind, m) => {
    if (!chats.has(key)) chats.set(key, { kind, title, messages: [] });
    chats.get(key).messages.push({ id: String(m.id), from: who(m.sender_id), at: m.created_at, type: m.type, text: messageText(m), media: m.sender_id === uid && m.media_url ? `media/messages/${m.id}` : null });
  };
  dms.forEach((m) => { if (m.deleted || hidden.has(String(m.id))) return; const other = m.sender_id === uid ? m.receiver_id : m.sender_id; push(`d:${other}`, who(other), 'dm', m); });
  groupMsgs.forEach((m) => { if (m.deleted || hidden.has(String(m.id))) return; push(`g:${m.group_id}`, groupNames[m.group_id] || 'Group', 'group', m); });
  const chatList = [...chats.values()];
  const stamp = new Date().toISOString();
  const account = { id: uid, email, name: me.name || '', username: me.username || '', created_at: me.created_at || null, exported_at: stamp };
  const settings = {
    privacy: Object.fromEntries(Object.entries(me).filter(([k]) => /^privacy_|^hide_|read_receipts|is_private|visitors_on|typing_privacy|limit_|limits_until|away_|alert_/.test(k))),
    show_on_search_engines: searchPref ? !!searchPref.visible : !me.is_private,
    close_friends: closeF.map((r) => ({ ...names[r.friend_id], added_at: r.created_at })),
    blocked: blocks.map((r) => ({ ...names[r.blocked_id], at: r.created_at })),
    trusted_friends: trusted.map((r) => ({ ...names[r.friend_id], added_at: r.added_at })),
    this_phone: device || {},
  };
  const coins = { balance: wallet ? wallet.coins : 0, wallet: wallet || null, history: ledger };
  const follows = { following: followingRows.map((r) => ({ ...names[r.following_id], status: r.status, at: r.created_at })), followers: followerRows.map((r) => ({ ...names[r.follower_id], status: r.status, at: r.created_at })) };
  const readme = `Your ZChat data\n\nMade on ${new Date().toUTCString()} for @${account.username}.\n\nindex.html      open this in any browser to look through everything\naccount.json    your account and profile\nposts.json      your posts\nstories.json    your stories and highlights\nchats.json      your chats, with text from everyone in them and media you sent\ncoins.json      your coins and coin history\nsettings.json   your privacy settings, lists and settings from the phone you used\nfollows.json    people you follow and people who follow you\nmedia           photos, videos and voice messages you posted or sent\n\nFor big accounts the media comes in more than one file. Keep all parts together.\nKeep this file private. It has your chats in it.\n`;
  files.push({ name: 'README.txt', data: readme });
  files.push({ name: 'account.json', data: JSON.stringify({ account, profile: me }, null, 1) });
  files.push({ name: 'posts.json', data: JSON.stringify(posts.map((p) => ({ ...p, media: p.media_url ? `media/posts/${p.id}` : null })), null, 1) });
  files.push({ name: 'stories.json', data: JSON.stringify({ stories, highlights, highlight_items: hlItems }, null, 1) });
  files.push({ name: 'chats.json', data: JSON.stringify(chatList) });
  files.push({ name: 'coins.json', data: JSON.stringify(coins, null, 1) });
  files.push({ name: 'settings.json', data: JSON.stringify(settings, null, 1) });
  files.push({ name: 'follows.json', data: JSON.stringify(follows, null, 1) });
  const chatHtml = chatList.slice(0, 400).map((c, i) => `<section id="c${i}"><h2>${esc(c.title)}</h2>${c.messages.slice(-3000).map((m) => `<div class="m${m.from === 'You' ? ' me' : ''}">${c.kind === 'group' && m.from !== 'You' ? `<b>${esc(m.from)}</b>` : ''}<p>${esc(m.text || (m.type === 'image' ? 'Photo' : m.type === 'video' ? 'Video' : ''))}</p><s>${esc(new Date(m.at).toLocaleString('en-GB'))}</s></div>`).join('')}</section>`).join('');
  const postHtml = posts.map((p) => `<div class="post">${p.caption ? `<p>${esc(p.caption)}</p>` : ''}<s>${esc(new Date(p.created_at).toLocaleString('en-GB'))}</s></div>`).join('');
  files.push({ name: 'index.html', data: `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your ZChat data</title><style>body{margin:0;font:15px/1.45 system-ui,sans-serif;background:#f4f3f8;color:#16151c}header{padding:22px 16px;background:#7C5CFC;color:#fff}header h1{margin:0;font-size:22px}main{max-width:720px;margin:0 auto;padding:12px}h2{font-size:17px;margin:22px 4px 8px}.post,.m{background:#fff;border-radius:14px;padding:10px 12px;margin:6px 0;word-wrap:break-word}.m{max-width:78%}.m.me{margin-left:auto;background:#E4DCFF}.m p,.post p{margin:0;white-space:pre-wrap}.m b{display:block;font-size:12px;color:#6B48F0}s{display:block;text-decoration:none;font-size:11px;color:#8a8794;margin-top:3px}nav a{display:block;padding:10px 12px;margin:4px 0;border-radius:12px;background:#fff;color:inherit;text-decoration:none;font-weight:600}</style></head><body><header><h1>Your ZChat data</h1><p>${esc(account.name)} @${esc(account.username)}</p></header><main><h2>Posts</h2>${postHtml || '<p>No posts.</p>'}<h2>Chats</h2><nav>${chatList.slice(0, 400).map((c, i) => `<a href="#c${i}">${esc(c.title)}</a>`).join('')}</nav>${chatHtml}</main></body></html>` });
  const totals = { posts: posts.length, stories: stories.length + hlItems.length, sent: [...dms, ...groupMsgs].filter((m) => m.sender_id === uid && m.media_url && !m.deleted).length };
  return { files, totals };
}

const STAGES = ['posts', 'stories', 'highlights', 'messages'];
async function nextMedia(uid, cur) {
  const stage = cur.stage;
  if (stage === 'posts') {
    let q = supabase.from('posts').select('id, media_url, media_urls, created_at').eq('user_id', uid).order('id', { ascending: true }).limit(40);
    if (cur.after) q = q.gt('id', cur.after);
    const { data } = await q;
    return (data || []).flatMap((p) => {
      const urls = [...new Set([p.media_url, ...(Array.isArray(p.media_urls) ? p.media_urls : [])].filter(Boolean))];
      return urls.map((u, i) => ({ key: p.id, name: `media/posts/${p.id}${urls.length > 1 ? ` ${i + 1}` : ''}`, url: u }));
    });
  }
  if (stage === 'stories') {
    let q = supabase.from('stories').select('id, media_url').eq('user_id', uid).order('id', { ascending: true }).limit(60);
    if (cur.after) q = q.gt('id', cur.after);
    const { data } = await q;
    return (data || []).filter((s) => s.media_url).map((s) => ({ key: s.id, name: `media/stories/${s.id}`, url: s.media_url }));
  }
  if (stage === 'highlights') {
    let q = supabase.from('highlight_items').select('id, media_url').eq('user_id', uid).order('id', { ascending: true }).limit(60);
    if (cur.after) q = q.gt('id', cur.after);
    const { data } = await q;
    return (data || []).filter((s) => s.media_url).map((s) => ({ key: s.id, name: `media/highlights/${s.id}`, url: s.media_url }));
  }
  let q = supabase.from('messages').select('id, media_url, content, deleted').eq('sender_id', uid).not('media_url', 'is', null).order('id', { ascending: true }).limit(60);
  if (cur.after) q = q.gt('id', cur.after);
  const { data } = await q;
  return (data || []).filter((m) => !m.deleted && !/^zonce:/.test(String(m.content || ''))).map((m) => ({ key: m.id, name: `media/messages/${m.id}`, url: m.media_url }));
}

async function uploadPart(uid, id, part, n) {
  const buf = part.finish();
  const path = `${uid}/${id}/part-${n}.zip`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, buf, { contentType: 'application/zip', upsert: true });
  if (error) throw new Error(`upload: ${error.message}`);
  return { n, path, size: buf.length };
}

async function cleanOld(uid, keepId) {
  try {
    const { data: rows } = await supabase.from('zchat_data_exports').select('id, parts').eq('user_id', uid).neq('id', keepId).limit(20);
    const paths = (rows || []).flatMap((r) => (Array.isArray(r.parts) ? r.parts.map((p) => p.path).filter((p) => typeof p === 'string' && p.indexOf(`${uid}/`) === 0) : []));
    if (paths.length) await supabase.storage.from(BUCKET).remove(paths.slice(0, 100));
    const ids = (rows || []).map((r) => r.id);
    if (ids.length) await supabase.from('zchat_data_exports').update({ parts: [] }).in('id', ids).neq('status', 'working');
  } catch {}
}

async function sweepExpired() {
  try {
    const { data: rows } = await supabase.from('zchat_data_exports').select('id, user_id, parts').in('status', ['expired']).neq('parts', '[]').limit(20);
    for (const r of rows || []) {
      const paths = (Array.isArray(r.parts) ? r.parts : []).map((p) => p.path).filter((p) => typeof p === 'string' && p.indexOf(`${r.user_id}/`) === 0);
      if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
      await supabase.from('zchat_data_exports').update({ parts: [] }).eq('id', r.id);
    }
  } catch {}
}

async function chain(body, cursor, parts) {
  const n = (Number(body.n) || 0) + 1;
  await patch(body.id, { cursor, parts });
  await fetch(`${SITE}/.netlify/functions/zchat-safety-background`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-zchat-task': taskSig(body.id, body.uid, n) },
    body: JSON.stringify({ id: body.id, uid: body.uid, n }),
  });
}

async function run(body) {
  const started = Date.now();
  const { id, uid } = body;
  const { data: row } = await supabase.from('zchat_data_exports').select('*').eq('id', id).maybeSingle();
  if (!row || row.user_id !== uid || !['queued', 'working'].includes(row.status)) return;
  const n = Number(body.n) || 0;
  if (n === 0 && row.status !== 'queued') return;
  if (n > 0 && (!row.cursor || Number(row.cursor.n) !== n)) return;
  const parts = Array.isArray(row.parts) ? row.parts.slice() : [];
  let cursor = row.cursor && n > 0 ? { ...row.cursor } : { stage: 'posts', after: null, done: 0, total: 0, part: 1 };
  let zip = new ZipPart();
  if (n === 0) {
    await patch(id, { status: 'working', phase: 'collecting', progress: 2 });
    await cleanOld(uid, id);
    sweepExpired();
    const { files, totals } = await collectText(uid, body.device);
    files.forEach((f) => zip.add(f.name, f.data, true));
    cursor.total = totals.posts + totals.stories + totals.sent;
    await patch(id, { phase: 'media', progress: 12 });
  }
  let lastBeat = Date.now();
  while (cursor.stage) {
    const items = await nextMedia(uid, cursor);
    if (!items.length) {
      const i = STAGES.indexOf(cursor.stage);
      cursor = { ...cursor, stage: STAGES[i + 1] || null, after: null };
      continue;
    }
    for (const it of items) {
      const ref = mediaPath(it.url);
      const got = ref ? await download(ref) : null;
      if (got) {
        if (!zip.fits(got.buf.length)) {
          parts.push(await uploadPart(uid, id, zip, cursor.part));
          cursor.part += 1;
          zip = new ZipPart();
        }
        zip.add(`${it.name}.${extOf(ref.path, got.type)}`, got.buf, false);
      }
      cursor.after = it.key;
      cursor.done += 1;
      if (Date.now() - lastBeat > 4000) {
        lastBeat = Date.now();
        const pct = cursor.total ? Math.min(94, 12 + Math.round((cursor.done / cursor.total) * 82)) : 50;
        await patch(id, { progress: pct, phase: 'media', parts });
      }
      if (Date.now() - started > TIME_BUDGET) {
        if (zip.count) { parts.push(await uploadPart(uid, id, zip, cursor.part)); cursor.part += 1; }
        await chain(body, { ...cursor, n: n + 1 }, parts);
        return;
      }
    }
  }
  await patch(id, { phase: 'packing', progress: 96 });
  if (zip.count) parts.push(await uploadPart(uid, id, zip, cursor.part));
  const bytes = parts.reduce((t, p) => t + (Number(p.size) || 0), 0);
  await patch(id, { parts, bytes, cursor: null });
  await supabase.rpc('zchat_export_done', { p_id: id });
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST' || !SERVICE_KEY) return { statusCode: 400, body: '' };
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch { return { statusCode: 400, body: '' }; }
  if (!/^[0-9a-f-]{36}$/i.test(String(body.id || '')) || !/^[0-9a-f-]{36}$/i.test(String(body.uid || ''))) return { statusCode: 400, body: '' };
  if (!sigOk(headerOf(event, 'x-zchat-task'), taskSig(body.id, body.uid, Number(body.n) || 0))) return { statusCode: 403, body: '' };
  try {
    await run(body);
  } catch (err) {
    console.error('zchat export failed', err && err.message);
    try { await patch(body.id, { status: 'failed', error: 'build', cursor: null }); } catch {}
  }
  return { statusCode: 202, body: '' };
};

