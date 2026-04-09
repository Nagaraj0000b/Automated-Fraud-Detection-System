const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const CALLBACK_URL = process.env.CALLBACK_URL || 'http://localhost:5000';

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

module.exports = passport;
