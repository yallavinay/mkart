// Admin Dashboard JavaScript
let currentSection = 'dashboard';
let currentData = {};

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', function() {
    checkAdminAuth();
    initializeEventListeners();
    loadDashboard();
});

// Check admin authentication
async function checkAdminAuth() {
    try {
        const response = await fetch('/api/users/profile');
        if (!response.ok) {
            window.location.href = '/login';
            return;
        }
        const user = await response.json();
        if (user.role !== 'admin') {
            alert('Access denied. Admin privileges required.');
            window.location.href = '/';
            return;
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/login';
    }
}

// Initialize event listeners
function initializeEventListeners() {
    // Sidebar navigation
    document.querySelectorAll('.sidebar-menu a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            if (section) {
                showSection(section);
            }
        });
    });

    // Logout
    document.getElementById('logout').addEventListener('click', function(e) {
        e.preventDefault();
        logout();
    });

    // Form submissions
    document.getElementById('addMedicineForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addMedicine();
    });

    // Search inputs
    document.getElementById('medicine-search').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchMedicines();
        }
    });

    document.getElementById('user-search').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchUsers();
        }
    });
}

// Show specific section
function showSection(section) {
    // Hide all sections
    document.querySelectorAll('[id$="-section"]').forEach(sec => {
        sec.style.display = 'none';
    });

    // Show selected section
    document.getElementById(section + '-section').style.display = 'block';

    // Update active menu item
    document.querySelectorAll('.sidebar-menu a').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-section="${section}"]`).classList.add('active');

    // Update page title
    const titles = {
        dashboard: 'Dashboard',
        medicines: 'Medicine Management',
        orders: 'Order Management',
        users: 'User Management',
        analytics: 'Analytics & Reports'
    };
    document.getElementById('page-title').textContent = titles[section];

    currentSection = section;

    // Load section data
    switch(section) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'medicines':
            loadMedicines();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'users':
            loadUsers();
            break;
        case 'analytics':
            loadAnalytics();
            break;
    }
}

// Load dashboard data
async function loadDashboard() {
    try {
        const response = await fetch('/api/admin/dashboard');
        if (!response.ok) throw new Error('Failed to load dashboard');
        
        const data = await response.json();
        currentData.dashboard = data;

        // Update stats
        document.getElementById('total-users').textContent = data.stats.totalUsers.toLocaleString();
        document.getElementById('total-medicines').textContent = data.stats.totalMedicines.toLocaleString();
        document.getElementById('total-orders').textContent = data.stats.totalOrders.toLocaleString();
        document.getElementById('total-revenue').textContent = '₹' + data.stats.totalRevenue.toLocaleString();

        // Load recent orders
        loadRecentOrders(data.recentOrders);
        
        // Load low stock medicines
        loadLowStockMedicines(data.lowStockMedicines);

    } catch (error) {
        console.error('Dashboard load error:', error);
        showAlert('Failed to load dashboard data', 'danger');
    }
}

// Load recent orders
function loadRecentOrders(orders) {
    const container = document.getElementById('recent-orders');
    
    if (orders.length === 0) {
        container.innerHTML = '<p class="text-muted text-center py-4">No recent orders</p>';
        return;
    }

    const html = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Order #</th>
                        <th>Customer</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${orders.map(order => `
                        <tr>
                            <td>${order.orderNumber}</td>
                            <td>${order.user.firstName} ${order.user.lastName}</td>
                            <td>₹${order.finalAmount}</td>
                            <td><span class="badge badge-${getStatusColor(order.orderStatus)}">${order.orderStatus}</span></td>
                            <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary" onclick="viewOrder('${order._id}')">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
}

// Load low stock medicines
function loadLowStockMedicines(medicines) {
    const container = document.getElementById('low-stock-medicines');
    
    if (medicines.length === 0) {
        container.innerHTML = '<p class="text-muted text-center py-4">All medicines are well stocked</p>';
        return;
    }

    const html = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Medicine</th>
                        <th>Brand</th>
                        <th>Stock</th>
                        <th>Category</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${medicines.map(medicine => `
                        <tr>
                            <td>${medicine.name}</td>
                            <td>${medicine.brand}</td>
                            <td><span class="badge badge-${medicine.stock <= 5 ? 'danger' : 'warning'}">${medicine.stock}</span></td>
                            <td>${medicine.category}</td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary" onclick="editMedicine('${medicine._id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
}

// Load medicines
async function loadMedicines() {
    const container = document.getElementById('medicines-list');
    container.innerHTML = `
        <div class="loading">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-3">Loading medicines...</p>
        </div>
    `;

    try {
        const response = await fetch('/api/admin/medicines');
        if (!response.ok) throw new Error('Failed to load medicines');
        
        const data = await response.json();
        currentData.medicines = data;

        displayMedicines(data.medicines);
        loadCategories();

    } catch (error) {
        console.error('Medicines load error:', error);
        container.innerHTML = '<div class="alert alert-danger">Failed to load medicines</div>';
    }
}

// Display medicines
function displayMedicines(medicines) {
    const container = document.getElementById('medicines-list');
    
    if (medicines.length === 0) {
        container.innerHTML = '<p class="text-muted text-center py-4">No medicines found</p>';
        return;
    }

    const html = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Brand</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${medicines.map(medicine => `
                        <tr>
                            <td>
                                <div class="d-flex align-items-center">
                                    <img src="${medicine.image}" alt="${medicine.name}" class="rounded me-2" style="width: 40px; height: 40px; object-fit: cover;">
                                    <div>
                                        <div class="fw-bold">${medicine.name}</div>
                                        <small class="text-muted">${medicine.strength || ''}</small>
                                    </div>
                                </div>
                            </td>
                            <td>${medicine.brand}</td>
                            <td><span class="badge badge-info">${medicine.category}</span></td>
                            <td>₹${medicine.sellingPrice}</td>
                            <td><span class="badge badge-${medicine.stock <= 10 ? 'danger' : 'success'}">${medicine.stock}</span></td>
                            <td><span class="badge badge-${medicine.isActive ? 'success' : 'danger'}">${medicine.isActive ? 'Active' : 'Inactive'}</span></td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary me-1" onclick="editMedicine('${medicine._id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" onclick="deleteMedicine('${medicine._id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
}

// Load categories for filter
async function loadCategories() {
    try {
        const response = await fetch('/api/medicines/categories/list');
        if (!response.ok) throw new Error('Failed to load categories');
        
        const categories = await response.json();
        const select = document.getElementById('category-filter');
        
        select.innerHTML = '<option value="">All Categories</option>' +
            categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    } catch (error) {
        console.error('Categories load error:', error);
    }
}

// Search medicines
async function searchMedicines() {
    const search = document.getElementById('medicine-search').value;
    const category = document.getElementById('category-filter').value;
    
    let url = '/api/admin/medicines?';
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (category) url += `category=${encodeURIComponent(category)}&`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Search failed');
        
        const data = await response.json();
        displayMedicines(data.medicines);
    } catch (error) {
        console.error('Search error:', error);
        showAlert('Search failed', 'danger');
    }
}

// Add medicine
async function addMedicine() {
    const form = document.getElementById('addMedicineForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    try {
        const response = await fetch('/api/admin/medicines', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to add medicine');
        }
        
        showAlert('Medicine added successfully', 'success');
        bootstrap.Modal.getInstance(document.getElementById('addMedicineModal')).hide();
        form.reset();
        loadMedicines();
        
    } catch (error) {
        console.error('Add medicine error:', error);
        showAlert(error.message, 'danger');
    }
}

// Load orders
async function loadOrders() {
    const container = document.getElementById('orders-list');
    container.innerHTML = `
        <div class="loading">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-3">Loading orders...</p>
        </div>
    `;

    try {
        const response = await fetch('/api/admin/orders');
        if (!response.ok) throw new Error('Failed to load orders');
        
        const data = await response.json();
        currentData.orders = data;

        displayOrders(data.orders);

    } catch (error) {
        console.error('Orders load error:', error);
        container.innerHTML = '<div class="alert alert-danger">Failed to load orders</div>';
    }
}

// Display orders
function displayOrders(orders) {
    const container = document.getElementById('orders-list');
    
    if (orders.length === 0) {
        container.innerHTML = '<p class="text-muted text-center py-4">No orders found</p>';
        return;
    }

    const html = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Order #</th>
                        <th>Customer</th>
                        <th>Items</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${orders.map(order => `
                        <tr>
                            <td>${order.orderNumber}</td>
                            <td>
                                <div>
                                    <div class="fw-bold">${order.user.firstName} ${order.user.lastName}</div>
                                    <small class="text-muted">${order.user.email}</small>
                                </div>
                            </td>
                            <td>${order.items.length} item(s)</td>
                            <td>₹${order.finalAmount}</td>
                            <td>
                                <select class="form-select form-select-sm" onchange="updateOrderStatus('${order._id}', this.value)">
                                    <option value="pending" ${order.orderStatus === 'pending' ? 'selected' : ''}>Pending</option>
                                    <option value="confirmed" ${order.orderStatus === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                                    <option value="processing" ${order.orderStatus === 'processing' ? 'selected' : ''}>Processing</option>
                                    <option value="shipped" ${order.orderStatus === 'shipped' ? 'selected' : ''}>Shipped</option>
                                    <option value="out-for-delivery" ${order.orderStatus === 'out-for-delivery' ? 'selected' : ''}>Out for Delivery</option>
                                    <option value="delivered" ${order.orderStatus === 'delivered' ? 'selected' : ''}>Delivered</option>
                                    <option value="cancelled" ${order.orderStatus === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                                </select>
                            </td>
                            <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary" onclick="viewOrder('${order._id}')">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
}

// Update order status
async function updateOrderStatus(orderId, status) {
    try {
        const response = await fetch(`/api/admin/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ orderStatus: status })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update order status');
        }
        
        showAlert('Order status updated successfully', 'success');
        loadOrders();
        
    } catch (error) {
        console.error('Update order status error:', error);
        showAlert(error.message, 'danger');
    }
}

// Load users
async function loadUsers() {
    const container = document.getElementById('users-list');
    container.innerHTML = `
        <div class="loading">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-3">Loading users...</p>
        </div>
    `;

    try {
        const response = await fetch('/api/admin/users');
        if (!response.ok) throw new Error('Failed to load users');
        
        const data = await response.json();
        currentData.users = data;

        displayUsers(data.users);

    } catch (error) {
        console.error('Users load error:', error);
        container.innerHTML = '<div class="alert alert-danger">Failed to load users</div>';
    }
}

// Display users
function displayUsers(users) {
    const container = document.getElementById('users-list');
    
    if (users.length === 0) {
        container.innerHTML = '<p class="text-muted text-center py-4">No users found</p>';
        return;
    }

    const html = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Mobile</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Joined</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr>
                            <td>
                                <div class="fw-bold">${user.firstName} ${user.lastName}</div>
                                <small class="text-muted">@${user.username}</small>
                            </td>
                            <td>${user.email}</td>
                            <td>${user.mobile}</td>
                            <td><span class="badge badge-${user.role === 'admin' ? 'danger' : 'info'}">${user.role}</span></td>
                            <td>
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" ${user.isActive ? 'checked' : ''} 
                                           onchange="updateUserStatus('${user._id}', this.checked)">
                                </div>
                            </td>
                            <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary" onclick="viewUser('${user._id}')">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
}

// Update user status
async function updateUserStatus(userId, isActive) {
    try {
        const response = await fetch(`/api/admin/users/${userId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ isActive })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update user status');
        }
        
        showAlert('User status updated successfully', 'success');
        
    } catch (error) {
        console.error('Update user status error:', error);
        showAlert(error.message, 'danger');
    }
}

// Load analytics
async function loadAnalytics() {
    const container = document.getElementById('analytics-content');
    container.innerHTML = `
        <div class="loading">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-3">Loading analytics...</p>
        </div>
    `;

    try {
        const period = document.getElementById('analytics-period').value;
        
        const [salesResponse, productsResponse] = await Promise.all([
            fetch(`/api/admin/analytics/sales?period=${period}`),
            fetch('/api/admin/analytics/products')
        ]);
        
        if (!salesResponse.ok || !productsResponse.ok) {
            throw new Error('Failed to load analytics');
        }
        
        const salesData = await salesResponse.json();
        const productsData = await productsResponse.json();
        
        displayAnalytics(salesData, productsData);

    } catch (error) {
        console.error('Analytics load error:', error);
        container.innerHTML = '<div class="alert alert-danger">Failed to load analytics</div>';
    }
}

// Display analytics
function displayAnalytics(salesData, productsData) {
    const container = document.getElementById('analytics-content');
    
    const html = `
        <div class="row">
            <div class="col-md-8">
                <div class="content-section">
                    <h6 class="section-title">Sales Trend</h6>
                    <canvas id="salesChart" width="400" height="200"></canvas>
                </div>
            </div>
            <div class="col-md-4">
                <div class="content-section">
                    <h6 class="section-title">Top Products</h6>
                    <div class="list-group">
                        ${productsData.slice(0, 5).map((product, index) => `
                            <div class="list-group-item d-flex justify-content-between align-items-center">
                                <div>
                                    <div class="fw-bold">${product.name}</div>
                                    <small class="text-muted">${product.brand}</small>
                                </div>
                                <span class="badge badge-primary">${product.totalQuantity}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Create sales chart
    createSalesChart(salesData);
}

// Create sales chart
function createSalesChart(salesData) {
    const ctx = document.getElementById('salesChart').getContext('2d');
    
    const labels = salesData.map(item => {
        const date = new Date(item._id.year, item._id.month - 1, item._id.day);
        return date.toLocaleDateString();
    });
    
    const data = salesData.map(item => item.totalSales);
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sales (₹)',
                data: data,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₹' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

// Utility functions
function getStatusColor(status) {
    const colors = {
        pending: 'warning',
        confirmed: 'info',
        processing: 'info',
        shipped: 'primary',
        'out-for-delivery': 'primary',
        delivered: 'success',
        cancelled: 'danger'
    };
    return colors[status] || 'secondary';
}

function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 5000);
}

function refreshData() {
    showSection(currentSection);
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        fetch('/api/users/logout', { method: 'POST' })
            .then(() => {
                window.location.href = '/login';
            })
            .catch(error => {
                console.error('Logout error:', error);
                window.location.href = '/login';
            });
    }
}

// Placeholder functions for future implementation
function viewOrder(orderId) {
    showAlert('Order details view coming soon', 'info');
}

function editMedicine(medicineId) {
    showAlert('Medicine editing coming soon', 'info');
}

function deleteMedicine(medicineId) {
    if (confirm('Are you sure you want to delete this medicine?')) {
        showAlert('Medicine deletion coming soon', 'info');
    }
}

function viewUser(userId) {
    showAlert('User details view coming soon', 'info');
}

function searchUsers() {
    const search = document.getElementById('user-search').value;
    showAlert('User search coming soon', 'info');
}
