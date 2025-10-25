const express = require('express');
const router = express.Router();
const { Medicine } = require('../models');
const { Op } = require('sequelize');

// Get all medicines with pagination and filtering
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        
        const whereClause = { isActive: true };
        
        // Category filter
        if (req.query.category) {
            whereClause.category = req.query.category;
        }
        
        // Search filter
        if (req.query.search) {
            whereClause[Op.or] = [
                { name: { [Op.like]: `%${req.query.search}%` } },
                { brand: { [Op.like]: `%${req.query.search}%` } },
                { genericName: { [Op.like]: `%${req.query.search}%` } }
            ];
        }
        
        // Price range filter
        if (req.query.minPrice || req.query.maxPrice) {
            whereClause.sellingPrice = {};
            if (req.query.minPrice) whereClause.sellingPrice[Op.gte] = parseFloat(req.query.minPrice);
            if (req.query.maxPrice) whereClause.sellingPrice[Op.lte] = parseFloat(req.query.maxPrice);
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

// Get medicine by ID
router.get('/:id', async (req, res) => {
    try {
        const medicine = await Medicine.findByPk(req.params.id);
        
        if (!medicine) {
            return res.status(404).json({ message: 'Medicine not found' });
        }
        
        res.status(200).json(medicine);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch medicine', error: error.message });
    }
});

// Search medicines
router.get('/search/:query', async (req, res) => {
    try {
        const query = req.params.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        
        const { count, rows: medicines } = await Medicine.findAndCountAll({
            where: {
                [Op.and]: [
                    { isActive: true },
                    {
                        [Op.or]: [
                            { name: { [Op.like]: `%${query}%` } },
                            { brand: { [Op.like]: `%${query}%` } },
                            { genericName: { [Op.like]: `%${query}%` } },
                            { description: { [Op.like]: `%${query}%` } }
                        ]
                    }
                ]
            },
            order: [['rating', 'DESC'], ['reviewCount', 'DESC']],
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
        res.status(500).json({ message: 'Search failed', error: error.message });
    }
});

// Get medicines by category
router.get('/category/:category', async (req, res) => {
    try {
        const category = req.params.category;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        
        const { count, rows: medicines } = await Medicine.findAndCountAll({
            where: {
                category: category,
                isActive: true
            },
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
        res.status(500).json({ message: 'Failed to fetch medicines by category', error: error.message });
    }
});

// Get featured medicines
router.get('/featured/list', async (req, res) => {
    try {
        const medicines = await Medicine.findAll({
            where: {
                isActive: true,
                rating: { [Op.gte]: 4 }
            },
            order: [['rating', 'DESC'], ['reviewCount', 'DESC']],
            limit: 10
        });
        
        res.status(200).json(medicines);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch featured medicines', error: error.message });
    }
});

// Get categories
router.get('/categories/list', async (req, res) => {
    try {
        const categories = await Medicine.findAll({
            attributes: ['category'],
            where: { isActive: true },
            group: ['category'],
            raw: true
        });
        
        const categoryList = categories.map(cat => cat.category);
        res.status(200).json(categoryList);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch categories', error: error.message });
    }
});

module.exports = router;