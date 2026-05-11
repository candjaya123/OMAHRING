const supabase = require('../../config/supabase');

class OrdersRepository {
  async findById(id) {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async findByUserId(userId) {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async findPendingByCartId(cartId) {
    const { data, error } = await supabase
      .from('orders')
      .select('id')
      .eq('cart_id', cartId)
      .in('payment_status', ['unpaid', 'pending'])
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async create(orderData) {
    const { data, error } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async addItems(orderId, items) {
    const { data, error } = await supabase
      .from('order_items')
      .insert(items.map(it => ({ ...it, order_id: orderId })))
      .select();

    if (error) throw error;
    return data;
  }

  async update(id, updateData) {
    const { data, error } = await supabase
      .from('orders')
      .update({ ...updateData, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async findAll(filters = {}) {
    let query = supabase
      .from('orders')
      .select('*, users!orders_user_id_fkey(user_name)')
      .is('deleted_at', null);

    if (filters.status) query = query.eq('order_status', filters.status);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getStats() {
    const { data, error } = await supabase
      .from('orders')
      .select('order_status, total_amount, payment_status');

    if (error) throw error;
    return data;
  }
}

module.exports = new OrdersRepository();
