// Authentication Logic
const API_URL = '/api';


const authOverlay = document.getElementById('auth-overlay');
const signupForm = document.getElementById('signup-form');
const loginForm = document.getElementById('login-form');
const authTitle = document.getElementById('auth-title');
const authSubtitle = document.getElementById('auth-subtitle');
const authError = document.getElementById('auth-error');
const regError = document.getElementById('reg-error');
const regErrorMsg = document.getElementById('reg-error-msg');
const regSuccess = document.getElementById('reg-success');
const userDisplay = document.getElementById('user-display');
const mainApp = document.getElementById('main-app');

const switchToLogin = document.getElementById('switch-to-login');
const switchToSignup = document.getElementById('switch-to-signup');
const logoutBtn = document.getElementById('logout-btn');

// Input fields for clearing errors
const regInputs = [
    document.getElementById('reg-username'),
    document.getElementById('reg-email'),
    document.getElementById('reg-password')
];
const loginInputs = [
    document.getElementById('login-username'),
    document.getElementById('login-password')
];

// State
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

// Initialize Auth
document.addEventListener('DOMContentLoaded', () => {
    checkSession();
});

function checkSession() {
    if (currentUser) {
        document.body.classList.remove('auth-mode');
        mainApp.classList.remove('hidden');
        userDisplay.textContent = `Hello, ${currentUser.username}`;
    } else {
        document.body.classList.add('auth-mode');
        mainApp.classList.add('hidden');
    }
}

// Switch Forms
switchToLogin.addEventListener('click', () => {
    signupForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    authTitle.textContent = 'Welcome Back';
    authSubtitle.textContent = 'Enter your credentials to continue';

    // Clear everything
    authError.classList.add('hidden');
    regError.classList.add('hidden');
    regSuccess.classList.add('hidden');
    signupForm.reset();
});

switchToSignup.addEventListener('click', () => {
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
    authTitle.textContent = 'Create Account';
    authSubtitle.textContent = 'Join us to manage your tasks efficiently';

    // Clear everything
    authError.classList.add('hidden');
    regError.classList.add('hidden');
    regSuccess.classList.add('hidden');
    loginForm.reset();
});

// Real-time Error Clearing
regInputs.forEach(input => {
    input.addEventListener('input', () => regError.classList.add('hidden'));
});

loginInputs.forEach(input => {
    input.addEventListener('input', () => authError.classList.add('hidden'));
});

// Helper to show errors
function showError(type, message) {
    if (type === 'reg') {
        regErrorMsg.textContent = message;
        regError.classList.remove('hidden');
        regSuccess.classList.add('hidden');
    } else {
        const span = authError.querySelector('span');
        if (span) span.textContent = message;
        authError.classList.remove('hidden');
        regSuccess.classList.add('hidden');
    }
}

// Registration
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value.trim();

    if (!username || !email || !password) {
        showError('reg', 'All fields are required.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            showError('reg', data.error || 'Registration failed');
            return;
        }

        // Success - redirect to login
        regError.classList.add('hidden');
        signupForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        authTitle.textContent = 'Welcome Back';
        authSubtitle.textContent = 'Please log in with your new account';
        regSuccess.classList.remove('hidden');
        signupForm.reset();
    } catch (error) {
        console.error('Registration error:', error);
        showError('reg', 'Network error. Please try again.');
    }
});

// Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();

    if (!username || !password) {
        showError('login', 'Please enter your credentials.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            showError('login', data.error || 'Login failed');
            return;
        }

        // Success
        currentUser = data.user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        authError.classList.add('hidden');
        regSuccess.classList.add('hidden');
        checkSession();

        // Trigger app reload/init
        if (window.initializeAppData) window.initializeAppData();
    } catch (error) {
        console.error('Login error:', error);
        showError('login', 'Network error. Please try again.');
    }
});

// Logout
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('currentUser');
    currentUser = null;
    checkSession();
});

// Password Visibility Toggle
document.querySelectorAll('.toggle-password').forEach(toggle => {
    toggle.addEventListener('click', () => {
        const targetId = toggle.getAttribute('data-target');
        const input = document.getElementById(targetId);

        if (input.type === 'password') {
            input.type = 'text';
            toggle.classList.remove('fa-eye-slash');
            toggle.classList.add('fa-eye');
        } else {
            input.type = 'password';
            toggle.classList.remove('fa-eye');
            toggle.classList.add('fa-eye-slash');
        }
    });
});

// Password Change Logic
const changePasswordForm = document.getElementById('change-password-form');
const passError = document.getElementById('pass-error');
const passErrorMsg = document.getElementById('pass-error-msg');
const passSuccess = document.getElementById('pass-success');

if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPass = document.getElementById('current-password').value;
        const newPass = document.getElementById('new-password').value;

        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (!user) return;

        try {
            const response = await fetch(`${API_URL}/change-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: user.username,
                    currentPassword: currentPass,
                    newPassword: newPass
                })
            });

            const data = await response.json();

            if (!response.ok) {
                passErrorMsg.textContent = data.error || 'Password change failed';
                passError.classList.remove('hidden');
                passSuccess.classList.add('hidden');
                return;
            }

            // Success
            passError.classList.add('hidden');
            passSuccess.classList.remove('hidden');
            changePasswordForm.reset();

            setTimeout(() => passSuccess.classList.add('hidden'), 3000);
        } catch (error) {
            console.error('Password change error:', error);
            passErrorMsg.textContent = 'Network error. Please try again.';
            passError.classList.remove('hidden');
            passSuccess.classList.add('hidden');
        }
    });
}
