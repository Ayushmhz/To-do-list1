const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkAdmin() {
    try {
        console.log('🔍 Checking for Admin_00 in database...\n');
        const result = await pool.query('SELECT username, email FROM users WHERE username = $1', ['Admin_00']);

        if (result.rows.length > 0) {
            console.log('✅ Admin_00 exists in database!');
            console.log('Username:', result.rows[0].username);
            console.log('Email:', result.rows[0].email);
        } else {
            console.log('❌ Admin_00 NOT found in database!');
            console.log('The user needs to be created.');
        }

        // Also check total users
        const allUsers = await pool.query('SELECT COUNT(*) FROM users');
        console.log('\nTotal users in database:', allUsers.rows[0].count);

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

checkAdmin();
