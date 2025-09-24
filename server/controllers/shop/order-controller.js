// controllers/shop/order-controller.js
const crypto = require('crypto');
const snap = require('../../helpers/midtrans');
const Order = require('../../models/Order');
const Cart = require('../../models/Cart');
const Product = require('../../models/Product');
const User = require('../../models/User');
const mongoose = require('mongoose');

// ==== util helpers ====
const toInt = (n) => {
  const x = Math.round(Number(n || 0));
  if (!Number.isFinite(x) || x < 0) throw new Error('Invalid amount');
  return x;
};

const verifyMidtransSignature = ({ order_id, status_code, gross_amount, signature_key }) => {
  const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
  const raw = `${order_id}${status_code}${gross_amount}${serverKey}`;
  const expected = crypto.createHash('sha512').update(raw).digest('hex');
  return expected === signature_key;
};

// Helper to cleanup expired orders
const cleanupExpiredOrders = async (cartId) => {
  try {
    const expiredTime = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago

    await Order.updateMany(
      {
        cartId: new mongoose.Types.ObjectId(cartId),
        paymentStatus: { $in: ['unpaid', 'pending'] },
        orderDate: { $lt: expiredTime },
      },
      {
        $set: {
          paymentStatus: 'expired',
          orderStatus: 'expired',
          orderUpdateDate: new Date(),
        },
      }
    );
  } catch (error) {
    console.error('Error cleaning up expired orders:', error);
  }
};

// ==== CREATE ORDER ====
const createOrder = async (req, res) => {
  try {
    const { userId, cartItems, addressInfo, totalAmount, cartId, customerName, email } = req.body;

    // 1) Validasi input minimum
    if (!userId) return res.status(400).json({ success: false, message: 'User ID diperlukan.' });
    if (!Array.isArray(cartItems) || cartItems.length === 0)
      return res.status(400).json({ success: false, message: 'Cart items kosong.' });
    if (!addressInfo || !addressInfo.address || !addressInfo.city || !addressInfo.phone)
      return res.status(400).json({ success: false, message: 'Informasi alamat tidak lengkap.' });
    if (!cartId) return res.status(400).json({ success: false, message: 'Cart ID diperlukan.' });
    if (!customerName || !email)
      return res
        .status(400)
        .json({ success: false, message: 'Nama customer dan email diperlukan.' });

    // 2) Cleanup expired orders first
    await cleanupExpiredOrders(cartId);

    // 3) Cek duplikat checkout untuk cart yang sama (pending/unpaid)
    const existing = await Order.findOne({
      cartId: new mongoose.Types.ObjectId(cartId),
      paymentStatus: { $in: ['unpaid', 'pending'] },
    }).lean();

    if (existing) {
      // Instead of error, return the existing order details for continuation
      console.log(`Existing pending order found: ${existing._id}`);

      // Generate new token for existing order
      try {
        const parameter = {
          transaction_details: {
            order_id: existing._id.toString(),
            gross_amount: existing.totalAmount,
          },
          item_details: existing.cartItems.map((it) => ({
            id: it.productId.toString(),
            price: it.price,
            quantity: it.quantity,
            name: `${it.title} - ${it.variantName}`,
          })),
          customer_details: {
            first_name: existing.customerName,
            email: existing.email,
            phone: existing.addressInfo?.phone,
          },
          enabled_payments: [
            'credit_card',
            'gopay',
            'qris',
            'shopeepay',
            'echannel',
            'bank_transfer',
          ],
          credit_card: { secure: true },
          callbacks: {
            finish: `${process.env.FRONTEND_URL}/shop/payment-success`,
            error: `${process.env.FRONTEND_URL}/shop/checkout`,
            pending: `${process.env.FRONTEND_URL}/shop/payment-pending`,
          },
          expiry: { unit: 'minutes', duration: 120 },
        };

        const transaction = await snap.createTransaction(parameter);

        return res.status(200).json({
          success: true,
          token: transaction.token,
          redirectUrl: transaction.redirect_url,
          orderId: existing._id,
          message: 'Melanjutkan checkout yang sudah ada',
        });
      } catch (tokenError) {
        console.error('Error generating token for existing order:', tokenError);
        return res.status(500).json({
          success: false,
          message: 'Gagal membuat token pembayaran untuk pesanan yang ada.',
        });
      }
    }

    // 4) Cari/siapkan user (registered/guest by email)
    let user;
    if (String(userId).startsWith('guest-')) {
      user = await User.findOne({ email });
      if (!user) {
        user = new User({
          username: customerName,
          userName: customerName,
          email,
          role: 'user',
          isGuest: true, // Optional flag to identify guest users
        });
        await user.save();
      }
    } else {
      user = await User.findById(userId);
      if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    }

    // 5) Validasi stok & hitung ulang total dari DB
    const normalizedItems = [];
    let expectedTotal = 0;

    for (const item of cartItems) {
      if (!item.productId || !item.variantName || !item.quantity)
        return res.status(400).json({ success: false, message: 'Item tidak lengkap.' });

      const product = await Product.findById(item.productId).lean();
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Produk ${item.productId} tidak ditemukan.`,
        });
      }

      const variant = (product.variants || []).find((v) => v.name === item.variantName);
      if (!variant) {
        return res.status(400).json({
          success: false,
          message: `Varian ${item.variantName} tidak ditemukan untuk ${product.title}.`,
        });
      }

      if (variant.totalStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Stok kurang untuk ${product.title} (${variant.name}). Tersisa: ${variant.totalStock}`,
        });
      }

      const unitPrice = toInt(variant.salePrice || variant.price);
      expectedTotal += unitPrice * toInt(item.quantity);

      normalizedItems.push({
        productId: product._id,
        title: product.title,
        image:
          item.image ||
          (Array.isArray(product.images)
            ? product.images.find((i) => i.isPrimary)?.url || product.images[0]?.url
            : undefined),
        price: unitPrice,
        quantity: toInt(item.quantity),
        variantName: variant.name,
      });
    }

    // 6) Cocokkan total dari FE
    if (toInt(totalAmount) !== expectedTotal) {
      return res.status(400).json({
        success: false,
        message: `Total amount tidak sesuai. Frontend: ${toInt(
          totalAmount
        )}, Server: ${expectedTotal}`,
      });
    }

    // 7) Buat Order dengan session untuk atomicity
    const session = await mongoose.startSession();
    let newOrder;

    try {
      await session.withTransaction(async () => {
        // Create order
        newOrder = await Order.create(
          [
            {
              userId: user._id,
              customerName,
              email,
              cartId,
              cartItems: normalizedItems,
              addressInfo: {
                address: addressInfo.address,
                city: addressInfo.city,
                pincode: addressInfo.pincode || addressInfo.kodePos || '',
                phone: addressInfo.phone,
                notes: addressInfo.notes || '',
              },
              orderStatus: 'pending',
              paymentMethod: 'midtrans',
              paymentStatus: 'unpaid',
              totalAmount: expectedTotal,
              orderDate: new Date(),
            },
          ],
          { session }
        );

        // Soft reserve stock (optional - can be done on payment success instead)
        for (const item of normalizedItems) {
          await Product.updateOne(
            {
              _id: item.productId,
              'variants.name': item.variantName,
              'variants.totalStock': { $gte: item.quantity },
            },
            {
              $inc: { 'variants.$.reservedStock': item.quantity },
            },
            { session }
          );
        }
      });
    } catch (transactionError) {
      await session.abortTransaction();
      throw transactionError;
    } finally {
      await session.endSession();
    }

    // 8) Parameter Snap
    const parameter = {
      transaction_details: {
        order_id: newOrder[0]._id.toString(),
        gross_amount: expectedTotal,
      },
      item_details: normalizedItems.map((it) => ({
        id: it.productId.toString(),
        price: it.price,
        quantity: it.quantity,
        name: `${it.title} - ${it.variantName}`,
      })),
      customer_details: {
        first_name: customerName,
        email: email,
        phone: addressInfo.phone,
      },
      enabled_payments: ['credit_card', 'gopay', 'qris', 'shopeepay', 'echannel', 'bank_transfer'],
      credit_card: { secure: true },
      callbacks: {
        finish: `${process.env.FRONTEND_URL}/shop/payment-success`,
        error: `${process.env.FRONTEND_URL}/shop/checkout`,
        pending: `${process.env.FRONTEND_URL}/shop/payment-pending`,
      },
      expiry: { unit: 'minutes', duration: 120 },
    };

    const transaction = await snap.createTransaction(parameter);

    // Update order with midtrans info
    await Order.updateOne(
      { _id: newOrder[0]._id },
      {
        $set: {
          'midtrans.orderId': newOrder[0]._id.toString(),
          'midtrans.transactionToken': transaction.token, // Store token for reference
        },
      }
    );

    // DON'T delete cart here - delete only after successful payment

    return res.status(201).json({
      success: true,
      token: transaction.token,
      redirectUrl: transaction.redirect_url,
      orderId: newOrder[0]._id,
      message: 'Pesanan berhasil dibuat',
    });
  } catch (error) {
    console.error('CreateOrder Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server: ' + error.message,
    });
  }
};

// ==== HANDLE NOTIFICATION (webhook) ====
const handleNotification = async (req, res) => {
  try {
    const body = req.body;
    const notificationJson = await snap.transaction.notification(body);

    const {
      order_id,
      transaction_status,
      fraud_status,
      payment_type,
      status_code,
      gross_amount,
      signature_key,
      transaction_id,
    } = notificationJson;

    // Verify signature
    const isValid = verifyMidtransSignature({
      order_id,
      status_code,
      gross_amount,
      signature_key,
    });
    if (!isValid) {
      console.error('Invalid Midtrans signature for order:', order_id);
      return res.status(403).send('Invalid signature');
    }

    const order = await Order.findById(order_id);
    if (!order) {
      console.error(`Order ${order_id} not found`);
      return res.status(404).send('Order not found');
    }

    // Record midtrans data
    order.midtrans = {
      ...(order.midtrans || {}),
      orderId: order_id,
      transactionId: transaction_id,
      transactionStatus: transaction_status,
      fraudStatus: fraud_status,
      paymentType: payment_type,
      statusCode: status_code,
      grossAmount: gross_amount,
      signatureKey: signature_key,
      rawNotification: notificationJson,
      lastUpdated: new Date(),
    };

    // Handle status mapping
    if (transaction_status === 'capture') {
      if (fraud_status === 'challenge') {
        order.paymentStatus = 'pending';
        order.orderStatus = 'challenge';
      } else {
        await fulfillPaidOrder(order);
      }
    } else if (transaction_status === 'settlement') {
      await fulfillPaidOrder(order);
    } else if (['cancel', 'deny', 'expire'].includes(transaction_status)) {
      await handleFailedOrder(order, transaction_status);
    } else if (transaction_status === 'pending') {
      order.paymentStatus = 'pending';
      order.orderStatus = 'pending';
    } else {
      order.paymentStatus = 'pending';
      order.orderStatus = 'needs_review';
    }

    order.orderUpdateDate = new Date();
    await order.save();

    return res.status(200).send('OK');
  } catch (error) {
    console.error('HandleNotification Error:', error);
    return res.status(500).send('Error handling notification: ' + error.message);
  }
};

// Helper: handle failed/cancelled orders
async function handleFailedOrder(orderDoc, transactionStatus) {
  orderDoc.paymentStatus = 'failed';
  orderDoc.orderStatus = transactionStatus === 'expire' ? 'expired' : 'cancelled';

  // Release reserved stock
  for (const item of orderDoc.cartItems) {
    try {
      await Product.updateOne(
        {
          _id: item.productId,
          'variants.name': item.variantName,
        },
        {
          $inc: { 'variants.$.reservedStock': -item.quantity },
        }
      );
    } catch (error) {
      console.error(`Error releasing reserved stock for ${item.productId}:`, error);
    }
  }
}

// Helper: fulfill order when paid
async function fulfillPaidOrder(orderDoc) {
  if (orderDoc.paymentStatus === 'paid' || orderDoc.orderStatus === 'confirmed') {
    console.log('Order already processed, skipping.');
    return;
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      // Move reserved stock to actual stock reduction
      for (const item of orderDoc.cartItems) {
        const updateResult = await Product.updateOne(
          {
            _id: item.productId,
            'variants.name': item.variantName,
            $expr: {
              $gte: [
                { $add: ['$variants.$.totalStock', '$variants.$.reservedStock'] },
                item.quantity,
              ],
            },
          },
          {
            $inc: {
              'variants.$.totalStock': -item.quantity,
              'variants.$.reservedStock': -item.quantity,
            },
          },
          { session }
        );

        if (!updateResult.matchedCount || !updateResult.modifiedCount) {
          throw new Error(
            `Failed to update stock for product ${item.productId}, variant ${item.variantName}`
          );
        }

        console.log(`✅ Stock reduced for ${item.variantName}: -${item.quantity}`);
      }

      // Delete cart after successful payment
      if (orderDoc.cartId) {
        await Cart.findByIdAndDelete(orderDoc.cartId, { session });
        console.log(`Cart ${orderDoc.cartId} deleted`);
      }

      // Update order status
      orderDoc.paymentStatus = 'paid';
      orderDoc.orderStatus = 'confirmed';
      await orderDoc.save({ session });
    });
  } catch (error) {
    console.error('Error in fulfillPaidOrder:', error);
    orderDoc.orderStatus = 'needs_review';
    orderDoc.notes = (orderDoc.notes || '') + ` | Error: ${error.message}`;
    await orderDoc.save();
  } finally {
    await session.endSession();
  }
}

// ==== GET ORDERS BY USER ====
const getAllOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID diperlukan' });
    }

    const orders = await Order.find({ userId })
      .sort({ orderDate: -1 })
      .limit(50) // Limit for performance
      .lean();

    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error('GetAllOrdersByUser Error:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Terjadi kesalahan pada server: ' + error.message });
  }
};

// ==== GET ORDER DETAILS ====
const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: 'Order ID diperlukan' });

    const order = await Order.findById(id).lean();
    if (!order)
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });

    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error('GetOrderDetails Error:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Terjadi kesalahan pada server: ' + error.message });
  }
};

// ==== REGENERATE SNAP TOKEN ====
const regenerateSnapToken = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID diperlukan' });
    }

    const order = await Order.findById(orderId).lean();
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    }

    // Only allow regeneration for unpaid/pending orders
    if (!['unpaid', 'pending'].includes(order.paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: `Order tidak dapat diproses ulang. Status: ${order.paymentStatus}`,
      });
    }

    // Check if order is not too old (prevent token generation for very old orders)
    const orderAge = Date.now() - new Date(order.orderDate).getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    if (orderAge > maxAge) {
      await Order.updateOne(
        { _id: orderId },
        {
          $set: {
            paymentStatus: 'expired',
            orderStatus: 'expired',
            orderUpdateDate: new Date(),
          },
        }
      );

      return res.status(400).json({
        success: false,
        message: 'Pesanan sudah kadaluarsa. Silakan buat pesanan baru.',
      });
    }

    const parameter = {
      transaction_details: {
        order_id: order._id.toString(),
        gross_amount: order.totalAmount,
      },
      item_details: order.cartItems.map((it) => ({
        id: it.productId.toString(),
        price: it.price,
        quantity: it.quantity,
        name: `${it.title} - ${it.variantName}`,
      })),
      customer_details: {
        first_name: order.customerName,
        email: order.email,
        phone: order.addressInfo?.phone,
      },
      enabled_payments: ['credit_card', 'gopay', 'qris', 'shopeepay', 'echannel', 'bank_transfer'],
      credit_card: { secure: true },
      callbacks: {
        finish: `${process.env.FRONTEND_URL}/shop/payment-success`,
        error: `${process.env.FRONTEND_URL}/shop/checkout`,
        pending: `${process.env.FRONTEND_URL}/shop/payment-pending`,
      },
      expiry: { unit: 'minutes', duration: 120 },
    };

    const transaction = await snap.createTransaction(parameter);

    // Update order with new token info
    await Order.updateOne(
      { _id: orderId },
      {
        $set: {
          'midtrans.transactionToken': transaction.token,
          'midtrans.lastTokenGenerated': new Date(),
          orderUpdateDate: new Date(),
        },
      }
    );

    return res.status(200).json({
      success: true,
      token: transaction.token,
      redirectUrl: transaction.redirect_url,
      orderId: order._id,
    });
  } catch (error) {
    console.error('RegenerateSnapToken Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server: ' + error.message,
    });
  }
};

// ==== CANCEL ORDER ====
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID diperlukan' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    }

    // Only allow cancellation for unpaid/pending orders
    if (!['unpaid', 'pending'].includes(order.paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: `Order tidak dapat dibatalkan. Status: ${order.paymentStatus}`,
      });
    }

    // Release reserved stock if any
    for (const item of order.cartItems) {
      try {
        await Product.updateOne(
          {
            _id: item.productId,
            'variants.name': item.variantName,
          },
          {
            $inc: { 'variants.$.reservedStock': -item.quantity },
          }
        );
      } catch (error) {
        console.error(`Error releasing reserved stock for ${item.productId}:`, error);
      }
    }

    // Update order status
    order.paymentStatus = 'cancelled';
    order.orderStatus = 'cancelled';
    order.orderUpdateDate = new Date();
    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Pesanan berhasil dibatalkan',
    });
  } catch (error) {
    console.error('CancelOrder Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server: ' + error.message,
    });
  }
};

module.exports = {
  createOrder,
  handleNotification,
  getAllOrdersByUser,
  getOrderDetails,
  regenerateSnapToken,
  cancelOrder,
};
