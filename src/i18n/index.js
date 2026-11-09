import React from 'react';

const KEY = 'zchat-lang';
const DIRTY = 'zchat-lang-dirty';
const CODES = ['en', 'si', 'ta'];
export const ZLANGS = [
  { k: 'en', name: 'English', native: 'English' },
  { k: 'si', name: 'Sinhala', native: 'සිංහල' },
  { k: 'ta', name: 'Tamil', native: 'தமிழ்' },
];
const LOAD = { si: () => import('./si.js'), ta: () => import('./ta.js') };
const FONT_FAMILY = { si: 'Noto+Sans+Sinhala', ta: 'Noto+Sans+Tamil' };
const ATTRS = ['placeholder', 'aria-label', 'title'];
const SKIP_SEL = '[data-zuser],[translate="no"],script,style,textarea,noscript,code,[contenteditable]:not([contenteditable="false"])';
const SKIP_TAG = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, NOSCRIPT: 1, CODE: 1 };
const NUM_SRC = '\\d+(?:[.,:]\\d+)*(?:[KM](?![A-Za-z]))?';
const NUM_G = new RegExp(NUM_SRC, 'g');
const LAT = /[A-Za-z]/;
const DIG = /\d/;
const TAILP = /^(.*?[^.…:!?\s])([.…:!?]+)$/;

const Z = { lang: 'en', want: 'en', ex: null, num: null, first: null, last: null, loose: null, cache: new Map(), mo: null, subs: new Set(), job: null, pick: null, css: null };
const TS = new WeakMap();
const AS = new WeakMap();
const FS = new WeakMap();
const FIT_SEL = 'button,[role="button"],[role="tab"],[role="menuitem"],[role="menuitemradio"],[role="radio"],[role="option"],[role="link"],a';
const FITQ = new Set();
let fitRaf = 0;

function store(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch {} }
function read(k) { try { return localStorage.getItem(k); } catch { return null; } }
export function zlangStored() { const v = read(KEY); return CODES.includes(v) ? v : null; }
function deviceLang() {
  try {
    const list = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language]).map((x) => String(x || '').slice(0, 2).toLowerCase());
    const hit = list.find((x) => x === 'si' || x === 'ta');
    return hit && list[0] === hit ? hit : 'en';
  } catch { return 'en'; }
}
export function zlangWanted() { return zlangStored() || deviceLang(); }
export function zlangCode() { return Z.lang; }
export function zlangDirty() { return read(DIRTY) === '1'; }
export function zlangClean(code) { if (!code || code === zlangStored()) store(DIRTY, null); }
export function zlangOnPick(fn) { Z.pick = fn; }

function ping() { Z.subs.forEach((f) => { try { f(); } catch {} }); }
function sub(f) { Z.subs.add(f); return () => Z.subs.delete(f); }
export function useZLang() { return React.useSyncExternalStore(sub, () => Z.lang, () => 'en'); }

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const firstTok = (s) => { const m = /^(\S+)\s/.exec(s); return m ? m[1] : null; };
const lastTok = (s) => { const m = /\s(\S+)$/.exec(s); return m ? m[1] : null; };
function bucket(map, k, p) { let a = map.get(k); if (!a) map.set(k, (a = [])); a.push(p); }

function compile(dict) {
  const ex = new Map();
  const num = new Map();
  const first = new Map();
  const last = new Map();
  const loose = [];
  Object.keys(dict).forEach((k) => {
    const v = dict[k];
    if (typeof v !== 'string' || !v) return;
    if (k.indexOf('{') < 0) { ex.set(k, v); return; }
    if (!/\{[xt]\d?\}/.test(k)) num.set(k, v);
    const names = [];
    const src = k.split(/(\{[nxt]\d?\})/).map((part) => {
      if (/^\{[nxt]\d?\}$/.test(part)) { names.push(part.slice(1, -1)); return part[1] === 'n' ? `(${NUM_SRC})` : '(.+?)'; }
      return esc(part);
    }).join('');
    const p = { re: new RegExp(`^${src}$`), names, v, w: k.replace(/\{[nxt]\d?\}/g, '').length };
    const lead = k.slice(0, k.indexOf('{'));
    const tail = k.slice(k.lastIndexOf('}') + 1);
    const f = firstTok(lead);
    const l = lastTok(tail);
    if (f) bucket(first, f, p);
    else if (l) bucket(last, l, p);
    else loose.push(p);
  });
  const byW = (a, b) => b.w - a.w;
  first.forEach((a) => a.sort(byW));
  last.forEach((a) => a.sort(byW));
  loose.sort(byW);
  Z.ex = ex; Z.num = num; Z.first = first; Z.last = last; Z.loose = loose;
  Z.cache = new Map();
}

function fill(t, vals) { return t.replace(/\{([nxt]\d?)\}/g, (m, nm) => { const v = vals[nm]; if (v == null) return m; if (nm[0] !== 't') return v; const u = tr(v); return u == null ? v : u; }); }

function tryPats(list, s) {
  if (!list) return null;
  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    const m = p.re.exec(s);
    if (m) { const vals = {}; for (let j = 0; j < p.names.length; j++) vals[p.names[j]] = m[j + 1]; return fill(p.v, vals); }
  }
  return null;
}

function slow(s) {
  if (!LAT.test(s)) return null;
  if (DIG.test(s)) {
    const vals = {};
    let i = 0;
    const k = s.replace(NUM_G, (m) => { i += 1; const nm = i === 1 ? 'n' : `n${i}`; vals[nm] = m; return `{${nm}}`; });
    const t = Z.num.get(k);
    if (t !== undefined) return fill(t, vals);
  }
  const f = firstTok(s);
  let out = f ? tryPats(Z.first.get(f), s) : null;
  if (out == null) { const l = lastTok(s); if (l) out = tryPats(Z.last.get(l), s); }
  if (out == null && Z.loose.length) out = tryPats(Z.loose, s);
  if (out == null) {
    const m = TAILP.exec(s);
    if (m) { const b = Z.ex.get(m[1]); if (b !== undefined) out = b + m[2]; }
  }
  return out;
}

function tr(s) {
  const v = Z.ex.get(s);
  if (v !== undefined) return v;
  let c = Z.cache.get(s);
  if (c !== undefined) return c;
  c = slow(s);
  if (Z.cache.size > 4000) Z.cache.clear();
  Z.cache.set(s, c);
  return c;
}

function trWs(s) {
  if (!s || !LAT.test(s)) return null;
  const a = s.trim();
  if (!a) return null;
  const t = tr(a);
  if (t == null || t === a) return null;
  if (a.length === s.length) return t;
  const i = s.indexOf(a);
  return s.slice(0, i) + t + s.slice(i + a.length);
}

export function zt(s) {
  if (Z.lang === 'en' || !Z.ex || typeof s !== 'string') return s;
  const t = trWs(s);
  return t == null ? s : t;
}

function srcOf(n) {
  const r = TS.get(n);
  const v = n.nodeValue;
  if (r) { if (r.o === v) return r.s; TS.delete(n); }
  return v;
}

function put(n, s, t) {
  if (t == null) { if (n.nodeValue !== s) n.nodeValue = s; return; }
  TS.set(n, { s, o: t });
  if (n.nodeValue !== t) { n.nodeValue = t; fitLater(n.parentElement); }
}

function fitLater(el) {
  if (!el || FITQ.has(el)) return;
  FITQ.add(el);
  if (!fitRaf) fitRaf = requestAnimationFrame(fitRun);
}

function fitBox(el) {
  const b = el.closest(FIT_SEL);
  if (!b) return null;
  let d = 0;
  for (let x = el; x && x !== b; x = x.parentElement) d++;
  return d <= 3 ? b : null;
}

function fitRun() {
  fitRaf = 0;
  const items = [];
  FITQ.forEach((el) => { if (el.isConnected && Z.lang !== 'en') { const b = fitBox(el); if (b) items.push([el, b]); } });
  FITQ.clear();
  const todo = [];
  for (let i = 0; i < items.length; i++) {
    const [el, b] = items[i];
    let over = b.scrollWidth - b.clientWidth > 1 || el.scrollWidth - el.clientWidth > 1;
    const p = b.parentElement;
    if (!over && p && p.lastElementChild) {
      const cs = getComputedStyle(p);
      if (cs.display.indexOf('flex') >= 0 && cs.flexDirection.indexOf('column') < 0 && cs.flexWrap === 'nowrap' && !/auto|scroll|hidden/.test(cs.overflowX)) {
        const edge = p.getBoundingClientRect().right - (parseFloat(cs.paddingRight) || 0) - (parseFloat(cs.borderRightWidth) || 0);
        over = p.lastElementChild.getBoundingClientRect().right > edge + 1;
      }
    }
    if (over) todo.push(el);
  }
  if (!todo.length) return;
  const sizes = todo.map((el) => parseFloat(getComputedStyle(el).fontSize) || 0);
  let again = false;
  todo.forEach((el, i) => {
    const now = sizes[i];
    if (!now) return;
    const r = FS.get(el) || { o: el.style.fontSize, base: now };
    const next = Math.round(now * 0.9 * 10) / 10;
    if (next < r.base * 0.76) return;
    FS.set(el, r);
    el.style.fontSize = `${next}px`;
    FITQ.add(el);
    again = true;
  });
  if (again && !fitRaf) fitRaf = requestAnimationFrame(fitRun);
}

function run(nodes) {
  const srcs = nodes.map(srcOf);
  const t = trWs(srcs.join(''));
  if (t != null) { put(nodes[0], srcs[0], t); for (let i = 1; i < nodes.length; i++) put(nodes[i], srcs[i], ''); return; }
  for (let i = 0; i < nodes.length; i++) put(nodes[i], srcs[i], trWs(srcs[i]));
}

function kids(el) {
  let c = el.firstChild;
  if (!c) return;
  if (c.nodeType === 3 && !c.nextSibling) { const s = srcOf(c); put(c, s, trWs(s)); return; }
  let list = null;
  for (; c; c = c.nextSibling) {
    if (c.nodeType === 3) (list || (list = [])).push(c);
    else if (list) { run(list); list = null; }
  }
  if (list) run(list);
}

function attr(el, a) {
  const v = el.getAttribute(a);
  if (v == null || v === '') return;
  let m = AS.get(el);
  const r = m && m[a];
  if (r && r.o === v) return;
  const t = trWs(v);
  if (t == null) { if (r) delete m[a]; return; }
  if (!m) AS.set(el, (m = {}));
  m[a] = { s: v, o: t };
  el.setAttribute(a, t);
}

function attrs(el) { for (let i = 0; i < 3; i++) { if (el.hasAttribute(ATTRS[i])) attr(el, ATTRS[i]); } }

function userEl(e) { return e.hasAttribute('data-zuser') || e.getAttribute('translate') === 'no'; }
function bareEl(e) { return SKIP_TAG[e.tagName] === 1 || (e.hasAttribute('contenteditable') && e.getAttribute('contenteditable') !== 'false'); }
const FILTER = { acceptNode: (e) => (userEl(e) ? 2 : bareEl(e) ? (attrs(e), 2) : 1) };

function deep(root) {
  if (userEl(root)) return;
  attrs(root);
  if (bareEl(root)) return;
  kids(root);
  if (!root.firstElementChild) return;
  const w = document.createTreeWalker(root, 1, FILTER);
  for (let e = w.nextNode(); e; e = w.nextNode()) { attrs(e); kids(e); }
}

function onRecs(recs) {
  if (!Z.ex) return;
  let els = null;
  let adds = null;
  let atts = null;
  for (let i = 0; i < recs.length; i++) {
    const r = recs[i];
    const t = r.target;
    if (r.type === 'childList') {
      if (t.nodeType === 1) (els || (els = new Set())).add(t);
      const an = r.addedNodes;
      for (let j = 0; j < an.length; j++) if (an[j].nodeType === 1) (adds || (adds = [])).push(an[j]);
    } else if (r.type === 'characterData') {
      const p = t.parentNode;
      if (p && p.nodeType === 1) (els || (els = new Set())).add(p);
    } else (atts || (atts = [])).push(r);
  }
  const ok = new Map();
  const free = (e) => { let v = ok.get(e); if (v === undefined) { v = e.isConnected && !e.closest(SKIP_SEL); ok.set(e, v); } return v; };
  if (adds) for (let i = 0; i < adds.length; i++) { const n = adds[i]; const p = n.parentElement; if (p && free(p)) deep(n); }
  if (els) els.forEach((e) => { if (free(e)) kids(e); });
  if (atts) for (let i = 0; i < atts.length; i++) { const r = atts[i]; const e = r.target; if (e.isConnected && !userEl(e) && !e.closest('[data-zuser],[translate="no"]')) attr(e, r.attributeName); }
  Z.mo.takeRecords();
}

function watch() {
  if (Z.mo || typeof MutationObserver === 'undefined') return;
  Z.mo = new MutationObserver(onRecs);
  Z.mo.observe(document.body || document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
}

function unwatch() { if (Z.mo) { Z.mo.disconnect(); Z.mo = null; } }

function restoreAll() {
  const root = document.body;
  if (!root) return;
  const w = document.createTreeWalker(root, 5);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    if (n.nodeType === 3) { const r = TS.get(n); if (r) { if (n.nodeValue === r.o) n.nodeValue = r.s; TS.delete(n); } continue; }
    const m = AS.get(n);
    if (m) { Object.keys(m).forEach((a) => { if (n.getAttribute(a) === m[a].o) n.setAttribute(a, m[a].s); }); AS.delete(n); }
    const f = FS.get(n);
    if (f) { n.style.fontSize = f.o; FS.delete(n); }
  }
}

const CSS = `
html[data-zlang] body{text-rendering:optimizeLegibility}
`;

function fontOn(code) {
  const id = 'zlang-font';
  let l = document.getElementById(id);
  const fam = FONT_FAMILY[code];
  if (!fam) { if (l) l.remove(); return; }
  const href = `https://fonts.googleapis.com/css2?family=${fam}:wght@400..800&display=swap`;
  if (l && l.getAttribute('href') === href) return;
  if (!l) {
    ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'].forEach((u) => {
      if (document.querySelector(`link[rel="preconnect"][href="${u}"]`)) return;
      const p = document.createElement('link');
      p.rel = 'preconnect'; p.href = u;
      if (u.indexOf('gstatic') > 0) p.crossOrigin = 'anonymous';
      document.head.appendChild(p);
    });
    l = document.createElement('link');
    l.id = id; l.rel = 'stylesheet';
    document.head.appendChild(l);
  }
  l.href = href;
}

function docMark(code) {
  const de = document.documentElement;
  if (code === 'en') { de.lang = 'en'; de.removeAttribute('data-zlang'); if (Z.css) { Z.css.remove(); Z.css = null; } return; }
  de.lang = code;
  de.setAttribute('data-zlang', code);
  if (!Z.css) { Z.css = document.createElement('style'); Z.css.id = 'zlang-css'; Z.css.textContent = CSS; document.head.appendChild(Z.css); }
}

function load(code) {
  const get = LOAD[code];
  if (!get) return Promise.resolve(null);
  return get().catch(() => new Promise((r) => setTimeout(r, 900)).then(get)).then((m) => (m && m.default) || null).catch(() => null);
}

function apply(code) {
  Z.want = code;
  if (code === 'en') {
    unwatch();
    if (Z.lang !== 'en') { restoreAll(); Z.ex = null; }
    Z.lang = 'en';
    docMark('en');
    fontOn('en');
    ping();
    return Promise.resolve(true);
  }
  fontOn(code);
  const job = load(code).then((dict) => {
    if (Z.want !== code) return false;
    if (!dict) return false;
    unwatch();
    if (Z.lang !== 'en') restoreAll();
    compile(dict);
    Z.lang = code;
    docMark(code);
    if (document.body) deep(document.body);
    watch();
    ping();
    return true;
  });
  Z.job = job;
  return job;
}

export function setZLang(code, from) {
  if (!CODES.includes(code)) return Promise.resolve(false);
  if (from !== 'sync') {
    store(KEY, code);
    store(DIRTY, '1');
    if (Z.pick) { try { Z.pick(code); } catch {} }
  } else {
    store(KEY, code);
    store(DIRTY, null);
  }
  if (code === Z.want && (code === 'en' || Z.lang === code)) return Promise.resolve(true);
  return apply(code);
}

const BOOT = (() => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null;
  const code = zlangWanted();
  if (code === 'en') return null;
  return Promise.race([apply(code), new Promise((r) => setTimeout(r, 1800))]);
})();

export function zlangBoot() { return BOOT; }
