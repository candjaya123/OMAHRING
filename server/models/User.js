// const mongoose = require("mongoose");

// const UserSchema = new mongoose.Schema({
//   userName: {
//     type: String,
//     required: true,
//     unique: true,
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//   },
//   password: {
//     type: String,
//     required: true,
//   },
//   role: {
//     type: String,
//     default: "user",
//   },
// });

// const User = mongoose.model("User", UserSchema);
// module.exports = User;

// File: models/User.js

const mongoose = require("mongoose");

// 🔹 Skema untuk alamat, bisa digunakan kembali
const AddressSchema = new mongoose.Schema({
  addressId: { type: String, required: true }, // Added for unique address identification
  address: { type: String, required: true },
  city: { type: String, required: true },
  kodePos: { type: String, required: true },
  phone: { type: String, required: true },
  notes: { type: String, default: "" },
  name: { type: String, required: true }, // Added to store customer name per address
  email: { type: String, required: true }, // Added to store customer email per address
});

const UserSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: false, // 🔹 Made optional for guest users
    },
    role: {
      type: String,
      enum: ["user", "member", "admin", "manager"],
      default: "user",
    },
    addresses: [AddressSchema], // 🔹 Array alamat untuk menyimpan detail pengiriman
    performance: {
      totalOrders: {
        type: Number,
        default: 0,
      },
      totalSpend: {
        type: Number,
        default: 0,
      },
    },
  },
  { timestamps: true } // Otomatis menambahkan createdAt dan updatedAt
);

const User = mongoose.model("User", UserSchema);
module.exports = User;