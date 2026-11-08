const scope = self.registration.scope
const prefix = 'puntea-public-'
const cacheName = prefix + version
const publicUrls = new Set(publicPages.map(path => new URL(path, scope).href))

self.addEventListener('install', event => {
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll([...publicUrls])))
})

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys()
    await Promise.all(names.filter(name => name.startsWith(prefix) && name !== cacheName).map(name => caches.delete(name)))
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (request.mode === 'navigate') url.search = ''
  if (!publicUrls.has(url.href)) return
  event.respondWith((async () => {
    try {
      return await fetch(request)
    } catch {
      const cache = await caches.open(cacheName)
      return await cache.match(url.href) || Response.error()
    }
  })())
})
