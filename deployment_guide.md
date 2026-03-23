# Live Hosting Guide (MongoDB + Node.js)

Since you've migrated your application to a Full-Stack Node.js app with **MongoDB**, the easiest way to host this for free is using **MongoDB Atlas** for the database and **Render** for the server. Your Vanilla CSS/JS frontend is automatically served from the root by your backend!

## Step 1: Host Your Database on MongoDB Atlas
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and sign up for a free account.
2. Create a **New Cluster** (select the FREE Shared tier, usually M0).
3. Once the cluster is created, click **Connect**.
4. Set up your connection security:
   - Create a **Database User** (with a username and password). *Remember this password!*
   - Under **IP Access List**, choose **Allow Access from Anywhere** (or enter `0.0.0.0/0`) so that Render's servers can communicate with it.
5. Click **Connect to your application** (Drivers).
6. **Copy your Connection String**. It will look something like this:
   `mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
   *(Important: Replace `<password>` in the string with the actual password you just created!)*

## Step 2: Push Your Code to GitHub
Ensure all your latest files (`server.js`, `db.js`, `package.json`, `index.html`, etc.) are pushed to a GitHub repository.

## Step 3: Deploy Your App on Render
1. Go to your [Render Dashboard](https://dashboard.render.com/) and create a free account.
2. Click **New +** and select **Web Service**.
3. Connect your GitHub account and select your To-Do list repository.
4. Fill out the **Environment Settings**:
   - **Name**: Give your app a name (e.g., `my-cool-todo-app`).
   - **Environment/Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. **Environment Variables**:
   Scroll down to the "Environment Variables" section and click "Add Environment Variable". Add one important key:
   - **Key**: `MONGODB_URI`
   - **Value**: Paste the Connection String you got from MongoDB Atlas in Step 1.
6. Click **Create Web Service**.

## Step 4: Final Checks
- Render will start executing your Build Command. It might take 2-3 minutes.
- Once deployed, it will say **Live** and give you a URL at the top left of the dashboard (looks like `https://your-app-name.onrender.com`).
- Click that link, and your site is live! Your server will automatically host both your API and your frontend website.

---
> [!TIP]
> **Admin Account**: Since you just created a fresh database on MongoDB Atlas, it has no users or data. You will need to register a new user on your live URL to start testing it. There is no need to migrate your local test users!
