const express = require('express');
const { getCouriers, getCost, createShippingOrder, searchAreas } = require('../../controllers/shop/shipping-controller');

const router = express.Router();

router.get('/couriers', getCouriers);
router.post('/cost', getCost);
router.post('/create-order', createShippingOrder);
router.get('/areas', searchAreas);

module.exports = router;
