const express = require('express');
const authController = require('./auth.controller');
const { registerSchema, loginSchema, upgradeSchema } = require('./auth.schema');
const validate = require('../../middleware/validate.middleware');
const { authenticate } = require('../../middleware/auth.middleware');

const router = express.Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.get('/check-auth', authenticate, authController.checkAuth);
router.get('/check-email/:email', authController.checkEmail);
router.post('/upgrade-to-member', authenticate, validate(upgradeSchema), authController.upgradeToMember);

module.exports = router;
