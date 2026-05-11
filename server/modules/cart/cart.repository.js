const supabase = require('../../config/supabase');

/**
 * Cart Repository
 * Standardized database operations for carts and cart_items.
 */
class CartRepository {
  async findByUserId(userId) {
    const { data, error } = await supabase
      .from('carts')
      .select('*, cart_items(*, products(*, product_variants(*)))')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async findBySessionId(sessionId) {
    const { data, error } = await supabase
      .from('carts')
      .select('*, cart_items(*, products(*, product_variants(*)))')
      .eq('session_id', sessionId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async createCart(cartData) {
    const { data, error } = await supabase
      .from('carts')
      .insert({
        user_id: cartData.userId || null,
        session_id: cartData.sessionId || null,
        cart_total: 0
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async findItem(cartId, variantId) {
    const { data, error } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cartId)
      .eq('variant_id', variantId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async addItem(itemData) {
    const { data, error } = await supabase
      .from('cart_items')
      .insert({
        cart_id: itemData.cartId,
        product_id: itemData.productId,
        variant_id: itemData.variantId,
        quantity: itemData.quantity,
        unit_price: itemData.unitPrice
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateItemQuantity(itemId, quantity) {
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async removeItem(cartId, variantId) {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cartId)
      .eq('variant_id', variantId);

    if (error) throw error;
    return true;
  }

  async deleteCart(cartId) {
    const { error } = await supabase
      .from('carts')
      .update({ deleted_at: new Date() })
      .eq('id', cartId);

    if (error) throw error;
    return true;
  }

  async updateCartTotal(cartId, total) {
    const { data, error } = await supabase
      .from('carts')
      .update({ cart_total: total })
      .eq('id', cartId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async transferCart(guestCartId, userId) {
    const { data, error } = await supabase
      .from('carts')
      .update({ user_id: userId, session_id: null })
      .eq('id', guestCartId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

module.exports = new CartRepository();
