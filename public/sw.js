// Service Worker for caching and offline functionality
const CACHE_NAME = 'ather-support-v1';
const STATIC_CACHE_URLS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

const FAQ_CACHE_NAME = 'faq-cache-v1';
const ANALYTICS_CACHE_NAME = 'analytics-cache-v1';

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_CACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== FAQ_CACHE_NAME && cacheName !== ANALYTICS_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle FAQ requests with cache-first strategy
  if (url.pathname.includes('/faqs') || url.pathname.includes('/faq')) {
    event.respondWith(
      caches.open(FAQ_CACHE_NAME).then((cache) => {
        return cache.match(request).then((response) => {
          if (response) {
            // Serve from cache and update in background
            fetch(request).then((fetchResponse) => {
              if (fetchResponse.ok) {
                cache.put(request, fetchResponse.clone());
              }
            }).catch(() => {
              // Silently fail background update
            });
            return response;
          }
          
          // Fetch and cache
          return fetch(request).then((fetchResponse) => {
            if (fetchResponse.ok) {
              cache.put(request, fetchResponse.clone());
            }
            return fetchResponse;
          }).catch(() => {
            // Return offline message for FAQ requests
            return new Response(
              JSON.stringify({ error: 'FAQ data unavailable offline' }),
              { headers: { 'Content-Type': 'application/json' } }
            );
          });
        });
      })
    );
    return;
  }

  // Handle analytics with network-first strategy
  if (url.pathname.includes('/analytics')) {
    event.respondWith(
      fetch(request).then((response) => {
        if (response.ok) {
          caches.open(ANALYTICS_CACHE_NAME).then((cache) => {
            cache.put(request, response.clone());
          });
        }
        return response;
      }).catch(() => {
        return caches.match(request);
      })
    );
    return;
  }

  // Default cache-first strategy for static assets
  if (request.destination === 'script' || request.destination === 'style' || request.destination === 'image') {
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request).then((fetchResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            if (fetchResponse.ok) {
              cache.put(request, fetchResponse.clone());
            }
            return fetchResponse;
          });
        });
      })
    );
    return;
  }
});

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
  if (event.tag === 'faq-sync') {
    event.waitUntil(
      // Sync FAQ data when connection is restored
      fetch('/api/faqs').then((response) => {
        if (response.ok) {
          caches.open(FAQ_CACHE_NAME).then((cache) => {
            cache.put('/api/faqs', response.clone());
          });
        }
      }).catch(() => {
        // Silently fail
      })
    );
  }
});