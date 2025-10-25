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
        console.log('✅ Database initialized successfully');
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
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
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
        },
    },
}));

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5000',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Enhanced session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-super-secret-session-key-here',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax'
    },
    name: 'medicart.sid' // Custom session name
}));

// Session activity tracking
app.use(trackSessionActivity);

// Session timeout (30 minutes of inactivity)
app.use(sessionTimeout(30));

app.use(express.static(path.join(__dirname, '../frontend/public')));

// Import user routes (no admin routes)
const medicineRoutes = require('./routes/medicineRoutes');
const userRoutes = require('./routes/userRoutes');
const orderRoutes = require('./routes/orderRoutes');

// Use routes
app.use('/api/medicines', medicineRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);

// Serve frontend HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/views/index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/views/login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/views/register.html'));
});

app.get('/cart', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/views/cart.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/views/profile.html'));
});

app.get('/orders', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/views/orders.html'));
});

app.get('/checkout', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/views/checkout.html'));
});

// Socket.io for real-time updates with authentication
io.use((socket, next) => {
    // Extract session ID from socket handshake
    const sessionID = socket.handshake.auth.sessionID;
    
    if (sessionID) {
        // Find session by ID (simplified - in production use a session store)
        next();
    } else {
        next(new Error('Authentication required'));
    }
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    socket.on('join-room', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined their room`);
        
        // Send welcome message
        socket.emit('welcome', {
            message: 'Connected to MediCart real-time updates',
            timestamp: new Date()
        });
    });
    
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
    
    // Handle cart updates
    socket.on('cart-updated', (data) => {
        socket.broadcast.emit('cart-notification', data);
    });
    
    // Handle order updates
    socket.on('order-placed', (orderData) => {
        socket.emit('order-confirmation', orderData);
    });
});

// Make io accessible to routes
app.set('io', io);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ 
        message: 'Route not found',
        code: 'NOT_FOUND'
    });
});

// Session cleanup every hour
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);

 const PORT = process.env.USER_PORT || 5000;
server.listen(PORT, () => {
    console.log(`🛒 User Server running on port ${PORT}`);
    console.log(`🛒 User Portal: http://localhost:${PORT}`);
    console.log(`🛒 User Login: http://localhost:${PORT}/login`);
    console.log(`🛒 Session timeout: 30 minutes`);
    console.log(`🛒 Environment: ${process.env.NODE_ENV || 'development'}`);
});
