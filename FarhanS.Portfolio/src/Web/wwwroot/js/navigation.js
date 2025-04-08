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
                    const navbarToggler = document.querySelector('.navbar-toggler');
                    const navbarCollapse = document.querySelector('.navbar-collapse');
                    if (navbarToggler && !navbarToggler.classList.contains('collapsed') && navbarCollapse) {
                        navbarToggler.click();
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

// Track section visibility for navigation highlighting
window.registerIntersectionObservers = function() {
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
};

// Expose functions to Blazor
window.navigationManager = {
    initializeSmoothScroll: initializeSmoothScroll
};