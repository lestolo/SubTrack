/*
 * SubTrack service worker: offline cache + local renewal reminders.
 * No push server is used; reminders are computed on the device.
 */
/* global ST */
importScripts(
  'js/core/version.js',
  'js/core/catalog.js',
  'js/core/schedule.js',
  'js/core/i18n.js',
  'js/core/db.js',
  'js/core/reminders.js',
);

const CACHE = `subtrack-${ST.VERSION}`;
const ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/app.css',
  'js/core/version.js',
  'js/core/catalog.js',
  'js/core/icons.js',
  'js/core/schedule.js',
  'js/core/i18n.js',
  'js/core/db.js',
  'js/core/reminders.js',
  'js/core/ics.js',
  'js/ui.js',
  'js/install.js',
  'js/app.js',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/maskable-512.png',
  'icons/apple-touch-icon.png',
  'icons/badge-96.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('subtrack-') && k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
  if (event.data === 'check') event.waitUntil(ST.reminders.check(self.registration));
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  // App shell: cache first (versioned cache), so the app opens offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match('index.html').then((hit) => hit || fetch(req)),
    );
    return;
  }
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req)),
  );
});

// Chromium on Android, for installed apps with enough site engagement.
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'renewal-check') {
    event.waitUntil(ST.reminders.check(self.registration));
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || './', self.registration.scope).href;
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) {
      if (c.url.startsWith(self.registration.scope) && 'focus' in c) return c.focus();
    }
    return self.clients.openWindow(url);
  })());
});
