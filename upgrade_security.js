const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

const saltRounds = 10;

async function hashOldPasswords() {
    console.log('🛡️ Starting password security upgrade...');

    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'todo_db'
    });

    try {
        const [users] = await db.execute('SELECT id, password FROM users');
        console.log(`👥 Found ${users.length} users to upgrade.`);

        for (const user of users) {
            // Check if already hashed (bcrypt hashes start with $2b$ or $2a$)
            if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
                console.log(`   User ID ${user.id} already has a secure password. Skipping.`);
                continue;
            }

            console.log(`   Securing password for user ID ${user.id}...`);
            const hashedPassword = await bcrypt.hash(user.password, saltRounds);
            await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);
        }

        console.log('✅ All passwords are now securely hashed!');
    } catch (error) {
        console.error('❌ Upgrade error:', error.message);
    } finally {
        await db.end();
    }
}

hashOldPasswords();
