import React from 'react';

const mods = new Map();
const jobs = new Map();
const loaders = new Map();
const ui = { Wait: null, Fail: null };

export function zLazySetUi(parts) {
  Object.assign(ui, parts || {});
}

function staleBuild(e) {
  return /dynamically imported module|Importing a module script failed|error loading dynamically imported module|MIME type|Unexpected token '<'|ChunkLoadError|Loading chunk/i.test(String((e && e.message) || e || ''));
}

function reloadOnce() {
  try {
    const last = Number(sessionStorage.getItem('zchat-chunk-reload') || 0);
    if (Date.now() - last < 60000) return false;
    sessionStorage.setItem('zchat-chunk-reload', String(Date.now()));
  } catch {
    return false;
  }
  const go = () => {
    const settle = typeof window !== 'undefined' && window.__zchatAuthSettle ? window.__zchatAuthSettle() : null;
    Promise.resolve(settle).then(() => window.location.reload(), () => window.location.reload());
  };
  try {
    if (typeof caches !== 'undefined') {
      caches.keys().then((keys) => Promise.all(keys.filter((k) => k.indexOf('zchat-shell-') === 0).map((k) => caches.open(k).then((c) => c.delete('/'))))).then(go, go);
      setTimeout(go, 1500);
      return true;
    }
  } catch {}
  go();
  return true;
}

function load(area, quiet) {
  if (mods.has(area)) return Promise.resolve(mods.get(area));
  if (jobs.has(area)) return jobs.get(area);
  const get = loaders.get(area);
  const job = get()
    .catch(() => new Promise((r) => setTimeout(r, 900)).then(() => get()))
    .then((m) => { mods.set(area, m); jobs.delete(area); return m; })
    .catch((e) => {
      jobs.delete(area);
      if (!quiet && staleBuild(e) && typeof navigator !== 'undefined' && navigator.onLine !== false && reloadOnce()) return new Promise(() => {});
      throw e;
    });
  jobs.set(area, job);
  return job;
}

class Boundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {}
  render() {
    if (!this.state.failed) return this.props.children;
    const Fail = ui.Fail;
    const retry = () => { this.setState({ failed: false }); this.props.onRetry(); };
    if (Fail) return <Fail onRetry={retry} />;
    return (
      <div style={{ padding: 24, textAlign: 'center', fontSize: 14 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>This did not load</div>
        <button type="button" onClick={retry} style={{ height: 40, padding: '0 18px', borderRadius: 20, border: 'none', fontWeight: 700 }}>Try again</button>
      </div>
    );
  }
}

function Wait() {
  const [show, setShow] = React.useState(false);
  React.useEffect(() => { const t = setTimeout(() => setShow(true), 260); return () => clearTimeout(t); }, []);
  if (!show) return null;
  const W = ui.Wait;
  return W ? <W /> : null;
}

export function zLazy(get, name, area) {
  if (!loaders.has(area)) loaders.set(area, get);
  let lazyComp = null;
  const makeLazy = () => React.lazy(() => load(area).then((m) => ({ default: m[name] })));
  const Wrapped = React.forwardRef(function ZLazy(props, ref) {
    const [mode] = React.useState(() => (mods.has(area) ? 'ready' : 'lazy'));
    const [round, setRound] = React.useState(0);
    if (mode === 'ready') {
      const Real = mods.get(area)[name];
      return <Real ref={ref} {...props} />;
    }
    if (!lazyComp) lazyComp = makeLazy();
    const L = lazyComp;
    return (
      <Boundary onRetry={() => { lazyComp = makeLazy(); setRound((n) => n + 1); }}>
        <React.Suspense fallback={<Wait />}>
          <L key={round} ref={ref} {...props} />
        </React.Suspense>
      </Boundary>
    );
  });
  Wrapped.displayName = name;
  return Wrapped;
}

let prefetching = false;
export function zLazyPrefetch(first) {
  if (prefetching) return;
  prefetching = true;
  let slow = false;
  try { const c = navigator.connection; slow = !!(c && (c.saveData || /(^|-)2g$/.test(String(c.effectiveType || '')))); } catch {}
  const order = [...new Set([...(first || []), ...(slow ? [] : loaders.keys())])].filter((a) => loaders.has(a)).slice(0, slow ? 2 : 99);
  const idle = (fn) => (typeof window !== 'undefined' && window.requestIdleCallback ? window.requestIdleCallback(fn, { timeout: 4000 }) : setTimeout(fn, 400));
  const next = () => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) { window.addEventListener('online', () => setTimeout(next, 1500), { once: true }); return; }
    const area = order.shift();
    if (!area) return;
    idle(() => { load(area, true).catch(() => {}).then(() => setTimeout(next, 250)); });
  };
  next();
}
