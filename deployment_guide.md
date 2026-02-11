# Live Hosting Guide (Render)

Follow these steps to host your To-Do List Management System on the internet for free.

## 1. Prepare your Database
Since your app now uses **PostgreSQL**, hosting on Render is even easier:
- Go to your Render Dashboard.
- Click **New +** > **PostgreSQL**.
- Give it a name (e.g., `todo-db`) and click **Create Database**.
- Wait for it to become "Available".
- Copy the **Internal Database URL** (for Render services) or **External Database URL** (for local testing).

## 2. Prepare your Code
- Ensure your code is in a **GitHub Repository**.
- Push your latest changes (including the new `pg` configuration).

## 3. Deploy on Render
- Click **New +** > **Web Service**.
- Connect your GitHub repository.
- **Environment Settings**:
  - **Runtime**: `Node`
  - **Build Command**: `npm install`
  - **Start Command**: `node server.js`
- **Environment Variables**:
  Add the following:
  - `DATABASE_URL`: Paste your **Internal Database URL** from Step 1.
  - `NODE_ENV`: `production` (This enables secure SSL connections).

## 4. Final Updates
- Once deployed, Render will give you a URL like `https://todo-app.onrender.com`.
- Open that URL and your app is live!

---
> [!TIP]
> **Admin Password**: Since we added Bcrypt security, your old plain-text passwords in the local database won't work on the live site. You should register a new user on the live site to test.
