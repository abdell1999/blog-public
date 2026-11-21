// Service worker for the abdell.gba demo, registered only with the article's own scope
// (see lib/gba/isolation.ts). It re-serves every response with the headers GitHub Pages can't send,
// so the page becomes cross-origin isolated and mGBA-wasm can use threads.
// Based on the approach of coi-serviceworker (MIT, https://github.com/gzuidhof/coi-serviceworker).
const coep = new URL(self.location.href).searchParams.get('coep') === 'credentialless'
  ? 'credentialless'
  : 'require-corp'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event => event.waitUntil?.(self.clients.claim()))

self.addEventListener('fetch', (event) => {
  let request = event.request
  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') return

  // credentialless: cross-origin no-cors loads go without cookies, which is what lets them in
  if (coep === 'credentialless' && request.mode === 'no-cors') {
    request = new Request(request, { credentials: 'omit' })
  }

  event.respondWith(
    fetch(request).then((response) => {
      if (response.status === 0) return response
      const headers = new Headers(response.headers)
      headers.set('Cross-Origin-Opener-Policy', 'same-origin')
      headers.set('Cross-Origin-Embedder-Policy', coep)
      headers.set('Cross-Origin-Resource-Policy', 'cross-origin')
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
    }),
  )
})
