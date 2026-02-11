const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setup() {
    if (!process.env.DB_PASSWORD) {
        console.error('❌ Error: DB_PASSWORD is not set in .env file.');
        process.exit(1);
    }

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        multipleStatements: true
    });

    try {
        const sql = fs.readFileSync(path.join(__dirname, 'database_setup.sql'), 'utf8');
        console.log('⏳ Setting up database and tables...');
        await connection.query(sql);
        console.log('✅ Database setup complete!');
    } catch (err) {
        console.error('❌ Error during database setup:', err.message);
    } finally {
        await connection.end();
    }
}

setup();
