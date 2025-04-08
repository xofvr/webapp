// service-worker-manager.js
// This script helps manage the service worker lifecycle and provides update notifications
// Version 1.0.5

(function () {
  'use strict';

  // Configuration
  const config = {
    // How often to check for updates (in minutes)
    updateCheckInterval: 60,
    // Whether to show update notifications
    showUpdateNotifications: true,
    // Auto-update after this many checks (set to 0 to disable auto-updates)
    autoUpdateAfterChecks: 3
  };

  // Track number of update checks
  let updateCheckCount = 0;
  
  // Track if there's a pending update
  let updateAvailable = false;

  // Register the service worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      registerServiceWorker();
      setupUpdateChecking();
      createUpdateUI();
    });
  }

  // Register the service worker
  function registerServiceWorker() {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service worker registered with scope:', registration.scope);
        
        // Check for updates on register
        checkForUpdates(registration);
        
        // Setup event listeners for service worker state changes
        setupServiceWorkerEvents(registration);
      })
      .catch(error => {
        console.error('Service worker registration failed:', error);
      });
  }

  // Setup event listeners for service worker state changes
  function setupServiceWorkerEvents(registration) {
    // Handle new service worker installation
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      
      newWorker.addEventListener('statechange', () => {
        // Once the service worker is installed, check for updates
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('New service worker installed, update available');
          updateAvailable = true;
          showUpdateNotification();
        }
      });
    });

    // Log the current state of all service workers
    logServiceWorkerState();
  }

  // Log the current state of all service workers
  function logServiceWorkerState() {
    navigator.serviceWorker.getRegistration().then(registration => {
      if (registration) {
        console.log('Service worker installing:', describeServiceWorker(registration.installing));
        console.log('Service worker waiting:', describeServiceWorker(registration.waiting));
        console.log('Service worker active:', describeServiceWorker(registration.active));
      }
    });
  }

  // Describe a service worker's state
  function describeServiceWorker(sw) {
    if (!sw) return 'none';
    return `${sw.state} script: ${sw.scriptURL}`;
  }

  // Setup periodic update checking
  function setupUpdateChecking() {
    if (config.updateCheckInterval > 0) {
      const intervalMs = config.updateCheckInterval * 60 * 1000;
      
      // Check for updates periodically
      setInterval(() => {
        navigator.serviceWorker.getRegistration().then(registration => {
          if (registration) {
            checkForUpdates(registration);
          }
        });
      }, intervalMs);
    }
    
    // Also check for updates when the page becomes visible again
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        navigator.serviceWorker.getRegistration().then(registration => {
          if (registration) {
            checkForUpdates(registration);
          }
        });
      }
    });
  }

  // Check for service worker updates
  function checkForUpdates(registration) {
    // First, try the standard update check
    registration.update()
      .then(() => {
        // Also communicate with the active service worker to check for content updates
        if (navigator.serviceWorker.controller) {
          const messageChannel = new MessageChannel();
          
          messageChannel.port1.onmessage = event => {
            if (event.data && event.data.updateAvailable) {
              console.log('Update detected by content hash check');
              updateAvailable = true;
              updateCheckCount++;
              
              if (config.showUpdateNotifications) {
                showUpdateNotification();
              }
              
              // Auto-update after a certain number of checks
              if (config.autoUpdateAfterChecks > 0 && 
                  updateCheckCount >= config.autoUpdateAfterChecks) {
                applyUpdate();
              }
            }
          };
          
          navigator.serviceWorker.controller.postMessage({
            type: 'CHECK_FOR_UPDATES'
          }, [messageChannel.port2]);
        }
      })
      .catch(error => {
        console.error('Error checking for service worker updates:', error);
      });
  }

  // Create the update notification UI
  function createUpdateUI() {
    if (!config.showUpdateNotifications) return;
    
    // Create a hidden update notification element
    const notification = document.createElement('div');
    notification.id = 'sw-update-notification';
    notification.style.display = 'none';
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.backgroundColor = '#3a86ff';
    notification.style.color = 'white';
    notification.style.padding = '12px 16px';
    notification.style.borderRadius = '4px';
    notification.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    notification.style.zIndex = '9999';
    notification.style.transition = 'all 0.3s ease';
    notification.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    notification.style.maxWidth = '300px';
    
    notification.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <span>A new version is available!</span>
        <button id="sw-update-button" style="background: white; color: #3a86ff; border: none; padding: 6px 12px; margin-left: 10px; border-radius: 4px; cursor: pointer; font-weight: bold;">Update</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Add event listener to the update button
    document.getElementById('sw-update-button').addEventListener('click', () => {
      applyUpdate();
      notification.style.display = 'none';
    });
  }

  // Show the update notification
  function showUpdateNotification() {
    const notification = document.getElementById('sw-update-notification');
    if (notification) {
      notification.style.display = 'block';
    }
  }

  // Apply the pending update
  function applyUpdate() {
    navigator.serviceWorker.getRegistration().then(registration => {
      if (registration.waiting) {
        // If there's a waiting worker, tell it to take control
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      } else {
        // Otherwise, simply reload the page to get the latest version
        window.location.reload();
      }
    });

    // Also listen for controllerchange events, which indicate a new service worker has taken control
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // Reload the page when a new service worker takes control
      window.location.reload();
    });
  }

  // Expose some functions to the global scope for debugging
  window.swManager = {
    checkForUpdates: () => {
      navigator.serviceWorker.getRegistration().then(checkForUpdates);
    },
    applyUpdate: applyUpdate,
    clearCache: () => {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CLEAR_ALL_CACHES'
        });
      }
    }
  };
})();