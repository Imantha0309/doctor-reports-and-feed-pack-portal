// EC Healthcare Admin Dashboard
class DashboardManager {
    constructor() {
        this.charts = {};
        this.data = {};
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadDashboardData();
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

    async loadDashboardData() {
        try {
            // Load KPI data
            await this.loadKPIData();
            
            // Load chart data
            await this.loadChartData();
            
            // Load recent feedbacks
            await this.loadRecentFeedbacks();
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showError('Failed to load dashboard data');
        }
    }

    async loadKPIData() {
        try {
            // Simulate API calls - replace with actual endpoints
            const [users, doctors, reports, feedbacks] = await Promise.all([
                this.fetchData('/api/users/count'),
                this.fetchData('/api/users/count?type=doctor'),
                this.fetchData('/api/reports/count'),
                this.fetchData('/api/feedbacks/count')
            ]);

            this.updateKPI('totalUsers', users.count || 1247);
            this.updateKPI('totalDoctors', doctors.count || 23);
            this.updateKPI('totalReports', reports.count || 156);
            this.updateKPI('totalFeedbacks', feedbacks.count || 89);

        } catch (error) {
            console.error('Error loading KPI data:', error);
            // Fallback to mock data
            this.updateKPI('totalUsers', 1247);
            this.updateKPI('totalDoctors', 23);
            this.updateKPI('totalReports', 156);
            this.updateKPI('totalFeedbacks', 89);
        }
    }

    async loadRecentFeedbacks() {
        try {
            const feedbacks = await this.fetchData('/api/feedbacks/recent?limit=6');
            this.renderRecentFeedbacks(feedbacks);

        } catch (error) {
            console.error('Error loading recent feedbacks:', error);
            // Render with mock data
            this.renderRecentFeedbacks(this.getMockFeedbacks());
        }
    }

    bindEvents() {
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

    async loadDashboardData() {
        try {
            // Load KPI data
            await this.loadKPIData();
            
            // Load chart data
            await this.loadChartData();
            
            // Load recent feedbacks
            await this.loadRecentFeedbacks();
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showError('Failed to load dashboard data');
        }
    }

    async loadKPIData() {
        try {
            // Use real API calls
            const [users, doctors, reports, feedbacks] = await Promise.all([
                window.apiClient.getUserCount(),
                window.apiClient.getUserCount('doctor'),
                window.apiClient.getReportCount(),
                window.apiClient.getFeedbackCount()
            ]);

            this.updateKPI('totalUsers', users.count || 0);
            this.updateKPI('totalDoctors', doctors.count || 0);
            this.updateKPI('totalReports', reports.count || 0);
            this.updateKPI('totalFeedbacks', feedbacks.count || 0);

        } catch (error) {
            console.error('Error loading KPI data:', error);
            // Fallback to mock data for demonstration
            this.updateKPI('totalUsers', 1247);
            this.updateKPI('totalDoctors', 23);
            this.updateKPI('totalReports', 156);
            this.updateKPI('totalFeedbacks', 89);
        }
    }

    async loadChartData() {
        try {
            // Load user type breakdown
            const userBreakdown = await window.apiClient.getUserBreakdown();
            if (userBreakdown.success) {
                this.createUserTypeChart(userBreakdown.data);
            }

            // Load reports timeseries
            const reportsData = await window.apiClient.getReportsTimeSeries('30d');
            if (reportsData.success) {
                this.createReportsChart(reportsData.data);
            }

            // Load top doctors
            const topDoctors = await window.apiClient.getTopDoctors(5);
            if (topDoctors.success) {
                this.createDoctorRatingChart(topDoctors.data);
            }

            // Load ratings distribution
            const ratingsDist = await window.apiClient.getRatingsDistribution();
            if (ratingsDist.success) {
                this.createRatingsChart(ratingsDist.data);
            }

        } catch (error) {
            console.error('Error loading chart data:', error);
            // Create charts with mock data
            this.createMockCharts();
        }
    }

    async loadRecentFeedbacks() {
        try {
            const feedbacks = await window.apiClient.getRecentFeedbacks(6);
            if (feedbacks.success) {
                this.renderRecentFeedbacks(feedbacks.data);
            }
        } catch (error) {
            console.error('Error loading recent feedbacks:', error);
            // Render with mock data
            this.renderRecentFeedbacks(this.getMockFeedbacks());
        }
    }

    generateMockTimeseriesData() {
        const data = [];
        const labels = [];
        const today = new Date();
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            data.push(Math.floor(Math.random() * 20) + 5);
        }
        
        return { labels, data };
    }

    getMockFeedbacks() {
        return [
            {
                id: 1,
                patientName: 'John Doe',
                date: '2024-01-18',
                rating: 5,
                text: 'Excellent care and attention. The doctor was very thorough in explaining the treatment plan.'
            },
            {
                id: 2,
                patientName: 'Adam Garza',
                date: '2024-01-17',
                rating: 4,
                text: 'Good service overall, though the wait time was longer than expected.'
            },
            {
                id: 3,
                patientName: 'Jennifer Rice',
                date: '2024-01-16',
                rating: 5,
                text: 'Outstanding care! The doctor was very empathetic and took the time to listen to all my concerns.'
            },
            {
                id: 4,
                patientName: 'Sarah Wilson',
                date: '2024-01-15',
                rating: 3,
                text: 'Professional service with clear communication about the treatment options.'
            },
            {
                id: 5,
                patientName: 'Michael Brown',
                date: '2024-01-14',
                rating: 4,
                text: 'Very satisfied with the care received. The staff was friendly and helpful.'
            },
            {
                id: 6,
                patientName: 'Emily Davis',
                date: '2024-01-13',
                rating: 5,
                text: 'Exceptional experience from start to finish. Highly recommend this healthcare provider.'
            }
        ];
    }

    updateKPI(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = this.formatNumber(value);
        }
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    createUserTypeChart(data) {
        const ctx = document.getElementById('chartUserTypes');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (this.charts.userTypes) {
            this.charts.userTypes.destroy();
        }

        this.charts.userTypes = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Admin', 'Doctor', 'User'],
                datasets: [{
                    data: [data.admin, data.doctor, data.user],
                    backgroundColor: [
                        'rgba(139, 92, 246, 0.8)',
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(236, 72, 153, 0.8)'
                    ],
                    borderColor: [
                        'rgba(139, 92, 246, 1)',
                        'rgba(59, 130, 246, 1)',
                        'rgba(236, 72, 153, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    createReportsChart(data) {
        const ctx = document.getElementById('chartReports30d');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (this.charts.reports) {
            this.charts.reports.destroy();
        }

        this.charts.reports = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Reports',
                    data: data.data,
                    borderColor: 'rgba(139, 92, 246, 1)',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: 'rgba(139, 92, 246, 1)',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    createDoctorRatingChart(data) {
        const ctx = document.getElementById('chartDoctorAvg');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (this.charts.doctorRatings) {
            this.charts.doctorRatings.destroy();
        }

        this.charts.doctorRatings = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.name),
                datasets: [{
                    label: 'Average Rating',
                    data: data.map(d => d.rating),
                    backgroundColor: [
                        'rgba(139, 92, 246, 0.8)',
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(236, 72, 153, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)'
                    ],
                    borderColor: [
                        'rgba(139, 92, 246, 1)',
                        'rgba(59, 130, 246, 1)',
                        'rgba(236, 72, 153, 1)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(245, 158, 11, 1)'
                    ],
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 5,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    createRatingsChart(data) {
        const ctx = document.getElementById('chartRatingsDist');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (this.charts.ratingsDist) {
            this.charts.ratingsDist.destroy();
        }

        this.charts.ratingsDist = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['1★', '2★', '3★', '4★', '5★'],
                datasets: [{
                    label: 'Count',
                    data: [data['1'], data['2'], data['3'], data['4'], data['5']],
                    backgroundColor: [
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(139, 92, 246, 0.8)'
                    ],
                    borderColor: [
                        'rgba(239, 68, 68, 1)',
                        'rgba(245, 158, 11, 1)',
                        'rgba(59, 130, 246, 1)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(139, 92, 246, 1)'
                    ],
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    createMockCharts() {
        // User Type Breakdown
        this.createUserTypeChart({
            admin: 12,
            doctor: 23,
            user: 1212
        });

        // Reports Timeseries
        this.createReportsChart(this.generateMockTimeseriesData());

        // Top Doctors
        this.createDoctorRatingChart([
            { name: 'Dr. Sarah Johnson', rating: 4.8 },
            { name: 'Dr. Michael Chen', rating: 4.9 },
            { name: 'Dr. Emily Rodriguez', rating: 4.7 },
            { name: 'Dr. James Wilson', rating: 4.6 },
            { name: 'Dr. Lisa Thompson', rating: 4.8 }
        ]);

        // Ratings Distribution
        this.createRatingsChart({
            '1': 5,
            '2': 8,
            '3': 15,
            '4': 25,
            '5': 36
        });
    }

    renderRecentFeedbacks(feedbacks) {
        const container = document.getElementById('listRecentFeedback');
        if (!container) return;

        container.innerHTML = '';

        feedbacks.forEach(feedback => {
            const item = document.createElement('div');
            item.className = 'feedback-item';
            
            const initials = feedback.patientName.split(' ').map(n => n[0]).join('');
            const formattedDate = new Date(feedback.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            item.innerHTML = `
                <div class="feedback-avatar">
                    ${initials}
                </div>
                <div class="feedback-content">
                    <div class="feedback-name">${feedback.patientName}</div>
                    <div class="feedback-date">${formattedDate}</div>
                    <div class="feedback-text">${feedback.text}</div>
                </div>
                <div class="feedback-rating">
                    ${this.generateStars(feedback.rating)}
                </div>
            `;

            container.appendChild(item);
        });
    }

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

    showError(message) {
        console.error(message);
        // You can implement a toast notification here
    }

    // Search functionality
    handleSearch(searchTerm) {
        console.log('Searching for:', searchTerm);
        this.showNotification(`Searching for: ${searchTerm}`, 'info');
    }

    // Filter functionality
    handleFilter(filterValue) {
        console.log('Filtering by:', filterValue);
        this.showNotification(`Filtering by: ${filterValue}`, 'info');
    }

    // Sort functionality
    handleSort(sortValue) {
        console.log('Sorting by:', sortValue);
        this.showNotification(`Sorting by: ${sortValue}`, 'info');
    }

    // Card menu functionality
    showCardMenu(menuButton) {
        this.closeAllCardMenus();
        
        const dropdown = document.createElement('div');
        dropdown.className = 'card-dropdown';
        dropdown.innerHTML = `
            <div class="dropdown-item" onclick="refreshCard('${menuButton.closest('.card').id}')">
                <i class="fas fa-sync-alt"></i> Refresh
            </div>
            <div class="dropdown-item" onclick="exportCard('${menuButton.closest('.card').id}')">
                <i class="fas fa-download"></i> Export
            </div>
            <div class="dropdown-item" onclick="configureCard('${menuButton.closest('.card').id}')">
                <i class="fas fa-cog"></i> Configure
            </div>
        `;
        
        const rect = menuButton.getBoundingClientRect();
        dropdown.style.position = 'absolute';
        dropdown.style.top = `${rect.bottom + 5}px`;
        dropdown.style.right = `${window.innerWidth - rect.right}px`;
        dropdown.style.zIndex = '1000';
        
        document.body.appendChild(dropdown);
        menuButton._dropdown = dropdown;
    }

    closeAllCardMenus() {
        const dropdowns = document.querySelectorAll('.card-dropdown');
        dropdowns.forEach(dropdown => {
            if (dropdown.parentNode) {
                dropdown.parentNode.removeChild(dropdown);
            }
        });
    }

    // Card actions
    refreshCard(cardId) {
        console.log('Refreshing card:', cardId);
        this.showNotification('Card refreshed', 'success');
        this.loadDashboardData();
    }

    exportCard(cardId) {
        console.log('Exporting card:', cardId);
        this.showNotification('Card exported', 'success');
    }

    configureCard(cardId) {
        console.log('Configuring card:', cardId);
        this.showNotification('Card configuration opened', 'info');
    }

    // Notification system
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 2rem;
            right: 2rem;
            background-color: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            z-index: 3000;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // CRUD Methods
    async loadUsers() {
        try {
            const response = await window.apiClient.getUsers();
            if (response.success) {
                this.renderUsersTable(response.data);
            } else {
                this.showNotification('Failed to load users: ' + response.message, 'error');
            }
        } catch (error) {
            console.error('Error loading users:', error);
            this.showNotification('Failed to load users', 'error');
        }
    }

    async loadFeedbacks() {
        try {
            const response = await window.apiClient.getFeedbacks();
            if (response.success) {
                this.renderFeedbacksTable(response.data);
            } else {
                this.showNotification('Failed to load feedbacks: ' + response.message, 'error');
            }
        } catch (error) {
            console.error('Error loading feedbacks:', error);
            this.showNotification('Failed to load feedbacks', 'error');
        }
    }

    async loadReports() {
        try {
            const response = await window.apiClient.getReports();
            if (response.success) {
                this.renderReportsTable(response.data);
            } else {
                this.showNotification('Failed to load reports: ' + response.message, 'error');
            }
        } catch (error) {
            console.error('Error loading reports:', error);
            this.showNotification('Failed to load reports', 'error');
        }
    }

    renderUsersTable(users) {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.phone || 'N/A'}</td>
                <td><span class="user-type-badge type-${user.userType}">${user.userType}</span></td>
                <td><span class="status-badge ${user.isActive ? 'status-active' : 'status-inactive'}">${user.isActive ? 'Active' : 'Inactive'}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-edit" onclick="editUser('${user._id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-action btn-delete" onclick="deleteUser('${user._id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderFeedbacksTable(feedbacks) {
        const tbody = document.getElementById('feedbacksTableBody');
        if (!tbody) return;

        tbody.innerHTML = feedbacks.map(feedback => `
            <tr>
                <td>${feedback.patientName}</td>
                <td>${feedback.doctor?.name || 'Unknown Doctor'}</td>
                <td>${feedback.sickness || 'General'}</td>
                <td>
                    <div class="rating-stars">
                        ${'★'.repeat(feedback.rating)}${'☆'.repeat(5 - feedback.rating)}
                        <span>(${feedback.rating}/5)</span>
                    </div>
                </td>
                <td>${new Date(feedback.date || feedback.createdAt).toLocaleDateString()}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-edit" onclick="editFeedback('${feedback._id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-action btn-delete" onclick="deleteFeedback('${feedback._id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderReportsTable(reports) {
        const tbody = document.getElementById('reportsTableBody');
        if (!tbody) return;

        tbody.innerHTML = reports.map(report => `
            <tr>
                <td>${report.patientName}</td>
                <td>${report.doctor?.name || 'Unknown Doctor'}</td>
                <td>${report.title}</td>
                <td>${report.summary?.substring(0, 50)}${report.summary?.length > 50 ? '...' : ''}</td>
                <td>${new Date(report.date || report.createdAt).toLocaleDateString()}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-edit" onclick="editReport('${report._id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-action btn-delete" onclick="deleteReport('${report._id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
}

// Global functions for HTML onclick handlers
function navigateToSection(section) {
    // Add visual feedback for button click
    const clickedBtn = document.querySelector(`[onclick="navigateToSection('${section}')"]`);
    if (clickedBtn) {
        clickedBtn.style.transform = 'scale(0.95)';
        clickedBtn.style.opacity = '0.8';
        
        // Reset visual feedback after animation
        setTimeout(() => {
            clickedBtn.style.transform = '';
            clickedBtn.style.opacity = '';
        }, 150);
    }
    
    // Update active sidebar button
    const sidebarBtns = document.querySelectorAll('.sidebar-btn');
    sidebarBtns.forEach(btn => btn.classList.remove('active'));
    
    const activeBtn = document.querySelector(`[onclick="navigateToSection('${section}')"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }

    // Hide all content sections
    const contentSections = document.querySelectorAll('.content-section');
    contentSections.forEach(section => section.classList.remove('active'));

    // Show the selected section
    const targetSection = document.getElementById(`${section}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Load data for the section
        if (window.dashboardManager) {
            switch(section) {
                case 'dashboard':
                    window.dashboardManager.loadDashboardData();
                    break;
                case 'users':
                    window.dashboardManager.loadUsers();
                    break;
                case 'feedbacks':
                    window.dashboardManager.loadFeedbacks();
                    break;
                case 'reports':
                    window.dashboardManager.loadReports();
                    break;
            }
        }
    }

    // Add loading state
    if (clickedBtn) {
        clickedBtn.style.pointerEvents = 'none';
        const originalText = clickedBtn.querySelector('span').textContent;
        clickedBtn.querySelector('span').textContent = 'Loading...';
        
        // Navigate to appropriate page
        setTimeout(() => {
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
        }, 200);
    }
}

// Search functionality
function handleSearch(searchTerm) {
    if (window.dashboardManager) {
        window.dashboardManager.handleSearch(searchTerm);
    }
}

// Filter functionality
function handleFilter(filterValue) {
    if (window.dashboardManager) {
        window.dashboardManager.handleFilter(filterValue);
    }
}

// Sort functionality
function handleSort(sortValue) {
    if (window.dashboardManager) {
        window.dashboardManager.handleSort(sortValue);
    }
}

// Card menu functionality
function showCardMenu(menuButton) {
    if (window.dashboardManager) {
        window.dashboardManager.showCardMenu(menuButton);
    }
}

// Card actions
function refreshCard(cardId) {
    if (window.dashboardManager) {
        window.dashboardManager.refreshCard(cardId);
    }
}

function exportCard(cardId) {
    if (window.dashboardManager) {
        window.dashboardManager.exportCard(cardId);
    }
}

function configureCard(cardId) {
    if (window.dashboardManager) {
        window.dashboardManager.configureCard(cardId);
    }
}

// Listen for data updates from other pages
window.addEventListener('dataUpdated', function(e) {
    if (e.detail.type === 'userUpdated' || e.detail.type === 'userDeleted' || 
        e.detail.type === 'reportUpdated' || e.detail.type === 'reportDeleted' ||
        e.detail.type === 'feedbackUpdated' || e.detail.type === 'feedbackDeleted') {
        // Reload dashboard data when any data changes
        if (window.dashboardManager) {
            window.dashboardManager.loadKPIData();
            window.dashboardManager.loadChartData();
            window.dashboardManager.loadRecentFeedbacks();
        }
    }
});

// Listen for storage changes to update dashboard when data changes in other tabs
window.addEventListener('storage', function(e) {
    if (e.key === 'ec-healthcare-last-update') {
        const update = JSON.parse(e.newValue);
        if (update.type === 'userUpdated' || update.type === 'userDeleted' || 
            update.type === 'reportUpdated' || update.type === 'reportDeleted' ||
            update.type === 'feedbackUpdated' || update.type === 'feedbackDeleted') {
            // Reload dashboard data when any data changes
            if (window.dashboardManager) {
                window.dashboardManager.loadKPIData();
                window.dashboardManager.loadChartData();
                window.dashboardManager.loadRecentFeedbacks();
            }
        }
    }
});

// Global CRUD Functions
function openUserModal() {
    const modal = document.getElementById('userModal');
    const modalTitle = document.getElementById('userModalTitle');
    const form = document.getElementById('userForm');
    
    modalTitle.textContent = 'Add New User';
    form.reset();
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeUserModal() {
    const modal = document.getElementById('userModal');
    modal.classList.remove('show');
    document.body.style.overflow = '';
}

function openFeedbackModal() {
    const modal = document.getElementById('feedbackModal');
    const modalTitle = document.getElementById('feedbackModalTitle');
    const form = document.getElementById('feedbackForm');
    
    modalTitle.textContent = 'Add New Feedback';
    form.reset();
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Load doctors for dropdown
    loadDoctorsForDropdown('feedbackDoctor');
}

function closeFeedbackModal() {
    const modal = document.getElementById('feedbackModal');
    modal.classList.remove('show');
    document.body.style.overflow = '';
}

function openReportModal() {
    const modal = document.getElementById('reportModal');
    const modalTitle = document.getElementById('reportModalTitle');
    const form = document.getElementById('reportForm');
    
    modalTitle.textContent = 'Add New Report';
    form.reset();
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Load doctors for dropdown
    loadDoctorsForDropdown('reportDoctor');
}

function closeReportModal() {
    const modal = document.getElementById('reportModal');
    modal.classList.remove('show');
    document.body.style.overflow = '';
}

async function loadDoctorsForDropdown(selectId) {
    try {
        const response = await window.apiClient.getDoctors();
        const select = document.getElementById(selectId);
        if (select && response.success) {
            // Clear existing options except the first one
            select.innerHTML = '<option value="">Select Doctor</option>';
            
            // Add doctor options
            response.data.forEach(doctor => {
                const option = document.createElement('option');
                option.value = doctor._id;
                option.textContent = doctor.name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading doctors for dropdown:', error);
    }
}

// CRUD Action Functions
async function editUser(userId) {
    // Implementation for editing user
    console.log('Edit user:', userId);
}

async function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        try {
            const response = await window.apiClient.deleteUser(userId);
            if (response.success) {
                window.dashboardManager.showNotification('User deleted successfully', 'success');
                window.dashboardManager.loadUsers();
            } else {
                window.dashboardManager.showNotification('Failed to delete user: ' + response.message, 'error');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            window.dashboardManager.showNotification('Failed to delete user', 'error');
        }
    }
}

async function editFeedback(feedbackId) {
    // Implementation for editing feedback
    console.log('Edit feedback:', feedbackId);
}

async function deleteFeedback(feedbackId) {
    if (confirm('Are you sure you want to delete this feedback?')) {
        try {
            const response = await window.apiClient.deleteFeedback(feedbackId);
            if (response.success) {
                window.dashboardManager.showNotification('Feedback deleted successfully', 'success');
                window.dashboardManager.loadFeedbacks();
            } else {
                window.dashboardManager.showNotification('Failed to delete feedback: ' + response.message, 'error');
            }
        } catch (error) {
            console.error('Error deleting feedback:', error);
            window.dashboardManager.showNotification('Failed to delete feedback', 'error');
        }
    }
}

async function editReport(reportId) {
    // Implementation for editing report
    console.log('Edit report:', reportId);
}

async function deleteReport(reportId) {
    if (confirm('Are you sure you want to delete this report?')) {
        try {
            const response = await window.apiClient.deleteReport(reportId);
            if (response.success) {
                window.dashboardManager.showNotification('Report deleted successfully', 'success');
                window.dashboardManager.loadReports();
            } else {
                window.dashboardManager.showNotification('Failed to delete report: ' + response.message, 'error');
            }
        } catch (error) {
            console.error('Error deleting report:', error);
            window.dashboardManager.showNotification('Failed to delete report', 'error');
        }
    }
}

function sortTable(column) {
    // Implementation for table sorting
    console.log('Sort by:', column);
}

// Initialize the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize API client
    window.apiClient = new APIClient();
    
    // Initialize dashboard manager
    window.dashboardManager = new DashboardManager();
    addSidebarKeyboardNavigation();
});

// Add keyboard navigation for sidebar buttons
function addSidebarKeyboardNavigation() {
    const sidebarBtns = document.querySelectorAll('.sidebar-btn');
    
    sidebarBtns.forEach((btn, index) => {
        btn.setAttribute('tabindex', '0');
        
        btn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                btn.click();
            } else if (e.key === 'ArrowDown' && index < sidebarBtns.length - 1) {
                e.preventDefault();
                sidebarBtns[index + 1].focus();
            } else if (e.key === 'ArrowUp' && index > 0) {
                e.preventDefault();
                sidebarBtns[index - 1].focus();
            }
        });
        
        btn.addEventListener('focus', () => {
            btn.style.outline = '2px solid var(--primary-blue)';
            btn.style.outlineOffset = '2px';
        });
        
        btn.addEventListener('blur', () => {
            btn.style.outline = 'none';
        });
    });
}

// Handle window resize for responsive charts
window.addEventListener('resize', function() {
    if (window.dashboardManager && window.dashboardManager.charts) {
        Object.values(window.dashboardManager.charts).forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
    }
});
