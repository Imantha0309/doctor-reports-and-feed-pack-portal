// Common functions
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = 'php/logout.php';
    }
}

// Check authentication
async function checkAuth() {
    try {
        const response = await fetch('php/api.php?action=stats');
        const result = await response.json();
        
        if (!result.success && result.message === 'Unauthorized') {
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Auth check failed:', error);
    }
}

// Run auth check on protected pages
if (!window.location.pathname.includes('login.html')) {
    checkAuth();
}
