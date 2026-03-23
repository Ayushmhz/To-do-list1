require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const connectDB = require('./db');
const User = require('./models/User');
const Task = require('./models/Task');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({ origin: '*' }));
// Robust CORS fallback for Render to Netlify
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});
app.use(bodyParser.json());
app.use(express.static(__dirname));

// ============ AUTHENTICATION ENDPOINTS ============

// Register
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        const usernameLower = username.toLowerCase();
        // Restored: Block admin_00 registration for security
        const reservedNames = ['admin_00', 'admin', 'administrator', 'system', 'root', 'support'];
        if (reservedNames.includes(usernameLower)) {
            return res.status(400).json({ error: 'This username is reserved for system use.' });
        }

        // Check if user exists
        const existing = await User.findOne({ $or: [{ username }, { email }] });

        if (existing) {
            return res.status(400).json({ error: 'Username or Email already exists!' });
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = new User({
            username,
            email,
            password: hashedPassword
        });
        await newUser.save();

        res.json({ success: true, message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Please enter your credentials.' });
        }

        const user = await User.findOne({ username });

        if (user) {
            const isMatch = await bcrypt.compare(password, user.password);

            if (isMatch) {
                res.json({
                    success: true,
                    user: { username: user.username, email: user.email }
                });
            } else {
                res.status(401).json({ error: 'Access Denied: Invalid username or password' });
            }
        } else {
            res.status(401).json({ error: 'Access Denied: Invalid username or password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Change Password
app.post('/api/change-password', async (req, res) => {
    try {
        const { username, currentPassword, newPassword } = req.body;
        if (!username || !currentPassword || !newPassword) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            return res.status(401).json({ error: 'Incorrect current password' });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
        user.password = hashedNewPassword;
        await user.save();

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ============ TASK ENDPOINTS ============

// Get user tasks
app.get('/api/tasks', async (req, res) => {
    try {
        const { username } = req.query;
        if (!username) return res.status(400).json({ error: 'Username required' });

        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const tasks = await Task.find({ user_id: user._id }).sort({ created_at: -1 });
        
        // Map fields to match previous SQL response
        const formattedTasks = tasks.map(t => ({
            id: t._id,
            title: t.title,
            description: t.description,
            priority: t.priority,
            dueDate: t.due_date,
            status: t.status,
            createdAt: t.created_at
        }));

        res.json({ tasks: formattedTasks });
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create task
app.post('/api/tasks', async (req, res) => {
    try {
        const { username, task } = req.body;
        if (!username || !task) return res.status(400).json({ error: 'Missing data' });

        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const newTask = new Task({
            user_id: user._id,
            title: task.title,
            description: task.description,
            priority: task.priority,
            due_date: task.dueDate || null,
            status: task.status || 'pending'
        });
        await newTask.save();

        // Fetch updated tasks
        const tasks = await Task.find({ user_id: user._id }).sort({ created_at: -1 });
        const formattedTasks = tasks.map(t => ({
            id: t._id,
            title: t.title,
            description: t.description,
            priority: t.priority,
            dueDate: t.due_date,
            status: t.status,
            createdAt: t.created_at
        }));

        res.json({ success: true, tasks: formattedTasks });
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update task
app.put('/api/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { username, task } = req.body;

        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ error: 'User not found' });

        await Task.findOneAndUpdate(
            { _id: id, user_id: user._id },
            {
                title: task.title,
                description: task.description,
                priority: task.priority,
                due_date: task.dueDate || null,
                status: task.status
            }
        );

        const tasks = await Task.find({ user_id: user._id }).sort({ created_at: -1 });
        const formattedTasks = tasks.map(t => ({
            id: t._id,
            title: t.title,
            description: t.description,
            priority: t.priority,
            dueDate: t.due_date,
            status: t.status,
            createdAt: t.created_at
        }));

        res.json({ success: true, tasks: formattedTasks });
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete task
app.delete('/api/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { username } = req.query;

        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ error: 'User not found' });

        await Task.findOneAndDelete({ _id: id, user_id: user._id });

        const tasks = await Task.find({ user_id: user._id }).sort({ created_at: -1 });
        const formattedTasks = tasks.map(t => ({
            id: t._id,
            title: t.title,
            description: t.description,
            priority: t.priority,
            dueDate: t.due_date,
            status: t.status,
            createdAt: t.created_at
        }));

        res.json({ success: true, tasks: formattedTasks });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ============ ADMIN ENDPOINTS ============

app.get('/api/admin/users', async (req, res) => {
    try {
        const { adminUsername } = req.query;
        if (!adminUsername || adminUsername.toLowerCase() !== 'admin_00') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const users = await User.find({});
        
        const formattedUsers = await Promise.all(users.map(async u => {
            const taskCount = await Task.countDocuments({ user_id: u._id });
            return {
                id: u._id,
                username: u.username,
                email: u.email,
                password: u.password,
                taskCount: taskCount
            };
        }));

        res.json({ users: formattedUsers });
    } catch (error) {
        console.error('Admin get users error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin Reset Password
app.post('/api/admin/reset-password', async (req, res) => {
    try {
        const { adminUsername, targetUsername, newPassword } = req.body;

        if (!adminUsername || adminUsername.toLowerCase() !== 'admin_00') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        if (!targetUsername || !newPassword) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        const result = await User.findOneAndUpdate(
            { username: targetUsername },
            { password: hashedPassword }
        );
        
        if (!result) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ success: true, message: `Password for ${targetUsername} has been reset.` });
    } catch (error) {
        console.error('Admin reset password error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete specific user (Admin)
app.delete('/api/admin/users/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const { adminUsername } = req.query;

        if (!adminUsername || adminUsername.toLowerCase() !== 'admin_00') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        if (username.toLowerCase() === 'admin_00') {
            return res.status(400).json({ error: 'Cannot delete admin account' });
        }

        const user = await User.findOneAndDelete({ username });
        if (user) {
            await Task.deleteMany({ user_id: user._id });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Admin delete user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
    console.log(`🛢️  Connected via MongoDB Mongoose`);
});
