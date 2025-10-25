const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { User, Address, Medicine, CartItem } = require('../models');
const { Op } = require('sequelize');
const { authenticateSession, optionalAuth, loginRateLimit, generateToken } = require('../middleware/auth');

// Register user
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, firstName, lastName, mobile } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ 
            where: {
                [Op.or]: [{ email }, { username }] 
            }
        });
        
        if (existingUser) {
            return res.status(400).json({ 
                message: 'User already exists!',
                code: 'USER_EXISTS'
            });
        }
        
        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            firstName,
            lastName,
            mobile
        });
        
        // Generate JWT token for immediate login
        const token = generateToken(user.id);
        
        res.status(201).json({ 
            message: 'User registered successfully!',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Registration failed', 
            error: error.message,
            code: 'REGISTRATION_ERROR'
        });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { username, password, rememberMe } = req.body;
        
        const user = await User.findOne({ 
            where: {
                [Op.or]: [{ email: username }, { username }] 
            }
        });
        
        if (!user) {
            return res.status(401).json({ 
                message: 'Invalid credentials',
                code: 'INVALID_CREDENTIALS'
            });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(401).json({ 
                message: 'Invalid credentials',
                code: 'INVALID_CREDENTIALS'
            });
        }
        
        if (!user.isActive) {
            return res.status(403).json({ 
                message: 'Account is deactivated. Please contact support.',
                code: 'ACCOUNT_DEACTIVATED'
            });
        }
        
        // Create session
        req.session.userId = user.id;
        req.session.userRole = user.role;
        req.session.loginTime = new Date();
        
        // Set session timeout based on remember me
        if (rememberMe) {
            req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
        } else {
            req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 24 hours
        }
        
        // Generate JWT token
        const token = generateToken(user.id);
        
        // Update last login
        user.lastLogin = new Date();
        await user.save();
        
        res.status(200).json({ 
            message: 'Login successful!',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                lastLogin: user.lastLogin
            },
            session: {
                loginTime: req.session.loginTime,
                expiresAt: new Date(Date.now() + req.session.cookie.maxAge)
            }
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Login failed', 
            error: error.message,
            code: 'LOGIN_ERROR'
        });
    }
});

// Logout user
router.post('/logout', authenticateSession, (req, res) => {
    const userId = req.session.userId;
    
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ 
                message: 'Logout failed',
                code: 'LOGOUT_ERROR'
            });
        }
        
        res.status(200).json({ 
            message: 'Logout successful!',
            userId: userId
        });
    });
});

// Get current user session info
router.get('/session', authenticateSession, (req, res) => {
    res.status(200).json({
        user: {
            id: req.user.id,
            username: req.user.username,
            email: req.user.email,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            role: req.user.role,
            lastLogin: req.user.lastLogin
        },
        session: {
            loginTime: req.session.loginTime,
            lastActivity: req.session.lastActivity,
            activityCount: req.session.activityCount,
            expiresAt: new Date(Date.now() + req.session.cookie.maxAge)
        }
    });
});

// Refresh session
router.post('/refresh-session', authenticateSession, (req, res) => {
    // Update session activity
    req.session.lastActivity = new Date();
    req.session.activityCount = (req.session.activityCount || 0) + 1;
    
    res.status(200).json({
        message: 'Session refreshed successfully',
        lastActivity: req.session.lastActivity,
        expiresAt: new Date(Date.now() + req.session.cookie.maxAge)
    });
});

// Get user profile
router.get('/profile', authenticateSession, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            include: [
                {
                    model: Address,
                    as: 'addresses'
                }
            ],
            attributes: { exclude: ['password'] }
        });
        
        if (!user) {
            return res.status(404).json({ 
                message: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }
        
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ 
            message: 'Failed to fetch profile', 
            error: error.message,
            code: 'PROFILE_FETCH_ERROR'
        });
    }
});

// Update user profile
router.put('/profile', authenticateSession, async (req, res) => {
    try {
        const { firstName, lastName, mobile } = req.body;
        
        const user = await User.findByPk(req.user.id);
        
        if (!user) {
            return res.status(404).json({ 
                message: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }
        
        await user.update({ firstName, lastName, mobile });
        
        res.status(200).json({ 
            message: 'Profile updated successfully', 
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                mobile: user.mobile,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Failed to update profile', 
            error: error.message,
            code: 'PROFILE_UPDATE_ERROR'
        });
    }
});

// Add address
router.post('/addresses', authenticateSession, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ 
                message: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }
        
        const newAddress = req.body;
        newAddress.userId = user.id;
        
        // If this is the first address or marked as default, make it default
        const existingAddresses = await Address.findAll({ where: { userId: user.id } });
        if (existingAddresses.length === 0 || newAddress.isDefault) {
            // Unset other default addresses
            await Address.update(
                { isDefault: false },
                { where: { userId: user.id } }
            );
            newAddress.isDefault = true;
        }
        
        const address = await Address.create(newAddress);
        
        res.status(201).json({ 
            message: 'Address added successfully', 
            address
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Failed to add address', 
            error: error.message,
            code: 'ADDRESS_ADD_ERROR'
        });
    }
});

// Get addresses
router.get('/addresses', authenticateSession, async (req, res) => {
    try {
        const addresses = await Address.findAll({ 
            where: { userId: req.user.id },
            order: [['isDefault', 'DESC'], ['createdAt', 'DESC']]
        });
        
        res.status(200).json(addresses);
    } catch (error) {
        res.status(500).json({ 
            message: 'Failed to fetch addresses', 
            error: error.message,
            code: 'ADDRESS_FETCH_ERROR'
        });
    }
});

// Update address
router.put('/addresses/:addressId', authenticateSession, async (req, res) => {
    try {
        const addressId = req.params.addressId;
        const address = await Address.findOne({
            where: { id: addressId, userId: req.user.id }
        });
        
        if (!address) {
            return res.status(404).json({ 
                message: 'Address not found',
                code: 'ADDRESS_NOT_FOUND'
            });
        }
        
        // If making this address default, unset others
        if (req.body.isDefault) {
            await Address.update(
                { isDefault: false },
                { where: { userId: req.user.id } }
            );
        }
        
        await address.update(req.body);
        
        res.status(200).json({ 
            message: 'Address updated successfully', 
            address
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Failed to update address', 
            error: error.message,
            code: 'ADDRESS_UPDATE_ERROR'
        });
    }
});

// Delete address
router.delete('/addresses/:addressId', authenticateSession, async (req, res) => {
    try {
        const addressId = req.params.addressId;
        const address = await Address.findOne({
            where: { id: addressId, userId: req.user.id }
        });
        
        if (!address) {
            return res.status(404).json({ 
                message: 'Address not found',
                code: 'ADDRESS_NOT_FOUND'
            });
        }
        
        const wasDefault = address.isDefault;
        await address.destroy();
        
        // If we deleted the default address, make the first one default
        if (wasDefault) {
            const firstAddress = await Address.findOne({
                where: { userId: req.user.id },
                order: [['createdAt', 'ASC']]
            });
            if (firstAddress) {
                await firstAddress.update({ isDefault: true });
            }
        }
        
        res.status(200).json({ 
            message: 'Address deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Failed to delete address', 
            error: error.message,
            code: 'ADDRESS_DELETE_ERROR'
        });
    }
});

// Add to cart
router.post('/cart', authenticateSession, async (req, res) => {
    try {
        const { medicineId, quantity = 1 } = req.body;
        
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ 
                message: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }
        
        const medicine = await Medicine.findByPk(medicineId);
        if (!medicine) {
            return res.status(404).json({ 
                message: 'Medicine not found',
                code: 'MEDICINE_NOT_FOUND'
            });
        }
        
        // Check if medicine already in cart
        const existingItem = await CartItem.findOne({
            where: { userId: user.id, medicineId: medicineId }
        });
        
        if (existingItem) {
            await existingItem.update({ quantity: existingItem.quantity + quantity });
        } else {
            await CartItem.create({ 
                userId: user.id, 
                medicineId: medicineId, 
                quantity 
            });
        }
        
        // Emit real-time update
        const io = req.app.get('io');
        if (io) {
            io.to(user.id.toString()).emit('cart-updated', {
                userId: user.id,
                message: 'Cart updated successfully'
            });
        }
        
        res.status(200).json({ 
            message: 'Added to cart successfully'
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Failed to add to cart', 
            error: error.message,
            code: 'CART_ADD_ERROR'
        });
    }
});

// Get cart
router.get('/cart', authenticateSession, async (req, res) => {
    try {
        const cartItems = await CartItem.findAll({
            where: { userId: req.user.id },
            include: [
                {
                    model: Medicine,
                    as: 'medicine'
                }
            ]
        });
        
        res.status(200).json(cartItems);
    } catch (error) {
        res.status(500).json({ 
            message: 'Failed to fetch cart', 
            error: error.message,
            code: 'CART_FETCH_ERROR'
        });
    }
});

// Update cart item quantity
router.put('/cart/:medicineId', authenticateSession, async (req, res) => {
    try {
        const { medicineId } = req.params;
        const { quantity } = req.body;
        
        const cartItem = await CartItem.findOne({
            where: { userId: req.user.id, medicineId: medicineId }
        });
        
        if (!cartItem) {
            return res.status(404).json({ 
                message: 'Item not found in cart',
                code: 'CART_ITEM_NOT_FOUND'
            });
        }
        
        if (quantity <= 0) {
            await cartItem.destroy();
        } else {
            await cartItem.update({ quantity });
        }
        
        // Emit real-time update
        const io = req.app.get('io');
        if (io) {
            io.to(req.user.id.toString()).emit('cart-updated', {
                userId: req.user.id,
                message: 'Cart quantity updated'
            });
        }
        
        res.status(200).json({ 
            message: 'Cart updated successfully'
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Failed to update cart', 
            error: error.message,
            code: 'CART_UPDATE_ERROR'
        });
    }
});

// Remove from cart
router.delete('/cart/:medicineId', authenticateSession, async (req, res) => {
    try {
        const { medicineId } = req.params;
        
        const cartItem = await CartItem.findOne({
            where: { userId: req.user.id, medicineId: medicineId }
        });
        
        if (!cartItem) {
            return res.status(404).json({ 
                message: 'Item not found in cart',
                code: 'CART_ITEM_NOT_FOUND'
            });
        }
        
        await cartItem.destroy();
        
        // Emit real-time update
        const io = req.app.get('io');
        if (io) {
            io.to(req.user.id.toString()).emit('cart-updated', {
                userId: req.user.id,
                message: 'Item removed from cart'
            });
        }
        
        res.status(200).json({ 
            message: 'Item removed from cart'
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Failed to remove from cart', 
            error: error.message,
            code: 'CART_REMOVE_ERROR'
        });
    }
});

// Clear cart
router.delete('/cart', authenticateSession, async (req, res) => {
    try {
        await CartItem.destroy({
            where: { userId: req.user.id }
        });
        
        // Emit real-time update
        const io = req.app.get('io');
        if (io) {
            io.to(req.user.id.toString()).emit('cart-updated', {
                userId: req.user.id,
                message: 'Cart cleared'
            });
        }
        
        res.status(200).json({ 
            message: 'Cart cleared successfully' 
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Failed to clear cart', 
            error: error.message,
            code: 'CART_CLEAR_ERROR'
        });
    }
});

module.exports = router;
