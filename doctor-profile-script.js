// EC Healthcare Doctor Profile Management
class DoctorProfileManager {
    constructor() {
        this.currentDoctorId = null;
        this.profileImage = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupSidebar();
        this.loadDoctorData();
    }

    bindEvents() {
        // Form submission
        const form = document.getElementById('doctorProfileForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveDoctorProfile();
            });
        }

        // Real-time validation
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
            
            input.addEventListener('input', () => {
                this.clearFieldError(input);
            });
        });

        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            const sidebar = document.getElementById('sidebar');
            const sidebarToggle = document.getElementById('sidebarToggle');
            
            if (window.innerWidth <= 768 && 
                !sidebar.contains(e.target) && 
                !sidebarToggle.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });

        // Window resize handler
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveDoctorProfile();
            }
        });
    }

    setupSidebar() {
        const sidebar = document.getElementById('sidebar');
        const sidebarToggle = document.getElementById('sidebarToggle');
        
        if (window.innerWidth <= 768) {
            sidebar.classList.add('collapsed');
            sidebarToggle.style.display = 'flex';
        }
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('open');
    }

    handleResize() {
        const sidebar = document.getElementById('sidebar');
        const sidebarToggle = document.getElementById('sidebarToggle');
        
        if (window.innerWidth <= 768) {
            sidebar.classList.add('collapsed');
            sidebarToggle.style.display = 'flex';
            sidebar.classList.remove('open');
        } else {
            sidebar.classList.remove('collapsed', 'open');
            sidebarToggle.style.display = 'none';
        }
    }

    loadDoctorData() {
        // Check if we're editing an existing doctor
        const urlParams = new URLSearchParams(window.location.search);
        const doctorId = urlParams.get('id');
        
        if (doctorId) {
            this.currentDoctorId = doctorId;
            this.loadExistingDoctor(doctorId);
        } else {
            this.updatePageTitle('Add Doctor Profile');
        }
    }

    async loadExistingDoctor(doctorId) {
        try {
            // Simulate API call - replace with actual endpoint
            const doctor = await this.fetchDoctor(doctorId);
            
            if (doctor) {
                this.populateForm(doctor);
                this.updatePageTitle(`Edit Doctor Profile - ${doctor.name}`);
            } else {
                this.showToast('Doctor not found', 'error');
                this.goBack();
            }
        } catch (error) {
            console.error('Error loading doctor:', error);
            this.showToast('Failed to load doctor data', 'error');
        }
    }

    async fetchDoctor(doctorId) {
        // Mock data - replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockDoctors = {
            '1': {
                id: 1,
                name: 'Dr. Sarah Johnson',
                age: 35,
                email: 'sarah.johnson@echealthcare.com',
                specialization: 'cardiology',
                summary: 'Experienced cardiologist with over 10 years of practice in interventional cardiology.',
                licenses: 'Medical Council Number: MC12345\nNPI: 1234567890\nLicense Status: Active (Expires: 2025-12-31)',
                clinicalFocus: 'Interventional cardiology, heart failure management, preventive cardiology. Treats patients aged 18+.',
                affiliations: 'EC Healthcare Hospital - Cardiology Department\nCity Medical Center - Consultant Cardiologist',
                languages: 'English (Native), Spanish (Fluent), French (Conversational)',
                contact: 'Clinic Hours: Mon-Fri 9AM-5PM\nLocation: EC Healthcare Hospital, Cardiology Wing\nTelemedicine: Available for follow-ups',
                ratings: '4.8/5.0 (127 reviews)',
                profileImage: null
            },
            '2': {
                id: 2,
                name: 'Dr. Michael Chen',
                age: 42,
                email: 'michael.chen@echealthcare.com',
                specialization: 'neurology',
                summary: 'Board-certified neurologist specializing in movement disorders and epilepsy.',
                licenses: 'Medical Council Number: MC67890\nNPI: 0987654321\nLicense Status: Active (Expires: 2026-03-15)',
                clinicalFocus: 'Movement disorders, epilepsy, multiple sclerosis. Treats patients aged 16+.',
                affiliations: 'EC Healthcare Hospital - Neurology Department\nRegional Neurological Institute - Senior Consultant',
                languages: 'English (Native), Mandarin (Fluent), Japanese (Conversational)',
                contact: 'Clinic Hours: Tue-Thu 8AM-4PM\nLocation: EC Healthcare Hospital, Neurology Wing\nTelemedicine: Available for consultations',
                ratings: '4.9/5.0 (89 reviews)',
                profileImage: null
            }
        };
        
        return mockDoctors[doctorId] || null;
    }

    populateForm(doctor) {
        document.getElementById('doctorName').value = doctor.name;
        document.getElementById('age').value = doctor.age;
        document.getElementById('email').value = doctor.email;
        document.getElementById('specialization').value = doctor.specialization;
        document.getElementById('summary').value = doctor.summary;
        document.getElementById('licenses').value = doctor.licenses;
        document.getElementById('clinicalFocus').value = doctor.clinicalFocus;
        document.getElementById('affiliations').value = doctor.affiliations;
        document.getElementById('languages').value = doctor.languages;
        document.getElementById('contact').value = doctor.contact;
        document.getElementById('ratings').value = doctor.ratings;
        
        if (doctor.profileImage) {
            this.displayImage(doctor.profileImage);
        }
    }

    updatePageTitle(title) {
        document.title = `${title} - EC Healthcare`;
        const profileTitle = document.querySelector('.profile-title');
        if (profileTitle) {
            profileTitle.textContent = title;
        }
    }

    validateField(field) {
        const fieldName = field.name;
        const value = field.value.trim();
        
        this.clearFieldError(field);
        
        switch (fieldName) {
            case 'doctorName':
                if (!value) {
                    this.showFieldError(field, 'Doctor name is required');
                    return false;
                }
                if (value.length < 2) {
                    this.showFieldError(field, 'Doctor name must be at least 2 characters');
                    return false;
                }
                break;
                
            case 'age':
                if (!value) {
                    this.showFieldError(field, 'Age is required');
                    return false;
                }
                const age = parseInt(value);
                if (isNaN(age) || age < 25 || age > 80) {
                    this.showFieldError(field, 'Age must be between 25 and 80');
                    return false;
                }
                break;
                
            case 'email':
                if (!value) {
                    this.showFieldError(field, 'Email is required');
                    return false;
                }
                if (!this.isValidEmail(value)) {
                    this.showFieldError(field, 'Please enter a valid email address');
                    return false;
                }
                break;
                
            case 'specialization':
                if (!value) {
                    this.showFieldError(field, 'Specialization is required');
                    return false;
                }
                break;
                
            case 'summary':
                if (!value) {
                    this.showFieldError(field, 'Professional summary is required');
                    return false;
                }
                if (value.length < 50) {
                    this.showFieldError(field, 'Professional summary must be at least 50 characters');
                    return false;
                }
                break;
                
            case 'licenses':
                if (!value) {
                    this.showFieldError(field, 'Licenses/Registrations information is required');
                    return false;
                }
                break;
                
            case 'clinicalFocus':
                if (!value) {
                    this.showFieldError(field, 'Clinical focus is required');
                    return false;
                }
                break;
                
            case 'affiliations':
                if (!value) {
                    this.showFieldError(field, 'Hospital/Clinic affiliations are required');
                    return false;
                }
                break;
                
            case 'languages':
                if (!value) {
                    this.showFieldError(field, 'Languages are required');
                    return false;
                }
                break;
                
            case 'contact':
                if (!value) {
                    this.showFieldError(field, 'Contact & availability information is required');
                    return false;
                }
                break;
        }
        
        return true;
    }

    showFieldError(field, message) {
        field.classList.add('error');
        const errorElement = document.getElementById(field.name + 'Error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    clearFieldError(field) {
        field.classList.remove('error');
        const errorElement = document.getElementById(field.name + 'Error');
        if (errorElement) {
            errorElement.classList.remove('show');
            errorElement.textContent = '';
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validateForm() {
        const fields = [
            'doctorName', 'age', 'email', 'specialization', 'summary',
            'licenses', 'clinicalFocus', 'affiliations', 'languages', 'contact'
        ];
        
        let isValid = true;
        
        fields.forEach(fieldName => {
            const field = document.getElementById(fieldName);
            if (field && !this.validateField(field)) {
                isValid = false;
            }
        });
        
        return isValid;
    }

    async saveDoctorProfile() {
        if (!this.validateForm()) {
            this.showToast('Please fix the errors before saving', 'error');
            return;
        }
        
        const formData = this.collectFormData();
        
        try {
            // Show loading state
            this.setLoadingState(true);
            
            if (this.currentDoctorId) {
                await this.updateDoctor(this.currentDoctorId, formData);
                this.showToast('Doctor profile updated successfully!', 'success');
            } else {
                await this.createDoctor(formData);
                this.showToast('Doctor profile created successfully!', 'success');
            }
            
            // Redirect to doctors list after successful save
            setTimeout(() => {
                window.location.href = 'doctors.html';
            }, 1500);
            
        } catch (error) {
            console.error('Error saving doctor:', error);
            this.showToast('Failed to save doctor profile', 'error');
        } finally {
            this.setLoadingState(false);
        }
    }

    collectFormData() {
        return {
            name: document.getElementById('doctorName').value.trim(),
            age: parseInt(document.getElementById('age').value),
            email: document.getElementById('email').value.trim(),
            specialization: document.getElementById('specialization').value,
            summary: document.getElementById('summary').value.trim(),
            licenses: document.getElementById('licenses').value.trim(),
            clinicalFocus: document.getElementById('clinicalFocus').value.trim(),
            affiliations: document.getElementById('affiliations').value.trim(),
            languages: document.getElementById('languages').value.trim(),
            contact: document.getElementById('contact').value.trim(),
            profileImage: this.profileImage
        };
    }

    async createDoctor(doctorData) {
        // Simulate API call - replace with actual endpoint
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('Creating doctor:', doctorData);
        // POST /api/doctors
    }

    async updateDoctor(doctorId, doctorData) {
        // Simulate API call - replace with actual endpoint
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('Updating doctor:', doctorId, doctorData);
        // PUT /api/doctors/{id}
    }

    setLoadingState(loading) {
        const saveBtn = document.querySelector('.btn-primary');
        if (saveBtn) {
            if (loading) {
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            } else {
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Profile';
            }
        }
    }

    // Image upload functionality
    handleImageUpload(event) {
        const file = event.target.files[0];
        
        if (!file) return;
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showToast('Please select a valid image file', 'error');
            return;
        }
        
        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            this.showToast('Image size must be less than 5MB', 'error');
            return;
        }
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            this.displayImage(e.target.result);
            this.profileImage = file;
        };
        reader.readAsDataURL(file);
    }

    displayImage(imageSrc) {
        const previewImg = document.getElementById('previewImg');
        const placeholderImage = document.querySelector('.placeholder-image');
        const removeBtn = document.getElementById('removeImageBtn');
        
        previewImg.src = imageSrc;
        previewImg.style.display = 'block';
        placeholderImage.style.display = 'none';
        removeBtn.style.display = 'flex';
    }

    removeImage() {
        const previewImg = document.getElementById('previewImg');
        const placeholderImage = document.querySelector('.placeholder-image');
        const removeBtn = document.getElementById('removeImageBtn');
        const fileInput = document.getElementById('profileImage');
        
        previewImg.style.display = 'none';
        previewImg.src = '';
        placeholderImage.style.display = 'flex';
        removeBtn.style.display = 'none';
        fileInput.value = '';
        this.profileImage = null;
    }

    // Navigation functions
    goBack() {
        window.location.href = 'doctors.html';
    }

    // Toast notifications
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            ${message}
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// Global functions for HTML onclick handlers
function navigateToSection(section) {
    switch (section) {
        case 'dashboard':
            window.location.href = 'dashboard.html';
            break;
        case 'feedback':
            window.location.href = 'feedback.html';
            break;
        case 'doctors':
            window.location.href = 'doctors.html';
            break;
    }
}

function saveDoctorProfile() {
    window.doctorProfileManager.saveDoctorProfile();
}

function handleImageUpload(event) {
    window.doctorProfileManager.handleImageUpload(event);
}

function removeImage() {
    window.doctorProfileManager.removeImage();
}

function goBack() {
    window.doctorProfileManager.goBack();
}

// Initialize the doctor profile manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.doctorProfileManager = new DoctorProfileManager();
});

// Add CSS for slideOutRight animation
const style = document.createElement('style');
style.textContent = `
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
`;
document.head.appendChild(style);
