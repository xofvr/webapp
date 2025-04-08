/**
 * Service Worker Manager for FarhanS.Portfolio
 * 
 * This script checks for service worker updates and handles refreshing the application
 * when a new version is deployed, solving the caching issues.
 */

// Register and manage the service worker
if ('serviceWorker' in navigator) {
    // Register the service worker
    window.addEventListener('load', async function() {
        try {
            // Attempt to register or update the service worker
            const registration = await navigator.serviceWorker.register('/service-worker.js', {
                updateViaCache: 'none' // Disable HTTP cache for service worker script
            });

            console.log('Service worker registered with scope:', registration.scope);
            
            // Check for service worker updates periodically (every 30 minutes)
            checkForUpdates(registration);
            setInterval(() => checkForUpdates(registration), 30 * 60 * 1000);
            
            // Handle controller change events (when a new service worker takes control)
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                console.log('New service worker is controlling the page');
                // Don't reload immediately if the user is in the middle of something
                if (document.visibilityState === 'visible' && !window.isUpdating) {
                    window.isUpdating = true;
                    showUpdateNotification();
                }
            });
        } catch (error) {
            console.error('Service worker registration failed:', error);
        }
    });
    
    // Check for updates from the server
    async function checkForUpdates(registration) {
        try {
            // Force update check by bypassing the browser's update check interval
            await registration.update();
            
            // If we have a waiting service worker, it means there's an update available
            if (registration.waiting) {
                console.log('New service worker waiting to activate');
                notifyUpdateReady(registration.waiting);
            }
        } catch (error) {
            console.error('Error checking for service worker updates:', error);
        }
    }
    
    // Notify about an update ready to be applied
    function notifyUpdateReady(worker) {
        // Check the current version against the waiting service worker version
        if (navigator.serviceWorker.controller) {
            const messageChannel = new MessageChannel();
            
            // Listen for the version information from the service worker
            messageChannel.port1.onmessage = (event) => {
                if (event.data && event.data.version) {
                    const newVersion = event.data.version;
                    console.log('New version available:', newVersion);
                    showUpdateNotification();
                }
            };
            
            // Ask the service worker for its version
            worker.postMessage({
                type: 'CHECK_VERSION'
            }, [messageChannel.port2]);
        }
    }
    
    // Show a user-friendly update notification
    function showUpdateNotification() {
        // Create update notification element
        if (!document.getElementById('update-notification')) {
            const notification = document.createElement('div');
            notification.id = 'update-notification';
            notification.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background-color: #007bff;
                color: white;
                padding: 12px 20px;
                border-radius: 4px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: space-between;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                max-width: 400px;
                width: 90%;
            `;
            
            notification.innerHTML = `
                <span>A new version is available!</span>
                <div>
                    <button id="update-later" style="background: transparent; border: 1px solid white; color: white; margin-right: 8px; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Later</button>
                    <button id="update-now" style="background: white; border: none; color: #007bff; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: bold;">Update Now</button>
                </div>
            `;
            
            document.body.appendChild(notification);
            
            // Handle update actions
            document.getElementById('update-now').addEventListener('click', () => {
                // Apply the update and reload the page
                applyUpdate();
                notification.remove();
            });
            
            document.getElementById('update-later').addEventListener('click', () => {
                // Hide notification until next check
                notification.remove();
            });
        }
    }
    
    // Apply the pending update
    function applyUpdate() {
        navigator.serviceWorker.ready.then(registration => {
            if (registration.waiting) {
                // Tell the waiting service worker to take control
                registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            } else {
                // If there's no waiting worker, just reload to get fresh content
                window.location.reload();
            }
        });
    }
    
    // Check for unresolved communication between client and service worker
    setInterval(() => {
        if (navigator.serviceWorker.controller && !navigator.serviceWorker.controller.scriptURL.includes(window.location.origin)) {
            // If service worker is from a different origin, reload to reestablish connection
            window.location.reload();
        }
    }, 60 * 60 * 1000); // Check every hour
}