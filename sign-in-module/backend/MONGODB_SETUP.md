# MongoDB Setup Guide

## Quick Start Options

### Option 1: Use MongoDB Atlas (Cloud - FREE)

**Easiest option - No installation required!**

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create a free account
3. Create a free cluster (M0)
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Update `.env` file:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fraud-detection-auth
   ```

### Option 2: Install MongoDB Locally (Windows)

1. **Download MongoDB**:
   - Go to https://www.mongodb.com/try/download/community
   - Download MongoDB Community Server for Windows
   - Run the installer (choose "Complete" installation)

2. **Start MongoDB**:

   ```bash
   # MongoDB should start automatically as a service
   # Or manually run:
   "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe"
   ```

3. **Verify it's running**:

   ```bash
   # Open another terminal and run:
   "C:\Program Files\MongoDB\Server\7.0\bin\mongosh.exe"
   ```

4. **Your .env is already configured**:
   ```env
   MONGODB_URI=mongodb://localhost:27017/fraud-detection-auth
   ```

### Option 3: Use Docker (If you have Docker installed)

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## After MongoDB is Running

### 1. Install mongoose (if not already installed)

```bash
cd backend
npm install
```

### 2. Seed the database with demo users

```bash
npm run seed
```

This will create:

- `admin@fraud-detection.com` / `admin123`
- `user@fraud-detection.com` / `password123`

### 3. Start the server

```bash
npm start
```

You should see:

```
✅ Connected to MongoDB
🚀 Server running on http://localhost:5000
```

## Troubleshooting

### Error: "MongooseServerSelectionError"

**Problem**: MongoDB is not running or connection string is wrong

**Solution**:

- Make sure MongoDB is running (check Task Manager for "mongod")
- Or use MongoDB Atlas (cloud option)
- Verify your `.env` MONGODB_URI is correct

### Error: "connect ECONNREFUSED"

**Problem**: MongoDB service not started

**Solution**:

```bash
# Start MongoDB service (Windows)
net start MongoDB
```

## Quick Test

After MongoDB is running and seeded:

1. Open `index.html` in browser
2. Sign in with: `admin@fraud-detection.com` / `admin123`
3. Should work! ✅

## Current Setup

Your `.env` file:

```env
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/fraud-detection-auth
```

## Need Help?

If MongoDB setup is too complex right now, I can create a simpler version that works without a database. Let me know!
