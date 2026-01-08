
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global error handling for debugging
window.onerror = function(message, source, lineno, colno, error) {
  console.error("ZenStream Error:", message, "at", source, lineno, colno, error);
  return false;
};

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Determine the Service Worker path relative to the current location
    const swUrl = new URL('./sw.js', window.location.href).href;
    
    navigator.serviceWorker.register(swUrl, { scope: './' })
      .then(reg => {
        console.log('ZenStream: SW Registered with scope:', reg.scope);
      })
      .catch(err => {
        console.error('ZenStream: SW Registration Failed:', err);
      });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
