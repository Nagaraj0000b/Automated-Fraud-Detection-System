const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables before other imports use process.env
dotenv.config();

const session = require('express-session');
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const passport = require('./config/passport');
const authRoutes = require('./routes/auth.routes');
const authController = require('./controllers/auth.controller');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-session-secret',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);

// OAuth failure route
app.get('/oauth-failed', authController.oauthFailure);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const googleConfigured = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'your-google-client-id-here';
  const githubConfigured = process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_ID !== 'your-github-client-id-here';
  
  res.status(200).json({
    status: 'healthy',
    database: dbStatus,
    oauth: {
      google: googleConfigured ? 'configured' : 'not configured',
      github: githubConfigured ? 'configured' : 'not configured'
    },
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔐 Sign-in endpoint: POST http://localhost:${PORT}/api/auth/signin`);
  console.log(`📝 Sign-up endpoint: POST http://localhost:${PORT}/api/auth/signup`);
  
  const googleConfigured = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'your-google-client-id-here';
  const githubConfigured = process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_ID !== 'your-github-client-id-here';
  
  console.log(`🔑 Google OAuth: ${googleConfigured ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`🔑 GitHub OAuth: ${githubConfigured ? '✅ Configured' : '❌ Not configured'}`);
});
