const express = require('express');
const promosController = require('./promos.controller');
const validate = require('../../middleware/validate.middleware');
const { promoSchema } = require('./promos.schema');
const { authenticate, authorizeRoles } = require('../../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.post('/validate', promosController.validatePromo);

// Admin-only routes
router.get('/all', authenticate, authorizeRoles('admin', 'manager'), promosController.getAllPromos);
router.post('/add', authenticate, authorizeRoles('admin', 'manager'), validate(promoSchema), promosController.addPromo);
router.put('/update/:id', authenticate, authorizeRoles('admin', 'manager'), validate(promoSchema.partial()), promosController.updatePromo);
router.delete('/delete/:id', authenticate, authorizeRoles('admin', 'manager'), promosController.deletePromo);

module.exports = router;
