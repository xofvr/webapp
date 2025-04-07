/**
 * Theme handling functionality for FarhanS.Portfolio
 */

// Theme toggling functionality
window.initializeTheme = function() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
};

window.toggleTheme = function() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
};

function updateThemeIcon(theme) {
    const iconElement = document.querySelector('#theme-toggle i');
    if (iconElement) {
        if (theme === 'dark') {
            iconElement.classList.remove('bi-moon-stars');
            iconElement.classList.add('bi-sun');
        } else {
            iconElement.classList.remove('bi-sun');
            iconElement.classList.add('bi-moon-stars');
        }
    }
}

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