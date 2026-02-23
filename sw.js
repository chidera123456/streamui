
// ZenStream Service Worker v3.8 - PWA Install Fix
const CACHE_NAME = 'zenstream-v13';
const IMAGE_CACHE_NAME = 'zenstream-images-v3';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/index.css',
  '/index.tsx'
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
          if (name !== CACHE_NAME && name !== IMAGE_CACHE_NAME) {
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
  
  // BYPASS LIST: Third-party APIs and dynamic content providers
  const isBypassed = 
    url.hostname.includes('api.themoviedb.org') || 
    url.hostname.includes('generativelanguage.googleapis.com') ||
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('vidsrc.cc') ||
    url.hostname.includes('vidsrc.to') ||
    url.hostname.includes('vidsrc.me') ||
    url.hostname.includes('vidsrc.xyz');

  if (isBypassed) {
    return;
  }

  const isImage = url.hostname.includes('tmdb.org') || url.hostname.includes('image.tmdb.org');

  // Strategy for images: Cache First, then Network
  if (isImage) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          
          return fetch(event.request, { mode: 'no-cors' }).then((networkResponse) => {
            if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            return new Response(null, { status: 404 });
          });
        });
      })
    );
    return;
  }

  // Navigation: Network First, Fallback to SPA shell
  if (event.request.mode === 'navigate' || event.request.url.includes('manifest.json')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request) || caches.match('/index.html') || caches.match('/');
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
      }).catch(() => {
        return cachedResponse;
      });

      return cachedResponse || fetchPromise;
    })
  );
});
