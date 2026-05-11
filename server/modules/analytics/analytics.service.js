const analyticsRepository = require('./analytics.repository');

class AnalyticsService {
  async getDashboardStats() {
    const [productCount, customerCount, orders, recentProducts] = await Promise.all([
      analyticsRepository.getProductCount(),
      analyticsRepository.getCustomerCount(),
      analyticsRepository.getOrderStats(),
      analyticsRepository.getRecentProducts(5)
    ]);

    const totalSales = orders
      .filter(o => o.payment_status === 'paid')
      .reduce((sum, o) => sum + Number(o.total_amount), 0);

    const newOrdersCount = orders
      .filter(o => o.order_status === 'pending')
      .length;

    // Daily Sales Aggregation (Last 30 Days)
    const dailySalesMap = {};
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailySalesMap[dateStr] = 0;
    }

    orders.forEach(order => {
      if (order.payment_status === 'paid' && order.created_at) {
        const dateStr = new Date(order.created_at).toISOString().split('T')[0];
        if (dailySalesMap[dateStr] !== undefined) {
          dailySalesMap[dateStr] += Number(order.total_amount);
        }
      }
    });

    const dailySales = Object.keys(dailySalesMap).map(date => ({
      date: date.split('-').reverse().slice(0, 2).reverse().join('/'),
      fullDate: date,
      total: dailySalesMap[date]
    }));

    return {
      totalProducts: productCount,
      totalCustomers: customerCount,
      totalSales: totalSales,
      newOrders: newOrdersCount,
      dailySales: dailySales,
      recentProducts: recentProducts
    };
  }
}

module.exports = new AnalyticsService();
