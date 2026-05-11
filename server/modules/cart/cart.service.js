const cartRepository = require('./cart.repository');
const productsRepository = require('../products/products.repository'); // Assuming this exists or will follow similar pattern

class CartService {
  async getCart(identifier, isUserId = true) {
    let cart = isUserId 
      ? await cartRepository.findByUserId(identifier)
      : await cartRepository.findBySessionId(identifier);

    if (!cart) {
      return { items: [], cart_total: 0 };
    }

    return cart;
  }

  async addToCart(data) {
    const { userId, sessionId, productId, quantity, variantName } = data;

    // 1. Get product and check variant/stock
    // Note: Reusing products repo if available, or direct query for now if not fully refactored
    const product = await productsRepository.findById(productId);
    if (!product) throw new Error('Product not found');

    const variant = product.product_variants.find(v => v.name === variantName);
    if (!variant) throw new Error(`Variant ${variantName} not found`);

    if (variant.total_stock < quantity) {
      throw new Error(`Insufficient stock for ${variantName}. Available: ${variant.total_stock}`);
    }

    // 2. Get or create cart
    let cart = userId 
      ? await cartRepository.findByUserId(userId)
      : await cartRepository.findBySessionId(sessionId);

    if (!cart) {
      cart = await cartRepository.createCart({ userId, sessionId });
    }

    // 3. Check if item already in cart
    const existingItem = await cartRepository.findItem(cart.id, variant.id);

    if (existingItem) {
      const newQty = existingItem.quantity + quantity;
      if (variant.total_stock < newQty) {
        throw new Error(`Total quantity would exceed stock. Available: ${variant.total_stock}`);
      }
      await cartRepository.updateItemQuantity(existingItem.id, newQty);
    } else {
      await cartRepository.addItem({
        cartId: cart.id,
        productId,
        variantId: variant.id,
        quantity,
        unitPrice: variant.sale_price > 0 ? variant.sale_price : variant.price
      });
    }

    // 4. Recalculate total
    return await this.refreshCartTotal(cart.id);
  }

  async updateQuantity(data) {
    const { userId, sessionId, productId, variantName, quantity } = data;

    let cart = userId 
      ? await cartRepository.findByUserId(userId)
      : await cartRepository.findBySessionId(sessionId);

    if (!cart) throw new Error('Cart not found');

    const product = await productsRepository.findById(productId);
    const variant = product.product_variants.find(v => v.name === variantName);
    if (!variant) throw new Error('Variant not found');

    if (variant.total_stock < quantity) {
      throw new Error(`Insufficient stock. Available: ${variant.total_stock}`);
    }

    const item = await cartRepository.findItem(cart.id, variant.id);
    if (!item) throw new Error('Item not found in cart');

    await cartRepository.updateItemQuantity(item.id, quantity);
    return await this.refreshCartTotal(cart.id);
  }

  async removeItem(identifier, isUserId, productId, variantName) {
    let cart = isUserId 
      ? await cartRepository.findByUserId(identifier)
      : await cartRepository.findBySessionId(identifier);

    if (!cart) throw new Error('Cart not found');

    // Need variantId to remove
    const product = await productsRepository.findById(productId);
    const variant = product.product_variants.find(v => v.name === variantName);
    if (!variant) throw new Error('Variant not found');

    await cartRepository.removeItem(cart.id, variant.id);
    return await this.refreshCartTotal(cart.id);
  }

  async mergeCart(userId, sessionId, action = 'merge') {
    const guestCart = await cartRepository.findBySessionId(sessionId);
    if (!guestCart) return await this.getCart(userId, true);

    const userCart = await cartRepository.findByUserId(userId);

    if (!userCart) {
      // Just transfer ownership
      await cartRepository.transferCart(guestCart.id, userId);
      return await this.getCart(userId, true);
    }

    if (action === 'replace') {
      // Delete guest cart
      await cartRepository.deleteCart(guestCart.id);
      return userCart;
    }

    // Actual merge logic
    for (const guestItem of (guestCart.cart_items || [])) {
      const existingItem = (userCart.cart_items || []).find(ui => ui.variant_id === guestItem.variant_id);
      
      if (existingItem) {
        // Update qty (could check stock here too)
        await cartRepository.updateItemQuantity(existingItem.id, existingItem.quantity + guestItem.quantity);
      } else {
        // Move item to user cart
        await cartRepository.addItem({
          cartId: userCart.id,
          productId: guestItem.product_id,
          variantId: guestItem.variant_id,
          quantity: guestItem.quantity,
          unitPrice: guestItem.unit_price
        });
      }
    }

    // Cleanup guest cart
    await cartRepository.deleteCart(guestCart.id);
    return await this.refreshCartTotal(userCart.id);
  }

  async refreshCartTotal(cartId) {
    // In a real repo, we might want a more efficient way to calculate total
    const cart = await supabase // Using direct supabase or a special repo method
      .from('carts')
      .select('*, cart_items(*)')
      .eq('id', cartId)
      .single();
    
    const total = (cart.data.cart_items || []).reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
    await cartRepository.updateCartTotal(cartId, total);
    
    // Return full cart object with items
    return await cartRepository.findByUserId(cart.data.user_id) || await cartRepository.findBySessionId(cart.data.session_id);
  }
}

module.exports = new CartService();
