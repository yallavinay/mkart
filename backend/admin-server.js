const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const http = require('http');
const socketIo = require('socket.io');
const helmet = require('helmet');
const { connectDB } = require('./config/db');
const { trackSessionActivity, sessionTimeout, cleanupExpiredSessions } = require('./middleware/auth');
require('dotenv').config();

// Import models
const { User, Medicine, Order, Review, Address, OrderItem, CartItem, syncDatabase } = require('./models');

// Connect to MySQL and sync database
const initializeDatabase = async () => {
    try {
        await connectDB();
        await syncDatabase();
        console.log('✅ Admin Database initialized successfully');
    } catch (error) {
        console.error('❌ Admin Database initialization failed:', error);
        process.exit(1);
    }
};

initializeDatabase();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            connectSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
        },
    },
}));

// Middleware
app.use(cors({
    origin: process.env.ADMIN_FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Enhanced session configuration for admin
app.use(session({
    secret: process.env.ADMIN_SESSION_SECRET || 'admin-super-secret-session-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 8 * 60 * 60 * 1000, // 8 hours for admin
        sameSite: 'lax'
    },
    name: 'admin.sid' // Custom session name for admin
}));

// Session activity tracking
app.use(trackSessionActivity);

// Session timeout (2 hours for admin)
app.use(sessionTimeout(120));

app.use(express.static(path.join(__dirname, '../frontend/public')));

// Import admin routes
const adminRoutes = require('./routes/adminRoutes');
const adminAuthRoutes = require('./routes/adminAuthRoutes');

// Use routes
app.use('/api/admin', adminRoutes);
app.use('/api/auth', adminAuthRoutes);

// Serve admin HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/views/admin-login.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/views/admin.html'));
});

app.get('/admin-medicines', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/views/admin-medicines.html'));
});

app.get('/admin-users', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/views/admin-users.html'));
});

app.get('/admin-orders', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/views/admin-orders.html'));
});

app.get('/admin-test', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/views/admin-test.html'));
});

app.get('/admin-no-auth', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/views/admin-no-auth.html'));
});

// Socket.io for real-time admin updates
io.use((socket, next) => {
    const sessionID = socket.handshake.auth.sessionID;
    if (sessionID) {
        next();
    } else {
        next(new Error('Admin authentication required'));
    }
});

io.on('connection', (socket) => {
    console.log('Admin connected:', socket.id);
    
    socket.on('join-admin-room', (adminId) => {
        socket.join(`admin-${adminId}`);
        console.log(`Admin ${adminId} joined admin room`);
        
        socket.emit('admin-welcome', {
            message: 'Connected to Admin Panel real-time updates',
            timestamp: new Date()
        });
    });
    
    socket.on('disconnect', () => {
        console.log('Admin disconnected:', socket.id);
    });
    
    // Handle admin notifications
    socket.on('admin-notification', (data) => {
        socket.broadcast.emit('admin-alert', data);
    });
});

// Make io accessible to routes
app.set('io', io);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Admin Error:', err);
    res.status(500).json({ 
        message: 'Admin server error',
        code: 'ADMIN_ERROR'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ 
        message: 'Admin route not found',
        code: 'ADMIN_NOT_FOUND'
    });
});

// Session cleanup every hour
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);

const PORT = process.env.ADMIN_PORT || 3000;
server.listen(PORT, () => {
    console.log(`🔧 Admin Server running on port ${PORT}`);
    console.log(`🔧 Admin Panel: http://localhost:${PORT}`);
    console.log(`🔧 Admin Login: http://localhost:${PORT}/`);
    console.log(`🔧 Session timeout: 2 hours`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});
