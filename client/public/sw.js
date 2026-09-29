/* The portal no longer opens offline. A browser that installed the earlier offline worker fetches this
 * file on its next update check: it deletes the saved copies of the app, removes itself and reloads the
 * open tabs from the server. Nothing registers this worker; it only replaces the old one.
 */
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith('portal-')).map((key) => caches.delete(key)));
    await self.registration.unregister();
    const tabs = await self.clients.matchAll({ type: 'window' });
    tabs.forEach((tab) => tab.navigate(tab.url));
  })());
});
