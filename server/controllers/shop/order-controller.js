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

    // 2) Cegah duplikat checkout utk cart yang sama (pending/unpaid)
    const existing = await Order.findOne({
      cartId: new mongoose.Types.ObjectId(cartId),
      paymentStatus: { $in: ['unpaid', 'pending'] },
    }).lean();
    if (existing) {
      return res.status(409).json({
        success: false,
        message:
          'Checkout untuk cart ini sudah berjalan. Selesaikan pembayaran atau batalkan dahulu.',
        orderId: existing._id,
      });
    }

    // 3) Cari/siapkan user (registered/guest by email)
    let user;
    if (String(userId).startsWith('guest-')) {
      user = await User.findOne({ email });
      if (!user) {
        user = new User({
          username: customerName, // fallback ke field yang kamu pakai sekarang
          userName: customerName, // jika schema lama masih pakai userName
          email,
          role: 'user',
        });
        await user.save();
      }
    } else {
      user = await User.findById(userId);
      if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    }

    // 4) Validasi stok & hitung ulang total dari DB (bukan dari FE)
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

      const unitPrice = toInt(variant.salePrice ?? variant.price);
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

    // 5) Cocokkan total dari FE (opsional – kalau FE kirim shippingFee, tambahkan di sini)
    if (toInt(totalAmount) !== expectedTotal) {
      return res.status(400).json({
        success: false,
        message: `Total amount tidak sesuai. FE=${toInt(totalAmount)}, Server=${expectedTotal}`,
      });
    }

    // 6) Buat Order (status pending/unpaid)
    const newOrder = await Order.create({
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
    });

    // 7) Parameter Snap
    const parameter = {
      transaction_details: {
        order_id: newOrder._id.toString(), // unique
        gross_amount: expectedTotal, // integer
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
      enabled_payments: [
        'credit_card',
        'gopay',
        'qris',
        'shopeepay',
        'echannel', // Mandiri bill
        'bank_transfer', // BCA/BNI/BRI/Permata
      ],
      credit_card: { secure: true },
      callbacks: {
        finish: `${process.env.FRONTEND_URL}/shop/payment-success`,
        error: `${process.env.FRONTEND_URL}/shop/checkout`,
        pending: `${process.env.FRONTEND_URL}/shop/payment-pending`,
      },
      expiry: { unit: 'minutes', duration: 120 }, // pembayaran kadaluarsa 2 jam
    };

    const transaction = await snap.createTransaction(parameter);

    // Simpan sebagian info midtrans (opsional, token tidak perlu disimpan)
    await Order.updateOne(
      { _id: newOrder._id },
      {
        $set: {
          'midtrans.orderId': newOrder._id.toString(),
        },
      }
    );

    return res.status(201).json({
      success: true,
      token: transaction.token,
      redirectUrl: transaction.redirect_url,
      orderId: newOrder._id,
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
    // Midtrans kirim JSON ke endpoint ini
    const body = req.body;
    console.log('Midtrans Notification:', body);

    // (Opsional) pakai SDK untuk normalize
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

    // Verifikasi signature (wajib)
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

    // Catat data midtrans terbaru
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
    };

    // Map status
    if (transaction_status === 'capture') {
      if (fraud_status === 'challenge') {
        order.paymentStatus = 'pending';
        order.orderStatus = 'challenge';
      } else {
        // paid
        await fulfillPaidOrder(order);
      }
    } else if (transaction_status === 'settlement') {
      await fulfillPaidOrder(order);
    } else if (['cancel', 'deny', 'expire'].includes(transaction_status)) {
      order.paymentStatus = 'failed';
      order.orderStatus = transaction_status === 'expire' ? 'expired' : 'cancelled';
    } else if (transaction_status === 'pending') {
      order.paymentStatus = 'pending';
      order.orderStatus = 'pending';
    } else {
      // status lain
      order.paymentStatus = 'pending';
      order.orderStatus = 'needs_review';
    }

    order.orderUpdateDate = new Date();
    await order.save();

    console.log(`Order ${order_id} -> ${order.paymentStatus}/${order.orderStatus}`);
    return res.status(200).send('OK');
  } catch (error) {
    console.error('HandleNotification Error:', error);
    return res.status(500).send('Error handling notification: ' + error.message);
  }
};

// ==== helper: fulfill order ketika sudah paid ====
async function fulfillPaidOrder(orderDoc) {
  console.log('=== FULFILL PAID ORDER START ===');
  console.log('Order ID:', orderDoc._id);
  console.log('Initial Payment Status:', orderDoc.paymentStatus);
  console.log('Initial Order Status:', orderDoc.orderStatus);
  console.log('Cart Items:', orderDoc.cartItems);

  // Idempotent: hanya proses jika sebelumnya belum paid/confirmed
  if (orderDoc.paymentStatus === 'paid' || orderDoc.orderStatus === 'confirmed') {
    console.log('Order sudah diproses sebelumnya, keluar dari fungsi.');
    return;
  }

  // Kurangi stok tiap item secara atomik
  for (const item of orderDoc.cartItems) {
    console.log(`\nMemproses item: ${item.title} - ${item.variantName}`);
    console.log(`Target Qty: ${item.quantity}`);

    const res = await Product.updateOne(
      {
        _id: item.productId,
        'variants.name': item.variantName,
        'variants.totalStock': { $gte: item.quantity },
      },
      {
        $inc: { 'variants.$.totalStock': -item.quantity },
      }
    );

    console.log('Update Result:', res);

    if (!res.matchedCount || !res.modifiedCount) {
      console.error(
        `❌ Gagal reduce stock: product=${item.productId}, variant=${item.variantName}, qty=${item.quantity}`
      );
      orderDoc.orderStatus = 'needs_review';
    } else {
      console.log(
        `✅ Berhasil mengurangi stok untuk ${item.variantName} sebanyak ${item.quantity}`
      );
    }
  }

  // Hapus cart setelah paid
  if (orderDoc.cartId) {
    try {
      await Cart.findByIdAndDelete(orderDoc.cartId);
      console.log(`Cart ${orderDoc.cartId} berhasil dihapus`);
    } catch (e) {
      console.error(`Delete cart ${orderDoc.cartId} error:`, e.message);
    }
  }

  orderDoc.paymentStatus = 'paid';

  if (orderDoc.orderStatus !== 'needs_review') {
    orderDoc.orderStatus = 'confirmed';
  }

  console.log('Final Payment Status:', orderDoc.paymentStatus);
  console.log('Final Order Status:', orderDoc.orderStatus);
  console.log('=== FULFILL PAID ORDER END ===\n');
}

// ==== GET ORDERS BY USER ====
const getAllOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID diperlukan' });
    }

    const orders = await Order.find({ userId }).sort({ orderDate: -1 });
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

    const order = await Order.findById(id);
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

async function reduceStockAtomic(orderDoc) {
  for (const item of orderDoc.cartItems) {
    const res = await Product.updateOne(
      {
        _id: item.productId,
        'variants.name': item.variantName, // pakai name dulu
        'variants.totalStock': { $gte: item.quantity }, // ganti ke "variants.stock" jika field kamu pakai itu
      },
      { $inc: { 'variants.$.totalStock': -item.quantity } } // ganti path jika perlu
    );

    if (!res.matchedCount || !res.modifiedCount) {
      console.error('[Stock] gagal reduce', {
        productId: item.productId,
        variantName: item.variantName,
        qty: item.quantity,
        mongo: res,
      });
      // tandai agar bisa direview manual, tapi jangan fail pembayaran
      if (orderDoc.orderStatus !== 'needs_review') orderDoc.orderStatus = 'needs_review';
    }
  }
}

module.exports = {
  createOrder,
  handleNotification,
  getAllOrdersByUser,
  getOrderDetails,
};
