const supabase = require('../../config/supabase');

class AnalyticsRepository {
  async getProductCount() {
    const { count, error } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null);
    
    if (error) throw error;
    return count || 0;
  }

  async getCustomerCount() {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'user');
    
    if (error) throw error;
    return count || 0;
  }

  async getOrderStats() {
    // Aligned with snake_case: total_amount, order_status, payment_status, created_at
    const { data, error } = await supabase
      .from('orders')
      .select('total_amount, order_status, payment_status, created_at');

    if (error) throw error;
    return data || [];
  }

  async getRecentProducts(limit = 5) {
    const { data, error } = await supabase
      .from('products')
      .select('id, title, product_images(image_url), created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }
}

module.exports = new AnalyticsRepository();
