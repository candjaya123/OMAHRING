const express = require("express");

const {
  addToCart,
  fetchCartItems,
  deleteCartItem,
  updateCartItemQty,
} = require("../../controllers/shop/cart-controller");

const router = express.Router();

router.post("/add", addToCart);
router.get("/get/:id", fetchCartItems); // Ubah ke /get/:id untuk konsistensi (bisa userId atau sessionId)
router.put("/update-cart", updateCartItemQty);
router.delete("/:userId/:productId/:variantName", deleteCartItem); // Tambah :variantName

module.exports = router;