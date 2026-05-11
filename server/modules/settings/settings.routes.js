const express = require('express');
const settingsController = require('./settings.controller');
const validate = require('../../middleware/validate.middleware');
const { settingsSchema } = require('./settings.schema');
const { authenticate, authorizeRoles } = require('../../middleware/auth.middleware');

const router = express.Router();

// Public route to get store name/logo/fees
router.get('/', settingsController.getSettings);

// Admin/Manager only route to update settings
router.put('/', authenticate, authorizeRoles('manager'), validate(settingsSchema), settingsController.updateSettings);

module.exports = router;
