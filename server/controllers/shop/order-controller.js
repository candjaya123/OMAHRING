const snap = require('../../helpers/midtrans');
const Order = require('../../models/Order');
const Cart = require('../../models/Cart');
const Product = require('../../models/Product');
const User = require('../../models/User');
const { v4: uuidv4 } = require('uuid');

const createOrder = async (req, res) => {
  try {
    console.log('CreateOrder Request Body:', JSON.stringify(req.body, null, 2)); // Debug log

    const { userId, cartItems, addressInfo, totalAmount, cartId, customerName, email } = req.body;

    // 1. Validasi input yang lebih spesifik
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID diperlukan.' });
    }
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: 'Cart items tidak valid atau kosong.' });
    }
    if (!addressInfo || !addressInfo.address || !addressInfo.city || !addressInfo.phone) {
      return res.status(400).json({ success: false, message: 'Informasi alamat tidak lengkap.' });
    }
    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Total amount tidak valid.' });
    }
    if (!cartId) {
      return res.status(400).json({ success: false, message: 'Cart ID diperlukan.' });
    }
    if (!customerName || !email) {
      return res
        .status(400)
        .json({ success: false, message: 'Nama customer dan email diperlukan.' });
    }

    // 2. Validasi stok produk dengan error yang lebih spesifik
    for (const item of cartItems) {
      if (!item.productId || !item.variantName || !item.quantity) {
        return res.status(400).json({
          success: false,
          message: 'Data item tidak lengkap (productId, variantName, quantity diperlukan).',
        });
      }

      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Produk dengan ID ${item.productId} tidak ditemukan.`,
        });
      }

      const variant = product.variants.find((v) => v.name === item.variantName);
      if (!variant) {
        return res.status(400).json({
          success: false,
          message: `Varian ${item.variantName} tidak ditemukan untuk produk ${product.title}.`,
        });
      }

      if (variant.totalStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Stok untuk ${product.title} (${item.variantName}) tidak mencukupi. Tersedia: ${variant.totalStock}, diminta: ${item.quantity}.`,
        });
      }
    }

    let finalUserId;
    let user;

    // 3. Logika user handling yang disederhanakan
    try {
      if (userId && !userId.startsWith('guest-')) {
        // Registered user
        user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'User tidak ditemukan.',
          });
        }
        finalUserId = user._id;
      } else {
        // Guest user - cari berdasarkan email atau buat baru
        user = await User.findOne({ email });
        if (!user) {
          user = new User({
            userName: customerName,
            email: email,
            role: 'user',
          });
          await user.save();
        }
        finalUserId = user._id;
      }
    } catch (userError) {
      console.error('User handling error:', userError);
      return res.status(500).json({
        success: false,
        message: 'Gagal memproses data user: ' + userError.message,
      });
    }

    // 4. Buat pesanan baru dengan validasi
    let newOrder;
    try {
      newOrder = new Order({
        userId: finalUserId,
        customerName,
        cartId,
        cartItems: cartItems.map((item) => ({
          productId: item.productId,
          title: item.title,
          image: item.image,
          price: item.price,
          quantity: item.quantity,
          variantName: item.variantName,
        })),
        addressInfo: {
          address: addressInfo.address,
          city: addressInfo.city,
          pincode: addressInfo.pincode || addressInfo.kodePos || '', // Handle both field names
          phone: addressInfo.phone,
          notes: addressInfo.notes || '',
        },
        orderStatus: 'pending',
        paymentMethod: 'midtrans',
        paymentStatus: 'unpaid',
        totalAmount,
        orderDate: new Date(),
      });

      await newOrder.save();
    } catch (orderError) {
      console.error('Order creation error:', orderError);
      return res.status(500).json({
        success: false,
        message: 'Gagal membuat pesanan: ' + orderError.message,
      });
    }

    // 5. Buat transaksi Midtrans dengan error handling
    try {
      const parameter = {
        transaction_details: {
          order_id: newOrder._id.toString(),
          gross_amount: totalAmount,
        },
        customer_details: {
          first_name: customerName,
          email: email,
          phone: addressInfo.phone,
        },
        item_details: cartItems.map((item) => ({
          id: item.productId,
          price: Math.round(item.price), // Pastikan integer
          quantity: item.quantity,
          name: `${item.title} - ${item.variantName}`,
        })),
        callbacks: {
          finish: process.env.FRONTEND_URL + '/shop/payment-success',
          error: process.env.FRONTEND_URL + '/shop/checkout',
          pending: process.env.FRONTEND_URL + '/shop/payment-pending',
        },
      };

      console.log('Midtrans Parameter:', JSON.stringify(parameter, null, 2)); // Debug log

      const transaction = await snap.createTransaction(parameter);
      console.log(transaction.token);

      res.status(201).json({
        success: true,
        token: transaction.token,
        orderId: newOrder._id,
        message: 'Pesanan berhasil dibuat',
      });
    } catch (midtransError) {
      console.error('Midtrans Error:', midtransError);

      // Hapus order yang sudah dibuat jika Midtrans gagal
      await Order.findByIdAndDelete(newOrder._id);

      return res.status(500).json({
        success: false,
        message: 'Gagal membuat pembayaran Midtrans: ' + midtransError.message,
      });
    }
  } catch (error) {
    console.error('CreateOrder General Error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server: ' + error.message,
    });
  }
};

// Improved handleNotification with better error handling
const handleNotification = async (req, res) => {
  try {
    console.log('Midtrans Notification:', req.body); // Debug log

    const notificationJson = await snap.transaction.notification(req.body);
    const orderId = notificationJson.order_id;
    const transactionStatus = notificationJson.transaction_status;
    const fraudStatus = notificationJson.fraud_status;

    console.log(`Processing notification for order ${orderId}: ${transactionStatus}`);

    let order = await Order.findById(orderId);
    if (!order) {
      console.error(`Order ${orderId} not found`);
      return res.status(404).send('Order not found.');
    }

    // Update order based on transaction status
    if (transactionStatus == 'capture' || transactionStatus == 'settlement') {
      if (fraudStatus == 'accept') {
        order.paymentStatus = 'paid';
        order.orderStatus = 'confirmed';

        // Kurangi stok produk
        for (const item of order.cartItems) {
          try {
            const product = await Product.findById(item.productId);
            if (product) {
              const variant = product.variants.find((v) => v.name === item.variantName);
              if (variant && variant.totalStock >= item.quantity) {
                variant.totalStock -= item.quantity;
                await product.save();
                console.log(
                  `Stock reduced for ${product.title} - ${variant.name}: ${item.quantity}`
                );
              }
            }
          } catch (stockError) {
            console.error(`Error reducing stock for item ${item.productId}:`, stockError);
          }
        }

        // Hapus keranjang
        try {
          await Cart.findByIdAndDelete(order.cartId);
          console.log(`Cart ${order.cartId} deleted`);
        } catch (cartError) {
          console.error(`Error deleting cart ${order.cartId}:`, cartError);
        }
      }
    } else if (
      transactionStatus == 'cancel' ||
      transactionStatus == 'deny' ||
      transactionStatus == 'expire'
    ) {
      order.paymentStatus = 'failed';
      order.orderStatus = 'cancelled';
    } else if (transactionStatus == 'pending') {
      order.paymentStatus = 'pending';
      order.orderStatus = 'pending';
    }

    order.orderUpdateDate = new Date();
    await order.save();

    console.log(`Order ${orderId} updated: ${order.paymentStatus}`);
    res.status(200).send('Notification processed successfully.');
  } catch (error) {
    console.error('HandleNotification Error:', error);
    res.status(500).send('Error handling notification: ' + error.message);
  }
};

// Rest of the functions remain the same but with better error logging
const getAllOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID diperlukan',
      });
    }

    const orders = await Order.find({ userId }).sort({ orderDate: -1 });

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error('GetAllOrdersByUser Error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server: ' + error.message,
    });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Order ID diperlukan',
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pesanan tidak ditemukan.',
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('GetOrderDetails Error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server: ' + error.message,
    });
  }
};

module.exports = {
  createOrder,
  handleNotification,
  getAllOrdersByUser,
  getOrderDetails,
};
