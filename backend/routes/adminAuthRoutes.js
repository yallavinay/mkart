const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { Op } = require('sequelize');
const { generateToken } = require('../middleware/auth');

// Admin login
router.post('/login', async (req, res) => {
    try {
        const { username, password, rememberMe } = req.body;
        
        const user = await User.findOne({ 
            where: {
                [Op.or]: [{ email: username }, { username }],
                role: 'admin' // Only allow admin users
            }
        });
        
        if (!user) {
            return res.status(401).json({ 
                message: 'Invalid admin credentials',
                code: 'INVALID_ADMIN_CREDENTIALS'
            });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(401).json({ 
                message: 'Invalid admin credentials',
                code: 'INVALID_ADMIN_CREDENTIALS'
            });
        }
        
        if (!user.isActive) {
            return res.status(403).json({ 
                message: 'Admin account is deactivated. Please contact support.',
                code: 'ADMIN_ACCOUNT_DEACTIVATED'
            });
        }
        
        // Create admin session
        req.session.userId = user.id;
        req.session.userRole = user.role;
        req.session.loginTime = new Date();
        req.session.isAdmin = true;
        
        // Set session timeout based on remember me
        if (rememberMe) {
            req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 24 hours
        } else {
            req.session.cookie.maxAge = 8 * 60 * 60 * 1000; // 8 hours
        }
        
        // Generate JWT token
        const token = generateToken(user.id);
        
        // Update last login
        user.lastLogin = new Date();
        await user.save();
        
        res.status(200).json({ 
            message: 'Admin login successful!',
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
            message: 'Admin login failed', 
            error: error.message,
            code: 'ADMIN_LOGIN_ERROR'
        });
    }
});

// Admin logout
router.post('/logout', (req, res) => {
    const userId = req.session.userId;
    
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ 
                message: 'Admin logout failed',
                code: 'ADMIN_LOGOUT_ERROR'
            });
        }
        
        res.status(200).json({ 
            message: 'Admin logout successful!',
            userId: userId
        });
    });
});

// Get admin session info
router.get('/session', async (req, res) => {
    try {
        if (!req.session.userId || !req.session.isAdmin) {
            return res.status(401).json({ 
                message: 'Admin session required',
                code: 'ADMIN_SESSION_REQUIRED'
            });
        }

        const user = await User.findByPk(req.session.userId, {
            attributes: { exclude: ['password'] }
        });

        if (!user || user.role !== 'admin') {
            return res.status(403).json({ 
                message: 'Admin access required',
                code: 'ADMIN_ACCESS_REQUIRED'
            });
        }

        res.status(200).json({
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
                lastActivity: req.session.lastActivity,
                activityCount: req.session.activityCount,
                expiresAt: new Date(Date.now() + req.session.cookie.maxAge)
            }
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Failed to get admin session', 
            error: error.message,
            code: 'ADMIN_SESSION_ERROR'
        });
    }
});

// Refresh admin session
router.post('/refresh-session', (req, res) => {
    if (!req.session.userId || !req.session.isAdmin) {
        return res.status(401).json({ 
            message: 'Admin session required',
            code: 'ADMIN_SESSION_REQUIRED'
        });
    }

    // Update session activity
    req.session.lastActivity = new Date();
    req.session.activityCount = (req.session.activityCount || 0) + 1;
    
    res.status(200).json({
        message: 'Admin session refreshed successfully',
        lastActivity: req.session.lastActivity,
        expiresAt: new Date(Date.now() + req.session.cookie.maxAge)
    });
});

module.exports = router;
