// service-worker-manager.js
// This script handles service worker updates and notifications

class ServiceWorkerManager {
  constructor() {
    this.registration = null;
    this.refreshing = false;
    
    // Check if service workers are supported
    if ('serviceWorker' in navigator) {
      // Initialize the service worker
      this.init();
      
      // Listen for controller change events (occurs when a new service worker takes control)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!this.refreshing) {
          this.refreshing = true;
          window.location.reload();
        }
      });
    }
  }
  
  async init() {
    try {
      // Register the service worker
      this.registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service worker registered successfully', this.registration);
      
      // Check for updates immediately and then periodically
      this.checkForUpdates();
      setInterval(() => this.checkForUpdates(), 60 * 60 * 1000); // Check every hour
      
      // Handle updates when they're found
      this.handleUpdates();
    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  }
  
  async checkForUpdates() {
    if (!this.registration) return;
    
    try {
      await this.registration.update();
      console.log('Service worker update check completed');
    } catch (error) {
      console.error('Service worker update check failed:', error);
    }
  }
  
  handleUpdates() {
    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration.installing;
      
      newWorker.addEventListener('statechange', () => {
        // When the service worker is installed, notify the user about the update
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          this.showUpdateNotification();
        }
      });
    });
  }
  
  showUpdateNotification() {
    // You can implement a UI notification here
    console.log('New version of the app is available! Reload the page to update.');
    
    // Create a notification element
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.backgroundColor = '#333';
    notification.style.color = 'white';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '5px';
    notification.style.zIndex = '9999';
    notification.style.textAlign = 'center';
    notification.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    notification.innerHTML = `
      New version available! 
      <button id="update-button" style="margin-left: 10px; padding: 5px 10px; background: #4CAF50; color: white; border: none; border-radius: 3px; cursor: pointer;">
        Update Now
      </button>
    `;
    
    document.body.appendChild(notification);
    
    // Add event listener to the update button
    document.getElementById('update-button').addEventListener('click', () => {
      // Reload the page to activate the new service worker
      window.location.reload();
    });
  }
}

// Initialize the service worker manager when the page loads
window.addEventListener('load', () => {
  window.swManager = new ServiceWorkerManager();
});