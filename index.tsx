
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global error handling for debugging deployment issues
window.onerror = function(message, source, lineno, colno, error) {
  console.error("Critical App Error:", message, "at", source, lineno, colno, error);
  return false;
};

// PWA Service Worker Registration - Must be registered for install prompt to show
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' })
      .then(reg => console.log('ZenStream: SW Registered', reg.scope))
      .catch(err => console.error('ZenStream: SW Failed', err));
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
