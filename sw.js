/**
 * DOLANESIA - Service Worker for PWA Caching
 * Offline caching support for Solo Raya Smart Itinerary Planner
 */

const CACHE_NAME = 'dolanesia-v18';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/custom.css',
  './js/data.js',
  './js/planner.js',
  './js/app.js',
  './manifest.json',
  './assets/img/logo-corner.png',
  './assets/img/logo-full.png',
  './assets/img/logo-icon.png',
  './assets/img/logo-mascot-transparent.png',
  './assets/img/logo-wa.png',
  './assets/img/logo-ig.webp',
  './assets/img/masjid-sheikh-zayed.jpg',
  './assets/img/pura-mangkunegaran.jpg',
  './assets/img/pasar-gede.jpg',
  './assets/img/tengkleng-klewer.jpg',
  './assets/img/selat-solo.jpg',
  './assets/img/nasi-liwet.jpg',
  './assets/img/serabi-notosuman.jpg',
  './assets/img/soto-gading.jpg',
  './assets/img/solo-safari.jpg',
  './assets/img/candi-cetho.jpg',
  './assets/img/de-tjolomadoe.webp',
  './assets/img/pasar-triwindu.jpg',
  './assets/img/kampung-batik-laweyan.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;

  // Network First, falling back to cache strategy
  // Guarantees immediate updates on server, while retaining full offline capability
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Fallback to cache when offline
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
