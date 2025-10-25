// Admin Orders Management JavaScript
let currentAdmin = null;
let orders = [];
let currentPage = 1;
let totalPages = 1;
let searchQuery = '';
let statusFilter = '';
let editingOrderId = null;

// Initialize orders management
document.addEventListener('DOMContentLoaded', function() {
    initializeOrdersPage();
});

async function initializeOrdersPage() {
    // Check admin authentication
    const isAuthenticated = await checkAdminAuth();
    if (!isAuthenticated) {
        window.location.href = '/';
        return;
    }

    // Load orders
    await loadOrders();
    
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

    // Filter button
    const filterBtn = document.getElementById('filterBtn');
    if (filterBtn) {
        filterBtn.addEventListener('click', filterOrders);
    }

    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshOrders);
    }

    // Update status button
    const updateStatusBtn = document.getElementById('updateStatusBtn');
    if (updateStatusBtn) {
        updateStatusBtn.addEventListener('click', updateOrderStatus);
    }

    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                filterOrders();
            }
        });
    }

    // Event delegation for dynamically created buttons
    document.addEventListener('click', function(e) {
        // View order details button
        if (e.target.closest('.btn-view-order')) {
            const orderId = parseInt(e.target.closest('.btn-view-order').dataset.id);
            viewOrderDetails(orderId);
        }
        // Open status modal button
        if (e.target.closest('.btn-update-status')) {
            const orderId = parseInt(e.target.closest('.btn-update-status').dataset.id);
            openStatusModal(orderId);
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

// Load orders from API
async function loadOrders() {
    try {
        showLoading(true);
        
        const params = new URLSearchParams({
            page: currentPage,
            limit: 10
        });
        
        if (searchQuery) {
            params.append('search', searchQuery);
        }
        
        if (statusFilter) {
            params.append('status', statusFilter);
        }
        
        const response = await fetch(`/api/admin/orders?${params}`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to load orders');
        }
        
        const data = await response.json();
        orders = data.orders || [];
        totalPages = data.pagination?.totalPages || 1;
        
        displayOrders();
        
    } catch (error) {
        console.error('Error loading orders:', error);
        showError('Failed to load orders');
    } finally {
        showLoading(false);
    }
}

// Display orders in table
function displayOrders() {
    const container = document.getElementById('ordersTable');
    
    if (orders.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-shopping-cart" style="font-size: 3rem; color: #bdc3c7; margin-bottom: 1rem;"></i>
                <h5>No orders found</h5>
                <p class="text-muted">Orders will appear here when customers place them</p>
            </div>
        `;
        return;
    }
    
    const tableHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>Order</th>
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
                        <td>
                            <div class="order-details">
                                <strong>#${order.orderNumber || order.id}</strong>
                                ${order.trackingNumber ? `<br><small class="text-muted">Tracking: ${order.trackingNumber}</small>` : ''}
                            </div>
                        </td>
                        <td>
                            <div>
                                <strong>${order.user?.firstName || ''} ${order.user?.lastName || ''}</strong>
                                <br>
                                <small class="text-muted">${order.user?.email || ''}</small>
                            </div>
                        </td>
                        <td>
                            <div>
                                <strong>${order.items?.length || 0} items</strong>
                                ${order.items && order.items.length > 0 ? 
                                    `<br><small class="text-muted">${order.items[0].medicine?.name || ''}${order.items.length > 1 ? ' +' + (order.items.length - 1) + ' more' : ''}</small>` : ''
                                }
                            </div>
                        </td>
                        <td>
                            <div class="order-amount">
                                ₹${order.finalAmount || order.totalAmount || 0}
                            </div>
                        </td>
                        <td>
                            <span class="status-badge status-${order.orderStatus || 'pending'}">
                                ${(order.orderStatus || 'pending').toUpperCase()}
                            </span>
                        </td>
                        <td>
                            <small>${formatDate(order.createdAt)}</small>
                        </td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn btn-info btn-sm btn-view-order" data-id="${order.id}" title="View Details">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-warning btn-sm btn-update-status" data-id="${order.id}" title="Update Status">
                                    <i class="fas fa-edit"></i>
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
    loadOrders();
}

// Filter orders
function filterOrders() {
    const searchInput = document.getElementById('searchInput');
    const statusFilterSelect = document.getElementById('statusFilter');
    
    searchQuery = searchInput.value.trim();
    statusFilter = statusFilterSelect.value;
    currentPage = 1;
    loadOrders();
}

// Refresh orders
function refreshOrders() {
    searchQuery = '';
    statusFilter = '';
    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = '';
    currentPage = 1;
    loadOrders();
}

// View order details
function viewOrderDetails(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const odOrderNumber = document.getElementById('odOrderNumber');
    const odDate = document.getElementById('odDate');
    const odStatusBadge = document.getElementById('odStatusBadge');
    const odPaymentBadge = document.getElementById('odPaymentBadge');
    const odShippingAddress = document.getElementById('odShippingAddress');
    const odBillingAddress = document.getElementById('odBillingAddress');
    const odItemsBody = document.getElementById('odItemsBody');
    const odSubtotal = document.getElementById('odSubtotal');
    const odShippingCharges = document.getElementById('odShippingCharges');
    const odDiscount = document.getElementById('odDiscount');
    const odFinalAmount = document.getElementById('odFinalAmount');

    odOrderNumber.textContent = `Order #${order.orderNumber || order.id}`;
    odDate.textContent = formatDate(order.createdAt);
    const status = (order.orderStatus || 'pending').toLowerCase();
    odStatusBadge.className = `badge ${getStatusBadgeClass(status)}`;
    odStatusBadge.textContent = status.toUpperCase();
    const pm = (order.paymentMethod || '').toUpperCase();
    const ps = (order.paymentStatus || 'pending').toUpperCase();
    odPaymentBadge.textContent = `${pm || 'PAYMENT'} • ${ps}`;

    const sa = order.shippingAddress || {};
    const ba = order.billingAddress || {};
    odShippingAddress.innerHTML = renderAddress(sa);
    odBillingAddress.innerHTML = renderAddress(ba);

    odItemsBody.innerHTML = (order.items || []).map(item => `
      <tr>
        <td>
          <div class="d-flex align-items-center">
            <img src="${item.medicine?.image || item.medicine?.image_url || 'https://via.placeholder.com/48?text=No+Img'}" alt="${item.medicine?.name || 'Medicine'}" style="width:48px;height:48px;object-fit:cover;border-radius:6px;margin-right:8px;">
            <div>
              ${item.medicine?.name || 'Medicine'}
              <div class="text-muted small">${item.medicine?.brand || ''}</div>
            </div>
          </div>
        </td>
        <td class="text-end">₹${Number(item.price).toFixed(2)}</td>
        <td class="text-end">${item.quantity}</td>
        <td class="text-end">₹${(Number(item.price) * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    odSubtotal.textContent = `₹${Number(order.totalAmount || 0).toFixed(2)}`;
    odShippingCharges.textContent = `₹${Number(order.shippingCharges || 0).toFixed(2)}`;
    odDiscount.textContent = `₹${Number(order.discountAmount || 0).toFixed(2)}`;
    odFinalAmount.textContent = `₹${Number(order.finalAmount || 0).toFixed(2)}`;

    const modal = new bootstrap.Modal(document.getElementById('orderDetailsModal'));
    modal.show();
}

function renderAddress(a) {
    const fn = `${a.firstName || ''} ${a.lastName || ''}`.trim();
    const line1 = a.address || a.line1 || '';
    const district = a.district || '';
    const state = a.state || '';
    const pin = a.pinCode || a.pincode || '';
    const mobile = a.mobile || '';
    const type = (a.addressType || a.type || '').toString().toUpperCase();
    return `
      ${type ? `<div class="mb-1"><span class="badge bg-light text-dark">${type}</span></div>` : ''}
      ${fn ? `${fn}<br>` : ''}
      ${line1}<br>
      ${district}${district && state ? ', ' : ''}${state}${pin ? ` - ${pin}` : ''}
      ${mobile ? `<br>📞 ${mobile}` : ''}
    `;
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'pending': return 'bg-warning text-dark';
        case 'confirmed': return 'bg-info text-dark';
        case 'processing': return 'bg-secondary';
        case 'shipped': return 'bg-primary';
        case 'out-for-delivery': return 'bg-primary';
        case 'delivered': return 'bg-success';
        case 'cancelled': return 'bg-danger';
        default: return 'bg-secondary';
    }
}

// Open status modal
function openStatusModal(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    editingOrderId = orderId;
    document.getElementById('orderStatus').value = order.orderStatus || 'pending';
    document.getElementById('trackingNumber').value = order.trackingNumber || '';
    
    const modal = new bootstrap.Modal(document.getElementById('statusModal'));
    modal.show();
}

// Update order status
async function updateOrderStatus() {
    try {
        const form = document.getElementById('statusForm');
        const formData = new FormData(form);
        
        const statusData = {
            orderStatus: formData.get('orderStatus'),
            trackingNumber: formData.get('trackingNumber')
        };
        
        if (!statusData.orderStatus) {
            showError('Please select an order status');
            return;
        }
        
        const response = await fetch(`/api/admin/orders/${editingOrderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(statusData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update order status');
        }
        
        showSuccess('Order status updated successfully');
        
        // Close modal and reload orders
        const modal = bootstrap.Modal.getInstance(document.getElementById('statusModal'));
        modal.hide();
        
        await loadOrders();
        
    } catch (error) {
        console.error('Error updating order status:', error);
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
    const container = document.getElementById('ordersTable');
    if (show) {
        container.innerHTML = `
            <div class="loading">
                <div class="spinner-border text-primary" role="status"></div>
                <p class="mt-3">Loading orders...</p>
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
