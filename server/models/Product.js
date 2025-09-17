// const mongoose = require("mongoose");

// const ProductSchema = new mongoose.Schema(
//   {
//     image: String,
//     title: String,
//     description: String,
//     category: String,
//     brand: String,
//     price: Number,
//     salePrice: Number,
//     totalStock: Number,
//     averageReview: Number,
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Product", ProductSchema);

// File: models/Product.js

const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    image: String,
    title: String,
    description: String,
    category: String,
    brand: String, // Opsional, bisa custom
    variants: [ // 🔹 Menambahkan varian produk
      {
        name: String, // Contoh: "Merah - L", "Biru - M"
        price: Number,
        salePrice: Number,
        totalStock: Number,
      },
    ],
    averageReview: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);