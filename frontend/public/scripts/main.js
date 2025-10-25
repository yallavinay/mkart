// Enhanced main JavaScript for MediCart with authentication
let currentPage = 1;
let currentCategory = '';
let currentSort = 'newest';
let currentPriceRange = { min: '', max: '' };
let allMedicines = [];
let filteredMedicines = [];
let suggestionsTimer = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Check authentication status
    checkAuthStatus();
    
    // Load initial data
    loadMedicines();
    updateCartCount();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize Socket.io for real-time updates
    initializeSocket();
}

// Fetch and display search suggestions
async function fetchAndShowSuggestions(term) {
    const container = document.getElementById('searchSuggestions');
    if (!container) return;
    if (!term) {
        container.style.display = 'none';
        container.innerHTML = '';
        return;
    }
    try {
        const res = await fetch(`/api/medicines?search=${encodeURIComponent(term)}&limit=5`, {
            credentials: 'include'
        });
        if (!res.ok) throw new Error('suggestions fetch failed');
        const data = await res.json();
        const items = (data.medicines || []).slice(0, 5);
        if (items.length === 0) {
            container.innerHTML = '<div class="suggestion-item">No matches</div>';
            container.style.display = 'block';
            return;
        }
        container.innerHTML = items.map(m => `
            <div class="suggestion-item" data-name="${m.name.replaceAll('"','&quot;')}">
                <img class="suggestion-thumb" src="${m.image || m.image_url || '/images/placeholder-medicine.jpg'}" alt="${m.name}">
                <div>
                    <div class="suggestion-name">${m.name}</div>
                    <div class="suggestion-brand">${m.brand || ''}</div>
                </div>
            </div>
        `).join('');
        container.style.display = 'block';
        // Click handlers
        container.querySelectorAll('.suggestion-item').forEach(el => {
            el.addEventListener('click', () => {
                const name = el.getAttribute('data-name');
                const input = document.getElementById('searchInput');
                if (input) input.value = name;
                container.style.display = 'none';
                searchMedicines();
                scrollToProducts();
            });
        });
    } catch (e) {
        container.style.display = 'none';
    }
}

// Check authentication status
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/users/session', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            updateUIForLoggedInUser(data.user);
        }
    } catch (error) {
        console.log('User not authenticated');
    }
}

// Update UI for logged in user
function updateUIForLoggedInUser(user) {
    // Hide login/register buttons
    const loginRegisterBtns = document.querySelectorAll('.login-register-btn');
    loginRegisterBtns.forEach(btn => btn.style.display = 'none');
    
    // Show user action buttons
    const userActionBtns = document.querySelectorAll('.user-action-btn');
    userActionBtns.forEach(btn => btn.style.display = 'inline-block');
    
    // Add logout event listener
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

// Initialize Socket.io for real-time updates
function initializeSocket() {
    const socket = io();
    
    socket.on('connect', () => {
        console.log('Connected to server');
        
        // Join user room if authenticated
        if (window.auth && window.auth.isAuthenticated()) {
            const user = window.auth.getCurrentUser();
            socket.emit('join-room', user.id);
        }
    });
    
    socket.on('welcome', (data) => {
        console.log('Welcome message:', data.message);
    });
    
    socket.on('cart-updated', (data) => {
        console.log('Cart updated:', data.message);
        updateCartCount();
    });
    
    socket.on('order-confirmation', (data) => {
        console.log('Order confirmed:', data);
        showSuccess('Order placed successfully!');
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected from server');
    });
}

// Setup event listeners
function setupEventListeners() {
    // Header navigation buttons
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
        profileBtn.addEventListener('click', () => window.location.href = '/profile');
    }

    const ordersBtn = document.getElementById('ordersBtn');
    if (ordersBtn) {
        ordersBtn.addEventListener('click', () => window.location.href = '/orders');
    }

    const cartBtn = document.getElementById('cartBtn');
    if (cartBtn) {
        cartBtn.addEventListener('click', () => window.location.href = '/cart');
    }

    // Search button
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', searchMedicines);
    }

    // Category items
    const categoryItems = document.querySelectorAll('.category-item');
    categoryItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const category = item.getAttribute('data-category');
            if (category) {
                filterByCategory(category);
            }
        });
    });

    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchMedicines();
            }
        });
        // Live suggestions
        searchInput.addEventListener('input', () => {
            const term = searchInput.value.trim();
            if (suggestionsTimer) clearTimeout(suggestionsTimer);
            suggestionsTimer = setTimeout(() => fetchAndShowSuggestions(term), 200);
        });
        searchInput.addEventListener('focus', () => {
            const term = searchInput.value.trim();
            fetchAndShowSuggestions(term);
        });
    }

    // Event delegation for "Add to Cart" buttons
    document.addEventListener('click', function(e) {
        // Close suggestions when clicking outside
        const sugg = document.getElementById('searchSuggestions');
        const sc = document.querySelector('.search-container');
        if (sugg && sc && !sc.contains(e.target)) {
            sugg.style.display = 'none';
        }
        const addToCartBtn = e.target.closest('.add-to-cart-btn');
        if (addToCartBtn && !addToCartBtn.disabled) {
            const medicineId = addToCartBtn.getAttribute('data-medicine-id');
            if (medicineId) {
                addToCart(medicineId);
            }
        }
    });

    // Handle image load errors
    document.addEventListener('error', function(e) {
        if (e.target.tagName === 'IMG' && e.target.classList.contains('product-image')) {
            const fallback = e.target.getAttribute('data-fallback');
            if (fallback && e.target.src !== fallback) {
                e.target.src = fallback;
            }
        }
    }, true);

    // Cart badge update
    setInterval(updateCartCount, 30000); // Update every 30 seconds
}

// Load medicines from API
async function loadMedicines() {
    try {
        const response = await fetch('/api/medicines?page=1&limit=20', {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to load medicines');
        
        const data = await response.json();
        allMedicines = data.medicines;
        filteredMedicines = [...allMedicines];
        
        displayMedicines(filteredMedicines);
        
        // Show load more button if there are more pages
        if (data.pagination.currentPage < data.pagination.totalPages) {
            document.getElementById('loadMoreContainer').style.display = 'block';
        }
        
    } catch (error) {
        console.error('Error loading medicines:', error);
        showError('Failed to load medicines. Please try again.');
    }
}

// Display medicines in grid
function displayMedicines(medicines) {
    const grid = document.getElementById('productsGrid');
    
    if (medicines.length === 0) {
        grid.innerHTML = `
            <div class="col-12">
                <div class="text-center py-5">
                    <i class="fas fa-search fa-3x text-muted mb-3"></i>
                    <h4 class="text-muted">No medicines found</h4>
                    <p class="text-muted">Try adjusting your filters or search terms</p>
                </div>
            </div>
        `;
        return;
    }

    const html = medicines.map(medicine => `
        <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
            <div class="product-card">
                <img src="${medicine.image}" alt="${medicine.name}" class="product-image" 
                     data-fallback="/images/placeholder-medicine.jpg">
                <div class="product-info">
                    <h5 class="product-name">${medicine.name}</h5>
                    <p class="product-brand">${medicine.brand}</p>
                    <div class="d-flex align-items-center mb-2">
                        <span class="product-price">₹${medicine.sellingPrice}</span>
                        ${medicine.mrp > medicine.sellingPrice ? `
                            <span class="product-mrp">₹${medicine.mrp}</span>
                            <span class="product-discount">${Math.round(((medicine.mrp - medicine.sellingPrice) / medicine.mrp) * 100)}% OFF</span>
                        ` : ''}
                    </div>
                    <div class="mb-3">
                        <span class="badge bg-${medicine.stock > 10 ? 'success' : medicine.stock > 0 ? 'warning' : 'danger'}">
                            ${medicine.stock > 0 ? `${medicine.stock} in stock` : 'Out of stock'}
                        </span>
                        <span class="badge bg-info ms-1">${medicine.category}</span>
                    </div>
                    <button class="add-to-cart-btn" 
                            data-medicine-id="${medicine.id}"
                            ${medicine.stock === 0 ? 'disabled' : ''}>
                        <i class="fas fa-cart-plus"></i> 
                        ${medicine.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    grid.innerHTML = html;
}

// Add medicine to cart with authentication
async function addToCart(medicineId) {
    try {
        // Try to add to cart - backend will check authentication
        const response = await fetch('/api/users/cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ medicineId: medicineId, quantity: 1 })
        });

        if (!response.ok) {
            if (response.status === 401) {
                showError('Please login to add items to cart');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
                return;
            }
            const error = await response.json();
            throw new Error(error.message || 'Failed to add to cart');
        }

        const data = await response.json();
        showSuccess(data.message || 'Medicine added to cart successfully!');
        updateCartCount();
        
        // Animate cart badge
        const badge = document.getElementById('cartBadge');
        if (badge) {
            badge.style.transform = 'scale(1.2)';
            setTimeout(() => {
                badge.style.transform = 'scale(1)';
            }, 200);
        }

    } catch (error) {
        console.error('Error adding to cart:', error);
        showError(error.message);
    }
}

// Update cart count
async function updateCartCount() {
    try {
        const response = await fetch('/api/users/cart', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            // If not logged in or error, cart is 0
            const badge = document.getElementById('cartBadge');
            if (badge) {
                badge.textContent = '0';
                badge.style.display = 'none';
            }
        return;
    }

        const cart = await response.json();
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        
        const badge = document.getElementById('cartBadge');
        if (badge) {
            badge.textContent = totalItems;
            badge.style.display = totalItems > 0 ? 'flex' : 'none';
        }
    } catch (error) {
        console.error('Error updating cart count:', error);
        const badge = document.getElementById('cartBadge');
        if (badge) {
            badge.textContent = '0';
            badge.style.display = 'none';
        }
    }
}

// Search medicines
function searchMedicines() {
    const searchTerm = document.getElementById('searchInput').value.trim();
    
    if (searchTerm) {
        // Filter medicines based on search term
        filteredMedicines = allMedicines.filter(medicine => 
            medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            medicine.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
            medicine.genericName?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        displayMedicines(filteredMedicines);
        
        // Update page title
        document.title = `Search Results for "${searchTerm}" - MediCart`;
        } else {
        // Reset to all medicines
        filteredMedicines = [...allMedicines];
        displayMedicines(filteredMedicines);
        document.title = 'MediCart - Your Trusted Medical Store';
    }
}

// Filter by category
function filterByCategory(category) {
    currentCategory = category;
    document.getElementById('categoryFilter').value = category;
    filterProducts();
}

// Filter products
function filterProducts() {
    const category = document.getElementById('categoryFilter').value;
    const priceMin = document.getElementById('priceMin').value;
    const priceMax = document.getElementById('priceMax').value;
    
    currentCategory = category;
    currentPriceRange = { min: priceMin, max: priceMax };
    
    filteredMedicines = allMedicines.filter(medicine => {
        // Category filter
        if (category && medicine.category !== category) {
            return false;
        }
        
        // Price filter
        if (priceMin && medicine.sellingPrice < parseFloat(priceMin)) {
            return false;
        }
        if (priceMax && medicine.sellingPrice > parseFloat(priceMax)) {
            return false;
        }
        
        return true;
    });
    
    sortProducts();
}

// Sort products
function sortProducts() {
    const sortBy = document.getElementById('sortFilter').value;
    currentSort = sortBy;
    
    switch (sortBy) {
        case 'price-low':
            filteredMedicines.sort((a, b) => a.sellingPrice - b.sellingPrice);
            break;
        case 'price-high':
            filteredMedicines.sort((a, b) => b.sellingPrice - a.sellingPrice);
            break;
        case 'rating':
            filteredMedicines.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            break;
        case 'newest':
        default:
            filteredMedicines.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
    }
    
    displayMedicines(filteredMedicines);
}

// Load more products
async function loadMoreProducts() {
    currentPage++;
    
    try {
        let url = `/api/medicines?page=${currentPage}&limit=20`;
        
        if (currentCategory) url += `&category=${currentCategory}`;
        if (currentPriceRange.min) url += `&minPrice=${currentPriceRange.min}`;
        if (currentPriceRange.max) url += `&maxPrice=${currentPriceRange.max}`;
        
        const response = await fetch(url, {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to load more medicines');
        
        const data = await response.json();
        
        // Append new medicines to existing list
        allMedicines = [...allMedicines, ...data.medicines];
        filteredMedicines = [...filteredMedicines, ...data.medicines];
        
        displayMedicines(filteredMedicines);
        
        // Hide load more button if no more pages
        if (data.pagination.currentPage >= data.pagination.totalPages) {
            document.getElementById('loadMoreContainer').style.display = 'none';
        }
        
    } catch (error) {
        console.error('Error loading more medicines:', error);
        showError('Failed to load more medicines');
        currentPage--; // Revert page count on error
    }
}

// Scroll to products section
function scrollToProducts() {
    document.getElementById('productsSection').scrollIntoView({
        behavior: 'smooth'
    });
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
        // Clear local data
        sessionStorage.removeItem('user');
        localStorage.removeItem('authToken');
        
        // Redirect to home page
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
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

// Initialize cart count on page load
window.addEventListener('load', function() {
    updateCartCount();
});

// Handle page visibility change to update cart count
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        updateCartCount();
    }
});

// Export functions for global use
window.main = {
    addToCart,
    updateCartCount,
    searchMedicines,
    filterByCategory,
    filterProducts,
    sortProducts,
    loadMoreProducts,
    scrollToProducts,
    logout
};