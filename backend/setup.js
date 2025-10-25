const fs = require('fs');
const path = require('path');

// Create .env file with MongoDB Atlas configuration
const envContent = `# Environment Configuration for MediCart
# MongoDB Atlas Configuration

# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5000

# MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://vinayyalla6470:vinay5553@cluster0.cdv8tzn.mongodb.net/medical-ecommerce?authSource=admin&retryWrites=true&w=majority

# Session Configuration
SESSION_SECRET=medicart-super-secret-session-key-2024-production-ready

# JWT Configuration
JWT_SECRET=medicart-jwt-secret-key-2024-production-ready

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Admin Configuration
ADMIN_EMAIL=admin@medicart.com
ADMIN_PASSWORD=admin123

# Development Configuration
DEBUG=true
LOG_LEVEL=info
`;

// Create .env file
const envPath = path.join(__dirname, '.env');
fs.writeFileSync(envPath, envContent);

console.log('✅ .env file created successfully!');
console.log('📋 MongoDB Atlas configuration added');
console.log('🔐 Session and JWT secrets generated');
console.log('');
console.log('🚀 Next steps:');
console.log('1. Run: npm install');
console.log('2. Run: node seed.js (to populate database)');
console.log('3. Run: npm start (to start the server)');
console.log('');
console.log('🌐 Your app will be available at:');
console.log('- Frontend: http://localhost:5000');
console.log('- Admin Panel: http://localhost:5000/admin');
console.log('');
console.log('👤 Default login credentials:');
console.log('- Admin: admin@medicart.com / admin123');
console.log('- User: john@example.com / user123');
console.log('- User: jane@example.com / user123');
