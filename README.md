# Fullstack To-Do List Management System (MERN Stack)

A modern, full-stack Task Management application built with a Node.js/Express backend, MongoDB database, and a React (Vite) frontend.

## 🚀 Features
- **Authentication:** Secure Admin and User Registration & Login securely hashed with bcrypt.
- **Task Management:** Create, Read, Update, and Delete dynamically styled To-Do items with priority badges and due dates.
- **Admin Dashboard:** Specific `admin_00` dashboard insights to manage system users and wipe database states.
- **Theme:** Dynamic Light and Dark modes securely synchronized with localStorage.
- **Database:** Fully integrated with MongoDB using Mongoose Object Data Modeling.

---

## 💻 Prerequisites
Before you start, make sure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v16.x or newer)
- [MongoDB Community Server](https://www.mongodb.com/try/download/community) (Make sure MongoDB is installed as a background Windows Service to run persistently)
- [MongoDB Compass](https://www.mongodb.com/products/compass) (Optional, for visualizing data)

---

## 🛠️ Installation & Setup

### 1. Clone the repository
\`\`\`bash
git clone https://github.com/Ayushmhz/To-do-list1.git
cd To-do-list1
\`\`\`

### 2. Configure Environment Variables
In the root directory, create a `.env` file (you can duplicate `.env.example`) and configure your MongoDB connection URL:
\`\`\`env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/todo-list
\`\`\`

### 3. Install Backend Dependencies
\`\`\`bash
# Inside the root folder (To-do-list1)
npm install
\`\`\`

### 4. Install Frontend Dependencies (React)
\`\`\`bash
cd client
npm install
cd ..
\`\`\`

### 5. Initialize the Database and Admin Account
Run the database bootstrapping script to generate your `todo-list` database and insert the Admin user:
\`\`\`bash
node create_admin_hash.js
\`\`\`

---

## 🏃‍♂️ Running the Application

Because this is a dual-environment fullstack application, you need to run both the frontend and backend servers simultaneously.

### Terminal 1: Start the Backend (API Server)
\`\`\`bash
# From the root folder (To-do-list1)
npm run dev
\`\`\`
*The Express server will start on `http://localhost:3000` connected to MongoDB.*

### Terminal 2: Start the Frontend (Vite React Client)
\`\`\`bash
# Open a second terminal window
cd client
npm run dev
\`\`\`
*The React app will launch, generally on `http://localhost:5173`.*

---

## 👨‍💻 Authentication & Default Accounts
Once the app is running, you can log in as the System Administrator:
- **Username:** `admin_00`
- **Password:** `Admin@123`

You can also use the **Register** functionality in the web UI at any point to create new restricted User Accounts. All registered accounts are natively stored in MongoDB's `users` collection.