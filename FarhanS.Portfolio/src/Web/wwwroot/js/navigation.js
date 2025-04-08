/**
 * Navigation utilities for FarhanS.Portfolio
 */

// Handle smooth scrolling for navigation links
function initializeSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Add a small delay to allow any UI updates to complete
                setTimeout(() => {
                    const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 0;
                    const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
                    
                    window.scrollTo({
                        top: targetPosition - navbarHeight - 20, // Extra padding
                        behavior: 'smooth'
                    });
                    
                    // Close mobile nav menu if open
                    if (window.innerWidth < 992) {
                        const navbarCollapse = document.querySelector('.navbar-collapse');
                        if (navbarCollapse && !navbarCollapse.classList.contains('collapse')) {
                            // Find a way to notify Blazor component to toggle menu
                            if (window.DotNet) {
                                DotNet.invokeMethodAsync('FarhanS.Portfolio', 'HandleScreenSizeChange', true);
                            }
                        }
                    }
                    
                    // Update URL hash without scrolling
                    history.pushState(null, null, targetId);
                }, 10);
            }
        });
    });
    
    // Handle external page load with hash
    if (window.location.hash) {
        setTimeout(() => {
            const targetElement = document.querySelector(window.location.hash);
            if (targetElement) {
                const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 0;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
                
                window.scrollTo({
                    top: targetPosition - navbarHeight - 20,
                    behavior: 'smooth'
                });
            }
        }, 500); // Longer delay to ensure page is fully loaded
    }
}

// Explicitly handle section scrolling from Blazor component
function scrollToSection(sectionId) {
    if (!sectionId || sectionId === '#') return;
    
    const targetElement = document.querySelector(sectionId);
    if (targetElement) {
        // Small delay to allow any UI updates to complete
        setTimeout(() => {
            const headerHeight = document.querySelector('.navbar-container')?.offsetHeight || 0;
            const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
            
            window.scrollTo({
                top: targetPosition - headerHeight - 20, // Extra padding for better visibility
                behavior: 'smooth'
            });
            
            // Update URL hash without causing additional scrolling
            history.pushState(null, null, sectionId);
        }, 10);
    }
}

// Track section visibility for navigation highlighting
function registerIntersectionObservers() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    
    if (sections.length > 0 && navLinks.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Find matching nav link and add active class
                    const id = entry.target.getAttribute('id');
                    navLinks.forEach(link => {
                        if (link.getAttribute('href') === `#${id}`) {
                            link.classList.add('active');
                        } else {
                            link.classList.remove('active');
                        }
                    });
                }
            });
        }, { threshold: 0.3 });
        
        sections.forEach(section => {
            observer.observe(section);
        });
    }
}

// Manually add toggle animation to the navbar
function setupNavbarAnimation() {
    // Watch for show/hide state changes and add animation
    const navbarCollapse = document.getElementById('navbarNav');
    if (!navbarCollapse) return;
    
    // Set up a mutation observer to detect class changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
                const isShowing = navbarCollapse.classList.contains('show');
                if (isShowing) {
                    // Apply animation for showing
                    navbarCollapse.style.animation = 'slideDown 0.3s ease forwards';
                } 
            }
        });
    });
    
    observer.observe(navbarCollapse, { attributes: true });
    
    // Add click listener to body for closing menu on click outside
    document.addEventListener('click', (e) => {
        if (window.innerWidth < 992 && 
            navbarCollapse && 
            !navbarCollapse.classList.contains('collapse') && 
            !navbarCollapse.contains(e.target) && 
            !e.target.closest('.navbar-toggler')) {
            
            // Close menu on click outside
            if (window.DotNet) {
                DotNet.invokeMethodAsync('FarhanS.Portfolio', 'HandleScreenSizeChange', true);
            }
        }
    });
}

// Expose functions to Blazor
window.navigationManager = {
    initializeSmoothScroll: initializeSmoothScroll,
    registerIntersectionObservers: registerIntersectionObservers,
    setupNavbarAnimation: setupNavbarAnimation
};

// Add the new scrollToSection function to window for direct calling from Blazor
window.scrollToSection = scrollToSection;

// Initialize after document load
document.addEventListener('DOMContentLoaded', function() {
    setupNavbarAnimation();
});