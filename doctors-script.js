// Doctors Management System
class DoctorsManager {
    constructor() {
        this.doctors = [];
        this.filteredDoctors = [];
        this.currentPage = 1;
        this.doctorsPerPage = 6;
        this.totalPages = 0;
        this.totalItems = 0;
    }

    async init() {
        await this.loadDoctors();
        this.bindEvents();
        this.renderDoctors();
        this.renderPagination();
        this.setupProfilePage();
    }

    bindEvents() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        // Filter functionality
        const filterSelect = document.getElementById('filterSelect');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.handleFilter(e.target.value);
            });
        }

        // Sort functionality
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.handleSort(e.target.value);
            });
        }

        // Doctor form submission
        const doctorForm = document.getElementById('doctorForm');
        if (doctorForm) {
            doctorForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveDoctor();
            });
        }
    }

    async loadDoctors() {
        try {
            const response = await window.apiClient.getDoctors({
                page: this.currentPage,
                limit: this.doctorsPerPage
            });
            if (response.success) {
                this.doctors = response.data.map(doctor => ({
                    id: doctor._id,
                    name: doctor.name,
                    specialty: doctor.specialization.toLowerCase(),
                    specialtyDisplay: doctor.specialization,
                    rating: doctor.ratingsSnapshot || 0,
                    experience: doctor.experience || 5,
                    age: doctor.age || 35,
                    patients: Math.floor(Math.random() * 100) + 50, // Mock patient count
                    bio: doctor.professionalSummary || 'Experienced healthcare professional',
                    description: doctor.professionalSummary || 'Dedicated healthcare provider',
                    qualifications: [
                        { type: 'Medical Degree', detail: 'MBBS - Medical School' },
                        { type: 'Specialization', detail: `${doctor.specialization} Residency` },
                        { type: 'Board Certification', detail: 'Board Certified' }
                    ]
                }));
                this.filteredDoctors = [...this.doctors];
                
                // Update pagination info
                this.totalItems = response.pagination.totalItems;
                this.totalPages = response.pagination.totalPages;
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Error loading doctors:', error);
            this.showNotification('Failed to load doctors', 'error');
            
            // Fallback to empty array
            this.doctors = [];
            this.filteredDoctors = [];
            this.totalItems = 0;
            this.totalPages = 0;
        }
    }

    async goToPage(page) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            await this.loadDoctors();
            this.renderDoctors();
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
            onclick="doctorsManager.prevPage()" ${this.currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i> Previous
        </button>`;

        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(this.totalPages, this.currentPage + 2);

        if (startPage > 1) {
            paginationHTML += `<button class="pagination-btn" onclick="doctorsManager.goToPage(1)">1</button>`;
            if (startPage > 2) {
                paginationHTML += '<span class="pagination-ellipsis">...</span>';
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `<button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                onclick="doctorsManager.goToPage(${i})">${i}</button>`;
        }

        if (endPage < this.totalPages) {
            if (endPage < this.totalPages - 1) {
                paginationHTML += '<span class="pagination-ellipsis">...</span>';
            }
            paginationHTML += `<button class="pagination-btn" onclick="doctorsManager.goToPage(${this.totalPages})">${this.totalPages}</button>`;
        }

        // Next button
        paginationHTML += `<button class="pagination-btn ${this.currentPage === this.totalPages ? 'disabled' : ''}" 
            onclick="doctorsManager.nextPage()" ${this.currentPage === this.totalPages ? 'disabled' : ''}>
            Next <i class="fas fa-chevron-right"></i>
        </button>`;

        paginationHTML += '</div>';

        // Add page info
        paginationHTML += `<div class="pagination-info">
            Showing ${(this.currentPage - 1) * this.doctorsPerPage + 1} to ${Math.min(this.currentPage * this.doctorsPerPage, this.totalItems)} of ${this.totalItems} doctors
        </div>`;

        paginationContainer.innerHTML = paginationHTML;
    }

    handleSearch(searchTerm) {
        const term = searchTerm.toLowerCase();
        this.filteredDoctors = this.doctors.filter(doctor => 
            doctor.name.toLowerCase().includes(term) ||
            doctor.specialtyDisplay.toLowerCase().includes(term) ||
            doctor.bio.toLowerCase().includes(term)
        );
        this.renderDoctors();
    }

    handleFilter(specialty) {
        if (specialty === '') {
            this.filteredDoctors = [...this.doctors];
        } else {
            this.filteredDoctors = this.doctors.filter(doctor => 
                doctor.specialty === specialty
            );
        }
        this.renderDoctors();
    }

    handleSort(sortBy) {
        switch (sortBy) {
            case 'name':
                this.filteredDoctors.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'rating':
                this.filteredDoctors.sort((a, b) => b.rating - a.rating);
                break;
            case 'experience':
                this.filteredDoctors.sort((a, b) => b.experience - a.experience);
                break;
            case 'patients':
                this.filteredDoctors.sort((a, b) => b.patients - a.patients);
                break;
        }
        this.renderDoctors();
    }

    renderDoctors() {
        const grid = document.getElementById('doctorsGrid');
        if (!grid) return;

        grid.innerHTML = '';

        this.filteredDoctors.forEach(doctor => {
            const card = this.createDoctorCard(doctor);
            grid.appendChild(card);
        });
    }

    createDoctorCard(doctor) {
        const card = document.createElement('div');
        card.className = 'doctor-card';
        card.setAttribute('data-specialty', doctor.specialty);
        card.setAttribute('data-rating', doctor.rating);
        card.setAttribute('data-experience', doctor.experience);
        card.setAttribute('data-patients', doctor.patients);

        card.innerHTML = `
            <div class="card-header">
                <div class="avatar-ring">
                    <div class="avatar">
                        <i class="fas fa-user-md"></i>
                    </div>
                </div>
            </div>
            
            <div class="card-body">
                <h3 class="doctor-name">${doctor.name}</h3>
                <p class="specialty">${doctor.specialtyDisplay}</p>
                <p class="bio">${doctor.bio}</p>
                
                <div class="patient-count">
                    <i class="fas fa-users"></i>
                    <span>${doctor.patients}+ Happy Patients</span>
                </div>
                
                <button class="view-profile-btn" onclick="viewDoctorProfile('${doctor.id}')">
                    <i class="fas fa-info-circle"></i>
                    View Profile
                </button>
            </div>
        `;

        return card;
    }

    // Modal functions
    openDoctorModal() {
        const modal = document.getElementById('doctorModal');
        const modalTitle = document.getElementById('doctorModalTitle');
        const form = document.getElementById('doctorForm');
        
        modalTitle.textContent = 'Add New Doctor';
        form.reset();
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    closeDoctorModal() {
        const modal = document.getElementById('doctorModal');
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }

    async saveDoctor() {
        try {
            const form = document.getElementById('doctorForm');
            const formData = new FormData(form);
            
            const doctorData = {
                name: formData.get('name'),
                age: parseInt(formData.get('age')),
                email: formData.get('email'),
                specialization: formData.get('specialization'),
                summary: formData.get('summary'),
                licenses: formData.get('licenses'),
                clinicalFocus: formData.get('clinicalFocus'),
                affiliations: formData.get('affiliations'),
                languages: formData.get('languages'),
                contact: formData.get('contact')
            };

            // Validate required fields
            if (!doctorData.name || !doctorData.email || !doctorData.specialization) {
                this.showNotification('Please fill in all required fields', 'error');
                return;
            }

            // Create user first (doctors need userId)
            const userResponse = await window.apiClient.createUser({
                name: doctorData.name,
                email: doctorData.email,
                phone: '555-000-0000', // Default phone
                password: 'password123', // Default password
                userType: 'doctor'
            });

            if (!userResponse.success) {
                throw new Error(userResponse.message || 'Failed to create user');
            }

            // Create doctor with userId
            const doctorResponse = await window.apiClient.createDoctor({
                ...doctorData,
                userId: userResponse.data._id
            });

            if (doctorResponse.success) {
                this.showNotification('Doctor added successfully!', 'success');
                this.closeDoctorModal();
                await this.loadDoctors();
                this.renderDoctors();
                this.renderPagination();
            } else {
                throw new Error(doctorResponse.message || 'Failed to create doctor');
            }

        } catch (error) {
            console.error('Error saving doctor:', error);
            this.showNotification('Failed to add doctor: ' + error.message, 'error');
        }
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        container.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    setupProfilePage() {
        // Check if we're on the profile page
        if (window.location.pathname.includes('doctor-profile.html')) {
            this.loadDoctorProfile();
        }
    }

    loadDoctorProfile() {
        const urlParams = new URLSearchParams(window.location.search);
        const doctorId = urlParams.get('id') || 'sarah-johnson';
        
        const doctor = this.doctors.find(d => d.id === doctorId);
        if (doctor) {
            this.populateProfilePage(doctor);
        }
    }

    populateProfilePage(doctor) {
        // Update page title
        document.title = `${doctor.name} - EC Healthcare`;
        
        // Update hero section
        const doctorName = document.getElementById('doctorName');
        if (doctorName) {
            doctorName.textContent = doctor.name;
        }

        // Update stats
        const specialty = document.getElementById('specialty');
        if (specialty) {
            specialty.textContent = doctor.specialtyDisplay;
        }

        const ageExperience = document.getElementById('ageExperience');
        if (ageExperience) {
            ageExperience.textContent = `${doctor.age} / ${doctor.experience} years`;
        }

        const rating = document.getElementById('rating');
        if (rating) {
            const stars = this.generateStars(doctor.rating);
            rating.innerHTML = stars + `<span>${doctor.rating}</span>`;
        }

        // Update description
        const descriptionBlock = document.querySelector('.content-block .block-content');
        if (descriptionBlock) {
            descriptionBlock.innerHTML = `
                <p>${doctor.description}</p>
                <p>Her expertise includes comprehensive patient care, advanced treatment protocols, and a commitment to staying updated with the latest medical advances. Dr. ${doctor.name.split(' ')[1]} is known for her compassionate approach and dedication to patient outcomes.</p>
            `;
        }

        // Update qualifications
        const qualificationsList = document.querySelector('.qualifications-list');
        if (qualificationsList) {
            qualificationsList.innerHTML = '';
            doctor.qualifications.forEach(qual => {
                const qualItem = document.createElement('div');
                qualItem.className = 'qualification-item';
                qualItem.innerHTML = `
                    <div class="qual-icon">
                        <i class="fas fa-graduation-cap"></i>
                    </div>
                    <div class="qual-content">
                        <h4 class="qual-title">${qual.type}</h4>
                        <p class="qual-detail">${qual.detail}</p>
                    </div>
                `;
                qualificationsList.appendChild(qualItem);
            });
        }
    }

    generateStars(rating) {
        let stars = '';
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;

        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }

        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }

        const emptyStars = 5 - Math.ceil(rating);
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }

        return stars;
    }
}

// Global functions for HTML onclick handlers
function viewDoctorProfile(doctorId) {
    window.location.href = `doctor-profile.html?id=${doctorId}`;
}

function goBackToDoctors() {
    window.location.href = 'doctors.html';
}

function loadMoreDoctors() {
    // In a real application, this would load more doctors from the server
    const loadMoreBtn = document.querySelector('.load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        
        setTimeout(() => {
            loadMoreBtn.innerHTML = '<i class="fas fa-chevron-down"></i> Load more';
            // Show notification that all doctors are loaded
            showNotification('All doctors loaded!', 'info');
        }, 1000);
    }
}

function contactDoctor(method) {
    const methods = {
        call: 'Call',
        chat: 'Chat',
        video: 'Video Call'
    };
    
    showNotification(`${methods[method]} feature coming soon!`, 'info');
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        background-color: ${type === 'success' ? 'var(--success-color)' : type === 'error' ? 'var(--danger-color)' : 'var(--primary-blue)'};
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

// Notify other pages about data changes
function notifyOtherPages(eventType) {
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

// Initialize the doctors manager when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize API client
    window.apiClient = new APIClient();
    
    // Initialize doctors manager
    window.doctorsManager = new DoctorsManager();
    
    // Wait for initialization to complete
    await window.doctorsManager.init();
    
    // Add CSS for notifications and animations
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
        
        .fa-spin {
            animation: fa-spin 1s infinite linear;
        }
        
        @keyframes fa-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
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
