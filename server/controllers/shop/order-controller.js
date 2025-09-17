const snap = require("../../helpers/midtrans");
const Order = require("../../models/Order");
const Cart = require("../../models/Cart");
const Product = require("../../models/Product");
const User = require("../../models/User");
const { v4: uuidv4 } = require("uuid");

const createOrder = async (req, res) => {
  try {
    const { userId, cartItems, addressInfo, totalAmount, cartId, customerName, email } = req.body;

    // 1. Validasi input
    if (!userId || !cartItems || !addressInfo || !totalAmount || !cartId || !customerName || !email) {
      return res.status(400).json({ success: false, message: "Data yang dikirim tidak lengkap." });
    }

    // 2. Validasi stok produk
    for (const item of cartItems) {
      const product = await Product.findById(item.productId);
      const variant = product.variants.find((v) => v.name === item.variantName);
      if (!variant || variant.totalStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Stok untuk ${item.title} (${item.variantName}) tidak mencukupi.`,
        });
      }
    }

    let finalUserId;
    let user;

    // 3. Logika untuk membuat atau memperbarui pengguna
    if (userId && !userId.startsWith("guest-")) {
      user = await User.findById(userId);
    } else {
      user = await User.findOne({ email });
      if (!user) {
        user = new User({
          userName: customerName,
          email: email,
          role: "user",
        });
      }
    }
    
    // 4. 🔹 PERBAIKAN KUNCI DI SINI 🔹
    // Tambahkan alamat baru ke profil pengguna dengan semua field yang dibutuhkan
    const addressExists = user.addresses.some(addr => addr.address === addressInfo.address && addr.phone === addressInfo.phone);
    if (!addressExists) {
        user.addresses.push({
            addressId: `addr-${uuidv4()}`, // Buat ID unik
            name: customerName,             // Sertakan nama
            email: email,                   // Sertakan email
            address: addressInfo.address,
            city: addressInfo.city,
            kodePos: addressInfo.kodePos,
            phone: addressInfo.phone,
        });
    }
    
    await user.save(); // Simpan pengguna (baru atau yang diperbarui)
    finalUserId = user._id; // Gunakan ID dari database untuk pesanan

    // 5. Membuat pesanan baru
    const newOrder = new Order({
      userId: finalUserId,
      customerName,
      cartId,
      cartItems,
      addressInfo,
      orderStatus: "pending",
      paymentMethod: "midtrans",
      paymentStatus: "unpaid",
      totalAmount,
    });
    await newOrder.save();

    // 6. Membuat transaksi Midtrans
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
        price: item.price,
        quantity: item.quantity,
        name: `${item.title} - ${item.variantName}`,
      })),
    };

    const transaction = await snap.createTransaction(parameter);

    res.status(201).json({
      success: true,
      token: transaction.token,
      orderId: newOrder._id,
    });

  } catch (e) {
    console.error("CreateOrder Error:", e);
    res.status(500).json({ success: false, message: "Gagal membuat pembayaran Midtrans" });
  }
};

// =================================================================
// MENANGANI NOTIFIKASI DARI MIDTRANS (WEBHOOK)
// =================================================================
const handleNotification = async (req, res) => {
  try {
    const notificationJson = await snap.transaction.notification(req.body);
    const orderId = notificationJson.order_id;
    const transactionStatus = notificationJson.transaction_status;
    const fraudStatus = notificationJson.fraud_status;

    let order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).send("Order not found.");
    }

    if (transactionStatus == 'capture' || transactionStatus == 'settlement') {
        if (fraudStatus == 'accept') {
            order.paymentStatus = "paid";
            order.orderStatus = "confirmed";

            // Kurangi stok produk dari varian yang benar
            for (const item of order.cartItems) {
                const product = await Product.findById(item.productId);
                if (product) {
                    const variant = product.variants.find((v) => v.name === item.variantName);
                    if (variant) {
                        variant.totalStock -= item.quantity;
                        await product.save();
                    }
                }
            }
            // Hapus keranjang setelah pembayaran berhasil
            await Cart.findByIdAndDelete(order.cartId);
        }
    } else if (transactionStatus == 'cancel' || transactionStatus == 'deny' || transactionStatus == 'expire') {
        order.paymentStatus = "failed";
        order.orderStatus = "cancelled";
    }

    order.orderUpdateDate = new Date();
    await order.save();
    res.status(200).send("Notification processed successfully.");

  } catch (e) {
    console.error("HandleNotification Error:", e.message);
    res.status(500).send("Error handling notification");
  }
};

// =================================================================
// MENGAMBIL SEMUA PESANAN MILIK PENGGUNA
// =================================================================
const getAllOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({ userId }).sort({ orderDate: -1 }); // Urutkan dari terbaru

    if (!orders.length) {
      return res.status(200).json({ success: true, data: [] }); // Kembalikan array kosong jika tidak ada
    }

    res.status(200).json({ success: true, data: orders });
  } catch (e) {
    res.status(500).json({ success: false, message: "Terjadi kesalahan pada server." });
  }
};

// =================================================================
// MENGAMBIL DETAIL SATU PESANAN
// =================================================================
const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Pesanan tidak ditemukan." });
    }

    res.status(200).json({ success: true, data: order });
  } catch (e) {
    res.status(500).json({ success: false, message: "Terjadi kesalahan pada server." });
  }
};

module.exports = {
  createOrder,
  handleNotification,
  getAllOrdersByUser,
  getOrderDetails,
};
