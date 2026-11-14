'use strict';

const cachePrefix = 'task-orbit:' + new URL(self.registration.scope).pathname + ':';
const cacheName = cachePrefix + 'v2';
const files = ['./index.html','./app.js','./styles.css','./manifest.webmanifest','./icon.png','./icon-192.png','./icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(files)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(cachePrefix) && key !== cacheName)
    .map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || !url.href.startsWith(self.registration.scope)) return;
  const page = event.request.mode === 'navigate';
  const file = files.find(path => new URL(path,self.registration.scope).href === url.origin + url.pathname);
  if (!page && !file) return;
  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    const key = new URL(page ? './index.html' : file,self.registration.scope).href;
    try {
      const response = await fetch(event.request);
      if (response.ok) await cache.put(key,response.clone());
      return response;
    } catch {
      return await cache.match(key) ?? Response.error();
    }
  })());
});
