const CACHE = 'paekaikon-v11';
const ASSETS = [
  './', 'index.html', 'style.css', 'app.js', 'character.js', 'manifest.webmanifest',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png',
  "fonts/itim-latin-400-normal.woff2",
  "fonts/itim-thai-400-normal.woff2",
  "fonts/kodchasan-latin-500-normal.woff2",
  "fonts/kodchasan-thai-500-normal.woff2",
  "fonts/mali-latin-500-normal.woff2",
  "fonts/mali-latin-700-normal.woff2",
  "fonts/mali-thai-500-normal.woff2",
  "fonts/mali-thai-700-normal.woff2",
  "fonts/sriracha-latin-400-normal.woff2",
  "fonts/sriracha-thai-400-normal.woff2",
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// network first for the app shell so updates arrive, cache fallback when offline
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.includes('/fonts/') || url.pathname.includes('/icons/')) {
    e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
    return;
  }
  e.respondWith(
    fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
