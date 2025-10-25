const { Sequelize } = require('sequelize');
require('dotenv').config();

const MYSQL_HOST = process.env.MYSQL_HOST || '127.0.0.1';
const MYSQL_PORT = parseInt(process.env.MYSQL_PORT || '3306', 10);
const MYSQL_USER = process.env.MYSQL_USER || 'root';
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || '';
const MYSQL_DB = process.env.MYSQL_DB || 'medical_ecommerce';

async function testMySQL() {
    console.log('Testing MySQL connection...');
    const sequelize = new Sequelize(MYSQL_DB, MYSQL_USER, MYSQL_PASSWORD, {
        host: MYSQL_HOST,
        port: MYSQL_PORT,
        dialect: 'mysql',
        logging: false,
    });

    try {
        await sequelize.authenticate();
        console.log('✅ Connected to MySQL successfully');
        console.log(`Host: ${MYSQL_HOST}:${MYSQL_PORT}`);
        console.log(`Database: ${MYSQL_DB}`);
    } catch (error) {
        console.error('❌ MySQL connection failed:', error.message);
    } finally {
        await sequelize.close();
        console.log('Connection closed');
    }
}

testMySQL();
