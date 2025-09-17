// const mongoose = require("mongoose");

// const OrderSchema = new mongoose.Schema({
//   userId: String,
//   cartId: String,
//   cartItems: [
//     {
//       productId: String,
//       title: String,
//       image: String,
//       price: String,
//       quantity: Number,
//     },
//   ],
//   addressInfo: {
//     addressId: String,
//     address: String,
//     city: String,
//     pincode: String,
//     phone: String,
//     notes: String,
//   },
//   orderStatus: String,
//   paymentMethod: String,
//   paymentStatus: String,
//   totalAmount: Number,
//   orderDate: Date,
//   orderUpdateDate: Date,
//   paymentId: String,
//   payerId: String,
// });

// module.exports = mongoose.model("Order", OrderSchema);


// File: models/Order.js

const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  userId: String,
  customerName: String, // 🔹 MENAMBAHKAN NAMA PELANGGAN
  cartId: String,
  cartItems: [
    {
      productId: String,
      title: String,
      image: String,
      price: Number, // 🔹 Diubah ke Number
      quantity: Number,
    },
  ],
  addressInfo: {
    addressId: String,
    address: String,
    city: String,
    kodePos: String, // 🔹 Diubah dari pincode
    phone: String,
    notes: String,
  },
  orderStatus: String, // Contoh: 'pending', 'confirmed', 'shipping', 'delivered', 'rejected'
  paymentMethod: String,
  paymentStatus: String,
  totalAmount: Number, // 🔹 Pastikan ini Number
  orderDate: { type: Date, default: Date.now },
  orderUpdateDate: Date,
  paymentId: String,
  payerId: String,
});

module.exports = mongoose.model("Order", OrderSchema);