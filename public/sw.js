const SHELL = 'zchat-shell-v2';
const STATIC = 'zchat-static-v1';
const REMOTE = 'zchat-remote-v1';
const SHARE = 'zchat-share';
const FONTS = 'zchat-fonts-v1';
const ASSET_LIMIT = 60;
const STATIC_LIMIT = 500;
const REMOTE_LIMIT = 700;
const STATIC_EXT = /\.(png|jpe?g|webp|gif|svg|ico|woff2?|ttf|otf)$/i;

function assetsIn(html) {
  const out = new Set();
  const re = /(?:src|href)=["'](\/assets\/[^"'?#]+)["']/g;
  let m;
  while ((m = re.exec(html))) out.add(m[1]);
  return [...out];
}

async function trim(cacheName, limit, keep) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    const list = keep ? keys.filter((r) => new URL(r.url).pathname.startsWith('/assets/')) : keys;
    let extra = list.length - limit;
    for (let i = 0; i < list.length && extra > 0; i++) {
      const path = new URL(list[i].url).pathname;
      if (keep && keep.has(path)) continue;
      await cache.delete(list[i]);
      extra -= 1;
    }
  } catch {}
}

async function storeShell(cache, res) {
  const html = await res.clone().text();
  const assets = assetsIn(html);
  for (const a of assets) {
    if (await cache.match(a)) continue;
    const r = await fetch(a);
    if (!r || !r.ok) return false;
    await cache.put(a, r);
  }
  await cache.put('/', res);
  return { html, assets };
}

async function shellComplete(cache, hit) {
  try {
    const html = await hit.clone().text();
    const assets = assetsIn(html);
    if (!assets.length) return false;
    const found = await Promise.all(assets.map((a) => cache.match(a)));
    return found.every(Boolean) ? html : false;
  } catch {
    return false;
  }
}

async function refreshShell(oldHtml) {
  try {
    const cache = await caches.open(SHELL);
    const res = await fetch('/', { cache: 'no-cache' });
    if (!res || !res.ok || res.type !== 'basic' || !(res.headers.get('content-type') || '').includes('text/html')) return;
    const html = await res.clone().text();
    if (oldHtml && html === oldHtml) return;
    const stored = await storeShell(cache, res);
    if (!stored) return;
    const keep = new Set([...stored.assets, ...(oldHtml ? assetsIn(oldHtml) : [])]);
    await trim(SHELL, ASSET_LIMIT, keep);
    if (oldHtml) {
      const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      list.forEach((c) => { try { c.postMessage({ type: 'zchat-update-ready' }); } catch {} });
    }
  } catch {}
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(SHELL);
      const res = await fetch('/', { cache: 'no-cache' });
      if (res && res.ok && (res.headers.get('content-type') || '').includes('text/html')) await storeShell(cache, res);
      await cache.addAll(['/manifest.json', '/icon-192.png']).catch(() => {});
    } catch {}
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('zchat-shell-') && k !== SHELL).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

async function navigation(event) {
  const cache = await caches.open(SHELL);
  const hit = await cache.match('/');
  if (hit) {
    const html = await shellComplete(cache, hit);
    if (html) {
      event.waitUntil(refreshShell(html));
      return hit;
    }
  }
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 9000);
    const res = await fetch(event.request, { signal: ctrl.signal });
    clearTimeout(timer);
    if (res && res.ok && res.type === 'basic' && (res.headers.get('content-type') || '').includes('text/html')) {
      event.waitUntil(storeShell(cache, res.clone()).then(() => trim(SHELL, ASSET_LIMIT, null)).catch(() => {}));
    }
    return res;
  } catch (err) {
    if (hit) return hit;
    const any = await cache.match(event.request, { ignoreSearch: true });
    if (any) return any;
    throw err;
  }
}

async function assetFirst(request) {
  const cache = await caches.open(SHELL);
  const hit = await cache.match(request, { ignoreSearch: true });
  if (hit) return hit;
  const res = await fetch(request);
  if (res && res.ok && res.type === 'basic') cache.put(request, res.clone()).catch(() => {});
  return res;
}

async function stamped(res) {
  const headers = new Headers(res.headers);
  headers.set('x-zc-at', String(Date.now()));
  const body = await res.blob();
  return new Response(body, { status: res.status, statusText: res.statusText, headers });
}

async function staticFile(event) {
  const request = event.request;
  const cache = await caches.open(STATIC);
  const hit = await cache.match(request, { ignoreSearch: true });
  const update = () => fetch(request).then(async (res) => {
    if (res && res.ok && res.type === 'basic' && res.status === 200) {
      const copy = await stamped(res.clone());
      await cache.put(request, copy);
      trim(STATIC, STATIC_LIMIT, null);
    }
    return res;
  });
  if (hit) {
    const at = Number(hit.headers.get('x-zc-at') || 0);
    if (Date.now() - at > 21600000) event.waitUntil(update().catch(() => {}));
    return hit;
  }
  return update();
}

async function remoteImage(event) {
  const request = event.request;
  const cache = await caches.open(REMOTE);
  const hit = await cache.match(request.url);
  if (hit) return hit;
  try {
    const res = await fetch(request.url, { mode: 'cors', credentials: 'omit' });
    if (res && res.ok && res.status === 200) {
      event.waitUntil(cache.put(request.url, res.clone()).then(() => trim(REMOTE, REMOTE_LIMIT, null)).catch(() => {}));
      return res;
    }
  } catch {}
  return fetch(request);
}

async function fontFile(event) {
  const request = event.request;
  const cache = await caches.open(FONTS);
  const hit = await cache.match(request.url);
  const css = new URL(request.url).hostname === 'fonts.googleapis.com';
  const update = () => fetch(request).then(async (res) => {
    if (res && (res.ok || res.type === 'opaque')) {
      await cache.put(request.url, res.clone());
      trim(FONTS, 80, null);
    }
    return res;
  });
  if (hit) {
    if (css) event.waitUntil(update().catch(() => {}));
    return hit;
  }
  return update();
}

async function receiveShare(event) {
  try {
    const form = await event.request.formData();
    const files = form.getAll('media').filter((f) => f && typeof f === 'object' && f.size > 0);
    const text = ['title', 'text', 'url'].map((k) => form.get(k)).filter((v) => typeof v === 'string' && v.trim()).join('\n').trim();
    const cache = await caches.open(SHARE);
    await Promise.all((await cache.keys()).map((k) => cache.delete(k)));
    let count = 0;
    for (const f of files.slice(0, 10)) {
      await cache.put(`/__share/file-${count}`, new Response(f, { headers: { 'content-type': f.type || 'application/octet-stream', 'x-name': encodeURIComponent(f.name || `file-${count}`) } }));
      count += 1;
    }
    await cache.put('/__share/meta', new Response(JSON.stringify({ text, count, at: Date.now() }), { headers: { 'content-type': 'application/json' } }));
  } catch {}
  return Response.redirect('/?share=1', 303);
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  let url;
  try { url = new URL(request.url); } catch { return; }
  if (url.origin !== self.location.origin) {
    if (request.method !== 'GET') return;
    if (request.destination === 'image' && /\.supabase\.co$/.test(url.hostname) && url.pathname.indexOf('/storage/v1/object/public/') === 0) {
      event.respondWith(remoteImage(event));
      return;
    }
    if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
      event.respondWith(fontFile(event));
    }
    return;
  }
  if (request.method === 'POST' && url.pathname === '/share-target') {
    event.respondWith(receiveShare(event));
    return;
  }
  if (request.method !== 'GET' || url.pathname.startsWith('/.netlify/') || url.pathname.startsWith('/__')) return;
  if (request.mode === 'navigate') {
    if (!/\.[a-z0-9]{2,5}$/i.test(url.pathname)) event.respondWith(navigation(event));
    return;
  }
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(assetFirst(request));
    return;
  }
  if (STATIC_EXT.test(url.pathname) && !request.headers.has('range')) {
    event.respondWith(staticFile(event));
  }
});

function tagFor(url) {
  try {
    const u = new URL(url || '/', self.location.origin);
    const dm = u.searchParams.get('dm');
    if (dm) return `dm-${dm}`;
    const group = u.searchParams.get('group');
    if (group) return `group-${group}`;
  } catch {}
  return '';
}

async function readPref(key) {
  try {
    const cache = await caches.open('zchat-prefs');
    const hit = await cache.match(key);
    return hit ? await hit.json() : null;
  } catch {
    return null;
  }
}

function accountOf(url) {
  try { return new URL(url || '/', self.location.origin).searchParams.get('acc') || ''; } catch { return ''; }
}

self.addEventListener('push', (event) => {
  let data = { title: 'ZChat', body: 'You have a new message', url: '/', icon: '/icon-192.png' };
  try { data = { ...data, ...event.data.json() }; } catch {}
  event.waitUntil((async () => {
    const tag = data.tag || tagFor(data.url);
    if (tag) {
      const hidden = await readPref('/__hidden');
      const acc = accountOf(data.url);
      const keys = Array.isArray(hidden) ? hidden : (hidden && acc && Array.isArray(hidden[acc]) ? hidden[acc] : []);
      if (keys.includes(tag)) {
        await self.registration.showNotification('ZChat', {
          body: 'You have a new message',
          icon: '/icon-192.png',
          badge: '/badge-192.png',
          tag: 'zchat-private',
          renotify: true,
          data: { url: acc ? `/?acc=${encodeURIComponent(acc)}` : '/' },
        });
        return;
      }
    }
    const focus = await readPref('/__focus');
    const quiet = !!(focus && Number(focus.until) > Date.now() && tag !== focus.chat);
    let title = data.title;
    let body = data.body;
    let lines = [data.body];
    let count = 1;
    if (tag) {
      try {
        const open = await self.registration.getNotifications({ tag });
        const prev = open[open.length - 1];
        if (prev) {
          const pd = prev.data || {};
          count = (pd.count || 1) + 1;
          lines = (pd.lines || [prev.body]).concat([data.body]).slice(-4);
          body = lines.join('\n');
          title = `${pd.baseTitle || data.title} (${count} new)`;
        }
      } catch {}
    }
    const options = {
      body,
      icon: data.icon || '/icon-192.png',
      badge: '/badge-192.png',
      data: { url: data.url, count, lines, baseTitle: data.title },
    };
    if (quiet) options.silent = true;
    if (tag) { options.tag = tag; options.renotify = !quiet; }
    await self.registration.showNotification(title, options);
  })());
});

function askClient(client, url) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (v) => { if (!done) { done = true; resolve(v); } };
    const timer = setTimeout(() => finish(false), 1500);
    try {
      const channel = new MessageChannel();
      channel.port1.onmessage = (e) => { clearTimeout(timer); finish(!!(e.data && e.data.ok)); };
      client.postMessage({ type: 'zchat-open', url }, [channel.port2]);
    } catch {
      clearTimeout(timer);
      finish(false);
    }
  });
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil((async () => {
    const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const client = list.find((c) => c.url.startsWith(self.location.origin));
    if (client) {
      try { await client.focus(); } catch {}
      const handled = await askClient(client, url);
      if (!handled) {
        try { await client.navigate(url); } catch {}
      }
      return;
    }
    if (self.clients.openWindow) await self.clients.openWindow(url);
  })());
});
