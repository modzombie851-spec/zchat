const SUPABASE_URL = 'https://etcmbghcmlgeezwgnwuz.supabase.co';

const CRAWLER = /(facebookexternalhit|facebot|whatsapp|twitterbot|telegrambot|slackbot|discordbot|linkedinbot|pinterest|applebot|skypeuripreview|redditbot|viber|snapchat|googlebot|bingbot)/i;

const esc = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const isHttp = (u) => typeof u === 'string' && /^https?:\/\//i.test(u);
const clip = (text, n) => {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1)}\u2026` : t;
};

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

export function buildCard(kind, d) {
  if (kind === 'group') {
    return {
      title: `Join ${d.name} on ZChat`,
      description: `Group with ${d.member_count} ${d.member_count === 1 ? 'member' : 'members'}.${d.bio ? ` ${clip(d.bio, 120)}` : ' Tap to join.'}`,
      image: isHttp(d.avatar) ? d.avatar : '',
      type: 'website',
    };
  }
  if (kind === 'post') {
    const o = d.owner || {};
    if (d.restricted) return { title: `${o.name} on ZChat`, description: 'This post is from a private account.', image: isHttp(o.avatar) ? o.avatar : '', type: 'article' };
    return {
      title: `${o.name} on ZChat`,
      description: d.caption ? clip(d.caption, 160) : `See this post by ${o.name} on ZChat.`,
      image: d.media_type === 'image' && isHttp(d.media_url) ? d.media_url : (isHttp(o.avatar) ? o.avatar : ''),
      type: 'article',
    };
  }
  if (kind === 'story') {
    return { title: `${d.name} shared a story on ZChat`, description: 'Open ZChat to watch it.', image: isHttp(d.avatar) ? d.avatar : '', type: 'article' };
  }
  const counts = `${d.posts_count || 0} posts, ${d.followers_count || 0} followers.`;
  return {
    title: `${d.name} on ZChat`,
    description: d.is_private ? `${counts} This account is private.` : `${counts}${d.bio ? ` ${clip(d.bio, 120)}` : ''}`,
    image: isHttp(d.avatar) ? d.avatar : '',
    type: 'profile',
  };
}

export function renderHtml(card, url) {
  const tags = [
    ['property', 'og:site_name', 'ZChat'],
    ['property', 'og:type', card.type],
    ['property', 'og:title', card.title],
    ['property', 'og:description', card.description],
    ['property', 'og:url', url],
    ['name', 'twitter:card', card.image ? 'summary_large_image' : 'summary'],
    ['name', 'twitter:title', card.title],
    ['name', 'twitter:description', card.description],
  ];
  if (card.image) {
    tags.push(['property', 'og:image', card.image]);
    tags.push(['name', 'twitter:image', card.image]);
  }
  const meta = tags.map(([attr, name, value]) => `<meta ${attr}="${esc(name)}" content="${esc(value)}">`).join('\n');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(card.title)}</title>\n<meta name="description" content="${esc(card.description)}">\n${meta}\n</head><body><a href="${esc(url)}">Open in ZChat</a></body></html>`;
}

export default async (request, context) => {
  const ua = request.headers.get('user-agent') || '';
  if (!CRAWLER.test(ua)) return context.next();
  const url = new URL(request.url);
  const q = url.searchParams;
  let kind = null;
  let fn = null;
  let args = null;
  if (q.get('join')) { kind = 'group'; fn = 'public_group_preview'; args = { p_code: q.get('join') }; }
  else if (q.get('post')) { kind = 'post'; fn = 'public_post_preview'; args = { p_id: q.get('post') }; }
  else if (q.get('story')) { kind = 'story'; fn = 'public_profile_preview'; args = { p_id: q.get('story') }; }
  else if (q.get('profile')) { kind = 'profile'; fn = 'public_profile_preview'; args = { p_id: q.get('profile') }; }
  if (!kind) return context.next();
  const env = (globalThis.Deno && globalThis.Deno.env) ? globalThis.Deno.env : null;
  const key = env ? (env.get('SUPABASE_ANON_KEY') || env.get('VITE_SUPABASE_ANON_KEY')) : null;
  if (!key) return context.next();
  const data = await callRpc(fn, args, key);
  if (!data) return context.next();
  const html = renderHtml(buildCard(kind, data), url.toString());
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300' } });
};

export const config = { path: '/' };
