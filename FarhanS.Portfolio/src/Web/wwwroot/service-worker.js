// Caution! Be sure you understand the caveats before publishing an application with
// offline support. See https://aka.ms/blazor-offline-considerations

self.importScripts('./service-worker-assets.js');
self.addEventListener('install', event => event.waitUntil(onInstall(event)));
self.addEventListener('activate', event => event.waitUntil(onActivate(event)));
self.addEventListener('fetch', event => event.respondWith(onFetch(event)));

const cacheNamePrefix = 'offline-cache-';
const cacheName = `${cacheNamePrefix}${self.assetsManifest.version}`;
const offlineAssetsInclude = [ /\.dll$/, /\.pdb$/, /\.wasm/, /\.html/, /\.js$/, /\.json$/, /\.css$/, /\.woff$/, /\.png$/, /\.jpe?g$/, /\.gif$/, /\.ico$/, /\.blat$/, /\.dat$/ ];
const offlineAssetsExclude = [ /^service-worker\.js$/ ];

// Replace with your base path if you are hosting on a subfolder. Ensure there is a trailing '/'.
const base = "/";
const baseUrl = new URL(base, self.origin);
const manifestUrlList = self.assetsManifest.assets.map(asset => new URL(asset.url, baseUrl).href);

// Immediately claim clients so the page can be controlled by this service worker right away
self.addEventListener('activate', event => {
    event.waitUntil(
        clients.claim()
    );
});

async function onInstall(event) {
    console.info('Service worker: Install');

    // Skip waiting to allow immediate activation
    self.skipWaiting();

    // Fetch and cache all matching items from the assets manifest
    const assetsRequests = self.assetsManifest.assets
        .filter(asset => offlineAssetsInclude.some(pattern => pattern.test(asset.url)))
        .filter(asset => !offlineAssetsExclude.some(pattern => pattern.test(asset.url)))
        .map(asset => new Request(asset.url, { integrity: asset.hash, cache: 'no-cache' }));
    
    try {
        const cache = await caches.open(cacheName);
        await cache.addAll(assetsRequests);
        console.info('Service worker: All required resources have been cached');
    } catch (error) {
        console.error('Service worker: Cache addition failed:', error);
    }
}

async function onActivate(event) {
    console.info('Service worker: Activate');

    // Delete unused caches
    const cacheKeys = await caches.keys();
    await Promise.all(cacheKeys
        .filter(key => key.startsWith(cacheNamePrefix) && key !== cacheName)
        .map(key => caches.delete(key)));
    
    console.info('Service worker: Old caches deleted');
}

async function onFetch(event) {
    if (event.request.method !== 'GET') {
        return fetch(event.request);
    }

    try {
        // For all navigation requests, try to serve index.html from cache
        const shouldServeIndexHtml = event.request.mode === 'navigate'
            && !manifestUrlList.some(url => url === event.request.url);

        const request = shouldServeIndexHtml ? 'index.html' : event.request;
        const cache = await caches.open(cacheName);
        
        // Try to serve from cache first
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // If not in cache, try to fetch from network
        const networkResponse = await fetch(event.request);
        
        // Cache valid responses for future use
        if (networkResponse && networkResponse.ok && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            event.waitUntil(cache.put(event.request, responseToCache));
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Service worker: Fetch handler failed:', error);
        
        // If fetch fails, try to return from cache as a fallback
        const cache = await caches.open(cacheName);
        const cachedResponse = await cache.match('index.html');
        return cachedResponse || new Response('Network error happened', { 
            status: 408, 
            headers: { 'Content-Type': 'text/plain' } 
        });
    }
}
