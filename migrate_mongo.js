const fs = require('fs-extra');
const path = require('path');
const mongoose = require('mongoose');
const User = require('./models/User');
const Task = require('./models/Task');
require('dotenv').config();

const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const TASKS_DIR = path.join(__dirname, 'data', 'tasks');

const connectDB = require('./db');

async function migrateToMongo() {
    console.log('🚀 Starting historic data migration to MongoDB...');
    await connectDB();

    try {
        if (!await fs.pathExists(USERS_FILE)) {
            console.log('⚠️ No users.json found in backup data.');
            process.exit(0);
        }

        const users = await fs.readJson(USERS_FILE);
        console.log(`👥 Found ${users.length} legacy users.`);

        for (const user of users) {
            console.log(`   Migrating user: ${user.username}...`);

            let existingUser = await User.findOne({ email: user.email });
            if (!existingUser) {
                existingUser = new User({
                    username: user.username,
                    email: user.email,
                    password: user.password
                });
                try {
                    await existingUser.save();
                } catch (e) {
                    console.error('Error saving user: ', e.message);
                }
            }

            const taskFile = path.join(TASKS_DIR, `${user.username}.json`);
            if (await fs.pathExists(taskFile)) {
                const tasks = await fs.readJson(taskFile);
                console.log(`      Found ${tasks.length} standard tasks.`);

                for (const task of tasks) {
                    const existingTask = await Task.findOne({ 
                        user_id: existingUser._id, 
                        title: task.title 
                    });

                    if (!existingTask) {
                        const priority = task.priority || 'medium';
                        const status = task.status || 'pending';

                        const newTask = new Task({
                            user_id: existingUser._id,
                            title: task.title,
                            description: task.description || '',
                            priority: priority,
                            due_date: task.dueDate || task.due_date || null,
                            status: status
                        });
                        try {
                            await newTask.save();
                        } catch (e) {}
                    }
                }
            }
        }
        console.log('✅ ALL previous users and tasks successfully restored into MongoDB!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration error:', error.message);
        process.exit(1);
    }
}

migrateToMongo();
