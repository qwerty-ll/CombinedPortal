/* Service worker of the IVITSH portal: the app opens without internet.
 * Built by pwa/vite-plugin-sw.js, which fills in the build version and its file list.
 * API answers are left to the page: public ones are saved by the API client, personal ones must never be kept here.
 */
const VERSION = __VERSION__;
const SHELL = `portal-shell-${VERSION}`;
const STATIC = 'portal-static-v1';
const PRECACHE = __PRECACHE__;
const STATIC_LIMIT = 80;
const SLOW_NETWORK_MS = 4000;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((n) => n.startsWith('portal-') && n !== SHELL && n !== STATIC).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

const trim = async (cache, limit) => {
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - limit)).map((key) => cache.delete(key)));
};

// Pages of the app (not files, not the API docs): the network when it answers in time, else the saved app
const isAppPage = (url) => !/\.[a-z0-9]+$/i.test(url.pathname) && !/^\/(docs|redoc)\b/.test(url.pathname);

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate' && isAppPage(url)) {
    event.respondWith((async () => {
      const cache = await caches.open(SHELL);
      const network = fetch(request).then((response) => {
        if (response.ok && (response.headers.get('content-type') || '').includes('text/html')) cache.put('/', response.clone());
        return response;
      });
      try {
        return await Promise.race([
          network,
          new Promise((_, reject) => { setTimeout(() => reject(new Error('slow network')), SLOW_NETWORK_MS); }),
        ]);
      } catch {
        return (await cache.match('/')) || network;
      }
    })());
    return;
  }

  if (url.pathname.startsWith('/assets/')) {
    // Hashed file names never change: the saved copy is always right
    event.respondWith((async () => {
      const hit = await caches.match(request);
      if (hit) return hit;
      const response = await fetch(request);
      if (response.ok) {
        const copy = response.clone();
        caches.open(SHELL).then((cache) => cache.put(request, copy));
      }
      return response;
    })());
    return;
  }

  // Pictures, floor plans, sounds: show the saved copy at once and refresh it in the background
  event.respondWith((async () => {
    const cache = await caches.open(STATIC);
    const hit = await cache.match(request);
    const network = fetch(request).then((response) => {
      if (response.ok && response.type === 'basic') {
        cache.put(request, response.clone()).then(() => trim(cache, STATIC_LIMIT));
      }
      return response;
    });
    if (hit) {
      event.waitUntil(network.catch(() => undefined));
      return hit;
    }
    return network;
  })());
});
