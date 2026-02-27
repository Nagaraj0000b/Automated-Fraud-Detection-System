const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Sign up route
router.post('/signup', authController.signup);

// Sign in route
router.post('/signin', authController.signin);

// Get current user (protected route)
router.get('/me', verifyToken, authController.getMe);

const isGoogleConfigured = process.env.GOOGLE_CLIENT_ID
  && process.env.GOOGLE_CLIENT_ID !== 'your-google-client-id-here';
const isGitHubConfigured = process.env.GITHUB_CLIENT_ID
  && process.env.GITHUB_CLIENT_ID !== 'your-github-client-id-here';

// Google OAuth routes
router.get('/google', (req, res, next) => {
  if (!isGoogleConfigured) {
    return res.status(503).json({
      success: false,
      message: 'Google OAuth is not configured on this server.'
    });
  }
  return passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  if (!isGoogleConfigured) {
    return res.status(503).json({
      success: false,
      message: 'Google OAuth is not configured on this server.'
    });
  }
  return passport.authenticate('google', { session: false, failureRedirect: '/oauth-failed' })
    (req, res, next);
}, authController.oauthSuccess);

// GitHub OAuth routes
router.get('/github', (req, res, next) => {
  if (!isGitHubConfigured) {
    return res.status(503).json({
      success: false,
      message: 'GitHub OAuth is not configured on this server.'
    });
  }
  return passport.authenticate('github', { scope: ['user:email'] })(req, res, next);
});

router.get('/github/callback', (req, res, next) => {
  if (!isGitHubConfigured) {
    return res.status(503).json({
      success: false,
      message: 'GitHub OAuth is not configured on this server.'
    });
  }
  return passport.authenticate('github', { session: false, failureRedirect: '/oauth-failed' })
    (req, res, next);
}, authController.oauthSuccess);

module.exports = router;
