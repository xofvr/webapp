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
    beginFormSubmission: function(event, isLocal) {
        console.log('Form submission started');
        
        // For local development, prevent default form submission
        if (isLocal === 'true') {
            console.log('Local environment detected - preventing default form submission');
            if (event) {
                event.preventDefault();
                return false; // Important to return false for onsubmit handler
            }
        }
        
        return true;
    }
};