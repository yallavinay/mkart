// Admin Medicines Management JavaScript
let currentAdmin = null;
let medicines = [];
let currentPage = 1;
let totalPages = 1;
let searchQuery = '';
let editingMedicineId = null;
let selectedImageDataUrl = '';

// Initialize medicines management
document.addEventListener('DOMContentLoaded', function() {
    initializeMedicinesPage();
});

async function initializeMedicinesPage() {
    // Check admin authentication
    const isAuthenticated = await checkAdminAuth();
    if (!isAuthenticated) {
        window.location.href = '/';
        return;
    }

    // Load medicines
    await loadMedicines();
    
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
        searchBtn.addEventListener('click', searchMedicines);
    }

    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchMedicines();
            }
        });
    }

    // Add medicine button
    const addMedicineBtn = document.getElementById('addMedicineBtn');
    if (addMedicineBtn) {
        addMedicineBtn.addEventListener('click', openAddMedicineModal);
    }

    // Save medicine button
    const saveMedicineBtn = document.getElementById('saveMedicineBtn');
    if (saveMedicineBtn) {
        saveMedicineBtn.addEventListener('click', saveMedicine);
    }

    // Image file change and preview
    const imageFileInput = document.getElementById('imageFile');
    if (imageFileInput) {
        imageFileInput.addEventListener('change', async (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) {
                showError('Please select a valid image file');
                e.target.value = '';
                return;
            }
            // Optional size check ~2MB
            if (file.size > 2 * 1024 * 1024) {
                showError('Image too large. Please select an image under 2MB');
                e.target.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                selectedImageDataUrl = reader.result;
                const preview = document.getElementById('imagePreview');
                if (preview && selectedImageDataUrl) {
                    preview.src = selectedImageDataUrl;
                }
            };
            reader.readAsDataURL(file);
        });
    }

    // Event delegation for dynamically created buttons
    document.addEventListener('click', function(e) {
        // Toggle status button
        if (e.target.closest('.btn-toggle-status')) {
            const medicineId = parseInt(e.target.closest('.btn-toggle-status').dataset.id);
            const isActive = e.target.closest('.btn-toggle-status').dataset.active === 'true';
            toggleMedicineStatus(medicineId, isActive);
        }
        // Edit button
        if (e.target.closest('.btn-edit-medicine')) {
            const medicineId = parseInt(e.target.closest('.btn-edit-medicine').dataset.id);
            editMedicine(medicineId);
        }
        // Delete button
        if (e.target.closest('.btn-delete-medicine')) {
            const medicineId = parseInt(e.target.closest('.btn-delete-medicine').dataset.id);
            deleteMedicine(medicineId);
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

// Load medicines from API
async function loadMedicines() {
    try {
        showLoading(true);
        
        const params = new URLSearchParams({
            page: currentPage,
            limit: 10
        });
        
        if (searchQuery) {
            params.append('search', searchQuery);
        }
        
        const response = await fetch(`/api/admin/medicines?${params}`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to load medicines');
        }
        
        const data = await response.json();
        medicines = data.medicines || [];
        totalPages = data.pagination?.totalPages || 1;
        
        displayMedicines();
        
    } catch (error) {
        console.error('Error loading medicines:', error);
        showError('Failed to load medicines');
    } finally {
        showLoading(false);
    }
}

// Display medicines in table
function displayMedicines() {
    const container = document.getElementById('medicinesTable');
    
    if (medicines.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-pills" style="font-size: 3rem; color: #bdc3c7; margin-bottom: 1rem;"></i>
                <h5>No medicines found</h5>
                <p class="text-muted">Add your first medicine to get started</p>
            </div>
        `;
        return;
    }
    
    const tableHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>Medicine</th>
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
                            <div>
                                <strong>${medicine.name}</strong>
                                <br>
                                <small class="text-muted">${medicine.brand}</small>
                                ${medicine.genericName ? `<br><small class="text-info">${medicine.genericName}</small>` : ''}
                            </div>
                        </td>
                        <td>
                            <span class="badge bg-info">${medicine.category}</span>
                        </td>
                        <td>
                            <div>
                                <strong>₹${medicine.sellingPrice}</strong>
                                ${medicine.mrp > medicine.sellingPrice ? 
                                    `<br><small class="text-muted text-decoration-line-through">₹${medicine.mrp}</small>` : ''
                                }
                            </div>
                        </td>
                        <td>
                            <span class="${getStockClass(medicine.stock)}">
                                ${medicine.stock} units
                            </span>
                        </td>
                        <td>
                            <span class="status-badge ${medicine.isActive ? 'status-active' : 'status-inactive'}">
                                ${medicine.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn ${medicine.isActive ? 'btn-secondary' : 'btn-success'} btn-sm btn-toggle-status" 
                                        data-id="${medicine.id}" 
                                        data-active="${medicine.isActive}"
                                        title="${medicine.isActive ? 'Deactivate' : 'Activate'}">
                                    <i class="fas fa-${medicine.isActive ? 'toggle-off' : 'toggle-on'}"></i>
                                </button>
                                <button class="btn btn-warning btn-sm btn-edit-medicine" data-id="${medicine.id}">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-danger btn-sm btn-delete-medicine" data-id="${medicine.id}">
                                    <i class="fas fa-trash"></i>
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

// Get stock status class
function getStockClass(stock) {
    if (stock === 0) return 'stock-out';
    if (stock <= 10) return 'stock-low';
    return '';
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
    loadMedicines();
}

// Search medicines
function searchMedicines() {
    const searchInput = document.getElementById('searchInput');
    searchQuery = searchInput.value.trim();
    currentPage = 1;
    loadMedicines();
}

// Open add medicine modal
function openAddMedicineModal() {
    editingMedicineId = null;
    document.getElementById('modalTitle').textContent = 'Add New Medicine';
    document.getElementById('medicineForm').reset();
    selectedImageDataUrl = '';
    const preview = document.getElementById('imagePreview');
    if (preview) preview.src = 'https://via.placeholder.com/120?text=Preview';
    const fileInput = document.getElementById('imageFile');
    if (fileInput) fileInput.value = '';
    
    const modal = new bootstrap.Modal(document.getElementById('medicineModal'));
    modal.show();
}

// Edit medicine
function editMedicine(medicineId) {
    const medicine = medicines.find(m => m.id === medicineId);
    if (!medicine) return;
    
    editingMedicineId = medicineId;
    document.getElementById('modalTitle').textContent = 'Edit Medicine';
    
    // Fill form with medicine data
    document.getElementById('medicineName').value = medicine.name || '';
    document.getElementById('medicineBrand').value = medicine.brand || '';
    document.getElementById('genericName').value = medicine.genericName || '';
    document.getElementById('category').value = medicine.category || '';
    document.getElementById('mrp').value = medicine.mrp || '';
    document.getElementById('sellingPrice').value = medicine.sellingPrice || '';
    document.getElementById('stock').value = medicine.stock || '';
    document.getElementById('batchNumber').value = medicine.batchNumber || '';
    document.getElementById('expiryDate').value = medicine.expiryDate || '';
    document.getElementById('manufacturer').value = medicine.manufacturer || '';
    document.getElementById('description').value = medicine.description || '';
    document.getElementById('requiresPrescription').checked = medicine.requiresPrescription || false;
    selectedImageDataUrl = '';
    const preview = document.getElementById('imagePreview');
    if (preview) {
        preview.src = medicine.image || medicine.image_url || 'https://via.placeholder.com/120?text=Preview';
    }
    const fileInput = document.getElementById('imageFile');
    if (fileInput) fileInput.value = '';
    
    const modal = new bootstrap.Modal(document.getElementById('medicineModal'));
    modal.show();
}

// Save medicine
async function saveMedicine() {
    try {
        const form = document.getElementById('medicineForm');
        const formData = new FormData(form);
        const imageFromForm = selectedImageDataUrl; // data URL from file input if chosen
        const medicineData = {
            name: formData.get('name'),
            brand: formData.get('brand'),
            genericName: formData.get('genericName'),
            category: formData.get('category'),
            mrp: parseFloat(formData.get('mrp')),
            sellingPrice: parseFloat(formData.get('sellingPrice')),
            stock: parseInt(formData.get('stock')),
            batchNumber: formData.get('batchNumber'),
            expiryDate: formData.get('expiryDate'),
            manufacturer: formData.get('manufacturer') || 'Unknown', // Provide default
            description: formData.get('description'),
            prescriptionRequired: formData.get('requiresPrescription') === 'on', // Match model field name
            // Required fields with defaults
            dosageForm: 'tablet', // Default dosage form
            image: imageFromForm || undefined
        };

        // If editing and no new image selected, try to keep existing image
        if (editingMedicineId && !medicineData.image) {
            const existing = medicines.find(m => m.id === editingMedicineId);
            medicineData.image = existing?.image || existing?.image_url || 'https://via.placeholder.com/300x300?text=Medicine';
        }
        // Fallback placeholder for new items with no image chosen
        if (!editingMedicineId && !medicineData.image) {
            medicineData.image = 'https://via.placeholder.com/300x300?text=Medicine';
        }
        
        // Validate required fields
        if (!medicineData.name || !medicineData.brand || !medicineData.category || 
            !medicineData.mrp || !medicineData.sellingPrice || !medicineData.stock || 
            !medicineData.batchNumber || !medicineData.expiryDate) {
            showError('Please fill in all required fields');
            return;
        }
        
        let response;
        if (editingMedicineId) {
            // Update existing medicine
            response = await fetch(`/api/admin/medicines/${editingMedicineId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(medicineData)
            });
        } else {
            // Add new medicine
            response = await fetch('/api/admin/medicines', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(medicineData)
            });
        }
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to save medicine');
        }
        
        showSuccess(editingMedicineId ? 'Medicine updated successfully' : 'Medicine added successfully');
        
        // Close modal and reload medicines
        const modal = bootstrap.Modal.getInstance(document.getElementById('medicineModal'));
        modal.hide();
        
        await loadMedicines();
        
    } catch (error) {
        console.error('Error saving medicine:', error);
        showError(error.message);
    }
}

// Toggle medicine status
async function toggleMedicineStatus(medicineId, currentStatus) {
    const action = currentStatus ? 'deactivate' : 'activate';
    const confirmMessage = `Are you sure you want to ${action} this medicine?`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/medicines/${medicineId}/status`, {
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
            throw new Error(error.message || 'Failed to update medicine status');
        }
        
        showSuccess(`Medicine ${action}d successfully`);
        await loadMedicines();
        
    } catch (error) {
        console.error('Error updating medicine status:', error);
        showError(error.message);
    }
}

// Delete medicine
async function deleteMedicine(medicineId) {
    if (!confirm('Are you sure you want to delete this medicine? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/medicines/${medicineId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete medicine');
        }
        
        showSuccess('Medicine deleted successfully');
        await loadMedicines();
        
    } catch (error) {
        console.error('Error deleting medicine:', error);
        showError(error.message);
    }
}

// Show loading state
function showLoading(show) {
    const container = document.getElementById('medicinesTable');
    if (show) {
        container.innerHTML = `
            <div class="loading">
                <div class="spinner-border text-primary" role="status"></div>
                <p class="mt-3">Loading medicines...</p>
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
