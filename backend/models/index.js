const { Sequelize, DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// User Model
const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    firstName: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    lastName: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    mobile: {
        type: DataTypes.STRING(15),
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('user', 'admin'),
        defaultValue: 'user'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    lastLogin: {
        type: DataTypes.DATE
    }
}, {
    tableName: 'users',
    timestamps: true
});

// Address Model
const Address = sequelize.define('Address', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    type: {
        type: DataTypes.ENUM('home', 'work', 'other'),
        defaultValue: 'home'
    },
    firstName: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    lastName: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    mobile: {
        type: DataTypes.STRING(15),
        allowNull: false
    },
    pinCode: {
        type: DataTypes.STRING(10),
        allowNull: false
    },
    state: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    district: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    landmark: {
        type: DataTypes.STRING(100)
    },
    isDefault: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'addresses',
    timestamps: true
});

// Medicine Model
const Medicine = sequelize.define('Medicine', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    brand: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    genericName: {
        type: DataTypes.STRING(200)
    },
    manufacturer: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    batchNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    expiryDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    mrp: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    sellingPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    discount: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0
    },
    category: {
        type: DataTypes.ENUM('prescription', 'otc', 'supplements', 'medical-devices', 'personal-care'),
        allowNull: false
    },
    subCategory: {
        type: DataTypes.STRING(100)
    },
    description: {
        type: DataTypes.TEXT
    },
    composition: {
        type: DataTypes.TEXT
    },
    dosageForm: {
        type: DataTypes.ENUM('tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment', 'drops', 'powder'),
        allowNull: false
    },
    strength: {
        type: DataTypes.STRING(50)
    },
    packSize: {
        type: DataTypes.STRING(50)
    },
    image: {
        type: DataTypes.TEXT('long'),
        allowNull: false
    },
    images: {
        type: DataTypes.JSON
    },
    stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    minOrderQuantity: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    maxOrderQuantity: {
        type: DataTypes.INTEGER,
        defaultValue: 10
    },
    prescriptionRequired: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    tags: {
        type: DataTypes.JSON
    },
    rating: {
        type: DataTypes.DECIMAL(3, 2),
        defaultValue: 0
    },
    reviewCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'medicines',
    timestamps: true
});

// Review Model
const Review = sequelize.define('Review', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    medicineId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'medicines',
            key: 'id'
        }
    },
    rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 5
        }
    },
    comment: {
        type: DataTypes.TEXT
    }
}, {
    tableName: 'reviews',
    timestamps: true
});

// Order Model
const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    orderNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    discountAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    shippingCharges: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    finalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    orderStatus: {
        type: DataTypes.ENUM('pending', 'confirmed', 'processing', 'shipped', 'out-for-delivery', 'delivered', 'cancelled'),
        defaultValue: 'pending'
    },
    paymentStatus: {
        type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
        defaultValue: 'pending'
    },
    paymentMethod: {
        type: DataTypes.ENUM('cod', 'online', 'wallet', 'upi'),
        allowNull: false
    },
    shippingAddress: {
        type: DataTypes.JSON,
        allowNull: false
    },
    billingAddress: {
        type: DataTypes.JSON,
        allowNull: false
    },
    deliveryDate: {
        type: DataTypes.DATE
    },
    deliveredAt: {
        type: DataTypes.DATE
    },
    cancelledAt: {
        type: DataTypes.DATE
    },
    cancellationReason: {
        type: DataTypes.STRING(500)
    },
    trackingNumber: {
        type: DataTypes.STRING(100)
    },
    notes: {
        type: DataTypes.TEXT
    },
    prescriptionImages: {
        type: DataTypes.JSON
    }
}, {
    tableName: 'orders',
    timestamps: true
});

// OrderItem Model
const OrderItem = sequelize.define('OrderItem', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    orderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'orders',
            key: 'id'
        }
    },
    medicineId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'medicines',
            key: 'id'
        }
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    mrp: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    discount: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0
    }
}, {
    tableName: 'order_items',
    timestamps: true
});

// CartItem Model
const CartItem = sequelize.define('CartItem', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    medicineId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'medicines',
            key: 'id'
        }
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    }
}, {
    tableName: 'cart_items',
    timestamps: true
});

// Define Associations
User.hasMany(Address, { foreignKey: 'userId', as: 'addresses' });
Address.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Review, { foreignKey: 'userId', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Medicine.hasMany(Review, { foreignKey: 'medicineId', as: 'reviews' });
Review.belongsTo(Medicine, { foreignKey: 'medicineId', as: 'medicine' });

User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

Medicine.hasMany(OrderItem, { foreignKey: 'medicineId', as: 'orderItems' });
OrderItem.belongsTo(Medicine, { foreignKey: 'medicineId', as: 'medicine' });

User.hasMany(CartItem, { foreignKey: 'userId', as: 'cartItems' });
CartItem.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Medicine.hasMany(CartItem, { foreignKey: 'medicineId', as: 'cartItems' });
CartItem.belongsTo(Medicine, { foreignKey: 'medicineId', as: 'medicine' });

// Sync function
const syncDatabase = async () => {
    try {
        await sequelize.sync({ alter: true });
        console.log('✅ Database tables synchronized successfully');
    } catch (error) {
        console.error('❌ Database sync failed:', error);
        throw error;
    }
};

module.exports = {
    sequelize,
    User,
    Address,
    Medicine,
    Review,
    Order,
    OrderItem,
    CartItem,
    syncDatabase
};
