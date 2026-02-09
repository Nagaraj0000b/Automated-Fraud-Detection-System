# OAuth Setup Guide

Complete guide to setting up Google and GitHub OAuth authentication.

## 🔐 Overview

OAuth allows users to sign in using their Google or GitHub accounts without creating new passwords. This guide walks you through getting the necessary credentials.

## 🟢 Google OAuth Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"New Project"**
3. Enter project name: `Fraud Detection Auth`
4. Click **"Create"**

### Step 2: Enable Google+ API

1. In your project, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"**
3. Click on it and click **"Enable"**

### Step 3: Create OAuth Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. If prompted, configure the OAuth consent screen:
   - User Type: **External**
   - App name: `Fraud Detection System`
   - User support email: Your email
   - Developer contact: Your email
   - Click **"Save and Continue"** through the remaining steps
4. Return to **"Credentials"** and click **"Create Credentials"** → **"OAuth client ID"**
5. Application type: **Web application**
6. Name: `Fraud Detection Web Client`
7. **Authorized redirect URIs**:
   - Add: `http://localhost:5000/api/auth/google/callback`
   - (For production, add your production URL)
8. Click **"Create"**
9. **Copy your Client ID and Client Secret** ✅

### Step 4: Update .env File

```env
GOOGLE_CLIENT_ID=your-actual-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-actual-client-secret-here
```

---

## 🐙 GitHub OAuth Setup

### Step 1: Create a GitHub OAuth App

1. Go to [GitHub Settings](https://github.com/settings/profile)
2. Click **"Developer settings"** (bottom of left sidebar)
3. Click **"OAuth Apps"**
4. Click **"New OAuth App"**

### Step 2: Configure the OAuth App

1. **Application name**: `Fraud Detection System`
2. **Homepage URL**: `http://localhost:5000`
3. **Application description** (optional): `Authentication for fraud detection platform`
4. **Authorization callback URL**: `http://localhost:5000/api/auth/github/callback`
5. Click **"Register application"**

### Step 3: Get Credentials

1. After creating, you'll see your **Client ID** - Copy it ✅
2. Click **"Generate a new client secret"**
3. **Copy the client secret immediately** (you won't be able to see it again) ✅

### Step 4: Update .env File

```env
GITHUB_CLIENT_ID=your-github-client-id-here
GITHUB_CLIENT_SECRET=your-github-client-secret-here
```

---

## 📝 Complete .env Example

After setting up both OAuth providers, your `.env` should look like this:

```env
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fraud-detection-auth
SESSION_SECRET=your-session-secret-key-change-in-production
GOOGLE_CLIENT_ID=123456789.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456
GITHUB_CLIENT_ID=Iv1.abc123def456
GITHUB_CLIENT_SECRET=abc123def456ghi789jkl012
CALLBACK_URL=http://localhost:5000
```

---

## 🧪 Testing OAuth

### Test Google Sign-In

1. Make sure backend is running: `npm start`
2. Open `index.html` or `signup.html` in browser
3. Click **"Google"** button
4. You'll be redirected to Google
5. Sign in with your Google account
6. Grant permissions
7. You'll be redirected back
8. Check console for JWT token ✅

### Test GitHub Sign-In

1. Make sure backend is running: `npm start`
2. Open `index.html` or `signup.html` in browser
3. Click **"GitHub"** button
4. You'll be redirected to GitHub
5. Click **"Authorize application"**
6. You'll be redirected back
7. Check console for JWT token ✅

---

## 🔧 Troubleshooting

### "redirect_uri_mismatch" Error

**Problem**: The callback URL doesn't match

**Solution**:

- Double-check callback URLs in Google/GitHub settings
- Make sure they match EXACTLY:
  - Google: `http://localhost:5000/api/auth/google/callback`
  - GitHub: `http://localhost:5000/api/auth/github/callback`
- No trailing slashes!
- Use `http://` for local development

### "Invalid client" Error

**Problem**: Client ID or Secret is wrong

**Solution**:

- Verify you copied the correct credentials
- Check for extra spaces in `.env` file
- Make sure `.env` file is in the `backend/` directory
- Restart the server after updating `.env`

### OAuth Works But No Token

**Problem**: Successful OAuth but no token in frontend

**Solution**:

- Check backend console for errors
- Verify MongoDB is connected
- Check that user was created in database:
  ```bash
  # In MongoDB Shell or Compass
  db.users.find({ email: "your-oauth-email@gmail.com" })
  ```

### "Cannot read property 'email' of undefined"

**Problem**: Google/GitHub didn't return email

**Solution**:

- For Google: Make sure you requested `email` scope
- For GitHub: User might have private email
  - The backend creates a fallback email: `username@github.com`

---

## 🚀 Production Deployment

Before deploying to production:

### Update Redirect URLs

1. **Google Cloud Console**:
   - Add production URL: `https://yourdomain.com/api/auth/google/callback`
2. **GitHub OAuth App**:
   - Update callback: `https://yourdomain.com/api/auth/github/callback`

### Update .env for Production

```env
CALLBACK_URL=https://yourdomain.com
NODE_ENV=production
```

### Important Security Notes

- ✅ Never commit `.env` file to git
- ✅ Use different OAuth apps for dev/production
- ✅ Enable only necessary scopes
- ✅ Use HTTPS in production (required by OAuth providers)
- ✅ Regularly rotate client secrets

---

## 📊 OAuth Flow Diagram

```
User clicks "Sign in with Google/GitHub"
           ↓
Frontend redirects to backend: /api/auth/google or /api/auth/github
           ↓
Backend redirects to OAuth provider (Google/GitHub)
           ↓
User signs in and authorizes
           ↓
Provider redirects back to: /api/auth/google/callback
           ↓
Backend receives user info
           ↓
Backend checks if user exists in MongoDB
           ↓
If new: Create user | If existing: Use existing
           ↓
Generate JWT token
           ↓
Redirect to frontend with token
           ↓
Frontend stores token in localStorage
           ↓
User is signed in! ✅
```

---

## 🎯 Quick Test Commands

### Check if OAuth is configured

```bash
curl http://localhost:5000/api/health
```

Response should show:

```json
{
  "oauth": {
    "google": "configured",
    "github": "configured"
  }
}
```

### Test OAuth redirect (should redirect you to Google/GitHub)

```bash
# Open in browser:
http://localhost:5000/api/auth/google
http://localhost:5000/api/auth/github
```

---

## 💡 Tips

- **Start with one provider** - Get Google working first, then add GitHub
- **Use real accounts** - Test with actual Google/GitHub accounts
- **Check email permissions** - Some users have private emails on GitHub
- **Monitor backend logs** - They show OAuth flow progress
- **Test in incognito** - Easier to test with different accounts

---

## 📚 Additional Resources

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Passport.js Documentation](http://www.passportjs.org/)

---

**Need help?** Check the backend console logs for detailed error messages!
