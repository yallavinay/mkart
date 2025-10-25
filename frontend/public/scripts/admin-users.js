// Admin Users Management JavaScript
let currentAdmin = null;
let users = [];
let currentPage = 1;
let totalPages = 1;
let searchQuery = '';

// Initialize users management
document.addEventListener('DOMContentLoaded', function() {
    initializeUsersPage();
});

async function initializeUsersPage() {
    // Check admin authentication
    const isAuthenticated = await checkAdminAuth();
    if (!isAuthenticated) {
        window.location.href = '/';
        return;
    }

    // Load users
    await loadUsers();
    
    // Setup event listeners
    setupEventListeners();
}

// Check admin authentication
async function checkAdminAuth() {
    try {
        const response = await fetch('/api/auth/session', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            return false;
        }
        
        const data = await response.json();
        currentAdmin = data.user;
        
        // Update UI with admin info
        updateAdminInfo(data.user);
        
        return true;
    } catch (error) {
        console.error('Admin auth check failed:', error);
        return false;
    }
}

// Update admin info in UI
function updateAdminInfo(admin) {
    document.getElementById('adminName').textContent = admin.firstName + ' ' + admin.lastName;
    document.getElementById('adminAvatar').textContent = (admin.firstName || 'A').charAt(0).toUpperCase();
}

// Setup event listeners
function setupEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', adminLogout);
    }

    // Search button
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', searchUsers);
    }

    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshUsers);
    }

    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchUsers();
            }
        });
    }

    // Event delegation for dynamically created buttons
    document.addEventListener('click', function(e) {
        // View user details button
        if (e.target.closest('.btn-view-user')) {
            const userId = parseInt(e.target.closest('.btn-view-user').dataset.id);
            viewUserDetails(userId);
        }
        // Toggle user status button
        if (e.target.closest('.btn-toggle-status')) {
            const userId = parseInt(e.target.closest('.btn-toggle-status').dataset.id);
            const isActive = e.target.closest('.btn-toggle-status').dataset.active === 'true';
            toggleUserStatus(userId, isActive);
        }
        // Pagination
        if (e.target.closest('.page-link-custom')) {
            e.preventDefault();
            const page = parseInt(e.target.closest('.page-link-custom').dataset.page);
            changePage(page);
        }
        // Notification dismiss
        if (e.target.closest('[data-dismiss-notification]')) {
            const notification = e.target.closest('.notification');
            if (notification) {
                notification.remove();
            }
        }
    });
}

// Load users from API
async function loadUsers() {
    try {
        showLoading(true);
        
        const params = new URLSearchParams({
            page: currentPage,
            limit: 10
        });
        
        if (searchQuery) {
            params.append('search', searchQuery);
        }
        
        const response = await fetch(`/api/admin/users?${params}`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to load users');
        }
        
        const data = await response.json();
        users = data.users || [];
        totalPages = data.pagination?.totalPages || 1;
        
        displayUsers();
        
    } catch (error) {
        console.error('Error loading users:', error);
        showError('Failed to load users');
    } finally {
        showLoading(false);
    }
}

// Display users in table
function displayUsers() {
    const container = document.getElementById('usersTable');
    
    if (users.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-users" style="font-size: 3rem; color: #bdc3c7; margin-bottom: 1rem;"></i>
                <h5>No users found</h5>
                <p class="text-muted">Users will appear here when they register</p>
            </div>
        `;
        return;
    }
    
    const tableHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>User</th>
                    <th>Contact</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Last Login</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${users.map(user => `
                    <tr>
                        <td>
                            <div class="d-flex align-items-center">
                                <div class="user-avatar me-3">
                                    ${(user.firstName || user.username || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <strong>${user.firstName || ''} ${user.lastName || ''}</strong>
                                    <br>
                                    <small class="text-muted">@${user.username}</small>
                                </div>
                            </div>
                        </td>
                        <td>
                            <div>
                                <strong>${user.email}</strong>
                                ${user.mobile ? `<br><small class="text-muted">${user.mobile}</small>` : ''}
                            </div>
                        </td>
                        <td>
                            <span class="role-badge ${user.role === 'admin' ? 'role-admin' : 'role-user'}">
                                ${user.role === 'admin' ? 'Admin' : 'User'}
                            </span>
                        </td>
                        <td>
                            <span class="status-badge ${user.isActive ? 'status-active' : 'status-inactive'}">
                                ${user.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </td>
                        <td>
                            <small>${formatDate(user.createdAt)}</small>
                        </td>
                        <td>
                            <small>${user.lastLogin ? formatDate(user.lastLogin) : 'Never'}</small>
                        </td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn btn-info btn-sm btn-view-user" data-id="${user.id}" title="View Details">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-warning btn-sm btn-toggle-status" data-id="${user.id}" data-active="${user.isActive}" 
                                        title="${user.isActive ? 'Deactivate' : 'Activate'} User">
                                    <i class="fas fa-${user.isActive ? 'ban' : 'check'}"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        ${generatePagination()}
    `;
    
    container.innerHTML = tableHTML;
}

// Generate pagination
function generatePagination() {
    if (totalPages <= 1) return '';
    
    let paginationHTML = '<nav><ul class="pagination">';
    
    // Previous button
    paginationHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link page-link-custom" href="#" data-page="${currentPage - 1}">Previous</a>
        </li>
    `;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage || i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            paginationHTML += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link page-link-custom" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
    }
    
    // Next button
    paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link page-link-custom" href="#" data-page="${currentPage + 1}">Next</a>
        </li>
    `;
    
    paginationHTML += '</ul></nav>';
    return paginationHTML;
}

// Change page
function changePage(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    loadUsers();
}

// Search users
function searchUsers() {
    const searchInput = document.getElementById('searchInput');
    searchQuery = searchInput.value.trim();
    currentPage = 1;
    loadUsers();
}

// Refresh users
function refreshUsers() {
    searchQuery = '';
    document.getElementById('searchInput').value = '';
    currentPage = 1;
    loadUsers();
}

// View user details
function viewUserDetails(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    const details = `
        <div class="user-details">
            <h5>User Details</h5>
            <p><strong>Name:</strong> ${user.firstName || ''} ${user.lastName || ''}</p>
            <p><strong>Username:</strong> ${user.username}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Mobile:</strong> ${user.mobile || 'Not provided'}</p>
            <p><strong>Role:</strong> ${user.role}</p>
            <p><strong>Status:</strong> ${user.isActive ? 'Active' : 'Inactive'}</p>
            <p><strong>Joined:</strong> ${formatDate(user.createdAt)}</p>
            <p><strong>Last Login:</strong> ${user.lastLogin ? formatDate(user.lastLogin) : 'Never'}</p>
        </div>
    `;
    
    alert(details);
}

// Toggle user status
async function toggleUserStatus(userId, currentStatus) {
    const action = currentStatus ? 'deactivate' : 'activate';
    const confirmMessage = `Are you sure you want to ${action} this user?`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/users/${userId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                isActive: !currentStatus
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update user status');
        }
        
        showSuccess(`User ${action}d successfully`);
        await loadUsers();
        
    } catch (error) {
        console.error('Error updating user status:', error);
        showError(error.message);
    }
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Show loading state
function showLoading(show) {
    const container = document.getElementById('usersTable');
    if (show) {
        container.innerHTML = `
            <div class="loading">
                <div class="spinner-border text-primary" role="status"></div>
                <p class="mt-3">Loading users...</p>
            </div>
        `;
    }
}

// Show success message
function showSuccess(message) {
    showNotification(message, 'success');
}

// Show error message
function showError(message) {
    showNotification(message, 'danger');
}

// Show notification
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
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Admin logout
async function adminLogout() {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            // Clear stored data
            currentAdmin = null;
            sessionStorage.removeItem('admin');
            localStorage.removeItem('adminAuthToken');
            
            // Redirect to admin login
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Admin logout error:', error);
        // Still redirect even if logout fails
        window.location.href = '/';
    }
}
