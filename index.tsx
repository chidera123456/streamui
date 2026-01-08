
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global error handling for debugging deployment issues
window.onerror = function(message, source, lineno, colno, error) {
  console.error("Critical App Error:", message, "at", source, lineno, colno, error);
  return false;
};

// PWA Service Worker Registration with origin fix
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    try {
      // Construction relative to the current window location to prevent 'ai.studio' origin mismatch
      const swPath = new URL('sw.js', window.location.href).pathname;
      const swUrl = window.location.origin + swPath;

      console.log('ZenStream: Registering SW at', swUrl);
      
      navigator.serviceWorker.register(swUrl, { scope: './' })
        .then(reg => console.log('ZenStream: SW Registered', reg.scope))
        .catch(err => {
          // If registration fails due to origin, we log a specific warning
          if (err.message.includes('origin')) {
            console.warn('ZenStream: SW registration blocked by origin policy (expected in some preview modes)');
          } else {
            console.error('ZenStream: SW Failed', err);
          }
        });
    } catch (e) {
      console.error('ZenStream: Failed to resolve SW path', e);
    }
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
