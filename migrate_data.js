const mysql = require('mysql2/promise');
const fs = require('fs-extra');
const path = require('path');
require('dotenv').config();

const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const TASKS_DIR = path.join(__dirname, 'data', 'tasks');

async function migrate() {
    console.log('🚀 Starting data migration from JSON to MySQL...');

    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'todo_db'
    });

    try {
        if (!await fs.pathExists(USERS_FILE)) {
            console.log('⚠️ No users.json found. Skipping migration.');
            return;
        }

        const users = await fs.readJson(USERS_FILE);
        console.log(`👥 Found ${users.length} users in JSON.`);

        for (const user of users) {
            console.log(`   Migrating user: ${user.username}...`);

            // Insert or Update User (using ON DUPLICATE KEY UPDATE to avoid errors if Admin_00 exists)
            await db.execute(
                `INSERT INTO users (username, email, password) 
                 VALUES (?, ?, ?) 
                 ON DUPLICATE KEY UPDATE email = VALUES(email), password = VALUES(password)`,
                [user.username, user.email, user.password]
            );

            // Get the user ID
            const [rows] = await db.execute('SELECT id FROM users WHERE username = ?', [user.username]);
            const userId = rows[0].id;

            // Migrate Tasks for this user
            const taskFile = path.join(TASKS_DIR, `${user.username}.json`);
            if (await fs.pathExists(taskFile)) {
                const tasks = await fs.readJson(taskFile);
                console.log(`      Found ${tasks.length} tasks for ${user.username}.`);

                for (const task of tasks) {
                    // Map priorities and statuses if they differ
                    const priority = task.priority || 'medium';
                    const status = task.status || 'pending';

                    await db.execute(
                        `INSERT INTO tasks (user_id, title, description, priority, due_date, status) 
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [userId, task.title, task.description || '', priority, task.dueDate || null, status]
                    );
                }
            }
        }

        console.log('✅ Data migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration error:', error.message);
    } finally {
        await db.end();
    }
}

migrate();
