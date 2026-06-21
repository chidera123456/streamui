
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global error handling for debugging deployment issues
window.onerror = function(message, source, lineno, colno, error) {
  console.error("Critical App Error:", message, "at", source, lineno, colno, error);
  return false;
};

// PWA Service Worker Cleanup - Unregistering service worker to prevent development caching or intercept issues
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister().then((success) => {
        if (success) {
          console.log('ZenStream: Cleaned stale service worker registration');
          window.location.reload();
        }
      });
    }
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <App />
);
