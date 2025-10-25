const { Sequelize } = require('sequelize');
const path = require('path');
const dotenv = require('dotenv');
// Load only the existing backend .env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Load MySQL env vars (with sensible defaults for local dev)
const MYSQL_HOST = process.env.DB_HOST || '127.0.0.1';
const MYSQL_PORT = parseInt(process.env.DB_PORT || '5432', 10);
const MYSQL_USER = process.env.DB_USER || 'postgres';
const MYSQL_PASSWORD = process.env.DB_PASSWORD || '';
const MYSQL_DB = process.env.DB_NAME || 'medical_ecommerce';
const MYSQL_DIALECT = process.env.DB_TYPE || 'postgres';

// Initialize Sequelize instance
const sequelize = new Sequelize(MYSQL_DB, MYSQL_USER, MYSQL_PASSWORD, {
    host: MYSQL_HOST,
    port: MYSQL_PORT,
    dialect: MYSQL_DIALECT,
    logging: false,
    define: {
        timestamps: true,
        underscored: true,
    },
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
    dialectOptions: MYSQL_DIALECT === 'postgres' ? {
        ssl: {
            require: true,
            rejectUnauthorized: false,
        },
    } : {},
});

// Function to authenticate and sync (optional)
const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log(`PostgreSQL Connected: ${MYSQL_HOST}:${MYSQL_PORT}`);
        console.log(`Database: ${MYSQL_DB}`);
        // NOTE: Model syncing will happen where models are defined
        // await sequelize.sync(); // enable when models are migrated to Sequelize
    } catch (error) {
        console.error('Error connecting to PostgreSQL:', error.message);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };
