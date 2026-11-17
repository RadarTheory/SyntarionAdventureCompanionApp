// v5 (user, 2026-11-17): only the build's fingerprinted files (/assets/…) are served from the cache first; everything
// else (icons, art, the constellation) is fetched fresh and the cache is only the offline fallback. Before, every file
// was cached for good, so replaced images and scripts never reached the app.
const CACHE_NAME = 'syntarion-shell-v5';
const APP_SHELL = [
  '/',
  '/site.webmanifest',
  '/pwa-icon-192.png',
  '/pwa-icon-512.png',
  '/apple-touch-icon.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/src/') || url.pathname.startsWith('/node_modules/') || url.pathname.startsWith('/@vite') || url.pathname.startsWith('/@react-refresh')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('/', copy));
          return response;
        })
        .catch(() => caches.match('/'))
    );
    return;
  }

  const keep = response => {
    if (response && response.status === 200) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
    }
    return response;
  };

  // Fingerprinted build files never change under the same name, so the cache can answer first.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(keep)));
    return;
  }

  // Everything else: the network first, so a replaced file shows at once; the cache only when offline.
  event.respondWith(fetch(request).then(keep).catch(() => caches.match(request)));
});
