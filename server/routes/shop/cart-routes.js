const express = require('express');

const {
  addToCart,
  fetchCartItems,
  deleteCartItem,
  updateCartItemQty,
  mergeCart,
} = require('../../controllers/shop/cart-controller');

const router = express.Router();

router.post('/add', addToCart);
router.get('/get/:id', fetchCartItems);
router.put('/update-cart', updateCartItemQty);
router.delete('/:id/:productId/:variantName', deleteCartItem);
router.post('/merge-cart', mergeCart);

module.exports = router;
