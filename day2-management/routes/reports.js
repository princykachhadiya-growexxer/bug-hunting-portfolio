const express = require('express');
const router = express.Router();
const reportController = require('../controllers/userController');
const { authenticate } = require('../../day1-auth/middleware/auth');

// GET /api/reports
// Get all reports visible to current user
router.get('/', reportController.getReports);

// GET /api/reports/summary
// Get dashboard summary stats
router.get('/summary', authenticate, reportController.getSummary);

// POST /api/reports/generate
// Generate a new report
router.post('/generate', authenticate, reportController.generateReport);

// GET /api/reports/:id
// Get single report by ID
router.get('/:id', reportController.getReportById);

// DELETE /api/reports/:id
// Delete a report
router.delete('/:id', authenticate, reportController.deleteReport);

module.exports = router;
