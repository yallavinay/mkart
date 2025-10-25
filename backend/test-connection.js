const { Sequelize } = require('sequelize');
const path = require('path');
const dotenv = require('dotenv');

// Load only backend .env
dotenv.config({ path: path.join(__dirname, '.env') });

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = parseInt(process.env.DB_PORT || '5432', 10);
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'medical_ecommerce';

async function testPostgres() {
    console.log('Testing PostgreSQL connection...');
    const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
        host: DB_HOST,
        port: DB_PORT,
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false,
            },
        },
    });

    try {
        await sequelize.authenticate();
        console.log('✅ Connected to PostgreSQL successfully');
        console.log(`Host: ${DB_HOST}:${DB_PORT}`);
        console.log(`Database: ${DB_NAME}`);
    } catch (error) {
        console.error('❌ PostgreSQL connection failed:', error.message);
    } finally {
        await sequelize.close();
        console.log('Connection closed');
    }
}

testPostgres();
