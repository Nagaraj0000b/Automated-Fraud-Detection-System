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
const userRoutes = require('./routes/user.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const alertRoutes = require('./routes/alert.routes');
const transactionRoutes = require('./routes/transaction.routes');
const accountRoutes = require('./routes/account.routes');
const auditRoutes = require('./routes/audit.routes');
const settingRoutes = require('./routes/setting.routes');
const riskRuleRoutes = require('./routes/riskRule.routes');
const notificationRoutes = require('./routes/notification.routes');
const modelRoutes = require('./routes/model.routes');
const dataAdminRoutes = require('./routes/dataAdmin.routes');
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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/rules', riskRuleRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/data-admin', dataAdminRoutes);

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

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Sign-in endpoint: POST http://localhost:${PORT}/api/auth/signin`);
    console.log(`Sign-up endpoint: POST http://localhost:${PORT}/api/auth/signup`);

    const googleConfigured = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'your-google-client-id-here';
    const githubConfigured = process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_ID !== 'your-github-client-id-here';

    console.log(`Google OAuth: ${googleConfigured ? 'Configured' : 'Not configured'}`);
    console.log(`GitHub OAuth: ${githubConfigured ? 'Configured' : 'Not configured'}`);
  });
};

startServer().catch((error) => {
  console.error('Server startup failed:', error.message);
  process.exit(1);
});
