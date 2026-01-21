
// ZenStream Service Worker v3.3 - Robust API Fetch Strategy
const CACHE_NAME = 'zenstream-v9';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install: Cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate: Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME && name !== 'zenstream-images') {
            return caches.delete(name);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch handler
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  
  // BYPASS: Never intercept TMDB API calls - let the app handle in-memory caching
  // This resolves the "Failed to fetch" errors in most browser environments
  if (url.hostname.includes('api.themoviedb.org')) {
    return;
  }

  const isImage = url.hostname.includes('tmdb.org') || url.hostname.includes('image.tmdb.org');

  // Strategy for images: Cache First
  if (isImage) {
    event.respondWith(
      caches.open('zenstream-images').then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => null);
        });
      })
    );
    return;
  }

  // Navigation: Try network, fallback to index
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // Generic assets: Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => null);

      return cachedResponse || fetchPromise;
    })
  );
});