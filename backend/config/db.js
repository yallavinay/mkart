const { Sequelize } = require('sequelize');
require('dotenv').config();

// Load MySQL env vars (with sensible defaults for local dev)
const MYSQL_HOST = process.env.MYSQL_HOST || '127.0.0.1';
const MYSQL_PORT = parseInt(process.env.MYSQL_PORT || '3306', 10);
const MYSQL_USER = process.env.MYSQL_USER || 'root';
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || '';
const MYSQL_DB = process.env.MYSQL_DB || 'medical_ecommerce';
const MYSQL_DIALECT = process.env.MYSQL_DIALECT || 'mysql';

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
});

// Function to authenticate and sync (optional)
const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log(`MySQL Connected: ${MYSQL_HOST}:${MYSQL_PORT}`);
        console.log(`Database: ${MYSQL_DB}`);
        // NOTE: Model syncing will happen where models are defined
        // await sequelize.sync(); // enable when models are migrated to Sequelize
    } catch (error) {
        console.error('Error connecting to MySQL:', error.message);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };
