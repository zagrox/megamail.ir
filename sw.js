// sw.js

const CACHE_NAME = 'megamail-v1.5';
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// URLs for runtime caching
const RUNTIME_CACHE_HOSTS = [
  'https://crm.mailzila.com',
  'https://api.elasticemail.com',
  'https://dns.google',
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
  'https://esm.sh' // For React and other dependencies from esm.sh
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching App Shell');
      return cache.addAll(APP_SHELL_URLS);
    }).catch(err => {
      console.error('Service Worker: Failed to cache app shell:', err);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network-First strategy for API and external resources to ensure fresh data
  if (RUNTIME_CACHE_HOSTS.some(host => url.hostname.endsWith(host) || url.hostname.startsWith(host))) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // If the request is successful, update the cache with the new data
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If the network fails, serve the content from the cache
          return caches.match(event.request);
        })
    );
    return;
  }

  // For app shell requests, use Cache-First.
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});