const express = require('express');
const membersController = require('./members.controller');
const validate = require('../../middleware/validate.middleware');
const { createUserSchema, updateUserRoleSchema } = require('./members.schema');
const { authenticate, authorizeRoles } = require('../../middleware/auth.middleware');

const router = express.Router();

// All member routes require authentication
router.use(authenticate);

// Admin/Manager routes
router.get('/', authorizeRoles('admin', 'manager'), membersController.getAllUsers);
router.post('/', authorizeRoles('admin', 'manager'), validate(createUserSchema), membersController.createUser);
router.put('/:id/role', authorizeRoles('admin', 'manager'), validate(updateUserRoleSchema), membersController.updateUserRole);
router.delete('/:id', authorizeRoles('admin', 'manager'), membersController.deleteUser);

module.exports = router;
