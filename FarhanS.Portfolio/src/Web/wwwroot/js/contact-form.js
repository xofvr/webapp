/**
 * Contact form handler for FarhanS Portfolio
 * Handles form submissions and URL parameter processing for FormSubmit.co integration
 */

window.contactFormManager = {
    // Check for form submission parameters in URL
    checkFormSubmissionStatus: function() {
        const urlParams = new URLSearchParams(window.location.search);
        const formSubmitted = urlParams.get('formSubmitted');
        
        if (formSubmitted === 'true') {
            // If form was submitted successfully, clean up URL and notify Blazor
            this.cleanUrl();
            return true;
        }
        
        return false;
    },
    
    // Clean up URL parameters after processing
    cleanUrl: function() {
        if (window.history && window.history.replaceState) {
            const url = window.location.href.split('?')[0];
            window.history.replaceState({}, document.title, url);
        }
    },
    
    // Track form submission beginning and handle local environment differently
    beginFormSubmission: function(event) {
        console.log('Form submission started');
        
        // For local development, prevent default form submission
        if (this.isLocalEnvironment()) {
            console.log('Local environment detected - preventing default form submission');
            if (event) {
                event.preventDefault();
                return false; // Important to return false for onsubmit handler
            }
        }
        
        return true;
    },
    
    // Check if we're in a local development environment
    isLocalEnvironment: function() {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1';
    },
    
    // Simulate a submission for local development testing
    simulateLocalSubmission: function() {
        console.log('Simulating form submission in local environment');
        // This is optional and only helps with local development
    },
    
    // Handle local form submission (can be called from Blazor)
    handleLocalSubmission: function(formData) {
        console.log('Handling local form submission', formData);
        
        // In local environment, we'll just simulate success after a delay
        if (this.isLocalEnvironment()) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        success: true,
                        message: "Message simulated successfully in local development"
                    });
                }, 1500); // Simulate network delay
            });
        }
        
        return Promise.resolve({
            success: false,
            message: "This method should only be used in local development"
        });
    }
};