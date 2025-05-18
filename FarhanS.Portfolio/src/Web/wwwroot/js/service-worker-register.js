// service-worker-register.js
// This script registers the service worker conditionally

(function() {
  // Check for service worker support
  if ('serviceWorker' in navigator) {
    // Register service worker after page load to prioritize rendering
    window.addEventListener('load', function() {
      if (navigator.serviceWorker.controller) {
        console.log('Active service worker found, no need to register');
      } else {
        // Register the service worker
        navigator.serviceWorker.register('/service-worker.js', {
          scope: '/'
        })
        .then(function(registration) {
          console.log('Service worker registered with scope:', registration.scope);
        })
        .catch(function(error) {
          console.error('Service worker registration failed:', error);
        });
      }
    });
  } else {
    console.log('Service workers are not supported in this browser');
  }
})();