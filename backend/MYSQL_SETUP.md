# MySQL Setup Guide

## Prerequisites
1. MySQL Server installed and running
2. Node.js and npm installed

## Database Setup

### 1. Create Database
```sql
CREATE DATABASE medical_ecommerce;
```

### 2. Environment Configuration
Create a `.env` file in the backend directory with:

```env
# MySQL Database Configuration
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=#Vinay@6470
MYSQL_DB=medical_ecommerce

# Server Configuration
PORT=5000
NODE_ENV=development

# Session Configuration
SESSION_SECRET=your-super-secret-session-key-here

# Frontend URL
FRONTEND_URL=http://localhost:5000

# JWT Configuration
JWT_SECRET=your-jwt-secret-key-here
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Test Connection
```bash
node test-connection.js
```

### 5. Seed Database
```bash
npm run seed
```

### 6. Start Server
```bash
npm start
```

## Default Login Credentials

After seeding, you can login with:

**Admin:**
- Email: admin@medicart.com
- Password: admin123

**User:**
- Email: user@medicart.com
- Password: user123

## Database Schema

The application uses the following main tables:
- `users` - User accounts
- `addresses` - User shipping addresses
- `medicines` - Medicine catalog
- `reviews` - Product reviews
- `orders` - Order records
- `order_items` - Order line items
- `cart_items` - Shopping cart items

## Features

✅ **User Management**
- Registration/Login with session management
- Profile management
- Address management
- Shopping cart

✅ **Medicine Catalog**
- Browse medicines with pagination
- Search and filter medicines
- Category-based browsing
- Featured medicines

✅ **Order Management**
- Place orders
- Order tracking
- Order history
- Real-time updates

✅ **Admin Panel**
- Dashboard with analytics
- Medicine management
- Order management
- User management

✅ **Real-time Features**
- Socket.io integration
- Live order updates
- Cart synchronization

## API Endpoints

### User Routes (`/api/users`)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /logout` - User logout
- `GET /session` - Get session info
- `GET /profile` - Get user profile
- `PUT /profile` - Update profile
- `POST /addresses` - Add address
- `GET /addresses` - Get addresses
- `PUT /addresses/:id` - Update address
- `DELETE /addresses/:id` - Delete address
- `POST /cart` - Add to cart
- `GET /cart` - Get cart
- `PUT /cart/:medicineId` - Update cart item
- `DELETE /cart/:medicineId` - Remove from cart
- `DELETE /cart` - Clear cart

### Medicine Routes (`/api/medicines`)
- `GET /` - Get medicines with pagination
- `GET /:id` - Get medicine by ID
- `GET /search/:query` - Search medicines
- `GET /category/:category` - Get medicines by category
- `GET /featured/list` - Get featured medicines
- `GET /categories/list` - Get categories

### Order Routes (`/api/orders`)
- `POST /` - Create order
- `GET /` - Get user orders
- `GET /:id` - Get order details
- `PUT /:id/cancel` - Cancel order
- `GET /:id/track` - Track order

### Admin Routes (`/api/admin`)
- `GET /dashboard` - Dashboard stats
- `GET /medicines` - Get all medicines
- `POST /medicines` - Add medicine
- `PUT /medicines/:id` - Update medicine
- `DELETE /medicines/:id` - Delete medicine
- `GET /orders` - Get all orders
- `PUT /orders/:id/status` - Update order status
- `GET /users` - Get all users
- `PUT /users/:id/status` - Update user status
- `GET /analytics/sales` - Sales analytics
- `GET /analytics/products` - Product analytics

## Troubleshooting

### Connection Issues
1. Ensure MySQL server is running
2. Check credentials in `.env` file
3. Verify database exists
4. Check firewall settings

### Migration Issues
1. Drop and recreate database if needed
2. Check Sequelize logs for errors
3. Verify model associations

### Performance
1. Add database indexes for frequently queried fields
2. Use connection pooling for production
3. Optimize queries with proper WHERE clauses
