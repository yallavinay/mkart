// Admin Authentication JavaScript
let currentAdmin = null;
let authToken = null;

// Initialize admin auth
document.addEventListener('DOMContentLoaded', function() {
    initializeAdminAuth();
});

function initializeAdminAuth() {
    // Check if admin is already logged in
    checkAdminAuthStatus();
    
    // Setup form event listeners
    setupAdminFormListeners();
}

// Check admin authentication status
async function checkAdminAuthStatus() {
    try {
        const response = await fetch('/api/auth/session', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            currentAdmin = data.user;
            
            // Redirect to admin dashboard if already logged in
            window.location.href = '/admin';
        }
    } catch (error) {
        console.log('No active admin session');
    }
}

// Setup form event listeners
function setupAdminFormListeners() {
    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', handleAdminLogin);
    }
}

// Handle admin login form submission
async function handleAdminLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const loginData = {
        username: formData.get('username'),
        password: formData.get('password'),
        rememberMe: formData.get('rememberMe') === 'on'
    };
    
    // Validate form
    if (!loginData.username || !loginData.password) {
        showAdminError('Please fill in all fields');
        return;
    }
    
    // Show loading state
    showAdminLoading(true);
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(loginData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Admin login failed');
        }
        
        // Login successful
        currentAdmin = data.user;
        authToken = data.token;
        
        // Store token if remember me is checked
        if (loginData.rememberMe) {
            localStorage.setItem('adminAuthToken', data.token);
        }
        
        // Store admin data in session storage
        sessionStorage.setItem('admin', JSON.stringify(data.user));
        
        showAdminSuccess('Admin login successful! Redirecting to dashboard...');
        
        // Redirect to admin dashboard after a short delay
        setTimeout(() => {
            window.location.href = '/admin';
        }, 1500);
        
    } catch (error) {
        console.error('Admin login error:', error);
        showAdminError(error.message);
    } finally {
        showAdminLoading(false);
    }
}

// Show admin error message
function showAdminError(message) {
    const alertContainer = document.querySelector('.admin-login-right');
    const existingAlert = alertContainer.querySelector('.admin-alert');
    
    if (existingAlert) {
        existingAlert.remove();
    }
    
    const alertDiv = document.createElement('div');
    alertDiv.className = 'admin-alert admin-alert-danger';
    alertDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        ${message}
    `;
    
    const form = document.getElementById('adminLoginForm');
    alertContainer.insertBefore(alertDiv, form);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Show admin success message
function showAdminSuccess(message) {
    const alertContainer = document.querySelector('.admin-login-right');
    const existingAlert = alertContainer.querySelector('.admin-alert');
    
    if (existingAlert) {
        existingAlert.remove();
    }
    
    const alertDiv = document.createElement('div');
    alertDiv.className = 'admin-alert admin-alert-success';
    alertDiv.innerHTML = `
        <i class="fas fa-check-circle"></i>
        ${message}
    `;
    
    const form = document.getElementById('adminLoginForm');
    alertContainer.insertBefore(alertDiv, form);
}

// Show/hide loading state
function showAdminLoading(show) {
    const loading = document.getElementById('loading');
    const loginBtn = document.getElementById('loginBtn');
    const form = document.getElementById('adminLoginForm');
    
    if (show) {
        loading.style.display = 'block';
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
        form.style.opacity = '0.6';
    } else {
        loading.style.display = 'none';
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Access Admin Panel';
        form.style.opacity = '1';
    }
}

// Admin logout function
async function adminLogout() {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            // Clear stored data
            currentAdmin = null;
            authToken = null;
            sessionStorage.removeItem('admin');
            localStorage.removeItem('adminAuthToken');
            
            // Redirect to admin login
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Admin logout error:', error);
    }
}

// Validate admin session
async function validateAdminSession() {
    try {
        const response = await fetch('/api/auth/session', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            // Session invalid, redirect to login
            window.location.href = '/';
            return false;
        }
        
        const data = await response.json();
        currentAdmin = data.user;
        return true;
    } catch (error) {
        console.error('Admin session validation error:', error);
        window.location.href = '/';
        return false;
    }
}

// Export functions for use in other admin scripts
window.adminAuth = {
    logout: adminLogout,
    validateSession: validateAdminSession,
    getCurrentAdmin: () => currentAdmin,
    getAuthToken: () => authToken
};
