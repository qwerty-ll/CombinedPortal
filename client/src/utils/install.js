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

export const registerServiceWorker = () => {
  if (!import.meta.env.PROD || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => console.warn('[PWA] Service worker not registered:', err));
  });
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

// Online / offline, for the "no internet" notice
export const useOnline = () => {
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine !== false);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
};
