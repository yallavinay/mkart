// Event delegation for quantity and remove (CSP-safe)
function setupCartEventDelegation() {
    const container = document.getElementById('cart-items');
    if (!container) return;
    container.addEventListener('click', (e) => {
        const dec = e.target.closest('.btn-qty-dec');
        const inc = e.target.closest('.btn-qty-inc');
        const rem = e.target.closest('.btn-remove-item');
        if (dec) {
            const id = dec.getAttribute('data-id');
            const input = dec.nextElementSibling;
            const newQty = Math.max(1, parseInt(input.value, 10) - 1);
            updateQuantity(id, newQty);
            return;
        }
        if (inc) {
            const id = inc.getAttribute('data-id');
            const input = inc.previousElementSibling;
            const max = parseInt(input.getAttribute('max'), 10) || 9999;
            const newQty = Math.min(max, parseInt(input.value, 10) + 1);
            updateQuantity(id, newQty);
            return;
        }
        if (rem) {
            const id = rem.getAttribute('data-id');
            removeFromCart(id);
        }
    });

    container.addEventListener('change', (e) => {
        const input = e.target.closest('.qty-input');
        if (input) {
            const id = input.getAttribute('data-id');
            let val = parseInt(input.value, 10);
            if (isNaN(val) || val < 1) val = 1;
            const max = parseInt(input.getAttribute('max'), 10) || 9999;
            if (val > max) val = max;
            updateQuantity(id, val);
        }
    });
}
// Cart functionality for MediCart
let cartItems = [];
let cartTotal = 0;

// Initialize cart page
document.addEventListener('DOMContentLoaded', function() {
    loadCartItems();
    setupCartEventDelegation();
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            proceedToCheckout();
        });
    }
});

// Load cart items from API
async function loadCartItems() {
    try {
        const response = await fetch('/api/users/cart');
        
        if (!response.ok) {
            if (response.status === 401) {
                showError('Please login to view your cart');
                setTimeout(() => window.location.href = '/login', 2000);
                return;
            }
            throw new Error('Failed to load cart');
        }
        
        cartItems = await response.json();
        displayCartItems();
        updateCartSummary();
        
    } catch (error) {
        console.error('Error loading cart:', error);
        showError('Failed to load cart items');
    }
}

// Display cart items
function displayCartItems() {
    const container = document.getElementById('cart-items');
    
    if (cartItems.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <h3>Your cart is empty</h3>
                <p class="text-muted">Add some medicines to get started</p>
                <a href="/" class="continue-shopping-btn">
                    <i class="fas fa-plus"></i> Continue Shopping
                </a>
            </div>
        `;
        return;
    }

    const html = cartItems.map(item => `
        <div class="cart-item" data-medicine-id="${item.medicine.id ?? item.medicine._id}">
            <div class="row align-items-center">
                <div class="col-md-2">
                    <img src="${item.medicine.image}" alt="${item.medicine.name}" class="medicine-image product-image" data-fallback="/images/placeholder-medicine.jpg">
                </div>
                <div class="col-md-4">
                    <h5 class="mb-1">${item.medicine.name}</h5>
                    <p class="text-muted mb-1">${item.medicine.brand}</p>
                    <span class="badge bg-info">${item.medicine.category}</span>
                </div>
                <div class="col-md-2">
                    <div class="quantity-controls">
                        <button class="quantity-btn btn-qty-dec" data-id="${item.medicine.id ?? item.medicine._id}"><i class="fas fa-minus"></i></button>
                        <input type="number" class="quantity-input qty-input" value="${item.quantity}" min="1" max="${item.medicine.stock}" data-id="${item.medicine.id ?? item.medicine._id}">
                        <button class="quantity-btn btn-qty-inc" data-id="${item.medicine.id ?? item.medicine._id}"><i class="fas fa-plus"></i></button>
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="text-center">
                        <div class="fw-bold text-success">₹${item.medicine.sellingPrice}</div>
                        ${item.medicine.mrp > item.medicine.sellingPrice ? 
                            `<small class="text-muted text-decoration-line-through">₹${item.medicine.mrp}</small>` : ''
                        }
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="text-center">
                        <div class="fw-bold mb-2">₹${(item.medicine.sellingPrice * item.quantity).toFixed(2)}</div>
                        <button class="remove-btn btn-remove-item" data-id="${item.medicine.id ?? item.medicine._id}"><i class="fas fa-trash"></i> Remove</button>
                    </div>
            </div>
            </div>
            </div>
    `).join('');

    container.innerHTML = html;
}

// Update quantity
async function updateQuantity(medicineId, newQuantity) {
    if (newQuantity < 1) {
        removeFromCart(medicineId);
        return;
    }

    try {
        const response = await fetch(`/api/users/cart/${medicineId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ quantity: parseInt(newQuantity) })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update quantity');
        }

        // Reload cart items
        await loadCartItems();
        showSuccess('Quantity updated successfully');

    } catch (error) {
        console.error('Error updating quantity:', error);
        showError(error.message);
    }
}

// Remove item from cart
async function removeFromCart(medicineId) {
    if (!confirm('Are you sure you want to remove this item from your cart?')) {
        return;
    }

    try {
        const response = await fetch(`/api/users/cart/${medicineId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to remove item');
        }

        // Reload cart items
        await loadCartItems();
        showSuccess('Item removed from cart');

    } catch (error) {
        console.error('Error removing item:', error);
        showError(error.message);
    }
}

// Update cart summary
function updateCartSummary() {
    let subtotal = 0;
    let discount = 0;

    cartItems.forEach(item => {
        const itemTotal = item.medicine.sellingPrice * item.quantity;
        const itemDiscount = (item.medicine.mrp - item.medicine.sellingPrice) * item.quantity;
        
        subtotal += itemTotal;
        discount += itemDiscount;
    });

    const shipping = subtotal > 500 ? 0 : 50;
    const total = subtotal + shipping - discount;

    // Update summary display
    document.getElementById('subtotal').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('shipping').textContent = shipping === 0 ? 'FREE' : `₹${shipping}`;
    document.getElementById('discount').textContent = `-₹${discount.toFixed(2)}`;
    document.getElementById('total').textContent = `₹${total.toFixed(2)}`;

    // Enable/disable checkout button
    const checkoutBtn = document.getElementById('checkoutBtn');
    checkoutBtn.disabled = cartItems.length === 0;

    cartTotal = total;
}

// Proceed to checkout
async function proceedToCheckout() {
    if (cartItems.length === 0) {
        showError('Your cart is empty');
        return;
    }
    // Navigate to checkout flow
    window.location.href = '/checkout';
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
            <button type="button" class="btn-close ms-auto" onclick="this.parentElement.parentElement.remove()"></button>
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