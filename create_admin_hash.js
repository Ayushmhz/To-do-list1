const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
require('dotenv').config();

const connectDB = require('./db');
connectDB();

async function createAdmin() {
    try {
        const username = 'admin_00';
        const password = 'Admin@123';
        const email = 'admin@system.com';

        // Check if admin already exists
        const existingAdmin = await User.findOne({ username });
        if (existingAdmin) {
            console.log('✅ Admin user already exists in MongoDB.');
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newAdmin = new User({
            username,
            email,
            password: hashedPassword
        });

        await newAdmin.save();
        console.log('✅ MongoDB Admin User (admin_00) successfully created!');
        console.log('You can now log in with Password: Admin@123');
        process.exit(0);
    } catch (err) {
        console.error('Error creating admin:', err);
        process.exit(1);
    }
}

createAdmin();
