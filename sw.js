const CACHE_NAME = 'audio-analyzer-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/js/main.js',
  '/js/audio.js',
  '/js/ui.js',
  '/js/pwa-manager.js',
  '/manifest.json'
];

// Installa il Service Worker e salva i file nella cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Attiva il Service Worker e cancella le vecchie cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// Intercetta le richieste di rete per far funzionare l'app offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});

// Ascolta l'ordine di saltare l'attesa per l'aggiornamento immediato
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});