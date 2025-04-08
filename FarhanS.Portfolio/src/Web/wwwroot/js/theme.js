/**
 * Theme handling functionality for FarhanS.Portfolio
 * Implements Apple's best practices for dark mode
 */

// Initialize theme from local storage or system preference
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    initializeAnimations();
});

function initializeTheme() {
    // Check if user has previously selected a theme
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
        // Apply saved theme
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeToggleIcon(savedTheme);
    } else {
        // Make dark mode the default, but still check system preference as a fallback
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        // Default to dark mode regardless of system preference
        const theme = 'dark';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme); // Save default theme
        updateThemeToggleIcon(theme);
    }
    
    // Apply a data attribute to the body for transitions
    document.body.classList.add('theme-transition');
    setTimeout(() => {
        document.body.classList.remove('theme-transition');
    }, 500);
}

// Function to toggle between light and dark themes
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // Add transition class for smooth color changes
    document.body.classList.add('theme-transition');
    
    // Update theme
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update toggle button icon
    updateThemeToggleIcon(newTheme);
    
    // Remove transition class after transition completes
    setTimeout(() => {
        document.body.classList.remove('theme-transition');
    }, 500);
}

// Update the theme toggle button icon based on current theme
function updateThemeToggleIcon(theme) {
    const themeIcons = document.querySelectorAll('.theme-btn i');
    themeIcons.forEach(icon => {
        if (theme === 'dark') {
            // Sun icon when in dark mode (indicating switching to light)
            icon.className = 'bi bi-sun';
            icon.setAttribute('title', 'Switch to light mode');
        } else {
            // Moon icon when in light mode (indicating switching to dark)
            icon.className = 'bi bi-moon-stars';
            icon.setAttribute('title', 'Switch to dark mode');
        }
    });
}

// Initialize animations for skills and other elements
function initializeAnimations() {
    // Set animation order for skill cards
    const skillCards = document.querySelectorAll('.skill-card');
    skillCards.forEach((card, index) => {
        card.style.setProperty('--animation-order', index);
    });
    
    // Initialize Intersection Observer for animation on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe elements that should animate on scroll
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });
}

// Listen for system color scheme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!localStorage.getItem('theme')) {
        // Only update automatically if user hasn't manually set a preference
        const newTheme = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        updateThemeToggleIcon(newTheme);
    }
});

// Expose functions to be called from Blazor
window.themeManager = {
    toggle: toggleTheme,
    getTheme: () => document.documentElement.getAttribute('data-theme'),
    // New method to allow checking theme from Blazor
    isDarkMode: () => document.documentElement.getAttribute('data-theme') === 'dark'
};

// Smooth scroll for navigation links
document.addEventListener('click', function(e) {
    const link = e.target.closest('a[href^="#"]');
    if (link) {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            const headerHeight = document.querySelector('.main-header').offsetHeight;
            const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
            
            // Close mobile menu if open
            const navMenu = document.querySelector('.nav-scrollable');
            if (navMenu && !navMenu.classList.contains('collapse')) {
                const navbarToggle = document.querySelector('.navbar-toggler');
                if (navbarToggle) {
                    navbarToggle.click();
                }
            }
        }
    }
});

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