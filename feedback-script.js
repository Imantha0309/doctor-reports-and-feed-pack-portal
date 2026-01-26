// Feedback Management System
class FeedbackManager {
    constructor() {
        this.feedbacks = [];
        this.currentPage = 1;
        this.itemsPerPage = 6;
        this.totalPages = 0;
        this.totalItems = 0;
        this.currentEditId = null;
        this.init();
    }

    async init() {
        await this.loadFeedbacks();
        this.bindEvents();
        this.renderFeedbacks();
        this.renderPagination();
        this.updateDateTime();
    }

    bindEvents() {
        // Form submission
        document.getElementById('feedbackForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveFeedback();
        });

        // Rating input handling
        const ratingInputs = document.querySelectorAll('.rating-input input[type="radio"]');
        ratingInputs.forEach(input => {
            input.addEventListener('change', this.updateRatingDisplay);
        });

        // Close modal on outside click
        document.getElementById('feedbackModal').addEventListener('click', (e) => {
            if (e.target.id === 'feedbackModal') {
                this.closeModal();
            }
        });

        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    async loadFeedbacks() {
        try {
            const response = await window.apiClient.getFeedbacks({
                page: this.currentPage,
                limit: this.itemsPerPage
            });

            if (response.success) {
                this.feedbacks = response.data.map(feedback => ({
                    id: feedback._id,
                    patientName: feedback.patientName,
                    doctor: feedback.doctor?.name || 'Unknown Doctor',
                    sickness: feedback.sickness || 'General',
                    about: feedback.about || feedback.text || 'No details provided',
                    rating: feedback.rating,
                    dateTime: feedback.date || feedback.createdAt
                }));
                
                // Update pagination info
                this.totalItems = response.pagination.totalItems;
                this.totalPages = response.pagination.totalPages;
                
                // If no feedbacks, show a friendly message instead of error
                if (this.feedbacks.length === 0) {
                    console.log('No feedbacks found - this is normal for a new system');
                }
                
                return this.feedbacks;
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Error loading feedbacks:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                response: error.response
            });
            
            // Only show error notification if it's a real error (not just empty data)
            if (error.message && !error.message.includes('No feedbacks found')) {
                const errorMessage = error.message || 'Unknown error occurred';
                this.showNotification(`Failed to load feedbacks: ${errorMessage}`, 'error');
            }
            
            // Fallback to empty array
            this.feedbacks = [];
            this.totalItems = 0;
            this.totalPages = 0;
            return [];
        }
    }

    async goToPage(page) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            await this.loadFeedbacks();
            this.renderFeedbacks();
            this.renderPagination();
        }
    }

    async nextPage() {
        if (this.currentPage < this.totalPages) {
            await this.goToPage(this.currentPage + 1);
        }
    }

    async prevPage() {
        if (this.currentPage > 1) {
            await this.goToPage(this.currentPage - 1);
        }
    }

    renderPagination() {
        const paginationContainer = document.getElementById('paginationContainer');
        if (!paginationContainer) return;

        if (this.totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let paginationHTML = '<div class="pagination">';
        
        // Previous button
        paginationHTML += `<button class="pagination-btn ${this.currentPage === 1 ? 'disabled' : ''}" 
            onclick="feedbackManager.prevPage()" ${this.currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i> Previous
        </button>`;

        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(this.totalPages, this.currentPage + 2);

        if (startPage > 1) {
            paginationHTML += `<button class="pagination-btn" onclick="feedbackManager.goToPage(1)">1</button>`;
            if (startPage > 2) {
                paginationHTML += '<span class="pagination-ellipsis">...</span>';
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `<button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                onclick="feedbackManager.goToPage(${i})">${i}</button>`;
        }

        if (endPage < this.totalPages) {
            if (endPage < this.totalPages - 1) {
                paginationHTML += '<span class="pagination-ellipsis">...</span>';
            }
            paginationHTML += `<button class="pagination-btn" onclick="feedbackManager.goToPage(${this.totalPages})">${this.totalPages}</button>`;
        }

        // Next button
        paginationHTML += `<button class="pagination-btn ${this.currentPage === this.totalPages ? 'disabled' : ''}" 
            onclick="feedbackManager.nextPage()" ${this.currentPage === this.totalPages ? 'disabled' : ''}>
            Next <i class="fas fa-chevron-right"></i>
        </button>`;

        paginationHTML += '</div>';

        // Add page info
        paginationHTML += `<div class="pagination-info">
            Showing ${(this.currentPage - 1) * this.itemsPerPage + 1} to ${Math.min(this.currentPage * this.itemsPerPage, this.totalItems)} of ${this.totalItems} feedbacks
        </div>`;

        paginationContainer.innerHTML = paginationHTML;
    }

    saveFeedbacks() {
        localStorage.setItem('ec-healthcare-feedbacks', JSON.stringify(this.feedbacks));
    }

    renderFeedbacks() {
        const container = document.getElementById('feedbackContainer');
        container.innerHTML = '';

        if (this.feedbacks.length === 0) {
            // Show friendly message when no feedbacks
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-state';
            emptyMessage.innerHTML = `
                <div class="empty-icon">
                    <i class="fas fa-comments"></i>
                </div>
                <h3>No feedbacks yet</h3>
                <p>Be the first to share your experience!</p>
                <button class="btn btn-primary" onclick="feedbackManager.openModal()">
                    <i class="fas fa-plus"></i>
                    Add First Feedback
                </button>
            `;
            container.appendChild(emptyMessage);
            return;
        }

        this.feedbacks.forEach(feedback => {
            const card = this.createFeedbackCard(feedback);
            container.appendChild(card);
        });
    }

    createFeedbackCard(feedback) {
        const card = document.createElement('div');
        card.className = 'feedback-card';
        card.setAttribute('data-id', feedback.id);

        const stars = this.generateStars(feedback.rating);
        const formattedDate = this.formatDateTime(feedback.dateTime);

        card.innerHTML = `
            <div class="card-header">
                <div class="patient-info">
                    <h3 class="patient-name">${feedback.patientName}</h3>
                    <div class="rating">
                        ${stars}
                    </div>
                </div>
                <div class="card-actions">
                    <button class="action-btn edit-btn" onclick="feedbackManager.editFeedback(${feedback.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="feedbackManager.deleteFeedback(${feedback.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            
            <div class="card-content">
                <div class="avatar-section">
                    <div class="avatar">
                        <i class="fas fa-user"></i>
                    </div>
                </div>
                
                <div class="feedback-details">
                    <div class="detail-row">
                        <span class="label">Doctor:</span>
                        <span class="value">${feedback.doctor}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Sickness:</span>
                        <span class="value">${feedback.sickness}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">About:</span>
                        <span class="value">${feedback.about}</span>
                    </div>
                </div>
            </div>
            
            <div class="card-footer">
                <span class="date-time">${formattedDate}</span>
            </div>
        `;

        return card;
    }

    generateStars(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                stars += '<i class="fas fa-star filled"></i>';
            } else {
                stars += '<i class="fas fa-star empty"></i>';
            }
        }
        return stars;
    }

    formatDateTime(dateTime) {
        const date = new Date(dateTime);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }

    openFeedbackForm(feedbackId = null) {
        const modal = document.getElementById('feedbackModal');
        const form = document.getElementById('feedbackForm');
        const title = document.getElementById('modalTitle');
        
        this.currentEditId = feedbackId;
        
        if (feedbackId) {
            // Edit mode
            const feedback = this.feedbacks.find(f => f.id === feedbackId);
            if (feedback) {
                title.textContent = 'Edit Feedback';
                this.populateForm(feedback);
            }
        } else {
            // Add mode
            title.textContent = 'Add New Feedback';
            form.reset();
            this.clearRatingDisplay();
        }
        
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Focus on first input
        setTimeout(() => {
            document.getElementById('patientName').focus();
        }, 100);
    }

    closeModal() {
        const modal = document.getElementById('feedbackModal');
        modal.classList.remove('show');
        document.body.style.overflow = '';
        this.currentEditId = null;
    }

    populateForm(feedback) {
        document.getElementById('patientName').value = feedback.patientName;
        document.getElementById('doctor').value = feedback.doctor;
        document.getElementById('sickness').value = feedback.sickness;
        document.getElementById('about').value = feedback.about;
        
        // Set rating
        const ratingInput = document.querySelector(`input[name="rating"][value="${feedback.rating}"]`);
        if (ratingInput) {
            ratingInput.checked = true;
            this.updateRatingDisplay();
        }
    }

    clearRatingDisplay() {
        const ratingLabels = document.querySelectorAll('.rating-input label');
        ratingLabels.forEach(label => {
            label.style.color = 'var(--medium-gray)';
        });
    }

    updateRatingDisplay() {
        const checkedInput = document.querySelector('input[name="rating"]:checked');
        const ratingLabels = document.querySelectorAll('.rating-input label');
        
        ratingLabels.forEach((label, index) => {
            if (checkedInput && index < parseInt(checkedInput.value)) {
                label.style.color = 'var(--warning-color)';
            } else {
                label.style.color = 'var(--medium-gray)';
            }
        });
    }

    async saveFeedback() {
        const formData = new FormData(document.getElementById('feedbackForm'));
        const feedbackData = {
            patientName: formData.get('patientName'),
            rating: parseInt(formData.get('rating')),
            doctor: formData.get('doctor'),
            sickness: formData.get('sickness'),
            about: formData.get('about')
        };

        try {
            let response;
            if (this.currentEditId) {
                // Update existing feedback
                response = await window.apiClient.updateFeedback(this.currentEditId, {
                    patientName: feedbackData.patientName,
                    doctor: feedbackData.doctor,
                    rating: feedbackData.rating,
                    about: feedbackData.about,
                    sickness: feedbackData.sickness
                });
            } else {
                // Add new feedback
                response = await window.apiClient.createFeedback({
                    patientName: feedbackData.patientName,
                    doctor: feedbackData.doctor,
                    rating: feedbackData.rating,
                    about: feedbackData.about,
                    sickness: feedbackData.sickness
                });
            }

            if (response.success) {
                this.showNotification(response.message, 'success');
                this.closeModal();
                await this.loadFeedbacks(); // Reload data from API
                this.renderFeedbacks();
                this.renderPagination();
                this.notifyOtherPages('feedbackUpdated');
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Error saving feedback:', error);
            this.showNotification('Failed to save feedback: ' + error.message, 'error');
        }
    }

    editFeedback(feedbackId) {
        this.openFeedbackForm(feedbackId);
    }

    async deleteFeedback(feedbackId) {
        if (confirm('Are you sure you want to delete this feedback?')) {
            try {
                const response = await window.apiClient.deleteFeedback(feedbackId);
                if (response.success) {
                    this.showNotification(response.message, 'success');
                    await this.loadFeedbacks(); // Reload data from API
                    this.renderFeedbacks();
                    this.renderPagination();
                    this.notifyOtherPages('feedbackDeleted');
                } else {
                    throw new Error(response.message);
                }
            } catch (error) {
                console.error('Error deleting feedback:', error);
                this.showNotification('Failed to delete feedback: ' + error.message, 'error');
            }
        }
    }

    getNextId() {
        return Math.max(...this.feedbacks.map(f => f.id), 0) + 1;
    }

    // Notify other pages about data changes
    notifyOtherPages(eventType) {
        // Dispatch custom event for same-tab updates
        window.dispatchEvent(new CustomEvent('dataUpdated', {
            detail: { type: eventType }
        }));

        // Update localStorage for cross-tab communication
        const lastUpdate = {
            timestamp: Date.now(),
            type: eventType
        };
        localStorage.setItem('ec-healthcare-last-update', JSON.stringify(lastUpdate));
    }

    updateDateTime() {
        // Update date/time display for all cards
        const dateTimeElements = document.querySelectorAll('.date-time');
        dateTimeElements.forEach(element => {
            if (element.textContent === '(Date and time)') {
                element.textContent = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            }
        });
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        notification.style.cssText = `
            position: fixed;
            top: 2rem;
            right: 2rem;
            background-color: ${type === 'success' ? 'var(--success-color)' : 'var(--primary-blue)'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-lg);
            z-index: 3000;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Global functions for HTML onclick handlers
function openFeedbackForm() {
    feedbackManager.openFeedbackForm();
}

function closeFeedbackForm() {
    feedbackManager.closeModal();
}

function editFeedback(id) {
    feedbackManager.editFeedback(id);
}

function deleteFeedback(id) {
    feedbackManager.deleteFeedback(id);
}

// Initialize the feedback manager when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize API client
    window.apiClient = new APIClient();
    
    // Initialize feedback manager
    window.feedbackManager = new FeedbackManager();
    
    // Wait for initialization to complete
    await window.feedbackManager.init();
    
    // Add CSS for notifications
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(100%);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        @keyframes slideOutRight {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(100%);
            }
        }
        
        @media (max-width: 768px) {
            .notification {
                top: 1rem !important;
                right: 1rem !important;
                left: 1rem !important;
                right: 1rem !important;
            }
        }
    `;
    document.head.appendChild(style);
});

// Add smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Only handle internal links
            if (this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                
                const targetId = this.getAttribute('href');
                const targetSection = document.querySelector(targetId);
                
                if (targetSection) {
                    const headerHeight = document.querySelector('.header').offsetHeight;
                    const targetPosition = targetSection.offsetTop - headerHeight;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
});
