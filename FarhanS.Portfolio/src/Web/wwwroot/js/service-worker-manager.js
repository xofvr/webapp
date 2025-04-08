/**
 * Service Worker Manager for FarhanS.Portfolio
 * 
 * This enhanced script ensures proper transitions between versions and handles
 * cache invalidation correctly with external resources.
 */

// Register and manage the service worker
if ('serviceWorker' in navigator) {
    // State tracking for update process
    let updateInProgress = false;

    // Register the service worker
    window.addEventListener('load', async function() {
        try {
            // First, check if we need to perform a clean update due to previous issues
            const needsCleanUpdate = localStorage.getItem('cleanUpdateNeeded') === 'true';
            
            if (needsCleanUpdate) {
                console.log('Performing clean update based on previous session flag');
                await performCleanUpdate();
                localStorage.removeItem('cleanUpdateNeeded');
            }
            
            // Attempt to register or update the service worker
            const registration = await navigator.serviceWorker.register('/service-worker.js', {
                updateViaCache: 'none', // Disable HTTP cache for service worker script
                scope: '/'
            });

            console.log('Service worker registered with scope:', registration.scope);
            
            // Track service worker state changes
            trackServiceWorkerState(registration);
            
            // Check for service worker updates immediately and then periodically
            checkForUpdates(registration);
            
            // Check for updates every 15 minutes (not too frequent to avoid excessive network requests)
            setInterval(() => checkForUpdates(registration), 15 * 60 * 1000);
            
            // When page becomes visible again, check for updates
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible' && !updateInProgress) {
                    checkForUpdates(registration);
                }
            });
            
            // Handle controller change events (when a new service worker takes control)
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                console.log('New service worker is now controlling the page');
                
                // Only reload if we're not already in the update process
                if (!updateInProgress) {
                    updateInProgress = true;
                    
                    // Wait a moment for everything to settle before refreshing
                    setTimeout(() => {
                        if (document.visibilityState === 'visible') {
                            // Mark reload as update-related
                            sessionStorage.setItem('updated-pwa', 'true');
                            
                            // Reload the page to ensure consistent state
                            window.location.reload();
                        }
                    }, 1000);
                }
            });
            
            // Allow manual update triggers (like Pull-to-Refresh)
            let touchStartY = 0;
            document.addEventListener('touchstart', e => {
                touchStartY = e.touches[0].clientY;
            }, { passive: true });
            
            document.addEventListener('touchend', e => {
                const touchEndY = e.changedTouches[0].clientY;
                const pullDistance = touchEndY - touchStartY;
                
                // If pulled down more than 100px at the top of the page
                if (pullDistance > 100 && window.scrollY === 0) {
                    checkForUpdates(registration, true);
                }
            }, { passive: true });
            
            // Show welcome back message if returning after update
            if (sessionStorage.getItem('updated-pwa') === 'true') {
                sessionStorage.removeItem('updated-pwa');
                showToast('App updated to the latest version');
            }
            
            // Add debug command for troubleshooting
            window.checkForAppUpdates = () => checkForUpdates(registration, true);
            window.clearAllCaches = performCleanUpdate;
            
        } catch (error) {
            console.error('Service worker registration failed:', error);
        }
    });
    
    // Track and log service worker state changes
    function trackServiceWorkerState(registration) {
        // Log initial states
        logWorkerState('controller', navigator.serviceWorker.controller);
        logWorkerState('installing', registration.installing);
        logWorkerState('waiting', registration.waiting);
        logWorkerState('active', registration.active);
        
        // Monitor for state changes
        registration.addEventListener('updatefound', () => {
            logWorkerState('installing (updatefound)', registration.installing);
            
            // Track the installing worker's state
            if (registration.installing) {
                registration.installing.addEventListener('statechange', () => {
                    logWorkerState('statechange', registration.installing);
                });
            }
        });
    }
    
    // Log worker state in a consistent format
    function logWorkerState(label, worker) {
        if (!worker) {
            console.log(`Service worker ${label}: none`);
            return;
        }
        
        console.log(`Service worker ${label}: ${worker.state} script: ${worker.scriptURL}`);
    }
    
    // Check for updates from the server
    async function checkForUpdates(registration, userInitiated = false) {
        if (updateInProgress) {
            console.log('Update already in progress, skipping check');
            return;
        }
        
        try {
            if (userInitiated) {
                showToast('Checking for updates...');
            }
            
            // Force check for updates
            await registration.update();
            
            // If there's a waiting worker, it means there's a new version ready
            if (registration.waiting) {
                console.log('New version available via waiting worker');
                notifyUpdateReady(registration);
            } else if (userInitiated) {
                // Only show "up to date" for user-initiated checks
                showToast('Your app is already up to date');
            }
        } catch (error) {
            console.error('Error checking for service worker updates:', error);
            if (userInitiated) {
                showToast('Error checking for updates');
            }
        }
    }
    
    // Notify about an update ready to be applied
    function notifyUpdateReady(registration) {
        showUpdateNotification(registration);
    }
    
    // Show a user-friendly update notification
    function showUpdateNotification(registration) {
        // Create update notification element if it doesn't exist
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
                padding: 16px 24px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: space-between;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                max-width: 500px;
                width: 90%;
                animation: slidein 0.3s ease-out;
            `;
            
            notification.innerHTML = `
                <div style="flex: 1;">
                    <div style="font-weight: bold; margin-bottom: 8px;">App Update Available</div>
                    <div style="font-size: 14px; opacity: 0.9;">A new version with improvements is ready. Update now for the best experience.</div>
                </div>
                <div style="margin-left: 16px; display: flex; flex-direction: column; gap: 8px;">
                    <button id="update-clean" style="background: white; border: none; color: #007bff; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold;">Clean Update</button>
                    <button id="update-now" style="background: white; border: none; color: #007bff; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold;">Update Now</button>
                    <button id="update-later" style="background: transparent; border: 1px solid white; color: white; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Later</button>
                </div>
            `;
            
            // Add CSS animation
            const style = document.createElement('style');
            style.textContent = `
                @keyframes slidein {
                    from { transform: translate(-50%, 150%); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
                
                @keyframes fadeout {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
                
                .toast {
                    position: fixed;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background-color: rgba(0,0,0,0.8);
                    color: white;
                    padding: 12px 20px;
                    border-radius: 8px;
                    z-index: 9999;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    animation: slidein 0.3s ease-out, fadeout 0.5s ease-in 2.5s forwards;
                }
            `;
            document.head.appendChild(style);
            
            document.body.appendChild(notification);
            
            // Standard update - use the new service worker
            document.getElementById('update-now').addEventListener('click', () => {
                applyUpdate(registration);
                notification.remove();
            });
            
            // Clean update - clear all caches first
            document.getElementById('update-clean').addEventListener('click', () => {
                performCleanUpdate();
                notification.remove();
            });
            
            // Later - just hide the notification
            document.getElementById('update-later').addEventListener('click', () => {
                notification.remove();
            });
        }
    }
    
    // Apply the pending update
    function applyUpdate(registration) {
        updateInProgress = true;
        
        if (registration.waiting) {
            // Tell the waiting service worker to take control
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        } else {
            // If no waiting worker, just reload the page
            window.location.reload();
        }
    }
    
    // Perform a clean update by clearing all caches
    async function performCleanUpdate() {
        updateInProgress = true;
        showToast('Clearing all caches...');
        
        try {
            // Clear browser caches via the Cache API
            const cacheKeys = await caches.keys();
            for (const key of cacheKeys) {
                await caches.delete(key);
            }
            
            // If we have a controller, tell it to clear caches too
            if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'CLEAR_ALL_CACHES'
                });
            }
            
            // Clear localStorage items that might be stale (excluding essential settings)
            const essentialKeys = ['theme-preference'];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!essentialKeys.includes(key)) {
                    localStorage.removeItem(key);
                }
            }
            
            // Show feedback and reload
            showToast('Cache cleared, reloading...');
            
            // Give a moment for the toast to be visible
            setTimeout(() => {
                // Force reload from server
                window.location.href = window.location.href + '?clearedCache=' + Date.now();
            }, 1000);
            
        } catch (error) {
            console.error('Error during clean update:', error);
            showToast('Error clearing cache. Please try again.');
            updateInProgress = false;
            
            // Set flag for next load
            localStorage.setItem('cleanUpdateNeeded', 'true');
            
            // Try a normal reload as fallback
            window.location.reload();
        }
    }
    
    // Show a temporary toast message
    function showToast(message) {
        // Remove existing toasts
        const existingToasts = document.querySelectorAll('.toast');
        existingToasts.forEach(toast => toast.remove());
        
        // Create and show new toast
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Remove after animation completes
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    }
}