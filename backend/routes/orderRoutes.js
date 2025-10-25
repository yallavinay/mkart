const express = require('express');
const router = express.Router();
const { Order, OrderItem, User, Medicine, CartItem } = require('../models');
const { authenticateSession } = require('../middleware/auth');

// Create new order
router.post('/', authenticateSession, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get cart items
        const cartItems = await CartItem.findAll({
            where: { userId: user.id },
            include: [{ model: Medicine, as: 'medicine' }]
        });

        if (cartItems.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        const { shippingAddress, billingAddress, paymentMethod, prescriptionImages } = req.body;

        // Calculate order total
        let totalAmount = 0;
        let discountAmount = 0;
        const orderItems = [];

        for (const cartItem of cartItems) {
            const medicine = cartItem.medicine;
            const quantity = cartItem.quantity;

            if (medicine.stock < quantity) {
                return res.status(400).json({ 
                    message: `Insufficient stock for ${medicine.name}. Available: ${medicine.stock}` 
                });
            }

            const itemTotal = medicine.sellingPrice * quantity;
            const itemDiscount = (medicine.mrp - medicine.sellingPrice) * quantity;
            
            totalAmount += itemTotal;
            discountAmount += itemDiscount;

            orderItems.push({
                medicineId: medicine.id,
                quantity,
                price: medicine.sellingPrice,
                mrp: medicine.mrp,
                discount: itemDiscount
            });
        }

        const shippingCharges = totalAmount > 500 ? 0 : 50; // Free shipping above ₹500
        const codFee = paymentMethod === 'cod' ? 10 : 0;
        const finalAmount = totalAmount + shippingCharges + codFee;

        // Generate order number
        const orderNumber = 'ORD' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();

        // Create order
        const order = await Order.create({
            orderNumber,
            userId: user.id,
            shippingAddress,
            billingAddress: billingAddress || shippingAddress,
            paymentMethod,
            totalAmount,
            discountAmount,
            shippingCharges,
            finalAmount,
            prescriptionImages: prescriptionImages || []
        });

        // Create order items
        for (const item of orderItems) {
            await OrderItem.create({
                orderId: order.id,
                medicineId: item.medicineId,
                quantity: item.quantity,
                price: item.price,
                mrp: item.mrp,
                discount: item.discount
            });
        }

        // Update medicine stock
        for (const cartItem of cartItems) {
            await Medicine.decrement('stock', {
                by: cartItem.quantity,
                where: { id: cartItem.medicineId }
            });
        }

        // Clear user cart
        await CartItem.destroy({ where: { userId: user.id } });

        // Emit real-time update
        const io = req.app.get('io');
        if (io) {
            io.to(user.id.toString()).emit('orderCreated', order);
        }

        // Get order with items
        const orderWithItems = await Order.findByPk(order.id, {
            include: [
                {
                    model: OrderItem,
                    as: 'items',
                    include: [{ model: Medicine, as: 'medicine' }]
                }
            ]
        });

        res.status(201).json({ 
            message: 'Order created successfully', 
            order: orderWithItems
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create order', error: error.message });
    }
});

// Get user orders
router.get('/', authenticateSession, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const { count, rows: orders } = await Order.findAndCountAll({
            where: { userId: req.user.id },
            include: [
                {
                    model: OrderItem,
                    as: 'items',
                    include: [{ model: Medicine, as: 'medicine' }]
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

// Get order by ID
router.get('/:id', authenticateSession, async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id, {
            include: [
                {
                    model: OrderItem,
                    as: 'items',
                    include: [{ model: Medicine, as: 'medicine' }]
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'email', 'firstName', 'lastName']
                }
            ]
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if user owns this order or is admin
        if (order.userId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch order', error: error.message });
    }
});

// Cancel order
router.put('/:id/cancel', authenticateSession, async (req, res) => {
    try {
        const { cancellationReason } = req.body;

        const order = await Order.findByPk(req.params.id, {
            include: [
                {
                    model: OrderItem,
                    as: 'items',
                    include: [{ model: Medicine, as: 'medicine' }]
                }
            ]
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if user owns this order
        if (order.userId !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Check if order can be cancelled
        if (!['pending', 'confirmed'].includes(order.orderStatus)) {
            return res.status(400).json({ 
                message: 'Order cannot be cancelled at this stage' 
            });
        }

        // Restore medicine stock
        for (const item of order.items) {
            await Medicine.increment('stock', {
                by: item.quantity,
                where: { id: item.medicineId }
            });
        }

        // Update order status
        await order.update({
            orderStatus: 'cancelled',
            cancelledAt: new Date(),
            cancellationReason
        });

        // Emit real-time update
        const io = req.app.get('io');
        if (io) {
            io.to(order.userId.toString()).emit('orderCancelled', order);
        }

        res.status(200).json({ message: 'Order cancelled successfully', order });
    } catch (error) {
        res.status(500).json({ message: 'Failed to cancel order', error: error.message });
    }
});

// Track order
router.get('/:id/track', authenticateSession, async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id, {
            attributes: ['id', 'orderNumber', 'orderStatus', 'trackingNumber', 'createdAt', 'deliveredAt']
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if user owns this order
        if (order.userId !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Generate tracking status
        const trackingStatus = {
            orderNumber: order.orderNumber,
            status: order.orderStatus,
            trackingNumber: order.trackingNumber,
            createdAt: order.createdAt,
            deliveredAt: order.deliveredAt,
            timeline: [
                {
                    status: 'Order Placed',
                    timestamp: order.createdAt,
                    completed: true
                },
                {
                    status: 'Confirmed',
                    timestamp: order.orderStatus === 'confirmed' ? order.createdAt : null,
                    completed: ['confirmed', 'processing', 'shipped', 'out-for-delivery', 'delivered'].includes(order.orderStatus)
                },
                {
                    status: 'Processing',
                    timestamp: order.orderStatus === 'processing' ? order.createdAt : null,
                    completed: ['processing', 'shipped', 'out-for-delivery', 'delivered'].includes(order.orderStatus)
                },
                {
                    status: 'Shipped',
                    timestamp: order.orderStatus === 'shipped' ? order.createdAt : null,
                    completed: ['shipped', 'out-for-delivery', 'delivered'].includes(order.orderStatus)
                },
                {
                    status: 'Out for Delivery',
                    timestamp: order.orderStatus === 'out-for-delivery' ? order.createdAt : null,
                    completed: ['out-for-delivery', 'delivered'].includes(order.orderStatus)
                },
                {
                    status: 'Delivered',
                    timestamp: order.deliveredAt,
                    completed: order.orderStatus === 'delivered'
                }
            ]
        };

        res.status(200).json(trackingStatus);
    } catch (error) {
        res.status(500).json({ message: 'Failed to track order', error: error.message });
    }
});

module.exports = router;