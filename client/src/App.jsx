import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css'; // Utilizing your existing glorious CSS!

const SERVICE_URL = 'http://localhost:3000/api';

// Placeholder Pages for iteration
const LoginRegister = () => <div>Login/Register Page Migration in Progress...</div>;
const Dashboard = () => <div>To-Do List Dashboard Migration in Progress...</div>;
const AdminPanel = () => <div>Admin Panel Migration in Progress...</div>;

export default function App() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    // 1. Initial State Sync
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    
    // 2. Theme Enforcement
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <Router>
      <div className={`app-container ${theme}`}>
        <button onClick={toggleTheme}>Toggle Theme</button>
        <Routes>
          {/* Public Route */}
          <Route path="/" element={!user ? <LoginRegister onLogin={setUser} /> : <Navigate to="/dashboard" />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={user ? <Dashboard user={user} onLogout={() => setUser(null)} /> : <Navigate to="/" />} />
          <Route path="/admin" element={user?.username === 'admin_00' ? <AdminPanel user={user} /> : <Navigate to="/dashboard" />} />
        </Routes>
      </div>
    </Router>
  );
}
