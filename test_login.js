const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
require('dotenv').config();

const connectDB = require('./db');
connectDB();

async function testLogin() {
    try {
        const username = 'admin_00';
        const password = 'Admin@123';

        const user = await User.findOne({ username });
        if (!user) {
            console.log('User not found!');
            process.exit(1);
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            console.log('✅ PASSWORDS MATCH in DB!');
        } else {
            console.log('❌ PASSWORDS DO NOT MATCH in DB!');
        }
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

testLogin();
