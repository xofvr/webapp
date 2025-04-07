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

// Cache first-load resources (improved efficiency)
const firstLoadResources = [
    '/',
    '/index.html',
    '/_framework/blazor.webassembly.js',
    '/css/app.css',
    '/css/theme.css',
    '/js/theme.js',
    '/js/navigation.js'
];

async function onInstall(event) {
    console.info('Service worker: Installing...');

    // Cache all resources during install for better performance
    const assetsRequests = self.assetsManifest.assets
        .filter(asset => offlineAssetsInclude.some(pattern => pattern.test(asset.url)))
        .filter(asset => !offlineAssetsExclude.some(pattern => pattern.test(asset.url)))
        .map(asset => new Request(asset.url, { cache: 'reload' }));
    
    // Prioritize first-load resources
    const firstLoadRequests = firstLoadResources.map(url => new Request(url, { cache: 'reload' }));
    
    await caches.open(cacheName).then(cache => {
        // Cache first-load resources first
        return cache.addAll(firstLoadRequests)
            .then(() => cache.addAll(assetsRequests));
    });
}

async function onActivate(event) {
    console.info('Service worker: Activating...');

    // Delete unused caches
    const cacheKeys = await caches.keys();
    await Promise.all(cacheKeys
        .filter(key => key.startsWith(cacheNamePrefix) && key !== cacheName)
        .map(key => caches.delete(key)));
}

async function onFetch(event) {
    if (event.request.method !== 'GET') {
        return fetch(event.request);
    }

    // For HTML, JavaScript, or CSS, always try network first, then fall back to cache
    const requestUrl = new URL(event.request.url);
    const isHtmlJsCss = /\.html$|\.js$|\.css$/.test(requestUrl.pathname);
    const isApiRequest = requestUrl.pathname.startsWith('/api/');
    
    if (isApiRequest) {
        // For API requests, use network with a suitable timeout
        return fetchWithTimeout(event.request, 3000)
            .catch(() => createOfflineApiResponse());
    }
    
    if (isHtmlJsCss) {
        // Try network first, then fall back to cache
        return fetch(event.request)
            .then(response => {
                if (response.ok) {
                    // If successful, update the cache
                    updateCache(event.request, response.clone());
                    return response;
                }
                // If network fails, try the cache
                return fromCache(event.request);
            })
            .catch(error => {
                console.error('Fetch failed; returning offline page instead.', error);
                return fromCache(event.request);
            });
    }
    
    // For other requests, try cache first, then network
    return fromCache(event.request)
        .then(response => response || fetch(event.request)
            .then(networkResponse => {
                if (networkResponse.ok) {
                    updateCache(event.request, networkResponse.clone());
                }
                return networkResponse;
            })
        );
}

function fetchWithTimeout(request, timeout) {
    return new Promise((resolve, reject) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        fetch(request, { signal: controller.signal })
            .then(response => {
                clearTimeout(timeoutId);
                resolve(response);
            })
            .catch(error => {
                clearTimeout(timeoutId);
                reject(error);
            });
    });
}

function createOfflineApiResponse() {
    return new Response(JSON.stringify({ 
        offline: true, 
        message: 'You are currently offline. Please check your connection.' 
    }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
    });
}

async function fromCache(request) {
    const cache = await caches.open(cacheName);
    const matching = await cache.match(request);
    return matching;
}

async function updateCache(request, response) {
    const cache = await caches.open(cacheName);
    await cache.put(request, response);
}
