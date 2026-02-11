const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Use the External Database URL from Render for this setup!
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ Error: DATABASE_URL not found in .env file.');
    console.log('Please paste your EXTERNAL DATABASE URL from Render into your .env file first.');
    process.exit(1);
}

const pool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
});

async function setupDatabase() {
    try {
        console.log('⏳ Connecting to Render Database...');
        const sql = fs.readFileSync(path.join(__dirname, 'database_setup_postgres.sql'), 'utf8');

        console.log('🚀 Running schema setup...');
        await pool.query(sql);

        console.log('✅ Database tables created successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Setup Error:', err);
        process.exit(1);
    }
}

setupDatabase();
