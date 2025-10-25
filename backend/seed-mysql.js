const { User, Medicine, Address, Review, Order, OrderItem, CartItem, syncDatabase } = require('./models');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
    try {
        console.log('🌱 Starting database seeding...');
        
        // Sync database first
        await syncDatabase();
        
        // Create admin user
        const adminPassword = await bcrypt.hash('admin123', 12);
        const adminUser = await User.create({
            username: 'admin',
            email: 'admin@medicart.com',
            password: adminPassword,
            firstName: 'Admin',
            lastName: 'User',
            mobile: '9999999999',
            role: 'admin',
            isActive: true
        });
        console.log('✅ Admin user created');

        // Create test user
        const userPassword = await bcrypt.hash('user123', 12);
        const testUser = await User.create({
            username: 'testuser',
            email: 'user@medicart.com',
            password: userPassword,
            firstName: 'Test',
            lastName: 'User',
            mobile: '8888888888',
            role: 'user',
            isActive: true
        });
        console.log('✅ Test user created');

        // Create sample medicines
        const medicines = [
            {
                name: 'Paracetamol 500mg',
                brand: 'Crocin',
                genericName: 'Paracetamol',
                manufacturer: 'GSK',
                batchNumber: 'BATCH001',
                expiryDate: new Date('2025-12-31'),
                mrp: 15.00,
                sellingPrice: 12.00,
                discount: 20.00,
                category: 'otc',
                subCategory: 'Pain Relief',
                description: 'Effective pain relief and fever reducer',
                composition: 'Paracetamol 500mg',
                dosageForm: 'tablet',
                strength: '500mg',
                packSize: '10 tablets',
                image: '/images/paracetamol.jpg',
                stock: 100,
                minOrderQuantity: 1,
                maxOrderQuantity: 10,
                prescriptionRequired: false,
                isActive: true,
                rating: 4.5,
                reviewCount: 25
            },
            {
                name: 'Ibuprofen 400mg',
                brand: 'Brufen',
                genericName: 'Ibuprofen',
                manufacturer: 'Abbott',
                batchNumber: 'BATCH002',
                expiryDate: new Date('2025-11-30'),
                mrp: 25.00,
                sellingPrice: 20.00,
                discount: 20.00,
                category: 'otc',
                subCategory: 'Pain Relief',
                description: 'Anti-inflammatory pain relief',
                composition: 'Ibuprofen 400mg',
                dosageForm: 'tablet',
                strength: '400mg',
                packSize: '10 tablets',
                image: '/images/ibuprofen.jpg',
                stock: 75,
                minOrderQuantity: 1,
                maxOrderQuantity: 10,
                prescriptionRequired: false,
                isActive: true,
                rating: 4.2,
                reviewCount: 18
            },
            {
                name: 'Aspirin 75mg',
                brand: 'Ecosprin',
                genericName: 'Aspirin',
                manufacturer: 'USV',
                batchNumber: 'BATCH003',
                expiryDate: new Date('2025-10-15'),
                mrp: 30.00,
                sellingPrice: 25.00,
                discount: 16.67,
                category: 'prescription',
                subCategory: 'Cardiovascular',
                description: 'Low dose aspirin for heart health',
                composition: 'Aspirin 75mg',
                dosageForm: 'tablet',
                strength: '75mg',
                packSize: '14 tablets',
                image: '/images/aspirin.jpg',
                stock: 50,
                minOrderQuantity: 1,
                maxOrderQuantity: 5,
                prescriptionRequired: true,
                isActive: true,
                rating: 4.0,
                reviewCount: 12
            },
            {
                name: 'Dolo 650mg',
                brand: 'Dolo',
                genericName: 'Paracetamol',
                manufacturer: 'Micro Labs',
                batchNumber: 'BATCH004',
                expiryDate: new Date('2025-09-20'),
                mrp: 20.00,
                sellingPrice: 18.00,
                discount: 10.00,
                category: 'otc',
                subCategory: 'Pain Relief',
                description: 'High strength paracetamol for severe pain',
                composition: 'Paracetamol 650mg',
                dosageForm: 'tablet',
                strength: '650mg',
                packSize: '15 tablets',
                image: '/images/Dolo650.jpg',
                stock: 60,
                minOrderQuantity: 1,
                maxOrderQuantity: 8,
                prescriptionRequired: false,
                isActive: true,
                rating: 4.3,
                reviewCount: 30
            },
            {
                name: 'Moxkind CV 625mg',
                brand: 'Moxkind CV',
                genericName: 'Amoxicillin + Clavulanic Acid',
                manufacturer: 'Mankind',
                batchNumber: 'BATCH005',
                expiryDate: new Date('2025-08-10'),
                mrp: 150.00,
                sellingPrice: 135.00,
                discount: 10.00,
                category: 'prescription',
                subCategory: 'Antibiotic',
                description: 'Broad spectrum antibiotic for bacterial infections',
                composition: 'Amoxicillin 500mg + Clavulanic Acid 125mg',
                dosageForm: 'tablet',
                strength: '625mg',
                packSize: '6 tablets',
                image: '/images/Moxkind Cv 625.jpg',
                stock: 25,
                minOrderQuantity: 1,
                maxOrderQuantity: 3,
                prescriptionRequired: true,
                isActive: true,
                rating: 4.1,
                reviewCount: 8
            }
        ];

        const createdMedicines = await Medicine.bulkCreate(medicines);
        console.log('✅ Sample medicines created');

        // Create sample address for test user
        await Address.create({
            userId: testUser.id,
            type: 'home',
            firstName: 'Test',
            lastName: 'User',
            mobile: '8888888888',
            pinCode: '110001',
            state: 'Delhi',
            district: 'Central Delhi',
            address: '123 Main Street, Connaught Place',
            landmark: 'Near Metro Station',
            isDefault: true
        });
        console.log('✅ Sample address created');

        // Create sample reviews
        const reviews = [
            {
                userId: testUser.id,
                medicineId: createdMedicines[0].id,
                rating: 5,
                comment: 'Very effective for fever and headache relief!'
            },
            {
                userId: testUser.id,
                medicineId: createdMedicines[1].id,
                rating: 4,
                comment: 'Good pain relief, works as expected.'
            }
        ];

        await Review.bulkCreate(reviews);
        console.log('✅ Sample reviews created');

        // Create sample cart items
        await CartItem.create({
            userId: testUser.id,
            medicineId: createdMedicines[0].id,
            quantity: 2
        });

        await CartItem.create({
            userId: testUser.id,
            medicineId: createdMedicines[1].id,
            quantity: 1
        });
        console.log('✅ Sample cart items created');

        console.log('🎉 Database seeding completed successfully!');
        console.log('\n📋 Login Credentials:');
        console.log('Admin: admin@medicart.com / admin123');
        console.log('User: user@medicart.com / user123');
        console.log('\n🚀 You can now start the server with: npm start');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        throw error;
    }
};

// Run seeding if this file is executed directly
if (require.main === module) {
    seedDatabase()
        .then(() => {
            console.log('✅ Seeding completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Seeding failed:', error);
            process.exit(1);
        });
}

module.exports = seedDatabase;
