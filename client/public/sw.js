const CACHE_NAME = 'safestay-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/shield.svg',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching core static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network first for dynamic API calls, fallback to cache if available
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          return res;
        })
        .catch(() => {
          return new Response(
            JSON.stringify({ offline: true, error: 'Network unavailable. Running in offline fallback mode.' }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        })
    );
    return;
  }

  // Cache-first for OpenStreetMap tiles to support offline viewing!
  if (url.hostname.includes('tile.openstreetmap.org')) {
    event.respondWith(
      caches.open('safestay-tiles').then((cache) => {
        return cache.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((netRes) => {
            cache.put(event.request, netRes.clone());
            return netRes;
          }).catch(() => cached);
        });
      })
    );
    return;
  }

  // Stale-while-revalidate for other assets
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((netRes) => {
        if (netRes && netRes.status === 200) {
          caches.open(CACHE_NAME).then((c) => c.put(event.request, netRes.clone()));
        }
        return netRes;
      }).catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
