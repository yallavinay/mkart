const express = require('express');
const router = express.Router();
const { Medicine, Order, OrderItem, User, Review } = require('../models');
const { Op } = require('sequelize');

// Admin authentication middleware
const authenticateAdmin = async (req, res, next) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const user = await User.findByPk(req.session.userId);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }
        req.user = user;
        next();
    } catch (error) {
        res.status(500).json({ message: 'Authentication error' });
    }
};

// Apply admin middleware to all routes
router.use(authenticateAdmin);

// Dashboard stats
router.get('/dashboard', async (req, res) => {
    try {
        const totalUsers = await User.count();
        const totalMedicines = await Medicine.count();
        const totalOrders = await Order.count();
        const pendingOrders = await Order.count({ where: { orderStatus: 'pending' } });
        
        // Calculate total revenue from delivered orders
        const deliveredOrders = await Order.findAll({
            where: { orderStatus: 'delivered' },
            attributes: ['finalAmount']
        });
        const totalRevenue = deliveredOrders.reduce((sum, order) => sum + parseFloat(order.finalAmount), 0);

        const recentOrders = await Order.findAll({
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'email']
                },
                {
                    model: OrderItem,
                    as: 'items',
                    include: [{ model: Medicine, as: 'medicine', attributes: ['name'] }]
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: 10
        });

        const lowStockMedicines = await Medicine.findAll({
            where: {
                stock: { [Op.lte]: 10 },
                isActive: true
            },
            limit: 10
        });

        res.status(200).json({
            stats: {
                totalUsers,
                totalMedicines,
                totalOrders,
                pendingOrders,
                totalRevenue
            },
            recentOrders,
            lowStockMedicines
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch dashboard data', error: error.message });
    }
});

// Medicine management routes
router.get('/medicines', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const whereClause = {};
        if (req.query.search) {
            whereClause[Op.or] = [
                { name: { [Op.like]: `%${req.query.search}%` } },
                { brand: { [Op.like]: `%${req.query.search}%` } },
                { genericName: { [Op.like]: `%${req.query.search}%` } }
            ];
        }
        if (req.query.category) {
            whereClause.category = req.query.category;
        }

        const { count, rows: medicines } = await Medicine.findAndCountAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        res.status(200).json({
            medicines,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(count / limit),
                totalItems: count,
                itemsPerPage: limit
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch medicines', error: error.message });
    }
});

// Add new medicine
router.post('/medicines', async (req, res) => {
    try {
        const medicineData = req.body;
        
        // Check if batch number already exists
        const existingMedicine = await Medicine.findOne({ 
            where: { batchNumber: medicineData.batchNumber } 
        });
        if (existingMedicine) {
            return res.status(400).json({ message: 'Medicine with this batch number already exists' });
        }

        const medicine = await Medicine.create(medicineData);

        res.status(201).json({ message: 'Medicine added successfully', medicine });
    } catch (error) {
        res.status(500).json({ message: 'Failed to add medicine', error: error.message });
    }
});

// Update medicine
router.put('/medicines/:id', async (req, res) => {
    try {
        const medicine = await Medicine.findByPk(req.params.id);
        if (!medicine) {
            return res.status(404).json({ message: 'Medicine not found' });
        }

        await medicine.update(req.body);

        res.status(200).json({ message: 'Medicine updated successfully', medicine });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update medicine', error: error.message });
    }
});

// Delete medicine
router.delete('/medicines/:id', async (req, res) => {
    try {
        const medicine = await Medicine.findByPk(req.params.id);
        if (!medicine) {
            return res.status(404).json({ message: 'Medicine not found' });
        }

        await medicine.update({ isActive: false });

        res.status(200).json({ message: 'Medicine deactivated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete medicine', error: error.message });
    }
});

// Toggle medicine status
router.put('/medicines/:id/status', async (req, res) => {
    try {
        const { isActive } = req.body;

        const medicine = await Medicine.findByPk(req.params.id);
        if (!medicine) {
            return res.status(404).json({ message: 'Medicine not found' });
        }

        await medicine.update({ isActive });

        res.status(200).json({ message: 'Medicine status updated successfully', medicine });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update medicine status', error: error.message });
    }
});

// Order management routes
router.get('/orders', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const whereClause = {};
        if (req.query.status) {
            whereClause.orderStatus = req.query.status;
        }
        if (req.query.search) {
            whereClause.orderNumber = { [Op.like]: `%${req.query.search}%` };
        }

        const { count, rows: orders } = await Order.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'email', 'firstName', 'lastName']
                },
                {
                    model: OrderItem,
                    as: 'items',
                    include: [{ model: Medicine, as: 'medicine', attributes: ['name', 'brand'] }]
                }
            ],
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        res.status(200).json({
            orders,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(count / limit),
                totalItems: count,
                itemsPerPage: limit
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
    }
});

// Update order status
router.put('/orders/:id/status', async (req, res) => {
    try {
        const { orderStatus, trackingNumber } = req.body;

        const order = await Order.findByPk(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const updateData = { orderStatus };
        if (trackingNumber) {
            updateData.trackingNumber = trackingNumber;
        }

        if (orderStatus === 'delivered') {
            updateData.deliveredAt = new Date();
        }

        await order.update(updateData);

        // Emit real-time update
        const io = req.app.get('io');
        if (io) {
            io.to(order.userId.toString()).emit('orderStatusUpdated', {
                orderId: order.id,
                orderNumber: order.orderNumber,
                status: orderStatus,
                trackingNumber: order.trackingNumber
            });
        }

        res.status(200).json({ message: 'Order status updated successfully', order });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update order status', error: error.message });
    }
});

// User management routes
router.get('/users', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const whereClause = {};
        if (req.query.search) {
            whereClause[Op.or] = [
                { username: { [Op.like]: `%${req.query.search}%` } },
                { email: { [Op.like]: `%${req.query.search}%` } },
                { firstName: { [Op.like]: `%${req.query.search}%` } },
                { lastName: { [Op.like]: `%${req.query.search}%` } }
            ];
        }

        const { count, rows: users } = await User.findAndCountAll({
            where: whereClause,
            attributes: { exclude: ['password'] },
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        res.status(200).json({
            users,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(count / limit),
                totalItems: count,
                itemsPerPage: limit
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch users', error: error.message });
    }
});

// Update user status
router.put('/users/:id/status', async (req, res) => {
    try {
        const { isActive } = req.body;

        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await user.update({ isActive });

        res.status(200).json({ message: 'User status updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update user status', error: error.message });
    }
});

// Analytics routes
router.get('/analytics/sales', async (req, res) => {
    try {
        const { period = '30' } = req.query;
        const days = parseInt(period);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const salesData = await Order.findAll({
            where: {
                orderStatus: 'delivered',
                createdAt: { [Op.gte]: startDate }
            },
            attributes: [
                'createdAt',
                'finalAmount',
                [Order.sequelize.fn('DATE', Order.sequelize.col('createdAt')), 'date']
            ],
            raw: true
        });

        // Group by date and calculate totals
        const groupedData = salesData.reduce((acc, order) => {
            const date = order.date;
            if (!acc[date]) {
                acc[date] = { totalSales: 0, orderCount: 0 };
            }
            acc[date].totalSales += parseFloat(order.finalAmount);
            acc[date].orderCount += 1;
            return acc;
        }, {});

        const result = Object.entries(groupedData).map(([date, data]) => ({
            date,
            totalSales: data.totalSales,
            orderCount: data.orderCount
        }));

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch sales analytics', error: error.message });
    }
});

router.get('/analytics/products', async (req, res) => {
    try {
        const topProducts = await OrderItem.findAll({
            include: [
                {
                    model: Medicine,
                    as: 'medicine',
                    attributes: ['name', 'brand']
                },
                {
                    model: Order,
                    as: 'order',
                    where: { orderStatus: 'delivered' },
                    attributes: []
                }
            ],
            attributes: [
                'medicineId',
                [OrderItem.sequelize.fn('SUM', OrderItem.sequelize.col('quantity')), 'totalQuantity'],
                [OrderItem.sequelize.fn('SUM', OrderItem.sequelize.literal('OrderItem.price * OrderItem.quantity')), 'totalRevenue']
            ],
            group: ['medicineId'],
            order: [[OrderItem.sequelize.fn('SUM', OrderItem.sequelize.col('quantity')), 'DESC']],
            limit: 10,
            raw: true
        });

        res.status(200).json(topProducts);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch product analytics', error: error.message });
    }
});

module.exports = router;