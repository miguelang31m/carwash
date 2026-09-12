/* Car Wash La 33 - Service Worker
   Garantiza uso OFFLINE tras la primera carga: cachea el App Shell
   y responde desde caché cuando no hay internet. */

const CW_CACHE = 'carwash33-v1';
const CW_ASSETS = [
  './',
  './index.html',
  './login.html',
  './agendar.html',
  './css/style.css',
  './js/store.js',
  './js/app.js',
  './js/cliente.js',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CW_CACHE).then((cache) => cache.addAll(CW_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CW_CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) =>
      cached || fetch(e.request).then((res) => {
        const clone = res.clone();
        caches.open(CW_CACHE).then((cache) => cache.put(e.request, clone));
        return res;
      }).catch(() => cached)
    )
  );
});
