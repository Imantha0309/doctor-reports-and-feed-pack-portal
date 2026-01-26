// EC Healthcare API Client
class APIClient {
    constructor(baseURL = 'http://localhost:5000/api') {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('ec-healthcare-token');
    }

    // Set authentication token
    setToken(token) {
        this.token = token;
        localStorage.setItem('ec-healthcare-token', token);
    }

    // Remove authentication token
    removeToken() {
        this.token = null;
        localStorage.removeItem('ec-healthcare-token');
    }

    // Make HTTP request
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Add authorization header if token exists
        if (this.token) {
            config.headers['x-auth-token'] = this.token;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }

            // Ensure response has success property
            if (data.success === undefined) {
                data.success = true;
            }

            return data;
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    // Authentication API
    async login(email, password) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (response.success && response.data.token) {
            this.setToken(response.data.token);
        }

        return response;
    }

    async register(userData) {
        const response = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });

        if (response.success && response.data.token) {
            this.setToken(response.data.token);
        }

        return response;
    }

    async logout() {
        try {
            await this.request('/auth/logout', { method: 'POST' });
        } finally {
            this.removeToken();
        }
    }

    async getCurrentUser() {
        return await this.request('/auth/me');
    }

    // Users API
    async getUsers(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return await this.request(`/users${queryString ? `?${queryString}` : ''}`);
    }

    async getUser(id) {
        return await this.request(`/users/${id}`);
    }

    async createUser(userData) {
        return await this.request('/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async updateUser(id, userData) {
        return await this.request(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    async deleteUser(id) {
        return await this.request(`/users/${id}`, {
            method: 'DELETE'
        });
    }

    async getUserCount(type = null) {
        const queryString = type ? `?type=${type}` : '';
        return await this.request(`/users/count${queryString}`);
    }

    async getUserBreakdown() {
        return await this.request('/users/breakdown');
    }

    // Doctors API
    async getDoctors(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return await this.request(`/doctors${queryString ? `?${queryString}` : ''}`);
    }

    async getDoctor(id) {
        return await this.request(`/doctors/${id}`);
    }

    async createDoctor(doctorData) {
        return await this.request('/doctors', {
            method: 'POST',
            body: JSON.stringify(doctorData)
        });
    }

    async updateDoctor(id, doctorData) {
        return await this.request(`/doctors/${id}`, {
            method: 'PUT',
            body: JSON.stringify(doctorData)
        });
    }

    async deleteDoctor(id) {
        return await this.request(`/doctors/${id}`, {
            method: 'DELETE'
        });
    }

    async getTopRatedDoctors(limit = 5) {
        return await this.request(`/doctors/top-rated?limit=${limit}`);
    }

    // Reports API
    async getReports(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return await this.request(`/reports${queryString ? `?${queryString}` : ''}`);
    }

    async getReport(id) {
        return await this.request(`/reports/${id}`);
    }

    async createReport(reportData) {
        return await this.request('/reports', {
            method: 'POST',
            body: JSON.stringify(reportData)
        });
    }

    async updateReport(id, reportData) {
        return await this.request(`/reports/${id}`, {
            method: 'PUT',
            body: JSON.stringify(reportData)
        });
    }

    async deleteReport(id) {
        return await this.request(`/reports/${id}`, {
            method: 'DELETE'
        });
    }

    async getReportCount() {
        return await this.request('/reports/count');
    }

    async getReportsTimeSeries(range = '30d') {
        return await this.request(`/reports/timeseries?range=${range}`);
    }

    // Feedbacks API
    async getFeedbacks(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return await this.request(`/feedbacks${queryString ? `?${queryString}` : ''}`);
    }

    async getFeedback(id) {
        return await this.request(`/feedbacks/${id}`);
    }

    async createFeedback(feedbackData) {
        return await this.request('/feedbacks', {
            method: 'POST',
            body: JSON.stringify(feedbackData)
        });
    }

    async updateFeedback(id, feedbackData) {
        return await this.request(`/feedbacks/${id}`, {
            method: 'PUT',
            body: JSON.stringify(feedbackData)
        });
    }

    async deleteFeedback(id) {
        return await this.request(`/feedbacks/${id}`, {
            method: 'DELETE'
        });
    }

    async getFeedbackCount() {
        return await this.request('/feedbacks/count');
    }

    async getRecentFeedbacks(limit = 6) {
        return await this.request(`/feedbacks/recent?limit=${limit}`);
    }

    async getTopDoctors(limit = 5) {
        return await this.request(`/feedbacks/top-doctors?limit=${limit}`);
    }

    async getRatingsDistribution() {
        return await this.request('/feedbacks/ratings-distribution');
    }

    // Dashboard API
    async getDashboardStats() {
        return await this.request('/dashboard/stats');
    }

    async getRecentActivity(limit = 10) {
        return await this.request(`/dashboard/recent-activity?limit=${limit}`);
    }

    async getUsersOverTime(days = 30) {
        return await this.request(`/dashboard/charts/users-over-time?days=${days}`);
    }

    async getDoctorSpecializations() {
        return await this.request('/dashboard/charts/doctor-specializations');
    }

    async getFeedbackTrends(days = 30) {
        return await this.request(`/dashboard/charts/feedback-trends?days=${days}`);
    }

    async getQuickActions() {
        return await this.request('/dashboard/quick-actions');
    }

    // File Upload API
    async uploadFile(file, endpoint = '/upload') {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`
            },
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Upload failed');
        }

        return data;
    }

    // Health Check
    async healthCheck() {
        return await this.request('/health');
    }
}

// Create global API client instance
window.apiClient = new APIClient();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIClient;
}
