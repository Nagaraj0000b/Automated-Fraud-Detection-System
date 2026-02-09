const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('./models/User');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fraud-detection-auth';
const CALLBACK_URL = process.env.CALLBACK_URL || 'http://localhost:5000';

// Middleware
app.use(cors({
  origin: true,
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
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

// Passport serialization
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'your-google-client-id-here') {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${CALLBACK_URL}/api/auth/google/callback`
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists
      let user = await User.findOne({ email: profile.emails[0].value });
      
      if (!user) {
        // Create new user
        user = new User({
          email: profile.emails[0].value,
          name: profile.displayName,
          password: await bcrypt.hash(Math.random().toString(36), 10), // Random password
          role: 'user'
        });
        await user.save();
      }
      
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
}

// GitHub OAuth Strategy
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_ID !== 'your-github-client-id-here') {
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: `${CALLBACK_URL}/api/auth/github/callback`
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value : `${profile.username}@github.com`;
      
      // Check if user exists
      let user = await User.findOne({ email: email });
      
      if (!user) {
        // Create new user
        user = new User({
          email: email,
          name: profile.displayName || profile.username,
          password: await bcrypt.hash(Math.random().toString(36), 10), // Random password
          role: 'user'
        });
        await user.save();
      }
      
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
}

// Helper function to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Sign-up endpoint
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Password strength validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name,
      role: 'user'
    });

    await newUser.save();

    // Generate JWT token
    const token = generateToken(newUser);

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token: token,
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Sign-up error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Sign-in endpoint
app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Find user by email in MongoDB
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const tokenExpiration = rememberMe ? '7d' : '24h';
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: tokenExpiration }
    );

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Sign in successful',
      token: token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Sign-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Google OAuth routes
app.get('/api/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/api/auth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/oauth-failed' }),
  (req, res) => {
    const token = generateToken(req.user);
    // Redirect to success page with token
    res.redirect(`/oauth-success?token=${token}`);
  }
);

// GitHub OAuth routes
app.get('/api/auth/github',
  passport.authenticate('github', { scope: ['user:email'] })
);

app.get('/api/auth/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: '/oauth-failed' }),
  (req, res) => {
    const token = generateToken(req.user);
    // Redirect to success page with token
    res.redirect(`/oauth-success?token=${token}`);
  }
);

// Serve static files from parent directory
app.use(express.static(require('path').join(__dirname, '..')));

// OAuth success page route
app.get('/oauth-success', (req, res) => {
  res.sendFile(require('path').join(__dirname, '..', 'oauth-success.html'));
});

// OAuth failed page route
app.get('/oauth-failed', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Authentication Failed</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-zinc-900">
      <div class="text-center p-8 backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 max-w-md">
        <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500 to-rose-600 rounded-full mb-6">
          <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-white mb-4">Authentication Failed</h1>
        <p class="text-white/70 mb-6">Unable to complete sign-in. Please try again.</p>
        <a href="/index.html" class="inline-block px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300">
          Back to Sign In
        </a>
      </div>
    </body>
    </html>
  `);
});

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

// Protected route example - verify token middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    req.user = decoded;
    next();
  });
};

// Example protected endpoint
app.get('/api/auth/me', verifyToken, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔐 Sign-in endpoint: POST http://localhost:${PORT}/api/auth/signin`);
  console.log(`📝 Sign-up endpoint: POST http://localhost:${PORT}/api/auth/signup`);
  console.log(`🗄️  Database: ${MONGODB_URI.includes('mongodb+srv') ? 'MongoDB Atlas' : 'Local MongoDB'}`);
  
  const googleConfigured = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'your-google-client-id-here';
  const githubConfigured = process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_ID !== 'your-github-client-id-here';
  
  console.log(`🔑 Google OAuth: ${googleConfigured ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`🔑 GitHub OAuth: ${githubConfigured ? '✅ Configured' : '❌ Not configured'}`);
});
