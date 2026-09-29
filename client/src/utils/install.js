import { useEffect, useState } from 'react';

// Chrome and Edge offer installing the portal as an app; the event comes once, early, so it is caught at startup.
let installEvent = null;
const listeners = new Set();
const notify = () => listeners.forEach((listener) => listener());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    installEvent = event;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    installEvent = null;
    notify();
  });
}

export const isStandalone = () => typeof window !== 'undefined'
  && (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true);

// iPhone and iPad (iPadOS reports itself as a Mac with a touch screen) install only from Safari's Share menu
export const isIos = () => typeof navigator !== 'undefined'
  && (/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

// The portal no longer opens offline. Browsers that registered the earlier offline worker drop it
// and its saved copies of the app, so every visit gets the current version from the server. The old worker
// still serves the page it was removed on and may save files again; the next visit clears them for good.
export const removeServiceWorker = () => {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  navigator.serviceWorker.getRegistrations()
    .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
    .then(() => (typeof caches === 'undefined' ? [] : caches.keys()))
    .then((keys) => Promise.all(keys.filter((key) => key.startsWith('portal-')).map((key) => caches.delete(key))))
    .catch(() => {});
};

export const useInstallApp = () => {
  const [, rerender] = useState(0);
  useEffect(() => {
    const listener = () => rerender((n) => n + 1);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  const install = async () => {
    if (!installEvent) return false;
    const event = installEvent;
    installEvent = null;
    event.prompt();
    const { outcome } = await event.userChoice;
    notify();
    return outcome === 'accepted';
  };

  return { canInstall: !!installEvent, installed: isStandalone(), ios: isIos(), install };
};
