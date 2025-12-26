
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global error handling for debugging deployment issues
window.onerror = function(message, source, lineno, colno, error) {
  console.error("Critical App Error:", message, "at", source, lineno, colno, error);
  return false;
};

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
