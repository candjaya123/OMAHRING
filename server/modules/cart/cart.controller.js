const cartService = require('./cart.service');
const { addToCartSchema, updateCartQtySchema, mergeCartSchema } = require('./cart.schema');

/**
 * Cart Controller
 * Handles HTTP logic for shopping cart management.
 */
class CartController {
  async getCart(req, res, next) {
    try {
      const { id } = req.params;
      const isUserId = req.query.type === 'user' || (id.length > 20); // Simplified check, better to be explicit

      const cart = await cartService.getCart(id, isUserId);
      
      res.status(200).json({
        success: true,
        data: cart
      });
    } catch (error) {
      next(error);
    }
  }

  async addToCart(req, res, next) {
    try {
      const cart = await cartService.addToCart(req.body);
      
      res.status(200).json({
        success: true,
        message: 'Item added to cart successfully',
        data: cart
      });
    } catch (error) {
      next(error);
    }
  }

  async updateQuantity(req, res, next) {
    try {
      const cart = await cartService.updateQuantity(req.body);
      
      res.status(200).json({
        success: true,
        message: 'Cart updated successfully',
        data: cart
      });
    } catch (error) {
      next(error);
    }
  }

  async removeItem(req, res, next) {
    try {
      const { id, productId, variantName } = req.params;
      const isUserId = req.query.type === 'user';

      const cart = await cartService.removeItem(id, isUserId, productId, variantName);
      
      res.status(200).json({
        success: true,
        message: 'Item removed from cart',
        data: cart
      });
    } catch (error) {
      next(error);
    }
  }

  async mergeCart(req, res, next) {
    try {
      const cart = await cartService.mergeCart(req.body.userId, req.body.sessionId, req.body.action);
      
      res.status(200).json({
        success: true,
        message: 'Carts merged successfully',
        data: cart
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CartController();
