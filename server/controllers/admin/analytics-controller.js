const supabase = require("../../config/supabase");

const getDashboardStats = async (req, res) => {
  try {
    // 1. Total Products Count
    const { count: productCount, error: productError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (productError) throw productError;

    // 2. Total Customers Count (role = 'user')
    const { count: customerCount, error: customerError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'user');

    if (customerError) throw customerError;

    // 3. Orders Stats
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('totalAmount, orderStatus, paymentStatus, orderDate');

    if (orderError) throw orderError;

    const totalSales = orders
      .filter(o => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + Number(o.totalAmount), 0);

    const newOrdersCount = orders
      .filter(o => o.orderStatus === 'pending')
      .length;

    // Aggregasi Penjualan Harian (30 Hari Terakhir)
    const dailySalesMap = {};
    const now = new Date();
    
    // Inisialisasi 30 hari ke belakang dengan 0
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailySalesMap[dateStr] = 0;
    }

    orders.forEach(order => {
      if (order.paymentStatus === 'paid' && order.orderDate) {
        const dateStr = new Date(order.orderDate).toISOString().split('T')[0];
        if (dailySalesMap[dateStr] !== undefined) {
          dailySalesMap[dateStr] += Number(order.totalAmount);
        }
      }
    });

    const dailySales = Object.keys(dailySalesMap).map(date => ({
      date: date.split('-').reverse().slice(0, 2).reverse().join('/'), // Format DD/MM
      fullDate: date,
      total: dailySalesMap[date]
    }));

    // 4. Recent Products (Last 5)
    const { data: recentProducts, error: recentError } = await supabase
      .from('products')
      .select('id, title, media, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentError) throw recentError;

    res.status(200).json({
      success: true,
      data: {
        totalProducts: productCount || 0,
        totalCustomers: customerCount || 0,
        totalSales: totalSales || 0,
        newOrders: newOrdersCount || 0,
        dailySales: dailySales,
        recentProducts: recentProducts.map(p => ({ ...p, _id: p.id }))
      },
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil statistik dashboard!",
    });
  }
};

module.exports = { getDashboardStats };
