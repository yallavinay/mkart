const jwt = require('jsonwebtoken');
const { User } = require('../models');

// JWT token generation
const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET || 'your-jwt-secret-key', {
        expiresIn: '24h'
    });
};

// JWT token verification
const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret-key');
    } catch (error) {
        return null;
    }
};

// Session-based authentication middleware
const authenticateSession = async (req, res, next) => {
    try {
        // Check session first
        if (req.session && req.session.userId) {
            const user = await User.findByPk(req.session.userId, {
                attributes: { exclude: ['password'] }
            });
            if (user && user.isActive) {
                req.user = user;
                return next();
            }
        }

        // Check Authorization header for JWT token
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = verifyToken(token);
            
            if (decoded) {
                const user = await User.findByPk(decoded.userId, {
                    attributes: { exclude: ['password'] }
                });
                if (user && user.isActive) {
                    req.user = user;
                    return next();
                }
            }
        }

        return res.status(401).json({ 
            message: 'Authentication required',
            code: 'AUTH_REQUIRED'
        });
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({ 
            message: 'Authentication error',
            code: 'AUTH_ERROR'
        });
    }
};

// Admin authentication middleware
const authenticateAdmin = async (req, res, next) => {
    try {
        // First check if user is authenticated
        await authenticateSession(req, res, () => {});
        
        if (!req.user) {
            return res.status(401).json({ 
                message: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }

        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ 
                message: 'Admin access required',
                code: 'ADMIN_REQUIRED'
            });
        }

        next();
    } catch (error) {
        console.error('Admin authentication error:', error);
        return res.status(500).json({ 
            message: 'Authentication error',
            code: 'AUTH_ERROR'
        });
    }
};

// Optional authentication middleware (doesn't fail if no auth)
const optionalAuth = async (req, res, next) => {
    try {
        // Check session first
        if (req.session && req.session.userId) {
            const user = await User.findByPk(req.session.userId, {
                attributes: { exclude: ['password'] }
            });
            if (user && user.isActive) {
                req.user = user;
            }
        }

        // Check Authorization header for JWT token
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = verifyToken(token);
            
            if (decoded) {
                const user = await User.findByPk(decoded.userId, {
                    attributes: { exclude: ['password'] }
                });
                if (user && user.isActive) {
                    req.user = user;
                }
            }
        }

        next();
    } catch (error) {
        console.error('Optional auth error:', error);
        next(); // Continue even if auth fails
    }
};

// Session validation middleware
const validateSession = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ 
            message: 'Session expired. Please login again.',
            code: 'SESSION_EXPIRED'
        });
    }
    next();
};

// Rate limiting for authentication endpoints
const authRateLimit = require('express-rate-limit')({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: {
        message: 'Too many login attempts, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Login rate limiting
const loginRateLimit = require('express-rate-limit')({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // limit each IP to 3 login attempts per windowMs
    message: {
        message: 'Too many login attempts, please try again in 15 minutes.',
        code: 'LOGIN_RATE_LIMIT'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Session cleanup utility
const cleanupExpiredSessions = () => {
    // This would typically be implemented with a session store
    // For now, we'll rely on express-session's built-in cleanup
    console.log('Session cleanup completed');
};

// Session activity tracking
const trackSessionActivity = (req, res, next) => {
    if (req.session && req.session.userId) {
        req.session.lastActivity = new Date();
        req.session.activityCount = (req.session.activityCount || 0) + 1;
    }
    next();
};

// Session timeout middleware
const sessionTimeout = (timeoutMinutes = 30) => {
    return (req, res, next) => {
        if (req.session && req.session.lastActivity) {
            const timeSinceLastActivity = new Date() - new Date(req.session.lastActivity);
            const timeoutMs = timeoutMinutes * 60 * 1000;
            
            if (timeSinceLastActivity > timeoutMs) {
                req.session.destroy((err) => {
                    if (err) {
                        console.error('Session destruction error:', err);
                    }
                });
                return res.status(401).json({ 
                    message: 'Session timeout. Please login again.',
                    code: 'SESSION_TIMEOUT'
                });
            }
        }
        next();
    };
};

module.exports = {
    generateToken,
    verifyToken,
    authenticateSession,
    authenticateAdmin,
    optionalAuth,
    validateSession,
    authRateLimit,
    loginRateLimit,
    cleanupExpiredSessions,
    trackSessionActivity,
    sessionTimeout
};
