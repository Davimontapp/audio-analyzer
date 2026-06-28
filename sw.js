// AGGIORNA SOLO QUESTO VALORE QUANDO FAI MODIFICHE:
const VERSION = 'v1.2.0'; 

const CACHE_NAME = `audio-analyzer-${VERSION}`;
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

// Intercetta le richieste di rete
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});

// Gestione dei messaggi in arrivo dall'app
self.addEventListener('message', (event) => {
  if (!event.data) return;

  // Se l'app chiede la versione, rispondi con il valore della variabile VERSION
  if (event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: VERSION });
  }
  
  // Ordine di saltare l'attesa per l'aggiornamento immediato
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
