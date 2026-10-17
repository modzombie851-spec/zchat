const SHELL = 'zchat-shell-v1';
const SHARE = 'zchat-share';
const ASSET_LIMIT = 40;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL)
      .then((cache) => cache.addAll(['/', '/manifest.json', '/icon-192.png']).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('zchat-shell-') && k !== SHELL).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

async function trimAssets(cache) {
  try {
    const keys = (await cache.keys()).filter((r) => new URL(r.url).pathname.startsWith('/assets/'));
    const extra = keys.length - ASSET_LIMIT;
    for (let i = 0; i < extra; i++) await cache.delete(keys[i]);
  } catch {}
}

async function networkFirst(request) {
  const cache = await caches.open(SHELL);
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(request, { signal: ctrl.signal });
    clearTimeout(timer);
    if (res && res.ok && res.type === 'basic' && (res.headers.get('content-type') || '').includes('text/html')) {
      cache.put('/', res.clone()).catch(() => {});
    }
    return res;
  } catch (err) {
    const hit = (await cache.match('/')) || (await cache.match(request, { ignoreSearch: true }));
    if (hit) return hit;
    throw err;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(SHELL);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res && res.ok && res.type === 'basic') {
    cache.put(request, res.clone()).then(() => trimAssets(cache)).catch(() => {});
  }
  return res;
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
  if (url.origin !== self.location.origin) return;
  if (request.method === 'POST' && url.pathname === '/share-target') {
    event.respondWith(receiveShare(event));
    return;
  }
  if (request.method !== 'GET' || url.pathname.startsWith('/.netlify/')) return;
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request));
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

self.addEventListener('push', (event) => {
  let data = { title: 'ZChat', body: 'You have a new message', url: '/', icon: '/icon-192.png' };
  try { data = { ...data, ...event.data.json() }; } catch {}
  event.waitUntil((async () => {
    const tag = data.tag || tagFor(data.url);
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
    if (tag) { options.tag = tag; options.renotify = true; }
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
