const express = require('express');
const ordersController = require('./orders.controller');
const validate = require('../../middleware/validate.middleware');
const { createOrderSchema } = require('./orders.schema');
const { authenticate, authorizeRoles } = require('../../middleware/auth.middleware');

const router = express.Router();

// Webhook (No auth, validated by signature in service)
router.post('/webhook', ordersController.handleWebhook);

// User routes
router.post('/create', authenticate, validate(createOrderSchema), ordersController.createOrder);
router.get('/user/:userId', authenticate, ordersController.getUserOrders);
router.get('/:id', authenticate, ordersController.getOrderDetails);
router.post('/:id/regenerate-token', authenticate, ordersController.regenerateSnapToken);

// Admin routes
router.get('/admin/all', authenticate, authorizeRoles('admin', 'manager'), ordersController.getAllOrders);
router.put('/admin/update/:id', authenticate, authorizeRoles('admin', 'manager'), ordersController.updateOrderStatus);
router.get('/admin/stats', authenticate, authorizeRoles('admin', 'manager'), ordersController.getOrderStats);

module.exports = router;
