import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

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
