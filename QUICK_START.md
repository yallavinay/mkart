# 🚀 Quick Start Guide - MediCart

## MongoDB Atlas Setup Complete! ✅

Your MongoDB Atlas connection has been configured with the following credentials:
- **Username**: vinayyalla6470
- **Cluster**: cluster0.wtjtce8.mongodb.net
- **Database**: medical-ecommerce

## 📋 Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Create Environment File
```bash
npm run setup
```
This will create the `.env` file with your MongoDB Atlas credentials.

### 3. Seed the Database
```bash
npm run seed
```
This will populate your MongoDB Atlas database with sample data.

### 4. Start the Application
```bash
npm start
```

## 🌐 Access Your Application

- **Frontend**: http://localhost:5000
- **Admin Panel**: http://localhost:5000/admin

## 👤 Login Credentials

### Admin Account
- **Email**: admin@medicart.com
- **Password**: admin123

### User Accounts
- **Email**: john@example.com
- **Password**: user123
- **Email**: jane@example.com
- **Password**: user123

## 🔧 Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start development server with nodemon
- `npm run setup` - Create .env file with MongoDB Atlas config
- `npm run seed` - Populate database with sample data

## 📊 What's Included

### Sample Data
- **5 Medicines**: Paracetamol, Ibuprofen, Amoxicillin, Vitamin D3, Omeprazole
- **3 Users**: 1 Admin + 2 Regular users
- **2 Sample Orders**: With different statuses

### Features Ready
- ✅ User authentication with sessions
- ✅ Admin dashboard
- ✅ Medicine management
- ✅ Shopping cart
- ✅ Order management
- ✅ Real-time updates
- ✅ MongoDB Atlas integration

## 🛠️ Troubleshooting

### Connection Issues
If you encounter connection issues:
1. Check your internet connection
2. Verify MongoDB Atlas cluster is running
3. Ensure your IP is whitelisted in MongoDB Atlas

### Database Issues
If the seed script fails:
1. Check MongoDB Atlas connection
2. Verify database permissions
3. Run `npm run seed` again

## 🎯 Next Steps

1. **Test the application** with the provided credentials
2. **Add more medicines** through the admin panel
3. **Create user accounts** and test the shopping flow
4. **Customize the UI** to match your brand
5. **Deploy to production** when ready

## 📱 Features to Explore

- **User Registration/Login**: Test the authentication flow
- **Medicine Search**: Try searching for medicines
- **Shopping Cart**: Add items and manage quantities
- **Admin Panel**: Manage medicines and orders
- **Real-time Updates**: See live cart and order updates

---

**Your MediCart application is now ready to use!** 🎉

For detailed documentation, see the main README.md file.
