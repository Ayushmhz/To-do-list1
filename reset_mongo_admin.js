const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect('mongodb+srv://to-do-list:nfF58fbSSrA2iszK@to-do-list.u56rqem.mongodb.net/todo-list').then(async () => {
    const hp = await bcrypt.hash('Admin@123', 10);
    const updated = await User.findOneAndUpdate({ username: 'admin_00' }, { password: hp });
    if (updated) {
        console.log('✅ Success! Admin_00 password has been forcibly reset to: Admin@123');
    } else {
        console.log('❌ Error: Could not find admin_00 in database');
    }
    process.exit(0);
});
