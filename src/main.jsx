import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// iOS standalone-PWA keyboard bug: after the keyboard closes, the viewport
// sometimes stays shrunk (innerHeight stuck smaller) until the app is
// force-quit. Rather than fighting the shrink, we detect it after the
// keyboard closes and force WebKit to re-measure by briefly toggling the
// full-height root element's display off/on (a synchronous reflow).
// Scoped ONLY to the main chat composer (data-keyboard-heal="true") so
// blurring other inputs (search bars, PIN pads, settings fields) never
// triggers this — that was causing an unrelated full-app flicker.
let maxVH = window.innerHeight;
window.addEventListener('resize', () => {
  maxVH = Math.max(maxVH, window.innerHeight);
});

const veil = document.createElement('div');
veil.style.cssText =
  'position:fixed;inset:0;z-index:9000;opacity:0;pointer-events:none;' +
  'background:rgba(5,8,16,0.4);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);' +
  'transition:opacity .2s ease-out;';
document.addEventListener('DOMContentLoaded', () => document.body.appendChild(veil));

let pendingHeal = null;

function healViewport() {
  if (maxVH - window.innerHeight <= 4) return; // not actually stuck
  const el = document.getElementById('zapp-root');
  if (!el) return;
  veil.style.opacity = '1';
  setTimeout(() => {
    const prevDisplay = el.style.display;
    el.style.display = 'none';
    void el.offsetHeight; // force synchronous reflow
    el.style.display = prevDisplay || '';
  }, 220);
  setTimeout(() => {
    veil.style.transition = 'opacity .5s cubic-bezier(.32,.72,0,1)';
    veil.style.opacity = '0';
  }, 360);
}

document.addEventListener('focusout', (e) => {
  if (e.target && e.target.getAttribute && e.target.getAttribute('data-keyboard-heal') === 'true') {
    if (pendingHeal) clearTimeout(pendingHeal);
    pendingHeal = setTimeout(healViewport, 140);
  }
});
document.addEventListener('focusin', (e) => {
  // Cancel a queued heal if the user moved to something else entirely
  // (e.g. navigated into a PIN screen) before it fired.
  if (!(e.target && e.target.getAttribute && e.target.getAttribute('data-keyboard-heal') === 'true')) {
    if (pendingHeal) { clearTimeout(pendingHeal); pendingHeal = null; }
  }
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) await reg.unregister();
      await navigator.serviceWorker.register('/sw.js?v=2');
    } catch (err) {
      console.error('Service worker registration failed:', err);
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
