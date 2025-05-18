// service-worker-register.js
// This script registers the service worker using the ServiceWorkerManager

// Load the ServiceWorkerManager when the page loads
if (typeof ServiceWorkerManager === 'undefined') {
  // If ServiceWorkerManager isn't loaded yet, we need to load it first
  window.addEventListener('load', function() {
    // Create script element to load service-worker-manager.js
    const script = document.createElement('script');
    script.src = '/js/service-worker-manager.js';
    script.onload = function() {
      // Once loaded, initialize the ServiceWorkerManager
      window.swManager = new ServiceWorkerManager();
    };
    document.head.appendChild(script);
  });
} else {
  // If ServiceWorkerManager is already defined, initialize it directly
  window.addEventListener('load', function() {
    window.swManager = new ServiceWorkerManager();
  });
}