const express = require('express');
const cartController = require('./cart.controller');
const validate = require('../../middleware/validate.middleware');
const { addToCartSchema, updateCartQtySchema, mergeCartSchema } = require('./cart.schema');
const router = express.Router();

router.get('/:id', cartController.getCart);
router.post('/add', validate(addToCartSchema), cartController.addToCart);
router.put('/update-quantity', validate(updateCartQtySchema), cartController.updateQuantity);
router.delete('/:id/:productId/:variantName', cartController.removeItem);
router.post('/merge', validate(mergeCartSchema), cartController.mergeCart);

module.exports = router;
