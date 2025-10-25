const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Medicine = require('./models/Medicine');
const Order = require('./models/Order');

// Connect to MongoDB Atlas
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://vinayyalla6470:vinay5553@cluster0.cdv8tzn.mongodb.net/medical-ecommerce?authSource=admin&retryWrites=true&w=majority'; 
        await mongoose.connect(mongoURI);
        console.log('MongoDB Atlas connected for seeding');
    } catch (error) {
        console.error('Error connecting to MongoDB Atlas:', error);
        process.exit(1);
    }
};

// Sample medicines data
const sampleMedicines = [
    {
        name: "Paracetamol 500mg",
        brand: "Crocin",
        genericName: "Paracetamol",
        manufacturer: "GSK Pharmaceuticals",
        batchNumber: "PC001",
        expiryDate: new Date('2025-12-31'),
        mrp: 25.00,
        sellingPrice: 20.00,
        discount: 20,
        category: "otc",
        subCategory: "Pain Relief",
        description: "Effective pain relief and fever reduction",
        composition: "Paracetamol 500mg",
        dosageForm: "tablet",
        strength: "500mg",
        packSize: "10 tablets",
        image: "/images/paracetamol.jpg",
        images: ["/images/paracetamol.jpg"],
        stock: 100,
        minOrderQuantity: 1,
        maxOrderQuantity: 5,
        prescriptionRequired: false,
        isActive: true,
        tags: ["pain", "fever", "headache"],
        rating: 4.5,
        reviewCount: 150
    },
    {
        name: "Ibuprofen 400mg",
        brand: "Brufen",
        genericName: "Ibuprofen",
        manufacturer: "Abbott Healthcare",
        batchNumber: "IB002",
        expiryDate: new Date('2025-10-15'),
        mrp: 45.00,
        sellingPrice: 38.00,
        discount: 15,
        category: "otc",
        subCategory: "Pain Relief",
        description: "Anti-inflammatory pain reliever",
        composition: "Ibuprofen 400mg",
        dosageForm: "tablet",
        strength: "400mg",
        packSize: "10 tablets",
        image: "/images/ibuprofen.jpg",
        images: ["/images/ibuprofen.jpg"],
        stock: 75,
        minOrderQuantity: 1,
        maxOrderQuantity: 3,
        prescriptionRequired: false,
        isActive: true,
        tags: ["pain", "inflammation", "arthritis"],
        rating: 4.2,
        reviewCount: 89
    },
    {
        name: "Amoxicillin 250mg",
        brand: "Amoxil",
        genericName: "Amoxicillin",
        manufacturer: "Cipla Ltd",
        batchNumber: "AM003",
        expiryDate: new Date('2024-08-20'),
        mrp: 120.00,
        sellingPrice: 100.00,
        discount: 16,
        category: "prescription",
        subCategory: "Antibiotic",
        description: "Broad-spectrum antibiotic",
        composition: "Amoxicillin 250mg",
        dosageForm: "capsule",
        strength: "250mg",
        packSize: "10 capsules",
        image: "/images/amoxicillin.jpg",
        images: ["/images/amoxicillin.jpg"],
        stock: 50,
        minOrderQuantity: 1,
        maxOrderQuantity: 2,
        prescriptionRequired: true,
        isActive: true,
        tags: ["antibiotic", "infection", "bacterial"],
        rating: 4.7,
        reviewCount: 203
    },
    {
        name: "Vitamin D3 60,000 IU",
        brand: "Calciferol",
        genericName: "Cholecalciferol",
        manufacturer: "Sun Pharma",
        batchNumber: "VD004",
        expiryDate: new Date('2026-03-15'),
        mrp: 180.00,
        sellingPrice: 150.00,
        discount: 16,
        category: "supplements",
        subCategory: "Vitamins",
        description: "High potency Vitamin D3 supplement",
        composition: "Cholecalciferol 60,000 IU",
        dosageForm: "tablet",
        strength: "60,000 IU",
        packSize: "4 tablets",
        image: "/images/vitamin-d3.jpg",
        images: ["/images/vitamin-d3.jpg"],
        stock: 200,
        minOrderQuantity: 1,
        maxOrderQuantity: 10,
        prescriptionRequired: false,
        isActive: true,
        tags: ["vitamin", "bone health", "immunity"],
        rating: 4.8,
        reviewCount: 312
    },
    {
        name: "Omeprazole 20mg",
        brand: "Omez",
        genericName: "Omeprazole",
        manufacturer: "Dr. Reddy's",
        batchNumber: "OM005",
        expiryDate: new Date('2025-06-30'),
        mrp: 85.00,
        sellingPrice: 72.00,
        discount: 15,
        category: "prescription",
        subCategory: "Antacid",
        description: "Proton pump inhibitor for acid reflux",
        composition: "Omeprazole 20mg",
        dosageForm: "capsule",
        strength: "20mg",
        packSize: "10 capsules",
        image: "/images/omeprazole.jpg",
        images: ["/images/omeprazole.jpg"],
        stock: 80,
        minOrderQuantity: 1,
        maxOrderQuantity: 5,
        prescriptionRequired: true,
        isActive: true,
        tags: ["acid reflux", "stomach", "ulcer"],
        rating: 4.3,
        reviewCount: 167
    }
];

// Sample users data
const sampleUsers = [
    {
        username: "admin",
        email: "admin@medicart.com",
        password: "admin123",
        firstName: "Admin",
        lastName: "User",
        mobile: "9876543210",
        role: "admin",
        addresses: [{
            type: "home",
            firstName: "Admin",
            lastName: "User",
            mobile: "9876543210",
            pinCode: "110001",
            state: "Delhi",
            district: "New Delhi",
            address: "123 Admin Street, Connaught Place",
            landmark: "Near Central Park",
            isDefault: true
        }],
        cart: [],
        orderHistory: [],
        isActive: true,
        lastLogin: new Date()
    },
    {
        username: "john_doe",
        email: "john@example.com",
        password: "user123",
        firstName: "John",
        lastName: "Doe",
        mobile: "9876543211",
        role: "user",
        addresses: [{
            type: "home",
            firstName: "John",
            lastName: "Doe",
            mobile: "9876543211",
            pinCode: "400001",
            state: "Maharashtra",
            district: "Mumbai",
            address: "456 User Avenue, Bandra West",
            landmark: "Near Bandra Station",
            isDefault: true
        }],
        cart: [],
        orderHistory: [],
        isActive: true,
        lastLogin: new Date()
    },
    {
        username: "jane_smith",
        email: "jane@example.com",
        password: "user123",
        firstName: "Jane",
        lastName: "Smith",
        mobile: "9876543212",
        role: "user",
        addresses: [{
            type: "home",
            firstName: "Jane",
            lastName: "Smith",
            mobile: "9876543212",
            pinCode: "560001",
            state: "Karnataka",
            district: "Bangalore",
            address: "789 Customer Road, Koramangala",
            landmark: "Near Forum Mall",
            isDefault: true
        }],
        cart: [],
        orderHistory: [],
        isActive: true,
        lastLogin: new Date()
    }
];

// Seed function
const seedDatabase = async () => {
    try {
        console.log('Starting database seeding...');
        
        // Clear existing data
        await User.deleteMany({});
        await Medicine.deleteMany({});
        await Order.deleteMany({});
        console.log('Cleared existing data');
        
        // Create users
        console.log('Creating users...');
        const createdUsers = await User.insertMany(sampleUsers);
        console.log(`Created ${createdUsers.length} users`);
        
        // Create medicines
        console.log('Creating medicines...');
        const createdMedicines = await Medicine.insertMany(sampleMedicines);
        console.log(`Created ${createdMedicines.length} medicines`);
        
        // Create sample orders
        console.log('Creating sample orders...');
        const sampleOrders = [
            {
                user: createdUsers[1]._id, // John Doe
                items: [
                    {
                        medicine: createdMedicines[0]._id, // Paracetamol
                        quantity: 2,
                        price: 20.00,
                        discount: 20
                    },
                    {
                        medicine: createdMedicines[1]._id, // Ibuprofen
                        quantity: 1,
                        price: 38.00,
                        discount: 15
                    }
                ],
                shippingAddress: {
                    firstName: "John",
                    lastName: "Doe",
                    mobile: "9876543211",
                    pinCode: "400001",
                    state: "Maharashtra",
                    district: "Mumbai",
                    address: "456 User Avenue, Bandra West",
                    landmark: "Near Bandra Station"
                },
                totalAmount: 78.00,
                orderStatus: "delivered",
                paymentStatus: "paid",
                paymentMethod: "COD",
                trackingNumber: "TRK001",
                deliveryDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
            },
            {
                user: createdUsers[2]._id, // Jane Smith
                items: [
                    {
                        medicine: createdMedicines[3]._id, // Vitamin D3
                        quantity: 1,
                        price: 150.00,
                        discount: 16
                    }
                ],
                shippingAddress: {
                    firstName: "Jane",
                    lastName: "Smith",
                    mobile: "9876543212",
                    pinCode: "560001",
                    state: "Karnataka",
                    district: "Bangalore",
                    address: "789 Customer Road, Koramangala",
                    landmark: "Near Forum Mall"
                },
                totalAmount: 150.00,
                orderStatus: "processing",
                paymentStatus: "paid",
                paymentMethod: "UPI",
                trackingNumber: "TRK002"
            }
        ];
        
        const createdOrders = await Order.insertMany(sampleOrders);
        console.log(`Created ${createdOrders.length} orders`);
        
        // Update user order history
        for (const order of createdOrders) {
            await User.findByIdAndUpdate(
                order.user,
                { $push: { orderHistory: order._id } }
            );
        }
        
        console.log('Database seeding completed successfully!');
        console.log('\n=== Sample Data Created ===');
        console.log('Users:');
        createdUsers.forEach(user => {
            console.log(`- ${user.firstName} ${user.lastName} (${user.email}) - Role: ${user.role}`);
        });
        
        console.log('\nMedicines:');
        createdMedicines.forEach(medicine => {
            console.log(`- ${medicine.name} (${medicine.brand}) - ₹${medicine.sellingPrice}`);
        });
        
        console.log('\nOrders:');
        createdOrders.forEach(order => {
            console.log(`- Order ${order.trackingNumber} - Status: ${order.orderStatus} - Amount: ₹${order.totalAmount}`);
        });
        
        console.log('\n=== Login Credentials ===');
        console.log('Admin: admin@medicart.com / admin123');
        console.log('User: john@example.com / user123');
        console.log('User: jane@example.com / user123');
        
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        mongoose.connection.close();
        console.log('Database connection closed');
    }
};

// Run seeding
connectDB().then(() => {
    seedDatabase();
});