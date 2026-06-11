// Service worker : application 100 % hors-ligne.
// Stratégie stale-while-revalidate : on sert le cache immédiatement
// et on le rafraîchit en arrière-plan quand le réseau est disponible.

const CACHE = 'grille-orale-v15';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/app.css',
  './js/app.js',
  './js/core/bus.js',
  './js/core/store.js',
  './js/core/dom.js',
  './js/components/scoring.js',
  './js/components/grille.js',
  './js/components/banner.js',
  './js/components/sidebar.js',
  './js/components/widgets/check.js',
  './js/components/widgets/level.js',
  './js/components/widgets/columns.js',
  './js/components/settings/modal.js',
  './js/components/settings/config.js',
  './js/components/settings/eleves.js',
  './js/components/settings/backup.js',
  './js/components/settings/formkit.js',
  './js/data/grille-cg.js',
  './js/data/grille-dg.js',
  './js/components/print.js',
  './vendor/xlsx.bundle.js',
  './vendor/jspdf.umd.min.js',
  './vendor/html2canvas.min.js',
  './icons/icon.svg',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetched = fetch(e.request).then(res => {
        if (res.ok && new URL(e.request.url).origin === self.location.origin) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || fetched;
    })
  );
});
