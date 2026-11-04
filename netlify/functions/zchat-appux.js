const SUPABASE_URL = (process.env.SUPABASE_URL || 'https://etcmbghcmlgeezwgnwuz.supabase.co').replace(/\/+$/, '');
const SITE = (process.env.ZCHAT_SITE_URL || 'https://getzchat.com').replace(/\/+$/, '');
const TOKEN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function rpc(name, args) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args || {}),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${name} answered ${res.status}: ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function shell(title, body) {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)}</title>
<style>
  body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #F4F2FA; color: #17151F; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 20px; box-sizing: border-box; }
  .card { width: 100%; max-width: 380px; background: #FFFFFF; border-radius: 20px; padding: 28px 24px; box-sizing: border-box; }
  img { display: block; width: 44px; height: 44px; border-radius: 12px; }
  h1 { font-size: 20px; line-height: 1.3; margin: 18px 0 8px; }
  p { font-size: 15px; line-height: 1.55; color: #4A4756; margin: 0 0 18px; }
  button, a.btn { display: inline-block; width: 100%; box-sizing: border-box; text-align: center; padding: 13px 18px; border-radius: 12px; border: 0; background: #7C5CFC; color: #FFFFFF; font-size: 15px; font-weight: 700; text-decoration: none; cursor: pointer; font-family: inherit; }
  a.soft { display: block; text-align: center; margin-top: 14px; color: #7C5CFC; font-size: 14px; font-weight: 600; text-decoration: none; }
  @media (prefers-color-scheme: dark) {
    body { background: #0C0C0E; color: #F2F2F4; }
    .card { background: #17171A; }
    p { color: #A9A7B4; }
    a.soft { color: #A895FF; }
  }
</style></head>
<body><div class="card"><img src="${SITE}/icon-192.png" alt="ZChat">${body}</div></body>
</html>`;
}

const page = (status, title, body) => ({ statusCode: status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' }, body: shell(title, body) });

function askPage(token) {
  return page(200, 'Turn off missed message emails', `
<h1>Turn off missed message emails?</h1>
<p>We will stop sending the daily note about messages waiting for you. Your chats stay just as they are.</p>
<form method="post" action="?unsub=${encodeURIComponent(token)}"><button type="submit">Turn them off</button></form>
<a class="soft" href="${SITE}/">Open ZChat instead</a>`);
}

function donePage() {
  return page(200, 'Emails turned off', `
<h1>Done. No more missed message emails.</h1>
<p>You can turn them back on any time in ZChat, under Settings, Notifications.</p>
<a class="btn" href="${SITE}/">Open ZChat</a>`);
}

function badPage(status) {
  return page(status || 400, 'This link does not work', `
<h1>This link does not work</h1>
<p>It may be cut short or very old. You can turn the emails off in ZChat, under Settings, Notifications.</p>
<a class="btn" href="${SITE}/">Open ZChat</a>`);
}

export const handler = async (event) => {
  const method = String(event.httpMethod || 'GET').toUpperCase();
  const q = event.queryStringParameters || {};
  const token = String(q.unsub || '').trim();
  if (method !== 'GET' && method !== 'POST' && method !== 'HEAD') return { statusCode: 405, headers: { allow: 'GET, POST' }, body: '' };
  if (!TOKEN.test(token)) return badPage(400);
  if (method !== 'POST') return askPage(token);
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return page(503, 'Try again soon', '<h1>That did not go through</h1><p>Something on our side is not ready. Try the link again in a little while, or turn the emails off in ZChat, under Settings, Notifications.</p>');
  }
  try {
    await rpc('zchat_email_unsub', { p_token: token });
  } catch (err) {
    console.error('zchat appux unsub failed', err && err.message);
    return page(502, 'Try again soon', '<h1>That did not go through</h1><p>Try the link again in a little while, or turn the emails off in ZChat, under Settings, Notifications.</p>');
  }
  return donePage();
};
