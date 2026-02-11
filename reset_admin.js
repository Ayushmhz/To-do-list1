const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function resetAdmin() {
    try {
        console.log('🔄 Resetting Admin_00 password...\n');

        // Generate fresh hash for Admin@123
        const password = 'Admin@123';
        const hash = await bcrypt.hash(password, 10);

        console.log('Generated hash:', hash);

        // Delete existing admin if any
        await pool.query('DELETE FROM users WHERE username = $1', ['Admin_00']);
        console.log('✅ Deleted old Admin_00 (if existed)');

        // Insert fresh admin
        await pool.query(
            'INSERT INTO users (username, email, password) VALUES ($1, $2, $3)',
            ['Admin_00', 'admin@todo.com', hash]
        );

        console.log('✅ Created fresh Admin_00 with password: Admin@123');
        console.log('\nYou can now log in at your Render site!');

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

resetAdmin();
