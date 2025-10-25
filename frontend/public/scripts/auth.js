// Enhanced Authentication functionality for MediCart
let currentUser = null;
let authToken = null;
let sessionTimer = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
});

function initializeAuth() {
    // Check if user is already logged in
    checkAuthStatus();
    
    // Setup form event listeners
    setupFormListeners();
    
    // Setup session management
    setupSessionManagement();
}

// Check authentication status
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/users/session', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            updateUIForLoggedInUser(data.user);
            
            // Start session timer
            startSessionTimer(data.session.expiresAt);
        } else {
            // Check for stored token
            const storedToken = localStorage.getItem('authToken');
            if (storedToken) {
                await validateStoredToken(storedToken);
            }
        }
    } catch (error) {
        console.log('User not authenticated');
        clearAuthData();
    }
}

// Validate stored JWT token
async function validateStoredToken(token) {
    try {
        const response = await fetch('/api/users/profile', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const user = await response.json();
            currentUser = user;
            authToken = token;
            updateUIForLoggedInUser(user);
        } else {
            localStorage.removeItem('authToken');
            clearAuthData();
        }
    } catch (error) {
        localStorage.removeItem('authToken');
        clearAuthData();
    }
}

// Setup form event listeners
function setupFormListeners() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
}

// Setup session management
function setupSessionManagement() {
    // Refresh session every 5 minutes
    setInterval(refreshSession, 5 * 60 * 1000);
    
    // Check session on page visibility change
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden && currentUser) {
            refreshSession();
        }
    });
    
    // Handle beforeunload to cleanup
    window.addEventListener('beforeunload', function() {
        if (sessionTimer) {
            clearTimeout(sessionTimer);
        }
    });
}

// Handle login form submission
async function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const loginData = {
        username: formData.get('username'),
        password: formData.get('password'),
        rememberMe: formData.get('rememberMe') === 'on'
    };
    
    // Validate form
    if (!loginData.username || !loginData.password) {
        showError('Please fill in all fields');
        return;
    }
    
    // Show loading state
    showLoading(true);
    
    try {
        const response = await fetch('/api/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(loginData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }
        
        // Login successful
        currentUser = data.user;
        authToken = data.token;
        
        // Store token if remember me is checked
        if (loginData.rememberMe) {
            localStorage.setItem('authToken', data.token);
        }
        
        // Store user data in session storage
        sessionStorage.setItem('user', JSON.stringify(data.user));
        
        showSuccess('Login successful! Redirecting...');
        
        // Start session timer
        if (data.session) {
            startSessionTimer(data.session.expiresAt);
        }
        
        // Redirect to home page after a short delay
        setTimeout(() => {
            window.location.href = '/';
        }, 1500);
        
    } catch (error) {
        console.error('Login error:', error);
        showError(error.message);
    } finally {
        showLoading(false);
    }
}

// Handle register form submission
async function handleRegister(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const registerData = {
        username: formData.get('username'),
        email: formData.get('email'),
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword'),
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        mobile: formData.get('mobile')
    };
    
    // Validate form
    if (!registerData.username || !registerData.email || !registerData.password || 
        !registerData.firstName || !registerData.lastName || !registerData.mobile) {
        showError('Please fill in all required fields');
        return;
    }
    
    if (registerData.password !== registerData.confirmPassword) {
        showError('Passwords do not match');
        return;
    }
    
    if (registerData.password.length < 6) {
        showError('Password must be at least 6 characters long');
        return;
    }
    
    // Show loading state
    showLoading(true);
    
    try {
        const response = await fetch('/api/users/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(registerData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
        }
        
        // Registration successful
        currentUser = data.user;
        authToken = data.token;
        
        // Store user data
        sessionStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('authToken', data.token);
        
        showSuccess('Registration successful! You are now logged in.');
        
        // Redirect to home page after a short delay
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
        
    } catch (error) {
        console.error('Registration error:', error);
        showError(error.message);
    } finally {
        showLoading(false);
    }
}

// Refresh session
async function refreshSession() {
    if (!currentUser) return;
    
    try {
        const response = await fetch('/api/users/refresh-session', {
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            startSessionTimer(data.expiresAt);
        } else {
            // Session expired, logout user
            logout();
        }
    } catch (error) {
        console.error('Session refresh error:', error);
    }
}

// Start session timer
function startSessionTimer(expiresAt) {
    if (sessionTimer) {
        clearTimeout(sessionTimer);
    }
    
    const now = new Date();
    const expiry = new Date(expiresAt);
    const timeUntilExpiry = expiry.getTime() - now.getTime();
    
    if (timeUntilExpiry > 0) {
        sessionTimer = setTimeout(() => {
            showSessionExpiredWarning();
        }, timeUntilExpiry - 5 * 60 * 1000); // Warn 5 minutes before expiry
    }
}

// Show session expired warning
function showSessionExpiredWarning() {
    showError('Your session will expire in 5 minutes. Please save your work.');
    
    // Auto logout after 5 minutes
    setTimeout(() => {
        logout();
    }, 5 * 60 * 1000);
}

// Update UI for logged in user
function updateUIForLoggedInUser(user) {
    // Update cart count
    updateCartCount();
    
    // Add user info to header
    const headerActions = document.querySelector('.header-actions');
    if (headerActions && !document.getElementById('userWelcome')) {
        const userWelcome = document.createElement('div');
        userWelcome.id = 'userWelcome';
        userWelcome.className = 'user-welcome';
        userWelcome.innerHTML = `
            <span style="color: white; margin-right: 10px;">Welcome, ${user.firstName || user.username}!</span>
            <button class="btn btn-outline-light btn-sm" id="headerLogoutBtn">
                <i class="fas fa-sign-out-alt"></i> Logout
            </button>
        `;
        headerActions.insertBefore(userWelcome, headerActions.firstChild);
        
        // Add event listener to logout button after inserting into DOM
        setTimeout(() => {
            const headerLogoutBtn = document.getElementById('headerLogoutBtn');
            if (headerLogoutBtn) {
                headerLogoutBtn.addEventListener('click', logout);
            }
        }, 0);
    }
    
    // Update mobile menu
    const mobileMenu = document.querySelector('.dropdown-menu');
    if (mobileMenu) {
        mobileMenu.innerHTML = `
            <li><span class="dropdown-item-text">Welcome, ${user.firstName || user.username}!</span></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="/profile"><i class="fas fa-user"></i> Profile</a></li>
            <li><a class="dropdown-item" href="/cart"><i class="fas fa-shopping-cart"></i> Cart</a></li>
            <li><a class="dropdown-item" href="/orders"><i class="fas fa-box"></i> Orders</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="#" id="mobileLogoutBtn"><i class="fas fa-sign-out-alt"></i> Logout</a></li>
        `;
        
        // Add event listener to mobile logout button after DOM update
        setTimeout(() => {
            const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
            if (mobileLogoutBtn) {
                mobileLogoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    logout();
                });
            }
        }, 0);
    }
}

// Clear authentication data
function clearAuthData() {
    currentUser = null;
    authToken = null;
    sessionStorage.removeItem('user');
    localStorage.removeItem('authToken');
    
    // Remove user welcome from header
    const userWelcome = document.getElementById('userWelcome');
    if (userWelcome) {
        userWelcome.remove();
    }
    
    // Reset mobile menu
    const mobileMenu = document.querySelector('.dropdown-menu');
    if (mobileMenu) {
        mobileMenu.innerHTML = `
            <li><a class="dropdown-item" href="/login"><i class="fas fa-sign-in-alt"></i> Login</a></li>
            <li><a class="dropdown-item" href="/register"><i class="fas fa-user-plus"></i> Register</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="/admin" target="_blank"><i class="fas fa-cog"></i> Admin Panel</a></li>
        `;
    }
    
    // Clear cart count
    const cartBadge = document.getElementById('cartBadge');
    if (cartBadge) {
        cartBadge.textContent = '0';
        cartBadge.style.display = 'none';
    }
}

// Logout function
async function logout() {
    try {
        const response = await fetch('/api/users/logout', { 
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            showSuccess('Logged out successfully');
        }
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        // Clear local data regardless of server response
        clearAuthData();
        
        // Clear session timer
        if (sessionTimer) {
            clearTimeout(sessionTimer);
            sessionTimer = null;
        }
        
        // Redirect to home page
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
    }
}

// Get current user
function getCurrentUser() {
    return currentUser;
}

// Check if user is authenticated
function isAuthenticated() {
    return currentUser !== null;
}

// Check if user is admin
function isAdmin() {
    return currentUser && currentUser.role === 'admin';
}

// Get auth headers for API calls
function getAuthHeaders() {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    return headers;
}

// Make authenticated API call
async function authenticatedFetch(url, options = {}) {
    const defaultOptions = {
        credentials: 'include',
        headers: getAuthHeaders()
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    if (mergedOptions.headers) {
        mergedOptions.headers = { ...defaultOptions.headers, ...mergedOptions.headers };
    }
    
    const response = await fetch(url, mergedOptions);
    
    // Handle authentication errors
    if (response.status === 401) {
        clearAuthData();
        showError('Session expired. Please login again.');
        setTimeout(() => {
            window.location.href = '/login';
        }, 2000);
        return null;
    }
    
    return response;
}

// Update cart count
async function updateCartCount() {
    if (!currentUser) return;
    
    try {
        const response = await authenticatedFetch('/api/users/cart');
        if (response && response.ok) {
            const cart = await response.json();
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            
            const badge = document.getElementById('cartBadge');
            if (badge) {
                badge.textContent = totalItems;
                badge.style.display = totalItems > 0 ? 'flex' : 'none';
            }
        }
    } catch (error) {
        console.error('Error updating cart count:', error);
    }
}

// Show loading state
function showLoading(show) {
    const loading = document.getElementById('loading');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    
    if (loading) {
        loading.style.display = show ? 'block' : 'none';
    }
    
    if (loginBtn) {
        loginBtn.disabled = show;
        loginBtn.innerHTML = show ? 
            '<i class="fas fa-spinner fa-spin"></i> Logging in...' : 
            '<i class="fas fa-sign-in-alt"></i> Login';
    }
    
    if (registerBtn) {
        registerBtn.disabled = show;
        registerBtn.innerHTML = show ? 
            '<i class="fas fa-spinner fa-spin"></i> Creating Account...' : 
            '<i class="fas fa-user-plus"></i> Create Account';
    }
}

// Utility functions
function showSuccess(message) {
    showNotification(message, 'success');
}

function showError(message) {
    showNotification(message, 'danger');
}

function showNotification(message, type) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} notification position-fixed`;
    notification.style.cssText = `
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        border: none;
        border-radius: 8px;
    `;
    
    notification.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2"></i>
            <span>${message}</span>
            <button type="button" class="btn-close ms-auto" data-dismiss-notification></button>
        </div>
    `;
    
    // Add event listener to close button
    const closeBtn = notification.querySelector('[data-dismiss-notification]');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => notification.remove());
    }
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Form validation helpers
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validateMobile(mobile) {
    const re = /^[6-9]\d{9}$/;
    return re.test(mobile);
}

// Real-time validation
document.addEventListener('DOMContentLoaded', function() {
    // Email validation
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            if (this.value && !validateEmail(this.value)) {
                this.classList.add('is-invalid');
                showFieldError(this, 'Please enter a valid email address');
            } else {
                this.classList.remove('is-invalid');
                hideFieldError(this);
            }
        });
    }
    
    // Mobile validation
    const mobileInput = document.getElementById('mobile');
    if (mobileInput) {
        mobileInput.addEventListener('blur', function() {
            if (this.value && !validateMobile(this.value)) {
                this.classList.add('is-invalid');
                showFieldError(this, 'Please enter a valid 10-digit mobile number');
            } else {
                this.classList.remove('is-invalid');
                hideFieldError(this);
            }
        });
    }
    
    // Password confirmation validation
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    if (passwordInput && confirmPasswordInput) {
        confirmPasswordInput.addEventListener('blur', function() {
            if (this.value && this.value !== passwordInput.value) {
                this.classList.add('is-invalid');
                showFieldError(this, 'Passwords do not match');
            } else {
                this.classList.remove('is-invalid');
                hideFieldError(this);
            }
        });
    }
});

function showFieldError(field, message) {
    hideFieldError(field);
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'invalid-feedback';
    errorDiv.textContent = message;
    
    field.parentNode.appendChild(errorDiv);
}

function hideFieldError(field) {
    const existingError = field.parentNode.querySelector('.invalid-feedback');
    if (existingError) {
        existingError.remove();
    }
}

// Export functions for global use
window.auth = {
    getCurrentUser,
    isAuthenticated,
    isAdmin,
    logout,
    authenticatedFetch,
    updateCartCount
};
