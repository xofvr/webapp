/**
 * Service Worker Manager for FarhanS.Portfolio
 * This script handles service worker registration, updates, and notifications
 */

// Store for app version info
let currentVersion = {
    version: null,
    timestamp: null
};

// Register and manage the service worker
class ServiceWorkerManager {
    constructor() {
        this.updateAvailable = false;
        this.registration = null;
        this.refreshing = false;

        // Check if the page is being reloaded due to an update
        window.addEventListener('beforeunload', () => {
            this.refreshing = true;
        });

        // Set up navigation check for detecting update reloads
        window.addEventListener('load', () => {
            // If there's a controller, this isn't the first load
            if (navigator.serviceWorker.controller) {
                // If we're not refreshing, check for updates
                if (!this.refreshing) {
                    this.checkForUpdates();
                }
            }
        });

        // Initialize the service worker
        this.init();
    }

    // Initialize the service worker
    async init() {
        if (!('serviceWorker' in navigator)) {
            console.log('Service workers are not supported in this browser');
            return;
        }

        try {
            // Register the service worker
            this.registration = await navigator.serviceWorker.register('/service-worker.js');
            console.log('Service Worker registered with scope:', this.registration.scope);

            // Set up update handler
            this.setupUpdateHandler();

            // Check for any waiting service workers on load
            if (this.registration.waiting) {
                this.showUpdateNotification();
            }
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    }

    // Setup the update handler to listen for updates
    setupUpdateHandler() {
        // Listen for new service workers installing
        this.registration.addEventListener('updatefound', () => {
            const newWorker = this.registration.installing;
            
            console.log('New service worker installing...');
            
            newWorker.addEventListener('statechange', () => {
                // When the service worker is installed
                if (newWorker.state === 'installed') {
                    // Only show the update notification if there's an existing controller
                    if (navigator.serviceWorker.controller) {
                        console.log('New service worker installed, update available');
                        this.showUpdateNotification();
                    }
                }
            });
        });

        // Listen for controller change events
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            // Prevent infinite reloads
            if (!this.refreshing) {
                console.log('New service worker activated, reloading page...');
                this.refreshing = true;
                window.location.reload();
            }
        });

        // Setup message handler
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'VERSION_INFO') {
                currentVersion = event.data.version;
                console.log('Current app version:', currentVersion);
            }
        });
    }

    // Check for updates by comparing versions
    async checkForUpdates() {
        if (!this.registration) return;

        try {
            // Force an update check
            await this.registration.update();
            console.log('Service worker update check completed');
        } catch (error) {
            console.error('Failed to check for service worker updates:', error);
        }
    }

    // Show update notification to the user
    showUpdateNotification() {
        this.updateAvailable = true;
        
        // Create update notification element
        const updateNotification = document.createElement('div');
        updateNotification.className = 'update-notification';
        updateNotification.innerHTML = `
            <div class="update-content">
                <span>A new version is available!</span>
                <button id="update-app-btn" class="update-btn">Update now</button>
                <button id="dismiss-update-btn" class="dismiss-btn">Later</button>
            </div>
        `;
        
        // Style the notification
        const style = document.createElement('style');
        style.textContent = `
            .update-notification {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background-color: var(--primary-color);
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 9999;
                display: flex;
                align-items: center;
                max-width: 90%;
                width: auto;
                animation: slide-up 0.3s ease-out;
            }

            .update-content {
                display: flex;
                align-items: center;
                gap: 15px;
            }

            .update-btn {
                background-color: white;
                color: var(--primary-color);
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .update-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }

            .dismiss-btn {
                background: transparent;
                color: white;
                border: 1px solid white;
                padding: 8px 16px;
                border-radius: 4px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .dismiss-btn:hover {
                background-color: rgba(255, 255, 255, 0.1);
            }

            @keyframes slide-up {
                from {
                    transform: translate(-50%, 100%);
                    opacity: 0;
                }
                to {
                    transform: translate(-50%, 0);
                    opacity: 1;
                }
            }

            [data-theme='dark'] .update-btn {
                background-color: #1a1a1a;
                color: var(--primary-color);
            }
        `;
        
        // Add the notification and styles to the document
        document.head.appendChild(style);
        document.body.appendChild(updateNotification);
        
        // Add event listeners to buttons
        document.getElementById('update-app-btn').addEventListener('click', () => {
            this.applyUpdate();
            updateNotification.remove();
        });
        
        document.getElementById('dismiss-update-btn').addEventListener('click', () => {
            updateNotification.remove();
        });
    }

    // Apply the update by skipping waiting
    applyUpdate() {
        if (!this.registration || !this.registration.waiting) return;
        
        // Send skip waiting message to the waiting service worker
        this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
}

// Initialize the service worker manager when the page loads
window.addEventListener('load', () => {
    window.swManager = new ServiceWorkerManager();
});