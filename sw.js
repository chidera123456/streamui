// ZenStream Service Worker
const CACHE_NAME = 'zenstream-v2';

// The install event is required for PWA status
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate the SW immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Standard fetch handler to satisfy Chrome's 'installable' requirement
self.addEventListener('fetch', (event) => {
  // We use a network-first strategy to avoid 'broken link' issues 
  // if the cache gets out of sync with the deployment
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});