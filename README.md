# MediCart - Medical E-commerce Platform

A comprehensive medical e-commerce platform built with Node.js, Express, MongoDB, and modern web technologies. Features user authentication, admin panel, real-time updates, and a complete shopping experience.

## 🚀 Features

### User Features
- **User Authentication**: Secure login/register with session management
- **Medicine Search**: Advanced search with filters (category, price, rating)
- **Shopping Cart**: Add, update, remove items with real-time updates
- **User Profile**: Manage personal information and addresses
- **Order Management**: Place orders and track order history
- **Real-time Updates**: Live cart updates and order notifications

### Admin Features
- **Dashboard**: Analytics and statistics overview
- **Medicine Management**: Add, edit, delete medicines with detailed information
- **Order Management**: Update order statuses and track deliveries
- **User Management**: View and manage user accounts
- **Inventory Control**: Stock management and low stock alerts

### Medicine Information
- Complete medicine details (name, brand, manufacturer, batch number, expiry date)
- MRP, selling price, and discount calculations
- Categories: Prescription, OTC, Supplements, Medical Devices, Personal Care
- Stock management with real-time tracking
- Prescription requirements flag

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Socket.io** - Real-time communication
- **bcryptjs** - Password hashing
- **express-session** - Session management
- **jsonwebtoken** - JWT tokens
- **helmet** - Security middleware
- **express-rate-limit** - Rate limiting

### Frontend
- **HTML5** - Markup
- **CSS3** - Styling with custom properties
- **Bootstrap 5** - UI framework
- **JavaScript (ES6+)** - Client-side logic
- **Font Awesome** - Icons
- **Socket.io Client** - Real-time updates

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd medical-ecommerce-app
```

### 2. Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies (if any)
cd ../frontend
npm install
```

### 3. Environment Configuration
Create a `.env` file in the backend directory:
```env
# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/medical-ecommerce

# Session Configuration
SESSION_SECRET=your-super-secret-session-key-here-change-this-in-production

# JWT Configuration
JWT_SECRET=your-jwt-secret-key-here-change-this-in-production
```

### 4. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# On Windows
net start MongoDB

# On macOS/Linux
sudo systemctl start mongod
```

### 5. Seed the Database
```bash
cd backend
node seed.js
```

### 6. Start the Application
```bash
cd backend
npm start
```

The application will be available at:
- **Frontend**: http://localhost:5000
- **Admin Panel**: http://localhost:5000/admin

## 👥 Default Accounts

After seeding the database, you can use these accounts:

### Admin Account
- **Email**: admin@medicart.com
- **Password**: admin123

### User Accounts
- **Email**: john@example.com
- **Password**: user123
- **Email**: jane@example.com
- **Password**: user123

## 🔐 Authentication & Security

### Session Management
- **Session-based authentication** with express-session
- **JWT tokens** for API authentication
- **Session timeout** (30 minutes of inactivity)
- **Remember me** functionality (7 days)
- **Rate limiting** on authentication endpoints

### Security Features
- **Password hashing** with bcryptjs
- **Helmet.js** for security headers
- **CORS** configuration
- **Input validation** and sanitization
- **SQL injection** protection
- **XSS protection**

### Real-time Features
- **Socket.io** for real-time updates
- **Cart updates** in real-time
- **Order notifications**
- **Admin dashboard** updates

## 📁 Project Structure

```
medical-ecommerce-app/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Medicine.js
│   │   ├── Order.js
│   │   └── Review.js
│   ├── routes/
│   │   ├── userRoutes.js
│   │   ├── medicineRoutes.js
│   │   ├── orderRoutes.js
│   │   └── adminRoutes.js
│   ├── server.js
│   ├── seed.js
│   └── package.json
├── frontend/
│   ├── public/
│   │   ├── images/
│   │   ├── scripts/
│   │   │   ├── main.js
│   │   │   ├── auth.js
│   │   │   ├── cart.js
│   │   │   └── admin.js
│   │   └── styles.css
│   └── views/
│       ├── index.html
│       ├── login.html
│       ├── register.html
│       ├── cart.html
│       ├── profile.html
│       ├── orders.html
│       ├── admin.html
│       ├── admin-medicines.html
│       └── admin-orders.html
└── README.md
```

## 🚀 API Endpoints

### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `POST /api/users/logout` - User logout
- `GET /api/users/session` - Get current session
- `POST /api/users/refresh-session` - Refresh session

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/addresses` - Add address
- `GET /api/users/addresses` - Get addresses
- `PUT /api/users/addresses/:id` - Update address
- `DELETE /api/users/addresses/:id` - Delete address

### Cart Management
- `POST /api/users/cart` - Add to cart
- `GET /api/users/cart` - Get cart items
- `PUT /api/users/cart/:id` - Update cart item
- `DELETE /api/users/cart/:id` - Remove from cart
- `DELETE /api/users/cart` - Clear cart

### Medicine Management
- `GET /api/medicines` - Get all medicines (with pagination)
- `GET /api/medicines/:id` - Get medicine by ID
- `GET /api/medicines/search/:query` - Search medicines
- `GET /api/medicines/category/:category` - Get medicines by category
- `GET /api/medicines/featured/list` - Get featured medicines
- `GET /api/medicines/categories/list` - Get categories

### Order Management
- `POST /api/orders` - Place new order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order details

### Admin Routes
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:id` - Get user by ID
- `PUT /api/admin/users/:id/role` - Update user role
- `POST /api/admin/medicines` - Add medicine
- `PUT /api/admin/medicines/:id` - Update medicine
- `DELETE /api/admin/medicines/:id` - Delete medicine
- `GET /api/admin/orders` - Get all orders
- `GET /api/admin/orders/:id` - Get order details
- `PUT /api/admin/orders/:id/status` - Update order status

## 🎨 UI Features

### Responsive Design
- **Mobile-first** approach
- **Bootstrap 5** for responsive layout
- **Custom CSS** with modern design patterns
- **Font Awesome** icons

### User Experience
- **Real-time search** with instant results
- **Smooth animations** and transitions
- **Loading states** and progress indicators
- **Error handling** with user-friendly messages
- **Success notifications** for actions

### Admin Dashboard
- **Statistics overview** with charts
- **Real-time updates** for orders and users
- **Bulk operations** for medicines
- **Order tracking** and status updates

## 🔧 Development

### Running in Development Mode
```bash
cd backend
npm run dev
```

### Database Seeding
```bash
cd backend
node seed.js
```

### Testing
```bash
# Run tests (if available)
npm test
```

## 📱 Mobile Support

The application is fully responsive and works on:
- **Desktop** (Chrome, Firefox, Safari, Edge)
- **Tablet** (iPad, Android tablets)
- **Mobile** (iOS Safari, Android Chrome)

## 🚀 Deployment

### Production Environment
1. Set `NODE_ENV=production`
2. Use a production MongoDB instance
3. Set secure session secrets
4. Enable HTTPS
5. Configure reverse proxy (nginx)
6. Set up monitoring and logging

### Docker Deployment
```dockerfile
# Dockerfile example
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔮 Future Enhancements

- **Payment Gateway** integration
- **Email notifications** for orders
- **Prescription upload** functionality
- **Medicine reviews** and ratings
- **Wishlist** feature
- **Coupon system** for discounts
- **Analytics dashboard** for admins
- **Mobile app** development
- **Multi-language** support
- **Advanced search** with filters

---

**MediCart** - Your trusted partner for authentic medicines and healthcare products.