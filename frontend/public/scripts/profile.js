// Profile page functionality
let profileUser = null;
let addresses = [];
let editingAddressId = null;

document.addEventListener('DOMContentLoaded', async () => {
    await checkProfileAuthentication();
    await loadProfile();
    await loadAddresses();
    setupProfileEventListeners();
});

// Check if user is authenticated
async function checkProfileAuthentication() {
    try {
        const response = await fetch('/api/users/session', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            showProfileError('Please login to view your profile');
            setTimeout(() => window.location.href = '/login', 2000);
            return false;
        }

// Open profile modal
function openProfileModal() {
    // Prefill from the currently displayed profile values if available
    const firstName = document.querySelector('#profileInfo .info-item:nth-child(3) .info-value')?.textContent || '';
    const lastName = document.querySelector('#profileInfo .info-item:nth-child(4) .info-value')?.textContent || '';
    const mobile = document.querySelector('#profileInfo .info-item:nth-child(5) .info-value')?.textContent || '';
    const form = document.getElementById('profileForm');
    if (form) {
        form.querySelector('#profileFirstName').value = firstName !== 'N/A' ? firstName : '';
        form.querySelector('#profileLastName').value = lastName !== 'N/A' ? lastName : '';
        form.querySelector('#profileMobile').value = mobile !== 'N/A' ? mobile : '';
    }
    const modal = new bootstrap.Modal(document.getElementById('profileModal'));
    modal.show();
}

// Save profile
async function saveProfile() {
    const form = document.getElementById('profileForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    const payload = {
        firstName: document.getElementById('profileFirstName').value.trim(),
        lastName: document.getElementById('profileLastName').value.trim(),
        mobile: document.getElementById('profileMobile').value.trim()
    };
    try {
        const resp = await fetch('/api/users/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
        });
        if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to update profile');
        }
        showProfileSuccess('Profile updated');
        const modal = bootstrap.Modal.getInstance(document.getElementById('profileModal'));
        modal?.hide();
        await loadProfile();
    } catch (e) {
        console.error('Profile update error:', e);
        showProfileError(e.message);
    }
}
        
        const data = await response.json();
        profileUser = data.user;
        return true;
    } catch (error) {
        console.error('Authentication check failed:', error);
        showProfileError('Authentication failed. Redirecting to login...');
        setTimeout(() => window.location.href = '/login', 2000);
        return false;
    }
}

// Load user profile
async function loadProfile() {
    try {
        const response = await fetch('/api/users/profile', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to load profile');
        }
        
        const user = await response.json();
        console.log('Profile data loaded:', user);
        displayProfile(user);
    } catch (error) {
        console.error('Error loading profile:', error);
        showProfileError('Failed to load profile information');
    }
}

// Display profile information
function displayProfile(user) {
    const profileInfo = document.getElementById('profileInfo');
    
    profileInfo.innerHTML = `
        <div class="info-item">
            <div class="info-label">Username</div>
            <div class="info-value">${user.username || 'N/A'}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Email</div>
            <div class="info-value">${user.email || 'N/A'}</div>
        </div>
        <div class="info-item">
            <div class="info-label">First Name</div>
            <div class="info-value">${user.firstName || 'N/A'}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Last Name</div>
            <div class="info-value">${user.lastName || 'N/A'}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Mobile</div>
            <div class="info-value">${user.mobile || 'N/A'}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Member Since</div>
            <div class="info-value">${new Date(user.createdAt).toLocaleDateString()}</div>
        </div>
    `;
}

// Load addresses
async function loadAddresses() {
    try {
        const response = await fetch('/api/users/addresses', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to load addresses');
        }
        
        addresses = await response.json();
        console.log('Addresses loaded:', addresses);
        displayAddresses();
    } catch (error) {
        console.error('Error loading addresses:', error);
        showProfileError('Failed to load addresses');
    }
}

// Display addresses
function displayAddresses() {
    const container = document.getElementById('addressesContainer');
    
    if (addresses.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-map-marker-alt fa-3x text-muted mb-3"></i>
                <p class="text-muted">No addresses saved yet</p>
                <p class="text-muted">Click "Add New Address" to add your first address</p>
            </div>
        `;
        return;
    }
    
    const html = addresses.map(addr => {
        const type = (((addr && (addr.addressType || addr.type)) || 'home') + '').toUpperCase();
        const id = addr?.id ?? addr?._id ?? '';
        const firstName = addr?.firstName || '';
        const lastName = addr?.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim() || 'N/A';
        const line1 = addr?.address || addr?.line1 || 'N/A';
        const district = addr?.district || '';
        const state = addr?.state || '';
        const pinCode = addr?.pinCode || addr?.pincode || '';
        const landmark = addr?.landmark || '';
        const mobile = addr?.mobile || addr?.phone || 'N/A';
        const isDefault = !!addr?.isDefault;

        return `
        <div class="address-card ${isDefault ? 'default' : ''}">
            ${isDefault ? '<span class="default-badge">Default</span>' : ''}
            <h5>${type}</h5>
            <p class="mb-2"><strong>${fullName}</strong></p>
            <p class="mb-1">${line1}</p>
            <p class="mb-1">${district}${district && state ? ', ' : ''}${state}${pinCode ? ` - ${pinCode}` : ''}</p>
            ${landmark ? `<p class="mb-1">Landmark: ${landmark}</p>` : ''}
            <p class="mb-3"><i class="fas fa-phone"></i> ${mobile}</p>
            <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-primary btn-edit-address" data-id="${id}">
                    <i class="fas fa-edit"></i> Edit
                </button>
                ${!isDefault ? `
                    <button class="btn btn-sm btn-outline-success btn-set-default-address" data-id="${id}">
                        <i class="fas fa-check"></i> Set as Default
                    </button>
                ` : ''}
                <button class="btn btn-sm btn-outline-danger btn-delete-address" data-id="${id}">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>`;
    }).join('');
    
    container.innerHTML = html;
}

// Setup event listeners
function setupProfileEventListeners() {
    const addAddressBtn = document.getElementById('addAddressBtn');
    if (addAddressBtn) {
        addAddressBtn.addEventListener('click', openAddressModal);
    }
    
    const saveAddressBtn = document.getElementById('saveAddressBtn');
    if (saveAddressBtn) {
        saveAddressBtn.addEventListener('click', saveAddress);
    }

    // Edit profile
    const editProfileBtn = document.getElementById('editProfileBtn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', openProfileModal);
    }
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', saveProfile);
    }

    // Event delegation for address actions to satisfy CSP (no inline handlers)
    const addressesContainer = document.getElementById('addressesContainer');
    if (addressesContainer) {
        addressesContainer.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.btn-edit-address');
            const setDefaultBtn = e.target.closest('.btn-set-default-address');
            const deleteBtn = e.target.closest('.btn-delete-address');
            if (editBtn) {
                const id = editBtn.getAttribute('data-id');
                if (id) editAddress(id);
                return;
            }
            if (setDefaultBtn) {
                const id = setDefaultBtn.getAttribute('data-id');
                if (id) setDefaultAddress(id);
                return;
            }
            if (deleteBtn) {
                const id = deleteBtn.getAttribute('data-id');
                if (id) deleteAddress(id);
            }
        });
    }
}

// Open address modal
function openAddressModal() {
    editingAddressId = null;
    document.getElementById('addressModalTitle').textContent = 'Add New Address';
    document.getElementById('addressForm').reset();
    
    const modal = new bootstrap.Modal(document.getElementById('addressModal'));
    modal.show();
}

// Edit address
function editAddress(addressId) {
    const numericId = typeof addressId === 'string' ? parseInt(addressId, 10) : addressId;
    const address = addresses.find(a => (a.id ?? a._id) === numericId || (a.id ?? a._id) === addressId);
    if (!address) return;
    
    editingAddressId = addressId;
    document.getElementById('addressModalTitle').textContent = 'Edit Address';
    
    // Fill form with address data
    document.getElementById('addressType').value = address.addressType;
    document.getElementById('firstName').value = address.firstName;
    document.getElementById('lastName').value = address.lastName;
    document.getElementById('mobile').value = address.mobile;
    document.getElementById('address').value = address.address;
    document.getElementById('pinCode').value = address.pinCode;
    document.getElementById('district').value = address.district;
    document.getElementById('state').value = address.state;
    document.getElementById('landmark').value = address.landmark || '';
    document.getElementById('isDefault').checked = address.isDefault;
    
    const modal = new bootstrap.Modal(document.getElementById('addressModal'));
    modal.show();
}

// Save address
async function saveAddress() {
    const form = document.getElementById('addressForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const addressData = {
        addressType: document.getElementById('addressType').value,
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        mobile: document.getElementById('mobile').value,
        address: document.getElementById('address').value,
        pinCode: document.getElementById('pinCode').value,
        district: document.getElementById('district').value,
        state: document.getElementById('state').value,
        landmark: document.getElementById('landmark').value,
        isDefault: document.getElementById('isDefault').checked
    };
    
    try {
        let response;
        if (editingAddressId) {
            response = await fetch(`/api/users/addresses/${editingAddressId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(addressData)
            });
        } else {
            response = await fetch('/api/users/addresses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(addressData)
            });
        }
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to save address');
        }
        
        showProfileSuccess(editingAddressId ? 'Address updated successfully' : 'Address added successfully');
        
        // Close modal and reload addresses
        const modal = bootstrap.Modal.getInstance(document.getElementById('addressModal'));
        modal.hide();
        
        await loadAddresses();
    } catch (error) {
        console.error('Error saving address:', error);
        showProfileError(error.message);
    }
}

// Set default address
async function setDefaultAddress(addressId) {
    try {
        const response = await fetch(`/api/users/addresses/${addressId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ isDefault: true })
        });
        
        if (!response.ok) {
            throw new Error('Failed to set default address');
        }
        
        showProfileSuccess('Default address updated');
        await loadAddresses();
    } catch (error) {
        console.error('Error setting default address:', error);
        showProfileError(error.message);
    }
}

// Delete address
async function deleteAddress(addressId) {
    if (!confirm('Are you sure you want to delete this address?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/users/addresses/${addressId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete address');
        }
        
        showProfileSuccess('Address deleted successfully');
        await loadAddresses();
    } catch (error) {
        console.error('Error deleting address:', error);
        showProfileError(error.message);
    }
}

// Utility functions
function showProfileSuccess(message) {
    showProfileNotification(message, 'success');
}

function showProfileError(message) {
    showProfileNotification(message, 'danger');
}

function showProfileNotification(message, type) {
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
            <button type="button" class="btn-close ms-auto" onclick="this.parentElement.parentElement.remove()"></button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}
