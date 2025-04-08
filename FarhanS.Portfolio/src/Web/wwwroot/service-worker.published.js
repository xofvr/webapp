// Caution! Be sure you understand the caveats before publishing an application with
// offline support. See https://aka.ms/blazor-offline-considerations

self.importScripts('./service-worker-assets.js');
self.addEventListener('install', event => event.waitUntil(onInstall(event)));
self.addEventListener('activate', event => event.waitUntil(onActivate(event)));
self.addEventListener('fetch', event => event.respondWith(onFetch(event)));
self.addEventListener('message', event => onMessage(event));

// Use dynamic timestamp to force cache refresh on new deployments
const buildTimestamp = new Date().getTime();
const cacheNamePrefix = 'offline-cache-';
// Include a timestamp in the cache name to force cache updates on new deployments
const cacheName = `${cacheNamePrefix}${self.assetsManifest.version}-${buildTimestamp}`;
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
    '/js/navigation.js',
    '/js/service-worker-manager.js'
];

async function onInstall(event) {
    console.info('Service worker: Installing...');
    
    // Skip waiting to ensure new service worker activates immediately
    self.skipWaiting();

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
        .map(key => {
            console.log('Service worker removing old cache:', key);
            return caches.delete(key);
        }));
        
    // Immediately claim clients so the updated service worker controls all pages
    await self.clients.claim();
}

async function onFetch(event) {
    if (event.request.method !== 'GET') {
        return fetch(event.request);
    }

    const requestUrl = new URL(event.request.url);
    
    // Special handling for service-worker-assets.js which contains file hashes
    if (requestUrl.pathname.endsWith('service-worker-assets.js')) {
        // Always get the latest assets manifest from the network
        return fetch(event.request).catch(() => fromCache(event.request));
    }
    
    // Special handling for /_framework/ files to ensure we get the latest versions
    if (requestUrl.pathname.startsWith('/_framework/')) {
        return fetch(event.request)
            .then(response => {
                if (response.ok) {
                    // Cache the new framework files
                    updateCache(event.request, response.clone());
                    return response;
                }
                return fromCache(event.request);
            })
            .catch(() => fromCache(event.request));
    }
    
    // For HTML navigation requests, use "Network First" strategy to ensure fresh content
    if (isNavigationRequest(event.request)) {
        return fetch(event.request)
            .then(response => {
                if (response.ok) {
                    updateCache(event.request, response.clone());
                    return response;
                }
                return fromCache(event.request);
            })
            .catch(() => fromCache(event.request)
                .then(cachedResponse => cachedResponse || caches.match('/index.html')));
    }
    
    // For API requests, use network with a suitable timeout
    const isApiRequest = requestUrl.pathname.startsWith('/api/');
    if (isApiRequest) {
        return fetchWithTimeout(event.request, 3000)
            .catch(() => createOfflineApiResponse());
    }
    
    // For all other assets (CSS, JS, images), try cache first, then network
    return fromCache(event.request)
        .then(response => {
            // Start a network fetch to update the cache in the background
            const fetchPromise = fetch(event.request)
                .then(networkResponse => {
                    if (networkResponse.ok) {
                        updateCache(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                })
                .catch(() => null);
            
            // Return cached response immediately if available, otherwise wait for network
            return response || fetchPromise;
        });
}

// Handle messages from the client
function onMessage(event) {
    if (event.data && event.data.type === 'CHECK_VERSION') {
        // Respond with current cache version
        event.ports[0].postMessage({
            version: self.assetsManifest.version,
            timestamp: buildTimestamp
        });
    } else if (event.data && event.data.type === 'SKIP_WAITING') {
        // Skip waiting and activate immediately when requested
        self.skipWaiting();
    }
}

// Helper functions
function isNavigationRequest(request) {
    return (
        request.mode === 'navigate' ||
        (request.method === 'GET' &&
            request.headers.get('accept') &&
            request.headers.get('accept').includes('text/html'))
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
