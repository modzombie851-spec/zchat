const SVGNS = 'http://www.w3.org/2000/svg';
const MAX_HTML = 900000;
const MAX_NODES = 9000;
const P2P_SNAP = 220;
const P2P_FRAME = 160;
const CLOUD_SNAP = 1100;
const CLOUD_FRAME = 1400;
const FRAME_SIDE = 460;

let webpOk = null;
function canWebp() {
  if (webpOk != null) return webpOk;
  try { webpOk = document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') === 0; } catch { webpOk = false; }
  return webpOk;
}
export const canUnzip = () => typeof DecompressionStream !== 'undefined';
const canZip = () => typeof CompressionStream !== 'undefined';

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function b64(u8) {
  let s = '';
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return btoa(s);
}
async function zip(str) {
  const cs = new CompressionStream('deflate');
  const buf = await new Response(new Blob([str]).stream().pipeThrough(cs)).arrayBuffer();
  return b64(new Uint8Array(buf));
}
async function unzip(z) {
  const bin = atob(z);
  const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  const ds = new DecompressionStream('deflate');
  return new Response(new Blob([u]).stream().pipeThrough(ds)).text();
}
export async function packText(str, z) { return z && canZip() ? { z: await zip(str) } : { x: str }; }
export async function unpackText(d) {
  if (!d) return '';
  if (typeof d.x === 'string') return d.x;
  if (typeof d.z === 'string' && canUnzip()) return unzip(d.z);
  return '';
}

function styleSnap() {
  const css = [];
  const links = [];
  const all = document.querySelectorAll('style, link[rel="stylesheet"]');
  for (let i = 0; i < all.length; i++) {
    const el = all[i];
    if (el.tagName === 'STYLE') {
      let t = el.textContent || '';
      if (!t && el.sheet) { try { t = Array.from(el.sheet.cssRules).map((r) => r.cssText).join('\n'); } catch {} }
      if (t) css.push(t);
    } else {
      const href = el.href || '';
      if (href.indexOf(location.origin + '/') === 0 || href.indexOf('https://fonts.googleapis.com/') === 0) links.push(href);
    }
  }
  const de = document.documentElement;
  const bd = document.body;
  return { css, links, hc: de.getAttribute('class') || '', hs: de.getAttribute('style') || '', bc: bd.getAttribute('class') || '', bs: bd.getAttribute('style') || '' };
}

function elPath(root, el) {
  const p = [];
  let n = el;
  while (n && n !== root) {
    const par = n.parentElement;
    if (!par) return null;
    p.push(Array.prototype.indexOf.call(par.children, n));
    n = par;
  }
  return n === root ? p.reverse() : null;
}

function bgOf(el) {
  let n = el;
  while (n && n.nodeType === 1) {
    const c = getComputedStyle(n).backgroundColor;
    if (c && c !== 'transparent' && !/rgba\([^)]*,\s*0\)$/.test(c)) return c;
    n = n.parentElement;
  }
  return '#101014';
}

export function startCapture({ getRoot, send, sendTo, slow, zipOk, onError }) {
  const S = { root: null, mo: null, dirty: true, alive: true, seq: 0, lastHash: 0, snapAt: 0, frameAt: 0, busy: false, fbusy: false, scrolls: new Set(), fh: [], tiny: null, tmp: null, styles: null, stylesAt: 0, lastSnap: null, t: 0, frames: [] };
  const onScroll = (e) => { const t = e.target; if (t && t.nodeType === 1) { S.scrolls.add(t); S.dirty = true; } };
  const detach = () => {
    if (S.mo) { try { S.mo.disconnect(); } catch {} S.mo = null; }
    if (S.root) { try { S.root.removeEventListener('scroll', onScroll, true); } catch {} }
    S.root = null;
  };
  const attach = () => {
    const r = getRoot();
    if (r === S.root) return !!r;
    detach();
    if (!r || !r.isConnected) return false;
    S.root = r;
    S.mo = new MutationObserver(() => { S.dirty = true; });
    S.mo.observe(r, { subtree: true, childList: true, attributes: true, characterData: true });
    r.addEventListener('scroll', onScroll, true);
    S.dirty = true;
    S.scrolls = new Set();
    return true;
  };
  const stylesPayload = async () => {
    if (!S.styles || Date.now() - S.stylesAt > 20000) {
      const st = styleSnap();
      const css = await packText(st.css.join('\n/*zc*/\n'), zipOk());
      S.styles = { ...st, css: undefined, c: css };
      S.stylesAt = Date.now();
    }
    return S.styles;
  };
  const snapNow = async () => {
    const root = S.root;
    if (!root) return null;
    const html = root.outerHTML;
    if (html.length > MAX_HTML) return null;
    const h = hashStr(html);
    const sc = [];
    S.scrolls.forEach((el) => {
      if (!el.isConnected || !root.contains(el)) { S.scrolls.delete(el); return; }
      const p = el === root ? [] : elPath(root, el);
      if (p && (el.scrollTop || el.scrollLeft)) sc.push([p, Math.round(el.scrollTop), Math.round(el.scrollLeft)]);
    });
    const cvs = root.getElementsByTagName('canvas');
    const cv = [];
    for (let i = 0; i < cvs.length && i < 6; i++) cv.push([cvs[i].clientWidth || 0, cvs[i].clientHeight || 0]);
    const key = `${h}|${JSON.stringify(sc)}|${JSON.stringify(cv)}`;
    const w = root.clientWidth || window.innerWidth;
    const ht = root.clientHeight || window.innerHeight;
    if (key === S.lastKey && S.lastSnap && S.lastSnap.w === w && S.lastSnap.h === ht) return { same: true, snap: S.lastSnap };
    S.lastKey = key;
    const body = await packText(html, zipOk());
    S.seq += 1;
    S.lastSnap = { q: S.seq, w, h: ht, sc, cv, ...body };
    return { same: false, snap: S.lastSnap };
  };
  const frameOne = async (c, i) => {
    const cw = c.clientWidth;
    const ch = c.clientHeight;
    if (!c.width || !c.height || cw < 8 || ch < 8) return null;
    if (!S.tiny) { S.tiny = document.createElement('canvas'); S.tiny.width = 12; S.tiny.height = 12; }
    const tg = S.tiny.getContext('2d', { willReadFrequently: true });
    let sig = '';
    try {
      tg.clearRect(0, 0, 12, 12);
      tg.drawImage(c, 0, 0, 12, 12);
      const px = tg.getImageData(0, 0, 12, 12).data;
      let a = 0;
      for (let k = 0; k < px.length; k += 3) a = (Math.imul(a, 31) + px[k]) | 0;
      sig = String(a);
    } catch { return null; }
    if (sig === S.fh[i]) return null;
    S.fh[i] = sig;
    const k = Math.min(1.6, FRAME_SIDE / Math.max(cw, ch)) * (slow() ? 0.7 : 1);
    const w = Math.max(8, Math.round(cw * k));
    const h = Math.max(8, Math.round(ch * k));
    if (!S.tmp) S.tmp = document.createElement('canvas');
    const t = S.tmp;
    if (t.width !== w) t.width = w;
    if (t.height !== h) t.height = h;
    const g = t.getContext('2d');
    const webp = canWebp();
    g.clearRect(0, 0, w, h);
    if (!webp) { g.fillStyle = S.frames[i] && S.frames[i].bg ? S.frames[i].bg : (S.frames[i] = { bg: bgOf(c) }).bg; g.fillRect(0, 0, w, h); }
    try { g.drawImage(c, 0, 0, w, h); } catch { return null; }
    const q = slow() ? 0.5 : 0.62;
    const blob = await new Promise((res) => { try { t.toBlob(res, webp ? 'image/webp' : 'image/jpeg', q); } catch { res(null); } });
    if (!blob) return null;
    const d = await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = () => res(null); fr.readAsDataURL(blob); });
    return typeof d === 'string' ? { i, d, w: cw, h: ch } : null;
  };
  const frames = async (to) => {
    if (S.fbusy || !S.root) return;
    S.fbusy = true;
    try {
      const cvs = S.root.getElementsByTagName('canvas');
      for (let i = 0; i < cvs.length && i < 6; i++) {
        if (to) S.fh[i] = null;
        const f = await frameOne(cvs[i], i);
        if (!f || !S.alive) continue;
        if (to) sendTo(to, 'lf', f); else send('lf', f, { every: slow() ? CLOUD_FRAME : 0 });
      }
    } catch (e) { if (onError) onError(e); }
    S.fbusy = false;
  };
  const tick = async () => {
    if (!S.alive) return;
    const ok = attach();
    const now = Date.now();
    const lazy = slow();
    if (ok && !S.busy && S.dirty && now - S.snapAt >= (lazy ? CLOUD_SNAP : P2P_SNAP) && document.visibilityState !== 'hidden') {
      S.busy = true;
      S.dirty = false;
      S.snapAt = now;
      try {
        const r = await snapNow();
        if (r && !r.same && S.alive) send('lv', r.snap, { every: lazy ? CLOUD_SNAP : 0 });
      } catch (e) { if (onError) onError(e); }
      S.busy = false;
    }
    if (ok && now - S.frameAt >= (lazy ? CLOUD_FRAME : P2P_FRAME) && document.visibilityState !== 'hidden') {
      S.frameAt = now;
      frames(null);
    }
    S.t = setTimeout(tick, 60);
  };
  S.t = setTimeout(tick, 30);
  return {
    stop() { S.alive = false; clearTimeout(S.t); detach(); },
    async key(to) {
      if (!S.alive) return;
      attach();
      try {
        const st = await stylesPayload();
        sendTo(to, 'ls', st);
        S.lastKey = '';
        const r = await snapNow();
        if (r && r.snap) sendTo(to, 'lv', r.snap);
        frames(to);
      } catch (e) { if (onError) onError(e); }
    },
  };
}

const HTML_OK = new Set('div span p b strong i em u s small sup sub br hr img button label ul ol li section article header footer nav main aside figure figcaption h1 h2 h3 h4 h5 h6 table thead tbody tfoot tr td th caption colgroup col pre blockquote q mark time abbr input progress meter picture style canvas'.split(' '));
const HTML_MAP = { a: 'span', form: 'div', select: 'span', option: 'span', textarea: 'div', fieldset: 'div', legend: 'div', dialog: 'div', details: 'div', summary: 'div', center: 'div', font: 'span', code: 'span', kbd: 'span' };
const SVG_OK = new Set('svg g path circle rect line polyline polygon ellipse text tspan textpath defs lineargradient radialgradient stop clippath mask pattern use symbol title desc marker filter fegaussianblur feoffset feblend fecolormatrix femerge femergenode feflood fecomposite fedropshadow femorphology feturbulence fedisplacementmap fecomponenttransfer fefunca fefuncr fefuncg fefuncb image'.split(' '));
const BAD_ATTR = /^(on|formaction|action|srcdoc|srcset|ping|background|poster|lowsrc|dynsrc|autofocus|tabindex|contenteditable|accesskey|is$|xmlns:)/i;
const URL_ATTR = /^(fill|stroke|filter|clip-path|mask|marker-start|marker-mid|marker-end|cursor)$/i;

let supaHost = '';
export function setCastHost(u) { try { supaHost = new URL(u).hostname; } catch {} }
function okUrl(u) {
  const s = String(u || '').trim();
  if (!s) return false;
  if (/^data:image\/(png|jpe?g|gif|webp|avif|svg\+xml)[;,]/i.test(s)) return true;
  if (s[0] === '#') return true;
  if (/^(javascript|vbscript|data|blob|file|filesystem):/i.test(s)) return false;
  try {
    const x = new URL(s, location.href);
    if (x.origin === location.origin) return true;
    if (x.protocol === 'https:' && (x.hostname === supaHost || /\.supabase\.co$/i.test(x.hostname))) return true;
  } catch {}
  return false;
}
export function cleanCss(s) {
  return String(s || '')
    .replace(/url\(\s*(['"]?)([^'")]*)\1\s*\)/gi, (m, q, u) => (okUrl(u) ? m : 'none'))
    .replace(/@import[^;]*;?/gi, '')
    .replace(/expression\s*\(|-moz-binding|behavior\s*:|javascript:/gi, '');
}

function build(doc, n, B) {
  if (B.n-- <= 0) return null;
  if (n.nodeType === 3) return doc.createTextNode(n.nodeValue);
  if (n.nodeType !== 1) return null;
  const raw = n.localName || '';
  const ln = raw.toLowerCase();
  const svg = n.namespaceURI === SVGNS;
  let el;
  let tag = ln;
  if (!svg && HTML_MAP[ln]) tag = HTML_MAP[ln];
  if (svg ? !SVG_OK.has(ln) : !(HTML_OK.has(tag))) {
    const ph = doc.createElement('span');
    ph.setAttribute('style', 'display:none');
    return ph;
  }
  if (!svg && tag === 'canvas') {
    el = doc.createElement('img');
    const i = B.cv++;
    el.setAttribute('data-zcf', String(i));
    el.setAttribute('alt', '');
    const sz = B.sizes[i];
    if (sz && sz[0] && sz[1]) { el.setAttribute('width', String(sz[0])); el.setAttribute('height', String(sz[1])); }
    const st = n.getAttribute('style');
    if (st) el.setAttribute('style', cleanCss(st));
    const cl = n.getAttribute('class');
    if (cl) el.setAttribute('class', cl);
    return el;
  }
  el = svg ? doc.createElementNS(SVGNS, raw) : doc.createElement(tag);
  const at = n.attributes;
  for (let i = 0; i < at.length; i++) {
    const a = at[i];
    const name = a.name.toLowerCase();
    if (BAD_ATTR.test(name)) continue;
    if (name === 'href' || name === 'xlink:href') {
      if (svg && (ln === 'use' || ln === 'image' || ln === 'textpath' || ln === 'lineargradient' || ln === 'radialgradient' || ln === 'pattern') && okUrl(a.value)) el.setAttribute('href', a.value);
      continue;
    }
    if (name === 'src') { if (tag === 'img' && okUrl(a.value)) el.setAttribute('src', a.value); continue; }
    if (name === 'style') { el.setAttribute('style', cleanCss(a.value)); continue; }
    if (svg && URL_ATTR.test(name) && /url\(\s*['"]?(?!#)/i.test(a.value)) continue;
    if (name === 'value' && !svg && String(n.getAttribute('type') || '').toLowerCase() === 'password') continue;
    if (!/^[a-z_:][-a-z0-9_:.]*$/.test(name)) continue;
    try { el.setAttribute(a.name, a.value); } catch {}
  }
  if (!svg && (tag === 'input' || tag === 'button')) el.removeAttribute('name');
  if (!svg && tag === 'style') { el.textContent = cleanCss(n.textContent).slice(0, 300000); return el; }
  const kids = n.childNodes;
  for (let i = 0; i < kids.length; i++) { const k = build(doc, kids[i], B); if (k) el.appendChild(k); }
  return el;
}

function morph(a, b) {
  if (a.nodeType !== b.nodeType || a.nodeName !== b.nodeName || (a.nodeType === 1 && a.namespaceURI !== b.namespaceURI)) { a.parentNode.replaceChild(b, a); return; }
  if (a.nodeType === 3) { if (a.nodeValue !== b.nodeValue) a.nodeValue = b.nodeValue; return; }
  if (a.nodeType !== 1) return;
  const keep = a.hasAttribute('data-zcf');
  const aa = a.attributes;
  for (let i = aa.length - 1; i >= 0; i--) { const nm = aa[i].name; if (!b.hasAttribute(nm) && !(keep && nm === 'src')) a.removeAttribute(nm); }
  const ba = b.attributes;
  for (let i = 0; i < ba.length; i++) { const x = ba[i]; if (a.getAttribute(x.name) !== x.value) a.setAttribute(x.name, x.value); }
  if (a.localName === 'style') { if (a.textContent !== b.textContent) a.textContent = b.textContent; return; }
  const bk = Array.from(b.childNodes);
  for (let i = 0; i < bk.length; i++) { const x = a.childNodes[i]; if (x) morph(x, bk[i]); else a.appendChild(bk[i]); }
  while (a.childNodes.length > bk.length) a.removeChild(a.lastChild);
}

function byPath(root, p) {
  let n = root;
  for (let i = 0; i < p.length && n; i++) n = n.children[p[i]];
  return n || null;
}

export function createMirror(host) {
  const fr = document.createElement('iframe');
  fr.setAttribute('sandbox', 'allow-same-origin');
  fr.setAttribute('aria-hidden', 'true');
  fr.setAttribute('tabindex', '-1');
  fr.setAttribute('title', 'Live game');
  fr.style.cssText = 'position:absolute;left:0;top:0;width:10px;height:10px;border:0;transform-origin:0 0;pointer-events:none;background:transparent;visibility:hidden';
  const sup = supaHost ? ` https://${supaHost}` : '';
  const csp = `default-src 'none'; img-src 'self' ${location.origin} data:${sup} https://*.supabase.co; style-src 'self' ${location.origin} 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' ${location.origin} data: https://fonts.gstatic.com`;
  fr.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}"><base href="${location.origin}/"><style>html,body{margin:0;padding:0;overflow:hidden;background:transparent}*{animation-play-state:running}</style></head><body><div id="zm"></div></body></html>`;
  host.appendChild(fr);
  const M = { fr, doc: null, mount: null, size: { w: 0, h: 0 }, frames: [], styled: false, q: 0, pend: null, busy: false, dead: false, box: { w: 0, h: 0 }, styleEls: [] };
  const ready = new Promise((res) => {
    const done = () => { try { M.doc = fr.contentDocument; M.mount = M.doc && M.doc.getElementById('zm'); } catch {} res(); };
    fr.addEventListener('load', done, { once: true });
    setTimeout(done, 2500);
  });
  const fit = () => {
    const { w, h } = M.size;
    const bw = M.box.w;
    const bh = M.box.h;
    if (!w || !h || !bw || !bh) return;
    const s = Math.min(bw / w, bh / h);
    fr.style.width = `${w}px`;
    fr.style.height = `${h}px`;
    fr.style.transform = `translate(${Math.round((bw - w * s) / 2)}px, ${Math.round((bh - h * s) / 2)}px) scale(${s})`;
    fr.style.visibility = 'visible';
  };
  const applyFrames = () => {
    if (!M.mount) return;
    const imgs = M.mount.querySelectorAll('img[data-zcf]');
    for (let i = 0; i < imgs.length; i++) {
      const k = Number(imgs[i].getAttribute('data-zcf'));
      const f = M.frames[k];
      if (f && imgs[i].getAttribute('src') !== f) imgs[i].setAttribute('src', f);
    }
  };
  const render = async (snap) => {
    await ready;
    if (M.dead || !M.mount) return false;
    const html = await unpackText(snap);
    if (!html || html.length > MAX_HTML) return false;
    const parsed = new DOMParser().parseFromString(`<!doctype html><body>${html}`, 'text/html');
    const src = parsed.body.firstElementChild;
    if (!src) return false;
    const B = { n: MAX_NODES, cv: 0, sizes: Array.isArray(snap.cv) ? snap.cv : [] };
    const clean = build(M.doc, src, B);
    if (!clean) return false;
    if (M.mount.firstChild) morph(M.mount.firstChild, clean); else M.mount.appendChild(clean);
    while (M.mount.childNodes.length > 1) M.mount.removeChild(M.mount.lastChild);
    applyFrames();
    const root = M.mount.firstElementChild;
    if (root && Array.isArray(snap.sc)) {
      for (const it of snap.sc.slice(0, 40)) {
        if (!Array.isArray(it) || !Array.isArray(it[0])) continue;
        const el = it[0].length ? byPath(root, it[0]) : root;
        if (el) { el.scrollTop = Number(it[1]) || 0; el.scrollLeft = Number(it[2]) || 0; }
      }
    }
    const w = Math.max(120, Math.min(4000, Number(snap.w) || 0));
    const h = Math.max(120, Math.min(4000, Number(snap.h) || 0));
    if (w !== M.size.w || h !== M.size.h) { M.size = { w, h }; }
    fit();
    return true;
  };
  const pump = async () => {
    if (M.busy) return;
    M.busy = true;
    while (M.pend && !M.dead) {
      const s = M.pend;
      M.pend = null;
      try { await render(s); } catch {}
    }
    M.busy = false;
  };
  return {
    async setStyles(st) {
      await ready;
      if (M.dead || !M.doc || !st) return;
      M.styleEls.forEach((el) => el.remove());
      M.styleEls = [];
      const head = M.doc.head;
      const links = Array.isArray(st.links) ? st.links.slice(0, 12) : [];
      links.forEach((href) => {
        if (typeof href !== 'string' || !(href.indexOf(location.origin + '/') === 0 || href.indexOf('https://fonts.googleapis.com/') === 0)) return;
        const l = M.doc.createElement('link');
        l.rel = 'stylesheet';
        l.href = href;
        head.appendChild(l);
        M.styleEls.push(l);
      });
      const css = await unpackText(st.c);
      if (css) {
        const s = M.doc.createElement('style');
        s.textContent = cleanCss(css).slice(0, 2500000);
        head.appendChild(s);
        M.styleEls.push(s);
      }
      const de = M.doc.documentElement;
      const bd = M.doc.body;
      if (typeof st.hc === 'string') de.setAttribute('class', st.hc.slice(0, 400));
      if (typeof st.hs === 'string') de.setAttribute('style', cleanCss(st.hs).slice(0, 4000));
      if (typeof st.bc === 'string') bd.setAttribute('class', st.bc.slice(0, 400));
      if (typeof st.bs === 'string') bd.setAttribute('style', `${cleanCss(st.bs).slice(0, 4000)};margin:0;overflow:hidden`);
      M.styled = true;
    },
    setSnap(snap) {
      if (!snap || typeof snap !== 'object') return;
      const q = Number(snap.q) || 0;
      if (q && q < M.q) return;
      M.q = q;
      M.pend = snap;
      pump();
    },
    setFrame(f) {
      if (!f || typeof f.d !== 'string' || !/^data:image\/(webp|jpeg|png);base64,/.test(f.d) || f.d.length > 900000) return;
      const i = Math.max(0, Math.min(5, Number(f.i) || 0));
      M.frames[i] = f.d;
      applyFrames();
    },
    setBox(w, h) { M.box = { w, h }; fit(); },
    hasStyles: () => M.styled,
    destroy() { M.dead = true; try { fr.remove(); } catch {} },
  };
}
