const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// POST /api/auth/register
// Public route - create new user account
router.post('/register', authController.register);

// POST /api/auth/login
// Public route - login with email and password
router.post('/login', authController.login);

// POST /api/auth/logout
// Protected route - invalidate token
router.post('/logout', authenticate, authController.logout);

// POST /api/auth/forgot-password
// Public route - send password reset email
router.post('/forgot-password', authController.forgotPassword);

// POST /api/auth/reset-password
// Public route - reset password with token
router.post('/reset-password', authController.resetPassword);

// GET /api/auth/me
// Protected route - get current user profile
router.get('/me', authenticate, authController.getMe);

// PUT /api/auth/change-password
// Protected route - change password
router.put('/change-password', authenticate, authController.changePassword);

module.exports = router;
