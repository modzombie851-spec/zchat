import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

function setAppHeight() {
  const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  document.documentElement.style.setProperty('--app-height', `${vh}px`);
}
setAppHeight();
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', setAppHeight);
  window.visualViewport.addEventListener('scroll', setAppHeight);
}
window.addEventListener('resize', setAppHeight);
window.addEventListener('orientationchange', setAppHeight);

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
