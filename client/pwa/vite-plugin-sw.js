import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Saved on install so the app starts offline; everything else is saved the first time it is used
const PUBLIC_FILES = [
  '/',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/maskable-512.png',
  '/icons/apple-touch-icon.png',
  '/img/mascot-160.png',
  '/img/mascot-320.png',
];

/** Emits /sw.js with the list of this build's files, so every deploy gets a fresh cache. */
export default function serviceWorker() {
  return {
    name: 'portal-service-worker',
    apply: 'build',
    generateBundle(_, bundle) {
      const built = Object.keys(bundle).filter((file) => /\.(js|css|woff2?)$/.test(file)).map((file) => `/${file}`);
      const precache = [...PUBLIC_FILES, ...built.sort()];
      const template = readFileSync(new URL('./sw.template.js', import.meta.url), 'utf8');
      for (const placeholder of ['const VERSION = __VERSION__;', 'const PRECACHE = __PRECACHE__;']) {
        if (!template.includes(placeholder)) this.error(`sw.template.js lost its placeholder: ${placeholder}`);
      }
      const version = createHash('sha256').update(template).update(precache.join('\n')).digest('hex').slice(0, 12);
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: template
          .replace('const VERSION = __VERSION__;', `const VERSION = ${JSON.stringify(version)};`)
          .replace('const PRECACHE = __PRECACHE__;', `const PRECACHE = ${JSON.stringify(precache, null, 2)};`),
      });
    },
  };
}
