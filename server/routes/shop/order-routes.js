const express = require('express');
const {
  createOrder,
  getAllOrdersByUser,
  getOrderDetails,
  handleNotification,
  regenerateSnapToken,
} = require('../../controllers/shop/order-controller');

const router = express.Router();

router.post('/create', createOrder);
router.post('/notification', handleNotification);
router.get('/list/:userId', getAllOrdersByUser);
router.get('/details/:id', getOrderDetails);
router.post('/:orderId/regenerate-token', regenerateSnapToken);

module.exports = router;
