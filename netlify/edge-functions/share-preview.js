const SUPABASE_URL = 'https://etcmbghcmlgeezwgnwuz.supabase.co';
const SITE = 'https://getzchat.com';
const FALLBACK_IMAGE = `${SITE}/og-image.png`;

const CRAWLER = /(facebookexternalhit|facebot|whatsapp|twitterbot|telegrambot|slackbot|discordbot|linkedinbot|pinterest|applebot|skypeuripreview|redditbot|viber|snapchat|googlebot|bingbot|duckduckbot|yandex|embedly|quora|outbrain|vkshare|w3c_validator|iframely|imessage|signal|threads|instagram|line\/|kakaotalk|mastodon|bluesky|bsky|preview)/i;

const esc = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const isHttp = (u) => typeof u === 'string' && /^https?:\/\//i.test(u);
const clip = (text, n) => {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

function getKeys() {
  const env = (globalThis.Deno && globalThis.Deno.env) ? globalThis.Deno.env : null;
  if (!env) return [];
  const names = ['SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
  const out = [];
  for (const n of names) {
    try { const v = env.get(n); if (v) out.push(v); } catch {}
  }
  return out;
}

async function callRpc(fn, args, key) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data && data.found ? data : null;
  } catch {
    return null;
  }
}

async function restGet(path, key) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    if (!res.ok) return null;
    const rows = await res.json();
    return Array.isArray(rows) && rows.length ? rows[0] : null;
  } catch {
    return null;
  }
}

async function directLookup(kind, args, key) {
  const profileCols = 'id,name,username,avatar,bio,is_private';
  if (kind === 'group') {
    const g = await restGet(`groups?select=id,name,avatar,bio&invite_code=eq.${encodeURIComponent(args.p_code)}&limit=1`, key);
    return g ? { found: true, name: g.name, avatar: g.avatar, bio: g.bio, member_count: 0 } : null;
  }
  if (kind === 'post') {
    const p = await restGet(`posts?select=id,user_id,media_url,media_type,caption,created_at&id=eq.${encodeURIComponent(args.p_id)}&limit=1`, key);
    if (!p) return null;
    const o = await restGet(`profiles?select=${profileCols}&id=eq.${encodeURIComponent(p.user_id)}&limit=1`, key);
    if (!o) return null;
    return { found: true, restricted: !!o.is_private, media_url: p.media_url, media_type: p.media_type, caption: p.caption, owner: o };
  }
  const o = await restGet(`profiles?select=${profileCols}&id=eq.${encodeURIComponent(args.p_id)}&limit=1`, key);
  return o ? { found: true, ...o, posts_count: 0, followers_count: 0 } : null;
}

async function lookup(kind, fn, args) {
  const keys = getKeys();
  for (const key of keys) {
    const viaRpc = await callRpc(fn, args, key);
    if (viaRpc) return viaRpc;
  }
  for (const key of keys) {
    const direct = await directLookup(kind, args, key);
    if (direct) return direct;
  }
  return null;
}

export function buildCard(kind, d) {
  if (kind === 'group') {
    const members = d.member_count ? `Group with ${d.member_count} ${d.member_count === 1 ? 'member' : 'members'}.` : 'Group on ZChat.';
    return {
      title: `Join ${d.name} on ZChat`,
      description: `${members}${d.bio ? ` ${clip(d.bio, 120)}` : ' Tap to join.'}`,
      image: isHttp(d.avatar) ? d.avatar : '',
      type: 'website',
      square: true,
    };
  }
  if (kind === 'post') {
    const o = d.owner || {};
    if (d.restricted) return { title: `${o.name} on ZChat`, description: 'This post is from a private account.', image: isHttp(o.avatar) ? o.avatar : '', type: 'article', square: true };
    const image = d.media_type === 'image' && isHttp(d.media_url)
      ? d.media_url
      : (d.media_type === 'video' && isHttp(d.poster_url) ? d.poster_url : (isHttp(o.avatar) ? o.avatar : ''));
    return {
      title: `${o.name} on ZChat`,
      description: d.caption ? clip(d.caption, 160) : (d.media_type === 'video' ? `Watch this video by ${o.name} on ZChat.` : `See this post by ${o.name} on ZChat.`),
      image,
      type: 'article',
      square: image === o.avatar,
    };
  }
  if (kind === 'story') {
    return { title: `${d.name} shared a story on ZChat`, description: 'Open ZChat to watch it.', image: isHttp(d.avatar) ? d.avatar : '', type: 'article', square: true };
  }
  const bits = [];
  if (d.posts_count) bits.push(`${d.posts_count} posts`);
  if (d.followers_count) bits.push(`${d.followers_count} followers`);
  const counts = bits.length ? `${bits.join(', ')}.` : '';
  const handle = d.username ? ` @${d.username}` : '';
  const desc = d.is_private ? `${counts} This account is private.`.trim() : `${counts}${d.bio ? ` ${clip(d.bio, 120)}` : ''}`.trim();
  return {
    title: `${d.name}${handle} on ZChat`,
    description: desc || `See ${d.name} on ZChat.`,
    image: isHttp(d.avatar) ? d.avatar : '',
    type: 'profile',
    square: true,
  };
}

export function renderHtml(card, url) {
  const image = card.image || FALLBACK_IMAGE;
  const tags = [
    ['property', 'og:site_name', 'ZChat'],
    ['property', 'og:type', card.type],
    ['property', 'og:title', card.title],
    ['property', 'og:description', card.description],
    ['property', 'og:url', url],
    ['property', 'og:image', image],
    ['property', 'og:image:secure_url', image],
    ['property', 'og:image:alt', card.title],
    ['name', 'twitter:card', card.square ? 'summary' : 'summary_large_image'],
    ['name', 'twitter:title', card.title],
    ['name', 'twitter:description', card.description],
    ['name', 'twitter:image', image],
  ];
  if (!card.image) {
    tags.push(['property', 'og:image:width', '1200']);
    tags.push(['property', 'og:image:height', '630']);
  }
  const meta = tags.map(([attr, name, value]) => `<meta ${attr}="${esc(name)}" content="${esc(value)}">`).join('\n');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(card.title)}</title>\n<meta name="description" content="${esc(card.description)}">\n${meta}\n</head><body style="font-family:sans-serif;background:#0E0A1A;color:#fff;padding:24px"><p><a href="${esc(url)}" style="color:#B79CFF">${esc(card.title)}</a></p><p>${esc(card.description)}</p>${card.image ? `<img src="${esc(image)}" alt="" style="max-width:320px;border-radius:12px">` : ''}</body></html>`;
}

export default async (request, context) => {
  const url = new URL(request.url);
  const q = url.searchParams;
  const forced = q.get('og') === '1';
  const ua = request.headers.get('user-agent') || '';
  if (!forced && !CRAWLER.test(ua)) return context.next();
  let kind = null;
  let fn = null;
  let args = null;
  if (q.get('join')) { kind = 'group'; fn = 'public_group_preview'; args = { p_code: q.get('join') }; }
  else if (q.get('post')) { kind = 'post'; fn = 'public_post_preview'; args = { p_id: q.get('post') }; }
  else if (q.get('story')) { kind = 'story'; fn = 'public_profile_preview'; args = { p_id: q.get('story') }; }
  else if (q.get('profile')) { kind = 'profile'; fn = 'public_profile_preview'; args = { p_id: q.get('profile') }; }
  if (!kind) return context.next();
  const data = await lookup(kind, fn, args);
  if (!data) {
    if (forced) return new Response('Preview lookup failed. Check that SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY is set in Netlify and the link id is right.', { status: 200, headers: { 'content-type': 'text/plain' } });
    return context.next();
  }
  q.delete('og');
  const cleanUrl = `${SITE}/?${q.toString()}`;
  const html = renderHtml(buildCard(kind, data), cleanUrl);
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': forced ? 'no-store' : 'public, max-age=300' } });
};

export const config = { path: '/' };
