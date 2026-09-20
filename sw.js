// Offline-Fähigkeit für die Baustelle: alle Dateien des Finders werden beim ersten Aufruf zwischengespeichert.
const CACHE = 'h2-produktfinder-3.7.1';
const DATEIEN = [
    './', 'index.html', 'style.css', 'daten/finder-daten.js', 'fragen.js', 'engine.js', 'skizzen.js', 'eigenschaften.js', 'finder.js',
    'favicon.svg', 'h2-logo-weiss.svg', 'manifest.webmanifest', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png',
];

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(DATEIEN)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
    event.waitUntil(caches.keys()
        .then((namen) => Promise.all(namen.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
        .then(() => self.clients.claim()));
});

// Netz zuerst (immer aktuelle Daten), bei fehlendem Empfang aus dem Zwischenspeicher
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    event.respondWith(fetch(event.request)
        .then((antwort) => {
            const kopie = antwort.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, kopie));
            return antwort;
        })
        .catch(() => caches.match(event.request, {ignoreSearch: true})));
});
