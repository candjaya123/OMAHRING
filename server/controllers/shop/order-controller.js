// controllers/shop/order-controller.js
const crypto = require('crypto');
const { getMidtransSnap } = require('../../helpers/midtrans');
const { getStoreSettings } = require('../../helpers/store-settings-helper');
const supabase = require('../../config/supabase');

// ==== util helpers ====
const toInt = (n) => {
  const x = Math.round(Number(n || 0));
  if (!Number.isFinite(x) || x < 0) throw new Error('Invalid amount');
  return x;
};

const verifyMidtransSignature = async ({ order_id, status_code, gross_amount, signature_key }) => {
  // Ambil server key dari DB (Option 1) atau ENV (Fallback)
  const settings = await getStoreSettings();
  const serverKey = settings.midtransServerKey || process.env.MIDTRANS_SERVER_KEY || '';
  
  const raw = `${order_id}${status_code}${gross_amount}${serverKey}`;
  const expected = crypto.createHash('sha512').update(raw).digest('hex');
  return expected === signature_key;
};

// ==== CREATE ORDER ====
const createOrder = async (req, res) => {
  try {
    const { userId, cartItems, addressInfo, totalAmount, cartId, customerName, email, shippingCost, paymentCategory } = req.body;

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
    const { data: existing } = await supabase
      .from('orders')
      .select('id')
      .eq('cartId', cartId)
      .in('paymentStatus', ['unpaid', 'pending'])
      .maybeSingle();

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Checkout untuk cart ini sudah berjalan. Selesaikan pembayaran atau batalkan dahulu.',
        orderId: existing.id,
      });
    }

    // 3) Cari/siapkan user (registered/guest by email)
    let user;
    if (String(userId).startsWith('guest-')) {
      const { data: foundUser } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
      if (foundUser) {
        if (foundUser.password !== null && foundUser.password !== undefined) {
          return res.status(400).json({ success: false, message: 'Email sudah terdaftar. Silakan login terlebih dahulu.' });
        }
        user = foundUser;
      } else {
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert({ userName: customerName, email, role: 'user' })
          .select()
          .single();

        if (userError) throw userError;
        user = newUser;
      }
    } else {
      const { data: foundUser } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
      if (!foundUser) return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
      user = foundUser;
    }

    const normalizedItems = [];
    let productTotal = 0;
    for (const item of cartItems) {
      if (!item.productId || !item.variantName || !item.quantity)
        return res.status(400).json({ success: false, message: 'Data produk tidak lengkap.' });

      const { data: product } = await supabase.from('products').select('*').eq('_id', item.productId).maybeSingle();
      if (!product) return res.status(404).json({ success: false, message: `Produk ${item.title} tidak ditemukan.` });

      let variant = product.variants?.find((v) => v.name === item.variantName);
      if (!variant) return res.status(404).json({ success: false, message: `Varian ${item.variantName} tidak ditemukan.` });

      const unitPrice = toInt(variant.salePrice || variant.price);
      productTotal += unitPrice * toInt(item.quantity);

      normalizedItems.push({
        productId: item.productId,
        title: product.title,
        variantName: variant.name,
        image: item.image,
        price: unitPrice,
        quantity: toInt(item.quantity),
      });
    }

    // b) Ambil Biaya Layanan Toko Tambahan dari DB
    const settings = await getStoreSettings();
    const storeServiceFee = parseInt(settings.storeServiceFee) || 0;

    // c) Hitung Biaya Layanan Midtrans
    const baseTotal = productTotal + (shippingCost ? toInt(shippingCost) : 0) + storeServiceFee;
    let paymentServiceFee = 0;

    if (paymentCategory === "bank_transfer") {
      paymentServiceFee = 4000;
    } else if (paymentCategory === "minimarket") {
      paymentServiceFee = 5000;
    } else if (paymentCategory === "qris") {
      paymentServiceFee = Math.round(baseTotal * 0.007);
    } else if (paymentCategory === "ewallet") {
      paymentServiceFee = Math.round(baseTotal * 0.02);
    } else if (paymentCategory === "credit_card") {
      paymentServiceFee = Math.round(baseTotal * 0.029) + 2000;
    }

    const expectedTotal = baseTotal + paymentServiceFee;

    // 5) Cocokkan total dari FE
    if (toInt(totalAmount) !== expectedTotal) {
      return res.status(400).json({
        success: false,
        message: `Total amount tidak sesuai. FE=${toInt(totalAmount)}, Server=${expectedTotal}`,
      });
    }

    // 6) Buat Order
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
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
        shippingCost: shippingCost || 0,
        orderStatus: 'pending',
        paymentMethod: 'midtrans',
        paymentStatus: 'unpaid',
        totalAmount: expectedTotal,
        orderDate: new Date(),
        paymentCategory: paymentCategory || 'midtrans',
        storeServiceFee: storeServiceFee || 0,
        paymentServiceFee: paymentServiceFee || 0,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // 7) Parameter Snap
    const expiryMinutes = 120;
    const itemDetails = normalizedItems.map((it) => ({
      id: it.productId,
      price: it.price,
      quantity: it.quantity,
      name: `${it.title} - ${it.variantName}`.substring(0, 50),
    }));

    if (shippingCost > 0) itemDetails.push({ id: 'SHIPPING', price: toInt(shippingCost), quantity: 1, name: 'Ongkos Kirim' });
    if (storeServiceFee > 0) itemDetails.push({ id: 'STORE_FEE', price: storeServiceFee, quantity: 1, name: 'Biaya Layanan Toko' });
    if (paymentServiceFee > 0) itemDetails.push({ id: 'PAYMENT_FEE', price: paymentServiceFee, quantity: 1, name: 'Biaya Adm Pembayaran' });

    let activePaymentMethods = [];
    if (paymentCategory === "bank_transfer") activePaymentMethods = ['bank_transfer', 'echannel'];
    if (paymentCategory === "minimarket") activePaymentMethods = ['indomaret', 'alfamart'];
    if (paymentCategory === "qris") activePaymentMethods = ['qris', 'other_qris'];
    if (paymentCategory === "ewallet") activePaymentMethods = ['gopay', 'shopeepay'];
    if (paymentCategory === "credit_card") activePaymentMethods = ['credit_card'];

    const parameter = {
      transaction_details: { order_id: newOrder.id, gross_amount: expectedTotal },
      item_details: itemDetails,
      customer_details: { first_name: customerName, email: email, phone: addressInfo.phone },
      enabled_payments: activePaymentMethods.length > 0 ? activePaymentMethods : undefined,
      credit_card: { secure: true },
      expiry: { unit: 'minutes', duration: expiryMinutes },
    };

    // Initialize Snap dynamically
    const snap = await getMidtransSnap();
    const transaction = await snap.createTransaction(parameter);
    const tokenExpiry = new Date(Date.now() + expiryMinutes * 60 * 1000);

    await supabase
      .from('orders')
      .update({
        midtrans: { orderId: newOrder.id, snapToken: transaction.token, tokenExpiry, redirectUrl: transaction.redirect_url }
      })
      .eq('id', newOrder.id);

    try {
      await supabase.from('carts').delete().eq('id', cartId);
    } catch (e) {
      console.error(`Delete cart error:`, e.message);
    }

    return res.status(201).json({
      success: true,
      token: transaction.token,
      redirectUrl: transaction.redirect_url,
      orderId: newOrder.id,
      userId: user.id,
      tokenExpiry: tokenExpiry.toISOString(),
      message: 'Pesanan berhasil dibuat',
    });
  } catch (error) {
    console.error('CreateOrder Error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server: ' + error.message });
  }
};

// ==== REGENERATE SNAP TOKEN ====
const regenerateSnapToken = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId) return res.status(400).json({ success: false, message: 'Order ID diperlukan' });

    const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle();
    if (!order) return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });

    const expiryMinutes = 120;
    const parameter = {
      transaction_details: { order_id: order.id, gross_amount: order.totalAmount },
      customer_details: { first_name: order.customerName, email: order.email, phone: order.addressInfo?.phone },
      expiry: { unit: 'minutes', duration: expiryMinutes },
    };

    const snap = await getMidtransSnap();
    const transaction = await snap.createTransaction(parameter);
    const newTokenExpiry = new Date(Date.now() + expiryMinutes * 60 * 1000);

    await supabase
      .from('orders')
      .update({
        midtrans: { ...order.midtrans, snapToken: transaction.token, tokenExpiry: newTokenExpiry, redirectUrl: transaction.redirect_url }
      })
      .eq('id', order.id);

    return res.status(200).json({
      success: true,
      token: transaction.token,
      redirectUrl: transaction.redirect_url,
      orderId: order.id,
    });
  } catch (error) {
    console.error('RegenerateSnapToken Error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// ==== HANDLE NOTIFICATION (webhook) ====
const handleNotification = async (req, res) => {
  try {
    const body = req.body;
    const snap = await getMidtransSnap();
    const notificationJson = await snap.transaction.notification(body);

    const { order_id, transaction_status, fraud_status, payment_type, status_code, gross_amount, signature_key, transaction_id } = notificationJson;

    const isValid = await verifyMidtransSignature({ order_id, status_code, gross_amount, signature_key });
    if (!isValid) return res.status(403).send('Invalid signature');

    const { data: order } = await supabase.from('orders').select('*').eq('id', order_id).maybeSingle();
    if (!order) return res.status(404).send('Order not found');

    order.midtrans = {
      ...(order.midtrans || {}),
      transactionId: transaction_id,
      transactionStatus: transaction_status,
      fraudStatus: fraud_status,
      paymentType: payment_type,
      statusCode: status_code,
      grossAmount: gross_amount,
      signatureKey: signature_key,
      rawNotification: notificationJson,
    };

    if (transaction_status === 'capture' || transaction_status === 'settlement') {
      if (fraud_status === 'challenge') {
        order.paymentStatus = 'pending';
        order.orderStatus = 'challenge';
      } else {
        await fulfillPaidOrder(order);
      }
    } else if (['cancel', 'deny', 'expire'].includes(transaction_status)) {
      order.paymentStatus = 'failed';
      order.orderStatus = transaction_status === 'expire' ? 'expired' : 'cancelled';
    } else {
      order.paymentStatus = 'pending';
      order.orderStatus = 'pending';
    }

    await supabase
      .from('orders')
      .update({
        midtrans: order.midtrans,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        orderUpdateDate: new Date()
      })
      .eq('id', order.id);

    return res.status(200).send('OK');
  } catch (error) {
    console.error('HandleNotification Error:', error);
    return res.status(500).send('Error');
  }
};

async function fulfillPaidOrder(orderDoc) {
  if (orderDoc.paymentStatus === 'paid' || orderDoc.orderStatus === 'confirmed') return;

  for (const item of orderDoc.cartItems) {
    const { data: product } = await supabase.from('products').select('*').eq('id', item.productId).single();
    if (product) {
      const updatedVariants = product.variants.map(v => {
        if (v.name === item.variantName && v.totalStock >= item.quantity) {
          return { ...v, totalStock: v.totalStock - item.quantity };
        }
        return v;
      });
      await supabase.from('products').update({ variants: updatedVariants }).eq('id', item.productId);
    }
  }

  orderDoc.paymentStatus = 'paid';
  orderDoc.orderStatus = 'confirmed';
}

const getAllOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { data: orders } = await supabase.from('orders').select('*').eq('user_id', userId).order('orderDate', { ascending: false });
    return res.status(200).json({ success: true, data: orders.map(o => ({ ...o, _id: o.id })) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error' });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: order } = await supabase.from('orders').select('*').eq('id', id).maybeSingle();
    if (!order) return res.status(404).json({ success: false, message: 'Not found' });
    return res.status(200).json({ success: true, data: { ...order, _id: order.id } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error' });
  }
};

module.exports = { createOrder, handleNotification, getAllOrdersByUser, getOrderDetails, regenerateSnapToken };
