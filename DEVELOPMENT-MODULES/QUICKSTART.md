# Quick Start Guide

This guide will help you get the MERN stack authentication system up and running quickly.

## Prerequisites
- Node.js (v14 or higher)
- MongoDB (running locally or MongoDB Atlas account)
- npm or yarn

## Installation Steps

### Step 1: Install Dependencies

From the root directory (`sign-in-module/`), run:

```bash
npm install
npm run install:all
```

This will install dependencies for both client and server.

### Step 2: Configure Environment Variables

#### Server Configuration

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
```env
PORT=5000
CLIENT_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/fraud-detection-auth
JWT_SECRET=your-super-secret-jwt-key
SESSION_SECRET=your-super-secret-session-key
```

#### Client Configuration

```bash
cd ../client
cp .env.example .env
```

The `client/.env` should contain:
```env
VITE_API_URL=http://localhost:5000/api
```

### Step 3: Start MongoDB

Make sure MongoDB is running:

```bash
# Linux/Mac
sudo systemctl start mongod

# Or if using MongoDB Atlas, ensure your connection string is correct in server/.env
```

### Step 4: Seed Database (Optional)

```bash
cd server
npm run seed
```

This creates demo users:
- Admin: `admin@fraud-detection.com` / `admin123`
- User: `user@fraud-detection.com` / `password123`

### Step 5: Start Development Servers

From the root directory:

```bash
npm run dev
```

This starts both frontend and backend concurrently:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

**Or start them separately:**

Terminal 1 (Backend):
```bash
npm run dev:server
```

Terminal 2 (Frontend):
```bash
npm run dev:client
```

### Step 6: Test the Application

1. Open http://localhost:3000 in your browser
2. You should see the Sign In page
3. Click "Sign up for free" to create an account
4. Or use the demo credentials from step 4

## OAuth Setup (Optional)

### Google OAuth

1. Go to https://console.cloud.google.com/
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add redirect URI: `http://localhost:5000/api/auth/google/callback`
6. Add client ID and secret to `server/.env`:
   ```env
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

### GitHub OAuth

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Set callback URL: `http://localhost:5000/api/auth/github/callback`
4. Add client ID and secret to `server/.env`:
   ```env
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret
   ```

## Troubleshooting

### Port Already in Use

If port 3000 or 5000 is already in use:

1. Change `PORT` in `server/.env`
2. Update `VITE_API_URL` in `client/.env`
3. Update `CLIENT_URL` in `server/.env`

### MongoDB Connection Error

- Check if MongoDB is running: `sudo systemctl status mongod`
- Verify `MONGODB_URI` in `server/.env`
- Check MongoDB logs for errors

### Cannot Connect to Backend

- Ensure backend is running on port 5000
- Check `VITE_API_URL` in `client/.env`
- Check browser console for CORS errors

## Next Steps

- Read the full README.md for complete documentation
- Customize the UI in `client/src/pages/`
- Add more API endpoints in `server/routes/`
- Deploy to production (see README.md)

## Support

For issues, check the main README.md or create an issue in the repository.
