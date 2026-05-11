const express = require('express');
const birdsController = require('./birds.controller');
const validate = require('../../middleware/validate.middleware');
const { registerBirdSchema } = require('./birds.schema');
const { authenticate, authorizeRoles } = require('../../middleware/auth.middleware');

const router = express.Router();

// Public routes (for QR code scanning)
router.get('/:id', birdsController.getBirdDetails);

// Member-only routes
router.post('/register', authenticate, authorizeRoles('member', 'admin', 'manager'), validate(registerBirdSchema), birdsController.registerBird);
router.get('/my-birds/:memberId', authenticate, birdsController.getMemberBirds);
router.delete('/:id', authenticate, birdsController.deleteBird);

module.exports = router;
