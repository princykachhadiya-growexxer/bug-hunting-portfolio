const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../../day1-auth/middleware/auth');

// GET /api/users
// Get all users — admin and manager only
router.get('/', authenticate, authorize('admin', 'manager'), userController.getAllUsers);

// GET /api/users/:id
// Get single user by ID
router.get('/:id', authenticate, userController.getUserById);


// POST /api/users
// Create a new user — admin only
router.post('/', authenticate, authorize('admin'), userController.createUser);

// PUT /api/users/:id
// Update user — admin or self
router.put('/:id', authenticate, userController.updateUser);

// DELETE /api/users/:id
// Soft delete user — admin only
router.delete('/:id', authenticate, userController.deleteUser);

// PUT /api/users/:id/role
// Change user role — admin only
router.put('/:id/role', authenticate, authorize('admin'), userController.changeRole);

// GET /api/users/:id/activity
// Get user activity log
router.get('/:id/activity', authenticate, userController.getUserActivity);

module.exports = router;
