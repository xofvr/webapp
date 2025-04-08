// This is the production service worker for FarhanS.Portfolio
// It provides offline support and caching for better performance

// Increment this version when you update your service worker
const CACHE_VERSION = 'v1.0.3';

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
          return cacheName.startsWith('farhans-portfolio-') && cacheName !== CACHE_NAME;
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
    }).then(() => {
      // Reload all open tabs to ensure they have the latest version
      return self.clients.matchAll({ type: 'window' }).then(clients => {
        clients.forEach(client => {
          client.navigate(client.url);
        });
      });
    })
  );
});

// Fetch event - serve from cache or network with improved refresh logic
self.addEventListener('fetch', event => {
  // For non-GET requests, go to the network
  if (event.request.method !== 'GET') {
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
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
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
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              // Set a short cache expiration for API responses
              cache.put(event.request, responseToCache);
            });
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
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
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
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
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
            // Start a fetch to update the cache in background
            fetch(event.request)
              .then(response => {
                if (response.ok) {
                  caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, response);
                  });
                }
              })
              .catch(() => { /* Ignore fetch errors */ });
            
            return cachedResponse;
          }
          
          // If not in cache, get from network and cache
          return fetch(event.request)
            .then(response => {
              if (response.ok) {
                // Clone the response for caching
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                  cache.put(event.request, responseToCache);
                });
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
          // Start a network fetch in the background to update cache
          fetch(event.request)
            .then(networkResponse => {
              if (networkResponse.ok) {
                caches.open(CACHE_NAME).then(cache => {
                  cache.put(event.request, networkResponse);
                });
              }
            })
            .catch(() => { /* Ignore fetch errors */ });
          
          return cachedResponse;
        }
        
        // If not in cache, get from network
        return fetch(event.request)
          .then(response => {
            if (response.ok && event.request.url.startsWith(self.location.origin)) {
              // Clone the response for caching
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseToCache);
              });
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
