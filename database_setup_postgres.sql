-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(10) DEFAULT 'medium',
    due_date DATE,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Default Admin (Password: Admin@123 hashed with bcrypt)
-- Note: You should register a new admin locally to get the correct hash, 
-- or use the upgrade_security.js logic to hash your existing ones.
INSERT INTO users (username, email, password) 
VALUES ('Admin_00', 'admin@todo.com', '$2b$10$YourHashedPasswordHere')
ON CONFLICT (username) DO NOTHING;
