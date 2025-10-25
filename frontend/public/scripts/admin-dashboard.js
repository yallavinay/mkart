// Admin Dashboard JavaScript
let currentAdmin = null;

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeAdminDashboard();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', adminLogout);
    }

    // Action cards and buttons
    document.addEventListener('click', function(e) {
        const actionCard = e.target.closest('[data-action]');
        if (actionCard) {
            const action = actionCard.getAttribute('data-action');
            handleAction(action);
        }
    });
}

// Handle action based on type
function handleAction(action) {
    switch(action) {
        case 'medicines':
            manageMedicines();
            break;
        case 'orders':
            manageOrders();
            break;
        case 'users':
            manageUsers();
            break;
        case 'analytics':
            viewAnalytics();
            break;
        default:
            console.log('Unknown action:', action);
    }
}

async function initializeAdminDashboard() {
    // Check admin authentication
    const isAuthenticated = await checkAdminAuth();
    if (!isAuthenticated) {
        window.location.href = '/';
        return;
    }

    // Load dashboard data
    await loadDashboardData();
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
    document.getElementById('welcomeName').textContent = admin.firstName || 'Admin';
    document.getElementById('adminName').textContent = admin.firstName + ' ' + admin.lastName;
    document.getElementById('adminAvatar').textContent = (admin.firstName || 'A').charAt(0).toUpperCase();
}

// Load dashboard data
async function loadDashboardData() {
    try {
        await Promise.all([
            loadStatistics(),
            loadRecentOrders()
        ]);
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
        showError('Failed to load dashboard data');
    }
}

// Load statistics
async function loadStatistics() {
    try {
        const response = await fetch('/api/admin/dashboard', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to load statistics');
        }
        
        const data = await response.json();
        displayStatistics(data);
    } catch (error) {
        console.error('Statistics load error:', error);
        displayStatistics({
            totalUsers: 0,
            totalMedicines: 0,
            totalOrders: 0,
            totalRevenue: 0
        });
    }
}

// Display statistics
function displayStatistics(data) {
    const stats = data.stats || data;
    const statsContainer = document.getElementById('adminStats');
    
    statsContainer.innerHTML = `
        <div class="admin-stat-card">
            <div class="admin-stat-header">
                <div class="admin-stat-title">Total Users</div>
                <div class="admin-stat-icon users">
                    <i class="fas fa-users"></i>
                </div>
            </div>
            <div class="admin-stat-value">${stats.totalUsers || 0}</div>
            <div class="admin-stat-change positive">
                <i class="fas fa-arrow-up"></i>
                Active Users
            </div>
        </div>
        
        <div class="admin-stat-card">
            <div class="admin-stat-header">
                <div class="admin-stat-title">Total Medicines</div>
                <div class="admin-stat-icon medicines">
                    <i class="fas fa-pills"></i>
                </div>
            </div>
            <div class="admin-stat-value">${stats.totalMedicines || 0}</div>
            <div class="admin-stat-change positive">
                <i class="fas fa-check-circle"></i>
                In Stock
            </div>
        </div>
        
        <div class="admin-stat-card">
            <div class="admin-stat-header">
                <div class="admin-stat-title">Total Orders</div>
                <div class="admin-stat-icon orders">
                    <i class="fas fa-shopping-cart"></i>
                </div>
            </div>
            <div class="admin-stat-value">${stats.totalOrders || 0}</div>
            <div class="admin-stat-change ${stats.pendingOrders > 0 ? 'negative' : 'positive'}">
                <i class="fas fa-${stats.pendingOrders > 0 ? 'exclamation-triangle' : 'check-circle'}"></i>
                ${stats.pendingOrders || 0} Pending
            </div>
        </div>
        
        <div class="admin-stat-card">
            <div class="admin-stat-header">
                <div class="admin-stat-title">Total Revenue</div>
                <div class="admin-stat-icon revenue">
                    <i class="fas fa-rupee-sign"></i>
                </div>
            </div>
            <div class="admin-stat-value">₹${(stats.totalRevenue || 0).toLocaleString()}</div>
            <div class="admin-stat-change positive">
                <i class="fas fa-chart-line"></i>
                From Delivered Orders
            </div>
        </div>
    `;
}

// Load recent orders
async function loadRecentOrders() {
    try {
        const response = await fetch('/api/admin/orders?limit=5', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to load recent orders');
        }
        
        const data = await response.json();
        displayRecentOrders(data.orders || []);
    } catch (error) {
        console.error('Recent orders load error:', error);
        displayRecentOrders([]);
    }
}

// Display recent orders
function displayRecentOrders(orders) {
    const ordersContainer = document.getElementById('recentOrders');
    
    if (orders.length === 0) {
        ordersContainer.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #7f8c8d;">
                <i class="fas fa-shopping-cart" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p>No recent orders found</p>
            </div>
        `;
        return;
    }
    
    ordersContainer.innerHTML = orders.map(order => {
        const statusColor = {
            'pending': '#f39c12',
            'confirmed': '#3498db',
            'shipped': '#9b59b6',
            'delivered': '#27ae60',
            'cancelled': '#e74c3c'
        }[order.orderStatus] || '#7f8c8d';
        
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid #ecf0f1;">
                <div>
                    <div style="font-weight: 600; color: var(--admin-primary);">Order #${order.orderNumber}</div>
                    <div style="font-size: 0.9rem; color: #7f8c8d;">
                        ${order.user?.firstName || order.user?.username} ${order.user?.lastName || ''}
                    </div>
                    <div style="font-size: 0.8rem; color: #95a5a6;">
                        ${new Date(order.createdAt).toLocaleDateString()}
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: 600; color: var(--admin-success);">₹${order.finalAmount || order.totalAmount}</div>
                    <div style="font-size: 0.9rem; color: ${statusColor}; font-weight: 500;">
                        ${order.orderStatus?.toUpperCase() || 'UNKNOWN'}
                    </div>
                    <div style="font-size: 0.8rem; color: #95a5a6;">
                        ${order.items?.length || 0} items
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Admin action functions
function manageMedicines() {
    console.log('Manage Medicines clicked');
    alert('Manage Medicines clicked - redirecting...');
    // Redirect to medicines management page
    window.location.href = '/admin-medicines';
}

function manageOrders() {
    console.log('Manage Orders clicked');
    // Redirect to orders management page
    window.location.href = '/admin-orders';
}

function manageUsers() {
    console.log('Manage Users clicked');
    alert('Manage Users clicked - redirecting...');
    // Redirect to users management page
    window.location.href = '/admin-users';
}

function viewAnalytics() {
    console.log('View Analytics clicked');
    // For now, show alert - can be expanded to open analytics page
    alert('Analytics feature coming soon!');
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

// Show error message
function showError(message) {
    const alertContainer = document.querySelector('.admin-container');
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
    
    alertContainer.insertBefore(alertDiv, alertContainer.firstChild);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Show success message
function showSuccess(message) {
    const alertContainer = document.querySelector('.admin-container');
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
    
    alertContainer.insertBefore(alertDiv, alertContainer.firstChild);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 3000);
}
