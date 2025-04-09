// This is the production service worker for FarhanS.Portfolio
// It provides offline support and caching for better performance

// Increment this version when you update your service worker
const CACHE_VERSION = 'v1.0.4';

// Use a fixed CACHE_NAME for each deployment
// Will be updated when a new version is deployed
const CACHE_NAME = `farhans-portfolio-${CACHE_VERSION}`;

// Assets to cache on install
// Add or remove assets based on your application's needs
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/css/app.css',
  '/FarhanS.Portfolio.styles.css',
  '/lib/bootstrap/dist/css/bootstrap.min.css',
  '/favicon.png',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/_framework/blazor.webassembly.js',
  '/service-worker-assets.js'
];

// Define allowed external domains for CSP purposes
const ALLOWED_EXTERNAL_DOMAINS = [
  'cdn.jsdelivr.net',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'logos-world.net',
  'upload.wikimedia.org',
  'js.monitor.azure.com',
  'api.farhans-portfolio.com'
];

// Install event - precache all essential assets
self.addEventListener('install', event => {
  console.log(`Service worker installing version ${CACHE_VERSION}`);
  
  // Skip waiting to ensure the new service worker activates immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Service worker pre-caching assets');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log(`Service worker activating version ${CACHE_VERSION}`);
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          // Clean all previous portfolio caches and any offline caches
          return (cacheName.startsWith('farhans-portfolio-') || cacheName.startsWith('offline-cache-')) 
                 && cacheName !== CACHE_NAME;
        }).map(cacheName => {
          console.log('Service worker removing old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // Clear the browser's navigation preload cache if available
      if (self.registration.navigationPreload) {
        return self.registration.navigationPreload.disable();
      }
    }).then(() => {
      // Immediately claim clients so the updated service worker controls all pages
      return self.clients.claim();
    })
  );
});

// Safe cache update function that checks URL validity and handles errors
function safeUpdateCache(cache, request, response) {
  // Only cache same-origin resources or allowed external domains
  try {
    const url = new URL(request.url);
    const isSameOrigin = url.origin === self.location.origin;
    const isAllowedExternalDomain = ALLOWED_EXTERNAL_DOMAINS.some(domain => url.hostname.includes(domain));
    
    // Skip chrome-extension URLs and other problematic schemes
    if (url.protocol === 'chrome-extension:' || 
        !['http:', 'https:'].includes(url.protocol)) {
      return Promise.resolve();
    }
    
    if (isSameOrigin || isAllowedExternalDomain) {
      // Clone the response for caching
      const responseToCache = response.clone();
      return cache.put(request, responseToCache);
    }
  } catch (error) {
    console.error('Error updating cache:', error);
  }
  return Promise.resolve();
}

// Fetch event - serve from cache or network with improved refresh logic
self.addEventListener('fetch', event => {
  // For non-GET requests, go to the network
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Skip handling of chrome-extension and other non-http(s) requests
  try {
    const requestUrl = new URL(event.request.url);
    if (!['http:', 'https:'].includes(requestUrl.protocol)) {
      event.respondWith(fetch(event.request));
      return;
    }
  } catch (error) {
    // Invalid URL, pass through to network
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Define API endpoints for special handling
  const apiEndpoints = [
    'api.farhans-portfolio.com',
    'js.monitor.azure.com'
  ];
  
  // Define external resource domains
  const externalResourceDomains = [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'logos-world.net',
    'upload.wikimedia.org',
    'cdn.jsdelivr.net'
  ];
  
  // Special handling for external resources - always go to network first
  if (externalResourceDomains.some(domain => event.request.url.includes(domain))) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Only cache successful responses
          if (response.ok) {
            const cache = caches.open(CACHE_NAME)
              .then(cache => safeUpdateCache(cache, event.request, response));
          }
          return response;
        })
        .catch(() => {
          // If network fails, try to serve from cache
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Handle API requests - use network first, fall back to cache
  if (apiEndpoints.some(endpoint => event.request.url.includes(endpoint))) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache successful API responses
          if (response.ok) {
            const cache = caches.open(CACHE_NAME)
              .then(cache => safeUpdateCache(cache, event.request, response));
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Check for service-worker-assets.js which contains file hashes
  if (event.request.url.includes('service-worker-assets.js')) {
    // Always get the latest assets manifest from the network
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const cache = caches.open(CACHE_NAME)
            .then(cache => safeUpdateCache(cache, event.request, response));
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // For HTML navigation requests (including root path /) use a "Network First" strategy
  if (isNavigationRequest(event.request) || event.request.url.endsWith('/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache the response
          const cache = caches.open(CACHE_NAME)
            .then(cache => safeUpdateCache(cache, event.request, response));
          return response;
        })
        .catch(() => {
          // Fall back to cache if network fails
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // If no cached version of the page, return cached index.html
              return caches.match('/index.html');
            });
        })
    );
    return;
  }

  // For framework files in /_framework/ use a "Cache First then Network" strategy
  if (event.request.url.includes('/_framework/')) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            // Return cached response immediately
            return cachedResponse;
          }
          
          // If not in cache, get from network
          return fetch(event.request)
            .then(response => {
              if (response.ok) {
                const cache = caches.open(CACHE_NAME)
                  .then(cache => safeUpdateCache(cache, event.request, response));
              }
              return response;
            });
        })
    );
    return;
  }

  // For all other assets, use a "Cache First" strategy with network update
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return cached response if available
        if (cachedResponse) {
          // Asynchronously check for a newer version
          fetch(event.request)
            .then(networkResponse => {
              if (networkResponse.ok) {
                caches.open(CACHE_NAME)
                  .then(cache => safeUpdateCache(cache, event.request, networkResponse));
              }
            })
            .catch(() => { /* Ignore fetch errors */ });
          
          return cachedResponse;
        }
        
        // If not in cache, get from network
        return fetch(event.request)
          .then(response => {
            if (response.ok) {
              caches.open(CACHE_NAME)
                .then(cache => safeUpdateCache(cache, event.request, response));
            }
            return response;
          });
      })
  );
});

// Determine if a request is a navigation request
function isNavigationRequest(request) {
  return (
    request.mode === 'navigate' ||
    (request.method === 'GET' &&
      request.headers.get('accept') &&
      request.headers.get('accept').includes('text/html'))
  );
}

// Add a message listener to handle version checks and updates
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CHECK_VERSION') {
    // Respond with current cache version
    event.ports[0].postMessage({
      version: CACHE_VERSION
    });
  } else if (event.data && event.data.type === 'SKIP_WAITING') {
    // Skip waiting and activate immediately when requested
    self.skipWaiting();
  } else if (event.data && event.data.type === 'CLEAR_ALL_CACHES') {
    // Completely clear all caches and reload all clients
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }).then(() => {
        return self.clients.matchAll({ type: 'window' }).then(clients => {
          clients.forEach(client => {
            client.navigate(client.url);
          });
        });
      })
    );
  } else if (event.data && event.data.type === 'CHECK_FOR_UPDATES') {
    // Trigger a check for updates and reload if needed
    event.waitUntil(
      fetch('/service-worker-assets.js?v=' + new Date().getTime())
        .then(response => response.json())
        .then(assets => {
          const currentHashes = assets.map(asset => asset.hash);
          
          // Get cached assets to compare
          return caches.open(CACHE_NAME)
            .then(cache => cache.match('/service-worker-assets.js'))
            .then(response => response ? response.json() : {})
            .then(cachedAssets => {
              const cachedHashes = cachedAssets.map ? cachedAssets.map(asset => asset.hash) : [];
              
              // Compare the hashes to see if any assets have changed
              const hasUpdates = currentHashes.some((hash, i) => 
                !cachedHashes[i] || hash !== cachedHashes[i]);
              
              if (hasUpdates) {
                // Notify the client that updates are available
                event.ports[0].postMessage({
                  updateAvailable: true
                });
              } else {
                event.ports[0].postMessage({
                  updateAvailable: false
                });
              }
            });
        })
        .catch(error => {
          console.error('Error checking for updates:', error);
          event.ports[0].postMessage({
            updateAvailable: false,
            error: error.message
          });
        })
    );
  }
});

// Handle push notifications if your app uses them
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: data.data
    };
    
    event.waitUntil(
      self.registration.showNotification('FarhanS.Portfolio', options)
    );
  }
});
