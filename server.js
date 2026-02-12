require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./db');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
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
        const reservedNames = ['admin_00', 'admin', 'administrator', 'system', 'root', 'support'];
        if (reservedNames.includes(usernameLower)) {
            return res.status(400).json({ error: 'This username is reserved for system use.' });
        }

        // Check if user exists
        const [existing] = await db.execute(
            'SELECT * FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Username or Email already exists!' });
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);

        await db.execute(
            'INSERT INTO users (username, email, password) VALUES ($1, $2, $3)',
            [username, email, hashedPassword]
        );

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

        const [users] = await db.execute(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );

        if (users.length > 0) {
            const user = users[0];
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

        const [users] = await db.execute('SELECT * FROM users WHERE username = $1', [username]);
        if (users.length === 0) return res.status(404).json({ error: 'User not found' });

        const user = users[0];
        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            return res.status(401).json({ error: 'Incorrect current password' });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
        await db.execute('UPDATE users SET password = $1 WHERE id = $2', [hashedNewPassword, user.id]);

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

        const [tasks] = await db.execute(
            `SELECT t.id, t.title, t.description, t.priority, t.due_date AS "dueDate", t.status, t.created_at AS "createdAt"
             FROM tasks t 
             JOIN users u ON t.user_id = u.id 
             WHERE u.username = $1 ORDER BY t.created_at DESC`,
            [username]
        );
        res.json({ tasks });
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

        const [user] = await db.execute('SELECT id FROM users WHERE username = $1', [username]);
        if (user.length === 0) return res.status(404).json({ error: 'User not found' });

        await db.execute(
            'INSERT INTO tasks (user_id, title, description, priority, due_date, status) VALUES ($1, $2, $3, $4, $5, $6)',
            [user[0].id, task.title, task.description, task.priority, task.dueDate || null, task.status || 'pending']
        );

        // Fetch updated tasks
        const [tasks] = await db.execute(
            'SELECT id, title, description, priority, due_date AS "dueDate", status, created_at AS "createdAt" FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
            [user[0].id]
        );
        res.json({ success: true, tasks });
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

        const [user] = await db.execute('SELECT id FROM users WHERE username = $1', [username]);
        if (user.length === 0) return res.status(404).json({ error: 'User not found' });

        await db.execute(
            'UPDATE tasks SET title = $1, description = $2, priority = $3, due_date = $4, status = $5 WHERE id = $6 AND user_id = $7',
            [task.title, task.description, task.priority, task.dueDate || null, task.status, id, user[0].id]
        );

        const [tasks] = await db.execute(
            'SELECT id, title, description, priority, due_date AS "dueDate", status, created_at AS "createdAt" FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
            [user[0].id]
        );
        res.json({ success: true, tasks });
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

        const [user] = await db.execute('SELECT id FROM users WHERE username = $1', [username]);
        if (user.length === 0) return res.status(404).json({ error: 'User not found' });

        await db.execute('DELETE FROM tasks WHERE id = $1 AND user_id = $2', [id, user[0].id]);

        const [tasks] = await db.execute(
            'SELECT id, title, description, priority, due_date AS "dueDate", status, created_at AS "createdAt" FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
            [user[0].id]
        );
        res.json({ success: true, tasks });
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

        const [users] = await db.execute(`
            SELECT u.id, u.username, u.email, u.password, COUNT(t.id) as "taskCount" 
            FROM users u 
            LEFT JOIN tasks t ON u.id = t.user_id 
            GROUP BY u.id, u.username, u.email, u.password
        `);

        res.json({ users });
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

        const [result] = await db.execute(
            'UPDATE users SET password = $1 WHERE username = $2',
            [hashedPassword, targetUsername]
        );

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

        await db.execute('DELETE FROM users WHERE username = $1', [username]);
        res.json({ success: true });
    } catch (error) {
        console.error('Admin delete user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
    console.log(`🛢️  Connected via PostgreSQL Connection Pool`);
});
