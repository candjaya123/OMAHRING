const express = require('express');
const analyticsController = require('./analytics.controller');
const { authenticate, authorizeRoles } = require('../../middleware/auth.middleware');

const router = express.Router();

// Admin/Manager only route
router.get('/dashboard', authenticate, authorizeRoles('admin', 'manager'), analyticsController.getDashboardStats);

module.exports = router;
