// Smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', function() {
    // Get all navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Add click event listeners to navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetHref = this.getAttribute('href');
            
            // Add visual feedback for button click
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
            
            // Check if it's an internal section link (starts with #)
            if (targetHref.startsWith('#')) {
                e.preventDefault();
                
                // Get the target section ID
                const targetSection = document.querySelector(targetHref);
                
                if (targetSection) {
                    // Calculate the offset to account for fixed header
                    const headerHeight = document.querySelector('.header').offsetHeight;
                    const targetPosition = targetSection.offsetTop - headerHeight;
                    
                    // Smooth scroll to the target section
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                    
                    // Update active navigation link
                    updateActiveNavLink(this);
                }
            } else {
                // For external page links, add loading state
                this.classList.add('loading');
                this.style.pointerEvents = 'none';
                
                // Reset after a short delay (in case navigation is slow)
                setTimeout(() => {
                    this.classList.remove('loading');
                    this.style.pointerEvents = '';
                }, 1000);
            }
        });
    });
    
    // Update active navigation link based on scroll position
    window.addEventListener('scroll', function() {
        const sections = document.querySelectorAll('section[id]');
        const headerHeight = document.querySelector('.header').offsetHeight;
        
        let currentSection = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - headerHeight - 100;
            const sectionHeight = section.offsetHeight;
            
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                currentSection = section.getAttribute('id');
            }
        });
        
        // Update active nav link
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    });
    
    // Function to update active navigation link
    function updateActiveNavLink(activeLink) {
        navLinks.forEach(link => {
            link.classList.remove('active');
        });
        activeLink.classList.add('active');
    }
    
    // Load recent feedbacks on landing page
    loadRecentFeedbacks();
    
    // Add intersection observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe feature cards and testimonial cards
    const animatedElements = document.querySelectorAll('.feature-card, .testimonial-card');
    animatedElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(element);
    });
    
    // Add hover effects for cards
    const cards = document.querySelectorAll('.feature-card, .testimonial-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Add loading animation for images
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.addEventListener('load', function() {
            this.style.opacity = '1';
        });
        
        // Set initial opacity to 0 for smooth loading
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease';
    });
    
    // Add keyboard navigation support
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            // Add focus styles for keyboard navigation
            const focusedElement = document.activeElement;
            if (focusedElement.classList.contains('nav-link')) {
                focusedElement.style.outline = '2px solid #3b82f6';
                focusedElement.style.outlineOffset = '2px';
            }
        }
        
        // Add Enter key support for navigation
        if (e.key === 'Enter' && document.activeElement.classList.contains('nav-link')) {
            document.activeElement.click();
        }
    });
    
    // Remove focus styles on mouse click
    document.addEventListener('mousedown', function() {
        const focusedElement = document.activeElement;
        if (focusedElement.classList.contains('nav-link')) {
            focusedElement.style.outline = 'none';
        }
    });
    
    // Add touch support for mobile devices
    navLinks.forEach(link => {
        link.addEventListener('touchstart', function(e) {
            this.style.transform = 'scale(0.95)';
            this.style.opacity = '0.8';
        });
        
        link.addEventListener('touchend', function(e) {
            setTimeout(() => {
                this.style.transform = '';
                this.style.opacity = '';
            }, 150);
        });
    });
    
    // Add scroll-to-top functionality (optional)
    const scrollToTopBtn = document.createElement('button');
    scrollToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    scrollToTopBtn.className = 'scroll-to-top';
    scrollToTopBtn.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        width: 3rem;
        height: 3rem;
        background-color: var(--primary-blue);
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        z-index: 1000;
        box-shadow: var(--shadow-lg);
    `;
    
    document.body.appendChild(scrollToTopBtn);
    
    // Show/hide scroll-to-top button
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            scrollToTopBtn.style.opacity = '1';
            scrollToTopBtn.style.visibility = 'visible';
        } else {
            scrollToTopBtn.style.opacity = '0';
            scrollToTopBtn.style.visibility = 'hidden';
        }
    });
    
    // Scroll to top functionality
    scrollToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // Add hover effect to scroll-to-top button
    scrollToTopBtn.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.1)';
        this.style.backgroundColor = 'var(--dark-blue)';
    });
    
    scrollToTopBtn.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
        this.style.backgroundColor = 'var(--primary-blue)';
    });
});

// Function to load recent feedbacks on landing page
async function loadRecentFeedbacks() {
    const container = document.getElementById('recentFeedbacks');
    if (!container) return;
    
    try {
        const response = await window.apiClient.getRecentFeedbacks(3);
        if (response.success) {
            const recentFeedbacks = response.data.slice(0, 3).reverse(); // Show only 3 most recent
            
            container.innerHTML = '';
            
            recentFeedbacks.forEach(feedback => {
                const card = createFeedbackPreviewCard(feedback);
                container.appendChild(card);
            });
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error loading recent feedbacks:', error);
        // Fallback to empty container
        container.innerHTML = '<p>No recent feedbacks available</p>';
    }
}

// Function to create feedback preview card
function createFeedbackPreviewCard(feedback) {
    const card = document.createElement('div');
    card.className = 'feedback-preview-card';
    
    const stars = generateStars(feedback.rating);
    const formattedDate = formatDateTime(feedback.dateTime);
    
    card.innerHTML = `
        <div class="feedback-preview-header">
            <div class="feedback-preview-info">
                <h3 class="feedback-preview-name">${feedback.patientName}</h3>
                <div class="feedback-preview-rating">
                    ${stars}
                </div>
            </div>
        </div>
        
        <div class="feedback-preview-content">
            <div class="feedback-preview-avatar">
                <i class="fas fa-user"></i>
            </div>
            
            <div class="feedback-preview-details">
                <div class="feedback-preview-doctor">${feedback.doctor}</div>
                <div class="feedback-preview-about">${feedback.about}</div>
            </div>
        </div>
        
        <div class="feedback-preview-footer">
            <span class="feedback-preview-date">${formattedDate}</span>
        </div>
    `;
    
    return card;
}

// Helper functions
function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fas fa-star"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    return stars;
}

function formatDateTime(dateTime) {
    const date = new Date(dateTime);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

// Listen for data updates from other pages
window.addEventListener('dataUpdated', function(e) {
    if (e.detail.type === 'feedbackUpdated' || e.detail.type === 'feedbackDeleted') {
        loadRecentFeedbacks();
    }
});

// Listen for storage changes to update feedbacks when they're added from feedback page
window.addEventListener('storage', function(e) {
    if (e.key === 'ec-healthcare-last-update') {
        const update = JSON.parse(e.newValue);
        if (update.type === 'feedbackUpdated' || update.type === 'feedbackDeleted') {
            loadRecentFeedbacks();
        }
    }
});

// Also listen for custom events (for same-tab updates)
window.addEventListener('feedbacksUpdated', function() {
    loadRecentFeedbacks();
});

// Add CSS for scroll-to-top button
const style = document.createElement('style');
style.textContent = `
    .scroll-to-top:hover {
        transform: scale(1.1) !important;
        background-color: var(--dark-blue) !important;
    }
    
    @media (max-width: 768px) {
        .scroll-to-top {
            bottom: 1rem !important;
            right: 1rem !important;
            width: 2.5rem !important;
            height: 2.5rem !important;
        }
    }
`;
document.head.appendChild(style);
