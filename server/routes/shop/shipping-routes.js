const express = require('express');
const { getCouriers, getCost, createShippingOrder } = require('../../controllers/shop/shipping-controller');

const router = express.Router();

router.get('/couriers', getCouriers);
router.post('/cost', getCost);
router.post('/create-order', createShippingOrder);

module.exports = router;
