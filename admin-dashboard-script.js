// Admin Dashboard Management System
class AdminDashboard {
    constructor() {
        this.currentSection = 'dashboard';
        this.feedbacks = [];
        this.reports = [];
        this.doctors = [];
        this.currentEditId = null;
        this.currentEditType = null;
        this.deleteCallback = null;
        
        // Pagination settings
        this.feedbackPage = 1;
        this.reportPage = 1;
        this.itemsPerPage = 10;
        
        // Sorting settings
        this.feedbackSort = { column: 'id', direction: 'asc' };
        this.reportSort = { column: 'id', direction: 'asc' };
        
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadDashboardData();
        await this.loadFeedbacks();
        await this.loadReports();
        await this.loadDoctors();
        this.setupSidebar();
    }

    bindEvents() {
        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }

        // Global search
        const globalSearch = document.getElementById('globalSearch');
        if (globalSearch) {
            globalSearch.addEventListener('input', (e) => {
                this.handleGlobalSearch(e.target.value);
            });
        }

        // Close modals on outside click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });

        // Close modals on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    setupSidebar() {
        const sidebar = document.getElementById('sidebar');
        const sidebarToggle = document.getElementById('sidebarToggle');
        
        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && 
                !sidebar.contains(e.target) && 
                !sidebarToggle.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                sidebar.classList.remove('open');
            }
        });
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('open');
    }

    // Section Management
    showSection(section) {
        // Update active navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.classList.remove('active');
        });
        
        document.querySelector(`[onclick="showSection('${section}')"]`).classList.add('active');
        
        // Show/hide sections
        document.querySelectorAll('.content-section').forEach(sec => {
            sec.classList.remove('active');
        });
        document.getElementById(`${section}-section`).classList.add('active');
        
        this.currentSection = section;
    }

    // Dashboard Data Loading
    async loadDashboardData() {
        try {
            const [users, doctors, reports, feedbacks] = await Promise.all([
                window.apiClient.getUserCount(),
                window.apiClient.getUserCount('doctor'),
                window.apiClient.getReportCount(),
                window.apiClient.getFeedbackCount()
            ]);

            document.getElementById('totalUsers').textContent = users.count || 0;
            document.getElementById('totalDoctors').textContent = doctors.count || 0;
            document.getElementById('totalReports').textContent = reports.count || 0;
            document.getElementById('totalFeedbacks').textContent = feedbacks.count || 0;

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            // Set fallback values
            document.getElementById('totalUsers').textContent = '0';
            document.getElementById('totalDoctors').textContent = '0';
            document.getElementById('totalReports').textContent = '0';
            document.getElementById('totalFeedbacks').textContent = '0';
        }
    }

    // Load Doctors for dropdowns
    async loadDoctors() {
        try {
            const response = await window.apiClient.getDoctors();
            if (response.success) {
                this.doctors = response.data;
                this.populateDoctorDropdowns();
            }
        } catch (error) {
            console.error('Error loading doctors:', error);
        }
    }

    populateDoctorDropdowns() {
        const doctorSelects = [
            'feedbackDoctorName',
            'doctorFilter'
        ];

        doctorSelects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                // Clear existing options except first
                select.innerHTML = selectId === 'doctorFilter' ? '<option value="">All Doctors</option>' : '<option value="">Select Doctor</option>';
                
                this.doctors.forEach(doctor => {
                    const option = document.createElement('option');
                    option.value = doctor.name;
                    option.textContent = doctor.name;
                    select.appendChild(option);
                });
            }
        });
    }

    // Feedbacks Management
    async loadFeedbacks() {
        try {
            const response = await window.apiClient.getFeedbacks();
            if (response.success) {
                this.feedbacks = response.data.map(feedback => ({
                    id: feedback._id,
                    userName: feedback.patientName,
                    doctorName: feedback.doctor?.name || 'Unknown Doctor',
                    rating: feedback.rating,
                    date: feedback.date || feedback.createdAt,
                    comments: feedback.text || feedback.about
                }));
                this.renderFeedbacks();
            }
        } catch (error) {
            console.error('Error loading feedbacks:', error);
            this.showToast('Failed to load feedbacks', 'error');
        }
    }

    renderFeedbacks() {
        const tbody = document.getElementById('feedbacksTableBody');
        const filteredFeedbacks = this.getFilteredFeedbacks();
        const sortedFeedbacks = this.getSortedFeedbacks(filteredFeedbacks, 'feedback');
        const paginatedFeedbacks = this.getPaginatedData(sortedFeedbacks, this.feedbackPage, 'feedback');

        tbody.innerHTML = '';

        paginatedFeedbacks.forEach(feedback => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${feedback.id}</td>
                <td>${feedback.userName}</td>
                <td>${feedback.doctorName}</td>
                <td>${this.generateStars(feedback.rating)}</td>
                <td>${this.formatDate(feedback.date)}</td>
                <td class="comments-cell">${this.truncateText(feedback.comments, 50)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-success btn-sm" onclick="adminDashboard.editFeedback('${feedback.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="adminDashboard.deleteFeedback('${feedback.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });

        this.updatePagination('feedback', filteredFeedbacks.length);
    }

    // Reports Management
    async loadReports() {
        try {
            const response = await window.apiClient.getReports();
            if (response.success) {
                this.reports = response.data.map(report => ({
                    id: report._id,
                    doctorName: report.doctor?.name || 'Unknown Doctor',
                    specialization: report.doctor?.specialization || 'General',
                    date: report.dateTime || report.createdAt,
                    summary: report.summary
                }));
                this.renderReports();
            }
        } catch (error) {
            console.error('Error loading reports:', error);
            this.showToast('Failed to load reports', 'error');
        }
    }

    renderReports() {
        const tbody = document.getElementById('reportsTableBody');
        const filteredReports = this.getFilteredReports();
        const sortedReports = this.getSortedFeedbacks(filteredReports, 'report');
        const paginatedReports = this.getPaginatedData(sortedReports, this.reportPage, 'report');

        tbody.innerHTML = '';

        paginatedReports.forEach(report => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${report.id}</td>
                <td>${report.doctorName}</td>
                <td>${report.specialization}</td>
                <td>${this.formatDate(report.date)}</td>
                <td class="comments-cell">${this.truncateText(report.summary, 50)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-info btn-sm" onclick="adminDashboard.viewReport('${report.id}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="btn btn-success btn-sm" onclick="adminDashboard.editReport('${report.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="adminDashboard.deleteReport('${report.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });

        this.updatePagination('report', filteredReports.length);
    }

    // Filtering Functions
    getFilteredFeedbacks() {
        const searchTerm = document.getElementById('feedbackSearch')?.value.toLowerCase() || '';
        const doctorFilter = document.getElementById('doctorFilter')?.value || '';
        const ratingFilter = document.getElementById('ratingFilter')?.value || '';
        const dateFilter = document.getElementById('dateFilter')?.value || '';

        return this.feedbacks.filter(feedback => {
            const matchesSearch = !searchTerm || 
                feedback.userName.toLowerCase().includes(searchTerm) ||
                feedback.doctorName.toLowerCase().includes(searchTerm) ||
                feedback.comments.toLowerCase().includes(searchTerm);

            const matchesDoctor = !doctorFilter || feedback.doctorName === doctorFilter;
            const matchesRating = !ratingFilter || feedback.rating.toString() === ratingFilter;
            const matchesDate = !dateFilter || this.formatDate(feedback.date) === this.formatDate(dateFilter);

            return matchesSearch && matchesDoctor && matchesRating && matchesDate;
        });
    }

    getFilteredReports() {
        const searchTerm = document.getElementById('reportSearch')?.value.toLowerCase() || '';
        const specializationFilter = document.getElementById('specializationFilter')?.value || '';
        const dateFilter = document.getElementById('reportDateFilter')?.value || '';

        return this.reports.filter(report => {
            const matchesSearch = !searchTerm || 
                report.doctorName.toLowerCase().includes(searchTerm) ||
                report.specialization.toLowerCase().includes(searchTerm) ||
                report.summary.toLowerCase().includes(searchTerm);

            const matchesSpecialization = !specializationFilter || report.specialization === specializationFilter;
            const matchesDate = !dateFilter || this.formatDate(report.date) === this.formatDate(dateFilter);

            return matchesSearch && matchesSpecialization && matchesDate;
        });
    }

    // Sorting Functions
    getSortedFeedbacks(data, type) {
        const sort = type === 'feedback' ? this.feedbackSort : this.reportSort;
        
        return [...data].sort((a, b) => {
            let aVal = a[sort.column];
            let bVal = b[sort.column];

            if (sort.column === 'date') {
                aVal = new Date(aVal);
                bVal = new Date(bVal);
            } else if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }

            if (sort.direction === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
    }

    // Pagination Functions
    getPaginatedData(data, page, type) {
        const startIndex = (page - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return data.slice(startIndex, endIndex);
    }

    updatePagination(type, totalItems) {
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        const currentPage = type === 'feedback' ? this.feedbackPage : this.reportPage;
        
        // Update pagination info
        const startItem = (currentPage - 1) * this.itemsPerPage + 1;
        const endItem = Math.min(currentPage * this.itemsPerPage, totalItems);
        document.getElementById(`${type}PaginationInfo`).textContent = 
            `Showing ${startItem} to ${endItem} of ${totalItems} entries`;

        // Update page numbers
        const pageNumbersContainer = document.getElementById(`${type}PageNumbers`);
        pageNumbersContainer.innerHTML = '';

        for (let i = 1; i <= totalPages; i++) {
            const pageNumber = document.createElement('button');
            pageNumber.className = `page-number ${i === currentPage ? 'active' : ''}`;
            pageNumber.textContent = i;
            pageNumber.onclick = () => this.goToPage(type, i);
            pageNumbersContainer.appendChild(pageNumber);
        }

        // Update prev/next buttons
        document.getElementById(`${type}PrevBtn`).disabled = currentPage === 1;
        document.getElementById(`${type}NextBtn`).disabled = currentPage === totalPages;
    }

    goToPage(type, page) {
        if (type === 'feedback') {
            this.feedbackPage = page;
            this.renderFeedbacks();
        } else {
            this.reportPage = page;
            this.renderReports();
        }
    }

    // Modal Functions
    openFeedbackModal(feedbackId = null) {
        this.currentEditId = feedbackId;
        this.currentEditType = 'feedback';
        
        const modal = document.getElementById('feedbackModal');
        const title = document.getElementById('feedbackModalTitle');
        const form = document.getElementById('feedbackForm');
        
        title.textContent = feedbackId ? 'Edit Feedback' : 'Add New Feedback';
        
        if (feedbackId) {
            const feedback = this.feedbacks.find(f => f.id === feedbackId);
            if (feedback) {
                document.getElementById('feedbackUserName').value = feedback.userName;
                document.getElementById('feedbackDoctorName').value = feedback.doctorName;
                document.querySelector(`input[name="rating"][value="${feedback.rating}"]`).checked = true;
                document.getElementById('feedbackDate').value = this.formatDateForInput(feedback.date);
                document.getElementById('feedbackComments').value = feedback.comments;
            }
        } else {
            form.reset();
            document.getElementById('feedbackDate').value = new Date().toISOString().split('T')[0];
        }
        
        modal.classList.add('active');
    }

    openReportModal(reportId = null) {
        this.currentEditId = reportId;
        this.currentEditType = 'report';
        
        const modal = document.getElementById('reportModal');
        const title = document.getElementById('reportModalTitle');
        const form = document.getElementById('reportForm');
        
        title.textContent = reportId ? 'Edit Doctor Report' : 'Add New Doctor Report';
        
        if (reportId) {
            const report = this.reports.find(r => r.id === reportId);
            if (report) {
                document.getElementById('reportDoctorName').value = report.doctorName;
                document.getElementById('reportSpecialization').value = report.specialization;
                document.getElementById('reportDate').value = this.formatDateForInput(report.date);
                document.getElementById('reportSummary').value = report.summary;
            }
        } else {
            form.reset();
            document.getElementById('reportDate').value = new Date().toISOString().split('T')[0];
        }
        
        modal.classList.add('active');
    }

    closeFeedbackModal() {
        document.getElementById('feedbackModal').classList.remove('active');
        this.currentEditId = null;
        this.currentEditType = null;
    }

    closeReportModal() {
        document.getElementById('reportModal').classList.remove('active');
        this.currentEditId = null;
        this.currentEditType = null;
    }

    closeAllModals() {
        this.closeFeedbackModal();
        this.closeReportModal();
        this.closeDeleteModal();
    }

    closeDeleteModal() {
        document.getElementById('deleteModal').classList.remove('active');
        this.deleteCallback = null;
    }

    // CRUD Operations
    async saveFeedback(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const feedbackData = {
            patientName: formData.get('userName'),
            doctor: formData.get('doctorName'),
            rating: parseInt(formData.get('rating')),
            text: formData.get('comments'),
            date: formData.get('date')
        };

        try {
            let response;
            if (this.currentEditId) {
                response = await window.apiClient.updateFeedback(this.currentEditId, feedbackData);
            } else {
                response = await window.apiClient.createFeedback(feedbackData);
            }

            if (response.success) {
                this.showToast(response.message, 'success');
                this.closeFeedbackModal();
                await this.loadFeedbacks();
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Error saving feedback:', error);
            this.showToast('Failed to save feedback: ' + error.message, 'error');
        }
    }

    async saveReport(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const reportData = {
            doctorName: formData.get('doctorName'),
            specialization: formData.get('specialization'),
            summary: formData.get('summary'),
            dateTime: formData.get('date')
        };

        try {
            let response;
            if (this.currentEditId) {
                response = await window.apiClient.updateReport(this.currentEditId, reportData);
            } else {
                response = await window.apiClient.createReport(reportData);
            }

            if (response.success) {
                this.showToast(response.message, 'success');
                this.closeReportModal();
                await this.loadReports();
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Error saving report:', error);
            this.showToast('Failed to save report: ' + error.message, 'error');
        }
    }

    editFeedback(feedbackId) {
        this.openFeedbackModal(feedbackId);
    }

    editReport(reportId) {
        this.openReportModal(reportId);
    }

    viewReport(reportId) {
        const report = this.reports.find(r => r.id === reportId);
        if (report) {
            this.showToast(`Viewing report for ${report.doctorName}`, 'info');
            // You can implement a detailed view modal here
        }
    }

    deleteFeedback(feedbackId) {
        const feedback = this.feedbacks.find(f => f.id === feedbackId);
        if (feedback) {
            document.getElementById('deleteMessage').textContent = 
                `Are you sure you want to delete feedback from ${feedback.userName}?`;
            this.deleteCallback = () => this.confirmDeleteFeedback(feedbackId);
            document.getElementById('deleteModal').classList.add('active');
        }
    }

    deleteReport(reportId) {
        const report = this.reports.find(r => r.id === reportId);
        if (report) {
            document.getElementById('deleteMessage').textContent = 
                `Are you sure you want to delete the report for ${report.doctorName}?`;
            this.deleteCallback = () => this.confirmDeleteReport(reportId);
            document.getElementById('deleteModal').classList.add('active');
        }
    }

    async confirmDeleteFeedback(feedbackId) {
        try {
            const response = await window.apiClient.deleteFeedback(feedbackId);
            if (response.success) {
                this.showToast(response.message, 'success');
                this.closeDeleteModal();
                await this.loadFeedbacks();
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Error deleting feedback:', error);
            this.showToast('Failed to delete feedback: ' + error.message, 'error');
        }
    }

    async confirmDeleteReport(reportId) {
        try {
            const response = await window.apiClient.deleteReport(reportId);
            if (response.success) {
                this.showToast(response.message, 'success');
                this.closeDeleteModal();
                await this.loadReports();
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Error deleting report:', error);
            this.showToast('Failed to delete report: ' + error.message, 'error');
        }
    }

    confirmDelete() {
        if (this.deleteCallback) {
            this.deleteCallback();
        }
    }

    // Utility Functions
    generateStars(rating) {
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

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatDateForInput(dateString) {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    handleGlobalSearch(searchTerm) {
        // Implement global search across all sections
        console.log('Global search:', searchTerm);
    }

    // Toast Notifications
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        toast.innerHTML = `
            <i class="toast-icon ${icons[type]}"></i>
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }
}

// Global Functions
function showSection(section) {
    if (window.adminDashboard) {
        window.adminDashboard.showSection(section);
    }
}

function openFeedbackModal() {
    if (window.adminDashboard) {
        window.adminDashboard.openFeedbackModal();
    }
}

function openReportModal() {
    if (window.adminDashboard) {
        window.adminDashboard.openReportModal();
    }
}

function closeFeedbackModal() {
    if (window.adminDashboard) {
        window.adminDashboard.closeFeedbackModal();
    }
}

function closeReportModal() {
    if (window.adminDashboard) {
        window.adminDashboard.closeReportModal();
    }
}

function closeDeleteModal() {
    if (window.adminDashboard) {
        window.adminDashboard.closeDeleteModal();
    }
}

function saveFeedback(event) {
    if (window.adminDashboard) {
        window.adminDashboard.saveFeedback(event);
    }
}

function saveReport(event) {
    if (window.adminDashboard) {
        window.adminDashboard.saveReport(event);
    }
}

function confirmDelete() {
    if (window.adminDashboard) {
        window.adminDashboard.confirmDelete();
    }
}

function filterFeedbacks() {
    if (window.adminDashboard) {
        window.adminDashboard.feedbackPage = 1;
        window.adminDashboard.renderFeedbacks();
    }
}

function filterReports() {
    if (window.adminDashboard) {
        window.adminDashboard.reportPage = 1;
        window.adminDashboard.renderReports();
    }
}

function sortTable(type, column) {
    if (window.adminDashboard) {
        if (type === 'feedbacks') {
            if (window.adminDashboard.feedbackSort.column === column) {
                window.adminDashboard.feedbackSort.direction = 
                    window.adminDashboard.feedbackSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                window.adminDashboard.feedbackSort.column = column;
                window.adminDashboard.feedbackSort.direction = 'asc';
            }
            window.adminDashboard.renderFeedbacks();
        } else {
            if (window.adminDashboard.reportSort.column === column) {
                window.adminDashboard.reportSort.direction = 
                    window.adminDashboard.reportSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                window.adminDashboard.reportSort.column = column;
                window.adminDashboard.reportSort.direction = 'asc';
            }
            window.adminDashboard.renderReports();
        }
    }
}

function previousPage(type) {
    if (window.adminDashboard) {
        if (type === 'feedbacks' && window.adminDashboard.feedbackPage > 1) {
            window.adminDashboard.feedbackPage--;
            window.adminDashboard.renderFeedbacks();
        } else if (type === 'reports' && window.adminDashboard.reportPage > 1) {
            window.adminDashboard.reportPage--;
            window.adminDashboard.renderReports();
        }
    }
}

function nextPage(type) {
    if (window.adminDashboard) {
        if (type === 'feedbacks') {
            window.adminDashboard.feedbackPage++;
            window.adminDashboard.renderFeedbacks();
        } else if (type === 'reports') {
            window.adminDashboard.reportPage++;
            window.adminDashboard.renderReports();
        }
    }
}

// Initialize the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.adminDashboard = new AdminDashboard();
});
