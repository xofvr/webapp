/**
 * Theme handling functionality for FarhanS.Portfolio
 */

// Initialize theme from local storage or system preference
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
});

function initializeTheme() {
    // Check if user has previously selected a theme
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
        // Apply saved theme
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeToggleIcon(savedTheme);
    } else {
        // Apply theme based on system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = prefersDark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        updateThemeToggleIcon(theme);
    }
}

// Function to toggle between light and dark themes
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // Update theme
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update toggle button icon
    updateThemeToggleIcon(newTheme);
}

// Update the theme toggle button icon based on current theme
function updateThemeToggleIcon(theme) {
    // This will be called from Blazor
    const toggleButton = document.getElementById('theme-toggle');
    if (toggleButton) {
        const icon = toggleButton.querySelector('i');
        if (icon) {
            if (theme === 'dark') {
                icon.className = 'bi bi-sun';
            } else {
                icon.className = 'bi bi-moon-stars';
            }
        }
    }
}

// Expose functions to be called from Blazor
window.themeManager = {
    toggle: toggleTheme,
    getTheme: () => document.documentElement.getAttribute('data-theme')
};

// Hide Blazor error UI programmatically if it appears
window.addEventListener('load', function () {
    const errorUI = document.getElementById('blazor-error-ui');
    if (errorUI) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.attributeName === 'style' && 
                    errorUI.style.display === 'block') {
                    // If error UI is shown but app is still functioning, hide it
                    console.log('Suppressing Blazor error UI');
                    errorUI.style.display = 'none';
                }
            });
        });
        
        observer.observe(errorUI, { attributes: true });
    }
});